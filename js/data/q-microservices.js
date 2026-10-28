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

> Senior tip: tín hiệu đỏ lớn nhất là "2 service phải luôn deploy cùng nhau": khi đó chúng thực chất là một service, hãy gộp lại thay vì vờ tách.`,
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
  refs: [{"type": "doc", "title": "Microservices - Martin Fowler", "url": "https://martinfowler.com/articles/microservices.html"}, {"type": "doc", "title": "microservices.io patterns", "url": "https://microservices.io/patterns/"}, {"type": "doc", "title": "Enterprise Integration Patterns", "url": "https://www.enterpriseintegrationpatterns.com/"}],
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

> Senior tip: dùng CDC cho outbox là chuyện bình thường, nhưng nó thêm một thành phần (Kafka Connect cluster) phải monitor như service thật: lag của connector cũng là lag của business.`,
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
  a: `**Tóm tắt:** exactly-once **end-to-end** qua mạng là bất khả thi, vì bên gửi không phân biệt được "message bị mất" với "message tới rồi nhưng ack bị mất" (biến thể của bài toán Two Generals). Thứ ta thật sự làm là **at-least-once + xử lý idempotent = exactly-once effect**: message có thể đến 2 lần nhưng hệ quả nghiệp vụ chỉ xảy ra 1 lần. Hai công cụ chính: **idempotency key** do client gửi, và **dedup/upsert** ở consumer, đặt trong **cùng transaction** với business write.

### Hiểu nhanh
Bạn chuyển khoản qua app, mạng chập chờn, app quay mãi rồi báo lỗi. Bạn không biết tiền đã đi hay chưa, nên bấm lại. Nếu ngân hàng xử lý "ngây thơ", bạn mất tiền hai lần. Ngân hàng tử tế gán cho mỗi lệnh một **mã phiếu** (idempotency key): lần bấm thứ hai mang cùng mã, ngân hàng tra sổ thấy "mã này đã làm rồi" và trả lại đúng biên lai cũ. Đó là exactly-once effect: gửi nhiều lần, tiền chỉ đi một lần.

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

> Senior tip: measure = số bản ghi trùng/"duplicate suppressed" mỗi phút. Con số này luôn khác 0 trong hệ thống healthy; bằng 0 nghĩa là bạn chưa bật retry, không phải là bạn đã exactly-once.`,
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
  a: `**Tóm tắt:** nguyên tắc bất di bất dịch: **mọi call mạng đều có timeout**; retry chỉ cho thao tác idempotent, có backoff + jitter và số lần giới hạn; **circuit breaker** để fail fast khi dependency đã yếu; **bulkhead** để một dependency chết không kéo sập toàn bộ thread pool; **fallback** là lớp cuối cùng để degrade có kiểm soát. Với 10 downstream, mỗi downstream có **instance cấu hình riêng** (tên riêng), vì mỗi cái có SLA và tính chất khác nhau.

### Hiểu nhanh
Hãy nghĩ tới tổng đài chăm sóc khách hàng gọi ra cho 10 đối tác. **Timeout**: gọi quá 30 giây không ai nghe thì cúp máy. **Retry**: cúp rồi thử lại, nhưng chờ một lúc và tối đa 3 lần, không gọi dồn dập. **Circuit breaker**: nếu đối tác X 10 cuộc thì 6 cuộc không nghe, tạm ngừng gọi X trong 30 giây, khách hỏi tới X thì báo ngay "đang bận". **Bulkhead**: chỉ cho tối đa 5 nhân viên cùng gọi X, để X có "treo máy" thì các nhân viên còn lại vẫn phục vụ đối tác khác. **Fallback**: khi không gọi được, trả lời khách bằng thông tin dự phòng.

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

> Senior tip: chạy thử nghiệm fault injection (chaos test: kill 1 pod, cắt network, thêm độ trễ) trước khi lên production. Cấu hình resilience đọc thì đúng nhưng không ai tin cho tới khi bạn thấy nó tự cứu cụm một lần.`,
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
  a: `**Tóm tắt:** đây là **retry amplification** dẫn tới **cascading failure**: mỗi tầng retry 3 lần thì dependency nhận tới 4 lần tải đúng lúc nó đang yếu; thêm timeout quá dài làm thread của upstream bị giữ lâu, **thread pool cạn kiệt**, và service vô tội chết dù bản thân không có lỗi. Ngăn bằng: timeout ngắn trong một deadline tổng, retry có giới hạn + jitter + retry budget, circuit breaker, bulkhead, backpressure (429/503 + Retry-After) và health check không phụ thuộc downstream.

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

> Senior tip: quy tắc vàng khi on-call: "khi một service chậm, hãy giảm tải cho nó, không phải tăng retry". Retry là thuốc an thần cho developer và là thuốc độc cho hệ thống đang yếu.`,
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

