/* Topics: aws — owner: task T6. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'aws-001',
  topic: 'aws',
  level: 'senior',
  q: 'Deploy một Spring Boot service lên AWS: khi nào chọn EC2, ECS Fargate, EKS hay Lambda? Tiêu chí nào thực sự quyết định?',
  a: `**Tóm tắt:** chọn theo mức kiểm soát hạ tầng và mô hình vận hành: EC2 khi cần toàn quyền OS; ECS Fargate khi muốn chạy container mà không quản server; EKS khi đội đã chuẩn Kubernetes hoặc cần hệ sinh thái K8s; Lambda khi workload ngắn, event-driven và chịu được cold start.

### Hiểu nhanh
Hãy tưởng tượng bạn cần chỗ để mở quán ăn. **EC2** giống thuê nguyên mặt bằng trống: tự sắm bếp, tự sửa điện nước, muốn làm gì cũng được nhưng mọi hỏng hóc là việc của bạn. **ECS Fargate** giống thuê một gian trong food court: bạn chỉ mang "thùng hàng" (Docker image) tới, điện nước và bảo vệ do ban quản lý lo. **EKS** giống tự vận hành cả một food court theo chuẩn quốc tế (Kubernetes): rất mạnh khi có nhiều quầy, nhiều đội, nhưng cần người quản lý chuyên trách. **Lambda** giống thuê đầu bếp theo từng món: có khách gọi thì đầu bếp tới nấu, không có khách thì không mất tiền, nhưng lần đầu đầu bếp tới sẽ chậm (cold start) và không nấu món nào quá 15 phút.

### Thuật ngữ
- **EC2 instance**: một máy ảo thuê theo giây/giờ, có OS riêng do bạn quản lý và vá lỗi.
- **AMI (Amazon Machine Image)**: "ảnh đĩa" mẫu chứa OS và phần mềm, dùng để tạo nhiều EC2 giống hệt nhau.
- **Auto Scaling Group (ASG)**: nhóm EC2 tự thêm/bớt máy theo tải và tự thay máy hỏng.
- **Task definition**: bản khai báo của ECS cho container: image, CPU, memory, biến môi trường, IAM role.
- **Control plane**: "bộ não" của Kubernetes (API server, scheduler, etcd); trên EKS do AWS vận hành và tính phí theo giờ.
- **HPA (Horizontal Pod Autoscaler)**: thành phần Kubernetes tự tăng/giảm số pod theo CPU hoặc metric tuỳ chỉnh.
- **Cold start**: lần gọi Lambda phải tạo môi trường mới (tải code, bật JVM, chạy code khởi tạo) nên chậm hơn hẳn các lần sau.
- **SnapStart**: tính năng Lambda chụp ảnh JVM đã khởi tạo xong rồi khôi phục từ ảnh đó để giảm cold start.

### Cơ chế từng bước: cùng một service, bốn cách chạy
1. **Đóng gói**: EC2 nhận file JAR hoặc AMI; Fargate và EKS nhận Docker image từ ECR; Lambda nhận JAR/zip hoặc container image. Vì sao quan trọng: cách đóng gói quyết định pipeline CI/CD bạn phải dựng.
2. **Nơi chạy**: EC2 chạy trên máy bạn quản lý; Fargate chạy trên máy AWS quản lý mà bạn không nhìn thấy; EKS chạy pod trên node (EC2 của bạn hoặc Fargate); Lambda chạy trong microVM ngắn hạn do AWS tạo khi có event. Vì sao: ai giữ máy thì người đó phải vá OS và trực khi máy hỏng.
3. **Nhận traffic**: EC2/Fargate/EKS thường đứng sau ALB và lắng nghe cổng liên tục; Lambda chỉ chạy khi có event từ API Gateway, ALB, SQS, S3… Vì sao: đây là lý do Lambda không tốn tiền khi không có request.
4. **Scale**: EC2/Fargate/EKS cần vài chục giây đến vài phút để bật thêm máy/container và JVM; Lambda tạo môi trường mới trong vài giây, nhưng **mỗi môi trường chỉ xử lý 1 request tại một thời điểm**. Vì sao: đây là gốc của trade-off "scale nhanh nhưng có cold start và bùng nổ số connection".
5. **Tính tiền**: EC2/Fargate tính theo thời gian chạy dù không có request; Lambda tính theo số request × thời gian × memory. Vì sao: tải thấp hoặc thất thường thì Lambda rẻ, tải cao và đều thì container thường rẻ hơn.

~~~text
Ví dụ ước lượng (để so sánh bậc độ lớn, không phải bảng giá chính xác):
API 5 request/giây đều cả ngày = ~13 triệu request/tháng, mỗi request 200 ms, 1 GB
  Lambda : 13M x 0,2 s x 1 GB = 2,6 triệu GB-giây  -> khoảng 45 USD/tháng
  Fargate: 2 task (0,5 vCPU, 1 GB) chạy 24/7        -> khoảng 35 USD/tháng
Traffic tăng 10 lần:
  Lambda : tăng gần đúng 10 lần (~450 USD)
  Fargate: chỉ cần thêm vài task, vì một JVM xử lý nhiều request song song
~~~

### Bản chất từng lựa chọn
- **EC2**: bạn quản lý OS, patch, AMI, Auto Scaling Group, load balancer. Linh hoạt nhất (cài agent, kernel tuning, GPU) nhưng bạn trả tiền cho thời gian instance chạy và cho công sức vận hành.
- **ECS Fargate**: bạn đóng gói Docker image, khai báo task definition (CPU, memory, env, IAM task role). AWS lo phần chạy container; không có node để vá. Phù hợp đa số service Spring Boot "bình thường".
- **EKS**: Kubernetes managed control plane. Mạnh khi có nhiều team, cần CRD/operator, service mesh, hoặc đã có nền tảng K8s. Cái giá là độ phức tạp: ingress, HPA, RBAC, add-on, nâng cấp cluster.
- **Lambda**: function + event trigger, scale gần như tức thời, trả tiền theo request và thời gian chạy. Ràng buộc: tối đa 15 phút/lần gọi, cold start, không giữ state, connection pool khó quản.

### Bảng so sánh thực dụng
| Tiêu chí | EC2 | ECS Fargate | EKS | Lambda |
|---|---|---|---|---|
| Quản lý OS | Bạn | AWS | AWS + bạn lo node nếu dùng EC2 node | Không |
| Cold start | Không | Thấp | Thấp | Có, tệ hơn với Java |
| Scale | Phút | Phút | Phút (HPA) | Giây |
| Workload dài (batch, streaming) | Tốt | Tốt | Tốt | Không (15 phút) |
| Đội cần biết gì | Linux, systemd | Docker, task definition | Kubernetes | IAM, event model |
| Chi phí khi tải thấp | Cao (instance bật 24/7) | Trung bình | Cao (control plane + node) | Rất thấp |

### Cách quyết định
1. Nếu workload là HTTP API 24/7 có traffic ổn định: **ECS Fargate** là điểm cân bằng tốt nhất; ít vận hành hơn EC2, đơn giản hơn EKS.
2. Nếu công ty đã có platform Kubernetes, nhiều service, cần chuẩn hoá deploy: **EKS**, đừng xây lại ECS.
3. Nếu cần GPU, phần mềm đặc thù, kernel tuning, hoặc tận dụng Reserved Instance đã mua: **EC2**.
4. Nếu là tác vụ ngắn (xử lý ảnh, webhook, cron nhỏ, glue code giữa service): **Lambda**. Với Java, luôn cân nhắc SnapStart và giữ function "nóng".

### Lỗi hay gặp
- **Đem Spring Boot nguyên bản lên Lambda.** Triệu chứng: cold start 3–8 giây vì Spring context, Hibernate, connection pool; trung bình đẹp nhưng p99 xấu. Cách tránh: đừng chọn Lambda chỉ vì "rẻ"; nếu vẫn dùng thì bật SnapStart, tăng memory, cắt bớt dependency, hoặc chuyển sang Fargate.
- **Đặt CPU/memory của task Fargate theo cảm tính.** Triệu chứng: đặt memory sát giới hạn thì container bị OOMKilled (exit code 137); đặt quá cao thì trả tiền vô ích, vì task CPU/memory quyết định cả giá lẫn hiệu năng. Cách tránh: theo dõi memory utilization thực tế vài tuần trước khi chốt, để heap khoảng 75% memory của task.
- **Tự viết YAML deployment riêng cho từng service trên EKS.** Triệu chứng: sau vài tháng mỗi service một kiểu, cấu hình lệch nhau, khó nâng cấp. Cách tránh: dùng Helm/Kustomize với template chung và policy-as-code.
- **Chọn EKS vì "công ty lớn đều dùng".** Triệu chứng: đội 5 người dành nửa thời gian nâng cấp cluster, sửa add-on, ingress. Cách tránh: chỉ chọn EKS khi có người trực platform và có nhu cầu thật (nhiều team, CRD/operator, service mesh).

### Trả lời miệng 1 phút
"Tôi chọn nơi chạy dựa trên hai câu hỏi: ai sẽ vận hành hạ tầng, và workload trông như thế nào. EC2 cho toàn quyền OS nhưng tôi phải tự vá và trực máy; ECS Fargate cho tôi chạy container mà không có server để quản; EKS là Kubernetes managed, mạnh khi công ty đã có platform K8s; còn Lambda chạy theo event, scale trong vài giây và trả tiền theo request. Trade-off chính là Lambda rẻ khi tải thấp, thất thường nhưng có cold start, giới hạn 15 phút và khó quản connection pool; EKS linh hoạt nhất nhưng chi phí con người cao. Với API Spring Boot chạy 24/7, mặc định của tôi là ECS Fargate sau ALB; Lambda tôi dùng cho webhook, xử lý file, cron nhỏ, và luôn đo Init Duration trước khi quyết định."

> Senior tip: với đa số đội Java 5–20 người, ECS Fargate + ALB + RDS là con đường ngắn nhất tới production ổn định. Chỉ nhảy lên EKS khi có người thực sự trực cluster; chi phí ẩn của Kubernetes là con người, không phải hoá đơn AWS.`,
  follow: [
    'Nếu service cần xử lý job 30 phút thì Lambda xử lý thế nào?',
    'Vì sao EKS đắt hơn ECS về chi phí vận hành dù control plane chỉ khoảng 0,10 USD/giờ?',
    'Bạn sẽ migrate một monolith Spring Boot sang container mà không downtime ra sao?'
  ],
  tags: ['EC2', 'ECS', 'Fargate', 'EKS', 'Lambda']
},
{
  id: 'aws-002',
  topic: 'aws',
  level: 'senior',
  q: 'Lambda chạy Java bị cold start cao. SnapStart, GraalVM native và tối ưu memory/CPU hoạt động thế nào, chọn cái nào?',
  a: `**Tóm tắt:** cold start của Java trên Lambda gồm tải class + khởi tạo JVM + chạy code khởi tạo (Spring context, DB pool). SnapStart snapshot trạng thái JVM sau khi init để bỏ phần khởi tạo; GraalVM native giảm thời gian nạp và bộ nhớ; tăng memory giúp có thêm CPU và giảm thời gian init.

### Hiểu nhanh
Cold start giống mở cửa hàng buổi sáng: phải bật đèn, mở két, xếp hàng lên kệ rồi mới bán được món đầu tiên. Java đặc biệt chậm ở bước này vì JVM phải nạp hàng nghìn class và Spring phải dựng toàn bộ bean. **SnapStart** giống chụp ảnh cửa hàng đã bày biện xong, mỗi lần mở cửa chỉ cần "khôi phục từ ảnh" thay vì bày lại từ đầu. **GraalVM native** giống nấu sẵn suất ăn đóng hộp từ trước (biên dịch trước): mở ra là ăn ngay, nhưng khó đổi công thức. **Tăng memory** giống thuê thêm nhân viên: Lambda cấp CPU tỉ lệ với memory nên mọi việc, kể cả khởi động, đều nhanh hơn.

### Thuật ngữ
- **Execution environment**: microVM chạy hàm Lambda, được tái sử dụng cho nhiều lần gọi liên tiếp nhưng mỗi lúc chỉ xử lý 1 request.
- **Init phase**: giai đoạn chạy static initializer, constructor của handler và khởi động framework, trước lần gọi handler đầu tiên.
- **Init Duration / Restore Duration**: trường trong dòng log REPORT cho biết init (hoặc restore snapshot) mất bao lâu; chỉ xuất hiện ở lần cold start.
- **CRaC (Coordinated Restore at Checkpoint)**: API {{org.crac}} cho phép code chạy hook trước khi chụp snapshot và sau khi khôi phục.
- **AOT (Ahead-of-Time)**: biên dịch sang mã máy trước khi chạy, thay vì để JIT biên dịch trong lúc chạy.
- **JIT warmup**: giai đoạn đầu JVM chạy chậm vì đang thông dịch và thu thập số liệu trước khi biên dịch code nóng.
- **Reachability metadata**: khai báo class/resource nào cần reflection để GraalVM giữ lại khi build native image.
- **GB-giây**: đơn vị tính tiền Lambda = memory cấu hình (GB) × thời gian chạy (giây).

### Cơ chế từng bước
**Cold start thường:**
1. Request tới nhưng không có môi trường rảnh, Lambda tạo microVM mới. Vì sao: mỗi môi trường chỉ xử lý 1 request, nên request đồng thời thứ N+1 luôn cần môi trường mới.
2. Tải code và khởi động runtime Java. Vì sao chậm: JVM phải nạp, verify class và chạy thông dịch trước khi JIT kịp tối ưu.
3. Chạy init phase: constructor handler, Spring dựng context, Hibernate đọc metadata. Đây thường là phần lớn nhất, tính bằng giây.
4. Gọi handler. Các request sau vào lại môi trường này là **warm start**, chỉ còn bước 4.

**Với SnapStart:**
1. Khi bạn **publish version**, Lambda chạy init một lần, gọi {{beforeCheckpoint}}, chụp snapshot bộ nhớ và trạng thái microVM, mã hoá và cache lại. Vì sao lúc publish: để chi phí init chỉ trả một lần thay vì mỗi cold start.
2. Khi cần môi trường mới, Lambda khôi phục từ snapshot thay cho bước 2–3, rồi gọi {{afterRestore}}.
3. Gọi handler như bình thường. Lưu ý SnapStart chỉ áp dụng khi gọi qua version/alias đã publish, không áp cho {{$LATEST}}.

~~~text
Số liệu minh hoạ, Spring Boot 1 GB:
Cold start thường: [tạo VM][khởi JVM][init Spring ~4 s.............][handler 50 ms] ~ 4-5 s
SnapStart        : [tạo VM][restore ~0,3-0,6 s][afterRestore][handler 50 ms]      < 1 s
Warm start       : [handler 50 ms]
~~~

### Cold start hình thành từ đâu
Khi không có execution environment sẵn, Lambda phải: tải code, khởi tạo runtime, chạy **init phase** (static initializer, constructor, Spring Boot), rồi mới gọi handler. Với Spring Boot, init có thể chiếm phần lớn thời gian vì component scan, proxy, Hibernate metadata. Ngoài ra VPC cũ (trước 2019) từng gây ENI cold start; nay Lambda dùng hyperplane ENI nên thường không còn là vấn đề chính.

### SnapStart
- Áp dụng cho runtime Java managed từ Java 11 trở lên (11, 17, 21…); nay cũng có cho Python và .NET.
- Lambda chạy init một lần, chụp snapshot bộ nhớ JVM + heap + loaded classes, mã hoá và cache.
- Khi có request, Lambda khôi phục snapshot thay vì init lại, thường giảm cold start từ vài giây xuống hàng trăm ms.
- **Không snapshot được**: kết nối mạng đang mở, thread, entropy/random seed, file descriptor. Vì vậy code phải "làm mới" sau khi restore.

~~~java
// Runtime hooks theo API CRaC (org.crac): implement Resource rồi đăng ký vào global context
public class Handler implements RequestHandler<Req, Res>, Resource {
    public Handler() { Core.getGlobalContext().register(this); }

    @Override public void beforeCheckpoint(Context<? extends Resource> ctx) {
        /* đóng connection, flush */
    }
    @Override public void afterRestore(Context<? extends Resource> ctx) {
        /* mở lại connection, sinh lại giá trị cần duy nhất */
    }
    // handleRequest(...) như bình thường
}
~~~

Pitfall lớn: **unique ID/random** bị lặp sau restore nếu sinh trong init, vì mọi môi trường restore từ cùng một snapshot. Không tạo UUID/token/seed trong static initializer hay constructor; hãy sinh trong handler hoặc trong {{afterRestore}}. {{SecureRandom}} trên runtime Java managed của Lambda được thiết kế an toàn với snapshot, còn {{java.util.Random}} đã khởi tạo trong init thì không.

### GraalVM native image
Biên dịch AOT thành binary, bỏ JVM startup và JIT warmup. Cold start có thể còn vài chục đến vài trăm ms, memory thấp hơn. Đổi lại: build lâu, reflection/resource phải khai báo (Spring Boot 3 có AOT + reachability metadata), một số thư viện không tương thích, và không có JIT nên throughput đỉnh có thể thấp hơn JVM đã warm.

### Memory và CPU
Lambda cấp CPU theo memory (ví dụ 1.769 MB tương đương 1 vCPU). Tăng memory thường **giảm** thời gian chạy và có khi rẻ hơn vì tính theo GB-giây. Đừng chỉ set 512 MB cho Spring Boot rồi phàn nàn chậm. Đo bằng Lambda Power Tuning (state machine) để tìm điểm tối ưu chi phí.

### Chọn cái nào
| Tình huống | Lựa chọn |
|---|---|
| Spring Boot vừa phải, cần giữ code JVM | SnapStart |
| Function nhỏ, ít dependency, cần cold start cực thấp | GraalVM native |
| Code đã có nhiều reflection/agent | JVM + SnapStart, tăng memory |
| Latency không nhạy cảm | JVM thường, tối ưu init |

### Lỗi hay gặp
- **Bật SnapStart nhưng trigger vẫn gọi {{$LATEST}}.** Triệu chứng: log REPORT vẫn có Init Duration vài giây, không thấy Restore Duration. Cách tránh: publish version, trỏ API Gateway/event source vào alias trỏ tới version đó.
- **Giữ connection mở xuyên qua snapshot.** Triệu chứng: lần gọi đầu sau restore lỗi connection reset hoặc timeout tới DB/HTTP. Cách tránh: đóng ở {{beforeCheckpoint}} và mở lại ở {{afterRestore}}, hoặc tạo lazy ở lần dùng đầu, bật validation trong pool.
- **Sinh UUID/seed/token trong init.** Triệu chứng: nhiều môi trường sinh ra cùng giá trị, gây trùng khoá hoặc lỗ hổng bảo mật. Cách tránh: sinh trong handler hoặc {{afterRestore}}, dùng {{SecureRandom}}.
- **Đặt 512 MB cho Spring Boot.** Triệu chứng: init 8–10 giây, handler chậm, timeout lẻ tẻ. Cách tránh: thử 1024–2048 MB bằng Lambda Power Tuning; thường chi phí không tăng vì thời gian chạy giảm tương ứng.

### Trả lời miệng 1 phút
"Cold start của Java trên Lambda gồm ba phần: tạo môi trường, khởi động JVM và chạy code khởi tạo như Spring context, trong đó phần khởi tạo thường tốn nhất. Tôi có ba công cụ. SnapStart chụp snapshot sau khi init lúc publish version, cold start chỉ còn là restore, thường dưới một giây, đổi lại phải xử lý connection và giá trị ngẫu nhiên sau restore bằng hook CRaC. GraalVM native biên dịch AOT nên khởi động cực nhanh và ít memory, nhưng build lâu, phải khai báo reflection và mất JIT. Tăng memory thì có thêm CPU, init nhanh hơn và nhiều khi còn rẻ hơn. Thực tế tôi đo Init Duration trước, bật SnapStart và chỉnh memory đầu tiên vì rẻ nhất; chỉ chọn native cho function nhỏ, ít dependency."

> Senior tip: đừng tối ưu cold start trước khi đo. Bật Lambda Insights hoặc đọc dòng log REPORT để xem Init Duration; nếu p99 chấp nhận được thì giữ JVM bình thường. SnapStart gần như luôn là bước tăng tốc rẻ nhất cho Java, nhưng nhớ test kỹ các connection và random sau restore.`,
  follow: [
    'Sau khi SnapStart restore, connection pool tới RDS nên được xử lý thế nào?',
    'Vì sao tăng memory có thể làm giảm chi phí Lambda?',
    'GraalVM native gặp lỗi reflection thì debug ra sao?'
  ],
  tags: ['Lambda', 'SnapStart', 'GraalVM', 'cold start']
},
{
  id: 'aws-003',
  topic: 'aws',
  level: 'senior',
  q: 'Thiết kế VPC cho một hệ microservices: public/private subnet, NAT, Security Group vs NACL, VPC endpoint — giải thích và các bẫy hay gặp?',
  a: `**Tóm tắt:** VPC là mạng riêng ảo; public subnet có route ra Internet Gateway, private subnet đi ra ngoài qua NAT. Security Group là firewall stateful gắn vào ENI, NACL là stateless ở tầng subnet. VPC endpoint cho phép gọi dịch vụ AWS mà không cần qua Internet.

### Hiểu nhanh
VPC giống một khu chung cư có tường rào riêng. **Public subnet** là dãy nhà mặt đường có cổng ra phố (Internet Gateway); **private subnet** là dãy nhà trong hẻm, muốn ra phố phải đi qua chốt bảo vệ một chiều (**NAT**): người bên trong đi ra được, người bên ngoài không tự vào được. **Security Group** là bảo vệ đứng ở cửa từng căn hộ, nhớ mặt khách đã cho vào nên tự cho khách đi ra; **NACL** là barie đầu dãy nhà, kiểm tra cả chiều vào lẫn chiều ra và không nhớ ai. **VPC endpoint** là lối đi nội bộ dẫn thẳng tới "siêu thị AWS" (S3, SQS…) mà không cần ra phố.

### Thuật ngữ
- **CIDR**: cách ghi dải IP; {{10.0.0.0/16}} có 65.536 địa chỉ, {{/24}} có 256 địa chỉ (AWS giữ lại 5 địa chỉ mỗi subnet).
- **Availability Zone (AZ)**: một hoặc nhiều datacenter tách biệt điện và mạng trong một region.
- **Route table**: bảng chỉ đường của subnet: đích nào thì đi qua cửa nào; route cụ thể hơn (prefix dài hơn) thắng.
- **Internet Gateway (IGW)**: cửa hai chiều giữa VPC và Internet.
- **NAT Gateway**: cho máy trong private subnet đi ra Internet bằng IP của NAT, chặn kết nối khởi tạo từ ngoài vào.
- **ENI**: card mạng ảo gắn vào EC2, task Fargate, Lambda trong VPC; Security Group thực chất gắn vào ENI.
- **Stateful / stateless**: stateful nhớ kết nối nên tự cho chiều trả lời đi qua; stateless xét từng gói tin độc lập.
- **Ephemeral port**: cổng tạm phía client (1024–65535) mà gói trả lời quay về; NACL phải mở cho chiều này.

### Cơ chế từng bước: app trong private subnet gọi API bên ngoài và gọi S3
1. Task ECS ({{10.0.11.25}}) mở kết nối tới IP của api.partner.com. Route table của private subnet có {{0.0.0.0/0 → nat-a}}. Vì sao: private subnet không có route tới IGW nên không ai ngoài Internet nhắm thẳng vào task được.
2. Security Group của task kiểm tra outbound (mặc định cho phép tất cả). Vì SG stateful, gói trả lời sẽ tự được cho vào.
3. NACL của subnet kiểm tra outbound; vì NACL stateless, nó cũng phải có rule inbound cho cổng ephemeral để gói trả lời quay về.
4. NAT Gateway nằm trong public subnet, có Elastic IP, đổi IP nguồn private thành IP public rồi gửi qua IGW. Vì sao: Internet chỉ trả lời được về IP public.
5. Gói trả lời về NAT, NAT đổi ngược địa chỉ và chuyển cho task.
6. Khi task gọi S3: route table có route tới prefix list của S3 trỏ vào gateway endpoint. Route này cụ thể hơn {{0.0.0.0/0}} nên thắng, traffic **không đi qua NAT** và không tốn phí NAT theo GB.

~~~text
                       Internet
                          |
                       [ IGW ]
          AZ-a            |              AZ-b
+------------------ public subnet -------------------+
| ALB node    NAT-a (EIP)      | ALB node   NAT-b    |
+------------------ private app ---------------------+
| ECS task 10.0.11.25          | ECS task 10.0.12.40 |
+------------------ private db ----------------------+
| RDS primary                  | RDS standby         |
+----------------------------------------------------+
Route table private-a:
  10.0.0.0/16      -> local
  pl-xxxx (S3)     -> vpce-s3   (gateway endpoint, miễn phí)
  0.0.0.0/0        -> nat-a     (NAT cùng AZ)
~~~

### Bố cục tham chiếu
- **2–3 Availability Zone**, mỗi AZ có một public subnet và một hoặc nhiều private subnet.
- **ALB** đặt ở public subnet (hoặc private nếu dùng CloudFront/API Gateway), app ở private subnet, RDS ở private subnet riêng (DB subnet group tối thiểu 2 AZ).
- Route table public: {{0.0.0.0/0 → igw-xxx}}. Route table private: {{0.0.0.0/0 → nat-xxx}} đặt trong public subnet của cùng AZ.
- Mỗi AZ nên có NAT Gateway riêng để tránh cross-AZ data charge và tránh single point of failure. NAT Gateway tính theo giờ + GB xử lý, đây là khoản chi phí dễ bị bỏ qua.

### Security Group vs NACL
| Tiêu chí | Security Group | Network ACL |
|---|---|---|
| Gắn vào | ENI / resource | Subnet |
| Stateful | Có (cho phép chiều về tự động) | Không, phải mở cả hai chiều |
| Rule | Chỉ allow | Allow và deny |
| Đánh giá | Tất cả rule trước khi quyết định | Theo thứ tự số, dừng ở match đầu |
| Dùng khi | Kiểm soát traffic chính | Lớp chặn IP thô, ví dụ chặn dải IP xấu |

Thực tế 95% kiểm soát nên nằm ở Security Group. Đừng mở {{0.0.0.0/0}} cho port 3306/5432 hay Redis; chỉ cho phép SG của app gọi SG của DB (tham chiếu SG làm source).

### VPC endpoint
- **Gateway endpoint**: S3 và DynamoDB, miễn phí, gắn vào route table. Dùng gần như mặc định.
- **Interface endpoint (PrivateLink)**: tạo ENI trong subnet, tính phí theo giờ + GB. Dùng cho SQS, SNS, KMS, Secrets Manager, ECR, CloudWatch Logs… để traffic không ra Internet.
- Lợi ích: giảm NAT cost, không phụ thuộc Internet, tuân thủ bảo mật.
- Cần bật **private DNS** cho interface endpoint để SDK dùng tên miền chuẩn.

