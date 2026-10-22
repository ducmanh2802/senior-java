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
},
{
  id: 'testing-011',
  topic: 'testing',
  level: 'senior',
  q: 'Service của bạn publish event lên Kafka và consume event từ service khác. Bạn test producer/consumer thế nào — Testcontainers, embedded Kafka hay mock? Làm sao test được phần bất đồng bộ (message đến trễ, consume lỗi, retry) một cách đáng tin?',
  a: `**Tóm tắt:** Kafka cần **ba tầng test**: unit test cho logic ánh xạ event (mock {{KafkaTemplate}}), **embedded Kafka** cho hành vi consumer (topic thật, consumer group thật), và **Testcontainers Kafka** cho luồng gần production. Với phần bất đồng bộ, chìa khóa là **chờ theo điều kiện** bằng Awaitility chứ không {{Thread.sleep}}, và phải test cả **đường lỗi** (retry, DLT, poison message) chứ không chỉ happy path.

### Ba tầng test cho Kafka
| Tầng | Công cụ | Kiểm chứng được | Tốc độ |
|---|---|---|---|
| Unit | mock {{KafkaTemplate}} | payload, key, partition, header, idempotency key | dưới 50 ms |
| Slice | {{@EmbeddedKafka}} của spring-kafka-test | consumer thật, offset, ack mode, error handler, DLT | vài giây |
| Tích hợp | {{KafkaContainer}} của Testcontainers | broker thật ở chế độ KRaft, serialization, config production | 10–30 giây |

### Test producer — trọng tâm là hợp đồng dữ liệu
~~~java
@Test void publish_order_created_uses_order_id_as_key() {
    KafkaTemplate<String, OrderCreated> template = mock();   // Mockito 4.10+ suy ra kiểu
    var service = new OrderEventPublisher(template);

    service.publish(OrderCreated.of("OD-1", 500_000L));

    // key cố định => event của cùng đơn vào cùng partition => giữ được thứ tự
    verify(template).send(eq("order.created"), eq("OD-1"),
        argThat(v -> v.amount() == 500_000L));   // v là OrderCreated (giả sử amount() trả long)
}
~~~
- Test bằng mock chỉ chứng minh "ta gọi send với đúng tham số", **không** chứng minh message thực sự tới consumer.
- Nếu event dùng Avro/Protobuf kèm Schema Registry, hãy test bằng schema thật: lệch phiên bản serialization là lỗi hay bị bỏ sót nhất.
- Nhớ test luồng **outbox**: message phải được phát lại được sau khi broker sập, thay vì mất khi publish thất bại.

### Test consumer — embedded Kafka + Awaitility
~~~java
@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = "order.created",
               bootstrapServersProperty = "spring.kafka.bootstrap-servers")   // trỏ app vào broker nhúng
class OrderConsumerTest {
    @Autowired KafkaTemplate<String, OrderCreated> template;
    @Autowired SettlementService settlement;

    @Test void paid_order_is_settled() {
        template.send("order.created", "OD-1", new OrderCreated("OD-1", 500_000L));

        await().atMost(Duration.ofSeconds(5)).untilAsserted(() ->
            assertThat(settlement.findByOrderId("OD-1"))
                .get().extracting(Settlement::getState)
                .isEqualTo(SETTLED));
    }
}
~~~
- {{@EmbeddedKafka}} nạp broker thật vào JVM nên CI không cần Docker và vẫn rất nhanh.
- **Luôn bọc assert trong {{untilAsserted}}**: consumer chạy ở thread khác, nếu assert ngay bạn sẽ kiểm tra trước khi message được xử lý xong — nguyên nhân phổ biến nhất của test Kafka flaky.
- Timeout chọn **vừa đủ** (3–5 giây): đặt 30 giây chỉ làm CI chậm đúng lúc test đang fail.

### Test đường lỗi — phần hay bị bỏ sót
| Tình huống | Cách test |
|---|---|
| Deserialize lỗi (payload sai schema) | gửi message rác, assert DLT nhận được |
| Handler ném exception | bật error handler có backoff, assert số lần retry |
| Message không xử lý được | assert bị bỏ qua hoặc đẩy sang DLT đúng policy |
| Broker chết giữa chừng | dừng container rồi khởi động lại, assert không mất message |

Chỉ khi có broker thật (embedded hoặc container), không phải mock, mới tái hiện được hai tình huống: **offset đã commit nhưng handler chưa xong** (mất message khi restart) và **rebalance làm consumer khác nhận lại message** (xử lý trùng).

### Bẫy thường gặp
- **Nhiều test dùng chung một topic** trong embedded broker ⇒ nhiễu dữ liệu; nên tách topic hoặc group id theo test. Và **Embedded Kafka không giống production**: nó chạy trong JVM, thường chỉ 1 broker và mặc định không có ACL hay TLS — những thứ đó nên test ở tầng Testcontainers (Spring Boot 3.1+ có {{@ServiceConnection}} để tự nối {{KafkaContainer}} vào app, không cần khai báo property bằng tay).

> Senior tip: khi hệ thống event-driven lỗi ở production, nguyên nhân gần như luôn nằm ở **thứ tự message**, **message trùng lặp** hoặc **message không deserialize được** — chứ không phải ở logic nghiệp vụ thuần. Hãy đầu tư test cho ba thứ đó: message trùng phải idempotent, message đến lệch thứ tự không được làm hỏng state, và message của schema cũ vẫn phải được consumer mới consume được.`,
  follow: [
    'Bạn chọn topic riêng cho mỗi test hay dùng chung topic với group id riêng? Rủi ro của mỗi cách là gì?',
    'Với Avro/Protobuf kèm Schema Registry, bạn test tương thích schema (schema evolution) thế nào?',
    'Làm sao test trường hợp consumer restart giữa chừng mà không mất message?'
  ],
  tags: ['Kafka', 'testing', 'Awaitility', 'Testcontainers', 'event-driven']
},
{
  id: 'testing-012',
  topic: 'testing',
  level: 'senior',
  q: 'Suite test Spring Boot của bạn chậm (mất 20 phút). Nguyên nhân nằm ở đâu, {{@WebMvcTest}} và {{@DataJpaTest}} khác nhau thế nào về tốc độ, và context caching hoạt động ra sao để bạn tăng tốc suite mà không hy sinh độ tin cậy?',
  a: `**Tóm tắt:** Suite test Spring chậm thường do **ba nguyên nhân**: dựng lại ApplicationContext quá nhiều lần (context cache bị phá), viết test ở tầng quá cao ({{@SpringBootTest}} cho mọi thứ), và phụ thuộc I/O thật. Trước khi tối ưu hãy **đo** xem thời gian nằm ở đâu; sau đó tăng tốc bằng cách gom test cùng cấu hình, bỏ {{@DirtiesContext}} và bật **parallel execution** của JUnit 5.

### Ba nguyên nhân làm suite chậm
| Nguyên nhân | Dấu hiệu nhận biết | Cách xử lý |
|---|---|---|
| Context dựng lại nhiều lần | thời gian gần bằng số lớp test × vài giây | gom test cùng cấu hình, bỏ {{@DirtiesContext}} |
| Test ở tầng quá cao | mọi test đều là {{@SpringBootTest}} | hạ xuống slice/unit |
| Phụ thuộc I/O thật | test chờ network, sleep, retry | WireMock, container dùng chung, dữ liệu tĩnh |
| Chạy tuần tự | CPU rảnh mà suite vẫn lâu | bật parallel của JUnit 5 |

### Context caching hoạt động thế nào
Spring TestContext framework cache **ApplicationContext** và tái dùng cho các test có cùng **MergedContextConfiguration**: cùng active profiles, cùng property sources, cùng context customizers, cùng initializer, cùng loại test.
- Mặc định cache tối đa **32 context** (property {{spring.test.context.cache.maxSize}}).
- {{@DirtiesContext}} (ở class hoặc method) **xoá context khỏi cache** ⇒ lần chạy sau phải dựng lại từ đầu. Đây là thủ phạm số một của suite chậm.
- Test lồng bằng {{@Nested}} thường dùng chung context của class ngoài nên rẻ hơn một class riêng.
- {{@TestPropertySource}} khác nhau giữa các class ⇒ mỗi class một context riêng. Gom các test cần property khác nhau vào **cùng một class** sẽ rẻ hơn nhiều.

### So sánh các slice test
| Annotation | Nạp gì | DB mặc định | Tốc độ | Dùng để kiểm |
|---|---|---|---|---|
| {{@WebMvcTest}} | tầng web + Spring Security; service phải tự mock bằng {{@MockitoBean}} (Boot 3.4+, trước đó là {{@MockBean}}) | không | 1–2 giây | controller, validation, serialization |
| {{@DataJpaTest}} | JPA, repository, transaction rollback | embedded (H2/HSQLDB nếu có trên classpath) | 2–4 giây | repository, JPQL, mapping, constraint |
| {{@JsonTest}} | riêng phần Jackson | không | dưới 1 giây | serialize/deserialize |
| {{@SpringBootTest}} | toàn bộ application context | theo config | 10–30 giây | wiring, security filter thật, E2E |

Lưu ý: {{@DataJpaTest}} **tự thay DataSource bằng database embedded** mặc định. Muốn test trên Postgres thật phải thêm {{@AutoConfigureTestDatabase(replace = Replace.NONE)}} rồi nối Testcontainers — nếu không, bạn test trên H2 và mọi khác biệt dialect sẽ lộ ra ở production.

### Checklist tăng tốc
1. **Đo trước**: xem báo cáo Surefire/Gradle để biết lớp nào chiếm nhiều thời gian, đừng tối ưu cảm tính.
2. **Gom test theo cấu hình**, không theo tính năng — cùng một lớp test với cùng profile.
3. **Bỏ {{@DirtiesContext}}**: thay bằng cách tự dọn dữ liệu (rollback, truncate, xoá cache bằng API của ứng dụng).
4. **Bật parallel của JUnit 5** qua {{junit-platform.properties}}:
~~~text
junit.jupiter.execution.parallel.enabled=true
junit.jupiter.execution.parallel.mode.default=concurrent
junit.jupiter.execution.parallel.mode.classes.default=concurrent
~~~
5. **Sharding ở CI** khi suite vẫn lớn: chia theo nhóm lớp test để chạy nhiều job song song.

### Bẫy thường gặp
- **Bật parallel khi test vẫn dùng chung dữ liệu hoặc static state** ⇒ test flaky mới, lúc này suite chậm lẫn không ổn định.
- **Test {{@Transactional}} với luồng bất đồng bộ**: rollback chỉ áp dụng cho thread test, task chạy ở thread khác không được rollback ⇒ dữ liệu rò rỉ và test sau bị ảnh hưởng.
- **Tối ưu bằng cách bỏ bớt test** để pipeline xanh, hoặc dùng {{@Timeout}} để "xử lý" test treo: che triệu chứng và làm team mất niềm tin.
- **Dựng context cho mỗi test method** vì dùng {{@DirtiesContext(classMode = AFTER_EACH_TEST_METHOD)}} hoặc mỗi test lại đổi {{@MockitoBean}}/property ⇒ mất hết lợi ích của cache. Bật log {{org.springframework.test.context.cache=DEBUG}} để xem số lần cache hit/miss.

> Senior tip: đừng tối ưu "cho có số liệu". Hãy đặt mục tiêu **p95 thời gian một test** và **tỉ lệ flaky** cùng lúc. Một suite chạy 3 phút nhưng 5% test đỏ ngẫu nhiên vẫn là một pipeline hỏng, vì team sẽ học cách bỏ qua trạng thái CI đỏ — và lúc đó mọi tối ưu về tốc độ đều vô nghĩa.`,
  follow: [
    'Bạn đo và phân tích thời gian test bằng công cụ nào (Surefire report, JFR, flamegraph)?',
    'Khi nào bạn chấp nhận đánh đổi: giữ test ở tầng cao để có độ tin cậy, dù suite chậm?',
    'Bạn có dùng test sharding trong CI không, và chia theo tiêu chí nào?'
  ],
  tags: ['SpringBootTest', 'context-cache', 'performance', 'parallel-testing']
},
{
  id: 'testing-013',
  topic: 'testing',
  level: 'senior',
  q: 'Làm sao test phân quyền và bảo mật trong Spring Boot — {{@WithMockUser}}, test IDOR (đổi id trong URL để đọc dữ liệu của người khác), và test với JWT thật? Những lỗi phân quyền nào hay lọt vào production nhất?',
  a: `**Tóm tắt:** Test bảo mật phải có **ba tầng**: unit test cho logic phân quyền ở tầng service (dùng {{@WithMockUser}}), slice web cho controller + filter chain (MockMvc + spring-security-test), và integration test với **JWT thật** để chứng minh token được parse, hợp lệ và bị từ chối đúng cách. Điểm mấu chốt: **test negative quan trọng hơn test positive** — API chỉ được test với user hợp lệ là API chưa được test.

### Ba tầng test bảo mật
| Tầng | Công cụ | Kiểm chứng được |
|---|---|---|
| Unit / service | {{@WithMockUser}} + method security | quy tắc "ai được làm gì" ở tầng nghiệp vụ |
| Slice web | {{@WebMvcTest}} + MockMvc | routing, phân quyền theo vai trò, mã lỗi 401/403 |
| Tích hợp | {{@SpringBootTest}} + {{TestRestTemplate}} | JWT thật, filter chain thật, cấu hình thật |

### Dùng {{@WithMockUser}} đúng cách
~~~java
@WebMvcTest(OrderController.class)
class OrderControllerSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;   // Spring Boot 3.4+; bản cũ hơn dùng @MockBean

    @Test void anonymous_is_rejected() throws Exception {
        mvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());
    }

    @Test @WithMockUser(roles = "CUSTOMER")
    void customer_cannot_call_admin_endpoint() throws Exception {
        mvc.perform(get("/api/admin/orders"))   // rule URL chỉ cho ROLE_ADMIN
           .andExpect(status().isForbidden());
    }
}
~~~
- Service đã bị mock nên slice này chỉ kiểm được **rule theo URL/role**; kiểm tra "đơn có phải của mình không" nằm ở service, phải test ở tầng tích hợp (mục IDOR bên dưới).
- Phân biệt rõ **401** (chưa xác thực — chưa có danh tính) và **403** (đã xác thực nhưng không đủ quyền). Trả 401 cho user đã đăng nhập nhưng thiếu quyền là sai.
- {{roles("ADMIN")}} sinh authority dạng {{ROLE_ADMIN}}; nếu code kiểm tra {{SCOPE_admin}} thì phải dùng {{authorities(...)}} thay vì roles. Trộn hai hệ thống này là nguồn bug phân quyền rất phổ biến.
- Method security phải được bật bằng {{@EnableMethodSecurity}} (có từ Spring Security 5.6, thay cho {{@EnableGlobalMethodSecurity}} đã deprecated). Thiếu annotation này thì {{@PreAuthorize}} **không có tác dụng** và test im lặng xanh — đây là loại bug nguy hiểm nhất.

### Test IDOR — bắt buộc có
Ý tưởng: tạo dữ liệu của **user A**, rồi để **user B** thử truy cập bằng chính id đó.
~~~java
// @SpringBootTest + @AutoConfigureMockMvc: service và repository thật
@Test void user_b_cannot_read_order_of_user_a() throws Exception {
    var order = orderRepo.save(Order.of("OD-A", 100L));   // ownerId = 100 là user A
    mvc.perform(get("/api/orders/" + order.getId()).with(user("user-b").roles("CUSTOMER")))
       .andExpect(status().isForbidden());   // hoặc isNotFound()
}
~~~
- Trả **403** hoặc **404** đều chấp nhận được. Nhiều hệ thống chọn 404 để không tiết lộ rằng id tồn tại (tránh enumeration).
- **IDOR hay lọt vì**: controller lấy id từ path, service query theo id mà **không lọc theo chủ sở hữu**; hoặc lọc bằng thông tin từ body thay vì từ security context; hoặc role check chỉ kiểm tra "có phải CUSTOMER không" mà không kiểm tra "có phải của mình không".

### Test JWT thật
- Ký token trong test bằng cùng bộ ký với production (Nimbus {{JwtEncoder}} hoặc jjwt), rồi gửi qua header {{Authorization}}.
- Bắt buộc có các case: token hết hạn, sai chữ ký, sai audience/issuer, thiếu claim bắt buộc, token của tài khoản đã bị vô hiệu hoá.
- Với {{@WebMvcTest}}, spring-security-test có post-processor {{jwt()}} để dựng request đã có token mà không cần ký thật — nhưng **test tích hợp vẫn phải ký thật**, vì chỉ test tích hợp mới bắt được lỗi cấu hình (sai issuer, sai thời gian sống, sai key).

### Bẫy thường gặp
- **Chỉ test bằng {{@WebMvcTest}}**: slice có nạp bean {{Filter}} và {{SecurityFilterChain}}, nhưng mọi service/repository mà filter tự viết phụ thuộc (tra user, kiểm token bị thu hồi) đều là mock ⇒ không chứng minh được đường đi thật; phải có test full context.
- **Dùng {{ROLE_ADMIN}} cho mọi test** để "cho dễ" ⇒ che mất hầu hết lỗi phân quyền.
- **Không test cả tài khoản bị khóa/xoá** trong khi token còn hiệu lực, và **assert bằng message chứ không bằng mã lỗi**: hãy assert status code và cấu trúc response.

> Senior tip: hãy lập một "ma trận phân quyền" — bảng resource × vai trò — và đảm bảo **mọi ô trong bảng đều có test**. Bảng đó vừa là tài liệu, vừa là danh sách test tự sinh được. Ở hệ thống fintech, ô "người dùng A đọc dữ liệu người dùng B" là ô nguy hiểm nhất, và nó không bao giờ xuất hiện trong test happy path.`,
  follow: [
    'Bạn xử lý thế nào khi phân quyền nằm rải rác ở nhiều tầng (controller, service, repository) — có cách nào test tập trung không?',
    'Làm sao test trường hợp token còn hiệu lực nhưng tài khoản đã bị disable hoặc đổi role?',
    'Bạn có dùng công cụ quét bảo mật tự động (OWASP ZAP, dependency-check) trong pipeline không?'
  ],
  tags: ['security', 'IDOR', 'WithMockUser', 'JWT', 'authorization']
},
{
  id: 'testing-014',
  topic: 'testing',
  level: 'mid',
  q: 'Bạn test migration Flyway/Liquibase thế nào để chắc chắn nó chạy đúng trên dữ liệu thật? Và khi deploy theo kiểu rolling (bản cũ và bản mới cùng chạy), làm sao đảm bảo schema mới không phá bản cũ?',
  a: `**Tóm tắt:** Migration phải được test **trên dữ liệu thật**, không phải trên database rỗng — vì phần lỗi hay nằm ở constraint, dữ liệu sẵn có và thời gian chạy trên bảng lớn. Với rolling deploy, dùng chiến lược **expand–contract**: thêm cột mới (nullable) trước, dual-write trong lúc chuyển đổi, và chỉ **drop cột cũ ở migration sau**, khi mọi instance đã lên bản mới.

### Bốn loại test cho migration
| Loại test | Làm gì | Bắt được lỗi gì |
|---|---|---|
| Chain từ đầu | chạy toàn bộ script trên DB rỗng, từ version 1 tới latest | script sai cú pháp, thiếu file, checksum lệch |
| Upgrade path | nạp snapshot schema + dữ liệu ở version N, chạy script từ N+1 | constraint xung đột với dữ liệu đã có |
| Có dữ liệu thật | chạy trên bản sao dữ liệu production đã ẩn danh | NOT NULL, unique, index bị dữ liệu bẩn làm hỏng |
| Hiệu năng | đo thời gian lock và thời gian chạy trên bảng lớn | migration làm nghẽn production lúc deploy |

~~~java
@Test void migrations_apply_on_top_of_existing_data() {
    // DB là container Postgres rỗng (Testcontainers)
    Flyway.configure()
          .dataSource(dataSource)
          .target("3")          // dừng ở version 3 = schema bản đang chạy production
          .load().migrate();
    seedLegacyOrders(1000);     // nạp 1000 dòng giống dữ liệu cũ (có cả null, trùng, giá trị biên)

    // sau đó nâng lên latest
    var result = Flyway.configure().dataSource(dataSource).load().migrate();
    assertThat(result.success).isTrue();

    assertThat(jdbcTemplate.queryForObject("select count(*) from orders", Long.class))
        .isEqualTo(1000);      // dữ liệu cũ phải còn nguyên
}
~~~
- Gọi {{migrate}} lần hai phải là **no-op** (0 migration được áp dụng) vì versioned migration chỉ chạy một lần; script repeatable ({{R__}}) hoặc script chạy tay thì phải tự viết idempotent ({{IF NOT EXISTS}}…). Chạy {{validate}} để phát hiện file đã apply mà bị sửa (checksum mismatch).
- **Không sửa file migration đã chạy**: checksum sẽ lệch và mọi môi trường báo lỗi. Muốn sửa thì tạo file version mới.
- Dùng **SQL lint** (SQLFluff) trong CI để bắt lỗi cú pháp trước khi lên production.

### Expand–contract cho rolling deploy
| Bước | Hành động | Bản cũ còn chạy được không |
|---|---|---|
| 1. Expand | thêm cột mới nullable, không xoá gì | có |
| 2. Deploy code mới | ghi cả cột cũ và cột mới (dual write) | có |
| 3. Backfill | chép dữ liệu cũ sang cột mới (sau khi đã dual write, để không sót dòng mới) | có |
| 4. Switch đọc | đọc từ cột mới | có |
| 5. Contract | drop cột cũ ở **migration tiếp theo** | không còn cần |

Ví dụ đổi tên cột {{payment_time}} thành {{paid_at}}:
~~~sql
-- Bước expand: chỉ đổi metadata, không khóa ghi lâu
ALTER TABLE orders ADD COLUMN paid_at timestamp NULL;

-- Bước backfill: chạy theo lô để không khóa bảng
UPDATE orders SET paid_at = payment_time
WHERE paid_at IS NULL AND id BETWEEN :from AND :to;

-- Bước contract: chỉ làm sau khi không còn instance đọc cột cũ
ALTER TABLE orders DROP COLUMN payment_time;
~~~
- Tạo index trên bảng lớn phải dùng {{CREATE INDEX CONCURRENTLY}} (Postgres) để không chặn ghi; index này **không chạy được trong transaction**, nên phải cấu hình script đó chạy ngoài transaction (Flyway: {{executeInTransaction=false}} trong file {{.conf}} đi kèm script).
- Với cột cần NOT NULL: thêm nullable → backfill → thêm {{CHECK (paid_at IS NOT NULL) NOT VALID}} → {{VALIDATE CONSTRAINT}} (không chặn ghi) → {{SET NOT NULL}}. Từ Postgres 12, {{SET NOT NULL}} bỏ qua full scan khi đã có CHECK hợp lệ; làm thẳng {{SET NOT NULL}} sẽ scan cả bảng dưới ACCESS EXCLUSIVE lock.
- Mọi bước phải **rollback được**: nếu bước 2 backfill chạy sai thì cần script hoàn tác cụ thể, không phải chỉ "drop cột".

### Bẫy thường gặp
- **Test migration trên DB rỗng** ⇒ bỏ sót toàn bộ lỗi do dữ liệu cũ: trùng unique, vi phạm NOT NULL, index chậm hơn dự kiến.
- **Drop cột ngay trong cùng release** ⇒ bản cũ đang chạy vẫn select cột đó và sẽ lỗi production.
- **Sửa file migration cũ** ⇒ checksum mismatch, deploy dừng giữa chừng.
- **Chạy migration lúc giờ cao điểm** với DDL gây lock ⇒ API treo. Hãy cấu hình cửa sổ bảo trì hoặc migration theo lô.
- **Không kiểm tra thời gian chạy trên bảng lớn** ⇒ deploy kéo dài hàng giờ, bảng bị khóa vì ALTER TABLE phải viết lại 200 triệu dòng.

> Senior tip: hãy giữ **bản sao dữ liệu production đã ẩn danh** trong môi trường kiểm thử và chạy migration trên đó trước mỗi lần release. Nó bắt được những lỗi do dữ liệu bẩn tích tụ nhiều năm (trùng, null, sai định dạng) mà test trên DB rỗng không bao giờ tìm ra. Kết hợp với quy tắc **expand trước, contract sau**, bạn loại bỏ gần như toàn bộ rủi ro downtime do schema change.`,
  follow: [
    'Bạn xử lý thế nào khi cần rollback sau khi đã chạy migration có dữ liệu (không chỉ rollback code)?',
    'Bạn có dùng công cụ nào để so sánh schema giữa các môi trường và phát hiện lệch không?',
    'Khi nào bạn chấp nhận downtime để đổi schema thay vì làm expand–contract?'
  ],
  tags: ['Flyway', 'Liquibase', 'migration', 'zero-downtime', 'database']
},
{
  id: 'testing-015',
  topic: 'testing',
  level: 'senior',
  q: 'Property-based testing (jqwik) khác example-based test thế nào? Bạn dùng nó cho bài toán nào cụ thể, và làm sao chọn property (bất biến) sao cho đúng?',
  a: `**Tóm tắt:** Example-based test chỉ kiểm tra những ca bạn **nghĩ tới**; property-based test kiểm tra **mọi** input trong một miền lớn bằng cách sinh dữ liệu có seed, rồi **thu nhỏ** ca lỗi về ví dụ tối giản. jqwik là thư viện property-based testing cho Java lấy cảm hứng từ QuickCheck, chạy như một test engine trên JUnit Platform. Nó tìm ra bug mà example test bỏ sót chủ yếu ở **biên** (0, số âm, MAX_VALUE), ở **tương tác nhiều tham số**, và ở thuật toán có nhánh hằng số dễ sai.

### So sánh hai cách viết test
| | Example-based | Property-based |
|---|---|---|
| Tiêu chí | kết quả cụ thể ở vài ca | một **bất biến** đúng cho mọi input |
| Khi fail | biết ngay đầu vào | framework **shrink** về ví dụ tối giản |

### Ví dụ thuộc nghiệp vụ thương mại điện tử
Bài toán: tính **phí vận chuyển** và **tổng tiền** của đơn hàng, có giảm giá theo hạng thành viên và miễn ship khi tổng đơn đạt ngưỡng.
~~~java
@Property(tries = 500)
void amounts_never_negative_and_subtotal_monotonic(@ForAll("order") Order order) {
    var total = pricing.total(order);

    // Property 1: bất biến miền giá trị
    assertThat(total.amount()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    assertThat(total.shipping()).isGreaterThanOrEqualTo(BigDecimal.ZERO);

    // Property 2: thêm hàng thì TẠM TÍNH (chưa gồm ship) không giảm.
    // Không assert trên tổng tiền: vượt ngưỡng miễn ship thì tổng có thể GIẢM hợp lệ.
    assertThat(pricing.total(order.withExtraItem(1)).subtotal())
        .isGreaterThanOrEqualTo(total.subtotal());
}

@Provide
Arbitrary<Order> order() {
    return Combinators.combine(
            Arbitraries.integers().between(1, 50),        // số lượng
            Arbitraries.longs().between(0, 5_000_000),    // đơn giá (đồng)
            Arbitraries.of(Tier.class))                   // enum SILVER, GOLD, DIAMOND
        .as(Order::of);                                   // Order.of(int, long, Tier)
}
~~~
Ba thứ cần chú ý:
- **Tách property khỏi ví dụ**: property phải đúng về mặt toán học, nếu không bạn sẽ debug property chứ không phải bug.
- **Generator phải sinh cả dữ liệu khó**: chỉ sinh số lượng từ 1 đến 50 thì không bao giờ chạm biên 0. Hãy sinh cả 0, số âm, giá trị cực lớn khi nghiệp vụ cho phép.
- **Tốn thời gian hơn example test**: 500 ca chỉ mất vài trăm mili giây nếu logic thuần; logic nặng thì giảm {{tries}} ở PR và tăng ở job nightly.

### Chọn property nào mới mạnh
| Dạng property | Ví dụ trong nghiệp vụ | Vì sao mạnh |
|---|---|---|
| Bất biến miền giá trị | phí và tổng tiền luôn không âm | bắt lỗi tràn số, lỗi làm tròn |
| Tương đương với tham chiếu | thuế theo công thức A giống thuật toán B | bắt lỗi ở nhánh hiếm |
| Round-trip | serialize rồi deserialize ra đối tượng ban đầu | bắt lỗi mất field, sai kiểu |
| Đơn điệu | tăng số lượng thì tạm tính không giảm | bắt lỗi logic chiết khấu |

### Khi nào nó tìm ra bug mà example test bỏ sót
- **Biên số**: logic miễn phí ship khi tổng đơn đạt 500.000 đồng, nhưng do làm tròn ở bước trước, đơn đúng ngưỡng thành 499.999 và bị thu phí. Example test với 1.000.000 không bao giờ chạm ngưỡng.
- **Tương tác nhiều tham số**: chỉ 5 cờ true/false đã có 32 tổ hợp; example test thường chỉ chọn 3 tổ hợp "đẹp".
- **Thuật toán chia/trần**: phân bổ số tiền cho nhiều bên phải cộng đúng tổng, thiếu 1 đồng là lỗi nghiêm trọng.
- **Parse chuỗi**: "1.000.000" và "1000000" phải cho cùng kết quả; người dùng VN hay gõ dấu phân cách nghìn.
- **BigDecimal**: lỗi về {{scale}} và {{RoundingMode}} chỉ lộ ra khi giá trị có nhiều chữ số lẻ.

### Bẫy thường gặp
- **Property sai về mặt nghiệp vụ** ⇒ test đỏ liên tục và team bắt đầu bỏ qua. Ví dụ: "thêm hàng thì tổng tiền không giảm" nghe hợp lý nhưng sai khi đơn vượt ngưỡng miễn ship. Ngược lại, property quá yếu cũng nguy hiểm: kiểm tra "kết quả sort chứa đúng các phần tử của input" bằng {{Set}} sẽ bỏ sót lỗi mất/nhân đôi phần tử trùng — phải so sánh theo multiset.
- **Dùng {{Assume.that}} quá nhiều** ⇒ phần lớn ca bị loại, test chạy nhanh nhưng vô nghĩa.
- **Không tái hiện được ca lỗi** ⇒ jqwik in seed trong báo cáo khi fail; chạy lại bằng {{@Property(seed = "...")}}. Mặc định jqwik còn lưu ca lỗi vào file {{.jqwik-database}} ở thư mục project và chạy lại ca đó trước ở lần sau.

> Senior tip: property-based test là **đầu dò bom** chứ không phải lưới an toàn. Đừng kỳ vọng nó thay thế example test — hãy dùng nó để **sinh ra ca lỗi**, rồi chuyển ca lỗi đó thành một example test cố định trong bộ test chính. Bộ test sẽ vừa nhanh, vừa ổn định, vừa không bỏ sót biên.`,
  follow: [
    'Bạn có dùng property-based test ở đâu trong hệ thống của mình không, và thuật toán nào đã tìm ra bug thật?',
    'Làm sao thiết kế generator đủ đa dạng mà vẫn chỉ sinh dữ liệu hợp lệ theo nghiệp vụ?',
    'Bạn có kết hợp property-based test với fuzzing hay mutation testing không?'
  ],
  tags: ['jqwik', 'property-based-testing', 'QuickCheck', 'shrink', 'edge-case']
},
{
  id: 'testing-016',
  topic: 'testing',
  level: 'lead',
  q: 'Làm sao test tính bền vững (resilience) của hệ thống — tiêm lỗi mạng, timeout, downstream chết, mất kết nối Kafka? Bạn làm gì ở môi trường staging, và tooling nào dùng (WireMock, Resilience4j, Toxiproxy)?',
  a: `**Tóm tắt:** Resilience test có **ba tầng**: unit test logic fallback/retry với dependency giả, integration test với **WireMock** để tái hiện timeout, 5xx và connection reset thật, và **chaos test ở staging** với Toxiproxy để cắt mạng và giết pod. Nguyên tắc bắt buộc: mọi lần tiêm lỗi phải gắn với một **giả thuyết trạng thái ổn định (steady-state hypothesis)** và một **điều kiện dừng (abort condition)** — không có hai thứ đó thì chaos test chỉ là gây rối.

### Ba tầng test resilience
| Tầng | Công cụ | Tác động giả lập | Trả lời câu hỏi |
|---|---|---|---|
| Unit | fake client, đồng hồ giả | ném exception, trả lỗi | logic fallback, giới hạn retry đúng không |
| Tích hợp | WireMock | 500, delay, connection reset | breaker mở đúng không, timeout có bị chặn không |
| Staging / chaos | Toxiproxy, kill pod | mất mạng thật, broker sập | hệ thống còn phục vụ được khi dependency chết không |

### Tầng tích hợp — WireMock + Resilience4j
~~~java
@Test void breaker_opens_after_repeated_failures() {
    var server = new WireMockServer(0);                 // port ngẫu nhiên
    server.start();
    server.stubFor(get("/api/inventory").willReturn(serverError()));   // downstream trả 500
    var client = RestClient.create("http://localhost:" + server.port());
    var breaker = CircuitBreaker.of("inventory", CircuitBreakerConfig.custom()
        .slidingWindowSize(4).minimumNumberOfCalls(4)   // mặc định phải đủ 100 call mới đánh giá
        .failureRateThreshold(50).build());
    Supplier<String> guarded = CircuitBreaker.decorateSupplier(breaker,
        () -> client.get().uri("/api/inventory").retrieve().body(String.class));

    for (int i = 0; i < 4; i++)                         // 4 lần 500 thật qua HTTP
        assertThrows(HttpServerErrorException.class, guarded::get);
    assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    assertThrows(CallNotPermittedException.class, guarded::get);  // bị chặn, không gọi xuống
    server.verify(4, getRequestedFor(urlEqualTo("/api/inventory")));
    server.stop();
}
~~~
- WireMock còn giả lập {{withFixedDelay}} để tạo **timeout thật** và {{Fault.CONNECTION_RESET_BY_PEER}} để mô phỏng mất kết nối giữa chừng — hai lỗi hay gặp nhất ở production.
- Với resilience4j-spring-boot3 (cũng là nơi Spring Cloud CircuitBreaker đọc cấu hình), ngưỡng đặt qua property {{resilience4j.circuitbreaker.instances.inventory.sliding-window-size}}.
- Muốn tiêm lỗi mạng ngay trong integration test, Testcontainers có {{ToxiproxyContainer}} đặt giữa app và Postgres/Kafka container.
- **Luôn assert cả hành vi fallback** (trả cache, trả danh sách rỗng, trả lỗi có mã rõ ràng), không chỉ assert breaker đã OPEN.

### Tầng staging — Toxiproxy để tiêm lỗi mạng thật
Toxiproxy đứng giữa service và Postgres: định nghĩa proxy trỏ tới Postgres rồi bật "độc" theo lúc: {{latency}}, {{bandwidth}}, {{timeout}}, {{reset_peer}}, {{slow_close}}, {{slicer}} — đủ để mô phỏng gần như mọi sự cố mạng mà không cần sửa code ứng dụng.

### Kịch bản chaos nên có trong staging
1. **Latency**: thêm 800 ms vào Postgres ⇒ timeout client có phù hợp, connection pool còn chịu nổi không.
2. **Mất kết nối**: {{reset_peer}} giữa lúc đang ghi ⇒ transaction có rollback đúng không.
3. **Broker chết**: dừng Kafka container ⇒ consumer có retry, có DLT, service có sống sót không.
4. **Pod bị giết**: xoá pod giữa lúc đang xử lý đơn ⇒ đơn có bị xử lý dở hay xử lý trùng không, graceful shutdown có hoạt động không.

### Quy trình chaos trình tự và an toàn
- Viết **steady-state hypothesis** trước: "khi Postgres chậm 800 ms, API đặt hàng trả lỗi 503 trong 2 giây và tỷ lệ lỗi dưới 1%".
- Viết **abort condition**: "nếu tỷ lệ lỗi vượt 5% trong 2 phút thì dừng ngay và rollback".
- Có **người canh** theo dõi dashboard và lệnh gỡ lỗi chuẩn bị sẵn; chỉ chạy ở **staging** với dữ liệu giả lập, production cần sự cho phép và cửa sổ thời gian nhỏ.

### Bẫy thường gặp
- **Retry không có jitter** ⇒ khi downstream hồi phục, tất cả client retry cùng lúc và giết chết nó lần hai.
- **Circuit breaker không có fallback** ⇒ lỗi lan thẳng từ service lỗi sang phía trên; thêm **bulkhead** để giới hạn số request chờ.
- **Timeout của client lớn hơn timeout của caller** ⇒ caller hết giờ chờ trước khi client kịp trả lỗi, và thread vẫn bị giữ.
- **Viết "test resilience" bằng cách mock trả 500** ⇒ mock không mô phỏng được pool cạn, thread bị block hay DNS fail.

> Senior tip: hãy đo **SLO trước và sau** mỗi lần đổi cấu hình resilience. Ví dụ "thêm circuit breaker ngưỡng 50% lỗi trong cửa sổ 20 lần, fallback trả cache cũ ⇒ p99 API đặt hàng giảm từ 4,2 giây xuống 300 ms". Con số này biến một quyết định về cấu hình thành quyết định có thể bảo vệ trước sếp và trước team.`,

  follow: [
    'Bạn định nghĩa steady-state hypothesis và abort condition bằng cách nào cho từng dịch vụ?',
    'Làm sao kiểm soát blast radius khi chạy chaos ở staging với dữ liệu gần giống thật?',
    'Bạn có tự động hoá việc chạy chaos test theo lịch (nightly) không, và xử lý kết quả ra sao?'
  ],
  tags: ['chaos-engineering', 'resilience', 'WireMock', 'Resilience4j', 'Toxiproxy']
},
{
  id: 'behavioral-013',
  topic: 'behavioral',
  level: 'senior',
  q: 'Bạn từng phải làm việc với một thành viên trong team làm việc kém hoặc thiếu trách nhiệm. Bạn xử lý thế nào mà vẫn giữ được quan hệ làm việc và không làm tổn thương cả team?',
  a: `**Tóm tắt:** Câu hỏi này đo **cách bạn đối xử với con người**: phân biệt nguyên nhân trước khi kết luận, đặt tiêu chí đo được, và biết lúc nào phải leo thang. Câu trả lời mạnh không kết thúc bằng "tôi đã báo cáo lên quản lý" (nghe như đi mách), mà bằng quá trình có số liệu và **kết quả quan sát được** — kể cả khi người đó không thay đổi.

### Interviewer muốn đánh giá gì
- **Phân biệt nguyên nhân**: thiếu năng lực, thiếu động lực hay vấn đề cá nhân — mỗi loại cần cách xử lý khác nhau.
- **Có hỗ trợ trước khi kết luận**: bạn đã thử hỗ trợ và đo lại chưa.
- **Giao tiếp không công kích**: mô tả hành vi, không gán nhãn tính cách.
- **Biết lúc nào leo thang**, bằng bằng chứng chứ không bằng cảm tính, và **trung thực** về phần của chính mình.

### Ba bước xử lý
1. **Ghi nhận hành vi cụ thể**, có mốc thời gian và tác động đo được.
2. **Tìm hiểu nguyên nhân bằng câu hỏi**, không bằng kết luận sẵn.
3. **Đặt tiêu chí cụ thể + hỗ trợ + mốc thời gian** (thường 4–8 tuần), rồi **theo dõi định kỳ**; nếu không cải thiện thì leo thang có bằng chứng.

### Dấu hiệu phân biệt nguyên nhân
- **Làm tốt khi có người hướng dẫn, hỏng khi tự làm** ⇒ thiếu tự tin, chưa nắm domain: mentoring, giao việc tăng dần độ khó.
- **Vẫn cố gắng nhưng sai tiêu chuẩn, hoặc việc bị bỏ qua tăng dần** ⇒ thiếu năng lực hoặc quản lý thời gian sai: đào tạo, làm rõ tiêu chí, coaching ước lượng.
- **Không phản hồi, vắng họp, hay than phiền đổ lỗi** ⇒ thiếu động lực hoặc vấn đề cá nhân: trao đổi 1-1, tìm hiểu sâu.

### Cách trao đổi — mô hình SBI
Nêu **hành vi** (S: bối cảnh, B: hành vi, I: tác động), rồi mở đường cho họ: "Trong 3 sprint qua có 4 lần PR của bạn phải sửa vì thiếu test, làm tôi chờ thêm một ngày để merge và có 2 lần lỗi lọt ra staging. Bạn muốn tôi hỗ trợ gì?". Đừng nói "Bạn thiếu trách nhiệm" — đó là nhãn tính cách, không phải hành vi.

### Câu trả lời mẫu
> "Trong team thanh toán có một bạn kỹ sư khoảng 1 năm kinh nghiệm. Lúc đầu tôi nghĩ đây là chuyện kỹ năng, vì PR của bạn hay bị tôi trả lại với lý do 'thiếu test'. Sau ba lần trả lại như vậy, tôi nghi ngờ vấn đề nằm ở chỗ khác.
> Tôi làm hai việc. Một: mời bạn đi 30 phút và hỏi đúng một câu — 'Điều gì khiến việc viết test cho bạn khó nhất với module này?'. Câu trả lời: bạn không biết bắt đầu từ đâu vì luồng thanh toán nhiều nhánh, mỗi lần đọc lại code cũ mất cả buổi. Vậy đây là **vấn đề bối cảnh và hướng dẫn**, không phải trách nhiệm. Hai: trong 2 tuần, tôi review trước mỗi PR của bạn và ghi lại **loại test** còn thiếu để bạn làm theo mẫu.
> Sau 4 tuần, số vòng sửa PR do thiếu test giảm từ trung bình 3,2 xuống 1,1; bạn tự viết test cho luồng hoàn tiền mà không cần tôi xem trước. Tháng sau đó chính bạn hướng dẫn onboarding cho một bạn mới.
> Bài học: trước khi kết luận ai đó thiếu trách nhiệm, hãy giả định họ thiếu bối cảnh hoặc hướng dẫn rồi kiểm tra giả định đó. Ở team khác tôi gán nhãn quá sớm và mất một người giỏi."

### Khi nào phải leo thang
- Cần **bằng chứng**: hành vi + thời gian + ảnh hưởng đo được, không phải "tôi thấy bạn ấy cẩu thả".
- Nói với leader trực tiếp của người đó, có ghi chép; nếu liên quan hành vi/đạo đức nghề nghiệp thì báo HR theo quy trình. Đề xuất kèm theo: giữ và có hướng dẫn, đổi vị trí phù hợp.

### Những điều nên tránh
- **Gán nhãn tính cách** ("lười", "vô trách nhiệm"): không đo được, không sửa được, và không có trong bản ghi chính thức.
- **Góp ý trước mặt cả team** hoặc **báo cáo lên trên ngay lần đầu gặp**: làm người đó mất mặt, mất cơ hội hỗ trợ và làm hỏng niềm tin.
- **Tự làm thay phần việc của người đó** để "giúp", hoặc **để chuyện kéo dài nhiều tháng**: tạo tiền lệ mất niềm tin và cuối cùng chấp nhận rủi ro bằng im lặng.

> Senior tip: chuẩn bị **hai phiên bản**: một trường hợp đã thành công (bạn giúp được người đó cải thiện, có số liệu trước/sau), và một trường hợp **không** thành công (bạn đã làm hết phần mình nhưng kết quả vẫn không đổi, và bạn xử lý nó đúng quy trình). Phiên bản thứ hai thuyết phục hơn, vì nó cho thấy bạn hiểu ranh giới giữa "việc của tôi" và "việc không phải của tôi".`,

  follow: [
    'Bạn làm gì khi người đó là người bạn thích, hoặc người có ảnh hưởng lớn tới bạn?',
    'Nếu sau khi hỗ trợ đầy đủ vẫn không cải thiện, bạn chọn phương án nào và nói với người đó thế nào?',
    'Bạn có bao giờ phải báo cáo một người mà bạn vẫn cảm thấy có trách nhiệm với họ không?'
  ],
  tags: ['leadership', 'feedback', 'performance', 'conflict']
},
{
  id: 'behavioral-014',
  topic: 'behavioral',
  level: 'senior',
  q: 'Bạn cần thuyết phục một team khác thay đổi cách họ làm việc, nhưng bạn không phải lead của họ và cũng không có quyền quyết định. Bạn làm gì?',
  a: `**Tóm tắt:** Ảnh hưởng mà không có quyền lực được xây bằng công thức: **lợi ích chung + bằng chứng + giảm rào cản cho họ + quan hệ + tiền lệ nhỏ đã có kết quả**. Bạn không thuyết phục bằng chức vị, mà bằng việc làm cho đề xuất của mình **rẻ và có lợi cho người kia**, rồi để kết quả nói thay lời.

### Interviewer muốn đánh giá gì
- Bạn có hiểu mục tiêu và ràng buộc của team bên kia, hay chỉ nói điều bạn cần.
- Bạn có đưa được **lợi ích cho họ** chứ không chỉ lợi ích cho dự án của mình.
- Bạn có bằng chứng hay chỉ tranh luận bằng cảm tính.
- Thay đổi có **bền vững** sau khi bạn rời dự án không.
- Bạn có biết lúc nào phải leo thang, hay im lặng chịu đựng.

### Năm nguyên tắc
1. **Tìm điểm chung trước**: câu đầu tiên là "việc gì khó nhất với các bạn", không phải "tôi cần các bạn làm gì".
2. **Dùng dữ liệu họ kiểm chứng được**: số liệu từ hệ thống mà họ cũng xem được, gắn với điều họ quan tâm, không phải số liệu chỉ phục vụ bên mình.
3. **Đưa phương án có lợi cho họ**: giảm việc hoặc giảm rủi ro cho họ, không chỉ thêm việc.
4. **Bắt đầu từ thí nghiệm nhỏ, có thể đảo ngược**: pilot trên một nhóm trước khi đề xuất toàn cục.
5. **Tạo tiền lệ**: khi người khác thấy kết quả, họ tự làm theo — đó là ảnh hưởng bền vững nhất.

### Câu trả lời mẫu
> "Một trường hợp tôi phải vận động là muốn đội Mobile gửi kèm idempotency key trong header khi gọi API đặt hàng. Họ phản đối vì cho rằng đó là chi tiết phía backend, mobile chỉ cần gửi body thôi.
> Tôi không bắt đầu bằng việc giải thích vì sao điều đó quan trọng — mà bằng một câu hỏi: 'Trong 3 tháng qua mobile có bao nhiêu lần retry một đơn và tạo ra đơn trùng?'. Họ không biết chính xác. Tôi lấy số liệu từ log API gateway (đội Mobile cũng truy cập được): trong 3 tháng có 1.240 request đặt hàng bị gửi lặp trong vòng 5 giây, tạo ra 38 đơn trùng mà CSKH phải huỷ tay và hoàn tiền. Con số đó là thứ **họ** quan tâm, không phải thứ tôi cần.
> Tôi đề xuất một thay đổi rẻ cho họ: thêm một trường vào lớp request wrapper đã có sẵn của mobile nên mọi màn hình đều tự động có, không phải sửa từng chỗ, và toàn bộ phần còn lại ở phía tôi. Sau khi bản app mới phát hành và backend trả lại đúng kết quả của request đầu tiên khi gặp key trùng, 6 tuần liên tiếp không còn đơn trùng nào.
> Kết quả lâu dài còn quan trọng hơn con số: sau đó mobile chủ động hỏi phía backend những gì nên gửi kèm cho các API khác. Tôi không cần quyền quyết định — tôi cần họ thấy lợi ích và không phải tốn công."

### Khi thuyết phục không được
- **Đưa vấn đề vào nơi quyết định thực sự diễn ra**: một cuộc họp chung có người có quyền, thay vì tranh luận riêng.
- **Viết ra bằng văn bản**: bằng chứng + đề xuất + mốc cần quyết định. Văn bản biến lời nói miệng thành một vấn đề có chủ sở hữu và hạn quyết định.
- **Chuẩn bị phương án thay thế**: giảm phụ thuộc vào thay đổi đó, chứ không đứng chờ.
- **Chọn người có ảnh hưởng**: thuyết phục một người đồng thuận trước, rồi dùng chính người đó để lan tỏa.

### Những điều nên tránh
- **Tranh luận bằng thứ bậc**: "team kia phải làm theo" — bạn sẽ thua cả vấn đề lẫn quan hệ.
- **Ra tối hậu thư hoặc đe dọa**: nếu phải dùng đến đe dọa thì bạn đã thất bại về mặt ảnh hưởng.
- **Bỏ qua điểm đau của họ**: nếu họ đang bị deadline nghiền, một đề xuất "tốt hơn" không đáng để họ mất thời gian.
- **Đề xuất không kèm bằng chứng**: "kinh nghiệm cho thấy" không thuyết phục được kỹ sư giỏi.
- **Im lặng chịu đựng rồi kêu lên sau 3 tháng**: lúc đó vấn đề không còn là kỹ thuật nữa mà là niềm tin.
- **Cố thuyết phục người không có quyền quyết định**: hãy tìm người có quyền từ đầu.

> Senior tip: trước khi đi thuyết phục ai, hãy tự trả lời ba câu: **họ đang bị đau gì, họ sợ mất gì, và đề xuất của tôi giúp họ giảm đau đó bằng cách nào**. Nếu không trả lời được câu thứ ba, bạn đang đi thuyết phục, chứ không phải đang giải quyết vấn đề — và sẽ thất bại theo đúng cách đó.`,
  follow: [
    'Bạn từng thất bại trong việc thuyết phục team khác chưa? Bạn rút ra điều gì?',
    'Làm sao bạn xây dựng uy tín với một team bạn không làm việc cùng hằng ngày?',
    'Khi nào bạn chấp nhận dừng lại và leo thang thay vì tiếp tục thuyết phục?'
  ],
  tags: ['influence', 'stakeholder', 'cross-team', 'communication']
},
{
  id: 'behavioral-015',
  topic: 'behavioral',
  level: 'senior',
  q: 'Kể một lần bạn trễ deadline hoặc thất bại trong một cam kết với khách hàng hoặc với team. Bạn đã báo tin xấu đó ra sao, báo với ai, và khi nào? Bạn làm gì để khắc phục?',
  a: `**Tóm tắt:** Cách bạn báo tin xấu được đánh giá cao hơn bản thân tin xấu. Nguyên tắc là: **báo sớm, báo cụ thể, báo kèm phương án, báo đúng người, và báo một lần rõ ràng**. Người đối tác chấp nhận tin xấu sớm; họ không chấp nhận việc phát hiện ra mình đã bị bỏ qua cho tới phút chót.

### Interviewer muốn đánh giá gì
- **Trung thực**: bạn có thừa nhận thất bại hay vẽ ra một câu chuyện hoàn hảo?
- **Sớm hay muộn**: thời điểm báo tin xấu còn sớm để người khác hành động không.
- **Có phương án hay không**: bạn mang tới vấn đề hay mang tới lựa chọn.
- **Đúng người**: bạn biết ai cần biết, ai không cần biết.
- **Tự trách hay đổ lỗi**: bạn có nhận phần mình không.
- **Có thay đổi quy trình**: sau lần này bạn cam kết khác đi thế nào.

### Bốn câu trong một lần báo tin
| Phần | Nói gì | Ví dụ |
|---|---|---|
| Tình hình | sự thật, ngắn, không vòng vo | "mốc 8h thứ Sáu sẽ không kịp" |
| Ảnh hưởng | ai bị ảnh hưởng, ở mức nào | "quyết toán ngày sẽ thiếu 2 ngày dữ liệu cuối" |
| Phương án | lựa chọn cụ thể bạn đề xuất | "chuyển sang báo cáo tuần trong 2 tuần, rồi chạy lại dữ liệu lịch sử" |
| Điều cần | bạn cần gì từ họ | "quyền đọc bảng giao dịch cũ, cần trong 2 ngày" |

### Báo với ai
| Đối tượng | Khi nào | Nói gì |
|---|---|---|
| Người trực tiếp chịu hậu quả (khách hàng, PM, đội vận hành) | ngay khi bạn chắc chắn không kịp | tình hình, ảnh hưởng, phương án |
| Team của bạn | ngay sau đó | phần bạn cần họ làm ngay |
| Người quyết định ưu tiên | khi phương án cần đổi phạm vi hoặc nguồn lực | đề xuất kèm khuyến nghị rõ ràng |
| Bên liên quan gián tiếp | chỉ khi ảnh hưởng tới họ | tránh lan truyền tin chưa kiểm chứng |

### Câu trả lời mẫu
> "Cuối năm trước tôi cam kết với đội vận hành rằng báo cáo đối soát sẽ có dữ liệu mỗi ngày lúc 8h sáng để họ dùng cho quyết toán ngày. Tôi tự nguyện nhận vì nghĩ chỉ mất một tuần.
> Tôi không kịp mốc đó. Nguyên nhân thật không phải sự cố lớn mà là cộng dồn: tôi đã **không kiểm tra giả định về dữ liệu lịch sử** trước khi cam kết — bảng giao dịch năm trước có 3 nguồn định dạng khác nhau; việc chuẩn hóa cần quyền truy cập hệ thống cũ của đội tài chính, theo quy trình phải chờ khoảng 5 ngày; và sprint đó còn có 2 việc khẩn cấp khác.
> Chiều thứ Hai của tuần có mốc, tôi chắc chắn mình không kịp thứ Sáu. Đây là quyết định quan trọng nhất của tuần: tôi có thể im lặng để còn cơ hội xử lý, nhưng nếu thứ Sáu vẫn không xong, đội vận hành sẽ quyết toán bằng dữ liệu thiếu rồi phải làm lại cả bảng — chi phí lớn hơn nhiều so với việc dời lịch.
> Ngay chiều hôm đó tôi gặp trưởng nhóm vận hành và PM, nói theo đúng bốn câu ở trên, rồi gửi lại email tóm tắt. Kết quả: đội vận hành đồng ý chuyển sang báo cáo tuần trong 2 tuần, PM giúp đẩy nhanh để quyền truy cập được cấp trong 2 ngày, và báo cáo ngày chạy lại từ thứ Hai. Quyết toán quý không bị lệch.
> Tôi cũng thừa nhận mình lẽ ra phải báo từ lúc biết phải chờ cấp quyền, chứ không đợi đến khi chắc chắn trễ. Sau đó tôi thay đổi cách cam kết: trước khi hứa một mốc với bộ phận khác, tôi kiểm tra **giả định đầu vào** và **quyền truy cập cần có**, và tôi cam kết kèm một mốc trung gian — cam kết sớm về việc thử trên một phần dữ liệu thay vì cam kết về kết quả cuối.
> Bài học lớn nhất: cách bạn báo tin xấu quan trọng hơn bản thân tin xấu."

### Những điều nên tránh
- **Báo quá muộn** — báo lúc sự việc đã xảy ra thì thông tin không còn giá trị gì.
- **Báo "mọi thứ vẫn ổn" rồi im lặng**: đây là cách mất niềm tin nhanh nhất.
- **Mang tới vấn đề mà không mang tới lựa chọn**: buộc người khác phải nghĩ thay bạn.
- **Báo cho cả công ty**: tạo tin đồn, mất kiểm soát.
- **Báo nhiều lần với các phiên bản khác nhau**: làm mất niềm tin vào độ tin cậy của thông tin.
- **Đổ lỗi**: kể cả khi nguyên nhân nằm ở hệ thống, bạn vẫn là người nhận cam kết.
- **Che giấu bằng cách gửi bản báo cáo "gần đúng"**: rất nhanh bị phát hiện và tệ hơn nhiều lần so với nói thẳng.

> Senior tip: hãy chuẩn bị **ba phiên bản câu trả lời** cho câu này: tin xấu do lỗi của bạn, tin xấu do bên ngoài, và một lần bạn **phát hiện sớm** rủi ro và báo trước khi nó xảy ra. Phiên bản thứ ba thường gây ấn tượng nhất, vì nó cho thấy bạn có hệ thống cảnh báo sớm chứ không chỉ phản ứng khi sự việc đã hỏng.`,
  follow: [
    'Bạn báo tin xấu qua kênh nào — họp trực tiếp, tin nhắn hay email? Vì sao chọn kênh đó?',
    'Bạn có bao giờ phải báo tin xấu cho khách hàng trực tiếp chưa? Khác gì với báo cho đồng nghiệp?',
    'Sau khi báo tin xấu, bạn theo dõi phản hồi và cam kết lại thế nào?'
  ],
  tags: ['communication', 'risk-management', 'accountability', 'deadline']
},
{
  id: 'behavioral-016',
  topic: 'behavioral',
  level: 'lead',
  q: 'Tiến độ dự án của bạn bị chặn bởi một team khác mà bạn không thể tự quyết định. Bạn làm gì để gỡ tình huống mà không làm hỏng quan hệ và không mất uy tín?',
  a: `**Tóm tắt:** Ở vai trò lead, bị chặn bởi team khác là chuyện thường ngày, và câu hỏi thật là bạn có **gọi đúng tên vấn đề** không. Quy trình hiệu quả: **định lượng mức chặn → tìm đúng người chịu trách nhiệm → hiểu ràng buộc của họ → đề xuất phương án có lợi cho họ → tách phần bạn tự làm được → leo thang có bằng chứng và mốc quyết định**. Điểm mấu chốt: leo thang để **xin một quyết định**, không phải để tố cáo.

### Interviewer muốn đánh giá gì
- Bạn có phân biệt được "bị chặn vì ưu tiên" với "bị chặn vì thiếu năng lực" không.
- Bạn có chủ động tìm cách gỡ thay vì chờ không.
- Bạn có đưa được phương án giúp **cả hai bên**, hay chỉ đẩy bóng.
- Bạn leo thang đúng thứ tự và đúng cách không.
- Bạn có biết lúc nào phải dừng thuyết phục và chuyển sang ra quyết định.

### Năm bước gỡ tình huống
1. **Định lượng chặn cụ thể**: không phải "team Platform chậm" mà là "hạng mục X cần 5 ngày công và phụ thuộc hạng mục Y". Không có con số thì không thể đàm phán.
2. **Tìm người có quyền quyết định** về hạng mục đó, không phải người gửi email.
3. **Hiểu ràng buộc của họ**: họ đang bận việc gì, ai đang ép họ, họ cần gì để ưu tiên cho bạn.
4. **Đề xuất phương án có lợi cho họ**: chia phần việc, cho mượn người hoặc nguồn lực, hoặc nhận phần chuẩn bị nặng nhất về phía bạn.
5. **Tách phần bạn tự làm được** để dự án vẫn tiến được trong lúc chờ.

### Câu trả lời mẫu
> "Trong dự án ra mắt phương thức thanh toán mới, tiến độ của tôi bị chặn bởi đội Platform: họ cần viết lại lớp xác thực chữ ký để hỗ trợ thuật toán mới, còn backlog của họ đã kín tới quý II.
> Bước đầu tôi định lượng chặn: không phải 'đội họ chậm', mà là 'hạng mục xác thực tốn 5 ngày công và cần 2 ngày chờ review nội bộ'. Biết rõ như vậy thì mới đi gặp được đúng người và đúng vấn đề.
> Tôi đến gặp tech lead của họ trước khi đến gặp lead của mình, và hỏi hai câu: 'Việc này có thực sự là ưu tiên cao với các bạn không, và nếu không thì chuyện gì quan trọng hơn với các bạn?'. Câu trả lời thật: họ cũng đang bị deadline hợp đồng B2B và không thể ưu tiên cho tôi.
> Từ đó tôi đề xuất chia phần: tôi lấy 2 ngày công của một kỹ sư phía mình, tự viết bộ test vector và chữ ký mẫu — tức là phần đầu vào họ cần — rồi nhờ họ chỉ làm phần cốt lõi. Thời gian chờ giảm từ 5 ngày xuống 2 ngày, và phần tôi làm không nằm trong mã của họ nên không tạo nợ kỹ thuật.
> Kết quả: tính năng ra mắt đúng mốc đã cam kết với khách hàng. Từ đó tôi đề xuất một thay đổi quy trình: mọi hạng mục chặn tiến độ phải có mốc cam kết **bằng văn bản** từ đội được phụ thuộc và được đưa lên dependency board để cả team đều thấy."

### Leo thang đúng thứ tự
1. Nói chuyện trực tiếp với owner (đường quan hệ trước).
2. Đưa vào cuộc họp chung có người trung gian đáng tin ở cả hai bên.
3. Viết bằng văn bản: mô tả chặn, ảnh hưởng tiến độ bằng ngày, các phương án đã thử, đề xuất cụ thể và **mốc cần quyết định**.
4. Leo thang cấp quản lý khi quyết định về ưu tiên hoặc nguồn lực nằm ngoài tầm bạn.
Nguyên tắc: đi leo thang **cùng dữ liệu và phương án**, không đi để "tố cáo ai đó". Câu mở đầu nên là "Tôi đã xác định đây là vấn đề ưu tiên, không phải vấn đề năng lực. Tôi đã thử hai hướng, cần anh/chị quyết định hướng nào trước ngày X".

### Những điều nên tránh
- **Báo cáo lên trên ngay**, bỏ qua người có thể giải quyết trong 5 phút.
- **Đổ lỗi** ("team kia chậm") — làm mất uy tín và không giúp gì.
- **Im lặng chịu đựng** rồi kêu lên khi đã trễ: lúc đó bạn đã mất cả quyền đề xuất.
- **Tự ý làm thay việc của team khác**: tạo nợ kỹ thuật và xung đột.
- **Ra tối hậu thư hoặc đe dọa**: mất quan hệ mà vấn đề vẫn còn.
- **Đổi đề xuất liên tục** mà không giải thích lý do — người ta sẽ không còn tin đề xuất nào của bạn.

> Senior tip: câu trả lời mạnh cho câu này không phải là "tôi đã giải quyết được chặn" — vì nhiều khi bạn không thể. Điều được đánh giá là bạn có **gọi đúng tên vấn đề**, đã **thử những gì trong tầm tay mình**, **mang tới một lựa chọn cụ thể**, và **biết khi nào cần một quyết định từ trên xuống** thay vì cứ thuyết phục mãi.`,
  follow: [
    'Bạn làm gì khi người chịu trách nhiệm phía bên kia cũng không có quyền ưu tiên cho bạn?',
    'Bạn có bao giờ phải chấp nhận leo thang và bị từ chối không? Bạn xử lý thế nào?',
    'Làm sao đo được mức độ chặn để báo cáo tiến độ lên trên một cách trung thực?'
  ],
  tags: ['leadership', 'dependency', 'escalation', 'project-management']
},
{
  id: 'behavioral-017',
  topic: 'behavioral',
  level: 'mid',
  q: 'Kể một lần bạn nhận được feedback khó nghe — không phải lời khen. Bạn phản ứng thế nào, và điều gì đã thay đổi sau đó?',
  a: `**Tóm tắt:** Câu hỏi này đo **phản xạ** và **khả năng học**. Điều được đánh giá nhiều nhất không phải lời góp ý có đúng không, mà là phản ứng của bạn trong 5 giây đầu và việc bạn có **thay đổi hành vi đo được** hay không. Câu trả lời mạnh thừa nhận lỗi cụ thể, **tách nội dung khỏi cảm xúc**, rồi mô tả thay đổi kèm số liệu.

### Interviewer muốn đánh giá gì
- Bạn có **thật sự nghe** và **tự nhận thức** không, hay chỉ chờ đến lượt nói mình.
- Bạn có biến feedback thành **hành động cụ thể** không.
- Bạn có giữ được quan hệ làm việc sau khi bị góp ý không.
- Sự trung thực: có trường hợp bạn đã phản ứng sai không.

### Ba phản ứng tiêu cực hay gặp
| Phản ứng | Biểu hiện | Hậu quả |
|---|---|---|
| Phòng thủ | giải thích, biện minh, đổi đề tài | không ai còn dám nói thật với bạn |
| Im lặng | "dạ, em ghi nhận" rồi không đổi gì | bạn không biết mình đã hiểu sai ở đâu |
| Phản công | chứng minh người nói sai | quan hệ hỏng, không còn gì để học |

### Năm bước xử lý
1. **Dừng lại** vài giây, không phản ứng ngay — nhất là khi phản ứng đầu tiên là nóng.
2. **Xác nhận bạn hiểu đúng ý**: "Anh muốn em ưu tiên khả năng đọc hơn tốc độ, đúng không ạ?"
3. **Hỏi lại để lấy tiêu chí cụ thể**: "Cụ thể anh muốn thấy khác gì trong PR của em?" — góp ý mơ hồ không sửa được.
4. **Tách nội dung khỏi con người**: góp ý về hành vi ("PR này khó đọc") chứ không phải về con người.
5. **Chốt hành động + mốc + cách đo**, rồi follow up sau 1–2 tháng.

### Câu trả lời mẫu
> "Phản hồi khó nghe nhất tôi từng nhận là từ tech lead trong một buổi review PR: 'Code của bạn viết nhanh, nhưng mỗi lần đọc lại tôi không hiểu chuyện gì đang xảy ra; thà tôi tự viết lại còn nhanh hơn'. Câu đó đau vì nó đúng, và vì tôi tự hào về tốc độ.
> Phản ứng đầu tiên của tôi là phòng thủ: tôi giải thích rằng yêu cầu có nhiều case xử lý trong một lần, và tách hàm ra sẽ thành nhiều lớp. Tech lead chỉ gật đầu: 'Được, cứ tách, nhưng tôi muốn đọc được'. Cuộc nói chuyện kết thúc ở đó, và tôi nhận ra mình đã biến một góp ý thành cuộc tranh luận về kiến trúc — không phải vì tôi sai, mà vì tôi phản biện thay vì làm rõ.
> Tôi làm ba việc sau đó. Một: **lấy dữ liệu thay vì tranh luận**. Tôi đo trong 2 tuần — độ dài hàm trung bình của tôi là 78 dòng, team là 24. Cái tôi gọi là 'case nhiều' thực ra là một hàm đang giữ 6 trách nhiệm. Hai: tôi hỏi thẳng câu lẽ ra phải hỏi từ đầu — 'Anh muốn tôi tối ưu điều gì: tốc độ hay khả năng đọc?'. Câu trả lời là khả năng đọc, vì sau 6 tháng người khác phải sửa code của tôi. Ba: tôi đặt tiêu chí cụ thể — hàm mới không quá 30 dòng, tên hàm nói rõ trách nhiệm, không if lồng quá 2 tầng.
> Kết quả sau 3 tháng: độ dài hàm trung bình còn 26 dòng; số vòng review PR giảm từ 3,1 xuống 1,4; và có lần tôi tự phát hiện một hàm 90 dòng trong PR của mình và tách trước khi gửi. Quan trọng hơn số liệu: từ đó tôi hỏi 'cách này có đọc được sau 6 tháng không' trước mỗi task lớn.
> Bài học: phản hồi khó nghe thường **có phần đúng về vấn đề**, dù cách diễn đạt khiến mình khó chịu. Nhiệm vụ của tôi là tách hai thứ đó ra."

### Nguồn feedback đáng tin
- **Code review** hằng ngày — gần nhất, cụ thể nhất, nhưng cũng dễ bị hiểu là chê bai cá nhân.
- **Postmortem sự cố** — thường chỉ ra điều hệ thống khiến bạn sai, rất sạch cảm xúc.
- **1-1 với lead** — nơi phù hợp nhất để nói về ảnh hưởng và định hướng dài hạn.

### Những điều nên tránh
- **Nói "anh đúng, em sẽ sửa"** rồi không đổi gì — lần sau không ai còn góp ý bạn nữa.
- **Sửa một lần rồi coi như đã tiến bộ**: thay đổi bền vững phải thấy trong 3 tháng sau.
- **Phản biện kỹ thuật ngay lập tức**, kể cả khi đúng: đúng về kỹ thuật nhưng sai về cách tiếp nhận.
- **Tự kết luận "tôi vốn đã biết"**: làm mất đúng cái thông tin bạn cần.
- **Nhận góp ý về hành vi cá nhân rồi tổn thương vô ích** — hãy tách phần hành vi ra.

> Senior tip: hãy chuẩn bị feedback **thật gần đây nhất** (trong 3 tháng) và kể điều bạn đã làm khác đi. Interviewer đánh giá cao sự trung thực hơn câu chuyện hoàn hảo — câu kiểu "tôi chưa bao giờ nhận feedback nào làm mình khó chịu" gần như chắc chắn sẽ bị đào sâu.`,
  follow: [
    'Bạn có hỏi feedback chủ động không, và hỏi ai, bao lâu một lần?',
    'Khi nào bạn phản hồi lại một góp ý mà bạn cho là không đúng? Làm sao nói cho đúng cách?',
    'Bạn đã từng góp ý cho người khác như thế nào để họ không cảm thấy bị công kích?'
  ],
  tags: ['feedback', 'self-awareness', 'growth', 'communication']
},
{
  id: 'behavioral-018',
  topic: 'behavioral',
  level: 'mid',
  q: 'Bạn từng làm việc với khách hàng nước ngoài (Nhật, châu Âu, Mỹ). Khác biệt văn hoá, giao tiếp và múi giờ ảnh hưởng thế nào tới cách bạn làm việc và thiết kế kỹ thuật? Cho một ví dụ cụ thể.',
  a: `**Tóm tắt:** Làm việc với khách hàng nước ngoài không đòi hỏi bạn trở thành người khác, mà đòi hỏi bạn **điều chỉnh quy trình làm việc**: viết quyết định bằng văn bản bất đồng bộ, đặt mốc theo múi giờ của đối tác, và thiết kế API theo chuẩn quốc tế. Phần khó nhất là **cách phản hồi**.

### Interviewer muốn đánh giá gì
- Bạn có **hiểu và thích nghi** khác biệt văn hoá, và chuyển được giao tiếp sang bất đồng bộ (văn bản, quyết định có bản ghi) không.
- Bạn có chủ động tính đến múi giờ, quy trình bàn giao và tuân thủ địa phương không, mà không **khái quát hóa** kiểu "người Nhật thì thế này"?

### Xu hướng giao tiếp cần thích nghi
| Điểm | Nhật (B2B) | Châu Âu | Mỹ |
|---|---|---|---|
| Ra quyết định | ưu tiên tài liệu chính thức, nhiều vòng duyệt | theo quy trình và vai trò | theo dữ liệu, quyết định nhanh |
| Kiểu phản hồi | gián tiếp; "sẽ xem xét" chưa phải là đồng ý; coi trọng báo cáo sớm (Hō-Ren-Sō) | trực tiếp về việc, gián tiếp về người | trực tiếp, cả khen lẫn chê |
| Tài liệu | rất quan trọng, đặc biệt tài liệu API | bắt buộc cho audit | cần để scale, ưu tiên tốc độ |
| Mốc cam kết | cần ổn định, đổi phải báo trước | tuân thủ cam kết đã ký | linh hoạt, MVP là hợp lý |

Hãy coi đây là **xu hướng để thích nghi**, không phải quy luật về con người. Cách an toàn là **hỏi lại**.

### Ảnh hưởng tới thiết kế kỹ thuật
- **Hợp đồng API**: phiên bản rõ ràng, tài liệu OpenAPI, cam kết không phá hợp đồng đủ lâu để đối tác cập nhật client.
- **Tuân thủ dữ liệu cá nhân**: Nhật dùng APPI, châu Âu dùng GDPR, California dùng CCPA — ảnh hưởng tới nơi lưu, thời gian lưu và quyền xoá.
- **Múi giờ**: luôn lưu UTC, hiển thị theo múi giờ người dùng; tiêu chí "hôm nay" theo múi giờ kinh doanh của thị trường.

### Múi giờ ảnh hưởng tới vận hành
- **Bàn giao ca trực (handoff)**: runbook rõ, quyền truy cập không phụ thuộc người ở múi giờ kia; **cửa sổ triển khai** không nên rơi vào giờ làm việc của đối tác.
- **Sự cố**: có người trực theo giờ của khách hàng, thông báo tới đúng đầu mối họ chỉ định.
- **Trao đổi bất đồng bộ**: quyết định nằm trong tài liệu chứ không trong cuộc họp — họp chỉ diễn ra được khi hai múi giờ giao nhau.

### Câu trả lời mẫu
> "Tôi phụ trách tích hợp với một đối tác bán lẻ ở Nhật. Ban đầu mọi việc đi qua email — và tôi mắc một lỗi rõ ràng: tôi gửi câu hỏi rời rạc lúc 16h giờ Việt Nam, tức 18h giờ Nhật, khi họ đã hết giờ làm. Mỗi vòng hỏi đáp mất trọn một ngày, phía họ lại cần xin ý kiến nội bộ trước khi trả lời, nên có câu hỏi về định dạng dữ liệu mất gần hai tuần mới chốt.
> Từ đó tôi thay đổi ba thứ. Một là xếp lịch: mọi cuộc họp với đối tác đều vào 9h hoặc 10h giờ Nhật, tức 7h hoặc 8h giờ Việt Nam — tôi chấp nhận dậy sớm thay vì đẩy lịch. Hai là chuyển quyết định sang văn bản bất đồng bộ: một bảng Q&A chung, gom câu hỏi theo chủ đề, mỗi dòng có người phụ trách, hạn trả lời và trạng thái xác nhận — tôi không coi im lặng là đồng ý, vì phía Nhật thường cần duyệt nội bộ trước khi trả lời chính thức. Ba là kỹ thuật: tôi đưa API sang có tài liệu OpenAPI và cam kết không phá hợp đồng trong 6 tháng, vì đối tác cần thời gian duyệt client.
> Kết quả: số vòng hỏi đáp cho mỗi yêu cầu tích hợp giảm từ trung bình 6 lần xuống 2 lần, và không còn yêu cầu nào phải làm lại vì hiểu sai. Tôi cũng học được một điều: câu trả lời lịch sự kiểu 'không có vấn đề' không phải lúc nào cũng là cam kết, nên tôi luôn hỏi lại bằng một câu cụ thể có ngày giờ, ví dụ 'Tôi gửi tài liệu API vào 10h sáng giờ Nhật thứ Ba, anh xác nhận lịch này được không?'."

### Những điều nên tránh
- **Gửi bản dịch máy mà không đọc lại** và **dùng thành ngữ, viết tắt nội bộ**: rất dễ hiểu sai; hãy viết câu ngắn, rõ ràng, kèm ví dụ cụ thể.
- **Tự suy diễn "người Nhật thì chậm quyết định"** hoặc **bỏ qua yêu cầu tuân thủ địa phương**: ấn tượng xấu và rủi ro hợp đồng.
- **Hẹn giờ linh hoạt đến mức bạn phải online lúc 23h**: giải quyết bằng tài liệu bất đồng bộ.

> Senior tip: công cụ đơn giản và hiệu quả nhất khi làm việc xuyên múi giờ là **ba nguyên tắc**: viết mọi quyết định vào tài liệu, đặt deadline theo múi giờ của người đọc, và luôn kết thúc bằng một câu hỏi cụ thể có ngày giờ. Ba thứ đó loại bỏ phần lớn sự cố lệch múi giờ, mà không cần "học giao tiếp văn hoá" chung chung.`,

  follow: [
    'Bạn từng gặp khó khăn gì khi làm việc với khách hàng theo múi giờ xa nhất? Bạn xử lý thế nào?',
    'Khi khách hàng phụ thuộc vào đội của bạn nhưng ở múi giờ khác, bạn tổ chức bàn giao ca trực ra sao?',
    'Bạn có dùng công cụ hay quy ước nào để tránh hiểu sai khi trao đổi bằng văn bản không?'
  ],
  tags: ['cross-cultural', 'communication', 'timezone', 'international']
},
{
  id: 'behavioral-019',
  topic: 'behavioral',
  level: 'lead',
  q: 'Ở vai trò senior/lead, bạn phỏng vấn ứng viên thế nào? Bạn thiết kế vòng phỏng vấn ra sao, và đánh giá ứng viên dựa trên những tiêu chí gì?',
  a: `**Tóm tắt:** Vai trò của interviewer là **đánh giá năng lực bằng bằng chứng quan sát được**, không phải trả lời câu hỏi cho xong. Một vòng phỏng vấn tốt có **tiêu chí chấm điểm viết trước**, mỗi câu hỏi gắn với một **tín hiệu cần tìm**, và điểm số dựa trên bằng chứng. Điều khó nhất là **giữ tính nhất quán giữa nhiều interviewer** trong cùng một quyết định.

### Interviewer muốn đánh giá gì
- Bạn có **thiết kế được quy trình tuyển dụng** thay vì nói "tôi hỏi vài câu rồi cảm nhận" không.
- Bạn có phân biệt được ứng viên giỏi và ứng viên **nói hay**, và chuẩn bị tiêu chí chấm điểm **trước** buổi phỏng vấn không.
- Bạn có xử lý được bất đồng giữa các interviewer một cách chuyên nghiệp không.
- Bạn có đánh giá **rủi ro của việc thuê sai** (chi phí, ảnh hưởng tới tiến độ và tinh thần team) không.

### Thiết kế vòng phỏng vấn
| Vòng | Mục tiêu | Dạng bài | Tín hiệu cần tìm | Người phỏng vấn |
|---|---|---|---|---|
| 0. Screening | kinh nghiệm, lương, thời gian sẵn sàng | 20–30 phút | động lực, kỳ vọng lương, lý do rời việc | recruiter hoặc tech lead |
| 1. Kỹ thuật nền | chiều sâu kiến thức, tư duy phân tích | 45 phút, hỏi về hệ thống đã làm | cách phân rã, nói về đánh đổi | dev senior |
| 2. Vòng coding | viết code thật dưới mắt interviewer | 60 phút, bài có edge case | chia nhỏ, xử lý biên, giao tiếp | dev senior |
| 3. System design | thiết kế ở quy mô lớn | 45 phút | đánh đổi, đo lường, vận hành, chi phí | tech lead hoặc architect |
| 4. Văn hóa và vai trò | cách làm việc, xử lý tình huống | 30 phút | tinh thần trách nhiệm, cách phản hồi | lead hoặc manager |

### Rubric — viết trước, chấm sau
Mỗi tiêu chí cần **3 mức** mô tả bằng hành vi quan sát được.
| Tiêu chí | Dưới mức | Đạt mức | Vượt mức |
|---|---|---|---|
| Giải quyết vấn đề | cần được dắt tay | tự phân rã và hỏi đúng câu hỏi | đổi hướng khi có thông tin mới |
| Tư duy hệ thống | chỉ nói về CRUD | biết trade-off của lựa chọn | nói rõ rủi ro vận hành và cách đo |
| Chất lượng code | chạy được nhưng rối | rõ ràng, có test | xử lý cả đường lỗi và biên |
| Giao tiếp | trả lời lệch câu hỏi | trả lời đúng và cụ thể | điều chỉnh trình bày theo người nghe |

### Câu hỏi mở và tín hiệu đi kèm
- "Kể lại lần bạn phải sửa một quyết định kỹ thuật gây ảnh hưởng lớn nhất. Bạn đã làm gì?" → tín hiệu: nhận lỗi, có số liệu, có thay đổi quy trình.
- "Một lần bạn phải làm việc với stakeholder không kỹ thuật. Bạn dịch vấn đề sang ngôn ngữ của họ thế nào?" → tín hiệu: dịch sang giá trị kinh doanh.
- "Bạn đã làm gì khi biết mình sẽ trễ deadline?" → tín hiệu: báo sớm, có phương án.

### Quy trình chuẩn bị và chấm điểm
1. **Trước buổi phỏng vấn**: đọc CV, chọn 2–3 tiêu chí quan trọng nhất, chốt tín hiệu cần tìm.
2. **Trong buổi phỏng vấn**: mở bằng câu hỏi mở, để ứng viên nói phần lớn thời gian, không dẫn dắt.
3. **Ngay sau buổi phỏng vấn, trong 15 phút**: ghi bằng chứng và chấm điểm theo rubric — **trước khi** xem điểm người khác.
4. **Debrief**: so sánh bằng chứng, không so sánh cảm xúc; khi bất đồng, người phản biện phải đưa bằng chứng.
5. **Quyết định**: dựa trên bằng chứng và rủi ro, không theo ấn tượng tổng thể.

### Những điều nên tránh
- **Hỏi "anh có bao nhiêu năm kinh nghiệm"**: không phân biệt được người giỏi với người đi ngang.
- **Dẫn dắt quá tay** để ứng viên cảm thấy "giỏi": bạn đang đo sự thoải mái, không phải năng lực.
- **Hỏi ý kiến thay vì hành động**: "anh nghĩ sao về Kafka" không phân biệt được; "anh xử lý thế nào khi Kafka lỗi" thì có.
- **Vibe check**: cảm giác "hợp" là tín hiệu yếu, có xu hướng loại trừ nhóm thiểu số.
- **Chấm điểm không theo rubric**, hoặc để điểm của người khác chi phối điểm của mình.
- **Không đọc CV trước**: hỏi lại thứ đã ghi sẵn, lãng phí thời gian của cả hai bên.
- **Ép ứng viên kể chi tiết bí mật của công ty hiện tại** (số liệu kinh doanh, kiến trúc nội bộ nhạy cảm): ứng viên chịu kể là tín hiệu xấu về tính bảo mật, còn bạn tạo rủi ro pháp lý.

> Senior tip: interviewer giỏi không cố chứng minh mình thông minh, mà cố làm ứng viên cảm thấy **được đánh giá công bằng và có cơ hội thể hiện tốt nhất** — kể cả khi họ trả lời sai. Nếu ứng viên thấy mình đang bị "đi thi", họ sẽ diễn, và bạn sẽ tuyển nhầm người giỏi diễn.`,

  follow: [
    'Bạn làm gì khi một interviewer trong team đưa ra điểm lệch hẳn với người khác?',
    'Bạn có tiêu chí nào để quyết định một ứng viên là "đủ tốt" cho vị trí này không?',
    'Làm sao tuyển được ứng viên giỏi khi thị trường cạnh tranh gay gắt và ứng viên có nhiều lựa chọn?'
  ],
  tags: ['hiring', 'interview', 'leadership', 'people']
},
{
  id: 'behavioral-020',
  topic: 'behavioral',
  level: 'senior',
  q: 'Kể một lần bạn chủ động nhận việc vượt ngoài phạm vi được giao, không ai yêu cầu. Bạn đã làm gì, kết quả ra sao, và làm sao nhận biết việc đó là đáng làm chứ không phải là chiếm sở hữu của người khác?',
  a: `**Tóm tắt:** "Chủ động nhận việc" là hành vi **tốt**, nhưng câu hỏi thật là bạn có biết **ranh giới** giữa thấy lỗ hổng và chiếm sở hữu của người khác không. Câu trả lời mạnh thể hiện ba điều: **báo trước khi làm**, **giới hạn phạm vi** đúng lỗ hổng cần lấp, và **bàn giao lại** để việc đó trở thành của cả team.

### Interviewer muốn đánh giá gì
- Bạn có **chủ động nhìn thấy vấn đề** ngoài phạm vi được giao không.
- Bạn có **cân nhắc hậu quả** của việc vượt rào hay chỉ hành động theo bản năng.
- Bạn có biết cách **giao tiếp** với người bị ảnh hưởng bởi việc bạn làm, và biến việc cá nhân thành **năng lực chung** của team không.
- Bạn có **không phải** là kiểu "tôi làm hết một mình" không.

### Ba loại việc ngoài phạm vi
| Loại | Ví dụ | Rủi ro nếu làm ẩu |
|---|---|---|
| Lỗ hổng chưa ai để ý | quy trình release chỉ một người biết, thiếu monitoring | tự ý đổi hạ tầng production |
| Việc bị bỏ rơi giữa hai ranh giới | hợp đồng giữa mobile và backend không ai sở hữu | làm thay phần việc của team khác |
| Gỡ blocker cho người khác | đội khác chờ dữ liệu mà bạn tự tạo được nhanh hơn | sản phẩm sai mục đích vì bạn hiểu sai |

### Năm nguyên tắc để không bị coi là lấn sân
1. **Báo trước khi làm**: nói rõ bạn thấy gì, định làm gì, phạm vi bao nhiêu, mất bao lâu.
2. **Giới hạn phạm vi**: chỉ lấp lỗ hổng, không biến thành refactor khi không ai yêu cầu.
3. **Không tự quyết thay người khác**: nếu thay đổi nằm trong hệ thống của team khác, phải có họ đồng ý.
4. **Bàn giao lại**: sau khi xong, trao quyền sở hữu và viết tài liệu để người khác làm tiếp.
5. **Đưa vào quy trình**: biến việc cá nhân thành việc của cả team — đưa vào backlog, checklist release, runbook.

### Câu trả lời mẫu
> "Sau mỗi đợt sale lớn, đội vận hành phải chạy tay một script để đánh dấu các đơn có điểm loyalty cần tính lại. Script nằm trong tài liệu nội bộ, chỉ một anh bạn ở đội vận hành biết chạy. Trong 6 tháng tôi thấy 2 lần quên chạy, và mỗi lần dữ liệu điểm của khách sai suốt 2 ngày.
> Đây không phải việc được giao cho tôi, cũng không nằm trong backlog sprint. Tôi vẫn đề xuất nhận, vì thỏa ba điều kiện: tôi là người phát hiện vấn đề, lead đội vận hành (chủ của quy trình này) đồng ý, và tôi làm được mà không xung đột với ưu tiên nào đang chạy.
> Tôi làm theo thứ tự: (1) **đề xuất trước** với lead của tôi và lead đội vận hành — hỏi ai muốn sở hữu việc này, tôi sẵn sàng hỗ trợ; không ai có thời gian, nên tôi xin làm trong khoảng 2 ngày, có ticket và phạm vi ghi rõ. (2) **giới hạn công việc** ở đúng lỗ hổng: đưa việc chạy script thành cron job tự động sau khi đợt sale kết thúc, kèm thông báo kết quả cho đội vận hành — tôi không đụng logic tính điểm, không sửa schema. (3) **bàn giao lại**: viết runbook và hướng dẫn anh bạn ở đội vận hành cách theo dõi, chạy lại khi job lỗi; job thuộc quyền sở hữu của đội vận hành.
> Kết quả: 8 tháng liên tiếp không còn ca tính điểm sai; công việc thủ công giảm khoảng 3 giờ mỗi đợt sale; và điều tôi quan tâm nhất là anh bạn ở đội vận hành sau đó trở thành người được hỏi ý kiến khi muốn tự động hoá thứ khác — tức là tôi không lấy đi vai trò của ai.
> Bài học: 'chủ động nhận việc' không có nghĩa là 'làm thay người khác'. Nó nghĩa là thấy lỗ hổng, báo trước, làm vừa đủ để lấp nó, rồi đưa nó về đúng chủ sở hữu."

### Những điều nên tránh
- **Làm xong mới báo**: biến một việc tốt thành việc gây mất niềm tin.
- **Mở rộng phạm vi thành refactor lớn**: tốn thời gian của team khác.
- **Chiếm sở hữu kỹ thuật của team khác**: dù ý tưởng tốt, kết quả vẫn là xung đột.
- **Tự ý đổi cấu hình production hoặc deploy** khi không có quyền.
- **Không ai biết bạn đã làm**, hoặc **chữa triệu chứng thay vì nguyên nhân gốc**: người khác làm lại hoặc bạn chỉ thêm một bước kiểm tra thủ công.

> Senior tip: câu hỏi này có đáp án bẫy phổ biến — "tôi làm hết một mình và cả team ngạc nhiên". Câu trả lời tốt thừa nhận **ranh giới**. Hãy chuẩn bị hai phiên bản: một lần nhận việc và làm thành công, và một lần bạn nhận việc nhưng cuối cùng **nhường lại** cho người phù hợp hơn — kèm bài học bạn rút ra. Phiên bản thứ hai cho thấy bạn hiểu khác biệt giữa chủ động và lấn sân.`,
  follow: [
    'Làm sao bạn nói "tôi thấy vấn đề này và tôi sẽ xử lý" mà không nghe như đang lấn sân?',
    'Bạn từng phải từ bỏ một việc bạn đã nhận vì thấy mình vượt rào chưa?',
    'Làm sao bạn đưa một việc bạn tự làm trở thành việc chung của team?'
  ],
  tags: ['ownership', 'initiative', 'leadership', 'collaboration']
}
);

