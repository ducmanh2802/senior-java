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
);