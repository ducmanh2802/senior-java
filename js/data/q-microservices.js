/* Topics: microservices - owner: task T4. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'microservices-001',
  topic: 'microservices',
  level: 'mid',
  q: 'Team 5 người, domain chưa ổn định, deadline 3 tháng. Bạn sẽ khuyên chọn monolith, modular monolith hay microservices? Liệt kê những tình huống bạn khuyên KHÔNG nên tách service.',
  a: `**Tóm tắt:** với domain chưa ổn định và team nhỏ, hãy bắt đầu bằng **modular monolith** - một tiến trình duy nhất nhưng chia module theo boundary rõ ràng; chỉ tách microservices khi có bằng chứng thật về nhu cầu scale độc lập hoặc xung đột release cadence giữa các team.

### So sánh nhanh
| Tiêu chí | Monolith cổ điển | Modular monolith | Microservices |
|---|---|---|---|
| Chi phí vận hành | thấp nhất | thấp | cao: pipeline, deploy, network, monitoring cho từng service |
| Boundary | mơ hồ, trôi theo thời gian | buộc bằng package + kiểm thử kiến trúc | buộc bằng API contract + schema riêng |
| Scaling | cả ứng dụng | cả ứng dụng | từng service, từng bảng |
| Transaction | ACID free | ACID free | tự lo saga/outbox/compensation |
| Độc lập deploy của team | thấp | trung bình | cao |

### Khi nào KHÔNG nên tách
- **Domain còn thay đổi**: mỗi lần đổi model lại phải đổi contract + migration cho 2 DB. Chi phí tách vượt lợi ích; hãy chờ tới khi boundary "chưa đổi suốt 3 tháng liên tiếp".
- **Team dưới ~8–10 người**: một team 5 người gánh 8 service = 0,6 người mỗi service, phần lớn thời gian lo infra thay vì làm sản phẩm.
- **Chưa có CI/CD, container, observability**: tách service mà không có pipeline deploy/rollback, tracing, logging tập trung thì downtime chỉ tăng.
- **Nghiệp vụ cần transaction mạnh trên nhiều entity**: monolith cho ACID free; tách ra là bạn tự nhận việc saga, outbox, idempotency.
- **Chưa tìm ra product-market fit**: chi phí thay đổi (change cost) quan trọng hơn chi phí scale.

### Dấu hiệu ĐÃ sẵn sàng tách
- Một module luôn thay đổi độc lập và kéo theo deploy cả hệ thống.
- Module cần resource/profile khác (bộ nhớ lớn, GPU, blast radius cao như thanh toán).
- Hai team cãi nhau về lịch release, hoặc một team chặn release của team kia.
- Đã có: infrastructure as code, blue-green deploy, distributed tracing, centralized log.

### Modular monolith thực tế
Chia package theo bounded context, module chỉ phụ thuộc qua interface public, cấm chạm bảng của module khác - kiểm bằng ArchUnit:

~~~java
@ArchTest
static void order_khong_dang_ky_vao_payment(JavaClasses classes) {
    noClasses().that().resideInAPackage("..order..")
        .should().dependOnClassesThat().resideInAPackage("..payment.internal..") // chỉ qua API public
        .check(classes);
}
~~~

Mỗi module có schema riêng trong chung một instance DB. Sau này tách service, bạn migrate đúng schema đó sang DB mới - code gần như chỉ đổi chỗ kết nối và thêm API layer.

> Senior tip: chi phí thật của microservices không nằm ở code mà nằm ở ops - mỗi service thêm một dashboard, một pipeline, một runbook on-call. Hãy tách theo đau thật, không theo CV.`,
  follow: [
    'Nếu bắt buộc phải tách một module ra sớm, bạn chọn module nào và lấy tiêu chí gì?',
    'Modular monolith khác gì so với SOA (ESB) về centralization?',
    'Bạn dùng ArchUnit/JPMS để enforce module boundary như thế nào trong CI?'
  ],
  tags: ['monolith', 'modular monolith', 'architecture decision', 'DDD']
},
{
  id: 'microservices-002',
  topic: 'microservices',
  level: 'senior',
  q: 'Hai team đang share chung một schema database để đỡ phải gọi API qua lại. Bạn giải thích vì sao cách này rủi ro và dùng DDD để xác định service boundary thế nào?',
  a: `**Tóm tắt:** **database-per-service** không phải để tiết kiệm kết nối mạng mà để bảo toàn tính độc lập: mỗi service sở hữu data của chính nó, service khác chỉ đọc qua API/event. Boundary đúng trong DDD là **bounded context** - nơi một từ có nghĩa duy nhất.

### Vì sao share DB là coupling ngầm
- Team B đổi schema (đổi tên cột, tách bảng, đổi kiểu) mà team A không biết ⇒ downtime "vô cớ". Ràng buộc compile-time không tồn tại, ràng buộc runtime vẫn có.
- Query join xuyên service: code gọn thật, nhưng giờ hai deployment phải đồng bộ schema mọi lúc - bạn vừa tạo lại distributed monolith ở tầng data.
- Scale vô nghĩa: hai service cùng một instance DB thì bottleneck vẫn là DB đó, không thể scale đọc/ghi riêng.
- Blast radius: một full-scan ngây thơ của service A làm chậm DB chung ⇒ service B chết theo dù không dính gì.

~~~text
Order Service                   Payment Service
+------------------+            +------------------+
| orders (schema)  |  REST/evt  | payments (schema)|
+------------------+ <--------> +------------------+
      khong doc bang cua nhau, chi doc qua API/event
~~~

### Tìm boundary bằng DDD
1. **Event storming** với các chủ thể business: vẽ domain event (OrderPlaced, PaymentCaptured, ItemShipped) → gom các command/event liên quan thành một context.
2. **Ubiquitous language**: mỗi context một ngôn ngữ. "Customer" trong Sales là người đặt hàng, trong Shipping là người nhận; "Product" trong Catalog là item hiển thị, trong Inventory là SKU tồn kho. Hai nghĩa khác nhau = hai context.
3. **Context mapping**: xác định quan hệ - customer-supplier, conformist, hay anti-corruption layer. Tránh shared kernel (nhắc lại coupling), chỉ dùng khi cả hai bên cùng giữ strict contract.

### Truy cập data xuyên service
- Đọc: **API composition** (gộp kết quả ở tầng ứng dụng) hoặc **CQRS read model** (dựng bảng read riêng, cập nhật bằng event). Không join SQL xuyên service.
- Ghi: không bao giờ update bảng của service khác; publish event để service đó tự cập nhật data của mình.
- Data tham chiếu tĩnh (bảng quốc gia, danh mục): replicate về hoặc tách thành reference service - nhưng phải có source of truth duy nhất.

### Pitfall production
- Chia quá mỏng: 30 service, mỗi request phải composition qua 10 hop ⇒ latency nhân lên, khó debug. Boundary sai còn đau hơn monolith.
- "Thì mình hứa không đụng DB của nhau" - thỏa thuận không enforce được. Bắt buộc bằng contract test, hoặc tối thiểu kiểm tra qua audit log / connection-pool metrics xem service nào kết nối vào DB của service nào.

> Senior tip: tín hiệu đỏ lớn nhất là "2 service phải luôn deploy cùng nhau" - khi đó chúng là một service, hãy gộp lại thay vì vờ tách.`,
  follow: [
    'Nếu hai bounded context cần dữ liệu khách hàng, bạn chọn shared kernel hay anti-corruption layer? Vì sao?',
    'API composition và CQRS read model khác nhau khi nào, chi phí nào lớn hơn?',
    'Làm sao phát hiện một service đang âm thầm truy cập DB của service khác trong production?'
  ],
  tags: ['DDD', 'bounded context', 'database per service', 'API composition'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-003',
  topic: 'microservices',
  level: 'mid',
  q: 'Khi tích hợp với 20 service khác, bạn chọn REST/gRPC đồng bộ hay messaging bất đồng bộ? So sánh theo ba loại coupling: thời gian, availability và dữ liệu.',
  a: `**Tóm tắt:** đồng bộ hợp cho **query/nhận kết quả ngay** (latency thấp, dễ debug), bất đồng bộ hợp cho **sự kiện/ngoại lệ cần sống sót khi phía kia chết**. Câu hỏi thật không phải "REST hay Kafka" mà là "ai cần biết kết quả ngay và ai chấp nhận chờ?".

### Ba loại coupling
| | Đồng bộ (REST/gRPC) | Bất đồng bộ (queue/topic) |
|---|---|---|
| **Time** | caller phải chờ, hai tiến trình cùng chạy cùng lúc | hai bên lệch thời gian, có buffer nên chống spike |
| **Availability** | A chết thì B lỗi theo (vô tình tạo tight coupling) | A chết, message vẫn nằm broker, B xử lý khi hồi phục |
| **Data/form** | trả về đúng schema bạn yêu cầu | chỉ chia sẻ event đã public, mỗi bên tự diễn giải |

- **Availability coupling** là thứ ghê gớm nhất: 20 service gọi đồng bộ chain A→B→C→D thì xác suất thành công = tích xác suất từng mắt xích. Càng nhiều hop, càng mong manh.
- **Dữ liệu coupling**: REST trả đúng field bạn cần (tight, phải sync contract); event chỉ là sự kiện đã xảy ra, subscriber tự thêm logic.

### REST hay gRPC cho call đồng bộ
- **REST/JSON**: dễ nhìn, dễ test bằng curl, là chuẩn HTTP, hợp edge/public API.
- **gRPC**: protobuf nhị phân, HTTP/2 multiplexing, payload nhỏ hơn vài lần, codegen typed từ {{.proto}}, hỗ trợ streaming - hợp service-to-service nội bộ. Hạn chế: không gọi trực tiếp từ browser thường (cần grpc-web/Envoy), khó debug bằng mắt, thay đổi schema phải theo quy tắc backward compatible của protobuf (không dùng field number lại, không đổi kiểu dữ liệu).
- Trong Spring Boot 3 có {{grpc-spring-boot-starter}} (net.devh hoặc LogNet) hoặc dự án chính thức Spring gRPC; môi trường Kubernetes thì Envoy/Istio thường lo việc chuyển giao protocol.

### Khi nào bất đồng bộ
- Phản ứng phụ (gửi mail, ghi audit, invalidate cache) - caller không cần kết quả.
- Nghiệp vụ kéo dài (đơn hàng mất 30s để xử lý) - trả 202 Accepted + trạng thái để poll.
- Nhiều consumer cùng xử lý một sự kiện, hoặc cần giữ event để replay.

### Bẫy hay gặp
- **Dùng queue như RPC**: đẩy request vào queue, chờ reply topic - bạn vừa có distributed RPC với độ trễ và độ phức tạp gấp đôi.
- **Chuỗi event dài**: order.created → payment.started → ... không ai thấy toàn cảnh, sự kiện quay vòng thành vòng lặp. Nếu 3 service phải "nói chuyện" liên tục để hoàn thành một bước, hãy cân nhắc orchestration.
- Bất đồng bộ = **eventual consistency**: UI phải báo "đang xử lý", không được giả định ghi xong là thấy ngay.

> Senior tip: đồng bộ luôn phải có timeout (dưới 1 giây cho call nội bộ), bất đồng bộ luôn phải có idempotency + chiến lược thứ tự. Thiếu một trong hai là bạn chưa xong.`,
  follow: [
    'Nếu chọn gRPC, bạn xử lý chuyện versioning contract giữa client và server ra sao?',
    'Khi nào một hệ thống bất đồng bộ vẫn cần trả response đồng bộ cho người dùng?',
    'Bạn set timeout cho chuỗi A gọi B gọi C như thế nào để không nuốt hết thời gian?'
  ],
  tags: ['REST', 'gRPC', 'messaging', 'coupling']
},
{
  id: 'microservices-004',
  topic: 'microservices',
  level: 'lead',
  refs: [{"type": "doc", "title": "Microservices - Martin Fowler", "url": "https://martinfowler.com/articles/microservices.html"}, {"type": "doc", "title": "microservices.io patterns", "url": "https://microservices.io/patterns/"}, {"type": "doc", "title": "Enterprise Integration Patterns", "url": "https://www.enterpriseintegrationpatterns.com/"}],
  q: 'Một nghiệp vụ phải ghi dữ liệu ở 3 service khác nhau. Vì sao không dùng 2PC? Bạn thiết kế Saga theo choreography và orchestration như thế nào, và compensation xử lý failure ra sao?',
  a: `**Tóm tắt:** 2PC (two-phase commit) bắt tất cả participant giữ lock và chờ coordinator - trong môi trường phân tán có partition, ta **hy sinh availability để lấy độ nhất quán**; chi phí performance và rủi ro kẹt lock quá lớn với workload online. Thay vào dùng **Saga**: chuỗi transaction cục bộ, mỗi bước có compensation để lùi lại.

### 2PC hoạt động thế nào và sập ở đâu
~~~text
Coordinator: PREPARE ──► tất cả participant "đóng băng" (giữ lock, ghi redo/undo log)
            ◄── VOTE yes/no
            COMMIT (hoặc quay về ROLLBACK)
~~~
- Vấn đề 1: **blocking** - participant treo vô hạn nếu coordinator chết giữa chừng (không biết commit hay rollback) ⇒ giữ lock ⇒ hàng đợi con nợ, DB phình.
- Vấn đề 2: mỗi phase ít nhất một round-trip + fsync log, throughput tụt mạnh (XA thường chỉ bằng một phần nhỏ của local tx).
- Vấn đề 3: CAP - khi network partition, hoặc là unavailable, hoặc là không nhất quán; hệ thống payment online chọn availability nên không dùng 2PC xuyên region.

### Saga: 10 bước, 10 transaction cục bộ
~~~text
ReserveStock ─► ChargePayment ─► CreateShipment ─► SendInvoice
     │ fail          │ fail            │ fail
     ▼               ▼                 ▼
 ReleaseStock ◄── RefundPayment ◄── CancelShipment   (compensation)
~~~
Mỗi bước: **đọc state → validate → ghi local tx → publish event/command**. Nếu bước N thất bại không phục hồi được, chạy compensation từ N-1 về 0.

### Choreography vs Orchestration
| | Choreography (event) | Orchestration (saga center) |
|---|---|---|
| Điều phối | không ai, mỗi service tự phản ứng | một orchestrator ra lệnh từng bước |
| Coupling | thêm service chỉ thêm consumer | orchestrator biết mọi bước (tăng dần) |
| Quan sát | khó thấy luồng, phải trace | thấy rõ trạng thái từng bước ngay |
| SPOF | không | orchestrator phải HA (state lưu DB/Redis) |
| Phù hợp | ≤ 3–4 service, flow ngắn, cùng team | flow dài, nhiều bước, cross-team, cần timeout/retry tập trung |

Công nghệ Java: choreography dùng Kafka/Spring Cloud Stream listener; orchestration dùng Camunda/Flowable, Temporal (SDK Java), hoặc Spring StateMachine + bảng saga state.

### Compensation - thứ mọi người đánh giá thấp
- **Không phải rollback**: nghiệp vụ đã xảy ra (tiền đã trừ) phải bù trừ bằng hành động kinh doanh (refund, gửi voucher xin lỗi), nhiều khi cần người duyệt.
- Compensation cũng thất bại được ⇒ phải **idempotent + retry + DLQ + cảnh báo để xử lý tay**.
- Thiếu **isolation**: hai saga cùng đọc "số lượng còn 1" rồi cùng reserve ⇒ cần semantic locking (đánh dấu reserved thay vì trừ ngay), reservation với TTL, hoặc pivot transaction (bước giữa - nếu thành công thì coi như đã "chốt").

> Senior tip: luôn lưu **saga log** (trạng thái từng bước) trong cùng DB với orchestrator, để sau crash biết chính xác đang ở bước nào. Không có log = không ai dám restart.`,
  follow: [
    'Saga mất isolation thì bạn ngăn oversell bằng cách nào cụ thể trong code?',
    'Khi nào chọn choreography thay vì orchestration dù flow có 4 service?',
    'Temporal/Camunda khác gì so với việc tự viết orchestrator bằng Spring?'
  ],
  tags: ['2PC', 'Saga', 'compensation', 'distributed transaction']
},
{
  id: 'microservices-005',
  topic: 'microservices',
  level: 'senior',
  q: 'Ứng dụng của bạn cùng lúc ghi database và publish event lên Kafka. Vì sao đây là dual-write problem? Bạn giải quyết bằng Transactional Outbox + CDC (Debezium) như thế nào?',
  a: `**Tóm tắt:** ghi DB rồi mới publish event (hoặc ngược lại) là **hai transaction trên hai resource không cùng atomicity** - crash ở khoảng giữa làm event mất hoặc event "ảo". Giải pháp: ghi business row **và** bản ghi event vào một bảng outbox **trong cùng một transaction**, rồi một tiến trình riêng (relay/CDC) đọc outbox đẩy ra broker.

### Dual-write mất mát thế nào
~~~text
Cách sai A:  db.commit()  ──► crash ──► event KHÔNG bao giờ được gửi
Cách sai B:  publish ok   ──► tx.rollback() ──► event "ảo": không có đơn hàng nào nhưng báo đã tạo
~~~
Không có transaction manager nào phối hợp được DB và Kafka (không ai muốn XA với broker). Và {{@TransactionalEventListener(AFTER_COMMIT)}} vẫn hỏng: commit xong, process chết trước khi publish - event mất vĩnh viễn, không log nào chỉ ra.

### Outbox hoạt động từng bước
~~~java
@Transactional
public void placeOrder(OrderCmd cmd) {
    Order agg = Order.create(cmd);
    orderRepo.save(agg);                       // 1 transaction với outbox
    outboxRepo.save(OutboxEvent.of(agg.getId(), // aggregateId => dùng làm Kafka key
        "order.created", mapper.writeValueAsString(agg)));
}
~~~
- **Một transaction**: hoặc cả hai ghi, hoặc cả hai không - không còn middle ground.
- Publisher đọc outbox và gửi lên Kafka rồi đánh dấu đã gửi. Hai kiểu:
  - **Polling**: {{@Scheduled}} đọc bảng {{SELECT ... FOR UPDATE SKIP LOCKED}} - đơn giản, độ trễ ~100ms–1s, thêm tải cho DB.
  - **CDC (Debezium)**: đọc WAL/replication slot của Postgres (hoặc binlog MySQL) ⇒ không thêm tải query, độ trễ ~ms, không phải sửa code domain. Outbox event router của Debezium biến row thành event với envelope {{aggregateType/aggregateId/payload}} và **tự đặt Kafka key = aggregateId** để giữ thứ tự theo aggregate.

### Kiến trúc
~~~text
App ─► [orders DB] ─(logical replication)─► Debezium (Kafka Connect)
                                │                 │
                                ▼                 ▼
                          business row      topic: order.created
                                                    │
                                              consumer (idempotent)
~~~

### Pitfall production
- Outbox phình to: cần job dọn row đã gửi (giữ 7–30 ngày) và filter tombstone khi delete row.
- Vẫn là **at-least-once**: Debezium crash giữa chừng thì gửi lại ⇒ consumer bắt buộc idempotent.
- Thứ tự: partition theo {{aggregateId}} để mọi event cùng đơn hàng vào cùng partition.
- Không được phép "chỉ publish, không lưu" trong code review - đây là violation kiến trúc, chặn bằng test tích hợp.

> Senior tip: dùng CDC cho outbox là chuyện bình thường, nhưng nó thêm một thành phần (Kafka Connect cluster) phải monitor như service thật - lag của connector cũng là lag của business.`,
  follow: [
    'Outbox và event table ở domain model có phải là một không, nên đặt trong schema nào?',
    'Debezium publish ra broker mà broker đang sập thì xử lý tiếp ra sao?',
    'Polling outbox với SKIP LOCKED hoạt động thế nào khi có nhiều instance app?'
  ],
  tags: ['outbox', 'CDC', 'Debezium', 'dual-write'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-006',
  topic: 'microservices',
  level: 'senior',
  q: 'Làm sao để hệ thống "exactly-once hiệu quả" khi consumer crash giữa chừng? Giải thích idempotency key phía client, dedup phía consumer và tại sao exactly-once end-to-end là bất khả thi.',
  a: `**Tóm tắt:** exactly-once qua mạng là bất khả thi (một biến thể của two-generals: không phân biệt được "mất" với "chậm"). thứ chúng ta thật sự làm là **at-least-once + consumer idempotent = exactly-once effect**: message có thể đến 2 lần nhưng hệ quả chỉ xảy ra 1 lần.

### Ba Semantics
| Semantics | Cách đạt | Hệ quả |
|---|---|---|
| At-most-once | nhận được là xử lý ngay, không retry | mất message khi lỗi |
| At-least-once | retry mãi cho tới khi xác nhận | **trùng lặp** - mặc định của Kafka/RabbitMQ |
| Exactly-once (end-to-end) | không thể chỉ bằng broker | cần idempotency ở hai đầu |

Kafka có "exactly-once" **trong phạm vi broker**: producer idempotent ({{enable.idempotence=true}} tránh lặp do retry trong session) + transactional producer (commit offset cùng message trong một transaction) + consumer {{isolation.level=read_committed}}. Nhưng nếu side effect nằm ngoài Kafka (ghi DB, gọi HTTP) thì nó không biết - vòng lặp vẫn đóng lại ở application.

### 1) Idempotency key phía client
Client sinh UUID, gửi kèm header {{Idempotency-Key}}; server lưu key + response (khóa unique):

~~~java
@Transactional
public Receipt charge(String key, ChargeCmd cmd) {
    // unique constraint ở DB: 2 request trùng key => exception => trả response đã lưu
    if (cache.contains(key)) return cache.response(key);
    Receipt r = payments.charge(cmd);           // side effect
    cache.save(key, r);                         // commit chung transaction nếu DB-backed
    return r;
}
~~~
- Lưu **kèm response** để duplicate trả về đúng kết quả cũ (HTTP 200/409 tùy quy ước), không chạy lại side effect.
- Ràng buộc: key có **scope theo endpoint + khách hàng**, có TTL (VD 24h); request trùng key nhưng payload khác ⇒ trả 422 (đừng im lặng chạy).
- POST không idempotent theo spec, PUT/DELETE có - nhưng ở distributed system vẫn nên key mọi lệnh tạo tiền.

### 2) Consumer idempotent - "exactly-once effect"
- **Dedup theo message id**: bảng {{processed_msg(msg_id PK)}}; insert trước khi xử lý, conflict ⇒ bỏ qua. Chạy trong **cùng transaction** với business write, nếu không thì crash giữa hai bước vẫn lặp.
- **Natural key upsert**: chốt sổ theo nghiệp vụ thì không cần dedup table:
~~~sql
INSERT INTO ledger(order_id, amount) VALUES (:id, :amt)
ON CONFLICT (order_id) DO NOTHING;   -- MySQL: ON DUPLICATE KEY UPDATE id=id
~~~
- "Đã xử lý rồi" phải là **hành vi kinh doanh**, không chỉ là flag kỹ thuật: trả về cùng kết quả cũ (đúng tinh thần idempotency).

### 3) Bẫy
- Retry **ở nhiều tầng** cùng lúc (client + framework + broker) ⇒ x3 số bản sao, dedup table phình.
- Consumer xử lý bất đối xứng: side effect ngoài DB (gọi API third-party) mà dedup flag lại commit sau đó ⇒ crash giữa hai chỗ = duplicate charge thật.
- TTL dedup quá ngắn so với độ trễ đỏ của broker (message có thể bay vòng 1 giờ) ⇒ trùng lặp quay lại.

> Senior tip: measure = số bản ghi trùng/“duplicate suppressed” mỗi phút. Con số này luôn khác 0 trong hệ thống healthy; bằng 0 nghĩa là bạn chưa bật retry, không phải là bạn đã exactly-once.`,
  follow: [
    'Idempotency key nên lưu trong Redis hay DB, vì sao?',
    'Nếu side effect là gọi REST phía thứ ba không hỗ trợ idempotency, bạn làm gì?',
    'Offset commit trước hay sau khi xử lý? Chọn từng lựa chọn thì đánh đổi gì?'
  ],
  tags: ['idempotency', 'delivery semantics', 'exactly-once', 'retry'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-007',
  topic: 'microservices',
  level: 'senior',
  q: 'Bạn cấu hình resilience cho một service gọi 10 downstream qua Resilience4j (Spring Boot 3) thế nào? Thứ tự áp timeout, retry, circuit breaker, bulkhead, fallback và vì sao?',
  a: `**Tóm tắt:** nguyên tắc bất di bất dịch - **mọi call mạng đều có timeout**; retry chỉ cho thao tác idempotent, có jitter và số lần giới hạn; circuit breaker để **fail fast** khi dependency đã yếu; bulkhead để một dependency chết không kéo sập toàn bộ thread pool.

### Thứ tự và lý do
~~~text
caller → [bulkhead] → [retry] → [circuit breaker] → [timeout] → downstream
~~~
> Lưu ý: với annotation, Resilience4j có thứ tự aspect mặc định riêng: Retry ( CircuitBreaker ( RateLimiter ( TimeLimiter ( Bulkhead ( call ) ) ) ) ) - muốn khác thì chỉnh các property {{circuitBreakerAspectOrder}}, {{retryAspectOrder}}... hoặc dùng API functional (Decorators).
- **Timeout trong cùng, áp dụng cho mỗi lần gọi** (không bao giờ chờ vô hạn). Resilience4j không tự "timeout" call thường - kết hợp {{@TimeLimiter}} (async) hoặc HTTP client timeout (RestClient/ WebClient của Spring Boot 3).
- **Retry nằm ngoài circuit breaker**: mỗi lần gọi lặp được breaker đếm; và khi breaker đang OPEN, retry nhận {{CallNotPermittedException}} - cấu hình retry bỏ qua exception này để không "đánh thức" service đang hấp hối.
- **Bulkhead** ngăn 10 caller cùng tốn hết thread: semaphore (nhẹ, chặn số call đồng thời) hoặc thread pool (cô lập hẳn, có độ trễ xếp hàng).
- **Fallback** chạy cuối cùng: cache cũ, giá mặc định, trả "đang xử lý" - fallback **tự thân cũng không được gọi network** (trừ khi có timeout riêng).

~~~java
@Service
class PaymentClient {
    @CircuitBreaker(name = "paymentApi", fallbackMethod = "fallback")
    @Bulkhead(name = "paymentApi")
    public Receipt charge(ChargeCmd cmd) {
        return rest.postForObject("/charges", cmd, Receipt.class); // RestTemplate, HTTP client timeout 800ms
    }
    private Receipt fallback(ChargeCmd cmd, Throwable t) {   // Throwable param => resilience4j tự nối
        return Receipt.pending(cmd.orderId());              // degrade, KHÔNG gọi API nào khác
    }
}
~~~

~~~yaml
resilience4j:
  circuitbreaker:
    instances:
      paymentApi:
        slidingWindowSize: 100          # cửa sổ 100 lượt gần nhất (count-based)
        slowCallDurationThreshold: 2s   # call chậm hơn 2s cũng tính là lỗi
        slowCallRateThreshold: 50
        failureRateThreshold: 50        # mở circuit khi >50% lỗi
        waitDurationInOpenState: 30s    # nghỉ 30s rồi cho thử lại
        permittedNumberOfCallsInHalfOpenState: 10
  retry:
    instances:
      paymentApi:
        maxAttempts: 3
        waitDuration: 200ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        enableRandomizedWait: true      # jitter - tránh mọi client thức dậy cùng lúc
        randomizedWaitFactor: 0.5
  bulkhead:
    instances:
      paymentApi:
        maxConcurrentCalls: 25          # <= ~1/4 số thread xử lý của service
~~~

### Nguyên tắc cấu hình
- **Timeout < overall deadline** của request: nếu request tổng cho 5s mà call lẻ 5s thì vô nghĩa.
- Retry: chỉ retry lỗi **transient** (connect, 503, timeout) - đừng retry 400/401 (lỗi của bạn, retry chỉ tăng tải).
- **Fallback không che giấu sự cố**: vẫn ghi metric/log theo exception; nếu fallback rate > 5% thì báo động, chứ không "ổn thôi".
- Bulkhead tối đa bằng số thread sẵn sàng, không phải bằng throughput mong muốn.

> Senior tip: chạy thử nghiệm fault injection (chaos test: kill 1 pod, cắt network) trước production. Cấu hình resilience đọc thì đúng nhưng không ai tin cho tới khi bạn thấy nó tự cứu cụm một lần.`,
  follow: [
    'Retry nên đặt ngoài hay trong circuit breaker? Bạn biện minh cho lựa chọn của mình ra sao?',
    'Bulkhead theo semaphore khác thread pool khi nào, và nhược điểm từng loại?',
    'Fallback cache cũ có rủi ro gì với dữ liệu tài chính?'
  ],
  tags: ['Resilience4j', 'circuit breaker', 'bulkhead', 'timeout'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-008',
  topic: 'microservices',
  level: 'senior',
  q: 'Đêm qua một dependency chậm dần, cả hệ thống timeout rồi cụm chết theo. Đây là retry storm/cascading failure thế nào? Bạn ngăn bằng những gì?',
  a: `**Tóm tắt:** **retry amplification** - mỗi client retry 3 lần thì dependency nhận 4 lần tải; cộng jitter sai (retry cùng lúc) và timeout quá dài (thread kẹt) ⇒ **thread pool của upstream cạn kiệt**, dịch vụ vô tội chết dù chính nó không lỗi. Đây là nguyên nhân số một của outage lan truyền.

### Chuỗi sự cố từng bước
~~~text
1. Dependency B chậm (GC pause, DB lock) ⇒ thời gian phản hồi 2s → 20s
2. A timeout 30s (quá dài) + retry 3 lần ⇒ mỗi request giữ thread 90s
3. Thread pool 200 của A kẹt hết ⇒ request mới xếp hàng ⇒ A "chết" cả khi còn rảnh
4. C, D gọi A cùng kịch bản ⇒ lan sang toàn cụm (cascading failure)
5. Health check chậm ⇒ orchestrator restart hàng loạt ⇒ restart storm, mất dữ liệu tiến trình
~~~

### Ngăn
1. **Timeout ngắn + tổng (overall deadline)**: tổng thời gian retry không vượt quá budget của request. Nếu đã quá deadline thì **đừng retry** - nó chỉ cắn trộn tài nguyên của người đến sau.
2. **Jitter bắt buộc**: delay = random(0, min(cap, base × 2^attempt)). Không jitter = đồng bộ hóa retry (thundering herd) đúng vào lúc B vừa hồi phục và lại sập.
3. **Retry budget**: chỉ cho phép retry chiếm ~10% traffic bình thường (Envoy, AWS SDK đều làm vậy). Retry không được lớn hơn traffic gốc.
4. **Circuit breaker**: mở khi failure rate cao ⇒ fail fast trong 30s thay vì giữ thread chờ.
5. **Bulkhead + timeout phía client**: mỗi downstream một ngăn, không chung chạ thread.
6. **Backpressure trả về client**: 429/503 kèm {{Retry-After}} để caller phân tán tự làm chậm, thay vì nhận hết rồi queue nội bộ vô hạn.
7. **Không retry thao tác không idempotent**; nếu phải retry thì đi kèm idempotency key.
8. **Adaptive concurrency** (AIMD / AWS SDK client-side limiting): tự hạ số call đồng thời khi thấy lỗi tăng, giống TCP congestion control.

### Phát hiện trước khi sập
- Metric: {{retries_total}}, {{timeout_total}}, {{thread_pool_active}} / {{max}}, queue depth, p99 latency theo dependency (không phải tổng thể).
- Trace: một span cha có 4 span con cùng loại = dấu hiệu retry; fan-out bất thường = cascade sớm.
- Alarm theo **triệu chứng** (error rate, latency p99) chứ không chỉ theo cause (CPU).

> Senior tip: quy tắc vàng khi oncall - "khi một service chậm, hãy giảm tải cho nó, không phải tăng retry". Retry là thuốc an thần cho developer và là thuốc độc cho hệ thống.`,
  follow: [
    'Retry budget tính cụ thể ra sao trong code của bạn?',
    'Vì sao timeout quá dài còn nguy hiểm hơn timeout quá ngắn?',
    'Làm sao phân biệt retry storm với lưu lượng thật sự tăng trong dashboard?'
  ],
  tags: ['retry storm', 'cascading failure', 'backpressure', 'thundering herd'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-009',
  topic: 'microservices',
  level: 'senior',
  q: 'Giải thích cách Kafka đảm bảo ordering trong partition, cơ chế consumer group, offset commit và rebalancing. Sau đó nói về delivery semantics và cách xử lý poison pill bằng DLQ.',
  a: `**Tóm tắt:** Kafka là **distributed log phân đoạn**: thứ tự chỉ được đảm bảo **trong một partition**, mỗi partition thuộc đúng một consumer trong group. At-least-once là mặc định (xử lý xong mới commit offset); exactly-once end-to-end vẫn cần consumer idempotent; poison pill phải được chuyển sang **DLQ** để không kẹt partition.

### Partition & ordering
- Producer hash key rồi chọn partition: {{toPositive(murmur2(key)) % numPartitions}} - cùng key ⇒ cùng partition ⇒ **ordering theo key** (VD: cùng order_id).
- Tăng số partition ⇒ mapping key→partition đổi, event của cùng order có thể rơi vào partition khác ⇒ thứ tự với consumer cũ không còn. Muốn đổi thì phải có chiến lược (hash ring ổn định, hoặc chấp nhận chuyển sang key mới).
- Retry/reconnect có thể gửi sai thứ tự ⇒ bật {{enable.idempotence=true}} (producer sequence number) và {{max.in.flight.requests.per.connection ≤ 5}} với {{acks=all}} để giữ thứ tự mà vẫn nhanh.
- Across partition **không có thứ tự** - nếu bạn cần thứ tự toàn cục thì partition đó chính là bottleneck.

### Consumer group & rebalancing
- Group = tập consumer chia nhau partition: 8 partition, 10 consumer ⇒ 8 chạy việc, 2 idle; 8 partition, 4 consumer ⇒ mỗi consumer 2 partition.
- Coordinator (broker giữ group) theo dõi heartbeat; khi consumer chết hoặc **vượt {{max.poll.interval.ms}}** (xử lý quá lâu giữa hai lần poll) ⇒ bị đá khỏi group ⇒ **rebalance**.
- Eager rebalance: mọi consumer **nhả hết** partition rồi chia lại ⇒ dừng xử lý đôi ba giây. **Cooperative-sticky** ({{partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor}}): chỉ chuyển những partition cần, giảm dừng nhận.
- **Static membership** ({{group.instance.id}}): restart pod quay lại trong {{session.timeout.ms}} thì không kích hoạt rebalance - deploy không còn lặp lại cảnh dừng chia partition.

### Offset commit & semantics
- **Auto-commit** (mặc định của Kafka client, mỗi 5s) commit trong lúc {{poll()}} offset của batch đã poll trước đó: xử lý đồng bộ trong vòng poll thì vẫn at-least-once, nhưng nếu đẩy message sang thread khác xử lý thì crash ⇒ **mất message**. Spring Kafka mặc định tắt auto-commit và tự commit theo AckMode (BATCH).
- At-least-once chuẩn: xử lý side effect **xong** rồi {{commitSync()}}; crash giữa hai bước ⇒ xử lý lại ⇒ cần idempotent.
- Exactly-once trong Kafka: transactional producer gộp "ghi dữ liệu + commit offset" trong một transaction, consumer đọc {{read_committed}} - nhưng chỉ trong Kafka; side effect ngoài broker vẫn phải idempotent.

### Poison pill & DLQ
Message hỏng (dữ liệu sai, code bug) ⇒ xử lý mãi lỗi ⇒ offset không tăng ⇒ **một partition chết vĩnh viễn**. Spring Kafka xử lý gọn:

~~~java
var recoverer = new DeadLetterPublishingRecoverer(template,
    (rec, ex) -> new TopicPartition(rec.topic() + ".DLQ", rec.partition()));
var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 3L)); // 3 lần rồi DLQ
containerFactory.setCommonErrorHandler(handler);
~~~
- Message DLQ giữ header gốc (nguyên nhân, offset, exception) để replay sau khi fix.
- **Cảnh báo theo độ sâu DLQ** - đó là lỗi nghiệp vụ đang chờ, không phải rác vô hại.
- Sau khi fix, replay: đọc DLQ push lại topic gốc (vẫn idempotent).

### Pitfall
- Đặt key là timestamp/ngẫu nhiên ⇒ mất thứ tự theo nghiệp vụ.
- Xử lý lâu trong listener mà không tăng {{max.poll.interval.ms}} ⇒ bị coi là chết, rebalance oan.
- Tăng partition giữa chừng khi đang có consumer lưu vị trí cũ.

> Senior tip: monitor **consumer lag** (offset cao nhất − offset đã xử lý) là metric số 1 của Kafka - lag tăng là dấu hiệu đầu tiên của cả slow processing lẫn lỗi logic.`,
  follow: [
    'Tại sao tăng số partition lại là thao tác phá ordering? Bạn xử lý ra sao?',
    'Khi nào commit offset trước xử lý lại là lựa chọn đúng?',
    'So sánh eager và cooperative rebalance trong lúc rolling deploy.'
  ],
  tags: ['Kafka', 'partition', 'consumer group', 'DLQ'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-010',
  topic: 'microservices',
  level: 'mid',
  q: 'So sánh Kafka, RabbitMQ và SQS/SNS. Bạn chọn gì cho: (a) luồng sự kiện cần replay, (b) queue công việc đơn giản trên AWS, (c) pub/sub fan-out nhiều subscriber?',
  a: `**Tóm tắt:** **Kafka** là log phân đoạn lưu để còn **đọc lại/ phân tích**; **RabbitMQ** là broker thông minh với routing và xác nhận từng message; **SQS/SNS** là dịch vụ managed của AWS - không lo máy chủ, trả tiền theo lượt. Chọn theo yêu cầu, không chọn theo độ hot.

### Bảng nhanh
| | Kafka | RabbitMQ | SQS / SNS |
|---|---|---|---|
| Mô hình | log append-only, consumer tự kéo offset | queue/exchange, broker push + ACK | queue managed (SQS), pub/sub fan-out (SNS) |
| Giữ dữ liệu | theo thời gian/kích thước (7 ngày...) | đến khi ACK (hoặc TTL) | tối đa 14 ngày (SQS) |
| Replay | **có** - reset offset đọc lại từ đầu | không với queue thường (đã ACK là xong); RabbitMQ Streams 3.9+ thì có | không |
| Thứ tự | theo partition/key | theo queue (mất khi nhiều consumer/requeue) | FIFO queue: theo message group |
| Throughput | rất cao (hàng trăm MB/s) | trung bình, mỗi message routing riêng | rất lớn, managed |
| Chi phí ops | **cao** (cluster, monitor, upgrade) | trung bình | gần bằng 0 |
| Tính năng nổi bật | stream processing (Kafka Streams), connect | exchange/binding, TTL, DLX, priority | SNS fan-out, FIFO, EventBridge filter |

### Trả lời ba tình huống
- **(a) Luồng sự kiện cần replay / phân tích**: **Kafka**. Bạn từng xử lý bug và phải đọc lại 3 ngày event? Chỉ Kafka cho phép reset offset. Event sourcing, CDC (Debezium), real-time aggregation đều nằm trên Kafka. Lưu ý ops: từ Kafka 4.0 dùng **KRaft**, không còn ZooKeeper, giảm một thành phần phải vận hành.
- **(b) Queue job đơn giản trên AWS**: **SQS** - poll, autoscale worker, visibility timeout (message "ẩn" khi đang xử lý, hiện lại nếu không delete ⇒ retry free), đổi concurrency không đụng ai. FIFO queue cần khi bắt buộc thứ tự theo message group.
- **(c) Fan-out nhiều subscriber**: **SNS → nhiều SQS** (mỗi subscriber một queue, tách biệt hoàn toàn) hoặc **EventBridge** khi cần filter theo event pattern/schema. Một event phải tới 5 service thì SNS là đường ngắn nhất.

### Khi nào RabbitMQ thắng
- Routing phức tạp tại broker: exchange direct/topic/fanout, binding theo pattern - không phải mỗi subscriber tự filter.
- Cần priority queue, TTL từng message, RPC pattern (reply-to), AMQP/MQTT (IoT).
- Quy mô vừa, muốn độ trễ giao message thấp, không cần replay.

### Bẫy
- Dùng Kafka làm queue "chỉ để lấy độ trễ thấp": đúng, nhưng bạn đang bỏ tiền cho retention/streaming mà không dùng.
- SNS+SQS → mỗi subscriber lỗi đầy queue ⇒ không ai chịu trách nhiệm; vẫn cần DLQ (redrive policy) + alarm.
- RabbitMQ partition/network issue: quorum queue (thay classic mirrored queue) để chống mất dữ liệu khi node chết.

> Senior tip: đội AWS kinh nghiệm thì SQS/SNS cho công việc lặt vặt, Kafka (MSK/Confluent) khi có nhu cầu event streaming thật. Đừng chọn Kafka chỉ vì "sẽ cần analytics một ngày nào đó" - chi phí ops đến ngay, benefit đến muộn.`,
  follow: [
    'Kafka giữ message 7 ngày, nếu cần 90 ngày thì bạn làm gì?',
    'Visibility timeout của SQS xử lý worker chết giữa chừng như thế nào?',
    'Khi nào nên gộp SNS + EventBridge thay vì chỉ dùng SNS?'
  ],
  tags: ['Kafka', 'RabbitMQ', 'SQS', 'SNS']
},
{
  id: 'microservices-011',
  topic: 'microservices',
  level: 'senior',
  q: 'Giải thích vai trò của API Gateway và BFF, chúng khác nhau ở đâu? So sánh client-side load balancing với server-side (Kubernetes) và service discovery.',
  a: `**Tóm tắt:** **Gateway** là cửa ngõ infra chung cho mọi client (TLS, auth, rate limit, route); **BFF** là tầng aggregate **theo từng trải nghiệm** (web, mobile) viết bằng logic nghiệp vụ. Load balancing: **client-side** linh hoạt nhưng client phải thông minh; **server-side** đơn giản, thêm một hop nhưng kiểm soát tập trung.

### API Gateway
- Việc chung: terminate TLS, xác thực JWT (validate chữ ký, issuer, audience), rate limit/WAF, routing tới service, request/response transformation, cache,Observability (một chỗ gắn tracing).
- Spring Boot 3 có **Spring Cloud Gateway** (reactive, Netty) - route bằng predicate + filter; ngoài ra Envoy, Kong, APISIX, AWS API Gateway.
- **Gateway không được chứa logic nghiệp vụ**: mỗi khi có if/else theo domain trong gateway là bạn đang tạo "god tier". Nó trở thành bottleneck deploy và nơi mọi người sợ đụng vào.

~~~yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order
          uri: lb://order-service          # lb:// => dùng service discovery để chọn instance
          predicates:
            - Path=/api/orders/**
      default-filters:
        - name: CircuitBreaker
          args: { name: default, fallbackUri: forward:/fallback }
~~~

### BFF (Backend For Frontend)
- Web cần 3 calls gộp thành 1 danh sách; mobile cần field khác, nhỏ gọn hơn, kèm recommendation. BFF **theo experience** lo việc aggregate đó.
- Khác gateway: gateway lo **chính sách** (infra), BFF lo **dữ liệu/giao diện API** (product).
- Hai BFF (web/mobile) share session/auth thế nào là câu hỏi thật - thường vẫn lấy token từ IdP chung.
- Bẫy: BFF nhân lên rồi thành 20 service nhỏ không ai maintain; nếu cả hai experience dùng y hệt API thì đừng tạo BFF.

### Service discovery & load balancing
| | Client-side | Server-side (Kubernetes) |
|---|---|---|
| Ai chọn instance | **client** (Eureka/Consul + Spring Cloud LoadBalancer) | LB của cluster (Service/ClusterIP → kube-proxy/iptables hoặc Envoy) |
| Hop | 1 (trực tiếp tới instance) | 2 (qua Service → pod) |
| Retry/thông minh | client tự làm (cùng resilience config) | LB trung tâm, thường chỉ round-robin |
| Health check | client/query registry | kube-probe (liveness/readiness) |
| Phù hợp | đa ngôn ngữ, không có K8s, cần cân bằng theo load thực | **môi trường K8s - khuyên dùng** |

- Trong K8s: **headless Service** ({{clusterIP: None}}) trả thẳng Pod IPs cho StatefulSet; external-dns + Ingress cho edge.
- DNS-based discovery có cache/staleness: TTL thấp ⇒ DNS query dồn dập; TTL cao ⇒ gửi vào pod đã chết ⇒ luôn cần timeout + retry ở client.

### Pitfall
- Gateway aggregate 10 service mà không có timeout riêng cho từng route ⇒ chậm nhất nuốt hết budget.
- Client-side LB + client retry riêng mỗi service ⇒ mỗi team viết lại một lần logic resilience; đây là lý do mesh ra đời.

> Senior tip: ở Kubernetes, đừng bận tâm viết service discovery của riêng bạn - Service + CoreDNS + readiness probe đã là service discovery; hãy đầu tư vào timeout/retry/tracing ở client.`,
  follow: [
    'Khi nào nên dùng gRPC + client-side LB thay vì REST qua gateway?',
    'BFF của web và mobile dùng chung token thì rủi ro gì?',
    'Headless service khác gì service thường, khi nào cần?'
  ],
  tags: ['API Gateway', 'BFF', 'service discovery', 'load balancing'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-012',
  topic: 'microservices',
  level: 'senior',
  q: 'Bạn xây dựng observability cho hệ thống 30 microservices thế nào? Phân biệt RED/USE, correlation id và OpenTelemetry, chỉ ra bẫy cardinality.',
  a: `**Tóm tắt:** metrics cho **xu hướng**, logs cho **chi tiết từng sự kiện**, traces cho **hành trình một request xuyên services**. RED đo theo endpoint/service, USE đo theo tài nguyên; correlation id (trace_id) là sợi dây nối log với trace.

### Ba trụ cột + cách nối
- **Trace**: request vào gateway sinh trace id theo chuẩn **W3C TraceContext** (header {{traceparent}}), propagate qua HTTP/Kafka sang mọi service, mỗi service tạo span.
- **Log**: đưa trace/span id vào MDC rồi in ra log - giờ tìm "log của request lỗi" chỉ cần copy trace_id từ UI trace sang log backend.
- **Metric**: đếm RED theo service/endpoint, alert theo SLO.

~~~text
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  ────────── trace id ──────────  ── span id ──  flags
Spring: pattern %X{traceId}/%X{spanId} trong logback.xml
~~~

### RED vs USE
- **RED** (Rate, Errors, Duration) - nhìn theo **yêu cầu**: mỗi endpoint bao nhiêu req/s, lỗi bao nhiêu %, p99 bao lâu. Dùng cho service/API.
- **USE** (Utilization, Saturation, Errors) - nhìn theo **tài nguyên**: thread pool dùng bao nhiêu %, queue đầy chưa, GC pause, CPU. Dùng cho JVM/machine/Kafka.
- Saturation (độ bão hòa) là thứ dự báo outage sớm nhất: queue bắt đầu đầy trước khi error rate nhúc nhích.

### OpenTelemetry trong thực tế
- **OTel Java agent** ({{java -javaagent:opentelemetry-javaagent.jar}}): auto-instrument HTTP, JDBC, Kafka, logback - không sửa code, kết nối OTLP → Collector → Jaeger/Tempo/Grafana.
- Spring Boot 3 dùng **Micrometer Observation** ({{ObservationRegistry}}) làm abstraction; Micrometer bridge sang OTel/Zipkin - code viết một lần, backend đổi lúc nào cũng được.
- **Sampling**: head-based 1% thì miss đúng incident cần xem; tail sampling (giữ 100% lỗi + request chậm) là lựa chọn đúng ở collector.

### Bẫy cardinality
Metric label phải **hữu hạn và dự đoán được**: {{method, status, endpoint}}. Sai:
~~~java
// SAI: user_id/order_id làm label => hàng triệu series, RAM Prometheus nổ, query chậm
registry.counter("orders", "order_id", orderId).increment();
// ĐÚNG: counter theo kết quả, id để vào log/trace
registry.counter("orders_total", "result", result).increment();
~~~
Dấu hiệu: số series tăng không ngừng, query Prometheus lag, container bị OOMKill.

### SLO & alert
- SLI: availability = {{requests tốt / tổng}}, latency = p99 theo endpoint.
- SLO 99,9% ⇒ error budget 43 phút/tháng; alert khi burn budget quá nhanh (burn rate) thay vì alert từng lần lỗi.
- Alarm theo **triệu chứng** khách hàng thấy (5xx, p99) + alarm kỹ thuật (lag Kafka, GC) - đừng chỉ CPU.

> Senior tip: 30 service thì phần lớn value đến từ **nhất quán**: cùng metric name, cùng label, cùng đơn vị độ trễ (ms), cùng header trace. Là kiến trúc sư, việc đầu tiên là viết dict observability, không phải cài tool.`,
  follow: [
    'Trace propagate qua Kafka bằng cách nào?',
    'Vì sao tail sampling tốt hơn head sampling cho incident, và chi phí của nó?',
    'Bạn alert theo error budget burn rate cụ thể ra sao?'
  ],
  tags: ['observability', 'OpenTelemetry', 'RED/USE', 'tracing'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-013',
  topic: 'microservices',
  level: 'lead',
  refs: [{"type": "doc", "title": "Microservices - Martin Fowler", "url": "https://martinfowler.com/articles/microservices.html"}, {"type": "doc", "title": "microservices.io patterns", "url": "https://microservices.io/patterns/"}, {"type": "doc", "title": "Enterprise Integration Patterns", "url": "https://www.enterpriseintegrationpatterns.com/"}],
  q: 'Hai service nội bộ gọi nhau. Bạn chọn OAuth2 client credentials, mTLS hay service mesh? Giải thích trade-off và cách phân quyền từng phía.',
  a: `**Tóm tắt:** **mTLS** trả lời "đây là service nào" (identity ở mức workload), **OAuth2 client credentials** trả lời "service này được làm gì" (quyền theo scope/audience). Cặp đôi này bổ sung: mesh lo transport + identity, app lo authorization + audit; mesh không thay app.

### OAuth2 client credentials
- Service A lấy token từ IdP (Keycloak, Auth0, Cognito, Entra) bằng {{client_id}}/{{client_secret}} (hoặc private_key_jwt an toàn hơn), TTL ngắn (5–15 phút), **cache đến khi hết hạn** rồi refresh - đừng xin token mỗi request.
- Scope/audience gắn theo API: {{scope=orders.read orders.write}}, resource server **bắt buộc kiểm {{audience}}** - token phát cho service X mà service Y vẫn nhận thì scope vô nghĩa.
- Spring Boot 3:
~~~java
http.oauth2Client(o -> o.clientRegistrationRepository(reg))          // phía client xin token
    .oauth2ResourceServer(r -> r.jwt(j -> j.decoder(jwtDecoderWithAudienceValidator()))); // phía server kiểm JWT + audience (JwtClaimValidator trên decoder)
~~~
- Vấn đề: **sprawl của secret** (client_secret nằm trong mọi config service) ⇒ phải rotate định kỳ, lưu ở Vault/KMS. Đại diện ủy quyền thì dùng token exchange (RFC 8693).

### mTLS
- Xác thực **bằng chứng số**: kết nối được TLS hai chiều ⇒ identity lấy từ **certificate của peer**, không phải header ai cũng giả được.
- Workload identity ngắn hạn (SPIFFE/SPIRE cấp cert theo tuổi ~1 giờ, tự rotate) - không còn "cert 2 năm dán vào mọi nơi".
- Tự cài đặt mTLS từng service rất đau (certificate distribution, rotation, SAN) ⇒ đó là lý do mesh ra đời.

### Service mesh (Istio, Linkerd)
- Sidecar (Envoy) bắt mọi kết nối: **auto mTLS**, retry/timeout, LB, telemetry (RED sẵn) - app Java không phải viết lại.
- Trade-off: thêm ~1 hop và vài ms latency, tốn CPU/RAM mỗi pod (sidecar), số thành phần vận hành tăng, debug khó hơn khi packet đi qua proxy.
- Phù hợp: **đa ngôn ngữ/đa team**, nhiều service, muốn mTLS + traffic policy thống nhất. Không phù hợp: 3–5 service, team còn mỏng.

### Phân quyền từng phía (defense in depth)
1. **Network**: deny-by-default east-west (Kubernetes NetworkPolicy, mesh AuthorizationPolicy) - "internal" không có nghĩa là "tin cậy".
2. **Authenticate**: mTLS cho identity workload; JWT cho identity service/user delegation.
3. **Authorize**: scope/role nhỏ nhất, đánh giá ở service (không tin header {{X-User}} từ network).
4. **Audit**: log ai gọi ai, scope nào, kết quả gì - bắt buộc với nghiệp vụ tiền.

### Pitfall production
- Scope {{*}} cho mọi service ⇒ một service bị compromise là toàn bộ hệ thống.
- Secret trong env var / image layer: lộ qua {{/actuator/env}}, crash dump, {{docker history}} ⇒ dùng secret manager đọc runtime.
- Mesh "tự động mTLS" nhưng namespace khác biệt policy ⇒ có chỗ vẫn plaintext âm thầm - phải verify {{istioctl analyze}}/policy.

> Senior tip: secret và cert phải **rotate được mà không redeploy toàn cluster**. Nếu rotation nghĩa là downtime, thì bạn chưa có kế hoạch - hãy đo bằng bài tập rotate thật 1 lần/quý.`,
  follow: [
    'Khi nào chọn private_key_jwt thay vì client_secret_basic?',
    'Mesh xử lý telemetry thế nào so với instrumentation bằng OTel agent trong app?',
    'Bạn enforce least-privilege scope giữa hàng chục service ra sao?'
  ],
  tags: ['OAuth2', 'mTLS', 'service mesh', 'zero trust']
},
{
  id: 'microservices-014',
  topic: 'microservices',
  level: 'senior',
  q: 'Bạn versioning API thế nào để backward compatible? Giải thích expand–contract và consumer-driven contract testing chạy trong CI ra sao.',
  a: `**Tóm tắt:** đừng bump version mỗi release - hãy **chỉ thêm field, không bao giờ phá**; thay đổi breaking thì đi theo vòng **expand → migrate consumers → contract** (deploy 2 phase, cách nhau ≥ 1 release). Consumer-driven contract test bắt break ngay trong CI thay vì trên production.

### Chọn chiến lược versioning
| Cách | Ưu | Nhược |
|---|---|---|
| URI (/v2) | rõ ràng, cache được, route dễ | nhân đôi resource, link rải rác |
| Header ({{X-API-Version}}) | URL sạch, version theo client | khó test, không link được |
| Query (?version=2) | dễ thấy, dễ log | phình URL, cache key phức tạp |
| Media type | chuẩn REST | tooling kém, ít team dùng |

- Khuyến nghị: **URI versioning cho break lớn** (đơn giản, ai cũng hiểu), header/query cho biến thể nhỏ.
- Quy tắc compatible (JSON): thêm field optional OK; **không** đổi tên, đổi kiểu, đổi ý nghĩa, bỏ field, đổi format ngày. Consumer phải ignore field lạ - Spring Boot (Jackson) tắt {{FAIL_ON_UNKNOWN_PROPERTIES}} theo mặc định nên thêm field an toàn; **nhưng** đổi "2024-05-01" sang epoch millis là break ngầm.

### Expand–contract (parallel change)
~~~text
Phase 1 (EXPAND):   ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(16);   ← thêm cột nullable, code CŨ vẫn chạy
                    code MỚI ghi cả status (cũ) và status_v2 (mới), backfill dần
Phase 2:            deploy consumer đọc status_v2; verify bằng metrics đối chiếu 2 cột
Phase 3 (CONTRACT): sau ít nhất 1 release, ALTER TABLE orders DROP COLUMN status
~~~
Luôn deploy theo thứ tự: **producer mở rộng trước → consumer chuyển sang đọc bản mới → producer thu hẹp sau**. Không bao giờ gộp "đổi schema + bắt đầu dùng schema mới" trong cùng một lần deploy: rollback app không rollback được schema.

### Consumer-driven contract testing
- **Pact** (JVM): consumer viết expectation ("tôi cần field X, kiểu Y, và endpoint này trả 201") → sinh pact file → **provider chạy verify pact đó trong CI của provider**. Có Pact Broker cho lưu trữ + **can-i-deploy**: service B v1.2 chỉ deploy được khi provider đã xác nhận contract.
- **Spring Cloud Contract**: provider-driven - provider viết DSL, sinh stub jar cho consumer test offline (không cần môi trường chung).
- Khác với integration test truyền thống: contract test **đúng câu chuyện tiêu dùng thật**, chạy hàng nghìn lần/CI, không cần compose cả hệ thống.

### Khi breaking bắt buộc
- **Sunset header** ({{Sunset: Wed, 01 Jan 2026 00:00:00 GMT}}) + {{Deprecation: true}}, thông báo sớm 6–12 tháng.
- Đo usage của version cũ (metric theo version header/URL) - ngừng khi số liệu về 0, không theo cảm tính.
- Chiến lược "N-1": chỉ hỗ trợ 2 version cùng lúc.

> Senior tip: phần lớn break đến từ **đổi định dạng**, không phải đổi schema. Thêm contract test cho định dạng ngày/giới tính/currency rẻ hơn 100 lần fix production lỗi parse.`,
  follow: [
    'Khi nào bạn tạo /v2 thay vì chỉ thêm field?',
    'Pact và Spring Cloud Contract chọn cái nào, vì sao?',
    'Làm sao ngừng hỗ trợ API version cũ mà không làm hỏng client đang ngủ yên?'
  ],
  tags: ['API versioning', 'backward compatibility', 'contract testing', 'Pact'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-015',
  topic: 'microservices',
  level: 'lead',
  refs: [{"type": "doc", "title": "Microservices - Martin Fowler", "url": "https://martinfowler.com/articles/microservices.html"}, {"type": "doc", "title": "microservices.io patterns", "url": "https://microservices.io/patterns/"}, {"type": "doc", "title": "Enterprise Integration Patterns", "url": "https://www.enterpriseintegrationpatterns.com/"}],
  q: 'Khi nào áp CQRS và khi nào thêm cả event sourcing? Liệt kê lợi ích, chi phí thật và những cái bẫy gặp phải trên production.',
  a: `**Tóm tắt:** **CQRS** tách mô hình ghi và mô hình đọc (có thể chỉ là 2 bảng, 2 service, 2 database); **Event sourcing** lưu **chuỗi sự kiện** làm nguồn sự thật thay vì state hiện tại. CQRS không đòi hỏi ES; ES hầu như luôn đi kèm CQRS. Cả hai đều là **trade-off complexity lấy query/scale/audit**, không phải mặc định đúng.

### CQRS - vì sao, khi nào
- Khi model ghi (normalized, nhiều FK) phục vụ transaction tốt nhưng **query nghiệp vụ lại cần dạng khác** (dashboard, tìm kiếm, join xuyên aggregate).
- Lợi ích: read model phẳng (denormalize) query O(1); scale đọc độc lập (read replica/Elasticsearch); mỗi bên tối ưu riêng.
- Chi phí thật:
  - **Eventual consistency**: user tạo xong rồi list ngay có thể chưa thấy ⇒ phải UI báo trạng thái, hoặc read-your-write qua route thẳng sang primary.
  - Hai model ⇒ code map, migration, bug "ghi xong mà không hiện".
  - Không cần thì đừng: CRUD 20 endpoint mà thêm CQRS = thêm 20 thứ phải sync.

### Event sourcing - nguồn sự thật là log sự kiện
~~~text
order-123 stream: [OrderCreated(v1)] [ItemAdded] [PaymentTaken(v2)] [Shipped]
                                      snapshot ──► state hiện tại = fold các event
~~~
- **Lợi ích**: audit trail đầy đủ (ngành tài chính, y tế - hỏi "vì sao số tiền này?" trả lời bằng log, không phải trigger log đang bị tắt); **temporal query** ("trạng thái lúc 10h thứ Ba" - replay tới thời điểm đó); projection tái tạo bất kỳ lúc nào (rebuild Elastic từ zero); decoupling: thêm consumer mới không đụng producer.
- **Chi phí & bẫy production**:
  - **Evolution event**: không được sửa event cũ; phải **upcast** (event v1 đọc bằng logic v2) khi đọc stream cũ.
  - Replay cả stream mỗi request là **O(n)** ⇒ cần **snapshot** định kỳ (mỗi 50–100 event) và tool rebuild projection.
  - "Right to be forgotten": phải **anonymize event** thay vì xóa (xóa làm hỏng tính toàn vẹn stream).
  - Difficult debugging: state ẩn trong 50 event, không ai thấy "giá trị hiện tại là gì" - bắt buộc có tool xem stream.
  - Storage phình: append-only + snapshot; partition theo aggregateId để stream không dài vô hạn.

### Khi nào chọn
| Tình huống | Gợi ý |
|---|---|
| CRUD nội bộ, đọc ghi cân bằng | **không** - repository thường là đủ |
| Query phức tạp, đọc nhiều gấp 50 lần ghi | CQRS (read model riêng) |
| Audit bắt buộc, cần replay/time-travel, domain event-rich (giao dịch, trò chơi) | ES + CQRS |
| Đơn giản hóa data model cho team mới | đừng ES - trả bằng onboarding 3 tháng |

- Bắt đầu bằng **CQRS-lite**: ghi qua service A, đọc từ read replica/caching; thêm event store chỉ khi bạn thật sự cần history/replay.

> Senior tip: mỗi lần ai đó đề nghị event sourcing, hãy hỏi "ai sẽ xây projection rebuild tool và ai oncall lúc projection lệch?" - nếu không có câu trả lời, đó là nợ kỹ thuật được bọc bằng buzzword.`,
  follow: [
    'Snapshot hỏng thì xử lý thế nào? Ai chịu trách nhiệm version snapshot?',
    'CQRS không dùng ES thì đồng bộ read model bằng cách gì?',
    'Upcasting event hoạt động cụ thể ra sao trong code Java?'
  ],
  tags: ['CQRS', 'event sourcing', 'read model', 'trade-off']
},
{
  id: 'microservices-016',
  topic: 'microservices',
  level: 'senior',
  q: 'So sánh blue-green, canary và feature flag. Với thay đổi schema database, làm sao rollback được an toàn? Giải thích quy tắc expand–contract khi migrate.',
  a: `**Tóm tắt:** blue-green **đổi traffic một phát** (rollback = đổi lại), canary **rót traffic từng phần** theo SLO (rollback = dừng rót), feature flag **tách deploy khỏi release** (bật/tắt runtime). Nhưng **rollback app không rollback schema** - nên migration phải được thiết kế để **không cần rollback**.

### Ba chiến lược
| | Blue-green | Canary | Feature flag |
|---|---|---|---|
| Cách | 2 môi trường, flip LB | 1% → 5% → 50% → 100% | deploy "dark", bật/tắt theo flag |
| Rollback | **ngay lập tức** (flip về) | dừng rót traffic | **tắt flag**, không redeploy |
| Theo dõi | so sánh trước/sau | SLO/error budget theo %traffic | theo %user thấy flag |
| Chi phí | nhân đôi tài nguyên | cần metric tốt + routing | cần hệ thống flag + kiểm thử matrix |
| Rủi ro | stateful/WS kết nối dính | sticky session, user state | **flag debt** - cờ mọc không ai dọn |

- Canary là lựa chọn mạnh nhất khi có **SLI/SLO đáng tin** (error rate, latency p99 theo phiên bản) + auto-promote/rollback (Argo Rollouts, Flagger, ECS blue/green với CloudWatch alarm).
- Feature flag: tách "đã deploy" khỏi "đã phát hành"; hợp nghiệm A/B, dark launch (gọi service mới song song, so kết quả - **shadow traffic**). Bẫy: test matrix ×2, flag vĩnh viễn, code nhánh khó đọc ⇒ đặt hạn dọn cờ trong ticket.

### Rollback với migration DB - câu hỏi thật
~~~text
deploy v2 (migration + code) ── lỗi ──► rollback về v1
        └─ code quay lại OK, nhưng schema đã DROP/đổi kiểu ⇒ v1 CHẾT
~~~
Quy tắc: **migration phải backward compatible với N-1 version của app.** Đổi schema đi theo **expand–contract**, cách nhau ít nhất một release:

~~~sql
-- PHASE 1 (EXPAND) - deploy v1.1: thêm, không phá
ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(16);   -- nullable, v1 cũ vẫn chạy bình thường
-- PHASE 2 - code ghi cả hai cột, backfill nền (chunked, tránh transaction dài giữ lock)
UPDATE orders SET status_v2 = status WHERE status_v2 IS NULL;
-- PHASE 3 (CONTRACT) - chỉ sau khi chắc 100% không còn ai đọc cột cũ
ALTER TABLE orders DROP COLUMN status;
~~~
- Không sửa migration đã chạy (Flyway/Liquibase phát hiện checksum đổi và fail khi validate/migrate - điều đó tốt); thay vào thêm changeset mới.
- DDL nặng: **không lock dài** - Postgres {{CREATE INDEX CONCURRENTLY}}, MySQL big table dùng gh-ost/pt-online-schema-change.
- Rollback được **code**, migration thì **đi tới trước** (forward fix) - vì thế Phase 1 phải vô hại với version cũ.

> Senior tip: mỗi lần review migration, hãy tự hỏi "nếu app vừa deploy bị revert ngay 30 giây sau, hệ thống còn chạy không?" Câu trả lời không thì migration chưa an toàn, bất kể có backup.`,
  follow: [
    'Shadow traffic so sánh response của v1 và v2 thế nào mà không side effect?',
    'Flag bật cho 1% user nhưng migration đã chạy cho 100% data thì vấn đề gì?',
    'Bạn kiểm tra migration backward compatible trong CI bằng cách nào?'
  ],
  tags: ['blue-green', 'canary', 'feature flag', 'database migration'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-017',
  topic: 'microservices',
  level: 'lead',
  refs: [{"type": "doc", "title": "Microservices - Martin Fowler", "url": "https://martinfowler.com/articles/microservices.html"}, {"type": "doc", "title": "microservices.io patterns", "url": "https://microservices.io/patterns/"}, {"type": "doc", "title": "Enterprise Integration Patterns", "url": "https://www.enterpriseintegrationpatterns.com/"}],
  q: 'Bạn dẫn dắt chuyển một monolith 500k dòng sang microservices mà không downtime. Kế hoạch strangler fig từng bước, gồm cả migration data và anti-corruption layer.',
  a: `**Tóm tắt:** **Strangler fig** = đặt một facade/proxy trước monolith, từng bước "bao vây" rồi nuốt chửng các module cũ bằng service mới, traffic chuyển dần qua feature flag/canary. Mục tiêu không phải "viết lại cho sạch" mà là **giảm dần module cũ trong khi sản phẩm vẫn chạy**.

### Kế hoạch từng bước
1. **Đo & phủ trước khi đụng**: distributed tracing + test tích hợp cho đúng use case sẽ tách. Monolith không có test = tách là đánh bạc.
2. **Chọn seam đầu tiên** theo tiêu chí: boundary rõ, thay đổi độc lập, **không cần join phức tạp** với phần còn lại, team chịu trách nhiệm. Ví dụ: module "Catalog" hoặc "Notification" - đừng bắt đầu bằng "Thanh toán".
3. **Đặt facade**: gateway/front-proxy route theo path/percentage:
~~~text
/api/catalog/*  ──► catalog-service   (mới, traffic 5% → 100%)
              └──► monolith          (cũ, còn lại)
~~~
4. **Anti-corruption layer**: service mới không dùng model/DTO của monolith. Dịch sang domain model của riêng nó - nếu không, "mã độc" của legacy lan sang service mới và bạn chỉ tách địa chỉ chứ không tách ranh giới.
5. **Migration data** (đoạn khó nhất):
   - **CDC (Debezium)** từ DB monolith sang DB service mới + **dual-run**: đọc cả hai, so sánh (reconciliation job), khác là bug.
   - Ghi: chỉ **một nguồn sự thật** tại một thời điểm - hoặc ghi qua service mới (monolith đọc lại qua API), hoặc ghi ở monolith và CDC sang service (chưa outbox thì thêm outbox trước).
   - Shadow traffic: mirror request sang service mới, so response, **không** ghi side effect.
6. **Chuyển traffic** bằng canary + SLO; rollback = flip ngược, data đã đồng bộ nên không mất.
7. **Dọn thật sự**: xoá module cũ, xoá bảng cũ, **gỡ route, gỡ code**. Bước này hay bị bỏ qua nhất.

### Dấu hiệu thất bại
- Code chỉ **mọc thêm** (monolith + service mới song song vĩnh viễn) ⇒ bạn vừa xây "monolith thứ hai".
- glue/integration layer phình to và không ai dọn.
- Transaction giờ xuyên service mà chưa có saga/outbox - strangler kiểu này **tạo distributed monolith trước khi tách xong**.
- Đội cũ vẫn commit vào monolith song song ⇒ không ai thật sự sở hữu service mới.

### Khi nào KHÔNG nên strangler
- Domain sai từ gốc, phải thiết kế lại hoàn toàn và team nhỏ ⇒ cân nhắc rewrite trong sản phẩm mới (nhưng vẫn cần strangler để song song traffic).
- Monolith đã nhỏ, module rõ ⇒ chỉ cần tách 1–2 chỗ.

> Senior tip: đo tiến độ strangler bằng 2 chỉ số: **% traffic đi qua service mới** và **số module/table đã xoá khỏi monolith**. Không có chỉ số thứ hai thì đó không phải strangler, đó là copy-paste sang microservices.`,
  follow: [
    'Nếu monolith không có outbox, bạn ghi hai phía lúc dual-write an toàn thế nào?',
    'Reconciliation job so sánh data hai phía cụ thể chạy thế nào?',
    'Khi nào bạn chọn branch by abstraction thay vì đặt proxy phía gateway?'
  ],
  tags: ['strangler fig', 'migration', 'anti-corruption layer', 'legacy']
},
{
  id: 'microservices-018',
  topic: 'microservices',
  level: 'mid',
  q: 'Cấu hình và secret nên để đâu theo 12-factor app? So sánh Spring Cloud Config, Kubernetes ConfigMap/AppConfig và Vault/AWS Secrets Manager, chỉ ra bẫy secret rò rỉ.',
  a: `**Tóm tắt:** 12-factor: **config tách khỏi code**, thay đổi giữa môi trường bằng **environment** (build once, deploy everywhere); **secret không nằm trong git hay image** - đọc từ secret manager lúc runtime, mã hóa, audit và rotate được.

### 12-factor liên quan đến config
- **III. Config**: URLs, ports, credentials là environment, không hard-code trong codebase - cùng một artifact chạy dev/staging/prod.
- **VI. Processes**: stateless, không lưu config runtime vào instance.
- **IV. Backing services**: thứ gì cũng là "một service khác" (DB, queue, mail) ⇒ đổi env là đổi backend.
- **XI. Logs**: ghi ra stdout, đừng ghi file vì "không phải biết đường dẫn" - dạng phụ thuộc vào môi trường.

### Lựa chọn nơi chứa config
| | Cách hoạt động | Ưu | Nhược |
|---|---|---|---|
| **Spring Cloud Config** | git-backed server, app {{spring.config.import=configserver:...}} | version history, PR review, push notification refresh | thêm service phải sống, git = single point |
| **K8s ConfigMap** | mount file/env vào pod | native, không thêm thành phần | không versioned, secrets thì nên tách, sửa = restart (hoặc reload sidecar) |
| **AWS AppConfig** | deploy config + **feature flag** có gradual rollout, %,alarm theo metric | an toàn cho flag, rollout có kiểm soát | khoá theo AWS, cần instrument app |
| **Vault / AWS Secrets Manager** | secret mã hóa, audit, **dynamic secrets** (DB user tự tạo, TTL) | rotate được, có audit trail | latency đọc secret, cần cache hợp lý |

Từ Spring Cloud 2020.0 (và Spring Boot 3), client không còn dùng {{bootstrap.yml}} theo mặc định ({{@EnableConfigServer}} chỉ dành cho phía server) - dùng import:

~~~yaml
spring:
  config:
    import: "optional:configserver:http://config-server:8888"
  application:
    name: order-service        # server chọn profile/label theo cái này
~~~

### Bẫy secret rò rỉ
- **Git**: secret trong repo = lộ cho mọi ai có quyền đọc, và cả trong history sau khi "xoá". Nếu đã lỡ: **rotate key** là biện pháp duy nhất, xóa file không đủ.
- **Actuator/dump**: {{/actuator/env}}, {{/actuator/configprops}}, heap dump, log {{DataSource password: ***}} nhưng vẫn còn ở chỗ khác - Boot 3 mặc định che value ở /env (đừng bật {{show-values=ALWAYS}}), và vẫn phải chặn các endpoint này ngoài internal network.
- **Image layer**: {{docker history}} đọc được ENV ⇒ secret để ở secret manager, đọc lúc boot.
- **Đọc secret mỗi request**: AWS Secrets Manager có rate limit ⇒ **cache theo TTL** (ví dụ 5–15 phút) và refresh nền, nếu không burst traffic sẽ bị throttle đúng lúc căng thẳng.
- **.env local** phải gitignore; profile {{application-local.yml}} dành cho dev, không deploy lên.

### Cách làm đúng
1. Config "sạch" (port, feature, URL) → ConfigMap/Config server, có version.
2. Secret (password, key) → Vault/Secrets Manager/KMS, mã hóa at rest, **audit ai đọc**, TTL/dynamic credentials.
3. **Rotation tự động** (30–90 ngày) và test rotate như test deploy.
4. Khác biệt môi trường bằng **env/secret reference**, không phải bằng 3 nhánh code.

> Senior tip: flag cấu hình (timeout, tỷ lệ %) nên đọc được lúc runtime - nếu đổi timeout cần redeploy thì bạn sẽ không bao giờ tune nó khi oncall lúc 2h sáng.`,
  follow: [
    'Refresh lúc runtime bằng {{@RefreshScope}} có rủi ro gì với bean đang giữ kết nối?',
    'Dynamic secret của Vault khác gì secret static về mặt rotate?',
    'Bạn phát hiện secret bị commit vào git bằng CI như thế nào?'
  ],
  tags: ['12-factor', 'configuration', 'secrets management', 'Spring Cloud Config']
},
{
  id: 'microservices-019',
  topic: 'microservices',
  level: 'senior',
  q: 'Một topic Kafka cần quyết định số partition. Bạn chọn dựa trên tiêu chí gì, và giải thích consumer rebalance: cooperative sticky assignor, {{max.poll.interval.ms}} và static membership giải quyết vấn đề gì?',
  a: `**Tóm tắt:** số partition = max(consumer count dự kiến, throughput mục tiêu / throughput một consumer). Rebalance là nguyên nhân số 1 làm lag tăng vọt: **cooperative sticky** chỉ chuyển partition cần thiết, **static membership** ({{group.instance.id}}) tránh rebalance khi restart pod, **{{max.poll.interval.ms}}** phát hiện consumer "chết lặng" do xử lý quá lâu.
 
### Chọn số partition
 - **Độ song song**: không thể có nhiều consumer hơn partition. Nếu dự kiến scale tới 32 consumer ⇒ partition ≥ 32.
 - **Throughput**: một consumer xử lý được ~X msg/s (đo thực tế). Partition ≥ desired_throughput / X.
 - **Ordering**: partition = bottleneck nếu cần ordering toàn cục. Càng nhiều partition càng mất ordering.
 - **Quá nhiều partition**: metadata lớn, controller mất thời gian elect leader, file handle nhiều, replication chậm.
 - Thumb rule: bắt đầu 2–3× số consumer hiện tại, tăng dần (partition chỉ tăng, không giảm).
 
### Consumer rebalance - điều làm lag nhảy
 - **Eager (cũ)**: consumer join/leave ⇒ **nhả HẾT partition** → chia lại → dừng xử lý vài giây. Deploy rolling = lag dồn.
 - **Cooperative Sticky** ({{partition.assignment.strategy=CooperativeStickyAssignor}}): chỉ **revoke** partition thực sự cần chuyển, các partition còn lại **giữ nguyên** ⇒ downtime gần 0. Yêu cầu Kafka 2.4+, client 2.4+.
 - **Static membership**: set {{group.instance.id}} duy nhất cho mỗi pod. Consumer restart trong {{session.timeout.ms}} (mặc định 45s) thì **không coi là leave** ⇒ không rebalance. Hợp với StatefulSet (tên pod ổn định); thường tăng {{session.timeout.ms}} cho đủ thời gian restart.
 - **{{max.poll.interval.ms}}** (mặc định 5 phút): nếu xử lý một batch lâu hơn ngưỡng này ⇒ consumer bị coi là **treo** ⇒ coordinator đá ra khỏi group ⇒ rebalance oan. Tăng lên (VD 15–30 phút) cho batch nặng, **song song set {{max.poll.records}}** nhỏ hơn để poll thường xuyên hơn.
 
 ~~~yaml
 spring:
   kafka:
     consumer:
       group-id: order-service
       properties:
         partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
         max.poll.interval.ms: 1800000      # 30 phút cho job nặng
         max.poll.records: 100              # poll ít hơn, xử lý xong nhanh hơn
         group.instance.id: \${HOSTNAME}     # static membership (StatefulSet: tên pod ổn định)
 ~~~
 
### Pitfall production
 - Đổi thẳng từ eager (Range) sang {{CooperativeStickyAssignor}} bằng một lần rolling deploy ⇒ trong lúc chuyển, các consumer không có assignor chung ⇒ lỗi {{InconsistentGroupProtocolException}}. Phải rolling **2 bước**: lần 1 khai báo cả {{[CooperativeStickyAssignor, RangeAssignor]}}, lần 2 bỏ {{RangeAssignor}}.
 - Static membership với **Deployment**: pod mới có HOSTNAME ngẫu nhiên ⇒ {{group.instance.id}} mới ⇒ vẫn rebalance (member cũ chỉ bị loại sau {{session.timeout.ms}}). Static membership phát huy tác dụng với **StatefulSet** (tên ổn định {{order-0}}, {{order-1}}). Nếu hai process cùng {{group.instance.id}} chạy đồng thời, member join sau sẽ **fence** member cũ ({{FencedInstanceIdException}}).
 - Static membership + {{session.timeout.ms}} lớn ⇒ pod chết thật thì partition của nó **đứng yên** cho tới khi hết timeout.
 - {{max.poll.interval.ms}} quá lớn ⇒ consumer **treo** thật (deadlock, gọi ra ngoài không có timeout) mà heartbeat thread vẫn chạy ⇒ coordinator không phát hiện kịp ⇒ partition kẹt lâu hơn. (Process chết hẳn thì do {{session.timeout.ms}} phát hiện.)
 
 > Senior tip: monitor **rebalance rate** (metric {{rebalance-total}} / phút). Healthy = 0 rebalance giữa các deploy. Có rebalance = hoặc deploy sai, hoặc max.poll.interval.ms quá thấp, hoặc consumer xử lý kẹt.`,
  follow: [
    'Tăng partition cho topic đang chạy: key mapping thay đổi như thế nào, bạn xử lý ordering ra sao?',
    'Cooperative sticky hoạt động thế nào khi consumer join/leave đồng thời?',
    'Static membership + K8s rolling update: preStop delay nên đặt bao nhiêu so với session.timeout.ms?'
  ],
  tags: ['Kafka', 'partition', 'rebalance', 'cooperative sticky', 'static membership'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-020',
  topic: 'microservices',
  level: 'senior',
  q: 'Spring Kafka hỗ trợ blocking retry ({{DefaultErrorHandler}} + BackOff) và non-blocking retry ({{@RetryableTopic}}). Hai chế độ khác nhau thế nào, bạn cấu hình DLT ra sao, và retry ảnh hưởng ordering thế nào?',
  a: `**Tóm tắt:** **Blocking retry** = container gọi lại listener ngay trên partition đó (có backoff) qua {{DefaultErrorHandler}} – đơn giản, **giữ ordering** nhưng **kẹt partition**. **Non-blocking retry** = {{@RetryableTopic}} đẩy message lỗi sang các topic {{-retry}} riêng, consumer chính tiếp tục xử lý message sau – **không kẹt partition** nhưng **mất ordering** theo key. Hết lượt retry ⇒ message vào DLT ({{-dlt}}).

### Blocking retry ({{DefaultErrorHandler}})
~~~java
@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template); // hết retry -> topic.DLT
    var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 2)); // 1 lần đầu + 2 retry
    handler.addNotRetryableExceptions(BusinessException.class); // lỗi nghiệp vụ -> DLT ngay
    return handler;
}
~~~
- Listener lỗi ⇒ error handler **seek lại** offset đó và gọi lại sau backoff; giữ tổng backoff ngắn so với {{max.poll.interval.ms}} để không bị coi là consumer treo.
- Ưu: code đơn giản, **ordering tự nhiên** (message sau không chạy trước message đang retry).
- Nhược: partition đứng yên trong lúc retry; retry lâu (3 lần × 30s) = partition dừng 90s ⇒ lag tăng.
- Hợp khi retry ngắn (vài giây tổng) hoặc **bắt buộc giữ thứ tự** theo key.

### Non-blocking retry ({{@RetryableTopic}})
~~~java
@RetryableTopic(
    attempts = "4",                       // tổng số lần thử, gồm lần đầu
    backoff = @Backoff(delay = 2_000, multiplier = 2, maxDelay = 60_000),
    autoCreateTopics = "true",
    topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE,
    exclude = { BusinessException.class } // lỗi nghiệp vụ -> DLT ngay
)
@KafkaListener(topics = "order.created", groupId = "order-service")
public void handle(OrderCreatedEvent evt) { ... }

@DltHandler
public void dlt(OrderCreatedEvent evt) { /* log + alert */ }
~~~
- Lỗi ⇒ message được publish sang {{order.created-retry-0}}, {{-retry-1}}… (mặc định hậu tố theo delay, ví dụ {{-retry-2000}}), kèm header như {{retry_topic-attempts}}, {{retry_topic-backoff-timestamp}}.
- **Delay thực hiện thế nào**: listener của topic retry thấy message chưa tới hạn ⇒ Spring Kafka **pause partition** của topic retry đó (KafkaConsumerBackoffManager) rồi resume khi đến giờ. Không có Kafka Streams hay "timer consumer", và message **không** quay lại topic gốc – chính listener method được gọi lại từ topic retry.
- Listener chính **tiếp tục poll** message sau ⇒ partition gốc không kẹt.
- Một số exception "fatal" (ví dụ {{DeserializationException}}, {{MessageConversionException}}, {{ClassCastException}}) mặc định đi thẳng DLT, không retry.

