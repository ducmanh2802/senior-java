/* AWS SAP-C02 practice questions, part 3: sap-077..sap-126 (all 4 domains: d1 13, d2 15, d3 12, d4 10), topics thin in parts 1–2.
 * Schema: docs/AWS-TRACK.md. Check: node scripts/check-aws.js */
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'sap-077',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A company has 150 accounts in AWS Organizations. A security review found that several application teams have written S3 bucket policies and KMS key policies that grant access to principals in external AWS accounts. The security team must ensure that, across all member accounts, S3 buckets and KMS keys can be accessed only by principals that belong to the organization or by AWS services acting on the company's behalf. The control must apply even if a team later writes an overly permissive resource policy. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Attach a service control policy (SCP) to the root that denies s3:* and kms:* when aws:PrincipalOrgID does not equal the organization ID.",
    "Attach a resource control policy (RCP) to the root that denies s3:* and kms:* when aws:PrincipalOrgID does not equal the organization ID and aws:PrincipalIsAWSService is false.",
    "Deploy an AWS Config conformance pack with a custom rule that detects external principals in bucket and key policies, and remediate findings with an AWS Systems Manager Automation runbook.",
    "Enable IAM Access Analyzer external access analyzers in every account and send findings to AWS Security Hub for manual review by the security team."
  ],
  answer: 1,
  explain: `**Từ khoá:** "only principals that belong to the organization", "even if a team later writes an overly permissive resource policy", "LEAST operational overhead".

**Vì sao B đúng:** **Resource control policy (RCP)** là loại policy của Organizations đặt "trần quyền" lên **resource** trong các member account (S3, KMS, STS, SQS, Secrets Manager…). Khác SCP, RCP được đánh giá cho **mọi principal gọi vào resource**, kể cả principal ở account ngoài org. Một RCP deny khi {{aws:PrincipalOrgID}} khác org ID, kèm ngoại lệ {{aws:PrincipalIsAWSService}} cho service principal (CloudTrail ghi log vào bucket…), tạo ra "data perimeter" mà bucket policy hay key policy viết sai cũng không vượt qua được.

**Vì sao các phương án khác sai:**
- **A**: SCP chỉ giới hạn principal **thuộc** org (IAM user/role trong member account). Principal từ account bên ngoài không bị SCP của bạn chi phối, nên bucket policy cho phép account lạ vẫn có hiệu lực.
- **C**: Config + remediation là kiểm soát **phát hiện rồi sửa**, có khoảng hở thời gian và phải viết rule, runbook, nên overhead cao hơn và không "preventive".
- **D**: Access Analyzer chỉ báo cáo, xem xét thủ công không phải là guardrail.

> Exam tip: "principal **của bạn** được làm gì" → SCP; "**resource** của bạn cho ai truy cập" (data perimeter, chặn external access) → RCP. Management account không bị SCP/RCP áp dụng.`,
  services: ['AWS Organizations', 'Resource control policies', 'Amazon S3', 'AWS KMS'],
  refs: [{ type: 'doc', title: 'Resource control policies (RCPs)', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_rcps.html' }]
},
{
  id: 'sap-078',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A healthcare company has 70 accounts in AWS Organizations and uses several AWS AI services, such as Amazon Transcribe, Amazon Comprehend, and Amazon Rekognition. The company's legal team requires that no content processed by any AI service in any current or future account be stored or used by AWS to develop or improve AWS services. Individual account administrators must not be able to override this setting. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Open an AWS Support case from each account to request an opt-out, and add the step to the account vending runbook for new accounts.",
    "Attach an SCP that denies all API actions for AI services unless the request includes a data-retention opt-out header.",
    "Use AWS Config to detect accounts that have not opted out, and run an AWS Lambda function that calls each AI service API to disable data retention.",
    "Create an AI services opt-out policy in AWS Organizations that opts out of all AI services, and attach it to the organization root with the child control operators that prevent child policies from changing the setting."
  ],
  answer: 3,
  explain: `**Từ khoá:** "any AI service", "current or future account", "administrators must not be able to override", "LEAST operational overhead".

**Vì sao D đúng:** Organizations có loại **management policy** tên **AI services opt-out policy**. Policy gắn ở **root** được kế thừa xuống mọi OU và account, kể cả account tạo sau này. Dùng giá trị {{default}} với {{optOut}} để opt-out cho mọi AI service, và dùng **child control operators** ({{@@operators_allowed_for_child_policies}} đặt là {{@@none}}) để policy ở cấp dưới không thể đổi lại. Không phải làm gì thêm cho account mới.

**Vì sao các phương án khác sai:**
- **A**: mở Support case từng account là cách cũ, thủ công, dễ sót account mới, overhead cao nhất.
- **B**: không có "data-retention opt-out header" trong API; SCP không điều khiển việc AWS lưu nội dung, nó chỉ cho phép hay chặn API call. Chặn API thì ứng dụng hỏng.
- **C**: không có API nào trên từng AI service để tắt việc lưu dữ liệu; dựng Config + Lambda là overhead lớn và vẫn là phát hiện sau.

> Exam tip: Organizations có 2 nhóm policy: **authorization** (SCP, RCP) và **management** (tag, backup, AI services opt-out, chatbot, declarative…). Câu nào nói "opt out AI data usage cho cả org" thì đáp án là AI services opt-out policy ở root.`,
  services: ['AWS Organizations', 'AI services opt-out policies'],
  refs: [{ type: 'doc', title: 'AI services opt-out policies', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_ai-opt-out.html' }]
},
{
  id: 'sap-079',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A company has 90 accounts in AWS Organizations. The security team wants to centrally enforce AWS WAF web ACLs on every internet-facing Application Load Balancer and Amazon CloudFront distribution, and to audit security groups for overly permissive rules, across all existing and new accounts. The security team works from a dedicated Security account and must not use the management account for daily operations. Which steps are required to set up this solution? (Choose three.)`,
  options: [
    "Ensure that AWS Organizations has all features enabled.",
    "Create an IAM user with AdministratorAccess in every member account for the security team.",
    "From the management account, designate the Security account as the AWS Firewall Manager administrator account.",
    "Enable Amazon GuardDuty Runtime Monitoring in all accounts so that Firewall Manager can discover resources.",
    "Enable AWS Config recording in every member account and Region where Firewall Manager policies will apply.",
    "Create one AWS WAF web ACL in the Security account and share it with all accounts by using AWS RAM."
  ],
  answer: [0, 2, 4],
  multi: true,
  explain: `**Từ khoá:** "centrally enforce WAF web ACLs", "audit security groups", "existing and new accounts", "dedicated Security account".

**Vì sao A, C, E đúng:** đây chính là 3 **prerequisite** của **AWS Firewall Manager**:
- **A**: Firewall Manager dựa trên Organizations và yêu cầu org bật **all features** (không chỉ consolidated billing).
- **C**: từ management account, chỉ định một account làm **Firewall Manager administrator**; từ đó đội security tạo policy (WAF, Shield Advanced, security group, Network Firewall, DNS Firewall…) áp lên cả org hoặc theo OU/tag.
- **E**: Firewall Manager dùng **AWS Config** để phát hiện resource trong scope và theo dõi compliance, nên Config phải bật ở mọi account và Region liên quan.
Sau đó policy tự áp cho resource mới và account mới.

**Vì sao các phương án khác sai:**
- **B**: IAM user admin trong từng account đi ngược mô hình quản trị tập trung, tăng rủi ro, không cần thiết.
- **D**: GuardDuty là dịch vụ phát hiện mối đe doạ, không phải prerequisite của Firewall Manager.
- **F**: web ACL không chia sẻ qua RAM; Firewall Manager tự tạo web ACL do nó quản lý trong từng account.

> Exam tip: "enforce WAF/security group rules across all accounts, including new ones" → Firewall Manager. Nhớ bộ ba: Organizations all features + FMS admin account + AWS Config.`,
  services: ['AWS Firewall Manager', 'AWS WAF', 'AWS Config', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'AWS Firewall Manager prerequisites', url: 'https://docs.aws.amazon.com/waf/latest/developerguide/fms-prereq.html' }]
},
{
  id: 'sap-080',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A company uses IAM Identity Center with Okta as the external identity provider (SAML 2.0 and SCIM). There are 40 project teams that share the same 12 workload accounts. Each user has a "project" attribute in Okta. Today, the company maintains one permission set per project, and the number of permission sets keeps growing. Developers must be able to start, stop, and modify only the EC2 instances and RDS DB instances that are tagged with their own project value. New projects must not require new permission sets. Which solution meets these requirements?`,
  options: [
    "Enable attributes for access control in IAM Identity Center and map the Okta project attribute. Create one permission set whose policy allows the actions only when aws:ResourceTag/project equals aws:PrincipalTag/project.",
    "Create an IAM role per project in each account with a trust policy for the Identity Center SAML provider, and let Okta pick the role based on the project attribute.",
    "Create one permission set per project as today, but generate the permission sets automatically with AWS CloudFormation StackSets whenever a project is added in Okta.",
    "Create one permission set that grants PowerUserAccess, and use an SCP that denies actions on resources that do not have a project tag."
  ],
  answer: 0,
  explain: `**Từ khoá:** "same accounts shared by 40 teams", "project attribute in Okta", "only resources tagged with their own project", "new projects must not require new permission sets".

**Vì sao A đúng:** đây là **ABAC (attribute-based access control)** với IAM Identity Center. Bật **attributes for access control**, map thuộc tính {{project}} từ IdP (qua SAML assertion hoặc SCIM). Khi user đăng nhập, Identity Center truyền thuộc tính thành **session tag**. Một permission set duy nhất có condition {{"aws:ResourceTag/project": "\${aws:PrincipalTag/project}"}} cho phép thao tác chỉ khi tag của resource khớp tag của người dùng. Thêm dự án mới chỉ cần gán giá trị trong Okta và tag resource, không đổi policy.

**Vì sao các phương án khác sai:**
- **B**: role per project per account là RBAC, số role = 40 × 12 và vẫn tăng theo dự án; còn bỏ qua Identity Center.
- **C**: tự động hoá việc tạo permission set vẫn là mô hình RBAC, số permission set vẫn tăng tuyến tính, không đáp ứng yêu cầu.
- **D**: SCP chỉ kiểm tra "có tag", không so sánh tag với người dùng, nên dev dự án A vẫn sửa được máy của dự án B.

> Exam tip: "permission explosion", "scale without new policies", "tag matching user attribute" → ABAC: {{aws:PrincipalTag}} so với {{aws:ResourceTag}}. Nhớ chặn luôn việc tự đổi tag ({{ec2:CreateTags}} trên tag project) để không lách được.`,
  services: ['IAM Identity Center', 'IAM', 'Amazon EC2', 'Amazon RDS'],
  refs: [{ type: 'doc', title: 'Attribute-based access control in IAM Identity Center', url: 'https://docs.aws.amazon.com/singlesignon/latest/userguide/abac.html' }]
},
{
  id: 'sap-081',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A company routes all east-west traffic between 30 spoke VPCs through a centralized inspection VPC by using AWS Transit Gateway. The inspection VPC contains AWS Network Firewall endpoints in two Availability Zones. After deployment, some TCP sessions between workloads in different Availability Zones are dropped intermittently, while sessions within the same Availability Zone work. Logs show that the request and the response of a dropped flow pass through firewall endpoints in different Availability Zones. What should a solutions architect do to resolve this issue?`,
  options: [
    "Create a separate transit gateway route table for each Availability Zone and associate the spoke attachments based on the subnets they use.",
    "Replace the Network Firewall endpoints with a Network Load Balancer that has cross-zone load balancing enabled.",
    "Enable appliance mode on the transit gateway VPC attachment for the inspection VPC.",
    "Configure the Network Firewall stateful rule group to use the strict rule order and a default action of pass."
  ],
  answer: 2,
  explain: `**Từ khoá:** "centralized inspection VPC", "drops only across AZs", "request and response pass through firewall endpoints in different AZs".

**Vì sao C đúng:** mặc định transit gateway giữ lưu lượng trong **AZ nguồn** khi đi vào VPC attachment. Với flow giữa AZ-a và AZ-b, chiều đi có thể vào firewall ở AZ-a, chiều về vào firewall ở AZ-b. Firewall **stateful** ở AZ-b không có state của session nên drop gói tin (asymmetric routing). Bật **appliance mode** trên attachment của inspection VPC: TGW dùng flow hash để chọn **một** network interface (một AZ) cho cả hai chiều của flow trong suốt vòng đời của nó, nên lưu lượng đối xứng.

**Vì sao các phương án khác sai:**
- **A**: route table theo AZ không điều khiển được TGW chọn ENI nào trong inspection VPC; phức tạp mà không xử lý gốc vấn đề.
- **B**: NLB không phải điểm chèn firewall trong suốt cho route; Network Firewall endpoint vẫn cần, và cross-zone NLB không giữ được tính đối xứng cho thiết bị stateful.
- **D**: đổi rule order hay default action chỉ thay đổi logic lọc; firewall vẫn thấy gói giữa chừng không có state. Đặt pass mặc định còn làm yếu bảo mật.

> Exam tip: "stateful appliance in a TGW inspection VPC + traffic dropped across AZs" → **appliance mode**. Gateway Load Balancer và Network Firewall vẫn cần appliance mode trên attachment khi đứng sau TGW.`,
  services: ['AWS Transit Gateway', 'AWS Network Firewall', 'Amazon VPC'],
  refs: [{ type: 'doc', title: 'What is AWS Network Firewall?', url: 'https://docs.aws.amazon.com/network-firewall/latest/developerguide/what-is-aws-network-firewall.html' }]
},
{
  id: 'sap-082',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A company's security policy requires that all inbound internet traffic to its web applications in 15 VPCs be inspected by a specific third-party next-generation firewall (NGFW) product that the security team already operates on premises. The firewall fleet must scale horizontally, be highly available across Availability Zones, and receive the original packets transparently, including the client source IP address. The application teams must not change their applications. Which architecture meets these requirements?`,
  options: [
    "Deploy the third-party firewall appliances behind an Application Load Balancer in a security VPC, and configure the application ALBs to use the firewall ALB as a target.",
    "Replace the third-party firewall with AWS Network Firewall in each VPC, and import the existing on-premises rules as Suricata-compatible rule groups.",
    "Deploy the firewall appliances on EC2 instances in each VPC with source/destination checks disabled, and update route tables to point to the instance with the lowest CPU usage by using a Lambda function.",
    "Deploy the third-party firewall appliances in an Auto Scaling group behind a Gateway Load Balancer in a security VPC. Create Gateway Load Balancer endpoints in each application VPC and update ingress and subnet route tables to send traffic through the endpoints."
  ],
  answer: 3,
  explain: `**Từ khoá:** "specific third-party NGFW", "scale horizontally", "highly available", "transparently, including client source IP", "no application change".

**Vì sao D đúng:** **Gateway Load Balancer (GWLB)** được thiết kế cho virtual appliance bên thứ ba: hoạt động ở layer 3, đóng gói gói tin gốc bằng **GENEVE (UDP 6081)** gửi tới appliance nên appliance thấy nguyên IP nguồn/đích; tự health check, phân tải và giữ flow stickiness. **GWLB endpoint** (dựa trên PrivateLink) đặt trong mỗi VPC ứng dụng và được dùng làm **next hop** trong route table (kể cả **ingress routing** gắn vào internet gateway), nên lưu lượng đi qua firewall mà ứng dụng không phải sửa. Appliance trong Auto Scaling group cho scale ngang và đa AZ.

**Vì sao các phương án khác sai:**
- **A**: ALB terminate HTTP và tạo kết nối mới, appliance không thấy gói gốc; không phải mô hình chèn firewall trong suốt.
- **B**: Network Firewall tốt, nhưng đề bắt buộc dùng sản phẩm bên thứ ba đang vận hành.
- **C**: appliance trên EC2 + Lambda đổi route là tự chế, failover chậm, không có HA và stickiness, overhead lớn.

> Exam tip: "third-party virtual appliances" + "transparent" + "scale" → **Gateway Load Balancer + GWLB endpoints**. Nếu không bắt buộc bên thứ ba thì Network Firewall thường là đáp án "least overhead".`,
  services: ['Gateway Load Balancer', 'Amazon VPC', 'Amazon EC2 Auto Scaling'],
  refs: [{ type: 'doc', title: 'What is a Gateway Load Balancer?', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/introduction.html' }]
},
{
  id: 'sap-083',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A retail company has three regional data centers in Frankfurt, London, and Singapore. Each data center already connects to AWS through its own AWS Direct Connect dedicated connection at a nearby Direct Connect location, with private virtual interfaces attached to a Direct Connect gateway. The company wants to replace an expensive MPLS network between the three data centers. Traffic between the data centers does not need to reach any VPC. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create a transit gateway in each AWS Region, peer the transit gateways, and attach them to the Direct Connect gateway by using transit virtual interfaces.",
    "Enable SiteLink on the existing private virtual interfaces that are attached to the Direct Connect gateway.",
    "Create AWS Site-to-Site VPN connections between the data centers over the internet, and use Direct Connect only for VPC traffic.",
    "Deploy EC2-based routers in a shared VPC in each Region and configure BGP between them and the data centers over the private virtual interfaces."
  ],
  answer: 1,
  explain: `**Từ khoá:** "already on Direct Connect gateway", "replace MPLS between data centers", "does not need to reach any VPC", "LEAST operational overhead".

**Vì sao B đúng:** **Direct Connect SiteLink** cho phép lưu lượng đi **trực tiếp giữa các Direct Connect location** qua backbone AWS, không cần đi qua AWS Region hay VPC. Bật SiteLink trên các private VIF (hoặc transit VIF) đang gắn vào **cùng một Direct Connect gateway**; DX gateway học route BGP từ từng site và quảng bá sang các site khác. Không phải dựng hạ tầng mới, chỉ trả phí theo giờ cho VIF bật SiteLink và phí dữ liệu SiteLink.

**Vì sao các phương án khác sai:**
- **A**: transit gateway + peering phục vụ VPC; dùng để chuyển lưu lượng site-to-site là đắt hơn (phí xử lý dữ liệu TGW), phức tạp, và đề không cần VPC.
- **C**: VPN qua internet không có băng thông ổn định và độ trễ dự đoán được như MPLS; vẫn phải quản lý nhiều tunnel.
- **D**: router tự dựng trên EC2 cần vận hành, HA, patch, và lưu lượng hairpin qua Region, tốn data transfer.

> Exam tip: "connect on-premises sites to each other using Direct Connect, without going through a Region" → **SiteLink**. Nhớ: SiteLink hoạt động qua Direct Connect gateway, với private hoặc transit VIF.`,
  services: ['AWS Direct Connect', 'Direct Connect SiteLink', 'Direct Connect gateway']
},
{
  id: 'sap-084',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A bank is connecting its primary data center to AWS. Regulators require that all traffic between the data center and AWS be encrypted in transit. The bank needs 20 Gbps of aggregate bandwidth, wants to manage the link as a single logical connection, and cannot accept the throughput limits of IPsec VPN tunnels. The bank's router supports MACsec. Which combination of actions should a solutions architect recommend? (Choose two.)`,
  options: [
    "Order two 10 Gbps hosted connections from an AWS Direct Connect Partner and combine them with equal-cost multipath routing.",
    "Order two 10 Gbps dedicated Direct Connect connections at the same Direct Connect location that support MACsec, and bundle them into a link aggregation group (LAG).",
    "Create an AWS Site-to-Site VPN over a public virtual interface on each connection to encrypt the traffic.",
    "Associate a MACsec secret (CKN/CAK) with the LAG and configure MACsec on the customer router so that traffic is encrypted at Layer 2.",
    "Use Transit Gateway Connect attachments with GRE tunnels over the connections to encrypt the traffic."
  ],
  answer: [1, 3],
  multi: true,
  explain: `**Từ khoá:** "encrypted in transit", "20 Gbps aggregate", "single logical connection", "cannot accept IPsec VPN throughput limits", "router supports MACsec".

**Vì sao B và D đúng:**
- **B**: **LAG (link aggregation group)** gom nhiều **dedicated connection** cùng tốc độ, cùng Direct Connect location/endpoint thành một kết nối logic (dùng LACP). Hai đường 10 Gbps cho 20 Gbps tổng và vẫn sống nếu mất một đường (tuỳ thiết lập minimum links).
- **D**: **MACsec (IEEE 802.1AE)** mã hoá ở **Layer 2**, ở tốc độ line-rate, giữa router của bạn và thiết bị Direct Connect. Bạn gắn secret **CKN/CAK** vào connection hoặc LAG và cấu hình tương ứng trên router. Không bị giới hạn khoảng 1.25 Gbps mỗi tunnel như IPsec.

**Vì sao các phương án khác sai:**
- **A**: MACsec được hỗ trợ trên **dedicated connection** (10/100/400 Gbps tại location hỗ trợ); hosted connection không cho bạn quản lý MACsec như vậy, và không gom LAG được.
- **C**: VPN trên public VIF mã hoá được nhưng mỗi tunnel chỉ ~1.25 Gbps, đúng cái đề loại trừ, và phải quản lý nhiều tunnel ECMP.
- **E**: GRE của TGW Connect **không mã hoá**, chỉ đóng gói để chạy BGP với SD-WAN appliance.

> Exam tip: "encrypt Direct Connect at high bandwidth without VPN" → **MACsec trên dedicated connection**; "single logical link, more bandwidth" → **LAG** (các connection phải cùng bandwidth, cùng endpoint).`,
  services: ['AWS Direct Connect', 'MACsec', 'Link aggregation group'],
  refs: [
    { type: 'doc', title: 'MAC security (MACsec) for Direct Connect', url: 'https://docs.aws.amazon.com/directconnect/latest/UserGuide/MACsec.html' },
    { type: 'doc', title: 'Link aggregation groups (LAGs)', url: 'https://docs.aws.amazon.com/directconnect/latest/UserGuide/lags.html' }
  ]
},
{
  id: 'sap-085',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A global company operates in six AWS Regions. Each Region has a transit gateway, and the network team manages full-mesh transit gateway peering, static routes, and separate route tables to keep production, development, and shared services traffic isolated. Adding a Region or changing segmentation now takes weeks and errors have caused outages. The company wants to define its global network, segments, and inter-segment rules centrally as a single policy, with dynamic routing between Regions. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Deploy AWS Cloud WAN with a core network policy that defines edge locations in the six Regions and segments for production, development, and shared services, and attach the VPCs and on-premises connections to the core network.",
    "Keep the transit gateways and write an AWS Lambda function that reads a JSON definition of the segments and updates transit gateway route tables and peering attachments in every Region.",
    "Replace transit gateway peering with VPC peering between all VPCs, and use security groups to isolate production from development.",
    "Create one transit gateway in a central Region and attach all VPCs in all Regions to it to simplify routing."
  ],
  answer: 0,
  explain: `**Từ khoá:** "six Regions", "full-mesh TGW peering, static routes", "isolate prod/dev/shared", "define centrally as a single policy", "dynamic routing", "LEAST overhead".

**Vì sao A đúng:** **AWS Cloud WAN** là dịch vụ mạng WAN toàn cầu được quản lý. Bạn viết một **core network policy** (JSON có version, có thể xem trước thay đổi) gồm: **edge locations** (Region), **segments** (mỗi segment là một miền định tuyến cách ly, như prod/dev/shared), **attachment policies** (gắn VPC vào segment theo tag) và **segment actions** (chia sẻ route giữa segment, ví dụ shared services cho cả prod và dev). Cloud WAN tự dựng mesh giữa các Region và định tuyến động bằng BGP, nên thêm Region chỉ là sửa policy.

**Vì sao các phương án khác sai:**
- **B**: tự viết Lambda điều khiển route là xây lại Cloud WAN một cách kém tin cậy; overhead và rủi ro cao.
- **C**: VPC peering không transitive, số kết nối tăng theo n², không có kết nối on-premises tập trung; security group không thay được cách ly định tuyến.
- **D**: transit gateway là tài nguyên **Regional**; VPC chỉ gắn được vào TGW cùng Region.

> Exam tip: "global network across many Regions", "segments", "central policy" → **Cloud WAN**. Một hai Region với vài VPC thì transit gateway (+ peering) vẫn là đáp án đơn giản hơn.`,
  services: ['AWS Cloud WAN', 'AWS Transit Gateway', 'Amazon VPC'],
  refs: [{ type: 'doc', title: 'What is AWS Cloud WAN?', url: 'https://docs.aws.amazon.com/network-manager/latest/cloudwan/what-is-cloudwan.html' }]
},
{
  id: 'sap-086',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A company has 35 microservices owned by different teams in separate AWS accounts. The services run on a mix of Amazon ECS, Amazon EKS, AWS Lambda, and EC2 instances, and expose HTTP and gRPC APIs. Many VPCs use overlapping CIDR blocks. Services must call each other privately, each service owner must control which other services can call it by using IAM-based authorization, and the platform team wants to avoid managing transit gateway routes or per-service load balancers and endpoint services. Which solution meets these requirements?`,
  options: [
    "Connect all VPCs to a transit gateway, re-address the overlapping VPCs, and use security groups to restrict which services can connect.",
    "Create a VPC endpoint service with a Network Load Balancer for each microservice, and create interface VPC endpoints in every consumer VPC.",
    "Create an Amazon VPC Lattice service network, share it with the accounts by using AWS RAM, register each microservice as a VPC Lattice service, associate the VPCs, and apply auth policies on the services.",
    "Use VPC peering between every pair of VPCs that need to communicate, and use Route 53 private hosted zones for service discovery."
  ],
  answer: 2,
  explain: `**Từ khoá:** "service-to-service HTTP/gRPC", "many accounts", "overlapping CIDRs", "IAM-based authorization per service", "avoid TGW routes and per-service load balancers".

**Vì sao C đúng:** **Amazon VPC Lattice** là lớp mạng ứng dụng được quản lý: tạo **service network**, chia sẻ qua **AWS RAM**, mỗi đội đăng ký dịch vụ của mình (target là ECS, EKS, Lambda, EC2, IP) thành **VPC Lattice service**, rồi **associate** VPC của consumer vào service network. Lattice dùng dải địa chỉ link-local riêng nên **CIDR trùng nhau không thành vấn đề**, không cần route TGW. **Auth policy** (cú pháp IAM) trên service network và trên từng service cho phép kiểm soát caller theo principal, account, org; request được ký SigV4.

**Vì sao các phương án khác sai:**
- **A**: TGW không định tuyến được CIDR trùng; re-address 35 VPC tốn công; security group không cho phân quyền theo danh tính IAM.
- **B**: PrivateLink chịu được CIDR trùng nhưng phải tạo NLB + endpoint service cho từng service và interface endpoint ở từng consumer, đúng thứ đề muốn tránh; cũng không có auth theo IAM ở tầng request.
- **D**: peering không chạy với CIDR trùng, số peering tăng theo n², không có authorization theo IAM.

> Exam tip: "service-to-service connectivity + auth policies + overlapping IPs + many compute types" → **VPC Lattice**. Một dịch vụ cung cấp cho rất nhiều khách hàng bên ngoài (SaaS) → PrivateLink.`,
  services: ['Amazon VPC Lattice', 'AWS RAM', 'IAM'],
  refs: [{ type: 'doc', title: 'What is Amazon VPC Lattice?', url: 'https://docs.aws.amazon.com/vpc-lattice/latest/ug/what-is-vpc-lattice.html' }]
},
{
  id: 'sap-087',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A company has 400 VPCs across 60 accounts in AWS Organizations. Every VPC must be associated with the same 25 Route 53 private hosted zones, the same Route 53 Resolver forwarding rules to on-premises DNS, and the same Route 53 Resolver DNS Firewall rule groups. Today, a set of scripts associates each resource with each VPC, and new VPCs are often missing associations. The networking team wants to manage this DNS configuration as one unit and apply it to new VPCs consistently. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Use AWS CloudFormation StackSets to deploy a template in every account that creates private hosted zone associations and resolver rule associations for each VPC.",
    "Create a single shared VPC for all workloads so that only one set of associations is required.",
    "Configure each VPC to use the Route 53 Resolver inbound endpoint in the networking account as its DNS server through a DHCP options set.",
    "Create a Route 53 Profile in the networking account that contains the private hosted zones, Resolver rules, and DNS Firewall rule groups, share it with the organization by using AWS RAM, and associate the Profile with each VPC."
  ],
  answer: 3,
  explain: `**Từ khoá:** "400 VPCs", "same private hosted zones, Resolver rules, DNS Firewall rule groups", "manage as one unit", "LEAST overhead".

**Vì sao D đúng:** **Route 53 Profiles** gom cấu hình DNS (association với **private hosted zone**, **Resolver forwarding rule**, **DNS Firewall rule group**, cùng một số thiết lập Resolver) vào **một Profile**. Chia sẻ Profile qua **AWS RAM** cho cả org, rồi mỗi VPC chỉ cần **một association** tới Profile. Thêm hosted zone hay rule mới vào Profile thì mọi VPC đã gắn tự nhận, thay vì phải tạo 25+ association cho từng VPC.

**Vì sao các phương án khác sai:**
- **A**: StackSets tự động hoá được nhưng vẫn quản lý hàng nghìn association riêng lẻ; mỗi lần thêm hosted zone phải cập nhật template và stack ở mọi account.
- **B**: gom mọi workload vào một VPC dùng chung là thay đổi kiến trúc lớn, phá ranh giới account, không thực tế.
- **C**: trỏ DHCP options tới inbound endpoint là sai thiết kế (inbound endpoint dành cho on-premises gọi vào), tạo điểm nghẽn và tốn phí theo query; DNS Firewall cũng không được áp đúng theo VPC nguồn.

> Exam tip: "share DNS configuration (PHZ + resolver rules + DNS Firewall) across many VPCs/accounts" → **Route 53 Profiles** qua RAM. Câu cũ hơn có thể dùng chia sẻ resolver rule bằng RAM, nhưng Profiles là cách ít overhead nhất.`,
  services: ['Amazon Route 53', 'Route 53 Profiles', 'Route 53 Resolver DNS Firewall', 'AWS RAM'],
  refs: [{ type: 'doc', title: 'Route 53 Profiles', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/profiles.html' }]
},
{
  id: 'sap-088',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A company has 120 accounts in AWS Organizations. Compliance rules state that every Amazon RDS database, Amazon EBS volume, and Amazon EFS file system tagged backup=gold must be backed up daily, kept for 35 days, and copied to a second Region. Application teams must not be able to weaken these settings in their accounts. The compliance team needs a daily report from a single account that shows which resources are not compliant with the policy. Which combination of steps meets these requirements with the LEAST operational overhead? (Choose two.)`,
  options: [
    "Create an AWS Backup backup policy in AWS Organizations that defines the daily plan, 35-day retention, cross-Region copy, and tag-based resource selection, and attach it to the OUs that contain workload accounts.",
    "Deploy an AWS Lambda function in every account that creates EBS snapshots and RDS snapshots daily and copies them to the second Region.",
    "Ask each application team to create their own AWS Backup plan and review the plans quarterly.",
    "Register a delegated administrator account for AWS Backup and use AWS Backup Audit Manager with a framework and daily reports that evaluate backup compliance across the organization.",
    "Use AWS Config in each account with a custom rule that checks for the existence of recent snapshots, and email the results."
  ],
  answer: [0, 3],
  multi: true,
  explain: `**Từ khoá:** "120 accounts", "tagged backup=gold", "teams must not be able to weaken", "daily compliance report from a single account".

**Vì sao A và D đúng:**
- **A**: **Backup policy** là management policy của Organizations. Gắn vào OU thì AWS Backup tự tạo **backup plan do org quản lý** trong từng account, chọn resource theo **tag**, có lịch, retention và **copy action** sang Region khác. Admin trong member account **không sửa được** plan được áp từ policy. Account mới vào OU tự nhận.
- **D**: đăng ký **delegated administrator** cho AWS Backup để quản lý và giám sát cross-account mà không dùng management account. **AWS Backup Audit Manager** có **framework** với các control (resource được bảo vệ bởi plan, tần suất, retention, cross-Region copy) và **report plan** tạo báo cáo compliance định kỳ.

**Vì sao các phương án khác sai:**
- **B**: tự viết Lambda snapshot là tái tạo AWS Backup, không chặn được việc bị sửa, overhead lớn.
- **C**: để từng đội tự làm không đảm bảo enforcement, review hằng quý không phải báo cáo hằng ngày.
- **E**: Config rule tự viết phải triển khai mọi account và không tổng hợp tập trung nếu không có aggregator; Backup Audit Manager đã làm sẵn.

> Exam tip: "enforce backups across the organization" → **Organizations backup policy**; "prove/report backup compliance" → **Backup Audit Manager**. Chống ransomware xoá backup thì thêm vault lock và backup account riêng.`,
  services: ['AWS Backup', 'AWS Organizations', 'AWS Backup Audit Manager'],
  refs: [
    { type: 'doc', title: 'Backup policies', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_backup.html' },
    { type: 'doc', title: 'AWS Backup Audit Manager', url: 'https://docs.aws.amazon.com/aws-backup/latest/devguide/aws-backup-audit-manager.html' }
  ]
},
{
  id: 'sap-089',
  exam: 'sap-c02',
  domain: 'sap-d1',
  q: `A company gives each of its 200 developers a sandbox account in an AWS Organizations OU named Sandbox. Each sandbox has a monthly limit of $300. Last quarter several sandboxes exceeded $2,000 because developers left large GPU instances running. When a sandbox reaches 100% of its budget, the company wants to automatically prevent the developer from launching any new EC2 instances or SageMaker resources in that account, without affecting other accounts, and allow the platform team to reverse the restriction later. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Enable AWS Cost Anomaly Detection for each sandbox account and subscribe the developers to the alerts so that they can stop their resources.",
    "Create an AWS Budgets budget for each sandbox account with a budget action that, at 100% of actual cost, automatically attaches a restrictive SCP to that account.",
    "Create an Amazon EventBridge rule that runs hourly, reads the AWS Cost and Usage Report with Amazon Athena, and deletes resources in accounts that exceed $300.",
    "Attach an SCP to the Sandbox OU that denies all EC2 instance types larger than xlarge and all SageMaker actions."
  ],
  answer: 1,
  explain: `**Từ khoá:** "automatically prevent launching", "per account, at 100% of budget", "reverse later", "LEAST overhead".

**Vì sao B đúng:** **AWS Budgets actions** cho phép khi budget vượt ngưỡng (theo actual hoặc forecasted), Budgets tự thực thi một hành động: **gắn IAM policy**, **gắn SCP** vào account/OU, hoặc **dừng EC2/RDS instance** cụ thể. Có thể chạy tự động hoặc chờ phê duyệt, và hành động có thể **reverse** (gỡ SCP) từ console. SCP action được cấu hình từ management account; tạo budget cho từng account sandbox có thể tự động hoá trong account vending.

**Vì sao các phương án khác sai:**
- **A**: Cost Anomaly Detection chỉ **phát hiện và cảnh báo** chi tiêu bất thường; không chặn, và chi tiêu đều đặn vượt ngân sách chưa chắc là "anomaly".
- **C**: tự xây pipeline CUR + Athena là overhead lớn; CUR có độ trễ, và xoá resource là phá huỷ, không reversible.
- **D**: SCP cố định chặn GPU cho mọi sandbox ngay cả khi còn ngân sách, không liên quan tới ngưỡng $300; SageMaker bị chặn hoàn toàn.

> Exam tip: "automatically take action when a budget is exceeded" → **Budgets actions** (IAM policy, SCP, stop EC2/RDS). "Detect unexpected spend with ML" → Cost Anomaly Detection. Hai thứ thường bổ trợ nhau.`,
  services: ['AWS Budgets', 'AWS Organizations', 'SCP'],
  refs: [{ type: 'doc', title: 'Configuring AWS Budgets actions', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html' }]
},
{
  id: 'sap-090',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A media company serves 400,000 requests per second at peak through Amazon CloudFront. The company needs to normalize the Accept-Language header, add security response headers, and perform about 50,000 URL redirects for retired pages based on a lookup table that the marketing team updates several times a day. The logic must run on every viewer request and response with sub-millisecond latency and at the lowest possible cost. None of the logic needs network access or the request body. Which solution meets these requirements?`,
  options: [
    "Use CloudFront Functions for viewer request and viewer response events, and store the redirect map in CloudFront KeyValueStore so that it can be updated without redeploying the function.",
    "Use Lambda@Edge functions on the origin request and origin response events, and store the redirect map in an Amazon DynamoDB global table.",
    "Use Lambda@Edge functions on the viewer request and viewer response events with the redirect map bundled in the deployment package.",
    "Move the logic to the origin Application Load Balancer by using listener rules for each redirect and a response headers policy on the ALB."
  ],
  answer: 0,
  explain: `**Từ khoá:** "400,000 requests/s", "every viewer request and response", "sub-millisecond", "lowest cost", "no network access, no body", "lookup table updated several times a day".

**Vì sao A đúng:** **CloudFront Functions** chạy JavaScript nhẹ tại hàng trăm edge location, chỉ trên **viewer request/viewer response**, thời gian chạy dưới 1 ms, scale tới hàng triệu request mỗi giây, giá rẻ hơn Lambda@Edge rất nhiều. Phù hợp đúng các việc: chuẩn hoá header, thêm header bảo mật, redirect/rewrite URL. **CloudFront KeyValueStore** là kho key-value toàn cục mà function đọc được; cập nhật bảng redirect mà **không cần deploy lại** function.

**Vì sao các phương án khác sai:**
- **B**: origin event chỉ chạy khi cache miss, không chạy trên mọi request; Lambda@Edge đắt và chậm hơn; gọi DynamoDB qua mạng là thừa.
- **C**: Lambda@Edge ở viewer event chạy được nhưng chi phí và độ trễ cao hơn hẳn ở 400k RPS; bundle bảng redirect vào package thì mỗi lần marketing sửa phải deploy lại và chờ replicate.
- **D**: ALB listener có giới hạn số rule (không chứa nổi 50,000 redirect); xử lý tại origin làm mất lợi ích cache, tăng tải origin.

> Exam tip: CloudFront Functions = viewer events, header/URL/cache key, không network, cực rẻ. **Lambda@Edge** = cần network call, body, thư viện, thời gian chạy dài hơn, hoặc origin events.`,
  services: ['Amazon CloudFront', 'CloudFront Functions', 'CloudFront KeyValueStore', 'Lambda@Edge'],
  refs: [{ type: 'doc', title: 'Differences between CloudFront Functions and Lambda@Edge', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions-choosing.html' }]
},
{
  id: 'sap-091',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A company is building an internal pricing API with Amazon API Gateway (REST API) and AWS Lambda in a Shared Services account. The API must be callable only from applications running in four specific VPCs that belong to other accounts in the same organization. The API must never be reachable from the internet, and access must be restricted to those four VPCs even if another account in the organization creates its own endpoint. Which solution meets these requirements?`,
  options: [
    "Create a regional API and attach an AWS WAF web ACL that allows only the private CIDR ranges of the four VPCs.",
    "Create an edge-optimized API and use a Lambda authorizer that checks the source IP address of each request against the CIDR ranges of the four VPCs.",
    "Create a private API. In each of the four VPCs, create an interface VPC endpoint for execute-api. Attach an API resource policy that allows execute-api:Invoke only when aws:SourceVpce matches one of the four endpoint IDs.",
    "Create a private API and attach a resource policy that allows execute-api:Invoke when aws:PrincipalOrgID equals the organization ID."
  ],
  answer: 2,
  explain: `**Từ khoá:** "never reachable from the internet", "only from four specific VPCs in other accounts", "even if another account creates its own endpoint".

**Vì sao C đúng:** **Private API** của API Gateway chỉ truy cập được qua **interface VPC endpoint cho execute-api** (PrivateLink), không có đường từ internet. Endpoint có thể nằm ở account khác. **Resource policy** của API với condition {{aws:SourceVpce}} (hoặc {{aws:SourceVpc}}) liệt kê đúng 4 endpoint ID giúp chặn mọi endpoint khác, kể cả endpoint do account khác trong org tạo.

**Vì sao các phương án khác sai:**
- **A**: regional API vẫn có endpoint public trên internet; IP private của VPC không đi tới endpoint public theo cách WAF lọc được như mong muốn, và vẫn lộ ra internet.
- **B**: edge-optimized API đi qua CloudFront, là public; Lambda authorizer lọc theo IP là tự chế và vẫn không thoả "never reachable from the internet".
- **D**: private API đúng, nhưng điều kiện {{aws:PrincipalOrgID}} cho phép **mọi** account trong org tạo endpoint và gọi; không giới hạn được về 4 VPC.

> Exam tip: "API reachable only from specific VPCs" → **private API + execute-api interface endpoint + resource policy aws:SourceVpce**. Lưu ý: bật private DNS cho execute-api endpoint làm VPC đó không gọi được tên miền mặc định của API public nữa, hay gặp trong câu troubleshooting.`,
  services: ['Amazon API Gateway', 'AWS PrivateLink', 'AWS Lambda'],
  refs: [{ type: 'doc', title: 'Private REST APIs in API Gateway', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-private-apis.html' }]
},
{
  id: 'sap-092',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A logistics company exposes a shipment-tracking REST API to 300 partner companies through Amazon API Gateway backed by AWS Lambda and Amazon Aurora. Partners subscribe to Basic (10 requests per second, 100,000 requests per month) or Premium (100 requests per second, 5 million requests per month) tiers. The same tracking status is often requested many times within a minute, and the database is under heavy read load. Which combination of steps should a solutions architect take? (Choose two.)`,
  options: [
    "Configure AWS WAF rate-based rules on the API stage to enforce the monthly request quota for each partner.",
    "Set reserved concurrency on the Lambda function to 100 to limit how many requests each partner can send.",
    "Create Basic and Premium usage plans with the throttling and quota limits, issue an API key to each partner, and associate the keys with the matching usage plan.",
    "Put an Amazon CloudFront distribution in front of the API and configure CloudFront to count requests per partner.",
    "Enable API Gateway caching on the stage with a TTL of 60 seconds, and include the shipment ID path parameter in the cache key."
  ],
  answer: [2, 4],
  multi: true,
  explain: `**Từ khoá:** "tiers with requests per second and per month", "per partner", "same status requested many times within a minute", "heavy read load".

**Vì sao C và E đúng:**
- **C**: **Usage plan** của API Gateway (REST API) gắn **throttling** (rate, burst) và **quota** (theo ngày/tuần/tháng) với các **API key**. Mỗi partner có một key, gán vào plan Basic hoặc Premium; API Gateway trả 429 khi vượt. Lưu ý API key dùng để **định danh và đo lượng**, không thay cho xác thực (vẫn nên dùng IAM, Cognito hoặc Lambda authorizer).
- **E**: **API Gateway cache** trên stage (dung lượng 0.5–237 GB, TTL mặc định 300 s, tối đa 3600 s). Cache theo tham số {{shipmentId}} nên các request lặp lại trong 60 giây được trả từ cache, không gọi Lambda và Aurora.

**Vì sao các phương án khác sai:**
- **A**: WAF rate-based rule đếm trong cửa sổ ngắn (vài phút) theo IP hoặc key tổng hợp, không quản lý được quota theo tháng cho từng partner.
- **B**: reserved concurrency giới hạn **toàn bộ** function, không phân biệt partner; lúc đông partner Premium cũng bị throttle.
- **D**: CloudFront không có tính năng quota theo khách hàng; caching ở CloudFront có thể giúp nhưng phương án này nói "count requests", không giải quyết bài toán.

> Exam tip: "different tiers/quotas per customer of an API" → **usage plans + API keys**. "Reduce backend load for repeated GET" trên REST API → bật **stage cache** (HTTP API không có cache tích hợp).`,
  services: ['Amazon API Gateway', 'AWS Lambda', 'Amazon Aurora'],
  refs: [
    { type: 'doc', title: 'Usage plans and API keys for REST APIs', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html' },
    { type: 'doc', title: 'Cache settings for REST APIs', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html' }
  ]
},
{
  id: 'sap-093',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A telemedicine company lets patients book appointments up to 6 months in advance. For each appointment, the system must send a reminder exactly 24 hours before the appointment time and again 1 hour before, in the patient's time zone. The company expects about 3 million future reminders at any time. Appointments can be rescheduled or canceled. The solution must be serverless and require the LEAST custom code for scheduling. Which solution meets these requirements?`,
  options: [
    "Create an Amazon EventBridge rule with a cron expression for each reminder on the default event bus.",
    "Send each reminder to an Amazon SQS queue with a delivery delay equal to the time remaining until the reminder.",
    "Start an AWS Step Functions Express workflow for each appointment that uses a Wait state until each reminder time.",
    "Create Amazon EventBridge Scheduler one-time schedules with the reminder time and time zone, targeting an AWS Lambda function or Amazon SNS. Update or delete the schedules when appointments change, and let completed schedules be deleted automatically."
  ],
  answer: 3,
  explain: `**Từ khoá:** "3 million future reminders", "exact time, patient time zone", "up to 6 months ahead", "rescheduled or canceled", "serverless, least custom code".

**Vì sao D đúng:** **EventBridge Scheduler** được thiết kế cho số lượng lớn lịch: hỗ trợ **one-time schedule** ({{at(...)}}) với **time zone**, hàng triệu schedule mỗi account (quota mặc định cao, có thể tăng), gọi trực tiếp hàng trăm target (Lambda, SNS, SQS, Step Functions…) có retry và DLQ. Mỗi lịch có tên, nên đổi lịch hẹn thì **UpdateSchedule**, huỷ thì **DeleteSchedule**; tuỳ chọn **ActionAfterCompletion = DELETE** tự xoá lịch đã chạy.

**Vì sao các phương án khác sai:**
- **A**: EventBridge rule có quota số rule mỗi event bus (mức vài trăm, mặc định 300), không dành cho hàng triệu lịch một lần; cron trong rule dùng UTC.
- **B**: SQS delivery delay tối đa **15 phút**, không thể hoãn tới 6 tháng.
- **C**: Express workflow chạy tối đa **5 phút**, không thể Wait nhiều tháng. Standard workflow chờ được tới 1 năm nhưng 3 triệu execution treo là tốn kém và khó huỷ/sửa.

> Exam tip: "millions of one-time or recurring scheduled tasks, time zones" → **EventBridge Scheduler**. EventBridge rules dành cho phản ứng theo **event pattern** và vài lịch cron cố định.`,
  services: ['Amazon EventBridge Scheduler', 'AWS Lambda', 'Amazon SNS'],
  refs: [{ type: 'doc', title: 'What is Amazon EventBridge Scheduler?', url: 'https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html' }]
},
{
  id: 'sap-094',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `An insurance company stores policy changes in an Amazon DynamoDB table with DynamoDB Streams enabled. When a policy record changes to the status APPROVED, the company must look up the customer's details from an internal REST API, combine the data, and start an AWS Step Functions Standard workflow that issues documents. Other changes must be ignored. The development team wants to avoid writing and maintaining glue code for polling, filtering, and batching. Which solution meets these requirements with the LEAST development effort?`,
  options: [
    "Create an AWS Lambda function with a DynamoDB Streams event source mapping that checks the status in code, calls the REST API, and starts the workflow.",
    "Create an Amazon EventBridge pipe with the DynamoDB stream as the source, a filter that matches only records with status APPROVED, an API destination as the enrichment step, and the Step Functions state machine as the target.",
    "Enable Amazon Kinesis Data Streams for DynamoDB, deliver the records to Amazon Data Firehose, and invoke the workflow from Firehose data transformation.",
    "Configure DynamoDB to publish change events to the EventBridge default event bus, and create a rule that matches APPROVED and targets the state machine."
  ],
  answer: 1,
  explain: `**Từ khoá:** "DynamoDB Streams", "only status APPROVED", "enrich from REST API", "start Step Functions", "avoid glue code for polling, filtering, batching".

**Vì sao B đúng:** **EventBridge Pipes** nối **point-to-point** một source với một target, gồm 4 bước: **source** (DynamoDB Streams, Kinesis, SQS, MSK, Amazon MQ…; Pipes tự poll và batch), **filter** (event pattern, record không khớp bị bỏ và không tính phí bước sau), **enrichment** (Lambda, Step Functions Express, API Gateway hoặc **API destination** gọi REST API), **target** (Step Functions, SQS, Lambda, event bus…). Toàn bộ là cấu hình, không cần code poll hay filter.

**Vì sao các phương án khác sai:**
- **A**: chạy được nhưng chính là "glue code" đội muốn tránh; Lambda còn bị gọi cho **mọi** record (trừ khi thêm filter cho event source mapping) và phải tự xử lý lỗi gọi API.
- **C**: Firehose dùng để giao dữ liệu vào kho (S3, Redshift, OpenSearch…), không phải để khởi động workflow; data transformation Lambda không dùng cho mục đích này.
- **D**: DynamoDB **không** tự gửi sự kiện thay đổi item vào EventBridge default bus; cần Pipes hoặc Lambda làm cầu nối.

> Exam tip: "stream/queue → filter → enrich → target, no code" → **EventBridge Pipes**. Nhiều consumer theo pattern (fan-out) → event bus + rule. Lịch hẹn giờ → EventBridge Scheduler.`,
  services: ['Amazon EventBridge Pipes', 'Amazon DynamoDB', 'AWS Step Functions'],
  refs: [{ type: 'doc', title: 'Amazon EventBridge Pipes', url: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-pipes.html' }]
},
{
  id: 'sap-095',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `An IoT company ingests about 20,000 device telemetry messages per second through AWS IoT Core. Each message must go through a short workflow of four steps (validate, enrich, score with an AWS Lambda function, and write to Amazon DynamoDB) that always completes in less than 3 seconds. The steps are idempotent, and the company does not need a long-term execution history for each message beyond logs. The company wants a visual workflow with built-in retries at the LOWEST cost. Which solution meets these requirements?`,
  options: [
    "Use AWS Step Functions Express workflows started asynchronously for each message, with execution logging to Amazon CloudWatch Logs.",
    "Use AWS Step Functions Standard workflows started for each message, with execution history retained by Step Functions.",
    "Use one AWS Step Functions Standard workflow that runs for one year and processes messages in a loop with a Map state.",
    "Use Amazon Managed Workflows for Apache Airflow (MWAA) with a DAG that is triggered for each message."
  ],
  answer: 0,
  explain: `**Từ khoá:** "20,000 messages/s", "short workflow < 3 s", "idempotent", "no long-term execution history", "visual workflow, retries", "LOWEST cost".

**Vì sao A đúng:** **Step Functions Express workflow** dành cho khối lượng lớn, thời lượng ngắn (tối đa **5 phút**). Tính phí theo **số execution + thời gian chạy + bộ nhớ**, rẻ hơn nhiều so với Standard (tính phí theo **từng state transition**) khi có hàng chục nghìn execution mỗi giây. Express khởi chạy async có ngữ nghĩa **at-least-once**, điều này ổn vì các bước idempotent. Lịch sử thực thi gửi về **CloudWatch Logs** thay vì lưu trong Step Functions. Vẫn có Retry/Catch và giao diện Workflow Studio.

**Vì sao các phương án khác sai:**
- **B**: Standard có **exactly-once**, lưu lịch sử 90 ngày, chạy tới 1 năm, nhưng phí theo state transition sẽ rất đắt ở 20k msg/s và có quota tốc độ start execution thấp hơn nhiều.
- **C**: một workflow chạy cả năm lặp Map không phải mô hình xử lý stream; Map state có giới hạn lịch sử sự kiện (25,000 event), không scale theo luồng message liên tục.
- **D**: MWAA dùng cho batch/ETL theo lịch, mỗi DAG run tốn tài nguyên; không phù hợp kích hoạt 20k lần mỗi giây và cần môi trường chạy liên tục.

> Exam tip: **Standard** = dài (≤ 1 năm), exactly-once, human approval, audit history. **Express** = ngắn (≤ 5 phút), khối lượng cực lớn, rẻ, at-least-once (async) hoặc at-most-once (sync).`,
  services: ['AWS Step Functions', 'AWS IoT Core', 'AWS Lambda', 'Amazon DynamoDB'],
  refs: [{ type: 'doc', title: 'Choosing workflow type in Step Functions', url: 'https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html' }]
},
{
  id: 'sap-096',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `An e-commerce company wants to capture website clickstream events (about 15 MB per second) and make them available for SQL queries in Amazon Athena within 5 minutes. The data must be stored in Amazon S3 in Apache Parquet format, partitioned by event date and event type. No other consumers need the stream, and the company does not want to manage shards, consumers, or conversion jobs. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Send events to Amazon Kinesis Data Streams and run an Apache Flink application on Amazon Managed Service for Apache Flink that converts the events to Parquet and writes them to S3.",
    "Send events to an Amazon MSK Serverless cluster and use MSK Connect with an S3 sink connector, then run a nightly AWS Glue job to convert the files to Parquet.",
    "Send events directly to Amazon Data Firehose with record format conversion to Parquet using an AWS Glue Data Catalog table schema, dynamic partitioning by date and event type, and a buffer interval of 5 minutes or less.",
    "Write events directly from the web servers to S3 as JSON files, and run an AWS Glue crawler every 5 minutes so that Athena can query them."
  ],
  answer: 2,
  explain: `**Từ khoá:** "available in Athena within 5 minutes", "Parquet", "partitioned by date and type", "no other consumers", "no shards, consumers, or conversion jobs".

**Vì sao C đúng:** **Amazon Data Firehose** là dịch vụ **delivery** hoàn toàn managed, tự scale, không có shard. Firehose có sẵn **record format conversion** (JSON → Parquet/ORC theo schema trong **Glue Data Catalog**), **dynamic partitioning** (tạo prefix S3 theo trường trong record, như {{event_date}} và {{event_type}}), và buffer theo thời gian/kích thước nên dữ liệu xuất hiện trong vài phút. Athena đọc thẳng kết quả.

**Vì sao các phương án khác sai:**
- **A**: Kinesis Data Streams + Flink làm được nhưng phải quản lý shard/capacity và viết, vận hành ứng dụng Flink, overhead cao khi không cần xử lý stream phức tạp.
- **B**: MSK + MSK Connect là nhiều thành phần cần vận hành; job Glue chạy đêm không đáp ứng "within 5 minutes".
- **D**: ghi JSON thẳng tạo rất nhiều file nhỏ, không phải Parquet, không phân vùng chuẩn, crawler 5 phút một lần tốn kém và chậm.

> Exam tip: **Kinesis Data Streams** = nhiều consumer, replay, xử lý tuỳ biến, độ trễ dưới giây. **Data Firehose** = "load streaming data into S3/Redshift/OpenSearch/Splunk" với ít vận hành nhất, có convert và partition. **MSK** = cần Kafka API.`,
  services: ['Amazon Data Firehose', 'AWS Glue Data Catalog', 'Amazon S3', 'Amazon Athena'],
  refs: [{ type: 'doc', title: 'Convert input data format in Amazon Data Firehose', url: 'https://docs.aws.amazon.com/firehose/latest/dev/record-format-conversion.html' }]
},
{
  id: 'sap-097',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A trading platform publishes market events to an Amazon Kinesis data stream with 40 shards. Six independent consumer applications (fraud detection, risk, pricing, audit, analytics, and alerting) read the full stream. Since the fourth and fifth consumers were added, the consumers report ReadProvisionedThroughputExceeded errors and end-to-end latency has grown to several seconds. Each consumer needs to read all records with latency below 200 ms. Which solution meets these requirements with the LEAST change?`,
  options: [
    "Double the number of shards so that each shard has more read capacity, and keep using the GetRecords API in each consumer.",
    "Replace the data stream with an Amazon SQS FIFO queue and have each consumer read from the queue.",
    "Add an Amazon Data Firehose delivery stream for each consumer that reads from the data stream and buffers records.",
    "Register each consumer application as an enhanced fan-out consumer and use the SubscribeToShard API through the Kinesis Client Library."
  ],
  answer: 3,
  explain: `**Từ khoá:** "six consumers read the full stream", "ReadProvisionedThroughputExceeded", "latency below 200 ms", "LEAST change".

**Vì sao D đúng:** Ở chế độ **shared throughput**, mỗi shard chỉ có **2 MB/s đọc và 5 GetRecords/s** chia cho **tất cả** consumer; càng nhiều consumer thì mỗi consumer càng ít băng thông và phải chờ giữa các lần poll, gây độ trễ giây. **Enhanced fan-out** cho **mỗi consumer đã đăng ký** một ống **2 MB/s riêng cho mỗi shard**, dữ liệu được **push** qua HTTP/2 ({{SubscribeToShard}}) với độ trễ trung bình khoảng 70 ms. KCL 2.x hỗ trợ sẵn, chỉ cần đổi cấu hình consumer. Mỗi stream hỗ trợ tối đa 20 consumer enhanced fan-out.

**Vì sao các phương án khác sai:**
- **A**: tăng shard giúp băng thông nhưng giới hạn 5 lần gọi/s/shard vẫn chia cho 6 consumer, độ trễ poll vẫn cao; tốn chi phí shard mà không giải quyết gốc.
- **B**: SQS FIFO: mỗi message chỉ được **một** consumer xử lý rồi xoá, không có mô hình nhiều consumer đọc toàn bộ luồng; phải viết lại hệ thống.
- **C**: Firehose buffer ít nhất vài chục giây tới phút và giao vào đích lưu trữ, không cho ứng dụng đọc độ trễ thấp.

> Exam tip: "many consumers + ReadProvisionedThroughputExceeded + low latency" → **enhanced fan-out**. "Writes throttled (WriteProvisionedThroughputExceeded)" → thêm shard hoặc on-demand mode, kiểm tra partition key bị nóng.`,
  services: ['Amazon Kinesis Data Streams', 'Kinesis Client Library'],
  refs: [{ type: 'doc', title: 'Develop enhanced fan-out consumers', url: 'https://docs.aws.amazon.com/streams/latest/dev/enhanced-consumers.html' }]
},
{
  id: 'sap-098',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A company is building a data lake in Amazon S3 in a central Data account. Analysts in three business-unit accounts query the data with Amazon Athena. The HR team must see all columns of the employees table, but the finance analysts must not see the salary and national_id columns, and the regional analysts must see only rows where region equals their own region. The company has hundreds of tables and wants to grant access by data classification rather than table by table. Which combination of steps meets these requirements? (Choose two.)`,
  options: [
    "Register the S3 locations with AWS Lake Formation, and define LF-Tags (for example, classification=confidential) on databases, tables, and columns. Grant permissions on LF-Tag expressions to the business-unit accounts or principals.",
    "Write S3 bucket policies with prefix-level conditions for each table and each business-unit account.",
    "Create separate copies of the employees table for each team with the restricted columns and rows removed by nightly AWS Glue jobs.",
    "Create Lake Formation data filters with column exclusions for the finance analysts and a row filter expression on region for the regional analysts, and grant SELECT on the filters.",
    "Use IAM policies with athena:StartQueryExecution conditions that restrict the SQL text of queries per team."
  ],
  answer: [0, 3],
  multi: true,
  explain: `**Từ khoá:** "central data lake, cross-account Athena", "column-level and row-level restrictions", "hundreds of tables", "grant by classification".

**Vì sao A và D đúng:**
- **A**: **AWS Lake Formation** quản lý quyền ở tầng **Data Catalog** (database, table, column) thay vì S3 policy. **LF-Tags** (LF-TBAC) gắn nhãn lên database/table/column; grant theo **biểu thức tag** nên table mới được gắn tag là tự có quyền, scale tới hàng trăm bảng. Grant cross-account qua Lake Formation (dùng AWS RAM bên dưới). Athena, Redshift Spectrum, EMR, Glue tôn trọng quyền này.
- **D**: **Data filters** cho phép **column-level** (include/exclude cột), **row-level** (biểu thức như {{region = 'EU'}}) và cell-level. Grant SELECT trên filter cho từng nhóm.

**Vì sao các phương án khác sai:**
- **B**: S3 bucket policy chỉ kiểm soát theo object/prefix, không ẩn được **cột** hay **dòng** trong file Parquet; hàng trăm bảng thì không quản lý nổi.
- **C**: copy dữ liệu tạo nhiều phiên bản lệch nhau, tốn lưu trữ, rủi ro rò rỉ, và tăng việc vận hành.
- **E**: không có cách lọc SQL text bằng IAM condition để bảo mật cột; dễ lách.

> Exam tip: "fine-grained (column/row/cell) access to a data lake, cross-account, scale" → **Lake Formation + LF-Tags + data filters**. S3 policy và IAM chỉ dừng ở mức bucket/prefix.`,
  services: ['AWS Lake Formation', 'Amazon Athena', 'AWS Glue Data Catalog', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'Lake Formation tag-based access control', url: 'https://docs.aws.amazon.com/lake-formation/latest/dg/tag-based-access-control.html' }]
},
{
  id: 'sap-099',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A company runs an Amazon Redshift RA3 cluster for nightly ETL that loads 30 TB of sales data. During the day, 300 BI users run dashboards against the same data, and heavy ETL backfills slow down the dashboards. A separate data science team in another AWS account also needs read access to the latest data. The company wants to isolate the workloads, avoid copying or unloading data, and keep the data consistent and up to date for all consumers. Which solution meets these requirements?`,
  options: [
    "Create a snapshot of the cluster every hour and restore it to a second cluster for BI users and to a cluster in the data science account.",
    "Use Amazon Redshift data sharing: keep the ETL cluster as the producer, create a datashare, and consume it from a separate Redshift Serverless workgroup for BI and from a cluster or workgroup in the data science account.",
    "Run UNLOAD to Amazon S3 every hour and have the BI users and data scientists query the files with Amazon Redshift Spectrum.",
    "Enable concurrency scaling on the cluster and create workload management queues for ETL, BI, and data science users."
  ],
  answer: 1,
  explain: `**Từ khoá:** "RA3", "isolate ETL and BI workloads", "another AWS account", "avoid copying or unloading", "consistent and up to date".

**Vì sao B đúng:** **Redshift data sharing** (có trên RA3 và Redshift Serverless) cho phép **producer** chia sẻ database, schema, table, view qua **datashare**; **consumer** (cluster hoặc serverless workgroup, cùng account, khác account hoặc khác Region) truy vấn **dữ liệu live, nhất quán theo giao dịch**, **không copy**. Mỗi consumer dùng **compute riêng**, nên dashboard BI không tranh tài nguyên với ETL. Dữ liệu RA3 nằm trên Redshift Managed Storage nên chia sẻ được.

**Vì sao các phương án khác sai:**
- **A**: snapshot/restore mỗi giờ là copy dữ liệu, dữ liệu trễ, tốn chi phí lưu trữ và thời gian restore.
- **C**: UNLOAD là copy ra S3, dữ liệu trễ một giờ, và phải quản lý schema ngoài.
- **D**: concurrency scaling và WLM giúp xếp hàng truy vấn nhưng vẫn chung một cluster (cùng leader node, cùng commit), không cô lập thật sự, và không giải quyết truy cập cross-account.

> Exam tip: "share live Redshift data across clusters/accounts without copying" → **data sharing** (yêu cầu RA3 hoặc Serverless; DC2 không hỗ trợ). Mô hình hub-and-spoke: một producer ETL, nhiều consumer.`,
  services: ['Amazon Redshift', 'Redshift data sharing', 'Amazon Redshift Serverless'],
  refs: [{ type: 'doc', title: 'Data sharing in Amazon Redshift', url: 'https://docs.aws.amazon.com/redshift/latest/dg/datashare-overview.html' }]
},
{
  id: 'sap-100',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A SaaS startup is launching a new PostgreSQL-compatible application. Traffic is unpredictable: it is near zero at night, normally needs about 4 vCPUs, and spikes to the equivalent of 64 vCPUs within seconds during customer onboarding events. The database must be highly available across two Availability Zones, and the company wants to pay as little as possible during idle periods without managing instance sizes. Which solution meets these requirements?`,
  options: [
    "Amazon RDS for PostgreSQL Multi-AZ on db.r6g.16xlarge instances, stopped every night by an EventBridge Scheduler schedule.",
    "Amazon Aurora Serverless v1 for PostgreSQL with automatic pause after 5 minutes of inactivity.",
    "Amazon Aurora PostgreSQL with Aurora Serverless v2 writer and reader instances in two Availability Zones, configured with a low minimum ACU and a maximum ACU that covers the peak.",
    "Amazon Aurora PostgreSQL provisioned cluster with Aurora Auto Scaling of read replicas based on CPU utilization."
  ],
  answer: 2,
  explain: `**Từ khoá:** "unpredictable", "near zero at night", "spikes within seconds", "HA across two AZs", "pay little when idle", "no instance sizing".

**Vì sao C đúng:** **Aurora Serverless v2** scale **tại chỗ** theo từng 0.5 **ACU** (mỗi ACU khoảng 2 GiB RAM cùng CPU, mạng tương ứng) trong vài giây, không làm rớt kết nối. Đặt **min ACU** thấp cho đêm (các phiên bản engine mới còn hỗ trợ min 0 ACU với auto-pause) và **max ACU** đủ cho đỉnh. Có thể có **reader Serverless v2 ở AZ khác** làm failover target, nên đạt HA Multi-AZ. Trả tiền theo ACU-giờ thực dùng.

**Vì sao các phương án khác sai:**
- **A**: instance cố định 16xlarge đắt cả ngày; dừng ban đêm thì mất khả dụng, mà RDS tự khởi động lại sau 7 ngày; vẫn phải chọn kích cỡ.
- **B**: **Aurora Serverless v1 đã hết hỗ trợ** (end of life từ 2025); v1 cũng scale chậm theo bước và không có Multi-AZ reader.
- **D**: Auto Scaling replica chỉ thêm **reader**, writer vẫn cố định kích cỡ; thêm replica mất nhiều phút, không theo kịp spike vài giây.

> Exam tip: "unpredictable/spiky relational workload, minimal management" → **Aurora Serverless v2**. Có thể **trộn** writer provisioned với reader Serverless v2 trong cùng cluster. Nhớ quy tắc failover tier: reader Serverless v2 ở tier 0–1 scale theo writer.`,
  services: ['Amazon Aurora', 'Aurora Serverless v2'],
  refs: [{ type: 'doc', title: 'Using Aurora Serverless v2', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html' }]
},
{
  id: 'sap-101',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A company is building a new customer-facing REST API with Spring Boot 3 on Java 21, deployed as AWS Lambda functions behind Amazon API Gateway. Load tests show that cold starts take 6 to 9 seconds because of framework initialization, which violates the 1-second p99 latency target during sudden traffic increases. Traffic is spiky and unpredictable, and the company wants to fix cold starts at the LOWEST cost without rewriting the application in another language. Which solution meets these requirements?`,
  options: [
    "Enable Lambda SnapStart on the function, publish a version, and point an alias used by API Gateway to that version. Use runtime hooks to refresh connections and unique values after restore.",
    "Configure provisioned concurrency for the peak number of concurrent executions 24 hours a day.",
    "Increase the function memory to 10,240 MB so that initialization uses more CPU.",
    "Configure reserved concurrency on the function so that execution environments are kept warm between invocations."
  ],
  answer: 0,
  explain: `**Từ khoá:** "Spring Boot, Java 21 on Lambda", "cold start 6–9 s from framework initialization", "spiky, unpredictable", "LOWEST cost", "no rewrite".

**Vì sao A đúng:** **Lambda SnapStart** khởi tạo function **một lần khi publish version**, chụp **snapshot Firecracker microVM** (bộ nhớ và đĩa đã khởi tạo xong Spring context), mã hoá và cache. Khi cần execution environment mới, Lambda **resume từ snapshot** thay vì khởi tạo lại, cold start giảm từ vài giây xuống mức dưới giây. **Với Java managed runtime, SnapStart không tính thêm phí.** Chỉ dùng được trên **published version/alias** (không phải $LATEST). Cần chú ý **uniqueness** (seed ngẫu nhiên, ID) và kết nối mạng tạo trong init: dùng runtime hooks (CRaC {{beforeCheckpoint}}/{{afterRestore}}) để làm mới.

**Vì sao các phương án khác sai:**
- **B**: provisioned concurrency cho đỉnh suốt 24 giờ rất đắt với lưu lượng spiky, và không thể đoán đỉnh; lưu ý SnapStart và provisioned concurrency không dùng chung trên cùng version.
- **C**: tăng memory giúp init nhanh hơn một chút nhưng không xoá được vài giây khởi tạo framework, lại tăng giá mỗi ms.
- **D**: reserved concurrency chỉ **giữ chỗ và giới hạn** concurrency, không giữ ấm environment.

> Exam tip: "Java Lambda cold start" → **SnapStart** trước tiên (rẻ nhất). "Strict latency, predictable traffic, double-digit ms" → provisioned concurrency. SnapStart không hỗ trợ EFS và ephemeral storage > 512 MB.`,
  services: ['AWS Lambda', 'Lambda SnapStart', 'Amazon API Gateway'],
  refs: [{ type: 'doc', title: 'Improving startup performance with Lambda SnapStart', url: 'https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html' }]
},
{
  id: 'sap-102',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A company is designing an order service on Amazon DynamoDB. The table uses orderId as the partition key. A new requirement is to show each customer's orders sorted by order date. The table already exists in production with 2 TB of data. Traffic is steady at about 8,000 writes per second and 20,000 reads per second around the clock with predictable daily variation of less than 20%. The company wants to support the new access pattern efficiently and reduce cost. Which combination of actions should the company take? (Choose two.)`,
  options: [
    "Add a local secondary index (LSI) with customerId as the sort key.",
    "Add a global secondary index (GSI) with customerId as the partition key and orderDate as the sort key, projecting only the attributes that the order list needs.",
    "Use a Scan operation with a FilterExpression on customerId and sort the results in the application.",
    "Add a DynamoDB Accelerator (DAX) cluster to serve the new query pattern from cache.",
    "Switch the table from on-demand to provisioned capacity mode with auto scaling, and purchase reserved capacity for the steady baseline."
  ],
  answer: [1, 4],
  multi: true,
  explain: `**Từ khoá:** "customer's orders sorted by date", "existing table in production", "steady, predictable 24/7 traffic", "reduce cost".

**Vì sao B và E đúng:**
- **B**: **GSI** có partition key và sort key **khác** bảng gốc và **có thể thêm vào bảng đang chạy** (backfill online). GSI {{customerId}} + {{orderDate}} cho phép Query theo khách hàng, đã sắp xếp theo ngày. Chỉ **project** thuộc tính cần thiết để giảm lưu trữ và WCU ghi lan sang index.
- **E**: lưu lượng **ổn định, dự đoán được** là trường hợp **provisioned capacity + auto scaling** rẻ hơn on-demand; **reserved capacity** (cam kết 1 hoặc 3 năm) giảm thêm cho phần nền.

**Vì sao các phương án khác sai:**
- **A**: **LSI chỉ tạo được lúc tạo bảng**, và phải dùng **cùng partition key** (orderId) với bảng, nên không phục vụ truy vấn theo customerId.
- **C**: Scan đọc toàn bộ 2 TB rồi mới lọc, tốn RCU khổng lồ và chậm.
- **D**: DAX cache kết quả GetItem/Query đã có; nó không tạo access pattern mới, và không giảm chi phí ghi.

> Exam tip: "new access pattern on existing table" → **GSI**. "Unpredictable/spiky or new" → on-demand; "steady/predictable" → provisioned + auto scaling (+ reserved capacity). GSI throttle có thể làm throttle cả bảng gốc, nên cấp đủ WCU cho GSI.`,
  services: ['Amazon DynamoDB'],
  refs: [
    { type: 'doc', title: 'Using Global Secondary Indexes in DynamoDB', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html' },
    { type: 'doc', title: 'DynamoDB throughput capacity modes', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/capacity-mode.html' }
  ]
},
{
  id: 'sap-103',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `A gaming company is designing a real-time leaderboard and session store on Amazon ElastiCache for Redis OSS. The dataset is expected to reach 600 GB within a year, and the write rate will exceed what a single primary node can handle. The design must survive the loss of a node or an Availability Zone with automatic failover, and capacity must be added later without downtime. Which design meets these requirements?`,
  options: [
    "Use a cluster mode disabled replication group with the largest available node type and five read replicas across Availability Zones.",
    "Use an ElastiCache for Memcached cluster with many nodes across Availability Zones and client-side consistent hashing.",
    "Use several independent cluster mode disabled replication groups and shard the keys in the application code.",
    "Use a Redis OSS replication group with cluster mode enabled, multiple shards each with at least one replica in a different Availability Zone, Multi-AZ with automatic failover enabled, and online resharding to add shards later."
  ],
  answer: 3,
  explain: `**Từ khoá:** "600 GB", "write rate exceeds a single primary", "survive node or AZ loss with automatic failover", "add capacity without downtime".

**Vì sao D đúng:** **Cluster mode enabled** chia keyspace thành **16,384 hash slot** trải trên nhiều **shard**; mỗi shard có **một primary nhận ghi** và tối đa 5 replica. Vì vậy cả **dung lượng bộ nhớ** và **throughput ghi** scale ngang theo số shard. Đặt replica ở AZ khác và bật **Multi-AZ + automatic failover** để khi mất primary hay mất AZ thì replica được promote. **Online resharding** thêm/bớt shard và di chuyển slot khi cluster vẫn phục vụ.

**Vì sao các phương án khác sai:**
- **A**: cluster mode disabled chỉ có **một shard**, một primary nhận mọi ghi; dữ liệu bị giới hạn bởi RAM một node. Read replica chỉ scale đọc.
- **B**: Memcached không có replication, không failover, không persistence, không có sorted set để làm leaderboard.
- **C**: tự shard ở tầng ứng dụng là overhead lớn, resharding thủ công và dễ lỗi; cluster mode đã làm việc này.

> Exam tip: "scale writes / dataset > one node" → **cluster mode enabled**. "Only read scaling, small dataset" → cluster mode disabled + replicas. Không muốn lo sizing → ElastiCache Serverless cũng là lựa chọn; Valkey là engine tương thích Redis OSS, rẻ hơn.`,
  services: ['Amazon ElastiCache', 'Redis OSS'],
  refs: [{ type: 'doc', title: 'Replication: cluster mode disabled vs enabled', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Replication.Redis-RedisCluster.html' }]
},
{
  id: 'sap-104',
  exam: 'sap-c02',
  domain: 'sap-d2',
  q: `An engineering company is designing a new simulation platform on AWS. Linux compute nodes write results over NFS, and Windows workstations used by engineers must read and annotate the same files over SMB with Active Directory permissions. The file system must support point-in-time snapshots that users can restore themselves, automatic tiering of cold data to lower-cost storage, and Multi-AZ high availability. Which storage solution meets these requirements?`,
  options: [
    "Amazon EFS with the Infrequent Access storage class, mounted on Linux nodes, and an SMB share created on a Windows EC2 instance that re-exports the EFS file system.",
    "Amazon FSx for NetApp ONTAP with a Multi-AZ file system, a storage virtual machine joined to Active Directory, volumes shared over both NFS and SMB, snapshot policies, and capacity pool tiering.",
    "Amazon FSx for Windows File Server Multi-AZ, with Linux nodes mounting the SMB share by using CIFS utilities.",
    "Amazon FSx for Lustre with a data repository association to Amazon S3, accessed by both Linux and Windows clients."
  ],
  answer: 1,
  explain: `**Từ khoá:** "Linux over NFS and Windows over SMB on the same files", "Active Directory", "user-restorable snapshots", "tiering cold data", "Multi-AZ".

**Vì sao B đúng:** **FSx for NetApp ONTAP** hỗ trợ **đa giao thức** trên cùng một volume: **NFS, SMB** (cùng iSCSI, NVMe/TCP); **storage virtual machine (SVM)** join Active Directory để áp quyền NTFS. Có **snapshot** theo lịch (user tự restore qua thư mục {{.snapshot}} hoặc Previous Versions), **tiering tự động** dữ liệu lạnh từ SSD sang **capacity pool** giá rẻ, và **Multi-AZ** với failover tự động. Còn có SnapMirror, FlexClone, dedupe/compression.

**Vì sao các phương án khác sai:**
- **A**: EFS chỉ có NFS; tự dựng Windows EC2 re-export SMB là điểm lỗi đơn, overhead cao, không giữ quyền AD nhất quán.
- **C**: FSx for Windows File Server chỉ phục vụ **SMB**; Linux mount CIFS được nhưng không phải NFS như yêu cầu và quyền POSIX không tự nhiên; không có tiering sang lớp rẻ như ONTAP.
- **D**: FSx for Lustre dành cho HPC trên Linux, không có client Windows/SMB, không có AD.

> Exam tip: "NFS **and** SMB on same data" hoặc "migrate from NetApp" → **FSx for ONTAP**. Chỉ SMB + AD + DFS → FSx for Windows. HPC, S3-linked → Lustre. NFS Linux serverless → EFS. ZFS/NFS độ trễ thấp → FSx for OpenZFS.`,
  services: ['Amazon FSx for NetApp ONTAP', 'AWS Directory Service'],
  refs: [{ type: 'doc', title: 'What is Amazon FSx for NetApp ONTAP?', url: 'https://docs.aws.amazon.com/fsx/latest/ONTAPGuide/what-is-fsx-ontap.html' }]
},
{
  id: 'sap-105',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company runs 25 business applications on AWS, each deployed with AWS CloudFormation. Leadership has defined resilience targets per application tier: Tier 1 must have an RTO of 1 hour and an RPO of 15 minutes for AZ and Regional disruptions. The company does not know which applications currently meet these targets, and wants a repeatable way to assess each application, get specific recommendations, and detect when a new release causes an application to drift away from its target. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Run an AWS Well-Architected Framework review for each application every quarter and track the reliability pillar findings in a spreadsheet.",
    "Use AWS Fault Injection Service to run AZ power-interruption experiments against every application each week and measure recovery time manually.",
    "Use AWS Resilience Hub: define resiliency policies with the RTO and RPO targets, add each application from its CloudFormation stacks, run assessments to get recommendations, and run assessments from the CI/CD pipeline to detect drift.",
    "Enable AWS Trusted Advisor fault tolerance checks in all accounts and create Amazon EventBridge rules for changes in check status."
  ],
  answer: 2,
  explain: `**Từ khoá:** "RTO/RPO targets per tier", "which applications meet them", "repeatable assessment", "recommendations", "detect drift after releases", "LEAST overhead".

**Vì sao C đúng:** **AWS Resilience Hub** cho bạn định nghĩa **resiliency policy** (RTO, RPO cho các loại sự cố: application, infrastructure, AZ, Region), rồi import ứng dụng từ **CloudFormation stack**, Terraform state, Resource Groups, AppRegistry hoặc EKS. **Assessment** ước tính RTO/RPO thực tế từ cấu hình (Multi-AZ, backup, replication…), so với policy và đưa **khuyến nghị** cụ thể (thêm cross-Region copy, alarm, SOP, FIS experiment). Gọi assessment qua API trong **pipeline CI/CD** để phát hiện **drift** khi release mới làm giảm khả năng phục hồi.

**Vì sao các phương án khác sai:**
- **A**: Well-Architected review là đánh giá thủ công theo bộ câu hỏi, không tính RTO/RPO ước tính cho từng tài nguyên, không tự động theo release.
- **B**: FIS rất hữu ích để kiểm chứng, nhưng tự nó không đánh giá so với policy hay đưa khuyến nghị; chạy hàng tuần cho 25 app và đo tay là overhead lớn. (Resilience Hub có thể gợi ý FIS experiment.)
- **D**: Trusted Advisor fault tolerance check chỉ là vài kiểm tra chung (EBS snapshot, Multi-AZ RDS…), không gắn với RTO/RPO của từng ứng dụng.

> Exam tip: "assess application against RTO/RPO targets and get recommendations" → **Resilience Hub**. "Inject failures to test" → **FIS**. "Orchestrate failover" → ARC.`,
  services: ['AWS Resilience Hub', 'AWS CloudFormation', 'AWS Fault Injection Service'],
  refs: [{ type: 'doc', title: 'What is AWS Resilience Hub?', url: 'https://docs.aws.amazon.com/resilience-hub/latest/userguide/what-is.html' }]
},
{
  id: 'sap-106',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company runs an active-passive payment application in us-east-1 (active) and us-west-2 (standby). Route 53 failover records use health checks on the us-east-1 endpoints. During a recent partial outage in us-east-1, the health checks flapped between healthy and unhealthy, causing traffic to bounce between Regions and corrupting in-flight transactions. The company now wants failover to be a deliberate, operator-initiated action that does not depend on the AWS control plane of the impaired Region, with safeguards that prevent both Regions from being turned off at the same time. Which solution meets these requirements?`,
  options: [
    "Use Amazon Route 53 Application Recovery Controller routing controls with routing control health checks on the failover records, and define safety rules that require at least one Region to be on. Operators change routing control states through the cluster data plane endpoints.",
    "Increase the Route 53 health check failure threshold to 10 and the request interval to 30 seconds to reduce flapping.",
    "Replace the Route 53 records with a CloudWatch alarm that triggers an AWS Lambda function in us-east-1 to update the DNS records during an incident.",
    "Use AWS Global Accelerator with traffic dials and change the dial for us-east-1 to 0% from the Global Accelerator console in us-west-2 during an incident."
  ],
  answer: 0,
  explain: `**Từ khoá:** "health checks flapped", "deliberate, operator-initiated", "not depend on the control plane of the impaired Region", "safeguards so both Regions are not off".

**Vì sao A đúng:** **Route 53 ARC routing control** là các "công tắc" on/off gắn với **routing control health check** của bản ghi failover. Trạng thái công tắc được lưu trong một **cluster** gồm 5 endpoint ở 5 Region khác nhau; bạn đổi trạng thái qua **data plane API** của cluster (cần ít nhất một endpoint còn sống), không phụ thuộc control plane Route 53 hay Region gặp sự cố. **Safety rule** (assertion rule, ví dụ "ít nhất một Region phải on") chặn thao tác nguy hiểm. Failover trở thành quyết định có chủ đích, không flapping.

**Vì sao các phương án khác sai:**
- **B**: tăng ngưỡng chỉ làm failover chậm hơn và vẫn tự động, vẫn có thể flapping trong sự cố nửa vời.
- **C**: Lambda chạy trong chính Region đang hỏng và gọi control plane Route 53 khi sự cố, đúng thứ cần tránh; không có safety rule.
- **D**: traffic dial của Global Accelerator là cách hợp lệ để chuyển tải, nhưng thay đổi cấu hình accelerator đi qua control plane (đặt ở us-west-2), ứng dụng hiện dùng Route 53, và không có safety rule.

> Exam tip: "manual, reliable Regional failover using data plane, with safety rules" → **ARC routing control**. Sự cố một AZ → **ARC zonal shift**/zonal autoshift.`,
  services: ['Route 53 Application Recovery Controller', 'Amazon Route 53'],
  refs: [{ type: 'doc', title: 'Routing control in ARC', url: 'https://docs.aws.amazon.com/r53recovery/latest/dg/routing-control.html' }]
},
{
  id: 'sap-107',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company with 60 accounts in AWS Organizations was surprised by a $45,000 charge after a misconfigured AWS Glue job ran in a loop for a week, and by a separate spike in NAT gateway data processing in another account. Monthly budgets did not catch these because total spend stayed within forecast. The FinOps team wants to be notified within hours of unusual spending patterns for any service or account, with root-cause details, without having to define fixed thresholds for each service. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create an AWS Budgets cost budget for every service in every account with alerts at 80% and 100%.",
    "Export the Cost and Usage Report hourly, build an Amazon QuickSight dashboard, and review it every morning.",
    "Create Amazon CloudWatch billing alarms on EstimatedCharges for each linked account with static thresholds.",
    "In the management account, enable AWS Cost Anomaly Detection with a monitor for AWS services and a monitor for linked accounts, and create an alert subscription with individual alerts delivered through Amazon SNS to the FinOps channel."
  ],
  answer: 3,
  explain: `**Từ khoá:** "unusual spending patterns", "any service or account", "within hours", "root-cause details", "without fixed thresholds", "LEAST overhead".

**Vì sao D đúng:** **AWS Cost Anomaly Detection** dùng **machine learning** học mẫu chi tiêu lịch sử, phát hiện bất thường mà không cần đặt ngưỡng cho từng dịch vụ. Tạo **cost monitor** theo **AWS services** (một monitor cho toàn bộ dịch vụ), **linked account**, cost category hoặc cost allocation tag. Mỗi anomaly có **root cause** (service, account, Region, usage type). **Alert subscription** gửi email (tóm tắt hằng ngày/tuần) hoặc **individual alert qua SNS** ngay khi phát hiện, nối tiếp được tới Slack/Chime qua Amazon Q Developer in chat applications.

**Vì sao các phương án khác sai:**
- **A**: hàng nghìn budget (dịch vụ × 60 account) với ngưỡng cố định là overhead lớn và vẫn không bắt được bất thường khi tổng còn trong ngân sách.
- **B**: dashboard tự xây và xem tay mỗi sáng không phải cảnh báo tự động, không có root cause.
- **C**: billing alarm dùng ngưỡng tĩnh, chỉ trên tổng ước tính, cập nhật vài lần một ngày, không chỉ ra dịch vụ gây ra.

> Exam tip: "detect unexpected spend without thresholds, ML, root cause" → **Cost Anomaly Detection**. "Enforce a limit / act when exceeding" → Budgets actions.`,
  services: ['AWS Cost Anomaly Detection', 'Amazon SNS', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'Detecting unusual spend with AWS Cost Anomaly Detection', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html' }]
},
{
  id: 'sap-108',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `After migrating 300 workloads to AWS over the past year, a company's Cost Explorer shows Savings Plans utilization of 99% but Savings Plans coverage of only 52%. Compute spend is spread across Amazon EC2 (several instance families), AWS Fargate, and AWS Lambda, and the steady baseline is expected to remain stable for at least 3 years. The CFO wants to lower compute cost and be alerted if coverage drops again as more workloads migrate. Which combination of actions should a solutions architect recommend? (Choose two.)`,
  options: [
    "Purchase an additional Compute Savings Plan using the Savings Plans purchase recommendations in Cost Explorer, based on the recent usage of the whole organization.",
    "Purchase EC2 Reserved Instances for Fargate tasks and Lambda functions to increase coverage.",
    "Create an AWS Budgets Savings Plans coverage budget with a target of 80% and an alert when coverage falls below the target.",
    "Return the existing Savings Plans because utilization at 99% means they are oversized.",
    "Convert all workloads to Spot Instances so that no commitment is required."
  ],
  answer: [0, 2],
  multi: true,
  explain: `**Từ khoá:** "utilization 99%, coverage 52%", "EC2 + Fargate + Lambda", "stable 3 years", "lower cost", "alert if coverage drops".

**Vì sao A và C đúng:**
- Hiểu đúng 2 chỉ số: **utilization** = phần cam kết đã dùng (99% tức là cam kết hiện tại được dùng gần hết, rất tốt). **Coverage** = phần chi tiêu đủ điều kiện được Savings Plans bao phủ (52% tức là gần một nửa vẫn trả On-Demand). Kết luận: **mua thêm**.
- **A**: **Compute Savings Plans** áp cho EC2 mọi family/Region/OS, **Fargate** và **Lambda**. Recommendation trong Cost Explorer tính mức cam kết tối ưu theo lịch sử (7/30/60 ngày) ở cấp org.
- **C**: **AWS Budgets** có loại **Savings Plans coverage budget** (và utilization budget) để cảnh báo khi coverage tụt dưới mục tiêu khi workload mới được di chuyển lên.

**Vì sao các phương án khác sai:**
- **B**: Reserved Instances chỉ áp cho EC2 (và RDS, ElastiCache…), **không** áp cho Fargate hay Lambda.
- **D**: Savings Plans không trả lại được; và utilization cao là dấu hiệu tốt, không phải oversized.
- **E**: Spot chỉ hợp với workload chịu gián đoạn; Lambda và nhiều workload stateful không chạy Spot được.

> Exam tip: utilization thấp → đã mua **quá nhiều**; coverage thấp → mua **thêm**. Compute SP linh hoạt nhất (EC2, Fargate, Lambda); EC2 Instance SP rẻ hơn nhưng khoá family + Region.`,
  services: ['Savings Plans', 'AWS Cost Explorer', 'AWS Budgets'],
  refs: [{ type: 'doc', title: 'Managing your costs with AWS Budgets', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html' }]
},
{
  id: 'sap-109',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company sends application logs to an Amazon OpenSearch Service domain that has 24 data nodes with 6 TB of EBS gp3 storage each. Logs must be searchable for 180 days. Engineers search the last 7 days frequently and interactively, logs from 8 to 30 days old are searched a few times a week, and older logs are searched only during rare audits, where slower queries are acceptable. Storage costs are growing quickly. Which solution will reduce cost while keeping the logs searchable in OpenSearch?`,
  options: [
    "Delete indices older than 30 days and re-ingest them from Amazon S3 when an audit happens.",
    "Enable UltraWarm and cold storage on the domain, and create an Index State Management (ISM) policy that moves indices to UltraWarm after 7 days, to cold storage after 30 days, and deletes them after 180 days.",
    "Change all data nodes to larger instance types with more EBS storage per node to reduce the node count.",
    "Increase the number of primary shards per index so that each shard is smaller and uses less storage."
  ],
  answer: 1,
  explain: `**Từ khoá:** "searchable for 180 days", "hot 7 days, warm 8–30 days, rarely older", "slower acceptable", "reduce cost".

**Vì sao B đúng:** OpenSearch Service có các tầng lưu trữ:
- **Hot**: data node với EBS/instance store, nhanh nhất, đắt nhất.
- **UltraWarm**: node đặc biệt dùng **Amazon S3** làm lưu trữ kèm cache, rẻ hơn nhiều mỗi GB, index **read-only** nhưng vẫn truy vấn tương tác được.
- **Cold storage**: index được tách khỏi compute, lưu trên S3 với chi phí thấp nhất; cần **attach lại vào UltraWarm** khi muốn truy vấn (phù hợp audit hiếm).
**Index State Management (ISM)** tự động chuyển index theo tuổi: hot → warm → cold → delete. Lưu ý: UltraWarm yêu cầu dedicated master node; cold storage yêu cầu UltraWarm.

**Vì sao các phương án khác sai:**
- **A**: xoá rồi ingest lại khi audit là chậm, tốn công và vi phạm yêu cầu "searchable in OpenSearch" suốt 180 ngày.
- **C**: node to hơn chỉ đổi cách đóng gói, chi phí mỗi GB trên hot tier gần như không giảm.
- **D**: số shard không giảm dung lượng dữ liệu; quá nhiều shard nhỏ còn làm tốn heap và giảm hiệu năng.

> Exam tip: "log analytics on OpenSearch, older data rarely queried" → **UltraWarm + cold storage + ISM**. Logs chỉ cần lưu lâu và query thỉnh thoảng có thể đưa sang S3 + Athena.`,
  services: ['Amazon OpenSearch Service', 'UltraWarm', 'Amazon S3'],
  refs: [
    { type: 'doc', title: 'UltraWarm storage for Amazon OpenSearch Service', url: 'https://docs.aws.amazon.com/opensearch-service/latest/developerguide/ultrawarm.html' },
    { type: 'doc', title: 'Cold storage for Amazon OpenSearch Service', url: 'https://docs.aws.amazon.com/opensearch-service/latest/developerguide/cold-storage.html' }
  ]
},
{
  id: 'sap-110',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A bank's mobile backend uses AWS Lambda functions written in Node.js behind Amazon API Gateway. Each function loads a large fraud-scoring model during initialization, which takes about 4 seconds. Every weekday between 08:00 and 10:00, traffic ramps from almost zero to 1,500 concurrent executions, and customers experience slow logins during the ramp. Outside this window, traffic is low and occasional slow requests are acceptable. Which solution improves performance in the most cost-effective way?`,
  options: [
    "Enable Lambda SnapStart on the functions and publish new versions.",
    "Set reserved concurrency of 1,500 on each function so that execution environments are pre-created before 08:00.",
    "Configure provisioned concurrency on the function alias and use Application Auto Scaling scheduled actions to raise it before 08:00 and lower it after 10:00.",
    "Move the functions to Amazon ECS on AWS Fargate with 1,500 tasks running at all times."
  ],
  answer: 2,
  explain: `**Từ khoá:** "Node.js", "4-second initialization", "predictable daily ramp 08:00–10:00", "low traffic otherwise", "cost-effective".

**Vì sao C đúng:** **Provisioned concurrency** khởi tạo sẵn số execution environment chỉ định (chạy xong init), nên request được phục vụ không có cold start. Cấu hình trên **alias hoặc version**. Kết hợp **Application Auto Scaling scheduled scaling** để tăng trước giờ cao điểm và hạ sau 10:00, nên chỉ trả phí provisioned trong khung giờ cần (có thể thêm target tracking theo {{ProvisionedConcurrencyUtilization}}).

**Vì sao các phương án khác sai:**
- **A**: **SnapStart không hỗ trợ Node.js** (chỉ Java 11+, Python 3.12+, .NET 8+).
- **B**: reserved concurrency chỉ **dành riêng và giới hạn** concurrency, không khởi tạo sẵn môi trường nên không giảm cold start.
- **D**: chạy 1,500 task Fargate suốt ngày rất đắt khi phần lớn thời gian tải thấp, và đổi kiến trúc lớn.

> Exam tip: "predictable spike + cold start" → **provisioned concurrency + scheduled scaling**. "Java cold start, spiky" → SnapStart. "Limit a function so it does not starve others" → reserved concurrency.`,
  services: ['AWS Lambda', 'Application Auto Scaling', 'Amazon API Gateway'],
  refs: [{ type: 'doc', title: 'Configuring provisioned concurrency for a function', url: 'https://docs.aws.amazon.com/lambda/latest/dg/provisioned-concurrency.html' }]
},
{
  id: 'sap-111',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company runs two kinds of workloads on Amazon ECS with AWS Fargate (Linux, x86_64): 60 customer-facing API services that run 24/7 with a steady baseline, and a fleet of queue-based image-processing workers that are stateless, checkpoint each job, and can be retried if interrupted. Fargate spend is $70,000 per month. All container images are built from multi-architecture-friendly Java and Python code. The company wants to reduce cost significantly without reducing API availability. Which combination of actions should a solutions architect recommend? (Choose three.)`,
  options: [
    "Purchase EC2 Standard Reserved Instances that match the vCPU and memory of the Fargate tasks.",
    "Run the image-processing workers with a capacity provider strategy that uses FARGATE_SPOT, and handle the SIGTERM two-minute interruption warning.",
    "Move the API services to FARGATE_SPOT to get the largest discount.",
    "Build ARM64 images and change the API services' task definitions to the ARM64 (AWS Graviton) runtime platform after testing.",
    "Increase task CPU and memory sizes so that fewer tasks are needed.",
    "Purchase a Compute Savings Plan that covers the steady Fargate baseline of the API services."
  ],
  answer: [1, 3, 5],
  multi: true,
  explain: `**Từ khoá:** "API services 24/7 steady baseline", "workers stateless, checkpoint, retryable", "multi-architecture-friendly code", "reduce cost without reducing API availability".

**Vì sao B, D, F đúng:**
- **B**: **Fargate Spot** rẻ hơn Fargate thường tới khoảng 70%, có thể bị thu hồi với cảnh báo **2 phút** (sự kiện EventBridge + SIGTERM). Worker xử lý hàng đợi, có checkpoint và retry là ứng viên lý tưởng. Dùng **capacity provider strategy** (có thể trộn base FARGATE + weight FARGATE_SPOT).
- **D**: Fargate trên **Graviton (ARM64)** có giá mỗi vCPU/GB thấp hơn x86 khoảng 20% và hiệu năng/giá tốt hơn; Java và Python thường chạy được trên ARM64 chỉ cần build image multi-arch.
- **F**: **Compute Savings Plans** áp cho Fargate; cam kết phần nền ổn định của API giảm thêm chi phí mà không ảnh hưởng khả dụng.

**Vì sao các phương án khác sai:**
- **A**: Reserved Instances **không áp dụng cho Fargate**.
- **C**: đặt API khách hàng trên Spot có thể bị gián đoạn hàng loạt, vi phạm "without reducing availability".
- **E**: tăng kích thước task không giảm tổng vCPU/GB cần dùng, thường còn lãng phí hơn; nên rightsizing theo số liệu thực.

> Exam tip: tối ưu chi phí container: **Spot cho workload chịu gián đoạn**, **Graviton**, **Savings Plans cho baseline**, rightsizing. Nhớ RIs không dùng cho Fargate và Lambda.`,
  services: ['Amazon ECS', 'AWS Fargate', 'Savings Plans', 'AWS Graviton'],
  refs: [{ type: 'doc', title: 'Amazon ECS clusters for Fargate (capacity providers)', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html' }]
},
{
  id: 'sap-112',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company runs 40 microservices on an Amazon EKS cluster with managed node groups of EC2 instances. Every pod currently uses the permissions of the node instance role, which grants access to all the S3 buckets, SQS queues, and DynamoDB tables that any service needs. A security audit requires least privilege per microservice. The platform team wants to grant each service its own IAM permissions with the least ongoing operational effort, reuse the same IAM roles across several clusters, and avoid managing an IAM OIDC provider per cluster. Which solution meets these requirements?`,
  options: [
    "Install the Amazon EKS Pod Identity Agent add-on, create one IAM role per microservice with a trust policy for the pods.eks.amazonaws.com service principal, and create a Pod Identity association between each role and the service's Kubernetes service account.",
    "Create a separate managed node group for each microservice with its own instance role, and use node selectors to schedule pods.",
    "Store an IAM user access key for each microservice in a Kubernetes secret and mount it as environment variables.",
    "Keep the node role and add Kubernetes network policies to restrict which pods can call AWS service endpoints."
  ],
  answer: 0,
  explain: `**Từ khoá:** "pods use node role", "least privilege per microservice", "reuse roles across clusters", "avoid managing an OIDC provider per cluster".

**Vì sao A đúng:** **EKS Pod Identity** cấp credential IAM cho từng **Kubernetes service account**. Cài add-on **Pod Identity Agent** (DaemonSet), tạo role có trust policy cho service principal {{pods.eks.amazonaws.com}}, rồi tạo **association** (cluster, namespace, service account → role) bằng EKS API. Không cần tạo **IAM OIDC provider** cho từng cluster như IRSA, và **cùng một role dùng được cho nhiều cluster** mà không phải sửa trust policy. Session tag (tên cluster, namespace…) còn hỗ trợ ABAC.

**Vì sao các phương án khác sai:**
- **B**: 40 node group chỉ để tách quyền thì tốn tài nguyên, giảm bin-packing, overhead lớn; và pod vẫn dùng chung quyền của node.
- **C**: access key dài hạn trong secret là anti-pattern bảo mật (rò rỉ, phải xoay vòng thủ công).
- **D**: network policy chặn kết nối mạng, không thay thế được phân quyền IAM; endpoint AWS dùng chung IP nên lọc theo mạng không khả thi.

> Exam tip: "per-pod IAM on EKS" → **EKS Pod Identity** (mới, ít overhead) hoặc **IRSA** (OIDC provider). Pod chạy trên **Fargate** thì dùng IRSA. Nhớ chặn pod truy cập IMDS của node (hop limit 1) để pod không "mượn" node role.`,
  services: ['Amazon EKS', 'EKS Pod Identity', 'IAM'],
  refs: [{ type: 'doc', title: 'Learn how EKS Pod Identity grants pods access to AWS services', url: 'https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html' }]
},
{
  id: 'sap-113',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company's 20 VPCs send all outbound internet traffic through a centralized egress VPC attached to a transit gateway. The egress VPC currently runs a pair of self-managed Squid proxy instances that allow only a list of approved domains (for example, api.partner.com and *.amazonaws.com). The proxies are a single point of failure, need manual patching, and some applications cannot be configured to use an explicit proxy. The company wants managed, highly available outbound filtering by domain name for HTTP and HTTPS traffic without changing applications. Which solution meets these requirements?`,
  options: [
    "Replace the proxies with NAT gateways and use network ACLs in the egress VPC that allow only the IP addresses of the approved domains.",
    "Configure Route 53 Resolver DNS Firewall on the spoke VPCs and allow only approved domains, then remove all inspection from the egress path.",
    "Put the Squid instances in an Auto Scaling group behind a Network Load Balancer and push the proxy settings to every instance with AWS Systems Manager.",
    "Deploy AWS Network Firewall endpoints in each Availability Zone of the egress VPC in front of the NAT gateways, with a stateful domain list rule group that allows the approved domains for HTTP host headers and TLS SNI, and update the transit gateway and subnet route tables."
  ],
  answer: 3,
  explain: `**Từ khoá:** "centralized egress VPC", "allow-list of domains", "Squid single point of failure, patching", "some apps cannot use explicit proxy", "managed, HA, no application change".

**Vì sao D đúng:** **AWS Network Firewall** là firewall managed, tự scale, đặt **firewall endpoint** ở mỗi AZ. Đặt nó trong egress VPC giữa TGW attachment subnet và NAT gateway (route table điều hướng) nên lưu lượng được kiểm tra **trong suốt**, ứng dụng không cần cấu hình proxy. **Stateful domain list rule group** cho phép/ chặn theo tên miền dựa trên **HTTP Host header** và **TLS SNI** (hỗ trợ wildcard như {{.amazonaws.com}}).

**Vì sao các phương án khác sai:**
- **A**: NACL lọc theo IP; IP của domain (đặc biệt CDN, AWS endpoint) thay đổi liên tục và rất nhiều, không duy trì được; NACL tối đa vài chục rule.
- **B**: DNS Firewall chặn **phân giải DNS**, nhưng ứng dụng vẫn có thể kết nối thẳng tới IP; bỏ hết kiểm tra trên đường egress làm yếu bảo mật. DNS Firewall là lớp bổ sung tốt, không thay thế.
- **C**: vẫn tự vận hành Squid (patch, scale) và ứng dụng không hỗ trợ explicit proxy vẫn không dùng được.

> Exam tip: "filter outbound traffic by domain, managed, transparent" → **Network Firewall domain list** trong egress VPC (kèm appliance mode trên TGW attachment). Nhớ thứ tự đường đi: TGW → firewall endpoint → NAT gateway → IGW.`,
  services: ['AWS Network Firewall', 'AWS Transit Gateway', 'NAT gateway'],
  refs: [{ type: 'doc', title: 'Stateful domain list rule groups in AWS Network Firewall', url: 'https://docs.aws.amazon.com/network-firewall/latest/developerguide/stateful-rule-groups-domain-names.html' }]
},
{
  id: 'sap-114',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `An online marketplace stores product listings in Amazon DynamoDB. To support full-text and faceted search, the application code writes each change to DynamoDB and then to an Amazon OpenSearch Service domain. When the second write fails, the search index becomes inconsistent, and engineers run a weekly reindex script that takes 9 hours. The company wants to keep the OpenSearch index in sync with DynamoDB automatically, including an initial backfill, without writing or operating custom replication code. Which solution meets these requirements?`,
  options: [
    "Keep the dual writes but wrap them in a DynamoDB transaction so that both writes succeed or fail together.",
    "Use the DynamoDB zero-ETL integration with Amazon OpenSearch Service through an Amazon OpenSearch Ingestion pipeline that performs an initial export by using point-in-time recovery and then consumes DynamoDB Streams. Remove the dual-write code.",
    "Schedule an AWS Glue job every 15 minutes to scan the DynamoDB table and bulk-load changed items into OpenSearch.",
    "Export the DynamoDB table to Amazon S3 every hour and configure OpenSearch to read the exported files directly."
  ],
  answer: 1,
  explain: `**Từ khoá:** "dual writes inconsistent", "keep index in sync automatically", "initial backfill", "no custom replication code".

**Vì sao B đúng:** **DynamoDB zero-ETL integration với OpenSearch Service** dùng **OpenSearch Ingestion** (pipeline serverless dựa trên Data Prepper). Pipeline làm 2 việc: (1) **initial load** bằng **export to S3** dựa trên **point-in-time recovery** (nên phải bật PITR), (2) đọc **DynamoDB Streams** để đồng bộ gần real time các thay đổi sau đó. Không còn dual-write ở ứng dụng, không cần script reindex.

**Vì sao các phương án khác sai:**
- **A**: DynamoDB transaction chỉ bao các thao tác **trong DynamoDB**; không thể gộp lời gọi tới OpenSearch vào transaction.
- **C**: Glue scan bảng mỗi 15 phút tốn RCU, trễ và vẫn là code ETL tự viết, tự vận hành.
- **D**: OpenSearch không đọc trực tiếp file export trong S3 như một index; và dữ liệu trễ cả giờ.

> Exam tip: "keep a search/analytics store in sync with DynamoDB, no code" → **zero-ETL integration** (OpenSearch; với Redshift cũng có zero-ETL). Muốn tự xử lý thì mô hình kinh điển là **DynamoDB Streams + Lambda**, tránh dual-write.`,
  services: ['Amazon DynamoDB', 'Amazon OpenSearch Service', 'Amazon OpenSearch Ingestion', 'DynamoDB Streams'],
  refs: [{ type: 'doc', title: 'Using an OpenSearch Ingestion pipeline with Amazon DynamoDB', url: 'https://docs.aws.amazon.com/opensearch-service/latest/developerguide/configure-client-ddb.html' }]
},
{
  id: 'sap-115',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company stores 400 TB of IoT telemetry in Amazon S3 as uncompressed CSV files under prefixes such as s3://telemetry/raw/2025/11/03/. Analysts query the data with Amazon Athena, usually filtering on a date range and selecting 5 of 120 columns. Queries take 15 minutes and Athena costs exceed $60,000 per month. New data arrives daily, and the team often forgets to add new partitions. Which combination of actions will MOST improve query performance and reduce cost? (Choose two.)`,
  options: [
    "Move the data to S3 Glacier Instant Retrieval to reduce storage cost.",
    "Increase the number of Athena workgroups so that queries run in parallel across workgroups.",
    "Convert the data to Apache Parquet with Snappy compression by using an AWS Glue ETL job or Athena CTAS/INSERT INTO, keeping the date-based layout.",
    "Define the table with Athena partition projection on the date columns so that Athena computes partitions from the configuration instead of the catalog.",
    "Compress the CSV files with gzip and keep the CSV format."
  ],
  answer: [2, 3],
  multi: true,
  explain: `**Từ khoá:** "uncompressed CSV", "select 5 of 120 columns", "filter by date range", "$60,000/month (pay per TB scanned)", "forget to add partitions".

**Vì sao C và D đúng:**
- **C**: Athena tính phí theo **dữ liệu quét**. **Parquet** là định dạng **cột** có nén: chỉ đọc 5 cột cần thiết, dùng thống kê min/max của row group để bỏ qua dữ liệu (predicate pushdown). Thường giảm dữ liệu quét 90% trở lên, cả chi phí lẫn thời gian.
- **D**: **Partition projection** khai báo trong table properties (kiểu date, khoảng, định dạng, template đường dẫn). Athena tự tính partition từ điều kiện WHERE, **không cần MSCK REPAIR hay crawler** để thêm partition, và tránh gọi Glue catalog cho bảng có rất nhiều partition.

**Vì sao các phương án khác sai:**
- **A**: chỉ giảm chi phí lưu trữ, phí truy xuất Glacier IR cao khi query thường xuyên; không giảm dữ liệu quét.
- **B**: workgroup dùng để tách cấu hình, quota, chi phí; không làm query nhanh hơn hay quét ít hơn.
- **E**: gzip giảm dữ liệu quét nhưng vẫn phải đọc mọi cột, và file gzip không chia nhỏ được để đọc song song; kém xa Parquet.

> Exam tip: tối ưu Athena = **columnar (Parquet/ORC) + nén + partition (projection) + file kích thước hợp lý (~128 MB+)**. Nhiều file nhỏ là kẻ thù số một.`,
  services: ['Amazon Athena', 'AWS Glue', 'Amazon S3'],
  refs: [
    { type: 'doc', title: 'Use partition projection with Amazon Athena', url: 'https://docs.aws.amazon.com/athena/latest/ug/partition-projection.html' },
    { type: 'doc', title: 'Use columnar storage formats', url: 'https://docs.aws.amazon.com/athena/latest/ug/columnar-storage.html' }
  ]
},
{
  id: 'sap-116',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company runs a business-critical Amazon Aurora MySQL cluster (version 2, MySQL 5.7-compatible) that has reached the end of standard support and must be upgraded to Aurora MySQL version 3 (MySQL 8.0-compatible). The application can tolerate at most 1 minute of write downtime. The team wants to test the upgraded database with production data before switching, and to switch back quickly if critical issues are found before the switchover. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Perform an in-place major version upgrade of the production cluster during a maintenance window.",
    "Take a snapshot, restore it to a new Aurora MySQL version 3 cluster, and point the application to the new cluster after testing.",
    "Create an Amazon RDS Blue/Green Deployment for the Aurora cluster, upgrade the green environment to Aurora MySQL version 3, test it, and then perform a switchover.",
    "Use AWS DMS with full load and CDC from the existing cluster to a new Aurora MySQL version 3 cluster, and switch the application connection strings when replication lag is zero."
  ],
  answer: 2,
  explain: `**Từ khoá:** "major version upgrade", "≤ 1 minute write downtime", "test with production data before switching", "LEAST overhead".

**Vì sao C đúng:** **RDS Blue/Green Deployments** (hỗ trợ Aurora MySQL, Aurora PostgreSQL, RDS) tạo một môi trường **green** là bản sao của **blue** (production), giữ đồng bộ bằng **logical replication** (binlog với MySQL). Bạn nâng cấp major version trên green, test với dữ liệu thật. **Switchover** có guardrail (kiểm tra replication lag, chặn ghi), đổi tên endpoint để green nhận đúng endpoint cũ, ứng dụng không phải đổi connection string, downtime thường **dưới một phút**. Trước khi switchover, blue không bị ảnh hưởng.

**Vì sao các phương án khác sai:**
- **A**: in-place upgrade gây downtime nhiều phút tới hàng chục phút và không cho test trước trên bản sao; khó quay lại.
- **B**: snapshot/restore mất dữ liệu ghi sau thời điểm snapshot, và cutover phải đổi endpoint thủ công.
- **D**: DMS làm được nhưng phải dựng replication instance, task, xử lý chênh lệch kiểu dữ liệu, đổi connection string; overhead cao hơn nhiều.

> Exam tip: "minimal downtime major upgrade / schema change, test before cutover" → **Blue/Green Deployments**. Sau switchover, blue cũ được đổi tên với hậu tố {{-old1}} và không tự xoá.`,
  services: ['Amazon Aurora', 'RDS Blue/Green Deployments'],
  refs: [{ type: 'doc', title: 'Using Amazon Aurora Blue/Green Deployments', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/blue-green-deployments.html' }]
},
{
  id: 'sap-117',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company is migrating 30 on-premises PostgreSQL 15 databases (50 GB to 2 TB each) to Amazon RDS for PostgreSQL with the same major version. Each database must stay online during migration with ongoing replication until cutover. The database team prefers native PostgreSQL tools for the best fidelity, but does not want to provision, size, or patch replication servers. The data center connects to AWS over AWS Direct Connect. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Use AWS DMS homogeneous data migrations: create data providers for the source and target, an instance profile in the VPC, and a migration project, then run full load and ongoing replication data migrations, which use native PostgreSQL tooling on serverless capacity.",
    "Use AWS SCT to convert the schemas, then create AWS DMS replication instances sized for each database and run full load and CDC tasks.",
    "Run pg_dump on premises for each database, copy the dump files to Amazon S3, and restore them with pg_restore during a weekend outage.",
    "Order AWS Snowball Edge devices to copy the database files and start the RDS instances from the copied data directories."
  ],
  answer: 0,
  explain: `**Từ khoá:** "same engine and version (homogeneous)", "online, ongoing replication until cutover", "native PostgreSQL tools", "no replication servers to provision or patch".

**Vì sao A đúng:** **AWS DMS homogeneous data migrations** dành cho chuyển dữ liệu **cùng engine** (PostgreSQL, MySQL/MariaDB, MongoDB/DocumentDB) sang RDS/Aurora tương ứng. Nó dùng **công cụ native** của engine (như pg_dump/pg_restore và logical replication với PostgreSQL) nên giữ được đầy đủ đối tượng, và chạy trên **hạ tầng serverless** do DMS quản lý: không phải chọn kích thước hay patch replication instance. Bạn chỉ định nghĩa **data provider**, **instance profile** (VPC, subnet), **migration project**, rồi chạy kiểu **full load + change data capture**.

**Vì sao các phương án khác sai:**
- **B**: SCT dùng cho **heterogeneous** (đổi engine), ở đây thừa; DMS replication instance cổ điển phải sizing, theo dõi, nâng cấp cho 30 DB, overhead cao hơn.
- **C**: dump/restore cuối tuần là offline migration, vi phạm yêu cầu online, và DB 2 TB có thể không xong trong cửa sổ.
- **D**: RDS không cho khởi động từ data directory copy vào; Snowball không cần với Direct Connect sẵn có.

> Exam tip: same engine → DMS homogeneous data migrations hoặc native replication; khác engine → **DMS Schema Conversion/SCT + DMS**. DMS Serverless (cổ điển) cũng giảm sizing, nhưng "native tools" là dấu hiệu của homogeneous data migrations.`,
  services: ['AWS DMS', 'Amazon RDS', 'AWS Direct Connect'],
  refs: [{ type: 'doc', title: 'Homogeneous data migrations in AWS DMS', url: 'https://docs.aws.amazon.com/dms/latest/userguide/data-migrations.html' }]
},
{
  id: 'sap-118',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company is rehosting 450 Windows and Linux servers to AWS with AWS Application Migration Service (AWS MGN) over 8 waves. After each cutover, engineers spend hours manually installing the Amazon CloudWatch agent, running a company hardening script, validating free disk space, and checking that the application responds on its HTTP port. These steps are often skipped under time pressure. The company wants these steps to run automatically and consistently on every launched test and cutover instance. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create an AWS Lambda function triggered by EC2 RunInstances events that connects to each new instance over SSH or WinRM to run the steps.",
    "Bake the CloudWatch agent and hardening script into a custom AMI and launch all migrated servers from that AMI instead of the MGN launch template.",
    "Add the steps to each server's on-premises startup scripts before replication so that they run after the server boots in AWS.",
    "Configure AWS MGN post-launch actions in the launch settings template: enable the Systems Manager agent installation, add the built-in actions for the CloudWatch agent, disk space validation, and HTTP response validation, and add a custom action that runs the hardening script as a Systems Manager document."
  ],
  answer: 3,
  explain: `**Từ khoá:** "AWS MGN", "after each cutover … manually", "run automatically and consistently on every test and cutover instance", "LEAST overhead".

**Vì sao D đúng:** **MGN post-launch actions** chạy tự động sau khi instance test hoặc cutover được launch, dùng **AWS Systems Manager** (MGN cài SSM agent lên instance). Có các **predefined action** sẵn như cài **CloudWatch agent**, **validate disk space**, **verify HTTP(S) response**, cài DRS agent, tạo AMI…, và **custom action** chạy bất kỳ **SSM document** nào (script hardening). Cấu hình ở **template mặc định** để áp cho mọi server mới, theo dõi trạng thái từng action trong console MGN.

**Vì sao các phương án khác sai:**
- **A**: Lambda SSH/WinRM vào từng máy cần quản lý credential, mạng, xử lý lỗi; tự xây lại thứ MGN đã có.
- **B**: MGN tái tạo **chính ổ đĩa** của server nguồn; không thể launch server đã migrate từ AMI chung mà giữ được dữ liệu và cấu hình.
- **C**: sửa script trên máy nguồn rủi ro, phụ thuộc OS, khó kiểm chứng, không có báo cáo kết quả tập trung.

> Exam tip: "automate tasks after MGN launch (agents, validation, custom scripts)" → **post-launch actions** (SSM documents). Chuyển đổi hạ tầng lúc launch (instance type, subnet, license) → launch template / launch settings.`,
  services: ['AWS Application Migration Service', 'AWS Systems Manager', 'Amazon CloudWatch'],
  refs: [{ type: 'doc', title: 'Post-launch settings in AWS MGN', url: 'https://docs.aws.amazon.com/mgn/latest/ug/post-launch-settings.html' }]
},
{
  id: 'sap-119',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company has completed discovery of 1,100 servers and 180 applications and must migrate them to AWS within 12 months. Network dependency data shows that many applications share databases and call each other synchronously with low-latency requirements. The migration team has never migrated a production workload to AWS. Which wave-planning practices should a solutions architect recommend? (Choose two.)`,
  options: [
    "Start with a pilot wave of a few low-complexity, low-criticality applications to validate the tooling, runbooks, landing zone, and team roles before scaling up.",
    "Migrate the most critical and complex ERP system in the first wave to demonstrate value to leadership quickly.",
    "Assign each server to a wave based only on its operating system so that each wave uses a single migration tool.",
    "Split tightly coupled applications across different waves so that each wave contains as few servers as possible.",
    "Group applications that share databases or have latency-sensitive synchronous dependencies into the same wave (move groups), using the dependency data from discovery."
  ],
  answer: [0, 4],
  multi: true,
  explain: `**Từ khoá:** "1,100 servers, 12 months", "shared databases, synchronous low-latency calls", "team has never migrated production".

**Vì sao A và E đúng:**
- **A**: **pilot wave** với ứng dụng đơn giản, ít quan trọng giúp kiểm chứng công cụ (MGN, DMS), runbook cutover, quy trình rollback, landing zone, phân vai; rút kinh nghiệm rồi mới tăng tốc theo mô hình **migration factory** (sóng sau lớn dần).
- **E**: dùng **dependency mapping** để gom ứng dụng phụ thuộc chặt (dùng chung DB, gọi đồng bộ cần độ trễ thấp) thành **move group** và chuyển cùng một sóng. Nếu tách ra, lưu lượng giữa on-premises và AWS qua Direct Connect/VPN sẽ tăng độ trễ, gây lỗi hoặc chậm trong thời gian hybrid.

**Vì sao các phương án khác sai:**
- **B**: đưa hệ thống phức tạp nhất vào sóng đầu khi đội chưa có kinh nghiệm là rủi ro cao nhất; nếu thất bại sẽ mất niềm tin của lãnh đạo.
- **C**: chia sóng theo hệ điều hành bỏ qua phụ thuộc nghiệp vụ, làm vỡ các nhóm ứng dụng liên quan.
- **D**: tách ứng dụng gắn chặt qua các sóng khác nhau gây vấn đề độ trễ và cutover phức tạp, ngược với best practice.

> Exam tip: wave planning = **pilot trước**, **gom theo phụ thuộc**, ưu tiên theo giá trị nghiệp vụ/độ phức tạp, sóng sau lớn dần, mỗi sóng có runbook và tiêu chí rollback rõ ràng.`,
  services: ['AWS Application Migration Service', 'AWS Application Discovery Service']
},
{
  id: 'sap-120',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company is migrating an on-premises Microsoft SQL Server database that supports a legacy ERP application. The vendor-supported configuration requires installing a third-party monitoring agent and a custom driver on the database server operating system, and occasionally requires sysadmin-level access for upgrades. The company wants AWS to handle automated backups, point-in-time recovery, and Multi-AZ high availability as much as possible. Which solution meets these requirements?`,
  options: [
    "Migrate to Amazon RDS for SQL Server and install the agent and driver through an RDS option group.",
    "Migrate to Amazon RDS Custom for SQL Server, install the agent and driver on the host, and use the automated backups and supported high-availability features of RDS Custom.",
    "Migrate to Amazon Aurora PostgreSQL with Babelfish so that the ERP application can keep using T-SQL.",
    "Migrate to SQL Server on Amazon EC2 and build backups with custom scripts that copy native backups to Amazon S3."
  ],
  answer: 1,
  explain: `**Từ khoá:** "install third-party agent and custom driver on the OS", "sysadmin-level access", "AWS handles backups, PITR, HA as much as possible", "vendor-supported".

**Vì sao B đúng:** **RDS Custom** (cho SQL Server và Oracle) là mô hình **managed nhưng cho phép tuỳ biến**: bạn được truy cập **hệ điều hành và quyền đặc quyền của database** (RDP/SSM vào host, cài agent, driver, patch tuỳ ý theo yêu cầu vendor), trong khi RDS vẫn lo **automated backup, point-in-time recovery**, giám sát, và có tuỳ chọn **Multi-AZ**. Có thể tạm dừng automation (pause) khi bạn tuỳ biến, sau đó bật lại.

**Vì sao các phương án khác sai:**
- **A**: RDS for SQL Server thường **không cho truy cập OS** hay quyền sysadmin; option group chỉ có các tính năng AWS hỗ trợ sẵn, không cài được agent tuỳ ý.
- **C**: Babelfish không tương thích 100% T-SQL, ứng dụng ERP của vendor có thể không được hỗ trợ; đổi engine là refactor lớn, không phải yêu cầu.
- **D**: EC2 đáp ứng được quyền truy cập nhưng mọi việc backup, PITR, HA phải tự làm, trái với "AWS handles as much as possible".

> Exam tip: "needs OS/privileged access **and** managed backups" → **RDS Custom**. Không cần OS → RDS; cần toàn quyền và tự quản → EC2.`,
  services: ['Amazon RDS Custom', 'Microsoft SQL Server'],
  refs: [{ type: 'doc', title: 'Working with Amazon RDS Custom', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-custom.html' }]
},
{
  id: 'sap-121',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A law firm is migrating 80 TB of documents from six on-premises Windows file servers to AWS. Users access the shares through a DFS Namespace, and access is controlled by NTFS permissions on Active Directory groups. The firm will keep its on-premises Active Directory, which is extended to AWS. After migration, users must keep using the same UNC paths, permissions must be preserved, and the file service must be highly available across Availability Zones. Data must be copied incrementally before a final cutover. Which solution meets these requirements?`,
  options: [
    "Create Amazon EFS file systems, mount them on Windows clients, and copy the data with Robocopy.",
    "Deploy an Amazon S3 File Gateway in AWS, join it to Active Directory, and copy the data to S3 with the AWS CLI.",
    "Create Amazon FSx for Windows File Server Multi-AZ file systems joined to the self-managed Active Directory, use AWS DataSync to copy the data incrementally while preserving NTFS ACLs, and add the FSx shares as folder targets in the existing DFS Namespace.",
    "Launch Windows Server EC2 instances in two Availability Zones with EBS volumes and configure DFS Replication between them."
  ],
  answer: 2,
  explain: `**Từ khoá:** "Windows file servers", "DFS Namespace", "NTFS permissions, AD", "same UNC paths", "Multi-AZ", "incremental copy before cutover".

**Vì sao C đúng:** **FSx for Windows File Server** là file server Windows managed: SMB, **NTFS ACL**, join **AWS Managed Microsoft AD hoặc AD tự quản** (on-premises mở rộng), hỗ trợ **DFS Namespaces** (đặt share FSx làm folder target để giữ nguyên UNC path), và **Multi-AZ** với failover tự động. **AWS DataSync** copy qua SMB, **giữ metadata và NTFS ACL**, chạy nhiều lần chỉ chép phần thay đổi, phù hợp cutover cuối.

**Vì sao các phương án khác sai:**
- **A**: EFS là NFS cho Linux, không hỗ trợ Windows client/SMB hay NTFS ACL.
- **B**: S3 File Gateway đặt tài liệu thành object S3, quyền NTFS chỉ được giả lập hạn chế, không phải file server Windows Multi-AZ; copy qua CLI mất ACL.
- **D**: tự dựng Windows trên EC2 + DFS-R là phải tự vận hành (patch, backup, failover); DFS-R không phải HA đồng bộ.

> Exam tip: "Windows file shares, AD, NTFS ACL, DFS" → **FSx for Windows File Server**; công cụ di chuyển → **DataSync** (hoặc Robocopy). Cần thêm NFS song song → FSx for ONTAP.`,
  services: ['Amazon FSx for Windows File Server', 'AWS DataSync', 'Active Directory'],
  refs: [
    { type: 'doc', title: 'What is FSx for Windows File Server?', url: 'https://docs.aws.amazon.com/fsx/latest/WindowsGuide/what-is.html' },
    { type: 'doc', title: 'Migrating files to FSx for Windows File Server using DataSync', url: 'https://docs.aws.amazon.com/fsx/latest/WindowsGuide/migrate-files-to-fsx-datasync.html' }
  ]
},
{
  id: 'sap-122',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A manufacturing company backs up 300 TB per month with an existing enterprise backup application that writes to a physical tape library. Tapes are shipped to an offsite vault, and restores of old tapes take days. The company wants to eliminate the physical tape infrastructure, keep its backup application and existing backup jobs unchanged, and store long-term retention copies at the lowest possible cost on AWS. Which solution meets these requirements?`,
  options: [
    "Deploy AWS Storage Gateway as a Tape Gateway on premises, connect the backup application to the virtual tape library over iSCSI, and archive ejected virtual tapes to S3 Glacier Deep Archive.",
    "Deploy an Amazon S3 File Gateway and reconfigure the backup application to write backup files to an SMB share.",
    "Use AWS Backup to back up the on-premises servers directly and store the recovery points in a vault with a cold storage lifecycle.",
    "Ship the existing physical tapes to AWS with AWS Snowball Edge every month and import them into Amazon S3."
  ],
  answer: 0,
  explain: `**Từ khoá:** "existing enterprise backup application", "physical tape library", "keep backup jobs unchanged", "eliminate tapes", "lowest cost long-term".

**Vì sao A đúng:** **Tape Gateway** (một loại AWS Storage Gateway) giả lập một **virtual tape library (VTL)** qua **iSCSI**: ổ băng, media changer, tape ảo. Các phần mềm backup lớn (Veeam, Commvault, Veritas NetBackup…) đã được kiểm chứng tương thích, nên job backup gần như không đổi. Tape ảo đang dùng lưu trên S3; khi **eject/archive**, tape chuyển vào **S3 Glacier Flexible Retrieval** hoặc **S3 Glacier Deep Archive** (rẻ nhất). Gateway có cache cục bộ cho tốc độ ghi.

**Vì sao các phương án khác sai:**
- **B**: S3 File Gateway yêu cầu đổi đích backup sang file share, tức là **thay đổi job**; vẫn làm được nhưng vi phạm "unchanged".
- **C**: AWS Backup không thay phần mềm backup doanh nghiệp đang dùng và không backup trực tiếp mọi loại máy on-premises như vậy; đổi hẳn công cụ.
- **D**: Snowball Edge không đọc băng từ vật lý; và đây không phải giải pháp liên tục hằng tháng.

> Exam tip: "replace physical tapes, keep backup software" → **Tape Gateway** + Glacier Deep Archive. "SMB/NFS file share backed by S3" → S3 File Gateway. "Block storage iSCSI cho ứng dụng" → Volume Gateway.`,
  services: ['AWS Storage Gateway', 'Tape Gateway', 'S3 Glacier Deep Archive'],
  refs: [{ type: 'doc', title: 'What is Tape Gateway?', url: 'https://docs.aws.amazon.com/storagegateway/latest/tgw/WhatIsStorageGateway.html' }]
},
{
  id: 'sap-123',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `As part of a data center exit, a company must move 70 Java batch jobs that currently run as cron jobs on two always-on Linux VMs. The jobs run on different schedules (hourly to monthly), each takes between 5 minutes and 3 hours, needs 2 to 8 GB of memory, and reads and writes data in Amazon S3 and Amazon RDS. The company wants to stop paying for idle servers, avoid managing operating systems, and get automatic retries and centralized logs. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Rewrite each job as an AWS Lambda function and trigger it with an Amazon EventBridge schedule.",
    "Migrate the two VMs to Amazon EC2 with AWS Application Migration Service and keep the cron configuration.",
    "Run the jobs on an Amazon EMR cluster that is always on and use Apache Oozie to schedule them.",
    "Containerize each job, push the images to Amazon ECR, and run them as Amazon ECS tasks on AWS Fargate triggered by Amazon EventBridge Scheduler schedules, with retry policies, a dead-letter queue, and logs sent to Amazon CloudWatch Logs."
  ],
  answer: 3,
  explain: `**Từ khoá:** "cron jobs on always-on VMs", "5 minutes to 3 hours", "2–8 GB", "stop paying for idle", "no OS management", "retries, centralized logs".

**Vì sao D đúng:** Đóng gói từng job thành container và chạy **ECS task trên Fargate**: chỉ trả tiền khi task chạy, không có server để patch, không giới hạn 15 phút, chọn CPU/memory theo từng job. **EventBridge Scheduler** gọi trực tiếp **ECS RunTask** theo cron/rate với time zone, có **retry policy** và **dead-letter queue**. Log container đi vào **CloudWatch Logs** qua awslogs driver. (AWS Batch trên Fargate cũng là lựa chọn hợp lý khi cần hàng đợi và phụ thuộc job.)

**Vì sao các phương án khác sai:**
- **A**: Lambda giới hạn **15 phút** mỗi lần chạy; job tới 3 giờ không chạy được nếu không viết lại thành nhiều bước.
- **B**: rehost lên EC2 vẫn trả tiền máy chạy 24/7 và vẫn phải quản lý OS, cron không có retry/DLQ tập trung.
- **C**: cluster EMR luôn bật là đắt và không phải nền tảng cho job Java nghiệp vụ thông thường; Oozie phải tự vận hành.

> Exam tip: "batch/cron job > 15 minutes, serverless" → **ECS on Fargate (hoặc AWS Batch) + EventBridge Scheduler**. ≤ 15 phút và nhẹ → Lambda. Chuỗi bước có điều kiện → Step Functions gọi ECS task.`,
  services: ['Amazon ECS', 'AWS Fargate', 'Amazon EventBridge Scheduler', 'Amazon ECR', 'Amazon CloudWatch Logs'],
  refs: [{ type: 'doc', title: 'Amazon ECS scheduled tasks', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/scheduling_tasks.html' }]
},
{
  id: 'sap-124',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company is migrating 120 Windows Server VMs that run Microsoft SQL Server Enterprise. The company owns Windows Server Datacenter and SQL Server licenses that are licensed per physical core and are not eligible for License Mobility, and it wants to bring these licenses to AWS to avoid paying for license-included instances. The company must track license usage to stay compliant and wants AWS to manage host capacity, such as allocating hosts and placing instances, as much as possible. Which combination of steps meets these requirements? (Choose two.)`,
  options: [
    "Launch the instances as license-included Windows Server and SQL Server On-Demand instances on shared tenancy.",
    "Use Amazon EC2 Dedicated Hosts so that the licenses are applied to physical cores and sockets that are visible to the company.",
    "Create AWS License Manager license configurations for the Windows Server and SQL Server licenses, and use a License Manager host resource group to automatically allocate and manage Dedicated Hosts and launch instances onto them.",
    "Launch the instances as Dedicated Instances, which provide visibility into the physical cores of the underlying host.",
    "Purchase Compute Savings Plans to cover the license cost of Windows Server and SQL Server."
  ],
  answer: [1, 2],
  multi: true,
  explain: `**Từ khoá:** "BYOL licensed per physical core", "not eligible for License Mobility", "track license usage", "AWS manages host capacity as much as possible".

**Vì sao B và C đúng:**
- **B**: **Dedicated Hosts** là máy chủ vật lý dành riêng cho bạn, **hiển thị số socket và physical core**, cho phép dùng giấy phép tính theo socket/core và giấy phép không có License Mobility (theo điều khoản của Microsoft, thường áp với giấy phép mua trước 1/10/2019 và chưa nâng cấp). Instance cũng ở lại trên host cố định nếu dùng host affinity.
- **C**: **AWS License Manager** theo dõi việc dùng giấy phép theo **license configuration** (vCPU, core, socket, instance) và có thể chặn launch khi vượt. **Host resource group** để License Manager tự **cấp phát, giải phóng Dedicated Host** và đặt instance lên host, giảm việc quản lý capacity thủ công.

**Vì sao các phương án khác sai:**
- **A**: license-included nghĩa là trả tiền giấy phép trong giá instance, trái mục tiêu BYOL.
- **D**: **Dedicated Instances** chạy trên phần cứng dành riêng cho account nhưng **không cho thấy socket/core** và không có host affinity, nên không đáp ứng giấy phép theo core vật lý.
- **E**: Savings Plans chỉ giảm phí compute, không trả phí giấy phép bên thứ ba và không thay thế BYOL.

> Exam tip: "BYOL per-socket/per-core, compliance" → **Dedicated Hosts + License Manager (host resource groups)**. Dedicated Instance ≠ Dedicated Host.`,
  services: ['Amazon EC2 Dedicated Hosts', 'AWS License Manager', 'Microsoft SQL Server'],
  refs: [
    { type: 'doc', title: 'Amazon EC2 Dedicated Hosts', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dedicated-hosts-overview.html' },
    { type: 'doc', title: 'Host resource groups in License Manager', url: 'https://docs.aws.amazon.com/license-manager/latest/userguide/host-resource-groups.html' }
  ]
},
{
  id: 'sap-125',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company is migrating a set of Java EE order-processing applications to AWS within 3 months. The applications exchange messages through an on-premises Apache ActiveMQ broker by using JMS with queues, topics, and durable subscriptions over the OpenWire protocol. The team has no time to rewrite messaging code, and the broker must be highly available across Availability Zones. Operations staff want to stop patching and managing the broker servers. Which solution meets these requirements?`,
  options: [
    "Replace the broker with Amazon SQS queues and Amazon SNS topics, and update the applications to use the AWS SDK.",
    "Migrate to Amazon MQ for ActiveMQ with an active/standby broker deployment across two Availability Zones, and update the applications' broker connection URLs.",
    "Rehost the ActiveMQ servers on Amazon EC2 instances in an Auto Scaling group across two Availability Zones with Amazon EBS storage.",
    "Replace the broker with Amazon MSK and use a Kafka JMS client library in the applications."
  ],
  answer: 1,
  explain: `**Từ khoá:** "JMS, ActiveMQ, OpenWire, durable subscriptions", "no time to rewrite messaging code", "HA across AZs", "stop patching broker servers".

**Vì sao B đúng:** **Amazon MQ** là message broker managed cho **Apache ActiveMQ** và **RabbitMQ**, hỗ trợ giao thức chuẩn (**JMS/OpenWire**, AMQP, STOMP, MQTT, WebSocket). Ứng dụng chỉ cần đổi **broker URL** (failover transport), giữ nguyên code JMS, queue, topic, durable subscription. Kiểu **active/standby** đặt hai broker ở hai AZ dùng chung lưu trữ (Amazon EFS) với failover tự động. AWS lo patch, nâng cấp phiên bản trong maintenance window.

**Vì sao các phương án khác sai:**
- **A**: SQS/SNS là dịch vụ cloud-native rất tốt nhưng **không hỗ trợ JMS/OpenWire** như broker, phải viết lại code nhắn tin, không kịp 3 tháng.
- **C**: rehost lên EC2 vẫn phải patch và tự vận hành broker, HA phải tự cấu hình (shared storage, failover).
- **D**: Kafka có mô hình log/consumer group khác JMS; chuyển sang là refactor lớn, không có "drop-in".

> Exam tip: "existing apps use JMS/AMQP/MQTT with ActiveMQ or RabbitMQ, migrate quickly" → **Amazon MQ**. Ứng dụng mới, cần scale gần như vô hạn → SQS/SNS/EventBridge.`,
  services: ['Amazon MQ', 'Apache ActiveMQ', 'Amazon EFS'],
  refs: [{ type: 'doc', title: 'What is Amazon MQ?', url: 'https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/welcome.html' }]
},
{
  id: 'sap-126',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company runs a self-managed Apache Cassandra 3.11 cluster of 36 nodes in its data center for a time-series application written with the DataStax Java driver and CQL. The operations team spends significant time on node repairs, compaction tuning, and capacity planning, and the cluster must move to AWS as part of a data center exit. The company wants a serverless, highly available service that requires minimal application code changes. Which solution meets these requirements?`,
  options: [
    "Migrate to Amazon DynamoDB and rewrite the data access layer with the DynamoDB Enhanced Client.",
    "Rehost the Cassandra cluster on Amazon EC2 instances with AWS Application Migration Service across three Availability Zones.",
    "Migrate to Amazon Keyspaces (for Apache Cassandra), keep the CQL code and the DataStax Java driver with the required TLS and authentication settings, and load the data with a supported migration approach such as AWS Glue or cqlsh COPY.",
    "Migrate to Amazon DocumentDB and translate the CQL queries to the MongoDB API."
  ],
  answer: 2,
  explain: `**Từ khoá:** "Apache Cassandra, CQL, DataStax Java driver", "repairs, compaction, capacity planning", "serverless, HA", "minimal code changes".

**Vì sao C đúng:** **Amazon Keyspaces (for Apache Cassandra)** là dịch vụ **serverless**, **tương thích CQL** (API Cassandra 3.11), dùng được các driver Cassandra hiện có (chỉ cần cấu hình **TLS**, endpoint và **xác thực** bằng SigV4 plugin hoặc service-specific credential). AWS lo replication **3 bản trên nhiều AZ**, không còn repair, compaction, hay thêm node; capacity theo **on-demand** hoặc **provisioned** có auto scaling. Dữ liệu có thể nạp bằng **cqlsh COPY**, AWS Glue, hoặc ghi song song (dual write) để chuyển online.

**Vì sao các phương án khác sai:**
- **A**: DynamoDB là serverless nhưng **không hiểu CQL**; phải viết lại toàn bộ tầng truy cập dữ liệu.
- **B**: rehost trên EC2 vẫn giữ nguyên gánh nặng vận hành (repair, compaction, sizing).
- **D**: DocumentDB là tài liệu tương thích MongoDB, không phải Cassandra; phải dịch truy vấn và mô hình dữ liệu.

> Exam tip: "Cassandra/CQL → managed, minimal change" → **Keyspaces**. MongoDB → DocumentDB. Redis → ElastiCache/MemoryDB. Kafka → MSK. ActiveMQ/RabbitMQ → Amazon MQ. Bảng "engine tương thích" này xuất hiện rất nhiều trong domain 4.`,
  services: ['Amazon Keyspaces', 'Apache Cassandra', 'AWS Glue'],
  refs: [{ type: 'doc', title: 'What is Amazon Keyspaces (for Apache Cassandra)?', url: 'https://docs.aws.amazon.com/keyspaces/latest/devguide/what-is-keyspaces.html' }]
}
);
