/* Topics: testing, behavioral — owner: task T7. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'testing-001',
  topic: 'testing',
  level: 'senior',
  q: 'Bạn thiết kế chiến lược test cho một Spring Boot service (đơn hàng + thanh toán) thế nào? Test pyramid hay testing trophy? Khi nào dùng unit test, slice test ({{@WebMvcTest}}, {{@DataJpaTest}}) và full context ({{@SpringBootTest}})?',
  a: `**Tóm tắt:** Với service Spring Boot, dùng **hình kim tự tháp có phần giữa dày**: nhiều unit test cho logic, **slice test làm tầng giữa** (Web / JPA / Redis), và rất ít E2E. Tỉ lệ thực tế 70% unit, 25% slice, 5% E2E, và CI dưới 10 phút là mục tiêu — vì test mà team không kịp chờ thì team sẽ bỏ qua.

### Test pyramid vs testing trophy
| | Test pyramid (Mike Cohn, Martin Fowler phổ biến) | Testing trophy (Kent C. Dodds) |
|---|---|---|
| Hình dạng | rất nhiều unit, ít integration, rất ít E2E | unit mỏng, integration dày, E2E mỏng |
| Quan điểm | bug tập trung ở logic nghiệp vụ | phần lớn bug nằm ở **đường biên** tích hợp, không phải ở logic |
| Khi nào đúng | domain phức tạp, nhiều quy tắc | app có ít logic, nhiều I/O |

Với Spring Boot, **trophy là mặc định hợp lý**: framework đã cấp sẵn các tầng giữa rẻ tiền (WebMvcTest, DataJpaTest) nên không cần dựng hạ tầng riêng.

### Ánh xạ layer → loại test
| Layer | Loại test | Annotation | Thời gian |
|---|---|---|---|
| Domain / service thuần | Unit | – | < 50 ms |
| Controller + validation + JSON | Slice web | {{@WebMvcTest}} | 1–2 s |
| Repository + JPQL | Slice JPA | {{@DataJpaTest}} | 2–4 s |
| Security, filter, async, message | Full context | {{@SpringBootTest}} + {{@AutoConfigureMockMvc}} | 10–30 s |
| Nhiều service, DB, broker | E2E | Testcontainers + compose | theo phút |

### Ví dụ 3 tầng cho module Order
~~~java
// 1. Unit: logic thuần, không mock gì
class OrderPricingTest {
    @Test void vip_gets_10_percent_off() {
        var pricing = new OrderPricing(new VipTierRepositoryStub());
        assertThat(pricing.total(basePrice(1_000_000), Tier.VIP)).isEqualTo(900_000);
    }
}

// 2. Slice web: chỉ nạp tầng web, service bị thay bằng mock
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;   // Boot 3.4+; @MockBean đã bị deprecated
    @Test void create_returns_201() throws Exception {
        given(service.create(any())).willReturn(OrderResponse.of("OD-1"));
        mvc.perform(post("/api/orders").contentType(APPLICATION_JSON).content("{}"))
           .andExpect(status().isCreated());
    }
}

// 3. Full context: chỉ 1–2 test khói cho luồng tiền
@SpringBootTest
@AutoConfigureMockMvc
class CheckoutFlowIT { /* đăng nhập -> tạo đơn -> thanh toán -> đối soát */ }
~~~

### Bẫy thường gặp
- **Dùng {{@SpringBootTest}} cho tất cả** → CI chậm, mất niềm tin vào pipeline, dev bắt đầu bỏ qua test đỏ.
- **Context cache**: Spring cache lại ApplicationContext theo cấu hình; mỗi lần đổi cấu hình là dựng context mới ⇒ gom test cùng cấu hình vào một lớp, tránh {{@DirtiesContext}}.
- **H2 thay Postgres** ở tầng repository ⇒ sai dialect, sai hành vi unique/index ⇒ lỗi chỉ lộ lúc production.
- **E2E chạy song song dùng chung DB** ⇒ nhiễu dữ liệu, test fail lung tung.

> Senior tip: bắt đầu bằng câu hỏi "bug gần đây của team đến từ tầng nào?". Nếu phần lớn bug đến từ mapping HTTP↔domain hoặc từ SQL thì hãy đầu tư slice test, đừng viết thêm unit test cho domain — đó là hướng hoàn đảo của "test nhiều hơn".`,
  follow: [
    'Bạn có dùng {{@SpringBootTest}} với {{webEnvironment = RANDOM_PORT}} và {{TestRestTemplate}} không? Khi nào cách đó tốt hơn {{MockMvc}}?',
    'Context cache của Spring hoạt động thế nào, và làm sao để tận dụng nó trong CI?',
    'Với một microservice có Kafka, bạn kiểm thử consumer như thế nào mà vẫn giữ được tốc độ?'
  ],
  tags: ['testing', 'SpringBootTest', 'WebMvcTest', 'DataJpaTest', 'test-pyramid']
},
{
  id: 'testing-002',
  topic: 'testing',
  level: 'senior',
  q: 'Vì sao nên dùng Testcontainers cho test tích hợp thay vì H2/embedded database? Làm sao để bộ test chạy đủ nhanh (reuse container, singleton pattern) mà vẫn đáng tin?',
  a: `**Tóm tắt:** Testcontainers chạy **đúng engine của production** (Postgres 16, Redis 7, Kafka) trong Docker, nên loại bỏ hẳn lớp bug "chạy được trên H2, chết trên production". Nhược điểm là mỗi lần khởi động container tốn vài giây — khắc phục bằng **singleton container** (dùng chung 1 instance cho cả suite) và **reuse** (giữ container sống giữa các lần chạy local).

### H2 sai ở đâu — những khác biệt đã từng gây sự cố
| Hành vi | H2 | Postgres thật |
|---|---|---|
| Kiểu JSON | không có | {{jsonb}} + index GIN |
| Auto increment | sequence | identity/sequence khác hành vi |
| {{ON CONFLICT DO UPDATE}} | hỗ trợ giới hạn | đầy đủ, kèm {{RETURNING}} |
| Timezone | theo JVM | theo cột {{timestamptz}} + session |
| So sánh chuỗi / sort | theo mode tương thích, collation đơn giản | theo collation của DB (ORDER BY khác), {{ILIKE}}, {{citext}} |
| Constraint / trigger | thiếu hoặc khác | đầy đủ, gồm cả trigger |

Bất kỳ câu query nào phụ thuộc index, unique hay transaction isolation đều **không đáng tin** khi chạy trên H2.

### Dùng Testcontainers trong Spring Boot 3
~~~java
@Testcontainers
@SpringBootTest
class OrderRepositoryIT {
    @Container
    @ServiceConnection                    // Boot 3.1+: tự nối vào spring.datasource.*
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("orders")
            .withInitScript("db/seed.sql");

    @Autowired OrderRepository repo;

    @Test void query_by_status_uses_index() { ... }
}
~~~
- Nếu dùng JUnit 5 mà chưa có {{@ServiceConnection}}, khai báo {{@DynamicPropertySource}} trỏ URL/username/password của container.
- Testcontainers cũng có "container cho mọi thứ": Redis, Kafka, MongoDB, LocalStack (để test AWS SDK mà không cần tài khoản thật).

### Tăng tốc — ba kỹ thuật
1. **Singleton pattern**: một container {{static}} dùng chung cho toàn bộ suite, khởi động một lần thay vì mỗi lớp test.
2. **Reuse**: {{withReuse(true)}} + đặt {{testcontainers.reuse.enable=true}} trong {{~/.testcontainers.properties}} → container sống qua nhiều lần chạy {{mvn test}} trên máy dev. Chỉ nên bật ở local; CI nên tắt vì mỗi job là môi trường sạch.
3. **Warm image**: pull sẵn image, đặt tag cụ thể (không dùng {{latest}}) để tận dụng Docker layer cache.

### Bẫy thường gặp
- **Không có Docker trong CI** ⇒ phải chọn runner có Docker hoặc dùng remote service container; nếu không, đừng giả vờ H2 là tương đương — hãy ghi rõ giới hạn vào README.
- **Container không được dừng** khi test fail ⇒ rò rỉ container, đầy disk. Testcontainers dùng "Ryuk" để dọn, nhưng nếu tắt Ryuk thì bạn phải dọn bằng tay.
- **Port bị chiếm** khi chạy song song ⇒ luôn để container tự cấp port động, đừng hardcode.
- **Test chậm do chờ database**: mỗi test lại chạy migration ⇒ gom migration vào {{@Sql}} hoặc chạy Flyway một lần.

> Senior tip: hãy đo trước khi tối ưu. Một suite 400 test với Postgres container dùng chung thường chạy ~3–5 phút — nhanh hơn nhiều so với việc mỗi dev phải debug một lỗi chỉ xuất hiện trên Postgres mà cả team không ai tái hiện được.`,
  follow: [
    'Làm sao dùng chung một container cho cả module mà vẫn giữ được tính độc lập của dữ liệu giữa các test?',
    'Bạn có nên bật {{@ServiceConnection}} cho cả Redis và Kafka không, hay chỉ Postgres?',
    'Nếu CI runner không có Docker thì bạn giải quyết bài toán "test trên DB thật" bằng cách nào?'
  ],
  tags: ['Testcontainers', 'integration-test', 'PostgreSQL', 'CI']
},
{
  id: 'testing-003',
  topic: 'testing',
  level: 'mid',
  q: 'Phân biệt stub, mock, spy, fake trong unit test. Khi nào việc mock quá nhiều là dấu hiệu code smell, bạn nhận ra thế nào và xử lý ra sao?',
  a: `**Tóm tắt:** Bốn loại test double khác nhau ở **mức độ "giả"**: stub chỉ trả dữ liệu, spy là object thật được ghi lại lời gọi, mock vừa trả dữ liệu vừa **kiểm chứng hành vi**, fake là bản triển khai rút gọn nhưng chạy thật. Mock quá nhiều là smell vì test đang **khẳng định cấu trúc nội bộ** thay vì hành vi quan sát được — mọi refactor đều làm test đỏ mà hệ thống vẫn đúng.

### Bốn loại test double
| Loại | Mục đích | Trong Mockito |
|---|---|---|
| Stub | cấu hình đầu ra cố định | {{when(...).thenReturn(...)}} |
| Spy | object thật, ghi lại lời gọi để verify | {{spy()}} |
| Mock | định nghĩa kỳ vọng, verify đủ thứ | {{mock()}} + {{verify()}} |
| Fake | implementation nhẹ nhưng thật | class tự viết, ví dụ repo in-memory |

Khác biệt cốt lõi: **stub chỉ trả lời, mock trả lời và còn bị kiểm chứng (verify) lời gọi**. Test chỉ dùng {{when}} mà không {{verify}} thì bản chất chỉ là stub.

### Ví dụ — assertion vào hành vi, không vào lời gọi nội bộ
~~~java
// Không tốt: test gắn chặt vào cách implement, đổi code là vỡ test
verify(paymentGateway).charge(eq(500_000L), eq("CARD-1"));

// Tốt: assert kết quả quan sát được
Order order = service.place(cmd);
assertThat(order.status()).isEqualTo(PAID);
assertThat(order.chargedAmount()).isEqualTo(500_000L);
~~~

### Dấu hiệu mock quá nhiều
- **Quan sát số lần gọi thay vì kết quả**: test đầy {{verify(mock, times(3))}} mà không assert giá trị nào từ hệ thống.
- **Phải sửa mock mỗi khi đổi implementation**: dấu hiệu bạn đang test "cách làm" chứ không phải "kết quả".
- **Test rỗng về mặt nghiệp vụ**: đổi toàn bộ logic trong service mà test vẫn xanh.
- **Mock lan truyền**: mock của mock, chuỗi lời gọi sâu vào tầng dưới — thường là dấu hiệu thiếu abstraction.
- **Test chậm bất thường**: mock nhiều thường đi kèm setup phức tạp; cân nhắc lại xem có thằng nào thuộc tầng tích hợp.

### Cách xử lý
1. **Thay mock bằng fake khi có thể**: repository in-memory, {{Clock}} cố định, JSON fixture thay cho HTTP client thật.
2. **Chỉ mock ở ranh giới hệ thống ngoài**: HTTP client, message broker, clock, random — nơi bạn không kiểm soát được.
3. **Chuyển assertion sang output quan sát được**: trạng thái entity, giá trị trả về, event đã publish.
4. **Để tầng dưới được test bằng implementation thật** thay vì mock ở tầng trên.
5. **Contract test** cho hợp đồng giữa các service thay vì mock dài hạn trong unit test.

> Senior tip: quy tắc cá nhân tôi dùng khi review PR — **một test chỉ nên fail khi hành vi quan sát được thay đổi**. Nếu đổi tên biến private hoặc thêm một lớp trung gian mà test đỏ, test đó đang khẳng định cấu trúc, và sẽ khiến team ghét viết test.`,
  follow: [
    'Bạn có dùng {{@ExtendWith(MockitoExtension.class)}} không? {{@Mock}} với {{@InjectMocks}} có những vấn đề gì?',
    'Fluent assertion library (AssertJ) giúp gì so với JUnit {{assertEquals}} thuần?',
    'Khi nào nên dùng {{@Spy}} thay vì {{@Mock}}?'
  ],
  tags: ['mockito', 'unit-test', 'test-double', 'code-smell']
},
{
  id: 'testing-004',
  topic: 'testing',
  level: 'senior',
  q: 'Hai service gọi nhau và bạn sợ một bên đổi API làm bên kia hỏng. Contract testing (Spring Cloud Contract / Pact) giải quyết thế nào? Khi nào nên dùng, và chi phí vận hành là gì?',
  a: `**Tóm tắt:** Contract test kiểm tra **hợp đồng giữa consumer và provider** ở mức API, thay vì test tích hợp toàn bộ. Có hai hướng: **consumer-driven** (Pact — consumer viết kỳ vọng rồi publish pact lên broker) và **provider-driven** (Spring Cloud Contract — provider định nghĩa contract, framework sinh test cho consumer). Đây là câu trả lời đúng khi team bị mắc kẹt ở "deploy nhanh nhưng không dám đổi API".

