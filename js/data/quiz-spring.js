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
  q: `Trong cùng một bean {{OrderService}}, {{handle()}} có {{@Transactional}} và được controller gọi qua proxy. Bên trong {{handle()}} gọi {{this.audit()}}; {{audit()}} cũng khai báo {{@Transactional}}. Transaction nào chạy cho {{audit()}}?
~~~java
@Transactional
public void handle() {
    audit();          // gọi this, không qua bean khác
}

@Transactional
public void audit() { auditRepo.save(...); }
~~~`,
  options: [
    'audit() tạo một transaction MỚI (REQUIRES_NEW) vì nó có {{@Transactional}} riêng',
    'audit() chạy trong transaction của {{handle()}} nếu có, còn {{@Transactional}} của chính audit() bị bỏ qua vì this() không đi qua proxy',
    'audit() chạy không transaction, và {{handle()}} cũng mất transaction vì đã gọi this()',
    'Spring ném BeanCurrentlyInCreationException vì bean tự gọi chính nó'
  ],
  answer: 1,
  explain: `**Đáp án đúng: audit() không tạo transaction riêng; nó chạy trong transaction của handle() (nếu có), còn @Transactional của chính audit() bị bỏ qua.**

### Vì sao đúng
Spring AOP hoạt động bằng **proxy** — một lớp bao quanh bean. Chỉ lời gọi **từ ngoài đi vào qua proxy** mới kích hoạt advice như @Transactional, @Async, @Cacheable. {{this.audit()}} là gọi trực tiếp object gốc, proxy bị bỏ qua hoàn toàn, nên @Transactional trên audit() không có tác dụng. Transaction của handle() là thật (vì handle() được controller gọi qua proxy); audit() chỉ là method thường chạy bên trong transaction đó.

### Vì sao quan trọng
Nếu audit() là **entry point** (được gọi trực tiếp từ controller qua proxy) thì nó vẫn có transaction riêng. Nhưng ở đây nó là method nội bộ: nếu handle() không có transaction, audit() chạy với autocommit (mỗi câu INSERT một transaction riêng, không rollback được). Đây là bẫy "im lặng": không lỗi compile, không log cảnh báo.

### Vì sao các phương án còn lại sai
- **audit() tạo transaction mới (REQUIRES_NEW)**: @Transactional mặc định là REQUIRED, không phải REQUIRES_NEW; và ở đây nó còn bị bỏ qua do self-invocation.
- **handle() cũng mất transaction**: handle() được gọi qua proxy nên vẫn có transaction; chỉ lời gọi this() bên trong mới bỏ qua proxy.
- **BeanCurrentlyInCreationException**: lỗi đó thuộc về vòng phụ thuộc lúc khởi động, không liên quan lời gọi method lúc chạy.

### Cách sửa
Tách audit() sang một bean khác rồi gọi qua bean đó (sạch nhất), hoặc dùng {{AopContext.currentProxy()}} với {{@EnableAspectJAutoProxy(exposeProxy = true)}}, hoặc tự quản lý bằng {{TransactionTemplate}}. Xem qz-spring-029 (cách khắc phục) và qz-spring-053 (thứ tự các bước transaction).

> Senior tip: khi review, tìm các lời gọi this.method() tới method có @Transactional/@Async/@Cacheable trong cùng class — đó là nơi transaction/async "biến mất" mà không ai để ý.`
},
{
  id: 'qz-spring-022',
  topic: 'spring',
  multi: true,
  q: 'Về bean scope trong Spring Framework, phát biểu nào đúng? (Chọn 2)',
  options: [
    'singleton là scope mặc định: mỗi IoC container chỉ tạo một instance và chia sẻ cho mọi lời gọi',
    'request scope tạo một instance mới cho mỗi HTTP session',
    'prototype tạo instance mới mỗi lần có bean yêu cầu (getBean hoặc lúc inject); Spring không giữ tham chiếu để quản lý vòng đời sau khi tạo',
    'application scope tạo instance mới mỗi ServletContext',
    'singleton bean được tạo lại mỗi lần có request HTTP mới'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: singleton là scope mặc định; prototype tạo instance mới mỗi lần được yêu cầu.**

### Vì sao đúng
Scope quyết định bean được tạo bao nhiêu lần và sống ở đâu. Bảng tóm tắt các scope hay dùng:

| Scope | Khoảng sống | Ghi chú |
|---|---|---|
| singleton | một instance cho mỗi IoC container | mặc định, dùng chung |
| prototype | một instance mới mỗi lần getBean/inject | Spring không quản lý vòng đời sau khi tạo |
| request | một instance cho mỗi HTTP request | cần web context |
| session | một instance cho mỗi HTTP session | cần web context |
| application | một instance cho mỗi ServletContext | giống singleton ở mức servlet |

- {{singleton}} là mặc định: cả ứng dụng dùng chung một object.
- {{prototype}}: mỗi lần có bean khác yêu cầu (hoặc bạn gọi getBean), Spring tạo object mới và **không** giữ tham chiếu — nghĩa là {{@PreDestroy}}/destroy-method **không** được gọi cho prototype.

### Vì sao các phương án còn lại sai
- **request scope tạo mới mỗi HTTP session**: nhầm với session scope; request scope là mỗi **request**, session scope mới là mỗi session.
- **application scope tạo mới mỗi ServletContext**: application scope chỉ có **một** instance cho mỗi ServletContext, không "tạo mới mỗi".
- **singleton tạo lại mỗi request**: singleton sống suốt vòng đời context, không tạo lại theo request.

### Bẫy thường gặp
Inject một bean {{prototype}} vào một bean {{singleton}} thì singleton chỉ nhận **đúng một** instance lúc nó được tạo, mọi lời gọi sau dùng lại object đó (xem qz-spring-043). Muốn mỗi lần dùng một instance mới, hãy lấy qua {{ObjectProvider}}/{{ApplicationContext}}/{{@Lookup}}, hoặc dùng {{@Scope(proxyMode = ...)}}.

> Senior tip: prototype "không được quản lý" nghĩa là không có callback hủy — nếu prototype giữ resource (file, connection) thì chính bạn phải đóng, vì Spring không gọi destroy cho nó.`
},
{
  id: 'qz-spring-023',
  topic: 'spring',
  q: 'Ứng dụng Spring Boot 3 dùng spring-boot-starter-data-redis. Bean {{RedisTemplate}} do auto-configuration của Boot tạo. Trường hợp nào auto-configuration này KHÔNG tạo bean đó?',
  options: [
    'Khi classpath có starter, auto-configuration luôn tạo bean kể cả người dùng đã tự khai báo bean {{RedisTemplate}}',
    'Chỉ khi active profile là {{prod}}',
    'Khi không có class {{RedisTemplate}} trên classpath, hoặc người dùng đã tự khai báo một bean {{RedisTemplate}}',
    'Khi thuộc tính {{spring.autoconfigure.enabled=false}} — thuộc tính này bắt buộc phải đặt'
  ],
  answer: 2,
  explain: `**Đáp án đúng: khi thiếu class trên classpath, hoặc người dùng đã tự khai báo bean cùng loại.**

### Vì sao đúng
Auto-configuration là cách Spring Boot đoán giúp bạn các bean thường dùng dựa trên **điều kiện**. Hai điều kiện quan trọng nhất:
- {{@ConditionalOnClass}}: chỉ áp dụng khi một class có trên classpath (ở đây là {{RedisTemplate}}). Thiếu dependency thì auto-config bị bỏ qua hoàn toàn.
- {{@ConditionalOnMissingBean}}: chỉ tạo bean khi context **chưa có** bean cùng loại. Nếu bạn tự khai báo {{@Bean RedisTemplate}}, Boot lùi lại, không tạo bean của nó.

Các điều kiện được **AND** lại: chỉ cần một điều kiện sai thì auto-config không áp dụng.

### Vì sao các phương án còn lại sai
- **Luôn tạo bean khi có starter**: sai, người dùng tự khai báo bean thì {{@ConditionalOnMissingBean}} khiến Boot nhường quyền.
- **Chỉ khi profile prod**: auto-config không phụ thuộc profile; nó dựa vào classpath và bean đã có.
- **spring.autoconfigure.enabled=false**: không có thuộc tính này. Muốn loại trừ một auto-config, dùng {{@SpringBootApplication(exclude = ...)}} hoặc {{spring.autoconfigure.exclude}} trỏ đúng tên class.

### Cách kiểm tra
Chạy ứng dụng với {{--debug}} để mở Condition Evaluation Report: phần "Positive matches" cho biết auto-config nào đã áp dụng, "Negative matches" giải thích vì sao từng auto-config bị loại (ví dụ "Did not find 'some.Class' on the classpath"). Xem qz-spring-042 và qz-spring-050.

> Senior tip: khi tự viết starter, luôn kết hợp @ConditionalOnClass, @ConditionalOnMissingBean và @ConditionalOnProperty để người dùng dễ tắt/tùy biến; đừng để starter "giành" bean với code của họ.`
},
{
  id: 'qz-spring-024',
  topic: 'spring',
  multi: true,
  q: 'Với {{@TransactionalEventListener}}, phát biểu nào đúng về các phase? (Chọn 2)',
  options: [
    'AFTER_COMMIT chạy sau khi transaction commit thành công',
    'BEFORE_COMMIT chạy sau khi transaction đã commit',
    'AFTER_ROLLBACK chạy sau khi transaction rollback',
    'AFTER_COMPLETION chạy trước khi transaction kết thúc',
    'Nếu publish khi không có transaction, listener mặc định vẫn chạy'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: AFTER_COMMIT chạy sau commit thành công; AFTER_ROLLBACK chạy sau rollback.**

### Vì sao đúng
{{@TransactionalEventListener}} cho phép gắn listener vào một giai đoạn cụ thể của transaction:
- {{AFTER_COMMIT}}: chạy sau khi commit **thành công** — đây là phase mặc định, phù hợp gửi email/thông báo "đơn hàng đã đặt".
- {{AFTER_ROLLBACK}}: chạy sau khi rollback — phù hợp ghi log/audit "thao tác đã hủy".
- {{AFTER_COMPLETION}}: chạy sau khi transaction **kết thúc** (cả commit lẫn rollback), dùng khi cần dọn dẹp trong cả hai trường hợp.

### Vì sao các phương án còn lại sai
- **BEFORE_COMMIT chạy sau commit**: BEFORE_COMMIT chạy **trước** khi commit, vẫn còn trong transaction, còn có thể ảnh hưởng dữ liệu.
- **AFTER_COMPLETION chạy trước khi kết thúc**: ngược lại, nó chạy **sau** khi transaction đã kết thúc.
- **Không có transaction thì listener mặc định vẫn chạy**: sai. Mặc định {{fallbackExecution = false}}, không có transaction thì listener **bị bỏ qua im lặng** (xem qz-spring-048). Muốn chạy cả khi không có transaction thì đặt {{fallbackExecution = true}}.

### Lưu ý
Trong AFTER_COMMIT, transaction đã kết thúc: nếu listener cần ghi DB, nó phải tự mở transaction mới ({{REQUIRES_NEW}}) hoặc để method có {{@Transactional}} trên một bean khác. Xem qz-spring-015.

> Senior tip: AFTER_COMMIT vẫn có khe hở — commit xong mà pod chết trước khi gửi mail thì event mất. Với event bắt buộc phải tới nơi (thanh toán, tồn kho), dùng transactional outbox.`
},
{
  id: 'qz-jpa-021',
  topic: 'jpa',
  q: 'Batch insert 5.000 dòng bằng saveAll đã bật hibernate.jdbc.batch_size=100, nhưng log vẫn in 5.000 câu INSERT riêng lẻ. Nguyên nhân gốc và cách sửa?',
  options: [
    'batch_size chỉ hỗ trợ MySQL, PostgreSQL bỏ qua tham số này',
    'Thiếu hibernate.order_inserts=true; chỉ cần thêm là batch chạy',
    'Entity dùng GenerationType.IDENTITY: Hibernate phải INSERT ngay để lấy khóa, nên không gom được batch; đổi sang SEQUENCE (pooled optimizer)',
    'saveAll luôn chạy tuần tự; đổi sang parallelStream là batch'
  ],
  answer: 2,
  explain: `**Đáp án đúng: IDENTITY buộc Hibernate INSERT ngay để lấy khóa, phá batching.**

### Vì sao đúng
Với {{GenerationType.IDENTITY}}, cơ sở dữ liệu sinh khóa **ngay khi câu INSERT chạy** (identity column / auto_increment). Hibernate cần khóa đó để đưa entity vào persistence context (khóa là "địa chỉ" của entity trong sổ tay), nên nó **phải** thực thi INSERT ngay tại {{persist()}} rồi đọc generated key. Không thể hoãn để gom nhiều INSERT thành một batch → mỗi dòng một round-trip.

Với {{GenerationType.SEQUENCE}}, Hibernate gọi sequence một lần lấy **một khối** khóa (allocationSize = 50, pooled optimizer) rồi cấp dần trong bộ nhớ. Vì đã biết khóa trước, entity có thể nằm chờ trong session và INSERT được gom thành batch lúc flush. Kèm theo {{hibernate.order_inserts=true}} để các INSERT cùng bảng nằm cạnh nhau, và {{flush()}} + {{clear()}} mỗi lô để session không phình.

### Vì sao các phương án còn lại sai
- **batch_size chỉ hỗ trợ MySQL**: sai, {{hibernate.jdbc.batch_size}} áp dụng cho INSERT/UPDATE/DELETE trên mọi DB; vấn đề nằm ở IDENTITY chứ không phải DB.
- **Thiếu order_inserts là nguyên nhân**: {{order_inserts}} chỉ sắp xếp thứ tự câu lệnh để batch hiệu quả hơn; nó **không** gỡ được ràng buộc "phải INSERT ngay" của IDENTITY.
- **parallelStream**: chạy song song không làm Hibernate gộp batch; còn thêm rủi ro về thread và transaction.

### Cách sửa
Đổi sang SEQUENCE + allocationSize (PostgreSQL), hoặc TABLE generator (MySQL không có sequence), kết hợp batch_size và flush/clear theo lô. Với hàng chục triệu dòng, cân nhắc bỏ JPA, dùng JdbcTemplate.batchUpdate hoặc COPY. Xem qz-jpa-015 và qz-jpa-036.

> Senior tip: trên PostgreSQL nhớ để INCREMENT BY của sequence khớp allocationSize; trên MySQL thêm reWriteBatchedInserts=true vào JDBC URL để driver gộp thành INSERT nhiều VALUES, thường nhanh thêm 2–3 lần.`
},
{
  id: 'qz-jpa-022',
  topic: 'jpa',
  multi: true,
  q: 'Bạn cần chạy bulk update an toàn trong transaction để entity cũ trong persistence context không làm hỏng dữ liệu. Cấu hình nào đúng? (Chọn 2)',
  options: [
    '@Modifying(clearAutomatically = true, flushAutomatically = true): flush các thay đổi đang chờ TRƯỚC khi chạy bulk, clear session SAU đó',
    'Sau bulk update, gọi em.clear() để lần đọc sau lấy dữ liệu mới từ DB',
    '@Modifying mặc định đã tự flush và clear, không cần khai báo gì',
    'Bulk update tự cập nhật mọi entity đang managed nên không cần clear',
    'Bulk update không cần @Transactional vì nó tự mở transaction'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: bật flushAutomatically + clearAutomatically, hoặc tự clear sau bulk.**

### Vì sao đúng
Câu bulk ({{@Modifying @Query("update ...")}}) đi **thẳng** xuống DB, không cập nhật các object đang nằm trong persistence context. Nếu session còn giữ entity cũ, hai rủi ro xảy ra:
- Bạn đọc lại entity và thấy **giá trị cũ** (stale) vì Hibernate trả về bản trong bộ nhớ.
- Nếu entity đó đang dirty, lúc flush Hibernate có thể **ghi đè** giá trị cũ lên dữ liệu vừa bulk update.

Hai cờ của {{@Modifying}} giải quyết đúng vấn đề:
- {{flushAutomatically = true}}: flush các thay đổi đang chờ **trước** khi chạy bulk, để bulk không ghi đè mất thay đổi chưa flush.
- {{clearAutomatically = true}}: clear session **sau** khi chạy bulk, để lần đọc sau lấy dữ liệu mới từ DB.

### Vì sao các phương án còn lại sai
- **Mặc định đã tự flush/clear**: mặc định cả hai cờ là {{false}}; phải chủ động bật.
- **Bulk tự cập nhật entity managed**: bulk bỏ qua persistence context, không đụng tới entity trong session.
- **Không cần @Transactional**: {{@Modifying}} thiếu {{@Transactional}} sẽ ném {{TransactionRequiredException}}.

### Khi nào dùng bulk
Bulk update chỉ nên dùng cho hàng nghìn dòng trở lên (import, dọn dữ liệu). Với vài chục dòng, load entity rồi sửa bằng setter an toàn và dễ đọc hơn. Xem qz-jpa-032 để hiểu chi tiết cạm bẫy ghi đè.

> Senior tip: nếu chỉ cần clear mà không cần flush, đặt {{clearAutomatically = true}}; nếu cần cả hai, đặt cả hai. Đừng bật bừa vì flushAutomatically sẽ đẩy mọi thay đổi đang chờ xuống DB sớm hơn bạn dự kiến.`
},
{
  id: 'qz-jpa-023',
  topic: 'jpa',
  q: 'Màn hình danh sách chỉ cần id, tên, trạng thái của 10.000 đơn hàng, còn entity {{Order}} có 40 cột. Vì sao nên dùng DTO/interface projection thay vì trả entity đầy đủ?',
  options: [
    'Vì projection làm số câu SQL giảm còn một câu duy nhất',
    'Vì entity không thể dùng cho màn hình danh sách',
    'Vì projection tự động bật second-level cache',
    'Vì projection chỉ SELECT các cột cần, không tạo entity managed, nên giảm I/O, heap và chi phí dirty checking'
  ],
  answer: 3,
  explain: `**Đáp án đúng: projection chỉ SELECT các cột cần và không tạo entity managed.**

### Vì sao đúng
Khi trả entity đầy đủ, Hibernate SELECT **toàn bộ 40 cột**, tạo 10.000 entity managed, mỗi entity giữ một snapshot để dirty checking. Với màn hình chỉ cần 3 cột, đó là lãng phí I/O, heap và CPU. Projection (interface hoặc class/record) chỉ định đúng tập cột cần:
~~~java
interface OrderRow { Long getId(); String getName(); String getStatus(); }
~~~
Spring Data sinh query chỉ chọn các cột tương ứng. Hoặc dùng constructor expression: {{select new com.shop.OrderRow(o.id, o.name, o.status) from Order o}} — tạo DTO trực tiếp, Hibernate không quản lý DTO.

Kết quả: query nhẹ hơn, không có entity trong persistence context, không dirty checking, ít heap hơn.

### Vì sao các phương án còn lại sai
- **Giảm số câu SQL còn một**: query entity cũng chỉ là một câu; projection giảm **số cột** và dữ liệu, không giảm số câu.
- **Entity không dùng được cho danh sách**: entity vẫn dùng được, chỉ là tốn tài nguyên hơn; projection là tối ưu, không phải điều kiện bắt buộc.
- **Tự bật second-level cache**: projection không liên quan cache L2; cache phải cấu hình riêng.

### Khi nào vẫn dùng entity
Khi cần ghi (sửa, xóa) hoặc cần quan hệ lazy, hãy dùng entity. Quy tắc thực dụng: **đọc để hiển thị thì dùng projection/DTO, ghi thì dùng entity**. Xem qz-jpa-018 để biết các cách tạo projection.

> Senior tip: trên bảng rộng có cột TEXT/JSONB lớn, chuyển màn hình danh sách sang projection thường giảm vài lần cả thời gian query lẫn heap. Với Java record, constructor expression càng gọn.`
},
{
  id: 'qz-jpa-024',
  topic: 'jpa',
  multi: true,
  q: 'Về optimistic locking với {{@Version}} trong JPA, phát biểu nào đúng? (Chọn 2)',
  options: [
    'Mỗi lần UPDATE, Hibernate thêm điều kiện WHERE version = ? và tăng version lên 1; nếu 0 dòng khớp thì ném OptimisticLockException',
    'Lỗi xảy ra lúc flush (thường là commit), nên retry phải đặt ở tầng service NGOÀI transaction',
    'Optimistic locking khóa dòng trong DB cho tới khi transaction kết thúc',
    'Hibernate tự động retry khi gặp OptimisticLockException',
    '@Version chỉ hỗ trợ kiểu long'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: kiểm tra version trong câu UPDATE và ném OptimisticLockException khi 0 dòng khớp; retry đặt ngoài transaction.**

### Vì sao đúng
{{@Version}} thêm một cột version. Lúc load, entity giữ version hiện tại. Câu UPDATE của Hibernate có dạng:
~~~sql
update account set balance = ?, version = 8 where id = ? and version = 7
~~~
Nếu transaction khác đã commit trước (DB version = 8), câu UPDATE trên khớp **0 dòng** → Hibernate ném {{OptimisticLockException}} (Spring bọc thành {{ObjectOptimisticLockingFailureException}}, thường map sang HTTP 409). Lỗi xảy ra ở **flush lúc commit**, không phải lúc gọi save.

Vì lỗi chỉ lộ ra khi commit, retry phải bọc **ngoài** transaction (ví dụ {{@Retryable}} trên method {{REQUIRES_NEW}}) — nếu retry bên trong cùng transaction, entity cũ vẫn nằm trong session và lại thất bại.

### Vì sao các phương án còn lại sai
- **Khóa dòng trong DB**: đó là pessimistic lock ({{SELECT ... FOR UPDATE}}, xem qz-jpa-017); optimistic không giữ lock, chỉ phát hiện xung đột lúc ghi.
- **Hibernate tự retry**: không, ứng dụng phải tự retry.
- **Chỉ hỗ trợ long**: {{@Version}} hỗ trợ {{int}}, {{Integer}}, {{long}}, {{short}}, {{Short}} và {{java.sql.Timestamp}}.

### Khi nào dùng
Optimistic hợp với tranh chấp thấp (form sửa hồ sơ). Với tranh chấp cao như trừ tồn kho flash sale, retry liên tục sẽ thừa — dùng câu UPDATE nguyên tử có điều kiện (xem qz-jpa-020 và qz-jpa-039) hoặc pessimistic lock. Xem qz-jpa-035 để thấy kịch bản race cụ thể.

> Senior tip: đừng retry vô hạn; đặt số lần thử tối đa và log khi vẫn thất bại. Với API, trả 409 để client biết cần tải lại dữ liệu mới nhất.`
},
{
  id: 'qz-db-021',
  topic: 'db',
  q: 'PostgreSQL dùng MVCC (Multi-Version Concurrency Control — kiểm soát đồng thời bằng nhiều phiên bản). Phát biểu nào đúng về cơ chế này?',
  options: [
    'UPDATE tạo phiên bản dòng mới thay vì ghi đè; transaction đọc thấy snapshot tại thời điểm bắt đầu, nên readers không bị block bởi writers',
    'UPDATE ghi đè trực tiếp lên dòng cũ và khóa dòng đó tới khi commit',
    'PostgreSQL không cho đọc đồng thời khi có transaction đang ghi',
    'MVCC chỉ áp dụng cho SELECT, không áp dụng cho UPDATE/DELETE'
  ],
  answer: 0,
  explain: `**Đáp án đúng: UPDATE tạo phiên bản dòng mới, readers thấy snapshot của mình, không chặn nhau.**

### Vì sao đúng
MVCC nghĩa là mỗi lần UPDATE, PostgreSQL **không ghi đè** lên dòng cũ mà tạo một **phiên bản mới** (tuple mới); bản cũ được đánh dấu là "chết" (dead tuple). Mỗi transaction đọc theo một **snapshot** — bức ảnh dữ liệu tại thời điểm nó bắt đầu. Nhờ vậy:
- Transaction đang đọc không bị writer chặn (đọc bản cũ trong snapshot).
- Transaction đang ghi không bị reader chặn (ghi bản mới, không đụng bản cũ).

Đây là lý do PostgreSQL đọc/ghi song song tốt mà không cần lock đọc.

### Cái giá phải trả
Các bản cũ (dead tuple) không biến mất ngay; chúng được **VACUUM** dọn sau khi không còn transaction nào cần thấy. Nếu một transaction mở quá lâu (idle in transaction), VACUUM không dọn được → bảng và index phình ra (bloat). Xem qz-db-009.

### Vì sao các phương án còn lại sai
- **Ghi đè và khóa dòng tới commit**: đó là mô hình lock-based; PostgreSQL tạo tuple mới chứ không ghi đè.
- **Không cho đọc đồng thời khi có ghi**: ngược lại, đọc và ghi song song là điểm mạnh của MVCC.
- **Chỉ áp dụng cho SELECT**: MVCC áp dụng cho mọi câu lệnh đọc/ghi; UPDATE/DELETE cũng tạo phiên bản mới và tuân theo snapshot.

> Senior tip: theo dõi transaction treo bằng {{pg_stat_activity}} (state = 'idle in transaction') và đặt {{idle_in_transaction_session_timeout}} để tránh bloat âm thầm. Xem qz-db-009.`
},
{
  id: 'qz-db-022',
  topic: 'db',
  multi: true,
  q: 'Về lost update (mất cập nhật khi hai transaction cùng sửa một dòng), phát biểu nào đúng? (Chọn 2)',
  options: [
    'READ COMMITTED đơn thuần KHÔNG ngăn lost update: hai transaction cùng đọc version cũ rồi ghi đè nhau, người ghi sau thắng',
    'PostgreSQL REPEATABLE READ ngăn lost update bằng cách báo lỗi 40001 khi dòng đã bị transaction khác sửa sau snapshot, buộc ứng dụng retry',
    'SERIALIZABLE không cần retry vì PostgreSQL dùng pessimistic lock',
    'READ UNCOMMITTED ngăn lost update tốt hơn READ COMMITTED',
    'Lost update chỉ xảy ra trên MySQL, PostgreSQL không bao giờ gặp'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: READ COMMITTED đơn thuần không ngăn lost update; PostgreSQL REPEATABLE READ ngăn bằng lỗi 40001 và bắt retry.**

### Vì sao đúng
Lost update xảy ra khi hai transaction cùng đọc một dòng, cùng sửa, rồi cùng ghi — người ghi sau đè mất thay đổi của người ghi trước. Ví dụ số dư 100: T1 đọc 100, T2 đọc 100; T1 ghi 90, T2 ghi 80; kết quả 80, mất 10 của T1.

- **READ COMMITTED đơn thuần**: mỗi câu lệnh thấy dữ liệu đã commit mới nhất, nhưng không có cơ chế phát hiện "dòng đã bị sửa sau khi tôi đọc" → lost update vẫn xảy ra.
- **PostgreSQL REPEATABLE READ**: mọi câu lệnh thấy cùng một snapshot. Nếu dòng bạn sắp UPDATE đã bị transaction khác sửa và commit sau snapshot của bạn, PostgreSQL không cho ghi đè mà báo lỗi SQLSTATE 40001 ("could not serialize access due to concurrent update"). Ứng dụng phải bắt lỗi và retry. SERIALIZABLE (SSI) cũng dùng cơ chế lỗi 40001, không phải pessimistic lock.

Ngoài isolation, còn có các cách khác: {{SELECT ... FOR UPDATE}} (pessimistic), câu UPDATE nguyên tử có điều kiện ({{set quantity = quantity - 1 where ...}}), hoặc {{@Version}} (optimistic).

### Vì sao các phương án còn lại sai
- **SERIALIZABLE không cần retry vì dùng pessimistic lock**: SERIALIZABLE của PostgreSQL dùng SSI (predicate lock + lỗi 40001), **cần** retry; nó không dùng pessimistic lock.
- **READ UNCOMMITTED tốt hơn READ COMMITTED**: READ UNCOMMITTED còn lỏng hơn (đọc cả dữ liệu chưa commit), không ngăn được gì.
- **Chỉ MySQL mới gặp**: PostgreSQL cũng gặp lost update ở READ COMMITTED đơn thuần; đây là vấn đề của mọi DB, không riêng MySQL.

> Senior tip: retry phải đặt **ngoài** transaction (Spring Retry quanh method @Transactional), không phải bên trong; nếu không, transaction cũ vẫn giữ snapshot cũ và lại lỗi. Xem qz-db-010 và qz-db-013.`
},
{
  id: 'qz-db-023',
  topic: 'db',
  q: `Bảng {{events}} (20 triệu dòng) có index B-tree trên cột {{created_at}}. Query sau vẫn chạy Seq Scan:
~~~sql
SELECT * FROM events WHERE date_trunc('day', created_at) = TIMESTAMP '2026-01-01 00:00:00';
~~~
Cách sửa đúng?`,
  options: [
    'Chạy ANALYZE để planner nhận ra và dùng index hiện có',
    "Đổi sang HASH index vì hash index hỗ trợ hàm",
    "Tạo expression index trên đúng biểu thức: CREATE INDEX ON events (date_trunc('day', created_at))",
    'Thêm hint USE INDEX vào câu query'
  ],
  answer: 2,
  explain: `**Đáp án đúng: tạo expression index trên đúng biểu thức {{date_trunc('day', created_at)}}.**

### Vì sao đúng
Index B-tree trên {{created_at}} lưu các giá trị gốc đã sắp xếp. Điều kiện {{date_trunc('day', created_at) = ...}} so sánh **kết quả của hàm**, mà index không chứa các giá trị đó, nên planner không dùng được, buộc phải đọc từng dòng, tính date_trunc rồi so. Expression index lưu sẵn kết quả hàm, khớp chính xác với điều kiện:
~~~sql
CREATE INDEX CONCURRENTLY idx_events_day ON events (date_trunc('day', created_at));
~~~
Query phải viết **đúng biểu thức** đã index thì planner mới dùng. Cách khác là chuẩn hóa dữ liệu khi ghi (thêm cột day được tính sẵn rồi index cột đó).

### Vì sao các phương án còn lại sai
- **ANALYZE**: cập nhật thống kê, nhưng index trên created_at vốn không thể phục vụ điều kiện bọc hàm, thống kê tốt mấy cũng vậy.
- **HASH index**: hash chỉ phục vụ phép bằng trên đúng giá trị đã index, không tự hiểu hàm; vấn đề vẫn y nguyên.
- **USE INDEX**: là cú pháp MySQL; PostgreSQL không có hint chuẩn (chỉ qua extension pg_hint_plan), và kể cả ép cũng không dùng được index không khớp biểu thức.

> Senior tip: quy tắc chung — **không bọc cột đã index trong hàm** ở mệnh đề WHERE. MySQL 8.0.13+ cũng có functional index (expression index) với cú pháp hai ngoặc quanh biểu thức, ví dụ {{CREATE INDEX idx ON events ((DAY(created_at)))}}. Xem qz-db-007.`
},
{
  id: 'qz-db-024',
  topic: 'db',
  multi: true,
  q: 'Về deadlock trong cơ sở dữ liệu, phát biểu nào đúng? (Chọn 2)',
  options: [
    'Deadlock xảy ra khi hai transaction cùng chờ lock mà đối phương đang giữ, tạo thành vòng chờ (wait cycle)',
    'Thứ tự lấy lock khác nhau giữa các transaction là nguyên nhân phổ biến gây deadlock',
    'Isolation READ COMMITTED là nguyên nhân trực tiếp gây deadlock',
    'Đặt timeout giao dịch ngắn hơn sẽ gây deadlock',
    'Deadlock chỉ xảy ra với MySQL, PostgreSQL tự động tránh hoàn toàn'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: deadlock là vòng chờ lock; thứ tự lấy lock khác nhau là nguyên nhân phổ biến.**

### Vì sao đúng
Deadlock là tình huống hai (hoặc nhiều) transaction mỗi bên giữ một lock và cùng chờ lock bên kia, tạo thành **vòng chờ** không bao giờ gỡ được. Ví dụ: T1 khóa tài khoản A rồi chờ B; T2 khóa B rồi chờ A. Cả hai chờ nhau vô hạn.

Nguyên nhân phổ biến nhất là **thứ tự lấy lock khác nhau**: nếu mọi transaction luôn khóa theo cùng một thứ tự (ví dụ id tăng dần khi chuyển tiền), vòng chờ không thể hình thành.

### Cách DB xử lý
- PostgreSQL: sau {{deadlock_timeout}} (mặc định 1 giây) sẽ phát hiện và **abort một** transaction với lỗi deadlock, transaction còn lại chạy tiếp.
- MySQL InnoDB: tự phát hiện deadlock và rollback transaction "nhẹ" hơn, trả về lỗi 1213.

Ứng dụng phải **bắt lỗi và retry** (đủ số lần, có backoff), vì deadlock là lỗi tạm thời.

### Vì sao các phương án còn lại sai
- **READ COMMITTED là nguyên nhân trực tiếp**: isolation không trực tiếp gây deadlock; deadlock đến từ vòng chờ lock, dù ở mức isolation nào cũng có thể xảy ra.
- **Timeout ngắn gây deadlock**: timeout ngắn giúp **phát hiện và thoát** deadlock nhanh hơn, không phải nguyên nhân.
- **Chỉ MySQL mới gặp**: PostgreSQL cũng có deadlock (và tự phát hiện như trên).

> Senior tip: luôn khóa theo cùng một thứ tự (id tăng dần), giữ transaction ngắn, và đặt {{lock_timeout}}/{{innodb_lock_wait_timeout}} hợp lý để lỗi nhanh thay vì treo cả connection pool. Xem qz-db-013 về gap lock — nguồn deadlock "bí ẩn" trên MySQL.`
},
{
  id: 'qz-api-023',
  topic: 'api',
  q: 'API {{POST /payments}} dùng Idempotency-Key. Mục đích chính của cơ chế này là gì?',
  options: [
    'Mã hóa payload để bảo mật khi truyền qua mạng',
    'Xác thực người dùng gọi API',
    'Giới hạn tần suất request (rate limit)',
    'Đảm bảo khi client retry cùng một request (cùng key) thì server không tạo duplicate, trả lại kết quả đã xử lý'
  ],
  answer: 3,
  explain: `**Đáp án đúng: chống duplicate khi client retry cùng một request.**

### Vì sao đúng
Mạng có thể timeout sau khi server đã xử lý xong nhưng trước khi response về tới client. Client không biết kết quả, bèn gửi lại request. Không có idempotency, mỗi lần gửi là một lần charge → thu tiền hai lần. Idempotency-Key là một định danh duy nhất cho **một** thao tác nghiệp vụ:
- Server lưu key kèm kết quả (response) và fingerprint của request (account, amount, currency...).
- Cùng key + cùng nội dung → trả lại kết quả đã lưu, không xử lý lại.
- Cùng key + khác nội dung → từ chối (thường 409), vì nghi ngờ client dùng nhầm key.

Việc lưu và kiểm tra key phải **nguyên tử** (unique constraint hoặc thao tác atomic) để hai request đồng thời không cùng vượt qua. Xem qz-api-039.

### Vì sao các phương án còn lại sai
- **Mã hóa payload**: idempotency không mã hóa gì; payload vẫn đi qua HTTPS như bình thường.
- **Xác thực user**: đó là việc của token/OAuth, không liên quan chống duplicate.
- **Rate limit**: giới hạn tần suất là cơ chế khác (429 + Retry-After, xem qz-api-011).

> Senior tip: lưu key với TTL phù hợp (ví dụ 24 giờ) và trạng thái IN_PROGRESS/SUCCEEDED/FAILED để client biết request đang chạy hay đã xong. Xem qz-api-039 để biết cách claim key nguyên tử.`
},
{
  id: 'qz-api-024',
  topic: 'api',
  multi: true,
  q: 'Server trả {{429 Too Many Requests}}. Những header nào nên kèm theo để client xử lý đúng? (Chọn 2)',
  options: [
    'Retry-After: cho biết sau bao lâu (số giây hoặc HTTP-date) client nên thử lại',
    'RateLimit headers (RateLimit-Limit/Remaining/Reset, draft IETF): cho biết hạn mức và số request còn lại',
    'Set-Cookie: để lưu trạng thái rate limit ở client',
    'Location: trỏ tới tài nguyên mới',
    'ETag: để cache response 429'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: Retry-After và RateLimit headers.**

### Vì sao đúng
429 (RFC 6585) nghĩa là client đã gửi quá nhiều request trong một khoảng thời gian. Để client tự điều tiết, response cần cho biết:
- {{Retry-After}} (RFC 9110): sau bao lâu nên thử lại — dạng số giây hoặc HTTP-date. Đây là header quan trọng nhất, giúp client backoff hợp lý thay vì dội liên tục.
- {{RateLimit-Limit}}/{{RateLimit-Remaining}}/{{RateLimit-Reset}} (draft IETF): cho biết tổng hạn mức, số request còn lại và thời điểm reset. Nhiều API còn dùng {{X-RateLimit-*}} (không chuẩn nhưng phổ biến).

Ví dụ:
~~~text
HTTP/1.1 429 Too Many Requests
Retry-After: 30
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 60
~~~

### Vì sao các phương án còn lại sai
- **Set-Cookie**: rate limit là trạng thái phía server, không lưu ở cookie; cookie còn có thể lộ dữ liệu.
- **Location**: dùng cho chuyển hướng (3xx) hoặc 201 Created, không liên quan rate limit.
- **ETag**: dùng cho cache/validate (304, If-None-Match), không liên quan 429.

### Lưu ý
Vì sao 429 mà không phải 403/503? 403 nghĩa là không có quyền (retry vô ích), 503 là lỗi phía server (sẽ kích hoạt alert). 429 nói đúng: client này vượt hạn mức, chỉ cần chờ. Xem qz-api-011.

> Senior tip: client nên kết hợp Retry-After với exponential backoff + jitter; nếu không, hàng nghìn client cùng retry đúng giây thứ 30 sẽ tạo đợt spike mới.`
},
{
  id: 'qz-api-025',
  topic: 'api',
  q: 'Trong các cách version API REST, cách nào được dùng phổ biến nhất và dễ cache/route nhất qua gateway/CDN?',
  options: [
    'URL path: /v1/orders, /v2/orders',
    'Query param: /orders?version=1',
    'Custom header: X-API-Version: 1',
    'Không version, dựa vào content negotiation'
  ],
  answer: 0,
  explain: `**Đáp án đúng: URL path (/v1/, /v2/).**

### Vì sao đúng
URL path versioning đưa phiên bản vào chính đường dẫn: {{/v1/orders}}, {{/v2/orders}}. Ưu điểm:
- **Rõ ràng**: nhìn URL là biết phiên bản, dễ test bằng curl/postman.
- **Dễ cache/route**: CDN, gateway, load balancer route theo path rất tự nhiên; mỗi phiên bản là một "tài nguyên" riêng.
- **Dễ theo dõi**: log/metrics gom theo path, biết client nào còn dùng v1.

Nhược điểm: phải khai báo route cho từng phiên bản (có thể dùng {{@RequestMapping("/v1/...")}} hoặc cấu hình gateway), và URL dài hơn một chút.

### Vì sao các phương án còn lại sai
- **Query param {{?version=1}}**: dùng được nhưng dễ bị **bỏ sót** khi client quên tham số, khó cache chuẩn (nhiều hệ thống coi query là "cùng tài nguyên"), và dễ bị lẫn với các tham số lọc khác.
- **Custom header {{X-API-Version}}**: "thuần REST" hơn nhưng khó route/cache (header không phải là một phần của key cache mặc định), client dễ quên gửi, và khó debug bằng trình duyệt.
- **Không version**: mọi thay đổi đều là breaking; client cũ vỡ ngay khi server đổi. Chỉ chấp nhận được với API nội bộ rất nhỏ và kiểm soát chặt.

### Đổi mới an toàn
Dù chọn cách nào, thay đổi nên theo **expand/contract**: thêm field mới (giữ field cũ song song), đánh dấu {{Deprecation}}/{{Sunset}}, theo dõi traffic, rồi mới xóa ở phiên bản sau. Xem qz-api-013 và qz-api-037.

> Senior tip: nhiều team lớn dùng URL path cho API công khai (dễ onboard đối tác) và header versioning cho API nội bộ (gọn hơn). Điều quan trọng là **nhất quán** trong toàn hệ thống.`
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
  id: 'qz-jpa-901',
  topic: 'jpa',
  q: `Fetch type mặc định cho mối quan hệ {{ @OneToMany }} là gì?`,
  options: [
    'EAGER',
    'LAZY',
    'DEFAULT',
    'NO_FETCH'
  ],
  answer: 1,
  explain: `**Đáp án đúng: LAZY.**

### Vì sao đúng
Mặc định của {{ @OneToMany }} là LAZY để tránh tải toàn bộ dữ liệu quan hệ một cách không cần thiết.

### Vì sao các phương án còn lại sai
- **EAGER**: là mặc định của {{ @ManyToOne }} và {{ @OneToOne }}.
- **DEFAULT / NO_FETCH**: không phải giá trị FetchType hợp lệ.

> Senior tip: luôn khai báo tường minh LAZY để tránh EAGER vô tình gây N+1. Với @ManyToOne cũng nên dùng LAZY.`
},
{
  id: 'qz-jpa-902',
  topic: 'jpa',
  multi: true,
  q: `Các cách hiệu quả để giải quyết vấn đề N+1 là gì? (Chọn 2)`,
  options: [
    'Sử dụng Fetch Join trong JPQL',
    'Sử dụng @EntityGraph',
    'Tăng cấu hình fetch size',
    'Luôn dùng EAGER fetch',
    'Không bao giờ dùng transactional'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: Fetch Join và EntityGraph.**

### Vì sao đúng
- Fetch Join và EntityGraph giúp tải quan hệ ngay trong query chính, thay vì load lười (lazy load) từng cái một.

### Vì sao các phương án còn lại sai
- **Tăng fetch size**: chỉ làm batching, không giải quyết được N+1 (vẫn N+1 lần đi lại qua mạng).
- **Luôn dùng EAGER fetch**: vẫn gây N+1 (Hibernate vẫn phải load bù từng entity khi truy vấn danh sách).

> Senior tip: N+1 là nguyên nhân số 1 của "API chậm mà DB không tải". Luôn kiểm tra số câu lệnh SQL trong test integration.`
},
{
  id: 'qz-jpa-903',
  topic: 'jpa',
  q: `Nguyên nhân chính gây ra vấn đề N+1 trong JPA là gì?`,
  options: [
    'Sử dụng @Id không đúng',
    'Tải một entity sau đó truy cập quan hệ LAZY trong một vòng lặp',
    'Sử dụng quá nhiều @Transactional',
    'Flush mode không hợp lý'
  ],
  answer: 1,
  explain: `**Đáp án đúng: tải một entity sau đó truy cập quan hệ LAZY trong vòng lặp.**

### Vì sao đúng
Khi tải một danh sách entity, nếu sau đó lặp qua danh sách và truy cập quan hệ LAZY, JPA sẽ phát sinh thêm 1 câu lệnh SQL cho mỗi entity trong danh sách (N câu cho N entity + 1 câu đầu).

### Vì sao các phương án còn lại sai
- Các phương án khác không liên quan trực tiếp tới cơ chế của N+1.

> Senior tip: cẩn thận với code kiểu {{orders.stream().map(o -> o.getItems().size())}}. Đây là bẫy N+1 kinh điển.`
},
{
  id: 'qz-jpa-904',
  topic: 'jpa',
  q: `Ưu điểm chính của việc sử dụng {{ @EntityGraph }} so với Fetch Join là gì?`,
  options: [
    'Nhanh hơn Fetch Join',
    'Có thể định nghĩa linh hoạt trên repository method mà không sửa query',
    'EntityGraph chỉ dùng được cho @ManyToOne',
    'Giảm kích thước file jar'
  ],
  answer: 1,
  explain: `**Đáp án đúng: có thể định nghĩa linh hoạt trên repository method mà không cần sửa query.**

### Vì sao đúng
{{ @EntityGraph }} cho phép tùy chỉnh đồ thị tải (fetch plan) trực tiếp trên repository method mà không cần thay đổi câu lệnh JPQL (như 'join fetch').

### Vì sao các phương án còn lại sai
- Các phương án khác không mô tả đúng tính năng hoặc không có cơ sở.

> Senior tip: {{ @EntityGraph }} rất mạnh khi cần fetch các quan hệ khác nhau cho cùng một truy vấn trong các use-case khác nhau.`
},
{
  id: 'qz-jpa-905',
  topic: 'jpa',
  q: `Việc đặt {{ @Transactional(readOnly = true) }} mang lại lợi ích gì?`,
  options: [
    'Chỉ có tác dụng với Oracle DB',
    'Không có tác dụng gì',
    'Tối ưu hóa hiệu năng, ví dụ như bỏ qua check dirty state',
    'Tự động khóa bảng (table lock)'
  ],
  answer: 2,
  explain: `**Đáp án đúng: tối ưu hóa hiệu năng, ví dụ như bỏ qua check dirty state.**

### Vì sao đúng
{{ readOnly = true }} báo cho Hibernate biết không cần theo dõi các thay đổi (dirty checking) trên các entity trong session đó, giúp tiết kiệm bộ nhớ và giảm tải CPU.

### Vì sao các phương án còn lại sai
- **Tự động khóa bảng**: không đúng.

> Senior tip: luôn đặt {{ readOnly = true }} cho các method chỉ đọc. Nó không làm query nhanh hơn, nhưng làm quá trình commit/flush nhẹ hơn đáng kể.`
},
{
  id: 'qz-jpa-906',
  topic: 'jpa',
  multi: true,
  q: `Điều nào sau đây đúng về {{ @Transactional(readOnly = true) }}? (Chọn 2)`,
  options: [
    'Có thể thay đổi entity nhưng DB không lưu',
    'Ngăn chặn mọi thay đổi DB',
    'Giúp Hibernate tối ưu hóa flush process',
    'Chỉ dùng được cho câu lệnh SELECT',
    'Tăng tốc độ truy vấn'
  ],
  answer: [2, 4],
  explain: `**Đáp án đúng: giúp Hibernate tối ưu hóa flush process và tăng tốc truy vấn (trên một số DB).**

### Vì sao đúng
- Phương án 2: Hibernate bỏ qua dirty checking.
- Phương án 4: Một số DB driver có thể tối ưu hơn cho các transaction read-only.

### Vì sao các phương án còn lại sai
- **Ngăn chặn mọi thay đổi DB**: Hibernate không chặn việc gọi setter; nó chỉ không ghi lại thay đổi.
- **Chỉ dùng cho câu lệnh SELECT**: về mặt ngữ nghĩa là vậy, nhưng code vẫn có thể chạy UPDATE (chỉ là không được lưu).

> Senior tip: readOnly là lưới an toàn, không phải tường lửa. Hãy tuân thủ quy ước đặt readOnly cho method chỉ đọc.`
},
{
  id: 'qz-jpa-907',
  topic: 'jpa',
  q: `Annotation {{ @Version }} được dùng để làm gì?`,
  options: [
    'Định nghĩa version của ứng dụng',
    'Cấu hình optimistic locking',
    'Cấu hình pessimistic locking',
    'Quản lý cache level 2'
  ],
  answer: 1,
  explain: `**Đáp án đúng: cấu hình optimistic locking.**

### Vì sao đúng
{{ @Version }} là cơ chế chính để triển khai optimistic locking trong JPA, ngăn chặn mất dữ liệu do ghi đè (lost updates).

### Vì sao các phương án còn lại sai
- Các phương án khác không liên quan.

> Senior tip: luôn để một cột @Version cho các entity có tranh chấp cao. Nó cứu bạn khỏi lỗi ghi đè dữ liệu mà không cần khóa DB.`
},
{
  id: 'qz-jpa-908',
  topic: 'jpa',
  q: `Khi optimistic locking thất bại, JPA sẽ ném ra ngoại lệ nào?`,
  options: [
    'OptimisticLockException',
    'SQLException',
    'NullPointerException',
    'DataAccessException'
  ],
  answer: 0,
  explain: `**Đáp án đúng: OptimisticLockException.**

### Vì sao đúng
Khi một entity đã được cập nhật bởi một transaction khác, JPA phát hiện version không khớp và ném ra {{ OptimisticLockException }}.

### Vì sao các phương án còn lại sai
- Các phương án khác không đúng hoặc quá tổng quát.

> Senior tip: trong Spring, ngoại lệ này thường được bọc lại thành ObjectOptimisticLockingFailureException. Hãy bắt lỗi này để xử lý retry hoặc thông báo cho người dùng.`
},
{
  id: 'qz-jpa-909',
  topic: 'jpa',
  q: `FlushModeType.AUTO trong JPA có nghĩa là gì?`,
  options: [
    'Flush sau mỗi câu lệnh SQL',
    'Flush trước khi query nếu cần đảm bảo tính nhất quán',
    'Không bao giờ tự động flush',
    'Chỉ flush khi gọi em.flush()'
  ],
  answer: 1,
  explain: `**Đáp án đúng: flush trước khi query nếu cần đảm bảo tính nhất quán.**

### Vì sao đúng
{{ FlushModeType.AUTO }} đảm bảo dữ liệu trong persistence context được đẩy xuống DB trước khi thực thi query, nếu query đó có thể bị ảnh hưởng bởi dữ liệu chưa được flush.

### Vì sao các phương án còn lại sai
- Các phương án khác không mô tả đúng FlushModeType.AUTO.

> Senior tip: hiểu rõ FlushMode giúp tránh việc query ra dữ liệu cũ (stale data) ngay sau khi vừa update entity.`
},
{
  id: 'qz-jpa-910',
  topic: 'jpa',
  multi: true,
  q: `Các tình huống nào sau đây sẽ kích hoạt flush tự động? (Chọn 2)`,
  options: [
    'Kết thúc transaction',
    'Trước khi thực thi truy vấn JPQL/SQL',
    'Khi thay đổi giá trị field',
    'Khi tạo entity mới',
    'Khi chương trình kết thúc'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: kết thúc transaction và trước khi thực thi truy vấn.**

### Vì sao đúng
- Commit transaction: Hibernate flush để đảm bảo data được lưu.
- Trước khi chạy query: Hibernate flush để đảm bảo query nhìn thấy dữ liệu mới nhất.

### Vì sao các phương án còn lại sai
- Thay đổi field, tạo mới entity không kích hoạt flush ngay (chúng chỉ làm entity trở nên dirty/managed).

> Senior tip: nắm vững thời điểm flush giúp tối ưu số lượng câu lệnh SQL và tránh lỗi dữ liệu.`
},

{
  id: 'qz-spring-911',
  topic: 'spring',
  q: `Cách tốt nhất để cấu hình chuỗi bộ lọc bảo mật trong Spring Security 6 là gì?`,
  options: [
    'Sử dụng @EnableWebSecurity và định nghĩa bean SecurityFilterChain',
    'Kế thừa lớp WebSecurityConfigurerAdapter',
    'Sử dụng @EnableGlobalMethodSecurity',
    'Định nghĩa bean FilterRegistrationBean'
  ],
  answer: 0,
  explain: `**Đáp án đúng: định nghĩa bean SecurityFilterChain.**

### Vì sao đúng
{{SecurityFilterChain}} là cách chuẩn trong Spring Security 6 vì lớp {{WebSecurityConfigurerAdapter}} đã bị loại bỏ. Các phương án khác không trực tiếp định nghĩa chuỗi bộ lọc bảo mật theo cách khuyến nghị.

### Vì sao các phương án còn lại sai
- **WebSecurityConfigurerAdapter**: đã deprecated từ 5.7 và bị xoá ở 6.0.
- **EnableGlobalMethodSecurity**: dùng cho cấu hình bảo mật ở cấp độ method, không phải chuỗi bộ lọc.
- **FilterRegistrationBean**: dùng để đăng ký Filter của Servlet API, không phải cho cấu hình chuỗi bộ lọc của Spring Security.

> Senior tip: luôn khai báo tường minh {{SecurityFilterChain}} để thấy rõ thứ tự các filter, tránh lỗi ẩn do mặc định của Boot.`
},
{
  id: 'qz-spring-912',
  topic: 'spring',
  q: `Vai trò của {{DelegatingFilterProxy}} trong Spring Security là gì?`,
  options: [
    'Tự động mã hóa mật khẩu người dùng',
    'Làm cầu nối giữa Servlet container và Spring ApplicationContext',
    'Tự động kiểm tra lỗ hổng SQL Injection',
    'Lọc các yêu cầu trước khi đến DispatcherServlet'
  ],
  answer: 1,
  explain: `**Đáp án đúng: làm cầu nối giữa Servlet container và Spring ApplicationContext.**

### Vì sao đúng
{{DelegatingFilterProxy}} là một Filter chuẩn của Servlet API, được đăng ký vào Servlet container. Nó ủy quyền xử lý thực tế cho một bean được quản lý bởi Spring bên trong {{ApplicationContext}}. Nhờ đó, bảo mật có thể dùng các tính năng của Spring (DI, AOP).

### Vì sao các phương án còn lại sai
- **Mã hóa mật khẩu**: việc của PasswordEncoder.
- **Kiểm tra SQL Injection**: việc của PreparedStatement hoặc các thư viện chuyên dụng, không phải Filter này.
- **Lọc trước DispatcherServlet**: DelegatingFilterProxy *thường* đứng trước, nhưng đó không phải là mô tả vai trò "cầu nối".

> Senior tip: nếu thấy {{DelegatingFilterProxy}} không hoạt động, hãy kiểm tra {{web.xml}} hoặc cấu hình ServletContextListener xem SpringContext có được nạp trước không.`
},
{
  id: 'qz-spring-903',
  topic: 'spring',
  multi: true,
  q: `Khi triển khai ứng dụng RESTful, các chiến lược nào giúp xử lý CSRF hiệu quả? (Chọn 2)`,
  options: [
    'Vô hiệu hóa CSRF hoàn toàn',
    'Sử dụng CookieCsrfTokenRepository kết hợp với SPA client (Angular/React)',
    'Gửi CSRF token qua header HTTP thay vì body',
    'Chỉ cần sử dụng Basic Authentication',
    'Không cần bảo vệ CSRF cho API'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: dùng CookieCsrfTokenRepository với SPA, gửi token qua header.**

### Vì sao đúng
- CSRF token giúp đảm bảo request đến từ UI của chính ứng dụng. Với SPA, CSRF token thường được đặt vào cookie (dễ đọc ở client) và gửi lại trong header ở request tiếp theo.

### Vì sao các phương án còn lại sai
- **Vô hiệu hóa CSRF / Không cần bảo vệ**: sai lầm nghiêm trọng nếu có cookie-based auth (session).
- **Chỉ cần Basic Authentication**: Basic Auth không bảo vệ khỏi CSRF (trình duyệt tự gửi credential).

> Senior tip: nếu API hoàn toàn dùng JWT trong header Authorization và không cookie, có thể vô hiệu hoá CSRF an toàn. Hãy kiểm tra kỹ xem có cookie nào được dùng không (ví dụ cookie session từ gateway cũ).`
},
{
  id: 'qz-spring-904',
  topic: 'spring',
  q: `Tại sao các ứng dụng RESTful sử dụng JWT thường vô hiệu hóa CSRF?`,
  options: [
    'Vì JWT không bao giờ bị tấn công CSRF',
    'Vì REST không sử dụng session dựa trên cookie',
    'Vì CSRF chỉ ảnh hưởng đến ứng dụng dùng JSP/Thymeleaf',
    'Vì Spring Security tự động bảo vệ REST không cần CSRF'
  ],
  answer: 1,
  explain: `**Đáp án đúng: vì REST thường dùng token (không cookie).**

### Vì sao đúng
CSRF tấn công bằng cách ép trình duyệt gửi cookie session tự động tới server. Nếu REST không sử dụng cookie session mà dùng JWT trong header, trình duyệt không tự động gửi, nên CSRF vô hiệu.

### Vì sao các phương án còn lại sai
- **JWT không bao giờ bị tấn công CSRF**: nếu JWT lưu trong cookie, nó vẫn bị CSRF như thường.
- **CSRF chỉ ảnh hưởng JSP/Thymeleaf**: sai, nó ảnh hưởng mọi app dùng cookie-based auth.
- **Spring Security tự động**: không tự động vô hiệu hóa.

> Senior tip: dù dùng JWT, nếu vẫn để JWT trong cookie (để tránh XSS), thì vẫn phải bật CSRF. JWT trong header Authorization là cách an toàn nhất nhưng khó xử lý với cross-origin hơn cookie.`
},
{
  id: 'qz-spring-905',
  topic: 'spring',
  q: `Annotation {{ @PreAuthorize }} hoạt động dựa trên cơ chế nào?`,
  options: [
    'Spring AOP',
    'Filter chain',
    'Interceptors',
    'Spring MVC HandlerMethods'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Spring AOP.**

### Vì sao đúng
{{ @PreAuthorize }} thuộc tính năng "Method Security", sử dụng Spring AOP để bao quanh (wrap) method, đánh giá biểu thức SpEL trước khi cho phép hàm thực thi.

### Vì sao các phương án còn lại sai
- **Filter chain**: chuỗi bộ lọc xử lý yêu cầu HTTP trước khi vào controller, không phải method.
- **Interceptors**: HandlerInterceptor dùng cho MVC, không kiểm soát bảo mật ở tầng Service.

> Senior tip: AOP dựa trên proxy, nên {{ @PreAuthorize }} trên {{this.method()}} (self-invocation) sẽ bị bỏ qua. Phải gọi qua bean khác hoặc Inject chính class đó (proxy) vào class đó (dù design này không tốt).`
},
{
  id: 'qz-spring-906',
  topic: 'spring',
  q: `Điều gì xảy ra nếu biểu thức trong {{ @PreAuthorize }} trả về false?`,
  options: [
    'Lỗi biên dịch',
    'Ứng dụng tiếp tục thực thi nhưng trả về null',
    'Ném ngoại lệ AccessDeniedException',
    'Người dùng tự động bị đăng xuất'
  ],
  answer: 2,
  explain: `**Đáp án đúng: ném ngoại lệ AccessDeniedException.**

### Vì sao đúng
Khi kiểm tra bảo mật không thành công, Spring Security ném {{ AccessDeniedException }}, từ đó được các exception handler xử lý để trả về lỗi 403 Forbidden.

### Vì sao các phương án còn lại sai
- **Lỗi biên dịch / lỗi khác**: không phải hành vi chuẩn.
- **Ứng dụng tiếp tục**: Security không được phép tiếp tục khi fail.
- **Tự động đăng xuất**: không phải hành vi mặc định khi sai quyền.

> Senior tip: tùy chỉnh ExceptionTranslationFilter để trả về mã 403 hoặc 401 theo chuẩn của dự án. Với REST API, trả mã lỗi cùng Problem Details (xem câu qz-api-017) là thực tiễn tốt nhất.`
},
{
  id: 'qz-spring-907',
  topic: 'spring',
  q: `Tại sao nên sử dụng {{ BCryptPasswordEncoder }} thay vì SHA-256?`,
  options: [
    'Nhanh hơn SHA-256',
    'BCrypt hỗ trợ salt tự động và chi phí tính toán cao',
    'SHA-256 đã bị hacker bẻ khóa hoàn toàn',
    'BCrypt là chuẩn bắt buộc của Spring'
  ],
  answer: 1,
  explain: `**Đáp án đúng: BCrypt hỗ trợ salt tự động và chi phí tính toán cao.**

### Vì sao đúng
BCrypt là một hàm băm mật khẩu có tính năng "salt" tự động và có tham số "cost factor" để chống lại các cuộc tấn công brute-force. SHA-256 (không có salt) là hàm băm tổng quát, không dành riêng cho mật khẩu.

### Vì sao các phương án còn lại sai
- **Nhanh hơn**: BCrypt cố tình làm chậm để bảo mật; nhanh hơn là bất lợi.
- **SHA-256 bị bẻ khóa**: sai, SHA-256 vẫn tốt, nhưng thiếu muối (salt) và quá nhanh để brute-force.
- **Chuẩn bắt buộc**: Spring Security hỗ trợ nhiều encoder (Argon2, SCrypt), BCrypt chỉ là mặc định khuyến nghị.

> Senior tip: lưu ý "cost factor" trong BCrypt. Khi hardware mạnh hơn, hãy tăng cost factor để giữ độ trễ băm mật khẩu ở mức an toàn (thường > 100ms).`
},
{
  id: 'qz-spring-908',
  topic: 'spring',
  q: `Password Encoder trong Spring Security cần đảm bảo điều gì?`,
  options: [
    'Mật khẩu được mã hóa phải có thể giải mã ngược',
    'Mật khẩu được băm phải một chiều và khó đoán',
    'Mật khẩu phải được lưu dưới dạng Base64',
    'Sử dụng mã hóa đối xứng AES'
  ],
  answer: 1,
  explain: `**Đáp án đúng: mật khẩu được băm phải một chiều và khó đoán.**

### Vì sao đúng
Mật khẩu lưu trong DB phải được băm một chiều. Không được phép giải mã ngược mật khẩu gốc. Salt giúp mỗi lần băm một mật khẩu giống nhau ra kết quả khác nhau.

### Vì sao các phương án còn lại sai
- **Giải mã ngược**: vi phạm nguyên tắc băm mật khẩu.
- **Lưu dạng Base64 / Mã hóa đối xứng**: Base64 không phải mã hóa, mã hóa đối xứng (như AES) cho phép giải mã, không an toàn để lưu mật khẩu.

> Senior tip: luôn lưu password băm; nếu DB lộ, kẻ tấn công cũng không có mật khẩu của người dùng. Dùng DelegatingPasswordEncoder nếu muốn hỗ trợ nhiều thuật toán băm cũ/mới song song để migrate.`
},
{
  id: 'qz-spring-909',
  topic: 'spring',
  multi: true,
  q: `Khi cấu hình JWT Resource Server, những thông tin nào cần xác thực từ token? (Chọn 2)`,
  options: [
    'Chữ ký của token (Signature)',
    'Thời gian hết hạn (Expiration)',
    'Màu sắc của token',
    'IP của người dùng',
    'Password người dùng'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: chữ ký của token và thời gian hết hạn.**

### Vì sao đúng
- Xác thực chữ ký đảm bảo token đến từ nguồn tin cậy.
- Kiểm tra thời gian hết hạn đảm bảo token còn hiệu lực.

### Vì sao các phương án còn lại sai
- **Màu sắc / IP / Password**: không nằm trong JWT.

> Senior tip: luôn kiểm tra {{iss}} (issuer) và {{aud}} (audience) của JWT để bảo đảm nó được phát hành cho đúng ứng dụng của bạn, tránh bị lừa bởi token hợp lệ nhưng phát hành cho ứng dụng khác của cùng nhà cung cấp.`
},
{
  id: 'qz-spring-910',
  topic: 'spring',
  q: `Phương thức {{ jwt() }} trong SecurityFilterChain có tác dụng gì?`,
  options: [
    'Vô hiệu hóa hoàn toàn bảo mật',
    'Cấu hình ứng dụng thành JWT Resource Server',
    'Chỉ dùng để tạo mới JWT',
    'Chỉ dùng để xóa JWT'
  ],
  answer: 1,
  explain: `**Đáp án đúng: cấu hình ứng dụng thành JWT Resource Server.**

### Vì sao đúng
{{ jwt() }} trong cấu hình chuỗi bộ lọc bảo mật chỉ định rằng ứng dụng sẽ đóng vai trò là một JWT Resource Server để xác thực các JWT nhận được trong header Authorization.

### Vì sao các phương án còn lại sai
- **Vô hiệu hóa hoàn toàn**: không đúng.
- **Tạo mới / Xóa**: Resource Server chỉ xác thực, không phát hành token (việc của Authorization Server).

> Senior tip: JWT Resource Server chỉ kiểm tra token. Để quản lý danh sách token bị thu hồi, hãy tích hợp với denylist hoặc tra cứu tại Authorization Server.`
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
  id: 'qz-spring-901',
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
  id: 'qz-spring-902',
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

{
  id: 'qz-spring-066',
  topic: 'spring',
  q: `{{OrderService.create()}} có {{@Transactional}}. Bên trong gọi bean khác {{NotificationService.send()}} có {{@Transactional(propagation = Propagation.NOT_SUPPORTED)}}. {{send()}} ghi một dòng vào bảng {{notification}} rồi return. Sau đó {{create()}} ném {{RuntimeException}}.
~~~java
@Transactional
public void create(Order o) {
    orderRepo.save(o);
    notificationService.send(o);   // NOT_SUPPORTED
    throw new RuntimeException("tồn kho lỗi");
}
~~~
Dòng notification có còn trong database sau khi create() rollback không?`,
  options: [
    'Còn: NOT_SUPPORTED treo transaction của create(), send() chạy không có transaction bao quanh, mỗi lệnh ghi tự commit',
    'Không: send() tham gia transaction của create() nên bị rollback theo',
    'Không: NOT_SUPPORTED tạo transaction mới nhưng đánh dấu rollback-only',
    'Ném exception vì NOT_SUPPORTED không được phép khi đã có transaction'
  ],
  answer: 0,
  explain: `**Đáp án đúng: dòng notification vẫn còn.**

### NOT_SUPPORTED nghĩa là gì
NOT_SUPPORTED = "thực thi **không có** transaction". Nếu đang có transaction, Spring **treo** nó: gỡ resource khỏi thread, giữ nguyên connection để dùng lại sau, chạy method trong chế độ không transaction, rồi gắn lại transaction cũ khi xong. Mỗi lời gọi repository trong send() vì thế chạy trong transaction riêng của nó (hoặc autocommit) và **commit ngay**.

### Vì sao khác REQUIRES_NEW và NEVER
- {{REQUIRES_NEW}}: mở transaction **mới**, đảm bảo atomic cho toàn bộ send(); nếu lỗi giữa send() thì rollback toàn bộ phần việc của send().
- {{NOT_SUPPORTED}}: **không** có transaction nào; nếu send() ghi 3 bảng rồi lỗi ở bảng thứ 3, hai bảng đầu vẫn còn. Không có tính nguyên tử.
- {{NEVER}}: giống "không transaction", nhưng nếu **đã có** transaction thì ném exception. NOT_SUPPORTED thì treo và tiếp tục.

### Khi nào dùng
- Gửi thông báo/log/audit không được phép làm hỏng nghiệp vụ chính.
- Gọi dịch vụ ngoài (HTTP, email) mà không muốn giữ transaction DB mở.
Nhưng nếu send() cần nhiều lệnh DB phải thành công cùng nhau, NOT_SUPPORTED là sai — khi đó dùng REQUIRES_NEW.

### Cạm bẫy
NOT_SUPPORTED chỉ treo transaction ở mức Spring; connection của create() vẫn bị giữ, nên pool vẫn tốn 1 connection. Nếu send() gọi dịch vụ chậm, transaction cha vẫn mở suốt thời gian đó → giữ lock và connection lâu, dễ nghẽn pool.

### Trả lời phỏng vấn
"NOT_SUPPORTED chạy không transaction và treo transaction đang mở. Nó phù hợp cho việc phụ như gửi thông báo, nhưng không đảm bảo atomic cho phần việc đó. Nếu cần atomic độc lập thì dùng REQUIRES_NEW; nếu cần cấm gọi ngoài transaction thì dùng NEVER."

### Vì sao các phương án còn lại sai
- **Tham gia transaction cha**: đó là REQUIRED/SUPPORTS, không phải NOT_SUPPORTED.
- **Tạo transaction mới nhưng rollback-only**: mô tả sai; NOT_SUPPORTED không tạo transaction mới.
- **Ném exception**: chỉ NEVER mới ném khi đã có transaction.`
},
{
  id: 'qz-spring-067',
  topic: 'spring',
  q: `Một method cần **ba ranh giới transaction độc lập**: bước 1 commit, bước 2 commit, bước 3 commit; nếu bước 3 lỗi thì bước 1 và 2 vẫn giữ. Cách nào đúng?
~~~java
public void importAll(List<Row> rows) {
    // cần 3 transaction riêng
}
~~~`,
  options: [
    'Đặt @Transactional lên method rồi gọi this.step2(), this.step3(): mỗi method có transaction riêng',
    'Dùng TransactionTemplate với PROPAGATION_REQUIRES_NEW cho từng bước (hoặc tách thành 3 bean riêng gọi qua proxy)',
    'Đặt @Transactional lên cả 3 method rồi gọi this.step1(): Spring sẽ tạo 3 transaction',
    'Đặt @Transactional(readOnly = false) là đủ để có nhiều transaction'
  ],
  answer: 1,
  explain: `**Đáp án đúng: dùng TransactionTemplate (hoặc tách bean riêng).**

### Vì sao @Transactional không đủ
{{@Transactional}} trên một method tạo **đúng một** transaction bao quanh toàn bộ method. Mọi lời gọi bên trong (kể cả method có @Transactional khác) đều tham gia transaction đó nếu propagation là REQUIRED. Bạn không thể "commit giữa method" rồi tiếp tục nếu lỗi xảy ra sau. Thêm nữa, gọi {{this.step2()}} là self-invocation → proxy bị bỏ qua → @Transactional của step2 không có tác dụng.

### TransactionTemplate
~~~java
@Service
public class ImportService {
    private final TransactionTemplate tx;   // Boot tự tạo bean nếu có PlatformTransactionManager

    public void importAll(List<Row> rows) {
        for (Row r : rows) {
            tx.execute(status -> {
                repo.save(r);
                return null;
            });   // commit (hoặc rollback) ngay sau mỗi lần execute
        }
    }
}
~~~
Mỗi {{execute}} là một ranh giới transaction riêng. Nếu {{repo.save}} ném RuntimeException, TransactionTemplate rollback phần việc trong execute đó rồi ném exception; bạn có thể bắt và đi tiếp với row kế tiếp.

### Cách khác
- Tách 3 bean, mỗi bean một method @Transactional(REQUIRED), gọi qua proxy của bean khác. Mỗi lời gọi là một transaction riêng.
- Hoặc dùng {{TransactionTemplate}} với {{PROPAGATION_REQUIRES_NEW}} nếu cần transaction độc lập thực sự (connection riêng).

### Khi nào nên dùng
- Import/xử lý hàng loạt, mỗi phần tử là một đơn vị công việc.
- Cần retry từng phần, cần biết chính xác phần nào thành công.
- Cần transaction ở tầng service mà không muốn rải annotation.
Nhược điểm: code dài hơn, phải tự xử lý exception, dễ quên rollback nếu dùng lambda trả về.

### Trả lời phỏng vấn
"@Transactional chỉ tạo một ranh giới cho cả method, nên nhiều commit trong một method phải dùng TransactionTemplate hoặc tách bean. Tôi thường dùng TransactionTemplate cho import hàng loạt để mỗi dòng là một transaction: lỗi dòng nào thì dòng đó rollback, các dòng khác vẫn vào."

### Vì sao các phương án còn lại sai
- **this.step2() với @Transactional**: self-invocation, advice không chạy.
- **@Transactional trên cả 3 method rồi gọi this**: vẫn chỉ có một transaction của method cha; các lời gọi this không tạo transaction mới.
- **readOnly = false**: chỉ là cờ, không tạo thêm transaction.`
},
{
  id: 'qz-spring-068',
  topic: 'spring',
  q: `{{OrderService.create()}} có {{@Transactional}}: insert order, rồi ném công việc sang thread pool {{taskExecutor.submit(() -> auditService.save(id))}}. Thread mới có tham gia transaction của {{create()}} không?
~~~java
@Transactional
public void create(Order o) {
    orderRepo.save(o);
    taskExecutor.submit(() -> auditService.save(o.getId()));
}
~~~`,
  options: [
    'Có, transaction được chia sẻ cho mọi thread trong cùng executor',
    'Không: transaction gắn với thread hiện tại qua ThreadLocal; thread mới không có transaction, và có thể chạy trước khi create() commit',
    'Có, nếu dùng @Async thay vì executor.submit',
    'Có, nếu executor là ThreadPoolTaskExecutor'
  ],
  answer: 1,
  explain: `**Đáp án đúng: không, transaction không lan sang thread khác.**

### Transaction gắn với thread
Spring quản lý transaction bằng {{TransactionSynchronizationManager}}, dùng {{ThreadLocal}} để lưu connection và trạng thái transaction. Thread mới không có ThreadLocal đó → không có transaction. Đây không phải giới hạn riêng của Spring: JDBC connection, Hibernate Session, Security context, MDC (traceId) đều là thread-bound.

### Hai hậu quả
1. **Không thấy dữ liệu chưa commit**: thread mới có thể đọc DB trước khi create() commit → không thấy order (với READ_COMMITTED thì chắc chắn không thấy).
2. **Không rollback theo**: nếu create() rollback, audit vẫn chạy và ghi "đã tạo đơn" — dữ liệu sai. Nếu audit chạy trước khi commit và đọc lại, nó thấy "không có đơn".

### Cách đúng
- Dùng {{@TransactionalEventListener(phase = AFTER_COMMIT)}} hoặc {{TransactionSynchronizationManager.registerSynchronization(...).afterCommit}} để chỉ chạy sau khi commit.
- Dùng {{TransactionTemplate}} với REQUIRES_NEW nếu công việc nền cần transaction riêng.
- Nếu cần lan context sang thread khác, dùng {{TaskDecorator}} (hoặc thư viện context propagation) — nhưng transaction thì không nên "lan", vì nó là tài nguyên gắn với một connection.

### Trả lời phỏng vấn
"Transaction là thread-bound, nên @Async hay executor.submit không tham gia transaction của caller. Tôi dùng AFTER_COMMIT hoặc TransactionTemplate REQUIRES_NEW cho việc nền, để tránh đọc dữ liệu chưa commit và tránh audit khi nghiệp vụ rollback."

### Vì sao các phương án còn lại sai
- **Chia sẻ cho mọi thread**: transaction gắn với một thread và một connection, không chia sẻ.
- **@Async thì có**: @Async cũng chạy trên thread khác, vẫn không có transaction; nếu gọi this.asyncMethod() thì còn không cả async.
- **ThreadPoolTaskExecutor thì có**: executor chỉ là thread pool, không liên quan tới transaction.`
},
{
  id: 'qz-spring-069',
  topic: 'spring',
  q: `Trong ứng dụng web, bean {{UserContext}} khai báo {{@SessionScope}} (mỗi session một instance) và được inject vào controller singleton. Hai người dùng A và B đăng nhập đồng thời. Phát biểu nào đúng? (Chọn 2)
~~~java
@Component
@SessionScope   // tương đương @Scope("session") với proxyMode = TARGET_CLASS
public class UserContext {
    private String userId;
    // getter/setter
}

@RestController
public class ProfileController {
    private final UserContext ctx;   // inject vào singleton
    ...
}
~~~`,
  multi: true,
  options: [
    'Mỗi session có một instance UserContext riêng; controller giữ scoped proxy, mỗi lời gọi phân giải theo session của request hiện tại',
    'Controller là singleton nên cả A và B dùng chung một instance UserContext',
    'Nếu dùng @Scope("session") với proxyMode mặc định NO rồi inject vào singleton, ứng dụng fail lúc khởi động; cần @SessionScope hoặc proxyMode = TARGET_CLASS',
    'Session scope hoạt động bình thường trong @Scheduled thread vì Spring tự tạo session'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: mỗi session một instance, và phải dùng scoped proxy.**

### Session scope là gì
{{session}} scope: một instance cho mỗi {{HttpSession}} — một phiên làm việc của trình duyệt, nhận diện bằng cookie JSESSIONID. Khi user A đăng nhập, session A có UserContext riêng; user B có instance khác. Dữ liệu không lẫn.

### Vì sao cần proxy
Controller là singleton, chỉ được tạo một lần. Nếu Spring inject thẳng instance session vào field, nó phải chọn một session tại thời điểm khởi động — vô nghĩa. Vì vậy Spring inject một **scoped proxy**: object cùng kiểu, mọi method ủy quyền cho instance thật của session hiện tại. Proxy phân giải theo {{RequestContextHolder}} và session gắn với thread.

### Cạm bẫy proxyMode
{{@Scope}} có {{proxyMode}} mặc định là {{NO}}. Nếu bạn viết {{@Scope("session")}} rồi inject vào singleton, lúc khởi động Spring sẽ cố tạo bean session (không có session nào) và ném lỗi kiểu "Scope 'session' is not active for the current thread; consider defining a scoped proxy". Cách đúng:
- Dùng {{@SessionScope}} (meta-annotation, đã đặt sẵn TARGET_CLASS).
- Hoặc {{@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)}}.
- Hoặc dùng {{ObjectProvider<UserContext>}} / {{@Lookup}}.

### Cạm bẫy thread
Scoped proxy dựa vào ThreadLocal. Nếu gọi {{ctx.getUserId()}} từ thread khác (ví dụ @Async, executor), sẽ không có session → ném lỗi (giống request scope). Session không "lan" sang thread mới.

### Trả lời phỏng vấn
"Session scope tạo một instance mỗi HttpSession. Inject vào singleton phải dùng scoped proxy (@SessionScope hoặc proxyMode TARGET_CLASS), nếu không sẽ fail lúc khởi động. Proxy phân giải theo request hiện tại, nên gọi từ thread không có session sẽ lỗi."

### Vì sao các phương án còn lại sai
- **Dùng chung một instance**: đó là hành vi của singleton; scoped proxy đảm bảo mỗi session có instance riêng.
- **Hoạt động trong @Scheduled**: không có session/request context trong thread scheduled; scoped proxy sẽ ném IllegalStateException.`
},
{
  id: 'qz-spring-070',
  topic: 'spring',
  q: `Bean {{ReportData}} có {{@Scope("prototype")}} và method {{@PreDestroy public void close()}}. Bean này được inject vào singleton {{ReportService}} và dùng trong nhiều request. Khi ứng dụng tắt, {{close()}} có được gọi không?`,
  options: [
    'Có, Spring gọi @PreDestroy cho mọi bean, kể cả prototype',
    'Không: Spring không giữ tham chiếu tới các instance prototype đã tạo, nên không gọi destroy callback cho chúng; phải tự đóng resource',
    'Có, nhưng chỉ khi instance prototype được inject vào một singleton',
    'Có, nếu đặt thêm @Bean(destroyMethod = "close")'
  ],
  answer: 1,
  explain: `**Đáp án đúng: không được gọi.**

### Vì sao
Với singleton, container giữ instance trong registry và gọi {{@PreDestroy}}/{{DisposableBean.destroy()}}/destroy-method khi đóng context. Với {{prototype}}, container tạo instance, giao cho bạn, rồi **không giữ tham chiếu** — nó không biết còn bao nhiêu instance, cũng không biết khi nào bạn dùng xong. Vì vậy không có "thời điểm hủy" để gọi callback.

### Hậu quả
Nếu ReportData giữ resource (FileChannel, InputStream, thread pool, kết nối tự tạo), việc không đóng gây **leak**: file lock không nhả, thread không dừng, heap tăng dần. Triệu chứng trên production: sau vài ngày app chậm dần, "Too many open files", hoặc không deploy được vì file bị lock.

### Cách xử lý
- Nếu instance được tạo trong method: dùng try-with-resources (nếu class implement AutoCloseable).
- Nếu cần container quản lý: dùng {{@Bean(destroyMethod = "close")}} cho bean **singleton**, hoặc dùng {{ObjectProvider}} và tự đóng sau khi dùng.
- Nếu dùng prototype cho state tạm, đừng giữ resource; đóng ngay trong method.

### Trả lời phỏng vấn
"Prototype không được container theo dõi vòng đời, nên @PreDestroy không chạy. Tôi tránh giữ resource trong prototype; nếu cần thì dùng try-with-resources hoặc @Bean(destroyMethod) với singleton."

### Vì sao các phương án còn lại sai
- **Có cho mọi bean**: chỉ singleton (và các scope do container quản lý) mới có destroy callback.
- **Chỉ khi inject vào singleton**: inject vào singleton không làm container giữ instance prototype; singleton giữ một instance, các instance khác vẫn không được theo dõi.
- **@Bean(destroyMethod)**: destroyMethod áp dụng cho bean do container tạo và quản lý (singleton); không cứu được prototype.`
},
{
  id: 'qz-spring-071',
  topic: 'spring',
  q: `Hai auto-configuration của thư viện:
~~~java
@AutoConfiguration
public class FooAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public Foo foo() { return new Foo(); }
}

@AutoConfiguration
public class BarAutoConfiguration {
    @Bean
    public Bar bar(Foo foo) { return new Bar(foo); }   // Bar cần Foo
}
~~~
{{BarAutoConfiguration}} được Spring xử lý **trước** {{FooAutoConfiguration}}. Ứng dụng khởi động thế nào?`,
  options: [
    'Bình thường: Spring tự sắp thứ tự theo tên class',
    'Foo được tạo ngay vì có @ConditionalOnMissingBean',
    'Bar nhận foo = null và tiếp tục',
    'Ném UnsatisfiedDependencyException vì lúc tạo Bar, bean Foo chưa được đăng ký'
  ],
  answer: 3,
  explain: `**Đáp án đúng: ném lỗi vì Bar được xử lý trước khi Foo tồn tại.**

### Auto-configuration được xử lý theo thứ tự
Auto-config không tự "thông minh" theo tên hay theo quan hệ phụ thuộc. Nó được sắp theo:
1. {{@AutoConfigureBefore}} / {{@AutoConfigureAfter}} giữa các auto-config.
2. Thứ tự khai báo trong file {{AutoConfiguration.imports}} (chỉ là mặc định khi không có annotation).
3. {{@DependsOn}} cho bean.

Nếu Bar được xử lý trước Foo, lúc Bar đăng ký {{bar(Foo foo)}}, container chưa có bean definition Foo → {{NoSuchBeanDefinitionException}}, bọc trong {{UnsatisfiedDependencyException}}, ứng dụng fail lúc khởi động.

### Cách sửa
~~~java
@AutoConfiguration
@AutoConfigureAfter(FooAutoConfiguration.class)
public class BarAutoConfiguration {
    @Bean
    public Bar bar(Foo foo) { return new Bar(foo); }
}
~~~
{{@AutoConfigureAfter}} nói "hãy xử lý tôi sau FooAutoConfiguration". Nếu A khai báo after B còn B khai báo after A, Spring báo lỗi vòng lặp.

### Vì sao @ConditionalOnMissingBean không cứu
Điều kiện chỉ quyết định "có tạo bean hay không" khi auto-config được xử lý; nó không hoãn việc tạo Bar. Bar vẫn cần Foo tại thời điểm nó được xử lý.

### Khi nào gặp
Thường khi viết starter: thư viện A cung cấp hạ tầng (Foo), thư viện B cung cấp tính năng dùng Foo. Nếu người dùng thêm cả hai, thứ tự trong file imports quyết định; starter B phải khai báo @AutoConfigureAfter(A).

### Trả lời phỏng vấn
"Auto-config không tự sắp theo phụ thuộc. Tôi dùng @AutoConfigureAfter/@AutoConfigureBefore để đảm bảo bean nền được tạo trước, nếu không sẽ gặp UnsatisfiedDependencyException lúc khởi động."

### Vì sao các phương án còn lại sai
- **Tự sắp theo tên**: không có cơ chế đó; thứ tự do annotation/import quyết định.
- **@ConditionalOnMissingBean tạo Foo ngay**: nó không tạo Foo sớm hơn, chỉ bỏ qua nếu đã có.
- **foo = null**: Spring không inject null cho dependency bắt buộc; constructor injection sẽ fail.`
},
{
  id: 'qz-spring-072',
  topic: 'spring',
  q: `Auto-configuration của thư viện khai báo:
~~~java
@AutoConfiguration
public class MyCacheAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean(CacheManager.class)
    public CacheManager cacheManager() { return new SimpleCacheManager(); }
}
~~~
Ứng dụng lại có một {{@Configuration}} thông thường khai báo {{@Bean CacheManager appCache()}}. Vì sao bean của ứng dụng thắng và auto-configuration "lùi lại"?
~~~java
@Configuration
public class AppConfig {
    @Bean
    public CacheManager appCache() { return new CustomCacheManager(); }
}
~~~`,
  options: [
    'Vì Spring ưu tiên bean có tên bắt đầu bằng "app"',
    'Vì @ConditionalOnMissingBean được đánh giá trước mọi cấu hình của người dùng',
    'Vì auto-configuration được xử lý sau cấu hình của người dùng; khi điều kiện được đánh giá, bean của ứng dụng đã tồn tại',
    'Vì @ConditionalOnMissingBean chỉ xét các @Bean trong cùng class cấu hình'
  ],
  answer: 2,
  explain: `**Đáp án đúng: auto-configuration được xử lý sau cấu hình người dùng, nên điều kiện "thiếu bean" đã không còn đúng khi auto-config được xét.**

### @ConditionalOnMissingBean làm gì
Đây là **điều kiện** (condition): chỉ tạo bean nếu trong context **chưa có** bean nào cùng kiểu (mặc định xét theo type, không theo tên). Nó là cách để thư viện nói "tôi cung cấp giá trị mặc định, nhưng nếu ứng dụng đã tự khai báo thì tôi không chen vào".

### Vì sao thứ tự đảm bảo điều đó
Spring nạp cấu hình theo hai lớp:
1. Trước tiên, {{ConfigurationClassPostProcessor}} xử lý các class {{@Configuration}} của người dùng (kể cả @Bean methods) và đăng ký bean definition.
2. Sau đó mới xử lý auto-configuration (thông qua {{AutoConfigurationImportSelector}}), với thứ tự được điều chỉnh bởi {{@AutoConfigureBefore}}/{{@AutoConfigureAfter}}.

Vì vậy khi auto-config chạy, bean {{appCache}} đã nằm trong registry → điều kiện false → auto-config không tạo bean thứ hai. Kết quả: chỉ một CacheManager, và đó là bean của bạn.

### Cạm bẫy
- @ConditionalOnMissingBean chỉ đáng tin trong **auto-configuration**. Nếu bạn đặt nó trong một @Configuration thường mà class đó được xử lý **trước** một @Configuration khác khai báo cùng kiểu, điều kiện sẽ đúng (chưa có bean) và bạn vô tình tạo bean trùng.
- Nó xét theo **type**, không theo tên. Hai bean cùng type khác tên vẫn bị coi là "đã có".
- {{@AutoConfigureBefore}}/{{@AutoConfigureAfter}} chỉ sắp thứ tự giữa các auto-config với nhau, không đổi quan hệ "user config trước, auto-config sau".

### Trả lời phỏng vấn
"@ConditionalOnMissingBean là cơ chế để auto-config lùi bước. Nó hoạt động được vì auto-configuration được xử lý sau cấu hình người dùng. Tôi chỉ tin dùng nó trong auto-config; trong code nghiệp vụ thì khai báo bean tường minh để tránh phụ thuộc thứ tự."

### Vì sao các phương án còn lại sai
- **Ưu tiên tên "app"**: Spring không ưu tiên theo tiền tố tên bean; điều kiện xét theo type.
- **Đánh giá trước cấu hình người dùng**: ngược thứ tự thật; nếu trước thì auto-config đã tạo bean và ứng dụng không ghi đè được.
- **Chỉ xét cùng class**: @ConditionalOnMissingBean quét toàn bộ bean definition đã đăng ký, không giới hạn trong class.`
},
{
  id: 'qz-spring-073',
  topic: 'spring',
  q: `Bạn viết một thư viện nội bộ và muốn Spring Boot 3 tự động nạp cấu hình của nó (auto-configuration). Cách đăng ký nào đúng?`,
  options: [
    'Khai báo trong META-INF/spring.factories với key org.springframework.boot.autoconfigure.EnableAutoConfiguration',
    'Khai báo tên class trong META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports, mỗi dòng một tên đầy đủ',
    'Đánh dấu class bằng @Configuration và đặt nó trong package org.springframework.boot.autoconfigure',
    'Cả hai cách META-INF/spring.factories và AutoConfiguration.imports đều được Boot 3 chấp nhận'
  ],
  answer: 1,
  explain: `**Đáp án đúng: file AutoConfiguration.imports.**

### Vì sao đổi
Trước Spring Boot 2.7, auto-configuration được đăng ký trong {{META-INF/spring.factories}} với key {{org.springframework.boot.autoconfigure.EnableAutoConfiguration}}. Cách này chậm và khó phân tích (phải đọc cả file, parse properties). Từ Boot 2.7 nó bị đánh dấu deprecated, và **Boot 3.0 loại bỏ hoàn toàn** với auto-configuration. Thay bằng một file text:

~~~text
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.acme.cache.MyCacheAutoConfiguration
com.acme.cache.MetricsAutoConfiguration
~~~

Mỗi dòng là một tên class đầy đủ (fully-qualified name), có thể có dòng trống và dòng chú thích bắt đầu bằng {{#}}.

### Nên viết auto-config như thế nào
~~~java
@AutoConfiguration
@ConditionalOnClass(CacheManager.class)
@EnableConfigurationProperties(MyCacheProperties.class)
public class MyCacheAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public CacheManager cacheManager(MyCacheProperties props) { ... }
}
~~~
{{@AutoConfiguration}} là phiên bản chuyên dụng của {{@Configuration}} ({{proxyBeanMethods = false}}), kèm {{@AutoConfigureBefore}}/{{@AutoConfigureAfter}} để sắp thứ tự. Luôn dùng {{@ConditionalOnMissingBean}} cho bean mặc định để ứng dụng ghi đè được.

### spring.factories còn dùng không?
Còn, nhưng **không** cho auto-configuration. Nó vẫn được dùng cho các extension point khác như {{EnvironmentPostProcessor}}, {{ApplicationContextInitializer}}, {{FailureAnalyzer}}.

### Trả lời phỏng vấn
"Boot 3 bỏ spring.factories cho auto-config, chuyển sang AutoConfiguration.imports. Tôi viết auto-config bằng @AutoConfiguration, thêm điều kiện @ConditionalOnClass và @ConditionalOnMissingBean, rồi test bằng ApplicationContextRunner."

### Vì sao các phương án còn lại sai
- **spring.factories với key EnableAutoConfiguration**: đã bị loại bỏ ở Boot 3.0, không còn hiệu lực.
- **Đặt class trong package org.springframework.boot.autoconfigure**: package không quyết định việc nạp; không có file imports thì class không bao giờ được xử lý.
- **Cả hai đều được**: chỉ AutoConfiguration.imports có hiệu lực cho auto-configuration.`
},
{
  id: 'qz-spring-074',
  topic: 'spring',
  q: `Ứng dụng Boot 2.7 có {{spring.redis.host: 10.0.0.5}} trong application.yml. Sau khi nâng lên Boot 3.2, ứng dụng vẫn khởi động nhưng lại kết nối {{localhost:6379}} và fail. Vì sao?`,
  options: [
    'Boot 3 đổi prefix thành {{spring.data.redis.*}}; {{spring.redis.*}} không còn được bind nên bị bỏ qua im lặng, giá trị mặc định là localhost',
    'Boot 3 bỏ hoàn toàn Redis, phải tự viết cấu hình',
    'Thuộc tính phải viết {{redis.host}} (không có prefix) mới đọc được',
    'Thuộc tính chỉ đọc được từ file .properties, không đọc từ .yml'
  ],
  answer: 0,
  explain: `**Đáp án đúng: prefix đã đổi thành spring.data.redis.*, property cũ bị bỏ qua.**

### Chuyện gì xảy ra
Từ Spring Boot 3.0, các thuộc tính Redis chuyển từ {{spring.redis.*}} sang {{spring.data.redis.*}} (đồng bộ với MongoDB, Elasticsearch...). Nếu bạn giữ {{spring.redis.host}}, không có @ConfigurationProperties nào bind prefix đó → giá trị bị **bỏ qua im lặng** (unknown property). Redis auto-configuration dùng giá trị mặc định {{localhost:6379}} → kết nối sai.

### Vì sao "im lặng"
Đây là điểm nguy hiểm: Spring không fail khi gặp property lạ. Nếu bạn dùng {{@ConfigurationProperties(ignoreUnknownFields = false)}} cho class của mình thì sẽ báo lỗi, nhưng các property lõi của Boot không hoạt động như vậy. Vì thế lỗi chỉ lộ ra khi app cố kết nối Redis và nhận {{Connection refused}}.

### Cách phòng ngừa
- Đọc release notes / migration guide khi nâng major version.
- Dùng IDE autocomplete: gõ {{spring.data.redis.}} trong application.yml sẽ thấy danh sách property hợp lệ (dựa trên spring-configuration-metadata.json).
- Chạy app với profile test và kiểm tra log kết nối.
- Đặt {{spring.data.redis.timeout}} hợp lý để fail nhanh thay vì treo.

### Trả lời phỏng vấn
"Boot 3 đổi spring.redis.* thành spring.data.redis.*. Property cũ không bind nên bị bỏ qua, app dùng localhost và lỗi chỉ lộ lúc kết nối. Tôi luôn kiểm tra migration guide và dùng IDE autocomplete sau khi nâng major."

### Vì sao các phương án còn lại sai
- **Bỏ Redis**: sai, Redis vẫn được hỗ trợ (spring-boot-starter-data-redis).
- **redis.host không prefix**: không có @ConfigurationProperties nào bind như vậy.
- **Chỉ đọc .properties**: Boot đọc cả .properties và .yml; vấn đề là prefix, không phải định dạng.`
},
{
  id: 'qz-spring-075',
  topic: 'spring',
  q: `Bạn muốn theo dõi hai thứ trong ứng dụng Spring Boot 3: (a) số đơn hàng tạo thành công, (b) thời gian trung bình mỗi lần gọi {{PricingClient.quote()}}. Cách nào đúng với Micrometer?
~~~java
@Service
public class OrderService {
    private final MeterRegistry registry;
    private final PricingClient pricing;
    ...
}
~~~`,
  options: [
    'Bơm MeterRegistry rồi dùng Counter.builder("order.created").tag("status","success").register(registry).increment(); với thời gian dùng Timer.builder("pricing.quote").register(registry).record(() -> pricing.quote()) (hoặc @Timed nếu đã đăng ký TimedAspect)',
    'Dùng System.currentTimeMillis() rồi log ra file, sau đó viết script tính trung bình',
    'Chỉ cần annotation @Counted của Spring Boot là có metric, không cần MeterRegistry',
    'Metric chỉ được ghi nhận khi bạn mở endpoint metrics trên HTTP; nếu không mở thì không có gì được đo'
  ],
  answer: 0,
  explain: `**Đáp án đúng: dùng MeterRegistry với Counter và Timer (hoặc @Timed).**

### Micrometer là gì
Micrometer là "thư viện đo" của Spring: nó cung cấp một API chung để ghi số liệu (metric), còn việc hiển thị/lưu trữ do backend lo (Prometheus, Datadog, CloudWatch, New Rel...). Nhờ vậy code nghiệp vụ không dính chặt vào một hệ thống giám sát. Spring Boot tự động tạo {{MeterRegistry}} và cấu hình registry phù hợp với dependency bạn thêm.

Các loại meter hay dùng:
- {{Counter}}: chỉ tăng, dùng đếm số lần ("số đơn thành công", "số request lỗi").
- {{Timer}}: đếm số lần **và** đo thời gian; có percentile, trung bình, max.
- {{Gauge}}: giá trị tức thời (ví dụ số phần tử trong queue).
- {{DistributionSummary}}: phân phối các giá trị (ví dụ kích thước payload).

### Tags (nhãn)
{{tag("status","success")}} gắn nhãn cho metric, giúp tách số liệu theo chiều (ví dụ {{order.created}} có tag {{status=success|failed}}). Mỗi tag tạo thêm một time series, nên **đừng** dùng tag có giá trị vô hạn như {{orderId}}, {{userId}} — đó là "cardinality explosion", làm hệ thống giám sát sập. Nếu cần tag chung cho mọi metric, dùng {{management.metrics.tags.env=prod}}.

### Đo thời gian
~~~java
Timer.builder("pricing.quote")
     .tag("provider", "primary")
     .register(registry)
     .record(() -> pricing.quote());
~~~
Hoặc annotation {{@Timed("pricing.quote")}} trên method — nhưng cần có bean {{TimedAspect}} (thường khai báo thủ công) và aspectjweaver trên classpath; nếu không, annotation bị bỏ qua im lặng.

### Trả lời phỏng vấn
"Tôi dùng Micrometer: Counter cho số lượng, Timer cho latency, tag vừa phải để tránh cardinality explosion. Metric được expose qua /actuator/prometheus và Prometheus pull định kỳ. Tôi không log rồi tính tay vì không có histogram/percentile và không tạo được dashboard."

### Vì sao các phương án còn lại sai
- **Log rồi tính bằng script**: không có histogram, percentile, không gắn nhãn, rất khó so sánh qua thời gian; đây là chống-mẫu.
- **@Counted của Spring Boot**: @Counted là annotation của Micrometer ({{io.micrometer.core.annotation.Counted}}), không phải của Spring Boot, và vẫn cần aspect + registry; không có "tự động" như mô tả.
- **Chỉ đo khi mở endpoint**: việc ghi metric hoàn toàn độc lập với việc expose endpoint HTTP; exposure chỉ quyết định có nhìn thấy qua HTTP hay không.`
},
{
  id: 'qz-spring-076',
  topic: 'spring',
  q: `Bạn muốn Prometheus (hệ thống giám sát theo mô hình **pull**, cứ 15 giây gọi một endpoint để lấy metric) thu thập số liệu từ ứng dụng Spring Boot 3. Cấu hình nào đúng?`,
  options: [
    'Mặc định Boot 3 đã expose /actuator/prometheus, chỉ cần thêm spring-boot-starter-actuator',
    'Chỉ cần khai báo management.endpoints.web.exposure.include=prometheus, không cần thêm dependency nào',
    'Thêm dependency micrometer-registry-prometheus (bản Boot 3) và khai báo management.endpoints.web.exposure.include=prometheus; endpoint trả về metric ở định dạng text',
    'Viết một @RestController tự đọc MeterRegistry rồi trả JSON'
  ],
  answer: 2,
  explain: `**Đáp án đúng: cần registry Prometheus + expose endpoint prometheus.**

### Vì sao cần dependency
Micrometer là API trung lập; để "biên dịch" metric sang định dạng mà Prometheus hiểu, cần một **registry** chuyên biệt. Thêm {{io.micrometer:micrometer-registry-prometheus}} (Boot 3) thì auto-configuration tạo bean {{PrometheusMeterRegistry}} và một endpoint {{/actuator/prometheus}}. Không có dependency này, endpoint {{prometheus}} không tồn tại.

### Vì sao cần expose
Actuator chỉ expose một số endpoint mặc định ({{health}} là ví dụ). {{prometheus}} **không** nằm trong nhóm mặc định, nên phải khai báo:
~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
~~~
Đừng dùng {{include: "*"}} trên production: nó mở luôn {{env}}, {{heapdump}}, {{loggers}}, {{threaddump}} — kẻ tấn công có thể đọc cấu hình, mật khẩu, dump heap.

### Prometheus hoạt động thế nào
Prometheus là hệ thống giám sát kiểu pull: nó tự gọi {{/actuator/prometheus}} mỗi 15 giây (hoặc theo {{scrape_interval}}), lưu các mẫu theo thời gian, rồi cho phép truy vấn bằng PromQL. Endpoint trả về text đơn giản:
~~~text
# HELP http_server_requests_seconds
# TYPE http_server_requests_seconds summary
http_server_requests_seconds_count{method="GET",uri="/orders",status="200"} 12
http_server_requests_seconds_sum{method="GET",uri="/orders",status="200"} 0.48
~~~
Mỗi dòng là một metric + các tag (label). Đây là lý do tag có giá trị vô hạn (orderId) làm Prometheus "nổ": số dòng tăng vô hạn.

### An toàn
Đặt endpoint quản trị trên port riêng ({{management.server.port=8081}}), hoặc bảo vệ bằng Spring Security (chỉ cho network nội bộ/VPN truy cập). Metric có thể chứa thông tin nhạy cảm (tên API nội bộ, mã lỗi).

### Trả lời phỏng vấn
"Prometheus pull /actuator/prometheus. Tôi thêm micrometer-registry-prometheus, expose đúng endpoint đó, dùng common tags để gắn env/service, và bảo vệ endpoint bằng security hoặc management port riêng. Tôi không dùng expose '*' vì rất rủi ro."

### Vì sao các phương án còn lại sai
- **Mặc định đã expose**: sai, mặc định chỉ có health (và info nếu cấu hình). Prometheus không tự có.
- **Không cần dependency**: sai, thiếu registry thì không có bean và endpoint.
- **Tự viết controller trả JSON**: không sai về nguyên tắc nhưng thừa và sai định dạng: Prometheus cần text format; hơn nữa Micrometer đã làm việc này sẵn, tự viết dễ sai và tốn công bảo trì.`
},
{
  id: 'qz-spring-077',
  topic: 'spring',
  q: `Bạn dùng constructor binding với record:
~~~java
@ConfigurationProperties(prefix = "app.pool")
public record PoolProps(
    @DefaultValue("10") int size,
    @DefaultValue("30s") Duration timeout,
    List<String> hosts
) {}
~~~
application.yml có {{app.pool.hosts: db1,db2}}. Những phát biểu nào đúng? (Chọn 2)`,
  multi: true,
  options: [
    'Duration không bind được từ chuỗi "30s", phải khai báo kiểu long mili-giây',
    'Duration bind được từ "30s": Spring hỗ trợ cả ISO-8601 (PT30S) và dạng đơn giản có đơn vị (s, ms, m...)',
    'List<String> không bind được từ chuỗi "db1,db2" ngăn cách bằng dấu phẩy; phải dùng YAML list',
    '@DefaultValue chỉ dùng cho constructor binding; với field binding, giá trị mặc định là giá trị khởi tạo của field',
    'Từ Boot 3.0, constructor binding vẫn bắt buộc khai báo @ConstructorBinding trên constructor'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: (2) Duration bind được từ "30s", và (4) @DefaultValue dùng cho constructor binding.**

### Constructor binding là gì
Thay vì tạo object rỗng rồi set từng field (field binding), Spring gọi **constructor** với các giá trị đã chuyển đổi từ cấu hình. Record là ứng viên hoàn hảo vì immutable (không có setter). Từ Spring Boot 3.0, **không cần** {{@ConstructorBinding}} nữa nếu class chỉ có một constructor — Spring tự nhận ra. (Ở Boot 2.x thì phải khai báo.)

### @DefaultValue
Khi property không có trong file cấu hình, giá trị tham số constructor sẽ là null/0 nếu không có gì thay thế. {{@DefaultValue("10")}} cung cấp giá trị dự phòng ngay lúc bind. Với **field binding**, @DefaultValue không có tác dụng; giá trị mặc định là giá trị khởi tạo của field (ví dụ {{private int size = 10;}}).

### Chuyển đổi Duration
Spring có sẵn converter cho {{Duration}}: nhận ISO-8601 ({{PT30S}}, {{PT5M}}) và dạng đơn giản có hậu tố đơn vị ({{30s}}, {{500ms}}, {{10m}}, {{2h}}). Nếu không có đơn vị, giá trị được hiểu là mili-giây. Đây là lý do nên dùng {{Duration}} thay vì {{long}}: code đọc rõ nghĩa, không có "magic number" 30000.

### List từ chuỗi
Relaxed binding cho phép {{db1,db2}} → {{List.of("db1","db2")}}: Spring tách theo dấu phẩy. List trong YAML ({{hosts: [db1, db2]}}) cũng được. Nếu phần tử cần chuyển đổi (ví dụ {{Duration}}), mỗi phần tử được convert riêng.

### Cạm bẫy
- Record với field {{int}} mà thiếu property: binding fail (không có null cho primitive), khác với {{Integer}}.
- Thiếu {{@DefaultValue}} cho {{List}}: giá trị null, code phải xử lý null.
- Muốn validate, thêm {{@Validated}} trên class và các ràng buộc {{jakarta.validation.constraints}} trên record component; lỗi sẽ ném lúc khởi động (fail fast).

### Trả lời phỏng vấn
"Tôi dùng constructor binding với record vì immutable và fail-fast. @DefaultValue cho giá trị mặc định, Duration để không dùng magic number, và @Validated + jakarta validation để lỗi cấu hình lộ ngay lúc khởi động thay vì lúc chạy."

### Vì sao các phương án còn lại sai
- **Duration không bind được**: sai, đây là converter có sẵn; dùng long sẽ mất tính tự giải thích.
- **List không bind được từ chuỗi phẩy**: sai, relaxed binding tách theo dấu phẩy.
- **Vẫn bắt buộc @ConstructorBinding**: sai từ Boot 3.0; annotation này không còn cần với constructor đơn.`
},
{
  id: 'qz-spring-078',
  topic: 'spring',
  q: `Record {{PoolProps}} có field {{maxEntries}} (kiểu Integer). application.yml:
~~~yaml
app:
  pool:
    max-entries: 100
    unknown-thing: 5
~~~
Điều gì xảy ra khi bind?`,
  options: [
    'maxEntries nhận 100 (relaxed binding: max-entries → maxEntries); unknown-thing bị bỏ qua vì ignoreUnknownFields mặc định true',
    'Bind thất bại vì tên field là maxEntries còn YAML là max-entries',
    'Bind thất bại vì có property lạ unknown-thing',
    'maxEntries = null vì record không hỗ trợ relaxed binding'
  ],
  answer: 0,
  explain: `**Đáp án đúng: maxEntries = 100; unknown-thing bị bỏ qua.**

### Relaxed binding (bind "dễ tính")
Spring không yêu cầu tên trong file cấu hình trùng khít tên field. Nó chấp nhận nhiều dạng cho cùng một thuộc tính: {{max-entries}} (kebab-case), {{maxEntries}} (camelCase), {{max_entries}} (snake_case), {{MAX_ENTRIES}} (uppercase). Đây là lý do application.yml thường dùng kebab-case còn code dùng camelCase mà vẫn khớp.

### ignoreUnknownFields
Mặc định {{ignoreUnknownFields = true}}: property không tìm được field tương ứng thì **bỏ qua im lặng**. Ở ví dụ trên, {{unknown-thing}} không ảnh hưởng gì. Nếu đặt {{ignoreUnknownFields = false}}, ứng dụng sẽ **fail lúc khởi động** với lỗi binding — rất hữu ích để bắt lỗi chính tả cấu hình sớm (ví dụ {{max-entires}}).

Lưu ý thêm: {{ignoreInvalidFields}} mặc định **false**, nghĩa là nếu giá trị sai kiểu (ví dụ {{max-entries: "abc"}}) thì vẫn báo lỗi dù ignoreUnknownFields = true. Ba cờ này khác nhau: "field lạ" (unknown) khác "field có nhưng giá trị sai" (invalid).

### Vì sao điều này quan trọng
- Giúp đổi cách đặt tên giữa YAML/properties mà không phải sửa code.
- Nhưng cũng dễ **âm thầm bỏ sót** cấu hình sai chính tả: {{max-entires: 100}} sẽ bị bỏ qua, field nhận null, và bạn chỉ phát hiện khi có bug. Với cấu hình quan trọng, cân nhắc {{ignoreUnknownFields = false}} trong môi trường test.

### Trả lời phỏng vấn
"Relaxed binding cho phép kebab-case ánh xạ sang camelCase. ignoreUnknownFields mặc định true nên property lạ bị bỏ qua; tôi thường bật false ở môi trường CI để bắt lỗi chính tả sớm, còn ignoreInvalidFields vẫn false để giá trị sai kiểu vẫn fail."

### Vì sao các phương án còn lại sai
- **Tên phải trùng khít**: sai, relaxed binding chính là để xử lý việc này.
- **Fail vì property lạ**: chỉ fail khi ignoreUnknownFields = false; mặc định là bỏ qua.
- **Record không hỗ trợ relaxed binding**: sai, constructor binding của record vẫn dùng chung cơ chế relaxed binding.`
},
{
  id: 'qz-spring-079',
  topic: 'spring',
  q: `Ứng dụng Spring Boot 3.2 cần gọi một API nội bộ bằng HTTP GET và đọc JSON. Cách nào đúng với {{RestClient}} (Spring Framework 6.1+)?`,
  options: [
    'RestClient là annotation để khai báo client interface, dùng giống @FeignClient',
    'RestClient chỉ hỗ trợ bất đồng bộ (async), bắt buộc trả về CompletableFuture',
    'RestClient không có builder riêng, phải cấu hình qua RestTemplateBuilder',
    'Dùng RestClient.create(baseUrl) hoặc RestClient.builder()...build(), rồi chain .get().uri("/orders/{id}", id).retrieve().body(Order.class): đồng bộ, fluent, có message converter và xử lý lỗi qua onStatus'
  ],
  answer: 3,
  explain: `**Đáp án đúng: RestClient là client HTTP đồng bộ, API fluent, tạo bằng builder/factory.**

### RestClient là gì
RestClient xuất hiện ở Spring Framework 6.1 (Spring Boot 3.2). Nó là **client HTTP đồng bộ** với API dạng chuỗi (fluent): {{get()}}, {{uri()}}, {{retrieve()}}, {{body()}}. Về vị trí, nó nằm giữa {{RestTemplate}} (cũ, imperative, đang ở chế độ bảo trì) và {{WebClient}} (reactive, non-blocking). Nếu ứng dụng của bạn là servlet stack (Spring MVC) và không cần reactive, RestClient là lựa chọn hiện đại.

~~~java
RestClient client = RestClient.builder()
        .baseUrl("http://pricing-service")
        .defaultHeader("Accept", "application/json")
        .build();

Order o = client.get()
        .uri("/orders/{id}", id)
        .retrieve()
        .body(Order.class);
~~~

### Vì sao dùng RestClient thay vì RestTemplate
- API ngắn gọn, dễ đọc; ít phải tạo nhiều lớp trung gian.
- Dùng chung hạ tầng message converter (Jackson) như RestTemplate.
- Có thể chọn request factory: JDK {{HttpClient}}, Apache HttpClient 5, Jetty, hoặc {{SimpleClientHttpRequestFactory}}. Boot tự động phát hiện nếu có dependency.
- Boot 3.2 auto-configure bean {{RestClient.Builder}}: inject builder, thêm interceptor, rồi build.

### Khi nào không dùng
- Cần non-blocking, backpressure, hoặc gọi nhiều service dạng stream → {{WebClient}} (reactive) phù hợp hơn.
- Cần khai báo client dạng interface (không viết code gọi) → cân nhắc {{@HttpExchange}} (Spring 6) hoặc Spring Cloud OpenFeign nếu đã dùng Spring Cloud.

### Test
{{MockRestServiceServer.bindTo(RestClient.Builder)}} cho phép kiểm tra request/response mà không cần server thật. Đây là lý do nên giữ {{RestClient.Builder}} thành bean để test thay thế dễ dàng.

### Trả lời phỏng vấn
"Tôi dùng RestClient cho service-to-service đồng bộ: tạo bean RestClient.Builder, baseUrl và timeout đặt ở một chỗ, xử lý lỗi qua onStatus. Nếu cần reactive hoặc gọi song song nhiều downstream thì tôi chọn WebClient."

### Vì sao các phương án còn lại sai
- **Annotation giống @FeignClient**: RestClient không phải annotation; nó là class bạn khởi tạo và gọi bằng code. (Spring 6 có @HttpExchange cho khai báo interface, nhưng đó là cơ chế khác.)
- **Chỉ async**: RestClient là đồng bộ; WebClient mới là reactive/async.
- **Phải dùng RestTemplateBuilder**: RestClient có builder riêng; không phụ thuộc RestTemplateBuilder.`
},
{
  id: 'qz-spring-080',
  topic: 'spring',
  q: `Bạn dùng {{RestClient}} để gọi API. Server trả về 404 hoặc 500. Những phát biểu nào đúng? (Chọn 2)
~~~java
Order o = client.get()
        .uri("/orders/{id}", id)
        .retrieve()
        .body(Order.class);
~~~`,
  multi: true,
  options: [
    'Mặc định .retrieve().body(...) ném RestClientResponseException (ví dụ HttpClientErrorException / HttpServerErrorException) với 4xx và 5xx',
    'Mặc định trả về null cho mọi mã lỗi, bạn phải tự kiểm tra status',
    'Có thể dùng .retrieve().onStatus(HttpStatusCode::is4xxClientError, (req, res) -> { throw new NotFoundException(); }).body(...) để tự xử lý lỗi',
    'onStatus chỉ áp dụng cho 2xx; muốn xử lý lỗi phải bọc try/catch quanh body()',
    'RestClient không có cơ chế nào khác ngoài dùng Interceptor của RestTemplate'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: mặc định 4xx/5xx ném RestClientResponseException, và onStatus cho phép tùy biến.**

### Mặc định của retrieve()
{{retrieve()}} nghĩa là "lấy body". Nó có một **default status handler**: nếu response là 4xx → ném {{HttpClientErrorException}}, 5xx → {{HttpServerErrorException}} (cả hai là con của {{RestClientResponseException}}). Bạn không cần try/catch quanh từng lời gọi nếu muốn để lỗi lan lên; exception có {{getStatusCode()}} và {{getResponseBodyAs(MyError.class)}} để đọc chi tiết.

### onStatus
~~~java
Order o = client.get()
        .uri("/orders/{id}", id)
        .retrieve()
        .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
            throw new OrderNotFoundException(id);
        })
        .body(Order.class);
~~~
{{onStatus(Predicate<HttpStatusCode>, ErrorHandler)}} đăng ký handler riêng. Khi có lỗi, Spring duyệt các handler theo **thứ tự đăng ký** (handler đăng ký trước được xét trước), còn handler mặc định chạy cuối cùng; nhờ vậy bạn có thể chặn và xử lý mã lỗi trước handler mặc định. Đây là cách để biến 404 thành exception nghiệp vụ có ý nghĩa ({{OrderNotFoundException}}) thay vì exception HTTP chung chung.

### Khi cần đọc cả response
{{exchange()}} (và {{toEntity()}}) cho bạn truy cập {{HttpHeaders}} và {{ResponseEntity}} mà **không** tự ném exception theo status; bạn tự kiểm tra {{getStatusCode()}}. Dùng khi cần đọc header (ví dụ {{Retry-After}}) hoặc xử lý 404 như một kết quả hợp lệ (không phải lỗi).

### Trả lời phỏng vấn
"RestClient mặc định ném RestClientResponseException cho 4xx/5xx. Tôi dùng onStatus để chuyển 404 thành exception nghiệp vụ, hoặc exchange() khi cần đọc header. Tôi không nuốt lỗi rồi trả null vì sẽ đẩy lỗi xuống caller dưới dạng NPE."

### Vì sao các phương án còn lại sai
- **Trả null cho mọi mã lỗi**: sai; mặc định là ném exception.
- **onStatus chỉ áp dụng cho 2xx**: sai; predicate nhận HttpStatusCode bất kỳ, thường dùng cho 4xx/5xx.
- **Chỉ có Interceptor**: sai; RestClient có onStatus và exchange() là cơ chế chính thức.`
},
{
  id: 'qz-spring-081',
  topic: 'spring',
  q: `Bạn cần chọn client HTTP cho các tình huống khác nhau trong dự án Spring Boot 3.2. Phát biểu nào đúng? (Chọn 2)`,
  multi: true,
  options: [
    'Gọi đồng bộ trong ứng dụng Spring MVC, cần API ngắn gọn và dễ đọc → RestClient (Spring 6.1+) là lựa chọn hợp lý',
    'Cần non-blocking, gọi song song nhiều downstream và có backpressure → WebClient (reactive) phù hợp hơn',
    'RestTemplate đã bị xoá khỏi Spring Framework 6 nên không thể dùng',
    'WebClient chỉ dùng được trong ứng dụng WebFlux, không dùng được trong Spring MVC'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: RestClient cho đồng bộ, WebClient cho reactive.**

### Ba lựa chọn
- {{RestTemplate}}: client đồng bộ lâu đời, vẫn còn trong Spring 6 nhưng ở chế độ bảo trì (không thêm tính năng mới). Nhiều code cũ đang dùng; migrate dần.
- {{RestClient}}: mới ở Spring Framework 6.1 / Boot 3.2, API fluent đồng bộ, dùng chung message converter với RestTemplate. Phù hợp cho service-to-service trong servlet stack.
- {{WebClient}}: reactive, non-blocking, trả {{Mono}}/{{Flux}}; phù hợp khi cần gọi nhiều downstream song song, stream dữ liệu, hoặc ứng dụng WebFlux.

### Vì sao không có lựa chọn "đúng cho mọi thứ"
- RestClient đơn giản, dễ debug (stack trace đồng bộ), nhưng mỗi lời gọi block thread.
- WebClient mạnh về bất đồng bộ nhưng phức tạp hơn: phải hiểu reactive, context propagation, timeout qua {{responseTimeout}}.
- RestTemplate vẫn chạy được; nếu dự án đã có RestTemplate và không cần tính năng mới, giữ nguyên cũng ổn.

### Test
- {{MockRestServiceServer}} bind được vào {{RestClient.Builder}} (Spring 6.1+) hoặc {{RestTemplateBuilder}}.
- WebClient có {{MockWebServer}} (OkHttp) hoặc {{WebTestClient}} cho server.
Chọn công cụ test theo client bạn dùng.

### Trả lời phỏng vấn
"Tôi chọn RestClient cho đồng bộ trong Spring MVC, WebClient khi cần reactive/gọi song song, và RestTemplate chỉ khi bảo trì code cũ. RestTemplate không bị xoá nhưng không còn được đầu tư thêm."

### Vì sao các phương án còn lại sai
- **RestTemplate bị xoá**: sai, vẫn còn trong Spring 6, chỉ ở chế độ bảo trì.
- **WebClient chỉ dùng trong WebFlux**: sai, WebClient là client HTTP của spring-webflux, dùng được cả trong ứng dụng Spring MVC (chỉ cần thêm dependency), miễn là bạn xử lý Mono/Flux.`
},
{
  id: 'qz-spring-082',
  topic: 'spring',
  q: `Bạn đặt {{spring.mvc.problemdetails.enabled=true}} trong Spring Boot 3. Client gửi request body thiếu trường {{email}} (DTO có {{@NotBlank}}), trong khi controller dùng {{@Valid @RequestBody}}. Response trả về là gì?`,
  options: [
    'JSON kiểu Boot 2: {timestamp, status, error, message, path}, vì validation không thuộc error handling mặc định',
    'ProblemDetail có sẵn mảng errors liệt kê từng field và message vi phạm',
    'application/problem+json với type "about:blank", title "Bad Request", status 400, detail "Invalid request content." — không chứa danh sách lỗi field; muốn có phải override handleMethodArgumentNotValid và setProperty("errors", ...)',
    'HTTP 200 kèm ProblemDetail trong body'
  ],
  answer: 2,
  explain: `**Đáp án đúng: ProblemDetail với status 400 và detail chung, không kèm lỗi từng field theo mặc định.**

### Vì sao không có danh sách field
Khi bật {{spring.mvc.problemdetails.enabled=true}}, Boot đăng ký {{ResponseEntityExceptionHandler}} (qua {{ProblemDetailsExceptionHandler}}) để chuyển các exception mặc định của Spring MVC sang ProblemDetail. Với {{MethodArgumentNotValidException}} (exception khi @Valid thất bại), response mặc định là:
~~~json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid request content.",
  "instance": "/orders"
}
~~~
Spring **cố ý không** đưa chi tiết lỗi field vào {{detail}}: thông điệp validation mặc định có thể lộ tên field nội bộ, cấu trúc DTO, hoặc constraint — đây là thông tin nhạy cảm, và cũng là lý do Boot có các property {{server.error.include-message}}/{{include-binding-errors}} mặc định tắt. Bạn chỉ thấy "Invalid request content.".

### Làm sao để có danh sách lỗi
Kế thừa {{ResponseEntityExceptionHandler}} và override:
~~~java
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {

        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of("field", fe.getField(),
                                  "message", fe.getDefaultMessage()))
                .toList();

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, "Dữ liệu không hợp lệ");
        problem.setTitle("Validation failed");
        problem.setProperty("errors", errors);
        return handleExceptionInternal(ex, problem, headers, status, request);
    }
}
~~~
Lưu ý: nếu cả handler mặc định của Boot và {{@RestControllerAdvice}} của bạn đều có thể xử lý cùng exception, cần đảm bảo advice của bạn được ưu tiên hơn (ví dụ đặt {{@Order}} với độ ưu tiên cao hơn handler mặc định), nếu không handler mặc định có thể xử lý trước.

### Vì sao đây là câu hỏi hay
Nó kiểm tra xem bạn có thực sự bật và đọc response, hay chỉ nghe nói "Boot 3 có ProblemDetail". Rất nhiều team bật property rồi ngạc nhiên vì FE không thấy lỗi field.

### Trả lời phỏng vấn
"Bật problemdetails.enabled cho response chuẩn, nhưng validation mặc định không kèm lỗi field. Tôi override handleMethodArgumentNotValid, map BindingResult thành danh sách errors rồi setProperty để FE hiển thị đúng field. Tôi cũng cân nhắc i18n message qua MessageSource."

### Vì sao các phương án còn lại sai
- **JSON kiểu Boot 2**: sai, property đã đổi định dạng lỗi mặc định sang ProblemDetail.
- **Có sẵn mảng errors**: sai, mặc định không có; phải tự bổ sung.
- **HTTP 200**: sai, status lấy từ ProblemDetail (400).`
},
{
  id: 'qz-spring-083',
  topic: 'spring',
  q: `Ứng dụng chạy trên Kubernetes, mật khẩu DB được mount từ Secret thành các file dưới {{/etc/app/secrets/}} (mỗi file một secret, ví dụ file {{db-password}}). Bạn muốn nạp các file này thành property mà không nhúng vào image. Cách đúng trong Spring Boot 3?`,
  options: [
    'spring.config.import=optional:configtree:/etc/app/secrets/ — mỗi file thành một property, tên file là key, nội dung là value',
    'spring.config.import=file:/etc/app/secrets/ — chỉ nạp được file .properties/.yml',
    'Dùng @Value đọc key db-password là đủ, không cần khai báo nguồn cấu hình',
    'Đọc file bằng Files.readAllLines trong @PostConstruct rồi System.setProperty'
  ],
  answer: 0,
  explain: `**Đáp án đúng: spring.config.import với configtree:.**

### Config tree là gì
Từ Spring Boot 2.4, {{spring.config.import}} cho phép nạp thêm nguồn cấu hình. Với scheme {{configtree:}}, Spring coi **mỗi file trong thư mục** là một property:
- Tên file → key.
- Nội dung file → value (đã trim).

Ví dụ thư mục {{/etc/app/secrets/}} có file {{db-password}} nội dung {{s3cr3t}} → property {{db-password=s3cr3t}} (đọc bằng {{@Value}} với key {{db-password}}, hoặc binding vào @ConfigurationProperties).

### Vì sao hợp với Kubernetes
Secret của K8s thường được mount thành **file**, không phải biến môi trường. Config tree cho phép dùng trực tiếp mà không phải viết code đọc file. Tiền tố {{optional:}} giúp app không fail nếu thư mục chưa tồn tại (ví dụ chạy local).

### Lưu ý
- Secret vẫn là text trong Environment: tránh log toàn bộ Environment ({{/actuator/env}}) trên production.
- Không dùng Base64 "cho an toàn": Base64 chỉ là mã hoá, không phải bảo mật.
- Nếu trùng key giữa các nguồn, nguồn nạp sau thường thắng; hãy kiểm tra thứ tự trong tài liệu nếu cần.

### Trả lời phỏng vấn
"Tôi dùng spring.config.import=configtree: để nạp secret dạng file trên K8s thành property, kèm optional: để không fail khi chạy local. Tôi không log env và không dùng Base64 như một biện pháp bảo mật."

### Vì sao các phương án còn lại sai
- **file: chỉ nạp .properties/.yml**: với file không có phần mở rộng (như secret), config tree mới phù hợp; file: không nhận định dạng.
- **@Value là đủ**: @Value cần property tồn tại; nếu không khai báo nguồn, app fail "Could not resolve placeholder".
- **Đọc file trong @PostConstruct rồi System.setProperty**: làm được nhưng thủ công, dễ sai, không nhất quán với cơ chế cấu hình của Boot, và khó test.`
},
{
  id: 'qz-spring-084',
  topic: 'spring',
  q: `DTO {{UserRequest}} có {{@NotBlank String email}} và một field lồng {{Address address}} ({{Address}} có {{@NotBlank String city}}). Bạn muốn validate khác nhau khi tạo và khi cập nhật. Phát biểu nào đúng? (Chọn 2)
~~~java
public class UserRequest {
    @NotBlank
    private String email;

    @Valid                 // có annotation này thì Address mới được kiểm tra
    private Address address;
}
~~~`,
  multi: true,
  options: [
    'Dùng groups: đặt {{@NotNull(groups = Create.class)}} trên field, và {{@Validated(Create.class)}} trên method controller; {{@Valid}} luôn chạy nhóm Default',
    '{{@Valid}} và {{@Validated(groups = Create.class)}} tương đương vì cả hai đều chạy mọi nhóm',
    'Field lồng nhau cần {{@Valid}} để cascade; nếu thiếu, Address bên trong không được kiểm tra',
    'Groups chỉ áp dụng cho {{@RequestParam}}, không áp dụng cho {{@RequestBody}}'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: groups + @Validated, và @Valid để cascade.**

### Groups là gì
Bean Validation cho phép gắn một ràng buộc vào **nhóm** (group), mặc định là {{Default}}. Khi validate, bạn chọn nhóm nào sẽ chạy:
~~~java
public interface Create {}
public interface Update {}

public class UserRequest {
    @NotBlank(groups = Create.class)
    private String email;

    @NotBlank(groups = Update.class)
    private String password;   // chỉ bắt buộc khi tạo
}
~~~
Trên controller:
~~~java
@PostMapping
public void create(@Validated(Create.class) @RequestBody UserRequest req) { ... }

@PutMapping
public void update(@Validated(Update.class) @RequestBody UserRequest req) { ... }
~~~

### @Valid vs @Validated
- {{@Valid}} (Jakarta) đánh dấu field/parameter cần validate theo nhóm {{Default}}. Nó **không** chọn nhóm.
- {{@Validated}} (Spring) đặt trên class hoặc parameter để chọn nhóm cụ thể; cũng có thể thay @Valid ở parameter.
- Nếu chỉ dùng {{@Valid}} thì luôn là nhóm Default; muốn nhóm khác phải dùng {{@Validated(groups = ...)}}.

### Cascade object lồng
Nếu {{UserRequest}} có field {{Address address}}, chỉ khi field đó có {{@Valid}} thì validator mới đi vào Address và kiểm tra {{@NotBlank city}}. Nếu thiếu @Valid, Address không được kiểm tra (trừ khi Address có ràng buộc ở cấp class).

### Trả lời phỏng vấn
"Tôi dùng groups để tách validate Create/Update: @NotBlank(groups=Create.class) và @Validated(Create.class) trên controller. Với object lồng, tôi thêm @Valid để cascade. @Valid luôn dùng nhóm Default, @Validated mới chọn được nhóm."

### Vì sao các phương án còn lại sai
- **@Valid và @Validated(groups) tương đương**: sai; @Valid chỉ chạy nhóm Default, không chọn nhóm.
- **Groups chỉ cho @RequestParam**: sai, groups dùng được cho @RequestBody (qua @Validated), @RequestParam, @PathVariable...`
},
{
  id: 'qz-spring-085',
  topic: 'spring',
  q: `Bạn muốn tắt auto-configuration của Redis trong ứng dụng Spring Boot 3 (vẫn giữ dependency để dùng RedisTemplate ở nơi khác). Cách nào đúng?`,
  options: [
    'spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration',
    'Xóa @SpringBootApplication khỏi class chính',
    'Đặt spring.main.allow-bean-definition-overriding=true',
    'Đặt management.endpoints.web.exposure.exclude=redis'
  ],
  answer: 0,
  explain: `**Đáp án đúng: spring.autoconfigure.exclude.**
 
### Nó làm gì
{{spring.autoconfigure.exclude}} nhận danh sách tên class auto-configuration (phân cách bằng dấu phẩy) cần **loại bỏ** khỏi quá trình nạp. Spring sẽ không xử lý các class đó, nghĩa là không tạo bean mặc định của chúng. Ví dụ trên tắt {{RedisAutoConfiguration}} (không tạo {{RedisConnectionFactory}}, {{RedisTemplate}}), nhưng dependency vẫn còn trên classpath để bạn tự khai báo bean khi cần.
 
~~~yaml
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
~~~
 
### Các cách khác
- {{@SpringBootApplication(exclude = RedisAutoConfiguration.class)}} hoặc {{@EnableAutoConfiguration(exclude = ...)}}: cùng mục đích, nhưng khai báo bằng code (compile-time, IDE bắt được lỗi chính tả).
- Một số auto-config có property riêng để tắt, ví dụ {{management.health.redis.enabled=false}} (chỉ tắt health indicator), hoặc {{spring.cache.type=none}}. Với Redis thì không có property "enabled" chung, nên exclude là cách chuẩn.
- Nếu auto-config được điều kiện bằng {{@ConditionalOnClass}}, bỏ dependency cũng làm nó không nạp — nhưng bạn nói vẫn muốn giữ dependency.
 
### Vì sao không dùng các cách khác
- **Xóa @SpringBootApplication**: mất luôn component scan và auto-configuration; ứng dụng gần như không chạy được.
- **allow-bean-definition-overriding**: cho phép bean sau ghi đè bean trước; không liên quan tới việc tắt auto-config, và bật nó thường che giấu lỗi trùng bean rất nguy hiểm.
- **management.endpoints...exclude**: chỉ ảnh hưởng endpoint Actuator, không ảnh hưởng việc tạo bean.
 
### Lỗi hay gặp
Sai tên class trong exclude → ứng dụng **fail lúc khởi động** với thông báo "The following classes could not be excluded because they are not auto-configuration classes". Đây là tính năng tốt: nó chặn lỗi chính tả. Nếu bạn tự viết auto-config và muốn cho phép tắt, hãy đặt tên class rõ ràng và ghi vào tài liệu.
 
### Trả lời phỏng vấn
"Tôi tắt auto-config bằng spring.autoconfigure.exclude hoặc @EnableAutoConfiguration(exclude=...). Nó loại đúng class auto-config khỏi quá trình nạp; sai tên sẽ fail fast lúc khởi động. Nếu chỉ cần tắt health check thì dùng property riêng của module đó."
 
> Senior tip: trên production, việc tắt auto-config nên đi kèm lý do rõ ràng trong comment hoặc tài liệu, vì người sau sẽ thắc mắc "vì sao RedisTemplate không có ở đây?". Ưu tiên dùng property chính thức của module nếu có, exclude chỉ là phương án cuối.`
},
{
  id: 'qz-spring-086',
  topic: 'spring',
  q: `Ứng dụng Spring Boot 3 dùng Spring Security 6. Cấu hình sau khai báo **hai** bean {{SecurityFilterChain}}, mỗi bean có {{securityMatcher}} khác nhau:
~~~java
@Bean @Order(1)
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .securityMatcher("/api/**")
        .authorizeHttpRequests(a -> a.requestMatchers("/api/public/**").permitAll().anyRequest().authenticated())
        .oauth2ResourceServer(OAuth2ResourceServerConfigurer::jwt)
        .build();
}

@Bean @Order(2)
SecurityFilterChain web(HttpSecurity http) throws Exception {
    return http
        .securityMatcher("/admin/**")
        .authorizeHttpRequests(a -> a.anyRequest().hasRole("ADMIN"))
        .formLogin(Customizer.withDefaults())
        .build();
}
~~~
Request {{GET /api/orders}} (có header Authorization: Bearer <jwt>) được xử lý bởi chuỗi nào?`,
  options: [
    'Chuỗi {{web}} (Order 2), vì nó được khai báo sau nên ưu tiên hơn',
    'Cả hai chuỗi nối tiếp nhau: request đi qua chuỗi api rồi tiếp tục chuỗi web',
    'Chuỗi {{api}} (Order 1) xử lý; chuỗi web không được áp dụng vì matcher không khớp',
    'Spring báo lỗi khởi động vì không được khai báo nhiều SecurityFilterChain'
  ],
  answer: 2,
  explain: `**Đáp án đúng: chuỗi api (Order 1) xử lý request; chuỗi web không áp dụng.**
 
### Vì sao đúng
Trong Spring Security 6, mỗi {{SecurityFilterChain}} là một bộ lọc độc lập gắn với một {{securityMatcher}}. Khi request đến, Spring duyệt các chuỗi theo thứ tự {{@Order}} tăng dần và **chọn chuỗi đầu tiên** mà {{securityMatcher}} khớp. {{/api/orders}} khớp {{/api/**}} nên chuỗi 1 (Order 1) xử lý và dừng; request không bao giờ rơi xuống chuỗi 2. Chuỗi 2 có matcher {{/admin/**}} hoàn toàn không khớp với đường dẫn này.
 
### Vì sao các phương án còn lại sai
- **Chuỗi web vì khai báo sau**: thứ tự được quyết định bởi {{@Order}}, không phải thứ tự khai báo trong code. Order 1 chạy trước Order 2.
- **Nối tiếp hai chuỗi**: một request chỉ đi qua **một** chuỗi filter duy nhất, không nối tiếp. Đây khác với cách filter servlet truyền thống.
- **Báo lỗi khi khai báo nhiều**: hoàn toàn hợp lệ; đây là cách chuẩn để tách cấu hình API (stateless, JWT) và web (stateful, form login).
 
### Lưu ý quan trọng
Nếu chuỗi 1 khai báo matcher rộng {{/**}} và đặt Order thấp (số nhỏ), nó sẽ "ăn" mọi request và các chuỗi sau thành vô dụng. Luôn đặt chuỗi **cụ thể** (matcher hẹp) lên trước, chuỗi **chung** xuống sau.
 
> Senior tip: dùng {{spring-security-test}}'s {{MockMvc}} để viết test xác nhận mỗi endpoint đi đúng chuỗi mong muốn, tránh lỗ hổng "quên route" do matcher lỡ tay rộng.`
},
{
  id: 'qz-spring-087',
  topic: 'spring',
  q: `API REST stateless dùng JWT, không dùng session, FE gọi từ domain khác. Cấu hình Spring Security 6 nào là **hợp lý nhất**? (Chọn 3)
 
~~~java
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/actuator/health").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(OAuth2ResourceServerConfigurer::jwt)
        .build();
}
~~~`,
  multi: true,
  options: [
    'Tắt CSRF ({{csrf().disable()}}) vì JWT stateless không có session cookie để bảo vệ',
    'Bật CORS ({{cors()}}) để cho phép domain của FE gọi API',
    'Bật lại CSRF token trong header để an toàn hơn cho JWT',
    'Đặt {{sessionCreationPolicy(STATELESS)}} để không tạo HttpSession',
    'Dùng {{permitAll()}} cho mọi endpoint {{/actuator/**}}'
  ],
  answer: [0, 1, 3],
  explain: `**Đáp án đúng: tắt CSRF, bật CORS, đặt session STATELESS.**
 
### Vì sao đúng
- **CSRF**: khai thác việc trình duyệt **tự động gửi cookie** session. API stateless dùng JWT (thường gửi trong header Authorization) không có cookie để kẻ tấn công lợi dụng, nên tắt CSRF là chuẩn.
- **CORS**: là cơ chế của **trình duyệt**, cần cấu hình để domain FE khác được phép gọi. Đây là việc của Spring Security hoặc WebMvc, không phải "tắt bảo mật".
- **STATELESS**: Spring không tạo và không dùng HttpSession, phù hợp API thuần JWT.
 
### Vì sao các phương án còn lại sai
- **Bật lại CSRF cho JWT**: không cần và gây rắc rối; JWT không dựa vào cookie. (Nếu sau này bạn chuyển sang cookie httpOnly thì mới cần bật lại.)
- **permitAll mọi /actuator/**: rất nguy hiểm, /actuator/env và /actuator/heapdump có thể lộ secret và dữ liệu bộ nhớ. Chỉ permitAll đúng endpoint cần (thường là /actuator/health cho probe) và tách cổng actuator riêng.
 
> Senior tip: nguyên tắc là **tắt cái không cần, mở đúng cái cần**. Với JWT, hãy để token trong Authorization header (không phải cookie) và đặt chính sách CORS whitelist rõ ràng thay vì {{allowedOrigins("*")}} khi dùng credentials.`
},
{
  id: 'qz-spring-088',
  topic: 'spring',
  q: `Spring Security 6, method security bật bằng {{@EnableMethodSecurity}}. Service sau:
~~~java
@Service
public class OrderService {
    @PreAuthorize("hasRole('ADMIN') or @orderSecurity.isOwner(authentication, #id)")
    public void cancel(Long id) { ... }
 
    @PreAuthorize("hasRole('USER')")
    public void view(Long id) { ... }
}
~~~
{{orderSecurity.isOwner}} là một bean {{@Component}} có method:
~~~java
public boolean isOwner(Authentication auth, Long orderId) { ... }
~~~
Phát biểu nào đúng về cách Spring Security xử lý biểu thức này?`,
  options: [
    'Biểu thức {{@orderSecurity.isOwner(...)}} không được phép vì chỉ hỗ trợ SpEL truy cập bean không có tham số',
    'Spring Security gọi method bean với hai đối số: {{authentication}} (principal hiện tại) và {{#id}} (tham số method cancel); bean phải là singleton',
    '@PreAuthorize chỉ chạy khi method được gọi từ bean khác (qua proxy); gọi this.cancel() trong cùng class thì biểu thức bị bỏ qua',
    'Cả B và C đều đúng'
  ],
  answer: 3,
  explain: `**Đáp án đúng: cả hai phát biểu đều đúng — Spring truyền authentication và tham số method vào bean, và @PreAuthorize bị bỏ qua khi self-invocation.**
 
### Vì sao đúng
1. **Truyền tham số vào bean**: Trong SpEL của {{@PreAuthorize}}, {{@beanName.method(arg)}} cho phép gọi method của bất kỳ bean nào trong context. Spring Security tự động truyền:
   - {{authentication}}: object {{Authentication}} hiện tại (có sẵn trong SecurityContext)
   - {{#id}}: giá trị của tham số method có tên {{id}} (hoặc {{#a0}} cho tham số đầu tiên)
   Bean {{orderSecurity}} phải là singleton (mặc định) để proxy method security tìm thấy nó.
 
2. **Self-invocation bỏ qua proxy**: {{@PreAuthorize}} (và {{@PostAuthorize}}, {{@Secured}}) hoạt động nhờ **proxy AOP** (do {{@EnableMethodSecurity}} tạo). Chỉ lời gọi từ **bên ngoài qua proxy** mới kích hoạt kiểm tra. Gọi {{this.cancel()}} trong cùng class là self-invocation, bỏ qua proxy, nên biểu thức **không được đánh giá** — method chạy như bình thường không có authorize.
 
### Cách sửa self-invocation
- Tách logic authorize ra bean khác, inject và gọi qua bean đó.
- Hoặc dùng {{AopContext.currentProxy()}} sau khi bật {{@EnableAspectJAutoProxy(exposeProxy = true)}}.
 
### Trả lời phỏng vấn
"@PreAuthorize dùng SpEL, có thể gọi bean @Component với @beanName.method(authentication, #param). Nhưng nó dùng proxy AOP, nên this.method() trong cùng class bỏ qua kiểm tra — đây là bẫy self-invocation quen thuộc như @Transactional."
 
> Senior tip: khi review code, tìm các lời gọi this.method() tới method có @PreAuthorize/@PostAuthorize/@Secured — đó là nơi authorize "biến mất" mà không có cảnh báo.`
},
{
  id: 'qz-spring-089',
  topic: 'spring',
  q: `Ứng dụng Spring Boot 3 dùng Spring Security 6. Password encoder được cấu hình:
~~~java
@Bean
PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // strength = 12
}
~~~
Một user đăng ký với mật khẩu "Abc@123456". Bảng {{users}} lưu hash. Hôm sau, dev đổi strength thành 10 và deploy. User đăng nhập lại thì sao?`,
  options: [
    'Đăng nhập thất bại vì hash cũ (strength 12) không khớp với encoder mới (strength 10)',
    'Đăng nhập thành công: BCrypt encoder tự phát hiện strength từ hash đã lưu và verify đúng',
    'Ném exception vì strength không khớp giữa encode và verify',
    'Đăng nhập thành công nhưng hash được ghi đè lại bằng strength 10'
  ],
  answer: 1,
  explain: `**Đáp án đúng: đăng nhập thành công, BCrypt tự phát hiện strength từ hash.**
 
### Vì sao đúng
{{BCryptPasswordEncoder}} (và {{Pbkdf2PasswordEncoder}}, {{SCryptPasswordEncoder}}) lưu **cả tham số strength/salt/iterations** ngay trong chuỗi hash. Định dạng hash BCrypt:
~~~text
$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
 |  |  |
 |  |  └── salt (22 ký tự)
 |  └────── strength (cost factor = 12)
 └───────── thuật toán + version
~~~
Khi {{matches(rawPassword, storedHash)}}, encoder đọc strength từ hash (12) chứ **không** dùng strength của instance hiện tại (10). Do đó verify vẫn đúng. Khi user đổi mật khẩu lần sau, hash mới sẽ được tạo với strength 10.
 
### Vì sao các phương án còn lại sai
- **Thất bại vì strength không khớp**: đây là hiểu lầm phổ biến; encoder không dùng strength của instance để verify.
- **Ném exception**: BCrypt không ném exception khi strength khác; nó chỉ đọc từ hash.
- **Ghi đè hash ngay**: hash chỉ được cập nhật khi encode lại (ví dụ user đổi password), không phải lúc verify.
 
> Senior tip: migration strength an toàn: chỉ đổi strength trong config; user cũ vẫn đăng nhập được, hash mới sẽ dùng strength mới. Nếu muốn ép tất cả user cập nhật, có thể thêm cờ {{needsRehash}} hoặc kiểm tra strength khi login và encode lại.`
},
{
  id: 'qz-spring-090',
  topic: 'spring',
  q: `Resource Server dùng JWT (Spring Security 6, {{oauth2ResourceServer().jwt()}}). Token có claim {{scope: "read write"}}, {{client_id: "mobile-app"}}, và {{exp}} hợp lệ. Cấu hình:
~~~java
.authorizeHttpRequests(a -> a
    .requestMatchers(HttpMethod.GET, "/api/**").hasAuthority("SCOPE_read")
    .requestMatchers(HttpMethod.POST, "/api/**").hasAuthority("SCOPE_write")
    .anyRequest().authenticated())
~~~
Request {{GET /api/orders}} với token trên bị từ chối (403). Nguyên nhân là gì?`,
  options: [
    'JWT parser mặc định không map claim "scope" thành authority; cần cấu hình JwtAuthenticationConverter',
    'Token thiếu claim "authorities" nên Spring không có authority nào để so khớp',
    'hasAuthority yêu cầu exact match "read" chứ không phải "SCOPE_read"',
    'GET /api/orders cần SCOPE_write vì là truy xuất dữ liệu quan trọng'
  ],
  answer: 0,
  explain: `**Đáp án đúng: JWT parser mặc định không map claim "scope" thành authority; cần JwtAuthenticationConverter.**
 
### Vì sao đúng
Spring Security 6 khi parse JWT, mặc định tạo authority từ claim {{scope}} **chỉ khi** bạn cấu hình {{JwtAuthenticationConverter}} với {{setJwtGrantedAuthoritiesConverter}}. Mặc định, {{JwtAuthenticationConverter}} chỉ tạo authority từ claim {{authorities}} (nếu có) hoặc {{roles}}.
 
Claim {{scope: "read write"}} trong JWT **không tự động** thành {{SCOPE_read}} {{SCOPE_write}}. Bạn phải cấu hình:
~~~java
@Bean
JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(jwt -> {
        String scope = jwt.getClaimAsString("scope");
        if (scope == null) return List.of();
        return Arrays.stream(scope.split(" "))
            .map(s -> "SCOPE_" + s)
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
    });
    return converter;
}

@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .oauth2ResourceServer(oauth2 -> oauth2
            .authenticationManagerResolver(resolver -> resolver.jwt(jwtConfigurer -> jwtConfigurer.jwtAuthenticationConverter(jwtAuthenticationConverter())))
        )
        ...
        .build();
}
~~~
 
### Vì sao các phương án còn lại sai
- **Token thiếu claim authorities**: JWT thường dùng "scope" (OAuth2) chứ không phải "authorities" (Spring Security cụ thể).
- **hasAuthority yêu cầu exact match "read"**: {{hasAuthority("SCOPE_read")}} khớp authority {{SCOPE_read}} — tiền tố SCOPE_ là quy ước của Spring.
- **Cần SCOPE_write**: GET thường dùng read scope.
 
> Senior tip: luôn kiểm tra authority thực tế bằng breakpoint hoặc log {{authentication.getAuthorities()}} sau khi cấu hình converter. Đây là lỗi #1 khi setup resource server JWT.`
},
{
  id: 'qz-spring-091',
  topic: 'spring',
  q: `CSRF protection trong Spring Security 6 với ứng dụng **Single Page Application (React/Vue)** gọi API REST stateless (JWT trong header Authorization). Cách cấu hình CSRF phù hợp nhất?`,
  options: [
    'Bật CSRF mặc định (cookie) và đọc token từ cookie XSRF-TOKEN gửi trong header X-XSRF-TOKEN',
    'Tắt CSRF hoàn toàn ({{csrf().disable()}}) vì API stateless JWT không có session cookie',
    'Dùng {{CsrfTokenRequestAttributeHandler}} để lưu token trong request attribute, FE đọc từ meta tag',
    'Bật CSRF với {{CookieCsrfTokenRepository.withHttpOnlyFalse()}} và FE gửi token trong header'
  ],
  answer: 1,
  explain: `**Đáp án đúng: tắt CSRF vì API stateless JWT không có session cookie.**
 
### Vì sao đúng
CSRF (Cross-Site Request Forgery) khai thác việc trình duyệt **tự động gửi cookie** (session cookie) khi request cross-origin. API REST stateless dùng JWT:
- JWT thường gửi trong header **Authorization: Bearer ...** (không phải cookie)
- Không có session cookie → trình duyệt không tự gắn credential → không có mặt tấn công CSRF
- Vì vậy **tắt CSRF là chuẩn** cho kiến trúc này.
 
### Vì sao các phương án còn lại sai
- **Bật CSRF mặc định (cookie)**: cần session cookie; JWT không dùng session cookie nên cơ chế này vô hiệu.
- **CsrfTokenRequestAttributeHandler**: dùng cho server-side rendering (Thymeleaf) nơi form đọc token từ attribute; không phù hợp SPA tách biệt.
- **CookieCsrfTokenRepository**: vẫn cần cookie; nếu bạn lưu JWT trong cookie httpOnly thì mới cần bật CSRF, nhưng lúc đó architecture đã khác (stateful cookie-based).
 
### Khi nào CẦN bật CSRF
- Ứng dụng web truyền thống (server-side rendering) dùng session cookie.
- SPA dùng **cookie httpOnly** để lưu access token (không dùng header Authorization).
- Form đăng nhập/đăng ký công khai (login page) — Spring Security bật CSRF mặc định cho form login.
 
> Senior tip: với JWT trong header Authorization, {{csrf().disable()}} là đúng. Nếu sau này đổi sang cookie httpOnly, hãy bật lại {{csrf()}} và cấu hình {{CookieCsrfTokenRepository.withHttpOnlyFalse()}} (để JS đọc được) hoặc dùng pattern double-submit cookie.`
},
{
  id: 'qz-jpa-042',
  topic: 'jpa',
  q: `Entity {{Order}} có quan hệ {{@OneToMany(mappedBy = "order") List<OrderItem> items}} (mặc định LAZY). Code sau chạy trong transaction:
~~~java
List<Order> orders = orderRepo.findAll(); // 100 order
for (Order o : orders) {
    System.out.println(o.getItems().size()); // truy cập collection lazy
}
~~~
Log SQL cho thấy 101 câu SELECT. Vấn đề này gọi là gì và các cách sửa nào đúng?
 
~~~text
1. N+1 select problem: 1 câu lấy orders + 100 câu lấy items cho từng order
2. Eager loading problem: Hibernate load sẵn items nên chậm
3. Sửa bằng @EntityGraph(attributePaths = "items") trên method repository
4. Sửa bằng @BatchSize(size = 20) trên field items
5. Sửa bằng join fetch trong JPQL: select o from Order o join fetch o.items
~~~`,
  options: [
    '1, 3',
    '1, 4',
    '1, 3, 5',
    '2, 3, 4'
  ],
  answer: 2,
  explain: `**Đáp án đúng: N+1 select problem; sửa bằng @EntityGraph, @BatchSize, hoặc JOIN FETCH.**
 
### Vì sao đúng
- **N+1 select problem**: 1 câu SELECT lấy 100 order, sau đó **N=100** câu SELECT thêm — mỗi câu nạp items của một order. Nguyên nhân: {{@OneToMany}} mặc định **LAZY**, nên lúc {{findAll()}} chỉ load order; khi code gọi {{o.getItems()}}, Hibernate phải chạy câu SELECT riêng cho từng order.
- Ba cách sửa chuẩn:
  1. **JOIN FETCH**: {{@Query("select o from Order o join fetch o.items")}} — 1 câu SQL, trả về order kèm items. Cẩn thận: không dùng với Pageable (sẽ load toàn bộ rồi phân trang trong bộ nhớ, mã HHH90003004).
  2. **@EntityGraph**: {{@EntityGraph(attributePaths = "items")}} trên method repository — cho phép fetch graph tùy biến, dùng được với Pageable nếu không fetch collection.
  3. **@BatchSize(size = 20)**: trên field {{items}} — gom 20 order_id vào một câu {{SELECT ... WHERE order_id IN (...)}}, giảm từ 100 câu xuống 5 câu. An toàn với Pageable và nhiều collection.
 
### Vì sao các phương án còn lại sai
- **Eager loading problem**: ngược lại, LAZY mới gây N+1; EAGER sẽ load items ngay trong câu đầu (nhưng JPQL vẫn gây N+1 khi load bù, xem qz-jpa-009).
- Chỉ chọn 1 cách sửa: cả 3 cách đều đúng và dùng tùy ngữ cảnh.
 
> Senior tip: @BatchSize là "vũ khí im lặng" an toàn nhất cho collection to-many: không thay đổi câu query chính, không gây tích Descartes, dùng được với Pageable. Đặt {{hibernate.default_batch_fetch_size=20}} cho toàn app nếu không muốn annotate từng field.`
},
{
  id: 'qz-jpa-043',
  topic: 'jpa',
  q: `Service đọc dữ liệu chỉ để hiển thị (không sửa), method có {{@Transactional(readOnly = true)}}. Phát biểu nào **KHÔNG** phải lợi ích của readOnly?`,
  options: [
    'Hibernate bỏ qua dirty checking và không giữ snapshot, giảm CPU và heap',
    'Connection JDBC được đặt read-only, cho phép driver/DB tối ưu hoặc routing sang read replica',
    'Transaction readOnly không cần connection từ pool (chạy không connection)',
    'Flush mode được đặt MANUAL, nên không có flush tự động lúc commit'
  ],
  answer: 2,
  explain: `**Đáp án đúng: readOnly vẫn cần connection từ pool.**
 
### Vì sao đúng
{{@Transactional(readOnly = true)}} mang lại các lợi ích thực tế:
1. **Bỏ dirty checking**: Hibernate đặt session read-only, flush mode MANUAL. Entity load ra không giữ snapshot, commit không duyệt entity để so sánh — tiết kiệm CPU/heap lớn với hàng nghìn entity.
2. **Connection read-only**: Spring gọi {{Connection.setReadOnly(true)}}. Driver có thể tối ưu (PostgreSQL chuyển transaction sang READ ONLY), {{AbstractRoutingDataSource}} có thể route sang read replica dựa trên {{TransactionSynchronizationManager.isCurrentTransactionReadOnly()}}.
3. **Flush mode MANUAL**: chỉ {{em.flush()}} gọi tay mới đẩy thay đổi; nhưng vì method chỉ đọc nên cũng không có gì để flush.
 
### Vì sao phương án "không cần connection" sai
Transaction read-only **vẫn lấy một connection từ pool** và giữ nó tới hết method. Nó không phải "chạy không connection". Connection được trả về pool sau khi method kết thúc (commit/rollback của transaction read-only là no-op về mặt dữ liệu nhưng vẫn đóng transaction).
 
### Cạm bẫy
Khi dùng routing sang replica, nhớ **replication lag**: luồng "ghi xong đọc lại ngay" phải đọc từ primary, nếu không user thấy dữ liệu cũ. Đừng để readOnly che lấp việc thiếu index hoặc query kém.
 
> Senior tip: pattern phổ biến là đặt {{@Transactional(readOnly = true)}} ở mức class service, rồi ghi đè {{@Transactional}} (mặc định readWrite) trên các method ghi.`
},
{
  id: 'qz-jpa-044',
  topic: 'jpa',
  q: `Entity {{Product}} có {{@Version Long version}}. Hai request cùng cập nhật giá sản phẩm id=100:
~~~java
// Request A (version=5)          // Request B (version=5)
product.setPrice(90);              product.setPrice(80);
productRepo.save(product);         productRepo.save(product);
// A commit trước                  // B commit sau
~~~
Kết quả của request B?`,
  options: [
    'B bị chặn (block) cho tới khi A commit, rồi đọc bản ghi mới nhất',
    'B ném OptimisticLockException (Spring bọc thành ObjectOptimisticLockingFailureException): UPDATE kèm WHERE version=5 không khớp vì version đã thành 6',
    'B commit thành công và ghi đè price của A (last write wins)',
    'B ném StaleObjectStateException ngay khi gọi save()'
  ],
  answer: 1,
  explain: `**Đáp án đúng: B nhận OptimisticLockException khi flush, vì điều kiện version không khớp.**
 
### Vì sao đúng
- {{@Version}} thêm cột version. Lúc load, entity giữ version=5. Câu UPDATE của Hibernate: {{update product set price=?, version=6 where id=? and version=5}}.
- A commit trước: UPDATE khớp (DB version=5) → 1 dòng thay đổi, DB version thành 6.
- B commit sau: DB version đã là 6, câu UPDATE vẫn mang {{where version=5}} → **0 dòng** bị ảnh hưởng → Hibernate ném {{OptimisticLockException}} (Spring bọc thành {{ObjectOptimisticLockingFailureException}}, thường map sang HTTP 409).
- Lỗi xảy ra ở **flush lúc commit**, không phải lúc {{save()}}: save chỉ đưa entity vào hàng chờ. Do đó retry phải bọc **ngoài** transaction.
 
### Vì sao các phương án còn lại sai
- **Ghi đè bản A**: đó là "last write wins" — chính thứ @Version sinh ra để chặn.
- **Bị chặn (block)**: đó là pessimistic lock ({{SELECT ... FOR UPDATE}}, xem qz-jpa-017), không phải optimistic.
- **Ném ngay tại save**: save không chạy UPDATE; chỉ flush mới thực thi.
 
### Cách retry đúng
~~~java
@Retryable(retryFor = ObjectOptimisticLockingFailureException.class, maxAttempts = 3)
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void updatePrice(Long id, BigDecimal price) { ... }
~~~
 
> Senior tip: optimistic hợp với tranh chấp thấp (form sửa hồ sơ). Với tranh chấp cao như trừ tồn kho flash sale, retry liên tục sẽ thừa — dùng câu UPDATE nguyên tử có điều kiện hoặc pessimistic lock. Đừng retry bên trong cùng transaction: entity cũ vẫn nằm trong session.`
},
{
  id: 'qz-jpa-045',
  topic: 'jpa',
  q: `Entity dùng id tự sinh (SEQUENCE, allocationSize=50). Batch insert 5.000 dòng bằng {{saveAll}}, đã bật {{hibernate.jdbc.batch_size=50}} và {{hibernate.order_inserts=true}}. Log vẫn cho thấy 5.000 câu INSERT riêng lẻ. Nguyên nhân?`,
  options: [
    'Entity quên khai báo @GeneratedValue nên Hibernate không biết id tự sinh',
    'saveAll luôn chạy tuần tự; đổi sang parallelStream là batch được',
    'Thiếu hibernate.jdbc.batch_versioned_data=true cho entity có @Version',
    'Entity dùng GenerationType.IDENTITY: Hibernate phải INSERT ngay để lấy khóa, phá batch; đổi sang SEQUENCE + pooled optimizer'
  ],
  answer: 3,
  explain: `**Đáp án đúng: GenerationType.IDENTITY buộc Hibernate INSERT ngay để lấy khóa, phá vỡ batching.**
 
### Vì sao đúng
Với {{GenerationType.IDENTITY}}, cơ sở dữ liệu sinh khóa **ngay khi câu INSERT chạy** (identity column / auto_increment). Hibernate cần khóa đó để đưa entity vào persistence context (id là "địa chỉ" của entity trong sổ tay), nên nó **phải** thực thi INSERT ngay tại {{persist()}} rồi đọc generated key. Không thể hoãn để gom nhiều INSERT thành một batch → mỗi dòng một round-trip.
 
Với {{GenerationType.SEQUENCE}}, Hibernate gọi sequence một lần lấy **một khối** khóa ({{allocationSize = 50}}, pooled optimizer) rồi cấp dần trong bộ nhớ. Vì đã biết khóa trước, entity có thể nằm chờ trong session và INSERT được gom thành batch lúc flush.
 
Kèm theo: {{hibernate.order_inserts=true}} để các INSERT cùng bảng nằm cạnh nhau, và {{flush()}} + {{clear()}} mỗi lô để session không phình.
 
### Vì sao các phương án còn lại sai
- **Entity quên @GeneratedValue**: nếu thiếu @GeneratedValue thì Hibernate coi entity là "id gán tay", vẫn có thể batch (nếu id đã có) hoặc dùng merge.
- **saveAll chạy tuần tự**: batch_size làm việc ở mức JDBC, không phụ thuộc saveAll hay loop tay.
- **batch_versioned_data**: chỉ ảnh hưởng batch cho UPDATE/DELETE có @Version, không phải INSERT.
 
> Senior tip: trên PostgreSQL dùng SEQUENCE + allocationSize (nhớ để INCREMENT BY khớp allocationSize); MySQL không có sequence thì dùng TABLE generator. Với hàng chục triệu dòng, cân nhắc bỏ JPA: JdbcTemplate.batchUpdate hoặc COPY nhanh hơn một bậc.`
},
{
  id: 'qz-jpa-046',
  topic: 'jpa',
  q: `Màn hình danh sách cần hiển thị 10.000 order, chỉ dùng 3 cột: id, mã đơn, trạng thái. Entity {{Order}} có 40 cột. Cách nào **tối ưu nhất** cho use case này?`,
  options: [
    'Dùng findAll() rồi stream().map(o -> new OrderRow(o.getId(), o.getCode(), o.getStatus()))',
    'Interface projection đóng: interface OrderRow { Long getId(); String getCode(); String getStatus(); } làm kiểu trả về',
    'Thêm @Transactional(readOnly = true) cho findAll()',
    'Đánh dấu 37 cột còn lại là @Basic(fetch = FetchType.LAZY)'
  ],
  answer: 1,
  explain: `**Đáp án đúng: interface projection đóng (closed projection).**
 
### Vì sao đúng
Khi trả entity đầy đủ, Hibernate SELECT **toàn bộ 40 cột**, tạo 10.000 entity managed, mỗi entity giữ snapshot cho dirty checking. Với màn hình chỉ cần 3 cột, đó là lãng phí I/O, heap và CPU.
 
Interface projection đóng (chỉ có getter ánh xạ thẳng thuộc tính) cho phép Spring Data sinh query **chỉ chọn các cột cần** và trả về proxy/tuple, **không phải entity managed**:
~~~java
interface OrderRow {
    Long getId();
    String getCode();
    String getStatus();
}

List<OrderRow> findAllProjectedBy(); // Spring Data hiểu tự động
~~~
Kết quả: query nhẹ, không entity trong persistence context, không dirty checking, ít heap.
 
### Vì sao các phương án còn lại sai
- **findAll rồi map**: vẫn SELECT đủ 40 cột và nạp 10.000 entity vào persistence context; map chỉ xảy ra sau đó.
- **readOnly = true**: bớt dirty checking nhưng vẫn SELECT đủ 40 cột và vẫn tạo entity.
- **@Basic(fetch = LAZY)**: với Hibernate, lazy cho cột thường chỉ có hiệu lực khi bật bytecode enhancement; nếu không thì bị bỏ qua. Mà kể cả có hiệu lực, vẫn tạo entity managed.
 
> Senior tip: quy tắc thực dụng — **đọc để hiển thị thì dùng projection/DTO, ghi thì dùng entity**. Trên bảng rộng có cột TEXT/JSONB lớn, chuyển màn hình danh sách sang projection thường giảm vài lần cả thời gian query lẫn heap.`
},
{
  id: 'qz-jpa-047',
  topic: 'jpa',
  q: `Trong một transaction, persistence context đã có entity {{Invoice}} (managed). Code chạy bulk update xoá hàng loạt {{invoice_item}} của hoá đơn đó, rồi gọi {{itemRepo.findAllByInvoiceId(id)}}. Phát biểu nào đúng? (Chọn 2)`,
  multi: true,
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
- **Bulk trước find thì find thấy dữ liệu mới**: trong **cùng** transaction, câu bulk đã chạy và đã ghi xuống DB, nên find sau đó đọc đúng dữ liệu mới; **nhưng** nếu entity đã có trong persistence context, Hibernate trả về **bản trong bộ nhớ** (first-level cache) chứ không query DB.
- **@Modifying luôn tự clear**: mặc định **không**; {{clearAutomatically = true}} mới bật. Tương tự {{flushAutomatically}}.
- **Không được chạy trong transaction**: ngược lại, {{@Modifying}} thiếu {{@Transactional}} sẽ ném TransactionRequiredException.
 
> Senior tip: quy tắc thực dụng — bulk update chỉ dùng cho hàng nghìn dòng trở lên, và luôn bật clearAutomatically. Với vài chục dòng, load entity rồi sửa bằng setter an toàn và dễ đọc hơn nhiều.`
},
{
  id: 'qz-jpa-048',
  topic: 'jpa',
  q: `Service (không có @Transactional) gọi {{repo.findById(id)}} trả về {{Order}}, rồi ở controller gọi {{order.getItems().count()}} để tính số sản phẩm. Exception nào xuất hiện?`,
  options: [
    'TransactionRequiredException ngay tại findById',
    'EntityNotFoundException vì items chưa được load',
    'Không exception, mọi quan hệ đều load kèm trong cùng câu SELECT',
    'LazyInitializationException khi controller truy cập items, vì transaction đã kết thúc và session đóng khi repo.findById trả về'
  ],
  answer: 3,
  explain: `**Đáp án đúng: LazyInitializationException khi truy cập collection lazy ngoài session.**
 
### Vì sao đúng
- Không có {{@Transactional}}, mỗi lần gọi repository method Spring mở một transaction ngắn, mở session, chạy SELECT rồi **đóng session**. Entity trả về là **detached**: nó có dữ liệu nhưng không còn "người theo dõi" để nạp thêm.
- {{items}} là collection lazy (mặc định to-many LAZY). Lúc load Order, items chưa được nạp. Khi controller gọi {{getItems().count()}}, Hibernate cần chạy một câu SELECT nữa nhưng session đã đóng → ném LazyInitializationException.
- Cách sửa: load đủ trong service đang có transaction — {{@EntityGraph(attributePaths = "items")}} trên method, hoặc {{join fetch}}, hoặc trả về DTO/projection đã tính sẵn số lượng.
 
### Vì sao các phương án còn lại sai
- **TransactionRequiredException**: chỉ xuất hiện khi chạy câu lệnh ghi/bulk ngoài transaction.
- **EntityNotFoundException**: xảy ra khi truy cập một proxy ({{getReference}}) mà hàng không tồn tại, không phải khi session đóng.
- **Không exception vì đã load kèm**: chỉ đúng nếu quan hệ EAGER hoặc đã fetch; ở đây là LAZY mặc định.
 
> Senior tip: LazyInitializationException thường xuất hiện **sau khi** tắt OSIV ({{spring.jpa.open-in-view=false}}) — đó là dấu hiệu bạn đang đọc dữ liệu ở tầng sai. Hãy chuyển việc "đếm/hiển thị" vào service, đừng để controller chạm vào collection.`
},
{
  id: 'qz-jpa-049',
  topic: 'jpa',
  q: `Entity {{Inventory}} có {{@Version}} và {{@OneToMany(mappedBy = "inventory", cascade = ALL, orphanRemoval = true) List<StockMovement> movements}}. Cần trừ tồn kho 1 đơn vị dưới tải 5.000 request/giây trên **cùng** một dòng. Cách nào xử lý đúng? (Chọn 2)`,
  multi: true,
  options: [
    'Gọi quantity-- rồi save trong transaction dài, dùng @Version để đảm bảo đúng',
    'Dùng pessimistic lock (SELECT ... FOR UPDATE) rồi gọi API thanh toán bên ngoài trong lúc vẫn giữ lock',
    'Optimistic lock: load entity có @Version, trừ quantity rồi save, retry nhiều lần khi OptimisticLockException',
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
 
> Senior tip: khoá nóng là bài toán "một dòng, nhiều writer". Giải pháp luôn là **giảm thời gian giữ lock** (một câu UPDATE nguyên tử) hoặc **giảm số writer tranh một khoá** (chia bucket tồn kho, hàng đợi, Redis). Đừng cố "tăng retry" để chữa nghẽn.`
},
{
  id: 'qz-jpa-050',
  topic: 'jpa',
  q: `Entity {{Order}} có:
~~~java
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
private List<OrderItem> items = new ArrayList<>();

public void addItem(OrderItem item) {
    items.add(item);      // thiếu item.setOrder(this)
}
~~~
Trong một transaction, code tạo order mới, gọi {{addItem(item)}} rồi {{orderRepo.save(order)}} và commit. Cột {{order_item.order_id}} nhận giá trị nào?`,
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
  id: 'qz-jpa-051',
  topic: 'jpa',
  q: `Flush mode mặc định của Hibernate là AUTO. Method sau có {{@Transactional}} (mặc định REQUIRED):
~~~java
public void process() {
    Order o = orderRepo.findById(7L).orElseThrow(); // SELECT
    o.setStatus(OrderStatus.PAID);                    // KHÔNG gọi save
    // không có flush() thủ công
}
~~~
Khi nào câu UPDATE cho status được chạy?`,
  options: [
    'Ngay tại dòng setStatus vì dirty checking chạy real-time',
    'Khi transaction commit (hoặc trước một query cần dữ liệu mới), do flush mode AUTO',
    'Không bao giờ, vì thiếu orderRepo.save(o)',
    'Khi method kết thúc, trước khi trả về cho caller'
  ],
  answer: 1,
  explain: `**Đáp án đúng: khi transaction commit (hoặc trước query cần dữ liệu mới), do flush mode AUTO.**
 
### Vì sao đúng
- {{findById}} chạy SELECT, đưa entity vào **persistence context** (first-level cache) kèm một **snapshot** (bản chụp trạng thái lúc load).
- {{setStatus}} chỉ sửa field trong bộ nhớ, **không có SQL** nào chạy lúc này.
- Lúc commit, Hibernate **flush**: so sánh entity managed với snapshot, thấy khác → sinh UPDATE. Flush mode mặc định của Hibernate là **AUTO**: flush trước khi commit VÀ trước những query cần dữ liệu mới (để kết quả query đúng).
- Nếu method là {{@Transactional(readOnly = true)}}, Spring đặt flush mode **MANUAL** nên sẽ không có UPDATE (và không dirty checking).
 
### Vì sao các phương án còn lại sai
- **Ngay tại setStatus**: setter chỉ đổi bộ nhớ; flush mới đẩy xuống DB.
- **Thiếu save thì không chạy**: với entity **managed**, dirty checking đủ; {{save()}} chỉ cần cho entity mới hoặc detached.
- **Khi method kết thúc**: method kết thúc và commit transaction là gần như cùng lúc, nhưng điểm chính xác là **flush lúc commit** (hoặc trước query), không phải "khi method return".
 
> Senior tip: vì dirty checking chạy trên toàn bộ entity managed, một method {{readOnly = false}} vô tình sửa field sẽ âm thầm ghi DB. Dùng readOnly cho method đọc để biến "quên" thành an toàn.`
},
 
);
