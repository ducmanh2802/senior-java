/* AWS Pro track: exam-style questions (docs/AWS-TRACK.md), sap-127..sap-156 (SAP-C02, domains sap-d1..sap-d4). */
/* Reviewed in T575: answers fact-checked, explanations expanded, duplicate scenarios replaced. */
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'sap-127', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 15 AWS accounts in AWS Organizations and an existing on-premises Active Directory forest. About 300 Windows Server EC2 instances in the workload accounts must be joined to a domain and must authenticate with Active Directory. The company wants a highly available directory in AWS that trusts the on-premises forest, does not want to deploy or patch domain controllers, and must prevent application teams from changing directory objects. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Deploy two domain controller EC2 instances in a shared services VPC, join them to the on-premises forest, and give every workload account VPC peering access to the domain controllers.",
    "Create AWS Managed Microsoft AD in a shared services account, create a two-way forest trust with the on-premises forest, and share the directory with the workload accounts by using AWS Resource Access Manager (AWS RAM).",
    "Create an AD Connector in each workload account, point it at the on-premises domain controllers over AWS Direct Connect, and join instances with it.",
    "Create a Simple AD directory in each workload account and configure a trust with the on-premises forest."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Tạo **AWS Managed Microsoft AD** ở shared services account, lập **forest trust** hai chiều với AD on-prem, rồi chia sẻ directory cho 15 workload account bằng **AWS RAM**. Account được share chỉ join máy và xác thực; quyền quản trị object vẫn nằm ở account sở hữu directory.

**Từ khoá:** "domain-joined", "trusts the on-premises forest", "do not deploy or patch domain controllers", "teams must not change directory objects" → Managed Microsoft AD + directory sharing qua RAM.

**Thuật ngữ:**
- **Active Directory (AD):** thư mục tập trung lưu user, group, computer; hiểu đơn giản là "danh bạ nhân sự và thiết bị" dùng cho đăng nhập và phân quyền.
- **Domain join:** gắn máy Windows vào domain để nó dùng tài khoản AD và nhận Group Policy, thay vì chỉ có tài khoản local trên máy.
- **Forest trust:** quan hệ tin cậy giữa hai rừng AD, cho user ở rừng này đăng nhập vào tài nguyên ở rừng kia.
- **AWS Managed Microsoft AD:** AD thật do AWS vận hành; AWS tạo hai domain controller ở hai AZ, lo vá, backup và nhân bản.
- **AWS RAM:** dịch vụ chia sẻ tài nguyên giữa các account, ở đây là chia sẻ directory mà không copy.

### Cơ chế hoạt động
1. Tạo Managed Microsoft AD trong VPC của shared services account. AWS sinh hai domain controller ở hai AZ và cấp hai địa chỉ DNS private.
2. Tạo **two-way forest trust** với AD on-prem. Cần DNS phân giải chéo: on-prem forward vùng tên của AWS sang DNS của directory, còn Route 53 Resolver trong VPC forward vùng tên on-prem về DNS nội bộ.
3. Chia sẻ directory qua RAM cho organization hoặc từng workload account. Account nhận share thấy directory và dùng được cho domain join, nhưng không có quyền Directory Service admin.
4. EC2 trong workload account join domain qua DNS của directory; user on-prem đăng nhập được nhờ trust; team ứng dụng không sửa được object.

### Ví dụ cụ thể
15 account, 300 EC2. Mỗi VPC workload nối về shared services VPC bằng Transit Gateway. Khi một EC2 chạy lệnh join domain, nó hỏi DNS "domain controller ở đâu?" và nhận hai IP private của directory. Nếu thiếu đường mạng hoặc DNS trỏ sai, lệnh join timeout dù directory đã được share.

### Vì sao B đúng
- Managed Microsoft AD đáp ứng đồng thời "HA", "trust on-prem" và "không tự dựng/patch DC".
- Directory sharing qua RAM cho phép nhiều account dùng chung một directory, giảm 15 bản sao quản trị.
- Chỉ account sở hữu directory quản trị object; workload account chỉ dùng để join và xác thực.

### Lỗi hay gặp
- **Share directory không kèm kết nối mạng:** RAM chỉ chia sẻ quyền truy cập tài nguyên, không tạo đường mạng. Vẫn cần peering hoặc Transit Gateway giữa VPC workload và VPC chứa directory.
- **Cấp nhầm quyền admin:** chia sẻ directory khác với cấp quyền quản trị. Muốn team không sửa object thì chỉ share directory, không giao vai trò quản trị.

### Vì sao các phương án khác sai
- **A:** tự dựng domain controller trên EC2 nghĩa là tự vá, tự backup, tự làm HA — vi phạm yêu cầu "không deploy/patch domain controller".
- **C:** AD Connector chỉ **proxy** xác thực về DC on-prem, không phải directory HA chứa object trong AWS và không tạo forest trust. Nó còn phụ thuộc liên tục vào DC và đường kết nối on-prem.
- **D:** Simple AD là directory nhẹ dựa trên Samba, thiếu tính năng AD đầy đủ và không có mô hình chia sẻ phù hợp; tạo ở từng account còn nhân bản việc quản trị.

> Exam tip: "domain join + trust on-prem + managed" → Managed Microsoft AD. "Chỉ xác thực với AD on-prem, không cần object trong AWS" → AD Connector. Nhiều account dùng chung directory → AWS RAM, nhưng nhớ vẫn phải nối mạng và DNS.`,
  services: ['AWS Directory Service', 'AWS Managed Microsoft AD', 'AWS RAM'],
},
{
  id: 'sap-128', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 1,200 contractors who need access to several internal web applications that run in 12 VPCs across three AWS accounts. Access is provided today by an AWS Client VPN endpoint, and the security team finds per-subnet authorization rules hard to manage. The company wants authorization per application based on the user's group in the identity provider and on device posture reported by its supported endpoint management tool, without distributing VPN profiles and without exposing the applications to the internet. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Keep AWS Client VPN with SAML authentication and create one authorization rule per subnet and per user group.",
    "Publish each application through an internet-facing Application Load Balancer and write AWS WAF rules that match user groups.",
    "Use AWS Verified Access with an identity trust provider, a device trust provider, and one Verified Access group and access policy per application.",
    "Place a bastion host in a public subnet and require contractors to use SSH port forwarding to reach each application."
  ],
  answer: 2,
  explain: `**Tóm tắt:** Dùng **AWS Verified Access**: mỗi ứng dụng có endpoint riêng, policy kiểm tra **nhóm user** từ identity provider và **tình trạng thiết bị** từ device trust provider. Người dùng mở trình duyệt là vào được, không cần VPN client và ứng dụng không phải public.

**Từ khoá:** "per-application authorization", "user group + device posture", "without VPN profiles", "without exposing applications to the internet" → Verified Access.

**Thuật ngữ:**
- **Zero trust:** mô hình không tin ai mặc định; mỗi request đều bị kiểm tra danh tính và điều kiện thiết bị trước khi cho vào.
- **Trust provider:** nguồn tín hiệu để ra quyết định. Identity trust provider cung cấp user và group; device trust provider cung cấp tình trạng máy (đã quản lý, hợp lệ, mã hoá ổ đĩa…).
- **Cedar:** ngôn ngữ policy mà Verified Access dùng để viết luật allow/deny theo thuộc tính.
- **Verified Access endpoint:** "cửa vào" của một ứng dụng, thường trỏ tới một internal Application Load Balancer hoặc Network Load Balancer.

### Cơ chế hoạt động
1. Người dùng mở URL của ứng dụng. Request đi tới Verified Access endpoint qua HTTPS, không cần cài VPN.
2. Verified Access lấy thông tin danh tính từ identity trust provider (ví dụ group "contractors") và thông tin thiết bị từ device trust provider.
3. Cedar policy của endpoint quyết định cho qua hay chặn. Ví dụ: chỉ cho group contractors khi thiết bị đã được quản lý và compliant.
4. Nếu hợp lệ, traffic được chuyển tiếp qua mạng private tới ALB nội bộ của ứng dụng. Ứng dụng không cần public và không cần biết user đến từ đâu.

### Ví dụ cụ thể
12 ứng dụng, mỗi ứng dụng một endpoint và một group policy. Contractor thuộc group "finance-contractors" chỉ vào được ứng dụng tài chính; nếu laptop chưa cài agent quản lý thiết bị, request bị từ chối ngay tại cửa vào, không tới được ALB.

### Vì sao C đúng
- Authorization theo **ứng dụng** chứ không theo subnet, đúng yêu cầu của security team.
- Kết hợp được cả danh tính và device posture trong cùng một policy.
- Không phát hành VPN profile, không mở ứng dụng ra internet.
- Dịch vụ do AWS quản lý, không phải tự dựng reverse proxy hay zero-trust gateway.

### Lỗi hay gặp
- Verified Access dành cho ứng dụng **HTTP/HTTPS**; không dùng để thay thế VPN cho SSH, RDP hay giao thức TCP tuỳ ý.
- Device trust provider phải là nhà cung cấp được hỗ trợ và agent phải được triển khai trên máy người dùng; nếu thiếu tín hiệu thiết bị, policy sẽ không đánh giá đúng.

### Vì sao các phương án khác sai
- **A:** Client VPN cấp quyền theo **subnet/route**, không hiểu "ứng dụng"; muốn tách 12 ứng dụng phải chia mạng phức tạp và vẫn phải phát hành profile VPN.
- **B:** đưa ứng dụng ra internet rồi dùng WAF là ngược yêu cầu; WAF lọc request chứ không xác thực nhóm user hay thiết bị.
- **D:** bastion + SSH tunnel không có authorization theo ứng dụng, khó audit và tạo điểm nghẽn bảo mật.