### Lỗi hay gặp
- **Kéo Docker image và đẩy log qua NAT.** Triệu chứng: hoá đơn NAT Gateway (tính theo GB xử lý) tăng vọt mỗi lần deploy, đôi khi NAT nghẽn. Cách tránh: tạo endpoint cho ECR (api + dkr + gateway endpoint S3, vì layer image nằm trên S3) và CloudWatch Logs.
- **Một NAT dùng chung cho nhiều AZ.** Triệu chứng: AZ chứa NAT gặp sự cố là toàn hệ mất egress; ngày thường thì phát sinh phí cross-AZ. Cách tránh: mỗi AZ một NAT, route table private của AZ nào trỏ NAT của AZ đó.
- **Sửa NACL mà quên nó stateless.** Triệu chứng: mở inbound 443 nhưng quên outbound ephemeral 1024–65535, kết nối treo rất khó hiểu dù Security Group đúng. Cách tránh: để NACL mặc định allow, chỉ dùng NACL cho chặn dải IP thô; kiểm soát chính bằng Security Group.
- **Tắt DNS của VPC.** Triệu chứng: interface endpoint có private DNS nhưng SDK vẫn đi ra Internet hoặc không resolve được. Cách tránh: bật cả {{enableDnsSupport}} và {{enableDnsHostnames}}.
- **CIDR chồng lấn.** Triệu chứng: không peering/Transit Gateway được với VPC khác hoặc on-prem, phải re-IP cả hệ. Cách tránh: quy hoạch dải /16 không trùng cho từng VPC ngay từ đầu.

### Trả lời miệng 1 phút
"VPC là mạng riêng của tôi trên AWS. Tôi chia mỗi AZ một public subnet cho ALB và NAT, các private subnet cho app và database; private subnet đi ra Internet qua NAT Gateway của chính AZ đó để không có điểm chết chung và không tốn phí cross-AZ. Kiểm soát truy cập tôi dồn vào Security Group vì nó stateful và tham chiếu được SG khác, ví dụ chỉ SG của app mới vào được cổng 5432 của SG database; NACL stateless nên tôi chỉ dùng để chặn dải IP thô. Để giảm phí NAT và không phụ thuộc Internet, tôi luôn có gateway endpoint cho S3, DynamoDB và interface endpoint cho ECR, Secrets Manager, CloudWatch Logs. Kinh nghiệm của tôi là đa số sự cố 'không gọi được S3' nằm ở route table hoặc thiếu endpoint, nên tôi bật VPC Flow Logs ngay từ đầu."

> Senior tip: hãy vẽ route table trước khi vẽ diagram. Phần lớn sự cố "service không gọi được S3/Secrets Manager" là do thiếu endpoint hoặc route, không phải do code. Bật VPC Flow Logs gửi về CloudWatch/S3 để điều tra nhanh.`,
  follow: [
    'Vì sao NAT Gateway nên đặt mỗi AZ một cái dù tốn thêm tiền?',
    'Security Group tham chiếu Security Group khác hoạt động thế nào?',
    'Khi nào cần dùng AWS PrivateLink thay vì VPC peering?'
  ],
  tags: ['VPC', 'subnet', 'NAT', 'Security Group', 'VPC endpoint']
},
{
  id: 'aws-004',
  topic: 'aws',
  level: 'senior',
  q: 'IAM role khác IAM user thế nào? Làm sao áp least privilege cho ứng dụng chạy trên ECS/EKS/Lambda mà không hard-code credentials?',
  a: `**Tóm tắt:** IAM user là danh tính lâu dài gắn với access key; IAM role là danh tính tạm thời được assume, trả về credential có hạn (thường 15 phút–12 giờ). Ứng dụng nên dùng role: task role trên ECS, IRSA hoặc EKS Pod Identity trên EKS, execution role trên Lambda, và không bao giờ nhúng access key vào image hay biến môi trường.

### Hiểu nhanh
**IAM user** giống nhân viên được phát chìa khoá vĩnh viễn: lỡ đánh rơi chìa (access key lộ lên GitHub) thì kẻ gian vào được mãi cho đến khi bạn thay khoá. **IAM role** giống thẻ khách có hạn dùng ở quầy lễ tân: ai đủ điều kiện (trust policy) thì được phát thẻ, thẻ tự hết hạn sau vài giờ. Ứng dụng nên luôn "ra lễ tân lấy thẻ" thay vì giữ chìa vĩnh viễn, và AWS SDK làm việc đó tự động. **Least privilege** nghĩa là thẻ chỉ mở đúng những cửa cần cho công việc: nhân viên kho không cần vào phòng kế toán.

### Thuật ngữ
- **Principal**: chủ thể gửi request tới AWS: user, role, hoặc dịch vụ AWS.
- **Policy**: tài liệu JSON gồm Effect (Allow/Deny), Action, Resource và Condition.
- **Trust policy**: policy gắn vào role, quy định ai được phép assume role đó.
- **STS (Security Token Service)**: dịch vụ phát credential tạm khi một principal assume role.
- **Session token**: thành phần thứ ba của credential tạm, bắt buộc gửi kèm access key tạm, hết hạn theo phiên.
- **IMDS**: địa chỉ {{169.254.169.254}} bên trong EC2 cung cấp metadata và credential của instance profile; IMDSv2 yêu cầu lấy token bằng PUT trước.
- **IRSA / EKS Pod Identity**: hai cách gắn IAM role cho pod thông qua Kubernetes ServiceAccount.
- **OIDC provider**: cấu hình để IAM tin token do cluster EKS ký, dùng cho IRSA.

### Cơ chế từng bước: task ECS đọc file trên S3
1. Khi task khởi động, ECS lấy credential tạm của **task role** và phục vụ qua một endpoint nội bộ, đồng thời đặt biến {{AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}} trong container. Vì sao: code không bao giờ phải cầm credential lâu dài.
2. Code gọi {{S3Client.create()}}. SDK v2 đi theo credential provider chain, gặp container credential provider, gọi endpoint đó và nhận access key, secret key, session token và thời điểm hết hạn.
3. SDK ký request bằng SigV4 rồi gửi tới S3.
4. IAM đánh giá: có explicit Deny nào khớp không? Có Allow nào khớp (identity policy hoặc resource policy) và không bị SCP/permission boundary chặn không? Không có Allow thì là implicit deny.
5. Trước khi credential hết hạn, SDK tự refresh. Vì sao app không cần restart: provider cache credential kèm thời hạn và tự lấy mới.

Trên EKS cơ chế tương tự: với IRSA, pod được gắn token ServiceAccount và biến {{AWS_ROLE_ARN}}, {{AWS_WEB_IDENTITY_TOKEN_FILE}}; SDK gọi {{AssumeRoleWithWebIdentity}}. Với Pod Identity, SDK gọi agent chạy trên node qua {{AWS_CONTAINER_CREDENTIALS_FULL_URI}}, giống cách ECS làm.

~~~text
Request ký SigV4
   |
   v
Có explicit Deny khớp? ---có---> TỪ CHỐI
   | không
   v
Có Allow khớp và SCP/boundary không chặn? ---không---> TỪ CHỐI (implicit deny)
   | có
   v
CHO PHÉP
~~~

### Cơ chế
- **Principal** (ai) thực hiện **action** (làm gì) trên **resource** (cái gì), có thể kèm **condition** (khi nào). Policy được đánh giá theo kiểu: explicit deny thắng tất cả; sau đó explicit allow; còn lại là implicit deny.
- **Role** có trust policy quy định ai được assume. Khi assume, STS cấp bộ credential tạm gồm access key, secret key và **session token**.
- **Credential provider chain** trong AWS SDK for Java v2 tự tìm credential theo thứ tự: system property, env, profile, container credential endpoint (ECS), IMDS (EC2),… nên code không cần biết mình chạy ở đâu.

### Từng nền tảng
- **ECS**: task definition có **task role** (quyền của code) tách khỏi **execution role** (quyền kéo image, ghi log). Nhầm hai role này là lỗi rất phổ biến: code không gọi được S3 vì quyền nằm ở execution role.
- **EKS**: hai lựa chọn. **IRSA** (IAM Roles for Service Accounts) liên kết Kubernetes ServiceAccount với IAM role qua OIDC provider; pod nhận token projected volume. **EKS Pod Identity** là cách mới hơn, gắn role qua add-on, không cần sửa trust policy theo từng cluster OIDC.
- **Lambda**: execution role là nơi khai báo quyền; mỗi function nên có role riêng, không dùng chung role "admin cho nhanh".
- **EC2**: instance profile gắn vào instance; nhưng nếu chạy container trên EC2 thì nên dùng task role của ECS thay vì để container thừa hưởng quyền của node.

### Least privilege thực hành
1. Bắt đầu từ quyền tối thiểu, không bắt đầu từ {{*}}.
2. Giới hạn resource ARN cụ thể: bucket, hàng đợi, secret, table.
3. Dùng condition: {{aws:SourceVpce}}, {{aws:PrincipalTag/team}}, {{s3:prefix}}, {{aws:SourceArn}} cho SNS/SQS.
4. Tách role theo workload, theo môi trường (dev/staging/prod), không tái sử dụng role prod cho dev.
5. Dùng **IAM Access Analyzer** để phát hiện quyền không dùng và sinh policy từ CloudTrail.
6. Với quyền nhạy cảm, bắt buộc MFA bằng condition {{aws:MultiFactorAuthPresent}}.