### DLT (Dead Letter Topic)
- Hết {{attempts}} ⇒ message vào {{order.created-dlt}} (non-blocking) hoặc {{order.created.DLT}} ({{DeadLetterPublishingRecoverer}} mặc định).
- Header {{kafka_dlt-exception-fqcn}}, {{kafka_dlt-exception-message}}, {{kafka_dlt-exception-stacktrace}}, {{kafka_dlt-original-topic}}/{{-partition}}/{{-offset}} giúp debug/replay.
- Luôn **alert theo số message trong DLT** – DLT tăng = bug đang chờ fix.
- Replay: sửa code/payload rồi đẩy lại topic gốc; consumer phải idempotent.

### Ordering khi retry
- **Non-blocking retry phá ordering**: A (key=order-1) lỗi và sang topic retry, B (cùng key, đến sau) vẫn được xử lý ngay trên topic gốc ⇒ B chạy **trước** A.
- Cần giữ thứ tự theo key ⇒ dùng **blocking retry**, hoặc thiết kế consumer chịu được đảo thứ tự (kiểm tra version/state, bỏ qua event cũ hơn state hiện tại).
- Blocking retry giữ thứ tự nhưng mọi key khác cùng partition cũng phải chờ ⇒ chỉ chấp nhận được khi retry ngắn.

