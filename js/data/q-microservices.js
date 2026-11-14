/* Topics: microservices - owner: task T4. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'microservices-001',
  topic: 'microservices',
  level: 'mid',
  q: 'Team 5 người, domain chưa ổn định, deadline 3 tháng. Bạn sẽ khuyên chọn monolith, modular monolith hay microservices? Liệt kê những tình huống bạn khuyên KHÔNG nên tách service.',
  a: `**Tóm tắt:** với domain chưa ổn định, team 5 người và deadline 3 tháng, tôi khuyên bắt đầu bằng **modular monolith**: một ứng dụng, một lần deploy, nhưng code chia thành các module có ranh giới (boundary) rõ ràng. Chỉ tách microservices khi có **bằng chứng thật**: một module cần scale độc lập, cần profile tài nguyên khác, hoặc các team bắt đầu chặn lịch release của nhau.

### Hiểu nhanh
Hãy hình dung bạn mở một quán ăn nhỏ 5 người. Monolith cổ điển giống một căn bếp không chia khu: ai cũng đụng vào mọi thứ, lâu dần dao thớt lẫn lộn. Modular monolith là **một căn bếp nhưng chia khu rõ**: khu sơ chế, khu nấu, khu pha chế, mỗi khu có kệ riêng và chỉ "giao đồ" qua quầy chung. Microservices là **mở 5 bếp ở 5 địa điểm**: mỗi bếp tự do hơn, nhưng phải có xe chở hàng, điện thoại liên lạc, sổ sách riêng cho từng bếp. Với 5 người và thực đơn còn đổi hằng tuần, mở 5 bếp là tự làm khổ mình.

### Thuật ngữ
- **Monolith**: toàn bộ ứng dụng build thành một artifact (một file jar) và chạy trong một tiến trình.
- **Modular monolith**: vẫn một artifact, nhưng code chia module theo nghiệp vụ, module chỉ gọi nhau qua API public.
- **Bounded context**: vùng nghiệp vụ mà trong đó mỗi khái niệm có một nghĩa duy nhất (khái niệm của DDD).
- **Release cadence**: nhịp phát hành, ví dụ team A muốn deploy mỗi ngày còn team B mỗi tháng.
- **Observability**: khả năng nhìn vào hệ thống qua log, metric, tracing để biết chuyện gì đang xảy ra.
- **ArchUnit**: thư viện Java viết unit test để kiểm tra luật kiến trúc (package nào được phụ thuộc package nào).
- **Saga / outbox**: các pattern xử lý giao dịch xuyên nhiều service, chỉ cần khi đã tách DB.

### So sánh nhanh
| Tiêu chí | Monolith cổ điển | Modular monolith | Microservices |
|---|---|---|---|
| Chi phí vận hành | thấp nhất | thấp | cao: pipeline, deploy, network, monitoring cho từng service |
| Boundary | mơ hồ, trôi theo thời gian | buộc bằng package + kiểm thử kiến trúc | buộc bằng API contract + schema riêng |
| Scaling | cả ứng dụng | cả ứng dụng | từng service |
| Transaction | ACID có sẵn | ACID có sẵn | tự lo saga/outbox/compensation |
| Độc lập deploy của team | thấp | trung bình | cao |

### Vì sao chi phí microservices lại cao (từng bước)
1. **Mỗi service cần một pipeline CI/CD riêng**: build, test, image, deploy, rollback. Vì sao: lợi ích "deploy độc lập" chỉ có khi pipeline độc lập.
2. **Gọi hàm biến thành gọi mạng**: một lệnh {{orderService.create()}} giờ là HTTP call có thể timeout, lỗi một phần, phải retry. Vì sao: mạng không bao giờ tin cậy 100%.
3. **Mất transaction ACID chung**: ghi đơn hàng và trừ kho nằm ở 2 DB khác nhau, phải dùng saga. Vì sao: một transaction DB không thể trải qua hai database độc lập mà không có 2PC.
4. **Phải có observability**: một request đi qua 4 service, lỗi ở đâu? Cần distributed tracing, log tập trung. Vì sao: không còn một stack trace duy nhất.

~~~text
Team 5 người, 8 service:
  8 pipeline + 8 dashboard + 8 runbook on-call
  => ~0,6 người / service  => phần lớn thời gian lo hạ tầng, không làm tính năng
~~~

### Khi nào KHÔNG nên tách
- **Domain còn thay đổi**: mỗi lần đổi model lại phải đổi contract + migration cho 2 DB. Chi phí tách vượt lợi ích; hãy chờ tới khi boundary "không đổi suốt vài tháng liên tiếp".
- **Team dưới khoảng 8–10 người**: một team 5 người gánh 8 service thì phần lớn thời gian lo infra thay vì làm sản phẩm.
- **Chưa có CI/CD, container, observability**: tách service mà không có pipeline deploy/rollback, tracing, logging tập trung thì downtime chỉ tăng.
- **Nghiệp vụ cần transaction mạnh trên nhiều entity**: monolith cho ACID sẵn; tách ra là bạn tự nhận việc saga, outbox, idempotency.
- **Chưa tìm ra product-market fit**: chi phí thay đổi (change cost) quan trọng hơn chi phí scale.

### Dấu hiệu ĐÃ sẵn sàng tách
- Một module luôn thay đổi độc lập và kéo theo deploy cả hệ thống.
- Module cần resource/profile khác (bộ nhớ lớn, GPU, blast radius cao như thanh toán).
- Hai team tranh chấp lịch release, hoặc một team chặn release của team kia.
- Đã có: infrastructure as code, blue-green deploy, distributed tracing, centralized log.

### Modular monolith thực tế
Chia package theo bounded context, module chỉ phụ thuộc qua interface public, cấm chạm bảng của module khác. Kiểm bằng ArchUnit trong CI:

~~~java
@AnalyzeClasses(packages = "com.shop")
class ArchitectureTest {
    @ArchTest
    static final ArchRule order_khong_goi_noi_bo_payment =
        noClasses().that().resideInAPackage("..order..")
            // chỉ được gọi payment qua package api public
            .should().dependOnClassesThat().resideInAPackage("..payment.internal..");
}
~~~

Mỗi module có schema riêng trong chung một instance DB. Sau này tách service, bạn migrate đúng schema đó sang DB mới; code gần như chỉ đổi chỗ kết nối và thêm API layer. Spring cũng có dự án **Spring Modulith** hỗ trợ đúng mô hình này (kiểm tra module, event giữa module).

### Lỗi hay gặp
1. **Tách sớm theo tầng kỹ thuật** (user-service, notification-service, db-service). Triệu chứng: mọi tính năng phải sửa 3–4 service cùng lúc. Cách tránh: tách theo nghiệp vụ (bounded context), không theo tầng.
2. **Modular monolith chỉ trên giấy**. Triệu chứng: module order vẫn JOIN thẳng bảng payment, nên ngày tách ra thì không tách được. Cách tránh: luật ArchUnit chạy trong CI + mỗi module một schema.
3. **Distributed monolith**. Triệu chứng: 5 service nhưng luôn phải deploy cùng nhau. Cách tránh: nếu 2 service luôn đổi cùng nhau, gộp chúng lại.

### Trả lời miệng 1 phút
"Với team 5 người, domain còn đổi và deadline 3 tháng, tôi chọn modular monolith. Tức là một ứng dụng, một pipeline deploy, nhưng code chia module theo bounded context, module chỉ gọi nhau qua API public, mỗi module có schema riêng, và tôi enforce bằng ArchUnit trong CI. Lý do: microservices biến lời gọi hàm thành lời gọi mạng, mất transaction ACID, và mỗi service cần pipeline, dashboard, on-call riêng; với 5 người đó là chi phí lớn hơn lợi ích. Tôi chỉ tách khi có bằng chứng: một module cần scale riêng, cần tài nguyên khác, hoặc team chặn release của nhau. Kinh nghiệm của tôi là tách muộn mà boundary đúng dễ hơn nhiều so với tách sớm rồi phải gộp lại."

### Ví dụ đời thực
  Công ty thương mại điện tử nhỏ (6 dev) khởi công năm 2022 với **modular monolith**: một jar, PostgreSQL chung, package theo bounded context (catalog, order, payment, shipping). Năm 2023, trước Black Friday, đơn hàng tăng 10 lần (từ 200 req/phút lên 2000 req/phút). Triệu chứng: toàn bộ ứng dụng chạy trên 1 instance 4 CPU/16GB, CPU đạt 95%, response time p99 tăng từ 200ms lên 3s. Điều tra: {{kubectl top pod}} thấy app-monolith dùng 3,8/4 CPU; {{SELECT count(*) FROM pg_stat_activity}} thấy 60 kết nối đang wait trên lock của bảng orders; {{ArchUnit}} trong CI phát hiện module payment vẫn JOIN thẳng bảng orders của module order (violation). Nguyên nhân gốc: một monolith không thể scale từng module; và modular monolith trên giấy (module order vẫn truy cập bảng của payment) khiến tách service sau này khó. Xử lý: (1) thêm 2 instance app để load balance, (2) sửa ArchUnit rule và refactor order không JOIN payment table, (3) chuẩn bị roadmap: khi order module cần scale riêng (dự kiến Q1 2024), tách order-service ra với DB riêng. Kết quả: sau khi thêm instance, p99 giảm về 350ms; việc enforce ArchUnit giúp phát hiện 7 violation trong 1 tháng. Đây là minh chứng: modular monolith đã giải quyết vấn đề scale tạm thời, và boundary enforced bằng ArchUnit giúp chuẩn bị cho việc tách service mà không phải viết lại.

  > Senior tip: chi phí thật của microservices không nằm ở code mà nằm ở ops: mỗi service thêm một dashboard, một pipeline, một runbook on-call. Hãy tách theo đau thật, không theo CV.`,
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
  a: `**Tóm tắt:** **database-per-service** không nhằm tiết kiệm network call mà để giữ **tính độc lập**: mỗi service sở hữu dữ liệu của chính nó, service khác chỉ đọc/ghi gián tiếp qua API hoặc event. Share chung schema là coupling ngầm: một thay đổi cột của team này làm sập team kia. Boundary đúng theo DDD là **bounded context**: vùng mà mỗi thuật ngữ nghiệp vụ có đúng một nghĩa.

### Hiểu nhanh
Hai gia đình dùng chung một tủ lạnh cho tiện. Ban đầu ổn, cho đến khi nhà A dọn tủ, vứt hộp "đồ cũ" mà thực ra là đồ của nhà B. Không ai báo trước vì "tủ là của chung". Database-per-service là mỗi nhà một tủ lạnh: muốn xin đồ thì **gõ cửa hỏi** (API) hoặc nhà kia **thông báo** "tôi vừa đi chợ về" (event). Tốn công hơn một chút, nhưng không ai vô tình phá đồ của ai.

### Thuật ngữ
- **Database-per-service**: mỗi service có DB/schema riêng, chỉ nó được kết nối trực tiếp.
- **Distributed monolith**: hệ thống chia nhiều service nhưng vẫn phụ thuộc chặt đến mức phải deploy cùng nhau.
- **Bounded context**: ranh giới nghiệp vụ trong DDD, bên trong đó mỗi từ có nghĩa duy nhất.
- **Ubiquitous language**: bộ từ vựng chung mà dev và business cùng dùng trong một context.
- **Event storming**: buổi workshop dán giấy note các domain event để khám phá nghiệp vụ.
- **Anti-corruption layer (ACL)**: lớp dịch model của hệ thống khác sang model của mình, ngăn "ô nhiễm" khái niệm.
- **CQRS read model**: bảng chỉ để đọc, được dựng lại từ event của nhiều service.
- **Blast radius**: phạm vi ảnh hưởng khi một thành phần gặp sự cố.

### Vì sao share DB là coupling ngầm
1. **Schema là contract không ai ký**: team B đổi tên cột, tách bảng, đổi kiểu; team A không biết nên lỗi khi chạy. Vì sao nguy hiểm: không có compile error nào cảnh báo, chỉ có lỗi runtime trên production.
2. **Join xuyên service**: code gọn thật, nhưng hai deployment phải đồng bộ schema mọi lúc. Vì sao: bạn vừa tạo lại distributed monolith ở tầng data.
3. **Scale vô nghĩa**: hai service cùng một instance DB thì bottleneck vẫn là DB đó. Vì sao: tách app mà không tách nơi lưu thì tải đọc/ghi vẫn dồn một chỗ.
4. **Blast radius chung**: một query full-scan ngây thơ của service A làm chậm DB chung, service B chết theo. Vì sao: CPU, IO, connection, lock của DB là tài nguyên dùng chung.

~~~text
Order Service                   Payment Service
+------------------+            +------------------+
| orders (schema)  |  REST/evt  | payments (schema)|
+------------------+ <--------> +------------------+
   không đọc bảng của nhau, chỉ trao đổi qua API/event
~~~

### Tìm boundary bằng DDD
1. **Event storming** với người làm nghiệp vụ: vẽ domain event (OrderPlaced, PaymentCaptured, ItemShipped), rồi gom các command/event liên quan thành một context. Vì sao: event phản ánh việc thật sự xảy ra, ít bị ảnh hưởng bởi thiết kế bảng hiện tại.
2. **Ubiquitous language**: mỗi context một ngôn ngữ. "Customer" trong Sales là người đặt hàng, trong Shipping là người nhận; "Product" trong Catalog là item hiển thị, trong Inventory là SKU tồn kho. Vì sao: cùng một từ mà hai nghĩa khác nhau là dấu hiệu có hai context.
3. **Context mapping**: xác định quan hệ giữa các context: customer-supplier, conformist, hay anti-corruption layer. Tránh shared kernel (chia sẻ model chung) vì nó tái tạo coupling; chỉ dùng khi cả hai bên cùng giữ contract chặt.

### Truy cập data xuyên service
- **Đọc**: **API composition** (gộp kết quả ở tầng ứng dụng) hoặc **CQRS read model** (dựng bảng đọc riêng, cập nhật bằng event). Không join SQL xuyên service.
- **Ghi**: không bao giờ update bảng của service khác; gọi API hoặc publish event để service chủ sở hữu tự cập nhật data của mình.
- **Data tham chiếu tĩnh** (quốc gia, danh mục): replicate về hoặc tách thành reference service, nhưng phải có một source of truth duy nhất.

### Lộ trình gỡ DB chung (thực tế)
1. Liệt kê bảng nào service nào đọc/ghi (qua code + DB user + audit log).
2. Gán chủ sở hữu duy nhất cho từng bảng.
3. Service không sở hữu chuyển sang đọc qua API/event; tạm thời có thể cho đọc qua **view read-only**.
4. Tách DB user riêng cho từng service, thu hồi quyền trên bảng không sở hữu, cuối cùng tách hẳn database.

### Lỗi hay gặp
1. **Chia quá mỏng**. Triệu chứng: 30 service, mỗi request phải composition qua 10 hop, latency cộng dồn, debug khổ. Cách tránh: boundary theo nghiệp vụ, không phải theo bảng; boundary sai còn đau hơn monolith.
2. **"Mình hứa không đụng DB của nhau"**. Triệu chứng: vài tháng sau có người query tắt. Cách tránh: mỗi service một DB user chỉ có quyền trên schema của mình; kiểm tra connection metrics/audit log.
3. **Đổi schema trực tiếp khi vẫn còn người dùng chung**. Triệu chứng: service khác lỗi ngay sau migration. Cách tránh: expand–contract (thêm cột mới trước, gỡ cột cũ sau khi không ai đọc).

### Trả lời miệng 1 phút
"Share chung schema giữa hai team là coupling ngầm: schema trở thành contract mà không ai version hay kiểm tra, nên đổi một cột là team kia lỗi runtime; hai service cũng không scale riêng được và chịu chung blast radius của DB. Tôi áp dụng database-per-service: mỗi bảng có đúng một service sở hữu, service khác đọc qua API composition hoặc CQRS read model và ghi qua API/event. Để vẽ boundary tôi dùng event storming và ubiquitous language: khi cùng một từ như Customer mang hai nghĩa, đó là hai bounded context. Trade-off là thêm latency và eventual consistency. Khi gỡ DB chung, tôi làm từng bước: gán chủ sở hữu, tách DB user, thu hồi quyền, rồi mới tách hẳn."

### Ví dụ đời thực
  Một công ty fintech có 2 service: **Order Service** và **Payment Service**, cùng truy cập chung schema {{public}} trong PostgreSQL. Năm 2023 team payment đổi tên cột {{amount}} thành {{amount_minor}} (đổi sang đơn vị cent), deploy schema migration. Team order không biết, deploy xong thì order-service lỗi ngay: {{column "amount" does not exist}}. Điều tra: {{pg_stat_activity}} thấy query từ order-service fail liên tục; migration log của payment-service ghi "ALTER TABLE transactions RENAME COLUMN amount TO amount_minor"; code order-service có {{SELECT amount FROM transactions}}. Nguyên nhân gốc: schema chung là contract không có version, không có compile-time check. Xử lý: (1) rollback migration, (2) chia schema riêng: payment-schema cho payment-service, order-schema cho order-service, (3) order-service chuyển sang đọc payment qua REST /payments/{id} thay vì JOIN. Kết quả: sau 2 tuần, hai service deploy độc lập, không còn lỗi schema; nhưng thêm 1 hop network (order → payment API) làm latency tăng 40ms. Đây là minh chứng: database-per-service giải quyết coupling schema nhưng trade-off là network call.

  > Senior tip: tín hiệu đỏ lớn nhất là "2 service phải luôn deploy cùng nhau": khi đó chúng thực chất là một service, hãy gộp lại thay vì vờ tách.`,
  follow: [
    'Nếu hai bounded context cần dữ liệu khách hàng, bạn chọn shared kernel hay anti-corruption layer? Vì sao?',
    'API composition và CQRS read model khác nhau khi nào, chi phí nào lớn hơn?',
    'Làm sao phát hiện một service đang âm thầm truy cập DB của service khác trong production?'
  ],
  tags: ['DDD', 'bounded context', 'database per service', 'API composition'],
  refs: [
    { type: 'article', title: 'Bounded Context (Martin Fowler)', url: 'https://martinfowler.com/bliki/BoundedContext.html' },
    { type: 'doc', title: 'Pattern: Database per service', url: 'https://microservices.io/patterns/data/database-per-service.html' },
    { type: 'doc', title: 'Pattern: API Composition', url: 'https://microservices.io/patterns/data/api-composition.html' },
  ]
},
{
  id: 'microservices-003',
  topic: 'microservices',
  level: 'mid',
  q: 'Khi tích hợp với 20 service khác, bạn chọn REST/gRPC đồng bộ hay messaging bất đồng bộ? So sánh theo ba loại coupling: thời gian, availability và dữ liệu.',
  a: `**Tóm tắt:** đồng bộ (REST/gRPC) hợp cho **query cần kết quả ngay** (latency thấp, dễ debug); bất đồng bộ (messaging) hợp cho **sự kiện và tác vụ phải sống sót khi phía kia đang chết**. Câu hỏi thật không phải "REST hay Kafka" mà là "ai cần biết kết quả ngay, ai chấp nhận chờ?". Với 20 service, tôi giữ đồng bộ cho đường đọc ngắn và dùng event cho phần còn lại để giảm availability coupling.

### Hiểu nhanh
Gọi điện thoại là giao tiếp đồng bộ: bạn phải chờ người kia nhấc máy, nếu họ bận thì bạn cũng bị kẹt. Gửi tin nhắn là bất đồng bộ: bạn gửi xong làm việc khác, người kia đọc khi rảnh. Muốn hỏi "còn hàng không?" để trả lời khách ngay thì gọi điện. Muốn báo "đơn đã giao" cho kế toán, kho, CSKH thì nhắn vào nhóm chung. Nếu cái gì cũng gọi điện cho 20 người, chỉ cần một người không nghe máy là cả việc bị treo.

### Thuật ngữ
- **Temporal coupling**: hai bên phải cùng đang chạy tại cùng thời điểm thì giao tiếp mới thành công.
- **Availability coupling**: service A lỗi khi service B lỗi.
- **Eventual consistency**: dữ liệu giữa các service sẽ khớp sau một khoảng thời gian, không khớp ngay lập tức.
- **gRPC**: framework RPC dùng HTTP/2 và Protocol Buffers (định dạng nhị phân có schema).
- **Protobuf field number**: số định danh field trong file .proto; dữ liệu nhị phân lưu theo số này chứ không theo tên.
- **Idempotency**: xử lý cùng một message nhiều lần vẫn cho kết quả như một lần.
- **202 Accepted**: HTTP status nghĩa là "đã nhận yêu cầu, sẽ xử lý sau".

### Ba loại coupling
| | Đồng bộ (REST/gRPC) | Bất đồng bộ (queue/topic) |
|---|---|---|
| **Time** | caller phải chờ, hai tiến trình chạy cùng lúc | hai bên lệch thời gian, broker làm bộ đệm chống spike |
| **Availability** | B chết thì A lỗi theo | B chết, message vẫn nằm ở broker, B xử lý khi hồi phục |
| **Data/format** | trả đúng schema bạn yêu cầu, contract chặt | chỉ chia sẻ event đã public, mỗi bên tự diễn giải |

1. **Availability coupling là thứ nguy hiểm nhất**. Chuỗi gọi đồng bộ A→B→C→D có xác suất thành công bằng **tích** xác suất từng mắt xích. Vì sao: chỉ cần một mắt xích lỗi là cả request lỗi.
2. **Time coupling** quyết định khả năng chịu spike: đồng bộ thì mọi tải dồn ngay vào downstream; bất đồng bộ thì broker giữ lại, consumer xử lý theo sức.
3. **Data coupling**: REST trả đúng field bạn cần nên hai bên phải đồng bộ contract; event chỉ nói "điều gì đã xảy ra", subscriber tự thêm logic của mình.

~~~text
Mỗi service sẵn sàng 99,9%:
  chuỗi đồng bộ 1 hop  : 99,9%
  chuỗi đồng bộ 5 hop  : 0,999^5  ≈ 99,5%   (~3,6 giờ lỗi/tháng)
  chuỗi đồng bộ 10 hop : 0,999^10 ≈ 99,0%   (~7,2 giờ lỗi/tháng)
~~~

### REST hay gRPC cho call đồng bộ
- **REST/JSON**: dễ đọc, dễ test bằng curl, là chuẩn HTTP, hợp edge/public API.
- **gRPC**: protobuf nhị phân, HTTP/2 multiplexing, payload nhỏ hơn đáng kể, codegen typed từ file {{.proto}}, hỗ trợ streaming; hợp service-to-service nội bộ. Hạn chế: browser không gọi trực tiếp được (cần gRPC-Web qua proxy như Envoy), khó debug bằng mắt, và đổi schema phải theo luật backward compatible của protobuf (không tái sử dụng field number, không đổi kiểu field).
- Với Spring Boot 3 có starter cộng đồng ({{net.devh}} grpc-spring-boot-starter, LogNet) và dự án chính thức **Spring gRPC**; trên Kubernetes thường dùng Envoy/Istio để load balance gRPC theo request (vì HTTP/2 giữ kết nối lâu, load balancer L4 sẽ dồn tải vào một pod).

### Khi nào chọn bất đồng bộ
1. **Tác vụ phụ** (gửi mail, ghi audit, invalidate cache): caller không cần kết quả.
2. **Nghiệp vụ kéo dài** (xử lý đơn mất 30 giây): trả 202 Accepted + id để client poll trạng thái hoặc nhận webhook.
3. **Nhiều consumer cùng quan tâm một sự kiện**, hoặc cần giữ event để replay.

### Lỗi hay gặp
1. **Dùng queue như RPC**. Triệu chứng: đẩy request vào queue rồi chờ reply topic, latency và độ phức tạp gấp đôi. Cách tránh: cần kết quả ngay thì gọi đồng bộ có timeout.
2. **Chuỗi event dài không ai thấy toàn cảnh**. Triệu chứng: order.created → payment.started → … sự kiện vòng lại, không ai biết đơn đang kẹt ở đâu. Cách tránh: flow nhiều bước thì cân nhắc orchestration và tracing.
3. **Quên eventual consistency ở UI**. Triệu chứng: người dùng bấm lưu rồi reload không thấy dữ liệu. Cách tránh: UI hiển thị "đang xử lý", không giả định ghi xong là đọc thấy ngay.
4. **Gọi đồng bộ không có timeout**. Triệu chứng: một downstream treo làm cạn thread pool của caller. Cách tránh: timeout ngắn cho call nội bộ + circuit breaker.

### Trả lời miệng 1 phút
"Tôi đánh giá theo ba loại coupling. Thời gian: đồng bộ buộc hai bên cùng sống cùng lúc. Availability: chuỗi đồng bộ có xác suất thành công bằng tích từng mắt xích, nên 10 hop mỗi cái 99,9% chỉ còn khoảng 99%. Dữ liệu: REST buộc contract chặt, event chỉ chia sẻ điều đã xảy ra. Vì vậy tôi dùng REST hoặc gRPC cho query cần kết quả ngay, gRPC cho nội bộ hiệu năng cao, còn tác vụ phụ, nghiệp vụ dài và fan-out thì dùng event. Trade-off của async là eventual consistency và phải có idempotency. Kinh nghiệm của tôi: call đồng bộ nào cũng phải có timeout và circuit breaker, message nào cũng phải idempotent."

### Ví dụ đời thực
  Hệ thống giao hàng 20 service: {{Client → API Gateway → Order Service → Payment Service → Shipping Service → Notification Service}}. Năm 2023, trong cao điểm trưa, Payment Service tăng latency từ 200ms lên 5s (do connection pool cạn). Triệu chứng: order request timeout, người dùng thấy "504 Gateway Timeout". Điều tra: {{kubectl top pods}} thấy payment-service CPU 95%, {{Jaeger trace}} thấy 3 hop đồng bộ (order → payment → shipping) mỗi hop thêm 1,5s; tính toán: 0,999^3 ≈ 99,7% success rate → khoảng 4,3 phút lỗi/ngày (hơn 2 giờ/tháng). Nguyên gốc: chuỗi đồng bộ 3 hop không chịu được spike, và availability coupling lan ra. Xử lý: (1) chuyển {{CreateShipment}} và {{SendInvoice}} từ đồng bộ sang Kafka event (bất đồng bộ, trả 202 Accepted ngay), (2) thêm circuit breaker với threshold 50% error, timeout 800ms, (3) payment-service scale từ 2 lên 6 pod. Kết quả: chuỗi đồng bộ còn 1 hop (order → payment), p99 giảm từ 5s xuống 600ms, và người dùng không còn thấy 504. Đây là minh chứng: availability coupling là thứ nguy hiểm nhất, và bất đồng bộ giải quyết được nó mà không làm mất tính tức thì của phần còn lại.

> Senior tip: đồng bộ luôn phải có timeout (thường dưới 1 giây cho call nội bộ), bất đồng bộ luôn phải có idempotency + chiến lược thứ tự. Thiếu một trong hai là bạn chưa xong.`,
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
  refs: [
    { type: 'doc', title: 'Pattern: Saga', url: 'https://microservices.io/patterns/data/saga.html' },
    { type: 'doc', title: 'Saga distributed transactions pattern (Azure)', url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga' },
  ],
  q: 'Một nghiệp vụ phải ghi dữ liệu ở 3 service khác nhau. Vì sao không dùng 2PC? Bạn thiết kế Saga theo choreography và orchestration như thế nào, và compensation xử lý failure ra sao?',
  a: `**Tóm tắt:** 2PC (two-phase commit) bắt mọi participant giữ lock và chờ coordinator quyết định; khi mạng có sự cố hay coordinator chết, participant bị **kẹt lock**. Nó đánh đổi availability và throughput để lấy nhất quán tức thời, quá đắt với workload online và nhiều broker/DB không hỗ trợ. Thay vào đó dùng **Saga**: chuỗi transaction cục bộ, mỗi bước có **compensation** (hành động bù) để lùi lại khi bước sau thất bại.

### Hiểu nhanh
2PC giống tổ chức đám cưới mà phải chờ **tất cả** khách xác nhận rồi mới đặt nhà hàng; trong lúc chờ, mọi khách phải giữ nguyên lịch, không được nhận việc khác. Chỉ cần người điều phối mất liên lạc là cả nhóm đứng chờ vô thời hạn. Saga giống đặt tour du lịch từng chặng: đặt vé máy bay, rồi khách sạn, rồi xe. Nếu khách sạn hết phòng, bạn **hủy vé máy bay** (có thể mất phí): đó là compensation. Không có "nút undo" thần kỳ, chỉ có hành động bù hợp lý.

### Thuật ngữ
- **2PC / XA**: giao thức commit hai pha; XA là chuẩn để DB/broker tham gia 2PC.
- **Coordinator / participant**: bên điều phối và các bên tham gia giao dịch.
- **Saga**: chuỗi local transaction, mỗi bước publish event/command để kích hoạt bước sau.
- **Compensation**: hành động nghiệp vụ đảo ngược tác động của một bước đã commit (refund, release stock).
- **Choreography**: các service tự phản ứng với event của nhau, không có trung tâm.
- **Orchestration**: một orchestrator ra lệnh từng bước và theo dõi trạng thái.
- **Semantic lock**: đánh dấu bản ghi "đang được saga xử lý" (ví dụ status PENDING) thay vì khóa DB.
- **Pivot transaction**: bước "điểm không quay lại"; sau bước này saga chỉ đi tiếp (retry), không compensate nữa.

### 2PC hoạt động thế nào và sập ở đâu
1. **Phase 1 – PREPARE**: coordinator hỏi mọi participant "sẵn sàng commit chưa?". Participant ghi log, **giữ lock**, trả lời YES/NO. Vì sao giữ lock: đã hứa YES thì phải bảo đảm commit được.
2. **Phase 2 – COMMIT/ROLLBACK**: nếu tất cả YES thì coordinator gửi COMMIT, có ai NO thì ROLLBACK.
3. **Điểm yếu**: nếu coordinator chết sau phase 1, participant không biết nên commit hay rollback nên **treo với lock**; các request khác chờ lock đó, hệ thống nghẽn dây chuyền.

~~~text
Coordinator: PREPARE ──► mọi participant giữ lock, ghi log
            ◄── VOTE yes/no
            COMMIT / ROLLBACK
   (coordinator chết ở đây → participant giữ lock vô hạn)
~~~
- Mỗi phase ít nhất một round-trip + ghi log xuống đĩa, nên throughput XA thường thấp hơn nhiều so với local transaction.
- Theo CAP, khi network partition phải chọn giữa nhất quán và sẵn sàng; hệ thống online thường chọn sẵn sàng. Ngoài ra Kafka, hầu hết REST API và nhiều NoSQL không tham gia XA được.

### Saga: chuỗi transaction cục bộ
~~~text
ReserveStock ─► ChargePayment ─► CreateShipment ─► SendInvoice
     │ fail          │ fail            │ fail
     ▼               ▼                 ▼
 ReleaseStock ◄── RefundPayment ◄── CancelShipment   (compensation)
~~~
1. Mỗi bước: **đọc state → validate → ghi local transaction → publish event/command** (nên dùng outbox để ghi DB và phát event nguyên tử).
2. Bước N thất bại không phục hồi được → chạy compensation từ N-1 về bước đầu. Vì sao ngược chiều: bù đúng thứ tự tránh trạng thái nửa vời (ví dụ refund trước khi hủy shipment).
3. Lỗi tạm thời (timeout) → **retry** trước, chỉ compensate khi chắc chắn thất bại.

### Choreography vs Orchestration
| | Choreography (event) | Orchestration (trung tâm) |
|---|---|---|
| Điều phối | không ai, mỗi service tự phản ứng | orchestrator ra lệnh từng bước |
| Coupling | thêm bước chỉ thêm consumer | orchestrator biết mọi bước |
| Quan sát | khó thấy luồng, phải dựa tracing | thấy trạng thái từng bước ngay |
| SPOF | không | orchestrator phải HA (state lưu DB) |
| Phù hợp | 3–4 service, flow ngắn, cùng team | flow dài, cross-team, cần timeout/retry tập trung |

Công nghệ Java: choreography dùng Kafka + Spring Kafka/Spring Cloud Stream; orchestration dùng Temporal (Java SDK), Camunda/Flowable, hoặc tự viết bằng bảng saga state + state machine.

### Compensation: phần hay bị đánh giá thấp
- **Không phải rollback**: tiền đã trừ phải bù bằng hành động kinh doanh (refund, voucher xin lỗi), có khi cần người duyệt.
- Compensation cũng có thể lỗi nên phải **idempotent + retry + DLQ + cảnh báo để xử lý tay**.
- Saga **thiếu isolation**: hai saga cùng đọc "còn 1 sản phẩm" rồi cùng reserve. Chống bằng semantic lock (status RESERVED), reservation có TTL, hoặc sắp xếp bước dễ fail lên trước pivot transaction.

### Lỗi hay gặp
1. **Không lưu saga log**. Triệu chứng: orchestrator restart, không biết đơn đang ở bước nào, phải sửa tay. Cách tránh: ghi trạng thái từng bước trong DB cùng transaction với lệnh gửi đi.
2. **Compensation không idempotent**. Triệu chứng: retry refund hai lần, khách nhận tiền gấp đôi. Cách tránh: mỗi lệnh mang saga id + step id, phía nhận khử trùng lặp.
3. **Compensate khi chỉ timeout**. Triệu chứng: payment thật ra đã thành công nhưng saga đã refund/hủy. Cách tránh: query trạng thái downstream trước khi quyết định.

### Trả lời miệng 1 phút
"Tôi không dùng 2PC vì participant phải giữ lock chờ coordinator; coordinator chết giữa hai phase là lock treo, throughput thấp, và Kafka hay REST API cũng không tham gia XA được. Tôi dùng Saga: mỗi service commit local transaction rồi phát event qua outbox, nếu một bước fail thì chạy compensation ngược lại như refund, release stock. Với flow ngắn 3 service cùng team tôi dùng choreography; flow dài, cross-team thì orchestration với Temporal hoặc bảng saga state để thấy rõ trạng thái và tập trung timeout. Trade-off là mất isolation, nên tôi dùng semantic lock và reservation có TTL. Kinh nghiệm của tôi: compensation phải idempotent và luôn có đường xử lý tay."

### Ví dụ đời thực
  Công ty bán hàng đa kênh (Order, Payment, Inventory) chạy Saga cho đơn hàng: ReserveStock → ChargePayment → CreateShipment. Năm 2023, trong Black Friday, Payment Service chậm 5s do connection pool cạn, và 10% payment fail. Saga orchestrator (Temporal) retry 3 lần rồi compensation: CancelShipment → RefundPayment → ReleaseStock. Triệu chứng: khách hàng nhận được 2 email "đơn hàng đã được tạo" và 1 email "đơn hàng đã bị hủy", nhưng trong DB đơn hàng ở trạng thái CANCELLED dù kho đã gửi hàng. Điều tra: Temporal workflow log thấy RefundPayment chạy 2 lần (retry + compensation overlap) vì payment service không idempotent; CancelShipment chạy trước khi CreateShipment hoàn thành (compensation thứ tự bị reverse). Nguyên gốc: compensation không idempotent và thứ tự compensation bị reverse do retry. Xử lý: (1) payment API thêm idempotency key (UUID client-side), (2) compensation enforce thứ tự: compensation chỉ chạy sau step N-1, (3) saga log lưu trong DB cùng transaction với orchestrator. Kết quả: sau 1 tuần, không còn double-refund; customer service ticket giảm từ 500 xuống 50/tuần. Đây là minh chứng: Saga mất isolation và compensation phải idempotent + đúng thứ tự.

> Senior tip: luôn lưu **saga log** (trạng thái từng bước) trong cùng DB với orchestrator, để sau crash biết chính xác đang ở bước nào. Không có log thì không ai dám restart.`,
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
  a: `**Tóm tắt:** ghi DB rồi publish event (hoặc ngược lại) là **hai thao tác trên hai hệ thống không chung transaction**: crash ở giữa sẽ làm event bị mất, hoặc sinh event "ảo" cho dữ liệu không tồn tại. Đó là dual-write problem. Giải pháp: ghi business row **và** bản ghi event vào bảng **outbox** trong **cùng một transaction DB**, rồi một tiến trình riêng (polling relay hoặc CDC như Debezium) đọc outbox và đẩy lên Kafka.

### Hiểu nhanh
Bạn vừa chốt một đơn hàng và phải làm hai việc: ghi vào sổ cái và gọi điện báo kho. Nếu bạn ghi sổ xong thì bị mất điện trước khi gọi, kho không bao giờ biết có đơn. Nếu gọi kho trước rồi mới ghi sổ mà ghi sổ thất bại, kho chuẩn bị hàng cho một đơn không tồn tại. Outbox là: ghi đơn **và** dòng "cần báo kho" vào **cùng một trang sổ**, xong một lần là chắc chắn cả hai cùng có. Sau đó một nhân viên chuyên trách (relay) đọc các dòng "cần báo" và gọi kho, gọi lại nếu chưa được.

Sơ đồ dưới đây: ghi DB và publish event qua CDC không mất:

~~~seq
title: Outbox + CDC: ghi event không mất
actors: App | OrdersDB | Debezium | Kafka | Consumer
App -> OrdersDB: save order + outbox row
OrdersDB --> App: commit
OrdersDB -> Debezium: WAL có outbox row
Debezium -> Kafka: publish order.created
Kafka --> Debezium: ack
Kafka -> Consumer: consumer nhận event
Consumer --> Kafka: commit offset
note Debezium..Kafka: restart → gửi lại, consumer idempotent
~~~

### Thuật ngữ
- **Dual write**: một thao tác nghiệp vụ ghi vào hai hệ thống độc lập (DB và broker) mà không có transaction chung.
- **Outbox table**: bảng trong cùng DB nghiệp vụ, chứa các event chờ gửi.
- **Relay / publisher**: tiến trình đọc outbox, gửi lên broker, đánh dấu đã gửi.
- **CDC (Change Data Capture)**: kỹ thuật bắt thay đổi dữ liệu bằng cách đọc log của DB thay vì query bảng.
- **WAL / binlog**: nhật ký ghi của PostgreSQL / MySQL, mọi thay đổi đều được ghi vào đây trước.
- **Debezium**: bộ CDC connector chạy trên Kafka Connect, đọc WAL/binlog và phát thành Kafka message.
- **Replication slot**: "bookmark" của PostgreSQL ghi nhớ một consumer logical replication đã đọc tới đâu.
- **At-least-once**: message được gửi ít nhất một lần, có thể bị trùng.

### Dual-write mất mát thế nào
~~~text
Cách sai A:  db.commit()  ──► crash ──► event KHÔNG bao giờ được gửi
Cách sai B:  publish ok   ──► tx.rollback() ──► event "ảo": báo đã tạo đơn nhưng DB không có
~~~
Không có transaction manager nào phối hợp DB và Kafka một cách thực tế (Kafka không hỗ trợ XA). Ngay cả {{@TransactionalEventListener(phase = AFTER_COMMIT)}} vẫn hỏng: commit xong, process chết trước khi publish thì event mất vĩnh viễn, không log nào chỉ ra.

### Outbox hoạt động từng bước
~~~java
@Transactional
public void placeOrder(OrderCmd cmd) {
    Order agg = Order.create(cmd);
    orderRepo.save(agg);                         // cùng 1 transaction với outbox
    outboxRepo.save(OutboxEvent.of(
        "Order", agg.getId(),                    // aggregateId => dùng làm Kafka key
        "order.created", toJson(agg)));          // payload
}   // commit: hoặc cả hai dòng cùng có, hoặc không dòng nào
~~~
1. **Ghi nguyên tử**: business row và outbox row commit cùng nhau. Vì sao: DB đảm bảo ACID trong một transaction, nên không còn trạng thái nửa vời.
2. **Relay đọc outbox**, có hai kiểu. (a) **Polling**: job {{@Scheduled}} chạy {{SELECT ... FOR UPDATE SKIP LOCKED LIMIT 100}} để nhiều instance không lấy trùng dòng; độ trễ khoảng 100ms–1s, thêm tải query cho DB. (b) **CDC (Debezium)**: đọc WAL qua replication slot (PostgreSQL) hoặc binlog (MySQL), nên không thêm tải query, độ trễ thấp và không phải sửa code domain. Outbox Event Router (SMT của Debezium) biến row thành event, chọn topic theo aggregate type và **đặt Kafka key = aggregateId** để giữ thứ tự theo aggregate.
3. **Gửi lên Kafka rồi mới đánh dấu đã gửi** (polling) hoặc lưu offset của connector (CDC). Vì sao thứ tự này: nếu crash sau khi gửi mà trước khi đánh dấu, lần sau sẽ gửi lại, tức là **trùng** chứ không **mất**.
4. **Consumer idempotent**: vì bước 3 có thể gửi trùng, consumer phải khử trùng lặp theo event id.

### Kiến trúc
~~~text
App ─► [orders DB: orders + outbox] ─(WAL / logical replication)─► Debezium (Kafka Connect)
                                                                        │
                                                                        ▼
                                                              topic: order.events (key = orderId)
                                                                        │
                                                              consumer (idempotent)
~~~

### Lỗi hay gặp
1. **Outbox phình to**. Triệu chứng: bảng outbox hàng trăm triệu dòng, polling chậm dần. Cách tránh: job dọn dòng đã gửi (giữ 7–30 ngày); với CDC có thể insert rồi xóa ngay trong cùng transaction vì Debezium vẫn đọc được sự kiện INSERT từ WAL.
2. **Consumer không idempotent**. Triệu chứng: connector restart, gửi lại event, consumer cộng tiền hai lần. Cách tránh: bảng processed_event hoặc upsert theo natural key.
3. **Sai thứ tự**. Triệu chứng: OrderCancelled xử lý trước OrderCreated. Cách tránh: Kafka key = aggregateId để mọi event cùng đơn vào một partition.
4. **Replication slot bị bỏ rơi**. Triệu chứng: connector dừng lâu, PostgreSQL giữ WAL không xóa được, đĩa đầy. Cách tránh: alert theo lag của slot, giới hạn {{max_slot_wal_keep_size}}.

### Trả lời miệng 1 phút
"Ghi DB và publish Kafka là dual write vì hai hệ thống không chung transaction: crash giữa hai bước thì hoặc mất event, hoặc phát event cho dữ liệu đã rollback, và AFTER_COMMIT listener cũng không cứu được. Tôi dùng Transactional Outbox: trong cùng transaction tôi ghi đơn hàng và một dòng outbox chứa event. Sau đó Debezium đọc WAL, dùng Outbox Event Router đẩy event ra topic với key là aggregateId để giữ thứ tự. Nếu không muốn vận hành Kafka Connect thì polling với SKIP LOCKED cũng ổn. Trade-off là at-least-once nên consumer phải idempotent. Thực tế tôi luôn giám sát lag của connector và replication slot, vì connector chết là business bị chậm theo."

### Ví dụ đời thực
  Hệ thống e-commerce 50 dev, Orders Service ghi PostgreSQL và publish event lên Kafka topic order.events sau khi commit. Năm 2023, một lần deploy mới thêm field discountId vào Order aggregate, developer viết: orderRepo.save(order); kafkaTemplate.send("order.events", order.getId(), order).get();. Kết quả: 1% request crash giữa hai bước (kafkaTemplate.send throw), event bị mất, và 0,5% trường hợp ngược lại: send đã thành công nhưng transaction bao ngoài rollback vì lỗi phía sau → event ảo (consumer nhận event của đơn không tồn tại trong DB). Triệu chứng: read model (dashboard doanh số) thiếu 1,5% đơn hàng, customer service không tìm thấy đơn. Điều tra: log thấy exception KafkaTimeoutException; audit log thấy order có nhưng event không có. Nguyên gốc: dual-write problem – hai hệ thống không chung transaction. Xử lý: (1) refactor placeOrder() dùng Transactional Outbox – ghi order + outbox row trong cùng @Transactional, (2) Debezium Outbox Event Router đọc WAL và publish order.events với key = orderId, (3) consumer idempotent (processed_event table). Kết quả: sau 2 tuần, không còn event mất hay event ảo; dashboard doanh số chính xác 99,99%; độ trễ thêm khoảng 100ms do relay. Đây là minh chứng: Outbox + CDC giải quyết dual-write bằng nguyên tử DB.

> Senior tip: dùng CDC cho outbox là chuyện bình thường, nhưng nó thêm một thành phần (Kafka Connect cluster) phải monitor như service thật: lag của connector cũng là lag của business.`,
  follow: [
    'Outbox và event table ở domain model có phải là một không, nên đặt trong schema nào?',
    'Debezium publish ra broker mà broker đang sập thì xử lý tiếp ra sao?',
    'Polling outbox với SKIP LOCKED hoạt động thế nào khi có nhiều instance app?'
  ],
  tags: ['outbox', 'CDC', 'Debezium', 'dual-write'],
  refs: [
    { type: 'doc', title: 'Pattern: Transactional outbox', url: 'https://microservices.io/patterns/data/transactional-outbox.html' },
    { type: 'doc', title: 'Debezium Outbox Event Router', url: 'https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html' },
  ]
},
{
  id: 'microservices-006',
  topic: 'microservices',
  level: 'senior',
  q: 'Làm sao để hệ thống "exactly-once hiệu quả" khi consumer crash giữa chừng? Giải thích idempotency key phía client, dedup phía consumer và tại sao exactly-once end-to-end là bất khả thi.',
  a: `**Tóm tắt:** exactly-once **end-to-end** qua mạng là bất khả thi, vì bên gửi không phân biệt được "message bị mất" với "message tới rồi nhưng ack bị mất" (biến thể của bài toán Two Generals). Thứ ta thật sự làm là **at-least-once + xử lý idempotent = exactly-once effect**: message có thể đến 2 lần nhưng hệ quả nghiệp vụ chỉ xảy ra 1 lần. Hai công cụ chính: **idempotency key** do client gửi, và **dedup/upsert** ở consumer, đặt trong **cùng transaction** với business write.

### Hiểu nhanh
Bạn chuyển khoản qua app, mạng chập chờn, app quay mãi rồi báo lỗi. Bạn không biết tiền đã đi hay chưa, nên bấm lại. Nếu ngân hàng xử lý "ngây thơ", bạn mất tiền hai lần. Ngân hàng tử tế gán cho mỗi lệnh một **mã phiếu** (idempotency key): lần bấm thứ hai mang cùng mã, ngân hàng tra sổ thấy "mã này đã làm rồi" và trả lại đúng biên lai cũ. Đó là exactly-once effect: gửi nhiều lần, tiền chỉ đi một lần.

Sơ đồ dưới đây: idempotency key prevents double charge:

~~~seq
title: Idempotency key: gửi nhiều lần chỉ charge 1
actors: Client | API | PaymentGW | IdemTable
Client -> API: POST /charge (key K)
API -> IdemTable: insert key K (unique)
IdemTable --> API: ok → xử lý
API -> PaymentGW: charge với key K
PaymentGW --> API: receipt
API -> IdemTable: lưu response
Client -> API: retry POST /charge (key K)
API -> IdemTable: tìm thấy K → trả response cũ
~~~

### Thuật ngữ
- **At-most-once / at-least-once / exactly-once**: message được xử lý tối đa 1 lần / ít nhất 1 lần / đúng 1 lần.
- **Idempotent**: thực hiện nhiều lần cho kết quả giống như một lần.
- **Idempotency key**: mã duy nhất client sinh cho mỗi lệnh, gửi kèm để server nhận ra request trùng.
- **Dedup table**: bảng lưu id message đã xử lý để bỏ qua bản trùng.
- **Idempotent producer** ({{enable.idempotence}}): Kafka gán sequence number cho mỗi message để broker loại bản trùng do producer retry.
- **Transactional producer**: producer Kafka ghi nhiều message + commit offset trong một transaction Kafka.
- **read_committed**: chế độ consumer chỉ đọc message thuộc transaction đã commit.

### Ba semantics
| Semantics | Cách đạt | Hệ quả |
|---|---|---|
| At-most-once | commit offset/ack trước rồi mới xử lý | mất message khi crash |
| At-least-once | xử lý xong mới ack, lỗi thì retry | **trùng lặp**, là mặc định thực tế của Kafka/RabbitMQ |
| Exactly-once end-to-end | không thể chỉ bằng broker | cần idempotency ở hai đầu |

Kafka có exactly-once **trong phạm vi Kafka**: idempotent producer (mặc định bật từ Kafka 3.0) chống trùng do retry, transactional producer ghi output + offset nguyên tử, consumer {{isolation.level=read_committed}}. Mô hình này đúng cho luồng **đọc topic → ghi topic** (như Kafka Streams). Nhưng nếu side effect nằm ngoài Kafka (ghi DB, gọi HTTP), Kafka không biết, nên vòng lặp phải được đóng ở application.

### Vì sao consumer crash gây trùng (từng bước)
1. Consumer poll message offset 41, ghi DB thành công.
2. Consumer crash **trước khi** commit offset 42.
3. Rebalance, consumer khác đọc lại từ offset đã commit cuối (41).
4. Message 41 được xử lý lần hai. Vì sao không tránh được: ghi DB và commit offset Kafka là hai hệ thống khác nhau, giống dual write.

~~~text
poll(41) ─► DB commit ─► CRASH ─╳─ commitOffset(42)
                         rebalance ─► poll(41) lần 2 ─► cần dedup!
~~~

### 1) Idempotency key phía client
Client sinh UUID, gửi kèm header {{Idempotency-Key}}; server **insert key trước** với ràng buộc unique, rồi mới làm side effect và lưu response:

~~~java
@Transactional
public Receipt charge(String key, ChargeCmd cmd) {
    Optional<IdemRecord> old = idemRepo.findByKey(key);
    if (old.isPresent()) return old.get().response();   // trùng: trả kết quả cũ
    idemRepo.insert(key, hash(cmd));   // UNIQUE(key): 2 request song song => 1 cái lỗi duplicate
    Receipt r = payments.charge(cmd);   // side effect trong DB của mình
    idemRepo.saveResponse(key, r);      // cùng transaction
    return r;
}
~~~
- Lưu **kèm response** để request trùng nhận đúng kết quả cũ, không chạy lại side effect.
- Key có **scope theo endpoint + khách hàng**, có TTL (ví dụ 24h); trùng key nhưng payload khác (so hash) thì trả 422, đừng im lặng chạy.
- Theo HTTP, POST không idempotent còn PUT/DELETE có; nhưng trong hệ phân tán vẫn nên gắn key cho mọi lệnh liên quan đến tiền.

### 2) Consumer idempotent
1. **Dedup theo message id**: bảng {{processed_msg(msg_id PK)}}, insert trước khi xử lý, conflict thì bỏ qua. Phải nằm **cùng transaction** với business write, nếu không crash giữa hai bước vẫn lặp.
2. **Natural key upsert**: nếu nghiệp vụ có khóa tự nhiên thì không cần bảng dedup (xem SQL bên dưới).
3. **Commit offset sau khi transaction DB commit** (Spring Kafka {{AckMode.RECORD}} hoặc BATCH mặc định đều commit sau khi listener trả về).

~~~sql
INSERT INTO ledger(order_id, amount) VALUES (:id, :amt)
ON CONFLICT (order_id) DO NOTHING;   -- MySQL: INSERT IGNORE / ON DUPLICATE KEY UPDATE
~~~

### Lỗi hay gặp
1. **Retry ở nhiều tầng cùng lúc** (client + framework + broker). Triệu chứng: số bản sao nhân lên, bảng dedup phình. Cách tránh: chọn một tầng chịu trách nhiệm retry chính.
2. **Side effect ngoài DB** (gọi API bên thứ ba) mà dedup flag commit sau đó. Triệu chứng: crash giữa hai chỗ = trừ tiền hai lần thật. Cách tránh: truyền idempotency key sang bên thứ ba, hoặc ghi trạng thái PENDING trước rồi đối soát.
3. **TTL dedup quá ngắn** so với độ trễ tối đa có thể có (retry, replay vài giờ). Triệu chứng: trùng lặp quay lại sau khi key hết hạn. Cách tránh: TTL lớn hơn thời gian retention/replay.
4. **Check-then-insert không có unique constraint**. Triệu chứng: hai request song song cùng thấy "chưa có" và cùng chạy. Cách tránh: dựa vào UNIQUE của DB, không dựa vào if.

### Trả lời miệng 1 phút
"Exactly-once end-to-end là không thể vì bên gửi không phân biệt được mất message với mất ack, nên mọi hệ thống thực tế đều là at-least-once. Tôi biến nó thành exactly-once effect bằng idempotency. Ở API, client gửi Idempotency-Key, server insert key với unique constraint, xử lý và lưu response trong cùng transaction, request trùng nhận lại response cũ. Ở consumer, tôi dedup theo message id hoặc upsert theo natural key, cùng transaction với business write, rồi mới commit offset. Kafka transactions chỉ cho exactly-once trong luồng topic sang topic. Kinh nghiệm của tôi là đo số bản trùng bị chặn: nó khác 0 là bình thường."

### Ví dụ đời thực
  Hệ thống thanh toán fintech: client gọi POST /charges với Idempotency-Key header. Năm 2023, một lần network chập chờn, client retry 3 lần cùng key. Server code cũ: check key → nếu chưa có thì charge → lưu response. Kết quả: 2% request bị charge 2 lần (do check-then-insert race: 2 request song song cùng thấy key chưa có, cùng gọi payment gateway). Triệu chứng: khách hàng bị trừ tiền 2 lần, ticket tăng 300/tuần. Điều tra: payment gateway report thấy 2 charge với cùng merchant_reference; server log thấy 2 request cùng timestamp, cả 2 đều insert key thành công (do không có UNIQUE constraint). Nguyên gốc: check-then-insert không atomic, và không có UNIQUE constraint. Xử lý: (1) idemRepo.insert(key, hash) với UNIQUE(key) – request thứ hai nhận DuplicateKeyException, (2) lưu response trong cùng transaction, (3) retry request nhận lại response cũ. Kết quả: sau 1 tuần, double-charge xuống 0; ticket giảm còn 10/tuần. Đây là minh chứng: idempotency key phải dựa trên UNIQUE constraint của DB, không dựa vào check-then-insert.

> Senior tip: measure = số bản ghi trùng/"duplicate suppressed" mỗi phút. Con số này luôn khác 0 trong hệ thống healthy; bằng 0 nghĩa là bạn chưa bật retry, không phải là bạn đã exactly-once.`,
  follow: [
    'Idempotency key nên lưu trong Redis hay DB, vì sao?',
    'Nếu side effect là gọi REST phía thứ ba không hỗ trợ idempotency, bạn làm gì?',
    'Offset commit trước hay sau khi xử lý? Chọn từng lựa chọn thì đánh đổi gì?'
  ],
  tags: ['idempotency', 'delivery semantics', 'exactly-once', 'retry'],
  refs: [
    { type: 'doc', title: 'Pattern: Idempotent Consumer', url: 'https://microservices.io/patterns/communication-style/idempotent-consumer.html' },
    { type: 'doc', title: 'Kafka design: Message delivery semantics', url: 'https://kafka.apache.org/documentation/#semantics' },
  ]
},
{
  id: 'microservices-007',
  topic: 'microservices',
  level: 'senior',
  q: 'Bạn cấu hình resilience cho một service gọi 10 downstream qua Resilience4j (Spring Boot 3) thế nào? Thứ tự áp timeout, retry, circuit breaker, bulkhead, fallback và vì sao?',
  a: `**Tóm tắt:** nguyên tắc bất di bất dịch: **mọi call mạng đều có timeout**; retry chỉ cho thao tác idempotent, có backoff + jitter và số lần giới hạn; **circuit breaker** để fail fast khi dependency đã yếu; **bulkhead** để một dependency chết không kéo sập toàn bộ thread pool; **fallback** là lớp cuối cùng để degrade có kiểm soát. Với 10 downstream, mỗi downstream có **instance cấu hình riêng** (tên riêng), vì mỗi cái có SLA và tính chất khác nhau.

### Hiểu nhanh
Hãy nghĩ tới tổng đài chăm sóc khách hàng gọi ra cho 10 đối tác. **Timeout**: gọi quá 30 giây không ai nghe thì cúp máy. **Retry**: cúp rồi thử lại, nhưng chờ một lúc và tối đa 3 lần, không gọi dồn dập. **Circuit breaker**: nếu đối tác X 10 cuộc thì 6 cuộc không nghe, tạm ngừng gọi X trong 30 giây, khách hỏi tới X thì báo ngay "đang bận". **Bulkhead**: chỉ cho tối đa 5 nhân viên cùng gọi X, để X có "treo máy" thì các nhân viên còn lại vẫn phục vụ đối tác khác. **Fallback**: khi không gọi được, trả lời khách bằng thông tin dự phòng.

Sơ đồ dưới đây: chuỗi call có timeout, breaker, fallback:

~~~seq
title: Resilience4j: timeout → breaker → fallback
actors: Client | OrderSvc | PaymentAPI | Fallback
Client -> OrderSvc: charge(order)
OrderSvc -> PaymentAPI: POST /charges
PaymentAPI --> OrderSvc: 201 receipt
OrderSvc --> Client: receipt
note OrderSvc..Fallback: timeout/lỗi → breaker mở
OrderSvc -> Fallback: trả receipt.pending
Fallback --> Client: degrade an toàn
~~~

### Thuật ngữ
- **Timeout / TimeLimiter**: giới hạn thời gian chờ một call; TimeLimiter của Resilience4j dùng cho call bất đồng bộ (CompletableFuture).
- **Retry với exponential backoff + jitter**: chờ tăng dần giữa các lần thử (200ms, 400ms, 800ms) cộng thêm ngẫu nhiên để các client không thử lại cùng lúc.
- **Circuit breaker**: công tắc có 3 trạng thái CLOSED (gọi bình thường), OPEN (chặn ngay), HALF_OPEN (cho vài call thử).
- **CallNotPermittedException**: exception Resilience4j ném ra khi breaker đang OPEN.
- **Bulkhead**: giới hạn số call đồng thời tới một dependency (semaphore hoặc thread pool riêng).
- **Fallback**: hàm thay thế chạy khi call chính thất bại.
- **Transient error**: lỗi tạm thời (timeout, 503, connection reset), thử lại có thể thành công.

### Thứ tự và lý do
Với annotation, Resilience4j áp thứ tự mặc định (ngoài cùng → trong cùng):
~~~text
Retry ( CircuitBreaker ( RateLimiter ( TimeLimiter ( Bulkhead ( call ) ) ) ) )
~~~
Muốn khác thì chỉnh các property {{resilience4j.retry.retryAspectOrder}}, {{resilience4j.circuitbreaker.circuitBreakerAspectOrder}}… (số lớn hơn = ưu tiên cao hơn, nằm ngoài hơn) hoặc dùng API functional {{Decorators}}.

1. **Timeout ở trong cùng, áp cho từng lần gọi**. Vì sao: không lần thử nào được chờ vô hạn. Với call đồng bộ, đặt timeout ngay ở HTTP client (connect + read timeout của {{RestClient}}/{{WebClient}}); {{@TimeLimiter}} chỉ dùng cho method trả về {{CompletableFuture}}.
2. **Circuit breaker bọc ngoài timeout**. Vì sao: mỗi timeout/lỗi được breaker đếm vào tỉ lệ lỗi; đủ ngưỡng thì mở mạch.
3. **Retry ở ngoài circuit breaker**. Vì sao: mỗi lần thử đều đi qua breaker; khi breaker OPEN, retry nhận {{CallNotPermittedException}}, phải cấu hình retry **bỏ qua** exception này để không dội thêm tải vào service đang hấp hối.
4. **Bulkhead**: giới hạn số call đồng thời. Semaphore thì nhẹ, chạy trên thread của caller; thread pool thì cô lập hẳn nhưng tốn thread và thêm độ trễ xếp hàng.
5. **Fallback chạy cuối cùng**: trả cache cũ, giá trị mặc định hoặc trạng thái "đang xử lý". Fallback **không được gọi network** (trừ khi có timeout riêng), nếu không nó cũng có thể treo.

~~~java
@Service
class PaymentClient {
    @CircuitBreaker(name = "paymentApi", fallbackMethod = "fallback")
    @Bulkhead(name = "paymentApi")
    @Retry(name = "paymentApi")
    public Receipt charge(ChargeCmd cmd) {
        // RestClient đã cấu hình connect 300ms, read 800ms
        return rest.post().uri("/charges").body(cmd).retrieve().body(Receipt.class);
    }
    // cùng tham số + Throwable ở cuối thì Resilience4j tự nối fallback
    private Receipt fallback(ChargeCmd cmd, Throwable t) {
        return Receipt.pending(cmd.orderId());   // degrade, KHÔNG gọi API nào khác
    }
}
~~~

~~~yaml
resilience4j:
  circuitbreaker:
    instances:
      paymentApi:
        slidingWindowSize: 100          # 100 lượt gọi gần nhất (count-based)
        minimumNumberOfCalls: 20        # chưa đủ 20 call thì chưa đánh giá
        slowCallDurationThreshold: 2s   # call chậm hơn 2s cũng tính là "xấu"
        slowCallRateThreshold: 50
        failureRateThreshold: 50        # mở mạch khi > 50% lỗi
        waitDurationInOpenState: 30s    # nghỉ 30s rồi sang HALF_OPEN
        permittedNumberOfCallsInHalfOpenState: 10
  retry:
    instances:
      paymentApi:
        maxAttempts: 3                  # tổng cộng 3 lần, kể cả lần đầu
        waitDuration: 200ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        enableRandomizedWait: true      # jitter
        randomizedWaitFactor: 0.5
        ignoreExceptions:
          - io.github.resilience4j.circuitbreaker.CallNotPermittedException
  bulkhead:
    instances:
      paymentApi:
        maxConcurrentCalls: 25          # nhỏ hơn hẳn số thread xử lý của service
~~~

### Ví dụ số liệu
~~~text
Request tổng có deadline 3s.
read timeout 800ms × 3 lần + backoff 200ms + 400ms ≈ 3,0s  → đã chạm deadline
=> giảm maxAttempts = 2 hoặc read timeout = 600ms
Tomcat 200 thread, 10 downstream: bulkhead 25/downstream
=> 1 downstream treo chỉ giữ tối đa 25 thread, 175 thread còn phục vụ chỗ khác
~~~

### Nguyên tắc cấu hình
- **Timeout × số lần thử < deadline tổng** của request.
- Chỉ retry lỗi **transient** (connect, 503, timeout); đừng retry 400/401/422 vì là lỗi phía bạn, retry chỉ tăng tải.
- Chỉ retry thao tác **idempotent**; thao tác ghi tiền phải kèm idempotency key.
- **Fallback không che giấu sự cố**: vẫn ghi metric/log; tỉ lệ fallback tăng thì phải có alert.

### Lỗi hay gặp
1. **Dùng chung một instance cấu hình cho cả 10 downstream**. Triệu chứng: một service lỗi làm breaker mở cho cả các service khỏe. Cách tránh: mỗi downstream một instance name.
2. **Retry không bỏ qua CallNotPermittedException**. Triệu chứng: log đầy retry vô ích khi breaker đã mở. Cách tránh: {{ignoreExceptions}} như cấu hình trên.
3. **Gọi method có annotation từ chính class đó**. Triệu chứng: annotation không có tác dụng. Vì sao: Resilience4j dùng Spring AOP proxy, self-invocation bỏ qua proxy. Cách tránh: tách sang bean khác.
4. **Không có HTTP timeout**. Triệu chứng: breaker không bao giờ mở vì call không bao giờ kết thúc. Cách tránh: luôn đặt connect/read timeout.

### Trả lời miệng 1 phút
"Với 10 downstream tôi tạo instance Resilience4j riêng cho từng cái. Từ trong ra ngoài: timeout ở HTTP client cho từng lần gọi, circuit breaker đếm lỗi và call chậm để mở mạch, retry ở ngoài cùng chỉ cho lỗi transient và thao tác idempotent, có exponential backoff với jitter và bỏ qua CallNotPermittedException. Bulkhead giới hạn số call đồng thời để một dependency treo không ăn hết thread pool, và fallback trả dữ liệu degrade mà không gọi mạng. Trade-off là cấu hình phức tạp, nên tôi tính để timeout nhân số lần thử nhỏ hơn deadline tổng. Kinh nghiệm của tôi: luôn có alert theo tỉ lệ fallback và trạng thái breaker."

### Ví dụ đời thực
    Hệ thống giao hàng 10 downstream, trong đó payment-service là nút thắt. Năm 2023, cao điểm trưa, payment-service tăng latency từ 200ms lên 5s do connection pool cạn. Triệu chứng: order-service trả về 504, người dùng thấy "thanh toán thất bại" dù payment thật ra đã nhận. Điều tra: metric resilience4j.circuitbreaker.failure.rate của paymentApi đạt 60% (vượt ngưỡng 50%), {{resilience4j.bulkhead.available.concurrent.calls}} về 0 (tất cả 25 slot đã dùng), và log thấy retry 3 lần với backoff 200ms–800ms cho mỗi request → mỗi request giữ thread tới 3s. Nguyên gốc: timeout 800ms × 3 retry + backoff ≈ 3s, bulkhead 25 cho payment-service ngăn cạn thread pool 200 của order-service khi payment chậm; circuit breaker phản ứng chậm vì slidingWindowSize 100 là count-based nên phải đủ call trong window mới đánh giá failure rate, trong khi các call đã bị bulkhead từ chối từ trước. Xử lý: (1) giảm read timeout xuống 400ms và maxAttempts còn 2 (tổng ≤ 1,2s, nằm trong deadline 3s), (2) bật jitter với randomizedWaitFactor 0.5 để các client không retry đồng lúc, (3) circuit breaker failureRateThreshold 50% + waitDurationInOpenState 30s, (4) giữ bulkhead 25 cho payment-service riêng, (5) fallback trả Receipt.pending và ghi metric. Kết quả: sau 1 tuần, p99 giảm từ 5s xuống 600ms, tỉ lệ fallback từ 8% xuống 0,5%, và circuit breaker tự mở rồi đóng đúng khi payment phục hồi. Đây là minh chứng: timeout × retry phải nhỏ hơn deadline tổng, và fallback phải được đo, không được im lặng.

  > Senior tip: chạy thử nghiệm fault injection (chaos test: kill 1 pod, cắt network, thêm độ trễ) trước khi lên production. Cấu hình resilience đọc thì đúng nhưng không ai tin cho tới khi bạn thấy nó tự cứu cụm một lần.`,
  follow: [
    'Retry nên đặt ngoài hay trong circuit breaker? Bạn biện minh cho lựa chọn của mình ra sao?',
    'Bulkhead theo semaphore khác thread pool khi nào, và nhược điểm từng loại?',
    'Fallback cache cũ có rủi ro gì với dữ liệu tài chính?'
  ],
  tags: ['Resilience4j', 'circuit breaker', 'bulkhead', 'timeout'],
  refs: [
    { type: 'doc', title: 'Resilience4j CircuitBreaker', url: 'https://resilience4j.readme.io/docs/circuitbreaker' },
    { type: 'doc', title: 'Resilience4j Bulkhead', url: 'https://resilience4j.readme.io/docs/bulkhead' },
    { type: 'doc', title: 'Spring Cloud Circuit Breaker', url: 'https://docs.spring.io/spring-cloud-circuitbreaker/reference/' },
  ]
},
{
  id: 'microservices-008',
  topic: 'microservices',
  level: 'senior',
  q: 'Đêm qua một dependency chậm dần, cả hệ thống timeout rồi cụm chết theo. Đây là retry storm/cascading failure thế nào? Bạn ngăn bằng những gì?',
  a: `**Tóm tắt:** đây là **retry amplification** dẫn tới **cascading failure**: mỗi tầng retry 3 lần thì dependency nhận tới 4 lần tải đúng lúc nó đang yếu; thêm timeout quá dài làm thread của upstream bị giữ lâu, **thread pool cạn kiệt**, và service vô tội chết dù bản thân không có lỗi. Ngăn bằng: timeout ngắn trong một deadline tổng, retry có giới hạn + jitter + retry budget, circuit breaker, bulkhead, backpressure (429/503 + Retry-After) và health check không phụ thuộc downstream.

Sơ đồ dưới đây: retry storm khi dependency B chậm:

~~~seq
title: Retry storm: 3 retry × 3 tầng
actors: Client | C | A | B
Client -> C: request
C -> A: request
A -> B: call
B --> A: slow
A -> B: retry 1
A -> B: retry 2
A -> B: retry 3
C -> A: retry 1
C -> A: retry 2
C -> A: retry 3
Client -> C: retry 1
Client -> C: retry 2
Client -> C: retry 3
note A..B: B nhận tới 64 call → thread pool cạn
~~~

### Hiểu nhanh
Một quầy thu ngân bị chậm vì máy in hóa đơn kẹt. Người xếp hàng sốt ruột, cứ 10 giây lại có người chen lên hỏi "xong chưa?", mỗi câu hỏi làm thu ngân chậm thêm. Hàng dài ra, tràn sang quầy bên cạnh, cả siêu thị tắc. Đó là retry storm. Cách xử lý đúng: treo biển "quầy tạm dừng, quay lại sau 5 phút" (circuit breaker + Retry-After), giới hạn số người được hỏi lại (retry budget), và tách hàng riêng cho từng quầy (bulkhead) để quầy kẹt không làm tắc cả siêu thị.

### Thuật ngữ
- **Cascading failure**: lỗi lan dây chuyền từ một service sang các service gọi nó.
- **Retry amplification**: tải bị nhân lên do nhiều tầng cùng retry (3 tầng × 3 lần = tới 27 call cho 1 request gốc).
- **Thundering herd**: nhiều client cùng thức dậy và gọi lại đúng một thời điểm.
- **Jitter**: thêm độ trễ ngẫu nhiên vào thời gian chờ retry để rải đều các lần thử.
- **Retry budget**: giới hạn tỉ lệ retry so với traffic gốc (ví dụ tối đa 10%).
- **Backpressure**: cơ chế phía nhận báo cho phía gửi chậm lại thay vì nhận hết rồi nghẹt.
- **Deadline propagation**: truyền "thời gian còn lại" của request xuống các tầng dưới.
- **AIMD**: tăng dần đều, giảm theo cấp số nhân (như TCP) khi điều chỉnh mức đồng thời.

### Chuỗi sự cố từng bước
1. **Dependency B chậm** (GC pause, DB lock): thời gian phản hồi từ 200ms lên 20s. Vì sao nguy hiểm: chậm còn tệ hơn chết, vì caller vẫn chờ.
2. **A có timeout 30s + retry 3 lần**: mỗi request giữ một thread tới khoảng 90s. Vì sao: thread bị chiếm suốt thời gian chờ.
3. **Thread pool 200 của A cạn**: request mới xếp hàng, A coi như chết dù CPU rảnh.
4. **C, D gọi A cùng kịch bản**: lỗi lan ra toàn cụm. Vì sao: mỗi tầng lại retry, tải nhân lên theo cấp số nhân.
5. **Liveness probe chậm**: Kubernetes restart hàng loạt pod, pod mới khởi động lại nhận tải nặng nên chết tiếp (restart storm).

~~~text
Tải B nhận được khi B chậm:
  client ─(3 retry)─► C ─(3 retry)─► A ─(3 retry)─► B
  1 request gốc  →  tối đa 4 × 4 × 4 = 64 call vào B
Thread A: 200 thread / (90s mỗi request) ≈ 2,2 request/giây → sập ở tải thường
~~~

### Ngăn chặn
1. **Timeout ngắn + deadline tổng**: tổng thời gian các lần retry không vượt budget của request. Đã quá deadline thì **đừng retry**, vì chỉ chiếm tài nguyên của request đến sau.
2. **Jitter bắt buộc**: {{delay = random(0, min(cap, base * 2^attempt))}} (full jitter). Vì sao: không jitter thì mọi client retry đồng loạt, đúng lúc B vừa hồi phục lại bị đánh sập.
3. **Retry budget**: retry chỉ chiếm khoảng 10% traffic bình thường (Envoy có retry budget; AWS SDK có retry quota dạng token bucket). Vì sao: retry không bao giờ được lớn hơn traffic gốc.
4. **Retry ở một tầng duy nhất**: thường là tầng gần client nhất hoặc gần dependency nhất, không phải mọi tầng.
5. **Circuit breaker**: mở khi failure/slow-call rate cao, fail fast trong vài chục giây thay vì giữ thread chờ.
6. **Bulkhead**: mỗi downstream một giới hạn đồng thời riêng, không dùng chung thread.
7. **Backpressure**: trả 429/503 kèm {{Retry-After}} để caller tự chậm lại, thay vì nhận hết rồi xếp hàng nội bộ vô hạn.
8. **Không retry thao tác không idempotent**; nếu phải retry thì kèm idempotency key.
9. **Adaptive concurrency** (AIMD, hoặc chế độ retry "adaptive" của AWS SDK có client-side rate limiting): tự hạ số call đồng thời khi lỗi tăng.
10. **Liveness probe không kiểm tra downstream**: chỉ kiểm tra tiến trình còn sống; downstream chết không phải lý do restart pod.

### Phát hiện trước khi sập
- Metric: số retry, số timeout, thread pool active/max, độ sâu hàng đợi, p99 latency **theo từng dependency** (không chỉ tổng thể).
- Trace: một span cha có nhiều span con giống nhau = dấu hiệu retry; fan-out bất thường = cascade sớm.
- Alert theo **triệu chứng** (error rate, latency p99) chứ không chỉ theo nguyên nhân (CPU).

### Lỗi hay gặp
1. **Timeout mặc định vô hạn hoặc 30–60s**. Triệu chứng: thread dump đầy thread chờ socket read. Cách tránh: đặt timeout dựa trên p99 thực tế của downstream (ví dụ p99 300ms thì timeout 1s).
2. **Retry ở cả gateway, service và client library**. Triệu chứng: B nhận tải gấp hàng chục lần khi có sự cố. Cách tránh: thống nhất một tầng retry, các tầng khác tắt.
3. **Liveness probe gọi DB/downstream**. Triệu chứng: DB chậm làm Kubernetes restart toàn bộ pod. Cách tránh: kiểm tra dependency ở readiness hoặc không kiểm tra.
4. **Autoscale khi dependency là nút thắt**. Triệu chứng: thêm pod A chỉ tăng thêm tải vào B. Cách tránh: scale theo nút thắt thật, kết hợp circuit breaker.

### Trả lời miệng 1 phút
"Sự cố này là retry storm dẫn tới cascading failure. Khi B chậm, A với timeout dài và retry 3 lần giữ thread rất lâu, thread pool cạn và A chết; các service gọi A cũng retry nên tải vào B nhân lên theo cấp số nhân. Tôi ngăn bằng timeout ngắn nằm trong deadline tổng, retry chỉ ở một tầng với exponential backoff có jitter và retry budget khoảng 10%, circuit breaker để fail fast, bulkhead riêng cho từng downstream, và trả 429 hoặc 503 kèm Retry-After để caller chậm lại. Liveness probe không được kiểm tra downstream. Trade-off là người dùng thấy lỗi sớm hơn, nhưng hệ thống sống sót và tự hồi phục nhanh hơn."

### Ví dụ đời thực
    Hệ thống thanh toán 15 service, order-service gọi payment-service và shipping-service. Năm 2023, một lần deploy mới thêm retry 3 lần ở cả gateway và order-service (2 tầng retry). Ca trưa, payment-service tăng latency từ 200ms lên 3s do connection pool cạn. Triệu chứng: order-service thread pool 200 cạn, người dùng thấy "502 Bad Gateway"; metric {{resilience4j.retry.total}} tăng 10 lần, {{thread.pool.active}} đạt 200/200. Điều tra: trace Jaeger thấy mỗi request gốc tạo ra 4 × 4 = 16 call vào payment-service (gateway retry 3 + order retry 3), và thread dump thấy 200 thread đều đang wait trên socket read với timeout 30s. Nguyên gốc: retry ở nhiều tầng cùng lúc (retry amplification) và timeout 30s quá dài khiến thread giữ lâu; liveness probe của order-service gọi payment-service nên Kubernetes restart pod khi payment chậm, pod mới khởi động lại nhận tải nặng nên chết tiếp (restart storm). Xử lý: (1) retry chỉ ở gateway, tắt retry ở order-service, (2) timeout giảm xuống 1s theo p99 thực tế, (3) circuit breaker failureRateThreshold 60% + waitDurationInOpenState 15s, (4) bulkhead 15 cho payment-service, (5) trả 429 kèm Retry-After để caller chậm lại, (6) liveness probe không kiểm tra downstream. Kết quả: sau 2 giờ, hệ thống tự hồi phục, thread pool không còn cạn, và metric retry giảm về mức bình thường. Đây là minh chứng: retry ở nhiều tầng cùng lúc là nhân tử tải, và timeout dài còn nguy hiểm hơn timeout ngắn.

  > Senior tip: quy tắc vàng khi on-call: "khi một service chậm, hãy giảm tải cho nó, không phải tăng retry". Retry là thuốc an thần cho developer và là thuốc độc cho hệ thống đang yếu.`,
  follow: [
    'Retry budget tính cụ thể ra sao trong code của bạn?',
    'Vì sao timeout quá dài còn nguy hiểm hơn timeout quá ngắn?',
    'Làm sao phân biệt retry storm với lưu lượng thật sự tăng trong dashboard?'
  ],
  tags: ['retry storm', 'cascading failure', 'backpressure', 'thundering herd'],
  refs: [
    { type: 'article', title: 'Timeouts, retries, and backoff with jitter (Amazon Builders Library)', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' },
    { type: 'book', title: 'Google SRE Book: Addressing Cascading Failures', url: 'https://sre.google/sre-book/addressing-cascading-failures/' },
  ]
},
{
  id: 'microservices-009',
  topic: 'microservices',
  level: 'senior',
  q: 'Giải thích cách Kafka đảm bảo ordering trong partition, cơ chế consumer group, offset commit và rebalancing. Sau đó nói về delivery semantics và cách xử lý poison pill bằng DLQ.',
  a: `**Tóm tắt:** Kafka là một **log phân tán được chia thành partition**: thứ tự chỉ được đảm bảo **trong một partition**, và trong một consumer group mỗi partition chỉ được giao cho đúng một consumer. At-least-once là mô hình thực tế (xử lý xong mới commit offset), nên consumer phải idempotent. Message lỗi vĩnh viễn (poison pill) phải được chuyển sang **DLQ** sau vài lần retry để không chặn cả partition.

### Hiểu nhanh
Hình dung Kafka như **băng chuyền có đánh số** ở nhà máy, chia thành nhiều làn (partition). Mỗi kiện hàng trên một làn có số thứ tự (offset) tăng dần. Mỗi nhóm công nhân (consumer group) chia nhau các làn: một làn chỉ một người đứng, để hàng trên làn đó được xử lý đúng thứ tự. Mỗi người ghi vào sổ "tôi đã xử lý tới kiện số 41" (commit offset); nếu người đó nghỉ, người thay đọc sổ và làm tiếp từ đó. Kiện hàng hỏng không xử lý được thì đặt sang **kệ hàng lỗi** (DLQ) để làn không bị đứng.

### Thuật ngữ
- **Topic / partition**: topic là luồng sự kiện có tên; partition là một log con có thứ tự trong topic.
- **Offset**: số thứ tự của message trong partition.
- **Consumer group**: nhóm consumer cùng group.id chia nhau các partition của topic.
- **Group coordinator**: broker quản lý thành viên của group và việc chia partition.
- **Rebalance**: quá trình chia lại partition khi consumer vào/ra group.
- **Static membership**: consumer có {{group.instance.id}} cố định, restart nhanh không gây rebalance.
- **Poison pill**: message mà lần nào xử lý cũng lỗi (sai format, dữ liệu vi phạm).
- **DLQ / DLT**: dead letter queue/topic, nơi chứa message không xử lý được để xem và replay sau.

Sơ đồ dưới đây: consumer group chia partition, poison pill đi DLQ:

~~~seq
title: Kafka consumer group + DLQ
actors: Producer | P0 | P1 | ConsumerA | ConsumerB | DLT
Producer -> P0: order.created (key o1)
Producer -> P1: order.created (key o2)
P0 -> ConsumerA: poll offset 41
ConsumerA -> ConsumerA: xử lý lỗi
ConsumerA -> P0: retry → fail
ConsumerA -> DLT: poison pill
ConsumerA -> P0: commit offset
P1 -> ConsumerB: poll
ConsumerB --> P1: ack
note ConsumerA..DLT: partition không đứng, lag theo từng partition
~~~

### Partition và ordering
1. **Producer chọn partition theo key**: {{toPositive(murmur2(keyBytes)) % numPartitions}}. Cùng key thì cùng partition, nên mọi event của cùng order_id được giữ đúng thứ tự. Message không có key thì được rải theo sticky partitioner, không có thứ tự theo nghiệp vụ.
2. **Tăng số partition làm đổi mapping key → partition**: event mới của order 123 có thể rơi vào partition khác trong khi event cũ vẫn chưa xử lý ở partition cũ, thứ tự bị phá. Vì vậy chọn số partition đủ dư từ đầu, hoặc khi cần tăng thì có chiến lược (tạo topic mới và chuyển dần, hoặc chờ consumer xử lý hết rồi mới chuyển).
3. **Retry phía producer có thể đảo thứ tự**: bật {{enable.idempotence=true}} (mặc định từ Kafka 3.0) với {{acks=all}} và {{max.in.flight.requests.per.connection}} không quá 5. Broker dùng sequence number để loại bản trùng và giữ thứ tự.
4. **Giữa các partition không có thứ tự**. Nếu cần thứ tự toàn cục thì chỉ có 1 partition, và đó chính là nút thắt throughput.

~~~text
Topic orders (3 partition), key = orderId
P0: [o1-created][o1-paid][o4-created] ...
P1: [o2-created][o2-cancelled] ...
P2: [o3-created][o3-paid][o3-shipped] ...
Group "billing": consumer A ← P0, P1 ; consumer B ← P2
~~~

### Consumer group và rebalancing
1. **Chia partition**: 8 partition, 4 consumer thì mỗi consumer 2 partition; 8 partition, 10 consumer thì 2 consumer ngồi không. Vì sao: một partition chỉ một consumer trong group để giữ thứ tự.
2. **Phát hiện consumer chết**: consumer gửi heartbeat từ thread nền; mất heartbeat quá {{session.timeout.ms}} thì bị loại. Ngoài ra nếu giữa hai lần {{poll()}} quá {{max.poll.interval.ms}} (mặc định 5 phút), consumer tự rời group. Cả hai đều gây **rebalance**.
3. **Eager vs cooperative**: eager bắt mọi consumer nhả hết partition rồi chia lại, cả group dừng một lúc. **Cooperative-sticky** ({{CooperativeStickyAssignor}}) chỉ di chuyển những partition cần chuyển. Kafka 4.x còn có giao thức group mới (KIP-848, {{group.protocol=consumer}}) để broker điều phối việc chia, rebalance còn nhẹ hơn.
4. **Static membership**: pod restart và quay lại trong {{session.timeout.ms}} với cùng {{group.instance.id}} thì không kích hoạt rebalance, rất hữu ích khi rolling deploy.

### Offset commit và delivery semantics
1. **Auto-commit** (mặc định của Kafka client, mỗi 5 giây): commit trong lúc {{poll()}} offset của batch đã poll trước. Xử lý đồng bộ trong vòng poll thì vẫn at-least-once; nhưng nếu đẩy message sang thread khác rồi crash thì **mất message**. Spring Kafka mặc định tắt auto-commit và tự commit theo AckMode (mặc định BATCH, sau khi listener xử lý xong batch).
2. **At-least-once chuẩn**: xử lý side effect **xong** rồi mới commit; crash giữa hai bước thì message được xử lý lại, nên cần idempotent.
3. **At-most-once**: commit trước rồi xử lý; chỉ hợp với dữ liệu mất được (metric lấy mẫu).
4. **Exactly-once trong Kafka**: transactional producer gộp "ghi output + commit offset" trong một transaction, consumer đọc {{read_committed}}; chỉ đúng khi output cũng là Kafka. Side effect ra DB/HTTP vẫn phải idempotent.

### Poison pill và DLQ
Message hỏng làm listener lỗi mãi, offset không tiến, **cả partition đứng yên**, lag tăng vô hạn. Spring Kafka xử lý gọn:

~~~java
var recoverer = new DeadLetterPublishingRecoverer(template,
    // mặc định gửi sang "<topic>.DLT" cùng số partition; ở đây đổi tên thành .DLQ
    (rec, ex) -> new TopicPartition(rec.topic() + ".DLQ", rec.partition()));
// 1 lần đầu + 3 lần retry cách nhau 1s, vẫn lỗi thì gửi DLQ và commit offset
var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 3L));
handler.addNotRetryableExceptions(DeserializationException.class); // lỗi dữ liệu: DLQ ngay
factory.setCommonErrorHandler(handler);
~~~
- Topic DLQ phải có **ít nhất bằng số partition** của topic gốc nếu giữ nguyên partition như trên.
- Message trong DLQ mang header gốc (topic, partition, offset, exception) để điều tra và replay.
- **Alert theo số message vào DLQ**: đó là lỗi nghiệp vụ đang chờ xử lý, không phải rác vô hại.
- Sau khi fix bug, replay: đọc DLQ đẩy lại topic gốc (consumer vẫn idempotent).

### Lỗi hay gặp
1. **Key là timestamp hoặc random**. Triệu chứng: event cùng đơn xử lý sai thứ tự (Cancelled trước Created). Cách tránh: key = id của aggregate.
2. **Xử lý lâu trong listener**. Triệu chứng: vượt {{max.poll.interval.ms}}, bị đá khỏi group, rebalance liên tục, message bị xử lý lại. Cách tránh: giảm {{max.poll.records}}, tăng interval, hoặc tối ưu xử lý.
3. **Tăng partition giữa chừng** khi hệ thống phụ thuộc thứ tự theo key. Triệu chứng: lỗi thứ tự khó tái hiện. Cách tránh: dư partition từ đầu, có kế hoạch migrate.
4. **Không có DLQ**. Triệu chứng: một message hỏng làm lag của một partition tăng mãi. Cách tránh: DefaultErrorHandler + DeadLetterPublishingRecoverer.

### Trả lời miệng 1 phút
"Kafka đảm bảo thứ tự chỉ trong một partition, nên tôi chọn key là id của aggregate để mọi event của một đơn hàng vào cùng partition. Trong consumer group, mỗi partition chỉ thuộc một consumer; khi consumer vào ra hoặc xử lý quá max.poll.interval thì group rebalance, nên tôi dùng cooperative-sticky và static membership để giảm gián đoạn khi deploy. Tôi theo at-least-once: xử lý xong mới commit offset, consumer idempotent. Kafka transactions chỉ cho exactly-once khi output cũng là Kafka. Với poison pill, tôi dùng DefaultErrorHandler retry vài lần rồi đẩy sang DLQ, lỗi deserialize thì đẩy ngay, và có alert trên DLQ."

### Ví dụ đời thực
    Hệ thống e-commerce 30 service dùng Kafka topic {{order.events}} (6 partition) để event order-created → payment-processed → shipped. Năm 2023, một lần deploy mới thêm field {{discountId}} vào message schema, lập trình viên quên cập nhật consumer. Triệu chứng: consumer group "shipping" lag tăng từ 0 lên 5 triệu message trong 2 giờ, {{consumer-lag}} dashboard đỏ; khách hàng không nhận được email giao hàng. Điều tra: {{kafka-consumer-groups --group shipping}} thấy consumer 1 đang poll partition 3, {{max.poll.interval.ms}} 300s nhưng listener xử lý 5s/message (do gọi API tracking bên thứ ba); metric {{rebalance-total}} tăng vọt do consumer bị đá khỏi group khi xử lý quá 300s; log thấy exception DeserializationException. Nguyên gốc: schema thay đổi không tương thích + listener chậm hơn max.poll.interval → consumer liên tục rebalance, offset không commit, và message lỗi (poison pill) không được gửi DLQ nên partition đứng yên. Xử lý: (1) deploy consumer mới với schema mới + {{max.poll.interval.ms}} lên 600s và {{max.poll.records}} giảm từ 500 xuống 100, (2) bật {{DeadLetterPublishingRecoverer}} retry 3 lần rồi gửi {{order.events.DLT}}, (3) DeserializationException thêm vào {{addNotRetryableExceptions}} để lỗi schema đi DLQ ngay, (4) fix schema registry compatibility check (BACKWARD) trong CI. Kết quả: sau 10 phút lag về 0, email giao hàng phục hồi, và DLQ có 5 triệu message để replay sau khi fix. Đây là minh chứng: schema thay đổi phải có compatibility check, và listener chậm là nguyên nhân thường gặp của lag tăng.

  > Senior tip: monitor **consumer lag** (offset mới nhất trừ offset đã commit, theo từng partition) là metric số 1 của Kafka: lag tăng là dấu hiệu đầu tiên của cả xử lý chậm lẫn poison pill. Lag chỉ tăng ở một partition thường là poison pill hoặc hot key.`,
  follow: [
    'Tại sao tăng số partition lại là thao tác phá ordering? Bạn xử lý ra sao?',
    'Khi nào commit offset trước xử lý lại là lựa chọn đúng?',
    'So sánh eager và cooperative rebalance trong lúc rolling deploy.'
  ],
  tags: ['Kafka', 'partition', 'consumer group', 'DLQ'],
  refs: [
    { type: 'doc', title: 'Kafka documentation: Introduction', url: 'https://kafka.apache.org/documentation/#intro' },
    { type: 'doc', title: 'Spring for Apache Kafka: Error Handling', url: 'https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html' },
  ]
},
{
  id: 'microservices-010',
  topic: 'microservices',
  level: 'mid',
  q: 'So sánh Kafka, RabbitMQ và SQS/SNS. Bạn chọn gì cho: (a) luồng sự kiện cần replay, (b) queue công việc đơn giản trên AWS, (c) pub/sub fan-out nhiều subscriber?',
  a: `**Tóm tắt:** **Kafka** là log append-only lưu lại theo thời gian để **đọc lại (replay)** và stream processing; **RabbitMQ** là broker "thông minh" với routing linh hoạt và xác nhận (ACK) từng message; **SQS/SNS** là dịch vụ managed của AWS, không phải vận hành máy chủ, trả tiền theo lượt. Câu trả lời: (a) replay → Kafka, (b) job queue trên AWS → SQS, (c) fan-out → SNS → nhiều SQS (hoặc EventBridge nếu cần lọc phức tạp).

### Hiểu nhanh
**Kafka** như **cuốn sổ nhật ký**: ai đọc cũng được, đọc xong trang vẫn còn đó, muốn đọc lại từ tuần trước cũng được. **RabbitMQ** như **bưu điện**: thư được phân loại theo địa chỉ, người nhận ký nhận rồi thì thư rời bưu điện. **SQS** như **hộp thư công việc** do AWS trông giùm: bạn chỉ bỏ việc vào và lấy ra, không phải thuê người giữ hộp. **SNS** như **loa phát thanh**: phát một lần, mọi hộp thư đã đăng ký đều nhận được bản sao.

### Thuật ngữ
- **Retention**: thời gian/dung lượng Kafka giữ message, không phụ thuộc consumer đã đọc hay chưa.
- **Replay**: đọc lại message cũ bằng cách đặt lại offset của consumer group.
- **Exchange / binding** (RabbitMQ): exchange nhận message và định tuyến sang queue theo luật binding.
- **Visibility timeout** (SQS): message đang được xử lý bị ẩn khỏi consumer khác trong một khoảng thời gian.
- **Message group** (SQS FIFO): nhóm message giữ thứ tự với nhau, giống key của Kafka.
- **Fan-out**: một message được nhân bản tới nhiều subscriber.
- **DLQ / redrive policy**: hàng đợi chứa message lỗi; redrive policy quy định sau bao nhiêu lần nhận thất bại thì chuyển sang DLQ.
- **Quorum queue**: loại queue của RabbitMQ nhân bản bằng thuật toán Raft, an toàn khi node chết.

### Bảng so sánh
| | Kafka | RabbitMQ | SQS / SNS |
|---|---|---|---|
| Mô hình | log append-only, consumer tự kéo theo offset | exchange → queue, broker push + ACK | queue managed (SQS), pub/sub fan-out (SNS) |
| Giữ dữ liệu | theo thời gian/kích thước (mặc định 7 ngày) | đến khi ACK (hoặc TTL) | SQS tối đa 14 ngày |
| Replay | **có**: reset offset để đọc lại | queue thường thì không; RabbitMQ Streams (3.9+) thì có | không |
| Thứ tự | theo partition/key | theo queue, mất khi nhiều consumer/requeue | FIFO queue: theo message group |
| Throughput | rất cao (hàng trăm MB/s mỗi cluster) | trung bình–cao, routing từng message | rất lớn, AWS tự scale |
| Chi phí vận hành | **cao** (cluster, monitor, upgrade) | trung bình | gần bằng 0 |
| Điểm mạnh | stream processing (Kafka Streams), Kafka Connect, CDC | routing, TTL, DLX, priority, AMQP/MQTT | tích hợp AWS, Lambda trigger, FIFO, filter policy |

### Trả lời ba tình huống
1. **(a) Luồng sự kiện cần replay / phân tích → Kafka.** Vì sao: chỉ Kafka giữ message độc lập với việc consumer đã đọc. Fix bug xong muốn xử lý lại 3 ngày event thì reset offset về thời điểm đó ({{kafka-consumer-groups --reset-offsets --to-datetime}}). Event sourcing, CDC (Debezium), real-time aggregation đều xây trên Kafka. Từ Kafka 4.0 cluster chạy **KRaft**, không còn ZooKeeper, bớt một thành phần phải vận hành. Trên AWS có thể dùng MSK để giảm công vận hành.
2. **(b) Queue job đơn giản trên AWS → SQS.** Worker poll message; trong lúc xử lý message bị ẩn (visibility timeout); xử lý xong thì delete; worker chết thì message tự hiện lại để worker khác làm, tức là retry "miễn phí". Sau N lần nhận thất bại, redrive policy chuyển message sang DLQ. Cần thứ tự thì dùng FIFO queue với message group id.
3. **(c) Fan-out nhiều subscriber → SNS → nhiều SQS.** Mỗi subscriber một queue riêng, nên subscriber chậm hay chết không ảnh hưởng subscriber khác. Dùng SNS filter policy để mỗi queue chỉ nhận loại event mình cần; cần lọc theo nội dung phức tạp, schema registry hay tích hợp SaaS thì dùng **EventBridge**.

~~~text
            ┌──► SQS email-queue  ──► email worker
SNS order ──┼──► SQS billing-queue ──► billing worker
            └──► SQS search-queue  ──► indexer
(mỗi queue có DLQ riêng, mỗi worker scale riêng)
~~~

### Khi nào RabbitMQ thắng
- Routing phức tạp ngay tại broker: exchange direct/topic/fanout/headers, binding theo pattern; subscriber không phải tự lọc.
- Cần priority queue, TTL từng message, RPC pattern (reply-to), giao thức AMQP/MQTT (IoT).
- Quy mô vừa, cần độ trễ thấp, không cần replay, không ở AWS hoặc cần chạy on-premise.

### Lỗi hay gặp
1. **Dùng Kafka chỉ làm job queue**. Triệu chứng: job chậm ở một partition làm kẹt các job phía sau, số worker bị giới hạn bởi số partition. Cách tránh: job queue dùng SQS/RabbitMQ; Kafka dành cho event stream.
2. **SNS + SQS không có DLQ và alarm**. Triệu chứng: một subscriber lỗi, queue tích hàng triệu message, không ai biết. Cách tránh: redrive policy + alarm theo {{ApproximateAgeOfOldestMessage}}.
3. **Visibility timeout ngắn hơn thời gian xử lý**. Triệu chứng: job chạy 2 lần song song. Cách tránh: đặt visibility timeout lớn hơn thời gian xử lý tối đa, hoặc gia hạn khi đang xử lý; worker phải idempotent.
4. **RabbitMQ classic queue không nhân bản**. Triệu chứng: node chết mất message. Cách tránh: dùng quorum queue (classic mirrored queue đã bị loại bỏ ở RabbitMQ 4.0).

### Trả lời miệng 1 phút
"Tôi phân biệt ba loại theo mô hình. Kafka là log lưu theo retention, consumer tự quản lý offset nên replay được, throughput rất cao nhưng vận hành tốn công. RabbitMQ là broker routing thông minh, message được ACK là xong, mạnh về routing, priority, TTL. SQS và SNS là managed trên AWS, gần như không tốn công vận hành. Với luồng cần replay tôi chọn Kafka; job queue trên AWS chọn SQS vì có visibility timeout, DLQ và autoscale worker dễ; fan-out thì SNS sang nhiều SQS để mỗi subscriber cô lập. Kinh nghiệm của tôi là đừng chọn Kafka chỉ vì nó phổ biến, chi phí vận hành đến ngay còn lợi ích có thể không bao giờ đến."

### Ví dụ đời thực
    Hệ thống xuất báo cáo hàng tháng (Excel 50 trang) của một công ty logistics chạy trên AWS. Ban đầu dùng một API endpoint đồng bộ: người dùng bấm "xuất", chờ 30s, nếu timeout thì không biết job đã chạy hay chưa. Năm 2023, team chuyển sang SQS: client gọi API tạo job, API trả 202 Accepted kèm {{jobId}}, worker poll SQS queue, xử lý xong xóa message; nếu worker crash, message tự hiện lại sau {{VisibilityTimeout}}. Triệu chứng ban đầu: job lớn xử lý 25–45 giây nhưng {{VisibilityTimeout}} để mặc định 30 giây → message hiện lại khi job chưa xong, worker khác nhận, job chạy 2 lần song song, xuất 2 file. Điều tra: CloudWatch thấy {{NumberOfMessagesReceived}} cao hơn hẳn {{NumberOfMessagesDeleted}}; log worker thấy 2 process cùng file. Nguyên gốc: visibility timeout ngắn hơn thời gian xử lý thực tế. Xử lý: (1) đặt {{VisibilityTimeout}} = 90 giây (lớn hơn p99 thời gian xử lý), (2) job dài thì worker gọi {{ChangeMessageVisibility}} để gia hạn trong lúc xử lý, (3) worker idempotent: lưu {{jobId}} vào DynamoDB trước khi xử lý, nếu đã có thì trả file cũ, (4) redrive policy: sau 3 lần nhận thất bại chuyển sang DLQ, alert theo DLQ. Kết quả: sau 2 tuần, không còn job chạy trùng, thời gian chờ từ 30s xuống còn 200ms (chỉ trả job id), và khi có job lỗi (ví dụ font thiếu) thì vào DLQ để team hỗ trợ. Đây là minh chứng: SQS với visibility timeout + idempotent worker giải quyết job queue mà không cần vận hành broker.

  > Senior tip: đội đã ở trên AWS thì SQS/SNS cho công việc thường ngày, Kafka (MSK/Confluent) khi có nhu cầu event streaming thật. Đừng chọn Kafka chỉ vì "sẽ cần analytics một ngày nào đó": chi phí vận hành đến ngay, lợi ích đến muộn.`,
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
  a: `**Tóm tắt:** **API Gateway** là cửa ngõ hạ tầng chung cho mọi client (TLS, xác thực, rate limit, routing); **BFF** (Backend For Frontend) là tầng gộp dữ liệu **theo từng trải nghiệm** (web, mobile), chứa logic phục vụ giao diện. Về load balancing: **client-side** (client tự chọn instance từ registry) linh hoạt nhưng client phải thông minh; **server-side** (Kubernetes Service, load balancer) đơn giản, kiểm soát tập trung. Trên Kubernetes, Service + DNS + readiness probe đã là service discovery.

Sơ đồ dưới đây: API Gateway + BFF:

~~~seq
title: API Gateway + BFF: client gom dữ liệu
actors: Mobile | API Gateway | BFF-mobile | OrderSvc | ProductSvc
Mobile -> API Gateway: request
API Gateway -> BFF-mobile: forward
BFF-mobile -> OrderSvc: GET /orders
BFF-mobile -> ProductSvc: GET /products
OrderSvc --> BFF-mobile: orders
ProductSvc --> BFF-mobile: products
BFF-mobile -> BFF-mobile: gộp + cắt gọt
BFF-mobile --> API Gateway: response
API Gateway --> Mobile: payload nhẹ
~~~

### Hiểu nhanh
Một tòa nhà văn phòng có **quầy lễ tân ở sảnh** (API Gateway): kiểm tra thẻ, giới hạn khách, chỉ đường lên tầng; lễ tân không làm việc chuyên môn của công ty nào. **BFF** giống **trợ lý riêng** cho từng loại khách: khách VIP (mobile) cần bản tóm tắt gọn, khách đối tác (web) cần bộ hồ sơ đầy đủ; trợ lý đi gom tài liệu từ nhiều phòng rồi đưa đúng thứ khách cần. Service discovery là **bảng chỉ dẫn** cho biết phòng nào đang mở ở đâu; load balancer là người **chia khách** đều cho các nhân viên đang rảnh.

### Thuật ngữ
- **API Gateway**: điểm vào duy nhất từ bên ngoài, xử lý các chính sách chung trước khi chuyển request vào service.
- **BFF**: backend riêng cho một loại frontend, gộp và cắt gọt dữ liệu theo nhu cầu của giao diện đó.
- **Service discovery**: cơ chế tìm địa chỉ IP/port của các instance đang sống của một service.
- **Service registry**: nơi lưu danh sách instance (Eureka, Consul); Kubernetes dùng API server + CoreDNS.
- **ClusterIP Service**: IP ảo ổn định trong Kubernetes, kube-proxy chuyển tiếp tới một pod phía sau.
- **Headless Service** ({{clusterIP: None}}): DNS trả thẳng danh sách IP của pod, không có IP ảo.
- **Readiness probe**: kiểm tra pod sẵn sàng nhận traffic chưa; chưa sẵn sàng thì bị loại khỏi Service.
- **Service mesh**: lớp sidecar proxy (Envoy) lo retry, mTLS, load balancing thay cho code ứng dụng.

### API Gateway
1. **Việc chung ở biên**: terminate TLS, xác thực JWT (kiểm chữ ký, issuer, audience), rate limit/WAF, routing tới service, biến đổi request/response, cache, gắn tracing. Vì sao đặt ở đây: làm một lần cho mọi service thay vì mỗi service tự làm.
2. **Công cụ**: Spring Cloud Gateway (bản reactive trên Netty, và từ Spring Cloud 2023 có thêm bản Server MVC chạy trên servlet), Envoy, Kong, APISIX, AWS API Gateway.
3. **Gateway không chứa logic nghiệp vụ**: mỗi if/else theo domain trong gateway biến nó thành nút thắt deploy mà ai cũng sợ đụng vào.

~~~yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order
          uri: lb://order-service       # lb:// => hỏi service discovery để chọn instance
          predicates:
            - Path=/api/orders/**
      default-filters:
        - name: CircuitBreaker
          args: { name: default, fallbackUri: forward:/fallback }
~~~
(Tên property có thể khác giữa các phiên bản Spring Cloud Gateway; bản mới tách prefix theo biến thể webflux/mvc, nên kiểm tra tài liệu đúng phiên bản.)

### BFF (Backend For Frontend)
1. **Vì sao cần**: màn hình web cần gộp 3 API thành 1 danh sách; mobile cần ít field hơn, payload nhỏ để tiết kiệm băng thông, kèm gợi ý sản phẩm. BFF gộp và cắt gọt theo từng trải nghiệm.
2. **Khác gateway**: gateway lo **chính sách** (hạ tầng, chung cho mọi người), BFF lo **hình dạng dữ liệu** cho một sản phẩm cụ thể, thường do team frontend sở hữu.
3. **Auth**: các BFF vẫn dùng token từ IdP chung; BFF cho web còn có thể giữ token phía server và chỉ đưa browser cookie HttpOnly (pattern "BFF for SPA"), tránh lộ token trong JavaScript.

~~~text
Mobile ─┐                ┌─► BFF-mobile ─┬─► order-service
        ├─► API Gateway ─┤               ├─► product-service
Web ────┘ (TLS, JWT,     └─► BFF-web ────┴─► review-service
           rate limit)
~~~

### Service discovery và load balancing
| | Client-side | Server-side (Kubernetes) |
|---|---|---|
| Ai chọn instance | **client** (Eureka/Consul + Spring Cloud LoadBalancer) | kube-proxy (iptables/IPVS) hoặc proxy như Envoy |
| Đường đi | trực tiếp tới instance | qua IP ảo của Service, NAT tới pod |
| Thuật toán | client tự quyết (round-robin, theo tải, theo zone) | iptables chọn ngẫu nhiên, IPVS hỗ trợ round-robin và vài thuật toán khác |
| Health | client hỏi registry | readiness probe loại pod khỏi endpoint |
| Phù hợp | không có K8s, cần cân bằng theo tải thực | **môi trường K8s: khuyên dùng** |

1. **Trong K8s**: service gọi {{http://order-service}}, CoreDNS trả ClusterIP, kube-proxy chuyển tới một pod ready. Vì sao đủ: Kubernetes đã giữ danh sách pod sống và cập nhật theo probe.
2. **Headless Service** dùng cho StatefulSet (Kafka, DB) hoặc khi client muốn tự cân bằng (gRPC client-side LB).
3. **gRPC/HTTP2 trên ClusterIP**: kube-proxy cân bằng theo **kết nối** (L4), mà gRPC giữ một kết nối lâu, nên mọi request dồn vào một pod. Cách xử lý: client-side LB qua headless Service, hoặc mesh/Envoy cân bằng theo request (L7).
4. **DNS cache**: TTL thấp thì truy vấn DNS dồn dập; client cache lâu thì gửi vào pod đã chết. Vì vậy client luôn cần timeout + retry.

### Lỗi hay gặp
1. **Gateway gộp 10 service mà không có timeout riêng từng route**. Triệu chứng: route chậm nhất nuốt hết thời gian. Cách tránh: timeout + circuit breaker theo route.
2. **Nhồi logic nghiệp vụ vào gateway**. Triệu chứng: mọi tính năng đều phải sửa và deploy gateway. Cách tránh: logic gộp đưa vào BFF hoặc service.
3. **Tạo BFF khi web và mobile dùng y hệt API**. Triệu chứng: thêm một service không ai bảo trì. Cách tránh: chỉ tạo BFF khi trải nghiệm thực sự khác nhau.
4. **Chạy Eureka trên K8s không cần thiết**. Triệu chứng: hai nguồn sự thật về instance, lệch nhau khi pod restart. Cách tránh: dùng Kubernetes Service (hoặc Spring Cloud Kubernetes nếu cần).

### Trả lời miệng 1 phút
"API Gateway là cửa ngõ chung lo TLS, xác thực JWT, rate limit và routing, không chứa nghiệp vụ. BFF là backend riêng cho từng trải nghiệm, gộp và cắt gọt dữ liệu cho web hoặc mobile, thường do team frontend sở hữu. Về load balancing, client-side như Spring Cloud LoadBalancer với Eureka cho client tự chọn instance, linh hoạt nhưng mỗi client phải thông minh; server-side như Kubernetes Service thì đơn giản và tập trung. Trên Kubernetes tôi dùng Service, CoreDNS và readiness probe, không chạy Eureka. Riêng gRPC tôi lưu ý kube-proxy cân bằng theo kết nối nên cần headless Service hoặc mesh để cân bằng theo request."

### Ví dụ đời thực
    Một công ty fintech có web SPA và app mobile gọi chung 15 service qua API Gateway (Spring Cloud Gateway). Ban đầu mobile gọi trực tiếp 15 endpoint, mỗi màn hình gộp 3–5 API: splash screen cần user + account + notifications, mỗi lần reload là 3 round-trip, thời gian load 2,5s. Năm 2023, team frontend đề xuất BFF cho mobile: một {{bff-mobile}} service gộp 3 API thành 1 response {{GET /home}}, payload giảm từ 80KB xuống 12KB. Triệu chứng: thời gian load mobile giảm từ 2,5s xuống 800ms, dung lượng data di động giảm 70%. Điều tra: metric gateway thấy {{/api/user}}, {{/api/account}}, {{/api/notifications}} là 3 endpoint được gọi đồng thời; {{Jaeger trace}} thấy 3 span con song song. Nguyên gốc: không có BFF nên client phải gộp dữ liệu, và mỗi service tự xác thực JWT (3 lần check chữ ký). Xử lý: (1) deploy {{bff-mobile}} với cache token 5 phút, chỉ check JWT ở gateway, (2) BFF gộp 3 API bằng {{CompletableFuture.allOf}} và trả flattened JSON, (3) gateway route {{/api/v1/mobile/**}} sang BFF, các route khác vẫn đi service trực tiếp. Kết quả: sau 1 tháng, mobile retention tăng do load nhanh, và team frontend tự sở hữu BFF nên deploy độc lập. Đây là minh chứng: BFF là giải pháp cho client cần gộp và cắt gọt dữ liệu, trong khi gateway vẫn lo TLS/JWT/rate limit cho mọi client.

  > Senior tip: ở Kubernetes, đừng tự viết service discovery: Service + CoreDNS + readiness probe đã là service discovery. Hãy đầu tư vào timeout/retry/tracing ở client, và để ý gRPC cần cân bằng theo request chứ không theo kết nối.`,
  follow: [
    'Khi nào nên dùng gRPC + client-side LB thay vì REST qua gateway?',
    'BFF của web và mobile dùng chung token thì rủi ro gì?',
    'Headless service khác gì service thường, khi nào cần?'
  ],
  tags: ['API Gateway', 'BFF', 'service discovery', 'load balancing'],
  refs: [
    { type: 'doc', title: 'Pattern: API Gateway', url: 'https://microservices.io/patterns/apigateway.html' },
    { type: 'doc', title: 'Spring Cloud Gateway', url: 'https://docs.spring.io/spring-cloud-gateway/reference/' },
    { type: 'article', title: 'Backends For Frontends (Sam Newman)', url: 'https://samnewman.io/patterns/architectural/bff/' },
  ]
},
{
  id: 'microservices-012',
  topic: 'microservices',
  level: 'senior',
  q: 'Bạn xây dựng observability cho hệ thống 30 microservices thế nào? Phân biệt RED/USE, correlation id và OpenTelemetry, chỉ ra bẫy cardinality.',
  a: `**Tóm tắt:** metrics cho **xu hướng**, logs cho **chi tiết từng sự kiện**, traces cho **hành trình một request xuyên các service**. RED (Rate, Errors, Duration) đo theo endpoint/service, USE (Utilization, Saturation, Errors) đo theo tài nguyên; correlation id (trace_id theo chuẩn W3C) là sợi dây nối log với trace. Với 30 service, tôi chuẩn hóa bằng OpenTelemetry/Micrometer, giữ label metric có cardinality thấp và alert theo SLO burn rate.

Sơ đồ dưới đây: trace id truyền qua HTTP và Kafka header:

~~~seq
title: Correlation id: traceparent truyền qua service
actors: Gateway | OrderSvc | PaymentSvc | Kafka | NotifySvc
Gateway -> OrderSvc: traceparent header
OrderSvc --> Gateway: response
OrderSvc -> PaymentSvc: traceparent header
PaymentSvc --> OrderSvc: response
OrderSvc -> Kafka: publish event + header traceparent
Kafka -> NotifySvc: consumer nhận header
NotifySvc -> Kafka: commit offset
note Gateway..NotifySvc: cùng trace id 4bf92f… truyền toàn bộ
~~~

### Hiểu nhanh
Hãy tưởng tượng một hệ thống giao hàng 30 kho. **Metrics** là bảng tổng hợp mỗi giờ: bao nhiêu đơn đi, bao nhiêu đơn trễ; nhìn là biết "có chuyện", nhưng không biết đơn nào. **Logs** là sổ ghi chép chi tiết của từng kho. **Trace** là **mã vận đơn**: dán lên kiện hàng từ lúc nhận, đi qua kho nào cũng quét, nên tra một mã là thấy toàn bộ hành trình và chỗ nào bị giữ lâu. Correlation id chính là mã vận đơn được in luôn vào sổ của mọi kho, để từ trace nhảy sang đúng dòng log.

### Thuật ngữ
- **Trace / span**: trace là toàn bộ hành trình của một request; span là một đoạn công việc trong đó (một HTTP call, một query).
- **W3C TraceContext**: chuẩn header {{traceparent}} chứa trace id, span id và cờ sampling.
- **MDC (Mapped Diagnostic Context)**: "túi" key-value gắn với thread hiện tại, logback in ra bằng %X{traceId}.
- **OpenTelemetry (OTel)**: chuẩn mở + SDK/agent để thu thập trace, metric, log; gửi qua giao thức OTLP.
- **OTel Collector**: tiến trình nhận dữ liệu telemetry, xử lý (sampling, lọc) rồi đẩy tới backend.
- **Cardinality**: số tổ hợp giá trị khác nhau của các label một metric; mỗi tổ hợp là một time series.
- **SLI / SLO / error budget**: chỉ số đo chất lượng, mục tiêu cho chỉ số đó, và lượng lỗi "được phép" theo mục tiêu.
- **Burn rate**: tốc độ tiêu error budget so với tốc độ "đều đặn" cho phép.

### Ba trụ cột và cách nối (từng bước)
1. **Sinh trace id ở edge**: gateway tạo trace theo W3C TraceContext (header {{traceparent}}). Vì sao ở edge: mọi service phía sau dùng chung một id, không ai tự sinh trace mới.
2. **Propagate qua HTTP và Kafka**: HTTP client gắn header {{traceparent}}; Kafka producer gắn vào message header, consumer đọc ra để nối span. Vì sao: thiếu một mắt xích là trace bị đứt làm hai.
3. **Mỗi service tạo span** cho từng thao tác (HTTP server, JDBC, Kafka). Vì sao: span có thời gian bắt đầu/kết thúc nên thấy ngay chỗ chậm.
4. **In trace id vào log qua MDC**: Spring Boot 3 + Micrometer Tracing tự đưa traceId/spanId vào MDC (từ 3.2 pattern log mặc định đã có phần correlation); tự cấu hình thì dùng %X{traceId} / %X{spanId} trong logback. Vì sao: copy trace_id từ UI trace sang Loki/CloudWatch là thấy đúng log của request lỗi.
5. **Metric RED theo service/endpoint**, alert theo SLO.

~~~text
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  ────────── trace id ──────────  ── span id ──  flags
gateway ─► order ─► payment ─► Kafka(header traceparent) ─► notification
   └────────── cùng trace id 4bf92f… xuyên suốt ──────────────┘
~~~

### RED vs USE
- **RED** nhìn theo **yêu cầu**: mỗi endpoint bao nhiêu req/s, lỗi bao nhiêu %, p99 bao lâu. Dùng cho service/API, là thứ khách hàng cảm nhận.
- **USE** nhìn theo **tài nguyên**: thread pool dùng bao nhiêu %, hàng đợi đầy chưa, GC pause, CPU, connection pool. Dùng cho JVM/máy/Kafka.
- **Saturation** dự báo outage sớm nhất: hàng đợi bắt đầu đầy trước khi error rate nhúc nhích. RED báo "khách đang đau", USE giải thích "vì sao".

### OpenTelemetry trong thực tế
1. **OTel Java agent** ({{java -javaagent:opentelemetry-javaagent.jar}}): tự instrument HTTP, JDBC, Kafka, logback mà không sửa code, gửi OTLP → Collector → Jaeger/Tempo/Grafana.
2. **Spring Boot 3** dùng **Micrometer Observation** ({{ObservationRegistry}}) làm abstraction; Micrometer Tracing có bridge sang OTel hoặc Brave/Zipkin, nên code viết một lần, backend đổi được.
3. **Sampling**: head-based 1% quyết định ngay từ đầu nên dễ bỏ sót đúng trace lỗi; **tail sampling** ở Collector chờ trace kết thúc rồi giữ 100% trace lỗi + trace chậm, trace bình thường chỉ giữ một phần nhỏ. Chi phí: Collector phải giữ span trong bộ nhớ một lúc và mọi span của một trace phải về cùng một instance Collector.

### Bẫy cardinality
Metric label phải **hữu hạn và dự đoán được**: {{method, status, uri template}}.
~~~java
// SAI: order_id làm label => mỗi đơn một time series, RAM Prometheus nổ
registry.counter("orders", "order_id", orderId).increment();
// ĐÚNG: label theo kết quả (vài giá trị), id để trong log/trace
registry.counter("orders_total", "result", result).increment();
~~~
~~~text
uri x method x status = 50 x 4 x 6 = 1.200 series / service   → ổn
thêm label user_id (1 triệu user)  = 1,2 tỉ series             → sập
~~~

### SLO và alert
1. **SLI**: availability = {{requests tốt / tổng}}, latency = tỉ lệ request dưới 300ms.
2. **SLO 99,9%** mỗi tháng ⇒ error budget khoảng 43 phút/tháng (0,1% của 30 ngày).
3. **Alert theo burn rate**: burn rate 1 nghĩa là tiêu đúng hết budget sau 30 ngày; burn rate 14,4 trong 1 giờ nghĩa là đốt 2% budget mỗi giờ → page ngay; burn rate thấp kéo dài → tạo ticket. Vì sao: alert từng lỗi gây mệt mỏi, alert theo budget phản ánh đúng mức độ ảnh hưởng.
4. Alarm theo **triệu chứng** khách hàng thấy (5xx, p99) + alarm kỹ thuật dẫn trước (Kafka lag, GC, saturation), đừng chỉ CPU.

### Lỗi hay gặp
1. **Trace đứt ở Kafka**. Triệu chứng: consumer span thành trace riêng. Cách tránh: dùng instrumentation Kafka của OTel/Spring Kafka (bật observation) để header traceparent được ghi và đọc.
2. **Label cardinality cao**. Triệu chứng: số series tăng không ngừng, Prometheus chậm, bị OOMKill. Cách tránh: review label trong code review, dùng uri template thay vì path thật.
3. **Alert theo CPU**. Triệu chứng: báo động liên tục nhưng khách không thấy lỗi. Cách tránh: alert theo SLO/triệu chứng.
4. **Mỗi team đặt tên metric và đơn vị khác nhau**. Triệu chứng: không dựng được dashboard chung. Cách tránh: quy ước chung (semantic conventions của OTel, đơn vị giây hoặc ms thống nhất).

### Trả lời miệng 1 phút
"Tôi dùng ba trụ cột: metrics cho xu hướng, logs cho chi tiết, traces cho hành trình request. Gateway sinh trace id theo W3C TraceContext, propagate qua HTTP và Kafka header, và Micrometer Tracing đưa traceId vào MDC để log và trace nối được với nhau. Metric tôi theo RED cho service và USE cho tài nguyên, trong đó saturation là tín hiệu sớm nhất. Instrumentation dùng OTel agent hoặc Micrometer Observation, gửi qua Collector với tail sampling để giữ đủ trace lỗi. Bẫy lớn nhất là cardinality: tuyệt đối không đưa user_id hay order_id vào label. Alert tôi đặt theo SLO burn rate chứ không theo CPU."

### Ví dụ đời thực
    Hệ thống 30 microservices của một công ty tài chính, mỗi service tự ghi metric với naming không thống nhất: service A dùng {{http.server.requests}}, service B dùng {{rest.template.requests}}, service C tự đặt {{myapp.custom.counter}}. Năm 2023, khi incident xảy ra (payment-service chậm), team phải mất 20 phút để tìm metric đúng tên; dashboard tổng hợp không thể tự động vì label khác nhau. Triệu chứng: alert theo CPU reo từ 3 service khác nhau nhưng không ai biết payment-service đang chậm; {{p99}} latency metric không có trên dashboard chung. Điều tra: {{Prometheus}} query "{{http_server_requests_seconds_count}}" chỉ trả về 15/30 service; logback pattern mỗi team tự đặt, {{traceId}} không có trong log của 10 service. Nguyên gốc: không có "từ điển" observability chung, mỗi team tự chọn công cụ và naming; correlation id không được truyền qua Kafka (consumer tự sinh trace mới). Xử lý: (1) ban hành quy ước chung: metric theo tên chuẩn của Micrometer/Spring Boot ({{http.server.requests}}, {{jvm.gc.pause}}), label {{service}}, {{endpoint}}, {{status}}, (2) cấm {{user_id}}/{{order_id}} làm label (cardinality alert), (3) bật OTel Java agent trên mọi service (tự động đo lường HTTP/JDBC/Kafka), (4) Spring Boot 3 + Micrometer Tracing tự đưa traceId vào MDC, (5) Kafka producer/header {{traceparent}} bắt buộc. Kết quả: sau 3 tháng, thời gian tìm incident giảm từ 20 xuống 5 phút, dashboard chung có thể tự tạo; và bài học: 30 service thì 90% giá trị đến từ nhất quán, không phải tool. Đây là minh chứng: không có standard observability thì mỗi incident là điều tra từ đầu.

  > Senior tip: 30 service thì phần lớn giá trị đến từ **nhất quán**: cùng metric name, cùng label, cùng đơn vị độ trễ, cùng header trace. Là kiến trúc sư, việc đầu tiên là viết "từ điển" observability chung, không phải cài tool.`,
  follow: [
    'Trace propagate qua Kafka bằng cách nào?',
    'Vì sao tail sampling tốt hơn head sampling cho incident, và chi phí của nó?',
    'Bạn alert theo error budget burn rate cụ thể ra sao?'
  ],
  tags: ['observability', 'OpenTelemetry', 'RED/USE', 'tracing'],
  refs: [
    { type: 'doc', title: 'OpenTelemetry Documentation', url: 'https://opentelemetry.io/docs/' },
    { type: 'doc', title: 'Spring Boot: Observability', url: 'https://docs.spring.io/spring-boot/reference/actuator/observability.html' },
    { type: 'book', title: 'Google SRE Book: Monitoring Distributed Systems', url: 'https://sre.google/sre-book/monitoring-distributed-systems/' },
  ]
},
{
  id: 'microservices-013',
  topic: 'microservices',
  level: 'lead',
  refs: [
    { type: 'doc', title: 'RFC 6749: Client Credentials Grant', url: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.4' },
    { type: 'doc', title: 'Istio Security Concepts', url: 'https://istio.io/latest/docs/concepts/security/' },
    { type: 'doc', title: 'NIST SP 800-207: Zero Trust Architecture', url: 'https://csrc.nist.gov/pubs/sp/800/207/final' },
  ],
  q: 'Hai service nội bộ gọi nhau. Bạn chọn OAuth2 client credentials, mTLS hay service mesh? Giải thích trade-off và cách phân quyền từng phía.',
a: `**Tóm tắt:** **mTLS** trả lời câu hỏi "đây là service nào" (danh tính ở mức workload, chứng minh bằng certificate), **OAuth2 client credentials** trả lời "service này được làm gì" (quyền theo scope/audience trong JWT). Hai thứ bổ sung cho nhau, không thay thế nhau: service mesh lo transport + danh tính (auto mTLS), còn ứng dụng vẫn lo authorization nghiệp vụ + audit. Mesh không thay được app.

Sơ đồ dưới đây: OAuth2 client credentials flow:

~~~seq
title: OAuth2 client credentials: ServiceA gọi ServiceB
actors: ServiceA | IdP | ServiceB
ServiceA -> IdP: POST /token (client_id, secret)
IdP --> ServiceA: access_token (scope orders.read)
ServiceA -> ServiceB: GET /orders + Bearer token
ServiceB -> ServiceB: verify signature, audience, scope
ServiceB --> ServiceA: 200 orders
~~~

### Hiểu nhanh
Hãy nghĩ tới một tòa nhà công ty. **mTLS** giống **thẻ nhân viên có chip**: cửa từ đọc thẻ, biết chắc bạn là "anh A phòng kế toán", không ai giả được bằng lời nói. **OAuth2 token** giống **giấy phép công tác** có ghi rõ "được vào kho, chỉ được xem, hết hạn lúc 15:00". Có thẻ nhân viên chưa chắc được vào kho; có giấy phép mà không có thẻ thì không qua được cổng. **Service mesh** giống **đội bảo vệ** đứng ở mọi cửa, tự kiểm thẻ giùm từng phòng, nhưng việc "anh A có được duyệt chi 1 tỷ không" vẫn do phòng tài chính quyết định.

### Thuật ngữ
- **OAuth2 client credentials**: luồng OAuth2 cho máy gọi máy: service dùng client_id + bí mật để xin access token từ IdP, không có người dùng tham gia.
- **Scope / audience**: scope là quyền (orders.read); audience (aud) là API mà token được phát cho.
- **private_key_jwt**: client chứng minh danh tính bằng JWT ký bằng private key thay vì gửi client_secret.
- **mTLS (mutual TLS)**: TLS hai chiều, cả client và server đều trình certificate.
- **SPIFFE / SPIRE**: chuẩn danh tính workload (dạng spiffe://domain/ns/x/sa/y) và hệ thống cấp cert ngắn hạn theo chuẩn đó.
- **Sidecar proxy (Envoy)**: container chạy cạnh app trong cùng pod, chặn mọi traffic vào/ra để làm mTLS, retry, telemetry.
- **AuthorizationPolicy / NetworkPolicy**: luật của Istio / Kubernetes quy định ai được gọi ai.
- **Token exchange (RFC 8693)**: đổi token này lấy token khác (ví dụ mang danh nghĩa user xuống service sau).

### OAuth2 client credentials (từng bước)
1. **Xin token**: service A gọi IdP (Keycloak, Auth0, Cognito, Entra ID) bằng {{client_id}}/{{client_secret}} hoặc **private_key_jwt** (an toàn hơn vì bí mật không bao giờ rời service). Vì sao: IdP là nơi duy nhất cấp và thu hồi quyền.
2. **Cache token**: TTL ngắn (5–15 phút), dùng lại tới gần hết hạn rồi mới xin mới, **không xin token mỗi request**. Vì sao: xin liên tục làm IdP thành nút thắt và tăng độ trễ.
3. **Gửi kèm** {{Authorization: Bearer ...}} khi gọi service B.
4. **B kiểm token**: chữ ký (qua JWKS), hạn, issuer, **audience** và scope. Vì sao phải kiểm audience: token phát cho service X mà service Y vẫn nhận thì scope vô nghĩa.

~~~java
http.oauth2Client(o -> o.clientRegistrationRepository(reg))   // phía client: xin + cache token
    .oauth2ResourceServer(r -> r.jwt(j -> j.decoder(
        jwtDecoderWithAudienceValidator())));  // phía server: kiểm JWT + audience (JwtClaimValidator)
// Phân quyền theo scope ở endpoint:
// .requestMatchers(HttpMethod.POST, "/orders/**").hasAuthority("SCOPE_orders.write")
~~~
- Vấn đề: **secret rải khắp nơi** (client_secret nằm trong config mọi service) nên phải lưu ở Vault/Secrets Manager và rotate định kỳ. Cần mang danh nghĩa user xuống service sau thì dùng token exchange (RFC 8693) thay vì chuyển tiếp token gốc khắp nơi.

### mTLS và service mesh
1. **mTLS xác thực bằng certificate**: danh tính lấy từ certificate của phía bên kia, không phải từ header mà ai cũng giả được.
2. **Workload identity ngắn hạn**: SPIFFE/SPIRE hoặc CA của mesh cấp cert sống khoảng vài giờ (Istio mặc định 24 giờ), tự rotate; không còn "cert 2 năm dán vào mọi nơi".
3. **Tự làm mTLS từng service rất đau** (phân phối cert, rotate, SAN, truststore) và đó là lý do mesh ra đời.
4. **Mesh (Istio, Linkerd)**: sidecar Envoy (hoặc chế độ ambient không sidecar của Istio) bắt mọi kết nối, làm **auto mTLS**, retry/timeout, load balancing, telemetry RED sẵn; app Java không phải sửa.
5. **Trade-off của mesh**: thêm một chặng proxy và vài ms latency, tốn CPU/RAM mỗi pod, thêm thành phần phải vận hành, debug khó hơn. Phù hợp: nhiều service, đa ngôn ngữ, đa team. Không phù hợp: 3–5 service, team còn mỏng.

~~~text
[Pod A: app ─► Envoy] ══ mTLS (cert spiffe://.../sa/order) ══► [Envoy ─► app : Pod B]
                                                                     │
                     Envoy B: AuthorizationPolicy "chỉ sa/order được gọi POST /payments"
                     App B  : kiểm JWT scope payments.write + luật nghiệp vụ (hạn mức)
~~~

### Phân quyền từng phía (defense in depth)
1. **Network**: deny-by-default traffic nội bộ (Kubernetes NetworkPolicy, mesh AuthorizationPolicy). "Nội bộ" không có nghĩa là "tin cậy".
2. **Authenticate**: mTLS cho danh tính workload; JWT cho danh tính service/user được ủy quyền.
3. **Authorize**: scope/role nhỏ nhất, đánh giá **trong service** (không tin header {{X-User}} đến từ mạng).
4. **Audit**: ghi ai gọi ai, scope nào, kết quả gì; bắt buộc với nghiệp vụ tiền.

### Chọn thế nào
| Tình huống | Lựa chọn |
|---|---|
| 3–5 service, một ngôn ngữ, chưa có mesh | OAuth2 client credentials + TLS thường + NetworkPolicy |
| Hàng chục service, đa ngôn ngữ, cần mTLS khắp nơi | Mesh (auto mTLS) + JWT scope ở app |
| Gọi API của bên thứ ba / khác tổ chức | OAuth2 (có thể kèm mTLS-bound token) |

### Lỗi hay gặp
1. **Scope {{*}} cho mọi service**. Triệu chứng: một service bị chiếm là attacker gọi được mọi API. Cách tránh: mỗi client chỉ được cấp đúng scope nó cần, review định kỳ.
2. **Secret trong env var / image layer**. Triệu chứng: lộ qua {{/actuator/env}}, crash dump, {{docker history}}. Cách tránh: đọc secret lúc runtime từ secret manager, che actuator.
3. **Mesh "auto mTLS" nhưng còn chế độ PERMISSIVE**. Triệu chứng: một số kết nối vẫn plaintext âm thầm. Cách tránh: PeerAuthentication STRICT, kiểm tra bằng {{istioctl analyze}} và dashboard mTLS.
4. **Không kiểm audience**. Triệu chứng: token của service ít quyền dùng được ở service khác. Cách tránh: validator audience bắt buộc trên mọi resource server.

### Trả lời miệng 1 phút
"Tôi coi đây là hai câu hỏi khác nhau. mTLS trả lời service nào đang gọi, bằng certificate ngắn hạn; OAuth2 client credentials trả lời service đó được làm gì, bằng scope và audience trong JWT. Với hệ thống nhỏ, tôi dùng client credentials, cache token tới gần hết hạn, resource server kiểm chữ ký, audience và scope, cộng NetworkPolicy deny-by-default. Khi có hàng chục service đa ngôn ngữ, tôi dùng mesh để có auto mTLS và AuthorizationPolicy, nhưng vẫn giữ kiểm scope và luật nghiệp vụ trong app, vì mesh không hiểu nghiệp vụ. Trade-off của mesh là chi phí vận hành và độ trễ. Kinh nghiệm của tôi là phải tập rotate secret và cert thật."

### Ví dụ đời thực
  Một công ty fintech 15 service dùng OAuth2 client credentials giữa các service. Năm 2023, team platform rotate client_secret của order-service trên IdP theo lịch 90 ngày và **thu hồi ngay secret cũ**, trong khi order-service chỉ đọc secret từ biến môi trường lúc khởi động. Access token đang cache vẫn dùng được tới khi hết hạn (JWT tự chứa, đổi secret không làm token đã cấp mất hiệu lực); 30 phút sau token hết hạn, lần xin token mới bằng secret cũ bị IdP trả {{invalid_client}} (401), mọi lời gọi sang payment-service thất bại. Resilience4j retry 3 lần cho mỗi request, dồn thêm tải lên IdP, và circuit breaker sang payment-service mở. Triệu chứng: tỉ lệ lỗi order → payment 70%, p99 tăng từ 200ms lên 2,5s. Điều tra: log order-service thấy lỗi {{invalid_client}} khi gọi token endpoint của IdP, không phải lỗi do payment-service trả về; audit log IdP thấy secret đổi lúc 09:00. Nguyên gốc: rotate kiểu "cắt ngay" trong khi client chỉ nạp secret lúc khởi động. Xử lý: (1) rotate chồng lấn: IdP cho secret mới và cũ cùng hiệu lực 24 giờ, client nạp secret mới xong mới thu hồi secret cũ, (2) order-service đọc secret từ Secrets Manager và tự nạp lại khi xin token bị {{invalid_client}}, (3) không retry lỗi 401/{{invalid_client}} (lỗi cấu hình, retry vô ích), (4) alert riêng cho lỗi lấy token. Kết quả: hai lần rotate sau đó không có lỗi nào. Đây là minh chứng: client credentials cần quy trình rotate chồng lấn và phải phân biệt lỗi lấy token với lỗi của service đích, không chỉ tin vào TTL.

> Senior tip: secret và cert phải **rotate được mà không redeploy toàn cluster**. Nếu rotation nghĩa là downtime, thì bạn chưa có kế hoạch: hãy đo bằng bài tập rotate thật mỗi quý một lần.`,
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
  a: `**Tóm tắt:** đừng tăng version mỗi lần release; nguyên tắc là **chỉ thêm, không bao giờ phá** (thêm field optional, thêm endpoint). Thay đổi breaking thì đi theo vòng **expand → chuyển consumer sang bản mới → contract** (deploy nhiều phase, cách nhau ít nhất một release). **Consumer-driven contract test** (Pact, Spring Cloud Contract) bắt lỗi breaking ngay trong CI thay vì để tới production.

### Hiểu nhanh
API giống **ổ cắm điện**: hàng triệu thiết bị đang cắm vào. Bạn có thể thêm một lỗ USB mới bên cạnh (thêm field) mà không ai bị ảnh hưởng. Nhưng nếu đổi hình dạng chân cắm (đổi tên, đổi kiểu field), mọi thiết bị cũ hỏng ngay. Muốn đổi chuẩn ổ cắm thì phải: lắp ổ mới song song (expand), chờ mọi người chuyển sang phích mới (migrate), rồi mới tháo ổ cũ (contract). Contract test giống **bản vẽ chân cắm** mà mỗi nhà sản xuất thiết bị gửi cho bạn: trước khi sản xuất ổ mới, bạn kiểm tra nó còn vừa mọi bản vẽ không.

### Thuật ngữ
- **Backward compatible**: phiên bản mới của provider vẫn phục vụ đúng consumer cũ mà consumer không phải sửa.
- **Breaking change**: thay đổi làm consumer hiện tại lỗi (bỏ field, đổi tên, đổi kiểu, đổi ý nghĩa, đổi format).
- **Expand–contract (parallel change)**: thêm cái mới song song cái cũ, chuyển dần, rồi mới gỡ cái cũ.
- **Provider / consumer**: bên cung cấp API / bên gọi API.
- **Consumer-driven contract (CDC)**: consumer ghi lại kỳ vọng của mình thành file contract, provider phải chứng minh đáp ứng được.
- **Pact Broker / can-i-deploy**: nơi lưu contract + kết quả verify; lệnh hỏi "phiên bản này deploy lên môi trường X có an toàn không".
- **Tolerant reader**: consumer bỏ qua field lạ và chỉ đọc field mình cần.
- **Sunset / Deprecation header**: header HTTP báo API sắp bị gỡ và ngày gỡ.

### Chọn chiến lược versioning
| Cách | Ưu | Nhược |
|---|---|---|
| URI (/v2) | rõ ràng, cache được, route dễ | nhân đôi resource, link rải rác |
| Header ({{X-API-Version}}) | URL sạch, version theo client | khó test bằng trình duyệt, không share link được |
| Query (?version=2) | dễ thấy, dễ log | phình URL, cache key phức tạp |
| Media type (Accept: application/vnd.x.v2+json) | đúng tinh thần REST | tooling kém, ít team dùng |

- Khuyến nghị: **URI versioning cho thay đổi lớn** (đơn giản, ai cũng hiểu), header/query cho biến thể nhỏ. Spring Framework 7 (Spring Boot 4) có hỗ trợ API versioning sẵn trong mapping; với Boot 3 thì tự route theo URI/header.
- **Quy tắc tương thích JSON**: thêm field optional thì OK; **không** đổi tên, đổi kiểu, đổi ý nghĩa, bỏ field, đổi format ngày, biến field optional thành bắt buộc. Consumer phải bỏ qua field lạ: Spring Boot cấu hình Jackson tắt {{FAIL_ON_UNKNOWN_PROPERTIES}} mặc định nên thêm field là an toàn; **nhưng** đổi "2024-05-01" sang epoch millis là breaking ngầm, compile vẫn qua.
- **Enum**: thêm giá trị enum mới cũng có thể là breaking với consumer dùng switch không có default hoặc deserialize enum chặt.

### Expand–contract (từng bước)
1. **Expand**: thêm cột/field mới, nullable, code cũ vẫn chạy. Vì sao: bản cũ và bản mới phải cùng sống được trong lúc rolling deploy.
2. **Ghi cả hai**: code mới ghi cả field cũ lẫn mới, backfill dữ liệu cũ dần theo lô. Vì sao: consumer cũ vẫn đọc field cũ.
3. **Chuyển consumer** sang đọc field mới; theo dõi metric đối chiếu hai cột.
4. **Contract**: sau ít nhất một release và khi số liệu cho thấy không còn ai đọc, mới gỡ field/cột cũ.

~~~text
Phase 1 (EXPAND):   ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(16);  ← code CŨ vẫn chạy
                    code MỚI ghi cả status và status_v2, backfill dần
Phase 2:            consumer đọc status_v2; verify bằng metric đối chiếu 2 cột
Phase 3 (CONTRACT): sau ít nhất 1 release: ALTER TABLE orders DROP COLUMN status
~~~
Thứ tự deploy: **producer mở rộng trước → consumer chuyển sang bản mới → producer thu hẹp sau**. Không bao giờ gộp "đổi schema + bắt đầu dùng schema mới" trong một lần deploy: rollback app không rollback được schema.

### Consumer-driven contract testing trong CI
1. **Consumer viết kỳ vọng** (Pact JVM): "tôi gọi GET /orders/1, cần field id kiểu số, status kiểu chuỗi, trả 200". Test của consumer chạy với mock server của Pact và sinh ra **pact file**.
2. **Publish pact** lên Pact Broker kèm version của consumer.
3. **CI của provider verify**: provider khởi động thật (thường với DB test), Pact phát lại từng request trong pact file và so response. Vì sao hiệu quả: provider biết **chính xác** consumer nào dùng field nào, xóa field không ai dùng thì an toàn.
4. **can-i-deploy**: trước khi deploy, pipeline hỏi Broker "consumer v1.2 / provider v3.4 đã verify với nhau chưa?"; chưa thì chặn deploy.
- **Spring Cloud Contract**: hướng provider-driven: provider viết contract bằng DSL (Groovy/YAML), sinh test cho chính provider và **stub jar** cho consumer test offline.
- Khác integration test truyền thống: contract test kiểm đúng **cách dùng thật** của consumer, chạy nhanh trong CI, không cần dựng cả hệ thống.

~~~text
consumer CI: test ─► pact file ─► Pact Broker ◄─ provider CI: verify pact
                                     │
                     deploy pipeline: can-i-deploy? ─► yes ─► deploy
~~~

### Khi breaking là bắt buộc
- Gửi header **Sunset** (RFC 8594, ví dụ {{Sunset: Thu, 01 Jan 2026 00:00:00 GMT}}) và **Deprecation**, thông báo sớm 6–12 tháng.
- Đo usage của version cũ (metric theo version + client id); gỡ khi số liệu về 0, không theo cảm tính.
- Chính sách "N-1": chỉ hỗ trợ tối đa 2 version cùng lúc.

### Lỗi hay gặp
1. **Đổi format ngày/số tiền**. Triệu chứng: consumer parse lỗi dù schema "không đổi". Cách tránh: contract test có kiểm format (regex) cho ngày, tiền tệ.
2. **Gộp migration + code dùng cột mới trong một lần deploy**. Triệu chứng: rollback app xong vẫn lỗi vì schema đã đổi. Cách tránh: expand–contract qua nhiều release.
3. **Consumer deserialize chặt** (FAIL_ON_UNKNOWN_PROPERTIES bật, enum chặt). Triệu chứng: provider thêm field là consumer lỗi. Cách tránh: tolerant reader, enum có giá trị UNKNOWN.
4. **Contract test chỉ chạy ở consumer**. Triệu chứng: pact file có mà provider không verify, lỗi vẫn lọt. Cách tránh: verify trong CI của provider + can-i-deploy chặn deploy.

### Trả lời miệng 1 phút
"Nguyên tắc của tôi là chỉ thêm, không phá: thêm field optional, consumer là tolerant reader. Khi buộc phải breaking, tôi dùng expand–contract: thêm field mới song song, ghi cả hai, chuyển consumer sang bản mới, rồi sau ít nhất một release mới gỡ bản cũ; schema DB cũng đi theo cách đó. Version lớn tôi đặt trên URI cho dễ hiểu. Để bắt lỗi sớm, tôi dùng consumer-driven contract với Pact: consumer sinh pact file, provider verify trong CI, và can-i-deploy chặn deploy nếu chưa tương thích. Kinh nghiệm của tôi là phần lớn breaking đến từ đổi format như ngày tháng, nên contract phải kiểm cả format."

### Ví dụ đời thực
  Một hệ thống e-commerce dùng REST API cho 20 service. Năm 2023, team order-service muốn đổi field {{status}} từ enum string ({{PENDING, PAID, SHIPPED}}) sang object. Developer push breaking change trực tiếp lên {{/api/orders}} mà không tạo version mới.

~~~json
{
  "status": {
    "code": "PAID",
    "label": "Đã thanh toán"
  }
}
~~~

  Triệu chứng: mobile app crash khi parse response, web dashboard hiển thị "[object Object]", metric {{http.server.requests}} 5xx tăng từ 0,1% lên 12%. Điều tra: log mobile thấy {{com.fasterxml.jackson.databind.exc.MismatchedInputException}} (status nhận object, mong đợi string); web dashboard code dùng {{order.status}} như string để so sánh; consumer-driven contract test (Pact) chưa bao giờ chạy trong CI vì team bỏ qua. Nguyên gốc: breaking change đẩy lên production mà không có expand–contract, không có contract test, không có can-i-deploy gate. Xử lý: (1) rollback ngay về version cũ, (2) tạo {{/api/v2/orders}} với object status mới, (3) mobile/web migrate dần sang v2 trong 2 sprint, (4) cài đặt Pact Broker, consumer viết contract, provider verify trong CI, (5) can-i-deploy chặn deploy nếu contract fail. Kết quả: sau 1 tháng, v1 traffic về 0, v2 ổn định, và 3 breaking change sau đó bị bắt ở CI. Đây là minh chứng: contract test + expand–contract + versioning URI bắt breaking change sớm, không để lọt production.

> Senior tip: phần lớn breaking đến từ **đổi định dạng**, không phải đổi schema. Thêm contract test cho định dạng ngày/tiền tệ/enum rẻ hơn rất nhiều so với sửa lỗi parse trên production.`,
  follow: [
    'Khi nào bạn tạo /v2 thay vì chỉ thêm field?',
    'Pact và Spring Cloud Contract chọn cái nào, vì sao?',
    'Làm sao ngừng hỗ trợ API version cũ mà không làm hỏng client đang ngủ yên?'
  ],
  tags: ['API versioning', 'backward compatibility', 'contract testing', 'Pact'],
  refs: [
    { type: 'doc', title: 'Pact Documentation', url: 'https://docs.pact.io/' },
    { type: 'doc', title: 'Spring Cloud Contract', url: 'https://docs.spring.io/spring-cloud-contract/reference/' },
  ]
},
{
  id: 'microservices-015',
  topic: 'microservices',
  level: 'lead',
  refs: [
    { type: 'article', title: 'CQRS (Martin Fowler)', url: 'https://martinfowler.com/bliki/CQRS.html' },
    { type: 'article', title: 'Event Sourcing (Martin Fowler)', url: 'https://martinfowler.com/eaaDev/EventSourcing.html' },
    { type: 'doc', title: 'Pattern: CQRS', url: 'https://microservices.io/patterns/data/cqrs.html' },
  ],
  q: 'Khi nào áp CQRS và khi nào thêm cả event sourcing? Liệt kê lợi ích, chi phí thật và những cái bẫy gặp phải trên production.',
  a: `**Tóm tắt:** **CQRS** tách mô hình ghi và mô hình đọc (có thể chỉ là 2 bảng, 2 service hoặc 2 database). **Event sourcing (ES)** lưu **chuỗi sự kiện** làm nguồn sự thật thay vì lưu trạng thái hiện tại. CQRS không đòi hỏi ES; ES thì hầu như luôn đi kèm CQRS. Cả hai đều là **trade-off: đổi độ phức tạp lấy khả năng query/scale/audit**, không phải mặc định đúng.

### Hiểu nhanh
**CQRS** giống nhà hàng có **bếp** và **thực đơn in sẵn**: bếp (mô hình ghi) tổ chức theo cách dễ nấu, còn thực đơn (mô hình đọc) trình bày theo cách khách dễ chọn; bếp đổi món thì một lúc sau thực đơn mới cập nhật. **Event sourcing** giống **sổ tài khoản ngân hàng**: ngân hàng không chỉ lưu "số dư 5 triệu", mà lưu từng dòng nạp/rút; số dư là kết quả cộng dồn các dòng. Nhờ vậy hỏi "vì sao số dư là 5 triệu?" hay "số dư lúc 10h thứ Ba là bao nhiêu?" đều trả lời được.

### Thuật ngữ
- **Command / query**: lệnh làm thay đổi trạng thái / yêu cầu chỉ đọc dữ liệu.
- **Read model / projection**: bảng hoặc index chỉ để đọc, được dựng từ event hoặc từ dữ liệu ghi.
- **Event store**: nơi lưu event append-only theo từng stream (thường mỗi aggregate một stream).
- **Aggregate**: cụm đối tượng nghiệp vụ được thay đổi cùng nhau và giữ luật nhất quán (ví dụ Order + OrderLines).
- **Snapshot**: ảnh chụp trạng thái aggregate tại một version, để không phải replay từ đầu.
- **Upcasting**: chuyển event phiên bản cũ sang cấu trúc mới lúc đọc.
- **Eventual consistency**: read model khớp với dữ liệu ghi sau một khoảng trễ.
- **Read-your-writes**: người vừa ghi phải đọc thấy dữ liệu mình vừa ghi.

### CQRS: vì sao và khi nào
1. **Vấn đề**: model ghi (chuẩn hóa, nhiều khóa ngoại) phục vụ transaction tốt, nhưng query nghiệp vụ cần dạng khác (dashboard, tìm kiếm full-text, join xuyên aggregate). Vì sao khó: tối ưu cho ghi và tối ưu cho đọc thường mâu thuẫn.
2. **Giải pháp**: ghi vào model ghi, phát event (qua outbox), consumer cập nhật read model phẳng (denormalize) như bảng tổng hợp hoặc Elasticsearch.
3. **Lợi ích**: query read model gần như tra theo khóa; scale đọc độc lập (read replica, Elasticsearch); mỗi bên tối ưu riêng.
4. **Chi phí thật**: **eventual consistency** (user tạo xong mở danh sách ngay có thể chưa thấy, nên UI phải báo trạng thái, hoặc đọc thẳng từ primary cho chính người vừa ghi); hai model nghĩa là thêm code map, migration, và loại bug "ghi xong mà không hiện". CRUD 20 endpoint mà thêm CQRS là thêm 20 thứ phải đồng bộ.

~~~text
Command ─► [Write model: orders, order_lines] ─(outbox/event)─► Projector
                                                                   │
Query  ◄──────────── [Read model: order_summary / Elasticsearch] ◄─┘
                       (trễ vài trăm ms tới vài giây)
~~~

### Event sourcing: nguồn sự thật là log sự kiện
~~~text
order-123 stream: [OrderCreated(v1)] [ItemAdded] [PaymentTaken(v2)] [Shipped]
                                       snapshot ──► state hiện tại = fold các event
~~~
1. **Ghi**: nạp aggregate (snapshot + các event sau đó), chạy command, sinh event mới, append vào stream với **kiểm tra version** (optimistic concurrency: "chỉ append nếu stream đang ở version 7"). Vì sao: hai command song song không được ghi đè nhau.
2. **Đọc**: projection subscribe stream, cập nhật read model.
3. **Lợi ích**: audit trail đầy đủ (tài chính, y tế: "vì sao số tiền này?" trả lời bằng log sự kiện); **temporal query** (trạng thái lúc 10h thứ Ba = replay tới thời điểm đó); projection tái tạo bất kỳ lúc nào (rebuild Elasticsearch từ đầu); thêm consumer mới không đụng producer.

~~~java
// Trạng thái = gập (fold) các event theo thứ tự
Order rebuild(List<OrderEvent> events) {
    Order o = new Order();
    for (OrderEvent e : events) o.apply(e);   // apply chỉ đổi state, không side effect
    return o;
}
~~~

### Chi phí và bẫy production của ES
- **Tiến hóa event**: không sửa event cũ; khi đổi cấu trúc phải **upcast** (đọc event v1 bằng logic v2).
- Replay cả stream mỗi request là **O(n)**, nên cần **snapshot** định kỳ (ví dụ mỗi 50–100 event) và tool rebuild projection.
- **"Quyền được lãng quên" (GDPR)**: không xóa event được vì phá tính toàn vẹn stream; dùng **crypto-shredding** (mã hóa dữ liệu cá nhân bằng key riêng từng user, xóa key) hoặc anonymize.
- **Khó debug**: trạng thái ẩn trong 50 event, cần tool xem stream.
- **Dung lượng phình**: append-only + snapshot, stream theo aggregateId để không dài vô hạn.

### Khi nào chọn
| Tình huống | Gợi ý |
|---|---|
| CRUD nội bộ, đọc ghi cân bằng | **không** dùng, repository thường là đủ |
| Query phức tạp, đọc nhiều gấp hàng chục lần ghi | CQRS (read model riêng) |
| Audit bắt buộc, cần replay/time-travel, domain nhiều sự kiện (giao dịch, game) | ES + CQRS |
| Team mới, cần đơn giản hóa | đừng ES, chi phí onboarding rất lớn |

Bắt đầu bằng **CQRS-lite**: ghi qua service, đọc từ read replica hoặc bảng tổng hợp; chỉ thêm event store khi thực sự cần lịch sử/replay.

### Lỗi hay gặp
1. **Projection lệch mà không biết**. Triệu chứng: dashboard sai số so với dữ liệu ghi. Cách tránh: job đối soát định kỳ + khả năng rebuild projection.
2. **Event chứa quá ít hoặc quá nhiều**. Triệu chứng: consumer phải gọi ngược API để lấy thêm, hoặc event lộ cấu trúc nội bộ. Cách tránh: event mô tả sự việc nghiệp vụ, có version schema.
3. **Áp ES cho mọi thứ**. Triệu chứng: CRUD đơn giản mà phải viết event, projection, upcaster. Cách tránh: chỉ dùng cho bounded context thực sự cần audit/time-travel.
4. **Bỏ qua read-your-writes**. Triệu chứng: user tạo đơn xong không thấy, bấm tạo lại, ra đơn trùng. Cách tránh: trả dữ liệu vừa ghi trong response, hoặc đọc từ model ghi cho chính user đó.

### Trả lời miệng 1 phút
"CQRS là tách model ghi và model đọc; tôi dùng khi query nghiệp vụ cần dạng dữ liệu rất khác model ghi hoặc đọc nhiều hơn ghi rất nhiều, ví dụ dashboard hay tìm kiếm. Read model được cập nhật qua event từ outbox, nên phải chấp nhận eventual consistency và xử lý read-your-writes. Event sourcing là lưu chuỗi sự kiện làm nguồn sự thật; tôi chỉ thêm khi cần audit đầy đủ, time-travel hoặc rebuild projection, vì nó kéo theo upcasting, snapshot, xử lý GDPR bằng crypto-shredding và tooling để debug. Với CRUD thông thường tôi không dùng cả hai. Thực tế tôi bắt đầu bằng CQRS-lite rồi mới nâng cấp khi có nhu cầu thật."

### Ví dụ đời thực
  Hệ thống đặt vé sự kiện 10 service, query dashboard "doanh thu theo ngày/sự kiện/khách hàng" chậm 8s do join 5 bảng chuẩn hóa. Năm 2023, team áp CQRS: ghi giữ nguyên Order/OrderItem, phát event {{OrderCreated, ItemAdded, PaymentTaken}} qua outbox, projector cập nhật bảng {{order_summary}} (denormalize: order_id, event_name, date, customer_id, amount, status). Triệu chứng ban đầu: read model lệch 2% so với dữ liệu ghi (dashboard sai số). Điều tra: projector consume event nhưng retry logic không idempotent, cùng event {{PaymentTaken}} được xử lý 2 lần do Kafka rebalance; reconciliation job phát hiện 4.000 bản ghi amount gấp đôi. Nguyên gốc: projector không dùng inbox pattern (dedup theo eventId), và outbox relay publish at-least-once. Xử lý: (1) thêm bảng {{processed_event(event_id PK)}}, projector insert trước khi cập nhật summary, (2) snapshot aggregate mỗi 100 event để rebuild nhanh, (3) CDC Debezium sync bảng summary sang Elasticsearch cho tìm kiếm full-text. Kết quả: query dashboard từ 8s xuống 120ms, reconciliation job phát hiện 0 lệch sau 2 tuần, và team có thể rebuild Elasticsearch từ đầu trong 15 phút nhờ event store. Đây là minh chứng: CQRS giải quyết query phức tạp nhưng bắt buộc idempotent projector + reconciliation.

> Senior tip: mỗi lần ai đó đề nghị event sourcing, hãy hỏi "ai sẽ xây tool rebuild projection và ai trực on-call khi projection lệch?". Nếu không có câu trả lời, đó là nợ kỹ thuật được bọc bằng buzzword.`,
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
  a: `**Tóm tắt:** blue-green **chuyển toàn bộ traffic một lần** (rollback = chuyển lại), canary **rót traffic từng phần** theo SLO (rollback = ngừng rót), feature flag **tách deploy khỏi release** (bật/tắt tính năng lúc runtime). Nhưng **rollback app không rollback được schema DB**, nên migration phải được thiết kế để **không bao giờ cần rollback**: tương thích với phiên bản app N-1, theo quy tắc **expand–contract**.

### Hiểu nhanh
**Blue-green** giống có hai sân khấu: diễn ở sân xanh, chuẩn bị sẵn sân lục, đến giờ chỉ việc bật đèn sân lục và mời khán giả sang; có sự cố thì mời quay lại sân xanh. **Canary** giống cho **vài khách nếm món mới** trước khi đưa vào thực đơn chính. **Feature flag** giống **công tắc đèn**: dây điện (code) đã đi sẵn trong tường, muốn bật lúc nào thì bật. Còn database giống **cái nhà**: bạn có thể đổi đồ đạc qua lại dễ dàng, nhưng đã đập một bức tường (DROP COLUMN) thì không "undo" được; nên luôn xây tường mới trước, chuyển đồ sang, rồi mới đập tường cũ.

### Thuật ngữ
- **Blue-green deployment**: hai môi trường giống nhau, chỉ một bên nhận traffic; đổi bằng load balancer/DNS.
- **Canary release**: phiên bản mới nhận một phần nhỏ traffic, tăng dần nếu các chỉ số tốt.
- **Feature flag**: cờ cấu hình runtime quyết định code path nào chạy, có thể theo % user.
- **Dark launch / shadow traffic**: chạy code mới với traffic thật nhưng không trả kết quả cho user, chỉ để so sánh.
- **Expand–contract**: thêm cấu trúc mới tương thích ngược, chuyển dần, rồi mới gỡ cấu trúc cũ.
- **Flag debt**: cờ đã bật 100% từ lâu nhưng không ai xóa, làm code rẽ nhánh khó đọc.
- **Argo Rollouts / Flagger**: công cụ Kubernetes tự động canary/blue-green dựa trên metric.
- **Online schema change**: đổi schema bảng lớn mà không khóa bảng lâu (gh-ost, pt-online-schema-change).

### Ba chiến lược
| | Blue-green | Canary | Feature flag |
|---|---|---|---|
| Cách | 2 môi trường, đổi LB | 1% → 5% → 50% → 100% | deploy "tối", bật/tắt theo cờ |
| Rollback | **ngay lập tức** (đổi lại) | ngừng rót traffic | **tắt cờ**, không redeploy |
| Theo dõi | so sánh trước/sau | SLO/error rate theo phiên bản | theo % user được bật |
| Chi phí | nhân đôi tài nguyên lúc chuyển | cần metric tốt + routing theo % | cần hệ thống flag + test nhiều tổ hợp |
| Rủi ro | kết nối giữ lâu (WebSocket), state | sticky session, user state | **flag debt**, cờ không ai dọn |

1. **Canary mạnh nhất khi có SLI đáng tin**: error rate, p99 theo từng phiên bản, kèm tự động promote/rollback (Argo Rollouts, Flagger; AWS CodeDeploy blue/green cho ECS kèm CloudWatch alarm). Vì sao: con người nhìn dashboard lúc 2 giờ sáng dễ sót.
2. **Feature flag** tách "đã deploy" khỏi "đã phát hành"; hợp cho A/B test, dark launch, shadow traffic (gọi service mới song song rồi so kết quả, **không** để code mới gây side effect). Bẫy: số tổ hợp test tăng gấp đôi mỗi cờ; nên ghi hạn dọn cờ ngay trong ticket.
3. **Blue-green** hợp khi cần chuyển dứt khoát và rollback tức thì, chấp nhận tốn gấp đôi tài nguyên trong lúc chuyển.

### Rollback với migration DB: câu hỏi thật
~~~text
deploy v2 (migration + code) ── lỗi ──► rollback về v1
        └─ code quay lại OK, nhưng schema đã DROP/đổi kiểu ⇒ v1 CHẾT
~~~
Quy tắc: **migration phải tương thích ngược với phiên bản app N-1**. Lý do: trong rolling deploy, canary hay blue-green, **v1 và v2 chạy cùng lúc trên cùng một DB**. Đổi schema theo expand–contract, mỗi phase cách nhau ít nhất một release:

1. **Expand** (deploy v1.1): chỉ thêm, không phá; cột mới nullable, v1 cũ vẫn chạy bình thường.
2. **Ghi cả hai + backfill**: code ghi cả cột cũ và mới; backfill theo lô nhỏ (ví dụ 5.000 dòng/lần) để tránh transaction dài giữ lock và replica bị trễ.
3. **Chuyển đọc** sang cột mới; flag có thể điều khiển bước này.
4. **Contract**: chỉ khi chắc chắn không còn phiên bản nào đọc cột cũ mới DROP.

~~~sql
-- PHASE 1 (EXPAND): thêm, không phá; v1 cũ vẫn chạy
ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(16);
-- PHASE 2: code ghi cả hai cột; backfill nền theo lô
UPDATE orders SET status_v2 = status
WHERE id BETWEEN :from AND :to AND status_v2 IS NULL;
-- PHASE 3 (CONTRACT): chỉ khi 100% không còn ai đọc cột cũ
ALTER TABLE orders DROP COLUMN status;
~~~
- Không sửa migration đã chạy: Flyway/Liquibase phát hiện checksum đổi và báo lỗi khi validate (điều đó tốt); hãy thêm migration mới.
- DDL nặng không được khóa lâu: PostgreSQL dùng {{CREATE INDEX CONCURRENTLY}}; MySQL bảng lớn dùng gh-ost/pt-online-schema-change hoặc ALTER ... ALGORITHM=INPLACE/INSTANT khi được hỗ trợ.
- **Rollback code được, migration thì đi tới (forward fix)**, vì vậy phase expand phải vô hại với phiên bản cũ.

### Lỗi hay gặp
1. **Đổi tên cột trong một bước**. Triệu chứng: trong lúc rolling deploy, pod v1 báo "column does not exist". Cách tránh: thêm cột mới, ghi cả hai, rồi mới bỏ cột cũ.
2. **Flag bật 1% user nhưng migration đã chạy 100% data**. Triệu chứng: user chưa bật cờ vẫn gặp dữ liệu dạng mới mà code cũ không hiểu. Cách tránh: dữ liệu phải đọc được bởi cả hai nhánh code.
3. **Canary không tách metric theo phiên bản**. Triệu chứng: 5% traffic lỗi nhưng bị trung bình hóa, không ai thấy. Cách tránh: gắn label version vào metric, so sánh canary với baseline.
4. **Backfill một câu UPDATE khổng lồ**. Triệu chứng: lock bảng, replica trễ hàng phút. Cách tránh: chia lô, nghỉ giữa các lô, chạy giờ thấp điểm.

### Trả lời miệng 1 phút
"Blue-green chuyển toàn bộ traffic một lần nên rollback tức thì nhưng tốn gấp đôi tài nguyên; canary rót traffic dần theo SLO, có thể tự động rollback bằng Argo Rollouts; feature flag tách deploy khỏi release, tắt cờ là xong. Nhưng cả ba chỉ rollback được code, không rollback được schema, và trong lúc deploy thì v1 và v2 cùng chạy trên một DB. Vì thế tôi bắt buộc migration tương thích với N-1 theo expand–contract: thêm cột nullable, ghi cả hai, backfill theo lô, chuyển đọc, và chỉ drop cột cũ sau ít nhất một release. Câu hỏi tôi luôn tự hỏi khi review migration là: nếu app bị revert ngay sau 30 giây, hệ thống còn chạy không?"

### Ví dụ đời thực
  Hệ thống thanh toán 8 service, team thêm cột {{discount_id}} vào bảng {{orders}} (50 triệu dòng). Năm 2023, migration chạy {{ALTER TABLE orders ADD COLUMN discount_id VARCHAR(36)}} xong, deploy code v2 ghi cả {{discount_id}} và {{discount_code}} (cột cũ). Triệu chứng: 30 phút sau deploy, read replica lag 15 phút; {{pg_stat_activity}} thấy {{ALTER TABLE}} xếp hàng chờ {{AccessExclusiveLock}} 45 giây sau một transaction báo cáo chạy dài, và trong lúc chờ nó chặn mọi SELECT mới trên bảng orders (hàng đợi lock); đặt {{SET lock_timeout = '3s'}} cho migration sẽ tránh được cảnh này. Điều tra: migration chạy lúc 14:00 (giờ cao điểm) thay vì 03:00; backfill {{UPDATE orders SET discount_id = discount_code}} 50 triệu dòng một câu duy nhất chạy 2 giờ, WAL phình 200GB; replica không áp kịp WAL, replication slot giữ WAL và đĩa DB đầy dần. Nguyên gốc: migration DDL + backfill không dùng online schema change, không chia lô, chạy sai giờ. Xử lý: (1) backfill theo lô: {{UPDATE orders SET discount_id = discount_code WHERE id BETWEEN :from AND :to AND discount_id IS NULL}} 5.000 dòng/lần, nghỉ 100ms/lần, chạy nền vài giờ không khóa lâu (PostgreSQL không dùng gh-ost — gh-ost dành cho MySQL), (2) tạo index {{CREATE INDEX CONCURRENTLY ON orders(discount_id)}}, (3) code v2 đọc {{COALESCE(discount_id, discount_code)}}, (4) sau 2 release xác nhận không còn đọc {{discount_code}} mới {{DROP COLUMN discount_code}}. Kết quả: migration sau đó zero-downtime, replica lag < 10s, và team quy định migration DDL chỉ chạy 02:00–04:00. Đây là minh chứng: expand–contract + online schema change + giờ thấp điểm = migration an toàn.

> Senior tip: mỗi lần review migration, hãy tự hỏi "nếu app vừa deploy bị revert ngay 30 giây sau, hệ thống còn chạy không?". Nếu câu trả lời là không thì migration chưa an toàn, bất kể có backup hay không.`,
  follow: [
    'Shadow traffic so sánh response của v1 và v2 thế nào mà không side effect?',
    'Flag bật cho 1% user nhưng migration đã chạy cho 100% data thì vấn đề gì?',
    'Bạn kiểm tra migration backward compatible trong CI bằng cách nào?'
  ],
  tags: ['blue-green', 'canary', 'feature flag', 'database migration'],
  refs: [
    { type: 'article', title: 'BlueGreenDeployment (Martin Fowler)', url: 'https://martinfowler.com/bliki/BlueGreenDeployment.html' },
    { type: 'article', title: 'CanaryRelease (Martin Fowler)', url: 'https://martinfowler.com/bliki/CanaryRelease.html' },
    { type: 'article', title: 'Feature Toggles (martinfowler.com)', url: 'https://martinfowler.com/articles/feature-toggles.html' },
  ]
},
{
  id: 'microservices-017',
  topic: 'microservices',
  level: 'lead',
  refs: [
    { type: 'article', title: 'Strangler Fig Application (Martin Fowler)', url: 'https://martinfowler.com/bliki/StranglerFigApplication.html' },
    { type: 'doc', title: 'Anti-corruption Layer pattern (Azure)', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer' },
  ],
  q: 'Bạn dẫn dắt chuyển một monolith 500k dòng sang microservices mà không downtime. Kế hoạch strangler fig từng bước, gồm cả migration data và anti-corruption layer.',
  a: `**Tóm tắt:** **Strangler fig** là đặt một facade/proxy trước monolith, rồi từng bước thay các phần của monolith bằng service mới, chuyển traffic dần qua canary/feature flag, đồng bộ data bằng CDC và đối soát, cho tới khi phần cũ có thể xóa hẳn. Mục tiêu không phải "viết lại cho sạch" mà là **thu nhỏ dần monolith trong khi sản phẩm vẫn chạy, không downtime**. Anti-corruption layer giữ cho model cũ không "lây" sang service mới.

### Hiểu nhanh
Cây sung bóp cổ (strangler fig) mọc bám quanh một cây chủ, rễ của nó lớn dần, đến khi cây chủ mục đi thì cây sung đã tự đứng vững. Áp vào phần mềm: bạn không đập nhà cũ đi xây lại (rủi ro, phải "đóng cửa" nhiều tháng), mà **sửa từng phòng trong lúc vẫn có người ở**: dựng vách tạm (facade) để khách đi vào phòng mới, chuyển đồ sang dần, kiểm tra kỹ, rồi mới tháo bỏ phòng cũ. Anti-corruption layer giống **người phiên dịch** đứng giữa: phòng mới nói "ngôn ngữ mới", không phải học lại tiếng lóng của nhà cũ.

### Thuật ngữ
- **Strangler fig pattern**: thay thế hệ thống cũ từng phần, phía trước có một lớp định tuyến.
- **Facade / front proxy**: lớp đứng trước monolith (gateway, Nginx, Envoy) quyết định request nào đi vào service mới.
- **Seam**: "đường may" trong code, chỗ có thể cắt một phần ra mà ít ảnh hưởng phần còn lại.
- **Anti-corruption layer (ACL)**: lớp dịch giữa model cũ và model mới để giữ model mới sạch.
- **CDC (Debezium)**: bắt thay đổi từ log của DB monolith để đồng bộ sang DB service mới.
- **Reconciliation job**: job so sánh dữ liệu hai phía, báo lệch.
- **Shadow traffic**: nhân bản request sang service mới để so kết quả, không trả về cho user.
- **Branch by abstraction**: tạo interface trong code monolith, đổi implementation từ module cũ sang client gọi service mới.

Sơ đồ dưới đây: strangler fig từng bước:

~~~seq
title: Strangler fig: facade + canary + CDC
actors: Client | Facade | Monolith | CatalogSvc | Debezium | CatalogDB
Client -> Facade: /api/catalog/*
Facade -> CatalogSvc: 5% traffic
CatalogSvc --> Facade: response
Facade -> Monolith: 95% traffic
Monolith -> Debezium: CDC đồng bộ
Debezium -> CatalogDB: replicate data
note Facade..CatalogSvc: rollback = đổi route
~~~

### Kế hoạch từng bước
1. **Đo và phủ test trước khi đụng**: distributed tracing + test tích hợp cho đúng use case sẽ tách. Vì sao: monolith không có test thì tách là đánh bạc; tracing cho biết ai đang gọi gì.
2. **Chọn seam đầu tiên**: boundary rõ, thay đổi độc lập, **ít join** với phần còn lại, có team nhận trách nhiệm. Ví dụ Catalog hoặc Notification; **đừng** bắt đầu bằng Thanh toán. Vì sao: lần đầu là để học quy trình với rủi ro thấp.
3. **Đặt facade**: gateway/front proxy route theo path hoặc theo %. Vì sao: client không phải biết gì, và rollback chỉ là đổi route.
4. **Anti-corruption layer**: service mới không dùng model/DTO của monolith mà dịch sang domain model riêng. Vì sao: nếu không, sự rối rắm của legacy lan sang service mới và bạn chỉ đổi địa chỉ chứ không tách ranh giới.
5. **Migration data** (phần khó nhất): dùng **CDC (Debezium)** từ DB monolith sang DB service mới; chạy **dual-run** + **reconciliation job** so sánh hai phía, lệch là bug. Mỗi thời điểm chỉ có **một nguồn sự thật cho việc ghi**: hoặc ghi ở monolith rồi CDC sang service, hoặc (giai đoạn sau) ghi qua service mới và monolith đọc qua API/CDC ngược. Có thể dùng **shadow traffic** để so response mà **không** ghi side effect.
6. **Chuyển traffic** bằng canary + SLO (5% → 25% → 100%); rollback = đổi route, vì data đã đồng bộ nên không mất.
7. **Dọn thật sự**: xóa module cũ, xóa bảng cũ, gỡ route, gỡ code. Bước này hay bị bỏ qua nhất.

~~~text
                ┌──► catalog-service (mới)  ← traffic 5% → 100%
client ─► facade┤         ▲ CDC + đối soát
                └──► monolith (cũ)          ← phần còn lại
  /api/catalog/* đi nhánh trên; mọi path khác vẫn vào monolith
~~~

### Ví dụ số liệu tiến độ
~~~text
Quý 1: Catalog    traffic 100% qua service mới, xóa 12 bảng, -40k dòng
Quý 2: Notification 100%, xóa 5 bảng, -15k dòng
Quý 3: Order (khó) 30% canary, dual-run, lệch 0,02% → sửa mapping
Chỉ số: % traffic qua service mới + số dòng/bảng đã XÓA khỏi monolith
~~~

### Dấu hiệu thất bại
- Code chỉ **mọc thêm** (monolith và service mới song song vĩnh viễn): bạn vừa xây "monolith thứ hai".
- Lớp glue/integration phình to và không ai dọn.
- Transaction giờ xuyên service mà chưa có saga/outbox: tạo distributed monolith trước khi tách xong.
- Đội cũ vẫn commit vào phần monolith đã tách: không ai thực sự sở hữu service mới.

### Khi nào KHÔNG nên strangler
- Domain sai từ gốc, phải thiết kế lại hoàn toàn: cân nhắc viết lại, nhưng vẫn dùng facade để chạy song song và chuyển traffic dần.
- Monolith đã nhỏ, module rõ: chỉ cần tách 1–2 chỗ hoặc giữ modular monolith.

### Lỗi hay gặp
1. **Ghi hai nơi cùng lúc (dual write) không có outbox**. Triệu chứng: dữ liệu hai phía lệch dần, không biết bên nào đúng. Cách tránh: một nguồn ghi duy nhất + CDC, hoặc thêm outbox vào monolith trước.
2. **Service mới copy nguyên entity của monolith**. Triệu chứng: đổi bảng cũ là service mới vỡ. Cách tránh: ACL dịch sang model riêng.
3. **Không bao giờ xóa code cũ**. Triệu chứng: sau 2 năm vẫn phải bảo trì cả hai. Cách tránh: đưa bước xóa vào Definition of Done của từng lát cắt.
4. **Bắt đầu bằng module lõi nhiều phụ thuộc nhất**. Triệu chứng: dự án kéo dài, mất niềm tin của business. Cách tránh: thắng nhanh ở module dễ trước.

### Trả lời miệng 1 phút
"Tôi dùng strangler fig: đặt facade trước monolith, chọn seam đầu tiên có boundary rõ và ít join như Catalog, viết service mới với anti-corruption layer để không kế thừa model cũ. Dữ liệu tôi đồng bộ bằng Debezium CDC, chạy dual-run với job đối soát, luôn giữ một nguồn ghi duy nhất, và dùng shadow traffic để so response. Traffic chuyển dần bằng canary theo SLO, rollback chỉ là đổi route. Trade-off là thời gian chạy song song và chi phí đồng bộ. Điều tôi nhấn mạnh với team là bước cuối: xóa code và bảng cũ; tôi đo tiến độ bằng phần trăm traffic qua service mới và số bảng đã xóa khỏi monolith."

### Ví dụ đời thực
  Một ngân hàng monolith 500k dòng Java, 120 bảng, chạy 8 năm. Năm 2023 bắt đầu strangler fig: Quý 1 tách Catalog (sản phẩm, danh mục), Quý 2 tách Notification, Quý 3–4 tách Order (phức tạp nhất). Catalog: facade route {{/api/catalog/**}} sang catalog-service mới (Spring Boot), Debezium CDC sync 12 bảng sang Postgres mới, dual-run 4 tuần, reconciliation job so sánh hàng ngày (count, checksum {{MD5}}), lệch 0,001% do timestamp precision → fix mapping. Traffic canary 5% → 100% trong 2 tuần, xóa 12 bảng và 40k dòng code khỏi monolith. Order: 35 bảng, nhiều join, transaction phức tạp. Dùng branch by abstraction trong monolith: tạo interface {{OrderRepository}}, implement mới gọi order-service gRPC, giữ implement JPA cũ. Shadow traffic 100% so sánh response JPA vs gRPC 3 tuần, lệch 0,02% do floating point rounding → fix bằng BigDecimal. Canary 5% → 30% → 100% trong 6 tuần. Kết quả: sau 1 năm, monolith còn 60k dòng, 45 bảng, 3 service mới tự deploy, lead time feature từ 3 tuần xuống 3 ngày. Đo tiến độ: % traffic qua service mới (Catalog 100%, Notification 100%, Order 30%) + số bảng xóa (57/120). Đây là minh chứng: strangler fig cần CDC + reconciliation + shadow traffic + canary + xóa code cũ, thiếu một bước là không xong.

> Senior tip: đo tiến độ strangler bằng 2 chỉ số: **% traffic đi qua service mới** và **số module/bảng đã xóa khỏi monolith**. Không có chỉ số thứ hai thì đó không phải strangler, đó là copy-paste sang microservices.`,
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
  a: `**Tóm tắt:** theo 12-factor, **config tách khỏi code**, khác nhau giữa môi trường qua **environment** (build một lần, deploy mọi nơi). **Secret không bao giờ nằm trong git hay image**: đọc từ secret manager (Vault, AWS Secrets Manager) lúc runtime, được mã hóa, có audit ai đọc, và rotate được. Config thường để ở ConfigMap/Config Server (có version), feature flag cần rollout có kiểm soát thì AWS AppConfig.

### Hiểu nhanh
Một chiếc máy pha cà phê (artifact) được bán cho nhiều quán. Nhà sản xuất **không hàn cứng** lượng đường, cỡ ly vào máy; mỗi quán tự chỉnh bằng núm vặn (config/environment). Còn **chìa khóa két tiền** (secret) thì không ai dán lên thân máy (image) hay ghi vào sách hướng dẫn (git); chìa được giữ trong **két an toàn có sổ ghi ai mượn** (Vault/Secrets Manager), và định kỳ thay ổ khóa (rotate).

### Thuật ngữ
- **12-factor app**: bộ 12 nguyên tắc xây ứng dụng cloud-native (config, logs, processes…).
- **Spring Cloud Config**: server cấp cấu hình (thường từ git) cho các ứng dụng Spring.
- **ConfigMap / Secret (K8s)**: object Kubernetes chứa cấu hình / dữ liệu nhạy cảm, mount vào pod dạng file hoặc env.
- **AWS AppConfig**: dịch vụ triển khai cấu hình + feature flag dần dần, tự rollback theo CloudWatch alarm.
- **Vault / AWS Secrets Manager**: kho secret mã hóa, có audit, rotate, và (Vault) dynamic secret.
- **Dynamic secret**: credential được sinh riêng cho từng ứng dụng, có TTL, hết hạn thì tự bị thu hồi.
- **@RefreshScope**: annotation Spring Cloud cho phép tạo lại bean khi config thay đổi mà không restart.
- **KMS**: dịch vụ quản lý khóa mã hóa; dữ liệu được mã hóa bằng key do KMS giữ.

### 12-factor liên quan đến config
1. **III. Config**: URL, port, credential là environment, không hard-code; cùng một artifact chạy dev/staging/prod. Vì sao: build lại cho từng môi trường nghĩa là thứ bạn test không phải thứ bạn deploy.
2. **IV. Backing services**: DB, queue, mail đều là "tài nguyên gắn vào" qua config; đổi env là đổi backend.
3. **VI. Processes**: tiến trình stateless, không lưu config runtime vào instance.
4. **XI. Logs**: ghi ra stdout, để nền tảng thu gom; không phụ thuộc đường dẫn file của môi trường.

### Lựa chọn nơi chứa config
| | Cách hoạt động | Ưu | Nhược |
|---|---|---|---|
| **Spring Cloud Config** | server đọc git, app dùng {{spring.config.import=configserver:...}} | lịch sử version, review qua PR, refresh | thêm một service phải sống, phụ thuộc git |
| **K8s ConfigMap** | mount file/env vào pod | native, không thêm thành phần | không có lịch sử (trừ khi quản bằng GitOps); env chỉ đổi khi restart pod, file mount cập nhật sau một lúc |
| **AWS AppConfig** | deploy config + **feature flag** rollout theo %, theo dõi alarm | đổi flag an toàn, tự rollback | gắn với AWS, cần tích hợp vào app |
| **Vault / AWS Secrets Manager** | secret mã hóa, audit, **dynamic secret** (Vault), rotation (Secrets Manager + Lambda) | rotate được, có audit trail | thêm độ trễ đọc, cần cache hợp lý |

Từ Spring Cloud 2020.0 (và với Spring Boot 3), client không còn dùng {{bootstrap.yml}} theo mặc định ({{@EnableConfigServer}} chỉ dành cho phía server); client dùng config import:

~~~yaml
spring:
  application:
    name: order-service        # server chọn file theo tên app + profile
  config:
    import: "optional:configserver:http://config-server:8888"
# secret: không để ở đây; đọc từ Vault/Secrets Manager, ví dụ
# spring.config.import: "aws-secretsmanager:prod/order-db"  (Spring Cloud AWS)
~~~

### Luồng secret đúng (từng bước)
1. **Pod khởi động** với danh tính (Kubernetes ServiceAccount gắn IAM role qua IRSA/Pod Identity, hoặc Vault Kubernetes auth). Vì sao: không cần secret để đi lấy secret.
2. **App đọc secret lúc boot** từ Vault/Secrets Manager, **cache theo TTL** (ví dụ 5–15 phút). Vì sao: Secrets Manager có giới hạn tốc độ gọi API và tính phí theo lượt.
3. **Rotation**: Secrets Manager rotate qua Lambda; Vault dynamic secret tự tạo DB user mới có TTL. App phải chịu được việc mật khẩu đổi (connection pool tạo kết nối mới bằng secret mới).
4. **Audit**: ai đọc secret nào, lúc nào, đều được ghi lại (CloudTrail, Vault audit log).

~~~text
Pod (ServiceAccount) ─IAM role─► Secrets Manager ─► password (cache 10 phút)
                                     │ rotate mỗi 30 ngày (Lambda)
                                     └─ CloudTrail: ai đọc, khi nào
~~~

### Bẫy secret rò rỉ
- **Git**: secret trong repo lộ cho mọi người có quyền đọc và **còn trong history** sau khi xóa. Đã lỡ commit thì **rotate key** là biện pháp duy nhất; xóa file không đủ.
- **Actuator/dump**: {{/actuator/env}}, {{/actuator/configprops}}, heap dump. Spring Boot 3 mặc định che giá trị ở các endpoint này (đừng đặt {{show-values: ALWAYS}}), và vẫn phải chặn chúng khỏi mạng ngoài.
- **Image layer**: {{docker history}} đọc được ENV và file đã COPY vào; secret phải nằm ngoài image.
- **Đọc secret mỗi request**: bị throttle đúng lúc tải cao; luôn cache + refresh nền.
- **File .env local** phải nằm trong .gitignore; {{application-local.yml}} chỉ dành cho dev, không deploy lên.
- **Kubernetes Secret chỉ là base64**, không phải mã hóa: cần bật encryption at rest cho etcd và RBAC chặt, hoặc dùng External Secrets Operator kéo từ secret manager.

### Lỗi hay gặp
1. **Mỗi môi trường một nhánh code / một bản build**. Triệu chứng: bản lên prod khác bản đã test. Cách tránh: một artifact, khác nhau chỉ ở env/secret reference.
2. **@RefreshScope trên bean giữ kết nối**. Triệu chứng: refresh làm DataSource bị tạo lại giữa lúc đang có transaction. Cách tránh: chỉ refresh bean nhẹ (timeout, flag), thay đổi DB credential thì dựa vào rotation của pool hoặc rolling restart.
3. **Không bao giờ thử rotate**. Triệu chứng: đến lúc rotate thật thì app sập vì vẫn giữ mật khẩu cũ. Cách tránh: tập rotate định kỳ như tập deploy.
4. **Secret in ra log**. Triệu chứng: log chứa connection string có mật khẩu. Cách tránh: mask trong logging, quét log bằng công cụ phát hiện secret.

### Trả lời miệng 1 phút
"Theo 12-factor, config là environment chứ không nằm trong code: tôi build một artifact và deploy mọi nơi. Config thường tôi để ConfigMap hoặc Spring Cloud Config để có version và review; feature flag cần rollout từ từ thì AWS AppConfig. Secret thì luôn ở Vault hoặc Secrets Manager: pod lấy bằng danh tính IAM, app đọc lúc boot và cache có TTL, rotation tự động, mọi lần đọc đều có audit. Các bẫy tôi chặn: secret trong git và history, actuator env, image layer, và Kubernetes Secret chỉ là base64. Nếu lỡ commit secret thì việc đầu tiên là rotate, không phải xóa file. Tôi cũng cho phép đổi timeout, flag lúc runtime để on-call tune được."

### Ví dụ đời thực
  Hệ thống 12 service trên AWS EKS. Năm 2023, developer commit file {{application-prod.yml}} chứa {{spring.datasource.password=ProdPass123}} lên git (nhầm đẩy nhánh feature merge vào main). CI/CD build image, deploy production. Triệu chứng: 2 giờ sau, log RDS thấy 50 lần đăng nhập thất bại từ IP lạ (security group từng được mở tạm cho dev). Điều tra: git history vẫn còn secret ({{git log -p}} thấy commit), Docker image layer có file config ({{docker history}} đọc được), {{/actuator/env}} production trả về password plaintext (dev bật {{management.endpoint.env.show-values=ALWAYS}}). Nguyên gốc: secret trong git + image + actuator lộ + thiếu secret scanning CI. Xử lý: (1) **rotate ngay** mật khẩu RDS qua Secrets Manager (Lambda tự động), (2) force push rewrite history ({{git filter-repo}}) và rotate mọi credential khác trong repo, (3) thêm {{truffleHog}} + {{gitleaks}} vào CI pre-commit và pipeline, (4) chặn {{/actuator/env}} bằng Spring Security + network policy, (5) dùng External Secrets Operator kéo secret từ Secrets Manager mount file, không dùng env var, (6) bật encryption at rest cho etcd, RBAC chặt Secret. Kết quả: 6 tháng sau không còn incident lộ secret, CI chặn 3 PR chứa secret. Đây là minh chứng: secret lộ = rotate ngay, không chỉ xóa file; phòng chống bằng CI scanning + actuator lockdown + External Secrets.

> Senior tip: cấu hình vận hành (timeout, tỷ lệ %) nên đổi được lúc runtime: nếu đổi timeout cần redeploy thì bạn sẽ không bao giờ tune nó khi on-call lúc 2 giờ sáng.`,
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

### Hiểu nhanh
Hãy tưởng tượng Kafka như một kho hàng có nhiều lô hàng (partition). Mỗi lô hàng được đánh số thứ tự, và hàng trong cùng một lô luôn được lấy theo đúng thứ tự. Nhóm công nhân (consumer group) chia nhau các lô: một lô chỉ một người phụ trách, để không có hai người cùng lấy hàng cùng một lô. Khi có công nhân mới vào hoặc người nghỉ việc, hàng trong các lô được chia lại – đó là rebalance. Và nếu một công nhân làm việc lâu quá mức, người điều phối cho rằng anh ta đã chết, lấy lô hàng của anh ta giao cho người khác – đồng thời cả kho phải dừng lại để chia lại công việc.

### Thuật ngữ
- **Partition**: một log con có thứ tự trong topic Kafka.
- **Consumer group**: nhóm consumer cùng group.id chia nhau các partition của topic.
- **Rebalance**: quá trình chia lại partition khi consumer vào hoặc ra group.
- **Cooperative Sticky Assignor**: chiến lược chỉ thu hồi partition thực sự cần chuyển, giữ nguyên các partition còn lại.
- **Static membership**: consumer có group.instance.id cố định, restart nhanh không kích hoạt rebalance.
- **max.poll.interval.ms**: thời gian tối đa giữa hai lần poll; quá ngưỡng consumer bị coi là treo và bị đá khỏi group.
- **Offset**: số thứ tự của message trong partition, dùng để đánh dấu đã xử lý tới đâu.
- **Lag**: khoảng cách giữa offset mới nhất và offset đã commit của consumer group.

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

### Lỗi hay gặp
- Đổi thẳng từ eager (Range) sang {{CooperativeStickyAssignor}} bằng một lần rolling deploy ⇒ trong lúc chuyển, các consumer không có assignor chung ⇒ lỗi {{InconsistentGroupProtocolException}}. Phải rolling **2 bước**: lần 1 khai báo cả {{[CooperativeStickyAssignor, RangeAssignor]}}, lần 2 bỏ {{RangeAssignor}}.
- Static membership với **Deployment**: pod mới có HOSTNAME ngẫu nhiên ⇒ {{group.instance.id}} mới ⇒ vẫn rebalance (member cũ chỉ bị loại sau {{session.timeout.ms}}). Static membership phát huy tác dụng với **StatefulSet** (tên ổn định {{order-0}}, {{order-1}}). Nếu hai process cùng {{group.instance.id}} chạy đồng thời, member join sau sẽ **fence** member cũ ({{FencedInstanceIdException}}).
- Static membership + {{session.timeout.ms}} lớn ⇒ pod chết thật thì partition của nó **đứng yên** cho tới khi hết timeout.
- {{max.poll.interval.ms}} quá lớn ⇒ consumer **treo** thật (deadlock, gọi ra ngoài không có timeout) mà heartbeat thread vẫn chạy ⇒ coordinator không phát hiện kịp ⇒ partition kẹt lâu hơn. (Process chết hẳn thì do {{session.timeout.ms}} phát hiện.)

### Trả lời miệng 1 phút
"Khi thiết kế Kafka topic, tôi chọn số partition bằng max(số consumer dự kiến, throughput mục tiêu chia throughput một consumer) và dùng orderId làm key để giữ thứ tự của cùng một đơn hàng. Rebalance là nguyên nhân gây lag tăng vọt, nên tôi dùng cooperative sticky chỉ chuyển partition cần thiết, và static membership để restart pod không gây rebalance. Về offset, tôi xử lý xong rồi mới commit để có at-least-once, đồng thời set max.poll.interval.ms đủ lớn cho batch nặng và giới hạn max.poll.records để poll thường xuyên. Trade-off là nhiều partition hơn tăng metadata và leader election. Kinh nghiệm của tôi là monitor rebalance rate: healthy là 0 rebalance giữa các deploy, có rebalance là dấu hiệu deploy sai hoặc consumer xử lý kẹt."

### Ví dụ đời thực
   Hệ thống logistics 12 service dùng Kafka topic {{shipment.events}} (12 partition) cho tracking vận đơn. Năm 2023, team tăng consumer từ 6 lên 12 pod để xử lý cao điểm Tết, nhưng partition vẫn giữ 12. Triệu chứng: lag tăng từ 0 lên 2 triệu message trong 30 phút, p99 latency từ 200ms lên 8s. Điều tra: {{kafka-consumer-groups}} thấy 12 consumer đều active, mỗi consumer nhận 1 partition; {{kubectl top pods}} thấy trung bình CPU consumer chỉ 15%, network I/O thấp; log consumer thấy 3 consumer trên partition hot đang xử lý chồng chất, còn 9 consumer trên partition lạnh {{poll()}} trả về batch rỗng liên tục. Nguyên gốc: partition = consumer count = 12, nhưng message key phân bố không đều (80% đơn hàng thuộc 3 vùng miền → 3 partition hot); 3 consumer xử lý partition hot quá tải dẫn lag, 9 partition khác gần như rảnh. Xử lý: (1) tăng partition lên 36 (3× consumer), (2) đổi key từ {{regionId}} sang {{shipmentId}} để phân bố đều, (3) bật cooperative sticky + static membership, (4) set {{max.poll.records=200}}, {{max.poll.interval.ms=300000}}. Kết quả: lag giảm về 0 trong 10 phút, p99 latency 350ms, CPU consumer phân bố đều 45–55%. Đây là minh chứng: partition phải ≥ consumer count VÀ key phải phân bố đều, không chỉ bằng nhau về số lượng.

### Trả lời mẫu khi phỏng vấn
"Với Kafka, số partition tôi đặt bằng max(số consumer tối đa dự kiến, throughput mục tiêu chia throughput một consumer). Quan trọng hơn là key phải phân bố đều — tôi dùng ID nghiệp vụ như orderId hay shipmentId chứ không dùng region hay status. Về rebalance, tôi dùng CooperativeStickyAssignor để chỉ chuyển partition cần thiết, và static membership với group.instance.id gắn liền pod (StatefulSet) để restart không gây rebalance. Cấu hình quan trọng: max.poll.interval.ms đủ lớn cho batch nặng (5–30 phút), max.poll.records nhỏ để poll thường xuyên, và luôn monitor rebalance rate — healthy là 0 rebalance giữa các deploy. Trade-off là partition nhiều hơn tăng metadata và leader election, nên tôi chỉ tăng khi thực sự cần."

> Senior tip: monitor **rebalance rate** (metric {{rebalance-total}} / phút). Healthy = 0 rebalance giữa các deploy. Có rebalance = hoặc deploy sai, hoặc max.poll.interval.ms phải thấp, hoặc consumer xử lý kẹt.`,
  follow: [
    'Tăng partition cho topic đang chạy: key mapping thay đổi như thế nào, bạn xử lý ordering ra sao?',
    'Cooperative sticky hoạt động thế nào khi consumer join/leave đồng thời?',
    'Static membership + K8s rolling update: preStop delay nên đặt bao nhiêu so với session.timeout.ms?'
  ],
  tags: ['Kafka', 'partition', 'rebalance', 'cooperative sticky', 'static membership'],
  refs: [
    { type: 'doc', title: 'Kafka consumer configuration', url: 'https://kafka.apache.org/documentation/#consumerconfigs' },
  ]
},
{
  id: 'microservices-020',
  topic: 'microservices',
  level: 'senior',
  q: 'Spring Kafka hỗ trợ blocking retry ({{DefaultErrorHandler}} + BackOff) và non-blocking retry ({{@RetryableTopic}}). Hai chế độ khác nhau thế nào, bạn cấu hình DLT ra sao, và retry ảnh hưởng ordering thế nào?',
  a: `**Tóm tắt:** **Blocking retry** = container gọi lại listener ngay trên partition đó (có backoff) qua {{DefaultErrorHandler}} – đơn giản, **giữ ordering** nhưng **kẹt partition**. **Non-blocking retry** = {{@RetryableTopic}} đẩy message lỗi sang các topic {{-retry}} riêng, consumer chính tiếp tục xử lý message sau – **không kẹt partition** nhưng **mất ordering** theo key. Hết lượt retry ⇒ message vào DLT ({{-dlt}}).

### Hiểu nhanh
Hãy tưởng tượng bạn đang xử lý đơn hàng trên một băng chuyền (partition Kafka). **Blocking retry** giống như khi phát hiện sản phẩm lỗi, bạn dừng cả băng chuyền, sửa sản phẩm đó rồi mới cho chạy tiếp – đơn giản, giữ đúng thứ tự nhưng cả dây chuyền đứng yên. **Non-blocking retry** giống như bỏ sản phẩm lỗi sang một kệ riêng (topic retry), băng chuyền chính chạy tiếp – không bị kẹt nhưng sản phẩm sau có thể đến tay khách trước sản phẩm lỗi (mất ordering). Cả hai cuối cùng đều đẩy sản phẩm không sửa được vào kho "để sau xử lý" (DLT).

### Thuật ngữ
- **Blocking retry**: Gọi lại listener ngay trên partition, seek lại offset, chờ backoff – giữ ordering, kẹt partition.
- **Non-blocking retry**: Chuyển message lỗi sang topic retry riêng, consumer chính tiếp tục poll – không kẹt partition, mất ordering.
- **DLT (Dead Letter Topic)**: Topic chứa message hết lượt retry hoặc lỗi không retry được, để debug/replay sau.
- **BackOff**: Chiến lược chờ giữa các lần retry (FixedBackOff, ExponentialBackOff).
- **Pause partition**: Non-blocking retry tạm dừng partition của topic retry cho đến khi đến hạn delay.
- **exclude / addNotRetryableExceptions**: Danh sách exception không retry, đẩy thẳng DLT (ví dụ BusinessException, DeserializationException).
- **Recoverer**: Xử lý khi hết retry – DeadLetterPublishingRecoverer ghi DLT.
- **idempotent consumer**: Xử lý trùng message không gây side effect – bắt buộc khi dùng non-blocking retry.

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
- Lỗi ⇒ message được publish sang {{order.created-retry-0}}, {{-retry-1}}… (hậu tố theo index, như cấu hình ở trên; có thể chọn hậu tố theo giá trị delay), kèm header như {{retry_topic-attempts}}, {{retry_topic-backoff-timestamp}}.
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

### Lỗi hay gặp
1. **Retry mọi exception**. Triệu chứng: lỗi validation retry 4 lần, tốn thời gian, rồi vẫn vào DLT. Cách tránh: addNotRetryableExceptions / exclude cho lỗi nghiệp vụ và lỗi deserialize.
2. **Blocking retry với tổng backoff dài**. Triệu chứng: partition đứng hàng phút, lag tăng, thậm chí vượt max.poll.interval.ms. Cách tránh: tổng backoff ngắn (vài giây); retry dài thì dùng non-blocking.
3. **Bật @RetryableTopic cho event cần thứ tự**. Triệu chứng: Cancelled được xử lý trước Created. Cách tránh: blocking retry, hoặc consumer kiểm tra version/state.
4. **Không ai theo dõi DLT và topic retry**. Triệu chứng: hàng nghìn message lỗi nằm im nhiều tuần. Cách tránh: alert theo số message vào DLT và lag của từng topic retry.

### Trả lời miệng 1 phút
"Khi tôi thiết kế Kafka consumer, tôi phân loại lỗi trước: lỗi transient như timeout, 503 thì retry; lỗi nghiệp vụ hay validation thì đưa thẳng DLT, không bao giờ retry 5 lần. Tôi ưu tiên blocking retry khi cần giữ thứ tự của cùng một đơn hàng và retry ngắn (vài giây tổng) để không kẹt partition. Khi throughput quan trọng hơn thứ tự, tôi dùng non-blocking retry (@RetryableTopic) đẩy message lỗi sang topic -retry riêng, consumer chính tiếp tục chạy – nhưng tôi phải thiết kế consumer idempotent vì event cùng key có thể đến sai thứ tự. Cuối cùng, hết lượt retry thì message vào DLT, tôi luôn alert theo số message trong DLT vì đó là dấu hiệu bug đang chờ fix."

### Ví dụ đời thực
   Hệ thống ngân hàng số dùng Spring Kafka xử lý 50 triệu giao dịch/ngày trên topic {{transfer.events}}. Năm 2023, team bật non-blocking retry (@RetryableTopic, attempts=4, backoff 2s→4s→8s) cho toàn bộ consumer. Triệu chứng: DLT {{transfer.events-dlt}} nhận 500k message/ngày (trước là 200), p99 latency consumer từ 150ms lên 2.5s, alert DLT reo liên tục. Điều tra: log DLT thấy 80% là {{BusinessException}} (số dư không đủ, tài khoản khóa) — lỗi nghiệp vụ hợp lý, không nên retry; topic retry {{-retry-0/-1/-2}} lag tổng 1.2 triệu, consumer retry đang pause partition chờ backoff; metric {{consumer-lag}} topic gốc 0 nhưng retry topic lag cao. Nguyên gốc: config retry không exclude BusinessException, khiến lỗi hợp lý bị thử hết 4 lần rồi mới vào DLT, làm phình retry topic và tiêu tài nguyên. Xử lý: (1) thêm exclude cho BusinessException và ValidationException, (2) lỗi deserialize/validation vào DLT ngay, (3) alert DLT theo loại exception (business vs technical). Kết quả: DLT giảm từ 500k xuống 80k/ngày (chỉ còn lỗi technical thực sự), retry topic lag 0, p99 latency 180ms. Đây là minh chứng: phân loại lỗi trước khi retry là bắt buộc, non-blocking retry không phải "bật là xong".

### Trả lời mẫu khi phỏng vấn
"Với Spring Kafka, tôi phân biệt rõ blocking retry (DefaultErrorHandler) và non-blocking retry (@RetryableTopic). Blocking retry seek lại offset, gọi lại listener trên partition đó — giữ ordering nhưng kẹt partition; phù hợp retry ngắn (< 10s tổng) và event cần thứ tự. Non-blocking retry đẩy message lỗi sang topic -retry riêng, consumer chính tiếp tục poll — không kẹt partition nhưng phá ordering theo key; phù hợp throughput cao, retry lâu. Quan trọng nhất là phân loại lỗi: transient (timeout, 503) thì retry, business/validation thì exclude vào DLT ngay. DLT phải có alert, vì DLT tăng = bug đang chờ fix. Tôi luôn chọn blocking retry cho state-change event của cùng aggregate, non-blocking cho event phụ."

> Senior tip: phân loại lỗi trước khi chọn chế độ: lỗi transient (timeout, 503) ⇒ retry; lỗi nghiệp vụ/validation ⇒ {{exclude}}/{{addNotRetryableExceptions}} để vào DLT ngay, đừng retry 5 lần. Non-blocking retry thêm topic + consumer phải monitor lag riêng cho từng topic {{-retry-*}}; với event cần thứ tự (state change của cùng một đơn hàng) hãy cân nhắc kỹ trước khi bật.`,
  follow: [
    'Non-blocking retry pause partition của topic retry để chờ backoff – bạn monitor lag của các topic -retry ra sao?',
    'Khi nào nên dùng blocking retry thay vì non-blocking?',
    'Consumer làm sao chịu được việc event cùng key đến sai thứ tự sau retry?'
  ],
  tags: ['Kafka', 'Spring Kafka', '@RetryableTopic', 'DLQ', 'non-blocking retry'],
  refs: [
    { type: 'doc', title: 'Spring for Apache Kafka: Non-Blocking Retries', url: 'https://docs.spring.io/spring-kafka/reference/retrytopic.html' },
    { type: 'doc', title: 'Spring for Apache Kafka: Error Handling', url: 'https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html' },
  ]
},
{
  id: 'microservices-021',
  topic: 'microservices',
  level: 'senior',
  q: 'Team đang dùng JSON cho event Kafka, gặp lỗi khi thêm field mới mà consumer cũ không đọc được. Giải thích Schema Registry (Avro/Protobuf), backward vs forward compatibility, và quy tắc evolve schema an toàn.',
a: `**Tóm tắt:** JSON không có contract ⇒ producer thêm field, consumer cũ crash (missing field) hoặc producer xoá field, consumer cũ đọc null sai ngữ nghĩa. **Schema Registry** lưu schema theo version, kiểm tra compatibility trước khi register. **Backward compatibility** (mặc định): consumer dùng schema mới đọc được data cũ - **consumer deploy trước**; **Forward compatibility**: consumer dùng schema cũ đọc được data ghi bằng schema mới - **producer deploy trước**.

### Hiểu nhanh
Hãy tưởng tượng JSON như một lá thư tay không có mẫu: ai viết gì thì viết, người nhận cũ không hiểu được khi thêm/xoá từ. **Schema Registry** giống như một văn phòng đăng ký mẫu thư có số version: người gửi phải dùng mẫu đã đăng ký, người nhận dùng cùng một mẫu để hiểu nhau. **Backward compatibility** là người nhận (consumer) cập nhật mẫu mới trước, vẫn hiểu được thư cũ; **Forward compatibility** là người gửi (producer) dùng mẫu mới trước, người nhận cũ vẫn hiểu được thư mới. Quy tắc vàng: chỉ thêm từ (field) có thể bỏ qua (default), không bao giờ xoá hoặc đổi loại từ.

### Thuật ngữ
- **Schema Registry**: Server lưu schema theo version, kiểm tra compatibility khi register; producer serializer tự fetch schema ID (magic byte + 4 bytes ID).
- **Backward compatibility**: Consumer deploy trước – schema mới có thể đọc data cũ (xoá field hoặc thêm field có default).
- **Forward compatibility**: Producer deploy trước – schema cũ có thể đọc data mới (thêm field hoặc xoá field có default).
- **FULL compatibility**: Cả hai điều kiện – chỉ thêm/xoá field có default.
- **Avro**: Schema JSON, binary compact, hỗ trợ union/nullable, logic compatibility mạnh.
- **Protobuf**: .proto file, codegen typed, backward/forward compatibility qua field number (không đổi number, không đổi type).
- **Transitive modes**: Kiểm tra với mọi version cũ, không chỉ version liền trước.
- **Compatibility check**: CI/CD gọi REST API /compatibility/subjects/.../versions/latest trước khi merge.

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

### Lỗi hay gặp
1. **Bật auto-register schema ở production**. Triệu chứng: một bản build lỗi đăng ký schema lạ, consumer vỡ. Cách tránh: chỉ CI được đăng ký, production đặt auto.register.schemas=false.
2. **Thêm field không có default với BACKWARD**. Triệu chứng: registry từ chối đăng ký, hoặc (nếu đặt NONE) consumer mới không đọc được dữ liệu cũ. Cách tránh: mọi field mới đều có default.
3. **Tái sử dụng field number trong Protobuf**. Triệu chứng: dữ liệu cũ bị hiểu sai nghĩa mà không báo lỗi. Cách tránh: đánh dấu reserved cho number và tên đã xóa.
4. **Đặt NONE rồi quên bật lại**. Triệu chứng: vài tháng sau có breaking change lọt vào. Cách tránh: đổi mode bằng PR có review và có hạn bật lại.

### Trả lời miệng 1 phút
"JSON thuần không có contract, nên producer thêm hoặc bỏ field là consumer cũ có thể lỗi mà không ai được cảnh báo trước. Tôi chuyển sang Avro hoặc Protobuf với Schema Registry: mỗi message chỉ mang schema ID, registry lưu schema theo version và kiểm tra compatibility ngay lúc đăng ký. Chế độ BACKWARD mặc định nghĩa là schema mới đọc được dữ liệu cũ, nên consumer deploy trước; FORWARD thì producer deploy trước; hai bên deploy độc lập thì chọn FULL_TRANSITIVE. Quy tắc của tôi là chỉ thêm field có default, không đổi kiểu, không đổi tên, muốn xóa thì deprecate rồi dọn sau vài release. Trade-off là thêm một hệ thống phải vận hành, nên tôi chạy compatibility check trong CI và tắt auto-register ở production."

### Ví dụ đời thực
   Hệ thống e-commerce 20 service dùng Avro + Schema Registry cho event {{order.events}}. Năm 2023, team pricing thêm trường discountStrategy (loại enum, giá trị {"NONE", "PERCENT"}, default "NONE") vào schema {{OrderCreated}} và sau đó bổ sung giá trị "LOYALTY". Chế độ registry là BACKWARD (schema mới đọc được data cũ). Triệu chứng: rolling deploy consumer mới trước producer, nhưng các instance consumer CŨ chưa cập nhật codegen nhận event mới có discountStrategy=LOYALTY và ném {{org.apache.avro.AvroTypeException: Unknown enum symbol LOYALTY}}, đổi lấy crash. Điều tra: consumer dùng generated class cũ không có symbol LOYALTY; Avro không biết ánh xạ symbol mới ⇒ deserialization fail; Schema Registry accept schema vì BACKWARD chỉ yêu cầu schema mới đọc data cũ, không ngụ ý consumer cũ đọc được data mới (đó là FORWARD). Nguyên gốc: BACKWARD compatibility không bảo vệ consumer cũ khi producer đã ghi data mới; phải đảm bảo TẤT CẢ consumer đã regenerate code và rollout xong TRƯỚC khi producer ghi schema mới. Xử lý: (1) thêm bước CI: consumer phải {{mvn generate-sources}} và compile thành công với schema mới TRƯỚC khi producer deploy, (2) quy tắc rolling: chờ toàn bộ consumer instance mới chạy ổn định (instance cũ hết) rồi mới deploy producer ghi schema mới, (3) Avro config: {{specific.avro.reader=true}}. Kết quả: 6 tháng sau, 15 schema evolution không còn crash consumer, lead time thêm field từ 2 ngày xuống 2 giờ. Đây là minh chứng: compatibility check ở registry cần đi kèm thứ tự deploy consumer-trước-producer và codegen consumer phải kịp schema mới.

### Trả lời mẫu khi phỏng vấn
"Với Schema Registry, tôi dùng Avro hoặc Protobuf thay vì JSON. Registry lưu schema theo version, kiểm tra compatibility khi register. BACKWARD (mặc định): schema mới đọc được data cũ → consumer deploy trước; FORWARD: schema cũ đọc được data mới → producer deploy trước; FULL: cả hai. Quy tắc cứng: chỉ thêm field có default, không đổi type/ten, xoá thì deprecate. Quan trọng: CI phải chạy compatibility check trước merge, tắt auto.register.schemas ở production. Với Avro, consumer phải regenerate code trước khi producer deploy schema mới — tôi enforce bằng pipeline. Trade-off là vận hành thêm một hệ thống, nhưng đổi lấy không còn 'surprise' schema ở production."

> Senior tip: CI/CD **bắt buộc** chạy compatibility check (ví dụ goal {{test-compatibility}} của {{kafka-schema-registry-maven-plugin}}, hoặc gọi REST {{/compatibility/subjects/.../versions/latest}}) trước khi merge. Một PR thay đổi {{.avsc}}/.proto mà fail check = không merge. Không có exception - production không phải nơi test schema.`,
  follow: [
    'Avro union type xử lý nullable như thế nào so với Protobuf optional?',
    'Khi nào chọn FORWARD thay vì BACKWARD?',
    'Schema Registry HA thế nào, producer fetch schema ID cache như thế nào?'
  ],
  tags: ['Schema Registry', 'Avro', 'Protobuf', 'backward compatibility', 'forward compatibility'],
  refs: [
    { type: 'doc', title: 'Confluent Schema Evolution and Compatibility', url: 'https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html' },
    { type: 'doc', title: 'Apache Avro Specification', url: 'https://avro.apache.org/docs/current/specification/' },
  ]
},
{
  id: 'microservices-022',
  topic: 'microservices',
  level: 'senior',
  q: 'So sánh Inbox pattern và Outbox pattern để đạt exactly-once effect khi consume event. Bạn implement idempotent consumer bằng bảng processed_message như thế nào?',
  a: `**Tóm tắt:** **Outbox** giải quyết **ghi DB + publish event** atomic ở **producer**; **Inbox** giải quyết **consume event + ghi DB** atomic ở **consumer**. Cả hai cùng mục tiêu: side effect chỉ xảy ra đúng 1 lần. Inbox dùng bảng {{processed_message(msg_id PK, processed_at)}} insert trong cùng transaction với business write - trùng message ⇒ PK conflict ⇒ bỏ qua.

### Hiểu nhanh
Giả sử bạn có một cửa hàng online: **Outbox** giống như ghi đơn hàng vào nhật ký (outbox) trong cùng một phép tính với việc lưu vào database - nếu lưu được thì mới gửi email xác nhận. **Inbox** giống như bạn khi nhận đơn hàng, kiểm tra xem đơn này đã xử lý chưa (bảng processed_message) trước khi xử lý nghiệp vụ. Cả hai đều đảm bảo không xử lý trùng và không mất đơn, nhưng ở hai vị trí khác nhau.

### Thuật ngữ
- **Outbox**: Ghi business row + outbox row trong cùng transaction producer, rồi relay publish event sau.
- **Inbox**: Insert processed_msg + business row trong cùng transaction consumer, dedup bằng PK.
- **Exactly-once**: Side effect chỉ xảy ra đúng 1 lần (dù broker chỉ at-least-once).
- **Processed message**: Bảng lưu msg_id đã xử lý, dùng để dedup consumer.
- **Duplicate key**: Lỗi khi insert message đã tồn tại - dùng để bỏ qua message trùng.
- **Idempotent consumer**: Consumer xử lý message trùng không gây side effect.
- **Transaction**: Lưu DB + insert processed_message trong cùng transaction để đảm bảo atomicity.
- **Relay**: Polling/CDC để đẩy outbox row thành event ra broker.

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

### Lỗi hay gặp
- processed_message table **phình vô hạn** ⇒ job dọn row cũ (TTL 7–30 ngày) + partition theo ngày.
- Nếu msg_id là {{topic-partition-offset}}: chỉ chặn được **consumer đọc lại** cùng một record; producer gửi trùng (retry không idempotent, outbox relay publish 2 lần) tạo record **offset mới** ⇒ lọt. Mirror/khôi phục topic cũng đổi offset ⇒ dùng event ID do producer sinh trong payload/header an toàn hơn.
- PostgreSQL: lỗi duplicate key làm **cả transaction bị abort** – catch exception rồi chạy tiếp câu SQL khác sẽ lỗi "current transaction is aborted". Dùng {{INSERT ... ON CONFLICT (msg_id) DO NOTHING}} và kiểm tra số dòng ảnh hưởng = 0 thay vì bắt exception.
- **Transaction timeout**: insert processed_msg + business write phải nhanh; tránh call API ngoài trong transaction.

### Trả lời miệng 1 phút
"Khi tôi cần đảm bảo một sự kiện chỉ được xử lý đúng một lần, tôi áp dụng Inbox pattern: dùng bảng processed_message với msg_id là khóa chính, insert trong cùng transaction với ghi nghiệp vụ - nếu message trùng, PK conflict và tôi bỏ qua. Outbox thì dùng ở phía producer khi tôi vừa ghi database vừa phải gửi event - ghi cả hai trong một transaction rồi relay sau. Nếu tôi kiểm soát cả producer và consumer, tôi dùng cả hai: Outbox ở producer, Inbox ở consumer, đảm bảo exactly-once effect dù broker chỉ at-least-once."

### Ví dụ đời thực
   Hệ thống thanh toán fintech xử lý 20 triệu transaction/ngày, consume event {{payment.created}} từ Kafka. Năm 2023, team chỉ dùng Outbox ở producer (payment-service) nhưng consumer (ledger-service) không có Inbox pattern. Triệu chứng: ledger-service ghi sổ cái bị double-entry 0.3% (60k dòng/ngày), reconciliation job phát hiện lệch số dư. Điều tra: log consumer thấy cùng {{msg_id}} được xử lý 2 lần trong 5 phút; Kafka consumer group rebalance do pod OOMKilled, offset chưa commit kịp, message bị đọc lại; producer có outbox nên không gửi trùng, nhưng consumer không dedup. Nguyên gốc: chỉ có Outbox ở producer, thiếu Inbox ở consumer để chặn duplicate khi rebalance/crash. Xử lý: (1) thêm bảng {{processed_message(msg_id PK, processed_at)}}, (2) consumer insert processed_msg + ghi ledger trong CÙNG transaction, (3) dùng {{INSERT ... ON CONFLICT DO NOTHING}} (PostgreSQL) thay vì catch exception, (4) TTL 30 ngày + partition theo ngày cho processed_message. Kết quả: double-entry giảm từ 60k xuống 0/ngày, reconciliation job 0 lệch sau 2 tuần. Đây là minh chứng: Outbox bảo vệ producer, Inbox bảo vệ consumer — cần cả hai cho end-to-end exactly-once.

### Trả lời mẫu khi phỏng vấn
"Outbox pattern giải quyết dual-write ở producer: ghi business row + outbox row trong cùng transaction, relay sau đẩy event ra Kafka. Inbox pattern giải quyết duplicate ở consumer: insert processed_message (msg_id PK) + business write trong CÙNG transaction — trùng thì PK conflict, bỏ qua. Cả hai cùng mục đích: biến at-least-once của broker thành exactly-once effect. Nếu kiểm soát cả hai đầu, tôi dùng cả hai. Lưu ý: msg_id nên dùng event ID từ payload (không dùng Kafka offset, vì mirror/restore đổi offset), PostgreSQL dùng ON CONFLICT DO NOTHING thay vì catch exception (vì duplicate key abort transaction). Inbox table cần TTL dọn dẹp định kỳ."

> Senior tip: Inbox table là "bảo hiểm" rẻ - luôn thêm khi consume event từ team khác. Chi phí 1 INSERT + 1 index lookup, đổi lấy an tâm không double-charge.`,
  follow: [
    'msg_id dùng Kafka offset hay event ID từ payload, ưu nhược điểm nào?',
    'Inbox pattern xử lý transaction timeout (DB lock) khi volume cao ra sao?',
    'Khi nào natural key upsert thay thế processed_message table được, khi nào không?'
  ],
  tags: ['Inbox pattern', 'Outbox pattern', 'idempotent consumer', 'exactly-once'],
  refs: [
    { type: 'doc', title: 'Pattern: Transactional outbox', url: 'https://microservices.io/patterns/data/transactional-outbox.html' },
    { type: 'doc', title: 'Pattern: Idempotent Consumer', url: 'https://microservices.io/patterns/communication-style/idempotent-consumer.html' },
  ]
},
{
  id: 'microservices-023',
  topic: 'microservices',
  level: 'lead',
  refs: [
    { type: 'doc', title: 'Pattern: Saga', url: 'https://microservices.io/patterns/data/saga.html' },
    { type: 'doc', title: 'Temporal Documentation', url: 'https://docs.temporal.io/' },
    { type: 'doc', title: 'Camunda 8 Documentation', url: 'https://docs.camunda.io/' },
  ],
  q: 'Hệ thống dùng choreography (event-driven) nhưng flow đơn hàng qua 6 service, debug khó, timeout lẫn nhau. Bạn chuyển sang orchestration (Temporal/Camunda) khi nào, và so sánh hai cách về observability, compensation, versioning.',
  a: `**Tóm tắt:** **Choreography**: mỗi service tự phát và tự phản ứng với event, không ai điều phối; đơn giản lúc đầu, nhưng khi flow dài (quá 3–4 service) sẽ thành "spaghetti event": khó thấy toàn cảnh, timeout chồng chéo, compensation rải rác. **Orchestration**: một **workflow engine** (Temporal, Camunda) hoặc orchestrator tự viết điều phối từng bước, state tập trung, observability tốt, compensation có thứ tự. Tôi chuyển khi flow phức tạp, cross-team, cần timeout/retry tập trung, cần chờ tín hiệu bên ngoài, hoặc bắt buộc có audit trail.

### Hiểu nhanh
**Choreography** giống một **đội bóng không có huấn luyện viên**: mỗi cầu thủ tự nhìn đồng đội mà chạy chỗ. Đội 3 người thì ổn, đội 11 người thì rối, và khi thua không ai biết lỗi tại ai. **Orchestration** giống **nhạc trưởng** cầm bản tổng phổ: biết đoạn nào ai chơi, ai chơi sai thì dừng lại và xử lý theo kịch bản. Nhạc trưởng là thêm một người phải nuôi, nhưng với dàn nhạc lớn thì không có không được.

### Thuật ngữ
- **Choreography**: phối hợp phi tập trung qua event, mỗi service tự biết mình phản ứng với event nào.
- **Orchestration**: một thành phần trung tâm ra lệnh từng bước và theo dõi trạng thái flow.
- **Workflow engine**: hệ thống chạy và lưu trạng thái workflow bền vững (Temporal, Camunda).
- **Activity (Temporal)**: một bước gọi ra bên ngoài (API, DB), được retry/timeout theo cấu hình.
- **Deterministic workflow**: code workflow phải cho cùng kết quả khi chạy lại từ lịch sử, nên không được gọi random, giờ hệ thống, I/O trực tiếp.
- **BPMN**: chuẩn vẽ quy trình nghiệp vụ dạng sơ đồ, Camunda chạy trực tiếp sơ đồ này.
- **Compensation**: hành động nghiệp vụ đảo ngược một bước đã hoàn tất.
- **Human-in-the-loop**: bước cần người thao tác (duyệt, nhập OTP) trước khi flow đi tiếp.

### Choreography: khi nào đủ, khi nào quá tải
1. **Đủ**: tối đa khoảng 3 service, flow tuyến tính, cùng team, ít rẽ nhánh, không có bước của con người. Vì sao: ai cũng nắm được toàn bộ luồng trong đầu.
2. **Quá tải**: fan-out/fan-in phức tạp, nhiều nhánh điều kiện, phải chờ tín hiệu ngoài (OTP, duyệt tay), compensation phải lùi nhiều bước, nhiều team mà không ai chịu trách nhiệm end-to-end.
3. **Observability**: phải có distributed tracing mới thấy luồng; một event lỗi không rõ thuộc flow nào, đơn "kẹt" ở đâu.
4. **Versioning**: thêm bước = thêm consumer mà producer không biết; đổi schema event phải phối hợp mọi consumer.
5. **Timeout**: mỗi service tự đặt timeout của mình, không ai giữ "deadline tổng" cho cả đơn hàng.

~~~text
Choreography (6 service):              Orchestration:
Order ─evt─► Stock ─evt─► Payment       Orchestrator ─cmd─► Stock
   ▲            │           │                │      ─cmd─► Payment
   └──evt── Shipping ◄─evt──┘                │      ─cmd─► Shipping ...
  "đơn 123 đang ở đâu?" → đọc 6 log        state đơn 123 = 1 dòng/1 workflow
~~~

### So sánh trên 3 tiêu chí của câu hỏi
| | Choreography | Orchestration |
|---|---|---|
| Observability | ghép trace + log từ nhiều service | engine hiển thị từng bước, input/output, lỗi |
| Compensation | mỗi service tự nghe event lỗi và tự bù, thứ tự khó đảm bảo | orchestrator chạy bù theo thứ tự ngược, có retry/timeout riêng |
| Versioning | đổi event phải phối hợp mọi consumer | version workflow/process; instance cũ chạy tiếp theo version cũ |

### Temporal vs Camunda vs tự viết
| | Temporal | Camunda 8 (Zeebe) | Spring StateMachine / tự viết |
|---|---|---|---|
| Model | code-first (Java SDK, workflow = code) | sơ đồ BPMN + biểu thức FEEL | Java code + bảng state |
| State | lưu toàn bộ event history, replay để khôi phục | biến được lưu bền, incident khi lỗi | tự quản lý trong DB |
| Retry/timeout | có sẵn, heartbeat cho activity dài | có sẵn | tự viết |
| Scale | worker poll task queue, scale ngang | broker Zeebe scale ngang | tùy cách làm |
| Hợp với | team backend thích viết code | BA + dev cùng làm việc trên BPMN | flow nhỏ, team nhỏ |
| Lock-in | Temporal server (tự host/Cloud) | Camunda SaaS/tự host | không |

- **Temporal**: workflow viết bằng Java (hoặc Go, TypeScript…), **thực thi deterministic**: khi worker chết, worker khác replay history để khôi phục đúng chỗ. Có activity heartbeat cho việc chạy lâu, **continue-as-new** để cắt history khi workflow rất dài. Versioning bằng {{Workflow.getVersion}} hoặc worker versioning.
- **Camunda 8 (Zeebe)**: BPMN 2.0, client gọi qua gRPC/REST; instance đang chạy giữ version process cũ, có công cụ migrate instance.

### Compensation trong orchestration
1. Mỗi bước đăng ký **hành động bù** ngay sau khi thành công.
2. Khi một bước thất bại hẳn (hết retry), chạy các hành động bù theo thứ tự ngược (LIFO).
3. Bản thân hành động bù cũng có retry/timeout, và workflow hiển thị trạng thái "compensating".

~~~java
Saga saga = new Saga(new Saga.Options.Builder().build());   // io.temporal.workflow.Saga
try {
    activities.reserveStock(orderId);
    saga.addCompensation(activities::releaseStock, orderId);  // bù cho bước 1
    activities.chargePayment(orderId);
    saga.addCompensation(activities::refundPayment, orderId); // bù cho bước 2
    activities.createShipment(orderId);
} catch (ActivityFailure e) {
    saga.compensate();   // chạy bù theo thứ tự ngược
    throw e;
}
~~~
Camunda dùng compensation event / boundary event trên sơ đồ. Ưu điểm so với choreography: **thứ tự bù được đảm bảo**, bù có timeout và retry riêng, và nhìn được trạng thái.

### Khi nào KHÔNG cần workflow engine
- Flow dưới 3 service, tuyến tính, không rẽ nhánh, không có bước của người.
- Team chưa sẵn sàng vận hành thêm engine (monitor, upgrade, backup DB của engine).
- Saga đơn giản: bảng saga state + state machine trong service là đủ.

### Lỗi hay gặp
1. **Code workflow Temporal không deterministic** (gọi {{LocalDateTime.now()}}, random, HTTP trực tiếp). Triệu chứng: replay lỗi "non-deterministic", workflow kẹt. Cách tránh: dùng {{Workflow.currentTimeMillis()}}, mọi I/O đưa vào activity, test bằng replay history.
2. **Sửa logic workflow đang chạy mà không version**. Triệu chứng: instance cũ replay sai nhánh. Cách tránh: {{Workflow.getVersion}} hoặc worker versioning.
3. **Đưa logic nghiệp vụ chi tiết vào orchestrator**. Triệu chứng: orchestrator thành "god service". Cách tránh: orchestrator chỉ điều phối; luật nghiệp vụ nằm trong service.
4. **Chuyển toàn bộ sang orchestration**. Triệu chứng: cả những thông báo phụ cũng phải đi qua engine. Cách tránh: flow chính dùng orchestration, tác vụ phụ (email, analytics) vẫn nghe event.

### Trả lời miệng 1 phút
"Choreography ổn khi flow ngắn, tuyến tính và cùng team. Khi đơn hàng đi qua 6 service, có rẽ nhánh, chờ tín hiệu ngoài và compensation nhiều bước, tôi chuyển sang orchestration. Về observability, engine như Temporal cho thấy từng bước, input, lỗi của từng đơn thay vì phải ghép log 6 service. Về compensation, orchestrator đăng ký hành động bù sau mỗi bước và chạy ngược theo thứ tự khi thất bại, có retry riêng. Về versioning, workflow có version, instance cũ chạy tiếp logic cũ. Trade-off là thêm một hệ thống phải vận hành và code workflow phải deterministic. Tôi giữ event cho các tác vụ phụ, không đưa tất cả vào engine."

### Ví dụ đời thực
   Hệ thống đặt tour du lịch 8 service dùng choreography cho flow booking: Search → Quote → Booking → Payment → Voucher → Supplier → Confirmation → Notification. Năm 2023, team phát hiện 15% booking kẹt ở trạng thái "PAID" mà không tạo được voucher, customer service phải xử lý tay 200 ticket/ngày. Triệu chứng: Jaeger trace thấy event {{PaymentSucceeded}} phát ra nhưng {{VoucherService}} không nhận (consumer pod restart lúc đó); compensation không chạy vì không có event lỗi; timeout các service không đồng bộ (Payment 30s, Voucher 60s, Supplier 120s). Điều tra: choreography không có state tập trung — "booking 12345 đang ở bước nào?" phải ghép log 8 service; compensation rải rác, mỗi service tự lo, thứ tự không đảm bảo. Nguyên gốc: flow 8 service, cross-team, có human-in-the-loop (supplier duyệt tay), choreography quá tải. Xử lý: (1) chuyển sang Temporal workflow cho booking chính, (2) activity: reserveQuote → chargePayment → createVoucher (retry 3×, timeout 60s) → callSupplier (heartbeat 5p, timeout 24h) → sendConfirmation, (3) compensation tự động: refundPayment → releaseQuote, (4) tác vụ phụ (notification, analytics) vẫn dùng event. Kết quả: booking kẹt giảm từ 15% xuống 0.2%, thời gian xử lý từ 45p xuống 8p (tự động), ticket customer service từ 200 xuống 5/ngày. Đây là minh chứng: choreography quá 3-4 service, cross-team, có human-in-the-loop thì bắt buộc orchestration.

### Trả lời mẫu khi phỏng vấn
"Choreography phù hợp flow dưới 3 service, tuyến tính, cùng team. Quá 3-4 service, có rẽ nhánh, chờ tín hiệu ngoài (OTP, duyệt tay), cross-team — tôi chuyển sang orchestration (Temporal/Camunda). Observability: engine hiển thị state từng workflow instance thay vì ghép trace. Compensation: orchestrator đăng ký bù sau mỗi bước, chạy LIFO khi fail, có retry/timeout riêng — choreography thì compensation rải rác, thứ tự khó kiểm soát. Versioning: workflow có version, instance cũ chạy logic cũ. Trade-off: thêm engine phải vận hành, workflow code phải deterministic. Tôi chỉ đưa flow chính vào engine, tác vụ phụ (email, metrics) vẫn nghe event."

> Senior tip: đừng sợ "thêm engine": chi phí vận hành Temporal/Camunda thường **nhỏ hơn chi phí debug choreography lúc 3 giờ sáng**. Chọn engine khi chi phí của sự rối rắm lớn hơn chi phí hạ tầng.`,
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
  a: `**Tóm tắt:** **startup probe** che chắn giai đoạn khởi động chậm (JVM warmup, Flyway migrate, nạp cache); **readiness probe** quyết định pod có nhận traffic hay không; **liveness probe** chỉ phát hiện app treo hẳn (deadlock) để restart, **không bao giờ** dùng liveness để chờ startup và không kiểm tra dependency trong liveness. Request/limit CPU/RAM phải dựa trên đo đạc thực tế, nhớ rằng bộ nhớ Java không chỉ là heap. Graceful shutdown = {{preStop}} sleep + {{server.shutdown=graceful}} + {{terminationGracePeriodSeconds}} đủ lớn.

### Hiểu nhanh
Hãy nghĩ tới một **nhân viên mới vào ca** ở quầy giao dịch. **Startup probe**: quản lý cho anh ta 5 phút để bật máy, đăng nhập, sắp xếp giấy tờ; trong lúc đó không ai đánh giá anh ta. **Readiness probe**: tấm biển "quầy mở/quầy đóng"; khi đang bận việc hoặc mất kết nối hệ thống thì lật biển "đóng" để khách sang quầy khác, nhưng không đuổi việc ai cả. **Liveness probe**: kiểm tra nhân viên có **ngất xỉu** không; ngất thật thì mới thay người. Nếu dùng liveness để kiểm tra lúc khởi động, bạn sẽ "thay người" ngay khi anh ta còn đang bật máy, mãi mãi không ai vào được ca. **Graceful shutdown**: hết ca thì lật biển "đóng", phục vụ nốt khách đang đứng ở quầy rồi mới về.

### Thuật ngữ
- **Probe**: kiểm tra định kỳ kubelet thực hiện với container (HTTP, TCP, exec, gRPC).
- **EndpointSlice**: danh sách IP pod đang ready phía sau một Service; pod không ready bị loại khỏi đây.
- **requests / limits**: lượng tài nguyên scheduler đặt chỗ cho pod / mức trần container được dùng.
- **OOMKilled**: container bị kernel giết vì vượt memory limit.
- **CPU throttling**: container bị kìm CPU khi dùng hết quota trong mỗi chu kỳ (CFS), gây spike latency.
- **QoS class**: Guaranteed / Burstable / BestEffort, quyết định thứ tự bị evict khi node thiếu tài nguyên.
- **preStop hook**: lệnh chạy ngay khi pod bắt đầu terminate, trước khi container nhận SIGTERM.
- **terminationGracePeriodSeconds**: tổng thời gian tối đa từ lúc bắt đầu terminate tới khi bị SIGKILL.

### Ba loại probe: mục đích khác nhau
| Probe | Mục đích | Khi fail | Khi nào dùng |
|---|---|---|---|
| **Startup** | app đang khởi động | quá ngưỡng thì **kill + restart** container | **luôn dùng** cho Java (warmup, migrate, nạp cache) |
| **Readiness** | sẵn sàng nhận request | **loại khỏi Service endpoints**, không restart | **luôn dùng** |
| **Liveness** | app treo/deadlock | **kill + restart** container | chỉ phát hiện lỗi chết hẳn, endpoint nhẹ |

1. **Startup probe** chạy trước; khi nó còn chưa thành công thì liveness/readiness **chưa được đánh giá**. Đặt {{failureThreshold * periodSeconds}} lớn hơn thời gian khởi động tối đa (ví dụ 30 × 10s = 300s cho app migrate DB). Vì sao: tránh bị kill khi đang khởi động.
2. **Readiness** dùng {{/actuator/health/readiness}}: Spring Boot tự bật probe group này khi chạy trên Kubernetes, báo REFUSING_TRAFFIC trong lúc khởi động và khi bắt đầu shutdown. Có thể thêm health của dependency **thiết yếu riêng của chính app** (ví dụ DB riêng), nhưng **không** kiểm tra service downstream khác, và cẩn thận với dependency dùng chung: DB chung chậm có thể làm **mọi** pod cùng not-ready, tức là tự tắt cả service.
3. **Liveness** dùng {{/actuator/health/liveness}}, chỉ phản ánh trạng thái nội bộ. **Không kiểm tra DB**: DB chết mà liveness fail thì toàn bộ pod restart liên tục, DB càng bị dồn kết nối khi pod lên lại.

~~~yaml
startupProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 10
  failureThreshold: 30          # tối đa 300s để khởi động
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  periodSeconds: 5
  failureThreshold: 3
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3           # 30s không phản hồi mới restart
~~~

### Resource request/limit: đặc thù Java
~~~yaml
resources:
  requests: { memory: "1536Mi", cpu: "500m" }
  limits:   { memory: "1536Mi", cpu: "2" }   # memory request = limit để tránh OOM bất ngờ
# JAVA_TOOL_OPTIONS: -XX:MaxRAMPercentage=70
~~~
1. **Memory**: tổng = heap + Metaspace + CodeCache + thread stack (khoảng 1MB/thread × 200 thread = 200MB) + direct buffer + GC overhead. Vì vậy heap chỉ nên khoảng 60–75% limit; dùng {{-XX:MaxRAMPercentage=70}} thay vì hard-code {{-Xmx}} (JVM hiện đại đọc được giới hạn cgroup của container).
2. **CPU**: request = mức nền để scheduler đặt chỗ; limit quá chặt làm GC và JIT bị throttle, latency nhảy vọt. Nhiều team đặt CPU request nhưng không đặt (hoặc đặt rộng) CPU limit.
3. **QoS**: mọi container có request = limit cho cả CPU và memory → Guaranteed (bị evict sau cùng); request < limit → Burstable; không đặt → BestEffort (bị evict đầu tiên).

~~~text
limit 1536Mi = heap 1075Mi (70%) + metaspace ~150Mi + codecache ~100Mi
             + threads ~200Mi + direct/GC ~ phần còn lại
-Xmx = limit  →  heap đầy + off-heap  →  vượt cgroup  →  OOMKilled
~~~

### Graceful shutdown: không làm rơi request (từng bước)
1. Pod chuyển sang Terminating. **Song song**: control plane gỡ pod khỏi EndpointSlice, kubelet chạy preStop. Vì sao cần preStop: kube-proxy/ingress mất vài giây mới cập nhật, trong lúc đó traffic **vẫn tới pod**.
2. **preStop sleep 10s**: app vẫn phục vụ bình thường trong lúc các load balancer cập nhật.
3. Sau preStop, container nhận **SIGTERM**. Spring Boot với {{server.shutdown=graceful}} (mặc định từ Boot 3.4) ngừng nhận request mới, chờ request đang chạy xong tối đa {{spring.lifecycle.timeout-per-shutdown-phase}} (mặc định 30s).
4. Hết {{terminationGracePeriodSeconds}} (tính từ lúc bắt đầu terminate, gồm cả preStop) mà chưa thoát thì **SIGKILL**.

~~~yaml
lifecycle:
  preStop:
    exec:
      command: ["sh", "-c", "sleep 10"]   # image distroless không có shell: dùng action sleep native của K8s bản mới
terminationGracePeriodSeconds: 45          # >= 10 (preStop) + 30 (shutdown phase) + dư
~~~

### Lỗi hay gặp
1. **Liveness kiểm tra DB**. Triệu chứng: DB chậm, toàn bộ pod restart dây chuyền. Cách tránh: liveness chỉ trạng thái nội bộ.
2. **Không có startup probe, liveness initialDelay ngắn**. Triệu chứng: app khởi động 90s nhưng bị kill ở giây 30, CrashLoopBackOff. Cách tránh: thêm startup probe đủ dài. (Readiness fail lúc khởi động thì không sao, pod chỉ chưa nhận traffic.)
3. **-Xmx bằng memory limit**. Triệu chứng: OOMKilled dù heap chưa đầy. Cách tránh: MaxRAMPercentage 60–75%.
4. **Không có preStop**. Triệu chứng: mỗi lần deploy có loạt lỗi 502/connection refused. Cách tránh: preStop sleep + graceful shutdown + grace period đủ lớn.

### Trả lời miệng 1 phút
"Tôi dùng ba probe với ba mục đích. Startup probe cho Java khởi động chậm, đặt failureThreshold nhân periodSeconds lớn hơn thời gian khởi động tối đa. Readiness trỏ vào actuator health readiness để quyết định có nhận traffic, không kiểm tra service downstream. Liveness chỉ phát hiện app treo, tuyệt đối không kiểm tra DB, vì DB chết sẽ làm toàn bộ pod restart dây chuyền. Về tài nguyên, tôi để heap khoảng 70% memory limit qua MaxRAMPercentage vì Java còn metaspace, thread stack, direct buffer, và tránh CPU limit quá chặt gây throttling GC. Shutdown thì preStop sleep để load balancer cập nhật, Spring graceful shutdown, và grace period lớn hơn tổng hai khoảng đó."

### Ví dụ đời thực
   Hệ thống ngân hàng 12 service Spring Boot 3 trên EKS, mỗi service 3 replica. Năm 2023, team deploy payment-service bản mới kèm 50 script Flyway. Spring Boot chạy Flyway trong lúc khởi tạo context, trước khi mở cổng HTTP, nên pod mới cần khoảng 90 giây mới trả lời được probe. Nhưng livenessProbe để initialDelaySeconds=30, periodSeconds=10, failureThreshold=3: tới khoảng giây 60 kubelet kill container, Flyway bị cắt giữa chừng, pod rơi vào CrashLoopBackOff. Tệ hơn, một script dùng {{CREATE INDEX CONCURRENTLY}} (không chạy trong transaction) bị cắt ngang, để lại index INVALID và một bản ghi lỗi trong {{flyway_schema_history}}; các lần khởi động sau Flyway từ chối chạy tiếp cho tới khi DBA dọn tay. Rolling update kẹt 40 phút, may là maxUnavailable=0 nên pod cũ vẫn phục vụ traffic. Điều tra: {{kubectl describe pod}} thấy "Liveness probe failed: connection refused" rồi "Killing container"; không có startupProbe. Nguyên gốc: liveness probe bắt đầu kiểm tra khi app vẫn đang khởi động hợp lệ. Xử lý: (1) thêm startupProbe trỏ /actuator/health/liveness, periodSeconds=10, failureThreshold=30 (cho tối đa 300 giây khởi động), liveness/readiness chỉ chạy sau khi startup probe pass, (2) migration nặng tách thành Job chạy trước khi deploy app, không chạy trong lúc app khởi động, (3) liveness chỉ phản ánh tiến trình còn sống, không check DB, (4) preStop sleep 15s + terminationGracePeriodSeconds=60. Kết quả: các lần deploy sau không còn CrashLoopBackOff, rolling update xong trong 6 phút. Đây là minh chứng: startup probe là bắt buộc với app Java khởi động chậm, migration nặng không nên để liveness probe có quyền cắt ngang, và liveness chỉ check tiến trình sống.

### Trả lời mẫu khi phỏng vấn
"Ba probe ba mục đích: startup che chắn khởi động chậm (JVM warmup, Flyway migrate, nạp cache) — đặt failureThreshold × periodSeconds > max startup time. Readiness quyết định nhận traffic — trỏ actuator/health/readiness, có thể thêm check DB riêng của app, KHÔNG check downstream. Liveness chỉ phát hiện deadlock — actuator/health/liveness, TUYỆT ĐỐI không check DB (DB chết làm cả cụm restart). Resource: heap 70% limit qua MaxRAMPercentage (Java còn metaspace, thread stack, direct buffer), CPU limit rộng tránh throttling GC. Graceful shutdown: preStop sleep 10-15s cho LB cập nhật, Spring server.shutdown=graceful, terminationGracePeriodSeconds > preStop + shutdown timeout. Trade-off: startup probe lâu làm deploy chậm, nhưng an toàn hơn CrashLoopBackOff."

> Senior tip: luôn load-test để biết dung lượng heap thực tế sau Full GC và bộ nhớ native (dùng Native Memory Tracking), rồi mới đặt request/limit. Đừng đoán: bộ nhớ Java không chỉ là heap.`,
  follow: [
    'Startup probe {{failureThreshold * periodSeconds}} tính ra sao cho app Flyway migrate 200 script?',
    'Readiness probe check downstream service có nguy hiểm như thế nào?',
    '{{terminationGracePeriodSeconds}} mặc định 30s, bạn tăng bao nhiêu cho app xử lý request lâu?'
  ],
  tags: ['Kubernetes', 'Spring Boot 3', 'probe', 'graceful shutdown', 'resource limit'],
  refs: [
    { type: 'doc', title: 'Kubernetes: Configure Liveness, Readiness and Startup Probes', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/' },
    { type: 'doc', title: 'Spring Boot: Graceful Shutdown', url: 'https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html' },
  ]
},
{
  id: 'microservices-025',
  topic: 'microservices',
  level: 'senior',
  q: 'Request từ client đi qua 5 service (A→B→C→D→E), mỗi service timeout 5s. Giải thích timeout budget, deadline propagation, và vì sao timeout phải giảm dần theo chiều sâu (hop càng sâu càng ngắn).',
  a: `**Tóm tắt:** **timeout budget** là tổng thời gian client chấp nhận chờ (ví dụ 5s); mọi hop phía sau phải nằm **trong** budget đó, không phải mỗi hop lại có riêng 5s. **Deadline propagation**: request mang theo "hạn chót" (deadline tuyệt đối hoặc thời gian còn lại) qua header; mỗi service trừ phần đã tiêu rồi truyền tiếp, hết hạn thì dừng ngay. Hop càng sâu timeout càng ngắn để: (1) chừa thời gian cho retry và xử lý ở tầng trên, (2) không giữ tài nguyên upstream vô ích, (3) fail fast trước khi client đã bỏ đi.

### Hiểu nhanh
Bạn đặt pizza và nói "30 phút không tới thì tôi hủy". Cửa hàng mất 10 phút làm bánh, còn 20 phút cho shipper. Nếu shipper nghĩ "mình có hẳn 30 phút" thì bánh tới nơi khi khách đã hủy, công cốc. Deadline propagation là **ghi giờ hết hạn lên hộp pizza**, ai cầm hộp cũng biết còn bao nhiêu thời gian; hết giờ thì thôi, không chạy nữa. Hop càng xa (shipper) càng có ít thời gian, vì phần lớn đã bị tiêu ở các bước trước.

### Thuật ngữ
- **Timeout budget**: tổng thời gian tối đa cho cả request từ góc nhìn client.
- **Deadline**: thời điểm tuyệt đối mà sau đó kết quả không còn giá trị.
- **Deadline propagation**: truyền deadline/thời gian còn lại xuống mọi hop phía sau.
- **Hop**: một lần gọi từ service này sang service khác.
- **Zombie request**: request mà client đã bỏ, nhưng downstream vẫn đang xử lý.
- **grpc-timeout**: header gRPC chuẩn mang thời gian còn lại; gRPC tự kiểm tra và propagate qua Context.
- **Safety margin**: phần thời gian chừa lại cho mạng, serialize, xử lý response.
- **Clock skew**: đồng hồ các máy lệch nhau, làm deadline tuyệt đối bị tính sai.

### Vấn đề: timeout cố định 5s cho mọi hop
1. Client timeout 5s; A→B→C→D→E mỗi hop 5s, nên worst case A chờ tới khoảng 5s × (số hop) nếu mỗi hop đều chậm sát ngưỡng. Vì sao vô lý: client đã bỏ đi từ giây thứ 5.
2. Thêm retry 3 lần ở B: riêng B có thể tốn 15s, trong khi client đã timeout từ lâu.
3. Không có deadline propagation: D không biết client đã bỏ, vẫn xử lý rồi trả kết quả cho... không ai. CPU, connection, DB đều bị tiêu cho zombie request.

~~~text
Không propagate:   client 5s ──► A(5s) ──► B(5s, retry×3) ──► C ──► D ──► E
                   t=5s client bỏ;  t=20s E vẫn đang query DB (zombie)
Có propagate:      client deadline=5s ─► A còn 4,8s ─► B còn 4,3s ─► C còn 3,5s
                   ─► D còn 2,6s ─► E còn 1,5s;  hết hạn ở đâu thì dừng ở đó
~~~

### Deadline propagation (từng bước)
1. **Edge gán deadline**: gateway đặt header thời gian còn lại, ví dụ {{x-request-timeout-ms: 4800}} (header tự đặt tên), hoặc gRPC tự dùng {{grpc-timeout}}.
2. **Mỗi service đọc header khi nhận request**, tính {{deadline = now + remaining}} theo đồng hồ của chính mình. Vì sao dùng thời gian còn lại thay vì timestamp tuyệt đối: tránh clock skew giữa các máy.
3. **Trước khi gọi downstream**, tính lại thời gian còn lại, trừ safety margin; hết thì trả 504 ngay.
4. **Dùng thời gian còn lại làm timeout** cho call downstream và gửi tiếp trong header.

~~~java
long remaining = deadline - System.currentTimeMillis() - 100;   // chừa 100ms margin
if (remaining <= 0) {
    return ResponseEntity.status(504).build();   // hết budget: fail fast, không gọi tiếp
}
// gắn header + timeout cho call downstream
headers.set("x-request-timeout-ms", String.valueOf(remaining));
~~~
- **Spring** không có sẵn deadline propagation cho HTTP: tự viết filter đọc header và lưu deadline vào request context (ThreadLocal/MDC, hoặc Reactor Context với WebFlux), rồi một {{ClientHttpRequestInterceptor}} (RestClient/RestTemplate) hoặc {{ExchangeFilterFunction}} (WebClient) gắn header và đặt timeout cho call đi ra.
- **gRPC**: deadline nằm trong {{Context}} và được propagate tự động khi gọi tiếp trong cùng context.
- **DB**: có thể đặt query timeout theo thời gian còn lại (JDBC {{Statement.setQueryTimeout}}, PostgreSQL {{statement_timeout}}).

Sơ đồ dưới đây: deadline propagation giảm timeout theo chiều sâu:

~~~seq
title: Deadline propagation: timeout giảm dần
actors: Client | Gateway | OrderSvc | Payment | External
Client -> Gateway: deadline 5s
Gateway -> OrderSvc: timeout 4,5s
OrderSvc -> Payment: timeout 3,5s
Payment -> External: timeout 1,5s
External --> Payment: ok
Payment --> OrderSvc: ok
OrderSvc --> Gateway: ok
Gateway --> Client: response
note External..Client: hết hạn ở đâu thì dừng ở đó
~~~

### Timeout giảm dần theo chiều sâu
| Hop | Service | Timeout ví dụ | Lý do |
|---|---|---|---|
| 1 (edge) | API Gateway / BFF | 4,5s | gần client nhất, chừa thời gian trả response |
| 2 | Orchestration / API composition | 3,5s | cần thời gian gộp, gọi song song |
| 3 | Core domain (Order, Payment) | 2,5s | logic chính, có DB local |
| 4 | Infrastructure (cache, queue) | 1,5s | đường nhanh, ít logic |
| 5 (leaf) | External / legacy | 1,0s | không kiểm soát được, fail fast |

- Bảng chỉ là ví dụ. **Nguyên tắc**: timeout hop i < timeout hop i-1 trừ thời gian xử lý tại chỗ và (số lần retry × timeout mỗi lần). Số liệu thật lấy từ p99 latency đo được của từng hop.
- **Retry budget**: chỉ dành khoảng 10–20% budget cho retry và chỉ retry ở **một** tầng; retry ở mọi tầng nhân cấp số (3 tầng × 3 lần = 27 call xuống leaf).

### Lỗi hay gặp
1. **Không propagate deadline**. Triệu chứng: zombie request, metric downstream "thành công" nhưng client thấy timeout. Cách tránh: header thời gian còn lại + kiểm tra trước mỗi call.
2. **Hop sâu timeout dài hơn hop nông**. Triệu chứng: một leaf chậm làm thread pool upstream cạn. Cách tránh: timeout giảm dần, dựa trên p99.
3. **Dùng timestamp tuyệt đối giữa các máy lệch giờ**. Triệu chứng: request bị coi là hết hạn ngay khi tới. Cách tránh: truyền thời gian còn lại, hoặc đồng bộ NTP chặt.
4. **Quên async**. Triệu chứng: message Kafka xử lý sau 10 phút cho một yêu cầu mà người dùng đã hủy. Cách tránh: gắn hạn xử lý (expires-at) vào message, consumer bỏ qua message đã quá hạn nếu nghiệp vụ cho phép.

### Trả lời miệng 1 phút
"Timeout budget là tổng thời gian client chấp nhận, ví dụ 5 giây, và mọi hop phải nằm trong đó chứ không phải mỗi hop có 5 giây riêng. Tôi dùng deadline propagation: gateway gắn thời gian còn lại vào header, mỗi service tính deadline theo đồng hồ của mình, trừ margin rồi dùng phần còn lại làm timeout cho call tiếp theo; hết hạn thì trả 504 ngay. gRPC có sẵn qua grpc-timeout, còn Spring HTTP tôi tự viết filter và interceptor. Hop càng sâu timeout càng ngắn để chừa chỗ cho retry và xử lý ở tầng trên, và chỉ retry ở một tầng. Lợi ích lớn nhất là không còn zombie request ăn tài nguyên khi client đã bỏ đi."

### Ví dụ đời thực
  Hệ thống đặt vé máy bay 5 service: Client → Gateway → Booking → Payment → Seat → Notification. Năm 2023, team đặt timeout cố định 5s cho mọi hop, không có deadline propagation. Giờ cao điểm, Payment Service tăng latency lên 4,8s do connection pool cạn. Triệu chứng: Gateway trả 504, khách thấy "đặt vé thất bại" dù Payment thật ra đã nhận và giữ chỗ. Điều tra: metric thấy Gateway timeout 5s, Booking timeout 5s (chờ Payment), Payment timeout 5s (chờ Seat Service) — tổng thời gian có thể tới 15s+ trong khi client đã bỏ từ giây thứ 5; trace Jaeger thấy request vẫn đang chạy ở Seat Service sau khi client đã nhận 504 (zombie request). Nguyên gốc: không có timeout budget và deadline propagation, mỗi hop tự do 5s. Xử lý: (1) gateway gán timeout budget 5s cho toàn request, (2) thêm header x-request-timeout-ms truyền thời gian còn lại, mỗi service trừ margin 100ms rồi dùng phần còn lại làm timeout cho call tiếp, (3) Booking timeout giảm từ 5s xuống 4s, Payment 3s, Seat 2s, Notification 1s, (4) retry chỉ ở Gateway với budget 10%. Kết quả: sau 2 tuần, zombie request giảm từ 12% xuống dưới 0,1%, p99 từ 5s xuống 1,2s, và khi Payment chậm, hệ thống fail fast thay vì giữ tài nguyên. Đây là minh chứng: timeout giảm dần theo chiều sâu và deadline propagation là hai yếu tố then chốt.

  > Senior tip: đo **mức tiêu budget** theo percentile (p50, p95, p99) tại mỗi hop. Nếu p99 của hop 3 đã ăn 80% budget, bạn phải tối ưu hop 3 hoặc giảm phần dành cho hop 1–2. Không có metric này thì bạn đang mò kim đáy bể.`,
  follow: [
    'Deadline propagation qua Kafka (async) xử lý thế nào?',
    'Khi nào nên dùng absolute deadline timestamp thay vì remaining time?',
    'Service leaf (external API) timeout ngắn mà fail nhiều - bạn handle retry ở đâu?'
  ],
  tags: ['timeout budget', 'deadline propagation', 'tapered timeout', 'distributed systems'],
  refs: [
    { type: 'article', title: 'Timeouts, retries, and backoff with jitter (Amazon Builders Library)', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' },
    { type: 'doc', title: 'gRPC Deadlines', url: 'https://grpc.io/docs/guides/deadlines/' },
  ]
},
{
  id: 'microservices-026',
  topic: 'microservices',
  level: 'senior',
  q: 'Một downstream chậm (payment) làm kẹt thread pool của upstream (order), các request khác (catalog, user) cũng bị chờ. Bạn áp dụng Bulkhead pattern: thread pool isolation vs semaphore isolation, cấu hình như thế nào?',
  a: `**Tóm tắt:** **Bulkhead** là chia tài nguyên (thread, permit) thành ngăn riêng cho từng dependency, để một downstream chậm chỉ làm cạn **ngăn của nó** chứ không kéo sập cả service. **Thread pool isolation**: mỗi dependency một pool thread riêng + hàng đợi, caller không bị block, hợp với code blocking; đổi lại tốn thread và context switch. **Semaphore isolation**: chỉ đếm số call đồng thời, không có hàng đợi thật, rất nhẹ, hợp với reactive/non-blocking và virtual threads. Kích thước tính bằng **Little's Law**: concurrency ≈ throughput × latency.

### Hiểu nhanh
Con tàu có **vách ngăn kín nước** (bulkhead): một khoang thủng thì nước chỉ tràn khoang đó, tàu vẫn nổi. Ở nhà hàng, nếu cả 20 phục vụ đều đứng chờ món nướng (bếp nướng đang chậm), thì khách gọi nước, gọi salad cũng không ai phục vụ. Bulkhead là quy định: **tối đa 5 người được đứng chờ ở bếp nướng**, người thứ 6 phải báo khách "món nướng đang chậm, anh chọn món khác nhé", và 15 người còn lại vẫn phục vụ việc khác.

### Thuật ngữ
- **Bulkhead**: giới hạn tài nguyên riêng cho từng dependency để cô lập lỗi.
- **Thread pool bulkhead**: call chạy trên pool thread riêng (core/max/queue), trả về CompletableFuture.
- **Semaphore bulkhead**: giới hạn số call đồng thời bằng permit; call chạy trên thread của caller.
- **BulkheadFullException**: exception Resilience4j ném ra khi hết chỗ.
- **Little's Law**: số request đang xử lý = tốc độ đến × thời gian xử lý.
- **Context switch**: CPU chuyển giữa các thread, tốn chi phí khi có quá nhiều thread.
- **Virtual threads (Java 21)**: thread nhẹ do JVM quản lý, chặn I/O không giữ thread hệ điều hành.

### Vì sao cần Bulkhead (từng bước sự cố)
1. Order service dùng chung pool Tomcat 200 thread để gọi Payment, Catalog, User.
2. Payment chậm (DB lock 30s): mỗi request gọi Payment giữ một thread suốt thời gian chờ.
3. Sau vài giây, cả 200 thread đều kẹt ở Payment; request Catalog, User xếp hàng rồi timeout. Vì sao: chúng không có thread để chạy, dù Catalog hoàn toàn khỏe.
4. Có bulkhead: Payment tối đa 25 call đồng thời; call thứ 26 bị từ chối ngay và chạy fallback; 175 thread còn lại phục vụ Catalog/User.

~~~text
Không bulkhead:  [200 thread] ──► Payment chậm: 200/200 kẹt → cả service chết
Có bulkhead:     Payment ≤ 25 │ Catalog ≤ 50 │ User ≤ 50 │ còn lại cho việc khác
                 Payment chậm: 25 kẹt, call thứ 26 → BulkheadFullException → fallback
~~~

Sơ đồ dưới đây: bulkhead cô lập từng dependency:

~~~seq
title: Bulkhead: Payment chậm không làm kẹt Catalog
actors: Client | OrderSvc | PaymentAPI | CatalogAPI
Client -> OrderSvc: request
OrderSvc -> PaymentAPI: charge
PaymentAPI --> OrderSvc: chậm
OrderSvc -> CatalogAPI: list
CatalogAPI --> OrderSvc: nhanh
OrderSvc -> OrderSvc: fallback cho Payment
OrderSvc --> Client: partial response
note OrderSvc..PaymentAPI: chỉ 25 call đồng thời
~~~

### Thread pool isolation (Resilience4j)
~~~yaml
resilience4j:
  thread-pool-bulkhead:              # key khác với semaphore bulkhead
    instances:
      paymentApi:
        coreThreadPoolSize: 10
        maxThreadPoolSize: 25
        queueCapacity: 50            # request chờ khi pool đầy
        keepAliveDuration: 60s
~~~
1. Đánh dấu {{@Bulkhead(name = "paymentApi", type = Bulkhead.Type.THREADPOOL)}}; method **phải trả về** {{CompletableFuture}}/{{CompletionStage}} vì call chạy async trên pool riêng.
2. Pool đầy và hàng đợi đầy thì ném {{BulkheadFullException}}.
3. Ưu: hàng đợi hấp thụ spike ngắn, thread của caller không bị block; kết hợp {{@TimeLimiter}} để cắt call quá lâu. Lưu ý không có cấu hình riêng cho thời gian chờ trong hàng đợi, nên hàng đợi đừng quá dài.
4. Nhược: thêm thread (mỗi thread nền tảng tốn khoảng 1MB stack), context switch, phải tune core/max/queue.

### Semaphore isolation (mặc định của Resilience4j)
~~~yaml
resilience4j:
  bulkhead:
    instances:
      paymentApi:
        maxConcurrentCalls: 25       # số permit
        maxWaitDuration: 0           # mặc định 0: hết permit là từ chối ngay
      catalogApi:
        maxConcurrentCalls: 50
~~~
1. {{@Bulkhead(name = "paymentApi")}} (type mặc định SEMAPHORE): thread của caller lấy permit, gọi, trả permit.
2. Ưu: gần như không tốn chi phí, hợp WebClient, R2DBC và **virtual threads** (Java 21), vì ở đó thread rẻ nhưng tài nguyên downstream vẫn hữu hạn.
3. Nhược: hết permit thì caller chờ tối đa {{maxWaitDuration}} rồi nhận {{BulkheadFullException}}; caller phải có fallback.

### Chọn loại nào
| Điều kiện | Chọn |
|---|---|
| Blocking I/O trên platform thread, muốn caller không bị kẹt | **Thread pool** |
| Non-blocking (WebClient, R2DBC) hoặc virtual threads | **Semaphore** |
| Cần hàng đợi đệm cho spike ngắn | **Thread pool** |
| Latency rất thấp, throughput cao | **Semaphore** |

### Sizing bằng Little's Law
~~~text
Concurrency = Throughput (req/s) × Latency (s)
Payment: 100 req/s × 0,8s (p99, thận trọng) = 80  → đặt 100 (dư ~25%)
Catalog: 500 req/s × 0,05s (p99)            = 25  → đặt 35
~~~
- Little's Law dùng latency **trung bình**; dùng p99 để có khoảng dư an toàn.
- Tổng các bulkhead nên nhỏ hơn số thread xử lý của server (Tomcat mặc định 200), để luôn còn thread cho các việc khác và cho health check.

### Lỗi hay gặp
1. **Một bulkhead chung cho mọi dependency**. Triệu chứng: Payment chậm vẫn làm Catalog bị từ chối. Cách tránh: mỗi dependency một instance.
2. **Bulkhead không có timeout**. Triệu chứng: 25 permit bị giữ mãi bởi call treo, Payment bị từ chối 100%. Cách tránh: HTTP client timeout / TimeLimiter + circuit breaker.
3. **Hàng đợi thread pool quá dài**. Triệu chứng: request chờ trong queue lâu hơn timeout của client, xử lý xong thì client đã bỏ. Cách tránh: queue ngắn, fail fast.
4. **Không có fallback cho BulkheadFullException**. Triệu chứng: user thấy lỗi 500 khó hiểu. Cách tránh: trả 503 + Retry-After hoặc dữ liệu degrade.

### Trả lời miệng 1 phút
"Bulkhead là cho mỗi dependency một ngăn tài nguyên riêng, để Payment chậm chỉ làm cạn ngăn của Payment chứ không ăn hết 200 thread của Tomcat. Với Resilience4j có hai loại: thread pool bulkhead chạy call trên pool riêng có hàng đợi, method trả CompletableFuture, hợp với code blocking; semaphore bulkhead chỉ giới hạn số call đồng thời, rất nhẹ, hợp với WebClient hay virtual threads. Tôi tính kích thước bằng Little's Law, throughput nhân latency p99 rồi cộng khoảng dư, và luôn kèm timeout, circuit breaker, fallback cho BulkheadFullException. Kinh nghiệm của tôi là theo dõi số permit còn trống theo từng dependency để tune lại định kỳ."

### Ví dụ đời thực
  Order Service gọi 3 downstream: Payment (chậm, p99 800ms), Catalog (nhanh, p99 50ms), User (nhanh, p99 60ms), dùng chung Tomcat 200 thread, không có bulkhead. Năm 2023, cao điểm trưa, Payment Service tăng latency lên 30s do DB lock (1 lock giữ 30s). Triệu chứng: 200 thread của Order Service đều kẹt ở Payment, request Catalog và User xếp hàng rồi timeout; người dùng thấy "502 Bad Gateway" dù Catalog và User vẫn khỏe. Điều tra: thread dump thấy 200 thread đều đang wait trên socket read; metric {{resilience4j.bulkhead.available.concurrent.calls}} không có (chưa cấu hình), {{tomcat.threads.active}} = 200/200. Nguyên gốc: không có bulkhead, một dependency chậm làm cạn toàn bộ thread pool. Xử lý: (1) thêm semaphore bulkhead: Payment 25, Catalog 50, User 50, (2) circuit breaker paymentApi failureRateThreshold 50% + waitDurationInOpenState 30s, (3) HTTP client timeout 1s cho Payment, (4) fallback trả partial: ẩn khối thanh toán, hiển thị "đang xử lý". Kết quả: sau 1 giờ, Catalog và User vẫn phục vụ 99,9% request; chỉ 25 request đồng thời tới Payment bị từ chối và chạy fallback. Đây là minh chứng: bulkhead cô lập dependency, và semaphore là lựa chọn nhẹ cho reactive client.

  > Senior tip: cấu hình bulkhead **không phải đặt một lần rồi quên**. Hãy có dashboard {{resilience4j.bulkhead.available.concurrent.calls}} so với {{resilience4j.bulkhead.max.allowed.concurrent.calls}} theo từng dependency. Nếu số permit trống thường dưới 10% thì tăng giới hạn hoặc tối ưu downstream; nếu lúc nào cũng gần đầy đủ thì bạn đang để dư quá nhiều.`,
  follow: [
    'Thread pool bulkhead với queueCapacity: request chờ quá lâu trong queue có timeout không?',
    'Semaphore bulkhead reject request khi full - bạn fallback ra sao cho graceful?',
    'Bulkhead kết hợp với Circuit Breaker: breaker mở thì bulkhead permits có bị giải phóng không?'
  ],
  tags: ['Bulkhead', 'thread pool isolation', 'semaphore isolation', 'Resilience4j', 'concurrency limit'],
  refs: [
    { type: 'doc', title: 'Resilience4j Bulkhead', url: 'https://resilience4j.readme.io/docs/bulkhead' },
    { type: 'doc', title: 'Bulkhead pattern (Azure)', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead' },
  ]
},
{
  id: 'microservices-027',
  topic: 'microservices',
  level: 'lead',
  refs: [
    { type: 'article', title: 'Bounded Context (Martin Fowler)', url: 'https://martinfowler.com/bliki/BoundedContext.html' },
    { type: 'doc', title: 'Pattern: Decompose by subdomain', url: 'https://microservices.io/patterns/decomposition/decompose-by-subdomain.html' },
  ],
  q: 'Hệ thống 15 service, team phàn nàn "mọi thay đổi phải deploy 5 service cùng lúc", latency cao do gọi lặp qua HTTP. Dấu hiệu chia sai bounded context (chatty, distributed monolith) là gì, và bạn gộp/tách lại như thế nào?',
  a: `**Tóm tắt:** **chatty services** là cần rất nhiều call mạng cho một nghiệp vụ đơn giản; **distributed monolith** là các service tách rời về mặt deploy nhưng vẫn dính chặt về logic (share DB, chuỗi sync call, phải deploy cùng nhau). Dấu hiệu: một use case fan-out quá 3 service, DB dùng chung, phụ thuộc vòng, các team phải đồng bộ lịch release. Cách sửa: **gộp** những service luôn thay đổi cùng nhau, **tách** những service chứa nhiều bounded context, và dùng API composition/CQRS cho query xuyên service thay vì gọi lặp.

### Hiểu nhanh
Một công ty chia thành 15 phòng ban, nhưng để duyệt một đơn mua bút phải xin chữ ký của 5 phòng, phòng nào cũng phải họp cùng ngày. Đó không phải "phân quyền", đó là **một phòng to bị cắt nhỏ một cách vụng về**. Cách sửa: những phòng luôn làm cùng một việc thì nhập lại thành một; phòng nào ôm hai việc chẳng liên quan thì tách ra; và ai cần báo cáo tổng hợp thì có **bảng tổng hợp chung** thay vì đi hỏi từng phòng mỗi lần.

### Thuật ngữ
- **Bounded context**: vùng nghiệp vụ có mô hình và ngôn ngữ riêng; nên là ranh giới của service.
- **Chatty service**: service phải gọi qua lại rất nhiều lần để làm xong một việc.
- **Distributed monolith**: hệ thống nhiều service nhưng coupling như monolith, mất cả lợi ích của hai bên.
- **Fan-out**: một request kéo theo nhiều call song song/tuần tự tới service khác.
- **Cyclic dependency**: A gọi B, B gọi C, C lại gọi A.
- **Business capability**: một năng lực nghiệp vụ trọn vẹn (Ordering, Billing), khác với "một bảng dữ liệu".
- **Nanoservice**: service quá nhỏ (một hàm, một động từ), chi phí vận hành vượt giá trị.
- **Change coupling**: các service luôn bị sửa trong cùng một commit/PR, đo được từ lịch sử git.

### Dấu hiệu chia sai
| Smell | Triệu chứng | Nguyên nhân |
|---|---|---|
| **Chatty** | 1 request → 10+ call nội bộ, p99 trên 2s | boundary quá mỏng, thiếu API tổng hợp |
| **Distributed monolith** | phải deploy 5 service cùng lúc, rollback 1 kéo theo 4 | share DB, chuỗi sync call, phụ thuộc vòng |
| **Data coupling** | 3 service cùng đọc/ghi bảng {{customer}} | chưa xác định chủ sở hữu dữ liệu |
| **Temporal coupling** | A phải chờ B xong mới chạy | sync call thay vì event |
| **Team friction** | team X chặn release team Y vì chung code/model | không có bounded context rõ |

~~~text
Ví dụ "xem chi tiết đơn" (chatty):
client → Order → OrderItem → Product → Price → Discount → Customer
latency = 6 hop × ~80ms ≈ 480ms (tuần tự); 1 hop lỗi = cả request lỗi
Sau khi gộp Order + OrderItem + Discount thành Ordering:
client → Ordering → (Product, Customer song song) ≈ 160ms
~~~

### Chẩn đoán (từng bước)
1. **Vẽ dependency graph từ tracing**: node = service, cạnh = call (sync/async), độ dày = số call/request. Vì sao từ trace: tài liệu thường đã cũ, trace là sự thật đang chạy.
2. **Tìm vòng (cycle)**: A→B→C→A gần như chắc chắn là distributed monolith.
3. **Tìm fan-out cao**: một service gọi nhiều nơi cho mỗi request là ứng viên gộp hoặc cần BFF/API composition.
4. **Tìm DB dùng chung**: cạnh "ẩn", phát hiện qua DB user, connection metric, audit log.
5. **Đo change coupling từ git**: hai service luôn bị sửa trong cùng PR là dấu hiệu chúng thuộc một context.

### Chiến lược gộp/tách
1. **Gộp (merge) khi**: hai service luôn deploy cùng nhau, share DB, gọi sync qua lại liên tục; coupling là **nghiệp vụ** (cùng một bounded context). Ví dụ {{Order}} + {{OrderItem}} + {{OrderHistory}} → một service Ordering. Gộp bằng cách chuyển code vào một repo/artifact, giữ module tách bạch bên trong (modular), gộp schema dần.
2. **Tách (split) khi**: service chứa 2+ bounded context (ví dụ {{UserService}} vừa lo xác thực vừa lo hồ sơ), profile scale khác nhau (payment cần độ sẵn sàng cao, catalog có thể chấp nhận gián đoạn), team sở hữu khác nhau.
3. **Đổi sync sang async** cho các bước không cần kết quả ngay (gửi mail, cập nhật thống kê), để bớt temporal coupling.
4. **Làm từng bước nhỏ**, mỗi bước có metric trước/sau (latency, số service phải deploy cho mỗi tính năng).

### Query xuyên service: không join DB
- **API composition (BFF/gateway)**: gộp response ở edge, gọi song song; hợp khi đọc ít, latency chấp nhận được.
- **CQRS read model**: dựng bảng/Elasticsearch từ event; query rất nhanh, hợp khi đọc nhiều, nhưng phức tạp hơn.
- **Data lake/OLAP**: cho báo cáo, analytics; không dùng trên đường xử lý giao dịch.

### Lỗi hay gặp
1. **Tách theo entity/CRUD** (UserService, ProductService chỉ bọc bảng). Triệu chứng: mọi nghiệp vụ đều gọi chéo, chatty. Cách tránh: tách theo business capability.
2. **Tách quá nhỏ (nanoservice)**. Triệu chứng: mỗi động từ một service, 15 service cho một nghiệp vụ. Cách tránh: một service sở hữu trọn một quy trình và dữ liệu của nó.
3. **Ngại gộp vì "đi ngược microservices"**. Triệu chứng: giữ nguyên kiến trúc đau đớn. Cách tránh: coi gộp là bình thường; mục tiêu là deploy độc lập, không phải số lượng service.
4. **Sửa bằng cache khắp nơi**. Triệu chứng: latency giảm nhưng dữ liệu cũ, bug khó hiểu. Cách tránh: sửa boundary trước, cache sau.

### Ví dụ đời thực
Hệ thống thương mại điện tử có 15 service, tách theo bảng dữ liệu: Order, OrderItem, OrderDiscount, Pricing, Product, Customer, Payment, Inventory, Shipping, Notification, v.v. Mỗi lần release tính năng "mã giảm giá theo hạng khách" đều phải deploy cùng lúc Order, OrderDiscount, Pricing, Customer (4 service) và đôi khi thêm Notification; trung bình 3 ngày/release vì phải phối hợp 4 team, và rollback một lần kéo theo 3 service khác. Đồng thời, trang "chi tiết đơn" gọi tuần tự 6 service nội bộ (Order → OrderItem → Product → Price → Discount → Customer), p99 dao động 1,8–2,4 giây; 1 hop lỗi làm cả trang lỗi.

Điều tra: (1) dùng Jaeger dựng dependency graph thấy chuỗi fan-out 6 hop cho use case xem đơn, và vòng phụ thuộc OrderDiscount ↔ Pricing; (2) audit connection DB phát hiện Order, OrderItem, OrderDiscount cùng dùng schema {{order_db}} (DB chung, coupling ẩn); (3) phân tích 60 PR gần nhất thấy Order + OrderItem + OrderDiscount thay đổi cùng nhau trong 48/60 PR (change coupling 80%). Nguyên nhân gốc: chia theo entity/CRUD tạo nanoservice chatty và shared DB biến 3 service thành distributed monolith.

Xử lý từng bước: (1) gộp Order + OrderItem + OrderDiscount + OrderHistory thành một service {{Ordering}}, giữ module Java tách bạch bên trong ({{order.core}}, {{order.discount}}), migrate schema dần trong 2 sprint; (2) Pricing giữ riêng nhưng chuyển sang đọc giá qua event/cache thay vì gọi sync mỗi request; (3) màn hình chi tiết đơn dùng API composition gọi song song {{Ordering}}, {{Product}}, {{Customer}} (3 call) với timeout riêng và partial response; (4) dùng CQRS read model (bảng {{order_detail_view}} cập nhật từ event) cho dashboard tải cao.

Kết quả sau 6 tuần: số service phải deploy cho tính năng giảm giá giảm từ 4 xuống 1; thời gian release tính năng đó giảm từ ~3 ngày xuống ~4 giờ; p99 trang chi tiết đơn giảm từ 2,1 giây xuống 180 ms (API composition) và 22 ms (đọc từ read model ở dashboard). Không có shared DB mới giữa các service còn lại.

### Trả lời miệng 1 phút
"Khi mọi thay đổi phải deploy 5 service, đó là distributed monolith: tách về deploy nhưng dính về logic. Tôi chẩn đoán bằng dependency graph từ tracing, tìm vòng phụ thuộc, fan-out cao, DB dùng chung, và đo change coupling từ git: service nào luôn sửa cùng PR thì thuộc cùng một bounded context. Những service đó tôi gộp lại thành một service modular, ví dụ Order, OrderItem, OrderHistory thành Ordering; service nào ôm hai context thì tách ra. Query xuyên service tôi dùng API composition gọi song song hoặc CQRS read model, không join DB. Trade-off là công migrate, nên tôi làm từng bước và đo latency, số service phải deploy cho mỗi tính năng."

> Senior tip: đừng tách service theo **entity/CRUD** (UserService, ProductService chỉ bọc bảng); hãy tách theo **business capability / subdomain** (Ordering, Fulfillment, Billing), mỗi service sở hữu trọn một quy trình và dữ liệu của nó. Entity service dẫn tới chatty; còn tách tới mức mỗi use case một service thì thành nanoservice.`,
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
  a: `**Tóm tắt:** **API composition** (BFF/gateway) gộp response lúc runtime: đơn giản, dữ liệu mới nhất của từng service, latency ≈ call chậm nhất nếu gọi song song (≈ tổng nếu gọi tuần tự). **CQRS read model** dựng sẵn một bảng/view phẳng từ event: query rất nhanh, nhưng tốn công xây projection và có độ trễ (eventual consistency). **Data lake/OLAP** cho phân tích, báo cáo, không dùng trên đường giao dịch. Chọn theo tỉ lệ đọc/ghi, SLA latency, mức chấp nhận dữ liệu cũ và năng lực team.

### Hiểu nhanh
Bạn cần một bản báo cáo gồm thông tin từ 4 phòng ban. **API composition** là **gọi điện cho 4 phòng mỗi lần sếp hỏi**: số liệu mới nhất, nhưng phòng nào bận thì phải chờ, phòng nào nghỉ thì báo cáo thiếu. **CQRS read model** là **thư ký giữ sẵn một bảng tổng hợp**, mỗi khi phòng nào có thay đổi thì báo cho thư ký cập nhật: sếp hỏi là có ngay, nhưng có thể chậm vài giây so với thực tế. **Data lake** là **kho lưu trữ hồ sơ** cuối ngày: tuyệt vời để phân tích xu hướng cả năm, nhưng không dùng để trả lời "đơn này vừa thanh toán chưa".

### Thuật ngữ
- **API composition**: một thành phần gọi nhiều service rồi ghép kết quả.
- **BFF**: backend cho một frontend cụ thể, thường là nơi làm API composition.
- **Read model / materialized view**: bảng dữ liệu phẳng dựng sẵn cho việc đọc.
- **Projection**: consumer nghe event và cập nhật read model.
- **Projection lag**: độ trễ từ lúc event xảy ra tới lúc read model được cập nhật.
- **Partial response**: trả dữ liệu thiếu một phần (kèm đánh dấu) khi một nguồn lỗi.
- **Data lake / OLAP**: kho dữ liệu lớn cho phân tích (ví dụ Iceberg/Delta Lake + Trino), tối ưu cho query quét nhiều dòng.
- **Schema-on-read**: dữ liệu lưu thô, cấu trúc được áp khi đọc.

### So sánh ba cách
| Tiêu chí | API Composition | CQRS Read Model | Data Lake / OLAP |
|---|---|---|---|
| **Latency** | 50–500ms (theo call chậm nhất) | rất nhanh (5–20ms, một dòng) | phút–giờ (batch) hoặc giây (streaming) |
| **Consistency** | gần real-time, nhưng không phải ảnh chụp nhất quán giữa các service | eventual (theo projection lag) | eventual (theo chu kỳ nạp) |
| **Công xây dựng** | thấp | cao (projection, replay, schema) | trung bình (pipeline, mô hình hóa) |
| **Công vận hành** | thấp | cao (theo dõi lag, rebuild) | trung bình |
| **Phù hợp** | dashboard nội bộ, đọc không quá nhiều | dashboard khách hàng, đọc gấp hàng chục lần ghi | báo cáo, BI, huấn luyện ML |
| **Đổi schema** | dễ (sửa aggregator) | khó (migrate view, replay) | dễ (schema-on-read) |

### API composition (từng bước)
1. **Gọi song song** các service độc lập, mỗi call có timeout riêng. Vì sao: latency ≈ call chậm nhất thay vì tổng.
2. **Xử lý lỗi từng phần**: một nguồn lỗi thì trả partial response (ví dụ ẩn khối tồn kho, hiển thị "tạm không có dữ liệu") thay vì lỗi cả trang.
3. **Cache ngắn** (10–60s) cho phần ít thay đổi như thông tin khách hàng.

~~~java
@GetMapping("/dashboard/orders/{id}")
public OrderDashboardDto dashboard(@PathVariable String id) {
    Order order = orderClient.get(id);                                   // cần trước để biết customerId
    var customer  = CompletableFuture.supplyAsync(() -> customerClient.get(order.customerId()), pool);
    var payment   = CompletableFuture.supplyAsync(() -> paymentClient.byOrder(id), pool);
    var inventory = CompletableFuture.supplyAsync(() -> inventoryClient.reserved(id), pool)
        .completeOnTimeout(Inventory.unknown(), 300, TimeUnit.MILLISECONDS);  // lỗi/chậm → partial
    return new OrderDashboardDto(order, customer.join(), payment.join(), inventory.join());
}
~~~
~~~text
Tuần tự: 50 + 30 + 40 + 30 = 150ms     Song song: 50 + max(30, 40, 30) = 90ms
~~~

### CQRS read model (từng bước)
1. Mỗi service phát event qua outbox: {{OrderPlaced}}, {{PaymentCaptured}}, {{StockReserved}}, {{CustomerUpdated}}.
2. Projection service nghe các topic, cập nhật bảng {{order_dashboard_view}} (upsert theo order_id, bỏ qua event cũ hơn version hiện tại). Vì sao kiểm version: event từ các topic khác nhau có thể đến lệch thứ tự.
3. Query: {{SELECT * FROM order_dashboard_view WHERE order_id = ?}}: một dòng, không join.
4. **Theo dõi projection lag** (event time → lúc view cập nhật), alert nếu vượt ngưỡng (ví dụ 5s).
5. **Có công cụ rebuild**: replay từ đầu topic hoặc từ checkpoint khi đổi schema view hay phát hiện lệch.

### Khi nào chọn cái nào
- Đọc không quá nhiều (dưới khoảng 10 lần ghi), latency cho phép trên 200ms, team nhỏ → **API composition**.
- Đọc rất nhiều (hàng chục lần ghi), latency dưới 50ms, team sẵn sàng đầu tư projection → **CQRS read model**.
- Phân tích lịch sử, query tùy ý, không cần real-time → **Data lake** (Iceberg/Delta Lake + Trino/StarRocks).
- **Kết hợp**: API composition cho màn hình chi tiết, CQRS cho dashboard tải cao, data lake cho BI.

### Lỗi hay gặp
1. **Gọi tuần tự trong composition**. Triệu chứng: latency bằng tổng các call. Cách tránh: gọi song song mọi call độc lập.
2. **Một service lỗi làm hỏng cả dashboard**. Triệu chứng: trang trắng khi chỉ inventory bị chậm. Cách tránh: timeout + partial response.
3. **Projection không idempotent, không kiểm version**. Triệu chứng: view hiển thị trạng thái cũ ghi đè trạng thái mới. Cách tránh: upsert theo version/thời điểm event.
4. **Dùng data lake cho màn hình real-time**. Triệu chứng: số liệu trễ hàng giờ, khách khiếu nại. Cách tránh: data lake chỉ cho báo cáo.

### Ví dụ đời thực
Dashboard vận hành của hệ thống giao hàng hiển thị: thông tin đơn (Order Service), khách hàng (Customer Service), thanh toán (Payment Service), tồn kho/slot giao (Inventory Service). Ban đầu team làm API composition tại BFF: mỗi request dashboard gọi tuần tự 4 service. Trong đợt Flash Sale, traffic dashboard tăng lên 2.500 req/s (gấp ~25 lần ngày thường). Triệu chứng: p99 dashboard lên 1,4 giây, CPU của Order Service và Payment Service tăng cao vì bị đọc liên tục; khi Inventory chậm 2–3 giây, cả trang dashboard timeout và CSKH không xem được đơn.

Điều tra: (1) metric BFF cho thấy latency = tổng 4 call (trung bình 120 + 80 + 90 + 250 = 540 ms) và có lúc Inventory p99 > 2 giây; (2) tỉ lệ đọc/ghi trên dashboard ~40:1 (đọc rất nhiều, dữ liệu thay đổi ít so với số lần xem); (3) log BFF cho thấy 8% request fail toàn trang chỉ vì một nguồn (thường là Inventory) timeout.

Xử lý theo hai giai đoạn: **Giai đoạn 1 (1 tuần, API composition cải tiến)** — gọi 4 service song song bằng {{CompletableFuture}}, mỗi call timeout riêng (Order/Customer/Payment 300 ms, Inventory 250 ms), Inventory lỗi thì trả partial response (ẩn khối tồn kho, hiển thị "tạm không có dữ liệu") thay vì fail cả trang; cache Customer 30 giây. Kết quả ngay: p99 giảm từ 1,4 giây xuống ~380 ms, tỉ lệ fail toàn trang giảm từ 8% xuống 0,4%.

**Giai đoạn 2 (4 tuần, CQRS read model cho dashboard)** — dựng projection service lắng nghe event {{OrderPlaced}}, {{PaymentCaptured}}, {{StockReserved}}, {{CustomerUpdated}} từ Kafka (qua outbox) và upsert bảng {{order_dashboard_view}} theo {{order_id}} (có kiểm tra version để bỏ event cũ). Dashboard đọc 1 dòng từ view; theo dõi {{projection_lag_ms}} và alert nếu > 5 giây. Kết quả: p99 đọc dashboard còn 12–18 ms ở 2.500 req/s, tải đọc rời khỏi 4 service nguồn; projection lag p99 ~1,2 giây (chấp nhận được cho màn hình vận hành). Báo cáo doanh thu tháng vẫn dùng data lake (Iceberg + Trino), chạy batch đêm, không đưa vào đường real-time.

### Trả lời miệng 1 phút
"Tôi có ba lựa chọn. API composition gọi song song bốn service rồi ghép kết quả: dễ làm, dữ liệu mới, latency bằng call chậm nhất, và phải có timeout cùng partial response khi một nguồn lỗi. CQRS read model dựng sẵn bảng phẳng từ event của bốn service: query một dòng rất nhanh, nhưng tốn công xây projection, phải xử lý event lệch thứ tự và theo dõi lag. Data lake chỉ dành cho báo cáo và phân tích. Tôi bắt đầu bằng API composition kèm cache, chỉ chuyển sang read model khi metric cho thấy latency hoặc tải đọc vượt SLA. Kinh nghiệm của tôi là CQRS làm quá sớm là một khoản nợ kỹ thuật đắt."

> Senior tip: đừng dựng CQRS view cho mọi thứ; bắt đầu bằng API composition + cache. Chỉ thêm projection khi metric chứng minh nó cần (p99 đọc vượt SLA, tải đọc làm cạn CPU của service nguồn). CQRS làm quá tay là một trong những nợ kỹ thuật đắt nhất của microservices.`,
  follow: [
    'API Composition: partial failure (một service down) xử lý fallback ra sao?',
    'CQRS projection lag monitor bằng metric gì, alert threshold thế nào?',
    'Data Lake cho dashboard real-time: feasible không, tại sao?'
  ],
  tags: ['API Composition', 'CQRS', 'read model', 'data lake', 'query federation'],
  refs: [
    { type: 'doc', title: 'Pattern: API Composition', url: 'https://microservices.io/patterns/data/api-composition.html' },
    { type: 'doc', title: 'Pattern: CQRS', url: 'https://microservices.io/patterns/data/cqrs.html' },
  ]
},
{
  id: 'microservices-029', topic: 'microservices', level: 'senior',
  q: 'Một topic có 12 partition nhưng team kỳ vọng mọi event của cùng một đơn hàng giữ đúng thứ tự. Bạn chọn key và số partition thế nào, và giới hạn thứ tự của Kafka là gì?',
  a: `**Tóm tắt:** Kafka chỉ đảm bảo thứ tự **trong một partition**. Dùng {{orderId}} làm key để mọi event của cùng một đơn hàng vào cùng partition, và consumer phải xử lý tuần tự theo partition (hoặc theo key). Số partition chọn theo nhu cầu song song và để dư từ đầu, vì **tăng partition sẽ đổi mapping key → partition** và phá thứ tự của các key đang có event dở dang.

### Hiểu nhanh
Một bưu cục có 12 quầy (partition). Quy tắc: mọi bưu phẩm của cùng một khách (key) luôn xếp vào **cùng một quầy**, nên thư gửi trước được xử lý trước. Giữa các quầy khác nhau thì không ai đảm bảo quầy nào xong trước. Nếu bưu cục mở thêm quầy thứ 13, công thức chia quầy thay đổi: bưu phẩm mới của khách A có thể sang quầy khác, trong khi bưu phẩm cũ của A vẫn còn xếp hàng ở quầy cũ, và thế là thứ tự bị đảo.

### Thuật ngữ
- **Partition key**: giá trị producer gắn vào record để quyết định partition.
- **Partitioner**: thành phần ở producer tính partition từ key (mặc định băm murmur2 rồi chia lấy dư cho số partition).
- **Total order**: thứ tự toàn cục cho mọi message; Kafka không có giữa các partition.
- **Hot partition / hot key**: một partition (hoặc key) nhận phần lớn traffic, thành nút thắt.
- **Aggregate**: đơn vị nghiệp vụ cần nhất quán (một đơn hàng, một tài khoản).
- **Idempotent producer**: producer gắn sequence number để broker loại trùng và giữ thứ tự khi retry.
- **Consumer lag theo partition**: độ trễ đọc của từng partition, giúp phát hiện hot partition.

### Từ key đến thứ tự (từng bước)
1. **Producer băm key**: {{partition = toPositive(murmur2(keyBytes)) % numPartitions}}. Vì sao: cùng key luôn ra cùng partition, miễn là số partition không đổi.
2. **Broker append** record vào cuối log của partition đó, gán offset tăng dần.
3. **Consumer đọc theo offset tăng dần**; trong một group, mỗi partition chỉ thuộc một consumer, nên event của order-42 được thấy theo đúng thứ tự ghi.
4. **Producer giữ thứ tự khi retry**: idempotence bật (mặc định từ Kafka 3.0) với {{acks=all}} và {{max.in.flight.requests.per.connection}} không quá 5. Vì sao: không có idempotence, batch 1 lỗi rồi retry có thể đến sau batch 2.

~~~text
12 partition, key = orderId
order-42: Created → Paid → Shipped   (đều ở partition 7, offset 100, 101, 102)
order-99: Created → Paid             (partition 2)
P7 và P2 xử lý song song, KHÔNG có thứ tự giữa hai partition
~~~
Record không có key thì được rải theo sticky partitioner: tải đều nhưng event của cùng aggregate có thể nằm ở nhiều partition và bị xử lý song song, đảo thứ tự.

### Chọn key và số partition
1. **Key = đơn vị cần tuần tự hóa**: {{orderId}} cho vòng đời đơn hàng, {{accountId}} cho số dư tài khoản. Tránh key là thời gian hoặc hằng số vì gây hot partition.
2. **Partition = đơn vị song song tối đa** của một consumer group. 12 partition cho tối đa 12 consumer làm việc thật; nhưng nếu phần lớn traffic rơi vào một key thì vẫn chỉ một consumer gánh.
3. **Ước lượng**: partition ≥ throughput mục tiêu / throughput một consumer, cộng dư cho tăng trưởng 1–2 năm (ví dụ cần 6 thì tạo 12–24).
4. **Thay đổi số partition có kế hoạch**: tạo topic mới với số partition mới, chuyển producer sang, để consumer đọc hết topic cũ rồi mới đọc topic mới; hoặc tạm dừng producer cho tới khi lag về 0 rồi mới tăng partition. Đừng giả định tăng partition là "trong suốt".

### Giữ thứ tự ở phía consumer
- Xử lý **tuần tự trong một partition**; nếu muốn song song bên trong, phải song song **theo key** (cùng key một hàng đợi), và chỉ commit offset khi mọi record trước đó đã xong.
- Retry kiểu non-blocking (đẩy sang topic retry) **phá thứ tự**: event sau của cùng key sẽ chạy trước. Event cần thứ tự thì dùng blocking retry hoặc consumer kiểm tra version (bỏ qua event cũ hơn trạng thái hiện tại).

### Lỗi hay gặp
1. **Xử lý bất đồng bộ rồi commit offset cao hơn record chưa xong**. Triệu chứng: broker giao đúng thứ tự nhưng hiệu ứng nghiệp vụ bị đảo, hoặc mất record khi crash. Cách tránh: theo dõi hoàn thành theo offset, chỉ commit offset liên tục đã xong.
2. **Nhiều producer cùng gửi event cho một key mà không phối hợp**. Triệu chứng: thứ tự trong log khác thứ tự nghiệp vụ. Cách tránh: một nguồn phát event cho mỗi aggregate (outbox của service sở hữu).
3. **Tăng partition khi đang chạy**. Triệu chứng: lỗi thứ tự lẻ tẻ, khó tái hiện. Cách tránh: dư partition từ đầu, migrate có kế hoạch.
4. **Hot key** (một merchant chiếm 30% traffic). Triệu chứng: lag một partition tăng mãi, các partition khác rảnh. Cách tránh: tối ưu xử lý của key đó, hoặc chia nhỏ key nếu nghiệp vụ chỉ cần thứ tự theo đơn vị nhỏ hơn (ví dụ merchantId + orderId).

### Ví dụ đời thực
Nền tảng thanh toán phát sự kiện vòng đời đơn ({{OrderCreated}}, {{PaymentCaptured}}, {{Shipped}}, {{Refunded}}) vào topic {{order-events}} có 12 partition. Ban đầu producer không set key (để Kafka rải đều theo sticky partitioner) nhằm "tối ưu throughput". Sau 2 tháng, team fraud phát hiện ~0,3% đơn bị xử lý sai: có trường hợp consumer thấy {{Refunded}} trước {{PaymentCaptured}} cho cùng một {{orderId}}, dẫn tới hệ thống hoàn tiền cho đơn chưa ghi nhận thanh toán (phải rà soát thủ công 1.200 đơn/tháng).

Điều tra: (1) trace theo {{orderId}} cho thấy các event của cùng đơn nằm rải rác ở partition 1, 4, 7, 9; consumer group 6 instance xử lý song song nên offset giữa các partition tiến không đồng đều; (2) log consumer cho thấy một instance lag partition 4 (đang retry call xuống DB) trong khi partition 9 (chứa {{Refunded}} của cùng đơn) bị instance khác xử lý xong trước. Nguyên nhân gốc: không có partition key → Kafka không đảm bảo thứ tự giữa các event của cùng aggregate.

Xử lý: (1) producer đổi sang set key = {{orderId}} ({{new ProducerRecord<>(topic, orderId, event)}}), bật idempotent producer ({{enable.idempotence=true}}, {{acks=all}}, mặc định Kafka 3.x); (2) consumer xử lý tuần tự trong partition và commit offset liên tục đã xong; với retry dùng blocking retry cho event cần thứ tự (hoặc kiểm tra version trạng thái và bỏ qua event cũ hơn); (3) giữ nguyên 12 partition (đã đủ dư cho throughput ~8.000 msg/s, mỗi consumer xử lý ~700 msg/s ở p95), ghi rõ quy trình: nếu cần tăng partition phải tạo topic mới và migrate có kế hoạch, không tăng trực tiếp.

Kết quả sau 3 tuần: lỗi đảo thứ tự sự kiện theo {{orderId}} về 0 (không còn case {{Refunded}} trước {{PaymentCaptured}} trong audit); lag theo partition cân bằng hơn (chênh lệch p95 giữa partition cao nhất/thấp nhất giảm từ 6,2 giây xuống 1,1 giây). Nhược điểm chấp nhận: một {{orderId}} "hot" (merchant test gửi hàng nghìn event/phút) tạo hot partition cục bộ, team xử lý bằng cách chặn traffic test và theo dõi metric lag theo từng partition.

### Trả lời miệng 1 phút
"Kafka chỉ có thứ tự trong một partition, nên tôi dùng orderId làm key: partitioner băm key nên mọi event của một đơn vào cùng partition và consumer đọc theo offset tăng dần. Producer bật idempotence với acks all để retry không đảo thứ tự. Phía consumer tôi xử lý tuần tự theo partition hoặc song song theo key, và chỉ commit offset đã xong liên tục. Số partition tôi chọn theo throughput và để dư cho tăng trưởng, vì tăng partition sẽ đổi mapping key và phá thứ tự; nếu buộc phải đổi thì làm topic mới và chuyển có kế hoạch. Tôi cũng theo dõi lag theo partition để phát hiện hot key."

> Senior tip: đo phân bố record theo partition trước khi tăng partition. Với payment, theo dõi key nóng và lag theo từng partition; tăng tổng số partition không chữa được một merchant chiếm phần lớn tải.`,
  follow: ['Nếu một key chiếm 30% traffic, bạn giữ thứ tự mà giảm hot partition thế nào?', 'Tăng partition giữa lúc chạy ảnh hưởng consumer và thứ tự ra sao?'],
  tags: ['Kafka', 'partition', 'key', 'ordering'],
  refs: [{ type: 'doc', title: 'Kafka documentation: Introduction', url: 'https://kafka.apache.org/documentation/#intro' }]
},
{
  id: 'microservices-030', topic: 'microservices', level: 'senior',
  q: 'Consumer group thường xuyên rebalance khi deploy và autoscale. Bạn phân biệt cooperative sticky assignment với static membership, và chọn cấu hình nào để giảm thời gian ngừng xử lý?',
  a: `**Tóm tắt:** **cooperative sticky** làm rebalance **từng phần**: chỉ thu hồi những partition thực sự phải chuyển, các partition khác vẫn được xử lý; **static membership** ({{group.instance.id}}) giữ "danh tính" của consumer qua lần restart ngắn, nên restart trong {{session.timeout.ms}} **không gây rebalance**. Hai cơ chế giải hai vấn đề khác nhau (rebalance ít đau hơn / bớt rebalance không cần thiết) và nên kết hợp. Trên Kafka 4.x còn có giao thức group mới (KIP-848) để broker điều phối, rebalance càng nhẹ.

### Hiểu nhanh
Một nhóm 6 người chia nhau 12 bàn trong nhà hàng. Kiểu **eager** cũ: mỗi lần có người vào ca hay ra về, **tất cả** phải bỏ bàn đang phục vụ, đứng lại chia bàn từ đầu, khách chờ. **Cooperative sticky**: ai đang phục vụ bàn nào thì giữ bàn đó, chỉ chuyển vài bàn cho người mới. **Static membership**: nhân viên ra ngoài nghe điện thoại 30 giây thì quản lý **giữ nguyên bàn** cho anh ta, không chia lại; chỉ khi đi quá lâu mới coi như nghỉ.

### Thuật ngữ
- **Rebalance**: quá trình chia lại partition giữa các consumer trong group.
- **Eager rebalance**: mọi consumer nhả hết partition rồi mới nhận assignment mới (stop-the-world).
- **Cooperative rebalance**: chỉ nhả partition cần chuyển, có thể diễn ra qua 2 vòng.
- **Sticky assignment**: thuật toán cố giữ assignment cũ, giảm số partition phải chuyển.
- **Static membership**: consumer khai báo {{group.instance.id}} cố định để được nhận lại khi restart nhanh.
- **session.timeout.ms / heartbeat.interval.ms**: thời gian mất heartbeat trước khi bị loại / chu kỳ gửi heartbeat.
- **max.poll.interval.ms**: thời gian tối đa giữa hai lần poll; quá thì consumer tự rời group.
- **Fencing**: broker chặn một member cũ khi có member khác dùng cùng instance id.

### Rebalance gây dừng ở đâu (từng bước)
1. Mỗi partition chỉ gán cho một member tại một thời điểm.
2. Khi member vào/ra hoặc subscription đổi, coordinator tính assignment mới.
3. **Eager**: mọi consumer thu hồi **tất cả** partition (commit offset, dừng xử lý), rồi chờ assignment mới. Vì sao đau: trong lúc đó cả group không xử lý gì.
4. Rolling deploy 6 pod = khoảng 12 lần rebalance (mỗi pod ra một lần, vào một lần), mỗi lần dừng vài giây → lag tăng vọt.

~~~text
Eager, thêm consumer C:     A:[0,1,2] B:[3,4,5] → TẤT CẢ nhả → A:[0,1] B:[2,3] C:[4,5]
Cooperative sticky:         A giữ [0,1], B giữ [3,4] → chỉ nhả 2 và 5 → C:[2,5]
Static membership, A restart 20s (< session timeout 45s): không rebalance, A nhận lại [0,1]
~~~

### Cooperative sticky
1. Sticky cố giữ assignment cũ; cooperative chỉ thu hồi phần cần chuyển.
2. Thường cần **2 vòng**: vòng 1 báo partition nào phải nhả, consumer dừng xử lý chúng; vòng 2 giao cho member mới. Vì sao an toàn: không có lúc nào hai consumer cùng giữ một partition.
3. Đây là **giảm phạm vi gián đoạn**, không loại bỏ rebalance.
4. Cấu hình: {{partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor}}. Chuyển từ Range/RoundRobin sang phải **rolling 2 lần**: lần 1 khai cả hai {{CooperativeStickyAssignor, RangeAssignor}}, lần 2 bỏ Range; đổi thẳng một lần sẽ gặp lỗi protocol không tương thích trong lúc chuyển.

### Static membership
1. Gán {{group.instance.id}} ổn định, duy nhất cho mỗi instance (ví dụ tên pod của StatefulSet: order-0, order-1).
2. Instance restart và quay lại trong {{session.timeout.ms}} (mặc định 45s) thì coordinator **giữ assignment cũ**, không rebalance.
3. **Giới hạn**: với Deployment, pod mới có tên ngẫu nhiên nên id mới, vẫn rebalance; trùng id giữa hai process thì member sau **fence** member trước. Pod chết thật thì partition của nó đứng yên tới khi hết session timeout, nên đừng đặt timeout quá dài.

### Cách vận hành
- Dùng cooperative sticky đồng nhất trên toàn group; khi nâng cấp client tránh lệch protocol.
- Chỉ bật static membership khi nền tảng đảm bảo id duy nhất và ổn định (StatefulSet); với pod tạm thời, cooperative thường an toàn hơn.
- Tune {{session.timeout.ms}}, {{heartbeat.interval.ms}} (khoảng 1/3 session timeout) và {{max.poll.interval.ms}} theo thời gian xử lý thực; batch quá lâu không poll thì member bị loại dù broker vẫn khỏe. Giảm {{max.poll.records}} nếu xử lý mỗi record lâu.
- Khi bị thu hồi partition (listener {{onPartitionsRevoked}}), commit phần đã xử lý xong; **không** commit offset của batch còn đang chạy.
- Kafka 4.x: cân nhắc {{group.protocol=consumer}} (KIP-848), broker tính assignment và rebalance diễn ra từng phần, không cần "đồng bộ cả group".

~~~yaml
spring:
  kafka:
    consumer:
      properties:
        partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
        group.instance.id: order-0        # lấy từ tên pod StatefulSet, phải duy nhất
        session.timeout.ms: 45000
        max.poll.records: 200
~~~

### Lỗi hay gặp
1. **Đổi assignor bằng một lần rolling deploy**. Triệu chứng: lỗi protocol không tương thích, consumer không join được. Cách tránh: rolling 2 bước như trên.
2. **Static membership trên Deployment**. Triệu chứng: vẫn rebalance mỗi lần deploy, có lúc member ma giữ partition tới hết timeout. Cách tránh: dùng với StatefulSet hoặc id ổn định.
3. **Tăng max.poll.interval.ms để che batch treo**. Triệu chứng: consumer treo thật mà lâu mới bị phát hiện. Cách tránh: chia nhỏ batch, timeout cho call ra ngoài.
4. **Autoscale theo CPU quá nhạy**. Triệu chứng: consumer liên tục thêm/bớt, rebalance không dứt. Cách tránh: scale theo lag, có cooldown, số consumer không vượt số partition.

### Ví dụ đời thực
Consumer group {{order-processor}} (6 pod Kubernetes Deployment, 12 partition, {{RangeAssignor}} mặc định cũ kiểu eager) xử lý sự kiện thanh toán. Mỗi lần deploy rolling (CI/CD 6–8 lần/ngày) và mỗi lần autoscale (HPA scale 6 ↔ 10 pod theo CPU) đều gây rebalance. Triệu chứng: trong 10–20 phút sau deploy, dashboard cảnh báo {{consumer_lag}} tăng vọt từ ~200 message lên 45.000–80.000 message; p95 thời gian từ lúc nhận event tới lúc cập nhật trạng thái đơn tăng từ 1,5 giây lên 35–60 giây; khách hàng phàn nàn "đã thanh toán nhưng đơn chưa xác nhận".

Điều tra: (1) metric {{kafka.consumer.coordinator.rebalance.total}} cho thấy ~12–16 lần rebalance mỗi lần rolling deploy 6 pod (mỗi pod ra/vào đều kích hoạt); (2) log consumer cho thấy rebalance eager: mỗi lần "Revoking previously assigned partitions [0,1,2,3,4,5,...]" rồi mới nhận assignment mới → cả group ngừng xử lý vài giây mỗi vòng; (3) khi dùng Deployment, tên pod ngẫu nhiên nên không thể giữ identity; ngoài ra {{max.poll.interval.ms}} để mặc định 5 phút nhưng một số batch gọi API chậm khiến vài member bị loại thầm.

Xử lý: (1) chuyển assignor sang {{CooperativeStickyAssignor}} theo rolling 2 bước (bước 1: {{CooperativeStickyAssignor,RangeAssignor}}, bước 2: chỉ {{CooperativeStickyAssignor}}) để rebalance chỉ thu hồi partition cần chuyển; (2) chuyển workload sang StatefulSet và đặt {{group.instance.id}} theo tên pod ({{order-0}}…{{order-5}}) + {{session.timeout.ms}} 45s, để restart pod trong 45s không gây rebalance; (3) tune {{heartbeat.interval.ms}} 10s, {{max.poll.records}} 200, {{max.poll.interval.ms}} 5 phút nhưng giảm batch và thêm timeout cho call ra ngoài; (4) autoscale theo {{consumer_lag}} (KEDA) có cooldown 5 phút, và giới hạn max replica = số partition (12).

Kết quả sau 2 tuần: số lần rebalance mỗi deploy giảm từ ~14 xuống 0–2 (chỉ khi thực sự thay đổi số pod lâu dài); lag đỉnh sau deploy giảm từ 60.000 xuống < 3.000 message; p95 thời gian cập nhật trạng thái ổn định ~2 giây ngay cả trong cửa sổ deploy. Trade-off: pod chết hẳn (không quay lại) thì partition của nó đứng yên tới hết 45s session timeout, nên team giữ timeout ở mức cân bằng và có alert nếu lag partition đơn lẻ tăng đột biến.

### Trả lời miệng 1 phút
"Đây là hai cơ chế khác nhau. Cooperative sticky làm rebalance từng phần: chỉ partition phải chuyển mới bị thu hồi, các partition khác vẫn chạy, nên gián đoạn nhỏ hơn nhiều so với eager. Static membership với group.instance.id cố định giúp pod restart trong session timeout không gây rebalance, rất hợp với StatefulSet. Tôi kết hợp cả hai, tune session timeout, heartbeat và max.poll.interval theo thời gian xử lý thật, và autoscale theo lag có cooldown. Khi chuyển assignor tôi rolling hai bước để tránh lệch protocol. Trên Kafka 4 tôi cân nhắc giao thức group mới KIP-848. Tôi luôn theo dõi số lần và thời gian rebalance theo từng lần deploy."

> Senior tip: theo dõi số lần rebalance, thời gian rebalance và assignment theo từng lần deploy. Nếu rebalance do {{max.poll.interval.ms}}, tăng timeout đơn thuần có thể che một batch treo; ưu tiên chia nhỏ batch hoặc chuyển xử lý dài sang worker có checkpoint.`,
  follow: ['Static member bị treo nhưng chưa hết session timeout sẽ ảnh hưởng availability ra sao?', 'Rolling deploy client Kafka cần kiểm soát assignor version thế nào?'],
  tags: ['Kafka', 'consumer group', 'rebalance', 'static membership'],
  refs: [{ type: 'doc', title: 'Kafka consumer configuration', url: 'https://kafka.apache.org/documentation/#consumerconfigs' }]
},
{
  id: 'microservices-031', topic: 'microservices', level: 'lead',
  q: 'Bạn cần không mất record và tránh xử lý nghiệp vụ lặp khi consumer ghi database. Hãy giải thích at-least-once, idempotent producer và Kafka transactions, cùng giới hạn của exactly-once.',
  a: `**Tóm tắt:** commit offset **sau** khi xử lý cho at-least-once: có thể xử lý lại nhưng không mất record; commit **trước** khi xử lý thì có thể mất dữ liệu. **Idempotent producer** loại bản trùng do retry của chính producer khi ghi vào Kafka. **Kafka transactions** + {{isolation.level=read_committed}} cho exactly-once trong luồng **Kafka → Kafka** (consume-transform-produce), nhưng **không** bao trùm được database bên ngoài. Khi consumer ghi DB, cách chuẩn là at-least-once + **inbox/dedup table cùng transaction DB** với business write.

### Hiểu nhanh
Bạn là thủ kho nhận phiếu nhập hàng theo số thứ tự. Mỗi lần nhập xong một phiếu, bạn ghi vào sổ "đã làm tới phiếu số 10" (commit offset). Nếu bạn **nhập hàng xong rồi ngất trước khi ghi sổ**, người thay ca sẽ làm lại phiếu 10, tức là nhập trùng (at-least-once). Nếu bạn **ghi sổ trước rồi ngất trước khi nhập**, phiếu 10 bị bỏ qua mãi mãi (mất dữ liệu). Cách an toàn: ghi sổ sau, và trên mỗi lô hàng dán **mã phiếu**; kho kiểm tra "mã này nhập rồi" thì bỏ qua. Đó là consumer idempotent.

### Thuật ngữ
- **Offset commit**: lưu vị trí đã xử lý của consumer group vào topic nội bộ {{__consumer_offsets}}.
- **At-least-once / at-most-once**: không mất nhưng có thể trùng / không trùng nhưng có thể mất.
- **Idempotent producer**: producer có producer ID + sequence number theo partition để broker loại bản trùng do retry.
- **Kafka transaction**: nhóm nhiều lần ghi (nhiều partition) + commit offset thành một đơn vị nguyên tử.
- **read_committed**: consumer chỉ thấy record của transaction đã commit.
- **transactional.id**: định danh ổn định của producer transaction, dùng để fence producer "zombie".
- **Inbox / dedup table**: bảng lưu event id đã xử lý, ghi cùng transaction với dữ liệu nghiệp vụ.
- **Outbox**: bảng chứa event chờ publish, ghi cùng transaction với dữ liệu nghiệp vụ.

### At-least-once và idempotency (từng bước)
1. Consumer đọc offset 10, ghi DB thành công.
2. Consumer chết **trước** khi commit offset 11.
3. Sau rebalance, offset 10 được đọc lại. Đây là bản trùng **có chủ đích** để không mất event.
4. Bảo vệ DB: trong **cùng một transaction DB**, insert event id vào bảng inbox (khóa chính) rồi mới cập nhật nghiệp vụ; nếu insert trùng thì bỏ qua. Vì sao cùng transaction: nếu tách ra, crash giữa hai bước lại sinh trùng.
5. Commit offset sau khi transaction DB commit.

~~~java
@KafkaListener(topics = "payment.captured")
@Transactional   // transaction DB (JPA)
public void on(PaymentCaptured evt) {
    if (inboxRepo.insertIfAbsent(evt.eventId()) == 0) return;   // đã xử lý: bỏ qua
    orderRepo.markPaid(evt.orderId(), evt.amount());            // cùng transaction
}   // DB commit xong, container mới commit offset
~~~
- Commit offset **trước** ghi DB: crash ở giữa thì offset đã tiến nhưng DB chưa có, **mất hiệu ứng**.
- Với batch hoặc xử lý song song: chỉ commit offset cao nhất mà **mọi record trước đó đã xong**.

### Idempotent producer và transactions
1. **Idempotent producer** (mặc định bật từ Kafka 3.0, đi cùng {{acks=all}}): broker nhớ sequence cuối của mỗi producer/partition, retry gửi lại batch cũ thì bị loại. **Giới hạn**: nó không chống được việc **ứng dụng** gọi {{send()}} hai lần cho cùng một event (ví dụ do request được retry từ đầu); chỗ đó cần event id + dedup ở consumer.
2. **Transaction**: producer có {{transactional.id}}, ghi nhiều record + gửi offset của consumer vào cùng transaction ({{sendOffsetsToTransaction}}), rồi commit hoặc abort.
3. Consumer downstream đặt {{isolation.level=read_committed}} để bỏ qua record thuộc transaction chưa commit hoặc đã abort.

~~~text
consume input → transform → beginTransaction
                          → send(output...) + sendOffsetsToTransaction(input offsets)
                          → commitTransaction   (tất cả cùng thành công hoặc cùng hủy)
~~~

### Biên giới của exactly-once
| Luồng | Exactly-once? | Cách làm |
|---|---|---|
| Kafka → Kafka | có (trong phạm vi Kafka) | transactions / Kafka Streams {{processing.guarantee=exactly_once_v2}} |
| Kafka → DB | không tự động | at-least-once + inbox/upsert cùng transaction DB |
| Kafka → API bên ngoài | không tự động | idempotency key gửi sang bên ngoài + đối soát |
| DB → Kafka | không tự động | transactional outbox + CDC |

"Exactly-once" luôn phải nói rõ **phạm vi** và **lỗi nào được bao phủ**.

### Lỗi hay gặp
1. **Inbox insert và business update ở hai transaction khác nhau**. Triệu chứng: vẫn có bản trùng sau crash. Cách tránh: một transaction DB cho cả hai.
2. **Tin rằng Kafka transaction bao luôn DB**. Triệu chứng: Kafka commit nhưng DB rollback (hoặc ngược lại), dữ liệu lệch. Cách tránh: chọn một nguồn sự thật, dùng inbox/outbox.
3. **Consumer downstream vẫn read_uncommitted** (mặc định). Triệu chứng: đọc được record của transaction đã abort. Cách tránh: đặt read_committed cho consumer của topic transactional.
4. **auto commit + xử lý bất đồng bộ**. Triệu chứng: crash làm mất record vì offset đã được commit tự động. Cách tránh: tắt auto commit (Spring Kafka mặc định đã tắt), commit sau khi xử lý.

### Trả lời miệng 1 phút
"Tôi chọn at-least-once: xử lý xong mới commit offset, chấp nhận có thể xử lý lại thay vì mất record. Để không lặp nghiệp vụ, consumer insert event id vào bảng inbox và cập nhật dữ liệu trong cùng một transaction DB; trùng thì bỏ qua. Idempotent producer chỉ chống trùng do retry của producer, không chống được ứng dụng gửi hai lần. Kafka transactions với read_committed cho exactly-once khi cả đầu vào và đầu ra đều là Kafka, như Kafka Streams, nhưng không bao được Postgres hay API bên ngoài. Vì vậy khi nói exactly-once tôi luôn nói rõ phạm vi. Thực tế tôi gắn event id xuyên suốt log, DB và trace để chứng minh replay an toàn."

### Ví dụ đời thực
**Triệu chứng:** hệ thống ví điện tử (~1.800 event {{payment.captured}}/phút) ghi nhận 0,6% đơn bị cộng tiền ví hai lần sau một đợt deploy làm consumer khởi động lại liên tục; tiền vào ví vượt giao dịch ngân hàng khoảng 11 triệu đồng trong 40 phút.

**Điều tra:** tra log thấy cùng {{eventId}} được xử lý lặp 2-3 lần nhưng offset không tiến đều. Metric {{records-consumed-rate}} dao động, {{commit-latency-avg}} tăng vọt khi pod bị OOMKilled. Kiểm tra code phát hiện listener cập nhật {{wallet.balance}} rồi mới để container commit offset, và không có bảng kiểm tra trùng; pod chết giữa hai bước nên record được đọc lại. Bảng {{inbox_processed}} đã tồn tại nhưng {{insert}} và {{update}} nằm ở hai transaction JPA khác nhau.

**Nguyên nhân gốc:** commit offset sau xử lý kết hợp crash tạo bản trùng at-least-once (đúng kỳ vọng), nhưng consumer không idempotent vì kiểm tra trùng và ghi nghiệp vụ tách transaction.

**Cách xử lý:** gộp {{INSERT INTO inbox_processed(event_id, processed_at)}} và cập nhật số dư vào **cùng một {{@Transactional}}**; nếu insert trùng (khóa chính) thì bỏ qua. Chỉ để container commit offset sau khi transaction DB commit. Thêm chỉ số {{SELECT count(*) FROM wallet_tx GROUP BY event_id HAVING count(*) > 1}} vào dashboard.

**Kết quả đo được:** sau 48 giờ, số dòng trùng theo {{eventId}} = 0; metric {{duplicate.suppressed}} ổn định ~0,5%/phút (chứng tỏ dedup đang hoạt động), đối soát ví với ngân hàng khớp 100%.

> Senior tip: trong production thường chọn at-least-once cộng consumer idempotent. Đặt event id xuyên suốt log, DB và trace để đội trực có thể chứng minh retry nào tạo bản trùng và replay an toàn.`,
  follow: ['Vì sao idempotent producer không chống được lần publish nghiệp vụ trùng?', 'Khi consumer ghi DB, bạn thiết kế inbox table và commit offset ra sao?'],
  tags: ['Kafka', 'offset', 'exactly once', 'idempotency', 'transactions'],
  refs: [{ type: 'doc', title: 'Kafka design: Message delivery semantics', url: 'https://kafka.apache.org/documentation/#semantics' }]
},
{
  id: 'microservices-032', topic: 'microservices', level: 'senior',
  q: 'Một cluster Kafka mới cần bỏ ZooKeeper. KRaft thay đổi kiến trúc và quy trình vận hành thế nào, và bạn lên kế hoạch migration cluster đang chạy ra sao?',
  a: `**Tóm tắt:** **KRaft** đưa phần quản lý metadata vào chính Kafka: một nhóm **controller** bầu leader bằng giao thức Raft và lưu metadata trong một log nội bộ, bỏ hẳn ZooKeeper. Kết quả: bớt một hệ thống phải vận hành, failover controller nhanh hơn, cluster chứa được nhiều partition hơn. Từ **Kafka 4.0, ZooKeeper đã bị gỡ hoàn toàn**, nên cluster cũ phải migrate trên dòng **3.x (bản cầu nối 3.9)** trước khi lên 4.x, theo đúng quy trình chính thức, có bước kiểm tra và một cửa sổ rollback trước khi "finalize".

### Hiểu nhanh
Trước đây Kafka giống một công ty thuê **văn phòng luật bên ngoài** (ZooKeeper) giữ sổ đăng ký: ai là trưởng nhóm của partition nào, topic nào tồn tại. Mỗi lần đổi gì cũng phải gọi sang văn phòng đó. KRaft là **tự lập phòng pháp chế nội bộ** gồm 3 người, ghi chung một cuốn sổ, quyết định theo đa số. Ít bên phải phối hợp hơn, nhanh hơn, nhưng giờ bạn tự chịu trách nhiệm giữ cho phòng pháp chế luôn đủ người (quorum).

### Thuật ngữ
- **Metadata**: thông tin về cluster (topic, partition, leader, ISR, cấu hình, ACL).
- **Controller**: node quản lý metadata và ra quyết định (bầu leader partition, thêm topic).
- **Raft**: thuật toán đồng thuận: một leader ghi log, follower sao chép, cần đa số đồng ý.
- **Quorum / majority**: số node tối thiểu để hệ thống ra quyết định (3 node chịu mất 1, 5 node chịu mất 2).
- **Metadata log ({{__cluster_metadata}})**: log nội bộ chứa mọi thay đổi metadata, broker đọc để cập nhật.
- **Combined mode**: một process vừa làm broker vừa làm controller (chỉ nên cho dev/test).
- **Bridge release**: bản 3.x hỗ trợ cả hai chế độ để migrate (3.9 là bản cuối có ZooKeeper).
- **Finalize migration**: bước chốt chuyển sang KRaft, sau bước này không quay về ZooKeeper được nữa.

### KRaft thay đổi kiến trúc thế nào
1. **Trước**: ZooKeeper lưu metadata; một broker được bầu làm controller, đọc/ghi ZooKeeper, rồi đẩy metadata cho broker khác. Vì sao chậm: controller mới phải tải toàn bộ metadata từ ZooKeeper khi failover.
2. **Sau**: 3 hoặc 5 controller chạy Raft, metadata là một log được sao chép; controller dự phòng đã có sẵn metadata nên failover gần như tức thì.
3. **Broker** vẫn lưu dữ liệu partition như cũ, nhưng nhận metadata bằng cách đọc metadata log.
4. **Quorum** cần số node lẻ, đặt ở các failure domain khác nhau (AZ khác nhau).

~~~text
       KRaft controller quorum (3 node, Raft)
   [ctrl-1 LEADER] ⇄ [ctrl-2] ⇄ [ctrl-3]   ← metadata log
            │ metadata (pull)
   [broker-1] [broker-2] [broker-3] ...      ← partition data
Mất 1/3 controller: vẫn chạy.  Mất 2/3: mất majority → không đổi được metadata
~~~
Không có ZooKeeper không có nghĩa là tự phục hồi mọi lỗi: mất majority controller thì mọi thay đổi metadata (tạo topic, bầu lại leader khi broker chết) bị đứng; broker có thể vẫn phục vụ phần dữ liệu đang có nhưng cluster không tự điều chỉnh được.

### Quy trình vận hành thay đổi
- Khởi tạo cluster mới: tạo cluster id và format thư mục lưu trữ bằng {{kafka-storage.sh}} trước khi chạy node.
- Giám sát **quorum health** (leader hiện tại, độ trễ follower của metadata log) bằng {{kafka-metadata-quorum.sh describe --status}} và JMX metric.
- Backup/restore phải hiểu metadata KRaft, không chỉ copy thư mục data của broker.

### Migration cluster đang chạy (ZooKeeper → KRaft, từng bước)
1. **Nâng cấp lên bản cầu nối** (3.9 khuyến nghị) khi vẫn ở chế độ ZooKeeper. Vì sao: 4.x không đọc được ZooKeeper nữa.
2. **Kiểm tra tính năng đang dùng** có được KRaft hỗ trợ ở phiên bản đích; sao lưu cấu hình, metadata, ACL; xác nhận monitoring.
3. **Dựng controller quorum KRaft** với cấu hình bật chế độ migration và trỏ tới ZooKeeper cũ.
4. **Rolling restart broker** với cấu hình migration: controller KRaft sao chép metadata từ ZooKeeper; trong giai đoạn "dual-write" metadata vẫn được ghi ngược về ZooKeeper.
5. **Rolling restart broker sang chế độ KRaft hoàn toàn**, theo dõi partition, ISR, lag của client sau mỗi node.
6. **Finalize**: gỡ cấu hình migration khỏi controller. Rollback chỉ còn khả thi **trước** bước này, và chỉ trong cửa sổ thời gian đã thống nhất.
7. Sau khi ổn định mới nâng cấp lên 4.x và cho nghỉ ZooKeeper.

Luôn làm theo tài liệu migration chính thức của đúng phiên bản; tên cấu hình và bước chi tiết có thể khác giữa các bản.

### Lỗi hay gặp
1. **Đặt controller và broker chung máy ở production**. Triệu chứng: tranh chấp CPU/disk đúng lúc bầu lại leader, metadata chậm. Cách tránh: controller tách riêng (dedicated mode).
2. **Alert chỉ nhìn "broker up"**. Triệu chứng: quorum đã mất majority mà không ai biết cho tới khi tạo topic thất bại. Cách tránh: alert theo quorum health và độ trễ metadata.
3. **Nhảy thẳng từ ZooKeeper 3.x cũ lên 4.0**. Triệu chứng: broker không khởi động được. Cách tránh: migrate trên bản cầu nối rồi mới lên 4.x.
4. **Finalize quá sớm**. Triệu chứng: phát hiện vấn đề nhưng không còn đường lùi. Cách tránh: chạy ổn định ở trạng thái migration đủ lâu, có tiêu chí rõ ràng trước khi chốt.

### Trả lời miệng 1 phút
"KRaft thay ZooKeeper bằng một quorum controller ngay trong Kafka, dùng Raft và lưu metadata trong một log nội bộ. Controller dự phòng có sẵn metadata nên failover nhanh, cluster chứa nhiều partition hơn, và bớt một hệ thống phải vận hành. Từ Kafka 4.0 ZooKeeper đã bị gỡ, nên tôi migrate trên bản cầu nối 3.9: dựng controller quorum ở chế độ migration, rolling broker để chép metadata, rồi rolling sang KRaft hoàn toàn, theo dõi ISR và lag sau mỗi bước, và chỉ finalize khi đã ổn định vì sau đó không rollback được. Vận hành thì tôi đặt 3 hoặc 5 controller ở các AZ khác nhau và alert theo quorum health, không chỉ broker up."

### Ví dụ đời thực
**Triệu chứng:** cụm Kafka 3.5 (6 broker, ZooKeeper, ~4.200 partition) gặp hai lần sự cố trong tháng: failover controller mất ~35 giây làm tạo topic và bầu lại leader chậm; một lần ZooKeeper session timeout gây {{NotControllerException}} rải rác, p95 produce latency vọt từ 18 ms lên 420 ms.

**Điều tra:** chạy {{kafka-metadata-quorum.sh}} không dùng được (chưa KRaft); kiểm tra log controller thấy "Controller moved to another broker" và thời gian tải metadata từ ZooKeeper ~28 giây. Metric ZooKeeper {{zk_outstanding_requests}} tăng đột biến. Đội vận hành cũng báo phải vá bảo mật/backup cho cả Kafka lẫn ZooKeeper, hai hệ thống khác nhau.

**Nguyên nhân gốc:** controller phụ thuộc ZooKeeper để nạp metadata khi failover, và cụm có nhiều partition làm thời gian nạp lớn; vận hành hai hệ thống phân tán tăng rủi ro.

**Cách xử lý:** nâng cấp lên bản cầu nối 3.9, dựng quorum 3 controller KRaft ở 3 AZ ở chế độ migration, rolling broker để sao chép metadata, theo dõi ISR và client lag sau mỗi node. Chạy song song 10 ngày, kiểm tra tạo topic, bầu lại leader và ACL; sau đó rolling sang KRaft hoàn toàn, chờ thêm 7 ngày mới finalize.

**Kết quả đo được:** failover controller giảm còn ~2 giây (controller dự phòng đã có metadata); thao tác tạo topic ổn định < 1 giây; số hệ thống phải vận hành giảm 1 (bỏ ZooKeeper); không ghi nhận {{NotControllerException}} trong 30 ngày sau.

> Senior tip: diễn tập mất một controller và restore trên staging có dữ liệu gần production. Tiêu chí là đo được thời gian các thao tác metadata phục hồi (tạo topic, bầu lại leader), không chỉ thấy process đang chạy.`,
  follow: ['Controller quorum mất majority thì broker và client nhìn thấy hiện tượng gì?', 'Bạn xác minh khả năng restore metadata KRaft bằng bài diễn tập nào?'],
  tags: ['Kafka', 'KRaft', 'ZooKeeper', 'operations'],
  refs: [{ type: 'doc', title: 'Kafka KRaft documentation', url: 'https://kafka.apache.org/documentation/#kraft' }]
},
{
  id: 'microservices-033', topic: 'microservices', level: 'mid',
  q: 'Topic audit cần giữ lịch sử để replay, còn topic trạng thái khách hàng chỉ cần giá trị mới nhất theo key. Bạn chọn retention hay compaction, và cấu hình chúng ảnh hưởng gì?',
  a: `**Tóm tắt:** **retention** xóa cả segment cũ theo thời gian ({{retention.ms}}) hoặc dung lượng ({{retention.bytes}}), hợp với lịch sử sự kiện có thời hạn như topic audit (đặt retention đủ dài, hoặc archive ra nơi khác nếu cần lâu hơn). **Compaction** ({{cleanup.policy=compact}}) giữ lại **giá trị mới nhất cho mỗi key**, hợp với topic trạng thái khách hàng (changelog). Compaction chạy bất đồng bộ nên không phải một "ảnh chụp" tức thời, và bản ghi xóa (tombstone) cũng chỉ được giữ trong một khoảng thời gian.

### Hiểu nhanh
**Retention** giống **camera an ninh lưu 30 ngày**: quá 30 ngày thì băng cũ bị ghi đè, xem lại được mọi thứ trong 30 ngày đó. **Compaction** giống **danh bạ điện thoại**: mỗi người chỉ cần số điện thoại **mới nhất**, số cũ bị gạch đi; ai chuyển đi hẳn thì ghi chú "đã xóa" một thời gian rồi xóa luôn dòng đó. Topic audit cần xem lại "chuyện gì đã xảy ra" nên là camera; topic trạng thái khách hàng chỉ cần "hiện tại là gì" nên là danh bạ.

### Thuật ngữ
- **Segment**: file log con của partition; Kafka xóa/compact theo đơn vị segment, không theo từng record.
- **Active segment**: segment đang được ghi, không bao giờ bị xóa hay compact.
- **retention.ms / retention.bytes**: giới hạn tuổi / dung lượng partition trước khi segment cũ bị xóa (mặc định 7 ngày / không giới hạn).
- **Log compaction**: tiến trình cleaner giữ bản ghi mới nhất theo key, bỏ bản ghi cũ hơn cùng key.
- **Tombstone**: record có value null, nghĩa là "key này đã bị xóa".
- **delete.retention.ms**: thời gian giữ tombstone sau khi compact (mặc định 1 ngày).
- **min.cleanable.dirty.ratio / min.compaction.lag.ms**: ngưỡng phần "bẩn" để cleaner chạy / thời gian tối thiểu record được giữ nguyên trước khi bị compact.
- **Changelog topic**: topic phản ánh trạng thái hiện tại của từng key, dùng để dựng lại state store/cache.

### Retention (từng bước)
1. Kafka ghi append-only vào segment; khi segment đủ lớn ({{segment.bytes}}, mặc định 1GB) hoặc đủ lâu ({{segment.ms}}) thì "đóng" và mở segment mới.
2. Broker định kỳ kiểm tra: segment đã đóng mà record mới nhất trong đó cũ hơn {{retention.ms}}, hoặc partition vượt {{retention.bytes}}, thì **xóa cả segment**. Vì sao theo segment: xóa file nhanh hơn rất nhiều so với xóa từng record.
3. Consumer offline lâu hơn retention sẽ không đọc được phần đã bị xóa (offset bị reset theo {{auto.offset.reset}}).
4. Dùng cho telemetry, audit có chính sách lưu trữ, event replay trong một cửa sổ xác định. Cần giữ nhiều năm thì archive ra object storage (S3) hoặc dùng tiered storage.

### Compaction (từng bước)
1. Cleaner quét các segment đã đóng, xây bảng "offset mới nhất của mỗi key".
2. Ghi lại segment mới, bỏ các record cũ hơn cùng key. Vì sao bất đồng bộ: compaction tốn IO, chạy nền theo ngưỡng {{min.cleanable.dirty.ratio}}.
3. Đọc từ đầu topic có thể vẫn thấy **nhiều phiên bản** của một key nếu cleaner chưa chạy tới, và active segment không bao giờ được compact.
4. Record value null là **tombstone**; sau khi compact, tombstone được giữ thêm {{delete.retention.ms}} rồi cũng bị dọn. Vì sao giữ thêm: để consumer đang đọc kịp thấy lệnh xóa.

~~~text
Trước compact: c42=Gold | c77=Basic | c42=Platinum | c77=null
Sau compact:   c42=Platinum | c77=null (tombstone, giữ delete.retention.ms)
Sau đó:        c42=Platinum            (c77 biến mất hẳn)
~~~

### Kết hợp và cấu hình
~~~bash
# topic audit: giữ 90 ngày
kafka-configs.sh --bootstrap-server localhost:9092 --alter --entity-type topics --entity-name audit.events \\
  --add-config retention.ms=7776000000
# topic trạng thái khách hàng: compact
kafka-configs.sh --bootstrap-server localhost:9092 --alter --entity-type topics --entity-name customer.state \\
  --add-config cleanup.policy=compact,min.compaction.lag.ms=60000
~~~
- Có thể bật **cả hai**: {{cleanup.policy=compact,delete}}, compaction giữ bản mới nhất theo key, retention giới hạn tuổi/dung lượng. Nhưng retention có thể xóa luôn bản mới nhất của key ít thay đổi, làm mất dữ liệu cần để rebuild, nên phải khớp với yêu cầu khôi phục.

### Chọn thế nào
| Nhu cầu | Chọn |
|---|---|
| Audit, event sourcing, replay lịch sử | retention đủ dài (+ archive nếu cần lâu hơn) |
| Trạng thái mới nhất theo key, dựng lại cache/state store | compact |
| Trạng thái mới nhất nhưng giới hạn dung lượng | compact,delete (cẩn thận) |
| Cần query tùy ý, transaction nhiều bản ghi | dùng database, không dùng topic |

### Lỗi hay gặp
1. **Key không ổn định cho topic compact**. Triệu chứng: compaction không giảm được dung lượng, cùng khách hàng có nhiều key. Cách tránh: key là id thực thể ổn định.
2. **Consumer offline lâu hơn delete.retention.ms**. Triệu chứng: không bao giờ nhận lệnh xóa, cache giữ "khách ma". Cách tránh: delete.retention.ms lớn hơn thời gian offline tối đa, hoặc rebuild từ đầu.
3. **Dùng retention ngắn cho audit**. Triệu chứng: cần điều tra sự việc 2 tháng trước thì dữ liệu đã mất. Cách tránh: retention theo chính sách, archive ra S3.
4. **Coi compaction là tức thời**. Triệu chứng: consumer bootstrap thấy record cũ và xử lý sai. Cách tránh: consumer luôn áp dụng "bản sau ghi đè bản trước" và xử lý tombstone.

### Trả lời miệng 1 phút
"Retention xóa cả segment khi quá tuổi hoặc quá dung lượng, nên hợp với topic audit cần replay trong một cửa sổ; tôi đặt retention theo chính sách lưu trữ và archive ra S3 nếu cần lâu hơn. Compaction giữ bản ghi mới nhất cho mỗi key, hợp với topic trạng thái khách hàng để dựng lại cache hay state store. Tôi lưu ý compaction chạy nền nên consumer vẫn có thể thấy bản cũ, active segment không được compact, và tombstone chỉ giữ trong delete.retention.ms. Có thể bật cả compact và delete nhưng phải chắc là không làm mất dữ liệu cần để rebuild. Topic không thay được database khi cần query tùy ý."

### Ví dụ đời thực
**Triệu chứng:** đội tuân thủ cần điều tra một thay đổi quyền truy cập xảy ra 75 ngày trước nhưng topic {{audit.events}} chỉ đọc lại được 7 ngày; đồng thời topic {{customer.state}} (trạng thái hạng khách hàng theo {{customerId}}) phình từ 12 GB lên 180 GB sau 3 tháng, chi phí đĩa broker tăng.

**Điều tra:** chạy {{kafka-configs.sh --describe --entity-type topics --entity-name audit.events}} thấy {{retention.ms}} đang dùng mặc định 7 ngày. Với {{customer.state}}, kiểm tra {{kafka-log-dirs.sh}} và log cleaner thấy {{cleanup.policy=delete}} (mặc định) nên Kafka chỉ xóa segment theo thời gian, không compact theo key; cùng {{customerId}} xuất hiện hàng trăm phiên bản.

**Nguyên nhân gốc:** chọn sai chính sách dọn log cho từng nhu cầu: audit cần lịch sử dài (retention dài + archive) nhưng để mặc định; trạng thái khách hàng chỉ cần giá trị mới nhất theo key nhưng dùng delete thay vì compact.

**Cách xử lý:** đặt {{audit.events}} với {{retention.ms=7776000000}} (90 ngày) và bật tiered storage/archive sang S3 để giữ lâu hơn theo chính sách. Đặt {{customer.state}} với {{cleanup.policy=compact,min.compaction.lag.ms=60000,delete.retention.ms=86400000}}, đảm bảo key là {{customerId}} ổn định. Thử rebuild cache khách hàng từ đầu topic sau khi cleaner chạy.

**Kết quả đo được:** điều tra audit đọc lại được đủ 90 ngày; dung lượng {{customer.state}} giảm còn ~14 GB sau 24 giờ cleaner chạy (bản mới nhất ~1,2 triệu key), cache rebuild từ topic cho kết quả khớp DB 100%.

> Senior tip: thử dựng lại state store từ topic sau khi cleaner chạy và tombstone đã hết hạn. Nếu việc rebuild vẫn cần biết "bản ghi đã bị xóa" để hiểu nghiệp vụ, phải lưu dấu xóa hoặc lịch sử ở nơi khác.`,
  follow: ['Nếu consumer mới cần khôi phục lịch sử đầy đủ, compaction có đáp ứng không?', 'Tombstone hết hạn trước khi consumer offline quay lại tạo rủi ro nào?'],
  tags: ['Kafka', 'retention', 'compaction', 'tombstone'],
  refs: [{ type: 'doc', title: 'Kafka log compaction', url: 'https://kafka.apache.org/documentation/#compaction' }]
},
{
  id: 'microservices-034', topic: 'microservices', level: 'senior',
  q: 'Spring Kafka listener gặp lỗi dữ liệu không hợp lệ lặp lại. Bạn cấu hình retry, DefaultErrorHandler và DeadLetterPublishingRecoverer thế nào để tránh poison message chặn partition?',
  a: `**Tóm tắt:** phân loại lỗi trước: lỗi **tạm thời** (DB timeout, 503) thì retry hữu hạn có backoff; lỗi **vĩnh viễn** (payload sai, vi phạm validation, deserialize hỏng) thì không retry mà chuyển ngay sang **DLT** kèm metadata. {{DefaultErrorHandler}} điều phối retry/recover, {{DeadLetterPublishingRecoverer}} publish record lỗi sang DLT; offset chỉ được tiến khi record đã xử lý xong **hoặc** đã được đưa sang DLT thành công. Lỗi deserialize phải bắt bằng {{ErrorHandlingDeserializer}}, nếu không consumer kẹt vòng lặp ngay ở bước poll.

### Hiểu nhanh
Một băng chuyền đóng gói gặp một kiện hàng **bị hỏng nhãn** (poison message). Nếu công nhân cứ cầm kiện đó lên, thử đọc nhãn, thất bại, đặt lại, rồi lại thử... thì cả băng chuyền đứng mãi. Cách đúng: kiện bị **ướt tạm thời** (lỗi tạm) thì để khô một lúc rồi thử lại vài lần; kiện **rách nhãn hẳn** (lỗi vĩnh viễn) thì dán phiếu ghi "lấy từ băng nào, vị trí nào, lỗi gì" rồi đặt sang **kệ hàng lỗi** (DLT), băng chuyền chạy tiếp. Sau đó có người phụ trách kệ lỗi xem xét và đưa lại khi đã sửa.

### Thuật ngữ
- **Poison message**: record mà lần xử lý nào cũng lỗi, nếu không tách ra sẽ chặn partition.
- **DefaultErrorHandler**: error handler mặc định của Spring Kafka (từ 2.8), retry bằng cách seek lại offset rồi gọi recoverer khi hết lượt.
- **BackOff**: chính sách chờ giữa các lần retry ({{FixedBackOff}}, {{ExponentialBackOff}}).
- **DeadLetterPublishingRecoverer**: recoverer gửi record lỗi sang dead letter topic (mặc định tên {{<topic>.DLT}}, cùng số partition).
- **DLT (Dead Letter Topic)**: topic chứa record không xử lý được, kèm header mô tả lỗi.
- **ErrorHandlingDeserializer**: deserializer bọc deserializer thật; khi lỗi, nó không ném exception ở poll mà chuyển lỗi tới error handler.
- **Not-retryable exception**: loại exception được khai báo là lỗi vĩnh viễn, đi thẳng sang recoverer.

### Luồng xử lý (từng bước)
1. **Listener ném exception**. Container chuyển cho {{DefaultErrorHandler}}.
2. **Phân loại**: nếu exception thuộc danh sách not-retryable thì sang bước 4 ngay. Vì sao: lỗi dữ liệu thì retry bao nhiêu cũng vậy, chỉ làm tăng lag.
3. **Retry**: handler seek lại về offset lỗi (các record sau trong batch cũng được poll lại), chờ theo backoff rồi gọi listener lần nữa. Retry chạy trên consumer thread nên partition **đứng chờ**, đổi lại giữ thứ tự.
4. **Recover**: hết lượt, {{DeadLetterPublishingRecoverer}} gửi record sang DLT kèm header gốc.
5. **Commit offset** sau khi recover thành công. Nếu gửi DLT thất bại, recoverer báo lỗi và record được xử lý lại thay vì bị bỏ qua. Vì sao: commit âm thầm khi DLT lỗi nghĩa là **mất record**.

~~~java
@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template);   // mặc định: <topic>.DLT, cùng partition
    var backoff = new ExponentialBackOff(500L, 2.0);
    backoff.setMaxElapsedTime(5_000L);              // tổng retry tối đa ~5s rồi sang DLT
    var handler = new DefaultErrorHandler(recoverer, backoff);
    handler.addNotRetryableExceptions(InvalidPayloadException.class,
                                      DeserializationException.class); // lỗi vĩnh viễn: DLT ngay
    return handler;
}
~~~
~~~yaml
spring:
  kafka:
    consumer:
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
~~~

~~~text
offset: 40 ✓  41 ✗(retry 500ms,1s,2s…) → DLT  42 ✓  43 ✓
                 partition chỉ đứng ~5s, không đứng mãi
DLT header: kafka_dlt-original-topic/partition/offset, kafka_dlt-exception-fqcn, -message, -stacktrace
~~~

### DLT cần một "hợp đồng"
- Đặt tên và routing DLT nhất quán. Nếu giữ nguyên số partition như mặc định, DLT phải có **ít nhất** bằng số partition của topic gốc.
- Header gốc (topic, partition, offset, exception, timestamp) là bắt buộc để điều tra và replay.
- Serializer của DLT phải ghi được cả payload hỏng: khi lỗi deserialize, giá trị còn lại là byte thô, nên cấu hình template/serializer phù hợp (ví dụ ByteArraySerializer cho trường hợp này).
- DLT phải có **owner, alert và quy trình replay** có idempotency; đừng tự động replay liên tục, sẽ tạo vòng lặp lỗi.

### Ordering và offset
- Blocking retry giữ thứ tự nhưng các record sau cùng partition phải chờ, nên tổng backoff phải ngắn và nhỏ hơn hẳn {{max.poll.interval.ms}}.
- Retry topic bất đồng bộ ({{@RetryableTopic}}) cho throughput tốt hơn nhưng có thể đổi thứ tự theo key.
- Ack mode của container (mặc định BATCH) chỉ commit những record đã xử lý xong hoặc đã được recover.

### Lỗi hay gặp
1. **Không dùng ErrorHandlingDeserializer**. Triệu chứng: log lặp vô hạn lỗi deserialize ở cùng offset, listener không bao giờ được gọi. Cách tránh: bọc deserializer như cấu hình trên.
2. **Retry cả lỗi validation**. Triệu chứng: mỗi record xấu giữ partition hàng chục giây. Cách tránh: khai báo not-retryable.
3. **DLT không có partition đủ hoặc không tồn tại**. Triệu chứng: recover thất bại, record lặp lại mãi. Cách tránh: tạo DLT trước, đủ partition, kiểm tra quyền ghi.
4. **Không ai xem DLT**. Triệu chứng: hàng nghìn đơn lỗi nằm im nhiều tuần. Cách tránh: alert theo tốc độ vào DLT, có owner và runbook replay.

### Trả lời miệng 1 phút
"Tôi phân loại lỗi trước. Lỗi tạm thời như DB timeout thì DefaultErrorHandler retry vài lần với exponential backoff, tổng chỉ vài giây để không giữ partition lâu. Lỗi vĩnh viễn như payload sai hay deserialize hỏng thì khai báo not-retryable để DeadLetterPublishingRecoverer gửi thẳng sang DLT, kèm header topic, partition, offset và exception. Lỗi deserialize tôi bắt bằng ErrorHandlingDeserializer, nếu không consumer kẹt ngay ở poll. Offset chỉ được commit khi xử lý xong hoặc đã gửi DLT thành công, nên không mất record. Trade-off của blocking retry là partition đứng trong lúc retry, đổi lại giữ thứ tự. Tôi luôn có alert và owner cho DLT."

### Ví dụ đời thực
**Triệu chứng:** topic {{order.placed}} (12 partition, ~900 event/phút) có lag của partition 3 tăng liên tục lên 120.000 record trong 25 phút; các đơn thuộc partition 3 không được xử lý, dashboard báo "chậm cập nhật tồn kho" cho một nhóm khách hàng.

**Điều tra:** xem log consumer thấy lỗi {{DeserializationException}} lặp vô hạn tại cùng offset; {{records-consumed-rate}} của partition 3 gần 0 trong khi các partition khác bình thường. Kiểm tra payload tại offset lỗi (dùng {{kafka-console-consumer --offset}}) thấy producer mới gửi JSON thiếu field bắt buộc. Cấu hình không dùng {{ErrorHandlingDeserializer}} và không có {{DeadLetterPublishingRecoverer}}.

**Nguyên nhân gốc:** lỗi deserialize xảy ra ở bước poll; {{DefaultErrorHandler}} không bắt được vì exception ném trước khi listener chạy, nên consumer bị kẹt vòng lặp tại cùng offset (poison message) và chặn toàn bộ partition.

**Cách xử lý:** bọc bằng {{ErrorHandlingDeserializer}} và ủy quyền cho {{JsonDeserializer}}; cấu hình {{DefaultErrorHandler}} với {{ExponentialBackOff}} (tối đa 5 giây) và {{DeadLetterPublishingRecoverer}} gửi sang {{order.placed.DLT}} kèm header lỗi. Khai báo {{DeserializationException}} là not-retryable. Tạo DLT đủ 12 partition, thêm alert "DLT rate > 0" và quy trình replay có idempotency.

**Kết quả đo được:** poison message được chuyển sang DLT trong < 1 giây; lag partition 3 giảm về 0 sau 4 phút; 1 record lỗi được đội owner sửa và replay an toàn nhờ kiểm tra trùng, không ảnh hưởng các record khác.

> Senior tip: có dashboard riêng cho số lần retry, tốc độ vào DLT và tuổi của record cũ nhất chưa xử lý. DLT bằng 0 không có nghĩa là khỏe nếu consumer đang retry cùng một poison record hàng nghìn lần.`,
  follow: ['Retry topic khác blocking retry về thứ tự và lag ra sao?', 'Bạn replay DLT thế nào để không gửi lại payment đã thành công?'],
  tags: ['Spring Kafka', 'DefaultErrorHandler', 'DLT', 'retry'],
  refs: [{ type: 'doc', title: 'Spring for Apache Kafka reference', url: 'https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html' }]
},
{
  id: 'microservices-035', topic: 'microservices', level: 'senior',
  q: 'Consumer lag tăng liên tục sau khi traffic nhân ba. Bạn tìm bottleneck và áp dụng backpressure thế nào, kể cả khi đã tăng số consumer?',
  a: `**Tóm tắt:** lag là khoảng cách giữa **log end offset** (record mới nhất) và **offset consumer đã commit**. Thêm consumer chỉ giúp khi **còn partition để chia** và nút thắt nằm ở **chính consumer**; nếu nút thắt là DB/downstream, hot partition hay rebalance liên tục thì thêm consumer vô ích hoặc còn làm tệ hơn. Cách làm: đo tốc độ vào/ra, lag và **tuổi event** theo từng partition, tìm đúng nút thắt, rồi áp backpressure (giới hạn concurrency, pause/resume) thay vì mở worker vô hạn.

### Hiểu nhanh
Một siêu thị đông gấp ba, hàng chờ thanh toán dài ra. Mở thêm quầy (thêm consumer) chỉ có ích khi **còn chỗ đặt quầy** (partition) và **thu ngân là chỗ chậm**. Nếu chỗ chậm thật ra là **máy quẹt thẻ của ngân hàng** (DB/downstream), mở thêm quầy chỉ làm máy quẹt quá tải hơn. Nếu một khách mua 500 món (hot key) thì quầy của khách đó vẫn tắc dù có bao nhiêu quầy khác. Backpressure là khi máy quẹt báo bận, thu ngân **tạm ngưng mời khách mới** thay vì nhận hết vào rồi kẹt giữa chừng.

### Thuật ngữ
- **Log end offset (LEO)**: offset kế tiếp sẽ được ghi vào partition.
- **Consumer lag**: LEO trừ offset đã commit, tính theo từng partition.
- **Event age / lag time**: thời gian từ lúc event được ghi tới lúc được xử lý; gần với trải nghiệm người dùng hơn số offset.
- **Hot partition**: partition nhận nhiều traffic hơn hẳn do key bị lệch.
- **Backpressure**: cơ chế làm chậm phía nhận/gửi khi phía sau không theo kịp.
- **pause/resume**: API consumer tạm dừng lấy record từ partition nhưng vẫn poll để giữ membership.
- **Little's Law**: số việc đang xử lý = tốc độ đến × thời gian xử lý.
- **KEDA**: công cụ autoscale trên Kubernetes theo metric bên ngoài như Kafka lag.

### Chẩn đoán trước khi scale (từng bước)
1. **Số consumer so với partition**: consumer nhiều hơn partition thì phần dư ngồi không. Tăng partition giúp song song hơn nhưng đổi mapping key (ảnh hưởng thứ tự) và tăng tải broker.
2. **So tốc độ vào và ra**: records/s producer ghi so với records/s consumer xử lý. Ra < vào kéo dài thì lag tăng tuyến tính.
3. **Xem lag theo partition**: lag dồn vào 1–2 partition là **hot key**, không phải thiếu consumer.
4. **Xem thời gian xử lý mỗi record**: thời gian chờ connection pool DB, latency downstream, GC pause, số lần rebalance.
5. **Phân biệt burst và thiếu capacity**: lag tăng nhưng event age thấp có thể chỉ là đợt burst đang được bắt kịp; event age tăng mãi là vi phạm SLA.

~~~text
vào: 3.000 rec/s   ra: 2.000 rec/s   → lag tăng 1.000 rec/s ≈ 3,6 triệu/giờ
consumer: 12 pod / 12 partition (không thêm được)
mỗi record: 6ms, trong đó 5ms là write DB (pool 10 connection, DB đã chạm trần ~2.000 write/s)
=> nút thắt là DB, KHÔNG phải số consumer
~~~

### Xử lý theo nút thắt
- **Consumer CPU-bound**: tối ưu code, tăng partition + consumer, hoặc xử lý song song theo key bên trong consumer.
- **Downstream/DB**: ghi theo batch (một INSERT nhiều dòng), giảm round-trip, tăng capacity DB; đặt concurrency theo connection pool và quota DB, không theo số record.
- **Hot key**: tách xử lý key nóng, hoặc chia key nhỏ hơn nếu nghiệp vụ chỉ cần thứ tự ở mức nhỏ hơn.
- **Rebalance liên tục**: static membership, cooperative sticky, giảm {{max.poll.records}}.

### Backpressure (từng bước)
1. Kafka là bộ đệm bền vững **trong giới hạn retention**, không vô hạn: lag lớn hơn retention nghĩa là mất dữ liệu.
2. Khi downstream cạn, consumer **pause** partition (Spring Kafka: pause container hoặc listener), vẫn tiếp tục poll để giữ heartbeat/membership, và **không commit** offset của phần chưa xử lý.
3. Giới hạn số việc đang chạy song song (semaphore/bulkhead) bằng capacity downstream: DB chịu tối đa ~2.000 write/s, mỗi write 5ms → 2.000 × 0,005 = 10 việc song song là đủ (Little's Law); mở thêm chỉ làm các write xếp hàng trong DB.
4. Nếu quá tải kéo dài: giảm tốc producer, bỏ bớt việc không quan trọng (shed load), hoặc tăng capacity downstream. Hàng đợi chỉ trì hoãn sự cố và tốn đĩa.

### Autoscaling an toàn
- Scale theo lag/event age cùng throughput (ví dụ KEDA Kafka scaler), nhưng **giới hạn số replica ≤ số partition** và theo capacity downstream.
- Có cooldown và số replica tối thiểu; scale lên/xuống quá nhanh gây rebalance liên tục, lag còn tăng thêm.
- Alert theo **event age** thường sát tác động người dùng hơn alert theo số offset.

### Lỗi hay gặp
1. **Thêm pod vượt số partition**. Triệu chứng: pod mới idle, lag không đổi. Cách tránh: giới hạn max replica bằng số partition.
2. **Scale consumer khi DB là nút thắt**. Triệu chứng: lag vẫn tăng, DB bắt đầu timeout, error tăng. Cách tránh: đo thời gian chờ pool/latency DB trước khi scale.
3. **Xử lý bất đồng bộ không giới hạn**. Triệu chứng: OOM vì hàng triệu task trong bộ nhớ, crash mất tiến độ. Cách tránh: giới hạn in-flight, pause khi đầy.
4. **Chỉ nhìn tổng lag**. Triệu chứng: bỏ sót một partition kẹt vì poison message. Cách tránh: lag và event age theo từng partition.

### Trả lời miệng 1 phút
"Lag là log end offset trừ offset đã commit, và thêm consumer chỉ có ích khi còn partition và nút thắt là consumer. Nên tôi đo trước: tốc độ vào so với ra, lag theo từng partition để tìm hot key, thời gian xử lý mỗi record tách ra chờ DB pool, downstream, GC, rebalance. Nếu DB là nút thắt, tôi ghi theo batch và giới hạn concurrency bằng capacity DB theo Little's Law. Backpressure thì pause partition khi downstream cạn, vẫn poll để giữ membership và không commit phần chưa xong. Autoscale theo lag với KEDA nhưng không vượt số partition và có cooldown. Tôi alert theo event age vì nó sát với người dùng hơn số offset."

### Ví dụ đời thực
**Triệu chứng:** chiến dịch flash sale làm traffic nhân 3 (từ ~800 lên ~2.300 event/giây, topic {{order.status}} 12 partition, 12 pod consumer). Lag tăng đều lên ~480.000 record trong 30 phút; tuổi event ({{consumer-lag-ms}} tương đương) vượt 8 phút, vi phạm SLO xử lý < 30 giây.

**Điều tra:** kiểm tra {{kafka-consumer-groups --describe}} thấy lag phân bố đều 12 partition (không phải hot key), số consumer = số partition nên thêm pod không giúp. Đo tốc độ ra chỉ ~2.000 rec/s. Trace cho mỗi record: 1 ms parse + 6 ms ghi DB = 7 ms, nhưng 5 ms là chờ {{HikariPool}} (pool 10 connection) vì DB đã chạm ~2.000 write/s. CPU pod ~25%, không GC dài, rebalance = 0.

**Nguyên nhân gốc:** nút thắt là throughput ghi DB, không phải số consumer hay CPU. Scale thêm consumer (nếu có thêm partition) chỉ làm connection pool/DB quá tải hơn.

**Cách xử lý:** gom ghi theo batch (INSERT nhiều dòng, 100 record/lần) giảm round-trip; giới hạn concurrency xử lý theo capacity DB (Little's Law: 2.000 write/s × 0,005 s ≈ 10 việc song song). Khi hàng đợi nội bộ đầy thì {{pause()}} partition, vẫn poll giữ membership, không commit phần chưa xong. KEDA autoscale theo lag nhưng {{maxReplicaCount = 12}} (= số partition) và có cooldown 5 phút.

**Kết quả đo được:** tốc độ ra tăng lên ~2.800 rec/s; lag giảm về < 5.000 record sau 18 phút; p99 event age về 12 giây; lỗi DB timeout giảm từ 3,2% xuống 0%.

> Senior tip: đặt SLO kiểu "99% event được xử lý trong 30 giây" rồi alert theo event age. Một triệu lag trên topic phân tích có thể vô hại; vài nghìn event thanh toán đã già 10 phút thì không.`,
  follow: ['Lag thấp nhưng event age cao có thể do đâu?', 'Làm sao phối hợp autoscaling consumer với giới hạn connection pool DB?'],
  tags: ['Kafka', 'consumer lag', 'backpressure', 'autoscaling']
},
{
  id: 'microservices-036', topic: 'microservices', level: 'senior',
  q: 'Nhiều team cùng đọc event Avro và cần deploy producer/consumer độc lập. Bạn chọn Schema Registry compatibility và quy trình thay đổi schema thế nào?',
  a: `**Tóm tắt:** Schema Registry lưu các phiên bản schema của mỗi subject và **kiểm tra compatibility** khi có schema mới, nên producer/consumer của nhiều team deploy độc lập được mà không làm vỡ nhau. Khi consumer phải đọc được dữ liệu cũ (replay), **BACKWARD** (hoặc tốt hơn là **BACKWARD_TRANSITIVE**) là lựa chọn thực dụng; nếu không kiểm soát được thứ tự deploy thì dùng **FULL_TRANSITIVE**. Mọi thay đổi theo quy tắc: field mới có default, không đổi nghĩa, xóa field qua giai đoạn deprecate, và rollout có thứ tự.

### Hiểu nhanh
Nhiều phòng ban cùng dùng một **mẫu đơn** (schema). Phòng phát hành mẫu muốn thêm ô "số điện thoại phụ". Nếu ô mới có **giá trị mặc định** ("để trống nếu không có"), người đọc dùng mẫu mới vẫn đọc được các đơn cũ chưa có ô đó, còn người đọc mẫu cũ thì bỏ qua ô lạ. Schema Registry là **phòng kiểm duyệt mẫu đơn**: trước khi ban hành mẫu mới, nó kiểm tra "mẫu mới có làm khó người đang dùng mẫu cũ không", không đạt thì từ chối. Nhưng nó không kiểm được **ý nghĩa**: đổi ô "số tiền (USD)" thành "số tiền (cent)" vẫn là con số, kiểm duyệt không phát hiện được.

### Thuật ngữ
- **Subject**: tên nhóm các phiên bản schema, thường là {{<topic>-value}} theo chiến lược mặc định.
- **Writer schema / reader schema**: schema lúc producer ghi / schema consumer dùng để đọc; Avro đối chiếu hai schema này khi deserialize.
- **Schema ID**: số định danh schema trong registry, được ghi vào đầu mỗi message (magic byte + 4 byte ID).
- **BACKWARD**: schema mới đọc được dữ liệu ghi bằng schema trước đó (nâng consumer trước).
- **FORWARD**: schema cũ đọc được dữ liệu ghi bằng schema mới (nâng producer trước).
- **FULL**: thỏa cả hai chiều.
- **TRANSITIVE**: kiểm tra với **mọi** phiên bản trước đó, không chỉ bản liền trước.
- **Alias (Avro)**: tên cũ khai báo trong reader schema để đọc được field đã đổi tên.

### Cơ chế bên trong (từng bước)
1. **Producer** serialize bằng Avro, hỏi registry ID của schema (cache lại), ghi {{[magic byte][schema ID][dữ liệu nhị phân]}}. Vì sao không gửi cả schema: tiết kiệm băng thông, mỗi message chỉ thêm 5 byte.
2. **Đăng ký schema mới**: registry so với các phiên bản cũ theo mode compatibility; không đạt thì trả lỗi 409, schema không được đăng ký.
3. **Consumer** đọc schema ID, tải writer schema từ registry (cache), rồi Avro **resolve** sang reader schema của consumer: field có trong reader mà không có trong writer thì lấy default; field có trong writer mà reader không biết thì bỏ qua.

~~~text
writer v1: {id, amount}            reader v2: {id, amount, currency="VND"}
record cũ (v1) ──► reader v2: currency thiếu → dùng default "VND"   (BACKWARD ok)
record mới (v2) ──► reader v1: currency lạ → bỏ qua                  (FORWARD ok)
=> thêm field có default thỏa FULL
~~~

### Quy tắc thay đổi
- **Thêm field**: luôn có default (với Avro, field nullable là union {{["null", "string"]}} với default null).
- **Xóa field**: chỉ xóa field có default; trước đó đánh dấu deprecated, chờ mọi consumer ngừng dùng.
- **Đổi tên**: dùng alias trong reader schema hoặc thêm field mới + migrate, không đổi tên trực tiếp.
- **Đổi kiểu**: chỉ các phép "nâng kiểu" Avro cho phép (int → long, float → double, string ↔ bytes); còn lại coi là breaking.
- **Không tái sử dụng tên field cho nghĩa khác**, không đổi đơn vị âm thầm.

### Trình tự rollout an toàn (BACKWARD)
1. Thêm field optional có default, đăng ký schema (thường qua CI).
2. Deploy **consumer** đọc được cả dạng cũ và mới.
3. Deploy **producer** bắt đầu ghi field mới.
4. Chờ hết cửa sổ retention/replay và xác minh mọi consumer đã cập nhật.
5. Chỉ sau đó mới bỏ field cũ bằng một phiên bản schema tiếp theo.

### Chọn mode cho nhiều team
| Tình huống | Mode |
|---|---|
| Consumer luôn nâng trước, cần replay dữ liệu cũ nhiều phiên bản | BACKWARD_TRANSITIVE |
| Producer nâng trước, consumer chậm cập nhật | FORWARD_TRANSITIVE |
| Nhiều team, không kiểm soát được thứ tự deploy | FULL_TRANSITIVE |

### Lỗi hay gặp
1. **Dùng BACKWARD (không transitive) rồi replay topic lâu ngày**. Triệu chứng: v3 tương thích v2, v2 tương thích v1, nhưng v3 không đọc được v1. Cách tránh: dùng mode transitive.
2. **Đổi nghĩa nhưng giữ kiểu**. Triệu chứng: registry cho qua, số tiền sai 100 lần. Cách tránh: đổi nghĩa = field mới; review ngữ nghĩa và contract test với payload mẫu cũ/mới.
3. **Bật auto-register ở production**. Triệu chứng: schema lạ được đăng ký từ một bản build lỗi. Cách tránh: CI đăng ký, production tắt auto-register.
4. **Đặt NONE để pipeline xanh**. Triệu chứng: consumer của team khác vỡ sau deploy. Cách tránh: đổi mode phải qua review, có hạn bật lại.

### Trả lời miệng 1 phút
"Schema Registry lưu các phiên bản schema và kiểm tra compatibility khi đăng ký, mỗi message chỉ mang schema ID, consumer dùng writer schema và reader schema để resolve. Với nhiều team và cần replay, tôi chọn BACKWARD_TRANSITIVE, hoặc FULL_TRANSITIVE nếu không kiểm soát được thứ tự deploy. Quy tắc của tôi: field mới luôn có default, xóa field phải qua deprecate, đổi tên dùng alias, không đổi nghĩa âm thầm. Rollout theo thứ tự: đăng ký schema qua CI, deploy consumer trước, producer sau, chờ hết retention mới dọn field cũ. Trade-off là thêm quy trình, nhưng registry không kiểm được ngữ nghĩa nên tôi vẫn cần review và contract test."

### Ví dụ đời thực
**Triệu chứng:** team Payment xoá field {{channel}} (không có default, consumer cũ vẫn cần) và thêm field {{discountCode}} vào event Avro {{payment.captured}}, rồi deploy producer trước. Consumer của team Loyalty (deploy độc lập, dùng schema cũ) bắt đầu lỗi deserialize ~4% message mới; đồng thời một consumer phân tích replay 30 ngày dữ liệu cũng lỗi vì gặp schema cũ hơn.

**Điều tra:** kiểm tra Schema Registry subject {{payment.captured-value}} thấy mode đang là {{BACKWARD}} (không transitive) và không có bước CI chặn đăng ký. Log consumer báo {{org.apache.avro.AvroTypeException}} khi resolve field. Trong một PR khác, ai đó đổi {{amount}} từ USD sang cent nhưng vẫn giữ kiểu {{long}}; registry chấp nhận (cùng kiểu), nhưng số tiền hiển thị sai 100 lần ở dashboard.

**Nguyên nhân gốc:** xoá field mà consumer cũ còn cần (BACKWARD cho phép xoá vì chỉ kiểm tra schema mới đọc được data cũ) rồi deploy producer trước consumer; field mới lại thiếu default; mode không transitive làm replay phiên bản xa hơn thất bại; registry không kiểm tra được thay đổi **ngữ nghĩa** (đơn vị).

**Cách xử lý:** chuyển subject sang {{FULL_TRANSITIVE}}; thêm field mới luôn có default ({{"discountCode": ["null","string"], "default": null}}). CI chạy kiểm tra compatibility (gọi REST {{/compatibility}}) trước merge, tắt auto-register ở production. Rollout: đăng ký schema qua CI → deploy consumer → deploy producer. Với thay đổi đơn vị, tạo field mới {{amountCents}} và deprecate {{amount}} thay vì đổi nghĩa.

**Kết quả đo được:** sau 6 tuần, 0 lỗi deserialize liên quan schema; 2 PR bị CI chặn do vi phạm compatibility; replay 30 ngày chạy thành công với consumer schema mới nhất.

> Senior tip: quyền sở hữu schema phải gồm owner nghiệp vụ, chính sách breaking change và người liên hệ khi compatibility check thất bại. Registry không thay thế được review ngữ nghĩa hay danh sách consumer đang dùng topic.`,
  follow: ['Backward và full transitive khác nhau thế nào khi replay topic lâu ngày?', 'Đổi đơn vị một field nhưng giữ nguyên kiểu số có bị registry phát hiện không?'],
  tags: ['Kafka', 'Avro', 'Schema Registry', 'schema evolution'],
  refs: [{ type: 'doc', title: 'Confluent Schema Evolution', url: 'https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html' }]
},
{
  id: 'microservices-037', topic: 'microservices', level: 'lead',
  q: 'Ngân hàng đang có Kafka, RabbitMQ và IBM MQ. Bạn phân vai ba broker cho event stream, work queue và giao dịch legacy thay vì ép mọi workload lên một nền tảng thế nào?',
  a: `**Tóm tắt:** phân vai theo **ngữ nghĩa** chứ không theo độ "hot": **Kafka** cho event stream cần fan-out nhiều consumer và replay; **RabbitMQ** cho work queue/task cần ack từng message, routing linh hoạt, retry/dead-letter; **IBM MQ** giữ ở biên tích hợp với core banking/mainframe và đối tác vốn đã chuẩn hóa trên MQ, nơi có SLA, audit và hợp đồng hỗ trợ sẵn. Nối các thế giới bằng **bridge có kiểm soát** (connector + idempotency), đặt một broker mặc định cho workload mới và yêu cầu ADR cho mọi ngoại lệ.

### Hiểu nhanh
Một ngân hàng có ba loại "đường vận chuyển". **Kafka** như **đài phát thanh có lưu băng**: phát một lần, nhiều chi nhánh nghe, ai lỡ thì tua lại nghe. **RabbitMQ** như **bàn giao việc trong văn phòng**: mỗi phiếu việc giao cho đúng một người, làm xong ký nhận, làm hỏng thì chuyển sang khay xử lý lỗi. **IBM MQ** như **đường chuyển phát bảo đảm** đã ký hợp đồng nhiều năm với kho bạc (mainframe, core banking): chậm thay đổi nhưng đã được kiểm toán và mọi đối tác đều dùng. Ép tất cả lên một đường duy nhất thì hoặc mất khả năng nghe lại, hoặc phải đập bỏ hợp đồng đang chạy ổn.

### Thuật ngữ
- **Event stream**: chuỗi sự kiện được lưu lại theo thứ tự, nhiều bên đọc độc lập.
- **Work queue / competing consumers**: nhiều worker cùng lấy việc từ một queue, mỗi message chỉ một worker xử lý.
- **Exchange / routing key**: cơ chế định tuyến của RabbitMQ (direct, topic, fanout, headers).
- **Queue manager (IBM MQ)**: thành phần quản lý queue và kênh kết nối của IBM MQ.
- **JMS**: API chuẩn của Java cho messaging, IBM MQ hỗ trợ đầy đủ (Jakarta JMS).
- **Bridge / connector**: thành phần chuyển message giữa hai broker (ví dụ Kafka Connect MQ source/sink).
- **ADR (Architecture Decision Record)**: tài liệu ghi lại quyết định kiến trúc, lý do và hệ quả.
- **RPO / RTO**: lượng dữ liệu tối đa chấp nhận mất / thời gian tối đa để khôi phục.

### So sánh theo workload
| Nhu cầu | Kafka | RabbitMQ | IBM MQ |
|---|---|---|---|
| Replay, nhiều consumer độc lập | **mạnh**: log được giữ, mỗi group có offset riêng | queue thường ack là xóa; Streams (3.9+) có replay | không phải thế mạnh chính |
| Task queue, routing | làm được nhưng phải tự thiết kế (partition giới hạn số worker) | **mạnh**: exchange, competing consumers, DLX | làm tốt, đặc biệt trong môi trường JMS |
| Thứ tự | trong partition | theo queue, mất khi nhiều consumer/requeue | tùy cấu hình queue và consumer |
| Giao dịch với hệ thống legacy | qua connector | qua plugin/bridge | **thường đã là chuẩn**, hỗ trợ XA, giao tiếp mainframe |
| Throughput | rất cao | trung bình–cao | cao, tối ưu cho độ tin cậy từng message |

### Quyết định kiến trúc (từng bước)
1. **Liệt kê luồng** theo ngữ nghĩa: event cần nhiều người nghe/replay, việc cần đúng một người làm, giao dịch với hệ thống lõi. Vì sao: chọn broker theo hành vi cần có, không theo sở thích team.
2. **Gán vai**: domain event (TransactionPosted, CustomerUpdated) cần rebuild projection, phân tích, phát hiện gian lận → Kafka. Job ngắn (gửi OTP, sinh sao kê PDF) cần ack, retry, dead-letter → RabbitMQ. Giao tiếp core banking/mainframe, đối tác thanh toán đã dùng MQ → giữ IBM MQ ở biên.
3. **Thiết kế bridge** ở đúng một chỗ: ví dụ Kafka Connect MQ source đưa giao dịch từ MQ vào Kafka để fan-out; mỗi message mang **id nghiệp vụ** để phía nhận khử trùng.
4. **Chuẩn hóa vận hành**: mỗi nền tảng có owner, monitoring, runbook, DR (RPO/RTO) rõ ràng.

~~~text
Core banking ══IBM MQ══► [MQ source connector] ──► Kafka: txn.posted ──► fraud, analytics, notify
                                                          │ (replay để rebuild)
App ──► RabbitMQ: statement.jobs ──► PDF workers (ack, retry, DLX)
Mỗi message mang txnId duy nhất → consumer khử trùng khi bridge gửi lặp
~~~

### Ngân hàng: kiểm soát là ưu tiên
- Xác định phân loại dữ liệu, mã hóa (TLS khi truyền, mã hóa khi lưu), audit trail, retention, quyền replay, cách xử lý poison message.
- **Broker không phải sổ cái**: nghiệp vụ cần đối soát, số dư, audit bất biến thì nguồn sự thật là hệ thống ledger/DB, broker chỉ vận chuyển.
- Mỗi bridge thêm rủi ro trùng lặp, đảo thứ tự, đứt trace và tranh chấp quyền sở hữu; chỉ thêm khi có lý do.

### Lỗi hay gặp
1. **Ba broker cho cùng một luồng**. Triệu chứng: một giao dịch đi qua MQ → Rabbit → Kafka, lỗi không rõ ở đâu, trùng lặp. Cách tránh: mỗi luồng một broker chính, bridge chỉ ở biên.
2. **Bridge không idempotent**. Triệu chứng: connector restart, gửi lại, một giao dịch được ghi hai lần. Cách tránh: id nghiệp vụ + khử trùng ở consumer.
3. **Dùng Kafka làm work queue cho job dài**. Triệu chứng: một job chậm chặn các job sau trong partition. Cách tránh: job queue để RabbitMQ.
4. **Mỗi team tự chọn broker mới**. Triệu chứng: chi phí on-call và kỹ năng phân mảnh. Cách tránh: broker mặc định + ADR cho ngoại lệ.

### Trả lời miệng 1 phút
"Tôi phân vai theo ngữ nghĩa. Kafka cho domain event cần nhiều consumer và replay, như giao dịch đã hạch toán đi tới chống gian lận và phân tích. RabbitMQ cho work queue cần ack từng message, retry và dead-letter, như sinh sao kê hay gửi OTP. IBM MQ giữ ở biên với core banking và đối tác vì đã có SLA, audit và hợp đồng hỗ trợ. Giữa các thế giới tôi đặt một bridge duy nhất, ví dụ Kafka Connect MQ source, và mọi message mang id nghiệp vụ để khử trùng. Trade-off là vận hành nhiều nền tảng, nên tôi đặt một broker mặc định cho workload mới, ngoại lệ phải có ADR. Và broker không bao giờ là sổ cái."


### Ví dụ đời thực

Sự cố: sau khi một team mới đẩy việc gửi mã OTP vào cùng topic Kafka với event thanh toán, chỉ số consumer lag của nhóm OTP tăng từ 0 lên hơn 10.000 thông điệp trong 15 phút, và khách nhận mã OTP chậm hơn 5 giây so với bình thường.

Điều tra: tra metric consumer group của Kafka, thấy một partition gộp cả mã OTP và event thanh toán nặng bị chậm — một thông điệp xử lý lâu chặn cả hàng đợi phía sau trong partition. Lúc này team dùng Kafka như hàng đợi công việc, thiếu ack từng message và retry như RabbitMQ.

Nguyên nhân gốc: vi phạm nguyên tắc phân vai theo ngữ nghĩa. Kafka giữ thứ tự trong partition và phù hợp event stream cần nhiều consumer lắng nghe và replay, không phải công việc từng message cần "lấy một lần, xử lý xong rồi ký nhận".

Xử lý: chuyển hàng đợi gửi OTP sang RabbitMQ với competing consumers, ack từng message, retry và dead-letter exchange; Kafka chỉ giữ event stream thanh toán cần nhiều consumer và replay, ví dụ rebuild projection. Mỗi thông điệp giữ id nghiệp vụ để bridge không tạo giao dịch trùng.

Kết quả: lag gửi OTP về 0, thời gian gửi mã giảm từ trên 5 giây xuống dưới 1 giây, và hệ thống vẫn có thể replay Kafka để xây dựng lại dữ liệu phân tích khi cần.

> Senior tip: chọn một broker mặc định cho workload mới; ngoại lệ cần ADR nêu owner và chi phí trực on-call. Số nền tảng có thể tồn tại vì legacy, nhưng đừng để mỗi team tự chọn broker thứ tư.`,
  follow: ['Bạn thiết kế bridge Kafka–IBM MQ sao cho duplicate không tạo hai giao dịch?', 'Khi nào replay Kafka không đủ để đáp ứng audit tài chính?'],
  tags: ['Kafka', 'RabbitMQ', 'IBM MQ', 'banking', 'messaging']
},
{
  id: 'microservices-038', topic: 'microservices', level: 'senior',
  q: 'API ghi order vào database rồi cần phát Kafka event. Bạn thiết kế outbox với Debezium thế nào để không mất event, giữ thứ tự theo aggregate và vận hành được khi connector restart?',
  a: `**Tóm tắt:** ghi business row và outbox row trong **cùng một DB transaction**; Debezium (chạy trên Kafka Connect) đọc **transaction log** (WAL của PostgreSQL, binlog của MySQL) rồi publish ra Kafka với **key = aggregate ID** để giữ thứ tự theo aggregate. Đây là "ghi nguyên tử ở DB + giao at-least-once qua CDC": connector restart từ checkpoint có thể gửi lặp, nên consumer bắt buộc idempotent theo event ID. Vận hành phải theo dõi connector, replication slot/WAL và tuổi event chưa publish.

### Hiểu nhanh
Mỗi khi thu ngân chốt một đơn, họ ghi đơn và ghi luôn dòng "cần thông báo kho" **trên cùng một trang sổ** (một transaction). Debezium là **người chép sổ** ngồi đọc bản sao nhật ký của sổ (WAL) theo đúng thứ tự trang, đánh dấu "đã chép tới dòng nào" (offset). Nếu người chép bị gọi đi giữa chừng rồi quay lại, họ đọc tiếp từ dấu đánh gần nhất, có thể chép lại vài dòng (trùng) nhưng **không bao giờ bỏ sót**. Bên kho nhận thông báo kiểm tra mã đơn để không chuẩn bị hàng hai lần.

### Thuật ngữ
- **Outbox table**: bảng chứa event chờ gửi, nằm cùng DB với dữ liệu nghiệp vụ.
- **CDC (Change Data Capture)**: bắt thay đổi bằng cách đọc log của DB.
- **WAL / binlog**: nhật ký ghi trước của PostgreSQL / nhật ký nhị phân của MySQL.
- **Replication slot**: "dấu trang" của PostgreSQL; DB giữ lại WAL từ vị trí slot chưa đọc.
- **Kafka Connect**: framework chạy connector (source/sink), lưu offset của connector vào topic nội bộ.
- **SMT (Single Message Transform)**: bước biến đổi record trong Kafka Connect; Outbox Event Router là một SMT của Debezium.
- **Aggregate ID**: id của thực thể nghiệp vụ (orderId), dùng làm Kafka key để giữ thứ tự.
- **Optimistic locking (version)**: cột version để hai transaction không ghi đè nhau trên cùng aggregate.

### Luồng dữ liệu (từng bước)
1. **API ghi đơn**: trong một transaction, insert/update bảng {{orders}} và insert một dòng {{outbox}}. Vì sao: cả hai cùng commit hoặc cùng rollback, không còn dual write.
2. **DB commit** ghi thay đổi vào WAL theo thứ tự commit.
3. **Debezium đọc WAL** qua replication slot (PostgreSQL, plugin pgoutput) từ vị trí đã checkpoint.
4. **Outbox Event Router** biến dòng outbox thành Kafka record: chọn topic theo aggregate type, key = aggregate ID, payload từ cột payload, có thể đưa event id/type vào header.
5. **Kafka Connect lưu offset** của connector sau khi Kafka xác nhận đã ghi. Vì sao gửi trước, lưu offset sau: crash ở giữa thì gửi lặp, không mất.
6. **Consumer khử trùng** theo event ID trong cùng transaction với business write.

~~~text
Spring @Transactional ─► orders + outbox ─commit─► WAL
                                                    │ replication slot
                                    Debezium (Kafka Connect) + Outbox Event Router
                                                    │ key = orderId
                                         topic order.events ─► consumer (dedup eventId)
~~~
Bảng outbox thường có: {{id}} (event ID, UUID), {{aggregatetype}}, {{aggregateid}}, {{type}}, {{payload}}, thời điểm tạo, version schema. Pin phiên bản connector và kiểm tra mapping topic/key/header bằng integration test (Testcontainers).

### Restart, trùng lặp và thứ tự
- **Restart**: connector tiếp tục từ offset đã lưu; khoảng giữa "đã gửi" và "đã lưu offset" sẽ bị gửi lại. Consumer dedup bằng event ID hoặc update idempotent.
- **Dọn outbox**: với CDC, có thể **xóa dòng outbox ngay trong cùng transaction** sau khi insert (Debezium vẫn thấy sự kiện INSERT trong WAL, Event Router bỏ qua sự kiện DELETE), hoặc dọn theo lịch với retention phù hợp. Đừng dọn kiểu khiến CDC chưa kịp đọc mà dữ liệu đã mất khỏi log.
- **Thứ tự theo aggregate** đến từ thứ tự commit trong WAL + cùng key/partition. Nhiều transaction cùng sửa một aggregate thì **khóa/version trong DB** quyết định thứ tự commit; đừng dựa vào timestamp của app.

### Kiểm soát trên production
- Theo dõi trạng thái task của connector, độ trễ nguồn (source lag), kích thước WAL bị giữ bởi slot, lỗi publish, tốc độ tăng của bảng outbox.
- Slot bị bỏ rơi lâu làm WAL phình tới đầy đĩa: đặt alert và giới hạn {{max_slot_wal_keep_size}}, có runbook khi connector ngừng.
- Payload có version schema; không đưa dữ liệu nhạy cảm không cần thiết vào outbox.
- Diễn tập trên staging: restart connector, test trùng lặp, khôi phục offset; xác nhận DB giữ log đủ lâu cho thời gian khôi phục dự kiến.

### Lỗi hay gặp
1. **Consumer không idempotent**. Triệu chứng: sau mỗi lần connector restart có đơn được xử lý hai lần. Cách tránh: bảng processed_event hoặc upsert theo natural key.
2. **Key không phải aggregate ID**. Triệu chứng: OrderCancelled tới trước OrderCreated ở consumer. Cách tránh: Event Router lấy key từ aggregateid.
3. **Connector chết cả cuối tuần không ai biết**. Triệu chứng: WAL phình, đĩa DB đầy, cả hệ thống ghi lỗi. Cách tránh: alert theo trạng thái task và WAL giữ lại.
4. **Thêm cột vào outbox mà không cập nhật cấu hình router**. Triệu chứng: header/field mới không xuất hiện ở Kafka. Cách tránh: integration test kiểm mapping sau mỗi thay đổi.

### Trả lời miệng 1 phút
"Tôi ghi đơn hàng và dòng outbox trong cùng một transaction, nên không còn dual write. Debezium đọc WAL qua replication slot, Outbox Event Router đưa event ra topic với key là orderId để giữ thứ tự theo đơn, và Kafka Connect chỉ lưu offset sau khi Kafka xác nhận. Vì vậy khi connector restart thì có thể gửi lặp nhưng không mất, và consumer khử trùng theo event ID trong cùng transaction với business write. Thứ tự giữa các transaction của cùng một đơn do khóa hoặc version trong DB quyết định. Về vận hành, tôi alert theo trạng thái connector, WAL bị slot giữ lại và tuổi event chưa publish, và có runbook khi connector dừng."


### Ví dụ đời thực

Sự cố: sau khi nâng cấp Kafka Connect và restart connector Debezium, hệ thống gửi email xác nhận đơn hàng cho cùng một khách hàng hai lần, cách nhau 90 giây.

Điều tra: tra log consumer, thấy hai record cùng mã sự kiện {{evt-7731}}; kiểm tra trạng thái task của connector qua Kafka Connect REST, chạy bình thường nhưng source lag vẫn lớn; xem replication slot PostgreSQL, thấy slot giữ WAL khoảng 3 GB vì connector đã ngừng vài giờ.

Nguyên nhân gốc: connector gửi record lên Kafka trước, mới lưu offset sau. Khi restart, khoảng thời gian này bị gửi lại; lại chưa có khử trùng theo event ID ở consumer nên đơn hàng được xử lý hai lần.

Xử lý: thêm bảng {{processed_event(event_id PK)}}, insert mã sự kiện trong cùng transaction với ghi đơn, consumer kiểm tra mã trước khi xử lý. Cấu hình cảnh báo khi source lag quá 5 phút hoặc WAL bị slot giữ quá 2 GB.

Kết quả: số đơn bị xử lý trùng từ khoảng 3-5 lần mỗi tuần về 0; trong 2 tuần sau restart connector không còn email trùng.

> Senior tip: đặt ngưỡng cảnh báo cho tuổi event chưa publish và dung lượng WAL bị giữ. "DB commit thành công" mới là nửa SLA; event tới Kafka trong bao lâu mới là điều consumer và khách hàng cảm nhận.`,
  follow: ['Replication slot Debezium bị giữ lâu gây tác động gì đến PostgreSQL?', 'Bạn dọn outbox table mà không xóa event chưa publish bằng cách nào?'],
  tags: ['outbox', 'Debezium', 'CDC', 'Kafka', 'ordering'],
  refs: [{ type: 'doc', title: 'Debezium Outbox Event Router', url: 'https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html' }]
}
,
{
  id: 'microservices-039',
  topic: 'microservices',
  level: 'senior',
  q: 'Bạn vận hành SaaS đa tenant. So sánh schema-per-tenant, shared-schema + tenant_id và PostgreSQL RLS: chọn theo quy mô, chi phí, compliance thế nào? Pitfall câu query quên filter tenant gây leak xuyên tenant; phát hiện qua audit query log + index composite (tenant_id, ...); migration schema-per-tenant không chạy được lần lượt (N tenant x M migration) thì xử lý thế nào?',
  a: `**Tóm tắt:** không có mô hình đúng cho mọi trường hợp: **schema-per-tenant** cô lập mạnh, dễ chứng minh compliance nhưng đắt và migration N × M; **shared-schema + tenant_id** rẻ, scale tới hàng nghìn tenant nhưng phụ thuộc kỷ luật query; **PostgreSQL RLS** là lớp an toàn ở DB đặt trên shared-schema, chặn cả câu query quên filter. Chọn theo số tenant, quy mô từng tenant, yêu cầu compliance và ngân sách vận hành. Rò rỉ xuyên tenant là sự cố P0, nên cần nhiều lớp: filter ở ORM, RLS, index bắt đầu bằng tenant_id, audit log và test tự động.

### Hiểu nhanh
**Schema-per-tenant** như cho mỗi công ty thuê **một căn hộ riêng**: riêng tư tuyệt đối, nhưng sửa ống nước phải đi từng căn. **Shared-schema** như **một văn phòng chung, mỗi tủ hồ sơ dán tên công ty**: rẻ, sửa một lần là xong, nhưng nhân viên lấy nhầm tủ là lộ hồ sơ công ty khác. **RLS** như **khóa vân tay trên từng ngăn tủ**: dù nhân viên quên kiểm tra tên, ngăn không phải của công ty mình sẽ không mở ra.

### Thuật ngữ
- **Multi-tenant SaaS**: một hệ thống phục vụ nhiều khách hàng (tenant), dữ liệu phải tách biệt.
- **Schema-per-tenant / DB-per-tenant**: mỗi tenant một schema (hoặc database) riêng.
- **Shared-schema + tenant_id**: mọi tenant chung bảng, phân biệt bằng cột tenant_id.
- **RLS (Row-Level Security)**: tính năng PostgreSQL gắn policy lọc dòng vào bảng, áp cho mọi câu query.
- **current_setting / SET LOCAL**: đọc / đặt biến cấu hình của session; SET LOCAL chỉ sống trong transaction hiện tại.
- **pgaudit**: extension ghi audit log các câu lệnh SQL trong PostgreSQL.
- **Hibernate @TenantId**: annotation Hibernate 6 tự thêm điều kiện tenant cho entity (discriminator multi-tenancy).
- **Noisy neighbor**: tenant lớn dùng nhiều tài nguyên làm chậm tenant khác.

### Ba mô hình
| Tiêu chí | Schema-per-tenant | Shared-schema + tenant_id | Shared-schema + RLS |
|---|---|---|---|
| Cô lập | cao (schema/DB riêng) | logic (cột tenant_id) | logic + policy ở DB |
| Chi phí hạ tầng | cao (N bộ bảng, nhiều connection) | thấp | thấp–trung bình |
| Migration | N × M (đau) | 1 lần | 1 lần + policy |
| Compliance (SOC 2, HIPAA) | dễ chứng minh | phải chứng minh bằng audit query | policy ở DB, dễ chứng minh hơn |
| Onboard tenant mới | tạo schema + chạy migration | insert một dòng | insert một dòng |
| Xóa tenant | drop schema | delete theo tenant_id (nặng) | như shared |

### Cách chọn
1. **Dưới khoảng 50 tenant, khách enterprise lớn, yêu cầu compliance cao**: schema-per-tenant (hoặc DB-per-tenant): backup/restore từng tenant, xóa tenant = drop schema, dễ đáp ứng "quyền được lãng quên".
2. **Hàng nghìn tenant nhỏ, tự đăng ký (SMB)**: shared-schema + tenant_id: một bảng, một pipeline migration, chi phí thấp.
3. **Muốn shared-schema nhưng an toàn hơn**: bật RLS. Có thể **kết hợp**: tenant thường ở shared, tenant enterprise được tách riêng (tiering).

### RLS hoạt động thế nào (từng bước)
1. Bật RLS và tạo policy trên bảng.
2. Mỗi transaction, app đặt tenant hiện tại bằng {{SET LOCAL app.tenant_id = '...'}} (hoặc {{set_config('app.tenant_id', ?, true)}}). Vì sao LOCAL: với connection pool, SET thường sống theo session và sẽ "rò" sang request sau.
3. Mọi SELECT/UPDATE/DELETE trên bảng tự động được DB thêm điều kiện của policy.
4. App phải kết nối bằng **role không phải owner** của bảng (hoặc bật FORCE), vì owner và superuser mặc định bỏ qua RLS.

~~~sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;          -- áp cả cho owner
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
-- query quên filter: SELECT * FROM orders WHERE status = 'PENDING'
-- => DB vẫn chỉ trả đơn của tenant hiện tại
~~~

### Rò rỉ xuyên tenant: các đường thường gặp
- Query {{SELECT * FROM orders WHERE status = 'PENDING'}} quên {{AND tenant_id = ?}} trả đơn của tenant khác: lỗ hổng số 1 của SaaS.
- JOIN nhiều bảng mà chỉ lọc tenant ở một bảng.
- **Cache key thiếu tenant**: key {{order:123}} dùng chung, tenant B đọc cache của tenant A.
- **Job nền/async**: tenant context lưu ở ThreadLocal bị mất khi chuyển thread, query chạy với tenant mặc định.

### Phát hiện và phòng ngừa
- Audit log PostgreSQL ({{pgaudit}} hoặc {{log_statement}} trên môi trường test) + script trong CI tìm query trên bảng tenant-scoped không có tenant_id.
- **Index composite bắt đầu bằng tenant_id**: {{CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status)}}: vừa nhanh, vừa là "máy dò": query thiếu tenant_id thường thành full scan và lộ ra trên dashboard query chậm.
- ORM: Hibernate 6 {{@TenantId}} hoặc {{@Filter}} bật cho mọi session; native query vẫn phải tự kiểm.
- **Test tự động**: đăng nhập tenant A, gọi mọi endpoint, assert không thấy dữ liệu tenant B.

### Migration schema-per-tenant: bài toán N × M
~~~text
500 tenant × 50 migration = 25.000 lần chạy; chạy tuần tự mất hàng giờ,
một tenant lỗi làm kẹt cả pipeline
~~~
1. **Theo dõi schema_version từng tenant** trong bảng tenant; chạy migration song song theo lô, tenant lỗi được đánh dấu để xử lý riêng, không chặn tenant khác.
2. **Code tương thích nhiều version** (expand–contract), để app chạy được khi các tenant đang ở version khác nhau.
3. **Migration online**: {{CREATE INDEX CONCURRENTLY}}; {{ADD COLUMN ... DEFAULT}} hằng số là thao tác tức thì từ PostgreSQL 11; tránh lock dài.
4. **Tiering**: tenant enterprise chạy riêng trong cửa sổ bảo trì đã thỏa thuận; tenant nhỏ chạy theo lô bằng job. Tenant mới luôn tạo ở version mới nhất.

### Lỗi hay gặp
1. **App kết nối bằng owner của bảng**. Triệu chứng: bật RLS rồi mà vẫn thấy dữ liệu mọi tenant. Cách tránh: role riêng cho app hoặc FORCE ROW LEVEL SECURITY.
2. **SET thay vì SET LOCAL với connection pool**. Triệu chứng: request sau dùng tenant của request trước. Cách tránh: SET LOCAL trong transaction, hoặc reset khi trả connection.
3. **Policy {{USING (true)}} hoặc fail-open khi thiếu tenant**. Triệu chứng: lộ toàn bộ dữ liệu khi biến chưa được đặt. Cách tránh: thiếu tenant thì query lỗi, không trả gì.
4. **Backup/restore một tenant trên shared-schema**. Triệu chứng: muốn khôi phục dữ liệu một khách thì phải restore cả DB. Cách tránh: chuẩn bị sẵn quy trình export/import theo tenant_id.

### Trả lời miệng 1 phút
"Tôi chọn theo quy mô và compliance. Vài chục khách enterprise yêu cầu cô lập mạnh thì schema hoặc DB riêng: dễ backup, xóa tenant, chứng minh compliance, nhưng migration là N nhân M nên tôi theo dõi schema_version từng tenant và chạy theo lô. Hàng nghìn tenant nhỏ thì shared-schema với tenant_id, và bật RLS của PostgreSQL để câu query quên filter vẫn bị chặn; app đặt tenant bằng SET LOCAL và kết nối bằng role không phải owner. Tôi thêm nhiều lớp: index bắt đầu bằng tenant_id, Hibernate TenantId, cache key có tenant, audit log, và test tự động tenant A không thấy dữ liệu tenant B cho mọi endpoint."


### Ví dụ đời thực

Sự cố: sau kỳ đăng ký tăng gấp 3 lần, hỗ trợ nhận khiếu nại: khách hàng B nhìn thấy đơn hàng của khách hàng A trong màn hình lịch sử của mình.

Điều tra: tra log PostgreSQL (pgaudit), thấy câu truy vấn {{SELECT * FROM orders WHERE status = 'PENDING'}} không có điều kiện tenant_id, thực hiện full scan trên bảng hàng triệu dòng và trộn dữ liệu nhiều khách.

Nguyên nhân gốc: một truy vấn thô của team mới quên mệnh đề {{AND tenant_id = ?}}; ORM không thêm điều kiện tenant cho câu SQL này.

Xử lý: bật RLS, đặt {{SET LOCAL app.tenant_id = ...}} trong mỗi transaction, kết nối bằng role không phải owner và dùng FORCE ROW LEVEL SECURITY; thêm chỉ số hợp nhất {{(tenant_id, status)}} để truy vấn thiếu tenant_id dễ bị phát hiện qua full scan chậm; viết test tự động "khách A không thấy dữ liệu khách B" cho mọi endpoint.

Kết quả: không còn sự cố trộn dữ liệu xuyên tenant trong 2 quý sau; truy vấn lọc theo tenant giảm từ 1,2 giây xuống dưới 50 ms.

> Senior tip: dù chọn mô hình nào, hãy có một test tự động "tenant A không thấy dữ liệu tenant B" chạy trong CI cho mọi endpoint. Một vụ lộ dữ liệu xuyên tenant là incident P0 và thường là lý do mất khách hàng lớn.`,
  follow: [
    'RLS PostgreSQL có overhead thế nào so với filter ở app, bạn đo bằng gì?',
    'Khi tenant bị xóa (right to be forgotten), schema-per-tenant vs shared-schema xử lý ra sao?',
    'Làm sao enforce tenant filter ở tầng ORM (Hibernate @Filter) mà không bị bypass?'
  ],
  tags: ['multi-tenancy', 'RLS', 'PostgreSQL', 'data isolation', 'schema-per-tenant']
},
{
  id: 'microservices-040',
  topic: 'microservices',
  level: 'mid',
  q: 'Tenant bị disable/suspended giữa lúc request đang xử lý. Vì sao phải trả 401/403 chứ không 500? Bạn hook ở filter/gateway, cache tenant config có TTL thế nào để tránh exception tràn ra thành 500?',
  a: `**Tóm tắt:** tenant bị suspend là **trạng thái nghiệp vụ được dự liệu trước**, không phải lỗi server, nên phải trả mã 4xx có nghĩa (thường **403**, kèm mã lỗi như TENANT_SUSPENDED), không để exception lan ra thành **500**. 500 làm client retry vô ích, làm nhiễu alert on-call và che mất lỗi thật. Kiểm tra trạng thái tenant ở **gateway hoặc filter** trước khi vào controller; cache cấu hình tenant với **TTL ngắn + invalidation bằng event**, và **fail-closed** khi không đọc được trạng thái.

### Hiểu nhanh
Một tòa nhà văn phòng cho nhiều công ty thuê. Công ty X bị **tạm khóa** vì nợ tiền thuê. Khi nhân viên X quẹt thẻ, bảo vệ phải nói rõ "**công ty anh đang bị tạm khóa, liên hệ ban quản lý**" (403), chứ không phải hô "**tòa nhà bị sự cố!**" (500) khiến mọi người hoảng loạn và gọi kỹ thuật. Bảo vệ đứng **ở cửa** (gateway/filter) chặn ngay từ đầu, không để người vào tới thang máy rồi mới phát hiện. Danh sách công ty bị khóa được bảo vệ **ghi nhớ** (cache) nhưng cập nhật ngay khi ban quản lý thông báo (event).

### Thuật ngữ
- **Tenant**: một khách hàng (công ty) dùng chung hệ thống SaaS.
- **401 Unauthorized**: chưa xác thực được (thiếu token, token sai/hết hạn).
- **403 Forbidden**: đã biết bạn là ai nhưng không được phép (tenant bị khóa, không đủ quyền).
- **OncePerRequestFilter**: filter của Spring chạy đúng một lần cho mỗi request, kể cả khi forward/include.
- **@RestControllerAdvice / ProblemDetail**: nơi tập trung ánh xạ exception sang HTTP response; ProblemDetail là định dạng lỗi chuẩn RFC 9457, Spring 6 hỗ trợ sẵn.
- **TTL**: thời gian sống của dữ liệu trong cache.
- **Fail-closed / fail-open**: khi không kiểm tra được thì chặn / cho qua.
- **Negative cache**: cache cả kết quả "không tồn tại" để tránh dội DB.

### Vì sao 4xx chứ không phải 500 (từng ý)
1. **Ngữ nghĩa**: 5xx nghĩa là "server có lỗi, thử lại có thể được"; client, SDK và gateway sẽ **retry**, làm tăng tải vô ích.
2. **Alert**: 5xx tính vào SLO lỗi; một tenant bị khóa có thể kích hoạt cảnh báo giả lúc nửa đêm.
3. **Trải nghiệm**: client nhận 403 + mã lỗi rõ ràng thì hiển thị đúng thông báo "tài khoản tạm khóa".
4. **Bảo mật**: stack trace của 500 có thể lộ thông tin nội bộ.

### Bảng ánh xạ trạng thái
| Tình huống | HTTP |
|---|---|
| Thiếu token / token sai, hết hạn | 401 |
| Tenant SUSPENDED/DISABLED, user không thuộc tenant | 403 (mã lỗi TENANT_SUSPENDED) |
| Tenant không tồn tại | 404 (hoặc 403 để tránh dò tìm tenant, tùy chính sách) |
| Không đọc được trạng thái tenant (dịch vụ cấu hình lỗi) | 503 (fail-closed, có Retry-After) |
| Bug, lỗi không mong đợi | 500 |

### Hook ở gateway/filter (từng bước)
1. **Xác định tenantId** từ subdomain, header hoặc claim trong JWT.
2. **Tra trạng thái** trong cache (Caffeine tại chỗ hoặc Redis), miss thì hỏi tenant service.
3. **Không ACTIVE thì trả 403 ngay**, không gọi downstream, không retry. Vì sao ở đây: chặn sớm thì không request nào kịp chạm vào nghiệp vụ.
4. **Lưu tenant vào context** của request, và **xóa context trong finally** để thread được tái sử dụng không mang tenant cũ.

~~~java
@Component
class TenantStatusFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String tenantId = resolver.resolve(req);
        TenantStatus st = cache.statusOf(tenantId);        // TTL ngắn, fail-closed nếu lỗi
        if (st != TenantStatus.ACTIVE) {
            res.setStatus(HttpStatus.FORBIDDEN.value());     // 403, không phải 500
            res.setContentType("application/problem+json");
            res.getWriter().write("{\"code\":\"TENANT_SUSPENDED\"}");
            return;                                          // không gọi tiếp chain
        }
        try { TenantContext.set(tenantId); chain.doFilter(req, res); }
        finally { TenantContext.clear(); }                   // tránh rò tenant sang request sau
    }
}
~~~

### Cache cấu hình tenant
- Trạng thái ít đổi nhưng cần phản ánh nhanh: TTL 30–60s, key {{tenant:status:<id>}}.
- Admin suspend → phát event {{tenant.suspended}} → các instance xóa cache ngay (TTL chỉ là lưới an toàn).
- **Fail-closed**: không load được trạng thái thì trả 503/403, **không** mặc định ACTIVE.
- Negative cache cho tenant không tồn tại, TTL ngắn, để tránh bị dò làm dội DB.

~~~text
t=0s   admin suspend ─► event ─► instance A, B xóa cache
t=0,2s request mới ─► cache miss ─► tenant service: SUSPENDED ─► 403
nếu mất event: muộn nhất sau TTL 60s cũng bị chặn
~~~

### Request đang chạy dở và tầng service
- Request đã vào controller trước khi suspend: thường cho chạy nốt (thời gian ngắn); thao tác nhạy cảm (thanh toán, xuất dữ liệu) nên kiểm tra lại trạng thái ngay trước khi thực hiện.
- Service phát hiện suspend giữa chừng thì ném {{TenantSuspendedException}}; {{@RestControllerAdvice}} ánh xạ sang 403 bằng ProblemDetail, log mức WARN chứ không ERROR.
- Metric: đếm 403 theo tenant để phát hiện lạm dụng hoặc suspend nhầm hàng loạt.

### Lỗi hay gặp
1. **Không có exception handler cho lỗi nghiệp vụ**. Triệu chứng: mọi exception thành 500, dashboard đỏ rực. Cách tránh: bảng ánh xạ exception → status trong @RestControllerAdvice.
2. **TTL cache quá dài, không có invalidation**. Triệu chứng: tenant bị khóa vẫn dùng được 10 phút. Cách tránh: TTL ngắn + event.
3. **ThreadLocal tenant không được clear**. Triệu chứng: request của tenant B chạy với context tenant A. Cách tránh: clear trong finally.
4. **Fail-open khi tenant service lỗi**. Triệu chứng: sự cố cấu hình biến thành lỗ hổng bảo mật. Cách tránh: fail-closed với 503.

### Trả lời miệng 1 phút
"Tenant bị suspend là trạng thái nghiệp vụ, không phải lỗi server, nên tôi trả 403 với mã lỗi rõ ràng. Nếu để thành 500, client sẽ retry vô ích, on-call bị báo động giả và SLO lỗi bị sai. Tôi chặn ngay ở gateway hoặc một OncePerRequestFilter: xác định tenant, tra trạng thái trong cache, không ACTIVE thì trả 403 không gọi downstream, và luôn clear tenant context trong finally. Cache có TTL ngắn kèm invalidation bằng event khi admin suspend, và fail-closed nếu không đọc được trạng thái. Phần còn lại tôi ánh xạ exception sang status trong RestControllerAdvice bằng ProblemDetail. Tôi có test suspend giữa chừng để chắc không có 500."


### Ví dụ đời thực

Sự cố: nhà hàng A nợ phí và bị admin khóa vào 14:00, nhưng nhân viên nhà hàng vẫn tạo đơn bình thường đến 14:45, chưa thấy thông báo bị khóa.

Điều tra: tra log truy cập, thấy API tạo đơn vẫn trả 200 trong 45 phút; kiểm tra cache trạng thái tenant, thấy giá trị đã lưu với TTL 10 phút và không có sự kiện xóa cache khi admin bấm nút khóa.

Nguyên nhân gốc: cache trạng thái tenant TTL quá dài và chỉ dựa vào TTL làm lưới an toàn; khi dịch vụ cấu hình bị lỗi, code lại mặc định cho qua (fail-open), nên nhà hàng bị khóa vẫn tiếp tục hoạt động.

Xử lý: giảm TTL xuống 30 giây, khi admin khóa phát sự kiện {{tenant.suspended}} để mọi instance xóa cache ngay; nếu không đọc được trạng thái thì trả 503 và chặn (fail-closed). Viết test: mock dịch vụ trả ACTIVE rồi SUSPENDED trong cùng một test, assert phản hồi là 403 và không có 500 nào.

Kết quả: thời gian từ khi khóa đến khi tất cả request bị chặn giảm từ 45 phút xuống dưới 30 giây; alert 5xx giả do tenant bị khóa biến mất.

> Senior tip: viết test "suspend tenant giữa request" bằng cách mock tenant service trả ACTIVE rồi SUSPENDED trong cùng test, assert response là 403 và không có 500 nào. Đây là test hay bị thiếu nhất.`,
  follow: [
    'Cache tenant status nên invalidate bằng event hay polling, vì sao?',
    'Khi tenant bị suspend, request đang in-flight (đã vào controller) xử lý thế nào?',
    'Fail-closed vs fail-open cho tenant status: bạn chọn gì và vì sao?'
  ],
  tags: ['multi-tenancy', 'tenant lifecycle', 'HTTP status', 'middleware', 'cache TTL']
},
{
  id: 'microservices-041',
  topic: 'microservices',
  level: 'senior',
  q: 'Hợp đồng idempotency cho lệnh ghi: idempotency key client gửi, TTL, store (Redis + fallback DB), scope theo {tenantId, endpoint, key}. Chuyện gì xảy ra khi 2 request cùng key đồng thời (đang in-flight chưa set state là gì); trả 409 vs đợi/số hoá; sai lầm có khi actor trạng thái "PENDING" im lặng -> double-process.',
  a: `**Tóm tắt:** hợp đồng idempotency gồm: client sinh **Idempotency-Key** cho mỗi lệnh ghi; server lưu theo scope {{(tenantId, endpoint, key)}} kèm **hash payload**, trạng thái và response, có **TTL** (ví dụ 24h); store là Redis (nhanh) có DB làm nguồn bền. Điểm mấu chốt là **claim nguyên tử** (Redis SET NX hoặc unique constraint ở DB): khi 2 request cùng key tới đồng thời, chỉ một request được xử lý; request kia nhận **409 + Retry-After** (hoặc chờ có giới hạn), còn request tới sau khi đã xong nhận lại **đúng response cũ**. Sai lầm kinh điển: "check rồi mới set" trạng thái PENDING, hai request cùng thấy "chưa có" và cùng chạy, gây trừ tiền hai lần.

### Hiểu nhanh
Bạn nộp hồ sơ ở một quầy, mỗi hồ sơ có **số phiếu** do bạn tự ghi. Quầy có một **cái móc treo phiếu**: ai treo phiếu số 123 lên móc trước thì người đó được xử lý; người thứ hai mang cùng số 123 tới sẽ thấy móc đã có phiếu và được bảo "hồ sơ này đang xử lý, quay lại sau" (409). Khi xử lý xong, kết quả được kẹp vào phiếu; ai mang số 123 tới nữa thì nhận **bản sao kết quả**, không làm lại. Nếu ai đó mang số 123 nhưng nội dung hồ sơ khác thì bị từ chối (422), vì đó là dùng sai số phiếu.

### Thuật ngữ
- **Idempotency key**: mã duy nhất client sinh cho một lệnh, gửi lại y nguyên khi retry.
- **Scope**: phạm vi để key là duy nhất, thường (tenantId, endpoint, key).
- **Claim nguyên tử**: thao tác "chiếm" key chỉ thành công cho một request, như {{SET key val NX EX 30}} của Redis hoặc INSERT có unique constraint.
- **IN_FLIGHT / COMPLETED / FAILED**: trạng thái của một key: đang xử lý / đã có response / thất bại có thể thử lại.
- **Lease**: thời hạn của trạng thái IN_FLIGHT, hết hạn thì coi như request đã chết.
- **Payload hash**: băm nội dung request để phát hiện cùng key nhưng khác nội dung.
- **409 Conflict / 422 Unprocessable Content**: đang có request cùng key xử lý / cùng key nhưng payload khác.
- **Write-through**: ghi vào cả cache lẫn store bền trong cùng luồng xử lý.

### Hợp đồng idempotency
1. **Client** sinh UUID cho mỗi lệnh ghi, gửi header {{Idempotency-Key}}; retry thì gửi **lại cùng key**. Vì sao client sinh: chỉ client biết hai lần gửi là "cùng một ý định".
2. **Scope** {{(tenantId, endpoint, key)}}: cùng key ở endpoint khác hoặc tenant khác là lệnh khác, và tenant này không thể "đoán key" để đọc response của tenant kia.
3. **TTL** 24h (hoặc theo nghiệp vụ, lớn hơn cửa sổ retry của client); quá TTL coi như lệnh mới.
4. **Store**: Redis cho tốc độ và TTL sẵn; với lệnh liên quan tiền, ghi bản bền vào DB **cùng transaction** với business write, để Redis mất dữ liệu cũng không mất dấu.

### Luồng xử lý và đồng thời (từng bước)
1. **Claim**: {{SET idem:<tenant>:<endpoint>:<key> IN_FLIGHT NX EX 30}} hoặc {{INSERT ... ON CONFLICT DO NOTHING}}. Thành công thì request này là "chủ" của key.
2. **Claim thất bại**, đọc trạng thái hiện có:
   (a) IN_FLIGHT → trả **409** kèm {{Retry-After}}, hoặc chờ (poll) tối đa vài giây rồi trả kết quả nếu đã xong.
   (b) COMPLETED → so hash payload: khớp thì trả **đúng status + body đã lưu**; khác thì trả **422**.
   (c) FAILED (lỗi có thể thử lại) → cho phép claim lại.
3. **Xử lý side effect** (chỉ chủ của key).
4. **Lưu response**, chuyển COMPLETED, đặt TTL dài.
5. **Lease hết hạn** (process chết khi đang IN_FLIGHT): request sau được claim lại; vì thế side effect bên dưới cũng phải idempotent (ví dụ truyền key sang cổng thanh toán).

~~~text
t=0ms   req A key=K ── SET NX ──► OK (IN_FLIGHT)  ──► charge ──► COMPLETED + response
t=5ms   req B key=K ── SET NX ──► FAIL, thấy IN_FLIGHT ──► 409, Retry-After: 1
t=900ms req C key=K ── SET NX ──► FAIL, thấy COMPLETED ──► trả lại response của A
SAI:    A: GET K → null; B: GET K → null; A: SET PENDING; B: SET PENDING → cả hai charge!
~~~

### Payload mismatch và lỗi
- Cùng key, payload khác → 422; không bao giờ im lặng chạy hay trả response của payload cũ.
- Lỗi do validation (4xx) có thể lưu như COMPLETED (lần sau trả lại cùng lỗi); lỗi tạm thời (5xx, timeout downstream) nên đánh dấu FAILED để client retry được.

### Idempotency ở consumer (event)
- Consumer dùng bảng {{processed_msg(msg_id PK)}} insert trong cùng transaction với business write.
- msg_id là **event ID** do producer sinh (không dùng Kafka offset, vì replay/khôi phục topic làm offset thay đổi).

### Lỗi hay gặp
1. **Check-then-set** thay vì claim nguyên tử. Triệu chứng: thỉnh thoảng trừ tiền hai lần khi người dùng bấm đúp. Cách tránh: SET NX hoặc unique constraint.
2. **TTL ngắn hơn cửa sổ retry**. Triệu chứng: client retry sau 2 giờ, key đã hết hạn, lệnh chạy lần hai. Cách tránh: TTL lớn hơn thời gian retry tối đa.
3. **Retry ở nhiều tầng** (client + framework + broker). Triệu chứng: số bản sao nhân lên, bảng dedup phình. Cách tránh: một tầng retry chính, mọi tầng dùng cùng key.
4. **Side effect bên thứ ba không có key**. Triệu chứng: crash giữa lúc gọi cổng thanh toán và lưu COMPLETED, retry gây charge thật lần hai. Cách tránh: truyền idempotency key sang bên thứ ba, hoặc ghi PENDING rồi đối soát trước khi gọi lại.

### Trả lời miệng 1 phút
"Hợp đồng của tôi là client sinh Idempotency-Key cho mỗi lệnh ghi và gửi lại cùng key khi retry; server lưu theo scope tenant, endpoint, key, kèm hash payload, trạng thái và response, TTL 24 giờ. Điểm quan trọng nhất là claim nguyên tử bằng Redis SET NX hoặc unique constraint: chỉ một request được xử lý. Request trùng khi đang IN_FLIGHT nhận 409 với Retry-After, khi đã COMPLETED nhận lại đúng response cũ, còn khác payload thì 422. Với lệnh tiền, tôi ghi bản ghi bền vào DB cùng transaction và truyền key sang cổng thanh toán. Lỗi hay gặp nhất là check rồi mới set PENDING, hai request cùng thấy trống và cùng chạy."


### Ví dụ đời thực

Sự cố: sau khi triển khai tính năng nộp tiền từ ứng dụng di động, kế toán phát hiện một số khách bị trừ tiền hai lần trong khoảng 2 giây, cùng mã giao dịch.

Điều tra: tra log Redis và cơ sở dữ liệu, thấy hai yêu cầu cùng khóa idempotency {{pay-8821}} đều đọc là "chưa có" (null), cả hai đều ghi trạng thái PENDING, rồi cả hai cùng gọi cổng thanh toán và trừ tiền.

Nguyên nhân gốc: code làm kiểm tra rồi mới thiết lập (check-then-set): {{GET key}}, nếu null thì {{SET PENDING}}; hai yêu cầu cùng đọc null và cùng chạy, vi phạm yêu cầu claim nguyên tử.

Xử lý: đổi thành {{SET key IN_FLIGHT NX EX 30}}; chỉ yêu cầu thành công mới được xử lý; yêu cầu trùng khi đang IN_FLIGHT nhận 409 kèm {{Retry-After}}; khi đã COMPLETED, trả lại phản hồi cũ đã lưu. Với lệnh liên quan tiền, ghi bản bền vào cơ sở dữ liệu cùng transaction và truyền khóa sang cổng thanh toán.

Kết quả: trường hợp bị trừ tiền hai lần từ 3-4 lần mỗi tháng về 0 sau 2 tuần vận hành; độ trễ thêm khoảng 2 ms do claim Redis.

> Senior tip: idempotency key là "hợp đồng" giữa client và server: hãy viết rõ trong tài liệu API về scope, TTL, hành vi khi IN_FLIGHT và khi payload khác. Không có tài liệu thì client không biết cách retry đúng.`,
  follow: [
    'Idempotency key nên lưu trong Redis hay DB, vì sao?',
    'Nếu side effect là gọi REST phía thứ ba không hỗ trợ idempotency, bạn làm gì?',
    'Offset commit trước hay sau khi xử lý? Chọn từng lựa chọn thì đánh đổi gì?'
  ],
  tags: ['idempotency', 'concurrency', 'Redis', 'contract', 'retry']
},
{
  id: 'microservices-042',
  topic: 'microservices',
  level: 'lead',
  q: 'Quyền sở hữu request (servlet request ownership): chứng cứ bảo vệ tránh agent khác reuse: đổi characterEncoding, đọc body dựng X-Forwarded-*, cơ chế khi có nhiều filter chain; nên dùng OncePerRequestFilter + RequestContextHolder @RequestScope bean; pitfall ThreadLocal không clear giữa thread pool, contaminasi giữa request cũ và request mới; dùng ServletRequest đã được wrap nhiều lớp (Tomcat ApplicationHttpRequest chỉ read-only); chỉ nên copy data mình cần thay vì giữ reference.',
  a: `**Tóm tắt:** một {{HttpServletRequest}} được **nhiều filter/servlet dùng chung** trong một chuỗi xử lý, và container (Tomcat) **tái sử dụng object request** cho request sau. Component nào "chiếm hữu" request (đổi character encoding, đọc body, ghi attribute, tin header X-Forwarded-*) mà không bọc (wrap) hay sao chép, thì component khác sẽ thấy trạng thái sai. Quy tắc: dùng {{OncePerRequestFilter}}, đọc những gì cần **một lần ở biên**, chép vào một object bất biến (record) lưu trong request scope/ThreadLocal, **luôn clear trong finally**, và **không giữ reference** tới request ngoài vòng đời của nó (nhất là trong thread async).

### Hiểu nhanh
Request giống **tập hồ sơ gốc** được chuyền tay qua nhiều phòng. Nếu phòng A **viết đè** lên hồ sơ gốc (đổi encoding), phòng B đọc sai. Nếu phòng A **rút tờ đơn ra đọc rồi không trả lại** (đọc body), phòng C nhận tập hồ sơ thiếu đơn. Và sau khi xử lý xong, tập hồ sơ được **xóa trắng để dùng cho khách sau**; ai còn giữ "đường dẫn" tới nó sẽ đọc phải giấy tờ của người khác. Cách an toàn: mỗi phòng **photo phần mình cần** (copy dữ liệu) ở cửa vào, làm việc trên bản photo, và trả lại hồ sơ gốc nguyên vẹn.

### Thuật ngữ
- **Filter chain**: chuỗi filter servlet chạy trước (và sau) servlet; Spring Security có chuỗi filter riêng bên trong.
- **HttpServletRequestWrapper**: lớp bọc request để thay đổi hành vi (ví dụ đọc body nhiều lần) mà không sửa request gốc.
- **ContentCachingRequestWrapper**: wrapper của Spring lưu lại nội dung body **khi body được đọc**, để đọc lại sau (ví dụ để log).
- **OncePerRequestFilter**: filter chỉ chạy một lần mỗi request, kể cả khi có forward/include/error dispatch.
- **RequestContextHolder**: giữ request hiện tại trong ThreadLocal để code ở tầng sâu lấy được.
- **@RequestScope**: bean có một instance cho mỗi HTTP request, được inject qua proxy.
- **ForwardedHeaderFilter**: filter của Spring đọc header Forwarded/X-Forwarded-* để dựng lại host, scheme, IP gốc.
- **TaskDecorator**: hook của Spring để chép context (MDC, security, tenant) sang thread chạy task async.

### Các cách "chiếm hữu" request gây lỗi (từng ý)
1. **Đổi encoding muộn**: {{setCharacterEncoding("UTF-8")}} chỉ có tác dụng **trước** khi param/body được đọc lần đầu; filter nào đã gọi {{getParameter()}} trước đó thì encoding cũ đã được dùng. Cách đúng: đặt encoding ở filter đầu tiên (Spring Boot đã có CharacterEncodingFilter).
2. **Đọc body**: input stream chỉ đọc được **một lần**; filter đọc để log/xác minh chữ ký thì controller nhận body rỗng (400). {{ContentCachingRequestWrapper}} chỉ lưu khi body **đã được đọc**, nên muốn đọc body **trước** controller thì phải tự viết wrapper đọc toàn bộ body vào mảng byte rồi trả về stream mới mỗi lần {{getInputStream()}}.
3. **Tin X-Forwarded-* từ client**: kẻ tấn công tự gửi {{X-Forwarded-For}} để giả IP. Chỉ xử lý header này khi request chắc chắn đi qua proxy tin cậy và proxy **ghi đè** header: dùng {{server.forward-headers-strategy=native}} với danh sách internal proxy của Tomcat, hoặc {{framework}} (ForwardedHeaderFilter) khi proxy phía trước luôn xóa/ghi đè header từ client.
4. **Attribute trùng tên**: filter A và B cùng set {{tenantId}}; dùng tên có namespace ({{com.example.tenantId}}).

### Mẫu an toàn (từng bước)
1. **OncePerRequestFilter ở biên** đọc tenantId, userId, traceId một lần.
2. **Chép vào record bất biến** và đặt vào ThreadLocal hoặc bean @RequestScope. Vì sao bất biến: không ai sửa được giữa chừng.
3. **Clear trong finally**, vì thread của Tomcat được tái sử dụng cho request sau.
4. **Async**: không truyền request sang thread khác; chép record qua {{TaskDecorator}} (hoặc context propagation của Micrometer).

~~~java
record RequestInfo(String tenantId, String userId, String traceId) {}

@Component
class RequestInfoFilter extends OncePerRequestFilter {
    static final ThreadLocal<RequestInfo> CURRENT = new ThreadLocal<>();
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        CURRENT.set(new RequestInfo(req.getHeader("X-Tenant-Id"),   // chép giá trị, không giữ req
                req.getRemoteUser(), req.getHeader("traceparent")));
        try { chain.doFilter(req, res); }
        finally { CURRENT.remove(); }      // bắt buộc: thread sẽ phục vụ request khác
    }
}
~~~

~~~text
Tomcat thread-7: req#1 (tenant A) → set A → ... → finally remove
Tomcat thread-7: req#2 (tenant B) → set B → ...
Nếu quên remove và req#2 không set: thread-7 vẫn mang tenant A → rò dữ liệu xuyên tenant
~~~

### RequestContextHolder và @RequestScope
- DispatcherServlet (và RequestContextFilter) tự gắn request vào {{RequestContextHolder}} và reset khi xong; tự gắn thủ công thì phải {{resetRequestAttributes()}} trong finally.
- Bean {{@RequestScope}} được inject vào singleton qua proxy nên an toàn khi dùng **trong** request; gọi nó ở thread khác/ngoài request sẽ lỗi "No thread-bound request found".
- **InheritableThreadLocal** nguy hiểm với thread pool: thread con được tạo một lần và giữ giá trị cũ; hãy chép tường minh thay vì kế thừa.

### Forward/include và wrapper nhiều lớp
- Khi forward/include, container bọc request thành wrapper với path và param riêng của lần dispatch đó; đừng giả định URI hay param trong wrapper giống request gốc, và đừng lưu wrapper để dùng sau.
- Sau khi response hoàn tất, object request có thể được tái sử dụng: giữ reference trong {{@Async}}/CompletableFuture sẽ gây IllegalStateException hoặc đọc nhầm dữ liệu.

### Lỗi hay gặp
1. **Quên clear ThreadLocal**. Triệu chứng: thỉnh thoảng người dùng thấy dữ liệu của tenant khác. Cách tránh: remove trong finally, test bằng thread pool 1 thread.
2. **Filter đọc body để log**. Triệu chứng: controller nhận body rỗng, lỗi 400 khó hiểu. Cách tránh: wrapper đọc trước và phát lại body, hoặc log sau khi controller đã đọc.
3. **Tin X-Forwarded-For trực tiếp**. Triệu chứng: rate limit theo IP bị vượt qua bằng header giả. Cách tránh: chỉ tin header từ proxy tin cậy.
4. **Truyền HttpServletRequest vào task async**. Triệu chứng: lỗi ngẫu nhiên khi tải cao. Cách tránh: chép record cần thiết qua TaskDecorator.

### Trả lời miệng 1 phút
"Request là object dùng chung trong cả filter chain và còn bị container tái sử dụng sau khi xong. Vì vậy tôi không để component nào sửa request gốc: encoding đặt ở filter đầu tiên, body chỉ đọc lại qua wrapper phát lại byte, header X-Forwarded chỉ tin khi đi qua proxy tin cậy. Mẫu tôi dùng là một OncePerRequestFilter ở biên đọc tenant, user, trace id, chép vào một record bất biến đặt trong ThreadLocal hoặc request scope, và luôn remove trong finally. Với async, tôi chép record qua TaskDecorator chứ không truyền request. Trade-off là thêm chút code ở biên, đổi lại tránh được lỗi rò dữ liệu giữa các request, loại lỗi rất khó tái hiện."


### Ví dụ đời thực

Sự cố: sau khi thêm filter kiểm tra chữ ký bằng cách đọc toàn bộ nội dung yêu cầu, hỗ trợ nhận hàng chục tin báo "yêu cầu sai cú pháp (400)" mỗi giờ, mặc dù nội dung gửi đi hợp lệ.

Điều tra: tra log truy cập, thấy lỗi 400 tăng đột biến sau bản deploy filter mới; kiểm tra mã filter, thấy nó gọi {{req.getInputStream()}} để đọc nội dung và ghi log, sau đó controller gọi {{getInputStream()}} lần nữa nhưng dòng dữ liệu đã hết, nhận nội dung rỗng và không qua validation.

Nguyên nhân gốc: dòng dữ liệu của servlet chỉ được đọc một lần; filter đọc nội dung trước controller mà không phát lại dòng dữ liệu, làm nội dung bị "mất".

Xử lý: viết bộ bọc đọc toàn bộ nội dung vào mảng byte một lần, rồi trả về dòng dữ liệu mới mỗi khi {{getInputStream()}} được gọi (lưu ý: {{ContentCachingRequestWrapper}} của Spring chỉ lưu lại phần đã đọc để xem sau, không cho đọc lại stream từ đầu); chỉ đọc nội dung ở biên khi thực sự cần, và không giữ tham chiếu đến đối tượng yêu cầu sau khi phản hồi hoàn tất.

Kết quả: lỗi 400 do nội dung rỗng về 0; log chữ ký vẫn được ghi đầy đủ mà không làm hỏng luồng xử lý chính.

> Senior tip: quy tắc "không giữ reference tới request": mọi dữ liệu cần dùng phía sau phải được trích thành object bất biến ngay tại biên (filter). Bất biến đơn giản này loại bỏ phần lớn lỗi "lẫn dữ liệu giữa các request".`,
  follow: [
    'ContentCachingRequestWrapper cache body như thế nào, và khi nào downstream đọc được?',
    'RequestContextHolder với async (CompletableFuture) propagate ra sao?',
    'ForwardedHeaderFilter tin X-Forwarded-* như thế nào để tránh spoofing?'
  ],
  tags: ['servlet', 'request ownership', 'ThreadLocal', 'filter', 'Spring Security']
},
{
  id: 'microservices-043',
  topic: 'microservices',
  level: 'senior',
  q: 'Partial success khi xoá: API xoá bản ghi phụ thuộc nhiều nguồn (DB + object store + downstream), người dùng muốn "xoá 1 lô"; chiến lược orchestration: mark-for-delete + saga compensating; trả 207 Multi-Status với danh sách từng id status; auditable; phân biệt 409 khi còn khoá; tránh "im lặng xoá nửa vời" rồi cron dọn dẹp nhiệm vụ "cleanup orphan".',
  a: `**Tóm tắt:** xóa một bản ghi có dữ liệu ở nhiều nơi (DB + object store như S3 + service downstream) **không thể nguyên tử**. Cách làm: **mark-for-delete** (soft delete, trạng thái PENDING_DELETE) trong DB trước, rồi một orchestrator/saga xóa từng nguồn với retry, idempotency, DLQ và audit; chỉ **hard delete** khi mọi nguồn đã xóa. Với xóa theo lô, trả **207 Multi-Status** kèm trạng thái **từng id** (hoặc 202 nếu xử lý bất đồng bộ), dùng **409** cho id còn bị khóa/ràng buộc nghiệp vụ. Tránh "im lặng xóa nửa vời" rồi trông chờ cron dọn rác.

### Hiểu nhanh
Bạn trả phòng khách sạn: phải trả chìa khóa (DB), dọn đồ trong két (object store) và báo nhà hàng hủy suất ăn sáng (downstream). Không thể làm cả ba **cùng một lúc**. Cách đúng: lễ tân **đánh dấu "đang trả phòng"** ngay (mark-for-delete) để không ai đặt dịch vụ mới cho phòng đó, rồi lần lượt làm từng việc; việc nào chưa xong thì làm lại, và mọi bước đều ghi vào sổ. Chỉ khi tất cả xong mới xóa phòng khỏi hệ thống. Nếu bạn trả 5 phòng một lúc, lễ tân phải đưa **bảng kê từng phòng**: phòng nào xong, phòng nào còn khóa vì chưa thanh toán minibar (409).

### Thuật ngữ
- **Soft delete / mark-for-delete**: đánh dấu bản ghi đã xóa (deleted_at, status) thay vì xóa vật lý ngay.
- **Hard delete**: xóa vật lý dữ liệu khỏi nơi lưu trữ.
- **Saga / orchestrator**: chuỗi bước có theo dõi trạng thái, retry và hành động bù khi lỗi.
- **207 Multi-Status**: mã trạng thái (từ WebDAV, RFC 4918) báo response chứa kết quả riêng cho nhiều phần tử.
- **202 Accepted**: đã nhận yêu cầu, sẽ xử lý bất đồng bộ.
- **409 Conflict**: yêu cầu xung đột với trạng thái hiện tại (đang bị khóa, còn ràng buộc nghiệp vụ).
- **Orphan**: dữ liệu mồ côi, ví dụ file trên S3 không còn bản ghi DB nào trỏ tới.
- **Audit trail**: nhật ký ai làm gì, lúc nào, kết quả ra sao, không sửa được.

### Chiến lược orchestration (từng bước)
1. **Validate**: id có tồn tại, có quyền xóa, còn ràng buộc nghiệp vụ không (ví dụ đơn chưa giao) → nếu vướng thì 409 cho id đó, không làm gì thêm. Vì sao kiểm trước: 409 là lỗi nghiệp vụ, retry không có ích.
2. **Mark-for-delete** trong DB: {{status = 'PENDING_DELETE', deleted_at = now()}}, kèm ghi audit và tạo "delete job" trong cùng transaction (outbox). Người dùng thấy "đã xóa" ngay; các truy vấn thường lọc bỏ bản ghi này.
3. **Xóa từng nguồn**: object store (xóa theo key, idempotent: xóa thứ đã không còn vẫn thành công), rồi gọi downstream bằng lệnh có idempotency key. Mỗi bước được ghi trạng thái riêng.
4. **Retry có backoff** cho lỗi tạm thời; quá số lần thì vào DLQ + alert, bản ghi giữ trạng thái DELETE_FAILED để người xử lý.
5. **Hard delete** row trong DB (hoặc sau một cửa sổ khôi phục, ví dụ 30 ngày) khi mọi nguồn đã xong.
6. **Compensation**: chỉ những bước đảo được mới bù (bỏ đánh dấu khi chưa xóa nguồn nào); xóa file thì không "khôi phục" được, nên chiến lược chính là **đi tiếp bằng retry**, không phải rollback.

~~~text
DELETE /files (batch a1..a4)
a1: validate ✓ → PENDING_DELETE → S3 ✓ → search-index ✓ → hard delete   => 200
a2: validate ✓ → PENDING_DELETE → S3 ✓ → search-index ✗ (retry nền)       => 202
a3: validate ✗ còn khóa bởi đơn #123                                      => 409
a4: không tồn tại                                                         => 404
Tổng: 207 Multi-Status
~~~

### 207 Multi-Status cho batch
~~~json
{
  "results": [
    {"id": "a1", "status": 200, "message": "deleted"},
    {"id": "a2", "status": 202, "message": "db marked, search index pending"},
    {"id": "a3", "status": 409, "message": "locked by order #123"},
    {"id": "a4", "status": 404, "message": "not found"}
  ]
}
~~~
- 207 nghĩa là "xem kết quả từng phần tử"; client **phải** xử lý từng entry, không được giả định all-or-nothing.
- Nếu toàn bộ batch xử lý bất đồng bộ, trả **202** + link để theo dõi job.

### HTTP status cho từng kết quả
| Kết quả | Status | Khi nào |
|---|---|---|
| Xóa xong mọi nguồn | 200/204 | toàn bộ thành công đồng bộ |
| Đã nhận, đang xóa nền | 202 | còn bước bất đồng bộ |
| Kết quả lẫn lộn trong batch | 207 | có id thành công, có id lỗi |
| Còn khóa / ràng buộc | 409 | lỗi nghiệp vụ, không retry |
| Không tồn tại | 404 (hoặc 204 nếu coi xóa là idempotent) | tùy quy ước API |
| Downstream không sẵn sàng | 503 | lỗi tạm, có Retry-After |

### Auditable
- Ghi audit: ai xóa, khi nào, id nào, kết quả từng nguồn; bắt buộc với dữ liệu tài chính/y tế và yêu cầu GDPR.
- Hard delete chỉ sau khi mọi nguồn xong (và hết cửa sổ khôi phục nếu có); audit log tự nó không chứa dữ liệu cá nhân đã xóa.

### Lỗi hay gặp
1. **Im lặng xóa nửa vời**. Triệu chứng: DB đã xóa, file vẫn nằm trên S3 tốn tiền và vi phạm yêu cầu xóa dữ liệu. Cách tránh: mark-for-delete + theo dõi từng bước + alert.
2. **Dựa vào cron dọn orphan làm chiến lược chính**. Triệu chứng: không biết ai đã xóa gì, audit đứt, orphan tích tụ. Cách tránh: cron chỉ là lưới an toàn đối soát, không thay orchestration.
3. **Trả 200 khi có id lỗi**. Triệu chứng: UI báo "đã xóa 5 mục" nhưng 2 mục vẫn còn. Cách tránh: 207 + kết quả từng id.
4. **Retry cho 409**. Triệu chứng: job lặp vô ích với bản ghi còn ràng buộc. Cách tránh: phân loại lỗi nghiệp vụ và lỗi tạm thời.

### Trả lời miệng 1 phút
"Xóa trên DB, S3 và downstream không thể nguyên tử, nên tôi làm theo kiểu saga. Đầu tiên validate, vướng ràng buộc nghiệp vụ thì trả 409 cho id đó. Sau đó đánh dấu PENDING_DELETE và ghi audit cùng một delete job trong một transaction, người dùng thấy đã xóa ngay. Orchestrator xóa từng nguồn với idempotency, retry có backoff, quá ngưỡng thì DLQ và alert; xong hết mới hard delete. Vì xóa file không khôi phục được, tôi ưu tiên đi tiếp bằng retry thay vì compensation. Với batch, tôi trả 207 kèm trạng thái từng id, hoặc 202 nếu xử lý nền. Cron dọn orphan chỉ là lưới an toàn, không phải chiến lược chính."

### Ví dụ đời thực
  Hệ thống lưu trữ tài liệu y tế (HIPAA) cho 200 bệnh viện: metadata trong PostgreSQL, file PDF trên S3, index tìm kiếm trên Elasticsearch. Năm 2024, một bệnh viện yêu cầu xoá 5.000 hồ sơ cũ theo quy định lưu trữ 7 năm. Triệu chứng: xoá thủ công từng hồ sơ mất 3 ngày; team dev viết script xoá lô nhưng chỉ xoá DB, file S3 và index Elasticsearch vẫn còn. Điều tra: script chạy {{DELETE FROM documents WHERE ...}} xong 5 phút; {{aws s3 ls}} thấy 5.000 file PDF (≈ 50 GB) vẫn tồn tại; {{GET /_cat/indices}} thấy index Elasticsearch vẫn 5.000 docs. Nguyên nhân gốc: script chỉ xoá DB, thiếu orchestration xoá đa nguồn; không có audit trail ai xoá gì. Xử lý: (1) viết DeleteJob service: validate → mark-for-delete (status=PENDING_DELETE) + ghi audit trong 1 transaction, (2) orchestrator xoá S3 (idempotent: xóa key không tồn tại vẫn trả 204), gọi Elasticsearch delete-by-query với retry, (3) hard delete DB khi mọi nguồn xong, (4) trả 207 Multi-Status cho batch, (5) cron đối soát hàng ngày so sánh count DB vs S3 vs Elasticsearch. Kết quả: xoá 5.000 hồ sơ hoàn tất trong 2 tiếng, audit log đầy đủ cho HIPAA, 0 file orphan. Đây là minh chứng: mark-for-delete + orchestration + 207 status là bắt buộc cho xoá đa nguồn có compliance.

> Senior tip: với batch delete, luôn trả 207 kèm kết quả từng id thay vì 200 "OK" khi có bất kỳ lỗi nào. Client (và người dùng) phải biết chính xác cái nào đã xóa, cái nào chưa: "im lặng thành công" là bug nghiêm trọng nhất của một delete API.`,
  follow: [
    'Mark-for-delete vs hard delete: khi nào chuyển từ soft sang hard?',
    'Saga compensating cho delete: nếu compensate (restore) cũng fail thì sao?',
    'Cron cleanup orphan có nên là chiến lược chính không, vì sao?'
  ],
  tags: ['partial success', 'delete', 'saga', '207 Multi-Status', 'compensation']
},
{
  id: 'microservices-044',
  topic: 'microservices',
  level: 'mid',
  q: 'Quyết định topic thể hiện tinh thần "phía server có quyền": user-gọi delete n-fail mà server vẫn trả 200 khi chỉ 1 fail là bug; đưa bảng trạng thái HTTP cho từng kết quả (207/200/409/500), code chung trong envelope error có detail[].',
  a: `**Tóm tắt:** "server có quyền" nghĩa là **server quyết định và trả status code phản ánh đúng sự thật**, client không phải đoán từ body. Xóa n mục mà có mục lỗi nhưng vẫn trả **200** là bug. Quy ước: tất cả thành công → 200/204; kết quả lẫn lộn → **207** kèm kết quả từng mục; cả yêu cầu vướng ràng buộc nghiệp vụ → **409**; lỗi tạm thời phía server/downstream → **503/500**. Mọi lỗi dùng **một envelope chung** (ví dụ theo ProblemDetail, RFC 9457) có mảng {{detail[]}} liệt kê từng id, status và lý do.

### Hiểu nhanh
Bạn nhờ bưu điện gửi 5 bưu kiện. Nhân viên nói "**OK, xong!**" (200) nhưng thực ra 1 kiện bị trả lại vì sai địa chỉ. Bạn về nhà yên tâm, vài ngày sau mới phát hiện. Một bưu điện tử tế sẽ đưa **biên nhận từng kiện** (207 + detail): 4 kiện đã gửi, 1 kiện bị từ chối vì sai địa chỉ (409), và nếu cả hệ thống vận chuyển đang sập thì nói thẳng "hôm nay chưa gửi được, mai quay lại" (503). Status code là **dòng chữ in to trên biên nhận**: phần mềm của client đọc dòng này trước tiên để quyết định có thử lại hay không.

### Thuật ngữ
- **Status code**: mã 3 chữ số của HTTP response, nhóm 2xx thành công, 4xx lỗi phía yêu cầu, 5xx lỗi phía server.
- **207 Multi-Status**: response chứa kết quả riêng cho từng phần tử của một yêu cầu gộp.
- **409 Conflict**: yêu cầu xung đột với trạng thái hiện tại (bị khóa, còn phụ thuộc).
- **503 Service Unavailable**: tạm thời không phục vụ được, thường kèm Retry-After.
- **Error envelope**: cấu trúc JSON thống nhất cho mọi lỗi của API.
- **ProblemDetail (RFC 9457)**: chuẩn JSON cho lỗi HTTP (type, title, status, detail, instance + trường mở rộng); Spring 6 hỗ trợ sẵn.
- **Retryable**: lỗi mà thử lại có khả năng thành công (thường 429, 503); 4xx nghiệp vụ thì không.

### Nguyên tắc "server có quyền" (từng ý)
1. **Status code là hợp đồng**: HTTP client, gateway, retry policy, monitoring đều dựa vào status code, không đọc body. Trả 200 kèm {{"errors": [...]}} thì mọi thành phần đó coi là thành công. Vì sao nguy hiểm: không retry, không alert, dữ liệu lệch âm thầm.
2. **200 chỉ khi toàn bộ thao tác thành công.** Có bất kỳ mục lỗi nào thì không được là 200.
3. **Phân biệt lỗi nghiệp vụ và lỗi tạm thời**: 409 (không retry) khác 503 (retry sau). Trả 500 cho xung đột nghiệp vụ khiến client retry vô ích, tăng tải.
4. **Luôn có chi tiết từng mục** để client không phải query lại toàn bộ.

### Bảng trạng thái cho delete batch
| Tình huống | HTTP status | Body |
|---|---|---|
| Tất cả xóa thành công | 200 (có body) / 204 (không body) | {"deleted": N} hoặc rỗng |
| Có mục thành công, có mục lỗi | 207 | {"results": [...]} từng id |
| Cả yêu cầu vướng ràng buộc (ví dụ mọi id đều bị khóa) | 409 | envelope + detail[] |
| Tất cả id không tồn tại | 404 (hoặc 204 nếu API coi xóa là idempotent) | envelope |
| Downstream không sẵn sàng, chưa xóa được gì | 503 | envelope + Retry-After |
| Lỗi không mong đợi (bug) | 500 | envelope, không lộ stack trace |

Quy tắc chọn status tổng: **mọi mục cùng một kết quả thì dùng status của kết quả đó; kết quả lẫn lộn thì 207**, và status thật của từng mục nằm trong detail.

### Envelope lỗi chung
~~~json
{
  "type": "https://api.example.com/errors/partial-failure",
  "title": "Partial failure",
  "status": 207,
  "detail": "3/5 deleted",
  "items": [
    {"id": "a1", "status": 200, "message": "ok"},
    {"id": "a2", "status": 409, "code": "LOCKED", "message": "locked by order #123"},
    {"id": "a3", "status": 503, "code": "DOWNSTREAM_UNAVAILABLE", "retryable": true}
  ]
}
~~~
- Mảng chi tiết (ở đây là {{items}}, nhiều team đặt tên {{detail[]}}) có mặt trong mọi response lỗi của batch.
- Mỗi mục có **mã lỗi máy đọc được** (code) và cờ retryable, client không phải phân tích chuỗi message.

### Hiện thực trong Spring (từng bước)
1. Service trả về kết quả từng id (record {{ItemResult(id, status, code, message)}}).
2. Controller tính status tổng theo quy tắc trên rồi trả {{ResponseEntity.status(...)}}.
3. Exception không mong đợi được {{@RestControllerAdvice}} ánh xạ sang ProblemDetail 500, log mức ERROR; lỗi nghiệp vụ map sang 4xx, log mức WARN.

~~~text
5 id: a1 ok, a2 locked, a3 ok, a4 ok, a5 downstream timeout
status từng mục: 200, 409, 200, 200, 503  → lẫn lộn → HTTP 207
client: xóa a1,a3,a4 khỏi UI; báo a2 bị khóa; tự retry a5 sau Retry-After
~~~

### Lỗi hay gặp
1. **200 kèm danh sách lỗi trong body**. Triệu chứng: monitoring xanh nhưng người dùng phàn nàn mục không bị xóa. Cách tránh: 207 hoặc status lỗi thật.
2. **500 cho xung đột nghiệp vụ**. Triệu chứng: client retry liên tục, alert 5xx giả. Cách tránh: 409 với mã lỗi rõ ràng.
3. **Không có chi tiết từng mục**. Triệu chứng: client phải gọi lại API danh sách để đoán mục nào còn. Cách tránh: luôn trả detail theo id.
4. **Mỗi endpoint một kiểu body lỗi**. Triệu chứng: frontend phải viết parser riêng cho từng API. Cách tránh: một envelope chung theo ProblemDetail.

### Trả lời miệng 1 phút
"Server có quyền nghĩa là status code phải nói đúng sự thật, vì HTTP client, retry policy và monitoring chỉ nhìn status code. Xóa năm mục mà có một mục lỗi nhưng vẫn trả 200 là bug: không ai retry, không ai được cảnh báo. Quy ước của tôi: tất cả thành công thì 200 hoặc 204; kết quả lẫn lộn thì 207 với kết quả từng id; cả yêu cầu vướng ràng buộc nghiệp vụ thì 409, không retry; downstream tạm lỗi thì 503 kèm Retry-After. Mọi lỗi dùng một envelope chung theo ProblemDetail, có mảng chi tiết với id, status, mã lỗi và cờ retryable. Tôi khóa quy ước này bằng contract test cho status code."

### Ví dụ đời thực
  Nền tảng SaaS quản lý nhân sự 500 công ty (tenant), API {{/api/v1/employees/batch-delete}} xoá lô nhân viên. Năm 2023, frontend gửi xoá 20 id, backend xoá 18 thành công, 2 id bị khóa do còn hợp đồng đang hiệu lực. Code cũ trả **200 OK** kèm body inline JSON: deleted=18, errors=[e19 locked, e20 locked]. Triệu chứng: monitoring Datadog toàn xanh (2xx), on-call không nhận alert; HR trưởng phòng nhân sự reload trang vẫn thấy 2 nhân viên "đã xoá" nhưng thực ra chưa xoá; khách than phiền sau 2 tuần. Điều tra: log nginx thấy {{200 POST /batch-delete}}; response body có {{errors}} nhưng status code 200; retry policy của client (axios) không retry vì 2xx. Nguyên nhân gốc: server không "có quyền" quyết định status code phản ánh thực tế; 200 che giấu partial failure. Xử lý: (1) refactor controller: tính status từng id, lẫn lộn → trả 207, envelope ProblemDetail RFC 9457 có {{items[]}} từng id với {{status}}, {{code}}, {{retryable}}, (2) cập nhật OpenAPI spec, (3) contract test: 5 id (3 ok, 1 locked 409, 1 not found 404) → expect 207 với 5 items chi tiết. Kết quả: sau deploy, Datadog alert trên 207/4xx/5xx; HR thấy ngay "19: locked, 20: locked" trên UI; client không tự retry các id lỗi 409/404 vì đó là lỗi không retryable. Đây là minh chứng: status code là hợp đồng, không phải trang trí.

> Senior tip: viết contract test cho status code, ví dụ "5 id, 1 bị khóa, 1 không tồn tại, 3 hợp lệ → mong đợi 207 với đúng 5 mục chi tiết". Test này rẻ nhưng bắt được những regression lớn.`,
  follow: [
    'Khi nào trả 202 Accepted thay vì 207 cho delete batch?',
    'Client nên xử lý 207 như thế nào để UX tốt?',
    'Envelope error có nên dùng cho success response không?'
  ],
  tags: ['HTTP status', 'API contract', 'partial success', 'error envelope']
},
{
  id: 'microservices-045',
  topic: 'microservices',
  level: 'senior',
  q: 'Multi-tenancy rate limit & quota theo tenant: token bucket per-tenant trong Redis (Lua), tenant "noisy neighbor" toàn bộ native pool cần giới hạn; advisory nên trả 429 có Retry-After + bật X-RateLimit-*; riêng internal service calls có thể dùng circuit-breaker.',
  a: `**Tóm tắt:** dùng **token bucket theo tenant** lưu trong Redis, cập nhật bằng **Lua script** để "đọc–tính–ghi" là một thao tác nguyên tử, nhờ vậy một tenant ồn ào (noisy neighbor) không thể chiếm hết connection pool, thread và DB của mọi người. Khi vượt hạn mức trả **429 Too Many Requests** kèm **Retry-After** và các header **X-RateLimit-***; giới hạn đặt theo tier (Free/Pro/Enterprise). Với call nội bộ giữa các service, rate limit theo tenant ở gateway kết hợp **bulkhead + circuit breaker** theo dependency ở service.

### Hiểu nhanh
Mỗi tenant có một **xô đựng xu** (token bucket): xô chứa tối đa 100 xu, mỗi giây được nhỏ thêm 10 xu. Mỗi request phải bỏ ra 1 xu. Tenant dùng đều đặn thì luôn có xu; tenant bùng nổ một lúc thì được tiêu hết 100 xu dự trữ (burst), sau đó phải chờ xu nhỏ giọt thêm. Hết xu thì bị bảo "quay lại sau 2 giây" (429 + Retry-After). Nhờ mỗi tenant một xô riêng, tenant nghiện gọi API không làm cạn xu của tenant khác. Redis là **quầy giữ xô chung** cho mọi instance của service, và Lua script đảm bảo không ai "rút xu hai lần cùng lúc".

### Thuật ngữ
- **Rate limit / quota**: giới hạn tốc độ (request/giây) / giới hạn tổng lượng dùng trong một kỳ (request/tháng).
- **Token bucket**: thuật toán có dung lượng (capacity) và tốc độ nạp (refill rate), cho phép burst ngắn.
- **Noisy neighbor**: tenant dùng quá nhiều tài nguyên chung làm chậm tenant khác.
- **Lua script trong Redis**: script chạy nguyên tử trên server Redis, không lệnh nào khác chen vào giữa.
- **EVALSHA**: chạy script đã được nạp sẵn bằng mã SHA, tránh gửi lại cả script mỗi lần.
- **429 Too Many Requests**: status báo client đã gửi quá nhiều request.
- **Retry-After**: header cho biết client nên chờ bao lâu trước khi thử lại.
- **Fail-open / fail-closed**: khi bộ đếm không hoạt động thì cho qua / chặn hết.

### Token bucket trong Redis (từng bước)
1. **Key** theo tenant (và endpoint nếu cần): {{rl:<tenantId>:<endpoint>}} hoặc {{rl:<tenantId>:global}}.
2. **Lua script** lấy giờ của Redis, đọc số token và lần nạp cuối, cộng token theo thời gian trôi qua (không vượt capacity), trừ 1 nếu đủ, ghi lại. Vì sao Lua: nếu app tự GET rồi SET, hai instance cùng đọc "còn 1 token" và cùng cho qua.
3. **Kết quả** trả về: được phép hay không, token còn lại, số mili giây cần chờ.
4. **Gateway** dựa vào kết quả: cho qua, hoặc trả 429 với header.

~~~text
-- KEYS[1]=bucket key, ARGV[1]=capacity, ARGV[2]=refill token/giây
local cap  = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local t    = redis.call('TIME')                         -- giờ của Redis, tránh lệch đồng hồ giữa app
local now  = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local b    = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(b[1]) or cap
local ts     = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - ts) * rate / 1000)
local allowed, wait = 0, 0
if tokens >= 1 then tokens = tokens - 1; allowed = 1
else wait = math.ceil((1 - tokens) * 1000 / rate) end   -- ms, số nguyên (Redis cắt phần thập phân)
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 1000)
return {allowed, math.floor(tokens), wait}
~~~
- Nạp script một lần, gọi bằng {{EVALSHA}}. Không muốn tự viết: Spring Cloud Gateway có {{RequestRateLimiter}} với {{RedisRateLimiter}} (token bucket bằng Lua) và {{KeyResolver}} trả về tenantId; hoặc thư viện Bucket4j có backend Redis.

### Response khi bị giới hạn
~~~text
HTTP/1.1 429 Too Many Requests
Retry-After: 2
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735689600
{"code": "RATE_LIMITED", "retry_after": 2, "limit": 100}
~~~
- SDK của client phải tôn trọng Retry-After (thêm jitter), không retry ngay lập tức.

### Tier theo tenant
| Tier | Rate | Burst (capacity) |
|---|---|---|
| Free | 100 req/phút | 20 |
| Pro | 1.000 req/phút | 200 |
| Enterprise | 10.000 req/phút hoặc pool riêng | theo hợp đồng |
- Tier lưu trong cấu hình tenant (cache TTL 60s), đổi tier thì invalidate cache.
- Ngoài rate limit theo giây/phút, **quota** theo tháng (phục vụ billing) nên đếm riêng và chính xác hơn, có thể ghi bất đồng bộ vào DB.

### Call nội bộ và noisy neighbor ở tầng sâu
- Gateway giới hạn theo tenant; bên trong service, **bulkhead theo dependency** (và có thể theo tier) để tenant ồn ào không chiếm hết thread/connection pool.
- **Circuit breaker** cho call service-to-service để fail fast khi dependency yếu; nó bảo vệ dependency chứ không phân xử công bằng giữa tenant.
- Job nền nặng (export, báo cáo) của từng tenant chạy qua hàng đợi có giới hạn đồng thời theo tenant.

### Lỗi hay gặp
1. **Giới hạn theo IP thay vì tenant**. Triệu chứng: nhiều tenant sau cùng NAT bị chặn oan, còn một tenant dùng nhiều IP thì lách được. Cách tránh: key theo tenantId (và user nếu cần).
2. **Redis sập làm sập luôn API**. Triệu chứng: mọi request lỗi vì không gọi được bộ đếm. Cách tránh: chọn fail-open có alert, kèm giới hạn cục bộ tại từng instance làm dự phòng gần đúng.
3. **Nhầm đơn vị refill** (giây với phút). Triệu chứng: giới hạn thực tế lệch 60 lần so với cấu hình. Cách tránh: test tự động đếm số request được phép trong một khoảng thời gian.
4. **Chỉ có giới hạn tổng, không theo endpoint**. Triệu chứng: tenant dồn hết hạn mức vào endpoint export nặng, DB quá tải. Cách tránh: giới hạn riêng (chi phí cao hơn) cho endpoint đắt.

### Trả lời miệng 1 phút
"Tôi dùng token bucket theo tenant trong Redis, cập nhật bằng Lua script để đọc, tính và ghi là nguyên tử, lấy giờ từ Redis để tránh lệch đồng hồ giữa các instance. Capacity cho phép burst ngắn, refill rate là tốc độ bền vững, cả hai theo tier của tenant. Vượt hạn mức thì trả 429 kèm Retry-After và X-RateLimit headers để SDK client chờ đúng lúc. Trên Spring Cloud Gateway tôi có thể dùng RedisRateLimiter với KeyResolver theo tenant. Bên trong service, tôi thêm bulkhead theo dependency và circuit breaker để tenant ồn ào không chiếm hết pool. Trade-off là phụ thuộc Redis, nên tôi chọn fail-open có alert và giới hạn cục bộ dự phòng."

### Ví dụ đời thực
  Nền tảng API thanh toán cho 300 merchant (tenant), gateway Spring Cloud Gateway + Redis cluster 3 node. Merchant A (tier Free, 100 req/phút) bị competitor tấn công DDoS lộ API key, gửi 5.000 req/phút. Merchant B, C, D (cùng tier Free) dùng bình thường 50 req/phút. Triệu chứng: Redis CPU 95%, latency p99 gateway tăng từ 5ms lên 800ms; merchant B, C, D nhận 429 dù dùng đúng hạn mức. Điều tra: {{redis-cli INFO stats}} thấy {{total_commands_processed}} tăng 50 lần; {{SLOWLOG GET}} toàn {{EVALSHA}} rate limit script; key pattern {{rl:merchantA:*}} chiếm 90% key space. Nguyên nhân gốc: rate limit per-tenant hoạt động đúng (merchant A bị chặn), nhưng Redis đơn lẻ thành bottleneck chung; noisy neighbor làm cạn CPU Redis ảnh hưởng tenant khác. Xử lý: (1) tách Redis cluster: shard 0 cho tier Free/Pro, shard 1 cho Enterprise (đảm bảo isolation tài nguyên), (2) bật {{fail-open}} local bucket (Bucket4j in-memory) tại gateway instance: khi Redis timeout > 50ms, fallback sang local bucket capacity 10% tier limit, log warning, (3) alert Datadog: {{rate_limit.redis.latency.p99 > 100ms}} hoặc {{rate_limit.fallback.active > 0}}, (4) thu hồi API key bị lộ của merchant A, cấp key mới và báo cho merchant. Kết quả: Redis CPU giảm về 30%, p99 gateway 8ms; merchant B, C, D không còn bị 429 oan; traffic tấn công bị chặn ngay ở gateway sau khi key cũ bị thu hồi. Đây là minh chứng: rate limit per-tenant cần isolation tại hạ tầng (Redis shard) và fallback local, không chỉ logic thuật toán.

> Senior tip: đo tỉ lệ "request bị giới hạn / tổng request" theo tenant. Tenant nào thường xuyên bị 429 là tín hiệu cần nâng tier hoặc tối ưu client (batching, cache). Đừng chỉ chặn, hãy liên hệ với khách hàng.`,
  follow: [
    'Rate limit per-tenant vs per-user: khi nào cần cả hai?',
    'Redis Lua script có overhead thế nào so với check-then-set?',
    'Token bucket vs sliding window: chọn cái nào cho billing chính xác?'
  ],
  tags: ['rate limiting', 'multi-tenancy', 'Redis', 'token bucket', 'quota']
},
{
  id: 'microservices-046',
  topic: 'microservices',
  level: 'senior',
  q: 'Nghịch lý multi-tenant DB (không bắt buộc): so sánh chi phí vận hành & schema migration giữa "PG RLS", "schema-per-tenant", "database-per-tenant"; công thức nhỏ.',
  a: `**Tóm tắt:** nghịch lý là: **database-per-tenant** cô lập gần như hoàn hảo nhưng phải vận hành N database; **shared-schema** rẻ và một lần migration là xong nhưng an toàn phụ thuộc kỷ luật query; **RLS** của PostgreSQL là điểm giữa (chung bảng, có policy ở DB). Công thức đơn giản: chi phí vận hành tỉ lệ với **N (số tenant) × M (số migration) × thời gian mỗi lần**, cộng chi phí giám sát/backup cho mỗi DB; rủi ro rò dữ liệu thì tỉ lệ với **N tenant cùng chung một bảng**. Chọn theo số tenant, yêu cầu compliance và **năng lực vận hành của team**, thường là mô hình **lai** (hybrid).

### Hiểu nhanh
Ba cách cho thuê chỗ ở: **mỗi khách một căn nhà** (DB-per-tenant), **mỗi khách một căn hộ trong cùng tòa** (schema-per-tenant), **ký túc xá chung phòng có tủ khóa** (shared-schema + RLS). Nhà riêng an toàn nhất, nhưng nếu bạn chỉ có 2 người bảo trì mà phải lo 500 căn nhà, nhà nào cũng sẽ dột vì không ai kịp sửa: "cô lập hoàn hảo" trên giấy thành "kém an toàn" trên thực tế. Ký túc xá rẻ, sửa một lần cho cả tòa, nhưng chỉ cần một tủ khóa hỏng là đồ của mọi người có thể bị lấy. Người quản lý giỏi thường **cho khách VIP ở nhà riêng, khách thường ở ký túc xá có khóa tốt**.

### Thuật ngữ
- **DB-per-tenant**: mỗi tenant một database (thậm chí một instance) riêng.
- **Schema-per-tenant**: mỗi tenant một schema trong cùng database.
- **Shared-schema + tenant_id**: mọi tenant chung bảng, phân biệt bằng cột tenant_id.
- **RLS (Row-Level Security)**: policy ở PostgreSQL tự lọc dòng theo tenant cho mọi query.
- **N × M problem**: số lần chạy migration = số tenant × số migration.
- **Hybrid tenancy**: kết hợp nhiều mô hình theo tier của tenant.
- **AbstractRoutingDataSource**: DataSource của Spring chọn DataSource thật theo một key (ví dụ tier/tenant) lúc runtime.
- **Blast radius**: phạm vi ảnh hưởng khi có sự cố.

### Công thức nhỏ (từng bước)
1. **Chi phí migration** ≈ N × M × t (t = thời gian một lần chạy + xử lý lỗi). Shared-schema: N = 1.
2. **Chi phí vận hành cố định** ≈ số DB × (giám sát + backup + nâng cấp + connection pool).
3. **Rủi ro rò dữ liệu** ≈ số tenant chung bảng × xác suất có query thiếu filter; RLS làm xác suất này giảm mạnh.
4. **Năng lực team** là mẫu số: cùng một chi phí, team có automation tốt chịu được N lớn hơn nhiều.

~~~text
Schema-per-tenant: 100 tenant × 20 migration/tháng = 2.000 lần chạy/tháng
  mỗi lần 30s → ~17 giờ máy/tháng, 1% lỗi → ~20 tenant cần xử lý tay mỗi tháng
Shared-schema:     1 × 20 = 20 lần chạy/tháng, nhưng 1 query thiếu filter = lộ cả 100 tenant
DB-per-tenant:     100 DB × (backup + alert + nâng cấp version) → cần automation bắt buộc
~~~

### So sánh chi tiết
| Tiêu chí | DB-per-tenant | Schema-per-tenant | Shared + tenant_id | Shared + RLS |
|---|---|---|---|---|
| Cô lập | gần tuyệt đối (cả tài nguyên) | cao (dữ liệu), chung tài nguyên | logic | logic + policy ở DB |
| Chi phí hạ tầng | rất cao | cao | thấp | thấp |
| Migration | N × M | N × M | 1 × M | 1 × M + policy |
| Backup/restore 1 tenant | dễ (dump 1 DB) | dễ (dump 1 schema) | khó (lọc tenant_id) | khó |
| Xóa tenant (GDPR) | drop DB | drop schema | delete theo tenant_id | như shared |
| Query xuyên tenant (analytics) | khó (phải gom) | khó | dễ | dễ (role riêng bỏ qua RLS) |
| Noisy neighbor | không | có (chung instance) | có | có |
| Onboard tenant | cấp DB mới | tạo schema + migrate | insert một dòng | insert một dòng |

### Quyết định theo giai đoạn
1. **Khởi đầu** (ít tenant, compliance thấp): shared-schema + tenant_id, bật RLS sớm nếu dùng PostgreSQL; đơn giản và rẻ.
2. **Tăng trưởng** (vài trăm tenant, bắt đầu có khách yêu cầu audit): shared + RLS + test tự động chống rò; tách tenant lớn gây noisy neighbor sang pool/DB riêng.
3. **Enterprise** (khách lớn yêu cầu cô lập, data residency, SLA riêng): hybrid: tenant lớn có schema/DB riêng, tenant nhỏ ở shared; nhóm tenant theo schema version để migration chạy theo lô.

### Hybrid thực tế
- Router xác định tenant → tier → chọn DataSource; Spring dùng {{AbstractRoutingDataSource}} với key là tier/tenantId (key lấy từ tenant context đã được đặt ở filter).
- Hibernate 6 hỗ trợ multi-tenancy theo connection/schema ({{MultiTenantConnectionProvider}} + {{CurrentTenantIdentifierResolver}}) và theo cột ({{@TenantId}}).
- Migration: Flyway/Liquibase chạy theo từng schema/DB bằng job có danh sách tenant, chạy song song có giới hạn, ghi kết quả từng tenant.
- Giám sát tập trung có label tenant (Prometheus/Datadog), không phải N dashboard riêng.

### Lỗi hay gặp
1. **Router của hybrid chọn nhầm DataSource**. Triệu chứng: tenant enterprise ghi vào DB chung, hoặc đọc dữ liệu tenant khác. Cách tránh: test routing cho mọi tier, thiếu tenant context thì lỗi (fail-closed).
2. **Không có automation cho N × M**. Triệu chứng: mỗi đợt release mất cả ngày chạy migration, vài tenant lệch version. Cách tránh: job migration theo lô, theo dõi schema_version từng tenant, code tương thích nhiều version.
3. **Chọn DB-per-tenant "vì bảo mật" khi team nhỏ**. Triệu chứng: backup một số DB hỏng mà không ai biết, version lệch nhau. Cách tránh: chỉ tách khi có yêu cầu thật và đủ automation.
4. **N dashboard, N alert**. Triệu chứng: alert fatigue, bỏ sót sự cố thật. Cách tránh: giám sát tập trung theo label tenant, alert theo SLO.

### Trả lời miệng 1 phút
"Đây là trade-off giữa cô lập và chi phí vận hành. DB-per-tenant cô lập gần tuyệt đối, dễ backup và xóa tenant, nhưng migration là N nhân M và mỗi DB cần giám sát, backup riêng; với team nhỏ, điều đó thường làm hệ thống kém an toàn hơn. Shared-schema chỉ cần một lần migration nhưng một query thiếu filter là lộ mọi tenant, nên tôi bật RLS của PostgreSQL và có test tự động chống rò. Tôi chọn theo số tenant, compliance và năng lực team: bắt đầu shared cộng RLS, tách tenant lớn sang schema hoặc DB riêng khi có yêu cầu thật, dùng AbstractRoutingDataSource để định tuyến và job migration theo lô."

### Ví dụ đời thực
  SaaS quản trị bệnh viện 150 tenant: 140 bệnh viện tuyến huyện (tier Standard, shared-schema + RLS), 10 bệnh viện tuyến tỉnh (tier Enterprise, schema-per-tenant). Năm 2023, phát hành version 2.15 có migration {{ALTER TABLE patients ADD COLUMN insurance_id VARCHAR(20)}}. Triệu chứng: migration shared-schema xong 2 phút; 10 schema Enterprise chạy job Flyway song song 4 worker, 3 schema lỗi timeout (lock contention), 2 schema lệch phiên bản (bản ghi mới nhất trong {{flyway_schema_history}} là 2.14). Điều tra: Flyway log thấy {{canceling statement due to lock timeout}} trên {{patients}} (bảng 50M rows) ở 3 schema; 2 schema khác job bị kill OOM (container 512MB) do Java migration callback tải toàn bộ metadata. Nguyên nhân gốc: automation migration thiếu retry/backoff, resource limit quá thấp, không có kiểm tra phiên bản sau chạy. Xử lý: (1) tăng container migration 2GB, (2) Flyway config: {{lockRetryCount=60}}, {{outOfOrder=true}}, (3) job migration: chạy theo lô 3 schema/lô, chờ lô trước xong mới chạy lô sau, ghi kết quả từng schema vào bảng {{migration_audit}}, (4) test tự động: sau migration, với mỗi schema kiểm tra bản ghi thành công mới nhất trong {{flyway_schema_history}} đều là 2.16, (5) tenant Enterprise mới onboard: tạo schema, chạy Flyway baseline, add vào config routing. Kết quả: đợt sau migration 2.16 toàn 10 schema xong 8 phút, 0 lỗi, audit log đầy đủ. Đây là minh chứng: hybrid tenancy cần automation migration chặt (lô, retry, audit) chứ không chỉ chia schema.

> Senior tip: khi phỏng vấn, đừng trả lời "chọn DB-per-tenant cho an toàn"; hãy trả lời "chọn theo số tenant, compliance và năng lực vận hành; bắt đầu shared-schema + RLS, tách tenant lớn sang schema/DB riêng khi có bằng chứng (khách lớn yêu cầu, audit compliance)". Câu trả lời có trade-off và lộ trình chuyển đổi mới là câu trả lời senior.`,
  follow: [
    'Hybrid routing (enterprise DB riêng, SMB shared) có rủi ro gì và test thế nào?',
    'Migration automation cho schema-per-tenant: bạn dùng tool gì?',
    'Khi nào nên migrate từ shared-schema lên schema-per-tenant?'
  ],
  tags: ['multi-tenancy', 'database', 'cost', 'migration', 'RLS', 'schema-per-tenant']
},
{
  id: 'microservices-047',
  topic: 'microservices',
  level: 'senior',
  q: 'Kafka ghi mọi message xuống đĩa nhưng một broker vẫn chịu được hàng trăm MB/s. Hãy đi theo một record từ lúc tới leader đến lúc consumer đọc được: log segment, page cache, zero-copy, ISR, {{acks}} và {{min.insync.replicas}}. Cấu hình nào quyết định mất hay không mất dữ liệu?',
  a: `**Tóm tắt:** Kafka nhanh vì chỉ **append tuần tự** vào file segment, để **page cache của OS** làm bộ đệm thay vì heap JVM, gửi dữ liệu cho consumer bằng **zero-copy (sendfile)** và xử lý theo **batch nén**. Độ bền không đến từ fsync mà từ **replication**: với RF=3, {{acks=all}} và {{min.insync.replicas=2}}, một record chỉ được xác nhận khi ít nhất 2 replica trong ISR đã có nó, nên mất 1 broker không mất dữ liệu.

### 1. Partition là một thư mục chứa các segment
Mỗi partition trên đĩa là một thư mục, ví dụ {{orders-3/}}. Log được cắt thành nhiều **segment**; tên file là offset đầu tiên của segment:
~~~text
orders-3/
  00000000000000000000.log        <- dữ liệu (các record batch nối tiếp nhau)
  00000000000000000000.index      <- offset -> vị trí byte (index thưa)
  00000000000000000000.timeindex  <- timestamp -> offset
  00000000000005242880.log        <- segment đang ghi (active segment)
  00000000000005242880.index
~~~
- Chỉ **active segment** được ghi, luôn ghi ở cuối file nên là ghi tuần tự, HDD hay SSD đều chạy ở tốc độ cao nhất.
- Segment mới được tạo khi đạt {{segment.bytes}} (mặc định 1 GiB) hoặc {{segment.ms}} (mặc định 7 ngày).
- Retention và compaction làm việc trên **cả segment đã đóng**: xoá một file cũ rẻ hơn rất nhiều so với xoá từng dòng như database. Active segment không bị xoá, nên topic ít traffic có thể giữ dữ liệu lâu hơn {{retention.ms}}.
- Consumer muốn đọc offset 5.300.000: broker tìm segment có base offset lớn nhất mà nhỏ hơn hoặc bằng 5.300.000, tra {{.index}} để nhảy gần tới vị trí byte, rồi quét tiếp một đoạn ngắn.

### 2. Vì sao ghi xuống đĩa mà vẫn nhanh
1. **Page cache**: broker ghi vào file qua OS, dữ liệu nằm ở page cache (RAM do kernel quản lý), lệnh ghi trả về ngay mà **không fsync** từng message (mặc định Kafka để OS tự flush). Consumer đọc dữ liệu vừa ghi thì đọc thẳng từ RAM. Cache nằm ngoài heap nên không tạo áp lực GC, và restart broker cache vẫn còn.
2. **Batch**: producer gửi cả batch nhiều record; broker lưu nguyên batch (kể cả đã nén) xuống đĩa và gửi nguyên batch cho consumer. Không giải nén, không chuyển đổi.
3. **Zero-copy**: khi consumer fetch, broker dùng {{FileChannel.transferTo}} (Linux {{sendfile}}): dữ liệu đi từ page cache thẳng ra socket, không copy qua bộ nhớ ứng dụng.
~~~text
Đọc thông thường:  disk -> page cache -> heap JVM -> socket buffer -> NIC  (4 lần copy)
sendfile:          disk -> page cache ----------------------------> NIC   (không qua JVM)
~~~
4. **Song song theo partition**: mỗi partition là một log độc lập, có thể nằm trên broker khác nhau.

Lưu ý: bật **TLS** thì dữ liệu phải được mã hoá trong JVM trước khi gửi, nên không còn zero-copy. Đó là lý do CPU broker tăng rõ khi bật TLS.

### 3. Replication: ISR và high watermark
Mỗi partition có 1 **leader** và các **follower**. Follower chủ động gửi fetch request tới leader để kéo dữ liệu (giống một consumer).
- **ISR (in-sync replicas)**: tập replica bắt kịp leader. Follower không bắt kịp trong {{replica.lag.time.max.ms}} (mặc định 30 giây) bị loại khỏi ISR.
- **High watermark (HW)**: offset lớn nhất mà mọi replica trong ISR đã có. Consumer **chỉ đọc được tới HW**, nên không bao giờ thấy record có thể bị mất khi leader đổi.
~~~text
leader    : 0 1 2 3 4 5      (LEO = 6)
follower A: 0 1 2 3 4 5      (LEO = 6)
follower B: 0 1 2 3          (LEO = 4)
ISR = {leader, A, B}  =>  HW = 4  => consumer đọc được offset 0..3
~~~

### 4. acks và min.insync.replicas
| Cấu hình producer | Leader trả lời khi | Rủi ro |
|---|---|---|
| {{acks=0}} | không chờ gì | mất khi có bất kỳ lỗi mạng nào |
| {{acks=1}} | leader ghi vào log của nó | leader chết trước khi follower kịp copy: **mất** record đã được xác nhận |
| {{acks=all}} | mọi replica **trong ISR hiện tại** đã có | an toàn, nếu ISR không co lại còn 1 |

Điểm mấu chốt: {{acks=all}} nghĩa là "đủ ISR hiện tại", **không** phải "đủ RF". Nếu 2 follower bị loại khỏi ISR, ISR chỉ còn leader và {{acks=all}} lại giống {{acks=1}}. {{min.insync.replicas}} chặn trường hợp này: nếu ISR nhỏ hơn giá trị đó, broker từ chối ghi với lỗi {{NotEnoughReplicasException}}.

| RF | min.insync.replicas | Mất 1 broker | Mất 2 broker |
|---|---|---|---|
| 3 | 1 | vẫn ghi được, có thể mất dữ liệu nếu leader chết tiếp | vẫn ghi, rủi ro cao |
| 3 | **2** | **vẫn ghi, không mất dữ liệu** | ngừng nhận ghi (an toàn) |
| 3 | 3 | ngừng nhận ghi | ngừng nhận ghi |

~~~java
@Bean
NewTopic orders() {
    return TopicBuilder.name("orders")
        .partitions(12)
        .replicas(3)                                            // RF=3
        .config(TopicConfig.MIN_IN_SYNC_REPLICAS_CONFIG, "2")   // cần ít nhất 2 bản
        .build();
}
// producer: từ Kafka 3.0 mặc định acks=all và enable.idempotence=true
~~~
Thêm {{unclean.leader.election.enable=false}} (mặc định): không cho replica ngoài ISR lên làm leader, chấp nhận partition tạm offline thay vì mất dữ liệu âm thầm.

### Pitfall production
- Topic tự tạo (auto create) dùng {{default.replication.factor}} của broker, mặc định là **1**: một đĩa hỏng là mất topic. Tắt auto create hoặc đặt mặc định 3.
- Tính đĩa thiếu replication: ingress 50 MB/s, retention 7 ngày ≈ 50 × 86.400 × 7 ≈ 30 TB, nhân RF=3 thành khoảng **90 TB** trên toàn cluster, chưa tính dự phòng.
- Cấp heap JVM quá lớn cho broker (ví dụ 32 GB trên máy 64 GB) là lấy mất RAM của page cache. Broker thường chỉ cần heap vài GB, phần còn lại để OS cache.
- Consumer đọc dữ liệu cũ (replay vài ngày) không có trong page cache, phải đọc đĩa thật và đẩy dữ liệu nóng ra khỏi cache, làm producer và consumer realtime cùng chậm.

### Ví dụ đời thực
  Hệ thống xử lý đơn hàng sàn TMĐT: topic {{orders}} 24 partition, RF=3, ingress trung bình 80 MB/s, peak Black Friday 250 MB/s. Năm 2023 Black Friday, producer gửi {{orders}} với {{acks=all}}, {{min.insync.replicas=2}}. Triệu chứng: lúc 20:15 producer bắt đầu nhận {{NotEnoughReplicasException}}, p99 latency tăng từ 15ms lên 2s; consumer lag tăng từ 0 lên 1.2M messages. Điều tra: {{kafka-topics.sh --describe}} thấy partition 5, 11, 18 {{UnderReplicated}}; broker 3 disk I/O wait 95% (NVMe cũ), follower partition 5, 11, 18 trên broker 3 không bắt kịp leader, bị kick khỏi ISR sau 30s ({{replica.lag.time.max.ms}}); ISR co từ 3 xuống 2, {{min.insync.replicas=2}} vẫn cho ghi nhưng chỉ còn leader + 1 follower. lúc 20:18 broker 3 disk full (log retention chưa kịp xoá segment cũ), broker 3 dừng hẳn; cùng lúc follower thứ hai của các partition này (trên broker 5, đĩa cũng quá tải) rớt khỏi ISR, ISR chỉ còn leader, nhỏ hơn {{min.insync.replicas}} → broker từ chối ghi, producer nhận {{NotEnoughReplicasException}}. Nguyên nhân gốc: (1) capacity planning thiếu disk headroom cho peak × RF, (2) không alert {{UnderMinIsrPartitions}} sớm, (3) heap broker 16GB trên máy 32GB, page cache chỉ 16GB, đọc đĩa liên tục khi follower sync. Xử lý: (1) scale thêm 3 broker mới, reassign partition, (2) giảm heap broker xuống 4GB, để 28GB cho page cache, (3) đặt {{retention.bytes}} và {{retention.ms}} cùng dùng, alert khi đĩa broker vượt 70%, (4) alert Prometheus: {{kafka_server_replicamanager_underreplicatedpartitions > 0}} và {{kafka_server_replicamanager_underminisrpartitioncount > 0}} với threshold 0, (5) producer config {{delivery.timeout.ms=120000}}, {{retries=Integer.MAX_VALUE}}. Kết quả: Black Friday năm sau peak 300 MB/s, p99 25ms, 0 {{NotEnoughReplicasException}}, consumer lag < 1000. Đây là minh chứng: {{acks=all}} + {{min.insync.replicas=2}} chỉ an toàn khi ISR không co lại còn 1; page cache và disk capacity là yếu tố quyết định throughput thực tế.

### Trả lời mẫu khi phỏng vấn
"Kafka nhanh nhờ append-only segment file, page cache của OS làm buffer, và zero-copy sendfile tránh copy qua JVM heap. Độ bền không phải fsync mà là replication: RF=3, acks=all, min.insync.replicas=2 nghĩa là record chỉ ack khi leader và ít nhất 1 follower trong ISR đã ghi. High watermark đảm bảo consumer không đọc record có thể mất. Rủi ro lớn nhất là ISR co lại: nếu min.insync.replicas=1 thì lúc ISR còn 1, acks=all chẳng khác acks=1 và một broker chết là mất dữ liệu; với min.insync.replicas=2 thì partition ngừng nhận ghi thay vì mất dữ liệu. Production tôi gặp Black Friday disk full làm ISR co, producer nhận NotEnoughReplicasException. Giải pháp: giảm heap để nhường RAM cho page cache, alert UnderMinIsrPartitions > 0, capacity planning disk cho peak × RF."

> Senior tip: alert trên **UnderReplicatedPartitions > 0** và **UnderMinIsrPartitions > 0**; đó là tín hiệu sớm nhất trước khi producer bắt đầu nhận {{NotEnoughReplicasException}}. Khi benchmark, hãy so sánh throughput có và không có TLS, và đo p99 latency của {{acks=all}}, vì nó phụ thuộc follower chậm nhất trong ISR chứ không phải leader.`,
  follow: [
    'Vì sao Kafka không fsync từng message mà vẫn được coi là bền? Khi nào bạn vẫn cân nhắc flush thường xuyên hơn?',
    'ISR co lại còn 1 replica trong giờ cao điểm: producer, consumer và on-call nhìn thấy gì?',
    'Bật TLS làm CPU broker tăng gấp đôi, bạn phân tích và xử lý thế nào?'
  ],
  tags: ['Kafka', 'log segment', 'page cache', 'zero-copy', 'ISR', 'acks', 'min.insync.replicas', 'replication'],
  refs: [
    { type: 'doc', title: 'Kafka design: Persistence and efficiency', url: 'https://kafka.apache.org/documentation/#design' },
    { type: 'doc', title: 'Kafka design: Replication', url: 'https://kafka.apache.org/documentation/#replication' },
    { type: 'doc', title: 'Kafka topic configuration', url: 'https://kafka.apache.org/documentation/#topicconfigs' },
    { type: 'article', title: 'ZemIT: Kafka có phải queue thật và bạn vẫn', url: 'https://zemit.substack.com/p/kafka-a-co-queue-that-va-ban-van' }
  ]
},
{
  id: 'microservices-048',
  topic: 'microservices',
  level: 'senior',
  q: 'Producer gửi 20.000 event/giây, mỗi event 1 KB, nhưng throughput thấp và CPU broker cao vì quá nhiều request nhỏ. Bạn giải thích đường đi bên trong {{KafkaProducer}} (partitioner, record accumulator, sender thread) và tuning {{batch.size}}, {{linger.ms}}, nén, {{max.in.flight.requests.per.connection}} thế nào mà không làm mất thứ tự?',
  a: `**Tóm tắt:** {{send()}} không gửi ngay: record được serialize, chọn partition, rồi bỏ vào **batch theo partition** trong record accumulator; một **sender thread** riêng gom các batch đã đầy hoặc đã chờ đủ {{linger.ms}} thành request gửi tới broker. Tăng {{linger.ms}} (5–20 ms) và {{batch.size}} (64–256 KB) cộng nén {{lz4}}/{{zstd}} giúp ít request hơn, nén tốt hơn. Thứ tự vẫn đúng nhờ **idempotent producer** (mặc định từ Kafka 3.0) với tối đa 5 request in-flight.

### Đường đi của một record
~~~text
thread của bạn                                 sender thread (I/O)
send(record) --> serializer --> partitioner --> RecordAccumulator
                                                 orders-0: [batch đang đầy dần]
                                                 orders-1: [batch đủ] [batch]
                                                 orders-2: [batch đang chờ linger]
                                                        |
                                    gom batch theo broker leader, gửi ProduceRequest
                                    tối đa max.in.flight request chưa ack / kết nối
~~~
1. **Serializer** biến key/value thành byte.
2. **Partitioner**: có key thì chọn partition bằng hash murmur2 của key (cùng key cùng partition). **Không có key** thì từ Kafka 3.3 producer dùng chiến lược **sticky**: dồn record vào cùng một partition cho tới khi đầy batch rồi mới đổi partition, nên batch to hơn nhiều so với kiểu round-robin từng record.
3. **RecordAccumulator**: mỗi partition có một hàng đợi batch. Tổng bộ nhớ giới hạn bởi {{buffer.memory}} (mặc định 32 MB); đầy thì {{send()}} **block** tối đa {{max.block.ms}} (mặc định 60 s) rồi ném lỗi.
4. **Sender thread** lấy batch khi batch đầy {{batch.size}} hoặc đã chờ đủ {{linger.ms}}, gộp các batch cùng broker vào một request.

### Vì sao request nhỏ làm chậm
20.000 event/s × 1 KB = 20 MB/s. Nếu {{linger.ms}} gần 0 và traffic rải đều 12 partition, mỗi batch chỉ có vài record, broker phải xử lý hàng nghìn request/s, mỗi request tốn chi phí cố định (header, ghi log, replication, ack). Với {{linger.ms=10}}, mỗi 10 ms tích được khoảng 200 KB, chỉ còn vài chục request lớn mỗi giây. Nén cũng hiệu quả hơn vì JSON lặp lại tên field: batch càng to, tỉ lệ nén càng cao (giảm 3–5 lần là thường gặp với JSON, tuỳ dữ liệu).

| Tham số | Mặc định | Tăng lên thì |
|---|---|---|
| {{linger.ms}} | 5 ms từ Kafka 4.0 (0 ở bản cũ) | batch to hơn, thêm vài ms latency |
| {{batch.size}} | 16 KB | ít request hơn, tốn bộ nhớ hơn mỗi partition |
| {{compression.type}} | none | giảm băng thông và đĩa, tốn CPU producer |
| {{buffer.memory}} | 32 MB | chịu burst tốt hơn trước khi block |

~~~yaml
spring:
  kafka:
    producer:
      acks: all
      batch-size: 131072          # 128 KB
      compression-type: zstd      # hoặc lz4 nếu muốn ít CPU hơn
      properties:
        linger.ms: 10
        delivery.timeout.ms: 120000   # tổng thời gian cho phép, gồm cả retry
~~~

### Thứ tự và max.in.flight.requests.per.connection
Không có idempotence, retry có thể đảo thứ tự:
~~~text
request 1 (offset dự kiến 100-199) -> timeout, sẽ retry
request 2 (200-299)                -> thành công, ghi trước
request 1 retry                    -> ghi sau  => thứ tự bị đảo
~~~
**Idempotent producer** ({{enable.idempotence=true}}) gán cho producer một **producer id** và mỗi batch một **sequence number** theo partition. Broker chỉ chấp nhận batch có sequence đúng thứ tự kế tiếp, batch trùng thì bỏ qua. Nhờ vậy vẫn giữ thứ tự khi {{max.in.flight.requests.per.connection}} tới 5 (mặc định 5) và retry không tạo bản trùng.

Từ Kafka 3.0 idempotence bật mặc định, nhưng nó **tự tắt** nếu bạn đặt cấu hình xung đột mà không bật idempotence tường minh, ví dụ {{acks=1}}. Nên khai báo rõ {{enable.idempotence=true}} và {{acks=all}}.

Transaction ({{transactional.id}}) đi xa hơn: ghi nhiều partition và commit offset consumer một cách nguyên tử, dùng cho consume-transform-produce trong Kafka. Nó tăng latency và chỉ bao phủ dữ liệu trong Kafka.

### Pitfall production
- Gọi {{send(...).get()}} cho từng record: biến producer thành đồng bộ, mỗi record chờ một vòng ack, throughput rơi xuống vài trăm/s. Trong Spring Kafka 3.x, {{KafkaTemplate.send}} trả {{CompletableFuture}}: xử lý kết quả bằng callback.
- Làm việc nặng hoặc gọi blocking trong callback: callback chạy trên sender thread, chặn nó là chặn mọi batch.
- Bỏ qua callback lỗi: sau {{delivery.timeout.ms}} record bị bỏ và chỉ báo qua callback. Không log thì mất dữ liệu âm thầm.
- Một key quá nóng: batching không cứu được vì mọi record dồn vào một partition, giới hạn bởi một leader.

### Ví dụ đời thực
  Hệ thống sự kiện real-time: topic {{user-activity}} 24 partition, producer Spring Kafka gửi khoảng 20.000 event/s, mỗi event JSON 1 KB (khoảng 20 MB/s). Producer dùng cấu hình mặc định của Kafka 3.x: {{linger.ms=0}} (Kafka 4.0 đổi mặc định thành 5), {{batch.size=16384}}, không nén. Triệu chứng: CPU broker 85%, p99 producer latency 350ms dù băng thông mạng còn dư nhiều. Điều tra: metric producer {{request-rate}} khoảng 18.000 request/s, {{records-per-request-avg}} khoảng 1,1, {{batch-size-avg}} chỉ khoảng 1,2 KB. Nguyên nhân gốc: với {{linger.ms=0}}, sender thread gửi ngay khi có record nên batch gần như rỗng; mỗi request tốn chi phí cố định (header, xử lý request, replication) nên 18.000 request/s làm broker bận. Xử lý: (1) {{linger.ms=10}}, {{batch.size=131072}}, {{compression.type=zstd}}, (2) giữ {{acks=all}}, {{enable.idempotence=true}}, {{max.in.flight.requests.per.connection=5}}, {{delivery.timeout.ms=120000}}, (3) alert khi {{records-per-request-avg < 5}}. Kết quả: request-rate giảm còn khoảng 1.300 request/s (mỗi request khoảng 15 record), dữ liệu qua mạng giảm khoảng 70% nhờ zstd nén JSON, CPU broker 40%, p99 latency 45ms; load test cho thấy cùng cụm chịu được gấp 4 lần tải hiện tại. Đây là minh chứng: batching là chính, linger.ms và compression là hai nút điều chỉnh giúp request lớn hơn và ít hơn.

### Trả lời mẫu khi phỏng vấn
  "Kafka producer không gửi record ngay; nó serialize, partitioner chọn partition (có key thì hash murmur2, không key thì sticky từ Kafka 2.4 trở đi), rồi bỏ vào RecordAccumulator — mỗi partition một hàng đợi batch. Một sender thread riêng lấy batch khi đủ batch.size hoặc đã chờ linger.ms, gộp các batch cùng broker leader thành ProduceRequest gửi đi. Với 20.000 event/s × 1 KB, nếu linger.ms gần 0 thì mỗi request chỉ có 1–2 record, broker phải xử lý 18.000 request/s, mỗi request tốn header/TCP/ack/replication — CPU broker tăng và latency cao. Tôi tăng linger.ms lên 10 ms, batch.size 128 KB, bật zstd: request-rate giảm từ 18.000 xuống khoảng 1.300/s, mỗi request mang khoảng 15 record, CPU broker giảm một nửa, p99 latency từ 350ms xuống 45ms. Thứ tự vẫn giữ nhờ idempotent producer với producer id + sequence number per partition, broker bỏ qua batch trùng, nên retry và max.in.flight=5 không làm mất thứ tự. Trade-off: tăng linger thêm vài ms latency, đổi lấy throughput và CPU broker thấp hơn. Production tôi đo records-per-request-avg và batch-size-avg: mỗi request chỉ 1–2 record là dấu hiệu linger quá nhỏ."

> Senior tip: đo bằng metric producer {{batch-size-avg}}, {{records-per-request-avg}}, {{record-queue-time-avg}} và {{compression-rate-avg}} trước và sau khi tuning. Batch trung bình chỉ vài KB là dấu hiệu linger quá nhỏ; queue time tăng sát {{delivery.timeout.ms}} là dấu hiệu broker hoặc mạng đang nghẽn, tăng batch không giải quyết được.`,
  follow: [
    'Vì sao sticky partitioner chỉ áp dụng cho record không có key?',
    'buffer.memory đầy và send() bắt đầu block: bạn xử lý ở tầng API thế nào?',
    'Khi nào bạn chấp nhận tắt idempotence hoặc giảm acks để lấy latency?'
  ],
  tags: ['Kafka', 'producer', 'batch.size', 'linger.ms', 'sticky partitioner', 'idempotent producer', 'compression'],
  refs: [
    { type: 'doc', title: 'Kafka producer configuration', url: 'https://kafka.apache.org/documentation/#producerconfigs' },
    { type: 'doc', title: 'Kafka design: The Producer', url: 'https://kafka.apache.org/documentation/#theproducer' },
    { type: 'doc', title: 'Kafka design: Message delivery semantics', url: 'https://kafka.apache.org/documentation/#semantics' },
    { type: 'article', title: 'ZemIT: Kafka có phải queue thật và bạn vẫn', url: 'https://zemit.substack.com/p/kafka-a-co-queue-that-va-ban-van' }
  ]
},
{
  id: 'microservices-049',
  topic: 'microservices',
  level: 'lead',
  q: 'Team muốn dùng Kafka làm hàng đợi job (gửi email, render PDF, mỗi job 1–60 giây) vì "đã có sẵn Kafka". Vì sao consumer group truyền thống không hợp với work queue? Queues for Kafka (share group, KIP-932) giải quyết được gì và còn hạn chế gì?',
  a: `**Tóm tắt:** Consumer group gán **cả partition cho một consumer** và chỉ lưu **một offset** cho mỗi partition, nên một job chậm chặn mọi job phía sau (head-of-line blocking), số worker tối đa bằng số partition, và không có ack/retry/hẹn giờ cho từng message. **Share group** (KIP-932) cho nhiều consumer cùng lấy record từ một partition và xác nhận **từng record**, nhưng không giữ thứ tự, và tính năng mới ở Kafka 4.x nên phải kiểm tra trạng thái phát hành trước khi dùng production.

### Vấn đề 1: head-of-line blocking theo partition
~~~text
partition 3:  [job A: 60s] [job B: 1s] [job C: 1s] [job D: 1s] ...
consumer-3 :   đang xử lý A ......................... B, C, D phải chờ
consumer-5 :   partition 5 trống, rảnh tay nhưng không được lấy việc ở partition 3
~~~
Một partition chỉ có **một** consumer trong group. Job A render PDF 60 giây thì B, C, D chờ đủ 60 giây, dù các worker khác đang rảnh.

### Vấn đề 2: scale bị giới hạn bởi số partition
12 partition thì tối đa 12 consumer có việc; pod thứ 13 ngồi chơi. Job trung bình 2 giây thì throughput tối đa khoảng 12 / 2 = **6 job/s**. Muốn 100 job/s cần khoảng 200 luồng xử lý song song: hoặc tăng lên hàng trăm partition (tốn tài nguyên broker, không giảm lại được), hoặc tự xử lý song song trong consumer, khi đó phải tự theo dõi offset nào đã xong.

### Vấn đề 3: offset là một con trỏ, không phải ack từng message
Offset commit nghĩa là "mọi record trước offset này đã xong". Nếu record 100 lỗi còn 101–150 đã xong, bạn **không** commit qua 100 được. Consumer crash thì 101–150 bị xử lý lại. Không có khái niệm "trả job này về hàng đợi sau 5 phút". Retry, delay, DLQ phải tự xây: retry topic, DLT (Spring Kafka {{@RetryableTopic}}, {{DeadLetterPublishingRecoverer}}), mỗi thứ thêm topic, thêm consumer, thêm chỗ có thể hỏng.

| Nhu cầu work queue | Consumer group | Broker hàng đợi (RabbitMQ, SQS) |
|---|---|---|
| Worker rảnh lấy việc bất kỳ | không, gắn theo partition | có |
| Ack/nack từng message | không, chỉ commit offset | có |
| Retry sau X phút, DLQ | tự làm bằng topic phụ | có sẵn (DLX, redrive policy) |
| Scale worker tự do | tối đa = số partition | có |
| Giữ thứ tự theo key | **có** | hạn chế |
| Replay lại job cũ | **có** | không (đã ack là mất) |

### Share group (Queues for Kafka, KIP-932)
Ý tưởng: thêm loại group mới, nơi các consumer **chia nhau từng record** thay vì chia partition.
- Nhiều consumer cùng đọc một partition; số consumer **có thể lớn hơn số partition**.
- Broker cho consumer **mượn (acquire)** record kèm một khoá có thời hạn. Hết hạn mà chưa xác nhận thì record được giao cho consumer khác, giống visibility timeout của SQS.
- Consumer xác nhận từng record: **ACCEPT** (xong), **RELEASE** (trả lại để giao lại), **REJECT** (không xử lý được, không giao lại).
- Broker đếm **số lần giao** mỗi record; vượt giới hạn thì record bị bỏ qua (archive), chống poison message lặp vô hạn.
- Client Java mới: {{KafkaShareConsumer}}.

Trạng thái phát hành: early access ở Kafka 4.0, preview ở 4.1. Trước khi dùng production, đọc release notes và tài liệu đúng phiên bản cluster của bạn để biết đã ổn định chưa và cấu hình bật tính năng.

### Hạn chế cần nói rõ khi phỏng vấn
- **Không có thứ tự**: record cùng key có thể được xử lý đồng thời bởi hai consumer. Cần thứ tự theo key thì vẫn dùng consumer group.
- Số record đang được mượn trên mỗi partition có giới hạn, nên partition vẫn là đơn vị giới hạn ở mức nào đó.
- Record bị REJECT hoặc vượt số lần giao chỉ bị bỏ qua; ở thiết kế ban đầu **không** tự chuyển sang DLQ, bạn vẫn phải tự ghi lại job lỗi để điều tra.
- Không có hẹn giờ giao (delay) hay priority như broker hàng đợi chuyên dụng.
- Không thay thế transaction exactly-once của consumer group; xử lý vẫn là at-least-once, handler phải idempotent.
- Hệ sinh thái (framework, monitoring, managed service) cần thời gian để hỗ trợ đầy đủ.

### Khuyến nghị
- Job đã là **event trong Kafka** (ví dụ order-created kích hoạt gửi email), job ngắn và đều: consumer group + xử lý song song có giới hạn + retry topic là đủ.
- Job dài, thời gian không đều, cần retry/delay/DLQ: dùng broker hàng đợi (SQS, RabbitMQ) hoặc bảng job trong DB; có thể dùng Kafka làm nguồn và một bridge đẩy sang queue.
- Cluster Kafka đã lên bản có share group ổn định và chấp nhận mất thứ tự: share group là lựa chọn đáng thử, bớt một hệ thống phải vận hành.

### Ví dụ đời thực
Một hệ thống xuất PDF nhận 25 job/s vào topic {{pdf-jobs}} có 12 partition, nhưng duration xử lý lệch từ 2 đến 55 giây. Giờ cao điểm, p95 duration chờ tăng từ 20 giây lên 9 phút dù cụm có 24 pod. Lệnh {{kafka-consumer-groups.sh --bootstrap-server broker:9092 --describe --group pdf-workers}} cho thấy lag dồn vào P3 và P7; log ứng dụng ghi nhận hai job 52 và 48 giây ở đầu hai partition này. Chỉ 12 pod được gán partition, 12 pod còn lại không có việc. Nguyên nhân gốc là head-of-line blocking và giới hạn song song theo partition, không phải broker thiếu CPU. Team chuyển phần render sang SQS để mỗi worker nhận job độc lập, dùng visibility timeout lớn hơn p99 duration render và redrive policy đưa job lỗi sang DLQ; Kafka vẫn giữ event nghiệp vụ. Với 36 worker, p95 chờ còn 28 giây, backlog 8.400 job hết sau 11 phút và không còn pod rảnh do thiếu partition.

### Trả lời mẫu khi phỏng vấn
"Tôi sẽ không mặc định coi Kafka là work queue chỉ vì hệ thống đã có Kafka. Trong consumer group, một partition chỉ thuộc về một consumer, còn offset commit đại diện cho toàn bộ tiến trình trước offset đó. Vì vậy, một PDF mất 60 giây có thể chặn nhiều job một giây phía sau, và số worker hữu dụng không vượt quá số partition. Nếu tôi tự xử lý song song rồi commit offset lớn nhất, tôi còn có nguy cơ bỏ qua job chưa hoàn tất hoặc phải xử lý lại cả một khoảng message khi crash. Share group của KIP-932 giải quyết phần lớn khoảng trống này: nhiều consumer cùng acquire record trên một partition và xác nhận từng record bằng ACCEPT, RELEASE hoặc REJECT. Đổi lại, tôi mất ordering theo key, vẫn phải thiết kế handler idempotent và chưa có delay hay priority như hàng đợi chuyên dụng. Trên production, tôi sẽ đo phân phối duration job, lag theo partition và nhu cầu retry trước khi chọn. Job ngắn, đều và cần replay có thể ở lại consumer group. Job dài, duration biến động và cần delayed retry thì tôi ưu tiên SQS hoặc RabbitMQ; share group chỉ là phương án khi phiên bản Kafka, công cụ giám sát và kinh nghiệm vận hành của team đã sẵn sàng."

> Senior tip: khi team nói "đã có sẵn Kafka", hãy hỏi lại 3 câu: job dài nhất bao lâu, có cần thứ tự không, và job lỗi thì ai xử lý. Tôi từng thấy một topic 6 partition chứa job xuất Excel 3 phút: một sáng thứ Hai 200 người cùng bấm xuất, thời gian chờ lên 1 tiếng trong khi 20 pod khác ngồi chơi; chuyển sang SQS với 20 worker là hết.`,
  follow: [
    'Bạn tự xử lý song song trong một consumer thế nào mà vẫn commit offset an toàn?',
    'Share group và SQS visibility timeout giống và khác nhau ở điểm nào?',
    'Khi nào bạn vẫn chọn consumer group cho job dù có share group?'
  ],
  tags: ['Kafka', 'work queue', 'share group', 'KIP-932', 'head-of-line blocking', 'retry', 'DLQ'],
  refs: [
    { type: 'article', title: 'ZemIT: Kafka có phải queue thật và bạn vẫn', url: 'https://zemit.substack.com/p/kafka-a-co-queue-that-va-ban-van' },
    { type: 'doc', title: 'KIP-932: Queues for Kafka', url: 'https://cwiki.apache.org/confluence/display/KAFKA/KIP-932%3A+Queues+for+Kafka' },
    { type: 'doc', title: 'Kafka documentation', url: 'https://kafka.apache.org/documentation/' }
  ]
}
,
{
  id: 'microservices-050',
  topic: 'microservices',
  level: 'lead',
  q: 'Bạn cấu hình Kafka topic thanh toán với {{replication.factor=3}}, {{acks=all}}, {{min.insync.replicas=2}}. Hãy giải thích cơ chế replication từng bước: leader/follower, ISR, high watermark, và những kịch bản nào vẫn có thể **mất dữ liệu đã ack** hoặc **mất dữ liệu chưa kịp ack**?',
  a: `**Tóm tắt:** Mỗi partition có 1 **leader** (nhận đọc/ghi) và các **follower** sao chép log từ leader; **ISR** (In-Sync Replicas) là tập replica đang bắt kịp leader. Với {{acks=all}} + {{min.insync.replicas=2}}, producer chỉ nhận ack khi leader và ít nhất 1 follower khác đã ghi vào log cục bộ. **High watermark** (HWM) là offset cao nhất mà mọi replica trong ISR đã có; consumer chỉ đọc tới HWM. Mất dữ liệu đã ack vẫn xảy ra nếu {{unclean.leader.election.enable=true}} và mọi ISR chết, buộc bầu một follower lạc hậu làm leader.

### Hiểu nhanh (ví dụ đời thường)
Hãy tưởng tượng một **sổ cái** ở quầy thu ngân (leader). Có 2 nhân viên khác (follower) ngồi chép lại từng dòng vào sổ phụ của mình. Chỉ khi **ít nhất 1 nhân viên chép phụ xác nhận đã ghi** (acks=all, min ISR=2 nghĩa là leader + 1 follower) thì thu ngân mới nói "đã nhận tiền" với khách. Khách chỉ được phép đọc báo cáo tới dòng mà **các replica trong ISR đều đã có** (high watermark), vì dòng chỉ leader có có thể biến mất nếu leader bị hỏng.

### Thuật ngữ (giải thích lần đầu)
- **Replica**: bản sao của một partition (một phần của topic), mỗi bản nằm trên một broker (máy chủ Kafka) khác.
- **Leader**: replica duy nhất xử lý mọi request đọc/ghi của partition đó.
- **Follower**: replica chỉ sao chép (fetch - kéo dữ liệu) từ leader, không phục vụ client trực tiếp.
- **ISR (In-Sync Replicas)**: tập replica (gồm leader) mà độ trễ sao chép nằm trong ngưỡng {{replica.lag.time.max.ms}} (mặc định 30 giây). Follower quá chậm bị đuổi khỏi ISR.
- **HW (High Watermark)**: offset lớn nhất mà **tất cả** replica trong ISR đã ghi; dữ liệu trên HW chưa "committed" với consumer.
- **LEO (Log End Offset)**: offset kế tiếp sẽ ghi trên từng replica.
- **Unclean leader election**: cho phép bầu leader từ replica **không** thuộc ISR (có thể thiếu dữ liệu) - đánh đổi an toàn dữ liệu lấy tính sẵn sàng.

### Bên trong: dữ liệu trông thế nào
Mỗi replica là một **log** (chuỗi file segment trên đĩa, ghi nối đuôi - append-only), mỗi message có offset tăng dần:
~~~text
Broker 1 (Leader,  P0)  LEO=105  HW=102:  [98][99][100][101][102][103][104]
Broker 2 (Follower,P0)  LEO=103  HW=102:  [98][99][100][101][102][103]      (đang fetch 104)
Broker 3 (Follower,P0)  LEO=102  HW=102:  [98][99][100][101][102]           (chậm -> sắp bị đuổi ISR)

ISR = {Broker1, Broker2} (Broker3 lag > 30s -> bị loại)
Consumer chỉ thấy tới offset 102 (HW). Offset 103,104 chưa "commit".
~~~

### Chuyện gì xảy ra theo thứ tự (produce với acks=all)
1. Producer gửi batch tới **leader** của partition.
2. Leader append vào log cục bộ (LEO leader tăng).
3. Follower liên tục gửi **Fetch request** tới leader (cơ chế giống consumer nội bộ), leader trả về dữ liệu mới.
4. Mỗi follower append vào log cục bộ, báo lại vị trí đã bắt kịp.
5. Leader tính **HW = min(LEO của mọi replica trong ISR)**. Vì sao lấy min? Chỉ offset mà *mọi* ISR đều có mới an toàn nếu leader chết.
6. Khi HW >= offset của batch producer gửi **và** số replica trong ISR >= {{min.insync.replicas}}, leader trả **ack** cho producer.
7. HW mới được lan truyền cho follower trong fetch response tiếp theo.

~~~seq
title: Produce acks=all, min.insync.replicas=2 (RF=3)
actors: Producer | Leader(B1) | Follower(B2) | Follower(B3)
Producer -> Leader(B1): Produce(batch, acks=all)
Leader(B1) -> Leader(B1): append log, LEO=105
Follower(B2) -> Leader(B1): Fetch(offset=103)
Leader(B1) --> Follower(B2): data [103..104]
Follower(B2) -> Follower(B2): append, LEO=105
Follower(B3) -> Leader(B1): Fetch(offset=102)
Leader(B1) --> Follower(B3): data [102..104] (chậm)
Leader(B1) -> Leader(B1): ISR={B1,B2}, HW=min(105,105)=105
Leader(B1) --> Producer: ack (HW>=batch, ISR>=2)
note Leader(B1)..Follower(B3): B3 lag quá 30s -> bị loại khỏi ISR, không chặn ack
~~~

### Mất dữ liệu xảy ra khi nào? (bảng kịch bản)
| Kịch bản | Cấu hình | Kết quả | Vì sao |
|---|---|---|---|
| Leader chết, ISR còn follower bắt kịp | {{acks=all}}, {{min.insync.replicas=2}}, {{unclean.leader.election.enable=false}} | **Không mất** dữ liệu đã ack | Leader mới bầu từ ISR, ISR đã có >= HW |
| Leader chết, mọi follower đều bị loại khỏi ISR; unclean **tắt** | như trên, {{unclean=false}} | Partition **ngừng ghi** (producer lỗi {{NotEnoughReplicas}}), **không mất** | Kafka ưu tiên an toàn, chấp nhận không sẵn sàng |
| Leader chết, mọi follower bị loại khỏi ISR; unclean **bật** | {{unclean.leader.election.enable=true}} | **Mất** dữ liệu đã ack | Bầu follower lạc hậu (LEO thấp) làm leader, HW bị cắt xuống LEO của nó; dữ liệu leader cũ có nhưng follower mới không có bị mất vĩnh viễn |
| {{acks=1}} (chỉ leader ack) | {{acks=1}} | **Mất** dữ liệu đã ack nếu leader chết trước khi follower fetch | Producer nghĩ thành công nhưng chỉ leader có bản ghi |
| {{acks=all}} nhưng {{min.insync.replicas=1}} | mặc định nguy hiểm | **Mất** nếu leader (ISR chỉ còn nó) chết sau ack, trước khi follower kịp chép | "all" lúc đó chỉ là leader |
| {{acks=0}} | fire-and-forget | **Mất** im lặng | Producer không chờ, không biết lỗi |

### Trade-off mà Kafka chọn
- {{unclean.leader.election.enable}} (cần kiểm tra broker config): **false** = ưu tiên **durability** (không mất), chấp nhận downtime; **true** = ưu tiên **availability**, chấp nhận mất.
- {{min.insync.replicas}} cao (2 với RF=3) tăng an toàn nhưng giảm khả năng ghi khi broker hỏng. Điểm cân bằng kinh điển: RF=3, minISR=2 chịu được 1 broker chết mà vẫn ghi an toàn.

### Trên production
- **Triệu chứng:** producer thấy {{NotEnoughReplicasException}}/{{NotEnoughReplicasAfterAppendException}} -> ISR đang < minISR (broker chậm, GC dài, đĩa đầy). Consumer lag tăng đột ngột sau failover -> nghi unclean election.
- **Đo:** metric {{kafka.server:type=ReplicaManager,name=UnderReplicatedPartitions}} (phải = 0), {{IsrShrinksPerSec}}/{{IsrExpandsPerSec}}, {{UncleanLeaderElectionsPerSec}} (**phải luôn = 0** trên hệ thống quan trọng).
- **Tuning/cấu hình có thật:** {{replication.factor=3}}, {{min.insync.replicas=2}}, {{unclean.leader.election.enable=false}}, producer {{acks=all}}, {{enable.idempotence=true}}. Đặt {{replica.lag.time.max.ms}} đủ lớn để tránh ISR flap do GC tạm thời (mặc định 30s thường ổn; đừng hạ thấp bừa).

~~~text
# Kiểm tra nhanh (kafka-topics.sh --describe)
Topic: payments  Partition: 0  Leader: 1  Replicas: 1,2,3  Isr: 1,2
# Isr thiếu 3 -> broker 3 đang lag; nếu leader 1 chết lúc này, chỉ 2 lên thay -> vẫn an toàn (minISR=2)
~~~

### Ví dụ đời thực
Topic {{payments}} có ba replica trên B1, B2, B3, dùng {{acks=all}} và {{min.insync.replicas=2}}. B3 chậm đĩa nên rời ISR; {{kafka-topics.sh --bootstrap-server broker:9092 --describe --topic payments}} lúc đó báo {{Replicas: 1,2,3}} nhưng {{Isr: 1,2}}. Một sự cố nguồn làm B1 và B2 cùng mất kết nối, trong khi cấu hình {{unclean.leader.election.enable=true}} cho phép B3 lên leader. Sau failover, 180 giao dịch đã được producer báo thành công nhưng không còn trên leader mới; metric {{UncleanLeaderElectionsPerSec}} tăng từ 0 lên 1 là dẫn chứng xác nhận đường bầu leader không sạch. Nguyên nhân gốc là ưu tiên availability khi không còn ISR, chứ không phải {{acks=all}} hoạt động sai. Team tạm chặn ghi, đối soát eventId với nguồn nghiệp vụ để khôi phục có kiểm soát, rồi tắt unclean election và alert khi ISR co lại. Bài kiểm thử lặp lại sự cố cho thấy partition từ chối ghi bằng {{NotEnoughReplicas}} thay vì mất dữ liệu đã ack; hệ thống chấp nhận 4 phút gián đoạn để giữ RPO bằng 0 cho bản ghi đã xác nhận.

### Trả lời mẫu khi phỏng vấn
"Với replication factor bằng ba, mỗi partition có một leader nhận ghi và hai follower liên tục fetch dữ liệu từ leader. ISR là tập replica đang bắt kịp; high watermark là ranh giới dữ liệu đã có trên mọi replica trong ISR và consumer không đọc vượt ranh giới đó. Khi tôi dùng acks=all với min.insync.replicas=2, toàn bộ ISR hiện tại phải ghi nhận batch và ISR phải có ít nhất hai replica trước khi producer nhận ack. Cấu hình này chịu được mất một replica đang trong ISR mà không mất bản ghi đã xác nhận. Một điểm hay bị bỏ sót là unclean leader election: nếu mọi ISR cùng mất và Kafka được phép chọn replica lạc hậu, leader mới có thể thiếu các offset đã ack, nên dữ liệu bị mất thật. Ngược lại, nếu tắt unclean election, partition sẽ ngừng phục vụ ghi khi không đủ replica an toàn; producer phải retry hoặc backpressure, không được fail-open. Trên production, tôi theo dõi UnderReplicatedPartitions, biến động ISR và UncleanLeaderElectionsPerSec, idempotence cũng được bật để retry không tạo duplicate. Tôi chọn đánh đổi availability lấy durability cho thanh toán, nhưng vẫn cần runbook vì acks=all không thay thế backup, đối soát hay kiểm thử failover."

> Senior tip: trên cụm thanh toán/log audit, tôi đặt alert cứng {{UncleanLeaderElectionsPerSec > 0}} và coi đó là incident severity cao, vì nó đồng nghĩa có thể đã mất dữ liệu committed. Đồng thời theo dõi {{UnderReplicatedPartitions}} liên tục; URP > 0 kéo dài nghĩa là bạn đang sống nhờ "1 bản sao cuối" — một broker nữa là outage hoặc mất dữ liệu.`,
  follow: ["Nếu {{min.insync.replicas=2}} mà 2 broker chết cùng lúc, producer nhận lỗi gì và ứng dụng nên xử lý ra sao (retry, buffer, fail open/close)?", "High watermark khác gì {{log.end.offset}}? Vì sao consumer không được đọc vượt HW?", "Follower fetching về bản chất giống consumer poll. Thiết kế này giúp Kafka đạt throughput cao như thế nào so với leader chủ động push?"],
  tags: ["Kafka", "replication", "ISR", "acks", "min.insync.replicas", "high watermark", "unclean leader election"],
  refs: [{"type": "doc", "title": "Kafka: Replication", "url": "https://kafka.apache.org/documentation/#replication"}, {"type": "doc", "title": "Kafka design: Message delivery semantics", "url": "https://kafka.apache.org/documentation/#semantics"}]
},
{
  id: 'microservices-051',
  topic: 'microservices',
  level: 'senior',
  q: 'Giải thích cơ chế **idempotent producer** ({{PID}}, sequence number, epoch) và **Kafka transactions** (read-process-write exactly-once). Khi nào EOS vẫn **không** đảm bảo exactly-once end-to-end, đặc biệt khi có side effect ra ngoài Kafka (gọi REST, ghi DB)?',
  a: `**Tóm tắt:** Idempotent producer gán mỗi producer một **PID** (Producer ID) và đánh **sequence number** tăng dần cho từng (PID, partition); broker chỉ chấp nhận sequence đúng kế tiếp nên retry không tạo bản trùng. Kafka **transactions** mở rộng điều này: dùng {{transactional.id}} + **transaction coordinator** để ghi nguyên tử vào nhiều partition và commit offset consumer (read-process-write), đạt exactly-once **trong phạm vi Kafka**. Nhưng nếu bước xử lý gọi REST/ghi DB/email, Kafka không kiểm soát được side effect đó — retry vẫn có thể thực hiện side effect hai lần.

### Hiểu nhanh (ví dụ đời thường)
- **Idempotent producer** giống **đánh số trang** khi fax: trang 1,2,3. Nếu máy gửi tưởng mất trang 2 nên gửi lại, máy nhận thấy "trang 2 tôi đã có" thì bỏ qua bản trùng.
- **Transaction** giống **chuyển khoản nội bộ một ngân hàng**: trừ A, cộng B, đánh dấu "đã xử lý lệnh này" — cả 3 cùng thành công hoặc cùng thất bại. Nhưng nếu bước giữa là "gọi điện nhờ ngân hàng khác chuyển tiền", ngân hàng của bạn không thể rút lại cuộc gọi đó khi rollback.

### Thuật ngữ (giải thích lần đầu)
- **PID (Producer ID)**: định danh duy nhất broker cấp cho producer; gắn với mọi batch.
- **Sequence number**: số thứ tự mỗi batch trên một (PID, partition), bắt đầu từ 0.
- **Producer epoch**: số tăng khi producer "hồi sinh" (fencing) để vô hiệu PID/epoch cũ, tránh zombie (tiến trình cũ sống lại gây ghi rác).
- **Idempotence**: thực hiện nhiều lần cho cùng kết quả một lần.
- **Transaction coordinator**: broker đảm nhiệm quản lý trạng thái transaction cho một {{transactional.id}}.
- **Transaction log ({{__transaction_state}})**: topic nội bộ (ẩn) lưu trạng thái transaction.
- **EOS (Exactly-Once Semantics)**: ngữ nghĩa "xử lý đúng một lần" — trong Kafka nghĩa là ghi/đọc/commit offset nguyên tử.

### Idempotent producer: bên trong từng bước
Trạng thái broker giữ **theo (PID, partition)**: {{lastSeq}}.
1. Producer khởi động, xin broker cấp **PID** (và epoch). (Từ Kafka 3.0, {{enable.idempotence=true}} là mặc định, {{acks}} buộc phải {{all}}).
2. Gửi batch đầu tới partition P0: {{(PID=42, epoch=0, partition=P0, baseSeq=0, records=5)}}.
3. Broker thấy {{baseSeq == lastSeq[P0]+1}} (hoặc 0) -> append, cập nhật {{lastSeq[P0]=4}}, trả ack.
4. Mạng lỗi, producer **không nhận ack** -> retry cùng batch (cùng sequence).
5. Broker thấy {{baseSeq <= lastSeq}} -> **duplicate**, trả ack nhưng **không ghi lại**. Đây là chỗ chống trùng.

~~~text
(PID=42, P0)  gửi seq=0..4  -> broker ghi, lastSeq=4
              ack mất -> retry seq=0..4
              broker: 0 <= 4  => DUPLICATE, bỏ qua, vẫn ack OK  (không ghi 2 lần)
~~~

~~~java
// Kafka producer (Java client) - idempotence mặc định Kafka 3.x
Properties p = new Properties();
p.put("bootstrap.servers", "broker:9092");
p.put("enable.idempotence", "true");   // mặc định true từ 3.0
p.put("acks", "all");                   // bắt buộc khi idempotence
p.put("max.in.flight.requests.per.connection", "5"); // an toàn với idempotence
p.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
p.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
// Producer tự xin PID, tự gắn sequence
~~~

**Zombie fencing:** nếu producer cũ bị pause (GC dài) rồi "sống lại" sau khi producer mới đã khởi động, producer mới có thể lấy epoch cao hơn; broker từ chối batch mang epoch cũ.

### Kafka transactions: read-process-write (EOS trong Kafka)
Bài toán: đọc từ topic {{orders}}, xử lý, ghi {{payments}}, và commit offset của {{orders}} — tất cả như **một đơn vị**.
1. Cấu hình {{transactional.id}} (ổn định theo instance). Producer đăng ký với **transaction coordinator** -> lấy PID + epoch, **fence** producer cũ cùng transactional.id.
2. {{initTransactions()}}; {{beginTransaction()}}.
3. {{send()}} tới nhiều partition/topic: mỗi batch mang (PID, epoch) và được đánh dấu "thuộc transaction T".
4. {{sendOffsetsToTransaction(offsets, consumerGroupMetadata)}}: ghi marker commit offset vào {{__consumer_offsets}} **như một phần của transaction**.
5. {{commitTransaction()}}: coordinator ghi PREPARE_COMMIT vào {{__transaction_state}}, rồi ghi **control marker (COMMIT)** vào mọi partition liên quan, rồi COMPLETE_COMMIT.
6. Consumer cấu hình {{isolation.level=read_committed}} chỉ thấy message sau COMMIT marker (dựa trên **LSO - Last Stable Offset**).

~~~seq
title: Kafka transaction read-process-write (EOS trong Kafka)
actors: Consumer | App | TxnProducer | Coordinator | OutTopic | OffsetsTopic
Consumer -> App: poll record (orders)
App -> TxnProducer: beginTransaction
App -> TxnProducer: send(payment) -> OutTopic
App -> TxnProducer: sendOffsetsToTransaction -> OffsetsTopic
App -> Coordinator: commitTransaction
Coordinator -> OutTopic: write COMMIT marker
Coordinator -> OffsetsTopic: write COMMIT marker
Coordinator --> App: committed
note App..OutTopic: read_committed consumer chỉ thấy sau COMMIT
~~~

~~~java
p.put("transactional.id", "pay-worker-1"); // ổn định, duy nhất mỗi worker
try (KafkaProducer<String,String> prod = new KafkaProducer<>(p)) {
  prod.initTransactions();
  while (running) {
    ConsumerRecords<String,String> recs = consumer.poll(Duration.ofMillis(500));
    prod.beginTransaction();
    try {
      for (var r : recs) { prod.send(new ProducerRecord<>("payments", r.key(), process(r))); }
      prod.sendOffsetsToTransaction(currentOffsets(recs), consumer.groupMetadata());
      prod.commitTransaction();
    } catch (Exception e) { prod.abortTransaction(); }
  }
}
~~~

### Giới hạn: side effect ra ngoài Kafka (vì sao EOS gãy)
Transaction Kafka **chỉ bao phủ**: (1) ghi vào Kafka topic, (2) commit offset consumer trong Kafka. Nó **không** bao phủ:
- Ghi DB (Postgres/MySQL) — không có 2PC giữa Kafka coordinator và DB.
- Gọi REST/HTTP tới hệ thống khác.
- Gửi email/SMS, gọi payment gateway, ghi file/S3.

~~~text
beginTransaction
  poll order
  send("payments", ...)        <-- trong transaction Kafka: OK, abort được
  jdbc.update("INSERT ...")    <-- NGOÀI Kafka: đã commit vào DB thì abortTransaction KHÔNG hoàn tác
  http.post(paymentGateway)    <-- NGOÀI Kafka: đã trừ tiền thật
commitTransaction  (nếu crash trước đây -> abort -> nhưng DB/HTTP đã xảy ra?)
~~~
Vì sao: Kafka coordinator chỉ biết ghi control marker vào log Kafka; nó không có cách "undo" một HTTP call hay một DB commit bên ngoài. **Trade-off**: đổi lấy throughput/đơn giản, EOS thu hẹp phạm vi.

**Cách xử lý đúng:** quay lại **at-least-once + idempotency** ở đích (idempotency key gửi sang payment gateway, upsert/dedup table ở DB) — xem microservices-005/006.

### So sánh nhanh
| Cơ chế | Chống trùng gì | Phạm vi | Chi phí |
|---|---|---|---|
| Idempotent producer | Trùng do producer retry (cùng partition) | Một session producer -> partition | Rất thấp (mặc định bật) |
| Transactions (EOS) | Trùng + đọc/ghi/offset nguyên tử | Nhiều partition/topic **trong Kafka** | Cao hơn (chờ marker, LSO) |
| Idempotency key / outbox | Trùng end-to-end, kể cả ngoài Kafka | Hệ thống của bạn | Thiết kế app + bảng/logic |

### Trên production
- **Triệu chứng:** {{InvalidProducerEpoch}} / producer bị fenced -> có instance khác cùng {{transactional.id}}. Consumer "kẹt" không thấy dữ liệu mới -> có transaction mở treo, LSO không tiến; kiểm tra {{transaction.timeout.ms}}.
- **Đo:** {{OpenTransactions}}, thời gian transaction, lỗi {{ProducerFenced}}.
- **Tuning/cấu hình:** {{transactional.id}} phải **ổn định và duy nhất** per worker; {{transaction.timeout.ms}} đủ cho processing nhưng không quá dài. Consumer bắt buộc {{isolation.level=read_committed}} (mặc định {{read_uncommitted}}!).
- **Sai lầm hay gặp:** dùng transactions nhưng vẫn gọi DB/HTTP bên trong mà không idempotent -> tưởng "exactly-once" nhưng thực ra vẫn trùng side effect.

### Ví dụ đời thực
Một worker thanh toán đọc {{orders}}, gọi payment gateway, ghi event {{payment-completed}} rồi commit offset trong cùng Kafka transaction. Trong 1.200 đơn có 37 đơn bị trừ tiền hai lần sau một đợt deploy. Log theo {{orderId}} cho thấy cùng một kịch bản: HTTP tại gateway đã trả 201, worker bị dừng trước {{commitTransaction()}}, transaction Kafka bị abort và instance mới đọc lại order. Lần chạy sau gọi gateway bằng request mới nên phát sinh giao dịch thứ hai; PID và sequence number không thể loại bỏ HTTP call này vì chúng chỉ bảo vệ log Kafka. Team hoàn tiền các giao dịch trùng, sau đó gửi idempotency key ổn định theo {{orderId}} cho thao tác charge và thêm ràng buộc unique trên {{order_id}} trong bảng payment làm lớp phòng thủ. Kết quả Kafka vẫn at-least-once ở biên ngoài nhưng cùng key chỉ tạo một giao dịch tại gateway. Khi replay kiểm thử 500 order, số bản ghi payment và số lần trừ tiền không tăng; các event Kafka và offset vẫn được commit nguyên tử.

### Trả lời mẫu khi phỏng vấn
"Tôi tách idempotent producer và transaction thành hai mức bảo vệ. Ở mức thứ nhất, broker cấp PID cho producer, producer gắn sequence tăng dần cho từng partition, nên khi mất ack và gửi lại cùng batch, broker nhận ra duplicate và không append lần nữa. Epoch giúp fence producer cũ khi một instance mới cùng transactional.id tiếp quản. Ở mức thứ hai, transaction gộp các record đầu ra và consumer offset thành một đơn vị nguyên tử; consumer read_committed chỉ đọc dữ liệu đã commit. Đó là exactly-once cho vòng read-process-write trong Kafka, không phải cam kết exactly-once cho mọi hành động của ứng dụng. Nếu worker gọi REST, gửi email hoặc commit PostgreSQL rồi crash trước khi commit transaction Kafka, lần đọc lại vẫn có thể thực hiện side effect lần nữa. Kafka không thể rollback những hệ thống đó. Vì vậy, tôi luôn thiết kế biên ngoài theo at-least-once: idempotency key cho payment gateway, unique constraint cùng transaction nghiệp vụ cho DB, hoặc outbox khi cần chuyển từ DB sang Kafka. Trade-off của transaction là latency và độ phức tạp vận hành cao hơn, nên tôi chỉ dùng khi giá trị của tính nguyên tử trong Kafka biện minh được chi phí đó."

> Senior tip: tôi dùng Kafka transactions **chỉ** cho pipeline thuần Kafka (consume->transform->produce). Ngay khi có ghi DB hoặc gọi service ngoài, tôi bỏ transaction Kafka, chuyển sang at-least-once + idempotent consumer/outbox — đơn giản hơn, dễ lý giải đúng hơn, và không tạo ảo giác "EOS end-to-end".`,
  follow: ["Tại sao {{transactional.id}} phải ổn định qua restart? Điều gì xảy ra nếu mỗi lần deploy sinh một id mới?", "Consumer đặt {{isolation.level=read_uncommitted}} thì thấy gì khác? Vì sao đây là mặc định?", "So sánh chi phí latency của transaction (chờ COMMIT marker, LSO) với at-least-once thuần. Khi nào bạn chấp nhận trả chi phí đó?"],
  tags: ["Kafka", "idempotent producer", "PID", "sequence number", "transactions", "EOS", "exactly-once"],
  refs: [{"type": "doc", "title": "Kafka: Idempotent Producer", "url": "https://kafka.apache.org/documentation/#design_idempotence"}, {"type": "doc", "title": "Kafka: Transactions", "url": "https://kafka.apache.org/documentation/#semantics"}, {"type": "doc", "title": "KIP-98: Exactly Once Delivery and Transactional Messaging", "url": "https://cwiki.apache.org/confluence/display/KAFKA/KIP-98+-+Exactly+Once+Delivery+and+Transactional+Messaging"}]
},
{
  id: 'microservices-052',
  topic: 'microservices',
  level: 'senior',
  q: 'Sau khi deploy, consumer group Kafka liên tục **rebalance**: lag tăng vọt, throughput rơi, log đầy {{CommitFailedException}}. Giải thích cơ chế rebalance (eager vs cooperative-sticky), vai trò {{max.poll.interval.ms}} / {{session.timeout.ms}}, và cách dùng **static membership** để dừng rebalance loop.',
  a: `**Tóm tắt:** **Rebalance** là quá trình consumer group phân chia lại partition cho các member khi nhóm thay đổi (join/leave/crash/topic thêm partition). Kiểu **eager** thu hồi hết partition rồi gán lại (stop-the-world tạm thời); **cooperative-sticky** (incremental) chỉ thu hồi/gán phần thay đổi nên ít gián đoạn. {{max.poll.interval.ms}} quá ngắn so với thời gian xử lý batch khiến consumer bị coi là "chết" -> bị đá khỏi group -> rebalance -> tạo **rebalance loop**. **Static membership** ({{group.instance.id}}) cho phép instance restart trong cửa sổ timeout mà không kích hoạt rebalance.

### Hiểu nhanh (ví dụ đời thường)
Một nhóm shipper (consumer group) chia nhau các khu phố (partition), mỗi khu chỉ 1 người. **Rebalance** giống buổi họp "chia lại tuyến" khi có người nghỉ việc hoặc người mới vào. Kiểu **eager**: mọi người nộp lại hết tuyến, đứng chờ phân công lại — trong lúc họp không ai giao hàng. Kiểu **cooperative**: chỉ người bị ảnh hưởng đổi tuyến, người khác giao tiếp. Nếu một shipper xử lý một đơn quá lâu mà không "báo cáo" (không gọi {{poll()}}), quản lý tưởng anh ta biến mất nên mở họp chia lại tuyến — tạo vòng lặp hỗn loạn.

### Thuật ngữ (giải thích lần đầu)
- **Consumer group**: tập consumer cùng {{group.id}} chia nhau partition; 1 partition chỉ gán cho 1 consumer trong group.
- **Group coordinator**: broker quản lý thành viên và trạng thái group.
- **Group leader** (phía consumer): member được chọn để tính phân công partition (theo {{partition.assignment.strategy}}).
- **Rebalance**: lần phân công lại partition.
- **Eager rebalance**: mọi member trả lại toàn bộ partition trước khi nhận gán mới.
- **Cooperative (incremental) rebalance**: thu hồi/gán dần ({{CooperativeStickyAssignor}}).
- **Static membership**: member có {{group.instance.id}} cố định, restart nhanh không bị xem là rời group.
- **Heartbeat**: tín hiệu nền báo "tôi còn sống".

### Cơ chế rebalance từng bước (eager, rút gọn)
1. Member join/leave/crash hoặc metadata thay đổi -> coordinator mở phiên rebalance.
2. Coordinator yêu cầu mọi member **rejoin**. Mỗi member gửi {{JoinGroup}}.
3. Coordinator chọn **group leader**, trả danh sách member cho leader.
4. Group leader chạy assignor, tính phân công -> gửi {{SyncGroup}} kèm assignment.
5. Mọi member nhận assignment mới. **Trong bước 2-5, partition đã bị thu hồi: không ai tiêu thụ** (eager).

~~~seq
title: Eager rebalance (rút gọn)
actors: ConsumerA | ConsumerB | Coordinator
ConsumerB -> Coordinator: JoinGroup (B vào group)
Coordinator -> ConsumerA: yêu cầu rejoin
Coordinator -> ConsumerB: yêu cầu rejoin
ConsumerA -> Coordinator: JoinGroup + revoke ALL partitions
ConsumerB -> Coordinator: JoinGroup
Coordinator -> ConsumerA: SyncGroup (leader tính assignment)
ConsumerA --> ConsumerA: nhận [P0]
ConsumerB --> ConsumerB: nhận [P1]
note ConsumerA..ConsumerB: khoảng trống: không partition nào được consume
~~~

**Cooperative-sticky:** hai pha — pha 1 thu hồi chỉ partition "thừa", member khác vẫn consume; pha 2 gán partition thu hồi cho member mới.

~~~java
props.put("group.id", "pay-workers");
props.put("partition.assignment.strategy",
  "org.apache.kafka.clients.consumer.CooperativeStickyAssignor"); // incremental
props.put("session.timeout.ms", "45000");    // "chết" nếu mất heartbeat quá lâu
props.put("heartbeat.interval.ms", "3000");  // nên <= 1/3 session.timeout
props.put("max.poll.interval.ms", "300000"); // 5 phút: tối đa giữa 2 lần poll()
props.put("max.poll.records", "200");        // giảm batch nếu xử lý chậm
props.put("enable.auto.commit", "false");
~~~

### Rebalance loop do {{max.poll.interval.ms}}
1. {{max.poll.records=500}}, mỗi record xử lý 2s -> batch mất 1000s.
2. {{max.poll.interval.ms}} mặc định 300s. Quá 5 phút không gọi {{poll()}} -> consumer bị coi **không responsive** (heartbeat thread vẫn sống; heartbeat chứng minh process sống, poll chứng minh *xử lý được*).
3. Coordinator đá consumer -> **rebalance**. Partition gán cho consumer khác.
4. Consumer kia nhận lại **offset chưa commit** -> xử lý lại batch nặng -> lại quá 5 phút -> **loop**.
5. Triệu chứng kèm: {{CommitFailedException}} (commit khi đã mất partition).

~~~text
poll(500 rec) -> xử lý 1000s > max.poll.interval 300s
  -> kick A -> rebalance -> B nhận lại offset cũ -> xử lý 1000s -> kick B ... (lặp)
~~~
**Sửa:** tăng {{max.poll.interval.ms}} *hoặc* (tốt hơn) giảm {{max.poll.records}}/tối ưu xử lý.

### Static membership
Không có static id: restart -> rời group -> rebalance; lên lại -> join -> rebalance nữa (2 lần).
Có {{group.instance.id}} cố định: restart trong {{session.timeout.ms}} -> coordinator **giữ chỗ** partition, không rebalance; lên lại với cùng id -> nhận lại partition cũ.

~~~java
props.put("group.instance.id", "pay-worker-" + instanceIndex); // cố định, duy nhất
~~~

### Eager vs Cooperative
| Tiêu chí | Eager | Cooperative-sticky |
|---|---|---|
| Thu hồi | Toàn bộ, mọi member dừng | Chỉ phần thay đổi |
| Gián đoạn | Stop-the-world | Nhỏ hơn nhiều |
| Trạng thái local (cache theo partition) | Mất hết | Giữ được (sticky) |
| Khi dùng | Group nhỏ, ít thay đổi | Group lớn, deploy thường xuyên |

### Trên production
- **Triệu chứng:** lag tăng vọt theo nhịp deploy; log {{Revoking previously assigned partitions}}, {{CommitFailedException}}.
- **Đo:** {{rebalance-latency-avg/max}}, {{rebalance-rate-per-hour}}, {{assigned-partitions}} dao động.
- **Tuning:** dùng {{CooperativeStickyAssignor}}; đặt {{max.poll.interval.ms}} > p99 thời gian xử lý batch; giảm {{max.poll.records}}; bật static membership; {{heartbeat.interval.ms}} ~ 1/3 {{session.timeout.ms}}.
- **Pitfall:** commit trước khi xử lý xong -> mất message; nâng {{max.poll.interval.ms}} quá lớn che giấu xử lý chậm.

### Ví dụ đời thực
Sau một bản deploy, group {{invoice-workers}} có lag tăng đến 1,8 triệu record và {{rebalance-rate-per-hour}} chạm 42 lần/giờ. Log lặp {{CommitFailedException}} ngay sau các lần gán lại partition. Team đo duration giữa hai lần {{poll()}} thay vì chỉ nhìn heartbeat: với {{max.poll.records=500}} và trung bình 1,4 giây/record, một batch mất khoảng 700 giây, vượt {{max.poll.interval.ms=300000}}; p99 còn đạt 810 giây khi DB chậm. Consumer vẫn heartbeat nên process có vẻ sống, nhưng coordinator đá nó vì không gọi lại poll đúng hạn. Worker kế tiếp nhận batch nặng tương tự và lặp lại chu kỳ. Team giảm batch còn 50 record, gộp các lệnh ghi DB thành batch, chuyển sang {{CooperativeStickyAssignor}} và gán {{group.instance.id}} ổn định cho từng pod để restart nhanh trong {{session.timeout.ms}} không phải đổi assignment. Sau thay đổi, p99 duration xử lý một poll còn 38 giây, rebalance chỉ xuất hiện hai lần trong đợt deploy và p95 độ trễ xử lý giảm từ 18 phút xuống 45 giây.

### Trả lời mẫu khi phỏng vấn
"Tôi điều tra rebalance bằng cách phân biệt process còn sống với process còn kịp xử lý. Heartbeat và session.timeout.ms phát hiện consumer mất kết nối, còn max.poll.interval.ms giới hạn duration giữa hai lần poll. Nếu một batch xử lý lâu hơn giới hạn này, heartbeat vẫn chạy nhưng consumer vẫn bị loại; partition được gán sang worker khác và offset chưa commit được đọc lại. CommitFailedException thường là hệ quả khi consumer cũ cố commit sau khi đã mất quyền sở hữu partition. Eager rebalance thu hồi toàn bộ partition nên gây dừng rộng, còn cooperative-sticky chỉ di chuyển phần cần thiết và giữ các assignment ổn định. Static membership dùng group.instance.id giúp instance restart trong session timeout nhận lại partition cũ, rất hữu ích khi rolling deploy, nhưng không chữa được batch xử lý chậm. Cách sửa ưu tiên của tôi là đo p99 duration mỗi poll, giảm max.poll.records, tối ưu I/O và chỉ commit sau khi xử lý xong. Tôi tránh tăng max.poll.interval.ms vô hạn vì làm vậy chỉ che lỗi và trì hoãn phát hiện worker thật sự treo. Cuối cùng, tôi kiểm tra lag theo partition và tần suất rebalance để xác nhận hệ thống đã ổn định."

> Senior tip: khi điều tra rebalance loop, tôi lấy **ba số**: p99 thời gian xử lý một {{poll()}} batch, {{max.poll.interval.ms}}, và {{rebalance-rate-per-hour}}. Nếu p99 > max.poll.interval là nguyên nhân gần như chắc chắn. Đừng vội tăng timeout — hãy giảm {{max.poll.records}} hoặc tối ưu đường nóng trước.`,
  follow: ["Tại sao heartbeat thread sống vẫn không cứu được consumer bị đá vì {{max.poll.interval.ms}}? Hai cơ chế này bảo vệ điều gì khác nhau?", "Cooperative-sticky giúp ích gì khi consumer giữ cache local gắn với partition (stateful processing)?", "Khi số partition tăng (thêm partition vào topic đang có), rebalance xảy ra thế nào và có rủi ro gì với ordering key?"],
  tags: ["Kafka", "consumer group", "rebalance", "cooperative-sticky", "static membership", "max.poll.interval.ms"],
  refs: [{"type": "doc", "title": "Kafka Consumer Configs", "url": "https://kafka.apache.org/documentation/#consumerconfigs"}, {"type": "doc", "title": "KIP-429: Incremental Rebalance Protocol", "url": "https://cwiki.apache.org/confluence/display/KAFKA/KIP-429%3A+Kafka+Consumer+Incremental+Rebalance+Protocol"}, {"type": "doc", "title": "KIP-345: Static Membership", "url": "https://cwiki.apache.org/confluence/display/KAFKA/KIP-345%3A+Introduce+static+membership+protocol+to+reduce+consumer+rebalances"}]
},
{
  id: 'microservices-053',
  topic: 'microservices',
  level: 'senior',
  q: 'Hệ thống đơn hàng cần xử lý các sự kiện của **cùng một orderId theo đúng thứ tự**. Bạn giải thích vì sao dùng partition key đảm bảo thứ tự, điều gì xảy ra khi **hot partition** (một key quá lớn), và vì sao đưa message lỗi sang **retry topic** có thể **đảo thứ tự**? Cách xử lý?',
  a: `**Tóm tắt:** Kafka chỉ đảm bảo thứ tự **trong một partition**. Gửi message với **key = orderId** -> cùng key luôn vào cùng partition (băm - hash) nên các sự kiện của một đơn hàng được xử lý tuần tự. **Hot partition** xảy ra khi một key chiếm lượng lớn traffic, làm một partition/consumer quá tải. **Retry topic** tách message lỗi ra topic khác để không chặn partition chính, nhưng message lỗi (event A) bị đẩy sang retry trong khi event B (cùng order) tiếp tục chạy ở main -> **đảo thứ tự**. Xử lý bằng: per-key blocking, retry tại chỗ có giới hạn, hoặc state machine chấp nhận lệch thứ tự.

### Hiểu nhanh (ví dụ đời thường)
Partition giống **các làn thu phí**: xe cùng biển số hợp đồng (cùng key) luôn đi một làn -> vào/ra đúng thứ tự. Một công ty vận tải (hot key) đổ 80% xe vào một làn, làn đó kẹt. Khi một xe hỏng, bạn kéo nó sang **làn sửa chữa** (retry topic) để làn chính thông, nhưng xe sau của cùng đoàn đã chạy qua trước -> đến đích sai thứ tự.

### Thuật ngữ (giải thích lần đầu)
- **Partition key**: trường dùng để chọn partition; Kafka mặc định: {{partition = murmur2(key) % numPartitions}}.
- **Ordering guarantee**: thứ tự append == thứ tự consume, chỉ trong 1 partition.
- **Hot partition / hot key (data skew)**: phân bố key lệch, một partition nhận traffic áp đảo.
- **Retry topic**: topic riêng để xử lý lại message lỗi sau delay (non-blocking retry).
- **DLQ/DLT (Dead Letter Topic)**: nơi chứa message thất bại vĩnh viễn sau N lần retry.
- **Head-of-line blocking**: message đầu hàng lỗi chặn mọi message sau.

### Cơ chế: key -> partition -> thứ tự
~~~java
// LUÔN gửi key = aggregate id cần giữ thứ tự
producer.send(new ProducerRecord<>("orders", orderId, toJson(event)));
// partition = murmur2(orderId) % numPartitions
// => mọi event cùng orderId -> cùng partition -> cùng consumer -> tuần tự
~~~
~~~text
orderId=O1:  [Created, Paid, Shipped]  --hash--> partition 2  --> consumer A (tuần tự)
orderId=O2:  [Created, Cancelled]      --hash--> partition 0  --> consumer B
~~~
Vì sao: đảm bảo thứ tự toàn cục buộc 1 partition duy nhất -> giết throughput. Trade-off: **thứ tự theo key**.
**Cảnh báo:** {{hash % N}} thay đổi khi N đổi -> tăng partition topic đang dùng key-ordering có thể vỡ thứ tự.

### Hot partition
Một tenant "big-corp" chiếm 60% traffic -> 60% vào 1 partition -> consumer đó bão hòa. Scale thêm consumer **không giúp** (1 partition vẫn chỉ 1 consumer).
~~~text
P0 (big-corp, 60k msg/s) -> consumer A: CPU 100%, lag tăng
P1 (others,   10k msg/s) -> consumer B: CPU 15%
P2 (others,   10k msg/s) -> consumer C: CPU 15%  (consumer D: idle)
~~~
Cách xử lý: scale dọc/tối ưu consumer; **key salting** rải tải nhưng **phá thứ tự** (chỉ dùng nếu downstream tự reorder); tách hot tenant ra topic riêng.

### Retry topic đảo thứ tự
~~~text
Main partition 2:  [A:Paid,O1](lỗi->retry topic)  [B:Shipped,O1]  [C:Done,O1]
                        |                              |               |
                        v                              v               v
                     retry topic                    xử lý ngay      xử lý ngay
                     (chờ 5s, retry A)                (TRƯỚC A!)
Kết quả O1: Shipped chạy trước Paid -> TRẠNG THÁI SAI
~~~
Vì sao: A rời partition chính để không chặn, còn B,C (cùng key) vẫn chạy tiếp -> vượt mặt A.

### Cách xử lý
| Cách | Ý tưởng | Đánh đổi |
|---|---|---|
| **Per-key blocking** | Key O1 đang in-retry -> park message mới của O1, nhả sau khi A xong/DLT | Phức tạp, cần state theo key; đúng thứ tự |
| **Retry tại chỗ giới hạn** | Retry nhanh vài lần inline, fail thì DLT | Chặn partition một lúc; đơn giản, đúng thứ tự |
| **State machine chấp nhận lệch thứ tự** | Nghiệp vụ chấp nhận "Shipped đến trước Paid" (pending) | Đòi hỏi nghiệp vụ cho phép |
| **Sequence number trong payload** | Gắn số thứ tự per-order, consumer buffer/reorder | Tốn state, timeout nếu mất số |

~~~java
@RetryableTopic(attempts = "4", backoff = @Backoff(delay = 2000, multiplier = 3),
                dltTopicSuffix = "-dlt", autoCreateTopics = "true")
@KafkaListener(topics = "orders", groupId = "order-worker")
public void handle(String payload, @Header(KafkaHeaders.RECEIVED_KEY) String orderId) {
  process(payload); // exception -> retry/dlt
  // Cần cơ chế bổ sung nếu phải giữ thứ tự tuyệt đối theo orderId khi retry xảy ra
}
~~~

### Trên production
- **Triệu chứng:** lag/CPU lệch rõ giữa consumer (1 cao, còn lại thấp) = hot partition. Sai trạng thái đơn hàng = đảo thứ tự do retry.
- **Đo:** lag **theo partition**, throughput theo partition; phân bố key (sample). Monitor DLT (có message = cần can thiệp).
- **Pitfall:** dùng {{null}} key cho dữ liệu cần thứ tự; dùng non-blocking retry mà không xét thứ tự theo key. Retry phía producer (idempotence bật) không đảo thứ tự — khác retry topic phía consumer.

### Ví dụ đời thực
Sau khi bật non-blocking retry cho {{orders}}, hệ thống ghi nhận 240 đơn bị chuyển trạng thái lùi trong một ngày. Với order O-7812, {{PaymentConfirmed}} version 4 gặp timeout DB nên được chuyển sang {{orders-retry}}; {{ShipmentConfirmed}} version 5 ở partition chính vẫn được xử lý ngay. Hai giây sau, version 4 quay lại và ghi đè trạng thái {{SHIPPED}} thành {{PAID}}. Log có cùng {{orderId}}, version, topic và timestamp xác nhận đây là retry vượt mặt event, không phải producer gửi sai thứ tự. Khi đó, {{kafka-consumer-groups.sh --bootstrap-server broker:9092 --describe --group order-workers}} cho thấy lag P7 gấp 15 lần các partition khác; sample key cho thấy một tenant chiếm 58% message của P7, nên thêm pod không giảm được điểm nghẽn. Team lưu {{last_version}} theo order, bỏ event cũ hơn và giữ event chưa đủ điều kiện ở trạng thái pending thay vì ghi lùi; sau khi drain backlog, tenant lớn được tách sang topic riêng vẫn key theo orderId. Sau một tuần, không còn chuyển trạng thái lùi và p95 lag giảm từ 12 phút xuống 70 giây.

### Trả lời mẫu khi phỏng vấn
"Kafka chỉ bảo đảm thứ tự trong một partition, nên tôi dùng orderId làm key để mọi event của cùng đơn hàng đi vào cùng partition và được một consumer xử lý tuần tự. Tôi cũng tránh tăng partition tùy tiện vì phép băm theo số partition mới có thể đưa cùng key sang partition khác. Với hot key, một tenant có thể chiếm phần lớn traffic của một partition; lúc đó thêm consumer không giúp vì partition vẫn chỉ có một chủ. Tôi phải tối ưu worker, tách tenant nóng hoặc cân nhắc salting nếu nghiệp vụ cho phép mất ordering đơn giản. Retry topic tạo một bẫy khác: event A lỗi được đưa đi chờ, trong khi event B cùng orderId vẫn chạy ở topic chính và vượt A. Nếu thứ tự là bắt buộc, tôi chọn retry inline có giới hạn hoặc cơ chế park theo key, chấp nhận giảm throughput và phải xử lý offset cẩn thận. Nếu nghiệp vụ cho phép, tôi thiết kế state machine có version theo aggregate để loại event cũ và lưu event chưa thể áp dụng. Quyết định phụ thuộc vào hậu quả của sai thứ tự; với payment, tôi ưu tiên tính đúng hơn là chỉ nhìn backlog giảm."

> Senior tip: trước khi bật {{@RetryableTopic}} cho luồng order/payment, tôi luôn hỏi: "nếu event B vượt event A của cùng key, state machine có hỏng không?" Nếu có, tôi chọn per-key blocking hoặc retry inline giới hạn — đổi throughput lấy tính đúng, vì sai trạng thái đơn hàng còn đắt hơn lag.`,
  follow: ["Nếu tăng partition từ 6 lên 12 để giảm tải, bạn migrate topic đang dùng key-ordering như thế nào để không vỡ thứ tự?", "Thiết kế state machine cho đơn hàng thế nào để chịu được event đến lệch thứ tự (ví dụ nhận Shipped trước Paid)?", "Khi nào bạn chọn {{null}} key? Ảnh hưởng của default partitioner 'sticky' (Kafka mới) với null key là gì?"],
  tags: ["Kafka", "ordering", "partition key", "hot partition", "retry topic", "DLQ", "head-of-line blocking"],
  refs: [{"type": "doc", "title": "Kafka: Producer partitioning", "url": "https://kafka.apache.org/documentation/#producerconfigs_partitioner.class"}]
},
{
  id: 'microservices-054',
  topic: 'microservices',
  level: 'lead',
  q: 'Bạn dùng **Outbox + CDC (Debezium)** để phát event từ PostgreSQL ra Kafka. Hãy giải thích cơ chế **đọc WAL** từng bước, làm sao giữ **thứ tự theo aggregate**, và thiết kế **dedup phía consumer** (inbox/dedup table) để xử lý duplicate khi connector restart.',
  a: `**Tóm tắt:** Debezium kết nối PostgreSQL qua **logical replication**: DB ghi mọi thay đổi vào **WAL** (Write-Ahead Log); Debezium dùng **replication slot** để stream các thay đổi đã commit theo thứ tự WAL, dùng **LSN** làm vị trí. Ghi order row + outbox row trong **cùng transaction** đảm bảo cả hai xuất hiện cùng thứ tự commit. Đặt **Kafka key = aggregateId** để mọi event của một aggregate vào cùng partition (giữ thứ tự theo aggregate). CDC là **at-least-once** (restart có thể phát lại), nên consumer cần **inbox/dedup table** (lưu eventId đã xử lý, unique) trong cùng transaction với nghiệp vụ.

### Hiểu nhanh (ví dụ đời thường)
- **WAL** giống **camera an ninh ghi liên tục** mọi thay đổi: Debezium xem băng camera (log) theo thứ tự thời gian, không polling.
- **Outbox**: khi ghi order, đồng thời bỏ **phiếu thông báo** vào hộp thư (outbox row) — cùng lúc, cùng transaction. Camera thấy cả hai.
- **Replication slot** là **dấu trang** của Debezium trên cuộn băng: để DB không xóa đoạn băng Debezium chưa xem.
- **Inbox/dedup**: người nhận đánh dấu "phiếu #E123 đã xử lý"; bưu tá giao trùng thì bỏ qua.

### Thuật ngữ (giải thích lần đầu)
- **WAL (Write-Ahead Log)**: nhật ký ghi trước của PostgreSQL — mọi thay đổi ghi WAL trước; logical decoding đọc WAL thành thay đổi hàng.
- **Logical replication / decoding**: giải mã WAL ở mức hàng (INSERT/UPDATE/DELETE).
- **Replication slot**: giữ lại WAL segments chưa đọc và lưu vị trí (restart LSN).
- **LSN (Log Sequence Number)**: vị trí byte trong WAL, tăng đơn điệu — dùng làm checkpoint.
- **CDC (Change Data Capture)**: bắt thay đổi dữ liệu từ log DB.
- **Inbox table / dedup table**: bảng phía consumer lưu id event đã xử lý để loại trùng.

### Đọc WAL từng bước
1. App: {{INSERT orders...; INSERT outbox_events(...); COMMIT}}. Cả hai vào **cùng commit WAL record**.
2. Postgres ghi WAL (tuần tự). Commit chỉ thành công khi WAL flush — WAL là nguồn sự thật về *thứ tự commit*.
3. Debezium giữ **replication slot** ({{pgoutput}}) và stream từ **LSN** đã lưu. Slot: "đừng xóa WAL trước LSN này".
4. Logical decoding chuyển WAL record thành change event ({{op=c, table=outbox_events, after=row}}).
5. Debezium (SMT Outbox Event Router) map {{aggregate_id -> Kafka key}}, publish.
6. Sau khi Kafka ack, Debezium **advance LSN** (checkpoint). Vì sao *sau* ack: crash trước checkpoint -> restart từ LSN cũ -> **phát lại** (at-least-once).

~~~seq
title: Outbox + Debezium WAL -> Kafka -> Consumer dedup
actors: App | PostgreSQL(WAL) | Debezium | Kafka | Consumer | ConsumerDB
App -> PostgreSQL(WAL): BEGIN; INSERT order; INSERT outbox; COMMIT
PostgreSQL(WAL) -> Debezium: stream WAL (LSN) via replication slot
Debezium -> Kafka: produce event (key=aggregateId)
Kafka --> Debezium: ack
Debezium -> PostgreSQL(WAL): advance slot LSN (checkpoint)
Kafka -> Consumer: deliver event (có thể trùng sau restart)
Consumer -> ConsumerDB: tx: INSERT inbox(eventId) UNIQUE + apply nghiệp vụ
ConsumerDB --> Consumer: commit (trùng -> conflict -> bỏ qua)
~~~

### Giữ thứ tự theo aggregate
- Cùng transaction commit -> WAL cùng thứ tự commit.
- Debezium đặt {{key = aggregate_id}} -> {{hash(key)%N}} -> **mọi event cùng aggregate vào cùng partition** -> consumer đọc tuần tự. Thứ tự *theo aggregate* (không toàn cục).

~~~sql
CREATE TABLE outbox_events (
  id            UUID PRIMARY KEY,          -- eventId, dùng dedup
  aggregate_type TEXT NOT NULL,
  aggregate_id   TEXT NOT NULL,            -- -> Kafka key
  event_type     TEXT NOT NULL,
  payload        JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- App: INSERT order + INSERT outbox_events trong CÙNG transaction
~~~

### Dedup phía consumer (inbox table)
CDC at-least-once -> consumer **phải** idempotent. Ghi inbox và xử lý nghiệp vụ **cùng 1 transaction DB**.
~~~sql
CREATE TABLE inbox_events (
  event_id   UUID PRIMARY KEY,   -- UNIQUE: trùng -> conflict
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
~~~
~~~java
@Transactional
public void onEvent(OrderEvent evt) {
  // 1) ghi inbox; trùng -> bỏ qua
  int inserted = jdbc.update(
    "INSERT INTO inbox_events(event_id) VALUES (?) ON CONFLICT DO NOTHING", evt.id());
  if (inserted == 0) return;
  // 2) áp dụng nghiệp vụ CÙNG transaction
  jdbc.update("UPDATE read_model ... WHERE order_id=?", evt.aggregateId());
}
~~~

### Trên production
- **Triệu chứng:** replication slot lag tăng, đĩa Postgres đầy (WAL bị giữ lại). Duplicate event nếu thiếu inbox.
- **Đo:** {{pg_replication_slots}} ({{wal_lag}}, {{confirmed_flush_lsn}}), Debezium {{MilliSecondsBehindSource}}, tỉ lệ inbox conflict.
- **Tuning:** {{max_slot_wal_keep_size}} chặn slot giữ WAL vô hạn (chấp nhận invalidate -> re-snapshot). {{heartbeat.interval.ms}}/{{heartbeat.action.query}} để slot tiến khi bảng ít thay đổi.
- **Pitfall:** thiếu {{REPLICA IDENTITY}}; quên quyền replication; nhiều task cùng slot; consumer không inbox.

### Ví dụ đời thực
Connector của hệ thống loyalty bị restart sau khi Kafka đã ack một loạt event nhưng trước khi offset của connector được flush. Khi chạy lại từ vị trí cũ, Debezium phát lại 18.000 event và 6.300 tài khoản bị cộng điểm hai lần vì consumer chưa có inbox. Điều tra bằng {{event_id}} cho thấy cùng UUID xuất hiện ở hai Kafka offset khác nhau; log restart và truy vấn {{pg_replication_slots.confirmed_flush_lsn}} giúp nối đợt phát lại với checkpoint chưa tiến. Trong 35 phút connector dừng, truy vấn {{pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)}} còn cho thấy slot giữ khoảng 18 GB WAL. Nguyên nhân gốc của duplicate là khoảng trống giữa ack Kafka và checkpoint, chứ không phải outbox ghi hai lần. Team thêm {{inbox_events(event_id PRIMARY KEY)}} và chèn inbox cùng transaction cập nhật điểm; conflict thì bỏ qua. Event vẫn dùng {{aggregate_id}} làm key để giữ thứ tự theo tài khoản. Sau khi replay 18.000 event và thực hiện 200 lần restart kiểm thử, không phát sinh lần cộng điểm thứ hai; alert trên độ trễ slot giúp xử lý backlog trước khi đĩa DB đầy.

### Trả lời mẫu khi phỏng vấn
"Outbox giải quyết tính nguyên tử giữa thay đổi nghiệp vụ và ý định phát event: ứng dụng ghi order cùng outbox row trong một transaction PostgreSQL. Debezium không polling bảng; nó dùng logical decoding để đọc các thay đổi đã commit từ WAL qua replication slot, với LSN làm vị trí checkpoint. Outbox Event Router lấy aggregate_id làm Kafka key, nên các event của cùng aggregate đi vào một partition và giữ được thứ tự tương đối theo aggregate. Tôi không tuyên bố exactly-once vì connector có thể crash sau khi Kafka ack nhưng trước khi lưu checkpoint; khi restart, event có thể được phát lại. Consumer vì vậy phải idempotent. Cách tôi dùng là insert event_id vào inbox table có unique hoặc primary key, rồi cập nhật nghiệp vụ trong cùng transaction DB. Nếu insert conflict, toàn bộ duplicate được bỏ qua; nếu transaction rollback, cả inbox và nghiệp vụ đều không được ghi nhận. Về vận hành, replication slot có thể giữ WAL và làm đầy đĩa khi connector chậm, nên tôi giám sát confirmed_flush_lsn, độ trễ và dung lượng giữ lại, và chuẩn bị runbook re-snapshot. Trade-off chính là thêm bảng, lưu trữ dedup và chi phí vận hành CDC để đổi lấy phát event tin cậy."

> Senior tip: giám sát **WAL retention do replication slot** như một SLO hạ tầng. Đặt {{max_slot_wal_keep_size}}, alert khi {{wal_lag}} vượt ngưỡng, và có runbook "invalidate slot + re-snapshot" — CDC an toàn chỉ khi bạn vận hành được slot.`,
  follow: ["Nếu phải re-snapshot vì slot bị invalidate, làm sao tránh consumer xử lý trùng hàng loạt dữ liệu cũ?", "Tại sao {{aggregate_id}} làm Kafka key đủ cho thứ tự theo aggregate nhưng không đủ cho thứ tự toàn cục? Khi nào cần total order?", "So sánh dedup bằng inbox table (DB) với dedup bằng Redis SETNX (TTL). Trường hợp nào Redis làm mất tính đúng?"],
  tags: ["Kafka", "CDC", "Debezium", "WAL", "outbox", "inbox", "idempotent consumer", "replication slot"],
  refs: [{"type": "doc", "title": "Debezium: PostgreSQL connector", "url": "https://debezium.io/documentation/reference/stable/connectors/postgresql.html"}, {"type": "doc", "title": "Debezium: Outbox Event Router", "url": "https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html"}, {"type": "doc", "title": "PostgreSQL: Logical Replication", "url": "https://www.postgresql.org/docs/current/logicaldecoding-explanation.html"}]
},
{
  id: 'microservices-055',
  topic: 'microservices',
  level: 'senior',
  q: 'Dashboard báo **consumer lag** của một group tăng liên tục. Bạn đo lag thế nào (theo partition), giải thích vì sao **thêm consumer vượt số partition không giúp gì**, và dùng các cơ chế nào để tạo **backpressure**/giảm lag an toàn?',
  a: `**Tóm tắt:** **Consumer lag** = {{log end offset (LEO)}} của partition trừ {{committed offset}} của group — số message còn tồn đọng. Lag phải xem **theo từng partition** vì tổng có thể che mất một partition kẹt (hot key). Trong một group, **1 partition chỉ gán cho tối đa 1 consumer**, nên thêm consumer vượt số partition sẽ cho consumer dư **idle**. Giảm lag bằng: tăng partition (cẩn thận với key ordering) + scale consumer tương ứng, tăng tốc xử lý/giảm {{max.poll.records}}, hoặc backpressure ({{pause}}/{{resume}}, giới hạn fetch).

### Hiểu nhanh (ví dụ đời thường)
Partition là **làn hàng** ở siêu thị, consumer là **thu ngân**. Lag là **số khách đang xếp hàng**. Có 3 làn thì tối đa 3 thu ngân; thuê thêm người thứ 4 thì đứng chơi vì **không có làn thứ 4**. Muốn hết hàng nhanh: mở thêm làn (tăng partition, nhưng khách có thẻ cố định làn thì phải cẩn thận), quét nhanh hơn (tối ưu), hoặc bớt số món mỗi lượt (giảm batch). Kho quá tải -> **tạm dừng nhận khách** (pause).

### Thuật ngữ (giải thích lần đầu)
- **LEO (Log End Offset)**: offset kế tiếp sẽ ghi vào partition (phía broker).
- **Committed offset**: offset group đã xác nhận xử lý xong (lưu trong {{__consumer_offsets}}).
- **Consumer lag**: {{LEO - committed offset}} (số record chưa xử lý xong). **Time lag** = độ trễ thời gian so với message mới nhất.
- **Backpressure**: cơ chế điều tiết khi downstream quá tải.
- **Pause/Resume**: tạm ngừng fetch partition mà **không** rời group (không rebalance).

### Lag theo partition
~~~text
Topic orders, 4 partitions, group "pay-workers":

Partition  LEO     Committed  Lag
P0         10,500   10,480     20
P1         10,490   10,470     20
P2         10,520    8,100  2,420   <-- kẹt (hot key / xử lý chậm)
P3         10,505   10,490     15

Tổng lag = 2,475 nhưng P2 là vấn đề thật. Luôn xem theo partition.
~~~
Lag tăng không chỉ vì consumer chậm — cũng có thể do producer burst.

### Vì sao thêm consumer > số partition không giúp
**1 partition chỉ gán cho đúng 1 consumer** (giữ thứ tự). 4 partition + 6 consumer: 4 người làm, 2 **idle**.
~~~text
4 partitions, 6 consumers:  [C1->P0, C2->P1, C3->P2, C4->P3, C5->idle, C6->idle]
Muốn dùng C5,C6: phải tăng topic lên >= 6 partition (đánh đổi ordering với key)
~~~

### Cách giảm lag
1. **Tăng song song đúng cách:** tăng partition (lưu ý: phá {{hash(key)%N}} -> ảnh hưởng ordering) rồi scale consumer.
2. **Tăng tốc xử lý:** tối ưu (DB batch, tránh N+1), giảm {{max.poll.records}} nếu record nặng.
3. **Song song trong consumer (cẩn thận):** thread pool + commit offset theo thứ tự hoàn thành — dễ sai. An toàn hơn: 1 thread/partition.
4. **Backpressure:** {{pause(partitions)}} khi hàng đợi nội bộ đầy (giữ assignment, không rebalance); {{resume()}} khi hạ tải. Giới hạn {{fetch.max.bytes}}, {{max.poll.records}}.

~~~java
ConsumerRecords<String,String> recs = consumer.poll(Duration.ofMillis(500));
int queued = internalQueue.size();
if (queued > HIGH_WATERMARK) {
  consumer.pause(consumer.assignment());   // ngừng fetch, vẫn giữ partition
} else if (queued < LOW_WATERMARK) {
  consumer.resume(consumer.assignment());
}
// Vẫn phải gọi poll() định kỳ để heartbeat/group hoạt động đúng
for (var r : recs) internalQueue.put(r);
~~~

### Đo lag
~~~text
kafka-consumer-groups.sh --bootstrap-server broker:9092 \
  --describe --group pay-workers
# Cột: TOPIC PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG CONSUMER-ID ...
~~~
- **Burrow** đánh giá lag (OK/WARN/STALL) theo tiến triển. Client metric: {{records-lag}}, {{records-lag-max}} per partition.

### Trên production
- **Triệu chứng:** lag tăng đều (consumer không theo kịp) hoặc lag kẹt 1 partition (hot key/lỗi/rebalance loop).
- **Đo:** lag theo partition, {{records-consumed-rate}}, thời gian xử lý, rebalance rate. Alert trên "lag chỉ 1 partition".
- **Tuning:** {{max.poll.records}}, {{fetch.min.bytes}}/{{fetch.max.wait.ms}}. Burst producer -> lag tăng tạm thời chấp nhận nếu *slope* lag giảm dần.
- **Pitfall:** chỉ nhìn tổng lag; scale consumer quên trần partition; xử lý song song rồi commit offset sai thứ tự.

### Ví dụ đời thực

Triage sự cố thực tế: topic "order-events" có 6 partition, group "invoice-workers" chạy 4 consumer. Bình thường lag dưới 50. Lúc 10:00 khuyến mãi, producer bắn 30.000 message/phút còn consumer chỉ xử lý 5.000 message/phút vì ghi DB từng dòng (N+1). Tôi chạy:

{{kafka-consumer-groups.sh --bootstrap-server broker:9092 --describe --group invoice-workers}}

Kết quả: tổng lag 120.000, nhưng P2 đơn lẻ kẹt 80.000, các partition khác dưới 100. Nguyên nhân: hot key — một khách hàng đặt 50.000 đơn, toàn bộ rơi vào P2 do hash(key). Tôi thêm 2 consumer (tổng 6 bằng số partition) nhưng P2 vẫn kẹt vì một consumer đã nắm P2, consumer mới chỉ nhận partition trống. Điều trị thực sự: tối ưu ghi DB theo batch, giảm {{max.poll.records}} cho record nặng, rồi tăng partition và scale consumer cùng lúc. Kết quả sau 20 phút: lag dưới 1.000, dashboard xanh. Bài học: luôn xem lag theo partition, không chỉ tổng.

### Trả lời mẫu khi phỏng vấn

"Tôi bắt đầu bằng xem tổng lag trên dashboard, nhưng số lớn dễ che mất một partition kẹt, nên tôi luôn kéo chi tiết theo partition bằng kafka-consumer-groups.sh cùng metric records-lag của từng partition. Nguyên nhân lag thường là consumer xử lý chậm (ví dụ DB N+1) hoặc producer bỗng đẩy nhiều message. Trong một group, một partition chỉ gán cho một consumer, do đó thêm consumer vượt số partition không giúp: consumer dư đứng idle. Tôi giảm lag bằng tối ưu code xử lý, giảm max.poll.records nếu record nặng, và dùng pause/resume khi hàng đợi nội bộ đầy để tạo backpressure mà không rời group. Nếu cần scale hơn, tôi tăng partition và consumer cùng lúc, cẩn thận vì đổi key sẽ phá thứ tự theo key. Trên production tôi alert theo xu hướng lag (slope) và max lag trên partition, không chỉ tổng lag. Cuối cùng, throughput tổng của consumer phải lớn hơn producer cộng dư burst, nếu không lag là tất yếu."

> Senior tip: alert theo **xu hướng** (lag slope dương kéo dài) và theo **phân phối** (max lag partition / median > ngưỡng), không chỉ tổng lag. Và nhớ: {{consumer throughput tổng}} >= {{producer throughput}} + biên burst, nếu không lag là tất yếu về toán.`,
  follow: ["Làm sao phân biệt lag tăng do producer burst tạm thời với lag tăng do consumer thực sự không theo kịp? Bạn nhìn metric nào?", "Nếu buộc phải tăng partition để scale, bạn xử lý rủi ro thay đổi {{hash(key)%N}} với dữ liệu cần ordering theo key ra sao?", "Pause/resume khác gì với việc consumer rời group? Khi nào pause gây rebalance gián tiếp?"],
  tags: ["Kafka", "consumer lag", "backpressure", "partition", "scaling", "pause resume"],
  refs: [{"type": "doc", "title": "Kafka Consumer Configs (fetch/poll)", "url": "https://kafka.apache.org/documentation/#consumerconfigs"}, {"type": "doc", "title": "Kafka: Monitoring", "url": "https://kafka.apache.org/documentation/#monitoring"}]
},
{
  id: 'microservices-056',
  topic: 'microservices',
  level: 'lead',
  q: 'Sự cố mất điện luân phiên làm cụm Kafka 3 broker (RF=3) chỉ còn 1 broker sống, và dữ liệu đã được producer ack trước đó bị mất sau khi cụm phục hồi. Hãy truy vết **chính xác** cơ chế gây mất: ISR co rút, {{unclean.leader.election.enable}}, high watermark bị truncate, và nêu bộ cấu hình + quy trình vận hành để ngăn lặp lại.',
  a: `**Tóm tắt:** Kịch bản điển hình: follower lần lượt chậm/rớt -> **ISR co** còn mỗi leader; nếu {{min.insync.replicas}} không đủ chặt, dữ liệu "đã ack" có thể chỉ nằm ở leader. Khi leader chết và {{unclean.leader.election.enable=true}}, một follower **lạc hậu** được bầu làm leader -> **high watermark** bị hạ xuống theo LEO follower mới, và các offset vượt HW trên log cũ bị **truncate** khi broker cũ quay lại. Message từng được ack coi như committed biến mất. Ngăn bằng: {{acks=all}}, {{min.insync.replicas=2}}, {{unclean.leader.election.enable=false}}, RF>=3.

### Hiểu nhanh (ví dụ đời thường)
Ba người cùng giữ sổ (3 replica). Hai người phụ đi vắng (rớt ISR), chỉ còn trưởng nhóm ghi sổ và vẫn phát biên nhận (nếu cấu hình lỏng). Trưởng nhóm mất sổ (broker chết). Chọn tạm một người phụ **lâu ngày không cập nhật** lên làm trưởng (unclean election) — sổ thiếu dòng gần đây. Trưởng nhóm cũ tìm lại sổ phải **xé bỏ** các dòng mình có mà trưởng nhóm mới không công nhận (truncate về HW mới). Biên nhận đã phát? Dòng tiền không còn trong sổ chính thức.

### Thuật ngữ (giải thích lần đầu)
- **ISR co rút (shrink)**: follower bị loại khỏi ISR khi {{replica.lag.time.max.ms}} bị vượt.
- **Unclean leader election**: bầu leader từ replica ngoài ISR — đổi availability lấy durability.
- **Truncation**: follower/leader cũ rejoin, cắt log về **HW** của leader hiện tại, bỏ phần "thừa" chưa committed.
- **Leader epoch**: số tăng mỗi lần bầu leader, xác định vùng log hợp lệ, tránh truncate sai (KIP-101).

### Truy vết từng bước (timeline)
RF=3 (B1 leader, B2,B3 follower), cấu hình xấu: {{acks=all}} nhưng {{min.insync.replicas=1}}, {{unclean.leader.election.enable=true}}.
~~~text
T0: ISR={B1,B2,B3}, HW=100.
T1: B3 chậm, dừng ở 110 -> ISR={B1,B2}. Ghi 101..120 -> B1,B2 có, HW=120, ack OK.
T2: B2 chết -> ISR={B1}. minISR=1 nên B1 VẪN ack producer!
T3: Ghi 121..140, chỉ B1 có -> ack trả về (đã ack!). B2 có tới 120; B3 có tới ~110.
T4: B1 chết. Cụm còn B3 sống (LEO~110).
T5: unclean=true -> B3 được bầu leader. HW'=110. Offset 111..140 "mất" khỏi view committed.
T6: B2,B1 quay lại, TRUNCATE 111..140 về 110. Dữ liệu 121..140 mất vĩnh viễn.
~~~

~~~seq
title: Mất dữ liệu đã ack do ISR co + unclean election
actors: Producer | B1(Leader) | B2(Follower) | B3(Follower lag)
Producer -> B1(Leader): write 121..140 (acks=all,minISR=1)
B1(Leader) --> Producer: ack (ISR chỉ còn B1)
note B1(Leader)..B2(Follower): B2 chết, B3 lag -> ISR={B1}
B1(Leader) -> B1(Leader): B1 chết (chỉ B1 có 121..140)
B3(Follower lag) -> B3(Follower lag): unclean election -> Leader, HW=110
B2(Follower) -> B3(Follower lag): rejoin, TRUNCATE 111..120 về 110
note Producer..B3(Follower lag): 121..140 từng ack nhưng mất vĩnh viễn
~~~

### Leader epoch
Follower rejoin dùng **leader epoch** (KIP-101) để truncate chính xác tới ranh giới epoch, tránh cắt nhầm dữ liệu committed. Nhưng epoch **không cứu** dữ liệu mà leader mới (unclean) vốn không có — dữ liệu chỉ leader cũ có vẫn mất.

### Bộ cấu hình ngăn mất dữ liệu (durability-first)
| Cấu hình | Giá trị an toàn (RF=3) | Ý nghĩa |
|---|---|---|
| {{replication.factor}} | 3 | 3 bản sao |
| {{min.insync.replicas}} | 2 | "all" phải gồm >=2 replica |
| {{unclean.leader.election.enable}} | false | Không bầu leader ngoài ISR |
| Producer {{acks}} | all | Chờ ISR ghi |
| Producer {{enable.idempotence}} | true | Chống trùng khi retry |

~~~java
props.put("acks", "all");
props.put("enable.idempotence", "true");
props.put("retries", Integer.MAX_VALUE);
props.put("delivery.timeout.ms", 120000);
props.put("max.in.flight.requests.per.connection", "5");
// App PHẢI xử lý lỗi gửi - nếu minISR không đủ sẽ nhận NotEnoughReplicas
~~~

**Trade-off:** {{minISR=2, unclean=false}}, nếu 2/3 broker chết -> partition **không nhận ghi** ({{NotEnoughReplicas}}). Dữ liệu tiền/audit: **không nhận ghi**.

### Trên production
- **Triệu chứng:** sau failover offset/đối soát hụt; unclean election metric nhảy.
- **Đo:** {{UnderReplicatedPartitions}}, {{UnderMinIsrPartitionCount}}, {{IsrShrinks/ExpandsPerSec}}, {{UncleanLeaderElectionsPerSec}}. Alert trang ngay nếu unclean election > 0.
- **Vận hành:** 3 broker trên 3 failure domain (AZ/rack). Kiểm tra {{kafka-configs.sh}}; topic critical có RF/minISR đúng.
- **Bẫy:** tin "acks=all là đủ" mà quên {{min.insync.replicas}} mặc định 1; bật unclean tạm rồi quên tắt; broker/topic override lệch.

### Ví dụ đời thực

Sự cố thực tế: cụm Kafka 3 broker (RF=3), topic "payments", cấu hình đã lệch: {{acks=all}} nhưng {{min.insync.replicas=1}} và {{unclean.leader.election.enable=true}}. Lúc 02:00 mất điện luân phiên, B2 và B3 từng rớt ISR vì chậm ghi, chỉ còn B1 làm leader và vẫn ack producer (minISR=1 cho phép một replica ack một mình). Các lệnh thanh toán 121..140 chỉ tồn tại trên B1. B1 đột ngột chết, cụm còn B3 sống nhưng LEO chỉ khoảng 110. Vì bật unclean election, một replica lạc hậu được bầu làm leader và high watermark hạ về 110. B1, B2 quay lại sau khi có điện, cắt log về 110 (truncate), các lệnh 111..140 mất vĩnh viễn dù producer đã nhận ack. Khách hàng liên hệ báo tiền bị mất. Khắc phục: phục hồi từ backup, tắt unclean election, đặt {{min.insync.replicas=2}}, triển khai kiểm tra cấu hình tự động so với baseline. Kết quả: test failover sau đó không còn mất dữ liệu, metric {{UncleanLeaderElectionsPerSec}} về 0.

### Trả lời mẫu khi phỏng vấn

"Kịch bản mất dữ liệu do ba sai cấu hình cùng hiện: follower rớt ISR cho đến khi chỉ còn một replica trong ISR, minISR=1 để leader ack một mình, và bật unclean election để một replica lạc hậu lên làm leader khi leader chính chết. Kết quả là high watermark hạ xuống theo bản sao mới, log cũ bị truncate, các message đã ack biến mất. Để ngăn, tôi dùng bộ ba bất biến: {{acks=all}}, {{min.insync.replicas=2}}, {{unclean.leader.election.enable=false}} với RF>=3. Trade-off là nếu hai broker chết, partition từ chối ghi (NotEnoughReplicas) — với dữ liệu thanh toán tôi chấp nhận không nhận ghi thay vì mất dữ liệu. Trên production tôi theo dõi {{UnderReplicatedPartitions}}, {{UnderMinIsrPartitionCount}} và alert ngay khi có unclean election. Leader epoch (KIP-101) giúp truncate chính xác ranh giới epoch nhưng không cứu dữ liệu chỉ có trên leader cũ."

> Senior tip: tôi coi {{unclean.leader.election.enable=false}} + {{min.insync.replicas=2}} + {{acks=all}} là "bộ ba bất biến" cho topic quan trọng và viết kiểm tra cấu hình tự động so với baseline. Đa số sự cố mất dữ liệu Kafka là do cấu hình lệch khỏi bộ ba này.`,
  follow: ["Tại sao {{acks=all}} một mình chưa đủ nếu {{min.insync.replicas=1}}? Mô tả kịch bản mất dữ liệu cụ thể.", "Khi 2/3 broker chết và {{unclean=false}}, ứng dụng nhận lỗi gì? Bạn thiết kế (retry, lưu đệm, fail open/close) thế nào để không mất yêu cầu người dùng?", "Leader epoch (KIP-101) giải quyết vấn đề truncate sai nào so với dùng high watermark thuần? Nó có ngăn được mất dữ liệu do unclean election không?"],
  tags: ["Kafka", "data loss", "unclean leader election", "ISR", "high watermark", "truncate", "durability"],
  refs: [{"type": "doc", "title": "Kafka Topic Configs", "url": "https://kafka.apache.org/documentation/#topicconfigs"}, {"type": "doc", "title": "Kafka: Replication", "url": "https://kafka.apache.org/documentation/#replication"}, {"type": "doc", "title": "KIP-101: Leader Epoch", "url": "https://cwiki.apache.org/confluence/display/KAFKA/KIP-101+-+Alter+Replication+Protocol+to+use+Leader+Epoch+rather+than+High+Watermark+for+Truncation"}]
},
{
  id: 'microservices-057',
  topic: 'microservices',
  level: 'senior',
  q: 'Một luồng Kafka dùng **transactional producer** (EOS) để consume-transform-produce. Dù Kafka báo commit thành công, downstream vẫn thỉnh thoảng thấy **tác dụng lặp** (gửi thông báo hai lần, ghi bản ghi trùng ở hệ ngoài). Giải thích vì sao **EOS trong Kafka không bao phủ side effect ngoài Kafka**, và bạn thiết kế effectively-once ra sao khi phải gọi HTTP/ghi DB?',
  a: `**Tóm tắt:** Kafka transactions đảm bảo ghi topic output + commit offset input là **nguyên tử trong Kafka** (nhờ transaction coordinator, control marker, {{read_committed}}). Nhưng mọi thứ ngoài Kafka — HTTP call, ghi DB, gửi email — nằm ngoài tầm kiểm soát của coordinator: coordinator không thể rollback một HTTP đã gửi. Nếu xử lý gọi HTTP rồi crash trước {{commitTransaction}}, lần retry sẽ **gọi HTTP lần nữa**. Vì vậy cần **effectively-once** = at-least-once + **idempotency ở biên** (idempotency key, dedup/inbox, upsert) cho mọi side effect ngoài.

### Hiểu nhanh (ví dụ đời thường)
Kafka transaction giống **giao dịch nội bộ một ngân hàng**: chuyển tiền giữa hai tài khoản trong cùng ngân hàng, sổ cái nội bộ đảm bảo hoặc cả hai hoặc không. Nhưng bước "gọi điện sang ngân hàng khác" (HTTP ngoài) ngân hàng nội bộ không thể "rút lại". Nhân viên gọi xong rồi bị ngất trước khi chốt sổ (crash trước commit), ca sau làm lại sẽ **gọi điện lần nữa**. Cách đúng: mỗi cuộc gọi kèm **mã giao dịch duy nhất**; ngân hàng kia thấy mã trùng thì không chuyển lần hai.

### Thuật ngữ (giải thích lần đầu)
- **EOS trong Kafka**: exactly-once *trong phạm vi Kafka topics + consumer offsets*.
- **Side effect ngoài**: hành động ảnh hưởng hệ thống không tham gia transaction Kafka (DB, HTTP, email).
- **Effectively-once**: hệ quả quan sát được xảy ra đúng một lần, dù bên dưới là at-least-once + idempotency.
- **Idempotency key**: mã định danh duy nhất cho một đơn vị công việc, gửi kèm để đích nhận ra trùng.

### Cơ chế: vì sao trùng xảy ra
~~~text
Lần 1 (offset=50): beginTx -> http.post(notify,O1) [ngoài tx, đã gửi] -> CRASH trước commitTx
  => abort -> offset 50 chưa commit
Lần 2 (retry, offset 50): beginTx -> http.post(notify,O1) [GỬI LẦN 2, TRÙNG] -> commitTx
  => Kafka "thành công", nhưng notify đã x2
~~~
{{commitTransaction}} chỉ ghi control markers vào Kafka; nó không có giao thức với {{notifyService}}.

~~~seq
title: EOS Kafka vs side effect ngoài (trùng)
actors: App(Worker) | KafkaTxn | Notify(HTTP)
App(Worker) -> KafkaTxn: beginTx, consume offset=50
App(Worker) -> Notify(HTTP): POST notify O1 (ngoài tx) (1)
App(Worker) -> App(Worker): CRASH trước commitTx
note App(Worker)..KafkaTxn: abort -> offset 50 chưa commit
App(Worker) -> KafkaTxn: retry consume offset=50
App(Worker) -> Notify(HTTP): POST notify O1 (ngoài tx) (2) TRÙNG
App(Worker) -> KafkaTxn: commitTx (Kafka OK, notify đã x2)
~~~

### Thiết kế effectively-once
1. **Idempotency key gửi tới đích:** key ổn định từ input ({{eventId}} hoặc {{topic-partition-offset}}), gửi header {{Idempotency-Key}}. Đích lưu key (unique), trùng thì no-op trả kết quả cũ.
~~~java
// Key ổn định per record (KHÔNG dùng random mỗi lần retry)
String idemKey = record.topic()+"-"+record.partition()+"-"+record.offset();
HttpRequest req = HttpRequest.newBuilder(uri)
  .header("Idempotency-Key", idemKey)
  .POST(HttpRequest.BodyPublishers.ofString(body)).build();
// notifyService: insert key unique -> nếu trùng thì no-op, trả 200
~~~
2. **Outbox/intent tại DB:** ghi "intent" vào DB (cùng tx DB) rồi relay riêng gửi HTTP idempotent.
3. **Inbox + upsert ở đích:** {{INSERT inbox(eventId) ON CONFLICT DO NOTHING}} + upsert nghiệp vụ.
4. **Chấp nhận và bù trừ:** tác dụng khó đảo (email) đôi khi chấp nhận hiếm trùng + bù trừ.

### So sánh
| Cách | Khi nào | Hạn chế |
|---|---|---|
| Kafka EOS thuần | Chỉ đọc/ghi Kafka | Không áp dụng khi có HTTP/DB ngoài |
| Idempotency key tới đích | Đích hỗ trợ/bạn sở hữu | Cần hợp đồng API; key phải ổn định |
| Outbox + relay | Tách DB out và HTTP out | Thêm độ trễ, thêm thành phần |
| At-least-once + inbox | Đơn giản, đích là DB bạn sở hữu | Ít "ảo giác" hơn |

### Trên production
- **Triệu chứng:** gửi notify 2 lần cùng order; khách nhận 2 email/SMS. Trùng thời điểm rebalance/deploy/crash.
- **Đo:** tỉ lệ duplicate theo idempotency key; đối soát event input vs side effect output (phải 1:1).
- **Tuning:** key ổn định (eventId nghiệp vụ bền hơn offset khi reset offset). TTL lưu key dedup đủ dài hơn cửa sổ retry tối đa.
- **Pitfall:** dùng {{UUID.randomUUID()}} mỗi lần retry -> vô dụng. Tin {{commitTransaction}} bảo vệ HTTP.

### Ví dụ đời thực

Sự cố thực tế: dịch vụ "order-notifier" consume topic "orders", transform rồi gọi HTTP gửi email xác nhận và ghi DB, bật Kafka transaction (EOS). Lúc 14:30 deploy bản mới, worker crash ngay sau khi gọi HTTP nhưng trước khi {{commitTransaction}}. Transaction abort, offset chưa commit, lần retry consume lại cùng message và gọi HTTP lần thứ hai. Khách nhận hai email xác nhận cùng một đơn, ghi DB trùng hai dòng. Kiểm tra log thấy dịch vụ dùng {{UUID.randomUUID()}} làm idempotency key mỗi lần retry, nên dedup không hoạt động. Sửa: dùng key ổn định {{topic-partition-offset}} làm Idempotency-Key, dịch vụ email lưu key duy nhất và no-op khi trùng. Sau khi sửa, đối soát event input versus output email là 1:1, không còn trùng sau crash hoặc rebalance.

### Trả lời mẫu khi phỏng vấn

"Kafka transaction chỉ đảm bảo nguyên tử trong phạm vi Kafka: ghi topic output và commit offset input đi cùng nhau, nhờ transaction coordinator và control marker. Nhưng HTTP, ghi DB, gửi email nằm ngoài tầm kiểm soát — coordinator không thể hủy một HTTP đã gửi. Nếu worker crash sau khi gọi HTTP rồi trước khi commit, lần retry sẽ gọi lại HTTP, nên bên ngoài Kafka vẫn là at-least-once. Thiết kế đúng là effectively-once: at-least-once cộng idempotency ở biên. Mỗi record kèm idempotency key ổn định (ví dụ topic-partition-offset), header Idempotency-Key gửi tới đích, đích lưu key duy nhất và no-op khi trùng. Nếu đích không hỗ trợ, tôi dùng outbox trong DB cùng transaction nghiệp vụ rồi relay riêng, hoặc chấp nhận hiếm trùng và bù trừ. Không bao giờ dùng UUID random mỗi lần retry, và không bao giờ coi EOS là bằng chứng không trùng với hệ ngoài."

> Senior tip: **Kafka transaction chỉ bọc thứ Kafka kiểm soát**. Có bất kỳ {{http.*}}, {{jdbc.*}} tới hệ ngoài, gửi mail, hay SDK cloud nào trong đường đi -> coi toàn bộ là at-least-once và thiết kế idempotency end-to-end. Đừng để "đã bật EOS" là bằng chứng không trùng.`,
  follow: ["Idempotency key nên lấy từ {{(topic,partition,offset)}} hay từ {{eventId}} nghiệp vụ? Ảnh hưởng khi topic bị compact hoặc consumer reset offset?", "Nếu đích (third-party) không hỗ trợ idempotency key, bạn thiết kế lớp chống trùng ở phía bạn thế nào?", "Khi nào bạn chọn bỏ Kafka transaction và chỉ dùng at-least-once + idempotent consumer? Đánh đổi vận hành/độ trễ?"],
  tags: ["Kafka", "EOS", "transactions", "idempotency", "side effects", "exactly-once", "effectively-once"],
  refs: [{"type": "doc", "title": "Kafka: Transactions and Exactly-Once Semantics", "url": "https://kafka.apache.org/documentation/#semantics"}, {"type": "doc", "title": "Microservices.io: Idempotent Consumer", "url": "https://microservices.io/patterns/communication-style/idempotent-consumer.html"}]
},
{
  id: 'microservices-058',
  topic: 'microservices',
  level: 'senior',
  q: 'Một request đi qua API, order, inventory và pricing; mỗi hop đặt timeout 2 giây nhưng p99 toàn luồng vẫn vượt SLO và thread bị giữ chờ. Bạn thiết kế deadline budget xuyên service và bulkhead thế nào để hop sâu không tiêu hết thời gian của caller?',
  a: `**Tóm tắt:** Timeout từng hop là giới hạn cục bộ; deadline budget là tổng thời gian còn lại cho cả request, được chia sẻ cho mọi bước. Tôi truyền deadline/remaining budget, trừ thời gian đã dùng trước mỗi lời gọi, đặt giới hạn chờ hàng đợi và cô lập tài nguyên bằng bulkhead để một dependency chậm không chiếm hết năng lực của service.

### Deadline khác timeout từng hop thế nào?
**Timeout** là thời gian tối đa cho một thao tác. Nếu API đặt 2 giây cho order, rồi order lại đặt 2 giây cho inventory, rồi inventory đặt 2 giây cho pricing, chuỗi có thể kéo dài gần 6 giây (chưa tính xử lý và queue). Trong khi client có thể chỉ chờ 1 giây. Khi client đã bỏ đi, các service phía sau vẫn chạy và giữ thread, connection, CPU cho kết quả không còn ai dùng.

**Deadline** là thời điểm cuối cùng kết quả còn hữu ích. Ví dụ SLO của request là 800 ms; dành 100 ms cho gateway và serialize, còn 700 ms cho service. Order dùng 120 ms trước khi gọi inventory thì chỉ được cấp tối đa 580 ms, không được tự khởi động lại đồng hồ 800 ms. Mỗi service cần tính cả thời gian chờ bulkhead, connection pool và xử lý local, không chỉ thời gian chờ socket.

### Cách triển khai theo từng bước
1. Chọn budget từ SLO và nhu cầu người dùng, không lấy timeout mặc định của thư viện. Đặt deadline ở biên tin cậy, giới hạn giá trị client gửi để không cho request chiếm tài nguyên vô hạn.
2. Truyền deadline theo giao thức: gRPC có deadline; với HTTP có thể truyền remaining timeout qua metadata/header nội bộ đã được xác thực. Không truyền trực tiếp giá trị {{System.nanoTime()}} sang máy khác: đồng hồ monotonic chỉ so sánh được trong một tiến trình. Trừ sai số đồng hồ nếu dùng thời điểm tuyệt đối.
3. Mỗi hop lấy budget còn lại, trừ thời gian đã trôi qua tại service đó, rồi dùng giá trị nhỏ hơn giữa budget còn lại và giới hạn riêng của dependency. Nếu budget đã hết thì từ chối sớm, không gọi downstream.
4. Áp dụng bulkhead: giới hạn số lời gọi đồng thời đến từng dependency, đồng thời giới hạn thời gian chờ lấy slot. Bulkhead giống vách ngăn trên tàu: sự cố một khoang không làm ngập toàn tàu. Bounded queue hoặc semaphore có giới hạn tránh tích lũy việc đã quá hạn.

~~~java
long deadline = System.nanoTime() + budget.toNanos();
long remaining = deadline - System.nanoTime();
if (remaining <= 0) throw new TimeoutException("request budget exhausted");
// Chờ slot chỉ trong phần nhỏ của ngân sách còn lại.
if (!inventorySlots.tryAcquire(Math.min(remaining, 20_000_000L),
        TimeUnit.NANOSECONDS)) throw new RejectedExecutionException();
try {
  long callNanos = Math.min(deadline - System.nanoTime(), MAX_INVENTORY_NANOS);
  return inventoryClient.reserve(item, Duration.ofNanos(callNanos));
} finally {
  inventorySlots.release();
}
~~~
Đây là minh họa về phép tính và semaphore, không phải một cấu hình Spring hoàn chỉnh; client thật phải hỗ trợ timeout/cancel và giải phóng tài nguyên khi bị hủy.

### Trade-off và khi nào dùng
| Cách | Ưu điểm | Rủi ro |
|---|---|---|
| Timeout cố định mỗi hop | Dễ bắt đầu, chặn lời gọi vô hạn | Cộng dồn vượt SLO; hop sâu không biết caller còn chờ bao lâu |
| Deadline truyền xuyên luồng | Ngừng công việc vô ích sớm, giữ tổng latency trong ngân sách | Cần truyền context đúng qua async/thread boundary và xử lý clock/protocol |
| Bulkhead theo dependency | Một dependency chậm không chiếm toàn bộ pool | Giới hạn quá thấp gây từ chối sớm; quá cao vẫn làm quá tải DB/remote |

Dùng deadline cho request đồng bộ có hạn chờ rõ ràng. Với job nền cần hoàn thành cuối cùng, dùng deadline khác hoặc retry queue có giới hạn; không áp deadline của HTTP ngắn cho công việc cần chạy vài phút.

### Pitfall production
- Chỉ đặt timeout đọc socket mà quên connect timeout, queue timeout hoặc timeout lấy connection; request vẫn mắc kẹt trước khi gửi.
- Retry tạo một ngân sách mới thay vì dùng phần còn lại, khiến tổng thời gian vượt deadline.
- Hủy future không có nghĩa HTTP call/DB query bên dưới đã dừng; kiểm tra cancellation và đóng response/connection.
- Chia sẻ một pool cho request thường và thao tác chậm khiến bulkhead mất tác dụng. Theo dõi active, queued, rejected, timeout theo dependency.

### Ví dụ đời thực
Trang checkout có SLO p99 900 ms. Trước sửa, gateway chờ 900 ms, order chờ inventory 700 ms rồi pricing 700 ms; p99 đo được 2,1 giây và 18% request hết hạn ở client nhưng vẫn chạy backend. Nhóm truyền remaining budget, giới hạn queue inventory 30 ms, dành tối đa 250 ms cho inventory và 120 ms cho pricing. Sau deploy, p99 còn 760 ms; khi inventory chậm, checkout trả trạng thái có thể thử lại trong 820 ms thay vì để request chạy ngầm.

### Trả lời mẫu khi phỏng vấn
“Em bắt đầu từ latency mà người dùng thực sự chấp nhận, rồi biểu diễn nó thành một deadline duy nhất cho toàn request. Timeout cố định riêng lẻ không cộng thành một giới hạn tổng: năm hop mỗi hop chờ một giây có thể khiến caller chờ nhiều giây. Em truyền deadline hoặc remaining budget qua các service, mỗi hop trừ thời gian đã tiêu và chỉ cấp phần còn lại cho downstream. Em cũng tính thời gian nằm trong queue và lấy connection, vì timeout chỉ ở socket là chưa đủ. Với dependency dễ chậm, em dùng bulkhead giới hạn concurrency và queue ngắn; nếu không lấy được slot trong budget thì fail sớm. Các lời gọi bị timeout cần được cancel tốt nhất có thể, và retry không được tạo deadline mới. Cuối cùng em đo p95/p99, timeout, queue và rejection theo dependency để điều chỉnh dựa trên tải thật, thay vì tăng timeout chung cho tất cả.”

> Senior tip: Hãy đo thời gian chờ queue riêng với thời gian gọi remote; nếu queue đã ăn 300 ms trong budget 500 ms, tăng socket timeout chỉ che triệu chứng.`,
  follow: [
    'Nếu một HTTP client không hỗ trợ truyền deadline, bạn sẽ truyền remaining budget và xử lý sai lệch đồng hồ thế nào?',
    'Khi request bị cancel ở gateway, làm sao xác minh công việc downstream thực sự dừng và tài nguyên được giải phóng?',
    'Bạn chọn giới hạn bulkhead dựa trên throughput, pool size và SLO ra sao?'
  ],
  tags: ['deadline', 'timeout', 'bulkhead', 'latency']
},
{
  id: 'microservices-059',
  topic: 'microservices',
  level: 'senior',
  q: 'Một provider trả 429 và 503 trong giờ cao điểm; nhiều tầng trong ứng dụng đều retry nên số request tăng gấp nhiều lần. Bạn thiết kế retry budget, backoff có jitter và quy tắc retry để giảm tải thay vì khuếch đại sự cố thế nào?',
  a: `**Tóm tắt:** Retry chỉ hữu ích cho lỗi tạm thời và thao tác có thể lặp an toàn; nếu nhiều tầng cùng retry, một request ban đầu có thể biến thành hàng chục lần gọi. Tôi chọn một tầng chịu trách nhiệm retry, đặt giới hạn số lần lẫn retry budget theo dependency, dùng exponential backoff có jitter, tôn trọng {{Retry-After}} và deadline của request.

### Retry storm hình thành ra sao?
Retry là gửi lại sau lỗi. Khi provider quá tải, request đầu tiên đã góp tải nhưng client không nhận kết quả; nếu 3 tầng mỗi tầng thử 3 lần, một yêu cầu có thể tạo đến 27 lần gọi (3 × 3 × 3). Provider càng quá tải thì tỷ lệ lỗi càng cao, từ đó retry càng tăng tải: đây là vòng phản hồi xấu. Nhiều client cùng dùng lịch chờ cố định cũng thức dậy đồng thời, tạo “thundering herd” — đàn request dồn tới cùng một lúc.

### Quy tắc thiết kế
1. Phân loại lỗi. Lỗi kết nối/reset hoặc 503 có thể tạm thời; lỗi 400/401/403 thường không tự hết khi gửi lại. Với 429, tôn trọng {{Retry-After}} nếu có. Không retry lỗi nghiệp vụ như “hết tồn kho”.
2. Chỉ retry thao tác idempotent — lặp lại không tạo thêm tác dụng phụ. GET thường phù hợp; POST tạo thanh toán chỉ an toàn khi server hỗ trợ idempotency key và lưu kết quả theo key. Timeout không chứng minh server chưa xử lý.
3. Chọn đúng một tầng sở hữu retry, ví dụ adapter gọi provider. Kiểm tra cấu hình retry của SDK, HTTP client, gateway và service mesh để tránh chồng lớp. Giới hạn cả số lần và tổng thời gian, luôn nằm trong deadline.
4. Dùng exponential backoff: khoảng chờ tăng theo lần thử, ví dụ 100 ms, 200 ms, 400 ms, có mức trần. **Jitter** ngẫu nhiên hóa thời điểm, chẳng hạn full jitter lấy ngẫu nhiên từ 0 đến khoảng chờ tối đa. Thời gian chờ chính xác cần tune theo provider và SLA.
5. Đặt retry budget: chỉ cho phép một lượng nhỏ request retry so với request gốc trong một khoảng đo (ví dụ tối đa 10 retry trên 100 request ban đầu). Khi token/budget cạn, fail fast thay vì tiếp tục gọi. Có thể đặt theo dependency hoặc tenant để một nguồn lỗi không tiêu quota của phần còn lại.

~~~java
for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
  try {
    return provider.call(request, remainingDeadline());
  } catch (TransientException e) {
    if (!isIdempotent(request) || attempt + 1 == MAX_ATTEMPTS) throw e;
    if (!retryBudget.tryConsume(providerName)) throw e;
    long cap = Math.min(MAX_DELAY_MS, BASE_DELAY_MS << attempt);
    // Full jitter: giảm khả năng mọi client retry cùng thời điểm.
    sleep(random.nextLong(0, cap + 1));
  }
}
throw new IllegalStateException("unreachable");
~~~
Đây là pseudocode chính sách; xử lý {{Retry-After}}, cancellation, tràn số khi tăng lũy thừa và deadline cần được bổ sung trong code production.

### Trade-off
| Chính sách | Lợi ích | Chi phí |
|---|---|---|
| Không retry | Không tăng tải khi lỗi | Mất cơ hội tự phục hồi lỗi mạng thoáng qua |
| Retry ngắn, có giới hạn | Che được lỗi tạm thời | Tăng latency và một ít tải |
| Retry dài/vô hạn | Có thể hoàn tất eventual | Giữ tài nguyên, làm provider quá tải lâu hơn |
| Jitter + budget | Dàn tải và chặn khuếch đại | Phải quan sát ngân sách; retry bị từ chối có thể làm tỷ lệ lỗi trực tiếp tăng trong outage |

Retry hợp cho lỗi transient, thao tác idempotent và còn đủ deadline. Với công việc cần hoàn thành sau khi request trả về, đưa vào queue bền vững có retry policy/DLQ thích hợp hơn giữ thread HTTP.

### Pitfall production
- Retry mọi exception, kể cả validation, authentication và lỗi dữ liệu vĩnh viễn.
- Không giới hạn tổng thời gian; 3 lần retry nhưng mỗi lần chờ timeout 10 giây vẫn phá SLO.
- Tự retry POST sau timeout mà không idempotency key, gây thanh toán/đơn hàng trùng.
- Jitter chỉ thêm một khoảng cố định nhỏ vẫn có thể đồng bộ; backoff vượt deadline khiến kết quả đến sau khi caller bỏ đi.
- Không ghi metric attempt gốc và attempt retry riêng nên dashboard tưởng lưu lượng nghiệp vụ tăng tự nhiên.

### Ví dụ đời thực
Một dịch vụ gửi hóa đơn có 3 lớp retry, mỗi lớp thử 3 lần. Khi provider trả 503 ở mức 20% trên 2.000 request/phút, downstream nhận gần 5.000 lần gọi/phút và lỗi kéo dài 25 phút. Nhóm bỏ retry ở gateway và SDK, giữ tối đa 2 lần ở adapter, full jitter 100–500 ms, tổng deadline 2 giây, retry budget 5% và không retry lỗi nghiệp vụ. Lần sự cố tiếp theo, đỉnh gọi giảm còn 2.100/phút; 503 hạ dưới 1% sau 4 phút.

### Trả lời mẫu khi phỏng vấn
“Em không bắt đầu bằng việc tăng số lần retry mà phân loại lỗi và xác định ai sở hữu retry. Retry nhiều tầng nhân số lần gọi, nên em kiểm tra cả SDK, client, gateway và mesh, rồi giữ policy ở một adapter. Chỉ lỗi transient mới được thử lại; thao tác ghi phải idempotent hoặc có idempotency key, vì timeout có thể xảy ra sau khi server đã ghi dữ liệu. Em giới hạn attempts và tổng thời gian trong deadline, dùng exponential backoff với jitter, tôn trọng Retry-After và có retry budget theo dependency. Khi budget cạn, request mới fail sớm để bảo vệ provider và hệ thống của mình. Em theo dõi request gốc, retry ratio, mã lỗi và latency riêng; nếu retry đang tăng trong khi success không tăng thì retry đang làm hại chứ không giúp.”

> Senior tip: Đặt cảnh báo theo tỷ lệ retry/request gốc; tỷ lệ thành công cuối cùng có thể trông ổn trong khi hệ thống đang âm thầm tạo tải gấp nhiều lần.`,
  follow: [
    'Với lệnh tạo thanh toán timeout sau khi gửi request, bạn xác định kết quả và retry an toàn bằng cách nào?',
    'Bạn định nghĩa và đo retry budget per-service ra sao khi có nhiều instance?',
    'Khi provider gửi Retry-After dài hơn deadline của client, bạn xử lý thế nào?'
  ],
  tags: ['retry', 'jitter', 'retry-budget', 'idempotency']
},
{
  id: 'microservices-060',
  topic: 'microservices',
  level: 'senior',
  q: 'Trang sản phẩm gọi recommendation, review và inventory; recommendation chậm nhưng hai phần còn lại vẫn khỏe. Bạn thiết kế graceful degradation để trang vẫn dùng được mà không hiển thị dữ liệu sai hoặc biến fallback thành một dependency mới thế nào?',
  a: `**Tóm tắt:** Graceful degradation là chủ động giảm tính năng không thiết yếu khi dependency chậm/hỏng, nhưng giữ đúng các cam kết cốt lõi. Tôi phân loại dữ liệu theo mức độ bắt buộc, đặt timeout ngắn cho phần tùy chọn, dùng cache stale có tuổi dữ liệu rõ ràng hoặc bỏ khối recommendation, và không giả mạo thành công cho thao tác quan trọng như thanh toán/tồn kho.

### Cái gì cần degrade và vì sao?
Dependency là hệ thống mà request hiện tại cần gọi, ví dụ recommendation service. Không phải phần nào cũng có cùng mức quan trọng:
- Giá phải chính xác trước khi xác nhận thanh toán.
- Tồn kho có thể cần kiểm tra trực tiếp trước khi nhận đơn; cache cũ có thể khiến bán quá số lượng.
- Recommendation thường chỉ giúp khám phá sản phẩm, nên có thể bỏ qua hoặc thay bằng danh sách phổ biến.
- Review có thể hiển thị dữ liệu cache kèm thời điểm cập nhật.

Trước khi viết fallback, product và engineering thống nhất contract: phần nào biến mất, có thông báo không, dữ liệu có thể cũ bao lâu, và có được phép trả kết quả không đầy đủ không. Trả HTTP 200 nhưng lặng lẽ biến lỗi thanh toán thành “đã thanh toán” là sai nghiệp vụ, không phải degradation.

### Luồng xử lý
1. Chia request thành phần bắt buộc và tùy chọn; gọi phần tùy chọn bất đồng bộ hoặc với budget nhỏ để không chặn phần chính.
2. Đặt timeout ngắn phù hợp SLO. Nếu timeout, circuit breaker có thể tạm ngừng gọi khi lỗi liên tục; nó tránh tiếp tục dồn request vào dependency đang hồi phục.
3. Chọn fallback theo freshness: cache có TTL và timestamp; nếu quá hạn cho phép thì bỏ phần dữ liệu thay vì trình bày như hiện tại. Fallback tĩnh như “sản phẩm phổ biến” phải được xác định trước, không gọi thêm một service đang cùng lỗi.
4. Trả trạng thái degradation minh bạch trong response/log/metric. Giữ lỗi gốc để điều tra, nhưng không gửi chi tiết nội bộ nhạy cảm cho client.
5. Khi dependency phục hồi, circuit đóng lại theo policy; kiểm tra tốc độ phục hồi để traffic không dồn đột ngột.

~~~java
ProductPage page = catalog.load(productId); // dữ liệu bắt buộc
try {
  List<Item> picks = recommendations.fetch(productId, Duration.ofMillis(80));
  return page.withRecommendations(picks, "live");
} catch (TimeoutException | ServiceUnavailableException e) {
  CachedItems cached = recommendationCache.get(productId);
  if (cached != null && cached.age().compareTo(Duration.ofHours(2)) < 0)
    return page.withRecommendations(cached.items(), "stale");
  return page.withoutRecommendations(); // không chặn trang chính
}
~~~
Trong code thật, bắt exception cụ thể mà client dùng, hủy lời gọi khi timeout, ghi metric và không cache lỗi như dữ liệu rỗng nếu việc đó làm che outage.

### Trade-off / chọn fallback
| Phương án | Khi phù hợp | Cẩn trọng |
|---|---|---|
| Bỏ tính năng tùy chọn | Recommendation, badge, nội dung phụ | UX cần giải thích nếu người dùng kỳ vọng |
| Cache stale | Nội dung ít thay đổi, chấp nhận độ cũ | Hiển thị tuổi; không dùng cho số dư/tồn kho cần chính xác |
| Giá trị mặc định | Tính năng có default an toàn, đã được nghiệp vụ duyệt | Default có thể bị hiểu thành dữ liệu thật |
| Trả lỗi rõ ràng | Hành động cốt lõi không thể đảm bảo | Không biến lỗi thành success giả |

### Pitfall production
- Cache không có timestamp/giới hạn stale làm dữ liệu cũ vô thời hạn.
- Fallback gọi sang một service khác dùng chung DB/pool, vô tình tạo thêm tải trong outage.
- Trả danh sách rỗng rồi cache lâu khiến dữ liệu tốt bị thay bằng “kết quả lỗi”.
- Circuit breaker dùng chung cho mọi tenant hoặc mọi operation làm lỗi một nhóm ảnh hưởng tất cả.
- Không đo fallback rate nên hệ thống trông khỏe dù gần như mọi request đang chạy degraded.

### Ví dụ đời thực
Trang chi tiết sản phẩm có p99 450 ms, recommendation p99 tăng lên 1,8 giây do một truy vấn chậm. UI chờ recommendation khiến 22% trang vượt SLO 700 ms. Nhóm đặt ngân sách 80 ms cho recommendation, dùng cache tối đa 2 giờ và bỏ khối gợi ý nếu cache cũ hơn; giá và tồn kho vẫn lấy từ nguồn chính xác. Sau deploy, p99 trang còn 520 ms, tỷ lệ trang dùng fallback là 7% trong sự cố và giảm về 0,3% sau khi sửa query. Metric này giúp phát hiện chất lượng suy giảm dù trang vẫn trả 200.

### Trả lời mẫu khi phỏng vấn
“Em trước hết phân biệt dữ liệu bắt buộc cho tính đúng đắn với tính năng chỉ cải thiện trải nghiệm. Giá và tồn kho trước khi đặt đơn không thể lấy fallback tùy tiện, còn recommendation thường có thể bỏ qua. Em đặt timeout nhỏ cho dependency tùy chọn, dùng cache stale chỉ trong giới hạn tuổi đã được nghiệp vụ chấp thuận, hoặc bỏ hẳn phần đó. Response cần thể hiện degraded state để frontend và observability biết, đồng thời metric fallback rate không bị nhầm là success bình thường. Em tránh fallback gọi thêm service khác và không cache kết quả rỗng do lỗi. Với phần cốt lõi không đảm bảo được, em trả lỗi có thể hành động thay vì giả thành công. Sau cùng em kiểm tra SLO, freshness và hành vi khi dependency phục hồi để tránh traffic dồn trở lại.”

> Senior tip: Hãy định nghĩa “stale tối đa bao lâu” với product cho từng loại dữ liệu; cache TTL kỹ thuật không tự quyết định dữ liệu đó còn an toàn để dùng hay không.`,
  follow: [
    'Bạn biểu diễn trong API response việc một trường là stale hoặc bị bỏ qua như thế nào mà vẫn backward compatible?',
    'Khi dependency phục hồi sau vài phút, làm sao tránh đồng loạt làm nóng lại cache?',
    'Những metric nào cho biết fallback đang bảo vệ UX hay đã che mất lỗi kéo dài?'
  ],
  tags: ['graceful-degradation', 'cache', 'fallback', 'circuit-breaker']
},
{
  id: 'microservices-061',
  topic: 'microservices',
  level: 'lead',
  q: 'Một chiến dịch làm lưu lượng tăng gấp bốn; queue của API dài dần, latency tăng và các service phụ thuộc lần lượt timeout. Bạn tìm điểm bắt đầu của cascading failure và thiết kế load shedding, giới hạn queue, ưu tiên request thế nào để giữ luồng quan trọng?',
  a: `**Tóm tắt:** Cascading failure là quá tải ở một thành phần lan sang thành phần khác qua queue, thread và retry, khiến năng lực toàn chuỗi sụp dù ban đầu chỉ có một bottleneck. Load shedding chủ động từ chối công việc không thể xử lý kịp, giới hạn queue/concurrency và giữ năng lực cho request quan trọng thay vì nhận mọi request rồi để chúng timeout muộn.

### Vì sao queue dài nguy hiểm?
Queue là hàng đợi công việc đang chờ worker. Khi tốc độ đến lớn hơn tốc độ xử lý, queue tăng mãi; request chiếm bộ nhớ và thường giữ thêm thread hoặc connection. Ví dụ service xử lý 800 request/giây nhưng nhận 1.200 request/giây: mỗi giây backlog tăng 400. Sau 30 giây có 12.000 request chờ, phần lớn đã quá deadline. Worker xử lý chúng vẫn gọi DB/downstream, nên tải vô ích lan tiếp.

Chuỗi thường diễn ra như sau:
Chuỗi thường là DB chậm, pool connection cạn, request chờ, thread web bị giữ, latency tăng, client retry, request tăng thêm rồi nhiều service cùng cạn tài nguyên.
Tăng thread hoặc queue vô hạn có thể dời điểm sập và làm recovery khó hơn. Trước khi chọn biện pháp, xác định bottleneck bằng queue depth/age, active thread, connection pool, CPU, latency và tỷ lệ lỗi; nhìn theo trace để biết hop nào chậm đầu tiên.

### Load shedding từng bước
1. Đặt giới hạn hữu hạn cho mọi hàng đợi và concurrency; một bounded queue có thể từ chối thay vì tăng vô tận. Giới hạn phải được suy ra từ memory, latency budget và tốc độ xử lý.
2. Khi tải tiến sát năng lực, từ chối sớm ở edge bằng 429 cho quota client hoặc 503 cho quá tải tạm thời; có thể gửi Retry-After phù hợp. Không để request chờ lâu hơn deadline.
3. Ưu tiên luồng theo giá trị nghiệp vụ: giữ thao tác xác nhận đơn đã bắt đầu; trì hoãn báo cáo, gợi ý và batch. Ưu tiên phải đi xuyên các downstream, không chỉ một queue ở gateway.
4. Giảm tải sinh thêm: tắt tính năng tùy chọn bằng feature flag, giới hạn fan-out, dừng retry không cần thiết, và áp concurrency limit theo dependency.
5. Khôi phục có kiểm soát. Khi tải giảm, mở admission dần; theo dõi queue age chứ không chỉ số lượng request thành công.

~~~java
if (queue.size() >= MAX_QUEUE) {
  metrics.increment("requests_shed", priority.name());
  throw new ServiceUnavailableException("capacity exhausted");
}
if (priority == Priority.BACKGROUND && remainingBudget() < MIN_USEFUL_TIME) {
  throw new ServiceUnavailableException("insufficient processing budget");
}
return boundedExecutor.submit(() -> process(request));
~~~
Đây là minh họa admission control; đọc queue.size rồi submit không nguyên tử ở production. Dùng executor bounded với rejection policy hoặc semaphore/limiter đúng thư viện để tránh race và giữ giới hạn thực.

### Trade-off
| Cách | Khi có ích | Rủi ro |
|---|---|---|
| Queue lớn | Hấp thụ burst ngắn | Latency cao, memory lớn, xử lý request hết hạn |
| Queue nhỏ + reject sớm | Giữ latency và bảo vệ dependency | Client thấy lỗi sớm, cần retry policy có kiểm soát |
| Ưu tiên nghiệp vụ | Bảo vệ giao dịch quan trọng | Starvation nếu không có quota công bằng |
| Autoscaling | Bổ sung năng lực khi tải kéo dài | Không giúp nếu bottleneck là DB hoặc thời gian khởi động dài |

Load shedding phù hợp hệ thống có tải lớn hơn công suất trong một khoảng thời gian. Nếu mọi request bắt buộc xử lý cuối cùng, ghi nhận vào durable queue phù hợp; không tùy tiện bỏ job đã được chấp nhận.

### Pitfall production
- Shed ở application sau khi đã chiếm thread/connection; điểm từ chối nên càng gần đầu vào càng tốt.
- Chỉ nhìn CPU; DB pool cạn có thể làm CPU thấp nhưng hệ thống vẫn treo.
- Dùng 429/503 nhưng client retry ngay, tạo một vòng quá tải mới.
- Ưu tiên request quan trọng nhưng để chúng dùng chung pool đã bị background job chiếm.
- Autoscale cùng lúc nhiều pod, gây connection storm vào database.

### Ví dụ đời thực
Chiến dịch tăng traffic từ 2.000 lên 8.000 request/giây; inventory DB chỉ xử lý ổn định 3.000. Queue HTTP tăng lên 24.000, p99 từ 300 ms lên 8 giây, rồi order và catalog cùng timeout. Nhóm đặt admission tối đa theo năng lực đo được, queue ngắn tối đa 200 ms, giảm ưu tiên báo cáo và recommendation, giới hạn concurrency inventory, trả 503 có Retry-After cho phần vượt ngưỡng. Luồng checkout giữ p99 dưới 900 ms; 31% request không thiết yếu bị từ chối sớm, DB ổn định và backlog không kéo dài sau chiến dịch.

### Trả lời mẫu khi phỏng vấn
“Em tìm service chậm đầu tiên trong trace và đối chiếu queue age, active threads, connection pool, throughput và retry. Cascading failure thường không bắt đầu ở tất cả các service cùng lúc; queue tăng ở bottleneck rồi giữ tài nguyên ở upstream. Em giới hạn concurrency và queue hữu hạn, từ chối sớm trước khi request hết deadline, đồng thời tắt hoặc giảm tính năng không thiết yếu. Với overload, 503 hoặc 429 cần Retry-After hợp lý, vì retry ngay chỉ khuếch đại sự cố. Em cũng tách pool hoặc quota theo ưu tiên nghiệp vụ để batch không chiếm tài nguyên checkout. Autoscaling chỉ có ích nếu dependency dưới còn năng lực. Sau sự cố, em xem queue age, shed rate và thời gian hồi phục để xác nhận hệ thống không chỉ trả lỗi nhanh mà thật sự phục hồi.”

> Senior tip: Đo “oldest queue age” cùng queue depth; một queue nhỏ nhưng chứa request quá hạn vẫn là dấu hiệu capacity policy sai.`,
  follow: [
    'Làm sao bạn chọn queue capacity nếu latency budget còn 200 ms nhưng tốc độ xử lý biến động?',
    'Ưu tiên checkout hơn báo cáo có thể gây starvation; bạn đặt quota công bằng thế nào?',
    'Bạn phân biệt lúc nên autoscale với lúc phải shed load hoặc giảm tính năng ra sao?'
  ],
  tags: ['load-shedding', 'overload', 'queue', 'cascading-failure']
},
{
  id: 'microservices-062',
  topic: 'microservices',
  level: 'senior',
  q: 'Sau một lần DB chậm, Kubernetes đánh liveness của nhiều pod là fail và restart đồng loạt; pod mới lại chưa warm-up nhưng nhận tải ngay. Bạn phân biệt readiness, liveness và startup check, rồi thiết kế probe để tránh health check tự tạo thành sự cố dây chuyền thế nào?',
  a: `**Tóm tắt:** Readiness trả lời “pod này có nên nhận request mới không?”, liveness trả lời “process có mắc kẹt đến mức cần restart không?”, còn startup probe cho ứng dụng đủ thời gian khởi động. DB chậm thường nên làm pod mất readiness nếu nó không thể phục vụ, không nên tự động làm liveness fail rồi restart mọi pod và tạo thêm tải lên DB.

### Kubernetes dùng kết quả probe ra sao?
**Probe** là lần kiểm tra định kỳ do kubelet (agent trên mỗi node) gọi vào container. Nếu readiness thất bại, Kubernetes ngừng đưa pod đó vào Service endpoint; container vẫn chạy để có thể hồi phục. Nếu liveness thất bại liên tiếp quá ngưỡng, kubelet restart container. Startup probe trì hoãn việc đánh giá liveness/readiness ban đầu cho đến khi ứng dụng khởi động xong.

Hãy hình dung process là nhân viên trực quầy. Readiness hỏi quầy có thể nhận khách mới không; liveness hỏi nhân viên còn phản hồi không; startup cho nhân viên thời gian mở quầy. Nếu hệ thống gọi DB chậm, nhân viên có thể vẫn hoạt động nhưng tạm không sẵn sàng cho giao dịch phụ thuộc DB. Restart nhân viên không làm DB khỏe hơn, lại khiến nhiều pod đồng thời reconnect và chạy migration/cache warm-up.

### Thiết kế probe an toàn
1. Dùng health group tách biệt trong Spring Boot Actuator, ví dụ {{/actuator/health/liveness}} và {{/actuator/health/readiness}}. Đây là endpoint; cách đưa indicator vào group phải được cấu hình rõ.
2. Liveness kiểm tra trạng thái nội bộ có ý nghĩa như process event loop/dispatcher còn trả lời. Tránh gắn mọi dependency từ xa vào liveness.
3. Readiness kiểm tra điều kiện thực sự cần để nhận loại traffic đó. Nếu DB là bắt buộc cho mọi endpoint, DB không sẵn sàng có thể làm pod unready; nếu một dependency tùy chọn hỏng, không nhất thiết rút toàn bộ pod.
4. Dùng startup probe cho ứng dụng khởi động chậm; chỉnh period, timeout, failure threshold dựa trên thời gian khởi động quan sát được. Tránh probe quá ngắn hoặc quá dày tạo tải.
5. Khi shutdown, ngừng readiness trước khi drain request, xử lý SIGTERM và đặt grace period đủ dài. Khi rollout, giới hạn số pod unavailable và tốc độ tạo pod để tránh reconnect storm.

~~~yaml
startupProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  periodSeconds: 5
  failureThreshold: 24
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 10
  failureThreshold: 3
~~~
Ví dụ này cho tối đa khoảng 120 giây startup (24 × 5 giây), không phải giá trị áp dụng cho mọi ứng dụng. Có thể dùng endpoint startup riêng; đảm bảo health check không chờ một thread pool đang cạn.

### Trade-off / pitfall
| Thiết lập | Được gì | Có thể sai ở đâu |
|---|---|---|
| Dependency trong readiness | Ngừng gửi traffic tới pod không phục vụ được | Nếu mọi pod cùng phụ thuộc DB chậm, toàn bộ endpoint bị rút |
| Dependency trong liveness | Tự restart pod khi dependency fail | Restart storm, reconnect storm, sự cố lan rộng |
| Startup probe | Bảo vệ app khởi động chậm | Threshold quá dài che lỗi startup thật |
| Probe interval ngắn | Phát hiện nhanh | Tạo tải và dao động trạng thái đồng loạt |

Liveness không phải bài kiểm tra “toàn hệ thống khỏe”. Nếu probe chỉ kiểm tra HTTP endpoint nhưng request thread pool đã treo, cần probe nội bộ đủ nhẹ để phát hiện deadlock; ngược lại không để probe phụ thuộc vào cùng queue đang quá tải. Theo dõi số lần restart và readiness transition.

### Ví dụ đời thực
Một cụm có 20 pod, mỗi pod liveness gọi DB và timeout sau 1 giây. DB tăng latency lên 1,5 giây trong 30 giây; 15 pod bị restart, mỗi pod mở 40 connection lúc lên lại, tạo thêm 600 kết nối cùng lúc. Nhóm bỏ DB khỏi liveness, giữ DB indicator ở readiness cho endpoint cần DB, thêm startup probe 2 phút và rollout tối đa 2 pod một lượt. Trong lần DB chậm kế tiếp, pod không restart hàng loạt; số connection mới giảm còn dưới 80/phút và traffic chỉ chuyển sang pod còn sẵn sàng.

### Trả lời mẫu khi phỏng vấn
“Em phân biệt ba câu hỏi: startup có đủ thời gian lên chưa, readiness có nên nhận request mới không, và liveness có cần restart process không. Kubernetes rút endpoint khi readiness fail nhưng restart container khi liveness fail, nên gắn DB vào liveness rất nguy hiểm: DB chậm có thể làm mọi pod restart và reconnect cùng lúc. Em dùng startup probe cho thời gian warm-up, liveness nhẹ và nội bộ, readiness chỉ gồm dependency thật sự bắt buộc cho traffic. Em cũng kiểm tra probe không dùng thread pool đang cạn, cấu hình ngưỡng từ dữ liệu startup, và drain request khi SIGTERM. Khi rollout, em giới hạn pod unavailable để không tạo thêm tải lên DB. Em theo dõi restart count, readiness transition và connection rate để biết probe có làm tình hình tệ hơn không.”

> Senior tip: Thử nghiệm probe khi DB bị chậm có kiểm soát ở staging; chỉ đọc YAML thường không phát hiện được việc health endpoint dùng chung pool với request.`,
  follow: [
    'Nếu DB là bắt buộc cho checkout nhưng không cần cho health/read endpoint, readiness nên được cấu hình theo service hay theo từng route?',
    'Làm sao để probe vẫn phản ánh thread deadlock nhưng không bị ảnh hưởng bởi thread pool request đã cạn?',
    'Khi shutdown pod, thứ tự readiness, connection draining và SIGTERM nên phối hợp thế nào?'
  ],
  tags: ['kubernetes', 'readiness', 'liveness', 'startup-probe']
},
{
  id: 'microservices-063',
  topic: 'microservices',
  level: 'lead',
  q: 'Một phiên bản mới thay đổi cache và thuật toán định giá; nhóm muốn tự động tăng canary rồi rollback nếu chất lượng giảm. Bạn chọn SLI/SLO, cửa sổ đánh giá, nhóm đối chứng và guardrail thế nào để không rollback vì nhiễu nhưng cũng không bỏ lỡ sự cố?',
  a: `**Tóm tắt:** Canary đưa một tỷ lệ nhỏ traffic thật vào phiên bản mới để so sánh rủi ro trước khi rollout rộng. Tự động rollback chỉ đáng tin khi đo SLI gắn với trải nghiệm người dùng, so sánh canary với baseline trong cửa sổ đủ dữ liệu, đặt guardrail và ngưỡng rõ ràng, đồng thời giữ đường rollback tương thích với dữ liệu đã ghi.

### Thuật ngữ và tín hiệu cần chọn
**SLI** (Service Level Indicator) là chỉ số đo, như tỷ lệ checkout thành công hoặc p99 latency. **SLO** (Service Level Objective) là mục tiêu cho SLI trong một khoảng thời gian, ví dụ 99,9% checkout thành công trong 30 ngày. **Error budget** là phần lỗi cho phép trước khi vi phạm SLO; với 99,9% thì ngân sách lỗi là 0,1%.

Không dùng một metric đơn lẻ:
- **Chỉ số chính:** tỷ lệ request thành công, p95/p99 latency, tỷ lệ giao dịch hoàn tất.
- **Guardrail nghiệp vụ:** sai lệch giá, cache miss, duplicate order, refund, complaint.
- **Guardrail hạ tầng:** CPU, memory, saturation, downstream error rate.
- **Canary health:** so sánh cùng loại traffic/country/device giữa bản mới và baseline, tránh nhầm khác biệt cohort với lỗi version.

### Quy trình rollout và rollback
1. Trước rollout, kiểm tra telemetry có nhãn version, endpoint và cohort; giới hạn cardinality để metric không phình theo userId/orderId.
2. Bắt đầu tỷ lệ nhỏ, ví dụ 1%, rồi tăng 5%, 25%, 50%, 100% khi đạt điều kiện. Mỗi bước cần đủ request và thời gian để phát hiện cả latency lẫn lỗi hiếm.
3. Dùng cửa sổ ngắn để bắt sự cố cấp tính và cửa sổ dài hơn để xác nhận xu hướng. Một lỗi nghiêm trọng như sai giá hoặc mất dữ liệu có thể rollback ngay; latency tăng nhẹ chỉ kích hoạt khi vượt ngưỡng đủ lâu và có mẫu đủ lớn.
4. So sánh chênh lệch với baseline, không chỉ ngưỡng tuyệt đối. Ví dụ rollback nếu error rate canary cao hơn baseline 0,5 điểm phần trăm và vượt 1% trong 5 phút, sau ít nhất 1.000 request; các con số là ví dụ, phải hiệu chỉnh theo lưu lượng và SLO.
5. Nếu guardrail vi phạm, dừng tăng traffic, chuyển traffic về version cũ, giữ log/metric để điều tra. Ghi rõ ai được phép override và audit lý do.
6. Đảm bảo database/schema và event vẫn tương thích ngược; rollback binary không thể undo dữ liệu đã ghi sai. Dùng expand-contract, feature flag hoặc versioned data migration khi cần.

### Bảng trade-off
| Quyết định | Quá nhạy | Quá lỏng |
|---|---|---|
| Cửa sổ ngắn | Rollback do nhiễu/traffic burst | — |
| Cửa sổ dài | — | Khách hàng chịu lỗi lâu |
| Ngưỡng tuyệt đối | So sánh sai khi tải khác mùa | Không thấy regression so với baseline |
| So sánh cohort | Cần telemetry và mẫu tốt | Cohort lệch làm kết luận sai |

Rollback tự động tốt cho tín hiệu có thể đo chắc. Thay đổi ảnh hưởng doanh thu, dữ liệu hoặc an toàn cần guardrail cứng và khả năng dừng khẩn cấp. Canary không thay thế integration test, load test hay kiểm tra tương thích schema.

### Pitfall production
- Canary chỉ nhận traffic nội bộ không đại diện cho khách hàng thật hoặc phân bố tenant.
- Tỷ lệ traffic nhỏ nhưng có ít request; không đủ bằng chứng để quyết định.
- p99 nhảy vì một request trong mẫu nhỏ; cần minimum sample và so sánh nhiều cửa sổ.
- Chỉ theo dõi CPU/HTTP 5xx nên bỏ lỡ giá tính sai hoặc kết quả nghiệp vụ kém.
- Alert metric có delay; rollout tăng nhanh hơn thời gian phát hiện.
- Auto rollback binary nhưng schema đã bị phá tương thích, khiến bản cũ không chạy được.

### Ví dụ đời thực
Một nền tảng bán vé có SLO 99,95% checkout thành công, p99 dưới 800 ms. Bản mới cache giá làm p99 giảm 12% nhưng ở một tenant, giá khuyến mãi bị làm tròn sai. Nếu chỉ nhìn latency/5xx, canary sẽ được tăng traffic. Nhóm thêm guardrail chênh lệch giá và refund theo version, rollout 1% trong ít nhất 10 phút và 2.000 checkout, sau đó tăng dần. Khi sai lệch vượt 0,1% giao dịch, hệ thống dừng rollout và quay lại bản cũ trong 3 phút; dữ liệu cache được version hóa để bản cũ đọc được. Không có đơn giá sai nào được xác nhận sau khi guardrail kích hoạt.

### Trả lời mẫu khi phỏng vấn
“Em định nghĩa trước SLI theo hành vi quan trọng với người dùng, không chỉ CPU hay 5xx. Ví dụ checkout success, p99 và guardrail về giá hoặc giao dịch trùng. Canary so sánh version mới với baseline trên traffic tương đương; em đặt minimum sample, cửa sổ ngắn để phát hiện sự cố nghiêm trọng và cửa sổ dài hơn để tránh nhiễu. Các ngưỡng phải dựa trên SLO và mức rủi ro nghiệp vụ. Nếu vượt guardrail, dừng tăng tỷ lệ và tự động route về bản cũ; thay đổi dữ liệu cần tương thích để rollback thực sự khả thi. Em cũng đảm bảo metric có version label nhưng không gắn user ID gây cardinality cao, và độ trễ telemetry ngắn hơn tốc độ rollout. Auto rollback là cơ chế bảo vệ, không thay thế kiểm thử hay quyền dừng khẩn cấp.”

> Senior tip: Đặt tốc độ rollout chậm hơn tổng thời gian thu thập mẫu + trễ telemetry + thời gian phản ứng; nếu không, hệ thống có thể lên 100% trước khi biết canary đã lỗi.`,
  follow: [
    'Với traffic thấp, làm sao đánh giá canary khi chưa đạt minimum sample trong cửa sổ mong muốn?',
    'Bạn thiết kế rollback khi schema đã thêm cột hoặc thay đổi dữ liệu không tương thích thế nào?',
    'Khi SLI kỹ thuật tốt nhưng khiếu nại nghiệp vụ tăng, guardrail và quy trình quyết định nên thay đổi ra sao?'
  ],
  tags: ['canary', 'SLO', 'rollback', 'observability']
},
{
  id: 'microservices-064',
  topic: 'microservices',
  level: 'senior',
  q: 'Bạn phân biệt API Gateway và Service Mesh thế nào? Khi nào chỉ cần Gateway là đủ, khi nào nên đưa Service Mesh vào hệ thống microservices?',
  a: `**Tóm tắt:** **API Gateway** (cổng vào API) là điểm vào ở **ranh giới phía bắc-nam** (north-south: client bên ngoài đi vào hệ thống), lo xác thực, rate limit, routing, chuyển đổi request. **Service Mesh** (lưới dịch vụ) là lớp hạ tầng ở **ranh giới đông-tây** (east-west: các service nội bộ gọi nhau), dùng **sidecar proxy** (proxy chạy cạnh mỗi service, như Envoy) để xử lý mTLS, retry, load balancing, telemetry mà không sửa code ứng dụng. Chỉ thêm mesh khi số service và nhu cầu chính sách nội bộ đủ lớn để bù chi phí vận hành.

### Thuật ngữ (giải thích nhanh)
- **North-south traffic**: lưu lượng từ client bên ngoài (web, mobile, đối tác) đi vào cụm dịch vụ.
- **East-west traffic**: lưu lượng các service trong cụm gọi qua lại nhau.
- **Sidecar proxy**: một tiến trình proxy (ví dụ Envoy) chạy cùng pod/container với service; mọi traffic đi vào/ra service đều đi qua proxy này trước.
- **Control plane** (mặt phẳng điều khiển): thành phần trung tâm (Istio {{istiod}}, Linkerd control plane) phát cấu hình, chứng chỉ, chính sách xuống các proxy.
- **Data plane** (mặt phẳng dữ liệu): tập hợp các sidecar proxy thực sự chuyển tiếp và áp chính sách lên từng request.
- **mTLS** (mutual TLS): hai bên đều xác thực danh tính bằng chứng chỉ khi bắt tay TLS, không chỉ client tin server.

### Cơ chế từng bước và vì sao

~~~seq
title: Gateway ở biên, Mesh ở nội bộ
actors: Client | API Gateway | Sidecar A | Service A | Sidecar B | Service B
Client -> API Gateway: HTTPS + JWT
API Gateway -> API Gateway: auth, rate limit, route
API Gateway -> Sidecar A: request vào cụm
Sidecar A -> Service A: chuyển tiếp local
Service A -> Sidecar A: gọi Service B
Sidecar A -> Sidecar B: mTLS + retry + metrics
Sidecar B -> Service B: chuyển tiếp local
Service B --> Sidecar B: response
Sidecar B --> Sidecar A: response
~~~

1. **API Gateway đứng ở biên**: terminate TLS từ internet, kiểm tra JWT/OAuth2, áp rate limit theo khách hàng, route {{/orders}} tới order-service. Vì sao: chính sách "ai được vào, bao nhiêu request" là mối quan tâm của biên hệ thống, làm một lần tránh mỗi service tự lặp lại.
2. **Service Mesh chèn sidecar vào từng pod**: control plane cấp chứng chỉ và quy tắc; data plane (Envoy) bắt traffic bằng iptables/eBPF, tự mã hóa mTLS giữa A và B, tự retry/timeout/circuit breaking và phát metric trace. Vì sao: chính sách nội bộ nhất quán mà đội ứng dụng không phải nhúng thư viện resilience vào từng service (đặc biệt hữu ích khi nhiều ngôn ngữ).
3. **Gateway không thay Mesh**: gateway không thấy chi tiết từng hop A→B→C bên trong; mesh không thay thế kiểm soát khách hàng bên ngoài (API key, quota theo tenant, chuyển đổi payload cho mobile/web).
4. **Mesh không thay code nghiệp vụ**: mesh xử lý vận chuyển (transport) và an toàn kênh; idempotency, phân quyền nghiệp vụ, validation dữ liệu vẫn là trách nhiệm ứng dụng.

### So sánh và khi nào dùng

| Tiêu chí | API Gateway | Service Mesh |
|---|---|---|
| Vị trí | Biên cụm (north-south) | Giữa các service (east-west) |
| Vấn đề chính | Authn khách, rate limit, routing, BFF | mTLS nội bộ, retry/timeout đồng nhất, telemetry L7, traffic shifting |
| Cách gắn | Một (vài) thành phần tập trung | Sidecar mỗi workload + control plane |
| Chi phí vận hành | Thấp-vừa | Cao (thêm hop, RAM/CPU sidecar, debug phức tạp) |
| Khi đủ dùng | < ~10 service, một ngôn ngữ, chính sách đơn giản | Nhiều service/team/ngôn ngữ, cần zero-trust nội bộ, canary theo traffic |

- **Chỉ Gateway**: hệ thống nhỏ, team nhỏ, đã dùng thư viện (Resilience4j) ổn định, chưa có yêu cầu mTLS nội bộ hay chính sách L7 phức tạp.
- **Thêm Mesh**: cần mTLS mọi nơi mà không sửa code, cần traffic shifting/canary theo header, cần telemetry đồng nhất cho đa ngôn ngữ, hoặc tuân thủ yêu cầu zero-trust.

### Pitfall thực tế trên production
- **Thêm mesh khi chưa cần**: mỗi request đi thêm 2 proxy hop, tăng p99 latency 2–5 ms/hop và tốn vài trăm MB RAM mỗi node; đội ops phải học vận hành control plane, debug lỗi "proxy từ chối" rất khác lỗi ứng dụng.
- **Cấu hình retry chồng chéo**: gateway retry 3 lần, sidecar retry 3 lần, client retry 3 lần → một lỗi thành 27 lần gọi, khuếch đại sự cố (retry storm).
- **mTLS làm hỏng job/cron cũ**: workload không có sidecar hoặc chứng chỉ hết hạn bị từ chối kết nối nội bộ sau khi bật strict mTLS.
- **Nhầm vai trò**: nhét logic nghiệp vụ vào gateway filter hoặc mesh policy khiến deploy rủi ro, khó test.

### Ví dụ đời thực
Một nền tảng thương mại điện tử có 18 service Java trên Kubernetes, lưu lượng 4.000 req/s giờ cao điểm. Ban đầu chỉ dùng NGINX Ingress (gateway) và Resilience4j trong code. Sau audit bảo mật, yêu cầu mọi kết nối nội bộ phải mã hóa và có danh tính; ngoài ra team Go và Node bắt đầu viết service mới, không dùng Resilience4j được. Nhóm thí điểm Istio trên namespace checkout (5 service): bật mTLS PERMISSIVE 1 tuần rồi STRICT, cấu hình timeout 800 ms và retry 1 lần chỉ cho lỗi kết nối. Kết quả: 100% traffic nội bộ namespace được mTLS, p99 checkout tăng từ 420 ms lên 438 ms (+18 ms, ~4%), phát hiện 2 call không có timeout nhờ metric sidecar. Nhóm không bật mesh cho toàn cụm ngay mà mở rộng dần 3 namespace/tháng và chuẩn hóa "retry chỉ ở một tầng" để tránh nhân bội.

### Trả lời mẫu khi phỏng vấn
"Em phân biệt Gateway và Service Mesh theo ranh giới lưu lượng. Gateway nằm ở biên north-south, xử lý việc của client bên ngoài như xác thực JWT, rate limit theo tenant, routing và đôi khi BFF. Service Mesh nằm ở east-west, dùng sidecar như Envoy và control plane để áp mTLS, retry, timeout, load balancing và telemetry nhất quán cho traffic giữa các service mà không phải sửa code. Với hệ thống nhỏ, em chỉ dùng gateway và thư viện resilience trong app vì mesh thêm độ trễ và chi phí vận hành. Em đưa mesh vào khi có nhiều service hoặc đa ngôn ngữ, cần zero-trust nội bộ, hoặc cần canary/traffic shifting chính xác. Dù dùng gì, em vẫn tránh retry chồng nhiều tầng và nhớ mesh không thay thế logic nghiệp vụ hay phân quyền trong ứng dụng."

> Senior tip: Áp dụng mesh theo lộ trình: bật mTLS chế độ PERMISSIVE trước để quan sát, chuẩn hóa "chỉ retry ở một tầng", rồi mới chuyển STRICT; đo p99 và tài nguyên sidecar trên một namespace thí điểm trước khi mở rộng toàn cụm.`,
  follow: [
    'Sidecar proxy thêm độ trễ và tài nguyên thế nào, và sidecar-less mesh (như eBPF) giải quyết điểm gì?',
    'Khi gateway, mesh và thư viện ứng dụng đều cấu hình retry/timeout, bạn thiết lập "retry budget" ra sao để tránh retry storm?',
    'Trong mô hình zero-trust, mTLS của mesh giải quyết định danh workload thế nào và còn thiếu gì so với phân quyền nghiệp vụ?'
  ],
  tags: ['api gateway', 'service mesh', 'istio', 'envoy', 'mtls']
}
,
{
  id: 'microservices-065',
  topic: 'microservices',
  level: 'senior',
  q: 'Distributed tracing hoạt động thế nào trong hệ thống microservices? Bạn giải thích trace context, cách truyền trace qua HTTP/Kafka, sampling và cách dùng trace để tìm nguyên nhân khi một request chậm.',
  a: `**Tóm tắt:** **Distributed tracing** (truy vết phân tán) gắn một mã định danh xuyên suốt cho một request đi qua nhiều service để tái dựng toàn bộ đường đi và thời gian từng bước. Mỗi bước là một **span** (đoạn công việc), các span cùng một **trace** (chuỗi truy vết) được liên kết bằng **trace context** (ngữ cảnh trace: {{traceId}}, {{spanId}}, {{parentSpanId}}) truyền qua header HTTP hoặc metadata message. Nhờ đó khi p99 tăng, ta biết chính xác hop nào chậm thay vì đoán.

### Thuật ngữ (giải thích nhanh)
- **Trace**: toàn bộ hành trình của một request, gồm nhiều span.
- **Span**: một đơn vị công việc có tên, thời điểm bắt đầu/kết thúc, thuộc tính (db.statement, http.status) và quan hệ cha-con.
- **Trace context**: bộ mã định danh (traceId, spanId, cờ sampled) đi kèm request để nối các span rời rạc thành một trace.
- **Propagation** (lan truyền): hành động chèn/đọc trace context khi gọi qua mạng hoặc hàng đợi.
- **W3C Trace Context**: chuẩn header {{traceparent}} (ví dụ {{00-traceid-spanid-01}}) và {{tracestate}} để các hệ thống khác nhau hiểu nhau.
- **Sampling** (lấy mẫu): chỉ giữ lại một phần trace để giảm chi phí lưu trữ/xử lý.
- **OpenTelemetry (OTel)**: bộ chuẩn và thư viện thu thập trace/metric/log; dữ liệu gửi về backend như Jaeger, Tempo, Zipkin, X-Ray.

### Cơ chế từng bước và vì sao

~~~seq
title: Trace context đi qua HTTP và Kafka
actors: Client | Order API | DB | Kafka | Payment Worker
Client -> Order API: POST /orders (traceparent)
Order API -> Order API: span root (server)
Order API -> DB: SELECT/INSERT (child span)
DB --> Order API: ok
Order API -> Kafka: publish OrderCreated + trace header
Kafka --> Payment Worker: consume + đọc trace header
Payment Worker -> Payment Worker: child span xử lý
~~~

1. **Tạo trace ở điểm vào**: gateway hoặc service đầu tiên sinh {{traceId}} và span gốc nếu request chưa có {{traceparent}}. Vì sao: mọi hop sau phải gắn vào cùng một "dây" để ghép lại được.
2. **Lan truyền qua HTTP**: client HTTP (RestTemplate/WebClient với OTel instrumentation) tự chèn {{traceparent}} vào header; service nhận đọc header và tạo child span với {{parentSpanId}} tương ứng.
3. **Lan truyền qua Kafka (bất đồng bộ)**: producer ghi trace context vào **record header** khi publish; consumer đọc header và tạo span tiếp tục (thường là link/child tùy quan hệ) thay vì tạo trace mới. Vì sao: nếu không truyền, luồng async bị đứt thành các trace rời, không tìm được nguyên nhân end-to-end.
4. **Thu thập và hiển thị**: OTel SDK xuất span (OTLP) về collector rồi lưu ở backend; người vận hành tìm theo {{traceId}} hoặc truy vấn "trace có span payment > 500 ms".
5. **Sampling để kiểm soát chi phí**: lưu 100% trace ở hệ thống lớn rất tốn. Chiến lược phổ biến: head-based (quyết định ngay ở đầu, ví dụ 5%), tail-based (quyết định sau khi biết trace có lỗi/chậm thì giữ lại). Vì sao: tail-based giữ được trace "đáng tiền" (lỗi, chậm) nhưng cần bộ đệm và phức tạp hơn.

~~~java
// Spring Boot 3: thêm micrometer-tracing-bridge-otel + otel exporter.
// Instrumentation tự tạo span; cần truyền context khi dùng thread/Kafka thủ công.
@RestController
class OrderController {
  private final KafkaTemplate<String, OrderCreated> kafka;
  private final ObservationRegistry registry;

  OrderController(KafkaTemplate<String, OrderCreated> kafka, ObservationRegistry registry) {
    this.kafka = kafka;
    this.registry = registry;
  }

  @PostMapping("/orders")
  public ResponseEntity<Void> create(@RequestBody OrderReq req) {
    // WebMVC + KafkaTemplate được instrument: traceparent tự gắn vào record header
    kafka.send("order.created", req.orderId(), new OrderCreated(req.orderId()));
    return ResponseEntity.accepted().build();
  }
}
~~~

### Pitfall thực tế trên production
- **Mất context khi bất đồng bộ**: {{@Async}}, thread pool tự tạo, hoặc gửi Kafka bằng client không instrument làm span mới không có cha, trace bị đứt. Phải dùng cơ chế propagate context (wrap executor, bật observation trên template).
- **Cardinality cao trong thuộc tính span**: gắn {{userId}}, {{orderId}} đầy đủ vào tag/attribute chỉ số hoặc index không kiểm soát làm backend phình; lưu id ở attribute trace (có kiểm soát) thay vì metric label.
- **Sampling quá thấp**: giữ 1% nhưng sự cố hiếm không nằm trong mẫu, không có trace để điều tra. Kết hợp luôn-giữ lỗi/latency cao (tail-based hoặc rule).
- **Log/metric/trace không nối được**: log không in {{traceId}} nên không nhảy từ dashboard metric sang trace/log; cần MDC (Mapped Diagnostic Context) chứa traceId, spanId.

### Ví dụ đời thực
Hệ thống đặt vé có 6 hop (gateway → order → inventory → payment → notification → DB/Kafka), lưu lượng 2.500 req/s. Trước đây chỉ có log rời: khi khách báo "đặt vé mất 8 giây", đội mất ~40 phút grep log từng service. Sau khi bật OpenTelemetry, truyền {{traceparent}} qua HTTP và Kafka header, sampling 10% head-based + giữ 100% request lỗi hoặc > 2 giây (tail), và in traceId vào MDC log. Một tối p99 tăng lên 3,2 giây: truy vấn trace chậm cho thấy span {{payment.authorize}} chiếm 2,7 giây do pool kết nối tới cổng thanh toán cạn (chờ acquire 2,5 giây). Nhóm tăng pool từ 10 lên 30 và đặt timeout acquire 200 ms; p99 giảm còn 620 ms. Thời gian tìm nguyên nhân giảm từ 40 phút xuống dưới 5 phút vì trace chỉ thẳng vào hop nghẽn.

### Trả lời mẫu khi phỏng vấn
"Distributed tracing cho em cái nhìn end-to-end của một request đi qua nhiều service. Mỗi request mang một traceId và trace context theo chuẩn W3C traceparent; mỗi bước tạo một span có parentSpanId nên backend ghép thành cây thời gian. Em truyền context qua HTTP header và cả Kafka record header, vì luồng async nếu không truyền sẽ đứt trace. Trong Spring Boot 3 em dùng Micrometer Tracing với OpenTelemetry để instrument tự động WebMVC, WebClient, Kafka. Về sampling, em không giữ 100% ở lưu lượng lớn mà dùng head-based kết hợp rule luôn giữ lỗi và request chậm, để vừa tiết kiệm chi phí vừa không mất trace quan trọng. Khi điều tra, em lọc trace chậm, nhìn span nào chiếm thời gian rồi khoan xuống DB hay downstream. Em cũng gắn traceId vào log MDC để nối metric, log và trace với nhau."

> Senior tip: Truyền trace context qua **mọi** biên bất đồng bộ (Kafka header, job queue, thread pool) và in {{traceId}} vào log; thiếu một mắt xích là trace bị "gãy" đúng lúc cần điều tra nhất. Đo chi phí sampling bằng dữ liệu thật trước khi hạ tỷ lệ.`,
  follow: [
    'Head-based và tail-based sampling khác nhau thế nào, và tail-based cần thành phần nào trong pipeline thu thập?',
    'Làm sao để trace không bị đứt khi xử lý bất đồng bộ với @Async, thread pool riêng hoặc message consumer?',
    'Bạn liên kết trace với log và metric (three pillars) như thế nào để khoan từ alert xuống nguyên nhân gốc?'
  ],
  tags: ['distributed tracing', 'opentelemetry', 'trace context', 'sampling', 'observability']
}
,
{
  id: 'microservices-066',
  topic: 'microservices',
  level: 'mid',
  q: 'Quản lý cấu hình tập trung trong microservices như thế nào? So sánh Spring Cloud Config, Kubernetes ConfigMap/Secret và lưu cấu hình trong environment variable; làm sao xử lý thay đổi cấu hình và bảo vệ secret?',
  a: `**Tóm tắt:** Cấu hình (URL DB, timeout, feature flag) nên **tách khỏi code và image** để cùng một bản build chạy được ở nhiều môi trường. Quản lý tập trung giúp hàng chục service đổi cấu hình nhất quán, có lịch sử và kiểm soát truy cập. Ba cách phổ biến: **environment variable** (đơn giản, 12-factor), **ConfigMap/Secret** (native Kubernetes), **Spring Cloud Config** (server đọc git, phân phối qua HTTP). Secret (mật khẩu, token) phải mã hóa, giới hạn quyền đọc, và ưu tiên dùng secret manager/External Secrets thay vì để lộ trong git.

### Thuật ngữ (giải thích nhanh)
- **Configuration** (cấu hình): tham số thay đổi theo môi trường (endpoint, cờ bật/tắt) nhưng không phải logic nghiệp vụ.
- **Secret** (bí mật): thông tin nhạy cảm như mật khẩu DB, API key; lộ ra gây sự cố bảo mật.
- **Config Server**: dịch vụ trung tâm lưu và phát cấu hình; Spring Cloud Config Server thường đọc từ git repo.
- **ConfigMap / Secret (Kubernetes)**: đối tượng K8s gắn cấu hình vào pod dưới dạng biến môi trường hoặc file mount. K8s Secret chỉ mã hóa base64 trong etcd nếu không bật encryption at rest, nên cần bổ sung.
- **External Secrets / Vault**: đồng bộ secret từ kho chuyên dụng (AWS Secrets Manager, HashiCorp Vault) vào runtime, có audit và rotation.
- **Dynamic refresh** (làm mới động): cập nhật cấu hình khi ứng dụng đang chạy mà không deploy lại (Spring {{@RefreshScope}} + actuator refresh hoặc cơ chế watch).

### Cơ chế từng bước và vì sao

1. **Tách cấu hình khỏi artifact**: build một image JAR/container duy nhất, tiêm giá trị theo môi trường lúc chạy. Vì sao: "build once, run anywhere" tránh lỗi "bản chạy prod khác bản đã test".
2. **Phân loại**: cấu hình thường (không nhạy cảm) có thể ở ConfigMap/git; secret đi qua kênh bảo mật (K8s Secret có mã hóa, hoặc secret manager). Vì sao: giảm bán kính rò rỉ.
3. **Phân phối**:
   - **Env var**: orchestrator tiêm {{DB_URL}}, {{TIMEOUT_MS}}. Đơn giản, nhưng đổi giá trị thường cần restart/redeploy pod.
   - **K8s ConfigMap/Secret**: mount file hoặc env; file mount có thể cập nhật theo chu kỳ kubelet nhưng ứng dụng phải tự đọc lại.
   - **Spring Cloud Config**: app gọi Config Server lúc khởi động ({{spring.config.import}}) lấy {{application.yml}} theo profile/label; có thể refresh từng service.
4. **Quy trình thay đổi an toàn**: thay đổi qua pull request (gitOps), review, áp dụng dần (dev → staging → prod), có rollback bằng cách revert commit. Vì sao: cấu hình sai (timeout = 0, sai URL) cũng gây outage như code sai.
5. **Refresh động khi cần**: với giá trị thay đổi thường xuyên (feature flag, giới hạn), dùng {{@RefreshScope}} hoặc cơ chế watch; với secret/connection quan trọng, nhiều đội chọn rolling restart để đảm bảo trạng thái sạch.

~~~yaml
# ConfigMap (cấu hình thường) và tham chiếu Secret (không đặt mật khẩu plaintext trong git)
apiVersion: v1
kind: ConfigMap
metadata:
  name: order-config
data:
  PAYMENT_TIMEOUT_MS: "800"
---
# Pod tham chiếu: env từ ConfigMap, secret từ Secret/ExternalSecret
# env:
#   - name: PAYMENT_TIMEOUT_MS
#     valueFrom: { configMapKeyRef: { name: order-config, key: PAYMENT_TIMEOUT_MS } }
#   - name: DB_PASSWORD
#     valueFrom: { secretKeyRef: { name: order-db, key: password } }
~~~

### So sánh lựa chọn

| Cách | Ưu điểm | Nhược điểm | Khi dùng |
|---|---|---|---|
| Env variable | Đơn giản, chuẩn 12-factor, mọi nền tảng hỗ trợ | Đổi thường cần restart; dễ lộ qua dump env/log nếu bất cẩn | Ít tham số, thay đổi hiếm |
| K8s ConfigMap/Secret | Native K8s, gắn theo namespace, GitOps dễ | Secret base64 mặc định; refresh file không tự áp vào bean | Hạ tầng đã trên Kubernetes |
| Spring Cloud Config | Tập trung đa service, version theo git, profile/label | Thêm thành phần phải HA; phụ thuộc Config Server lúc boot | Nhiều Spring service, cần quản trị tập trung |

### Pitfall thực tế trên production
- **Commit secret vào git**: lộ lịch sử vĩnh viễn dù đã xóa file; phải rotate secret ngay, không chỉ xóa commit.
- **Refresh không nhất quán**: đổi cấu hình nhưng một số pod chưa nhận (chưa gọi refresh, cache cũ) gây hành vi khác nhau giữa instance.
- **Log lộ cấu hình nhạy cảm**: in toàn bộ {{Environment}} hoặc datasource URL có mật khẩu khi khởi động.
- **Config Server là điểm nghẽn**: nếu app không cache cấu hình cục bộ và server chết, pod mới không khởi động được (cần cấu hình fail-fast hợp lý và HA).

### Ví dụ đời thực
Một hệ thống có 24 microservice Spring Boot chạy trên Kubernetes. Ban đầu mỗi service giữ {{application-prod.yml}} riêng trong image, nên đổi timeout của payment gateway từ 1.000 ms xuống 500 ms phải rebuild và deploy 24 service, mất gần 2 giờ. Nhóm chuyển cấu hình không nhạy cảm vào ConfigMap quản lý bằng GitOps, secret DB chuyển sang External Secrets đồng bộ từ AWS Secrets Manager (rotation 30 ngày). Khi đối tác payment tăng độ trễ, đội sửa {{PAYMENT_TIMEOUT_MS}} trong git, Argo CD áp ConfigMap và rolling restart 6 pod order trong 4 phút; nhờ có lịch sử git, lần cấu hình sai (đặt 50 ms gây lỗi hàng loạt) được revert trong 3 phút. Sau 1 tháng không còn secret trong repo và thời gian đổi cấu hình giảm từ ~120 phút xuống < 10 phút.

### Trả lời mẫu khi phỏng vấn
"Em tách cấu hình khỏi code theo 12-factor: cùng một image chạy nhiều môi trường nhờ biến tiêm từ ngoài. Với hệ thống nhỏ, biến môi trường là đủ. Trên Kubernetes, em dùng ConfigMap cho giá trị thường và Secret hoặc External Secrets cho mật khẩu, token, có mã hóa và rotation; không bao giờ commit secret vào git. Khi có nhiều Spring service cần quản trị tập trung, Spring Cloud Config đọc cấu hình từ git theo profile giúp có lịch sử và review. Em phân biệt cấu hình có thể refresh động như feature flag với cấu hình nhạy cảm thường áp dụng qua rolling restart để nhất quán. Quy trình thay đổi phải đi qua PR, áp dần từng môi trường và có đường rollback, vì cấu hình sai cũng gây outage. Em cũng tránh log lộ secret và đảm bảo Config Server có HA hoặc cache để không chặn khởi động."

> Senior tip: Coi thay đổi cấu hình như thay đổi code: đưa vào git, review, triển khai dần và đo tác động; với secret hãy ưu tiên secret manager có rotation/audit thay vì "giấu" trong ConfigMap mã hóa base64.`,
  follow: [
    'Khi dùng Spring Cloud Config, bạn đảm bảo service vẫn khởi động được nếu Config Server tạm thời không khả dụng như thế nào?',
    'Làm sao phát hiện và xử lý cấu hình "lệch" giữa các instance sau một lần refresh thất bại một phần?',
    'So sánh lưu secret trong Kubernetes Secret với External Secrets + cloud secret manager về bảo mật và vận hành?'
  ],
  tags: ['configuration', 'spring cloud config', 'configmap', 'secret management']
}
,
{
  id: 'microservices-067',
  topic: 'microservices',
  level: 'senior',
  q: 'Contract testing (ví dụ Pact hoặc Spring Cloud Contract) giải quyết vấn đề gì mà integration test end-to-end không giải quyết được? Bạn thiết kế quy trình contract test giữa consumer và provider như thế nào?',
  a: `**Tóm tắt:** **Contract test** (kiểm thử hợp đồng) kiểm tra rằng **consumer** (bên gọi) và **provider** (bên cung cấp API) thống nhất về hình dạng request/response mà không cần chạy cả hai hệ thống cùng lúc. Nó phát hiện sớm việc "provider đổi field làm consumer gãy" nhanh và ổn định hơn E2E (end-to-end, chạy toàn chuỗi), vì mỗi bên chạy test độc lập dựa trên một **contract** (bản mô tả kỳ vọng) được chia sẻ.

### Thuật ngữ (giải thích nhanh)
- **Consumer**: service/client gọi API của service khác.
- **Provider**: service cung cấp API/endpoint hoặc phát message.
- **Contract**: bản mô tả kỳ vọng về tương tác (HTTP method, path, header, body, status hoặc schema message).
- **Consumer-Driven Contract (CDC)**: consumer định nghĩa nó cần gì; provider phải thỏa mãn các kỳ vọng đó.
- **Pact**: công cụ CDC phổ biến; consumer sinh file pact, provider verify pact.
- **Pact Broker**: nơi lưu version pact và kết quả verify, hỗ trợ kiểm tra "an toàn deploy chưa" (can-i-deploy).
- **Spring Cloud Contract**: định nghĩa contract (Groovy/YAML), sinh test cho provider và stub (giả lập) cho consumer.

### Vì sao cần và cơ chế từng bước

Vấn đề với E2E: cần dựng nhiều service + DB + hạ tầng, chạy chậm (phút), dễ gãy do môi trường, khó biết bên nào phá. Contract test tách đôi: consumer test với **stub** sinh từ contract, provider test xác nhận nó đáp ứng contract thật.

~~~seq
title: Consumer-driven contract (Pact)
actors: Consumer Test | Pact File | Pact Broker | Provider Verify
Consumer Test -> Pact File: chạy test, sinh kỳ vọng
Pact File -> Pact Broker: publish (version consumer)
Pact Broker -> Provider Verify: cung cấp pact mới
Provider Verify -> Provider Verify: replay request, so response
Provider Verify -> Pact Broker: ghi kết quả verify
~~~

1. **Consumer viết test kỳ vọng**: mô tả "khi gọi GET /orders/123 tôi cần status 200 và body có {{id}} (chuỗi), {{total}} (số)". Test chạy với mock provider của Pact và **sinh file pact**. Vì sao: consumer là bên bị gãy khi contract đổi, nên nhu cầu của nó là nguồn sự thật.
2. **Publish contract**: CI của consumer đẩy pact lên Pact Broker gắn với version (git SHA) và nhánh.
3. **Provider verify**: CI của provider tải các pact liên quan, replay từng request lên provider thật (trạng thái test được thiết lập bằng provider state) và so khớp response với contract. Vì sao: chứng minh provider thực sự đáp ứng kỳ vọng, không phải mock tự nói.
4. **Cổng triển khai (can-i-deploy)**: trước khi deploy, hỏi Broker "version consumer X và provider Y đã verify tương thích chưa". Nếu provider đổi bỏ field {{total}}, verify thất bại ngay trên CI provider, chưa kịp lên prod.
5. **Với Spring Cloud Contract**: nhóm provider viết contract, plugin sinh test phía provider và sinh **stub** (WireMock) để consumer dùng trong test của mình; hướng tiếp cận khác (provider-driven) nhưng mục tiêu tương tự: khóa tương tác.

~~~java
// Ví dụ ý tưởng Pact (consumer, JUnit 5): định nghĩa kỳ vọng và sinh pact
@Pact(consumer = "order-web")
V4Pact getOrder(PactDslWithProvider builder) {
  return builder
    .given("order 123 exists")
    .uponReceiving("a request for order 123")
      .path("/orders/123").method("GET")
    .willRespondWith()
      .status(200)
      .body(newJsonBody(o -> {
        o.stringType("id", "123");      // khớp kiểu, không bắt cứng giá trị vô nghĩa
        o.numberType("total", 150000);  // tránh over-specify
      }).build())
    .toPact();
}
~~~

### So sánh với E2E / integration test

| Tiêu chí | Contract test | Integration/E2E |
|---|---|---|
| Phạm vi | Một cặp tương tác consumer-provider | Nhiều service + hạ tầng |
| Tốc độ, độ ổn định | Nhanh, ít flake | Chậm, hay gãy do môi trường |
| Phát hiện | Sai lệch giao diện (schema, field, status) | Lỗi luồng nghiệp vụ xuyên hệ thống |
| Không thay thế | Logic nghiệp vụ, hiệu năng, dữ liệu thật end-to-end | — |

Contract test bổ sung, không thay thế hoàn toàn: vẫn cần một số E2E/smoke cho luồng quan trọng.

### Pitfall thực tế trên production
- **Over-specify contract**: bắt cứng giá trị timestamp, thứ tự mảng hay field thừa khiến test gãy dù thay đổi tương thích; chỉ khớp kiểu/regex/ràng buộc cần thiết.
- **Thiếu provider state**: verify gọi {{/orders/123}} nhưng provider không thiết lập dữ liệu "order 123 exists" nên fail giả.
- **Không có quy trình Broker/can-i-deploy**: pact sinh ra nhưng không ai verify hoặc không chặn deploy, contract trở thành tài liệu chết.
- **Nhầm contract với schema đầy đủ**: contract thường là "ví dụ tối thiểu consumer cần", không bao phủ mọi trường provider trả.

### Ví dụ đời thực
Hệ thống có 12 service; đội order (consumer) và catalog (provider) deploy độc lập mỗi ngày. Trước đây 1–2 lần/tháng catalog đổi tên field {{price}} thành {{unitPrice}} hoặc đổi kiểu khiến checkout lỗi 500 trên prod, phát hiện sau 20–30 phút nhờ alert. Nhóm áp dụng Pact: order-web định nghĩa 7 tương tác (giá, tồn kho, thông tin sản phẩm), CI publish lên Pact Broker. Khi một PR catalog đổi {{price}} thành {{unitPrice}}, bước provider verification fail trong 6 phút trên CI với thông báo thiếu field {{price}}, PR bị chặn trước khi merge. Sau 3 tháng, số sự cố "gãy tích hợp do đổi API" giữa cặp này giảm từ trung bình 1,5 lần/tháng xuống 0; thời gian feedback từ ~30 phút (prod) xuống < 10 phút (CI). Nhóm vẫn giữ 2 smoke E2E cho luồng checkout nhưng bỏ bớt 9 kịch bản E2E chỉ để kiểm tra hình dạng response.

### Trả lời mẫu khi phỏng vấn
"Contract test giải quyết việc hai service hiểu khác nhau về API mà không phải dựng cả hệ thống. Khác với E2E chậm và dễ flake, contract test cho mỗi bên chạy độc lập: consumer mô tả nó cần request/response thế nào và sinh contract, provider verify rằng nó thực sự đáp ứng contract đó. Em dùng Pact theo hướng consumer-driven: consumer test tạo pact, publish lên Broker, CI của provider verify và can-i-deploy chặn deploy nếu chưa tương thích. Điểm quan trọng là contract chỉ khớp những gì consumer thực sự cần, tránh over-specify để không gãy giả, và phải thiết lập provider state cho dữ liệu. Contract test không thay thế E2E hay test nghiệp vụ, nhưng nó chuyển lỗi lệch giao diện từ prod về CI rất sớm. Với Spring thuần nội bộ, Spring Cloud Contract cũng là lựa chọn tốt để sinh stub cho consumer."

> Senior tip: Tích hợp "can-i-deploy" vào pipeline triển khai và giữ contract ở mức tối thiểu consumer cần (type/shape, không khóa giá trị ngẫu nhiên); contract không ai verify tự động thì chỉ là tài liệu lỗi thời.`,
  follow: [
    'Bạn xử lý thay đổi breaking cho contract (đổi tên/xóa field) như thế nào khi nhiều consumer đang phụ thuộc?',
    'Khác biệt giữa consumer-driven contract và provider-driven contract là gì, và khi nào chọn Spring Cloud Contract thay vì Pact?',
    'Contract test áp dụng cho giao tiếp bất đồng bộ (Kafka message schema) ra sao so với REST?'
  ],
  tags: ['contract testing', 'pact', 'spring cloud contract', 'consumer-driven']
}
,
{
  id: 'microservices-068',
  topic: 'microservices',
  level: 'lead',
  q: 'Bạn versioning event schema trong Kafka như thế nào khi hệ thống có nhiều consumer deploy độc lập? Giải thích vai trò Schema Registry, tương thích ngược/tiến và chiến lược tiến hóa schema an toàn.',
  a: `**Tóm tắt:** **Event schema** (lược đồ sự kiện, mô tả cấu trúc field/kiểu của message) là "hợp đồng" giữa producer và các consumer. Khi producer đổi schema, consumer đang chạy có thể gãy nếu không kiểm soát. Dùng **Schema Registry** (kho đăng ký schema có version, ví dụ Confluent Schema Registry cho Avro/Protobuf/JSON Schema) để kiểm tra **compatibility** (tính tương thích) trước khi chấp nhận schema mới, và tuân thủ quy tắc tiến hóa (thêm field có default, không đổi nghĩa/xóa field tùy mode) để nhiều phiên bản producer/consumer cùng tồn tại an toàn.

### Thuật ngữ (giải thích nhanh)
- **Schema Registry**: dịch vụ lưu schema theo subject/version, gắn {{schemaId}} vào mỗi message; serializer/ deserializer tra schema theo id để mã hóa/giải mã.
- **Backward compatible** (tương thích ngược): consumer dùng schema MỚI đọc được dữ liệu ghi bằng schema CŨ. Cho phép: thêm field có giá trị mặc định, xóa field (nếu schema mới không cần). Vì sao hữu ích: triển khai consumer mới trước, vẫn xử lý được message cũ.
- **Forward compatible** (tương thích tiến): consumer dùng schema CŨ đọc được dữ liệu ghi bằng schema MỚI. Cho phép: xóa field có default, thêm field (consumer cũ bỏ qua). Hữu ích khi producer nâng cấp trước.
- **Full compatible**: vừa backward vừa forward; an toàn nhất khi thứ tự deploy không kiểm soát được.
- **Subject**: tên đăng ký schema, thường gắn với topic ({{order.created-value}}).
- **Schema evolution** (tiến hóa schema): thay đổi schema qua thời gian theo quy tắc tương thích.

### Cơ chế từng bước và vì sao

~~~seq
title: Đăng ký và kiểm tra schema khi publish
actors: Producer | Schema Registry | Kafka | Consumer
Producer -> Schema Registry: đăng ký schema v2 (kiểm tra tương thích)
Schema Registry --> Producer: ok + schemaId=42
Producer -> Kafka: message [id=42 + payload]
Kafka --> Consumer: message [id=42 + payload]
Consumer -> Schema Registry: lấy schema id=42 (cache)
Consumer -> Consumer: deserialize theo schema reader/writer
~~~

1. **Đăng ký và kiểm tra**: khi producer khởi động hoặc gửi schema mới, nó đăng ký lên Registry; Registry từ chối nếu vi phạm mode (ví dụ BACKWARD mà xóa field không default). Vì sao: chặn breaking change ngay tại nguồn, trước khi message lỗi lan ra.
2. **Gắn schema id vào message**: payload mang vài byte id thay vì nhúng cả schema, giúp nhỏ gọn và tra cứu chính xác phiên bản.
3. **Consumer giải mã an toàn**: deserializer dùng **writer schema** (id trong message) và **reader schema** (schema consumer biết) để ánh xạ field; field mới có default được điền khi đọc dữ liệu cũ (backward), field thừa bị bỏ qua khi cần.
4. **Triển khai theo mode**: với BACKWARD, deploy/ nâng cấp consumer trước rồi mới producer phát field mới; với FULL, thứ tự lỏng hơn nhưng quy tắc đổi chặt hơn. Vì sao: bảo đảm luôn có ít nhất một phía hiểu được phía kia trong cửa sổ rolling deploy.
5. **Quản lý vòng đời**: đánh dấu deprecate field, theo dõi consumer nào còn dùng schema cũ (qua log/metric Registry), chỉ xóa sau khi không còn reader cũ.

### Quy tắc tiến hóa và bảng tương thích

| Thay đổi | BACKWARD | FORWARD | FULL |
|---|---|---|---|
| Thêm field có default | OK | OK | OK |
| Xóa field có default | OK (reader mới không cần) | OK | OK |
| Thêm field không default | Không | OK | Không |
| Đổi kiểu/đổi nghĩa field | Không | Không | Không |

~~~java
// Avro: thêm field mới phải có default để backward-compatible
// {
//   "type": "record", "name": "OrderCreated", "namespace": "com.shop.event",
//   "fields": [
//     {"name": "orderId", "type": "string"},
//     {"name": "total",   "type": "long"},
//     {"name": "currency","type": "string", "default": "VND"} // thêm mới an toàn (BACKWARD)
//   ]
// }
//
// Quy ước: không tái sử dụng tên field với nghĩa khác; đổi lớn thì tạo event/topic mới
// (ví dụ order.created.v2) thay vì "sửa" nghĩa trường cũ.
~~~

### Pitfall thực tế trên production
- **Đổi nghĩa mà giữ tên/kiểu**: {{amount}} từ VND đổi sang USD nhưng vẫn là long, Registry không bắt được vì kiểu không đổi; consumer tính tiền sai. Phải đổi tên field hoặc phát event mới.
- **Dùng JSON không schema**: producer thêm field lồng nhau hoặc đổi kiểu, consumer {{ObjectMapper}} với cấu hình chặt fail deserialize; "linh hoạt" hóa thành gãy ngầm.
- **Quên default khi thêm field**: mode BACKWARD từ chối đăng ký (tốt) hoặc nếu tắt kiểm tra, consumer mới đọc message cũ bị lỗi thiếu field.
- **Giữ quá nhiều version mãi mãi**: registry phình và khó dọn; cần chính sách deprecate và theo dõi usage.
- **Topic chia sẻ nhiều loại event không rõ ràng**: khó đặt subject/compatibility; nên tách topic theo loại event hoặc dùng chiến lược subject rõ.

### Ví dụ đời thực
Nền tảng giao hàng có 1 topic {{order.events}} với 3 producer team và 9 consumer (billing, tracking, analytics, đối tác), thông lượng 18.000 msg/s. Trước đây dùng JSON tự do: khi team order thêm {{discountCode}} và đổi {{fee}} từ số nguyên sang chuỗi có đơn vị, 4 consumer deserialization lỗi, phải rollback hotfix và họp phối hợp 2 ngày. Nhóm chuyển sang Avro + Schema Registry, đặt compatibility FULL cho subject {{order.events-value}}. Thay đổi "thêm {{discountCode}} kiểu string, default rỗng" được Registry chấp nhận và deploy tự do; thay đổi "đổi {{fee}} sang string" bị Registry từ chối tại CI (lỗi incompatibility) trong 2 phút, buộc team tạo field mới {{feeText}} và giữ {{fee}} cũ thêm 2 chu kỳ release. Sau 4 tháng, 27 lần tiến hóa schema đều qua cổng kiểm tra, không còn sự cố gãy consumer do đổi schema ngoài ý muốn; thời gian phối hợp deploy liên team giảm từ ~1 ngày/lần xuống gần 0 với thay đổi tương thích.

### Trả lời mẫu khi phỏng vấn
"Em coi event schema là contract nên versioning phải có kiểm soát, không để producer tự ý đổi. Em dùng Schema Registry với Avro hoặc Protobuf: mỗi schema có version và id gắn trong message, Registry kiểm tra compatibility trước khi đăng ký. Với nhiều consumer deploy độc lập, em thường chọn BACKWARD hoặc FULL: chỉ thêm field có default, không xóa hay đổi kiểu/đổi nghĩa field. BACKWARD cho phép deploy consumer mới trước vì nó đọc được dữ liệu cũ; FULL an toàn hơn khi không kiểm soát thứ tự. Thay đổi phá vỡ như đổi nghĩa hay cấu trúc lớn thì em tạo event hoặc topic phiên bản mới thay vì sửa chỗ cũ, và có lộ trình deprecate. Điểm Registry không bắt được là đổi ý nghĩa nhưng giữ kiểu, nên em đặt quy ước đặt tên và review. Nhờ vậy producer và consumer tiến hóa độc lập mà không gây outage dây chuyền."

> Senior tip: Bật kiểm tra compatibility trong CI và cấm ghi đè schema; coi "đổi nghĩa field" là breaking change dù kiểu không đổi, và giải quyết bằng field/event mới có lộ trình deprecate rõ ràng.`,
  follow: [
    'Khi buộc phải có breaking change, bạn thiết kế chiến lược phát hành event v2 (topic mới, upcaster, hoặc song song hai schema) và lộ trình bỏ v1 thế nào?',
    'Sự khác nhau khi dùng Avro, Protobuf hay JSON Schema với Schema Registry về tiến hóa schema và hỗ trợ công cụ là gì?',
    'Bạn giám sát và dọn dẹp schema cũ trong Registry ra sao để biết consumer nào còn phụ thuộc phiên bản cũ?'
  ],
  tags: ['schema registry', 'event versioning', 'backward compatibility', 'kafka', 'avro']
}
,
{
  id: 'microservices-069',
  topic: 'microservices',
  level: 'lead',
  q: 'Bạn chia nhỏ một monolith thành microservices như thế nào? Làm sao xác định ranh giới service (bounded context theo DDD), chọn phần tách trước và thực hiện an toàn không gây gián đoạn?',
  a: `**Tóm tắt:** Tách monolith không phải "cắt code theo thư mục" mà là **cắt theo ranh giới nghiệp vụ**. Dùng **DDD (Domain-Driven Design, thiết kế hướng miền)** để tìm **bounded context** (ngữ cảnh giới hạn: nơi một mô hình và ngôn ngữ có nghĩa nhất quán), biến mỗi context thành ứng viên service có dữ liệu và vòng đời riêng. Thực hiện tăng dần bằng **Strangler Fig** (bọc và thay thế từng phần) thay vì viết lại toàn bộ (big bang).

### Thuật ngữ (giải thích nhanh)
- **Monolith**: ứng dụng một khối, chung codebase và thường chung một database; thay đổi nhỏ cũng phải deploy cả khối.
- **Bounded context**: ranh giới trong đó khái niệm (ví dụ "Khách hàng") có một định nghĩa rõ; sang context khác cùng tên có thể mang nghĩa/thuộc tính khác.
- **Ubiquitous language** (ngôn ngữ chung): cách gọi thống nhất giữa nghiệp vụ và kỹ thuật trong một context.
- **Anti-Corruption Layer (ACL)**: lớp chuyển đổi để service mới nói chuyện với monolith/cũ mà không bị "ô nhiễm" mô hình cũ.
- **Strangler Fig**: chiến lược đặt lớp định tuyến phía trước, chuyển dần traffic/tính năng sang service mới rồi "bóp nghẹt" phần cũ.

### Cơ chế từng bước và vì sao

1. **Hiểu miền và tìm ranh giới (không bắt đầu từ code)**:
   - Dùng **Event Storming** (hội thảo vẽ sự kiện miền như "Đơn đã tạo", "Đã thanh toán") với chuyên gia nghiệp vụ để thấy luồng và cụm trách nhiệm.
   - Tìm nơi ngôn ngữ đổi nghĩa: "Sản phẩm" ở catalog (mô tả, ảnh) khác "Sản phẩm" ở kho (tồn, vị trí) → hai context.
   - Quan sát dữ liệu và **tính kết dính** (cohesion): thứ thay đổi cùng nhau, cùng transaction, nên ở cùng một ranh giới. Vì sao: cắt sai ranh giới tạo "distributed monolith" (nhiều service nhưng vẫn phải deploy/sửa cùng lúc).

2. **Đánh giá ứng viên và chọn phần tách trước**:
   - Ưu tiên module có ranh giới rõ, ít phụ thuộc ngược, lợi ích cao (tần suất deploy cao, cần scale riêng, đội riêng sở hữu).
   - Tránh tách phần đang thay đổi liên tục hoặc dính transaction chặt với nhiều phần khác ngay từ đầu.

3. **Thiết lập biên sở hữu dữ liệu**:
   - Mục tiêu: mỗi service sở hữu dữ liệu của mình; service khác truy cập qua API/event, không nối thẳng DB nhau. Vì sao: DB chung là coupling ngầm khiến tách chỉ là hình thức.
   - Dùng **database-per-service** dần dần; chấp nhận **eventual consistency** (nhất quán cuối cùng) khi dữ liệu nằm khác nơi.

4. **Thực thi Strangler Fig tăng dần**:
   - Đặt gateway/facade định tuyến; trích xuất một capability hẹp thành service mới.
   - Đồng bộ dữ liệu tạm thời nếu cần (CDC - Change Data Capture, bắt thay đổi dữ liệu, hoặc sự kiện), có cơ chế đối soát.
   - Chuyển traffic theo tỷ lệ (canary), giám sát, rồi cắt bỏ đường cũ. Vì sao: mỗi bước nhỏ có thể rollback, rủi ro thấp hơn viết lại.

5. **Xử lý giao tiếp và nhất quán**:
   - Gọi nội bộ cần kết quả ngay: REST/gRPC với timeout; quy trình dài: sự kiện + saga/outbox. (Tham chiếu tư duy đã có ở các câu về outbox, saga.)

### Dấu hiệu ranh giới tốt/xấu

| Dấu hiệu | Ranh giới tốt | Ranh giới xấu (distributed monolith) |
|---|---|---|
| Thay đổi | Deploy độc lập, ít phối hợp liên team | Sửa một tính năng phải đổi 3 service cùng lúc |
| Dữ liệu | Sở hữu bảng/schema riêng, không join chéo DB | Nhiều service đọc/ghi chung bảng |
| Giao tiếp | Ít chatty call, API gắn năng lực | Chuỗi gọi đồng bộ dài, transaction phân tán 2PC |
| Mô hình | Khái niệm rõ trong context | Cùng entity "God object" chia sẻ khắp nơi |

### Pitfall thực tế trên production
- **Tách theo tầng kỹ thuật** (service "UI", "logic", "DB") thay vì theo nghiệp vụ: vẫn coupling chặt theo luồng tính năng.
- **Chia sẻ database**: tưởng đã tách nhưng schema là hợp đồng ngầm, một bên đổi cột làm bên kia gãy.
- **Big bang rewrite**: đóng băng tính năng lâu, rủi ro tích lũy, khó so sánh đúng/sai; thường thất bại vì phạm vi mất kiểm soát.
- **Bỏ qua chi phí vận hành**: mỗi service thêm quan sát, triển khai, bảo mật, on-call; tách quá sớm khi team/miền chưa ổn định gây gánh nặng.
- **Transaction phân tán**: cố giữ ACID xuyên service bằng 2PC làm chậm và mong manh; nên thiết kế lại theo saga/nhất quán cuối cùng.

### Ví dụ đời thực
Một công ty bán lẻ có monolith Java 8 năm tuổi, 450.000 dòng, 1 DB Oracle dùng chung, đội 35 người deploy 1 lần/2 tuần vì rủi ro. Qua event storming, họ xác định 6 bounded context (catalog, giỏ/đặt hàng, thanh toán, kho, vận chuyển, khuyến mãi) và nhận thấy "Đặt hàng" thay đổi 3 lần/tuần nhưng mỗi lần phải regression cả khối. Họ chọn tách "Thông báo" (ít phụ thuộc dữ liệu lõi) làm pilot 6 tuần, rồi tách "Catalog" (đọc nhiều, cần scale) bằng Strangler Fig: route {{/api/products}} sang service mới, dùng CDC đồng bộ dữ liệu sản phẩm 2 tuần và đối soát chênh lệch < 0,1% trước khi cắt. Sau 9 tháng tách được 3 context: tần suất deploy của catalog tăng lên 5 lần/tuần, sự cố do thay đổi kho không còn kéo sập trang sản phẩm, nhưng chi phí hạ tầng tăng ~25% và đội phải đầu tư tracing/log tập trung. Họ quyết định dừng, không tách "Khuyến mãi" vì luật nghiệp vụ đang đổi mỗi tháng (ranh giới chưa ổn định).

### Trả lời mẫu khi phỏng vấn
"Khi chia nhỏ monolith, em bắt đầu từ nghiệp vụ chứ không phải từ code. Em dùng DDD và event storming để tìm bounded context, nơi ngôn ngữ và mô hình nhất quán, rồi coi mỗi context là ứng viên service có dữ liệu sở hữu riêng. Em đánh giá ưu tiên tách phần ranh giới rõ, ít phụ thuộc và lợi ích cao như cần scale hoặc deploy độc lập, còn phần miền đang biến động thì giữ lại. Về kỹ thuật, em dùng Strangler Fig: đặt lớp định tuyến, trích xuất từng capability nhỏ, tách dần database, dùng CDC hoặc sự kiện để đồng bộ tạm và đối soát trước khi cắt. Em tránh chia sẻ DB và tránh big bang vì rủi ro rất cao. Em cũng nhấn mạnh trade-off: microservices tăng tự chủ nhưng thêm độ phức tạp vận hành, nên chỉ tách khi lợi ích về tốc độ và ranh giới đội thực sự rõ. Thành công đo bằng khả năng deploy độc lập và giảm sự cố lan, không phải số lượng service."

> Senior tip: Đừng tách khi bounded context chưa ổn định; "distributed monolith" (tách service nhưng chung DB, phải deploy chung) còn tệ hơn monolith vì cộng thêm độ trễ và lỗi mạng mà không có lợi ích tự chủ.`,
  follow: [
    'Làm thế nào để phát hiện và xử lý "distributed monolith" sau khi đã tách một số service?',
    'Khi hai bounded context cần dữ liệu của nhau, bạn chọn API đồng bộ, sao chép dữ liệu (CQRS/read model) hay sự kiện tích hợp trong trường hợp nào?',
    'Bạn đo lường thành công của việc tách monolith bằng những chỉ số kỹ thuật và tổ chức nào?'
  ],
  tags: ['monolith decomposition', 'bounded context', 'ddd', 'strangler fig', 'microservices']
},
{
  id: 'microservices-070',
  topic: 'microservices',
  level: 'senior',
  q: 'Hệ thống có 3 service cùng cần gọi LLM (tóm tắt đơn hàng, gán nhãn khách hàng, sinh mô tả sản phẩm). Bạn nhúng SDK LLM vào từng service hay tách một dịch vụ AI riêng? Nêu tiêu chí quyết định và cái giá phải trả của mỗi lựa chọn.',
  a: `**Tóm tắt:** Nhúng SDK LLM vào từng service là nhanh và ít hạ tầng khi chỉ có một, hai chỗ dùng. Nhưng khi nhiều team dùng chung, bạn nên tách một **dịch vụ AI (AI gateway)** để gom việc gọi model về một chỗ: giữ API key, chia quota và chi phí, cache, đổi model, che dữ liệu cá nhân (PII) và cách ly lỗi. Quyết định không phải "cái nào tốt hơn" mà là "mức độ dùng chung và yêu cầu vận hành lớn đến đâu".

### Thuật ngữ (giải thích nhanh)
- **LLM**: large language model, mô hình sinh ngôn ngữ (GPT, Claude, Llama…). Nhận **prompt** (đoạn text) và trả về text.
- **Token**: đơn vị tính tiền và giới hạn của LLM. 1 token xấp xỉ 4 ký tự tiếng Anh; tiếng Việt khoảng 2–3 ký tự một token.
- **SDK**: thư viện chính thức của nhà cung cấp, hoặc lớp trừu tượng phía Java như **Spring AI** và **LangChain4j**.
- **AI gateway**: service trung gian giữa các service nghiệp vụ và nhà cung cấp LLM, giống API gateway nhưng cho AI.
- **PII**: personally identifiable information, dữ liệu gắn với một người (email, số điện thoại, số thẻ).
- **p95**: 95% request nhanh hơn ngưỡng này (ví dụ p95 = 4s nghĩa là 5% request chậm hơn 4s).

### Vì sao phải cân nhắc: cơ chế từng bước

1. **Mỗi lần gọi LLM là một HTTP request ra ngoài** (api.anthropic.com, api.openai.com hoặc AWS Bedrock). Thời gian trả lời thường 0,5–4 giây, có thể 10 giây với output dài. Nếu nhúng thẳng vào service nghiệp vụ, service đó "cho mượn" thread và thời gian của nó cho một việc ngoài domain của nó.
2. **Mỗi service tự giữ API key** thì key nằm rải rác ở nhiều config/secret. Mỗi lần rotate key phải deploy lại nhiều service; khi có sự cố không biết key nào bị lộ.
3. **Không có chỗ nào biết tổng chi phí theo tenant hay theo model.** Hóa đơn nhà cung cấp tăng mà không quy được về service nào, nên không tách được chi phí nội bộ (chargeback).
4. **Đổi model phải sửa code ở mọi service.** Ví dụ đổi tác vụ phân loại sang model nhỏ, rẻ hơn: nếu mỗi service tự gọi thì phải sửa và test ở cả ba.
5. **Khi nhà cung cấp trả 429 (rate limit) hoặc chậm, lỗi lan theo từng service.** Không có circuit breaker (cầu dao) và fallback (phương án dự phòng) dùng chung, nên mỗi team tự phát minh lại.

### Luồng khi tách dịch vụ AI

~~~seq
title: AI gateway dùng chung
actors: Order | Support | AI Gateway | LLM API | Redis
Order -> AI Gateway: POST /ai/summarize
Support -> AI Gateway: POST /ai/classify
AI Gateway -> Redis: kiểm tra cache và quota
AI Gateway -> LLM API: gọi model (timeout, retry)
LLM API --> AI Gateway: text + số token
AI Gateway --> Order: kết quả + cost
~~~

Điểm mấu chốt của sơ đồ: **cả Order và Support đều không biết model nào đang chạy**. Chúng chỉ biết hợp đồng HTTP của AI gateway. Nhờ vậy đổi model, thêm nhà cung cấp dự phòng hay siết quota đều không làm chúng phải deploy lại.

### Khi nào nhúng thẳng là đủ

- Chỉ **một service duy nhất** cần LLM, một use case, làm prototype hoặc nội bộ.
- Team nhỏ, chưa cần tách chi phí theo tenant.
- Cần latency thấp nhất tuyệt đối (ví dụ autocomplete trong editor), không muốn thêm một hop mạng.
- Không có dữ liệu nhạy cảm cần che tập trung.

Khi đó việc tách gateway chỉ thêm 5–20ms mỗi lần gọi, thêm một service phải deploy, giám sát và bảo mật — chi phí không đổi lại gì.

### Bảng so sánh

| Tiêu chí | Nhúng SDK vào service | Tách AI gateway riêng |
|---|---|---|
| Số điểm tích hợp | Mỗi service một chỗ | Một chỗ duy nhất |
| Quản lý API key | Rải rác, khó rotate | Tập trung, rotate một lần |
| Quota / chi phí theo tenant | Khó, phải tự làm từng nơi | Làm một lần, dùng chung |
| Đổi model | Sửa và test mọi service | Cấu hình ở gateway |
| Cache kết quả | Mỗi service một cache, lặp lại | Cache dùng chung, tiết kiệm hơn |
| Cách ly lỗi | Lỗi LLM làm chết service | Gateway cách ly, fallback tập trung |
| Độ trễ | Thấp hơn một hop mạng | Thêm 5–20ms mỗi lần |
| Vận hành | Đơn giản | Thêm service, thêm giám sát |
| Phù hợp | 1–2 use case, prototype | Từ 3 team, cần kiểm soát chi phí |

### Code: gateway là nơi duy nhất biết gọi LLM

~~~java
// Trong AI gateway: một chỗ duy nhất biết cách gọi LLM
@Service
class AiGateway {
  private final ChatClient chat;      // Spring AI: builder sinh từ cấu hình
  private final LlmQuota quota;
  private final LlmCache cache;

  AiGateway(ChatClient.Builder builder, LlmQuota q, LlmCache c) {
    this.chat = builder.build();
    this.quota = q; this.cache = c;
  }

  String summarize(String tenant, String text) {
    quota.reserve(tenant, estimateTokens(text));   // chặn trước khi tốn tiền
    String hit = cache.get(tenant, text);
    if (hit != null) return hit;                   // cache: không gọi model
    String out = chat.prompt().user(text).call().content();
    cache.put(tenant, text, out);
    quota.settle(tenant, out);                     // đối soát token thật
    return out;
  }
}
~~~

Service nghiệp vụ chỉ gọi HTTP tới gateway; nó không cần biết Spring AI, không cần API key, không cần biết model.

### Pitfall thực tế trên production

- **Nhúng SDK rồi để model "rò" vào domain.** Entity nghiệp vụ có field {{aiSummary}}; sau này model đổi làm schema đổi theo. Hãy giữ ranh giới: service nghiệp vụ chỉ nhận string.
- **Nhúng thẳng trong request đồng bộ mà không có timeout** (xem câu 072): một model chậm làm cạn thread pool của cả service.
- **AI gateway thành điểm chết đơn (single point of failure).** Phải có nhiều instance, health check và circuit breaker riêng; nếu gateway chết thì mọi tính năng AI chết theo.
- **Gateway chỉ "đi xuyên" mà không làm gì.** Nếu không gom cache/quota/redaction thì tách ra chỉ để thêm một hop mạng.
- **Chi phí gấp đôi khi chuyển đổi.** Trong lúc chạy song song hai đường (cũ và mới) để so sánh, hóa đơn LLM tăng tạm thời; phải đặt ngân sách cho giai đoạn này.

### Ví dụ đời thực

Một hệ thống thương mại điện từ có 3 team: order (tóm tắt đơn), support (gán nhãn ticket) và catalog (mô tả sản phẩm). Ban đầu mỗi team tự gọi Anthropic với key riêng. Sau 2 tháng, hóa đơn LLM tăng từ 1.900 lên 4.300 USD/tháng, nhưng không ai biết vì sao: không có số liệu theo tenant. Nhóm dựng một AI gateway (Spring Boot + Spring AI) trước 3 service: mỗi team gọi HTTP nội bộ, gateway giữ key, đếm token theo tenant và có cache theo hash prompt. Kết quả sau 1 tháng: 41% số request là cache hit (mô tả sản phẩm ít đổi), chi phí còn 2.600 USD/tháng; thời gian p95 của order giảm 300ms vì bớt gọi trùng; việc đổi model cho tác vụ phân loại chỉ sửa 1 file cấu hình thay vì 3 service. Chi phí thêm: 1 service nhỏ (2 instance) và một dashboard Grafana.

### Trả lời mẫu khi phỏng vấn

"Em không chọn theo cảm tính mà theo mức độ dùng chung. Nếu chỉ một service, một use case thì nhúng SDK là đủ, vì tách gateway chỉ thêm một hop mạng và một service phải vận hành. Nhưng ở đây có ba team cùng gọi LLM, mỗi team giữ key riêng, nên chi phí tăng mà không quy được về ai, và mỗi lần đổi model phải sửa ba nơi. Em tách một AI gateway đứng trước nhà cung cấp: nó giữ key, chia quota theo tenant và service, cache kết quả theo hash prompt, che dữ liệu cá nhân trước khi gửi, và là nơi duy nhất cấu hình timeout, retry, circuit breaker, fallback. Ba service nghiệp vụ chỉ biết hợp đồng HTTP của gateway, không biết model nào. Cái giá là thêm một service phải deploy và giám sát, cộng 5–20ms mỗi lần gọi, nhưng đổi lại kiểm soát được chi phí và đổi model không phải deploy cả hệ thống. Trong lúc chuyển đổi em chạy song song hai đường và đặt ngân sách, vì hóa đơn LLM sẽ tăng tạm thời."

> Senior tip: Dịch vụ AI chỉ đáng tách khi nó thật sự có "chính sách" để tập trung: quota, cache, redaction, đổi model, fallback. Nếu gateway chỉ chuyển tiếp request, bạn vừa thêm một hop mạng vừa thêm một điểm chết mà không được gì.`
  ,
  follow: [
    'AI gateway nên đồng bộ hay bất đồng bộ với các service nghiệp vụ? Khi nào dùng streaming (SSE) thay vì JSON một lần?',
    'Nếu một service cần tác vụ AI rất đặc thù (fine-tune model riêng), bạn cho nó gọi thẳng nhà cung cấp hay vẫn qua gateway? Ranh giới ở đâu?',
    'Bạn đo lường và chứng minh hiệu quả của AI gateway bằng những metric nào trước và sau khi tách?'
  ],
  tags: ['ai gateway', 'llm', 'spring ai', 'microservices', 'chi phí']
},
{
  id: 'microservices-071',
  topic: 'microservices',
  level: 'senior',
  q: 'Tính năng "tóm tắt hợp đồng sau khi upload" cần gọi LLM mất 3–8 giây. Bạn cho gọi đồng bộ ngay trong request HTTP hay đẩy sang queue xử lý sau? Phân tích theo latency, tài nguyên, chi phí và trải nghiệm người dùng.',
  a: `**Tóm tắt:** Chỉ gọi LLM **đồng bộ** (ngay trong request HTTP) khi người dùng thực sự phải chờ kết quả đó và thời gian chờ nằm trong ngân sách latency (chat, autocomplete, gợi ý tức thì). Với việc có thể chờ (tóm tắt tài liệu, phân loại hàng loạt, gắn nhãn, embedding), hãy trả **202 Accepted kèm job id** và xử lý qua **queue** (Kafka, RabbitMQ, SQS) để không giữ thread HTTP và không để lỗi LLM lan vào request. Thực tế thường là hybrid: nhận request, kiểm tra nhanh, nếu trả ngay được thì trả, không thì enqueue.

### Thuật ngữ (giải thích nhanh)

- **Đồng bộ (sync)**: client gửi request và bị chặn chờ tới khi có response.
- **Bất đồng bộ (async)**: client nhận ngay một "biên nhận" (job id), kết quả đến sau qua polling, webhook hoặc SSE.
- **Queue**: hàng đợi message. Bên sản xuất ghi message vào, bên tiêu thụ đọc ra xử lý; hai bên không cần sống cùng lúc.
- **Thread pool của Tomcat**: tập thread xử lý HTTP request. Spring Boot mặc định {{server.tomcat.threads.max=200}}.
- **Worker**: service đọc queue và làm việc nặng.
- **202 Accepted**: HTTP status nghĩa là "đã nhận, đang xử lý".
- **SSE**: server-sent events, kiểu trả text dần trên một HTTP connection (dùng cho streaming câu trả lời).

### Vì sao: cơ chế từng bước

1. **Một request HTTP giữ một thread từ lúc vào tới lúc xong.** Nếu gọi LLM mất 5 giây, thread bị giữ 5 giây, không làm được việc khác.
2. **Tomcat mặc định chỉ có 200 thread.** 200 request đồng thời, mỗi cái giữ thread 5 giây, thì thread pool đầy liên tục; request mới phải nằm chờ trong accept queue, latency tăng phi tuyến, rồi timeout dây chuyền. Đây chính là dạng sự cố "một downstream chậm làm kẹt thread pool" (xem câu 026 và 058).
3. **Đồng bộ còn biến quota nhà cung cấp thành nút cổ chai.** 50 request/giây cùng gọi, mỗi cái 5 giây, nghĩa là luôn có khoảng 250 lượt đang "bay". Khi provider trả 429, tất cả cùng lỗi một lúc.
4. **Queue đổi hẳn mô hình.** API chỉ ghi một message vào Kafka rồi trả 202. Worker đọc message, gọi LLM với **concurrency có kiểm soát** (ví dụ 10 song song), retry có giới hạn, ghi kết quả vào DB hoặc object storage. API không còn bị thread LLM giữ.
5. **Cái giá phải trả:** người dùng không có kết quả ngay nên cần UI "đang xử lý" (polling, SSE, hoặc webhook); cần lưu trạng thái job (PENDING, RUNNING, DONE, FAILED); cần cơ chế dọn job chết và **dead-letter queue** (DLQ) cho message luôn lỗi.

### Luồng xử lý bất đồng bộ

~~~seq
title: Tóm tắt tài liệu qua queue
actors: Client | API | Kafka | Worker | LLM API | DB
Client -> API: POST /documents (upload)
API -> Kafka: gửi job (documentId)
API --> Client: 202 + jobId
Worker -> Kafka: consume job
Worker -> LLM API: tóm tắt (timeout 20s)
LLM API --> Worker: text + số token
Worker -> DB: lưu kết quả + trạng thái DONE
Client -> API: GET /jobs/123 (polling)
~~~

Sơ đồ cho thấy API chỉ làm hai việc: ghi job và trả 202. Mọi thứ chậm và dễ lỗi nằm sau Kafka, nơi có thể scale worker độc lập.

### Bảng so sánh ba lựa chọn

| Tiêu chí | Đồng bộ | Bất đồng bộ (queue) | Hybrid |
|---|---|---|---|
| Người dùng thấy kết quả | Ngay | Sau vài giây đến vài phút | Ngay với việc nhỏ, sau với việc lớn |
| Thread HTTP bị giữ | Có, lâu | Không | Chỉ với phần nhanh |
| Chịu được provider chậm/429 | Kém, dễ sập dây chuyền | Tốt, có retry và backpressure | Trung bình, tùy tỷ lệ đi nhánh nào |
| Chi phí khi retry | Retry trong request làm tăng latency | Retry ở worker, không ảnh hưởng API | Kết hợp |
| Độ phức tạp | Thấp | Cao (job store, worker, DLQ) | Cao nhất |
| Phù hợp | Chat, gợi ý, autocomplete | Tóm tắt, phân loại batch, embedding | Sản phẩm thật |

### Code: API trả 202, worker xử lý

~~~java
@PostMapping("/documents")
ResponseEntity<JobAccepted> upload(@RequestBody UploadRequest req) {
  String jobId = jobService.create(req.documentId, "PENDING");
  kafkaTemplate.send("doc-tasks", jobId, req);        // chỉ ghi message
  return ResponseEntity.accepted().body(new JobAccepted(jobId));
}
~~~

~~~java
@KafkaListener(topics = "doc-tasks", concurrency = "10")
void onTask(String jobId) {
  jobService.markRunning(jobId);
  String summary = aiClient.summarize(jobService.load(jobId)); // đã có timeout
  jobService.finish(jobId, summary);                  // lưu + đánh dấu DONE
}
~~~

Hai đoạn này chưa có retry và idempotency — đó là phần phải thêm trước khi lên production (xem pitfall).

### Pitfall thực tế trên production

- **Queue không có giới hạn.** Khi LLM chậm, job vào nhanh hơn worker xử lý, queue phình ra; hàng triệu message nằm chờ, người dùng bấm "làm mới" liên tục. Phải có độ sâu tối đa, cảnh báo và chiến lược từ chối (hoặc hạ ưu tiên).
- **Retry storm làm tốn tiền gấp nhiều lần.** Một model lỗi 503 khiến worker retry 3 lần mỗi job; 10.000 job thành 40.000 lần gọi. Phải giới hạn retry, dùng backoff + jitter và tính chi phí retry vào ngân sách.
- **Message trùng (duplicate).** Kafka có thể giao lại message; nếu không có idempotency key thì LLM bị gọi hai lần cho cùng document — tốn tiền vô ích. Dùng {{documentId}} làm khóa và lưu trạng thái trước khi gọi.
- **Job chết giữa chừng.** Worker crash sau khi gọi LLM nhưng trước khi lưu kết quả: tiền đã tiêu, kết quả mất. Cần lưu kết quả ngay khi nhận, hoặc thiết kế để lần sau dùng lại (cache).
- **Polling quá dày.** Client gọi API xem trạng thái job mỗi 200ms cho 50.000 job sẽ tạo tải lớn hơn cả LLM. Dùng SSE hoặc webhook, hoặc polling giãn cách dần (exponential backoff phía client).

### Ví dụ đời thực

Một nền tảng pháp lý cho upload hợp đồng để tóm tắt. Ban đầu gọi LLM đồng bộ: p95 của API là 8,2 giây, giờ cao điểm 40% request trả 504, thread Tomcat luôn ở mức 200/200, CPU thấp nhưng request vẫn xếp hàng. Nhóm chuyển sang queue: API chỉ ghi Kafka rồi trả 202 (p95 còn 120ms), 12 worker đọc với concurrency 12, mỗi worker timeout 20 giây, retry tối đa 2 lần cho 503/429, kết quả lưu vào Postgres và S3. Kết quả: API hết 504, người dùng nhận tóm tắt sau 30–90 giây (có thanh tiến trình), chi phí LLM không đổi vì số lần gọi không tăng, nhưng số lần gọi lặp giảm 18% nhờ idempotency key. Đánh đổi: phải viết UI theo dõi job và một job dọn message cũ.

### Trả lời mẫu khi phỏng vấn

"Em phân biệt theo việc người dùng có cần kết quả ngay hay không. Với chat, gợi ý hay autocomplete thì phải đồng bộ, vì chờ vài giây là trải nghiệm hỏng. Nhưng tóm tắt hợp đồng 3–8 giây thì đồng bộ rất nguy hiểm: mỗi request giữ một thread Tomcat, mặc định chỉ có 200 thread, nên khi LLM chậm là cả service xếp hàng rồi sập dây chuyền, chưa kể provider 429 thì tất cả cùng lỗi. Em chọn bất đồng bộ: API ghi một message vào Kafka và trả 202 kèm job id, worker đọc với concurrency giới hạn, có timeout, retry giới hạn và DLQ, kết quả lưu DB rồi client theo dõi bằng SSE hoặc polling. Cái giá là phải quản lý trạng thái job và UI tiến trình, nhưng bù lại API luôn nhanh, scale worker độc lập và retry không làm người dùng chờ. Nếu cần, em làm hybrid: việc nhỏ trả ngay, việc lớn mới enqueue."

> Senior tip: Trước khi quyết định sync hay async, hãy đo p95 và p99 thật của lời gọi LLM. Nếu p99 gấp 3 lần p95 thì sync sẽ luôn có một nhóm user chịu cảnh timeout — đó là dấu hiệu rõ nhất nên chuyển sang queue.`
  ,
  follow: [
    'Bạn thiết kế idempotency cho worker thế nào để một message bị giao lại không làm tốn tiền LLM hai lần?',
    'SSE, webhook và polling: bạn chọn cách nào để báo kết quả cho client, và vì sao?',
    'Nếu queue phình quá nhanh vì LLM chậm, bạn làm gì để bảo vệ hệ thống: từ chối request, hạ ưu tiên, hay tắt bớt tính năng AI?'
  ],
  tags: ['llm', 'queue', 'kafka', 'async', 'thread pool', '202 accepted']
},
{
  id: 'microservices-072',
  topic: 'microservices',
  level: 'lead',
  q: 'Dịch vụ AI chậm dần: p95 từ 1,5 giây lên 6 giây. Bạn thiết kế timeout, circuit breaker, retry và fallback thế nào để request nghiệp vụ không chết theo? Ngưỡng do ai quyết định và dựa trên số liệu gì?',
  a: `**Tóm tắt:** Đặt **ngân sách thời gian (deadline) cho cả request** rồi chia ngược cho từng bước, không đặt timeout rời rạc 5 giây ở mọi hop. Lời gọi LLM phải có **connect timeout ngắn và read/total timeout** theo SLO, **circuit breaker** để ngừng gọi khi downstream rác, **retry có giới hạn và backoff** chỉ cho lỗi tạm thời (429, 5xx — không retry 4xx), và một **chuỗi fallback giảm dần**: model lớn, model nhỏ, cache, luật mặc định. Người dùng cuối phải nhận được câu trả lời có ích, dù kém hơn, thay vì lỗi 500.

### Thuật ngữ (giải thích nhanh)

- **Connect timeout**: thời gian tối đa để mở kết nối TCP tới nhà cung cấp.
- **Read timeout**: thời gian tối đa chờ dữ liệu trả về.
- **Deadline / budget**: tổng thời gian còn lại cho cả request, trừ dần theo từng bước.
- **Circuit breaker (cầu dao)**: khi tỷ lệ lỗi vượt ngưỡng thì "mở", fail nhanh thay vì tiếp tục gọi downstream.
- **Retry / backoff**: thử lại sau khoảng chờ tăng dần (200ms, 400ms, 800ms).
- **Jitter**: cộng thêm ngẫu nhiên nhỏ để nhiều instance không retry cùng lúc.
- **SLO**: mục tiêu mức dịch vụ, ví dụ 99% request dưới 3 giây.
- **Hedging**: gửi song song hai request và lấy cái về trước; nhanh hơn nhưng tốn gấp đôi.
- **Fallback**: phương án dự phòng khi chính không thành công.

### Cơ chế từng bước

1. **Tính ngân sách trước.** Client đặt deadline 5 giây. Gateway mất 50ms, AI service mất 30ms, còn lại khoảng 4,9 giây cho LLM. Vì vậy timeout của lời gọi LLM phải nhỏ hơn 4,9 giây.
2. **Nếu mỗi hop tự đặt timeout bằng nhau (5 giây) thì tổng có thể là 20 giây** — lỗi "timeout cộng dồn". Deadline phải được truyền xuống dưới, qua header (ví dụ {{x-deadline-ms}}) hoặc context, và mỗi hop lấy min(còn lại, timeout cấu hình).
3. **Khi downstream chậm, circuit breaker đếm tỷ lệ lỗi trong cửa sổ trượt** (ví dụ 50% lỗi trong 20 lần gọi gần nhất) rồi mở. Sau {{waitDurationInOpenState}} (30 giây) nó chuyển half-open, cho vài request thử; nếu vẫn lỗi thì mở tiếp.
4. **Circuit breaker cũng phải bắt "chậm mà không lỗi".** Resilience4j có {{slowCallDurationThreshold}} và {{slowCallRateThreshold}}: nếu quá 50% request chậm hơn 2 giây thì coi như hỏng, dù HTTP vẫn 200. Đây là điểm hay bị bỏ sót.
5. **Retry chỉ với lỗi có thể hồi phục:** 429 (kèm header {{Retry-After}}), 500, 502, 503, 504. Không retry 400 (prompt sai, sẽ tốn tiền vô ích) và không retry vô hạn. Số lần tối đa 1–2, có backoff và jitter.
6. **Fallback giảm dần theo mức:** (a) model nhỏ/nhanh hơn cho cùng tác vụ; (b) cache kết quả tương tự (theo hash prompt hoặc semantic cache); (c) câu trả lời mẫu hoặc luật nghiệp vụ; (d) nếu là async thì nhận job id và trả "sẽ có kết quả sau".
7. **Retry LLM tốn tiền thật.** Cần **ngân sách chi phí cho mỗi request** và ghi log số lần gọi, để phát hiện retry storm trước khi hóa đơn tăng gấp ba.

### Code: timeout ở tầng HTTP và circuit breaker

~~~java
// 1) Timeout chắc chắn nằm ở tầng HTTP, không phụ thuộc thread
HttpClient http = HttpClient.newBuilder()
    .connectTimeout(Duration.ofMillis(800))     // connect ngắn
    .build();
JdkClientHttpRequestFactory rf = new JdkClientHttpRequestFactory(http);
rf.setReadTimeout(Duration.ofSeconds(5));       // đọc dữ liệu
~~~

~~~java
// 2) Circuit breaker bọc lời gọi LLM
CircuitBreakerConfig cfg = CircuitBreakerConfig.custom()
    .slidingWindowSize(20)
    .failureRateThreshold(50)                       // 50% lỗi thì mở
    .slowCallDurationThreshold(Duration.ofSeconds(2))
    .slowCallRateThreshold(60)                      // 60% chậm hơn 2s cũng coi là hỏng
    .waitDurationInOpenState(Duration.ofSeconds(30))
    .build();
CircuitBreaker cb = CircuitBreakerRegistry.of(cfg).circuitBreaker("llm");

Supplier<String> guarded = CircuitBreaker.decorateSupplier(cb, () -> chatClient.call());
try {
  return guarded.get();
} catch (CallNotPermittedException e) {
  return fallback();                                // breaker đang mở: đi đường dự phòng
}
~~~

{{CallNotPermittedException}} là ngoại lệ Resilience4j ném ra khi cầu dao đang mở; bắt riêng nó để phân biệt với lỗi thật của nhà cung cấp.

### Bảng fallback: mức nào cho người dùng thấy gì

| Mức | Điều kiện kích hoạt | Người dùng thấy | Chi phí | Ghi chú |
|---|---|---|---|---|
| 0 | Bình thường | Kết quả đầy đủ từ model lớn | 100% | Nền so sánh |
| 1 | Chậm > 2s hoặc 429 nhẹ | Model nhỏ, câu ngắn hơn | ~30% | Phải test chất lượng trước |
| 2 | Breaker mở | Cache hoặc kết quả tương tự | 0% | Có thể cũ, cần ghi rõ |
| 3 | Breaker mở + không cache | Luật mặc định / câu mẫu | 0% | Không được im lặng |
| 4 | Toàn bộ lỗi | Job id, "xử lý sau" | 0% | Chỉ với async |

### Pitfall thực tế trên production

- **Timeout ở client HTTP nhưng không có timeout ở tầng application.** Ví dụ RestClient có read timeout 5 giây, nhưng code lại gọi {{.block()}} không giới hạn trên một Mono khác. Phải kiểm tra cả hai.
- **Hedging bị lạm dụng.** Gửi hai request cho mọi lần gọi làm hóa đơn gấp đôi; chỉ nên hedge cho request giá trị cao, và chỉ khi p95 đã lớn hơn ngân sách.
- **Retry làm hỏng chi phí.** Một provider 503 kéo dài 10 phút, retry 3 lần với 200 RPS tạo gấp 4 lần lưu lượng khi provider đang yếu, khiến nó càng yếu (retry storm). Phải có circuit breaker trước retry.
- **Fallback im lặng.** Model nhỏ trả kết quả sai nhưng UI vẫn báo "thành công", người dùng mất niềm tin. Phải gắn cờ degraded (giảm chất lượng) và ghi metric.
- **Ngưỡng đặt bằng cảm tính.** "5 giây là đủ" mà không có SLO và số liệu thật; hoặc đặt timeout 60 giây vì sợ user phàn nàn, làm thread bị giữ quá lâu.

### Ví dụ đời thực

Một hệ thống hỗ trợ khách hàng gọi Claude qua AWS Bedrock. Sau một đợt model bị quá tải, p95 tăng từ 1,5 lên 6,2 giây, tỷ lệ lỗi 504 tăng lên 4%, và vì mỗi request giữ thread 6 giây nên service order bị kẹt thread theo. Nhóm đặt deadline toàn request 5 giây, truyền xuống dưới bằng header; timeout HTTP là connect 800ms và read 4,5 giây; circuit breaker mở khi 50% request chậm hơn 2 giây trong cửa sổ 20 lần; fallback mức 1 sang model nhỏ (nhanh, rẻ) và mức 2 sang cache. Kết quả sau 1 giờ: tỷ lệ lỗi còn 0,3%, p95 còn 1,8 giây, chi phí LLM tăng 12% do dùng model nhỏ, nhưng downtime của tính năng chat là 0. Ngưỡng do nhóm platform đặt dựa trên SLO "99% request dưới 3 giây" và ngân sách chi phí 3.000 USD/tháng; mọi thay đổi ngưỡng phải có số liệu p95/p99 và chi phí đi kèm.

### Trả lời mẫu khi phỏng vấn

"Em bắt đầu từ ngân sách thời gian của cả request, không đặt timeout rời rạc. Client cho 5 giây, trừ các hop nội bộ thì còn khoảng 4,9 giây cho LLM, nên timeout LLM phải nhỏ hơn thế và deadline phải được truyền xuống dưới, nếu không các hop cộng dồn thành 20 giây. Em đặt connect timeout 800ms và read timeout 4,5 giây ở tầng HTTP, vì đó là chỗ chắc chắn cắt được thread. Sau đó là circuit breaker: mở khi 50% request lỗi trong cửa sổ 20 lần, và quan trọng là bắt cả trường hợp chậm mà không lỗi, dùng slowCallDurationThreshold hai giây. Retry chỉ cho 429 và 5xx, tối đa hai lần, có backoff và jitter; không retry 4xx vì tốn tiền vô ích. Cuối cùng là fallback giảm dần: model nhỏ, cache, câu trả lời mẫu, rồi job id nếu async. Ngưỡng do nhóm platform đặt theo SLO và ngân sách chi phí, và mọi thay đổi đều phải có p95, p99 và chi phí đi kèm. Kết quả lần trước là lỗi giảm từ 4% xuống 0,3%, p95 từ 6,2 xuống 1,8 giây, chi phí chỉ tăng 12%."

> Senior tip: Một downstream chậm nguy hiểm hơn một downstream lỗi, vì lỗi được đếm còn chậm thì không. Hãy đặt ngưỡng "chậm" (slowCallRate) trong circuit breaker và theo dõi nó như một SLO riêng — đó là bài học đắt nhất trong các sự cố LLM.`
  ,
  follow: [
    'Bạn phân biệt lỗi 429 (rate limit) với 503 (quá tải) thế nào trong chính sách retry và backoff?',
    'Khi nào hedging là đáng tiền, và làm sao giới hạn để hóa đơn LLM không tăng gấp đôi?',
    'Bạn truyền deadline qua các hop thế nào khi có cả message queue ở giữa (Kafka)?'
  ],
  tags: ['timeout', 'circuit breaker', 'retry', 'fallback', 'deadline', 'resilience4j', 'llm']
},
{
  id: 'microservices-073',
  topic: 'microservices',
  level: 'senior',
  q: 'Ba service dùng chung một tài khoản LLM với hạn mức token theo tháng. Bạn thiết kế cơ chế chia quota thế nào để một service không đốt hết phần của các service khác, và một tenant không làm cả hệ thống vượt ngân sách?',
  a: `**Tóm tắt:** Chia quota theo **phân cấp** (tổ chức, service, tenant, user), mỗi cấp có hạn mức riêng và một cơ chế **đếm nguyên tử** (thường là Redis chạy script Lua) để không vượt. Dùng **đặt trước rồi chốt sau** (reserve/settle): trước khi gọi LLM, ước lượng token và giữ chỗ; sau khi có số token thật từ nhà cung cấp thì chốt và hoàn phần dư. Kết hợp **chia đều theo tỷ lệ (fair-share)** để service ít dùng không bị bỏ đói, và tôn trọng giới hạn RPM/TPM của nhà cung cấp (429 kèm Retry-After).

### Thuật ngữ (giải thích nhanh)

- **Quota**: hạn mức được phép dùng, tính theo token, theo request hoặc theo tiền.
- **Rate limit**: giới hạn số request mỗi phút (RPM) và số token mỗi phút (TPM).
- **Token bucket**: xô token nạp dần theo thời gian; mỗi request múc một ít, hết thì phải chờ.
- **Fair-share**: chia theo tỷ lệ đã đăng ký, không theo ai đến trước.
- **Reserve / settle**: giữ chỗ trước, chốt theo số thật sau.
- **Nguyên tử (atomic)**: thao tác không bị request khác chen vào giữa.
- **429**: too many requests; thường kèm header Retry-After (số giây nên chờ).
- **Chargeback**: phân bổ chi phí về từng team hoặc tenant.

### Vì sao: cơ chế từng bước

1. **Một API key duy nhất thì mọi service thấy cùng một hạn mức.** Service A chạy batch 1 triệu token lúc 2 giờ sáng có thể làm service B (chat realtime) ăn 429 giữa ngày, dù B chỉ cần một phần nhỏ.
2. **Đơn vị đếm là token**, gồm prompt token và completion token. Phải ước lượng **trước** khi gọi để chặn: 1 token xấp xỉ 4 ký tự tiếng Anh, tiếng Việt khoảng 2–3 ký tự một token; hoặc dùng tokenizer chính thức của nhà cung cấp.
3. **Đếm nguyên tử bằng Redis.** Key theo tổ chức, service và kỳ (ví dụ tháng). Một script Lua nhận (key, số token muốn dùng, hạn mức) và trả về "cho phép hoặc từ chối" trong một lần thực thi, tránh race khi nhiều instance cùng trừ.
4. **Reserve rồi settle.** Reserve bằng min(ước lượng, còn lại). Gọi LLM. Nhận usage thật (ví dụ ước 900, thật 1.050) thì chốt thêm phần chênh; nếu lỗi trước khi gọi thì hoàn.
5. **Phân cấp.** Service có hạn mức cứng, tenant có hạn mức riêng; tổng các tenant không vượt hạn mức tổ chức. Cho phép "vay" tạm thời khi một service rảnh, nhưng phải có trần vay và phải hoàn.
6. **Tôn trọng giới hạn nhà cung cấp.** Mỗi model có RPM/TPM riêng. Hàng đợi ưu tiên: chat realtime ưu tiên, batch đêm chỉ chạy khi quota rảnh.
7. **Báo cáo** token theo service, tenant và model để đối chiếu hóa đơn (chargeback) và phát hiện bất thường sớm.

~~~seq
title: Quota hai pha (reserve rồi settle)
actors: Order | AI Gateway | Redis | LLM API
Order -> AI Gateway: yêu cầu tóm tắt
AI Gateway -> Redis: reserve 900 token
Redis --> AI Gateway: còn 8000, cho phép
AI Gateway -> LLM API: gọi model
LLM API --> AI Gateway: text + usage 1050
AI Gateway -> Redis: settle thêm 150
~~~

### Code: đếm nguyên tử bằng Redis

~~~java
// Script Lua chạy trong Redis: trừ token nguyên tử, có hoàn nếu vượt
String LUA = """
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
local want = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
if used + want > limit then return -1 end
redis.call('INCRBY', KEYS[1], want)
return limit - used - want
""";
~~~

~~~java
// 1) Reserve trước khi gọi (ước lượng)
Long left = redis.execute(new DefaultRedisScript(LUA, Long.class),
    List.of("quota:acme:support:2026-02"), "900", "1000000");
if (left == null || left < 0) throw new QuotaExceededException();

String out = chat.call();                                    // chỉ gọi sau khi đã reserve
int real = usageOf(out);                                     // usage thật từ provider
// 2) Settle: bù phần chênh (âm nếu bớt, dương nếu thêm)
redis.opsForValue().increment("quota:acme:support:2026-02", real - 900);
~~~

### Bảng so sánh các mô hình chia quota

| Mô hình | Cách hoạt động | Ưu | Nhược |
|---|---|---|---|
| Cố định theo service | Mỗi service một hạn mức cứng, không đổi | Đơn giản, dễ dự đoán | Service rảnh không cho ai vay, lãng phí |
| Vay động (borrowing) | Service dùng ít nhường cho service cần, có trần | Tận dụng tốt, linh hoạt | Phức tạp, dễ tranh chấp khi cao điểm |
| Gateway tập trung | Mọi lời gọi qua gateway, gateway quyết định | Kiểm soát một chỗ, có ưu tiên | Gateway là điểm chết, thêm hop |
| Theo tenant + công bằng | Chia đều theo tenant, dư thì chia lại | Bảo vệ tenant nhỏ | Cần theo dõi usage từng tenant |

### Pitfall thực tế trên production

- **Ước lượng lệch nhiều so với thực tế.** Ước 900 nhưng thật 1.500 vì output dài; nếu không settle thì quota bị rò. Phải luôn chốt theo usage thật.
- **Hoàn khi lỗi.** Reserve 900, provider trả 500 trước khi sinh token: phải hoàn 900, nếu không quota bị rò dần và hệ thống tự bóp cổ chính nó.
- **Key không có TTL theo kỳ.** Nếu key chỉ là {{quota:acme:support}} thì tháng sau vẫn cộng dồn; phải đưa kỳ vào key và đặt TTL dài hơn kỳ một chút.
- **Không đếm retry.** Mỗi lần retry là thêm token; retry 3 lần làm chi phí thực gấp 4 lần dự tính.
- **Race khi nhiều instance.** Nếu chỉ GET rồi SET (không nguyên tử), hai instance cùng đọc 900 còn lại và cùng cho phép, vượt hạn mức.
- **Bỏ qua cache.** Cache hit không tốn token, nhưng nếu tính nhầm là có tốn thì quota bị bóp oan.

### Ví dụ đời thực

Một SaaS có 40 tenant dùng chung tính năng tóm tắt email. Ban đầu chỉ có một hạn mức chung theo API key: một tenant lớn chạy import dữ liệu vào cuối tháng đã tiêu 71% hạn mức token, khiến 12 tenant nhỏ ăn 429 trong hai ngày và mở ticket. Nhóm chuyển sang quota hai pha theo tenant với Redis: mỗi tenant có hạn mức riêng theo gói, tổng không vượt hạn mức tổ chức; reserve trước khi gọi, settle theo usage thật, hoàn khi lỗi; ban đêm cho batch vay quota rảnh với trần 20%. Kết quả: không còn 429 diện rộng, sai số dự báo chi phí giảm từ ±35% xuống ±6% vì có số liệu theo tenant, và phát hiện một vòng retry ẩn đang đốt 18% token — sửa xong tiết kiệm 18% chi phí tháng.

### Trả lời mẫu khi phỏng vấn

"Em không để các service dùng chung một hạn mức trần, vì một service chạy batch có thể bóp cổ service realtime. Em chia quota theo phân cấp: tổ chức có hạn mức tổng, mỗi service và mỗi tenant có hạn mức con, tổng con không vượt tổng. Việc đếm phải nguyên tử, nên em dùng Redis với một script Lua nhận key, số token muốn dùng và hạn mức, trả về cho phép hay từ chối trong một lần thực thi; nếu GET rồi SET riêng thì hai instance cùng đọc một số và vượt hạn mức. Em dùng hai pha: reserve theo ước lượng trước khi gọi, rồi settle theo usage thật từ provider và hoàn khi lỗi, vì ước lượng hay lệch. Ngoài ra em theo dõi RPM/TPM của nhà cung cấp để không ăn 429, cho batch ban đêm vay quota rảnh có trần, và log token theo tenant để chargeback. Sau khi làm, sai số dự báo chi phí giảm từ ±35% xuống ±6% và hết 429 diện rộng."

> Senior tip: Quota không có settle theo usage thật sẽ luôn rò, vì ước lượng đầu vào gần như không bao giờ khớp output. Hãy coi reserve chỉ là "giữ chỗ tạm" và settle là "sự thật", đồng thời hoàn chỗ khi request thất bại trước khi tốn token.`
  ,
  follow: [
    'Bạn ước lượng token trước khi gọi thế nào cho đủ chính xác, và khi nào cần dùng tokenizer thật?',
    'Khi một tenant vượt hạn mức giữa tháng, bạn chặn cứng hay hạ ưu tiên? Ảnh hưởng tới các tenant khác ra sao?',
    'Làm sao phát hiện một service đang retry quá nhiều và đốt quota ngầm?'
  ],
  tags: ['quota', 'rate limit', 'redis', 'lua', 'llm', 'chi phí', 'multi-tenant']
},
{
  id: 'microservices-074',
  topic: 'microservices',
  level: 'senior',
  q: 'Một request đi qua service nghiệp vụ rồi AI gateway rồi nhà cung cấp LLM. Bạn log và trace thế nào để khi request chậm hoặc tốn tiền bất thường, bạn trả lời được: của tenant nào, model nào, bao nhiêu token, có phải cache miss không? Cái gì tuyệt đối không được log?',
  a: `**Tóm tắt:** Gắn **trace và span xuyên biên**: request nghiệp vụ tạo span gốc, AI gateway tạo span con cho lần gọi LLM với các thuộc tính chuẩn (model, token vào/ra, latency, có cache hit), và **log có cấu trúc JSON** chứa trace id, span id, tenant, service, model, chi phí, hash của prompt. Tuyệt đối **không log nguyên prompt và response**, vì chúng thường chứa dữ liệu cá nhân và làm log phình to; thay bằng hash, độ dài, số token và một request id để truy vết có kiểm soát. Với bất đồng bộ qua Kafka, phải **truyền trace context trong message header** để chuỗi trace không bị đứt.

### Thuật ngữ (giải thích nhanh)

- **Trace**: toàn bộ đường đi của một request qua nhiều service.
- **Span**: một bước trong trace (một service, một lần gọi LLM).
- **Trace context**: header traceparent theo chuẩn W3C, chứa trace id và span id.
- **OpenTelemetry (OTel)**: chuẩn và SDK để sinh trace, metric, log.
- **MDC**: mapped diagnostic context trong logback, chứa traceId và spanId để mỗi dòng log tự gắn.
- **Structured log**: log JSON, mỗi dòng một object, dễ truy vấn (Loki, ELK, CloudWatch).
- **RED metrics**: rate, errors, duration.
- **Redaction / che dữ liệu**: làm mờ hoặc bỏ dữ liệu nhạy cảm trước khi lưu.

### Vì sao: cơ chế từng bước

1. **Request vào có header traceparent; nếu chưa có thì gateway tạo trace id mới** (16 byte hex theo W3C). Đây là "sợi chỉ" nối mọi service.
2. **Mỗi service dùng OTel SDK; logback pattern thêm traceId và spanId qua MDC.** Nhờ đó mọi dòng log của cùng một request mang cùng trace id, dò được từ UI sang DB.
3. **AI gateway mở span con (ví dụ "llm.chat") quanh lời gọi.** Thuộc tính span gồm hệ model, model, token vào, token ra, có cache hit, mức fallback. OpenTelemetry có semantic convention riêng cho GenAI với các trường kiểu gen_ai.*; tên trường có thể đổi theo phiên bản nên phải kiểm tra lại tài liệu.
4. **Chi phí = token nhân đơn giá, ghi vào log và metric.** Dashboard: token theo tenant, model, service; chi phí theo ngày; tỷ lệ cache hit.
5. **Prompt và response chỉ lưu hash SHA-256, độ dài, số token**, hoặc lưu bản đã che dữ liệu cá nhân với thời hạn ngắn (ví dụ 7 ngày) khi cần debug chất lượng; phải có chính sách và phân quyền rõ ràng.
6. **Bất đồng bộ:** producer đặt traceparent vào Kafka header, consumer đọc và tiếp tục span. Nếu không, trace đứt tại queue và log của worker thành mồ côi, không biết đến từ request nào.
7. **Sampling:** giữ 100% request lỗi và một tỷ lệ nhỏ request thành công (tail-based sampling) để giảm chi phí mà vẫn thấy bất thường.

### Code: span cộng log có cấu trúc

~~~java
Span span = tracer.spanBuilder("llm.chat")
    .setAttribute("gen_ai.request.model", model)
    .setAttribute("llm.tenant", tenantId)
    .startSpan();
try (Scope s = span.makeCurrent()) {
  MDC.put("tenant", tenantId);
  MDC.put("model", model);
  ChatResponse r = chatClient.prompt().user(prompt).call().chatResponse();
  var u = r.getMetadata().getUsage();               // usage thật từ provider
  span.setAttribute("gen_ai.usage.input_tokens", u.getPromptTokens());
  span.setAttribute("gen_ai.usage.output_tokens", u.getCompletionTokens());
  span.setAttribute("llm.cache.hit", cacheHit);
  log.info("llm done prompt_hash={} tokens={}", sha256hex(prompt), u.getTotalTokens());
  return r;
} catch (Exception e) {
  span.recordException(e);                           // lỗi cũng phải nằm trên span
  throw e;
} finally {
  span.end();
  MDC.clear();
}
~~~

### Log gì và không log gì

| Loại dữ liệu | Có log? | Cách làm |
|---|---|---|
| trace id, span id | Có | MDC cộng exporter |
| tenant, service, model | Có | Thuộc tính span cộng field log |
| số token, chi phí | Có | Từ usage, quy ra tiền |
| độ dài prompt, hash | Có | Hash cộng length |
| nội dung prompt/response | Không | Chỉ bản che PII, TTL ngắn |
| API key, authorization | Không | Không bao giờ |
| email, số điện thoại, số thẻ | Không | Redaction trước khi log |
| stack trace | Có, mức error | Kèm trace id |

### Pitfall thực tế trên production

- **Log nguyên prompt làm phình log và vi phạm quyền riêng tư.** Một hệ thống 1 triệu request/ngày, mỗi prompt 4 KB, là 4 GB mỗi ngày chỉ riêng prompt, chưa tính response.
- **Trace đứt ở Kafka.** Producer quên gắn traceparent vào header thì mọi log của worker không có trace id, không nối được với request gốc.
- **Đưa userId hay orderId vào thuộc tính span.** Mỗi giá trị mới tạo một time series, metric nổ (high cardinality) và hệ thống giám sát đắt lên hoặc chậm đi.
- **Sampling bỏ mất lỗi.** Nếu chỉ lấy mẫu 1% request thành công và bỏ hết lỗi thì không bao giờ thấy sự cố; phải giữ 100% lỗi.
- **Log đồng bộ nặng.** Ghi log JSON có serialize trong đường nóng làm tăng latency; dùng async appender và đo tác động.

### Ví dụ đời thực

Một hệ thống gọi LLM qua AWS Bedrock. Một tenant nhỏ bỗng ăn 429 liên tục; sáu tiếng đầu không ai biết vì log chỉ có "LLM_ERROR" không gắn tenant. Nhóm bổ sung trace: AI gateway tạo span con cho mỗi lần gọi, gắn tenant, model, token, cache hit, và log JSON có trace id; producer Kafka gắn traceparent vào header. Khi sự cố lặp lại, truy vết theo tenant thấy tenant đó chiếm 92% TPM trong 3 phút, và trace chỉ ra một vòng retry trong service support (3 lần, hai model khác nhau). Điều tra từ 2 ngày xuống 40 phút. Sau đó nhóm thay prompt đầy đủ bằng hash SHA-256 và độ dài, giữ bản che dữ liệu cá nhân 7 ngày; dung lượng log giảm 70% mà vẫn tra được sự cố.

### Trả lời mẫu khi phỏng vấn

"Em gắn trace xuyên biên trước, vì nếu không có sợi chỉ chung thì mọi thứ rời rạc. Request vào tạo span gốc, AI gateway mở span con cho lần gọi LLM, gắn các thuộc tính chuẩn kiểu gen_ai: model, token vào, token ra, cache hit, mức fallback. Log là JSON có trace id, span id, tenant, service, model và chi phí quy ra tiền, để dashboard trả lời được token theo tenant và chi phí theo ngày. Với Kafka em truyền traceparent trong header, vì nếu quên thì log của worker mồ côi, không nối về request nào. Về nội dung, em không log nguyên prompt và response: vừa có nguy cơ lộ dữ liệu cá nhân, vừa làm log phình rất nhanh, nên em lưu hash, độ dài, số token, và chỉ giữ bản đã che dữ liệu trong thời hạn ngắn khi cần debug chất lượng. API key thì không bao giờ log. Em cũng giữ 100% request lỗi khi sampling, và đưa userId hay orderId vào thuộc tính span là thứ phải tránh vì metric sẽ nổ."

> Senior tip: Đừng nghĩ "log càng nhiều càng dễ debug". Với LLM, prompt và response là dữ liệu vừa nhạy cảm vừa nặng; hãy mặc định log hash và metadata, chỉ mở nội dung khi có sự cố và có phê duyệt. Một hệ thống log đủ tốt trả lời được "tenant nào, model nào, bao nhiêu token" mà không cần đọc một chữ nội dung nào.`
  ,
  follow: [
    'Bạn làm sao để trace không đứt khi request đi qua Kafka và mất vài phút mới xử lý xong?',
    'Giữa log, metric và trace, bạn dùng cái nào để phát hiện chi phí LLM tăng bất thường, và vì sao?',
    'Nếu cần debug chất lượng một câu trả lời cụ thể, bạn truy vết thế nào mà không lưu toàn bộ nội dung?'
  ],
  tags: ['observability', 'tracing', 'opentelemetry', 'logging', 'pii', 'llm', 'kafka']
},
{
  id: 'microservices-075',
  topic: 'microservices',
  level: 'lead',
  q: 'Service AI trả JSON không xác định: cùng prompt, model có thể trả khác nhau. Bạn kiểm thử contract thế nào để caller không gãy khi model đổi mà test vẫn ổn định? Ai sở hữu bộ eval, và ngưỡng nào chặn release?',
  a: `**Tóm tắt:** Với LLM không thể "contract bằng so khớp response chính xác". Hãy chia ba lớp: (1) **contract cấu trúc** — JSON Schema bắt buộc (field, kiểu, enum), kiểm tra 100% response; (2) **contract hành vi cho phần tất định** — consumer-driven contract kiểu Pact cho envelope, header, status và cho schema của tool/function mà AI service cung cấp; (3) **đánh giá chất lượng (eval)** — bộ dataset vàng cộng rubric, chấm tự động (LLM-as-judge hoặc luật), chạy trong CI với ngưỡng (ví dụ tỷ lệ đúng schema từ 99,5%, điểm eval từ baseline trừ 0,05). Đổi model thì chạy lại toàn bộ eval, deploy bằng canary và shadow traffic. Phần của lead: ai sở hữu dataset, ngưỡng nào chặn release, quy trình cập nhật khi model nâng cấp.

### Thuật ngữ (giải thích nhanh)

- **Contract**: mô tả tương tác hai bên đồng ý (schema, status, header).
- **Non-determinism**: cùng input cho output khác nhau, do temperature lớn hơn 0 hoặc do model đổi.
- **JSON Schema**: tài liệu mô tả cấu trúc JSON (field bắt buộc, kiểu, enum, regex).
- **Golden dataset**: bộ input mẫu và kỳ vọng đã chốt, dùng so sánh giữa các phiên bản.
- **Eval**: đánh giá chất lượng output theo tiêu chí (đúng, đủ ý, an toàn).
- **LLM-as-judge**: dùng một LLM khác chấm theo rubric.
- **Shadow traffic**: sao chép traffic thật sang bản mới, so sánh, không trả cho user.
- **Canary**: phát hành cho một tỷ lệ nhỏ user trước.
- **Pact**: công cụ consumer-driven contract (xem câu 067).
- **Tool schema (MCP)**: mô tả tool mà model được phép gọi, gồm JSON Schema của input.

### Vì sao: cơ chế từng bước

1. **Caller không cần "câu trả lời hay", mà cần một JSON có hình dạng cố định**: summary là string tối đa 500 ký tự, labels là mảng 1–5 string, confidence trong khoảng 0..1. Đó là contract cấu trúc; validate mọi response bằng JSON Schema, sai thì không trả cho user mà ghi lỗi.
2. **Vì sao vẫn cần Pact:** phần tất định (routing, auth, mã lỗi, header rate limit) verify được hai chiều; và caller định nghĩa kỳ vọng tối thiểu để model có thêm field cũng không làm gãy.
3. **Vì sao cần eval:** schema đúng không có nghĩa nội dung đúng. Dataset vàng gồm 200–500 mẫu thật đã ẩn danh, cộng rubric ("tóm tắt có nêu đúng ba ý chính không"). Chạy hằng đêm và trước mỗi lần đổi prompt hoặc model. LLM-as-judge phải có rubric rõ và được hiệu chuẩn bằng nhãn người (đo mức đồng thuận).
4. **Ổn định test:** đặt temperature bằng 0 và seed cố định cho test cấu trúc; nhưng vẫn phải có test ở temperature lớn hơn 0 chỉ assert schema, không assert nội dung. Không so khớp chuỗi tuyệt đối cho phần nội dung.
5. **Unit test không gọi mạng:** mock nhà cung cấp bằng WireMock (trả response mẫu của OpenAI hoặc Anthropic), kiểm tra circuit breaker, timeout, fallback và cấu trúc lỗi. Test tích hợp thật chạy hằng đêm và trước release, không chạy mỗi PR để tiết kiệm chi phí.
6. **Quy trình (phần lead):** nhóm AI hoặc platform sở hữu dataset; thay đổi ngưỡng phải có review; eval fail thì chặn release; canary cộng shadow để so sánh trên traffic thật; theo dõi metric sau deploy (tỷ lệ schema không hợp lệ, tỷ lệ escalation); rollback nếu vượt ngưỡng.
7. **Model upgrade coi như đổi dependency lớn:** chạy lại toàn bộ eval, so baseline, cập nhật golden chỉ khi khác biệt là có chủ đích và được review từng case, không "bấm update cho xanh".

~~~seq
title: Ba lớp kiểm thử service AI
actors: Caller | AI Service | Provider Mock | Eval Runner
Caller -> AI Service: request
AI Service -> Provider Mock: gọi model (test)
Provider Mock --> AI Service: response mẫu
AI Service --> Caller: JSON cộng envelope
Eval Runner -> AI Service: chạy golden dataset
Eval Runner --> Eval Runner: chấm rubric, so baseline
~~~

### Code: assert cấu trúc và cổng eval

~~~java
// 1) Contract cấu trúc: assert hình dạng, không assert nội dung
assertThat(response.get("summary")).isInstanceOf(String.class);
assertThat(response.get("summary").asText().length()).isLessThanOrEqualTo(500);
assertThat(response.get("labels")).hasSize().between(1, 5);
assertThat(response.get("confidence").asDouble()).isBetween(0.0, 1.0);

// 2) Eval chạy hằng đêm: điểm trung bình không được tụt quá ngưỡng
double score = evalRunner.run(goldenSet);         // rubric 0..1
assertThat(score).isGreaterThanOrEqualTo(baselineScore - 0.05);
~~~

### Bảng bốn lớp kiểm thử

| Lớp | Chạy khi nào | Kiểm tra gì | Không kiểm tra |
|---|---|---|---|
| Unit cộng mock provider | Mỗi PR | timeout, fallback, schema, mã lỗi | Chất lượng nội dung |
| Contract (Pact) | Mỗi PR | envelope, status, header, tool schema | Nội dung câu trả lời |
| Eval dataset vàng | Hằng đêm, trước release | Điểm chất lượng theo rubric | Tính đúng tuyệt đối |
| Shadow hoặc canary | Khi deploy | So sánh thật, tỷ lệ lỗi | — |

### Pitfall thực tế trên production

- **Assert nội dung làm test flaky.** Cùng prompt, model trả khác nhau, test đỏ lúc xanh lúc đỏ; người ta bắt đầu bấm retry cho tới khi xanh, và test mất giá trị.
- **Judge không hiệu chuẩn.** LLM-as-judge cho điểm cao cho câu dài và hoa mỹ; phải đo mức đồng thuận với nhãn người trước khi tin điểm số.
- **Dataset rò rỉ vào dữ liệu huấn luyện.** Nếu bộ vàng là dữ liệu công khai, model đã thấy nó và điểm eval cao giả. Dùng mẫu nội bộ, cập nhật định kỳ.
- **Overfit golden set.** Tối ưu prompt đến khi đạt điểm cao trên đúng 200 mẫu đó, nhưng gặp mẫu thật thì kém. Phải giữ tập hold-out không bao giờ đưa vào vòng lặp tối ưu.
- **Bỏ qua variance của temperature.** Model ở temperature 0.7 có thể đổi kết quả giữa hai lần chạy; ngưỡng eval phải tính theo nhiều lần chạy hoặc dùng khoảng tin cậy.
- **Chi phí eval hằng đêm.** 500 mẫu qua model lớn mỗi đêm là chi phí thật; cân nhắc tần suất và dùng model nhỏ cho phần lớn, model lớn cho mẫu khó.

### Ví dụ đời thực

Một công ty dùng model của nhà cung cấp qua alias (ví dụ "claude-sonnet" trỏ tới một phiên bản cụ thể). Nhà cung cấp cập nhật phiên bản sau alias mà không thông báo. Schema vẫn hợp lệ, API vẫn 200, nhưng chất lượng tóm tắt giảm: eval hằng đêm báo điểm giảm 6% so với baseline. Nhóm chạy shadow trên 5% traffic thật để xác nhận, thấy tỷ lệ user phải chỉnh sửa tóm tắt tăng từ 8% lên 14%. Họ rollback về model id ghim cứng, thêm cổng eval vào pipeline (fail thì chặn deploy), và quy định mọi lần đổi model phải chạy eval đầy đủ cộng canary. Sau 5 tháng không còn sự cố chất lượng do đổi model; thời gian phát hiện giảm từ vài ngày (user báo) xuống một đêm (eval).

### Trả lời mẫu khi phỏng vấn

"Em tách làm ba lớp, vì LLM không cho so khớp response chính xác. Lớp một là contract cấu trúc: JSON Schema bắt buộc các field, kiểu và enum, validate 100% response, sai thì không trả cho user. Lớp hai là contract hành vi cho phần tất định, dùng Pact giữa caller và AI service cho envelope, status, header, và cho tool schema mà model được phép gọi. Lớp ba là eval chất lượng: dataset vàng từ mẫu thật đã ẩn danh, rubric rõ ràng, chấm tự động, chạy hằng đêm và trước release, với ngưỡng kiểu điểm không được tụt quá 0,05 so với baseline và tỷ lệ đúng schema từ 99,5%. Test cấu trúc thì để temperature 0 và seed cố định; test nội dung thì không assert chuỗi. Unit test dùng WireMock để không gọi mạng. Phần em cho là quan trọng nhất ở mức lead là quy trình: ai sở hữu dataset, ai duyệt ngưỡng, eval fail thì chặn release, và mọi lần đổi model phải chạy eval đầy đủ cộng canary. Lần trước nhà cung cấp đổi model sau alias, eval bắt được giảm 6% sau một đêm, trong khi trước đó phải mất vài ngày mới biết qua phản ánh của user."

> Senior tip: Với hệ thống AI, "test xanh" không có nghĩa là "đúng". Hãy tách bạch ba câu hỏi: response có đúng cấu trúc không (contract), nội dung có đạt chất lượng không (eval), và hành vi trên traffic thật có khác không (shadow). Gộp cả ba vào một test duy nhất là con đường ngắn nhất tới test flaky và release mù quáng.`
  ,
  follow: [
    'Bạn thiết kế bộ eval thế nào để không bị overfit và không rò rỉ vào dữ liệu huấn luyện của model?',
    'Khi điểm eval giảm nhẹ (2–3%) nhưng user không phàn nàn, bạn có chặn release không? Căn cứ nào để quyết định?',
    'Bạn kiểm thử phần tool/function calling của AI service ra sao, khi đầu vào tool do model sinh ra?'
  ],
  tags: ['contract testing', 'eval', 'llm', 'json schema', 'pact', 'canary', 'non-determinism']
},
{
  id: 'microservices-076',
  topic: 'microservices',
  level: 'senior',
  q: 'Sau một lần rebalance, cùng một message bị xử lý hai lần, còn vài message thì biến mất. Giải thích quan hệ giữa thời điểm commit offset và ack mode của Spring Kafka (BATCH, RECORD, MANUAL, MANUAL_IMMEDIATE), auto-commit, và commit khi partition bị thu hồi. Bạn chọn cấu hình nào cho consumer ghi database?',
  a: `**Tóm tắt:** Kafka không "làm mất" message; cái quyết định là **thời điểm commit offset so với thời điểm side effect hoàn tất**. Xử lý xong nhưng chưa commit thì đọc lại, tức là lặp. Commit trước khi xử lý xong thì mất. Spring Kafka mặc định tắt auto-commit và commit theo **ack mode** (mặc định BATCH: commit offset cao nhất của batch sau khi listener trả về). Với consumer ghi DB, tôi dùng @Transactional cộng BATCH (hoặc MANUAL), không bao giờ ack bên trong transaction, và vẫn thêm dedup theo event id, vì at-least-once là bản chất của messaging.

### Hiểu nhanh
Bạn là thủ kho, offset giống như dòng ghi trong sổ "tôi đã xử lý tới phiếu số 100". Nếu bạn ghi sổ **trước** khi nhập hàng rồi ngất, phiếu 100 mất. Nếu bạn nhập hàng xong nhưng chưa ghi sổ rồi ngất, người sau nhập lại phiếu 100, tức là lặp. Không có cách nào vừa ghi sổ vừa nhập hàng "cùng một lúc", vì đó là hai quyển sổ khác nhau; nên phải chọn: ghi sổ sau (at-least-once, có thể lặp) rồi dán nhãn chống lặp.

### Thuật ngữ
- **Offset**: vị trí đọc trong partition. "Đã xử lý tới offset 100" nghĩa là record 99 là record cuối đã xong.
- **Committed offset**: offset đã lưu vào topic nội bộ {{__consumer_offsets}}; consumer mới đọc tiếp từ đó.
- **Position**: vị trí kế tiếp mà consumer sẽ đọc, chưa được commit.
- **Ack**: cách Spring Kafka gọi việc xác nhận "tôi đã xử lý record này"; Kafka client gọi là commit.
- **Rebalance**: chia lại partition cho các consumer trong group; partition bị thu hồi sẽ được đọc lại từ committed offset.
- **Side effect**: thay đổi ra bên ngoài bộ nhớ: ghi DB, gửi email, gọi API.

### Mất và lặp xảy ra ở đâu (từng bước)
1. Consumer poll 500 record (offset 0 tới 499), position = 500.
2. Xử lý record 0 tới k, ghi DB từng record.
3. Container commit offset, ví dụ lên 500, ghi vào {{__consumer_offsets}}.
4. Nếu bước 3 xảy ra **trước** khi DB commit: crash giữa hai bước, DB không có nhưng offset đã tiến, kết quả là **mất**.
5. Nếu DB commit rồi nhưng chưa commit offset: crash, consumer đọc lại, kết quả là **lặp**.

~~~text
crash sau khi ghi DB, trước khi commit offset   -> lặp   (chữa được bằng dedup)
crash sau khi commit offset, trước khi ghi DB   -> mất   (không chữa được)
~~~

Vì sao không có "cùng lúc": DB và {{__consumer_offsets}} là hai hệ thống khác nhau, một transaction DB không bao trùm broker. Kafka có transaction nhưng chỉ đúng cho luồng Kafka sang Kafka (câu 031 và 057); khi đích là DB thì phải chọn at-least-once cộng dedup.

### Ack mode (từng bước)
| Ack mode | Khi nào commit | Crash thì mất? | Crash thì lặp? | Ghi chú |
|---|---|---|---|---|
| BATCH (mặc định) | Sau khi listener trả về, commit offset cao nhất của batch đã xử lý xong | Không, nếu xử lý đồng bộ | Có, cửa sổ bằng cả batch | Throughput tốt |
| RECORD | Sau mỗi record | Không | Có, một record | Nhiều commit, chậm hơn |
| MANUAL | Sau khi listener trả về, chỉ với record đã gọi ack | Không, nếu ack sau side effect | Có | Hợp với @Transactional |
| MANUAL_IMMEDIATE | Ngay khi gọi ack | **Có**, nếu ack trước khi commit DB | Có | Chỉ đúng khi ack là bước cuối cùng |
| COUNT / COUNT_TIME / TIME | Cứ N record hoặc N giây | **Có**, tới N record | Có | Tăng throughput, giảm an toàn |

- Với @Transactional cộng MANUAL_IMMEDIATE, nếu {{ack.acknowledge()}} là câu lệnh cuối **bên trong** method có transaction thì ack chạy trước khi transaction commit; crash giữa hai bước là mất. Đây là lỗi kinh điển.
- MANUAL (không immediate) hoãn commit tới sau khi listener trả về, tức sau khi proxy transaction commit, nên đúng thứ tự mong muốn.
- Batch listener: ném {{BatchListenerFailedException}} kèm index thì container chỉ xử lý lại từ record lỗi và commit các record trước; ném exception thường thì **cả batch** bị xử lý lại.

### Auto-commit
- {{enable.auto.commit=true}} (mặc định của consumer dùng trực tiếp): client tự commit theo {{auto.commit.interval.ms}} (mặc định 5.000 ms) dựa trên **position**, không quan tâm xử lý xong hay chưa.
- Xử lý đồng bộ nhanh hơn 5 giây thì thường vẫn an toàn; nhưng nếu bạn đẩy record sang {{ExecutorService}} rồi return thì container commit ngay, tức là **mất**.
- Spring Boot đặt {{spring.kafka.consumer.enable-auto-commit=false}} mặc định và để container commit theo ack mode. Nếu bạn dùng {{KafkaConsumer}} trực tiếp (không container) thì phải tự commit, và đừng bật auto-commit.

### Commit khi rebalance
1. Partition bị thu hồi, ví dụ khi deploy hoặc khi thêm/bớt pod.
2. Phần đã xử lý nhưng chưa commit sẽ được owner mới đọc lại, tức là lặp.
3. Commit phần đã xử lý trong {{onPartitionsRevoked}} bằng commit **đồng bộ**, hoặc để container commit trước khi thu hồi với {{syncCommits=true}} (mặc định).
4. {{CommitFailedException}}: commit bị từ chối vì group đã sang generation mới sau rebalance. Đây không phải lỗi mạng; đừng retry vô hạn, hãy ghi log và để dedup xử lý phần lặp.

~~~java
@Bean
ConcurrentKafkaListenerContainerFactory<String, String> ledgerFactory(
        ConsumerFactory<String, String> cf, KafkaTemplate<String, String> kafka) {
    var f = new ConcurrentKafkaListenerContainerFactory<String, String>();
    f.setConsumerFactory(cf);
    f.getContainerProperties().setAckMode(AckMode.BATCH);   // commit sau khi listener return = sau khi tx commit
    f.getContainerProperties().setSyncCommits(true);        // commit đồng bộ khi partition bị thu hồi
    f.setCommonErrorHandler(new DefaultErrorHandler(        // retry 2 lần rồi đẩy DLT
            new DeadLetterPublishingRecoverer(kafka), new FixedBackOff(1_000L, 2)));
    return f;
}

@KafkaListener(topics = "payment.captured", groupId = "ledger")
@Transactional                              // side effect commit trước, offset commit sau
public void on(String payload) {
    ledgerRepo.insert(parse(payload));      // ghi DB trong transaction, không ack thủ công
}
~~~

### Bảng trade-off
| Cách commit | Mất | Lặp | Throughput | Khi nào dùng |
|---|---|---|---|---|
| Commit trước khi xử lý | Có | Không | Cao | Gần như không bao giờ, trừ dữ liệu có thể tính lại được |
| Xử lý xong rồi commit | Không | Có | Trung bình | Mặc định cho consumer ghi DB |
| Xử lý xong rồi commit, cộng dedup | Không | Không (exactly-once effect) | Trung bình | Đường tiền, sổ cái, tồn kho |
| Kafka transaction | Không | Không | Thấp | Chỉ khi cả input và output đều là topic Kafka |

### Lỗi hay gặp
1. {{MANUAL_IMMEDIATE}} cộng {{ack()}} trong transaction. Triệu chứng: đối soát thiếu bản ghi. Cách tránh: BATCH hoặc MANUAL, ack sau khi listener trả về.
2. BATCH cộng đẩy record sang executor. Triệu chứng: mất cả batch khi pod chết. Cách tránh: xử lý đồng bộ trong listener, hoặc chờ future xong rồi mới return.
3. Batch listener ném exception thường. Triệu chứng: cả batch bị xử lý lại, side effect lặp. Cách tránh: {{BatchListenerFailedException}} kèm index.
4. Không commit khi bị thu hồi partition, hoặc tắt {{syncCommits}} để "tăng throughput". Triệu chứng: lặp sau mỗi lần deploy. Cách tránh: bật lại và đo.
5. Tăng {{max.poll.records}} mà không đo. Triệu chứng: cửa sổ mất/lặp bằng đúng batch size. Cách tránh: tăng dần và xem metric.

### Ví dụ đời thực
Hệ thống ví điện tử có consumer {{ledger-writer}} ghi sổ cái từ topic {{payment.captured}}: 12 partition, 4 pod, batch 500, ack mode MANUAL_IMMEDIATE, listener có @Transactional và gọi {{ack.acknowledge()}} ở cuối method; {{syncCommits}} bị tắt trong một lần tinh chỉnh "cho nhanh".
Triệu chứng: đối soát cuối ngày phát hiện 0,35% dòng bị ghi hai lần (khoảng 42.000 dòng) và 0,02% giao dịch không có dòng nào (khoảng 2.400), tập trung ở hai pod hay bị deploy nhất.
Điều tra: (1) log có hai lần xử lý cùng {{event_id}} cách nhau 3 tới 8 giây, khớp với nhịp retry và rebalance; (2) metric {{commit_failed_total}} tăng theo mỗi lần deploy; (3) đọc cấu hình thấy ack nằm trong transaction và {{syncCommits=false}}; (4) không có bảng dedup nên DB không tự bảo vệ.
Xử lý: (1) chuyển sang BATCH, giữ @Transactional và bỏ {{ack()}} thủ công; (2) bật {{syncCommits=true}}, giảm batch xuống 100; (3) thêm bảng inbox với khóa chính là {{event_id}}, insert cùng transaction với nghiệp vụ; (4) alert theo {{commit_failed_total}} và {{duplicate_blocked_total}}.
Kết quả sau hai tuần: số dòng trùng trong DB về 0; số event bị dedup chặn 0,02%, đúng như kỳ vọng của at-least-once; số giao dịch thiếu về 0; đối soát khớp 100%; deploy không còn làm lag tăng vọt. Bài học: ack mode và thứ tự commit là ranh giới giữa "mất tiền" và "trùng tiền".

### Trả lời mẫu khi phỏng vấn
"Theo em, mất và lặp là do thời điểm commit offset so với lúc side effect xong. Commit trước khi ghi DB là mất, ghi DB xong chưa commit là lặp. Spring Kafka mặc định tắt auto-commit và commit theo ack mode, mặc định là BATCH: container commit offset cao nhất của batch sau khi listener trả về. Vì vậy khi consumer ghi DB, em để @Transactional và dùng BATCH hoặc MANUAL, tuyệt đối không gọi ack bên trong transaction với MANUAL_IMMEDIATE, vì ack chạy trước commit. Em bật syncCommits để commit đồng bộ khi partition bị thu hồi, và giảm max.poll.records để cửa sổ lặp nhỏ lại. Cuối cùng em vẫn thêm dedup theo event id trong cùng transaction, vì at-least-once luôn có thể lặp khi crash hoặc rebalance. Em đo duplicate_blocked_total và commit_failed_total để biết hệ thống đang chặn bao nhiêu và commit có lỗi không. Nếu chỉ được chọn một thứ để nhớ, em chọn thứ tự: side effect, commit DB, rồi mới commit offset."

> Senior tip: ack và commit không phải chi tiết nhỏ, nó là ranh giới giữa mất tiền và trùng tiền. Hãy viết ra thứ tự: side effect, commit DB, commit offset; rồi test bằng cách kill consumer đúng giữa hai bước cuối.`,
  follow: [
    'Nếu consumer vừa ghi DB vừa gửi email, bạn đặt ranh giới commit ở đâu để email không bị gửi hai lần?',
    'Batch listener và {{BatchListenerFailedException}} khác nhau thế nào khi một record giữa batch bị lỗi?',
    'Tắt {{syncCommits}} để tăng throughput thì rủi ro cụ thể là gì, và bạn đo nó bằng metric nào?'
  ],
  tags: ['Kafka', 'Spring Kafka', 'ack mode', 'offset', 'exactly-once'],
  refs: [
    { type: 'doc', title: 'Kafka documentation: consumer configs', url: 'https://kafka.apache.org/documentation/#consumerconfigs' },
    { type: 'doc', title: 'Spring Kafka reference: receiving messages', url: 'https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages.html' }
  ]
},
{
  id: 'microservices-077',
  topic: 'microservices',
  level: 'senior',
  q: 'Sau một deploy lỗi, 1,2 triệu message nằm trong DLT của ba topic. Bạn thiết kế quy trình replay thế nào để không gây sự cố lần hai: phân loại, quarantine, throttle, idempotency, thứ tự, và đo kết quả?',
  a: `**Tóm tắt:** Replay là đưa message lỗi quay lại luồng xử lý thật, nên phải coi như **một đợt traffic mới**: phân loại trước (lỗi code đã sửa, lỗi dữ liệu, lỗi nghiệp vụ), xác nhận consumer đã idempotent, replay theo lô nhỏ có throttle và theo dõi, giữ đúng key để không phá thứ tự, và đo bằng ba con số: số message vào lại, số thành công, số vào DLT lần hai. Tuyệt đối không replay khi bug chưa sửa (tạo vòng lặp DLT sang replay rồi quay lại DLT) và không replay nhóm có side effect không chống được lặp (email, thanh toán) trước khi đối soát.

### Hiểu nhanh
Kho có 1,2 triệu kiện hàng lỗi. Nếu mở cửa cho tất cả cùng lúc, đội đóng gói (consumer) và bộ phận giao hàng (downstream) sẽ quá tải lần hai. Cách làm đúng: chọn 100 kiện đại diện, chạy thử trên một line, đo tỷ lệ lỗi, rồi tăng dần; kiện nào chắc chắn sẽ lỗi lại thì để riêng (quarantine), không đưa vào line.

### Vì sao replay nguy hiểm (từng bước)
1. Message trong DLT vẫn là message thật: replay là xử lý lại thật, nên ghi DB lần hai, gửi email lần hai, gọi API lần hai.
2. Nếu bug chưa sửa: DLT, replay, lỗi, quay lại DLT. Mỗi vòng tốn CPU, network và làm DLT phình thêm.
3. Nếu replay hết trong một phút: downstream nhận 1,2 triệu request đột ngột, tức là tự tạo một retry storm lần hai.
4. Nếu replay sai thứ tự: state machine lùi, ví dụ PAID bị ghi đè bằng PENDING, số dư sai.
5. Nếu replay thiếu một phần: dữ liệu lệch âm thầm, chỉ phát hiện khi đối soát.

### Quy trình sáu bước
1. **Đóng băng và phân loại** (chưa replay): đếm theo {{kafka_dlt-exception-fqcn}}, theo topic và partition, theo khoảng thời gian. Chia ba nhóm:
   - Nhóm A: lỗi code đã sửa, ví dụ {{JsonMappingException}} do thiếu field.
   - Nhóm B: lỗi dữ liệu thật, payload thiếu field bắt buộc hoặc id không tồn tại; phải sửa dữ liệu hoặc bỏ.
   - Nhóm C: lỗi nghiệp vụ hợp lệ, ví dụ không đủ số dư; không nên có trong DLT, phải kiểm tra vì sao bị retry.
2. **Xác nhận consumer idempotent**: có inbox hoặc dedup theo event id chưa, có kiểm tra state hiện tại chưa. Nếu chưa thì replay sẽ tạo side effect thật; thêm dedup trước, không replay.
3. **Chọn cách replay**:
   - Copy từ DLT sang topic gốc, giữ nguyên key để đúng partition và đúng thứ tự theo key, thêm header {{x-replay-from}} và {{x-replay-batch}}.
   - Không reset offset của consumer group về DLT, trừ khi bạn thực sự muốn consumer đọc DLT như một topic bình thường; cách đó dễ trộn dữ liệu và mất audit.
4. **Throttle theo lô**: 500 tới 1.000 message mỗi phút, dừng khi consumer lag tăng, error rate vượt 1%, hoặc p95 của downstream vượt ngưỡng. Theo dõi cả DLT của chính luồng replay.
5. **Giữ thứ tự theo key**: mỗi key chỉ một worker xử lý; không cho hai worker replay song song cùng key. Nếu buộc phải song song thì chia theo partition và đảm bảo mỗi key nằm ở một worker.
6. **Đo và chốt**: đối chiếu số message vào lại, số thành công, số vào DLT lần hai, số bị dedup chặn; đối chiếu nghiệp vụ (số dư, số đơn); viết runbook và postmortem.

~~~text
DLT 1.200.000
  ├─ nhóm A, lỗi code đã sửa: 780.000 -> replay 500 msg/s
  ├─ nhóm B, payload sai:      320.000 -> quarantine, sửa dữ liệu từng lô
  └─ nhóm C, lỗi nghiệp vụ:    100.000 -> không replay, xử lý bằng tay hoặc CSKH
kết quả: vào lại 780.000 | lỗi lần 2: 1.100 (0,14%) | dedup chặn: 0
~~~

### Tool replay (code)
~~~java
var cProps = new Properties();
cProps.put("bootstrap.servers", "kafka:9092");
cProps.put("group.id", "dlt-replay-" + UUID.randomUUID());  // group riêng: không đụng group thật
cProps.put("enable.auto.commit", "false");
cProps.put("key.deserializer", StringDeserializer.class);
cProps.put("value.deserializer", StringDeserializer.class);  // đọc thô: payload lỗi không deserialize được

var pProps = new Properties();
pProps.put("bootstrap.servers", "kafka:9092");
pProps.put("key.serializer", StringSerializer.class);
pProps.put("value.serializer", StringSerializer.class);

try (var consumer = new KafkaConsumer<String, String>(cProps);
     var producer = new KafkaProducer<>(pProps)) {
    var parts = consumer.partitionsFor("payment.captured.DLT");
    parts.forEach(p -> consumer.assign(List.of(new TopicPartition(p.topic(), p.partition()))));
    consumer.seekToBeginning(consumer.assignment());
    int sent = 0;
    while (true) {
        var batch = consumer.poll(Duration.ofMillis(500));
        if (batch.isEmpty()) break;
        for (var r : batch) {
            var out = new ProducerRecord<>("payment.captured", r.key(), r.value());
            out.headers().add("x-replay-from",
                ("dlt:" + r.partition() + "@" + r.offset()).getBytes(StandardCharsets.UTF_8));
            producer.send(out);                     // cùng key thì cùng partition, giữ thứ tự theo key
            if (++sent % 500 == 0) { producer.flush(); Thread.sleep(1_000); }   // khoảng 500 msg/s
        }
        consumer.commitSync();                      // chỉ commit khi đã gửi, replay lỗi không mất
    }
    producer.flush();
}
~~~

- Dùng {{StringDeserializer}} cho cả key và value vì payload trong DLT có thể là byte hỏng; nếu dùng JsonDeserializer thì lỗi xảy ra ngay ở {{poll()}} và bạn không đọc được gì.
- Group id ngẫu nhiên cộng {{assign}} thủ công: tool không tham gia group của consumer thật nên không gây rebalance.
- {{commitSync}} sau khi gửi: nếu tool chết giữa đường, lần sau chạy lại từ đầu; vì replay idempotent nên an toàn.

### Bảng chọn cách replay
| Cách | Ưu | Nhược |
|---|---|---|
| Copy sang topic gốc | Giữ key và partition, tách audit, đo được | Cần tool, phải throttle |
| Reset offset group về DLT | Không cần code mới | Trộn DLT vào luồng chính, khó audit, dễ lặp |
| Sửa payload rồi đẩy lại | Xử lý được nhóm B | Tốn công chuẩn hoá dữ liệu |
| Quarantine, bỏ | An toàn | Mất dữ liệu nếu bỏ nhầm |

### Lỗi hay gặp
1. Replay khi bug chưa sửa. Triệu chứng: DLT lại tăng sau vài phút. Cách tránh: xác nhận bản sửa đã lên production trước khi replay.
2. Replay toàn bộ cùng lúc. Triệu chứng: downstream quá tải, timeout hàng loạt. Cách tránh: throttle theo lô và dừng khi vượt ngưỡng.
3. Không dedup trước khi replay. Triệu chứng: side effect hai lần. Cách tránh: thêm inbox trước.
4. Replay nhóm C. Triệu chứng: email "không đủ số dư" gửi lại hàng loạt. Cách tránh: nhóm nghiệp vụ không replay.
5. Không gắn header. Triệu chứng: không biết message nào là replay, không đo được. Cách tránh: header cộng metric theo header.
6. Quên rằng DLT có thể chứa message đã xử lý một phần. Triệu chứng: replay gây side effect lần hai. Cách tránh: đối soát với hệ thống đích trước khi replay nhóm có side effect ngoài Kafka.

### Ví dụ đời thực
Payment service có DLT 1,2 triệu message sau hai giờ, do deploy thiếu field {{currency}} gây {{JsonMappingException}}. Phân loại: nhóm A 780.000, nhóm B 320.000 (payload cũ thiếu {{currency}}), nhóm C 100.000 ({{BusinessException}}: không đủ số dư).
Replay nhóm A ở mức 500 message mỗi giây, theo dõi consumer lag, error rate và p95 của downstream: 780.000 chia 500 khoảng 26 phút; lỗi lần hai 1.100 (0,14%, do 1.100 message thật sự thiếu {{currency}}); p95 của email service 180 ms; không có retry storm.
Nhóm B: thêm job chuẩn hoá dữ liệu, suy ra {{currency}} từ merchant rồi replay 320.000 trong 11 phút.
Nhóm C: không replay; đối soát với cổng thanh toán theo {{merchant_reference}}, phát hiện 8% đã được xử lý (side effect đã xảy ra trước khi lỗi), nếu replay mù sẽ trừ tiền hai lần.
Kết quả: sau ba ngày DLT về 0, đối soát khớp 100%, không có sự cố thứ hai; runbook replay một trang được đưa vào wiki và dùng lại cho hai sự cố sau.

### Trả lời mẫu khi phỏng vấn
"Em coi replay là một đợt traffic thật, không phải một câu lệnh. Trước tiên em phân loại DLT theo exception và theo topic: nhóm lỗi code đã sửa, nhóm payload sai, nhóm lỗi nghiệp vụ. Nhóm nghiệp vụ em không replay, vì đó là lỗi hợp lệ. Em xác nhận consumer đã idempotent bằng inbox hoặc dedup theo event id; nếu chưa có thì thêm trước rồi mới replay. Em replay bằng tool riêng: group id ngẫu nhiên, assign thủ công, đọc thô bằng StringDeserializer, giữ nguyên key để đúng partition và thứ tự, gắn header để đo. Em throttle khoảng 500 message mỗi giây và dừng khi lag tăng hoặc error rate vượt một phần trăm. Cuối cùng em đo ba con số: số vào lại, số thành công, số vào DLT lần hai, cộng với đối soát nghiệp vụ. Với nhóm có side effect ngoài Kafka như thanh toán, em đối soát với nhà cung cấp trước khi replay, vì message có thể đã xử lý một phần."

> Senior tip: DLT là kho bằng chứng, không phải hàng đợi để quên. Trước khi replay, hãy trả lời ba câu: bug đã sửa chưa, consumer đã idempotent chưa, và message này xử lý lại có gây side effect thật không.`,
  follow: [
    'Làm sao bạn biết một message trong DLT đã được xử lý một phần, tức side effect đã xảy ra, trước khi lỗi?',
    'Replay nhóm 320.000 payload thiếu field: bạn sửa dữ liệu thế nào mà không phá nghiệp vụ?',
    'Bạn theo dõi sức khoẻ của DLT ra sao để không bao giờ có 1,2 triệu message nằm im?'
  ],
  tags: ['Kafka', 'DLT', 'replay', 'retry', 'incident'],
  refs: [
    { type: 'doc', title: 'Spring Kafka reference: receiving messages', url: 'https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages.html' },
    { type: 'doc', title: 'Kafka documentation', url: 'https://kafka.apache.org/documentation/' }
  ]
},
{
  id: 'microservices-078',
  topic: 'microservices',
  level: 'senior',
  q: 'Order service cần trạng thái và hạn mức của khách hàng để chốt đơn, nhưng customer service hay timeout. Bạn dùng event-carried state transfer để mỗi service giữ bản sao dữ liệu tham chiếu thế nào? Giải thích snapshot cộng delta, version để chống event cũ, rebuild, và xử lý khi dữ liệu bị xoá theo yêu cầu GDPR.',
  a: `**Tóm tắt:** Event-carried state transfer nghĩa là thay vì gọi API hỏi dữ liệu mỗi lần, mỗi service **nghe event và giữ một bản sao cục bộ chỉ đọc** của đúng những field nó cần. Bản sao gồm snapshot ban đầu cộng các event thay đổi (delta), mỗi bản ghi có version để bỏ qua event cũ và event trùng. Đổi lại: dữ liệu có thể cũ vài trăm mili giây, tốn lưu trữ, phải có cách rebuild, và phải xử lý việc xoá dữ liệu theo GDPR.

### Hiểu nhanh
Một nhà hàng có ba bếp. Thay vì mỗi lần nấu lại gọi điện hỏi kho "còn hành không", người kho dán một bảng hàng ở mỗi bếp và chạy sang cập nhật khi có thay đổi. Bếp nấu nhanh, không phụ thuộc điện thoại; nhưng bảng có thể chậm một phút, và nếu bảng ghi sai thì cả bếp nấu sai.

### Vì sao cần (gọi API không đủ)
1. Order gọi customer hai lần mỗi request để lấy {{status}} và {{tier}}; customer deploy hai lần một tuần nên order p99 tăng từ 120 ms lên 900 ms (xem câu 058).
2. Tám nghìn request mỗi giây vào customer DB chỉ để đọc năm field.
3. Dữ liệu tham chiếu đọc nhiều ghi ít, nên nhân bản rẻ hơn gọi liên tục.

### Cơ chế (từng bước)
1. **Chọn đúng field**: chỉ nhân bản field dùng ở đường ghi, ví dụ {{status}}, {{tier}}, {{tax_code}}; không nhân bản cả aggregate.
2. **Snapshot**: khi service mới lên, hoặc theo ngày, đọc một lần qua API rồi ghi vào bảng local kèm {{version}}.
3. **Delta**: nghe {{CustomerUpdated}} có customerId, version và danh sách field thay đổi, rồi upsert có điều kiện version.
4. **Đọc local**: order đọc trong cùng DB, không gọi mạng.
5. **Kiểm tra độ mới**: nếu {{updated_at}} quá hai giây, hoặc version cũ hơn ngưỡng, thì đánh dấu stale và fallback gọi API cho giao dịch nhạy cảm.
6. **Rebuild**: replay từ snapshot cộng event, hoặc đọc lại API; job này phải chạy được khi schema bảng local thay đổi.

### Version và thứ tự (từng bước)
- Kafka chỉ đảm bảo thứ tự trong một partition. Nếu {{CustomerUpdated}} dùng customerId làm key thì thứ tự theo khách hàng được đảm bảo; nếu event đến từ nhiều topic hoặc nhiều producer thì không.
- Upsert có điều kiện {{WHERE version < :new}} bỏ qua event cũ và event trùng, nên at-least-once không gây hại.
- Không dùng {{updated_at}} do producer tự ghi, vì đồng hồ các máy lệch nhau; hãy dùng version do **owner dữ liệu** (customer service) tăng đơn điệu.

~~~java
// customer_copy(customer_id PK, status, tier, tax_code, version BIGINT, updated_at)
@Transactional
public void on(CustomerUpdated e) {
    jdbc.update("""
        INSERT INTO customer_copy (customer_id, status, tier, tax_code, version, updated_at)
        VALUES (?, ?, ?, ?, ?, now())
        ON CONFLICT (customer_id) DO UPDATE SET
            status = excluded.status, tier = excluded.tier, tax_code = excluded.tax_code,
            version = excluded.version, updated_at = now()
        WHERE customer_copy.version < excluded.version""",   // event cũ hoặc trùng: không ghi
        e.customerId(), e.status(), e.tier(), e.taxCode(), e.version());
}
~~~

### Snapshot cộng delta (vì sao cần cả hai)
| Chỉ có | Hậu quả |
|---|---|
| Snapshot | Thiếu thay đổi sau snapshot, dữ liệu đứng yên |
| Delta | Service mới phải replay hàng chục triệu event, khởi động rất chậm |
| Snapshot cộng delta | Khởi động nhanh, dữ liệu theo kịp; snapshot định kỳ giảm thời gian replay |

- Snapshot mỗi ngày cộng delta từ lúc snapshot; lưu {{snapshot_version}} để biết replay từ đâu.
- Khi đổi schema bảng local: đọc snapshot mới rồi replay delta từ {{snapshot_version}}, không cần dừng service.

### Xoá dữ liệu theo GDPR (phần hay bị bỏ)
- Quyền được xoá: customer service xoá dữ liệu, nhưng bản sao ở order service vẫn còn, như vậy là vi phạm.
- Cần event {{CustomerDeleted}} để xoá hoặc ẩn danh bản sao; nếu luật yêu cầu xoá thật thì dùng DELETE, không chỉ đặt {{deleted = true}}.
- Event có thể mất, nên cần job đối soát hằng tuần: lấy danh sách customer còn sống, xoá bản sao mồ côi.
- Snapshot và backup vẫn chứa dữ liệu, nên dùng **crypto-shredding**: mã hoá dữ liệu theo {{customer_id}} và xoá key khi cần, không phải sửa backup.
- Tối thiểu hoá dữ liệu: không đưa PII vào event nếu không cần; chỉ {{customerId}} cộng field nghiệp vụ.

### Bảng trade-off
| Cách | Độ mới | Phụ thuộc uptime | Chi phí | Khi nào |
|---|---|---|---|---|
| Gọi API trực tiếp | Tức thì | Cao | Latency và tải | Giao dịch nhạy cảm, dữ liệu ít đọc |
| Cache cộng TTL | Một tới sáu mươi giây | Trung bình | Thấp | Đọc nhiều, chấp nhận dữ liệu cũ |
| ECST | 0,1 tới 2 giây | Thấp, chỉ phụ thuộc lúc rebuild | Lưu trữ cộng projection | Luồng ghi cần dữ liệu tham chiếu, throughput cao |
| Read model tập trung | 0,1 tới 2 giây | Thấp | Một hệ thống lớn | Dashboard, tìm kiếm |

### Lỗi hay gặp
1. Nhân bản cả aggregate. Triệu chứng: bảng phình, mỗi lần thêm field phải migrate. Cách tránh: chỉ nhân bản field dùng ở đường ghi.
2. Không có version. Triệu chứng: event cũ ghi đè event mới, dữ liệu lùi. Cách tránh: upsert có điều kiện version.
3. Không có snapshot. Triệu chứng: service mới replay hàng tuần, không kịp deploy. Cách tránh: snapshot cộng delta.
4. Không xử lý xoá. Triệu chứng: vi phạm GDPR, dữ liệu chết tồn tại nhiều năm. Cách tránh: event xoá cộng job đối soát.
5. Dùng bản sao cho quyết định tiền mà không kiểm tra độ mới. Triệu chứng: chênh lệch hạn mức. Cách tránh: kiểm tra {{updated_at}} và fallback API.
6. Coi bản sao là nguồn sự thật. Triệu chứng: không ai biết sửa dữ liệu ở đâu. Cách tránh: ghi rõ owner trong runbook.

### Ví dụ đời thực
Order cần {{status}} (ACTIVE hoặc SUSPENDED) và {{tier}} để tính giá. Trước ECST: hai lần gọi customer mỗi request; khi customer deploy, order p99 từ 120 ms lên 900 ms, 3% đơn timeout.
Sau ECST: bảng {{customer_copy}}, snapshot 2,4 triệu khách, mỗi bản ghi 120 byte nên khoảng 300 MB; delta 12.000 event mỗi ngày; p99 của order còn 95 ms; QPS vào customer giảm từ 8.000 xuống 400; projection lag p95 là 380 ms.
Rủi ro: khách bị suspend, bản sao cập nhật sau khoảng 0,4 giây, nên order có thể chốt đơn trong 0,4 giây đó. Với đơn trên 10 triệu, order kiểm tra {{updated_at}} cũ hơn hai giây thì gọi API fallback.
GDPR: 1.800 yêu cầu mỗi năm; thêm event {{CustomerDeleted}} cộng job đối soát hằng tuần; snapshot mã hoá theo {{customer_id}} để xoá key. Kết quả: 0 yêu cầu trễ hạn, 0 bản sao mồ côi sau ba tháng.

### Trả lời mẫu khi phỏng vấn
"Em bắt đầu bằng câu hỏi: order có thực sự cần dữ liệu customer đồng bộ không? Nếu chỉ cần đọc, em dùng cache TTL; nếu cần ở đường ghi và throughput cao, em dùng event-carried state transfer: customer phát event có version, order giữ bảng bản sao chỉ gồm field cần thiết, upsert có điều kiện version để bỏ event cũ và trùng. Service mới khởi động bằng snapshot rồi replay delta từ snapshot version, nên không phải đọc hàng chục triệu event. Em theo dõi projection lag và đánh dấu stale để fallback API cho giao dịch nhạy cảm. Phần em cho là quan trọng nhất là xoá dữ liệu: có event CustomerDeleted, job đối soát xoá bản sao mồ côi, và snapshot mã hoá theo customer để xoá được mà không phải sửa backup. Cuối cùng em ghi rõ trong runbook rằng customer là nguồn sự thật, bản sao chỉ để đọc."

> Senior tip: ECST biến phụ thuộc runtime thành phụ thuộc dữ liệu: rẻ và nhanh, nhưng phải trả bằng độ trễ, lưu trữ và một quy trình rebuild cùng xoá. Đừng nhân bản chỉ vì "cho nhanh"; hãy để số liệu về QPS, p99 và tần suất deploy của service kia quyết định.`,
  follow: [
    'Nếu bản sao bị stale 30 giây trong giờ cao điểm, bạn xử lý thế nào cho đơn hàng giá trị lớn?',
    'Snapshot chứa PII: bạn làm gì để vừa rebuild nhanh vừa xoá được dữ liệu theo GDPR?',
    'Khi schema của bản sao thay đổi, bạn migrate và rebuild ra sao mà không downtime?'
  ],
  tags: ['event-carried state transfer', 'data consistency', 'GDPR', 'Kafka', 'projection']
},
{
  id: 'microservices-079',
  topic: 'microservices',
  level: 'senior',
  q: 'API của bạn có consumer là app mobile: 30% người dùng còn bản hai năm trước và không thể deploy lại app. Bạn versioning và deprecation thế nào để không phá client cũ, và dựa vào số liệu gì để quyết định gỡ một version?',
  a: `**Tóm tắt:** Với client không kiểm soát được, mỗi version là một **hợp đồng phải giữ tới khi không còn ai dùng**: không đổi ý nghĩa hay kiểu của field cũ, chỉ thêm field optional hoặc endpoint mới, và version mới đi đường riêng (path hoặc header). Muốn gỡ version cũ thì phải đo được còn bao nhiêu người dùng thật sự dùng nó (DAU theo version, không phải số request), thông báo trước sáu tới mười hai tháng bằng header Deprecation và Sunset, rồi mới trả 410 Gone.

### Hiểu nhanh
Giống như ổ cắm điện: bạn có thể lắp thêm ổ ba chân (version mới) nhưng không được tự ý đổi chân cắm của ổ hai chân, vì hàng triệu thiết bị cũ đang cắm. Muốn gỡ ổ hai chân, bạn phải biết chính xác còn bao nhiêu nhà đang dùng, tức là đo chứ không đoán.

### Vì sao mobile khác service nội bộ
1. Không thể deploy lại client: version cũ sống một tới ba năm, do review của app store và do người dùng không cập nhật.
2. Không có chính sách N-1 như service nội bộ.
3. Lỗi ở client cũ đồng nghĩa với review một sao và mất user, không sửa được bằng hotfix nhanh.
4. Telemetry phụ thuộc client: bản cũ có thể không gửi header version.

### Chiến lược versioning
| Cách | Ưu | Nhược |
|---|---|---|
| URI /v1, /v2 | Dễ route, dễ đo, dễ cache | Nhân đôi code, link rải rác |
| Header version | URL sạch | Khó test bằng trình duyệt |
| Content negotiation | Đúng tinh thần REST | Tooling kém |
| Chỉ additive, không version | Rẻ nhất, không phá ai | Không đổi được ý nghĩa field |
| Version theo capability, server quyết theo app version | Bật tắt hành vi theo client mà không cần URL mới | Logic phân tán, phải test nhiều tổ hợp |

- Mặc định: **không version, chỉ additive**. Chỉ tạo version mới khi buộc phải phá.
- Khi buộc: version mới ở path riêng, ví dụ {{/v2/orders}}, giữ {{/v1}} nguyên vẹn.

### Nguyên tắc chỉ thêm (từng bước)
1. Thêm field optional; không đổi kiểu, đơn vị hay ý nghĩa field cũ. Đổi giá từ số nguyên sang chuỗi là phá; đổi {{total}} từ gồm thuế sang chưa thuế là phá ngầm.
2. Thêm endpoint mới thay vì đổi endpoint cũ.
3. Enum: thêm giá trị mới là phá với client cũ đã release mà không có {{default}}. Nếu bắt buộc, thêm field mới (ví dụ {{statusV2}}) và giữ {{status}} cũ.
4. Field bắt buộc mới: không được, vì client cũ không gửi. Dùng field optional cộng giá trị mặc định phía server.
5. Chuyển đổi dữ liệu: giữ cả hai trong ít nhất một release, theo thứ tự expand, migrate, contract (câu 014).

### Đo usage (vì sao phải đo)
- Gateway log theo path, {{X-App-Version}}, {{User-Agent}} và status, rồi tạo metric {{api_requests_total}} theo version và endpoint.
- Client cũ không gửi header thì parse {{User-Agent}} (ví dụ MyApp/4.2.1), hoặc suy ra từ app store build nếu có.
- Đo theo **DAU theo version**, tức số người dùng khác nhau, không chỉ số request: một user tạo ra hàng nghìn request.
- Ngưỡng gỡ gợi ý: version dưới 0,5% DAU trong bốn tuần liên tiếp và không có user hoạt động trong 30 ngày; con số cụ thể do business quyết.

### Quy trình sunset (từng bước)
1. Gửi header {{Deprecation}} và {{Sunset}} (RFC 8594, dạng HTTP-date) trên response của version cũ.
2. Thông báo qua email, in-app, changelog và trang developer; công bố ngày gỡ cụ thể.
3. Theo dõi DAU theo version hằng tuần; gia hạn nếu còn nhóm lớn.
4. Sau ngày sunset: trả {{410 Gone}} kèm link hướng dẫn nâng cấp; không trả 404, để client biết nguyên nhân là version.
5. Giữ log để đối soát và hỗ trợ khách hàng.

~~~java
@Component
public class VersionTelemetry implements HandlerInterceptor {
    private final MeterRegistry registry;
    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object h) {
        String v = req.getHeader("X-App-Version");
        if (v == null) v = parseUserAgent(req.getHeader("User-Agent"));   // client cũ không gửi header
        Counter.builder("api.requests").tag("version", v)
               .tag("endpoint", req.getRequestURI()).register(registry).increment();
        if (isSunsetting(v)) {                       // ví dụ app dưới 5.0
            res.setHeader("Deprecation", "true");
            res.setHeader("Sunset", "Wed, 01 Jul 2026 00:00:00 GMT");
        }
        return true;
    }
}
~~~

Interceptor này phải được đăng ký qua WebMvcConfigurer; nó chỉ đọc header và ghi metric, không thay đổi response nghiệp vụ.

### Lỗi hay gặp
1. Đổi ý nghĩa field, tức breaking ngầm. Triệu chứng: client cũ vẫn chạy nhưng hiển thị sai. Cách tránh: thêm field mới, không đổi field cũ.
2. Thêm giá trị enum mới. Triệu chứng: client cũ crash hoặc lỗi deserialize. Cách tránh: field mới cộng enum riêng.
3. Gỡ theo cảm tính vì một user ồn ào. Triệu chứng: mất user và review xấu. Cách tránh: theo DAU và số liệu.
4. Đo theo request thay vì DAU. Triệu chứng: tưởng còn nhiều user nhưng thực tế chỉ vài user gọi nhiều.
5. Không có telemetry cho client cũ. Triệu chứng: không biết còn ai dùng. Cách tránh: parse User-Agent và log ở gateway.
6. Giữ version cũ mãi mãi. Triệu chứng: mỗi version là một code path phải test, vá bảo mật và làm chậm mọi thay đổi. Cách tránh: đặt ngày gỡ và theo dõi.

### Ví dụ đời thực
Một fintech có 2,1 triệu user và 5 version đang sống. Đổi {{GET /accounts/:id/balance}}: thêm {{availableBalanceV2}} là object có amount và currency, giữ {{availableBalance}} là số. Nhưng một thay đổi bị bỏ sót: {{status}} thêm giá trị {{FROZEN_PENDING}}; client 3.x chiếm 18% DAU và không có case này, nên crash khi mở màn hình tài khoản. Crash report tăng bốn lần trong hai giờ. Hotfix app phải qua review ba ngày, nên team fix ở server: filter theo {{X-App-Version}}, client dưới 4.2 không nhận giá trị mới (nhận {{FROZEN}}), client từ 4.2 nhận {{statusV2}}.
Sau đó team dựng dashboard DAU theo version, sunset client dưới 3.0 (0,3% DAU) sau sáu tháng thông báo. Kết quả: crash do API giảm 92%, số version phải maintain từ 5 xuống 2, thời gian phát hành feature nhanh hơn vì không phải test năm tổ hợp.

### Trả lời mẫu khi phỏng vấn
"Với client mobile em không giả định deploy lại được, nên mỗi version là một hợp đồng. Em mặc định chỉ thêm: field optional, endpoint mới, không đổi kiểu và ý nghĩa field cũ; enum mới là breaking với client cũ nên em thêm field mới thay vì mở rộng enum. Khi buộc phải phá, em tạo version ở path riêng và giữ bản cũ. Việc em làm trước tiên là telemetry: gateway log theo path, X-App-Version và User-Agent, rồi dashboard DAU theo version, vì số request không nói lên còn bao nhiêu người dùng thật. Em gửi Deprecation và Sunset, thông báo qua email và in-app trước sáu tháng, theo dõi DAU hằng tuần, rồi mới trả 410 Gone kèm hướng dẫn nâng cấp. Kinh nghiệm của em là một thay đổi enum tưởng nhỏ có thể làm crash 18% user, và khi đó chỉ server mới cứu được vì app store mất vài ngày."

> Senior tip: với client không kiểm soát được, breaking change là lỗi quy trình chứ không phải lỗi kỹ thuật. Không có telemetry theo version cộng DAU và một ngày gỡ cụ thể, bạn sẽ giữ version cũ mãi mãi; mà mỗi version là một khoản lãi kép phải trả mỗi sprint.`,
  follow: [
    'Nếu business yêu cầu đổi ý nghĩa một field đang có, ví dụ total từ gồm thuế thành chưa thuế, bạn làm gì?',
    'Bạn đo DAU theo version thế nào khi client cũ không gửi header version?',
    'Khi nào bạn từ chối tạo version mới và chọn cách khác?'
  ],
  tags: ['API versioning', 'mobile', 'deprecation', 'sunset', 'telemetry'],
  refs: [
    { type: 'doc', title: 'RFC 8594: The Sunset HTTP Header Field', url: 'https://www.rfc-editor.org/rfc/rfc8594' }
  ]
},
{
  id: 'microservices-080',
  topic: 'microservices',
  level: 'lead',
  q: 'Đặt timeout thế nào cho đúng? Vì sao "lấy p99 rồi nhân đôi" hay "mặc định 5 giây cho mọi hop" đều sai, và budget phải chia ra sao giữa HTTP client, HikariCP, JDBC và Kafka? Bạn dựa vào số liệu nào?',
  a: `**Tóm tắt:** Timeout là **quyết định về cái giá của việc chờ**, không phải một hằng số. Tôi đặt theo phân phối latency thật của từng hop (p99 và p99.9), trừ thời gian đã tiêu, rồi chia budget xuống từng tầng: connect, lấy connection từ pool, chờ lock, chạy câu lệnh, đọc response. Quy tắc: timeout của tầng trên phải nhỏ hơn tổng thời gian xấu nhất của tầng dưới, và timeout chỉ có tác dụng khi có giới hạn concurrency (bulkhead); không thì timeout chỉ biến "chậm" thành "lỗi hàng loạt".

### Hiểu nhanh
Bạn nói với shipper "năm phút không tới thì tôi huỷ". Nhưng shipper còn phải xếp hàng ở bãi (lấy connection), chờ đồng nghiệp (lock), rồi mới chạy (query). Nếu bạn chỉ tính từ lúc shipper bắt đầu chạy, bạn sẽ đợi năm phút cộng thời gian xếp hàng. Ngược lại, nếu bạn đặt ba mươi phút, bạn giữ bàn và giữ shipper vô ích.

### Vì sao "p99 nhân đôi" sai
1. p99 là 200 ms nhưng p99.9 là 2 giây: đặt 400 ms thì 0,1% request timeout; ở 10.000 request mỗi giây là 10 request lỗi mỗi giây, đủ để user phàn nàn.
2. Khi hệ thống quá tải, phân phối thay đổi: p99 tăng gấp mười lần, nên timeout cố định không theo được.
3. Timeout phải tính theo **budget còn lại của caller**, không theo latency tuyệt đối của downstream.

### Chọn timeout theo số liệu (từng bước)
1. Đo latency theo hop, theo endpoint, theo percentile (p50, p95, p99, p99.9), theo giờ và theo phiên bản.
2. Xác định SLO từ phía user, ví dụ checkout p99 dưới 800 ms.
3. Chia budget: gateway 100 ms, order 200 ms, payment 300 ms, DB 150 ms; tổng phải nhỏ hơn SLO.
4. Mỗi tầng: timeout bằng min của budget còn lại, p99.9 của dependency nhân hệ số an toàn, và một trần cứng.
5. Sau mỗi lần deploy: đo tỷ lệ timeout, retry và error, rồi tăng hoặc giảm theo dữ liệu.

### Bốn tầng hay bị bỏ sót
| Tầng | Tham số | Mặc định thường gặp | Hậu quả nếu bỏ |
|---|---|---|---|
| Connect | connectTimeout của HTTP client | Nhiều client không đặt | Kẹt ở bước bắt tay TCP |
| Lấy connection | Hikari {{connectionTimeout}} | 30.000 ms | Hàng trăm thread chờ 30 giây |
| Chờ lock | PostgreSQL {{lock_timeout}} | 0, tức vô hạn | Một transaction giữ lock làm cả hệ thống đứng |
| Chạy câu lệnh | {{statement_timeout}}, {{query.timeout}} | 0, tức vô hạn | Query chạy mười phút, giữ connection |
| Đọc response | responseTimeout của client | Nhiều client không đặt | Chờ vô hạn |

- Hikari {{connectionTimeout}} mặc định 30 giây: nếu timeout HTTP là 2 giây mà pool cạn thì request đã bị caller huỷ từ lâu, nhưng thread vẫn chờ 30 giây, làm thread pool cạn trước.
- PostgreSQL {{statement_timeout}} mặc định là 0, tức không giới hạn; nên đặt ở cấp role hoặc session để có một trần an toàn.

### Vì sao timeout không chữa quá tải (Little's law)
- Little's law: {{L = lambda × W}}, tức số request đồng thời bằng tần suất nhân thời gian mỗi request.
- Với 800 request mỗi giây và W bằng 400 ms thì L bằng 320. Pool 50 nghĩa là 270 request xếp hàng; thời gian chờ trung bình là 270 chia 800, khoảng 337 ms.
- Nếu timeout là 200 ms thì **toàn bộ** request xếp hàng timeout, nhưng chúng vẫn giữ connection khi chạy, nên pool vẫn cạn. Timeout biến "chậm" thành "lỗi", không tăng năng lực.
- Muốn tăng năng lực: tăng pool có kiểm soát theo số core của DB, giảm W bằng index và cache, hoặc giảm tải bằng load shedding và trả 429.

~~~text
800 req/s, W = 400 ms   ->  L = 800 x 0,4 = 320 request đồng thời
pool = 50               ->  270 request xếp hàng
thời gian chờ           ->  270 / 800 = 337 ms
timeout 200 ms          ->  request xếp hàng timeout hàng loạt, pool vẫn cạn
~~~

### Cấu hình theo budget
~~~yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 50
      connection-timeout: 250        # ms: chờ lấy connection, mặc định 30 giây
      validation-timeout: 1000
  jpa:
    properties:
      jakarta.persistence.query.timeout: 400   # ms: thời gian chạy truy vấn
# PostgreSQL: đặt trần ở tầng DB, không phụ thuộc ORM
# ALTER ROLE app SET statement_timeout = '800ms';
# ALTER ROLE app SET lock_timeout = '300ms';
~~~

### Bảng trade-off
| Cách đặt timeout | Ưu | Nhược |
|---|---|---|
| Cố định theo cảm tính | Dễ, nhanh | Không theo tải, thường quá dài hoặc quá ngắn |
| p99 nhân đôi | Có cơ sở thống kê | Bỏ đuôi p99.9, không theo budget |
| Theo SLO cộng budget còn lại | Đúng bài toán, fail fast | Cần đo và duy trì theo phiên bản |
| Không timeout | Không bao giờ lỗi timeout | Cạn thread và connection, sập dây chuyền |

### Lỗi hay gặp
1. Chỉ đặt read timeout, quên connect và queue. Triệu chứng: request kẹt trước khi gửi. Cách tránh: đặt đủ bốn tầng.
2. {{connectionTimeout}} 30 giây lớn hơn HTTP timeout 2 giây. Triệu chứng: thread chờ vô ích. Cách tránh: đặt theo budget.
3. {{statement_timeout}} bằng 0. Triệu chứng: query xấu giữ connection. Cách tránh: đặt trần ở DB.
4. Timeout tầng trên dài hơn tầng dưới. Triệu chứng: tầng dưới timeout trước, tầng trên không biết. Cách tránh: giảm dần theo chiều sâu (câu 025).
5. Không có metric timeout theo tầng. Triệu chứng: không biết đặt đúng hay sai. Cách tránh: đo theo từng tham số.
6. Tăng timeout mỗi lần sự cố thay vì sửa nguyên nhân. Triệu chứng: sự cố lặp lại. Cách tránh: tìm thiếu index, pool nhỏ, hoặc lock dài.

### Ví dụ đời thực
Checkout chạy 800 request mỗi giây, SLO p99 là 800 ms. Hikari pool 50, {{connectionTimeout}} mặc định 30 giây, không đặt {{statement_timeout}}, WebClient không đặt response timeout.
Một query khuyến mãi thiếu index làm thời gian từ 20 ms lên 1,8 giây. Connection bị giữ 1,8 giây, nên L bằng 800 nhân 1,8, tức 1.440; 1.390 request xếp hàng, thời gian chờ khoảng 1,7 giây, vượt SLO. Nhưng vì {{connectionTimeout}} là 30 giây, 200 thread Tomcat vẫn chờ connection thay vì fail nhanh, nên pool cạn trong khoảng 15 giây; healthcheck fail, pod restart, cold cache, rồi sập dây chuyền.
Điều tra: {{hikaricp.connections.pending}} bằng 1.390; {{hikaricp.connections.acquire}} p99 bằng 8,2 giây; {{pg_stat_activity}} có 50 connection chạy cùng một query; log không có thông báo {{statement_timeout}}.
Xử lý: thêm index (1,8 giây về 15 ms); {{connectionTimeout}} 250 ms; {{statement_timeout}} 800 ms; WebClient response timeout 600 ms; bulkhead 60 cho khuyến mãi; trả 429 khi pending vượt 80% pool.
Kết quả: p99 checkout còn 620 ms; tỷ lệ timeout 0,15%; không còn pod restart. Khi khuyến mãi chậm lại trong một deploy sau, hệ thống trả 429 trong 300 ms thay vì sập.

### Trả lời mẫu khi phỏng vấn
"Em không đặt timeout theo cảm tính. Em đo latency từng hop theo p99 và p99.9, rồi chia budget từ SLO của user: ví dụ checkout 800 ms thì gateway 100, order 200, payment 300, DB 150. Mỗi tầng em lấy min của budget còn lại, p99.9 của dependency nhân hệ số an toàn và một trần cứng. Em đặt timeout ở cả bốn tầng hay bị bỏ sót: connect, lấy connection từ Hikari, lock và câu lệnh; mặc định connectionTimeout 30 giây là quá dài so với timeout HTTP 2 giây, nên thread vẫn chờ khi caller đã bỏ. Quan trọng nhất, em hiểu timeout không chữa quá tải: theo Little's law, 800 request mỗi giây với thời gian giữ connection 400 ms cần 320 connection đồng thời, pool 50 sẽ xếp hàng 270 request và chờ khoảng 337 ms. Vì vậy em ghép timeout với bulkhead và load shedding, và đo tỷ lệ timeout theo tầng sau mỗi lần đổi."

> Senior tip: timeout là một quyết định kinh doanh: bạn đang đổi bao nhiêu phần trăm lỗi để lấy bao nhiêu latency. Hãy đo theo tầng, đặt nhỏ hơn budget còn lại, và luôn ghép với bulkhead; nếu không, bạn chỉ đổi "chậm" thành "lỗi hàng loạt".`,
  follow: [
    'Bạn chọn maximum-pool-size của Hikari dựa vào số liệu nào, và vì sao pool lớn hơn không luôn nhanh hơn?',
    'Làm sao đo được thời gian chờ lấy connection tách khỏi thời gian chạy câu lệnh?',
    'Khi downstream chậm, bạn thà timeout hay thà trả dữ liệu cũ? Căn cứ nào để quyết?'
  ],
  tags: ['timeout', 'HikariCP', 'little-law', 'SLO', 'bulkhead'],
  refs: [
    { type: 'doc', title: 'HikariCP: configuration knobs', url: 'https://github.com/brettwooldridge/HikariCP' },
    { type: 'doc', title: 'PostgreSQL: client connection defaults', url: 'https://www.postgresql.org/docs/current/runtime-config-client.html' }
  ]
},
{
  id: 'microservices-081',
  topic: 'microservices',
  level: 'lead',
  q: 'Bạn nói hệ thống có exactly-once effect. Làm sao chứng minh điều đó trước khi lên production và sau khi lên? Thiết kế test bơm trùng, test crash giữa transaction, test replay, và những metric nào cho thấy nó đúng?',
  a: `**Tóm tắt:** Exactly-once là tuyên bố về **hành vi hiếm gặp** (crash đúng lúc, retry, rebalance, replay), nên không thể chứng minh bằng vài request may mắn. Phải có bốn lớp: test bơm trùng có chủ đích, test crash đúng điểm giữa side effect và commit, test replay DLT, và reconciliation trên production. Sau khi lên, hai metric quan trọng nhất là **duplicate rate** (số event bị dedup chặn) và **reconciliation diff** (số bản ghi lệch); không có hai số này thì bạn chỉ đang may.

### Hiểu nhanh
Bạn nói "tôi không bao giờ quên khoá cửa". Đứng ở cửa một tuần không chứng minh được gì. Thuyết phục hơn là nhờ người thử mở cửa một trăm lần vào đúng lúc bạn đang cầm chìa khoá, và rút điện thoại của bạn đúng lúc bạn đang bấm nút khoá.

### Vì sao test thường bỏ sót
1. Duplicate thật xảy ra khi pod bị kill giữa transaction, khi rebalance, khi retry, khi replay và khi timeout mạng.
2. Happy path không có crash, không có duplicate, nên luôn xanh.
3. Race chỉ lộ ở đúng interleaving; chạy một nghìn lần có thể vẫn không gặp.
4. Môi trường test khác production: một consumer, một pod, không rebalance.

### Bốn lớp kiểm chứng
| Lớp | Làm gì | Bắt được | Không bắt được |
|---|---|---|---|
| Happy path | Gửi một message, assert một bản ghi | Logic cơ bản | Crash, race |
| Bơm trùng | Gửi cùng event id mười lần | Dedup | Mất do commit trước |
| Crash test | Kill giữa side effect và commit | Mất hoặc lặp khi crash | Lỗi mạng giữa các service |
| Replay test | Đưa message đã xử lý vào DLT rồi replay | Side effect lần hai | Payload thiếu field |
| Reconciliation | So sánh nguồn và đích theo cửa sổ thời gian | Lệch thật trên production | Nguyên nhân gốc |

### Bơm trùng (code)
~~~java
@Test
void duplicateEventsProduceOneLedgerEntry() throws Exception {
    var evt = """
        {"eventId":"e-1","orderId":"o-1","amount":100}""";
    template.send("payment.captured", "o-1", evt);        // lần 1
    template.send("payment.captured", "o-1", evt);        // lần 2: cùng event id
    template.send("payment.captured", "o-1", evt);        // lần 3
    await().atMost(10, TimeUnit.SECONDS)
           .untilAsserted(() -> assertThat(ledgerRepo.countByOrderId("o-1")).isEqualTo(1));
    assertThat(mailOutbox.count()).isZero();              // không gửi email lần hai
}
~~~

### Crash test (code)
~~~java
// Consumer thật; crash = ném lỗi sau khi ghi DB, trước khi container commit offset
AtomicBoolean crash = new AtomicBoolean(true);

@KafkaListener(topics = "payment.captured", groupId = "ledger-it")
@Transactional
public void on(String payload) {
    ledgerRepo.insert(parse(payload));                    // side effect đã xảy ra
    if (crash.get()) throw new IllegalStateException("boom: chưa commit offset");
}
// test: crash=true, gửi 1 message, assert DB có 1 dòng và offset CHƯA commit
//       crash=false, restart container, assert DB vẫn đúng 1 dòng (dedup chặn)
~~~

- Điểm mấu chốt là assert **sau khi restart**, không phải ngay sau exception. Lỗi ngay sau exception chỉ chứng minh transaction rollback, không chứng minh hành vi khi đọc lại.
- Có thể mô phỏng kill thật bằng Testcontainers: chạy consumer trong container, kill container đúng lúc, rồi khởi động lại. Đắt hơn nhưng gần production hơn.

### Replay test (code)
~~~java
@Test
void replayingProcessedEventHasNoSecondEffect() throws Exception {
    var evt = """
        {"eventId":"e-1","orderId":"o-1","amount":100}""";
    template.send("payment.captured", "o-1", evt);
    await().untilAsserted(() -> assertThat(ledgerRepo.countByOrderId("o-1")).isEqualTo(1));
    template.send("payment.captured.DLT", "o-1", evt);    // replay: đưa lại message cũ
    await().pollDelay(3, TimeUnit.SECONDS).atMost(8, TimeUnit.SECONDS)
          .untilAsserted(() -> assertThat(ledgerRepo.countByOrderId("o-1")).isEqualTo(1));
    assertThat(mailOutbox.count()).isZero();
}
~~~

### Metric trên production
| Metric | Ý nghĩa | Ngưỡng gợi ý |
|---|---|---|
| {{duplicate_blocked_total}} | Số event bị dedup chặn | Trên 0 là bình thường; tăng gấp mười là bất thường |
| {{consumer_lag}} theo partition | Đang tụt lại bao nhiêu | Theo SLO, ví dụ dưới 5.000 |
| {{dlt_messages_total}} theo exception | Lỗi không xử lý được | Bằng 0 |
| {{outbox_relay_lag}} | Trễ từ outbox tới publish | p99 dưới 2 giây |
| {{reconciliation_diff}} | Số bản ghi lệch so với nguồn | Bằng 0 |
| {{commit_failed_total}} | Commit offset bị từ chối | Bằng 0 |

- {{duplicate_blocked_total}} lớn hơn 0 là **tốt**: nó chứng minh dedup đang hoạt động. Nếu bằng 0 tuyệt đối trong hệ thống có retry thì hãy kiểm tra xem dedup có chạy không.

### Reconciliation (vì sao cần)
- Test chỉ chứng minh trong môi trường test; production có dữ liệu thật, deploy thật và client thật.
- Job hằng đêm: đếm {{count(*)}}, {{sum(amount)}} và hash theo cửa sổ một giờ ở nguồn (outbox) và đích (ledger), so sánh; lệch thì alert và giữ chi tiết để điều tra.
- Dùng bảng tổng hợp theo giờ thay vì so từng dòng: hai mươi triệu dòng mỗi ngày thì so trực tiếp quá đắt.

### Lỗi hay gặp
1. Chỉ assert "không exception". Triệu chứng: test xanh nhưng vẫn mất dữ liệu. Cách tránh: assert số bản ghi và side effect.
2. Dedup chỉ ở một consumer, consumer khác không có. Triệu chứng: một luồng vẫn lặp. Cách tránh: kiểm tra mọi consumer ghi DB.
3. Inbox bị dọn quá sớm, ví dụ TTL một ngày, trong khi replay sau ba ngày. Triệu chứng: lặp quay lại. Cách tránh: TTL lớn hơn thời gian replay và retention.
4. Event id sinh ở consumer, mỗi lần đọc là một id mới. Triệu chứng: dedup vô dụng. Cách tránh: id do producer sinh và giữ nguyên trong payload.
5. Không đo duplicate rate. Triệu chứng: không biết đang chặn bao nhiêu. Cách tránh: metric cộng dashboard.
6. Test dùng H2 trong khi production dùng PostgreSQL. Triệu chứng: hành vi {{ON CONFLICT}} và isolation khác nhau. Cách tránh: Testcontainers với đúng phiên bản DB.

### Ví dụ đời thực
Ledger chạy 20 triệu giao dịch mỗi ngày. Happy path xanh 100% trong sáu tháng, nhưng production có 0,35% dòng trùng.
Điều tra: thêm {{duplicate_blocked_total}} (đo được 0,35%) và log event id lặp; viết crash test thì lộ bug thứ hai: {{MANUAL_IMMEDIATE}} ack trước commit làm mất 0,02%, tức khoảng 2.400 giao dịch.
Sau khi sửa (BATCH cộng @Transactional cộng dedup) và thêm ba lớp test: số dòng trùng trong DB về 0; số event bị dedup chặn 0,02%; số giao dịch thiếu về 0; {{reconciliation_diff}} bằng 0 trong 60 ngày.
Chi phí: hai ngày viết test, tiết kiệm khoảng 40 giờ xử lý sự cố mỗi năm; bug thứ hai chỉ crash test bắt được, sáu tháng happy path không thấy.

### Trả lời mẫu khi phỏng vấn
"Em không chứng minh exactly-once bằng cách chạy vài request. Em viết bốn lớp test: bơm cùng event id nhiều lần để kiểm tra dedup; crash test ném lỗi sau khi ghi DB nhưng trước khi commit offset, rồi restart và assert sau restart; replay test đưa message cũ vào DLT; và reconciliation so sánh nguồn với đích theo cửa sổ giờ. Trên production em theo dõi duplicate_blocked_total, commit_failed_total, consumer lag và reconciliation_diff. Điểm em muốn nhấn mạnh là duplicate_blocked_total lớn hơn 0 là dấu hiệu tốt, vì nó chứng minh dedup đang chặn; còn reconciliation_diff phải bằng 0. Em cũng kiểm tra event id do producer sinh chứ không phải consumer, và TTL của inbox dài hơn thời gian replay, vì nếu không thì dedup chỉ là hình thức. Lần trước crash test bắt được bug ack trước commit làm mất 0,02% giao dịch, điều mà sáu tháng test happy path không thấy."

> Senior tip: exactly-once là một tuyên bố, không phải một dòng cấu hình. Hãy viết test cố tình làm nó sai: bơm trùng, kill giữa transaction, replay; rồi đo duplicate rate và reconciliation diff trên production. Thiếu hai metric đó, bạn không biết mình đúng hay chỉ đang may.`,
  follow: [
    'Bạn thiết kế crash test thế nào cho consumer chạy trong Kubernetes, tức là kill pod thật?',
    'Reconciliation giữa outbox và ledger: so từng dòng hay tổng hợp theo giờ? Trade-off?',
    'Nếu {{duplicate_blocked_total}} tăng gấp mười lần, bạn nghi ngờ điều gì và kiểm tra ở đâu?'
  ],
  tags: ['exactly-once', 'testing', 'reconciliation', 'Kafka', 'idempotency'],
  refs: [
    { type: 'doc', title: 'Spring Kafka reference: testing applications', url: 'https://docs.spring.io/spring-kafka/reference/testing.html' },
    { type: 'doc', title: 'Testcontainers: Kafka module', url: 'https://java.testcontainers.org/modules/kafka/' }
  ]
},
{
  id: 'microservices-082',
  topic: 'microservices',
  level: 'mid',
  q: 'Consumer Kafka cua ban ghi vao database, nhung pod bi restart giua chuc va cung mot message bi xu ly hai lan. Ban thiet ke bang processed_event va commit offset the nao de khong mat record va khong xu ly lap nghiep vu?',
  a: `**Tom tat:** Kafka dam bao at-least-once: mot message co the duoc giao lai neu consumer bi gian doan truoc khi danh dau da xu ly. De khong xu ly lap nghiep vu, consumer kiem tra id cua message trong bang processed_event trong **cung mot transaction database** voi viec ghi du lieu nghiep vu, roi moi commit offset. Neu id da co thi bo qua, khong lam gi them.

### Thuat ngu
- **Consumer group**: nhom consumer cung group.id chia nhau cac partition cua mot topic Kafka.
- **Offset**: so thu tu cua message trong partition; commit offset nghia la ghi dau "toi da xu ly toi day" de sau restart khong doc lai tu dau.
- **At-least-once**: message duoc xu ly it nhat mot lan, co the bi trung — day la mo hinh thuc te mac dinh cua Kafka.
- **Idempotent consumer**: consumer xu ly cung message nhieu lan van cho ket qua nhu xu ly mot lan.
- **Processed event table**: bang luu id cua moi su kien da xu ly, dung khoa chinh de chan ban trung.
- **Natural key**: khoa tu nhien cua nghiep vu (vi ma don hang) dung de kiem tra trung thay cho bang rieng.
- **TTL**: time-to-live, thời gian sống của bản ghi. Hết TTL thì bản ghi bị xoá để bảng không phình; TTL không phải cơ chế chống lặp.

### Co che hoat dong (tung buoc)
1. Consumer doc message co id M1 tu topic wallet.credit.
2. Mo transaction database: insert vao processed_event(event_id = M1, processed_at = now()). Neu event_id da co (vi pham UNIQUE) -> bo qua, khong xu ly lai.
3. Neu insert thanh cong -> ghi nghiep vu (cong so du vi) trong **cung transaction**.
4. Commit transaction database. Sau do container Kafka moi commit offset cho M1.
5. Neu pod crash giua buoc 3 va commit offset: sau restart, message M1 duoc doc lai, insert processed_event bi trung -> bo qua. Khong mat record va khong cong tien hai lan.

Vi sao cung transaction: neu tach ra, crash giua hai buoc lai sinh ban trung hoac mat record.
Vi sao commit offset sau database: commit truoc thi crash giua lam mat message (at-most-once, khong hop voi nghiep vu tien).
Spring Kafka mac dinh tat auto-commit va commit offset sau khi listener tra ve.

~~~sql
CREATE TABLE processed_event (
    event_id VARCHAR(128) PRIMARY KEY,
    processed_at TIMESTAMP NOT NULL,
    payload_hash VARCHAR(64)
);
CREATE INDEX idx_processed_event_ts ON processed_event(processed_at);
~~~

~~~java
@KafkaListener(topics = "wallet.credit")
@Transactional   // transaction database (JPA/JDBC)
public void onCredit(WalletEvent evt) {
    int inserted = processedEventRepo.insert(evt.eventId(), Instant.now());
    if (inserted == 0) return;            // event_id da co -> bo qua
    walletRepo.addBalance(evt.accountId(), evt.amount()); // cung transaction
}   // commit DB xong, container Kafka moi commit offset
~~~

### Natural key upsert (khong can bang rieng)
Neu nghiep vu da co khoa tu nhien (ma don hang), dung upsert thay cho bang processed_event:

~~~sql
INSERT INTO ledger(entry_id, account_id, amount) VALUES (:id, :acct, :amt)
ON CONFLICT (entry_id) DO NOTHING;   -- MySQL: INSERT IGNORE / ON DUPLICATE KEY UPDATE
~~~

entry_id la idempotency key cua su kien; trung thi khong ghi them.

### TTL dong bang processed_event
Bang nay chi tang, can job dinh ky xoa ban ghi cu (giu 7-30 ngay, lon hon thoi gian replay toi da co the).

### Bang tra doi
| Cach | Uu diem | Nhuan diem |
|---|---|---|
| Bang processed_event | Dung duoc moi truong hop, ro rang | Bang moi phai dong theo TTL |
| Natural key upsert | Khong can bang them | Chi dung khi co khoa tu nhien on dinh |
| Chi commit offset, khong dedup | Don gian | Xu ly lai khi crash -> can nghiep vu idempotent khac |

### Loi hay gap
1. Check-then-insert khong co UNIQUE: hai request song cung cung thay "chua co" va cung xu ly -> trung. Dung UNIQUE constraint cua database.
2. Insert processed_event va ghi nghiep vu o hai transaction khac nhau: crash giua hai transaction van trung. Phai cung @Transactional.
3. Commit offset truoc khi ghi DB: crash lam mat record. Luon commit sau.
4. TTL qua ngan: message bi cham lai (retry vait gio) sau khi key/xoa da het han -> xu ly lai. TTL phai lon hon thoi gian tre toi da.

### Vi du doi thuc
He thong vi dien tu khoang 1.800 su kien wallet.credit moi phut. Sau mot dot deploy lam consumer restart lien trong, dien tai ghi nhan khoang 0,6% don duoc cong tien vao vi hai lan; tien trong vi vuot giao dich ngan hang khoang 11 trieu dong trong 40 phut. Dieu tra: listener cap nhat so du roi moi de container commit offset, va khong co bang kiem tra trung; pod chet giua hai buoc nen message duoc doc lai. Nguyen goc: khong co idempotent consumer. Xu ly: them bang processed_event(event_id PRIMARY KEY), insert event_id va cap nhat so du trong cung @Transactional, event trung thi bo qua. Chi commit offset Kafka sau khi transaction DB commit. Ket qua: sau 48 gio, so dong trung theo event_id = 0; so du vi doi soat voi ngan hang khop 100%.

### Tra loi mau khi phan vien
Kafka theo at-least-once: neu consumer bi gian doan truoc khi commit offset, message se duoc doc lai, nen phai tu chan xu ly lap. Tao bang processed_event voi event_id lam khoa chinh; cung transaction database, insert event_id roi moi ghi nghiep vu, event trung thi bo qua. Chi commit offset Kafka sau khi transaction DB commit, vi commit truoc ghi DB co the mat record. Neu nghiep vu da co khoa tu nhien nhu ma don hang, dung upsert ON CONFLICT DO NOTHING thay cho bang rieng. Bang processed_event dong theo TTL 7-30 ngay. Kinh nghiem: UNIQUE constraint bat buoc — kiem tra roi insert khong du khi nhieu request cung luc.

> Senior tip: theo doi so ban ghi bi chan bang processed_event moi phut. Con so bang 0 khong co nghia he thong hoan hoa, co the nghia la ban chua bat retry nen chua gian gap ban trung nao.`,
  follow: [
    'Lam sao biet bang processed_event da bi qua lon va can job dong?',
    'Side effect ngoai database (goi API thu ba) khong ho tro idempotency, ban lam gi?',
    'Offset commit truoc hay sau khi xu ly? Tung lua chon danh doi gi?'
  ],
  tags: ['Kafka', 'idempotent consumer', 'processed event', 'offset commit']
},
{
  id: 'microservices-083',
  topic: 'microservices',
  level: 'senior',
  q: 'Topic Kafka co nhieu partition, nhung business yeu cau moi event cua cung mot don hang phai duoc xu ly dung thu tu. Ban thiet ke producer va consumer the nao, va thu tu co bi hong o dau?',
  a: `**Tom tat:** Kafka chi dam bao thu tu trong mot partition. Chon key la id cua aggregate (orderId) de moi event cua cung mot don vao cung partition (hash key chia lay du so partition). Thu tu co the bi hong khi: key null, tang so partition, retry cua producer khong idempotent, hoac event thuoc partition khac nhung nghiep vu can thu tu toan cuc (thi chi co mot partition, trade-off throughput).

### Thuat ngu
- **Partition**: mot nhanh log co thu tu trong topic Kafka.
- **Offset**: so thu tu message trong partition, tang dan.
- **Partition key**: khoa producer dung de chon partition (murmur2 hash cua key chia lay du so partition).
- **Sticky partitioner**: khi message khong co key, producer gan cac message lien tiep vao cung partition cho den khi batch lai, khong dam bao thu tu theo nghiep vu.
- **Idempotent producer**: producer gan PID va so thu tu cho moi message de broker loai ban trung do retry (Kafka 3.x bat mac dinh enable.idempotence=true; tu Kafka 0.11 tro len co the bat thu cong).
- **max.in.flight.requests.per.connection**: so request chua nhan phan hoi toi da tren mot ket noi producer.
- **Consumer group**: trong mot nhom, moi partition chi thuoc mot consumer, giu thu tu xu ly tren partition do.

### Co che (tung buoc)
1. Producer gui event voi key = orderId (bytes). Broker tinh hash(key) % numPartitions -> moi event cua cung mot don luon vao cung partition.
2. Trong partition do, offset tang dan theo thu tu commit; consumer cua nhom lay theo thu tu offset.
3. Neu producer gui that bai va retry: idempotent producer (PID + sequence number) + acks=all + max.in.flight.requests.per.connection <= 5 giup broker loai ban trung va giu thu tu giua cac lan retry tren cung mot ket noi.
4. Consumer xu ly message theo thu tu offset cua partition ma no phu trach.

~~~java
// Producer: cung orderId => cung partition => thu tu duoc giu
kafkaTemplate.send("order.events", order.getId(), order);   // key = orderId

@KafkaListener(topics = "order.events", groupId = "shipping")
public void on(OrderEvent evt) {
    // Moi partition chi thuoc mot consumer trong nhom, xu ly theo thu tu offset
    shippingService.handle(evt);
}
~~~

### Thu tu bi hong (va xu ly)
| Nguyen nhan | Vi du | Xu ly |
|---|---|---|
| Key null | event khong co orderId | Sticky partitioner gan ngau nen -> thu tu mat. Luon co key la id aggregate. |
| Tang so partition | tu 6 len 12 partition | Hash thay doi, event moi cua cung don co the vao partition khac trong khi event cua chua xu ly xong -> thu tu ly khai. Du partition tu dau; neu phai tang, chuyen dan topic moi hoac doi xu ly xong partition cu. |
| Producer retry khong idempotent | timeout, gui lai | Co the ban trung hoac thay doi thu tu. Bat enable.idempotence=true, acks=all, max.in.flight <= 5. |
| Can thu tu toan cuc | tat ca don tren he thong | Phai dung mot partition -> toan bo topic qua mot consumer, throughput bi han che cheo. Tran neu co the. |

### Pattern sequence number + reorder buffer (khi khong the dung mot partition)
Neu nghiep vu bat buoc thu tu toan cuc nhung can nhieu partition (vi event tu nhieu nguon), producer gan them sequenceNumber vao payload; consumer giu buffer nho, chi xu ly event co so tiep theo, cac event khac cho trong buffer co thoi han. Trade-off: them do tre va bo nho, chi dung khi thuc su can.

### Vi du doi thuc
He thong van chuyen co topic order.events 6 partition, key = orderId. Nam 2023, team tang partition len 12 de tang throughput. Trieu chung: khach hang nhan email "don hang da huy" truoc email "don hang da tao" (Cancelled truoc Created cho cung mot don). Dieu tra: event Created cua don 9998 vao partition 2 truoc khi tang, event Cancelled sau khi tang roi vao partition 5; hai partition duoc hai consumer khac xu ly song song -> thu tu nghiep vu bi dao. Nguyen goc: doi so partition lam thay doi bam key -> partition. Xu ly: quay ve 6 partition (da du cho throughput 1.200 event/giay) va them kiem thu tu dong: gui hai event cung key lien tiep, assert consumer xu ly dung thu tu. Ket qua: khong con khach hang nhan thong bao sai thu tu.

### Tra loi mau khi phan vien
Toi chon key la id cua aggregate (vi du orderId) de Kafka gom moi event cua cung mot don vao mot partition, vi thu tu chi duoc dam bao trong mot partition. Trong consumer group moi partition chi thuoc mot consumer, nen xu ly theo thu tu offset la tu nhien. Toi luu note ba cho thu tu de hong: key null, tang so partition lam doi bang bam key->partition, va retry producer khong idempotent; nen bat enable.idempotence, acks=all va max.in.flight <= 5. Neu thuc su can thu tu toan cuc, duy nhat la mot partition, nhung day la nut that throughput, nen tran va dung sequence number trong payload neu business bat buoc. Kinh nghiem: du partition tu dau, khong tang partition cua topic da co thu tu theo key.

> Senior tip: mot partition xu ly duoc khoang chuc ngang den tram nghien event moi giay tuong theo kich thuoc ban; khong tao 100 partition cho topic chi co kiem tram event moi ngay, moi partition la mot tap tin log va nhieu partition lam tang xu ly cua broker va consumer rebalance.`,
  follow: [
    'Tai sao tang so partition lai thay doi bam key? Ban xu ly ra sao?',
    'Producer gui cung key nhung consumer van nhan sai thu tu, co the o dau?',
    'Khi nao chap nhan dung mot partition de co thu tu toan cuc?'
  ],
  tags: ['Kafka', 'partition', 'ordering', 'producer']
},
{
  id: 'microservices-084',
  topic: 'microservices',
  level: 'senior',
  q: 'Listener Spring Kafka that bai vi database downstream bi downturn vait phut. Ban thiet ke retry topic va dead letter topic the nao de message khong mat, khong chan partition, va sau khi khoi phuc thi xu ly lai dung?',
  a: `**Tom tat:** Loi tam thoi (DB down, timeout) thi message duoc day sang retry topic, doi mot khoang thi gui lai topic goc; sau N lan van that bai thi chuyen sang dead letter topic (DLT) kem metadata loi. Nhung vay partition goc khong bi do bo boi mot message loi, va doc ta co the replay DLT sau khi sua loi. Consumer van phai idempotent vi retry topic co the gui cung message nhieu lan.

### Thuat ngu
- **Retry topic**: topic rieng (<ten goc>.RETRY) chua message that bai, kem header dem so lan thu va ly do loi; listener rieng doc va gui lai sau do tre.
- **Dead letter topic / DLT**: topic chua message khong xu ly duoc sau het so lan retry, kem header exception, stacktrace, topic/partition/offset goc.
- **DeadLetterPublishingRecoverer**: thanh phan Spring Kafka publish record loi sang DLT sau het retry.
- **Fixed-delay listener**: listener doc retry topic voi do tre giua cac lan xu ly.
- **Header**: metadata kem message Kafka (cap khoa-gia tri), dung de luu so lan retry, ten exception, topic goc.
- **Idempotent consumer**: xu ly cung message nhieu lan van cho ket qua nhu mot lan (bat buoc trong mo hinh nay).

### Co che (tung buoc)
1. Listener goc doc message tu order.events, xu ly that bai (vi ném SQLException do DB down).
2. DefaultErrorHandler retry co han (vi du 3 lan, cach nhau 1s). Van loi -> DeadLetterPublishingRecoverer publish message sang order.events.RETRY kem header x-retry-count, x-exception-class, original-topic, failed-at.
3. Listener retry doc order.events.RETRY, doi backoff tang dan (2s, 4s, 8s...), roi gui lai ve order.events (hoac xu ly truc tiep).
4. Neu van that bai sau so lan toi da -> publish sang order.events.DLT kiem toan bo metadata loi, roi commit offset de partition goc tuc tuc.
5. Sau DB khoi phuc, doc ta doc DLT, sua du lieu/code, roi replay message tu DLT ve topic goc. Consumer idempotent dam bao khong xu ly trung.

~~~java
// Cau hinh loi tam thoi: retry vait lan roi sang DLT
var recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
    (rec, ex) -> new TopicPartition(rec.topic() + ".DLT", rec.partition()));
var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 3L));
handler.addNotRetryableExceptions(DeserializationException.class); // sai format -> DLT ngay
factory.setCommonErrorHandler(handler);

// Retry topic pattern (yeu tuong): listener that bai tu dong publish vao retry topic
@KafkaListener(topics = "order.events", groupId = "shipping")
public void on(OrderEvent evt, Acknowledgment ack) {
    try {
        shippingService.handle(evt);
        ack.acknowledge();
    } catch (TransientException e) {
        // publish sang retry topic kem header dem so retry
        kafkaTemplate.send("order.events.RETRY", evt.getOrderId(), evt,
            headers -> headers.header("x-retry-count", ...).header("x-exception", e.getClass().getName()));
        ack.acknowledge();   // commit offset origin, partition khong bi do bo
    }
}
~~~

Code tren la yeu tuong; production nen dung Spring Retry Topic hoac DeadLetterPublishingRecoverer da co san thay cho viet tay.

### Bang tra doi
| Cach | Uu diem | Nhuan diem |
|---|---|---|
| Blocking retry (DefaultErrorHandler) | Don gian, giu thu tu | Thread listener bi cho, partition do bo khi loi lau |
| Retry topic + fixed-delay | Partition goc khong bi do bo, retry nhieu tang | Them topic, do tre, consumer phai idempotent |
| DLT chi, khong retry | Partition khong bi do bo | Message loi bi mat neu khong co quy trinh replay |

### Loi hay gap
1. Consumer khong idempotent: retry topic gui lai message da xu ly -> tien duoc cong hai luon. Luon dedup theo event_id.
2. Retry vo cung: khong gioi han so lan -> message loi cuon quay partition khac. Gioi han so lan roi sang DLT.
3. Loi deserialize (sai schema): retry vo ich, phai DLT ngay qua addNotRetryableExceptions(DeserializationException.class).
4. DLT khong ai xem: DLT tich tram trieu message, khong ai replay. Dat alert theo so message vao DLT.

### Vi du doi thuc
He thong don hang topic order.events, listener ghi vao PostgreSQL. Nam 2023, trong khoang 10 phut DB bao tri, listener nem SQLException lien tuc. Neu khong co retry topic, 6 partition cua topic bi do bo, consumer lag tang tu 0 len 800.000 message. Xu ly: listener publish that bai sang order.events.RETRY kem header x-retry-count, listener retry doc sau backoff 2s/4s/8s, sau 3 lan van loi -> order.events.DLT. Ket qua: partition goc tuc tuc xu ly cac event khac, lag chi tang nhe; sau DB tro lai, doc ta replay 12.000 message trong DLT va xu ly xong trong 20 phut. Su kien trong DLT kem header exception giup doc ta biet chinh xac DB down hay du lieu sai.

### Tra loi mau khi phan vien
Voi loi tam thoi nhu database downtime, toi khong de listener cho nhung day message sang retry topic kem header dem so lan va ly do loi. Sau backoff tang dan, message duoc gui lai; neu het so lan van loi, chuyen sang dead letter topic kem metadata exception, roi commit offset de partition khong bi do bo. Sau khoi phuc, toi replay DLT sau khi sua loi. Mo hinh nay bat buoc consumer idempotent vi retry topic co the gui lai message da xu ly. Loi deserialize (sai schema) toi dua vao DLT ngay, khong retry. Kinh nghiem: luon co alert tren so message vao DLT, DLT khong duoc bo quon.

> Senior tip: DLT khong la thung rac. Dat alarm theo so message vao DLT va co quy trinh replay sau moi lan sua loi, nguoc lai DLT se tro thanh kho luu cua cac loi da quang mat.`,
  follow: [
    'Sai phan biet retry topic voi DefaultErrorHandler blocking retry o dau?',
    'Header x-retry-count luu gi va tai sao can no?',
    'DeserializationException co the retry duoc khong, tai sao?'
  ],
  tags: ['Kafka', 'Spring Kafka', 'retry topic', 'DLT']
},
{
  id: 'microservices-085',
  topic: 'microservices',
  level: 'lead',
  q: 'Team ban gui event dang JSON len Kafka khong dung Schema Registry. Mot ngay consumer cu bat dau loi sau khi producer them field moi. Ban thiet ke quy trinh thay doi schema JSON the nao cho an toan, backward compatible, va nhieu team deploy doc lap?',
  a: `**Tom tat:** Khong co Schema Registry thi contract nam trong chinh payload: moi event mang truong schemaVersion, consumer la "tolerant reader" (bo qua field la), producer chi them field co gia tri mac dinh, khong doi nghia field cu, doi don vi phai tao field moi, va xoa field phai qua giai giai deprecate. Moi thay doi di kem contract test voi mau payload cu va moi, va consumer nan truoc producer.

### Thuat ngu
- **Schema evolution**: thay doi cau truc su kien theo thoi gian khong lam hong consumer dang chay.
- **Backward compatible**: consumer cu van doc duoc event do producer moi sinh ra (khong can sua consumer).
- **Tolerant reader**: consumer chi doc field minh can va bo qua field khong biet, thay loi khi gap field la.
- **schemaVersion**: truong so trong payload ghi ro ban event tuan theo phien ban cau truc nao.
- **Breaking change**: doi ten field, doi kieu, doi nghia, bo field, doi dinh dang ngay/so tien — lam consumer cu loi.
- **Deprecate**: danh dau field cu "khong khuyen dung" truoc khi xoa hoan toan, doi moi consumer ngung dung.
- **Contract test**: kiem thu tu dong voi mau payload cu va moi de phat hien breaking change truoc deploy.

### Cac qui tac thay doi JSON (tung buoc)
1. Them truong moi: luon co gia tri mac dinh (null hoac gia tri hop le), consumer cu bo qua vi tolerant reader.
2. Khong doi ten truong: neu can doi ten, them truong moi, gui cung hai trong thoi gian chuyen tien, roi xoa truong cu.
3. Khong doi nghia: so tien tu USD sang cent phai la truong moi (amountCents), khong reinterpret truong cu.
4. Xoa field: danh dau deprecated, doc moi consumer xac nhan khong dung nua, roi moi xoa trong phien ban schema tiep theo.
5. Moi event co truong schemaVersion de consumer biet ap dung logic doc nao, dac biet khi replay event cu.

~~~java
// Consumer doc event, bo qua field khong biet (tolerant reader)
@KafkaListener(topics = "payment.events")
public void on(PaymentEvent evt) {
    process(evt.getOrderId(), evt.getAmount());   // chi dung truong minh can
    // evt.getSchemaVersion() dung de chon logic neu cau truc da thay doi
}
~~~

Spring Boot cau hinh Jackson tat FAIL_ON_UNKNOWN_PROPERTIES mac dinh nen them truong la an toan; nhung doi "2024-05-01" sang epoch millis la breaking ngam.

### Khi nao dung Schema Registry/Avro
JSON khong dung registry phu hop team nho, it thay doi. Nhieu team, consumer strongly-typed (Java/C++), can kiem tra tu dong compatibility truoc producer deploy -> dung Schema Registry + Avro (BACKWARD_TRANSITIVE hoac FULL_TRANSITIVE, xem cau khac). Registry chan dang ky schema breaking tren CI.

### Contract test
Voi moi thay doi, viet test serialize mau payload cu va moi, deserialize bang consumer cu va moi, assert khong loi va field quan trong giu gia tri. Test chay trong CI cua ca producer va consumer.

### Bang tra doi
| Cach | Uu diem | Nhuan diem |
|---|---|---|
| JSON + schemaVersion + tolerant reader | Don gian, khong can he thong them | Khong chan tu dong breaking change tren CI |
| Schema Registry + Avro | Kiem tra compatibility tu dong, nhieu team deploy doc lap | Them he thong phai van hanh, consumer phai tai schema |

### Loi hay gap
1. Consumer deserialize chat (FAIL_ON_UNKNOWN_PROPERTIES bat hoac enum chat): producer them field la consumer loi. Dung tolerant reader, enum co gia tri UNKNOWN.
2. Doi dinh dang ngay hay so tien: schema "khong doi" kieu nhung consumer parse loi. Contract test phai kiem dinh dang.
3. Xoa field ma consumer cu con can: break ngay. Xoa phai qua deprecate.
4. Khong co schemaVersion: consumer khong biet event cu hay moi khi replay, de xu ly sai.

### Vi du doi thuc
He thong thanh toan gui su kien payment.captured dang JSON. Nam 2023, producer them field discountCode va cung luc doi field amount tu USD sang cent (van kieu so). Consumer cu (team khach hang, deploy doc lap) bat dau hien thi so tien sai 100 lan va mot so truong deserialize loi. Dieu tra: khong co schemaVersion, khong co contract test, consumer cu khong dung tolerant reader. Nguyen goc: doi nghia field khong tao field moi, va khong co co che kiem tra compatibility. Xu ly: rollback field amount, them truong moi amountCents, deprecate amount, them schemaVersion: 2, consumer moi doc amountCents, consumer cu van dung amount trong khoang chuyen tien, contract test cho mau cu va moi trong CI. Ket qua: 0 loi deserialize sau 2 tuan, 2 PR bi CI chan do vi pham qui tac.

### Tra loi mau khi phan vien
Khong co Schema Registry thi toi tu quyet contract trong payload: moi event co schemaVersion, consumer la tolerant reader chi doc field minh can. Producer chi duoc them field co gia tri mac dinh; doi ten, doi kieu, doi don vi (vi USD sang cent) phai tao field moi, khong reinterpret truong cu; xoa field phai qua deprecate. Moi thay doi di kem contract test voi mau payload cu va moi trong CI. Neu co nhieu team va consumer strongly-typed, toi len Schema Registry + Avro voi che do BACKWARD_TRANSITIVE. Kinh nghiem: phan lon su co schema den tu doi dinh dang ngay/so tien, khong phai them field.

> Senior tip: schemaVersion trong payload giup consumer chon logic doc khi replay event cu hai ba nam sau — them ngay tu ban event dau tien, khong cho den khi can.`,
  follow: [
    'Tang schemaVersion co thay doi gi nhan vat neu co Schema Registry?',
    'Doi don vi tien te nhung giu nguyen kieu so co the loi nhat o dau?',
    'Consumer cu bi loi voi field moi, sua o consumer hay producer?'
  ],
  tags: ['Kafka', 'schema evolution', 'JSON', 'backward compatibility']
},
{
  id: 'microservices-086',
  topic: 'microservices',
  level: 'senior',
  q: 'Ban muon service ghi database roi phat event len Kafka khong mat event. So sanh Transactional Outbox chay poll bang outbox va CDC qua Debezium, va chon cai nao?',
  a: `**Tom tat:** Transactional Outbox ghi business row va dong event vao bang outbox trong cung transaction DB, roi mot trinh gui rieng (polling relay hoac CDC nhu Debezium) day event ra Kafka. Neu khong dung outbox va goi Kafka sau commit DB, crash giua hai buoc se mat event hoac phat event "ao" (du lieu khong ton tai nhung event da co) — day la dual-write problem. CDC doc transaction log cua DB (WAL PostgreSQL / binlog MySQL) nen khong them tai query va khong phai thay doi code domain; polling relay don gian hon nhung query bang lien thuoc. Chon CDC khi khong muon van hanh them job query lien thuoc va co the van hanh Kafka Connect; chon polling khi team nho, khong muon them he thong.

### Thuat ngu
- **Dual write**: ghi vao hai he thong doc lap (DB va Kafka broker) khong co transaction chung.
- **Outbox table**: bang trong cung DB nghiep vu chua su kien cho gui.
- **Polling relay**: job dinh ky doc bang outbox (SELECT ... FOR UPDATE SKIP LOCKED), day len Kafka, roi danh dau da gui. Do tre khoang 100ms-1s.
- **CDC (Change Data Capture)**: bat thay doi du lieu bang cach doc log cua DB, khong phai query bang.
- **WAL / binlog**: nhat ky ghi truoc cua PostgreSQL / nhat ky nhi phan cua MySQL, moi thay doi deu duoc ghi vao day truoc.
- **Debezium**: bo CDC connector chay tren Kafka Connect, doc WAL/binlog va publish thanh message Kafka.
- **Replication slot**: dau trang cua PostgreSQL ghi nho consumer logical replication da doc toi dau.
- **Kafka Connect**: framework chay connector (nguon/destination), luu offset cua connector vao topic noi bo.
- **Outbox Event Router**: SMT cua Debezium bien dong outbox thanh record Kafka, chon topic theo loai aggregate, dat Kafka key = aggregate ID.
- **Snapshot lan dau**: khi Debezium khoi dau lan dau, no doc toan bo bang hien tai de consumer khong bo lot du lieu da co.

### Co che outbox (tung buoc)
1. API gui don hang: trong mot transaction, insert bang orders va insert dong outbox (event_id, aggregate_type, aggregate_id, type, payload). Ca hai cung commit hoac cung rollback -> khong con dual write.
2. Trinh gui doc outbox: (a) Polling: job SELECT ... FROM outbox WHERE sent = false FOR UPDATE SKIP LOCKED LIMIT 100 de nhieu instance khong lay trung dong, day len Kafka, roi cap nhat sent = true (hoac xoa dong). Do tre khoang 100ms-1s. (b) CDC Debezium: doc WAL qua replication slot, khong them tai query, do tre thap, Outbox Event Router chon topic va key = aggregate_id.
3. Gui xong Kafka moi danh dau da gui (polling) hoac luu offset connector (CDC). Neu crash giua gui va danh dau -> lan sau gui lai, tuc la trung chung khong mat; consumer phai idempotent.
4. Kafka key = aggregate_id de moi event cua cung mot don vao cung partition, giu thu tu.

~~~java
@Transactional
public void placeOrder(OrderCmd cmd) {
    Order agg = Order.create(cmd);
    orderRepo.save(agg);
    outboxRepo.save(OutboxEvent.of("Order", agg.getId(), "order.created", toJson(agg)));
    // commit: cung don hang va cung dong outbox cung co, hoac khong dong nao
}
~~~

~~~sql
CREATE TABLE outbox (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(128) NOT NULL,
    type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL
);
-- Outbox Event Router doc cot aggregate_type de chon topic, aggregate_id lam Kafka key
~~~

### Outbox event la contract on dinh
Khong nen serialize truc tiep entity/domain class vao payload (thay doi code domain lam hong event cu). Dung DTO event rieng, co truong schemaVersion, va giu field trong thoi gian dai. Consumer khong nen map truc tiep event vao entity cua minh.

### Bang mot ho nhieu bang outbox
| Cach | Uu diem | Nhuan diem |
|---|---|---|
| Mot bang outbox chung | Quan ly don, job dong mot noi | Tat ca event cung luong, cot type phan loai |
| Bang outbox moi aggregate | Ro rang theo aggregate, dong rieng | Nhieu bang phai quan ly |

### Khi chon polling vs CDC
- **Polling relay**: team nho, khong muon cai Kafka Connect, chap nhan duoc do tre 100ms-1s va tai query them cho DB.
- **CDC Debezium**: khong them tai query DB, do tre thap, khong doi code domain, nhung phai van hanh Kafka Connect va theo doi replication slot (slot bi bo roi lau lam WAL phin, dia DB day).

### Loi hay gap
1. Outbox phin to: hang tram trieu dong, polling chay cham. Dong dong da gui theo TTL 7-30 ngay; voi CDC co the xoa ngay trong cung transaction vi Debezium van doc su kien INSERT tu WAL.
2. Replication slot bi bo roi: connector dung lau, PostgreSQL giu WAL khong xoa duoc, dia day. Dat alert theo lag cua slot va gioi han max_slot_wal_keep_size.
3. Consumer khong idempotent: connector restart gui lai event, tien duoc cong hai lan. Consumer dedup theo event_id trong cung transaction DB (xem cau idempotent consumer).
4. Them cot outbox khong cap nhat router: header/field moi khong xuat hien o Kafka. Viet integration test kiem tra mapping sau moi thay doi.
5. Payload chua du lieu nhat cam khong can thiet: outbox la contract ra ngoai, khong rot toan bo entity.

### Vi du doi thuc
He thong thuong mai dien tu 50 dev, Order Service ghi Postgre va phat su kien don hang len Kafka topic order.events. Nam 2023, deploy moi them field discountId vao Order aggregate, lap trinh vien viet orderRepo.save(order); kafkaTemplate.send(...).get();. Ket qua: 1% request crash giua hai buoc, event mat; 0,5% nguoc lai, send thanh cong nhung transaction bao ngoai rollback -> event ao (consumer nhan don khong ton tai trong DB). Trieu chung: dashboard doanh so thieu 1,5% don, customer service khong tim thay don. Dieu tra: log thay KafkaTimeoutException; audit log thay don co nhung event khong co. Nguyen goc: dual-write problem. Xu ly: refactor dung Transactional Outbox, ghi don va dong outbox trong cung @Transactional, Debezium Outbox Event Router doc WAL publish order.events voi key = orderId, consumer idempotent. Ket qua: sau 2 tuan khong con event mat hay event ao; dashboard doanh so chinh xac 99,99%; do tre them khoang 100ms do relay.

### Tra loi mau khi phan vien
Ghi database va publish Kafka la dual write vi hai he thong khong co transaction chung. Toi dung Transactional Outbox: trong cung transaction, ghi don hang va dong outbox chua su kien. Sau do Debezium doc WAL, Outbox Event Router day event ra topic voi key la aggregateId de giu thu tu. Neu khong muon van hanh Kafka Connect, polling voi SKIP LOCKED cung duoc. Vi Kafka Connect chi luu offset sau khi Kafka xac nhan, restart connector co the gui lai nhung khong mat, nen consumer phai idempotent. Event trong outbox la contract rieng, khong serialize truc tiep entity domain. Theo doi lag connector va kich thuoc WAL bi slot giu, vi connector chet la business cham theo.

> Senior tip: CDC la them mot thanh phan phai van hanh nhu service thich — theo doi trang thai connector, do tre va kich thuoc WAL bi slot giu, khong chi de connector chay yen lang.`,
  follow: [
    'Polling relay va CDC chon cai nao khi team it nguoi va khong muon them he thong?',
    'Replication slot bi bo roi lau dau hieu ra gi, xu ly the nao?',
    'Event trong outbox co phai serialize truc tiep entity domain duoc khong, tai sao?'
  ],
  tags: ['Kafka', 'outbox', 'CDC', 'Debezium', 'dual-write']
},
{
  id: 'microservices-087',
  topic: 'microservices',
  level: 'senior',
  q: 'Doi tac hoi: he thong cua ban co dam bao exactly-once khong? Ban tra loi the nao, va trong thuc te Java backend lam gi de dat hieu qua exactly-once?',
  a: `**Tom tat:** Exactly-once end-to-end qua mang khong the (bien the bai toan Hai Tuong: ben gui khong phan biet duoc "bi mat message" voi "da toi nhung phan hoi bi mat"). Thuc te he thong chon at-least-once (khong mat message, co the trung) cong consumer idempotent = hieu qua exactly-once: message co the den hai lan nhung nghiep vu chi xay ra mot lan. Kafka transaction chi cho exactly-once khi ca dau vao va dau ra deu nam trong Kafka (vi du Kafka Streams), khong bao duoc database hoac API ngoai.

### Thuat ngu
- **Exactly-once end-to-end**: message duoc xu ly dung mot lan tu dau den cuoi — khong the bao bo chi bang broker khi co mang giua cac he thong.
- **At-least-once**: message duoc xu ly it nhat mot lan, co the bi xu ly lai — mo hinh mac dinh thuc te cua Kafka/RabbitMQ.
- **Hieu qua exactly-once (exactly-once effect)**: message co the den nhieu lan nhung he quyet nghiep vu chi xay ra mot lan, nhu consumer idempotent.
- **Idempotent consumer**: xu ly cung message nhieu lan cho ket qua giong mot lan (dedup theo event_id hoac natural key upsert).
- **Kafka transaction**: nhom nhieu ghi vao Kafka + commit offset thanh mot don vi nguyen tu, chi trong pham vi Kafka.
- **read_committed**: che do consumer chi doc message thuoc transaction da commit.
- **Hai Tuong (Two Generals)**: bai toan phan lan cho thuc hai ben khong the thong nhat boan luon qua mang khong dang tin cay.

### Ba muc do dam bao (bang)
| Muc | Cach dat | He quyet | Dung khi nao |
|---|---|---|---|
| At-most-once | commit offset truoc khi xu ly | co the mat message | metric lay sample, mat duoc |
| At-least-once | xu ly xong moi commit offset | co the trung | nghiep vu tien, don hang (kem idempotent) |
| Exactly-once trong Kafka | transaction producer + read_committed | dung mot lan neu dau vao/ra deu la Kafka | Kafka Streams consume-transform-produce |
| Hieu qua exactly-once | at-least-once + consumer idempotent | trung o cap message, khong trung o nghiep vu | consumer ghi database (thuc te pho bien nhat) |

### Vi sao crash giua chuc van gay trung
1. Consumer doc message offset 41, ghi database thanh cong.
2. Pod crash truoc commit offset 42.
3. Sau restart, consumer doc lai tu offset 41 -> message 41 duoc xu ly lan hai.
Ghi database va commit offset Kafka la hai he thong khac nhau (giong dual write), nen khong the tranh hoan toan duoc trung o cap message.

### Lam gi trong thuc te (Java backend)
1. Chon at-least-once: xu ly xong moi commit offset (Spring Kafka mac dinh tat auto-commit).
2. Consumer idempotent: bang processed_event(event_id PRIMARY KEY) hoac upsert theo natural key, cung transaction database voi business write.
3. Idempotency key phia client cho lenh ghi tien (UUID gui kem header, database insert UNIQUE, luu response trong cung transaction).
4. Kafka transaction chi dung khi pipeline toan bo nam trong Kafka (Kafka Streams), consumer dat isolation.level=read_committed.
5. Lap chung: gan event_id xuat hien log, database va trace; theo doi metric duplicate_suppressed (so ban trung bi chan moi phut); doi soat database voi he thong ngoai dinh ky.

### Loi hay gap
1. Tin Kafka transaction bao het database: Kafka commit nhung database rollback (hoac nguoc lai) -> du lieu lech. Chon mot nguon su that, dung inbox/outbox.
2. Commit offset truoc xu ly xong: crash lam mat message, chi dung cho du lieu mat duoc (metric lay sample).
3. Idempotency key TTL qua ngan: ban trung quay lai sau key het han. TTL phai lon hon thoi gian retry/replay toi da.
4. Side effect ngoai database (goi API thu ba) chua idempotency key: crash giua hai buoc = thuc hien hai lan thuc. Truyen key sang thu ba hoac ghi trang thai PENDING roi doi soat.

### Vi du doi thuc
He thong dat phong khach san khoang 2.000 su kien booking.created moi phut. Mot dot scaling lam consumer pod bi kill OOM ngay sau ghi database nhung truoc commit offset. Trieu chung: 0,9% dat phong bi tao hai don cung ma tham chieu, khach phan lan bi tru tien hai lan; khoang 45 trieu dong don hang trung trong 3 gio. Dieu tra: log thay cung eventId duoc xu ly hai lan, offset khong tien dan; khong co bang processed_event. Xu ly: them bang processed_event(event_id PRIMARY KEY) cung transaction voi insert dat phong, commit offset sau DB commit; them metric duplicate_suppressed. Ket qua: don trung xuong 0, metric duplicate_supressed on dinh khoang 0,4%/phut (biet he thong dang retry an toan), doi soat database voi cang thanh toan khop 100%.

### Tra loi mau khi phan vien
Exactly-once thuc su tu dau den cuoi qua mang khong the: ben gui khong phan biet duoc message bi mat voi da toi nhung phan hoi bi mat. Thuc te toi chon at-least-once: xu ly xong moi commit offset, chap nhan message co the den hai lan. De khong xu ly lap nghiep vu, consumer insert event_id vao bang processed_event cung transaction database voi business write, trung thi bo qua. Kafka transaction chi cho exactly-once neu ca vao va ra deu la Kafka (nhu Kafka Streams), khong bao duoc PostgreSQL hoac API ngoai. Toi lap chung bang event_id xuat hien log, database va trace, theo doi metric duplicate_supressed, va doi soat dinh ky. Neu chi mot ban trung qua cao (vi tien), thiet ke idempotency key tu client va doi soat he thong ngoai. Kinh nghiem: so ban trung bi chan khong 0 la binh thuong, bang 0 co nghia ban chua bat retry.

> Senior tip: hieu qua exactly-once duoc mua bang chi phi consumer idempotent (bang dedup, TTL, doi soat). Tra loi don tac "co/khong" voi doi tac khong co nghia; phai noi ro pham vi va chi phi ho tro.`,
  follow: [
    'Tai sao exactly-once end-to-end qua mang khong the?',
    'Kafka transaction bao duoc database khong, tai sao?',
    'Metric duplicate_supressed bang 0 co nghia la tot hay xau?'
  ],
  tags: ['Kafka', 'exactly once', 'at least once', 'idempotency']
},
);
