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
- **SCP không áp for management account.** Nếu cần chặn cả management account, phải dùng thêm bucket policy hoặc biện pháp khác.
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
- **Chọn sai chiến lược conflict:** mặc định có thể ghi đè; cần chọn Automerge hoặc custom resolver phù hợp nghiệp vụ.
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
  services: ['Amazon ECS', 'ECS Service Connect', 'AWS CloudMap', 'Amazon CloudWatch'],
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

### Vì sao A đúng
- I/O chiếm tới 45% chi phí -> chuyển sang I/O-Optimized là giảm chi phí mạnh nhất.
- Không cần thay đổi kiến trúc/ứng dụng.

### Lỗi hay gặp
- **Nghĩ là chuyển sang sẽ rẻ hơn mọi trường hợp:** Chỉ áp dụng khi I/O là chi phí lớn (thường > 25%).
- **Cần thay đổi ứng dụng/schema:** Không cần.

### Vì sao các phương án khác sai
- **B:** Giảm replica làm giảm tính sẵn sàng và khả năng scale đọc, vi phạm "does not want to change the availability".
- **C:** Giảm instance size có thể làm performance bị ảnh hưởng, vi phạm workload hiện tại.
- **D:** Auto Scaling instance không giảm phí I/O chính là nguyên nhân gây 45% chi phí.