> Senior tip: phân loại lỗi trước khi chọn chế độ: lỗi transient (timeout, 503) ⇒ retry; lỗi nghiệp vụ/validation ⇒ {{exclude}}/{{addNotRetryableExceptions}} để vào DLT ngay, đừng retry 5 lần. Non-blocking retry thêm topic + consumer phải monitor lag riêng cho từng topic {{-retry-*}}; với event cần thứ tự (state change của cùng một đơn hàng) hãy cân nhắc kỹ trước khi bật.`,
  follow: [
    'Non-blocking retry pause partition của topic retry để chờ backoff – bạn monitor lag của các topic -retry ra sao?',
    'Khi nào nên dùng blocking retry thay vì non-blocking?',
    'Consumer làm sao chịu được việc event cùng key đến sai thứ tự sau retry?'
  ],
  tags: ['Kafka', 'Spring Kafka', '@RetryableTopic', 'DLQ', 'non-blocking retry'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-021',
  topic: 'microservices',
  level: 'senior',
  q: 'Team đang dùng JSON cho event Kafka, gặp lỗi khi thêm field mới mà consumer cũ không đọc được. Giải thích Schema Registry (Avro/Protobuf), backward vs forward compatibility, và quy tắc evolve schema an toàn.',
  a: `**Tóm tắt:** JSON không có contract ⇒ producer thêm field, consumer cũ crash (missing field) hoặc producer xoá field, consumer cũ đọc null sai ngữ nghĩa. **Schema Registry** lưu schema theo version, kiểm tra compatibility trước khi register. **Backward compatibility** (mặc định): consumer dùng schema mới đọc được data cũ - **consumer deploy trước**; **Forward compatibility**: consumer dùng schema cũ đọc được data ghi bằng schema mới - **producer deploy trước**.
 
