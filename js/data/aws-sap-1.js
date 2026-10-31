/* AWS SAP-C02 practice pool, part 1: 40 exam-style questions (sap-001..sap-040), Domain 1 (Organizational Complexity) + Domain 2 (New Solutions).
 * Schema: docs/AWS-TRACK.md. Check: node scripts/check-aws.js */
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'sap-001', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company uses AWS Organizations with all features enabled and has more than 120 member accounts grouped into OUs. AWS Control Tower is NOT used. Because of data residency rules, the security team must prevent any principal in any member account, including account administrators, from creating resources outside eu-west-1 and eu-central-1. Global services such as IAM, AWS Organizations, Amazon CloudFront and AWS Support must keep working. The solution must require the LEAST ongoing operational effort. Which solution meets these requirements?`,
  options: [
    `Create an IAM permissions boundary that denies actions outside the two Regions and require every account administrator to attach it to all IAM roles and users through an onboarding runbook.`,
    `Create an SCP that denies all actions when aws:RequestedRegion is not eu-west-1 or eu-central-1, using a NotAction element to exempt global services, and attach it to the organization root.`,
    `Create the same Region-deny SCP but attach it only to the management account, because policies attached there are inherited by all member accounts.`,
    `Deploy an AWS Config rule in every account through StackSets that detects resources outside the approved Regions and triggers an SSM Automation runbook to delete them.`,
  ],
  answer: 1,
  explain: `**Từ khoá:** "prevent", "including account administrators", "all member accounts", "LEAST operational effort" → cần kiểm soát **preventive** ở cấp tổ chức, tức là **SCP**.

### Vì sao B đúng
- SCP đặt giới hạn quyền tối đa cho mọi principal trong account thành viên, kể cả root user và admin của account đó. Admin account không gỡ được SCP.
- Điều kiện {{aws:RequestedRegion}} chặn API gọi tới Region khác. Global services (IAM, Organizations, CloudFront, Support, Route 53…) có endpoint ở us-east-1, nên phải loại trừ bằng {{NotAction}}, nếu không sẽ làm hỏng chúng. AWS có policy mẫu đúng dạng này.
- Gắn ở root → mọi OU và account mới tự kế thừa, không cần thao tác thêm.

### Vì sao các phương án khác sai
- **A:** permissions boundary do admin account tự gắn nên admin cũng gỡ được; phải làm thủ công cho mọi role/user, rất tốn công.
- **C:** SCP **không bao giờ** ảnh hưởng tới management account; gắn lên account đó cũng không kế thừa xuống member account. Kế thừa đi theo cây root → OU → account.
- **D:** AWS Config là **detective**: tài nguyên đã được tạo (dữ liệu có thể đã ra ngoài EU) rồi mới bị phát hiện, và phải duy trì rule + runbook ở 120 account.

