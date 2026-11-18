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
{
  id: 'awslab-storage-001',
  category: 'storage',
  title: 'S3 Storage Class và Lifecycle: chọn lớp lưu trữ rẻ nhất',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'sap-d3'],
  services: ['S3', 'Lifecycle', 'Storage Class', 'Storage Lens'],
  goal: 'Sau lab này bạn chọn đúng storage class cho từng loại dữ liệu và viết lifecycle rule tự chuyển lớp theo tuổi/độ truy cập, biết bẫy phí retrieval và thời gian lưu tối thiểu. Đây là chủ đề tối ưu chi phí lưu trữ kinh điển của SAP-C02 (domain Continuous Improvement) và DOP.',
  steps: [
    'Hiểu 3 nhóm storage class: truy cập thường xuyên (STANDARD, INTELLIGENT_TIERING), truy cập ít (STANDARD_IA, ONEZONE_IA), lưu trữ lâu dài (GLACIER_INSTANT_RETRIEVAL, GLACIER_FLEXIBLE_RETRIEVAL, GLACIER_DEEP_ARCHIVE). Mỗi lớp có giá GB/tháng, phí truy xuất (retrieval) và thời gian lưu tối thiểu bị tính phí (ví dụ STANDARD_IA 30 ngày, GLACIER_DEEP_ARCHIVE 180 ngày).',
    'Tạo bucket: aws s3 mb s3://lab-lifecycle-001 (tên bucket phải duy nhất toàn cầu).',
    'Upload vài object mẫu: aws s3 cp file.txt s3://lab-lifecycle-001/data/ ; thử thêm một file đặt storage class STANDARD_IA bằng --storage-class STANDARD_IA.',
    'Mở S3 → bucket → tab Management → Lifecycle rules → Create rule. Rule 1: chuyển object prefix data/ sang STANDARD_IA sau 30 ngày, sang GLACIER_DEEP_ARCHIVE sau 180 ngày; bật Expiration sau 365 ngày nếu muốn tự xoá.',
    'Thêm rule thứ hai chuyển sang INTELLIGENT_TIERING ngay (lớp này tự tối ưu giữa Frequent/Infrequent/Archive tiers tuỳ cấu hình), phù hợp khi chưa biết tần suất truy cập.',
    'Bật S3 Storage Lens (miễn phí mức cơ bản) hoặc xem Cost Explorer để thấy chi phí theo bucket và theo storage class.',
    'Dọn dẹp: xoá lifecycle rule, xoá object (kể cả version nếu đã bật versioning), rồi xoá bucket.'
  ],
  verify: [
    '{{aws s3api get-bucket-lifecycle-configuration --bucket lab-lifecycle-001}} trả về Rules với Transitions (Days + StorageClass) đúng cấu hình.',
    'Console bucket → Objects cho thấy Storage class của từng object; object upload bằng --storage-class STANDARD_IA hiển thị đúng lớp.',
    'Sau khi đủ ngày (hoặc mô phỏng bằng rule ngắn), object chuyển lớp; Storage Lens/Cost Explorer phản ánh chi phí giảm.'
  ],
  cost: 'S3 tính theo GB/tháng mỗi lớp cộng phí request và phí retrieval. Glacier Flexible/Deep Archive rẻ hơn nhiều nhưng truy xuất chậm (Deep Archive ~12 giờ) và có phí retrieval. Minimum storage duration khiến xoá/chuyển sớm vẫn bị tính phí đủ ngày. Dọn dẹp: xoá lifecycle, toàn bộ object và version, rồi xoá bucket.',
  examTip: `### Bẫy đề thi
- **Lifecycle transition ≠ xoá dữ liệu**: chuyển lớp chỉ áp dụng object hiện tại và tương lai; đề "giảm chi phí mà vẫn giữ dữ liệu" → lifecycle transition, không phải xoá.
- **INTELLIGENT_TIERING không có phí retrieval riêng**: phù hợp khi không biết tần suất truy cập; STANDARD_IA/ONEZONE_IA có phí retrieval + minimum 30 ngày.
- **GLACIER_INSTANT_RETRIEVAL vs FLEXIBLE**: Instant Retrieval lấy mili-giây (như Standard-IA nhưng rẻ hơn), Flexible mất phút đến giờ. Đề "truy xuất nhanh từ archive" → chọn Instant Retrieval.
- **GLACIER_DEEP_ARCHIVE**: rẻ nhất, retrieval ~12 giờ (Standard) hoặc 48 giờ (Bulk); không hợp dữ liệu cần khôi phục nhanh.
- **Minimum storage duration**: xoá/chuyển sớm vẫn bị tính phí đủ 30/90/180 ngày tuỳ lớp.`,
  ref: ['lab-037-s3-lifecycle-qua-cac-storage-class', 'lab-044-s3-inventory-va-object-metadata', 'lab-045-s3-storage-lens-va-cost-visibility'],
},
{
  id: 'awslab-storage-002',
  category: 'storage',
  title: 'Bảo vệ dữ liệu S3: Versioning, Object Lock (WORM) và mã hoá SSE',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'dop-d6'],
  services: ['S3', 'Versioning', 'Object Lock', 'SSE-KMS'],
  goal: 'Sau lab này bạn bật versioning, hiểu delete marker và cách khôi phục object bị xoá/ghi đè, bật Object Lock (WORM — Write Once Read Many) với chế độ Governance/Compliance, và chọn đúng cơ chế mã hoá at-rest (SSE-S3, SSE-KMS, DSSE-KMS). Đây là chủ đề bảo vệ dữ liệu hay ra SAP và DOP security.',
  steps: [
    'Tạo bucket và bật versioning: aws s3api put-bucket-versioning --bucket lab-worm-002 --versioning-configuration Status=Enabled.',
    'Upload 2 lần cùng key: aws s3 cp v1.txt s3://lab-worm-002/doc.txt rồi sửa nội dung upload lại v2 → thấy 2 version.',
    'Xoá object: aws s3 rm s3://lab-worm-002/doc.txt → tạo delete marker (không mất version cũ). Liệt kê: aws s3api list-object-versions --bucket lab-worm-002.',
    'Khôi phục: xoá đúng delete marker bằng aws s3api delete-object --bucket lab-worm-002 --key doc.txt --version-id VERSION_ID_CUA_DELETE_MARKER → object cũ hiện lại.',
    'Bật Object Lock: bucket phải tạo mới với Object Lock (console: chọn Enable Object Lock; CLI: aws s3api create-bucket --bucket lab-worm-lock-002 --object-lock-enabled-for-bucket). Object Lock tự bật versioning.',
    'Đặt retention khi upload: --object-lock-mode GOVERNANCE --object-lock-retain-until-date 2026-12-31T00:00:00Z (hoặc COMPLIANCE). Thử xoá/ghi đè trước hạn → bị từ chối.',
    'Đặt mã hoá mặc định cho bucket: Properties → Default encryption → chọn SSE-S3 hoặc SSE-KMS (hoặc aws s3api put-bucket-encryption --bucket lab-worm-002 --server-side-encryption-configuration file://enc.json).',
    'Dọn dẹp: với bucket thường, xoá mọi version và delete marker rồi xoá bucket; với bucket Object Lock, chỉ xoá được sau khi hết thời gian retention.'
  ],
  verify: [
    '{{aws s3api list-object-versions --bucket lab-worm-002}} hiển thị nhiều VersionId và một DeleteMarker=true; khôi phục thành công sau khi xoá delete marker.',
    'Object Lock: thử DELETE/PUT khi còn trong thời gian retention → trả lỗi AccessDenied; COMPLIANCE không thể ghi đè kể cả root.',
    '{{aws s3api get-bucket-encryption --bucket lab-worm-002}} trả về thuật toán SSE; object mới có header x-amz-server-side-encryption.'
  ],
  cost: 'Version và object cũ vẫn tính phí lưu trữ; Object Lock giữ dữ liệu không xoá được nên đảm bảo retention không quá dài. SSE-S3 miễn phí; SSE-KMS tính phí mỗi request KMS và key. Dọn dẹp: xoá hết version (kể cả delete marker), object, rồi xoá bucket sau khi hết retention với bucket Object Lock.',
  examTip: `### Bẫy đề thi
- **Versioning ≠ backup**: versioning chống ghi đè/xoá nhầm nhưng không thay thế backup cross-region; đề "chống accidental delete" → versioning (kèm MFA delete nếu cần).
- **Object Lock cần versioning**: không thể bật Object Lock nếu chưa bật versioning; bật khi tạo bucket là chắc chắn nhất.
- **Governance vs Compliance**: Governance có thể bị ghi đè bởi user có quyền s3:BypassGovernanceRetention; Compliance không thể can thiệp kể cả root. Đề "không ai xoá được kể cả admin" → Compliance.
- **SSE-S3 vs SSE-KMS**: SSE-S3 (AES-256) miễn phí, AWS quản lý key; SSE-KMS dùng CMK, có CloudTrail audit + key policy nhưng tốn phí KMS và cần quyền kms:GenerateDataKey. Đề "cần audit ai dùng key" → SSE-KMS.
- **Delete marker là version đặc biệt**: xoá object thường không mất dữ liệu; muốn khôi phục phải xoá đúng version-id của delete marker.`,
  ref: ['lab-035-versioning-delete-marker-va-object-recovery', 'lab-038-object-lock-retention-va-legal-hold', 'lab-039-s3-sse-s3-sse-kms-va-dsse-kms'],
},
{
  id: 'awslab-storage-003',
  category: 'storage',
  title: 'S3 Replication: CRR, SRR, Replication Time Control và Multi-Region Access Point',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d3'],
  services: ['S3', 'Replication', 'KMS', 'CloudWatch'],
  goal: 'Sau lab này bạn thiết lập Cross-Region Replication (CRR) và Same-Region Replication (SRR), hiểu yêu cầu versioning + IAM role, bật Replication Time Control (RTC) cho SLA 15 phút, và biết khi nào dùng Multi-Region Access Point. Replication là chủ đề DR/đa vùng kinh điển của SAP.',
  steps: [
    'Tạo 2 bucket: source và destination ở 2 region khác nhau (CRR) hoặc cùng region (SRR), cả hai đều bật versioning. Destination có thể dùng KMS key riêng.',
    'Tạo IAM role cho replication: trust s3.amazonaws.com, policy cho phép s3:GetObjectVersionForReplication, s3:GetObjectVersionAcl, s3:ReplicateObject, s3:ReplicateDelete trên source và destination.',
    'Trên bucket source → tab Management → Replication rules → Create. Chọn apply-to-all hoặc filter theo prefix/tag, chọn destination bucket và IAM role vừa tạo.',
    'Bật Replication Time Control (RTC) trong rule: S3 cam kết SLA 15 phút cho 99.99% object, kèm CloudWatch metrics ReplicationLatency và BytesPendingReplication.',
    'Object đã tồn tại trước khi bật rule KHÔNG tự replicate: tạo S3 Batch Replication job để sao chép dữ liệu cũ; xem tuỳ chọn replicate delete marker và metadata.',
    'Test: upload object vào source, chờ vài phút, kiểm tra object xuất hiện ở destination bằng aws s3 ls s3://dest-bucket --recursive.',
    'Nâng cao: tạo Multi-Region Access Point (MRAP) gồm 2 bucket ở 2 region, dùng một endpoint toàn cầu để đọc/ghi gần nhất.',
    'Dọn dẹp: xoá replication rule, MRAP, IAM role, rồi xoá object/version ở cả 2 bucket và xoá bucket.'
  ],
  verify: [
    'Destination có object giống source (cùng key, version) sau khi upload; delete marker cũng replicate nếu bật tuỳ chọn.',
    '{{aws s3api get-bucket-replication --bucket source-bucket}} trả về Rules với ReplicationTime (RTC) và destination bucket ARN.',
    'CloudWatch metric ReplicationLatency (khi bật RTC) dưới 15 phút; endpoint MRAP truy cập được từ nhiều region.'
  ],
  cost: 'Replication tính phí data transfer liên region (OUT) cộng request PUT vào destination; RTC thường đắt hơn replication thường. Dữ liệu replicate vẫn tính phí lưu trữ ở destination. Dọn dẹp: xoá rule, MRAP, object/version ở cả 2 bucket, rồi xoá bucket và role.',
  examTip: `### Bẫy đề thi
- **Versioning bắt buộc**: không bật versioning ở source và destination thì replication không chạy. Đề hay gài quên bật versioning.
- **CRR vs SRR**: CRR cho DR/đa vùng; SRR cho tách môi trường (log/production) hoặc đồng bộ trong region. Cả hai đều cần versioning.
- **Object cũ không tự replicate**: rule chỉ áp dụng object mới; dữ liệu đã tồn tại cần S3 Batch Replication. Đề "replicate toàn bộ dữ liệu hiện có" → Batch Replication.
- **RTC SLA 15 phút**: chỉ Replication Time Control đảm bảo 15 phút cho 99.99% object; replication thường chỉ eventually consistent.
- **KMS**: nếu dùng SSE-KMS, role cần quyền kms:Decrypt/Encrypt cho cả 2 key; destination dùng key khác phải cấp quyền chéo.
- **Delete marker & metadata**: có tuỳ chọn replicate delete marker; metadata (ACL, tags) có thể cấu hình replicate.`,
  ref: ['lab-046-s3-replication-time-control', 'lab-047-cross-region-replication-voi-kms', 'lab-048-same-region-replication-va-object-ownership', 'lab-049-s3-multi-region-access-point'],
},
{
  id: 'awslab-storage-004',
  category: 'storage',
  title: 'Kiểm soát truy cập S3: Bucket policy vs ACL vs IAM + Block Public Access',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d2', 'dop-d6'],
  services: ['S3', 'IAM', 'Block Public Access', 'Object Ownership'],
  goal: 'Sau lab này bạn phân biệt identity-based policy (IAM), resource-based policy (bucket policy) và ACL (legacy), hiểu khi nào cần cả hai (cross-account), cách Block Public Access chặn public ngoài ý muốn, và Object Ownership (BucketOwnerEnforced tắt ACL). Đây là chủ đề bảo mật S3 hay ra nhất.',
  steps: [
    'Hiểu 3 lớp kiểm soát: IAM policy (gắn cho user/role), bucket policy (resource-based, JSON trên bucket), ACL (thừa kế, mỗi object/bucket, nay bị hạn chế). Cross-account cần cả IAM (bên user) và bucket policy (bên bucket) cùng cho phép.',
    'Tạo bucket, giữ Block Public Access bật (mặc định bật cho bucket mới) ở cả account và bucket level.',
    'Viết bucket policy cho phép một IAM user account khác đọc object: aws s3api put-bucket-policy --bucket lab-access-004 --policy file://policy.json (Principal = ARN user, Action s3:GetObject, Resource arn:aws:s3:::lab-access-004/*).',
    'Object Ownership: đặt BucketOwnerEnforced (ACLs disabled — mặc định mới) để chỉ bucket policy/IAM kiểm soát; thử dùng ACL → bị từ chối.',
    'Test cross-account: user kia (đã có IAM allow s3:GetObject trên bucket) đọc thành công; nếu chỉ có IAM mà thiếu bucket policy → bị deny.',
    'Thử public: đặt Principal trỏ mọi người → Block Public Access chặn (AccessDenied) trừ khi cố tình tắt BPA (không nên).',
    'Explicit deny: thêm statement Deny s3:DeleteBucket trong IAM/bucket policy để chặn hành động nhạy cảm kể cả khi policy khác allow — deny luôn thắng.',
    'Dọn dẹp: xoá bucket policy, object, rồi xoá bucket; gỡ user/role tạm nếu đã tạo.'
  ],
  verify: [
    'User khác account đọc được object khi cả IAM và bucket policy đều allow; thiếu một bên → AccessDenied.',
    '{{aws s3api get-public-access-block --bucket lab-access-004}} trả về 4 trường PublicAccessBlockConfiguration đều true.',
    '{{aws s3api get-bucket-policy-status --bucket lab-access-004}} cho biết IsPublic true/false; khi đặt BucketOwnerEnforced thì mọi request dùng ACL bị từ chối.'
  ],
  cost: 'S3 request và storage là chi phí chính; IAM/bucket policy/ACL/BPA không tính phí riêng. Dọn dẹp: xoá bucket policy, object, bucket; gỡ user/role tạm nếu tạo.',
  examTip: `### Bẫy đề thi
- **Explicit deny thắng allow**: trong IAM và bucket policy, deny luôn overrides. Đề "chặn DeleteBucket kể cả khi policy cho phép" → thêm statement Deny.
- **Cross-account cần 2 phía**: bucket policy (resource) và IAM policy (identity) phải cùng allow; thiếu một là AccessDenied.
- **ACL đã lỗi thời**: bucket mới mặc định BucketOwnerEnforced (ACLs disabled). Đề "phân quyền object" → dùng bucket policy/IAM/S3 Access Point, không dùng ACL.
- **Block Public Access 4 mức**: BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets; bật ở account + bucket, cấu hình bucket chỉ siết chặt hơn chứ không nới.
- **IAM vs bucket policy**: IAM identity-based (user/role), bucket policy resource-based (chỉ định được cả account khác, public). Đề "cho phép account khác" → bucket policy.
- **s3:GetObject vs s3:ListBucket**: GetObject cho đọc nội dung, ListBucket cho liệt kê (Resource là ARN bucket, không có /*). Đề "cho xem danh sách" → ListBucket trên ARN bucket.`,
  ref: ['lab-031-tao-s3-bucket-va-phan-tich-bucket-policy', 'lab-033-iam-policy-bucket-policy-va-acl', 'lab-032-block-public-access-va-kiem-tra-public-exposure', 'lab-009-iam-least-privilege-cho-storage'],
},
{
  id: 'awslab-storage-005',
  category: 'storage',
  title: 'Presigned URL: chia sẻ object S3 riêng tư có thời hạn',
  level: 'mid',
  minutes: 30,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'dop-d6'],
  services: ['S3', 'Presigned URL', 'IAM', 'CloudFront'],
  goal: 'Sau lab này bạn tạo presigned URL để cho user tạm thời upload/download một object trong bucket private mà không cần cấp quyền AWS, hiểu giới hạn thời hạn (tối đa 7 ngày với credential dài hạn) và khi nào nên dùng CloudFront signed URL/cookie thay thế. Rất hay ra ở phần tích hợp ứng dụng với S3.',
  steps: [
    'Tạo bucket private (Block Public Access bật), upload một object mẫu.',
    'Tạo presigned URL download bằng CLI: aws s3 presign s3://lab-presign-005/doc.txt --expires-in 900 (giây). CLI in ra URL có X-Amz-Signature và X-Amz-Expires.',
    'Mở URL trong trình duyệt hoặc curl trước khi hết hạn → tải được; đợi quá 900 giây rồi dùng lại URL cũ → bị từ chối (Request has expired).',
    'Upload bằng presigned URL: dùng SDK (getPresignedUrl với PutObject) hoặc aws s3 presign với method PUT; client PUT trực tiếp lên S3 mà không đi qua backend.',
    'Hiểu giới hạn: URL ký bằng credential IAM dài hạn tối đa 7 ngày (604800 giây); bằng temporary STS chỉ sống bằng credential (thường tối đa 12 giờ).',
    'So sánh CloudFront signed URL/cookie: khi cần bảo vệ nhiều file (HLS/DASH) hoặc CDN caching, dùng signed cookie/URL của CloudFront với trusted key group, không phải presigned S3 trực tiếp.',
    'Dọn dẹp: xoá object và bucket tạm (presigned URL không giữ tài nguyên lâu dài).'
  ],
  verify: [
    'URL presign tải được object trước khi hết hạn; sau khi hết hạn trả lỗi AccessDenied / Request has expired.',
    'URL chứa các query X-Amz-Algorithm, X-Amz-Signature, X-Amz-Expires; sửa signature → bị từ chối (chống giả mạo).',
    'Không cần credential AWS nào khác để dùng URL (chỉ cần HTTP GET/PUT đúng method đã ký).'
  ],
  cost: 'Không tính phí riêng cho presigned URL; chỉ tính request và data transfer của S3 như thường. Dọn dẹp: xoá object và bucket tạm.',
  examTip: `### Bẫy đề thi
- **Presigned ≠ public**: URL có chữ ký và thời hạn; bucket vẫn private. Đề "chia sẻ file nội bộ không cần đăng nhập" → presigned URL.
- **Tối đa 7 ngày**: với access key dài hạn, expiry tối đa 604800 giây (7 ngày); với STS temporary, URL chỉ hợp lệ đến khi token hết hạn. Đề "cho 30 ngày" → sai.
- **GET vs PUT**: presigned URL ký theo method (GET để tải, PUT để upload). Đề "cho client upload trực tiếp lên S3" → presigned PUT URL, giảm tải cho backend.
- **CloudFront signed URL/cookie**: khi cần CDN và bảo vệ nhiều file, dùng CloudFront signed (trusted signer/key group) chứ không phải presigned S3. Đề "video trả phí qua CloudFront" → signed cookie/URL CloudFront.`,
  ref: ['lab-034-upload-download-s3-bang-console-cli-va-sdk', 'lab-040-s3-access-point-va-prefix-isolation'],
},
{
  id: 'awslab-storage-006',
  category: 'storage',
  title: 'S3 Event Notifications: Lambda, SQS và EventBridge',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'dop-d5'],
  services: ['S3', 'Lambda', 'SQS', 'EventBridge'],
  goal: 'Sau lab này bạn cấu hình S3 event notification (ObjectCreated, ObjectRemoved, ObjectRestore, Replication...) gửi tới Lambda, SQS, SNS hoặc EventBridge, hiểu khác biệt giữa notification trực tiếp và EventBridge (filter linh hoạt, nhiều target hơn). Đây là nền tảng kiến trúc event-driven hay ra SAP.',
  steps: [
    'Hiểu event types: s3:ObjectCreated:*, s3:ObjectRemoved:*, s3:ObjectRestore:*, s3:Replication:*, s3:LifecycleExpiration:*. Có thể lọc theo prefix/suffix.',
    'Tạo đích: Lambda function (hoặc SQS queue). Cấp quyền cho S3 invoke Lambda (resource policy) hoặc queue policy cho phép s3.amazonaws.com.',
    'Trên bucket → tab Properties → Event notifications → Create notification. Chọn event type, prefix/suffix, và đích (Lambda ARN hoặc SQS ARN).',
    'Test: upload file khớp prefix → Lambda được invoke (xem CloudWatch Logs của Lambda) hoặc message xuất hiện trong SQS.',
    'EventBridge: tab Properties → Event notifications → chọn EventBridge (hoặc aws s3api put-bucket-notification-configuration với EventBridgeConfiguration). Tạo rule EventBridge filter theo source s3, eventName PutObject, prefix.',
    'So sánh: notification trực tiếp chỉ gửi tới Lambda/SQS/SNS (3 đích), filter đơn giản; EventBridge hỗ trợ 20+ target (Step Functions, Kinesis...), filter nâng cao, archive/replay.',
    'Dọn dẹp: xoá event notification, Lambda/queue, EventBridge rule, rồi xoá bucket.'
  ],
  verify: [
    'Upload object khớp filter → đích nhận event (CloudWatch Logs Lambda có dòng s3:ObjectCreated:Put, hoặc SQS nhận message JSON với eventName ObjectCreated).',
    'S3 event notification hiển thị trong console đúng đích và filter; EventBridge rule có event pattern khớp.',
    'Object không khớp prefix/suffix → không trigger.'
  ],
  cost: 'Lambda tính theo request và thời gian chạy; SQS/SNS/EventBridge có phí theo request/message; S3 event notification không tính phí riêng. Dọn dẹp: xoá notification, Lambda, queue, EventBridge rule, rồi xoá bucket.',
  examTip: `### Bẫy đề thi
- **S3 notification trực tiếp chỉ 3 đích**: Lambda, SQS, SNS. Cần nhiều hơn hoặc filter phức tạp → EventBridge.
- **EventBridge filter mạnh hơn**: content-based filtering trên nhiều field (eventName, prefix, size), 20+ target, archive/replay. Đề "route theo kích thước file, nhiều downstream" → EventBridge.
- **Prefix/suffix filter**: notification trực tiếp lọc theo prefix/suffix (ví dụ uploads/ và .jpg); EventBridge lọc chi tiết hơn.
- **Eventual delivery**: S3 event giao at-least-once — có thể nhận trùng, cần idempotent ở consumer (SQS/Lambda). Đề "xử lý trùng" → thiết kế idempotent.
- **ObjectRestore**: event s3:ObjectRestore:* chỉ bắn khi khôi phục object từ Glacier, không phải khi upload thường.`,
  ref: ['lab-041-s3-event-notification-toi-lambda', 'lab-042-s3-event-notification-toi-sqs', 'lab-043-s3-eventbridge-integration'],
},
{
  id: 'awslab-storage-007',
  category: 'storage',
  title: 'EBS: gp3/io2/st1/sc1, mở rộng online và snapshot',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'sap-d3', 'dop-d3'],
  services: ['EBS', 'Snapshot', 'KMS', 'CloudWatch'],
  goal: 'Sau lab này bạn chọn đúng volume type (gp3, io2 Block Express, st1, sc1), tạo và mở rộng volume online không downtime, tăng IOPS/throughput cho gp3, tạo snapshot, copy sang region khác và mã hoá bằng KMS. EBS là storage block nền tảng cho EC2, hay ra ở cả thiết kế và tối ưu.',
  steps: [
    'Hiểu volume type: gp3 (SSD, baseline 3000 IOPS/125 MB/s, tăng tới 16000 IOPS/1000 MB/s, tách IOPS khỏi dung lượng), io2 Block Express (tới 256000 IOPS, 4000 MB/s, 64 TiB, độ bền 99.999%), st1 (HDD throughput cho log/big data), sc1 (HDD lạnh rẻ nhất).',
    'Tạo volume rời: aws ec2 create-volume --size 100 --volume-type gp3 --availability-zone ap-southeast-1a.',
    'Attach vào EC2: aws ec2 attach-volume --volume-id vol-xxx --instance-id i-xxx --device /dev/sdf ; format mkfs -t xfs, mount, khai báo /etc/fstab bằng UUID.',
    'Mở rộng online: aws ec2 modify-volume --volume-id vol-xxx --size 200 rồi grow filesystem (xfs_growfs / hoặc resize2fs) — không cần restart.',
    'Tăng IOPS/throughput gp3: aws ec2 modify-volume --volume-id vol-xxx --iops 5000 --throughput 250 (chỉ gp3; io2 dùng --iops).',
    'Tạo snapshot: aws ec2 create-snapshot --volume-id vol-xxx --description "lab snap". Snapshot tăng dần, lưu trên S3 do AWS quản lý.',
    'Copy snapshot sang region khác: aws ec2 copy-snapshot --source-region ap-southeast-1 --source-snapshot-id snap-xxx --destination-region us-east-1 ; thêm --encrypted --kms-key-id alias/my-key để mã hoá bằng KMS.',
    'Khôi phục EC2 từ snapshot khi volume hỏng: tạo volume mới từ snapshot, attach vào EC2 thay thế.',
    'Dọn dẹp: xoá snapshot (cả 2 region), volume, rồi terminate EC2.'
  ],
  verify: [
    '{{aws ec2 describe-volumes --volume-ids vol-xxx}} trả về Size, VolumeType gp3, Iops/Throughput đúng; state in-use sau attach.',
    'Mở rộng online: df -h trên EC2 thấy dung lượng tăng sau khi grow filesystem, không cần reboot.',
    '{{aws ec2 describe-snapshots --snapshot-ids snap-xxx}} có Progress 100%, Encrypted nếu bật KMS; snapshot xuất hiện ở region đích sau copy.'
  ],
  cost: 'gp3 tính theo dung lượng GB cộng IOPS/throughput vượt mức miễn phí (3000 IOPS/125 MB/s). io2 đắt hơn, st1/sc1 rẻ. Snapshot tính theo GB lưu trữ tăng dần. Copy cross-region tính phí data transfer. Dọn dẹp: xoá snapshot, volume, terminate EC2, xoá KMS key nếu tạo riêng.',
  examTip: `### Bẫy đề thi
- **gp3 tách IOPS khỏi size**: gp2 IOPS tỉ lệ với dung lượng; gp3 có baseline 3000 IOPS bất kể size, tăng độc lập. Đề "cần 5000 IOPS nhưng ít dung lượng" → gp3.
- **io2 Block Express**: độ bền 99.999%, tới 256000 IOPS/64 TiB, phù hợp DB quan trọng. Đề "critical database, Multi-Attach" → io2.
- **st1 vs sc1**: st1 throughput cao cho sequential (log, big data); sc1 lạnh rẻ nhất cho dữ liệu ít truy cập. Đề "backup lạnh giá rẻ" → sc1.
- **Snapshot tăng dần**: chỉ lưu block thay đổi; xoá snapshot cũ không xoá dữ liệu còn phụ thuộc. Đề "chi phí snapshot" → tăng dần, không phải toàn bộ mỗi lần.
- **Multi-Attach**: chỉ io1/io2 (io2 Block Express) hỗ trợ attach 1 volume vào nhiều EC2 cùng AZ; gp2/gp3 không hỗ trợ. Đề "chia sẻ volume" → io2 Multi-Attach.
- **EBS vs instance store**: instance store là tạm (mất khi stop), EBS bền. Đề "dữ liệu cần giữ khi stop" → EBS.`,
  ref: ['lab-011-tao-gan-va-mo-rong-amazon-ebs-gp3', 'lab-012-so-sanh-ebs-gp3-io2-st1-va-sc1', 'lab-016-tao-snapshot-va-restore-ebs-volume', 'lab-017-copy-ebs-snapshot-sang-region-khac'],
},
{
  id: 'awslab-storage-008',
  category: 'storage',
  title: 'Amazon EFS: regional multi-AZ, mount target, lifecycle và access point',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'sap-d3'],
  services: ['EFS', 'NFS', 'KMS', 'Auto Scaling'],
  goal: 'Sau lab này bạn tạo file system EFS regional (multi-AZ), mount từ EC2 qua NFS (port 2049), hiểu mount target + security group, bật lifecycle (transition sang EFS-IA) và throughput mode, dùng access point để cách ly ứng dụng. EFS là storage chia sẻ cho kiến trúc nhiều EC2/container, hay ra SAP.',
  steps: [
    'Hiểu EFS: file system NFSv4 chia sẻ, mount vào nhiều EC2 cùng lúc, regional (multi-AZ) hoặc One Zone. Mỗi AZ có mount target (ENI) để EC2 cùng AZ mount qua đó.',
    'Tạo EFS: aws efs create-file-system --creation-token lab-efs-008 --encrypted (mã hoá at-rest bằng KMS). Ghi lại FileSystemId.',
    'Tạo mount target cho mỗi subnet/AZ: aws efs create-mount-target --file-system-id fs-xxx --subnet-id subnet-a --security-groups sg-efs. Security group mount target mở inbound TCP 2049 từ SG của EC2 client.',
    'Mount từ EC2: sudo mount -t nfs4 -o nfsvers=4.1 fs-xxx.efs.ap-southeast-1.amazonaws.com:/ /mnt/efs. Ghi file, đọc từ EC2 khác → thấy ngay.',
    'Bật lifecycle: aws efs put-lifecycle-configuration --file-system-id fs-xxx --lifecycle-policies "[{TransitionToIA:AFTER_30_DAYS}]" → file không truy cập 30 ngày chuyển sang EFS-IA (rẻ hơn, có phí truy xuất).',
    'Throughput mode: bursting (mặc định) hoặc enhanced/provisioned (chọn khi cần throughput cao ổn định); đổi qua aws efs put-file-system-configuration.',
    'Access point: tạo access point giới hạn root dir + POSIX user, gắn policy riêng cho từng ứng dụng.',
    'Dọn dẹp: xoá mount target trước, rồi xoá access point, file system và security group.'
  ],
  verify: [
    '{{aws efs describe-file-systems --file-system-id fs-xxx}} trả về LifeCycleState=available, Encrypted=true, SizeInBytes tăng khi ghi.',
    '{{aws efs describe-mount-targets --file-system-id fs-xxx}} liệt kê mount target mỗi AZ, state available, IP trong subnet.',
    'Từ 2 EC2 ở 2 AZ cùng mount và đọc/ghi cùng file; file không truy cập 30 ngày chuyển EFS-IA (kiểm tra storage class trong describe).'
  ],
  cost: 'EFS tính theo GB/tháng (Standard vs IA khác giá) cộng phí truy xuất IA; throughput provisioned tính thêm MB/s. Mount target dùng ENI có thể phát sinh phí ENI. Dọn dẹp: xoá mount target trước khi xoá file system, rồi xoá access point, file system, security group.',
  examTip: `### Bẫy đề thi
- **EFS vs EBS**: EBS gắn 1 EC2 (Multi-Attach chỉ io2, giới hạn), EFS mount nhiều EC2 cùng lúc qua NFS. Đề "nhiều instance chia sẻ file" → EFS, không phải EBS.
- **Mount target theo AZ**: EC2 mount qua mount target cùng AZ; nếu AZ không có mount target (hoặc SG chặn 2049) → mount fail. Đề "EC2 AZ khác không mount được" → thiếu mount target/SG.
- **EFS-IA**: rẻ hơn Standard nhưng có phí truy xuất mỗi lần đọc; lifecycle transition sau N ngày không truy cập. Đề "chi phí thấp, dữ liệu ít đọc" → lifecycle + IA.
- **Throughput mode**: bursting co giãn theo credit; enhanced/provisioned cho throughput cao ổn định (HPC). Đề "throughput cao liên tục" → provisioned.
- **Regional vs One Zone**: regional multi-AZ (HA), One Zone rẻ hơn nhưng mất khi AZ hỏng. Đề "HA, chịu AZ failure" → regional.
- **Port 2049**: NFS dùng TCP 2049; SG mount target phải mở từ SG client. Đề "mount timeout" → kiểm tra SG/NACL 2049.`,
  ref: ['lab-021-tao-efs-regional-trong-nhieu-az', 'lab-028-so-sanh-efs-standard-va-efs-ia', 'lab-029-cau-hinh-efs-lifecycle-va-throughput-mode', 'lab-025-su-dung-efs-access-point'],
},
{
  id: 'awslab-storage-009',
  category: 'storage',
  title: 'Amazon FSx: Windows File Server, Lustre và NetApp ONTAP',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'sap-d4'],
  services: ['FSx', 'SMB', 'NFS', 'S3', 'Active Directory'],
  goal: 'Sau lab này bạn phân biệt 3 họ FSx (Windows File Server cho SMB/AD, Lustre cho HPC tích hợp S3, NetApp ONTAP đa giao thức NFS/SMB/iSCSI), chọn đúng theo workload (Windows doanh nghiệp, HPC, NAS nâng cao). FSx hay ra ở bài migration/enterprise.',
  steps: [
    'Hiểu 3 họ: FSx for Windows File Server (SMB, tích hợp Microsoft AD, multi-AZ automatic failover, DFS namespace); FSx for Lustre (HPC, scratch/persistent, backlog S3 như data source); FSx for NetApp ONTAP (NFS/SMB/iSCSI, snapshot, SnapMirror, storage efficiency).',
    'FSx Windows: tạo file system trong VPC, gán AWS Managed Microsoft AD (hoặc self-managed), chọn Single-AZ (lab) hoặc Multi-AZ (production). Mount từ EC2 Windows: net use Z: \\\\fs-xxx.fs-xxx.region.amazonaws.com\\share.',
    'FSx Lustre: tạo file system, chọn backing store S3 (data repository) để import/export bucket; mount từ EC2 Linux: mount -t lustre fs-xxx.fsx.region.amazonaws.com@tcp:/fsx /mnt/lustre.',
    'FSx ONTAP: tạo file system, tạo SVM (Storage Virtual Machine), tạo volume NFS/SMB, mount từ client; bật snapshot policy và SnapMirror sang region khác cho DR.',
    'Multi-AZ và failover: FSx Windows Multi-AZ tự failover khi AZ/primary hỏng; kiểm thử automatic failover.',
    'Bảo mật: tích hợp AD cho SMB (Windows), KMS mã hoá at-rest, security group mở port (SMB 445, NFS 2049).',
    'Dọn dẹp: xoá file system, SVM/volume, AD (nếu tạo), S3 data repository (nếu dùng).'
  ],
  verify: [
    'FSx file system trạng thái Available; từ EC2 (Windows hoặc Linux) mount được và đọc/ghi file chia sẻ.',
    '{{aws fsx describe-file-systems}} trả về FileSystemType (WINDOWS/LUSTRE/ONTAP), StorageCapacity và DNSName để mount.',
    'FSx Windows Multi-AZ: giả lập AZ failure → client tự kết nối lại sang standby, dữ liệu nguyên vẹn.'
  ],
  cost: 'FSx tính theo dung lượng GB/tháng cộng throughput, đắt hơn EBS/EFS; Windows Multi-AZ gần gấp đôi; ONTAP thêm SVM/SnapMirror. Dọn dẹp: xoá file system, SVM/volume, AD, S3 repository để tránh phí theo giờ.',
  examTip: `### Bẫy đề thi
- **FSx Windows = SMB + AD**: tích hợp Active Directory, hợp Windows doanh nghiệp, DFS namespace. Đề "chia sẻ file Windows, AD group policy" → FSx Windows.
- **FSx Lustre = HPC + S3**: scratch storage tốc độ cao cho HPC, tích hợp S3 repository (import/export). Đề "HPC, hàng nghìn node đọc song song" → Lustre.
- **FSx ONTAP = đa giao thức + tính năng NAS**: NFS/SMB/iSCSI, snapshot, SnapMirror, storage efficiency (dedup/compression). Đề "cần iSCSI + NAS nâng cao" → ONTAP.
- **Multi-AZ Windows automatic failover**: FSx Windows Multi-AZ tự failover; Single-AZ là SPOF. Đề "HA cho file server Windows" → Multi-AZ.
- **FSx đắt hơn EFS/EBS**: tính theo GB cộng throughput, dùng khi cần giao thức/tính năng đặc thù. Đề "file server Windows" → FSx Windows, không phải EFS.`,
  ref: ['lab-052-fsx-for-windows-multi-az', 'lab-056-fsx-for-lustre-tich-hop-s3', 'lab-058-fsx-for-netapp-ontap-svm-volume-nfs-smb'],
},
{
  id: 'awslab-storage-010',
  category: 'storage',
  title: 'AWS Storage Gateway: File, Volume (cached/stored) và Tape Gateway',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'sap-d4'],
  services: ['Storage Gateway', 'S3', 'NFS', 'SMB', 'iSCSI'],
  goal: 'Sau lab này bạn phân biệt 3 loại gateway (File Gateway vào S3, Volume Gateway cached/stored dùng iSCSI, Tape Gateway VTL), hiểu cách tích hợp on-premises với AWS cho hybrid cloud và migration từng phần. Đây là chủ đề hybrid/migration hay ra SAP.',
  steps: [
    'Hiểu mô hình: gateway là appliance (VM) đặt ở on-premises, đại diện storage AWS (S3/EBS) qua giao thức on-prem (NFS/SMB/iSCSI/VTL).',
    'File Gateway: cài VM (OVA/AMI), kích hoạt, tạo file share (NFS/SMB) ánh xạ vào S3 bucket. On-prem đọc/ghi như file NAS, dữ liệu thực nằm ở S3.',
    'Volume Gateway cached mode: volume iSCSI trên on-prem, dữ liệu chủ yếu ở S3 (EBS snapshot), cache local cho dữ liệu mới/đọc nhiều. Volume Gateway stored mode: toàn bộ dữ liệu ở local, đồng bộ snapshot lên S3 (backup).',
    'Tape Gateway: trình bày như thư viện băng (VTL) qua iSCSI, backup software (Veeam, NetBackup) ghi tape → lưu vào S3/Glacier.',
    'Kết nối: gateway cần mạng tới AWS (Internet hoặc Direct Connect/VPN cho hybrid ổn định); cấu hình outbound 443.',
    'Giám sát: CloudWatch metrics (CacheHitPercent, BufferPercentUsed) và Storage Gateway console.',
    'Dọn dẹp: xoá gateway trên Storage Gateway console, xoá file share/volume/tape, terminate VM on-prem, rồi xoá S3 bucket/snapshot liên quan.'
  ],
  verify: [
    'Storage Gateway console hiển thị gateway Active, file share/volume/tape trạng thái Available.',
    'Từ client on-prem mount NFS/SMB share hoặc connect iSCSI → đọc/ghi thành công; dữ liệu xuất hiện ở S3 (file share) hoặc snapshot EBS (volume).',
    'CloudWatch metrics có dữ liệu (CacheHitPercent...); có thể xem object trong S3 bucket tương ứng.'
  ],
  cost: 'Storage Gateway tính phí theo giờ gateway cộng dung lượng lưu trữ (S3/EBS snapshot) và data transfer. Volume/tape dùng S3 storage class. Dọn dẹp: xoá gateway, file share, volume, tape, snapshot, bucket — đây là tài nguyên hay bị quên gây phí.',
  examTip: `### Bẫy đề thi
- **File Gateway vs Volume Gateway**: File = NFS/SMB vào S3 (NAS dùng chung), Volume = iSCSI block (cached/stored), Tape = VTL cho backup. Đề "backup software hiện tại ghi băng" → Tape Gateway.
- **Cached vs Stored**: Cached = dữ liệu chủ yếu ở S3, cache local (rẻ hơn, hợp dữ liệu lớn); Stored = toàn bộ ở local, snapshot lên S3 (hợp low latency, backup). Đề "dữ liệu lớn, chi phí thấp, truy cập không thường xuyên" → cached.
- **Hybrid connectivity**: gateway cần kết nối ổn định tới AWS; Direct Connect/VPN cho hybrid production. Đề "on-prem cần băng thông ổn định" → DX/VPN.
- **Tích hợp S3**: File Gateway ánh xạ file share vào S3 bucket; có thể dùng lifecycle, versioning S3. Đề "on-prem cần dùng S3 mà không đổi ứng dụng" → File Gateway.
- **Không phải workload nào cũng hợp**: gateway thêm độ trễ và phụ thuộc mạng; workload nhạy latency nên cân nhắc.`,
  ref: ['lab-077-storage-gateway-file-gateway-toi-s3', 'lab-078-storage-gateway-volume-gateway-cached-mode', 'lab-079-storage-gateway-tape-gateway'],
},
{
  id: 'awslab-storage-011',
  category: 'storage',
  title: 'AWS Backup: vault, plan, lifecycle, cross-region/account và Vault Lock',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d3', 'dop-d3', 'dop-d6'],
  services: ['AWS Backup', 'EBS', 'RDS', 'EFS', 'KMS'],
  goal: 'Sau lab này bạn dùng AWS Backup tập trung (backup vault, plan, rule schedule + lifecycle + retention), bật cross-region/cross-account copy, và hiểu Vault Lock (compliance vs governance) để chống xoá backup. Đây là chủ đề sao lưu/DR tập trung hay ra SAP và DOP.',
  steps: [
    'Hiểu mô hình: AWS Backup quản lý tập trung backup cho EBS, RDS/Aurora, EFS, S3, FSx, DynamoDB... qua backup vault + plan + selection.',
    'Tạo backup vault (mã hoá bằng KMS): aws backup create-backup-vault --backup-vault-name lab-vault-011 --encryption-key-arn arn:aws:kms:...',
    'Tạo backup plan: aws backup create-backup-plan --backup-plan file://plan.json (rule gồm schedule cron, lifecycle chuyển cold/xoá sau N ngày, retention).',
    'Gán resource: tạo selection (theo tag hoặc ARN) gán EBS volume/RDS/EFS vào plan → backup tự chạy theo lịch.',
    'Chạy on-demand backup để test: aws backup start-backup-job --backup-vault-name lab-vault-011 --resource-arn arn:...',
    'Cross-region copy: thêm rule copy sang vault ở region khác (DR). Cross-account: copy sang vault account khác cho tổ chức nhiều account.',
    'Vault Lock: bật compliance mode (không thể tắt kể cả xoá plan) hoặc governance mode (chỉ user đặc quyền) để chống xoá backup — chống ransomware/mất dữ liệu.',
    'Giám sát và audit: CloudTrail ghi mọi API backup; EventBridge/CloudWatch cho sự kiện backup; AWS Backup dashboard báo job thành công/thất bại.',
    'Dọn dẹp: xoá backup job/vault/plan, xoá recovery point (nếu không Vault Lock), rồi xoá resource lab.'
  ],
  verify: [
    '{{aws backup list-backup-vaults}} hiển thị vault; {{aws backup list-backup-jobs --backup-vault-name lab-vault-011}} có job state COMPLETED.',
    'Recovery point xuất hiện trong vault; có thể restore (EBS/RDS/EFS) ra resource mới.',
    'Vault Lock (nếu bật): thử xoá recovery point trước hạn → bị từ chối; CloudTrail có event CreateBackupVault và backup job.'
  ],
  cost: 'AWS Backup tính theo dung lượng backup (theo resource type) cộng cross-region/account copy và restore. Vault Lock không tính phí riêng nhưng giữ dữ liệu lâu nên chi phí lưu trữ tăng. Dọn dẹp: xoá recovery point, vault, plan, selection, resource lab.',
  examTip: `### Bẫy đề thi
- **Backup tập trung**: AWS Backup thay cho cấu hình snapshot rời rạc; dùng tag-based selection để tự động áp dụng policy. Đề "backup nhiều tài nguyên, nhiều account" → AWS Backup + Organizations.
- **Vault Lock compliance vs governance**: compliance không thể tắt/xoá kể cả root (chống ransomware), governance chỉ user đặc quyền mới tắt được. Đề "không ai xoá được backup" → compliance.
- **Lifecycle**: transition sang cold storage (rẻ hơn) hoặc expire sau N ngày; kết hợp retention. Đề "chi phí backup thấp" → lifecycle.
- **Cross-region/account**: copy backup sang region/account khác cho DR và multi-account. Đề "DR, nhiều account" → cross-region + cross-account copy.
- **Audit**: CloudTrail + AWS Backup dashboard + EventBridge để biết backup thành công/thất bại; DOP hay hỏi phần giám sát/phát hiện sự cố.`,
  ref: ['lab-061-tao-aws-backup-vault-va-backup-plan', 'lab-062-backup-rule-schedule-lifecycle-va-retention', 'lab-063-backup-ebs-efs-s3-va-fsx', 'lab-067-vault-lock-va-compliance-retention'],
},
{
  id: 'awslab-storage-012',
  category: 'storage',
  title: 'Di trú dữ liệu vào S3: DataSync, Transfer Family và Snowball',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d4', 'dop-d1'],
  services: ['DataSync', 'Transfer Family', 'Snowball', 'S3'],
  goal: 'Sau lab này bạn chọn công cụ di trú dữ liệu phù hợp: DataSync (agent, NFS/SMB/object, incremental, giữ metadata), Transfer Family (SFTP/FTPS/FTP vào S3/EFS không cần dựng server), Snowball (offline petabyte). Đây là chủ đề migration (SAP domain 4) rất hay ra.',
  steps: [
    'Hiểu 3 công cụ: DataSync (chuyển giữa on-prem/NFS/SMB/HDFS và AWS S3/EFS/FSx, có agent, incremental, giữ metadata, dùng mạng); Transfer Family (SFTP/FTPS/FTP endpoint quản lý, backend S3/EFS, không cần dựng server); Snowball/Snowball Edge (thiết bị vật lý offline cho petabyte khi băng thông mạng không đủ).',
    'DataSync: cài DataSync agent (VM on-prem), tạo location nguồn (NFS/SMB) và đích (S3), tạo task rồi chạy; theo dõi transferred bytes/files.',
    'Transfer Family: tạo server SFTP, gán IAM role và identity provider, trỏ user về S3/EFS; client dùng SFTP như thường để upload vào S3.',
    'Snowball: yêu cầu thiết bị, cài dữ liệu, vận chuyển tới AWS region, import vào S3; dùng khi dữ liệu quá lớn để chuyển qua mạng (ví dụ 50 TB, link 100 Mbps).',
    'Chọn theo băng thông: ước tính thời gian = dung lượng / băng thông hiệu dụng. Nếu vài tuần → Snowball; nếu vài giờ → DataSync qua Direct Connect/VPN.',
    'Bảo mật và kiểm tra: DataSync/Transfer Family dùng IAM, KMS, CloudTrail; Snowball có chain of custody và mã hoá.',
    'Dọn dẹp: xoá DataSync task/agent/location, Transfer Family server/user, trả thiết bị Snowball, rồi xoá dữ liệu S3 tạm.'
  ],
  verify: [
    'DataSync task trạng thái Success, số file/bytes khớp nguồn; so sánh checksum/metadata nếu bật verify.',
    'Transfer Family: SFTP client upload file vào S3/EFS thành công bằng credential đã cấu hình.',
    'Snowball: sau khi AWS import, object xuất hiện trong S3 bucket đích; job manifest báo hoàn tất.'
  ],
  cost: 'DataSync tính theo GB dữ liệu chuyển; Transfer Family tính theo giờ cộng data transfer; Snowball tính phí dịch vụ và vận chuyển theo TB/tháng; Direct Connect có port fee. Dọn dẹp: xoá task/location/agent, server, trả Snowball, rồi xoá dữ liệu tạm.',
  examTip: `### Bẫy đề thi
- **DataSync vs Transfer Family**: DataSync tự động chuyển/replicate (agent, incremental, giữ metadata); Transfer Family chỉ cung cấp giao thức SFTP/FTPS/FTP để client tự đổ dữ liệu vào S3/EFS. Đề "đồng bộ tự động on-prem → S3" → DataSync.
- **Snowball khi nào**: khi băng thông không đủ (dữ liệu lớn, thời gian gấp), offline vật lý. Đề "100 TB, link 100 Mbps, cần xong trong 1 tuần" → Snowball.
- **Incremental**: DataSync chỉ truyền phần thay đổi lần sau, tiết kiệm thời gian/băng thông. Đề "đồng bộ lặp lại hàng ngày" → DataSync.
- **Metadata**: DataSync giữ POSIX metadata, permissions, timestamps; Transfer Family giữ chủ yếu nội dung file. Đề "giữ nguyên metadata" → DataSync.
- **Bảo mật**: cả ba dùng IAM + KMS + CloudTrail; Snowball có chuỗi hành trình (chain of custody) và mã hoá. Đề "tuân thủ, audit" → bật CloudTrail + KMS.`,
  ref: ['lab-073-datasync-s3-location', 'lab-075-datasync-incremental-transfer', 'lab-081-transfer-family-sftp-voi-s3-backend', 'lab-084-snowball-data-migration-planning'],
},
{
  id: 'awslab-compute-001',
  category: 'compute',
  title: 'EC2 Auto Scaling + ALB: Spring Boot multi-AZ, tự co giãn theo tải',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'sap-d3', 'dop-d3'],
  services: ['EC2', 'Auto Scaling', 'Application Load Balancer', 'Target Group'],
  goal: 'Sau lab này bạn tự tay dựng nhóm EC2 chạy Spring Boot ở 2 Availability Zone (AZ — một hay nhiều trung tâm dữ liệu độc lập trong một Region, ví dụ hai tòa nhà máy chủ cách nhau vài kilomet) phía sau Application Load Balancer (ALB — cân bằng tải lớp 7, nhận HTTP/HTTPS rồi chuyển tới instance khỏe mạnh), rồi cấu hình Auto Scaling Group (ASG — nhóm tự động thêm/bớt EC2 theo chính sách bạn đặt) với target tracking CPU 50%. Kỹ năng này xuất hiện liên tục trong đề SAP/DOP: tính sẵn sàng cao, tự scale, không downtime khi scale.',
  steps: [
    'Chuẩn bị VPC 2 AZ: 2 public subnet cho ALB, 2 private subnet cho EC2, Internet Gateway, NAT Gateway nếu EC2 cần tải thư viện Maven từ Internet.',
    'Tạo IAM role cho EC2 gán AmazonSSMManagedInstanceCore (để kết nối bằng Session Manager, không mở port 22) và một policy đọc S3, rồi tạo Instance Profile gán role này khi launch instance.',
    'Tạo launch template: Amazon Linux 2023, instance t3.micro, user data cài Java 17 (Amazon Corretto), copy jar Spring Boot của bạn, chạy java -jar app.jar --server.port=8080. Launch template là bản thiết kế chuẩn hóa: AMI, loại instance, user data, security group, IAM profile.',
    'Tạo security group ALB: inbound 80/443 từ 0.0.0.0/0. Security group EC2: inbound 8080 chỉ từ security group của ALB.',
    'Tạo ALB internet-facing ở 2 public subnet, target group port 8080, protocol HTTP, health check path / (hoặc /actuator/health nếu dùng Spring Boot Actuator), interval 30 giây, unhealthy threshold 2, healthy threshold 2.',
    'Tạo ASG: launch template trên, min 1, desired 2, max 4, 2 private subnet, health check type ELB, gán target group.',
    'Tạo target tracking policy bằng aws autoscaling put-scaling-policy với policy-type TargetTrackingScaling, PredefinedMetricSpecification ASGAverageCPUUtilization, TargetValue 50 (file cpu.json).',
    'Test scale-out: qua Session Manager vào một instance, cài stress-ng (sudo dnf install -y stress-ng), chạy stress-ng --cpu 2 --timeout 600, quan sát ASG Activity history trong 5-10 phút.',
  ],
  verify: [
    'aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names lab-asg trả về DesiredCapacity 2, MinSize 1, MaxSize 4, 2 instance ở 2 AZ khác, HealthCheckType: ELB.',
    'aws elbv2 describe-target-health --target-group-arn tg-xxx cho tất cả instance trạng thái healthy (không phải initial nữa).',
    'Truy cập DNS name của ALB qua curl nhận 200 OK từ Spring Boot; terminate một instance (aws ec2 terminate-instances) thì ASG thay thế và ALB vẫn phản hồi nhờ instance kia.',
  ],
  cost: 'ALB khoảng 0.0225 USD/giờ cộng LCU (không đến 1 USD trong vài giờ lab). EC2 t3.micro nằm trong Free Tier (750 giờ/tháng cho tài khoản mới), nếu vượt thì khoảng 0.0116 USD/giờ/instance. NAT Gateway nếu tạo: khoảng 0.045 USD/giờ cộng phí xử lý GB — chỉ bật trong thời gian lab rồi xoá. Dọn dẹp BẮT BUỘC: xoá ASG (terminate instance đi kèm), xoá ALB, target group, launch template, NAT Gateway (chờ Deleted) rồi release Elastic IP, xoá security group, VPC.',
  examTip: `### Bẫy đề thi
- **ALB là lớp 7 (HTTP/HTTPS)**, NLB là lớp 4 (TCP/TLS, IP tĩnh). Đề cần path-based routing (/api → nhóm A, /web → nhóm B) hoặc WebSocket → chọn ALB.
- **Health check ALB** quyết định instance vào InService hay OutOfService. Path sai (ví dụ / mà app chỉ có /actuator/health) → toàn bộ instance unhealthy, ALB không gửi traffic.
- **ASG health check** mặc định EC2 (status running) — chưa đủ. Đề yêu cầu "tự thay thế instance ứng dụng lỗi" → chọn health check type ELB, interval ngắn, grace period hợp lý.
- **Target tracking** scale theo giá trị mục tiêu (CPU 50%, request mỗi target 1000). Simple scaling và step scaling dùng CloudWatch alarm — chậm hơn, phù hợp bursts cố định.
- **Warm pool** giữ instance ở trạng thái Stopped để scale-out trong vài giây thay vì vài phút — đề "giảm thời gian khởi động" khi traffic đột ngột.`,
  ref: ['lab-031-create-application-load-balancer', 'lab-021-create-auto-scaling-group', 'lab-022-target-tracking', 'lab-028-health-check-replacement'],
},
{
  id: 'awslab-compute-002',
  category: 'compute',
  title: 'Launch Template + Auto Scaling Instance Refresh: nâng cấp fleet không downtime',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'dop-d1', 'dop-d2'],
  services: ['EC2', 'Auto Scaling', 'Launch Template'],
  goal: 'Sau lab này bạn hiểu Launch Template (bản thiết kế launch EC2 có versioning, thay thế Launch Configuration cũ), cách tạo phiên bản mới, đặt làm $Default để ASG dùng bản mới khi scale-out, và Instance Refresh (ASG terminate và thay thế từng instance theo quy tắc bạn đặt, giữ tối thiểu fleet khỏe, chờ warm-up trước khi chuyển instance kế). Đây là cách triển khai nâng cấp không downtime cho fleet EC2 — đề SAP/DOP hay hỏi "cập nhật AMI/security patch cho nhóm EC2 mà không gián đoạn dịch vụ".',
  steps: [
    'Mở launch template cũ (phiên bản 1), tạo phiên bản mới bằng aws ec2 create-launch-template-version: đổi AMI sang bản vá bảo mật mới, cập nhật user data cài Java 17 patch mới nhất, giữ cùng instance type và IAM profile.',
    'Đặt phiên bản mới làm $Default bằng aws ec2 modify-launch-template --default-version để ASG dùng bản mới khi scale-out.',
    'Tạo instance refresh: aws autoscaling start-instance-refresh --auto-scaling-group-name lab-asg --preferences MinHealthyPercentage=50,InstanceWarmup=300 — ASG sẽ terminate và thay thế từng instance, giữ ít nhất 50% fleet khỏe, chờ instance warm-up (sẵn sàng nhận traffic) trước khi chuyển instance kế.',
    'Quan sát Activity history và trạng thái instance refresh bằng aws autoscaling describe-instance-refreshes: từng giai đoạn (Provisioning, Warmup, Terminating, Waiting).',
    'Nếu phát hiện lỗi sau khi bắt đầu: aws autoscaling cancel-instance-refresh để dừng, rollback bằng cách đặt $Default về phiên bản cũ rồi refresh lại.',
    'Test: curl liên tục đến ALB trong lúc refresh, đảm bảo không có lỗi 5xx lâu dài (connection draining của target group giữ kết nối cũ).',
  ],
  verify: [
    'aws autoscaling describe-launch-template-versions cho thấy DefaultVersion là phiên bản mới, instance chạy AMI ID mới.',
    'aws autoscaling describe-instance-refreshes --auto-scaling-group-names lab-asg trạng thái Successful, PercentComplete 100.',
    'Tất cả instance trong ASG trạng thái healthy, ALB target health toàn bộ healthy, ứng dụng trả phiên bản code mới.',
  ],
  cost: 'Instance refresh terminate instance cũ và launch mới: trong Free Tier t3.micro phí compute gần 0; nếu t3.large trở lên thì tính theo giờ chạy. ALB chạy liên tục khoảng 0.0225 USD/giờ. Dọn dẹp: xoá ASG, launch template, ALB, target group.',
  examTip: `### Bẫy đề thi
- **Launch template thay thế launch configuration** (cũ, hạn chế tính năng). Đề so sánh hai bản thiết kế → chọn launch template vì hỗ trợ versioning, T2/T3 unlimited, EBS encryption, IMDSv2.
- **Instance Refresh** không thay đổi launch template trực tiếp; nó dùng phiên bản $Default hiện tại. Muốn rollback → đổi $Default về phiên bản cũ rồi refresh lại.
- **MinHealthyPercentage** (mặc định 90%) và **InstanceWarmup** (không có mặc định, phải set) kiểm soát tốc độ và độ trễ sau khi scale. Đề "không downtime, ít ảnh hưởng user" → MinHealthyPercentage cao, warmup đủ lâu cho ứng dụng khởi động (Spring Boot thường 30-60 giây).
- **Connection draining** (deregistration delay, mặc định 300 giây) giữ kết nối cũ khi instance bị terminate — giảm lỗi failed request khi refresh.`,
  ref: ['lab-013-launch-template', 'lab-014-versioned-launch-template', 'lab-015-instance-refresh', 'lab-03-tao-launch-template-va-dung-auto-scaling-group-de-thay-the-instance-loi'],
},
{
  id: 'awslab-compute-003',
  category: 'compute',
  title: 'Spot Instances + Savings Plans: chạy workload giảm chi phí, chịu được gián đoạn',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d3', 'dop-d3'],
  services: ['EC2 Spot', 'Auto Scaling', 'Savings Plans', 'CloudWatch', 'EventBridge'],
  goal: 'Sau lab này bạn hiểu Spot Instance (mức tính toán chưa dùng của AWS, giảm đến 90% so với On-Demand, nhưng AWS có thể reclaim lại với báo trước 2 phút qua rebalance notice), cách thiết kế ASG dùng hỗn hợp On-Demand + Spot trên nhiều loại instance (mixed instances policy) và nhiều AZ để không bị dội hết khi một loại instance hết dung lượng, khi nào dùng Savings Plans (cam kết sử dụng 1 hoặc 3 năm, giảm chi phí so với On-Demand) thay vì Spot. Đề SAP/DOP hay hỏi "giảm chi phí tối đa cho workload chịu gián đoạn (batch, test) → Spot", "giảm chi phí workload ổn định 24/7 → Savings Plans/Reserved Instances".',
  steps: [
    'Tạo ASG với mixed instances policy: On-Demand base 1 instance (dành cho phần không thể gián đoạn), phần còn lại 100% Spot, overload các loại instance (t3.micro, t3.small, t3a.micro...) và 2-3 AZ.',
    'Đặt Spot allocation strategy: capacity-optimized (AWS chọn dung lượng Spot ít bị gián đoạn nhất) hoặc capacity-optimized-prioritized nếu bạn ưu tiên danh sách instance type.',
    'Bật capacity rebalancing: ASG tự thay thế instance Spot nhận rebalance notice (AWS gửi 2 phút trước khi reclaim) trước khi bị thu hồi.',
    'Tạo CloudWatch alarm hoặc EventBridge rule trên sự kiện EC2 Spot Instance Interruption Warning để chạy script drain kết nối và upload log lên S3 trước khi instance chết.',
    'Tuỳ chọn: mua Compute Savings Plans trong Cost Explorer (Savings Plans recommendations), cam kết USD/giờ trong 1 năm, áp dụng tự động cho On-Demand usage tươngpatible.',
    'Quan sát Cost Explorer: nhóm theo Instance type và Purchase type (Spot vs On-Demand) để so sánh chi phí thực.',
  ],
  verify: [
    'aws autoscaling describe-auto-scaling-groups MixedInstancesPolicy có OnDemandBaseCapacity 1, SpotAllocationStrategy capacity-optimized, nhiều InstanceType.',
    'EventBridge rule captures sự kiện aws.ec2 Spot Instance Interruption Warning (target Lambda hoặc SNS) — instance bị đánh dấu termination trong 2 phút.',
    'Cost Explorer hiển thị chi phí Spot thấp hơn On-Demand cùng loại instance (khoảng 60-90% giảm).',
  ],
  cost: 'Spot giảm 60-90% so với On-Demand (t3.micro On-Demand khoảng 0.0104 USD/giờ, Spot có thể khoảng 0.003-0.006 USD/gior tùy AZ). Savings Plans 1 năm All Upfront giảm tới 30-40% so với On-Demand nhưng phải trả trước hoặc cam kết hàng tháng. Dọn dẹp: xoá ASG (terminate Spot và On-Demand), huỷ Savings Plans không thể huỷ (cam kết hợp đồng) — chỉ dừng dùng tài nguyên On-Demand để không tính thêm phí.',
  examTip: `### Bẫy đề thi
- **Spot chỉ hợp workload chịu gián đoạn**: batch xử lý, test, CI worker, rendering. Không dùng Spot cho database chính, user session stateful, hoặc workload không thể retry.
- **Rebalance notice 2 phút**: khi AWS thông báo sẽ reclaim Spot, bạn có 2 phút để drain, flush cache, thông báo ứng dụng. Không dùng → mất dữ liệu đang xử lý.
- **Mixed instances policy + nhiều AZ + nhiều instance type** là cách giảm nguy cơ Spot bị thu hồi đồng thời. Đề "giảm chi phí mà vẫn high availability" → ASG mixed instances multi-AZ.
- **Savings Plans áp dụng cho On-Demand**, không áp dụng cho Spot (Spot đã rẻ). Compute Savings Plans linh hoạt đổi loại instance/AZ; EC2 Instance Savings Plans gắn chặt hơn, giảm nhiều hơn.
- **Reserved Instances** chỉ khả dụng EC2 (không phải Lambda/Fargate), Savings Plans có Compute (EC2 + Lambda + Fargate) và EC2 Instance.`,
  ref: ['lab-029-capacity-rebalancing', 'lab-030-asg-cost-control', 'lab-093-spot-interruption', 'lab-091-compute-cost-baseline'],
},
{
  id: 'awslab-compute-004',
  category: 'compute',
  title: 'ECS Fargate: đóng gói Spring Boot vào container, chạy serverless, không quản lý EC2',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'sap-d3', 'dop-d3'],
  services: ['ECS', 'Fargate', 'Application Load Balancer', 'ECR', 'CloudWatch Logs'],
  goal: 'Sau lab này bạn hiểu ECS (Amazon Elastic Container Service — điều phối container: chạy, escala, khôi phục container), Fargate (engine serverless của ECS: AWS quản lý EC2 underneath, bạn chỉ trả cho CPU/memory container dùng), task definition (bản thiết kế container: image, CPU, memory, env var, logging), ECS service (giữ số task mong muốn, tự khởi lại task sai). Bạn đóng gói một ứng dụng Spring Boot vào Docker image, đẩy lên ECR, chạy trên Fargate phía sau ALB. Đề hay hỏi "ít vận hành nhất, không quản lý server, container" → Fargate; "cần kiểm soát instance, giá rẻ" → EC2 launch type.',
  steps: [
    'Cài Docker, viết Dockerfile cho Spring Boot: FROM amazoncorretto:17-alpine, copy jar, EXPOSE 8080, ENTRYPOINT ["java","-jar","app.jar"]. Build image: docker build -t spring-app .',
    'Tạo repository ECR riêng: aws ecr create-repository --repository-name spring-app. Lấy lệnh login: aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 111122223333.dkr.ecr.ap-southeast-1.amazonaws.com. Tag và push: docker tag spring-app:latest .../spring-app:latest, docker push ...',
    'Tạo ECS cluster Fargate: aws ecs create-cluster --cluster-name lab-cluster --capacity-providers FARGATE.',
    'Tạo task definition: family spring-app, networkMode awsvpc (mỗi task có ENI riêng, IP riêng, security group riêng), container 512 CPU / 1 GB memory, port mapping 8080, log driver awslogs đến CloudWatch log group /ecs/spring-app.',
    'Tạo security group task: inbound 8080 từ security group ALB. Task role: ECS task có quyền gọi AWS (ví dụ đọc Secrets Manager) — khác task execution role (ECS agent pull image, gửi log).',
    'Tạo ECS service: desired 2 task, launch type FARGATE, 2 private subnet, gán target group ALB port 8080, health check grace period 120 giây (Spring Boot khởi động chậm).',
    'Scale service: aws ecs update-service --cluster lab-cluster --service spring-app --desired-count 4. Quan sát CloudWatch CPU/memory của task qua Container Insights.',
  ],
  verify: [
    'aws ecs describe-services --cluster lab-cluster --services spring-app trả về runningCount 2, desiredCount 2, các task trạng thái RUNNING.',
    'aws ecs list-tasks --cluster lab-cluster và describe-tasks cho thấy launchType FARGATE, các task healthy sau grace period.',
    'Curl ALB DNS nhận 200 OK từ Spring Boot; stop một task (aws ecs stop-task) thì ECS khởi chạy task thay thế, ALB vẫn phục vụ.',
  ],
  cost: 'Fargate tính phí theo vCPU (khoảng 0.0404 USD/gior/vCPU) và GB RAM (khoảng 0.00444 USD/gior/GB, ap-southeast-1) mỗi task — 2 task 512 CPU/1GB chạy 24h khoảng 2-3 USD. ECR lưu image tính phí storage (khoảng 0.08 USD/GB/tháng) + data transfer. CloudWatch Logs ingest khoảng 0.50 USD/GB. Dọn dẹp BẮT BUỘC: xoá ECS service (tự dừng task), xoá cluster, deregister task definition không dùng, xoá image ECR hoặc đặt lifecycle policy, xoá ALB, VPC.',
  examTip: `### Bẫy đề thi
- **Fargate = serverless container**: không chọn EC2, không cần vá OS, không chọn AMI. Trả theo task CPU/memory thực. Hạn biệt: không dùng được GPU, không SSH vào task (dùng ECS Exec).
- **awsvpc mode**: mỗi task có ENI riêng → giới hạn ENI trên instance (dùng EC2 launch type) hoặc giới hạn Fargate; mỗi task tiêu thụ một IP private subnet. Đề "hết IP subnet" → kiểm tra này.
- **Task role vs Task execution role**: execution role cho ECS agent (pull image, push log); task role cho code trong container gọi AWS SDK. Gộp hai nhầm → task khởi chạy nhưng code bị AccessDenied.
- **Grace period**: ALB health check bắt đầu sau grace period; Spring Boot init 30-60 giây thì set grace period đủ dài, không target bị đánh unhealthy ngay khi khởi động.
- **ECS vs EKS**: ECS ít vận hành hơn, 통합 sâu AWS; EKS nếu đội đã biết Kubernetes, cần contrôle plane chi tiết. Đề "ít vận hành nhất cho container" → ECS Fargate.`,
  ref: ['lab-051-ecs-cluster-fargate', 'lab-052-ecs-task-definition', 'lab-053-ecs-service', 'lab-056-ecs-fargate-networking'],
},
{
  id: 'awslab-compute-005',
  category: 'compute',
  title: 'Amazon ECR: lưu container image riêng, quét lỗ hổng, quản lý vòng đời',
  level: 'senior',
  minutes: 35,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'dop-d2', 'dop-d6'],
  services: ['ECR', 'IAM', 'EventBridge', 'CloudWatch'],
  goal: 'Sau lab này bạn hiểu ECR (Amazon Elastic Container Registry — lưu trữ container image riêng, riêng tư như Docker Hub nhưng trên AWS), tạo repository, push/pull image với IAM authentication (bỏ qua username/mật khẩu Docker Hub), bật scan on push (quét imagem khi push để tìm CVE/lỗ hổng known), tạo lifecycle policy (tự xoá image cũ quá số lượng hoặc thời gian để kiểm soát chi phí storage). Đề liên quan bảo mật supply chain: "image không được chứa lỗ hổng nghiêm trọng" → ECR scan; "kiểm soát chi phí image vô hạn" → lifecycle policy.',
  steps: [
    'Tạo repository riêng: aws ecr create-repository --repository-name lab/spring-app --image-scanning-configuration scanOnPush=true.',
    'Tạo lifecycle policy: xoá image chưa gán tag (untagged) sau 7 ngày, giữ tối đa 50 image mỗi tag (ví dụ prod-): áp dụng qua console hoặc aws ecr put-lifecycle-policy.',
    'Login Docker với IAM (không cần tạo user Docker): aws ecr get-login-password ... | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com.',
    'Build, tag, push: docker build -t lab/spring-app:v1 ., docker tag lab/spring-app:v1 <uri>/lab/spring-app:v1, docker push <uri>/lab/spring-app:v1.',
    'Kiểm tra kết quả quét: aws ecr describe-image-scan-findings --repository-name lab/spring-app --image-id imageTag=v1 xem severity CRITICAL/HIGH và CVE.',
    'Xem EventBridge rule hoặc CloudWatch event khi scan hoàn thành (nếu cấu hình thông báo).',
    'Thử pull trên một EC2/ECS khác với role có ecr:BatchGetImage, ecr:GetDownloadUrlForLayer (không cần lưu mật khẩu ECR trên instance).',
  ],
  verify: [
    'aws ecr describe-repositories --repository-names lab/spring-app hiển thị repository URI, imageScanningConfiguration: scanOnPush true.',
    'aws ecr list-images --repository-name lab/spring-app hiển thị image v1 vừa push và digest.',
    'aws ecr describe-image-scan-findings trả về imageScanStatus COMPLETED, findings có severity.',
    'Lifecycle policy đã áp dụng: thử push image thứ 51, xem image cũ nhất bị xoá (hoặc xem preview trước khi áp).',
  ],
  cost: 'ECR private repository miễn phí tạo; storage image khoảng 0.08 USD/GB/tháng (ap-southeast-1), data transfer out theo giá EC2. Quét cơ bản (basic scan) miễn phí cho image push lên; enhanced scan tính phí. Dọn dẹp: xoá lifecycle policy, xoá repository (phải xoá hết image trước hoặc force delete), xoá image thủ công.',
  examTip: `### Bẫy đề thi
- **ECR authentication dùng IAM token**, không phải username/mật khẩu Docker. Token hết hạn 12 giờ → trong CI/CD phải gọi get-login-password mỗi build.
- **Scan on push** quét image ngay khi push, kết quả lưu trong ECR; Enhanced scanning quét liên tục và gửi EventBridge alert khi có CVE mới. Đề "biết ngay khi image có lỗ hổng mới" → Enhanced + EventBridge.
- **Lifecycle policy** kiểm soát storage chi phí: ví dụ giữ 10 image mỗi branch, xoá untagged sau 7 ngày. Không cấu hình → storage tăng không kiểm soát.
- **Repository policy** kiểm soát ai có quyền push/pull cross-account (khác với IAM policy ở chính repository owner).`,
  ref: ['lab-081-ecr-repository', 'lab-082-ecr-image-tagging', 'lab-083-ecr-scan-on-push'],
},
{
  id: 'awslab-compute-006',
  category: 'compute',
  title: 'EKS cơ bản: Kubernetes cluster managed, node group, ingress qua ALB',
  level: 'senior',
  minutes: 55,
  exams: ['sap-c02'],
  domains: ['sap-d2', 'sap-d3'],
  services: ['EKS', 'EC2', 'Application Load Balancer', 'VPC CNI'],
  goal: 'Sau lab này bạn hiểu EKS (Amazon Elastic Kubernetes Service — Kubernetes managed: AWS quản lý control plane, bạn quản lý node worker), tạo cluster, managed node group (EC2 chạy worker, AWS điều phối), cài AWS Load Balancer Controller để Ingress tạo ALB tự động, đưa một ứng dụng Java lên pod. EKS phức tạp và vận hành nhiều hơn ECS — dùng khi đội đã rành Kubernetes, cần các công cụ Kubernetes (helm, operator) hoặc multi-cloud. Đề SAP/DOP: "nhiều micro-service phức tạp, đã dùng K8s" → EKS; "ít vận hành nhất" → ECS Fargate hoặc Lambda.',
  steps: [
    'Tạo EKS cluster: aws eks create-cluster --name lab-cluster --role-arn arn:aws:iam::111122223333:role/eks-cluster-role --resources-vpc-config subnetIds=subnet-xxx,subnet-yyy,securityGroupIds=sg-xxx. Chờ control plane active (vài phút).',
    'Cập nhật kubeconfig: aws eks update-kubeconfig --region ap-southeast-1 --name lab-cluster (cần aws-cli, eks-cli, kubectl).',
    'Tạo managed node group: aws eks create-nodegroup --cluster-name lab-cluster --nodegroup-name lab-node --subnet-ids subnet-xxx subnet-yyy --instance-types t3.medium --scaling-config minSize=1,maxSize=3,desiredSize=2 --ami-type AL2_x86_64. Chờ node join cluster.',
    'Cài AWS Load Balancer Controller qua Helm (cần IAM OIDC provider, IAM role cho controller với policy AWSLoadBalancerControllerIAMPolicy).',
    'Viết Kubernetes Deployment Spring Boot (replica 2, image từ ECR, port 8080) và Service (ClusterIP). Áp dụng: kubectl apply -f deployment.yaml,service.yaml.',
    'Tạo Ingress (k8s networking.k8s.io/v1) với annotation kubernetes.io/ingress.class: alb, AWS Load Balancer Controller tự tạo ALB và target group, pod được đăng ký làm target.',
    'Kiểm tra pod: kubectl get pods, kubectl logs <pod>. Truy cập DNS ALB từ Ingress status.',
  ],
  verify: [
    'aws eks describe-cluster --name lab-cluster trả về status ACTIVE, endpoint, version.',
    'kubectl get nodes hiển thị 2 node Ready (managed node group).',
    'kubectl get ingress hiển thị ALB DNS name (ADDRESS) sau vài phút, kubectl get svc pod có endpoint.',
    'Curl ALB DNS nhận 200 OK từ ứng dụng Java.',
  ],
  cost: 'EKS control plane khoảng 0.10 USD/giờ (không qua Free Tier) + EC2 worker node t3.medium (khoảng 0.0416 USD/gior/node) chạy liên tục. ALB từ Ingress khoảng 0.0225 USD/gior + LCU. Một cluster lab chạy 2-3 giờ tầm 1-2 USD, nhưng nếu quên tắt cả ngày có thể 10+ USD. Dọn dẹp BẮT BUỘC: xoá Ingress (tự xoá ALB), xoá Deployment/Service, xoá node group, xoá cluster EKS, xoá EC2 security group và VPC nếu tạo mới.',
  examTip: `### Bẫy đề thi
- **EKS control plane AWS quản lý** (upgrade, HA, etcd), bạn quản lý worker node, networking CNI, add-ons. Không quản lý control plane → ít vận hành hơn tự dựng K8s trên EC2, nhưng nhiều hơn ECS.
- **Node group managed** hỗ trợ auto scaling qua cluster autoscaler, update AMI tự động, taints/labels. Self-managed node bạn tự lo tất cả.
- **AWS Load Balancer Controller** tạo ALB/NLB từ Ingress resource (không phải Ingress của NGINX). Cần IAM role cho controller + OIDC provider trên cluster.
- **EKS vs ECS**: EKS nếu yêu cầu Kubernetes API, Helm, Operators, hybrid multi-cloud; ECS nếu AWS-native, ít vận hành. Đề nêu "đội bereits dùng Kubernetes" → EKS.`,
  ref: ['lab-071-eks-cluster', 'lab-072-eks-node-group', 'lab-075-eks-load-balancer-controller', 'lab-076-eks-ingress'],
},
{
  id: 'awslab-compute-007',
  category: 'compute',
  title: 'Lambda + SnapStart: chạy Java serverless, giảm cold start',
  level: 'senior',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'dop-d3'],
  services: ['Lambda', 'SnapStart', 'CloudWatch', 'IAM'],
  goal: 'Sau lab này bạn hiểu Lambda (chạy mã không quản lý server, trả theo milliseconds và số lần gọi), cold start (lần đầu gọi hoặc sau thời gian không dùng, JVM khởi tạo chậm → độ trễ cao, đặc biệt Java), SnapStart (tính năng AWS khởi tạo hàm một lần, chụp snapshot bộ nhớ, gọi tiếp khôi phục ngay → giảm cold start Java từ giây xuống percent milliseconds). Bạn viết hàm Java, deploy, bật SnapStart, đo thời gian gọi trước/sau. Đề SAP/DOP: "Java Lambda khởi động chậm" → SnapStart; "sự kiện-driven, ít vận hành" → Lambda.',
  steps: [
    'Viết hàm Java: class implements RequestHandler, dùng Amazon Corretto 17 runtime (java17 hoặc al2023 tùy region), xử lý event JSON trả về JSON.',
    'Tạo hàm Lambda: aws lambda create-function --function-name lab-java-fn --runtime java17 --role arn:aws:iam::111122223333:role/lambda-role --handler com.example.Handler::handleRequest --code S3Bucket=...,S3Key=... --memory-size 1024 --timeout 30.',
    'Gọi hàm lần đầu (cold start): aws lambda invoke --function-name lab-java-fn --invocation-type RequestResponse out.json và xem headers X-Amzn-Executed-Version + CloudWatch Logs duration.',
    'Bật SnapStart: aws lambda update-function-configuration --function-name lab-java-fn --snap-start ApplyOn=PublishedVersions. Lưu ý SnapStart áp cho published version + alias, không phải $LATEST.',
    'Publish phiên bản mới: aws lambda publish-version --function-name lab-java-fn, tạo alias prod trỏ phiên bản mới.',
    'Gọi qua alias prod nhiều lần, xem CloudWatch Logs: khởi động lần đầu chậm (init duration), gọi sau nhanh nhờ khôi phục snapshot. So sánh với hàm không bật SnapStart.',
    'Xem CloudWatch metric Duration, InitDuration, và lỗi SnapStartTimeout (nếu hàm khởi tạo quá thời gian chụp snapshot, thường 15 giây).',
  ],
  verify: [
    'aws lambda get-function-configuration --function-name lab-java-fn --qualifier prod hiển thị SnapStart: ApplyOn PublishedVersions, state On/Off.',
    'CloudWatch Logs group /aws/lambda/lab-java-fn có dòng Init Duration (lần đầu) và Duration thấp hơn các lần sau.',
    'aws lambda list-versions-by-function --function-name lab-java-fn có ít nhất 2 version, alias prod trỏ version mới.',
  ],
  cost: 'Lambda Free Tier: 1 triệu request và 400.000 GB-seconds tính toán miễn phí/tháng. Vừa vặn lab: dưới 1 USD. SnapStart không tính phí thêm (tính phí lưu snapshot nhỏ). Dọn dẹp: xoá alias, xoá phiên bản function, xoá hàm, xoá role IAM, log group.',
  examTip: `### Bẫy đề thi
- **Cold start Java** cao vì JVM nạp class, khởi tạo Spring context (nếu dùng Spring). SnapStart chụp bộ nhớ sau khi init xong, gọi tiếp khôi phục nhanh — lý tưởng cho Java, không chỉ Python/Node.js.
- **SnapStart chỉ áp published version + alias**. Gọi $LATEST không được lợi ích. Đề "gọi qua alias, giảm cold start" → SnapStart + PublishVersion + Alias.
- **SnapStart không hỗ trợ**: hàm dùng VPC ENI trước đây (hiện đã hỗ trợ nhiều trường hợp, nhưng kiểm tra latest), ephemeral storage lớn, state cục bộ trong hàm (snapshot chụp khi publish, state sau publish bị mất).
- **Provisioned Concurrency** giữ sẵn instance khởi tạo (trả phí cả khi không gọi) — dùng khi không thể chấp nhận cold start LA GIÂY, chứ không phải ms.
- **Lambda concurrent execution limit** (mặc định 1000/region) — burst quá nhiều bị throttle.`,
  ref: ['lab-76-toi-uu-cold-start-bang-cach-khoi-tao-aws-sdk-ngoai-lambda-function-handler', 'lab-67-toi-uu-hieu-nang-ung-dung-cpu-bound-tren-aws-lambda-bang-cach-tang-cau-hinh-memory', 'lab-56-quan-ly-phien-ban-va-rollback-tuc-thi-cho-aws-lambda-bang-function-versions-va-aliases', 'lab-121-dich-chuyen-luu-luong-lambda-bang-weighted-alias-traffic-shifting'],
},
{
  id: 'awslab-compute-008',
  category: 'compute',
  title: 'Elastic Beanstalk: triển khai Spring Boot không quản lý instance',
  level: 'senior',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'dop-d1'],
  services: ['Elastic Beanstalk', 'EC2', 'Application Load Balancer', 'Auto Scaling', 'CloudWatch'],
  goal: 'Sau lab này bạn hiểu Elastic Beanstalk (PaaS của AWS: bạn upload code/jar, AWS tự cấp EC2, cài đặt môi trường, chạy ALB, ASG, CloudWatch, bạn chỉ quan tâm code), tạo application + environment, chọn platform Java Corretto, triển khai jars, chọn chiến lược deployment rolling hoặc immutable (không downtime, tăng capacity gấp đôi rồi chuyển traffic), rollback nếu lỗi. Beanstalk phù hợp "đưa ứng dụng legacy lên AWS nhanh, ít vận hành", nhưng ít linh hoạt hơn ECS/EKS khi cần cấu hình chi tiết container. Đề: "ít vận hành nhất, triển khai ứng dụng web Java" → Elastic Beanstalk là đáp án nhanh.',
  steps: [
    'Tạo ứng dụng Beanstalk: console → Create application, chọn platform Java (Corretto 17), code đầu tiên là sample app.',
    'Tạo environment loại Web server environment (có ALB + ASG + EC2), chọn instance type t3.micro, VPC/subnet từ lab trước.',
    'Upload bản build Spring Boot (java -jar được Beanstalk chạy tự động nếu đặt manifest Procfile hoặc dùng jar duy nhất), hoặc dùng EB CLI: eb init, eb create lab-env.',
    'Xem môi trường vừa tạo: Beanstalk tự tạo ALB, ASG, security group, CloudWatch alarm. Đợi trạng thái Ready (green).',
    'Triển khai phiên bản mới: upload jar v2, chọn deployment policy Rolling with additional batch (giữ 100% capacity: launch batch mới, health check, rồi chuyển traffic, terminate batch cũ) hoặc Immutable (launch batch mới trong ASG tạm, chuyển traffic, xóa batch tạm).',
    'Quan sát health: console Enhanced health, /health endpoint, CloudWatch alarm. Nếu lỗi → Rollback về phiên bản trước trong vài cú click.',
    'Thử terminate một EC2: ASG thay thế tự động, Beanstalk tự healing.',
  ],
  verify: [
    'Beanstalk environment trạng thái Ready, màu xanh (ok), ALB DNS trả 200 OK.',
    'aws elasticbeanstalk describe-environments --application-name lab-app trả về status Ready, health Green.',
    'Sau deploy v2, các instance chạy jar mới (xem quá trình trong console deployment history).',
    'Rollback thành công: environment quay lại version trước, vẫn healthy.',
  ],
  cost: 'Beanstalk miễn phí (tiền trả cho EC2, ALB, CloudWatch log vốn chạy). t3.micro 2 instance Free Tier; ALB khoảng 0.0225 USD/gior. Dọn dẹp BẮT BUỘC: terminate environment (Beanstalk tự xoá ALB, ASG, EC2, security group), xoá application và các version jar trên S3 (beanstalk storage của bạn), xoá S3 bucket nếu không dùng nữa.',
  examTip: `### Bẫy đề thi
- **Elastic Beanstalk = PaaS quản lý EC2/ALB/ASG/CloudWatch**, bạn quản lý code và cấu hình environment. Đề "quản trị ít nhất, đưa app Java lên AWS nhanh" → Beanstalk.
- **Deployment policy**: All at once (nhanh nhất, có downtime), Rolling (cú lượt, ít downtime), Rolling with additional batch (không downtime, tốn gấp đôi capacity tạm thời), Immutable (không downtime, chậm nhất, launch ASG tạm). Đề chọn theo ràng buộc "không downtime + ít chi phí nhất" → Rolling with additional batch thường ổn hơn Immutable về chi phí.
- **Beanstalk không phải container-native**: có Docker platform nhưng ít điều khiển hơn ECS/EKS. Đề cần sidecar, service mesh, chính sách placement phức tạp → ECS/EKS.
- **Enhanced health monitoring** báo lý do instance degraded (health check fails, app deployment fails) — dùng để debug nhanh.`,
  ref: ['lab-84-tao-elastic-beanstalk-environment-voi-rolling-immutable-deployment', 'lab-33-cap-nhat-platform-node-js-khong-downtime-tren-elastic-beanstalk-bang-immutable-update', 'lab-12-chon-chien-luoc-trien-khai-nhanh-nhat-all-at-once-tren-aws-elastic-beanstalk', 'lab-69-trien-khai-elastic-beanstalk-giu-100-phan-tram-capacity-va-toi-uu-chi-phi-bang-rolling-with-additional-batch'],
},
{
  id: 'awslab-compute-009',
  category: 'compute',
  title: 'Blue/Green với CodeDeploy: triển khai không downtime, rollback tự động khi lỗi',
  level: 'senior',
  minutes: 50,
  exams: ['dop-c02', 'sap-c02'],
  domains: ['dop-d1', 'sap-d2', 'dop-d3'],
  services: ['CodeDeploy', 'Application Load Balancer', 'Auto Scaling', 'ECS', 'Lambda', 'CloudWatch'],
  goal: 'Sau lab này bạn hiểu blue/green deployment (blue = phiên bản cũ còn phục vụ, green = phiên bản mới chạy song song, testing rồi chuyển traffic qua green, xóa blue), CodeDeploy điều phối quá trình này cho EC2, Lambda, ECS, appspec.yml định nghĩa hooks (BeforeInstall, AfterInstall, ApplicationStart, ValidateService cho EC2; BeforeAllowTraffic, AfterAllowTraffic cho Lambda/ECS), automatic rollback khi CloudWatch alarm bật (ví dụ lỗi 5xx tăng). Đề DOP/SAP hay hỏi "không downtime + rollback nhanh nhất khi lỗi" → blue/green CodeDeploy; "giảm rủi ro từng phần" → canary/linear (xem card 010).',
  steps: [
    'Chuẩn bị ứng dụng Spring Boot đã build artifact (jar hoặc zip), upload lên S3 bucket artifact.',
    'Tạo CodeDeploy application (compute platform EC2/On-premises hoặc Lambda hoặc ECS), deployment group gán ASG/ALB (EC2) hoặc ECS service + ALB (ECS) hoặc Lambda alias.',
    'Viết appspec.yml (ví dụ EC2): hooks BeforeInstall (cài Java), ApplicationStart (chạy jar), ValidateService (curl health check), files từ S3 unpack vào /opt/app.',
    'Cấu hình automatic rollback: CloudWatch alarm trên metric HTTPCode_Target_5XX_Count của ALB hoặc Errors của Lambda, bật rollback khi alarm ALARM.',
    'Triển khai bản mới (deployment): CodeDeploy launch green fleet (instance mới), chạy hooks, ALB bắt đầu gửi traffic sang green sau khi healthy.',
    'Quan sát deployment lifecycle trong console; nếu alarm bật → CodeDeploy rollback tự động về blue, xem timeline sự kiện.',
    'Sau thành công, terminate blue fleet (ASG cũ) sau một thời gian barn-out.',
  ],
  verify: [
    'aws deploy list-deployments --application-name lab-app hiển thị deployment trạng thái Succeeded (hoặc Rolled back nếu có lỗi).',
    'Deployment detail có hook execution thành công (BeforeInstall, ApplicationStart, ValidateService).',
    'ALB target health toàn bộ healthy trên fleet green, traffic 100% green (xem target group registration).',
    'Nếu làm thử fail: cẩn cả ValidateService trả fail, deployment trạng thái Failed, rollback tự động, instance blue vẫn phục vụ.',
  ],
  cost: 'CodeDeploy EC2/On-premises miễn phí (tiền trả EC2, ALB). CodeDeploy Lambda/ECS miễn phí. CloudWatch alarm khoảng 0.10 USD/tháng. T3.micro 2-4 instance Free Tier. Dọn dẹp BẮT BUỘC: xoá deployment group, application, S3 artifact bucket, CloudWatch alarm, ASG, ALB.',
  examTip: `### Bẫy đề thi
- **Blue/green = phiên bản mới song song, chuyển traffic sau khi verify** → không downtime, rollback nhanh (đổi target group ngược). Rolling = thay thế dần trên cùng fleet → có khoảng downtime nhỏ, rollback chậm hơn.
- **AppSpec hooks khác theo nền tảng**: EC2 (BeforeInstall → ApplicationStart → ValidateService); Lambda (BeforeAllowTraffic → AfterAllowTraffic); ECS (BeforeInstall → AfterAllowTraffic). Đề nêu hook sai nền tảng → sai đáp án.
- **Automatic rollback** cần CloudWatch alarm trước; không có alarm → không rollback tự động.
- **Deployment configuration** (ví dụ CodeDeployDefault.AllAtOnce, Canary10Percent5Minutes, Linear10PercentEvery1Minute) kiểm soát tốc độ chuyển traffic. Đề "chuyển 10% traffic đầu, chờ 5 phút, nếu OK thì 100%" → Canary10Percent5Minutes.`,
  ref: ['lab-063-ecs-blue-green', 'lab-094-blue-green-compute', 'lab-40-tu-dong-trien-khai-lambda-an-toan-va-nhanh-nhat-bang-codedeploy-canary10percent5minutes', 'lab-93-trien-khai-canary-10-percent-30-minutes-cho-lambda-bang-aws-sam-va-codedeploy-hooks'],
},
{
  id: 'awslab-compute-010',
  category: 'compute',
  title: 'Canary deployment: chuyển dần traffic, tự rollback nếu lỗi',
  level: 'senior',
  minutes: 45,
  exams: ['dop-c02'],
  domains: ['dop-d1', 'dop-d3'],
  services: ['Lambda', 'CodeDeploy', 'ECS', 'CloudWatch', 'Route 53'],
  goal: 'Sau lab này bạn hiểu canary deployment (chuyển một phần nhỏ traffic, ví dụ 10%, sang phiên bản mới, quan sát metrics lỗi, nếu ổn thì tăng dần lên 100%, nếu lỗi thì rollback ngay — chỉ ảnh hưởng ít user), Lambda weighted alias (alias trỏ nhiều phiên bản với trọng số, ví dụ prod 90% v1 + 10% v2), ECS canary (task mới chạy song song, ALB chuyển phần traffic). Canary giảm rủi ro sai sót bản mới so với blue/green chuyển toàn bộ ngay. Đề DOP: "giảm rủi ro dần, theo % traffic" → canary/linear; "không downtime, rollback nhanh nhất" → blue/green.',
  steps: [
    'Publish Lambda function v2, tạo alias prod với weighted config: v1 weight 90, v2 weight 10 (aws lambda update-alias --function-name fn --name prod --routing-config AdditionalVersionWeights={"v2":0.1}).',
    'Gọi alias prod nhiều lần (ví dụ 100 request), xem CloudWatch: khoảng 10% request chạy v2 (X-Amzn-Executed-Version).',
    'Giả lập lỗi trong v2 (ném exception theo ý), gọi liên tục, xem metric Errors tăng và CloudWatch alarm bật.',
    'CodeDeploy/Lambda canary: deployment config Canary10Percent5Minutes (chuyển 10% đầu, chờ 5 phút) hoặc Linear10PercentEvery1Minute. Nếu alarm bật → rollback tự động về 100% v1.',
    'Nếu ổn: update-alias bỏ routing-config (v2 weight 100%) hoặc complete deployment, v2 nhận 100% traffic.',
    'ECS canary tương tự: task definition mới, service deployment với circuit breaker, CloudWatch alarm rollback nếu task unhealthy.',
  ],
  verify: [
    'aws lambda get-alias --function-name fn --name prod hiển thị RoutingConfig AdditionalVersionWeights (10% v2).',
    'CloudWatch metric Errors của alias có spike khi v2 lỗi, alarm trạng thái ALARM.',
    'Deployment trạng thái Succeeded (v2 100%) hoặc Rolled back (v1 100%) trong CodeDeploy/Lambda console.',
    'ECS: aws ecs describe-services runningCount theo các bản task, deployment circuit breaker bật (deployment failed → rollback).',
  ],
  cost: 'Lambda canary miễn phí thêm ngoài số lần gọi (Free Tier 1 triệu request). CloudWatch alarm khoảng 0.10 USD/tháng. ECS canary chạy task thêm trong thời gian canary → tính Fargate/EC2 thêm vài giờ. Dọn dẹp: xoá alias routing-config, xoá deployment group/application, ECS service, task definition cũ.',
  examTip: `### Bẫy đề thi
- **Canary = chuyển dần theo % traffic**, chỉ phần user nhỏ gặp bản mới → rủi ro thấp, nhưng cần surveillance metrics (error rate, latency) và quy định khi rollback.
- **Linear vs Canary**: Canary10Percent5Minutes (10% thì chờ 5 phút) vs Linear10PercentEvery1Minute (tăng 10% mỗi phút). Đề nêu chi tiết % và thời gian → chọn config khớp.
- **Weighted alias Lambda** dùng cho canary không cần CodeDeploy (đơn giản, chỉ Lambda). Đề chỉ Lambda + canary → weighted alias là đủ.
- **Traffic shifting vs Blue/green**: canary giữ cả hai phiên bản trong khoảng thời gian, blue/green chuyển toàn bộ sau verify. Đề "chậm rãi theo phần trăm" → canary.`,
  ref: ['lab-121-dich-chuyen-luu-luong-lambda-bang-weighted-alias-traffic-shifting', 'lab-064-ecs-canary-pattern', 'lab-095-canary-compute'],
},
{
  id: 'awslab-compute-011',
  category: 'compute',
  title: 'Multi-AZ compute & disaster recovery: chịu thất bại AZ, khôi phục sau sự cố',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d3', 'dop-d3'],
  services: ['EC2', 'Auto Scaling', 'Route 53', 'CloudWatch', 'S3'],
  goal: 'Sau lab này bạn hiểu Multi-AZ (chạy trên ít nhất 2 AZ để một AZ hỏng thì ứng dụng còn chạy), AZ là gì (một hoặc nhiều data center độc lập, điện, mạng riêng), cách thiết kế ASG multi-AZ (tự thay thế instance khi AZ bị sự cố), Route 53 failover giữa Region (pilot light / warm standby cho DR — Disaster Recovery: khôi phục dịch vụ sau thảm hoạ), RPO (Recovery Point Objective — lượng dữ liệu có thể mất, tính theo thời gian) và RTO (Recovery Time Objective — thời gian khôi phục dịch vụ). Đề SAP hay hỏi RPO/RTO: "RPO gần 0, RTO phút" → Aurora Global/ multi-AZ sync; "chi phí thấp, RTO vài giờ" → backup & restore/pilot light.',
  steps: [
    'Tạo ASG stretch 3 AZ (min 3, desired 3, max 6), launch template như card 001, target group ALB multi-AZ.',
    'Giả lập mất một AZ: trong console EC2, stop/terminate tất cả instance ở AZ-1 (hoặc tạm dùng AWS Fault Injection Simulator nếu có). Quan sát ASG tự launch instance ở AZ-2/AZ-3 để đạt desired capacity.',
    'ALB target health: instance AZ-1 out-of-service, AZ-2/3 healthy, traffic vẫn qua ALB.',
    'Tạo S3 bucket chứa backup cấu hình (launch template, user data, script build) — cơ sở pilot light (cơ sở tối thiểu luôn chạy, scale lên khi cần).',
    'Tuỳ chọn: tạo Route 53 health check cho endpoint Region chính, record failover PRIMARY/SECONDARY trỏ ALB của 2 Region (nếu có 2 Region, mô phỏng bằng health check và đọc cấu hình).',
    'Ghi bảng so sánh: multi-AZ trong 1 Region (RPO 0 cho stateless, RTO phút) vs pilot light cross-Region (RPO minutes-hours, RTO hours) vs backup & restore (chi phí thấp nhất, RTO nhiều giờ).',
  ],
  verify: [
    'aws autoscaling describe-auto-scaling-groups thấy instance phân bố 3 AZ, sau khi mất AZ-1 thì ASG launch thêm ở AZ-2/3.',
    'ALB describe-target-health: instance AZ-2/3 healthy, traffic curl ALB vẫn 200 OK.',
    'S3 bucket có backup artifacts; aws s3 ls thấy file cấu hình.',
    'Route 53 health check state healthy/unhealthy khớp với trạng thái endpoint (nếu tạo).',
  ],
  cost: 'Multi-AZ trong 1 Region: không tính phí thêm cho AZ, nhưng chạy ít nhất 3 instance t3.micro (Free Tier covers 750 giờ/tháng). Route 53 health check 0.50 USD/tháng/c.check. Cross-Region DR thêm chi phí S3 replication, ALB ở Region thứ hai. Dọn dẹp BẮT BUỘC: xoá ASG, ALB, launch template, S3 bucket backup, Route 53 health check/record, EC2/VPC.',
  examTip: `### Bẫy đề thi
- **AZ ≠ Region**: AZ là data center độc lập trong Region; Region là vùng địa lý (ví dụ ap-southeast-1 Singapore). Multi-AZ = cùng Region, khác AZ; multi-Region = khác quốc gia/khu vực, chi phí và độ trễ cao hơn.
- **Stateless multi-AZ** dễ (ASG + ALB); database multi-AZ cần RDS Multi-AZ hoặc Aurora (xem lab RDS).
- **RPO/RTO**: RPO = data loss acceptable (0 = đồng bộ), RTO = downtime acceptable. Đề "RPO seconds, RTO minutes" → multi-AZ sync hoặc Aurora Global; "chi phí thấp nhất, chấp nhận RTO 24 giờ" → backup & restore từ S3.
- **Pilot light**: component quan trọng (database) luôn chạy nhỏ, phần còn lại scale khi sự cố — trung gian giữa chi phí và tốc độ khôi phục.
- **ASG rebalancing**: sau AZ thay lại ổn định, ASG không tự rebalance instance về AZ cũ ngay (tránh flapping) — biết để đọc đề điều khiển.`,
  ref: ['lab-092-multi-az-compute', 'lab-097-disaster-recovery-compute', 'lab-098-compute-observability'],
},
{
  id: 'awslab-compute-012',
  category: 'compute',
  title: 'Tối ưu chi phí compute & capacity planning: Compute Optimizer, Budgets, Savings Plans',
  level: 'senior',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d3', 'dop-d3'],
  services: ['EC2', 'Compute Optimizer', 'Budgets', 'Savings Plans', 'Cost Explorer'],
  goal: 'Sau lab này bạn hiểu cách theo dõi chi phí compute (Cost Explorer nhóm theo service, instance type, purchase type), Compute Optimizer phân tích lịch sử sử dụng CPU/memory và khuyến nghị resize instance (rightsizing: downsize instance quá lớn, đổi generation mới), Savings Plans (cam kết dùng 1/3 năm, giảm 30-66% so với On-Demand) và Reserved Instances (chỉ EC2, giảm cao nhưng ít linh hoạt), AWS Budgets cảnh báo ngưỡng chi phí. Đề SAP/DOP: "giảm chi phí compute ít thay đổi kiến trúc" → Compute Optimizer + Savings Plans; "quản trị chi phí tổ chức" → Budgets + tag allocation + consolidated billing.',
  steps: [
    'Mở Cost Explorer, lọc Last 30 days, group by Service rồi by Instance Type: tìm 3 khoản compute lớn nhất (thường là EC2, ALB, NAT).',
    'Bật Compute Optimizer (opt-in) và đọc khuyến nghị: instance quá lớn (utilization CPU < 40% liên tiếp) → downsizing; instance cũ (m4, t2) → đổi m6g/t3g (Graviton) giảm 20-40% chi phí.',
    'Tạo AWS Budget: ngưỡng 50 USD/tháng, alert email khi chi phí dự đoán vượt ngưỡng, type Cost budget.',
    'Tìm Savings Plans recommendations trong Cost Explorer: Compute Savings Plans 1 năm No Upfront giảm khoảng 30% so với On-Demand, áp dụng tự động cho EC2/Lambda/Fargate.',
    'Thử thay đổi ASG mixed instances: On-Demand base 1 + Spot phần còn lại, 3 loại instance, 3 AZ (như card 003) và theo dõi chi phí giảm bao nhiêu.',
    'Ghi bảng quyết định: workload ổn định 24/7 → Savings Plans/Reserved Instances; workload burst, chịu gián đoạn → Spot; workload không rõ hạn → On-Demand + Compute Optimizer theo dõi.',
  ],
  verify: [
    'Cost Explorer báo cáo hiển thị chi phí EC2 theo instance type, có thể tính tổng.',
    'Compute Optimizer dashboard có khuyến nghị (nếu dữ liệu đủ 30-60 ngày; tài khoản mới có thể trống — đọc hiểu giao diện).',
    'AWS Budget đã tạo, trạng thái Active, ngưỡng và email alert đúng.',
    'ASG mixed instances policy chạy, xem spot expenditure trong Cost Explorer giảm so với toàn On-Demand.',
  ],
  cost: 'Cost Explorer UI miễn phí; API Compute Optimizer miễn phí. AWS Budgets miễn phí 2 budget đầu, sau đó 0.02 USD/bucket/tháng. Savings Plans là cam kết thanh toán (không huỷ được), chỉ chọn khi chắc workload ổn định. Dọn dẹp: xoá budget nếu không cần, giữ tags; không cần xoá khuyến nghị Compute Optimizer.',
  examTip: `### Bẫy đề thi
- **Compute Optimizer** khuyến nghị dựa lịch sử 14 ngày-60 ngày, chỉ đúng khi có đủ dữ liệu. Đề tài khoản mới không có dữ liệu → không khuyến nghị được.
- **Savings Plans Compute** áp EC2 + Lambda + Fargate, linh hoạt đổi region/instance family; EC2 Instance Savings Plans giảm nhiều hơn nhưng gắn loại instance, region. RI (Reserved Instances) chỉ EC2, giảm nhất nhưng ít linh hoạt nhất.
- **Spot** giảm 60-90% nhưng có thể bị thu hồi → chỉ workload chịu gián đoạn. Đề "giảm chi phí tối đa, workload batch đêm cuối tuần" → Spot + Scheduled scaling.
- **Tag allocation** + Cost Allocation Tags là tiền đề để chi trả theo team/project trong consolidated billing (Organizations). Không tag → không phân bổ chi phí được.
- **Right-sizing** (downsize instance quá lớn) tiết kiệm nhanh nhất, không cần cam kết hợp đồng dài hạn.`,
  ref: ['lab-091-compute-cost-baseline', 'lab-096-capacity-planning', 'lab-030-asg-cost-control'],
},
{
  id: 'awslab-ops-001',
  category: 'ops',
  title: 'CloudWatch Metrics & Alarm',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d3', 'dop-d4'],
  services: ['CloudWatch', 'SNS', 'EC2'],
  goal: 'Sau lab này bạn hiểu CloudWatch metric là chỉ số đo đạc (ví dụ CPUUtilization là tỷ lệ CPU đang dùng) của dịch vụ AWS, cách tạo alarm (cảnh báo) khi metric vượt ngưỡng, và cách gửi thông báo qua SNS (Simple Notification Service — dịch vụ gửi tin nhắn/email). Đây là kỹ năng căn bản của vận hành và hay xuất hiện trong đề SAP/DOP về chủ đề監 sát và cảnh báo (Monitoring and Logging).',
  steps: [
    'Chọn một EC2 instance đã chạy (t3.micro nằm trong Free Tier cho lab). CloudWatch tự thu thập metric CPUUtilization mỗi 5 phút (basic monitoring) hoặc mỗi 1 phút nếu bật detailed monitoring.',
    'Mở CloudWatch → Alarms → Create alarm → Chọn metric EC2 → CPUUtilization của instance lab.',
    'Đặt điều kiện: Static, greater than, 80 (%), mỗi 5 phút, ít nhất 1 datapoint (một giá trị metric tại một thời điểm). Nghĩa: nếu CPU trên 80% trong 5 phút liên tiếp thì alarm bật.',
    'Chọn hành động: tạo SNS topic lab-ops-alarm, tạo subscription Email với địa chỉ email của bạn. AWS gửi email xác nhận, bạn phải nhấn Confirm Subscription trong email đó.',
    'Đặt tên alarm lab-cpu-alarm, thêm mô tả, bật alarm actions, rồi tạo alarm.',
    'Gây tải CPU để thử: kết nối EC2 (qua Session Manager card ops-004), chạy lệnh làm tăng CPU (trên Linux: yes > /dev/null & trong vài cửa sổ terminal).',
    'Xem CloudWatch console: alarm chuyển trạng thái OK sang ALARM, bạn nhận email cảnh báo. Dừng lệnh tải, alarm quay lại OK sau đủ số lần đánh giá.',
  ],
  verify: [
    '{{aws cloudwatch describe-alarms --alarm-names lab-cpu-alarm}} trả về StateValue: ALARM (khi đang gây tải) và OK (sau khi dừng).',
    'Email đã nhận có chủ đề AWS Notification - ... ALARM và link chuyển đến console alarm.',
    'Console CloudWatch → Alarms hiển thị alarm với trạng thái và biểu đồ metric kèm đường ngưỡng 80%.',
  ],
  cost: 'CloudWatch alarm khoảng 0.10 USD/tháng cho mỗi metric alarm. SNS subscription qua email miễn phí (SMS tốn theo từng tin nhắn). EC2 t3.micro trong Free Tier. Dọn dẹp bắt buộc: xoá alarm, xoá SNS topic và subscription, stop hoặc terminate instance lab để tránh phí compute.',
  examTip: `### Bẫy đề thi
- Trạng thái alarm: OK, ALARM, INSUFFICIENT_DATA (chưa đủ dữ liệu, ví dụ vừa tạo mới hoặc metric không đến). Đề hay hỏi "alarm vẫn INSUFFICIENT_DATA sau khi tạo" → bình thường, đợi đủ evaluation period.
- Evaluation period là số lần liên tiếp metric vượt ngưỡng mới báo alarm (mặc định 1). Datapoint là một giá trị metric tại một thời điểm.
- Alarm action có thể gửi SNS, thực hiện Auto Scaling action, hoặc ghi vào Systems Manager OpsCenter. Đề "cảnh báo team vận hành" → SNS email.
- Composite alarm (xem lab-59) kết hợp nhiều alarm, chỉ báo động khi toàn bộ điều kiện thỏa mãn, giảm báo động giả.`,
  ref: ['lab-58-tao-cloudwatch-alarm-gui-thong-bao-qua-sns', 'lab-59-tao-composite-alarm-khi-nhieu-metric-cung-vuot-nguong', 'lab-60-cai-cloudwatch-agent-de-thu-thap-memory-va-disk-metrics', 'lab-61-tao-cloudwatch-dashboard-cho-ec2-alb-rds'],
},
{
  id: 'awslab-ops-002',
  category: 'ops',
  title: 'CloudWatch Logs & Logs Insights',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['dop-d4', 'sap-d3'],
  services: ['CloudWatch Logs', 'SNS', 'Lambda'],
  goal: 'Sau lab này bạn hiểu log group (tổ chức chứa log) và log stream (luồng log của một instance/ứng dụng), cách cài CloudWatch Agent để EC2 gửi log lên CloudWatch, viết truy vấn Logs Insights để untersucht lỗi, và chuyển log thành metric để báo alarm. Kỹ năng này trả lời câu hỏi phỏng vấn "làm sao biết ứng dụng lỗi mà không đăng nhập vào từng máy".',
  steps: [
    'EC2 instance cần IAM instance profile gán managed policy CloudWatchAgentServerPolicy (cho phép instance nói chuyện với CloudWatch Logs).',
    'Cài CloudWatch Agent trên EC2 (Amazon Linux: yum install amazon-cloudwatch-agent), tạo file cấu hình chọn file log /var/log/messages và bộ đếm memory/disk.',
    'Khai báo agent bằng amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:..., rồi khởi động lại agent.',
    'Mở CloudWatch → Log groups: nhóm log mới xuất hiện (ví dụ /var/log/messages), bên trong có log stream theo instance ID.',
    'Viết Logs Insights query trên log group: fields @timestamp, message | filter message like /ERROR/ | stats count() by bin(5m). Chạy qua Last 1 giờ, xem số lỗi theo từng khung 5 phút.',
    'Tạo metric filter trên log group cho log JSON (ví dụ pattern lọc trường status bằng 500), tạo metric ApiErrors, gắn alarm khi metric lớn hơn 5 trong 5 phút gửi SNS.',
  ],
  verify: [
    'Console Log groups có log stream của instance, nhấn vào stream xem nội dung log thực (ví dụ dòng log CROND hoặc log ứng dụng).',
    'Logs Insights query trả bảng có cột @timestamp, message và số dòng khớp lớn hơn 0 nếu có log lỗi.',
    '{{aws cloudwatch describe-metric-filters --log-group-name /var/log/messages}} hiển thị tên filter và metric đã tạo.',
  ],
  cost: 'CloudWatch Logs ingestion khoảng 0.50 USD/GB, lưu trữ 0.03 USD/GB/tháng. Lab với vài MB log tốn dưới vài cent. Alarm 0.10 USD/tháng. Dọn dẹp: xoá metric filter, alarm, log group, dừng agent hoặc terminate EC2.',
  examTip: `### Bẫy đề thi
- Metric filter trích số liệu từ log (ví dụ đếm dòng có mã status 500) rồi đưa vào CloudWatch metric để báo alarm. Logs Insights chỉ truy vấn ad-hoc, không tự tạo metric.
- Cú pháp Insights: fields (chọn trường), filter (lọc), stats (tổng hợp theo thời gian bin), sort, limit. Đề hay cho query và hỏi kết quả trả về gì.
- Log group có thời gian lưu giữ (retention), mặc định lưu mãi nếu không đặt → tốn phí lâu dài. Đề "giảm chi phí lưu log" → đặt retention 30/60/90 ngày hoặc xuất sang S3 + Athena.
- CloudWatch Agent thu thập hệ thống (memory, disk) mà metric cơ bản của EC2 không có (chỉ CPU, mạng, disk ở mức host).`,
  ref: ['lab-60-cai-cloudwatch-agent-de-thu-thap-memory-va-disk-metrics', 'lab-62-tao-cloudwatch-logs-metric-filter-tu-application-log', 'lab-63-dung-cloudwatch-synthetics-canary-kiem-tra-url-nhu-nguoi-dung-that', 'lab-17-thu-thap-va-quan-ly-log-tap-trung-tu-nhieu-ec2-bang-unified-cloudwatch-agent'],
},
{
  id: 'awslab-ops-003',
  category: 'ops',
  title: 'EventBridge',
  level: 'senior',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['dop-d5', 'dop-d1', 'sap-d2'],
  services: ['EventBridge', 'Lambda', 'EC2', 'SNS'],
  goal: 'Sau lab này bạn hiểu EventBridge là "bưu chính sự kiện": dịch vụ A phát sự kiện (event) xuống bus, rule lọc sự kiện theo mẫu (pattern) hoặc lịch trình, gửi đến target (Lambda, SNS, SQS, Step Functions) mà dịch vụ gửi và nhận không cần biết nhau (loose coupling). Kiến trúc sự kiện này hay xuất hiện trong đề DOP về "phản ứng sự kiện tự động".',
  steps: [
    'Mở EventBridge → Rules → Create rule. Chọn loại rule: Event pattern (sự kiện từ dịch vụ AWS) hoặc Schedule (lập lịch).',
    'Rule 1 (event pattern): Event source AWS services, Event type EC2 Instance State-change Notification, chỉ nhận sự kiện của instance lab, target là SNS topic lab-event-email (email subscription đã xác nhận).',
    'Rule 2 (schedule): Schedule rate(5 phút) hoặc cron(...), target là hàm Lambda ghi log "chạy định kỳ" vào CloudWatch Logs.',
    'Thay đổi trạng thái instance lab (stop/start qua console): rule 1 gửi sự kiện → SNS → email bạn trong vài giây.',
    'Xem CloudWatch metric Events → Invocations của rule (số lần rule kích hoạt), và DLQ (hang đợi thư tử phong) nếu target Lambda thất bại.',
    'Tuỳ chọn: dùng Input Transform để trích trường instance-id từ sự kiện và gửi nội dung email tùy chỉnh thay vì JSON thô.',
  ],
  verify: [
    '{{aws events list-rules --name-prefix lab-}} hiển thị rule lab-event-ec2 và lab-schedule với State: ENABLED.',
    'Email nhận được khi instance thay đổi trạng thái, nội dung có instance ID và thời điểm.',
    'Amazon CloudWatch metric Invocations của rule tăng sau mỗi lần kích hoạt.',
  ],
  cost: 'Sự kiện từ dịch vụ AWS (ví dụ EC2 state change) miễn phí. Sự kiện tùy chỉnh (custom event qua PutEvents) khoảng 1.00 USD/get triệu sự kiện. SNS email miễn phí. Lambda trong Free Tier. Lab tốn dưới 1 USD. Dọn dẹp: xoá rule (xoá target cùng lúc), SNS topic, Lambda function, log group.',
  examTip: `### Bẫy đề thi
- EventBridge kết hợp dịch vụ không cần biết nhau: producer chỉ gửi sự kiện vào bus, consumer đăng ký rule. Điều này là loose coupling, khác gọi API trực tiếp (chặt chẽ hơn).
- Một rule chỉ có EITHER event pattern HOẶC schedule, không cùng lúc. Mỗi rule có tới 5 target.
- Event archive lưu sự kiện trong 180 ngày (tuỳ chọn), cho phép replay lại sự kiện cũ để chạy lại rule — đề hay hỏi "xử lý lại sự kiện đã bỏ lỡ".
- Schema Registry trích cấu trúc sự kiện thành schema để code dễ xử lý, schemas được discovery tự động miễn phí.`,
  ref: ['lab-64-tao-eventbridge-rule-bat-su-kien-ec2-state-change', 'lab-92-tao-lambda-xu-ly-event-tu-eventbridge', 'lab-18-kich-hoat-aws-lambda-tu-s3-object-created-event-bang-amazon-eventbridge-rule'],
},
{
  id: 'awslab-ops-004',
  category: 'ops',
  title: 'Systems Manager Session Manager',
  level: 'mid',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['dop-d2', 'sap-d1'],
  services: ['SSM', 'EC2', 'IAM'],
  goal: 'Sau lab này bạn hiểu Systems Manager (SSM) là tập hợp công cụ quản lý EC2 và hệ thống on-premises, trong đó Session Manager cho phép truy cập terminal EC2 private không cần SSH, không cần bastion host (máy nhảy có public IP mở port 22), và toàn bộ session được ghi log để kiểm toán. Đây là câu trả lời hay cho đề "quản lý hàng nghìn EC2 không mở port 22".',
  steps: [
    'Launch EC2 (Amazon Linux 2023, t3.micro) ở private subnet, không public IP, gán IAM instance profile có managed policy AmazonSSMManagedInstanceCore (cho phép instance nói chuyện với SSM).',
    'Khởi động instance, chờ SSM Agent chạy (máy khách của SSM trên instance). Mở Systems Manager → Fleet Manager: instance xuất hiện trạng thái Online sau vài phút.',
    'Session Manager → Start session → chọn instance → mở terminal trên trình duyệt, chạy lệnh (whoami, uptime, yum list installed) mà không cần SSH key, không mở port 22.',
    'Bật ghi log session: Session Manager preferences → chọn S3 bucket hoặc CloudWatch Logs group để lưu toàn bộ lệnh đầu ra (audit trail, bằng chứng ai chạy lệnh gì, khi nào).',
    'Tuỳ chọn: port forwarding bằng AWS CLI session-manager-plugin, cổng local 8080 trỏ đến cổng 8080 của instance private, truy cập ứng dụng qua localhost.',
    'Kết thúc session, xem log session trong S3/CloudWatch để xác nhận đã ghi nhận.',
  ],
  verify: [
    '{{aws ssm describe-instance-information --instance-ids i-xxx}} trả về PingStatus: Online và AgentVersion.',
    'Console Session Manager có session active, terminal phản hồi lệnh.',
    'S3 bucket hoặc CloudWatch log group có file session log của instance lab.',
  ],
  cost: 'SSM core (Session Manager, Fleet Manager, Run Command) miễn phí. Chi phí: EC2 instance (Free Tier t3.micro), CloudWatch Logs/S3 lưu session log (ít). Không cần bastion EC2 chạy 24/7 → tiết kiệm khoảng 15-20 USD/tháng nếu dùng t3.medium làm bastion. Dọn dẹp: terminate instance, xoá S3 bucket/log group lưu session.',
  examTip: `### Bẫy đề thi
- Session Manager thay bastion host: giảm bề mặt tấn công (không port 22 mở), không quản lý SSH key, toàn session được ghi log kiểm toán.
- Instance private subnet không cần NAT Gateway cho Session Manager nếu có VPC endpoint interface: com.amazonaws.<region>.ssm, ec2messages, ssmmessages (xem lab-49 trong card VPC endpoint).
- IAM instance profile phải có AmazonSSMManagedInstanceCore; nếu thiếu → instance không xuất hiện trong Fleet Manager.
- Session Manager hỗ trợ port forwarding và chạy lệnh mà không đăng nhập interactive — đáp ứng đề "quản lý đám mây hàng ngàn instance không SSH".`,
  ref: ['lab-85-dung-systems-manager-session-manager-de-ket-noi-ec2-private', 'lab-86-gan-iam-instance-profile-va-ssm-agent-de-instance-xuat-hien-trong-session-manager', 'lab-042-session-manager'],
},
{
  id: 'awslab-ops-005',
  category: 'ops',
  title: 'Systems Manager Patch Manager',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['dop-d2'],
  services: ['SSM', 'EC2'],
  goal: 'Sau lab này bạn hiểu Patch Manager tự động quét và cài đặt bản vá (patch) cho hệ điều hành EC2: patch baseline quy định bản vá nào được duyệt/từ chối, patch group (gán qua tag) nhóm instance dùng cùng baseline, maintenance window là cửa sổ thời gian cho phép tác vụ chạy, và compliance báo cáo tỷ lệ instance đã đáp ứng chuẩn bảo mật. Đề DOP hay hỏi "cách tự động vá bảo mật hàng loạt EC2".',
  steps: [
    'Có ít nhất 2 EC2 đã được SSM quản lý (card ops-004), gán tag Patch Group = lab-prod cho cả hai.',
    'Systems Manager → Patch Manager → Create patch baseline: chọn Amazon Linux 2023, duyệt tất cả cập nhật bảo mật (security), từ chối các cập nhật tính năng không cần thiết, lưu làm mặc định.',
    'Tạo Maintenance Window: tên lab-mw, lịch chạy mỗi Chủ Nhật 02:00, thời lượng 3 giờ, đăng ký target bằng tag Patch Group=lab-prod.',
    'Đăng ký tác vụ cài đặt bản vá (Install/update) vào maintenance window, chọn patch baseline lab.',
    'Chạy Patch Scan (quét) thủ công trên instance, xem Patch Compliance: Missing (chưa cài), Installed (đã cài), Failed (thất bại).',
    'Chờ maintenance window chạy hoặc khởi động ngay, xem lại compliance sau khi patch.',
  ],
  verify: [
    '{{aws ssm describe-patch-groups --patch-group lab-prod}} hiển thị instance thuộc nhóm.',
    '{{aws ssm list-compliance-items --resource-ids i-xxx}} trả về compliance status (COMPLIANT/NON_COMPLIANT) và severity.',
    'Console Patch Manager compliance dashboard hiển thị tỷ lệ instance compliant theo nhóm.',
  ],
  cost: 'SSM Patch Manager miễn phí. Chi phí compute khi instance chạy scan/cài đặt (Free Tier), SNS nếu thông báo. Dọn dẹp: xoá maintenance window, patch baseline tùy chỉnh (baseline mặc định không xoá), terminate instance lab.',
  examTip: `### Bẫy đề thi
- Patch baseline quy định bản vá nào được duyệt hoặc từ chối (theo severity, sản phẩm, phân loại). Một patch group (gán qua tag) chỉ dùng một baseline tại một thời điểm.
- Maintenance Window là cửa sổ bảo trì (khoảng thời gian cho phép tác vụ chạy) — tránh ảnh hưởng giờ cao điểm.
- Patch Manager báo compliance, không tự ép instance reboot trừ bạn cấu hình. Đề "tuân thủ bảo mật, báo cáo instance chưa vá" → Patch Manager kết hợp AWS Config.
- Cần SSM Agent và instance profile như Session Manager (card ops-004).`,
  ref: ['lab-88-patch-ec2-bang-systems-manager-patch-manager', 'lab-044-patch-manager'],
},
{
  id: 'awslab-ops-006',
  category: 'ops',
  title: 'Systems Manager Parameter Store',
  level: 'mid',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['dop-d2'],
  services: ['SSM', 'KMS', 'Secrets Manager'],
  goal: 'Sau lab này bạn hiểu Parameter Store là kho lưu cấu hình và bí mật tập trung: lưu theo đường dẫn phân cấp (ví dụ /prod/app/db/url), phân biệt String (văn bản thuần) và SecureString (mã hoá bằng KMS, chỉ giải mã khi có quyền kms:Decrypt). So sánh với Secrets Manager (trả phí nhưng có xoay vòng mật khẩu tự động) giúp chọn đúng dịch vụ trong đề.',
  steps: [
    'Mở Systems Manager → Parameter Store → Create parameter: tên /lab/app/db/url, loại String, giá trị jdbc:mysql://db.lab.internal:3306/app, thêm mô tả và tag App=lab.',
    'Tạo parameter /lab/app/db/password, loại SecureString, chọn KMS key (aws/ssm mặc định hoặc customer managed key), nhập mật khẩu thực. SecureString được mã hoá khi lưu và chỉ giải mã khi có quyền kms:Decrypt.',
    'Tạo parameter phân cấp /prod/app/db/url và /dev/app/db/url để thấy cấu hình theo môi trường, hiểu tiền tố đường dẫn giúp gán IAM policy theo nhóm (ví dụ cho phép lấy /dev/* nhưng không /prod/*).',
    'Truy cập từ EC2 qua CLI: aws ssm get-parameter --name /lab/app/db/password --with-decryption (cần quyền ssm:GetParameter và kms:Decrypt).',
    'Tuỳ chọn: lưu ý tham chiếu parameter trong CloudFormation dùng dynamic reference {{resolve:ssm:/lab/app/db/url:1}} (chỉ lưu ý cú pháp, không triển khai stack thật cho lab).',
  ],
  verify: [
    '{{aws ssm get-parameters --names /lab/app/db/password --with-decryption}} trả về Parameter với Value là giá trị thật sau khi giải mã.',
    '{{aws ssm describe-parameters --filters Key=Name,Values=/lab/app/*}} hiển thị cả 3 parameter theo tiền tố phân cấp.',
    'CloudTrail sự kiện ssm:GetParameter và kms:Decrypt có userIdentity là bạn (kiểm tra audit, xem card ops-009).',
  ],
  cost: 'Parameter Store Standard parameter miễn phí trong ngưỡng (10.000 parameter, tổng dung lượng 1 GB). Advanced parameter 0.05 USD/tháng/parameter cộng phí gọi API. KMS customer managed key 1 USD/tháng (nếu tạo). Dọn dẹp: xoá parameter, lịch trình xoá key KMS customer (7-30 ngày), terminate EC2.',
  examTip: `### Bẫy đề thi
- Parameter Store: miễn phí/rẻ, thích hợp lưu cấu hình chung (connection string, license key). Secrets Manager: trả phí (0.40 USD/tháng/mật secret) nhưng có xoay vòng mật khẩu (rotation) tự động cho RDS và sinh mật khẩu mạnh ngẫu nhiên. Đề "cần xoay mật khẩu DB định kỳ" → Secrets Manager; "lưu config miễn phí" → Parameter Store.
- Đường dẫn phân cấp (/prod/app/...) giúp gán IAM policy theo tiền tố, ví dụ cho phép ssm:GetParameter trên /dev/* nhưng không /prod/*.
- SecureString cần KMS key; lấy parameter cross-account cần key policy KMS và IAM policy cả hai bên (giống card KMS tuần 7).`,
  ref: ['lab-047-parameter-store-ec2', 'lab-02-quan-ly-bien-moi-truong-va-thong-tin-xac-thuc-ung-dung-ecs-voi-parameter-store-va-secrets-manager', 'lab-117-bao-mat-du-lieu-khoi-tao-ec2-bang-ssm-parameter-store-securestring-va-cloudformation-dynamic-references'],
},
{
  id: 'awslab-ops-007',
  category: 'ops',
  title: 'SSM State Manager, Automation & Incident Manager',
  level: 'senior',
  minutes: 50,
  exams: ['dop-c02', 'sap-c02'],
  domains: ['dop-d5'],
  services: ['SSM'],
  goal: 'Sau lab này bạn hiểu State Manager áp dụng cấu hình mong muốn (desired state) định kỳ (ví dụ cài gói, chỉnh file config) để chống "trôi cấu hình" (configuration drift); Automation là runbook nhiều bước (chụp snapshot, sửa cài đặt, restart) có bước phê duyệt aws:approve; Incident Manager quản lý vòng đời sự cố (khai báo severity, lên lịch escalation, bài review sau sự cố). Ba công cụ cùng giúp tự động hóa vận hành và giảm MTTR (thời gian khôi phục trung bình).',
  steps: [
    'State Manager: tạo association dùng tài liệu AWS-RunShellScript, target instance lab (bằng tag), lệnh cài gói (ví dụ yum install -y htop), lịch mỗi 30 phút. Nếu instance bị thay đổi cấu hình (gỡ gói), lần chạy tiếp theo khôi phục lại theo association.',
    'Xem trạng thái association: Success/Failed, đầu ra từng bước lưu trong S3/CloudWatch.',
    'Automation: tạo tài liệu automation (YAML/JSON) 2 bước: bước 1 chụp snapshot EBS hoặc AMI, bước 2 aws:approve (chờ người duyệt) trước khi restart instance. Thực hiện automation, xem trạng thái từng bước.',
    'Incident Manager: tạo replication set (mặc định), tạo response plan lab-incident, định nghĩa severity và liên hệ escalation (SNS email).',
    'Mô phỏng sự cố: CloudWatch alarm CPU > 80% → EventBridge rule → tạo incident trong Incident Manager. Chạy runbook khẩn cấp từ incident, ghi timeline, đo MTTR.',
    'Post-incident review: ghi nguyên nhân, hành động cải tiến vào bản ghi incident.',
  ],
  verify: [
    '{{aws ssm describe-association --association-id <id>}} trả về AssociationStatus: Success.',
    '{{aws ssm describe-automation-executions --filters Key=ExecutionStatus,Values=Success}} hiển thị automation đã chạy thành công.',
    'Console Incident Manager có incident lab-incident với trạng thái và timeline các sự kiện.',
  ],
  cost: 'SSM core miễn phí. AMI/EBS snapshot từ automation tốn lưu trữ EBS snapshot (khoảng 0.05 USD/GB-tháng). Incident Manager tính phí theo sự cố/item được quản lý (vài cent lab), có ngưỡng miễn phí. Dọn dẹp: xoá association, automation document, incident/response plan, xoá snapshot AMI.',
  examTip: `### Bẫy đề thi
- State Manager chống "trôi cấu hình": instance bị đổi cấu hình ngoài ý muốn sẽ được khôi phục theo association định kỳ.
- Automation document là runbook nhiều bước (chụp snapshot, sửa cài đặt, restart) có bước aws:approve cần con người nhấn duyệt trước khi tiếp tục — phù hợp thao tác rủi cao.
- Incident Manager quản lý vòng đời sự cố: khai báo severity, mở war room (tích hợp Chatbot/SSM), ghim timeline, bài review sau sự cố. Đề "giảm MTTR" → automation + runbook được chuẩn hóa trước khi sự cố xảy ra.`,
  ref: ['lab-045-state-manager', 'lab-046-automation-document', 'lab-049-ssm-incident-response', 'lab-050-ssm-operations-review'],
},
{
  id: 'awslab-ops-008',
  category: 'ops',
  title: 'AWS Config rules & remediation',
  level: 'senior',
  minutes: 45,
  exams: ['dop-c02', 'sap-c02'],
  domains: ['dop-d6', 'sap-d1'],
  services: ['Config', 'SSM', 'SNS'],
  goal: 'Sau lab này bạn hiểu AWS Config ghi lại cấu hình tài nguyên (configuration item: tài nguyên trông như thế nào, ai thay đổi, khi nào), dùng managed rule (ví dụ s3-bucket-public-read-prohibited) để đánh giá tuân thủ, và gắn remediation tự động bằng SSM Automation để sửa cấu hình sai. Kết hợp CloudTrail (gọi API gì) và Config (trạng thái tài nguyên) là nền tảng kiểm toán và root-cause sự cố.',
  steps: [
    'Bật AWS Config recorder: chọn ghi các loại tài nguyên cần thiết (S3 bucket, EC2, security group) để giảm phí, chọn S3 bucket lưu configuration snapshot và SNS topic thông báo.',
    'Thêm managed rule s3-bucket-public-read-prohibited: Config đánh giá bucket, bất kỳ bucket cho phép public read đều NON_COMPLIANT.',
    'Gắn remediation tự động: tài liệu SSM Automation AWS-DisableS3BucketPublicReadWrite, gán IAM role cho Automation có quyền sửa bucket.',
    'Cố tình cho phép public access read trên bucket test (chỉ lab, không chứa dữ liệu thật): đợi Config đánh giá (vài phút), thấy NON_COMPLIANT, rồi remediation tự động tắt public access.',
    'Tạo EventBridge rule: sự kiện Config Rules Compliance Change (NON_COMPLIANT) → SNS thông báo on-call email.',
    'Xem Config dashboard: tỷ lệ compliant/non-compliant, lịch sử thay đổi cấu hình của bucket (configuration item).',
  ],
  verify: [
    '{{aws configservice describe-config-rules --config-rule-names s3-bucket-public-read-prohibited}} trả về State: ACTIVE.',
    '{{aws configservice get-compliance-details-by-config-rule --config-rule-name s3-bucket-public-read-prohibited}} trả về ComplianceType: NON_COMPLIANT trước khi sửa, COMPLIANT sau.',
    'EventBridge rule đã trigger (metric Invocations lớn hơn 0) và email đã gửi.',
  ],
  cost: 'Config tính phí theo configuration item (mỗi thay đổi cấu hình được ghi) và rule evaluation (vài cent đến dưới 1 USD cho lab). S3 lưu snapshot, SNS email miễn phí. Dọn dẹp: xoá remediation, rule, dừng Config recorder (stop configuration recorder) và xoá delivery channel nếu không dùng, xoá S3 bucket lưu snapshot.',
  examTip: `### Bẫy đề thi
- Config ghi lại "ai thay đổi gì, khi nào" của tài nguyên AWS — cần cho kiểm toán và root-cause sự cố (CloudTrail card ops-009 ghi API call, Config ghi trạng thái tài nguyên).
- Managed rule do AWS viết sẵn (s3-bucket-public-read-prohibited, restricted-ssh…), custom rule viết bằng Lambda. Remediation tự động dùng SSM Automation.
- Config Aggregator tổng hợp config từ nhiều account/Region về một account aggregator — đề hay hỏi "quan sát tuân thủ toàn tổ chức".
- Phân biệt rõ: CloudTrail = log gọi API, Config = trạng thái tài nguyên, CloudWatch = hiệu năng (CPU, latency).`,
  ref: ['lab-76-tao-aws-config-managed-rule-kiem-tra-tag-bat-buoc', 'lab-77-cau-hinh-aws-config-remediation-bang-systems-manager-automation'],
},
{
  id: 'awslab-ops-009',
  category: 'ops',
  title: 'CloudTrail',
  level: 'senior',
  minutes: 40,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['dop-d4', 'dop-d6', 'sap-d1'],
  services: ['CloudTrail', 'Athena', 'S3', 'EventBridge'],
  goal: 'Sau lab này bạn hiểu CloudTrail ghi lại mọi lời gọi API vào tài khoản AWS (ai gọi API gì, khi nào, từ IP nào), tạo organization trail để tập trung log từ tất cả member account vào bucket log archive của tổ chức, và truy vấn log bằng Athena. Đây là công cụ kiểm toán bắt buộc và hay ra đề SAP/DOP về bảo mật, tuân thủ và Untersuch nguyên nhân sự cố.',
  steps: [
    'Mở CloudTrail → Trails → Create trail: tên lab-trail, áp dụng cho tất cả Region (lấy sự kiện toàn vùng), quản lý sự kiện (management events) Read/Write.',
    'Chọn S3 bucket lưu log (tạo mới, gán bucket policy cho phép CloudTrail ghi), bật mã hoá SSE-KMS với CMK lab, bật log file validation (xác thực tính chính xác của log).',
    'Quan trọng đối với tổ chức: tạo organization trail từ account quản trị (management account): log của tất cả member account tập trung vào bucket log archive, member không thể tắt trail.',
    'Truy tìm sự kiện: CloudTrail → Event history, lọc tên sự kiện (ví dụ CreateBucket, RunInstances, ConsoleLogin) xem ai, khi nào, từ IP nào.',
    'Truy vấn log bằng Athena: tạo bảng trên S3 bucket CloudTrail (định dạng JSON, partition theo Region/Year/Month/Day), chạy SELECT eventname, useridentity.principalid, eventtime WHERE eventsource = s3.amazonaws.com.',
    'Tạo EventBridge rule: sự kiện API nhạy cảm (ví dụ DeleteTrail, StopLogging, CreateAccessKey) → SNS cảnh báo bảo mật.',
  ],
  verify: [
    '{{aws cloudtrail describe-trails}} trả về TrailARN, IsLogging: true, S3BucketName đúng.',
    'S3 bucket có thư mục AWSLogs/<account-id>/CloudTrail/<region>/<year>/<month>/<day>/ chứa file .json.gz.',
    'Athena query trả rows có eventName và userIdentity khớp với hành động bạn vừa làm (ví dụ bạn tạo bucket lab).',
  ],
  cost: 'CloudTrail: bản sao đầu tiên của management events miễn phí (mỗi Region), trail/bản sao thêm trả 2.00 USD/get ngàn sự kiện ghi lại. Data events (thao tác dữ liệu S3, invoke Lambda) trả phí riêng. Athena 5 USD/TB dữ liệu quét (lab vài MB, partition đúng → dưới 1 cent). S3 lưu log ít. Dọn dẹp: xoá trail (không xoá bucket nếu muốn giữ log), xoá Athena table, Athena workgroup lab.',
  examTip: `### Bẫy đề thi
- Management events: các API gọi quản lý (tạo EC2, đổi IAM) — mặc định ghi. Data events: thao tác dữ liệu (GET/PUT object S3, invoke Lambda) — phải bật thêm, trả phí, dùng cho kiểm toán truy cập dữ liệu nhạy cảm.
- Organization trail: quản trị từ account quản trị, áp dụng tất cả member, logs tập trung — đáp ứng "logging tập trung toàn tổ chức" trong đề SAP/DOP.
- CloudTrail Insights: phát hiện hoạt động API bất thường (ví dụ spike RunInstances) tự động, tốn thêm phí.
- CloudTrail = log gọi API (ai gọi API gì), Config = trạng thái tài nguyên (tài nguyên trông như thế nào), CloudWatch = hiệu năng (CPU, latency).`,
  ref: ['lab-66-bat-cloudtrail-organization-trail', 'lab-67-truy-van-cloudtrail-log-bang-athena', 'lab-68-tim-nguyen-nhan-thay-doi-tai-nguyen-bang-cloudtrail-event-history'],
},
{
  id: 'awslab-ops-010',
  category: 'ops',
  title: 'Organizations & SCP',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'dop-d6'],
  services: ['Organizations', 'IAM'],
  goal: 'Sau lab này bạn hiểu multi-account trên AWS: Organizations quản lý nhiều tài khoản trong một tổ chức, OU (organizational unit) nhóm tài khoản (Sandbox, Production, Development), SCP (service control policy) là deny-list chỉ cấm hành động (không cấp quyền), áp dụng cho tất cả principal trong account kể cả root. SCP là guardrail (ranh giới an toàn) cho toàn tổ chức và hay xuất hiện trong đề SAP về phân quyền đa tài khoản.',
  steps: [
    'Từ account quản trị, mở AWS Organizations → Create organization (all features). Tạo OU: Sandbox, Production, Development.',
    'Tạo member account mới trong OU Sandbox (dùng email alias, không phải email chính).',
    'Bật IAM Identity Center (xem card ops-012), tạo user và gán quyền qua permission set vào member account.',
    'Viết SCP deny-list: chặn mọi Region trừ ap-southeast-1 và us-east-1, và chặn hành động xoá CloudTrail/StopLogging. Gắn SCP cho OU Sandbox.',
    'Đăng nhập vào member account Sandbox với quyền Administrator (qua Identity Center), thử launch EC2 ở eu-west-1: nhận AccessDenied ngay cả khi là admin — vì SCP hoạt động ở cấp tổ chức, trên cả IAM policy.',
    'Xem Effective policy trong Organizations: SCP của OU kết hợp với SCP của root (nếu có).',
  ],
  verify: [
    '{{aws organizations list-accounts}} hiển thị account mới trong OU Sandbox, trạng thái ACTIVE.',
    '{{aws organizations list-policies-for-target --target-id <ou-id> --filter SERVICE_CONTROL_POLICY}} hiển thị SCP đã gắn.',
    'CloudTrail event history của member account có sự kiện unauthorized (AccessDenied) khi thử launch Region bị chặn.',
  ],
  cost: 'Organizations và SCP miễn phí. Member account riêng bắt đầu tính phí theo tài nguyên chạy (EC2, S3…), nên dọn sạch tài nguyên lab trong member account. Control Tower (ref lab-80) miễn phí nhưng bật Config/CloudTrail có chi phí đi kèm.',
  examTip: `### Bẫy đề thi
- SCP là deny-list (chỉ cấm), KHÔNG cấp quyền. Quyền thực tế = giao của IAM policy (cho phép) và SCP (không cấm). Explicit Deny trong SCP thắng mọi Allow.
- SCP áp dụng cho mọi principal trong account kể cả root user (trừ những principal được specially exempt, ví dụ service-linked role).
- SCP không ảnh hưởng đến account quản trị (management account) trừ khi bạn chọn áp dụng cho nó.
- Hình ảnh multi-account chuẩn doanh nghiệp: Organizations (quyền tổ chức) + IAM Identity Center (đăng nhập) + SCP (guardrail).`,
  ref: ['lab-79-tao-aws-organizations-scp-chan-hanh-dong-khong-mong-muon', 'lab-80-provision-account-baseline-bang-aws-control-tower-account-factory'],
},
{
  id: 'awslab-ops-011',
  category: 'ops',
  title: 'Incident response runbook (SSM Incident Manager)',
  level: 'senior',
  minutes: 45,
  exams: ['dop-c02'],
  domains: ['dop-d5'],
  services: ['SSM', 'EventBridge', 'CloudWatch'],
  goal: 'Sau lab này bạn hiểu Incident Manager quản lý vòng đời sự cố vận hành: khai báo severity (Critical/High/Low), lên lịch escalation (ai nhận thông báo, khi nào), chạy runbook khẩn cấp (SSM Automation), ghi timeline và viết post-incident review (bài hậu sự cố, không tìm người sai lầm mà tìm quy trình sai). Kết hợp EventBridge (phát hiện) → Incident Manager (quản lý) → SSM Automation (sửa tự động) là mẫu phản ứng sự cố tự động của DOP.',
  steps: [
    'Incident Manager: tạo replication set (mặc định), tạo response plan lab-incident, chọn severity Critical/High, đăng liên hệ on-call (SNS email hoặc chat).',
    'Tạo Runbook (tài liệu SSM Automation) khẩn cấp: bước 1 chụp snapshot EBS/EBS volume bị ảnh hưởng, bước 2 aws:approve (phê duyệt trước khi tác động), bước 3 restart instance hoặc scale thêm instance qua Auto Scaling group.',
    'Kết nối CloudWatch alarm (CPU > 90% hoặc error rate cao) với EventBridge rule, target là tạo incident trong Incident Manager (hoặc gửi SNS cho on-call khai báo thủ công).',
    'Mô phỏng: tạo sự tích lỗi trên ứng dụng lab, alarm bật → incident được tạo (hoặc tạo thủ công qua console), on-call nhận thông báo.',
    'Vào incident, chạy runbook khẩn cấp, ghi timeline (khi nào phát hiện, khi nào bắt đầu xử lý, khi nào khôi phục), tính MTTR (mean time to recovery).',
    'Post-incident review: ghi nguyên nhân gốc (root cause), hành động ngắn hạn (khôi phục dịch vụ) và dài hạn (sửa code, thêm alarm, chaos testing).',
  ],
  verify: [
    'Console Incident Manager có incident lab-incident với trạng thái (Open/Resolved) và severity đã chọn.',
    'Timeline có các sự kiện: incident created, runbook started, runbook completed kèm timestamp.',
    '{{aws ssm describe-automation-executions --filters Key=AutomationExecutionStatus,Values=Success}} hiển thị runbook đã chạy thành công.',
  ],
  cost: 'Incident Manager tính phí theo sự cố/item được quản lý (vài cent đến vài USD lab) cộng tài nguyên đi kèm (SNS, snapshot EBS). CloudWatch alarm 0.10 USD/tháng. Dọn dẹp: resolve rồi xoá incident/response plan, replication set nếu tạo thêm, automation document, snapshot.',
  examTip: `### Bẫy đề thi
- MTTR (mean time to recovery) = thời gian trung bình từ phát hiện đến khôi phục dịch vụ. Runbook chuẩn hóa trước giúp giảm MTTR khi đang stress.
- Severity (Critical/High/Low) quyết định mức độ lên lịch escalation và ai được thông báo. Đề về incident response → runbook + escalation + post-mortem.
- Post-incident review (post-mortem) không tìm người chịu trách nhiệm (blameless) mà tìm quy trình sai và cải tiến hệ thống.
- Kết hợp EventBridge (phát hiện sự kiện) → Incident Manager (quản lý sự cố) → SSM Automation (sửa tự động) là mẫu tự động hóa phản ứng sự cố của DOP.`,
  ref: ['lab-049-ssm-incident-response', 'lab-099-network-incident-response-runbook', 'lab-099-compute-incident-runbook'],
},
{
  id: 'awslab-ops-012',
  category: 'ops',
  title: 'IAM Identity Center & truy cập đa tài khoản',
  level: 'senior',
  minutes: 45,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'dop-d6'],
  services: ['IAM Identity Center', 'Organizations'],
  goal: 'Sau lab này bạn hiểu AWS IAM Identity Center (trước đây gọi AWS Single Sign-On) là cổng truy cập duy nhất cho con người: tạo user/group, permission set (template vai trò tự động tạo trong từng account target), truy cập qua AWS Access Portal, vào nhiều account mà không cần tạo IAM user riêng mỗi account. Kết hợp với Organizations và SCP (card ops-010) là hình ảnh phân quyền đa tài khoản chuẩn doanh nghiệp.',
  steps: [
    'Bật AWS IAM Identity Center trong account quản trị của Organizations, chọn một Region duy nhất cho Identity Center.',
    'Tạo user (ví dụ dev-lab) và group (Developers) trong Identity Center store (hoặc kết nối external identity provider như Microsoft AD/OneLogin — chỉ nắm khái niệm).',
    'Tạo permission set: AdministratorAccess (quản trị đầy đủ trong account) và ReadOnlyAccess (chỉ xem), gán vào group Developers cho member account Sandbox (card ops-010).',
    'dev-lab đăng nhập vào AWS Access Portal (URL https://d-xxx.awsapps.com/start), thấy danh sách account được gán, nhấn vào account → mở Management Console với quyền của permission set (không cần mật khẩu root hay IAM user riêng mỗi account).',
    'Qua portal, dev-lab chọn role tương ứng permission set để vào console member account, verify thấy tài nguyên của account đó (hoặc AccessDenied nếu attempt Region bị chặn bởi SCP card ops-010).',
    'Tuỳ chọn: thêm ứng dụng SAML 2.0 (ví dụ một công cụ nội bộ) vào Identity Center để đăng nhập duy nhất SSO.',
  ],
  verify: [
    '{{aws ssoadmin list-permission-sets --instance-arn <arn>}} hiển thị permission set đã tạo.',
    'Access Portal đăng nhập thành công, danh sách account hiển thị đúng theo gán quyền.',
    'CloudTrail sự kiện AssumeRole (bằng STS) từ portal có userIdentity là dev-lab qua Identity Center.',
  ],
  cost: 'IAM Identity Center miễn phí (tính năng cốt lõi không tính phí theo người dùng); chi phí đi kèm là tài nguyên AWS khi sử dụng. External identity provider (SAML) có thể tốn phí bên nhà cung cấp. Dọn dẹp: xoá permission set, user/group, tắt Identity Center (cẩn thận: sẽ làm mất quyền truy cập portal của tất cả user).',
  examTip: `### Bẫy đề thi
- Best practice AWS: không tạo IAM user cho con người mỗi account; dùng IAM Identity Center + permission set + access portal (đăng nhập một lần, vào nhiều account).
- SCP (card ops-010) vẫn áp dụng trên mọi quyền đi qua Identity Center — Identity Center cấp quyền truy cập, SCP đặt ranh giới cho phép/cấm.
- Permission set là template IAM role được Identity Center tự tạo trong từng account target; bạn không cần tạo role thủ công mỗi account.
- Phân biệt: IAM user (mã credentials dài hạn, không khuyến khích), IAM role (tạm thời, assume), Identity Center (đăng nhập con người đa account).`,
  ref: ['lab-79-tao-aws-organizations-scp-chan-hanh-dong-khong-mong-muon', 'lab-80-provision-account-baseline-bang-aws-control-tower-account-factory'],
},
{
  id: 'awslab-dev-001',
  category: 'dev',
  title: 'CodePipeline CI/CD cho Java: source, build, approval, deploy',
  level: 'senior',
  minutes: 50,
  exams: ['dop-c02'],
  domains: ['dop-d1', 'dop-d2'],
  services: ['CodePipeline', 'CodeBuild', 'CodeArtifact', 'CodeDeploy', 'CodeStar Connections'],
  goal: 'Sau lab này bạn dựng được pipeline 3 stage Source → Build → Deploy cho ứng dụng Java Maven, hiểu artifact store, IAM role từng stage và manual approval. Đây là dạng bài DOP-C02 hỏi nhiều nhất: dịch vụ nào làm việc gì, pipeline lưu artifact ở đâu, và vì sao CodePipeline không tự chạy Maven.',
  steps: [
    'Tạo artifact bucket riêng: bật versioning, mã hoá SSE-KMS, block public access; bucket phải cùng Region với pipeline. Bucket policy cho pipeline role ghi/đọc và cho build role đọc source artifact.',
    'Tạo connection tới GitHub bằng CodeStar Connections (hoặc dùng CodeCommit), hoàn tất bước authorise trong console. Connection là đối tượng cấp tài khoản, có thể tái dùng cho nhiều pipeline.',
    'Tạo CodeArtifact domain và repository maven-internal, thêm upstream repository trỏ public:maven-central. Lấy token bằng aws codeartifact get-authorization-token và cấu hình settings.xml để Maven tải dependency nội bộ lẫn Maven Central qua CodeArtifact.',
    'Viết buildspec.yml: runtime-versions java corretto21, cache đường dẫn ~/.m2/repository, phase build chạy mvn -B clean verify, reports JUnit cho target/surefire-reports, artifacts là target/app.jar.',
    'Tạo CodeBuild project với service role tối thiểu: quyền CodeArtifact read, S3 artifact, CloudWatch Logs. Chỉ bật privileged mode khi build cần chạy Docker daemon.',
    'Tạo CodeDeploy application và deployment group cho EC2 theo tag hoặc cho Lambda alias. Deploy EC2 cần cài CodeDeploy agent và gắn instance profile; deploy Lambda cần alias live.',
    'Tạo pipeline role, khai báo 3 stage Source, Build, Deploy; chèn Manual approval giữa Build và Deploy, gắn SNS topic để gửi email cho người duyệt.',
    'Push một commit để trigger pipeline; theo dõi log CodeBuild trong CloudWatch, xem artifact zip trong S3 và lịch sử deployment trong CodeDeploy.',
    'Thử reject approval để thấy pipeline dừng trước Deploy, rồi approve để chạy tiếp. Sau đó cố ý làm test fail để xác nhận stage Deploy không bao giờ chạy khi Build đỏ.'
  ],
  verify: [
    '{{aws codepipeline get-pipeline-state --name java-pipeline}} trả về trạng thái từng stage và stage đang dừng ở approval.',
    '{{aws s3 ls s3://artifact-bucket/java-pipeline/}} thấy các object zip do pipeline tạo ra sau mỗi lần chạy.',
    '{{aws codebuild list-builds-for-project --project-name java-build}} có build Succeeded; tab Reports hiển thị số test pass/fail.',
    '{{aws deploy list-deployments --application-name java-app --deployment-group-name java-dg}} có deployment Succeeded và revision đúng commit.'
  ],
  cost: 'CodePipeline V2 tính theo phút action execution, một pipeline nhỏ chạy vài chục giây mỗi lần nên chỉ vài cent; CodeBuild có Free Tier 100 phút/tháng với general1.small; CodeArtifact tính theo GB-tháng và số request; S3, SNS, CloudWatch vài cent. Lab dưới 1 USD nếu dọn ngay. Dọn dẹp: xoá pipeline, CodeBuild project, CodeDeploy application và deployment group, CodeStar connection, CodeArtifact domain (xoá repository/package trước), artifact bucket, SNS topic và log group.',
  examTip: `### Bẫy đề thi
- CodePipeline chỉ điều phối (orchestration): build/test do CodeBuild, deploy do CodeDeploy hoặc CloudFormation. Đề hỏi dịch vụ nào chạy Maven thì đáp án là CodeBuild, không phải CodePipeline.
- Artifact store phải cùng Region với pipeline. Pipeline cross-Region cần replicate bucket artifact hoặc tách pipeline theo từng Region.
- Cross-account: pipeline role assume role ở account đích; bucket policy và KMS key policy phải cho cả hai account; action deploy dùng role của account đích.
- Manual approval không tự timeout, có thể gắn SNS để gửi email; approve/reject bằng {{aws codepipeline put-approval-result}}. CodeArtifact là repository/proxy cho Maven, không phải nơi chạy build.`,
  ref: ['lab-102-quan-ly-va-tich-hop-thu-vien-java-tap-trung-trong-codepipeline-bang-aws-codeartifact', 'lab-58-tich-hop-chay-unit-test-va-test-reports-tu-dong-trong-codepipeline-bang-aws-codebuild'],
},
{
  id: 'awslab-dev-002',
  category: 'dev',
  title: 'CodeBuild buildspec: cache, biến môi trường, test report',
  level: 'senior',
  minutes: 45,
  exams: ['dop-c02'],
  domains: ['dop-d1', 'dop-d2'],
  services: ['CodeBuild', 'SSM Parameter Store', 'Secrets Manager', 'S3', 'CloudWatch Logs'],
  goal: 'Sau lab này bạn viết được buildspec.yml đúng chuẩn production: tách phase, cache Maven, lấy cấu hình từ Parameter Store, lấy mật khẩu từ Secrets Manager và xuất báo cáo JUnit. Đây là kỹ năng DOP-C02 hay hỏi vì một buildspec sai làm pipeline chậm, lộ secret hoặc báo xanh giả.',
  steps: [
    'Tạo buildspec.yml version 0.2 với các phase install, pre_build, build, post_build. Khai báo runtime-versions java corretto21 để CodeBuild dùng đúng JDK thay vì JDK mặc định.',
    'Khai báo env.variables cho cấu hình không nhạy cảm (AWS_REGION, APP_ENV) và env.parameter-store trỏ tới /myapp/db/url. Parameter Store phù hợp cấu hình dạng chuỗi, có version và audit.',
    'Khai báo env.secrets-manager trỏ ARN secret và JSON key password. Giá trị secret được đưa vào biến môi trường lúc runtime và bị che trong log; không in giá trị này ra.',
    'Bật cache S3 cho ~/.m2/repository để các build sau không tải lại toàn bộ dependency. Dùng cache namespace riêng khi thay đổi lớn để tránh cache bẩn.',
    'Trong phase build chạy mvn -B clean verify; phase post_build xuất báo cáo JUnit XML và đóng gói jar. Báo cáo phải đúng format JUnit thì tab Reports mới hiển thị.',
    'Khai báo artifacts files target/app.jar, discard-paths yes, để artifact nhỏ và đường dẫn ổn định cho stage deploy.',
    'Gắn service role tối thiểu: ssm:GetParameters (và kms:Decrypt nếu SecureString), secretsmanager:GetSecretValue, quyền đọc/ghi bucket cache và artifact, quyền ghi CloudWatch Logs.',
    'Nếu build cần kết nối RDS private để chạy integration test, cấu hình VPC và security group. Build trong VPC phải có NAT Gateway hoặc VPC endpoint cho S3, ECR, CloudWatch Logs, SSM, Secrets Manager, nếu không build sẽ treo rồi timeout.',
    'Chạy build hai lần: lần đầu tải dependency, lần sau kiểm tra log cache và thời gian giảm; mở tab Reports xem số test; tải artifact về kiểm tra.'
  ],
  verify: [
    'Log build hiển thị giá trị parameter bình thường nhưng secret bị che bằng dấu sao; không có mật khẩu thật trong log.',
    '{{aws codebuild batch-get-builds --ids build-id}} trả về phases SUCCEEDED và thông tin cache hit của lần chạy sau.',
    'Tab Reports của project hiển thị đúng số test và thời gian chạy; file JUnit XML nằm trong target/surefire-reports.',
    '{{aws s3 ls s3://artifact-bucket/}} có artifact jar mới, kích thước hợp lý và không chứa thư mục target lồng nhau.'
  ],
  cost: 'CodeBuild on-demand khoảng 0.005 USD/phút cho general1.small (tuỳ Region), có Free Tier 100 phút/tháng; S3 cache/artifact và CloudWatch Logs vài cent. Lab dưới 1 USD. Dọn dẹp: xoá CodeBuild project, log group, S3 bucket cache/artifact, SSM parameter, secret (force delete nếu là secret lab) và IAM role.',
  examTip: `### Bẫy đề thi
- {{parameter-store}} đọc từ SSM Parameter Store; SecureString cần thêm quyền {{kms:Decrypt}}. Đọc secret từ Secrets Manager phải dùng block {{secrets-manager}}, không trộn với parameter-store.
- Biến môi trường trong buildspec có giới hạn kích thước; nhiều biến hoặc giá trị dài nên để trong SSM/Secrets Manager thay vì nhồi hết vào env.
- Build trong VPC mà không có NAT hoặc VPC endpoint sẽ timeout khi tải dependency; đây là lỗi production rất hay gặp.
- Test report chỉ hiển thị khi file đúng JUnit XML; report group sai đường dẫn thì tab Reports trống dù test đã chạy.`,
  ref: ['lab-42-lay-thong-tin-xac-thuc-database-an-toan-trong-codebuild-buildspec-bang-secrets-manager', 'lab-85-vuot-gioi-han-bien-moi-truong-trong-codebuild-bang-ssm-parameter-store', 'lab-58-tich-hop-chay-unit-test-va-test-reports-tu-dong-trong-codepipeline-bang-aws-codebuild'],
},
{
  id: 'awslab-dev-003',
  category: 'dev',
  title: 'CodeDeploy blue/green và canary cho ECS/Lambda',
  level: 'senior',
  minutes: 50,
  exams: ['dop-c02'],
  domains: ['dop-d1', 'dop-d3'],
  services: ['CodeDeploy', 'ECS', 'Lambda', 'Application Load Balancer', 'CloudWatch Alarms'],
  goal: 'Sau lab này bạn biết dịch chuyển traffic từng phần (canary/linear) cho Lambda alias và ECS task set, gắn CloudWatch alarm để tự rollback. Đây là phần DOP-C02 hỏi rất kỹ vì liên quan trực tiếp đến zero-downtime và tự động phục hồi.',
  steps: [
    'Tạo Lambda v1 và alias live; publish version 2. CodeDeploy chỉ dịch chuyển traffic trên alias, không bao giờ tác động trực tiếp vào $LATEST.',
    'Tạo CodeDeploy application platform Lambda và deployment group trỏ tới alias live, chọn deployment config LambdaCanary10Percent5Minutes.',
    'Viết AppSpec cho Lambda với hook BeforeAllowTraffic và AfterAllowTraffic gọi một validation function; hook AfterAllowTraffic nên kiểm tra lỗi nghiệp vụ trước khi cho phép 100% traffic.',
    'Tạo CloudWatch alarm theo dõi Errors hoặc Throttles của alias/version mới và gắn vào deployment group. Nếu alarm đang ở trạng thái ALARM trước khi deploy, deployment sẽ fail ngay.',
    'Chạy create-deployment; theo dõi alias routing config: 5 phút đầu 10% traffic sang version 2, sau đó 100% nếu không có alarm.',
    'Làm version 2 trả lỗi hoặc làm validation hook fail; quan sát CodeDeploy rollback alias về version 1 và ghi event tương ứng.',
    'Với ECS: tạo service sau ALB có hai target group blue/green, một listener production và một listener test; tạo CodeDeploy application platform ECS.',
    'Tạo deployment group ECS trỏ cluster, service, listener và target group; deploy task definition revision mới, chọn config ECSCanary10Percent5Minutes, quan sát hai task set và trọng số traffic.',
    'So sánh với rolling update native của ECS: rolling update thay task dần dần, còn blue/green giữ nguyên môi trường cũ để rollback tức thời; CodeDeploy cần thiết khi muốn blue/green có kiểm soát traffic.'
  ],
  verify: [
    '{{aws deploy get-deployment --deployment-id d-XXXX}} có status Succeeded và deploymentStyle là BLUE_GREEN.',
    '{{aws lambda get-alias --function-name orders --name live}} trong lúc deploy hiển thị RoutingConfig với additionalVersionWeight 0.1, sau đó về 1.0 cho version mới.',
    '{{aws deploy list-deployment-history --application-name orders-app --deployment-group-name orders-dg}} thấy lần rollback với status Failed và revision cũ.',
    'Target group blue/green đều healthy trước khi chuyển traffic; alarm chuyển ALARM khi version mới lỗi.'
  ],
  cost: 'CodeDeploy miễn phí cho Lambda và ECS; chi phí là Lambda, ECS task, ALB, CloudWatch alarm (0.10 USD/alarm/tháng) và data transfer. Blue/green tạm thời chạy gấp đôi capacity nên kiểm tra quota và chi phí. Dọn dẹp: xoá deployment group/application, alias version cũ, ECS service/task set, ALB, target group, alarm và log group.',
  examTip: `### Bẫy đề thi
- Lambda canary/linear chỉ đổi trọng số trên alias; $LATEST không được dùng cho production vì không có version cố định để rollback.
- ECS blue/green bắt buộc ALB/NLB và hai target group; không hỗ trợ classic load balancer. CodeDeploy quản lý task set thay vì service tự rolling.
- Deployment config phổ biến: AllAtOnce, Canary10Percent5Minutes, Canary10Percent15Minutes, Linear10PercentEvery1Minute. Đề cho traffic 10% trong 5 phút là canary.
- CloudWatch alarm phải cùng Region với deployment group; alarm đã ở ALARM trước khi bắt đầu sẽ làm deployment fail ngay. Rollback chỉ đưa traffic về version cũ, không sửa code hay revert migration database.`,
  ref: ['lab-063-ecs-blue-green', 'lab-064-ecs-canary-pattern', 'lab-40-tu-dong-trien-khai-lambda-an-toan-va-nhanh-nhat-bang-codedeploy-canary10percent5minutes', 'lab-93-trien-khai-canary-10-percent-30-minutes-cho-lambda-bang-aws-sam-va-codedeploy-hooks'],
},
{
  id: 'awslab-dev-004',
  category: 'dev',
  title: 'CloudFormation: change set, drift, rollback an toàn',
  level: 'senior',
  minutes: 50,
  exams: ['dop-c02', 'sap-c02'],
  domains: ['dop-d2', 'sap-d2'],
  services: ['CloudFormation', 'IAM', 'EC2', 'RDS', 'S3'],
  goal: 'Sau lab này bạn cập nhật hạ tầng bằng change set, đọc drift, xử lý rollback và bảo vệ tài nguyên bằng stack policy, DeletionPolicy. Đây là nhóm câu DOP-C02 và SAP-C02 về IaC: làm sao thay đổi production mà không xoá nhầm database.',
  steps: [
    'Viết template có Parameters Env, Mappings RegionAmi, Conditions IsProd, một EC2, security group và IAM role có tên cố định. Dùng pseudo parameter AWS::Region để chọn AMI đúng Region.',
    'Tạo stack bằng create-stack; nếu template tạo IAM role có tên thì phải truyền CAPABILITY_NAMED_IAM, nếu không sẽ gặp lỗi InsufficientCapabilities.',
    'Sửa template: đổi instance type và thêm ingress rule. Tạo change set bằng create-change-set, đọc describe-change-set để xem action Add/Modify/Remove trước khi execute.',
    'Execute change set và xác nhận stack UPDATE_COMPLETE; so sánh resource trước và sau bằng describe-stack-resources.',
    'Cố ý đặt AMI ID không tồn tại rồi update-stack; stack sẽ rollback về trạng thái trước. Đọc tab Events để tìm resource gây lỗi và thông báo lỗi gốc.',
    'Thử update-stack với --disable-rollback để giữ tài nguyên lỗi phục vụ debug; nhớ đây chỉ là thao tác lab, production nên để rollback mặc định.',
    'Chạy detect-stack-drift, sau đó sửa security group bằng tay ngoài CloudFormation; chạy describe-stack-resource-drifts để thấy trạng thái MODIFIED.',
    'Thêm DeletionPolicy Retain và UpdateReplacePolicy Retain cho RDS; thêm stack policy deny Update:Replace cho RDS để chặn thay thế ngoài ý muốn.',
    'Thử update làm thay RDS để thấy stack policy chặn; sau đó delete-stack và kiểm tra RDS vẫn còn nhờ DeletionPolicy Retain, phải xoá tay.'
  ],
  verify: [
    '{{aws cloudformation describe-stacks --stack-name lab-stack}} trả về StackStatus CREATE_COMPLETE hoặc UPDATE_COMPLETE.',
    '{{aws cloudformation describe-change-set --change-set-name ...}} liệt kê đúng các resource sẽ Add/Modify trước khi execute.',
    '{{aws cloudformation describe-stack-resource-drifts --stack-name lab-stack}} báo DriftStatus DRIFTED sau khi sửa security group bằng tay.',
    'Sau delete-stack, {{aws rds describe-db-instances --db-instance-identifier lab-db}} vẫn trả về DB nhờ DeletionPolicy Retain.'
  ],
  cost: 'CloudFormation miễn phí, chỉ trả cho tài nguyên tạo ra (EC2, RDS, EBS). RDS chạy vài giờ có thể vài USD nên hạ class nhỏ nhất. Dọn dẹp: delete-stack, xoá RDS retained bằng tay, xoá EBS snapshot nếu có, xoá S3 template, IAM role và log group.',
  examTip: `### Bẫy đề thi
- Change set chỉ là bản xem trước, không tự execute và không phát hiện drift. Drift detection là thao tác riêng và cũng không tự sửa.
- Mặc định update fail sẽ rollback; --disable-rollback giữ trạng thái lỗi để debug, không dùng cho production.
- Thiếu CAPABILITY_IAM hoặc CAPABILITY_NAMED_IAM gây lỗi InsufficientCapabilities; IAM role có tên cố định cần NAMED_IAM.
- DeletionPolicy Retain giữ resource khi xoá stack; Snapshot chỉ áp dụng cho resource hỗ trợ snapshot như RDS/EBS. UpdateReplacePolicy xử lý khi resource bị thay thế; stack policy chặn update/replace nhưng không thay IAM permission.`,
  ref: ['lab-82-dung-cloudformation-change-set-truoc-khi-update-stack', 'lab-83-troubleshoot-cloudformation-stack-rollback', 'lab-127-giu-nguyen-tai-nguyen-de-go-loi-khi-trien-khai-cloudformation-bang-co-disable-rollback', 'lab-97-bao-ve-csdl-rds-trong-cloudformation-bang-deletionpolicy-retain-va-stack-policy'],
},
{
  id: 'awslab-dev-005',
  category: 'dev',
  title: 'AWS CDK: synth, bootstrap, diff và deploy',
  level: 'mid',
  minutes: 45,
  exams: ['dop-c02'],
  domains: ['dop-d2', 'dop-d1'],
  services: ['AWS CDK', 'CloudFormation', 'S3', 'IAM', 'Lambda'],
  goal: 'Sau lab này bạn hiểu CDK là lớp lập trình sinh ra CloudFormation, biết construct L1/L2/L3, bootstrap tài khoản và dùng diff trước khi deploy. Đây là câu DOP-C02 về IaC hiện đại: CDK không thay CloudFormation mà tạo template cho CloudFormation chạy.',
  steps: [
    'Cài Node.js và AWS CDK CLI bằng npm install -g aws-cdk; chạy cdk --version để kiểm tra. CDK CLI dùng Node, còn ứng dụng CDK có thể viết bằng TypeScript, Java, Python hoặc Go.',
    'Chạy cdk init app --language java hoặc typescript để tạo project; mở thư mục lib để thấy stack và thư mục bin để thấy app entry point.',
    'Trong stack, khai báo VPC L2 với maxAzs 2 và natGateways 0 để tiết kiệm chi phí lab; tạo S3 bucket có encryption S3_MANAGED và blockPublicAccess; tạo Lambda function runtime JAVA_21.',
    'Chạy cdk synth; mở file template JSON trong cdk.out để thấy CDK đã sinh ra CloudFormation resource, IAM role và metadata. Đây là bằng chứng CDK chỉ là công cụ tổng hợp template.',
    'Chạy cdk bootstrap aws://account/region một lần cho mỗi cặp account/Region; lệnh tạo stack CDKToolkit gồm bucket asset, ECR repository và IAM role để upload code, image.',
    'Chạy cdk diff để xem thay đổi trước khi deploy, sau đó cdk deploy. Theo dõi stack trong CloudFormation console và xác nhận resource được tạo đúng.',
    'Đổi memorySize hoặc timeout của Lambda, chạy lại cdk diff thấy action Modify; deploy và kiểm tra cấu hình mới. Thử đổi tên logical ID để thấy resource bị Replace.',
    'Thêm một custom resource chạy Lambda khi CREATE/UPDATE/DELETE cho việc CloudFormation không hỗ trợ native; hiểu rằng custom resource là code chạy trong lifecycle stack, không phải code chạy mỗi request.',
    'Chạy cdk destroy để xoá resource của stack; lưu ý stack CDKToolkit của bootstrap vẫn còn và bucket asset có thể còn object.'
  ],
  verify: [
    '{{cdk ls}} liệt kê đúng tên stack; {{cdk synth}} in ra template CloudFormation không lỗi.',
    '{{cdk diff}} hiển thị đúng resource thay đổi; trong CI có thể dùng {{cdk diff --fail}} để trả exit code khác 0 khi có diff.',
    '{{aws cloudformation describe-stacks --stack-name CdkLabStack}} trả về CREATE_COMPLETE/UPDATE_COMPLETE.',
    'Sau cdk destroy, stack biến mất nhưng CDKToolkit vẫn còn; kiểm tra {{aws s3 ls}} bucket asset để thấy tài nguyên bootstrap.'
  ],
  cost: 'CDK và CloudFormation miễn phí; bootstrap tạo S3 bucket và ECR repository gần như không tốn phí nếu không lưu nhiều. Chi phí chính là resource trong stack (Lambda, S3, VPC endpoint nếu có). Dọn dẹp: cdk destroy, xoá object trong bucket asset nếu muốn, xoá stack CDKToolkit nếu không dùng nữa, xoá log group và IAM role do app tạo.',
  examTip: `### Bẫy đề thi
- CDK không phải runtime và không thay CloudFormation; nó synth ra template rồi CloudFormation deploy. Drift vẫn xảy ra và vẫn phải detect riêng.
- Construct L1 là CfnXxx map 1-1 với resource; L2 là construct curated như Vpc, Function; L3 là pattern như ApplicationLoadBalancedFargateService.
- Bootstrap cần một lần mỗi account/Region trước khi deploy stack có asset (Lambda code, Docker image); thiếu bootstrap sẽ lỗi khi upload asset.
- cdk diff chỉ so template với stack, không thay thế review nghiệp vụ; dùng --fail trong CI để chặn thay đổi ngoài ý muốn. Custom resource chạy trong lifecycle CloudFormation, không phải code xử lý request người dùng.`,
  ref: ['lab-116-quan-ly-vong-doi-tai-nguyen-tu-dong-bang-aws-cdk-custom-resources-va-lambda'],
},
{
  id: 'awslab-dev-006',
  category: 'dev',
  title: 'AWS SAM: build, local test, package và deploy serverless',
  level: 'mid',
  minutes: 45,
  exams: ['dop-c02', 'sap-c02'],
  domains: ['dop-d1', 'dop-d2'],
  services: ['AWS SAM', 'Lambda', 'API Gateway', 'CloudFormation', 'DynamoDB'],
  goal: 'Sau lab này bạn đóng gói và triển khai ứng dụng serverless bằng SAM CLI, chạy thử API/Lambda ở máy local và quản lý nhiều môi trường bằng samconfig.toml. Đây là cách nhanh nhất để làm lab Lambda + API Gateway mà vẫn hiểu bên dưới là CloudFormation.',
  steps: [
    'Chạy sam init --runtime java21 --app-template hello-world để tạo project mẫu; mở template.yaml xem AWS::Serverless::Function, sự kiện Api và bảng DynamoDB.',
    'Chạy sam validate --lint để bắt lỗi schema sớm; chạy sam build để Maven/Gradle build và đóng gói artifact vào .aws-sam/build.',
    'Chạy sam local start-api --port 3000 và curl endpoint để thử nghiệm; dùng sam local invoke với file events/event.json để kiểm tra một event cụ thể.',
    'Tạo bucket S3 để chứa artifact; chạy sam package --s3-bucket bucket --output-template-file packaged.yaml. Lệnh này upload code và viết lại template trỏ tới S3.',
    'Chạy sam deploy --guided lần đầu để tạo changeset, đặt tên stack và lưu cấu hình vào samconfig.toml; xác nhận deploy tạo Lambda, API Gateway và IAM role.',
    'Tạo thêm môi trường prod bằng samconfig.toml với parameter khác nhau (bảng DynamoDB, memory, log level) và deploy bằng sam deploy --config-env prod.',
    'Dùng Globals để đặt timeout, memory, tracing cho mọi function; override ở từng function khi cần. Bật Tracing Active để có X-Ray.',
    'Trong lúc phát triển, dùng sam sync --watch để đẩy thay đổi nhanh; chỉ dùng cho dev vì bỏ qua changeset và một số bước kiểm soát.',
    'Gọi API bằng curl, xem log CloudWatch và trace X-Ray; cuối cùng sam delete --stack-name để dọn tài nguyên.'
  ],
  verify: [
    '{{sam validate --lint}} không báo lỗi; {{sam build}} tạo artifact trong .aws-sam/build.',
    'curl tới endpoint local trả về JSON đúng; {{sam local invoke}} chạy function với event mẫu và in log.',
    '{{aws cloudformation describe-stacks --stack-name sam-lab}} trả về CREATE_COMPLETE; API Gateway endpoint trả 200 sau deploy.',
    'CloudWatch Logs có log của function; X-Ray service map có node API Gateway và Lambda nếu bật tracing.'
  ],
  cost: 'SAM CLI miễn phí; Lambda và API Gateway có Free Tier, S3 artifact và CloudWatch Logs vài cent. Lab dưới 1 USD. Dọn dẹp: sam delete --stack-name, xoá bucket artifact nếu còn object, xoá log group, DynamoDB table nếu template không xoá, và IAM role do stack tạo.',
  examTip: `### Bẫy đề thi
- SAM là transform AWS::Serverless-2016-10-31 trên CloudFormation; khi deploy, SAM mở rộng thành Lambda, API Gateway, IAM role và event source.
- sam package upload code lên S3 và viết lại template; sam deploy dùng template đã đóng gói. Không upload code thủ công rồi mong SAM tự tìm.
- sam local dùng Docker để mô phỏng Lambda nhưng không giống 100% (IAM, network, cold start, service emulation); đừng dùng làm bằng chứng duy nhất cho production.
- sam sync bỏ qua changeset, chỉ dùng dev; production dùng sam deploy để có changeset và rollback. Globals áp dụng mặc định cho mọi function, giá trị ở function thắng Globals.`,
  ref: ['lab-115-dong-goi-va-trien-khai-ung-dung-serverless-bang-aws-sam-cli-sam-package', 'lab-118-kiem-thu-cuc-bo-rest-api-va-lambda-bang-aws-sam-cli-sam-local-start-api', 'lab-52-tang-toc-trien-khai-code-lambda-tren-cloud-bang-aws-sam-accelerate-voi-sam-sync-watch'],
},
{
  id: 'awslab-dev-007',
  category: 'dev',
  title: 'API Gateway + Lambda: proxy, stage, cache và timeout',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'dop-d1'],
  services: ['API Gateway', 'Lambda', 'CloudWatch', 'IAM'],
  goal: 'Sau lab này bạn nối API Gateway với Lambda đúng kiểu proxy, tách môi trường bằng stage, bật cache và xử lý giới hạn timeout 29 giây. Đây là bài SAP-C02 về thiết kế API serverless và DOP-C02 về vận hành, logging, throttling.',
  steps: [
    'Tạo Lambda trả JSON theo format proxy (statusCode, headers, body) và đọc biến môi trường APP_ENV. Test function trực tiếp trước khi nối API.',
    'Tạo REST API, resource /orders, method POST, integration Lambda proxy. Deploy stage dev và lấy invoke URL.',
    'Cấp quyền cho API Gateway gọi Lambda bằng add-permission với source-arn giới hạn đúng API/stage; thiếu quyền sẽ gặp 500 hoặc 403 khi gọi.',
    'Tạo hai alias dev và prod cho Lambda; dùng stage variable lambdaAlias trong integration URI để cùng một API trỏ alias khác nhau theo stage.',
    'Tạo model JSON schema cho body và bật request validator; gửi payload thiếu field để nhận 400 trước khi Lambda chạy, giảm chi phí và lỗi.',
    'Bật cache cho stage với dung lượng 0.5 GB, TTL 300 giây; gọi cùng request hai lần và xem metric CacheHitCount. Lưu ý cache mặc định chỉ áp dụng cho GET, muốn cache POST phải bật riêng.',
    'Tạo usage plan, API key và throttling rate/burst; gửi request vượt ngưỡng để thấy 429 và kiểm tra metric ThrottleCount.',
    'Với tác vụ dài hơn 29 giây, không tăng timeout integration vô hạn; chuyển sang gọi Lambda bất đồng bộ bằng header X-Amz-Invocation-Type Event hoặc đẩy message vào SQS/Step Functions.',
    'Bật access log dạng JSON và X-Ray tracing; gửi request lỗi để xem log có requestId, status, integrationLatency và trace nối sang Lambda.'
  ],
  verify: [
    'curl POST tới invoke URL trả 200 và JSON đúng; payload thiếu field trả 400 do request validation.',
    'CloudWatch metric CacheHitCount tăng sau lần gọi thứ hai; thời gian phản hồi lần sau thấp hơn.',
    'Gửi request vượt rate limit thấy 429 và metric ThrottleCount tăng; usage plan hiển thị API key đã dùng.',
    'Log group access log có trường requestId, status, integrationLatency; X-Ray trace nối API Gateway với Lambda.'
  ],
  cost: 'REST API khoảng 3.50 USD/triệu request; cache tính theo giờ (0.5 GB vài cent/giờ); Lambda và CloudWatch Logs thêm vài cent. Lab dưới 1 USD. Dọn dẹp: xoá API và stage (cache bị xoá theo stage), usage plan/API key, Lambda alias/version, log group, alarm và IAM role.',
  examTip: `### Bẫy đề thi
- REST API và HTTP API khác nhau: HTTP API rẻ, độ trễ thấp nhưng thiếu API key, usage plan, caching, request validation. Đề yêu cầu các tính năng đó thì chọn REST API.
- Lambda proxy chuyển nguyên request và yêu cầu response đúng statusCode/body; non-proxy cần mapping template VTL. Trả sai format proxy thường gây 502.
- Timeout tích hợp tối đa 29 giây. Việc dài phải dùng async invocation, SQS hoặc Step Functions; tăng timeout Lambda không giải quyết giới hạn API Gateway.
- 429 là throttling, 502 thường do Lambda trả sai format hoặc crash, 504 do timeout. Cache theo stage, TTL mặc định 300 giây và mặc định chỉ áp dụng cho GET.`,
  ref: ['lab-37-tach-biet-moi-truong-test-va-prod-trong-api-gateway-bang-stage-variables-va-lambda-integration', 'lab-100-tang-toc-phan-hoi-api-thong-ke-cong-cong-bang-api-caching-tren-api-gateway', 'lab-47-kiem-tra-hop-le-request-payload-tai-edge-bang-api-gateway-request-validation-va-models', 'lab-79-xu-ly-timeout-api-gateway-bang-cach-kich-hoat-lambda-bat-dong-bo-qua-x-amz-invocation-type'],
},
{
  id: 'awslab-dev-008',
  category: 'dev',
  title: 'SQS + SNS fan-out: FIFO, filter policy và DLQ',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'dop-d3'],
  services: ['SNS', 'SQS', 'Lambda', 'DynamoDB', 'CloudWatch'],
  goal: 'Sau lab này bạn thiết kế fan-out SNS → nhiều SQS, lọc message bằng filter policy, cấu hình DLQ và xử lý trùng lặp/giữ thứ tự với FIFO. Đây là nền tảng câu SAP-C02 về decoupling và DOP-C02 về vận hành hàng đợi.',
  steps: [
    'Tạo SNS topic order-created; tạo hai SQS queue email và analytics; subscribe cả hai vào topic và bật raw message delivery để consumer nhận body gốc thay vì envelope SNS.',
    'Gắn filter policy cho subscription analytics, ví dụ chỉ nhận eventType ORDER_CREATED. Message phải có message attribute tương ứng vì filter policy mặc định đánh giá attribute, không đánh giá body.',
    'Tạo DLQ cho queue email và gắn redrive policy maxReceiveCount 3; đặt retention hợp lý để message lỗi còn đủ thời gian điều tra.',
    'Tạo Lambda consumer với event source mapping batch size 10, visibility timeout lớn hơn 6 lần timeout Lambda, và bật ReportBatchItemFailures để chỉ retry message lỗi trong batch.',
    'Publish một message; xác nhận cả hai queue nhận, sau đó publish event khác loại để thấy queue analytics không nhận nhờ filter policy.',
    'Ép Lambda lỗi ba lần với cùng message; message chuyển sang DLQ. Dùng start-message-move-task để redrive về queue chính sau khi sửa code.',
    'Gửi lặp cùng một đơn hàng vào standard queue; thêm bảng DynamoDB idempotency theo orderId để consumer bỏ qua lần xử lý trùng, vì standard queue chỉ đảm bảo at-least-once.',
    'Tạo SNS FIFO topic và SQS FIFO queue, publish với MessageGroupId theo customer và dedup ID; kiểm tra các message cùng group được xử lý đúng thứ tự.',
    'Tạo CloudWatch alarm cho ApproximateNumberOfMessagesVisible và AgeOfOldestMessage; alarm DLQ khi có message để không bỏ quên lỗi.'
  ],
  verify: [
    '{{aws sqs get-queue-attributes --queue-url ... --attribute-names All}} thấy RedrivePolicy trỏ DLQ và VisibilityTimeout đúng.',
    '{{aws sqs receive-message --queue-url ...}} nhận message sau khi publish; queue không khớp filter policy không nhận.',
    'Sau ba lần lỗi, {{aws sqs get-queue-attributes --queue-url dlq-url --attribute-names ApproximateNumberOfMessages}} lớn hơn 0.',
    'Với FIFO, thứ tự receive-message khớp thứ tự publish trong cùng MessageGroupId; metric queue depth giảm dần.'
  ],
  cost: 'SQS và SNS có Free Tier 1 triệu request/tháng; Lambda, DynamoDB, CloudWatch vài cent. Lab gần như 0 USD. Dọn dẹp: xoá SQS queue, DLQ, SNS topic và subscription, Lambda event source mapping, DynamoDB table, CloudWatch alarm và log group.',
  examTip: `### Bẫy đề thi
- SNS là pub/sub push, SQS là queue pull. Fan-out chuẩn là một SNS topic → nhiều SQS queue để mỗi consumer buffer và scale độc lập.
- Standard queue at-least-once và best-effort ordering; FIFO đảm bảo thứ tự theo MessageGroupId và chống trùng trong 5 phút, nhưng throughput thấp hơn và cần dedup ID.
- Visibility timeout phải lớn hơn thời gian xử lý; nếu không message bị giao lại và consumer xử lý trùng. Lambda cần timeout queue lớn hơn timeout function.
- DLQ chỉ nhận sau maxReceiveCount; luôn tạo alarm DLQ và quy trình redrive. Filter policy mặc định dựa trên message attributes, không dựa trên body. SQS message tối đa 256 KB, payload lớn dùng extended client qua S3.`,
  ref: ['lab-94-tao-sns-topic-fan-out-sang-sqs-lambda', 'lab-110-fan-out-tin-nhan-bao-toan-thu-tu-va-chong-trung-lap-bang-sns-fifo-va-sqs-fifo', 'lab-105-dam-bao-thu-tu-va-chong-trung-lap-don-hang-bang-amazon-sqs-fifo-queue-va-lambda', 'lab-112-xu-ly-loi-bat-dong-bo-cho-aws-lambda-bang-dead-letter-queue-dlq-voi-amazon-sqs'],
},
{
  id: 'awslab-dev-009',
  category: 'dev',
  title: 'Step Functions: Standard vs Express, Retry/Catch và saga',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d2', 'dop-d3'],
  services: ['Step Functions', 'Lambda', 'IAM', 'CloudWatch'],
  goal: 'Sau lab này bạn viết state machine điều phối nhiều bước, cấu hình Retry/Catch, Wait, Choice và hiểu khi nào dùng Standard hay Express. Đây là câu SAP-C02 về orchestration và DOP-C02 về xử lý lỗi phân tán.',
  steps: [
    'Viết Amazon States Language JSON cho workflow Reserve → Charge → Ship, mỗi Task gọi một Lambda. Bắt đầu bằng Pass state để kiểm tra input/output trước khi nối Lambda.',
    'Thêm Retry cho lỗi tạm thời như States.Timeout hoặc Lambda.ServiceException với IntervalSeconds 2, MaxAttempts 3, BackoffRate 2.0.',
    'Thêm Catch chuyển sang nhánh Compensate khi Charge thất bại; Compensate gọi Lambda Refund để hoàn tiền. Đây là saga pattern, không phải transaction database.',
    'Thêm Choice theo amount lớn hơn 1000 để gọi bước phê duyệt, và Wait 30 giây để mô phỏng rate limit của API bên thứ ba.',
    'Tạo IAM role cho state machine có quyền lambda:InvokeFunction trên đúng function ARN và quyền ghi CloudWatch Logs; thiếu quyền sẽ fail ngay ở Task đầu.',
    'Tạo state machine bằng create-state-machine, chạy start-execution với input JSON; mở execution history để xem từng state, thời gian và output.',
    'Ép Lambda Charge lỗi để quan sát Retry chạy lại, sau đó Catch chuyển sang Compensate; kiểm tra execution kết thúc Failed nhưng đã hoàn tiền.',
    'Chọn loại Standard cho workflow dài, cần exactly-once; chọn Express cho lượng lớn, thời gian ngắn. Ghi lại khác biệt về thời lượng tối đa và cách tính phí.',
    'Bật logging CloudWatch và tạo alarm cho ExecutionFailed, ExecutionTimedOut để phát hiện workflow kẹt hoặc lỗi hàng loạt.'
  ],
  verify: [
    '{{aws stepfunctions describe-execution --execution-arn ...}} trả về status SUCCEEDED hoặc FAILED đúng kịch bản.',
    '{{aws stepfunctions get-execution-history --execution-arn ...}} thấy các event TaskStateEntered/Exited, Retry, Catch chuyển nhánh.',
    'CloudWatch Logs có log execution; metric ExecutionFailed tăng khi ép lỗi không có Catch.',
    'Với Express, kiểm tra log group tương ứng và thời gian execution ngắn hơn; Standard giữ history lâu hơn.'
  ],
  cost: 'Standard khoảng 0.025 USD cho 1.000 state transition, có Free Tier 4.000 transition/tháng; Express khoảng 1 USD/triệu request cộng phí duration. Lambda và CloudWatch Logs thêm vài cent. Lab dưới 1 USD. Dọn dẹp: xoá state machine, execution history, Lambda function, IAM role, log group và alarm.',
  examTip: `### Bẫy đề thi
- Standard chạy tới 1 năm, exactly-once, phù hợp workflow dài và cần audit; Express tối đa 5 phút, at-least-once, throughput cao, rẻ hơn cho volume lớn.
- Step Functions chỉ điều phối, không chạy code; Task gọi Lambda, ECS, SNS, SQS hoặc API. Đừng chọn Step Functions thay cho compute.
- Retry xử lý lỗi tạm thời; Catch xử lý sau khi retry hết hoặc lỗi không retry. Retry có thể chạy lại side effect nên Lambda phải idempotent.
- Human approval dùng waitForTaskToken cùng SendTaskSuccess/SendTaskHeartbeat, không polling bằng Wait dài. Saga dùng compensating action khi bước sau fail, không có rollback tự động cho giao dịch đã commit ở service khác.`,
  ref: ['lab-66-dieu-phoi-rate-limit-cua-api-ben-thu-ba-bang-aws-step-functions-wait-state'],
},
{
  id: 'awslab-dev-010',
  category: 'dev',
  title: 'Secrets Manager: rotation cho RDS và đọc secret an toàn',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'dop-d6'],
  services: ['Secrets Manager', 'RDS', 'Lambda', 'KMS', 'EventBridge'],
  goal: 'Sau lab này bạn bật rotation cho mật khẩu RDS, hiểu Lambda rotation bốn bước và cách ứng dụng đọc secret lúc runtime thay vì nhúng vào image. Đây là câu SAP-C02 bảo mật và DOP-C02 vận hành secret, rất hay gặp khi hỏi Parameter Store so với Secrets Manager.',
  steps: [
    'Tạo RDS hoặc Aurora PostgreSQL nhỏ trong private subnet; ghi lại endpoint, port, database name và security group.',
    'Tạo secret dạng JSON gồm username, password, host, port, dbname; hoặc bật tích hợp Secrets Manager ngay khi tạo RDS để AWS sinh secret và cấu hình rotation.',
    'Bật rotation với chu kỳ 30 ngày, chọn Lambda rotation template cho RDS. Lambda rotation phải chạy trong VPC truy cập được RDS và có security group phù hợp.',
    'Gắn IAM role cho Lambda rotation: secretsmanager:GetSecretValue, PutSecretValue, DescribeSecret, kms:Decrypt và rds:DescribeDBInstances. Thiếu quyền KMS là lỗi rất hay gặp.',
    'Hiểu bốn bước: createSecret tạo phiên bản AWSPENDING, setSecret đổi mật khẩu trong database, testSecret kiểm tra đăng nhập, finishSecret chuyển AWSPENDING thành AWSCURRENT.',
    'Ép rotation ngay bằng rotate-secret; xem list-secret-version-ids có các stage AWSPENDING và AWSCURRENT; thử đăng nhập bằng mật khẩu mới và xác nhận mật khẩu cũ không còn dùng được.',
    'Sửa ứng dụng Java đọc secret bằng SDK lúc khởi động hoặc theo TTL, cache ngắn trong bộ nhớ; không đóng gói secret vào image, không để trong biến môi trường tĩnh của task definition.',
    'Với cross-account, gắn resource policy cho secret và key policy cho KMS CMK để role account kia được decrypt; kiểm tra cả hai phía vì thiếu một phía vẫn AccessDenied.',
    'Tạo EventBridge rule bắt sự kiện CloudTrail RotateSecret thất bại để gửi SNS; rotation im lặng thất bại là sự cố production rất khó phát hiện.'
  ],
  verify: [
    '{{aws secretsmanager describe-secret --secret-id lab/db}} trả về RotationEnabled true và RotationLambdaARN đúng function.',
    '{{aws secretsmanager list-secret-version-ids --secret-id lab/db}} thấy version có staging label AWSCURRENT và AWSPENDING trong lúc rotate.',
    'Kết nối psql/mysql bằng mật khẩu mới thành công; mật khẩu cũ bị từ chối sau khi rotation hoàn tất.',
    'CloudTrail có event RotateSecret; alarm/EventBridge nhận thông báo khi cố ý làm rotation fail (ví dụ sai security group).'
  ],
  cost: 'Secrets Manager khoảng 0.40 USD/secret/tháng cộng 0.05 USD cho 10.000 API call; Lambda rotation gần như miễn phí; RDS là chi phí chính. Dọn dẹp: xoá secret với ForceDeleteWithoutRecovery, xoá Lambda rotation, EventBridge rule, RDS instance và log group.',
  examTip: `### Bẫy đề thi
- Secrets Manager có rotation native; Parameter Store SecureString không tự rotate, muốn rotate phải tự viết Lambda/EventBridge. Đề hỏi tự động xoay mật khẩu định kỳ thì chọn Secrets Manager.
- Không nhúng secret vào biến môi trường tĩnh của Lambda/ECS; đọc runtime bằng SDK và cache có TTL để giảm API call nhưng vẫn nhận giá trị mới.
- Lambda rotation phải có network tới database; RDS private subnet cần Lambda trong VPC, security group đúng và NAT/VPC endpoint nếu cần gọi AWS API.
- Multi-user rotation luân phiên hai user database để tránh downtime. KMS CMK cần quyền cho cả rotation role và application role; cross-account cần cả secret resource policy và key policy.`,
  ref: ['lab-75-rotate-secret-trong-aws-secrets-manager', 'lab-22-tu-dong-xoay-vong-thong-tin-dang-nhap-database-dinh-ky-bang-aws-secrets-manager', 'lab-113-tu-dong-xoay-vong-thong-tin-xac-thuc-amazon-aurora-postgresql-bang-aws-secrets-manager'],
},
{
  id: 'awslab-dev-011',
  category: 'dev',
  title: 'X-Ray: trace phân tán cho Java trên Lambda/ECS',
  level: 'mid',
  minutes: 40,
  exams: ['dop-c02', 'sap-c02'],
  domains: ['dop-d4', 'sap-d3'],
  services: ['AWS X-Ray', 'Lambda', 'ECS', 'API Gateway', 'CloudWatch'],
  goal: 'Sau lab này bạn bật tracing cho một request đi qua API Gateway, Lambda và database, đọc service map để tìm nút thắt và dùng annotation để lọc trace. Đây là câu DOP-C02 monitoring: phân biệt trace với log/metric và biết khi nào cần X-Ray daemon.',
  steps: [
    'Bật Active tracing cho Lambda và API Gateway stage; với ECS/EC2 phải chạy X-Ray daemon như sidecar hoặc process phụ lắng nghe UDP cổng 2000.',
    'Thêm AWS X-Ray SDK for Java vào ứng dụng, cấu hình recorder và servlet filter để mỗi request tạo một segment. Với Spring có thể dùng filter/interceptor tương ứng.',
    'Tạo subsegment cho lời gọi HTTP, SQL, SQS hoặc S3; subsegment giúp biết thời gian nằm ở dependency nào thay vì chỉ thấy tổng thời gian Lambda.',
    'Gắn annotation cho các trường cần tìm kiếm như orderId, customerTier; annotation được index và dùng trong filter expression. Metadata chỉ hiển thị, không query được.',
    'Gắn IAM role quyền xray:PutTraceSegments và xray:PutTelemetryRecords; thiếu quyền thì SDK gửi trace thất bại nhưng ứng dụng vẫn chạy, rất dễ bỏ sót.',
    'Hiểu sampling mặc định khoảng 1 request/giây cộng 5% request còn lại; tạo custom sampling rule theo URL hoặc theo service để tăng mẫu khi điều tra sự cố.',
    'Tạo traffic thành công và traffic lỗi; mở service map để thấy node lỗi, latency và edge giữa các service.',
    'Mở một trace chậm, xem timeline để tìm subsegment chiếm nhiều thời gian nhất; tạo group với filter expression annotation để theo dõi nhóm request đó.',
    'So sánh với ADOT/OpenTelemetry: ADOT thu thập trace theo chuẩn mở rồi gửi X-Ray; X-Ray vẫn là backend hiển thị service map và trace.'
  ],
  verify: [
    '{{aws xray get-service-graph --start-time ... --end-time ...}} trả về các node API Gateway, Lambda và dependency.',
    '{{aws xray get-trace-summaries --start-time ... --end-time ...}} có trace với duration và error flag.',
    'Service map hiển thị edge lỗi màu đỏ khi cố ý làm downstream fail; trace timeline chỉ ra subsegment chậm.',
    'CloudWatch Logs của Lambda có trace ID; header X-Amzn-Trace-Id xuất hiện trong log/response để nối trace.'
  ],
  cost: 'X-Ray có Free Tier 100.000 trace ghi mỗi tháng và 1.000.000 trace đọc; vượt thì khoảng 5 USD/triệu trace ghi. Daemon và SDK miễn phí; Lambda/ECS là chi phí chính. Dọn dẹp: tắt tracing trên Lambda/API Gateway/ECS, xoá sampling rule, group, log group và daemon task.',
  examTip: `### Bẫy đề thi
- EC2/ECS cần X-Ray daemon; Lambda đã tích hợp sẵn, chỉ cần bật Active tracing. Thiếu daemon hoặc thiếu IAM PutTraceSegments thì trace mất dù ứng dụng vẫn chạy.
- Sampling không trace 100% request. Mặc định khoảng 1 request/giây cộng 5%; đề hỏi giảm chi phí thì điều chỉnh sampling, không tắt hẳn.
- Annotation được index để filter; metadata không index. Dùng annotation cho orderId, tenant, errorCode thay vì nhét tất cả vào metadata.
- Trace gồm segment và subsegment; service map do X-Ray dựng từ trace. API Gateway, Lambda và SQS truyền header X-Amzn-Trace-Id để nối trace xuyên service. X-Ray khác CloudWatch Logs/Metrics: log cho biết sự kiện, metric cho biết xu hướng, trace cho biết request chậm ở đâu.`,
  ref: ['lab-68-phan-tich-nghen-hieu-nang-he-thong-phan-tan-lambda-bang-aws-x-ray-trace-segments', 'lab-88-tracing-ung-dung-python-tren-ec2-bang-aws-x-ray-daemon-va-x-ray-sdk', 'lab-44-trien-khai-aws-x-ray-daemon-sidecar-container-tren-ecs-fargate-de-trace-loi-microservices'],
},
{
  id: 'awslab-dev-012',
  category: 'dev',
  title: 'Cognito: user pool, identity pool và API Gateway authorizer',
  level: 'senior',
  minutes: 50,
  exams: ['sap-c02', 'dop-c02'],
  domains: ['sap-d1', 'dop-d6'],
  services: ['Cognito', 'API Gateway', 'IAM', 'S3', 'Lambda'],
  goal: 'Sau lab này bạn phân biệt user pool (xác thực, phát JWT) với identity pool (đổi token thành AWS credentials), gắn authorizer cho API Gateway và cấp quyền S3 theo danh tính. Đây là câu SAP-C02 về xác thực ứng dụng và DOP-C02 về bảo mật API.',
  steps: [
    'Tạo user pool, app client public không có client secret cho SPA/mobile; bật đăng nhập email, password policy và MFA tuỳ chọn. App client secret không được nhúng trong ứng dụng chạy trên trình duyệt.',
    'Tạo domain hosted UI với callback URL localhost; cấu hình Google làm social identity provider và map attribute email, name từ Google vào user pool.',
    'Đăng ký, xác nhận email, đăng nhập và lấy ID token, access token, refresh token; decode payload để xem sub, email, cognito:groups và thời hạn token.',
    'Tạo API Gateway REST API và Cognito authorizer trỏ user pool; gắn authorizer cho method. Gọi không có token nhận 401, có token hợp lệ nhận 200.',
    'Trong Lambda proxy, đọc claim từ requestContext.authorizer.claims để lấy sub/email; không tin header do client tự gửi vì đã bị authorizer kiểm tra.',
    'Tạo identity pool, thêm user pool làm identity provider; tạo role authenticated và unauthenticated với quyền khác nhau.',
    'Dùng get-id và get-credentials-for-identity để đổi token thành AWS credentials tạm thời; dùng credentials gọi S3 với prefix theo identity id.',
    'Test khách chưa đăng nhập chỉ đọc được bucket public hoặc bị từ chối; user đã đăng nhập ghi được vào prefix của chính mình nhờ IAM policy dùng biến cognito-identity.amazonaws.com:sub.',
    'Thu hồi refresh token, xoá user và kiểm tra access token cũ vẫn dùng được đến khi hết hạn; thiết kế API cần kiểm tra nhóm/quyền ở server cho thao tác nhạy cảm.'
  ],
  verify: [
    '{{aws cognito-idp admin-get-user --user-pool-id ... --username ...}} trả về trạng thái CONFIRMED và attribute email.',
    '{{aws cognito-identity get-id --identity-pool-id ... --logins ...}} và {{aws cognito-identity get-credentials-for-identity}} trả về AccessKeyId, SecretKey, SessionToken.',
    'curl API không token trả 401; curl với header Authorization Bearer ID-token trả 200 và Lambda thấy đúng sub.',
    'S3 PutObject vào prefix của identity khác bị AccessDenied; prefix của chính identity thành công.'
  ],
  cost: 'Cognito có Free Tier theo số MAU hàng tháng, lab vài user gần như 0 USD; API Gateway, Lambda, S3 và CloudWatch vài cent. Dọn dẹp: xoá user pool (và domain), identity pool, app client, IAM role authenticated/unauthenticated, API Gateway, Lambda, S3 object và log group.',
  examTip: `### Bẫy đề thi
- User pool là authentication (bạn là ai) và phát JWT; identity pool là authorization cho AWS, đổi token thành credentials tạm thời. Đừng nhầm hai khái niệm.
- API Gateway Cognito authorizer kiểm tra JWT; REST API thường dùng ID token, HTTP API JWT authorizer cấu hình audience/client_id và dùng access token. Chọn đúng loại token theo loại API.
- Identity pool role có trust policy gắn với identity pool; authenticated và unauthenticated role phải tách quyền, không cấp AdministratorAccess cho guest. Cognito groups map được sang IAM role để phân quyền.
- Social IdP như Google federation vào user pool, không tự cấp AWS credentials. Access token và ID token mặc định khoảng 1 giờ, refresh token khoảng 30 ngày; access token đã phát không thu hồi ngay, chỉ thu hồi được refresh token.`,
  ref: ['lab-04-tich-hop-dang-ky-va-dang-nhap-bang-social-identity-provider-voi-amazon-cognito-user-pools', 'lab-08-phan-quyen-guest-va-authenticated-user-bang-amazon-cognito-identity-pools-va-iam-roles', 'lab-24-xay-dung-api-luu-tru-anh-serverless-voi-api-gateway-cognito-authorizer-s3-va-dynamodb'],
},
);