### Vì sao JSON không đủ
 - Không validate tại produce time ⇒ data "rác" vào topic, consumer mới phát hiện khi đã late.
 - Không có evolution rule ⇒ team thêm {{phone}} type string, một team khác thêm {{phone}} type object ⇒ conflict im lặng.
 - Consumer phải defensive code (nullable mọi chỗ) ⇒ code nhánh, dễ bug.
 
### Avro/Protobuf + Schema Registry
 - **Avro**: schema JSON, binary compact, hỗ trợ union/nullable, logic compatibility mạnh. Dùng Confluent Schema Registry (REST API), client serializer tự fetch cache schema ID (magic byte + 4 bytes ID).
 - **Protobuf**: {{.proto}} file, codegen typed cho Java/Go/Python, backward/forward compatibility qua field number (không đổi number, không đổi type, field xoá thì {{reserved}} number). proto3 bỏ {{required}}, mọi field đều tuỳ chọn. Confluent Schema Registry hỗ trợ Protobuf và JSON Schema từ Confluent Platform 5.5.
 
 ~~~java
 // Avro serializer config
 props.put("value.serializer", io.confluent.kafka.serializers.KafkaAvroSerializer.class);
 props.put("schema.registry.url", "http://sr:8081");
 props.put("auto.register.schemas", "false");  // CI register, production chỉ dùng
 ~~~
 