### Hai hướng tiếp cận
| | Pact (consumer-driven) | Spring Cloud Contract (provider-driven) |
|---|---|---|
| Ai viết contract | consumer mô tả điều mình cần | provider mô tả điều mình cung cấp |
| Artefact | file pact JSON/YAML, publish lên Pact Broker | file contract trong repo provider (DSL Groovy) |
| Kiểm chứng | provider chạy {{pactVerify}} trên CI | provider sinh test, consumer chạy test với stub server |
| Rủi ro | nhiều consumer ⇒ nhiều phiên bản contract | provider đổi contract là vỡ consumer |

Pha trộn cũng được: Pact cho consumer chủ động, Spring Cloud Contract cho hệ thống dùng chung nhiều service.

### Ví dụ contract của consumer
~~~java
// consumer: payment-service
@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "order-service")
class PaymentConsumerPactTest {
    @Pact(consumer = "payment-service")
    public RequestResponsePact orderNotFound(PactDslWithProvider builder) {
        return builder.given("order 999 does not exist")
            .uponReceiving("get order 999")
                .path("/api/orders/999").method("GET")
            .willRespondWith().status(404)
                .body(new PactDslJsonBody()
                    .stringValue("code", "ORDER_NOT_FOUND"))
            .toPact();
    }
}
~~~

### Quy trình trong CI
1. Consumer chạy test → sinh pact file → publish lên Pact Broker theo nhánh/commit.
2. Provider pipeline kéo pact tương ứng và chạy {{pactVerify}} → **fail build nếu API đã lệch**.
3. Breaking change được chặn ở CI, không phải lúc deploy production.

Với Spring Cloud Contract, provider viết contract trong Groovy DSL và framework sinh ra cả stub server cho consumer, lẫn test xác minh phía provider.

### Khi nào dùng, khi nào không
- **Nên dùng**: nhiều service, tần suất deploy lệch nhau, hợp đồng API thay đổi thường xuyên, cần deploy độc lập.
- **Không cần**: 2 service nhỏ, đã có integration test E2E ở staging, hoặc team chưa đủ năng lực vận hành thêm Pact Broker (một hạ tầng nữa cần deploy, backup, giám sát).

### Bẫy thường gặp
- **Contract test không thay thế integration test**: nó bảo đảm "hình dạng API", không bảo đảm "ngữ nghĩa nghiệp vụ".
- **Pact phình to** nếu mỗi test sinh một interaction; hãy gom các case quan trọng thành một pact, xoá các interaction cũ sau khi consumer đã deploy.
- **Breaking change âm thầm**: provider đổi response nhưng consumer chưa kịp deploy — cần chính sách version và deprecation window rõ ràng.
- **Chỉ test happy path** trong contract: hãy mô tả cả lỗi (4xx) vì đó là phần hay vỡ nhất.

> Senior tip: contract test có giá trị nhất khi nó **chạy trong CI của cả hai bên** và failure thật sự chặn deploy. Nếu chỉ tồn tại trên giấy, nó chỉ là tài liệu đẹp — hãy chứng minh bằng cách cố tình đổi response một lần và cho xem build đỏ thế nào.`,
  follow: [
    'Pact Broker lưu phiên bản contract thế nào, và làm sao xử lý khi consumer đã bị xoá?',
    'Bạn có nên dùng OpenAPI + request/response validator thay vì Pact khi hệ thống không quá lớn?',
    'Làm sao bảo đảm contract test bắt được lỗi **semantic** (khác kiểu dữ liệu) chứ không chỉ khác shape?'
  ],
  tags: ['contract-testing', 'Pact', 'SpringCloudContract', 'microservices']
},
{
  id: 'testing-005',
  topic: 'testing',
  level: 'senior',
  q: 'Làm sao test được code phụ thuộc thời gian ({{Clock}}, {{LocalDateTime}}) và code chạy đồng thời mà không bị flaky? Bạn dùng Awaitility, {{CountDownLatch}} hay gì khác?',
  a: `**Tóm tắt:** Nguyên tắc là **đẩy phụ thuộc thời gian và phụ thuộc lịch trình ra khỏi code qua interface**, rồi trong test thay bằng đồng hồ giả và điều kiện chờ có timeout. Tuyệt đối tránh {{Thread.sleep}} trong test: đó là nguồn gốc của 90% test flaky.

### Vấn đề 1 — phụ thuộc thời gian
Nếu service gọi {{Instant.now()}} trực tiếp, test sẽ phụ thuộc giờ hệ thống, múi giờ máy dev và giờ CI — cùng một code vừa pass vừa fail theo ngẫu nhiên.

~~~java
@Service
public class VoucherService {
    private final Clock clock;                       // inject, không new Date()
    VoucherService(Clock clock) { this.clock = clock; }

    public boolean isExpired(Voucher v) {
        return Instant.now(clock).isAfter(v.expiresAt());
    }
}

// production
@Bean Clock clock() { return Clock.systemDefaultZone(); }

// test: thời gian cố định, không cần chờ
Clock fixed = Clock.fixed(Instant.parse("2026-03-01T10:00:00Z"), ZoneOffset.UTC);
~~~
- Với {{LocalDate.now()}} (ngày theo múi giờ địa phương), dùng {{Clock}} + {{ZoneId}} cụ thể để tránh lệch ngày ở vùng UTC-7 so với UTC+7.
- Với cron/scheduler: **không test điểm thời gian cụ thể**, hãy tách phần "tính ra danh sách việc cần làm" thành hàm thuần nhận {{Instant}} rồi gọi trực tiếp trong test.

### Vấn đề 2 — chờ một trạng thái (Awaitility)
~~~java
await().atMost(Duration.ofSeconds(3))
       .pollInterval(Duration.ofMillis(50))
       .untilAsserted(() ->
           assertThat(orderRepository.findById(id).orElseThrow().getStatus())
               .isEqualTo(Status.PAID));
~~~
- {{await()}} **poll** trong khoảng thời gian cho phép và **fail nhanh** khi hết thời gian — đây là điểm khác biệt so với {{Thread.sleep}}.
- Luôn đặt timeout **vừa đủ**: timeout quá dài khiến CI chậm, quá ngắn thì fail giả.
- Với future/batch job, dùng {{Awaitility}} + cờ trạng thái trong DB, đừng đo bằng cách "đợi cho tới khi thấy log".

### Vấn đề 3 — test concurrency
~~~java
@Test void concurrent_deduct_has_no_lost_update() throws Exception {
    // số dư ban đầu 1000, 8 thread mỗi thread trừ 100
    var barrier = new CyclicBarrier(8);            // 8 thread cùng xuất phát
    var pool = Executors.newFixedThreadPool(8);
    var futures = new ArrayList<Future<?>>();

    for (int i = 0; i < 8; i++) {
        futures.add(pool.submit(() -> {
            barrier.await();                         // đồng bộ điểm bắt đầu
            accountRepository.deduct(100);
            return null;                             // Callable: cho phép checked exception
        }));
    }
    for (var f : futures) f.get(10, TimeUnit.SECONDS);
    pool.shutdown();

    assertThat(accountRepository.findById(1).orElseThrow().getBalance()).isEqualTo(200);
}
~~~
- **Barrier/latch để tạo race thật**: nếu không đồng bộ điểm bắt đầu, race hiếm khi xảy ra và test "xanh giả".
- Với Java 21 có thể dùng **virtual thread** để mô phỏng hàng nghìn request đồng thời mà test vẫn nhanh.
- Cần **timeout** cho mọi test concurrency: test treo làm treo cả pipeline.

### Bẫy thường gặp
- **Dùng {{@TestMethodOrder}}** để "ép" thứ tự → che giấu test phụ thuộc trạng thái của nhau. Viết lại để mỗi test tự tạo dữ liệu.
- **Random không seed** → fail không tái hiện được. Luôn truyền seed cố định.
- **Locale/TZ khác giữa máy dev và CI**: format ngày theo locale mặc định là nguồn bug "chạy ở máy tôi thì đúng".
- **Test async không chờ**: kết quả được assert trước khi tác vụ nền kịp chạy.

> Senior tip: nếu một test fail khoảng 1/20 lần, đừng "chạy lại cho tới khi xanh" — hãy tìm tầng không xác định (thời gian, thứ tự, dữ liệu dùng chung, race). Nguyên tắc: **test phải xác định**, cùng một commit phải cho cùng một kết quả.`,
  follow: [
    'Bạn có dùng {{@RepeatedTest}} hoặc công cụ nào để săn race condition không?',
    'Làm sao test được logic "retry với backoff" mà không phải chờ thật?',
    'Với hệ thống event-driven, bạn kiểm soát thời gian bằng cách nào ngoài việc dùng {{Clock}}?'
  ],
  tags: ['Awaitility', 'Clock', 'concurrency-testing', 'flaky-test']
},
{
  id: 'testing-006',
  topic: 'testing',
  level: 'mid',
  q: 'Bao nhiêu code coverage là đủ? Vì sao coverage cao vẫn có bug? Mutation testing (PIT) khác coverage ở chỗ nào và bạn dùng nó thế nào trong CI?',
  a: `**Tóm tắt:** Coverage đo **dòng code đã được thực thi**, chứ không đo "test có bắt được lỗi không". 80% coverage vẫn có thể đi kèm 0% assertion có ý nghĩa. Mutation test đo giá trị thật bằng cách **cố tình làm hỏng code** rồi xem test có phát hiện không — nên nó là metric bổ trợ, không thay thế coverage.

### Coverage nào là đủ?
| Mức | Ý nghĩa thực tế |
|---|---|
| < 50% | team chưa nghiêm túc với test; cần hỗ trợ, không cần phê phán |
| 60–70% line | mức tối thiểu chấp nhận được cho business logic |
| 80% line + 70% branch | mục tiêu hợp lý cho phần lõi nghiệp vụ |
| 100% | thường là **mục tiêu sai** — dễ dẫn tới test vô nghĩa để lấy số đẹp |

Đừng áp một ngưỡng chung cho cả repo: **DTO, entity, config, generated code không cần coverage**; phần lõi nghiệp vụ thì ngược lại.

### Vì sao coverage cao vẫn có bug
- Test chỉ assert "không ném exception" → dòng code chạy hết nhưng kết quả sai vẫn pass.
- **Assertion bị bỏ sót ở nhánh lỗi**: nhánh {{catch}} trả về giá trị mặc định, không ai kiểm tra → coverage vẫn xanh.
- **Test phụ thuộc thứ tự** làm một phần test "bị tính coverage" một cách gián tiếp.
- Coverage là **hàm của code**, không phải của chất lượng test: chỉ cần gọi hết các method là đạt 100%.

### Mutation test (PIT) hoạt động thế nào
PIT sinh ra các **mutant** — phiên bản sai của code — rồi chạy lại test:
- Mutant bị **killed** (test đỏ) → assertion của bạn có ý nghĩa.
- Mutant **survived** (test xanh) → bạn đang thiếu một test quan trọng.

~~~xml
<plugin>
  <groupId>org.pitest</groupId>
  <artifactId>pitest-maven</artifactId>
  <!-- chọn version mới nhất tương thích JDK 21 -->
  <configuration>
    <targetClasses>
      <param>com.acme.order.domain.*</param>
    </targetClasses>
    <mutationThreshold>70</mutationThreshold>
    <outputFormats><param>HTML</param></outputFormats>
  </configuration>
</plugin>
~~~
Ví dụ mutant điển hình: đổi {{>=}} thành {{>}}, xoá một nhánh {{if}}, đổi hằng số, thay {{null}} bằng giá trị mặc định.

### Dùng trong CI thế nào
- Chạy **PIT cho phần lõi nghiệp vụ** (module domain), không chạy cho toàn bộ repo — thời gian chạy tăng gấp nhiều lần so với test thường.
- Đặt **mutation threshold** làm quality gate (ví dụ 70% trên domain), và **chỉ chạy trên PR hoặc nightly** tùy tốc độ pipeline.
- Báo cáo HTML để team xem mutant nào sống sót — đây chính là danh sách "test cần bổ sung".

### Bẫy thường gặp
- **Tối ưu theo số liệu**: viết test rỗng để đạt ngưỡng coverage. Đây là lý do nhiều team bỏ hẳn metric.
- **Tính mutation score trên toàn bộ code** kể cả code không có logic → tụt số điểm vô nghĩa.
- **Coverage gate làm chậm PR** nếu chạy lại toàn bộ suite; nên dùng cơ chế "coverage delta" (chặn khi phần code mới làm giảm chất lượng) thay vì chặn tổng.

> Senior tip: hãy dùng coverage như **cảm biến sớm** (module nào chưa được test, ai vừa viết code mà không test) chứ không phải như mục tiêu. Khi cần một con số duy nhất để tranh luận với sếp, mutation score trên domain thuyết phục hơn coverage tổng.`,
  follow: [
    'Coverage "ratchet" (chặn khi phần code mới làm giảm chất lượng) hoạt động thế nào trong pipeline?',
    'Mutation testing có tốn nhiều thời gian không, và bạn ước lượng ra sao khi thêm vào CI?',
    'Bạn có dùng công cụ nào để loại bỏ test bị trùng lặp (duplicate test) không?'
  ],
  tags: ['coverage', 'PIT', 'mutation-testing', 'JaCoCo']
},
{
  id: 'testing-007',
  topic: 'testing',
  level: 'senior',
  q: 'Bạn thiết kế kịch bản load/performance test cho API đặt hàng như thế nào (JMeter, Gatling, k6)? Đọc p95/p99 ra sao để biết hệ thống cần scale hay cần sửa code?',
  a: `**Tóm tắt:** Load test không phải "bấm API một triệu lần" mà là **mô phỏng lưu lượng thật** theo workload model lấy từ log production. Khi đọc kết quả, thứ tự ưu tiên là: **error rate → p99 → throughput → tài nguyên**. p99 tăng trong khi p50 vẫn đẹp gần như luôn là dấu hiệu **rò rỉ tài nguyên hoặc contention**, không phải thiếu máy.

### Chọn công cụ
| Công cụ | Mạnh ở | Yếu ở |
|---|---|---|
| JMeter | GUI nhanh, plugin nhiều, quen thuộc ở VN | kịch bản rối, không scale tốt, kết quả khó đọc |
| Gatling | viết bằng Java/Scala, báo cáo đẹp, xử lý hàng triệu RPS | cần biết Scala/Java |
| k6 | script JavaScript cực ngắn, chạy tốt trong CI, dễ tích hợp Grafana | kịch bản phức tạp hơn thì bất tiện |