> Senior tip: monitor **consumer lag** (offset mới nhất trừ offset đã commit, theo từng partition) là metric số 1 của Kafka: lag tăng là dấu hiệu đầu tiên của cả xử lý chậm lẫn poison pill. Lag chỉ tăng ở một partition thường là poison pill hoặc hot key.`,
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

> Senior tip: ở Kubernetes, đừng tự viết service discovery: Service + CoreDNS + readiness probe đã là service discovery. Hãy đầu tư vào timeout/retry/tracing ở client, và để ý gRPC cần cân bằng theo request chứ không theo kết nối.`,
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
  a: `**Tóm tắt:** metrics cho **xu hướng**, logs cho **chi tiết từng sự kiện**, traces cho **hành trình một request xuyên các service**. RED (Rate, Errors, Duration) đo theo endpoint/service, USE (Utilization, Saturation, Errors) đo theo tài nguyên; correlation id (trace_id theo chuẩn W3C) là sợi dây nối log với trace. Với 30 service, tôi chuẩn hóa bằng OpenTelemetry/Micrometer, giữ label metric có cardinality thấp và alert theo SLO burn rate.

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

> Senior tip: 30 service thì phần lớn giá trị đến từ **nhất quán**: cùng metric name, cùng label, cùng đơn vị độ trễ, cùng header trace. Là kiến trúc sư, việc đầu tiên là viết "từ điển" observability chung, không phải cài tool.`,
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
a: `**Tóm tắt:** **mTLS** trả lời câu hỏi "đây là service nào" (danh tính ở mức workload, chứng minh bằng certificate), **OAuth2 client credentials** trả lời "service này được làm gì" (quyền theo scope/audience trong JWT). Hai thứ bổ sung cho nhau, không thay thế nhau: service mesh lo transport + danh tính (auto mTLS), còn ứng dụng vẫn lo authorization nghiệp vụ + audit. Mesh không thay được app.

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

> Senior tip: phần lớn breaking đến từ **đổi định dạng**, không phải đổi schema. Thêm contract test cho định dạng ngày/tiền tệ/enum rẻ hơn rất nhiều so với sửa lỗi parse trên production.`,
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

> Senior tip: mỗi lần review migration, hãy tự hỏi "nếu app vừa deploy bị revert ngay 30 giây sau, hệ thống còn chạy không?". Nếu câu trả lời là không thì migration chưa an toàn, bất kể có backup hay không.`,
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

> Senior tip: monitor **rebalance rate** (metric {{rebalance-total}} / phút). Healthy = 0 rebalance giữa các deploy. Có rebalance = hoặc deploy sai, hoặc max.poll.interval.ms phải thấp, hoặc consumer xử lý kẹt.`,
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

> Senior tip: luôn load-test để biết dung lượng heap thực tế sau Full GC và bộ nhớ native (dùng Native Memory Tracking), rồi mới đặt request/limit. Đừng đoán: bộ nhớ Java không chỉ là heap.`,
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

> Senior tip: đo **mức tiêu budget** theo percentile (p50, p95, p99) tại mỗi hop. Nếu p99 của hop 3 đã ăn 80% budget, bạn phải tối ưu hop 3 hoặc giảm phần dành cho hop 1–2. Không có metric này thì bạn đang mò kim đáy bể.`,
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

> Senior tip: cấu hình bulkhead **không phải đặt một lần rồi quên**. Hãy có dashboard {{resilience4j.bulkhead.available.concurrent.calls}} so với {{resilience4j.bulkhead.max.allowed.concurrent.calls}} theo từng dependency. Nếu số permit trống thường dưới 10% thì tăng giới hạn hoặc tối ưu downstream; nếu lúc nào cũng gần đầy đủ thì bạn đang để dư quá nhiều.`,
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
    { type: 'doc', title: 'Spring Cloud Reference', url: 'https://docs.spring.io/spring-cloud/docs/current/reference/html/' },
    { type: 'doc', title: 'AWS Prescriptive Guidance', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html' },
    { type: 'doc', title: 'Microservices Patterns', url: 'https://microservices.io/patterns/' }
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
kafka-configs.sh --alter --entity-type topics --entity-name audit.events \\
  --add-config retention.ms=7776000000
# topic trạng thái khách hàng: compact
kafka-configs.sh --alter --entity-type topics --entity-name customer.state \\
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
mỗi record: 6ms, trong đó 5ms chờ DB pool (pool 10, DB max 500 write/s)
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
3. Giới hạn số việc đang chạy song song (semaphore/bulkhead) bằng capacity downstream: DB chịu 500 write/s, mỗi write 20ms → khoảng 10 việc song song là đủ (Little's Law).
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
);