### Compatibility modes (Confluent)
 | Mode | Ai deploy trước | Cho phép gì | Cấm gì |
 |---|---|---|---|
 | **BACKWARD** (default) | **Consumer** | Xoá field, thêm field **có default** | Thêm field không default, đổi type không tương thích, đổi tên (không alias) |
 | FORWARD | **Producer** | Thêm field, xoá field **có default** | Xoá field không default, đổi type không tương thích |
 | FULL | Thứ tự nào cũng được | Chỉ thêm/xoá field **có default** (thoả cả 2 điều kiện) | Mọi thứ mà BACKWARD hoặc FORWARD cấm |
 | NONE | - | Bất kỳ | Không check (danger) |

Các mode {{*_TRANSITIVE}} kiểm tra với **mọi** version cũ, không chỉ version liền trước.
 
 **Quy tắc vàng**: **chỉ thêm field optional/default**, không bao giờ xoá/đổi type/đổi tên. Muốn "xoá" ⇒ thêm field mới, deprecated cũ, dọn sau N release.
 
### Deployment order theo compatibility
 - **BACKWARD** (phổ biến nhất): Consumer v2 (schema mới) deploy trước → Producer v2 deploy sau. Consumer v2 vẫn đọc được data v1 còn trong topic (field mới lấy default).
 - **FORWARD**: Producer v2 deploy trước → Consumer v2 deploy sau. Consumer v1 vẫn đọc được data v2 (bỏ qua field lạ, field bị xoá lấy default theo schema của nó).
 - Producer và consumer deploy độc lập, không kiểm soát thứ tự ⇒ chọn **FULL** (hoặc FULL_TRANSITIVE).
 