Với người đi phỏng vấn: **Gatling** (vì viết bằng Java, gần domain) hoặc **k6** (vì nhanh, dễ demo) đều là lựa chọn an toàn.

### Thiết kế kịch bản — 4 bước
1. **Lấy workload thật** từ APM/log: tỉ lệ đọc/ghi, phân bố theo endpoint, giờ cao điểm, kích thước payload, tỉ lệ user đã đăng nhập.
2. **Chọn mô hình tải**: ramp-up (đo thời gian warm-up), plateau (đo capacity bền vững), spike (đo đột biến), soak (rò rỉ bộ nhớ).
3. **Đặt SLO làm ngưỡng**, không đặt con số cảm tính: ví dụ {{p95 < 300 ms}}, {{p99 < 800 ms}}, error rate < 0.1%.
4. **Tách tầng**: test từng tầng (gateway, service, DB) để biết bottleneck nằm đâu.

### Ví dụ kịch bản k6
~~~javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    peak: {
      executor: 'ramping-arrival-rate',
      startRate: 50, timeUnit: '1s',
      preAllocatedVUs: 100, maxVUs: 500,
      stages: [
        { target: 200, duration: '2m' },
        { target: 1000, duration: '5m' },
        { target: 200, duration: '2m' },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    http_req_failed: ['rate<0.001'],   // khớp SLO error rate < 0.1%
  },
};