> Exam tip: "prevent" + "even administrators" + nhiều account → SCP. Nhớ hai bẫy kinh điển: SCP không tác động management account, và SCP không cấp quyền (chỉ giới hạn).`,
  services: ['AWS Organizations', 'SCP', 'IAM'],
  refs: [{ type: 'doc', title: 'Service control policies (SCPs)', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html' }],
},
{
  id: 'sap-002', exam: 'sap-c02', domain: 'sap-d1',
  q: `A financial services company has 60 AWS accounts in AWS Organizations. Auditors require that all management API activity from every account and every Region be recorded to a single location in a dedicated Log Archive account. Administrators of member accounts must not be able to stop, delete or modify this logging, and new accounts must be covered automatically. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    `Use CloudFormation StackSets with automatic deployment to create a multi-Region trail in each member account that delivers to an S3 bucket in the Log Archive account.`,
    `Enable AWS Config in all accounts and create an organization-wide aggregator in the Log Archive account to store API activity.`,
    `Create a CloudWatch Logs subscription filter in every account that streams CloudTrail event history to a Kinesis Data Firehose stream in the Log Archive account.`,
    `Create an organization trail in the management account (or the CloudTrail delegated administrator account) that logs all Regions to an S3 bucket in the Log Archive account with a bucket policy that allows CloudTrail to write.`,
  ],
  answer: 3,
  explain: `**Từ khoá:** "every account and every Region", "must not be able to stop, delete or modify", "new accounts automatically" → **CloudTrail organization trail**.

### Vì sao D đúng
- Organization trail được tạo một lần trong management account (hoặc account được uỷ quyền delegated administrator của CloudTrail) và tự áp dụng cho **mọi account hiện tại và tương lai** trong tổ chức.
- Member account nhìn thấy trail nhưng **không thể sửa, dừng hoặc xoá** nó, đúng yêu cầu chống can thiệp.
- Trail ghi tất cả Region về một S3 bucket ở Log Archive account; thêm S3 Object Lock / SCP bảo vệ bucket nếu cần bất biến.

### Vì sao các phương án khác sai
- **A:** trail do StackSets tạo nằm **trong** member account, admin của account đó có quyền {{StopLogging}} hoặc xoá trail (trừ khi viết thêm SCP), nên tốn công và không tự bảo vệ.
- **B:** AWS Config ghi **cấu hình tài nguyên** và compliance, không phải toàn bộ API activity. Aggregator chỉ tổng hợp dữ liệu Config.
- **C:** event history không phải log stream; muốn đẩy vào CloudWatch Logs vẫn phải có trail trong từng account. Kiến trúc nhiều mảnh, nhiều công vận hành.

> Exam tip: "centralized audit across all accounts, tamper-proof from member admins" gần như luôn là organization trail + bucket ở Log Archive account (đúng mô hình mà Control Tower dựng sẵn).`,
  services: ['AWS CloudTrail', 'AWS Organizations', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'Creating a trail for an organization', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/creating-trail-organization.html' }],
},
{
  id: 'sap-003', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 40 AWS accounts in AWS Organizations. Employees authenticate with Microsoft Entra ID. Today each account has its own IAM users, and the security team spends many hours each month onboarding and offboarding staff. The company wants employees to sign in once with their corporate credentials, receive access to accounts based on their Entra ID group membership, and lose all AWS access automatically when they are disabled in Entra ID. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    `Enable IAM Identity Center in the management account, connect Entra ID as the external identity provider using SAML 2.0 with SCIM automatic provisioning, and assign permission sets to the synchronized groups for the required accounts.`,
    `Create a SAML 2.0 identity provider in IAM in each of the 40 accounts, create IAM roles that trust it, and map Entra ID group claims to role ARNs.`,
    `Create an Amazon Cognito user pool federated with Entra ID and use Cognito identity pools to vend temporary credentials for each AWS account.`,
    `Use AWS Directory Service AD Connector in each account and grant console access to Active Directory groups through IAM policies.`,
  ],
  answer: 0,
  explain: `**Từ khoá:** "workforce", "sign in once", "group membership", "automatically lose access", "40 accounts", "LEAST overhead" → **IAM Identity Center + external IdP + SCIM**.

### Vì sao A đúng
- IAM Identity Center là dịch vụ chuẩn cho truy cập workforce vào nhiều account trong Organizations: một portal, SSO, credentials tạm thời.
- Entra ID kết nối bằng **SAML 2.0** (xác thực) và **SCIM** (tự động đồng bộ user/group). Khi user bị disable trong Entra ID, SCIM cập nhật Identity Center và họ mất quyền.
- **Permission set** được định nghĩa một lần, Identity Center tự tạo IAM role tương ứng trong các account được gán.

### Vì sao các phương án khác sai
- **B:** chạy được nhưng phải quản lý IdP + role ở 40 account và cấu hình claim mapping cho từng account. Account mới lại phải làm lại, overhead cao.
- **C:** Cognito dành cho **người dùng của ứng dụng** (customer identity), không phải workforce đăng nhập AWS console nhiều account.
- **D:** AD Connector phục vụ các dịch vụ như WorkSpaces hoặc tham gia domain; nó không phải cơ chế SSO đa account, và triển khai từng account rất tốn công.

> Exam tip: workforce + nhiều account → IAM Identity Center. "Automatic provisioning/deprovisioning" → SCIM. Cognito chỉ xuất hiện khi đề nói về end-user của app web/mobile.`,
  services: ['IAM Identity Center', 'AWS Organizations', 'Microsoft Entra ID'],
},
{
  id: 'sap-004', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has a central networking team that owns all VPCs, subnets, route tables and internet egress in a Network account. Fifteen application teams, each with their own AWS account in the same organization, need to launch EC2 instances, RDS databases and Lambda functions into centrally managed subnets. Application teams must not be able to modify route tables or NACLs. The company wants to minimize the number of VPCs and avoid inter-VPC data processing charges. Which solution meets these requirements?`,
  options: [
    `Create one VPC per application account and connect them to the Network account VPC with VPC peering; restrict route table changes with IAM policies.`,
    `Create a transit gateway in the Network account, share it with AWS RAM, and have each application team create its own VPC attached to the transit gateway.`,
    `Create the VPCs in the Network account and use AWS RAM to share specific subnets with the application accounts (VPC sharing); application teams launch resources into the shared subnets as participants.`,
    `Use AWS RAM to share the entire VPC with each application account so that application teams can create their own subnets inside it.`,
  ],
  answer: 2,
  explain: `**Từ khoá:** "central team owns VPCs, subnets, route tables", "teams launch resources into centrally managed subnets", "must not modify", "minimize number of VPCs", "avoid inter-VPC data processing" → **VPC sharing** bằng AWS RAM.

### Vì sao C đúng
- VPC owner (Network account) chia sẻ **subnet** cho participant account trong cùng organization. Participant tạo EC2, RDS, Lambda (VPC-attached)… trong subnet đó.
- Participant **không thể** sửa VPC, subnet, route table, NACL; họ chỉ quản lý tài nguyên của mình (và security group của mình).
- Tất cả nằm chung một VPC nên traffic giữa các team không đi qua TGW, không có phí data processing của TGW; cũng không cần peering.

### Vì sao các phương án khác sai
- **A:** tạo 15 VPC mới (ngược với "minimize VPCs"), peering không transitive, và mỗi team vẫn là owner VPC của họ nên có thể sửa route.
- **B:** mỗi team tự sở hữu VPC → họ toàn quyền route table; TGW tính phí theo attachment-giờ và **phí data processing** theo GB.
- **D:** RAM **không chia sẻ nguyên VPC**; đơn vị chia sẻ là subnet. Participant không được tạo subnet trong VPC của owner.

> Exam tip: "central team manages network, app teams only deploy resources" + "same organization" → VPC sharing. Nhớ: chia sẻ subnet, không chia sẻ VPC, và participant không sửa được hạ tầng mạng.`,
  services: ['AWS RAM', 'Amazon VPC', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'Share your VPC with other accounts', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-sharing.html' }],
},
{
  id: 'sap-005', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company is expanding from 5 to 50 VPCs across 20 AWS accounts in one Region. All VPCs must be able to communicate with each other, and all VPCs must reach the on-premises data center over an existing 10 Gbps AWS Direct Connect dedicated connection. The networking team wants a hub-and-spoke design that scales without managing a large number of point-to-point connections and that can be managed from a central Network account. Which combination of steps should a solutions architect take? (Choose two.)`,
  options: [
    `Create a full mesh of VPC peering connections between all VPCs and create a private virtual interface from the Direct Connect connection to each VPC's virtual private gateway.`,
    `Create a transit gateway in the Network account and share it with the other accounts through AWS RAM so that each account can attach its VPCs.`,
    `Deploy a transit VPC with third-party virtual router appliances on EC2 that establish IPsec tunnels to every VPC.`,
    `Create a Direct Connect gateway, associate it with the transit gateway, and create a transit virtual interface on the Direct Connect connection to the Direct Connect gateway.`,
    `Enable route propagation on every VPC route table so that peered VPCs learn on-premises routes transitively through the peering connections.`,
  ],
  answer: [1, 3],
  multi: true,
  explain: `**Từ khoá:** "50 VPCs, 20 accounts", "all communicate", "hub-and-spoke", "central Network account", "existing Direct Connect" → **Transit Gateway** chia sẻ bằng RAM + **transit VIF** qua Direct Connect gateway.

### Vì sao B và D đúng
- **B:** Transit Gateway là router regional, hỗ trợ **transitive routing** giữa hàng nghìn attachment. Tạo một lần ở Network account rồi chia sẻ qua AWS RAM; các account khác tạo VPC attachment của riêng họ.
- **D:** để nối Direct Connect với TGW phải dùng **transit VIF** gắn vào **Direct Connect gateway**, rồi associate DX gateway với TGW. Khi đó on-prem đi tới mọi VPC đã attach qua một VIF duy nhất.

### Vì sao các phương án khác sai
- **A:** full mesh 50 VPC = 1.225 peering, quá nhiều để quản lý; private VIF cho từng VPC cũng không scale. Peering không transitive.
- **C:** transit VPC với appliance bên thứ ba là mẫu cũ trước khi có TGW: phải tự vận hành, vá lỗi, HA cho EC2 router, overhead lớn.
- **E:** VPC peering **không bao giờ transitive**; không thể dùng peering để chuyển tiếp route on-prem sang VPC khác. Route propagation chỉ áp dụng cho route từ virtual private gateway.

> Exam tip: nhiều VPC + on-prem + "transitive" → Transit Gateway. DX tới TGW = transit VIF + DX gateway; DX tới VGW = private VIF; DX tới dịch vụ công khai (S3 public endpoint) = public VIF.`,
  services: ['AWS Transit Gateway', 'AWS Direct Connect', 'AWS RAM'],
},
{
  id: 'sap-006', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company connects its data center to a VPC through a single 1 Gbps AWS Direct Connect hosted connection that terminates on a virtual private gateway. The company needs a backup path in case the Direct Connect connection or location fails. During a failure, reduced bandwidth and higher latency are acceptable for up to one day. Traffic must stay encrypted over the backup path. Which solution is the MOST cost-effective?`,
  options: [
    `Order a second 1 Gbps hosted connection at the same Direct Connect location and configure both connections in a link aggregation group (LAG).`,
    `Create an AWS Site-to-Site VPN connection to the same virtual private gateway over the internet and use BGP so that the Direct Connect path is preferred while it is available.`,
    `Enable Direct Connect SiteLink on the virtual interface so that traffic is rerouted through another Direct Connect location when the primary location fails.`,
    `Order a second Direct Connect connection at a different Direct Connect location and configure both connections with equal BGP weights.`,
  ],
  answer: 1,
  explain: `**Từ khoá:** "backup path", "reduced bandwidth acceptable", "encrypted", "MOST cost-effective" → **Site-to-Site VPN làm backup cho Direct Connect**.

### Vì sao B đúng
- Site-to-Site VPN dùng IPsec (mã hoá sẵn) qua internet, chi phí chỉ là phí theo giờ + data transfer, rẻ hơn rất nhiều so với một kết nối DX thứ hai.
- Khi cùng prefix được quảng bá qua cả DX và VPN tới cùng một virtual private gateway, AWS **ưu tiên route học từ Direct Connect** hơn route VPN. VPN chỉ gánh traffic khi DX mất BGP session, nên failover tự động.
- Đề chấp nhận giảm băng thông (mỗi tunnel VPN tối đa khoảng 1.25 Gbps) và độ trễ cao hơn.

### Vì sao các phương án khác sai
- **A:** cùng một DX location nên không chống được sự cố location; hosted connection cũng không dùng được LAG (LAG chỉ cho dedicated connection cùng tốc độ).
- **C:** SiteLink dùng để nối **các site on-prem với nhau** qua mạng AWS, không phải cơ chế dự phòng cho kết nối tới VPC.
- **D:** đây là thiết kế high resiliency đúng nghĩa nhưng đắt nhất; đề chỉ yêu cầu backup rẻ và chấp nhận suy giảm. Ngoài ra DX không mã hoá mặc định.

> Exam tip: "cost-effective backup for Direct Connect" → VPN. "Maximum resiliency for critical workloads" → hai DX ở hai location khác nhau (mô hình của Direct Connect Resiliency Toolkit).`,
  services: ['AWS Direct Connect', 'AWS Site-to-Site VPN', 'Amazon VPC'],
},
{
  id: 'sap-007', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company runs workloads in 12 VPCs across several accounts, all connected to the corporate network through a transit gateway and AWS Direct Connect. On-premises servers must resolve records in an Amazon Route 53 private hosted zone (aws.example.internal). EC2 instances in all 12 VPCs must resolve names in the on-premises domain (corp.example.com), which is hosted on on-premises DNS servers. The solution must be centrally managed from a shared services account. Which combination of steps meets these requirements? (Choose two.)`,
  options: [
    `Create a Route 53 Resolver inbound endpoint in the shared services VPC and configure the on-premises DNS servers to conditionally forward aws.example.internal to the inbound endpoint IP addresses.`,
    `Configure the on-premises DNS servers to forward aws.example.internal queries directly to the Amazon-provided DNS address 169.254.169.253 over Direct Connect.`,
    `Associate the private hosted zone with the on-premises network by registering the Direct Connect gateway as an associated network.`,
    `Create a Route 53 Resolver outbound endpoint in the shared services VPC with a forwarding rule for corp.example.com, share the rule with the other accounts through AWS RAM, and associate it with all 12 VPCs.`,
    `Change the DHCP options set of all 12 VPCs to use only the on-premises DNS servers for all name resolution.`,
  ],
  answer: [0, 3],
  multi: true,
  explain: `**Từ khoá:** hybrid DNS hai chiều + nhiều account + "centrally managed" → **Resolver inbound endpoint** (on-prem → AWS) và **outbound endpoint + forwarding rule chia sẻ qua RAM** (AWS → on-prem).

### Vì sao A và D đúng
- **A (on-prem → AWS):** inbound endpoint tạo ENI có IP riêng trong VPC; on-prem DNS chuyển tiếp có điều kiện tới các IP này qua DX/TGW, Resolver trả lời từ private hosted zone đã liên kết với VPC.
- **D (AWS → on-prem):** outbound endpoint + forwarding rule cho {{corp.example.com}}. Resolver rule chia sẻ được qua **AWS RAM**; account khác chỉ cần associate rule với VPC của mình, endpoint vẫn ở shared services.

### Vì sao các phương án khác sai
- **B:** địa chỉ 169.254.169.253 (và VPC base +2) chỉ truy cập được **từ bên trong VPC**, không đến được từ on-prem.
- **C:** private hosted zone chỉ associate được với **VPC**, không có khái niệm gắn với DX gateway hay mạng on-prem.
- **E:** đổi DHCP options sang DNS on-prem làm instance mất khả năng phân giải private hosted zone và tên nội bộ AWS (trừ khi on-prem lại forward ngược), phụ thuộc vào DX cho mọi truy vấn DNS. Không đáp ứng.

> Exam tip: "on-prem resolves AWS names" = inbound; "AWS resolves on-prem names" = outbound + rule. Nhiều account → share Resolver rule bằng RAM.`,
  services: ['Route 53 Resolver', 'AWS RAM', 'AWS Transit Gateway', 'AWS Direct Connect'],
  refs: [{ type: 'doc', title: 'What is Route 53 Resolver?', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html' }],
},
{
  id: 'sap-008', exam: 'sap-c02', domain: 'sap-d1',
  q: `A SaaS provider runs an API on EC2 instances in its own VPC. Hundreds of enterprise customers, each with their own AWS accounts and VPCs, must call the API privately without traversing the internet. Many customers use the 10.0.0.0/16 CIDR range, which overlaps with the provider's VPC. Customers must only be able to reach the API and nothing else in the provider's network. Which solution meets these requirements?`,
  options: [
    `Create a VPC peering connection with each customer VPC and use security groups to restrict customers to the API port.`,
    `Create a transit gateway, share it with all customer accounts through AWS RAM, and use separate transit gateway route tables per customer.`,
    `Expose the API through an internet-facing Application Load Balancer and allow only each customer's NAT gateway Elastic IP addresses in a security group.`,
    `Place the API behind a Network Load Balancer, create a VPC endpoint service (AWS PrivateLink), and have each customer create an interface VPC endpoint in their VPC after the provider accepts the connection request.`,
  ],
  answer: 3,
  explain: `**Từ khoá:** "hundreds of customers", "privately", "overlapping CIDR", "only the API, nothing else" → **AWS PrivateLink** (endpoint service).

### Vì sao D đúng
- Provider đặt dịch vụ sau **NLB** rồi tạo **endpoint service**. Khách hàng tạo **interface endpoint**: một ENI có IP trong chính VPC của họ.
- Traffic chỉ đi một chiều từ consumer tới service, không có routing giữa hai VPC, nên **CIDR trùng nhau không thành vấn đề**.
- Khách chỉ thấy đúng dịch vụ được expose, không truy cập được phần còn lại của mạng provider. Provider có thể bật "acceptance required" và allowlist principal.

### Vì sao các phương án khác sai
- **A:** VPC peering **không cho phép CIDR chồng lấn**, và quản lý hàng trăm peering là không thực tế. Peering cũng mở routing ở mức mạng.
- **B:** TGW cũng định tuyến theo IP nên CIDR trùng sẽ xung đột; đồng thời kết nối mạng giữa provider và khách rộng hơn yêu cầu.
- **C:** đi qua internet (vi phạm "privately"), và danh sách IP NAT của hàng trăm khách thay đổi thường xuyên.

> Exam tip: "overlapping CIDR" + "expose one service to many consumers" → PrivateLink. Provider side = NLB (hoặc GWLB cho appliance); consumer side = interface endpoint.`,
  services: ['AWS PrivateLink', 'Network Load Balancer', 'Amazon VPC'],
},
{
  id: 'sap-009', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company with 200 AWS accounts in AWS Organizations frequently experiences overlapping VPC CIDR blocks, which breaks transit gateway routing when new VPCs are connected. Network engineers currently track allocations in a spreadsheet. The company wants to plan IP space hierarchically by Region and business unit, automatically allocate non-overlapping CIDRs when teams create VPCs, and monitor compliance across all accounts with minimal custom code. Which solution meets these requirements?`,
  options: [
    `Use Amazon VPC IP Address Manager (IPAM) integrated with AWS Organizations with a delegated administrator, create a pool hierarchy by Region and business unit with allocation rules, share the pools through AWS RAM, and have teams create VPCs from the IPAM pools.`,
    `Store the CIDR spreadsheet in Amazon DynamoDB and write a Lambda-backed CloudFormation custom resource that reserves the next free CIDR when a VPC stack is deployed.`,
    `Create a customer managed prefix list per business unit in the Network account and share it through AWS RAM so that teams pick CIDRs from it.`,
    `Create an AWS Config custom rule in every account that compares new VPC CIDRs with a list in Parameter Store and deletes overlapping VPCs.`,
  ],
  answer: 0,
  explain: `**Từ khoá:** "plan IP space hierarchically", "automatically allocate non-overlapping", "monitor compliance across all accounts", "minimal custom code" → **Amazon VPC IPAM**.

### Vì sao A đúng
- IPAM tích hợp với Organizations, có thể uỷ quyền cho một delegated administrator (thường là Network account) để quản lý và giám sát IP của mọi account.
- Pool lồng nhau: top-level pool → pool theo Region → pool theo business unit. **Allocation rules** giới hạn netmask tối thiểu/tối đa, tag bắt buộc.
- Chia sẻ pool qua RAM; khi tạo VPC chọn IPAM pool, IPAM cấp CIDR **không chồng lấn**. IPAM còn theo dõi CIDR đang dùng và báo tài nguyên non-compliant/overlapping.

### Vì sao các phương án khác sai
- **B:** tự xây hệ thống quản lý IP = nhiều custom code, dễ race condition, không giám sát được VPC tạo ngoài CloudFormation.
- **C:** prefix list là tập CIDR để dùng trong route table và security group, **không phải** cơ chế cấp phát hay kiểm tra trùng lặp.
- **D:** detective và phá huỷ (xoá VPC sau khi tạo), cần custom code ở 200 account, vẫn phải duy trì danh sách thủ công.

> Exam tip: "overlapping CIDR across many accounts", "IP address planning/tracking" → VPC IPAM. Đừng nhầm với prefix list (dùng cho rule/route).`,
  services: ['Amazon VPC IPAM', 'AWS Organizations', 'AWS RAM'],
},
{
  id: 'sap-010', exam: 'sap-c02', domain: 'sap-d1',
  q: `An analytics application runs on EC2 instances in Account A using an IAM role named AnalyticsRole. It must read objects from an S3 bucket in Account B. The objects are encrypted with SSE-KMS using a customer managed KMS key that is owned by Account B. Requests from AnalyticsRole currently fail with AccessDenied. Which combination of actions will grant the required access while following the principle of least privilege? (Choose three.)`,
  options: [
    `In Account B, add a statement to the S3 bucket policy that allows the AnalyticsRole ARN to perform s3:GetObject on the bucket objects.`,
    `In Account B, re-encrypt the objects with the AWS managed key aws/s3 and add AnalyticsRole to that key's key policy.`,
    `In Account B, add a statement to the customer managed key's key policy that allows the AnalyticsRole ARN to perform kms:Decrypt.`,
    `In Account A, create a gateway VPC endpoint for Amazon S3 so that cross-account requests are authorized.`,
    `In Account A, attach an identity-based policy to AnalyticsRole that allows s3:GetObject on the bucket in Account B and kms:Decrypt on the key ARN in Account B.`,
    `In Account B, enable S3 Object Ownership set to Bucket owner enforced and grant AnalyticsRole read access through an object ACL.`,
  ],
  answer: [0, 2, 4],
  multi: true,
  explain: `**Từ khoá:** "cross-account", "SSE-KMS", "customer managed key owned by Account B", "least privilege" → cần cho phép ở **cả hai phía** và cho **cả S3 lẫn KMS**.

### Vì sao A, C, E đúng
Cross-account cần **hai chữ ký**: account sở hữu tài nguyên phải cho phép (resource-based policy), account của principal cũng phải cho phép (identity-based policy).
- **A:** bucket policy ở B cho phép role của A đọc object.
- **C:** đọc object SSE-KMS nghĩa là S3 gọi {{kms:Decrypt}} thay mặt principal, nên **key policy** ở B phải cho phép role đó.
- **E:** policy trên AnalyticsRole ở A cho phép {{s3:GetObject}} và {{kms:Decrypt}} trên ARN của key ở B. Thiếu một trong ba thì vẫn AccessDenied.

### Vì sao các phương án khác sai
- **B:** key policy của **AWS managed key** (aws/s3) **không sửa được**, nên không thể cấp cho account khác. Đây là lý do cross-account với SSE-KMS bắt buộc dùng customer managed key.
- **D:** gateway endpoint chỉ đổi đường mạng, không liên quan tới authorization.
- **F:** "Bucket owner enforced" **vô hiệu hoá ACL**, vì vậy không thể cấp quyền bằng ACL; ACL cũng không cấp quyền KMS.

> Exam tip: cross-account S3 + SSE-KMS = bucket policy + key policy + IAM policy của caller. AWS managed key không chia sẻ cross-account được.`,
  services: ['Amazon S3', 'AWS KMS', 'IAM'],
},
{
  id: 'sap-011', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 80 AWS accounts in AWS Organizations and operates in four Regions. Amazon GuardDuty and AWS Security Hub are enabled in some accounts but not others. The security operations team, which works from a dedicated Security account, wants a single view of findings from all accounts and all Regions, wants new accounts to be enrolled automatically, and must receive an email within minutes whenever a CRITICAL severity finding is generated. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    `Deploy a Lambda function in every account and Region with StackSets that polls GuardDuty and Security Hub every 5 minutes and forwards findings to an S3 bucket in the Security account.`,
    `Create an AWS Config aggregator in the Security account that collects GuardDuty and Security Hub findings from all accounts, and configure an SNS notification on the aggregator.`,
    `Designate the Security account as the delegated administrator for GuardDuty and Security Hub, enable auto-enable for new member accounts, configure Security Hub cross-Region aggregation to one home Region, and create an Amazon EventBridge rule in that Region that matches imported findings with CRITICAL severity and targets an SNS topic.`,
    `Enable an organization CloudTrail trail and create a CloudWatch Logs metric filter that matches GuardDuty finding events, with an alarm that sends notifications through SNS.`,
  ],
  answer: 2,
  explain: `**Từ khoá:** "single view, all accounts and Regions", "new accounts automatically", "email within minutes for CRITICAL", "LEAST overhead" → **delegated administrator + auto-enable + cross-Region aggregation + EventBridge → SNS**.

### Vì sao C đúng
- GuardDuty và Security Hub đều hỗ trợ **delegated administrator** trong Organizations: Security account quản lý member, bật **auto-enable** cho account mới mà không cần chạm vào từng account.
- GuardDuty gửi finding sang Security Hub; **cross-Region aggregation** gom finding của các Region về một aggregation Region, nên có một màn hình duy nhất.
- Security Hub phát sự kiện "Security Hub Findings - Imported" lên EventBridge; rule lọc theo severity CRITICAL rồi đẩy tới SNS (email) gần thời gian thực.

### Vì sao các phương án khác sai
- **A:** tự viết và vận hành Lambda polling ở 80 account × 4 Region, trễ tới vài phút và nhiều điểm hỏng.
- **B:** Config aggregator tổng hợp **cấu hình và compliance của Config rule**, không thu thập finding GuardDuty, và aggregator không có "SNS notification" theo finding.
- **D:** finding GuardDuty **không phải** API call nên không xuất hiện trong CloudTrail; metric filter không bắt được.

> Exam tip: "centralize security findings across organization" → Security Hub (+ GuardDuty) delegated admin. "Notify on finding" → EventBridge rule → SNS/Lambda. Config aggregator chỉ dành cho dữ liệu AWS Config.`,
  services: ['AWS Security Hub', 'Amazon GuardDuty', 'Amazon EventBridge', 'Amazon SNS', 'AWS Organizations'],
},
{
  id: 'sap-012', exam: 'sap-c02', domain: 'sap-d1',
  q: `A startup that is growing quickly wants to move from a single AWS account to a multi-account environment. It needs a landing zone that follows AWS best practices with dedicated log archive and audit accounts, centrally applied preventive and detective guardrails, and a way for team leads to request new, pre-configured accounts through a self-service process. The company has a small cloud team and wants the solution to be running within days with the LEAST custom development. Which solution should a solutions architect recommend?`,
  options: [
    `Create an organization with AWS Organizations, write SCPs and AWS Config conformance packs manually, and build a Step Functions workflow that calls CreateAccount for new account requests.`,
    `Set up AWS Control Tower to create the landing zone, enable the required controls on the OUs, and use Account Factory so that team leads can provision accounts through AWS Service Catalog.`,
    `Use AWS Service Catalog in the existing account to publish a CloudFormation product that creates IAM users and VPCs for each team inside the single account.`,
    `Deploy AWS Config conformance packs to the existing account and use AWS Organizations only for consolidated billing of new accounts that teams create with their own credit cards.`,
  ],
  answer: 1,
  explain: `**Từ khoá:** "landing zone", "best practices", "log archive and audit accounts", "preventive and detective guardrails", "self-service account", "small team", "least custom development" → **AWS Control Tower**.

### Vì sao B đúng
- Control Tower dựng sẵn landing zone: organization, OU Security với **Log Archive** và **Audit** account, CloudTrail và AWS Config tập trung, IAM Identity Center.
- **Controls** (trước đây là guardrails): preventive dựa trên SCP, detective dựa trên AWS Config rule, proactive dựa trên CloudFormation hooks. Bật theo OU bằng vài cú click.
- **Account Factory** là product trong AWS Service Catalog: người được cấp quyền tự tạo account đã gắn sẵn baseline và control. Muốn tuỳ biến thêm thì dùng Account Factory Customization hoặc AFT (Terraform).

### Vì sao các phương án khác sai
- **A:** làm được nhưng phải tự viết toàn bộ landing zone, đúng phần việc Control Tower đã tự động hoá; vi phạm "least custom development".
- **C:** vẫn là một account; không có ranh giới cô lập account, không đáp ứng multi-account.
- **D:** account tạo ngoài organization rồi mời vào không có baseline hay guardrail; thanh toán bằng thẻ cá nhân là ngược với governance.

> Exam tip: "landing zone" + "quickly" + "best practices" → Control Tower. Nếu đề nhấn mạnh Terraform cho account vending → Account Factory for Terraform (AFT).`,
  services: ['AWS Control Tower', 'AWS Organizations', 'AWS Service Catalog'],
},
{
  id: 'sap-013', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company with 30 AWS accounts in AWS Organizations uses consolidated billing. Finance wants monthly cost reports grouped by business unit and project. Today, teams use inconsistent tag keys such as CostCenter, costcenter and cost-center, and many resources are untagged. The tags must appear as dimensions in AWS Cost Explorer and the Cost and Usage Report. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    `Activate the cost allocation tags in the billing console of each member account so that each team's costs are reported separately.`,
    `Enable AWS Budgets in each account with a filter on the CostCenter tag so that untagged resources are automatically tagged.`,
    `Create tag policies in AWS Organizations that define the standard tag keys, their capitalization and allowed values, and enable enforcement for the relevant resource types.`,
    `Create a Cost and Usage Report in every member account and merge them with AWS Glue to group costs by the CostCenter tag.`,
    `Activate the standardized user-defined tags as cost allocation tags in the management account of the organization.`,
  ],
  answer: [2, 4],
  multi: true,
  explain: `**Từ khoá:** "inconsistent tag keys", "grouped by business unit", "appear in Cost Explorer and CUR", "consolidated billing" → **Tag policies** để chuẩn hoá + **kích hoạt cost allocation tag ở management account**.

### Vì sao C và E đúng
- **C:** tag policy quy định tag key chuẩn (kể cả chữ hoa/thường), giá trị cho phép; bật enforcement để chặn thao tác tag không tuân thủ trên các resource type được hỗ trợ, và có báo cáo compliance toàn tổ chức.
- **E:** tag người dùng tự định nghĩa **chỉ xuất hiện** trong Cost Explorer / CUR sau khi được **activate làm cost allocation tag**. Với consolidated billing, việc này làm ở **management (payer) account** và áp dụng cho cả tổ chức. Tag chỉ có hiệu lực cho chi phí phát sinh sau khi kích hoạt.

### Vì sao các phương án khác sai
- **A:** trong organization, member account không tự activate cost allocation tag cho báo cáo hợp nhất; việc này nằm ở management account.
- **B:** AWS Budgets chỉ theo dõi và cảnh báo chi phí, không gắn tag cho tài nguyên.
- **D:** CUR có thể tạo ở management account cho toàn bộ tổ chức; tạo ở từng account rồi tự ghép là overhead thừa và vẫn không sửa được tag lộn xộn.

> Exam tip: chuẩn hoá tag → tag policy; bắt buộc có tag khi tạo → SCP với điều kiện {{aws:RequestTag}}; tag hiện trong báo cáo chi phí → activate cost allocation tag ở payer account. AWS Cost Categories giúp gom nhóm thêm theo quy tắc.`,
  services: ['AWS Organizations', 'Tag policies', 'AWS Cost Explorer', 'AWS Billing'],
},
{
  id: 'sap-014', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company runs steady-state workloads on Amazon EC2 across several instance families in two Regions, spending about $90,000 per month on On-Demand compute. Over the next 18 months, the company plans to migrate a large share of these workloads to Amazon ECS on AWS Fargate and AWS Lambda, but the exact timing and target Regions are not yet known. The company wants to commit to a 3-year term to reduce compute costs and wants the discount to apply across all accounts in its organization. Which purchasing option is MOST appropriate?`,
  options: [
    `Standard Reserved Instances for the current instance types, purchased in each member account that runs the workloads.`,
    `EC2 Instance Savings Plans for the most used instance family in each Region, purchased in the management account.`,
    `Convertible Reserved Instances that can be exchanged later for Fargate and Lambda capacity.`,
    `Compute Savings Plans purchased in the management account with discount sharing enabled across the organization.`,
  ],
  answer: 3,
  explain: `**Từ khoá:** "several instance families, two Regions", "migrate to Fargate and Lambda", "timing and Regions not known", "3-year commitment", "across all accounts" → **Compute Savings Plans**.

### Vì sao D đúng
- Compute Savings Plans cam kết một mức chi tiêu theo giờ (USD/hour) và tự áp dụng cho **EC2 (mọi family, size, Region, OS, tenancy), AWS Fargate và AWS Lambda**. Khi workload chuyển từ EC2 sang Fargate/Lambda, discount vẫn còn tác dụng.
- Mua ở management account với consolidated billing; mặc định discount được **chia sẻ** cho mọi account trong tổ chức (có thể tắt sharing nếu muốn).

### Vì sao các phương án khác sai
- **A:** Standard RI gắn với instance type/Region cụ thể và **chỉ áp dụng cho EC2**; workload chuyển sang Fargate/Lambda thì RI bị bỏ phí.
- **B:** EC2 Instance Savings Plans có discount cao hơn nhưng **khoá vào một instance family trong một Region** và không áp dụng cho Fargate/Lambda.
- **C:** Convertible RI chỉ đổi được sang **EC2 RI khác**, không đổi sang Fargate hay Lambda.

> Exam tip: linh hoạt tối đa (đổi family, Region, sang container/serverless) → Compute Savings Plans. Discount cao nhất cho workload EC2 cố định một family/Region → EC2 Instance Savings Plans hoặc Standard RI. SageMaker có Savings Plans riêng.`,
  services: ['Savings Plans', 'Amazon EC2', 'AWS Fargate', 'AWS Lambda', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'What are Savings Plans?', url: 'https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html' }],
},
{
  id: 'sap-015', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 50 workload accounts in AWS Organizations. The operations team in a central Monitoring account must receive specific events in near real time from all workload accounts, including EC2 instance state changes, AWS Health events and CodePipeline failures, and route them to an incident management tool. Workload account owners must not be able to send events from accounts outside the organization to the central bus. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    `Create a custom event bus in the Monitoring account with a resource-based policy that allows events:PutEvents when aws:PrincipalOrgID equals the organization ID, and deploy EventBridge rules in each workload account (using StackSets) that target the central event bus.`,
    `Create an SNS topic in every workload account that receives the events and add an email subscription for the operations team to each topic.`,
    `Enable CloudWatch cross-account observability with the Monitoring account as the monitoring account and create metric alarms for each event type.`,
    `Create a CloudTrail organization trail, store events in CloudTrail Lake, and run scheduled SQL queries every minute to detect the events.`,
  ],
  answer: 0,
  explain: `**Từ khoá:** "events in near real time from all accounts", "central Monitoring account", "only from the organization", "LEAST overhead" → **EventBridge cross-account: rule ở account nguồn → custom event bus trung tâm** với policy giới hạn {{aws:PrincipalOrgID}}.

### Vì sao A đúng
- EventBridge cho phép rule ở account A dùng **event bus của account B làm target**. Event giữ nguyên nội dung (account, Region, detail) và tới gần thời gian thực.
- Resource-based policy trên bus trung tâm với điều kiện {{aws:PrincipalOrgID}} chỉ cho phép account trong tổ chức gửi event, và account mới tự động hợp lệ.
- StackSets service-managed với automatic deployment tự tạo rule cho account mới. Bus trung tâm có một rule chuyển tiếp tới incident tool (API destination, SNS, Lambda…).

### Vì sao các phương án khác sai
- **B:** 50 topic với 50 nhóm subscription, không tập trung, không có xử lý/route nào; email không tích hợp với incident tool.
- **C:** cross-account observability chia sẻ **metrics, logs, traces**, không phải event như EC2 state change hay Health event.
- **D:** CloudTrail chỉ chứa API call, không chứa event như AWS Health; query định kỳ theo lô không phải near real time và tốn chi phí query.

> Exam tip: "multi-account event notifications" → EventBridge cross-account event bus. Khoá nguồn bằng {{aws:PrincipalOrgID}} trong policy của bus thay vì liệt kê từng account ID.`,
  services: ['Amazon EventBridge', 'AWS Organizations', 'AWS CloudFormation StackSets'],
},
{
  id: 'sap-016', exam: 'sap-c02', domain: 'sap-d1',
  q: `A manufacturing company runs 150 Windows and Linux servers in its on-premises VMware environment. It needs a disaster recovery solution in AWS with an RPO measured in seconds and an RTO of under 30 minutes. The company wants to avoid paying for full-size compute in AWS until a disaster occurs and wants to run non-disruptive recovery drills regularly. Which solution meets these requirements MOST cost-effectively?`,
  options: [
    `Use AWS Backup with VMware support to back up the VMs every hour and restore them to EC2 in the event of a disaster.`,
    `Use AWS Application Migration Service to replicate the servers and launch cutover instances when a disaster occurs.`,
    `Use AWS Elastic Disaster Recovery to continuously replicate the servers into a low-cost staging area subnet, and launch recovery instances (including drill instances) only when needed.`,
    `Create AMIs of all servers with VM Import/Export every night and keep a fully scaled warm standby fleet of EC2 instances running in AWS.`,
  ],
  answer: 2,
  explain: `**Từ khoá:** "RPO seconds", "RTO < 30 minutes", "avoid paying for full-size compute", "non-disruptive drills", on-prem servers → **AWS Elastic Disaster Recovery (DRS)**.

### Vì sao C đúng
- DRS cài replication agent, sao chép **liên tục ở mức block** về AWS → RPO tính bằng giây.
- Dữ liệu nằm trong **staging area** rẻ: replication server nhỏ + EBS volume giá thấp. Không chạy instance cỡ thật cho tới khi recovery.
- Recovery instance khởi chạy trong vài phút (RTO thường tính bằng phút). DRS hỗ trợ **drill** mà không làm gián đoạn replication; có failback về on-prem.

### Vì sao các phương án khác sai
- **A:** sao lưu mỗi giờ → RPO tới 1 giờ; restore 150 VM từ backup khó đạt RTO 30 phút.
- **B:** Application Migration Service (MGN) dùng cùng công nghệ replication nhưng được thiết kế cho **di chuyển một lần (migration)**: sau cutover, server nguồn bị ngắt replicate. Nó không có quy trình DR lâu dài như recovery drill định kỳ và failback về on-prem.
- **D:** AMI hằng đêm → RPO 24 giờ; chạy sẵn fleet đầy đủ trái với yêu cầu không trả tiền compute cỡ thật.

> Exam tip: on-prem hoặc cross-Region EC2 + "RPO seconds, RTO minutes" + "low cost" → Elastic Disaster Recovery. "Lift-and-shift migration" → MGN.`,
  services: ['AWS Elastic Disaster Recovery', 'Amazon EC2', 'Amazon EBS'],
},
{
  id: 'sap-017', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company is onboarding a third-party monitoring SaaS vendor that needs read-only access to CloudWatch metrics and EC2 descriptions in the company's 25 AWS accounts. The vendor serves thousands of customers from its own AWS account. The security team wants to avoid long-term credentials and must prevent the vendor's other customers from tricking the vendor into accessing the company's accounts. Which solution meets these requirements?`,
  options: [
    `Create an IAM user with read-only permissions in each account and send the access keys to the vendor through an encrypted channel, rotating them every 90 days.`,
    `Create an IAM role in each account with a read-only permissions policy and a trust policy that allows the vendor's AWS account to assume it only when the sts:ExternalId condition matches a unique value issued by the vendor for this company.`,
    `Create an IAM role in each account whose trust policy allows the vendor's AWS account to assume it without conditions, and restrict the permissions with an SCP.`,
    `Share the CloudWatch metrics with the vendor account using AWS RAM resource shares in each account.`,
  ],
  answer: 1,
  explain: `**Từ khoá:** "third-party vendor", "thousands of customers", "avoid long-term credentials", "prevent other customers from tricking the vendor" → **cross-account role + external ID** (chống **confused deputy**).

### Vì sao B đúng
- Role cross-account cho vendor dùng credentials tạm thời từ {{sts:AssumeRole}}, không có access key dài hạn.
- **Confused deputy**: vendor phục vụ nhiều khách; nếu khách xấu biết ARN role của bạn, họ có thể khai báo ARN đó trong cấu hình của mình để vendor truy cập account bạn. **External ID** duy nhất (do vendor sinh cho từng khách) được kiểm tra trong trust policy bằng {{sts:ExternalId}}, nên chặn được kịch bản này.
- Permissions policy chỉ cấp quyền đọc cần thiết (least privilege).

### Vì sao các phương án khác sai
- **A:** access key dài hạn, vi phạm trực tiếp yêu cầu; rò rỉ key là rủi ro lớn.
- **C:** không có điều kiện external ID → vẫn dính confused deputy. SCP giới hạn quyền nhưng không giải quyết việc ai được kích hoạt vendor truy cập.
- **D:** AWS RAM không chia sẻ CloudWatch metrics kiểu này; RAM chỉ hỗ trợ một số loại tài nguyên (subnet, TGW, Resolver rule…).

> Exam tip: "third party", "confused deputy" → external ID. Với dịch vụ AWS gọi thay bạn (service principal), dùng {{aws:SourceArn}} / {{aws:SourceAccount}} cho cùng mục đích.`,
  services: ['IAM', 'AWS STS'],
},
{
  id: 'sap-018', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 40 VPCs connected through a transit gateway. Workloads in every VPC call Amazon SQS, AWS KMS and Amazon ECR APIs privately. Each VPC currently has its own interface VPC endpoints for these services in three Availability Zones, and endpoint charges have become significant. The company wants to reduce cost while keeping all traffic to these services on private connectivity and without changing application code. Which solution meets these requirements?`,
  options: [
    `Create gateway VPC endpoints for SQS, KMS and ECR in a shared services VPC and route traffic from the other VPCs to them through the transit gateway.`,
    `Remove the interface endpoints and route the traffic from all VPCs through a centralized NAT gateway in an egress VPC attached to the transit gateway.`,
    `Create the interface endpoints in a shared services VPC with private DNS enabled; the other VPCs will automatically resolve the service names to the endpoint IP addresses through the transit gateway.`,
    `Create the interface endpoints in a shared services VPC with private DNS disabled, create Route 53 private hosted zones for each service endpoint name with alias records to the endpoints, and associate the private hosted zones with all spoke VPCs.`,
  ],
  answer: 3,
  explain: `**Từ khoá:** "40 VPCs", "transit gateway", "interface endpoints cost", "private connectivity", "no code change" → **centralized interface endpoints** trong shared services VPC + **private hosted zone** chia sẻ cho các spoke.

### Vì sao D đúng
- Interface endpoint tính phí theo giờ cho mỗi AZ và theo GB; gom về một VPC giảm số endpoint từ 40 × 3 dịch vụ xuống 3 dịch vụ.
- Spoke VPC đến được IP của endpoint qua TGW. Để code không đổi (vẫn gọi {{sqs.us-east-1.amazonaws.com}}…), tạo **private hosted zone** cho tên endpoint, alias trỏ tới DNS của endpoint, rồi associate PHZ với mọi spoke VPC (cross-account association cần bước authorize).

### Vì sao các phương án khác sai
- **A:** gateway endpoint chỉ có cho **S3 và DynamoDB**, và gateway endpoint **không** dùng được từ ngoài VPC (qua TGW, peering, VPN).
- **B:** NAT gateway đưa traffic ra endpoint công khai của dịch vụ, không còn private connectivity; lại thêm phí NAT data processing.
- **C:** private DNS của interface endpoint chỉ có tác dụng **trong VPC chứa endpoint**; các spoke vẫn phân giải ra IP công khai.

> Exam tip: "centralize interface endpoints" luôn đi kèm "disable private DNS + PHZ associate với spoke VPC" (hoặc Route 53 Resolver). Gateway endpoint không transitive.`,
  services: ['AWS PrivateLink', 'AWS Transit Gateway', 'Amazon Route 53', 'Amazon VPC'],
},
{
  id: 'sap-019', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company runs an order management application in us-east-1 on EC2 instances in an Auto Scaling group behind an Application Load Balancer, with an Amazon Aurora MySQL database. The business requires disaster recovery to us-west-2 with an RPO of 1 minute and an RTO of 2 hours. The company wants to minimize the cost of the DR environment while it is not in use. Which solution meets these requirements MOST cost-effectively?`,
  options: [
    `Use AWS Backup to take Aurora snapshots every 4 hours and copy them to us-west-2; restore the database and deploy the application stack with CloudFormation during a disaster.`,
    `Run a full-size copy of the application in us-west-2 behind its own ALB with an Aurora global database secondary cluster, and use Route 53 weighted routing to send 50% of traffic to each Region.`,
    `Create an Aurora global database with a secondary cluster in us-west-2, copy the AMIs and keep the infrastructure defined in CloudFormation with an Auto Scaling group set to zero instances; during a disaster, fail over the global database, scale out the Auto Scaling group and update Route 53.`,
    `Run a scaled-down but functional copy of the application fleet in us-west-2 at all times with an Aurora global database secondary cluster, and use Route 53 failover routing.`,
  ],
  answer: 2,
  explain: `**Từ khoá:** "RPO 1 minute" (cần replication liên tục), "RTO 2 hours" (có thời gian dựng compute), "minimize cost while not in use" → **pilot light** với **Aurora global database**.

### Vì sao C đúng
- Aurora global database replicate ở tầng storage, độ trễ thường dưới 1 giây → RPO thoả 1 phút. Failover/promote secondary mất vài phút.
- Pilot light: chỉ phần "lõi" (dữ liệu) luôn chạy; compute ở trạng thái tắt (AMI + ASG = 0 + IaC). Khi có thảm hoạ, scale ASG và chuyển DNS, nằm gọn trong RTO 2 giờ.
- Chi phí khi không dùng gần như chỉ là secondary cluster + storage.

### Vì sao các phương án khác sai
- **A:** backup & restore rẻ nhất nhưng snapshot mỗi 4 giờ → **RPO 4 giờ**, vi phạm 1 phút.
- **B:** multi-site active/active: đáp ứng nhưng **đắt nhất** (chạy đầy đủ hai Region), thừa so với RTO 2 giờ.
- **D:** warm standby đáp ứng RPO/RTO nhưng luôn chạy fleet thu nhỏ; đắt hơn pilot light mà không cần thiết với RTO 2 giờ.

> Exam tip: xếp theo RTO/chi phí: backup & restore (giờ) → pilot light (hàng chục phút–giờ) → warm standby (phút) → multi-site (gần 0). Chọn phương án **rẻ nhất vẫn thoả cả RPO và RTO**.`,
  services: ['Amazon Aurora', 'Amazon Route 53', 'Amazon EC2 Auto Scaling', 'AWS CloudFormation'],
  refs: [{ type: 'doc', title: 'Disaster recovery options in the cloud', url: 'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html' }],
},
{
  id: 'sap-020', exam: 'sap-c02', domain: 'sap-d2',
  q: `A gaming company stores player profiles and inventory in an Amazon DynamoDB table in us-east-1. It is launching in Europe and Asia and requires single-digit millisecond read AND write latency for players in each geography, with the application in each Region writing locally. If a Region becomes unavailable, players must be served from another Region with no data reconciliation work by the company. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    `Convert the table into a DynamoDB global table with replicas in eu-west-1 and ap-northeast-1, and have the application in each Region read and write to its local replica.`,
    `Enable DynamoDB Streams and write Lambda functions in each Region that replicate changes to tables in the other Regions, handling conflicts with a version attribute.`,
    `Deploy DynamoDB Accelerator (DAX) clusters in eu-west-1 and ap-northeast-1 that cache the us-east-1 table.`,
    `Migrate the data to an Aurora PostgreSQL global database and enable write forwarding on the secondary Regions.`,
  ],
  answer: 0,
  explain: `**Từ khoá:** "read AND write latency local", "each Region writing locally", "no reconciliation work", "LEAST overhead" → **DynamoDB global tables** (multi-active).

### Vì sao A đúng
- Global table có replica ở nhiều Region, **mỗi replica đều nhận ghi** (active-active). AWS tự replicate thay đổi giữa các replica, thường trong khoảng một giây với chế độ mặc định (multi-Region eventual consistency).
- Xung đột ghi đồng thời cùng item được giải quyết tự động theo **last writer wins**, nên công ty không phải tự viết logic hoà giải.
- Một Region lỗi → ứng dụng chuyển sang replica khác, dữ liệu đã có sẵn.

### Vì sao các phương án khác sai
- **B:** tự xây lại đúng chức năng global tables, phải xử lý conflict, retry, vòng lặp replicate; overhead lớn.
- **C:** DAX là cache **trong một Region**, không cache được bảng ở Region khác qua khoảng cách xa, và **không tăng tốc ghi** (ghi đi qua DAX vẫn về bảng gốc ở us-east-1).
- **D:** write forwarding chuyển lệnh ghi từ secondary về **primary Region**, nên độ trễ ghi ở châu Âu/châu Á là cross-Region; còn phải đổi data model sang SQL.

> Exam tip: "multi-Region active-active writes" với key-value → DynamoDB global tables. Aurora global database chỉ có **một Region ghi** (secondary đọc; write forwarding vẫn ghi ở primary).`,
  services: ['Amazon DynamoDB', 'DynamoDB global tables'],
},
{
  id: 'sap-021', exam: 'sap-c02', domain: 'sap-d2',
  q: `A healthcare company stores medical images in an S3 bucket in eu-west-1. A new regulation requires that every new object be copied to a bucket in eu-central-1, that 99.99% of objects be replicated within 15 minutes backed by a service level agreement, and that the operations team be alerted when replication falls behind. Objects that already exist in the bucket must also be copied once. Which solution meets these requirements?`,
  options: [
    `Configure S3 Cross-Region Replication without additional features, and run a daily S3 Inventory report to identify objects that have not been replicated.`,
    `Create an S3 event notification that invokes a Lambda function to copy each new object to eu-central-1, and use a CloudWatch alarm on Lambda errors.`,
    `Schedule S3 Batch Operations every 15 minutes to copy all objects created in the last 15 minutes to the destination bucket.`,
    `Configure S3 Cross-Region Replication with S3 Replication Time Control (S3 RTC) enabled, which includes replication metrics and event notifications, and use S3 Batch Replication to replicate the existing objects.`,
  ],
  answer: 3,
  explain: `**Từ khoá:** "99.99% within 15 minutes", "SLA", "alerted when replication falls behind", "existing objects" → **CRR + S3 Replication Time Control + Batch Replication**.

### Vì sao D đúng
- **S3 RTC** cam kết replicate 99.99% object mới trong **15 phút**, có **SLA**. Bật RTC sẽ bật kèm **replication metrics** (bytes/operations pending, replication latency) và **S3 event notification** khi object vượt ngưỡng 15 phút hoặc replicate lỗi → dùng để cảnh báo.
- Replication rule chỉ áp dụng cho object **mới** sau khi tạo rule. Object có sẵn phải dùng **S3 Batch Replication** (một lần).
- Yêu cầu versioning bật ở cả hai bucket.

### Vì sao các phương án khác sai
- **A:** CRR thường thì phần lớn object replicate nhanh nhưng **không có SLA 15 phút**; Inventory hằng ngày không phải cảnh báo kịp thời và không xử lý object cũ.
- **B:** tự xây replication bằng Lambda: không có SLA, phải xử lý object lớn (multipart), retry, thứ tự phiên bản; không copy object cũ.
- **C:** batch theo lịch là cơ chế thô, không có SLA và không thay được replication liên tục; chi phí Batch Operations mỗi job.

> Exam tip: "replication within 15 minutes / SLA / predictable" → S3 RTC. "Replicate existing objects" → S3 Batch Replication. Replication cần versioning ở cả nguồn và đích.`,
  services: ['Amazon S3', 'S3 Replication Time Control', 'S3 Batch Replication'],
  refs: [{ type: 'doc', title: 'Meeting compliance requirements with S3 Replication Time Control', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-time-control.html' }],
},
{
  id: 'sap-022', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company runs a customer portal in us-east-1 behind an Application Load Balancer. The company wants users to see a static "We will be back soon" page hosted in an S3 bucket in us-west-2 whenever the portal in us-east-1 is unhealthy, and wants traffic to return automatically to the portal when it recovers. The DNS zone is hosted in Amazon Route 53. Which configuration meets these requirements?`,
  options: [
    `Create two weighted alias records with weights 100 for the ALB and 0 for the S3 website endpoint, without health checks.`,
    `Create a failover routing policy with a primary alias record to the ALB with Evaluate Target Health enabled and a secondary alias record to the S3 website endpoint in us-west-2.`,
    `Create latency-based alias records for the ALB and the S3 website endpoint so that users are always routed to the Region with the lowest latency.`,
    `Create a geolocation routing policy that routes North American users to the ALB and a default location record that routes all other users to the S3 website endpoint.`,
  ],
  answer: 1,
  explain: `**Từ khoá:** "whenever the portal is unhealthy", "static page in another Region", "return automatically when it recovers" → **Route 53 failover routing (active-passive)** với health check.

### Vì sao B đúng
- Failover routing có bản ghi **primary** và **secondary**. Route 53 trả về primary khi nó healthy và tự chuyển sang secondary khi primary unhealthy, rồi tự quay lại khi primary phục hồi.
- Với alias tới ALB, bật **Evaluate Target Health**: Route 53 dựa vào health của target trong ALB, không cần tạo health check riêng.
- Secondary là alias tới **S3 static website endpoint** (tên bucket phải trùng tên bản ghi) hoặc CloudFront.

### Vì sao các phương án khác sai
- **A:** weighted 100/0 mà không có health check thì Route 53 không biết primary hỏng, vẫn trả về ALB. Ngoài ra khi tất cả bản ghi khác 0 đều unhealthy mới xét bản ghi weight 0, nên vẫn cần health check.
- **C:** latency routing gửi một phần người dùng tới trang bảo trì **ngay cả khi portal khoẻ**, vì S3 ở us-west-2 có thể có độ trễ thấp hơn với họ.
- **D:** geolocation chia theo vị trí, không theo trạng thái health; người dùng ngoài Bắc Mỹ luôn thấy trang bảo trì.

> Exam tip: "active-passive / backup site / maintenance page" → failover routing. "Evaluate Target Health" là cách rẻ nhất để gắn health cho alias tới ELB.`,
  services: ['Amazon Route 53', 'Application Load Balancer', 'Amazon S3'],
},
{
  id: 'sap-023', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company runs a Java web application on a single large EC2 instance. The application stores HTTP session state in memory and on the local disk, and a MySQL database runs on the same instance. The company has experienced long outages when the instance or its Availability Zone failed. The company wants the application to survive the loss of an instance or an entire Availability Zone without users losing their sessions, with minimal application code changes. Which combination of steps should a solutions architect recommend? (Choose three.)`,
  options: [
    `Enable sticky sessions on an Application Load Balancer so that each user always returns to the instance that holds the session.`,
    `Run the application in an Auto Scaling group across at least two Availability Zones behind an Application Load Balancer.`,
    `Externalize session state to an Amazon ElastiCache (Redis OSS or Valkey) replication group with Multi-AZ and automatic failover enabled.`,
    `Launch the instances in a cluster placement group to minimize latency between the application servers.`,
    `Create an RDS read replica of the MySQL database in the same Availability Zone as the primary.`,
    `Migrate the MySQL database to an Amazon RDS for MySQL Multi-AZ deployment.`,
  ],
  answer: [1, 2, 5],
  multi: true,
  explain: `**Từ khoá:** "survive instance or AZ loss", "users not lose sessions", "minimal code changes" → tách trạng thái ra khỏi instance: **ASG đa AZ + ALB**, **session ra ElastiCache Multi-AZ**, **database lên RDS Multi-AZ**.

### Vì sao B, C, F đúng
- **B:** ASG trải nhiều AZ thay thế instance hỏng; ALB chỉ gửi traffic tới target healthy. Tầng web trở thành stateless.
- **C:** session lưu trong ElastiCache có replica ở AZ khác và automatic failover; instance nào cũng đọc được session. Với Java, thường chỉ cần cấu hình Spring Session Data Redis, ít đổi code.
- **F:** RDS Multi-AZ có standby đồng bộ ở AZ khác và failover tự động (thường 60–120 giây), endpoint DNS không đổi.

### Vì sao các phương án khác sai
- **A:** sticky session chỉ gắn user với một instance; instance đó chết thì **session mất**. Không giải quyết yêu cầu.
- **D:** cluster placement group gom instance vào **một AZ**, ngược với yêu cầu chịu lỗi AZ.
- **E:** read replica cùng AZ không giúp gì khi AZ hỏng, và read replica dùng replication bất đồng bộ, phải promote thủ công.

> Exam tip: "không mất session khi instance chết" → session store ngoài (ElastiCache/DynamoDB), không phải sticky session. "HA cho database" → Multi-AZ; "scale đọc" → read replica.`,
  services: ['Amazon EC2 Auto Scaling', 'Application Load Balancer', 'Amazon ElastiCache', 'Amazon RDS'],
},
{
  id: 'sap-024', exam: 'sap-c02', domain: 'sap-d2',
  q: `A retail company is building an order intake service. During promotions, order submissions spike from 50 to 5,000 per second for about 30 minutes. Each order must be sent to a legacy ERP system that can handle at most 20 concurrent requests; exceeding this causes the ERP to crash. No order may be lost, and customers only need an immediate acknowledgment that the order was received. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    `Use Amazon API Gateway with a Lambda integration that calls the ERP synchronously, and configure API Gateway throttling at 20 requests per second.`,
    `Use Amazon API Gateway to send orders to an Amazon SQS FIFO queue and configure a single EC2 instance that polls the queue and calls the ERP with 20 threads.`,
    `Use Amazon API Gateway with a direct service integration to an Amazon SQS standard queue, and process the queue with a Lambda function whose SQS event source mapping has maximum concurrency set to 20, with a dead-letter queue for failed messages.`,
    `Use Amazon API Gateway to invoke a Lambda function asynchronously, which calls the ERP; set the function's provisioned concurrency to 20.`,
  ],
  answer: 2,
  explain: `**Từ khoá:** "spike 100x", "ERP at most 20 concurrent", "no order may be lost", "immediate acknowledgment", "LEAST overhead" → **buffer bằng SQS** + **giới hạn concurrency của consumer**.

### Vì sao C đúng
- API Gateway ghi thẳng vào SQS (service integration, không cần Lambda ở đầu vào) và trả 200 ngay: đúng "immediate acknowledgment". SQS standard chịu được gần như không giới hạn throughput và giữ message tới 14 ngày.
- **Maximum concurrency** trên SQS event source mapping giới hạn số Lambda chạy đồng thời đọc từ queue (ví dụ 20), nên ERP không bao giờ nhận quá 20 request. Message chưa xử lý nằm chờ trong queue.
- DLQ (redrive policy) giữ message lỗi nhiều lần để điều tra, không mất đơn. Consumer phải idempotent (at-least-once).

### Vì sao các phương án khác sai
- **A:** throttling trả **HTTP 429** cho đơn vượt ngưỡng → đơn bị mất; throttling giới hạn tốc độ, không phải số request đồng thời.
- **B:** FIFO có giới hạn throughput (mặc định 300 message/giây không batch) thấp hơn nhiều so với 5.000/giây trừ khi bật high throughput mode; một EC2 là single point of failure và phải tự vận hành.
- **D:** provisioned concurrency chỉ **giữ sẵn** môi trường để giảm cold start, **không giới hạn** concurrency tối đa; ERP vẫn bị dồn request. (Reserved concurrency mới là giới hạn trên.)

> Exam tip: "downstream can't handle spikes" → queue để buffer + giới hạn consumer. Với SQS → Lambda, ưu tiên **maximum concurrency** của event source mapping hơn reserved concurrency.`,
  services: ['Amazon API Gateway', 'Amazon SQS', 'AWS Lambda'],
},
{
  id: 'sap-025', exam: 'sap-c02', domain: 'sap-d2',
  q: `A payments company wants to detect fraud rings in near real time. Each new transaction must be checked to see whether the card, device, email address or shipping address is connected, within up to four hops, to accounts previously flagged as fraudulent. The data set contains billions of relationships, and queries must return within tens of milliseconds. The company prefers a fully managed service. Which data store should a solutions architect choose?`,
  options: [
    `Amazon Neptune, modeling cards, devices, emails, addresses and accounts as vertices and their relationships as edges, queried with openCypher or Gremlin.`,
    `Amazon RDS for PostgreSQL with recursive common table expressions over join tables that store the relationships.`,
    `Amazon DynamoDB with an adjacency list design and an application layer that performs one query per hop.`,
    `Amazon OpenSearch Service with each relationship indexed as a separate document and nested aggregations to follow connections.`,
  ],
  answer: 0,
  explain: `**Từ khoá:** "connected within up to four hops", "billions of relationships", "tens of milliseconds", "fully managed" → bài toán **duyệt quan hệ nhiều bước** → **graph database: Amazon Neptune**.

### Vì sao A đúng
- Neptune là graph database managed, hỗ trợ property graph (Gremlin, openCypher) và RDF (SPARQL). Duyệt cạnh từ đỉnh này sang đỉnh khác là thao tác gốc, không cần join.
- Truy vấn kiểu "tìm account bị gắn cờ trong 4 bước từ thẻ này" là ví dụ kinh điển cho fraud ring detection; Neptune có read replica để scale đọc.

### Vì sao các phương án khác sai
- **B:** recursive CTE chạy được nhưng mỗi bước là một join trên bảng lớn; với hàng tỷ quan hệ và 4 bước, số hàng trung gian bùng nổ, khó đạt hàng chục ms.
- **C:** DynamoDB adjacency list hợp với 1–2 bước truy cập đã biết trước; 4 bước nghĩa là nhiều vòng query tuần tự từ ứng dụng, fan-out lớn, độ trễ và chi phí tăng mạnh.
- **D:** OpenSearch mạnh về full-text và phân tích log, không có khả năng duyệt graph nhiều bước.

> Exam tip: "relationships", "social network", "recommendation", "fraud rings", "knowledge graph" → Neptune. Purpose-built database là chủ đề lặp lại nhiều trong SAP-C02.`,
  services: ['Amazon Neptune'],
},
{
  id: 'sap-026', exam: 'sap-c02', domain: 'sap-d2',
  q: `A media company's application reads product metadata from an Amazon DynamoDB table. During live events, a small set of items receives millions of reads per minute, causing throttling on hot partitions and p99 read latency of 8 ms. The business requires microsecond read latency for these items and wants to avoid rewriting the data access layer, which uses the DynamoDB SDK. Eventually consistent reads are acceptable. Which solution meets these requirements?`,
  options: [
    `Switch the table to on-demand capacity mode so that it can absorb any read traffic.`,
    `Add an Amazon ElastiCache (Redis OSS) cluster and implement a lazy-loading cache in the application.`,
    `Create a global secondary index on the hot items and direct reads to the index.`,
    `Deploy a DynamoDB Accelerator (DAX) cluster in the application's VPC and point the application to the DAX client, which is API-compatible with DynamoDB.`,
  ],
  answer: 3,
  explain: `**Từ khoá:** "hot items, millions of reads", "microsecond latency", "avoid rewriting data access layer", "eventually consistent OK" → **DynamoDB Accelerator (DAX)**.

### Vì sao D đúng
- DAX là cache in-memory, write-through, được thiết kế riêng cho DynamoDB: đọc trúng cache có độ trễ cỡ **micro giây**.
- DAX client **tương thích API** với DynamoDB, chỉ cần đổi client/endpoint, không viết lại logic cache.
- Đọc nóng được DAX phục vụ nên không còn dồn vào partition nóng của bảng. DAX chỉ phục vụ eventually consistent read từ cache (strongly consistent read đi thẳng xuống bảng), khớp với yêu cầu.

### Vì sao các phương án khác sai
- **A:** on-demand nâng giới hạn throughput toàn bảng, nhưng mỗi partition vẫn có giới hạn đọc riêng (3.000 RCU) và độ trễ vẫn là mili giây, không phải micro giây.
- **B:** ElastiCache cũng cho độ trễ thấp nhưng **phải tự viết logic cache** (lazy loading, invalidation) trong data access layer, trái với yêu cầu.
- **C:** GSI chỉ là bản sao dữ liệu với key khác; item nóng vẫn nóng trên GSI và độ trễ vẫn mili giây.

> Exam tip: DynamoDB + "microseconds" + "minimal code change" → DAX. Cache cho RDS hoặc dữ liệu tổng hợp nhiều nguồn → ElastiCache.`,
  services: ['Amazon DynamoDB', 'DynamoDB Accelerator (DAX)'],
},
{
  id: 'sap-027', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company serves a single-page application and downloadable reports from an S3 bucket through Amazon CloudFront. A security review requires that the bucket objects be encrypted with SSE-KMS using a customer managed key and that the objects be accessible ONLY through the CloudFront distribution, never directly from S3. Which solution meets these requirements?`,
  options: [
    `Configure the bucket as an S3 static website endpoint origin and add a bucket policy that allows access only when the Referer header contains a secret value set by CloudFront.`,
    `Use an origin access control (OAC) on the CloudFront S3 origin, add a bucket policy that allows the cloudfront.amazonaws.com service principal with an AWS:SourceArn condition for the distribution, and update the KMS key policy to allow the same service principal to use kms:Decrypt.`,
    `Use an origin access identity (OAI) on the CloudFront S3 origin and grant the OAI access in the bucket policy and the KMS key policy.`,
    `Keep the bucket private and have the application generate S3 presigned URLs for every object request, then cache the presigned URLs in CloudFront.`,
  ],
  answer: 1,
  explain: `**Từ khoá:** "SSE-KMS customer managed key", "only through CloudFront, never directly from S3" → **Origin Access Control (OAC)** + bucket policy + key policy.

### Vì sao B đúng
- OAC là cơ chế hiện hành (thay cho OAI). CloudFront ký request tới S3 bằng SigV4 dưới service principal {{cloudfront.amazonaws.com}}.
- Bucket policy cho phép principal này với điều kiện {{AWS:SourceArn}} bằng ARN của distribution → chỉ đúng distribution này đọc được; block public access vẫn bật.
- OAC **hỗ trợ SSE-KMS**: thêm vào key policy quyền {{kms:Decrypt}} cho cùng service principal với cùng điều kiện SourceArn.

### Vì sao các phương án khác sai
- **A:** website endpoint không hỗ trợ OAC/OAI và yêu cầu bucket cho phép đọc công khai; header Referer bí mật chỉ là che giấu, ai biết giá trị đều gọi thẳng S3 được.
- **C:** OAI là cơ chế cũ và **không hỗ trợ object mã hoá SSE-KMS**; OAI không phải principal dùng được trong key policy cho mục đích này.
- **D:** presigned URL cho phép bất kỳ ai có URL truy cập trực tiếp S3, vi phạm "never directly from S3"; cache presigned URL cũng phá hiệu quả cache.

> Exam tip: CloudFront + S3 private + SSE-KMS → OAC. Thấy OAI kèm SSE-KMS trong đáp án là dấu hiệu sai. Website endpoint = luôn public.`,
  services: ['Amazon CloudFront', 'Amazon S3', 'AWS KMS'],
  refs: [{ type: 'doc', title: 'Restrict access to an Amazon S3 origin', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html' }],
},
{
  id: 'sap-028', exam: 'sap-c02', domain: 'sap-d2',
  q: `A global e-commerce company runs its storefront on Amazon CloudFront with Application Load Balancer origins and uses Route 53 for DNS. Last year, a large DDoS attack caused a significant spike in the AWS bill and the team struggled to mitigate application-layer attacks. For the next peak season, the company requires protection against large-scale layer 3, 4 and 7 attacks, access to AWS DDoS experts 24/7 during an attack, and financial protection against scaling charges caused by DDoS. The company has an AWS Business Support plan. Which solution meets these requirements?`,
  options: [
    `Rely on AWS Shield Standard and add AWS WAF rate-based rules and AWS Managed Rules on the CloudFront distribution.`,
    `Enable Amazon GuardDuty in all Regions and configure automated remediation with Lambda functions that block attacking IP addresses in security groups.`,
    `Subscribe to AWS Shield Advanced, add the CloudFront distributions, ALBs and Route 53 hosted zones as protected resources, attach AWS WAF web ACLs with rate-based rules, and engage the Shield Response Team (SRT) during attacks.`,
    `Deploy AWS Network Firewall in each VPC in front of the Application Load Balancers with stateful rules that drop suspicious traffic.`,
  ],
  answer: 2,
  explain: `**Từ khoá:** "large-scale L3/4/7", "DDoS experts 24/7", "financial protection against scaling charges" → **AWS Shield Advanced** (+ AWS WAF).

### Vì sao C đúng
- Shield Advanced bảo vệ nâng cao cho CloudFront, Route 53, Global Accelerator, ELB, Elastic IP; có phát hiện và giảm thiểu tầng ứng dụng khi kết hợp WAF.
- Có **DDoS cost protection**: hoàn tiền phí scaling phát sinh do tấn công DDoS trên tài nguyên được bảo vệ.
- Truy cập **Shield Response Team (SRT)** 24/7 (yêu cầu Business hoặc Enterprise Support, đề đã có). Phí WAF cho tài nguyên được Shield Advanced bảo vệ đã gồm trong gói.

### Vì sao các phương án khác sai
- **A:** Shield Standard miễn phí, chống tấn công L3/L4 phổ biến, nhưng **không có** SRT hay cost protection.
- **B:** GuardDuty là dịch vụ **phát hiện mối đe doạ** từ log, không giảm thiểu DDoS; chặn IP bằng security group không chống nổi botnet hàng nghìn IP.
- **D:** Network Firewall bảo vệ ở mức VPC, sau CloudFront/ALB; không chống DDoS quy mô lớn ở edge, không có cost protection hay SRT.

> Exam tip: "DDoS cost protection" hoặc "DDoS Response Team" → Shield Advanced. Chống SQLi/XSS/bot/rate limit tầng 7 → AWS WAF. Hai dịch vụ thường đi cùng nhau.`,
  services: ['AWS Shield Advanced', 'AWS WAF', 'Amazon CloudFront', 'Amazon Route 53'],
},
{
  id: 'sap-029', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company is building a new microservice on Amazon ECS with AWS Fargate that connects to an Amazon RDS for PostgreSQL database. Company policy requires that the database master credentials never be stored in code, container images or environment files, that they be rotated automatically at least every 30 days, and that the rotation not require custom code maintained by the team. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    `Enable RDS integration with AWS Secrets Manager so that RDS manages the master user password in Secrets Manager with automatic rotation, and reference the secret in the ECS task definition so that it is injected at container start.`,
    `Store the password as a SecureString parameter in Systems Manager Parameter Store and enable the parameter's built-in automatic rotation policy every 30 days.`,
    `Encrypt the password with a customer managed KMS key, store the ciphertext in an environment file in S3, and enable automatic key rotation on the KMS key every 30 days.`,
    `Store the password in AWS Secrets Manager and write a scheduled Lambda function that generates a new password, updates the database and updates the secret every 30 days.`,
  ],
  answer: 0,
  explain: `**Từ khoá:** "never stored in code/images/env files", "rotated automatically", "no custom code", "LEAST overhead" → **Secrets Manager với RDS managed master user password**.

### Vì sao A đúng
- Khi bật quản lý master password bằng Secrets Manager, **RDS tự tạo secret và tự rotate** (mặc định 7 ngày, chỉnh được), không cần viết hay duy trì rotation Lambda.
- ECS task definition tham chiếu ARN secret trong phần {{secrets}}; Fargate lấy giá trị lúc khởi động container qua task execution role. Mật khẩu không nằm trong image hay file cấu hình. Lưu ý: giá trị chỉ được nạp lúc container khởi động, nên sau rotation cần khởi động lại task hoặc để ứng dụng đọc secret động khi kết nối lỗi.

### Vì sao các phương án khác sai
- **B:** Parameter Store **không có cơ chế rotation tự động** cho SecureString; phải tự viết.
- **C:** **KMS key rotation chỉ đổi key material** dùng để mã hoá, hoàn toàn **không đổi mật khẩu database**. Thêm nữa vẫn lưu trong file môi trường.
- **D:** đáp ứng về bảo mật nhưng phải tự viết và bảo trì Lambda (vi phạm "no custom code"); lại bỏ qua tính năng rotation có sẵn.

> Exam tip: "rotate database credentials automatically" → Secrets Manager (không phải Parameter Store). Đừng nhầm "KMS key rotation" với "secret rotation".`,
  services: ['AWS Secrets Manager', 'Amazon RDS', 'Amazon ECS', 'AWS Fargate'],
},
{
  id: 'sap-030', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company encrypts sensitive application data client-side with the AWS Encryption SDK using AWS KMS before storing it in DynamoDB global tables that replicate between us-east-1 and eu-west-1. If us-east-1 becomes unavailable, the application in eu-west-1 must be able to decrypt all data without making any calls to us-east-1. The security team requires that keys remain within AWS KMS. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    `Use the same single-Region KMS key ARN from us-east-1 in both Regions, because KMS keys are global resources.`,
    `Create two single-Region KMS keys with imported key material, import identical key material into both, and decrypt in eu-west-1 with the local key.`,
    `Create an AWS CloudHSM cluster in each Region, synchronize the keys between clusters, and use a custom key store in each Region.`,
    `Create a KMS multi-Region primary key in us-east-1 and a replica key in eu-west-1, encrypt with the key in the local Region, and decrypt with the related multi-Region key in whichever Region is available.`,
  ],
  answer: 3,
  explain: `**Từ khoá:** "decrypt in eu-west-1 without any calls to us-east-1", "keys remain within KMS", "LEAST overhead", dữ liệu replicate đa Region → **KMS multi-Region keys**.

### Vì sao D đúng
- Multi-Region key là tập key ở nhiều Region có **cùng key ID và cùng key material**. Ciphertext tạo bằng key ở us-east-1 có thể được giải mã bằng replica ở eu-west-1 ngay tại chỗ.
- KMS tự đồng bộ key material và thuộc tính rotation giữa primary và replica. Mỗi key vẫn có key policy riêng, có thể promote replica thành primary.
- Phù hợp đúng với dữ liệu mã hoá phía client được replicate cross-Region (global tables, S3 CRR).

### Vì sao các phương án khác sai
- **A:** KMS key **là tài nguyên Regional**. Dùng key us-east-1 nghĩa là gọi API sang us-east-1; Region đó sập thì không giải mã được.
- **B:** hai key single-Region khác nhau, dù import cùng key material, **không giải mã được ciphertext của nhau** (ciphertext gắn với key cụ thể). Quản lý key material thủ công cũng tốn công.
- **C:** CloudHSM + custom key store tăng nhiều chi phí và việc vận hành cluster; đồng bộ key giữa cluster không phải tính năng đơn giản và không cần thiết.

> Exam tip: "encrypt in one Region, decrypt in another without cross-Region call" → KMS multi-Region keys. Với SSE-KMS trên S3 CRR, cũng có thể dùng key riêng ở đích (S3 tự re-encrypt), nhưng mã hoá phía client thì cần MRK.`,
  services: ['AWS KMS', 'Amazon DynamoDB', 'AWS Encryption SDK'],
  refs: [{ type: 'doc', title: 'Multi-Region keys in AWS KMS', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/multi-region-keys-overview.html' }],
},
{
  id: 'sap-031', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company is building a data lake on Amazon S3 that will hold billions of small objects written by many producers. Security requirements state that all data at rest must be encrypted with a customer managed key whose usage is auditable in AWS CloudTrail, and that any request to the bucket over unencrypted HTTP must be rejected. The finance team is concerned about the cost of KMS requests generated by the high object count. Which combination of steps meets these requirements MOST cost-effectively? (Choose two.)`,
  options: [
    `Add a bucket policy statement that denies all S3 actions when the condition aws:SecureTransport is false.`,
    `Configure default bucket encryption with SSE-S3, because SSE-S3 uses keys that the company manages in AWS KMS.`,
    `Require clients to use SSE-C and provide their own encryption key with every PUT and GET request.`,
    `Configure default bucket encryption with SSE-KMS using the customer managed key and enable S3 Bucket Keys.`,
    `Enable S3 Object Lock in compliance mode so that objects are encrypted in transit and at rest.`,
  ],
  answer: [0, 3],
  multi: true,
  explain: `**Từ khoá:** "customer managed key, auditable in CloudTrail", "reject unencrypted HTTP", "billions of objects", "cost of KMS requests" → **SSE-KMS + S3 Bucket Keys** và **deny aws:SecureTransport = false**.

### Vì sao A và D đúng
- **A:** {{aws:SecureTransport}} là false khi request đi qua HTTP thường; statement Deny trong bucket policy buộc mọi client dùng TLS. Đây là cách chuẩn để bắt buộc mã hoá khi truyền.
- **D:** SSE-KMS với customer managed key cho phép kiểm soát key policy và mọi lần dùng key được ghi CloudTrail. **S3 Bucket Keys** tạo một data key cấp bucket tồn tại ngắn hạn, giảm số request tới KMS (AWS nêu mức giảm tới 99%), nên giảm mạnh chi phí với số object lớn.

### Vì sao các phương án khác sai
- **B:** SSE-S3 dùng key **do S3 quản lý**, không phải customer managed key trong KMS; không có audit trail theo từng key như yêu cầu.
- **C:** SSE-C bắt client tự quản lý và gửi key trong mọi request; S3 không lưu key, nhiều producer phải chia sẻ key = rủi ro và overhead lớn; không có audit KMS.
- **E:** Object Lock là cơ chế **WORM** (chống xoá/ghi đè), không liên quan đến mã hoá.

> Exam tip: từ 5/1/2023, S3 tự mã hoá mọi object mới bằng SSE-S3, nên câu hỏi về "customer managed key / audit key usage" luôn hướng tới SSE-KMS. Số object lớn + SSE-KMS → bật Bucket Keys.`,
  services: ['Amazon S3', 'AWS KMS', 'AWS CloudTrail'],
},
{
  id: 'sap-032', exam: 'sap-c02', domain: 'sap-d2',
  q: `A genomics research company runs batch analysis jobs on a cluster of 200 Linux EC2 instances. Each job reads a 50 TB input data set that is stored durably in Amazon S3, needs a shared POSIX file system with sub-millisecond latency and hundreds of GB/s of aggregate throughput, and writes results that must be persisted back to S3. The file system is needed only for the duration of each job run (a few days). Which solution meets these requirements MOST cost-effectively?`,
  options: [
    `Create an Amazon EFS file system with Elastic throughput mode, copy the input data from S3 with AWS DataSync, and mount it on all instances.`,
    `Create an Amazon FSx for Lustre scratch file system linked to the S3 bucket through a data repository association, run the jobs, export the results to S3, and delete the file system after the run.`,
    `Attach a single io2 Block Express EBS volume with Multi-Attach enabled to all 200 instances.`,
    `Create an Amazon FSx for Windows File Server file system and mount it on the Linux instances using SMB.`,
  ],
  answer: 1,
  explain: `**Từ khoá:** "HPC/genomics", "shared POSIX", "sub-millisecond", "hundreds of GB/s", "data in S3", "only for duration of the job", "MOST cost-effective" → **FSx for Lustre (scratch) liên kết S3**.

### Vì sao B đúng
- Lustre là file system song song cho HPC: throughput tổng tới hàng trăm GB/s, độ trễ dưới mili giây, POSIX.
- **Data repository association** liên kết với S3: file hiển thị ngay và được lazy-load từ S3 khi đọc; kết quả export ngược về S3.
- **Scratch** file system rẻ hơn persistent, không replicate dữ liệu, phù hợp xử lý ngắn hạn khi dữ liệu gốc đã bền vững trong S3. Xoá sau khi chạy để không tốn chi phí.

### Vì sao các phương án khác sai
- **A:** EFS là NFS đa AZ, tiện cho workload chung nhưng throughput và độ trễ không đạt mức HPC song song; phải copy 50 TB và trả phí lưu trữ EFS cao hơn.
- **C:** EBS Multi-Attach chỉ gắn tối đa **16** instance Nitro **trong cùng AZ**, và cần file system nhận biết cluster; không phải shared file system cho 200 node.
- **D:** FSx for Windows dùng SMB cho workload Windows, không phải lựa chọn cho HPC Linux cần POSIX hiệu năng cao.

> Exam tip: "HPC", "ML training", "parallel", "S3 integration" → FSx for Lustre. "Short-term processing" → scratch; "long-term, cần HA" → persistent.`,
  services: ['Amazon FSx for Lustre', 'Amazon S3', 'Amazon EC2'],
},
{
  id: 'sap-033', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company runs a payment API on AWS Lambda behind Amazon API Gateway. Previous releases caused errors that affected all customers at once. The company wants new versions to receive 10% of traffic for 10 minutes before all traffic shifts, and wants deployments to roll back automatically if a CloudWatch alarm on the function's error rate goes into ALARM state, with no manual steps. Which solution meets these requirements?`,
  options: [
    `Publish each release to the $LATEST version and enable CloudFormation stack rollback triggers that monitor the error alarm for 10 minutes.`,
    `Create an API Gateway canary release on the stage with 10% of traffic and have an engineer promote or delete the canary after reviewing the dashboards.`,
    `Use Lambda versions and an alias, and deploy with AWS CodeDeploy (for example through AWS SAM) using the Canary10Percent10Minutes deployment preference with the CloudWatch error alarm configured for automatic rollback.`,
    `Deploy a second Lambda function for each release and use Route 53 weighted records to send 10% of requests to the new function's API endpoint.`,
  ],
  answer: 2,
  explain: `**Từ khoá:** "10% for 10 minutes then all", "automatic rollback on CloudWatch alarm", "no manual steps", Lambda → **CodeDeploy canary trên Lambda alias**.

### Vì sao C đúng
- CodeDeploy dịch chuyển traffic giữa hai **version** của Lambda bằng **weighted alias**. Cấu hình có sẵn {{LambdaCanary10Percent10Minutes}} (SAM viết là Canary10Percent10Minutes) đúng như yêu cầu.
- Gắn CloudWatch alarm vào deployment group: alarm chuyển ALARM trong lúc deploy thì CodeDeploy **tự rollback** alias về version cũ. Có thể thêm pre/post traffic hook để chạy test.

### Vì sao các phương án khác sai
- **A:** $LATEST không có chia traffic; rollback trigger của CloudFormation chỉ rollback cấu hình stack, không thực hiện canary 10% và không chuyển traffic dần.
- **B:** API Gateway canary chia traffic được, nhưng việc promote/rollback ở đây **thủ công**, vi phạm "no manual steps".
- **D:** Route 53 weighted dựa vào DNS, bị cache ở client nên tỉ lệ không chính xác và rollback chậm; quản lý hai function riêng cũng không tự rollback theo alarm.

> Exam tip: Lambda + canary/linear + auto rollback → CodeDeploy với alias (thường qua SAM {{DeploymentPreference}}). ECS blue/green cũng dùng CodeDeploy (hoặc tính năng blue/green có sẵn của ECS).`,
  services: ['AWS Lambda', 'AWS CodeDeploy', 'AWS SAM', 'Amazon CloudWatch'],
},
{
  id: 'sap-034', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company runs 3,000 EC2 instances (Amazon Linux and Windows Server) across 25 accounts in AWS Organizations and four Regions. A new compliance standard requires that critical and security OS patches be installed within 7 days of release, that patching happen only in approved maintenance windows, and that the compliance team get a single report of patch compliance across all accounts. All instances already have the SSM Agent and an instance profile with the required Systems Manager permissions. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    `Use Systems Manager Quick Setup to create a patch policy for the organization that defines patch baselines with a 7-day auto-approval delay for critical and security patches, schedules scanning and installation during the maintenance windows, and reports compliance centrally.`,
    `Enable Amazon Inspector across the organization to scan the instances for missing patches and send findings to Security Hub for the compliance team.`,
    `Create a monthly golden AMI with EC2 Image Builder and require each account team to replace its instances manually with the new AMI.`,
    `Write a cron job on every instance that runs yum update or Windows Update weekly and sends the output to a central S3 bucket for review.`,
  ],
  answer: 0,
  explain: `**Từ khoá:** "3,000 instances, 25 accounts, 4 Regions", "within 7 days", "maintenance windows", "single compliance report", SSM Agent đã có → **Systems Manager Patch Manager với patch policy qua Quick Setup**.

### Vì sao A đúng
- **Patch baseline** quy định patch nào được duyệt; auto-approval sau N ngày theo classification/severity đáp ứng "trong 7 ngày".
- **Patch policy** (Quick Setup) triển khai cấu hình patching cho **cả organization và nhiều Region** từ một chỗ, đặt lịch scan và install trong khung giờ được phép.
- Kết quả patch compliance được tổng hợp; có thể xem tập trung hoặc gom qua Resource Data Sync / Security Hub.

### Vì sao các phương án khác sai
- **B:** Inspector **phát hiện** lỗ hổng/thiếu patch nhưng **không cài patch**, không có maintenance window.
- **C:** golden AMI là thực hành tốt cho immutable infrastructure, nhưng thay thủ công 3.000 instance mỗi tháng không đảm bảo 7 ngày và tốn công lớn.
- **D:** cron trên từng máy không kiểm soát được khung giờ tập trung, không có baseline duyệt patch, báo cáo là log thô; overhead và rủi ro cao.

> Exam tip: "patch compliance at scale" → Systems Manager Patch Manager (patch baseline + maintenance window/patch policy). "Find vulnerabilities" → Inspector. Hai dịch vụ bổ trợ chứ không thay thế nhau.`,
  services: ['AWS Systems Manager', 'Patch Manager', 'AWS Organizations'],
},
{
  id: 'sap-035', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company's data processing application runs on EC2 instances in private subnets across three Availability Zones in one VPC. The instances download and upload about 400 TB per month to Amazon S3 and make billions of requests per month to Amazon DynamoDB in the same Region. All traffic currently flows through NAT gateways, and NAT gateway data processing charges are the largest line item on the bill. The traffic must not traverse the internet. Which combination of steps will reduce cost the MOST? (Choose two.)`,
  options: [
    `Replace the three NAT gateways with a single NAT gateway in one Availability Zone.`,
    `Create a gateway VPC endpoint for Amazon S3 and add it to the route tables of the private subnets.`,
    `Create a gateway VPC endpoint for Amazon DynamoDB and add it to the route tables of the private subnets.`,
    `Create interface VPC endpoints for Amazon S3 and Amazon DynamoDB in each Availability Zone.`,
    `Replace the NAT gateways with NAT instances on Graviton-based EC2 instances to avoid data processing charges.`,
  ],
  answer: [1, 2],
  multi: true,
  explain: `**Từ khoá:** "S3 and DynamoDB in same Region", "NAT gateway data processing is largest cost", "must not traverse internet", "reduce cost the MOST" → **gateway endpoints cho S3 và DynamoDB**.

### Vì sao B và C đúng
- Gateway VPC endpoint cho S3 và DynamoDB **không tính phí** theo giờ hay theo GB. Chỉ cần thêm route (prefix list của dịch vụ) vào route table của private subnet.
- Traffic tới S3/DynamoDB rời khỏi đường NAT, nên phí NAT data processing (tính theo mỗi GB) cho 400 TB và hàng tỷ request biến mất. Traffic đi trong mạng AWS, không ra internet.
- Có thể dùng endpoint policy để giới hạn bucket/table được truy cập.

### Vì sao các phương án khác sai
- **A:** giảm phí giờ của NAT nhưng **phí data processing vẫn nguyên**, lại thêm phí data transfer cross-AZ và tạo single point of failure.
- **D:** interface endpoint hoạt động nhưng **tính phí** theo giờ mỗi AZ và theo GB; với cùng VPC, gateway endpoint rẻ hơn hẳn (interface endpoint cho S3 chỉ cần khi truy cập từ on-prem hoặc VPC khác).
- **E:** NAT instance tránh phí NAT gateway nhưng phải tự vận hành HA, patch, giới hạn băng thông; traffic vẫn đi tới endpoint công khai. Chi phí vận hành cao và kém hơn gateway endpoint miễn phí.

> Exam tip: "reduce NAT gateway cost" + S3/DynamoDB → gateway endpoint. Chỉ S3 và DynamoDB có gateway endpoint; mọi dịch vụ khác là interface endpoint.`,
  services: ['Amazon VPC', 'VPC endpoints', 'Amazon S3', 'Amazon DynamoDB', 'NAT gateway'],
},
{
  id: 'sap-036', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company stores application logs in Amazon S3. Logs are queried frequently during the first 30 days, accessed a few times a month until they are 1 year old, and then must be retained for 7 years for compliance. Retrieval of logs older than 1 year is very rare, and auditors accept a retrieval time of up to 48 hours. The access pattern is well known and does not change. Which storage strategy is the MOST cost-effective?`,
  options: [
    `Store logs in S3 One Zone-IA from day 1 and transition them to S3 Glacier Flexible Retrieval after 1 year, expiring them after 7 years.`,
    `Store logs in S3 Intelligent-Tiering with the Archive Access and Deep Archive Access tiers activated, and expire them after 7 years.`,
    `Store logs in S3 Standard, transition them to S3 Glacier Instant Retrieval after 30 days and keep them there until they expire after 7 years.`,
    `Store logs in S3 Standard, use a lifecycle rule to transition them to S3 Standard-IA after 30 days and to S3 Glacier Deep Archive after 365 days, and expire them after 7 years.`,
  ],
  answer: 3,
  explain: `**Từ khoá:** "frequent 30 days", "few times a month until 1 year", "retain 7 years", "retrieval up to 48 hours", "access pattern well known" → **lifecycle: Standard → Standard-IA → Glacier Deep Archive → expire**.

### Vì sao D đúng
- 30 ngày đầu truy cập nhiều → S3 Standard (không có phí retrieval).
- 30 ngày–1 năm truy cập vài lần/tháng → Standard-IA: lưu trữ rẻ hơn, có phí retrieval nhỏ; lifecycle sang Standard-IA yêu cầu object đã ít nhất 30 ngày tuổi, khớp.
- Sau 1 năm → **Glacier Deep Archive**: lớp rẻ nhất; standard retrieval trong vòng 12 giờ, bulk trong vòng 48 giờ, đáp ứng yêu cầu kiểm toán.

### Vì sao các phương án khác sai
- **A:** One Zone-IA chỉ lưu ở **một AZ**, không phù hợp dữ liệu tuân thủ; tuần đầu truy cập nhiều sẽ tốn phí retrieval; Glacier Flexible Retrieval đắt hơn Deep Archive trong khi 48 giờ là chấp nhận được.
- **B:** Intelligent-Tiering hợp với access pattern **không biết trước**; ở đây pattern đã rõ, nên lifecycle rẻ hơn (Intelligent-Tiering tính phí monitoring theo từng object).
- **C:** Glacier Instant Retrieval rẻ hơn Standard-IA khi truy cập khoảng mỗi quý một lần, nhưng **đắt hơn Deep Archive nhiều** cho 6 năm lưu trữ gần như không đọc.

> Exam tip: pattern biết trước → lifecycle rule; pattern không biết → Intelligent-Tiering. "Retrieval within 12/48 hours" + rẻ nhất → Glacier Deep Archive. Nhớ thời gian lưu tối thiểu: IA 30 ngày, Glacier Flexible 90, Deep Archive 180.`,
  services: ['Amazon S3', 'S3 Lifecycle', 'S3 Glacier Deep Archive'],
},
{
  id: 'sap-037', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company runs a nightly batch rendering workload that processes thousands of independent frames. Each frame takes 3 to 10 minutes on a compute-optimized instance, and the job must finish within 8 hours. The company wants to reduce compute costs by at least 60% compared with On-Demand while keeping interruptions from causing the job to miss its deadline. Which combination of steps should a solutions architect recommend? (Choose two.)`,
  options: [
    `Use an EC2 Auto Scaling group with a mixed instances policy that includes many compatible instance types across multiple Availability Zones, uses Spot Instances, and uses the price-capacity-optimized allocation strategy.`,
    `Request a single Spot instance type in one Availability Zone with the lowest-price allocation strategy to get the cheapest price.`,
    `Purchase Spot blocks with a defined duration of 6 hours so that the instances are not interrupted during the job.`,
    `Run the workload on Dedicated Hosts purchased with a 1-year reservation to guarantee capacity.`,
    `Make each frame an idempotent unit of work pulled from an SQS queue, and handle the Spot two-minute interruption notice (through EventBridge or instance metadata) so that unfinished frames return to the queue.`,
  ],
  answer: [0, 4],
  multi: true,
  explain: `**Từ khoá:** "independent frames", "reduce cost ≥ 60%", "interruptions must not cause deadline miss" → **Spot đa dạng hoá + price-capacity-optimized** và **thiết kế chịu ngắt quãng**.

### Vì sao A và E đúng
- **A:** Spot thường rẻ hơn On-Demand tới 90%. Đa dạng **nhiều instance type và nhiều AZ** làm tăng số Spot pool khả dụng; **price-capacity-optimized** (chiến lược AWS khuyến nghị) chọn pool có nhiều capacity nhất với giá thấp, giảm xác suất bị thu hồi.
- **E:** frame độc lập, ngắn (3–10 phút) → đưa vào SQS, worker lấy từng frame. Spot báo trước **2 phút** qua EventBridge và instance metadata; worker dừng nhận việc, frame chưa xong hết visibility timeout và quay lại queue. Bị ngắt chỉ mất vài phút công, không ảnh hưởng deadline 8 giờ.

### Vì sao các phương án khác sai
- **B:** một instance type trong một AZ với lowest-price = ít pool nhất, **dễ bị ngắt hàng loạt** và có thể không lấy được capacity.
- **C:** Spot blocks (defined duration) **đã ngừng cung cấp**, không còn mua được.
- **D:** Dedicated Hosts đắt hơn, dùng cho yêu cầu license/tuân thủ, không giảm 60% chi phí.

> Exam tip: Spot đúng cách = nhiều instance type + nhiều AZ + price-capacity-optimized + workload chịu lỗi (checkpoint, queue). Thấy "Spot blocks" trong đáp án → loại.`,
  services: ['Amazon EC2 Spot Instances', 'Amazon EC2 Auto Scaling', 'Amazon SQS', 'Amazon EventBridge'],
},
{
  id: 'sap-038', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company is launching a new serverless API built with AWS Lambda that queries an Amazon Aurora PostgreSQL database. During load testing, sudden bursts scale Lambda to 2,000 concurrent executions, each opening its own database connection, which exhausts the database connections and causes errors and high CPU on the writer instance. The company wants to fix this without changing the database engine, with minimal code changes and minimal operational overhead. Which solution meets these requirements?`,
  options: [
    `Increase the max_connections parameter and scale the Aurora writer to the largest available instance class.`,
    `Create an Amazon RDS Proxy for the Aurora cluster, have the Lambda functions connect to the proxy endpoint, and store the database credentials in AWS Secrets Manager (or use IAM authentication) for the proxy.`,
    `Put an Amazon ElastiCache cluster in front of Aurora and cache all query results for 60 seconds.`,
    `Set the Lambda function's provisioned concurrency to 2,000 so that each execution environment reuses its database connection.`,
  ],
  answer: 1,
  explain: `**Từ khoá:** "Lambda burst 2,000 concurrent", "each opens its own connection", "connections exhausted", "minimal code changes and overhead" → **Amazon RDS Proxy**.

### Vì sao B đúng
- RDS Proxy giữ một **connection pool** tới Aurora và **multiplex** nhiều kết nối client lên ít kết nối database hơn, nên 2.000 Lambda không còn mở 2.000 connection thật.
- Code chỉ cần đổi endpoint sang proxy. Proxy lấy credentials từ Secrets Manager (hoặc hỗ trợ IAM authentication tới proxy), fully managed, đa AZ.
- Proxy còn giúp failover nhanh hơn vì giữ kết nối client trong lúc writer đổi.

### Vì sao các phương án khác sai
- **A:** tăng max_connections và instance class tốn tiền, và mỗi connection PostgreSQL vẫn tốn bộ nhớ/CPU; burst lớn hơn lại hỏng.
- **C:** cache giúp giảm truy vấn đọc lặp lại nhưng phải viết logic cache, không giải quyết số lượng connection (ghi và cache miss vẫn mở connection).
- **D:** provisioned concurrency giữ sẵn môi trường, mỗi môi trường vẫn giữ một connection; 2.000 môi trường = 2.000 connection, và còn tốn thêm chi phí.

> Exam tip: "Lambda + RDS/Aurora + too many connections" → RDS Proxy. Nếu đề cho phép đổi engine/serverless hoàn toàn, có thể gặp Aurora Data API hoặc DynamoDB.`,
  services: ['Amazon RDS Proxy', 'Amazon Aurora', 'AWS Lambda', 'AWS Secrets Manager'],
},
{
  id: 'sap-039', exam: 'sap-c02', domain: 'sap-d2',
  q: `A travel company is building a booking workflow that reserves a flight, a hotel and a rental car through three separate microservices. If any step fails, the previously completed reservations must be cancelled (compensated). Some bookings require a manual approval by an agent that can take up to 3 days. The company needs a visual audit trail of each booking execution and wants to minimize custom orchestration code. Which solution meets these requirements?`,
  options: [
    `Use an AWS Step Functions Express workflow that calls the three services, with Catch blocks that run compensating steps.`,
    `Chain the services with Amazon SQS queues and store the saga state in a DynamoDB table, with custom code in each service that sends compensation messages when a failure is detected.`,
    `Use an AWS Step Functions Standard workflow that calls each service as a task with Retry and Catch blocks that invoke compensating tasks, and use a task token (.waitForTaskToken) for the manual approval step.`,
    `Publish a booking event to an Amazon SNS topic that all three services subscribe to, and have each service publish a failure event that the other services listen to.`,
  ],
  answer: 2,
  explain: `**Từ khoá:** "compensate on failure" (saga), "manual approval up to 3 days", "visual audit trail", "minimize custom orchestration code" → **Step Functions Standard workflow** + Catch + **task token**.

### Vì sao C đúng
- Standard workflow chạy tới **1 năm**, exactly-once, lưu lịch sử thực thi chi tiết có thể xem trực quan trên console (audit trail).
- Saga pattern: mỗi bước có **Retry** cho lỗi tạm thời và **Catch** chuyển sang các bước huỷ (cancel hotel, cancel flight…).
- Bước chờ duyệt dùng **.waitForTaskToken**: workflow tạm dừng cho tới khi hệ thống của agent gọi {{SendTaskSuccess}} / {{SendTaskFailure}} với token, có thể chờ nhiều ngày mà không tốn compute.

### Vì sao các phương án khác sai
- **A:** Express workflow giới hạn **5 phút**, không chờ được 3 ngày; lịch sử thực thi phải bật CloudWatch Logs, không giữ trực quan như Standard.
- **B:** tự xây orchestration (saga state, timeout, compensation) bằng SQS + DynamoDB: đúng là thứ "custom orchestration code" đề muốn tránh.
- **D:** choreography qua SNS khó theo dõi tổng thể, không có audit trail của một booking, không có chỗ tự nhiên cho bước chờ duyệt 3 ngày.

> Exam tip: "long-running, human approval, audit" → Step Functions Standard. "High-volume, short (< 5 phút), event processing" → Express. Task token là mẫu chuẩn cho callback/human approval.`,
  services: ['AWS Step Functions'],
},
{
  id: 'sap-040', exam: 'sap-c02', domain: 'sap-d2',
  q: `A gaming company runs multiplayer game servers that use a custom UDP protocol on EC2 instances behind Network Load Balancers in us-east-1, eu-west-1 and ap-southeast-1. Players worldwide need the lowest possible latency and jitter. Some corporate customers must allowlist a small, fixed set of IP addresses in their firewalls. If a Region becomes unhealthy, players must be redirected to another Region within seconds, without waiting for DNS caches to expire. Which solution meets these requirements?`,
  options: [
    `Create an AWS Global Accelerator standard accelerator with a UDP listener and an endpoint group for each Region containing the NLB, and give customers the accelerator's two static anycast IP addresses.`,
    `Create an Amazon CloudFront distribution with the three NLBs as origins in an origin group with failover, and give customers the CloudFront IP ranges.`,
    `Use Amazon Route 53 latency-based routing with health checks across the three NLBs and give customers the Elastic IP addresses of all NLBs.`,
    `Assign Elastic IP addresses to the NLBs and use Route 53 geolocation routing so that players connect to the nearest Region.`,
  ],
  answer: 0,
  explain: `**Từ khoá:** "UDP", "lowest latency and jitter worldwide", "small fixed set of IPs to allowlist", "fail over within seconds without DNS caching" → **AWS Global Accelerator**.

### Vì sao A đúng
- Global Accelerator cấp **2 IP anycast tĩnh** (hoặc dùng IP của bạn - BYOIP) quảng bá từ các edge location. Traffic vào mạng AWS ở edge gần người chơi nhất rồi đi trên backbone AWS → giảm latency và jitter.
- Hỗ trợ **TCP và UDP**, endpoint là NLB/ALB/EC2/Elastic IP.
- Health check liên tục; endpoint group không healthy thì traffic chuyển sang Region khác **trong vài giây**, không phụ thuộc DNS TTL vì IP không đổi.

### Vì sao các phương án khác sai
- **B:** CloudFront phục vụ HTTP/HTTPS (và WebSocket), **không** proxy giao thức UDP tuỳ ý; dải IP CloudFront rất lớn và thay đổi, không phải "small fixed set".
- **C:** latency routing dựa trên DNS: failover phụ thuộc TTL và cache của resolver/client; khách phải allowlist nhiều IP; traffic đi qua internet công cộng.
- **D:** geolocation không phản ánh độ trễ thực, cũng là DNS nên không failover trong vài giây.

> Exam tip: "static IP", "UDP/TCP non-HTTP", "fast regional failover", "gaming/VoIP" → Global Accelerator. "Caching HTTP content at edge" → CloudFront.`,
  services: ['AWS Global Accelerator', 'Network Load Balancer'],
},
);