### Migration breaking change
 1. Register schema mới với compatibility=NONE (hoặc tắt check tạm thời).
 2. Deploy consumer đọc **cả hai** (union type / upcast logic).
 3. Deploy producer ghi schema mới.
 4. Sau khi không còn data cũ ⇒ bật lại compatibility, dọn code đọc cũ.
 
 > Senior tip: CI/CD **bắt buộc** chạy compatibility check (ví dụ goal {{test-compatibility}} của {{kafka-schema-registry-maven-plugin}}, hoặc gọi REST {{/compatibility/subjects/.../versions/latest}}) trước khi merge. Một PR thay đổi {{.avsc}}/.proto mà fail check = không merge. Không có exception - production không phải nơi test schema.`,
  follow: [
    'Avro union type xử lý nullable như thế nào so với Protobuf optional?',
    'Khi nào chọn FORWARD thay vì BACKWARD?',
    'Schema Registry HA thế nào, producer fetch schema ID cache như thế nào?'
  ],
  tags: ['Schema Registry', 'Avro', 'Protobuf', 'backward compatibility', 'forward compatibility'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-022',
  topic: 'microservices',
  level: 'senior',
  q: 'So sánh Inbox pattern và Outbox pattern để đạt exactly-once effect khi consume event. Bạn implement idempotent consumer bằng bảng processed_message như thế nào?',
  a: `**Tóm tắt:** **Outbox** giải quyết **ghi DB + publish event** atomic ở **producer**; **Inbox** giải quyết **consume event + ghi DB** atomic ở **consumer**. Cả hai cùng mục tiêu: side effect chỉ xảy ra đúng 1 lần. Inbox dùng bảng {{processed_message(msg_id PK, processed_at)}} insert trong cùng transaction với business write - trùng message ⇒ PK conflict ⇒ bỏ qua.
 
### Outbox vs Inbox - hai đầu của đường ống
 | | Outbox (Producer) | Inbox (Consumer) |
 |---|---|---|
 | Vấn đề | Ghi DB xong, publish event fail/lost | Consume event, ghi DB fail/lost, hoặc xử lý trùng |
 | Giải pháp | Ghi business row + outbox row **cùng 1 transaction** | Insert processed_msg + business row **cùng 1 transaction** |
 | Relay | Polling / CDC (Debezium) đẩy ra broker | Không cần relay - consumer tự dedup |
 | At-least-once → Exactly-once effect | Producer idempotent + consumer idempotent | **Consumer idempotent là bắt buộc** |
 
### Inbox pattern implement
 ~~~sql
 CREATE TABLE processed_message (
     msg_id VARCHAR(255) PRIMARY KEY,   -- Kafka offset/partition hoặc event ID
     processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
 );
 
 CREATE TABLE order_payment (
     order_id VARCHAR(64) PRIMARY KEY,
     amount DECIMAL(19,2),
     status VARCHAR(20)
 );
 ~~~
 
 ~~~java
 @Transactional
 public void handlePayment(PaymentEvent evt) {
     // 1. Thử insert processed_msg - nếu trùng key ⇒ exception ⇒ bỏ qua (MySQL; PostgreSQL xem pitfall)
     try {
         jdbc.update("INSERT INTO processed_message(msg_id) VALUES (?)", evt.msgId());
     } catch (DuplicateKeyException e) {
         log.info("Duplicate event ignored: {}", evt.msgId());
         return;  // đã xử lý, idempotent
     }
 
     // 2. Ghi business logic (cùng transaction)
     jdbc.update(
         "INSERT INTO order_payment(order_id, amount, status) VALUES (?, ?, 'PAID') " +
         "ON DUPLICATE KEY UPDATE amount=amount, status='PAID'",
         evt.orderId(), evt.amount()
     );
 }
 ~~~
 - **msg_id**: dùng {{topic-partition-offset}} (unique trong Kafka) hoặc {{eventId}} từ payload (nếu producer đảm bảo unique).
 - **Cùng transaction** là yêu cầu tuyệt đối: tách 2 transaction ⇒ crash giữa hai bước = duplicate hoặc lost.
 - **Natural key upsert** (INSERT ... ON DUPLICATE KEY UPDATE) thay thế processed_message table nếu business key là unique (VD: {{order_id}} unique trong payment) - giảm 1 table, 1 insert.
 
