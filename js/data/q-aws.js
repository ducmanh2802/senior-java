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

### Ví dụ đời thực
Một đội 6 người vận hành API Spring Boot nội bộ trên EC2 m5.large (2 instance) sau ALB, chạy 24/7. Triệu chứng: sáng chiều traffic ít, tối tuần spike, chi phí EC2 ước hơn 200 USD/tháng trong khi CPU trung bình chỉ 30-40%; scale out khi spike mất 3-5 phút (bật máy + JVM khởi động), khách thấy chậm. Đội tra qua CloudWatch: CPUUtilization thấp hơn 40% phần lớn thời gian, instance không thể thu nhỏ trong ngày vì phải vá OS và quản AMI. Nguyên nhân gốc: trả tiền cho thời gian instance bật dù ít request, và JVM khởi động chậm làm scale-out chậm. Xử lý: đóng gói Spring Boot thành Docker image, đẩy ECR, chuyển sang ECS Fargate 2 task (0,5 vCPU, 1 GB) sau ALB, task definition khai báo CPU/memory/IAM task role, HikariCP pool 10. Kết quả: không còn vá OS instance, chi phí compute ước giảm một phần ba, scale từ phút xuống vài giây; sau 3 tháng task ổn định 50-70% CPU, không còn OOM khi spike.
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

### Ví dụ đời thực
Một hàm Lambda Java nhận webhook từ cổng thanh toán, dùng Spring Boot 3, 1 GB memory, gọi $LATEST. Triệu chứng: thanh toán khách bị timeout, cold start p99 khoảng 6-8 giây. Đội đọc dòng log REPORT: Init Duration 5-6 giây mỗi lần cold start, Restore Duration không xuất hiện vì trigger gọi $LATEST chứ không phải version đã publish. Nguyên nhân gốc: Spring dựng context, Hibernate đọc metadata và connection pool khởi tạo trong init phase, mất phần lớn vài giây. Xử lý: publish version, trỏ API Gateway qua alias, bật SnapStart; trong afterRestore (hook CRaC) đóng và mở lại connection pool, sinh idempotency key bằng SecureRandom trong handler chứ không phải trong init. Kết quả: cold start xuống dưới 1 giây (restore khoảng 300-600 ms), p99 từ 8 giây xuống 1,2 giây, và sau restore không còn lỗi connection reset tới RDS.
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

### Ví dụ đời thực
Một đội chạy 3 service ECS Fargate trong private subnet gọi API đối tác và đọt file lên S3. Triệu chứng: hoá đơn NAT Gateway tăng vọt mỗi lần deploy (kéo image Docker qua NAT), và sau khi đổi route table các task không gọi được S3. Đội tra qua VPC Flow Logs và route table: traffic S3 đi qua NAT (tính phí theo GB), không có gateway endpoint; một NAT chung cho hai AZ nên AZ chứa NAT gặp sự cố là toàn hệ mất egress, ngày thường còn phát sinh phí cross-AZ. Nguyên nhân gốc: thiếu VPC endpoint và NAT không chia theo AZ. Xử lý: thêm gateway endpoint cho S3 và DynamoDB (miễn phí, vào route table), thêm interface endpoint cho ECR, CloudWatch Logs, Secrets Manager bật private DNS, và đặt một NAT Gateway trong mỗi AZ, route table private của AZ nào trỏ NAT của AZ đó. Kết quả: chi phí NAT ước giảm 70%, task kéo image không qua NAT, các service gọi S3 không ra Internet, và mất một AZ không làm ngắt egress của các AZ còn lại.
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

### Ví dụ đời thực
Một service ECS cần đọc file đơn hàng trên S3. Ban đầu team thêm quyền vào execution role "để chạy nhanh", sau lâu lại nhúng access key vào biến môi trường container để test nhanh. Triệu chứng: bot quét tìm access key trong vài phút, GuardDuty báo gọi S3 từ IP lạ; code gọi S3 lại bị AccessDenied vì quyền nằm ở execution role chứ không phải task role. Đội tra qua CloudTrail: request đến từ access key rò rỉ và từ role không đủ quyền trên bucket. Nguyên nhân gốc: nhầm task role (quyền của code) với execution role (quyền ECS agent kéo image, đọc secret, ghi log), và giữ credential lâu dài. Xử lý: xoá và rotate access key ngay, không lưu key trong image hay env; task role chỉ có s3:GetObject trên arn:aws:s3:::orders-docs/* với điều kiện aws:SourceVpce, execution role giữ quyền pull image và ghi log. Kết quả: AccessDenied biến mất, không còn credential lâu dài trong container, và nếu service bị chiếm thì kẻ tấn công chỉ chạm được một bucket cụ thể.
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

### Ví dụ đời thực
Một hệ thương mại điện tử mới chọn DynamoDB lưu mọi thứ vì "scale vặn vanner". Triệu chứng: sau hai tuần, yêu cầu "xem tất cả đơn hàng của khách hàng trong tháng" buộc quét toàn bảng (Scan), ConsumedRCU tăng gấp mười, API chậm dần theo dữ liệu, hoá đơn DynamoDB quá ngân sách. Đội tra qua CloudWatch metric ConsumedRCU và throttling. Nguyên nhân gốc: DynamoDB truy cập chỉ hiệu quả qua partition key, không có join, mọi access pattern phải biết trước; truy vấn ad-hoc không phù hợp. Xử lý: chuyển đơn hàng và thanh toán sang Aurora PostgreSQL (dữ liệu quan hệ, transaction, JOIN), giữ DynamoDB chỉ cho session và giỏ hàng theo access pattern đã liệt kê (khách hàng → đơn hàng qua GSI, TTL cho session). Kết quả: báo cáo chạy trong vài giây thay vì phút, chi phí DynamoDB giảm nửa, dự án đi sản xuất đúng hạn mà không viết join ở tầng ứng dụng.
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

### Ví dụ đời thực
Một bảng đơn hàng dùng pk = ngày tạo, ví dụ 2025-03-10, để "dễ lấy đơn theo ngày". Triệu chứng: mọi ghi dồn vào partition của ngày hôm nay, gặp ProvisionedThroughputExceededException dù bảng tổng thể còn WCU. Đội tra qua CloudWatch: một partition chạm trần 1.000 WCU, các partition khác gần không dùng. Nguyên nhân gốc: partition key ít giá trị khác nhau, tất cả write cùng ngày băm về cùng một phân vùng — hot partition. Xử lý: đổi pk = orderId (UUID, cardinality cao), sk = ORDER#2025-03-10#orderId; nếu vẫn cần lấy đơn theo ngày, thêm GSI có pk là ngày, sk là orderId với projection gọn, hoặc dùng shard suffix (ngày#0 đến ngày#9) rồi đọc scatter-gather. Kết quả: WCU phân bố đều, throttling biến mất, và lấy đơn của khách 42 trong tháng 3 dùng một Query pk = USER#42, begins_with(sk, "ORDER#") thay vì Scan toàn bảng.
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
- Bắt buộc dùng cho file lớn hơn 100 MB theo khuyến nghị; giới hạn một object 5 TB, tối đa 10.000 part, mỗi part 5 MB–5 GB (part cuối có thể nhỏ hơn).
- Upload song song nhiều part tăng tốc đáng kể.
- Nếu một part lỗi, chỉ cần retry part đó. Phải gọi CompleteMultipartUpload; nếu bỏ dở, dùng lifecycle {{AbortIncompleteMultipartUpload}}.
- Kiểm tra checksum (CRC32C/SHA256) để phát hiện hỏng dữ liệu.

### Lỗi hay gặp
- **Bucket public.** Triệu chứng: dữ liệu khách hàng bị index hoặc bị tải hàng loạt, gần như luôn là cấu hình sai. Cách tránh: bật Block Public Access, nội dung công khai thì phục vụ qua CloudFront + OAC.
- **Bật versioning mà không có lifecycle.** Triệu chứng: chi phí lưu trữ tăng âm thầm theo mọi lần ghi đè/xoá vì version cũ vẫn còn. Cách tránh: rule lifecycle xoá noncurrent version sau N ngày và dọn delete marker hết hạn.
- **Multipart upload bỏ dở.** Triệu chứng: bucket "trống" nhưng hoá đơn vẫn tính dung lượng của các part chưa hoàn tất. Cách tránh: lifecycle {{AbortIncompleteMultipartUpload}} sau vài ngày.
- **Dùng S3 làm filesystem.** Triệu chứng: sửa file nhỏ liên tục, mỗi PUT là một object mới, tốn tiền request và chậm. Cách tránh: cần filesystem chia sẻ thì dùng EFS.
- **Không đặt Content-Type khi presign PUT.** Triệu chứng: file tải về bị trình duyệt hiểu sai (tải xuống thay vì hiển thị, hoặc ngược lại). Cách tránh: đặt Content-Type khi ký và kiểm tra lại sau upload.

### Trả lời mẫu khi phỏng vấn
"S3 là object storage: dữ liệu lưu dư nhiều AZ, và từ cuối 2020 đã nhất quán mạnh, ghi xong là đọc và list thấy ngay. Tôi chọn storage class theo tần suất đọc: Standard cho dữ liệu nóng, Intelligent-Tiering khi không đoán được, IA và Glacier cho dữ liệu ít đọc, nhớ rằng chúng có phí lấy ra và thời gian lưu tối thiểu. Với upload từ client, backend ký presigned URL ngắn hạn cho đúng một key, client đẩy thẳng lên S3 nên backend không gánh băng thông; ai có URL là có quyền, nên TTL phải ngắn. File lớn thì dùng multipart: chia part, upload song song, part lỗi chỉ retry part đó. Mặc định mọi bucket tôi bật Block Public Access, versioning kèm lifecycle và rule huỷ multipart dở dang."

### Ví dụ đời thực
  Một ứng dụng lưu ảnh người dùng lên S3. Ban đầu team dùng presigned PUT từ client, không đặt Content-Type, và không có lifecycle rule. Triệu chứng: hàng trăm ảnh bị trình duyệt tải xuống thay vì hiển thị (vì Content-Type default là application/octet-stream); bucket chứa nhiều multipart upload dở dang từ các lần deploy test, chi phí lưu trữ tăng âm thầm; và một lần đổi tên bucket thì không thể được vì các presigned URL đã ký trước. Đội tra qua S3 server access log: thấy nhiều PUT không có Content-Type, nhiều multipart upload chưa hoàn thành (ListMultipartUploads), và số lượng object tăng đều mỗi ngày. Nguyên gốc: thiếu Content-Type khi ký, thiếu lifecycle abort multipart, và không dùng presigned POST có điều kiện. Xử lý: ký Content-Type cụ thể (image/png, image/jpeg) trong presigned PUT; thêm lifecycle rule AbortIncompleteMultipartUpload sau 7 ngày; chuyển sang presigned POST với policy điều kiện content-length-range 0-5MB để giới hạn kích thước. Kết quả: ảnh hiển thị đúng định dạng, multipart dở dang tự dọn sau một tuần, và không ai có thể push file lớn quá 5MB ngay từ client.

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

### Trả lời mẫu khi phỏng vấn
"Tôi phân biệt theo mô hình: SQS là hàng đợi cho worker, mỗi message một consumer; SNS là pub/sub fan-out, thường kết hợp SNS tới nhiều SQS để mỗi service có hàng đợi và DLQ riêng; EventBridge là bus có routing theo nội dung sự kiện; Kinesis và MSK là log có thứ tự theo shard, giữ lại để replay. Với SQS, khi nhận message nó bị ẩn trong visibility timeout; xoá kịp thì xong, không thì message hiện lại và được giao lần nữa, quá maxReceiveCount thì vào DLQ. Vì vậy hệ thống là at-least-once, consumer bắt buộc idempotent bằng khoá nghiệp vụ hoặc bảng dedup. Cần thứ tự theo đơn hàng thì tôi dùng FIFO với message group theo orderId. Mọi consumer của tôi đều có DLQ, alarm theo tuổi message cũ nhất, và idempotency key."

### Ví dụ đời thực
  Một hệ thống xử lý đơn hàng dùng SQS standard queue để các worker ghi database. Ban đầu visibility timeout đặt 30 giây, không có DLQ, và không có idempotency key. Triệu chứng: mỗi lần deploy hoặc worker crash, một phần đơn hàng bị ghi trùng (hai worker cùng xử lý một message vì timeout ngắn hơn thời gian xử lý thực tế p99 là 45 giây), và khi có message poison (lỗi parse JSON) thì retry vô hạn, queue bị tắc và độ trễ đơn hàng tăng vọt. Đội tra CloudWatch: ApproximateAgeOfOldestMessage tăng, số ApproximateReceiveCount cao, và không có metric nào cảnh báo DLQ vì DLQ không tồn tại. Nguyên gốc: visibility timeout < p99 xử lý, thiếu DLQ và redrive policy, và consumer không idempotent. Xử lý: tăng visibility timeout lên 120 giây (lớn hơn p99 45 giây), thêm DLQ với maxReceiveCount 3, dùng ChangeMessageVisibility để gia hạn cho job dài, và thêm idempotency key (orderId + eventType) vào mỗi message để worker upsert có điều kiện. Kết quả: không còn ghi trùng, poison message bị chuyển sang DLQ sau 3 lần retry, và độ trễ p99 giảm từ vài phút xuống vài giây.

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

### Trả lời mẫu khi phỏng vấn
"Multi-AZ bảo vệ khỏi mất một datacenter trong region, thường tự động và RTO tính bằng phút; multi-region bảo vệ khỏi mất cả region nhưng đắt và phức tạp hơn nhiều. Tôi luôn bắt đầu từ hai con số do business ký: RTO là thời gian được phép ngừng dịch vụ, RPO là lượng dữ liệu được phép mất. Từ đó chọn chiến lược rẻ nhất đáp ứng: backup and restore tính bằng giờ, pilot light giữ dữ liệu nóng ở region phụ, warm standby chạy bản thu nhỏ đầy đủ, active-active gần như không gián đoạn nhưng phải xử lý xung đột ghi. Về công cụ tôi dùng Aurora Global Database với RPO khoảng một giây, Route 53 failover, IaC để dựng region phụ. Kinh nghiệm của tôi là DR chỉ tồn tại khi đã diễn tập và đo RTO thật."

### Ví dụ đời thực
  Một hệ thống ghi nhận doanh số của một công ty logistics cần DR sau bão lụt làm mất toàn bộ datacenter ở region chính. Ban đầu team chỉ có backup hàng tuần lên S3 ở region phụ, không có IaC, và chưa từng restore thử. Triệu chứng: khi region chính mất, team phải dựng lại toàn bộ hệ thống bằng tay: tạo VPC, IAM, ECS cluster, RDS, cài app — mất 8 giờ (RTO thực tế) và mất dữ liệu từ 6 ngày nãy (RPO thực tế), doanh thu khoảng 3 triệu USD. Đội tra: backup ở S3 có, nhưng không có script restore, và snapshot RDS thiếu permission KMS ở region phụ. Nguyên gốc: chọn chiến lược backup & restore thay vì warm standby, và chưa diễn tập. Xử lý: xây dựng lại bằng CloudFormation (IaC) để có thể dựng region phụ trong 20 phút, dùng Aurora Global Database (RPO khoảng 1 giây), đặt Route 53 failover với TTL 60 giây, và diễn tập game day 6 tháng/lần. Kết quả: RTO thực tế sau khi cải tiến xuống 25 phút, RPO dưới 1 giây, và lần diễn tập thứ hai phát hiện thêm thiếu secret nên đã sửa trước khi sự cố thật xảy ra.

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
- Spring Boot: bật {{server.shutdown=graceful}} (phải khai báo, có từ Spring Boot 2.3) và {{spring.lifecycle.timeout-per-shutdown-phase=30s}}.
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

### Trả lời mẫu khi phỏng vấn
"ALB là load balancer tầng 7, hiểu HTTP nên route theo path, host, header, hợp cho API Spring Boot; NLB là tầng 4, độ trễ rất thấp, có IP tĩnh, hợp khi đối tác cần whitelist IP hoặc giao thức không phải HTTP. Auto Scaling tôi dùng target tracking theo CPU hoặc request mỗi target, scale-out nhanh, scale-in chậm. Để scale-in không rơi request, ba thứ phải khớp nhau: target group deregistration delay để LB ngừng gửi request mới và chờ request cũ, graceful shutdown trong Spring Boot để app xử lý nốt khi nhận SIGTERM, và stopTimeout của ECS hoặc terminationGracePeriod của Kubernetes đủ dài trước khi bị SIGKILL; trên Kubernetes thêm preStop sleep vài giây. Health check thì nhẹ và không phụ thuộc cứng vào DB. Tôi luôn kiểm chứng bằng cách giảm desired count trong lúc bắn tải và xem có 5xx không."

### Ví dụ đời thực
  Một nền tảng giao dịch ECS Fargate chạy 30 task sau ALB, tự động scale theo CPU. Ban đầu team không có connection draining, graceful shutdown chỉ dùng default, và không test scale-in. Triệu chứng: mỗi lần deploy hoặc scale-in (khi CPU giảm), khách thấy lỗi 502 lẻ tẻ khoảng 10-20 giây; số lượng connection tới RDS tăng theo số task, và một lần scale-in từ 30 xuống 10 task thì khoảng 5 request bị mất do SIGKILL trước khi request xử lý xong. Đội tra ALB metric UnhealthyHostCount và target response time: thấy target bị deregister nhưng request vẫn được gửi trong vài giây, và app log có nhiều connection reset. Nguyên gốc: thiếu deregistration delay, graceful shutdown chưa bật, và stopTimeout quá ngắn so với thời gian xử lý request p99. Xử lý: đặt deregistration delay 60 giây, bật server.shutdown=graceful với timeout-per-shutdown-phase 30s, tăng stopTimeout lên 120 giây, thêm preStop sleep 10 giây trên Kubernetes. Kết quả: không còn 502 khi scale-in, connection pool ổn định, và kiểm chứng bằng cách giảm desired count trong lúc bắn tải — không thấy lỗi 5xx.

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

### Trả lời mẫu khi phỏng vấn
"Redis là kho dữ liệu trong RAM, tôi dùng cho cache, session, rate limit, distributed lock và leaderboard; trên AWS tôi dùng ElastiCache với engine Redis OSS hoặc Valkey. Mẫu phổ biến nhất là cache-aside: đọc cache, miss thì đọc DB rồi ghi lại với TTL có jitter, cập nhật thì ghi DB rồi xoá key. Khi dữ liệu hoặc throughput vượt một node, tôi bật cluster mode: key được băm vào 16.384 hash slot chia trên nhiều shard, đổi lại lệnh nhiều key phải cùng slot nhờ hash tag. Khi đầy bộ nhớ, eviction policy quyết định: cache thuần thì allkeys-lru hoặc allkeys-lfu, còn dữ liệu không được mất thì nên tách cluster riêng. Kinh nghiệm của tôi là phải trả lời trước ba câu: TTL bao lâu, khi nào invalidate, và app sống ra sao khi Redis chết."

### Ví dụ đời thực
  Một ứng dụng bán hàng dùng Redis làm cache cho trang sản phẩm (cache-aside) và session store. Ban đầu team không đặt TTL cho key cache, dùng KEYS * để debug, và không có eviction policy phù hợp. Triệu chứng: sau 3 tháng, Redis ElastiCache node bị out-of-memory, mọi request timeout; và một key hot (product:bestseller) chứa danh sách 50.000 product IDs bị block khi client cố cập nhật. Đội tra CloudWatch metric: FreeableMemory giảm dần, Evictions tăng vọt, và RedisCPU cao. Nguyên gốc: thiếu TTL, dùng KEYS * trên production (block toàn bộ), và big key không được chia nhỏ. Xử lý: thêm TTL 300 giây có jitter cho mọi cache key, chuyển sang SCAN, chia big key thành nhiều key nhỏ (product:bestseller:page0..N) hoặc dùng local cache Caffeine cho hot key, đặt eviction policy allkeys-lru, và thêm cluster mode khi cần thêm bộ nhớ. Kết quả: bộ nhớ ổn định dưới 70%, không còn block Redis, và p99 latency giảm từ vài giây xuống vài mili giây.

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

### Trả lời mẫu khi phỏng vấn
"Observability có ba trụ cột: metrics để biết có vấn đề, logs để biết chi tiết, traces để biết vấn đề nằm ở service nào. Trên AWS, CloudWatch lo log, metric và alarm; với hệ microservices tôi thêm tracing bằng OpenTelemetry, trace ID truyền qua header traceparent và được đặt vào MDC để mọi dòng log nối được với trace, rồi xuất sang X-Ray hoặc backend khác. CloudWatch một mình đủ cho hệ nhỏ, nhưng thiếu trace thì debug microservices rất chậm. Về chi phí, log ingestion tính theo GB nên tôi đặt retention cho từng log group, không log payload, chỉ gửi WARN và ERROR ở production, và sample trace thay vì giữ 100%. Alarm tôi đặt theo SLO người dùng như p99 và tỉ lệ 5xx, không theo CPU."

### Ví dụ đời thực
  Một hệ thống microservices 10 service Spring Boot chạy trên ECS Fargate. Ban đầu team chỉ dùng CloudWatch Logs (gửi mọi level), không có trace, và alarm chỉ theo CPU. Triệu chứng: khi sự cố xảy ra (đơn hàng bị lỗi), người trực mất 30 phút để tìm nguyên nhân: log phân tán giữa 10 log group, không có trace ID nối request qua các service, và CPU không cao nên alarm không kêu — thực tế là connection pool tới RDS đã cạn. Chi phí CloudWatch Logs đạt 800 GB/tháng, trong khi log debug ở production chiếm 60%. Đội tra CloudWatch dashboard: metric chỉ có CPU/memory của ECS, không có metric về latency hay error rate theo service. Nguyên gốc: thiếu trace (không có trace ID trong log và header), alarm theo CPU thay vì user impact, và log không được lọc. Xử lý: cài OpenTelemetry agent, trace ID truyền qua header traceparent và đặt vào MDC (SLF4J MDC), thêm metric p99 latency và error rate qua Micrometer/EMF, đặt alarm theo SLO (99,9% request < 500 ms), đặt retention 7 ngày cho log group app và chỉ gửi WARN/ERROR, sample trace 10% với tail sampling giữ mọi trace lỗi. Kết quả: thời gian debug sự cố từ 30 phút xuống 3 phút (từ trace ID mở trace ngay), chi phí log giảm xuống 200 GB/tháng, và alarm kêu trước khi khách nhận ra.

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



### Ví dụ đời thực
Hệ thống đặt hàng production dùng RDS PostgreSQL, mật khẩu lưu trong Secrets Manager và bật xoay vòng mỗi 30 ngày. Một ngày quản trị kích hoạt xoay vòng thủ công. Triệu chứng: 3–5 phút sau, báo lỗi "đăng nhập thất bại" gấp 10 lần và connection pool của toàn bộ app bị cạn. Điều tra: CloudTrail cho thấy GenerateSecret vừa chạy; lập lại trên staging thấy app vẫn dùng mật khẩu cũ từ lúc khởi động. Nguyên nhân gốc: code lấy secret một lần khi khởi động và cache vĩnh viễn, không reload sau khi rotation. Xử lý: thêm TTL cache 10 phút, khi gặp lỗi xác thực thì gọi lại Secrets Manager và tạo lại DataSource; dùng chiến lược alternating users để mật khẩu cũ vẫn hoạt động một thời gian. Kết quả: lần xoay sau không gây gián đoạn, lỗi đăng nhập về 0, và team không còn phải restart app mỗi khi đổi mật khẩu.

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



### Ví dụ đời thực
Hóa đơn AWS tháng trước của một hệ thống Java nhảy từ 15.000 lên 18.500 USD. Điều tra qua Cost Explorer theo tag env=prod thấy dòng NATGateway tăng 2.200 USD, các dòng khác ổn định. Log VPC Flow Logs cho thấy mỗi lần CI/CD build, runner trong private subnet kéo image Docker từ ECR qua NAT Gateway, mỗi image 600 MB, deploy 20 lần mỗi ngày. Nguyên nhân: không có VPC endpoint cho ECR, traffic đi qua NAT tính phí theo GB. Xử lý: thêm gateway endpoint cho S3 và interface endpoint cho ECR, build image trong cùng region. Kết quả: tháng sau chi phí NAT giảm từ 2.500 xuống 400 USD, tổng hóa đơn về 15.700 USD, và team bổ quy tắc "luôn dùng endpoint thay NAT cho dịch vụ AWS".

Kết quả thêm: sau quy tắc mới, metric NatGateway processed bytes giảm 90% và team xem chi phí NAT hàng tuần trong Cost Explorer thay vì chờ đến cuối tháng. Mô hình là "endpoint trước, NAT sau", vì NAT chỉ dành cho traffic ra Internet thật sự.

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



### Ví dụ đời thực
Một đội dùng Terraform quản network và database trên AWS. Một engineer vào console thay đổi kích thước instance RDS từ db.t3.medium lên db.t3.large để xử lý giờ cao điểm, nhưng quên cập nhật code. Ba tuần sau, khi apply Terraform thêm một nút cache, Terraform bắt đầu tính toán co lại RDS về medium trong giờ cao điểm. Triệu chứng: terraform plan hiển thị tài nguyên sẽ bị thay đổi trái ý định. Nguyên nhân gốc: drift — hạ tầng thật khác code vì ai đó sửa tay ở console. Xử lý: quay lại kích thước lớn qua console tạm thời, import trạng thái thật vào Terraform, rồi áp dụng thay đổi qua pipeline. Kết quả: sau đó mọi thay đổi phải đi qua PR và plan, team bật drift detection định kỳ, không còn xảy ra sự cố "code và hạ tầng không khớp".

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



### Ví dụ đời thực
Một hệ thống đặt vé trên Spring Boot chạy qua 2 AZ, nhưng chưa bao giờ chạy thử việc mất một AZ. Buổi review Well-Architected theo trụ cột Reliability, người điều phối hỏi: "Mất một AZ, DB và app xử lý ra sao? Đã diễn tập chưa?" Câu trả lời ban đầu là "có AZ thì an toàn", nhưng không có bằng chứng. Ghi nhận rủi ro cao: chưa test failover, owner là dev lead, deadline 2 tuần. Đội chạy drill failover Aurora trên staging, thấy ứng dụng ghi lỗi read-only trong 90 giây do HikariCP giữ connection cũ; sau đó cấu hình max-lifetime ngắn hơn và retry, thử lại là khôi phục dưới 30 giây. Kết quả: số HRI giảm từ 7 xuống 2 trong 3 tháng, và mỗi rủi ro có người chịu trách nhiệm rõ ràng thay vì tài liệu dài không ai đọc.

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



### Ví dụ đời thực
API thanh toán dùng API Gateway (REST) + Lambda viết bằng Java. Khách báo lỗi khi upload ảnh hóa đơn: Lambda ném lỗi payload quá lớn và API Gateway trả 502. Điều tra: metric 4xxError của API Gateway nhảy, log CloudWatch của Lambda ghi payload vượt giới hạn. Nguyên nhân: ảnh base64 phình khoảng 33%, cùng header vượt 6 MB giới hạn invoke đồng bộ của Lambda. Xử lý: bỏ nhận file qua Lambda, đổi thành tạo S3 presigned URL từ Lambda, client upload trực tiếp lên S3, rồi gửi thông báo qua webhook. Kết quả: lỗi payload quá lớn về 0, upload ảnh 10 MB hoàn thành dưới 5 giây, và chi phí Lambda giảm vì không còn xử lý bytes file.

Kết quả thêm: sau chuyển đổi, metric payload quá lớn về 0, upload ảnh 10 MB hoàn thành dưới 5 giây, và chi phí Lambda giảm một nửa vì không còn xử lý bytes file. Bảo luật: file lớn không qua compute, S3 presigned URL là cách chuẩn xử lý upload trên serverless.

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



### Ví dụ đời thực
Ngân hàng số mở tài khoản qua 4 bước: eKYC, chấm điểm, duyệt tay, tạo tài khoản core. Ban đầu đội viết saga trong Java, nhưng bước duyệt tay thường chờ 2–3 ngày, code phải tự lưu trạng thái, viết scheduler quét hồ sơ treo và tự xử lý timeout — sau 2 tháng mới ổn định. Sau đó chuyển sang Step Functions Standard: mỗi bước là một Lambda, bước duyệt dùng task token nên execution tạm dừng không tốn compute, chuyên viên duyệt trên màn hình nội bộ rồi backend gọi SendTaskSuccess. Execution history ghi lại ai duyệt, lúc nào, input là gì, phục vụ kiểm toán. Kết quả: thời gian triển khai quy trình giảm từ 2 tháng xuống 2 tuần, số hồ sơ bị treo trong quy trình về 0, và đội chỉ cần lo logic nghiệp vụ trong Lambda thay vì tự dựng orchestrator.

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

### Trả lời mẫu khi phỏng vấn
"Failover của Aurora chỉ đổi DNS của cluster endpoint sang writer mới, nhưng ứng dụng Java có ba lớp làm chậm: JVM cache địa chỉ IP cũ, HikariCP vẫn giữ connection tới instance cũ nay đã thành reader nên mọi lệnh ghi bị lỗi read-only, và TCP có thể treo khi instance cũ chết mà không gửi RST. Tôi xử lý từng lớp: đặt networkaddress.cache.ttl khoảng 5 giây, max-lifetime vài phút, connection-timeout và socketTimeout ngắn để fail nhanh. Tốt nhất là dùng AWS Advanced JDBC Wrapper với plugin failover và efm, nó đọc topology từ chính database và nối thẳng tới writer mới mà không chờ DNS. Dù vậy transaction đang chạy luôn mất, nên ứng dụng phải retry có giới hạn và idempotent. Mục tiêu tôi đo là thời gian không ghi được từ phía ứng dụng, và diễn tập hằng quý."

### Ví dụ đời thực
  Một hệ thống ghi nhận đơn hàng chạy Spring Boot trên ECS Fargate kết nối Aurora PostgreSQL cluster (writer endpoint). Đội vận hành chủ động failover cluster để test DR: {{aws rds failover-db-cluster --db-cluster-identifier orders-cluster}}. Failover hoàn tất sau 30 giây trên console, nhưng ứng dụng tiếp tục báo lỗi {{cannot execute INSERT in a read-only transaction}} suốt 2-3 phút. Đội tra CloudWatch: error rate tăng vọt, các task vẫn healthy theo ALB. Nguyên nhân: failover đổi DNS cluster endpoint sang writer mới, nhưng JVM vẫn cache IP của writer cũ (DNS cache 30 giây), HikariCP giữ 20 connection tới instance cũ nay đã promote thành reader, và TCP half-open làm socket timeout treo tới 60 giây. Xử lý: đặt {{Security.setProperty("networkaddress.cache.ttl", "5")}} lúc khởi động, config HikariCP {{max-lifetime: 300000}}, {{connection-timeout: 3000}}, driver {{socketTimeout: 5000}}, và chuyển sang AWS Advanced JDBC Wrapper với plugin failover,efm. Kết quả: lần failover tiếp theo sau khi cấu hình xong, thời gian không ghi được từ ứng dụng xuống còn 30 giây, và wrapper tự kết nối thẳng tới writer mới mà không chờ DNS.
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

### Ví dụ đời thực
**Triệu chứng:** Ví điện tử có API {{/login}} sau ALB bị credential stuffing ~2 triệu lần thử/giờ từ ~40.000 IP; CPU ECS tăng, p99 tăng, autoscale bật vô ích dù user thật không tăng.

**Điều tra:** WAF rate-based rule theo IP (ngưỡng 100/5 phút) hầu như không chặn vì mỗi IP chỉ ~50 request/giờ; truy vấn Athena trên WAF log thấy top ASN là hosting/residential proxy, dấu hiệu bot (User-Agent thay đổi, hành vi lặp).

**Nguyên nhân gốc:** rate limit theo IP không hiệu quả với botnet phân tán và thiếu tín hiệu nhận diện tài khoản bị lộ.

**Cách xử lý:** đặt CloudFront trước ALB, khoá origin bằng prefix list {{com.amazonaws.global.cloudfront.origin-facing}} + custom header; gắn WAF (IP reputation, core rule set) và bật Bot Control, ATP chỉ cho {{/login}} (scope-down) ở chế độ Count 7 ngày rồi chuyển Block; cache policy CachingDisabled cho endpoint nhạy cảm.

**Kết quả đo được:** WAF chặn ~85% request xấu, request tới ALB giảm rõ, autoscale ổn định, p99 của {{/login}} trở lại mức bình thường và không ghi nhận đăng nhập trái phép hàng loạt.

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

### Ví dụ đời thực
**Triệu chứng:** Ngân hàng chạy mọi workload (prod, dev, CI) trong 2 account chung; một lần dev chạy load test làm Lambda concurrency và API Gateway throttle cạn kiệt, ảnh hưởng API thanh toán production; chi phí hàng tháng không phân bổ được theo team.

**Điều tra:** CloudTrail và Cost Explorer cho thấy traffic test và prod dùng chung quota account; review IAM phát hiện dev có quyền đọc dữ liệu prod do policy rộng trong cùng account.

**Nguyên nhân gốc:** thiếu ranh giới account, quota và blast radius chia sẻ; phạm vi kiểm toán PCI phình to vì hệ thống thẻ nằm chung.

**Cách xử lý:** dựng landing zone bằng Control Tower (OU Security có log-archive/audit, OU Workloads chia Prod/NonProd, account CDE tách riêng), bật organization trail, GuardDuty, Security Hub; áp SCP cấm tắt CloudTrail/rời org/region lạ; chuyển non-prod trước rồi từng workload prod.

**Kết quả đo được:** sự cố quota chéo dev-prod không còn tái diễn, chi phí tách rõ theo account/team, và phạm vi kiểm toán PCI thu hẹp còn các account CDE thay vì toàn bộ hạ tầng.

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

### Ví dụ đời thực
**Triệu chứng:** Trong đợt rà soát PCI DSS, đội phát hiện PAN (số thẻ) xuất hiện trong log ứng dụng và một bucket S3 báo cáo; phạm vi kiểm toán (CDE) lan sang gần 40 service.

**Điều tra:** Dùng Macie quét S3 và tìm kiếm log trên CloudWatch/Athena thấy chuỗi 16 số; truy vết CloudTrail cho thấy nhiều role đọc được bucket chứa dữ liệu nhạy cảm.

**Nguyên nhân gốc:** không tokenization, PAN đi qua nhiều service; masking log chưa áp dụng; quyền đọc S3/KMS quá rộng.

**Cách xử lý:** dựng token vault trong account CDE riêng, chỉ vault nhận PAN và trả token; các service khác lưu token + 4 số cuối; mã hoá bằng KMS CMK tách quyền quản trị/dùng; bật organization trail, S3 Object Lock và integrity validation vào log-archive, cấu hình Config/Security Hub PCI DSS; phối hợp pháp chế để xác định dữ liệu nào phải lưu tại Việt Nam.

**Kết quả đo được:** phạm vi CDE thu hẹp còn 3 service (vault, payment gateway adapter, log), số phát hiện PAN ngoài CDE về 0 trong lần quét tiếp theo, và đáp ứng yêu cầu audit log lưu ≥12 tháng.

> Senior tip: thứ tiết kiệm nhiều tiền kiểm toán nhất không phải là thêm công cụ bảo mật mà là giảm số hệ thống chạm vào dữ liệu thẻ. Mỗi service bạn đưa ra khỏi CDE nhờ tokenization là bớt một hạng mục phải chứng minh hằng năm.`,
  follow: [
    'Tokenization khác mã hoá thế nào về phạm vi PCI DSS?',
    'Bạn chứng minh với kiểm toán rằng log CloudTrail không bị sửa thế nào?',
    'Pháp chế yêu cầu dữ liệu khách hàng phải ở Việt Nam: kiến trúc hybrid của bạn ra sao?'
  ],
  tags: ['PCI DSS', 'compliance', 'CloudTrail', 'KMS', 'shared responsibility', 'data residency']
},
{
  id: 'aws-023',
  topic: 'aws',
  level: 'mid',
  q: 'Region, Availability Zone và edge location khác nhau thế nào? Khách hàng chủ yếu ở Việt Nam thì bạn chọn region nào, tiêu chí gì, và dịch vụ nào là global còn dịch vụ nào gắn với region?',
  a: `**Tóm tắt:** **Region** là một khu vực địa lý (ví dụ Singapore) chứa nhiều **Availability Zone (AZ)**; mỗi AZ là một hoặc vài datacenter độc lập về điện, làm mát và mạng. **Edge location** là điểm mạng của CDN đặt gần người dùng để phục vụ nội dung tĩnh nhanh. EC2, RDS, ECS, Lambda, S3 bucket… gắn với region; IAM, Route 53, CloudFront là dịch vụ global. Với người dùng Việt Nam, mặc định là **ap-southeast-1 (Singapore)**, cân nhắc ap-southeast-3 (Jakarta) hoặc ap-east-1 (Hong Kong) theo giá, độ trễ đo thật và dịch vụ cần dùng.

### Hiểu nhanh
Hãy hình dung **region** là một thành phố, **AZ** là các toà nhà trong thành phố đó: mỗi toà có máy phát điện và đường mạng riêng, nên cháy một toà thì các toà khác vẫn chạy, nhưng cả thành phố vẫn có thể mất điện. **Edge location** giống các điểm giao hàng nhỏ rải khắp nơi: hàng phổ biến (ảnh, JS, CSS) để sẵn ở điểm gần nhà, còn hàng đặc biệt vẫn phải lấy từ kho trung tâm (region). **Global service** giống tổng đài dùng chung toàn quốc: bạn không chọn "tổng đài của thành phố nào", trong khi **regional service** giống bệnh viện: phải chọn đúng thành phố mới có.

### Thuật ngữ
- **Region**: vùng địa lý độc lập, ví dụ {{ap-southeast-1}} là Singapore, {{us-east-1}} là Bắc Virginia.
- **AZ**: một trung tâm dữ liệu (hoặc cụm) trong region, tên dạng {{ap-southeast-1a}}; khoảng cách giữa các AZ trong cùng region thường vài km đến vài chục km.
- **AZ ID**: mã ổn định cho một AZ vật lý (ví dụ {{apse1-az2}}). Tên {{a/b/c}} được gán ngẫu nhiên cho từng AWS account, nên "AZ a" của bạn có thể là "AZ c" của đồng nghiệp.
- **Edge location / POP**: điểm hiện diện của CloudFront; không phải nơi bạn chạy EC2.
- **Regional service**: tài nguyên tạo ra nằm cố định trong một region và không tự xuất hiện ở region khác.
- **Global service**: dữ liệu/cấu hình dùng chung toàn cầu, không chọn region khi tạo.
- **Data transfer**: phí truyền dữ liệu ra Internet hoặc giữa các AZ/region; thường bị bỏ qua khi ước lượng chi phí.

### Cơ chế từng bước: một request từ Hà Nội tới Spring Boot trên ECS
1. Người dùng mở {{https://api.example.com/orders}}. Trình duyệt hỏi DNS; bản ghi do **Route 53** (global) trả lời. Nếu tên là alias trỏ tới CloudFront, DNS của CloudFront trả IP của edge gần nhất với resolver của người dùng (thường là edge ở Việt Nam hoặc Singapore).
2. **CloudFront** bắt tay TLS tại edge, kiểm tra cache. Ảnh/CSS/JS tĩnh có thể trả ngay tại edge, không đi tiếp. Vì sao: rút ngắn đường truyền từ ~30–50 ms (Hà Nội → Singapore) xuống vài ms.
3. Cache miss thì CloudFront gọi **origin** là ALB đặt tại {{ap-southeast-1}}. Đoạn Hà Nội → Singapore vẫn phải đi, đây là độ trễ sàn của API động.
4. **ALB** nằm ở 2–3 AZ, DNS của nó trả nhiều IP. Request vào một AZ, ALB chuyển tới target (task ECS hoặc EC2) trong **target group**. ALB bật cross-zone mặc định nên request vào AZ-a vẫn có thể được chuyển tới target ở AZ-b — tải đều hơn, đổi lại có thêm một bước nhảy giữa AZ.
5. Task gọi **RDS primary**. Nếu primary ở AZ khác trong cùng region, độ trễ thêm khoảng 0,5–2 ms mỗi round-trip; nhân với 20 query N+1 là 10–40 ms — đủ thấy trong p99.
6. Task ghi **S3**: bucket thuộc một region. Ghi từ region khác vừa chậm hơn vừa bị tính phí data transfer ra ngoài region.

~~~text
Hà Nội (user)
   | DNS (Route 53 alias -> CloudFront) -> IP edge gần nhất
   v
CloudFront edge HN --- cache hit --> trả luôn
   | cache miss (TLS, ~30-50 ms)
   v
ALB ap-southeast-1 (AZ-a + AZ-b)  [public subnet]
   | forward theo path /api/*
   v
ECS task (private subnet, AZ-a) --(5)--> RDS primary (AZ-b, cùng region)
   |--(6)--> S3 bucket ap-southeast-1
~~~

### Dịch vụ nào global, dịch vụ nào regional
| Phạm vi | Dịch vụ | Ghi nhớ |
|---|---|---|
| Global | IAM, STS, Route 53, CloudFront, Organizations, WAF gắn CloudFront | Tạo một lần, dùng mọi region; nhưng dữ liệu IAM là global nên lỗi quyền ảnh hưởng tất cả |
| Regional | EC2, EBS, ECS, EKS, Lambda, RDS/Aurora, ElastiCache, SQS, SNS, Kinesis, KMS key, Secrets Manager | Phải tạo lại ở region dự phòng nếu muốn DR |
| Regional + namespace global | S3 | Tên bucket duy nhất toàn cầu, nhưng dữ liệu nằm ở region bạn chọn và **không** tự nhân bản sang region khác |
| Regional (đặc biệt) | ACM certificate | Cert cho ALB phải ở cùng region với ALB; cert cho CloudFront bắt buộc ở {{us-east-1}} |

### Chọn region cho người dùng Việt Nam
1. **Đo độ trễ thật**, đừng đoán: dùng {{curl}} với tuỳ chọn {{-w}} in ra time_connect tới endpoint health check của từng region, hoặc CloudWatch RUM từ máy thật ở nhiều mạng (Viettel, VNPT, FPT, 4G). Từ Việt Nam thường thấy Singapore thấp nhất, sau đó Hong Kong, Tokyo, Jakarta; con số thay đổi theo ISP và tuyến cáp.
2. **Dịch vụ có sẵn**: không phải region nào cũng có mọi instance family, dịch vụ mới hay tính năng mới. Region lớn như {{us-east-1}} nhận tính năng trước; region nhỏ có thể chậm vài tháng.
3. **Giá**: cùng một cấu hình có thể chênh 5–20% giữa các region; Singapore thường đắt hơn Bắc Virginia. Nhưng tiết kiệm vài USD/tháng mà p99 tăng 20 ms là đánh đổi sai với API tương tác.
4. **Tuân thủ và hợp đồng khách hàng**: dữ liệu cá nhân có được rời Việt Nam không, khách doanh nghiệp có yêu cầu lưu trong nước không.
5. **DR**: nếu cần multi-region, chọn cặp region có dịch vụ tương đương và đường truyền ổn định; khoảng cách càng xa thì replication async càng trễ.

Với một team nhỏ chỉ có một môi trường, đặt mọi thứ ở một region và trải trên **ít nhất 2 AZ**; multi-region là bài toán riêng, đắt hơn nhiều.

### Lỗi hay gặp
- **Làm theo tutorial mặc định {{us-east-1}}.** Triệu chứng: API từ Việt Nam p50 đã 200 ms dù server "khoẻ". Cách tránh: kiểm tra region của mọi tài nguyên trước khi tạo; đặt region mặc định trong profile AWS CLI và trong CI.
- **Chạy production trong một AZ.** Triệu chứng: một sự cố AZ làm dịch vụ chết toàn bộ dù region còn sống. Cách tránh: ALB tối thiểu 2 subnet khác AZ, ECS service trải trên 2 AZ, RDS Multi-AZ.
- **Nghĩ S3 là global nên tự nhân bản.** Triệu chứng: region chính sự cố, bucket region phụ rỗng vì chưa từng bật replication. Cách tránh: hiểu bucket thuộc region; cần DR thì bật Cross-Region Replication hoặc AWS Backup.
- **Hard-code region trong code.** Triệu chứng: deploy sang region dự phòng thì ứng dụng vẫn gọi region cũ. Cách tránh: đọc region từ biến môi trường hoặc từ SDK credential/region provider chain, không viết {{Region.AP_SOUTHEAST_1}} (SDK v2) rải khắp code.
- **Bỏ qua phí cross-AZ.** Triệu chứng: microservice chatty gọi nhau 5.000 request/giây giữa hai AZ, hoá đơn data transfer tăng vài trăm USD. Cách tránh: theo dõi metric data transfer, giảm chat, dùng cùng AZ khi hợp lý hoặc chấp nhận đánh đổi availability.

### Trả lời miệng 1 phút
"Region là khu vực địa lý, trong đó có nhiều AZ độc lập về điện và mạng; edge location là điểm CDN gần người dùng. Hầu hết dịch vụ tôi dùng hằng ngày như EC2, ECS, RDS, Lambda, S3 bucket đều gắn với region, còn IAM, Route 53, CloudFront là global. Với khách ở Việt Nam, tôi mặc định Singapore vì độ trễ thấp, nhưng quyết định bằng cách đo thật từ nhiều ISP, so sánh giá, kiểm tra dịch vụ cần có và yêu cầu tuân thủ. Production luôn trải ít nhất hai AZ; multi-region chỉ làm khi RTO/RPO yêu cầu. Tôi cũng nhớ cert ACM cho ALB phải cùng region, và dùng AZ ID thay vì tên a/b/c khi cần đối chiếu giữa các account."

### Ví dụ đời thực
**Triệu chứng:** API Spring Boot đặt ở {{us-east-1}} theo tutorial; người dùng Việt Nam phàn nàn p50 ~200 ms dù CPU/DB trong region bình thường.

**Điều tra:** Đo {{curl -w}} từ mạng Viettel/VNPT/FPT thấy {{time_connect}} tới {{us-east-1}} cao hơn {{ap-southeast-1}} rõ rệt; CloudWatch RUM xác nhận độ trễ mạng chiếm phần lớn thời gian request.

**Nguyên nhân gốc:** chọn region xa người dùng; tài nguyên tĩnh chưa qua edge.

**Cách xử lý:** di chuyển stack chính (ECS, ALB, RDS, S3) sang {{ap-southeast-1}}, trải tối thiểu 2 AZ; đặt CloudFront trước ALB để cache static tại edge; kiểm tra dịch vụ/giá và tuân thủ trước khi chốt.

**Kết quả đo được:** p50 API từ Việt Nam giảm còn ~60–80 ms tuỳ ISP, tài nguyên tĩnh trả từ edge trong vài ms, và không còn phụ thuộc đường truyền xuyên Thái Bình Dương cho request động.

> Senior tip: đừng tin cảm giác "Singapore nhanh nhất" — hãy đo bằng CloudWatch RUM hoặc script từ nhiều mạng, vì tuyến cáp và ISP có thể đổi. Khi làm multi-AZ, dùng **AZ ID** trong tài liệu và dashboard: tên AZ a/b/c được map ngẫu nhiên cho từng account, nên hai account cùng ghi "AZ a" có thể đang chạy ở hai toà nhà khác nhau và bạn sẽ vẽ sai sơ đồ sự cố.`,
  follow: [
    'Vì sao tên AZ a/b/c không dùng để đối chiếu giữa các AWS account?',
    'Một API chạy ở Singapore nhưng người dùng ở Việt Nam phàn nàn chậm: bạn đo và cải thiện từ đâu?',
    'Khi nào cần multi-region thay vì chỉ multi-AZ?'
  ],
  tags: ['region', 'availability zone', 'edge location', 'latency', 'multi-AZ'],
  refs: [
    { type: 'doc', title: 'AWS Regions and Availability Zones', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html' }
  ]
},
{
  id: 'aws-024',
  topic: 'aws',
  level: 'mid',
  q: 'Một service Spring Boot chạy trên EC2: bạn chọn instance family và size thế nào, dùng EBS hay instance store, mua theo hình thức nào để tối ưu chi phí, và vào server an toàn ra sao?',
  a: `**Tóm tắt:** Chọn **instance family** theo hình dạng tải (compute, memory, general), chọn **size** theo số đo thật (CPU p95, RSS, heap) chứ không theo cảm giác. Dữ liệu bền để trên **EBS** (gp3), instance store chỉ dùng cho cache tạm. Mua **Savings Plans** cho phần chạy 24/7, **Spot** cho batch chịu được gián đoạn. Truy cập server qua **SSM Session Manager**, không mở cổng 22 và không giữ key pair.

### Hiểu nhanh
Thuê EC2 giống thuê xe: **family** là dòng xe (xe tải nhẹ, xe 16 chỗ, xe tải nặng), **size** là số ghế và dung tích, **generation** là đời xe (số càng lớn càng mới, cùng tiền thường nhanh hơn). **EBS** giống ổ cứng gắn ngoài: máy hỏng thì tháo ổ sang máy khác, dữ liệu còn; **instance store** giống ngăn kéo gắn liền trong máy: nhanh nhưng máy hỏng hoặc stop/start là mất sạch, chỉ dùng làm cache. **Savings Plan** giống vé tháng, **Spot** giống vé máy bay giá rẻ: rẻ hơn nhiều nhưng hãng có thể đổi chuyến với báo trước ngắn.

### Thuật ngữ
- **vCPU**: đơn vị CPU ảo; trên phần lớn instance Intel/AMD, 1 vCPU là một hyperthread, không phải một core vật lý.
- **Instance family**: chữ cái đầu trong tên, ví dụ {{t}} burstable, {{m}} general purpose, {{c}} compute, {{r}} memory, {{i}} storage; số là generation ({{m7}} mới hơn {{m5}}).
- **Hậu tố**: {{g}} là chip ARM Graviton, {{i}} Intel, {{a}} AMD, {{d}} có ổ NVMe local, {{n}} tối ưu mạng.
- **Burstable / CPU credit**: {{t3}}, {{t4g}} có baseline CPU thấp và tích luỹ credit; chạy lâu trên 100% baseline thì bị bóp CPU hoặc bị tính thêm tiền ở chế độ unlimited.
- **EBS**: ổ đĩa mạng gắn vào instance, dữ liệu tồn tại độc lập với vòng đời instance.
- **gp3**: loại EBS cân bằng, mặc định 3.000 IOPS và 125 MB/s, có thể tăng riêng.
- **IMDS**: dịch vụ metadata nội bộ tại {{169.254.169.254}} để instance lấy credential role.
- **SSM Session Manager**: mở shell qua agent có sẵn, không cần inbound port, có log phiên.
- **Spot interruption**: AWS thu hồi máy Spot, thường báo trước khoảng 2 phút qua metadata/EventBridge.

### Cơ chế từng bước: từ tải thật tới kích thước instance
1. **Đo tải**: request/giây, CPU p95, RSS (bộ nhớ thực dùng), heap sau full GC, số thread, số connection DB. Đừng dùng CPU trung bình — nó che mất đỉnh.
2. **Tính bộ nhớ JVM**: heap + Metaspace + code cache + thread stack + direct buffer + overhead của OS và agent. Một service Spring Boot 200 thread, Metaspace 256 MB, heap 2,5 GB thường cần instance 4 GB **trở lên**.
3. **Đặt heap theo phần trăm RAM** thay vì con số tuyệt đối: {{-XX:MaxRAMPercentage=75}} để chừa 25% cho OS, page cache, thread stack và JNI. Với instance 8 GB, heap tối đa khoảng 6 GB.
4. **Chọn family**: API CRUD thông thường dùng {{m7g}} hoặc {{t4g}}; service tính toán nặng (báo cáo, mã hoá, xử lý ảnh) dùng {{c7g}}; cache in-memory lớn dùng {{r7g}}.
5. **Chọn size**: nếu p95 heap 2,5 GB và CPU p95 40% thì 2 vCPU/8 GB là hợp lý; nếu CPU p95 85% thì tăng vCPU trước khi tăng RAM.
6. **Kiểm chứng bằng load test** (Gatling/k6) ở mức 1,5–2 lần tải đỉnh dự kiến, rồi theo dõi 2 tuần. Right-size định kỳ bằng **Compute Optimizer** và số liệu CloudWatch.

~~~text
Ví dụ 8 GB RAM, MaxRAMPercentage=75
heap        6 000 MB
metaspace     256 MB
code cache    240 MB
200 thread x 1 MB stack = 200 MB
direct/netty buffer     200 MB
OS + agent + page cache 1 100 MB
Tổng ~ 8 000 MB: vừa khít, vì thế không nên vượt 75%
Nếu đặt -Xmx8g: tổng vượt RAM -> Linux OOM killer giết process java
~~~

### Chọn family theo tải
| Family | Hình dạng tải | Ví dụ dùng |
|---|---|---|
| t4g / t3 | Tải thấp, có đỉnh ngắn | API nội bộ, cron, môi trường dev |
| m7g / m6i | Cân bằng CPU và RAM | Phần lớn service Spring Boot |
| c7g / c6i | CPU-bound | Báo cáo, tính giá, nén, mã hoá |
| r7g / r6i | RAM lớn | Cache, xử lý file lớn, session in-memory |
| i4i | Cần NVMe local | Search index, cache tái tạo được |

Graviton ({{g}}) thường rẻ hơn 10–20% cùng hiệu năng nhưng phải kiểm tra native library: JDK, Netty, RocksDB, thư viện nén đều có bản ARM; một số driver cũ hoặc agent monitoring có thể chưa hỗ trợ.

### EBS hay instance store
- **EBS gp3** cho root volume và dữ liệu cần bền: snapshot incremental, có thể resize online, gắn lại instance khác.
- **io2/io1** khi cần IOPS cao và độ bền cao hơn (database tự quản lý); **st1/sc1** cho throughput tuần tự lớn, rẻ.
- **Instance store** chỉ dùng cho dữ liệu tái tạo được: cache, scratch, temp file. Stop/start hoặc hardware failure là mất.
- Luôn tách **root volume nhỏ** (ví dụ 30 GB) và **volume dữ liệu riêng** để snapshot và thay instance dễ hơn.

### Mua thế nào cho hợp lý
| Hình thức | Giảm giá | Phù hợp |
|---|---|---|
| On-Demand | 0% | Thử nghiệm, tải không đoán được |
| Savings Plans (1–3 năm) | tới ~66% (Compute SP), ~72% (EC2 Instance SP) | Phần tải ổn định 24/7; Compute SP áp cả Fargate, Lambda |
| Reserved Instance | tới ~72% | Tương tự, cam kết theo instance type/region |
| Spot | tới ~90% | Batch, CI runner, worker không giữ state |

Mức giảm thật phụ thuộc kỳ hạn và cách trả trước: cam kết 1 năm không trả trước thường chỉ giảm khoảng 20–30%.

Spot không dùng cho instance chạy singleton, không dùng cho database tự quản lý trên một máy, và cần code chịu được việc bị dừng: job phải idempotent, worker phải nhận tín hiệu interruption và thoát sạch.

### Truy cập an toàn
Cách cũ: mở Security Group cổng 22 cho IP văn phòng, giữ file {{.pem}} trong repo — dễ mất key, khó biết ai đã vào.
Cách nên dùng: gắn instance profile có {{AmazonSSMManagedInstanceCore}}, SSM Agent có sẵn trên AMI Amazon Linux 2/2023; instance phải gọi ra được endpoint của SSM (qua NAT hoặc VPC endpoint {{ssm}}, {{ssmmessages}}, {{ec2messages}}), rồi:

~~~bash
aws ssm start-session --target i-0abc123def456 --region ap-southeast-1
# Không cần mở port 22, không cần key pair.
# Phiên có thể ghi vào S3/CloudWatch để audit.
~~~

Không có inbound SSH cũng có nghĩa một lỗ hổng SSH không thể bị quét từ Internet. Với quyền shell, dùng IAM để giới hạn ai được start-session vào instance nào (tag condition).

### Lỗi hay gặp
- **Đặt {{-Xmx}} bằng đúng RAM của máy.** Triệu chứng: process java bị Linux OOM killer giết (dmesg có "Out of memory: Killed process"), log không kịp ghi. Cách tránh: {{MaxRAMPercentage}} 70–75 và đo RSS thực tế.
- **Chạy {{t3}}/{{t4g}} cho tải CPU đều mà không theo dõi credit.** Triệu chứng: ở chế độ standard CPU bị bóp về baseline khi hết credit; ở chế độ unlimited (mặc định của t3/t4g) thì không bị bóp nhưng hoá đơn tăng vì phí surplus credit. Cách tránh: xem metric {{CPUCreditBalance}}, tải đều thì chọn {{m}}/{{c}}.
- **Dùng instance store cho dữ liệu cần giữ.** Triệu chứng: reboot mất file, hàng đợi mất message. Cách tránh: dữ liệu bền đặt trên EBS/S3, instance store chỉ cho cache.
- **Chạy singleton trên Spot.** Triệu chứng: máy bị thu hồi đúng giờ cao điểm, scheduler chết. Cách tránh: Spot cho worker không state, primary chạy On-Demand/Savings Plan.
- **SSH mở {{0.0.0.0/0}} và key pair nằm trong repo.** Triệu chứng: bị quét và thử đăng nhập liên tục, key lộ là mất máy. Cách tránh: SSM Session Manager, không phát hành key dài hạn, bật GuardDuty.
- **Dùng AMI cũ nhiều năm.** Triệu chứng: thiếu bản vá bảo mật, JDK cũ. Cách tránh: golden AMI + pipeline rebuild định kỳ, hoặc dùng Systems Manager Patch Manager.

### Trả lời miệng 1 phút
"Tôi chọn instance theo số đo: CPU p95, RSS, heap sau full GC và số thread, rồi chọn family theo hình dạng tải — m7g cho cân bằng, c7g cho CPU, r7g cho RAM lớn. Với JVM tôi đặt MaxRAMPercentage khoảng 75 để chừa chỗ cho Metaspace, thread stack và OS, và load test ở 1,5–2 lần tải đỉnh. Dữ liệu bền nằm trên EBS gp3, instance store chỉ làm cache vì stop/start là mất. Phần chạy 24/7 tôi mua Savings Plan, batch và CI dùng Spot với code idempotent và xử lý tín hiệu interruption. Tôi không mở SSH: vào máy bằng SSM Session Manager, không key pair, có audit. Định kỳ right-size bằng Compute Optimizer."

### Ví dụ đời thực
**Triệu chứng:** Service Spring Boot chạy trên EC2 {{t3.medium}} (2 vCPU, 4 GB) thỉnh thoảng bị OOM killer giết lúc tải tăng; giờ khác CPU "kẹt" và latency tăng dù request không cao bất thường.

**Điều tra:** {{dmesg}} ghi "Out of memory: Killed process java"; CloudWatch thấy {{CPUCreditBalance}} cạn trong giờ cao điểm (chế độ standard) và RSS vượt mức an toàn; cấu hình JVM dùng {{-Xmx3g}} trên máy 4 GB.

**Nguyên nhân gốc:** heap đặt quá sát RAM (không chừa Metaspace, thread stack, direct buffer, OS) và dùng burstable instance cho tải CPU tương đối đều.

**Cách xử lý:** chuyển sang {{m7g.large}} (2 vCPU, 8 GB), đặt {{-XX:MaxRAMPercentage=75}}, tách volume dữ liệu EBS gp3, truy cập qua SSM Session Manager (đóng port 22), mua Savings Plan cho phần chạy 24/7.

**Kết quả đo được:** không còn OOM killer trong 30 ngày theo dõi, p99 ổn định ở tải đỉnh, và Compute Optimizer không còn khuyến nghị tăng size; chi phí dự báo giảm so với cấu hình dư/thiếu trước đó.

> Senior tip: món tiết kiệm lớn nhất thường không phải mặc cả giá instance mà là **giảm instance thừa**. Một service 2 vCPU chạy 15% CPU suốt ngày là tiền đổ đi; hãy gộp service, giảm replica hoặc chuyển sang Fargate/Lambda trước khi mua Savings Plan 3 năm cho một cấu hình sai.`,
  follow: [
    'Vì sao không nên đặt -Xmx bằng toàn bộ RAM của instance?',
    'Khi nào chọn Graviton và rủi ro cần kiểm tra là gì?',
    'Bạn bảo vệ EC2 khỏi bị truy cập trái phép mà không mở cổng 22 thế nào?'
  ],
  tags: ['EC2', 'EBS', 'instance type', 'Spot', 'Savings Plans', 'SSM']
},
{
  id: 'aws-025',
  topic: 'aws',
  level: 'mid',
  q: 'Bạn được giao đưa service Spring Boot đầu tiên của team lên ECS Fargate sau một ALB. Hãy đi từng bước: image để ở đâu, task definition khai báo những gì, service và target group nối với nhau thế nào, và làm sao một bản deploy lỗi tự rollback?',
  a: `**Tóm tắt:** Build image và đẩy lên **ECR**; viết **task definition** (image theo tag/digest, CPU/RAM, cổng 8080, log driver {{awslogs}}, task role và execution role); tạo **ECS service** chạy N task trong private subnet, gắn vào **target group** (target type {{ip}}) của ALB; rolling update với {{minimumHealthyPercent}}/{{maximumPercent}} và bật **deployment circuit breaker** kèm rollback để bản lỗi tự quay về bản cũ.

### Hiểu nhanh
Hãy coi ECS như một **công ty cho thuê nhân viên thời vụ**. **ECR** là kho đồng phục (image). **Task definition** là bản mô tả công việc: mặc đồng phục nào, cần bao nhiêu sức (CPU/RAM), ngồi cổng nào, ghi sổ ở đâu (log), được cầm chìa khoá nào (IAM role). **Service** là hợp đồng "luôn có đúng 3 người làm ca này; ai nghỉ thì thay ngay". **ALB + target group** là quầy lễ tân chia khách cho những nhân viên đang sẵn sàng. **Fargate** nghĩa là bạn không phải lo văn phòng (máy EC2) — AWS lo chỗ ngồi.

### Thuật ngữ
- **ECR**: registry Docker riêng của AWS, quyền kéo image kiểm soát bằng IAM.
- **Task definition**: bản khai báo có version ({{orders-api:12}}) mô tả container cần chạy. Sửa là tạo **revision** mới, không sửa đè.
- **Task**: một bản chạy của task definition (giống Pod trong Kubernetes).
- **Service**: giữ số task mong muốn, thay task chết, đăng ký task vào target group, điều phối rolling update.
- **Execution role**: quyền của **ECS agent** (kéo image từ ECR, đọc secret lúc khởi động, ghi log). **Task role**: quyền của **code bạn** (gọi S3, SQS…).
- **awsvpc**: chế độ mạng bắt buộc với Fargate — mỗi task có ENI và IP riêng trong subnet, nên target group phải dùng target type {{ip}}.
- **Deployment circuit breaker**: cơ chế ECS tự đánh dấu deployment thất bại khi task mới liên tục không lên được, và (nếu bật rollback) quay về revision cũ.

### Cơ chế từng bước
1. **Build và push**: CI build image, tag bằng git SHA, {{docker push}} lên ECR. Vì sao không dùng {{latest}}: task definition trỏ tới tag cố định thì biết chính xác bản nào đang chạy và rollback được.
2. **Task definition**: chọn CPU/RAM theo cặp hợp lệ của Fargate (ví dụ 1 vCPU = {{1024}} đi với 2–8 GB), khai báo {{portMappings}} 8080, biến môi trường, secret lấy từ Secrets Manager/Parameter Store, log driver {{awslogs}}.
3. **Service**: chọn cluster, số task (ví dụ 2), **ít nhất 2 private subnet ở 2 AZ**, security group chỉ cho ALB vào cổng 8080.
4. **Nối ALB**: listener 443 của ALB → rule {{/api/*}} → target group (type {{ip}}, health check {{/actuator/health/readiness}}). Service tự đăng ký IP của task mới và gỡ IP task cũ.
5. **Rolling update**: đổi revision → ECS chạy task mới, đợi target group báo healthy, rồi mới dừng task cũ. Với {{minimumHealthyPercent=100}} và {{maximumPercent=200}}, số task phục vụ không bao giờ giảm dưới mức mong muốn.
6. **Circuit breaker**: nếu task mới cứ crash hoặc fail health check lặp đi lặp lại, ECS đánh dấu deployment FAILED và với {{rollback: true}} tự triển khai lại revision cũ đã chạy tốt.

~~~text
CI ──push──► ECR (orders-api:3f9c2a1)
                    │ task def orders-api:12
                    ▼
ALB :443 ──/api/*──► target group (type ip, health /actuator/health/readiness)
                    ├── task 10.0.11.23 (AZ-a, private subnet)
                    └── task 10.0.12.41 (AZ-b, private subnet)
                         │ log → CloudWatch Logs /ecs/orders-api
~~~

### Đoạn task definition quan trọng
~~~json
{
  "family": "orders-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024", "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/orders-exec",
  "taskRoleArn": "arn:aws:iam::123456789012:role/orders-task",
  "containerDefinitions": [{
    "name": "app",
    "image": "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/orders-api:3f9c2a1",
    "portMappings": [{ "containerPort": 8080 }],
    "environment": [{ "name": "JAVA_TOOL_OPTIONS", "value": "-XX:MaxRAMPercentage=75" }],
    "logConfiguration": { "logDriver": "awslogs", "options": {
      "awslogs-group": "/ecs/orders-api", "awslogs-region": "ap-southeast-1",
      "awslogs-stream-prefix": "app" } }
  }]
}
~~~
Phía service, phần deploy an toàn nằm trong {{deploymentConfiguration}}: {{deploymentCircuitBreaker}} với {{enable: true}} và {{rollback: true}}, cộng {{healthCheckGracePeriodSeconds}} (ví dụ 90) để ALB không giết task Spring Boot đang khởi động.

### So sánh nhanh các kiểu chạy container trên AWS
| Lựa chọn | Bạn phải lo | Hợp với |
|---|---|---|
| ECS trên Fargate | Image, task definition | Team nhỏ, muốn ít vận hành nhất |
| ECS trên EC2 | Thêm: vá OS, scale node | Cần GPU, instance đặc thù, tối ưu giá sâu |
| EKS | Thêm: Kubernetes, add-on, nâng cấp cluster | Đã có chuẩn Kubernetes, nhiều team |

### Lỗi hay gặp
- **Nhầm task role với execution role.** Triệu chứng: task lên được nhưng code gọi S3 bị {{AccessDenied}}; hoặc ngược lại task không kéo được image ({{CannotPullContainerError}}). Cách tránh: quyền của code → task role; kéo image, đọc secret, ghi log → execution role.
- **Target group type {{instance}} với Fargate.** Triệu chứng: không tạo được service. Fargate dùng awsvpc nên phải là {{ip}}.
- **Private subnet không có đường ra ECR.** Triệu chứng: task treo ở PENDING rồi STOPPED với lỗi pull image. Cách tránh: NAT gateway hoặc VPC endpoint cho ECR ({{ecr.api}}, {{ecr.dkr}}), S3 gateway endpoint (layer image nằm trên S3) và CloudWatch Logs.
- **Health check grace period quá ngắn.** Triệu chứng: Spring Boot cần 60 giây để lên, ALB đánh dấu unhealthy ở giây 30, ECS giết task, vòng lặp vô tận. Cách tránh: grace period lớn hơn thời gian khởi động thật, health check trỏ readiness.
- **Deploy bằng tag {{latest}}.** Triệu chứng: "deploy lại" không đổi gì, hoặc task mới scale ra kéo bản khác task cũ. Cách tránh: tag bằng git SHA, bật tag immutability trên ECR.

### Trả lời mẫu khi phỏng vấn
"Tôi đẩy image lên ECR với tag là git SHA. Task definition khai báo image đó, CPU/RAM theo cặp hợp lệ của Fargate, cổng 8080, log driver awslogs và hai role: execution role cho ECS kéo image, đọc secret, ghi log; task role cho code gọi AWS. ECS service chạy ít nhất hai task trên hai private subnet ở hai AZ, gắn vào target group kiểu ip của ALB, health check trỏ readiness của Actuator và có grace period đủ dài cho Spring Boot khởi động. Deploy là tạo revision mới; rolling update với minimumHealthyPercent 100 nên không giảm năng lực phục vụ, và tôi bật deployment circuit breaker kèm rollback để bản lỗi tự quay về revision cũ."

### Ví dụ đời thực
  Một đội vận hành API đặt hàng trên ECS Fargate, chạy 2 task, Spring Boot 3 + Hibernate. Triệu chứng: mỗi deploy bản mới, task bị ECS kill liên tục và ALB trả 503 khoảng 30 giây. Đội tra qua ECS service events: task mới bị STOPPED với reason "Task failed essential tasks", CloudWatch Logs thấy task mất 45 giây khởi động (Spring context + Hibernate + connection pool). Nguyên nhân gốc: health check grace period trong service để 30 giây, quá ngắn so với thời gian khởi động; ALB đánh dấu unhealthy ở giây 30, ECS kill task, vòng lặp vô tận. Xử lý: tăng healthCheckGracePeriodSeconds lên 90, health check trỏ readiness endpoint thay vì liveness, và bật deployment circuit breaker với rollback: true trong deploymentConfiguration. Kết quả: deploy tự động rollback khi task không healthy, grace period đủ dài để Spring Boot xong, thời gian deploy giảm từ 5 phút xuống 2 phút, không còn 503 trong khi deploy, và circuit breaker bắt được 2 lần deploy lỗi trong tháng đầu.

  > Senior tip: hãy để CI **render task definition từ file trong repo** (thay image bằng SHA mới) rồi register, thay vì sửa tay trên console — console là nơi cấu hình "trôi" khỏi Git. Circuit breaker chỉ bắt được task không lên hoặc fail health check; bản deploy "lên được nhưng trả sai" vẫn lọt, nên vẫn cần alarm 5xx/latency trên ALB gắn với quy trình rollback.`,
  follow: [
    'Vì sao Fargate bắt buộc network mode awsvpc và điều đó ảnh hưởng gì tới số IP trong subnet?',
    'Circuit breaker không phát hiện được bản deploy trả sai dữ liệu: bạn bổ sung gì?',
    'Khi nào bạn chọn blue/green bằng CodeDeploy thay cho rolling update của ECS?'
  ],
  tags: ['ECS', 'Fargate', 'ECR', 'ALB', 'task definition', 'circuit breaker'],
  refs: [
    { type: 'doc', title: 'Amazon ECS deployment circuit breaker', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html' }
  ]
},
{
  id: 'aws-026',
  topic: 'aws',
  level: 'mid',
  q: 'Team cần đưa API lên domain api.shop.vn với HTTPS, đứng sau ALB. Bạn cấu hình Route 53 và ACM thế nào: bản ghi alias khác CNAME ra sao, TTL nên đặt bao nhiêu, chứng chỉ được xác thực và gia hạn thế nào, và những lỗi nào khiến khách vẫn thấy cảnh báo chứng chỉ?',
  a: `**Tóm tắt:** Tạo **hosted zone** cho {{shop.vn}} trên Route 53 và trỏ nameserver của nhà đăng ký tên miền về đó; xin chứng chỉ **ACM** cho {{api.shop.vn}} bằng **DNS validation** (thêm một bản ghi CNAME, ACM tự gia hạn chừng nào bản ghi còn đó và cert còn được dùng); gắn cert vào listener 443 của ALB, listener 80 redirect sang 443; cuối cùng tạo bản ghi **alias A** {{api.shop.vn}} → ALB. Alias khác CNAME ở chỗ dùng được ở **zone apex** ({{shop.vn}}), Route 53 tự theo IP thay đổi của ALB và không tính phí truy vấn tới tài nguyên AWS.

### Hiểu nhanh
DNS là **danh bạ điện thoại** của Internet: đổi tên ({{api.shop.vn}}) thành địa chỉ (IP). **Hosted zone** là cuốn danh bạ riêng cho {{shop.vn}}. **CNAME** giống ghi "gọi số của anh Nam" — phải tra thêm một lần nữa. **Alias** là tính năng riêng của Route 53: danh bạ tự chép thẳng số hiện tại của ALB, ALB đổi số thì danh bạ tự cập nhật. **Chứng chỉ TLS** giống giấy tờ tuỳ thân có dấu của cơ quan cấp (CA): trình duyệt kiểm tra tên trên giấy có khớp tên miền và còn hạn không.

### Thuật ngữ
- **Hosted zone**: tập bản ghi DNS của một domain trên Route 53; public zone trả lời Internet, private zone chỉ trả lời trong VPC.
- **NS record / delegation**: nhà đăng ký tên miền ({{.vn}} qua nhà cung cấp trong nước) phải trỏ NS về 4 nameserver Route 53 cấp cho zone.
- **TTL**: số giây resolver được phép nhớ câu trả lời; TTL càng dài thì đổi bản ghi càng lâu có hiệu lực.
- **Alias record**: bản ghi A/AAAA của Route 53 trỏ tới tài nguyên AWS (ALB, CloudFront, S3 website…); TTL do Route 53 quản lý theo tài nguyên đích.
- **Zone apex**: tên gốc {{shop.vn}}; chuẩn DNS **không cho** CNAME ở đây.
- **ACM**: dịch vụ cấp và gia hạn chứng chỉ public miễn phí, dùng được với ALB, CloudFront, API Gateway; không xuất private key ra để cài lên EC2.
- **DNS validation**: chứng minh sở hữu domain bằng một CNAME đặc biệt ACM yêu cầu.

### Cơ chế từng bước
1. **Tạo hosted zone** {{shop.vn}}, lấy 4 NS, khai báo ở nhà đăng ký. Vì sao bước này hay chậm: NS của tên miền cấp trên có TTL dài, có thể mất vài giờ.
2. **Xin cert ACM** ở **đúng region của ALB** (ví dụ {{ap-southeast-1}}), tên {{api.shop.vn}} (hoặc thêm {{*.shop.vn}}). Chọn DNS validation, bấm tạo bản ghi CNAME trong Route 53 — ACM chuyển trạng thái Issued sau vài phút.
3. **Listener 443** của ALB gắn cert; chọn security policy TLS hiện đại (TLS 1.2 trở lên). **Listener 80** chỉ có một action: redirect 301 sang HTTPS.
4. **Bản ghi alias A** {{api.shop.vn}} → ALB (và AAAA nếu ALB dualstack). Bật "evaluate target health" nếu dùng routing failover.
5. **Kiểm tra** bằng {{dig api.shop.vn}} và {{curl -v https://api.shop.vn/actuator/health}}: xem IP trả về và tên trên cert.
6. **Gia hạn**: ACM tự gia hạn cert DNS-validated trước khi hết hạn, miễn là CNAME validation vẫn còn và cert đang gắn với tài nguyên.

~~~text
Trình duyệt ─ hỏi api.shop.vn ─► resolver ISP ─► NS .vn ─► NS Route 53 (zone shop.vn)
                                                           │ alias A → ALB (IP hiện tại)
Trình duyệt ─ TLS (SNI: api.shop.vn) ─► ALB :443  cert ACM CN=api.shop.vn
                                         └─► target group → task Spring Boot :8080 (HTTP nội bộ)
~~~

### Alias hay CNAME
| Tiêu chí | Alias (Route 53) | CNAME |
|---|---|---|
| Dùng ở zone apex | Có | Không (trái chuẩn DNS) |
| Trỏ tới | Tài nguyên AWS, bản ghi khác trong zone | Bất kỳ tên miền nào |
| Phí truy vấn | Miễn phí khi trỏ tới tài nguyên AWS | Tính phí như truy vấn thường |
| Số lần tra | Trả IP ngay | Resolver phải tra thêm tên đích |
| TTL | Theo tài nguyên đích | Bạn tự đặt |

### TTL đặt bao nhiêu
- Bản ghi ổn định: 300–3600 giây.
- **Trước một đợt chuyển đổi** (đổi ALB, đổi region): hạ TTL xuống 60 giây **trước ít nhất một chu kỳ TTL cũ**, chuyển xong ổn định mới nâng lại. Vì sao: resolver đang nhớ giá trị cũ cho tới hết TTL cũ, hạ TTL đúng lúc chuyển là đã muộn.
- Nhớ JVM cũng cache DNS: Java có {{networkaddress.cache.ttl}}; để quá dài thì client Java gọi vào IP ALB cũ.

### Lỗi hay gặp
- **Xin cert ở sai region.** Triệu chứng: không thấy cert trong danh sách khi gắn vào ALB. Cách tránh: cert cho ALB ở cùng region với ALB; cert cho CloudFront phải ở {{us-east-1}}.
- **Cert chỉ có {{*.shop.vn}} nhưng truy cập {{shop.vn}}.** Wildcard không bao gồm tên gốc, cũng không bao gồm {{a.b.shop.vn}}. Cách tránh: thêm cả {{shop.vn}} vào subject alternative names.
- **Xoá CNAME validation "cho gọn".** Triệu chứng: một năm sau cert không gia hạn được, khách thấy cảnh báo hết hạn. Cách tránh: giữ nguyên bản ghi, đặt alarm theo sự kiện sắp hết hạn của ACM.
- **Quên redirect 80 → 443** hoặc app tự sinh link {{http://}} vì không đọc header {{X-Forwarded-Proto}}. Cách tránh: listener 80 redirect; trong Spring Boot đặt {{server.forward-headers-strategy=native}} (hoặc framework) để app biết request gốc là HTTPS.
- **Đổi NS ở nhà đăng ký trước khi zone mới có đủ bản ghi.** Triệu chứng: email và website cũ chết. Cách tránh: chép đủ mọi bản ghi (MX, TXT…) sang Route 53 trước rồi mới đổi NS.

### Trả lời mẫu khi phỏng vấn
"Tôi tạo hosted zone shop.vn trên Route 53 và trỏ NS ở nhà đăng ký về đó sau khi đã chép đủ bản ghi cũ. Cert xin bằng ACM ở đúng region của ALB, xác thực bằng DNS — một bản ghi CNAME, và chừng nào bản ghi đó còn và cert còn được dùng thì ACM tự gia hạn. ALB có listener 443 gắn cert với TLS policy hiện đại, listener 80 chỉ redirect sang HTTPS. Cuối cùng là bản ghi alias A trỏ tới ALB: alias dùng được ở zone apex, tự theo IP của ALB và không tính phí truy vấn, còn CNAME thì không đặt được ở apex. Trước khi chuyển đổi hạ TTL sớm, và trong app bật forward headers để Spring biết request gốc là HTTPS."

### Ví dụ đời thực
  Một thương hiệu điện tử ra mắt API tại api.shop.vn, dùng ALB ở ap-southeast-1. Triệu chứng: khách truy cập Chrome thấy cảnh báo "Chứng chỉ không an toàn" ở một phần requests. Đội tra qua curl -v: cert có CN=*.shop.vn nhưng tên truy cập là shop.vn (tên gốc) — wildcard chỉ bao gồm một cấp con (api.shop.vn), không bao gồm tên gốc shop.vn. Cert ACM đang ở us-east-1 (do tạo nhầm khi dùng CloudFront), trong khi ALB ở ap-southeast-1 không thấy cert trong danh sách. Nguyên nhân gốc: cert ở sai region và wildcard không bao gồm tên gốc. Xử lý: tạo lại cert ACM cho shop.vn (thêm SAN api.shop.vn) ở ap-southeast-1 với DNS validation, thêm CNAME validation vào Route 53, gắn vào listener 443; listener 80 redirect 301 sang HTTPS. Kết quả: cert hợp lệ, không còn cảnh báo, TLS handshake trung bình 120 ms, và ACM tự gia hạn chừng nào validation CNAME còn đó.

  > Senior tip: hai sự cố chứng chỉ tôi gặp nhiều nhất đều không phải do ACM mà do con người: xoá bản ghi validation và cert nằm ở sai region/thiếu tên. Đưa Route 53 record và ACM cert vào IaC cùng nhau (Terraform/CDK) để không ai xoá tay, và đặt alarm EventBridge cho sự kiện ACM sắp hết hạn — rẻ hơn rất nhiều so với một buổi sáng khách hàng báo "trang web không an toàn".`,
  follow: [
    'Khi nào cần private hosted zone và nó giúp gì cho service nội bộ trong VPC?',
    'Route 53 failover routing hoạt động thế nào với health check?',
    'Vì sao TLS kết thúc ở ALB và đoạn ALB → task là HTTP có chấp nhận được không?'
  ],
  tags: ['Route 53', 'ACM', 'DNS', 'TLS', 'ALB', 'alias'],
  refs: [
    { type: 'doc', title: 'Choosing between alias and non-alias records', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html' }
  ]
},
{
  id: 'aws-027',
  topic: 'aws',
  level: 'mid',
  q: 'Lúc 14:05 một dev chạy nhầm DELETE thiếu điều kiện WHERE trên bảng orders của RDS PostgreSQL production, xoá 120.000 dòng; các bảng khác vẫn đang nhận ghi. Bạn khôi phục thế nào bằng automated backup, point-in-time recovery và snapshot, và vì sao không thể "restore đè" lên instance đang chạy?',
  a: `**Tóm tắt:** RDS **luôn restore ra một instance MỚI** — nó không quay ngược instance đang chạy. Cách làm: dùng **point-in-time recovery (PITR)** tạo instance tạm ở thời điểm ngay trước lệnh xoá (lệnh chạy lúc 14:05:12 thì chọn **14:05:00**), rồi **chỉ chép bảng orders** (hoặc đúng 120.000 dòng bị xoá) từ instance tạm về production, sau đó xoá instance tạm. Không restore đè cả DB vì các bảng khác vẫn nhận ghi sau 14:05 — đè lên là mất dữ liệu đúng của chúng.

### Hiểu nhanh
Automated backup giống **camera an ninh quay liên tục**: mỗi ngày có một ảnh chụp toàn cảnh (snapshot), giữa các ảnh có đoạn video ghi mọi thay đổi (transaction log). Muốn xem "lúc 14:04:59 kho có gì", AWS lấy ảnh gần nhất rồi tua video tới đúng giây đó — nhưng kết quả được dựng thành **một kho mới bên cạnh**, không phải tua ngược kho thật. Bạn sang kho mới lấy đúng món bị mất mang về, kho thật vẫn tiếp tục bán hàng.

### Thuật ngữ
- **Automated backup**: RDS tự chụp snapshot hằng ngày trong backup window và lưu transaction log liên tục; giữ theo **retention period** (1–35 ngày; đặt 0 là tắt hẳn).
- **PITR**: restore về một thời điểm bất kỳ trong retention, chính xác tới giây; thời điểm muộn nhất có thể restore thường chỉ trễ vài phút so với hiện tại.
- **Manual snapshot**: snapshot bạn tự chụp, tồn tại tới khi bạn xoá (kể cả khi xoá instance) — dùng trước migration lớn.
- **Restore**: luôn tạo **DB instance mới** với endpoint mới; bạn chọn instance class, subnet group, security group, parameter group cho nó.
- **RPO/RTO**: dữ liệu tối đa chấp nhận mất / thời gian tối đa để khôi phục.

### Cơ chế từng bước
1. **Dừng chảy máu**: xác định thời điểm chính xác từ log ứng dụng hoặc {{pg_stat_activity}}/log của PostgreSQL (log_statement, audit) — giả sử lệnh xoá chạy lúc 14:05:12. Báo team, tạm khoá tính năng ghi vào orders nếu cần.
2. **PITR**: Console → Restore to point in time → chọn **14:05:00** (trước lệnh xoá vài giây), instance class nhỏ hơn cũng được, **đặt vào private subnet, security group chỉ cho máy thao tác vào**. Vì sao phải chọn tay: nếu để mặc định, instance mới có thể dùng default security group/parameter group khác production.
3. **Chờ instance available** — thời gian tỉ lệ với dung lượng và lượng log cần tua, từ vài chục phút tới vài giờ. Đây là phần lớn RTO.
4. **Lấy dữ liệu ra**: {{pg_dump --table=orders --data-only}} từ instance tạm, hoặc tạo bảng {{orders_restored}} trên production rồi {{INSERT ... SELECT}} qua {{postgres_fdw}}/dblink. Chỉ chèn những dòng **không còn** trên production (so theo khoá chính) để không đụng dữ liệu ghi mới sau 14:05.
5. **Kiểm tra**: đếm dòng, so tổng tiền, đối soát với bảng liên quan (order_items, payments).
6. **Dọn dẹp**: xoá instance tạm (tính tiền theo giờ), viết postmortem, bổ sung rào chắn.

~~~text
00:30          backup window: snapshot hằng ngày
00:30 ... 14:05 transaction log liên tục ───────────────►
                                   14:05:12 DELETE orders (sự cố)
PITR = snapshot 00:30 + tua log tới 14:05:00
     → instance MỚI "orders-restore" (endpoint khác)
     → chép 120.000 dòng orders về production
~~~

### So sánh các cách khôi phục
| Cách | Đơn vị khôi phục | Mất gì | Khi nào dùng |
|---|---|---|---|
| PITR ra instance mới + chép bảng | Bảng/dòng cụ thể | Gần như không | Xoá nhầm một phần dữ liệu (ca này) |
| PITR rồi chuyển app sang instance mới | Toàn bộ DB | Mọi ghi sau thời điểm restore | DB hỏng toàn bộ, chấp nhận mất cửa sổ |
| Restore từ manual snapshot | Toàn bộ DB tại lúc chụp | Mọi thứ sau lúc chụp | Migration lớn thất bại, có snapshot ngay trước đó |
| Read replica | — | — | **Không** cứu được: lệnh DELETE đã được replicate sang |

### Lỗi hay gặp
- **Tưởng Multi-AZ hay read replica là backup.** Triệu chứng: DELETE chạy trên primary, standby và replica cùng mất dữ liệu trong vài giây. Cách tránh: hiểu Multi-AZ/replica chống **hỏng máy**, còn backup/PITR chống **lỗi con người**.
- **Retention để 1 ngày hoặc tắt (0)** cho tiết kiệm. Triệu chứng: sự cố phát hiện sau 2 ngày thì không còn điểm khôi phục. Cách tránh: production tối thiểu 7–14 ngày, dữ liệu tài chính dài hơn và sao lưu thêm bằng AWS Backup.
- **Restore với cấu hình mặc định.** Triệu chứng: instance tạm mở ra security group rộng hoặc thiếu parameter group tuỳ chỉnh. Cách tránh: chỉ định rõ subnet group, security group, parameter group khi restore.
- **Restore đè rồi chuyển app sang instance mới** chỉ vì một bảng. Triệu chứng: mất mọi đơn hàng, thanh toán ghi sau 14:05. Cách tránh: chỉ chép phần bị mất.
- **Dev có quyền ghi trực tiếp trên production.** Cách tránh: tài khoản read-only cho truy vấn tay, thay đổi dữ liệu qua script được review, chạy trong transaction kèm kiểm tra số dòng bị ảnh hưởng trước khi COMMIT.

### Trả lời mẫu khi phỏng vấn
"RDS không quay ngược instance đang chạy; mọi restore đều tạo instance mới. Vì các bảng khác vẫn nhận ghi sau 14:05, tôi không restore đè cả DB. Tôi xác định chính xác thời điểm lệnh xoá từ log, dùng point-in-time recovery tạo instance tạm ở thời điểm ngay trước đó, đặt nó trong private subnet với security group và parameter group chỉ định rõ. Khi instance tạm sẵn sàng, tôi dump riêng bảng orders, hoặc dùng postgres_fdw chèn lại những dòng không còn trên production theo khoá chính, rồi đối soát số dòng và tổng tiền, cuối cùng xoá instance tạm. Bài học đi kèm: Multi-AZ và read replica không phải backup, retention phải đủ dài, và dev không được có quyền ghi trực tiếp production."

### Ví dụ đời thực
  Một công ty tài chính chạy RDS PostgreSQL production, automated backup retention 7 ngày. lúc 14:05:12 một dev chạy nhầm DELETE thiếu WHERE trên bảng orders, xoá 120.000 dòng trong 3 giây. Triệu chứng: khách hàng không thấy đơn hàng mới, bộ phận hỗ trợ bị ùn. Đội tra pg_stat_activity và log: thấy lệnh DELETE chạy xong lúc 14:05:12. Nguyên gốc: không có rào chắn prevent dev ghi trực tiếp production. Xử lý: dùng PITR tạo instance tạm "orders-restore" ở thời điểm 14:05:00, đặt trong private subnet với security group chỉ cho máy thao tác; chờ 45 phút (tỉ lệ với 500 GB data và log cần tua), dump bảng orders với pg_dump --table=orders --data-only, chèn lại những dòng không còn trên production theo khóa chính, đối chiếu số dòng (120.000) và tổng tiền. Kết quả: khôi phục hoàn toàn trong 2 giờ, không mất đơn hàng nào sau 14:05, và sau đó thêm read-only role cho dev, backup retention lên 14 ngày, và script kiểm tra số dòng ảnh hưởng trước khi COMMIT.

  > Senior tip: hãy **diễn tập restore** mỗi quý và đo thời gian thật — đa số team chỉ biết RTO của mình khi đang có sự cố, và thường bất ngờ vì PITR một DB vài trăm GB mất cả giờ. Với Aurora, **database cloning** (copy-on-write) cho bạn bản sao để điều tra trong vài phút; với Aurora MySQL còn có Backtrack quay ngược cả cluster, nhưng tính năng này không có trên Aurora PostgreSQL.`,
  follow: [
    'Multi-AZ, read replica và automated backup mỗi thứ bảo vệ bạn khỏi loại sự cố nào?',
    'Làm sao giảm RTO khi DB lên tới vài TB?',
    'Bạn thiết kế quyền truy cập production DB cho dev thế nào để tránh sự cố như trên?'
  ],
  tags: ['RDS', 'PITR', 'backup', 'snapshot', 'PostgreSQL', 'incident'],
  refs: [
    { type: 'doc', title: 'Restoring a DB instance to a specified time for Amazon RDS', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html' }
  ]
},
{
  id: 'aws-028',
  topic: 'aws',
  level: 'senior',
  q: 'Lambda Java đọc SQS để gửi email xác nhận đơn hàng, batch 10 message. Chỉ cần 1 message lỗi là cả 10 bị xử lý lại, khách nhận email trùng, và message độc cứ quay vòng mãi. Bạn cấu hình event source mapping, visibility timeout, partial batch response và DLQ thế nào?',
  a: `**Tóm tắt:** Mặc định, nếu function ném lỗi thì **cả batch** được coi là thất bại và mọi message quay lại queue sau visibility timeout. Sửa bằng **partial batch response**: bật {{ReportBatchItemFailures}} trên event source mapping và trả về danh sách {{messageId}} lỗi — chỉ những message đó được thử lại. Đặt **visibility timeout của queue ≥ 6 lần timeout của function**, cấu hình **redrive policy** ({{maxReceiveCount}}) để message độc sang DLQ, và làm handler **idempotent** vì SQS vẫn là at-least-once.

### Hiểu nhanh
SQS giống **băng chuyền phát thư**: Lambda bốc một xấp 10 lá, đọc xong lá nào phải báo "xong" thì lá đó mới bị huỷ. Không báo gì mà lại kêu "lỗi" thì cả xấp quay về băng chuyền, kể cả 9 lá đã gửi email rồi — đó là lý do email trùng. **Partial batch response** giống trả lại đúng lá có vấn đề. **DLQ** là thùng "thư không phát được": lá nào thử quá N lần thì bỏ vào đó để người xem xét, không chặn băng chuyền.

### Thuật ngữ
- **Event source mapping (ESM)**: thành phần của Lambda tự **poll** SQS, gom batch và gọi function; bạn không viết code poll.
- **Batch size / batching window**: số message tối đa mỗi lần gọi và thời gian chờ gom thêm; FIFO tối đa 10 message mỗi batch.
- **Visibility timeout**: khi một message được nhận, nó bị ẩn khỏi consumer khác trong khoảng này; hết hạn mà chưa bị xoá thì hiện lại.
- **ReportBatchItemFailures**: chế độ cho phép function trả {{batchItemFailures}} — danh sách id message lỗi.
- **Redrive policy / maxReceiveCount**: đặt trên **queue nguồn**; message bị nhận quá số lần này thì SQS chuyển sang DLQ.
- **Maximum concurrency**: giới hạn số function đồng thời mà ESM gọi cho một queue (tối thiểu 2), bảo vệ hệ thống phía sau.

### Cơ chế từng bước
1. ESM long-poll SQS, nhận 10 message; mỗi message bị ẩn theo visibility timeout của queue.
2. ESM gọi function với {{SQSEvent}} chứa 10 record.
3. **Không bật partial batch**: function ném exception → ESM không xoá message nào → hết visibility timeout cả 10 hiện lại → 9 email gửi lần hai.
4. **Có partial batch**: function bắt lỗi từng message, trả về id của message lỗi; ESM **xoá 9 message thành công**, chỉ message lỗi hiện lại sau visibility timeout.
5. Message lỗi được nhận lại; mỗi lần nhận tăng {{ApproximateReceiveCount}}. Vượt {{maxReceiveCount}} (ví dụ 5) → SQS chuyển sang DLQ.
6. Vì sao visibility timeout phải ≥ 6 lần timeout function: ESM có thể retry gọi function khi bị throttle; nếu message hiện lại trong lúc lần xử lý đầu chưa xong thì hai function cùng xử lý một message.

~~~text
Batch: m1 m2 m3 m4 m5 m6 m7 m8 m9 m10   (m7 lỗi: email không hợp lệ)
Không partial  : throw → cả 10 quay lại → 9 email trùng
Có partial     : trả [m7] → xoá 9, m7 quay lại
m7 nhận lần 1..5 vẫn lỗi → maxReceiveCount=5 → DLQ orders-email-dlq → alarm
~~~

### Code
~~~java
public class EmailHandler implements RequestHandler<SQSEvent, SQSBatchResponse> {
    @Override
    public SQSBatchResponse handleRequest(SQSEvent event, Context ctx) {
        List<SQSBatchResponse.BatchItemFailure> failures = new ArrayList<>();
        for (SQSEvent.SQSMessage msg : event.getRecords()) {
            try {
                OrderEvent e = parse(msg.getBody());
                if (sentLog.alreadySent(e.orderId())) continue;   // idempotent: đã gửi thì bỏ qua
                mailer.send(e);
                sentLog.markSent(e.orderId());
            } catch (Exception ex) {
                // chỉ báo message này lỗi, các message khác vẫn được xoá
                failures.add(new SQSBatchResponse.BatchItemFailure(msg.getMessageId()));
            }
        }
        return new SQSBatchResponse(failures);   // danh sách rỗng = cả batch thành công
    }
}
~~~
Code trên chỉ có tác dụng khi ESM có {{FunctionResponseTypes = ReportBatchItemFailures}}; thiếu cấu hình này thì Lambda bỏ qua giá trị trả về.

### Bảng cấu hình gợi ý
| Tham số | Giá trị ví dụ | Vì sao |
|---|---|---|
| Function timeout | 30 giây | Đủ cho 10 lần gọi SMTP/API email |
| Visibility timeout (queue) | 180 giây | ≥ 6 × timeout function |
| Batch size | 10 | Cân bằng số lần gọi và độ trễ |
| maxReceiveCount | 5 | Lỗi tạm có cơ hội tự hết, message độc không quay vòng mãi |
| Maximum concurrency | 20 | Không làm sập nhà cung cấp email |
| DLQ retention | 14 ngày | Đủ thời gian điều tra và redrive |

### Lỗi hay gặp
- **Ném exception cho cả batch.** Triệu chứng: email trùng, chi phí gọi tăng. Cách tránh: partial batch response.
- **Trả {{batchItemFailures}} nhưng quên bật ReportBatchItemFailures.** Triệu chứng: message lỗi bị xoá như thành công — mất dữ liệu im lặng. Cách tránh: kiểm tra cấu hình ESM trong IaC.
- **Visibility timeout ngắn hơn thời gian xử lý.** Triệu chứng: cùng một message được hai function xử lý song song. Cách tránh: quy tắc 6 lần.
- **Đặt DLQ ở cấu hình async của Lambda thay vì redrive policy của queue.** Với nguồn SQS, DLQ phải nằm ở **queue nguồn**; DLQ "on-failure destination" của Lambda chỉ dành cho gọi bất đồng bộ.
- **FIFO mà vẫn xử lý tiếp sau message lỗi.** Triệu chứng: sai thứ tự. Cách tránh: với FIFO, gặp message lỗi thì dừng và trả cả message đó lẫn các message phía sau trong batch.
- **Không có alarm trên DLQ.** Message nằm trong DLQ 14 ngày rồi bị xoá mà không ai biết. Cách tránh: alarm {{ApproximateNumberOfMessagesVisible}} > 0 trên DLQ.

### Trả lời mẫu khi phỏng vấn
"Với nguồn SQS, Lambda dùng event source mapping để poll và gọi function theo batch; mặc định một exception làm cả batch quay lại queue, nên 9 message đã xử lý bị làm lại. Tôi bật ReportBatchItemFailures và trả về id của từng message lỗi, để ESM xoá phần thành công. Visibility timeout của queue tôi đặt ít nhất 6 lần timeout function để message không hiện lại khi đang xử lý. Redrive policy với maxReceiveCount khoảng 5 đưa message độc sang DLQ, có alarm khi DLQ khác 0 và quy trình redrive sau khi sửa lỗi. Vì SQS là at-least-once, handler luôn idempotent theo orderId, và tôi giới hạn maximum concurrency để không đè sập dịch vụ phía sau."

### Ví dụ đời thực
  Một ứng dụng gửi email xác nhận đơn hàng qua Lambda đọc SQS standard, batch 10 message, function timeout 30 giây. Triệu chứng: khách nhận email xác nhận trùng lặp — mỗi đơn hàng nhận 2-3 email, chi phí email tăng 3 lần. Đội tra SQS: ApproximateReceiveCount tăng nhanh, DLQ rỗng, CloudWatch Logs thấy handler throw exception cho cả batch khi một message email sai định dạng. Nguyên nhân gốc: không bật partial batch response, ESM không xoá message nào, cả 10 quay lại queue sau visibility timeout (60 giây), 9 message đã gửi email bị xử lý lại. Xử lý: bật ReportBatchItemFailures trên ESM, handler bắt lỗi từng message, trả về batchItemFailures cho message lỗi; thêm idempotent check theo orderId trong sentLog; đặt maxReceiveCount=5, visibility timeout lên 180 giây (≥ 6 × timeout function). Kết quả: không còn email trùng, message lỗi đi vào DLQ sau 5 lần thử, chi phí email giảm 90%, và DLQ có alarm khi ApproximateNumberOfMessagesVisible > 0.

  > Senior tip: phân biệt **lỗi tạm** (timeout nhà cung cấp email) và **lỗi vĩnh viễn** (email sai định dạng). Lỗi vĩnh viễn thì ghi nhận và **coi như thành công** (hoặc đẩy thẳng sang một queue lỗi nghiệp vụ) thay vì để nó quay 5 vòng tốn tiền rồi mới vào DLQ. DLQ nên chỉ chứa thứ thật sự cần người xem — nếu DLQ ngày nào cũng có vài trăm message thì nó đã thành bãi rác, không ai nhìn nữa.`,
  follow: [
    'Với SQS FIFO, partial batch response phải xử lý thế nào để giữ thứ tự?',
    'Maximum concurrency của event source mapping khác reserved concurrency của function ra sao?',
    'Bạn redrive message từ DLQ về queue nguồn an toàn thế nào sau khi sửa lỗi?'
  ],
  tags: ['Lambda', 'SQS', 'DLQ', 'partial batch response', 'idempotency'],
  refs: [
    { type: 'doc', title: 'Using Lambda with Amazon SQS', url: 'https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html' }
  ]
},
{
  id: 'aws-029',
  topic: 'aws',
  level: 'senior',
  q: 'Service Spring Boot chạy 4 task trên ECS có một job @Scheduled đối soát giao dịch lúc 23:30 giờ Việt Nam. Sau khi scale lên 4 task, job chạy 4 lần và sinh 4 file đối soát. Bạn sửa thế nào: ShedLock, tách job ra EventBridge Scheduler gọi ECS task/Lambda, hay cách khác? So sánh và chọn.',
  a: `**Tóm tắt:** {{@Scheduled}} chạy trong **mỗi** instance, nên 4 task là 4 lần chạy. Có hai hướng: (1) giữ job trong service và dùng **khoá phân tán** như **ShedLock** (khoá trong DB) để chỉ một instance chạy; (2) **tách job khỏi service**: **EventBridge Scheduler** (cron có múi giờ, retry, DLQ) kích hoạt **ECS RunTask** hoặc **Lambda** chạy job một lần. Job ngắn, nhẹ, gắn chặt với service thì ShedLock là đủ; job nặng, quan trọng (đối soát tài chính) thì tách ra lịch quản lý được. Dù cách nào, job phải **idempotent** vì lịch vẫn có thể kích hoạt hơn một lần.

### Hiểu nhanh
{{@Scheduled}} giống mỗi nhân viên ca đêm đều đặt báo thức 23:30 để "khoá cửa kho". Có 4 nhân viên thì cửa bị khoá 4 lần và có 4 biên bản. **ShedLock** giống quy định "ai khoá cửa thì treo thẻ lên bảng; thấy thẻ rồi thì thôi". **EventBridge Scheduler** giống bảo vệ toà nhà có lịch riêng: đúng 23:30 bảo vệ gọi **một** người tới làm việc đó, nếu không ai nghe thì gọi lại, gọi mãi không được thì ghi sổ sự cố.

### Thuật ngữ
- **@Scheduled**: lịch chạy trong JVM của Spring; mỗi instance có lịch riêng, không biết instance khác.
- **ShedLock**: thư viện dùng một bảng (hoặc Redis…) làm khoá; {{lockAtMostFor}} là thời gian giữ khoá tối đa phòng khi instance chết giữa chừng, {{lockAtLeastFor}} chống chạy lại khi đồng hồ các máy lệch nhau.
- **EventBridge Scheduler**: dịch vụ lịch serverless: biểu thức {{cron}}/{{rate}}/một lần, có **múi giờ**, retry policy, DLQ, flexible time window; target gồm Lambda, ECS RunTask, SQS, Step Functions và nhiều API khác.
- **ECS RunTask**: chạy một task độc lập (không thuộc service), task tự kết thúc khi job xong.
- **Idempotent**: chạy lại cùng tham số không tạo kết quả trùng — ví dụ khoá theo ngày đối soát.

### Cơ chế từng bước (hướng tách job)
1. Đóng gói job thành entrypoint riêng: cùng image, nhưng chạy với profile {{reconcile}} — {{spring.main.web-application-type=none}}, chạy job rồi thoát với exit code (0 thành công, khác 0 thất bại).
2. Tạo schedule: {{cron(30 23 * * ? *)}} với timezone {{Asia/Ho_Chi_Minh}}. Vì sao cần timezone: biểu thức cron mặc định theo UTC, quên là job chạy lúc 6:30 sáng.
3. Target là ECS RunTask (Fargate, task definition {{reconcile-job}}, subnet private) kèm input chứa ngày đối soát.
4. Retry policy (ví dụ tối đa 3 lần, max event age 1 giờ) cho lỗi **gọi target** (throttle, thiếu capacity). DLQ (SQS) nhận sự kiện không gọi được.
5. Job ghi bảng {{reconcile_run(business_date PK, status)}} trước khi chạy: nếu ngày đó đã DONE thì thoát — đây là lớp idempotent.
6. Alarm: không thấy bản ghi DONE trước 01:00 → báo on-call.

~~~text
Trước:  task1 @Scheduled 23:30 ─┐
        task2 @Scheduled 23:30 ─┼─► 4 file đối soát
        task3 @Scheduled 23:30 ─┤
        task4 @Scheduled 23:30 ─┘
Sau:    EventBridge Scheduler (cron 23:30, Asia/Ho_Chi_Minh, retry 3, DLQ)
             └─► ECS RunTask reconcile-job (1 task) ─► reconcile_run[2026-10-29]=DONE
~~~

### Code: phương án ShedLock (giữ trong service)
~~~java
@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "PT30M")   // khoá tối đa 30 phút nếu task chết
class SchedulingConfig {
    @Bean LockProvider lockProvider(DataSource ds) {
        return new JdbcTemplateLockProvider(ds);      // bảng shedlock trong DB dùng chung
    }
}

@Scheduled(cron = "0 30 23 * * *", zone = "Asia/Ho_Chi_Minh")
@SchedulerLock(name = "daily-reconcile", lockAtLeastFor = "PT5M")
void reconcile() {
    service.reconcile(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")));  // bên trong vẫn idempotent theo ngày
}
~~~

### So sánh
| Tiêu chí | ShedLock trong service | EventBridge Scheduler → ECS task/Lambda |
|---|---|---|
| Hạ tầng thêm | Một bảng DB | Schedule, task definition/Lambda, IAM role |
| Tài nguyên khi chạy | Ăn CPU/RAM của task đang phục vụ API | Task riêng, không ảnh hưởng API |
| Retry, DLQ, lịch sử | Tự viết | Có sẵn retry, DLQ; job ghi trạng thái |
| Deploy trùng giờ chạy | Job có thể bị kill giữa chừng khi rolling update | Không phụ thuộc vòng đời service |
| Job dài | Phải chỉnh lockAtMostFor cẩn thận | Lambda tối đa 15 phút; ECS task không giới hạn kiểu đó |
| Hợp với | Job nhẹ, vài giây–vài phút | Job quan trọng, nặng, cần giám sát |

### Lỗi hay gặp
- **Cron theo UTC.** Triệu chứng: job chạy lệch 7 tiếng. Cách tránh: khai báo {{zone}} trong {{@Scheduled}} hoặc timezone của schedule.
- **lockAtMostFor ngắn hơn thời gian job.** Triệu chứng: job chưa xong khoá đã hết hạn, instance khác chạy chồng. Cách tránh: đặt lớn hơn thời gian chạy dài nhất đo được, và vẫn idempotent.
- **Tin "exactly-once" của scheduler.** EventBridge Scheduler đảm bảo **ít nhất một lần** gọi target. Cách tránh: khoá theo business_date trong DB.
- **Chạy job nặng trong task API.** Triệu chứng: 23:30 p99 API tăng vọt, health check fail, ECS giết task đang chạy job. Cách tránh: tách task riêng.
- **Job dùng Lambda nhưng chạy quá 15 phút.** Lambda bị cắt giữa chừng. Cách tránh: ECS task, hoặc chia nhỏ qua Step Functions.

### Trả lời mẫu khi phỏng vấn
"@Scheduled chạy trong mọi instance nên 4 task là 4 lần chạy. Nếu job nhẹ và gắn với service, tôi thêm ShedLock: một bảng khoá trong DB, chỉ instance giành được khoá mới chạy, đặt lockAtMostFor lớn hơn thời gian chạy dài nhất. Với job đối soát tài chính, tôi tách hẳn ra: EventBridge Scheduler với cron và múi giờ Asia/Ho_Chi_Minh, target là ECS RunTask chạy cùng image ở chế độ không web, có retry policy và DLQ, nên job không ăn tài nguyên của API và không bị rolling update giết. Trong cả hai cách, job idempotent theo ngày nghiệp vụ bằng bảng trạng thái, vì scheduler chỉ đảm bảo ít nhất một lần, và có alarm nếu tới hạn mà chưa thấy trạng thái DONE."

### Ví dụ đời thực
  Một đội vận hành hệ thống đối soát giao dịch, chạy job @Scheduled lúc 23:30 trên 4 task ECS Fargate. Triệu chứng: mỗi sáng, nhân viên kế toán tìm thấy 4 file đối soát với cùng tên ngày nhưng nội dung khác nhau, phải chọn file nào để import. Đội tra logs: thấy 4 lần chạy job, mỗi task một lần, vì @Scheduled chạy trong mỗi JVM và không có cơ chế phân phối. Nguyên gốc: job định kỳ chạy đồng bộ trong mọi instance, không biết instance khác. Xử lý: tách job ra EventBridge Scheduler với cron(30 23 * * ? *) timezone Asia/Ho_Chi_Minh, target ECS RunTask chạy task reconcile-job (chế độ non-web, spring.main.web-application-type=none), job ghi bảng reconcile_run(business_date PK, status) trước khi chạy — nếu ngày đã DONE thì thoát; retry policy 3 lần, DLQ SQS, alarm nếu không thấy DONE trước 01:00. Kết quả: mỗi ngày chỉ một file đối soát, chạy đúng 23:30 giờ Việt Nam, không còn file trùng, và job không ảnh hưởng tới API do chạy task riêng.

  > Senior tip: alarm quan trọng nhất của job định kỳ không phải "job lỗi" mà là **"job không chạy"** — lỗi thì còn log, không chạy thì im lặng tuyệt đối. Hãy để job ghi một metric/bản ghi "heartbeat" khi xong và alarm khi thiếu dữ liệu (CloudWatch alarm với missing data = breaching). Tôi từng thấy job đối soát chết im lặng 3 ngày chỉ vì IAM role của scheduler bị sửa.`,
  follow: [
    'Vì sao lockAtLeastFor cần thiết khi đồng hồ các instance lệch nhau?',
    'Job đối soát chạy 2 tiếng: bạn chia nhỏ hoặc điều phối nó thế nào để chạy lại từng phần khi lỗi?',
    'EventBridge Scheduler khác EventBridge rule có schedule ở điểm nào?'
  ],
  tags: ['EventBridge Scheduler', 'ShedLock', 'ECS', 'scheduled job', 'idempotency'],
  refs: [
    { type: 'doc', title: 'What is Amazon EventBridge Scheduler?', url: 'https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html' }
  ]
},
{
  id: 'aws-030',
  topic: 'aws',
  level: 'lead',
  q: 'Bạn dẫn dắt việc đưa hệ thống on-premise (12 service Spring Boot trên VM, một Oracle 3 TB) lên AWS trong 9 tháng, downtime cutover tối đa 1 giờ. Bạn chọn chiến lược cho từng phần thế nào (rehost, replatform, refactor…), di chuyển database ra sao, và lên kế hoạch cutover, rollback thế nào?',
  a: `**Tóm tắt:** Phân loại từng thành phần theo **7 R** (retire, retain, rehost, relocate, repurchase, replatform, refactor) dựa trên giá trị nghiệp vụ và rủi ro — đa số service Spring Boot đi **replatform** (container lên ECS/EKS, đổi cấu hình, không viết lại), chỉ refactor chỗ thật sự có lý do. Database dùng **AWS DMS** chạy **full load + CDC** (đồng bộ thay đổi liên tục) để cutover chỉ còn vài phút dừng ghi; quyết định Oracle → RDS for Oracle (ít rủi ro) hay → Aurora PostgreSQL (tiết kiệm license, tốn công chuyển schema/PLSQL) là quyết định riêng. Cutover theo **runbook có diễn tập**, tiêu chí go/no-go rõ, và đường **rollback** (giữ on-prem đồng bộ ngược) trong vài ngày đầu.

### Hiểu nhanh
Chuyển hệ thống lên cloud giống **chuyển một nhà hàng đang mở cửa sang địa điểm mới**. Có món mang nguyên nồi sang (rehost), có món đổi bếp ga sang bếp từ nhưng giữ công thức (replatform), có món làm lại công thức (refactor), có món bỏ khỏi thực đơn (retire). Kho nguyên liệu (database) là phần khó nhất: không thể đóng cửa một tuần để chuyển, nên chở dần hàng tồn sang trước (full load), mỗi lần nhập hàng mới thì giao luôn cho cả hai kho (CDC), tới ngày khai trương chỉ cần đóng cửa một giờ để kiểm kê lần cuối.

### Thuật ngữ
- **Rehost**: chuyển nguyên VM lên EC2 (ví dụ bằng AWS Application Migration Service), không sửa code.
- **Replatform**: thay nền tảng mà không viết lại — VM → container trên ECS, Oracle tự quản → RDS.
- **Refactor**: viết lại/đổi kiến trúc để dùng dịch vụ cloud-native; đắt nhất, chỉ làm khi có lợi ích rõ.
- **AWS DMS**: dịch vụ di chuyển dữ liệu; **full load** chép dữ liệu hiện có, **CDC** đọc log thay đổi của nguồn (với Oracle là redo log qua LogMiner/Binary Reader) và áp sang đích liên tục.
- **Schema conversion**: chuyển schema, view, PL/SQL sang engine khác (DMS Schema Conversion hoặc AWS SCT) — luôn có phần phải sửa tay.
- **Cutover**: thời điểm chuyển traffic thật sang hệ thống mới.
- **Wave**: nhóm thành phần được chuyển cùng đợt.

### Cơ chế từng bước
1. **Khảo sát (tháng 1–2)**: lập bản đồ phụ thuộc (service nào gọi service nào, gọi DB nào, gọi hệ thống on-prem nào còn ở lại), đo tải, đo dung lượng thay đổi DB mỗi ngày. Vì sao: dependency ẩn là nguyên nhân số một khiến cutover thất bại.
2. **Nền tảng (landing zone)**: account, VPC, kết nối on-prem ↔ AWS bằng **Direct Connect hoặc Site-to-Site VPN** — vì DMS và các service còn ở on-prem cần đường mạng ổn định trong nhiều tháng.
3. **Chọn chiến lược theo từng thành phần** (bảng dưới). Ưu tiên ít thay đổi cùng lúc: đổi nền tảng **hoặc** đổi engine DB, tránh đổi cả hai trong một wave.
4. **Database**: tạo đích, chuyển schema, chạy DMS full load, bật CDC, theo dõi **độ trễ CDC** và dùng DMS data validation để so dữ liệu. Diễn tập trên bản sao nhiều lần để đo thời gian.
5. **Chuyển service theo wave**: service ít phụ thuộc trước; trong thời gian chuyển tiếp, service trên AWS gọi DB on-prem (hoặc ngược lại) qua Direct Connect — đo độ trễ, đừng để service "chatty" vắt qua hai nơi lâu.
6. **Cutover database (cửa sổ 1 giờ)**: dừng ghi ở nguồn → chờ CDC lag về 0 → kiểm tra số dòng/checksum các bảng trọng yếu → đổi cấu hình kết nối (DNS nội bộ) → mở ghi ở đích → smoke test nghiệp vụ.
7. **Rollback**: chuẩn bị sẵn DMS task **chiều ngược** (AWS → on-prem) bật ngay sau cutover để on-prem không bị bỏ lại phía sau; tiêu chí rollback (ví dụ lỗi nghiệp vụ nghiêm trọng trong 72 giờ) được thống nhất trước.

~~~text
Tháng   1-2        3-4            5-7                 8            9
      Khảo sát → Landing zone → Wave 1..3 service → Diễn tập DB → Cutover DB
                  DX/VPN         (replatform ECS)     2-3 lần      cửa sổ 1h
DB:   Oracle on-prem ══ DMS full load ══ CDC liên tục ════════╗
                                                               ╚═► đích (RDS/Aurora)
                                                     sau cutover: CDC ngược → on-prem (rollback)
~~~

### Chọn chiến lược
| Thành phần | Chiến lược | Lý do |
|---|---|---|
| 10 service Spring Boot stateless | Replatform → ECS Fargate | Đã đóng gói jar, container hoá nhanh, bỏ vá OS |
| Service báo cáo ít dùng | Retire hoặc gộp | 3 người dùng/tháng, không đáng chi phí chuyển |
| Service gọi mainframe còn ở on-prem | Retain tạm thời | Phụ thuộc chưa chuyển được |
| Oracle 3 TB, nhiều PL/SQL | RDS for Oracle trước, cân nhắc PostgreSQL sau | Không đổi engine cùng lúc với đổi hạ tầng |
| Cron/batch trên VM | Replatform → ECS task + EventBridge Scheduler | Bỏ máy chạy cron đơn lẻ |

### Lỗi hay gặp
- **Đổi mọi thứ cùng lúc** (cloud + container + PostgreSQL + microservice hoá). Triệu chứng: lỗi không biết do tầng nào, dự án trễ. Cách tránh: mỗi wave một loại thay đổi.
- **Không đo băng thông cho full load.** 3 TB qua VPN 200 Mbps mất hơn một ngày; CDC không đuổi kịp nếu thay đổi mỗi ngày lớn. Cách tránh: tính trước, cân nhắc Direct Connect hoặc load ban đầu bằng backup/Snowball rồi CDC từ thời điểm đó.
- **Bỏ qua kiểu dữ liệu và LOB.** DMS có giới hạn với LOB lớn và một số kiểu đặc thù; phát hiện lúc cutover là quá muộn. Cách tránh: chạy full load thử sớm, đọc báo cáo lỗi/validation.
- **Sequence và trigger ở đích.** Sau cutover, sequence chưa được nâng → lỗi trùng khoá chính. Cách tránh: bước cutover có mục "đặt lại sequence", tắt trigger ở đích trong lúc CDC rồi bật lại.
- **Không có đường rollback.** Triệu chứng: phát hiện lỗi sau 6 giờ, dữ liệu mới chỉ có trên AWS, không quay về được. Cách tránh: CDC ngược và tiêu chí rollback có thời hạn.

### Trả lời mẫu khi phỏng vấn
"Tôi bắt đầu bằng khảo sát phụ thuộc và đo tải, rồi xếp từng thành phần vào 7 R: phần lớn service Spring Boot replatform sang ECS vì đã có jar, thành phần ít giá trị thì retire, phần còn phụ thuộc on-prem thì retain tạm. Nền tảng gồm landing zone và kết nối Direct Connect hoặc VPN đủ băng thông. Database tôi không đổi engine cùng lúc với đổi hạ tầng: Oracle sang RDS for Oracle trước, dùng DMS full load cộng CDC để dữ liệu đồng bộ liên tục, có data validation và diễn tập cutover ít nhất hai lần để đo thời gian. Cửa sổ một giờ chỉ gồm dừng ghi, chờ CDC lag về 0, kiểm tra checksum, đổi DNS nội bộ và smoke test. Sau cutover tôi bật CDC ngược về on-prem và giữ tiêu chí rollback 72 giờ."

### Ví dụ đời thực
  Một công ty logistics chuyển 12 service Spring Boot và Oracle 3 TB từ datacenter lên AWS trong 9 tháng. Triệu chứng: thử nghiệm full load qua VPN 200 Mbps mất 2 ngày, CDC lag tăng dần lên 30 phút do thay đổi mỗi ngày 50 GB. Đội đo bandwidth: VPN không đủ, DMS task liên tục throttle. Nguyên gốc: không đo bandwidth trước, chọn phương án full load trực tiếp qua VPN. Xử lý: dùng AWS Snowball để load ban đầu dữ liệu tồn (3 TB) trong 1 tuần, sau đó tạo DMS task từ thời điểm đó với CDC; chọn RDS for Oracle thay vì đổi engine (tránh chuyển PL/SQL), diễn tập cutover 2 lần trên bản sao. Kết quả: cutover thực hiện trong 55 phút (dưới giới hạn 1 giờ), CDC lag dưới 5 giây, rollback CDC ngược về on-prem đã chạy trong 48 giờ, không mất dữ liệu, và 10 service đã sang ECS Fargate với chi phí compute giảm 40%.

  > Senior tip: thứ quyết định thành bại thường là **runbook cutover** chứ không phải công nghệ: từng bước có người chịu trách nhiệm, thời gian dự kiến lấy từ lần diễn tập, điểm go/no-go và người có quyền quyết định rollback. Hãy diễn tập đầy đủ trên môi trường giống production ít nhất hai lần — lần đầu luôn lộ ra vài việc mất gấp ba thời gian dự kiến (đặt lại sequence, rebuild index, đổi DNS trong hệ thống cũ không ai nhớ).`,
  follow: [
    'Khi nào nên đổi Oracle sang Aurora PostgreSQL ngay trong đợt migration, khi nào để sau?',
    'Trong giai đoạn chuyển tiếp, service trên AWS gọi DB on-prem: rủi ro độ trễ và cách giảm?',
    'Bạn đo và báo cáo tiến độ, rủi ro migration cho lãnh đạo thế nào?'
  ],
  tags: ['migration', '7R', 'DMS', 'CDC', 'cutover', 'Oracle'],
  refs: [
    { type: 'doc', title: 'What is AWS Database Migration Service?', url: 'https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html' }
  ]
}
,
{
  id: 'aws-031',
  topic: 'aws',
  level: 'mid',
  q: 'Route 53 hỗ trợ các bản ghi A, AAAA, CNAME, Alias và MX/TXT. Vì sao không đặt CNAME ở apex (root domain), và TTL ảnh hưởng thế nào khi cutover?',
  a: `**Tóm tắt:** DNS (Domain Name System - hệ thống "danh bạ" đổi tên miền như {{app.example.com}} thành địa chỉ IP để máy tính kết nối được) trên Route 53 có các bản ghi A/AAAA (tên -> IP), CNAME (tên -> tên khác), MX (máy chủ mail), TXT (xác thực) và Alias (đặc thù Route 53). Không đặt CNAME ở apex (tên miền gốc, ví dụ {{example.com}}) vì chuẩn DNS cấm CNAME đi cùng các bản ghi khác tại cùng tên; dùng Alias trỏ tới tài nguyên AWS. TTL (Time To Live - thời gian resolver/ISP được cache bản ghi) phải hạ thấp trước cutover (chuyển đổi hệ thống) để client nhận IP mới nhanh, rồi nâng lên sau khi ổn định để giảm chi phí và tải DNS.

### Cái gì và vì sao cần hiểu rõ từng loại bản ghi
- **Resolver DNS**: thành phần hỏi đáp "tên này là IP nào" (máy tính của bạn, DNS ISP, hoặc public resolver). Resolver cache câu trả lời theo TTL.
- **A**: ánh xạ tên -> IPv4 (ví dụ {{203.0.113.10}}). **AAAA**: tên -> IPv6.
- **CNAME (Canonical Name)**: ánh xạ tên -> một tên khác, resolver sẽ hỏi tiếp tên đích. Ví dụ {{www.example.com}} -> {{app-alb-123.ap-southeast-1.elb.amazonaws.com}}.
- **MX (Mail Exchange)**: chỉ máy chủ nhận email cho domain, kèm độ ưu tiên (số nhỏ ưu tiên trước) để failover mail.
- **TXT**: lưu text tự do, dùng cho SPF/DKIM/DMARC (chống giả mạo email) và xác minh quyền sở hữu domain.
- **Alias (Route 53)**: bản ghi đặc thù AWS, trông giống A/AAAA nhưng đích là tài nguyên AWS (ALB, CloudFront, S3 website, API Gateway, bản ghi Route 53 khác...). Route 53 tự theo dõi IP của tài nguyên; truy vấn Alias thường miễn phí và hỗ trợ apex.

### Vì sao CNAME không được đặt ở apex (root domain)
Apex là tên miền gốc của zone, ví dụ {{example.com}}. Theo RFC 1034/1912, một tên có CNAME thì **không được** có bất kỳ bản ghi nào khác cùng tên, vì CNAME nghĩa là "tên này chỉ là bí danh của tên kia". Nhưng apex **bắt buộc** có bản ghi NS (Name Server - máy chủ DNS có thẩm quyền) và SOA (Start of Authority - thông tin quản trị zone). Nếu bạn đặt CNAME ở apex, nó sẽ xung đột với NS/SOA; resolver có thể trả {{SERVFAIL}} hoặc hành vi không xác định, làm cả website và email (MX) có nguy cơ hỏng. Vì vậy:
- Apex: dùng **Alias A/AAAA** trỏ tới ALB/CloudFront (hoặc A tĩnh nếu đích là IP cố định).
- Subdomain như {{www}} hoặc {{api}}: dùng CNAME (hoặc Alias). Thông lệ: Alias apex -> ALB, CNAME {{www}} -> apex hoặc cùng ALB.

~~~seq
title: CNAME tại apex gây xung đột
actors: Resolver | Route53 | ALB
Resolver -> Route53: Hỏi A cho example.com
note Route53: apex có NS, SOA; nếu thêm CNAME -> vi phạm RFC
Route53 --> Resolver: SERVFAIL hoặc đáp án lỗi
Resolver -> Route53: Hỏi A cho www.example.com (CNAME hợp lệ)
Route53 --> Resolver: www -> ALB DNS name
Resolver -> ALB: Kết nối IP ALB
ALB --> Resolver: Phản hồi HTTP
~~~

### TTL ảnh hưởng thế nào khi cutover
TTL (giây) là "thời hạn giữ" câu trả lời trong cache. Cutover DNS là đổi bản ghi để trỏ sang hệ thống mới (ví dụ ALB mới, region mới). Cơ chế từng bước:
1. **Trước cutover 24-48 giờ**: hạ TTL bản ghi liên quan xuống 60-300s. Phải làm sớm hơn TTL cũ (nếu TTL cũ là 86400s = 24h, phải hạ trước ít nhất 24h để cache cũ hết hạn).
2. **Cutover**: đổi giá trị bản ghi (IP mới hoặc đích Alias mới).
3. **Lan truyền**: resolver nào cache hết hạn sẽ hỏi lại và nhận giá trị mới. Thời gian thực tế xấp xỉ "TTL cũ còn sót + TTL mới". Lưu ý: một số ISP/thiết bị áp TTL tối thiểu (ví dụ 300s) dù bạn đặt 60s.
4. **Sau ổn định (vài giờ đến 1 ngày)**: nâng TTL lên 3600-86400s để giảm số truy vấn DNS (Route 53 tính phí theo truy vấn, trừ Alias tới một số tài nguyên AWS) và giảm tải.
Alias có TTL do AWS quản lý (thường 60s với ALB/CloudFront) nên cutover qua Alias thường nhanh và ít phụ thuộc TTL bạn đặt.

### Ví dụ đời thực
Hệ thống ngân hàng chuyển frontend từ on-prem (A record {{203.0.113.10}}, TTL 86400s) sang CloudFront + ALB trên AWS. Lưu lượng ~2.000 req/s giờ cao điểm, domain {{ibank.example.com}} (subdomain) và {{example.com}} (apex). Kế hoạch:
- T-48h: hạ TTL cả apex và subdomain từ 86400 xuống 60s; dùng {{dig ibank.example.com +trace}} kiểm tra resolver nhận TTL mới.
- T-0 (02:00, traffic thấp ~200 req/s): đổi apex thành Alias A -> CloudFront; đổi {{ibank}} CNAME -> CloudFront. Giữ hệ cũ chạy song song 2 giờ.
- Quan sát: p95 latency giảm từ 420ms xuống 180ms nhờ edge cache; khoảng 5% traffic (ISP cache cứng) còn vào hệ cũ trong 10 phút đầu - chấp nhận được vì hai hệ cùng đọc DB. Sau 2 giờ không còn traffic cũ -> tắt on-prem.
- Kết quả: cutover không gián đoạn, rollback chỉ cần đổi bản ghi về (nhờ TTL 60s, phần lớn client quay lại trong 1-3 phút).

### Pitfall production
- Quên hạ TTL **trước** cutover: client giữ IP cũ suốt TTL cũ, một phần user vào hệ mới, một phần hệ cũ - rất khó debug.
- Quên chuỗi CNAME/Alias phụ thuộc ({{www}} -> apex, apex -> ALB mới): đổi thiếu một mắt xích.
- Đặt CNAME ở apex theo thói quen của DNS provider khác: một số provider "làm phẳng" CNAME (CNAME flattening) nhưng đây không phải hành vi chuẩn; trên Route 53 dùng Alias.
- MX/TXT đặt sai khi đổi zone: email ngừng nhận - luôn kiểm tra MX, SPF, DKIM sau cutover.

### Trả lời mẫu khi phỏng vấn
"DNS trên Route 53 có A/AAAA trỏ tên tới IP, CNAME trỏ tên tới tên khác, MX cho mail, TXT cho xác thực, và Alias là bản ghi đặc thù AWS trỏ tới tài nguyên như ALB hay CloudFront. Em không đặt CNAME ở apex vì theo RFC, một tên có CNAME thì không được có bản ghi khác, trong khi apex bắt buộc có NS và SOA nên sẽ xung đột gây SERVFAIL; giải pháp là dùng Alias A/AAAA ở apex. Về TTL, đó là thời gian resolver cache bản ghi. Khi cutover em hạ TTL xuống 60-300 giây từ 24-48 giờ trước để cache cũ hết hạn, rồi mới đổi bản ghi; sau khi ổn định em nâng TTL lại để giảm truy vấn và chi phí. Thực tế có ISP cache cứng nên em luôn giữ hệ cũ chạy song song một lúc và xem đây là điểm rollback nhanh nhất - chỉ cần đổi bản ghi ngược lại."

> Senior tip: Trước mọi cutover DNS, ghi lại giá trị và TTL hiện tại, dùng {{dig +trace}} kiểm tra propagation, và giữ đường rollback (hệ cũ còn chạy) trong vài giờ. Với ngân hàng, DNS là nút rollback nhanh nhất nhưng cũng dễ gây sự cố dây chuyền nếu quên MX/TXT.`,
  follow: ['Khác biệt giữa weighted, latency, failover routing policy của Route 53?', 'Health check của Route 53 hoạt động thế nào và khi nào failover?', 'Khi migrate domain từ DNS on-prem sang Route 53, làm theo thứ tự nào để không downtime?'],
  tags: ['DNS', 'Route53', 'Alias', 'TTL', 'cutover']
},
{
  id: 'aws-032',
  topic: 'aws',
  level: 'senior',
  q: 'Request qua ALB trả về HTTP 400 trong khi backend vẫn sống và traffic lớn. Nguyên nhân nào, và phân biệt ALB tự trả lời với target trả lời bằng metric và access log thế nào?',
  a: `**Tóm tắt:** HTTP 400 qua ALB (Application Load Balancer - bộ cân bằng tải tầng ứng dụng HTTP/HTTPS của AWS) có thể do ALB tự từ chối (request/header sai chuẩn, Host header bất thường, header/URI quá lớn, cơ chế chống HTTP desync chặn) hoặc do target (ứng dụng backend, ví dụ Spring Boot) trả 400 (validate lỗi, JSON sai). Phân biệt bằng hai metric CloudWatch: {{HTTPCode_ELB_4XX_Count}} (ALB tự sinh) và {{HTTPCode_Target_4XX_Count}} (target trả), kết hợp ALB access log để xem {{elb_status_code}} và {{target_status_code}}.

### Cái gì và vì sao phải phân biệt hai nguồn 400
- **ALB (tầng 7)** nhận HTTP từ client, kiểm tra tính hợp lệ cơ bản, rồi chuyển tiếp tới target (EC2/ECS/IP). Nếu request vi phạm quy tắc HTTP hoặc giới hạn của ALB, ALB trả lỗi **mà không gọi target**.
- **Target** là ứng dụng của bạn (Spring Boot). Nếu request tới được app nhưng dữ liệu sai (thiếu field, JSON lỗi cú pháp, CSRF token sai), app trả 400.
Phân biệt đúng nguồn quyết định hướng xử lý: lỗi ở edge/client/WAF hay lỗi ở code/validate. Nhầm hướng sẽ tốn hàng giờ soi log app trong khi request chưa bao giờ tới app.

~~~seq
title: Luồng request và điểm phát sinh 400
actors: Client | ALB | WAF | SpringBoot
Client -> ALB: HTTP request
note ALB: Kiểm tra header, Host, size, desync
ALB --> Client: 400 (ELB-side) nếu vi phạm
ALB -> SpringBoot: Forward nếu hợp lệ
SpringBoot --> Client: 400 (Target-side) nếu validate lỗi
~~~

### Nguyên nhân ALB tự trả 400 (ELB-side)
- **Header không hợp lệ**: ký tự điều khiển, xuống dòng trong header, định dạng sai. Đây cũng liên quan tấn công HTTP request smuggling.
- **HTTP desync mitigation**: ALB phát hiện request mơ hồ (ví dụ vừa có {{Content-Length}} vừa có {{Transfer-Encoding}} theo cách nguy hiểm) và chặn để an toàn.
- **Vượt giới hạn kích thước**: tổng header thường giới hạn ~16 KB, URI ~16 KB (theo tài liệu ALB; luôn kiểm tra giới hạn hiện hành). Cookie/JWT quá lớn là nguyên nhân hay gặp.
- **Host header** thiếu hoặc không khớp quy tắc routing mà cấu hình yêu cầu chặt.
- **Method/phiên bản HTTP** không hỗ trợ trong ngữ cảnh nhất định.

### Nguyên nhân target trả 400 (Target-side)
- Spring {{@Valid}} / Bean Validation thất bại, {{@RequestBody}} parse JSON lỗi, enum không khớp.
- Thiếu {{Content-Type: application/json}} khi API yêu cầu.
- CSRF token sai (ứng dụng web truyền thống), chữ ký request sai (API có HMAC).

### Phân biệt bằng metric và access log
1. **CloudWatch metrics** (đặt alarm sớm):
   - {{HTTPCode_ELB_4XX_Count}}: số 4xx ALB tự sinh. Tăng đột biến, target 4xx không đổi -> vấn đề ở edge/request.
   - {{HTTPCode_Target_4XX_Count}}: số 4xx target trả. Tăng -> nhìn vào validate/log app, có thể do client mới deploy hoặc dữ liệu bẩn.
   - So sánh hai đường trên cùng khung thời gian (1 phút) để khoanh vùng trong ~30 giây.
2. **ALB access log** (lưu S3, có độ trễ vài phút): mỗi dòng có {{elb_status_code}} và {{target_status_code}}. Nếu {{target_status_code}} là {{-}} (hoặc không có target) nghĩa là ALB không forward -> ELB-side. Lọc theo thời điểm, {{client:port}}, {{request_url}}, {{user_agent}} để tái hiện.
3. **Truy vết ứng dụng**: nếu là target 400, tìm {{traceId/requestId}} trong log Spring để xem exception ({{MethodArgumentNotValidException}}, {{HttpMessageNotReadableException}}).

### Ví dụ đời thực
Ứng dụng thương mại điện tử (Spring Boot trên ECS, sau ALB, ~1.200 req/s) sau khi mobile app phát hành phiên bản mới, dashboard báo 400 tăng từ 0,2% lên 6% trong 10 phút. Cách xử lý:
- Bước 1: CloudWatch cho thấy {{HTTPCode_ELB_4XX_Count}} tăng gấp 30 lần, {{HTTPCode_Target_4XX_Count}} gần như phẳng -> khoanh vùng ALB-side.
- Bước 2: ALB access log cho thấy {{target_status_code}} = {{-}}, {{elb_status_code}} = 400, tập trung vào một {{User-Agent}} của app mới; header {{Authorization}} (JWT) dài bất thường.
- Bước 3: Đo kích thước header: ~18 KB do JWT nhúng quá nhiều claim + cookie phiên chồng thêm -> vượt giới hạn header của ALB.
- Xử lý: backend rút gọn claim JWT (chỉ giữ {{sub, roles, exp}}), chuyển profile sang gọi API; phía client bỏ cookie dư thừa. Tạm thời bật tính năng phù hợp phía app (giảm header) và theo dõi; sau 20 phút tỷ lệ 400 về 0,25%. Bài học: thêm kiểm thử kích thước header trong CI cho mobile.

### Pitfall production
- Cookie tích lũy (tracking, A/B test) làm header phình to -> 400 ngẫu nhiên theo người dùng.
- Tái hiện bằng {{curl}} tối giản nhưng quên gửi header "bẩn" thật -> không reproduce.
- ALB access log trễ ~5 phút: khi incident dùng metric trước, log sau để xác nhận.
- Có WAF (Web Application Firewall) gắn ALB: WAF có thể trả 403/400 theo rule; kiểm tra log WAF song song.

### Trả lời mẫu khi phỏng vấn
"Khi ALB trả HTTP 400, em tách hai khả năng: ALB tự từ chối hoặc target ứng dụng trả về. ALB-side thường do header/request sai chuẩn, vượt giới hạn kích thước header/URI, Host header bất thường hoặc cơ chế chống HTTP desync chặn request mơ hồ. Target-side thường là lỗi validate hoặc parse JSON trong Spring Boot. Em khoanh vùng nhanh bằng CloudWatch: {{HTTPCode_ELB_4XX_Count}} là lỗi do ALB sinh ra, {{HTTPCode_Target_4XX_Count}} là lỗi target trả; so sánh hai metric trong khung một phút là biết hướng. Sau đó em đọc ALB access log: nếu {{target_status_code}} là dấu gạch ngang thì request không tới backend. Em từng gặp case JWT làm header vượt giới hạn, metric ELB 4xx tăng còn target 4xx phẳng, fix bằng cách rút gọn claim và loại cookie dư thừa."

> Senior tip: Luôn bật ALB access log và đặt alarm cho {{HTTPCode_ELB_4XX_Count}} lẫn {{HTTPCode_Target_4XX_Count}}. Khi sự cố, 30 giây đầu nhìn hai metric để biết "lỗi ở cửa" hay "lỗi ở nhà", tránh điều tra sai tầng.`,
  follow: ['ALB trả 502/503/504 khác nhau thế nào và nguyên nhân là gì?', 'Cấu hình connection draining và deregistration delay thế nào?', 'Khi nào dùng NLB thay ALB (TCP/UDP, static IP, PrivateLink)?'],
  tags: ['ALB', 'HTTP400', 'desync', 'CloudWatch', 'access-log', 'troubleshooting']
},
{
  id: 'aws-033',
  topic: 'aws',
  level: 'senior',
  q: 'Chuyển dữ liệu giữa các region: S3 Cross-Region Replication, chi phí data transfer, và các lựa chọn cho DB (cross-region read replica, Aurora Global Database, DMS). Bạn chọn thế nào?',
  a: `**Tóm tắt:** Với object, dùng **S3 Replication** (Cross-Region Replication, cần bật versioning; có thể bật **Replication Time Control** để cam kết 99,99% object trong 15 phút). Với database: **cross-region read replica** (RDS) cho đọc gần người dùng và DR đơn giản; **Aurora Global Database** cho DR với độ trễ replication thường dưới 1 giây và failover nhanh; **DMS** khi cần chuyển đổi, lọc dữ liệu hoặc khác engine. Luôn tính **chi phí data transfer liên vùng** (tính theo GB, nhân với số lần sao chép) vì nó thường là khoản bất ngờ nhất trên hoá đơn.

### S3 Replication hoạt động thế nào
- Cần **versioning** ở cả bucket nguồn và đích; replication chạy bất đồng bộ cho object **mới** sau khi bật (object cũ dùng **S3 Batch Replication**).
- Có thể đổi storage class ở đích (ví dụ Glacier cho bản DR), đổi owner, sao chép sang tài khoản khác (tốt cho bảo vệ khỏi xoá do tài khoản nguồn bị chiếm).
- **Delete marker** mặc định **không** được sao chép (cấu hình được); xoá theo version thì không bao giờ được sao chép — nhờ vậy xoá nhầm ở nguồn không tự lan sang đích, trừ khi bạn chủ động bật.
- Object mã hoá SSE-KMS cần quyền với khoá KMS ở region đích.

### Database giữa các region
| Lựa chọn | Độ trễ sao chép | Failover | Khi dùng |
|---|---|---|---|
| RDS cross-region read replica | Vài giây (async) | Promote thủ công thành DB độc lập | Đọc gần người dùng, DR đơn giản |
| Aurora Global Database | Thường dưới 1 giây (sao chép ở tầng storage) | Managed failover (không mất dữ liệu khi có kế hoạch) hoặc detach-and-promote khi sự cố, RTO cỡ phút | DR nghiêm túc, đọc toàn cầu |
| DMS (full load + CDC) | Giây tới phút | Không phải công cụ failover | Đổi engine, lọc/biến đổi, migration |
| DynamoDB Global Tables | Thường dưới 1 giây | Ghi được ở mọi region (last writer wins) | Dữ liệu key-value đa region |

### Chi phí cần tính
- Data transfer liên vùng tính **mỗi GB** gửi đi (bảng giá thay đổi theo cặp region) — sao chép 5TB/tháng là một khoản đáng kể; cộng thêm phí request và phí RTC nếu bật.
- Aurora Global Database tính thêm phí I/O replication và instance ở region phụ.
- Giảm chi phí: chỉ sao chép prefix/tag cần thiết, nén, đưa bản DR vào storage class rẻ.

### Ví dụ đời thực
Một công ty bảo hiểm cần RPO dưới 1 phút và RTO dưới 1 giờ cho DR sang region khác. Ban đầu dùng snapshot RDS sao chép mỗi 6 giờ (RPO 6 giờ — không đạt). Chuyển sang Aurora Global Database cho DB chính (lag đo được 300–800ms), S3 Replication có RTC cho hồ sơ scan, sao chép sang **tài khoản DR riêng** với Object Lock để chống ransomware. Diễn tập failover hằng quý: RTO thực tế 22 phút (phần lớn là đổi DNS và khởi động ứng dụng ở region phụ). Chi phí data transfer liên vùng khoảng 1.100 USD/tháng — được duyệt vì thấp hơn nhiều so với rủi ro.

### Pitfall
- Quên rằng replication không sao chép object có sẵn trước khi bật.
- Bật sao chép delete marker mà không có Object Lock → xoá nhầm lan sang bản DR.
- Không đo replication lag → nghĩ RPO là 1 giây nhưng thực tế là 10 phút lúc cao điểm.
- Chỉ sao chép dữ liệu mà không chuẩn bị hạ tầng, cấu hình, secret ở region phụ.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn theo RPO, RTO và loại dữ liệu. Với object trên S3, tôi dùng S3 Replication, cần versioning, có thể bật Replication Time Control để có cam kết thời gian, sao chép sang tài khoản khác và bật Object Lock ở đích để chống xoá nhầm hoặc ransomware; object có sẵn thì dùng Batch Replication. Với database: RDS cross-region read replica cho đọc gần người dùng và DR đơn giản, phải promote thủ công; Aurora Global Database khi cần DR nghiêm túc, lag thường dưới một giây và có managed failover; DMS khi cần đổi engine hoặc biến đổi dữ liệu. Tôi luôn tính chi phí data transfer liên vùng vì nó tính theo từng GB, đo replication lag và cảnh báo, và diễn tập failover định kỳ để biết RTO thật chứ không phải RTO trên giấy."

> Senior tip: DR không chỉ là dữ liệu. Danh sách kiểm tra của tôi luôn có: AMI/image, secret và khoá KMS ở region phụ, quota dịch vụ, DNS, và runbook đã diễn tập. Thiếu một mục là RTO tăng từ phút thành giờ.`,
  follow: ['S3 CRR với delete marker và versioning: rủi ro xoá nhầm lan sang region khác?', 'Aurora Global Database: managed failover và detach-and-promote khác nhau thế nào?', 'Bạn đo replication lag và đặt cảnh báo cho DB cross-region ra sao?'],
  tags: ['S3', 'CRR', 'Aurora-Global', 'DMS', 'cross-region', 'DR', 'replication']
},
{
  id: 'aws-034',
  topic: 'aws',
  level: 'senior',
  q: 'Kết nối private từ on-premise lên AWS: Site-to-Site VPN vs Direct Connect (private/transit VIF, DX + VPN backup). So sánh thời gian triển khai, băng thông, độ trễ, chi phí.',
  a: `**Tóm tắt:** Để kết nối private từ on-premise (hạ tầng tại chỗ, ví dụ data center công ty) lên AWS, hai lựa chọn chính là Site-to-Site VPN (mã hóa IPsec qua Internet, triển khai nhanh, rẻ nhưng băng thông/độ trễ biến động) và Direct Connect - DX (đường truyền riêng vật lý, ổn định, băng thông lớn, độ trễ thấp nhưng triển khai tuần-tháng và chi phí cao). Thực tế production thường dùng DX làm đường chính và VPN làm dự phòng (failover qua BGP - giao thức định tuyến động).

### Cái gì: các thành phần chính
- **VPC (Virtual Private Cloud)**: mạng riêng ảo trên AWS.
- **VPN Site-to-Site**: hai đầu nối IPsec tunnel: phía AWS là VGW (Virtual Private Gateway) hoặc gắn vào TGW (Transit Gateway - bộ định tuyến trung tâm nối nhiều VPC/on-prem); phía khách hàng là CGW (Customer Gateway - thiết bị/địa chỉ public của bạn). Mỗi "kết nối VPN" thường có 2 tunnel để HA.
- **Direct Connect (DX)**: cáp/port vật lý tại DX location. Trên đó tạo **VIF (Virtual Interface)**:
  - **Private VIF**: truy cập tài nguyên private trong VPC (qua VGW hoặc Direct Connect Gateway gắn VGW).
  - **Transit VIF**: gắn Direct Connect Gateway tới TGW để đi tới nhiều VPC/account.
  - **Public VIF**: truy cập endpoint public của dịch vụ AWS (S3, DynamoDB public endpoint) qua mạng AWS, không qua Internet.
- **BGP (Border Gateway Protocol)**: trao đổi route tự động; khi một đường hỏng, route chuyển sang đường còn lại.

~~~seq
title: DX chính, VPN dự phòng
actors: OnPrem | DXRouter | TGW | VPCApp
OnPrem -> DXRouter: BGP advertise route nội bộ
DXRouter -> TGW: Private/Transit VIF (đường chính)
TGW -> VPCApp: Route tới subnet private
note OnPrem: Khi DX down, BGP failover sang VPN tunnel
OnPrem -> TGW: VPN IPsec qua Internet (dự phòng)
TGW -> VPCApp: Traffic tiếp tục đi
~~~

### So sánh chi tiết (giá trị tham khảo, cần kiểm tra bảng giá hiện hành theo region)
| Tiêu chí | Site-to-Site VPN | Direct Connect |
|---|---|---|
| Triển khai | Phút đến vài giờ (có thiết bị sẵn) | 2-10 tuần (đặt circuit, cross-connect, cấu hình) |
| Băng thông | ~1,25 Gbps mỗi tunnel; gộp nhiều tunnel phức tạp | 1/10/100 Gbps (dedicated) hoặc hosted 50 Mbps-10 Gbps |
| Độ trễ | Biến động, phụ thuộc Internet, có jitter | Ổn định, thấp hơn, có SLA đường truyền |
| Mã hóa | IPsec mặc định | Không mã hóa mặc định; có thể dùng MACsec (L2) hoặc IPsec over DX |
| Chi phí | Theo giờ (~0,05 USD/giờ/tunnel) + data transfer | Port-hour + data transfer out (thường rẻ hơn Internet/GB) + phí circuit nhà mạng |
| Độ tin cậy | Phụ thuộc Internet | Cao hơn; vẫn cần thiết kế HA (2 DX/2 location nếu critical) |

### Vì sao chọn thế nào (quyết định theo nhu cầu)
- **Cần nhanh, tạm thời, POC, dev/test, chi phí thấp**: VPN là hợp lý. Có thể dựng trong ngày.
- **Production, ngân hàng, latency nhạy cảm, truyền dữ liệu lớn liên tục (batch, replication DB)**: DX làm chính + VPN backup. DX cho chất lượng; VPN đảm bảo còn đường khi DX bảo trì/lỗi.
- **Nhiều VPC/multi-account**: dùng Transit VIF + TGW để tránh tạo nhiều Private VIF/VGW rời rạc.

### Ví dụ đời thực
Ngân hàng có core on-prem, chuyển dần service sang AWS (3 VPC: prod, non-prod, shared). Yêu cầu: replication DB on-prem -> RDS liên tục ~80 Mbps giờ cao điểm, API nội bộ p95 < 40 ms giữa DC và AWS, không gián đoạn khi một đường lỗi.
- Giai đoạn 1 (tuần 1): dựng VPN Site-to-Site 2 tunnel qua TGW để có kết nối ngay, chạy thử migration batch đêm (tốn ~6 giờ cho 120 GB qua VPN, độ trễ dao động 35-90 ms) - chấp nhận cho dev/test.
- Giai đoạn 2 (tuần 6): DX hosted 1 Gbps tại DX location, Transit VIF vào TGW; cấu hình BGP ưu tiên DX (local preference/AS path). VPN giữ làm backup, health check BGP.
- Diễn tập failover: tắt cổng DX, traffic chuyển sang VPN trong ~45 giây, p95 tăng lên 75 ms nhưng ứng dụng vẫn hoạt động; BGP hội tụ lại về DX trong ~60 giây khi bật lại.
- Kết quả: batch replication ổn định, chi phí data transfer giảm so với kéo qua Internet; đáp ứng kiểm toán (đường riêng + mã hóa IPsec trên VPN backup; cân nhắc MACsec trên DX theo chính sách).

### Pitfall production
- **MTU/fragmentation trên VPN**: IPsec thêm overhead, gói lớn có thể phân mảnh gây chậm/mất gói. Đặt MTU ~1400-1436 hoặc bật TCP MSS clamping; kiểm tra bằng ping với cờ DF.
- **DX không mã hóa mặc định**: ngân hàng thường yêu cầu MACsec hoặc IPsec over DX; không được giả định "đường riêng = an toàn tuyệt đối" nếu chính sách yêu cầu mã hóa.
- **BGP failover không như ý**: quảng bá route sai, prefix dài/ngắn khác nhau làm đường backup không được chọn; phải test failover thật (rút cáp/bật-tắt) trước go-live.
- **Băng thông VPN backup không đủ**: DX 1 Gbps nhưng VPN backup chỉ chịu ~200 Mbps thực tế -> khi failover, hệ thống nghẽn. Cần tính capacity backup cho lưu lượng tối thiểu sống sót.
- **Hosted DX phụ thuộc partner**: công suất chia sẻ; xác nhận SLA và quy trình sự cố.

### Trả lời mẫu khi phỏng vấn
"Khi kết nối private từ on-prem lên AWS, em cân nhắc Site-to-Site VPN và Direct Connect. VPN chạy IPsec qua Internet, dựng được trong vài giờ, chi phí thấp nhưng băng thông và độ trễ biến động. Direct Connect là đường vật lý riêng, độ trễ ổn định, băng thông lớn và có SLA, nhưng mất vài tuần triển khai và chi phí cao hơn; DX không mã hóa mặc định nên với ngân hàng em xem thêm MACsec hoặc IPsec. Thực tế em hay chọn DX làm đường chính và VPN làm dự phòng, dùng BGP để failover tự động. Khi thiết kế em chú ý MTU để tránh fragmentation trên VPN, kiểm tra capacity đường backup, và luôn diễn tập failover thật trước go-live vì BGP hội tụ có thể mất vài chục giây và ứng dụng phải chịu được."

> Senior tip: Đừng chỉ vẽ sơ đồ HA - hãy diễn tập rút đường chính. Với ngân hàng, yêu cầu dual DX ở hai location khác nhau + VPN backup là phổ biến, nhưng giá trị thật nằm ở việc đã test failover và đo được thời gian hội tụ BGP.`,
  follow: ['BGP route advertisement và AS path prepending dùng để ưu tiên DX thế nào?', 'Khi DX down, VPN backup có đủ băng thông không? Lên kế hoạch capacity ra sao?', 'Direct Connect Gateway dùng để kết nối nhiều region thế nào?'],
  tags: ['VPN', 'DirectConnect', 'BGP', 'hybrid', 'networking', 'banking']
},
{
  id: 'aws-035',
  topic: 'aws',
  level: 'senior',
  q: 'Kết nối nhiều VPC: VPC peering (không transitive) vs Transit Gateway (route table, phân vùng) vs PrivateLink. CIDR trùng nhau thì xử lý thế nào?',
  a: `**Tóm tắt:** **VPC peering** kết nối trực tiếp hai VPC, rẻ, không có băng thông giới hạn riêng nhưng **không transitive** (A–B và B–C không cho A tới C) nên với nhiều VPC thành mạng lưới khó quản lý. **Transit Gateway (TGW)** là "router trung tâm" kiểu hub-and-spoke, có **route table** để phân vùng (prod không thấy non-prod), hợp khi có từ vài chục VPC trở lên và kết nối on-prem. **PrivateLink** chia sẻ **một dịch vụ cụ thể** (sau NLB) cho VPC khác qua Interface Endpoint, chỉ một chiều, và **không quan tâm CIDR trùng nhau**.

### So sánh
| Tiêu chí | VPC Peering | Transit Gateway | PrivateLink |
|---|---|---|---|
| Mô hình | Điểm–điểm | Hub-and-spoke | Dịch vụ → người dùng dịch vụ |
| Transitive | Không | Có (theo route table) | Không áp dụng |
| CIDR trùng | Không được | Không được (trong cùng route domain) | Được |
| Chi phí | Chỉ data transfer | Phí mỗi attachment theo giờ + mỗi GB xử lý | Phí endpoint theo giờ + mỗi GB |
| Phạm vi truy cập | Toàn VPC (theo security group) | Toàn VPC (theo route + SG) | Chỉ một dịch vụ |

### Transit Gateway và phân vùng
Mỗi VPC là một attachment; mỗi attachment **liên kết** (associate) với một route table và **lan truyền** (propagate) route của nó vào một hoặc nhiều route table. Ví dụ: route table "prod" chỉ chứa route của các VPC prod và VPC dịch vụ dùng chung; route table "nonprod" tương tự; VPC kiểm tra traffic (firewall) đặt ở giữa nếu cần kiểm soát luồng đông–tây. Kết hợp với **AWS RAM** để chia sẻ TGW cho nhiều tài khoản trong Organization.

### CIDR trùng nhau
- PrivateLink: không cần quan tâm — người dùng thấy dịch vụ qua IP của endpoint trong VPC của họ.
- Nếu buộc phải định tuyến giữa các mạng trùng CIDR: **private NAT gateway** để dịch địa chỉ sang một dải không trùng, hoặc đánh lại IP (tốn kém nhưng dứt điểm).
- Phòng ngừa: quản lý IP tập trung bằng **VPC IPAM**, cấp dải không trùng cho mọi VPC mới.

### Ví dụ đời thực
Một công ty có 38 VPC nối với nhau bằng 120 peering, mỗi lần thêm VPC phải sửa route table ở hàng chục nơi; một lần cấu hình sai khiến môi trường test truy cập được DB production. Chuyển sang Transit Gateway với 3 route table (prod, nonprod, shared), VPC IPAM cho dải mới, và PrivateLink để cung cấp API nội bộ cho hai công ty con có CIDR trùng với mạng chính. Thêm VPC mới còn khoảng 15 phút qua Terraform; kiểm tra đường đi bằng VPC Reachability Analyzer xác nhận không còn đường từ nonprod tới DB prod. Chi phí mạng tăng khoảng 900 USD/tháng do phí xử lý của TGW — chấp nhận để đổi lấy khả năng quản lý và cô lập.

### Pitfall
- Lưới peering chằng chịt với nhiều VPC → khó kiểm soát, dễ mở nhầm đường.
- Một route table TGW cho tất cả → prod và non-prod thấy nhau.
- Cấp CIDR tuỳ tiện → không thể nối mạng sau này.
- Dùng PrivateLink cho nhu cầu cần truy cập toàn mạng (nó chỉ cho một dịch vụ).

### Trả lời mẫu khi phỏng vấn
"Tôi chọn theo số lượng VPC và loại nhu cầu. Vài VPC cần nói chuyện trực tiếp thì VPC peering, đơn giản và rẻ, nhưng không transitive nên số kết nối tăng theo bình phương. Từ vài chục VPC trở lên hoặc có kết nối về on-prem, tôi dùng Transit Gateway làm trung tâm, và dùng route table của nó để phân vùng: prod chỉ thấy prod và các dịch vụ dùng chung, non-prod tách riêng, chia sẻ cho nhiều tài khoản qua RAM. Khi chỉ cần cung cấp một dịch vụ cho VPC khác, nhất là của đơn vị khác hay có CIDR trùng, tôi dùng PrivateLink qua NLB và Interface Endpoint, chỉ lộ đúng dịch vụ đó. CIDR trùng mà phải định tuyến thì dùng private NAT gateway hoặc đánh lại IP; còn phòng ngừa là quản lý IP tập trung bằng VPC IPAM."

> Senior tip: chạy VPC Reachability Analyzer cho các cặp "không bao giờ được nói chuyện" (non-prod → DB prod) như một bài kiểm tra định kỳ trong CI. Thay đổi mạng sai thường im lặng cho tới khi có sự cố bảo mật.`,
  follow: ['Dùng route table của Transit Gateway để tách prod và non-prod thế nào?', 'PrivateLink vs peering: khi nào chọn cái nào để chia sẻ một dịch vụ?', 'VPC Lattice là gì và khác Transit Gateway, PrivateLink ra sao?'],
  tags: ['VPC-peering', 'Transit-Gateway', 'PrivateLink', 'CIDR', 'segmentation', 'networking']
},
{
  id: 'aws-036',
  topic: 'aws',
  level: 'mid',
  q: 'Nhiều EC2/ECS cần dùng chung storage: EFS, FSx, S3 hay EBS Multi-Attach? Khi nào dùng cái nào?',
  a: `**Tóm tắt:** **EFS** là file system NFS dùng chung, co giãn tự động, mount từ nhiều EC2/ECS/EKS/Lambda ở nhiều AZ — hợp cho file dùng chung kiểu Linux. **FSx** là file system chuyên dụng: **FSx for Windows** (SMB, Active Directory), **FSx for Lustre** (hiệu năng rất cao cho HPC/ML, liên kết với S3), **FSx for NetApp ONTAP / OpenZFS** (tính năng doanh nghiệp, snapshot, NFS/SMB). **S3** là object storage — không phải file system, nhưng là lựa chọn rẻ và bền nhất khi ứng dụng đọc/ghi cả object qua API. **EBS Multi-Attach** chỉ cho ứng dụng tự quản lý ghi đồng thời (cluster file system), hiếm khi đúng cho ứng dụng web.

### Chọn nhanh
| Nhu cầu | Lựa chọn |
|---|---|
| Nhiều container Linux cùng đọc/ghi thư mục chung (upload tạm, cấu hình, nội dung CMS) | EFS |
| Ứng dụng Windows, chia sẻ SMB, tích hợp AD | FSx for Windows File Server |
| Huấn luyện ML, xử lý dữ liệu lớn cần hàng trăm GB/s | FSx for Lustre (liên kết S3) |
| Di chuyển NAS doanh nghiệp, cần snapshot, clone, đa giao thức | FSx for NetApp ONTAP |
| Lưu file người dùng, ảnh, tài liệu, backup, data lake | S3 |
| Cơ sở dữ liệu / ứng dụng cluster tự điều phối ghi | EBS (Multi-Attach chỉ với io1/io2 và file system cluster) |

### EFS cần biết
- Storage class Standard và Infrequent Access/Archive với lifecycle tự chuyển file ít dùng sang lớp rẻ.
- Throughput: **Elastic** (tự co giãn theo nhu cầu, khuyến nghị cho đa số), **Bursting** (theo dung lượng lưu trữ, dễ hết credit với file system nhỏ), **Provisioned** (đặt trước).
- Độ trễ cao hơn EBS (mili giây mỗi thao tác) → không hợp cho DB hay nhiều file nhỏ thao tác dày đặc.
- Với ECS/EKS: mount qua EFS CSI driver hoặc cấu hình volume của task; dùng **access point** để giới hạn thư mục và UID/GID cho từng ứng dụng, cấp quyền bằng IAM.

### Ví dụ đời thực
Một CMS chạy 6 container cần thư mục ảnh dùng chung, ban đầu dùng EFS chế độ Bursting với 20GB dữ liệu: throughput nền rất thấp, hết burst credit vào giờ cao điểm → trang tải ảnh 5–10 giây. Đổi EFS sang Elastic throughput giải quyết ngay, nhưng phân tích kỹ hơn cho thấy ảnh chỉ được ghi một lần và đọc nhiều: chuyển ảnh sang **S3 + CloudFront**, ứng dụng upload qua presigned URL; EFS chỉ còn giữ vài file cấu hình. Chi phí storage giảm khoảng 70%, ảnh tải dưới 100ms qua CDN, các container không còn phụ thuộc mount dùng chung khi scale.

### Pitfall
- Dùng EFS cho DB hoặc build có hàng triệu file nhỏ → rất chậm.
- EFS Bursting với dung lượng nhỏ → hết credit.
- Coi S3 như file system (đổi tên thư mục là sao chép từng object; không có khoá file).
- EBS Multi-Attach với ext4/xfs thường → hỏng dữ liệu khi nhiều máy cùng ghi.

### Trả lời mẫu khi phỏng vấn
"Tôi xuất phát từ cách ứng dụng truy cập dữ liệu. Nếu nhiều container Linux cần đọc ghi một thư mục chung như file system thật, tôi dùng EFS: NFS, mount từ nhiều AZ, tự co giãn, với chế độ throughput Elastic và access point để giới hạn từng ứng dụng; lưu ý độ trễ cao hơn ổ đĩa, không hợp cho DB. Ứng dụng Windows cần SMB và AD thì FSx for Windows; xử lý dữ liệu lớn cần throughput cực cao thì FSx for Lustre; chuyển NAS doanh nghiệp thì FSx for NetApp ONTAP. Còn nếu dữ liệu là file người dùng như ảnh, tài liệu, ghi một lần đọc nhiều, tôi ưu tiên S3, thường kèm CloudFront và presigned URL, vì rẻ, bền và không ràng buộc container vào một mount chung. EBS Multi-Attach chỉ dành cho phần mềm cluster tự điều phối ghi."

> Senior tip: trước khi chọn file system dùng chung, hỏi "ứng dụng có thật sự cần ngữ nghĩa file system không?". Rất nhiều trường hợp chỉ cần object storage, và bỏ được mount dùng chung giúp kiến trúc đơn giản và dễ scale hơn hẳn.`,
  follow: ['EFS throughput mode Bursting, Elastic và Provisioned khác nhau thế nào?', 'Mount EFS vào ECS task và cấp quyền IAM ra sao?', 'Khi nào dùng EBS Multi-Attach thay vì EFS?'],
  tags: ['EFS', 'FSx', 'S3', 'storage', 'NFS', 'ECS']
},
{
  id: 'aws-037',
  topic: 'aws',
  level: 'senior',
  q: 'Dựng môi trường cho một ứng dụng đáp ứng HA và có backup: từ VPC, subnet đa AZ, ALB, ECS/EKS, RDS Multi-AZ, AWS Backup, secrets, logging. Liệt kê thứ tự triển khai và vì sao.',
  a: `**Tóm tắt:** Tôi dựng theo thứ tự **nền móng → dữ liệu → tính toán → lối vào → vận hành**: tài khoản và IAM, VPC đa AZ (subnet public/private/data), security group và endpoint; KMS, secret; RDS Multi-AZ và AWS Backup; ECS/EKS chạy trên subnet private ở ít nhất 2–3 AZ; ALB và WAF; DNS và chứng chỉ; cuối cùng là logging, metric, cảnh báo và diễn tập. Thứ tự này đảm bảo mỗi lớp chỉ phụ thuộc vào lớp đã có, và mọi thứ được tạo bằng **Infrastructure as Code** (Terraform/CDK) để dựng lại được.

### Thứ tự triển khai
1. **Tài khoản và quản trị**: tài khoản riêng cho prod, SCP cơ bản, IAM Identity Center, CloudTrail bật cho mọi region.
2. **Mạng**: VPC với 3 AZ; subnet public (ALB, NAT), private (ứng dụng), data (DB, không có route ra Internet); NAT gateway mỗi AZ (tránh một AZ hỏng kéo theo mất mạng ra ngoài); VPC endpoint cho S3, ECR, Secrets Manager, CloudWatch (giảm phí NAT, không ra Internet).
3. **Mã hoá và secret**: khoá KMS theo mục đích, Secrets Manager cho mật khẩu DB (có rotation).
4. **Dữ liệu**: RDS/Aurora **Multi-AZ** (bản standby đồng bộ ở AZ khác, failover tự động 1–2 phút), parameter group, mã hoá, deletion protection; **AWS Backup** với backup plan, vault mã hoá, **Vault Lock** chống xoá, sao chép sang region/tài khoản khác.
5. **Tính toán**: ECS Fargate hoặc EKS trải trên các AZ, autoscaling, task role riêng từng service, image từ ECR có quét lỗ hổng.
6. **Lối vào**: ALB đa AZ, health check đúng (endpoint readiness nhẹ), HTTPS với ACM, WAF; Route 53.
7. **Vận hành**: log tập trung (CloudWatch Logs/OpenSearch), metric và alarm (5xx, latency, DB CPU, replica lag), dashboard, runbook; **diễn tập** failover DB và khôi phục từ backup.

### Vì sao thứ tự này
Mạng và quyền là thứ khó thay đổi nhất về sau (đổi CIDR hay cấu trúc subnet gần như phải dựng lại), nên làm đúng trước. Dữ liệu cần mã hoá và backup **từ ngày đầu** — bật mã hoá cho RDS đã tồn tại phải qua snapshot và khôi phục. Lối vào để sau cùng để không mở ra Internet khi các lớp bên dưới chưa sẵn sàng.

### Ví dụ đời thực
Một startup dựng hệ thống trên một AZ, một NAT gateway, RDS Single-AZ, backup là snapshot tự động 7 ngày trong cùng tài khoản. Sự cố AZ năm đó làm hệ thống ngừng 3 giờ; một lần khác, script dọn dẹp xoá nhầm DB và snapshot tự động đi theo. Dựng lại theo thứ tự trên bằng Terraform: 3 AZ, NAT mỗi AZ, Aurora Multi-AZ, AWS Backup giữ 35 ngày với Vault Lock và bản sao ở tài khoản DR. Diễn tập: failover DB mất 40 giây với lỗi ứng dụng dưới 1 phút; khôi phục toàn bộ DB từ backup sang tài khoản DR mất 55 phút — được ghi vào runbook.

### Pitfall
- Một NAT gateway cho mọi AZ → mất AZ đó là mất đường ra ngoài.
- Health check ALB gọi endpoint kiểm tra cả DB → DB chậm là ALB đánh dấu mọi target hỏng.
- Backup cùng tài khoản, không khoá → bị xoá cùng lúc với dữ liệu.
- Tạo tay trên console → không dựng lại được khi cần.

### Trả lời mẫu khi phỏng vấn
"Tôi dựng theo thứ tự nền móng trước. Đầu tiên là tài khoản, IAM và CloudTrail. Tiếp theo là VPC trải ba AZ với subnet public cho ALB và NAT, private cho ứng dụng, data cho DB, NAT mỗi AZ và VPC endpoint cho các dịch vụ AWS; mạng làm trước vì về sau rất khó thay đổi. Rồi KMS và Secrets Manager. Sau đó là dữ liệu: RDS hoặc Aurora Multi-AZ có mã hoá, deletion protection, và AWS Backup với Vault Lock, sao chép sang tài khoản hoặc region khác. Tiếp là tính toán: ECS hoặc EKS trên subnet private trải các AZ, có autoscaling và role riêng mỗi service. Sau cùng mới mở lối vào: ALB với health check nhẹ, HTTPS, WAF, Route 53. Mọi thứ bằng Terraform, và kết thúc bằng logging, alarm, runbook cùng diễn tập failover và khôi phục backup."

> Senior tip: backup chỉ đáng tin khi đã khôi phục thử. Tôi đặt lịch AWS Backup **restore testing** (hoặc một job tự viết) khôi phục định kỳ sang môi trường tạm và chạy kiểm tra dữ liệu — và ghi lại thời gian khôi phục thực tế làm RTO.`,
  follow: ['RDS Multi-AZ khác Read Replica thế nào?', 'Thiết kế health check cho ALB thế nào để tránh báo lỗi sai?', 'AWS Backup: retention, Vault Lock, cross-region copy hoạt động ra sao?'],
  tags: ['HA', 'architecture', 'VPC', 'RDS', 'ALB', 'backup', 'IaC', 'banking']
},
{
  id: 'aws-038',
  topic: 'aws',
  level: 'senior',
  q: 'Security Group stateful vs NACL stateless trong sự cố thực tế: ephemeral port bị NACL chặn chiều về, cách debug bằng VPC Flow Logs và Reachability Analyzer.',
  a: `**Tóm tắt:** Security Group (SG - tường lửa gắn vào ENI/tài nguyên, ví dụ EC2) là **stateful** (có nhớ trạng thái kết nối: cho phép chiều đi thì tự cho phép chiều về), còn NACL (Network ACL - tường lửa gắn vào subnet) là **stateless** (không nhớ, phải khai báo rule cả hai chiều). Sự cố kinh điển: NACL cho phép inbound tới server nhưng chặn outbound ephemeral port (cổng tạm, dải 1024-65535) khiến phản hồi không về được -> client timeout dù server đã xử lý. Debug bằng VPC Flow Logs (thấy {{REJECT}}) và VPC Reachability Analyzer (chỉ ra hop/rule chặn).

### Cái gì và vì sao hai lớp này dễ gây nhầm
- **ENI (Elastic Network Interface)**: "card mạng ảo" của tài nguyên trong VPC.
- **Ephemeral port (cổng tạm)**: khi client mở kết nối TCP, hệ điều hành cấp một cổng nguồn tạm (thường 1024-65535; dải có thể khác theo OS) để nhận phản hồi. Ví dụ: client {{10.0.1.20:54321}} -> server {{10.0.2.30:443}}; phản hồi đi ngược {{443 -> 54321}}.
- **Stateful (SG)**: SG ghi nhận connection đã được cho phép; gói phản hồi thuộc connection đó được tự động cho qua, không cần rule outbound/inbound riêng cho chiều về.
- **Stateless (NACL)**: mỗi gói được đánh giá độc lập theo rule inbound/outbound của subnet; không quan tâm gói đó có phải phản hồi hay không.

~~~seq
title: Ephemeral port bị NACL chặn chiều về
actors: Client | SubnetNACL | ServerSG | Server
Client -> SubnetNACL: TCP SYN src 54321 dst 443
SubnetNACL -> ServerSG: Inbound allow 443 OK
ServerSG -> Server: SG stateful cho vào
Server -> ServerSG: SYN-ACK src 443 dst 54321
ServerSG -> SubnetNACL: SG tự cho reply ra
note SubnetNACL: Outbound thiếu rule cho 1024-65535
SubnetNACL --> Client: REJECT - client timeout
~~~

### Cơ chế sự cố ephemeral port
Kịch bản: web server trong subnet private lắng nghe 443. NACL subnet server có inbound allow TCP 443 từ client CIDR, nhưng outbound chỉ allow vài port (ví dụ 443, 53) và **quên** dải ephemeral 1024-65535.
- Client gửi SYN tới 443 -> qua NACL inbound (OK) -> qua SG server (OK, stateful).
- Server trả SYN-ACK/response từ 443 về {{client:54321}} -> SG cho ra (stateful) -> NACL outbound kiểm tra đích 54321, **không khớp rule allow** -> rơi vào rule deny -> {{REJECT}}.
- Kết quả: client thấy timeout hoặc "connection timed out"; đôi khi bắt tay một phần rồi treo. Nếu nhìn từ app server, request có thể đã được nhận/xử lý (tùy thời điểm) nhưng response không về.

Ngược lại cũng xảy ra: server là client đi ra ngoài (gọi API), NACL subnet server cho outbound 443 nhưng inbound không cho ephemeral -> response từ Internet/API không về.

### Debug từng bước
1. **Xác định triệu chứng**: {{curl}} từ client tới server timeout; từ trong cùng subnet hoặc bypass NACL (tạm thời, cẩn thận) có khác không? Kiểm tra SG trước: SG stateful nên hiếm khi là nguyên nhân chiều về.
2. **VPC Flow Logs**: bật cho ENI hoặc subnet (gửi CloudWatch Logs/S3). Tìm bản ghi 5-tuple: {{srcaddr, dstaddr, srcport, dstport, protocol, action}}. Nếu thấy {{REJECT}} với {{dstport}} trong dải 1024-65535 theo chiều phản hồi -> NACL chặn ephemeral. Lưu ý Flow Logs có độ trễ ~5-10 phút và chỉ có metadata, không có payload.
3. **VPC Reachability Analyzer**: tạo path từ ENI nguồn tới ENI đích (port/protocol). Công cụ phân tích cấu hình (SG, NACL, route table, IGW/NAT/TGW) và trả về reachable hay không, kèm thành phần chặn. Không gửi gói thật nên an toàn khi production; nhưng không phát hiện vấn đề runtime (app không listen, OS firewall).
4. **Kiểm tra NACL rule order**: NACL đánh giá theo số rule tăng dần, rule đầu khớp sẽ áp dụng; có rule {{* DENY}} cuối cùng. Một rule DENY đặt sớm có thể chặn trước rule ALLOW.
5. **Kiểm tra route table**: nếu response đi đường khác hoặc thiếu route về CIDR client -> cũng timeout (Flow Logs có thể thấy pattern khác).

### Ví dụ đời thực
Hệ thống nội bộ ngân hàng: service A (subnet app) gọi service B (subnet app khác) qua HTTPS 443, lưu lượng ~300 req/s. Sau thay đổi NACL để "siết bảo mật", tỷ lệ timeout tăng 40%, p99 từ 120 ms lên 8.000 ms (timeout). App log service B cho thấy vẫn nhận request, nhưng service A báo {{Read timed out}}.
- Quan sát CloudWatch: không có thay đổi SG; metric app cho thấy request đến B tăng nhưng response thành công giảm.
- Bật Flow Logs (đã có sẵn) và truy vấn: thấy {{REJECT}} từ subnet B về subnet A, {{srcport=443}}, {{dstport}} rải rác 49152-65535 -> NACL subnet B chặn outbound ephemeral.
- Reachability Analyzer xác nhận path {{ENI A -> ENI B port 443}} reachable chiều đi, nhưng chiều phản hồi bị NACL.
- Khắc phục: thêm rule NACL outbound subnet B cho TCP 1024-65535 tới CIDR subnet A (và ngược lại inbound ephemeral nếu B gọi ra); kiểm thử lại. Tỷ lệ timeout về 0% sau 3 phút.
- Phòng ngừa: chuẩn hóa NACL template, review change qua IaC (Terraform/CDK), test kết nối sau mỗi thay đổi mạng.

### Pitfall production
- Cho rằng "SG đã mở là đủ": SG stateful giúp chiều về, nhưng **NACL vẫn có thể chặn** trước khi gói rời subnet.
- Mở ephemeral quá hẹp: Linux/Windows dùng dải khác nhau; an toàn là 1024-65535 trừ khi có chuẩn nội bộ chặt và kiểm soát OS.
- Dùng NACL để "siết" như SG: NACL stateless khó bảo trì, dễ gây outage; nhiều đội chỉ dùng NACL cho deny cụ thể (chặn IP xấu) và để allow rộng, còn kiểm soát chính bằng SG.
- Flow Logs không thấy gói bị SG chặn? (tùy trường hợp) - kết hợp cả SG rule review và Reachability Analyzer.

### Trả lời mẫu khi phỏng vấn
"Security Group là stateful nên nếu cho phép request đi vào, phản hồi tự được phép đi ra. NACL gắn ở subnet là stateless, phải khai báo rule cả inbound và outbound cho từng chiều. Sự cố em hay gặp là NACL cho inbound tới port 443 nhưng quên outbound dải ephemeral 1024-65535, nên server nhận request nhưng phản hồi về client bị NACL chặn, dẫn tới timeout dù backend vẫn sống. Khi debug em bật VPC Flow Logs để tìm bản ghi REJECT theo 5-tuple và xác định port đích là ephemeral; sau đó dùng Reachability Analyzer để chỉ ra đúng NACL hoặc route table nào chặn. Cách phòng ngừa là chuẩn hóa rule NACL, ưu tiên kiểm soát chi tiết bằng SG, và luôn test kết nối sau thay đổi mạng."

> Senior tip: Với môi trường ngân hàng, nhiều đội giữ NACL gần như allow-all và kiểm soát bằng SG để tránh outage khó debug; nếu compliance bắt buộc NACL, hãy chuẩn hóa template mở ephemeral 1024-65535 có chủ đích và review mọi thay đổi qua IaC + kiểm thử tự động.`,
  follow: ['Khi nào cần dùng NACL thay vì chỉ SG?', 'Định dạng VPC Flow Logs và cách query bằng Athena?', 'Reachability Analyzer khác Network Access Analyzer thế nào?'],
  tags: ['Security-Group', 'NACL', 'Flow-Logs', 'Reachability-Analyzer', 'troubleshooting', 'networking']
},
{
  id: 'aws-039',
  topic: 'aws',
  level: 'lead',
  q: '(lead) Landing zone cho ngân hàng chuyển lên cloud: Control Tower, account vending, SCP guardrail, tài khoản log archive/audit, tài khoản network tập trung. Bạn thiết kế thế nào?',
  a: `**Tóm tắt:** Landing zone là **khung nhiều tài khoản AWS đã được quản trị sẵn** trước khi đưa workload lên: AWS Organizations với cấu trúc **OU** (Security, Infrastructure, Workloads Prod/NonProd, Sandbox), **Control Tower** để dựng và quản lý guardrail, **account vending** (Account Factory hoặc AFT) để cấp tài khoản mới theo chuẩn, **SCP** chặn những gì không bao giờ được phép, tài khoản **Log Archive** và **Audit** tách biệt, và tài khoản **Network** tập trung (Transit Gateway, kết nối on-prem, kiểm soát egress).

### Cấu trúc gợi ý cho ngân hàng
~~~text
Root (management account: chỉ dùng cho Organizations, billing)
├── Security OU: Log Archive, Audit (Security Tooling: GuardDuty, Security Hub, Config tổng hợp)
├── Infrastructure OU: Network (TGW, Direct Connect, egress firewall), Shared Services (CI/CD, ECR)
├── Workloads OU
│   ├── Prod OU: core-payments-prod, cards-prod, ...
│   └── NonProd OU: core-payments-dev, ...-uat
├── Sandbox OU: tài khoản thử nghiệm có ngân sách giới hạn
└── Suspended OU: tài khoản chờ đóng
~~~

### SCP guardrail (ví dụ)
- Chỉ cho phép các **region được phê duyệt** (dữ liệu khách hàng ở Việt Nam/Singapore theo quy định).
- Cấm tắt CloudTrail, GuardDuty, Config; cấm xoá log trong tài khoản Log Archive.
- Cấm tạo IAM user có access key dài hạn ở tài khoản workload; bắt buộc mã hoá khi tạo EBS/S3.
SCP chỉ **giới hạn** quyền tối đa (không cấp quyền), áp cho mọi principal trong tài khoản kể cả admin — trừ management account.

### Account vending
Tài khoản mới được tạo qua **Account Factory** (Service Catalog) hoặc **AFT** (Account Factory for Terraform: yêu cầu tài khoản bằng file Terraform trong Git, pipeline tự tạo và áp baseline). Baseline gồm: VPC theo dải IPAM, kết nối TGW, role cho CI/CD (cross-account, tin cậy tài khoản Shared Services bằng OIDC), SSO permission set, ngân sách và cảnh báo.

### Log archive và audit
CloudTrail tổ chức, Config, VPC Flow Logs đổ về bucket S3 trong tài khoản Log Archive với Object Lock; đội bảo mật làm việc trong tài khoản Audit với quyền đọc chéo; không ai ở đội ứng dụng có quyền xoá log.

### Ví dụ đời thực
Một ngân hàng bắt đầu cloud bằng **một** tài khoản chung cho mọi dự án: quyền admin rải rác, chi phí không tách được, một dev tạo bucket public trong cùng tài khoản với dữ liệu thật. Kiểm toán nội bộ yêu cầu dừng mở rộng. Dựng landing zone bằng Control Tower + AFT trong 8 tuần: 4 OU, SCP chặn region ngoài danh sách và chặn tắt CloudTrail, tài khoản riêng cho từng hệ thống mỗi môi trường. Sau 1 năm có 46 tài khoản, mỗi tài khoản mới được cấp trong khoảng 40 phút với đầy đủ baseline; đợt kiểm tra của cơ quan quản lý không có phát hiện mức cao về quản trị cloud.

### Pitfall
- Chạy workload trong management account.
- SCP quá chặt áp lên OU prod mà chưa thử ở nonprod → chặn cả deploy.
- Không có chiến lược IP từ đầu → các VPC trùng CIDR, không nối được.
- Cho phép tạo tài khoản ngoài quy trình vending → tài khoản thiếu baseline.

### Trả lời mẫu khi phỏng vấn
"Landing zone là nền tảng nhiều tài khoản được quản trị sẵn trước khi đưa workload lên. Tôi dùng AWS Organizations với các OU: Security chứa tài khoản Log Archive và Audit, Infrastructure chứa tài khoản Network với Transit Gateway và Direct Connect, Shared Services cho CI/CD, Workloads tách Prod và NonProd, và Sandbox. Control Tower dựng và giám sát các guardrail; SCP chặn những gì không bao giờ được phép như dùng region ngoài danh sách, tắt CloudTrail hay GuardDuty, tạo access key dài hạn. Tài khoản mới được cấp qua Account Factory hoặc AFT để luôn có baseline: VPC theo IPAM, kết nối TGW, role cho CI/CD, SSO, ngân sách. Log tập trung về tài khoản Log Archive với Object Lock, và đội ứng dụng không có quyền xoá. Mỗi hệ thống mỗi môi trường một tài khoản để giới hạn phạm vi ảnh hưởng và tách chi phí."`,
  follow: ['AWS Organizations và Control Tower: khi nào dùng cái nào?', 'Account Factory for Terraform (AFT) là gì, khác Account Factory thế nào?', 'Thiết kế cross-account role cho CI/CD deploy ra sao?'],
  tags: ['landing-zone', 'Control-Tower', 'SCP', 'multi-account', 'compliance', 'banking', 'lead']
},
{
  id: 'aws-040',
  topic: 'aws',
  level: 'lead',
  q: '(lead) Migrate database từ on-prem lên AWS với downtime tối thiểu: DMS full load + CDC, SCT khi đổi engine, kiểm tra dữ liệu, kế hoạch cutover và rollback.',
  a: `**Tóm tắt:** Để downtime tối thiểu: **DMS full load + CDC** (chép toàn bộ rồi đồng bộ liên tục thay đổi) giữ DB mới bám sát DB cũ trong nhiều ngày; **SCT** (Schema Conversion Tool) chuyển schema và code khi **đổi engine** (Oracle → PostgreSQL); **kiểm tra dữ liệu** bằng DMS data validation và so sánh tổng/checksum; **cutover** trong một khung ngắn: dừng ghi, chờ CDC đuổi kịp, kiểm tra, chuyển ứng dụng; **rollback** bằng cách giữ đường đồng bộ ngược (CDC từ mới về cũ) trong một thời gian.

### Từng bước
1. **Đánh giá**: kích thước, tốc độ thay đổi (GB/giờ redo/binlog), tính năng đặc thù (PL/SQL, sequence, kiểu dữ liệu), yêu cầu downtime. Cùng engine (MySQL → RDS MySQL, PostgreSQL → Aurora PostgreSQL) thì **native replication** thường đơn giản và nhanh hơn DMS.
2. **Chuyển schema**: SCT tạo báo cáo mức độ chuyển đổi tự động; phần không tự chuyển được (package PL/SQL, hàm riêng) phải viết lại và test. Tạo schema đích **không có** foreign key và trigger trong lúc full load (bật lại sau).
3. **Full load + CDC**: DMS replication instance đủ lớn; bật supplemental logging (Oracle) hoặc binlog dạng ROW (MySQL) ở nguồn; CDC chạy liên tục sau full load.
4. **Kiểm tra dữ liệu**: DMS data validation; thêm so sánh số dòng, tổng tiền, checksum theo bảng/khoảng; chạy test ứng dụng trên DB mới (bản sao).
5. **Cutover**: thông báo, chuyển ứng dụng sang chế độ chỉ đọc hoặc bảo trì, chờ CDC latency về 0, kiểm tra lần cuối, **đặt lại sequence** ở đích lớn hơn giá trị lớn nhất hiện có, đổi chuỗi kết nối (qua DNS/secret), bật lại trigger/FK, mở ghi.
6. **Rollback**: giữ một task CDC **ngược** (mới → cũ) vài ngày; nếu có sự cố, chuyển ứng dụng về DB cũ mà không mất dữ liệu đã ghi sau cutover.

### Ví dụ đời thực
Chuyển Oracle 2,4TB (hệ thống quản lý khoản vay) sang Aurora PostgreSQL. SCT tự chuyển được khoảng 80% schema và code; 140 package PL/SQL được viết lại thành logic ứng dụng hoặc hàm PL/pgSQL. Full load mất 19 giờ, CDC chạy 3 tuần song song. Hai sự cố trong lúc diễn tập: (1) kiểu {{NUMBER}} không có độ chính xác được map sang {{numeric}} làm truy vấn chậm — đổi sang {{bigint}}/{{numeric(p,s)}} cụ thể; (2) sequence ở đích chưa được đặt lại → lỗi trùng khoá ngay sau cutover thử. Cutover thật: 35 phút chỉ đọc; CDC ngược giữ 7 ngày nhưng không cần dùng. Chi phí license Oracle tiết kiệm khoảng 60% so với trước.

### Pitfall
- Không bật supplemental logging hoặc binlog đúng định dạng → CDC thiếu thay đổi.
- Full load với FK và trigger bật → lỗi thứ tự và chậm.
- Quên sequence/identity, LOB lớn, múi giờ của kiểu ngày giờ.
- Không có đường rollback ngoài "khôi phục backup" → rollback nghĩa là mất dữ liệu sau cutover.

### Trả lời mẫu khi phỏng vấn
"Tôi bắt đầu bằng đánh giá: kích thước, tốc độ thay đổi, có đổi engine không và downtime chấp nhận được. Cùng engine thì native replication thường đơn giản hơn; đổi engine như Oracle sang PostgreSQL thì dùng SCT để chuyển schema và code, phần không tự chuyển được thì viết lại và test. Dữ liệu dùng DMS full load rồi CDC để DB mới bám sát DB cũ nhiều ngày, với supplemental logging hoặc binlog ROW ở nguồn, và tắt khoá ngoại, trigger ở đích trong lúc load. Kiểm tra dữ liệu bằng DMS validation cộng so sánh số dòng, tổng, checksum. Cutover trong khung ngắn: chuyển ứng dụng sang chỉ đọc, chờ CDC về không, kiểm tra, đặt lại sequence, đổi kết nối, bật lại ràng buộc. Rollback thì giữ một luồng CDC ngược từ DB mới về DB cũ trong vài ngày, để quay lại mà không mất dữ liệu."

> Senior tip: diễn tập cutover **ít nhất hai lần** trên bản sao với đúng các bước và đồng hồ bấm giờ. Lần diễn tập đầu luôn lộ ra vài chi tiết như sequence, quyền, chuỗi kết nối cứng trong một job quên — và thời gian thật thường gấp đôi dự tính.`,
  follow: ['Khi nào nên dùng native replication thay vì DMS?', 'Xử lý sequence/identity khi migrate Oracle sang PostgreSQL thế nào?', 'Blue/green deployment cho database trên AWS hoạt động ra sao?'],
  tags: ['DMS', 'SCT', 'migration', 'CDC', 'cutover', 'rollback', 'database', 'lead']
},
{
  id: 'aws-041',
  topic: 'aws',
  level: 'senior',
  q: 'EKS và ECS (Fargate) khác nhau bản chất ở đâu? Khi nào chọn EKS, khi nào ECS Fargate là đủ?',
  a: `**Tóm tắt:** ECS Fargate là container service managed của AWS, đơn giản, phù hợp đa số service; EKS là Kubernetes managed, mạnh khi công ty đã có platform K8s hoặc cần hệ sinh thái K8s (CRD, operator, service mesh). Cái giá của EKS là độ phức tạp và chi phí con người.

### Hiểu nhanh
Hãy tưởng tượng bạn cần vận chuyển hàng. **ECS Fargate** giống dịch vụ giao hàng trọn gói: bạn đóng thùng (Docker image), điền địa chỉ, còn lại AWS lo xe, tài xế, bảo dưỡng. **EKS** giống bạn thuê nguyên một đội vận tải theo chuẩn quốc tế (Kubernetes): rất mạnh khi có nhiều kho, nhiều tuyến, nhiều đội phối hợp, nhưng phải có người quản lý đội, bảo trì xe, xử lý sự cố. Nếu công ty chỉ có vài service và không có người trực platform, EKS là "đội vận tải" quá lớn so với nhu cầu.

### Thuật ngữ
- **Control plane**: "bộ não" của Kubernetes (API server, scheduler, etcd); trên EKS do AWS vận hành, tính phí theo giờ.
- **Data plane**: các node thực sự chạy pod (EC2 của bạn hoặc Fargate).
- **Pod**: đơn vị nhỏ nhất chạy container trong Kubernetes; một pod có thể chứa nhiều container.
- **Deployment / ReplicaSet**: Kubernetes object khai báo số bản sao pod và cách cập nhật chúng.
- **Service / Ingress**: Kubernetes object expose pod ra mạng; Ingress thường trỏ tới ALB hoặc NGINX.
- **HPA (Horizontal Pod Autoscaler)**: tự tăng/giảm số pod theo CPU hoặc metric tuỳ chỉnh.
- **CRD (Custom Resource Definition)**: cách mở rộng Kubernetes bằng loại tài nguyên mới.
- **Operator**: controller tự động hoá vận hành một phần mềm cụ thể (ví dụ Kafka, Postgres) trên K8s.
- **Service mesh**: lớp quản lý traffic giữa service (Istio, Linkerd) chạy trên K8s.

### So sánh bản chất
| Tiêu chí | ECS Fargate | EKS |
|---|---|---|
| API quản lý | AWS API (task definition, service) | Kubernetes API (Deployment, Service, Ingress) |
| Đơn vị chạy | Task (1 hoặc nhiều container) | Pod |
| Auto-scale | Application Auto Scaling theo CPU/memory/request | HPA theo metric, Cluster Autoscaler/Karpenter cho node |
| Networking | awsvpc: mỗi task có ENI riêng | CNI (VPC CNI): pod có IP trong VPC |
| Quyền IAM cho pod | Task role (đơn giản) | IRSA hoặc EKS Pod Identity (phức tạp hơn) |
| Chi phí con người | Thấp | Cao (cần người trực cluster) |
| Hệ sinh thái | Hạn chế trong AWS | Rất lớn (Helm, CRD, operator, mesh) |

### Khi chọn ECS Fargate
- Đội nhỏ (5–20 người), không có người trực platform.
- Service chủ yếu là HTTP API Spring Boot chạy 24/7.
- Muốn deploy đơn giản, ít moving part.
- Không cần CRD, operator, service mesh.

### Khi chọn EKS
- Công ty đã có platform Kubernetes và nhiều team dùng chung.
- Cần hệ sinh thái K8s: operator cho Kafka/Postgres, service mesh, policy-as-code (OPA/Gatekeeper).
- Nhiều service, cần chuẩn hoá deploy và observability across team.
- Có người trực cluster (SRE/platform engineer).

### Lỗi hay gặp
- **Chọn EKS vì "công ty lớn đều dùng".** Triệu chứng: đội 5 người dành nửa thời gian nâng cấp cluster, sửa add-on, ingress. Cách tránh: chỉ chọn EKS khi có người trực platform và nhu cầu thật.
- **Dùng EKS nhưng không chuẩn hoá deploy.** Triệu chứng: mỗi service một kiểu YAML, cấu hình lệch nhau, khó nâng cấp. Cách tránh: Helm/Kustomize với template chung và policy-as-code.
- **Nhầm task role và node role trên EKS.** Triệu chứng: pod chạy được nhưng code gọi AWS bị AccessDenied. Cách tránh: dùng IRSA/Pod Identity, không để pod thừa hưởng quyền của node.

### Trả lời miệng 1 phút
"ECS Fargate là container service managed của AWS: tôi đóng image, khai báo task definition, AWS lo phần chạy, không có node để vá. EKS là Kubernetes managed, mạnh khi công ty đã có platform K8s, nhiều team, cần CRD/operator/service mesh. Cái giá của EKS là độ phức tạp và chi phí con người. Với đội Java 5–20 người và service HTTP bình thường, mặc định của tôi là ECS Fargate; chỉ nhảy lên EKS khi có người trực cluster và nhu cầu thật."

### Ví dụ đời thực
Một công ty fintech có 8 service, ban đầu chọn EKS vì "công ty lớn đều dùng". Triệu chứng: sau 6 tháng, platform team (2 người) dành 60% thời gian nâng cấp cluster (1.22 → 1.23 → 1.24), sửa ingress, add-on conflict, và mỗi service một kiểu YAML. Deployment một service mới mất 2 ngày (tạo namespace, RBAC, Helm chart, policy). Đội phát triển phàn nàn: deploy chậm, environment không nhất quán. Điều tra: đội xem metrics qua {{kubectl top nodes}} và AWS Console — cluster utilization 20-30%, số pod mỗi service chỉ 1-2, không có CRD/operator/service mesh nào thực sự cần; thời gian deploy được ghi lại: trung bình 2,2 ngày/service. Nguyên gốc: EKS quá phức tạp cho 8 service đơn giản, không có người trực platform thực sự, và không cần hệ sinh thái K8s; chi phí con người (nâng cấp, sửa add-on, chuẩn hóa YAML) lớn hơn lợi ích. Xử lý: giữ EKS cho 2 service cần service mesh (payment, fraud detection), chuyển 6 service còn lại sang ECS Fargate với task definition chung, ALB, Application Auto Scaling; viết Helm chart chung và CI/CD tự deploy. Kết quả: deploy từ 2,2 ngày xuống 15 phút/service, không còn nâng cấp cluster, chi phí platform team giảm 70%, và team phát triển tự deploy được mà không cần platform can thiệp.

> Senior tip: chi phí ẩn của Kubernetes là con người, không phải hoà đơn AWS. Nếu không có người trực cluster, EKS sẽ ngốn thời gian của cả đội phát triển.
`,
  follow: [
    'Karpenter khác gì Cluster Autoscaler trên EKS?',
    'IRSA và EKS Pod Identity khác nhau thế nào?',
    'Bạn sẽ migrate từ ECS sang EKS mà không downtime ra sao?'
  ],
  tags: ['EKS', 'ECS', 'Fargate', 'Kubernetes']
},
{
  id: 'aws-042',
  topic: 'aws',
  level: 'senior',
  q: 'IRSA và EKS Pod Identity: cách gắn IAM role cho pod mà không dùng access key, cơ chế và khác biệt ra sao?',
  a: `**Tóm tắt:** IRSA dùng OIDC provider để pod assume role qua token ServiceAccount; EKS Pod Identity dùng agent trên node. Cả hai đều cấp credential tạm cho SDK, không cần access key trong code.

### Hiểu nhanh
**IRSA** giống bạn có thẻ căn cước do trường cấp (Kubernetes ServiceAccount token) và AWS tin thẻ đó như giấy tờ tuỳ thân, nên cấp thẻ khách (credential tạm). **EKS Pod Identity** giống AWS đặt một lễ tân ngay tại toà nhà (agent trên node): pod chỉ cần nói "tôi là service X", lễ tân kiểm tra và phát thẻ. Cả hai đều tránh hard-code access key.

### Thuật ngữ
- **ServiceAccount**: danh tính của pod trong Kubernetes.
- **OIDC provider**: cấu hình IAM tin token do cluster EKS ký.
- **Web identity token**: JWT ngắn hạn gắn với ServiceAccount, mount vào pod.
- **STS AssumeRoleWithWebIdentity**: API STS cấp credential tạm từ JWT.
- **EKS Pod Identity agent**: DaemonSet chạy trên node, cung cấp credential cho pod.
- **Credential provider chain**: AWS SDK tự tìm credential theo thứ tự.

### Cơ chế IRSA
1. Tạo IAM role với trust policy tin OIDC provider của cluster và ServiceAccount cụ thể.
2. Tạo ServiceAccount có annotation {{eks.amazonaws.com/role-arn}}.
3. Pod dùng ServiceAccount đó nhận projected volume chứa JWT.
4. SDK đọc env {{AWS_ROLE_ARN}} và {{AWS_WEB_IDENTITY_TOKEN_FILE}}, gọi {{AssumeRoleWithWebIdentity}}.
5. STS trả credential tạm; SDK tự refresh trước khi hết hạn.

### Cơ chế EKS Pod Identity
1. Cài EKS Pod Identity agent (add-on) trên cluster.
2. Tạo association giữa ServiceAccount và IAM role qua API EKS.
3. Agent trên node cung cấp endpoint credential cho pod (giống ECS).
4. SDK đi theo container credential provider, gọi agent, nhận credential tạm.

### So sánh
| Tiêu chí | IRSA | EKS Pod Identity |
|---|---|---|
| Cần OIDC provider | Có | Không |
| Trust policy theo cluster | Phải include OIDC URL | Đơn giản hơn, theo account/cluster |
| Cross-account | Phức tạp | Dễ hơn |
| Setup | Annotation ServiceAccount | Association qua EKS API |
| Khuyến nghị mới | Legacy | Preferred cho cluster mới |

### Lỗi hay gặp
- **Annotation sai ServiceAccount.** Triệu chứng: pod không assume được role, SDK fallback sang node role. Cách tránh: kiểm tra ServiceAccount name/namespace khớp association.
- **Trust policy quá rộng.** Triệu chứng: bất kỳ ServiceAccount nào assume được role. Cách tránh: giới hạn {{sub}} condition tới ServiceAccount cụ thể.
- **Quên cài agent cho Pod Identity.** Triệu chứng: SDK không tìm được credential endpoint. Cách tránh: cài add-on trước khi dùng.

### Trả lời miệng 1 phút
"IRSA dùng OIDC provider để pod assume role qua JWT của ServiceAccount; EKS Pod Identity dùng agent trên node và association qua EKS API. Cả hai cấp credential tạm cho SDK, không cần access key. IRSA là cách cũ, cần OIDC provider và trust policy theo cluster; Pod Identity đơn giản hơn và là khuyến nghị cho cluster mới. Tôi chọn Pod Identity cho cluster mới, IRSA cho cluster cũ đã setup OIDC."

### Ví dụ đời thực
Một đội dùng EKS cluster mới (1.27) để chạy 12 microservice. Ban đầu chọn IRSA vì "chuẩn". Triệu chứng: mỗi service cần một IAM role, trust policy phải include OIDC URL của cluster cụ thể (arn:aws:iam::123456789012:oidc/provider/oidc.eks.us-east-1.amazonaws.com/id/xxx) và condition theo ServiceAccount. Khi cluster bị thay thế (rebuild), OIDC provider mới phải tạo lại và cập nhật 12 trust policy. Khi cần cross-account (service A ở account staging, role ở account prod), IRSA trở nên rắc rối vì trust policy phải trust OIDC provider ở account khác. Đội tra qua IAM Access Analyzer và CloudTrail: nhiều role có trust policy quá rộng (sub=*). Nguyên gốc: IRSA cần OIDC provider per cluster và trust policy theo cluster, phức tạp khi có nhiều cluster hoặc cross-account. Xử lý: cài EKS Pod Identity add-on, thay thế IRSA. Với Pod Identity, tạo association giữa ServiceAccount và IAM role qua EKS API, không cần trust policy theo cluster OIDC. Kết quả: không cần OIDC provider, trust policy đơn giản hơn, cross-account dễ dàng, và khi rebuild cluster không cần cập nhật policy. Deployment time giảm từ 30 phút xuống 5 phút mỗi service.

> Senior tip: đừng để pod thừa hưởng quyền của node. Luôn gắn role riêng cho từng workload qua IRSA hoặc Pod Identity, và review trust policy như review code.
`,
  follow: [
    'Vì sao pod không nên dùng node role?',
    'Trust policy của IRSA cần condition gì để an toàn?',
    'Pod Identity có hỗ trợ cross-account không?'
  ],
  tags: ['IRSA', 'EKS Pod Identity', 'IAM', 'EKS']
},
{
  id: 'aws-043',
  topic: 'aws',
  level: 'senior',
  q: 'IAM policy evaluation: khi gặp AccessDenied, debug thế nào? Explicit deny, SCP, permission boundary tương tác ra sao?',
  a: `**Tóm tắt:** IAM đánh giá theo thứ tự: explicit Deny thắng tất cả; sau đó cần Allow khớp và không bị SCP/permission boundary chặn; còn lại implicit deny. Debug bằng IAM Policy Simulator, CloudTrail event, và kiểm tra trust policy, SCP, boundary.

### Hiểu nhanh
Hãy tưởng tượng vào một toà nhà cao cấp. **Explicit deny** giống danh sách đen ở cổng: dù có thẻ VIP, nếu tên bạn trong danh sách đen thì không vào được. **SCP (Service Control Policy)** giống quy định của tập đoàn: dù phòng ban cho phép, nếu tập đoàn cấm thì không được. **Permission boundary** giống giới hạn trần của phòng ban: phòng ban không thể cấp quyền vượt trần dù muốn. Khi bị từ chối, cần kiểm tra từng lớp: danh sách đen → quy định tập đoàn → trần phòng ban → thẻ cá nhân.

### Thuật ngữ
- **Identity policy**: policy gắn vào user/role.
- **Resource policy**: policy gắn vào resource (S3 bucket policy, SQS queue policy).
- **SCP**: policy ở cấp Organization/OU/account, giới hạn quyền tối đa.
- **Permission boundary**: policy giới hạn quyền tối đa mà một principal có thể được cấp.
- **Explicit deny**: statement Effect=Deny khớp request.
- **Implicit deny**: không có Allow khớp.
- **IAM Policy Simulator**: công cụ test policy mà không gọi thật.
- **CloudTrail**: log mọi API call.

### Cơ chế đánh giá
1. Có explicit Deny nào khớp (identity, resource, SCP, boundary)? → TỪ CHỐI.
2. Có Allow nào khớp trong identity policy hoặc resource policy? Nếu không → implicit deny.
3. Allow đó có bị SCP chặn không? Nếu SCP không Allow → TỪ CHỐI.
4. Allow đó có bị permission boundary chặn không? Nếu boundary không Allow → TỪ CHỐI.
5. Nếu qua hết → CHO PHÉP.

Lưu ý: SCP và boundary chỉ **giới hạn** (filter), không cấp quyền. Quyền thực sự phải đến từ identity/resource policy.

### Debug AccessDenied từng bước
1. Đọc CloudTrail event: {{errorCode}}, {{errorMessage}}, {{userIdentity}}, {{requestParameters}}.
2. Xác định principal thực sự (role assumed, không phải user gốc).
3. Kiểm tra identity policy của role: có Allow action+resource khớp không?
4. Kiểm tra resource policy (nếu có): S3 bucket policy có Deny cross-account không?
5. Kiểm tra SCP ở account/OU: có Deny action không?
6. Kiểm tra permission boundary của role: có Allow action không?
7. Kiểm tra condition: VPC endpoint, MFA, source IP, tag...
8. Dùng IAM Policy Simulator để test policy combination.

### Lỗi hay gặp
- **Quên SCP chặn.** Triệu chứng: identity policy Allow nhưng vẫn AccessDenied; CloudTrail không nói rõ. Cách tránh: kiểm tra SCP ở account và OU; dùng Policy Simulator với SCP.
- **Permission boundary thiếu action.** Triệu chứng: admin cấp quyền mới nhưng boundary không có nên không hiệu lực. Cách tránh: boundary phải bao gồm tất cả action principal cần.
- **Condition sai.** Triệu chứng: policy đúng action/resource nhưng condition {{aws:SourceVpce}} không khớp vì request đi qua NAT. Cách tránh: kiểm tra condition bằng CloudTrail {{requestParameters}} và {{sourceIPAddress}}.
- **Nhầm principal.** Triệu chứng: debug role A nhưng request thực sự từ role B (assumed). Cách tránh: đọc {{userIdentity.arn}} trong CloudTrail.

### Trả lời miệng 1 phút
"IAM đánh giá theo thứ tự: explicit Deny thắng tất cả; sau đó cần Allow khớp và không bị SCP hay permission boundary chặn; còn lại implicit deny. SCP và boundary chỉ giới hạn, không cấp quyền. Khi gặp AccessDenied, tôi đọc CloudTrail để lấy principal và action thực sự, rồi kiểm tra identity policy, resource policy, SCP, boundary và condition theo thứ tự. Tôi dùng IAM Policy Simulator để test combination và luôn nhớ rằng principal thực sự có thể là role assumed, không phải user gốc."

### Ví dụ đời thực
Một service ECS Fargate cần đọc secret trên Secrets Manager. Identity policy đã Allow secretsmanager:GetSecretValue trên arn:aws:secretsmanager:us-east-1:123456789012:secret:app-db-* nhưng vẫn bị AccessDenied. Triệu chứng: CloudTrail event errorCode "AccessDenied", userIdentity.arn là arn:aws:sts::123456789012:assumed-role/app-task-role/session, requestParameters.name=/app/db. Đội debug theo thứ tự: (1) identity policy đã Allow và không explicit Deny; (2) resource policy của secret không có Deny; (3) kiểm tra SCP ở account: có statement Effect=Deny với Action=["secretsmanager:GetSecretValue"], Resource=* trong OU production; (4) permission boundary của role Allow tất cả nên không phải nguyên nhân. Nguyên gốc: SCP ở cấp OU production cấm secretsmanager:GetSecretValue cho toàn account, dù identity policy đã Allow. Xử lý: thay đổi SCP để Allow cho resource ARN cụ thể hoặc tạo exception theo condition, đồng thời thêm condition aws:SourceVpce cho endpoint. Kết quả: service đọc được secret, và SCP vẫn bảo vệ các secret khác. Sau đó thêm condition aws:SourceVpce để chỉ endpoint trong VPC mới có thể đọc secret.

> Senior tip: 80% AccessDenied là do condition (VPC endpoint, source IP) hoặc SCP, không phải policy identity. Luôn đọc CloudTrail trước khi sửa policy.
`,
  follow: [
    'SCP khác permission boundary ở điểm nào?',
    'Làm sao test policy mà không gọi thật?',
    'Resource policy và identity policy cùng áp dụng thế nào?'
  ],
  tags: ['IAM', 'SCP', 'permission boundary', 'AccessDenied']
},
{
  id: 'aws-044',
  topic: 'aws',
  level: 'senior',
  q: 'NAT Gateway và chi phí data transfer: vì sao NAT đắt, làm sao giảm bằng VPC endpoint và kiến trúc?',
  a: `**Tóm tắt:** NAT Gateway tính phí theo giờ và theo GB xử lý; traffic lớn qua NAT (ECR image, log, S3) làm hoá đơn tăng vọt. VPC endpoint (gateway cho S3/DynamoDB, interface cho SQS/KMS/ECR/CloudWatch) giúp traffic AWS không qua NAT. Kiến trúc: endpoint cho dịch vụ AWS, NAT chỉ cho traffic Internet thật.

### Hiểu nhanh
NAT Gateway giống trạm thu phí trên cao tốc: mỗi GB đi qua đều bị tính tiền, dù bạn chỉ đi từ nhà mình sang nhà hàng xóm trong cùng thành phố. Nếu bạn liên tục chở container image và log qua trạm thu phí, hoá đơn sẽ khổng lồ. **VPC endpoint** giống đường nội bộ dẫn thẳng tới "siêu thị AWS" mà không qua trạm thu phí. Vì vậy nguyên tắc là: traffic tới dịch vụ AWS phải đi đường nội bộ, NAT chỉ dành cho traffic ra Internet thật (gọi API bên thứ ba).

### Thuật ngữ
- **NAT Gateway**: managed NAT, tính phí theo giờ + GB xử lý, HA trong một AZ.
- **Data transfer cost**: phí truyền dữ liệu giữa AZ, region, Internet.
- **Gateway endpoint**: endpoint miễn phí cho S3 và DynamoDB, gắn vào route table.
- **Interface endpoint (PrivateLink)**: endpoint tạo ENI trong subnet, tính phí theo giờ + GB.
- **Private DNS**: endpoint tự resolve tên miền chuẩn của dịch vụ AWS.
- **Cross-AZ data transfer**: phí khi traffic đi giữa các AZ.
- **VPC Flow Logs**: log traffic trong VPC để phân tích.

### Cơ chế chi phí
1. NAT Gateway: ~0,045 USD/giờ (~32 USD/tháng) + ~0,045 USD/GB xử lý.
2. Interface endpoint: ~0,01 USD/giờ/AZ + ~0,01 USD/GB.
3. Gateway endpoint (S3, DynamoDB): miễn phí (chỉ tính storage/request của dịch vụ).
4. Cross-AZ: ~0,01 USD/GB mỗi chiều.

Ví dụ: app kéo 50 GB Docker image/tháng qua NAT → 50 × 0,045 = 2,25 USD/tháng chỉ cho image; cộng log, S3, SQS... có thể lên hàng trăm USD.

### Kiến trúc giảm chi phí
1. **Gateway endpoint cho S3 và DynamoDB** — luôn bật, miễn phí.
2. **Interface endpoint cho ECR (api + dkr)** — để kéo image không qua NAT; nhớ gateway endpoint S3 vì layer image nằm trên S3.
3. **Interface endpoint cho CloudWatch Logs, Secrets Manager, KMS, SQS, SNS** — traffic management không ra Internet.
4. **NAT chỉ cho traffic Internet thật**: gọi API bên thứ ba, tải package từ Internet.
5. **Mỗi AZ một NAT** để tránh cross-AZ data charge và single point of failure.
6. **Bật private DNS** cho interface endpoint để SDK dùng tên miền chuẩn.

### Lỗi hay gặp
- **Kéo image và đẩy log qua NAT.** Triệu chứng: NAT cost tăng vọt mỗi lần deploy. Cách tránh: endpoint cho ECR (api + dkr + gateway S3) và CloudWatch Logs.
- **Một NAT dùng chung nhiều AZ.** Triệu chứng: phí cross-AZ + single point of failure. Cách tránh: mỗi AZ một NAT.
- **Quên gateway endpoint S3 khi dùng ECR endpoint.** Triệu chứng: layer image vẫn đi qua NAT. Cách tránh: luôn có gateway endpoint S3.
- **Không bật private DNS.** Triệu chứng: SDK vẫn resolve tên miền ra Internet. Cách tránh: bật private DNS cho interface endpoint.

### Trả lời miệng 1 phút
"NAT Gateway tính phí theo giờ và GB xử lý, nên traffic lớn qua NAT (image, log, S3) làm hoá đơn tăng vọt. Tôi giảm bằng VPC endpoint: gateway endpoint miễn phí cho S3 và DynamoDB, interface endpoint cho ECR, CloudWatch Logs, Secrets Manager, KMS, SQS. NAT chỉ dành cho traffic Internet thật. Kiến trúc: mỗi AZ một NAT cho HA, endpoint cho mọi dịch vụ AWS, bật private DNS. Tôi bật VPC Flow Logs để phát hiện traffic bất thường đi qua NAT."

### Ví dụ đời thực
Một team vận hành service xử lý ảnh: mỗi ngày kéo 3 TB ảnh từ S3, xử lý, trả kết quả. Ban đầu service chạy trong private subnet, mọi traffic S3 đi qua NAT Gateway. Triệu chứng: hóa đơn NAT Gateway tăng vọt — tháng trước 4.200 USD, trong khi service chỉ chạy 30% thời gian. Điều tra: đội kiểm tra CloudWatch metric NatGatewayBytesProcessed — trung bình 90 TB/tháng, và Cost Explorer filter NAT Gateway cho thấy 95% là traffic tới S3. Nguyên gốc: thiếu Gateway Endpoint cho S3 nên traffic S3 phải đi qua NAT (tính 0,045 USD/GB), thay vì đi đường nội bộ AWS miễn phí; ngoài ra pod kéo image ECR và gửi CloudWatch Logs cũng qua NAT. Xử lý: thêm Gateway Endpoint cho S3 (miễn phí, chỉ cần thêm route pl-xxxx → vpce vào route table của private subnet), thêm Interface Endpoint cho ECR (api + dkr) và CloudWatch Logs, Secrets Manager, bật private DNS cho endpoint. Kết quả: lưu lượng qua NAT giảm 92%, hóa đơn NAT từ 4.200 USD xuống còn khoảng 350 USD/tháng (chỉ còn traffic Internet thật), và service không phụ thuộc Internet để gọi S3. Sau đó thêm endpoint policy để chỉ cho phép truy cập bucket của công ty, tăng bảo mật.

> Senior tip: vẽ route table trước khi vẽ diagram. Phần lớn sự cố 'chi phí NAT cao' là do thiếu endpoint. Bật VPC Flow Logs gửi về S3/CloudWatch để phân tích traffic theo destination.`,
  follow: [
    'Vì sao gateway endpoint cho S3 miễn phí nhưng interface endpoint cho ECR mất phí?',
    'Làm sao phát hiện traffic đang đi qua NAT không cần thiết?',
    'Cross-AZ data transfer ảnh hưởng chi phí thế nào?'
  ],
  tags: ['NAT Gateway', 'VPC endpoint', 'data transfer', 'cost']
},
{
  id: 'aws-045',
  topic: 'aws',
  level: 'lead',
  q: '(Lead) Tối ưu chi phí AWS cho hệ thống Java: Savings Plans, Graviton, Spot cho worker, right-sizing — chiến lược và thứ tự ưu tiên ra sao?',
  a: `**Tóm tắt:** Tối ưu chi phí AWS theo thứ tự: right-sizing (đo và cắt thừa) → Graviton (ARM, rẻ hơn và nhanh hơn cho Java) → Savings Plans/Reserved Instances cho baseline → Spot cho worker/batch → architecture (serverless, caching, endpoint). Mỗi bước cần đo trước khi làm.

### Hiểu nhanh
Tối ưu chi phí giống giảm cân: đừng mua thuốc giảm cân (Savings Plans) khi chưa biết đang ăn thừa ở đâu (right-sizing). Đầu tiên là **đo và cắt thừa** (right-sizing): nhiều hệ đang chạy instance lớn hơn cần thiết. Sau đó **đổi sang Graviton** (chip ARM của AWS) thường rẻ hơn 20% và nhanh hơn cho Java. Tiếp theo **commit baseline** bằng Savings Plans để được giảm giá. Cuối cùng **Spot** cho workload chịu được gián đoạn (worker, batch). Architecture (caching, serverless) là bước cuối cùng.

### Thuật ngữ
- **Right-sizing**: điều chỉnh size instance/container theo nhu cầu thực tế.
- **Graviton**: chip ARM do AWS thiết kế (Graviton2/3/4), giá rẻ hơn và hiệu năng/Watt tốt hơn x86 cho nhiều workload.
- **Savings Plans**: cam kết chi tiêu theo giờ (1 hoặc 3 năm) để được giảm giá, linh hoạt hơn Reserved Instances.
- **Reserved Instances (RI)**: cam kết instance cụ thể để được giảm giá.
- **Spot Instances**: dùng capacity thừa của AWS với giá giảm sâu, có thể bị thu hồi với cảnh báo 2 phút.
- **Compute Savings Plans**: áp dụng cho EC2, Fargate, Lambda bất kể instance family/region.
- **EC2 Instance Savings Plans**: áp dụng cho instance family cụ thể trong region, giảm giá sâu hơn.
- **Cost Explorer / Compute Optimizer**: công cụ AWS phân tích chi phí và gợi ý right-sizing.

### Thứ tự ưu tiên
1. **Right-sizing** (tuần 1-2): dùng Compute Optimizer và CloudWatch để tìm instance/container thừa. Giảm CPU/memory xuống mức thực tế + buffer 20-30%. Đây là bước rẻ nhất và an toàn nhất.
2. **Graviton** (tuần 2-4): migrate Java workload sang Graviton (m5 → m7g, c6i → c7g). Java chạy tốt trên ARM từ JDK 17; Spring Boot, Hibernate không cần thay đổi. Thường giảm 20% chi phí và tăng throughput.
3. **Savings Plans** (tháng 1): commit baseline (phần workload ổn định 24/7) bằng Compute Savings Plans 1 năm. Giảm ~30-40% so với on-demand. Không commit phần biến động.
4. **Spot** (tháng 2): dùng Spot cho worker, batch, CI runner, dev/staging. Cần handle interruption (checkpoint, graceful shutdown). Có thể giảm 60-90%.
5. **Architecture** (liên tục): caching (ElastiCache), serverless cho workload thất thường, VPC endpoint giảm NAT, S3 lifecycle.

### Java trên Graviton
- JDK 17+ hỗ trợ ARM64 tốt; JVM tự nhận diện architecture.
- Docker image cần build multi-arch (linux/arm64) hoặc dùng image có sẵn.
- Một số native library (JNI) cần rebuild cho ARM.
- Benchmark trước khi migrate production; thường Graviton cho throughput cao hơn với cùng giá.

### Spot cho Java worker
- Worker xử lý job từ SQS/Kafka: nếu bị thu hồi, message quay lại queue (visibility timeout) → worker khác xử lý. An toàn nếu idempotent.
- Cần graceful shutdown: nhận SIGTERM, dừng nhận job mới, hoàn thành job hiện tại trong 2 phút.
- Dùng Spot Fleet / Auto Scaling Group với mixed instances và on-demand fallback.
- Không dùng Spot cho API serving (latency nhạy cảm) hoặc stateful workload.

### Lỗi hay gặp
- **Mua Savings Plans trước khi right-size.** Triệu chứng: commit chi tiêu cho instance thừa, lãng phí. Cách tránh: right-size trước, commit sau.
- **Migrate Graviton mà không test native library.** Triệu chứng: app crash vì JNI library chỉ có x86. Cách tránh: kiểm tra dependency, build multi-arch, test staging.
- **Dùng Spot cho API serving.** Triệu chứng: request bị drop khi Spot bị thu hồi. Cách tránh: Spot chỉ cho worker/batch/dev.
- **Không handle Spot interruption.** Triệu chứng: job mất giữa chừng, dữ liệu không nhất quán. Cách tránh: checkpoint + graceful shutdown + idempotent processing.

### Trả lời miệng 1 phút
"Tối ưu chi phí tôi làm theo thứ tự: right-sizing trước (đo và cắt thừa), sau đó Graviton (ARM, thường rẻ hơn 20% và nhanh hơn cho Java), rồi Savings Plans cho baseline ổn định, Spot cho worker và batch, cuối cùng architecture như caching và serverless. Quan trọng là đo trước khi làm: dùng Compute Optimizer và CloudWatch. Java chạy tốt trên Graviton từ JDK 17, chỉ cần build multi-arch image. Spot chỉ cho workload chịu được gián đoạn và phải handle interruption gracefully."

### Ví dụ đời thực
Một công ty vận hành 40 ECS Fargate service, mỗi service chạy 2 task (1 vCPU, 2 GB) 24/7, tổng chi phí compute khoảng 12.000 USD/tháng. Ban đầu team chọn instance type theo cảm tính và không đo. Triệu chứng: sau 6 tháng, chi phí tăng 40% mà traffic không tăng; team không biết service nào dư thừa. Điều tra: đội dùng Compute Optimizer và CloudWatch — phát hiện 60% task đang chạy ở CPU trung bình 10-20% và memory utilization dưới 30%, nhiều service có thể chạy 0,5 vCPU/1 GB; ngoài ra 15 service chỉ chạy từ 8h-17h weekdays nhưng task vẫn chạy 24/7. Nguyên gốc: không right-sizing trước khi mua Savings Plans, và không tự động scale theo thời gian. Xử lý: right-sizing 60% task xuống 0,5 vCPU/1 GB (giảm 40% chi phí compute), thêm Application Auto Scaling theo CPU và schedule-based scaling cho 15 service (tắt task ngoài giờ làm), sau khi baseline ổn định mua Compute Savings Plans 1 năm cho phần 24/7 (giảm thêm ~35%). Kết quả: chi phí compute từ 12.000 USD xuống còn khoảng 4.800 USD/tháng (~60% giảm), và không cần migrate Graviton ngay vì sau right-size đã đạt mục tiêu; sau đó test Graviton trên 1 service: cùng traffic, CPU utilization giảm 25% nên team quyết định migrate dần trong quý sau.

> Senior tip: đừng mua Savings Plans khi chưa right-size. Nhiều hệ đang chạy instance lớn gấp đôi cần thiết; cắt trước có thể giảm 30-50% mà không cần commit gì.`,
  follow: [
    'Compute Savings Plans khác EC2 Instance Savings Plans thế nào?',
    'Làm sao handle Spot interruption trong Java worker?',
    'Graviton có nhược điểm gì so với x86 cho Java?'
  ],
  tags: ['cost optimization', 'Savings Plans', 'Graviton', 'Spot', 'right-sizing', 'lead']
},
{
  id: 'aws-046',
  topic: 'aws',
  level: 'lead',
  q: '(Lead) Secrets và rotation: Secrets Manager vs Parameter Store, Spring Boot đọc secret thế nào và rotate không downtime ra sao?',
  a: `**Tóm tắt:** Secrets Manager có rotation tự động và audit tốt nhưng đắt; Parameter Store rẻ hơn, phù hợp config không nhạy cảm. Spring Boot đọc qua AWS SDK hoặc Spring Cloud AWS. Rotation không downtime cần app hỗ trợ reload secret (refresh scope) và dual-credential window.

### Hiểu nhanh
**Secrets Manager** giống tủ sắt có người quản lý: tự đổi mật khẩu định kỳ, ghi log ai mở tủ, nhưng thuê tủ đắt. **Parameter Store** giống ngăn kéo văn phòng: rẻ, có khoá, nhưng tự bạn phải đổi mật khẩu và không có log chi tiết. Với secret quan trọng (DB password, API key), dùng Secrets Manager để có rotation tự động. Với config (feature flag, URL), dùng Parameter Store Standard (miễn phí) hoặc Advanced.

### Thuật ngữ
- **Secret**: giá trị nhạy cảm (password, token, key).
- **Parameter**: giá trị config (có thể encrypted).
- **Rotation**: tự động đổi secret theo lịch.
- **Lambda rotation function**: hàm Lambda do Secrets Manager gọi để đổi secret.
- **Dual credential**: giữ cả secret cũ và mới trong thời gian chuyển đổi.
- **Spring Cloud AWS**: thư viện tích hợp AWS vào Spring Boot.
- **@RefreshScope**: Spring annotation cho phép bean reload khi config thay đổi.
- **Secrets Manager caching client**: client cache secret để giảm API call và chi phí.

### So sánh
| Tiêu chí | Secrets Manager | Parameter Store |
|---|---|---|
| Giá | ~0,40 USD/secret/tháng + API call | Standard miễn phí; Advanced ~0,05 USD/parameter/tháng |
| Rotation tự động | Có (Lambda) | Không (phải tự viết) |
| Audit (CloudTrail) | Chi tiết | Cơ bản |
| Kích thước | Tối đa 64 KB | Standard 4 KB, Advanced 8 KB |
| Cross-account | Dễ (resource policy) | Hạn chế |
| Phù hợp | Secret quan trọng cần rotation | Config, feature flag, secret ít thay đổi |

### Spring Boot đọc secret
Cách 1: AWS SDK trực tiếp trong @PostConstruct hoặc @ConfigurationProperties, dùng Secrets Manager caching client để cache và tự refresh.

Cách 2: Spring Cloud AWS: thêm dependency, cấu hình {{spring.config.import=aws-secretsmanager:/secret/name}}, Spring tự inject vào Environment.

Cách 3: Mount secret vào env var qua ECS/Lambda (ít linh hoạt, không reload runtime).

### Rotation không downtime
1. Secret có hai version: AWSCURRENT và AWSPREVIOUS.
2. Rotation function tạo secret mới, cập nhật DB (đổi password), rồi promote version mới.
3. App phải hỗ trợ reload: dùng @RefreshScope + polling hoặc event, hoặc restart rolling.
4. Trong thời gian chuyển đổi, cả credential cũ và mới đều hợp lệ (dual credential) nhờ DB hỗ trợ multiple password hoặc grace period.
5. Secrets Manager caching client tự refresh khi detect version mới.

### Lỗi hay gặp
- **App cache secret mãi không reload.** Triệu chứng: sau rotation, app vẫn dùng secret cũ, connection fail. Cách avoid: dùng caching client với TTL, hoặc @RefreshScope + actuator refresh endpoint.
- **Rotation function không idempotent.** Triệu chứng: rotation chạy hai lần gây lỗi hoặc secret lệch. Cách avoid: thiết kế idempotent, kiểm tra version trước khi đổi.
- **Dùng Parameter Store cho secret cần rotation.** Triệu chứng: phải tự viết rotation, dễ lỗi. Cách avoid: secret quan trọng dùng Secrets Manager.
- **Secret trong env var của task definition.** Triệu chứng: secret nằm trong CloudFormation/IaC, bị lộ. Cách avoid: dùng secret reference (ECS secret injection từ Secrets Manager/Parameter Store), không put plaintext.

### Trả lời miệng 1 phút
"Secrets Manager có rotation tự động và audit tốt nhưng đắt; Parameter Store rẻ hơn, phù hợp config. Spring Boot đọc qua AWS SDK caching client hoặc Spring Cloud AWS. Rotation không downtime cần app hỗ trợ reload secret (@RefreshScope hoặc caching client với TTL) và dual-credential window trong thời gian chuyển đổi. Secret quan trọng (DB password) dùng Secrets Manager; config/feature flag dùng Parameter Store Standard."

### Ví dụ đời thực
Một hệ thống giao dịch cần rotation DB password mỗi 30 ngày theo chính sách bảo mật. Ban đầu team dùng Parameter Store và tự viết cron job đổi password, nhưng app phải restart để reload secret — mỗi rotation gây downtime khoảng 2 phút/lần, xảy ra 3 lần/tháng do script lỗi. Triệu chứng: khách bị error 5xx khi app reload midway, và sau rotation một số instance vẫn dùng password cũ nên kết nối fail. Điều tra: team kiểm tra CloudTrail và log — rotation script không idempotent (chạy hai lần thì tạo secret mới rồi xóa nhầm), và app không có cơ chế reload secret runtime (chỉ đọc env var lúc start). Nguyên gốc: Parameter Store không có rotation tự động, tự viết script dễ lỗi; app cache secret mãi không reload. Xử lý: chuyển DB password sang Secrets Manager, bật rotation tự động với Lambda rotation function (idempotent: kiểm tra version trước khi đổi); app dùng Secrets Manager caching client với TTL 5 phút hoặc @RefreshScope + actuator refresh endpoint để reload secret runtime mà không restart. Kết quả: rotation tự động mỗi 30 ngày, downtime giảm từ 2 phút xuống 0 (dual-credential window: cả password cũ và mới đều hợp lệ trong thời gian chuyển đổi), và script lỗi không còn. Sau đó thêm secret reference vào task definition (ECS) để secret không xuất hiện plaintext trong IaC, và dùng IAM policy với condition aws:SourceVpce để chỉ endpoint trong VPC mới được đọc secret.

> Senior tip: đừng lưu secret trong env var plaintext của task definition. Dùng secret reference để ECS/Lambda tự inject từ Secrets Manager/Parameter Store, và secret không xuất hiện trong IaC hay console.`,
  follow: [
    'Secrets Manager rotation Lambda hoạt động thế nào các bước?',
    'Làm sao app Java reload secret mà không restart?',
    'Khi nào dùng Parameter Store Advanced thay vì Secrets Manager?'
  ],
  tags: ['Secrets Manager', 'Parameter Store', 'rotation', 'Spring Boot', 'lead']
}
,
{
  id: 'aws-047',
  topic: 'aws',
  level: 'senior',
  q: 'VPC: route table, NAT Gateway, VPC Endpoint (Gateway vs Interface) — vì sao chi phí NAT tăng vọt khi EC2 gọi S3?',
  a: `**Tóm tắt:** NAT Gateway tính tiền theo GB data processed; gọi S3 qua NAT = trả tiền NAT + S3. Dùng S3 Gateway Endpoint (miễn phí, thêm route vào route table) để traffic đi nội bộ AWS, không qua NAT và không mất tiền NAT.

### Cái gì là route table
Route table là "bảng chỉ đường" của subnet: mỗi dòng {destination CIDR -> target}. Ví dụ 10.0.0.0/16 -> local (trong VPC), 0.0.0.0/0 -> nat-xxx (ra internet). Subnet liên kết với 1 route table.

### NAT Gateway
NAT Gateway đặt ở public subnet, có Elastic IP, cho phép private subnet ra internet (outbound only). Tính tiền: ~$0.045/giờ + $0.045/GB processed. Quan trọng: "processed" = mọi byte đi qua NAT, kể cả S3.

### VPC Endpoint
- Gateway Endpoint: chỉ cho S3 và DynamoDB. Miễn phí, thêm route trong route table (pl-xxx -> vpce). Traffic không qua NAT/internet.
- Interface Endpoint (PrivateLink): cho hầu hết service AWS, tạo ENI trong subnet, có phí/giờ + $/GB. Dùng khi cần private access hoặc service không có Gateway Endpoint.

### Vì sao chi phí NAT tăng vọt với S3
EC2 private subnet download 1 TB từ S3: traffic đi NAT -> $45 NAT + S3 transfer. Nếu dùng Gateway Endpoint: $0 NAT (S3 transfer trong cùng region miễn phí). Nhiều team quên endpoint -> bill NAT khổng lồ.

### Trên production
- Triệu chứng: bill NAT Gateway cao bất thường, CloudWatch NatGatewayBytesProcessed lớn.
- Cách đo: Cost Explorer filter NAT Gateway; metric NatGatewayBytesProcessed.
- Tuning: tạo S3 Gateway Endpoint cho mọi VPC có EC2 gọi S3; bật S3 bucket policy yêu cầu VPC endpoint; dùng Interface Endpoint cho ECR/Secrets Manager nếu private.
- Pitfall: Gateway Endpoint không hỗ trợ cross-region; Interface Endpoint cần SG cho ENI; endpoint policy mặc định allow all -> siết lại.

### So sánh
| | NAT Gateway | S3 Gateway Endpoint | Interface Endpoint |
|---|---|---|---|
| Phí | $/giờ + $/GB | miễn phí | $/giờ + $/GB |
| Service | mọi internet | S3, DynamoDB | hầu hết AWS |
| Bảo mật | ra internet | chỉ AWS backbone | private |

### Ví dụ đời thực
Hoá đơn của một team tăng 4.200 USD trong tháng sau khi chuyển service xử lý ảnh vào private subnet: mỗi pod đọc/ghi khoảng 90TB/tháng với S3 qua **NAT Gateway**, bị tính phí xử lý dữ liệu của NAT trên từng GB. Thêm **Gateway Endpoint cho S3** (miễn phí, chỉ cần thêm route vào route table của private subnet) — traffic S3 đi thẳng qua mạng AWS, phí NAT cho phần này về gần 0. Tiếp theo thêm Interface Endpoint cho ECR (api, dkr), CloudWatch Logs và Secrets Manager vì pod kéo image và gửi log liên tục; Interface Endpoint có phí theo giờ và theo GB nhưng thấp hơn NAT ở lưu lượng này. Kiểm chứng bằng VPC Flow Logs: lưu lượng qua NAT giảm 92%. Lưu ý thêm: endpoint policy có thể giới hạn chỉ cho phép truy cập bucket của công ty, tăng bảo mật.

### Trả lời mẫu khi phỏng vấn
"Route table quyết định gói tin từ subnet đi đâu: subnet public có route ra Internet Gateway, subnet private ra NAT Gateway nếu cần gọi ra ngoài. NAT Gateway tính phí theo giờ và theo từng GB dữ liệu đi qua, nên khi EC2 hay pod ở private subnet gọi S3 với khối lượng lớn, toàn bộ traffic đó đi qua NAT và bị tính phí xử lý, hoá đơn tăng vọt. Cách sửa là VPC Endpoint: với S3 và DynamoDB có Gateway Endpoint miễn phí, chỉ thêm route vào route table; các dịch vụ khác như ECR, CloudWatch Logs, Secrets Manager dùng Interface Endpoint qua PrivateLink, có phí nhưng rẻ hơn NAT khi lưu lượng lớn, và traffic không ra Internet. Tôi kiểm chứng bằng VPC Flow Logs, và dùng endpoint policy để chỉ cho phép truy cập tài nguyên của công ty."

> Senior tip: luôn tạo S3 Gateway Endpoint đầu tiên khi dựng VPC; kiểm tra bill NAT hàng tháng — nếu NatGatewayBytesProcessed > 1 TB/tháng và đa số là S3, bạn đang đốt tiền.`,
  follow: [
    'Gateway Endpoint và Interface Endpoint khác nhau thế nào, khi nào chọn cái nào?',
    'Làm sao bắt buộc traffic S3 phải đi qua VPC endpoint (bucket policy)?',
    'VPC Flow Logs giúp debug routing thế nào?'
  ],
  tags: ['VPC', 'NAT', 'Endpoint', 'S3', 'senior']
},
{
  id: 'aws-048',
  topic: 'aws',
  level: 'senior',
  q: 'ALB vs NLB: layer 7 vs layer 4, giữ IP client, idle timeout gây 502/504 với keep-alive của app Java',
  a: `**Tóm tắt:** ALB hiểu HTTP (routing theo path/host, WebSocket), NLB ở layer 4 giữ IP client và latency thấp. Idle timeout của ALB (mặc định 60s) cắt connection keep-alive của Tomcat/Netty -> 502/504 nếu target keep-alive timeout ngắn hơn idle timeout của ALB. Fix: đặt target keep-alive timeout lớn hơn idle timeout của ALB, hoặc tắt keep-alive.

### Layer
- ALB (Application LB): layer 7, HTTP/HTTPS/gRPC/WebSocket. Routing theo host, path, header, query. Terminate TLS. Có WAF integration.
- NLB (Network LB): layer 4, TCP/UDP/TLS. Giữ IP client (preserve client IP), latency ~ microseconds, static IP/EIP per AZ. Không hiểu HTTP.

### Giữ IP client
- ALB: app thấy IP của ALB; IP client nằm trong X-Forwarded-For header. Cần cấu hình Tomcat RemoteIpValve hoặc Spring server.forward-headers-strategy=framework.
- NLB: app thấy IP client thật (nếu target type instance/ip). Tốt cho protocol không HTTP hoặc cần IP thật.

### Idle timeout và 502/504
ALB có idle timeout (default 60s). Nếu connection giữa ALB và target idle > timeout, ALB đóng connection. Nếu app (Tomcat keep-alive timeout 20s? Actually Tomcat default keepAliveTimeout 20s; nếu app set lớn) hoặc client gửi request trên connection đã bị ALB đóng -> 502 Bad Gateway hoặc 504 Gateway Timeout.

Triệu chứng: 502/504 rải rác, thường với long-polling, SSE, hoặc batch upload. Log ALB: target_connection_error_count, http_5xx_count.

### Fix
- Quy tắc then chốt: **target keep-alive timeout phải DÀI hơn idle timeout của ALB** (ALB default 60s). Nếu target đóng kết nối trước, ALB vẫn gửi request vào đó → 502. Ví dụ: đặt Tomcat {{server.tomcat.keep-alive-timeout=65s}} (lớn hơn 60s).
- Với SSE/long-poll: tăng idle timeout ALB lên 300-3600s (max 4000s) hoặc dùng NLB.
- Tắt keep-alive ở app nếu traffic ngắn: {{server.tomcat.keep-alive-timeout=1}}.
- Client-ALB: client timeout nên lớn hơn ALB idle timeout để client không mất kết nối trước khi ALB đóng.

### Trên production
- Metric: ALB TargetResponseTime, HTTPCode_Target_5XX_Count, TargetConnectionErrorCount.
- ALB access log: tìm 502/504 và elapsed time.
- Pitfall: health check path trả 200 nhanh; deregistration delay (default 300s) chờ connection drain khi deploy.

### Ví dụ đời thực
Service Spring Boot sau ALB thỉnh thoảng trả **502** với tỉ lệ khoảng 0,1%, không có lỗi nào trong log ứng dụng. Nguyên nhân: idle timeout của ALB là 60 giây (mặc định), còn keep-alive timeout của Tomcat ({{server.tomcat.keep-alive-timeout}}, mặc định theo connection timeout khoảng 20 giây) **ngắn hơn** — Tomcat đóng kết nối nhàn rỗi trong khi ALB vẫn nghĩ kết nối còn dùng được và gửi request mới vào đúng lúc nó bị đóng → 502. Sửa: đặt keep-alive của Tomcat **dài hơn** idle timeout của ALB (ví dụ 65 giây). 502 biến mất. Một service khác cần giữ IP thật của client cho chống gian lận: với ALB đọc header {{X-Forwarded-For}} (cấu hình {{server.forward-headers-strategy}} trong Spring Boot); với NLB thì bật giữ IP client hoặc Proxy Protocol v2.

### Trả lời mẫu khi phỏng vấn
"ALB hoạt động ở tầng 7: hiểu HTTP, định tuyến theo path và host, có WAF, chứng chỉ, sticky session, phù hợp cho API web. NLB ở tầng 4: chuyển tiếp TCP, UDP với độ trễ rất thấp, IP tĩnh, chịu lưu lượng cực lớn, dùng cho giao thức không phải HTTP hoặc khi cần IP cố định cho đối tác whitelist. Về IP client, ALB truyền qua header X-Forwarded-For nên ứng dụng phải cấu hình đọc header đó; NLB có thể giữ nguyên IP nguồn hoặc dùng Proxy Protocol. Lỗi 502 lẻ tẻ sau ALB thường do keep-alive timeout của server ngắn hơn idle timeout của ALB: server đóng kết nối trong khi ALB vẫn gửi request vào đó. Cách sửa là đặt keep-alive của Tomcat dài hơn idle timeout của ALB."

> Senior tip: thứ tự đúng là **target keep-alive timeout > ALB idle timeout** (ALB default 60s) và **client timeout > ALB idle timeout**. Nếu target đóng kết nối trước khi ALB, ALB gửi request vào connection đã đóng → 502. Đặt Tomcat {{keep-alive-timeout}} lớn hơn idle timeout của ALB là fix phổ biến nhất.`,
  follow: [
    'Khi nào chọn NLB thay vì ALB cho service Java?',
    'Cách cấu hình Spring Boot nhận IP client thật qua ALB?',
    'Deregistration delay ảnh hưởng deploy thế nào?'
  ],
  tags: ['ALB', 'NLB', 'keep-alive', '502', 'senior']
},
{
  id: 'aws-049',
  topic: 'aws',
  level: 'senior',
  q: 'RDS Multi-AZ failover thực tế: DNS, thời gian, read replica lag, RDS Proxy với Lambda',
  a: `**Tóm tắt:** Multi-AZ là synchronous replication standby ở AZ khác; failover đổi DNS endpoint (TTL thấp) trong 1-2 phút, connection đang mở bị drop -> app phải retry. Read replica là async -> lag. RDS Proxy gom connection, hợp Lambda (nhiều concurrent connection).

### Multi-AZ cơ chế
- Primary ở AZ A, standby synchronous ở AZ B. Standby không serve read (chỉ standby). Failover tự động khi primary fail (hardware, AZ outage, patch).
- Failover: promote standby, đổi DNS CNAME endpoint sang instance mới. TTL ~5s. Thời gian thực tế 60-120s (phát hiện + promote + DNS propagate). Connection đang mở bị reset -> SQLException.

### App Java phải làm gì
- Dùng connection pool (HikariCP) với validation query và retry. Set connectionTimeout, maxLifetime < failover time? Thực tế: catch SQLException, retry với backoff. Spring @Retryable.
- Multi-AZ không tăng read capacity (standby không đọc). Muốn scale read -> Read Replica.

### Read Replica lag
- Async replication: replica có thể lag vài ms đến vài giây (hoặc phút khi load cao). Đọc ngay sau write -> stale data. Dùng cho report/analytics, không cho read-after-write critical.
- Cross-region replica cho DR; lag cao hơn.

### RDS Proxy với Lambda
- Lambda mỗi invocation mở connection -> thousands concurrent connections overwhelm RDS. RDS Proxy là connection pooler giữa Lambda và RDS, reuse connection, giảm connection churn, hỗ trợ IAM auth và failover nhanh hơn (proxy giữ connection).
- Pinning: transaction hoặc session state (SET, temp table, advisory lock) làm proxy không thể reuse connection -> mất lợi ích. Tránh session-level state.

### Trên production
- Metric: DatabaseConnections, ReplicaLag, Failover events (RDS events).
- Test failover định kỳ (reboot with failover) trong maintenance window.
- Pitfall: app cache DNS dài -> sau failover vẫn trỏ instance cũ; set JVM DNS TTL thấp (networkaddress.cache.ttl=5) hoặc dùng proxy.

### Ví dụ đời thực
Diễn tập failover RDS PostgreSQL Multi-AZ: DB chuyển sang standby trong khoảng 60 giây, nhưng ứng dụng Spring Boot lỗi tới **6 phút**. Nguyên nhân: JVM cache DNS (security manager cũ đặt {{networkaddress.cache.ttl}} vô hạn trong image cũ), và pool HikariCP giữ các kết nối chết vì không có timeout đọc — request treo tới khi TCP timeout của hệ điều hành. Sửa: {{networkaddress.cache.ttl=30}}, đặt {{socketTimeout}} cho JDBC driver, Hikari {{maxLifetime}} ngắn hơn, và retry có giới hạn cho lỗi kết nối. Lần diễn tập sau: ứng dụng phục hồi trong khoảng 75 giây sau khi DB failover. Với nhóm Lambda gọi cùng DB, chuyển sang **RDS Proxy** giúp giữ kết nối phía client trong lúc failover và giảm thêm thời gian lỗi.

### Trả lời mẫu khi phỏng vấn
"RDS Multi-AZ giữ một bản standby đồng bộ ở AZ khác; khi primary lỗi, RDS chuyển endpoint DNS sang standby, thường trong vài chục giây tới khoảng hai phút. Read replica thì khác: sao chép bất đồng bộ, dùng để chia tải đọc, có độ trễ, và phải promote nếu muốn dùng làm primary. Phía ứng dụng Java phải chuẩn bị: JVM không được cache DNS lâu, pool phải loại kết nối chết nhanh nhờ socket timeout và maxLifetime, và có retry có giới hạn cho lỗi kết nối. Nếu không, DB failover một phút nhưng ứng dụng lỗi vài phút. Với Lambda, RDS Proxy gộp kết nối và giữ kết nối phía client khi failover. Tôi luôn diễn tập failover và đo thời gian lỗi phía ứng dụng, không chỉ phía DB."

> Senior tip: Multi-AZ cho HA, Read Replica cho scale read — đừng nhầm. Với Lambda luôn dùng RDS Proxy, và kiểm tra pinning metric; pinning cao = đang dùng session state và proxy vô dụng.`,
  follow: [
    'Làm sao test failover RDS mà không downtime người dùng?',
    'Khi nào dùng Aurora thay vì RDS PostgreSQL?',
    'Read replica lag đo thế nào và ngưỡng nào cần alert?'
  ],
  tags: ['RDS', 'Multi-AZ', 'Read Replica', 'RDS Proxy', 'Lambda', 'senior']
},
{
  id: 'aws-050',
  topic: 'aws',
  level: 'senior',
  q: 'SQS: visibility timeout, at-least-once, FIFO + message group, DLQ và redrive',
  a: `**Tóm tắt:** SQS at-least-once: message có thể deliver nhiều lần. Visibility timeout ẩn message sau khi nhận; nếu xử lý xong không delete -> nhận lại. FIFO + MessageGroupId đảm bảo thứ tự trong group. DLQ bắt message fail nhiều lần, redrive để replay.

### Visibility timeout
Khi consumer receive message, SQS ẩn message trong visibility timeout (default 30s). Consumer phải xử lý và delete message trước hết timeout. Nếu crash -> message hiện lại -> consumer khác xử lý. Nếu xử lý > timeout -> duplicate processing. Set timeout >= xử lý worst-case, hoặc extend (ChangeMessageVisibility) khi xử lý lâu.

### At-least-once
Standard queue: có thể duplicate (network retry, timeout). Consumer phải idempotent: dùng message ID / business key để dedup. FIFO queue: exactly-once processing (dedup trong 5 phút qua MessageDeduplicationId) nhưng vẫn at-least-once delivery; dedup ID chống duplicate.

### FIFO + Message Group
FIFO đảm bảo thứ tự theo MessageGroupId. Nhiều consumer có thể xử lý song song các group khác nhau, nhưng trong cùng group thì tuần tự. Throughput FIFO: 300 msg/s (hoặc 3000 với batching) per queue; partition theo group.

### DLQ và redrive
- DLQ: queue nhận message sau N lần fail (maxReceiveCount). Giúp không block queue chính.
- Redrive: sau khi fix bug, chuyển message từ DLQ về main queue (redrive) hoặc xử lý thủ công.
- Redrive allow policy: DLQ phải cho phép source queue redrive.

### Trên production
- Metric: ApproximateNumberOfMessagesVisible, NumberOfMessagesSent/Received, DLQ depth.
- Alert DLQ depth > 0.
- Pitfall: visibility timeout quá ngắn -> duplicate storm; quá dài -> delay retry.
- Xử lý poison message: log payload + message ID, không retry vô hạn; dùng DLQ.

### So sánh Standard vs FIFO
| | Standard | FIFO |
|---|---|---|
| Thứ tự | best-effort | strict per group |
| Throughput | gần như vô hạn | 300-3000/s |
| Dedup | không | 5 phút |
| Dùng khi | throughput cao, không cần thứ tự | cần thứ tự / exactly-once |

### Ví dụ đời thực
Consumer SQS gửi email xác nhận đơn hàng: visibility timeout 30 giây nhưng vào giờ cao điểm việc gọi nhà cung cấp email mất 40–50 giây → message **xuất hiện lại** trước khi xử lý xong, consumer khác nhận và gửi lần nữa; khách nhận 2–3 email giống nhau. Sửa: tăng visibility timeout lên khoảng 6 lần thời gian xử lý tối đa (theo khuyến nghị cho Lambda event source), gia hạn visibility ({{ChangeMessageVisibility}}) cho việc dài, và quan trọng nhất là xử lý **idempotent** theo {{orderId}} (bảng đã gửi). Cấu hình DLQ với {{maxReceiveCount}} = 5 để message lỗi liên tục không chặn hàng đợi; sau khi sửa lỗi nhà cung cấp, dùng **DLQ redrive** đưa message trở lại hàng đợi chính. Với luồng cần đúng thứ tự trạng thái đơn hàng, dùng FIFO với {{MessageGroupId = orderId}}.

### Trả lời mẫu khi phỏng vấn
"SQS giao message theo at-least-once: khi consumer nhận message, nó bị ẩn trong khoảng visibility timeout; nếu consumer không xoá kịp, message hiện lại và có thể được xử lý lần nữa. Vì vậy visibility timeout phải dài hơn thời gian xử lý tối đa, có thể gia hạn cho việc dài, và consumer luôn phải idempotent. DLQ nhận message sau một số lần nhận thất bại, để message lỗi không chặn hàng đợi; sửa lỗi xong thì dùng redrive đưa chúng về. Standard queue có throughput gần như không giới hạn nhưng không đảm bảo thứ tự; FIFO đảm bảo thứ tự trong từng message group và chống trùng trong cửa sổ deduplication, đổi lại giới hạn throughput. Tôi dùng FIFO với message group theo id thực thể khi thứ tự quan trọng, ví dụ trạng thái đơn hàng."

> Senior tip: thiết kế consumer idempotent ngay từ đầu (business key + DB unique constraint) — đó là cách duy nhất sống sót với at-least-once. Visibility timeout = processing time * 2 + buffer.`,
  follow: [
    'Làm sao implement idempotent consumer với SQS?',
    'Khi nào dùng SNS fan-out + SQS thay vì Kafka?',
    'Redrive policy và cách replay DLQ an toàn?'
  ],
  tags: ['SQS', 'visibility timeout', 'FIFO', 'DLQ', 'senior']
},
{
  id: 'aws-051',
  topic: 'aws',
  level: 'senior',
  q: 'DynamoDB: partition key, hot partition, adaptive capacity, GSI eventual consistency, single-table design',
  a: `**Tóm tắt:** DynamoDB phân tán theo partition key hash; hot partition xảy ra khi một key nhận traffic lớn vượt capacity của partition. Adaptive capacity tự điều chỉnh nhưng không cứu hot key đơn lẻ. GSI là async -> eventual consistency. Single-table design dùng composite key + overload.

### Partition key và partition
- Table partition theo hash(partition key). Mỗi partition có throughput limit (~3000 RCU / 1000 WCU) và storage 10GB.
- Nếu partition key là userId và một user hot (celebrity) -> hot partition -> throttling dù total capacity còn dư.

### Adaptive capacity
DynamoDB tự chuyển unused capacity từ partition lạnh sang partition nóng. Nhưng nếu một partition key đơn lẻ vượt hard limit của partition, adaptive không đủ -> phải redesign key (sharding, thêm suffix random).

### Hot partition fix
- Chọn high-cardinality key (userId + timestamp bucket).
- Write sharding: thêm random suffix (0-9) vào PK cho write-heavy, đọc phải query tất cả shard.
- Dùng on-demand capacity hoặc provisioned với auto-scaling.

### GSI eventual consistency
- GSI replicate async từ base table. Write vào base -> GSI update sau vài ms. Read GSI ngay sau write -> có thể chưa thấy. Không dùng GSI cho read-after-write critical; dùng base table query hoặc strongly consistent read (chỉ base table).
- GSI có throughput riêng; hot GSI cũng throttling.

### Single-table design
- Một table chứa nhiều entity type, dùng PK/SK composite. Ví dụ PK=USER#123, SK=PROFILE; PK=USER#123, SK=ORDER#456. Query bằng begins_with.
- Overload GSI: GSI1PK/GSI1SK cho access pattern khác. Giảm số table, transaction ACID trong cùng table.

### Trên production
- Metric: ConsumedRead/WriteCapacityUnits, ThrottledRequests, UserErrors.
- CloudWatch Contributor Insights tìm hot partition.
- Pitfall: scan toàn table -> cost lớn; luôn query với key.

### Ví dụ đời thực
Bảng DynamoDB lưu sự kiện IoT với partition key là {{date}} (ví dụ "2026-11-07"): mọi ghi trong ngày dồn vào **một partition key** → throttling dù tổng capacity còn dư rất nhiều (giới hạn mỗi partition khoảng 1.000 WCU và 3.000 RCU). Adaptive capacity giúp được một phần nhưng không cứu được một key duy nhất nhận toàn bộ lưu lượng. Sửa: partition key = {{deviceId}}, sort key = {{timestamp}}; truy vấn "mọi sự kiện trong ngày" chuyển sang GSI với **write sharding** ({{date#shard}}, shard 0–9) và đọc song song 10 shard. Throttling về 0. Một lỗi khác: đọc từ GSI ngay sau khi ghi không thấy dữ liệu — vì GSI luôn **eventually consistent**; luồng cần đọc ngay sau ghi phải đọc từ bảng chính với strongly consistent read.

### Trả lời mẫu khi phỏng vấn
"DynamoDB phân tán dữ liệu theo hash của partition key, mỗi partition có giới hạn throughput riêng, nên thiết kế partition key quyết định khả năng mở rộng. Key có ít giá trị hoặc dồn lưu lượng, như ngày hay trạng thái, tạo hot partition và bị throttling dù tổng capacity còn dư. Adaptive capacity tự phân bổ lại cho partition nóng nhưng không cứu được một key nhận toàn bộ tải; khi đó tôi chọn key có nhiều giá trị như id người dùng hay thiết bị, hoặc write sharding bằng hậu tố ngẫu nhiên rồi đọc song song. GSI luôn eventually consistent nên không dùng cho luồng cần đọc ngay sau khi ghi. Single-table design gom nhiều loại thực thể vào một bảng theo mẫu truy cập, giảm số lần gọi, nhưng phải biết rõ mẫu truy cập từ đầu và khó thay đổi về sau."

> Senior tip: DynamoDB reward good key design và punish bad; trước khi code, liệt kê access patterns rồi thiết kế PK/SK. Hot partition là lỗi thiết kế, không phải lỗi capacity.`,
  follow: [
    'Khi nào dùng DynamoDB thay vì RDS?',
    'Làm sao debug hot partition với CloudWatch?',
    'Single-table design trade-off vs multi-table?'
  ],
  tags: ['DynamoDB', 'partition key', 'hot partition', 'GSI', 'senior']
},
{
  id: 'aws-052',
  topic: 'aws',
  level: 'lead',
  q: 'IAM policy evaluation logic: explicit deny, SCP, permission boundary, role cho workload',
  a: `**Tóm tắt:** IAM (Identity and Access Management - dịch vụ quản lý danh tính và quyền trên AWS) đánh giá quyền theo nguyên tắc "explicit deny thắng tất cả" (từ chối rõ ràng luôn thắng), sau đó cần có "allow" phù hợp và không bị SCP (Service Control Policy - chính sách giới hạn ở cấp AWS Organizations) hay permission boundary (ranh giới quyền tối đa cho user/role) chặn. Để request được phép: **không có deny** nào khớp, **có allow** từ identity policy hoặc resource policy, và allow đó **được SCP và boundary cho phép**. Hiểu logic này giúp cấp quyền đúng (least privilege - tối thiểu cần thiết) cho workload (ứng dụng chạy trên EC2/ECS/Lambda/EKS).

### Cái gì: các loại policy và vai trò
- **Identity-based policy**: gắn vào IAM user, group, role (ví dụ role của ECS task). Nói "principal này được/không được làm gì trên resource nào".
- **Resource-based policy**: gắn vào tài nguyên (S3 bucket policy, SQS queue policy, KMS key policy). Nói "ai được truy cập tài nguyên này". Hỗ trợ cross-account rõ ràng.
- **SCP (Service Control Policy)**: áp ở AWS Organizations (OU/account). SCP **không cấp quyền**, chỉ đặt "trần" tối đa; kể cả admin trong account cũng không vượt được SCP deny/không-allow.
- **Permission boundary**: policy gắn vào user/role để giới hạn quyền tối đa principal đó có thể được cấp (dù identity policy cho rộng). Hữu ích khi ủy quyền cho team tự tạo role nhưng vẫn bị kiểm soát.
- **Session policy**: giới hạn thêm khi assume role (ví dụ STS session) - thu hẹp, không mở rộng.
- **Explicit deny**: statement {{Effect: Deny}} khớp action/resource/condition. **Implicit deny**: mặc định từ chối nếu không có Allow.

~~~seq
title: Luồng đánh giá IAM (rút gọn)
actors: Principal | IAMEngine | SCP | Resource
Principal -> IAMEngine: Gọi API (vd: s3:GetObject)
IAMEngine -> SCP: Có explicit Deny hoặc không Allow?
SCP --> IAMEngine: SCP chặn -> Deny
IAMEngine -> Resource: Kiểm tra resource policy
Resource --> IAMEngine: Allow/Deny theo policy
note IAMEngine: Explicit Deny bất kỳ đâu -> Deny
IAMEngine --> Principal: Allow nếu qua mọi tầng
~~~

### Vì sao logic đánh giá hoạt động theo thứ tự này
AWS thiết kế "deny ưu tiên" để an toàn: chỉ cần một lớp bảo vệ nói "không" là chặn được, tránh lộ do một policy khác cấu hình sai. Cơ chế (đơn giản hóa cho trường hợp phổ biến):
1. **Explicit Deny?** Nếu có Deny khớp ở identity policy, resource policy, SCP, boundary, session policy -> **Deny** ngay.
2. **Có Allow khớp?** Cần Allow từ identity policy và/hoặc resource policy (tùy same-account/cross-account và loại dịch vụ). Nếu không có Allow -> **Implicit Deny**.
3. **SCP cho phép?** SCP phải không chặn (trong mô hình allow-list SCP, action phải được Allow; trong deny-list, không bị Deny). Nếu bị chặn -> **Deny**.
4. **Permission boundary cho phép?** Boundary phải Allow phạm vi đó. Nếu không -> **Deny**.
5. Qua tất cả -> **Allow**.

Lưu ý cross-account (ví dụ truy cập S3 bucket ở account khác): thường cần **cả** identity policy bên principal cho phép **và** resource policy bên bucket cho phép (và vẫn chịu SCP/boundary).

### Áp dụng cho workload (role cho ứng dụng)
- **EC2**: instance profile gắn IAM role; app dùng AWS SDK lấy credential tạm từ metadata.
- **ECS/Fargate**: task role (quyền app gọi AWS) tách với task execution role (quyền ECS kéo image, ghi log). Đây là điểm hay nhầm.
- **Lambda**: execution role.
- **EKS**: IRSA hoặc EKS Pod Identity để gắn role theo ServiceAccount/pod.
Nguyên tắc: cấp đúng action/resource (tránh {{*}}), thêm {{Condition}} khi phù hợp ({{aws:SourceVpc}}, {{aws:PrincipalTag}}, ràng buộc {{kms:ViaService}}...), tách role theo service (payment không dùng chung role với reporting).

### Ví dụ đời thực
Nền tảng ngân hàng multi-account (AWS Organizations): account workload chạy ECS service ghi file vào S3 bucket cùng account, đọc secret từ Secrets Manager. Sự cố: deploy phiên bản mới bị {{AccessDenied}} khi {{s3:PutObject}}, dù task role "trông có vẻ đủ quyền".
- Kiểm tra CloudTrail: thấy {{errorCode AccessDenied}}, {{userIdentity}} là task role {{arn:aws:iam::111122223333:role/pay-svc-task}}.
- Identity policy của role có {{s3:PutObject}} trên {{arn:aws:s3:::pay-bucket/*}} -> có Allow.
- Kiểm tra bucket policy: không có Deny.
- Kiểm tra **permission boundary** gắn trên role (do platform team áp để ủy quyền): boundary chỉ cho phép {{s3:GetObject}}, không có {{s3:PutObject}} -> boundary chặn dù identity Allow.
- Kiểm tra SCP ở OU: không deny S3.
- Khắc phục: cập nhật boundary (qua quy trình review) để thêm {{s3:PutObject}} đúng prefix {{inbox/*}}; thêm {{Condition}} giới hạn. Sau khi áp dụng, request thành công. Đồng thời thêm test quyền trong pipeline (IAM Policy Simulator/kiểm thử tích hợp) để phát hiện sớm.
- Kết quả: không còn {{AccessDenied}}, audit ghi rõ vì sao boundary thay đổi.

### Pitfall production
- **Wildcard {{Action:*}} / {{Resource:*}}**: tiện lúc dev nhưng rủi ro lớn; dùng Access Analyzer và review định kỳ để thu hẹp.
- **Nhầm execution role và task role (ECS)**: app thiếu quyền vì policy gắn nhầm role.
- **Quên SCP/boundary**: debug chỉ nhìn identity policy sẽ "bí". Luôn kiểm tra đủ các tầng.
- **Resource policy deny ngầm**: bucket policy có {{Deny}} không khớp điều kiện VPC endpoint/KMS -> lỗi khó hiểu.
- **Credential precedence trên EC2/EKS**: app lỡ dùng env credential thay vì role mong muốn.

### Trả lời mẫu khi phỏng vấn
"Em hiểu IAM evaluation theo nguyên tắc explicit deny thắng tất cả. Để một request được phép, trước hết không có Deny nào khớp ở identity policy, resource policy, SCP hay permission boundary; sau đó phải có Allow phù hợp, và Allow đó không bị SCP hay permission boundary chặn. SCP ở Organizations đặt trần cho cả account, còn permission boundary đặt trần cho từng user hoặc role. Khi cấp quyền cho workload như ECS hay Lambda, em dùng role riêng, tách task role và execution role trên ECS, áp least privilege, tránh wildcard và thêm condition khi cần. Khi gặp AccessDenied, em đọc CloudTrail để biết principal và action thật, rồi kiểm tra lần lượt identity policy, resource policy, SCP, boundary - vì rất nhiều trường hợp do boundary hoặc SCP chặn chứ không phải do thiếu Allow."

> Senior tip: Thiết kế IAM như code: version control, review thay đổi, dùng permission boundary cho mô hình self-service, và đặt SCP deny cho hành động nguy hiểm (tắt CloudTrail, xóa log). Khi debug {{AccessDenied}}, luôn đọc CloudTrail trước - 80% nguyên nhân nằm ở condition, boundary hoặc SCP.`,
  follow: [
    'Permission boundary và SCP khác nhau thế nào?',
    'Làm sao audit permission unused trong AWS?',
    'Condition key nào hay dùng để restrict theo VPC/tag?'
  ],
  tags: ['IAM', 'SCP', 'permission boundary', 'policy', 'lead']
},
{
  id: 'aws-053',
  topic: 'aws',
  level: 'lead',
  q: 'IRSA / EKS Pod Identity: role cho pod, vì sao không dùng node instance profile',
  a: `**Tóm tắt:** IRSA dùng OIDC federation: pod có service account annotated với IAM role ARN; kubelet inject token (JWT) vào pod, AWS STS AssumeRoleWithWebIdentity đổi token thành AWS credentials. Pod Identity là cơ chế mới đơn giản hơn (agent trên node). Không dùng node instance profile vì mọi pod chia sẻ cùng permission -> vi phạm least privilege.

### Vấn đề node instance profile
Mọi pod trên node dùng cùng instance profile của node -> nếu một pod bị compromise, attacker có toàn bộ permission của node (S3, DynamoDB...). Không thể phân biệt pod.

### IRSA (IAM Roles for Service Accounts)
- EKS cluster có OIDC provider (IAM identity provider).
- Tạo IAM role với trust policy: Principal = OIDC provider, condition StringEquals sub = system:serviceaccount:ns:sa.
- Annotate K8s ServiceAccount với eks.amazonaws.com/role-arn.
- Pod dùng SA đó: webhook inject env AWS_ROLE_ARN và AWS_WEB_IDENTITY_TOKEN_FILE (JWT mounted).
- AWS SDK tự gọi STS AssumeRoleWithWebIdentity -> temporary credentials. Rotate tự động.

### EKS Pod Identity
- Cơ chế mới (2023): agent (eks-pod-identity-agent DaemonSet) trên node intercept AWS SDK calls, assume role dựa trên mapping Pod Identity Association (namespace+SA -> role). Không cần OIDC, không cần annotate SA. Đơn giản hơn, hỗ trợ session tags, revoke nhanh.

### So sánh
| | IRSA | Pod Identity |
|---|---|---|
| Setup | OIDC provider + trust policy condition | association API |
| Annotate SA | cần | không cần |
| Revocation | xóa SA/role | xóa association |
| Khuyến nghị mới | legacy | preferred cho cluster mới |

### Trên production
- Principle: một role per service (payment-service, order-service), không shared.
- Trust policy condition phải chặt (namespace + SA name), tránh wildcard.
- CloudTrail log AssumeRoleWithWebIdentity với source IP pod.
- Pitfall: pod không có SA annotated -> dùng node role (fallback) -> lỗ hổng. Enforce bằng admission policy (OPA/Kyverno) yêu cầu SA có role.

### Ví dụ đời thực
Một cluster EKS gắn quyền S3 vào **instance profile của node**: mọi pod trên node — kể cả một service marketing — đều đọc được bucket chứa hồ sơ khách hàng. Kiểm thử bảo mật chiếm được một pod qua lỗ hổng thư viện và gọi được S3 bằng credential lấy từ instance metadata (IMDS). Sửa: chuyển từng service sang **EKS Pod Identity** (hoặc IRSA): mỗi ServiceAccount một role với quyền đúng bucket/prefix cần dùng; chặn pod truy cập IMDS (đặt hop limit của IMDSv2 = 1 hoặc NetworkPolicy) để pod không lấy được credential của node; gỡ quyền S3 khỏi role của node. Lần kiểm thử sau, pod bị chiếm chỉ có quyền của chính service đó.

### Trả lời mẫu khi phỏng vấn
"Nếu gắn quyền vào instance profile của node, mọi pod chạy trên node đều có quyền đó, nên một pod bị chiếm là lộ quyền của tất cả. Tôi gắn quyền theo từng pod. IRSA dùng OIDC provider của cluster: ServiceAccount được annotate role, SDK đổi token của ServiceAccount lấy credential tạm qua AssumeRoleWithWebIdentity. EKS Pod Identity mới hơn và đơn giản hơn: chạy agent trên node, liên kết ServiceAccount với role qua API của EKS, không cần quản lý OIDC provider cho từng cluster và dễ dùng lại role giữa nhiều cluster. Dù chọn cách nào, tôi còn chặn pod truy cập metadata của node bằng IMDSv2 với hop limit 1 hoặc NetworkPolicy, và gỡ các quyền ứng dụng khỏi role của node."

> Senior tip: IRSA/Pod Identity là "zero-trust cho pod": credential sống trong pod memory, tự rotate, không mount secret. Kết hợp với network policy và read-only root filesystem để harden.`,
  follow: [
    'IRSA trust policy condition StringEquals vs StringLike khác nhau thế nào?',
    'Làm sao migrate từ IRSA sang Pod Identity?',
    'Pod không có permission AWS thì debug thế nào?'
  ],
  tags: ['EKS', 'IRSA', 'Pod Identity', 'IAM', 'lead']
},
{
  id: 'aws-054',
  topic: 'aws',
  level: 'lead',
  q: 'RDS Proxy với Lambda và Aurora storage 6 bản sao: failover và connection pooling',
  a: `**Tóm tắt:** Aurora storage là distributed volume 6 bản sao trên 3 AZ, tự repair; failover chỉ promote reader (10-30s) vì data đã shared. RDS Proxy trước Lambda gom connection, tránh connection storm và rút ngắn failover perceived. Kết hợp: Aurora + Proxy cho serverless workload.

### Aurora storage
- Volume distributed, 6 copies trên 3 AZ (2 per AZ). Self-healing: nếu một copy hỏng, tự rebuild từ các copy khác. Không mất data khi mất 2 copies.
- Storage auto-grow đến 128 TB, không cần provision.
- Write quorum 4/6, read quorum 3/6 -> durability cao.

### Failover Aurora
- Primary fail -> promote một Aurora Replica làm primary. Vì storage shared, không cần copy data -> failover 10-30s (vs RDS 60-120s). Endpoint cluster (writer/reader) tự update.
- Có reader endpoint load-balance read traffic.

### RDS Proxy + Lambda
- Lambda concurrency cao -> mỗi invocation mở DB connection -> RDS connection limit (max_connections theo instance size) bị exhaust -> timeout. Proxy là pooler: Lambda kết nối proxy (nhanh, nhiều), proxy giữ ít connection đến DB.
- Proxy hỗ trợ auth IAM (no password in code) và failover nhanh: proxy detect primary fail và route sang primary mới, app không cần reconnect.
- Pinning: transaction, session variables, advisory locks, temp tables làm proxy pin connection -> giảm reuse. Tránh SET SESSION; dùng transaction-level.

### Trên production
- Metric: DatabaseConnections, Proxy client connections, pinning count (DatabaseConnections? Actually CloudWatch metric DatabaseConnections cho proxy).
- Alert: pinning > 5% connections -> review code.
- Pitfall: long transaction giữ connection -> pool exhaustion; set timeout.

### So sánh RDS vs Aurora
| | RDS | Aurora |
|---|---|---|
| Storage | EBS, single AZ (Multi-AZ standby) | distributed 6 copies |
| Failover | 60-120s | 10-30s |
| Read scale | read replica (async lag) | Aurora Replica (lag < 10ms) |
| Cost | rẻ hơn | đắt hơn |

### Ví dụ đời thực
Một API dùng Lambda gọi Aurora PostgreSQL: lúc khuyến mãi, concurrency Lambda lên 800, mỗi môi trường thực thi mở kết nối riêng → Aurora chạm max_connections, lỗi "too many connections" hàng loạt. Thêm **RDS Proxy**: Lambda kết nối tới proxy, proxy dùng khoảng 100 kết nối thật tới DB; xác thực bằng IAM thay cho mật khẩu trong biến môi trường. Một lần failover Aurora sau đó, proxy giữ kết nối phía Lambda và chuyển sang writer mới, thời gian lỗi phía ứng dụng giảm rõ so với kết nối trực tiếp. Cần chú ý: code đặt biến phiên ({{SET}}) làm proxy **ghim (pin)** kết nối, mất lợi ích gộp — theo dõi metric pinning và bỏ các lệnh đó.

### Trả lời mẫu khi phỏng vấn
"Aurora tách tính toán khỏi lưu trữ: dữ liệu được ghi thành sáu bản sao trên ba AZ ở tầng storage, nên mất một AZ hay vài bản sao vẫn đọc ghi được, và replica đọc dùng chung storage nên lag thường rất thấp. Khi writer lỗi, Aurora promote một replica thành writer, thường trong khoảng dưới một phút, và endpoint cluster trỏ sang writer mới. Lambda có vấn đề riêng: mỗi môi trường thực thi mở kết nối, concurrency cao là cạn max_connections. RDS Proxy gộp kết nối, giữ kết nối phía client khi failover, và hỗ trợ xác thực IAM. Tôi theo dõi pinning của proxy, vì dùng biến phiên hay tính năng theo phiên làm proxy phải ghim kết nối cho client đó."

> Senior tip: với Lambda + DB, luôn dùng RDS Proxy + Aurora; pinning metric là KPI quan trọng — pinning cao có nghĩa proxy đang bị vô hiệu hóa.`,
  follow: [
    'Aurora Replica lag khác RDS read replica thế nào?',
    'Làm sao giảm pinning trong RDS Proxy?',
    'Khi nào Aurora Serverless v2 phù hợp?'
  ],
  tags: ['Aurora', 'RDS Proxy', 'Lambda', 'failover', 'lead']
},
{
  id: 'aws-055',
  topic: 'aws',
  level: 'lead',
  q: '(Case study SA) Hoá đơn AWS của công ty tăng từ 18.000 lên 31.000 USD trong một tháng mà traffic chỉ tăng 10%. Giám đốc yêu cầu giải thích và kế hoạch giảm trong 2 tuần. Bạn điều tra và xử lý thế nào?',
  a: `**Tóm tắt:** Tôi coi đây là một sự cố có quy trình: **khoanh vùng** bằng Cost Explorer (theo dịch vụ → tài khoản → usage type → tag), tìm **2–3 dòng chi phí tăng nhiều nhất** (thường chiếm 80% phần tăng), tìm **nguyên nhân kỹ thuật** của từng dòng (NAT, data transfer liên AZ, log, tài nguyên quên tắt, cấu hình autoscaling), sửa theo thứ tự "nhanh – an toàn – lớn", rồi dựng **cơ chế phòng ngừa**: tag bắt buộc, ngân sách theo team, Cost Anomaly Detection, review chi phí trong quy trình thiết kế.

### Bước 1 — Khoanh vùng trong 1–2 ngày
- **Cost Explorer**: so tháng này với tháng trước theo *Service*, rồi *Usage type* (ví dụ {{NatGateway-Bytes}}, {{DataTransfer-Regional-Bytes}}, {{DataProcessing-Bytes}} của CloudWatch Logs).
- **CUR / Data Exports** vào Athena khi cần chi tiết theo resource ID và theo giờ (biết chính xác ngày nào bắt đầu tăng → đối chiếu với lịch deploy).
- Lọc theo **tag** team/service; phần "untagged" lớn là một phát hiện riêng.

### Bước 2 — Các nguyên nhân hay gặp và cách xác nhận
| Dòng chi phí tăng | Nguyên nhân hay gặp | Cách xác nhận |
|---|---|---|
| NAT Gateway (data processing) | Pod kéo image, gọi S3/DynamoDB qua NAT | VPC Flow Logs theo đích; thiếu VPC endpoint |
| Data transfer liên AZ | Service gọi chéo AZ, Kafka/DB replica khác AZ | Usage type {{DataTransfer-Regional-Bytes}} |
| CloudWatch Logs ingestion | Bật DEBUG, log body request | Log group có lượng ingest tăng đột biến |
| EC2/EBS | Môi trường test quên tắt, volume/snapshot mồ côi | Trusted Advisor, Compute Optimizer, tag thiếu owner |
| RDS | Instance phóng to "tạm thời" không thu lại, IOPS provisioned thừa | Metric CPU/IOPS thấp kéo dài |

### Bước 3 — Ví dụ đời thực (phân tích thật)
Phần tăng 13.000 USD gồm:
- **NAT Gateway +5.200 USD**: sau khi chuyển sang EKS, mỗi node kéo image 1,2GB từ ECR qua NAT mỗi lần scale (autoscaler tạo/xoá node liên tục). Sửa: VPC endpoint cho ECR, S3 (gateway endpoint miễn phí), giảm kích thước image, giữ node ổn định hơn.
- **CloudWatch Logs +3.800 USD**: một service bật DEBUG và log toàn bộ payload, 9TB/tháng. Sửa: về INFO, sampling, retention 14 ngày, log ít giá trị chuyển sang S3.
- **Data transfer liên AZ +2.100 USD**: Kafka consumer đọc từ broker khác AZ. Sửa: bật {{client.rack}} (đọc từ follower cùng AZ).
- **Môi trường quên tắt +1.600 USD**: 3 cụm load test chạy suốt tháng. Sửa: TTL tag + Lambda tắt tự động ngoài giờ.
Sau 2 tuần hoá đơn tháng tiếp theo về 17.400 USD (thấp hơn cả trước sự cố) mà không ảnh hưởng hiệu năng.

### Bước 4 — Phòng ngừa
- Tag bắt buộc (owner, service, env) bằng SCP/Tag Policy; tài nguyên không tag bị cảnh báo.
- **AWS Budgets** theo tài khoản/team, **Cost Anomaly Detection** cảnh báo qua Slack trong ngày.
- Dashboard chi phí theo service gửi cho từng team hằng tuần (showback).
- Thêm câu hỏi chi phí vào design review: "luồng dữ liệu này đi qua NAT, qua AZ, qua region bao nhiêu GB/tháng?".

### Trả lời mẫu khi phỏng vấn
"Tôi xử lý tăng chi phí như một sự cố. Đầu tiên khoanh vùng bằng Cost Explorer theo dịch vụ, rồi usage type, rồi tag, và dùng Cost and Usage Report trong Athena để biết chính xác ngày bắt đầu tăng và resource nào, đối chiếu với lịch deploy. Thường hai ba dòng chiếm phần lớn mức tăng. Sau đó tìm nguyên nhân kỹ thuật cho từng dòng: NAT gateway tăng vì thiếu VPC endpoint cho S3 hay ECR, data transfer liên AZ do service hay consumer gọi chéo AZ, CloudWatch Logs tăng vì ai đó bật DEBUG, tài nguyên test quên tắt. Tôi sửa theo thứ tự nhanh và an toàn trước, đo lại sau mỗi thay đổi. Cuối cùng là cơ chế để không lặp lại: tag bắt buộc, budget và Cost Anomaly Detection cảnh báo trong ngày, báo cáo chi phí theo team, và đưa câu hỏi chi phí vào design review."

### Ví dụ đời thực
**Triệu chứng:** Hoá đơn tháng 6 của một công ty thương mại điện tử (NAT: Network Address Translation Gateway — dịch vụ NAT do AWS quản lý, đặt trong VPC để tài nguyên private subnet truy cập Internet ra ngoài; phí gồm giờ chạy và phí xử lý dữ liệu GB) tăng từ 18.000 lên 31.000 USD (+13.000 USD) trong khi số đơn hàng chỉ tăng khoảng 10%. Finance báo chi phí/1.000 đơn tăng mạnh, đội backend không nhận thấy lỗi người dùng.

**Điều tra:** Sáng hôm sau, tôi mở Cost Explorer, chọn so sánh tháng 6 với tháng 5, nhóm theo Service: NAT Gateway tăng ~5.200 USD, CloudWatch Logs ~3.800 USD, Data Transfer-Regional ~2.100 USD. Drill-down theo Usage type thấy {{NatGateway-Bytes}} và {{DataProcessing-Bytes}} của Logs tăng đột biến từ ngày 03/06. Đối chiếu lịch deploy: ngày 02/06 team platform chuyển workload sang EKS (Elastic Kubernetes Service — dịch vụ Kubernetes do AWS quản lý) và bật autoscaler mới. Bật VPC Flow Logs lọc theo NAT ENI (Elastic Network Interface — card mạng ảo gắn vào tài nguyên trong VPC) thấy lượng lớn lưu lượng HTTPS ra ECR/S3 đi qua NAT. Kiểm tra Log group bằng CloudWatch Logs Insights metric {{IncomingBytes}}: service {{checkout-api}} tăng ingest gấp 12 lần, sample log cho thấy mức DEBUG và log toàn bộ payload JSON.

**Nguyên nhân gốc:** (1) Node EKS mới scale liên tục kéo image 1,2GB từ ECR qua NAT vì thiếu VPC endpoint cho {{com.amazonaws.<region>.ecr.api}}, {{ecr.dkr}} và S3 gateway endpoint. (2) Biến cấu hình {{LOG_LEVEL=DEBUG}} được bật khi debug sự cố ngày 02/06 rồi quên trả về. (3) Kafka consumer (tầng xử lý đơn) đặt khác AZ với broker nên phát sinh {{DataTransfer-Regional-Bytes}} khi đọc liên AZ.

**Cách xử lý:** Trong 48 giờ: tạo VPC endpoint Interface cho ECR và Gateway endpoint cho S3 (gateway endpoint không tính phí data processing), giảm image xuống 420MB bằng multi-stage build, chỉnh Cluster Autoscaler ổn định hơn. Chuyển {{checkout-api}} về INFO, thêm sampling 10% cho request thành công, đặt retention 14 ngày. Bật {{client.rack}} để consumer ưu tiên đọc từ broker cùng AZ. Sau đó gắn tag owner/service/env bắt buộc và tạo AWS Budget + Cost Anomaly Detection cảnh báo Slack.

**Kết quả đo được:** Hoá đơn tháng 7 giảm còn 17.400 USD (thấp hơn baseline), NAT data processing giảm ~78%, ingest Logs giảm ~85%, data transfer liên AZ giảm ~60%. Không có ảnh hưởng hiệu năng hay SLA (Service Level Agreement — cam kết mức dịch vụ, ví dụ thời gian phản hồi/độ sẵn sàng).

> Senior tip: đặt **chi phí trên mỗi đơn vị nghiệp vụ** (USD trên 1.000 giao dịch, trên mỗi khách hàng hoạt động) làm chỉ số theo dõi. Tổng hoá đơn tăng khi kinh doanh tăng là bình thường; chi phí trên mỗi giao dịch tăng mới là vấn đề kiến trúc.`,
  follow: [
    'Vì sao data transfer liên AZ hay bị bỏ qua, và bạn giảm nó thế nào mà không hy sinh HA?',
    'Savings Plans và Reserved Instances: khi nào cam kết, cam kết bao nhiêu phần trăm?',
    'Bạn thuyết phục các team tự chịu trách nhiệm chi phí (showback/chargeback) ra sao?'
  ],
  tags: ['AWS', 'FinOps', 'cost', 'case study', 'solution architect']
},
{
  id: 'aws-056',
  topic: 'aws',
  level: 'lead',
  q: '(Case study SA) Bạn thiết kế nền tảng SaaS B2B trên AWS cho 800 doanh nghiệp, trong đó 5 khách lớn yêu cầu cô lập dữ liệu mạnh và cam kết hiệu năng riêng. Bạn chọn mô hình silo, pool hay bridge, cô lập tenant bằng gì, và tính chi phí theo tenant ra sao?',
  a: `**Tóm tắt:** Tôi dùng mô hình **lai (bridge)**: đa số tenant chạy **pool** (dùng chung hạ tầng, dữ liệu tách bằng tenant_id + kiểm soát truy cập theo tenant), các khách lớn hoặc có yêu cầu tuân thủ chạy **silo** (tài khoản/VPC/DB riêng, cùng một codebase và pipeline). Cô lập trong pool bằng nhiều lớp: **danh tính mang tenant** (claim trong token), **IAM theo thuộc tính (ABAC) với session tag** để mỗi request chỉ truy cập được dữ liệu của tenant đó, RLS hoặc partition key theo tenant ở tầng dữ liệu. Chi phí theo tenant đo bằng **metering** ở ứng dụng kết hợp tag/tài khoản cho silo.

### Ba mô hình
| Mô hình | Cô lập | Chi phí / tenant | Vận hành | Hợp với |
|---|---|---|---|---|
| Silo | Mạnh nhất (tài khoản/DB riêng) | Cao | Nhiều bản triển khai | Khách lớn, yêu cầu pháp lý |
| Pool | Logic (tenant_id, IAM, RLS) | Thấp | Một bản triển khai | Đa số khách nhỏ và vừa |
| Bridge | Kết hợp theo tầng hoặc theo nhóm khách | Trung bình | Phức tạp hơn | Thực tế phổ biến nhất |

### Cô lập trong pool — nhiều lớp
1. **Danh tính**: người dùng đăng nhập qua Cognito/IdP; token mang {{tenant_id}}; API Gateway/ứng dụng không bao giờ tin tenant_id gửi từ client.
2. **IAM ABAC**: service assume role với **session tag** {{tenant_id}}; policy chỉ cho truy cập DynamoDB item có partition key bắt đầu bằng tenant đó (điều kiện {{dynamodb:LeadingKeys}}) hoặc prefix S3 của tenant — lỗi code quên điều kiện cũng không đọc được tenant khác.
3. **Dữ liệu**: PostgreSQL RLS theo tenant (biến phiên đặt đầu transaction), hoặc schema/DB riêng cho tenant lớn; khoá KMS riêng cho tenant yêu cầu.
4. **Noisy neighbor**: rate limit và quota theo tenant (API Gateway usage plan, hoặc token bucket trong ứng dụng), hàng đợi theo tenant cho job nặng.

### Silo cho khách lớn
Mỗi khách lớn một **tài khoản AWS** trong OU riêng, dựng bằng cùng Terraform module/pipeline (tenant onboarding tự động); deploy theo "wave": pool trước, silo sau, có thể giữ khách lớn ở phiên bản chậm hơn một nhịp theo hợp đồng.

### Chi phí theo tenant
- Silo: tài khoản riêng → chi phí rõ ràng qua Cost Explorer.
- Pool: ứng dụng **ghi metric sử dụng theo tenant** (số request, thời gian CPU ước tính, GB lưu trữ, số token AI) rồi phân bổ chi phí dùng chung theo tỉ lệ. Kết quả dùng cho định giá gói và phát hiện tenant lỗ.

### Ví dụ đời thực
Một SaaS kế toán ban đầu chạy 100% pool. Khi ký với một tập đoàn lớn, họ yêu cầu DB riêng, khoá mã hoá riêng và SLA riêng; một khách khác chạy báo cáo cuối năm làm chậm mọi tenant khác 40 phút. Chuyển sang bridge: 6 khách lớn sang silo (tài khoản riêng, Aurora riêng, KMS key riêng), pool cho 790 khách còn lại với ABAC + RLS và quota báo cáo theo tenant. Metering cho thấy 3% tenant chiếm 41% chi phí pool → điều chỉnh bảng giá theo mức dùng. Không còn sự cố "một tenant làm chậm cả hệ thống".

### Trả lời mẫu khi phỏng vấn
"Tôi thường chọn mô hình lai. Đa số tenant nhỏ và vừa chạy pool để tối ưu chi phí và vận hành; khách lớn hoặc có yêu cầu tuân thủ chạy silo với tài khoản, DB và khoá mã hoá riêng, nhưng cùng một codebase và pipeline, onboarding tự động bằng Terraform. Trong pool, tôi cô lập nhiều lớp: tenant lấy từ token chứ không tin client; service truy cập dữ liệu bằng role có session tag tenant, policy IAM chỉ cho đọc partition hay prefix của tenant đó, nên lỗi code cũng không lộ dữ liệu tenant khác; tầng DB thêm RLS. Noisy neighbor xử lý bằng quota và rate limit theo tenant. Chi phí silo thì rõ theo tài khoản, còn pool thì ứng dụng ghi metric sử dụng theo tenant để phân bổ, dùng cho định giá và phát hiện tenant lỗ."

> Senior tip: viết một test tự động "tenant A không thấy dữ liệu tenant B" chạy trên **mọi** API và cả job nền, ở mỗi lần deploy. Rò rỉ chéo tenant là sự cố có thể chấm dứt một doanh nghiệp SaaS, và nó thường xuất hiện ở chỗ ít ai nghĩ tới như export, cache, search index.`,
  follow: [
    'Bạn chuyển một tenant từ pool sang silo mà không downtime thế nào?',
    'Cache và search index (ElastiCache, OpenSearch) cô lập theo tenant ra sao?',
    'Deploy phiên bản mới cho hàng trăm tenant silo một cách an toàn thế nào?'
  ],
  tags: ['AWS', 'multi-tenant', 'SaaS', 'ABAC', 'case study', 'solution architect']
},
{
  id: 'aws-057',
  topic: 'aws',
  level: 'senior',
  q: '(Case study SA) Một sự kiện mở bán vé dự kiến 400.000 người vào cùng lúc trong 5 phút đầu (gấp 50 lần bình thường). Hệ thống dùng CloudFront, API Gateway, Lambda và ECS. Những giới hạn (quota) nào sẽ gãy trước, và bạn thiết kế để không sập thế nào?',
  a: `**Tóm tắt:** Ở tải đột biến, thứ gãy trước thường **không phải CPU** mà là **quota và tốc độ scale**: Lambda concurrency của tài khoản (mặc định 1.000/region), tốc độ scale của Lambda và ECS, throttle của API Gateway, connection của DB, rate limit của đối tác thanh toán. Thiết kế: **hàng chờ ảo (waiting room)** ở cửa vào để chỉ cho số người hệ thống chịu được đi vào, **tách phần đọc** sang CDN/cache, **đệm phần ghi** bằng SQS, **giữ chỗ nguyên tử** trong DB/Redis, **scale trước** và **xin tăng quota trước** hàng tuần.

### Những gì gãy trước (kiểm tra trước sự kiện)
| Thành phần | Giới hạn cần kiểm tra |
|---|---|
| Lambda | Concurrency tài khoản (mặc định 1.000/region, xin tăng); tốc độ scale mỗi hàm (thêm khoảng 1.000–2.000 concurrency mỗi 10 giây); cold start Java (SnapStart) |
| API Gateway | Throttle mặc định của tài khoản (khoảng 10.000 rps, burst 5.000 — xin tăng), throttle theo stage/method |
| ECS/EKS | Thời gian thêm task/node (phút), giới hạn IP trong subnet, quota vCPU Fargate |
| DB | Max connections, IOPS, khoá dòng trên tồn kho vé |
| Đối tác | Rate limit cổng thanh toán, SMS OTP |
| Tài khoản | Service Quotas khác: ENI, NAT bandwidth, KMS request rate |

### Kiến trúc
~~~seq
title: Mở bán vé với hàng chờ ảo
actors: User | CloudFront | WaitingRoom | API | Queue | Worker
User -> CloudFront: vào trang sự kiện (trang tĩnh, cache)
CloudFront -> WaitingRoom: xin lượt vào
WaitingRoom --> User: số thứ tự, chờ tới lượt
WaitingRoom --> User: token vào cửa (có hạn 10 phút)
User -> API: giữ chỗ (kèm token)
API -> API: giữ chỗ nguyên tử (Redis/DB), trả mã giữ chỗ
API -> Queue: đơn chờ thanh toán
Queue -> Worker: xử lý thanh toán theo tốc độ cổng cho phép
~~~
- **Waiting room** (giải pháp AWS Virtual Waiting Room hoặc dịch vụ tương đương): cho vào theo nhịp đã load test được (ví dụ 2.000 người/phút), công bằng theo thứ tự, chặn bot bằng token có chữ ký.
- **Đọc**: trang sự kiện, sơ đồ chỗ ngồi là tĩnh trên CloudFront; số chỗ còn lại làm mới mỗi vài giây từ cache.
- **Giữ chỗ**: thao tác nguyên tử, có thời hạn 10 phút, hết hạn thì trả lại.
- **Thanh toán**: bất đồng bộ qua SQS, worker gọi cổng thanh toán theo hạn mức; người dùng thấy "đang xử lý".
- **Scale trước**: provisioned concurrency cho Lambda nóng, tăng số task ECS tối thiểu từ 1 giờ trước, warm DB/cache.

### Ví dụ đời thực
Lần mở bán đầu tiên không có waiting room: trong 90 giây, Lambda chạm giới hạn 1.000 concurrency, API Gateway trả 429 hàng loạt, client tự retry làm tải tăng gấp 3; DB hết connection; trang trắng 12 phút, mạng xã hội tràn phàn nàn. Lần sau: xin tăng Lambda concurrency lên 5.000 và API Gateway trước 3 tuần, waiting room cho vào 3.000 người/phút, giữ chỗ bằng Redis + xác nhận bằng UPDATE có điều kiện trong DB, thanh toán qua SQS. Đỉnh 420.000 người, không lỗi 5xx đáng kể, bán hết 18.000 vé trong 41 phút, không bán vượt.

### Pitfall
- Chỉ load test ứng dụng mà quên quota tài khoản và đối tác.
- Trông chờ autoscaling phản ứng kịp với đột biến trong vài chục giây.
- Client retry không có backoff → tự DDoS.
- Waiting room nhưng API phía sau không kiểm tra token → bot đi vòng.

### Trả lời mẫu khi phỏng vấn
"Với đột biến gấp 50 lần, thứ gãy trước thường là quota và tốc độ scale chứ không phải CPU: concurrency Lambda của tài khoản mặc định một nghìn mỗi region, tốc độ thêm concurrency, throttle của API Gateway, thời gian thêm task ECS, connection DB và rate limit cổng thanh toán. Nên tôi kiểm kê các giới hạn đó và xin tăng quota từ nhiều tuần trước. Về kiến trúc, tôi đặt hàng chờ ảo ở cửa vào để chỉ cho số người đã load test được đi vào, với token có chữ ký mà API kiểm tra. Phần đọc đưa lên CloudFront và cache. Giữ chỗ là thao tác nguyên tử có thời hạn. Thanh toán đẩy vào SQS để worker xử lý theo hạn mức của cổng. Tôi scale trước bằng provisioned concurrency và số task tối thiểu, và client retry có backoff."

> Senior tip: mở **Service Quotas** và liệt kê mọi quota mà luồng sự kiện chạm tới, ghi giá trị hiện tại, giá trị cần, ngày xin tăng. Quota là loại giới hạn không hiện ra trong load test ở môi trường khác tài khoản — và xin tăng có thể mất nhiều ngày.`,
  follow: [
    'Provisioned concurrency và SnapStart khác nhau thế nào cho Lambda Java?',
    'Bạn load test ở quy mô 400.000 người dùng mà không tốn quá nhiều tiền thế nào?',
    'Nếu cổng thanh toán chậm giữa sự kiện, giữ chỗ hết hạn thì xử lý công bằng ra sao?'
  ],
  tags: ['AWS', 'scalability', 'quota', 'waiting room', 'case study', 'solution architect']
},
{
  id: 'aws-058',
  topic: 'aws',
  level: 'lead',
  q: '(Case study SA) Core thanh toán của ngân hàng chạy ở một region AWS. Cơ quan quản lý yêu cầu RTO 30 phút, RPO dưới 1 phút khi mất cả region, nhưng ngân sách DR chỉ bằng 25% chi phí hiện tại. Bạn chọn chiến lược DR nào và chứng minh nó hoạt động ra sao?',
  a: `**Tóm tắt:** Với RTO 30 phút và RPO dưới 1 phút, **backup & restore** (RPO giờ, RTO nhiều giờ) không đạt, **active-active** đạt nhưng vượt ngân sách và đòi hỏi ứng dụng xử lý ghi đa region. Lựa chọn hợp lý là **pilot light / warm standby thu nhỏ**: **dữ liệu sao chép liên tục** (Aurora Global Database, S3 Replication), hạ tầng ở region phụ **dựng sẵn bằng IaC nhưng chạy tối thiểu** (cụm ECS/EKS 0–2 task, scale khi failover), chuyển hướng bằng **Route 53 Application Recovery Controller**, và **diễn tập định kỳ có bấm giờ** để chứng minh con số.

### So sánh bốn chiến lược
| Chiến lược | RPO | RTO | Chi phí so với prod | Ghi chú |
|---|---|---|---|---|
| Backup & restore | Giờ | Nhiều giờ | ~5–10% | Không đạt yêu cầu |
| Pilot light | Giây–phút | 30–60 phút | ~15–25% | Dữ liệu sẵn, compute dựng khi cần |
| Warm standby | Giây | 10–30 phút | ~30–50% | Chạy thu nhỏ, chỉ cần scale |
| Active-active | Gần 0 | Gần 0 | ~100%+ | Ứng dụng phải xử lý ghi đa region |
Chọn **pilot light nâng cấp**: DB và dữ liệu luôn sẵn; compute chạy tối thiểu để kiểm tra sức khoẻ liên tục; scale nhanh nhờ image đã có sẵn ở region phụ.

### Thành phần
- **Dữ liệu**: Aurora Global Database (lag thường dưới 1 giây → RPO đạt); S3 Replication có RTC cho chứng từ; secret và khoá KMS đã sao chép (multi-region keys); ECR replication cho image.
- **Hạ tầng**: cùng Terraform module, region phụ chạy với số task tối thiểu; quota (vCPU, IP, Lambda concurrency) đã xin trước cho mức chạy đầy đủ.
- **Chuyển hướng**: Route 53 ARC routing control (bật/tắt luồng traffic theo region, có quy tắc an toàn chống tắt cả hai); readiness check so cấu hình hai region.
- **Quy trình failover**: (1) quyết định failover (người có thẩm quyền, tiêu chí rõ); (2) promote Aurora ở region phụ; (3) scale compute; (4) chuyển routing control; (5) kiểm tra giao dịch mẫu; (6) thông báo. Mỗi bước có runbook tự động hoá được.

### Chứng minh bằng diễn tập
Diễn tập mỗi quý: mô phỏng mất region chính (chặn traffic, failover Aurora), đo thời gian từng bước, kiểm tra dữ liệu (đối soát giao dịch trước/sau). Kết quả diễn tập là **bằng chứng** nộp cho kiểm toán; mọi bước chậm trở thành việc cần cải tiến.

### Ví dụ đời thực
Lần diễn tập đầu tiên mất **2 giờ 10 phút**: secret của Secrets Manager chưa sao chép, quota vCPU Fargate ở region phụ chỉ đủ 20% tải, chứng chỉ ACM chưa tạo, một job cấu hình cứng endpoint DB region chính. Sau 2 vòng cải tiến (sao chép secret và KMS multi-region, xin quota, tham số hoá endpoint, tự động hoá runbook bằng Systems Manager): diễn tập thứ ba đạt **24 phút**, RPO đo được 0,8 giây. Chi phí DR khoảng 21% chi phí prod.

### Pitfall
- Chỉ sao chép dữ liệu, quên secret, khoá, image, quota, chứng chỉ, DNS.
- Không có tiêu chí và người quyết định failover → mất 1 giờ để họp.
- Failback (quay về region chính) không được lên kế hoạch.
- Chưa từng diễn tập → con số RTO chỉ là ước đoán.

### Trả lời mẫu khi phỏng vấn
"Với RTO 30 phút, RPO dưới một phút và ngân sách khoảng một phần tư, backup và restore không đạt, active-active thì quá đắt và đòi hỏi ứng dụng ghi đa region. Tôi chọn pilot light nâng cấp: dữ liệu sao chép liên tục bằng Aurora Global Database với lag dưới một giây và S3 Replication; hạ tầng region phụ dựng sẵn bằng cùng Terraform nhưng chạy tối thiểu, image, secret, khoá KMS đã sao chép, quota đã xin đủ cho tải đầy. Chuyển hướng bằng Route 53 Application Recovery Controller. Quy trình failover có tiêu chí và người quyết định rõ, các bước được tự động hoá. Và quan trọng nhất là diễn tập mỗi quý có bấm giờ, đối soát dữ liệu sau failover, dùng kết quả làm bằng chứng cho kiểm toán và làm danh sách cải tiến."

> Senior tip: con số RTO thật luôn nằm ở những thứ ngoài dữ liệu — secret, quota, chứng chỉ, endpoint cứng trong một job ít ai nhớ. Lần diễn tập đầu tiên hầu như luôn thất bại; lên lịch nó sớm, khi chưa có sự cố thật.`,
  follow: [
    'Failback về region chính sau sự cố bạn làm thế nào để không mất dữ liệu?',
    'Khi nào nên chuyển từ pilot light sang active-active?',
    'Bạn tránh tình huống cả hai region cùng nhận ghi (split-brain) khi failover ra sao?'
  ],
  tags: ['AWS', 'disaster recovery', 'RTO', 'RPO', 'Aurora Global', 'case study', 'solution architect']
},
{
  id: 'aws-059',
  topic: 'aws',
  level: 'lead',
  q: '(Case study SA) Đội phân tích chạy truy vấn báo cáo trực tiếp trên Aurora production làm chậm giao dịch. Họ cần dữ liệu gần thời gian thực (trễ dưới 5 phút) cho dashboard và mô hình rủi ro. Bạn thiết kế đường đưa dữ liệu sang nền tảng phân tích trên AWS thế nào?',
  a: `**Tóm tắt:** Tách **OLTP** khỏi **phân tích** bằng **CDC** (Change Data Capture — đọc log thay đổi của DB thay vì truy vấn bảng): lựa chọn đơn giản nhất là **Aurora zero-ETL integration với Amazon Redshift** (dữ liệu tự sao chép sang Redshift trong vài giây, không phải viết pipeline); nếu cần data lake mở và nhiều nguồn, dùng **Debezium (MSK Connect) hoặc DMS** đẩy thay đổi qua Kafka/Kinesis vào **S3 dạng bảng Apache Iceberg**, truy vấn bằng Athena/Redshift/Spark. Thêm lớp **quản trị dữ liệu**: che dữ liệu cá nhân, phân quyền theo cột/dòng (Lake Formation), catalog.

### Vì sao không chạy báo cáo trên replica là đủ
Read replica giảm tải cho primary, nhưng truy vấn phân tích (quét hàng trăm triệu dòng, join nhiều bảng) vẫn chậm trên DB dạng dòng, giữ transaction dài gây trễ replica, và đội phân tích vẫn phụ thuộc schema của ứng dụng (đổi schema là vỡ báo cáo).

### Hai kiến trúc
| Tiêu chí | Aurora zero-ETL → Redshift | CDC → Kafka → S3 Iceberg |
|---|---|---|
| Độ trễ | Giây | Vài giây đến phút |
| Công sức vận hành | Thấp (dịch vụ quản lý) | Cao hơn (connector, schema, compaction) |
| Nguồn dữ liệu | Aurora/RDS hỗ trợ | Bất kỳ (nhiều DB, sự kiện ứng dụng) |
| Định dạng mở / nhiều engine | Gắn với Redshift | Iceberg đọc được bằng Athena, Spark, Redshift |
| Hợp với | Một vài DB, đội nhỏ | Nền tảng dữ liệu nhiều nguồn |

### Luồng CDC chi tiết
~~~seq
title: CDC từ Aurora sang data lake
actors: Aurora | Debezium | Kafka | Sink | S3Iceberg | Athena
Aurora -> Debezium: đọc logical replication (WAL)
Debezium -> Kafka: sự kiện thay đổi theo bảng (key = khoá chính)
Kafka -> Sink: tiêu thụ theo lô mỗi 1-2 phút
Sink -> S3Iceberg: MERGE vào bảng Iceberg (upsert theo khoá)
Athena -> S3Iceberg: truy vấn dashboard, mô hình rủi ro
~~~
Lưu ý: logical replication giữ WAL nếu consumer ngừng → **theo dõi replication slot** để không đầy đĩa primary; bảng Iceberg cần **compaction** định kỳ (nhiều file nhỏ).

### Quản trị dữ liệu
- Phân loại cột (PII, tài chính); che hoặc băm số điện thoại, CCCD trước khi vào vùng phân tích chung.
- Lake Formation cấp quyền theo bảng/cột/dòng cho từng nhóm; mọi truy vấn có audit.
- **Data contract**: đội ứng dụng thông báo thay đổi schema; pipeline kiểm tra schema và cảnh báo thay vì vỡ âm thầm.

### Ví dụ đời thực
Một công ty cho vay tiêu dùng: dashboard rủi ro chạy truy vấn 8 phút trên Aurora mỗi 15 phút, p99 API giải ngân tăng gấp 4 lần trong lúc chạy. Giai đoạn 1 bật Aurora zero-ETL sang Redshift Serverless: dashboard chạy dưới 10 giây với dữ liệu trễ khoảng 15 giây, tải Aurora giảm 35%. Giai đoạn 2, khi cần kết hợp dữ liệu từ hệ thống CRM và sự kiện app, dựng thêm Debezium → MSK → Iceberg cho các nguồn đó. Một lần consumer CDC dừng 6 giờ vì lỗi quyền, replication slot giữ 180GB WAL — từ đó có cảnh báo độ trễ slot.

### Trả lời mẫu khi phỏng vấn
"Tôi tách phân tích khỏi OLTP bằng CDC, tức đọc log thay đổi của DB thay vì truy vấn trực tiếp bảng. Nếu nguồn là Aurora và nhu cầu chủ yếu là phân tích trên Redshift, tôi chọn zero-ETL integration: dữ liệu sang Redshift trong vài giây mà không phải tự viết pipeline. Nếu cần nền tảng dữ liệu nhiều nguồn và định dạng mở, tôi dùng Debezium hoặc DMS đẩy thay đổi qua Kafka vào S3 dưới dạng bảng Iceberg với upsert theo khoá, truy vấn bằng Athena hay Spark, nhớ compaction định kỳ. Hai điểm vận hành quan trọng: theo dõi replication slot để consumer dừng không làm đầy WAL của primary, và có data contract để thay đổi schema không làm vỡ báo cáo âm thầm. Kèm quản trị dữ liệu: che dữ liệu cá nhân, phân quyền theo cột và dòng bằng Lake Formation."

> Senior tip: đặt cảnh báo cho **độ trễ của replication slot** (lượng WAL bị giữ) ngay từ ngày đầu bật CDC. Đây là cách phổ biến nhất mà một pipeline phân tích "vô hại" làm đầy đĩa và đánh sập DB production.`,
  follow: [
    'Bạn xử lý thay đổi schema (thêm/đổi cột) trong pipeline CDC thế nào?',
    'Vì sao bảng Iceberg cần compaction và bạn lên lịch nó ra sao?',
    'Dữ liệu cá nhân trong data lake: che ở đâu, ai được xem bản gốc?'
  ],
  tags: ['AWS', 'CDC', 'data lake', 'Iceberg', 'Redshift', 'zero-ETL', 'case study', 'solution architect']
},
{
  id: 'aws-060',
  topic: 'aws',
  level: 'senior',
  q: '(Case study SA) Để giảm chi phí, team chuyển node EKS sang EC2 Spot. Từ đó thỉnh thoảng có đợt lỗi 5xx kéo dài 1–2 phút và một vài job xử lý dở bị mất. Bạn điều tra và thiết kế lại thế nào để vừa tiết kiệm vừa ổn định?',
  a: `**Tóm tắt:** Spot rẻ (giảm tới khoảng 70–90%) nhưng EC2 có thể **thu hồi với cảnh báo 2 phút**. Lỗi 5xx và job mất là dấu hiệu **ứng dụng và cluster chưa xử lý gián đoạn**: node bị thu hồi mà pod không được drain đúng cách, nhiều replica nằm cùng một loại instance bị thu hồi cùng lúc, job không có checkpoint. Thiết kế lại: **đa dạng loại instance và AZ**, **xử lý thông báo gián đoạn** (Karpenter hoặc Node Termination Handler để cordon và drain), **PodDisruptionBudget**, **graceful shutdown** đúng, giữ **một phần on-demand** cho thành phần quan trọng, và job phải **idempotent + checkpoint**.

### Điều tra
- Đối chiếu thời điểm lỗi với sự kiện **EC2 Spot Interruption** (EventBridge) và sự kiện node NotReady trong cluster.
- Xem pod của service lỗi nằm trên những node nào: nếu 4/6 replica cùng nằm trên một loại instance (ví dụ chỉ m5.xlarge ở một AZ), một đợt thu hồi lấy mất phần lớn năng lực.
- Kiểm tra pod có nhận SIGTERM và kết thúc trong thời gian cho phép không (preStop, terminationGracePeriodSeconds), readiness có tắt sớm không.

### Thiết kế lại
| Vấn đề | Cách xử lý |
|---|---|
| Thu hồi đồng loạt | Đa dạng hoá: nhiều instance family/size (m5, m6i, m6a, c6i…), nhiều AZ; Karpenter chọn từ danh sách rộng với chiến lược ưu tiên pool ít bị thu hồi |
| Node bị lấy mà pod chưa drain | Karpenter (interruption queue) hoặc AWS Node Termination Handler: nhận cảnh báo 2 phút / rebalance recommendation → cordon, drain, tạo node thay thế trước |
| Nhiều replica cùng đi | PodDisruptionBudget (ví dụ minAvailable 70%), topologySpreadConstraints theo AZ và node |
| Request đang xử lý bị cắt | Graceful shutdown: preStop sleep, server.shutdown=graceful, thời gian tổng < 2 phút |
| Job mất tiến độ | Job idempotent, checkpoint theo lô, dùng hàng đợi có visibility timeout để việc chưa xong được giao lại |
| Thành phần quan trọng | Node pool on-demand cho stateful, ingress controller, CoreDNS, service thanh toán |

### Ví dụ đời thực
Một nền tảng giao đồ ăn chuyển 100% node sang Spot, tiết kiệm 62% chi phí EC2 nhưng mỗi tuần có 3–4 đợt 5xx. Điều tra: node group chỉ dùng 2 loại instance trong một AZ; không có Node Termination Handler nên node biến mất đột ngột; job tính hoa hồng chạy 40 phút không checkpoint. Sau khi chuyển sang Karpenter với 14 loại instance trên 3 AZ, bật interruption handling, PDB và topology spread, đưa CoreDNS/ingress/payment sang pool on-demand (khoảng 20% node), chia job thành lô có checkpoint: tiết kiệm còn 54% nhưng không còn đợt 5xx nào liên quan Spot trong 2 tháng; job bị gián đoạn tự tiếp tục từ lô cuối.

### Pitfall
- Chỉ chọn một hai loại instance "rẻ nhất" → thu hồi đồng loạt.
- terminationGracePeriodSeconds dài hơn 2 phút trên Spot → bị kill giữa chừng.
- Chạy DB, Kafka broker hay stateful set quan trọng trên Spot không có kế hoạch.
- Không có PDB → drain một lúc nhiều node lấy hết replica.

### Trả lời mẫu khi phỏng vấn
"Spot có thể bị thu hồi với cảnh báo hai phút, nên lỗi 5xx và job mất cho thấy hệ thống chưa xử lý gián đoạn. Tôi điều tra bằng cách đối chiếu thời điểm lỗi với sự kiện Spot interruption và xem replica của service nằm trên node nào; thường là quá ít loại instance nên bị thu hồi cùng lúc, và không có cơ chế drain. Thiết kế lại gồm: đa dạng nhiều loại instance và AZ, dùng Karpenter hoặc Node Termination Handler để nhận cảnh báo, cordon, drain và tạo node thay thế trước; PodDisruptionBudget và topology spread để không mất nhiều replica một lúc; graceful shutdown hoàn tất trong dưới hai phút; job idempotent có checkpoint và dùng hàng đợi để việc dở được giao lại. Thành phần quan trọng như ingress, DNS, stateful và thanh toán đặt trên node on-demand. Như vậy vẫn tiết kiệm lớn mà ổn định."

> Senior tip: diễn tập gián đoạn Spot có chủ đích bằng **AWS Fault Injection Service** (hành động gửi interruption cho Spot instance) trên staging, đo lỗi phía người dùng. Nếu không thử, cơ chế drain gần như chắc chắn có một chỗ cấu hình sai.`,
  follow: [
    'Karpenter khác Cluster Autoscaler thế nào trong việc chọn instance Spot?',
    'Workload nào tuyệt đối không nên chạy trên Spot?',
    'Bạn tính tỉ lệ on-demand và Spot hợp lý cho một cluster ra sao?'
  ],
  tags: ['AWS', 'EKS', 'Spot', 'Karpenter', 'cost', 'resilience', 'case study']
},
{
  id: 'aws-061',
  topic: 'aws',
  level: 'senior',
  q: '(Case study SA) Một access key IAM của tài khoản dev bị lộ lên GitHub công khai. 2 giờ sau, có 40 instance GPU được tạo ở 5 region để đào tiền mã hoá, hoá đơn tăng nhanh. Bạn phản ứng thế nào trong giờ đầu, và thay đổi gì để không lặp lại?',
  a: `**Tóm tắt:** Giờ đầu theo thứ tự **chặn → thu hồi → điều tra → dọn dẹp**: vô hiệu hoá access key, chặn quyền của danh tính bị lộ, tìm và xoá **mọi** tài nguyên kẻ tấn công tạo (kể cả cơ chế **bám trụ** như IAM user/role/key mới, Lambda, EventBridge rule) ở **mọi region**, dựa trên CloudTrail; liên hệ AWS Support về hoá đơn. Dài hạn: **bỏ access key dài hạn** (SSO, role, OIDC cho CI), **SCP** chặn region không dùng và loại instance đắt, **GuardDuty**, budget/anomaly alert, secret scanning chặn ngay khi push.

### Giờ đầu — từng bước
1. **Vô hiệu hoá** access key (không xoá ngay để giữ bằng chứng); nếu không chắc phạm vi, gắn policy từ chối tất cả (deny-all) cho user đó. AWS thường tự gắn policy cách ly (AWSCompromisedKeyQuarantine) khi phát hiện key công khai — nhưng **không** dựa vào đó.
2. **Ai đã làm gì**: CloudTrail Lake/Athena lọc theo access key ID: {{RunInstances}}, {{CreateUser}}, {{CreateAccessKey}}, {{AttachUserPolicy}}, {{CreateRole}}, {{PutBucketPolicy}}, {{CreateFunction}}… trên **tất cả region**.
3. **Dừng thiệt hại**: terminate instance ở mọi region (kiểm tra cả Spot request, Launch Template, Auto Scaling group kẻ tấn công tạo để tự dựng lại); xoá IAM user/role/key mới tạo; kiểm tra bucket bị đổi quyền (lộ dữ liệu?).
4. **Kiểm tra lộ dữ liệu**: có {{GetObject}}/{{ListBucket}} trên bucket nhạy cảm không; key có quyền gì với tài khoản khác (assume role)?
5. **Thông báo**: đội bảo mật, quản lý; mở case với AWS Support (thường hỗ trợ xem xét phí phát sinh do sự cố khi khách hàng đã khắc phục).
6. **Xoay vòng** mọi secret có thể bị lộ cùng repo.

### Vì sao chuyện này hay xảy ra
Key dài hạn của dev có quyền rộng ({{AdministratorAccess}} "cho tiện"), không giới hạn region, không có cảnh báo chi phí theo giờ. Bot quét GitHub tìm key AWS chỉ trong vài phút sau khi push.

### Phòng ngừa
| Lớp | Biện pháp |
|---|---|
| Danh tính | IAM Identity Center (SSO, credential tạm thời), CI dùng OIDC (GitHub Actions → role), cấm tạo access key dài hạn bằng SCP |
| Giới hạn | SCP chỉ cho phép region đang dùng; chặn instance GPU/loại đắt ở tài khoản dev; quota thấp ở tài khoản dev |
| Phát hiện | GuardDuty (phát hiện đào coin, gọi API từ IP bất thường), Security Hub, CloudTrail tổ chức |
| Chi phí | AWS Budgets theo ngày, Cost Anomaly Detection cảnh báo tức thì |
| Mã nguồn | Secret scanning + push protection, pre-commit hook (gitleaks) |

### Ví dụ đời thực
Một startup bị đúng tình huống này: key admin của một dev nằm trong file .env bị commit. Trong 3 giờ, kẻ tấn công tạo 48 instance GPU ở 7 region và một IAM user mới để quay lại sau. Đội phát hiện nhờ cảnh báo budget lúc chi phí trong ngày vượt 5 lần bình thường; dọn dẹp mất 2 giờ, IAM user "dự phòng" của kẻ tấn công chỉ được tìm ra nhờ truy CloudTrail đầy đủ. Hoá đơn phát sinh khoảng 11.000 USD, phần lớn được AWS xem xét hỗ trợ sau khi nộp báo cáo khắc phục. Sau đó: SSO cho mọi người, OIDC cho CI, SCP chặn region và GPU ở dev, GuardDuty bật cho toàn Organization.

### Trả lời mẫu khi phỏng vấn
"Trong giờ đầu tôi làm theo thứ tự chặn, thu hồi, điều tra, dọn dẹp. Vô hiệu hoá ngay access key và gắn deny-all cho danh tính bị lộ. Dùng CloudTrail lọc theo access key đó trên mọi region để biết kẻ tấn công đã làm gì: tạo instance, tạo IAM user hay key mới để bám trụ, sửa bucket policy, tạo Lambda hay rule. Sau đó xoá toàn bộ tài nguyên và cơ chế bám trụ, kiểm tra xem dữ liệu có bị đọc không, xoay vòng các secret liên quan, báo đội bảo mật và mở case với AWS về chi phí. Dài hạn, tôi loại bỏ access key dài hạn bằng SSO và OIDC cho CI, dùng SCP giới hạn region và loại instance ở tài khoản dev, bật GuardDuty, budget và anomaly alert theo ngày, và secret scanning chặn ngay khi push."

> Senior tip: **truy hết CloudTrail** trước khi tuyên bố "đã dọn xong". Kẻ tấn công chuyên nghiệp gần như luôn tạo một đường quay lại (IAM user, access key mới, role tin cậy tài khoản lạ) — xoá instance mà bỏ sót nó là sự cố thứ hai đang chờ.`,
  follow: [
    'Vì sao vô hiệu hoá trước rồi mới xoá key?',
    'Bạn thiết kế SCP chặn region không dùng thế nào mà không chặn dịch vụ global như IAM, CloudFront?',
    'CI/CD dùng OIDC để lấy quyền AWS hoạt động ra sao?'
  ],
  tags: ['AWS', 'security', 'incident response', 'IAM', 'GuardDuty', 'case study']
},
{
  id: 'aws-062',
  topic: 'aws',
  level: 'senior',
  q: 'Spring Boot chạy trong container trên EKS hoặc ECS Fargate, pod lại bị OOMKilled và khởi động lại liên tục. JVM có tự nhận giới hạn bộ nhớ của container không, và bạn cấu hình heap cùng HikariCP như thế nào cho phù hợp?',
  a: `**Tóm tắt:** Java 17 trở lên có thể đọc giới hạn bộ nhớ của container qua cgroup, nhưng mặc định JVM chỉ lấy một phần tư bộ nhớ container làm heap. Bạn cần thiết lập heap khoảng 70-80% giới hạn container, để chỗ cho metaspace, ngăn xếp luồng, code cache và bộ nhớ ngoài heap; HikariCP đặt theo số vCPU, không theo bộ nhớ.

### Thuật ngữ
- **Container / pod**: đóng gói ứng dụng chạy độc lập; pod là đơn vị nhỏ nhất trên EKS, có một hoặc nhiều container.
- **cgroup**: cơ chế Linux giới hạn CPU và bộ nhớ của một nhóm quá trình; Fargate và EKS dùng cgroup để đặt hạn mức cho pod.
- **OOMKilled (mã 137)**: Linux giết quá trình vì vượt giới hạn bộ nhớ; container khởi động lại, ứng dụng bị gián đoạn.
- **Heap**: vùng bộ nhớ JVM chứa đối tượng Java (instance, mảng…).
- **Metaspace**: chứa metadata của class (tên class, method…), nằm ngoài heap.
- **Code cache**: chứa mã máy sau khi JIT biên dịch code nóng.
- **Thread stack**: mỗi luồng có vùng nhớ riêng gọi hàm và lưu biến cục bộ.
- **Off-heap**: bộ nhớ JVM dùng bên ngoài heap (direct buffer, thread stack…).
- **HikariCP**: connection pool chuẩn của Spring Boot quản lý kết nối tới CSDL.
- **vCPU**: đơn vị xử lý ảo mà AWS gói cho task Fargate.
- **GC stop-the-world**: JVM tạm dừng toàn bộ ứng dụng để dọn rác, làm response tăng đột ngột.

### Cơ chế từng bước
1. Pod khởi động với hạn mức bộ nhớ (ví dụ 1 GB), Linux ghi con số này vào cgroup.
2. JVM khởi động, đọc cgroup để biết hạn mức, rồi tính heap = hạn mức × MaxRAMPercentage. Mặc định MaxRAMPercentage = 25, nên với 1 GB heap chỉ 256 MB.
3. Ứng dụng chạy: heap chứa đối tượng, metaspace chứa class mà Spring nạp, mỗi luồng có stack riêng, code cache chứa mã đã biên dịch. Những vùng này **không** nằm trong heap.
4. Nếu heap + metaspace + stack + off-heap vượt 1 GB, Linux phản ứng OOMKilled, container dừng và pod khởi động lại. Triệu chứng: container dừng với mã 137, log có OutOfMemoryError, hoặc container biến mất mà không rõ lý do.
5. Nếu heap giữ 25% trên container lớn, GC chạy liên tục, ứng dụng đứng lại mỗi lần dọn rác, response p99 xấu dù container không chết.

### Cấu hình Java
~~~bash
# Truyền vào Dockerfile hoặc task definition ECS/EKS
# Container limit 1 GB => heap khoảng 768 MB (75%), còn lại cho metaspace, stack, off-heap
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-XX:+UseG1GC", "-jar", "app.jar"]
~~~
MaxRAMPercentage=75.0 nghia la heap bang 75% bo nho container ma JVM nhin thay. Voi Fargate 1 GB: heap khoang 768 MB, con lai khoang 256 MB cho metaspace (Spring nap hang nghin class), stack cua hang tram luong va code cache. Neu dat 100%, container chap chuan bi OOMKill vi bo nho ngoai heap khong duoc tinh vao heap.

### HikariCP theo vCPU, khong theo bo nho
Pool ket nen duoc nen khop voi suc xu ly CPU, vi moi ket noi dang hoat dong chiem mot luong xu ly truy van. Quy tac co ban: maximumPoolSize = 2 * vCPU + 1. Fargate task 0,5 vCPU => pool khoang 2-5 ket noi. Dat pool 50 ket noi tren task 0,5 vCPU thi 50 luong tran CPU, chuyen nhieu luong, CSDL cung bi qua tai.

| Cau hinh | Nghia | Khuyen nghich |
|---|---|---|
| -XX:MaxRAMPercentage | Ty le bo nho container dung lam heap | 70-75% (Java 17 tro len) |
| Heap qua nho | GC lien tuc, p99 cao | Tang dan theo CloudWatch |
| Heap bang 100% gioi han container | OOMKill vi metaspace, stack, off-heap | Khong bao duoc lam |
| HikariCP maximumPoolSize | So ket noi CSDL dong thoi | 2 * vCPU + 1, giam sat ActiveConnections |

### Loi hay gap
- **Giu heap mac dinh 25% tren container lon.** Trieu chung: GC chiem 30-40% CPU, response cham. Cach sua: tang MaxRAMPercentage len 70-75%.
- **Dat heap bang 100% gioi han.** Trieu chung: bi OOMKill ngau rieng, dac biet khi traffic bat phat sinh nhieu luong. Cach sua: de khoang trong 20-25% cho bo nho ngoai heap.
- **Hikari pool theo "ca nhieu ket noi ca tot".** Trieu chung: CPU module hoa, CSDL cham vi qua nhieu session. Cach sua: gan pool voi vCPU, theo doi ActiveConnections tren CloudWatch.

### Vi du doi thuc
Mot task Fargate 1 GB chay Spring Boot voi Postgre qua Hikari. Mac dinh heap 256 MB: sau 2 chieu chay, GC lien tuc, p99 response tu 200 ms len 2 giay, CloudWatch memory utilization nhay 90-95%. Doi sua task definition: -XX:MaxRAMPercentage=75.0, heap khoang 768 MB, Hikari pool 5 ket noi (task 0,5 vCPU). Ket qua: memory utilization on dinh 65-75%, GC giam xuong duoi 5% CPU, p99 ve 300 ms, task chay ca tuan khong khoi dong lai.

### Tra loi mau khi pham van
"Khi Spring Boot chay trong container tren EKS hay Fargate, JVM doc gioi han bo nho qua cgroup, nhung mac dinh chi lay mot phu tu lam heap. Toi thiet lap MaxRAMPercentage 70-75% de heap khoang 768 MB voi container 1 GB, de lai cho cho metaspace, stack luong va off-heap, tranh OOMKilled ma 137. HikariCP tinh theo vCPU, quy tac hai vCPU cong mot ket noi, vi pool lon khong giup neu CPU het. Tu do, toi theo doi memory utilization va thoi gian GC tren CloudWatch, chinh dan thay vi dat theo cam tinh."

> Senior tip: khong bao giu dat heap bang 100% gioi han container. JVM chi dem heap trong MaxRAMPercentage; metaspace, stack, code cache, direct buffer nam ngoai heap, nen gioi han container phai con cho cho chung, neu khong Linux sechet pod ma Java kip bao loi.
`,
  follow: [
    'Vì sao pod bị OOMKilled dù CloudWatch chỉ cho 85% bộ nhớ dùng?',
    'G1GC hay ZGC phù hợp hơn cho container nhỏ?',
    'Hibernate cùng Hikari pool nhỏ thì connection chờ thế nào, sửa ra sao?'
  ],
  tags: ['JVM', 'container', 'ECS', 'EKS', 'Fargate', 'HikariCP', 'OOM']
},
{
  id: 'aws-063',
  topic: 'aws',
  level: 'senior',
  q: 'Hệ thống Spring Boot cần xử lý sự kiện: đơn hàng, clickstream và log. Khi nào chọn SQS, Kinesis hay MSK, và trade-off chính giữa ba dịch vụ là gì?',
  a: `**Tóm tắt:** SQS là hàng đợi tin nhắn đơn giản: một tin nhắn được giao cho một consumer, phù hợp tác vụ ngầm như gửi email xác nhận đơn hàng. Kinesis là luồng dữ liệu thời gian thực: dữ liệu chia thành các shard, nhiều nhóm consumer có thể đọc cùng một shard và giữ thứ tự trong mỗi shard, phù hợp clickstream. MSK là Kafka do AWS quản lý: consumer tự quản vị trí đã đọc (offset), hỗ trợ topic lưu trữ lâu và xử lý đúng một lần, phù hợp khi cần replay dữ liệu cũ hoặc hệ sinh thái Kafka. Java gọi qua AWS SDK v2: SQS dùng SendMessage/ReceiveMessage, Kinesis dùng PutRecord, MSK dùng Kafka ProducerRecord.

### Thuật ngữ
- **Queue (hàng đợi)**: nơi đợi tin nhắn cho đến khi consumer lấy đi xử lý.
- **Message (tin nhắn)**: đơn vị dữ liệu trong SQS.
- **At-least-once (ít nhất một lần)**: tin nhắn có thể được xử lý lại nếu consumer chưa xóa nó, nên code phải chịu được xử lý trùng.
- **Exactly-once (đúng một lần)**: mỗi tin nhắn xử lý đúng một lần, cần transaction và quản offset cẩn thận.
- **Shard (mảnh luồng)**: đơn vị lưu và đọc/ghi của Kinesis, mỗi shard có giới hạn throughput.
- **Partition (phân vùng)**: trong Kafka/MSK, dữ liệu chia thành phân vùng, mỗi phân vùng có thứ tự riêng.
- **Consumer group (nhóm consumer)**: nhóm consumer chia sẻ việc đọc các phân vùng.
- **Offset (vị trí đọc)**: dấu hiệu biết consumer đã đọc đến đâu trong luồng.
- **Broker (máy chủ)**: máy chủ Kafka lưu topic và phân vùng.
- **Topic (chủ đề)**: danh mục tin nhắn trong Kafka/MSK.
- **Dead letter queue (hàng thư nghĩ)**: nơi đưa tin nhắn xử lý thất bại nhiều lần để kiểm tra sau.

### Cơ chế từng bước
**SQS:** nhà phát triển gọi SendMessage đẩy tin nhắn vào hàng đợi; consumer gọi ReceiveMessage lấy tin nhắn, xử lý xong rồi gọi DeleteMessage để AWS biết đã xong và không gửi lại. Nếu consumer chết trước khi xóa, tin nhắn về lại hàng đợi sau visibility timeout (thời gian khóa tin nhắn khi đang xử lý).
**Kinesis:** nhà phát triển gọi PutRecord ghi dữ liệu vào một shard với khóa phân vùng; dữ liệu trong cùng shard giữ thứ tự ghi; các consumer trong cùng group chia shard và theo dõi offset riêng.
**MSK:** nhà phát triển dùng Kafka client gửi ProducerRecord vào topic/partition; consumer nhóm nhau theo group id, tự lưu offset, có thể đọc lại dữ liệu cũ (replay) trong thời gian lưu trữ của topic.

~~~java
// SQS qua AWS SDK v2: gui va nhan tin nhan
SqsClient sqs = SqsClient.create();
sqs.sendMessage(b -> b.queueUrl(queueUrl).messageBody("{\"orderId\":123,\"action\":\"confirm\"}"));
List<Message> msgs = sqs.receiveMessage(b -> b.queueUrl(queueUrl).maxNumberOfMessages(10).waitTimeSeconds(20)).messages();
for (Message m : msgs) {
    // xu ly m.body()
    // Quan trong: xoa tin nhah sau khi xu ly xong de khong nhan lai
    sqs.deleteMessage(b -> b.queueUrl(queueUrl).receiptHandle(m.receiptHandle()));
}
~~~

### Bang so sanh thuc duct
| Tieu chi | SQS | Kinesis | MSK |
|---|---|---|---|
| Mo hinh | Hang doi tin nhan | Luong du lieu thoi gian thuc | Kafka quan ly |
| Thu tu | Khong (trong FIFO co) | Trong moi shard | Trong moi partition |
| Nguoi dung | Mot consumer xu ly mot tin nhan | Nhieu group doc cung shard | Nhieu group, tu quan ly offset |
| Giu du lieu | Xoa sau khi xu ly | 1-365 ngay | 1-365 ngay, hoac lau hon |
| Chi phi | Theo tin nhan | Theo shard thanh thang | Theo broker, storage, giay |
| Dung khi nao | Tac vu ngam, email, thanh toan | Clickstream, log, IoT | Event sourcing, replay, Kafka |

### Loi hay gap
- **Visibility timeout SQS ngan hon thoi gian xu ly.** Trieu chung: cung tin nhan duoc xu ly hai lan (trung lap). Cach sua: dat timeout lon hon thoi gian xu ly toi da, hoac xoa tin nhan ngay sau khi xu ly xong, dung DLQ cho tin nhan that bai nhieu lan.
- **Shard Kinesis qua it.** Trieu chung: ghi bi che chok (ProvisionedThroughputExceededException), can reshard de tang so shard.
- **MSK consumer reset offset ve dau.** Trieu chung: doc lai du lieu cu, lam sai bao cao. Cach sua: luon luu offset, chi reset khi co y muon.

### Vi du doi thuc
He thong don hang 200 don/gio => SQS standard, mot consumer xu ly tu dong. Clickstream 5000 su kien/giay => Kinesis 5 shard (moi shard 1 MB/s ghi, 2 MB/s doc), hai group consumer (analytics va luu S3). He thong can replay lich su 7 ngay => MSK, topic giu du lieu 7 ngay, consumer doc lai tu bat dau khi can.

### Tra loi mau khi pham van
"Toi chon dich vu dua theo mot hang su kien co bao nhieu nguoi doc va can thu tu nhu the nao. SQS la hang doi don gian, mot tin nhan mot nguoi xu ly, phu hop cho tac vu ngam nhan gui email xac nhan don hang; neu thutu don hang quan trong va khong duoc trung lap, toi dung SQS FIFO voi message group id la ma don hang. Kinesis luu du lieu thanh cac shard, nhieu nhom consumer co the doc cung luong va giu thu tu trong moi shard, phu hop clickstream 5000 su kien/giay. MSK la Kafka quan ly, consumer tu quan ly offset, co the replay du lieu cu, toi chon khi can he thong Kafka va kiem soat offset chinh xac. Chi phi cung khac: SQS theo tin nhan, Kinesis theo shard, MSK theo broker va storage."

> Senior tip: voi du lieu clickstream, tinh thu tu thu tu trong shard nen chia shard theo ma nhan hang (userId) de su kien cua cung nguoi dung luu thu tu; chia theo ma ngau nhien se mat thu tu theo nguoi dung.
`,
  follow: [
    'Vì sao SQS standard không đảm bảo thứ tự, và FIFO khắc phục thế nào?',
    'Kinesis shard quá ít thì thấy biểu hiện gì, và reshard hoạt động như thế nào?',
    'MSK consumer quên lưu offset thì nguy cơ gì?'
  ],
  tags: ['SQS', 'Kinesis', 'MSK', 'event-driven', 'SDK v2', 'thứ tự']
},
{
  id: 'aws-064',
  topic: 'aws',
  level: 'senior',
  q: 'DynamoDB: thiết kế partition key, tránh hot partition, dùng GSI như thế nào, và ứng dụng Java xử lý ProvisionedThroughputExceededException ra sao?',
  a: `**Tóm tắt:** DynamoDB băm partition key để quyết định dữ liệu nằm phân vùng nào; cùng một partition key bị truy cập nhiều tạo hot partition (phân vùng nóng); GSI tạo chỉ mục theo thuộc tính khác để truy xuất linh hoạt hơn; adaptive capacity tự mở rộng phân vùng nóng nhưng có giới hạn; AWS SDK v2 tự retry với exponential backoff (thời gian chờ tăng dần) và jitter (thêm thành phần ngẫu nhiên) để tránh nhiều client gửi lại cùng lúc sau khi dịch vụ khôi phục.

### Thuật ngữ
- **Partition key (khoa phan vung)**: thuoc tinh duoc bam de xac dinh phan vung luu du lieu.
- **Sort key (khoa sap xep)**: thuoc tinh sap xep doi tuong trong cung mot partition key.
- **Partition (phan vung)**: khoi luu du lieu co dinh trong DynamoDB.
- **Hot partition (phan vung no)**: mot phan vung duoc truyen xuat qua nhieu so voi cac phan vung khac, lam cham het bang.
- **GSI (Global Secondary Index)**: chi muc thuoc cap toan cuc theo thuoc tinh khac partition key cua bang goc.
- **Eventual consistency (doc duoc cuoi cung)**: doc GSI co the chua thay du lieu vua vi, can doi khoang mot giay phut.
- **ProvisionedThroughputExceededException (vua gioi han throughput)**: ngoai le khi gap gioi han doc/ghi da dat truoc cua bang hoac partition.
- **Exponential backoff (thoi gian cho tang luay)**: loi thuong lai voi khoang cach thoi gian dan dan.
- **Jitter (phan tu ngau nhien)**: them so ngau nhien vao thoi gian cho de tranh nhieu client gui lai cung luc.
- **Provisioned capacity (suc dung da dat)**: doc/ghi bang so luong ban dat truoc.
- **On-demand (theo su dung)**: tra theo so luong doc/ghi thuc su, khong can dat truoc.

### Co che buoc buoc
1. Ghi du lieu: DynamoDB băm partition key (vi du ORDER#123) -> chon mot partition -> luu. Cung partition key luu cung phan vung.
2. Doc qua partition key: nhanh, du lieu chinh xac.
3. Tao GSI: chon mot thuoc tinh khac (vi du customerId) lam khoa chi muc; DynamoDB sao chep du lieu sang chi muc nay.
4. Doc qua GSI: chi muc co partition key khac, nhung ket qua chi duoc dong bo cuoi cung (co the chua thay du lieu vua vi).
5. Gap gioi han: SDK ngoai le ProvisionedThroughputExceededException, tu thu lai voi khoang cho tang dan va ngau nhien.

~~~java
// DynamoDB qua AWS SDK v2: ghi va truy van GSI
DynamoDbClient db = DynamoDbClient.create();
String table = "DonHang";
// Ghi: partition key = ORDER#<maDon>, sort key = META
Map<String, AttributeValue> item = new HashMap<>();
item.put("PK", AttributeValue.fromS("ORDER#123"));
item.put("SK", AttributeValue.fromS("META"));
item.put("customerId", AttributeValue.fromS("c42"));
item.put("amount", AttributeValue.fromN("150000"));
db.putItem(b -> b.tableName(table).item(item));
// Truy van don hang cua khach qua GSI (gsi1pk = CUSTOMER#<maKhach>)
db.query(b -> b.tableName(table)
    .indexName("GSI1")
    .keyConditionExpression("gsi1pk = :v")
    .expressionAttributeValues(Map.of(":v", AttributeValue.fromS("CUSTOMER#c42"))));
~~~

### Bang so sanh
| Tham so | Dung khi nao | Luu y |
|---|---|---|
| Partition key | Khoa chinh de phan bo du lieu | Phai phan bo dan, tranh mot khoa qua tai |
| Sort key | Sap xep va lay nhieu dong cung partition | Cho truy van khoang (e.g. theo ngay) |
| GSI | Tim kiem theo thuoc tinh khac partition key | Doc duoc cuoi cung, them chi phi ghi |

### Loi hay gap
- **Partition key merchantId mot mot ban chung ban 80% don hang.** Trieu chung: hot partition, ProvisionedThroughputExceededException. Cach sua: them ma vung vao khoa (MERCHANT#m01#VN) hoac them so ngau nhien cuoi de chia tai.
- **Khong co sort key.** Trieu chung: de lay don hang cua khach phai Scan toan bang, cham va dat. Cach sua: dung SK hoac GSI.
- **Doc GSI ngay sau khi vi.** Trieu chung: ket qua chua co don hang vua them (doc duoc cuoi cung). Cach sua: doc lai sau khoang khoi, hoac doc bang goc neu can chinh xac.

### Vi du doi thuc
He thong ghi 10.000 don hang/giay. Partition key orderId ngau nhien => tai phan bo dan, khong co hot partition. Neu partition key merchantId va mot ban chung ban 80% don hang => mot partition qua tai, cac ghi cua ban khac bi cham, SDK ngoai le ProvisionedThroughputExceededException. Sua: PK = MERCHANT#<maBan>#<maVung> (chia tung ban, tung vung) hoac them so ngau nhien 0-9 cuoi khoa; tai bang co the tang mot lan nua va qua khoi khoi.

### Tra loi mau khi pham van
"Toi thiet lap bang DynamoDB bat dau tu cac truy van thuc te, chon partition key phan bo tai dan de tranh hot partition, va them sort key hoac GSI khi can truy van theo thuoc tinh khac. Neu gap loi vuot gioi han doc/ghi, toi kiem tra xem mot partition key co bi tai qua nhieu khong (hot partition) va chia khoa bang them ma vung hoac so ngau nhien cuoi. GSI minh chua chi muc theo ma khach hang, nhung nho rang doc GSI chi duoc dong bo cuoi cung nen khong doc ngay sau khi vi neu can chinh xac 100%. SDK Java tu thu lai voi khoang cho tang dan va ngau nhien, toi giu mac dinh va giiam suc truyen neu loi van lap lai."

> Senior tip: thiet lap bang quanh truy van thuc te khong phai mo hinh quan he; mot bang duy nhat (single-table) voi nhieu GSI thong thai hon nhieu bang nho, vi DynamoDB khong co join.
`,
  follow: [
    'Hot partition là gì và DynamoDB phản ứng thế nào (adaptive capacity)?',
    'GSI đọc có thể bị cũ bao lâu, và khi nào đọc bảng gốc thay vì GSI?',
    'Provisioned vs On-demand: chọn cái nào cho workload đột biến?'
  ],
  tags: ['DynamoDB', 'partition key', 'hot partition', 'GSI', 'SDK v2', 'single-table']
},
{
  id: 'aws-065',
  topic: 'aws',
  level: 'lead',
  q: 'Lambda Java cold start hình thành từ đâu, SnapStart khôi phục ra sao, và khi nào chọn Provisioned Concurrency thay vì SnapStart?',
  a: `**Tóm tắt:** Cold start là chi phí tạo môi trường mới (microVM, máy ảo nhỏ) và khởi chạy code trước lần gọi đầu: tải class, khởi động JVM, chạy đoạn khởi tạo (Spring context, Hibernate, connection pool…). SnapStart chụp trạng thái JVM đã khởi tạo xong khi bạn xuất bản phiên bản, rồi khôi phục từ ảnh đó khi cần môi trường mới, bỏ qua phần khởi tạo. Chỉ có hiệu lực trên phiên bản/alias đã xuất bản, không áp cho $LATEST. Provisioned Concurrency giữ môi trường sẵn sàng trả lời ngay mà không cold start, nhưng bạn trả tiền cả khi không có request.

### Thuật ngữ
- **Cold start (khoi dong lanh)**: lan dau goi khi chua co moi truong, phai tao moi truong moi, chua.
- **Warm start (khoi dong am)**: goi vao moi truong dang co, chi chay handler, nhanh.
- **Init phase (giao do khoi tao)**: chay static initializer, constructor handler, khoi dong framework truoc lan goi handler dau.
- **MicroVM**: may ao cuc nho chay mot ham Lambda, moi luc chi xu ly mot request.
- **SnapStart**: tinh nang chup anh JVM sau init khi xuat ban, khoi phuc tu anh khi can moi truong moi.
- **CRaC (Coordinated Restore at Checkpoint)**: API cho phep code chay hook truoc khi chup anh va sau khi khoi phuc.
- **Checkpoint / restore**: chup trang thai bo nho / khoi phuc trang thai tu anh.
- **Provisioned Concurrency (dong thoi du tru)**: so moi luong luon duoc AWS giu san sang, tra phi du khi khong goi.
- **$LATEST**: phien ban thao tac cua Lambda, SnapStart khong ap dung.
- **Version / alias**: phien ban da xuat ban va ten tro toi phien ban, SnapStart chi ap dung chung chung.
- **Connection pool reuse (tai su dung pool)**: giu client/pool giua cac lan goi de khong tao pool moi moi invocation.

### Co che buoc buoc
**Thuong:**
1. Request den nhung khong co moi truong trong => Lambda tao microVM moi.
2. Tai code va khoi dong runtime Java. Chua vi JVM nap, xac minh class va chay thong dich truoc khi JIT toi uu.
3. Chay init phase: constructor handler, Spring xay context, Hibernate doc metadata. Phan nay thap thu nhat, tinh bang giay.
4. Goi handler. Cac request sau vao lai moi truong nay la warm start, chi con buoc 4.

**Voi SnapStart:**
1. Khi ban xuat ban version, Lambda chay init mot lan, goi beforeCheckpoint (CRaC), chup anh bo nho va trang thai microVM, ma hoa va luu cache. Phi init chi tra mot lan thay cho moi cold start.
2. Can moi truong moi, Lambda khoi phuc tu anh thay cho buoc 2-3, roi goi afterRestore.
3. Goi handler nhu binh thuong.

~~~java
// Handler co khoi tao nhe va khoi tao tre de giam cold start
public class OrderHandler implements RequestHandler<OrderEvent, Response> {
    // TRANH: khoi tai khoi khoi (Spring context, Hibernate, pool) o day
    // No chay o moi lan cold start, lam tang init phase
    private OrderRepository repo;

    @Override
    public Response handleRequest(OrderEvent event, Context ctx) {
        if (repo == null) {
            // Khoi tao lan dau, cac lan goi su dung lai (warm start)
            repo = new OrderRepository();
        }
        return repo.process(event);
    }
}
~~~

### Bang so sanh
| Tieu chi | Cold start thuong | SnapStart | Provisioned Concurrency |
|---|---|---|---|
| Thoi gian | Nhieu giay (Java, Spring) | Duoi mot giay | Khoang 0-200 ms |
| Chi phi | Chi tien khi goi | Chi tien khi goi | Tra tien ca khi khong goi |
| Ap dung | Tat ca | Phien ban/alias da xuat ban | Alias chon truoc |
| Dung khi nao | Tai thap, khong quan tam chua | Init qua 1 giay, dung version | Khong chap nhan duoc giay chua |

### Loi hay gap
- **Khoi tao Spring context/Hibernate trong constructor.** Trieu chung: moi cold start chay lai toan bo, init 4-5 giay. Cach sua: khoi tao nhe, tai tre (lazy) trong handler nhu code tren.
- **Mo ket noi CSDL o init.** Trieu chung: init qua thoi gian han cua Lambda. Cach sua: ket noi trong handler, hoac su dung RDS Proxy.
- **Su dung $LATEST.** Trieu chung: ban bat SnapStart nhung khong co tac dung. Cach sua: goi qua version hoac alias da xuat ban.
- **Moi invocation tao pool moi.** Trieu chung: het ket noi CSDL, loi too many connections. Cach sua: tao client/pool mot lan va tai su dung giua cac lan goi.

### Vi du doi thuc
Spring Boot 1 GB: cold start thuong 4-5 giay, SnapStart duoi 1 giay, Provisioned Concurrency khoang 0-200 ms nhung tra tien 24/7. He thong 10.000 goi/ngay, 20% la cold start => 2.000 lan cho giay moi ngay. Doi bat SnapStart va goi qua alias prod, cold start mat duoi 1 giay; chi them cho cac han che khong chap nhan cho.

### Tra loi mau khi pham van
"Cold start cua Java tren Lambda gom tao microVM, khoi dong JVM, tai class va chay init (Spring context, pool...), neu co Spring co the ranh 4-5 giay. SnapStart chup anh JVM sau init khi xuat ban version, khoi phuc tu anh can moi truong moi, thoi gian duoi mot giay, chi ap dung cho version/alias khong dung $LATEST. Provisioned Concurrency giu moi truong san sang tra loi ngay, nhung tra tien ca khi khong co request. Toi chon SnapStart khi init qua mot giay va da co version/alias; Provisioned Concurrency cho API khong chap nhan duoc giay chua. Ket noi CSDL dung RDS Proxy va tai su dung client giua cac lan goi de tranh het ket noi."

> Senior tip: chi bat SnapStart khi init qua mot giay va dung version/alias; Provisioned Concurrency cho traffic khong chap nhan cho; connection pool phai tai su dung giua cac invocation, khong tao moi moi lan.
`,
  follow: [
    'Vì sao SnapStart không áp dụng cho $LATEST?',
    'CRaC hook beforeCheckpoint / afterRestore dùng làm gì?',
    'RDS Proxy giúp gì cho Lambda với lượng invocation bùng phát?'
  ],
  tags: ['Lambda', 'SnapStart', 'cold start', 'Provisioned Concurrency', 'CRaC', 'Java', 'RDS Proxy']
},
{
  id: 'aws-066',
  topic: 'aws',
  level: 'senior',
  q: 'Secrets Manager khác Parameter Store thế nào, luồng xoay mật khẩu RDS hoạt động thế nào, và Spring Boot đọc secret an toàn như thế nào?',
  a: `**Tóm tắt:** Secrets Manager lưu secret (mật khẩu CSDL, API key), có xoay tự động qua Lambda, tính phí theo mỗi secret và mỗi lệnh gọi API; Parameter Store lưu tham số cấu hình (SecureString mã hóa bởi KMS), rẻ hơn nhưng không xoay tự động. Spring Boot đọc qua AWS SDK v2 SecretsManagerClient, cache secret trong bộ nhớ, không ghi secret vào log và không để trong application.properties.

### Thuật ngữ
- **Secret (bí mật)**: mật khẩu CSDL, API key, token lưu trong Secrets Manager.
- **Secrets Manager**: dịch vụ lưu và quản lý secret, có xoay tự động.
- **Parameter Store**: dịch vụ lưu tham số cấu hình, có SecureString mã hóa bởi KMS.
- **KMS (Key Management Service)**: dịch vụ quản lý khóa mã hóa AWS.
- **Rotation (xoay)**: thay mật khẩu cũ bằng mật khẩu mới định kỳ.
- **Lambda**: hàm chạy theo sự kiện, được dùng để xoay mật khẩu RDS.
- **AWSPENDING / AWSCURRENT**: phiên mật chưa chuẩn bị và chính thức trong rotation.
- **SDK v2**: bộ thư viện AWS mới nhất cho Java.
- **Cache (bộ nhớ tạm)**: lưu giá trị đã tải để không gọi API lần lặp.
- **TTL (thời gian sống)**: thời gian cache được phép sử dụng.

### Cơ chế xoay từng bước
1. Bật rotation cho secret RDS, chọn chu kỳ (ví dụ 30 ngày).
2. AWS gọi rotation Lambda (mẫu có sẵn cho RDS): tạo mật khẩu mới, lưu vào phiên bản AWSPENDING.
3. Lambda kiểm tra kết nối DB với mật khẩu mới.
4. Nếu thành công, AWS promote AWSPENDING thành AWSCURRENT; ứng dụng đọc AWSCURRENT và nhận mật khẩu mới.
5. Nếu ứng dụng cache secret, nó có thể dùng mật khẩu cũ trong khoảng TTL cache (ví dụ 10 phút), sau đó tự tải mới. Vì sao cache phải ngắn và ứng dụng phải xử lý lỗi đăng nhập bằng tải lại secret.

~~~java
// Đọc secret với cache ngắn, tránh gọi API lần lặp
public class SecretCache {
    private final SecretsManagerClient client = SecretsManagerClient.create();
    private String cachedValue;
    private long cachedAt;
    private static final long TTL_MS = 10 * 60 * 1000; // 10 phút

    public String get(String secretId) {
        long now = System.currentTimeMillis();
        if (cachedValue == null || now - cachedAt > TTL_MS) {
            GetSecretValueResponse resp = client.getSecretValue(b -> b.secretId(secretId));
            cachedValue = resp.secretString();
            cachedAt = now;
        }
        return cachedValue;
    }
}
~~~

### Bảng so sánh
| Tiêu chí | Secrets Manager | Parameter Store |
|---|---|---|
| Nội dung | Secret (mật khẩu, API key) | Tham số cấu hình (SecureString) |
| Xoay tự động | Có (qua Lambda) | Không |
| Chi phí | Theo secret + lệnh gọi API | Rẻ hơn, theo tham số |
| Mã hóa | KMS tự động | KMS (SecureString) |

### Lỗi hay gặp
- **Đọc secret mỗi request.** Triệu chứng: tốn lệnh gọi API, chậm, dễ bị throttling và tốn tiền. Cách sửa: cache ngắn (5-10 phút), tải lại khi lỗi đăng nhập.
- **Lưu secret trong biến môi trường.** Triệu chứng: nhân viên có thể xem qua console, log có thể ghi. Cách sửa: lưu trong Secrets Manager, IAM least privilege chỉ cho role cần thiết.
- **Rotation không kiểm tra kết nối trước khi promote.** Triệu chứng: ứng dụng đăng nhập sai sau khi xoay. Cách sửa: kiểm tra kết nối với mật khẩu mới ở bước 3, kiểm thử rotation trên staging.

### Ví dụ đời thực
Mật khẩu RDS xoay mỗi 30 ngày, app cache 10 phút => sau khi xoay, app còn dùng mật khẩu cũ tối đa 10 phút rồi tự tải mới. Nếu không cache hệ thống 1.000 request/giây => 1.000 lệnh GetSecretValue/giây, tốn tiền và dễ bị giới hạn gọi API (throttling).

### Trả lời mẫu khi phỏng vấn
"Secrets Manager lưu bí mật mật khẩu CSDL, API key, có xoay tự động qua Lambda và tính phí theo secret và lệnh gọi API; Parameter Store lưu tham số cấu hình (SecureString mã hóa bằng KMS), rẻ hơn nhưng không xoay tự động. Tôi chọn Secrets Manager cho mật khẩu cần xoay, Parameter Store cho cấu hình bình thường. Spring Boot đọc qua SecretsManagerClient, cache ngắn 5-10 phút, không ghi log và không lưu trong application.properties. Xoay RDS: Lambda tạo mật khẩu mới, lưu AWSPENDING, kiểm tra kết nối, sau đó promote thành AWSCURRENT. App đọc AWSCURRENT, nếu cache thì dùng mật khẩu cũ tối đa một khoảng TTL rồi tải lại. Luôn kiểm thử rotation trên staging trước khi bật production."

> Senior tip: xoay mật khẩu RDS mỗi 30-90 ngày, nhưng rotation Lambda cần quyền kết nối DB với mật khẩu cũ và mới; kiểm thử trên staging, và xử lý lỗi đăng nhập bằng tải lại secret nếu bị thời gian cache.
`,
  follow: [
    'Secrets Manager và Parameter Store: chọn cái nào cho API key, cái nào cho cấu hình?',
    'Rotation Lambda cần quyền gì với RDS?',
    'Ứng dụng cache secret thì sau khi xoay, mất bao lâu ứng dụng dùng mật khẩu mới?'
  ],
  tags: ['Secrets Manager', 'Parameter Store', 'rotation', 'RDS', 'SDK v2', 'Spring Boot']
},
{
  id: 'aws-067',
  topic: 'aws',
  level: 'lead',
  q: 'IRSA (IAM Role for Service Accounts) và EKS Pod Identity gán quyền cho pod ra sao mà không cần access key, và khi nào chọn cái nào?',
  a: `**Tóm tắt:** IRSA liên kết Kubernetes service account với IAM role qua OIDC provider (OpenID Connect, dịch vụ xác thực dựa trên token JSON được ký số); pod gọi STS bằng token gắn vào, nhận credentials tạm thời (thường là 1 giờ). EKS Pod Identity AWS quản lý liên kết, không cần tạo OIDC provider, nhưng IRSA linh hoạt hơn (role chaining, nhiều tài khoản AWS). Cả hai đều thay thế access key dài hạn, tuân thủ least privilege (chỉ cấp quyền cần thiết).

### Thuật ngữ
- **IRSA (IAM Role for Service Accounts)**: gán vai trò IAM cho service account Kubernetes, pod đó nhận quyền của vai trò.
- **Service account**: danh tính Kubernetes dùng pod gọi API AWS.
- **OIDC provider (OpenID Connect)**: dịch vụ xác thực dựa trên token JSON được ký số.
- **Trust relationship (mối quan hệ tin cậy)**: khai báo trong IAM role cho biết OIDC provider nào được tin đăng nhập.
- **STS (Security Token Service)**: dịch vụ cấp tham chiếu tạm thời.
- **AssumeRoleWithWebIdentity**: lệnh STS nhận token web và trả về tham chiếu tạm thời.
- **Credentials tạm thời (AccessKey/SecretKey/SessionToken)**: hết hạn sau một thời gian (mặc định 1 giờ), không cần lưu dài hạn.
- **EKS Pod Identity**: dịch vụ AWS quản lý liên kết service account với IAM role, không cần OIDC provider.
- **Instance profile (hình thức instance)**: vai trò IAM gán cho EC2 node, tất cả cùng pod trên node nhận chung quyền (quá rộng).
- **Least privilege (quyền ít nhất)**: chỉ cấp quyền cần thiết cho việc cần làm.

### Cơ chế từng bước
1. Tạo OIDC provider cho cluster EKS.
2. Tạo IAM role với trust relationship cho OIDC provider của cluster và namespace/service account chọn.
3. Gán annotation eks.amazonaws.com/role-arn = arn của IAM role vào service account.
4. Pod khởi động, kubelet gán token vào đường dẫn /var/run/secrets/eks.amazonaws.com/serviceaccount/token.
5. SDK gọi AssumeRoleWithWebIdentity với token, nhận AccessKey/SecretKey/SessionToken tạm thời (thời gian sống 1 giờ).
6. Credentials tự làm mới trước khi hết hạn; nếu bạn tự lưu, phải cập nhật trước hết hạn không lỗi gặp.

~~~java
// Với IRSA, SDK v2 tự động gọi AssumeRoleWithWebIdentity thông qua credential provider chain
// Chỉ cần tạo client bình thường, không cần đọc token hay gọi STS thủ công
S3Client s3 = S3Client.create();

// Hoặc với region tùy chỉnh
S3Client s3Custom = S3Client.builder().region(Region.AP_SOUTHEAST_1).build();
~~~

### Bảng so sánh
| Tiêu chí | EC2 instance profile | IRSA | EKS Pod Identity |
|---|---|---|---|
| Cấp quyền cho | Toàn cả pod trên node | Mỗi service account | Mỗi service account |
| Cần OIDC provider | Không | Có | Không |
| Quản lý | AWS (node) | Bạn (role, trust) | AWS |
| Nhiều tài khoản AWS | Không | Được (role chaining) | Không |
| Dùng khi nào | Tất cả cùng một quyền | Nhiều role chi tiết, nhiều tài khoản | Một tài khoản, đơn giản |

### Lỗi hay gặp
- **Pod không có quyền.** Triệu chứng: AccessDenied. Nguyên nhân: quên annotation hoặc chưa tạo OIDC provider. Cách sửa: kiểm tra annotation service account, xem CloudTrail AccessDenied.
- **Dùng node instance profile cho tất cả pod.** Triệu chứng: quyền quá rộng, vi phạm least privilege (service order đọc được bucket của service payment). Cách sửa: mỗi service account một role riêng biệt.
- **Lưu credentials quá lâu.** Triệu chứng: sau 1 giờ hết hạn, lỗi gọi API. Cách sửa: để SDK làm mới tự động, không tự lưu vào bộ nhớ lâu dài.
- **Debug AccessDenied.** Cách sửa: chạy aws sts get-caller-identity trong pod để biết danh tính đang sử dụng.

### Ví dụ đời thực
Ba microservice (đơn hàng, thanh toán, kho) ở namespace riêng nhau, mỗi service account có IAM role riêng (don-hang-role đọc queue đơn hàng, thanh-toan-role ghi DB thanh toán). Trước đó tất cả pod dùng chung node instance profile => service đơn hàng có thể đọc bucket thanh toán, nguy cơ bảo mật. Sau IRSA, mỗi service chỉ có quyền cần thiết, và AccessDenied được tra cứu qua CloudTrail.

### Trả lời mẫu khi phỏng vấn
"IRSA liên kết service account Kubernetes với IAM role qua OIDC provider; pod nhận token gắn vào, gọi STS AssumeRoleWithWebIdentity, nhận tham chiếu tạm thời (thường là một giờ). EKS Pod Identity là dịch vụ AWS quản lý liên kết, không cần tạo OIDC provider, nhưng IRSA linh hoạt hơn nhiều role và nhiều tài khoản. Tôi chọn IRSA khi cần nhiều role chi tiết hoặc nhiều tài khoản AWS; EKS Pod Identity nếu chỉ một tài khoản và muốn đơn giản. Mỗi service account nhận role theo least privilege; nếu gặp AccessDenied, tôi kiểm tra annotation service account, OIDC provider và truy vấn CloudTrail."

> Senior tip: ưu tiên IRSA khi nhiều role chi tiết hoặc nhiều tài khoản AWS; EKS Pod Identity đơn giản hơn nếu một tài khoản; luôn cấp quyền ít nhất, và Xem AccessDenied qua CloudTrail trước khi thêm quyền thêm.
`,
  follow: [
    'IRSA và EKS Pod Identity khác nhau ở đâu, chọn cái nào?',
    'Token của pod được lưu đâu và hết hạn sau bao lâu?',
    'Làm sao debug AccessDenied của pod EKS?'
  ],
  tags: ['IRSA', 'EKS', 'Pod Identity', 'OIDC', 'STS', 'IAM']
},
{
  id: 'aws-068',
  topic: 'aws',
  level: 'senior',
  q: 'Triển khai bản Spring Boot mới lên ECS Fargate sau ALB: rolling update mặc định của ECS không đủ khi bản mới chạy được nhưng trả sai dữ liệu, và migration database phải chạy trước bản mới. Bạn dùng CodeDeploy blue/green như thế nào, và rollback tự động khi xảy ra lỗi 5xx ra sao?',
  a: `**Tóm tắt:** CodeDeploy blue/green chạy bản mới (green) cùng lúc với bản cũ (blue), chuyển traffic qua ALB theo tỷ lệ (canary 10% rồi 100%), và tự quay về bản cũ nếu báo cáo báo động CloudWatch (tỷ lệ 5xx, độ trễ p99) vượt ngưỡng. Rolling update thuần của ECS chỉ biết đã task healthy chưa, không phát hiện được bản "chạy được nhưng trả sai dữ liệu".

### Hiểu nhanh
Hãy tưởng tượng quán có hai hàng counter: hàng cũ vẫn phục vụ khách, hàng mới mở bên cạnh nhưng chưa công nhận. Quản lý (CodeDeploy) mời một phần nhỏ khách sang hàng mới, xem có phàn nàn không, rồi mới đổi cả quá quay. Nếu khách mới bắt đầu phàn khàn (lỗi 5xx), quản lý kích cửa hàng mới và quay lại hàng cũ. Rolling update chỉ kiểm tra "nhân viên mới đã đến làm việc chưa", không biết nhân viên đó có phục vụ sai món hay không.

### Thuật ngữ
- Blue/green deployment: bản cũ (blue) và bản mới (green) chạy cùng lúc, traffic chuyển qua CodeDeploy thay thay chỉnh tức thì.
- Canary: chuyển một phần nhỏ traffic sang bản mới trước khi mở rộng toàn bộ.
- AppSpec: file YAML khai báo quy trình triển khai của CodeDeploy, gồm các hook trước/trong/sau khi chuyển traffic.
- AfterAllowTestTraffic: hook chạy kiểm tra tự động sau khi một phần traffic đã đi sang bản mới.
- Deployment configuration: quy tắc chuyển traffic, ví dụ Canary10Percent5Minutes (10% trong 5 phút rồi đợi) hoặc Linear10PercentEvery1Minute.
- CloudWatch alarm: bộ chủ từ ALB, ví dụ HTTPCode_Target_5XX_Count và TargetResponseTime p99, kích hoạt rollback.
- Rollback tự động: CodeDeploy tháo tác bản mới và trả lại bản task revision cũ đã chạy ổn định.

### Cơ chế chung từng bước
1. CI build image, tag theo git SHA, push ECR, đăng ký task definition revision mới trỏ tới image đó.
2. CodeDeploy tạo DeploymentGroup cho ECS: nhóm blue là task revision cũ, nhóm green là revision mới, cả hai gắn vào listener và target group của ALB (CodeDeploy dùng hai target group riêng cho blue và green).
3. Theo AppSpec, hook trước khi chuyển traffic chạy migration database (qua task one-off hoặc Lambda) để schema mới sẵn sàng trước khi green nhận traffic.
4. CodeDeploy chuyển traffic theo tỷ lệ quy định, ALB bắt đầu gửi một phần request sang task green.
5. Trong cửa sổ theo dõi, nếu báo cáo báo động CloudWatch vượt ngưỡng (ví dụ 5xx quá 1% trong 5 phút), CodeDeploy đánh dấu deployment thất bại, dừng chuyển traffic và rollback về blue.
6. Nếu ổn định, chuyển 100% traffic sang green rồi xóa task blue cũ.

### Code guard readiness (Spring Boot)
~~~java
@RestController
public class MigrationGuardController {
    private final MigrationRepository migrationRepository;

    public MigrationGuardController(MigrationRepository migrationRepository) {
        this.migrationRepository = migrationRepository;
    }

    @GetMapping("/actuator/health/readiness")
    public ResponseEntity<Void> readiness() {
        // Trả 503 khi migration chưa chạy xong: ALB coi target unhealthy, CodeDeploy không gửi traffic xanh
        if (!migrationRepository.isMigrationComplete()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        return ResponseEntity.ok().build();
    }
}
~~~

### Rolling update vs blue/green
| Tiêu chí | Rolling update (ECS) | Blue/green (CodeDeploy) |
|---|---|---|
| Cách thay thế | Task cũ bị xóa khi task mới healthy | Bản mới chạy cùng lúc, chuyển traffic dần |
| Phát hiện trả sai dữ liệu | Không, chỉ kiểm tra task healthy | Có, qua báo 5xx/latency trong cửa sổ theo dõi |
| Rollback | Tháo tác task mới, giữ lại revision cũ (chậm) | Tự động quay về blue khi báo |
| Migration DB | Phải chạy trước hoặc tương thích ngược | Chạy trong hook trước khi chuyển traffic |
| Phù hợp | Bản nhỏ, không thay đổi schema | Bản có migration, cần rollback nhanh |

### Lỗi hay gặp
- **Chạy migration trong task cùng lúc nhiều bản.** Triệu chứng: hai revision cùng chạy migration, gây khóa bảng hoặc lỗi trùng dữ liệu. Cách tránh: migration bước riêng, chạy một lần qua task one-off hoặc Lambda trước khi green nhận traffic.
- **Hook AfterAllowTestTraffic không chạy hoặc chạy sai.** Triệu chứng: traffic đã chuyển sang green nhưng không kiểm tra, lỗi mới chỉ phát hiện sau khi khách phàn khàn. Cách tránh: gán hook kiểm tra smoke test (gọi /actuator/health, đặt đơn kiểm tra) và báo rollback.
- **Quên cấu hình báo rollback.** Triệu chứng: deployment xanh dung ứng dụng trả 50%, CodeDeploy không biết. Cách tránh: luôn gán báo CloudWatch vào deployment group, cửa sổ theo dõi đủ dài (ít nhất một phút).
- **ALB deregistration delay quá ngắn khi rollback.** Triệu chứng: request còn đang trên task blue bị xóa ngay, khách thấy 502. Cách tránh: đặt deregistration delay 30-60 giây và graceful shutdown trong Spring Boot.

### Trả lời mẫu khi phỏng viên
"Với Spring Boot trên ECS Fargate, tôi dùng CodeDeploy blue/green thay vì rolling update thuần khi có migration database. Quá trình: image build một lần, tag theo git SHA; CodeDeploy chạy revision mới cùng lúc, thực hiện migration trong hook trước khi chuyển traffic, rồi chuyển traffic qua ALB theo tỷ lệ canary. Trong cửa sổ theo dõi, báo CloudWatch trên tỷ lệ 5xx và độ trễ p99 của ALB kích hoạt rollback tự động về revision cũ nếu có sự cố. Tôi cũng đặt readiness endpoint trả 503 trong khi migration chưa xong, deregistration delay đủ dài để không rớ request, và graceful shutdown trong Spring Boot. Rolling update chỉ dùng cho bản nhỏ không thay đổi schema."
> Senior tip: rollback tốt nhất là rollback không ai cảm thấy — hay diễn thảo lập deploy bản lỗi có ý trong staging và chứng minh báo 5xx kéo CodeDeploy quay về bản cũ trong ít nhất mốt phút, chứ không đợi khách báo lỗi.

### Ví dụ đời thực
Một đội vận hành hệ thống đơn hàng Spring Boot trên ECS Fargate, hai task sau ALB. Lần đầu dùng rolling update, deploy bản thêm cột not null vào bảng đơn hàng: task mới healthy nhưng mỗi đơn mới lỗi "cột not null", hơn 200 đơn bị từ chối trong 10 phút trước khi đội nhận ra và rollback thủ công. Sau đó chuyển sang CodeDeploy blue/green: migration chạy qua task one-off trước khi green nhận traffic, chuyển 10% traffic trong 5 phút, báo CloudWatch theo dõi HTTPCode_Target_5XX_Count và TargetResponseTime. Lần deploy sau có lỗi mới, báo vượt ngưỡng trong 3 phút, CodeDeploy tự rollback về revision cũ, khách gần như không cảm thấy. Kết quả: thời gian khôi phục từ vạ giờ xuống còn dưới 5 phút, và mỗi deployment đều có điểm quay về được thu thập trước.
`,
  follow: [
    'CodeDeploy blue/green cho ECS dùng một hay hai target group của ALB?',
    'Migration database trong hook trước khi chuyển traffic: nếu migration thất bại CodeDeploy làm gì?',
    'Rollback tự động của CodeDeploy khác rollback tay trong ECS console ở điểm nào?'
  ],
  tags: ['ECS', 'Fargate', 'CodeDeploy', 'blue-green', 'canary', 'rollback']
},
{
  id: 'aws-069',
  topic: 'aws',
  level: 'lead',
  q: 'Hệ thống event-driven Java xử lý sự kiện tài chính: đơn hàng cần thứ tự theo từng tài khoản, clickstream cần xem lại dữ liệu trong 30 ngày, và nhiều nhóm cùng dùng cùng lượng sự kiện. Bạn chọn Kinesis Data Streams hay Amazon MSK (Kafka managed), và trade-off vận hành ra sao?',
  a: `**Tóm tắt:** Kinesis Data Streams là stream managed đơn giản: dữ liệu ghi vào shard, giữ tối đa 365 ngày, mỗi consumer đọc độc lập qua con trỏ của mình, tích hợp sẵn với Lambda. MSK là Kafka managed đầy đủ tính năng (consumer group, compacted topic, Kafka Connect, MirrorMaker), phức tạp hơn về vận hành nhưng linh hoạt hơn cho nhiều consumer và hệ sinh thái tại Kafka. Chọn Kinesis khi muốn ít vận hành và xử lý thời gian gần thực tại; chọn MSK khi đội đã có kinh nghiệm Kafka hoặc cần nhiều consumer phức tạp, compacted topic, hoặc kết nối hệ thống ngoài qua Connect.

### Hiểu nhanh
Kinesis giống cuốn sổ yêu cầu: mỗi dòng sự kiện ghi theo thứ tự vào một trang (shard), nhiều người có thể đọc cùng cuốn sổ nhưng mỗi nhớ mình đã đọc tới trang nào, và cuốn sổ chỉ giữ 24 đến 365 ngày. MSK giống hệ thống phòng thư chuyên nghiệp: nhiều bộ thư (broker), mỗi kênh (topic) chia thành nhiều trang (partition), mỗi nhóm nghe (consumer group) theo dõi đã nghe tới trang nào, có thể nghe lại kênh cũ (compacted topic), và có cổng tự kết nối hệ thống ngoài (Kafka Connect). Phòng thư mạnh hơn nhưng cần nhân viên vận hành.

### Thuật ngữ
- Shard: đơn vị ghi và đọc song song của Kinesis, mỗi shard hỗ trợ 1 MB/s ghi và 2 MB/s đọc, throughput tổng của stream bằng tổng các shard.
- Sequence number: số thứ tự của mỗi bản ghi trong shard, dùng làm con trỏ đọc.
- Retention: thời gian giữ dữ liệu trong stream, mặc định 24 ngày, tối đa 365 ngày.
- Consumer / checkpoint: ứng dụng đọc stream và lưu tiến trình đọc (checkpoint) thông qua DynamoDB, để đọc tiếp từ điểm dừng.
- Topic: tên kênh sự kiện trong Kafka/MSK.
- Partition: mỗi topic chia thành nhiều partition, ghi được thứ tự chỉ trong một partition.
- Consumer group: nhóm ứng dụng đọc cùng topic, Kafka quản lý offset của mỗi nhóm đọc độc lập.
- Compacted topic: topic chỉ giữ bản ghi mới nhất theo khóa, dùng lưu trạng thái mới nhất (tương tự bảng tra cứu).
- Kafka Connect: cổng tự đưa dữ liệu vào/ra Kafka tự động (ví dụ đọc từ PostgreSQL ghi vào Kafka).
- MirrorMaker: cổng replicate dữ liệu giữa hai cluster Kafka (ví dụ giữa hai region).

### Cơ chế chung từng bước
**Ghi vào Kinesis:** ứng dụng gọi PutRecord với partition key (ví dụ accountId), Kinesis băm partition key để chọn shard, gửi bản ghi với sequence number, trả về ngay. Vì sao: cùng accountId luôn vào cùng shard nên thứ tự sự kiện của tài khoản đó được giữ.
**Đọc Kinesis:** consumer lấy shard iterator, đọc bản ghi theo batch, xử lý, lưu checkpoint vào DynamoDB. Nếu consumer bị xết, đọc tiếp từ checkpoint cuối.
**Ghi vào MSK:** producer gửi bản ghi tới broker-leader của partition, broker replicate sang các broker theo hệ số replication (ví dụ 3), xác nhận khi đủ replica ghi. Vì sao: dữ liệu không mất khi một broker bị xết.
**Đọc MSK:** consumer group đọc partition, lưu offset trong Kafka (__consumer_offsets topic), nhiều nhóm đọc cùng topic không ảnh nhau.

### Code: producer Kafka với xác nhận an toàn
~~~java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class.getName());
props.put(ProducerConfig.ACKS_CONFIG, "all");        // cho tất cả replica đồng bộ xác nhận
props.put(ProducerConfig.RETRIES_CONFIG, 3);          // thử lại nếu lỗi tạm thời
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 1); // giữ thứ tự gửi theo khóa
KafkaProducer<String, OrderEvent> producer = new KafkaProducer<>(props);
producer.send(new ProducerRecord<>("orders", order.getAccountId(), order), (metadata, exception) -> {
    if (exception != null) {
        log.error("Gửi sự kiện thất bại", exception);
        // gửi vào hàng đợi thử lại hoặc dead-letter
    }
});
producer.close();
~~~

### So sánh Kinesis và MSK
| Tiêu chí | Kinesis Data Streams | Amazon MSK |
|---|---|---|
| Quản lý | Managed đầy đủ, không quản broker | Managed nhưng vẫn quản topic, partition, consumer group |
| Thứ tự | Theo shard (khóa partition) | Theo partition |
| Giữ dữ liệu | 24 giờ-365 ngày | Tương tự retention cấu hình (có thể lâu hơn) |
| Nhiều consumer | Mỗi consumer tự lưu checkpoint | Consumer group quản lý offset tập trung |
| Truy vấn lại cũ | Đọc từ sequence number | Đọc từ offset, compacted topic giữ trạng thái mới nhất |
| Kết nối hệ thống ngoài | GUI hoặc Lambda | Kafka Connect có sẵn |
| Chi phí vận hành | Thấp | Cao (cần vận hành cluster, chuyên gia Kafka) |
| Tích hợp Lambda | Event source mapping có sẵn | Có, qua bản sao stream hoặc người dùng tự tích hợp |

### Lỗi hay gặp
- **Partition key yếu trên Kinesis.** Triệu chứng: toàn bộ sự kiện đổ vào một shard, throughput tràn, các shard khác rỗng. Cách tránh: dùng khóa có giá trị khác nhau (accountId, orderId) chứ không phải ngày tháng.
- **Consumer Kinesis bị lag và chưa checkpoint.** Triệu chứng: restart consumer thì đọc lại từ thời điểm cũ, xử lý trùng sự kiện. Cách tránh: checkpoint định kỳ và làm consumer idempotent.
- **MSK producer không chờ replica.** Triệu chứng: broker leader bị xết ngay sau khi gửi, dữ liệu mới nhất bị mất vì chỉ gửi vào leader. Cách tránh: acks=all và replication factor >= 3.
- **Không chạy nhiều consumer group trên MSK vì chưa hiểu offset.** Triệu chứng: nhóm mới đọc từ đầu topic, đưa trăm triệu sự kiện cũ vào hệ thống xuống dòng. Cách tránh: cấu hình auto.offset.reset = earliest/latest có ý nghĩa và reset offset thấu minh.

### Ví dụ đời thực
Hệ thống thanh toán gửi sự kiện giao dịch vào Kinesis với partition key = accountId, stream 10 shard (10 MB/s gửi), giữ 7 ngày. Nhóm phản gian đọc stream qua Lambda để phát hiện giao dịch lừa, nhóm báo cáo đọc cùng stream để nhập vào kho dữ liệu, mỗi nhóm lưu checkpoint riêng nên không ảnh nhau. Triệu chứng: khi mở khuyến mãi, lượng gửi nhảy lên 15 MB/s vượt 10 MB/s của 10 shard, các bản ghi bị từ chối (ProvisionedThroughputExceededException). Đội tăng stream lên 20 shard để trải đều tải. Kết quả: throughput đáp ứng 30 MB/s, chi phí Kinesis khoảng 450 USD/tháng. Nếu nhóm cần Kafka Connect để đưa dữ liệu sang ElasticSearch hoặc cần compacted topic, họ sẽ chuyển sang MSK và chấp nhận chi phí vận hành cao hơn (cần nhân viên hiểu Kafka).

### Trả lời mẫu khi phỏng vấn
"Tôi chọn Kinesis Data Streams khi muốn quản trị tối thiểu: dữ liệu chia theo shard, giữ tối đa 365 ngày, mỗi consumer đọc độc lập qua checkpoint, và có sẵn event source mapping cho Lambda. Tôi chọn Amazon MSK khi hệ thống đã dùng Kafka, cần consumer group quản lý offset tập trung, compacted topic để lưu trạng thái mới nhất, hoặc Kafka Connect để nối hệ thống ngoài. MSK mạnh hơn nhưng đội phải vận hành cluster, quản lý partition và replication, nên chi phí con người cao hơn. Với sự kiện tài chính cần thứ tự theo tài khoản, tôi dùng partition key là accountId; nếu cần xem lại 30 ngày, tôi đặt retention 30 ngày hoặc dùng MSK với retention dài hơn. Trade-off chính là ít vận hành so với hệ sinh thái tại Kafka đầy đủ."
> Senior tip: không chọn MSK chỉ vì "Kafka là tiêu chuẩn ngành". Nếu chỉ cần một hai consumer đọc sự kiện gần real-time và tích hợp với Lambda, Kinesis ít rủi ro vận hành hơn nhiều; MSK thực sự xếp hạng khi đội đã có chuyên gia Kafka và cần các công cụ xung quanh Kafka.

`,
  follow: [
    'Kinesis và MSK khác nhau ở điểm nào về ghi và đọc dữ liệu?',
    'Khi nào nên tăng shard của Kinesis thay đổi partition key?',
    'Consumer group trên MSK quản lý offset như thế nào?'
  ],
  tags: ['Kinesis', 'MSK', 'Kafka', 'event-driven', 'consumer group', 'lead']
},
{
  id: 'aws-070',
  topic: 'aws',
  level: 'senior',
  q: 'Bạn muốn xây dựng pipeline nhẹ trên DynamoDB: khi đơn hàng chuyển sang trạng thái giao hàng thì gửi email thông báo, và tự động xóa dữ liệu cũ sau 90 ngày. Bạn dùng DynamoDB Streams + Lambda và TTL như thế nào, giới hạn item 400 KB và thay đổi schema ảnh hưởng gì?',
  a: `**Tóm tắt:** DynamoDB Streams chép mọi thay đổi item (bản mới/cũ) theo thứ tự trong mỗi partition, Lambda đọc stream và xử lý (gửi email, cập nhật chỉ mục tìm kiếm); TTL tự động xóa item sau thời gian cấu hình không tốn WCU. Giới hạn cần biết: item tối đa 400 KB, stream giữ dữ liệu 24 giờ, thay đổi schema (thêm trường mới) phải cập nhật cả người ghi và người đọc.

### Hiểu nhanh
DynamoDB Streams giống cuốn ghi lịch sử: mỗi lần sửa đơn hàng (đổi trạng thái, cập nhật địa chỉ) có một bản ghi trong cuốn, Lambda đọc cuốn đó và làm việc tiếp theo. TTL giống hẹn giờ xóa tự động: đặt thời gian hết hạn cho item, DynamoDB xóa mất item đó sau khi hết hạn, bạn không cần gọi lệnh xóa và không tốn WCU.

### Thuật ngữ
- StreamRecord: một bản ghi sự kiện trong stream, chứa bản ghi mới (NewImage) và bản ghi cũ (OldImage) nếu có.
- Event name: INSERT, MODIFY, REMOVE xác định loại thay đổi.
- Shard iterator: con trỏ đọc stream, chỉ được sử dụng trong 24 giờ.
- Checkpoint: vị trí đọc của Lambda, được quản lý tự động bởi event source mapping.
- TTL (Time to Live): trường thời gian hết hạn của item, DynamoDB xóa tự động khi hết hạn.
- WCU: đơn vị ghi của DynamoDB, xóa bằng TTL không tốn WCU.
- Item size limit: tối đa 400 KB cho một item.

### Cơ chế từng bước
**Kích hoạt Streams:** bật Streams trên bảng đơn hàng, chọn NEW_AND_OLD_IMAGES để có hai bản ghi. Mọi thay đổi được chép vào stream trong 24 giờ.
**Lambda đọc stream:** event source mapping bất đồng bộ, Lambda nhận batch sự kiện (tối đa 1000 record hoặc 6 MB), xử lý mỗi record. Nếu hàm lỗi, toàn bộ batch được thực hiện lại nếu không có partial batch response.
**Xử lý sự kiện:** Lambda lấy pk từ Keys, lấy trạng thái từ NewImage, nếu trạng thái = SHIPPED thì gửi email qua SES hoặc SNS.
**TTL xóa dữ liệu cũ:** thêm trường expireAt (timestamp Unix), bật TTL trên bảng, DynamoDB xóa item sau expireAt, thông thường (đến đấy 48 giờ).

### Code: Lambda xử lý DynamoDB Streams
~~~java
public class OrderStreamHandler implements RequestHandler<DynamodbEvent, Void> {
    private final EmailService emailService = new EmailService();

    @Override
    public Void handleRequest(DynamodbEvent event, Context context) {
        for (DynamodbStreamRecord record : event.getRecords()) {
            String eventName = record.getEventName();
            if (!"INSERT".equals(eventName) && !"MODIFY".equals(eventName)) {
                continue;
            }
            String orderId = record.getDynamodb().getKeys().get("pk").getS();
            String status = record.getDynamodb().getNewImage().get("status").getS();
            if ("SHIPPED".equals(status)) {
                emailService.sendOrderShipped(orderId);
            }
        }
        return null;
    }
}
~~~

### Thay đổi schema
Khi thêm trường mới (ví dụ deliveryDate) vào item, cần cập nhật code ghi (producer) và code đọc (Lambda) cùng lúc. Nếu Lambda đọc trường chưa có, get trả về null hoặc lỗi. Ví dụ với dữ liệu cũ không có trường mới, phải xử lý trường hợp trường thiếu (null check) để không làm pipeline hết.

### Giới hạn cần biết
- Item tối đa 400 KB: nếu sự kiện lớn (ví dụ thêm danh sách sản phẩm nhiều) có thể vượt giới hạn, cần tách dữ liệu lớn sang S3 và chỉ lưu key trong DynamoDB.
- Stream giữ dữ liệu 24 giờ: nếu Lambda bị ngưng hồi qua 24 giờ sẽ mất sự kiện, cần thiết kế idempotent và có bài toán gửi lại (dead-letter queue hoặc làm lại từ bảng).
- TTL xóa muộn hơn: item có thể còn tồn tại trong ít nhất một ít sau khi hết hạn, không được xóa luôn giữ thời gian.

### Lỗi hay gặp
- **Quên OldImage khi cần so sánh.** Triệu chứng: cần biết trước/sau thay đổi (ví dụ trạng thái từ PENDING sang SHIPPED) nhưng chỉ chạy NewImage. Cách tránh: bật NEW_AND_OLD_IMAGES và đọc OldImage.
- **Lambda lỗi nhiều lần làm batch hết.** Triệu chứng: một sự kiện lỗi làm toàn bộ batch lại, email được gửi nhiều lần. Cách tránh: dùng partial batch response hoặc xử lý idempotent theo orderId.
- **TTL xóa dữ liệu cần quan trọng.** Triệu chứng: xóa nhầm item có giá trị kinh doanh vì cấu hình TTL sai. Cách tránh: chỉ bật TTL cho trường dữ liệu thời gian (log, session) không cho dữ liệu chính.

### Ví dụ đời thực
Hệ thống đơn hàng có bảng orders (pk = USER#42, sk = ORDER#2026-01-15#ORD123). Bật Streams NEW_AND_OLD_IMAGES, Lambda nhận sự kiện, khi status đổi sang SHIPPED thì gửi email qua SES. Thêm trường expireAt cho đơn hàng cũ hơn 90 ngày, bật TTL. Kết quả: email được gửi trong ít nhất giây phát sự phát hiện trạng thái, và kho lưu ít nhất một ít sau 90 ngày không tốn WCU. Một ngày Lambda bị hết 10 giờ, event source mapping tự động thử lại từ checkpoint cuối, không mất sự kiện vì stream vẫn còn dữ liệu trong khoảng 24 giờ.

### Trả lời mẫu khi phỏng vấn
"Tôi dùng DynamoDB Streams với Lambda để xử lý sự kiện thay đổi đơn hàng: bật Streams NEW_AND_OLD_IMAGES, Lambda đọc batch sự kiện, lấy orderId từ Keys và trạng thái từ NewImage, nếu SHIPPED thì gửi email qua SES. Để xóa dữ liệu cũ, thêm trường expireAt và bật TTL, DynamoDB xóa tự động sau 90 ngày không tốn WCU. Cần biết giới hạn: item tối đa 400 KB, stream chỉ giữ 24 giờ nên Lambda phải idempotent và có xử lý khi bị hết, và thay đổi schema phải cập nhật cùng lúc code ghi và code đọc. Pipeline được thiết kế idempotent theo orderId để nếu batch xử lý lại không gửi email trùng."
> Senior tip: Streams chỉ giữ dữ liệu 24 giờ, nếu cần lưu trữ sự kiện dài hạn hẳn phải đẩy sự kiện sang Kinesis hoặc S3. TTL không xóa luôn giữ thời gian nên không dùng TTL cho dữ liệu cần xóa chính xác theo giờ.
  `,
  follow: [
    'Streams giữ dữ liệu bao lâu và nếu Lambda bị hết qua giới hạn đó xảy ra gì?',
    'Partial batch response có ích gì với DynamoDB Streams?',
    'TTL xóa dữ liệu có chính xác theo giây không?'
  ],
  tags: ['DynamoDB', 'Streams', 'TTL', 'Lambda', 'event-driven']
},
{
  id: 'aws-071',
  topic: 'aws',
  level: 'senior',
  q: 'Lambda Java đã bật SnapStart nhưng cold start vẫn xảy ra một số lần (invoke qua $LATEST, invoke bất đồng bộ, event source mapping từ SQS/S3, VPC ENI), và bạn đọc Init Duration/Restore Duration như thế nào, dùng Provisioned Concurrency khi nào?',
  a: `**Tóm tắt:** SnapStart chỉ giúp invoke đồng bộ qua version/alias đã publish; invoke qua $LATEST, invoke bất đồng bộ (sự kiện từ S3/SNS), và event source mapping từ SQS/Kinesis không dùng snapshot nên vẫn cold start. Init Duration (lần đầu) và Restore Duration (SnapStart) ở trong dòng log REPORT của Lambda. Provisioned Concurrency giữ số lượng đã được init, dùng khi không chấp nhận được cold start nào và chi phí cho phép.

### Hiểu nhanh
Hãy tưởng tượng lambda là nhân viên thời vụ: gọi lần đầu (cold start) nhân viên đến, bật kệ, xong việc rồi về. SnapStart nhìn ảnh chụp nhân viên đã sẵn sàng, gọi lần sau là khôi phục từ ảnh chụp. Nhưng nhân viên chưa được chụp ảnh (gọi qua $LATEST, sự kiện bất đồng bộ, hoặc SQS đẩy việc) vẫn phải đến từ đầu. VPC cũng làm chậm thêm vì phải tạo thẻ mạng ENI cho mỗi môi trường mới.

### Thuật ngữ
- $LATEST: bản khai báo mặc định của Lambda, không được áp dụng SnapStart.
- Version/alias: bản đã publish, SnapStart chỉ áp dụng khi gọi qua version hoặc alias đã publish.
- Init Duration: thời gian khởi tạo môi trường (tải code, khởi JVM, chạy init), chỉ có trong dòng REPORT của lần cold start.
- Restore Duration: thời gian khôi phục từ ảnh chụp SnapStart, thấp hơn Init Duration nhiều.
- Provisioned Concurrency: số lượng môi trường đã được khởi tạo sẵn sàng, trả tiền cho thời gian cung cấp.
- VPC: Lambda khi gọi vào VPC cần kết nối tới các tài nguyên trong VPC (RDS, Redis…). Mỗi môi trường mới phải tạo kết nối mạng (trước đây là ENI, nay là hyperplane ENI), làm thêm thời gian khởi động. Nếu không cần truy cập tài nguyên trong VPC, giữ Lambda ngoài VPC để tránh phần này.

### Cơ chế khi cold start vẫn xảy ra
1. **Gọi qua $LATEST:** mỗi lần có môi trường mới, Lambda chạy init từ đầu, không có Restore Duration. Cách tránh: publish version, gọi qua alias hoặc version đã publish.
2. **Invoke bất đồng bộ:** sự kiện từ S3, SNS, EventBridge gọi Lambda bất đồng bộ, không sử dụng snapshot. Cách tránh: chấp nhận cold start hoặc chuyển sang đồng bộ nếu cần kết quả ngay lập tức.
3. **Event source mapping SQS/Kinesis:** poll được gọi bất đồng bộ, cũng không sử dụng snapshot. Cách tránh: chấp nhận cold start, hoặc dùng Provisioned Concurrency nếu khởi chạy chưa chấp nhận được.
4. **VPC:** Lambda trong VPC cần tạo ENI cho mỗi môi trường mới, làm thêm thời gian khởi. Cách tránh: giữ Lambda ngoài VPC nếu không cần truy cập tài nguyên trong VPC, hoặc chấp nhận thêm thời gian.

### Đọc Init Duration và Restore Duration
Mỗi lần gọi Lambda ghi dòng REPORT vào CloudWatch Logs:
REPORT RequestId: ...	Init Duration: 3214.5 ms		Duration: 3500.0 ms	...
REPORT RequestId: ...	Restore Duration: 450.0 ms		Duration: 800.0 ms	...
- Init Duration xuất hiện chỉ ở lần cold start (không có SnapStart hoặc không áp dụng).
- Restore Duration xuất hiện ở lần có SnapStart được áp dụng.
- Tìm kiếm theo RequestId trong CloudWatch Logs Insights để xem thời gian khởi của từng môi trường.

### Provisioned Concurrency
Giữ N môi trường đã init sẵn sàng, trả tiền theo thời gian cung cấp. Dùng khi: API giao hàng, thanh toán không chấp nhận được cold start, và chi phí cho phép. Không dùng khi: việc bất đồng bộ, thời gian phản hồi không nhất thiết, hoặc traffic ít (tiền bỗng cung trở thành chi phí bơ).

### Lỗi hay gặp
- **Bật SnapStart nhưng gọi qua $LATEST.** Triệu chứng: dòng REPORT vẫn có Init Duration vài giây, không có Restore Duration. Cách tránh: publish version, trỏ API Gateway/nguồn sự kiện tới alias chỉ đến version đó.
- **Thích Restore Duration là thời gian tổng.** Triệu chứng: sao chép thời gian khởi, thực ra Restore Duration chỉ là phần khôi phục, còn Init Duration có thể lại có nếu môi trường chưa được snapshot. Cách tránh: đọc đúng các trường trong dòng REPORT.
- **Provisioned Concurrency quá nhiều.** Triệu chứng: trả tiền cho nhiều môi trường không sử dụng. Cách tránh: bắt đầu với số lượng nhỏ, tăng theo thực tế.

### Ví dụ đời thực
Hàm Lambda Java nhận webhook thanh toán, đã bật SnapStart, gọi qua API Gateway alias. Dòng REPORT cho lần đầu: Init Duration 4200 ms, Duration 4600 ms. Lần sau qua alias: Restore Duration 480 ms, Duration 900 ms. Một ngày người dùng phàn khàn thanh toán chậm: kiểm tra CloudWatch, thấy đợt gọi đến hàm qua $LATEST (vì công cụ triển khai vẫn trỏ $LATEST), Init Duration vài giây tiếp tục. Đổi trỏ API Gateway tới alias đã publish và publish version mới mỗi lần triển khai. Kết quả: cold start xuống còn dưới 1 giây, thời gian phản hồi trung bình từ 4 giây xuống dưới 1 giây, và không có lỗi timeout thanh toán nữa.

### Trả lời mẫu khi phỏng vấn
"SnapStart chỉ giúp invoke đồng bộ qua version/alias đã publish; gọi qua $LATEST, invoke bất đồng bộ từ S3/SNS, và event source mapping từ SQS/Kinesis vẫn cold start vì không dùng snapshot. Init Duration (lần đầu) và Restore Duration (SnapStart) ở trong dòng log REPORT, tôi đọc qua CloudWatch Logs Insights. Provisioned Concurrency giữ môi trường đã init sẵn sàng, tôi dùng khi API không chấp nhận cold start nào và chi phí cho phép; nếu traffic ít hoặc việc bất đồng bộ thì không nên Provisioned vì bơ chi phí. VPC thêm thời gian khởi nên tôi giữ Lambda ngoài VPC nếu không cần truy cập tài nguyên trong VPC."
> Senior tip: luôn gọi qua version/alias đã publish nếu muốn SnapStart có ích; công cụ triển khai trỏ $LATEST là nguyên nhân của cold start. Provisioned Concurrency giải quyết cold start nhưng trả tiền cho thời gian cung cấp, chỉ dùng cho API nhất thiết.
  `,
  follow: [
    'Sự phân biệt Init Duration và Restore Duration ở đâu?',
    'Provisioned Concurrency có giảm cold start đến 0 không?',
    'Lambda trong VPC thêm thời gian bao nhiêu và khi nào nên bỏ VPC?'
  ],
  tags: ['Lambda', 'SnapStart', 'cold start', 'Provisioned Concurrency', 'Init Duration']
},
{
  id: 'aws-072',
  topic: 'aws',
  level: 'senior',
  q: 'Ứng dụng Spring Boot cần đọc mật khẩu database từ Secrets Manager và rotation tự động mỗi 30 ngày. Bạn viết code lấy secret và reload trong runtime không đóng việc reset như thế nào, cửa sổ dual-credential là gì, và tại sao không lưu secret trong biến môi trường của task definition?',
  a: `**Tóm tắt:** Dùng AWS Secrets Manager caching client (hoặc Spring Cloud AWS) để lấy secret một lần và cache trong bộ nhớ có TTL, client tự phát hiện bản mới và refresh; rotation RDS tạo mật khẩu mới, cập nhật database, giữ cả mật khẩu cũ và mới trong khoảng thời gian chuyển giao (dual-credential) nên ứng dụng không gián đoạn. Không lưu secret trong biến môi trường/task definition vì giá trị bị lụt qua CloudFormation, console và dump tiến trình.

### Hiểu nhanh
Hãy tưởng tượng Secret Manager là túi sắt có người quản lý: tự đổi mật khẩu định kì, ghi log người mở túi, nhưng thuê túi đặt. Caching client giống bản sao túi mật khẩu ở trong bộ nhớ ứng dụng, cần thời gian để cập nhật, ứng dụng không cần gọi AWS mỗi lần yêu cầu. Dual-credential giống khi đổi mật khẩu: mật khẩu cũ vẫn hoạt động trong khoảng thời gian chuyển giao, ứng dụng có thời gian để lấy mật khẩu mới không bị lỗi đăng nhập.

### Thuật ngữ
- Secret: giá trị nhạy cảm (mật khẩu, token, khóa).
- Caching client: client tự động cache secret, refresh theo TTL hoặc khi phát hiện bản mới.
- SecretCache: lớp cache của AWS SDK v2 cho Secrets Manager.
- Dual-credential: khoảng thời gian cung cấp mật khẩu cũ và mới khi rotation.
- Rotation: quy trình tự đổi secret định kì bằng Lambda.
- Biến môi trường/task definition: nơi lưu cấu hình của task ECS, để trong CloudFormation và console.

### Cơ chế từng bước
**Lấy secret:** ứng dụng khởi động, gọi Secrets Manager (hoặc qua caching client), lấy giá trị, tạo DataSource, không log giá trị secret.
**Cache và reload:** caching client có TTL (ví dụ 5 phút), tự kiểm tra bản mới của secret và tải lại nếu có thay đổi. Ứng dụng không cần reset để nhận mật khẩu mới.
**Rotation RDS:** Secrets Manager gọi Lambda rotation, Lambda sinh mật khẩu mới, cập nhật RDS, ghim bản AWSCURRENT sang mật khẩu mới, bản cũ thành AWSPREVIOUS. Trong khoảng chuyển giao, cả hai mật khẩu vẫn chuẩn chỉnh.
**Không lưu trong env:** biến môi trường hiện trong AWS console, CloudFormation, và có thể bị dump từ tiến trình, rủi ro lụt mật khẩu.

### Code: caching client Secrets Manager
~~~java
SecretsManagerClient client = SecretsManagerClient.create();
SecretCache cache = SecretCache.builder()
    .client(client)
    .defaultCacheToInMemory(true)
    .build();
String secretJson = cache.getSecretString("prod/orders/db");
// parse JSON bằng Jackson, tạo DataSource, KHÔNG log giá trị secret
~~~

### Dual-credential window
Khi rotation chạy, mật khẩu mới được sinh và cập nhật vào RDS. Bản AWSCURRENT chuyển sang mật khẩu mới, mật khẩu cũ được lưu ở bản AWSPREVIOUS trong một khoảng thời gian (ví dụ 24 giờ). Ứng dụng vẫn dùng mật khẩu cũ trong khoảng đó, có thời gian để refresh cache. Sau khi khoảng đủ kết thúc, mật khẩu cũ bị xóa. Ứng dụng phải refresh secret (qua caching client TTL hoặc @RefreshScope) để nhận mật khẩu mới, không cần reset.

### Lỗi hay gặp
- **Cache secret mà không bao giờ refresh.** Triệu chứng: sau lần rotation đầu tiên, ứng dụng vẫn dùng mật khẩu cũ, RDS từ chối, lỗi đăng nhập hàng trăm. Cách tránh: dùng caching client có TTL, hoặc @RefreshScope + actuator /refresh để reload secret trong runtime.
- **Lưu secret trong biến môi trường task definition.** Triệu chứng: mật khẩu hiện trong CloudFormation/console, bot quét có thể lấy. Cách tránh: dùng secret reference (ECS/Lambda tự inject từ Secrets Manager/Parameter Store), không lưu plaintext.
- **Quên exception khi mật khẩu cũ hết hạn.** Triệu chứng: sau khoảng dual-credential kết thúc, ứng dụng vẫn dùng mật khẩu cũ, lỗi đăng nhập. Cách tránh: nếu lỗi xác thực, gọi lại Secrets Manager để lấy mật khẩu mới và tạo lại DataSource.

### Ví dụ đời thực
Hệ thống đơn hàng sử dụng RDS PostgreSQL, mật khẩu lưu trong Secrets Manager, bật rotation mỗi 30 ngày. Ban đầu đội lấy secret một lần khi khởi động và lưu trong biến môi trường, không refresh. Sau lần rotation đầu tiên, ứng dụng bị lỗi đăng nhập hàng trăm trong 3-5 phút. Đổi thêm caching client với TTL 5 phút, và nếu lỗi xác thực thì gọi lại Secrets Manager và tạo lại DataSource. Kết quả: lần rotation sau không gây gián đoạn, lỗi đăng nhập về 0, và đội không cần reset ứng dụng mỗi lần đổi mật khẩu.

### Trả lời mẫu khi phỏng vấn
"Tôi dùng AWS Secrets Manager caching client để lấy secret một lần và cache trong bộ nhớ có TTL, client tự refresh khi có bản mới; ứng dụng Spring Boot đọc secret vào khởi động, nếu lỗi xác thực thì gọi lại Secrets Manager và tạo lại DataSource, không cần reset. Rotation RDS tạo mật khẩu mới, cập nhật database, và giữ cả mật khẩu cũ và mới (dual-credential) trong khoảng chuyển giao nên ứng dụng không gián đoạn. Không lưu secret trong biến môi trường/task definition vì giá trị bị lụt qua CloudFormation, console và dump tiến trình; thay vào đó dùng secret reference để ECS/Lambda tự inject từ Secrets Manager."
> Senior tip: secret là dữ liệu có vòng đời, thiết kế như dữ liệu có vòng đời: có chủ sở hữu, có lịch rotation, có báo động sau hết hạn, và có đường lui khi rotation lỗi. Không biến "lấy secret lúc khởi động" thành "cache đến khi reset".
  `,
  follow: [
    'Caching client của Secrets Manager refresh tự động như thế nào?',
    'Ứng dụng reload secret trong runtime không reset được bằng gì?',
    'Tại sao không lưu secret trong biến môi trường task definition?'
  ],
  tags: ['Secrets Manager', 'rotation', 'caching client', 'Spring Boot', 'dual-credential']
},
{
id: 'aws-073',
  topic: 'aws',
  level: 'lead',
  q: 'Giảm dạo chi phí AWS cho hệ Java: bạn triển khai showback/chargeback theo dõi, tag bắt buộc, Cost Anomaly Detection, và quyết định cam kết Savings Plans bao nhiêu phần trăm chi phí ổn định, khi nào không nên cam kết?',
  a: `**Tóm tắt:** Showback báo chi phí theo dõi để mọi người thấy mình dùng nhiều; chargeback chính xác hơn bằng việc ghi vào loi nhu của đội. Tag bắt buộc (owner, service, env) là tiền đề, tài nguyên không tag bị cảnh báo hoặc không được cấp. Cost Anomaly Detection cảnh báo trong ngày khi chi phí vượt bộ. Savings Plans chỉ cam kết phần baseline ổn định sau khi right-sizing, thông thường 60-80% chi phí compute 24/7; không cam kết phần biến động và workload chưa ổn định.

### Hiểu nhanh
Hãy tưởng tượng chi phí AWS giống hóa đơn điện nước của một tòa nhà lớn: nếu không có đồng hồ chung chung (tag), không ai biết phòng nào tiêu thụ nhiều và không ai thích tiết kiệm. Showback là in hóa đơn cho từng phòng để người dùng thấy con số. Chargeback là tiền chính thức chuyển khoản loi nhu của phòng đó. Tag bắt buộc là quy tắc "không tag không được máy", để biết máy nào thuộc phòng nào. Cost Anomaly Detection là chuông báo động khi hóa đơn tăng vượt bộ so với thói quen. Savings Plans giống đồng tiền điện trả trước một năm để được giảm giá, chỉ nên đồng tiền phần chắc chắn sẽ dùng.

### Thuật ngữ
- Showback: báo chi phí thông báo cho đội (không chuyển tiền chính thức).
- Chargeback: chi phí được ghi chuẩn xác vào loi nhu của đội, ảnh hưởng P&L.
- Tag: nhãn gắn với tài nguyên AWS (owner, service, env, cost-center).
- Cost Allocation Tag: tag được bật trong Billing để chia chi phí theo nhóm.
- Cost Explorer: công cụ xem và phân tích chi phí AWS theo dịch vụ, tài khoản, tag.
- AWS Budgets: đặt ngưỡng chi phí và cảnh báo khi vượt.
- Cost Anomaly Detection: phát hiện chi phí vượt bộ so với lịch sử và cảnh báo qua email/SNS.
- Savings Plans: cam kết chi tiêu theo thời gian (1 hoặc 3 năm) để được giảm giá, linh hoạt hơn Reserved Instances.
- Compute Optimizer: phân tích bộ nhớ và gợi ý kích thức EC2, ECS, Lambda, EBS phù hợp.

### Cơ chế từng bước
**Triển khai tag bắt buộc:** dùng Tag Policy/SCP để bắt buộc tag owner, service, env, cost-center. Tài nguyên không được tag bị cảnh báo hoặc không được cấp công cụ.
**Showback:** lấy dữ liệu từ Cost Explorer hoặc CUR qua Athena, báo cáo chi phí theo đội mỗi tháng, gửi cho mỗi đội.
**Chargeback:** chi phí được chuẩn xác vào loi nhu của đội, đội phải trả tiền cho phần của mình.
**Cảnh báo:** đặt AWS Budgets theo dõi và Cost Anomaly Detection cảnh báo trong ngày khi chi phí vượt bộ.
**Cam kết Savings Plans:** sau khi right-sizing (giảm instance thừa), tính toán phần baseline ổn định (chạy 24/7), cam kết 60-80% chi phí compute đó, không cam kết phần biến động.

### Code: gán tag qua SDK Java
~~~java
CreateTagsRequest yeuCau = CreateTagsRequest.builder()
    .resources("i-0abc123def456")
    .tags(Tag.builder().key("owner").value("team-payments").build(),
        Tag.builder().key("service").value("order-api").build(),
        Tag.builder().key("env").value("prod").build())
    .build();
ec2.createTags(yeuCau);
~~~

### Quy tắc cam kết Savings Plans
1. Right-sizing trước: dùng Compute Optimizer và CloudWatch để tìm instance thừa, giảm xuống mức thực tế + đệm 20-30%.
2. Tính phần baseline: chi phí compute 24/7 sau khi right-sizing, ít nhất 2-4 tháng dữ liệu.
3. Cam kết 60-80% phần baseline bằng Compute Savings Plans 1 năm (linh hoạt hơn EC2 Instance Savings Plans, áp dụng cả Fargate, Lambda).
4. Không cam kết phần biến động (tăng giảm theo thời gian) và workload chưa ổn định.
5. Kiểm tra lại mỗi quý: nếu bộ phần baseline thay đổi, điều chỉnh cam kết.

### Lỗi hay gặp
- **Cam kết Savings Plans trước khi right-sizing.** Triệu chứng: cam kết chi tiêu cho instance thừa, bở tiền. Cách tránh: giảm instance trước, cam kết sau.
- **Không có tag, không biết ai tiêu tiêu.** Triệu chứng: toàn bộ chi phí ở phần "không rõ chủ sở hữu", không ai chịu trách nhiệm. Cách tránh: tag bắt buộc ngay từ đầu, tài nguyên không tag bị cảnh báo.
- **Cam kết phần biến động.** Triệu chứng: sau một tháng phải chuyển vùng/instance family, tiền cam kết trở thành tiền chết. Cách tránh: chỉ cam kết phần chắc chắn sẽ dùng, ưu tiên Compute Savings Plans.
- **Không có báo động chi phí vượt bộ.** Triệu chứng: biết hóa đơn tăng khi cuối tháng, muộn đãi. Cách tránh: Cost Anomaly Detection cảnh báo trong ngày.

### Ví dụ đời thực
Một công ty chạy 40 dịch vụ ECS Fargate, mỗi dịch vụ chạy 2 task (1 vCPU, 2 GB) 24/7, tổng chi phí compute đường 12.000 USD/tháng. Ban đầu đội chọn instance type theo cảm giác và không đọc. Sau 6 tháng, chi phí tăng 40% nhưng lượng không tăng; đội không biết dịch vụ nào thừa. Đọc: Compute Optimizer và CloudWatch phát hiện 60% task chạy CPU trung bình 10-20% và bộ nhớ dưới 30%, nhiều dịch vụ có thể chạy 0,5 vCPU/1 GB; ngoài ra 15 dịch vụ chỉ chạy từ 8h-17h các thứ trong tuần nhưng task vẫn chạy 24/7. Nguyên nhân: không right-sizing trước khi cam kết Savings Plans, và không tự động scale theo thời gian. Xử lý: right-sizing 60% task xuống 0,5 vCPU/1 GB (giảm 40% chi phí compute), thêm Application Auto Scaling theo CPU và schedule-based scaling cho 15 dịch vụ (tắt task ngoài giờ làm), sau khi baseline ổn định mua Compute Savings Plans 1 năm cho phần 24/7 (giảm thêm 35%). Kết quả: chi phí compute từ 12.000 USD xuống còn 4.800 USD/tháng (giảm 60%), và không cần chuyển Graviton ngay vì sau right-sizing đã đạt mục tiêu; sau đó test Graviton trên 1 dịch vụ: cùng lượng thông, CPU giảm 25% nên đội quyết định chuyển dần trong quý sau.

### Trả lời mẫu khi phỏng vấn
"Tôi giảm dạo chi phí AWS theo thứ tự: right-sizing trước (đọc và cắt thừa), sau đó Graviton (ARM, thông thường giảm 20% và nhanh hơn cho Java), rồi Savings Plans cho baseline ổn định, Spot cho worker và batch, cuối cùng là kiến trúc (caching, serverless). Quan trọng là đọc trước khi làm: dùng Compute Optimizer và CloudWatch. Showback báo chi phí theo đội, chargeback ghi vào loi nhu của đội, tag bắt buộc (owner, service, env) để biết tài nguyên thuộc đội nào, Cost Anomaly Detection cảnh báo trong ngày khi chi phí vượt bộ. Savings Plans chỉ cam kết phần baseline ổn định (thông thường 60-80% chi phí compute 24/7) sau khi right-sizing, không cam kết phần biến động hoặc workload chưa ổn định."
> Senior tip: không mua Savings Plans khi chưa right-sizing. Nhiều hệ đang chạy instance lớn gợi hai cẩn thận; cắt trước có thể giảm 30-50% không cần cam kết gì.
  `,
  follow: [
    'Savings Plans khác Reserved Instances ở điểm nào?',
    'Tag bắt buộc tác động chi phí như thế nào?',
    'Khi nào Cost Anomaly Detection cảnh báo sai (false positive)?'
  ],
  tags: ['cost', 'Savings Plans', 'tag', 'showback', 'chargeback', 'lead']
},
{
  id: 'aws-074',
  topic: 'aws',
  level: 'senior',
  q: 'Một API Spring Boot 3 (Java 21) có traffic spiky và p99 nhạy cảm. Bạn chọn ECS Fargate, EKS hay Lambda, và cold start với SnapStart ảnh hưởng thế nào tới quyết định?',
  a: `**Tóm tắt:** Không có lựa chọn tốt nhất tuyệt đối; chọn theo hình dạng traffic và ai chịu trách nhiệm vận hành. Với API Spring Boot traffic spiky, p99 nhạy cảm, ECS Fargate là mặc định tốt: container luôn ấm, scale trong vài chục giây, không cold start. Lambda chỉ hợp khi chịu được cold start và đã bật SnapStart; EKS khi công ty đã có platform Kubernetes.

### Hiểu nhanh
Hãy ví mỗi lựa chọn như một cách mở quán. ECS Fargate giống thuê một gian trong food court: bạn mang nồi niêu (Docker image) tới, quầy luôn mở, khách tới là bán ngay, không có cảnh dọn hàng mỗi lần. Lambda giống thuê đầu bếp theo suất: có khách mới nấu, không khách thì không tốn, nhưng lần đầu luôn có cảnh đầu bếp chạy tới (cold start). EKS giống tự vận hành cả food court theo chuẩn quốc tế: rất mạnh khi nhiều quầy, nhưng cần người quản lý chuyên trách.

### Thuật ngữ
- Cold start: lần gọi đầu, hoặc sau khi môi trường bị thu hồi, phải tạo môi trường, nạp JVM và chạy code khởi tạo; các lần sau là warm start.
- SnapStart: Lambda chụp ảnh JVM đã khởi tạo xong lúc publish version, lần sau khôi phục từ ảnh để bỏ phần khởi tạo.
- Task definition: bản khai báo của ECS gồm image, CPU, memory, biến môi trường, IAM task role.
- ALB (Application Load Balancer): bộ cân bằng tải tầng 7, chỉ gửi traffic khi health check pass.
- HPA (Horizontal Pod Autoscaler): thành phần Kubernetes tự tăng/giảm số pod theo CPU hoặc metric tuỳ chỉnh.

### Cơ chế: cùng một service, ba cách chạy
1. Lambda: mỗi execution environment chỉ xử lý một request tại một thời điểm. Khi tải bùng nổ, Lambda tạo nhiều môi trường mới, mỗi môi trường mới đều cold start. Với Spring Boot, init phase (component scan, Hibernate, connection pool) thường mất 1-5 giây. SnapStart chỉ áp dụng khi invoke qua version/alias đã publish, không áp dụng cho $LATEST; sau restore phải mở lại connection và sinh lại giá trị ngẫu nhiên bằng hook CRaC. Ràng buộc cứng: tối đa 15 phút mỗi lần gọi, không giữ state.
2. ECS Fargate: task chạy liên tục sau ALB, không có cold start. Khi tải tăng, Application Auto Scaling thêm task trong vài chục giây; JVM mới vẫn cần khởi động nhưng ALB chỉ gửi traffic khi health check pass, nên request đang chạy không bị chặn. Bạn vẫn phải đặt CPU/memory và IAM task role.
3. EKS: pod chạy trong node (EC2 hoặc Fargate), scale bằng HPA. Mạnh khi nhiều team, cần operator/CRD/service mesh; chi phí vận hành cao vì phải quản cluster, ingress, add-on, RBAC.

### Bảng chọn nhanh
| Tiêu chí | ECS Fargate | EKS | Lambda |
|---|---|---|---|
| Cold start | Không | Không | Có, tệ hơn với Java |
| Thời gian scale | Vài chục giây | Vài chục giây (HPA) | Vài giây |
| Giới hạn thời gian | Không, task chạy dài | Không | 15 phút mỗi lần gọi |
| Connection pool DB | Ổn định | Ổn định | Khó, mỗi env một pool |
| Chi phí khi tải thấp | Trung bình | Cao | Rất thấp |
| Đội cần biết | Docker, IAM | Kubernetes | IAM, event model |

### Ví dụ cấu hình ECS Fargate (rút gọn)
~~~yaml
family: orders-api
requiresCompatibilities: [FARGATE]
networkMode: awsvpc
cpu: 512              # 0,5 vCPU
memory: 1024          # 1 GB, chừa heap khoảng 75% = 768 MB
containerDefinitions:
  - name: api
    image: 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/orders:42
    portMappings: [{ containerPort: 8080 }]
    environment: [{ name: JAVA_OPTS, value: -XX:MaxRAMPercentage=75 }]
    healthCheck:
      command: [CMD-SHELL, curl -f http://localhost:8080/actuator/health || exit 1]
~~~

### Ví dụ đời thực
Một API đơn hàng Spring Boot 3 chạy trên 2 EC2 m5.large sau ALB. Triệu chứng: p99 giờ cao điểm 4-6 giây, scale-out mất 3-5 phút vì phải bật máy và khởi động JVM; CPU trung bình chỉ 35% nên trả tiền instance 24/7 rất lãng phí. Đội đóng Docker image, chuyển sang ECS Fargate 3 task (0,5 vCPU, 1 GB) sau ALB, cấu hình target tracking theo 60% CPU. Kết quả: không còn cold start, scale trong khoảng 30-45 giây, p99 giờ cao điểm còn khoảng 800 ms; chi phí compute giảm khoảng 30% so với 2 EC2 chạy 24/7. Khi một task bị thay, ALB tự chuyển traffic sang task khác nên không đứt request.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn theo hai câu hỏi: ai vận hành hạ tầng, và workload có chịu được cold start không. Với API Spring Boot traffic spiky, mặc định của tôi là ECS Fargate sau ALB vì container luôn ấm, không có cold start, scale trong vài chục giây và tôi không phải vá OS. Nếu traffic thấp, thất thường và chấp nhận được cold start, tôi cân nhắc Lambda, nhưng với Java tôi luôn bật SnapStart, publish version và trỏ alias, đồng thời xử lý connection và giá trị ngẫu nhiên sau restore bằng hook CRaC. EKS tôi chỉ chọn khi công ty đã có platform Kubernetes và cần nhiều team dùng chung, vì chi phí lớn nhất của Kubernetes là con người chứ không phải hoá đơn control plane. Tôi cũng luôn đo Init Duration và p99 trước khi quyết định."
> Senior tip: đừng chọn Lambda cho API Spring Boot chỉ vì "rẻ". Với Java, hãy đo Init Duration và Restore Duration trước; nếu p99 không đạt, ECS Fargate thường là con đường ngắn nhất tới production ổn định.`,
  follow: [
    'Nếu API chạy 24/7 traffic ổn định thì Fargate hay Lambda rẻ hơn, vì sao?',
    'SnapStart sau restore phải xử lý connection pool và random như thế nào?',
    'Làm sao scale ECS Fargate theo metric tuỳ chỉnh thay vì chỉ CPU?'
  ],
  tags: ['ECS', 'Fargate', 'EKS', 'Lambda', 'SnapStart', 'cold start', 'senior']
},
{
  id: 'aws-075',
  topic: 'aws',
  level: 'senior',
  q: 'RDS PostgreSQL Multi-AZ failover xảy ra: endpoint DNS đổi sang standby và kết nối cũ bị đứt. HikariCP phản ứng thế nào, cấu hình ra sao để giảm lỗi, và vì sao cần retry idempotent?',
  a: `**Tóm tắt:** Khi RDS PostgreSQL Multi-AZ failover, DNS của endpoint đổi từ primary sang standby (thường 60-120 giây) và mọi kết nối TCP cũ bị đứt. HikariCP không tự chữa kết nối chết; nếu không cấu hình đúng, request sẽ nhận connection hỏng và lỗi "Connection reset", pool cạn dần. Phải bật validation, đặt connectTimeout và socketTimeout hợp lý, keepalive, maxLifetime, và retry idempotent ở tầng ứng dụng.

### Hiểu nhanh
Hãy xem endpoint database như địa chỉ nhà: khi chuyển sang standby, AWS đổi biển địa chỉ (DNS) sang nhà mới. HikariCP giống quyển sổ ghi các đường dây đang gọi sẵn tới nhà cũ: khi nhà cũ đóng cửa, các đường dây đó chết, và nếu bạn không kiểm tra trước khi nói thì cuộc gọi đứt giữa chừng.

### Thuật ngữ
- Multi-AZ: standby đồng bộ ở AZ khác, tự lên thay khi primary hỏng.
- Failover: quá trình chuyển sang standby; với RDS DB instance thường mất khoảng 60-120 giây.
- DNS CNAME/endpoint: tên miền trỏ tới instance hiện tại; khi failover, AWS cập nhật bản ghi này và client phải resolve lại.
- HikariCP: connection pool phổ biến cho Java, giữ sẵn kết nối tới DB.
- connectTimeout: thời gian tối đa để mở một kết nối mới, tính bằng mili giây.
- socketTimeout: thời gian tối đa chờ một thao tác đọc/ghi trên socket.
- validationTimeout: thời gian tối đa để kiểm tra một connection còn sống.
- keepaliveTime: chu kỳ HikariCP gửi gói kiểm tra để phát hiện kết nối chết.
- maxLifetime: tuổi thọ tối đa của một connection trước khi pool tạo lại.

### Cơ chế từng bước: failover ảnh hưởng HikariCP ra sao
1. Primary hỏng, RDS đổi CNAME endpoint sang standby. Vì sao quan trọng: mọi client phải resolve lại DNS; nếu JVM cache DNS lâu (networkaddress.cache.ttl), nó vẫn trỏ IP cũ.
2. Các connection đang mở tới primary bị đứt: hoặc nhận TCP RST, hoặc treo đến khi socketTimeout. Vì sao: standby không có socket của primary.
3. HikariCP lấy connection từ pool. Nếu không bật connection test, request đầu tiên sau failover có thể nhận connection chết và ném SQLException. Vì sao: pool không biết connection đã chết cho tới khi dùng.
4. Trong lúc DNS chưa đổi xong (60-120 giây), mọi lần mở connection mới đều fail hoặc timeout. Vì sao: endpoint vẫn trỏ primary đã chết.
5. Sau khi DNS đổi và standby nhận vai trò, connection mới kết nối được; pool tự bơm lại. Vì sao: HikariCP giữ số connection tối thiểu và tạo lại khi thiếu.

### Cấu hình HikariCP cho failover êm
~~~yaml
spring.datasource.hikari:
  connection-timeout: 3000        # mở kết nối mới tối đa 3s, fail nhanh thay vì treo
  validation-timeout: 2000        # kiểm tra connection còn sống trong 2s
  keepalive-time: 30000           # mỗi 30s kiểm tra kết nối nhàn rỗi
  max-lifetime: 1200000           # 20 phút, ngắn hơn thời gian ngắt kết nối idle của PostgreSQL
  minimum-idle: 2
  maximum-pool-size: 10
  connection-test-query: SELECT 1  # hoặc để HikariCP dùng JDBC4 isValid
~~~

### Xử lý ở tầng ứng dụng
- Đặt JVM DNS TTL thấp ({{networkaddress.cache.ttl}}) để resolve lại nhanh sau failover.
- Retry idempotent: chỉ retry các thao tác đọc hoặc ghi đã thiết kế idempotent, kèm backoff; không retry bừa các lệnh ghi không idempotent.
- Đặt timeout ở tầng service ngắn hơn timeout của client để fail nhanh.
- Cân nhắc RDS Proxy: nó giữ pool và tự chuyển hướng sau failover, giảm số lần app gặp lỗi.

### Ví dụ đời thực
Một hệ thanh toán dùng HikariCP 10 connection, không cấu hình validation. Khi RDS Multi-AZ failover (diễn tập định kỳ), trong 90 giây đầu khoảng 40% request báo "Connection is not valid, cannot execute query" và "Connection reset"; p99 tăng từ 200 ms lên 8 giây, một số giao dịch phải retry thủ công. Điều tra: pool giữ connection tới IP primary cũ, không có keepalive nên không phát hiện chết; connectTimeout mặc định 30 giây khiến mỗi lần mở kết nối mới treo lâu. Xử lý: đặt connection-timeout 3 giây, validation-timeout 2 giây, keepalive 30 giây, max-lifetime 20 phút, thêm retry idempotent 2 lần với backoff 200-500 ms. Kết quả: lần failover tiếp theo chỉ còn khoảng 5-8% request lỗi trong 60 giây đầu, p99 còn khoảng 1,5 giây, không còn timeout treo 30 giây.

### Trả lời mẫu khi phỏng vấn
"Khi RDS Multi-AZ failover, endpoint DNS đổi sang standby trong khoảng 60-120 giây và mọi kết nối cũ bị đứt. HikariCP không tự biết connection chết, nên tôi bật keepalive và connection test để pool phát hiện sớm, đặt connection-timeout ngắn khoảng 3 giây để mở kết nối mới không treo, max-lifetime ngắn hơn thời gian ngắt kết nối idle của PostgreSQL, và socket timeout hợp lý. Quan trọng là JVM phải resolve lại DNS nhanh, nên tôi để TTL thấp. Cuối cùng tôi retry idempotent ở tầng ứng dụng với backoff, và cân nhắc RDS Proxy để nó giữ pool và chuyển hướng sau failover. Tôi luôn diễn tập failover định kỳ để đo số request lỗi và p99 thực tế."
> Senior tip: hãy diễn tập failover như một buổi tập cháy. Không cấu hình HikariCP thì 60-120 giây DNS đổi là 60-120 giây lỗi âm thầm; chỉ cần connectTimeout ngắn cộng keepalive cộng retry idempotent là phần lớn request sống sót.`,
  follow: [
    'Vì sao không nên đặt maxLifetime dài hơn thời gian ngắt kết nối idle của PostgreSQL?',
    'RDS Proxy giúp gì cho HikariCP khi có nhiều client hoặc dùng Lambda?',
    'Làm sao biết request nào an toàn để retry sau failover?'
  ],
  tags: ['RDS', 'PostgreSQL', 'Multi-AZ', 'failover', 'HikariCP', 'DNS', 'senior']
},
{
  id: 'aws-076',
  topic: 'aws',
  level: 'senior',
  q: 'Một job SQS chạy 20 phút nhưng visibility timeout chỉ 30 giây. Message bị xử lý trùng, và với FIFO thì cả message group bị chặn. Bạn thiết kế lại visibility timeout, heartbeat, DLQ và FIFO thế nào?',
  a: `**Tóm tắt:** Với job chạy lâu hơn visibility timeout, SQS tưởng job đã chết và giao message cho consumer khác, gây xử lý trùng. Cách xử lý: đặt visibility timeout bằng thời gian xử lý xấu nhất cộng đệm (tối đa 12 giờ), hoặc dùng heartbeat ChangeMessageVisibility để gia hạn khi job còn chạy. FIFO giữ thứ tự theo message group nên một job dài sẽ chặn cả group; hãy chia group theo khoá nghiệp vụ. DLQ gom message thất bại nhiều lần để không chặn hàng đợi.

### Hiểu nhanh
Hãy xem visibility timeout như thời gian giữ chỗ ở trạm bưu điện: khi bạn nhận bưu kiện, trạm giữ chỗ cho bạn trong 30 giây; nếu bạn chưa xử lý xong và quay lại, trạm nghĩ bạn đã bỏ chạy và giao bưu kiện cho người khác. Với job 20 phút mà giữ chỗ 30 giây, chắc chắn có người khác xử lý trùng. Heartbeat giống bạn gọi điện "tôi vẫn đang xử lý, giữ chỗ thêm cho tôi".

### Thuật ngữ
- Visibility timeout: khoảng thời gian message bị ẩn sau khi consumer nhận, để consumer xử lý; hết hạn thì message hiện lại.
- ChangeMessageVisibility: lệnh gia hạn, hoặc rút ngắn, thời gian ẩn của một message đang xử lý.
- In-flight message: message đã được nhận nhưng chưa bị xoá.
- DLQ (Dead Letter Queue): hàng đợi chứa message thất bại sau {{maxReceiveCount}} lần nhận.
- Redrive: chuyển message từ DLQ về hàng đợi chính để xử lý lại.
- MessageGroupId: khoá nhóm của FIFO; thứ tự được đảm bảo trong cùng một group.
- Long polling: kỹ thuật chờ message thay vì trả về ngay, giảm số lần gọi rỗng.

### Cơ chế: job chạy 20 phút, visibility timeout 30 giây
1. Consumer nhận message, SQS ẩn message trong 30 giây (visibility timeout mặc định). Vì sao: để consumer khác không xử lý cùng lúc.
2. Job chạy 20 phút, vượt 30 giây. Vì sao có vấn đề: SQS cho rằng consumer đã chết và hiện message lại.
3. Consumer khác, hoặc consumer khác thread, nhận lại message và chạy job lần hai. Vì sao: SQS không biết job vẫn đang chạy.
4. Kết quả: hai lần xử lý cùng một job, có thể gửi email hai lần hoặc trừ tiền hai lần. Vì sao: SQS là at-least-once, không phải exactly-once.

### Ba cách xử lý job dài
1. Đặt visibility timeout dài bằng thời gian xấu nhất cộng đệm: đơn giản, nhưng nếu job chết giữa chừng thì phải chờ hết timeout mới retry, và timeout tối đa là 12 giờ. Với job 20 phút, đặt 30 phút là hợp lý.
2. Heartbeat bằng ChangeMessageVisibility: một scheduler định kỳ, ví dụ mỗi 10 giây với timeout 30 giây, gọi gia hạn khi job còn sống. Job chết thì ngừng gia hạn, message hiện lại sau timeout. Cách này cân bằng giữa retry nhanh và không xử lý trùng.
3. Tách việc dài khỏi message ngắn: giao message "job này cần xử lý" cho một worker, worker cập nhật trạng thái và tự chia nhỏ; hoặc dùng Step Functions để điều phối các bước dài. Vì sao: giữ hàng đợi nhẹ, tránh chặn.

### Lưu ý riêng cho FIFO
FIFO đảm bảo thứ tự trong một message group. Nếu một message trong group chạy 20 phút, các message phía sau trong cùng group phải chờ (head-of-line blocking). Với job dài cần song song, hãy chia nhiều message group theo khoá nghiệp vụ khác nhau, đừng dồn tất cả vào một group.

### Ví dụ code: worker SQS có heartbeat (rút gọn)
~~~java
// Worker SQS: gia hạn visibility khi job còn chạy; body là logic job của bạn
void process(SqsClient sqs, String queueUrl, Message msg) {
    var handle = msg.receiptHandle();
    var deadline = Instant.now().plusSeconds(30);   // visibility timeout 30s
    try (var job = openJob(msg.body())) {           // job chạy lâu, có thể > 30s
        while (job.hasMore() && Instant.now().isBefore(deadline)) {
            job.step();
            sqs.changeMessageVisibility(b -> b.queueUrl(queueUrl)
                .receiptHandle(handle).visibilityTimeout(30)); // nới thêm 30s
        }
        sqs.deleteMessage(b -> b.queueUrl(queueUrl).receiptHandle(handle));
    } catch (Exception e) {
        log.error("job fail, se retry sau khi het timeout", e); // không xoá -> SQS retry
    }
}
~~~

### Ví dụ đời thực
Một service tạo báo cáo PDF mất khoảng 15 phút, visibility timeout để mặc định 30 giây. Triệu chứng: mỗi báo cáo bị tạo 2-3 lần, người dùng nhận email trùng, CPU tăng vọt vì 3 consumer chạy song song cùng job. Điều tra CloudWatch: ApproximateNumberOfMessagesVisible dao động mạnh, NumberOfMessagesDeleted thấp hơn NumberOfMessagesReceived nhiều. Nguyên nhân gốc: job dài hơn visibility timeout nên message hiện lại liên tục. Xử lý: đặt visibility timeout 1 giờ, thêm heartbeat ChangeMessageVisibility mỗi 30 giây, làm consumer idempotent theo {{reportId}}, cấu hình DLQ với maxReceiveCount 3. Kết quả: số lần tạo lại mỗi báo cáo còn đúng 1, số message trong DLQ giảm về 0, p99 thời gian tạo báo cáo không đổi.

### Trả lời mẫu khi phỏng vấn
"Với SQS, message là at-least-once: khi consumer nhận, message bị ẩn trong visibility timeout; nếu chưa xoá kịp, message hiện lại và có thể bị xử lý lần nữa. Với job dài, tôi đặt visibility timeout bằng thời gian xử lý xấu nhất cộng đệm, tối đa 12 giờ; nếu job quá dài hoặc cần retry nhanh, tôi dùng heartbeat ChangeMessageVisibility để gia hạn khi job còn sống. Với FIFO, tôi nhớ rằng thứ tự chỉ đảm bảo trong một message group, nên job dài sẽ chặn cả group; tôi chia message group theo khoá nghiệp vụ để song song. Cuối cùng tôi luôn làm consumer idempotent theo khoá nghiệp vụ và dùng DLQ với maxReceiveCount hợp lý để message lỗi không chặn hàng đợi."
> Senior tip: job dài cộng visibility timeout ngắn là công thức tạo duplicate. Mặc định của tôi: timeout bằng thời gian xấu nhất cộng 50% đệm, cộng heartbeat nếu job có thể chạy lâu, cộng idempotent theo khoá nghiệp vụ. Ba lớp này giải quyết gần hết sự cố SQS trên production.`,
  follow: [
    'Heartbeat bằng ChangeMessageVisibility có race với lúc message hết hạn không?',
    'Vì sao FIFO vẫn có thể xử lý trùng và cần MessageDeduplicationId?',
    'Khi nào nên chuyển job dài sang Step Functions thay vì SQS?'
  ],
  tags: ['SQS', 'FIFO', 'visibility timeout', 'DLQ', 'heartbeat', 'job dài', 'senior']
},
{
  id: 'aws-077',
  topic: 'aws',
  level: 'senior',
  q: 'Một service Java ở tài khoản A cần đọc file trên S3 của tài khoản B (đối tác). Hãy thiết kế IAM role, trust policy và bucket policy, và giải thích vì sao không dùng access key?',
  a: `**Tóm tắt:** Dịch vụ không nên cầm access key; nó nên dùng IAM role. Khi service ở tài khoản A cần đọc S3 của tài khoản B, ta dùng cross-account role: role ở B tin, qua trust policy, principal ở A, có ExternalId chống confused deputy, và policy chỉ cho đúng action trên đúng ARN. AWS SDK v2 tự lấy credential tạm qua provider chain nên code không chứa key.

### Hiểu nhanh
Access key giống chìa khoá vĩnh viễn: lộ một lần là kẻ gian vào mãi. IAM role giống thẻ khách có hạn: ai đủ điều kiện thì được phát thẻ, thẻ tự hết hạn. Cross-account giống việc công ty A muốn nhân viên vào kho của công ty B: B không phát chìa cho A, mà ghi vào hợp đồng "nhân viên của A, khi xuất trình đúng mã ExternalId, được vào kho của tôi, chỉ lấy đúng thùng X".

### Thuật ngữ
- IAM role: danh tính tạm thời, được assume qua STS, trả về credential có session token và thời hạn.
- Trust policy: policy gắn vào role, quy định principal nào được assume.
- Identity-based policy: policy gắn vào user/role, quy định role đó được làm gì.
- Resource-based policy: policy gắn vào tài nguyên như bucket S3, queue SQS, key KMS, quy định ai được truy cập tài nguyên.
- ExternalId: chuỗi bí mật hai bên thoả thuận, chống confused deputy.
- Confused deputy: lỗ hổng khi một dịch vụ có quyền bị kẻ khác lợi dụng để hành động thay.
- Credential provider chain: chuỗi nguồn credential SDK tự dò: env, profile, container endpoint trên ECS, IMDS trên EC2.

### Cơ chế: service tài khoản A đọc S3 tài khoản B
1. Task role ở tài khoản A có identity policy cho phép {{sts:AssumeRole}} trên ARN role ở B. Vì sao: A phải được phép xin thẻ của B.
2. Role ở B có trust policy: Principal là ARN task role của A, kèm Condition {{sts:ExternalId}} bằng mã hai bên thoả thuận. Vì sao: chỉ đúng principal cộng đúng mã mới được assume, chống confused deputy.
3. Role ở B có permission policy: {{s3:GetObject}} trên {{arn:aws:s3:::partner-bucket/*}}. Vì sao: giới hạn đúng action và đúng tài nguyên.
4. Bucket của B có bucket policy cho phép role ở B truy cập. Vì sao: nếu bucket có resource policy chặn, phải mở ở cả hai nơi, identity và resource.
5. SDK của app, chạy ở A, tự gọi AssumeRole rồi dùng credential tạm. Vì sao: không có access key nào trong image hay biến môi trường.

### Trust policy ở tài khoản B (rút gọn)
~~~json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::111122223333:role/orders-task-role" },
    "Action": "sts:AssumeRole",
    "Condition": { "StringEquals": { "sts:ExternalId": "partner-2026-x7q" } }
  }]
}
~~~

### Policy quyền ở role B
~~~json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::partner-bucket/*"
  }]
}
~~~

### Identity vs resource policy
| | Identity-based | Resource-based |
|---|---|---|
| Gắn vào | User hoặc role | Tài nguyên: bucket, queue, key |
| Ai được cấp | Principal trong policy | Ghi rõ account hoặc role được phép |
| Khi nào cần | Luôn nên có, least privilege | Khi cho truy cập từ tài khoản khác hoặc dịch vụ AWS |

Thực tế cross-account thường cần cả hai: role ở B (identity) và bucket policy ở B (resource). Nếu chỉ có một trong hai, request bị từ chối ngầm.

### Ví dụ đời thực
Một service đơn hàng ở tài khoản A cần đọc file hoá đơn trên S3 của đối tác ở tài khoản B. Ban đầu team copy access key của B vào biến môi trường để chạy cho nhanh. Triệu chứng: ba tháng sau key vẫn còn trong task definition, một nhân viên cũ vẫn truy cập được bucket; khi đối tác thu hồi key, service đổ toàn bộ. Điều tra CloudTrail cho thấy request đến từ IAM user chứ không phải role. Xử lý: xoá key, tạo cross-account role ở B với trust policy trỏ task role của A và ExternalId, thêm bucket policy cho role đó, chỉ cho {{s3:GetObject}} trên prefix hoá đơn. Kết quả: không còn credential dài hạn, khi một task bị chiếm thì kẻ tấn công chỉ đọc được đúng prefix được phép, và đối tác có thể thu hồi quyền tức thì bằng cách sửa trust policy.

### Trả lời mẫu khi phỏng vấn
"Tôi không bao giờ để dịch vụ cầm access key. Dịch vụ dùng IAM role, SDK tự lấy credential tạm qua provider chain: task role trên ECS, IRSA hoặc Pod Identity trên EKS, execution role trên Lambda. Khi service ở tài khoản A cần tài nguyên của tài khoản B, tôi dùng cross-account role: role ở B có trust policy chỉ tin task role của A và bắt buộc ExternalId để chống confused deputy, còn permission policy chỉ cho đúng action trên đúng ARN. Nếu bucket ở B có bucket policy, tôi mở cả resource policy, vì IAM đánh giá cả identity và resource; thiếu một bên là từ chối ngầm. Cách này giúp thu hồi quyền tức thì và nếu service bị chiếm thì thiệt hại chỉ giới hạn ở đúng tài nguyên đó."
> Senior tip: hãy coi mỗi service là một principal riêng và hỏi "nếu service này bị chiếm thì kẻ tấn công chạm được gì". ExternalId là thứ nhiều người quên nhưng lại là ranh giới sống còn của cross-account; thiếu nó, một tài khoản thứ ba có thể giả danh để đọc dữ liệu của bạn.`,
  follow: [
    'Vì sao cross-account thường cần cả identity policy và bucket policy?',
    'ExternalId chống confused deputy hoạt động cụ thể ra sao?',
    'Làm sao thu hồi quyền của đối tác ngay lập tức mà không service nào gãy?'
  ],
  tags: ['IAM', 'role', 'cross-account', 'S3', 'trust policy', 'ExternalId', 'senior']
},
{
  id: 'aws-078',
  topic: 'aws',
  level: 'senior',
  q: 'Bạn gọi Amazon Bedrock (Claude) từ Java trong VPC không có Internet. PrivateLink, IAM và quota hoạt động thế nào, và retry ra sao khi gặp throttling?',
  a: `**Tóm tắt:** Gọi Amazon Bedrock (Claude) từ Java bằng AWS SDK v2; trong VPC không có Internet thì dùng VPC interface endpoint, tức PrivateLink, cho bedrock-runtime. Về hạn mức: on-demand giới hạn theo TPM/RPM của model, vượt thì nhận ThrottlingException (429) và phải retry với backoff; hoặc mua Provisioned Throughput. Gọi Bedrock tốn tiền theo token nên cần đo và kiểm soát.

### Hiểu nhanh
Bedrock là siêu thị mô hình AI: bạn không tự chạy model, chỉ gọi API và trả tiền theo lượng chữ vào/ra, gọi là token. PrivateLink giống đường hầm riêng đi thẳng tới siêu thị mà không phải ra đường lớn, tức Internet. Hạn mức, quota, giống số món tối đa siêu thị bán cho bạn mỗi phút. Retry giống xếp hàng lại khi hết món, và backoff là chờ lâu hơn mỗi lần thử để không dồn dập.

### Thuật ngữ
- Amazon Bedrock: dịch vụ quản lý và gọi các foundation model như Claude, Titan, Llama qua API.
- Foundation model (FM): mô hình nền tảng đã huấn luyện sẵn, ví dụ Claude.
- Inference profile: cấu hình định tuyến tới một model cụ thể theo region; dùng ARN của nó trong request.
- On-demand: trả theo token, chịu giới hạn TPM/RPM theo model và account.
- Provisioned Throughput: đặt trước năng lực cho một model, trả theo giờ, không bị throttling như on-demand.
- TPM/RPM: số token/phút và số request/phút tối đa.
- PrivateLink / VPC interface endpoint: ENI trong subnet cho phép gọi dịch vụ AWS bằng IP riêng, không qua Internet.
- Converse API / InvokeModel: hai cách gọi model của Bedrock; Converse model-agnostic và phù hợp cho chat.

### Cơ chế: Java gọi Claude qua PrivateLink
1. Tạo VPC interface endpoint cho dịch vụ {{bedrock-runtime}} trong subnet private, bật private DNS. Vì sao: SDK dùng tên miền chuẩn nhưng gói đi tới ENI nội bộ, không ra Internet.
2. Security group của endpoint chỉ cho 443 từ security group của service. Vì sao: chỉ service của bạn mới gọi được, giảm bề mặt tấn công.
3. IAM task role có {{bedrock:InvokeModel}} và {{bedrock:InvokeModelWithResponseStream}} trên ARN model hoặc inference profile. Vì sao: mỗi model có ARN riêng, least privilege theo đúng model dùng.
4. Dùng {{BedrockRuntimeClient}} của AWS SDK v2, gọi {{converse}} với modelId là inference profile của Claude. Vì sao: SDK tự chọn endpoint qua cơ chế endpoint của VPC và ký SigV4.
5. Nếu vượt hạn mức, Bedrock trả ThrottlingException; SDK có retry sẵn nhưng bạn nên cấu hình backoff cộng jitter, hoặc chuyển sang Provisioned Throughput cho tải ổn định.
6. Response có token usage; với phản hồi dài, dùng streaming để giảm thời gian chờ và hiển thị dần.

### Ví dụ gọi Claude bằng SDK v2 (rút gọn)
~~~java
// Chạy trên ECS/Lambda trong private subnet, có VPC endpoint bedrock-runtime
var client = BedrockRuntimeClient.builder()
    .region(Region.AP_SOUTHEAST_1)
    .overrideConfiguration(c -> c.retryPolicy(r -> r.numRetries(5))) // backoff sẵn
    .build();

var req = ConverseRequest.builder()
    .modelId(modelId)                       // inference profile của Claude, lấy ở console
    .messages(Message.builder().role("user")
        .content(ContentBlock.fromText("Tóm tắt văn bản sau: " + text)).build())
    .inferenceConfig(c -> c.maxTokens(512).temperature(0.2f))
    .build();

var resp = client.converse(req);           // ném ThrottlingException nếu vượt TPM/RPM
var answer = resp.output().message().content().get(0).text();
~~~

### Hạn mức và retry
- On-demand: giới hạn theo TPM/RPM của từng model; khi vượt, lỗi là throttling. Retry với exponential backoff cộng jitter, ví dụ 200 ms, 400 ms, 800 ms, và giới hạn số lần.
- Provisioned Throughput: đặt trước năng lực, trả theo giờ, phù hợp tải nền ổn định và cần độ trễ dự đoán được.
- Theo dõi CloudWatch metric Invocations, InvocationThrottles, InvocationClientErrors và token count để phát hiện sớm.

### Ví dụ đời thực
Một hệ thống tóm tắt tài liệu gọi Claude qua Bedrock on-demand, traffic giờ cao điểm khoảng 200 request/phút, mỗi request vào 3.000 token và ra 500 token. Triệu chứng: giờ cao điểm khoảng 15% request trả 429 ThrottlingException, p99 tăng từ 2 giây lên 9 giây vì SDK retry mặc định quá ít; ngoài ra traffic đi qua NAT Gateway làm hoá đơn NAT tăng. Điều tra CloudWatch: InvocationThrottles tăng đúng lúc RPM vượt hạn mức model, và VPC Flow Logs cho thấy request Bedrock đi qua NAT. Xử lý: tạo VPC interface endpoint cho bedrock-runtime cộng private DNS để hết đi NAT, cấu hình retry 5 lần backoff cộng jitter, giảm maxTokens và tóm tắt theo lô, mua Provisioned Throughput cho phần tải nền. Kết quả: throttling còn dưới 1%, p99 khoảng 2,5 giây, chi phí NAT giảm khoảng 60% cho phần gọi Bedrock.

### Trả lời mẫu khi phỏng vấn
"Tôi gọi Bedrock bằng AWS SDK v2, dùng BedrockRuntimeClient và Converse API với modelId là inference profile của Claude. Trong VPC không Internet, tôi tạo VPC interface endpoint cho bedrock-runtime và bật private DNS, security group chỉ cho 443 từ service, còn IAM role chỉ có InvokeModel trên đúng ARN model. Về hạn mức, on-demand giới hạn TPM/RPM nên tôi cấu hình retry với backoff và jitter, theo dõi CloudWatch InvocationThrottles, và mua Provisioned Throughput cho phần tải nền cần ổn định. Vì Bedrock tính tiền theo token, tôi kiểm soát maxTokens, tóm tắt theo lô và đo token usage, đồng thời luôn đo p99 và số throttling trước và sau khi đổi cấu hình."
> Senior tip: gọi Bedrock trong VPC mà quên PrivateLink là một trong những cách âm thầm làm hoá đơn NAT tăng; hãy tạo interface endpoint cho bedrock-runtime ngay từ đầu. Và đừng retry vô hạn khi throttling: backoff cộng jitter, cộng theo dõi InvocationThrottles, cộng Provisioned Throughput cho tải nền.`,
  follow: [
    'VPC interface endpoint cho bedrock-runtime khác gateway endpoint S3 ở điểm nào?',
    'On-demand và Provisioned Throughput khác nhau ra sao về chi phí và độ trễ?',
    'Làm sao giảm token và chi phí khi tóm tắt tài liệu dài bằng Claude?'
  ],
  tags: ['Bedrock', 'Claude', 'PrivateLink', 'VPC endpoint', 'quota', 'retry', 'senior']
},
{
  id: 'aws-079',
  topic: 'aws',
  level: 'senior',
  q: 'Bạn được giao nhiệm vụ giảm 30% hóa đơn EC2/RDS trong 3 tháng mà không ảnh hưởng SLO. Bạn sẽ làm từng bước thế nào, và những đòn bẩy tiết kiệm lớn nhất là gì?',
  a: `**Tóm tắt:** Giảm chi phí AWS không bắt đầu từ mua Savings Plans mà từ **đo lường và rightsizing**: bật Cost Explorer + Compute Optimizer, tìm **EC2/RDS oversized**, **idle resource** (volume unattached, EIP không dùng, snapshot cũ), **dữ liệu truy cập ít**; sau đó tối ưu kiến trúc (Graviton, Auto Scaling, Spot cho workload phù hợp), cuối cùng mới cam kết **Savings Plans/Reserved Instances** cho phần tải nền đã ổn định. Mỗi bước đều có số đo trước/sau.

### Bước 1 — Đo lường (tuần 1)
- Bật **AWS Cost Explorer**, **Cost and Usage Report (CUR)** export ra S3, **AWS Budgets** cảnh báo vượt ngưỡng.
- Bật **Compute Optimizer** (miễn phí) cho EC2, EBS, Lambda, ECS — nó đề xuất size dựa trên metric CloudWatch 14 ngày.
- Lập danh sách **idle**: EC2 CPU < 5% liên tục 14 ngày, volume EBS không attach, Elastic IP không attach, Load Balancer không có target, RDS instance CPU thấp nhưng storage lớn.

### Bước 2 — Rightsizing (tuần 2-3)
- Giảm size instance theo đề xuất Compute Optimizer (ví dụ m5.2xlarge → m5.xlarge nếu CPU trung bình 12%).
- RDS: chuyển từ **provisioned IOPS** sang **gp3** (rẻ hơn, tự đặt IOPS), giảm storage đã cấp dư, dùng **Aurora Serverless v2** cho workload biến thiên.
- EBS: xóa volume unattached, chuyển gp2 → gp3, snapshot lifecycle (xóa snapshot cũ hơn N ngày).

### Bước 3 — Kiến trúc (tuần 3-6)
- **Graviton (arm64)**: chuyển workload Java/Spring sang instance c7g/r7g — thường rẻ hơn và nhanh hơn x86; kiểm tra dependency (native lib, JNI).
- **Auto Scaling** theo metric thực (CPU/queue depth) thay vì giữ capacity cố định 24/7.
- **Spot** cho batch, CI runner, dev env; giữ on-demand cho production critical.
- **Savings Plans** (Compute Savings Plans linh hoạt nhất) cho phần base load đã ổn định ≥ 1 năm.

### Bước 4 — Cam kết (tuần 6-8)
- Mua Savings Plans 1 năm No Upfront hoặc Partial Upfront tùy dòng tiền; tránh All Upfront nếu chưa chắc.
- Reserved Instance cho RDS/Redshift/ElastiCache nếu workload ổn định.

### Ví dụ đời thực
Một SaaS B2B: hóa đơn EC2 18.000 USD/tháng. Rightsizing theo Compute Optimizer giảm 22% (4.000 USD). Chuyển 40% workload sang Graviton giảm thêm 15%. Bật Auto Scaling cho môi trường staging ban đêm giảm 60% chi phí staging. Mua Compute Savings Plans 1 năm cho base load giảm thêm 20% trên phần cam kết. Tổng giảm khoảng 45% (8.100 USD/tháng) sau 8 tuần, SLO không đổi. Sai lầm đầu tiên của team là mua Savings Plans trước khi rightsizing — đã cam kết cho instance oversized.

### Trả lời mẫu khi phỏng vấn
"Tôi làm theo thứ tự: đo lường trước (Cost Explorer, CUR, Compute Optimizer), rightsizing và dọn idle, tối ưu kiến trúc (Graviton, Auto Scaling, Spot), cuối cùng mới cam kết Savings Plans/RI cho phần tải nền đã ổn định. Tôi luôn đo trước/sau và đặt Budgets cảnh báo. Đòn bẩy lớn nhất thường là rightsizing và dọn idle chứ không phải mua Savings Plans, và mua Savings Plans trước khi rightsizing là sai lầm phổ biến."

> Senior tip: **mua Savings Plans trước khi rightsizing là sai lầm kinh điển** — bạn đã cam kết trả tiền cho capacity oversized. Luôn rightsizing và ổn định workload trước, rồi mới cam kết.`,
  follow: [
    'Compute Savings Plans và EC2 Instance Savings Plans khác nhau thế nào?',
    'Khi nào nên dùng Spot thay vì Savings Plans?',
    'Làm sao phân bổ chi phí theo team/product (showback/chargeback)?'
  ],
  tags: ['AWS', 'cost', 'rightsizing', 'Savings Plans', 'Graviton', 'senior']
},
{
  id: 'aws-080',
  topic: 'aws',
  level: 'senior',
  q: 'NAT Gateway thường là "bẫy chi phí" trong VPC. Khi nào chi phí NAT tăng bất thường, và dùng VPC endpoint thế nào để giảm?',
  a: `**Tóm tắt:** NAT Gateway tính tiền theo **giờ chạy + mỗi GB dữ liệu đi qua**. Chi phí bất thường thường đến từ **traffic lớn đi qua NAT**: gọi S3/DynamoDB/Bedrock, pull image từ ECR, download package, log shipping. Giải pháp: **Gateway endpoint** (miễn phí) cho S3 và DynamoDB; **Interface endpoint (PrivateLink)** cho các dịch vụ AWS khác; đặt tài nguyên trong private subnet với endpoint; tránh route 0.0.0.0/0 qua NAT cho traffic nội bộ.

### Vì sao NAT Gateway đắt
- Phí giờ: khoảng 0,045 USD/giờ/ AZ (~32 USD/tháng/AZ) kể cả khi không có traffic.
- Phí dữ liệu: khoảng 0,045 USD/GB xử lý, cộng phí cross-AZ nếu traffic đi qua AZ khác.
- Một pod tải 100GB từ S3 qua NAT = 4,5 USD chỉ phí xử lý, chưa kể phí cross-AZ.

### Nguồn traffic bất thường
- Service trong private subnet gọi S3/DynamoDB → đi qua NAT thay vì endpoint.
- EKS node pull image từ ECR (ECR API + S3 layer) → đi NAT.
- CloudWatch Logs agent shipping log → đi NAT.
- Lambda trong VPC gọi DynamoDB/S3 → đi NAT.
- Package manager (npm, pip, apt) trong CI runner.

### Giải pháp VPC endpoint
| Loại | Dịch vụ | Chi phí | Cách dùng |
|---|---|---|---|
| Gateway endpoint | S3, DynamoDB | Miễn phí (chỉ phí request S3/DynamoDB) | Route table trỏ prefix list S3/DynamoDB vào endpoint |
| Interface endpoint (PrivateLink) | ECR, CloudWatch, Bedrock, Secrets Manager, v.v. | Phí giờ + GB | ENI trong subnet, security group 443, private DNS |

### Các bước
1. Tạo **Gateway endpoint** cho S3 và DynamoDB ở mỗi VPC, gắn vào route table của private subnet.
2. Tạo **Interface endpoint** cho các dịch vụ hay gọi (ECR API + ECR DKR, CloudWatch Logs, Secrets Manager, STS, Bedrock runtime).
3. Bật **private DNS** trên interface endpoint để SDK tự resolve tên dịch vụ sang endpoint (không đổi code).
4. Security group của endpoint cho phép 443 từ subnet service.
5. Kiểm tra **VPC Flow Logs** hoặc CUR để xác nhận traffic không còn đi NAT.

### Ví dụ đời thực
Một hệ thống EKS: hóa đơn NAT 6.000 USD/tháng. Điều tra Flow Logs: 70% traffic là pull image ECR và ship log CloudWatch, 20% gọi S3. Tạo gateway endpoint S3 + interface endpoint ECR (api + dkr) + CloudWatch Logs, bật private DNS. Hóa đơn NAT giảm xuống 800 USD/tháng (chỉ còn traffic npm/pip và một số API bên ngoài), tổng tiết kiệm ~5.200 USD/tháng. Chi phí endpoint interface ~400 USD/tháng nhưng vẫn lời lớn.

### Trả lời mẫu khi phỏng vấn
"NAT Gateway tính tiền theo giờ và mỗi GB đi qua, nên traffic lớn tới S3/DynamoDB/ECR/CloudWatch qua NAT là bẫy chi phí. Tôi dùng Gateway endpoint miễn phí cho S3 và DynamoDB, Interface endpoint (PrivateLink) cho các dịch vụ khác, bật private DNS để SDK không đổi code, security group chỉ mở 443. Sau đó kiểm tra VPC Flow Logs/CUR để xác nhận traffic đã chuyển sang endpoint. Với workload EKS, endpoint ECR (api + dkr) và CloudWatch Logs thường là đòn bẩy lớn nhất."

> Senior tip: **bật private DNS** trên interface endpoint là bước hay bị quên — không bật thì SDK vẫn resolve tên dịch vụ ra public IP và đi qua NAT, endpoint vô dụng. Luôn kiểm tra bằng Flow Logs sau khi tạo.`,
  follow: [
    'Gateway endpoint và Interface endpoint khác nhau thế nào về chi phí và cơ chế?',
    'PrivateLink endpoint policy dùng để làm gì?',
    'Làm sao phát hiện traffic bất thường qua NAT Gateway?'
  ],
  tags: ['AWS', 'VPC', 'NAT Gateway', 'PrivateLink', 'VPC endpoint', 'cost', 'senior']
},
{
  id: 'aws-081',
  topic: 'aws',
  level: 'senior',
  q: 'S3 thường là kho dữ liệu lớn nhất và hóa đơn lưu trữ tăng dần theo thời gian. Bạn thiết kế lifecycle và Intelligent-Tiering thế nào để giảm chi phí mà không mất dữ liệu?',
  a: `**Tóm tắt:** Dữ liệu S3 có **pattern truy cập giảm dần theo thời gian** (hot → warm → cold → archive). Dùng **S3 Lifecycle rules** để chuyển object sang storage class rẻ hơn sau N ngày (Standard → Standard-IA → Glacier Instant Retrieval → Glacier Deep Archive) và **expire** object không cần. Dùng **S3 Intelligent-Tiering** khi pattern truy cập không đoán được — nó tự chuyển tier theo truy cập, không phí retrieval. Kết hợp **prefix/tag filter**, **multipart cleanup**, **versioning lifecycle**, và **S3 Storage Lens** để đo lường.

### Storage classes (giá giảm dần, retrieval tăng)
- Standard: truy cập thường xuyên.
- Standard-IA: truy cập không thường xuyên (tối thiểu 30 ngày, phí retrieval).
- Glacier Instant Retrieval: truy cập hiếm nhưng cần ms (tối thiểu 90 ngày).
- Glacier Flexible Retrieval: phút-giờ.
- Glacier Deep Archive: giờ, rẻ nhất (tối thiểu 180 ngày).

### Lifecycle rules
- Chuyển theo age: sau 30 ngày → Standard-IA, sau 90 ngày → Glacier IR, sau 365 ngày → Deep Archive.
- Expire object sau N ngày (log, temp upload).
- Xóa **incomplete multipart uploads** sau 7 ngày (rất hay bị quên, tốn tiền).
- Với **versioning**: expire noncurrent versions sau N ngày, xóa delete markers.

### Intelligent-Tiering
- Tự chuyển giữa Frequent/Infrequent/Archive Instant/Archive/Deep Archive theo truy cập.
- Không phí retrieval khi chuyển tier; phí monitoring nhỏ mỗi 1000 object.
- Phù hợp khi **không đoán được** pattern truy cập; không nên dùng cho object nhỏ (< 128KB không được tier) hoặc object tồn tại ngắn.

### Ví dụ đời thực
Một nền tảng log/analytics: bucket log 200TB Standard, hóa đơn 4.600 USD/tháng. Thiết kế lifecycle: log raw sau 7 ngày → Standard-IA, sau 30 ngày → Glacier IR, sau 90 ngày → Deep Archive, expire sau 365 ngày; xóa incomplete multipart. Bucket dữ liệu user upload dùng Intelligent-Tiering vì truy cập không đoán được. Sau 60 ngày hóa đơn storage giảm xuống ~900 USD/tháng (giảm ~80%), dữ liệu vẫn truy vấn được khi cần (Glacier IR ms). Kiểm tra Storage Lens hàng tháng.

### Trả lời mẫu khi phỏng vấn
"Tôi phân tích pattern truy cập theo thời gian. Dữ liệu có vòng đời rõ (log, backup) → Lifecycle rules chuyển Standard → IA → Glacier → Deep Archive và expire sau N ngày, nhớ dọn incomplete multipart và noncurrent versions. Dữ liệu pattern không đoán được → Intelligent-Tiering tự tier, không phí retrieval. Tôi dùng prefix/tag filter để rule đúng phạm vi, và S3 Storage Lens + CUR để đo hiệu quả và điều chỉnh ngưỡng."

> Senior tip: **incomplete multipart uploads** là chi phí "vô hình" phổ biến — upload thất bại để lại parts vẫn tính tiền. Luôn có rule AbortIncompleteMultipartUpload sau 7 ngày. Và Glacier Deep Archive có phí retrieval + thời gian chờ: đừng archive dữ liệu cần truy vấn thường xuyên.`,
  follow: [
    'Glacier Instant Retrieval và Standard-IA khác nhau ra sao?',
    'Khi nào Intelligent-Tiering không hiệu quả?',
    'S3 Object Lock và versioning ảnh hưởng lifecycle thế nào?'
  ],
  tags: ['AWS', 'S3', 'lifecycle', 'Intelligent-Tiering', 'Glacier', 'cost', 'senior']
},
{
  id: 'aws-082',
  topic: 'aws',
  level: 'senior',
  q: 'CloudWatch Logs chi phí tăng nhanh và khó kiểm soát. Bạn giảm chi phí log thế nào mà vẫn đủ observability?',
  a: `**Tóm tắt:** CloudWatch Logs tính tiền theo **GB ingested + GB lưu trữ + query (Logs Insights)**. Giảm chi phí bằng cách **lọc tại nguồn** (log level, sampling), **đặt retention** thay vì giữ mãi, **export sang S3** cho log lạnh (rẻ hơn nhiều), dùng **subscription filter** sang Kinesis/Firehose, và **structured logging** để query hiệu quả hơn. Observability vẫn đủ nếu giữ metric và trace, và giữ log lỗi/warn đầy đủ.

### Đòn bẩy chi phí
- **Retention**: mặc định "Never expire" → đặt 7/14/30/90 ngày theo loại log (debug 7 ngày, audit 1 năm).
- **Filter tại nguồn**: chỉ gửi WARN/ERROR ở production; DEBUG chỉ khi cần (feature flag).
- **Sampling**: log 1/10 request thành công, 100% request lỗi.
- **Export to S3**: log cũ chuyển sang S3 (rẻ) qua subscription filter hoặc scheduled export; truy vấn bằng Athena.
- **Structured JSON log**: query bằng Logs Insights rẻ và nhanh hơn parse text; giảm thời gian scan.
- **Metric filter / Embedded Metric Format (EMF)**: tạo metric từ log thay vì lưu toàn bộ log để dashboard.
- **Log group theo service**: dễ đặt retention và quyền riêng.

### Điều cần giữ
- Log lỗi và cảnh báo đầy đủ (không sampling).
- Trace (X-Ray) cho request path.
- Metric RED/USE cho SLO.
- Audit log tuân thủ (retention dài, immutable).

### Ví dụ đời thực
Một microservices EKS: hóa đơn CloudWatch Logs 3.200 USD/tháng (ingest 1.8TB). Phân tích: 60% là DEBUG/INFO từ service thanh toán, 25% là access log của ALB, 15% lỗi/warn. Xử lý: đặt log level INFO ở production, sampling 10% request thành công, ALB access log chuyển sang S3 (không qua CloudWatch), retention 14 ngày cho app log và 90 ngày cho audit, structured JSON. Hóa đơn giảm xuống ~480 USD/tháng (giảm ~85%), vẫn giữ đầy đủ lỗi và trace để điều tra sự cố.

### Trả lời mẫu khi phỏng vấn
"CloudWatch Logs tính tiền theo ingest, lưu trữ và query. Tôi giảm bằng cách: đặt retention thay vì giữ mãi, lọc/sampling log tại nguồn (giữ đầy đủ lỗi), chuyển log lạnh sang S3 qua subscription filter, dùng structured JSON để query rẻ hơn, và tạo metric từ log qua EMF thay vì lưu toàn bộ log để dashboard. Observability vẫn đủ vì giữ metric, trace, và log lỗi đầy đủ; audit log giữ retention dài riêng."

> Senior tip: **ALB/NLB access log và VPC Flow Logs không nên đi qua CloudWatch** — chúng rất lớn và CloudWatch đắt; gửi thẳng S3 và truy vấn bằng Athena. Đây là một trong những cách giảm hóa đơn observability nhanh nhất.`,
  follow: [
    'Embedded Metric Format (EMF) là gì và dùng khi nào?',
    'Làm sao truy vấn log đã export sang S3?',
    'Retention và storage class của CloudWatch Logs khác nhau ra sao?'
  ],
  tags: ['AWS', 'CloudWatch Logs', 'observability', 'cost', 'senior']
},
{
  id: 'aws-083',
  topic: 'aws',
  level: 'lead',
  q: 'Khi công ty lớn lên, chi phí AWS phân tán và khó kiểm soát. Bạn thiết kế multi-account với AWS Organizations và tagging strategy thế nào để quản lý chi phí và bảo mật?',
  a: `**Tóm tắt:** Dùng **AWS Organizations** với **OU (Organizational Unit)** theo môi trường/miền (prod, non-prod, security, shared services, sandbox) và **account vending** tự động. Áp dụng **tagging strategy** bắt buộc (cost center, owner, env, app) qua **Tag Policies** và **SCP**; dùng **Consolidated Billing** + **Cost Categories** để phân bổ chi phí theo team/product. Kết hợp **AWS Control Tower** để baseline bảo mật và **Service Catalog** để provision account chuẩn.

### Multi-account design
- Một account = một blast radius: prod tách khỏi non-prod, security tách riêng (log, GuardDuty, Security Hub).
- OU theo môi trường: Root → Security OU, Infrastructure OU, Workloads OU (prod/non-prod), Sandbox OU.
- Account vending: tạo account mới tự động với baseline (CloudTrail, Config, GuardDuty, IAM role cho admin) qua Control Tower hoặc tự động hóa.
- Cross-account access bằng IAM role + STS AssumeRole, không chia sẻ credential.

### Tagging strategy
- Tag bắt buộc: {{CostCenter}}, {{Owner}}, {{Environment}}, {{Application}}, {{DataClassification}}.
- Tag Policies: chuẩn hoá giá trị và cách viết hoa của tag (allowed values) khi tag đã được cung cấp — **không** tự bắt buộc phải có tag.
- SCP chặn tạo resource không có tag bắt buộc (deny if missing tag, dùng điều kiện aws:RequestTag).
- Tag propagation: propagate tag từ resource cha (EC2 → EBS, snapshot) để không mất chi phí.

### Phân bổ chi phí
- Consolidated Billing: một hóa đơn tổng, RI/Savings Plans chia sẻ giữa account.
- Cost Categories: gom theo team/product/domain.
- CUR + Athena/QuickSight: dashboard chi phí theo tag.
- Showback/chargeback: gửi báo cáo chi phí hàng tháng cho từng team.

### Ví dụ đời thực
Một công ty 80 dev, 12 account AWS không có tagging, hóa đơn 90.000 USD/tháng không biết ai dùng gì. Thiết kế lại: Organizations với 5 OU, Control Tower baseline, tagging bắt buộc qua SCP, Cost Categories theo 6 product team. Sau 3 tháng: 100% resource có tag, dashboard chi phí theo team, phát hiện 2 team chiếm 60% chi phí và 1 sandbox account chi 4.000 USD/tháng cho instance quên tắt. Giảm 18% chi phí chỉ bằng visibility + dọn dẹp, chưa cần tối ưu kỹ thuật.

### Trả lời mẫu khi phỏng vấn
"Tôi thiết kế multi-account với Organizations: OU theo môi trường và miền, account vending tự động với baseline bảo mật qua Control Tower, cross-account bằng AssumeRole. Tagging bắt buộc lúc tạo qua SCP (deny nếu thiếu tag), còn Tag Policies chuẩn hoá giá trị tag; propagate tag. Chi phí phân bổ qua Consolidated Billing, Cost Categories và CUR+Athena dashboard, showback hàng tháng cho team. Mục tiêu là visibility trước, rồi tối ưu — không có visibility thì không biết tối ưu chỗ nào."

> Senior tip: **SCP chỉ deny, không grant** — nó là hàng rào, không phải cấp quyền. Và tagging phải **bắt buộc tại thời điểm tạo** (SCP deny) chứ không phải "khuyến khích"; tag thêm sau rất hay bị quên và làm méo dashboard chi phí.`,
  follow: [
    'Service Control Policy (SCP) và IAM policy khác nhau thế nào?',
    'AWS Control Tower làm gì so với tự viết automation?',
    'Làm sao xử lý resource đã tồn tại mà chưa có tag (backfill)?'
  ],
  tags: ['AWS', 'Organizations', 'multi-account', 'tagging', 'cost', 'governance', 'lead']
},
{
  id: 'aws-084',
  topic: 'aws',
  level: 'senior',
  q: 'Team 6 người (3 backend, 1 frontend, 1 QA, 1 DevOps kiêm SRE) phải chọn cách chạy 12 service Spring Boot trên AWS: ECS Fargate, EKS hay Lambda. Bạn so sánh chi phí thật và gánh nặng vận hành ra sao, và vì sao team nhỏ nên cân nhắc điều gì?',
  a: `**Tóm tắt:** Với team 6 người, chi phí lớn nhất không phải hoá đơn AWS mà là **thời gian con người vận hành**. ECS Fargate cho bạn container luôn ấm, không cold start, không phải vá OS, không phải quản control plane — phù hợp nhất khi không có SRE chuyên trách Kubernetes. EKS rất mạnh nhưng đòi một người thực sự hiểu Kubernetes (networking, RBAC, ingress, Helm, upgrade). Lambda rẻ khi tải thấp và chấp nhận cold start, nhưng với 12 service Spring Boot thì connection pool DB và cold start là hai cái bẫy. Chọn theo **ai chịu trách nhiệm vận hành**, không chọn theo "cái nào rẻ nhất trên bảng giá".

### Thuật ngữ (giải thích từ gốc)
- **Control plane**: "bộ não" quản lý hạ tầng. Với EKS, AWS chạy control plane Kubernetes (API server, scheduler), bạn trả khoảng 73 USD/tháng cho mỗi cluster và vẫn phải tự lo phần còn lại.
- **Data plane**: phần chạy workload thật — với ECS là task, với EKS là pod/node, với Lambda là execution environment.
- **Patching OS**: vá lỗi bảo mật cho hệ điều hành. Fargate và Lambda làm hộ; EKS trên EC2 thì bạn (hoặc add-on) phải làm.
- **Cold start**: lần gọi đầu phải dựng môi trường + nạp JVM; với Spring Boot init phase (component scan, Hibernate, HikariCP) thường 1-5 giây.
- **Connection pool (HikariCP)**: mỗi instance giữ sẵn một tập kết nối tới DB. Lambda mỗi execution environment một pool riêng nên dễ làm cạn kiệt max_connections của Postgres.

### Vì sao team nhỏ nên "mua" sự đơn giản
Hãy ví hạ tầng như một chiếc xe. ECS Fargate giống mua xe số tự động: đạp ga là chạy, thợ bảo dưỡng lo phần máy. EKS giống mua xe đua: nhanh hơn, ôm cua tốt hơn, nhưng bạn phải tự học pit stop, tự chỉnh hộp số, và một mình bạn sai là cả xe đứng. Với 6 người không có ai chuyên Kubernetes, "xe đua" thường nằm trong garage vì không ai dám lái hết công suất.

### So sánh chi phí thật (không chỉ hoá đơn)
| Yếu tố | ECS Fargate | EKS (trên EC2) | Lambda |
|---|---|---|---|
| Control plane | Không | ~73 USD/tháng/cluster | Không |
| Compute khi tải thấp | Trung bình (task chạy 24/7) | Cao (node chạy 24/7) | Rất thấp (chỉ trả khi gọi) |
| Cold start | Không | Không | Có (tệ với Spring Boot) |
| Connection pool DB | Ổn định | Ổn định | Khó, mỗi env một pool |
| Vá OS | AWS lo | Bạn lo (bạn có thể dùng Bottlerocket để bớt) | AWS lo |
| Người cần để vận hành | 1 người biết Docker/IAM | 1-2 người thực sự hiểu K8s | 1 người biết IAM + event model |
| Thời gian scale-out | Vài chục giây | Vài chục giây (HPA/cluster autoscaler) | Vài giây |
| Giới hạn thời gian chạy | Không | Không | 15 phút mỗi lần gọi |
| Chi phí ẩn lớn nhất | Quản lý task definition | Con người + add-on + upgrade | Cold start + DB connections |

Con số minh hoạ cho 12 service, mỗi service 2-4 task, tổng ~30 task Fargate 0,5 vCPU/1 GB: compute khoảng 350-450 USD/tháng ở ap-southeast-1. Cùng workload đó trên EKS cần tối thiểu 3 node m5.large chạy 24/7 (~450-500 USD) + 73 USD control plane + chi phí add-on, và bạn cần một người dành ~30-50% thời gian chỉ để giữ cluster sống, nâng cấp, vá CVE. Lambda cho 12 service: rẻ ở compute nhưng nếu mỗi service mở pool 20 kết nối và có 30 env ấm thì đã 600 kết nối — vượt mức Aurora nhỏ.

### Ví dụ code: cấu hình task Fargate gọn cho team nhỏ
~~~yaml
# task definition rút gọn: một service, không cold start, AWS vá OS
family: payment-api
requiresCompatibilities: [FARGATE]
networkMode: awsvpc
cpu: 512
memory: 1024
containerDefinitions:
  - name: api
    image: 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/payment:42
    environment:
      - { name: JAVA_OPTS, value: -XX:MaxRAMPercentage=75 }
      - { name: SPRING_DATASOURCE_HIKARI_MAXPOOLSIZE, value: "15" }
    healthCheck:
      command: [CMD-SHELL, curl -f http://localhost:8080/actuator/health || exit 1]
~~~

### Ví dụ đời thực
Một công ty fintech 6 người chạy 12 service trên 4 EC2 m5.xlarge chung, tự vá OS bằng script. Triệu chứng: mỗi lần vá kernel phải reboot luân phiên, mất 2-3 giờ công mỗi tháng; một CVE Log4j khiến cả team thức đêm rebuild image; chi phí EC2 ~620 USD/tháng nhưng CPU trung bình chỉ 28%. Đội chuyển sang ECS Fargate: đóng 12 Docker image, đặt 2-4 task mỗi service, target tracking theo 55% CPU. Kết quả: không còn cảnh vá OS thủ công, deploy bằng CodeDeploy/rolling chỉ còn 8-12 phút, chi phí compute còn ~430 USD/tháng, và quan trọng nhất là gánh nặng vận hành giảm hẳn — người DevOps kiêm SRE có thời gian làm việc khác thay vì reboot máy. Khi một task chết, ECS tự thay task mới sau vài chục giây mà ALB tự chuyển traffic.

### Trả lời mẫu khi phỏng vấn
"Với team 6 người không có SRE chuyên trách Kubernetes, tôi mặc định chọn ECS Fargate, vì chi phí lớn nhất của hạ tầng là thời gian con người chứ không phải hoá đơn. Fargate cho tôi container luôn ấm, không cold start, AWS vá OS hộ, và tôi chỉ cần biết Docker với IAM là chạy được 12 service sau ALB. Tôi vẫn so sánh với EKS: EKS mạnh khi nhiều team dùng chung, cần operator, service mesh, hoặc đã có platform Kubernetes — nhưng với 6 người thì chi phí vận hành cluster, RBAC, ingress, upgrade sẽ ngốn của tôi 30-50% thời gian, quá đắt. Lambda tôi cân nhắc cho vài endpoint sự kiện tải thấp, nhưng không đặt cả 12 service Spring Boot lên Lambda vì cold start và connection pool DB. Nói ngắn gọn: tôi chọn theo ai chịu trách nhiệm vận hành, đo Init Duration và p99 trước, và giữ cho team nhỏ một hệ thống mà họ thực sự dám vận hành lúc 2 giờ sáng."
> Senior tip: đừng so sánh ECS vs EKS vs Lambda chỉ trên bảng giá. Với team nhỏ, hãy tính "chi phí mỗi giờ công của SRE" vào bài toán. Một cluster EKS tiết kiệm 100 USD compute nhưng ngốn thêm 20 giờ công mỗi tháng thì đắt hơn Fargate rất nhiều.`,
  follow: [
    'Nếu công ty đã có một platform Kubernetes dùng chung thì quyết định của bạn đổi thế nào?',
    'Khi nào bạn vẫn chọn Lambda cho một vài service trong 12 service đó, tiêu chí cụ thể là gì?',
    'Làm sao chứng minh với sếp rằng chi phí vận hành EKS lớn hơn hoá đơn, bằng số liệu cụ thể?'
  ],
  tags: ['ECS', 'Fargate', 'EKS', 'Lambda', 'cost', 'operations', 'team', 'senior']
},
{
  id: 'aws-085',
  topic: 'aws',
  level: 'senior',
  q: 'Bạn thiết kế bảng giao dịch (transactions) trên DynamoDB cho hệ thống thanh toán. Mỗi giao dịch có transactionId, accountId, merchantId, amount, status, createdAt. Bạn chọn partition key và sort key thế nào để tránh hot partition, và vì sao không dùng transactionId làm partition key?',
  a: `**Tóm tắt:** Với bảng giao dịch, **không** dùng transactionId (giá trị ngẫu nhiên, phân tán tốt nhưng không gom nhóm được) làm partition key nếu bạn cần truy vấn "lấy mọi giao dịch của một tài khoản" hoặc "mọi giao dịch của một merchant trong hôm nay". Hãy chọn partition key theo **cách bạn truy vấn nhiều nhất** — thường là accountId hoặc merchantId — và sort key là createdAt (hoặc một timestamp) để gom các giao dịch cùng nhóm và sắp xếp theo thời gian. Vấn đề hot partition xuất hiện khi một tài khoản/merchant quá lớn (ví dụ merchant Shopee), và cách chữa là **write sharding** (thêm hậu tố ngẫu nhiên) hoặc tách entity lớn sang quy tắc riêng.

### Thuật ngữ (giải thích từ gốc)
- **Partition key (khoá phân vùng)**: thuộc tính DynamoDB băm (hash) để quyết định dữ liệu nằm ở phân vùng nào. Cùng một giá trị partition key luôn nằm cùng một phân vùng.
- **Sort key (khoá sắp xếp)**: sắp xếp các item trong cùng một partition key, cho phép query theo khoảng và lấy nhiều item một lần.
- **Hot partition (phân vùng nóng)**: một giá trị partition key nhận quá nhiều request/ghi, vượt throughput của một phân vùng (~3000 RCU / 1000 WCU), gây throttling dù cả bảng còn dư capacity.
- **RCU/WCU**: Read Capacity Unit / Write Capacity Unit — đơn vị đo throughput. 1 WCU = 1 lần ghi item tối đa 1 KB mỗi giây.
- **Adaptive capacity**: DynamoDB tự điều phối capacity từ phân vùng lạnh sang phân vùng nóng, nhưng **không** cứu được một partition key đơn lẻ vượt hard limit.

### Cơ chế: vì sao transactionId làm partition key là bẫy
1. transactionId ngẫu nhiên (UUID) → băm đều → phân tán tốt, **đây là lý do người ta hay chọn nó**.
2. Nhưng hệ thống thanh toán luôn có truy vấn kiểu "lấy 30 giao dịch gần nhất của tài khoản X" hoặc "đối soát mọi giao dịch của merchant Y hôm nay". Nếu partition key là transactionId, bạn **không thể query** theo accountId — chỉ có thể scan toàn bảng (rất đắt và chậm) hoặc tạo GSI.
3. Nếu tạo GSI theo accountId thì GSI cũng có partition key riêng, và merchant lớn vẫn gây hot partition trên GSI. Bạn chỉ chuyển bài toán chứ không xoá nó.

### Chọn key theo truy vấn
| Truy vấn phổ biến | Partition key | Sort key | Ghi chú |
|---|---|---|---|
| Lấy giao dịch của 1 tài khoản, mới nhất trước | accountId | createdAt | Phổ biến nhất, chọn cái này |
| Lấy giao dịch của 1 merchant trong khoảng ngày | merchantId | createdAt | GSI nếu merchant không phải PK chính |
| Tra cứu 1 giao dịch chính xác | transactionId | — | Dùng GSI hoặc item chính |
| Đối soát theo ngày toàn hệ thống | date bucket (yyyy-mm-dd) | createdAt | GSI, beware hot partition ngày |

Cách làm thực tế: partition key = accountId, sort key = createdAt. Khi cần tra theo merchant, tạo GSI với partition key = merchantId, sort key = createdAt. Khi cần tra theo giao dịch, tạo GSI partition key = transactionId.

### Xử lý hot partition khi có merchant/tài khoản "khủng long"
Nếu một merchant chiếm 40% traffic (ví dụ flash sale), ghi vào một partition key sẽ vượt 1000 WCU. Hai cách:
1. **Write sharding**: thêm hậu tố 0-9 vào merchantId khi ghi (merchantId#0..merchantId#9). Đọc phải query cả 10 shard (hoặc dùng scatter-gather). Phù hợp write-heavy, đọc ít.
2. **Tách entity lớn**: nếu một tài khoản quá lớn, cân nhắc bảng riêng hoặc key theo thời gian (accountId + yyyy-mm) để mỗi tháng một partition.

### Ví dụ code: ghi có write sharding
~~~java
// Ghi giao dịch: thêm shard ngẫu nhiên để tránh hot partition khi merchant lớn
var shard = ThreadLocalRandom.current().nextInt(10);      // 0..9
var pk = "merchant:" + merchantId + "#" + shard;
var item = new Item()
    .withPrimaryKey(..., pk, "txn:" + transactionId + ":" + createdAt)
    .withString("accountId", accountId)
    .withString("merchantId", merchantId)
    .withNumber("amount", amount)
    .withString("status", "PENDING")
    .withString("createdAt", createdAt);
table.putItem(item);                                      // ghi vào shard ngẫu nhiên
~~~

### Ví dụ đời thực
Một ví điện tử dùng partition key = transactionId (UUID) cho bảng giao dịch. Triệu chứng: trang "lịch sử giao dịch" của user phải scan bảng 200 triệu bản ghi, p99 lên 8-12 giây, chi phí RCU tăng vọt. Đội điều tra: không có truy vấn nào cần theo transactionId trừ tra cứu đơn lẻ. Họ chuyển partition key = accountId, sort key = createdAt, tạo GSI cho transactionId và merchantId. Kết quả: trang lịch sử user còn ~80-150 ms (query 1 partition, đọc 30 item mới nhất), chi phí scan giảm ~70%. Riêng merchant lớn ( chiếm 30% traffic) vẫn bị throttling giờ cao điểm; đội thêm write sharding 0-9 cho merchant đó, p99 ghi còn ~25 ms.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn partition key theo truy vấn nhiều nhất, không theo sự phân tán. Với bảng giao dịch, truy vấn phổ biến nhất là 'lấy giao dịch của một tài khoản' và 'đối soát của merchant theo ngày', nên partition key là accountId hoặc merchantId, sort key là createdAt để query khoảng và sắp xếp theo thời gian. Tôi không dùng transactionId làm partition key vì nó ngẫu nhiên, phân tán tốt nhưng không gom nhóm được — mọi truy vấn theo user sẽ phải scan bảng. Tôi vẫn tạo GSI theo transactionId cho tra cứu đơn lẻ và theo merchantId cho đối soát. Với merchant quá lớn gây hot partition, tôi dùng write sharding: thêm hậu tố 0-9 vào merchantId khi ghi và query cả 10 shard khi đọc, hoặc tách entity lớn theo thời gian. Tôi cũng bật on-demand hoặc auto-scaling và luôn theo dõi ConsumedReadCapacity/Write theo từng partition bằng CloudWatch Contributor Insights để phát hiện hot key sớm."
> Senior tip: đừng chọn partition key chỉ vì "UUID phân tán tốt". Phân tán tốt mà không query được thì bạn phải scan bảng — đắt hơn nhiều lần. Hãy viết ra 5 truy vấn quan trọng nhất trước, rồi mới chọn key. Và luôn bật CloudWatch Contributor Insights trên bảng giao dịch để thấy hot key trước khi user phàn nàn.`,
  follow: [
    'Nếu truy vấn chính là "tra cứu 1 giao dịch theo transactionId" thì partition key nên là gì?',
    'Write sharding đọc phải query cả N shard, khi nào chi phí này còn chấp nhận được, khi nào không?',
    'DynamoDB adaptive capacity cứu được hot partition của một merchant lớn không, vì sao?'
  ],
  tags: ['DynamoDB', 'partition key', 'sort key', 'hot partition', 'write sharding', 'transaction', 'senior']
},
{
  id: 'aws-086',
  topic: 'aws',
  level: 'lead',
  q: 'Hệ thống thanh toán thẻ chạy ở region chính (ap-southeast-1) với Aurora PostgreSQL. Bạn thiết kế multi-region active-passive: region phụ (ap-southeast-3) làm standby. Bạn chọn RPO/RTO cụ thể bao nhiêu, cấu hình ra sao, và chi phí tăng thêm khoảng bao nhiêu?',
  a: `**Tóm tắt:** **Active-passive** nghĩa là chỉ region chính phục vụ request; region phụ chạy ở chế độ chờ (standby), dữ liệu được sao chép liên tục sang, và khi region chính chết thì promote region phụ lên. Với thanh toán thẻ, tôi đặt **RPO dưới 5 giây** (Aurora Global Database thường lag dưới 1 giây) và **RTO dưới 10 phút** (đã dựng sẵn hạ tầng IaC, chỉ cần promote DB + trỏ Route 53 + scale compute). Chi phí tăng khoảng 30-50% so với một region: Aurora Global Database cộng thêm chi phí lưu trữ và I/O ở region phụ, compute standby chạy tối thiểu (1-2 task thay vì toàn bộ), cộng Route 53 ARC và data transfer.

### Thuật ngữ (giải thích từ gốc)
- **RPO (Recovery Point Objective)**: mức mất dữ liệu chấp nhận được, đo bằng thời gian. RPO 5 giây nghĩa là khi sự cố xảy ra, bạn mất tối đa 5 giây giao dịch gần nhất.
- **RTO (Recovery Time Objective)**: thời gian để hệ thống hoạt động lại. RTO 10 phút nghĩa là sau sự cố, tối đa 10 phút sau user mới dùng được.
- **Active-passive**: một region chạy thật (active), một region chờ (passive/standby). Khác active-active (cả hai cùng phục vụ, phức tạp vì phải xử lý ghi đa vùng).
- **Aurora Global Database**: tính năng của Aurora sao chép dữ liệu từ region chính sang region phụ với độ trễ thường dưới 1 giây; region phụ có thể promote thành primary nhanh.
- **Route 53 Application Recovery Controller (ARC)**: dịch vụ điều khiển chuyển hướng traffic giữa các region khi failover, có health check và routing control an toàn.
- **Pilot light / warm standby**: các mức chuẩn bị của region phụ. Pilot light: dữ liệu sẵn, compute gần như tắt. Warm standby: compute chạy thu nhỏ, scale khi cần.

### Vì sao active-passive hợp với thanh toán thẻ
Thanh toán thẻ cần **tính nhất quán mạnh** (một giao dịch không được ghi hai lần, số dư phải đúng) và **không chấp nhận mất dữ liệu**. Active-active đòi ứng dụng xử lý ghi đa region, giải quyết xung đột (conflict resolution) — cực kỳ phức tạp và dễ sai. Active-passive giữ một nguồn sự thật (region chính), region phụ chỉ sao chép, nên đơn giản và an toàn hơn nhiều. Đổi lại RTO không bằng 0 (có vài phút để promote), nhưng với thanh toán, vài phút downtime có kế hoạch còn hơn mất chính xác giao dịch.

### Cấu hình active-passive cho Aurora
1. **Database**: Aurora Global Database, primary ở ap-southeast-1, secondary cluster ở ap-southeast-3. Secondary là read-only, lag thường dưới 1 giây → RPO đạt.
2. **Compute**: ECS Fargate service chạy đầy đủ ở region chính; ở region phụ chạy 1-2 task tối thiểu (warm standby) hoặc 0 task (pilot light, scale khi failover).
3. **Điều hướng**: Route 53 ARC với routing control. Bình thường trỏ về region chính; khi failover, chuyển về region phụ.
4. **Promote**: khi region chính chết, promote secondary cluster thành primary (một lệnh, vài phút), scale compute region phụ, chuyển Route 53.
5. **IaC**: toàn bộ hạ tầng region phụ dựng bằng CloudFormation/CDK/Terraform, luôn sẵn sàng, không dựng tay lúc sự cố.

### Ví dụ luồng failover (sequence)
~~~seq
title: Failover thanh toán sang region phụ
actors: Client | Route53 | ECS | Aurora
Client -> Route53: goi API thanh toan
Route53 -> ECS: forward vao region chinh
ECS -> Aurora: ghi giao dich (primary)
note Aurora..Aurora: region chinh chet
Route53 -> ECS: routing control chuyen sang region phu
ECS -> Aurora: promote secondary thanh primary
note ECS..ECS: scale tu 1 len 4 task
Route53 -> Client: tra ve tu region phu (sau vai phut)
~~~

### Ví dụ chi phí tăng thêm (minh hoạ, ap-southeast-1 + ap-southeast-3)
| Hạng mục | Một region | Active-passive | Chênh |
|---|---|---|---|
| Aurora primary + 1 read replica | ~700 USD | ~700 USD | 0 |
| Aurora Global Database (secondary storage + I/O) | 0 | ~250-350 USD | +300 |
| Compute ECS (region phụ warm standby 1-2 task) | ~430 USD | ~500 USD | +70 |
| Route 53 ARC + health check | ~0 | ~30-50 USD | +40 |
| Data transfer cross-region (replication) | 0 | ~50-100 USD | +75 |
| **Tổng** | ~1.130 USD | ~1.630 USD | **+~500 USD (~45%)** |

Con số cụ thể thay đổi theo lưu lượng ghi, kích thước Aurora, số AZ. Nguyên tắc: active-passive thường tốn thêm 30-50% so với một region, rẻ hơn active-active (có thể gần gấp đôi vì phải chạy song song và xử lý ghi đa vùng).

### Ví dụ đời thực
Một cổng thanh toán thẻ chạy Aurora PostgreSQL một region ở ap-southeast-1. Cơ quan quản lý yêu cầu RPO dưới 1 phút, RTO dưới 15 phút. Đội dựng Aurora Global Database sang ap-southeast-3, ECS Fargate region phụ chạy 1 task warm standby, Route 53 ARC, toàn bộ IaC. Họ diễn tập failover: kill primary, promote secondary, scale task, chuyển Route 53 — mất 6 phút 40 giây, RPO đo được 0,8 giây. Chi phí tăng ~480 USD/tháng (~40%). Kết quả: đạt yêu cầu audit, và khi một sự cố network thật ở region chính xảy ra 3 tháng sau, failover diễn ra trong 7 phút, không mất giao dịch nào quá 1 giây.

### Trả lời mẫu khi phỏng vấn
"Với hệ thống thanh toán thẻ, tôi chọn active-passive thay vì active-active vì thanh toán cần nhất quán mạnh và không được ghi trùng, còn active-active buộc tôi giải quyết xung đột đa vùng — quá phức tạp và dễ sai. Tôi dùng Aurora Global Database: primary ở region chính, secondary ở region phụ với lag thường dưới 1 giây, nên RPO dưới 5 giây là đạt. RTO tôi đặt dưới 10 phút: hạ tầng region phụ dựng sẵn bằng IaC, compute chạy 1-2 task warm standby, khi failover chỉ cần promote secondary thành primary, scale compute và chuyển Route 53 ARC. Chi phí tăng khoảng 30-50% so với một region, chủ yếu ở Aurora Global Database và data transfer cross-region. Quan trọng nhất là tôi diễn tập failover định kỳ có bấm giờ, vì một RTO trên giấy không có giá trị — tôi cần chứng minh bằng số đo thật. Tôi cũng luôn theo dõi Aurora Global Database replication lag bằng CloudWatch để phát hiện sớm khi RPO bị đe doạ."
> Senior tip: đừng đặt RTO/RPO trong tài liệu rồi không bao giờ diễn tập. Hãy failover thật mỗi quý, bấm giờ, và ghi lại RTO/RPO đo được. Một con số RTO 10 phút chỉ đáng tin khi bạn đã làm được nó trong 7 phút lúc diễn tập. Và luôn theo dõi Aurora Global Database replication lag — nếu lag tăng, RPO của bạn đang bị đe doạ mà chưa ai biết.`,
  follow: [
    'Vì sao thanh toán thẻ không chọn active-active, và khi nào active-active mới thực sự đáng giá?',
    'Aurora Global Database replication lag tăng đột biến, bạn điều tra và xử lý thế nào để giữ RPO?',
    'Diễn tập failover thế nào để không ảnh hưởng user thật nhưng vẫn chứng minh được RTO/RPO?'
  ],
  tags: ['multi-region', 'active-passive', 'Aurora', 'Global Database', 'RPO', 'RTO', 'failover', 'payment', 'lead']
},
{
  id: 'aws-087',
  topic: 'aws',
  level: 'senior',
  q: 'Thiết kế VPC cho hệ thống ngân hàng: subnet riêng cho web, app, database, NAT Gateway, và VPC endpoint cho S3/Secrets Manager — bạn chia subnet ra sao, traffic đi đâu, và ứng dụng Java lấy secret thế nào không hard-code?',
  a: `**Tóm tắt:** Hệ thống ngân hàng cần tách tầng nghiêm ngặt: web ở public subnet (qua ALB), app ở private subnet, database ở isolated subnet không có đường ra Internet. Tất cả lời gọi AWS (S3, Secrets Manager, KMS) đi qua VPC endpoint trong mạng AWS, không qua NAT Gateway và không ra Internet. Ứng dụng Java dùng IAM role + AWS SDK để lấy secret từ Secrets Manager qua interface endpoint, không bao giờ nhúng credentials trong code.

### Thuật ngữ (giải thích từ gốc)
- **VPC (Virtual Private Cloud)**: mạng riêng ảo của bạn trên AWS, giống một khu chung cư có tường rào, chỉ người được phép mới vào.
- **Subnet (mạng con)**: phân vùng nhỏ trong VPC, mỗi subnet nằm trong một Availability Zone (AZ).
- **Public subnet**: subnet có route ra Internet Gateway, máy ở đây có thể được truy cập từ Internet.
- **Private subnet**: subnet không có route ra Internet Gateway, máy ở đây không thể bị gọi trực tiếp từ Internet.
- **Isolated subnet**: subnet không có route ra Internet và không có NAT, hoàn toàn kín, chỉ kết nối nội bộ VPC.
- **NAT Gateway**: cho máy ở private subnet ra Internet (ví dụ tải bản vá OS), chặn kết nối từ Internet vào máy.
- **Internet Gateway (IGW)**: cửa hai chiều giữa VPC và Internet.
- **VPC endpoint**: lối đi nội bộ trong mạng AWS tới dịch vụ AWS (S3, Secrets Manager…), traffic không ra Internet và không tốn phí NAT.
- **Gateway endpoint**: endpoint miễn phí cho S3 và DynamoDB, thêm route vào route table.
- **Interface endpoint (PrivateLink)**: tạo card mạng ảo (ENI) trong subnet, có phí theo giờ + GB, dùng cho Secrets Manager, KMS, ECR, CloudWatch Logs.
- **Security Group**: tường lửa stateful gắn vào mỗi tài nguyên, nhớ kết nối đã cho vào thì tự cho phản hồi về.
- **IAM role**: danh tính tạm thời, ứng dụng lấy credential có hạn qua AWS SDK, không cần access key lâu dài.
- **VPC Flow Logs**: ghi log mọi gói tin đi vào/ra ENI, dùng để kiểm tra và điều tra sự cố bảo mật.

### Cơ chế từng bước: traffic của hệ thống ngân hàng
1. **Người dùng truy cập ứng dụng**: qua Internet Gateway → ALB ở public subnet → ALB chuyển request đến app ở private subnet qua Security Group (chỉ cho ALB gọi cổng 8080 của app). Vì sao: app không hiển thị trực tiếp ra Internet.
2. **App gọi S3 (lưu giấy tờ khách hàng)**: route table của private subnet có route prefix list S3 → gateway endpoint. Traffic đi mạng AWS nội bộ, **không qua NAT**, không tốn phí NAT và không ra Internet. Vì sao: S3 là dịch vụ AWS, không cần đường ra Internet.
3. **App lấy secret database từ Secrets Manager**: route table có route endpoints Secrets Manager → interface endpoint (private DNS bật). AWS SDK dùng IAM role của task (task role) để xác thực qua Signature V4, nhận secret, không hard-code. Vì sao: secret không bao giờ nằm trong image, environment variable hay code.
4. **Database tier (isolated subnet)**: không có NAT, không có IGW, chỉ có route local và VPC endpoint nếu cần (ví dụ gọi S3 để backup). App gọi database qua Security Group tham chiếu (SG database cho phép SG app truy cập cổng 5432). Vì sao: database ngân hàng không được phép ra Internet, giảm bề mặt tấn công.
5. **Gọi hệ thống đối tác/mainframe on-prem**: qua Transit Gateway hoặc AWS Direct Connect/VPC peering, route table trỏ đến Transit Gateway. Vì sao: kết nối riêng, không qua Internet công cộng.

Bảng subnet tham khảo:
| Tầng | Subnet | Có IGW | Có NAT | VPC endpoint | Dùng khi |
|---|---|---|---|---|---|
| Web/ALB | public | Có | Không | Không | Chỉ ALB, không app hay DB |
| App | private | Không | Có (chỉ patch OS) | S3, Secrets Manager, KMS | Chạy Spring Boot, gọi AWS dịch vụ |
| Database | isolated | Không | Không | Không (hoặc S3 endpoint để backup) | Chỉ app gọi được, không ra Internet |

~~~text
Internet                   VPC ngân hàng (3 AZ)
   |                       +------------------ public subnet -------------------+
   |                      | ALB (SG web)        NAT Gateway (patch OS)        |
   |                      +------------------+----------------------------------+
   |                                 |
   |                          +------v------+      +---------------------+
   |                          | private app |----->| isolated database   |
   |                          | Spring Boot |      | PostgreSQL (kín)    |
   |                          | (SG app)    |      | (SG db, ref SG app) |
   |                          +------+------+      +---------------------+
   |                               |                      |
   |                      [route table: pl-S3 -> vpce] [route: local only]
   |                               |                      |
   |                          VPC endpoint: S3 (gateway), Secrets Manager/KMS (interface, private DNS)
~~~

### Bảo mật và tuân thủ
- **Security Group tham chiếu Security Group**: SG database chỉ cho phép ingress cổng 5432 từ SG của app (không phải CIDR 0.0.0.0/0). Nếu app scale sang subnet/IP khác, quy tắc vẫn hoạt động vì tham chiếu theo SG.
- **NACL để mặc định allow**, kiểm soát chính bằng Security Group. NACL stateless: nếu mở inbound 443 thì cũng phải mở outbound ephemeral port 1024-65535 cho phản hồi.
- **VPC Flow Logs**: bật gửi đến CloudWatch Logs/S3, lưu ít nhất 6 tháng cho tuân thủ ngân hàng, giúp bạn biết chính xác ai gọi ai, từ IP nào, cổng nào.
- **Private DNS** bật trên interface endpoint để SDK dùng tên miền chuẩn (secretsmanager.ap-southeast-1.amazonaws.com) mà không đổi code.
- **Endpoint policy**: siết chặt, chỉ cho phép truy cập tài nguyên của công ty (ví dụ chỉ Secret có tag team=banking, chỉ bucket S3 của ngân hàng).

### Lỗi hay gặp
- **Đặt database ở public subnet hoặc cho 0.0.0.0/0 vào cổng 5432.** Triệu chứng: database bị quét và tấn công từ Internet ngay lập tức. Cách tránh: database ở isolated subnet, SG chỉ tham chiếu SG app.
- **App gọi S3 qua NAT Gateway.** Triệu chứng: hoá đơn NAT Gateway tăng hàng nghìn USD mỗi tháng khi backup/log nhiều GB. Cách tránh: thêm S3 gateway endpoint vào route table của private subnet.
- **Hard-code secret trong application.properties hoặc env biến container.** Triệu chứng: secret rò rỉ qua Git/image, bot quét lấy trong vài phút. Cách tránh: Secrets Manager + IAM task role, SDK lấy secret khi khởi động hoặc dùng secret rotation.
- **Quên bật private DNS cho interface endpoint.** Triệu chứng: SDK không resolve được tên dịch vụ hoặc traffic đi ra Internet. Cách tránh: bật enableDnsSupport và enableDnsHostnames của VPC, bật private DNS trên endpoint.
- **Một NAT Gateway dùng chung cho nhiều AZ.** Triệu chứng: AZ chứa NAT gặp sự cố là toàn hệ mất khả năng ra Internet (ví dụ không tải được bản vá). Cách tránh: mỗi AZ một NAT, route table private của AZ nào trỏ NAT của AZ đó.

### Ví dụ đời thực
Một hệ thống core banking mới xây trên AWS: team ban đầu đặt database RDS ở public subnet để "dễ quản lý", app gọi S3 và Secrets Manager qua NAT Gateway, và hard-code mật khẩu database trong env biến. Triệu chứng: sau 2 tháng, hoá đơn NAT Gateway tăng 3.100 USD/tháng (backup database 500 GB/tháng qua NAT), và kiểm tra bảo mật phát hiện database có thể truy cập từ Internet. Đội tra VPC Flow Logs: thấy gói tin từ IP lạ nối tới cổng 5432, và NatGatewayBytesProcessed tăng đều mỗi ngày. Nguyên gốc: thiếu tier isolation, traffic AWS dịch vụ đi qua NAT, và credential lâu dài trong env. Xử lý: chuyển database sang isolated subnet (chỉ SG app gọi được), thêm S3 gateway endpoint và Secrets Manager/KMS interface endpoint vào route table private, app dùng task role + AWS SDK lấy secret từ Secrets Manager (rotation 30 ngày), bật VPC Flow Logs. Kết quả: chi phí NAT giảm từ 3.100 xuống 400 USD/tháng, database không còn nhìn thấy từ Internet, và secret không nằm trong env hay image nữa.

### Trả lời mẫu khi phỏng vấn
"Với hệ thống ngân hàng, tôi chia VPC thành ba tầng: public subnet chỉ dành cho ALB, private subnet chạy Spring Boot với NAT Gateway chỉ để tải bản vá OS, và isolated subnet cho database không có đường ra Internet. Tất cả lời gọi S3, Secrets Manager và KMS đi qua VPC endpoint trong mạng AWS, không qua NAT và không ra Internet: S3 dùng gateway endpoint miễn phí, Secrets Manager và KMS dùng interface endpoint bật private DNS. Ứng dụng Java dùng IAM task role để AWS SDK lấy secret từ Secrets Manager, không hard-code và không lưu trong env biến. Bảo mật tôi dồn vào Security Group tham chiếu nhau, ví dụ SG database chỉ mở cổng 5432 cho SG của app, và bật VPC Flow Logs để kiểm tra. Nếu cần gọi hệ thống đối tác hoặc mainframe on-prem, tôi dùng Transit Gateway hoặc Direct Connect thay vì Internet công cộng. Kinh nghiệm của tôi là database ngân hàng không bao giờ được đặt ở public subnet, và traffic tới dịch vụ AWS nhất định phải qua endpoint để cả giảm chi phí lẫn tăng bảo mật."

> Senior tip: hãy vẽ route table trước khi vẽ diagram. Phần lớn sự cố "không gọi được S3/Secrets Manager" là thiếu endpoint hoặc route, không phải do code. VPC Flow Logs là bằng chứng đầu tiên bạn nên tra khi bảo mật hỏi traffic đi đâu.`,
  follow: [
    'Vì sao database ngân hàng không nên đặt ở public subnet dù quản lý dễ hơn?',
    'Interface endpoint và gateway endpoint khác nhau ở điểm nào, khi nào chọn cái nào?',
    'Làm sao ứng dụng Java lấy secret từ Secrets Manager mà không hard-code credential?'
  ],
  tags: ['VPC', 'subnet', 'NAT', 'VPC endpoint', 'Secrets Manager', 'Security Group', 'ngân hàng']
},
{
  id: 'aws-088',
  topic: 'aws',
  level: 'lead',
  q: 'RDS PostgreSQL Multi-AZ, Read Replica và Aurora failover mất bao lâu, và ứng dụng Spring Boot cần cấu hình gì (DNS TTL, HikariCP, retry) để hồi phục nhanh sau failover?',
  a: `**Tóm tắt:** Multi-AZ failover mất 60-120 giây (DNS đổi + kết nối cũ bị đứt); Read Replica không failover tự động, bạn phải promote thủ công và sửa connection string; Aurora failover thường vài giây nhờ storage phân tán (quorum 4/6) nhưng ứng dụng vẫn cần xử lý connection cũ mất. Phía Java bạn phải đặt JVM DNS TTL thấp, cấu hình HikariCP phát hiện kết nối chết nhanh, và retry idempotent giao dịch — không thì DB khôi phục xong mà ứng dụng vẫn lỗi vài phút.

### Thuật ngữ (giải thích từ gốc)
- **Multi-AZ**: bản standby đồng bộ ở AZ khác, nhận mọi dữ liệu ghi, tự lên thay khi primary hỏng. Standby (DB instance) không nhận truy vấn đọc.
- **Read Replica**: bản sao chỉ đọc, nhận dữ liệu bất đồng bộ từ primary, có độ trễ (replica lag). Dùng để chia tải đọc, không dùng cho HA tự động (bạn phải promote thủ công khi primary chết).
- **Aurora**: engine tương thích PostgreSQL/MySQL, lưu dữ liệu trên storage phân tán (6 bản trên 3 AZ), ghi cần 4/6 xác nhận. Failover promote reader thành writer rất nhanh, thường vài giây.
- **Failover**: chuyển dịch vụ sang bản dự phòng khi bản chính chết.
- **Switchover**: chuyển vai trò có kế hoạch khi primary vẫn sống, không mất dữ liệu.
- **Cluster endpoint**: tên DNS luôn trỏ tới writer hiện tại của Aurora cluster.
- **Instance endpoint**: tên DNS cố định của một instance cụ thể.
- **DNS TTL**: thời gian client và resolver được phép cache kết quả phân giải tên miền.
- **JVM DNS cache**: JVM nhớ địa chỉ IP của tên miền theo networkaddress.cache.ttl.
- **HikariCP**: connection pool phổ biến cho Spring Boot, giữ sẵn kết nối tới database.
- **Replica lag**: khoảng trễ giữa lúc ghi ở primary và lúc replica nhìn thấy dữ liệu đó.
- **Transaction không idempotent**: giao dịch chạy lại sẽ tạo kết quả khác (ví dụ trừ tiền hai lần), không được retry vô điều kiện.

### Cơ chế failover từng bước
**RDS PostgreSQL Multi-AZ:**
1. Primary hỏng (máy/AZ). RDS phát hiện, promote standby thành primary.
2. RDS đổi bản ghi DNS endpoint trỏ tới instance mới (CNAME, TTL thấp khoảng 5 giây). Thời gian thực tế thường 60-120 giây.
3. Mọi kết nối TCP cũ tới primary cũ bị đứt; ứng dụng nhận SQLException "connection reset" hoặc "connection is closed".
4. Client mới phải resolve DNS lại; nếu JVM cache DNS lâu, client vẫn connects tới IP cũ (đã chết).

**Read Replica:**
1. Replica nhận dữ liệu bất đồng bộ, có lag vài milliseconds đến vài phút khi tải cao.
2. Primary chết: replica **không tự động trở thành primary**. Bạn phải promote thủ công (lệnh hoặc console), rồi ứng dụng phải kết nối tới instance mới (đổi connection string hoặc dùng endpoint khác).
3. Dữ liệu ghi cuối cùng có thể bị mất (không kịp replicate), RPO > 0.

**Aurora PostgreSQL:**
1. Writer hỏng, storage phân tán đã giữ 6 bản dữ liệu trên 3 AZ.
2. Aurora promote một reader thành writer, thường trong vài giây (không cần copy data vì dùng chung storage).
3. Cluster endpoint DNS cập nhật trỏ tới writer mới. Kết nối TCP cũ tới writer cũ bị đứt.

### Phía ứng dụng Java phải làm gì (không thì DB lên xong app vẫn lỗi)
1. **JVM DNS TTL ngắn**: đặt {{networkaddress.cache.ttl}} = 5-30 giây khi khởi động (trước lần resolve đầu tiên), để ứng dụng resolve lại IP mới sau failover. Mặc định có thể cache mãi mãi (nếu có SecurityManager) hoặc khoảng 30 giây.
2. **HikariCP phát hiện kết nối chết nhanh**:
   - {{connection-timeout}} 3 giây: mở kết nối mới fail nhanh thay vì treo 30 giây mặc định.
   - {{socketTimeout}} (JDBC driver) vài giây: query không treo vô hạn trên TCP chết (half-open).
   - {{keepalive-time}} 30 giây và validation query {{SELECT 1}}: pool phát hiện và loại kết nối chết.
   - {{max-lifetime}} ngắn hơn thời gian ngắt kết nối idle của PostgreSQL (ví dụ 20 phút), để kết nối được làm mới định kỳ.
3. **Không dùng instance endpoint cứng cho ghi**: ghi qua cluster endpoint (Aurora) hay endpoint được RDS Proxy quản lý, sau failover DNS trỏ sang writer mới.
4. **Retry idempotent**: giao dịch đang chạy khi failover sẽ thất bại. Chỉ retry giao dịch có thể chạy lại an toàn (idempotent) hoặc thiết kế lại từ đầu, kèm backoff và giới hạn 1-2 lần. Giao dịch chuyển tiền lỗi lúc commit có thể trạng thái không rõ — kiểm tra bằng idempotency key trước khi retry.
5. **RDS Proxy** (tuỳ chọn): giữ kết nối phía client, tự chuyển hướng sau failover, giảm lỗi của ứng dụng, đặc biệt hữu ích với Lambda (nhiều connection ngắn); trade-off là thêm chi phí và một hop, và pinning khi dùng prepared statement/session state làm giảm hiệu quả.

~~~text
Thời gian ứng dụng không thể ghi (minh hoạ, đo từ phía app):
RDS Multi-AZ, cấu hình mặc định (DNS cache lâu, không keepalive): 2-5 phút
RDS Multi-AZ, DNS TTL 5s + HikariCP keepalive + connection-timeout 3s: ~60-90 giây
Aurora, cluster endpoint + retry idempotent: thường dưới 1 phút
~~~

### Khi nào chọn cái nào
| Tùy chọn | Failover | Dùng đọc được standby/replica? | Phù hợp khi |
|---|---|---|---|
| RDS PostgreSQL Multi-AZ | Tự động, 60-120s | Không (standby chỉ nhận khi failover) | Cần HA đơn giản, dữ liệu quan hệ, đội quen PostgreSQL |
| Read Replica | Không tự động (promote thủ công) | Có, nhưng có lag | Scale đọc báo cáo, không cần failover tự động |
| Aurora PostgreSQL | Tự động, vài giây | Có (tối đa 15 reader, lag thấp) | Cần HA cao, đọc nhiều, failover nhanh, tương thích PostgreSQL |

### Lỗi hay gặp
- **Ghi trực tiếp qua instance endpoint cứng.** Triệu chứng: sau failover ứng dụng vẫn kết nối tới instance cũ, nay đã thành reader (hoặc đã chết), mọi lệnh ghi lỗi. Cách tránh: ghi qua cluster endpoint hoặc qua wrapper/proxy.
- **Chỉ test failover trên giấy.** Triệu chứng: sự cố thật kéo dài gấp nhiều lần dự kiến vì ứng dụng không xử lý connection chết. Cách tránh: diễn tập failover thực tế trên staging dưới tải và đo thời gian không ghi được từ ứng dụng.
- **Retry giao dịch không idempotent.** Triệu chứng: lỗi lúc commit, chạy lại làm trừ tiền hai lần. Cách tránh: chỉ retry sau khi xác nhận giao dịch cũ đã thất bại, dùng idempotency key.
- **JVM cache DNS mãi mãi.** Triệu chứng: sau failover DNS đã đổi nhưng ứng dụng vẫn connects IP cũ trong nhiều giờ. Cách tránh: đặt networkaddress.cache.ttl thấp lúc khởi động.

### Ví dụ đời thực
Một hệ thống thanh toán dùng Spring Boot + HikariCP kết nối RDS PostgreSQL Multi-AZ. Đội chủ động failover để test: database chuyển sang standby trong 70 giây, nhưng ứng dụng tiếp tục báo lỗi "connection reset" và "read-only transaction" trong 4 phút. Điều tra: JVM cache DNS (SecurityManager cũ đặt TTL vô hạn trong image), HikariCP giữ 15 kết nối tới primary cũ không có keepalive nên không phát hiện chết, và connectTimeout mặc định 30 giây khiến mỗi kết nối mới treo lâu. Nguyên gốc: chỉ quan tâm thời gian failover của database, quên rằng ứng dụng Java có ba lớp làm chậm (DNS cache, pool giữ kết nối chết, TCP timeout hệ điều hành). Xử lý: đặt networkaddress.cache.ttl = 5 giây, HikariCP connection-timeout 3000 ms, socketTimeout 5000 ms, keepalive-time 30000 ms, max-lifetime 1200000 ms, và thêm retry idempotent 2 lần với backoff 200-500 ms cho lỗi kết nối. Kết quả: lần failover sau, thời gian ứng dụng không thể ghi xuống còn khoảng 75 giây, và không còn timeout treo 30 giây.

### Trả lời mẫu khi phỏng vấn
"Multi-AZ PostgreSQL failover mất khoảng 60-120 giây do DNS đổi và kết nối cũ bị đứt; Read Replica không failover tự động, bạn phải promote thủ công và đổi connection string; Aurora thường failover trong vài giây vì storage dùng chung và quorum 4/6. Dù database khôi phục nhanh, ứng dụng Java có thể vẫn lỗi vài phút nếu không xử lý ba thứ: JVM cache địa chỉ IP cũ (đặt networkaddress.cache.ttl thấp), HikariCP giữ kết nối chết (bật keepalive, connection-timeout ngắn, socketTimeout) và giao dịch đang chạy bị mất (cần retry idempotent). Tôi ghi qua cluster endpoint chứ không phải instance endpoint cứng, và cân nhắc RDS Proxy nếu có nhiều client ngắn lượt. Mục tiêu tôi đo là thời gian không thể ghi từ góc nhìn ứng dụng, không chỉ thời gian failover trên console, và tôi luôn diễn tập failover định kỳ để có số liệu thật."

> Senior tip: thời gian failover trên console không quan trọng bằng thời gian ứng dụng không ghi được. Với cấu hình mặc định con số này hay là vài phút; chỉ cần DNS TTL thấp, HikariCP keepalive + connection-timeout ngắn, và retry idempotent là phần lớn request sống sót qua failover.`,
  follow: [
    'Vì sao không nên ghi trực tiếp qua instance endpoint cứng sau failover?',
    'Read replica có thể thay thế Multi-AZ cho mục đích HA không, và tại sao?',
    'Làm sao biết một giao dịch có thể retry an toàn sau khi failover?'
  ],
  tags: ['RDS', 'PostgreSQL', 'Aurora', 'Multi-AZ', 'Read Replica', 'failover', 'HikariCP', 'DNS', 'lead']
},
{
  id: 'aws-089',
  topic: 'aws',
  level: 'senior',
  q: 'Hoá đơn AWS tăng bất thường và bạn được giao cắt 30% trong 8 tuần mà không làm gián đoạn dịch vụ. Bạn tìm chi phí từ đâu, những khoản ẩn nào thường là nguyên nhân, và lập kế hoạch thế nào?',
  a: `**Tóm tắt:** Cắt chi phí AWS bắt đầu từ đo lường, không từ mua Savings Plans. Dùng Cost Explorer, CUR và VPC Flow Logs để tìm top khoản chi phí và khoản ẩn (NAT Gateway xử lý dữ liệu, data transfer cross-AZ, CloudWatch Logs, volume/EIP/snapshot không dùng, S3 Standard cho dữ liệu lạnh, môi trường dev chạy 24/7). Lập kế hoạch 8 tuần: đo lường → dọn tài khoản không dùng → rightsizing → kiến trúc (endpoint, Graviton, storage class) → cam kết Savings Plans cho phần nền ổn định. Mỗi bước có số liệu trước/sau.

### Thuật ngữ (giải thích từ gốc)
- **Cost Explorer**: dịch vụ AWS xem và phân tích hoá đơn theo dịch vụ, tài khoản, tag và thời gian.
- **CUR (Cost and Usage Report)**: báo cáo chi phí chi tiết nhất, đẩy vào S3, truy vấn bằng Athena nếu cần phân tích sâu.
- **Cost allocation tag**: nhãn (team, env, service, cost-center) gắn vào tài nguyên để chia chi phí cho từng nhóm chịu trách nhiệm.
- **AWS Budgets**: đặt ngưỡng chi phí và gửi cảnh báo khi vượt hoặc dự kiến vượt.
- **Compute Optimizer**: dịch vụ miễn phí phân tích metric CloudWatch và đề xuất kích thước EC2, EBS, Lambda, ECS phù hợp.
- **NAT Gateway phí xử lý**: tính theo giờ chạy cộng mỗi GB dữ liệu đi qua, kể cả gọi S3 nếu không có endpoint.
- **Data transfer cross-AZ**: phí mỗi GB dữ liệu đi giữa hai AZ, tính cả hai chiều.
- **S3 storage class**: lớp lưu trữ khác nhau (Standard, IA, Glacier…) theo tần suất đọc; dữ liệu lạnh ở Standard tốn tiền vô ích.
- **Unattached resource**: tài nguyên không gắn với gì (volume EBS không attach, Elastic IP không dùng, snapshot cũ) vẫn tính phí.
- **Right-sizing**: thay đổi kích thước tài nguyên khớp với mức sử dụng thực tế.
- **Savings Plans**: cam kết chi tiền mỗi giờ trong 1-3 năm để được giảm giá compute (20-60%).

### Cơ chế từng bước: một vòng cắt chi phí 8 tuần
**Tuần 1 — Đo lường và gán trách nhiệm**
- Bật Cost Explorer, xem theo service và tag; nếu thiếu tag thì không ai chịu trách nhiệm chi phí.
- Xuất CUR ra S3, dùng Athena truy vấn chi tiết khi cần.
- Bật AWS Budgets với cảnh báo theo ngưỡng thực tế (ví dụ 80%, 100%, 120% so với tháng trước).
- Lập bảng chi phí 3 tháng gần nhất, tìm top 5 khoản lớn nhất và top 5 khoản tăng nhanh nhất.

**Tuần 2 — Dọn tài nguyên không dùng**
- Xóa volume EBS không attach, Elastic IP không gắn, Load Balancer không có target, snapshot cũ hơn N ngày.
- Tìm EC2/RDS/ElastiCache idle (CPU dưới 5% liên tục 14 ngày) và tắt hoặc giảm size.

**Tuần 3-4 — Right-sizing và kiến trúc nhanh thắng**
- Theo Compute Optimizer, giảm size instance từng bước, theo dõi p99 latency (không cắt theo trung bình vì trung bình che giờ cao điểm).
- Thêm S3 gateway endpoint và interface endpoint (ECR, CloudWatch Logs, Secrets Manager) để traffic AWS dịch vụ không qua NAT Gateway.
- Chuyển S3 dữ liệu ít đọc sang Intelligent-Tiering/Glacier, bật lifecycle xoá multipart upload dở dang.

**Tuần 5-6 — Kiến trúc dài hạn**
- Chuyển workload Java sang Graviton (arm64) nếu thư viện hỗ trợ, thường rẻ hơn và nhanh hơn x86 cùng cấp.
- Bật Auto Scaling theo metric thực, tắt dev/staging ngoài giờ hành chính (scheduled scaling về 0).
- Dùng Spot cho batch, CI runner, môi trường dev.

**Tuần 7-8 — Cam kết và ngăn tái phát**
- Chỉ sau khi right-sizing xong và workload ổn định, mua Compute Savings Plans 1 năm cho phần nền chắc chắn dùng (tránh All Upfront nếu chưa chắc).
- Bắt buộc tag trên mọi tài nguyên mới, policy từ chối tạo tài nguyên không tag.
- Review top 5 khoản chi tăng mỗi tháng, không để chi phí lẩn khuất trở lại.

### Các khoản chi phí ẩn hay bị bỏ qua
| Khoản | Triệu chứng | Cách cắt |
|---|---|---|
| NAT Gateway xử lý dữ liệu | NatGatewayBytesProcessed lớn, bill NAT tăng sau mỗi deploy/backup | S3/DynamoDB gateway endpoint, ECR/CloudWatch/Secrets Manager interface endpoint |
| Data transfer cross-AZ | App và database ở AZ khác, traffic chéo AZ tính phí | Đặt app và DB cùng AZ khi có thể, vẫn đảm bảo HA qua nhiều AZ |
| CloudWatch Logs | Log debug nhiều, lưu indefinitely | Đặt retention, lọc log debug, gửi log quan trọng sang S3 |
| Volume/EIP/snapshot không dùng | Hoá đơn EBS/EIP không giảm dù scale down instance | Xóa định kỳ, snapshot lifecycle |
| S3 Standard cho dữ liệu lạnh | Dữ liệu months-old vẫn ở Standard | Lifecycle chuyển IA/Glacier |
| Môi trường dev 24/7 | Instance lớn chạy cả weekend | Scheduled scaling về 0 ngoài giờ |

### Ví dụ code: kiểm tra tần suất đọc S3 để chọn storage class (rút gọn)
~~~java
// Liệt kê object theo prefix và xem LastModified để quyết định chuyển IA/Glacier
S3Client s3 = S3Client.create();
ListObjectsV2Request req = ListObjectsV2Request.builder()
    .bucket("banking-archive")
    .prefix("logs/2024/")
    .build();
var resp = s3.listObjectsV2(req);
resp.contents().forEach(obj -> {
    long ngay = java.time.Duration.between(obj.lastModified(), java.time.Instant.now()).toDays();
    System.out.println(obj.key() + " " + ngay + " ngay");
});
~~~

### Ví dụ đời thực
Một hệ thống Java trên AWS hoá đơn tháng nhảy từ 18.000 lên 23.400 USD. Đội tra Cost Explorer theo tag env=prod thấy dòng NATGateway tăng 2.900 USD, CloudWatchLogs tăng 600 USD, và có 1.200 USD là EBS volume không attach + Elastic IP không dùng. VPC Flow Logs cho thấy các pod trong private subnet pull image Docker từ ECR và ship log lên CloudWatch Logs qua NAT Gateway, mỗi GB tốn phí xử lý NAT. Nguyên gốc: thiếu VPC endpoint cho dịch vụ AWS, log debug không giới hạn, và tài nguyên dở dang không được dọn. Xử lý: thêm gateway endpoint S3 và interface endpoint ECR/CloudWatch Logs/Secrets Manager, đặt CloudWatch Logs retention 30 ngày và lọc log debug, xóa volume/EIP không dùng, chuyển S3 dữ liệu lạnh sang Glacier. Kết quả sau 8 tuần: hoá đơn về 16.100 USD (giảm ~31%), SLO không thay đổi, và team bổ quy tắc review chi phí hàng tuần.

### Trả lời mẫu khi phỏng vấn
"Tôi cắt chi phí AWS theo thứ tự đo lường trước, hành động sau, không bao giờ bắt đầu bằng mua Savings Plans. Tuần đầu tôi bật Cost Explorer, CUR và Budgets, gán tag bắt buộc để biết mỗi team chi tiêu bao nhiêu, rồi tìm top 5 khoản lớn và tăng nhanh nhất. Các khoản ẩn tôi thường thấy là NAT Gateway xử lý dữ liệu (gọi S3, pull ECR, ship log qua NAT), data transfer cross-AZ, CloudWatch Logs lưu debug vô hạn, volume/EIP/snapshot không dùng, và S3 Standard cho dữ liệu lạnh. Tôi xử lý theo kế hoạch 8 tuần: dọn tài nguyên không dùng, right-sizing theo Compute Optimizer và p99 (không theo trung bình), thêm VPC endpoint để traffic AWS dịch vụ không qua NAT, chuyển storage class, dùng Graviton và Spot cho workload phù hợp, tắt dev ngoài giờ; chỉ sau workload ổn định mới mua Savings Plans cho phần nền. Mỗi bước đều có số liệu trước/sau, và tôi đặt budget cảnh báo để chi phí không lẩn khuất trở lại."

> Senior tip: mua Savings Plans trước khi right-sizing là sai lầm kinh điển — bạn cam kết trả tiền cho tài nguyên oversized. Luôn đo lường, dọn và right-sizing dứt khoát trước, rồi mới cam kết. Một buổi review 1 giờ mỗi tháng nhìn top 5 khoản tăng chi phí hiệu quả hơn mọi công cụ đắt tiền.`,
  follow: [
    'Vì sao không nên cắt instance theo CPU trung bình?',
    'Khi nào Savings Plans không đáng mua?',
    'Làm sao bắt buộc mọi team gán tag chi phí trên tài nguyên AWS?'
  ],
  tags: ['AWS', 'cost', 'rightsizing', 'Savings Plans', 'NAT', 'CloudWatch Logs', 'S3', 'senior']
},
)
