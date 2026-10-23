/* Topics: aws — owner: task T6. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'aws-001',
  topic: 'aws',
  level: 'senior',
  q: 'Deploy một Spring Boot service lên AWS: khi nào chọn EC2, ECS Fargate, EKS hay Lambda? Tiêu chí nào thực sự quyết định?',
  a: `**Tóm tắt:** chọn theo mức kiểm soát hạ tầng và mô hình vận hành: EC2 khi cần toàn quyền OS; ECS Fargate khi muốn chạy container mà không quản server; EKS khi đội đã chuẩn Kubernetes hoặc cần hệ sinh thái K8s; Lambda khi workload ngắn, event-driven và chịu được cold start.

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

### Pitfall production
- Đem Spring Boot nguyên bản lên Lambda thường cold start 3–8 giây vì Spring context, Hibernate, connection pool. Đừng chọn Lambda chỉ vì "rẻ" rồi ngạc nhiên vì p99.
- Trên Fargate, task CPU/memory quyết định cả giá lẫn hiệu năng; đặt memory sát giới hạn dễ bị OOMKilled, đặt quá cao thì trả tiền vô ích. Theo dõi memory utilization thực tế trước khi chốt.
- Trên EKS, tự viết YAML deployment cho từng service sẽ nhanh chóng lệch cấu hình; dùng Helm/Kustomize và policy-as-code.

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

### Bẫy production
- **NAT Gateway hết dung lượng/chi phí tăng vọt** vì tải Docker image hoặc log qua NAT. Dùng endpoint cho ECR (api + dkr + s3) và CloudWatch Logs.
- **Một NAT cho nhiều AZ**: AZ đó chết là mất egress toàn hệ; cross-AZ còn phát sinh phí.
- **NACL sửa sai**: vì stateless, mở inbound 443 mà quên outbound ephemeral port 1024–65535 sẽ làm kết nối treo rất khó hiểu.
- **DNS resolution trong VPC**: nếu tắt {{enableDnsSupport}}/{{enableDnsHostnames}} thì endpoint private DNS không hoạt động.
- **CIDR chồng lấn** khi kết nối nhiều VPC/on-prem; vạch dải /16 từ đầu, tránh phải re-IP sau này.

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

### Bẫy production
- Access key nằm trong Git hoặc image: dù xoá sau đó, key vẫn nằm trong layer/history. Phải rotate ngay và bật secret scanning.
- Dùng root account cho CI/CD: thảm hoạ. Bật MFA cho root, không tạo access key cho root.
- Role quá rộng khiến một lỗ hổng SSRF có thể đọc toàn bộ S3. Giới hạn cả quyền lẫn đường mạng (VPC endpoint, IMDSv2).
- Trên EC2, IMDSv1 bị SSRF lợi dụng để lấy credential; bật **IMDSv2 required**.

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

### Bẫy production
- Chọn DynamoDB rồi viết truy vấn kiểu SQL (scan toàn bảng, lọc phía client) sẽ đắt và chậm. DynamoDB yêu cầu **thiết kế bảng theo access pattern** trước.
- Aurora tính I/O, workload nhiều update nhỏ có thể tốn hơn tưởng tượng; đo trước khi chốt.
- RDS Multi-AZ (DB instance) không phải để scale đọc; standby không nhận kết nối, report phải trỏ vào read replica.
- Quên connection pool: mỗi app instance mở quá nhiều connection làm cạn {{max_connections}}. Dùng HikariCP với pool nhỏ và PgBouncer/RDS Proxy nếu cần.

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

### Bẫy production
- Dùng timestamp làm partition key: mọi write dồn vào partition của giây hiện tại. Hãy dùng timestamp làm **sort key**, partition key là entity id.
- GSI bị **throttle ngược** về bảng gốc: nếu GSI không đủ WCU, ghi vào bảng có thể bị ảnh hưởng.
- GSI không đảm bảo consistency mạnh; đọc ngay sau ghi có thể chưa thấy dữ liệu.
- Item 400 KB và transaction tối đa 100 item/4 MB; thiết kế sai kích thước sẽ phải viết lại.

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

### Bẫy production
- Bucket public: gần như luôn sai. Bật Block Public Access, dùng CloudFront + OAC cho nội dung công khai.
- Bật versioning mà không có lifecycle: chi phí lưu tăng âm thầm theo mọi lần ghi.
- Dùng S3 làm filesystem (sửa file nhỏ liên tục): mỗi PUT là object mới, tốn kém; cần filesystem chia sẻ thì dùng EFS.
- Không đặt {{Content-Type}} khi presign PUT: file tải về có thể bị trình duyệt xử lý sai.

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

### Bẫy production
- Visibility timeout ngắn hơn thời gian xử lý: message bị xử lý song song nhiều lần, tạo duplicate và tăng tải DB.
- Không có DLQ: poison message retry vô hạn, đốt tiền và che mất lỗi thật.
- Dùng SQS như event log cần replay: SQS xoá message sau khi ack, không replay được; chọn Kinesis/Kafka/EventBridge archive.
- FIFO với một group duy nhất: mất song song hoàn toàn; chia group theo aggregate id.

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

### Bẫy production
- Có backup nhưng chưa bao giờ restore thử: backup chưa được kiểm chứng là chưa có backup.
- DNS TTL dài làm failover chậm dù hạ tầng sẵn sàng; đặt TTL thấp cho bản ghi failover.
- Khác biệt cấu hình region phụ (IAM, secret, security group) chỉ phát hiện khi có sự cố.
- Active-active mà dữ liệu không partition theo region: xung đột ghi và chi phí cross-region tăng vọt.
- Quên quota/service limit ở region phụ: khi cần scale mới biết chưa xin tăng.

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

### Bẫy production
- DB connection pool nhân theo số instance: scale 5 → 50 instance có thể làm cạn {{max_connections}}. Dùng pool nhỏ, RDS Proxy/PgBouncer.
- Health check gọi endpoint có query DB nặng: tự tạo tải và tự làm mình unhealthy.
- Chỉ scale app mà không scale downstream: SQS consumer tăng gấp 10 nhưng DB khoá.
- Quên connection draining khi deploy: request đang chạy bị cắt giữa chừng, user thấy lỗi 502.

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

### Bẫy production
- **Cache stampede**: nhiều request cùng miss một key nóng, đồng loạt đập DB. Dùng mutex/lock khi rebuild hoặc TTL jitter.
- **Big key**: một key chứa hàng trăm nghìn phần tử làm thao tác block Redis. Chia nhỏ hoặc dùng cấu trúc khác.
- **Hot key**: một key nhận phần lớn traffic, dù cluster vẫn nghẽn một shard. Thêm local cache hoặc replicate key.
- Dùng {{KEYS *}} trên production: block toàn bộ Redis. Dùng {{SCAN}}.
- Không đặt TTL: bộ nhớ đầy dần, eviction bắt đầu xoá dữ liệu quan trọng.
- Nhầm Redis là database bền vững: mất node có thể mất dữ liệu chưa persist; backup/AOF không thay thế được DB giao dịch.

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

### Bẫy production
- Alarm chỉ dựa trên CPU: hệ có thể chết vì DB connection pool cạn trong khi CPU thấp.
- Không có SLO/alarm theo user impact: biết muộn sau khi khách phàn nàn.
- Trace sampling 100% ở traffic lớn: chi phí và overhead tăng mạnh; dùng head/tail sampling hợp lý.
- Log không có timestamp chuẩn, không có trace ID, không có service name: vô dụng khi sự cố.
- Dashboard quá nhiều biểu đồ: không ai nhìn. Chọn 5–8 chỉ số phản ánh sức khoẻ.

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

### Bẫy production
- Cache secret vĩnh viễn rồi bật rotation: app vẫn dùng mật khẩu cũ, RDS từ chối sau khi xoay.
- Log secret khi debug: dính vào CloudWatch, khó xoá, phải rotate ngay.
- Cấp quyền {{secretsmanager:*}} cho mọi service: một service bị chiếm là lộ toàn bộ.
- Dùng cùng KMS key cho mọi môi trường mà không giới hạn key policy: khó cô lập.
- Quên rằng Parameter Store mặc định chỉ khoảng 40 TPS cho GetParameter (bật higher throughput thì có phí); đọc liên tục ở traffic cao sẽ bị throttle.

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

### Bẫy khiến chi phí tăng ngược
- Cắt instance quá tay → app chậm, autoscale bật thêm instance, tổng tiền tăng và user tệ hơn.
- Mua Reserved/Savings Plan cho workload chưa ổn định rồi phải chuyển region/instance family.
- Spot cho workload có state mà không checkpoint: mất việc, chạy lại, tốn gấp đôi.
- Xoá NAT để tiết kiệm nhưng private subnet mất egress, phải mở public, bảo mật giảm.
- Quên môi trường dev/staging chạy 24/7 với instance lớn.

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
- run: aws ecs update-service --cluster prod --service orders \
    --task-definition orders:$TASK_REV --force-new-deployment
~~~

### Bẫy production
- Dùng chung state Terraform cho mọi môi trường: một lỗi plan có thể ảnh hưởng prod.
- Apply tay từ laptop: không audit, dễ lệch. Chạy pipeline với role assume ngắn hạn.
- Pipeline không pin version action/image: build không tái lập được.
- Blue/green nhưng DB migration không tương thích ngược: rollback app không cứu được schema. Dùng migration theo hướng expand/contract.
- Deploy cùng lúc hạ tầng và app khi thay đổi phụ thuộc nhau: thứ tự quan trọng.

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

### Bẫy khi dùng framework
- Review như checklist tô đủ ô: không tạo ra thay đổi nào.
- Chỉ nhìn Reliability/Security mà bỏ Cost/Ops: kiến trúc "đẹp" nhưng không vận hành nổi.
- Đánh giá toàn công ty thay vì từng workload: kết luận chung chung, không ai hành động.
- Không có owner: risk được ghi rồi nằm đó.
- Bỏ qua con người: framework giả định đội đủ năng lực trực hệ thống; với đội nhỏ, chọn managed service đơn giản hơn là kiến trúc tối ưu lý thuyết.

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

### Bẫy production
- Throttle mặc định của API Gateway là 10.000 RPS, burst 5.000, **chia chung cho mọi API trong account/region**; Lambda concurrency mặc định 1.000/region. Một API bị spam kéo sập API khác → đặt throttle theo stage/route và reserved concurrency.
- Retry phía client cộng retry phía SDK khi gặp 504 → nhân bản request.
- Log API Gateway và Lambda tách nhau: bật access log có requestId để nối trace.

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

### Bẫy production
- Payload vượt 256 KB (ảnh CCCD, kết quả OCR) làm execution fail: lưu S3, chỉ truyền key.
- Standard giới hạn 25.000 event trong history: vòng lặp hoặc Map lớn phải dùng Distributed Map hoặc execution con.
- Step Functions retry không làm bước của bạn idempotent: Lambda/API đích vẫn phải chống trùng.
- Đặt tên execution theo mã hồ sơ để tránh khởi động trùng một quy trình.
- Không nhét logic nghiệp vụ vào ASL (Choice lồng nhau phức tạp): ASL là khung điều phối, logic để trong code.

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

### Bẫy production
- Chỉ test failover trên giấy. Hãy chạy {{aws rds failover-db-cluster}} trên staging dưới tải và đo thời gian ghi lỗi.
- Ứng dụng dùng instance endpoint cứng thay vì cluster endpoint.
- Retry vô hạn với backoff nhỏ trong lúc failover: tạo bão connection vào writer mới.

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

### Bẫy production
- Rate limit theo IP ở Việt Nam: nhà mạng di động dùng CGNAT, hàng nghìn người dùng chung một IP. Giới hạn quá chặt sẽ chặn khách thật; nên kết hợp khoá theo header/thiết bị và ngưỡng riêng cho /login.
- Ứng dụng đọc nhầm IP client: phía sau CloudFront + ALB phải lấy từ X-Forwarded-For (Spring: {{server.forward-headers-strategy}}) hoặc header {{CloudFront-Viewer-Address}}, nếu không log và rate limit trong app đều thấy IP của proxy.
- Chặn theo quốc gia làm khách đi nước ngoài không đăng nhập được.

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

### Bẫy
- Áp SCP thẳng vào Prod OU mà chưa thử: chặn luôn pipeline deploy. Luôn có OU thử nghiệm policy.
- SCP có giới hạn kích thước và số policy gắn trên mỗi node (kiểm tra tài liệu hiện hành); viết gọn, gom nhóm.
- Account dễ tạo nhưng khó đóng: phải có quy trình vòng đời account và tag chủ sở hữu.

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

### Bẫy production
- PAN lọt vào log ứng dụng, stack trace, message queue: phạm vi kiểm toán lan ra cả hệ thống log. Cần masking ở logger và quét định kỳ.
- Shared service (CI/CD, monitoring) có quyền vào CDE: tự động nằm trong phạm vi.
- Account log archive mà ai cũng có quyền xoá thì audit vô giá trị.

> Senior tip: thứ tiết kiệm nhiều tiền kiểm toán nhất không phải là thêm công cụ bảo mật mà là giảm số hệ thống chạm vào dữ liệu thẻ. Mỗi service bạn đưa ra khỏi CDE nhờ tokenization là bớt một hạng mục phải chứng minh hằng năm.`,
  follow: [
    'Tokenization khác mã hoá thế nào về phạm vi PCI DSS?',
    'Bạn chứng minh với kiểm toán rằng log CloudTrail không bị sửa thế nào?',
    'Pháp chế yêu cầu dữ liệu khách hàng phải ở Việt Nam: kiến trúc hybrid của bạn ra sao?'
  ],
  tags: ['PCI DSS', 'compliance', 'CloudTrail', 'KMS', 'shared responsibility', 'data residency']
}
);