### So sánh với Outbox
 - Outbox **bắt buộc** khi service vừa ghi DB vừa phải publish event: không có transaction chung giữa DB và broker (dual write) ⇒ ghi event vào bảng outbox trong cùng transaction rồi relay sau.
 - Inbox **bắt buộc** khi consumer không kiểm soát được producer (3rd party, legacy) - producer không có outbox.
 - Nếu **cả hai đầu** bạn kiểm soát: Outbox + Inbox = end-to-end exactly-once effect (dù broker chỉ at-least-once).
 
### Pitfall
 - processed_message table **phình vô hạn** ⇒ job dọn row cũ (TTL 7–30 ngày) + partition theo ngày.
 - Nếu msg_id là {{topic-partition-offset}}: chỉ chặn được **consumer đọc lại** cùng một record; producer gửi trùng (retry không idempotent, outbox relay publish 2 lần) tạo record **offset mới** ⇒ lọt. Mirror/khôi phục topic cũng đổi offset ⇒ dùng event ID do producer sinh trong payload/header an toàn hơn.
 - PostgreSQL: lỗi duplicate key làm **cả transaction bị abort** – catch exception rồi chạy tiếp câu SQL khác sẽ lỗi "current transaction is aborted". Dùng {{INSERT ... ON CONFLICT (msg_id) DO NOTHING}} và kiểm tra số dòng ảnh hưởng = 0 thay vì bắt exception.
 - **Transaction timeout**: insert processed_msg + business write phải nhanh; tránh call API ngoài trong transaction.
 
 > Senior tip: Inbox table là "bảo hiểm" rẻ - luôn thêm khi consume event từ team khác. Chi phí 1 INSERT + 1 index lookup, đổi lấy an tâm không double-charge.`,
  follow: [
    'msg_id dùng Kafka offset hay event ID từ payload, ưu nhược điểm nào?',
    'Inbox pattern xử lý transaction timeout (DB lock) khi volume cao ra sao?',
    'Khi nào natural key upsert thay thế processed_message table được, khi nào không?'
  ],
  tags: ['Inbox pattern', 'Outbox pattern', 'idempotent consumer', 'exactly-once'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-023',
  topic: 'microservices',
  level: 'lead',
  refs: [{"type": "doc", "title": "Microservices - Martin Fowler", "url": "https://martinfowler.com/articles/microservices.html"}, {"type": "doc", "title": "microservices.io patterns", "url": "https://microservices.io/patterns/"}, {"type": "doc", "title": "Enterprise Integration Patterns", "url": "https://www.enterpriseintegrationpatterns.com/"}],
  q: 'Hệ thống dùng choreography (event-driven) nhưng flow đơn hàng qua 6 service, debug khó, timeout lẫn nhau. Bạn chuyển sang orchestration (Temporal/Camunda) khi nào, và so sánh hai cách về observability, compensation, versioning.',
  a: `**Tóm tắt:** **Choreography**: service tự phát event, không ai điều phối - đơn giản lúc đầu, nhưng flow dài (>3–4 service) thành "spaghetti event", khó thấy toàn cảnh, compensation rải rác. **Orchestration**: một **workflow engine** (Temporal, Camunda, Spring StateMachine) điều phối từng bước, state tập trung, observability tốt, compensation có hướng. Chuyển khi flow phức tạp, cross-team, cần timeout/retry tập trung, hoặc audit trail bắt buộc.
 
### Choreography - khi nào đủ, khi nào quá tải
 - **Đủ**: ≤ 3 service, flow tuyến tính, cùng team, ít branching, không cần human-in-the-loop.
 - **Quá tải**: fan-out/fan-in phức tạp, nhiều conditional branch, cần wait external signal (OTP, duyệt thủ công), compensation phải undo ngược nhiều bước, team khác nhau không ai "chịu trách nhiệm" end-to-end.
 - Observability: phải distributed tracing mới thấy luồng; một event lỗi không biết thuộc flow nào.
 - Versioning: thêm step mới = thêm consumer, producer không biết; đổi event schema = phải update tất cả consumer cùng lúc.
 
### Orchestration - Temporal vs Camunda vs tự viết
 | | Temporal | Camunda 8 (Zeebe) | Spring StateMachine / tự viết |
 |---|---|---|---|
 | Model | Code-first (Java SDK, workflow = code) | BPMN diagram + FEEL expression | Java code / config |
 | State | Event sourcing tích hợp, history đầy đủ | Persisted variable + incident | Tự quản lý (DB table) |
 | Durability | Built-in retry, timeout, heartbeat | Built-in, cần config exporter | Tự implement |
 | Scaling | Horizontal (worker polling) | Horizontal (Zeebe broker) | Tùy implementation |
 | Team fit | Backend-heavy, thích code | Business analyst + dev chung BPMN | Team nhỏ, flow đơn giản |
 | Lock-in | Temporal server (self-host/SaaS) | Camunda SaaS/self-host | Không |
 
 - **Temporal**: workflow viết bằng Java (hoặc Go/TypeScript), **deterministic execution** - replay từ history để recover, hỗ trợ **activity heartbeat** cho long-running, **continue-as-new** cho workflow dài. Phù hợp: payment flow, loan origination, order fulfillment.
 - **Camunda 8 (Zeebe)**: BPMN 2.0, non-blocking, gRPC gateway. Phù hợp khi cần business analyst vẽ diagram, versioning process riêng với code.
 
### Compensation trong orchestration
  - Mỗi step định nghĩa **compensation handler** (rollback action), chạy ngược thứ tự khi thất bại.
  - Temporal (Java SDK, class {{io.temporal.workflow.Saga}}):
  ~~~java
  Saga saga = new Saga(new Saga.Options.Builder().build());
  try {
      activities.reserveStock(orderId);
      saga.addCompensation(activities::releaseStock, orderId);   // đăng ký bù cho bước 1
      activities.chargePayment(orderId);
      saga.addCompensation(activities::refundPayment, orderId);  // đăng ký bù cho bước 2
  } catch (ActivityFailure e) {
      saga.compensate();  // chạy các compensation theo thứ tự ngược (LIFO)
      throw e;
  }
  ~~~
  - Camunda: boundary event / compensation trigger trên diagram.
 - Ưu hơn choreography: **thứ tự compensation đảm bảo**, có timeout cho compensation, retry compensation riêng, visibility state "compensating".
 
### Khi nào KHÔNG cần workflow engine
 - Flow < 3 service, tuyến tính, không branching, không human task.
 - Team chưa có kinh nghiệm operate engine - Temporal/Camunda thêm thành phần phải monitor, upgrade, backup.
 - Chỉ cần saga đơn giản: Spring StateMachine + bảng state đủ.
 
 > Senior tip: đừng sợ "thêm engine" - chi phí operate Temporal/Camunda thường **nhỏ hơn chi phí debug choreography lúc 3h sáng**. Chọn engine khi cost of confusion > cost of infrastructure.`,
  follow: [
    'Temporal workflow code phải deterministic - bạn test determinism như thế nào?',
    'Camunda BPMN versioning khác gì code versioning thông thường?',
    'Khi nào chọn Spring StateMachine thay vì engine riêng?'
  ],
  tags: ['choreography', 'orchestration', 'Temporal', 'Camunda', 'workflow engine']
},
{
  id: 'microservices-024',
  topic: 'microservices',
  level: 'senior',
  q: 'Triển khai Spring Boot 3 lên Kubernetes: bạn cấu hình liveness, readiness, startup probe như thế nào? Giải thích resource request/limit, graceful shutdown với preStop hook, và tại sao không dùng liveness probe cho startup chậm.',
  a: `**Tóm tắt:** **Startup probe** cho app khởi động chậm (JIT warmup, migration DB), **Readiness probe** cho sẵn sàng nhận traffic, **Liveness probe** chỉ detect deadlock/OOM - không bao giờ dùng liveness cho startup. Request/limit CPU/RAM phải dựa trên benchmark thực tế. Graceful shutdown: {{preStop}} sleep + {{terminationGracePeriodSeconds}} + Spring {{server.shutdown=graceful}} để chờ request đang xử lý xong.
 
### Ba loại probe - mục đích khác nhau
 | Probe | Mục đích | Kết quả fail | Khi nào dùng |
 |---|---|---|---|
 | **Startup** | App đang khởi động, chưa sẵn sàng cho readiness | **Kill pod, restart** (theo restartPolicy) | **Luôn dùng** cho Java (JVM warmup, Flyway migrate, cache load) |
 | **Readiness** | App sẵn sàng nhận request | **Remove khỏi Service endpoints** (không nhận traffic mới) | **Luôn dùng** - app đã sẵn sàng (warm-up xong, dependency **thiết yếu** của chính nó) |
 | **Liveness** | App deadlock, OOM, stuck | **Kill pod, restart** | **Chỉ detect fatal** - HTTP 200 trên {{/actuator/health/liveness}} (không check DB!) |
 
 - **Startup probe** bảo vệ readiness/liveness không bị đánh giá khi app đang khởi động: {{failureThreshold * periodSeconds}} > thời gian khởi động tối đa (VD 300s cho app migrate DB).
 - **Readiness probe** nên check: DB ping, Redis ping, Kafka connection, *không* check downstream service (để tránh cascade failure).
 - **Liveness probe** **KHÔNG** check dependency - nếu DB chết, liveness fail ⇒ restart pod ⇒ DB càng chết hơn. Chỉ check trạng thái nội bộ của app qua endpoint nhẹ {{/actuator/health/liveness}} (Spring Boot tự bật probe group này khi chạy trên Kubernetes).
 
### Resource request/limit - Java đặc thù
 ~~~yaml
 resources:
   requests:
     memory: "1Gi"      # Heap (Xmx) + Metaspace + CodeCache + ThreadStack + DirectMemory + OS
     cpu: "500m"
   limits:
     memory: "1.5Gi"    # Limit > Request để absorb burst, nhưng không quá xa (QoS Burstable)
     cpu: "1000m"
 ~~~
 - **Memory**: {{-Xmx}} = ~70% limit (VD limit 1.5Gi ⇒ Xmx 1G). Còn lại cho Metaspace (~256M), CodeCache (~240M), Thread stacks (1M/thread × 200 = 200M), Direct buffers, GC overhead.
 - **CPU**: Request = baseline throughput; Limit = burst ceiling. Java GC dùng CPU - limit quá chặt ⇒ GC throttle ⇒ latency spike.
 - **QoS class**: Mọi container có request=limit cho cả CPU và memory ⇒ Guaranteed (bị evict **sau cùng** khi node thiếu tài nguyên). Request<Limit ⇒ Burstable. Không set ⇒ BestEffort (dễ bị kill).
 
### Graceful shutdown - không drop request
 1. **Spring Boot 3**: {{server.shutdown=graceful}} (mặc định từ Boot 3.4) + {{spring.lifecycle.timeout-per-shutdown-phase=30s}} - Tomcat/Jetty/Undertow/Netty ngừng nhận request mới, chờ request đang xử lý xong.
 2. **preStop hook**: khi pod chuyển Terminating, việc gỡ pod khỏi EndpointSlice và việc kubelet dừng container diễn ra **song song**; kube-proxy/ingress cần vài giây để cập nhật. preStop sleep giữ app chạy bình thường trong khoảng đó, SIGTERM chỉ được gửi **sau khi** preStop xong.
 
 ~~~yaml
 lifecycle:
   preStop:
     exec:
       command: ["sh", "-c", "sleep 10"]
 terminationGracePeriodSeconds: 40
 ~~~
 - Thứ tự: pod Terminating → (song song) gỡ endpoint + chạy preStop (sleep 10s) → **SIGTERM** → Spring graceful shutdown (chờ request xong, max 30s) → SIGKILL nếu tổng thời gian (tính từ lúc bắt đầu preStop) vượt 40s.
 - Lệnh {{sh -c sleep}} cần image có shell (distroless thì không); Kubernetes mới có action {{sleep}} native cho preStop.
 - {{terminationGracePeriodSeconds}} ≥ {{preStopSleep}} + {{shutdownPhaseTimeout}} + buffer.
 
### Pitfall
 - Liveness probe check DB ⇒ DB chậm ⇒ pod restart loop ⇒ cascade.
 - Không có startup probe mà liveness có {{initialDelaySeconds}} ngắn ⇒ app chưa khởi động xong đã bị liveness kill ⇒ **restart loop** (CrashLoopBackOff). Readiness fail lúc khởi động thì không sao – pod chỉ chưa nhận traffic.
 - {{-Xmx}} set bằng memory limit ⇒ OOMKilled khi off-heap tăng. Nên dùng {{-XX:MaxRAMPercentage=70}} thay vì hard-code.
 - Không set {{preStop}} ⇒ app nhận SIGTERM và ngừng nhận connection trong khi kube-proxy/ingress **vẫn còn route** traffic tới pod ⇒ lỗi 502/connection refused lúc deploy.
 
 > Senior tip: luôn load-test để tìm {{XmxValue}} thực tế (heap sau Full GC ổn định) và set request/limit theo đó. Không guess - Java memory không chỉ là heap.`,
  follow: [
    'Startup probe {{failureThreshold * periodSeconds}} tính ra sao cho app Flyway migrate 200 script?',
    'Readiness probe check downstream service có nguy hiểm như thế nào?',
    '{{terminationGracePeriodSeconds}} mặc định 30s, bạn tăng bao nhiêu cho app xử lý request lâu?'
  ],
  tags: ['Kubernetes', 'Spring Boot 3', 'probe', 'graceful shutdown', 'resource limit'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-025',
  topic: 'microservices',
  level: 'senior',
  q: 'Request từ client đi qua 5 service (A→B→C→D→E), mỗi service timeout 5s. Giải thích timeout budget, deadline propagation, và vì sao timeout phải giảm dần theo chiều sâu (hop càng sâu càng ngắn).',
  a: `**Tóm tắt:** **Timeout budget** = tổng thời gian client chấp nhận (VD 5s). Mỗi hop phải có deadline riêng, **tổng deadline ≤ budget**. **Deadline propagation**: client gửi deadline tuyệt đối (hoặc remaining time) qua header, mỗi service trừ thời gian đã dùng rồi truyền tiếp. Hop sâu timeout ngắn hơn để: (1) dự trù cho retry, (2) tránh head-of-line blocking, (3) fail fast trước khi làm nghẽn tài nguyên upstream.
 
### Vấn đề: timeout cố định cho mọi hop
 - Client timeout 5s, A→B→C→D→E mỗi chỗ 5s ⇒ worst case 25s (5 hop × 5s).
 - Retry 3 lần ở B ⇒ B alone có thể tốn 15s ⇒ client đã timeout nhưng downstream vẫn đang chạy lãng phí CPU.
 - Không có deadline propagation ⇒ service D không biết client đã timeout, vẫn xử lý xong rồi trả về cho không ai.
 
### Deadline propagation (Google gRPC / Envoy / Spring Cloud)
  - Client gán **deadline tuyệt đối** (timestamp) hoặc **remaining time** (ms) vào header: {{x-deadline-ms}} hoặc {{grpc-timeout}}.
  - Mỗi service:
~~~java
long remaining = deadline - System.currentTimeMillis();
if (remaining <= 0) return ResponseEntity.status(504).build(); // hết budget: fail fast, không gọi tiếp
~~~
  - Service dùng {{remaining}} làm timeout cho call downstream, **trừ đi safety margin** (VD 100ms) cho network/serialization.
  - Spring không có sẵn cơ chế deadline cho HTTP: tự viết filter đọc header, lưu vào request context (MDC/Reactor Context), rồi {{ClientHttpRequestInterceptor}} / {{ExchangeFilterFunction}} gắn header và timeout cho call downstream; gRPC: {{Context}} tự động propagate deadline (header {{grpc-timeout}}).
 