export default function () {
  const res = http.get(__ENV.BASE_URL + '/api/orders?page=1');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
~~~

### Đọc kết quả đúng cách
- **p99 là số quan trọng nhất**: nó phản ánh trải nghiệm của user xấu nhất. p50 đẹp + p99 tệ ⇒ có **hàng đợi, GC pause, lock contention, connection pool cạn** hoặc **downstream chậm**.
- **Throughput bão hòa** trong khi latency tăng thẳng ⇒ đã chạm giới hạn; hãy đo tài nguyên (CPU, GC, DB pool, connection đến DB) để xác định nút thắt.
- **Error rate > 0**: có thể do timeout, connection refused, hoặc rate-limit — phải đọc log theo response, không nhìn đồ thị latency.
- **Đừng so sánh latency giữa các lần chạy khi môi trường khác nhau**: cùng dữ liệu, cùng kích thước dataset, cùng cấu hình JVM.

### Bẫy thường gặp
- **Quên warm-up**: số liệu 5 phút đầu bị nhiễu bởi JIT và cache rỗng ⇒ kết luận sai.
- **Test trên máy dev** ⇒ đo bottleneck của laptop chứ không phải của hệ thống.
- **Không mô phỏng được "coordinated omission"** ở công cụ không hỗ trợ ⇒ latency bị đẹp hơn thực tế. Gatling và k6 xử lý việc này tốt hơn.
- **Chạy load test trên production** vào giờ cao điểm — không ai làm, nhưng đáng nhắc vì đây là câu hỏi phỏng vấn thực tế.

> Senior tip: luôn trình bày **số liệu trước/sau**. "p99 giảm từ 1.2 s xuống 280 ms sau khi thêm index và cache" là câu trả lời của kỹ sư; "tôi đã chạy load test" chỉ là câu trả lời của người mới đi làm.`,
  follow: [
    'Bạn chọn arrival-rate (open model) hay constant VUs (closed model) khi nào, và vì sao?',
    'Làm sao mô phỏng được lưu lượng có hệ số bất biến (bursty) thay vì đều đặn?',
    'Bạn làm gì khi phát hiện bottleneck nằm ở tầng database thay vì ứng dụng?'
  ],
  tags: ['load-testing', 'k6', 'Gatling', 'JMeter', 'p99']
},
{
  id: 'testing-008',
  topic: 'testing',
  level: 'senior',
  q: 'Bạn review code của người khác như thế nào? Checklist của một senior reviewer gồm những gì, và làm sao để review vừa hiệu quả vừa tôn trọng đồng nghiệp?',
  a: `**Tóm tắt:** Review không phải là săn lỗi style — mà là **bảo vệ sản phẩm và truyền đạt chuẩn**. Checklist của senior gồm 4 nhóm: đúng không, an toàn không, sẽ vỡ khi mở rộng không, và người khác đọc được không. Cách tôn trọng nhất là **nêu rõ mức độ ưu tiên của mỗi comment** để tác giả biết cái nào chặn merge, cái nào tùy chọn.

### Checklist review của senior
| Nhóm | Câu hỏi phải trả lời |
|---|---|
| Đúng | logic, null, biên (rỗng, 0, ngày hết hạn), idempotency |
| An toàn | SQL injection, secret trong log, phân quyền, input không kiểm soát |
| Bền vững | N+1 query, thiếu index, transaction bao quanh I/O chậm, memory leak |
| Tương thích | đổi response có phá client cũ không, migration có an toàn khi rollback không |
| Vận hành | log/metric/trace đủ để debug lúc 3 giờ sáng, retry/circuit breaker, timeout |
| Kiểm thử | logic mới có test không, test có flaky không, có assert hành vi không |
| Bền dễ đọc | tên rõ, abstraction có đúng không, comment giải thích **vì sao** chứ không **cái gì** |

### Cách viết comment hiệu quả và tôn trọng
- **Phân loại mức độ** — cách hiệu quả nhất: {{must:}} (chặn merge), {{should:}} (nên sửa, có thể defer), {{nit:}} (góp ý văn phong, không chặn). Tác giả biết ngay việc gì là bắt buộc.
- **Giải thích lý do, không chỉ ra lệnh**: "Ở đây truy vấn trong vòng lặp sẽ thành N+1 (100 bản ghi = 101 round-trip), nên cân nhắc đổi sang một truy vấn {{IN}} + map kết quả."
- **Đưa ra hướng sửa**: "Mình gợi ý tách {{validate()}} ra khỏi controller, vì hiện tại business rule nằm ở tầng Web sẽ khó tái sử dụng."
- **Khen chỗ tốt**: review tốt có cả phần khen; khen cụ thể ("cách bạn tách validation này dễ test thật tốt") tạo hành vi đúng đắn nhanh hơn phê bình.
- **Không đụng vào văn phong khi công cụ đã lo**: nếu có formatter/linter, đừng bình luận về format.
- **Review trong thời gian hợp lý**: cam kết trong 24 giờ làm việc; PR để quá 3 ngày thì tác giả nên giao cho người khác.

### Ví dụ trước / sau
- Trước: "Sao anh dùng {{List}} ở đây? Dùng {{HashMap}} đi."
- Sau: "{{should:}} Ở đây cần truy vấn theo id nên {{List}} sẽ là O(n) mỗi lần. Với dữ liệu dự kiến vài nghìn bản ghi thì chấp nhận được, nhưng nếu có thể lên tới vài trăm nghìn thì nên đổi sang {{Map}} để tra cứu O(1)."

### Bẫy thường gặp
- **Review 50 comment trong một lần** ⇒ tác giả choáng, lần sau không mở PR nữa.
- **Approve rồi mới đọc kỹ** — review hình thức là mất trắng; hãy đọc diff trước, comment sau.
- **Tranh luận về style thay vì thiết kế**: style nên do công cụ quyết định.
- **Review "cho có"**: duyệt hết mọi PR mà không nói gì cũng là một dạng phá hoại.

> Senior tip: số liệu hay để đo chất lượng review là **thời gian phản hồi đầu tiên** và **số lần PR phải sửa vòng 2**. Nếu PR sửa 3 vòng mới merge, đó là vấn đề ở cách giao tiếp hoặc chất lượng thiết kế ban đầu, không phải ở reviewer.`,
  follow: [
    'Bạn xử lý thế nào khi đồng nghiệp không đồng ý với comment của bạn và cả hai đều có lý lẽ?',
    'Có nên dùng công cụ tự động (SonarQube, review bot) để giảm tải cho reviewer không?',
    'Bạn làm gì khi phát hiện một PR có vấn đề nghiêm trọng nhưng tác giả đang gấp deadline?'
  ],
  tags: ['code-review', 'checklist', 'teamwork']
},
{
  id: 'testing-009',
  topic: 'testing',
  level: 'lead',
  q: 'Ở vai trò lead, bạn thiết kế quality gate trong pipeline CI/CD thế nào? Làm sao xử lý test flaky mà không làm team mất niềm tin vào pipeline?',
  a: `**Tóm tắt:** Pipeline phải **fail nhanh và fail đúng**: lint → compile → unit → integration → contract → E2E → deploy, mỗi tầng có ngân sách thời gian riêng. Test flaky là **sự cố hạ tầng, không phải sự cố của tác giả** — xử lý bằng cách đo, cô lập, đặt hạn chót sửa và cấm "retry cho xanh".

### Thiết kế pipeline theo tầng
| Tầng | Nội dung | Ngân sách | Khi nào chạy |
|---|---|---|---|
| 1. Lint & format | Checkstyle/Spotless, secret scan | < 2 phút | mỗi commit |
| 2. Compile + unit | build, unit test | < 3 phút | mỗi PR |
| 3. Integration | Testcontainers, slice test | < 10 phút | mỗi PR |
| 4. Contract | pact verify | < 5 phút | PR + main |
| 5. E2E | k6 smoke, API flow | < 15 phút | main, trước deploy |
| 6. Deploy | canary + smoke + auto rollback | — | sau merge |

Nguyên tắc: **tầng rẻ phải fail trước**. Không có ý nghĩa chạy 15 phút E2E khi compile đã lỗi. Với nhánh khẩn cấp, cho phép bypass tầng 4–6 nhưng **không** bypass unit test.

### Quality gate cụ thể
- **Coverage delta**: PR không được làm giảm chất lượng phần code mới (chặn theo "ratchet" thay vì ngưỡng tổng).
- **Mutation score** trên module domain (nightly hoặc theo chu kỳ, vì tốn thời gian).
- **Dependency & container scan**: OWASP Dependency-Check, Trivy cho image.
- **Không merge khi pipeline đỏ**: bật branch protection ở GitHub/GitLab, quyền merge chỉ qua pipeline.

### Flaky test — quy trình 5 bước
1. **Đo trước**: theo dõi tỉ lệ test đỏ ngẫu nhiên theo từng test id (CI provider thường có sẵn).
2. **Tái hiện**: chạy lại test fail 20 lần trong CI để xác nhận ngẫu nhiên, không phải do thay đổi code.
3. **Cô lập ngay**: gắn nhãn {{flaky}} và cho chạy ở job riêng, không chặn merge — nhưng **phải có ticket và người chịu trách nhiệm**.
4. **Đặt hạn chót**: ví dụ 7 ngày để sửa; quá hạn thì test bị xoá hoặc chuyển thành integration test.
5. **Sửa tận gốc** theo nhóm nguyên nhân: phụ thuộc thứ tự, dữ liệu dùng chung, thời gian, mạng thật, resource contention.

~~~bash
# Tái hiện flake: chạy lặp một test class 20 lần, đếm số lần đỏ
for i in $(seq 1 20); do mvn -q test -Dtest=OrderServiceIT || echo "FAIL run $i"; done
# lưu ý: -Dsurefire.rerunFailingTestsCount chỉ chạy lại test ĐÃ fail (che flake), không dùng để tái hiện
~~~

### Bẫy thường gặp
- **Dùng retry để làm pipeline xanh**: che triệu chứng, và mất luôn tín hiệu cảnh báo. Nếu buộc phải retry để chống sự cố hạ tầng, hãy tách retry sang job khác và cảnh báo khi tỉ lệ retry tăng.
- **Quarantine không có deadline**: quarantine biến thành bãi rác. Luôn gắn ticket + hạn chót.
- **E2E chạy trên PR**: khiến PR mất 20 phút và mọi người bắt đầu push nhiều lần, tăng tải CI.
- **Chỉ đo "số test"** mà không đo chất lượng: 2.000 test mà 8% flaky thì vô nghĩa.

> Senior tip: hãy theo dõi 4 chỉ số DORA — tần suất deploy, lead time, change failure rate, MTTR. Chúng nối thẳng chất lượng test với giá trị kinh doanh: giảm change failure rate là lập luận thuyết phục nhất khi xin thêm nguồn lực cho kỹ thuật.`,
  follow: [
    'Bạn có dùng "test sharding" (chia suite theo class để chạy song song) không, và chia theo tiêu chí nào?',
    'Làm sao đảm bảo test chạy trên CI giống hệt môi trường local mà không tạo thêm một bài toán cấu hình?',
    'Khi nào một test flaky nên bị xoá thay vì sửa?'
  ],
  tags: ['CI/CD', 'quality-gate', 'flaky-test', 'leadership']
},
{
  id: 'testing-010',
  topic: 'testing',
  level: 'mid',
  q: 'Bạn tổ chức test data và đảm bảo test độc lập, chạy lại cho ra cùng kết quả như thế nào? Những anti-pattern nào bạn thường gặp khi đọc code test của team khác?',
  a: `**Tóm tắt:** Test tốt phải **tự tạo dữ liệu của mình** và **không phụ thuộc thứ tự hay thời gian**. Dùng factory/builder thay vì fixture khổng lồ, luôn seed cho random, và xoá sạch dữ liệu sau mỗi test. Ba anti-pattern phổ biến nhất: {{@DirtiesContext}} để "xử lý" ô nhiễm dữ liệu, phụ thuộc thứ tự chạy, và dữ liệu nhúng trực tiếp trong test.

### Test data — 4 nguyên tắc
1. **Mỗi test tự tạo dữ liệu của nó**: không dựa vào dữ liệu test trước đó tạo ra.
2. **Dùng builder/factory thay vì JSON fixture khổng lồ**: fixture 500 dòng sẽ hỏng mỗi khi model đổi và che mất điều gì thực sự quan trọng.
3. **Random luôn có seed**: nếu không, mỗi lần fail là một lần không tái hiện được.
4. **Dữ liệu test phải đọc được**: đặt tên biến có ý nghĩa thay vì {{user1}}, {{user2}}.

~~~java
class OrderFixtures {
    static Order pendingOrder(long customerId, LocalDateTime createdAt) {
        return Order.of(customerId, List.of(Item.of("SKU-1", 2)), createdAt, Status.PENDING);
    }
}

// test tự tạo, không phụ thuộc test khác
@Test void expired_order_is_rejected() {
    var order = pendingOrder(42L, LocalDateTime.now().minusDays(2));
    assertThat(service.validate(order)).isEqualTo(REJECTED);
}
~~~

### Đảm bảo tính lặp lại
- **Cùng seed ⇒ cùng kết quả**: dùng chung một hàm seed cho toàn suite, log seed ra CI để tái hiện.
- **Cùng timezone và locale**: set cố định trong suốt suite, đừng để test "chạy được trên máy tôi".
- **Đừng dựa vào thứ tự**: nếu buộc phải dùng {{@TestMethodOrder}}, hãy coi đó là dấu hiệu cần thiết kế lại test.
- **Dữ liệu tự làm sạch**: ưu tiên transaction rollback cho test JPA, dùng {{@Sql}} để reset bảng, hoặc dùng database riêng cho suite.

### Anti-pattern thường gặp khi review test của team khác
| Anti-pattern | Biểu hiện | Hậu quả |
|---|---|---|
| Dữ liệu dùng chung | biến static, DB chung cho mọi test | test fail khi chạy song song |
| Phụ thuộc thứ tự | test B cần dữ liệu của test A | fail ngẫu nhiên, không tái hiện |
| {{@DirtiesContext}} để "vá" | xoá cache/context mỗi test | CI chậm gấp nhiều lần |
| Test quá dài | 200 dòng, nhiều assert không liên quan | không biết lỗi nằm ở đâu |
| Assert thiếu | chạy xong không kiểm tra gì | tạo cảm giác an toàn giả |
| Dữ liệu nhúng cứng | JSON 500 dòng trong repo | khó bảo trì, che mất ý nghĩa |

### Bẫy thường gặp
- **Sinh dữ liệu lớn trong mỗi test** (hàng nghìn bản ghi) làm suite chậm; hãy tạo dữ liệu tối thiểu đủ để cover nhánh.
- **Xoá dữ liệu bằng {{DELETE FROM}} không theo thứ tự** ⇒ vi phạm foreign key. Dùng truncate cascade hoặc rollback.
- **Test phụ thuộc dữ liệu của môi trường thật** (dev DB cũ) ⇒ không ai tái hiện được ngoài máy đó.

> Senior tip: một cách kiểm tra nhanh chất lượng test của team khác là **xoá sạch database và chạy ngược thứ tự các test**. Nếu đỏ ⇒ bạn đã tìm ra test phụ thuộc thứ tự, và đó thường là bug ẩn của cả những test còn lại.`,
  follow: [
    'Bạn xử lý dữ liệu test cần nhiều quan hệ (foreign key) như thế nào trong test JPA?',
    'Có nên dùng công cụ sinh dữ liệu ngẫu nhiên như Java Faker trong test không?',
    'Làm sao giữ test nhanh khi bài toán cần dữ liệu lịch sử lớn (ví dụ dữ liệu 1 năm)?'
  ],
  tags: ['test-data', 'fixture', 'determinism', 'best-practice']
},
{
  id: 'behavioral-001',
  topic: 'behavioral',
  level: 'senior',
  q: 'Kể lại sự cố production nghiêm trọng nhất bạn từng xử lý. Bạn đã làm gì, kết quả ra sao, và sau đó bạn thay đổi gì để nó không lặp lại?',
  a: `**Tóm tắt:** Câu hỏi này không hỏi "bạn có từng gặp sự cố không" mà đánh giá **phản xạ dưới áp lực, vai trò cá nhân, khả năng tìm nguyên nhân gốc và kỷ luật sau sự cố**. Câu trả lời mạnh luôn có 4 thành phần: bối cảnh cụ thể, hành động cụ thể của bạn, **số liệu đo được trước/sau**, và một thay đổi quy trình đã được áp dụng (không phải lời hứa suông).

### Interviewer muốn đánh giá gì
- **Tư duy phân tích nguyên nhân gốc**: bạn dừng ở "lỗi cấu hình" hay truy được tới điều kiện thiết kế/đồng bộ gây ra nó.
- **Vai trò cá nhân**: bạn chủ động dẫn dắt hay chỉ chạy theo. Câu hỏi hay bị hỏi tiếp: "lúc đó ai quyết định rollback, bạn hay sếp?"
- **Khả năng giao tiếp dưới áp lực**: bạn có cập nhật stakeholder và cả team hay xử lý im lặng một mình.
- **Tư duy hệ thống**: sau sự cố bạn có làm thay đổi ở tầng quy trình/monitoring/kiến trúc, không chỉ sửa cái vỡ.
- **Trung thực**: nhiều ứng viên kể một sự cố do hoàn toàn lỗi người khác — đây là tín hiệu xấu.

### Khung STAR cho câu này
- **S — Situation**: bối cảnh hệ thống, quy mô, ngày giờ, ai đang trực, mức độ ảnh hưởng.
- **T — Task**: vai trò và trách nhiệm cụ thể của bạn trong lúc sự cố diễn ra.
- **A — Action**: chuỗi hành động theo thứ tự thời gian — **làm gì trước, sau đó là gì**, và dữ liệu nào dùng để ra quyết định.
- **R — Result**: kết quả định lượng (SLO, MTTR, số người bị ảnh hưởng) + thay đổi lâu dài.

### Câu trả lời mẫu (bạn nên chuẩn bị sẵn câu của mình)
> "Sự cố nghiêm trọng nhất tôi xử lý trực tiếp là tháng 3 năm ngoái, dịch vụ thanh toán của sàn thương mại. Lúc 14:05 giờ cao điểm, sau khi deploy một bản cập nhật thư viện và cấu hình connection pool, tỷ lệ lỗi 5xx nhảy từ 0,2% lên 38% trong vòng 6 phút, khoảng 12.000 đơn bị ảnh hưởng trong 47 phút.
> Việc đầu tiên tôi làm là **dừng việc điều tra sâu và cắt thiệt hại**: rollback bản deploy trong 4 phút, đồng thời bật cảnh báo tạm thời cho endpoint lỗi để đội chỉ tập trung vào chỗ đang cháy. Sau khi dịch vụ ổn định trở lại (tổng MTTR 41 phút), tôi mới điều tra.
> Nguyên nhân gốc không phải bản thân thư viện: luồng đọc giỏ hàng chạy N+1 query, mỗi đơn 6 truy vấn — đoạn code tôi viết hai tháng trước và chưa từng gây chuyện ở tải thường; bản cấu hình mới lại giảm kích thước connection pool, nên ở cao điểm nhu cầu kết nối gấp 6 lần làm pool cạn. Bài học không phải "tránh thư viện X" mà là **mỗi thay đổi cấu hình tài nguyên phải đi kèm giới hạn an toàn**.
> Sau đó tôi đề xuất và được team đồng ý ba thứ: thêm circuit breaker cho dependency chậm, đưa connection pool lên config có giới hạn theo môi trường, và bắt buộc load test trước mỗi lần deploy có thay đổi tài nguyên. Trong 6 tháng sau đó không còn sự cố P1 nào do cạn tài nguyên; MTTR trung bình giảm từ 52 phút xuống 14 phút."

### Những điều nên tránh
- **Đổ lỗi** hoặc nói "lỗi của tầng infra, không phải phần tôi" — interviewer sẽ nghĩ bạn không chịu trách nhiệm.
- **Kể dài dòng, không có số liệu**: "hệ thống chậm, đội xử lý mất một lúc" là câu trả lời không có giá trị.
- **Chỉ mô tả hành động, không có kết quả**: phải có trước/sau.
- **Quên phần "thay đổi để không lặp lại"**: đây mới là phần phân biệt senior với mid.
- **Bịa sự cố**: nếu chưa từng gặp P1, hãy kể sự cố nghiêm trọng nhất bạn có — tính trung thực quan trọng hơn độ dramatic.

> Senior tip: chuẩn bị sẵn **3 câu chuyện** ở 3 mức: một sự cố do bạn gây ra (thể hiện chủ động), một sự cố do người khác gây ra (thể hiện phối hợp), và một lần bạn phải nói "tôi đã sai" (thể hiện trung thực). Ba câu chuyện đó, dùng lại được cho cả phỏng vấn behavioral lẫn phỏng vấn kỹ thuật.`,
  follow: [
    'Nếu sự cố xảy ra lúc 2 giờ sáng và bạn không phải người trực, bạn nhận biết qua kênh nào?',
    'Bạn có bao giờ phải quyết định rollback khi đang mất tiền thật không? Tiêu chí quyết định của bạn là gì?',
    'Sau sự cố, bạn làm gì để bảo đảm quy trình postmortem không biến thành nghi thức tìm thủ phạm?'
  ],
  tags: ['incident', 'postmortem', 'leadership', 'STAR']
},
{
  id: 'behavioral-002',
  topic: 'behavioral',
  level: 'lead',
  q: 'Bạn đã bất đồng với tech lead, architect hoặc PM ở đâu? Bạn xử lý nó như thế nào, và kết quả ra sao?',
  a: `**Tóm tắt:** Interviewer không hỏi "bạn có bao giờ bất đồng không" mà đánh giá **bạn tranh luận bằng dữ liệu và lợi ích sản phẩm chứ không bằng bản tính cá nhân**, và quan trọng nhất là **bạn vẫn cam kết với quyết định cuối cùng** sau khi thảo luận. Câu trả lời mạnh thể hiện sự trưởng thành: tôi đã thuyết phục, hoặc tôi đã thuyết phục không được nhưng vẫn thực hiện đầy đủ và vẫn đề xuất cách đo lại.

### Interviewer muốn đánh giá gì
- **Kỹ năng ảnh hưởng không phải quyền lực**: bạn thuyết phục được người giữ quyền quyết định không?
- **Chất lượng lập luận**: bạn dùng số liệu, demo hay chỉ dùng cảm tính?
- **Khả năng đồng cảm**: bạn hiểu lý do đứng phía bên kia không?
- **Tính chuyên nghiệp khi thua**: đây là câu hỏi nhiều ứng viên trả lời tệ nhất.
- **Sự cụ thể**: có số liệu và kết quả thật không.

### Khung STAR cho câu này
- **S — Situation**: ai đưa ra đề xuất gì, bối cảnh áp lực ra sao (deadline, khách hàng).
- **T — Task**: bạn phải làm gì — thách thức quyết định mà vẫn giữ quan hệ làm việc.
- **A — Action**: cách bạn thu thập bằng chứng, đề xuất phương án thay thế, và cách bạn trình bày.
- **R — Result**: quyết định cuối cùng là gì, số liệu ra sao, quan hệ làm việc còn tốt không.

### Câu trả lời mẫu
> "Có một lần khá rõ ràng. Tech lead của tôi đề xuất đưa toàn bộ dữ liệu giỏ hàng vào Redis cache để giảm tải Postgres. Lý do của anh ấy hoàn toàn hợp lý: truy vấn giỏ hàng chiếm 40% tổng tải DB và đang làm chậm cả những luồng khác.
> Tôi không phản đối vấn đề, tôi phản đối **cách giải quyết đó**. Tôi đề xuất đo trước: dựng một bản thử với 5% traffic thật trong 3 ngày. Kết quả: hit rate của cache chỉ 18% vì dữ liệu giỏ hàng thay đổi liên tục (giỏ hàng bị sửa 3–4 lần/phút), và thời gian serialize thêm khi đọc cache làm p99 của luồng đọc tăng 12 ms — tức là tổng độ trễ gần như không giảm, trong khi đội infra phải vận hành thêm một cụm Redis.
> Tôi trình bày bằng đúng câu: 'đề xuất của anh nhắm vào 40% tải DB, nhưng với hit rate 18% thì tải DB giảm ít, latency của user gần như không đổi và chúng ta tăng thêm 3 nguồn lỗi'. Tech lead đồng ý dừng, và team chọn hướng thứ hai: thêm index đúng chỗ trên Postgres, đưa giỏ hàng về Redis chỉ khi đơn hàng đã chốt. Kết quả sau 2 tuần: tải DB giảm 45% mà **không** thêm hạ tầng mới, p99 giảm từ 380 ms xuống 210 ms.
> Điều tôi học được: nếu tôi chỉ nói 'cách này không tốt' thì cuộc họp sẽ kết thúc bằng việc anh ấy vẫn làm theo ý mình. Bằng chứng là thứ biến bất đồng thành quyết định chung."

### Những điều nên tránh
- **Câu chuyện không có bằng chứng**: "tôi nghĩ cách đó sẽ chậm" — hãy có số liệu hoặc nói rõ bạn đã đo thế nào.
- **Công kích cá nhân hoặc nói "sếp tôi sai"**: kể cả khi đúng, cách nói quyết định kết quả.
- **Đặt mình lên trên người khác**: "tôi đã cảnh báo rồi" là câu trả lời của người không biết chịu trách nhiệm.
- **Câu chuyện kết thúc ở việc "tôi thắng"**: interviewer muốn biết bạn xử lý thế nào **dù thắng hay thua**.
- **Bỏ qua khía cạnh con người**: một câu chuyện bất đồng mà không có chi tiết về cách bạn bảo vệ quan hệ làm việc sẽ thiếu thuyết phục.

> Senior tip: chuẩn bị **hai phiên bản** cho cùng một sự kiện: một phiên bản cho vị trí senior và một cho vị trí lead. Ở vai trò senior, bạn tập trung vào việc **làm rõ vấn đề và đưa ra bằng chứng**; ở vai trò lead, bạn tập trung vào việc **đưa ra lựa chọn đã cân nhắc chi phí cơ hội và tự quyết khi không thể có đồng thuận**. Cùng một sự kiện, hai mức kỳ vọng hoàn toàn khác nhau.`,
  follow: [
    'Bạn có bao giờ phải **không** thuyết phục được người khác không? Bạn xử lý việc đó thế nào?',
    'Với PM, khác biệt giữa "phản đối giải pháp" và "phản đối mục tiêu" là gì?',
    'Nếu quyết định cuối cùng đi ngược ý bạn và sau đó có sự cố, bạn xử lý thế nào?'
  ],
  tags: ['conflict', 'communication', 'influence', 'STAR']
},
{
  id: 'behavioral-003',
  topic: 'behavioral',
  level: 'senior',
  q: 'Bạn từng mentoring junior như thế nào? Cụ thể bạn làm gì để người đó tiến bộ, và bạn đo lường điều đó bằng cách nào?',
  a: `**Tóm tắt:** Interviewer muốn xem bạn có **khả năng nhân bản năng lực của chính mình** hay không — đây là tiêu chí cốt lõi để đi từ senior lên lead/tech lead. Câu trả lời mạnh không kể chuyện "tôi hay code review cho họ", mà kể một **hệ thống có lịch, có đo lường, có kết quả**.

### Interviewer muốn đánh giá gì
- **Phương pháp có hệ thống** hay chỉ là "giúp khi nào hỏi".
- **Khả năng truyền đạt**: bạn có giải thích **vì sao** thay vì chỉ đưa đáp án không?
- **Tư duy phân tích năng lực**: bạn tìm đúng điểm yếu của người đó hay chỉ dạy theo thói quen.
- **Khả năng đo lường**: mentoring mà không đo thì không quản lý được.
- **Sự kiên nhẫn và tinh thần** — bạn có coi việc dạy là phần việc chứ không phải việc phụ.

### Khung STAR cho câu này
- **S — Situation**: người được mentoring là ai, bối cảnh team, điểm yếu cụ thể.
- **T — Task**: mục tiêu của bạn — không phải "dạy code" mà là một năng lực cụ thể.
- **A — Action**: các hoạt động cụ thể bạn tổ chức và cách bạn đo.
- **R — Result**: số liệu thay đổi và bằng chứng năng lực đã lớn lên.

### Câu trả lời mẫu
> "Năm ngoái tôi mentoring một bạn kỹ sư mới có 8 tháng kinh nghiệm, được giao module thanh toán. Vấn đề không phải là kiến thức — bạn viết được code — mà là **bạn không tự tin phát hiện vấn đề trong code của chính mình**, và PR thường phải sửa 2–3 vòng.
> Tôi không bắt đầu bằng việc dạy Java hay framework. Tôi làm ba việc: (1) đặt mục tiêu cụ thể là 'tự review được PR của mình trước khi gửi', (2) chơi **review ngược**: mỗi tuần tôi gửi lại PR của bạn kèm **số lượng** lỗi tôi tìm được (không chỉ chỗ), để bạn tự tìm rồi đối chiếu — nếu tôi chỉ sửa thẳng thì bạn chỉ học được 'anh sửa cái này', không học được cách tìm; (3) mỗi tháng hai buổi 1-1, trong đó tôi đưa một câu hỏi duy nhất: 'tháng này bạn tự bắt được lỗi gì mà trước đây bạn không bắt được?'. Kết quả câu trả lời đó chính là thước đo tiến bộ.
> Sau 5 tháng: số vòng sửa PR trung bình giảm từ 2,8 xuống 1,1; thời gian review của tôi với bạn giảm từ trung bình 2 ngày xuống 4 giờ; và bạn tự viết được 4 module mới không cần tôi xem trước. Sau đó bạn được điều chuyển sang làm lead của một nhóm nhỏ 3 người.
> Bài học tôi rút ra: mentoring không phải là nói nhiều, mà là **thiết kế để người học tự tạo ra phản hồi**; còn tôi đóng vai trò đặt câu hỏi và cung cấp feedback đúng lúc."

### Những điều nên tránh
- **Con số không kiểm chứng được**: "tôi mentoring 5 người, họ đều lên senior" — interviewer sẽ hỏi cụ thể.
- **Mentoring kiểu "tôi làm thay"**: người học sẽ không tiến bộ và bạn sẽ thành nút thắt.
- **Chỉ dạy kiến thức, không dạy cách làm việc**: kỹ sư giỏi nhưng không biết ưu tiên, ước lượng, giao tiếp thì vẫn không lên được.
- **Bỏ qua việc cần nuôi dưỡng quan hệ**: mentoring chỉ hiệu quả khi người đó tin bạn.
- **Không kết nối mentoring với công việc thật**: bạn phải giao việc có độ khó tăng dần, nếu không không có gì để đo.

> Senior tip: khi bạn được hỏi về mentoring ở vòng phỏng vấn senior/lead, hãy chuẩn bị **một câu chuyện có số liệu trước/sau** và **một câu chuyện về một người bạn không mentoring thành công**. Câu thứ hai cho thấy bạn hiểu mentoring không phải công thức áp cho mọi người, và đó là dấu hiệu của tư duy lead.`,
  follow: [
    'Bạn đo lường hiệu quả của mentoring bằng cách nào ngoài cảm nhận chủ quan?',
    'Làm sao mentoring một người có tính cách khác bạn (ví dụ hướng nội, thích làm một mình)?',
    'Bạn có bao giờ phải nói với một người rằng họ chưa phù hợp với vị trí không? Bạn xử lý ra sao?'
  ],
  tags: ['mentoring', 'leadership', 'onboarding', 'STAR']
},
{
  id: 'behavioral-004',
  topic: 'behavioral',
  level: 'senior',
  q: 'Kể một quyết định kỹ thuật của bạn đã sai, và bạn đã học được gì từ đó? Bạn đã làm gì để tránh lặp lại?',
  a: `**Tóm tắt:** Đây là câu hỏi đo **trí tuệ và khả năng học**, không đo kỹ thuật. Câu trả lời tốt thừa nhận lỗi **cụ thể, có số liệu**, chỉ ra được **mối liên hệ giữa quyết định sai và hậu quả đo được**, và mô tả một **cơ chế đã được đưa vào quy trình** để ngăn lặp lại. Trả lời kiểu "tôi chưa từng sai" là đáp án tệ nhất.

### Interviewer muốn đánh giá gì
- **Khiêm tốn và trung thực**: bạn có nhìn nhận được giới hạn của bản thân không.
- **Khả năng phân tích lỗi của chính mình**: bạn tìm ra tầng nào trong quy trình đã lỡ.
- **Tư duy hệ thống**: bạn sửa cá nhân hay sửa để cả team không lặp lại.
- **Không đổ lỗi**: nhận lỗi + giải pháp là mẫu hành vi của người đáng tin cậy.
- **Mức độ trưởng thành**: một lỗi ở level senior được xử lý tốt là bằng chứng trưởng thành hơn nhiều lỗi ở level junior.

### Khung STAR cho câu này
- **S — Situation**: bối cảnh quyết định, ràng buộc lúc đó, thông tin gì bạn có/không có.
- **T — Task**: bạn đã ra quyết định gì, và bạn tin vào điều gì lúc đó.
- **A — Action**: điều gì đã xảy ra, bạn xử lý thế nào, và bạn **truy tới đâu trong quy trình** để tìm ra lỗ hổng.
- **R — Result**: thiệt hại thực tế, cách bạn khắc phục, và cơ chế phòng ngừa đã áp dụng (có thể đã được áp sau này).

### Câu trả lời mẫu
> "Quyết định sai rõ ràng nhất của tôi là khi đưa luồng kiểm tra tồn kho sang đọc từ read replica của Postgres. Lý do lúc đó nghe rất hợp lý: tồn kho được ghi nhiều, đọc nhiều, và chúng ta đang có áp lực đọc ở đỉnh. Tôi cũng đã xem số liệu: 80% truy vấn là đọc.
> Cái tôi **không** kiểm tra là độ trễ replication tại đúng thời điểm cao điểm. Ở mức tải bình thường lag là 200–300 ms, nên mọi thứ đều ổn trong test. Nhưng trong ngày sale lớn, khi luồng ghi hàng loạt, lag lên tới 4 giây. Hệ quả là hệ thống bán ra hàng đã hết — tỷ lệ oversell đạt 0,7%, phải hoàn tiền cho 1.900 đơn.
> Sau sự cố tôi sửa bằng cách đọc tồn kho từ primary với read consistency thật sự, hoặc chấp nhận oversell rồi bù bằng hàng dự bị — tùy nghiệp vụ. Nhưng phần quan trọng hơn là tôi nhận ra lỗ hổng trong quy trình của chính mình: quyết định kiến trúc của tôi **chỉ dựa trên số liệu ở tải trung bình**, và không có câu hỏi nào buộc phải xét hành vi khi tải biến động.
> Từ đó tôi đề xuất và team áp dụng hai thứ: mọi quyết định hạ tầng phải kèm một mục 'hành vi khi tải đột biến' trong tài liệu thiết kế, và bắt buộc chạy load test trước khi đưa tính năng vào đường đi chính. Từ đó tôi chưa từng đưa ra quyết định nào mà không có số liệu tải tương ứng."

### Những điều nên tránh
- **Chọn lỗi quá nhỏ để vô nghĩa**: "tôi quên import một class" làm câu trả lời mỏng.
- **Chọn lỗi quá lớn mà hấp dẫn**: kể một sự cố kinh dị mà bạn thực tế chỉ nghe kể — rất dễ bị phỏng vấn đào.
- **Kết thúc bằng "bài học là phải cẩn thận hơn"**: câu này không có giá trị, hãy nói rõ bạn đã **thay đổi quy trình thế nào**.
- **Đổ lỗi bối cảnh**: "quyết định đó là của kiến trúc sư" — vẫn là quyết định bạn đồng ý chịu trách nhiệm.
- **Không nói rõ mình đã gây ra thiệt hại bao nhiêu**: sự cụ thể là điều tác giả của câu trả lời tin vào bạn.

> Senior tip: hãy chuẩn bị sẵn 2 câu chuyện: một lỗi do **quyết định kiến trúc** (thể hiện tư duy hệ thống) và một lỗi do **thiếu cẩn trọng về vận hành** (thể hiện sự trưởng thành). Câu hỏi này cũng là nơi bạn thể hiện khả năng **nói thẳng điều chưa tốt** — với nhiều interviewer, đó là tín hiệu đáng tin cậy nhất mà họ tìm kiếm.`,
  follow: [
    'Làm sao phân biệt "quyết định sai" với "quyết định đúng nhưng may mắn"?',
    'Bạn có dùng tài liệu quyết định kiến trúc (ADR) không? Nó giúp ích gì trong chuyện này?',
    'Sau bao lâu thì bạn coi một quyết định đã sai là "chấp nhận được"?'
  ],
  tags: ['self-reflection', 'postmortem', 'architecture-decision', 'STAR']
},
{
  id: 'behavioral-005',
  topic: 'behavioral',
  level: 'senior',
  q: 'Bạn ước lượng công việc thế nào khi deadline gấp? Khi scope không vừa, bạn đàm phán với PM như thế nào?',
  a: `**Tóm tắt:** Interviewer muốn biết bạn có **đàm phán thay vì "đồng ý cho có"** hay không. Câu trả lời mạnh thể hiện ba thứ: ước lượng **có cơ sở và có điểm bất định**, phương án **cắt scope có hình thức** (không phải "làm cho xong"), và việc **minh bạch về rủi ro** ngay từ đầu chứ không phải khi sắp trễ hạn.

### Interviewer muốn đánh giá gì
- **Kỹ năng phân rã và ước lượng**: bạn có chia nhỏ công việc, đánh giá rủi ro, không đưa ra con số bừa.
- **Tinh thần đàm phán**: bạn bảo vệ chất lượng kỹ thuật mà không trở thành người chặn tiến độ.
- **Sự trung thực về rủi ro**: báo sớm là kỹ năng, giấu và báo muộn là lỗi.
- **Hiểu business**: bạn biết đánh đổi giữa "đủ tính năng" và "đúng trải nghiệm".
- **Khả năng giao tiếp với PM không kỹ thuật**: nói rõ rủi ro bằng ngôn ngữ nghiệp vụ.

### Khung STAR cho câu này
- **S — Situation**: deadline đến từ đâu (khách hàng, sự kiện, cam kết quý), áp lực ra sao.
- **T — Task**: phạm vi được giao là gì, ước lượng ban đầu của bạn ra sao.
- **A — Action**: bạn phân rã thế nào, đề xuất phương án cắt scope nào, trao đổi với PM ra sao.
- **R — Result**: kết quả đạt được, rủi ro nào còn lại, bài học về ước lượng.

### Câu trả lời mẫu
> "Một lần điển hình: PM nhận cam kết với khách hàng là có tính năng 'xuất báo cáo tổng hợp' trước ngày họp giữa tháng, tức khoảng 12 ngày. Khi tôi nhận việc, backlog có 3 hạng mục liên quan với tổng cộng 21 điểm tương đương — nhiều hơn khả năng của 2 kỹ sư trong 10 ngày làm việc.
> Tôi làm ba việc. Một: phân rã từng hạng mục thành task nhỏ để lộ ra điểm bất định — hóa ra phần khó nhất là không phải xuất file, mà là **định nghĩa báo cáo nào ai được xem**, và phần đó cần chờ khách hàng trả lời. Hai: đo tốc độ thực tế của team bằng dữ liệu sprint trước (velocity trung bình của 2 người khoảng 13 điểm/2 tuần) thay vì cảm tính. Ba: đi gặp PM **trước khi** cam kết cứng, đưa ra 3 phương án.
> Phương án tôi đề xuất và được chọn: giao **một** báo cáo duy nhất cho vai trò quản lý, dùng bộ lọc có sẵn trong hệ thống báo cáo cũ thay vì xây bộ tổng hợp mới; đồng thời đưa phần báo cáo chi tiết ra sau sprint kế tiếp và ghi rõ trong release note. Tôi cam kết 13/21 điểm trước deadline, 8 điểm còn lại có mốc rõ ràng. Quan trọng nhất, tôi đề nghị ghim một mốc cho khách hàng ở giữa sprint để rà soát.
> Kết quả: giao đúng hạn 13/21 điểm, không có sự cố P1, khách hàng dùng được ngay và không phát sinh thêm yêu cầu đột xuất. Bài học: khi deadline gấp, thứ cần thương lượng không phải thời gian mà là **phạm vi và thứ tự ưu tiên**, và việc đó phải xảy ra ở đầu chu kỳ chứ không phải khi đã sắp trễ."

### Những điều nên tránh
- **Cam kết khi chưa biết**: "anh cứ giao đi, em làm được" — đây là câu trả lời làm mất lòng tin nhanh nhất.
- **Ước lượng bằng cảm tính** rồi hứa cứng: không có cơ sở để bảo vệ con số đó.
- **Không báo rủi ro sớm**: báo rủi ro vào ngày cuối gần như luôn kém hơn báo sớm.
- **Cắt scope bằng cách cắt chất lượng âm thầm**: thiếu test, thiếu xử lý lỗi, rồi gọi đó là "hoàn thành" — đây là cách tệ nhất.
- **Đổ lỗi PM**: "PM bảo sai" — hãy nói bạn đã **đưa ra lựa chọn và đề xuất cách xử lý**.
- **Không đưa ra lựa chọn cụ thể**: nói "chúng ta có thể làm nhanh hơn" mà không kèm danh sách đánh đổi là vô nghĩa.

> Senior tip: hãy luôn chuẩn bị **cách tính ước lượng của bạn** (velocity, điểm tương đương, hoặc bằng lịch trình ngược từ deadline) cùng với câu chuyện. Nhiều người trả lời câu này bằng trải nghiệm nhưng không dám nói "tôi ước lượng kiểu này" — và đó chính là thứ phân biệt một senior với một mid trong mắt interviewer.`,
  follow: [
    'Bạn có dùng story point không, và điểm story có thực sự giúp ích không?',
    'Khi PM không đồng ý cắt scope, bạn còn lựa chọn nào ngoài việc làm quá sức?',
    'Có bao giờ ước lượng của bạn sai lệch lớn không? Bạn đã hiệu chỉnh cách ước lượng ra sao?'
  ],
  tags: ['estimation', 'scope-negotiation', 'PM', 'STAR']
},
{
  id: 'behavioral-006',
  topic: 'behavioral',
  level: 'lead',
  q: 'Business chỉ muốn ship feature, còn đội bạn đang chôn dưới technical debt. Bạn xử lý tình huống này như thế nào?',
  a: `**Tóm tắt:** Ở vai trò lead, điểm mấu chốt là **định giá technical debt bằng đơn vị business** (tiền, thời gian, rủi ro), không bằng "code khó đọc". Sau đó bạn phải đề xuất một **cơ chế tài nguyên cố định** — thường là ngân sách 20% mỗi sprint — để việc giảm nợ trở thành quy trình, không phụ thuộc vào việc ai đủ nhiệt huyết.

### Interviewer muốn đánh giá gì
- **Tư duy business**: bạn dịch được vấn đề kỹ thuật sang tác động doanh thu/rủi ro.
- **Khả năng đề xuất thay đổi quy trình**, chứ không chỉ "làm thêm việc".
- **Kỷ luật trong cam kết**: bạn có đủ kiên nhẫn để giữ ngân sách nợ qua nhiều sprint không.
- **Sự trung thực**: nợ kỹ thuật luôn tồn tại; câu hỏi là bạn có quản lý nó hay chỉ than phiền.
- **Tư duy phân bổ**: biết cái nào nên sửa ngay, cái nào nên ghi nhận và chấp nhận.

### Khung STAR cho câu này
- **S — Situation**: trạng thái nợ kỹ thuật cụ thể và bối cảnh business (deadline, khách hàng, chi phí).
- **T — Task**: nhiệm vụ của bạn là gì — không phải "giải quyết hết nợ" mà là "khiến nợ không tiếp tục tích tụ và làm giảm rủi ro lớn nhất".
- **A — Action**: bạn đo lường thế nào, trình bày ra sao, đề xuất cơ chế nào.
- **R — Result**: số liệu trước/sau, và quy trình có sống sót sau bạn rời đi không.

### Câu trả lời mẫu
> "Tôi từng phụ trách một service có 3 năm tuổi. Khi tôi vào, backlog sản phẩm đề xuất thêm ~40 story point mỗi sprint, còn nhóm kỹ sư thì mới đủ 25–28 điểm — nghĩa là mọi sprint đều âm thầm chuyển 12 điểm thành nợ.
> Tôi không đề xuất 'làm bớt feature để trả nợ', vì đó là lập luận mà PM sẽ bác. Tôi đi đo trước. Tôi lấy dữ liệu APM và log lỗi, và tìm ra một mối liệu rất rõ: **báo cáo doanh thu** chiếm 35% thời gian query của toàn hệ thống, và chạy trên bảng 80 triệu bản ghi với 3 truy vấn con trong mỗi lần tải. p95 của màn hình này là 4,2 giây; 240 nhân viên dùng nó mỗi ngày và 30% phải đóng tab rồi mở lại.
> Tôi trình bày với PM bằng ngôn ngữ của họ: 'màn hình này chậm 4,2 giây, 240 người dùng mỗi ngày, mỗi giây chờ là một nhân viên bán hàng không gọi được khách hàng'. Đề xuất cụ thể: dành **20% capacity mỗi sprint** cho nợ kỹ thuật — tức khoảng 5–6 điểm — và cam kết sẽ đưa ra số liệu sau 2 sprint. Chúng tôi sửa bằng cách đưa báo cáo sang một bảng tổng hợp theo ngày cập nhật định kỳ, thay vì join trực tiếp.
> Sau 2 sprint: p95 giảm từ 4,2 giây xuống 0,9 giây; số ticket P1 liên quan tới màn hình báo cáo giảm 70%; và quan trọng nhất, **ngân sách 20% được giữ thành quy ước của team**, nên khi tôi chuyển việc sau đó, nó vẫn còn hiệu lực — sprint sau đó vẫn dành 5 điểm cho nợ.
> Bài học: nợ kỹ thuật không thuyết phục được ai chỉ bằng thuật ngữ kỹ thuật, và cũng không tự biến mất nếu không có một khoản capacity cố định. Trước khi tôi vào, team đã thử cả hai cách: xin thêm người không được, đề nghị cắt feature thì bị từ chối."

### Những điều nên tránh
- **Kêu khổ bằng thuật ngữ**: "legacy code khó maintain" không chuyển được ý cho người quyết định.
- **Đưa ra con số nợ không có nguồn**: "còn 5000 dòng code kỹ thuật nợ" — không ai hành động vì con số đó.
- **Chỉ nói "cần thêm người"**: đây là câu trả lời khiến bạn nghe như không kiểm soát được gì.
- **Hứa "sẽ dọn dẹp sau"**: không có ngân sách cụ thể thì nợ chỉ được dồn sang sprint sau.
- **Tranh luận về nguyên tắc kỹ thuật thay vì mục tiêu sản phẩm**: ví dụ tranh cãi về việc dùng framework nào.
- **Không nói rõ mình đã đo được gì** trước khi đề xuất.

> Senior tip: hãy chuẩn bị **một câu số liệu quy đổi** mà bạn dùng để nói về nợ kỹ thuật với người không kỹ thuật — ví dụ 'mỗi giây thêm trên màn hình báo cáo tương đương 240 nhân viên mất 4 phút mỗi ngày'. Một câu như vậy thuyết phục tốt hơn cả một slide kiến trúc.`,
  follow: [
    'Bạn định giá nợ kỹ thuật bằng thước đo nào ngoài "số giờ sửa"?',
    'Nếu business liên tục phá vỡ cam kết 20%, bạn làm gì?',
    'Bạn có bao giờ phải chấp nhận nợ kỹ thuật và ghi nhận nó thay vì sửa không?'
  ],
  tags: ['technical-debt', 'leadership', 'stakeholder', 'STAR']
},
{
  id: 'behavioral-007',
  topic: 'behavioral',
  level: 'lead',
  q: 'Kể lại một dự án hoặc migration lớn mà bạn dẫn dắt từ đầu đến cuối. Bạn đã làm gì để nó thành công?',
  a: `**Tóm tắt:** Câu hỏi này là bài kiểm tra năng lực **leadership ở tầng dự án**: khả năng chia nhỏ, lập kế hoạch có rủi ro, giữ thông tin, và — yếu tố hay bị bỏ sót — **xử lý khi kế hoạch đi sai**. Câu trả lời mạnh luôn có một phần "kế hoạch ban đầu sai ở đâu và tôi đã sửa ra sao".

### Interviewer muốn đánh giá gì
- **Tư duy chia nhỏ và lập kế hoạch**: bạn có tiêu chí hoàn thành rõ ràng cho từng giai đoạn không.
- **Quản lý rủi ro**: bạn đã nhận diện rủi ro gì, đã chuẩn bị thế nào, và rủi ro nào đã xảy ra.
- **Khả năng phối hợp nhiều vai trò**: dev, QA, DBA, DevOps, product.
- **Truyền thông**: bạn có báo cáo tiến độ và rủi ro chủ động không.
- **Khả năng đưa ra quyết định khi thông tin chưa đầy đủ**.

### Khung STAR cho câu này
- **S — Situation**: dự án là gì, quy mô, hạn chót, ràng buộc kỹ thuật và tổ chức.
- **T — Task**: bạn chịu trách nhiệm phần nào, các bên liên quan là ai.
- **A — Action**: cách chia giai đoạn, cách xử lý rủi ro, cách quyết định khi kế hoạch đổi.
- **R — Result**: kết quả định lượng, và phần nào chưa đạt.

### Câu trả lời mẫu
> "Năm ngoái tôi dẫn dắt việc tách monolith đơn hàng (khoảng 400.000 dòng code) thành 4 service. Ràng buộc lớn nhất: **không được downtime**, và hệ thống đang chạy mùa sale với lưu lượng gấp 8 lần ngày thường.
> Tôi bắt đầu bằng việc **làm rõ mục tiêu trước khi lên kế hoạch**: không phải 'tách hết', mà là 'tách được phần có đau đớn nhất và giảm rủi ro release'. Tôi đề xuất bắt đầu từ module báo cáo vì nó độc lập, ít người dùng nhưng lại là nơi đang gây đau. Sau đó tôi chia thành 5 giai đoạn với tiêu chí hoàn thành bằng số liệu: đo cái gì, chuyển traffic bao nhiêu phần trăm, và điều kiện gì thì rollback.
> Ba rủi ro tôi đã lường trước và chuẩn bị: (1) dữ liệu dùng chung giữa các module → giải quyết bằng **dual-write** có cờ bật/tắt và quy trình backfill; (2) deploy lúc mùa sale → chốt cửa sổ triển khai trước mùa sale, có feature flag để tắt; (3) team không quen với service mới → tôi dành 2 tuần đầu cho **đào tạo và viết runbook**, không yêu cầu ai code production trước khi hiểu hệ thống cũ.
> Kế hoạch ban đầu của tôi **sai ở một chỗ**: tôi ước lượng việc đồng bộ dữ liệu lịch sử chỉ mất 3 ngày, thực tế là 11 ngày vì dữ liệu có sai lệch kiểu dữ liệu từ nhiều nguồn. Khi phát hiện, tôi dừng giai đoạn backfill, đưa ra lựa chọn mới: chỉ backfill 6 tháng gần nhất và để dữ liệu cũ ở monolith, đọc qua API khi cần. Việc này làm giai đoạn đó trễ khoảng 1 tuần, vẫn nằm trong phần dự phòng nên giữ đúng mốc ra mắt.
> Kết quả: 4 service đã tách và chạy production, **zero downtime** trong suốt quá trình, số endpoint monolith giảm từ 210 xuống 47, thời gian deploy của một thay đổi nhỏ giảm từ 25 phút xuống 4 phút. Phần chưa đạt: chúng tôi chưa tách được module thanh toán — phần đó còn nằm ở monolith và là nợ tồn đọng tôi đã ghi lại cùng lý do và đánh giá rủi ro."

### Những điều nên tránh
- **Dùng đại từ "tôi" cho mọi thứ**: bạn cần nói rõ phần của bạn và phần của đội; interviewer muốn biết bạn lãnh đạo, không phải bạn làm hết.
- **Chỉ mô tả kế hoạch, không có kết quả**: cần số liệu trước/sau.
- **Giấu phần thất bại**: câu chuyện hoàn hảo 100% làm interviewer nghi ngờ; phần "kế hoạch sai và tôi sửa ra sao" lại là phần thuyết phục nhất.
- **Không nói về rủi ro và con người**: nếu không có gì về cách bạn xử lý rủi ro, câu trả lời thiếu chiều sâu của vai trò lead.
- **Nhảy số liệu không có nguồn**: "tăng 300% hiệu năng" mà không nói đo thế nào sẽ bị hỏi lại.

> Senior tip: hãy chuẩn bị câu chuyện bằng **cấu trúc slide 3 phần**: mục tiêu và ràng buộc, kế hoạch giai đoạn kèm rủi ro, và kết quả kèm phần chưa đạt. Câu chuyện có cấu trúc khiến bạn nghe như đang **quản lý**, không kể lể — và đó chính là điều họ đang tìm ở một ứng viên lead.`,
  follow: [
    'Bạn làm thế nào để ước lượng công việc khi dự án có nhiều phần chưa rõ?',
    'Nếu một thành viên team phản đối kế hoạch của bạn, bạn xử lý thế nào?',
    'Bạn có bao giờ phải dừng dự án giữa chừng không, và quyết định đó dựa trên căn cứ gì?'
  ],
  tags: ['project-leadership', 'migration', 'planning', 'STAR']
},
{
  id: 'behavioral-008',
  topic: 'behavioral',
  level: 'senior',
  q: 'Bạn làm việc với stakeholder không kỹ thuật (bộ phận kinh doanh, CS, vận hành) như thế nào? Cho một ví dụ cụ thể.',
  a: `**Tóm tắt:** Interviewer muốn biết bạn có **dịch được yêu cầu kỹ thuật sang giá trị kinh doanh** hay không. Ở vai trò senior, bạn được kỳ vọng là người **tự đi tìm câu hỏi đúng** trước khi ai đặt câu hỏi, và dùng số liệu để thảo luận thay vì dùng thuật ngữ.

### Interviewer muốn đánh giá gì
- **Kỹ năng dịch thuật ngữ**: bạn có giải thích được vấn đề kỹ thuật mà không dùng từ kỹ thuật không.
- **Hiểu mục tiêu trước khi giải pháp**: bạn có hỏi "vấn đề nghiệp vụ là gì" không.
- **Tư duy trade-off**: bạn đưa ra lựa chọn kèm đánh đổi chi phí và thời gian.
- **Quan tâm tới người dùng thật**: bạn có về phía khách hàng/CS để hiểu không.
- **Cách truyền đạt rủi ro**: nói thẳng điều không chắc chắn mà vẫn đưa ra lựa chọn.

### Khung STAR cho câu này
- **S — Situation**: ai đưa ra yêu cầu, họ quan tâm điều gì, ràng buộc thời gian.
- **T — Task**: điều bạn cần làm là hiểu đúng vấn đề, không phải làm đúng yêu cầu.
- **A — Action**: bạn hỏi gì, đo gì, đề xuất gì, và cách bạn trình bày lựa chọn.
- **R — Result**: kết quả có đáp ứng được kỳ vọng của họ không, và số liệu ra sao.

### Câu trả lời mẫu
> "Một ví dụ rất điển hình: bộ phận chăm sóc khách hàng phản ánh rằng 'khách không thấy đơn hàng cập nhật trạng thái kịp'. Ban đầu yêu cầu được hiểu là 'cần real-time trong 5 giây'. Nếu tôi nhảy vào đề xuất kiến trúc real-time thì sẽ tốn hàng tháng và không giải quyết đúng vấn đề.
> Tôi làm ba việc trước. Một: hỏi lại — 'khách hàng chờ kết quả để làm gì, và họ đang chờ bao lâu?'. Câu trả lời: khách gọi điện hỏi trạng thái đơn vì không có thông báo; 80% đơn được cập nhật trong vòng 2 phút, và những đơn chậm hơn 5 phút là loại đơn cần canh (đơn đổi trả, đơn chờ xác nhận). Hai: tôi đi quan sát thực tế — đọc log và hỏi 5 khách hàng đang gọi điện — và phát hiện vấn đề không phải độ trễ mà là **thiếu thông báo chủ động**. Ba: tôi báo cáo lại bằng số liệu: 'chúng ta không cần real-time 5 giây, chúng ta cần thông báo trong 30 giây'.
> Tôi đề xuất 2 giai đoạn: giai đoạn 1 trong sprint này — gửi thông báo qua Zalo ZNS/email khi trạng thái đơn thay đổi, thời gian xử lý 1–2 ngày, giảm 60% cuộc gọi hỏi thăm; giai đoạn 2 sau, nếu dữ liệu cho thấy vẫn còn nhu cầu thật sự thì mới làm luồng real-time qua WebSocket.
> Kết quả sau 3 tuần: số cuộc gọi hỏi trạng thái đơn giảm 58%, đội CS tiết kiệm khoảng 120 giờ mỗi tuần, và **không** phát sinh đầu tư kiến trúc real-time. Yêu cầu ban đầu của CS không được đáp ứng đúng nghĩa đen, nhưng vấn đề của họ thì đã được giải quyết — và đó là điều tôi nói thẳng với họ ngay từ đầu."

### Những điều nên tránh
- **Trả lời bằng thuật ngữ**: "chúng ta sẽ dùng WebSocket và Kafka" — người không kỹ thuật nghe như nhiễu.
- **Nhảy tới giải pháp trước khi hiểu vấn đề**: đây là lỗi phổ biến nhất và cũng là lý do nhiều tính năng bị xoá sau khi làm xong.
- **Hứa "real-time" cho mọi thứ** rồi không kịp giao: mất niềm tin.
- **Không đưa ra lựa chọn kèm đánh đổi**: cần nói rõ cái nào nhanh, cái nào rẻ, cái nào tốn công.
- **Bỏ qua mối lo ngại thật sự**: nếu stakeholder lo về trải nghiệm khách hàng chứ không phải hệ thống, hãy nói về trải nghiệm.

> Senior tip: hãy luôn kết thúc bằng câu **"điều bạn thực sự cần là X"** — thể hiện rằng bạn đã dịch đúng từ yêu cầu sang mục tiêu. Câu này, cùng một con số, là đủ để phân biệt ứng viên senior với ứng viên chỉ giỏi code.`,
  follow: [
    'Bạn có bao giờ phải nói "không" với một yêu cầu của bộ phận kinh doanh không? Bạn nói thế nào?',
    'Làm sao bạn biết mức độ ưu tiên thật sự của một yêu cầu khi mọi người đều nói "gấp"?',
    'Bạn dùng công cụ hay nghi thức nào để theo dõi việc yêu cầu của stakeholder được xử lý không?'
  ],
  tags: ['stakeholder', 'communication', 'business-value', 'STAR']
},
{
  id: 'behavioral-009',
  topic: 'behavioral',
  level: 'mid',
  q: 'Vì sao bạn muốn lên senior/lead? Điểm yếu của bạn là gì, và bạn đang làm gì để cải thiện nó?',
  a: `**Tóm tắt:** Câu hỏi này hỏi **mức độ tự nhận thức**. Câu trả lời tốt có ba điều kiện: lý do lên level phải **cụ thể gắn với đóng góp thật**, điểm yếu phải **thật** (không phải điểm yếu giả), và phải có **hành động cụ thể kèm bằng chứng tiến bộ**.

### Interviewer muốn đánh giá gì
- **Động lực bền vững**: bạn muốn lên vì lương, hay vì muốn làm việc có giá trị khác nhau.
- **Tự nhận thức**: bạn có nhìn ra điểm yếu thật của mình không.
- **Khả năng cải thiện**: bạn có biết cách sửa điểm yếu đó không, hay chỉ than phiền.
- **Sự nhất quán**: lý do lên level có khớp với hành vi trong CV không.
- **Trưởng thành**: điểm yếu được chọn có thật sự liên quan đến vị trí ứng tuyển không.

### Khung trả lời (ánh xạ theo STAR)
- **S — Situation**: bạn đang ở vị trí nào, đã đóng góp gì thật sự, và điều gì khiến bạn thấy cần thay đổi.
- **T — Task**: mục tiêu của bạn với vị trí này là gì (kỹ năng, phạm vi ảnh hưởng, loại bài toán).
- **A — Action**: bạn đã làm gì cụ thể để tiến tới mục tiêu đó.
- **R — Result**: bằng chứng bằng số liệu cho thấy bạn đã thay đổi thế nào.
- **Điểm yếu**: hành vi cụ thể quan sát được → hậu quả → hành động sửa → bằng chứng tiến bộ.
- **Câu hỏi ngược**: bạn muốn nghe phản hồi gì từ tôi về điểm này?

### Câu trả lời mẫu
> "Về lý do: ba năm qua tôi ở vị trí senior ở một team 8 người, và phần lớn công việc của tôi là xử lý sự cố và review. Tôi nhận ra mình thích nhất khoảnh khắc phải **thiết kế** để một sự cố không xảy ra — ví dụ khi tôi đưa ra cơ chế retry có jitter và circuit breaker, số lỗi timeout giảm hẳn. Tôi muốn lên lead vì tôi muốn **nhân bản** điều đó: giúp cả team có tiêu chuẩn thiết kế tốt thay vì chỉ có đóng góp của riêng tôi. Tôi cũng thích phần làm việc với stakeholder và dẫn dắt quyết định kỹ thuật — đó là lý do tôi ứng tuyển vào vị trí này chứ không phải một vị trí senior ở nơi khác.
> Về điểm yếu: điều tôi cần cải thiện là **việc đánh giá rủi ro khi lập kế hoạch**. Trước đây tôi thường cam kết thời gian dựa trên ước lượng của bản thân mà chưa tính tới việc phụ thuộc bên ngoài, và đã có lần kế hoạch trượt 3 tuần vì một đội khác bận.
> Cách tôi sửa: từ đó mỗi kế hoạch tôi đều có một mục 'rủi ro và giả định' với tối thiểu 3 giả định được ghi rõ, và tôi gửi bản kế hoạch sớm cho người phụ trách các đội phụ thuộc để họ có cơ hội phản hồi trước khi tôi cam kết với khách hàng. Trong 4 sprint gần nhất, tôi đã lập kế hoạch cho 6 dự án và **không có dự án nào trượt mốc** — trước đó tỷ lệ trượt khoảng 1 trong 3.
> Tôi cũng muốn nghe ý kiến của anh về điểm này: theo quan sát của anh, điểm yếu nào của tôi sẽ ảnh hưởng nhất tới việc tôi đảm nhận vai trò này?"

### Những điều nên tránh
- **Điểm yếu giả**: "tôi làm việc quá nhiều", "tôi quá cầu toàn" — không ai tin và interviewer đều nghe quá nhiều lần.
- **Điểm yếu không liên quan tới công việc**: "tôi hay đi muộn" là thảm hoạ ở vai trò nào.
- **Không có hành động cải thiện**: chỉ nói "tôi đang cố gắng" là không đủ.
- **Lý do lên level chỉ dựa trên lương và chức danh**: hãy nói thêm giá trị bạn muốn tạo ra.
- **Nói quá nhiều về điểm yếu**: nêu 1 điểm thật, xử lý sâu, đó là đủ.
- **Không dám hỏi ngược**: câu hỏi ở cuối là dấu hiệu của sự tự tin và hướng vào phát triển.

> Senior tip: hãy chọn điểm yếu **liên quan tới vai trò ứng tuyển** và thể hiện bằng chứng đo được — ví dụ "tôi hay trễ deadline khi phụ thuộc bên ngoài, nên tôi đã thay đổi cách lập kế hoạch và tỷ lệ trượt giảm từ 1/3 xuống 0/6". Một điểm yếu có sẵn hành động và số liệu sẽ biến thành điểm mạnh trong mắt interviewer.`,
  follow: [
    'Bạn nghĩ ở vị trí này, điều gì sẽ khiến bạn thất bại?',
    'Nếu sau 6 tháng tôi đánh giá bạn chưa đạt kỳ vọng, bạn muốn tôi nói gì?',
    'Bạn đã từng bị từ chối một vị trí không? Bạn đã làm gì khác biệt sau đó?'
  ],
  tags: ['motivation', 'self-awareness', 'growth', 'STAR']
},
{
  id: 'behavioral-010',
  topic: 'behavioral',
  level: 'mid',
  q: 'Bạn sẽ làm gì trong 90 ngày đầu tiên ở công ty mới?',
  a: `**Tóm tắt:** Câu hỏi này đo **tốc độ học, sự chủ động và tính thực tế**. Câu trả lời mạnh chia thành 3 giai đoạn 30 ngày, có **sản phẩm bàn giao cụ thể** cho từng giai đoạn, và thể hiện sự cân bằng giữa "học" và "đóng góp" — không phải 90 ngày ngồi đọc code, cũng không phải 90 ngày sửa những gì chưa hiểu.

### Interviewer muốn đánh giá gì
- **Có kế hoạch hay không** — bạn nghĩ trước về 3 tháng đầu hay trả lời theo cảm hứng.
- **Ưu tiên học hay làm**: bạn hiểu rằng ngày đầu chưa đóng góp giá trị là bình thường.
- **Tính cụ thể**: có mốc bàn giao, có tiêu chí "hiểu" đo được không.
- **Tinh thần đóng góp**: bạn không đợi đến ngày 91 mới bắt đầu.
- **An toàn**: bạn không hứa những gì không thể giữ.

### Khung trả lời (ánh xạ theo STAR)
- **S — Situation**: hệ thống mới, bạn chưa biết gì — đây là "tình huống" của bạn.
- **T — Task**: mục tiêu 90 ngày là hiểu đủ để làm việc hiệu quả và đóng góp giá trị nhỏ.
- **A — Action**: hành động cụ thể theo từng giai đoạn dưới đây.
- **R — Result**: sản phẩm bàn giao cụ thể ở mỗi mốc 30/60/90 ngày.
- **0–30 ngày — Hiểu**: đọc và chạy được hệ thống, hiểu luồng nghiệp vụ chính, gặp các bên liên quan.
- **31–60 ngày — Đóng góp nhỏ**: sửa lỗi/bug nhỏ, viết test cho khu vực chưa có test, cải thiện gì đó đo được.
- **61–90 ngày — Đảm nhận**: dẫn một hạng mục end-to-end, đề xuất cải tiến có số liệu.

### Câu trả lời mẫu
> "Tôi chia 90 ngày thành ba giai đoạn với sản phẩm bàn giao cụ thể ở mỗi giai đoạn.
> **30 ngày đầu — hiểu trước khi chạm vào code.** Tôi sẽ chạy được hệ thống ở local, đọc lịch sử git của module tôi sẽ phụ trách, và **tự vẽ lại sơ đồ luồng chính** rồi đối chiếu với tài liệu để biết chỗ nào tài liệu sai — đó cũng là cách nhanh nhất để biết hệ thống thật sự là gì. Song song, tôi sẽ nói chuyện với 5–6 người: 1 product, 2–3 dev, 1 QA, 1 người vận hành. Bàn giao của giai đoạn này là một tài liệu "câu hỏi còn mở" — danh sách những chỗ tôi chưa hiểu và cần ai giải đáp. Tôi cũng **không đề xuất cải tiến gì trong 30 ngày đầu**, vì mọi đề xuất khi chưa hiểu hệ thống đều tốn công sửa lại.
> **30–60 ngày — đóng góp có giá trị nhỏ và an toàn.** Tôi sẽ chọn việc mà rủi ro thấp nhưng vẫn giúp team: viết test cho khu vực chưa có test, thêm log/metric còn thiếu, hoặc sửa một lỗi nhỏ đã được ghi nhận. Mục tiêu là **hiểu codebase đủ sâu để sửa mà không phá**, và có ít nhất một PR đã được merge. Tôi sẽ xin review chặt hơn bình thường trong giai đoạn này — không phải vì tôi thiếu tự tin, mà vì mỗi PR tốt là một lần tôi học được quy ước coding style của team.
> **60–90 ngày — đảm nhận một phần.** Tôi sẽ nhận một hạng mục end-to-end (kèm một người backup), chịu trách nhiệm từ thiết kế nhỏ tới deploy và theo dõi. Đồng thời tôi sẽ đưa ra **một đề xuất cải tiến kèm số liệu** — thường là thứ tôi đã quan sát được trong 60 ngày đầu: một N+1 query, một pipeline chậm, hoặc một quy trình release thủ công. Tôi sẽ trình bày đề xuất đó cho team lead trước khi mang ra để cả team góp ý.
> Nói ngắn gọn: ngày 90 tôi muốn là người đã **đóng góp được và hiểu được chỗ nào cần cải thiện**, chứ không phải người mới đi làm."

### Những điều nên tránh
- **"Tôi sẽ học hết codebase rồi hẵng sửa"**: không ai làm được, và nghe như thiếu kế hoạch.
- **Hứa sửa lỗi hệ thống cũ trong 90 ngày**: hứa hẹn không thực tế làm giảm niềm tin.
- **Tập trung quá nhiều vào công nghệ mới**: "tôi muốn refactor sang công nghệ X" trong 90 ngày đầu là tín hiệu đỏ lớn.
- **Không có tiêu chí đo**: "sẽ quen hệ thống" không phải tiêu chí.
- **Không gặp ai ngoài team kỹ thuật**: đặc biệt khi vai trò có tính chất product/business.

> Senior tip: hãy chèn vào câu trả lời một chi tiết **cho thấy bạn đã nghĩ đến việc giữ mình không phá hệ thống mới** — ví dụ "giai đoạn đầu tôi sẽ ưu tiên đọc và viết test hơn là sửa logic". Interviewer đánh giá cao sự cẩn trọng này hơn là ngạc nhiên về tham vọng.`,
  follow: [
    'Trong 90 ngày đầu, bạn làm sao để biết mình đã hiểu đủ hệ thống để làm việc hiệu quả?',
    'Bạn sẽ phản ứng thế nào nếu sau 30 ngày bạn nhận ra kiến trúc hiện tại có vấn đề nghiêm trọng?',
    'Khi nào bạn biết đã đến lúc đóng góp thay vì chỉ học?'
  ],
  tags: ['onboarding', 'planning', 'adaptability', 'STAR']
},
{
  id: 'behavioral-011',
  topic: 'behavioral',
  level: 'mid',
  q: 'Bạn sẽ hỏi những câu hỏi nào về công ty và vị trí này?',
  a: `**Tóm tắt:** Đây là câu hỏi mà nhiều ứng viên trả lời rất hời hợt ("câu hỏi về văn hóa và lương"). Câu trả lời mạnh cho thấy bạn **đã nghiên cứu trước**, biết hỏi câu nào **làm sáng quyết định của bạn**, và không hỏi những gì dễ tìm trên website. Hãy chuẩn bị 5–6 câu, phân theo nhóm, và nói rõ câu nào bạn hỏi **vì lý do cá nhân**.

### Interviewer muốn đánh giá gì
- **Mức độ chuẩn bị**: bạn đã đọc gì về công ty trước khi phỏng vấn.
- **Chất lượng câu hỏi**: hỏi để **ra quyết định** chứ không phải để gây ấn tượng.
- **Tư duy hệ thống**: bạn thấy mối liên hệ giữa vị trí, quy trình và kết quả kinh doanh.
- **Sự tôn trọng**: không hỏi những gì dễ tra ra trên trang tuyển dụng.

### Khung trả lời (ánh xạ theo STAR)
- **S — Situation**: bạn ở vị trí nào, vòng phỏng vấn nào, đã biết gì về công ty.
- **T — Task**: nhiệm vụ là **thu thập đủ thông tin để ra quyết định**, không phải gây ấn tượng.
- **A — Action**: chuẩn bị câu hỏi theo nhóm, hỏi theo thứ tự ưu tiên nào.
- **R — Result**: sau buổi phỏng vấn, bạn đủ dữ liệu để quyết định có nhận lời mời không.

### Nhóm câu hỏi nên chuẩn bị (theo logic STAR: bối cảnh → nhiệm vụ → hành động → kết quả)
| Nhóm | Câu hỏi mẫu | Tại sao hỏi |
|---|---|---|
| Bối cảnh sản phẩm | "Đội này giải quyết bài toán nào, đo bằng chỉ số nào?" | hiểu mình sẽ làm việc gì |
| Kỳ vọng vị trí | "Ở tháng 6, điều gì khiến người quản lý nói 'đã làm tốt'?" | biết tiêu chuẩn ngay từ đầu |
| Team và cách làm việc | "PR được review thế nào, team xử lý sự cố production ra sao?" | ảnh hưởng tới chất lượng công việc |
| Kỹ thuật | "Quyết định kiến trúc gần đây team đã tranh luận, kết quả ra sao?" | hiểu văn hóa ra quyết định |
| Đường phát triển | "Người giữ vai trò này 1–2 năm trước đi đâu?" | biết đường đi tiếp của vai trò |
| Bản thân | "Điều gì ở đây khiến bạn lo mình sẽ thất bại?" | chủ động và thực tế |

### Câu trả lời mẫu
> "Tôi chuẩn bị khoảng 6 câu, và tôi chia chúng theo mục đích chứ không theo thứ tự hỏi.
> Câu đầu tiên tôi hỏi luôn là về **bối cảnh sản phẩm**: 'Đội đang tập trung vào vấn đề gì, và thành công của đội được đo bằng những chỉ số nào?'. Câu này giúp tôi hiểu công việc thật sự là gì chứ không phải mô tả trên website.
> Câu thứ hai là câu **tôi thực sự cần để ra quyết định**: 'Ở tháng 6, điều gì sẽ khiến anh/chị nói người này đã làm tốt?'. Tôi hỏi vì nhiều vị trí không nói rõ kỳ vọng, người mới phải tự đoán — kết quả là cả hai bên thất vọng.
> Câu thứ ba là về **cách làm việc thực tế**: 'PR được review như thế nào, và khi có sự cố production thì quy trình ứng phó là gì?'. Tôi muốn làm việc ở nơi có kỷ luật vận hành.
> Câu thứ tư là về văn hóa ra quyết định: 'Trong năm qua team đã phản đối quyết định kiến trúc nào của nhau? Chuyện gì đã xảy ra?'. Tôi hỏi câu này vì tôi muốn biết team có thể bất đồng một cách lành mạnh không.
> Ngoài ra tôi sẽ hỏi về đường phát triển của vai trò, và dành câu cuối để hỏi trực tiếp anh/chị: 'Có điều gì trong hồ sơ của tôi mà anh/chị thấy cần làm rõ thêm không?'. Ở lượt cuối, đây là cơ hội tốt nhất để xử lý một rủi ro tuyển dụng đang có.
> Tôi cố tình **không** hỏi về lương ở lượt này, vì đó là thông tin lấy được rất nhanh ở giai đoạn offer, còn hôm nay tôi muốn dùng thời gian để hiểu công việc và đội ngũ."

### Những điều nên tránh
- **Hỏi những gì đã có trên website công ty**: "làm sao để apply?" — mất cơ hội để tạo ấn tượng.
- **Hỏi lương, thưởng ở vòng đầu**: làm mất trọng tâm; hãy hỏi ở vòng cuối.
- **Câu hỏi quá chung chung** ("môi trường làm việc thế nào?") hoặc **hỏi quá nhiều (8–10 câu)**: không ai trả lời hữu ích, và bạn biến buổi phỏng vấn thành phỏng vấn ngược lại.
- **Không lắng nghe rồi hỏi tiếp cùng chủ đề**, hoặc **không chuẩn bị câu nào cả**: "Em chưa nghĩ qua" là tín hiệu không chuẩn bị.

> Senior tip: câu hỏi hay nhất mà ít người hỏi là **"quyết định kỹ thuật nào gần đây team đã tranh luận"**. Nó cho bạn thấy team có văn hóa phản biện hay không, và khiến cuộc trò chuyện đi vào chiều sâu thay vì xã giao.`,
  follow: [
    'Nếu bạn chỉ được hỏi một câu duy nhất, bạn chọn câu nào?',
    'Bạn có thể hỏi về mức lương mà không làm mất thiện cảm không?',
    'Bạn cần biết điều gì về đội ngũ để đánh giá xem mình có hợp không?'
  ],
  tags: ['interview', 'questions', 'preparation', 'STAR']
},
{
  id: 'behavioral-012',
  topic: 'behavioral',
  level: 'senior',
  q: 'Bạn đàm phán lương và offer như thế nào? Có mẹo gì cho thị trường Việt Nam và công việc remote không?',
  a: `**Tóm tắt:** Đàm phán lương là kỹ năng kinh doanh, không phải trò may mắn. Nguyên tắc: **có dữ liệu trước khi đàm phán, đàm phán trên tổng thu nhập chứ không chỉ lương cứng, và luôn để lại một bước thoát để quan hệ không xấu đi**. Ở Việt Nam, ngoài lương cứng còn có thưởng quý, phụ cấp, bảo hiểm; với công việc remote, còn phải tính cả chi phí quy đổi, múi giờ và hình thức hợp đồng.

### Interviewer muốn đánh giá gì
- **Mức độ chuẩn bị**: bạn có biết mức lương thị trường cho vị trí này không.
- **Cách định giá bản thân**: dựa trên giá trị mang lại chứ không phải chi phí sống.
- **Kỹ năng đàm phán**: biết lúc nào nhường, lúc nào giữ.
- **Sự chín chắn**: bạn có biết mình sẽ nói "không" khi nào không.

### Khung trả lời (ánh xạ theo STAR)
- **S — Situation**: vị trí đề xuất, ngân sách lương của công ty, giá trị bạn mang lại.
- **T — Task**: đạt mức thỏa thuận mà quan hệ với công ty vẫn tốt.
- **A — Action**: dữ liệu tham chiếu, câu hỏi đặt trước, phương án theo tổng thu nhập.
- **R — Result**: mức lương chốt, tổng thu nhập, mức độ thiện cảm còn lại.

### Câu trả lời mẫu + mẹo thực tế
> "Tôi chia việc đàm phán thành bốn bước.
> **Một, chuẩn bị dữ liệu trước khi phỏng vấn.** Tôi tra mức lương thị trường cho senior backend ở Việt Nam qua nhiều nguồn — theo khảo sát công khai (Levels.fyi, Glassdoor, báo cáo lương ngành IT) khoảng 30–45 triệu đồng/tháng gross cho 5–7 năm kinh nghiệm ở product company, còn ở outsourcing hoặc FDI có thể thấp hơn. Quan trọng hơn con số: **tôi định giá bằng giá trị** — "tôi đã giảm p99 của luồng thanh toán 40% và dẫn dắt migration X" — đó là cơ sở để đàm phán.
> **Hai, đặt câu hỏi trước khi nói con số.** Khi HR hỏi 'anh mong muốn mức lương bao nhiêu', tôi đáp lại bằng câu hỏi: 'Ngân sách cho vị trí này khoảng bao nhiêu, và phần nào là biến động được?'. Biến động được là cơ hội để thương lượng thay vì nhận con số đầu tiên. Ở Việt Nam, tôi hỏi rõ cơ cấu: **lương cứng chiếm bao nhiêu phần, thưởng quý ra sao, có kèm phụ cấp và bảo hiểm không**. Lương cứng 40 triệu nhưng thưởng không chắc chắn có thể kém hơn 35 triệu kèm thưởng quý 2 tháng.
> **Ba, đàm phán trên tổng thu nhập.** Tôi đề xuất ưu tiên: lương cứng ở mức median trở lên, thưởng quý rõ ràng theo KPI cá nhân, ngân sách đào tạo, thiết bị/laptop, và quyền mua cổ phiếu nếu có. Với công ty remote cho khách hàng nước ngoài, tôi còn tính thêm: quy đổi theo tỷ giá nào, có phụ cấp thiết bị và Internet, hỗ trợ quyết toán thuế, và lương trả theo hợp đồng nào (EOR hay tư vấn).
> **Bốn, giữ lựa chọn và sự chuyên nghiệp.** Tôi luôn xin thời gian 1–2 ngày để cân nhắc, và khi đàm phán thêm tôi nói rõ điều kiện: 'nếu phần lương cứng ở mức X thì tôi sẽ đồng ý'. Tôi không đe dọa bằng offer khác nếu chưa thật sự có, và không nói dối về mức lương hiện tại.
> Kết quả ở lượt gần nhất: offer ban đầu 38 triệu, tôi đàm phán dựa trên dữ liệu và đóng góp cụ thể để lên 45 triệu cùng thưởng quý 2 tháng — tổng thu nhập tăng 25%, và mối quan hệ với HR, hiring manager vẫn rất tốt."

### Những điều nên tránh
- **Đưa một con số cứng đơn lẻ**: mất toàn bộ đòn bẩy đàm phán, và có thể tự giới hạn dưới mức thị trường.
- **Nói dối về mức lương hiện tại hoặc về offer khác**: môi trường IT Việt Nam nhỏ nên thông tin lương lan nhanh, rất dễ bị phát hiện.
- **Chỉ nói về lương cứng**: hãy nói về tổng giá trị, và biết rõ mức tối thiểu chấp nhận được trước khi vào phỏng vấn.
- **Đàm phán quá cứng ở lượt đầu**, hoặc dùng đòn bẩy "tôi có offer khác" khi chưa thật.
- **Bỏ qua thưởng, phúc lợi, bảo hiểm, cổ phiếu** — ở Việt Nam, phần lớn giá trị offer nằm ngoài lương cứng.
- **Không cân nhắc hợp đồng khi remote**: EOR hay contractor ảnh hưởng lớn tới thuế và bảo hiểm.

> Senior tip: hãy xác định **mức lương tối thiểu chấp nhận được (walk-away)** trước khi phỏng vấn và ghi lại bằng số. Khi đã có con số đó trong đầu, bạn thương lượng rất khác — bạn bình tĩnh hơn, và biết chính xác lúc nào nên dừng. Người không có mức walk-away thường nhận lại offer kém hơn mức họ có thể đạt, chỉ vì sợ nói "không".`,
  follow: [
    'Bạn định giá công việc của mình như thế nào khi quy đổi sang tiền?',
    'Nếu công ty nói "chúng tôi không thể tăng thêm", bạn trả lời thế nào?',
    'Với công việc remote cho khách hàng nước ngoài, những điều khoản nào trong hợp đồng bạn sẽ đặc biệt để ý?'
  ],
  tags: ['negotiation', 'compensation', 'career', 'STAR']
}
);