~~~json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::orders-docs/*",
    "Condition": {
      "StringEquals": {
        "aws:SourceVpce": "vpce-0123456789abcdef0"
      }
    }
  }]
}
~~~

### Lỗi hay gặp
- **Gắn quyền vào execution role thay vì task role trên ECS.** Triệu chứng: task chạy được, kéo image và ghi log bình thường, nhưng code gọi S3 bị AccessDenied. Cách tránh: quyền của code đặt ở task role; execution role chỉ cho ECS kéo image, đọc secret lúc khởi động và ghi log.
- **Access key nằm trong Git hoặc Docker image.** Triệu chứng: dù đã xoá ở commit sau, key vẫn nằm trong layer/history và bị bot quét lấy trong vài phút. Cách tránh: rotate (vô hiệu hoá) key ngay, bật secret scanning, chuyển sang role.
- **Dùng root account cho CI/CD.** Triệu chứng: một lần lộ key là mất toàn quyền account, thảm hoạ. Cách tránh: bật MFA cho root, không tạo access key cho root; CI/CD dùng role assume qua OIDC (ví dụ GitHub Actions).
- **Role quá rộng kết hợp lỗ hổng SSRF.** Triệu chứng: kẻ tấn công lợi dụng SSRF lấy credential rồi đọc toàn bộ S3; trên EC2, IMDSv1 đặc biệt dễ bị lợi dụng. Cách tránh: giới hạn cả quyền lẫn đường mạng (VPC endpoint, condition), bật **IMDSv2 required**.

### Trả lời miệng 1 phút
"IAM user là danh tính lâu dài với access key cố định, còn IAM role là danh tính được assume, STS trả về credential tạm có session token và tự hết hạn. Ứng dụng của tôi luôn dùng role: task role trên ECS, IRSA hoặc Pod Identity trên EKS, execution role trên Lambda; AWS SDK tự lấy và làm mới credential qua provider chain nên code không chứa key nào. Khi đánh giá quyền, explicit Deny luôn thắng, sau đó mới tới Allow, còn lại bị từ chối ngầm. Để least privilege, tôi tách role theo service và môi trường, giới hạn ARN cụ thể, thêm condition như VPC endpoint, và dùng IAM Access Analyzer sinh policy từ CloudTrail. Câu tôi luôn hỏi khi review là: nếu service này bị chiếm, kẻ tấn công chạm được gì."

> Senior tip: hãy coi mỗi service là một principal riêng. Khi review, câu hỏi đầu tiên không phải "có chạy không" mà "nếu service này bị chiếm, kẻ tấn công chạm được gì". Ranh giới role tốt biến sự cố lớn thành sự cố nhỏ.`,
  follow: [
    'Task role và execution role trên ECS khác nhau ở điểm nào?',
    'IRSA hoạt động thế nào từ lúc pod start đến lúc SDK lấy được credential?',
    'Làm sao tìm và thu hẹp quyền IAM đang cấp thừa?'
  ],
  tags: ['IAM', 'IRSA', 'least privilege', 'ECS', 'EKS']
},
{
  id: 'aws-005',
  topic: 'aws',
  level: 'senior',
  q: 'RDS, Aurora và DynamoDB khác nhau về bản chất ra sao? Với một hệ thống mới, bạn chọn cái nào và vì sao?',
  a: `**Tóm tắt:** RDS là database quan hệ managed trên engine truyền thống (PostgreSQL, MySQL…); Aurora là engine quan hệ tương thích MySQL/PostgreSQL nhưng storage phân tán, scale đọc tốt hơn; DynamoDB là key-value/document NoSQL fully managed, độ trễ ổn định ở mọi scale nhưng phải thiết kế truy cập trước.

### Hiểu nhanh
**RDS** giống thuê một căn bếp quen thuộc (PostgreSQL, MySQL) có người lo bảo trì, sao lưu giúp; bạn vẫn chọn cỡ bếp và nấu như cũ. **Aurora** vẫn là món ăn đó, nhưng kho nguyên liệu được chép ra 6 kho ở 3 nơi, nhiều đầu bếp phụ cùng lấy từ chung kho nên phục vụ đọc nhanh, hỏng một kho vẫn chạy. **DynamoDB** giống tủ gửi đồ siêu thị: đưa đúng số tủ (key) là lấy đồ trong vài mili giây dù có hàng triệu tủ, nhưng hỏi "tìm giúp mọi túi màu đỏ" thì vừa chậm vừa đắt. Vì vậy chọn database là chọn theo **cách bạn sẽ hỏi dữ liệu**.

### Thuật ngữ
- **Multi-AZ**: bản standby ở AZ khác, nhận dữ liệu đồng bộ, tự lên thay khi primary hỏng.
- **Read replica**: bản sao chỉ đọc, nhận dữ liệu bất đồng bộ nên có độ trễ.
- **Replica lag**: khoảng thời gian giữa lúc ghi ở primary và lúc replica nhìn thấy dữ liệu đó.
- **Quorum**: số bản sao tối thiểu phải xác nhận thì thao tác mới được coi là thành công.
- **ACU (Aurora Capacity Unit)**: đơn vị năng lực của Aurora Serverless v2, khoảng 2 GiB RAM cùng CPU và mạng tương ứng.
- **Partition key / sort key**: khoá của DynamoDB; partition key quyết định item nằm ở partition nào, sort key sắp xếp item trong partition.
- **RCU / WCU**: đơn vị throughput đọc/ghi của DynamoDB.
- **RDS Proxy**: proxy managed gom connection từ nhiều client vào một pool nhỏ tới database.

### Cơ chế từng bước: một lệnh ghi đi qua từng hệ
1. **RDS Multi-AZ (DB instance)**: app ghi vào primary, primary ghi xuống EBS và **đồng bộ** sang standby ở AZ khác, chỉ trả commit khi cả hai đã ghi. Vì sao: mất primary thì standby có đủ dữ liệu, RPO gần 0. Đổi lại standby không nhận query.
2. **Aurora**: writer không ghi cả trang dữ liệu mà gửi redo log tới tầng storage phân tán; dữ liệu có 6 bản trên 3 AZ, commit khi **4/6** bản xác nhận (đọc cần 3/6). Reader dùng chung storage nên không phải chép dữ liệu, lag thường dưới 100 ms. Vì sao failover nhanh: promote reader không cần chép lại dữ liệu.
3. **DynamoDB**: SDK gửi PutItem, DynamoDB băm partition key để chọn partition, ghi vào bản leader rồi replicate sang 3 AZ, trả về khi đa số xác nhận. Vì sao độ trễ ổn định: mỗi truy cập chỉ chạm một partition, không join, không query planner.

~~~text
RDS Multi-AZ             Aurora                          DynamoDB
   App                     App                              App
    |                       |                                | PutItem(pk=USER#42)
 Primary --sync--> Stb   Writer    Reader x15             hash(pk) -> partition 7
    |               |       |          |                     |
   EBS             EBS   [ storage: 6 bản / 3 AZ ]       3 bản trên 3 AZ
                          ghi cần 4/6, đọc cần 3/6
~~~

### RDS
- Chạy engine quen thuộc, bạn chọn instance class, storage, backup, Multi-AZ.
- **Multi-AZ** (DB instance) là standby đồng bộ, failover tự động (thường 60–120 giây), không dùng standby để đọc. Riêng **Multi-AZ DB cluster** (MySQL/PostgreSQL) có 2 standby đọc được.
- **Read replica** là bản sao bất đồng bộ, dùng để scale đọc; có độ trễ replication.
- Phù hợp: ứng dụng có transaction, join, báo cáo, ORM/JPA, dữ liệu quan hệ rõ ràng.

### Aurora
- Storage tách khỏi compute, replicate 6 bản trên 3 AZ, tính tiền theo GB-tháng và I/O (hoặc Aurora I/O-Optimized).
- Một cluster gồm writer + tối đa 15 reader; failover nhanh hơn RDS Multi-AZ, replica lag thấp.
- **Aurora Serverless v2** co giãn theo ACU, hợp workload biến động; min ACU > 0 vẫn tính tiền khi idle (nay có thể đặt min 0 ACU để auto-pause, đổi lại lần resume mất vài giây).
- **Aurora Global Database** cho DR xuyên vùng với RPO khoảng 1 giây.
- Phù hợp: workload đọc nhiều, cần HA cao, MySQL/PostgreSQL compatibility, scale lớn.

### DynamoDB
- Bảng key-value, mỗi item tối đa 400 KB; truy cập theo **partition key** (+ sort key).
- Throughput ở chế độ on-demand hoặc provisioned; độ trễ single-digit ms ở quy mô lớn.
- Tính năng: GSI/LSI, TTL, Streams, transactions (giới hạn), DAX cache.
- Không có join, không có query linh hoạt như SQL; mọi access pattern phải biết trước.
- Phù hợp: session, cart, catalog key-value, event state, workload cần scale ngang cực lớn.

### Bảng chọn nhanh
| Nhu cầu | Chọn |
|---|---|
| Transaction, join, báo cáo phức tạp | RDS PostgreSQL |
| Cùng nhu cầu nhưng cần HA/scale đọc lớn | Aurora PostgreSQL |
| Key-value, truy cập theo key, scale không giới hạn | DynamoDB |
| Analytics nặng, OLAP | Redshift / Athena, không phải 3 cái trên |
| Full-text search | OpenSearch |

### Lỗi hay gặp
- **Chọn DynamoDB rồi truy vấn kiểu SQL.** Triệu chứng: Scan toàn bảng, lọc phía client, hoá đơn RCU tăng vọt và API chậm dần theo dữ liệu. Cách tránh: liệt kê access pattern trước, **thiết kế bảng theo access pattern**; truy vấn ad-hoc thì đẩy dữ liệu sang Athena/OpenSearch.
- **Không tính I/O của Aurora.** Triệu chứng: workload nhiều update nhỏ khiến phí I/O lớn hơn cả phí instance. Cách tránh: đo trước khi chốt, cân nhắc Aurora I/O-Optimized khi I/O vượt khoảng 25% tổng chi phí Aurora.
- **Trỏ báo cáo vào standby Multi-AZ.** Triệu chứng: không kết nối được vì standby (DB instance) không nhận connection. Cách tránh: Multi-AZ là để HA, không để scale đọc; report trỏ vào read replica hoặc reader endpoint.
- **Quên connection pool khi scale.** Triệu chứng: mỗi app instance mở quá nhiều connection, cạn {{max_connections}}, lỗi "too many connections" khi autoscale. Cách tránh: HikariCP với pool nhỏ, thêm PgBouncer/RDS Proxy nếu số client lớn hoặc dùng Lambda.

### Trả lời miệng 1 phút
"RDS là PostgreSQL hoặc MySQL quen thuộc được AWS quản lý: tôi chọn instance, Multi-AZ cho HA và read replica để scale đọc. Aurora tương thích PostgreSQL/MySQL nhưng tách compute khỏi storage: dữ liệu có 6 bản trên 3 AZ, ghi theo quorum 4/6, tối đa 15 reader dùng chung storage nên failover nhanh và replica lag thấp. DynamoDB là key-value: truy cập theo partition key thì vài mili giây ở mọi quy mô, nhưng không join, không query linh hoạt, mọi access pattern phải biết trước. Trade-off là linh hoạt truy vấn so với khả năng scale dự đoán được. Với hệ mới có dữ liệu quan hệ, mặc định của tôi là Aurora PostgreSQL; tôi chỉ chọn DynamoDB khi liệt kê được rõ các truy vấn chính, ví dụ session, giỏ hàng, trạng thái event."

> Senior tip: mặc định của tôi cho hệ mới là **Aurora PostgreSQL** nếu dữ liệu quan hệ và đội quen SQL; **DynamoDB** chỉ khi access pattern rõ và cần scale/độ trễ dự đoán được. Đừng chọn NoSQL vì "trend" rồi phải tự viết join ở tầng ứng dụng.`,
  follow: [
    'Aurora Serverless v2 khác gì so với provisioned, khi nào nó lại đắt hơn?',
    'Vì sao DynamoDB không phù hợp cho truy vấn ad-hoc?',
    'RDS Proxy giải quyết vấn đề gì khi app scale theo Lambda?'
  ],
  tags: ['RDS', 'Aurora', 'DynamoDB', 'database']
},
{
  id: 'aws-006',
  topic: 'aws',
  level: 'senior',
  q: 'DynamoDB: partition key và sort key ảnh hưởng gì? Hot partition là gì, GSI xử lý ra sao và có cạm bẫy nào?',
  a: `**Tóm tắt:** DynamoDB chia dữ liệu theo hash của partition key; key phân bố đều thì throughput trải đều, key lệch tạo hot partition. Sort key cho phép query theo range trong cùng partition. GSI là bảng phụ có key khác, được cập nhật bất đồng bộ và có chi phí riêng.

### Hiểu nhanh
DynamoDB giống một bưu điện có hàng nghìn ô thư. **Partition key** như mã bưu chính: máy tự băm mã đó để quyết định thư vào ô nào. Nếu ai cũng gửi tới cùng một mã (ví dụ "ngày hôm nay"), một ô bị nghẽn trong khi các ô khác trống trơn: đó là **hot partition**. **Sort key** như việc xếp thư trong cùng một ô theo ngày, nên lấy "thư của khách 42 trong tháng 3" rất nhanh. **GSI** như cuốn danh bạ thứ hai sắp theo tiêu chí khác, được nhân viên chép lại sau mỗi lần có thư mới, nên đôi khi chậm một nhịp.

### Thuật ngữ
- **Partition (vật lý)**: đơn vị lưu trữ và throughput bên trong DynamoDB, khoảng 10 GB, 3.000 RCU và 1.000 WCU.
- **RCU**: 1 lần đọc strongly consistent một item tới 4 KB mỗi giây (hoặc 2 lần đọc eventually consistent).
- **WCU**: 1 lần ghi một item tới 1 KB mỗi giây.
- **Cardinality**: số giá trị khác nhau của một thuộc tính; cardinality cao thì dữ liệu trải đều hơn.
- **Throttling**: DynamoDB từ chối request (ProvisionedThroughputExceededException) khi vượt giới hạn; SDK sẽ retry kèm backoff.
- **Adaptive capacity**: cơ chế tự dồn capacity cho partition nóng và tách partition khi cần.
- **Single-table design**: lưu nhiều loại entity trong một bảng, phân biệt bằng tiền tố của key.
- **Projection**: tập thuộc tính được chép từ bảng gốc sang index.

### Cơ chế từng bước: ghi một đơn hàng
1. App gọi PutItem với {{pk=USER#42}}, {{sk=ORDER#2025-03-01#A1}}. DynamoDB băm {{pk}} để chọn partition. Vì sao băm: để các key gần nhau (USER#41, USER#42) vẫn rơi vào partition khác nhau, trải đều tải.
2. Item được ghi trong partition và sắp theo {{sk}}. Vì sao: Query "đơn của USER#42 từ tháng 3" chỉ cần đọc một vùng liên tục, không quét cả bảng.
3. Nếu item có thuộc tính là khoá của GSI (ví dụ {{status}}), DynamoDB chép **bất đồng bộ** sang GSI và tiêu WCU của GSI. Vì sao bất đồng bộ: để ghi vào bảng gốc không phải chờ index.
4. Khi partition vượt dung lượng hoặc nóng kéo dài, DynamoDB tự tách partition. Nhưng một giá trị partition key cực nóng vẫn dễ chạm giới hạn của partition, vì mọi request của key đó dồn về cùng một chỗ.

~~~text
Bảng có 10 partition, tải ghi 5.000 WCU/giây:
Key tốt (userId)            : ~500 WCU mỗi partition            -> OK
Key tệ (date = hôm nay)     : 5.000 WCU dồn 1 partition, trần 1.000
                              -> phần lớn request bị throttle dù bảng "còn dư"
Shard suffix (date#0..date#9): ~500 WCU mỗi partition           -> OK
                              đổi lại: đọc phải gọi 10 Query rồi gộp kết quả
~~~

### Cách DynamoDB lưu dữ liệu
- Item được định danh bởi **partition key** (bắt buộc) và **sort key** (tuỳ chọn).
- Partition key được hash vào các partition vật lý. Mỗi partition có giới hạn throughput (xấp xỉ 3.000 RCU đọc strongly consistent và 1.000 WCU ghi mỗi giây, cùng giới hạn 10 GB dữ liệu).
- Nếu một key chiếm phần lớn traffic, partition chứa nó bị nóng; các partition khác rảnh. Đó là **hot partition**, biểu hiện bằng throttling cục bộ dù bảng còn capacity.
- **Adaptive capacity** giúp giảm nhẹ bằng cách dồn capacity cho partition nóng, nhưng không cứu được key đơn lẻ có traffic cực lớn.

### Thiết kế key
- Chọn key có cardinality cao và phân bố đều: {{userId}}, {{orderId}} (UUID) tốt; {{status}}, {{country}}, {{ngày}} thường tệ vì ít giá trị.
- Viết theo mẫu **single-table design**: partition key chung {{USER#123}}, sort key {{ORDER#2024-...}} để lấy nhiều loại entity trong một query.
- Nếu buộc phải dùng key lệch, thêm **shard suffix** (ví dụ {{status=NEW#0..9}}) rồi scatter-gather khi đọc, hoặc dùng GSI với key khác.

### GSI và LSI
- **GSI**: partition key và sort key khác bảng gốc, có throughput riêng, cập nhật **bất đồng bộ** (eventual consistency).
- **LSI**: chỉ tạo lúc tạo bảng, dùng cùng partition key, sort key khác; giới hạn 5 LSI.
- GSI có **hot partition** riêng: nếu GSI key là {{status}} thì mọi item {{NEW}} dồn một chỗ. Đây là lỗi rất hay gặp khi thêm GSI để "query cho tiện".
- GSI **projection**: chỉ project các attribute cần ({{KEYS_ONLY}}, {{INCLUDE}}) để giảm chi phí; {{ALL}} tốn storage và write cost.

### Query vs Scan
- {{Query}} cần partition key, đọc theo sort key range, hiệu quả.
- {{Scan}} đọc toàn bảng, tốn RCU và chậm; chỉ dùng cho job offline nhỏ.
- Phân trang bằng {{LastEvaluatedKey}}, không dùng offset.

~~~java
QueryRequest req = QueryRequest.builder()
    .tableName("orders")
    .keyConditionExpression("pk = :pk AND begins_with(sk, :prefix)")
    .expressionAttributeValues(Map.of(
        ":pk", AttributeValue.fromS("USER#42"),
        ":prefix", AttributeValue.fromS("ORDER#")))
    .build();
~~~

### Lỗi hay gặp
- **Dùng timestamp/ngày làm partition key.** Triệu chứng: mọi write dồn vào partition của thời điểm hiện tại, throttling dù bảng còn capacity. Cách tránh: partition key là entity id, timestamp làm **sort key**.
- **GSI thiếu capacity.** Triệu chứng: ghi vào bảng gốc bị throttle dù bảng còn WCU, vì GSI bị **throttle ngược** về bảng gốc. Cách tránh: cấp đủ WCU cho GSI (hoặc dùng on-demand), chọn key GSI phân bố đều, projection gọn.
- **Đọc GSI ngay sau khi ghi.** Triệu chứng: vừa tạo đơn xong gọi API danh sách lại không thấy đơn mới. Cách tránh: GSI chỉ hỗ trợ eventually consistent; luồng đọc-sau-ghi đọc từ bảng gốc bằng key (có thể dùng ConsistentRead).
- **Thiết kế sai kích thước.** Triệu chứng: item vượt 400 KB hoặc transaction vượt 100 item/4 MB, phải viết lại mô hình. Cách tránh: tách dữ liệu lớn sang S3, chỉ lưu key; chia item theo nhiều sort key.

### Trả lời miệng 1 phút
"DynamoDB băm partition key để quyết định item nằm ở partition vật lý nào, mỗi partition có trần khoảng 3.000 RCU và 1.000 WCU. Nếu key phân bố đều như userId thì tải trải đều; nếu key ít giá trị như status hay ngày thì một partition bị nóng và throttle dù bảng còn capacity. Sort key cho phép query theo khoảng trong cùng partition, rất hợp cho kiểu 'đơn hàng của user theo thời gian'. GSI là bảng phụ với key khác, cập nhật bất đồng bộ, có capacity riêng và cũng có thể bị hot partition, thậm chí throttle ngược bảng gốc. Khi buộc phải dùng key lệch, tôi thêm shard suffix và đọc scatter-gather. Kinh nghiệm của tôi là bắt đầu thiết kế bằng danh sách access pattern kèm tần suất, chứ không bằng ERD."

> Senior tip: thiết kế DynamoDB bắt đầu bằng danh sách access pattern, không bắt đầu bằng ERD. Nếu bạn không liệt kê được 10 truy vấn chính kèm tần suất, chưa nên chọn DynamoDB.`,
  follow: [
    'Vì sao dùng ngày/tháng làm partition key thường gây hot partition?',
    'GSI eventual consistency ảnh hưởng gì tới luồng đọc-sau-ghi?',
    'Khi nào nên dùng LSI thay vì GSI?'
  ],
  tags: ['DynamoDB', 'partition key', 'GSI', 'hot partition']
},
{
  id: 'aws-007',
  topic: 'aws',
  level: 'mid',
  q: 'S3: storage class nào dùng khi nào, presigned URL hoạt động ra sao, lifecycle, consistency và multipart upload có gì cần lưu ý?',
  a: `**Tóm tắt:** S3 là object storage bền vững, nhất quán mạnh sau khi ghi thành công; chọn storage class theo tần suất đọc và thời gian lưu; presigned URL cho phép client tải/đọc object trong thời hạn mà không cần credential; multipart upload là bắt buộc trên thực tế cho file lớn.

### Hiểu nhanh
S3 giống một kho gửi đồ khổng lồ: mỗi món đồ (**object**) có một nhãn (**key**) và nằm trong một khu (**bucket**); không có thư mục thật, dấu {{/}} chỉ là một phần của nhãn. **Storage class** giống chọn giữa tủ ở quầy (lấy ngay, phí thuê cao) và kho lạnh ngoại ô (thuê rẻ, nhưng lấy ra mất phí và thời gian). **Presigned URL** giống vé gửi xe có chữ ký và giờ hết hạn: ai cầm vé thì gửi/lấy đúng một món đó, không cần tài khoản. **Multipart upload** giống chuyển nhà bằng nhiều xe nhỏ chạy song song: một xe hỏng thì chỉ chạy lại xe đó.

### Thuật ngữ
- **Object / key / bucket**: object là file kèm metadata; key là tên đầy đủ của object; bucket là vùng chứa có tên duy nhất toàn cầu.
- **Durability 11 số 9**: S3 lưu dư ở nhiều AZ (trừ One Zone) nên xác suất mất object cực thấp; khác với availability (truy cập được hay không).
- **Retrieval fee**: phí lấy dữ liệu ra từ các class IA và Glacier, tính theo GB.
- **Minimum storage duration**: xoá hoặc chuyển object sớm hơn số ngày tối thiểu vẫn bị tính đủ số ngày đó.
- **SigV4**: thuật toán ký request của AWS bằng secret key; presigned URL là chữ ký SigV4 đặt trong query string.
- **Delete marker**: khi bucket bật versioning, lệnh xoá chỉ thêm "dấu xoá", các version cũ vẫn còn và vẫn tính tiền.
- **OAC (Origin Access Control)**: cơ chế cho CloudFront đọc bucket private mà không phải mở bucket ra Internet.
- **Checksum**: giá trị CRC32C/SHA256 dùng để phát hiện dữ liệu bị hỏng trên đường truyền.

### Cơ chế từng bước: người dùng upload ảnh đại diện bằng presigned URL
1. Client gọi API backend: "tôi muốn upload avatar.png, 2 MB". Backend xác thực user và kiểm tra quyền. Vì sao: quyết định cấp vé phải nằm ở server.
2. Backend ký URL bằng credential của role, chỉ định bucket, key {{user/42/avatar.png}}, Content-Type và thời hạn 10 phút. Việc ký là phép tính cục bộ, **không gọi mạng tới S3**, nên rất nhanh.
3. Client PUT file thẳng lên S3 bằng URL đó, kèm đúng Content-Type đã ký. Vì sao: file không đi qua backend, backend không tốn băng thông và thread.
4. S3 kiểm tra chữ ký, thời hạn, và cả quyền của principal đã ký: nếu role không có {{s3:PutObject}} trên key đó thì URL vẫn bị từ chối.
5. S3 ghi object; khi PUT trả 200 thì mọi GET/LIST sau đó đều thấy object mới (strong consistency).
6. S3 phát event (qua EventBridge hoặc SQS) để backend xử lý tiếp: resize ảnh, quét virus, cập nhật DB.

~~~text
Client --(1) xin URL---------> Backend --(2) ký SigV4 cục bộ
Client <------ URL hết hạn sau 10 phút ---
Client --(3) PUT 2 MB ----------------------------> S3 bucket "uploads"
                                                      | (6) event
Backend <------------- SQS / EventBridge -------------+
Multipart cho file 1 GB: 10 part x 100 MB, upload 4 part song song,
part 7 lỗi -> chỉ upload lại part 7 -> CompleteMultipartUpload
~~~

### Storage class
| Class | Dùng khi | Ghi chú |
|---|---|---|
| Standard | Dữ liệu nóng, latency thấp | Đắt nhất, không phí lấy ra |
| Intelligent-Tiering | Không đoán được pattern | Tự chuyển tầng, có phí giám sát nhỏ |
| Standard-IA | Ít đọc (dưới ~1 lần/tháng) | Phí retrieval, lưu tối thiểu 30 ngày |
| One Zone-IA | Dữ liệu tái tạo được, ít đọc | Chỉ một AZ |
| Glacier Instant Retrieval | Lưu trữ lâu, vẫn cần đọc ms | Tối thiểu 90 ngày |
| Glacier Flexible / Deep Archive | Backup, truy xuất từ phút–giờ (Flexible) đến 12–48 giờ (Deep Archive) | Rẻ nhất, retrieval đắt; tối thiểu 90/180 ngày |

### Presigned URL
- Server ký một URL bằng credential của mình (SigV4), URL chứa action, object key và thời gian hết hạn.
- Client dùng URL để PUT/GET trực tiếp, không đi qua app server ⇒ giảm tải và tiết kiệm băng thông.
- Giới hạn: SigV4 cho phép tối đa 7 ngày (khi ký bằng IAM user); nếu ký bằng credential tạm (role, STS) thì URL hết hiệu lực sớm hơn, khi session credential hết hạn. Ai có URL là có quyền tương ứng, nên đặt TTL ngắn và giới hạn key chính xác.
- Không dùng presigned URL cho thao tác cần kiểm soát chặt (xoá hàng loạt); URL chỉ nên cho upload/download một object cụ thể.

~~~java
S3Presigner presigner = S3Presigner.create();
PresignedPutObjectRequest req = presigner.presignPutObject(r -> r
    .signatureDuration(Duration.ofMinutes(10))
    .putObjectRequest(p -> p.bucket("uploads").key("user/42/avatar.png")
        .contentType("image/png")));
String url = req.url().toString();
~~~

### Lifecycle
- Rule theo prefix/tag: chuyển sang IA sau N ngày, Glacier sau M ngày, expire sau K ngày.
- Dùng để dọn multipart upload dở dang (rất quan trọng, nếu không sẽ âm thầm tốn tiền).
- Versioning + lifecycle: xoá version cũ sau bao lâu; cẩn thận với delete marker.

### Consistency
- Từ cuối 2020, S3 cung cấp **strong read-after-write consistency** cho PUT mới và overwrite, và **strong** cho list. Không còn câu chuyện eventual như tài liệu cũ.
- Tuy vậy, các hệ phân tán phía trên (CloudFront, cache ứng dụng) vẫn có thể trả bản cũ; đừng nhầm với S3.
- Update metadata hoặc copy object là thao tác mới, không atomic với người đọc đang tải.

### Multipart
- Bắt buộc dùng cho file lớn hơn 100 MB theo khuyến nghị; giới hạn một object 5 TB (cuối 2025 AWS đã nâng lên 50 TB), tối đa 10.000 part, mỗi part 5 MB–5 GB (part cuối có thể nhỏ hơn).
- Upload song song nhiều part tăng tốc đáng kể.
- Nếu một part lỗi, chỉ cần retry part đó. Phải gọi CompleteMultipartUpload; nếu bỏ dở, dùng lifecycle {{AbortIncompleteMultipartUpload}}.
- Kiểm tra checksum (CRC32C/SHA256) để phát hiện hỏng dữ liệu.

### Lỗi hay gặp
- **Bucket public.** Triệu chứng: dữ liệu khách hàng bị index hoặc bị tải hàng loạt, gần như luôn là cấu hình sai. Cách tránh: bật Block Public Access, nội dung công khai thì phục vụ qua CloudFront + OAC.
- **Bật versioning mà không có lifecycle.** Triệu chứng: chi phí lưu trữ tăng âm thầm theo mọi lần ghi đè/xoá vì version cũ vẫn còn. Cách tránh: rule lifecycle xoá noncurrent version sau N ngày và dọn delete marker hết hạn.
- **Multipart upload bỏ dở.** Triệu chứng: bucket "trống" nhưng hoá đơn vẫn tính dung lượng của các part chưa hoàn tất. Cách tránh: lifecycle {{AbortIncompleteMultipartUpload}} sau vài ngày.
- **Dùng S3 làm filesystem.** Triệu chứng: sửa file nhỏ liên tục, mỗi PUT là một object mới, tốn tiền request và chậm. Cách tránh: cần filesystem chia sẻ thì dùng EFS.
- **Không đặt Content-Type khi presign PUT.** Triệu chứng: file tải về bị trình duyệt hiểu sai (tải xuống thay vì hiển thị, hoặc ngược lại). Cách tránh: đặt Content-Type khi ký và kiểm tra lại sau upload.

### Trả lời miệng 1 phút
"S3 là object storage: dữ liệu lưu dư nhiều AZ, và từ cuối 2020 đã nhất quán mạnh, ghi xong là đọc và list thấy ngay. Tôi chọn storage class theo tần suất đọc: Standard cho dữ liệu nóng, Intelligent-Tiering khi không đoán được, IA và Glacier cho dữ liệu ít đọc, nhớ rằng chúng có phí lấy ra và thời gian lưu tối thiểu. Với upload từ client, backend ký presigned URL ngắn hạn cho đúng một key, client đẩy thẳng lên S3 nên backend không gánh băng thông; ai có URL là có quyền, nên TTL phải ngắn. File lớn thì dùng multipart: chia part, upload song song, part lỗi chỉ retry part đó. Mặc định mọi bucket tôi bật Block Public Access, versioning kèm lifecycle và rule huỷ multipart dở dang."

> Senior tip: mặc định bật versioning + Block Public Access + lifecycle abort multipart cho mọi bucket. Với upload từ client, dùng presigned POST với điều kiện {{content-length-range}} trong POST policy để tránh bị đẩy file khổng lồ (presigned PUT không giới hạn được kích thước theo khoảng).`,
  follow: [
    'Vì sao presigned URL không nên có TTL dài?',
    'Chi phí ẩn nào xuất hiện khi bật versioning mà không có lifecycle?',
    'Khi nào nên dùng S3 Transfer Acceleration?'
  ],
  tags: ['S3', 'presigned URL', 'lifecycle', 'multipart']
},
{
  id: 'aws-008',
  topic: 'aws',
  level: 'senior',
  q: 'So sánh SQS standard/FIFO, SNS, EventBridge, Kinesis và MSK. Visibility timeout, DLQ và chuyện "ít nhất một lần" ảnh hưởng thiết kế ra sao?',
  a: `**Tóm tắt:** SQS là hàng đợi point-to-point cho worker; SNS là pub/sub fan-out; EventBridge là bus sự kiện có routing theo rule và tích hợp SaaS; Kinesis là stream cho analytics/replay; MSK là Kafka managed. SQS standard là at-least-once nên consumer phải idempotent.

### Hiểu nhanh
**SQS** giống hàng đợi lấy số ở ngân hàng: mỗi phiếu chỉ một quầy xử lý, xử lý xong thì huỷ phiếu. **SNS** giống loa phát thanh: nói một lần, ai đăng ký đều nghe, nhưng không ghi âm lại. **EventBridge** giống tổng đài phân loại thư theo nội dung: thư "hoàn tiền" chuyển phòng A, thư "đơn mới" chuyển phòng B. **Kinesis và MSK (Kafka)** giống cuốn sổ có đánh số trang: nhiều người đọc độc lập, mỗi người tự nhớ mình đọc tới trang nào, muốn đọc lại trang cũ cũng được. Vì mạng có thể rớt giữa chừng, các hệ này chọn "thà giao trùng còn hơn mất" (**at-least-once**), nên bên nhận phải chịu được trùng.

### Thuật ngữ
- **Visibility timeout**: khoảng thời gian message bị ẩn khỏi consumer khác sau khi một consumer đã nhận nó.
- **Receipt handle**: "biên nhận" trả về khi nhận message, dùng để xoá hoặc gia hạn đúng lần nhận đó.
- **DLQ (dead-letter queue)**: hàng đợi chứa message đã thất bại quá số lần quy định.
- **maxReceiveCount**: số lần nhận tối đa trong redrive policy trước khi message bị chuyển sang DLQ.
- **Long polling**: consumer chờ tối đa 20 giây cho tới khi có message thay vì hỏi liên tục và nhận về rỗng.
- **Poison message**: message luôn làm consumer lỗi, ví dụ sai định dạng.
- **Idempotent**: xử lý một message nhiều lần cho kết quả giống như xử lý một lần.
- **Shard / partition**: đơn vị chia song song của Kinesis/Kafka; thứ tự chỉ được đảm bảo trong một shard/partition.

### Cơ chế từng bước: vòng đời một message SQS
1. Producer gọi SendMessage; SQS lưu message dư trên nhiều server. Vì sao có thể giao trùng: hệ phân tán đôi khi một bản sao chưa kịp biết message đã bị xoá.
2. Consumer gọi ReceiveMessage (long polling 20 giây), nhận message và receipt handle; message chuyển sang trạng thái **in-flight**, bị ẩn trong visibility timeout (ví dụ 60 giây).
3. Xử lý xong trong 60 giây thì gọi DeleteMessage với receipt handle, message biến mất vĩnh viễn.
4. Nếu consumer chết hoặc quá 60 giây chưa xoá, message hiện lại và ApproximateReceiveCount tăng 1, consumer khác sẽ nhận. Vì sao: SQS không biết bạn đã xử lý hay chưa, nó chỉ biết bạn chưa xoá.
5. Khi số lần nhận vượt maxReceiveCount (ví dụ 5), SQS chuyển message sang DLQ; alarm trên DLQ báo cho người trực.

~~~text
Send -> [Queue: visible] --Receive--> [in-flight, ẩn 60 s] --Delete--> (hết)
               ^                                |
               +---- hết 60 s chưa Delete ------+  receiveCount + 1
                     receiveCount > 5  ------->  [DLQ] -> alarm
Ví dụ: xử lý p99 = 20 s -> visibility 60-120 s.
Lambda đọc SQS: AWS khuyên visibility >= 6 lần timeout của function.
~~~

### Phân biệt nhanh
| Dịch vụ | Mô hình | Giữ message | Replay | Throughput |
|---|---|---|---|---|
| SQS Standard | Queue | Mặc định 4 ngày, tối đa 14 ngày | Không | Rất cao, không thứ tự |
| SQS FIFO | Queue | Như trên | Không | Giới hạn theo message group, có thứ tự |
| SNS | Pub/sub | Không (trừ khi fan-out ra SQS) | Không | Rất cao |
| EventBridge | Event bus + rule | Archive có thể replay | Có (archive) | Cao, routing linh hoạt |
| Kinesis Data Streams | Stream | 24 giờ mặc định, tối đa 365 ngày | Có | Theo shard |
| MSK (Kafka) | Log phân tán | Theo retention | Có | Rất cao |

### SQS
- **Visibility timeout**: khi consumer nhận message, message bị ẩn trong khoảng này. Nếu xử lý xong trước, gọi delete; nếu không, message hiện lại và có thể được xử lý lần hai.
- Visibility timeout nên lớn hơn thời gian xử lý p99, nhưng không quá lớn để retry nhanh. Có thể gia hạn bằng {{ChangeMessageVisibility}} cho job dài.
- **Long polling** ({{WaitTimeSeconds}} 20) giảm empty receive và chi phí.
- **DLQ**: sau {{maxReceiveCount}}, message chuyển sang DLQ để điều tra, tránh poison message quay vòng mãi.
- **FIFO**: {{MessageGroupId}} đảm bảo thứ tự trong group; {{MessageDeduplicationId}} chống trùng trong 5 phút. Throughput thấp hơn standard và cần chọn group key đủ mịn để tránh nghẽn.

### Fan-out
Mẫu phổ biến: SNS topic → nhiều SQS queue (mỗi consumer một queue). Như vậy một sự kiện được nhiều service xử lý độc lập, và mỗi service có DLQ/retry riêng.
EventBridge hợp khi cần lọc theo nội dung sự kiện ({{source}}, {{detail-type}}, {{detail}}) hoặc nhận event từ SaaS; rule có thể đẩy tới Lambda, SQS, Step Functions.

### At-least-once và idempotency
- SQS standard, SNS, Kinesis đều có thể giao trùng. Không có exactly-once thực sự cho end-to-end.
- Consumer phải idempotent: dùng khoá nghiệp vụ (orderId + eventType) và bảng dedup, hoặc upsert có điều kiện.
- Đừng giả định thứ tự với standard queue; nếu cần thứ tự theo entity, dùng FIFO với {{MessageGroupId = entityId}}.

### Kinesis vs MSK
- Kinesis: managed hoàn toàn, shard-based, tích hợp sẵn với Lambda/Firehose; tốt cho telemetry, clickstream, ingest đơn giản.
- MSK: Kafka thật, hợp khi đội đã dùng Kafka, cần ecosystem Connect/Streams, hoặc nhiều consumer phức tạp. Vận hành nặng hơn (broker, storage, monitoring).

### Lỗi hay gặp
- **Visibility timeout ngắn hơn thời gian xử lý.** Triệu chứng: cùng một message được hai consumer xử lý song song, tạo bản ghi trùng và tăng tải DB. Cách tránh: đặt timeout lớn hơn p99 xử lý, gia hạn bằng {{ChangeMessageVisibility}} cho job dài.
- **Không có DLQ.** Triệu chứng: poison message retry vô hạn, đốt tiền và che mất lỗi thật. Cách tránh: redrive policy với maxReceiveCount 3–5, alarm khi DLQ có message.
- **Dùng SQS như event log cần replay.** Triệu chứng: muốn xử lý lại dữ liệu tuần trước nhưng message đã bị xoá sau khi ack. Cách tránh: chọn Kinesis, Kafka/MSK hoặc EventBridge archive.
- **FIFO với một message group duy nhất.** Triệu chứng: throughput tụt về một consumer, mất song song hoàn toàn. Cách tránh: chia group theo aggregate id, ví dụ {{MessageGroupId = orderId}}.

### Trả lời miệng 1 phút
"Tôi phân biệt theo mô hình: SQS là hàng đợi cho worker, mỗi message một consumer; SNS là pub/sub fan-out, thường kết hợp SNS tới nhiều SQS để mỗi service có hàng đợi và DLQ riêng; EventBridge là bus có routing theo nội dung sự kiện; Kinesis và MSK là log có thứ tự theo shard, giữ lại để replay. Với SQS, khi nhận message nó bị ẩn trong visibility timeout; xoá kịp thì xong, không thì message hiện lại và được giao lần nữa, quá maxReceiveCount thì vào DLQ. Vì vậy hệ thống là at-least-once, consumer bắt buộc idempotent bằng khoá nghiệp vụ hoặc bảng dedup. Cần thứ tự theo đơn hàng thì tôi dùng FIFO với message group theo orderId. Mọi consumer của tôi đều có DLQ, alarm theo tuổi message cũ nhất, và idempotency key."

> Senior tip: mọi consumer SQS nên có DLQ + alarm {{ApproximateNumberOfMessagesVisible}} + idempotency key. Khi sự cố, DLQ là nơi trả lời "message nào hỏng và vì sao" nhanh nhất.`,
  follow: [
    'Visibility timeout nên đặt bao lâu so với thời gian xử lý?',
    'Khi nào chọn Kinesis thay vì Kafka/MSK?',
    'Làm sao đảm bảo thứ tự xử lý theo từng đơn hàng mà vẫn song song?'
  ],
  tags: ['SQS', 'SNS', 'EventBridge', 'Kinesis', 'MSK']
},
{
  id: 'aws-009',
  topic: 'aws',
  level: 'lead',
  refs: [{"type": "doc", "title": "AWS Documentation", "url": "https://docs.aws.amazon.com/"}, {"type": "doc", "title": "AWS Well-Architected", "url": "https://aws.amazon.com/architecture/well-architected/"}],
  q: 'Thiết kế HA và DR: multi-AZ khác multi-region thế nào? RTO/RPO là gì và các chiến lược DR (backup, pilot light, warm standby, active-active) đánh đổi ra sao?',
  a: `**Tóm tắt:** multi-AZ bảo vệ trước lỗi một AZ trong cùng region, thường tự động và RTO phút; multi-region bảo vệ trước lỗi cả region, đắt và phức tạp hơn nhiều. RTO là thời gian chấp nhận mất dịch vụ, RPO là lượng dữ liệu chấp nhận mất. Chọn chiến lược DR theo hai con số này, không theo cảm tính.

### Hiểu nhanh
**Multi-AZ** giống cửa hàng có hai kho ở hai quận của cùng thành phố: một kho cháy thì kho kia phục vụ gần như ngay. **Multi-region** giống mở thêm chi nhánh ở thành phố khác: cứu được khi cả thành phố mất điện, nhưng đắt và khó đồng bộ hàng hoá. **RTO** là "bao lâu thì mở cửa lại được", **RPO** là "chấp nhận mất sổ sách của bao nhiêu phút cuối". Các chiến lược DR giống mức sẵn sàng của chi nhánh dự phòng: chỉ giữ bản sao giấy tờ (backup), có kho hàng nhưng chưa có nhân viên (pilot light), có một cửa hàng nhỏ đang mở (warm standby), hay hai cửa hàng cùng bán (active-active).

### Thuật ngữ
- **Region / AZ**: region là một vùng địa lý (ví dụ ap-southeast-1) gồm nhiều AZ cách nhau vài chục km, mỗi AZ có điện và mạng riêng.
- **Failover / failback**: chuyển dịch vụ sang hạ tầng dự phòng / chuyển ngược về hạ tầng chính sau sự cố.
- **Replication bất đồng bộ**: dữ liệu được chép sang nơi khác sau khi đã commit ở nơi chính, nên có thể mất phần chưa kịp chép.
- **Switchover**: chuyển vai trò có kế hoạch khi region chính còn sống, không mất dữ liệu.
- **Route 53 health check**: Route 53 gọi định kỳ tới endpoint; khi fail, bản ghi failover tự trỏ sang đích dự phòng.
- **DNS TTL**: thời gian client và resolver được phép cache bản ghi DNS.
- **Last-writer-wins**: khi hai region cùng ghi một item, bản ghi có thời điểm muộn hơn thắng, bản kia bị ghi đè.
- **Game day**: buổi diễn tập sự cố có kế hoạch trên hệ thống thật hoặc staging.

### Cơ chế từng bước: failover warm standby sang region phụ
1. **Phát hiện**: alarm và Route 53 health check thấy region chính lỗi liên tục nhiều phút. Vì sao không chuyển ngay: tránh failover vì lỗi thoáng qua; failover region có giá rất cao.
2. **Quyết định**: người trực xác nhận theo runbook, nhiều tổ chức yêu cầu người có thẩm quyền đồng ý.
3. **Promote database**: Aurora Global Database chuyển cluster ở region phụ thành writer. Nếu region chính còn sống thì dùng switchover (không mất dữ liệu); nếu đã chết thì failover, mất phần dữ liệu chưa kịp replicate, thường khoảng 1 giây.
4. **Scale app**: tăng desired count ở region phụ từ bản thu nhỏ lên đủ tải. Vì sao tốn phút: phải khởi động thêm task và JVM.
5. **Chuyển traffic**: Route 53 trỏ bản ghi sang region phụ; client nhận được sau khi hết DNS TTL.
6. **Kiểm tra và thông báo**, sau đó lập kế hoạch failback có kiểm soát.

~~~text
t=0      region chính lỗi
t=3'     alarm + health check fail 3 lần liên tiếp
t=10'    on-call xác nhận, mở runbook
t=12'    promote Aurora ở region phụ (mất ~1 giây dữ liệu cuối = RPO thực tế)
t=20'    ECS scale 2 -> 20 task
t=21'    Route 53 đổi bản ghi, TTL 60 s
t=23'    traffic về region phụ   => RTO thực tế ~23 phút
~~~

### Định nghĩa
- **RTO** (Recovery Time Objective): mục tiêu thời gian khôi phục. Ví dụ RTO 15 phút nghĩa là hệ phải chạy lại trong 15 phút.
- **RPO** (Recovery Point Objective): mục tiêu mất dữ liệu tối đa. RPO 5 phút nghĩa là có thể mất 5 phút dữ liệu cuối.
- Hai số này do business quyết định, kỹ thuật chỉ nói chi phí để đạt.

### Multi-AZ trong một region
- RDS Multi-AZ, Aurora nhiều AZ, ALB trải nhiều AZ, ASG trải nhiều AZ, S3 vốn đã nhiều AZ.
- Xử lý: mất một AZ, failover DB, load balancer chuyển traffic.
- Không xử lý: mất cả region, lỗi cấu hình lan rộng, tấn công vào control plane region.
- Chi phí: chủ yếu là gấp đôi hạ tầng DB và một số thành phần; app vẫn scale bình thường.

### Các chiến lược DR
| Chiến lược | Mô tả | RTO điển hình | RPO | Chi phí |
|---|---|---|---|---|
| Backup & restore | Chỉ backup sang region khác, dựng lại khi cần | Giờ đến ngày | Giờ | Thấp nhất |
| Pilot light | Core (DB, data) chạy nóng ở region phụ, app tắt | Hàng chục phút đến giờ | Phút | Thấp–trung bình |
| Warm standby | Bản thu nhỏ chạy đầy đủ ở region phụ | Phút | Giây–phút | Trung bình–cao |
| Active-active | Cả hai region phục vụ traffic | Gần 0 | Gần 0 | Cao nhất |

### Thực hành
- **Aurora Global Database** replicate storage sang region phụ, RPO khoảng 1 giây; có thể promote region phụ.
- **DynamoDB global tables** cho active-active, nhưng phải chấp nhận last-writer-wins và xử lý xung đột ở tầng ứng dụng.
- **Route 53** failover routing với health check; hoặc latency routing cho active-active.
- **S3 Cross-Region Replication** cho object; lưu ý replication không đồng bộ và có thể không replicate xoá nếu không bật.
- **Infrastructure as Code** phải dựng được region phụ từ đầu; nếu phải làm tay thì DR không tồn tại.
- Diễn tập định kỳ (game day): chuyển region thật, đo RTO thật, ghi lại các bước còn thiếu.

### Lỗi hay gặp
- **Có backup nhưng chưa bao giờ restore thử.** Triệu chứng: đến lúc cần mới biết snapshot thiếu quyền KMS ở region phụ hoặc restore mất 6 giờ thay vì 1. Cách tránh: tự động restore định kỳ và đo thời gian; backup chưa kiểm chứng là chưa có backup.
- **DNS TTL dài.** Triệu chứng: hạ tầng region phụ đã sẵn sàng nhưng client vẫn gọi region cũ thêm hàng chục phút. Cách tránh: đặt TTL thấp (30–60 giây) cho bản ghi failover.
- **Cấu hình region phụ lệch.** Triệu chứng: khi failover mới phát hiện thiếu IAM role, secret, security group, hoặc quota/service limit chưa xin tăng. Cách tránh: dựng region phụ hoàn toàn bằng IaC, kiểm tra quota định kỳ, diễn tập thật.
- **Active-active mà dữ liệu không partition theo region.** Triệu chứng: xung đột ghi, dữ liệu bị ghi đè theo last-writer-wins, chi phí cross-region tăng vọt. Cách tránh: chia dữ liệu theo region "chủ" (ví dụ theo khách hàng), hoặc chọn warm standby.

### Trả lời miệng 1 phút
"Multi-AZ bảo vệ khỏi mất một datacenter trong region, thường tự động và RTO tính bằng phút; multi-region bảo vệ khỏi mất cả region nhưng đắt và phức tạp hơn nhiều. Tôi luôn bắt đầu từ hai con số do business ký: RTO là thời gian được phép ngừng dịch vụ, RPO là lượng dữ liệu được phép mất. Từ đó chọn chiến lược rẻ nhất đáp ứng: backup and restore tính bằng giờ, pilot light giữ dữ liệu nóng ở region phụ, warm standby chạy bản thu nhỏ đầy đủ, active-active gần như không gián đoạn nhưng phải xử lý xung đột ghi. Về công cụ tôi dùng Aurora Global Database với RPO khoảng một giây, Route 53 failover, IaC để dựng region phụ. Kinh nghiệm của tôi là DR chỉ tồn tại khi đã diễn tập và đo RTO thật."

> Senior tip: hãy bắt đầu bằng RTO/RPO do business ký, rồi chọn chiến lược rẻ nhất đáp ứng. Đa số hệ thống không cần active-active; warm standby + IaC + diễn tập 6 tháng/lần thường là điểm cân bằng tốt hơn nhiều so với chi phí gấp đôi hạ tầng chạy song song.`,
  follow: [
    'Vì sao backup chưa restore thử thì chưa được coi là DR?',
    'Aurora Global Database cho RPO bao nhiêu và failover gồm những bước nào?',
    'Active-active gặp xung đột ghi thì xử lý ở tầng nào?'
  ],
  tags: ['HA', 'DR', 'RTO', 'RPO', 'multi-region']
},
{
  id: 'aws-010',
  topic: 'aws',
  level: 'senior',
  q: 'Auto Scaling, ALB vs NLB, health check và graceful shutdown: làm sao để scale-in không làm rơi request?',
  a: `**Tóm tắt:** ALB hiểu HTTP/HTTPS (path, host, header) và phù hợp web API; NLB hiểu TCP/UDP, độ trễ cực thấp, giữ IP tĩnh. Auto Scaling thêm/bớt instance dựa trên metric, nhưng scale-in chỉ an toàn khi kết hợp deregistration delay, health check đúng và graceful shutdown trong ứng dụng.

### Hiểu nhanh
Load balancer giống nhân viên điều phối ở cửa nhà hàng, chia khách cho các bàn phục vụ (instance/task). **ALB** đọc được "phiếu order" (HTTP: path, host, header) nên đưa được khách gọi {{/payments}} sang khu riêng; **NLB** chỉ đếm người đi qua cửa (TCP/UDP) nhưng cực nhanh và có địa chỉ cố định. **Auto Scaling** là quản lý gọi thêm hoặc cho bớt nhân viên theo lượng khách. Cho nhân viên về đúng cách (scale-in an toàn) nghĩa là: ngừng xếp khách mới cho họ, đợi họ phục vụ xong bàn đang ăn, rồi mới cho về; không được kéo họ đi giữa lúc đang bưng món.

### Thuật ngữ
- **Target group**: nhóm đích (instance, IP, task) mà load balancer chuyển traffic tới, kèm cấu hình health check.
- **Deregistration delay (connection draining)**: thời gian LB ngừng gửi request mới nhưng vẫn chờ request đang chạy hoàn tất.
- **SIGTERM / SIGKILL**: SIGTERM là "xin hãy dừng" (app được dọn dẹp); SIGKILL là dừng cưỡng bức ngay lập tức.
- **Liveness / readiness**: liveness hỏi "có cần restart không", readiness hỏi "có nhận traffic được không"; Spring Boot Actuator có sẵn {{/actuator/health/liveness}} và {{/actuator/health/readiness}}.
- **Target tracking**: chính sách scale giữ một metric quanh giá trị mục tiêu, ví dụ CPU 60%.
- **Cooldown**: khoảng chờ sau mỗi lần scale để metric ổn định trước khi quyết định tiếp.
- **Flapping**: scale ra rồi vào liên tục vì ngưỡng quá sát nhau.
- **preStop hook**: lệnh Kubernetes chạy trước khi gửi SIGTERM cho container.

### Cơ chế từng bước: ECS scale-in một task sau ALB
1. Auto Scaling thấy CPU dưới mục tiêu đủ lâu, giảm desired count. Vì sao chậm hơn scale-out: cooldown scale-in dài để tránh flapping.
2. ECS chọn một task, deregister nó khỏi target group. ALB ngừng gửi request **mới**, target chuyển sang trạng thái draining.
3. ECS chờ hết deregistration delay (ví dụ 30 giây) để request đang chạy hoàn tất.
4. ECS gửi SIGTERM. Spring Boot graceful shutdown ngừng nhận request, chờ request dở tối đa {{timeout-per-shutdown-phase}}, đóng pool rồi thoát.
5. Nếu sau {{stopTimeout}} (mặc định 30 giây, trên Fargate tối đa 120 giây) container chưa thoát, ECS gửi SIGKILL. Vì sao phải khớp các con số: SIGKILL cắt ngang request, client thấy 502 hoặc connection reset.

~~~text
ECS + ALB (delay 30 s, stopTimeout 30 s, Spring timeout 20 s)
t=0      deregister -> ALB ngừng gửi request mới
t=0-30s  request cũ chạy nốt (draining)
t=30s    SIGTERM -> Spring từ chối request mới, chờ request dở <= 20 s
t=31s    app thoát sạch                    (SIGKILL nếu tới t=60 s chưa thoát)
Kubernetes: SIGTERM và việc gỡ pod khỏi endpoint diễn ra CÙNG LÚC
  -> preStop sleep 5-10 s để LB kịp gỡ pod trước khi app ngừng nhận request
~~~

### ALB vs NLB
| Tiêu chí | ALB | NLB |
|---|---|---|
| Tầng | L7 (HTTP/HTTPS, gRPC) | L4 (TCP/UDP/TLS) |
| Routing | Host, path, header, method | Chỉ theo port/protocol |
| IP tĩnh | Không (dùng DNS) | Có, hỗ trợ Elastic IP |
| WebSocket | Có | Có ở tầng TCP |
| Latency | Cao hơn một chút | Rất thấp |
| Dùng khi | Web/API, microservices path-based | Database proxy, IoT, game, cần IP tĩnh hoặc throughput lớn |

ALB phù hợp đa số backend Spring Boot. NLB hay dùng khi cần giữ IP tĩnh cho đối tác, hoặc chạy Kafka/DB proxy, hoặc cần hàng triệu kết nối đồng thời.

### Health check
- ALB health check gọi một endpoint nhẹ, ví dụ {{/health}}, trả 200 khi app sẵn sàng nhận traffic.
- Đừng để health check phụ thuộc DB một cách cứng: DB chậm thoáng qua làm cả fleet bị đánh dấu unhealthy và bị loại khỏi LB, biến sự cố nhỏ thành sập toàn hệ.
- Ngược lại, health check quá lỏng khiến traffic vào instance đang hỏng.
- Phân biệt **liveness** (có cần restart không) và **readiness** (có nhận traffic không). Với ECS/K8s, readiness quan trọng hơn.

~~~yaml
HealthCheckPath: /health/ready
HealthCheckIntervalSeconds: 15
HealthCheckTimeoutSeconds: 5
HealthyThresholdCount: 2
UnhealthyThresholdCount: 3
~~~

### Graceful shutdown
- Khi scale-in, ECS/K8s gửi tín hiệu dừng; app phải ngừng nhận request mới, hoàn thành request đang chạy, đóng pool, rồi thoát.
- Spring Boot: bật {{server.shutdown=graceful}} (mặc định từ Boot 3.4) và {{spring.lifecycle.timeout-per-shutdown-phase=30s}}.
- Với ECS, đặt {{stopTimeout}} đủ lớn; với Kubernetes, {{terminationGracePeriodSeconds}} và {{preStop}} sleep để LB kịp deregister.
- **Deregistration delay** của target group (mặc định 300 giây) là thời gian draining cho request đang chạy. Với ECS, task được deregister và chờ hết delay rồi mới nhận SIGTERM, nên delay 300 giây chỉ làm deploy/scale-in chậm. Với Kubernetes, pod nhận SIGTERM song song với việc bị gỡ khỏi LB, nên cần {{preStop}} sleep vài giây để không nhận request mới khi đang tắt. Thực tế hay đặt 20–60 giây và tăng nếu request dài.

### Auto Scaling
- Target tracking là cách dễ nhất: giữ CPU khoảng 60–70%, hoặc ALB {{RequestCountPerTarget}}, hoặc custom metric (độ sâu queue).
- Scale-out nên nhanh (cooldown ngắn), scale-in chậm (cooldown dài) để tránh flapping.
- Với workload theo lịch, dùng scheduled scaling. Với workload đột biến, cân nhắc warm pool hoặc giữ min capacity đủ lớn.
- **Không scale theo memory** nếu memory không tương quan tải; ưu tiên metric phản ánh tải thực (RPS, queue depth).

### Lỗi hay gặp
- **Connection pool nhân theo số instance.** Triệu chứng: scale 5 lên 50 instance làm cạn {{max_connections}}, DB từ chối kết nối đúng lúc tải cao. Cách tránh: pool nhỏ (10–20), RDS Proxy/PgBouncer, đặt max capacity của ASG theo sức chịu của DB.
- **Health check gọi endpoint có query DB nặng.** Triệu chứng: health check tự tạo tải, DB chậm thoáng qua làm cả fleet unhealthy. Cách tránh: readiness nhẹ, chỉ kiểm tra thứ app thật sự cần, không phụ thuộc cứng vào DB.
- **Chỉ scale app mà không scale downstream.** Triệu chứng: SQS consumer tăng gấp 10 nhưng DB bị khoá, mọi thứ chậm hơn trước. Cách tránh: giới hạn concurrency của consumer, scale theo năng lực của tầng chậm nhất.
- **Quên connection draining và graceful shutdown khi deploy.** Triệu chứng: user thấy lỗi 502 lẻ tẻ mỗi lần deploy hoặc scale-in. Cách tránh: bật {{server.shutdown=graceful}}, deregistration delay 20–60 giây, stopTimeout lớn hơn timeout của Spring.

### Trả lời miệng 1 phút
"ALB là load balancer tầng 7, hiểu HTTP nên route theo path, host, header, hợp cho API Spring Boot; NLB là tầng 4, độ trễ rất thấp, có IP tĩnh, hợp khi đối tác cần whitelist IP hoặc giao thức không phải HTTP. Auto Scaling tôi dùng target tracking theo CPU hoặc request mỗi target, scale-out nhanh, scale-in chậm. Để scale-in không rơi request, ba thứ phải khớp nhau: target group deregistration delay để LB ngừng gửi request mới và chờ request cũ, graceful shutdown trong Spring Boot để app xử lý nốt khi nhận SIGTERM, và stopTimeout của ECS hoặc terminationGracePeriod của Kubernetes đủ dài trước khi bị SIGKILL; trên Kubernetes thêm preStop sleep vài giây. Health check thì nhẹ và không phụ thuộc cứng vào DB. Tôi luôn kiểm chứng bằng cách giảm desired count trong lúc bắn tải và xem có 5xx không."

> Senior tip: luôn test scale-in bằng cách giảm desired count trong lúc bắn tải. Nếu thấy lỗi 5xx lẻ tẻ khi scale, nguyên nhân gần như chắc chắn là deregistration delay + graceful shutdown chưa khớp, không phải code logic.`,
  follow: [
    'Vì sao health check phụ thuộc DB có thể gây sập toàn hệ?',
    'Deregistration delay nên đặt bao lâu so với thời gian xử lý request?',
    'Khi nào chọn NLB thay vì ALB?'
  ],
  tags: ['Auto Scaling', 'ALB', 'NLB', 'health check', 'graceful shutdown']
},
{
  id: 'aws-011',
  topic: 'aws',
  level: 'mid',
  q: 'ElastiCache Redis dùng cho những bài toán nào? Cluster mode, eviction policy và các lỗi thường gặp trên production?',
  a: `**Tóm tắt:** Redis là in-memory store dùng cho cache, session, rate limit, distributed lock, leaderboard. ElastiCache cung cấp bản managed (engine Redis OSS hoặc Valkey, fork mã nguồn mở tương thích Redis và rẻ hơn). Cluster mode cho phép chia shard dữ liệu để vượt giới hạn bộ nhớ/throughput của một node; eviction quyết định Redis xử lý gì khi đầy bộ nhớ.

### Hiểu nhanh
Redis giống cái bàn làm việc ngay cạnh bạn, còn database giống kho hồ sơ dưới tầng hầm: lấy từ bàn mất chưa tới một mili giây, xuống kho mất lâu hơn nhiều. Vì bàn nhỏ (RAM đắt), bạn chỉ để những hồ sơ hay dùng, và khi bàn đầy phải quyết định bỏ bớt cái nào: đó là **eviction**. **Cluster mode** giống ghép nhiều bàn lại, mỗi bàn giữ một phần hồ sơ theo quy tắc chia cố định (hash slot). **ElastiCache** là dịch vụ "thuê bàn có người lau dọn": AWS lo cài đặt, replica, failover, vá lỗi.

### Thuật ngữ
- **TTL**: thời gian sống của key; hết hạn thì Redis tự xoá.
- **Cache-aside**: app tự đọc cache, miss thì đọc DB rồi ghi vào cache.
- **Hash slot**: Redis Cluster chia không gian key thành 16.384 slot theo CRC16(key) mod 16384; mỗi shard giữ một dải slot.
- **Hash tag**: phần tên key đặt trong cặp ngoặc nhọn; chỉ phần này được băm, nhờ đó nhiều key rơi vào cùng slot.
- **Replica / failover**: bản sao của primary; khi primary chết, replica được promote thay thế.
- **maxmemory / eviction policy**: ngưỡng bộ nhớ tối đa và quy tắc chọn key để xoá khi chạm ngưỡng.
- **LRU / LFU**: xoá key lâu chưa được dùng nhất / xoá key được dùng ít lần nhất.
- **Valkey**: fork mã nguồn mở của Redis, tương thích giao thức, ElastiCache hỗ trợ với giá thấp hơn.

### Cơ chế từng bước: cache-aside cho trang sản phẩm
1. App gọi {{GET product:42}}. Hit thì trả ngay (khoảng 1 ms). Vì sao nhanh: dữ liệu nằm trong RAM, cùng VPC với app.
2. Miss thì query DB (khoảng 20 ms).
3. Ghi lại {{SET product:42 <json> EX 300}}, TTL 5 phút cộng thêm vài chục giây ngẫu nhiên (jitter). Vì sao có TTL: giới hạn thời gian dữ liệu cũ tồn tại; vì sao jitter: tránh hàng loạt key hết hạn cùng lúc.
4. Khi sản phẩm được cập nhật: ghi DB trước rồi **xoá** key (DEL) thay vì ghi đè. Vì sao: lần đọc sau tự nạp bản mới, tránh race hai luồng ghi đè giá trị cũ lên giá trị mới.
5. Ở cluster mode, client băm key ra slot, gửi thẳng tới shard giữ slot đó; nếu bản đồ slot đổi (failover, resharding), shard trả lỗi MOVED và client cập nhật bản đồ.

~~~text
1.000 request/s đọc sản phẩm, DB 20 ms, Redis 1 ms, hit rate 95%
  Không cache : 1.000 query/s vào DB
  Có cache    : 50 query/s vào DB
                latency TB = 0,95 x 1 + 0,05 x (1 + 20) ~ 2 ms
Cluster 3 shard:
  slot 0-5460 -> shard 1 | 5461-10922 -> shard 2 | 10923-16383 -> shard 3
~~~

### Use case
- **Cache-aside**: app đọc Redis trước, miss thì đọc DB rồi ghi lại với TTL. Phổ biến nhất, dễ hiểu, dễ sai nếu TTL không hợp lý.
- **Session store**: session chia sẻ giữa nhiều instance, TTL theo thời gian đăng nhập.
- **Rate limiting**: dùng INCR + EXPIRE hoặc Lua script để atomic.
- **Distributed lock**: Redisson hoặc SET NX PX; cẩn thận với split-brain và thời gian giữ lock.
- **Leaderboard/queue nhẹ**: sorted set, list.

### Cluster mode
- **Disabled**: một primary + replica, dữ liệu nằm trọn một shard. Đơn giản, phù hợp dataset vừa.
- **Enabled**: dữ liệu chia theo hash slot (16.384 slot) trên nhiều shard, mỗi shard có replica. Tăng bộ nhớ và throughput theo chiều ngang.
- Cluster mode yêu cầu client hỗ trợ cluster (Lettuce có, Jedis có). Một số lệnh multi-key chỉ chạy khi key cùng slot, nên dùng hash tag bằng cách đặt phần chung (ví dụ tiền tố user:42) trong cặp ngoặc nhọn ở đầu key.
- **Không tự động re-shard** khi thêm node theo cách trong suốt hoàn toàn; cần online resharding và client cấu hình đúng.

### Eviction
Khi {{maxmemory}} đạt ngưỡng, policy quyết định:
| Policy | Hành vi |
|---|---|
| noeviction | Từ chối ghi, trả lỗi OOM (mặc định của Redis OSS tự cài; parameter group mặc định của ElastiCache dùng volatile-lru) |
| allkeys-lru | Xoá key ít dùng gần đây nhất, mọi key |
| volatile-lru | Chỉ xoá key có TTL |
| allkeys-lfu | Xoá key ít dùng nhất (tần suất) |
| volatile-ttl | Xoá key sắp hết hạn |

Với cache thuần, {{allkeys-lru}} hoặc {{allkeys-lfu}} thường hợp. Nếu Redis vừa cache vừa giữ dữ liệu không được mất (lock, session), dùng {{volatile-*}} và đảm bảo key quan trọng không có TTL — nhưng tốt nhất tách cluster.

### Lỗi hay gặp
- **Cache stampede.** Triệu chứng: một key nóng hết hạn, hàng nghìn request cùng miss và đồng loạt đập vào DB, DB quá tải. Cách tránh: mutex/lock khi rebuild, TTL jitter, hoặc làm mới trước khi hết hạn.
- **Big key và hot key.** Triệu chứng: một key chứa hàng trăm nghìn phần tử làm thao tác block Redis; một key nhận phần lớn traffic khiến một shard nghẽn dù cluster còn rảnh. Cách tránh: chia nhỏ big key; với hot key thêm local cache (Caffeine) hoặc nhân bản key.
- **Dùng {{KEYS *}} trên production.** Triệu chứng: Redis đơn luồng bị block toàn bộ, mọi request timeout. Cách tránh: dùng {{SCAN}} theo lô.
- **Không đặt TTL.** Triệu chứng: bộ nhớ đầy dần, eviction bắt đầu xoá cả dữ liệu quan trọng. Cách tránh: mọi key cache đều có TTL, theo dõi metric bộ nhớ và Evictions.
- **Coi Redis là database bền vững.** Triệu chứng: mất node làm mất dữ liệu chưa persist. Cách tránh: backup/AOF không thay thế DB giao dịch; dữ liệu gốc phải nằm ở DB.

### Trả lời miệng 1 phút
"Redis là kho dữ liệu trong RAM, tôi dùng cho cache, session, rate limit, distributed lock và leaderboard; trên AWS tôi dùng ElastiCache với engine Redis OSS hoặc Valkey. Mẫu phổ biến nhất là cache-aside: đọc cache, miss thì đọc DB rồi ghi lại với TTL có jitter, cập nhật thì ghi DB rồi xoá key. Khi dữ liệu hoặc throughput vượt một node, tôi bật cluster mode: key được băm vào 16.384 hash slot chia trên nhiều shard, đổi lại lệnh nhiều key phải cùng slot nhờ hash tag. Khi đầy bộ nhớ, eviction policy quyết định: cache thuần thì allkeys-lru hoặc allkeys-lfu, còn dữ liệu không được mất thì nên tách cluster riêng. Kinh nghiệm của tôi là phải trả lời trước ba câu: TTL bao lâu, khi nào invalidate, và app sống ra sao khi Redis chết."

> Senior tip: mọi cache phải trả lời được ba câu: TTL bao lâu, khi nào invalidate, và điều gì xảy ra khi Redis chết. Nếu app không chịu được Redis chết, đó không còn là cache mà là dependency bắt buộc — phải thiết kế HA và có fallback.`,
  follow: [
    'Cache stampede là gì và có những cách nào để tránh?',
    'Vì sao dùng KEYS trên production là nguy hiểm?',
    'Khi nào nên bật cluster mode thay vì tăng instance size?'
  ],
  tags: ['ElastiCache', 'Redis', 'eviction', 'cache']
},
{
  id: 'aws-012',
  topic: 'aws',
  level: 'senior',
  q: 'Observability trên AWS cho hệ Java: CloudWatch logs/metrics/alarms đủ chưa, X-Ray và OpenTelemetry bổ sung gì, làm sao tránh chi phí log?',
  a: `**Tóm tắt:** CloudWatch là nền tảng log/metric/alarm mặc định của AWS; X-Ray theo dấu request phân tán; OpenTelemetry là chuẩn mở để instrument và gửi trace/metric/log tới backend bất kỳ. Ba trụ cột là logs, metrics, traces — thiếu trace thì debug hệ microservices rất chậm.

### Hiểu nhanh
Observability giống bộ ba dụng cụ của bác sĩ. **Metrics** là các chỉ số sinh tồn (nhịp tim, huyết áp): nhìn nhanh biết có bệnh hay không. **Logs** là sổ khám bệnh ghi chi tiết từng sự việc. **Traces** là ảnh chụp đường đi của một mũi thuốc qua từng cơ quan: một request đi qua những service nào, chậm ở đâu. Thiếu trace thì giống chỉ biết bệnh nhân sốt mà không biết ổ viêm nằm ở đâu. **CloudWatch** là bệnh viện mặc định của AWS, **X-Ray** là máy chụp đường đi, còn **OpenTelemetry** là chuẩn chung để mọi máy móc nói cùng một ngôn ngữ.

### Thuật ngữ
- **Log group / log stream**: log group là nhóm log theo service và môi trường; log stream là luồng log của từng task/instance.
- **EMF (Embedded Metric Format)**: in một dòng log JSON đúng định dạng, CloudWatch tự tách thành metric mà không cần gọi API.
- **Span / trace**: span là một đoạn công việc (gọi DB, gọi HTTP); trace là cây các span của cùng một request.
- **Trace context propagation**: truyền trace ID qua header (chuẩn W3C {{traceparent}}) để service sau nối tiếp cùng trace.
- **Sampling (head/tail)**: chỉ giữ một phần trace; head quyết định ngay từ đầu request, tail quyết định sau khi biết request lỗi hay chậm.
- **OTel Collector / ADOT**: tiến trình nhận, xử lý, gửi telemetry; ADOT là bản phân phối OpenTelemetry của AWS.
- **MDC**: Mapped Diagnostic Context của SLF4J/Logback, nơi đặt trace ID để mọi dòng log tự kèm theo.
- **SLO**: mục tiêu chất lượng dịch vụ đo được, ví dụ 99,9% request dưới 500 ms.

### Cơ chế từng bước: từ một request tới lúc người trực tìm ra nguyên nhân
1. Request vào order-service; agent OTel (hoặc Micrometer Tracing) tạo trace ID và span gốc. Vì sao tự động: agent bọc sẵn Spring MVC, JDBC, HTTP client.
2. Khi order-service gọi payment-service, trace ID đi theo header {{traceparent}}, nên span bên kia gắn vào cùng trace.
3. Trace ID được đặt vào MDC, mọi dòng log JSON của request đều có trường {{trace_id}}.
4. Collector gom span theo lô, áp sampling, gửi tới X-Ray hoặc backend khác; log đi tới CloudWatch Logs; metric đi qua EMF hoặc Micrometer.
5. Alarm trên metric (p99, tỉ lệ 5xx) vượt ngưỡng thì gửi SNS tới người trực.
6. Người trực mở Logs Insights lọc dòng ERROR, lấy {{trace_id}}, mở trace và thấy ngay span nào chậm.

~~~text
Client -> ALB -> order-service ----------> payment-service ----> RDS
                 span A 900 ms            span B 850 ms          span C 800 ms
Log order  : {"level":"ERROR","trace_id":"4bf92f...","msg":"payment timeout"}
Log payment: {"level":"WARN","trace_id":"4bf92f...","msg":"slow query"}
=> từ 1 dòng log lỗi -> trace_id -> trace -> span C (query DB) là thủ phạm
Chi phí log ước lượng: 20 task x 2 GB/ngày x 30 ngày = 1.200 GB
  x ~0,5 USD/GB ingest  = ~600 USD/tháng, chưa tính lưu trữ
~~~

Lưu ý hiện hành: với dự án mới, AWS khuyến nghị instrument bằng OpenTelemetry (ADOT, CloudWatch agent) thay cho X-Ray SDK/daemon cũ; X-Ray vẫn là nơi xem trace.

### CloudWatch
- **Logs**: Log group theo service/môi trường, log stream theo task/instance. Có Logs Insights để query.
- **Metrics**: metric chuẩn của AWS (CPU, ALB 5xx, SQS depth) và custom metric qua EMF (Embedded Metric Format) hoặc PutMetricData.
- **Alarms**: so metric với ngưỡng, gửi SNS, trigger Auto Scaling. Composite alarm để giảm nhiễu.
- **Dashboard**: gom metric quan trọng theo dịch vụ.

### Metrics quan trọng cho API Java
- ALB: {{TargetResponseTime}} p99, {{HTTPCode_Target_5XX_Count}}, {{UnhealthyHostCount}}, {{RequestCountPerTarget}}.
- JVM: heap used, GC pause, thread count (qua Micrometer/CloudWatch agent).
- Business: đơn tạo thành công, tỉ lệ thanh toán lỗi — thứ mà hạ tầng không thấy.
- SQS: {{ApproximateAgeOfOldestMessage}} (quan trọng hơn số message), DLQ depth.

### X-Ray và OpenTelemetry
- **X-Ray** nhận trace từ SDK/agent; hiển thị service map, thời gian từng segment, lỗi. Có sampling để giảm chi phí.
- **OpenTelemetry (OTel)** là API/SDK/collector chuẩn mở; Java dùng agent hoặc Micrometer Tracing. Có thể gửi tới X-Ray, Jaeger, Tempo, Datadog…
- Với Spring Boot 3, Micrometer Observation là abstraction; thêm {{micrometer-tracing-bridge-otel}} và exporter tương ứng.
- **Correlation ID**: đưa trace ID vào log (MDC) để nối log và trace. Không có nó, log rời rạc rất khó ghép.

~~~yaml
# Ví dụ cấu hình OTel qua biến môi trường
OTEL_SERVICE_NAME: order-service
OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317
OTEL_TRACES_SAMPLER: parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG: "0.1"
~~~

### Kiểm soát chi phí log
- Log ingestion tính tiền theo GB; log debug ở production là khoản chi lớn nhất nhiều đội gặp.
- Đặt retention theo log group (7–30 ngày cho app, dài hơn cho audit).
- Lọc trước khi gửi: chỉ gửi WARN/ERROR, hoặc sample log DEBUG.
- Không log payload đầy đủ (request body, token); vừa tốn tiền vừa rò rỉ dữ liệu.
- Dùng metric filter thay vì lưu mọi dòng để đếm lỗi.

### Lỗi hay gặp
- **Alarm chỉ dựa trên CPU.** Triệu chứng: hệ "chết" vì DB connection pool cạn trong khi CPU thấp, không alarm nào kêu. Cách tránh: alarm theo triệu chứng người dùng thấy: p99 latency, tỉ lệ 5xx, tuổi message cũ nhất.
- **Không có SLO/alarm theo user impact.** Triệu chứng: biết sự cố sau khi khách phàn nàn. Cách tránh: định nghĩa SLO, alarm theo tốc độ đốt error budget.
- **Trace sampling 100% ở traffic lớn.** Triệu chứng: chi phí trace và overhead tăng mạnh. Cách tránh: head sampling 5–10% cộng tail sampling giữ mọi trace lỗi hoặc chậm.
- **Log thiếu timestamp chuẩn, trace ID, service name.** Triệu chứng: lúc sự cố không ghép được log giữa các service. Cách tránh: log JSON có trường cố định, trace ID qua MDC.
- **Dashboard quá nhiều biểu đồ và log debug ở production.** Triệu chứng: không ai nhìn dashboard, còn hoá đơn log là khoản lớn nhất. Cách tránh: 5–8 chỉ số sức khoẻ; retention theo log group, chỉ gửi WARN/ERROR hoặc sample DEBUG, dùng log class Infrequent Access cho log ít truy vấn.

### Trả lời miệng 1 phút
"Observability có ba trụ cột: metrics để biết có vấn đề, logs để biết chi tiết, traces để biết vấn đề nằm ở service nào. Trên AWS, CloudWatch lo log, metric và alarm; với hệ microservices tôi thêm tracing bằng OpenTelemetry, trace ID truyền qua header traceparent và được đặt vào MDC để mọi dòng log nối được với trace, rồi xuất sang X-Ray hoặc backend khác. CloudWatch một mình đủ cho hệ nhỏ, nhưng thiếu trace thì debug microservices rất chậm. Về chi phí, log ingestion tính theo GB nên tôi đặt retention cho từng log group, không log payload, chỉ gửi WARN và ERROR ở production, và sample trace thay vì giữ 100%. Alarm tôi đặt theo SLO người dùng như p99 và tỉ lệ 5xx, không theo CPU."

> Senior tip: bắt đầu từ SLO của người dùng (ví dụ 99,9% request < 500 ms), rồi chọn metric/alarm phản ánh SLO đó. Observability không phải "cài agent cho có"; nó là khả năng trả lời câu hỏi mới trong vài phút thay vì vài giờ.`,
  follow: [
    'Vì sao alarm theo CPU thường không phản ánh sự cố thật?',
    'Trace ID nên được đưa vào log như thế nào trong Spring Boot?',
    'Những cách nào giảm chi phí CloudWatch Logs mà không mất khả năng điều tra?'
  ],
  tags: ['CloudWatch', 'X-Ray', 'OpenTelemetry', 'observability']
},
{
  id: 'aws-013',
  topic: 'aws',
  level: 'senior',
  q: 'Secrets Manager khác Parameter Store thế nào? KMS envelope encryption hoạt động ra sao và ứng dụng Java nên lấy secret lúc nào?',
  a: `**Tóm tắt:** Parameter Store là nơi lưu cấu hình và secret đơn giản, rẻ, có SecureString mã hoá bằng KMS; Secrets Manager chuyên cho secret cần xoay vòng tự động, tích hợp RDS/Redshift, có phiên bản và replication. KMS envelope encryption dùng một data key để mã hoá dữ liệu, còn data key được mã hoá bởi KMS key.

### Hiểu nhanh
**Parameter Store** giống bảng thông báo nội bộ có vài ngăn khoá: dán cấu hình thì tiện, cất vài mật khẩu đơn giản cũng được. **Secrets Manager** giống két sắt có thủ quỹ: tự đổi mã két định kỳ (rotation), ghi lại ai mở, giữ cả mã cũ và mã mới trong lúc chuyển giao. **KMS envelope encryption** giống việc khoá tài liệu bằng một chìa nhỏ, rồi bỏ chìa nhỏ đó vào một phong bì chỉ ngân hàng (KMS) mới mở được: tài liệu nặng không phải gửi tới ngân hàng, chỉ cái chìa nhỏ đi qua.

### Thuật ngữ
- **KMS key (trước gọi là CMK)**: khoá chính nằm trong HSM của KMS, không bao giờ rời KMS ở dạng rõ.
- **Data key**: khoá AES sinh ra để mã hoá dữ liệu thật; được lưu ở dạng đã mã hoá bởi KMS key.
- **Envelope encryption**: mã hoá dữ liệu bằng data key, rồi mã hoá data key bằng KMS key.
- **Encryption context**: cặp key-value bắt buộc khớp khi giải mã, đồng thời được ghi vào CloudTrail để audit.
- **SecureString**: kiểu tham số của Parameter Store được mã hoá bằng KMS.
- **Staging label**: nhãn trỏ vào phiên bản secret: AWSCURRENT (đang dùng), AWSPENDING (đang xoay), AWSPREVIOUS (bản trước).
- **Rotation**: quy trình tự đổi secret định kỳ bằng Lambda hoặc managed rotation.
- **Key policy**: resource policy gắn trên KMS key, quyết định ai quản trị và ai được dùng key.

### Cơ chế từng bước
**Envelope encryption:**
1. App gọi {{GenerateDataKey}} với id của KMS key. KMS trả về data key dạng rõ và cùng data key đó đã được mã hoá. Vì sao: KMS key không rời KMS, chỉ data key đi ra.
2. App mã hoá dữ liệu bằng data key dạng rõ (AES-GCM) ngay trong bộ nhớ, rồi xoá data key dạng rõ.
3. App lưu cạnh nhau: data key đã mã hoá và ciphertext.
4. Khi đọc: gọi {{Decrypt}} với data key đã mã hoá, nhận lại data key dạng rõ, giải mã dữ liệu. Vì sao nhanh: chỉ vài trăm byte đi qua KMS, dữ liệu 100 MB vẫn giải mã cục bộ.

**Rotation của Secrets Manager (mật khẩu RDS):**
1. createSecret: sinh mật khẩu mới, gắn nhãn AWSPENDING.
2. setSecret: đặt mật khẩu mới vào database.
3. testSecret: thử đăng nhập bằng bản AWSPENDING.
4. finishSecret: chuyển AWSCURRENT sang bản mới, bản cũ thành AWSPREVIOUS. Vì sao app cache lâu bị lỗi: với chiến lược single user, mật khẩu cũ mất hiệu lực ngay ở bước 2; chiến lược alternating users giữ user cũ dùng được tới lần xoay sau.

~~~text
Mã hoá:  App --GenerateDataKey--> KMS
         App <-- DK rõ + DK mã hoá --
         ciphertext = AES-GCM(data, DK rõ); xoá DK rõ
         Lưu: [DK mã hoá | ciphertext]
Giải mã: App --Decrypt(DK mã hoá)--> KMS --> DK rõ --> giải mã cục bộ
~~~

### So sánh
| Tiêu chí | Parameter Store | Secrets Manager |
|---|---|---|
| Mục đích | Config + secret đơn giản | Secret có vòng đời, xoay vòng |
| Mã hoá | SecureString qua KMS | Mặc định mã hoá qua KMS |
| Xoay vòng tự động | Không (tự làm bằng Lambda) | Có, tích hợp sẵn RDS/Redshift/DocumentDB |
| Phiên bản | Có version, không staging label phong phú | Có version + staging label AWSCURRENT/AWSPREVIOUS |
| Cross-region | Không (phải tự replicate) | Có replication |
| Chi phí | Standard miễn phí, advanced có phí | Tính phí theo secret/tháng + API call |
| Giới hạn | 4 KB/giá trị (standard) | 64 KB |

Cách chọn: nếu chỉ là feature flag, endpoint, tham số cấu hình → Parameter Store. Nếu là mật khẩu DB cần tự động xoay vòng, API key của bên thứ ba, hoặc cần audit chặt → Secrets Manager.

### Envelope encryption với KMS
- KMS key (CMK) không rời khỏi KMS; nó chỉ dùng để mã hoá/giải mã **data key**.
- Khi mã hoá dữ liệu lớn: gọi {{GenerateDataKey}}, nhận plaintext data key + bản mã hoá. Dùng plaintext key mã hoá dữ liệu bằng AES, lưu bản mã hoá của data key kèm ciphertext, rồi xoá plaintext khỏi bộ nhớ.
- Khi giải mã: gọi {{Decrypt}} với bản mã hoá data key để lấy lại plaintext key, giải mã dữ liệu.
- Lợi ích: dữ liệu lớn không phải gửi qua KMS; chỉ data key nhỏ đi qua, giảm độ trễ và giới hạn 4 KB của KMS.
- **Encryption context** là cặp key-value ràng buộc thêm; giải mã phải cung cấp đúng context, giúp chống dùng nhầm ciphertext.

### Ứng dụng Java lấy secret thế nào
- Không nhúng secret vào image, không commit vào Git, không đặt trong biến môi trường nếu có thể tránh (env dễ lộ qua dump tiến trình).
- Lấy lúc khởi động qua SDK, cache trong bộ nhớ; **không gọi API mỗi request** vì tốn tiền và tăng latency.
- Với secret xoay vòng, cần refresh định kỳ hoặc subscribe notification; nếu cache mãi, secret cũ bị vô hiệu sẽ gây lỗi đăng nhập.
- Ưu tiên IAM role của task/pod để gọi Secrets Manager, không dùng access key.

~~~java
SecretsManagerClient sm = SecretsManagerClient.create();
GetSecretValueResponse res = sm.getSecretValue(
    GetSecretValueRequest.builder().secretId("prod/orders/db").build());
String json = res.secretString();   // {"username":"app","password":"..."}
// parse bằng Jackson, tạo DataSource, không log giá trị
~~~

Với Spring Boot có thể dùng {{spring-cloud-aws-secrets-manager-config}} hoặc {{spring.config.import=aws-secretsmanager:prod/orders/db}} (tuỳ phiên bản).

### Lỗi hay gặp
- **Cache secret vĩnh viễn rồi bật rotation.** Triệu chứng: sau lần xoay đầu tiên app vẫn dùng mật khẩu cũ, RDS từ chối, lỗi đăng nhập hàng loạt. Cách tránh: cache có TTL (ví dụ 5–15 phút), khi gặp lỗi xác thực thì lấy lại secret và tạo lại connection; dùng chiến lược alternating users.
- **Log secret khi debug.** Triệu chứng: mật khẩu nằm trong CloudWatch, khó xoá. Cách tránh: không bao giờ log giá trị; nếu lỡ lộ thì rotate ngay.
- **Cấp quyền {{secretsmanager:*}} hoặc dùng chung KMS key cho mọi môi trường.** Triệu chứng: một service bị chiếm là lộ toàn bộ secret; khó cô lập dev và prod. Cách tránh: quyền {{GetSecretValue}} theo ARN cụ thể, key và key policy riêng theo môi trường.
- **Gọi Parameter Store mỗi request.** Triệu chứng: bị throttle ở traffic cao vì GetParameter mặc định chỉ khoảng 40 TPS (bật higher throughput thì có phí). Cách tránh: đọc lúc khởi động và cache có TTL.

### Trả lời miệng 1 phút
"Parameter Store hợp cho cấu hình và secret đơn giản, rẻ, có SecureString mã hoá bằng KMS; Secrets Manager dành cho secret có vòng đời: xoay vòng tự động, tích hợp sẵn RDS, có staging label AWSCURRENT và AWSPREVIOUS, replication sang region khác. Bên dưới, KMS dùng envelope encryption: KMS key không bao giờ rời KMS, nó chỉ mã hoá một data key nhỏ; dữ liệu lớn được mã hoá cục bộ bằng data key đó, nên nhanh và không vướng giới hạn 4 KB của KMS. Ứng dụng Java của tôi lấy secret bằng IAM role lúc khởi động, cache trong bộ nhớ có TTL chứ không gọi mỗi request, và khi gặp lỗi xác thực thì nạp lại. Bài học của tôi là rotation chỉ an toàn khi ứng dụng đã được thiết kế để nhận secret mới mà không cần restart."

> Senior tip: secret là dữ liệu có vòng đời, hãy thiết kế như dữ liệu có vòng đời: có owner, có lịch xoay, có cảnh báo khi sắp hết hạn, và có đường lui khi xoay lỗi. Đừng biến "lấy secret lúc start" thành "cache đến khi restart".`,
  follow: [
    'Vì sao KMS dùng envelope encryption thay vì mã hoá trực tiếp dữ liệu lớn?',
    'Secret đã cache trong app nên refresh thế nào khi bật rotation?',
    'Parameter Store SecureString có thay thế được Secrets Manager không?'
  ],
  tags: ['Secrets Manager', 'Parameter Store', 'KMS', 'encryption']
},
{
  id: 'aws-014',
  topic: 'aws',
  level: 'lead',
  refs: [{"type": "doc", "title": "AWS Documentation", "url": "https://docs.aws.amazon.com/"}, {"type": "doc", "title": "AWS Well-Architected", "url": "https://aws.amazon.com/architecture/well-architected/"}],
  q: 'Tối ưu chi phí AWS cho hệ Java: những đòn bẩy nào hiệu quả nhất, đo lường ra sao và bẫy nào khiến chi phí tăng ngược?',
  a: `**Tóm tắt:** chi phí AWS thường tập trung ở compute, database, storage và data transfer. Đòn bẩy lớn nhất là chọn đúng kích thước (rightsizing), cam kết dài hạn (Savings Plans/Reserved), dùng Spot cho workload chịu được gián đoạn, Graviton để giảm giá/hiệu năng, và kiểm soát data transfer + log.

### Hiểu nhanh
Hoá đơn AWS giống hoá đơn điện nước của một toà nhà lớn: nếu không có đồng hồ riêng từng căn hộ (tag), không ai biết ai dùng nhiều và không ai chịu tiết kiệm. **Rightsizing** là thay bóng đèn 200W bằng bóng 60W khi phòng không cần sáng thế. **Savings Plans** giống đóng tiền điện trả trước một năm để được giảm giá, chỉ nên trả trước phần chắc chắn dùng. **Spot** giống mua vé máy bay giờ chót giá rẻ nhưng có thể bị huỷ chuyến. **Data transfer** là "phí vận chuyển" ẩn: dữ liệu đi qua AZ khác, qua NAT, ra Internet đều tốn tiền.

### Thuật ngữ
- **Rightsizing**: chỉnh kích thước tài nguyên khớp với mức sử dụng thật.
- **Savings Plans / Reserved Instances**: cam kết chi một mức cố định mỗi giờ (hoặc giữ một loại instance) trong 1–3 năm để được giảm giá.
- **Spot**: dung lượng EC2/Fargate dư của AWS, rẻ hơn nhiều nhưng có thể bị thu hồi với 2 phút báo trước.
- **Graviton**: CPU ARM do AWS thiết kế, giá trên hiệu năng tốt hơn x86 cùng thế hệ.
- **Cost allocation tag**: tag (team, env, service) được bật trong Billing để chia chi phí theo nhóm.
- **CUR (Cost and Usage Report)**: file chi phí chi tiết nhất, đẩy ra S3 để truy vấn bằng Athena.
- **Cross-AZ data transfer**: phí tính trên mỗi GB đi giữa hai AZ, tính ở cả hai chiều.
- **Compute Optimizer**: dịch vụ phân tích metric và gợi ý kích thước EC2, ECS, Lambda, EBS phù hợp.

### Cơ chế từng bước: một vòng tối ưu chi phí hằng tháng
1. **Đo**: bật cost allocation tag, Cost Explorer chia theo service và tag. Vì sao trước tiên: không đo thì không biết tiền chảy đi đâu.
2. **Xếp hạng**: lấy top 5 dòng chi phí và top 5 dòng tăng nhanh nhất so với tháng trước. Vì sao: 80% tiền thường nằm ở vài dòng.
3. **Rightsizing**: xem p95 CPU/memory 2–4 tuần qua Compute Optimizer, giảm size từng bước nhỏ, theo dõi latency. Vì sao p95 mà không phải trung bình: trung bình che mất giờ cao điểm.
4. **Cam kết**: chỉ sau khi rightsizing mới mua Savings Plans cho phần nền ổn định. Vì sao theo thứ tự này: mua trước khi cắt là trả trước cho phần thừa.
5. **Chuyển kiến trúc**: Spot cho worker/batch, Graviton cho service Java, endpoint thay NAT, lifecycle cho S3.
6. **Ngăn tái phát**: budget có cảnh báo theo team, policy bắt buộc tag, tắt dev/staging ngoài giờ.

~~~text
Ví dụ hoá đơn 20.000 USD/tháng (minh hoạ):
  EC2/Fargate 9.000 | RDS 5.000 | NAT + data transfer 2.500 | CloudWatch 1.500 | S3 1.000 | khác 1.000
  Rightsizing -20% compute         : -1.800
  Savings Plans phần nền 6.000     : -1.500 (giảm ~25%)
  Endpoint ECR/S3 thay NAT         :   -800
  Retention + bỏ log debug         :   -700
  => ~15.200 USD/tháng, giảm ~24% mà không đổi chức năng
~~~

### Nhìn vào hoá đơn đúng cách
- Bật **Cost Explorer**, chia theo service, account, tag (team, env, service). Không có tagging thì không ai chịu trách nhiệm chi phí.
- Bật **AWS Budgets** với cảnh báo theo ngưỡng thực tế và dự báo.
- Dùng **Cost and Usage Report** (CUR) qua Athena khi cần phân tích chi tiết.
- Định kỳ review **Trusted Advisor** và **Compute Optimizer**.

### Các đòn bẩy chính
| Đòn bẩy | Tác động | Lưu ý |
|---|---|---|
| Rightsizing | Cao, không ràng buộc | Đo p95 CPU/memory 2–4 tuần, đừng cắt theo trung bình |
| Savings Plans / RI | 20–60% cho compute ổn định | Cam kết 1–3 năm; chỉ mua phần nền chắc chắn |
| Spot | 60–90% cho batch/worker | Có thể bị thu hồi 2 phút; cần checkpoint |
| Graviton | 20–40% rẻ hơn, hiệu năng tốt | Kiểm tra native lib/agent hỗ trợ ARM |
| S3 lifecycle | Cao với dữ liệu cũ | Chuyển IA/Glacier, xoá multipart dở |
| Data transfer | Dễ bị bỏ qua | Cross-AZ, NAT, Internet egress đều tính tiền |
| Log retention | Trung bình | Đặt retention, lọc log debug |
| Database | Cao | Aurora I/O-Optimized khi I/O lớn; tắt môi trường dev ngoài giờ |

### Data transfer — khoản ẩn
- Traffic cross-AZ giữa app và DB/Redis tốn tiền; đặt chúng cùng AZ khi có thể, nhưng vẫn phải đảm bảo HA.
- NAT Gateway tính theo GB; kéo Docker image qua NAT mỗi lần deploy rất tốn. Dùng VPC endpoint cho ECR/S3.
- Internet egress tính theo GB; dùng CloudFront để giảm giá và cache.
- Đừng quên phí cross-region replication nếu chạy DR.

### Với Java cụ thể
- JVM thường "ăn" memory lớn hơn cần thiết; đặt {{-XX:MaxRAMPercentage=75}} thay vì {{-Xmx}} cứng để container dùng đúng giới hạn.
- Chọn instance/task size theo heap thực + overhead metaspace/thread stack, không theo cảm giác.
- Tận dụng Graviton (ARM64) cho image Java: hầu hết thư viện thuần Java chạy tốt; kiểm tra agent native.
- Build pipeline kéo image nhiều lần: dùng cache layer, ECR pull-through, và chạy build trong cùng region.

### Lỗi hay gặp
- **Cắt instance quá tay.** Triệu chứng: app chậm, autoscale bật thêm instance, tổng tiền tăng mà user còn thấy tệ hơn. Cách tránh: giảm từng bậc, theo dõi p99 latency và số instance sau mỗi bước.
- **Mua Reserved/Savings Plans cho workload chưa ổn định.** Triệu chứng: sau vài tháng phải chuyển region/instance family, cam kết thành tiền chết. Cách tránh: chỉ cam kết phần nền chắc chắn; ưu tiên Compute Savings Plans vì linh hoạt instance family, region và cả Fargate/Lambda.
- **Spot cho workload có state mà không checkpoint.** Triệu chứng: bị thu hồi giữa chừng, chạy lại từ đầu, tốn gấp đôi. Cách tránh: checkpoint định kỳ, xử lý thông báo 2 phút, trộn nhiều instance type.
- **Xoá NAT để tiết kiệm.** Triệu chứng: private subnet mất egress, người ta mở public subnet cho app, bảo mật giảm. Cách tránh: giữ NAT, giảm traffic qua NAT bằng VPC endpoint.
- **Quên môi trường dev/staging.** Triệu chứng: instance lớn chạy 24/7 cho môi trường chỉ dùng giờ hành chính. Cách tránh: scheduled scaling về 0 ngoài giờ, instance nhỏ hơn prod.

### Trả lời miệng 1 phút
"Chi phí AWS của hệ Java thường dồn vào compute, database, data transfer và log. Tôi bắt đầu bằng đo lường: tag bắt buộc, Cost Explorer theo team, budget có cảnh báo. Sau đó làm theo thứ tự: rightsizing theo p95 chứ không theo trung bình, rồi mới mua Savings Plans cho phần nền ổn định, Spot cho worker chịu được gián đoạn, Graviton cho service Java vì gần như không phải sửa code. Khoản hay bị bỏ quên là data transfer: kéo image qua NAT, traffic cross-AZ, Internet egress; tôi xử lý bằng VPC endpoint và CloudFront. Trade-off cần nhớ là cắt quá tay có thể làm tổng tiền tăng vì autoscale bù lại. Kinh nghiệm của tôi là một buổi review một giờ mỗi tháng, nhìn top 5 dòng tăng chi phí, hiệu quả hơn mọi công cụ đắt tiền."

> Senior tip: tối ưu chi phí là bài toán liên tục, không phải chiến dịch một lần. Hãy gắn tag bắt buộc ngay từ đầu, đặt budget theo team, và review top 5 service tăng chi phí mỗi tháng. Một buổi review 1 giờ/tháng thường tiết kiệm hơn nhiều so với mua công cụ đắt tiền.`,
  follow: [
    'Vì sao rightsizing theo CPU trung bình thường sai?',
    'Khi nào Savings Plans không còn đáng mua?',
    'Làm sao kiểm soát chi phí data transfer giữa microservices?'
  ],
  tags: ['cost', 'Savings Plans', 'Spot', 'Graviton', 'rightsizing']
},
{
  id: 'aws-015',
  topic: 'aws',
  level: 'senior',
  q: 'Infrastructure as Code: CloudFormation, CDK hay Terraform? CI/CD cho Spring Boot trên AWS nên tổ chức thế nào?',
  a: `**Tóm tắt:** CloudFormation là dịch vụ IaC gốc của AWS, CDK sinh CloudFormation từ ngôn ngữ lập trình, Terraform là công cụ đa cloud với state riêng. Không có lựa chọn đúng tuyệt đối; chọn theo đa cloud, kỹ năng đội và mức độ cần kiểm soát state. CI/CD nên tách pipeline hạ tầng và pipeline ứng dụng, có môi trường tương đương và deploy tăng dần.

### Hiểu nhanh
Infrastructure as Code giống bản vẽ thiết kế nhà: thay vì bảo thợ "xây thêm cái phòng" bằng miệng, bạn sửa bản vẽ, mọi người duyệt bản vẽ, rồi thợ xây đúng theo đó, và lần sau xây nhà giống hệt chỉ cần in lại bản vẽ. **CloudFormation** là mẫu bản vẽ chuẩn của AWS (YAML/JSON). **CDK** cho bạn vẽ bằng ngôn ngữ lập trình như Java hay TypeScript, rồi tự dịch ra CloudFormation. **Terraform** là bộ bản vẽ dùng được cho nhiều nhà thầu (đa cloud), nhưng bạn phải tự cất giữ "sổ hiện trạng" (state). CI/CD là dây chuyền tự động: mỗi thay đổi code đi qua kiểm tra rồi mới tới production.

### Thuật ngữ
- **Stack**: một nhóm tài nguyên CloudFormation được tạo, sửa, xoá cùng nhau.
- **State (Terraform)**: file ghi lại tài nguyên thật nào ứng với khối code nào; mất hoặc hỏng state là Terraform "quên" hạ tầng.
- **State locking**: khoá để hai người không apply cùng lúc; Terraform 1.10+ khoá được ngay trên S3 ({{use_lockfile}}), trước đó thường dùng DynamoDB.
- **Drift**: chênh lệch giữa hạ tầng thật và code do ai đó sửa tay.
- **Construct L2/L3 (CDK)**: lớp trừu tượng có sẵn giá trị mặc định tốt (L2) hoặc cả một mẫu kiến trúc (L3).
- **Blast radius**: phạm vi thiệt hại khi một thay đổi bị lỗi.
- **Blue/green, canary**: blue/green dựng bản mới song song rồi chuyển traffic; canary chuyển một phần nhỏ traffic trước.
- **Expand/contract**: đổi schema DB theo hai pha (thêm cái mới tương thích ngược, rồi mới bỏ cái cũ).

### Cơ chế từng bước: một thay đổi đi từ PR tới production
1. Dev mở PR. Pipeline build, chạy unit test, static analysis, quét bảo mật IaC, và chạy {{terraform plan}} hoặc {{cdk diff}}. Vì sao: người review nhìn thấy chính xác tài nguyên nào sẽ bị tạo, sửa, **xoá**.
2. Merge vào main. Pipeline build image một lần, tag theo commit SHA, push ECR, quét image. Vì sao tag theo SHA: biết chính xác code nào đang chạy và rollback được.
3. Deploy dev tự động, chạy test tích hợp; deploy staging tự động.
4. Production cần approval; pipeline assume role ngắn hạn qua OIDC thay vì dùng access key cố định.
5. Release bằng rolling, blue/green hoặc canary; alarm (5xx, p99) theo dõi trong cửa sổ quan sát.
6. Alarm vượt ngưỡng thì rollback tự động về image SHA trước đó.

~~~text
PR ──> build + test + plan/diff + scan ──> review
merge ──> image orders:3f9c2a1 ──> ECR ──> dev ──> staging ──[approve]──> prod
                                                                canary 10% 10 phút
                                                                5xx > 1%? -> rollback
State Terraform tách: network/prod | data/prod | app/prod | ... (mỗi cái một file state)
~~~

### So sánh
| Tiêu chí | CloudFormation | CDK | Terraform |
|---|---|---|---|
| Ngôn ngữ | YAML/JSON | TypeScript, Java, Python, Go… | HCL |
| State | AWS quản lý | AWS quản lý (sinh CFN) | Bạn quản lý (S3 + lock) |
| Đa cloud | Không | Không (CDK cho AWS) | Có |
| Hệ sinh thái | Chậm hơn, chuẩn AWS | Construct L2/L3 tiện | Provider phong phú |
| Drift detection | Có | Qua CFN | Có plan/detect |
| Học nhanh | Trung bình | Nhanh nếu biết TS/Java | Trung bình |

Chọn CloudFormation khi đội thuần AWS và muốn ít công cụ. Chọn CDK khi đội mạnh code, muốn abstraction và test. Chọn Terraform khi đa cloud, hoặc tổ chức đã có chuẩn Terraform.

### Nguyên tắc IaC
- **Mọi thứ trong code**, kể cả IAM, alarm, dashboard; không click console cho production.
- **State tách theo môi trường** (dev/staging/prod) và theo tầng (network, data, app) để giảm blast radius.
- **Plan/diff trước khi apply**, review như review code.
- **Không hard-code secret**; tham chiếu Secrets Manager/Parameter Store.
- **Tag bắt buộc** (team, env, cost-center).
- **Drift detection** định kỳ; thay đổi tay phải được đưa ngược vào code hoặc revert.

### CI/CD tham chiếu
1. PR: build, unit test, static analysis, {{terraform plan}}/{{cdk diff}}, security scan (Checkov/tfsec/trivy).
2. Merge: build image, tag theo commit SHA, push ECR, scan image.
3. Deploy dev tự động; deploy staging tự động sau test; deploy production cần approval.
4. Chiến lược release: rolling, blue/green (CodeDeploy với ALB), hoặc canary qua weighted target group.
5. Rollback phải tự động khi alarm vượt ngưỡng.

~~~yaml
# GitHub Actions rút gọn
- run: ./mvnw -B verify
- run: docker build -t $ECR_REPO:$GITHUB_SHA .
- run: docker push $ECR_REPO:$GITHUB_SHA
- run: aws ecs update-service --cluster prod --service orders \\
    --task-definition orders:$TASK_REV --force-new-deployment
~~~

### Lỗi hay gặp
- **Dùng chung state Terraform cho mọi môi trường.** Triệu chứng: một lỗi plan ở dev đụng tới tài nguyên prod. Cách tránh: state tách theo môi trường và theo tầng.
- **Apply tay từ laptop.** Triệu chứng: không audit, hạ tầng lệch với code, không ai biết ai đổi gì. Cách tránh: chỉ pipeline được apply, chạy với role assume ngắn hạn.
- **Pipeline không pin version action/image.** Triệu chứng: build hôm nay khác hôm qua dù code không đổi. Cách tránh: pin version (hoặc digest) cho action, base image, provider.
- **Blue/green nhưng migration DB không tương thích ngược.** Triệu chứng: rollback app không cứu được vì schema đã đổi. Cách tránh: migration theo expand/contract, tách deploy schema và deploy app.
- **Deploy cùng lúc hạ tầng và app phụ thuộc nhau.** Triệu chứng: app mới chạy trước khi queue/secret nó cần tồn tại. Cách tránh: tách pipeline hạ tầng và app, hạ tầng đi trước.

### Trả lời miệng 1 phút
"CloudFormation là IaC gốc của AWS, state do AWS quản; CDK cho tôi viết hạ tầng bằng Java hoặc TypeScript rồi sinh ra CloudFormation; Terraform đa cloud, hệ sinh thái provider lớn nhưng tôi phải tự quản state trên S3 có khoá. Tôi chọn theo bối cảnh: thuần AWS và đội mạnh code thì CDK, đa cloud hoặc công ty đã chuẩn hoá thì Terraform. Dù chọn gì, nguyên tắc vẫn vậy: mọi thứ trong code, state tách theo môi trường và tầng để giảm blast radius, plan được review như code. CI/CD tôi tách pipeline hạ tầng và pipeline ứng dụng; image build một lần, tag theo commit SHA, đi qua dev, staging, rồi prod có approval với canary và rollback tự động theo alarm. Bẫy lớn nhất tôi gặp là migration DB không tương thích ngược, nên luôn dùng expand/contract."

> Senior tip: IaC chỉ có giá trị khi nó là con đường duy nhất để thay đổi hạ tầng. Nếu vẫn còn người click console cho prod, hãy coi đó là sự cố quy trình. Bắt đầu nhỏ: network + data + một service, rồi mở rộng.`,
  follow: [
    'Vì sao nên tách state Terraform theo môi trường và theo tầng?',
    'Blue/green deployment gặp thay đổi schema DB thì xử lý thế nào?',
    'Làm sao phát hiện và xử lý drift giữa code và hạ tầng thật?'
  ],
  tags: ['CloudFormation', 'CDK', 'Terraform', 'CI/CD']
},
{
  id: 'aws-016',
  topic: 'aws',
  level: 'lead',
  refs: [{"type": "doc", "title": "AWS Documentation", "url": "https://docs.aws.amazon.com/"}, {"type": "doc", "title": "AWS Well-Architected", "url": "https://aws.amazon.com/architecture/well-architected/"}],
  q: 'Well-Architected Framework gồm những trụ cột nào? Bạn dùng nó thế nào để review kiến trúc thay vì chỉ trả lời lý thuyết?',
  a: `**Tóm tắt:** Well-Architected Framework có 6 trụ cột: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability. Giá trị thực nằm ở quy trình review có câu hỏi cụ thể, xác định risk, gán owner và theo dõi hành động — không phải ở việc học thuộc tên.

### Hiểu nhanh
Well-Architected Framework giống bộ câu hỏi khám sức khoẻ tổng quát cho một hệ thống: không phải sách giáo khoa để học thuộc, mà là danh sách câu hỏi giúp bạn phát hiện "bệnh" trước khi nó phát tác. Sáu trụ cột giống sáu chuyên khoa: vận hành, bảo mật, độ tin cậy, hiệu năng, chi phí, bền vững. Một buổi khám tốt kết thúc bằng **đơn thuốc cụ thể có người chịu trách nhiệm và ngày tái khám**, chứ không phải một tờ giấy ghi "nên ăn uống lành mạnh".

### Thuật ngữ
- **Workload**: tập tài nguyên và code cùng phục vụ một giá trị nghiệp vụ, ví dụ hệ thanh toán; đơn vị để review.
- **Pillar (trụ cột)**: một góc nhìn đánh giá, có bộ câu hỏi và best practice riêng.
- **HRI / MRI (high/medium risk issue)**: rủi ro mức cao/trung bình mà Well-Architected Tool ghi nhận khi câu trả lời thiếu best practice.
- **Lens**: bộ câu hỏi chuyên biệt bổ sung, ví dụ Serverless Lens, SaaS Lens, Financial Services Lens.
- **Well-Architected Tool**: dịch vụ trong console để lưu câu trả lời, risk và milestone của từng lần review.
- **Milestone**: ảnh chụp trạng thái review tại một thời điểm, dùng để so sánh tiến bộ.
- **Owner**: người chịu trách nhiệm xử lý một risk cụ thể.
- **Blast radius**: phạm vi ảnh hưởng khi một thành phần hỏng.

### Cơ chế từng bước: biến framework thành thay đổi thật
1. **Chọn phạm vi**: một workload cụ thể, mời đúng người (dev lead, ops, security, product). Vì sao: review cả công ty thì kết luận chung chung.
2. **Hỏi theo trụ cột**, yêu cầu bằng chứng: "đã test mất AZ chưa, kết quả đâu?" thay vì "có HA không?". Vì sao: câu trả lời "có" mà không có bằng chứng thường là "chưa".
3. **Ghi risk** kèm mức độ, tác động kinh doanh và owner.
4. **Ưu tiên** theo tác động × khả năng xảy ra, ghép với chi phí khắc phục.
5. **Đưa vào backlog** có deadline, lưu milestone trong Well-Architected Tool.
6. **Review lại** sau 1–3 tháng, so sánh số HRI với milestone trước.

~~~text
Ma trận ưu tiên (ví dụ từ một buổi review hệ Spring Boot):
                    Khả năng xảy ra cao        Khả năng thấp
Tác động cao   | Chưa test mất AZ (làm ngay) | Chưa có DR region (lên kế hoạch)
Tác động thấp  | Log thiếu trace ID (sprint) | Instance dư 20% (khi rảnh)
Kết quả đo được: 7 HRI -> 2 HRI sau 3 tháng
~~~

### Sáu trụ cột
- **Operational Excellence**: vận hành bằng code, quan sát được, học từ sự cố, quy trình thay đổi an toàn.
- **Security**: identity là ranh giới chính, least privilege, mã hoá, bảo vệ dữ liệu, phát hiện và phản ứng.
- **Reliability**: tự phục hồi, test recovery, scale theo nhu cầu, quản lý thay đổi.
- **Performance Efficiency**: chọn đúng tài nguyên, giám sát, tối ưu theo dữ liệu, cân nhắc serverless/edge.
- **Cost Optimization**: hiểu chi phí, chọn mô hình phù hợp, phân tích theo thời gian, không tối ưu mù.
- **Sustainability**: giảm năng lượng tiêu thụ, chọn instance hiệu quả, tận dụng managed service, giảm dữ liệu dư.

### Cách chạy review thực tế
1. Chọn workload cụ thể (một hệ thống, không phải cả công ty).
2. Với mỗi trụ cột, trả lời câu hỏi dạng: "Hệ thống có chịu được mất một AZ không, đã test chưa?", "Ai có quyền deploy prod, có MFA không?", "Metric nào phát hiện sự cố trong 5 phút?".
3. Ghi nhận **risk** (high/medium/low) và **owner**, không ghi "nên cải thiện".
4. Ưu tiên theo tác động kinh doanh × khả năng xảy ra, không theo độ "hay" kỹ thuật.
5. Đưa hành động vào backlog có deadline; review lại sau 1–3 tháng.
6. Dùng **AWS Well-Architected Tool** để lưu câu trả lời, nhưng đừng biến nó thành bài kiểm tra hình thức.

### Ví dụ câu hỏi theo trụ cột cho hệ Spring Boot
| Trụ cột | Câu hỏi |
|---|---|
| Reliability | Mất một AZ thì DB/app/LB xử lý ra sao? Đã diễn tập chưa? |
| Security | Secret lấy từ đâu, ai đọc được? Có access key trong image không? |
| Ops | Deploy có rollback tự động? Log/trace có trace ID xuyên service? |
| Performance | p99 của endpoint nóng? Có N+1 query không? Cache có TTL? |
| Cost | Top 3 service tốn tiền? Có môi trường nào chạy 24/7 vô ích? |
| Sustainability | Instance có bị over-provision? Data cũ có lifecycle? |

### Lỗi hay gặp
- **Review như checklist tô đủ ô.** Triệu chứng: báo cáo dài, không có thay đổi nào sau đó. Cách tránh: mỗi buổi review phải ra ít nhất một quyết định và backlog có deadline.
- **Chỉ nhìn Reliability/Security, bỏ Cost/Ops.** Triệu chứng: kiến trúc "đẹp" nhưng đắt và không vận hành nổi. Cách tránh: đi đủ sáu trụ cột, chấp nhận trade-off có ghi lại.
- **Đánh giá toàn công ty thay vì từng workload, và không có owner.** Triệu chứng: kết luận chung chung, risk được ghi rồi nằm đó. Cách tránh: một workload mỗi buổi, mỗi risk một owner.
- **Bỏ qua con người.** Triệu chứng: kiến trúc tối ưu lý thuyết nhưng đội nhỏ không đủ người trực. Cách tránh: framework giả định đội đủ năng lực; với đội nhỏ, chọn managed service đơn giản hơn.

### Trả lời miệng 1 phút
"Well-Architected có sáu trụ cột: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization và Sustainability. Tôi không dùng nó như lý thuyết mà như quy trình review: chọn một workload cụ thể, hỏi từng trụ cột bằng câu hỏi đòi bằng chứng, ví dụ đã diễn tập mất một AZ chưa, ai có quyền deploy prod, metric nào phát hiện sự cố trong năm phút. Mỗi rủi ro được ghi mức độ, owner, đưa vào backlog và review lại sau một đến ba tháng, lưu milestone trong Well-Architected Tool để thấy tiến bộ. Trade-off là các trụ cột kéo nhau, ví dụ tăng reliability thì tăng chi phí, nên tôi trình bày với business bằng rủi ro và tiền. Một buổi review thành công với tôi là có quyết định cụ thể, không phải một tài liệu dài."

> Senior tip: hãy dùng Well-Architected như công cụ đàm phán với business: mỗi risk đi kèm chi phí khắc phục và rủi ro nếu không khắc phục. Review tốt nhất là review có một quyết định cụ thể được đưa ra, không phải một tài liệu dài được lưu trữ.`,
  follow: [
    'Vì sao nên review theo từng workload thay vì toàn bộ hệ thống?',
    'Bạn xử lý thế nào khi reliability yêu cầu cao nhưng ngân sách hạn chế?',
    'Sustainability thực sự thay đổi quyết định kiến trúc nào?'
  ],
  tags: ['Well-Architected', 'review', 'architecture', 'pillars']
},
{
  id: 'aws-017',
  topic: 'aws',
  level: 'senior',
  q: 'Bạn định đưa một nhóm API lên API Gateway + Lambda. Giới hạn timeout, payload và concurrency ảnh hưởng thiết kế thế nào? REST API hay HTTP API, và khi nào không nên dùng Lambda làm backend?',
  a: `**Tóm tắt:** API Gateway + Lambda hợp cho API nhẹ, traffic biến động. Ba giới hạn quyết định thiết kế: integration timeout mặc định **29 giây** (HTTP API tối đa 30 giây), payload thực tế **6 MB** vì Lambda gọi đồng bộ chỉ nhận/trả 6 MB, và mỗi execution environment chỉ xử lý một request tại một thời điểm. HTTP API rẻ và đơn giản hơn; REST API đủ tính năng hơn (usage plan, WAF, cache, canary, private endpoint).

### Hiểu nhanh
API Gateway giống quầy lễ tân của toà nhà, Lambda giống nhân viên thời vụ được gọi tới khi có khách. Lễ tân chỉ đứng chờ khách tối đa khoảng 29 giây: quá thời gian đó lễ tân báo khách "hết giờ" (504), dù nhân viên phía sau vẫn đang làm tiếp. Mỗi nhân viên thời vụ chỉ tiếp một khách một lúc, nên 1.000 khách cùng lúc là 1.000 nhân viên, và nếu ai cũng gọi điện xuống kho (database) thì kho bị nghẽn máy. Vì vậy việc lâu phải đổi sang kiểu "nhận phiếu, về chờ gọi" (202 + jobId).

### Thuật ngữ
- **Integration timeout**: thời gian tối đa API Gateway chờ backend trả lời trước khi trả 504 cho client.
- **Lambda proxy integration**: API Gateway chuyển nguyên request thành event JSON cho Lambda và nhận response JSON trở lại.
- **Concurrency (Lambda)**: số execution environment đang xử lý request cùng lúc; mặc định tối đa 1.000 mỗi region (có thể xin tăng).
- **Reserved concurrency**: số concurrency dành riêng (và cũng là trần) cho một function.
- **Usage plan / API key**: cơ chế REST API giới hạn quota và throttle theo từng khách hàng/đối tác.
- **Authorizer**: bước xác thực trước khi gọi backend: IAM, Cognito, JWT hoặc Lambda tự viết.
- **Idempotency key**: khoá do client gửi để server nhận ra request lặp và trả lại kết quả cũ thay vì xử lý lần hai.
- **RDS Proxy**: proxy managed gom nhiều connection từ Lambda vào một pool nhỏ tới database.

### Cơ chế từng bước: một request đồng bộ
1. Client gọi {{POST /payments}}; API Gateway kiểm tra throttle, authorizer. Vì sao trước Lambda: request xấu bị chặn trước khi tốn tiền compute.
2. API Gateway invoke Lambda đồng bộ; nếu không có environment rảnh thì Lambda tạo mới (cold start), tính vào concurrency.
3. Lambda xử lý, trả response tối đa 6 MB.
4. Nếu sau 29 giây chưa có response, API Gateway trả 504 nhưng Lambda **vẫn chạy tiếp** tới khi xong hoặc tới timeout của hàm.
5. Client thấy 504 và thường bấm lại, tạo request thứ hai. Vì sao cần idempotency key: lần đầu có thể đã thành công.

~~~text
Client --POST--> API GW --invoke--> Lambda (1 request / environment)
                   |                    |
         29 s: 504 về client        vẫn chạy tới 40 s, trừ tiền xong
Client retry ----> lần 2: thiếu idempotency key = trừ tiền 2 lần

1.000 request đồng thời -> 1.000 environment -> tới 1.000 connection RDS
RDS PostgreSQL db.t4g.medium (4 GB): max_connections mặc định ~400 -> cạn connection
~~~

### Timeout: chuyện gì xảy ra khi vượt 29 giây
- API Gateway ngắt kết nối và trả **504** cho client, nhưng **Lambda vẫn chạy tiếp** (tối đa 15 phút) và vẫn tính tiền. Nếu hàm đã trừ tiền xong thì client nhận 504, bấm lại, và giao dịch bị chạy hai lần → API có side effect bắt buộc có idempotency key.
- Từ 2024, REST API loại Regional/Private có thể xin tăng integration timeout quá 29 giây qua Service Quotas, đổi lại có thể bị giảm throttle quota của account. Edge-optimized và HTTP API không có lựa chọn này. Kiểm tra tài liệu hiện hành trước khi dựa vào nó.
- Việc dài vẫn nên làm bất đồng bộ: trả **202 + jobId**, xử lý qua SQS/Step Functions, client poll hoặc nhận webhook.

~~~java
// Nhận request, đẩy vào SQS, trả 202 ngay: không phụ thuộc timeout của API Gateway
public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context ctx) {
    String jobId = UUID.randomUUID().toString();
    sqs.sendMessage(b -> b.queueUrl(queueUrl)
        .messageBody(jobId + "\\n" + event.getBody()));   // worker đọc jobId, xử lý, ghi trạng thái
    return APIGatewayV2HTTPResponse.builder()
        .withStatusCode(202)
        .withHeaders(Map.of("Location", "/jobs/" + jobId))
        .build();
}
~~~

### Payload
- API Gateway nhận tới 10 MB, nhưng Lambda invoke đồng bộ giới hạn **6 MB** cho cả request lẫn response, nên với Lambda proxy thì 6 MB mới là trần thật.
- Binary đi qua dạng base64 nên phình khoảng 33%. Upload/download file: cấp **S3 presigned URL**, đừng cho file đi xuyên Lambda.

### REST API vs HTTP API
| Tính năng | REST API | HTTP API |
|---|---|---|
| Giá bậc đầu (us-east-1) | khoảng 3.5 USD/triệu request | khoảng 1 USD/triệu request |
| Usage plan, API key, throttle theo client | Có | Không |
| Gắn AWS WAF trực tiếp | Có | Không (đặt CloudFront + WAF phía trước) |
| Response cache, request validation, mapping template | Có | Không |
| Canary ở stage | Có | Không |
| Loại endpoint | Edge, Regional, Private | Regional |
| Authorizer | IAM, Cognito, Lambda | IAM, JWT có sẵn, Lambda |
| CORS | Tự cấu hình OPTIONS | Cấu hình sẵn |

WebSocket là một loại API thứ ba, không thuộc bảng này. Chọn HTTP API cho API nội bộ/BFF đơn giản xác thực bằng JWT; chọn REST API cho API công khai cần WAF, usage plan cho đối tác, hoặc private API chỉ gọi từ VPC.

### Khi nào không nên dùng Lambda làm backend
1. Request đồng bộ thường xuyên dài hơn vài giây, hoặc cần streaming lâu: ECS Fargate sau ALB (idle timeout tới 4000 giây) tự nhiên hơn.
2. Traffic nền cao và đều suốt ngày: trả theo GB-giây thường đắt hơn container chạy liên tục; hãy tính với số liệu thật.
3. Gọi RDS: 1.000 request đồng thời = 1.000 execution environment = tới 1.000 connection. Connection được tái sử dụng giữa các lần gọi trong cùng environment, nhưng tổng số vẫn bùng nổ khi scale → cần **RDS Proxy** và pool size 1.
4. Spring Boot nặng, cold start lớn mà không dùng được SnapStart/tối ưu.
5. Cần GPU, hoặc tiến trình chạy nền lâu.

### Lỗi hay gặp
- **Quota chia chung cả account/region.** Triệu chứng: throttle mặc định API Gateway 10.000 RPS, burst 5.000 và Lambda concurrency 1.000 bị chia cho mọi API, một API bị spam kéo sập API khác. Cách tránh: throttle theo stage/route, reserved concurrency cho function quan trọng.
- **Retry chồng retry khi gặp 504.** Triệu chứng: retry phía client cộng retry phía SDK nhân bản request, giao dịch chạy nhiều lần. Cách tránh: idempotency key bắt buộc cho API có side effect, giới hạn tổng số lần retry.
- **Log API Gateway và Lambda tách rời.** Triệu chứng: không nối được request lỗi ở hai bên. Cách tránh: bật access log có requestId, truyền requestId vào log của Lambda.
- **Cho file đi xuyên Lambda.** Triệu chứng: lỗi payload quá lớn vì base64 làm file phình 33% và vượt 6 MB. Cách tránh: S3 presigned URL.

### Trả lời miệng 1 phút
"Với API Gateway cộng Lambda tôi thiết kế quanh ba giới hạn. Timeout tích hợp khoảng 29 giây: vượt thì client nhận 504 nhưng Lambda vẫn chạy, nên API có side effect phải có idempotency key, và việc dài thì trả 202 kèm jobId rồi xử lý qua SQS hoặc Step Functions. Payload thực tế 6 MB vì giới hạn invoke đồng bộ của Lambda, nên file đi qua presigned URL S3. Concurrency: mỗi environment chỉ xử lý một request, nghìn request đồng thời là nghìn connection tới database, nên cần RDS Proxy và pool size một. Về loại API, HTTP API rẻ và đơn giản với JWT authorizer; REST API khi cần WAF, usage plan, cache hoặc private endpoint. Tôi không dùng Lambda khi request thường xuyên dài, traffic nền cao đều, hoặc Spring Boot nặng không tối ưu được cold start."

> Senior tip: ghi rõ trong ADR "endpoint nào được phép chạy quá 3 giây". Nếu danh sách đó không rỗng, tách chúng sang luồng bất đồng bộ ngay từ đầu; đợi đến khi client gặp 504 rồi mới sửa thì phải đổi cả contract API.`,
  follow: [
    'Client nhận 504 nhưng Lambda vẫn trừ tiền thành công: bạn thiết kế idempotency thế nào?',
    'Vì sao Lambda gọi RDS cần RDS Proxy, connection pool trong hàm nên đặt bao nhiêu?',
    'Khi nào bạn đặt CloudFront phía trước HTTP API?'
  ],
  tags: ['API Gateway', 'Lambda', 'REST API', 'HTTP API', 'timeout', 'idempotency']
},
{
  id: 'aws-018',
  topic: 'aws',
  level: 'senior',
  q: 'Quy trình mở tài khoản gồm eKYC, chấm điểm, duyệt tay và tạo tài khoản core banking. Bạn điều phối bằng Step Functions hay tự viết Saga trong Java, và vì sao?',
  a: `**Tóm tắt:** Step Functions là orchestrator được quản lý: trạng thái mỗi bước, retry/backoff, catch, chờ duyệt tay (task token) và lịch sử thực thi đều có sẵn, đổi lại bị khoá vào AWS và giới hạn payload 256 KB. Tự viết Saga trong Java cho toàn quyền kiểm soát nhưng phải tự lo lưu trạng thái, retry, timeout, compensation và audit. Quy trình dài, nhiều bước chờ người như mở tài khoản rất hợp với Step Functions Standard.

### Hiểu nhanh
Quy trình mở tài khoản giống hồ sơ đi qua nhiều phòng ban: phòng kiểm tra giấy tờ (eKYC), phòng chấm điểm, trưởng phòng ký duyệt, rồi phòng mở tài khoản. **Step Functions** giống một nhân viên điều phối chuyên nghiệp có sổ theo dõi: biết hồ sơ đang ở bước nào, gọi lại phòng ban khi họ bận, chờ trưởng phòng ký bao nhiêu ngày cũng được mà không tốn lương, và ghi lại mọi bước để kiểm toán. **Tự viết Saga** giống bạn tự làm người điều phối đó bằng code: linh hoạt hoàn toàn, nhưng cuốn sổ, việc nhắc việc, việc gọi lại, việc huỷ bỏ khi bị từ chối đều phải tự làm.

### Thuật ngữ
- **Orchestration**: một bộ điều phối trung tâm ra lệnh cho từng bước; ngược với choreography, nơi các service tự phản ứng theo event.
- **Saga**: chuỗi transaction cục bộ, mỗi bước có hành động bù trừ (compensation) để hoàn tác khi bước sau thất bại.
- **State machine / ASL**: quy trình của Step Functions, viết bằng Amazon States Language (JSON).
- **State transition**: mỗi lần chuyển từ state này sang state khác; Standard workflow tính tiền theo đơn vị này.
- **Task token**: chuỗi định danh một bước đang chờ; hệ thống ngoài gửi lại token để báo bước đó thành công hay thất bại.
- **Execution history**: nhật ký từng sự kiện của một lần chạy, gồm input/output mỗi bước.
- **Distributed Map**: chế độ Map chạy hàng nghìn execution con song song cho tập dữ liệu lớn.
- **Compensation**: hành động hoàn tác nghiệp vụ, ví dụ huỷ hồ sơ đã tạo hoặc hoàn tiền.

### Cơ chế từng bước: một hồ sơ đi qua Step Functions
1. API tạo execution với tên là mã hồ sơ ({{APP-2025-000123}}). Vì sao đặt tên: Step Functions Standard từ chối tên trùng, chống khởi động hai lần.
2. Bước eKYC gọi Lambda; lỗi tạm thời (throttle, timeout) thì Retry tự động với backoff 2, 4, 8 giây.
3. Bước Scoring: lỗi nghiệp vụ {{ScoreRejected}} được Catch và rẽ sang nhánh thông báo từ chối.
4. Bước ManualReview dùng {{.waitForTaskToken}}: gửi token vào hàng đợi duyệt, execution tạm dừng, không tốn compute. Có thể đặt HeartbeatSeconds/TimeoutSeconds để quá hạn thì rẽ nhánh xử lý.
5. Chuyên viên duyệt trên màn hình nội bộ, backend gọi {{SendTaskSuccess}} với token; execution chạy tiếp.
6. Bước OpenAccount gọi core banking với idempotency key; thất bại vĩnh viễn thì chạy compensation.

~~~text
[Start] -> eKYC --retry--> Scoring --ScoreRejected--> NotifyRejected -> [End]
                              |
                              v
                       ManualReview (task token, chờ tối đa 3 ngày)
                              | SendTaskSuccess          | timeout
                              v                          v
                       OpenAccount --lỗi--> Compensate -> NotifyFailed
                              |
                            [End]
~~~

### Step Functions làm gì thay bạn
- **Standard workflow**: chạy tối đa 1 năm, mỗi bước được ghi vào execution history (giữ 90 ngày), tính tiền theo **state transition**. Hợp cho quy trình nghiệp vụ dài, cần audit.
- **Express workflow**: tối đa 5 phút, tính theo số request và thời gian chạy, history chỉ có nếu bật CloudWatch Logs. Hợp cho xử lý event khối lượng lớn, ngắn.
- **Retry/Catch khai báo**: retry theo loại lỗi với backoff, lỗi nghiệp vụ thì nhảy sang bước bù trừ.
- **Callback**: bước dùng {{.waitForTaskToken}} gửi token cho hệ thống ngoài rồi tạm dừng (không tốn compute) đến khi ai đó gọi {{SendTaskSuccess}} hoặc {{SendTaskFailure}}. Đây là cách làm bước "duyệt tay".

~~~json
"Scoring": {
  "Type": "Task",
  "Resource": "arn:aws:states:::lambda:invoke",
  "Parameters": { "FunctionName": "credit-scoring", "Payload.$": "$" },
  "Retry": [{ "ErrorEquals": ["Lambda.TooManyRequestsException", "States.Timeout"],
              "IntervalSeconds": 2, "BackoffRate": 2, "MaxAttempts": 3 }],
  "Catch": [{ "ErrorEquals": ["ScoreRejected"], "Next": "NotifyRejected" }],
  "TimeoutSeconds": 30,
  "Next": "ManualReview"
}
~~~

### Tự viết Saga: phải tự làm những gì
~~~java
// Orchestrator tự viết: commit trạng thái sau MỖI bước, không bọc @Transactional quanh lời gọi remote
public void advance(UUID sagaId) {
    Saga s = sagas.load(sagaId);
    try {
        if (s.step() == Step.KYC_PASSED) {
            scoring.score(s.customerId(), s.key("score"));   // API đích phải idempotent theo key
            s = sagas.moveTo(sagaId, Step.SCORED);           // transaction ngắn, chỉ ghi DB local
        }
        if (s.step() == Step.APPROVED) {
            coreBanking.openAccount(s.customerId(), s.key("open"));
            sagas.moveTo(sagaId, Step.DONE);
        }
    } catch (BusinessRejectException e) {
        sagas.moveTo(sagaId, Step.COMPENSATING);              // job khác chạy bù trừ, cũng idempotent
    }   // lỗi tạm thời: không làm gì, scheduler gọi lại advance() sau
}
~~~
Ngoài đoạn trên còn cần: scheduler quét saga treo, timeout từng bước, bảng audit, màn hình tra cứu, cơ chế chạy lại thủ công. Đó chính là phần Step Functions cho sẵn.

### So sánh
| Tiêu chí | Step Functions | Saga tự viết |
|---|---|---|
| Lưu trạng thái, history | Có sẵn | Tự thiết kế bảng + audit |
| Chờ người duyệt nhiều ngày | Task token, không tốn compute | Bảng pending + scheduler |
| Quan sát | Console hiển thị từng bước, input/output | Tự dựng dashboard |
| Payload mỗi bước | Tối đa 256 KB | Tuỳ DB |
| Test | TestState API cho từng state, test tích hợp trên account sandbox | Unit test thuần Java |
| Lock-in, chạy on-prem | Chỉ AWS | Portable |

### Lỗi hay gặp
- **Truyền dữ liệu lớn giữa các bước.** Triệu chứng: ảnh CCCD hay kết quả OCR vượt 256 KB làm execution fail. Cách tránh: lưu S3, chỉ truyền key.
- **Vòng lặp hoặc Map lớn trong Standard.** Triệu chứng: chạm giới hạn 25.000 event trong history, execution fail. Cách tránh: Distributed Map hoặc tách execution con.
- **Tin rằng retry của Step Functions làm bước idempotent.** Triệu chứng: core banking mở hai tài khoản cho một hồ sơ. Cách tránh: Lambda/API đích vẫn phải chống trùng; đặt tên execution theo mã hồ sơ để tránh khởi động trùng quy trình.
- **Nhét logic nghiệp vụ vào ASL.** Triệu chứng: Choice lồng nhau phức tạp, khó test, khó đọc. Cách tránh: ASL chỉ là khung điều phối, logic để trong code.

### Trả lời miệng 1 phút
"Với quy trình mở tài khoản tôi nghiêng về Step Functions Standard. Nó là orchestrator managed: mỗi bước có trạng thái, retry với backoff và catch khai báo sẵn, bước duyệt tay dùng task token nên có thể chờ nhiều ngày mà không tốn compute, và execution history cho kiểm toán biết ai duyệt, lúc nào, input là gì. Nếu tự viết saga trong Java, tôi phải tự lưu trạng thái sau từng bước, tự viết scheduler quét saga treo, timeout, compensation và màn hình tra cứu. Đổi lại Step Functions khoá vào AWS, payload mỗi bước tối đa 256 KB nên tài liệu lớn phải để trên S3, và history chỉ giữ 90 ngày. Dù chọn cách nào, các bước đích vẫn phải idempotent; tôi đặt tên execution theo mã hồ sơ và đẩy sự kiện quan trọng sang kho audit riêng."

> Senior tip: ở ngân hàng, lý do mạnh nhất chọn Step Functions thường là audit: kiểm toán hỏi "hồ sơ này ai duyệt, lúc nào, input là gì" thì có ngay execution history. Nhưng history chỉ giữ 90 ngày, nên vẫn phải đẩy sự kiện quan trọng sang kho audit riêng có thời hạn lưu theo quy định.`,
  follow: [
    'Standard hay Express cho quy trình mở tài khoản, và cho xử lý 5.000 event/giây?',
    'Bước duyệt tay chờ 3 ngày rồi quá hạn: bạn thiết kế timeout và bù trừ thế nào?',
    'Khi nào choreography qua Kafka hợp hơn orchestration?'
  ],
  tags: ['Step Functions', 'Saga', 'orchestration', 'workflow', 'task token']
},
{
  id: 'aws-019',
  topic: 'aws',
  level: 'senior',
  q: 'Aurora PostgreSQL failover xong sau khoảng 30 giây, nhưng service Spring Boot vẫn lỗi ghi suốt vài phút. Vì sao, và bạn cấu hình JVM, connection pool, driver thế nào để hồi phục nhanh?',
  a: `**Tóm tắt:** Failover của Aurora đổi bản ghi DNS của cluster endpoint sang writer mới, nhưng ứng dụng Java có thể vẫn dùng IP cũ (DNS cache của JVM) và connection pool vẫn giữ connection tới instance cũ, nay đã thành reader, nên ghi bị lỗi "read-only". Cách sửa: TTL DNS của JVM ngắn, pool biết loại bỏ connection hỏng, và tốt nhất dùng **AWS Advanced JDBC Wrapper** với plugin failover để chuyển sang writer mới theo topology thay vì chờ DNS; ứng dụng phải retry transaction.

### Hiểu nhanh
Hãy tưởng tượng quầy giao dịch chính (writer) đóng cửa và quầy bên cạnh (replica) được đổi biển thành quầy chính. Biển chỉ đường (DNS) đã đổi sau khoảng 30 giây, nhưng khách của bạn vẫn nhớ đường cũ (JVM cache DNS) và vẫn đang đứng xếp hàng ở quầy cũ (connection trong pool). Quầy cũ mở lại nhưng giờ chỉ được tra cứu, không được ghi, nên mọi giao dịch ghi bị từ chối "read-only". Muốn hồi phục nhanh, khách phải hay xem lại biển chỉ đường, bỏ hàng cũ khi thấy bất thường, hoặc có người dẫn đường biết sơ đồ thật (AWS Advanced JDBC Wrapper).

### Thuật ngữ
- **Cluster endpoint (writer endpoint)**: tên DNS luôn trỏ tới writer hiện tại của Aurora cluster.
- **Reader endpoint / instance endpoint**: tên DNS cân bằng giữa các reader / tên DNS cố định của từng instance.
- **Failover**: Aurora promote một reader thành writer khi writer gặp sự cố hoặc khi bạn chủ động yêu cầu.
- **DNS cache của JVM**: JVM nhớ kết quả phân giải tên miền theo {{networkaddress.cache.ttl}}.
- **max-lifetime (HikariCP)**: thời gian sống tối đa của một connection trong pool trước khi bị thay mới.
- **Socket timeout**: thời gian driver chờ dữ liệu trên socket trước khi coi kết nối đã chết.
- **Topology**: danh sách instance và vai trò hiện tại (writer/reader) mà wrapper đọc trực tiếp từ Aurora.
- **TCP treo (half-open)**: máy bên kia đã chết mà không gửi RST, socket phía client vẫn tưởng còn sống.

### Cơ chế phục hồi từng bước khi đã cấu hình đúng
1. Writer A gặp sự cố; plugin efm đang theo dõi ở luồng riêng phát hiện A không phản hồi sau vài giây thay vì chờ TCP timeout của hệ điều hành.
2. Plugin failover đọc topology và kết nối thẳng tới writer mới B, không chờ DNS. Vì sao nhanh hơn: bỏ qua cả DNS TTL của Aurora lẫn DNS cache của JVM.
3. Wrapper ném {{FailoverSuccessSQLException}} cho transaction đang chạy, báo rằng connection đã chuyển sang B nhưng transaction cũ đã mất.
4. Lớp retry của ứng dụng chạy lại toàn bộ transaction (nếu an toàn), lần này thành công trên B.
5. Các connection còn lại trong pool lần lượt được thay mới nhờ max-lifetime và cơ chế loại bỏ connection lỗi.

~~~text
Thời gian không ghi được, đo từ ứng dụng (số liệu minh hoạ):
Mặc định (DNS cache 30 s+, pool giữ connection cũ, TCP treo) : 2-5 phút
DNS TTL 5 s + max-lifetime 5 phút + socketTimeout           : ~1-2 phút
AWS Advanced JDBC Wrapper (failover + efm) + retry           : thường < 1 phút
~~~

### Chuyện gì xảy ra khi failover
~~~text
t=0     writer A chết / bị failover
t=~5s   Aurora promote replica B thành writer
t=~30s  cluster endpoint (CNAME, TTL 5s) trỏ sang B; A khởi động lại thành reader
App:    pool vẫn giữ 20 connection tới A
        JVM còn cache IP của A -> connection mới cũng tới A
        INSERT -> ERROR: cannot execute INSERT in a read-only transaction
~~~
Ba lớp cùng gây trễ: **DNS cache của JVM**, **connection cũ trong pool** và **TCP treo** khi instance cũ chết hẳn mà không gửi RST (socket chờ tới timeout của hệ điều hành).

### Lớp 1: DNS cache của JVM
- Thuộc tính {{networkaddress.cache.ttl}}: nếu có SecurityManager thì mặc định cache mãi mãi; không có thì mặc định khoảng 30 giây (tuỳ implementation). AWS khuyên đặt không quá 60 giây.
- Đặt sớm lúc khởi động, trước lần resolve đầu tiên: {{Security.setProperty("networkaddress.cache.ttl", "5")}}, hoặc sửa file java.security trong image.

### Lớp 2: connection pool
- HikariCP không tự biết connection đang trỏ tới reader. Đặt {{max-lifetime}} vài phút để connection được làm mới định kỳ, {{connection-timeout}} ngắn để fail nhanh.
- Đặt socket timeout của driver (PostgreSQL: {{socketTimeout}}) để query không treo vô hạn trên TCP chết.

### Lớp 3: AWS Advanced JDBC Wrapper
Wrapper bọc driver PostgreSQL/MySQL gốc và thêm plugin:
- **failover**: đọc topology cluster từ chính DB, khi mất writer thì kết nối thẳng tới writer mới, không phụ thuộc DNS. Sau khi chuyển xong, ném {{FailoverSuccessSQLException}} để báo transaction hiện tại đã mất, ứng dụng phải chạy lại.
- **efm** (Enhanced Failure Monitoring): theo dõi host ở luồng riêng, phát hiện instance chết nhanh hơn TCP timeout.
- Ngoài ra có plugin IAM authentication, Secrets Manager, read/write splitting. Bản mới có failover2/efm2; tên plugin mặc định thay đổi theo version, kiểm tra tài liệu hiện hành.

~~~yaml
spring:
  datasource:
    url: jdbc:aws-wrapper:postgresql://core.cluster-xxxx.ap-southeast-1.rds.amazonaws.com:5432/core
    driver-class-name: software.amazon.jdbc.Driver
    hikari:
      maximum-pool-size: 20
      max-lifetime: 300000          # 5 phút
      connection-timeout: 3000      # fail nhanh thay vì treo thread
      # để Hikari không coi lỗi failover là connection hỏng hàng loạt (theo hướng dẫn của wrapper)
      exception-override-class-name: software.amazon.jdbc.util.HikariCPSQLException
      data-source-properties:
        wrapperPlugins: failover,efm
        wrapperDialect: aurora-pg
~~~

### Ứng dụng vẫn phải retry
- Failover luôn làm mất transaction đang chạy. Bao service method bằng retry 1–2 lần cho lỗi failover, **chỉ khi thao tác idempotent** hoặc toàn bộ transaction được chạy lại từ đầu.
- Lỗi xảy ra lúc commit có thể để trạng thái không rõ (wrapper có {{TransactionStateUnknownSQLException}}): phải kiểm tra lại bằng idempotency key trước khi chạy lại, nhất là giao dịch tiền.

### Lựa chọn khác: RDS Proxy
RDS Proxy giữ kết nối phía client và tự chuyển sang writer mới, giảm thời gian failover mà không đổi driver. Đổi lại: thêm chi phí, thêm một hop, và pinning làm giảm hiệu quả multiplexing khi dùng prepared statement/session state.

### Lỗi hay gặp
- **Chỉ test failover trên giấy.** Triệu chứng: sự cố thật kéo dài gấp nhiều lần dự kiến. Cách tránh: chạy {{aws rds failover-db-cluster}} trên staging dưới tải và đo thời gian ghi lỗi từ phía ứng dụng.
- **Dùng instance endpoint cứng thay vì cluster endpoint.** Triệu chứng: sau failover app vẫn ghi vào instance cũ, nay đã là reader. Cách tránh: luôn ghi qua cluster (writer) endpoint hoặc qua wrapper.
- **Retry vô hạn với backoff nhỏ.** Triệu chứng: bão connection dồn vào writer mới đúng lúc nó vừa lên. Cách tránh: retry 1–2 lần có backoff và jitter, connection-timeout ngắn.
- **Retry transaction không idempotent.** Triệu chứng: lỗi lúc commit, chạy lại làm trừ tiền hai lần. Cách tránh: kiểm tra lại bằng idempotency key trước khi chạy lại.

### Trả lời miệng 1 phút
"Failover của Aurora chỉ đổi DNS của cluster endpoint sang writer mới, nhưng ứng dụng Java có ba lớp làm chậm: JVM cache địa chỉ IP cũ, HikariCP vẫn giữ connection tới instance cũ nay đã thành reader nên mọi lệnh ghi bị lỗi read-only, và TCP có thể treo khi instance cũ chết mà không gửi RST. Tôi xử lý từng lớp: đặt networkaddress.cache.ttl khoảng 5 giây, max-lifetime vài phút, connection-timeout và socketTimeout ngắn để fail nhanh. Tốt nhất là dùng AWS Advanced JDBC Wrapper với plugin failover và efm, nó đọc topology từ chính database và nối thẳng tới writer mới mà không chờ DNS. Dù vậy transaction đang chạy luôn mất, nên ứng dụng phải retry có giới hạn và idempotent. Mục tiêu tôi đo là thời gian không ghi được từ phía ứng dụng, và diễn tập hằng quý."

> Senior tip: mục tiêu đo được nên là "thời gian không ghi được" từ góc nhìn ứng dụng, không phải thời gian failover trên console. Với cấu hình mặc định con số này hay là vài phút; sau khi chỉnh DNS TTL, pool và wrapper, nhiều đội đưa được về dưới một phút. Hãy diễn tập hằng quý và ghi số liệu vào runbook.`,
  follow: [
    'FailoverSuccessSQLException xảy ra giữa một giao dịch chuyển tiền: bạn xử lý thế nào để không trừ tiền hai lần?',
    'Read/write splitting với Aurora reader endpoint có bẫy gì về replica lag?',
    'Khi nào chọn RDS Proxy thay vì AWS Advanced JDBC Wrapper?'
  ],
  tags: ['Aurora', 'failover', 'JDBC', 'HikariCP', 'DNS', 'RDS Proxy']
},
{
  id: 'aws-020',
  topic: 'aws',
  level: 'senior',
  q: 'API công khai của ví điện tử bị bot dò mật khẩu và thỉnh thoảng bị DDoS. Bạn dựng lớp biên với CloudFront, AWS WAF và Shield thế nào, cái gì nên cache?',
  a: `**Tóm tắt:** Đặt **CloudFront** trước ALB/API Gateway để kết thúc TLS ở edge, hấp thụ tấn công tầng mạng và cache phần công khai; gắn **AWS WAF** web ACL với managed rules, rate-based rule và Bot Control/ATP cho endpoint đăng nhập; **Shield Standard** miễn phí chống DDoS L3/L4, **Shield Advanced** khi cần đội phản ứng DDoS và bảo vệ chi phí. Quan trọng không kém: khoá origin để chỉ nhận traffic từ CloudFront.

### Hiểu nhanh
Lớp biên giống hệ thống an ninh của một trung tâm thương mại. **CloudFront** là hàng trăm cửa ra vào đặt khắp thành phố: khách vào ở cửa gần nhất, đồ dùng chung (tờ rơi, bảng giá) được phát ngay tại cửa (cache) mà không cần vào kho. **AWS WAF** là bảo vệ kiểm tra từng người ở cửa: ai mang "vũ khí" (SQL injection), ai ra vào quá nhiều lần (dò mật khẩu), ai trông như robot. **Shield** là tường chắn chống đám đông xô đẩy (DDoS): bản Standard miễn phí, bản Advanced có đội phản ứng chuyên nghiệp. Và quan trọng: cửa sau của kho (origin) phải khoá, chỉ mở cho xe của trung tâm.

### Thuật ngữ
- **Edge location**: điểm hiện diện của CloudFront gần người dùng, nơi kết thúc TLS và phục vụ cache.
- **Origin**: backend thật phía sau CloudFront (ALB, API Gateway, S3).
- **Cache key / cache policy**: tập thành phần (path, query, header, cookie) quyết định hai request có dùng chung bản cache không.
- **Web ACL**: bộ rule của AWS WAF gắn vào CloudFront, ALB hoặc API Gateway.
- **Rate-based rule**: rule đếm số request theo IP hoặc khoá tuỳ chỉnh trong một cửa sổ thời gian và chặn khi vượt ngưỡng.
- **Credential stuffing**: dùng danh sách tài khoản/mật khẩu bị lộ từ nơi khác để thử đăng nhập hàng loạt.
- **CGNAT**: nhà mạng cho nhiều thuê bao dùng chung một IP public.
- **Count mode**: chế độ rule chỉ đếm và ghi log, không chặn, dùng để thử rule mới.

### Cơ chế từng bước: một request đăng nhập đi qua lớp biên
1. Client phân giải tên miền, được đưa tới edge location gần nhất; tầng mạng của AWS (Shield Standard) lọc SYN flood, UDP reflection.
2. CloudFront kết thúc TLS. Vì sao ở edge: tiết kiệm CPU của origin, giảm độ trễ bắt tay.
3. WAF đánh giá web ACL theo thứ tự ưu tiên: IP reputation, rule lỗ hổng, rate-based, Bot Control/ATP (chỉ cho {{/login}}). Rule nào Block thì trả 403 ngay, origin không hề biết.
4. Request hợp lệ: path công khai có thể trả từ cache; {{/login}} dùng CachingDisabled nên đi tiếp tới origin kèm header bí mật.
5. ALB chỉ nhận traffic từ prefix list của CloudFront và có header bí mật; app đọc IP thật của client từ X-Forwarded-For.

~~~text
Đợt credential stuffing (minh hoạ): 2 triệu lần thử / 1 giờ từ 40.000 IP
  -> mỗi IP chỉ ~50 request/giờ: rate limit theo IP (ví dụ 100/5 phút) KHÔNG bắt được
  -> ATP so khớp thông tin đăng nhập bị lộ + Bot Control + tín hiệu thiết bị
  -> ALB/ECS chỉ còn thấy phần nhỏ traffic, autoscale không bị kích hoạt vô ích
~~~

### Vì sao lại là edge
Tấn công càng bị chặn gần người dùng thì càng rẻ: SYN flood, UDP reflection bị hạ tầng edge của AWS hấp thụ; request L7 xấu bị WAF chặn trước khi tạo connection tới ALB, không tốn CPU của service Java, không kích hoạt auto scaling vô ích.

~~~text
Client -> CloudFront (TLS, cache, WAF, Shield) -> ALB (chỉ nhận từ CloudFront) -> ECS
~~~

### CloudFront: cache gì
- **Nên cache**: static asset, cấu hình công khai, danh sách tỉnh/ngân hàng, tỷ giá công bố (TTL ngắn 10–60 giây). Cache key chỉ gồm query/header thật sự làm đổi nội dung, cache key thừa làm tỷ lệ hit về 0.
- **Không cache**: response cá nhân hoá (số dư, lịch sử giao dịch), mọi thứ phụ thuộc token. Dùng cache policy CachingDisabled cho các path đó.
- Origin response timeout mặc định 30 giây; endpoint chạy lâu hơn phải đổi thiết kế, không chỉ tăng timeout.

### Khoá origin
- Security group của ALB chỉ cho phép managed prefix list {{com.amazonaws.global.cloudfront.origin-facing}}.
- Thêm custom header bí mật từ CloudFront và rule ALB từ chối request thiếu header (vì prefix list là của mọi khách hàng CloudFront, không riêng bạn).
- Hoặc dùng CloudFront VPC origin để ALB nằm hoàn toàn trong private subnet.

### AWS WAF: các lớp rule
| Lớp | Rule | Mục đích |
|---|---|---|
| Danh tiếng | Amazon IP reputation, Anonymous IP list | Chặn IP botnet, proxy ẩn danh |
| Lỗ hổng | Core rule set, Known bad inputs, SQL database | Payload SQLi, XSS, Log4Shell |
| Tần suất | Rate-based rule theo IP hoặc khoá tuỳ chỉnh | Chống flood, dò mật khẩu |
| Bot | Bot Control, Challenge/CAPTCHA | Phân biệt bot với trình duyệt thật |
| Gian lận | Account Takeover Prevention (ATP) | Phát hiện credential stuffing ở endpoint login |

- Web ACL cho CloudFront phải tạo ở scope CloudFront (region us-east-1).
- Bot Control và ATP tính phí thêm theo request: chỉ áp cho path cần như /login, /otp bằng scope-down statement.
- Rule mới luôn chạy **Count** vài ngày, xem log rồi mới chuyển Block.

### Shield
- **Standard**: miễn phí, tự động, chống L3/L4.
- **Advanced**: phí cố định hằng tháng (khoảng 3.000 USD/tháng cho cả organization, cam kết 1 năm, kiểm tra tài liệu hiện hành), có Shield Response Team, tự động giảm thiểu DDoS L7 bằng WAF, bảo vệ chi phí khi bị DDoS làm scale. Hợp với ngân hàng/ví có SLA và rủi ro danh tiếng lớn.

### Lỗi hay gặp
- **Rate limit theo IP quá chặt ở Việt Nam.** Triệu chứng: khách thật dùng 4G bị chặn hàng loạt vì nhà mạng dùng CGNAT, hàng nghìn người chung một IP. Cách tránh: khoá theo header/thiết bị, ngưỡng riêng cho {{/login}}, chạy Count trước khi Block.
- **Ứng dụng đọc nhầm IP client.** Triệu chứng: log và rate limit trong app đều thấy IP của CloudFront/ALB. Cách tránh: lấy từ X-Forwarded-For (Spring: {{server.forward-headers-strategy}}) hoặc header {{CloudFront-Viewer-Address}}.
- **Origin không khoá.** Triệu chứng: kẻ tấn công gọi thẳng ALB, vượt qua toàn bộ WAF và cache. Cách tránh: prefix list + header bí mật, hoặc CloudFront VPC origin.
- **Chặn theo quốc gia hoặc cache key thừa.** Triệu chứng: khách đi nước ngoài không đăng nhập được; tỷ lệ cache hit về 0. Cách tránh: dùng CAPTCHA/Challenge thay vì chặn cứng; cache key chỉ gồm thành phần làm đổi nội dung.

### Trả lời miệng 1 phút
"Tôi đặt CloudFront trước ALB hoặc API Gateway để kết thúc TLS ở edge, hấp thụ tấn công tầng mạng và cache phần công khai như cấu hình, danh sách ngân hàng với TTL ngắn; mọi thứ cá nhân hoá như số dư thì tắt cache. Trên CloudFront gắn AWS WAF với managed rules cho IP xấu và payload tấn công, rate-based rule, và Bot Control cùng Account Takeover Prevention chỉ áp cho /login để kiểm soát chi phí; rule mới luôn chạy Count trước. Shield Standard miễn phí lo DDoS tầng 3 và 4, Shield Advanced khi cần đội phản ứng và bảo vệ chi phí. Origin phải khoá bằng prefix list của CloudFront cộng header bí mật. Kinh nghiệm của tôi: credential stuffing thật dùng hàng chục nghìn IP, nên rate limit theo IP gần như vô dụng, phải dựa vào tín hiệu bot và thiết bị."

> Senior tip: đo hiệu quả bằng số liệu WAF log trong Athena: tỷ lệ request bị chặn theo rule, top IP/ASN, false positive do CSKH báo. Một đợt credential stuffing thực tế thường dùng hàng chục nghìn IP, mỗi IP vài request; rate limit theo IP gần như vô dụng, phải dựa vào Bot Control/ATP và tín hiệu thiết bị.`,
  follow: [
    'Bạn tránh cache nhầm dữ liệu cá nhân của người dùng này cho người dùng khác thế nào?',
    'Credential stuffing dùng 50.000 IP khác nhau: rate-based rule có đủ không?',
    'Khi nào chi phí Shield Advanced là đáng?'
  ],
  tags: ['CloudFront', 'WAF', 'Shield', 'DDoS', 'bot', 'edge']
},
{
  id: 'aws-021',
  topic: 'aws',
  level: 'lead',
  refs: [{"type": "doc", "title": "AWS Documentation", "url": "https://docs.aws.amazon.com/"}, {"type": "doc", "title": "AWS Well-Architected", "url": "https://aws.amazon.com/architecture/well-architected/"}],
  q: 'Ngân hàng của bạn đang chạy mọi thứ trong 2 AWS account dùng chung. Bạn thiết kế lại theo mô hình multi-account với Organizations, Control Tower và SCP thế nào, chuyển đổi ra sao?',
  a: `**Tóm tắt:** Account là ranh giới cách ly mạnh nhất trên AWS: tách IAM, quota, chi phí và phạm vi sự cố. Dùng **AWS Organizations** chia account theo OU (Security, Infrastructure, Workloads prod/non-prod, Sandbox), **Control Tower** dựng landing zone chuẩn (log archive, audit, IAM Identity Center, controls), và **SCP** làm hàng rào "không ai được vượt", kể cả admin của account con. Chuyển đổi dần theo từng workload, không big bang.

### Hiểu nhanh
Hai account dùng chung cho mọi thứ giống một công ty mà mọi phòng ban ở chung một căn phòng, dùng chung một chìa khoá và một đồng hồ điện: ai cũng chạm được tủ hồ sơ của nhau, và không biết phòng nào tiêu tốn bao nhiêu. **Multi-account** là chia thành nhiều phòng riêng có khoá riêng. **Organizations** là sơ đồ toà nhà gom phòng thành tầng (OU). **Control Tower** là ban quản lý toà nhà: xây phòng mới theo mẫu chuẩn, có camera (log) sẵn. **SCP** là nội quy toà nhà: kể cả trưởng phòng (admin của account) cũng không được phá camera hay mở cửa thoát hiểm.

### Thuật ngữ
- **Management account**: account gốc tạo organization, lo billing; SCP không áp lên account này.
- **OU (Organizational Unit)**: nhóm account trong organization; policy gắn ở OU áp cho mọi account bên dưới.
- **Landing zone**: môi trường multi-account chuẩn có sẵn log, bảo mật, mạng, danh tính.
- **SCP (Service Control Policy)**: policy giới hạn quyền tối đa của mọi principal trong account con.
- **RCP (Resource Control Policy)**: loại policy mới hơn của Organizations, giới hạn quyền tối đa trên tài nguyên (ví dụ S3, KMS) bất kể ai gọi tới.
- **IAM Identity Center**: dịch vụ đăng nhập một lần vào nhiều account qua permission set, nối với IdP công ty.
- **Account Factory / AFT**: cơ chế của Control Tower tạo account mới có sẵn baseline; AFT là phiên bản dùng Terraform.
- **CDE (Cardholder Data Environment)**: phần hệ thống lưu, xử lý hoặc truyền dữ liệu thẻ, thuộc phạm vi PCI DSS.

### Cơ chế từng bước: quyền hiệu lực khi một dev gọi API trong account payments-prod
1. Dev đăng nhập IAM Identity Center bằng tài khoản công ty, chọn permission set ReadOnly cho payments-prod. Vì sao: không có IAM user và mật khẩu riêng ở từng account.
2. Identity Center cấp credential tạm của role tương ứng trong account đó.
3. Khi gọi API, AWS đánh giá: SCP của mọi OU từ root xuống account có cho phép action này không? Nếu SCP chặn thì từ chối, dù role có AdministratorAccess.
4. Tiếp theo xét RCP (nếu có), identity policy, resource policy, permission boundary; explicit Deny ở bất kỳ đâu đều thắng.
5. Mọi lời gọi được CloudTrail organization trail ghi vào account log-archive, nơi người của payments-prod không có quyền xoá.

~~~text
Quyền hiệu lực = giao của các lớp
  SCP (root -> Workloads OU -> Prod OU)   : giới hạn trần cho account
  ∩ Identity policy / permission set      : quyền thật được cấp
  ∩ Resource policy, boundary, RCP        : giới hạn thêm
  - bất kỳ explicit Deny nào              : thắng tất cả
Ví dụ: role có "*:*", SCP Deny cloudtrail:StopLogging -> vẫn KHÔNG tắt được trail
~~~

### Vì sao không ở chung account
- Một IAM policy sai trong account chung có thể cho dev đọc dữ liệu prod.
- Quota (Lambda concurrency, API Gateway throttle) chia chung: môi trường test chạy load test làm prod bị throttle.
- Kiểm toán PCI DSS: account chứa dữ liệu thẻ nằm trong phạm vi kiểm toán; nếu mọi thứ chung một account thì toàn bộ hệ thống thành phạm vi kiểm toán.
- Chi phí khó phân bổ theo team/sản phẩm.

### Cấu trúc gợi ý
~~~text
Root (management account: chỉ billing + Organizations, không chạy workload)
├── Security OU:   log-archive, security-tooling (GuardDuty, Security Hub admin)
├── Infrastructure OU: network (Transit Gateway, egress, DNS), shared-services (CI/CD)
├── Workloads OU
│   ├── Prod OU:     payments-prod, lending-prod, cards-prod (CDE tách riêng)
│   └── NonProd OU:  payments-dev, payments-uat, ...
├── Sandbox OU:    thử nghiệm, có budget và tự dọn
└── Suspended OU:  account chờ đóng, SCP chặn mọi thứ
~~~
Nguyên tắc: một workload một account cho mỗi môi trường; policy gắn ở OU, không gắn lẻ từng account.

### Control Tower làm gì
- Dựng landing zone: account log archive và audit, CloudTrail cấp organization, AWS Config, IAM Identity Center.
- **Controls**: preventive (triển khai bằng SCP), detective (Config rule), proactive (kiểm tra template CloudFormation trước khi tạo tài nguyên).
- **Account Factory** (hoặc AFT với Terraform) tạo account mới đã có sẵn baseline: VPC chuẩn, role, log, budget.

### SCP: hiểu đúng cơ chế
- SCP **không cấp quyền**, chỉ giới hạn quyền tối đa. Quyền hiệu lực = IAM policy cho phép VÀ SCP không chặn.
- Áp cho mọi principal trong account con, kể cả root user, nhưng **không áp cho management account**, nên không chạy workload ở đó.
- Không ảnh hưởng service-linked role.

~~~json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "ProtectAuditTrail", "Effect": "Deny",
      "Action": ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail",
                 "organizations:LeaveOrganization", "guardduty:DeleteDetector"],
      "Resource": "*" },
    { "Sid": "DenyRootUser", "Effect": "Deny", "Action": "*", "Resource": "*",
      "Condition": { "StringLike": { "aws:PrincipalArn": "arn:aws:iam::*:root" } } }
  ]
}
~~~
Giới hạn region (ví dụ chỉ ap-southeast-1) nên dùng control có sẵn của Control Tower thay vì tự viết, vì phải miễn trừ đúng các dịch vụ global như IAM, CloudFront, Route 53.

### Danh tính và mạng
- Người dùng đăng nhập qua **IAM Identity Center** nối với IdP công ty, quyền theo permission set; không tạo IAM user. Có quy trình break-glass được giám sát.
- Mạng: Transit Gateway hoặc chia sẻ subnet qua RAM; quy hoạch CIDR không trùng ngay từ đầu; egress tập trung qua firewall.

### Lộ trình chuyển đổi
1. Dựng landing zone mới song song, chưa động vào workload.
2. Bật CloudTrail organization, GuardDuty, Security Hub cho mọi account.
3. Chuyển workload ít rủi ro trước (non-prod), rồi đến prod theo từng hệ thống.
4. Account cũ thu hẹp dần, cuối cùng vào Suspended OU.

### Lỗi hay gặp
- **Áp SCP thẳng vào Prod OU mà chưa thử.** Triệu chứng: pipeline deploy bị chặn, sự cố production do chính guardrail. Cách tránh: luôn có OU thử nghiệm policy, áp dần từ sandbox lên non-prod rồi prod.
- **SCP phình to.** Triệu chứng: chạm giới hạn kích thước và số policy gắn trên mỗi node (kiểm tra tài liệu hiện hành). Cách tránh: viết gọn, gom nhóm action, ưu tiên control có sẵn của Control Tower.
- **Account dễ tạo, khó đóng.** Triệu chứng: hàng chục account không chủ, vẫn tốn tiền và là bề mặt tấn công. Cách tránh: quy trình vòng đời account, tag chủ sở hữu, Suspended OU.
- **Chạy workload trong management account.** Triệu chứng: workload đó không chịu bất kỳ SCP nào. Cách tránh: management account chỉ dùng cho billing và Organizations.

### Trả lời miệng 1 phút
"Account là ranh giới cách ly mạnh nhất trên AWS: tách IAM, quota, chi phí và phạm vi sự cố. Với ngân hàng đang dùng chung hai account, tôi dựng landing zone bằng Control Tower: management account chỉ lo billing, OU Security có log-archive và security tooling, OU Infrastructure có network và CI/CD, OU Workloads chia prod và non-prod theo từng hệ thống, CDE của thẻ tách riêng. Người dùng đăng nhập qua IAM Identity Center, không có IAM user. SCP là trần quyền, không cấp quyền; nó áp cả cho root của account con nhưng không áp cho management account, nên tôi dùng nó để cấm tắt CloudTrail, rời organization, dùng region không được duyệt. Chuyển đổi tôi làm dần: dựng song song, bật log và GuardDuty toàn tổ chức, chuyển non-prod trước rồi tới prod. Với ban lãnh đạo, tôi nói bằng phạm vi kiểm toán PCI thu hẹp và chi phí rõ theo sản phẩm."

> Senior tip: khi trình bày với ban lãnh đạo, đừng nói "best practice của AWS". Hãy nói bằng rủi ro và tiền: thu hẹp phạm vi kiểm toán PCI, một sự cố ở dev không thể chạm prod, và chi phí hiện rõ theo sản phẩm. Đó là ba lý do giúp dự án landing zone được duyệt.`,
  follow: [
    'Vì sao SCP không áp cho management account, và hệ quả về vận hành?',
    'Bạn cho team tự tạo tài nguyên nhưng vẫn giữ được guardrail thế nào?',
    'Chia sẻ VPC qua RAM so với mỗi account một VPC nối Transit Gateway: chọn cái nào?'
  ],
  tags: ['Organizations', 'Control Tower', 'SCP', 'landing zone', 'multi-account', 'IAM Identity Center']
},
{
  id: 'aws-022',
  topic: 'aws',
  level: 'senior',
  q: 'Hệ thống thanh toán thẻ chạy trên AWS cần đạt PCI DSS và tuân thủ yêu cầu lưu trữ dữ liệu tại Việt Nam. Trách nhiệm của AWS dừng ở đâu, bạn mã hoá, kiểm soát truy cập và audit thế nào?',
  a: `**Tóm tắt:** Theo **shared responsibility model**, AWS chịu trách nhiệm bảo mật "của" cloud (datacenter, phần cứng, hạ tầng dịch vụ) và có chứng nhận PCI DSS Level 1; bạn chịu trách nhiệm bảo mật "trong" cloud: cấu hình, IAM, mã hoá, dữ liệu, ứng dụng, log. Chiến lược: thu nhỏ phạm vi dữ liệu thẻ (tokenization, account riêng), mã hoá bằng KMS với phân tách quyền, ghi mọi thao tác bằng CloudTrail vào kho log bất biến, và xác định với bộ phận pháp chế dữ liệu nào bắt buộc nằm tại Việt Nam.

### Hiểu nhanh
Shared responsibility giống thuê căn hộ trong toà nhà có bảo vệ: chủ toà nhà (AWS) lo móng, tường, cửa chính và camera sảnh; còn khoá cửa căn hộ, ai được giữ chìa, két sắt đặt ở đâu là việc của bạn. Toà nhà đạt chuẩn an toàn không có nghĩa căn hộ của bạn an toàn nếu bạn để cửa mở. **Tokenization** giống gửi vàng vào ngân hàng và chỉ cầm biên nhận: mọi giao dịch hằng ngày dùng biên nhận (token), chỉ một chỗ duy nhất (vault) giữ vàng thật (số thẻ), nên chỉ chỗ đó phải canh gác nghiêm ngặt.

### Thuật ngữ
- **PCI DSS**: bộ tiêu chuẩn bảo mật bắt buộc cho tổ chức lưu, xử lý hoặc truyền dữ liệu thẻ thanh toán; phiên bản hiện hành là v4.x.
- **PAN (Primary Account Number)**: số thẻ in trên mặt thẻ, dữ liệu trung tâm cần bảo vệ.
- **CDE**: môi trường chứa dữ liệu thẻ; mọi hệ thống kết nối tới nó cũng nằm trong phạm vi kiểm toán.
- **Tokenization**: thay PAN bằng một giá trị thay thế không suy ngược được nếu không có vault.
- **Customer managed key (KMS)**: KMS key do bạn tạo và kiểm soát key policy, rotation, quyền dùng.
- **CloudHSM**: HSM chuyên dụng một khách hàng, bạn toàn quyền quản lý khoá và cluster.
- **Log file integrity validation**: CloudTrail tạo file digest có chữ ký để chứng minh log không bị sửa hay xoá.
- **S3 Object Lock**: chế độ WORM, object không thể bị xoá/ghi đè trong thời gian giữ, kể cả bởi admin (ở compliance mode).

### Cơ chế từng bước: một giao dịch thẻ với tokenization
1. Trang thanh toán gửi PAN thẳng tới **token vault** (account CDE riêng) qua TLS; các service khác không bao giờ nhận PAN. Vì sao: service nào chạm PAN là nằm trong phạm vi kiểm toán.
2. Vault mã hoá PAN bằng envelope encryption với KMS key riêng, lưu ciphertext, trả về token.
3. Order-service, lịch sử giao dịch, báo cáo chỉ lưu token và 4 số cuối.
4. Khi cần gửi sang cổng thanh toán, chỉ vault (hoặc service trong CDE) gọi KMS Decrypt để lấy PAN và gửi đi qua PrivateLink/TLS.
5. Mọi lời gọi KMS và truy cập S3 trong CDE được CloudTrail ghi vào account log-archive có Object Lock; EventBridge cảnh báo ngay khi key policy bị sửa hoặc trail bị tắt.

~~~text
Browser --PAN--> [ token vault | account CDE ] --token tok_8f2c...--> order-service
                        |  KMS Decrypt (chỉ role vault)               (ngoài CDE)
                        v
                 Cổng thanh toán (TLS)
CloudTrail (mọi account) --> log-archive: S3 Object Lock + digest
Phạm vi kiểm toán: 40 service -> 3 service (vault, payment gateway adapter, log)
~~~

### Shared responsibility trong thực tế
| Thành phần | AWS | Bạn |
|---|---|---|
| Datacenter, phần cứng, hypervisor | Có | Không |
| Patch OS của EC2 | Không | Có |
| Patch engine RDS/Aurora | AWS thực hiện | Bạn chọn maintenance window, version |
| Security group, IAM, mã hoá | Cung cấp công cụ | Cấu hình đúng |
| Dữ liệu và ứng dụng | Không | Có |

Dùng dịch vụ "PCI compliant" không làm hệ thống của bạn compliant. Báo cáo của AWS (AOC, SOC) lấy từ **AWS Artifact** chỉ chứng minh phần trách nhiệm của AWS.

### Thu nhỏ phạm vi kiểm toán (CDE)
- **Tokenization**: chỉ một service vault lưu PAN; các service khác chỉ thấy token. Phạm vi kiểm toán co lại còn vault và những gì kết nối tới nó.
- Đặt vault trong account và VPC riêng, chỉ mở qua PrivateLink; các account khác ngoài phạm vi.
- Không bao giờ lưu dữ liệu xác thực nhạy cảm (CVV, track data) sau khi authorize.

### Mã hoá
- At rest: **KMS customer managed key** cho RDS, S3, EBS, mỗi loại dữ liệu một key. Key policy tách quyền: người quản trị key không dùng được key để giải mã; ứng dụng chỉ có Decrypt.
- Bật rotation tự động; với PAN dùng thêm mã hoá cấp ứng dụng (envelope encryption) để DBA đọc bảng cũng chỉ thấy ciphertext.
- Cần HSM đơn thuê bao, tự kiểm soát hoàn toàn: **CloudHSM**; đổi lại tự vận hành cluster, đắt hơn nhiều.
- In transit: TLS 1.2 trở lên ở mọi chặng, kể cả trong VPC (PostgreSQL bật {{rds.force_ssl}}).

### Audit với CloudTrail
- **Organization trail** ghi management event của mọi account vào S3 ở account log archive, bật **log file integrity validation** (file digest để chứng minh log không bị sửa) và **S3 Object Lock**.
- Data event (đọc/ghi object S3 chứa dữ liệu nhạy cảm, gọi Lambda) không bật mặc định và tính phí thêm: chỉ bật cho bucket/hàm trong CDE.
- Event history miễn phí trên console chỉ giữ 90 ngày; PCI DSS yêu cầu giữ log audit ít nhất 12 tháng, 3 tháng gần nhất truy xuất được ngay.
- Truy vấn bằng Athena hoặc CloudTrail Lake; cảnh báo theo thời gian thực qua EventBridge cho thao tác nhạy cảm (tắt trail, sửa key policy, đăng nhập root).

### Kiểm soát liên tục
- **AWS Config** conformance pack cho PCI DSS, **Security Hub** chạy standard PCI DSS, **GuardDuty** phát hiện bất thường, **Macie** quét S3 tìm dữ liệu thẻ/PII lọt ra ngoài phạm vi.
- MFA cho mọi truy cập vào CDE (yêu cầu của PCI DSS v4).

### Dữ liệu tại Việt Nam
- Các văn bản cần đối chiếu: Luật An ninh mạng 2018 và Nghị định 53/2022 (lưu trữ dữ liệu tại Việt Nam với một số loại doanh nghiệp/dữ liệu), quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023 và luật mới), quy định của NHNN về an toàn hệ thống thông tin. Diễn giải phải do pháp chế/compliance chốt, kỹ sư không tự kết luận.
- AWS chưa có region đầy đủ tại Việt Nam (chỉ có Local Zone Hà Nội, kiểm tra hiện hành). Mô hình hay gặp: dữ liệu gốc khách hàng ở on-prem trong nước, workload trên AWS chỉ xử lý dữ liệu đã token hoá/ẩn danh; hoặc chỉ dùng cloud cho hệ thống không chứa dữ liệu bị ràng buộc.
- Chặn tạo tài nguyên ngoài region được duyệt bằng SCP để dữ liệu không vô tình đi sai nơi.

### Lỗi hay gặp
- **PAN lọt vào log, stack trace, message queue.** Triệu chứng: phạm vi kiểm toán lan ra cả hệ thống log và hàng đợi. Cách tránh: masking ở logger, không log request body ở luồng thanh toán, Macie và quét định kỳ.
- **Shared service có quyền vào CDE.** Triệu chứng: CI/CD hoặc monitoring tự động nằm trong phạm vi kiểm toán. Cách tránh: pipeline và agent riêng cho CDE, kết nối một chiều có kiểm soát.
- **Account log archive ai cũng xoá được.** Triệu chứng: audit vô giá trị vì không chứng minh được log nguyên vẹn. Cách tránh: SCP chặn xoá, Object Lock, integrity validation, quyền chỉ đọc cho người điều tra.
- **Nghĩ rằng dùng dịch vụ "PCI compliant" là đủ.** Triệu chứng: kiểm toán chỉ ra cấu hình sai dù mọi dịch vụ đều nằm trong danh sách. Cách tránh: báo cáo trên AWS Artifact chỉ chứng minh phần của AWS; phần cấu hình phải tự chứng minh bằng Config, Security Hub.

### Trả lời miệng 1 phút
"Theo shared responsibility model, AWS lo bảo mật của cloud như datacenter, phần cứng, hạ tầng dịch vụ và có chứng nhận PCI DSS Level 1; tôi lo bảo mật trong cloud: IAM, cấu hình mạng, mã hoá, dữ liệu, ứng dụng và log. Chiến lược đầu tiên của tôi là thu nhỏ phạm vi: tokenization để chỉ một vault trong account riêng chạm số thẻ, các service khác chỉ thấy token. Mã hoá bằng KMS customer managed key, tách người quản trị key khỏi người dùng key, thêm mã hoá cấp ứng dụng cho PAN. Audit bằng organization trail vào account log-archive có Object Lock và integrity validation, giữ ít nhất 12 tháng. Với yêu cầu dữ liệu tại Việt Nam, tôi để pháp chế chốt diễn giải, rồi thiết kế hybrid và dùng SCP chặn region không được duyệt. Thứ tiết kiệm nhất là giảm số hệ thống chạm dữ liệu thẻ."

> Senior tip: thứ tiết kiệm nhiều tiền kiểm toán nhất không phải là thêm công cụ bảo mật mà là giảm số hệ thống chạm vào dữ liệu thẻ. Mỗi service bạn đưa ra khỏi CDE nhờ tokenization là bớt một hạng mục phải chứng minh hằng năm.`,
  follow: [
    'Tokenization khác mã hoá thế nào về phạm vi PCI DSS?',
    'Bạn chứng minh với kiểm toán rằng log CloudTrail không bị sửa thế nào?',
    'Pháp chế yêu cầu dữ liệu khách hàng phải ở Việt Nam: kiến trúc hybrid của bạn ra sao?'
  ],
  tags: ['PCI DSS', 'compliance', 'CloudTrail', 'KMS', 'shared responsibility', 'data residency']
}
);