> Exam tip: "I/O charges % of total cost" → Nếu > 25% thì **Aurora I/O-Optimized** là lựa chọn giảm chi phí nhất.`,
  services: ['Amazon Aurora', 'Aurora I/O-Optimized'],
},
{
  id: 'sap-147', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company needs to analyze log data generated by its application, which is stored in Amazon S3. The company needs to run SQL queries on the logs. Which solution provides the most cost-effective and efficient way to query this data?`,
  options: [
    "Load the log data into Amazon Redshift.",
    "Use Amazon Athena to query logs directly from S3.",
    "Use Amazon EMR to run Hive queries.",
    "Load the log data into Amazon RDS PostgreSQL."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Sử dụng **Amazon Athena** để chạy các truy vấn SQL trực tiếp trên dữ liệu log đã có sẵn trong S3. Đây là dịch vụ serverless, chỉ trả tiền trên lượng dữ liệu scan, cực kỳ hiệu quả về chi phí và không cần quản lý hạ tầng (serverless).

**Từ khoá:** "analyze log data", "stored in S3", "run SQL queries", "most cost-effective and efficient" → Amazon Athena.

**Thuật ngữ:**
- **Serverless:** Không cần quản lý server.
- **SQL query on S3:** Truy vấn trực tiếp dữ liệu dạng file (CSV, JSON, Parquet, log) mà không cần ETL.

**Giải thích:**
- **Athena:** Dịch vụ truy vấn serverless chạy trên dữ liệu S3 dùng SQL. Rất tiết kiệm vì không cần duy trì cluster (như Redshift/EMR) và không cần load dữ liệu (như RDS).
- **Redshift:** Dùng cho data warehousing, yêu cầu cluster và load dữ liệu (ETL), đắt hơn Athena cho log phân tích đơn lẻ.
- **EMR:** Cần cluster quản lý, overhead cao.
- **RDS:** Cần load dữ liệu, không tối ưu cho phân tích log trên S3.

> Exam tip: "Query S3 data with SQL serverless" → Athena.`,
  services: ['Amazon Athena', 'Amazon S3'],
},
{
  id: 'sap-148', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company is building an application that needs to store and query large amounts of structured and unstructured data. The application needs low-latency access to the data, and the data schema is constantly changing. Which database service is the best fit for this application?`,
  options: [
    "Amazon RDS PostgreSQL.",
    "Amazon DynamoDB.",
    "Amazon Redshift.",
    "Amazon Neptune."
  ],
  answer: 1,
  explain: `**Tóm tắt:** **Amazon DynamoDB** là NoSQL database hoàn hảo cho dữ liệu có cấu trúc thay đổi liên tục, cung cấp low-latency ở quy mô lớn (scaleable).

**Từ khoá:** "structured and unstructured", "low-latency", "schema is constantly changing" → DynamoDB.

**Thuật ngữ:**
- **NoSQL:** Database không theo mô hình quan hệ chặt chẽ, linh hoạt về schema.
- **Low-latency:** Phản hồi nhanh (thường tính bằng mili giây).

**Giải thích:**
- **DynamoDB:** NoSQL, schema-less (linh hoạt), latency rất thấp (single-digit ms), scale tốt.
- **RDS (PostgreSQL):** Quan hệ (RDBMS), schema chặt chẽ, không linh hoạt nếu schema đổi liên tục.
- **Redshift:** Data warehousing, không tối ưu cho low-latency query.
- **Neptune:** Graph database, không phù hợp cho nhu cầu general data storage.

> Exam tip: "Flexible schema + Low latency" → NoSQL (DynamoDB).`,
  services: ['Amazon DynamoDB'],
},
{
  id: 'sap-149', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company has an application that stores files in an S3 bucket. The application needs to be notified whenever a new file is uploaded to the S3 bucket. Which solution provides the most efficient, decoupled, and asynchronous way to handle these notifications?`,
  options: [
    "Write a Lambda function that polls the S3 bucket every minute.",
    "Configure S3 Event Notifications to send messages to an SQS queue, and have a consumer application read from the SQS queue.",
    "Use Amazon CloudWatch Events to monitor S3 API calls.",
    "Use Amazon Kinesis to stream all S3 API calls."
  ],
  answer: 1,
  explain: `**Tóm tắt:** **S3 Event Notifications** gửi tin nhắn ngay lập tức tới **SQS queue**, sau đó consumer đọc từ queue một cách bất đồng bộ và decoupled. Đây là mô hình "Event-driven" chuẩn trên AWS.

**Từ khoá:** "notified when new file", "efficient, decoupled, asynchronous" → S3 Event Notifications + SQS.

**Thuật ngữ:**
- **Event-driven:** Hệ thống tự phản ứng khi có sự kiện (ví dụ: upload file).
- **Decoupled:** Tách biệt thành phần sản sinh sự kiện và thành phần xử lý sự kiện.

**Giải thích:**
- **S3 Event -> SQS:** Là cách chuẩn để decoupled. SQS làm hàng đợi, consumer có thể xử lý theo tốc độ riêng (asynchronous).
- **Lambda polling:** Không hiệu quả (poll nhiều quá thì tốn, ít quá thì chậm).
- **CloudWatch Events:** Dùng cho sự kiện API, không phải sự kiện object S3 chính xác nhất (Event Notifications là native hơn).
- **Kinesis:** Quá nặng cho việc chỉ cần thông báo upload file đơn giản.

> Exam tip: "Event-driven + Decoupled (S3 upload)" → S3 Notifications + SQS/SNS/Lambda.`,
  services: ['Amazon S3', 'Amazon SQS'],
},
{
  id: 'sap-150', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company is planning a migration to AWS. They have a legacy application that requires a specific version of a Linux kernel. The application is highly sensitive to hardware changes. Which compute service offers the best support for this requirement?`,
  options: [
    "Amazon EC2 with custom AMI.",
    "AWS Fargate.",
    "AWS Lambda.",
    "AWS Elastic Beanstalk (pre-configured environments)."
  ],
  answer: 0,
  explain: `**Tóm tắt:** **Amazon EC2** cho phép bạn kiểm soát hoàn toàn hệ điều hành, bao gồm việc cài đặt kernel Linux cụ thể thông qua **Custom AMI** (Amazon Machine Image). Fargate hay Lambda đều là các dịch vụ serverless được quản lý, bạn không kiểm soát được kernel.

**Từ khoá:** "specific version of Linux kernel", "highly sensitive to hardware" → Amazon EC2 + Custom AMI.

**Giải thích:**
- **EC2:** IaaS, kiểm soát hoàn toàn OS, kernel, drivers.
- **Fargate/Lambda:** Dịch vụ được quản lý, OS/kernel do AWS quyết định, không custom được.
- **Elastic Beanstalk:** Quản lý môi trường nhưng vẫn dựa trên EC2/ECS/Fargate, không linh hoạt về kernel như EC2 custom AMI.

> Exam tip: "Custom Kernel/Driver/OS level control" → Amazon EC2.`,
  services: ['Amazon EC2'],
},
{
  id: 'sap-151', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company has an application that stores sensitive financial data. The security policy requires that all data must be encrypted at rest. Which solution should the company use to encrypt data in Amazon S3, ensuring they retain full control over the encryption keys?`,
  options: [
    "Use S3-managed encryption keys (SSE-S3).",
    "Use AWS KMS with AWS-managed keys.",
    "Use AWS KMS with Customer Managed Keys (CMKs).",
    "Use client-side encryption without any AWS KMS interaction."
  ],
  answer: 2,
  explain: `**Tóm tắt:** **AWS KMS Customer Managed Keys (CMKs)** là giải pháp cho phép công ty vừa sử dụng dịch vụ KMS của AWS, vừa giữ quyền quản lý chính sách key (key policy) và quyền xoay vòng key (full control).

**Từ khoá:** "encrypt at rest", "retain full control over encryption keys" → KMS + CMK.

**Giải thích:**
- **CMK:** Cho phép quản lý policy (ai dùng), xoay vòng (rotation), audit (log).
- **SSE-S3:** S3 tự quản lý key, công ty không kiểm soát.
- **AWS-managed keys:** KMS quản lý, công ty có ít quyền kiểm soát hơn CMK.
- **Client-side encryption:** Tự quản lý hoàn toàn, overhead vận hành cực cao, không phải phương án tối ưu (best practice thường dùng KMS).

> Exam tip: "Control over keys/policy" → CMK.`,
  services: ['AWS KMS', 'Amazon S3'],
},
{
  id: 'sap-152', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company is running an application on AWS that needs to access a private service hosted on another AWS account. The company wants to securely connect the two accounts over a private network connection. Which networking solution should the team use?`,
  options: [
    "AWS PrivateLink.",
    "Public Internet with VPN.",
    "VPC Peering.",
    "AWS Client VPN."
  ],
  answer: 0,
  explain: `**Tóm tắt:** **AWS PrivateLink** cho phép kết nối giữa các VPC của các account khác nhau (thông qua Network Load Balancer) một cách bảo mật, private, mà không cần peering hay lộ traffic ra internet.

**Từ khoá:** "private service", "another AWS account", "securely connect", "private network" → AWS PrivateLink.

**Giải thích:**
- **PrivateLink:** Thiết kế chuyên biệt để public dịch vụ nội bộ (qua NLB) cho các account khác một cách private và bảo mật (Endpoint).
- **VPC Peering:** Nối 2 VPC, nhưng có thể quá rộng (lộ cả mạng). PrivateLink chỉ cho access đúng service cần thiết.
- **Public Internet/Client VPN:** Không private, không tối ưu bảo mật/performance.

> Exam tip: "Private/Secure access to service in another account" → PrivateLink.`,
  services: ['AWS PrivateLink'],
},
{
  id: 'sap-153', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company is using Amazon RDS PostgreSQL and needs to ensure that the database is highly available. In the event of a regional outage, the company must also be able to recover the database in a different AWS Region. Which combination of actions should the team take?`,
  options: [
    "Enable Multi-AZ deployment and configure Amazon RDS cross-region read replicas.",
    "Enable Multi-AZ deployment and use AWS Database Migration Service (DMS).",
    "Use Aurora Global Database.",
    "Configure RDS snapshot replication to another region."
  ],
  answer: 0,
  explain: `**Tóm tắt:** **Multi-AZ** cho HA (cùng Region) và **Cross-region Read Replicas** cho DR (khác Region).

**Từ khoá:** "highly available", "recover in a different AWS Region" → Multi-AZ + Cross-region Read Replicas.

**Giải thích:**
- **Multi-AZ:** HA trong 1 region.
- **Cross-region Read Replicas:** Dùng để DR, có thể promote thành stand-alone database ở region khác nếu region chính outage.
- **Aurora Global Database:** Chỉ dùng nếu là Aurora. Câu hỏi dùng **RDS PostgreSQL** (thông thường).
- **DMS:** Dùng để migrate/replication dữ liệu, không phải giải pháp HA/DR chuẩn như Read Replica.

> Exam tip: "HA (Multi-AZ) + DR (Cross-Region)" cho RDS thường là Multi-AZ + Cross-region Replicas.`,
  services: ['Amazon RDS'],
},
{
  id: 'sap-154', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company is experiencing high latency on its web application hosted on Amazon EC2. The EC2 instances are in an Auto Scaling group behind an Application Load Balancer (ALB). The team has determined that the application is CPU-intensive. What should the team do to improve application performance?`,
  options: [
    "Change the EC2 instance type to a memory-optimized instance.",
    "Change the EC2 instance type to a compute-optimized instance.",
    "Add more EC2 instances to the Auto Scaling group.",
    "Configure ALB to use sticky sessions."
  ],
  answer: 1,
  explain: `**Tóm tắt:** Khi ứng dụng bị **CPU-intensive** (CPU là bottleneck), chuyển sang **compute-optimized instance** (cấp C) là giải pháp tối ưu nhất để tăng hiệu năng xử lý CPU.

**Từ khoá:** "high latency", "CPU-intensive" → compute-optimized instance.

**Giải thích:**
- **Compute-optimized (C-series):** Dành cho workload đòi hỏi CPU cao.
- **Memory-optimized (R-series):** Dành cho workload đòi hỏi RAM cao.
- **Add more EC2:** Có thể giúp (scale out), nhưng nếu instance hiện tại không tối ưu thì tăng số lượng vẫn tốn chi phí mà không hiệu quả nhất.
- **Sticky sessions:** Không cải thiện hiệu năng, chỉ duy trì session.

> Exam tip: "CPU bottleneck" → Compute-optimized (C). "RAM bottleneck" → Memory-optimized (R).`,
  services: ['Amazon EC2'],
},
{
  id: 'sap-155', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company has an application that stores a large amount of logs. The logs are currently stored in Amazon S3. The company wants to store the logs for a very long period but rarely accesses them. Which Amazon S3 storage class provides the most cost-effective solution for this requirement?`,
  options: [
    "Amazon S3 Standard.",
    "Amazon S3 Standard-Infrequent Access.",
    "Amazon S3 Glacier Deep Archive.",
    "Amazon S3 Intelligent-Tiering."
  ],
  answer: 2,
  explain: `**Tóm tắt:** **Amazon S3 Glacier Deep Archive** là lớp lưu trữ rẻ nhất cho dữ liệu cần lưu trữ dài hạn (lưu trữ tuân thủ) và gần như không bao giờ truy cập tới (dữ liệu lạnh).

**Từ khoá:** "large amount of logs", "stored for a very long period", "rarely accesses" → S3 Glacier Deep Archive.

**Giải thích:**
- **S3 Glacier Deep Archive:** Chi phí rẻ nhất cho lưu trữ lâu dài.
- **S3 Standard:** Đắt nhất, dùng cho dữ liệu truy cập thường xuyên.
- **S3 Standard-IA:** Dùng cho dữ liệu ít truy cập nhưng cần truy cập nhanh (còn quá đắt so với Glacier).
- **Intelligent-Tiering:** Tự động chuyển đổi giữa các tier, không phải phương án tối ưu nhất cho dữ liệu chắc chắn là "cold".

> Exam tip: "Long-term + rarely accessed" → Glacier Deep Archive.`,
  services: ['Amazon S3'],
},
{
  id: 'sap-156', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company wants to securely distribute content globally. The content is hosted in an S3 bucket and needs to be served to users worldwide with low latency. Which service combination should the team use?`,
  options: [
    "Amazon CloudFront and Amazon S3.",
    "Amazon S3 and AWS Global Accelerator.",
    "Amazon S3 and Elastic Load Balancing.",
    "Amazon EC2 and Amazon S3."
  ],
  answer: 0,
  explain: `**Tóm tắt:** **Amazon CloudFront** là dịch vụ Content Delivery Network (CDN) kết hợp với **Amazon S3** để phân phối nội dung toàn cầu với độ trễ thấp thông qua các edge location.

**Từ khoá:** "securely distribute content globally", "hosted in S3", "low latency" → CloudFront + S3.

**Giải thích:**
- **CloudFront:** CDN, cache nội dung tại các edge location gần người dùng.
- **S3:** Nơi chứa nội dung (origin).
- **Global Accelerator:** Tăng tốc mạng (network layer), thường dùng cho traffic TCP/UDP, không phải CDN cho static/media content.

> Exam tip: "CDN + Global + S3" → CloudFront.`,
  services: ['Amazon CloudFront', 'Amazon S3'],
},
);
