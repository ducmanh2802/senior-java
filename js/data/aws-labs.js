/*
 * AWS hands-on lab cards (#/aws, tab "Lab thực hành") → window.AWS_LABS. Original content written for this app;
 * ref[] = slugs of related labs on https://labaws.site/labs/<slug> (index: docs/ref/labaws-index.tsv) for the full step-by-step guide.
 * Item: { id: "awslab-<cat>-NNN", category: "network|rds|storage|compute|ops|dev", title, level: "mid|senior", minutes,
 *        exams: ["sap-c02"|"dop-c02"], domains: ["sap-d1"…], services: ["VPC",…], goal, steps, verify, cost, examTip (markup), ref: ["lab-007-nat-gateway"] }
 */
(window.AWS_LABS = window.AWS_LABS || []).push(
{
  id: 'awslab-network-001',
  category: 'network',
  title: 'VPC & CIDR Planning',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2'],
  services: ['VPC', 'Subnet', 'Route Table'],
  goal: 'Sau lab này bạn hiểu cách chọn CIDR cho VPC, chia subnet theo AZ, và dự phòng mở rộng tương lai — kỹ năng cốt lõi mọi bài system design AWS.',
  steps: [
    'Xác định số lượng AZ cần dùng (tối thiểu 2 cho production) và ước lượng IP cần cho mỗi tier (web, app, data).',
    'Chọn CIDR block VPC đủ lớn (ví dụ 10.0.0.0/16 cho 65k IP) để không bị trùng khi peer với VPC khác hoặc on-premises.',
    'Chia CIDR thành các block con theo tier: public /24 mỗi AZ, private app /24 mỗi AZ, private data /22 mỗi AZ — dùng công cụ ipcalc hoặc AWS VPC CIDR calculator.',
    'Tạo VPC bằng console hoặc CLI: `aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=lab-vpc}]"`.',
    'Tạo subnet trong từng AZ: `aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.0.0/24 --availability-zone ap-southeast-1a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=public-a}]"`.',
    'Bật DNS hostname và DNS resolution cho VPC: `aws ec2 modify-vpc-attribute --vpc-id vpc-xxx --enable-dns-hostnames --enable-dns-support`.',
    'Gán tag `Name` và `Tier` cho từng subnet để dễ quản trị và áp dụng policy tự động sau này.'
  ],
  verify: [
    '`aws ec2 describe-vpcs --vpc-ids vpc-xxx` trả về CIDR đúng và `DhcpOptionsId` có domain-name-servers là AmazonProvidedDNS.',
    '`aws ec2 describe-subnets --filters Name=vpc-id,Values=vpc-xxx` liệt kê đủ subnet, mỗi subnet ở AZ khác nhau, CIDR không trùng.',
    'Trong console VPC → Your VPCs, cột IPv4 CIDR hiển thị đúng block bạn chọn; Subnets tab hiển thị Available IPv4 address count khớp với /24 (251 IP usable).'
  ],
  cost: 'VPC, subnet, DHCP options miễn phí. Chi phí phát sinh khi chạy tài nguyên bên trong (EC2, NAT, ELB). Dọn dẹp: xoá subnet, route table, Internet Gateway, VPC theo thứ tự ngược lại tạo.',
  examTip: `### Bẫy đề thi
- **CIDR trùng**: đề hay cho 2 VPC cùng {{10.0.0.0/16}} → không thể peering, không thể attach Transit Gateway. Luôn kiểm tra CIDR overlap.
- **Kích thước quá nhỏ**: {{/28}} chỉ cho 11 IP usable — không đủ cho ALB + NAT + workload. Production ít nhất {{/24}} mỗi subnet.
- **Quên dự phòng**: không dành CIDR cho tier mới (ví dụ EKS, Lambda ENI) → phải tạo VPC mới. Best practice: reserve 1–2 {{/16}} cho tương lai.
- **Single-AZ**: đề hỏi "highly available" mà thiết kế chỉ 1 subnet/AZ → sai. Luôn multi-AZ.`,
  ref: ['lab-001-cidr-va-vpc-network-planning', 'lab-004-vpc-cidr-planning', 'lab-010-thiet-ke-ip-plan-production'],
},
{
  id: 'awslab-network-002',
  category: 'network',
  title: 'Public & Private Subnet Design',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2'],
  services: ['VPC', 'Subnet', 'Internet Gateway', 'NAT Gateway'],
  goal: 'Sau lab này bạn phân biệt được public/private subnet, gán route table phù hợp, và hiểu tại sao workload production luôn đặt ở private subnet.',
  steps: [
    'Tạo Internet Gateway: `aws ec2 create-internet-gateway --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=lab-igw}]"` và attach vào VPC.',
    'Tạo route table cho public subnet: `aws ec2 create-route-table --vpc-id vpc-xxx --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=public-rt}]"`.',
    'Thêm route 0.0.0.0/0 trỏ Internet Gateway: `aws ec2 create-route --route-table-id rtb-xxx --destination-cidr-block 0.0.0.0/0 --gateway-id igw-xxx`.',
    'Gán route table public cho subnet public-a/public-b: `aws ec2 associate-route-table --subnet-id subnet-xxx --route-table-id rtb-xxx`.',
    'Tạo route table riêng cho private subnet (không có route 0.0.0.0/0 ra Internet).',
    '(Tuỳ chọn, tốn tiền) Tạo NAT Gateway ở public-a: cấp Elastic IP `aws ec2 allocate-address --domain vpc`, rồi `aws ec2 create-nat-gateway --subnet-id subnet-public-a --allocation-id eipalloc-xxx`.',
    'Cập nhật route table private: thêm route 0.0.0.0/0 trỏ NAT Gateway (`--nat-gateway-id nat-xxx`).',
    'Kiểm tra: EC2 ở private subnet không có public IP vẫn `curl https://aws.amazon.com` được nhờ NAT; EC2 ở public subnet có public IP truy cập Internet trực tiếp.'
  ],
  verify: [
    '`aws ec2 describe-route-tables --route-table-ids rtb-public rtb-private` cho thấy public-rt có route `0.0.0.0/0 -> igw-xxx`, private-rt có `0.0.0.0/0 -> nat-xxx`.',
    'Từ EC2 private (Session Manager): `curl -s http://checkip.amazonaws.com` trả về EIP của NAT Gateway, không phải IP của instance.',
    'Từ EC2 public: `curl -s http://checkip.amazonaws.com` trả về public IP của instance.'
  ],
  cost: 'NAT Gateway ~0.045 USD/giờ + phí xử lý GB (~0.045 USD/GB). Elastic IP gắn NAT miễn phí khi đang attach; EIP rỗi ~0.005 USD/giờ. Dọn dẹp BẮT BUỘC: xoá NAT Gateway trước (chờ state Deleted), release EIP, terminate EC2, xoá route table, IGW, subnet, VPC.',
  examTip: `### Bẫy đề thi
- **Public subnet = có route ra IGW**, không phải "có public IP". Instance trong public subnet *có thể* không có public IP nhưng vẫn là public subnet.
- **NAT Gateway là regional, không phải AZ-level**: 1 NAT/AZ cho high availability. Dùng 1 NAT cho 2 AZ → AZ failure làm rơi toàn bộ private traffic.
- **NAT không hỗ trợ IPv6**: IPv6 private subnet dùng **Egress-only Internet Gateway** (lab-033).
- **Bastion host vs Session Manager**: đề hiện nay ưu tiên Session Manager (Systems Manager) — không cần bastion, không mở port 22, không tốn EC2.`,
  ref: ['lab-002-public-va-private-subnet', 'lab-012-tao-public-private-database-subnet', 'lab-014-public-route-qua-internet-gateway', 'lab-015-private-route-qua-nat-gateway'],
},
{
  id: 'awslab-network-003',
  category: 'network',
  title: 'NAT Gateway Deep Dive',
  level: 'senior',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'sap-d3'],
  services: ['NAT Gateway', 'Elastic IP', 'CloudWatch'],
  goal: 'Sau lab này bạn hiểu NAT Gateway hoạt động thế nào, giới hạn băng thông, metric quan trọng, và cách thiết kế HA đúng chuẩn production.',
  steps: [
    'Tạo NAT Gateway ở public-a: cấp EIP, `aws ec2 create-nat-gateway --subnet-id subnet-public-a --allocation-id eipalloc-xxx --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=nat-a}]"`.',
    'Chờ state `Available` (vài phút). Lặp lại cho public-b để có NAT đa AZ.',
    'Cập nhật route table private-a trỏ NAT-a, private-b trỏ NAT-b (không dùng chung 1 NAT cho 2 AZ).',
    'Bật CloudWatch metrics cho NAT: `BytesInFromSource`, `BytesOutToDestination`, `PacketsDropCount`, `ErrorPortAllocation`, `IdleTimeoutCount`.',
    'Tạo alarm: `ErrorPortAllocation > 0` trong 5 phút → SNS alert (dấu hiệu NAT hết port do quá nhiều connection đồng thời).',
    'Test giới hạn: từ EC2 private chạy `for i in {1..1000}; do curl -s https://httpbin.org/ip & done; wait` và quan sát `ErrorPortAllocation` tăng.',
    'Xem flow logs: bật VPC Flow Logs cho subnet private, gửi CloudWatch Logs, lọc `REJECT` do NAT port exhaustion.'
  ],
  verify: [
    '`aws ec2 describe-nat-gateways --nat-gateway-ids nat-xxx` trả về `State: available`, `SubnetId` đúng AZ, `NatGatewayAddresses` có EIP.',
    'CloudWatch metric `ActiveConnectionCount` tăng khi test, `ErrorPortAllocation` = 0 trong điều kiện bình thường.',
    'Truy cập Internet từ EC2 private thành công, IP nguồn là EIP của NAT Gateway.'
  ],
  cost: 'NAT Gateway ~0.045 USD/giờ (AP Southeast) + ~0.045 USD/GB data processing. 2 NAT/AZ cho HA → ~2.16 USD/ngày nếu chạy liên tục. Dọn dẹp: xoá NAT Gateway (chờ Deleted), release EIP, xoá flow log group, alarm, SNS topic.',
  examTip: `### Bẫy đề thi
- **NAT Gateway không phải instance**: không SSH được, không cài agent, không đổi security group. Chỉ quản trị qua console/CLI.
- **Giới hạn 5 Gbps mặc định, burst 100 Gbps**: workload nặng (replication, backup) có thể chạm giới hạn → chia nhiều NAT, dùng VPC endpoint cho S3/DynamoDB để giảm traffic qua NAT.
- **Idle timeout 350 giây**: connection nhàn > 350s bị drop. Ứng dụng keep-alive (TCP keepalive, HTTP/2 ping) cần cấu hình < 350s.
- **Không hỗ trợ IPv6**: dùng Egress-only IGW cho IPv6.
- **Cross-AZ data transfer charge**: traffic từ private-a ra NAT-b tính phí cross-AZ. Luôn route private-a → NAT-a.`,
  ref: ['lab-007-nat-gateway', 'lab-015-private-route-qua-nat-gateway', 'lab-093-nat-gateway-bottleneck'],
},
{
  id: 'awslab-network-004',
  category: 'network',
  title: 'Route Table & Longest Prefix Match',
  level: 'senior',
  minutes: 35,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2'],
  services: ['VPC', 'Route Table', 'Transit Gateway', 'VPN'],
  goal: 'Sau lab này bạn nắm longest prefix match, route propagation, blackhole route, và cách debug routing bất đối xứng — đề thi hay xét.',
  steps: [
    'Tạo VPC 10.0.0.0/16, 2 public subnet /24, 2 private subnet /24.',
    'Tạo route table public: route 0.0.0.0/0 → IGW. Gán cho public subnet.',
    'Tạo route table private: route 0.0.0.0/0 → NAT. Gán cho private subnet.',
    'Thêm route cụ thể hơn (longer prefix) cho VPC peering: 10.1.0.0/16 → pcx-xxx. Kiểm tra traffic đến 10.1.0.0/16 đi peering, còn lại đi NAT.',
    'Bật **Route Propagation** cho TGW/VPN: route table private bật `Propagate` cho TGW attachment → route từ on-premises tự động xuất hiện.',
    'Tạo blackhole route: thêm route 10.2.0.0/16 trỏ IGW, rồi detach IGW → route trạng thái `blackhole`. Test ping 10.2.0.0/16 từ EC2 private: timeout (không phải ICMP unreachable).',
    'Dùng **Reachability Analyzer** kiểm tra path từ EC2 private đến on-premises CIDR: xác nhận path đi TGW → VPN/DX.'
  ],
  verify: [
    '`aws ec2 describe-route-tables --route-table-ids rtb-xxx` hiển thị route table có `Routes` với `DestinationPrefixListId`, `GatewayId`, `NatGatewayId`, `TransitGatewayId`, `VpcPeeringConnectionId` đúng.',
    'Từ EC2 private: `tracepath 10.1.0.10` (peering CIDR) hop đầu là TGW/peering ENI; `tracepath 8.8.8.8` hop đầu là NAT ENI.',
    'Blackhole route: `State: blackhole` trong console/CLI; packet drop không gửi ICMP Time Exceeded.'
  ],
  cost: 'Route table miễn phí. Reachability Analyzer ~0.10 USD/test. Dọn dẹp: xoá route, route table, peering, TGW attachment, TGW, VPN/DX, VPC.',
  examTip: `### Bẫy đề thi
- **Longest prefix match luôn thắng**: route {{/24}} thắng route {{/16}}, bất kể metric. Đề hay cho 2 route trùng CIDR khác next-hop → chọn prefix dài hơn.
- **Route propagation ≠ route table association**: propagation chỉ *nhận* route từ TGW/VPN; association mới *áp dụng* route table cho subnet. Cần cả 2.
- **Blackhole route**: detach target (IGW, NAT, TGW, peering) mà không xoá route → blackhole. Traffic drop im lặng, khó debug. Luôn xoá route khi xoá target.
- **Asymmetric routing**: request đi NAT-A, response về NAT-B (do route table private dùng chung NAT) → stateful firewall/NAT drop. Fix: 1 NAT/AZ, route table riêng cho từng AZ.
- **Transit Gateway route table**: TGW có route table riêng, riêng với VPC route table. Phân đoạn (segmentation) bằng multiple TGW route table.`,
  ref: ['lab-005-route-table-longest-prefix-match', 'lab-013-gan-route-table-theo-subnet', 'lab-018-route-propagation-va-blackhole-route', 'lab-019-phan-tich-asymmetric-routing', 'lab-066-tgw-route-tables-va-route-domains'],
},
{
  id: 'awslab-network-005',
  category: 'network',
  title: 'Security Group vs Network ACL',
  level: 'senior',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2', 'dop-d6'],
  services: ['Security Group', 'Network ACL', 'VPC'],
  goal: 'Sau lab này bạn phân biệt rõ stateful vs stateless, khi dùng SG, khi dùng NACL, và cách layer chúng để defense-in-depth — câu hỏi bắt buộc mọi bài security.',
  steps: [
    'Tạo SG cho ALB: inbound 80/443 từ 0.0.0.0/0, outbound mặc định (all traffic). Gán cho ALB.',
    'Tạo SG cho EC2 app (private): inbound 8080 *chỉ từ SG của ALB* (source = sg-alb), outbound 443 ra Internet (cho gọi API bên ngoài) + 3306 đến SG của RDS.',
    'Tạo SG cho RDS: inbound 3306 *chỉ từ SG của EC2 app*, outbound mặc định.',
    'Tạo NACL cho public subnet: inbound allow 80/443 từ 0.0.0.0/0, allow ephemeral 1024-65535 từ 0.0.0.0/0 (return traffic), deny all khác. Outbound allow 1024-65535 → 0.0.0.0/0, deny all.',
    'Tạo NACL cho private subnet: inbound allow 8080 từ public subnet CIDR, allow ephemeral 1024-65535 từ 0.0.0.0/0, deny all. Outbound allow 443/3306/ephemeral, deny all.',
    'Test: truy cập ALB → OK. SSH trực tiếp vào EC2 app (public IP) → block bởi SG (không có rule 22). Thêm rule NACL deny 22 ở public subnet → block ngay cả khi SG cho phép.',
    'Xem flow logs: bật VPC Flow Logs, lọc `REJECT` action → thấy packet bị chặn ở SG hay NACL (log có `pkt-srcaddr`, `pkt-dstaddr`, `tcp-flags`).'
  ],
  verify: [
    '`aws ec2 describe-security-groups --group-ids sg-xxx` cho thấy inbound/outbound rules đúng, `ReferencedGroupInfo` trỏ SG khác cho rule source/destination SG.',
    '`aws ec2 describe-network-acls --filters Name=vpc-id,Values=vpc-xxx` cho thấy entries theo rule number (100, 200…), `RuleAction: allow/deny`, `Egress: true/false`.',
    'ALB health check healthy; EC2 app gọi RDS thành công; SSH từ bastion bị chặn.'
  ],
  cost: 'SG, NACL miễn phí. Flow Logs ~0.50 USD/GB ingest + 0.03 USD/GB storage CloudWatch Logs. Dọn dẹp: xoá flow log, log group, NACL entries (trừ default), SG custom, VPC.',
  examTip: `### Bẫy đề thi
- **Stateful vs Stateless**: SG tự động cho return traffic (stateless); NACL phải khai báo *cả 2 chiều* (inbound + outbound) cho ephemeral port {{1024-65535}}.
- **SG gắn ENI, NACL gắn subnet**: 1 subnet = 1 NACL (mặc định default NACL allow all). 1 ENI = nhiều SG. Thay đổi SG tức thì; NACL áp dụng theo rule number thứ tự.
- **SG không hỗ trợ DENY**: chỉ có ALLOW. Cần chặn IP xấu → dùng NACL (deny rule số nhỏ hơn allow) hoặc WAF/Network Firewall.
- **Ephemeral port range**: Linux kernel mặc định {{32768-60999}}, Windows {{49152-65535}}. NACL outbound allow {{1024-65535}} để chắc chắn bao phủ mọi OS.
- **Layered security**: ALB (SG public) → App (SG chỉ từ ALB SG) → DB (SG chỉ từ App SG). NACL ở subnet edge chặn traffic không mong muốn trước khi đến SG.`,
  ref: ['lab-021-security-group-stateful', 'lab-022-network-acl-stateless', 'lab-023-so-sanh-sg-va-nacl', 'lab-024-layered-security-web-app-database', 'lab-026-ephemeral-port-va-return-traffic'],
},
{
  id: 'awslab-network-006',
  category: 'network',
  title: 'VPC Endpoint: Gateway vs Interface',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2', 'dop-d3'],
  services: ['VPC Endpoint', 'S3', 'DynamoDB', 'PrivateLink', 'Route 53'],
  goal: 'Sau lab này bạn biết khi nào dùng Gateway Endpoint (S3, DynamoDB — miễn phí) vs Interface Endpoint (PrivateLink — tốn tiền), cách gán policy, và tại sao private DNS quan trọng.',
  steps: [
    'Tạo **Gateway Endpoint** cho S3: `aws ec2 create-vpc-endpoint --vpc-id vpc-xxx --service-name com.amazonaws.ap-southeast-1.s3 --vpc-endpoint-type Gateway --route-table-ids rtb-private-a rtb-private-b --policy-document file://s3-endpoint-policy.json`.',
    'Policy ví dụ: chỉ cho phép `s3:GetObject`, `s3:ListBucket` trên bucket cụ thể, deny `s3:DeleteBucket`.',
    'Tạo **Gateway Endpoint** cho DynamoDB tương tự (`--service-name com.amazonaws.ap-southeast-1.dynamodb`).',
    'Tạo **Interface Endpoint** cho SSM (Session Manager): `aws ec2 create-vpc-endpoint --vpc-id vpc-xxx --service-name com.amazonaws.ap-southeast-1.ssm --vpc-endpoint-type Interface --subnet-ids subnet-private-a subnet-private-b --security-group-ids sg-vpce --private-dns-enabled`.',
    'Lặp lại cho `ec2messages`, `ssmmessages`, `ecr.api`, `ecr.dkr`, `logs` để EC2 private chạy agent, pull image, gửi log không cần NAT.',
    'Kiểm tra private DNS: `nslookup s3.ap-southeast-1.amazonaws.com` từ EC2 private trả về IP private (10.x.x.x) của endpoint, không phải public IP.',
    'Test: từ EC2 private (không NAT) chạy `aws s3 ls s3://my-bucket` → thành công. `aws dynamodb list-tables` → thành công. `aws ssm start-session --target i-xxx` → kết nối được.'
  ],
  verify: [
    '`aws ec2 describe-vpc-endpoints --vpc-endpoint-ids vpce-xxx` trả về `VpcEndpointType: Gateway` cho S3/DDB, `Interface` cho SSM; `State: available`; `PrivateDnsEnabled: true`.',
    'Route table private có route `pl-xxx` (prefix list ID của S3/DDB) trỏ `vpce-xxx` (Gateway). Interface endpoint tạo ENI trong subnet private có IP private.',
    'Từ EC2 private: `curl -v https://s3.ap-southeast-1.amazonaws.com/my-bucket` header `Via: vpce-xxx` xác nhận qua endpoint.'
  ],
  cost: 'Gateway Endpoint (S3, DynamoDB): **miễn phí**. Interface Endpoint: ~0.01 USD/giờ/endpoint/AZ + 0.01 USD/GB data processing. 5 interface endpoint × 2 AZ ≈ 2.40 USD/ngày. Dọn dẹp: xoá endpoint (Interface trước, Gateway sau), xoá ENI, SG, policy.',
  examTip: `### Bẫy đề thi
- **Gateway Endpoint chỉ hỗ trợ S3 và DynamoDB**. Các dịch vụ khác (Kinesis, SQS, Secrets Manager, CloudWatch…) bắt buộc dùng Interface Endpoint (PrivateLink).
- **Private DNS mặc định bật**: bật {{PrivateDnsEnabled}} → Route 53 resolver trả về IP private của endpoint. Tắt thì client phải dùng DNS name dạng {{vpce-xxx-xxx.s3.ap-southeast-1.vpce.amazonaws.com}}.
- **Endpoint Policy**: Gateway Endpoint hỗ trợ policy (JSON như bucket policy). Interface Endpoint *không* hỗ trợ policy tại endpoint; kiểm soát bằng SG gắn ENI + IAM policy.
- **Cross-region**: Gateway Endpoint chỉ hoạt động trong Region đó. S3 cross-region replication vẫn dùng public endpoint (hoặc CRR qua VPC peering + endpoint ở region đích).
- **Chi phí NAT vs Endpoint**: workload đọc/ghi S3 nhiều GB/ngày → Gateway Endpoint tiết kiệm chi phí NAT + data transfer. Đề hay hỏi "giảm chi phí NAT" → trả lời Gateway Endpoint.`,
  ref: ['lab-041-s3-gateway-endpoint', 'lab-042-dynamodb-gateway-endpoint', 'lab-043-ssm-interface-endpoint', 'lab-048-gateway-va-interface-endpoint', 'lab-049-chan-internet-nhung-van-dung-aws-api'],
},
{
  id: 'awslab-network-007',
  category: 'network',
  title: 'AWS PrivateLink (Service Consumer & Provider)',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2'],
  services: ['PrivateLink', 'NLB', 'VPC Endpoint Service', 'Route 53'],
  goal: 'Sau lab này bạn hiểu PrivateLink cho phép truy cập service của account khác/VPC khác như thể nó ở local VPC — không đi Internet, không peering, không NAT. Kiến trúc quan trọng cho SaaS, shared services, multi-account.',
  steps: [
    '**Provider side** (account A): Tạo NLB (internal) ở private subnet, target group trỏ EC2/ECS service cổng 8080. Bật `DeletionProtection`.',
    'Tạo **VPC Endpoint Service**: `aws ec2 create-vpc-endpoint-service-configuration --network-load-balancer-arns arn:aws:elasticloadbalancing:region:111122223333:loadbalancer/net/nlb-xxx --acceptance-required --tag-specifications "ResourceType=vpc-endpoint-service,Tags=[{Key=Name,Value=shared-api}]"`.',
    'Cho phép account B tạo endpoint: `aws ec2 modify-vpc-endpoint-service-configuration --service-id vpce-svc-xxx --add-allowed-principals arn:aws:iam::444455556666:root`.',
    '**Consumer side** (account B): Tạo Interface Endpoint trỏ service name: `aws ec2 create-vpc-endpoint --vpc-id vpc-yyy --service-name com.amazonaws.vpce.region.vpce-svc-xxx --vpc-endpoint-type Interface --subnet-ids subnet-private-a subnet-private-b --private-dns-enabled`.',
    'Kiểm tra DNS: `nslookup vpce-xxx-xxx.vpce-svc-xxx.vpce.region.vpce.amazonaws.com` trả IP private ENI trong account B.',
    'Test kết nối: từ EC2 account B `curl http://vpce-xxx.vpce-svc-xxx.vpce.region.vpce.amazonaws.com:8080/health` → 200 OK.',
    '(Nâng cao) Tạo **Private Hosted Zone** `shared.internal` associate VPC consumer, record CNAME trỏ endpoint DNS → client dùng `api.shared.internal` thay DNS dài.'
  ],
  verify: [
    '`aws ec2 describe-vpc-endpoint-services --service-names com.amazonaws.vpce.region.vpce-svc-xxx` trả về `ServiceName`, `ServiceType: Interface`, `Owner: 111122223333`.',
    '`aws ec2 describe-vpc-endpoints --filters Name=service-name,Values=com.amazonaws.vpce.region.vpce-svc-xxx` state `Available`, `PrivateDnsEnabled: true`.',
    'Truy cập service từ consumer VPC thành công, không cần IGW/NAT/peering. Security group NLB cho phép inbound từ CIDR consumer VPC.'
  ],
  cost: 'NLB ~0.0225 USD/giờ + LCU. Interface Endpoint consumer ~0.01 USD/giờ/AZ + 0.01 USD/GB. Provider không tốn endpoint fee. Dọn dẹp: xoá endpoint consumer, xoá endpoint service config, xoá NLB, target group.',
  examTip: `### Bẫy đề thi
- **PrivateLink ≠ VPC Peering**: Peering nối 2 VPC (CIDR không trùng, không transitive). PrivateLink expose *một service* (NLB) cho consumer, CIDR có thể trùng, consumer chỉ thấy endpoint ENI.
- **Service name format**: {{com.amazonaws.vpce.<region>.<vpce-svc-id>}}. Consumer dùng tên này để tạo endpoint.
- **Acceptance required**: mặc định bật — provider phải accept thủ công (hoặc auto-accept qua principal). Đề hay hỏi "automate acceptance" → dùng {{--acceptance-required false}} hoặc principal cụ thể.
- **Private DNS**: bật {{PrivateDnsEnabled}} → consumer resolve service name thành IP private. Tắt thì consumer phải hardcode endpoint DNS (không khuyến khích).
- **Security group trên NLB**: NLB không có SG riêng; kiểm soát bằng SG trên target (EC2/ECS) + allow từ CIDR consumer VPC (xem qua {{X-Forwarded-For}} hoặc Proxy Protocol v2).
- **Cross-region PrivateLink**: không hỗ trợ trực tiếp. Muốn multi-region → deploy provider ở mỗi region, dùng Route 53 latency/weighted routing trỏ endpoint DNS của từng region.`,
  ref: ['lab-069-privatelink-consumer', 'lab-070-privatelink-provider-service'],
},
{
  id: 'awslab-network-008',
  category: 'network',
  title: 'VPC Peering vs Transit Gateway',
  level: 'senior',
  minutes: 55,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2'],
  services: ['VPC Peering', 'Transit Gateway', 'Route Table', 'CloudWatch'],
  goal: 'Sau lab này bạn so sánh được peering (đơn giản, không transitive, giới hạn 125/VPC) vs Transit Gateway (hub-and-spoke, transitive, scale hàng trăm VPC) — quyết định kiến trúc network quy mô lớn.',
  steps: [
    'Tạo 3 VPC CIDR không trùng: 10.1.0.0/16 (shared), 10.2.0.0/16 (app), 10.3.0.0/16 (dev). Mỗi VPC 1 private subnet + EC2 test.',
    '**Peering**: Tạo peering shared↔app (`aws ec2 create-vpc-peering-connection --vpc-id vpc-shared --peer-vpc-id vpc-app`). Accept peering. Thêm route 10.2.0.0/16 → pcx-xxx ở shared, 10.1.0.0/16 → pcx-xxx ở app.',
    'Test ping shared→app: OK. Tạo peering shared↔dev. Thử ping app→dev: **thất bại** (peering không transitive).',
    '**Transit Gateway**: Tạo TGW `aws ec2 create-transit-gateway --description "lab-tgw" --options AmazonSideAsn=64512,AutoAcceptSharedAttachments=disable,DefaultRouteTableAssociation=enable,DefaultRouteTablePropagation=enable`.',
    'Attach 3 VPC vào TGW: `aws ec2 create-transit-gateway-vpc-attachment --transit-gateway-id tgw-xxx --vpc-id vpc-shared --subnet-ids subnet-shared`. Lặp cho app, dev.',
    'Trong route table VPC shared/app/dev: thêm route 10.0.0.0/8 → tgw-xxx. Test ping chéo 3 VPC: **thành công** (TGW transitive).',
    'Phân đoạn: Tạo 2 TGW route table (shared, isolated). Associate attachment shared vào shared-rt, app/dev vào isolated-rt. Trong isolated-rt: route 10.1.0.0/16 (shared) → attachment shared. Kết quả: app/dev thấy shared, nhưng **app không thấy dev**.',
    'Xem TGW CloudWatch metric: `BytesIn`, `BytesOut`, `PacketDropCount` (do blackhole route hoặc quota).'
  ],
  verify: [
    '`aws ec2 describe-vpc-peering-connections --filters Name=status-code,Values=active` liệt kê peering active.',
    '`aws ec2 describe-transit-gateways --transit-gateway-ids tgw-xxx` state `available`. `aws ec2 describe-transit-gateway-attachments --filters Name=transit-gateway-id,Values=tgw-xxx` 3 attachment state `available`.',
    'Từ EC2 app: `ping 10.1.x.x` (shared) OK, `ping 10.3.x.x` (dev) OK khi dùng TGW default RT; sau khi phân đoạn RT, ping dev thất bại.'
  ],
  cost: 'Peering: miễn phí tạo, data transfer cross-AZ/cross-region tính phí (~0.01 USD/GB). TGW: ~0.05 USD/giờ/attachment + 0.02 USD/GB data processing. 3 attachment ≈ 3.60 USD/ngày. Dọn dẹp: xoá TGW attachment, TGW route table, TGW, peering, VPC.',
  examTip: `### Bẫy đề thi
- **Peering limit**: 125 active peering/VPC (có thể tăng quota). TGW: 5000 attachment/TGW (mặc định), scale dễ dàng.
- **CIDR overlap**: Peering **không cho phép** CIDR trùng. TGW **cho phép** CIDR trùng (dùng route table phân đoạn). Đề multi-account merger/acquisition → TGW.
- **Transitive routing**: Peering không transitive (A↔B, B↔C ≠ A↔C). TGW transitive theo route table.
- **Bandwidth**: Peering single-flow ~5 Gbps, multi-flow scale. TGW: 50 Gbps/attachment, burst 100 Gbps.
- **Cross-region**: Inter-region peering tồn tại nhưng phức tạp. TGW **Transit Gateway Connect / Inter-Region Peering** (TGW peering) là chuẩn cho multi-region hub.
- **Appliance mode**: TGW appliance mode (cho firewall/IDS) buộc symmetric routing qua cùng AZ attachment. Đề "inspect traffic giữa VPC" → TGW + appliance mode + Network Firewall/GWLB.`,
  ref: ['lab-061-vpc-peering-cung-region', 'lab-062-inter-region-vpc-peering', 'lab-063-xu-ly-overlapping-cidr', 'lab-065-transit-gateway-co-ban', 'lab-066-tgw-route-tables-va-route-domains', 'lab-067-tgw-attachment-nhieu-vpc'],
},
{
  id: 'awslab-network-009',
  category: 'network',
  title: 'Site-to-Site VPN & Direct Connect',
  level: 'senior',
  minutes: 55,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2'],
  services: ['Site-to-Site VPN', 'Direct Connect', 'Virtual Private Gateway', 'Transit Gateway', 'BGP'],
  goal: 'Sau lab này bạn hiểu hybrid connectivity: VPN (nhanh, mã hoá, ~1.25 Gbps/tunnel) vs Direct Connect (dedicated, low latency, 1–100 Gbps), và cách kết hợp chúng cho HA.',
  steps: [
    '**VPN**: Tạo Customer Gateway (CGW) với public IP on-prem: `aws ec2 create-customer-gateway --bgp-asn 65000 --public-ip 203.0.113.1 --type ipsec.1`.',
    'Tạo Virtual Private Gateway (VGW) attach VPC: `aws ec2 create-vpn-gateway --type ipsec.1 --tag-specifications "ResourceType=vpn-gateway,Tags=[{Key=Name,Value=lab-vgw}]"` → `aws ec2 attach-vpn-gateway --vpc-id vpc-xxx --vpn-gateway-id vgw-xxx`.',
    'Tạo VPN Connection: `aws ec2 create-vpn-connection --type ipsec.1 --customer-gateway-id cgw-xxx --vpn-gateway-id vgw-xxx --options TunnelInsideIpVersion=ipv4,StartupAction=start`.',
    'Tải cấu hình VPN (generic): `aws ec2 describe-vpn-connections --vpn-connection-ids vpn-xxx` → copy `CustomerGatewayConfiguration` (IPsec tunnel 1 & 2, BGP ASN, pre-shared key). Cấu hình router on-prem.',
    'Bật route propagation cho VGW trên route table private: `aws ec2 enable-vgw-route-propagation --route-table-id rtb-private --gateway-id vgw-xxx`.',
    '**Direct Connect** (mô phỏng): Tạo DX Gateway `aws directconnect create-direct-connect-gateway --direct-connect-gateway-name lab-dxgw --amazon-side-asn 64512`.',
    'Tạo Transit VIF trên DX Gateway: `aws directconnect create-virtual-interface --connection-id dxcon-xxx --virtual-interface-name transit-vif --vlan 100 --virtual-interface-type transit --direct-connect-gateway-id dxgw-xxx --address-family ipv4 --bgp-asn 65000 --bgp-auth-key xxx`.',
    'Associate DX Gateway với TGW: `aws ec2 create-transit-gateway-connect --transport-transit-gateway-attachment-id tgw-attach-xxx --options Protocol=gre`. (Thực tế: associate DX GW → TGW qua console).',
    'VPN làm backup: cấu hình BGP AS-PATH prepend cho VPN path dài hơn → traffic ưu tiên DX. Test failover: down DX, traffic tự chuyển VPN.'
  ],
  verify: [
    '`aws ec2 describe-vpn-connections --vpn-connection-ids vpn-xxx` state `available`, 2 tunnel `UP`, BGP `ESTABLISHED`.',
    'Route table private có route propagated từ VGW (on-prem CIDR) → `Origin: vgw`.',
    'Từ EC2 private ping on-prem server thành công. Traceroute cho thấy hop qua VGW/TGW.',
    'DX: `aws directconnect describe-virtual-interfaces --virtual-interface-id vif-xxx` state `up`, BGP `up`.'
  ],
  cost: 'VPN: ~0.05 USD/giờ/tunnel + data transfer (~0.02 USD/GB). 2 tunnel ≈ 2.40 USD/ngày. DX: port fee (1 Gbps ~0.25 USD/giờ, 10 Gbps ~2.50 USD/giờ) + data transfer OUT (~0.02 USD/GB) + partner cross-connect fee. Dọn dẹp: xoá VPN connection, VGW, CGW, VIF, DX Gateway association, TGW connect.',
  examTip: `### Bẫy đề thi
- **VPN bandwidth**: 1.25 Gbps/tunnel (IPsec overhead). Cần nhiều tunnel + ECMP cho throughput cao. Đề "migrate 100 TB, 1 Gbps link" → VPN không đủ, dùng DX hoặc Snowball.
- **DX resiliency**: 1 DX connection = SPOF. HA = 2 DX connection tại 2 location khác nhau + VPN backup. DX Gateway + TGW cho multi-VPC/multi-region.
- **BGP vs Static routing**: BGP cho failover tự động, route propagation. Static routing phải cấu hình thủ công, không scale. SAP/DOP ưu tiên BGP.
- **Public VIF vs Private VIF vs Transit VIF**: Public VIF truy cập public AWS service (S3, DynamoDB public endpoint). Private VIF truy cập VPC qua VGW. Transit VIF truy cập TGW (multi-VPC, multi-account).
- **Encryption**: VPN mặc định IPsec AES-256. DX **không mã hoá** (layer 1/2). Đề yêu cầu encryption trên DX → dùng MACsec (100 Gbps) hoặc IPsec tunnel поверх DX (tốn throughput).
- **Failover time**: VPN failover ~30-60s (BGP hold timer). DX failover nhanh hơn nếu dùng BFD. Đề "RTO < 30s" → cân nhắc BFD + DX HA.`,
  ref: ['lab-071-site-to-site-vpn-architecture', 'lab-072-customer-gateway-va-virtual-private-gateway', 'lab-074-dynamic-bgp-vpn', 'lab-075-vpn-tunnel-failover', 'lab-077-direct-connect-virtual-interface', 'lab-078-direct-connect-gateway', 'lab-079-transit-vif-voi-transit-gateway'],
},
{
  id: 'awslab-network-010',
  category: 'network',
  title: 'Route 53 Routing Policies',
  level: 'senior',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2', 'dop-d3'],
  services: ['Route 53', 'Health Check', 'ALB', 'CloudFront', 'S3'],
  goal: 'Sau lab này bạn thuộc 7 routing policy (Simple, Weighted, Latency, Failover, Geolocation, Geoproximity, Multivalue Answer), biết khi nào dùng cái nào, và cách kết hợp health check cho failover tự động.',
  steps: [
    'Tạo Public Hosted Zone `lab.example.com` (hoặc dùng domain thật).',
    '**Simple**: Tạo record `www A` trỏ ALB IP (alias). Test: `dig www.lab.example.com` trả 1 IP.',
    '**Weighted**: Tạo 2 record `api A` alias ALB-1 (weight 80) và ALB-2 (weight 20). Test: chạy `for i in {1..100}; do dig +short api.lab.example.com; done | sort | uniq -c` → tỷ lệ ~80/20.',
    '**Latency**: Tạo record `app A` alias ALB-ap-southeast-1 (region ap-southeast-1) và ALB-us-east-1 (region us-east-1). Từ client Singapore → resolve ALB Singapore; từ client Virginia → resolve ALB Virginia.',
    '**Failover**: Tạo record `primary A` alias ALB-primary (type PRIMARY, health check ID), `secondary A` alias ALB-secondary (type SECONDARY, health check ID). Health check primary: HTTP 200 trên `/health`. Tắt ALB primary → health check fail → DNS trả secondary.',
    '**Geolocation**: Tạo record `content A` trỏ CloudFront-US (location US), CloudFront-EU (location EU), CloudFront-AP (location Asia Pacific). Client US → US edge.',
    '**Multivalue Answer**: Tạo record `svc A` multivalue answer trỏ 3 IP EC2 (mỗi IP có health check riêng). DNS trả về tối đa 8 IP healthy ngẫu nhiên — client-side load balancing.',
    'Kết hợp: `api` dùng Weighted + Failover (primary weight 100, secondary weight 0, health check trên primary). Khi primary unhealthy, weight secondary tự động thành 100.'
  ],
  verify: [
    '`aws route53 list-resource-record-sets --hosted-zone-id ZXXX` hiển thị records với `SetIdentifier`, `Weight`, `Region`, `Failover`, `GeoLocation`, `MultiValueAnswer` đúng.',
    '`aws route53 list-health-checks` health check state `Healthy`/`Unhealthy` khớp với trạng thái endpoint.',
    '`dig +short www.lab.example.com` / `dig +short api.lab.example.com` / `dig +short app.lab.example.com` trả kết quả theo policy đã cấu hình.'
  ],
  cost: 'Hosted zone 0.50 USD/tháng. Record 0.40 USD/triệu/tháng (first 1B free). Health check 0.50 USD/tháng/check. Lab vài USD/tháng. Dọn dẹp: xoá record, health check, hosted zone (nếu tạo mới).',
  examTip: `### Bẫy đề thi
- **Alias record chỉ dùng cho AWS resource** (ALB, CloudFront, S3 website, API Gateway, VPC endpoint). Không trỏ IP tĩnh hoặc domain ngoài AWS (dùng CNAME hoặc A record thường).
- **Failover cần health check**: không health check thì không biết primary down. Health check interval 30s (standard) hoặc 10s (fast) — TTL record nên thấp (60s) để failover nhanh.
- **Weighted ≠ Load Balancer**: Weighted DNS phân phối ở *DNS level* (client cache DNS). ALB/NLB phân phối ở *connection level*. Weighted dùng cho blue/green deploy, canary release, multi-region active-active.
- **Latency based routing**: dựa trên đo latency từ edge location Route 53 đến region AWS, **không phải** location của client. Client ở Singapore có thể resolve us-east-1 nếu latency edge Singapore→us-east-1 < Singapore→ap-southeast-1 (hiếm).
- **Geoproximity vs Geolocation**: Geolocation = map location → endpoint (cố định). Geoproximity = bias traffic theo khoảng cách + bias value (linh hoạt hơn, dùng Traffic Flow).
- **Multivalue Answer**: trả tối đa 8 IP healthy. Client tự retry IP khác nếu fail. Không phải load balancer thật — dùng cho service discovery đơn giản, không cần ALB.`,
  ref: ['lab-051-route-53-public-hosted-zone', 'lab-052-route-53-private-hosted-zone', 'lab-053-private-hosted-zone-association', 'lab-059-route-53-weighted-va-failover'],
},
{
  id: 'awslab-network-011',
  category: 'network',
  title: 'CloudFront & Global Accelerator',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2', 'dop-d3'],
  services: ['CloudFront', 'Global Accelerator', 'S3', 'ALB', 'WAF', 'Route 53'],
  goal: 'Sau lab này bạn phân biệt CloudFront (L7, cache, edge compute) vs Global Accelerator (L4, anycast IP, TCP/UDP), biết kết hợp chúng cho performance + security tối ưu.',
  steps: [
    'Tạo S3 bucket static website (hoặc ALB) làm origin.',
    '**CloudFront**: Tạo distribution `aws cloudfront create-distribution --origin-domain-name my-bucket.s3.ap-southeast-1.amazonaws.com --default-root-object index.html --enabled --origin-access-control-id oac-xxx`.',
    'Cấu hình **Cache Behavior**: default (`/*`) cache TTL 86400s; `/api/*` CachingDisabled (forward all headers, query strings); `/static/*` cache TTL 31536000s (immutable assets).',
    'Bật **Origin Failover**: tạo Origin Group (primary S3 bucket, secondary S3 bucket cross-region). CloudFront tự failover khi primary trả 4xx/5xx.',
    'Gắn **WAF Web ACL** vào distribution: rate limit 2000 req/5min/IP, block SQLi/XSS managed rule group.',
    '**Global Accelerator**: Tạo accelerator `aws globalaccelerator create-accelerator --name lab-ga --ip-address-type IPV4 --enabled`.',
    'Tạo listener TCP 80/443 forward đến endpoint group: ALB (us-east-1) weight 50, ALB (ap-southeast-1) weight 50. Health check HTTP 200.',
    'Tạo **Custom Routing Accelerator** (nâng cao): map static anycast IP → EC2 instance IP (cho gaming, VoIP, UDP).',
    'Test: `curl -w "%{time_total}" -o /dev/null -s https://dxxx.cloudfront.net` vs `curl -w "%{time_total}" -o /dev/null -s https://alb-xxx.elb.amazonaws.com` → CloudFront nhanh hơn nhờ edge cache + TLS termination tại edge.'
  ],
  verify: [
    '`aws cloudfront get-distribution --id EXXX` state `Deployed`, `Enabled`, cache behaviors đúng, origin group có `FailoverCriteria`.',
    '`aws globalaccelerator describe-accelerator --accelerator-arn arn:aws:globalaccelerator::111122223333:accelerator/xxx` state `DEPLOYED`, 2 static IP, endpoint group healthy.',
    'Header response: `x-cache: Hit from cloudfront` (cached) hoặc `Miss from cloudfront`. Global Accelerator: client thấy anycast IP, traceroute ít hop hơn.'
  ],
  cost: 'CloudFront: request 0.0075 USD/10k (HTTPS), data transfer out 0.085 USD/GB (first 10 TB). Global Accelerator: 0.025 USD/giờ/accelerator + 0.015 USD/GB data transfer (premium tier). WAF: 1 USD/web ACL/tháng + 0.60 USD/rule/tháng. Lab ~5-10 USD/tháng. Dọn dẹp: disable→delete distribution, delete WAF ACL, delete accelerator, endpoint group, listener.',
  examTip: `### Bẫy đề thi
- **CloudFront = Layer 7 (HTTP/HTTPS)**, cache, Lambda@Edge/CloudFront Functions, WAF. **Global Accelerator = Layer 4 (TCP/UDP)**, anycast IP, no cache, dùng cho non-HTTP (gaming, IoT, VoIP) hoặc cần static IP.
- **CloudFront + Global Accelerator kết hợp**: GA anycast IP → ALB/NLB → CloudFront (origin) → S3. GA tối ưu network path đến ALB, CF tối ưu content delivery. Đề "global users, low latency, TCP + HTTP" → dùng cả 2.
- **Origin Access Control (OAC)** thay thế OAI (legacy). OAC hỗ trợ tất cả origin type, sigv4 signing. Bucket policy cho phép {{cloudfront.amazonaws.com}} principal.
- **Cache key**: mặc định cache bằng host + path + query string. Cần include header (Authorization, Cookie) → cache policy custom. Đề "user-specific content" → không cache hoặc cache bằng cookie.
- **Price class**: PriceClass_All (mặc định), PriceClass_200 (loại bỏ region đắt), PriceClass_100 (chỉ US/EU). Đề "chi phí thấp, user chủ yếu US/EU" → PriceClass_100.
- **Signed URL / Signed Cookie**: private content (video, paid). Signed URL cho 1 file, Signed Cookie cho nhiều file (HLS/DASH).`,
  ref: ['lab-060-cloudfront-va-global-accelerator'],
},
{
  id: 'awslab-network-012',
  category: 'network',
  title: 'VPC Flow Logs & Network Monitoring',
  level: 'senior',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d3', 'dop-d4', 'dop-d5'],
  services: ['VPC Flow Logs', 'CloudWatch Logs', 'Athena', 'Reachability Analyzer', 'Traffic Mirroring'],
  goal: 'Sau lab này bạn biết bật Flow Logs (capture accept/reject), gửi CloudWatch Logs/S3, query bằng Athena, và dùng Reachability Analyzer/Traffic Mirroring để troubleshoot network production.',
  steps: [
    'Tạo CloudWatch Log Group: `aws logs create-log-group --log-group-name /aws/vpc/flowlogs`.',
    'Tạo IAM role cho Flow Logs delivery: trust `vpc-flow-logs.amazonaws.com`, policy `logs:CreateLogStream`, `logs:PutLogEvents` trên log group.',
    'Bật Flow Logs cho VPC: `aws ec2 create-flow-logs --resource-type VPC --resource-ids vpc-xxx --traffic-type ALL --log-destination-type cloud-watch-logs --log-group-name /aws/vpc/flowlogs --deliver-logs-permission-arn arn:aws:iam::111122223333:role/flowlogs-role --tag-specifications "ResourceType=vpc-flow-log,Tags=[{Key=Name,Value=lab-flowlogs}]"`.',
    '(Tuỳ chọn) Bật Flow Logs cho subnet/ENI cụ thể để giảm volume log.',
    'Tạo **Athena table** trên log group (hoặc export S3 → Athena): partition theo `year`, `month`, `day`. Query mẫu: `SELECT srcaddr, dstaddr, action, count(*) FROM flowlogs WHERE action = \'REJECT\' GROUP BY 1,2,3 ORDER BY 4 DESC LIMIT 20`.',
    'Dùng **Reachability Analyzer**: tạo analysis từ ENI EC2 private đến ENI RDS, protocol TCP 3306. Kết quả: `REACHABLE` hoặc `NOT_REACHABLE` với chi tiết hop (SG, NACL, route table).',
    '(Nâng cao) **Traffic Mirroring**: tạo mirror session từ ENI EC2 app → NLB (target: packet capture tool). Filter: TCP port 8080. Dùng để deep packet inspection khi Flow Logs không đủ (payload, TLS handshake).'
  ],
  verify: [
    '`aws ec2 describe-flow-logs --flow-log-ids fl-xxx` state `ACTIVE`, `LogDestinationType: cloud-watch-logs`, `TrafficType: ALL`.',
    'CloudWatch Logs: log stream xuất hiện, dòng log format: `version account-id interface-id srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status`.',
    'Athena query trả về top REJECT traffic (ví dụ: port 22 bị SG chặn, port 3306 bị NACL chặn).',
    'Reachability Analyzer: analysis `SUCCEEDED`, verdict `REACHABLE`/`NOT_REACHABLE`, explanation liệt kê component chặn.'
  ],
  cost: 'Flow Logs ingestion CloudWatch: 0.50 USD/GB. S3 delivery: 0.01 USD/GB + S3 storage. Athena: 5 USD/TB scanned. Reachability Analyzer: 0.10 USD/analysis. Traffic Mirroring: 0.015 USD/giờ/ENI + 0.01 USD/GB. Lab ~1-2 USD. Dọn dẹp: xoá flow logs, log group, IAM role, Athena table, reachability analysis, mirror session/filter/target.',
  examTip: `### Bẫy đề thi
- **Traffic type**: {{ACCEPT}} (mặc định), {{REJECT}}, {{ALL}}. Đề "debug security group block" → cần {{REJECT}} hoặc {{ALL}}. Chỉ bật {{ACCEPT}} sẽ không thấy packet bị drop.
- **Log destination**: CloudWatch Logs (dễ query, tốn tiền ingest), S3 (rẻ, query bằng Athena), Kinesis Data Firehose (real-time streaming). Production hay dùng S3 + Athena partition.
- **Flow Logs không capture**: traffic đến Amazon DNS ({{169.254.169.253}}), Windows license activation, instance metadata, traffic giữa ENI cùng subnet (local routing), traffic đã bị drop bởi **security group** trước khi đến ENI (SG drop không log ở ENI level — log ở SG level cần VPC Flow Logs với {{pkt-srcaddr}}/{{pkt-dstaddr}}).
- **Reachability Analyzer** phân tích *control plane* (route table, SG, NACL, TGW, peering, VPN) — không gửi packet thật. Phát hiện misconfiguration nhanh. Không thay thế packet capture.
- **Traffic Mirroring** cần **GENEVE** encapsulation (UDP 6081). Target phải là NLB (UDP listener) → backend là EC2/container chạy tool capture (tcpdump, Zeek, Suricata). Dùng cho deep inspection, forensics.
- **Athena partition**: partition theo {{year/month/day}} + {{account-id}} + {{region}} để giảm data scanned. Đề "query flow logs cheap" → partition + columnar (Parquet) via Firehose conversion.`,
  ref: ['lab-017-vpc-flow-co-ban', 'lab-088-vpc-flow-logs', 'lab-090-network-monitoring-voi-reachability-analyzer', 'lab-089-traffic-mirroring'],
},
{
  id: 'awslab-rds-001',
  category: 'rds',
  title: 'Multi-AZ Instance vs Read Replica: HA (High Availability) và scale đọc',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'sap-d3', 'dop-d3'],
  services: ['RDS', 'Multi-AZ', 'Read Replica'],
  goal: 'Sau lab này bạn phân biệt rõ Multi-AZ (HA — High Availability, tính sẵn sàng cao: hệ thống vẫn chạy khi một máy/AZ hỏng) và Read Replica (bản sao chỉ đọc để chia tải đọc). Bạn hiểu vì sao Multi-AZ không giúp scale đọc và Read Replica không phải cơ chế failover tự động, từ đó chọn đúng kiến trúc cho bài thi và production.',
  steps: [
    'Chuẩn bị: một VPC có ít nhất 2 subnet ở 2 AZ khác nhau và một DB subnet group gồm các subnet đó. Hiểu khái niệm AZ (Availability Zone — một cụm trung tâm dữ liệu riêng biệt trong một Region).',
    'Tạo RDS instance nguồn (source) ở chế độ Single-AZ để quan sát khác biệt: chọn engine PostgreSQL hoặc MySQL, instance class nhỏ (ví dụ db.t3.micro cho lab), storage gp3, tắt Public access. Ghi lại endpoint (địa chỉ DNS để ứng dụng kết nối).',
    'Bật Multi-AZ: Modify instance → chọn Multi-AZ deployment (DB instance). AWS sẽ tạo standby (máy chờ) ở AZ khác và đồng bộ dữ liệu đồng thời (synchronous replication — ghi xong ở cả primary và standby mới xác nhận thành công). Quan sát trạng thái modifying.',
    'Kiểm tra endpoint: dù có standby, ứng dụng vẫn dùng **một** endpoint DNS duy nhất. Khi failover, AWS cập nhật DNS để trỏ sang standby được promote (nâng lên làm primary).',
    'Tạo Read Replica: từ instance nguồn chọn Create read replica, đặt ở cùng Region (hoặc khác Region nếu muốn DR — Disaster Recovery, khôi phục sau thảm hoạ). Replica dùng asynchronous replication (bất đồng bộ — primary ghi xong trước, dữ liệu được chép sang replica sau một độ trễ gọi là replica lag).',
    'Lấy endpoint của replica (khác endpoint nguồn). Trong ứng dụng Java, cấu hình: các truy vấn ghi (INSERT/UPDATE/DELETE) đi vào endpoint nguồn, truy vấn đọc (SELECT) nặng có thể trỏ endpoint replica. Đây là pattern scale đọc, không phải HA tự động.',
    'Quan sát ReplicaLag trong CloudWatch (dịch vụ giám sát metric/log của AWS). Gây tải ghi nhẹ trên nguồn và xem lag thay đổi để hiểu dữ liệu trên replica có thể trễ vài giây.',
    'Thử promote Read Replica (Actions → Promote): replica trở thành instance độc lập có thể ghi. Lưu ý: promote phá vỡ quan hệ replication và không tự cập nhật connection string của ứng dụng.',
    'Dọn dẹp: xoá Read Replica, chuyển instance về Single-AZ (hoặc xoá hẳn) để tránh phát sinh phí.'
  ],
  verify: [
    'Console RDS hiển thị instance nguồn trạng thái Available, Multi-AZ = Yes; tab Configuration có Secondary AZ khác primary.',
    'Read Replica hiển thị trạng thái Available, cột Replication source trỏ về instance nguồn; CloudWatch metric ReplicaLag có giá trị (thường gần 0 khi tải thấp).',
    'Kết nối thử: ghi dữ liệu vào endpoint nguồn thấy thành công; ghi vào endpoint replica bị từ chối (read-only) trước khi promote.'
  ],
  cost: 'Multi-AZ gần như nhân đôi chi phí instance và storage do chạy standby song song. Read Replica tính tiền như một instance riêng (compute + storage) và có phí truyền dữ liệu cross-AZ/cross-Region. Bước dọn dẹp bắt buộc: xoá mọi Read Replica, tắt Multi-AZ hoặc xoá instance, xoá snapshot thủ công không dùng để dừng tính phí lưu trữ.',
  examTip: `### Bẫy đề thi
- **Multi-AZ = HA, không scale đọc**: standby không phục vụ truy vấn đọc. Đề hỏi "giảm tải đọc cho primary" → Read Replica, không phải Multi-AZ.
- **Failover tự động**: chỉ Multi-AZ (hoặc Aurora) tự failover. Read Replica thường (trừ Aurora replica trong cluster) phải promote thủ công; ứng dụng phải đổi endpoint.
- **RPO/RTO**: Multi-AZ synchronous cho RPO (Recovery Point Objective — lượng dữ liệu tối đa có thể mất, tính theo thời gian) gần 0; RTO (Recovery Time Objective — thời gian khôi phục dịch vụ) thường 1–2 phút do DNS failover. Replica bất đồng bộ có thể mất dữ liệu chưa kịp replicate nếu promote sau sự cố.
- **Cross-Region Read Replica**: dùng cho DR và đưa dữ liệu gần user vùng khác; chịu phí data transfer liên Region và replica lag cao hơn.
- **Đề hay gài**: "cần vừa HA vừa scale đọc" → Multi-AZ cho primary + thêm Read Replica cho đọc.`,
  ref: ['lab-031-single-az-va-multi-az-db-instance', 'lab-034-tao-read-replica', 'lab-039-read-scaling-va-replica-lag', 'lab-040-thiet-ke-rds-high-availability-production'],
},
{
  id: 'awslab-rds-002',
  category: 'rds',
  title: 'Aurora Cluster: writer/reader endpoint và custom endpoint',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'sap-d3', 'dop-d3'],
  services: ['RDS', 'Aurora'],
  goal: 'Sau lab này bạn hiểu kiến trúc Aurora (storage tách khỏi compute, tự nhân bản 6 bản trên 3 AZ), phân biệt cluster endpoint (writer), reader endpoint (load-balance đọc) và custom endpoint (gom nhóm instance theo mục đích). Đây là kiến thức rất hay ra đề SAP về database hiện đại trên AWS.',
  steps: [
    'Khái niệm: Amazon Aurora là engine cơ sở dữ liệu tương thích MySQL/PostgreSQL do AWS xây dựng, tách lớp lưu trữ (storage layer) dùng chung cho cả cluster khỏi các instance compute. Storage tự tăng tới 128 TiB và ghi 6 bản dữ liệu qua 3 AZ.',
    'Tạo Aurora cluster (chọn Aurora PostgreSQL hoặc MySQL): một writer instance và ít nhất một reader instance ở AZ khác. Đặt trong DB subnet group multi-AZ.',
    'Xác định các endpoint: (1) Cluster (writer) endpoint — luôn trỏ tới writer hiện tại, dùng cho ghi và đọc cần nhất quán mạnh; (2) Reader endpoint — DNS load-balance kết nối đọc qua các reader; (3) Instance endpoint — trỏ tới từng instance cụ thể (thường dùng debug, tránh dùng cho app).',
    'Cấu hình ứng dụng: luồng ghi dùng cluster endpoint; luồng báo cáo/đọc nặng dùng reader endpoint. Trong Spring Boot có thể tách DataSource đọc/ghi (routing datasource) để tận dụng.',
    'Tạo Custom endpoint: ví dụ gom 1 reader cấu hình mạnh cho báo cáo (analytics) tách khỏi reader phục vụ API. Khi custom endpoint tồn tại, reader endpoint mặc định có thể loại trừ các instance đã gán custom (tuỳ cấu hình).',
    'Thử scale đọc: thêm Aurora Replica (mất vài phút) và quan sát reader endpoint tự đưa instance mới vào pool. Replica Aurora thường có lag rất thấp (vài ms đến giây) do dùng chung storage.',
    'Thử failover: chọn Failover trên cluster. Writer hiện tại bị thay bằng một reader (thường 30 giây hoặc nhanh hơn). Kiểm tra cluster endpoint trỏ sang writer mới, ứng dụng cần cơ chế retry kết nối.',
    'Dọn dẹp: xoá custom endpoint, xoá reader, xoá cluster (chọn bỏ tạo final snapshot nếu chỉ là lab) và xoá subnet group không dùng.'
  ],
  verify: [
    'Console Aurora hiển thị cluster với 1 Writer và >=1 Reader, trạng thái Available; tab Connectivity liệt kê cluster, reader và custom endpoint.',
    'Lệnh CLI: {{aws rds describe-db-cluster-endpoints --db-cluster-identifier <cluster-id>}} trả về các endpoint với trường EndpointType (WRITER, READER, CUSTOM).',
    'Sau failover, vai trò Writer chuyển sang instance khác; ứng dụng kết nối lại qua cluster endpoint thành công sau khi retry.'
  ],
  cost: 'Aurora tính phí theo instance-hour, I/O (tuỳ cấu hình Standard/I-O Optimized), storage GB-tháng và backup vượt mức miễn phí. Nhiều reader và lab kéo dài sẽ đội chi phí nhanh. Bước dọn dẹp bắt buộc: xoá toàn bộ instance trong cluster rồi xoá cluster, xoá snapshot thủ công, xoá custom endpoint và parameter group không dùng.',
  examTip: `### Bẫy đề thi
- **Failover nhanh hơn RDS thường**: Aurora promote reader dùng chung storage nên thường < 30s; RDS Multi-AZ dùng standby riêng, thường 60–120s.
- **Reader endpoint không dùng cho ghi**: ghi phải đi cluster (writer) endpoint. Đề gài đưa reader endpoint cho thao tác write → lỗi.
- **Custom endpoint**: dùng khi cần tách workload (ví dụ reporting vs OLTP — Online Transaction Processing, xử lý giao dịch nghiệp vụ). Instance có thể thuộc nhiều custom endpoint.
- **Replica lag**: Aurora thường thấp hơn RDS nhờ shared storage, nhưng vẫn cần theo dõi khi báo cáo yêu cầu dữ liệu mới nhất tuyệt đối.
- **Tối đa**: một Aurora cluster hỗ trợ tới 15 Aurora Replicas (con số có thể thay đổi theo thời điểm, không chắc thì nêu "nhiều replica").`,
  ref: ['lab-041-tao-aurora-mysql-cluster', 'lab-043-aurora-cluster-reader-va-custom-endpoint', 'lab-045-aurora-replica-auto-scaling', 'lab-037-writer-reader-va-replica-endpoints'],
},
{
  id: 'awslab-rds-003',
  category: 'rds',
  title: 'Aurora Global Database: DR (Disaster Recovery) đa Region và switchover',
  level: 'senior',
  minutes: 55,
  exams: ['sap-c02'],
  domains: ['sap-d1', 'sap-d3', 'sap-d4'],
  services: ['RDS', 'Aurora', 'Aurora Global Database'],
  goal: 'Sau lab này bạn hiểu Aurora Global Database: một primary Region phục vụ ghi, tối đa nhiều secondary Region chỉ đọc với độ trễ replicate thường dưới 1 giây, và cách switchover/failover khi Region gặp sự cố. Kỹ năng quan trọng cho câu hỏi DR và thiết kế toàn cầu trong SAP-C02.',
  steps: [
    'Khái niệm: Aurora Global Database trải storage layer qua nhiều Region. DR (Disaster Recovery) là khả năng khôi phục hệ thống sau thảm hoạ (Region outage). RPO mục tiêu thường < 1 giây, RTO thường < 1 phút khi chuyển Region (con số tham khảo, phụ thuộc kịch bản).',
    'Điều kiện: tạo Aurora cluster (MySQL hoặc PostgreSQL phiên bản hỗ trợ Global Database) ở primary Region. Đảm bảo engine version tương thích tính năng global.',
    'Tạo Global Database: từ cluster chọn Add Region (hoặc Add AWS Region). Chọn secondary Region gần user mục tiêu, cấu hình DB subnet group và ít nhất một reader instance ở secondary.',
    'Quan sát: primary Region có writer + reader; secondary Region chỉ có reader và nhận dữ liệu replicate từ primary. Ứng dụng tại secondary đọc local để giảm độ trễ (latency — thời gian trễ mạng).',
    'Theo dõi metric AuroraGlobalDBReplicationLag (CloudWatch) ở secondary để đánh giá RPO thực tế. Ghi dữ liệu ở primary và kiểm tra thời gian xuất hiện ở secondary.',
    'Thực hành switchover có kế hoạch (planned, ví dụ bảo trì/drill): thao tác managed planned failover/switchover để đổi secondary thành primary. Đây là cách kiểm thử DR không mất dữ liệu ngoài cửa sổ dự kiến.',
    'Hiểu unplanned failover (Region primary thật sự sự cố): detach secondary và promote. Có thể mất dữ liệu trong khoảng lag chưa replicate (RPO > 0). Ứng dụng phải đổi endpoint sang Region mới (thường kết hợp Route 53).',
    'Dọn dẹp: gỡ secondary cluster khỏi global database rồi xoá, sau đó xoá primary cluster và global database. Xoá snapshot thủ công nếu có.'
  ],
  verify: [
    'Console RDS → Global databases hiển thị một global cluster với 1 primary và >=1 secondary Region, trạng thái Available.',
    'CloudWatch ở secondary Region có metric AuroraGlobalDBReplicationLag; giá trị nhỏ khi tải bình thường.',
    'Sau switchover, vai trò primary chuyển sang Region đích và cluster endpoint ghi hoạt động tại Region mới.'
  ],
  cost: 'Global Database tính phí instance ở mỗi Region, storage replicate, và đặc biệt data transfer liên Region (replicated write I/O) — chi phí lớn khi bật lâu. Bước dọn dẹp bắt buộc: xoá secondary cluster trước, rồi primary cluster và global database; xoá snapshot thủ công để tránh phí lưu trữ liên tục.',
  examTip: `### Bẫy đề thi
- **Mục tiêu chính**: low-latency global reads và fast disaster recovery cross-Region. Không nhầm với Read Replica thường (replica thường cross-Region lag cao hơn và RTO/RPO kém hơn mục tiêu global database).
- **Switchover vs Failover**: switchover (planned) dùng cho drill/bảo trì, hạn chế mất dữ liệu; unplanned failover dùng khi Region down, chấp nhận RPO theo lag.
- **So sánh với cross-Region Read Replica RDS**: Global Database replicate ở tầng storage, nhanh và hiệu quả hơn; phù hợp khi đề yêu cầu RTO/RPO rất thấp toàn cầu.
- **Endpoint**: mỗi Region có endpoint riêng; cần chiến lược DNS (Route 53 failover/latency) để ứng dụng chuyển Region khi sự cố.
- **Không phải multi-master ghi đồng thời nhiều Region** (trừ tính năng đặc thù khác); mặc định một writer toàn cầu tại primary Region.`,
  ref: ['lab-046-aurora-global-database', 'lab-047-aurora-global-switchover-va-failover', 'lab-093-aurora-global-database-dr'],
},
{
  id: 'awslab-rds-004',
  category: 'rds',
  title: 'Backup tự động và PITR (Point-In-Time Recovery) trên RDS/Aurora',
  level: 'mid',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d3', 'dop-d3'],
  services: ['RDS', 'Aurora', 'Automated Backup'],
  goal: 'Sau lab này bạn cấu hình được automated backup (sao lưu tự động), hiểu backup window/retention (thời gian giữ bản sao lưu) và thực hiện PITR (Point-In-Time Recovery — khôi phục về một thời điểm cụ thể) để cứu dữ liệu sau lỗi do con người như xoá nhầm bảng.',
  steps: [
    'Khái niệm: Automated backup là tính năng RDS/Aurora tự chụp snapshot hàng ngày và lưu transaction log liên tục, cho phép khôi phục về bất kỳ giây nào trong khoảng retention. PITR tạo ra **một instance/cluster mới** từ bản sao lưu, không ghi đè instance đang chạy.',
    'Kiểm tra/đặt Backup retention period > 0 (ví dụ 7 ngày). Nếu đặt 0, automated backup bị tắt và không thể PITR. Chọn Backup window (khung giờ sao lưu) tránh giờ cao điểm.',
    'Hiểu Maintenance window (khung bảo trì vá lỗi) tách biệt với backup window để không chồng chéo tác vụ nặng.',
    'Tạo dữ liệu mẫu: tạo bảng, chèn vài dòng, ghi nhớ thời điểm T1. Sau đó thực hiện một thay đổi "xấu" (ví dụ xoá nhầm dữ liệu) và ghi nhớ thời điểm T2 xảy ra lỗi.',
    'Thực hiện Restore to point in time: chọn instance → Actions → Restore to point in time → chọn thời điểm ngay trước T2 (Latest restorable time là mốc muộn nhất có log). Đặt định danh cho instance mới.',
    'Chờ instance khôi phục Available. Kết nối vào instance mới và xác nhận dữ liệu tại thời điểm chọn (trước lỗi) còn nguyên; dữ liệu sau mốc đó không có.',
    'So sánh với restore từ snapshot thủ công: snapshot là ảnh tại một thời điểm cố định, PITR linh hoạt hơn trong cửa sổ retention.',
    'Dọn dẹp: xoá instance khôi phục dùng cho lab, đặt lại retention theo nhu cầu thực tế, xoá snapshot thủ công phát sinh nếu không cần.'
  ],
  verify: [
    'Console hiển thị Latest restorable time cập nhật liên tục khi automated backup bật; retention period đúng giá trị đã đặt.',
    'Sau restore, một instance mới xuất hiện với endpoint riêng, trạng thái Available, dữ liệu phản ánh đúng thời điểm đã chọn.',
    'CloudWatch/Events (nếu cấu hình) ghi nhận sự kiện backup/restore; kiểm tra không còn instance lab thừa.'
  ],
  cost: 'Dung lượng automated backup trong giới hạn bằng kích thước DB thường được miễn phí (tuỳ loại), vượt mức và snapshot thủ công tính phí GB-tháng. Instance khôi phục mới tính phí compute + storage như instance thường. Bước dọn dẹp bắt buộc: xoá instance/cluster được restore sau khi kiểm tra và xoá snapshot thủ công không cần để tránh phí kéo dài.',
  examTip: `### Bẫy đề thi
- **PITR tạo tài nguyên mới**: endpoint thay đổi, ứng dụng phải trỏ sang instance mới sau khi xác nhận dữ liệu. Không có "rollback tại chỗ".
- **Retention = 0**: tắt automated backup, mất khả năng PITR. Đề yêu cầu "khôi phục về 5 phút trước" → cần automated backup bật và thời điểm nằm trong retention.
- **RPO phụ thuộc log**: có thể mất tối đa vài phút gần nhất nếu log chưa kịp upload trong sự cố hạ tầng (hiếm), nhưng nhìn chung PITR cho RPO rất thấp trong cửa sổ hỗ trợ.
- **Backup window**: có thể ảnh hưởng nhẹ I/O (đặc biệt Single-AZ). Multi-AZ thường snapshot từ standby nên giảm ảnh hưởng lên primary.
- **Aurora**: cơ chế continuous backup tương tự, PITR cũng tạo cluster mới; Aurora backtrack (MySQL) là cơ chế khác, quay lui nhanh trong cùng cluster nhưng không thay thế backup/DR đầy đủ.`,
  ref: ['lab-051-rds-automated-backup-va-retention', 'lab-009-maintenance-window-va-backup-window', 'lab-060-backup-restore-runbook-rpo-va-rto'],
},
{
  id: 'awslab-rds-005',
  category: 'rds',
  title: 'Snapshot thủ công, copy cross-Region và chia sẻ cross-account',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d3', 'sap-d4'],
  services: ['RDS', 'Snapshot', 'KMS'],
  goal: 'Sau lab này bạn biết tạo snapshot thủ công (manual snapshot — bản chụp lưu lâu dài do bạn quản lý), copy sang Region khác để DR, và chia sẻ snapshot cho account khác một cách an toàn. Đây là mảng hay gặp trong đề DR, migration và bảo mật dữ liệu.',
  steps: [
    'Khái niệm: Snapshot thủ công tồn tại đến khi bạn tự xoá (khác automated backup bị xoá theo retention/ khi xoá instance). Dùng để lưu mốc trước thay đổi lớn, clone môi trường, hoặc copy đi nơi khác.',
    'Tạo manual snapshot từ instance đang Available: Actions → Take snapshot, đặt tên rõ ràng (ví dụ pre-upgrade-2026). Chờ trạng thái Available.',
    'Copy snapshot sang Region khác (DR): chọn snapshot → Copy snapshot → chọn Destination Region, đặt tên mới. Nếu snapshot được mã hoá bằng KMS (Key Management Service — dịch vụ quản lý khoá mã hoá của AWS), bạn phải chọn KMS key tại Region đích (mỗi Region có key riêng).',
    'Chia sẻ snapshot cho account khác (ví dụ tách môi trường dev/prod hoặc chia sẻ dữ liệu): snapshot phải là manual; nếu mã hoá, cần chia sẻ KMS key cho account đích theo policy phù hợp. Chọn Share snapshot và nhập AWS account ID đích.',
    'Ở account/Region đích, thực hiện restore từ snapshot copy để tạo instance mới và xác minh dữ liệu. Kiểm tra security group, parameter group, subnet group phải tồn tại/tương thích tại đích.',
    'Hiểu rủi ro: chia sẻ snapshot chứa dữ liệu nhạy cảm cần kiểm soát chặt KMS key policy và dọn dẹp quyền sau khi dùng.',
    'Dọn dẹp: xoá snapshot copy ở Region đích, thu hồi chia sẻ, xoá snapshot thủ công nguồn nếu chỉ là lab, xoá instance restore dùng thử.'
  ],
  verify: [
    'Console liệt kê snapshot nguồn trạng thái Available; snapshot copy xuất hiện ở Region đích với trạng thái Available và (nếu có) Encrypted = Yes.',
    'Ở account đích (nếu test), snapshot được chia sẻ hiển thị trong mục Shared with me và có thể restore thành công.',
    'Lệnh CLI ví dụ: {{aws rds copy-db-snapshot --source-db-snapshot-identifier <arn-nguon> --target-db-snapshot-identifier <ten-dich> --source-region <region-nguon> --region <region-dich>}} chạy thành công khi quyền và KMS hợp lệ.'
  ],
  cost: 'Snapshot thủ công tính phí lưu trữ GB-tháng cho đến khi bị xoá; copy cross-Region tốn thêm lưu trữ ở Region đích và có thể phát sinh phí data transfer liên Region. Instance restore để kiểm tra tính phí compute/storage. Bước dọn dẹp bắt buộc: xoá mọi snapshot copy, thu hồi share, xoá snapshot thủ công và instance restore không còn dùng.',
  examTip: `### Bẫy đề thi
- **Encrypted snapshot**: không thể copy/share tuỳ ý nếu không xử lý KMS. Copy cross-Region phải dùng KMS key ở Region đích; share cross-account cần cho phép account đích dùng key.
- **Automated backup không share trực tiếp**: muốn chia sẻ/copy lâu dài thường phải tạo manual snapshot (hoặc copy từ automated theo cách hỗ trợ) rồi mới share.
- **DR cross-Region**: copy snapshot định kỳ cho RPO tính theo chu kỳ copy (phút/giờ), kém hơn Aurora Global Database. Đề hỏi RPO rất thấp đa Region → ưu tiên Global Database/replication.
- **Restore không mang theo mọi cấu hình mạng**: SG, subnet group, option group phải phù hợp môi trường đích.
- **Compliance**: snapshot chứa dữ liệu cá nhân cần mã hoá và kiểm soát truy cập chặt (least privilege).`,
  ref: ['lab-054-copy-snapshot-sang-region-khac', 'lab-055-share-manual-snapshot-cross-account', 'lab-056-encrypted-snapshot-cross-account', 'lab-091-cross-region-snapshot-dr'],
},
{
  id: 'awslab-rds-006',
  category: 'rds',
  title: 'RDS Proxy: connection pooling cho ứng dụng serverless và tăng kết nối',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'sap-d3', 'dop-d3'],
  services: ['RDS', 'Aurora', 'RDS Proxy', 'Secrets Manager', 'Lambda'],
  goal: 'Sau lab này bạn hiểu RDS Proxy (lớp proxy quản lý connection pool — tập kết nối tái sử dụng tới database) giúp giảm tình trạng cạn kiệt kết nối khi nhiều Lambda/container mở kết nối đồng thời, đồng thời tăng khả năng phục hồi khi failover. Đây là chủ đề rất hay gặp ở DOP và kiến trúc serverless trong SAP.',
  steps: [
    'Khái niệm: mỗi kết nối DB tiêu tốn RAM/CPU trên database. Lambda (hàm chạy theo sự kiện, có thể scale ra hàng trăm instance) nếu mỗi instance mở kết nối riêng sẽ gây "too many connections". Connection pooling giữ sẵn một số kết nối và chia sẻ cho các request.',
    'Chuẩn bị: một RDS hoặc Aurora database trong private subnet, security group cho phép truy cập từ nơi proxy chạy. Tạo secret trong Secrets Manager (dịch vụ lưu mật khẩu/secret an toàn) chứa username/password DB.',
    'Tạo IAM role cho RDS Proxy để đọc secret từ Secrets Manager và (nếu dùng) giải mã KMS. Cập nhật resource policy/permission cho phù hợp.',
    'Tạo RDS Proxy trên console: chọn engine, target là DB instance/cluster, chọn secret, cấu hình IAM authentication nếu cần, chọn subnet và security group. Bật TLS nếu yêu cầu bảo mật.',
    'Chờ proxy Available, lấy proxy endpoint. Cập nhật ứng dụng (ví dụ Lambda trong VPC) để kết nối tới proxy endpoint thay vì endpoint DB trực tiếp. Đảm bảo security group của DB cho phép inbound từ security group của proxy.',
    'Kiểm tra hành vi: chạy tải đồng thời (nhiều request) và quan sát metric của proxy (ClientConnections, DatabaseConnections) trong CloudWatch để thấy pooling hoạt động.',
    'Kiểm tra failover: nếu dùng với Multi-AZ/Aurora, proxy giúp giảm thời gian gián đoạn kết nối cho ứng dụng vì giữ kết nối phía client và quản lý kết nối lại phía DB. (Vẫn cần logic retry trong ứng dụng.)',
    'Dọn dẹp: cập nhật ứng dụng về trạng thái cũ nếu cần, xoá RDS Proxy, xoá secret lab, xoá IAM role/policy thừa.'
  ],
  verify: [
    'Console RDS → Proxies hiển thị proxy trạng thái Available, Target group healthy và trỏ đúng instance/cluster.',
    'Ứng dụng (Lambda/EC2) kết nối thành công qua proxy endpoint; CloudWatch metrics của proxy ghi nhận ClientConnections và DatabaseConnectionsBorrowLatency.',
    'Security group của DB chỉ cần tin cậy proxy (hoặc đúng nguồn) theo thiết kế least privilege; không mở public.'
  ],
  cost: 'RDS Proxy tính phí theo số vCPU của instance DB được gắn target (proxy capacity) theo giờ, cộng chi phí Secrets Manager và KMS nếu dùng. Bước dọn dẹp bắt buộc: xoá RDS Proxy khi không dùng, xoá secret và cấu hình thử nghiệm để tránh phí phát sinh liên tục.',
  examTip: `### Bẫy đề thi
- **Use case kinh điển**: Lambda/ứng dụng mở quá nhiều kết nối → dùng RDS Proxy để pool. Đề "serverless + RDS + too many connections" gần như luôn gợi ý RDS Proxy.
- **Failover**: Proxy giữ client connections và tái kết nối tới target mới, cải thiện RTO cảm nhận; nhưng không thay thế thiết kế Multi-AZ/Aurora.
- **Hỗ trợ engine**: RDS Proxy hỗ trợ các engine phổ biến (MySQL, PostgreSQL, SQL Server, MariaDB và Aurora tương ứng) tuỳ thời điểm; nếu đề nêu engine lạ, kiểm tra giả định cẩn thận (không bịa).
- **Bảo mật**: kết hợp Secrets Manager và IAM auth giúp tránh hard-code mật khẩu trong code/Lambda env.
- **Proxy chạy trong VPC**: ứng dụng phải có đường mạng tới proxy endpoint (subnet/security group).`,
  ref: ['lab-069-rds-proxy-connection-pooling', 'lab-080-ecs-eks-ket-noi-rds-qua-secrets-va-proxy', 'lab-128-quan-ly-connection-pool-cho-lambda-va-aurora-postgresql-bang-amazon-rds-proxy'],
},
{
  id: 'awslab-rds-007',
  category: 'rds',
  title: 'DB Parameter Group và Option Group: tinh chỉnh và tính năng bổ sung',
  level: 'mid',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d3', 'dop-d2', 'dop-d3'],
  services: ['RDS', 'Parameter Group', 'Option Group'],
  goal: 'Sau lab này bạn phân biệt Parameter Group (tập tham số cấu hình engine như max_connections, bộ nhớ) và Option Group (bật tính năng bổ sung tuỳ engine), biết tham số nào áp dụng ngay (dynamic) hay cần reboot (static), và cách quản lý thay đổi an toàn trong production.',
  steps: [
    'Khái niệm: DB Parameter Group là "bộ cấu hình" gắn vào instance/cluster để điều khiển hành vi engine. Option Group bật tính năng mở rộng (ví dụ một số plugin/tính năng tuỳ engine như Oracle options; hỗ trợ khác nhau theo engine).',
    'Không sửa parameter group mặc định: tạo custom parameter group cùng engine family (ví dụ postgres15, mysql8.0). Gắn custom group cho instance (có thể cần reboot để nhận nhóm mới tuỳ trường hợp).',
    'Tìm và chỉnh một tham số dynamic (áp dụng ngay, pending reboot = no) ví dụ tham số logging phù hợp engine; lưu và quan sát trạng thái "pending-reboot" hay "in-sync" trên instance.',
    'Tìm một tham số static (cần reboot) ví dụ tham số bộ nhớ chia sẻ tuỳ engine. Thay đổi sẽ ở trạng thái chờ; lên kế hoạch maintenance window để reboot instance an toàn (đặc biệt với Multi-AZ để giảm downtime).',
    'Tạo/cấu hình Option Group (nếu engine hỗ trợ option bạn cần): thêm option, cấu hình security group/port theo yêu cầu option. Gắn option group cho instance và kiểm tra trạng thái.',
    'Best practice: quản lý parameter/option group như cấu hình hạ tầng (IaC — Infrastructure as Code, ví dụ CloudFormation/Terraform) để môi trường dev/stage/prod nhất quán; ghi lại thay đổi trước khi tuning.',
    'Dọn dẹp: gắn lại parameter/option group mặc định nếu muốn, reboot nếu cần, xoá custom group không còn gắn vào tài nguyên nào.'
  ],
  verify: [
    'Console RDS → Parameter groups hiển thị custom group với các giá trị đã sửa; instance hiển thị Parameter group status In-sync sau khi áp dụng/reboot phù hợp.',
    'CLI: {{aws rds describe-db-parameters --db-parameter-group-name <ten-group>}} liệt kê tham số và ApplyMethod (immediate/pending-reboot).',
    'Nếu có option: Option group hiển thị option đã thêm và instance ở trạng thái Available sau khi áp dụng.'
  ],
  cost: 'Parameter group và option group bản thân không tính phí riêng, nhưng thay đổi có thể yêu cầu reboot gây gián đoạn ngắn; instance chạy trong lúc lab vẫn tính phí bình thường. Bước dọn dẹp bắt buộc: gỡ và xoá custom group lab không dùng, đảm bảo instance production không bị gắn nhầm cấu hình thử nghiệm.',
  examTip: `### Bẫy đề thi
- **Static vs Dynamic**: static parameter cần reboot; dynamic áp dụng ngay. Đề hỏi "thay đổi có downtime không" → kiểm tra loại tham số và kiến trúc (Multi-AZ reboot có failover nhưng vẫn có ảnh hưởng kết nối).
- **Parameter group gắn ở cấp nào**: RDS instance dùng DB parameter group; Aurora có DB cluster parameter group và DB parameter group (instance-level) — một số tham số chỉ có ở cấp cluster.
- **Option group**: không phải engine nào cũng có option; đừng nhầm option group với parameter group. Đề về tính năng bổ sung engine-specific → nghĩ tới option group.
- **Default group không sửa được**: luôn tạo custom để thay đổi và để rollback dễ.
- **Tuning an toàn**: thay đổi từng ít, theo dõi metric (CPU, memory, connections) sau khi áp dụng.`,
  ref: ['lab-006-db-parameter-group', 'lab-007-db-option-group', 'lab-026-sua-db-parameter-va-apply-method'],
},
{
  id: 'awslab-rds-008',
  category: 'rds',
  title: 'Mã hoá RDS (KMS, TLS) và IAM Database Authentication',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d3', 'dop-d6'],
  services: ['RDS', 'Aurora', 'KMS', 'IAM', 'Secrets Manager'],
  goal: 'Sau lab này bạn nắm ba lớp bảo vệ dữ liệu phổ biến: mã hoá at-rest bằng KMS (dữ liệu lưu trên đĩa/snapshot), mã hoá in-transit bằng TLS (mã hoá đường truyền), và IAM Database Authentication (đăng nhập DB bằng token IAM thay mật khẩu tĩnh). Đây là điểm quan trọng trong các câu hỏi bảo mật và tuân thủ.',
  steps: [
    'Khái niệm: Encryption at-rest (mã hoá khi lưu trữ) bảo vệ dữ liệu trên storage và snapshot; in-transit (mã hoá khi truyền) bảo vệ dữ liệu trên đường mạng giữa app và DB. KMS (Key Management Service) quản lý khoá mã hoá; CMK (Customer Managed Key) là khoá do bạn quản lý policy/rotation.',
    'Bật mã hoá at-rest khi tạo DB: chọn Enable encryption và chọn KMS key (mặc định aws/rds hoặc CMK). Lưu ý: không thể bật mã hoá trực tiếp cho instance không mã hoá đã tạo; cách làm là snapshot → copy snapshot có bật encryption → restore instance mới.',
    'Kiểm tra snapshot/replica: snapshot của DB mã hoá cũng được mã hoá; Read Replica thường phải cùng trạng thái mã hoá tương thích (và cần key phù hợp khi cross-Region).',
    'Bật/bắt buộc TLS: tải chứng chỉ CA của RDS (AWS cung cấp bundle) và cấu hình client/app kết nối với tham số SSL/TLS (ví dụ PostgreSQL yêu cầu sslmode=require/verify-full tuỳ mức). Có thể dùng parameter group để ép buộc SSL theo engine.',
    'Bật IAM Database Authentication: bật trên instance/cluster, tạo user DB gắn với cơ chế IAM (tuỳ engine, ví dụ PostgreSQL dùng role có quyền rds_iam), tạo IAM policy cho phép hành động rds-db:connect với resource là db-user ARN.',
    'Từ ứng dụng/CLI, sinh auth token ngắn hạn bằng {{aws rds generate-db-auth-token --hostname <endpoint> --port 5432 --username <dbuser>}} và dùng token đó làm mật khẩu khi kết nối (token có thời hạn ngắn).',
    'Dọn dẹp: tắt IAM auth nếu không cần, xoá user/policy thử nghiệm, xoá instance/snapshot mã hoá dùng cho lab để tránh phí.'
  ],
  verify: [
    'Console hiển thị Encryption enabled và KMS key ARN trên instance; snapshot tạo ra cũng có thuộc tính encrypted.',
    'Kết nối với tham số SSL thành công và (nếu cấu hình verify) xác thực được chứng chỉ; kết nối không SSL bị từ chối khi DB ép buộc TLS.',
    'Kết nối bằng IAM token thành công trong thời hạn token; IAM policy sai sẽ bị từ chối truy cập.'
  ],
  cost: 'KMS CMK có phí lưu key và phí request (mã hoá/giải mã) theo lượng sử dụng. Secrets Manager (nếu dùng kèm) tính phí per secret/tháng và per API call. Instance/snapshot mã hoá vẫn tính phí compute/storage như thường. Bước dọn dẹp bắt buộc: xoá tài nguyên DB/snapshot lab, cân nhắc xoá secret và không để policy IAM auth quá rộng.',
  examTip: `### Bẫy đề thi
- **Mã hoá sau khi tạo**: RDS không bật at-rest encryption trực tiếp trên instance cũ; phải đi qua snapshot copy có encryption rồi restore.
- **Cross-Region**: copy snapshot mã hoá sang Region khác cần chỉ định KMS key tại Region đích.
- **IAM auth**: phù hợp giảm quản lý mật khẩu tĩnh và tích hợp IAM, nhưng token ngắn hạn và có giới hạn kết nối/độ trễ sinh token; không thay thế hoàn toàn network controls.
- **TLS in-transit**: bảo mật trên đường truyền; at-rest và in-transit là hai lớp khác nhau, đề hay hỏi cần cả hai.
- **Secrets Manager**: dùng để lưu/rotate mật khẩu DB; kết hợp tốt với RDS Proxy và ứng dụng hiện đại.`,
  ref: ['lab-015-ma-hoa-rds-bang-kms-customer-managed-key', 'lab-016-bat-buoc-tls-cho-database-connection', 'lab-014-iam-database-authentication', 'lab-013-luu-database-secret-trong-secrets-manager'],
},
{
  id: 'awslab-rds-009',
  category: 'rds',
  title: 'Kiểm thử Multi-AZ Failover và ứng dụng retry kết nối',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d3', 'dop-d3', 'dop-d5'],
  services: ['RDS', 'Aurora', 'Route 53'],
  goal: 'Sau lab này bạn thực hành chủ động failover (chuyển vai primary sang standby/replica) để đo RTO thực tế, quan sát hành vi DNS endpoint, và hiểu vì sao ứng dụng bắt buộc phải có retry/backoff khi kết nối database trong môi trường HA.',
  steps: [
    'Khái niệm: Failover là quá trình chuyển vai trò primary sang node khác khi có lỗi hoặc khi bạn chủ động kiểm thử. RTO (Recovery Time Objective) là thời gian dịch vụ gián đoạn; ứng dụng không retry đúng cách sẽ kéo dài downtime dù hạ tầng đã phục hồi.',
    'Chuẩn bị: một RDS Multi-AZ hoặc Aurora cluster có >=1 reader. Tạo một bảng nhỏ và một script/app đơn giản lặp lại thao tác đọc/ghi với cơ chế retry (exponential backoff — chờ tăng dần giữa các lần thử) và log thời gian lỗi.',
    'Ghi nhận endpoint và TTL DNS (thời gian cache bản ghi DNS ở client). Nhiều driver/OS cache DNS; failover xong endpoint trỏ sang IP mới nhưng client cache cũ có thể vẫn kết nối sai trong một lúc.',
    'Thực hiện Reboot with failover (RDS) hoặc Failover (Aurora cluster): theo dõi sự kiện trong tab Logs & events. Đo thời gian từ lúc bắt đầu đến khi kết nối thành công trở lại.',
    'Quan sát ứng dụng: các kết nối đang mở sẽ bị ngắt (connection reset/timeout). Ứng dụng phải bắt exception, đóng kết nối hỏng, chờ ngắn rồi tạo kết nối mới tới cùng endpoint DNS.',
    'Kiểm tra sau failover: AZ/vai trò writer thay đổi, dữ liệu cam kết (committed) trước failover được giữ (với synchronous standby). Với Read Replica asynchronous thông thường, promote có nguy cơ mất dữ liệu chưa replicate.',
    'Dọn dẹp: dừng script tải, khôi phục cấu hình ban đầu nếu cần, xoá tài nguyên lab không dùng.'
  ],
  verify: [
    'Sự kiện RDS/Aurora ghi nhận failover started/completed; vai trò instance thay đổi đúng như mong đợi.',
    'Log ứng dụng cho thấy một giai đoạn lỗi ngắn rồi tự phục hồi sau retry; tổng downtime đo được nằm trong mức chấp nhận của thiết kế.',
    'Dữ liệu ghi trước failover vẫn truy vấn được sau khi kết nối lại (đối với Multi-AZ/Aurora chuẩn).'
  ],
  cost: 'Chủ yếu là chi phí chạy instance Multi-AZ/Aurora trong thời gian lab (cao hơn Single-AZ). Thao tác failover không tính phí riêng nhưng có thể gây gián đoạn. Bước dọn dẹp bắt buộc: xoá cluster/instance và tài nguyên phụ trợ sau khi hoàn tất kiểm thử.',
  examTip: `### Bẫy đề thi
- **Retry là bắt buộc**: HA ở tầng DB không tự sửa ứng dụng giữ connection hỏng. Đề hỏi "giảm ảnh hưởng failover cho app" → retry với backoff/jitter, dùng RDS Proxy, giảm TTL DNS hợp lý.
- **Synchronous vs asynchronous**: Multi-AZ synchronous bảo vệ dữ liệu đã commit tốt hơn khi failover; replica async có thể mất giao dịch gần nhất.
- **DNS caching**: sau failover, client phải resolve lại endpoint. Driver hiện đại thường hỗ trợ, nhưng cấu hình JVM/DNS cache cần lưu ý.
- **Planned vs unplanned**: reboot with failover là kiểm thử có chủ đích; đề DR thực tế cần runbook và giám sát (CloudWatch alarms, EventBridge).
- **Aurora thường nhanh hơn**: do shared storage, nhưng vẫn phải thiết kế app chịu gián đoạn ngắn.`,
  ref: ['lab-033-kiem-thu-multi-az-failover', 'lab-038-dns-ttl-retry-va-connection-recovery'],
},
{
  id: 'awslab-rds-010',
  category: 'rds',
  title: 'Performance Insights, Enhanced Monitoring và Database Insights',
  level: 'mid',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d3', 'dop-d4'],
  services: ['RDS', 'Aurora', 'Performance Insights', 'CloudWatch'],
  goal: 'Sau lab này bạn biết bật và đọc Performance Insights (công cụ phân tích tải DB theo wait event/SQL) cùng Enhanced Monitoring/Database Insights để tìm cổ chai (CPU, I/O, lock, câu SQL chậm). Kỹ năng cần cho vận hành và câu hỏi tối ưu hoá trong DOP/SAP.',
  steps: [
    'Khái niệm: Bottleneck (cổ chai) là điểm nghẽn làm chậm toàn hệ thống. Wait event cho biết phiên DB đang chờ gì (CPU, IO:DataFileRead, Lock:tuple...). Performance Insights trực quan hoá tải theo thời gian.',
    'Bật Performance Insights trên instance/cluster: chọn thời gian lưu giữ dữ liệu (free tier ngắn hạn hoặc trả phí giữ lâu hơn tuỳ thời điểm). Bật khi tạo mới hoặc Modify.',
    'Bật Enhanced Monitoring: chọn granularity (ví dụ 1–60 giây) và IAM role để agent gửi OS metrics (CPU, memory, process) chi tiết hơn CloudWatch tiêu chuẩn.',
    'Tìm hiểu CloudWatch Database Insights (nếu có trong Region/tài khoản): giao diện tổng hợp fleet view và phân tích hiệu năng; tính năng và cách bật có thể khác theo loại DB/Region.',
    'Tạo tải giả lập: chạy một truy vấn nặng (full scan, join lớn) hoặc dùng công cụ benchmark đơn giản từ EC2 trong cùng VPC. Quan sát Average Active Sessions (AAS) và các wait event nổi bật.',
    'Xác định top SQL: trong Performance Insights, xem câu SQL tiêu tốn tải nhiều nhất, so sánh với chỉ mục (index) và kế hoạch thực thi (EXPLAIN) ở phía ứng dụng/DBA để đề xuất tối ưu.',
    'Thiết lập CloudWatch alarm cơ bản: ví dụ CPUUtilization, DatabaseConnections, FreeableMemory hoặc ReplicaLag để cảnh báo sớm.',
    'Dọn dẹp: tắt Performance Insights/Enhanced Monitoring nếu không cần giữ lâu (để tránh phí lưu giữ), xoá alarm và tài nguyên tạo tải.'
  ],
  verify: [
    'Console RDS hiển thị Performance Insights = Enabled và dashboard load theo thời gian; có thể khoanh vùng thời điểm tải cao để xem wait event/SQL.',
    'Enhanced Monitoring hiển thị OS metrics chi tiết theo chu kỳ đã chọn; CloudWatch có log/metric tương ứng.',
    'Alarm (nếu tạo) ở trạng thái OK/ALARM đúng theo ngưỡng thử nghiệm.'
  ],
  cost: 'Performance Insights miễn phí trong mức lưu giữ ngắn mặc định ở một số cấu hình, nhưng lưu giữ dài hơn và một số tính năng nâng cao có thể tính phí; Enhanced Monitoring phát sinh log/metric; Database Insights có thể có phí theo tài nguyên giám sát. Bước dọn dẹp bắt buộc: tắt tính năng không cần, xoá alarm và dashboard thử nghiệm.',
  examTip: `### Bẫy đề thi
- **Chọn công cụ đúng triệu chứng**: CPU cao/thiếu RAM ở OS → Enhanced Monitoring; câu SQL nào gây tải/đợi gì → Performance Insights; giám sát fleet và xu hướng → CloudWatch/Database Insights.
- **Wait event**: IO cao gợi ý storage hoặc thiếu index; Lock chờ tranh chấp; CPU chờ tính toán/thiếu tài nguyên. Đề hay đưa biểu đồ wait để chọn nguyên nhân.
- **Không chỉ scale up**: đôi khi tối ưu query/index hoặc thêm Read Replica hiệu quả hơn tăng instance class.
- **Replica lag**: theo dõi khi dùng replica cho đọc; lag cao có thể do tải ghi lớn hoặc cấu hình.
- **Kết hợp**: DOP đề thường yêu cầu quan sát → chẩn đoán → hành động (alarm, runbook).`,
  ref: ['lab-061-cloudwatch-database-insights', 'lab-018-enhanced-monitoring-role', 'lab-070-load-test-va-database-bottleneck'],
},
{
  id: 'awslab-rds-011',
  category: 'rds',
  title: 'Chọn RDS/Aurora hay DynamoDB: OLTP quan hệ vs NoSQL key-value',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02'],
  domains: ['sap-d2', 'sap-d3'],
  services: ['RDS', 'Aurora', 'DynamoDB'],
  goal: 'Sau lab này bạn biết so sánh cơ sở dữ liệu quan hệ (RDS/Aurora — bảng, SQL, transaction phức tạp) với DynamoDB (NoSQL key-value/document — truy cập theo khoá với độ trễ mili-giây, scale ngang tự động) để chọn dịch vụ đúng theo mẫu truy cập, nhất quán và vận hành.',
  steps: [
    'Khái niệm: OLTP (Online Transaction Processing) là xử lý giao dịch nghiệp vụ (đặt hàng, thanh toán) thường cần join, ràng buộc, transaction ACID. NoSQL key-value phù hợp truy cập theo khoá/partition key với throughput lớn và schema linh hoạt.',
    'Phân tích yêu cầu mẫu: (A) hệ thống đơn hàng cần JOIN nhiều bảng, báo cáo SQL phức tạp, transaction mạnh → nghiêng về RDS/Aurora. (B) giỏ hàng/session, bảng tra cứu key-value, hàng triệu request/giây với độ trễ ổn định → nghiêng về DynamoDB.',
    'Tạo nhanh một bảng DynamoDB (On-Demand capacity để không phải tính RCU/WCU ban đầu) với partition key đơn giản (ví dụ pk). Thêm vài item và truy vấn bằng GetItem/Query để cảm nhận mô hình truy cập theo khoá.',
    'So sánh vận hành: RDS/Aurora bạn quản lý instance class, storage, kết nối, patch window (dù managed); DynamoDB serverless hơn về capacity (On-Demand/Auto Scaling), tự replicate multi-AZ trong Region, PITR và global tables (tuỳ chọn).',
    'So sánh tính năng: RDS/Aurora hỗ trợ SQL, index phức tạp, foreign key (tuỳ engine); DynamoDB dùng thiết kế single-table/access pattern, GSI/LSI, conditional write, transaction giới hạn theo mô hình NoSQL.',
    'Thảo luận chi phí: RDS/Aurora trả theo instance + storage + I/O; DynamoDB trả theo request/storage (On-Demand) hoặc capacity provisioned. Tải rất bùng nổ không dự đoán được thường lợi thế cho DynamoDB On-Demand.',
    'Dọn dẹp: xoá bảng DynamoDB và mọi instance RDS/Aurora tạo cho lab để tránh phí.'
  ],
  verify: [
    'Bảng DynamoDB ở trạng thái Active, có thể ghi/đọc item thành công bằng console hoặc CLI {{aws dynamodb put-item/get-item}}.',
    'Bạn lập được bảng so sánh ngắn cho bài toán mẫu: mẫu truy cập, cần JOIN/SQL không, độ trễ mục tiêu, vận hành, chi phí dự kiến.',
    'Không còn tài nguyên lab (bảng DynamoDB, DB instance) tồn tại sau khi dọn dẹp.'
  ],
  cost: 'DynamoDB On-Demand tính theo request đọc/ghi và lưu trữ (rất thấp cho lab nhỏ). RDS/Aurora tính phí theo giờ instance ngay cả khi tải thấp. Bước dọn dẹp bắt buộc: xoá bảng DynamoDB, xoá DB instance/cluster và snapshot lab để không phát sinh phí tiếp.',
  examTip: `### Bẫy đề thi
- **"Cần JOIN phức tạp, báo cáo ad-hoc"** → RDS/Aurora/Redshift tuỳ case, không phải DynamoDB như lựa chọn đầu tiên.
- **"Scale cực lớn, key-value, độ trễ ms, ít vận hành"** → DynamoDB. Đề nhấn mạnh serverless và throughput không giới hạn thực tế → DynamoDB.
- **ACID**: cả hai đều hỗ trợ transaction ở mức nhất định, nhưng mô hình khác nhau; RDS/Aurora mạnh cho transaction quan hệ truyền thống.
- **Global**: Aurora Global Database vs DynamoDB Global Tables — chọn theo mô hình dữ liệu (SQL quan hệ vs NoSQL) và yêu cầu RPO/RTO/latency.
- **Đừng chọn theo "quen"**: đề SAP kiểm tra chọn đúng công cụ theo yêu cầu phi chức năng (scale, latency, cost, ops).`,
  ref: ['lab-001-chon-rds-aurora-hay-self-managed-database', 'lab-41-tao-dynamodb-table-voi-autoscaling-hoac-on-demand-capacity', 'lab-42-bat-dynamodb-point-in-time-recovery'],
},
{
  id: 'awslab-rds-012',
  category: 'rds',
  title: 'Di trú cơ sở dữ liệu với AWS DMS: full load và CDC',
  level: 'senior',
  minutes: 55,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d4', 'dop-d1', 'dop-d3'],
  services: ['DMS', 'RDS', 'Aurora'],
  goal: 'Sau lab này bạn hiểu AWS DMS (Database Migration Service — dịch vụ di trú cơ sở dữ liệu) với replication instance, endpoint nguồn/đích, task full load (sao chép toàn bộ) và CDC (Change Data Capture — bắt thay đổi liên tục) để giảm downtime khi cắt chuyển (cutover).',
  steps: [
    'Khái niệm: di trú (migration) là chuyển dữ liệu/ứng dụng sang hệ thống mới. Homogeneous (cùng engine, ví dụ MySQL→MySQL) thường đơn giản hơn; heterogeneous (khác engine, ví dụ Oracle→PostgreSQL) thường cần SCT (Schema Conversion Tool) để đổi schema — SCT là công cụ ngoài phạm vi console DMS task nhưng hay xuất hiện trong đề.',
    'Chuẩn bị mạng: replication instance DMS cần đường mạng tới cả source và target (cùng VPC, peering, VPN/Direct Connect tuỳ kịch bản). Mở security group/NACL cho port DB tương ứng.',
    'Tạo Replication instance: chọn instance class phù hợp khối lượng dữ liệu, Multi-AZ nếu cần HA cho job dài, allocated storage đủ cho cache/log.',
    'Tạo Source endpoint và Target endpoint: khai báo loại engine, server, port, credentials, SSL. Dùng Test connection từ DMS để xác nhận kết nối và quyền cần thiết (ví dụ quyền đọc binlog/WAL cho CDC tuỳ engine).',
    'Tạo Migration task: chọn Full load, hoặc Full load + CDC (để đồng bộ thay đổi phát sinh trong lúc load), hoặc CDC only tuỳ chiến lược. Chọn bảng/schema cần di trú và rule mapping nếu cần.',
    'Chạy task và giám sát: theo dõi Table statistics (rows full load, inserts/updates/deletes CDC), latency. Xử lý lỗi (data type mismatch, constraint) và reload bảng lỗi nếu cần.',
    'Cutover: khi CDC bắt kịp (lag gần 0), dừng ghi ở source theo kế hoạch, chờ CDC áp dụng hết, xác thực dữ liệu (validation nếu dùng), rồi trỏ ứng dụng sang target.',
    'Dọn dẹp: dừng và xoá task, xoá endpoint, xoá replication instance (tính phí theo giờ), xoá DB lab nếu tạo riêng cho thử nghiệm.'
  ],
  verify: [
    'Kết quả Test endpoint connection thành công cho cả source và target; task ở trạng thái Running/Load complete tuỳ giai đoạn.',
    'Table statistics hiển thị số dòng full load khớp kỳ vọng; khi có thay đổi ở source, CDC áp dụng sang target và target latency giảm về thấp.',
    'Sau cutover thử nghiệm, ứng dụng đọc/ghi trên target cho kết quả đúng với dữ liệu đã di trú.'
  ],
  cost: 'Replication instance tính phí theo giờ theo instance class (kể cả khi idle) và storage; có thể phát sinh phí truyền dữ liệu cross-AZ/cross-Region/Internet tuỳ đường đi. RDS/Aurora nguồn/đích tính phí như thường. Bước dọn dẹp bắt buộc: xoá DMS task, endpoint, replication instance ngay sau lab vì đây là nguồn phí hay bị quên.',
  examTip: `### Bẫy đề thi
- **Minimal downtime**: dùng Full load + CDC để vừa copy nền vừa bắt thay đổi, cutover khi lag thấp. Chỉ full load thường yêu cầu downtime dài hơn.
- **SCT vs DMS**: SCT chuyển đổi schema/stored procedure khi khác engine; DMS di chuyển dữ liệu và replicate. Đề heterogeneous migration thường nhắc cả hai.
- **Nguồn CDC**: cần bật cấu hình log phù hợp trên source (ví dụ binlog MySQL, supplemental logging/archivelog tuỳ Oracle, logical replication tuỳ PostgreSQL) và quyền phù hợp.
- **Validation**: DMS có thể hỗ trợ data validation để so sánh nguồn/đích; hữu ích trước cutover nhưng cần thời gian và tài nguyên.
- **Networking**: replication instance phải reach được cả hai endpoint; đề hay gài thiếu route/SG hoặc đặt sai subnet (public/private).`,
  ref: ['lab-071-dms-homogeneous-rds-migration', 'lab-072-dms-heterogeneous-database-migration', 'lab-074-dms-full-load', 'lab-075-dms-change-data-capture', 'lab-076-dms-data-validation'],
},
);