### Timeout giảm dần theo chiều sâu (tapered timeout)
 | Hop | Service | Timeout | Lý do |
 |---|---|---|---|
 | 1 (edge) | API Gateway / BFF | 4.5s | Gần client nhất, cần buffer cho retry + response |
 | 2 | Orchestration / API Composition | 3.5s | Cần thời gian aggregate, gọi song song |
 | 3 | Core domain (Order, Payment) | 2.5s | Logic nghiệp vụ chính, có DB local |
 | 4 | Infrastructure (Cache, Queue) | 1.5s | Fast path, ít logic |
 | 5 (leaf) | External / Legacy | 1.0s | Không kiểm soát được, fail fast |
 
 - Bảng trên chỉ là ví dụ. **Nguyên tắc**: timeout của hop i < timeout của hop i-1 trừ thời gian xử lý tại chỗ và số lần retry × timeout mỗi lần; số liệu thật lấy từ latency p99 đo được.
 - **Retry budget**: chỉ dành ~10-20% budget cho retry, chỉ retry ở **một** tầng – retry ở mọi tầng sẽ nhân cấp số (3 tầng × 3 lần = 27 call xuống leaf).
 
### Pitfall
 - Không propagate deadline ⇒ "zombie request": client hủy, downstream vẫn chạy → lãng phí, lệch metric.
 - Timeout hop sâu quá dài ⇒ một leaf chậm kéo theo chain timeout, thread pool upstream cạn kiệt.
 - Clock skew giữa service ⇒ deadline tính sai ⇒ dùng **remaining time (ms)** thay vì timestamp tuyệt đối, hoặc sync NTP chặt.
 
 > Senior tip: đo **timeout budget usage** theo percentile (p50, p95, p99) tại mỗi hop. Nếu p99 hop 3 đã ăn 80% budget, bạn phải tune hop 3 hoặc giảm budget cho hop 1-2. Không có metric này = bạn đang mò kim đáy bể.`,
  follow: [
    'Deadline propagation qua Kafka (async) xử lý thế nào?',
    'Khi nào nên dùng absolute deadline timestamp thay vì remaining time?',
    'Service leaf (external API) timeout ngắn mà fail nhiều - bạn handle retry ở đâu?'
  ],
  tags: ['timeout budget', 'deadline propagation', 'tapered timeout', 'distributed systems'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-026',
  topic: 'microservices',
  level: 'senior',
  q: 'Một downstream chậm (payment) làm kẹt thread pool của upstream (order), các request khác (catalog, user) cũng bị chờ. Bạn áp dụng Bulkhead pattern: thread pool isolation vs semaphore isolation, cấu hình như thế nào?',
  a: `**Tóm tắt:** **Bulkhead** = tách resource pool cho từng dependency, ngăn một downstream chậm/lỗi lan sang service khác. **Thread pool isolation**: mỗi dependency có pool thread riêng, có queue, overhead context switch, phù hợp blocking I/O (JDBC, HTTP sync). **Semaphore isolation**: chỉ đếm concurrent call, không queue, nhẹ, phù hợp non-blocking (WebClient, R2DBC). Cấu hình max concurrency dựa trên Little's Law: concurrency = throughput × latency (định luật dùng latency trung bình; thay bằng p99 để có headroom).
 
### Vì sao cần Bulkhead
 - Order service gọi Payment, Catalog, User chung pool 200 thread.
 - Payment chậm (DB lock 30s) => 200 thread kẹt ở Payment => Catalog, User request vào queue => timeout => cascade failure.
 - Bulkhead: Payment 25 thread, Catalog 50 thread, User 50 thread ⇒ Payment chậm chỉ giết 25 thread, Catalog/User vẫn chạy.
 
### Thread pool isolation (Resilience4j Bulkhead)
 ~~~yaml
 resilience4j:
   thread-pool-bulkhead:              # khác key với semaphore bulkhead
     instances:
       paymentApi:
         maxThreadPoolSize: 25
         coreThreadPoolSize: 10
         queueCapacity: 50              # request chờ khi pool full
         keepAliveDuration: 60s
       catalogApi:
         maxThreadPoolSize: 50
         coreThreadPoolSize: 20
         queueCapacity: 100
 ~~~
 - Java: {{@Bulkhead(name = "paymentApi", type = Type.THREADPOOL)}} - call chạy trên pool riêng, method phải trả về {{CompletableFuture}}/{{CompletionStage}} (call chạy async trên pool riêng). Queue đầy và pool đầy ⇒ {{BulkheadFullException}}.
 - Ưu: queue buffer spike, caller thread không block; kết hợp {{@TimeLimiter}} để cắt call quá lâu. (Không có cấu hình timeout cho thời gian chờ trong queue.)
 - Nhược: overhead thread + context switch, memory per thread (~1MB stack), tuning phức tạp (core/max/queue).
 
### Semaphore isolation (Resilience4j default)
~~~yaml
resilience4j:
  bulkhead:
    instances:
      paymentApi:
        maxConcurrentCalls: 25         # semaphore permits
        maxWaitDuration: 0             # mặc định 0: hết permit là reject ngay
      catalogApi:
        maxConcurrentCalls: 50
~~~
- Java: {{@Bulkhead(name = "paymentApi", type = Type.SEMAPHORE)}} - caller thread trực tiếp acquire permit, chạy call, release.
 - Ưu: zero overhead, phù hợp reactive/non-blocking (WebClient, R2DBC), scaling tự nhiên với event loop.
 - Nhược: **không có queue** - hết permit thì caller chờ tối đa {{maxWaitDuration}} (mặc định 0 = reject ngay, throw {{BulkheadFullException}}), caller phải tự fallback.
 
### Chọn loại nào?
 | Điều kiện | Chọn |
 |---|---|
 | Blocking I/O (RestTemplate, JDBC, gRPC blocking stub) | **Thread pool** |
 | Non-blocking (WebClient, R2DBC, gRPC async stub) | **Semaphore** |
 | Cần queue buffer cho burst traffic | **Thread pool** |
 | Latency cực thấp, throughput cao, reactive stack | **Semaphore** |
 | Legacy code sync, không muốn đổi sang async | **Thread pool** |
 
### Sizing bằng Little's Law
~~~text
Concurrency = Throughput (req/s) * Latency (s) p99
~~~
- Payment: 100 req/s * 0.8s p99 = 80 concurrent => set max 100 (buffer 25%).
- Catalog: 500 req/s * 0.05s p99 = 25 concurrent => set max 35.
 - Luôn set **maxConcurrentCalls ≤ thread pool size của server** (Tomcat default 200) để không tự DOS chính mình.
 
 > Senior tip: bulkhead config **không phải set once, forget forever**. Hãy có dashboard: {{resilience4j.bulkhead.available.concurrent.calls}} / {{resilience4j.bulkhead.max.allowed.concurrent.calls}} theo từng dependency. Nếu available thường < 10% max => tăng max hoặc tune latency downstream. Nếu available ≈ max luôn => bạn over-provision.`,
  follow: [
    'Thread pool bulkhead với queueCapacity: request chờ quá lâu trong queue có timeout không?',
    'Semaphore bulkhead reject request khi full - bạn fallback ra sao cho graceful?',
    'Bulkhead kết hợp với Circuit Breaker: breaker mở thì bulkhead permits có bị giải phóng không?'
  ],
  tags: ['Bulkhead', 'thread pool isolation', 'semaphore isolation', 'Resilience4j', 'concurrency limit'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
},
{
  id: 'microservices-027',
  topic: 'microservices',
  level: 'lead',
  refs: [{"type": "doc", "title": "Microservices - Martin Fowler", "url": "https://martinfowler.com/articles/microservices.html"}, {"type": "doc", "title": "microservices.io patterns", "url": "https://microservices.io/patterns/"}, {"type": "doc", "title": "Enterprise Integration Patterns", "url": "https://www.enterpriseintegrationpatterns.com/"}],
  q: 'Hệ thống 15 service, team phàn nàn "mọi thay đổi phải deploy 5 service cùng lúc", latency cao do gọi lặp qua HTTP. Dấu hiệu chia sai bounded context (chatty, distributed monolith) là gì, và bạn gộp/tách lại như thế nào?',
  a: `**Tóm tắt:** **Chatty services** = nhiều call qua network cho một nghiệp vụ đơn giản; **Distributed monolith** = service tách vật lý nhưng coupling logic (share DB, sync call chuỗi, deploy cùng lúc). Dấu hiệu: fan-out > 3 cho 1 use case, shared DB, cyclic dependency, team phải align release. Giải pháp: gộp service có coupling chặt, tách service có boundary rõ, dùng API composition/CQRS cho query xuyên service.
 
### Dấu hiệu chia sai (Service Smells)
 | Smell | Triệu chứng | Nguyên nhân |
 |---|---|---|
 | **Chatty** | 1 request client → 10+ call nội bộ, latency p99 > 2s | Boundary quá mỏng, thiếu aggregate API |
 | **Distributed monolith** | Deploy 5 service cùng lúc, rollback 1 kéo theo 4 | Shared DB, sync call chain, cyclic dependency |
 | **Data coupling** | 3 service đọc/ghi bảng {{customer}} | Chưa xác định owner của data |
 | **Temporal coupling** | Service A đợi B xong mới chạy, không thể song song | Sync call thay vì event-driven |
 | **Team friction** | Team X chặn release team Y vì share code/model | Không có bounded context rõ |
 
### Phân tích dependency graph
 - Vẽ **service dependency graph** (call graph từ trace): node = service, edge = call (sync/async).
 - **Cycle** = distributed monolith chắc chắn (A→B→C→A).
 - **Fan-out cao** từ 1 service = candidate cho API Gateway/BFF aggregate.
 - **Shared DB** = edge ẩn, phải detect qua connection pool metrics hoặc audit log.
 
### Chiến lược gộp/tách
 **Gộp (merge) khi:**
 - Hai service luôn deploy cùng nhau, share DB, call sync lặp lại.
 - Coupling là **functional** (cùng một bounded context), không phải technical.
 - Ví dụ: {{Order}} + {{OrderItem}} + {{OrderHistory}} → gộp thành {{Order Service}}.
 
 **Tách (split) khi:**
 - Service có 2+ bounded context bên trong (VD: {{UserService}} vừa làm auth vừa làm profile).
 - Scale profile khác nhau (payment cần high availability, catalog có thể down 5 phút).
 - Team ownership khác nhau, release cadence conflict.
 
### Query xuyên service — không join DB
 - **API Composition (BFF/Gateway)**: gộp response ở edge, phù hợp đọc ít, latency chấp nhận được.
 - **CQRS Read Model**: dựng view table/Elasticsearch từ event, query O(1), phù hợp đọc nhiều, phức tạp hơn.
 - **Data Lake/OLAP**: cho báo cáo, analytics, không cho transaction path.
 
 > Senior tip: đừng tách service theo **entity/CRUD** (UserService, ProductService, OrderService chỉ bọc bảng) — hãy tách theo **business capability / subdomain** (Ordering, Fulfillment, Billing), mỗi service sở hữu trọn một quy trình và dữ liệu của nó. Entity service dẫn đến chatty; nhưng tách đến mức mỗi use case (verb) một service thì lại thành nanoservice.`,
  follow: [
    'Làm sao detect shared DB trong production khi không có doc?',
    'Khi gộp 2 service, migration data như thế nào để zero-downtime?',
    'Cyclic dependency A→B→C→A: bạn cắt đâu trước?'
  ],
  tags: ['bounded context', 'chatty services', 'distributed monolith', 'service decomposition']
},
{
  id: 'microservices-028',
  topic: 'microservices',
  level: 'senior',
  q: 'Dashboard cần hiển thị đơn hàng + khách hàng + thanh toán + tồn kho — data nằm rải rác 4 service. So sánh API Composition, CQRS Read Model, và Data Lake. Khi nào chọn cái nào, trade-off latency vs consistency vs effort?',
  a: `**Tóm tắt:** **API Composition** (BFF/Gateway) gộp response lúc runtime — đơn giản, dữ liệu mới nhất của từng service, latency = tổng các call (gọi song song thì ≈ call chậm nhất). **CQRS Read Model** dựng view denormalized từ event — query nhanh O(1), nhưng tốn effort build projection, eventual consistency rõ rệt. **Data Lake/OLAP** cho analytics/báo cáo — không dùng cho transaction path. Chọn theo: read/write ratio, latency SLA, team capacity.
 
### So sánh ba cách
 | Tiêu chí | API Composition | CQRS Read Model | Data Lake / OLAP |
 |---|---|---|---|
 | **Latency** | Tổng các call (50-500ms) | Rất nhanh (5-20ms) | N/A (batch) |
 | **Consistency** | Gần real-time (nếu không cache) nhưng không phải snapshot nhất quán giữa các service |Eventual (tùy projection lag) | Eventual (batch delay) |
 | **Effort build** | Thấp (code aggregate) | Cao (projection, replay, schema) | Trung bình (pipeline, modeling) |
 | **Effort vận hành** | Thấp | Cao (monitor lag, rebuild) | Trung bình |
 | **Phù hợp** | Dashboard nội bộ, read ratio < 10x | Dashboard customer-facing, read ratio > 50x | Báo cáo, BI, ML training |
 | **Schema thay đổi** | Dễ (chỉ sửa aggregator) | Khó (phải migrate view, replay) | Dễ (schema-on-read) |
 
### API Composition (BFF pattern)
 ~~~java
 @GetMapping("/dashboard/orders/{id}")
 public OrderDashboardDto getDashboard(@PathVariable String id) {
     var order = orderClient.get(id);           // 50ms
     var customer = customerClient.get(order.customerId()); // 30ms
     var payment = paymentClient.getByOrder(id); // 40ms
     var inventory = inventoryClient.getReserved(id); // 30ms
     return new OrderDashboardDto(order, customer, payment, inventory);
 }
 ~~~
 - Dùng **parallel call** (CompletableFuture/WebClient) để giảm latency.
 - **Timeout budget**: set timeout cho từng call, fallback graceful (partial data).
 - **Caching**: cache response 10-60s cho dashboard ít thay đổi.
 
### CQRS Read Model (Materialized View)
  - Event: {{OrderPlaced}}, {{PaymentCaptured}}, {{ItemShipped}} → projection cập nhật {{order_dashboard_view}}.
  - Query: {{SELECT * FROM order_dashboard_view WHERE id = ?}} — single row, no join.
  - **Projection lag**: monitor {{projection_lag_ms}} (event time → view updated). Alert nếu > 5s.
  - **Rebuild tool**: bắt buộc có script replay từ đầu hoặc từ checkpoint.
 
### Khi nào chọn cái nào
 - **Read/Write < 10:1**, latency budget > 200ms, team nhỏ → **API Composition**.
 - **Read/Write > 50:1**, latency budget < 50ms, team sẵn sàng invest projection → **CQRS Read Model**.
 - **Analytics, historical, ad-hoc query**, không cần real-time → **Data Lake** (Iceberg/Delta Lake + Trino/StarRocks).
 - **Kết hợp**: API Composition cho transaction path, CQRS cho high-traffic dashboard, Data Lake cho BI.
 
 > Senior tip: đừng dựng CQRS view cho mọi thứ — bắt đầu bằng API Composition + cache. Chỉ thêm projection khi metric chứng minh nó cần thiết (read latency p99 > SLA, read throughput cạn kiệt CPU). Over-engineering CQRS là nợ kỹ thuật đắt đỏ nhất trong microservices.`,
  follow: [
    'API Composition: partial failure (một service down) xử lý fallback ra sao?',
    'CQRS projection lag monitor bằng metric gì, alert threshold thế nào?',
    'Data Lake cho dashboard real-time: feasible không, tại sao?'
  ],
  tags: ['API Composition', 'CQRS', 'read model', 'data lake', 'query federation'],
  refs: [
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
  ]
}
);