> Exam tip: "zero trust, per-app policy, identity + device posture, no VPN" → Verified Access. "Chỉ cần tunnel mạng vào VPC" → Client VPN hoặc Site-to-Site VPN.`,
  services: ['AWS Verified Access', 'AWS IAM Identity Center', 'Elastic Load Balancing'],
},
{
  id: 'sap-129', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company connects 40 VPCs in one Region to a single AWS Transit Gateway. Its 60 branch offices use a third-party SD-WAN platform that runs as virtual appliances in a shared services VPC and supports GRE tunnels and BGP. The network team wants the SD-WAN appliances to exchange routes dynamically with the transit gateway, prefers not to manage one AWS Site-to-Site VPN per branch, and needs the branch prefixes to be learned automatically. Which solution meets these requirements?`,
  options: [
    "Create one AWS Site-to-Site VPN attachment per branch office on the transit gateway and use static routes for each branch prefix.",
    "Create a TGW Connect attachment on a transit gateway VPC attachment in the shared services VPC, create a Connect peer that uses GRE and BGP with the SD-WAN appliances, and advertise the branch prefixes over BGP.",
    "Create VPC peering connections between the shared services VPC and every workload VPC, and route branch traffic through the SD-WAN appliances.",
    "Create a Direct Connect gateway and a private virtual interface for each branch office."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng **AWS Transit Gateway Connect**: gắn appliance SD-WAN vào TGW bằng **GRE tunnel** và trao đổi route bằng **BGP**. Một Connect peer cho mỗi appliance; chi nhánh mới chỉ cần quảng bá prefix qua BGP, không phải tạo VPN hay sửa route tĩnh trên AWS.

**Từ khoá:** "third-party SD-WAN", "GRE and BGP", "dynamic routes", "not one VPN per branch" → TGW Connect.

**Thuật ngữ:**
- **SD-WAN:** giải pháp mạng diện rộng chạy trên phần mềm, thường là các appliance ảo tại trung tâm hoặc chi nhánh, tự chọn đường truyền tốt nhất.
- **GRE:** giao thức đóng gói gói tin của một giao thức này vào trong gói tin IP khác, giống bỏ thư vào phong bì ngoài để gửi qua mạng.
- **BGP:** giao thức trao đổi route động giữa các router; hai bên nói chuyện liên tục để biết prefix nào đi đường nào.
- **TGW attachment:** điểm gắn một mạng (VPC, VPN, Direct Connect) vào Transit Gateway.
- **Connect peer:** cấu hình đại diện cho một appliance đầu xa, gồm thông tin GRE và ASN dùng cho BGP.

### Cơ chế hoạt động
1. Tạo **VPC attachment** cho shared services VPC trên Transit Gateway.
2. Tạo **TGW Connect attachment** đặt "trên" VPC attachment đó.
3. Tạo **Connect peer** cho từng appliance: địa chỉ GRE bên ngoài, dải địa chỉ bên trong tunnel và số hiệu ASN của BGP.
4. Appliance dựng GRE tunnel tới Connect peer và thiết lập phiên BGP. TGW học prefix chi nhánh qua BGP rồi đưa vào route table, từ đó 40 VPC nhận được route.
5. Chi nhánh mới chỉ cần quảng bá prefix từ appliance; không tạo thêm attachment AWS.

### Ví dụ cụ thể
Sơ đồ đường đi:

~~~text
Chi nhánh --Internet--> SD-WAN appliance (shared services VPC)
                              |  GRE tunnel + BGP
                        TGW Connect peer
                              |
                     TGW Connect attachment
                              |
                      TGW VPC attachment
                              |
                   TGW route table --> 40 VPC attachment
~~~

Nếu chi nhánh đổi dải mạng từ 10.20.0.0/16 sang 10.30.0.0/16, BGP tự cập nhật route; không phải sửa 60 cấu hình VPN.

### Vì sao B đúng
- TGW Connect được thiết kế đúng cho appliance bên thứ ba hỗ trợ GRE và BGP.
- Route học động, phù hợp 60 chi nhánh thay đổi thường xuyên.
- Không phải quản lý 60 Site-to-Site VPN và không phải khai báo route tĩnh.

### Lỗi hay gặp
- TGW Connect học route **chỉ qua BGP**; không có route tĩnh trên Connect attachment.
- Mỗi Connect peer có giới hạn số GRE tunnel và cần ASN hai bên khớp cấu hình; sai inside CIDR là tunnel không lên.
- Appliance phải nằm trong VPC có đường tới TGW và được cấu hình cho phép traffic GRE.

### Vì sao các phương án khác sai
- **A:** 60 Site-to-Site VPN là đúng thứ đề muốn tránh: mỗi tunnel phải quản lý, và route tĩnh không tự cập nhật khi chi nhánh đổi mạng.
- **C:** VPC peering chỉ nối VPC với nhau, không phải cơ chế để appliance quảng bá route chi nhánh vào TGW; peering cũng không transitive.
- **D:** Direct Connect là kết nối vật lý riêng tới từng địa điểm — không khả thi về chi phí và không dùng cho SD-WAN chạy trên internet.

> Exam tip: "SD-WAN/router ảo + GRE + BGP vào TGW" → TGW Connect. "Kết nối site đơn lẻ, không cần BGP động" → Site-to-Site VPN.`,
  services: ['AWS Transit Gateway', 'TGW Connect', 'AWS Site-to-Site VPN'],
},
{
  id: 'sap-130', exam: 'sap-c02', domain: 'sap-d1',
  q: `A security team wants to enforce a data perimeter for Amazon S3 across 80 member accounts in AWS Organizations. Identities in the member accounts must not be able to read objects from buckets owned by accounts outside the organization, and principals outside the organization must not be able to access the company's data lake buckets. The controls must cover new accounts automatically, and application teams must not maintain IAM policies themselves. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Attach an SCP to the organization root with two deny statements for s3:GetObject and s3:PutObject: one that denies when aws:ResourceOrgID does not equal the organization ID, and one that denies when aws:ResourceOrgID is absent.",
    "Attach a bucket policy to the data lake buckets that denies access when aws:PrincipalOrgID does not equal the organization ID and aws:PrincipalIsAWSService is not true, so that AWS service principals acting for the organization are not blocked.",
    "Create an IAM permissions boundary for every application role that allows S3 access only to buckets in the organization.",
    "Enable S3 Block Public Access at the account level in all accounts.",
    "Create a VPC endpoint policy that allows S3 access only to buckets owned by accounts in the organization."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** Dựng **data perimeter** hai chiều: **identity perimeter** bằng SCP chặn principal trong account đọc bucket ngoài organization, và **resource perimeter** bằng bucket policy chặn principal ngoài organization đọc bucket của mình. SCP gắn ở root nên account mới tự động bị áp.

**Từ khoá:** "identities must not read buckets outside the organization", "principals outside must not access our buckets", "new accounts automatically" → **SCP + bucket policy**.

**Thuật ngữ:**
- **Data perimeter:** tập hàng rào quanh dữ liệu, thường gồm ba lớp: danh tính (ai được gọi), tài nguyên (dữ liệu cho ai đọc) và mạng (đi từ đâu tới).
- **SCP:** policy của AWS Organizations giới hạn quyền tối đa của principal trong account; SCP không cấp quyền, chỉ chặn.
- **Org ID condition key:** {{aws:PrincipalOrgID}} cho biết principal thuộc organization nào; {{aws:ResourceOrgID}} cho biết tài nguyên thuộc organization nào.
- **Null condition:** kiểm tra một key có vắng mặt trong request hay không.
- **Bucket policy:** resource policy gắn trực tiếp vào bucket, đánh giá cả principal ngoài account.

### Cơ chế hoạt động
**A — identity perimeter.** SCP gắn ở organization root áp cho mọi account con hiện có và account thêm sau. Vì một key vắng mặt không tự động khớp điều kiện phủ định, cần hai statement: một bắt trường hợp khác org, một bắt trường hợp key vắng mặt.

~~~json
{
  "Effect": "Deny",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "*",
  "Condition": { "StringNotEquals": { "aws:ResourceOrgID": "o-example" } }
}
~~~

~~~json
{
  "Effect": "Deny",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "*",
  "Condition": { "Null": { "aws:ResourceOrgID": "true" } }
}
~~~

**B — resource perimeter.** Bucket policy Deny cho mọi principal, trừ principal cùng organization. Điều kiện phụ bỏ qua service principal của AWS (ví dụ replication, inventory) vì các principal này không có org ID nhưng đang hành động cho organization.

~~~json
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": ["arn:aws:s3:::datalake", "arn:aws:s3:::datalake/*"],
  "Condition": {
    "StringNotEquals": { "aws:PrincipalOrgID": "o-example" },
    "BoolIfExists": { "aws:PrincipalIsAWSService": "false" }
  }
}
~~~

### Ví dụ cụ thể
Một developer ở account trong org cố đọc bucket của một công ty đối tác: SCP thấy {{aws:ResourceOrgID}} khác org nên Deny ngay, request không bao giờ tới bucket. Ngược lại, một account ngoài org cố đọc bucket data lake: bucket policy thấy {{aws:PrincipalOrgID}} khác org nên Deny tại bucket.

### Lỗi hay gặp
- **SCP không áp cho management account.** Nếu cần chặn cả management account, phải dùng thêm bucket policy hoặc biện pháp khác.
- **Quên nhánh key vắng mặt.** Chỉ dùng StringNotEquals có thể bỏ lọt request tới tài nguyên không thuộc org nào.
- **Chặn nhầm AWS service.** Bucket policy Deny không có ngoại lệ service principal có thể làm hỏng replication, inventory hoặc dịch vụ khác đang đọc hộ bạn.

### Vì sao các phương án khác sai
- **C:** permissions boundary chỉ giới hạn role được gắn; role mới hoặc role không gắn boundary vẫn lọt, và nó không chặn principal ngoài org.
- **D:** Block Public Access chỉ chặn truy cập công khai, không chặn account AWS khác truy cập qua bucket policy/IAM.
- **E:** endpoint policy chỉ áp cho traffic đi qua endpoint đó; traffic từ ngoài VPC hoặc từ VPC khác không bị ảnh hưởng.

> Exam tip: data perimeter = **identity** (SCP) + **resource** (bucket policy) + **network** (endpoint). Nhớ hai bẫy: SCP không áp management account; điều kiện phủ định cần thêm Null để bắt key vắng mặt.`,
  services: ['AWS Organizations', 'AWS Identity and Access Management', 'Amazon S3'],
},
{
  id: 'sap-131', exam: 'sap-c02', domain: 'sap-d1',
  q: `A platform team in a management account maintains ten approved Amazon RDS configurations and VPC baselines as AWS CloudFormation templates. Teams in 45 member accounts must be able to provision these products themselves without receiving broad CloudFormation or networking permissions. The platform team must publish a new version once and have it available in every account, and each provisioned product must be tagged with the requesting team's cost center. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Store the templates in a central S3 bucket and give every team permission to run the CloudFormation deploy command from its own pipeline.",
    "Create an AWS Service Catalog portfolio in the management account, share it with the organization by using AWS RAM, attach a launch role constraint, and use TagOptions to apply the cost center tag.",
    "Deploy the templates with CloudFormation StackSets to every member account, and let teams create stacks from the deployed templates.",
    "Create a copy of the portfolio in each member account and update all copies whenever a template changes."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng **AWS Service Catalog**: gom template đã duyệt vào một **portfolio**, chia sẻ portfolio cho organization qua **AWS RAM**, gắn **launch role** để team không cần quyền CloudFormation rộng, và dùng **TagOptions** để gắn cost center khi provision.

**Từ khoá:** "provision products themselves", "without broad CloudFormation permissions", "publish once", "tagged with cost center" → Service Catalog.

**Thuật ngữ:**
- **Portfolio:** "quầy hàng" gom các product đã được phê duyệt và gán quyền cho từng nhóm người dùng.
- **Product:** một sản phẩm tự phục vụ, ở đây là một template CloudFormation kèm phiên bản.
- **Launch role:** IAM role mà Service Catalog assume khi triển khai; nhờ đó người dùng chỉ cần quyền Service Catalog, không cần quyền tạo RDS/VPC.
- **TagOptions:** thư viện tag gắn vào portfolio/product để khi provision, tài nguyên nhận tag theo chuẩn.
- **AWS RAM:** chia sẻ portfolio giữa các account thay vì copy.

### Cơ chế hoạt động
1. Platform team tạo product từ template, đưa vào portfolio và publish phiên bản.
2. Gắn **launch role constraint**: role này có quyền tạo RDS, VPC, subnet… và nằm dưới kiểm soát của platform team.
3. Chia sẻ portfolio với organization bằng RAM. Member account thấy portfolio trong Service Catalog và tự provision.
4. Khi user bấm provision, Service Catalog assume launch role để chạy CloudFormation. TagOptions gắn cost center vào stack và tài nguyên.
5. Template mới được publish một lần; các account đang share thấy phiên bản mới, không phải copy sang 45 nơi.

### Ví dụ cụ thể
45 account, 10 product. Team "payments" chỉ thấy product RDS chuẩn và VPC baseline, không thấy product của team khác nếu portfolio được giới hạn. Khi provision, họ chọn tag cost center "CC-1042"; stack và RDS instance nhận tag này để tính chi phí.

### Vì sao B đúng
- Tự phục vụ có kiểm soát, không cấp quyền rộng.
- Một nơi publish, nhiều account dùng.
- Launch role tách quyền triển khai khỏi quyền của người dùng.
- TagOptions giải quyết yêu cầu gắn cost center.

### Lỗi hay gặp
- **TagOptions không phải chính sách bắt buộc tuyệt đối:** người dùng có thể chọn giá trị trong danh sách; muốn ép buộc phải kết hợp quy trình hoặc tag policy của Organizations.
- **Launch role phải đúng account và trust:** role thường đặt ở account sở hữu portfolio; nếu role thiếu quyền hoặc trust sai, provision thất bại dù user có quyền Service Catalog.
- **Chia sẻ portfolio không chia sẻ quyền quản trị:** member account dùng được product nhưng không sửa được portfolio gốc.

### Vì sao các phương án khác sai
- **A:** ai chạy CloudFormation trực tiếp cần quyền tạo RDS/VPC, đúng quyền rộng mà đề muốn tránh, và không có phê duyệt hay versioning tập trung.
- **C:** StackSets triển khai hàng loạt cho quản trị viên, không phải catalog tự phục vụ; team vẫn phải có quyền tạo stack.
- **D:** sao chép portfolio thủ công ở 45 account là overhead lớn và dễ lệch phiên bản.

> Exam tip: "self-service, approved products, least privilege, launch role, tag" → Service Catalog. "Triển khai baseline cho mọi account" → StackSets; "landing zone" → Control Tower.`,
  services: ['AWS Service Catalog', 'AWS RAM', 'AWS CloudFormation'],
},
{
  id: 'sap-132', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has a 400 TB Amazon S3 data lake in a dedicated data account. About 600 analysts in 40 project teams sign in through IAM Identity Center, which is federated with the company's external identity provider and receives each analyst's project group membership. Each team must read only the prefixes for its own project, for example s3://company-datalake/payments/. New projects are created every month, and the security team does not want to create IAM roles, permission sets or bucket policy statements for each project. Analysts must use short-lived credentials, and every access must be auditable. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create an S3 Access Grants instance in the data account, register the data lake bucket as a location, create grants that map each IAM Identity Center group to its project prefix with read permission, and have the analytics application request prefix-scoped temporary credentials through the S3 Access Grants plugin or the GetDataAccess API.",
    "Create one IAM role per project with a bucket policy that lists the project prefix, and map each role to the matching group in IAM Identity Center.",
    "Enable S3 Block Public Access and create a bucket ACL that grants read access to each project group.",
    "Attach an SCP that allows s3:GetObject only when the request prefix matches the analyst's group name."
  ],
  answer: 0,
  explain: `**Tóm tắt:** Dùng **S3 Access Grants** với nguồn danh tính là **IAM Identity Center**: mỗi group dự án được cấp một **grant** đọc trên đúng prefix của mình. Ứng dụng xin **credential tạm thời** qua plugin Access Grants hoặc API {{GetDataAccess}}; thêm dự án mới chỉ là thêm group và grant, không tạo IAM role hay sửa bucket policy.

**Từ khoá:** "prefix riêng cho từng dự án", "group từ IdP", "không tạo role/policy cho mỗi dự án", "short-lived credentials", "auditable" → S3 Access Grants + IAM Identity Center.

**Thuật ngữ:**
- **S3 Access Grants:** lớp cấp quyền của S3 ánh xạ **danh tính** (user/group hoặc IAM principal) tới **prefix** trong bucket, thay vì viết policy cho từng nhóm.
- **Location:** đăng ký một bucket hoặc prefix gốc với Access Grants để dịch vụ biết phạm vi quản lý.
- **Grant:** một dòng cấp quyền, ví dụ group "payments" được READ trên {{s3://company-datalake/payments/*}}.
- **GetDataAccess:** API trả về credential tạm thời chỉ dùng được đúng prefix đã grant.
- **IAM Identity Center:** dịch vụ đăng nhập workforce, đồng bộ user/group từ IdP bên ngoài.

### Cơ chế hoạt động
1. Bật **S3 Access Grants** trong data account và tạo một instance. Access Grants là dịch vụ theo Region, nên instance phải ở cùng Region với bucket.
2. Đăng ký bucket data lake làm **location**.
3. Tạo grant cho từng group: grantee là group trong IAM Identity Center, permission là READ, scope là prefix dự án.
4. Ứng dụng phân tích gọi {{GetDataAccess}} (hoặc dùng plugin Access Grants cho SDK S3). Access Grants kiểm tra group của user rồi gọi STS cấp credential tạm thời bị giới hạn đúng prefix.
5. Dự án mới: tạo group trong IdP và một grant. Không thêm IAM role, không sửa permission set, không sửa bucket policy.

### Ví dụ cụ thể
Analyst thuộc group "claims" mở ứng dụng và đọc {{s3://company-datalake/claims/2026/claim-001.json}}. Plugin tự lấy credential cho prefix {{claims/}}; nếu code cố đọc {{payments/}}, S3 từ chối vì credential không có quyền trên prefix đó. CloudTrail data events ghi lại từng lần đọc để audit.

### Vì sao A đúng
- Quyền được biểu diễn bằng grant theo group và prefix, đúng mô hình "dự án nào đọc thư mục đó".
- Không phải tạo role/permission set cho 40 dự án, cũng không phải sửa bucket policy mỗi tháng.
- Credential là tạm thời và bị giới hạn theo prefix, giảm rủi ro lộ quyền.
- Có thể audit qua CloudTrail và log của Access Grants.

### Lỗi hay gặp
- **Đặt sai account/Region:** instance và bucket phải cùng Region; grant phải nằm ở account sở hữu bucket.
- **Nghĩ Access Grants thay thế toàn bộ IAM:** người dùng vẫn cần quyền gọi {{GetDataAccess}} và quyền truy cập ứng dụng; Access Grants chỉ thu hẹp phạm vi dữ liệu.
- **Quên đồng bộ group:** group phải tồn tại trong IAM Identity Center và user phải thuộc group đó trước khi grant có hiệu lực.

### Vì sao các phương án khác sai
- **B:** một role cho mỗi dự án chính là thứ đề muốn loại bỏ; mỗi dự án mới lại phải tạo role và policy mới.
- **C:** Block Public Access chỉ chặn truy cập công khai, không cấp quyền theo group; ACL là cơ chế cũ, không hiểu group từ IdP và khó audit ở quy mô 40 nhóm.
- **D:** SCP không cấp quyền và không có condition key so khớp tên group với prefix; SCP chỉ giới hạn quyền tối đa của principal trong account.

> Exam tip: "directory group + prefix-level S3 access + temporary credentials + no per-project IAM" → **S3 Access Grants**. Phân biệt với ABAC: ABAC so tag principal với tag resource; Access Grants ánh xạ thẳng group tới prefix.`,
  services: ['Amazon S3', 'S3 Access Grants', 'AWS IAM Identity Center'],
},
{
  id: 'sap-133', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has a central shared services account that hosts a single Amazon ECR registry. Workloads in 25 application accounts run on Amazon EKS and must pull images from this registry. Images must be encrypted with a customer managed AWS KMS key that lives in the shared services account. Application accounts must be able to pull images, must not be able to push, delete or retag images, and must not be able to change the key policy. Which solution meets these requirements?`,
  options: [
    "Add a repository policy that allows the pull actions to the application account roles, and add a statement to the KMS key policy that allows kms:Decrypt for those roles; keep push, delete and key administration only in the shared services account.",
    "Enable cross-Region replication of the repository to every application account, because ECR does not support cross-account pulls.",
    "Make the repository public and configure image pull secrets in each EKS cluster.",
    "Copy the KMS key policy into each application account and re-encrypt the images after the copy."
  ],
  answer: 0,
  explain: `**Tóm tắt:** Cần **hai lớp policy**: **repository policy** trong ECR cho phép role của 25 application account pull image, và **KMS key policy** cho phép các role đó {{kms:Decrypt}} trên CMK đang mã hoá image. Quyền push, delete và quản trị key vẫn chỉ ở shared services account.

**Từ khoá:** "single registry", "25 application accounts pull", "customer managed KMS key", "must not push/delete/change key policy" → repository policy + KMS key policy.

**Thuật ngữ:**
- **Amazon ECR:** registry lưu container image; mỗi image gồm nhiều layer.
- **Repository policy:** resource policy gắn vào repository, quyết định account/role nào được pull, push hay delete.
- **CMK:** customer managed key, khoá KMS do khách hàng tạo và quản lý chính sách.
- **Key policy:** policy gắn vào KMS key, quyết định ai được dùng key để mã hoá/giải mã.
- **EKS:** Kubernetes do AWS quản lý; pod cần pull image từ registry trước khi chạy.

### Cơ chế hoạt động
1. EKS node hoặc pod dùng IAM role của application account gọi {{ecr:GetAuthorizationToken}}. Quyền này do IAM trong chính application account cấp, không thể cấp qua repository policy.
2. ECR nhận request pull layer và kiểm tra **repository policy** ở shared services account. Policy phải cho phép các action đọc như {{ecr:BatchGetImage}}, {{ecr:GetDownloadUrlForLayer}} và {{ecr:BatchCheckLayerAvailability}}.
3. Vì image được mã hoá bằng CMK, ECR cần giải mã layer. Principal ở application account phải được **key policy** cấp {{kms:Decrypt}}; nếu thiếu, lỗi thường là access denied hoặc không tải được layer.
4. Chỉ shared services giữ quyền push, delete và {{kms:*}} trên key, nên application account không thể sửa image hay key policy.

### Ví dụ cụ thể
25 application account, mỗi account có role {{eks-node-role}}. Repository policy liệt kê 25 role ARN với quyền pull; key policy có statement cho 25 role ARN đó với {{kms:Decrypt}}. Nếu chỉ thêm repository policy mà quên key policy, lệnh pull image sẽ báo lỗi KMS access denied.

### Vì sao A đúng
- Đây là mô hình cross-account chuẩn của ECR: quyền ở registry và quyền ở key là hai cửa riêng.
- Chỉ cấp đúng action đọc, không cấp push/delete.
- Key policy nằm ở shared services nên application account không thể tự mở rộng quyền.

### Lỗi hay gặp
- **Quên lớp KMS:** image mã hoá bằng CMK thì repository policy một mình không đủ.
- **Cấp nhầm {{ecr:GetAuthorizationToken}} trong repository policy:** đây là action cấp token ở account gọi, phải cấp bằng IAM policy của role.
- **Dùng wildcard principal:** cho {{Principal: "*"}} trong repository policy là mở registry cho mọi account; nên liệt kê role ARN hoặc điều kiện organization.

### Vì sao các phương án khác sai
- **B:** ECR **hỗ trợ** cross-account pull; nhân bản sang 25 account làm tăng chi phí, độ trễ cập nhật và quản lý 25 bản sao.
- **C:** repository public cho phép bất kỳ ai pull, vi phạm yêu cầu bảo mật; pull secret không giải quyết được quyền KMS.
- **D:** key policy không "copy" sang account khác được; key thuộc một account và việc mã hoá lại image là không cần thiết.

> Exam tip: cross-account ECR thất bại thường do **thiếu một trong hai** policy: repository policy hoặc KMS key policy. Tương tự với S3 SSE-KMS và RDS snapshot copy.`,
  services: ['Amazon ECR', 'AWS KMS', 'Amazon EKS', 'IAM'],
},
{
  id: 'sap-134', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 300 VPCs across 60 accounts in AWS Organizations. Security policy requires that DNS queries from private subnets be filtered against a managed list of malicious domains and a custom list of blocked domains, that the configuration apply to new VPCs automatically, and that the security team be able to analyze blocked queries in a central account. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Deploy a Route 53 Resolver DNS Firewall rule group in each VPC and update the VPC associations every night with a Lambda function.",
    "Create a DNS Firewall rule group that uses the managed and custom domain lists, apply it to the organization with an AWS Firewall Manager DNS Firewall policy, and send Resolver query logs to a central Amazon S3 bucket.",
    "Use security groups and network ACLs to block the IP addresses of the malicious domains in every VPC.",
    "Configure an on-premises DNS forwarder to filter queries and point every VPC DHCP options set at it."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Tạo **Route 53 Resolver DNS Firewall rule group** với managed domain list và custom list, rồi dùng **AWS Firewall Manager** để tự gắn rule group cho mọi VPC trong organization. Bật **Resolver query logging** về một S3 bucket trung tâm để phân tích query bị chặn.

**Từ khoá:** "300 VPCs, 60 accounts", "managed + custom domain lists", "new VPCs automatically", "central analysis of blocked queries" → Firewall Manager DNS Firewall policy + Resolver query logging.

**Thuật ngữ:**
- **DNS:** hệ thống dịch tên miền thành địa chỉ IP; mọi request tới một website thường bắt đầu bằng một query DNS.
- **Route 53 Resolver:** DNS resolver nội bộ của VPC, tự động có mặt ở địa chỉ 169.254.169.253 và các địa chỉ VPC CIDR cộng 2.
- **DNS Firewall:** lớp lọc query DNS, so tên miền với rule và trả về NXDOMAIN hoặc địa chỉ chặn thay vì địa chỉ thật.
- **Rule group:** tập rule có thứ tự ưu tiên, mỗi rule tham chiếu một domain list và hành động ALLOW/BLOCK/ALERT.
- **Firewall Manager:** dịch vụ triển khai policy bảo mật cho nhiều account/VPC trong organization, bao gồm cả tài nguyên tạo sau này.
- **Query logging:** ghi lại query DNS, tên miền, loại query và hành động đã áp dụng.

### Cơ chế hoạt động
1. Tạo rule group, thêm rule dùng AWS managed domain list (malware, botnet, phishing) và rule dùng custom list các tên miền công ty muốn chặn.
2. Tạo **Firewall Manager DNS Firewall policy** ở administrator account, chọn organization hoặc OU. Firewall Manager tự associate rule group với mọi VPC trong phạm vi, kể cả VPC tạo sau.
3. Khi EC2 trong private subnet query DNS, query đi tới Route 53 Resolver và bị đánh giá bởi rule group trước khi ra internet.
4. Resolver query logging gửi bản ghi về S3 bucket ở account trung tâm; security team dùng Athena để tìm các query bị BLOCK.

### Ví dụ cụ thể
Một máy trong VPC mới query {{update.bad-domain.example}}. Rule group khớp managed list và trả NXDOMAIN; máy không nhận được IP độc hại. Log ghi {{BLOCK}} kèm VPC ID, EC2 instance và tên miền; security team thấy VPC mới đã được bảo vệ mà không phải cấu hình tay.

### Vì sao B đúng
- Lọc được theo **tên miền**, đúng yêu cầu; security group/NACL chỉ lọc IP.
- Firewall Manager xử lý 300 VPC và VPC mới, giảm vận hành.
- Log tập trung phục vụ điều tra và báo cáo.

### Lỗi hay gặp
- **DNS Firewall chỉ thấy query đi qua Resolver.** Nếu ứng dụng tự gọi DNS server bên ngoài hoặc dùng IP trực tiếp, lớp lọc này không có tác dụng.
- **Thứ tự rule quan trọng:** rule ưu tiên thấp hơn có thể bị rule phía trên che; cần đặt BLOCK trước ALLOW phù hợp.
- **Log destination phải được cấu hình ở nơi tập trung:** nếu mỗi VPC ghi vào log group riêng, việc phân tích 300 VPC sẽ rất khó.

### Vì sao các phương án khác sai
- **A:** tự viết Lambda quét và associate là đúng phần việc Firewall Manager làm sẵn; trễ và dễ bỏ sót VPC mới.
- **C:** security group/NACL lọc theo IP; DNS dùng UDP/TCP 53, không thể chặn theo tên miền, và IP của domain độc hại thay đổi liên tục.
- **D:** phụ thuộc DNS on-prem cho toàn bộ VPC, thêm độ trễ, điểm lỗi và không tích hợp báo cáo tập trung.

> Exam tip: "DNS filtering across an organization, automatic for new VPCs" → **Firewall Manager DNS Firewall policy**. "Chặn domain ở một VPC" → rule group + association thủ công là đủ.`,
  services: ['Amazon Route 53 Resolver', 'Route 53 Resolver DNS Firewall', 'AWS Firewall Manager', 'AWS Organizations'],
},
{
  id: 'sap-135', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company stores 2 million internal policy documents (about 4 TB of PDF and Word files) in an Amazon S3 bucket. Employees need a chat application that answers questions in natural language, cites the source document and the passage used for every answer, and reflects documents that are added every night. The company has no machine learning engineers, does not want to train or fine-tune a model, and must block answers about a list of restricted topics. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Fine-tune a foundation model on the documents every night with Amazon SageMaker and serve the model from a real-time endpoint.",
    "Create an Amazon Bedrock knowledge base with the S3 bucket as a data source, let Bedrock split and embed the documents into a vector index, use RetrieveAndGenerate to answer with citations, schedule a nightly ingestion job, and attach an Amazon Bedrock guardrail to block restricted topics.",
    "Use Amazon Comprehend to extract entities and key phrases from the documents, and return the documents that contain the most matching entities.",
    "Run a self-managed OpenSearch cluster, generate embeddings with a model hosted on Amazon EC2, and write custom retrieval and prompt code."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng **Amazon Bedrock Knowledge Bases** theo mô hình **RAG**: Bedrock đọc tài liệu từ S3, chia nhỏ và tạo **embedding** trong một **vector index**; ứng dụng gọi **RetrieveAndGenerate** để nhận câu trả lời kèm **citation**; lịch chạy ingestion hàng đêm và **guardrail** chặn chủ đề cấm.

**Từ khoá:** "2 triệu tài liệu", "trả lời tự nhiên + trích nguồn", "cập nhật hàng đêm", "không train/fine-tune", "chặn chủ đề" → Bedrock Knowledge Bases + Guardrails.

**Thuật ngữ:**
- **RAG (retrieval-augmented generation):** trước khi trả lời, hệ thống tìm các đoạn tài liệu liên quan rồi đưa chúng vào prompt cho mô hình. Giống thí sinh được phát tài liệu tham khảo trước khi thi.
- **Embedding:** biến một đoạn văn thành dãy số (vector) sao cho các đoạn có nghĩa giống nhau nằm gần nhau trong không gian số.
- **Vector index:** cấu trúc lưu embedding để tìm nhanh các đoạn gần nhất với câu hỏi.
- **Chunk:** một phần nhỏ của tài liệu sau khi chia; retrieval làm việc trên chunk thay vì cả file 200 trang.
- **Citation:** thông tin nguồn gắn với câu trả lời, cho biết đoạn nào trong tài liệu nào đã được dùng.
- **Guardrail:** bộ lọc nội dung của Bedrock, chặn chủ đề, từ ngữ hoặc thông tin nhạy cảm.

### Cơ chế hoạt động
1. Knowledge base nhận S3 bucket làm data source. Một **ingestion job** đọc tài liệu, trích text từ PDF/Word, chia thành chunk.
2. Mỗi chunk được embedding bằng một embedding model; vector được ghi vào vector store (ví dụ OpenSearch Serverless, Aurora PostgreSQL pgvector hoặc Neptune Analytics).
3. Khi người dùng hỏi, câu hỏi cũng được embedding, sau đó tìm top các chunk gần nhất.
4. Bedrock đưa các chunk này vào prompt cho foundation model và trả câu trả lời. **RetrieveAndGenerate** trả kèm citation trỏ về tài liệu và đoạn đã dùng.
5. EventBridge Scheduler gọi ingestion hàng đêm để tài liệu mới được đánh index.
6. Guardrail được gắn vào lời gọi model để chặn chủ đề cấm ở cả input và output.

### Ví dụ cụ thể
Nhân viên hỏi "Hạn mức công tác phí ở Tokyo là bao nhiêu?". Hệ thống tìm 5 chunk trong tài liệu chính sách công tác phí, gửi kèm câu hỏi cho model, và trả "50 USD/ngày" kèm citation tới tài liệu {{travel-policy-2026.pdf}} và đoạn tương ứng. Tài liệu mới thêm tối qua được index trong job đêm.

### Vì sao B đúng
- Không cần ML engineer: Bedrock quản lý ingestion, embedding và vector store.
- Không fine-tune, nhưng vẫn trả lời dựa trên tài liệu mới nhất.
- Citation đáp ứng yêu cầu trích nguồn.
- Guardrail xử lý chủ đề cấm; ingestion theo lịch xử lý cập nhật hàng đêm.

### Lỗi hay gặp
- **Fine-tune không phải công cụ tra cứu:** fine-tune dạy phong cách/định dạng, không đảm bảo mô hình nhớ đúng 4 TB tài liệu, và không tạo citation.
- **Chunk quá lớn hoặc quá nhỏ:** chunk lớn làm nhiễu, chunk nhỏ mất ngữ cảnh; cần thử và đo chất lượng retrieval.
- **Ingestion không tự chạy:** knowledge base không tự đồng bộ mọi thay đổi S3; phải có lịch hoặc trigger gọi job.
- **Guardrail không thay thế kiểm soát quyền:** guardrail lọc nội dung, không quyết định ai được đọc tài liệu nào.

### Vì sao các phương án khác sai
- **A:** fine-tune hàng đêm rất đắt và chậm, không đảm bảo cập nhật đúng dữ liệu, không có citation, và cần kỹ năng ML để vận hành endpoint.
- **C:** Comprehend trích entity/key phrase, không trả lời câu hỏi tự nhiên và không tổng hợp nhiều đoạn tài liệu.
- **D:** tự dựng OpenSearch, tự host model embedding và tự viết retrieval/prompt là đúng phần Knowledge Bases làm sẵn, overhead lớn và dễ sai.

> Exam tip: "hỏi đáp trên tài liệu nội bộ + trích nguồn + không train" → **Bedrock Knowledge Bases (RAG)**. "Chặn chủ đề/từ ngữ" → **Bedrock Guardrails**. Fine-tune dùng để đổi hành vi, không phải để tra cứu dữ liệu thay đổi hàng ngày.`,
  services: ['Amazon Bedrock', 'Amazon Bedrock Knowledge Bases', 'Amazon Bedrock Guardrails', 'Amazon S3'],
},
{
  id: 'sap-136', exam: 'sap-c02', domain: 'sap-d2',
  q: `A delivery company is building a mobile app for 200,000 drivers. The app must show live delivery status updates pushed from the server, keep working while offline and synchronize changes when connectivity returns, and resolve conflicts when two devices update the same delivery record. The backend data is stored in Amazon DynamoDB and business logic runs in AWS Lambda. The company wants the LEAST custom code. Which solution meets these requirements?`,
  options: [
    "Use Amazon API Gateway WebSocket APIs with a DynamoDB connection table and implement fan-out and synchronization logic in Lambda.",
    "Use AWS AppSync with GraphQL subscriptions, DynamoDB and Lambda data sources, and version-based conflict detection, with offline access through AWS Amplify.",
    "Use an Application Load Balancer with sticky sessions and keep driver state in Amazon ElastiCache.",
    "Use one Amazon SQS FIFO queue per driver and have the mobile app poll every 30 seconds."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng **AWS AppSync**: GraphQL **subscription** đẩy cập nhật real-time, data source DynamoDB/Lambda giữ nguyên backend, **version-based conflict detection** xử lý hai thiết bị ghi cùng lúc, và **Amplify DataStore** lo lưu offline rồi đồng bộ khi có mạng.

**Từ khoá:** "live updates pushed", "offline + sync later", "conflict resolution", "DynamoDB + Lambda", "LEAST custom code" → AppSync + Amplify.

**Thuật ngữ:**
- **GraphQL:** ngôn ngữ API cho phép client mô tả đúng dữ liệu mình cần, thay vì gọi nhiều REST endpoint.
- **Subscription:** kênh real-time của GraphQL; client đăng ký một sự kiện và server đẩy dữ liệu khi sự kiện xảy ra.
- **WebSocket:** kết nối hai chiều luôn mở, phù hợp để server chủ động đẩy tin nhắn.
- **Resolver:** phần ánh xạ một field GraphQL sang nguồn dữ liệu như DynamoDB hoặc Lambda.
- **Conflict detection:** phát hiện hai bản ghi cùng sửa một item dựa trên số version; nếu version không khớp thì có xung đột.
- **Amplify DataStore:** thư viện client lưu dữ liệu cục bộ, xếp hàng thay đổi khi offline và đồng bộ khi có mạng.

### Cơ chế hoạt động
1. Định nghĩa schema GraphQL cho delivery; AppSync tạo endpoint và các resolver tới DynamoDB/Lambda.
2. Ứng dụng mở subscription cho delivery của tài xế. AppSync giữ kết nối WebSocket và đẩy mutation mới tới các subscriber liên quan.
3. Khi tài xế cập nhật trạng thái, ghi đi qua resolver. DynamoDB lưu kèm trường {{_version}}.
4. Nếu hai thiết bị cùng sửa một record, lần ghi sau thấy version đã thay đổi. AppSync trả conflict; resolver hoặc DataStore áp chiến lược đã chọn (từ chối, ưu tiên server, hợp nhất).
5. Offline: DataStore ghi vào local store, đưa mutation vào outbox. Khi có mạng, nó gửi lại và nhận delta để cập nhật local.

### Ví dụ cụ thể
Tài xế A mất mạng, đánh dấu đơn "đã giao" lúc 10:00. Tài xế B (cùng đơn) sửa địa chỉ lúc 10:01 khi có mạng. Khi A có mạng lại, DataStore gửi thay đổi; version mismatch được phát hiện và chiến lược hợp nhất quyết định giữ trạng thái giao hàng của A nhưng vẫn nhận địa chỉ mới. Không có custom fan-out hay connection table.

### Vì sao B đúng
- Subscription có sẵn, không phải tự quản WebSocket và fan-out.
- Giữ DynamoDB/Lambda hiện có làm data source.
- Có cơ chế conflict detection và thư viện offline sync.
- Ít code tùy chỉnh nhất trong bốn phương án.

### Lỗi hay gặp
- **Subscription không phải hàng đợi bền vững:** client offline sẽ bỏ lỡ sự kiện; offline sync phải dựa trên DataStore/base query, không chỉ subscription.
- **Chọn sai chiến lược conflict:** mặc định có thể ghi đè; cần chọnAutomerge hoặc custom resolver phù hợp nghiệp vụ.
- **200.000 thiết bị:** cần kiểm soát số subscription và authorization theo từng tài xế để tránh đẩy dữ liệu sai người.

### Vì sao các phương án khác sai
- **A:** API Gateway WebSocket chỉ là kết nối; bạn phải tự viết quản lý connection, fan-out, retry và đồng bộ offline — rất nhiều code.
- **C:** sticky session + ElastiCache không đẩy được update, không có đồng bộ offline, và state trong cache dễ mất.
- **D:** polling 30 giây không phải real-time, tốn pin/tiền, và FIFO queue không giải quyết conflict.

> Exam tip: "GraphQL, real-time subscription, offline sync, conflict detection" → AppSync + Amplify. "Chỉ cần WebSocket tự quản" → API Gateway WebSocket.`,
  services: ['AWS AppSync', 'Amazon DynamoDB', 'AWS Lambda', 'AWS Amplify'],
},
{
  id: 'sap-137', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company must reprocess 8 million objects stored in an Amazon S3 bucket (about 40 TB). Each object requires 2 to 30 seconds of CPU-bound transformation. Every object must be retried independently up to three times, and a single failure must not stop the whole job. The operations team wants a visual execution history, a configurable maximum concurrency, and no servers to manage. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Write a recursive Lambda function that lists the bucket in pages and invokes itself once per object.",
    "Use an AWS Step Functions state machine with a Distributed Map that reads the S3 inventory, runs a child workflow per object with a maximum concurrency, and configures retries and a failure threshold.",
    "Run one AWS Glue job that iterates over the whole bucket from a single driver with 10 workers.",
    "Create an Amazon SQS queue and have every application team poll it with its own consumers."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng **Step Functions Distributed Map**: state machine đọc danh sách 8 triệu object từ S3, chạy **child workflow** cho từng object, đặt **MaxConcurrency**, cấu hình **Retry** ba lần và **ngưỡng lỗi** để job vẫn hoàn tất khi một tỉ lệ nhỏ object hỏng.

**Từ khoá:** "8 million objects", "2-30 seconds each", "retry independently", "max concurrency", "visual history", "no servers" → Step Functions Distributed Map.

**Thuật ngữ:**
- **Step Functions:** dịch vụ orchestration; bạn mô tả các bước bằng state machine thay vì viết code điều phối.
- **Map state:** chạy cùng một nhánh cho từng phần tử của mảng; bản thường có giới hạn số nhánh song song thấp hơn.
- **Distributed Map:** bản Map mở rộng cho hàng triệu item, chạy child workflow song song ở quy mô lớn.
- **Child workflow:** một execution con được tạo cho mỗi item; mỗi con có retry và lỗi riêng.
- **ItemReader:** cấu hình nguồn danh sách item, ví dụ S3 inventory, manifest CSV hoặc JSON.
- **MaxConcurrency:** trần số nhánh chạy đồng thời, dùng để bảo vệ Lambda, database hoặc dịch vụ downstream.
- **Tolerated failure threshold:** tỉ lệ hoặc số item được phép lỗi trước khi cả job bị đánh dấu thất bại.

### Cơ chế hoạt động
1. Tạo state machine có state **Distributed Map**. ItemReader trỏ tới S3 inventory hoặc manifest chứa danh sách object.
2. Với mỗi object, Step Functions khởi chạy một child workflow (ví dụ gọi Lambda xử lý ảnh).
3. MaxConcurrency giới hạn số child chạy cùng lúc, ví dụ 1,000, để không làm nghẽn downstream.
4. Mỗi child có Retry với số lần và backoff; lỗi được ghi lại theo từng item.
5. Đặt tolerated failure threshold, ví dụ 1%. Nếu 8 triệu object mà 5.000 object hỏng (0,06%), job vẫn hoàn tất và báo danh sách lỗi; nếu vượt ngưỡng, job dừng.
6. Console Step Functions hiển thị lịch sử từng nhánh, thời gian và lỗi.

### Ví dụ cụ thể
8 triệu ảnh, mỗi ảnh xử lý 2-30 giây. Với MaxConcurrency 1.000, mỗi giây có thể hoàn tất khoảng 30-500 ảnh tùy thời gian xử lý. Một ảnh hỏng được retry 3 lần rồi ghi vào danh sách lỗi; 7.999.999 ảnh còn lại vẫn chạy tiếp.

### Vì sao B đúng
- Đọc trực tiếp danh sách từ S3, không cần Lambda liệt kê.
- Retry và lỗi độc lập cho từng object.
- MaxConcurrency và ngưỡng lỗi đúng yêu cầu vận hành.
- Có lịch sử trực quan, không phải quản lý server.

### Lỗi hay gặp
- **Dùng Map thường thay Distributed Map:** Map thường không phù hợp 8 triệu item và giới hạn song song thấp hơn nhiều.
- **MaxConcurrency quá cao:** có thể làm nghẽn Lambda concurrency hoặc database; nên đo và đặt trần.
- **Không chuẩn bị manifest:** S3 inventory có độ trễ; nếu cần danh sách mới nhất, phải tạo manifest hoặc dùng ItemReader phù hợp.
- **Nhầm ngưỡng lỗi với retry:** retry xử lý lỗi tạm thời; ngưỡng lỗi quyết định job có bị coi là thất bại hay không.

### Vì sao các phương án khác sai
- **A:** Lambda đệ quy tự gọi nhau dễ chạm giới hạn concurrency và rất khó theo dõi tiến độ của 8 triệu nhánh. Nó không có lịch sử thực thi trực quan theo từng object, cơ chế giới hạn lỗi và điều phối retry tập trung như Distributed Map.
- **C:** một Glue job với driver đơn lẻ khó song song 8 triệu object độc lập, khó retry từng object và không có history chi tiết như yêu cầu.
- **D:** SQS không tự sinh message cho 8 triệu object đã có; nhiều team tự poll là không tập trung và không có orchestration.

> Exam tip: "hàng triệu item, retry độc lập, giới hạn concurrency, xem lịch sử" → Step Functions **Distributed Map** (không phải Map thường). "Ít item, tuần tự" → Map state.`,
  services: ['AWS Step Functions', 'Amazon S3', 'AWS Lambda'],
},
{
  id: 'sap-138', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company runs 60 microservices on Amazon ECS across three clusters in two VPCs in the same Region, connected through a transit gateway. Services call each other by IP addresses stored in environment variables, and deployments break callers because tasks receive new IP addresses. The team wants retries, timeouts and per-service traffic metrics without operating its own service mesh control plane. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Register every task in Amazon Route 53 private hosted zones and update DNS records from a Lambda function on every deployment.",
    "Put an internal Application Load Balancer in front of every service and configure each caller with the load balancer DNS name.",
    "Use Amazon ECS Service Connect with a shared AWS Cloud Map namespace, and let services call each other by stable names; Service Connect provides retries, timeouts and traffic metrics.",
    "Deploy Consul and Envoy on separate EC2 instances and configure every task to register with Consul."
  ],
  answer: 2,
  explain: `**Tóm tắt:** Dùng **Amazon ECS Service Connect** với một **AWS Cloud Map namespace** dùng chung. Mỗi service có tên ổn định, ECS tự cập nhật endpoint khi task đổi IP; proxy do ECS quản lý cung cấp retry, timeout và metric theo từng cặp service.

**Từ khoá:** "tasks get new IPs", "stable service name", "retries, timeouts, metrics", "without operating a mesh control plane", "ECS" → ECS Service Connect.

**Thuật ngữ:**
- **Service discovery:** cơ chế để service A tìm địa chỉ hiện tại của service B; IP của container thay đổi mỗi lần deploy nên không thể hard-code.
- **AWS Cloud Map:** registry tên dịch vụ; service đăng ký endpoint và caller tra cứu theo tên.
- **Service Connect:** tính năng của Amazon ECS dùng Cloud Map làm registry và tự chèn proxy vào task để gọi service khác bằng tên.
- **Envoy:** proxy phổ biến xử lý load balancing, retry, timeout, circuit breaking; Service Connect dùng một proxy do dịch vụ quản lý.
- **Traffic metrics:** số request, lỗi, độ trễ theo từng service đích, thường đẩy vào CloudWatch.

### Cơ chế hoạt động
1. Tạo một **Cloud Map namespace** dùng chung cho các service, ví dụ {{prod.local}}.
2. Cấu hình Service Connect cho ECS service: đặt tên service và port, ví dụ {{orders:8080}}.
3. Khi task khởi động, ECS đăng ký endpoint của task vào namespace và chèn proxy vào task.
4. Caller gọi {{orders:8080}} thay vì IP. Proxy phân giải tên, chọn task đích, áp retry/timeout và ghi metric.
5. Khi deploy tạo task mới với IP mới, đăng ký được cập nhật; caller không cần đổi cấu hình.
6. Với ba cluster trong cùng Region, các cluster dùng chung namespace và mạng giữa các VPC đã thông qua Transit Gateway thì service vẫn gọi được nhau bằng tên.

### Ví dụ cụ thể
Service "checkout" gọi "inventory" 60 lần/giây. Trước đây biến môi trường chứa IP 10.0.3.17; deploy inventory làm IP đổi và checkout lỗi. Sau khi bật Service Connect, checkout gọi {{inventory:8080}}; proxy tự chọn task mới, retry khi một task chết và xuất metric latency/error lên CloudWatch.

### Vì sao C đúng
- Tên service ổn định, không phụ thuộc IP.
- Retry, timeout và metric có sẵn ở tầng proxy, không phải sửa code.
- Không phải tự dựng control plane service mesh.
- Phù hợp môi trường ECS nhiều cluster khi mạng đã thông.

### Lỗi hay gặp
- **Không có kết nối mạng giữa các VPC:** Service Connect phân giải tên nhưng traffic vẫn cần đường mạng; thiếu TGW/peering là timeout.
- **Đặt timeout quá thấp:** retry có thể khuếch đại tải; cần đặt timeout và retry hợp lý theo SLA.
- **Không chuẩn hoá port:** caller phải dùng đúng tên và port đã khai báo trong Service Connect configuration.
- **Bỏ qua security group:** proxy vẫn phải được phép kết nối tới task đích.

### Vì sao các phương án khác sai
- **A:** tự cập nhật DNS bằng Lambda trên mỗi deployment là code tự chế, dễ sai và TTL DNS vẫn gây lỗi tạm thời.
- **B:** một ALB nội bộ cho mỗi service làm tăng chi phí, thêm hop mạng, và vẫn phải cấu hình 60 DNS name; không có retry/timeout ở tầng client.
- **D:** tự dựng Consul + Envoy là đúng phần việc Service Connect quản lý, vi phạm "least overhead".

> Exam tip: "ECS service-to-service, stable name, retries/metrics, no mesh to operate" → Service Connect. "Kubernetes + sidecar" → App Mesh/Istio (nặng hơn).`,
  services: ['Amazon ECS', 'ECS Service Connect', 'AWS Cloud Map', 'Amazon CloudWatch'],
},
{
  id: 'sap-139', exam: 'sap-c02', domain: 'sap-d2',
  q: `A SaaS company stores all tenant data in a single Amazon DynamoDB table. Each tenant has a unique tenant ID, and a request from one tenant must never read or write another tenant's items, even if the application has a bug. Queries must retrieve only one tenant's items efficiently at high scale. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Use a composite primary key with the tenant ID prefixed in the partition key and an item identifier in the sort key, and design any GSI around the tenant query patterns.",
    "Use DynamoDB fine-grained IAM authorization with a condition on dynamodb:LeadingKeys that matches a tenant session tag, and issue temporary credentials per tenant session.",
    "Store all tenants of a customer in a single item and rely on DynamoDB transactions for isolation.",
    "Scan the table and filter by tenant ID with a FilterExpression before returning items to the application.",
    "Create a separate AWS account for each tenant so that IAM isolation is automatic."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** Phòng thủ hai lớp: **tenant ID nằm trong partition key** để mọi truy vấn chỉ chạm đúng tenant, và **fine-grained IAM với {{dynamodb:LeadingKeys}}** so với session tag của tenant để DynamoDB tự từ chối truy vấn chéo tenant dù code có lỗi.

**Từ khoá:** "single table", "never read/write another tenant", "even if app has a bug", "efficient at high scale" → partition key theo tenant + LeadingKeys.

**Thuật ngữ:**
- **Partition key:** khoá quyết định item nằm ở phân vùng nào; Query phải chỉ định đúng partition key.
- **Sort key:** khoá phụ sắp xếp item trong cùng partition, cho phép query theo khoảng.
- **GSI:** global secondary index, bảng phụ có khoá khác để query theo cách khác.
- **Fine-grained access control:** tính năng DynamoDB dùng condition key để giới hạn item mà một principal được đọc/ghi.
- **LeadingKeys:** condition key đại diện cho partition key của item trong request.
- **Session tag:** tag gắn vào credential tạm thời của một phiên, ví dụ {{tenant=acme}}.

### Cơ chế hoạt động
1. Thiết kế khoá: partition key {{TENANT#acme}}, sort key {{ORDER#1001}}. Mọi query của tenant acme dùng đúng partition key này, không scan toàn bảng.
2. Ứng dụng xác thực tenant và gọi STS để lấy credential tạm thời có session tag {{tenant=acme}}.
3. IAM policy của credential có điều kiện {{dynamodb:LeadingKeys}} bằng {{tenant}} từ session tag. Chỉ item có partition key khớp mới được phép.
4. Nếu code bị lỗi và query {{TENANT#globex}}, DynamoDB trả access denied ở tầng API, trước khi dữ liệu được trả về.
5. GSI cũng phải có tenant trong key và được query với cùng điều kiện, nếu không index có thể trả dữ liệu chéo tenant.

### Ví dụ cụ thể
Bảng có item {{TENANT#acme / ORDER#1001}} và {{TENANT#globex / ORDER#2001}}. Credential của phiên acme có tag {{tenant=acme}}; policy LeadingKeys chỉ cho {{TENANT#acme}}. Một bug truyền nhầm tenant globex sẽ nhận lỗi access denied, không trả đơn của globex.

### Vì sao A và B đúng
- **A:** tenant trong key làm truy vấn hiệu quả và tự nhiên cô lập theo partition.
- **B:** LeadingKeys tạo rào chắn ở tầng dữ liệu, không phụ thuộc code ứng dụng; credential tạm thời tránh key dài hạn.

### Lỗi hay gặp
- **Chỉ dựa vào WHERE/FilterExpression:** một truy vấn quên điều kiện là lộ dữ liệu; cần rào chắn IAM.
- **GSI không chứa tenant:** query GSI có thể trả item của tenant khác; phải thiết kế lại index.
- **Một tenant quá lớn:** partition key chỉ có một giá trị sẽ nóng; thêm shard suffix và query song song.
- **Session tag không được truyền:** nếu credential không có tag, điều kiện LeadingKeys không khớp và mọi query bị từ chối.

### Vì sao các phương án khác sai
- **C:** transaction đảm bảo all-or-nothing, không phải rào chắn tenant; gom nhiều tenant vào một item còn giới hạn 400 KB và gây contention.
- **D:** Scan đọc toàn bộ bảng ở mọi request rồi FilterExpression mới lọc, tốn RCU và chậm khi bảng lớn; đây không phải rào chắn ở tầng dữ liệu, chỉ cần một truy vấn quên filter là lộ dữ liệu tenant khác.
- **E:** mỗi tenant một account làm tăng chi phí quản trị, vượt quota account và không phải cách ly dữ liệu trong một bảng.

> Exam tip: multi-tenant trên DynamoDB = **tenant trong key + LeadingKeys** (phòng thủ theo chiều sâu). Partition key nóng vì một tenant lớn → thêm shard suffix.`,
  services: ['Amazon DynamoDB', 'AWS IAM', 'AWS Security Token Service'],
},
{
  id: 'sap-140', exam: 'sap-c02', domain: 'sap-d2',
  q: `A payment service publishes events to Amazon SQS, and a Java consumer writes results to a database. During retries the consumer sometimes processes the same payment twice, and events for the same account sometimes arrive out of order, so an older balance overwrites a newer one. The company needs exactly-once behavior at the business level. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Use an SQS FIFO queue with MessageGroupId set to the account ID and a deduplication ID derived from the payment ID, and keep the visibility timeout longer than the processing time.",
    "Apply the payment update and insert the payment ID into an idempotency table in the same database transaction, with a unique constraint on payment ID; treat a duplicate key as an already processed message.",
    "Increase the number of consumers and use a standard queue with a longer message retention period.",
    "Read from a standard queue and sort messages by timestamp inside each consumer before writing.",
    "Enable server-side encryption with an AWS KMS key on the queue."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** Dùng **SQS FIFO** với MessageGroupId là account ID để giữ thứ tự trong từng account, dedup ID theo payment ID để giảm trùng; đồng thời làm **consumer idempotent** bằng bảng idempotency có unique constraint, ghi cùng transaction với cập nhật payment.

**Từ khoá:** "same payment twice", "out of order per account", "exactly-once at the business level" → FIFO theo account + idempotency store.

**Thuật ngữ:**
- **FIFO queue:** hàng đợi bảo đảm thứ tự trong từng nhóm message và cố gắng loại bỏ trùng trong một cửa sổ thời gian.
- **MessageGroupId:** nhãn nhóm; SQS xử lý tuần tự các message cùng group, các group khác nhau vẫn song song.
- **Deduplication ID:** mã dùng để SQS nhận ra message trùng trong 5 phút.
- **Visibility timeout:** khoảng thời gian message bị ẩn sau khi một consumer nhận, để consumer khác không xử lý cùng lúc.
- **Idempotency:** cùng một thao tác chạy nhiều lần vẫn cho kết quả như chạy một lần.
- **Unique constraint:** ràng buộc database không cho hai dòng cùng giá trị, dùng để chặn ghi trùng.

### Cơ chế hoạt động
1. Producer gửi message vào FIFO queue với MessageGroupId là account ID và dedup ID là payment ID.
2. SQS giao các message cùng group cho một consumer theo đúng thứ tự; message của account khác có thể chạy song song.
3. Consumer mở transaction, cập nhật số dư payment và insert payment ID vào bảng idempotency. Unique constraint bảo đảm nếu payment ID đã tồn tại, transaction thất bại và consumer coi như đã xử lý.
4. Commit transaction rồi mới xoá message. Nếu consumer chết sau commit nhưng trước khi xoá, message được giao lại; lần hai insert trùng payment ID nên không cập nhật số dư lần nữa.
5. Visibility timeout phải dài hơn thời gian xử lý để message không bị giao lại khi consumer còn đang làm việc.

### Ví dụ cụ thể
Timeline: consumer nhận payment P-100, trừ tiền, commit, rồi process bị kill trước khi delete. Message P-100 hiện lại sau visibility timeout. Consumer mới thử insert P-100 vào bảng idempotency, nhận lỗi duplicate key, bỏ qua cập nhật và xoá message. Số dư chỉ bị trừ một lần. Nếu hai payment của cùng account đến lệch thứ tự, FIFO group theo account bảo đảm payment cũ được xử lý trước.

### Vì sao A và B đúng
- **A:** FIFO giải quyết thứ tự trong account; dedup giảm trùng; visibility timeout đúng tránh giao lại giữa chừng.
- **B:** idempotency ở tầng database là rào chắn cuối cùng, bảo vệ cả trường hợp SQS giao lại sau 5 phút hoặc consumer crash.

### Lỗi hay gặp
- **Tin vào "exactly-once" của SQS:** FIFO chỉ giảm trùng trong cửa sổ 5 phút; consumer vẫn phải idempotent.
- **Ghi marker và cập nhật DB ở hai transaction:** crash giữa hai bước có thể làm mất payment hoặc xử lý hai lần.
- **Visibility timeout ngắn hơn thời gian xử lý:** message bị giao lại trong khi consumer cũ vẫn đang chạy, tạo xử lý song song ngoài ý muốn.
- **Dùng một MessageGroupId cho mọi account:** mất khả năng song song, throughput bị giới hạn.

### Vì sao các phương án khác sai
- **C:** standard queue không bảo đảm thứ tự; thêm consumer còn làm tăng khả năng xử lý song song sai thứ tự.
- **D:** sort trong consumer chỉ đúng trong một batch và không giải quyết message đến muộn ở lần poll sau.
- **E:** SSE-KMS chỉ mã hoá dữ liệu khi lưu, không liên quan đến trùng lặp hay thứ tự.

> Exam tip: SQS chỉ đạt **at-least-once** (FIFO giảm trùng nhưng không tuyệt đối) → luôn làm **idempotent consumer**. FIFO throughput cao hơn khi chia nhiều MessageGroupId.`,
  services: ['Amazon SQS', 'Amazon RDS'],
},
{
  id: 'sap-141', exam: 'sap-c02', domain: 'sap-d2',
  q: `A media company is launching a direct-to-consumer mobile app in 12 countries. Users must be able to sign up with email or a social provider, use MFA, and upload personal videos directly to an Amazon S3 bucket under a prefix that only that user can access. The company does not want to build or operate its own identity service. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Store credentials in the application database with salted password hashes and issue custom JSON Web Tokens from the application.",
    "Use an Amazon Cognito user pool with social identity providers and MFA, and a Cognito identity pool that maps authenticated users to an IAM role granting access to a per-user S3 prefix.",
    "Use AWS IAM Identity Center with one permission set per end user.",
    "Create one IAM user per end user and distribute access keys inside the mobile app."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng **Cognito user pool** cho đăng ký email/social và MFA, rồi **Cognito identity pool** đổi token thành **credential AWS tạm thời** cho một IAM role có quyền ghi đúng prefix S3 của từng user. App upload trực tiếp lên S3, không cần server trung gian.

**Từ khoá:** "customers of an app" (không phải nhân viên), "email + social sign-up", "MFA", "per-user S3 prefix", "no identity service to operate" → Cognito user pool + identity pool.

**Thuật ngữ:**
- **User pool:** thư mục người dùng cho ứng dụng; quản lý đăng ký, đăng nhập, MFA, liên kết Google/Facebook/Apple.
- **Identity pool:** dịch vụ đổi token đã xác thực thành credential AWS tạm thời thông qua STS.
- **Federation:** cho phép đăng nhập bằng danh tính từ nhà cung cấp bên ngoài như Google hoặc Facebook.
- **MFA:** xác thực nhiều bước, ví dụ mật khẩu cộng mã OTP.
- **STS:** dịch vụ cấp credential tạm thời có thời hạn, thay cho access key dài hạn.
- **Policy variable:** biến trong IAM policy được thay bằng giá trị của request, ví dụ identity ID của user.

### Cơ chế hoạt động
1. User đăng ký hoặc đăng nhập qua user pool, có thể dùng email hoặc social provider; user pool áp MFA.
2. User pool trả token (ID token, access token, refresh token).
3. App gửi token tới identity pool. Identity pool xác thực token và gọi STS cấp credential tạm thời cho IAM role của authenticated user.
4. Policy của role giới hạn quyền S3 theo **Cognito identity ID** của chính user, thường dùng policy variable trong ARN prefix.
5. App dùng credential tạm thời để PUT video trực tiếp vào prefix của mình. User khác có identity ID khác nên không ghi được vào prefix đó.

### Ví dụ cụ thể
User A có identity ID {{us-east-1:aaaa-1111}}, được ghi vào {{s3://videos/us-east-1:aaaa-1111/}}. User B có identity ID khác nên policy không cho ghi vào prefix của A. Không có access key dài hạn trong app; credential hết hạn và được refresh bằng token.

### Vì sao B đúng
- User pool xử lý đăng ký, social login và MFA — đúng phần phải tự viết nếu không dùng dịch vụ.
- Identity pool cấp credential tạm thời, an toàn hơn key dài hạn.
- Prefix theo identity ID cô lập dữ liệu từng user.
- AWS vận hành, phù hợp yêu cầu "least operational overhead".

### Lỗi hay gặp
- **Nhầm identity ID với user sub:** policy variable phải dùng đúng identity ID do identity pool cấp, không phải user ID trong user pool.
- **Để role unauthenticated quá rộng:** nếu bật guest access, phải giới hạn chặt; tốt nhất chỉ cho authenticated user upload.
- **Thiếu CORS trên S3:** app mobile/web upload trực tiếp cần CORS cho phép PUT từ domain của app.
- **Không kiểm tra loại file/kích thước:** nên thêm validation ở client và S3 event/Lambda để tránh upload độc hại.

### Vì sao các phương án khác sai
- **A:** tự viết xác thực, hash, MFA, social login và xoay token là đúng phần Cognito làm sẵn, dễ sai bảo mật.
- **C:** IAM Identity Center dành cho **workforce** truy cập tài khoản AWS, không dùng cho hàng trăm nghìn người dùng cuối.
- **D:** IAM user + access key trong mobile app là anti-pattern: key bị trích xuất, không hết hạn, không scale.

> Exam tip: "người dùng cuối của app web/mobile" → Cognito. "Nhân viên đăng nhập nhiều AWS account" → IAM Identity Center. Prefix riêng cho từng user → policy variable theo identity ID.`,
  services: ['Amazon Cognito', 'AWS IAM', 'Amazon S3', 'AWS Security Token Service'],
},
{
  id: 'sap-142', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company processes messages from an Amazon SQS queue with an AWS Lambda function in batches of 10. When one message is malformed, the whole batch is retried, and valid messages are processed several times, creating duplicate charges in a downstream system. Message order does not matter. The company wants the smallest change that prevents good messages from being reprocessed and stops poison messages from blocking the queue. Which solution meets these requirements?`,
  options: [
    "Set the batch size to 1 so that a failure affects only one message.",
    "Return the failed message IDs in the batchItemFailures field of the response, enable ReportBatchItemFailures on the event source mapping, and send messages that exceed the retry limit to a dead-letter queue.",
    "Increase the visibility timeout and the maximum receive count so that retries eventually succeed.",
    "Catch all exceptions inside the function and return success so that the batch is always deleted."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Bật **ReportBatchItemFailures** trên event source mapping và trả về {{batchItemFailures}} chứa ID của message lỗi. Lambda xoá các message thành công, chỉ giữ message lỗi để retry; message lỗi vượt **maxReceiveCount** được đẩy vào **dead-letter queue**.

**Từ khoá:** "batch of 10", "one malformed message", "valid messages processed several times", "poison message", "smallest change" → partial batch response.

**Thuật ngữ:**
- **Event source mapping:** cấu hình để Lambda tự poll SQS và gọi function theo batch.
- **Batch:** một lần gọi function chứa nhiều message, ở đây là 10.
- **Partial batch response:** function trả về danh sách message nào thất bại thay vì báo cả batch thất bại.
- **Poison message:** message luôn lỗi khi xử lý, nếu retry mãi sẽ chặn queue hoặc tốn chi phí.
- **DLQ:** dead-letter queue, nơi nhận message đã vượt số lần retry để phân tích sau.
- **maxReceiveCount:** số lần tối đa một message được giao trước khi bị chuyển DLQ.

### Cơ chế hoạt động
1. Lambda poll SQS, nhận batch 10 message và gọi function.
2. Function xử lý từng message, ghi nhận message nào lỗi.
3. Function trả về object có trường {{batchItemFailures}} chứa ID của các message lỗi.
4. Lambda xoá các message thành công khỏi queue; message lỗi được giữ lại và trở nên visible sau visibility timeout để retry.
5. Sau maxReceiveCount lần nhận, SQS chuyển message lỗi sang DLQ. Các message tốt không bị xử lý lại.

### Ví dụ cụ thể
Batch có 10 message, trong đó message số 7 bị thiếu trường amount. Function trả về {{batchItemFailures: [{itemIdentifier: "msg-7"}]}}. Lambda xoá 9 message còn lại; msg-7 được retry ở lần poll sau và sau 3 lần vẫn lỗi thì vào DLQ. Downstream chỉ nhận 9 giao dịch hợp lệ một lần.

### Vì sao B đúng
- Đúng cơ chế có sẵn của Lambda cho SQS, thay đổi nhỏ.
- Message tốt không bị xử lý lại.
- Poison message được cô lập ở DLQ, không chặn queue.
- Không phải giảm batch size hay tăng retry vô hạn.

### Lỗi hay gặp
- **Quên bật ReportBatchItemFailures:** function trả về đúng format nhưng Lambda vẫn coi cả batch thất bại.
- **Trả về ID sai:** phải dùng đúng {{itemIdentifier}} là messageId của SQS; sai ID làm message tốt bị retry hoặc message lỗi bị xoá.
- **Throw exception thay vì trả về danh sách:** nếu function ném lỗi, Lambda coi cả batch thất bại và quay lại vấn đề ban đầu.
- **DLQ đặt sai chỗ:** với SQS, cấu hình redrive policy trên queue nguồn; DLQ của Lambda dành cho invocation async, không giải quyết batch.

### Vì sao các phương án khác sai
- **A:** batch size 1 giảm rủi ro nhưng tăng số lần gọi Lambda, chi phí và độ trễ; vẫn không có DLQ cho poison message.
- **C:** tăng visibility timeout và số lần nhận chỉ làm message độc được thử lại nhiều lần hơn, vẫn chặn các message phía sau (với FIFO) và tốn chi phí.
- **D:** nuốt lỗi làm mất dữ liệu và downstream không bao giờ nhận được message đó.

> Exam tip: "SQS + Lambda batch, một message lỗi kéo cả batch" → **ReportBatchItemFailures**. Đi kèm **DLQ** trên queue nguồn, không phải DLQ của Lambda (với SQS, async invocation DLQ không dùng được).`,
  services: ['AWS Lambda', 'Amazon SQS', 'Amazon CloudWatch'],
},
{
  id: 'sap-143', exam: 'sap-c02', domain: 'sap-d2',
  q: `A streaming company delivers paid video-on-demand content as HLS playlists and hundreds of segment files per title from an Amazon S3 bucket through Amazon CloudFront. Access must expire four hours after authentication, must be limited to the paying subscriber's content path, and the company cannot change the URLs that the player requests for each segment. Which solution meets these requirements with the LEAST operational effort?`,
  options: [
    "Create a CloudFront signed URL for every playlist and every segment, and make the player request a new signature for each file.",
    "Issue CloudFront signed cookies after authentication with a four-hour expiry and a policy that restricts access to the subscriber's content path.",
    "Use origin access control (OAC) on the distribution and rely on the S3 bucket policy to block unauthenticated users.",
    "Attach AWS WAF rate-based rules to the distribution to prevent content sharing."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Sau khi subscriber đăng nhập, server phát **CloudFront signed cookies** với policy hết hạn sau 4 giờ và giới hạn đúng prefix nội dung. Player gửi cookie tự động cho playlist và mọi segment, nên không phải ký từng URL và không phải đổi URL.

**Từ khoá:** "HLS playlists + hundreds of segments", "cannot change the URLs", "expire after 4 hours", "one paying subscriber" → CloudFront signed cookies.

**Thuật ngữ:**
- **HLS:** giao thức stream video chia nội dung thành playlist và nhiều file segment nhỏ.
- **Segment:** một đoạn video vài giây; một bộ phim có thể có hàng trăm segment.
- **Signed URL:** URL có chữ ký, chỉ đúng một tài nguyên và hết hạn theo policy.
- **Signed cookie:** cookie chứa chữ ký và policy, áp dụng cho nhiều request cùng domain/path.
- **OAC:** origin access control, cơ chế chỉ cho CloudFront đọc S3, không liên quan xác thực người xem.
- **WAF:** web application firewall, lọc request theo luật; không phải cơ chế cấp quyền nội dung.

### Cơ chế hoạt động
1. Subscriber đăng nhập vào ứng dụng. Server xác thực và tạo policy: thời điểm hết hạn sau 4 giờ, resource giới hạn ở prefix nội dung của subscriber.
2. Server ký policy bằng CloudFront key pair và trả ba cookie: policy, signature, key-pair ID. Cookie gắn với domain phân phối.
3. Player tải playlist; trình duyệt/player tự gửi cookie trong mọi request tới domain đó.
4. CloudFront kiểm tra chữ ký, hạn và resource trong policy. Nếu hợp lệ, request được phục vụ; nếu hết hạn hoặc sai path, trả 403.
5. URL của playlist và segment không đổi, đúng ràng buộc của player.

### Ví dụ cụ thể
Subscriber mua phim X, nhận cookie hết hạn lúc 18:00 và policy chỉ cho {{/movies/x/*}}. Từ 14:00 đến 18:00, player tải playlist và 300 segment mà không phải xin chữ ký mới. Sau 18:00, cookie hết hạn và mọi request mới bị từ chối. Nếu subscriber gửi link cho người khác, người đó không có cookie hợp lệ nên không xem được.

### Vì sao B đúng
- Một lần ký áp cho nhiều file, phù hợp HLS nhiều segment.
- Giữ nguyên URL, không phải sửa player.
- Policy đặt được expiry và path theo subscriber.
- Ít công vận hành hơn ký từng URL.

### Lỗi hay gặp
- **Cookie gắn sai domain:** cookie phải thuộc domain của distribution (thường dùng custom domain); nếu player tải từ domain khác, cookie không được gửi.
- **Quên bật credentials ở CORS:** player web gọi cross-origin cần gửi kèm cookie.
- **Policy quá rộng:** chỉ giới hạn theo subscriber prefix, không dùng wildcard toàn bộ thư viện.
- **Nhầm OAC với xác thực người xem:** OAC bảo vệ S3 origin, không bảo vệ nội dung khỏi người dùng cuối.

### Vì sao các phương án khác sai
- **A:** ký từng segment là hàng trăm URL mỗi title, phải sinh lại khi hết hạn — nhiều code, dễ hỏng, và cần thay đổi player.
- **C:** OAC chỉ xác thực **CloudFront với S3**; nó không xác thực người xem, ai biết domain vẫn tải được nội dung.
- **D:** WAF rate limit giảm lưu lượng bất thường nhưng không xác thực subscriber và không đặt hạn 4 giờ.

> Exam tip: "một file, URL đổi được" → signed URL. "Nhiều file/HLS, không đổi URL" → signed cookies. "Chỉ CloudFront được đọc S3" → OAC.`,
  services: ['Amazon CloudFront', 'Amazon S3', 'CloudFront signed cookies'],
},
{
  id: 'sap-144', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company runs 600 Amazon EC2 instances with 1,200 gp2 EBS volumes. Most volumes are 500 GB and use about 500 IOPS, while a few 2 TB volumes need high throughput. The company also keeps seven years of EBS snapshots for compliance, and snapshots older than 90 days are almost never restored. The company wants to reduce EBS cost without moving data and without reducing performance for the high-throughput volumes. Which combination of actions will meet these requirements? (Choose two.)`,
  options: [
    "Modify the gp2 volumes to gp3 with baseline performance sized to measured IOPS and throughput, and provision extra IOPS only on the volumes that need it.",
    "Move snapshots older than 90 days to the EBS Snapshot Archive tier and keep only the snapshots required for recovery in the standard tier.",
    "Replace all EBS volumes with instance store volumes to remove EBS charges.",
    "Take more frequent full snapshots so that each snapshot becomes smaller.",
    "Convert all volumes to io2 Block Express to lower the cost per GB."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** Chuyển volume **gp2 sang gp3** tại chỗ, chỉ mua thêm IOPS/throughput cho volume thật sự cần; và đưa snapshot cũ hơn 90 ngày sang **EBS Snapshot Archive**. Hai thay đổi này giảm chi phí mà không copy dữ liệu và không giảm hiệu năng volume cần cao.

**Từ khoá:** "1,200 gp2 volumes", "500 IOPS thực tế", "high throughput vẫn phải giữ", "snapshots 7 năm, hiếm khi restore" → gp3 + Snapshot Archive.

**Thuật ngữ:**
- **EBS:** ổ đĩa mạng gắn vào EC2, dữ liệu tồn tại độc lập với vòng đời instance.
- **IOPS:** số thao tác đọc/ghi mỗi giây; càng cao càng đáp ứng nhiều request nhỏ.
- **Throughput:** lượng dữ liệu mỗi giây (MiB/s); quan trọng với đọc/ghi tuần tự lớn.
- **gp2:** loại SSD cũ, hiệu năng gắn với dung lượng theo tỉ lệ 3 IOPS/GB và có burst.
- **gp3:** SSD mới, giá mỗi GB thấp hơn, có baseline 3.000 IOPS và 125 MiB/s, mua thêm độc lập.
- **Elastic Volumes:** đổi loại, dung lượng hoặc IOPS của volume đang chạy mà không cần copy dữ liệu.
- **Snapshot Archive:** tier lưu trữ lạnh của EBS snapshot, rẻ hơn nhiều nhưng restore chậm.

### Cơ chế hoạt động
1. Đo IOPS và throughput thực tế của từng volume. Phần lớn volume 500 GB chỉ dùng khoảng 500 IOPS.
2. Với gp2 500 GB, baseline khoảng 1.500 IOPS; chuyển sang gp3 vẫn có 3.000 IOPS và 125 MiB/s mặc định, thừa cho nhu cầu, nhưng giá mỗi GB thấp hơn.
3. Volume 2 TB cần throughput cao: giữ gp3 và mua thêm IOPS/throughput, hoặc cân nhắc io2 nếu cần độ bền IOPS rất cao.
4. Snapshot EBS vốn incremental: bản đầu đầy đủ, các bản sau chỉ lưu block thay đổi. Snapshot cũ hơn 90 ngày chuyển sang Archive.
5. Archive rẻ hơn khoảng 75%, đổi lại restore mất 24-72 giờ; snapshot cần phục hồi nhanh giữ ở standard tier.

### Ví dụ cụ thể
500 GB gp2 dùng 500 IOPS: chuyển gp3, không mua thêm, chi phí GB giảm khoảng 20%. Một volume 2 TB cần 8.000 IOPS và 500 MiB/s: gp3 mua thêm đúng mức đó, không mua cho toàn bộ 1.200 volume. Snapshot 7 năm: 90 ngày gần nhất ở standard, phần còn lại ở Archive.

### Vì sao A và B đúng
- **A:** gp3 tách capacity khỏi hiệu năng, tránh trả tiền cho IOPS không dùng; Elastic Volumes không cần copy dữ liệu.
- **B:** Archive đúng cho dữ liệu compliance hiếm restore, giữ bản gần ở tier nhanh.

### Lỗi hay gặp
- **Chuyển gp3 nhưng mua IOPS cho mọi volume:** làm mất phần tiết kiệm; chỉ mua cho volume cần.
- **Quên kiểm tra throughput:** workload tuần tự có thể cần throughput hơn IOPS; gp3 baseline 125 MiB/s có thể không đủ.
- **Archive nhầm snapshot cần restore nhanh:** restore 24-72 giờ có thể vi phạm RTO.
- **Nghĩ snapshot full tốn kém:** EBS snapshot đã incremental; chi phí tăng khi có nhiều bản và nhiều block thay đổi.

### Vì sao các phương án khác sai
- **C:** instance store là lưu trữ tạm, mất khi stop/terminate máy, không thay thế được volume bền vững.
- **D:** snapshot EBS vốn đã incremental; chụp dày hơn làm **tăng** số bản và chi phí, không giảm dung lượng mỗi bản.
- **E:** io2 Block Express cung cấp IOPS rất cao nhưng đắt hơn gp3 nhiều lần; không phải lựa chọn giảm chi phí.

> Exam tip: gp3 gần như luôn là câu trả lời "giảm chi phí EBS mà vẫn đủ hiệu năng". Snapshot Archive cho lưu trữ dài hạn; nhớ SLA restore 24-72 giờ.`,
  services: ['Amazon EBS', 'EBS Snapshots', 'EC2'],
},
{
  id: 'sap-145', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company runs a large Amazon EKS cluster that hosts batch jobs, CI runners and 30 production services. Managed node groups are sized for peak load, average CPU utilization is 20%, and the platform team creates a new node group every time it needs a different instance type. The company wants nodes provisioned just in time for pending pods, automatic consolidation of underutilized nodes, and Spot capacity for interruption-tolerant workloads. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create one managed node group per instance type and use Cluster Autoscaler with static scaling policies for each group.",
    "Install Karpenter, configure NodePools with instance family, architecture and capacity type requirements, and let Karpenter provision and consolidate nodes based on pod requirements.",
    "Move all workloads to AWS Fargate profiles so that no nodes are needed.",
    "Use one large managed node group with the largest available instance type and bin-pack pods with node selectors."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Cài **Karpenter**, khai báo **NodePool** theo yêu cầu về instance family, kiến trúc và loại capacity. Karpenter tự tạo node đúng lúc cho pod Pending, tự **consolidation** node thừa khi tải giảm, và dùng **Spot** cho workload chịu được gián đoạn.

**Từ khoá:** "sized for peak", "20% utilization", "new node group per instance type", "just-in-time", "consolidation", "Spot" → Karpenter.

**Thuật ngữ:**
- **EKS:** Kubernetes do AWS quản lý control plane; worker node vẫn là EC2 hoặc Fargate.
- **Node group:** nhóm node cùng cấu hình, thường gắn với một Auto Scaling group.
- **Cluster Autoscaler:** autoscaler truyền thống, tăng/giảm số node trong các node group đã định nghĩa.
- **Karpenter:** autoscaler thế hệ mới, tạo node trực tiếp từ EC2 Fleet dựa trên yêu cầu của pod, không cần định nghĩa node group trước.
- **NodePool:** cấu hình của Karpenter mô tả loại node được phép tạo (family, kiến trúc, Spot/On-Demand, giới hạn).
- **Consolidation:** Karpenter dời pod khỏi node ít dùng và xoá node để giảm lãng phí.
- **Spot interruption:** thông báo AWS sẽ thu hồi instance Spot, thường trước 2 phút.

### Cơ chế hoạt động
1. Pod mới được tạo nhưng không đủ tài nguyên, nằm ở trạng thái Pending.
2. Karpenter thấy pod Pending, đọc yêu cầu tài nguyên và NodePool, rồi chọn tổ hợp instance type/AZ phù hợp.
3. Karpenter gọi EC2 Fleet để tạo node, cài node vào cluster, pod được schedule.
4. Khi tải giảm, consolidation tìm node có thể gộp pod sang node khác, cordon và drain node thừa, rồi xoá.
5. Với Spot, Karpenter theo dõi cảnh báo thu hồi, cordon/drain node và tạo node thay thế trước khi instance biến mất.

### Ví dụ cụ thể
Ban đêm chạy 200 pod batch, ban ngày chỉ còn 20 pod production. Karpenter tạo node khi batch bắt đầu và consolidation thu node khi batch xong, thay vì giữ nguyên cụm sized cho peak. CI runner dùng NodePool Spot; service production dùng NodePool On-Demand.

### Vì sao B đúng
- Just-in-time đúng yêu cầu, không phải tạo node group cho từng instance type.
- Consolidation xử lý tình trạng utilization 20%.
- NodePool diễn tả Spot/On-Demand, kiến trúc và family linh hoạt.
- Giảm công quản lý nhiều node group và scaling policy.

### Lỗi hay gặp
- **PDB chặn drain:** PodDisruptionBudget quá chặt làm consolidation không xoá được node; cần đặt PDB hợp lý.
- **NodePool quá hẹp:** giới hạn một instance type làm Karpenter khó tìm capacity, đặc biệt với Spot.
- **Không xử lý interruption:** chỉ dựa vào Spot mà không có pod disruption và graceful shutdown sẽ mất request.
- **Trộn workload không phù hợp:** production quan trọng nên có NodePool On-Demand riêng, tránh bị Spot thu hồi.

### Vì sao các phương án khác sai
- **A:** mỗi instance type một node group + Cluster Autoscaler vẫn cần quản lý nhiều ASG, chậm thích nghi và không tự consolidation hiệu quả.
- **C:** Fargate không hỗ trợ DaemonSet, GPU, instance store và một số workload batch/CI; không thay thế toàn bộ cluster.
- **D:** một node group khổng lồ dễ lãng phí, giới hạn instance type và không tự chọn Spot theo nhu cầu.

> Exam tip: "EKS, just-in-time nodes, consolidation, Spot" → **Karpenter**. Nếu đề nói "không muốn quản node" cho workload đơn giản → Fargate.`,
  services: ['Amazon EKS', 'Karpenter', 'Amazon EC2 Spot'],
},
{
  id: 'sap-146', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company runs an Amazon Aurora PostgreSQL cluster for a write-heavy order system. The monthly bill shows that I/O charges are 45% of the total database cost, and the workload is expected to grow steadily. The cluster uses four Aurora Replicas, and the team does not want to change the application, the schema or the availability of the cluster. Which change will reduce the database cost the MOST?`,
  options: [
    "Switch the cluster storage configuration from Aurora Standard to Aurora I/O-Optimized.",
    "Reduce the number of Aurora Replicas from four to one.",
    "Move the cluster to smaller instance classes and keep the same number of replicas.",
    "Enable Aurora Auto Scaling with a target of 90% CPU utilization."
  ],
  answer: 0,
  explain: `**Tóm tắt:** Chuyển cluster từ **Aurora Standard** sang **Aurora I/O-Optimized**. Gói mới bỏ phí I/O theo lượt, đổi lại giá instance-hour và storage cao hơn; khi I/O đã chiếm 45% hoá đơn thì đây là cách giảm chi phí mạnh nhất mà không đổi ứng dụng, schema hay số replica.

**Từ khoá:** "write-heavy", "I/O charges 45% of total cost", "no app/schema/availability change", "reduce cost the MOST" → Aurora I/O-Optimized.

**Thuật ngữ:**
- **Aurora:** database tương thích MySQL/PostgreSQL do AWS quản lý, storage tự nhân bản qua nhiều AZ.
- **Aurora Replica:** bản sao chỉ đọc, dùng cho scale đọc và failover.
- **Aurora Standard:** mô hình giá trả tiền storage, instance và **mỗi lượt I/O** phát sinh.
- **Aurora I/O-Optimized:** mô hình giá không tính phí I/O theo lượt, nhưng instance-hour và storage đắt hơn.
- **I/O charge:** chi phí mỗi lần đọc/ghi page từ storage; workload ghi nhiều làm khoản này tăng nhanh.

### Cơ chế hoạt động
1. Với Standard, mỗi thao tác đọc/ghi vượt mức bao gồm có thể phát sinh phí I/O. Hệ thống ghi nhiều tạo ra nhiều I/O và hoá đơn tăng tuyến tính.
2. I/O-Optimized chuyển sang mô hình giá cố định hơn: không còn phí I/O theo lượt, nhưng giá instance-hour tăng khoảng 30% và storage tăng.
3. Điểm hoà vốn thường quanh mức I/O chiếm khoảng 25% tổng chi phí database. Trên mức đó, I/O-Optimized rẻ hơn; dưới mức đó, Standard rẻ hơn.
4. Với đề bài I/O chiếm 45%, chuyển sang I/O-Optimized giảm được phần lớn chi phí I/O mà không đổi endpoint, schema, số replica hay tính sẵn sàng.

### Ví dụ cụ thể
Giả sử hoá đơn tháng 10.000 USD, trong đó 4.500 USD là I/O. Chuyển sang I/O-Optimized: mất phí I/O nhưng phần instance/storage tăng thêm, giả sử 1.500 USD. Tổng còn khoảng 7.000 USD, tiết kiệm khoảng 30%. Nếu I/O chỉ chiếm 1.000 USD, phần tăng thêm có thể lớn hơn phần tiết kiệm, nên Standard hợp hơn.

### Vì sao A đúng
- Tấn công đúng thành phần chi phí lớn nhất là I/O.
- Không thay đổi ứng dụng, schema, endpoint hay số replica.
- Chi phí dễ dự đoán hơn khi workload tăng.
- 45% là trên ngưỡng hoà vốn nên tiết kiệm rõ.

### Lỗi hay gặp
- **Chỉ nhìn phí I/O mà không tính phần tăng của instance/storage:** phải so tổng hoá đơn.
- **Chuyển khi I/O thấp:** nếu I/O dưới ngưỡng, I/O-Optimized có thể đắt hơn.
- **Nghĩ chuyển gói làm mất replica:** không; cấu hình storage thay đổi, số replica và tính sẵn sàng giữ nguyên.
- **Bỏ qua thời gian chuyển đổi:** AWS có quy định thời gian tối thiểu giữa các lần đổi cấu hình storage; kiểm tra trước khi lên kế hoạch.

### Vì sao các phương án khác sai
- **B:** bỏ 3 replica làm giảm khả năng đọc và tính sẵn sàng, trái ràng buộc "không đổi availability"; nguyên nhân chi phí là I/O chứ không phải replica.
- **C:** instance nhỏ hơn có thể không đủ CPU/RAM cho workload ghi, gây chậm và ảnh hưởng SLA.
- **D:** Auto Scaling thêm replica khi CPU cao, **tăng** chi phí; không xử lý phí I/O.

> Exam tip: Aurora I/O-Optimized hiệu quả khi I/O chiếm > 25% chi phí cluster. Nếu workload I/O thấp và đều, Standard rẻ hơn.`,
  services: ['Amazon Aurora', 'Aurora I/O-Optimized'],
},
{
  id: 'sap-147', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company ingests 12 TB of application logs per day into Amazon CloudWatch Logs. Engineers query the last 7 days with CloudWatch Logs Insights, auditors require one year of retention, and most of the volume is debug output that is never queried. CloudWatch Logs cost has tripled in six months. Which combination of actions will reduce cost the MOST while keeping the required query and retention capabilities? (Choose two.)`,
  options: [
    "Set a 7-day retention on the high-volume log groups and use a subscription filter to deliver logs through Amazon Data Firehose to Amazon S3 with lifecycle policies for the one-year audit requirement, querying the archive with Amazon Athena.",
    "Remove verbose debug logging from production and emit the metrics that are needed with the CloudWatch embedded metric format.",
    "Increase the retention to one year on all log groups so that logs never need to be exported.",
    "Keep all logs in CloudWatch Logs and create more metric filters for every debug message.",
    "Disable encryption of log groups to reduce ingestion cost."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** Cắt chi phí ở ba chỗ: **giảm lượng log ingest** (bỏ debug không dùng, dùng EMF cho metric), **giảm retention CloudWatch xuống 7 ngày**, và **archive sang S3** để giữ 1 năm với chi phí thấp, query bằng Athena khi cần audit.

**Từ khoá:** "12 TB/ngày", "query 7 ngày", "audit cần 1 năm", "debug không bao giờ query", "giảm chi phí nhất" → giảm ingest + retention ngắn + archive S3/Athena.

**Thuật ngữ:**
- **Ingestion:** chi phí mỗi GB log đưa vào CloudWatch Logs; đây thường là khoản lớn nhất.
- **Retention:** thời gian log được giữ; càng dài càng tốn storage.
- **Logs Insights:** công cụ query log; chi phí dựa trên lượng dữ liệu bị quét.
- **Subscription filter:** bộ lọc gửi log tới đích khác như Firehose, Lambda hoặc Kinesis.
- **Firehose:** dịch vụ chuyển dữ liệu streaming tới S3, Redshift, OpenSearch.
- **Athena:** query SQL trực tiếp trên S3, trả tiền theo dữ liệu quét.
- **EMF:** Embedded Metric Format, cho phép ghi metric dưới dạng log có cấu trúc để CloudWatch tách metric.

### Cơ chế hoạt động
1. 12 TB/ngày tương đương khoảng 12.288 GB. Với giá ingestion tham khảo khoảng 0,50 USD/GB, riêng ingest đã khoảng 6.000 USD/ngày — đây là động lực chính của hoá đơn.
2. Giảm ingest bằng cách bỏ log debug không bao giờ query; thay các log đếm số liệu bằng EMF để vẫn có metric mà không cần log dày.
3. Đặt retention 7 ngày cho log group lớn: storage chỉ giữ 7 ngày thay vì 1 năm.
4. Subscription filter đẩy log qua Firehose sang S3. S3 rẻ hơn nhiều so với CloudWatch Logs; lifecycle chuyển bản cũ sang lớp rẻ hơn.
5. Khi audit, dùng Athena query S3; khi debug gần đây, dùng Logs Insights trên 7 ngày còn trong CloudWatch.

### Ví dụ cụ thể
Nếu bỏ 60% log debug, ingest còn khoảng 4,8 TB/ngày, tiết kiệm lớn nhất. Retention 7 ngày thay vì 1 năm cắt phần storage. Log audit nằm trong S3 dưới dạng nén, query Athena theo ngày khi cần. Ba thay đổi cộng lại giảm chi phí mạnh hơn chỉ làm một việc.

### Vì sao A và B đúng
- **A:** retention ngắn + archive S3 + Athena giữ đúng khả năng query 7 ngày và lưu 1 năm với chi phí thấp.
- **B:** giảm ingest là cách tấn công gốc rễ; EMF giữ metric cần thiết mà không cần log thừa.

### Lỗi hay gặp
- **Chỉ đổi retention mà không giảm ingest:** hoá đơn ingest vẫn cao.
- **Archive toàn bộ log không lọc:** vẫn tốn S3 và công query; nên lọc bỏ debug trước khi gửi.
- **Dùng Logs Insights quét cả năm:** chi phí scan tăng mạnh; query trên S3/Athena thường rẻ hơn cho dữ liệu cũ.
- **Quên lifecycle:** S3 Standard mãi sẽ tốn hơn; chuyển bản cũ sang Glacier/Intelligent-Tiering.

### Vì sao các phương án khác sai
- **C:** giữ 1 năm trên CloudWatch làm **tăng** chi phí storage, ngược mục tiêu.
- **D:** thêm metric filter không giảm ingest và còn quét thêm dữ liệu log.
- **E:** tắt mã hoá không làm giảm phí ingest và vi phạm yêu cầu bảo mật.

> Exam tip: tối ưu CloudWatch Logs = **giảm ingest** (bỏ log thừa, EMF) + **retention ngắn** + **archive S3/Athena** cho lưu dài. Đừng nhầm với OpenSearch UltraWarm.`,
  services: ['Amazon CloudWatch Logs', 'Amazon CloudWatch', 'Amazon S3', 'Amazon Athena'],
},
{
  id: 'sap-148', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company runs a Java 17 AWS Lambda function that performs a CPU-bound JSON transformation. The function is invoked about 40 million times per month, uses 1,024 MB of memory, and averages 900 ms per invocation. Traffic is steady during business hours and low at night. The team wants to reduce the monthly cost with minimal changes to code and architecture, and without a latency regression. Which solution will reduce the cost the MOST?`,
  options: [
    "Increase the memory to 3,008 MB so that each invocation finishes faster.",
    "Run AWS Lambda Power Tuning to find the best memory size, switch the function to the arm64 architecture, and purchase a Compute Savings Plan for the baseline usage.",
    "Enable provisioned concurrency for the peak concurrency during the whole day.",
    "Move the function to Amazon ECS on AWS Fargate with two tasks that run continuously."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Ba thay đổi cộng lại: dùng **AWS Lambda Power Tuning** để chọn memory tối ưu, chuyển hàm sang **arm64** để giảm khoảng 20% giá GB-giây, và mua **Compute Savings Plan** cho phần sử dụng ổn định. Không đổi kiến trúc, không cần quản lý server.

**Từ khoá:** "40 million invocations", "CPU-bound", "1,024 MB", "900 ms", "minimal changes", "no latency regression" → Power Tuning + arm64 + Savings Plan.

**Thuật ngữ:**
- **Lambda pricing:** trả tiền theo số request và **GB-giây** (memory × thời gian chạy). Ví dụ 1 GB chạy 1 giây là 1 GB-giây.
- **Memory size:** Lambda cấp CPU tỉ lệ với memory; tăng memory có thể giảm thời gian chạy nhưng tăng giá mỗi giây.
- **arm64/Graviton:** kiến trúc CPU của AWS; Lambda tính giá GB-giây thấp hơn khoảng 20% so với x86.
- **Lambda Power Tuning:** công cụ mã nguồn mở dùng Step Functions chạy hàm ở nhiều mức memory để tìm điểm chi phí/độ trễ tốt nhất.
- **Compute Savings Plan:** cam kết chi tiêu theo giờ để đổi lấy giá thấp hơn cho Lambda, Fargate và EC2.
- **Provisioned concurrency:** giữ sẵn một số instance đã khởi tạo để giảm cold start; tính phí cả khi không có request.

### Cơ chế hoạt động
1. Chi phí hiện tại xấp xỉ: 40 triệu × 0,9 giây × 1 GB = 36 triệu GB-giây. Với giá tham khảo 0,0000166667 USD/GB-giây, riêng compute khoảng 600 USD/tháng; request khoảng 8 USD.
2. Power Tuning chạy hàm với nhiều mức memory (ví dụ 512 MB đến 3.008 MB), đo thời gian và tính chi phí từng mức. Có thể phát hiện mức 1.769 MB chạy nhanh hơn đủ để rẻ hơn 1.024 MB.
3. Chuyển sang arm64 nếu dependencies tương thích; giá GB-giây giảm khoảng 20%.
4. Compute Savings Plan giảm thêm khoảng 17% cho phần sử dụng đều. Phần ban đêm ít traffic vẫn trả theo mức giá đã cam kết, nhưng tổng thể vẫn giảm.
5. Kết hợp ba bước thường giảm 40-60% chi phí mà không đổi code logic hay kiến trúc.

### Ví dụ cụ thể
Nếu Power Tuning tìm ra 1.769 MB với 500 ms: 40 triệu × 0,5 giây × 1,769 GB ≈ 35,4 triệu GB-giây, gần như không tăng; arm64 giảm 20% còn khoảng 28 triệu GB-giây tương đương giá; Savings Plan giảm thêm 17%. Tổng chi phí giảm đáng kể so với 36 triệu GB-giây ban đầu. Nếu chỉ tăng memory mà thời gian không giảm tương ứng, chi phí có thể tăng.

### Vì sao B đúng
- Power Tuning là cách đo thay vì đoán memory.
- arm64 giảm giá trực tiếp trên mỗi GB-giây.
- Savings Plan giảm giá phần chạy đều.
- Không đổi code/kiến trúc, không thêm server.

### Lỗi hay gặp
- **Tăng memory không đo:** memory × thời gian có thể tăng dù thời gian giảm; luôn đo bằng Power Tuning.
- **arm64 không tương thích:** thư viện native hoặc binary phải có bản arm64; kiểm tra trước khi chuyển.
- **Savings Plan cam kết quá cao:** chỉ mua cho mức sử dụng chắc chắn, tránh trả tiền cho phần không dùng.
- **Provisioned concurrency cho toàn ngày:** rất tốn nếu traffic ban đêm thấp; chỉ dùng khi cold start ảnh hưởng SLA.

### Vì sao các phương án khác sai
- **A:** tăng memory có thể giảm thời gian nhưng không chắc giảm chi phí; nếu thời gian không giảm theo tỉ lệ, GB-giây tăng và hoá đơn tăng. Đây là thay đổi chưa đo.
- **C:** provisioned concurrency chủ yếu giảm cold start, không phải công cụ giảm chi phí; giữ concurrency suốt ngày với traffic thấp còn làm tăng hoá đơn.
- **D:** chuyển sang Fargate là thay đổi kiến trúc, cần container và autoscaling; hai task chạy liên tục không đủ xử lý 40 triệu invocation và không phải thay đổi tối thiểu.

> Exam tip: tối ưu Lambda = **đo bằng Power Tuning** + **arm64** + **Savings Plan**, không mặc định tăng memory. Provisioned concurrency là công cụ latency, không phải công cụ cost.`,
  services: ['AWS Lambda', 'AWS Lambda Power Tuning', 'AWS Compute Savings Plans', 'Amazon CloudWatch'],
},
{
  id: 'sap-149', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company runs an image-processing worker as an Amazon ECS service on AWS Fargate. Work arrives in an Amazon SQS queue in unpredictable bursts, and the service currently runs a fixed 40 tasks. During bursts the queue grows to hundreds of thousands of messages and operators scale tasks manually; during quiet periods the tasks sit idle. The company wants automatic scaling that follows the backlog with the least operational effort. Which solution meets these requirements?`,
  options: [
    "Use an Application Auto Scaling target tracking policy on a custom backlog-per-task metric, defined as ApproximateNumberOfMessagesVisible divided by the number of running tasks, with a scale-in cooldown.",
    "Use a scheduled scaling policy that increases the task count at 08:00 and decreases it at 20:00.",
    "Replace Fargate with EC2 instances and use a step scaling policy based on CPU utilization.",
    "Set the desired count to 400 tasks so that the queue never grows."
  ],
  answer: 0,
  explain: `**Tóm tắt:** Scale ECS service theo **backlog per task**: lấy số message đang chờ chia cho số task đang chạy, đặt target tracking trên metric đó. Khi backlog mỗi task vượt ngưỡng, Application Auto Scaling thêm task; khi giảm, scale in với cooldown chống dao động.

**Từ khoá:** "unpredictable bursts", "queue grows", "manual scaling", "idle when quiet", "least operational effort" → target tracking trên backlog per task.

**Thuật ngữ:**
- **ECS:** dịch vụ chạy container; task là một đơn vị container đang chạy.
- **Fargate:** chế độ chạy container không cần quản lý EC2; mỗi task được cấp CPU/RAM riêng.
- **Application Auto Scaling:** dịch vụ điều chỉnh số task của ECS service theo policy.
- **Target tracking:** giữ một metric quanh giá trị mục tiêu, tự thêm/bớt task.
- **Custom metric:** metric do bạn định nghĩa, có thể tính bằng metric math từ nhiều metric khác.
- **Backlog per task:** số message chờ chia số task; phản ánh mỗi task còn bao nhiêu việc.
- **Cooldown:** khoảng chờ sau một lần scale để tránh scale liên tục.

### Cơ chế hoạt động
1. Tạo metric math: {{ApproximateNumberOfMessagesVisible}} chia cho số task đang chạy.
2. Tạo target tracking policy với target, ví dụ 100 message/task.
3. Nếu backlog là 8.000 message và đang có 40 task, mỗi task 200 message — gấp đôi target. Application Auto Scaling tăng số task lên khoảng 80 (trong giới hạn max).
4. Khi queue về gần 0, backlog/task giảm; policy scale in nhưng có cooldown để tránh tắt vội khi burst mới đến.
5. Không cần người trực; số task bám theo tải thực tế thay vì CPU.

### Ví dụ cụ thể
40 task, queue 40.000 message: backlog/task = 1.000, target 100 → cần khoảng 400 task. Max capacity nên đặt đủ cao để đáp ứng burst lớn nhất. Khi queue cạn, backlog/task về dưới 100 và service scale in dần.

### Vì sao A đúng
- Backlog là tín hiệu trực tiếp của công việc còn tồn, đúng với worker lấy việc từ queue.
- Target tracking tự động thêm/bớt task, giảm can thiệp tay.
- Cooldown tránh co giãn liên tục.
- Fargate không cần quản lý server, phù hợp "least operational effort".

### Lỗi hay gặp
- **Chỉ dùng message visible:** message đang được xử lý không còn visible; nên cân nhắc cả {{ApproximateNumberOfMessagesNotVisible}} hoặc dùng metric phù hợp để không scale in khi đang có nhiều việc.
- **Max capacity quá thấp:** burst lớn vẫn làm queue dài; đặt max đủ cao và kiểm tra quota.
- **Cooldown quá ngắn:** task nhảy lên xuống liên tục, tốn chi phí khởi tạo.
- **Scale theo CPU:** worker chờ I/O hoặc chờ queue thường có CPU thấp, scale theo CPU sẽ không đủ task.

### Vì sao các phương án khác sai
- **B:** lịch cố định không khớp burst bất định; đỉnh có thể xảy ra ban đêm hoặc cuối tuần.
- **C:** đổi sang EC2 không giải quyết tín hiệu scaling sai; CPU thấp trong khi queue dài vẫn không scale.
- **D:** 400 task cố định lãng phí nghiêm trọng lúc rảnh và vẫn có thể không đủ khi burst lớn.

> Exam tip: "queue-based worker" → scale theo **backlog per task/instance**, không theo CPU. Với Lambda dùng concurrency/queue; với ECS/ASG dùng target tracking trên custom metric.`,
  services: ['Amazon ECS', 'Application Auto Scaling', 'Amazon SQS', 'Amazon CloudWatch'],
},
{
  id: 'sap-150', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company runs an Amazon MSK cluster for an event stream of about 6 TB per day. After production incidents, consumers must be able to replay events for up to 30 days. Today topic retention is limited by broker EBS storage, and finance will not approve adding more brokers because throughput and latency requirements are already met. Which solution is the MOST cost-effective?`,
  options: [
    "Enable Amazon MSK tiered storage and set topic retention to 30 days, keeping broker storage sized only for hot data.",
    "Add ten more brokers with larger EBS volumes and keep replication factor 3.",
    "Reduce the retention period to three days and rely on consumer-side backups for replays.",
    "Move the topics to Amazon SQS with a 14-day retention period."
  ],
  answer: 0,
  explain: `**Tóm tắt:** Bật **MSK tiered storage**, đặt retention 30 ngày và chỉ giữ dữ liệu nóng trên broker. Segment cũ được chuyển sang storage do AWS quản lý, nên không phải thêm broker hay EBS mà consumer vẫn replay được 30 ngày.

**Từ khoá:** "6 TB/ngày", "replay 30 ngày", "retention giới hạn bởi EBS broker", "không thêm broker", "cost-effective nhất" → MSK tiered storage.

**Thuật ngữ:**
- **Kafka:** nền tảng log phân tán; producer ghi event vào topic, consumer đọc theo offset và có thể đọc lại.
- **Broker:** một node Kafka lưu partition và phục vụ đọc/ghi.
- **Partition:** đơn vị song song của topic; mỗi partition là một log có thứ tự.
- **Retention:** thời gian hoặc dung lượng dữ liệu được giữ trong topic.
- **EBS:** ổ đĩa gắn vào broker; dung lượng EBS quyết định lượng dữ liệu broker giữ được.
- **Tiered storage:** tách dữ liệu cũ sang lớp lưu trữ rẻ, chỉ giữ dữ liệu nóng trên broker.
- **Replay:** consumer đọc lại event cũ từ đầu hoặc từ offset cũ, thường dùng sau sự cố.

### Cơ chế hoạt động
1. Kafka chia log thành segment. Segment đang ghi là hot, nằm trên EBS của broker.
2. Khi segment đóng lại, tiered storage chuyển nó sang storage do AWS quản lý, dựa trên S3.
3. Broker chỉ giữ một cửa sổ dữ liệu nóng, ví dụ vài giờ hoặc vài ngày, đủ cho throughput và latency hiện tại.
4. Consumer đọc dữ liệu cũ vẫn dùng Kafka API; broker lấy segment từ tiered storage khi cần, trong suốt với ứng dụng.
5. Retention 30 ngày được đặt ở topic; không cần tăng số broker hay EBS.

### Ví dụ cụ thể
6 TB/ngày × 30 ngày = 180 TB dữ liệu logic; với replication factor 3, nếu giữ toàn bộ trên broker cần khoảng 540 TB EBS, rất tốn kém. Với tiered storage, broker chỉ giữ vài ngày gần nhất; phần còn lại nằm ở lớp rẻ. Consumer sau sự cố vẫn replay từ offset 30 ngày trước.

### Vì sao A đúng
- Giải quyết đúng nguyên nhân: retention bị giới hạn bởi EBS broker.
- Không thêm broker, không tăng compute, đúng ràng buộc của finance.
- Không đổi code consumer, vẫn replay qua Kafka API.
- Chi phí lưu trữ dài hạn thấp hơn nhiều so với EBS.

### Lỗi hay gặp
- **Nghĩ tiered storage tăng tốc độ:** nó chủ yếu giảm chi phí lưu trữ; dữ liệu cũ đọc sẽ chậm hơn dữ liệu nóng.
- **Không kiểm tra phiên bản MSK:** tiered storage chỉ có trên các phiên bản MSK hỗ trợ; kiểm tra trước khi bật.
- **Đặt retention quá dài cho mọi topic:** chỉ topic cần replay dài mới bật; topic khác giữ ngắn để giảm chi phí.
- **Quên replication:** dữ liệu tiered vẫn cần đảm bảo độ bền theo yêu cầu; kiểm tra cấu hình topic.

### Vì sao các phương án khác sai
- **B:** thêm 10 broker + EBS lớn làm tăng cả compute lẫn storage, đúng khoản finance từ chối, trong khi hiệu năng đã đủ.
- **C:** giảm retention còn 3 ngày vi phạm yêu cầu replay 30 ngày; backup phía consumer không thay được Kafka replay.
- **D:** SQS không phải Kafka, giữ tối đa 14 ngày (standard), không có consumer group replay và cần viết lại ứng dụng.

> Exam tip: "Kafka retention dài, không muốn thêm broker" → **MSK tiered storage**. "Cần đọc lại theo nhiều consumer độc lập" là lý do chọn Kafka/MSK thay vì SQS.`,
  services: ['Amazon MSK', 'MSK tiered storage', 'Amazon S3'],
},
{
  id: 'sap-151', exam: 'sap-c02', domain: 'sap-d4',
  q: `A bank runs a 4-million-line COBOL core banking application on an on-premises mainframe. The bank must exit the data center within 14 months, wants to keep the COBOL business logic and batch jobs mostly unchanged, and wants a managed runtime with automated deployment, patching and high availability on AWS. The team has no mainframe administration skills in the cloud. Which migration approach and service should a solutions architect recommend?`,
  options: [
    "Rehost the mainframe LPARs to Amazon EC2 and keep the z/OS operating system and middleware unchanged.",
    "Use AWS Mainframe Modernization in the replatform pattern with a compatible runtime, migrating the COBOL applications and JCL with the service's analysis and deployment tooling.",
    "Refactor the entire application into microservices on Amazon EKS within 14 months with the existing team.",
    "Repurchase a SaaS core banking product and rewrite every interface before the deadline."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Chọn **AWS Mainframe Modernization** theo hướng **replatform**: giữ COBOL và JCL, chạy trên runtime tương thích do AWS quản lý (Micro Focus, nay thuộc OpenText), với công cụ phân tích, triển khai, vá lỗi và HA nhiều AZ.

**Từ khoá:** "COBOL + JCL giữ gần nguyên", "managed runtime", "deployment/patching/HA", "14 tháng", "không có kỹ năng mainframe trên cloud" → replatform.

**Thuật ngữ:**
- **Mainframe:** máy chủ rất lớn xử lý giao dịch ngân hàng, thường chạy z/OS.
- **LPAR:** phân vùng logic của mainframe, giống một máy ảo độc lập.
- **z/OS:** hệ điều hành của mainframe IBM.
- **COBOL:** ngôn ngữ lập trình lâu đời dùng nhiều trong ngân hàng, bảo hiểm.
- **JCL:** Job Control Language, ngôn ngữ mô tả job batch trên mainframe.
- **Replatform:** giữ phần lớn code, đổi nền tảng chạy sang môi trường mới.
- **Refactor:** viết lại code sang ngôn ngữ/kiến trúc mới, ví dụ COBOL sang Java.
- **M2 runtime environment:** môi trường chạy do AWS Mainframe Modernization quản lý.

### Cơ chế hoạt động
1. Công cụ phân tích của M2 quét COBOL, copybook, JCL và dependency để lập báo cáo và kế hoạch chuyển.
2. Chọn runtime tương thích (Micro Focus/OpenText Enterprise Server) để chạy COBOL gần như nguyên bản.
3. JCL và batch được chuyển sang môi trường M2; dữ liệu được migrate sang storage phù hợp.
4. M2 runtime environment chạy trên hạ tầng AWS, AWS lo vá, backup, HA nhiều AZ và triển khai phiên bản mới.
5. Đội ngũ không phải quản trị z/OS hay mainframe; chỉ vận hành ứng dụng và batch.

### Ví dụ cụ thể
4 triệu dòng COBOL, hàng trăm job JCL. Nếu refactor sang Java, mỗi module phải viết lại, kiểm thử nghiệp vụ và đối chiếu kết quả — khó trong 14 tháng. Replatform giữ code, chuyển runtime và JCL, nên rủi ro thấp hơn và đáp ứng hạn exit data center.

### Vì sao B đúng
- Giữ COBOL/JCL gần nguyên, đúng ràng buộc nghiệp vụ.
- Runtime do AWS quản lý, có vá lỗi và HA.
- Công cụ phân tích và triển khai giảm công sức so với tự dựng.
- Phù hợp hạn 14 tháng và đội chưa có kỹ năng mainframe trên cloud.

### Lỗi hay gặp
- **Nhầm replatform với refactor:** replatform giữ code; refactor chuyển sang Java, thời gian và rủi ro lớn hơn nhiều.
- **Nghĩ có thể chạy z/OS trên EC2:** mainframe không phải workload chạy nguyên hệ điều hành trên EC2.
- **Bỏ qua kiểm thử batch:** JCL và batch cần đối chiếu kết quả trước khi cutover.
- **Không tính thời gian phân tích dependency:** giai đoạn assessment có thể chiếm vài tháng trong hạn 14 tháng.

### Vì sao các phương án khác sai
- **A:** không thể chạy z/OS nguyên bản trên EC2; rehost mainframe theo nghĩa "giữ nguyên OS" không khả thi.
- **C:** refactor toàn bộ 4 triệu dòng trong 14 tháng với đội nhỏ là rủi ro rất cao, trái yêu cầu giữ logic.
- **D:** mua SaaS và viết lại mọi interface là dự án nhiều năm, vượt hạn và thay đổi nghiệp vụ.

> Exam tip: "COBOL, giữ code, managed runtime" → Mainframe Modernization **replatform**. "Chuyển sang Java, hiện đại hoá sâu" → **refactor** (Blu Age).`,
  services: ['AWS Mainframe Modernization', 'Amazon EC2', 'Elastic Load Balancing'],
},
{
  id: 'sap-152', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company has 35 legacy applications: 20 ASP.NET applications on IIS with Windows Server 2016 and 15 Java applications on Apache Tomcat. The company wants to containerize the applications and run them on Amazon ECS with the least code change. The platform team has limited container experience and wants generated Dockerfiles, image builds, task definitions and CI/CD pipeline artifacts instead of writing them by hand. Which solution meets these requirements with the LEAST effort?`,
  options: [
    "Use AWS Application Migration Service to replicate the servers to Amazon EC2 and run the applications unchanged on the same operating systems.",
    "Use AWS App2Container to inventory and analyze each application, generate Dockerfiles, container images, ECS task definitions and pipeline artifacts, then deploy the Windows images to ECS on Windows container instances and the Java images to ECS on Linux instances.",
    "Rewrite all applications as serverless AWS Lambda functions with Amazon API Gateway in front of them.",
    "Use AWS Mainframe Modernization to convert the applications to Java and run them on the managed runtime."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng **AWS App2Container**: công cụ phân tích ứng dụng đang chạy trên máy chủ rồi **tự sinh** Dockerfile, image, **ECS task definition** và artifact cho **CodePipeline/CodeBuild**. Ứng dụng .NET Framework trên IIS chạy trên **Windows container instances** của ECS, ứng dụng Java/Tomcat chạy trên Linux container instances — gần như không phải sửa code.

**Từ khoá:** "ASP.NET/IIS + Java/Tomcat", "containerize", "least code change", "generated Dockerfiles, task definitions, CI/CD", "team ít kinh nghiệm container" → **AWS App2Container**.

**Thuật ngữ:**
- **Container:** cách đóng gói ứng dụng cùng thư viện vào một image chạy độc lập, nhẹ hơn máy ảo vì dùng chung kernel. Ví dụ: thay vì cài Tomcat trên từng server, đóng cả Tomcat + app vào một image.
- **Dockerfile:** file văn bản mô tả cách dựng image, ví dụ "từ base image Windows, copy thư mục web, mở port 80".
- **Container image:** kết quả sau khi build Dockerfile; đẩy lên registry (Amazon ECR) rồi ECS kéo về chạy.
- **ECS task definition:** bản khai báo cho ECS biết image nào, bao nhiêu CPU/RAM, port, biến môi trường, log đi đâu.
- **Amazon ECS:** dịch vụ chạy container. Có hai kiểu hạ tầng: **EC2 launch type** (bạn tự quản lý instance) và **Fargate** (AWS quản lý máy, bạn chỉ trả tiền tài nguyên container).
- **Windows container:** container dùng Windows kernel, chỉ chạy được trên **Windows host**. **AWS Fargate không hỗ trợ Windows container**, nên ứng dụng .NET Framework phải chạy trên ECS với Windows EC2 instance (tùy chọn Fargate chỉ dành cho container Linux).
- **App2Container:** công cụ CLI của AWS, quét máy chủ, phát hiện ứng dụng, rồi sinh toàn bộ bộ khung container hóa.
- **CodePipeline / CodeBuild:** dịch vụ CI/CD; App2Container sinh sẵn file cấu hình pipeline để build image và deploy.

### Cơ chế hoạt động
1. Cài App2Container trên máy chủ nguồn (Windows cho IIS/.NET, Linux cho Tomcat). Lệnh {{inventory}} liệt kê ứng dụng đang chạy và port.
2. Lệnh {{analyze}} kiểm tra phụ thuộc: phiên bản .NET/JRE, thư viện, biến môi trường, file cấu hình, cổng lắng nghe. Nó báo những gì cần chỉnh tay.
3. Lệnh {{containerize}} sinh **Dockerfile**, dựng **container image**, và tạo **ECS task definition** + file triển khai (CloudFormation) cùng cấu hình pipeline.
4. Đẩy image lên **Amazon ECR**, deploy lên ECS. Với 20 app .NET Framework, chọn **Windows container instances** cho cluster; với 15 app Java, chọn Linux instances (hoặc Fargate).
5. Pipeline build lại image mỗi lần commit, chạy test, rồi cập nhật ECS service.

### Ví dụ cụ thể
Một app ASP.NET MVC trên IIS phát hiện port 8080, dùng .NET Framework 4.8. App2Container sinh Dockerfile dựa trên base image Windows Server, task definition 2 vCPU/4 GB, và một pipeline CodePipeline. Image được đẩy vào ECR; ECS service chạy 3 task trên Windows container instances phía sau một Application Load Balancer. App Tomcat tương tự nhưng base image Linux và có thể chạy Fargate, không phải vá OS.

### Vì sao B đúng
- Sinh đúng những artifact đề yêu cầu: Dockerfile, image, task definition, pipeline — không phải viết tay.
- Hỗ trợ đúng hai nền tảng trong đề: **.NET Framework trên IIS** và **Java trên Tomcat**.
- Giữ nguyên code ứng dụng, chỉ đóng gói lại — đúng "least code change".
- Chọn đúng loại hạ tầng cho từng nhóm: Windows container instances cho .NET, Linux cho Java.

### Lỗi hay gặp
- **Định chạy .NET Framework trên Fargate:** Fargate không hỗ trợ Windows container; phải dùng ECS trên Windows EC2 instance.
- **Bỏ qua bước analyze:** app có dependency gắn với máy chủ (COM component, registry, đường dẫn tuyệt đối, chứng chỉ trong store) sẽ lỗi khi chạy container; phải xử lý các cảnh báo.
- **Quên cấu hình log và health check:** task definition sinh tự động vẫn cần sửa để log về CloudWatch và health check đúng path.
- **Giả định container hóa là miễn phí vận hành:** vẫn phải quản lý image, base image patch (nhất là Windows), và kích thước image.
- **Nghĩ App2Container chuyển sang microservices:** nó chỉ đóng gói, không tách monolith.

### Vì sao các phương án khác sai
- **A:** AWS Application Migration Service (MGN) là **rehost** — replicate nguyên server sang EC2, vẫn chạy Windows Server/IIS và Tomcat như cũ. Không containerize, không sinh Dockerfile hay pipeline, và vẫn phải vá OS.
- **C:** viết lại 35 app thành Lambda là thay đổi kiến trúc và code rất lớn, trái "least code change" và không phù hợp với app IIS/.NET Framework cũ.
- **D:** AWS Mainframe Modernization dành cho ứng dụng mainframe (COBOL, PL/I, JCL), không áp dụng cho ASP.NET hay Tomcat.

> Exam tip: "containerize IIS/.NET hoặc Tomcat, sinh Dockerfile + task definition + pipeline" → **App2Container**. Nhớ bẫy: **Fargate không chạy Windows container**. "Rehost nguyên server" → MGN. "Chuyển COBOL" → Mainframe Modernization.`,
  services: ['AWS App2Container', 'Amazon ECS', 'Amazon ECR', 'AWS CodePipeline'],
},
{
  id: 'sap-153', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company wants to move a 12-year-old Java monolith from its data center to AWS within nine months. Rather than a big rewrite, the company will extract one business capability at a time into a separate microservice, send a small percentage of production traffic to the new service, compare error rates, and shift all traffic back to the monolith instantly if the new service misbehaves. The monolith continues to serve every capability that has not been extracted yet, and the two sides must be able to call each other. The company wants managed routing and connectivity with the least custom code. Which solution meets these requirements?`,
  options: [
    "Rewrite every capability as a microservice on Amazon EKS and cut the monolith over to the new platform in a single release.",
    "Rehost the monolith on Amazon EC2 behind an Application Load Balancer and postpone all modernization to a big-bang rewrite two years later.",
    "Create an AWS Migration Hub Refactor Spaces environment, add the monolith and each new microservice as services of the same application, create routes for the extracted paths, and shift traffic gradually through the environment's built-in routing with one-step rollback.",
    "Replicate the monolith database to Amazon Aurora with AWS Database Migration Service and implement the new capabilities as stored procedures inside the database."
  ],
  answer: 2,
  explain: `**Tóm tắt:** Dùng **AWS Migration Hub Refactor Spaces** — dịch vụ dựng sẵn hạ tầng cho mô hình **strangler fig**: monolith và microservice mới cùng nằm trong một *application*, request đi qua **API Gateway** do Refactor Spaces tạo, route theo đường dẫn và **chuyển % traffic** dần sang service mới, đổi ngược lại trong một bước khi lỗi tăng.

**Từ khoá:** "extract one capability at a time", "small percentage of traffic", "instant rollback", "monolith vẫn phục vụ phần còn lại", "managed routing, least custom code" → **AWS Migration Hub Refactor Spaces**.

**Thuật ngữ:**
- **Monolith:** ứng dụng để toàn bộ chức năng trong một khối, deploy chung một lần. Ví dụ: một file WAR chứa cả đơn hàng, thanh toán, kho.
- **Microservice:** chức năng tách thành service riêng, deploy và scale độc lập.
- **Strangler fig (cây si bóp chết cây chủ):** thay dần từng phần của hệ cũ bằng hệ mới, phần mới lớn dần cho tới khi hệ cũ không còn dùng; không cần dừng hệ thống để "đập đi xây lại".
- **Traffic shifting:** gửi 5% rồi 10%, 50%, 100% request sang service mới, theo dõi lỗi trước khi tăng.
- **Refactor Spaces environment:** môi trường mạng và routing do AWS tạo, gồm **Transit Gateway** nối mạng giữa các service và **API Gateway** làm cửa vào duy nhất.
- **Application / service / route:** trong Refactor Spaces, *application* là nhóm; *service* là monolith hoặc microservice (Lambda, ECS, EKS, hoặc một URL endpoint); *route* khai báo đường dẫn nào đi tới service nào và bao nhiêu % traffic.
- **Rollback:** đổi tỉ lệ traffic về 0% cho service mới, không cần deploy lại.

### Cơ chế hoạt động
1. Tạo **environment** — Refactor Spaces cấp Transit Gateway, VPC và API Gateway entry point.
2. Tạo **application**, thêm **service** đầu tiên là monolith (ví dụ ECS service hoặc URL của ứng dụng đã rehost).
3. Khi một capability được viết lại thành microservice, thêm nó làm service thứ hai và tạo **route** cho path tương ứng, ví dụ {{/api/pricing/*}}.
4. Trên route, đặt tỉ lệ traffic ban đầu nhỏ (ví dụ 5%) sang microservice; phần còn lại vẫn về monolith.
5. Theo dõi error rate/latency qua CloudWatch; nếu ổn, tăng dần 25%, 50%, 100%. Nếu lỗi, đặt lại 0% — traffic quay về monolith ngay.
6. Hai bên gọi nhau qua mạng do environment cung cấp, không phải tự dựng service mesh hay VPN riêng.
7. Khi mọi capability đã chuyển xong, route mặc định trỏ hết về hệ mới và monolith được tắt.

### Ví dụ cụ thể
Monolith chạy trên ECS, phục vụ {{/api/orders}}, {{/api/pricing}}, {{/api/catalog}}. Team viết lại pricing thành Lambda. Route {{/api/pricing/*}}: 10% traffic sang Lambda, 90% về monolith. Sau 48 giờ lỗi không tăng, tăng lên 50% rồi 100%. Tuần sau pricing phát hiện bug ở một edge case: đổi route về 0%, người dùng quay lại dùng logic cũ ngay lập tức, không ai phải rollback deploy.

### Vì sao C đúng
- Quản lý **routing, traffic shifting và connectivity** sẵn, không phải tự viết API Gateway + Lambda để chia traffic.
- Hỗ trợ đúng cả monolith lẫn service mới trong cùng một application, giữ monolith phục vụ phần chưa tách.
- Rollback ở tầng route, không phải deploy lại.
- Giảm code và công vận hành so với tự dựng reverse proxy/mesh.

### Lỗi hay gặp
- **Nhầm Refactor Spaces với công cụ migration:** nó không chuyển dữ liệu hay server; monolith vẫn phải được đưa lên AWS trước (rehost/replatform) rồi mới đặt làm service.
- **Route quá rộng:** route {{/api/*}} cho microservice mới sẽ hút cả những path chưa chuyển; phải khai báo path hẹp.
- **Đo lỗi không đủ lâu:** tăng traffic quá nhanh khiến lỗi chỉ hiện ở tỉ lệ cao; cần giai đoạn quan sát theo SLA.
- **Bỏ quên dữ liệu:** tách service nhưng schema vẫn dùng chung có thể tạo coupling; cần kế hoạch tách dữ liệu dần.
- **Nghĩ Refactor Spaces thay thế thiết kế:** nó cung cấp "đường ống" chuyển đổi, quyết định ranh giới service và hợp đồng API vẫn là việc của team.

### Vì sao các phương án khác sai
- **A:** viết lại toàn bộ rồi cutover một lần là **big-bang**, rủi ro cao, không đáp ứng "chuyển dần + rollback tức thì", và vượt 9 tháng.
- **B:** rehost rồi hoãn hiện đại hóa không giải quyết yêu cầu tách capability; đến lúc rewrite vẫn phải làm lại từ đầu.
- **D:** giữ monolith nguyên và nhét logic mới vào stored procedure làm tăng coupling với database, không phải microservice, và không có cơ chế traffic shifting.

> Exam tip: "strangler fig, chuyển từng phần, chia % traffic, rollback nhanh, ít code routing" → **AWS Migration Hub Refactor Spaces**. "Chuyển server" → MGN. "Chuyển database" → DMS. "Chia traffic thủ công bằng ALB weighted target group" là cách tự chế, tốn công hơn.`,
  services: ['AWS Migration Hub Refactor Spaces', 'Amazon API Gateway', 'AWS Transit Gateway', 'Amazon ECS', 'AWS Lambda'],
},
{
  id: 'sap-154', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company operates an on-premises contact center with 800 agents and a legacy ACD. The company must migrate to a cloud contact center within 90 days, integrate with Salesforce so agents see the customer record during a call, add an IVR bot that can reset passwords, record and transcribe calls for quality analysis, and pay only for usage. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Build a custom contact center on the Amazon Chime SDK and host the media and routing servers on Amazon EC2.",
    "Use Amazon Connect with the Salesforce CTI adapter, an Amazon Lex bot inside the contact flow, and Contact Lens for recording analytics and transcription.",
    "Upgrade the on-premises ACD to the latest version and connect it to AWS with a SIP trunk.",
    "Use Amazon Pinpoint voice messages for calls and Amazon SES for agent email."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng **Amazon Connect** làm contact center đám mây trả theo mức dùng, gắn **Salesforce CTI adapter** để bật customer record khi có cuộc gọi, đặt **Amazon Lex bot** trong *contact flow* cho IVR hiểu ngôn ngữ tự nhiên (ví dụ reset mật khẩu), và bật **Contact Lens** để ghi âm, chuyển thành văn bản và phân tích chất lượng.

**Từ khoá:** "contact center 800 agents trong 90 ngày", "Salesforce screen pop", "IVR bot reset password", "record + transcribe", "pay per usage", "least overhead" → **Amazon Connect + Lex + Contact Lens**.

**Thuật ngữ:**
- **Contact center:** hệ thống nhận cuộc gọi/chat của khách và phân phối tới đội agent. Ví dụ: tổng đài chăm sóc khách hàng của ngân hàng.
- **ACD (automatic call distribution):** phần mềm xếp hàng và chia cuộc gọi cho agent rảnh; đây là thứ hệ thống on-prem hiện tại đang làm.
- **IVR (interactive voice response):** menu giọng nói "bấm 1 để…", hoặc bot hiểu câu nói tự nhiên.
- **CTI (computer telephony integration):** cầu nối giữa hệ thống điện thoại và phần mềm nghiệp vụ để khi chuông reo, màn hình agent tự mở hồ sơ khách (screen pop).
- **Contact flow:** sơ đồ xử lý cuộc gọi trong Amazon Connect (phát lời chào, hỏi, chuyển hàng đợi, gọi Lambda…), kéo thả không cần code.
- **Amazon Lex:** dịch vụ xây bot hiểu giọng nói/văn bản, dùng cùng công nghệ với Alexa; bot có *intent* (ý định) và *slot* (thông tin cần thu thập).
- **Contact Lens for Amazon Connect:** phân tích cuộc gọi bằng ML — transcript, sentiment, tìm từ khóa, che số thẻ; chạy trên bản ghi sẵn có.
- **Pay per usage:** trả theo phút thoại, số agent dùng, số phút phân tích; không mua thiết bị hay máy chủ.

### Cơ chế hoạt động
1. Tạo instance Amazon Connect, nhập số điện thoại (DID/toll-free) hoặc port số hiện có.
2. Thiết kế **contact flow**: chào → gọi **Lex bot** để hiểu yêu cầu → nếu là "reset mật khẩu", bot thu thập thông tin rồi gọi **Lambda** thực hiện; nếu cần người, chuyển vào hàng đợi có kỹ năng phù hợp.
3. Cài **Salesforce CTI adapter** trên máy agent (hoặc dùng CCP nhúng trong Salesforce). Khi cuộc gọi được kết nối, adapter dùng số điện thoại để tìm và mở bản ghi khách.
4. Bật **recording** cho cuộc gọi; **Contact Lens** tự transcribe, gắn nhãn chủ đề, tính sentiment và chấm điểm theo quy tắc (ví dụ agent phải chào đúng).
5. Quản trị viên xem dashboard real-time và lịch sử; thanh toán theo mức dùng hằng tháng.

### Ví dụ cụ thể
Khách gọi tổng đài lúc 21h. Contact flow phát lời chào, Lex hỏi "Anh/chị cần gì?"; khách nói "tôi quên mật khẩu". Bot xác minh email, gọi Lambda đặt lại mật khẩu, đọc mã tạm rồi kết thúc — không cần agent. Nếu khách nói "tôi muốn khiếu nại", bot chuyển vào hàng đợi "complaint"; agent nhận cuộc gọi, màn hình Salesforce tự mở hồ sơ khách. Bản ghi được Contact Lens transcribe và gắn nhãn "complaint" để QA lọc ra kiểm tra.

### Vì sao B đúng
- **Amazon Connect** là contact center managed, trả theo mức dùng, triển khai trong vài tuần — đúng 90 ngày.
- Adapter **Salesforce CTI** có sẵn đáp ứng screen pop, không phải tự viết tích hợp.
- **Lex** trong contact flow đáp ứng IVR hội thoại tự nhiên, có thể gọi Lambda cho hành động thật.
- **Contact Lens** lo ghi âm, transcript và phân tích chất lượng mà không phải dựng pipeline nhận dạng giọng nói.

### Lỗi hay gặp
- **Bỏ qua quy định ghi âm:** nhiều nước yêu cầu thông báo và đồng ý trước khi ghi âm; phải thêm bước thông báo trong contact flow.
- **Lex bot không hiểu tiếng Việt/ngôn ngữ thực tế:** phải huấn luyện intent và utterance đủ, kiểm thử với câu nói thật, có fallback chuyển agent.
- **Chỉ định tuyến theo số điện thoại:** nên dùng queue + routing profile theo kỹ năng để cân tải 800 agent.
- **Quên giới hạn quyền:** agent chỉ nên thấy dữ liệu cần thiết; dùng security profile và tag dữ liệu.
- **Tưởng Contact Lens thay QA:** nó tự động hóa chấm điểm, nhưng tiêu chí vẫn do người đặt.

### Vì sao các phương án khác sai
- **A:** Chime SDK là bộ **xây dựng** (building blocks) — vẫn phải tự làm ACD, ghi âm, routing, UI agent và vận hành media; vượt 90 ngày và overhead lớn, trái "least overhead".
- **C:** nâng cấp ACD on-prem không phải cloud contact center; vẫn quản trị thiết bị, không có Contact Lens/Lex sẵn, và SIP trunk chỉ là kết nối thoại.
- **D:** Pinpoint (SMS/voice message) và SES (email) là kênh gửi thông báo một chiều, không có hàng đợi, agent, screen pop hay phân tích cuộc gọi.

> Exam tip: "cloud contact center, pay-as-you-go, Salesforce screen pop, IVR, transcription" → **Amazon Connect + Lex + Contact Lens**. "Chỉ cần gửi SMS/voice OTP" → Pinpoint. "Tự xây media/routing" → Chime SDK.`,
  services: ['Amazon Connect', 'Amazon Lex', 'Contact Lens for Amazon Connect', 'AWS Lambda'],
},
{
  id: 'sap-155', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company runs a 250 TB on-premises Hadoop cluster with 400 MapReduce and Spark jobs. The cluster is at end of life, and the jobs must move to AWS within six months with minimal rewrites. Data scientists must query the data with SQL and Spark, and access must be enforced per business unit at the table and column level. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Copy HDFS to Amazon EBS volumes on a self-managed Hadoop cluster on Amazon EC2 and keep running the existing jobs there.",
    "Move the data to Amazon S3, register it in the AWS Glue Data Catalog, run the jobs on Amazon EMR, and enforce fine-grained access with AWS Lake Formation.",
    "Load the data into Amazon Redshift and rewrite the Spark and MapReduce jobs as stored procedures.",
    "Move the data to Amazon DynamoDB and run the jobs with AWS Lambda."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Đưa dữ liệu sang **Amazon S3**, đăng ký bảng trong **AWS Glue Data Catalog** (metastore tương thích Hive), chạy job **MapReduce/Spark** trên **Amazon EMR** gần như nguyên code, và dùng **AWS Lake Formation** cấp quyền theo **database/table/column** (kèm row filter) cho từng business unit.

**Từ khoá:** "250 TB Hadoop", "400 MapReduce/Spark", "minimal rewrites", "SQL + Spark", "table/column-level per business unit", "least operational overhead" → **S3 + Glue Catalog + EMR + Lake Formation**.

**Thuật ngữ:**
- **Hadoop:** nền tảng xử lý dữ liệu lớn gồm **HDFS** (lưu trữ phân tán) và **YARN** (quản lý tài nguyên), chạy các engine như MapReduce và Spark.
- **HDFS:** hệ file phân tán trên đĩa của các node; dữ liệu gắn với cụm, muốn scale phải thêm máy.
- **MapReduce:** mô hình xử lý hai bước map (biến đổi từng bản ghi) và reduce (tổng hợp theo khóa).
- **Apache Spark:** engine xử lý trong bộ nhớ, nhanh hơn MapReduce cho nhiều workload, hỗ trợ SQL, DataFrame, streaming.
- **Metastore:** danh mục mô tả bảng (tên, cột, kiểu, vị trí dữ liệu); Hive dùng metastore để biết "bảng orders nằm ở đâu".
- **Amazon EMR:** dịch vụ Hadoop/Spark managed — AWS lo cài đặt, vá lỗi, scale cụm; bạn cấu hình job và tắt cụm khi xong.
- **EMRFS:** lớp cho phép Spark/Hadoop đọc ghi **S3** như một filesystem, nên không cần HDFS.
- **AWS Glue Data Catalog:** metastore managed, tương thích Hive; EMR, Athena, Redshift Spectrum, Glue jobs cùng thấy chung bảng.
- **AWS Lake Formation:** lớp quản trị quyền trên data lake ở mức database, table, column và row; cấp quyền tập trung thay vì sửa policy từng job.

### Cơ chế hoạt động
1. Chuyển dữ liệu HDFS lên S3 (ví dụ bằng AWS DataSync hoặc Snowball cho 250 TB), chia theo prefix/bảng, định dạng columnar như Parquet để giảm chi phí quét.
2. Tạo bảng trong **Glue Data Catalog** (Crawler hoặc DDL). Vị trí bảng là {{s3://bucket/prefix}}, không phải đường dẫn HDFS.
3. Trỏ job Spark/MapReduce sang EMR; phần lớn code giữ nguyên, chỉ đổi input/output từ {{hdfs://}} sang {{s3://}} và cấu hình catalog.
4. Bật **Lake Formation** làm nguồn quyền cho catalog. Tạo database theo business unit, cấp SELECT trên một số cột; phần còn lại bị ẩn.
5. Data scientist query bằng **Athena** (SQL) hoặc **EMR/Spark**; cả hai đều đi qua Lake Formation để kiểm tra quyền.
6. Cụm EMR dùng transient (tạo cho mỗi batch rồi tắt) hoặc EMR on EKS; lưu trữ tách khỏi compute nên không phải giữ cụm chạy 24/7.

### Ví dụ cụ thể
Bảng {{sales.orders}} nằm ở {{s3://datalake/sales/orders/}}. Business unit "Finance" được cấp SELECT trên cột {{order_id, amount, region}}, bị ẩn cột {{customer_email}}. Khi analyst Finance chạy {{SELECT * FROM sales.orders}} trong Athena, Lake Formation chỉ trả các cột được phép. Một job Spark của Marketing cũng bị giới hạn tương tự, dù code không hề biết luật. Cụm EMR 20 node chỉ tồn tại 2 giờ cho batch đêm rồi terminate.

### Vì sao B đúng
- **EMR** chạy đúng engine Hadoop/Spark, giữ code gần như nguyên — đúng "minimal rewrites".
- **S3** tách storage khỏi compute: 250 TB không cần nằm trên EBS của cụm, scale độc lập và bền vững hơn HDFS.
- **Glue Data Catalog** là metastore tương thích Hive, SQL và Spark vẫn thấy bảng như trước.
- **Lake Formation** đáp ứng chính xác yêu cầu quyền theo **table/column** cho từng business unit, áp dụng cho mọi engine đọc catalog.
- Toàn bộ là dịch vụ managed, giảm công vá OS và vận hành cụm so với tự dựng Hadoop.

### Lỗi hay gặp
- **Giữ thói quen HDFS:** ghi trực tiếp bằng {{FileSystem}} mặc định có thể tạo ra commit chậm/không an toàn; bật **EMRFS** và committer phù hợp (S3A magic committer) khi ghi S3.
- **Quên tối ưu file nhỏ:** hàng triệu file nhỏ làm Spark chậm và tốn request; cần compact (ví dụ bằng Glue/Spark) và partition hợp lý.
- **Chỉ cấp quyền IAM:** Lake Formation là lớp quyền riêng; thiếu grant trong Lake Formation thì job vẫn bị từ chối dù IAM cho phép, và ngược lại.
- **Dùng console/engine không đi qua Lake Formation:** một số đường truy cập trực tiếp S3 bằng IAM sẽ bỏ qua luật cột; cần chặn đường vòng ở bucket policy.
- **Chọn định dạng CSV cho 250 TB:** tốn chi phí quét và chậm; nên dùng Parquet/ORC có partition.
- **Để cụm EMR chạy mãi:** chi phí compute lớn; dùng transient cluster hoặc auto-terminate.

### Vì sao các phương án khác sai
- **A:** tự dựng Hadoop trên EC2 + EBS chỉ là "nâng cụm cũ lên cloud": vẫn phải vá OS, quản lý HDFS, backup, và 250 TB trên EBS tốn kém, không co giãn; overhead cao nhất.
- **C:** Redshift mạnh cho SQL/BI nhưng phải viết lại Spark/MapReduce thành SQL/stored procedure và chuyển mô hình dữ liệu — trái "minimal rewrites" và 6 tháng.
- **D:** DynamoDB là key-value, không chạy Spark/MapReduce, không phù hợp phân tích 250 TB; Lambda có giới hạn thời gian và bộ nhớ.

> Exam tip: "Hadoop/Spark lên AWS, ít sửa code" → **EMR + S3**. "Cần phân quyền chi tiết trên data lake" → **Lake Formation** (table/column/row). "Chỉ SQL/BI dashboard" → Redshift. "Metastore dùng chung" → **Glue Data Catalog**.`,
  services: ['Amazon EMR', 'Amazon S3', 'AWS Glue', 'AWS Lake Formation'],
},
{
  id: 'sap-156', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company is retiring its on-premises VDI platform. It has 1,200 employees: 800 knowledge workers need a personal Windows desktop where installed applications, files and settings survive every logout; 400 task workers on three shifts only need a standard desktop that is reset to a clean state at the end of each session and stores nothing personal. All users must sign in with their existing Active Directory credentials, the company does not want to build or patch any VDI infrastructure, and it wants to pay monthly per desktop or per usage. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Build Remote Desktop Session Hosts on Amazon EC2 from a golden image behind an RD Gateway and a load balancer, and manage patching and scaling for the session hosts.",
    "Use Amazon WorkSpaces Personal for the 800 knowledge workers and Amazon WorkSpaces Pools for the 400 task workers, both joined to AWS Managed Microsoft AD that is connected to the on-premises forest.",
    "Use Amazon AppStream 2.0 for all 1,200 users from a single image and store user files in Amazon S3.",
    "Run Windows containers on Amazon ECS and let users connect to a container task with Remote Desktop."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Chia hai nhóm đúng theo tính chất phiên làm việc: **Amazon WorkSpaces Personal** cho 800 người cần desktop **persistent** (cài app, lưu file, giữ settings qua mỗi lần đăng nhập), và **Amazon WorkSpaces Pools** cho 400 người theo ca cần desktop **non-persistent** được trả về trạng thái sạch sau mỗi phiên. Cả hai join vào **AWS Managed Microsoft AD** nối với AD on-prem để dùng tài khoản hiện có, không phải tự dựng VDI.

**Từ khoá:** "personal desktop, settings survive logout" (800), "reset to clean state each session, stores nothing" (400), "existing AD credentials", "no VDI infrastructure", "pay per desktop or usage" → **WorkSpaces Personal + WorkSpaces Pools**.

**Thuật ngữ:**
- **VDI (Virtual Desktop Infrastructure):** hạ tầng cấp cho mỗi người dùng một desktop Windows chạy trên máy chủ trung tâm, người dùng kết nối từ xa. Ví dụ: nhân viên dùng laptop mỏng vẫn có desktop công ty đầy đủ.
- **Persistent desktop:** desktop "của riêng" một người; cài phần mềm, lưu file, đổi hình nền thì lần sau vẫn còn.
- **Non-persistent desktop:** desktop dùng chung từ một **pool**; mỗi phiên bắt đầu từ **golden image** sạch và mọi thay đổi bị xoá khi kết thúc — phù hợp quầy dịch vụ, tổng đài theo ca.
- **Golden image:** bản image chuẩn đã cài sẵn OS và phần mềm, dùng để tạo desktop hàng loạt.
- **Amazon WorkSpaces Personal:** desktop persistent managed, trả theo tháng hoặc theo giờ; mỗi người một desktop cố định, có thể chọn bundle cấu hình.
- **Amazon WorkSpaces Pools:** pool desktop non-persistent tạo từ image; người dùng đăng nhập nhận một desktop sạch, hết phiên thì desktop được trả lại pool.
- **AWS Managed Microsoft AD:** Active Directory do AWS quản lý, có thể tạo **trust** với AD on-prem để người dùng đăng nhập bằng tài khoản công ty và dùng chung policy/group.
- **AD Connector:** lựa chọn khác để nối thẳng vào AD on-prem không cần trust; nhưng nếu cần tin cậy hai chiều và quản trị tập trung thì Managed Microsoft AD phù hợp hơn.

### Cơ chế hoạt động
1. Tạo **AWS Managed Microsoft AD** trong VPC và thiết lập trust với AD on-prem; mở DNS/port cần thiết giữa hai bên.
2. Nhóm 800 knowledge worker: tạo **WorkSpaces Personal** với bundle (CPU/RAM/disk) phù hợp, gán cho từng user. Desktop tồn tại lâu dài, giữ nguyên app và dữ liệu ổ đĩa người dùng.
3. Nhóm 400 task worker: cài sẵn phần mềm chuẩn lên một WorkSpace, tạo **image**, rồi dựng **WorkSpaces Pools** từ image đó với số desktop đủ cho số người dùng đồng thời lớn nhất của ba ca.
4. Người dùng đăng nhập bằng WorkSpaces client (Windows/macOS/Linux/Web) với tài khoản AD; MFA có thể bật thêm.
5. Khi task worker đăng xuất hoặc phiên hết, desktop được **reboot/reset** về image, xoá dữ liệu cá nhân; desktop quay lại pool cho người ca sau.
6. Thanh toán theo desktop-tháng (Personal) và theo mức dùng pool (Pools); không có máy chủ broker, gateway hay host để vá.

### Ví dụ cụ thể
Ba ca, mỗi ca 140 task worker → pool cấu hình khoảng 150 desktop thay vì 400 desktop thường trực. Cuối ca, desktop reset; người ca sau nhận desktop sạch, không thấy file của người trước. Ngược lại, chị A ở nhóm knowledge worker cài phần mềm kế toán riêng và lưu file lên ổ D; hôm sau đăng nhập vẫn thấy nguyên. Cả hai nhóm dùng cùng tài khoản AD, nên group policy và quyền truy cập file server on-prem vẫn áp dụng.

### Vì sao B đúng
- Tách đúng hai loại phiên: **persistent** cho người cần giữ trạng thái, **non-persistent** cho người chỉ cần desktop sạch.
- WorkSpaces Pools tránh phải cấp 400 desktop thường trực cho workload theo ca, tiết kiệm chi phí.
- Dùng **AWS Managed Microsoft AD + trust** nên người dùng đăng nhập bằng tài khoản hiện có.
- Không phải dựng broker, gateway, host; AWS lo hạ tầng và vá OS nền.
- Mô hình giá đúng yêu cầu: theo desktop-tháng và theo mức dùng.

### Lỗi hay gặp
- **Cấp Personal cho cả 1.200 người:** 400 người theo ca chỉ dùng vài giờ/ngày, trả tiền desktop thường trực là lãng phí lớn.
- **Dùng Pools cho người cần dữ liệu cá nhân:** mọi thay đổi bị xoá khi reset; nhóm knowledge worker sẽ mất file và app đã cài.
- **Quên đồng bộ DNS giữa AD on-prem và Managed AD:** đăng nhập thất bại dù trust đã tạo; cần conditional forwarder đúng chiều.
- **Chọn subnet/AZ thiếu dung lượng:** WorkSpaces cần subnet có đủ IP; hết IP làm việc tạo desktop thất bại.
- **Bỏ qua MFA và chính sách truy cập:** desktop chứa dữ liệu công ty, nên bật MFA và giới hạn IP nếu cần.
- **Không tính chi phí image/build:** image phải cập nhật định kỳ khi có bản vá; nếu không, pool chạy phần mềm cũ.

### Vì sao các phương án khác sai
- **A:** dựng Remote Desktop Session Host trên EC2 (Microsoft Remote Desktop Services, **không phải** Amazon RDS) là tự làm VDI: phải quản lý broker, gateway, patching, backup, scaling và dung lượng — trái "không muốn dựng/patch hạ tầng VDI" và là overhead lớn nhất.
- **C:** AppStream 2.0 chủ yếu **stream ứng dụng** từ image dùng chung; không cấp desktop persistent cá nhân với app/settings riêng cho 800 người, và việc lưu file vào S3 không thay thế được profile desktop.
- **D:** container Windows không phải desktop VDI; người dùng không có phiên Windows đầy đủ, không có profile bền vững, và RDP vào container task không phải mô hình được hỗ trợ cho người dùng cuối.

> Exam tip: "personal desktop, giữ app/settings" → **WorkSpaces Personal**. "Theo ca, reset sạch mỗi phiên, không lưu dữ liệu" → **WorkSpaces Pools**. "Chỉ stream một ứng dụng" → AppStream 2.0. "Tự dựng session host" → trái least overhead.`,
  services: ['Amazon WorkSpaces', 'Amazon WorkSpaces Pools', 'AWS Managed Microsoft AD', 'Amazon VPC'],
}
);
