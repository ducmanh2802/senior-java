/*
 * AWS Pro track (#/aws): SAP-C02 then DOP-C02 in 26 weeks. Schema: docs/AWS-TRACK.md. Check: node scripts/check-aws.js
 */
window.AWS_PLAN = {
  exams: [
    {
      id: 'sap-c02', name: 'Solutions Architect – Professional', code: 'SAP-C02', minutes: 180, questions: 75, pass: 750,
      guide: 'https://aws.amazon.com/certification/certified-solutions-architect-professional/',
      domains: [
        { id: 'sap-d1', name: 'Design Solutions for Organizational Complexity', weight: 26 },
        { id: 'sap-d2', name: 'Design for New Solutions', weight: 29 },
        { id: 'sap-d3', name: 'Continuous Improvement for Existing Solutions', weight: 25 },
        { id: 'sap-d4', name: 'Accelerate Workload Migration and Modernization', weight: 20 },
      ],
    },
    {
      id: 'dop-c02', name: 'DevOps Engineer – Professional', code: 'DOP-C02', minutes: 180, questions: 75, pass: 750,
      guide: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/',
      domains: [
        { id: 'dop-d1', name: 'SDLC Automation', weight: 22 },
        { id: 'dop-d2', name: 'Configuration Management and IaC', weight: 17 },
        { id: 'dop-d3', name: 'Resilient Cloud Solutions', weight: 15 },
        { id: 'dop-d4', name: 'Monitoring and Logging', weight: 15 },
        { id: 'dop-d5', name: 'Incident and Event Response', weight: 14 },
        { id: 'dop-d6', name: 'Security and Compliance', weight: 17 },
      ],
    },
  ],
  weeks: [
    // ---------------- Giai đoạn 1 (tuần 1–4): nền tảng Associate, học từ gốc ----------------
    {
      n: 1, exam: 'sap-c02', title: 'Nền tảng: tài khoản AWS, IAM và cách AWS ra quyết định cho phép', domains: ['sap-d1', 'sap-d2'],
      goals: [
        'Hiểu Region / Availability Zone / edge location và vì sao thiết kế luôn bắt đầu từ "chạy ở bao nhiêu AZ".',
        'Phân biệt IAM user, group, role, policy (identity-based vs resource-based) và đọc được một policy JSON.',
        'Giải thích được policy evaluation logic: explicit Deny > Allow > implicit deny; vai trò của SCP và permissions boundary.',
        'Tự tạo tài khoản an toàn: MFA cho root, không dùng root hằng ngày, đăng nhập bằng role.',
      ],
      study: [
        { title: 'Overview of Amazon Web Services (whitepaper)', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/introduction.html' },
        { title: 'IAM roles', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html' },
        { title: 'IAM policy evaluation logic', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html' },
        { title: 'Permissions boundaries for IAM entities', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html' },
      ],
      lab: `### Mục tiêu
Có một tài khoản AWS an toàn để thực hành 26 tuần, và tự tay thấy explicit Deny thắng Allow.

1. Tạo tài khoản AWS, bật **MFA cho root**, tạo **AWS Budgets** ngưỡng 10 USD gửi email (Billing → Budgets).
2. Tạo IAM user {{admin-lab}} có MFA (sau này chuyển sang IAM Identity Center ở tuần 5). Từ giờ không đăng nhập root nữa.
3. Tạo role {{s3-reader}} với trust policy cho chính tài khoản, gắn policy chỉ cho phép {{s3:ListBucket}} và {{s3:GetObject}} trên một bucket.
4. Dùng CLI assume role và thử đọc bucket khác để thấy lỗi AccessDenied:
~~~bash
aws sts assume-role --role-arn arn:aws:iam::111122223333:role/s3-reader --role-session-name lab1
aws s3 ls s3://bucket-cua-ban    # OK
aws s3 ls s3://bucket-khac        # AccessDenied (implicit deny)
~~~
5. Thêm một statement {{"Effect": "Deny"}} cho {{s3:GetObject}} rồi thử lại: dù có Allow vẫn bị chặn (explicit Deny).
6. Mở **IAM Policy Simulator** kiểm tra lại cùng các tình huống.

> Chi phí: 0 USD (IAM, STS miễn phí; S3 vài KB nằm trong Free Tier).
> Dọn dẹp: xoá role {{s3-reader}}, xoá bucket thử nghiệm; giữ lại Budgets và MFA.`,
      practice: 10,
    },
    {
      n: 2, exam: 'sap-c02', title: 'Mạng VPC từ con số 0: subnet, route table, NAT, security group', domains: ['sap-d1', 'sap-d2'],
      goals: [
        'Tự vẽ được VPC 2 AZ: public/private subnet, Internet Gateway, NAT Gateway, route table cho từng subnet.',
        'Phân biệt security group (stateful, gắn vào ENI) và network ACL (stateless, gắn vào subnet).',
        'Biết khi nào dùng VPC endpoint (gateway cho S3/DynamoDB, interface/PrivateLink cho dịch vụ khác) để không đi qua NAT.',
        'Hiểu giới hạn của VPC peering (không transitive, CIDR không được trùng) để chuẩn bị học Transit Gateway.',
      ],
      study: [
        { title: 'What is Amazon VPC?', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html' },
        { title: 'Security groups', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html' },
        { title: 'NAT gateways', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html' },
        { title: 'What is AWS PrivateLink?', url: 'https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html' },
        { title: 'What is VPC peering?', url: 'https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html' },
      ],
      lab: `### Mục tiêu
Dựng VPC 2 AZ bằng tay để hiểu từng thành phần (tuần 19 sẽ dựng lại bằng CloudFormation).

1. Tạo VPC {{10.0.0.0/16}}, 4 subnet: public-a {{10.0.0.0/24}}, public-b {{10.0.1.0/24}}, private-a {{10.0.10.0/24}}, private-b {{10.0.11.0/24}}.
2. Gắn Internet Gateway; route table public có {{0.0.0.0/0 → igw}}.
3. Chạy một EC2 t3.micro ở private-a, **không có public IP**, truy cập bằng **Session Manager** (role {{AmazonSSMManagedInstanceCore}}).
4. Thêm **gateway endpoint cho S3** vào route table private, rồi chạy {{aws s3 ls}} từ EC2: đi được dù không có NAT.
5. (Tuỳ chọn, tốn tiền) tạo NAT Gateway ở public-a, route {{0.0.0.0/0 → nat}} cho private, thử {{curl https://aws.amazon.com}}.
6. Bật **VPC Flow Logs** vào CloudWatch Logs, tìm các dòng REJECT khi bạn bỏ rule inbound của security group.

> Chi phí: EC2 t3.micro trong Free Tier; NAT Gateway khoảng 0.045 USD/giờ + phí GB xử lý, nên chỉ bật trong 1 giờ.
> Dọn dẹp: xoá NAT Gateway trước (và Elastic IP đi kèm), terminate EC2, xoá endpoint, flow log, log group rồi xoá VPC.`,
      practice: 10,
    },
    {
      n: 3, exam: 'sap-c02', title: 'Compute: EC2, Auto Scaling, Load Balancer, Lambda, container', domains: ['sap-d2', 'sap-d3'],
      goals: [
        'Chọn được loại máy (họ instance, On-Demand / Spot / Savings Plans) và giải thích placement group.',
        'Hiểu Auto Scaling group + launch template + target tracking, health check của ALB và ASG.',
        'Phân biệt ALB (layer 7, path/host routing) và NLB (layer 4, static IP, PrivateLink).',
        'Biết khi nào chọn Lambda, ECS/Fargate hay EKS cho một service Java Spring Boot.',
      ],
      study: [
        { title: 'What is Amazon EC2?', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html' },
        { title: 'What is Amazon EC2 Auto Scaling?', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html' },
        { title: 'What is an Application Load Balancer?', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html' },
        { title: 'What is a Network Load Balancer?', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html' },
        { title: 'What is AWS Lambda?', url: 'https://docs.aws.amazon.com/lambda/latest/dg/welcome.html' },
        { title: 'What is Amazon ECS?', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html' },
      ],
      lab: `### Mục tiêu
Một Spring Boot "hello" chạy sau ALB, tự scale khi tải CPU tăng.

1. Tạo **launch template** (Amazon Linux 2023, t3.micro) với user data cài Java 17 và chạy một jar đơn giản ở cổng 8080 (hoặc {{python3 -m http.server 8080}} cho nhanh).
2. Tạo **ASG** min 1 / desired 2 / max 4 trên 2 private subnet của tuần 2, health check type = ELB.
3. Tạo **ALB** ở public subnet, target group cổng 8080, health check path {{/}}.
4. Thêm **target tracking** CPU 50%. SSH bằng Session Manager vào một máy, chạy {{stress-ng --cpu 2 --timeout 600}} và quan sát ASG scale out trong Activity history.
5. Terminate tay một instance: ASG tự thay thế. Ghi lại mất bao lâu.
6. Viết 1 Lambda Java (hoặc Python) trả về JSON, gọi qua Function URL; so sánh cold start với instance EC2.

> Chi phí: ALB khoảng 0.0225 USD/giờ + LCU; làm xong trong 2–3 giờ thì dưới 1 USD. Lambda trong Free Tier.
> Dọn dẹp: xoá ASG (tự terminate instance), ALB, target group, launch template, Lambda.`,
      practice: 12,
    },
    {
      n: 4, exam: 'sap-c02', title: 'Storage và database: S3, EBS/EFS, RDS/Aurora, DynamoDB', domains: ['sap-d2'],
      goals: [
        'Thuộc các storage class của S3, lifecycle, versioning, replication (CRR/SRR) và mã hoá SSE-S3 / SSE-KMS.',
        'So sánh EBS (block, 1 AZ), EFS (NFS nhiều AZ) và FSx; chọn đúng cho từng bài toán.',
        'Giải thích Multi-AZ khác read replica thế nào; Aurora khác RDS ở tầng storage ra sao.',
        'Thiết kế được bảng DynamoDB theo access pattern (partition key, GSI, on-demand vs provisioned).',
      ],
      study: [
        { title: 'Amazon S3 storage classes', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html' },
        { title: 'What is Amazon Elastic File System?', url: 'https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html' },
        { title: 'Working with DB instance read replicas', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html' },
        { title: 'What is Amazon Aurora?', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html' },
        { title: 'What is Amazon DynamoDB?', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html' },
      ],
      lab: `### Mục tiêu
Cảm nhận khác biệt giữa object, relational và key-value storage bằng tay.

1. S3: tạo bucket bật **versioning**, upload một file 2 lần, khôi phục bản cũ. Thêm lifecycle rule chuyển sang {{STANDARD_IA}} sau 30 ngày và xoá noncurrent version sau 60 ngày.
2. Bật **Block Public Access** và thử tạo bucket policy public: bị chặn. Ghi lại vì sao đây là mặc định.
3. RDS: tạo PostgreSQL {{db.t4g.micro}} (Free Tier, Single-AZ), kết nối từ EC2 private bằng psql; tạo một read replica, xem độ trễ replication trong CloudWatch ({{ReplicaLag}}).
4. DynamoDB: tạo bảng {{Orders}} (PK {{customerId}}, SK {{orderDate}}), on-demand. Ghi 20 item bằng CLI, query theo khách hàng, rồi thêm GSI theo {{status}}.
5. Viết ra giấy: với hệ thống đặt hàng của bạn, dữ liệu nào để RDS, dữ liệu nào để DynamoDB, file nào để S3, vì sao.

> Chi phí: hầu hết trong Free Tier; read replica tính tiền như một instance nữa, nên xoá ngay sau khi xem.
> Dọn dẹp: xoá read replica, DB instance (bỏ chọn final snapshot), bảng DynamoDB, empty rồi xoá bucket (kể cả các version).`,
      practice: 12,
    },
    // ---------------- Giai đoạn 2 (tuần 5–14): SAP-C02 theo domain ----------------
    {
      n: 5, exam: 'sap-c02', title: 'Multi-account: Organizations, SCP, Control Tower, IAM Identity Center', domains: ['sap-d1'],
      goals: [
        'Thiết kế cấu trúc OU (Security, Infrastructure, Workloads Prod/Non-prod, Sandbox) theo whitepaper multi-account.',
        'Viết SCP dạng deny-list: chặn rời Organization, chặn Region ngoài danh sách, bảo vệ CloudTrail; nhớ SCP không cấp quyền.',
        'Hiểu Control Tower tạo landing zone gì (Log Archive, Audit account, guardrails/controls, Account Factory).',
        'Dùng IAM Identity Center + permission set thay IAM user; chia sẻ tài nguyên bằng AWS RAM.',
      ],
      study: [
        { title: 'Organizing Your AWS Environment Using Multiple Accounts (whitepaper)', url: 'https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html' },
        { title: 'Service control policies (SCPs)', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html' },
        { title: 'What Is AWS Control Tower?', url: 'https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html' },
        { title: 'What is IAM Identity Center?', url: 'https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html' },
        { title: 'What is AWS Resource Access Manager?', url: 'https://docs.aws.amazon.com/ram/latest/userguide/what-is.html' },
      ],
      lab: `### Mục tiêu
Biến tài khoản đơn thành một Organization nhỏ có guardrail thật.

1. Bật **AWS Organizations** (all features). Tạo OU {{Sandbox}} và một member account mới (dùng email alias kiểu {{ban+sandbox@gmail.com}}).
2. Bật **IAM Identity Center**, tạo user của bạn, permission set {{AdministratorAccess}} và {{ReadOnlyAccess}}, gán cho từng account. Từ giờ đăng nhập qua access portal.
3. Gắn SCP cho OU Sandbox chặn mọi Region trừ {{ap-southeast-1}} và {{us-east-1}}:
~~~json
{ "Version": "2012-10-17", "Statement": [{ "Effect": "Deny", "NotAction": ["iam:*", "organizations:*", "sts:*", "support:*"],
  "Resource": "*", "Condition": { "StringNotEquals": { "aws:RequestedRegion": ["ap-southeast-1", "us-east-1"] } } }] }
~~~
4. Vào account Sandbox bằng quyền Admin, thử tạo EC2 ở {{eu-west-1}}: bị chặn dù là Administrator. Đây là ý chính của SCP.
5. Đọc trang Control Tower và vẽ landing zone bạn sẽ tạo (không bắt buộc bật Control Tower vì nó tạo nhiều tài nguyên có phí như Config).

> Chi phí: Organizations, Identity Center, SCP miễn phí. Control Tower tự nó miễn phí nhưng bật Config/CloudTrail tốn vài USD/tháng.
> Dọn dẹp: gỡ SCP nếu cản bài lab sau; account Sandbox có thể giữ lại (đóng account mất 90 ngày mới xoá hẳn).`,
      practice: 20,
    },
    {
      n: 6, exam: 'sap-c02', title: 'Mạng lai và nhiều VPC: Transit Gateway, Direct Connect, VPN, Route 53 Resolver', domains: ['sap-d1'],
      goals: [
        'So sánh VPC peering, Transit Gateway, PrivateLink khi có hàng chục đến hàng trăm VPC trong nhiều account.',
        'Hiểu Direct Connect (dedicated/hosted, VIF private/transit/public, Direct Connect gateway) và Site-to-Site VPN làm backup.',
        'Thiết kế DNS lai: Route 53 Resolver inbound/outbound endpoint, forwarding rule chia sẻ qua RAM.',
        'Thiết kế network inspection tập trung (egress VPC, AWS Network Firewall) và tránh CIDR trùng.',
      ],
      study: [
        { title: 'Building a Scalable and Secure Multi-VPC Network Infrastructure (whitepaper)', url: 'https://docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/welcome.html' },
        { title: 'Hybrid Connectivity (whitepaper)', url: 'https://docs.aws.amazon.com/whitepapers/latest/hybrid-connectivity/hybrid-connectivity.html' },
        { title: 'What is AWS Transit Gateway?', url: 'https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html' },
        { title: 'What is Direct Connect?', url: 'https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html' },
        { title: 'What is AWS Site-to-Site VPN?', url: 'https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html' },
        { title: 'Route 53 Resolver', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html' },
      ],
      lab: `### Mục tiêu
Nối 3 VPC qua Transit Gateway và thấy routing "hub-and-spoke" hoạt động.

1. Tạo 3 VPC CIDR không trùng: {{10.1.0.0/16}} (shared), {{10.2.0.0/16}} (app), {{10.3.0.0/16}} (dev); mỗi VPC 1 private subnet + 1 EC2 có Session Manager.
2. Tạo **Transit Gateway**, attach cả 3 VPC. Trong route table của từng VPC thêm {{10.0.0.0/8 → tgw}}.
3. Ping/curl chéo giữa các EC2 (mở ICMP trong security group). Sau đó tạo 2 TGW route table để **dev không thấy app** nhưng cả hai thấy shared: đây là segmentation.
4. Vẽ lại sơ đồ nếu thêm on-premises: Direct Connect → DX gateway → transit VIF → TGW, VPN làm đường dự phòng.
5. Đọc phần Resolver endpoint và viết lại luồng: máy on-prem phân giải {{db.internal.example.com}} (private hosted zone) đi qua đâu.

> Chi phí: mỗi TGW attachment khoảng 0.05 USD/giờ (3 attachment ≈ 0.15 USD/giờ) + phí GB. Làm trong 1–2 giờ.
> Dọn dẹp: xoá attachment, TGW route table, rồi Transit Gateway; terminate EC2; xoá 3 VPC.`,
      practice: 20,
    },
    {
      n: 7, exam: 'sap-c02', title: 'Bảo mật ở quy mô tổ chức: KMS, Secrets Manager, logging tập trung, WAF', domains: ['sap-d1', 'sap-d2'],
      goals: [
        'Hiểu KMS key policy, grant, multi-Region key; mã hoá dữ liệu chéo account (key policy + IAM cả hai phía).',
        'Thiết kế logging tập trung: organization trail của CloudTrail vào bucket Log Archive, bảo vệ bằng SCP và Object Lock.',
        'Biết khi nào dùng Secrets Manager (rotation) và khi nào Parameter Store.',
        'Định vị WAF, Shield, Firewall Manager, Network Firewall trong một kiến trúc nhiều account.',
      ],
      study: [
        { title: 'AWS Key Management Service', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/overview.html' },
        { title: 'What is AWS Secrets Manager?', url: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html' },
        { title: 'What Is AWS CloudTrail?', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html' },
        { title: 'AWS Firewall Manager', url: 'https://docs.aws.amazon.com/waf/latest/developerguide/fms-chapter.html' },
        { title: 'Security Pillar – Well-Architected', url: 'https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html' },
      ],
      lab: `### Mục tiêu
Đọc được dữ liệu mã hoá bằng KMS key của account khác và có audit trail cho mọi việc đó.

1. Ở account chính tạo customer managed key {{lab-cmk}}. Sửa **key policy** cho phép role trong account Sandbox (tuần 5) dùng {{kms:Decrypt}}.
2. Tạo bucket dùng **SSE-KMS** với key đó, upload file. Bucket policy cho phép role Sandbox {{s3:GetObject}}.
3. Từ account Sandbox đọc file: lần đầu thiếu quyền KMS trong IAM policy phía Sandbox → lỗi. Thêm vào rồi thử lại. Ghi lại: cross-account KMS cần **cả key policy và IAM policy**.
4. Tạo một secret trong Secrets Manager, đọc từ CLI; đọc trang rotation để biết Lambda rotation hoạt động thế nào.
5. Mở **CloudTrail Event history**, tìm sự kiện {{Decrypt}} vừa tạo và xem trường {{userIdentity}}.

> Chi phí: CMK 1 USD/tháng (tính theo giờ tồn tại), secret 0.40 USD/tháng; xoá trong ngày thì chỉ vài cent.
> Dọn dẹp: schedule key deletion (tối thiểu 7 ngày), xoá secret (có thể force không chờ recovery window), xoá bucket.`,
      practice: 20,
    },
    {
      n: 8, exam: 'sap-c02', title: 'Độ tin cậy và DR: RTO/RPO, 4 chiến lược DR, multi-Region', domains: ['sap-d2', 'sap-d3'],
      goals: [
        'Giải thích 4 chiến lược DR: backup & restore, pilot light, warm standby, multi-site active/active với RTO/RPO và chi phí tương ứng.',
        'Chọn cơ chế replication: S3 CRR, Aurora Global Database, DynamoDB global tables, AWS Backup cross-Region copy, Elastic Disaster Recovery.',
        'Thiết kế failover DNS bằng Route 53 health check (failover, latency, weighted routing).',
        'Đọc đề tìm từ khoá: "RPO seconds" → Aurora Global/DynamoDB global; "lowest cost, RTO hours" → backup & restore.',
      ],
      study: [
        { title: 'Disaster Recovery of Workloads on AWS (whitepaper)', url: 'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-workloads-on-aws.html' },
        { title: 'Reliability Pillar – Well-Architected', url: 'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html' },
        { title: 'Using Amazon Aurora Global Database', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html' },
        { title: 'DynamoDB global tables', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html' },
        { title: 'What is AWS Backup?', url: 'https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html' },
        { title: 'Route 53 health checks and DNS failover', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html' },
      ],
      lab: `### Mục tiêu
Một trang web tĩnh tự failover sang Region thứ hai khi Region chính "chết".

1. Tạo 2 bucket S3 static website ở 2 Region (ví dụ {{ap-southeast-1}} và {{us-west-2}}), bật versioning cả hai và **Cross-Region Replication** từ primary sang secondary.
2. Upload {{index.html}} ở primary, kiểm tra nó được replicate sang secondary sau vài giây.
3. Nếu có domain trong Route 53: tạo health check cho endpoint primary, record **failover** PRIMARY/SECONDARY. Nếu không có domain, chỉ cần tạo health check và đọc kỹ cấu hình record.
4. Giả lập sự cố: đổi bucket policy primary để trả 403; xem health check chuyển Unhealthy và DNS trả về secondary.
5. Tạo **backup plan** trong AWS Backup cho một bảng DynamoDB, có rule copy sang Region khác. Viết bảng: chiến lược DR nào bạn vừa làm, RTO/RPO ước tính bao nhiêu.

> Chi phí: health check khoảng 0.50 USD/tháng, S3 và replication vài cent. Hosted zone 0.50 USD/tháng nếu tạo mới.
> Dọn dẹp: xoá record, health check, backup plan và recovery point, tắt replication rồi xoá 2 bucket.`,
      practice: 25,
    },
    {
      n: 9, exam: 'sap-c02', title: 'Thiết kế giải pháp mới: decoupling, serverless, event-driven', domains: ['sap-d2'],
      goals: [
        'Chọn đúng giữa SQS (standard/FIFO), SNS fan-out, EventBridge (rule, bus chéo account, Pipes) và Kinesis.',
        'Thiết kế workflow bằng Step Functions (Standard vs Express), xử lý retry, DLQ, idempotency.',
        'Dựng API bằng API Gateway (REST vs HTTP API, usage plan, throttling, authorizer) trước Lambda hoặc ALB.',
        'Áp dụng Well-Architected để đánh giá trade-off giữa hiệu năng, chi phí, vận hành.',
      ],
      study: [
        { title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
        { title: 'What is Amazon SQS?', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html' },
        { title: 'What is Amazon SNS?', url: 'https://docs.aws.amazon.com/sns/latest/dg/welcome.html' },
        { title: 'What Is Amazon EventBridge?', url: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html' },
        { title: 'What is Step Functions?', url: 'https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html' },
        { title: 'What is Amazon API Gateway?', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html' },
      ],
      lab: `### Mục tiêu
Luồng đặt hàng không đồng bộ: API → queue → worker, có DLQ và workflow.

1. Tạo HTTP API (API Gateway) {{POST /orders}} → Lambda {{createOrder}} ghi message vào **SQS** {{orders}} (visibility timeout 60s, redrive sang DLQ sau 3 lần).
2. Lambda {{processOrder}} consume SQS (event source mapping, batch size 10). Cố tình ném exception với order có {{amount < 0}} và xem message rơi vào DLQ.
3. Thêm **SNS topic** {{order-created}} fan-out sang 2 SQS queue (email, analytics): hiểu vì sao SNS + SQS tốt hơn một queue.
4. Viết state machine **Step Functions** 3 bước (Reserve → Charge → Ship) có Retry và Catch → bước Compensate.
5. Vẽ lại sơ đồ và ghi chú: chỗ nào cần idempotency key, vì sao.

> Chi phí: gần như 0 (Lambda, SQS, SNS, Step Functions đều có Free Tier).
> Dọn dẹp: xoá API, 2 Lambda, các queue, topic, state machine và log group {{/aws/lambda/...}}.`,
      practice: 25,
    },
    {
      n: 10, exam: 'sap-c02', title: 'Dữ liệu và analytics: Kinesis, data lake S3, Glue, Athena, Lake Formation, Redshift', domains: ['sap-d2', 'sap-d3'],
      goals: [
        'Thiết kế pipeline streaming: Kinesis Data Streams (shard, retention) vs Data Firehose (đẩy thẳng vào S3/Redshift/OpenSearch).',
        'Dựng data lake trên S3: Glue crawler + Data Catalog, Athena query, phân vùng và định dạng cột (Parquet) để giảm chi phí.',
        'Phân quyền data lake tới cấp cột bằng Lake Formation; khi nào cần Redshift, EMR hoặc OpenSearch.',
        'Nhận diện trong đề: "near real-time, ít vận hành" → Firehose; "ad-hoc SQL trên S3" → Athena.',
      ],
      study: [
        { title: 'Build Modern Data Streaming Architectures on AWS (whitepaper)', url: 'https://docs.aws.amazon.com/whitepapers/latest/build-modern-data-streaming-analytics-architectures/build-modern-data-streaming-analytics-architectures.html' },
        { title: 'What is Amazon Kinesis Data Streams?', url: 'https://docs.aws.amazon.com/streams/latest/dev/introduction.html' },
        { title: 'What is Amazon Data Firehose?', url: 'https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html' },
        { title: 'What is Amazon Athena?', url: 'https://docs.aws.amazon.com/athena/latest/ug/what-is.html' },
        { title: 'What is AWS Glue?', url: 'https://docs.aws.amazon.com/glue/latest/dg/what-is-glue.html' },
        { title: 'What is AWS Lake Formation?', url: 'https://docs.aws.amazon.com/lake-formation/latest/dg/what-is-lake-formation.html' },
      ],
      lab: `### Mục tiêu
Log click stream đi từ producer vào S3 rồi query bằng SQL trong 1 giờ.

1. Tạo **Data Firehose** stream (source Direct PUT, đích S3 bucket {{clicks-raw}}, buffer 60 giây, bật chuyển đổi sang Parquet nếu đã có bảng Glue, chưa có thì để JSON).
2. Gửi 200 bản ghi JSON bằng CLI hoặc một script nhỏ ({{aws firehose put-record-batch}}), kiểm tra file xuất hiện trong S3 theo prefix năm/tháng/ngày/giờ.
3. Chạy **Glue crawler** trên bucket để tạo bảng trong Data Catalog.
4. Mở **Athena**, chọn bucket kết quả, chạy {{SELECT page, count(*) FROM clicks GROUP BY page}}. Xem "Data scanned" và nghĩ cách giảm (partition, Parquet).
5. Ghi lại: nếu cần xử lý từng event dưới 1 giây thì đổi Firehose thành gì (Kinesis Data Streams + Lambda/Flink).

> Chi phí: Firehose và Athena tính theo GB, với dữ liệu thử chỉ vài cent; Glue crawler khoảng 0.44 USD/DPU-giờ, chạy 1–2 phút.
> Dọn dẹp: xoá Firehose stream, crawler, database Glue, 2 bucket (raw + kết quả Athena).`,
      practice: 25,
    },
    {
      n: 11, exam: 'sap-c02', title: 'Cải tiến hệ thống đang chạy: hiệu năng, caching, vận hành', domains: ['sap-d3'],
      goals: [
        'Tăng hiệu năng toàn cầu: CloudFront (cache behavior, origin failover), Global Accelerator (static anycast IP, TCP/UDP).',
        'Giảm tải database: ElastiCache, RDS Proxy cho Lambda, read replica, DynamoDB DAX.',
        'Cải thiện vận hành: tự động hoá patch, quan sát bằng CloudWatch, giảm toil theo trụ cột Operational Excellence.',
        'Đọc đề "existing solution": tìm thay đổi ít rủi ro nhất, ít công sức nhất mà vẫn đạt yêu cầu.',
      ],
      study: [
        { title: 'What is Amazon CloudFront?', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html' },
        { title: 'What is AWS Global Accelerator?', url: 'https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html' },
        { title: 'Amazon RDS Proxy', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html' },
        { title: 'Performance Efficiency Pillar', url: 'https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html' },
        { title: 'Operational Excellence Pillar', url: 'https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/welcome.html' },
      ],
      lab: `### Mục tiêu
Đặt CloudFront trước một origin chậm và đo mức cải thiện.

1. Dùng bucket static website (tuần 8) hoặc ALB (tuần 3) làm origin. Tạo **CloudFront distribution** với **Origin Access Control** (bucket không public nữa).
2. Đo thời gian tải bằng {{curl -w "%{time_total}" -o /dev/null -s URL}} 5 lần trực tiếp origin và 5 lần qua CloudFront; xem header {{x-cache: Hit from cloudfront}}.
3. Tạo **cache behavior** riêng cho {{/api/*}} không cache (CachingDisabled) và cho {{/static/*}} cache dài.
4. Thêm **origin group** (origin failover) với bucket secondary của tuần 8.
5. Viết 5 dòng: hệ thống công ty bạn đang có nút thắt gì, sẽ dùng cache nào (CloudFront, ElastiCache, RDS Proxy) và vì sao.

> Chi phí: CloudFront có Free Tier 1 TB/tháng; lab gần như 0 USD.
> Dọn dẹp: disable rồi delete distribution (phải đợi deploy xong), xoá OAC, trả bucket policy về như cũ.`,
      practice: 25,
    },
    {
      n: 12, exam: 'sap-c02', title: 'Tối ưu chi phí: Savings Plans, Spot, storage tier, quản trị chi phí', domains: ['sap-d3', 'sap-d2'],
      goals: [
        'So sánh On-Demand, Reserved Instances, Compute/EC2 Instance Savings Plans và Spot; biết workload nào hợp cái nào.',
        'Giảm chi phí storage: S3 Intelligent-Tiering, lifecycle, gp3 thay gp2, xoá snapshot mồ côi.',
        'Quản trị chi phí cho cả tổ chức: consolidated billing, tag policy + cost allocation tag, Budgets, Cost and Usage Report, Compute Optimizer.',
        'Nhận diện trong đề: "giảm chi phí NAT/data transfer" → VPC endpoint; "workload chịu được gián đoạn" → Spot.',
      ],
      study: [
        { title: 'Cost Optimization Pillar', url: 'https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html' },
        { title: 'What are Savings Plans?', url: 'https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html' },
        { title: 'Spot Instances', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html' },
        { title: 'S3 Intelligent-Tiering', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering.html' },
        { title: 'What is AWS Compute Optimizer?', url: 'https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html' },
        { title: 'Tag policies', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies.html' },
      ],
      lab: `### Mục tiêu
Trả lời được "tháng này tiền đi đâu và giảm thế nào" cho chính tài khoản lab.

1. Mở **Cost Explorer**, group theo Service rồi theo Usage type: tìm 3 khoản lớn nhất (thường là NAT, ALB, EC2).
2. Bật **cost allocation tag** {{Project}}, gắn tag cho tài nguyên lab tuần sau; tạo **tag policy** yêu cầu giá trị Project hợp lệ.
3. Tạo một ASG dùng **mixed instances policy** (On-Demand base 1 + 100% Spot phần còn lại, 3 loại instance), xem giá Spot so với On-Demand.
4. Mở **Compute Optimizer** (opt-in) và **Savings Plans recommendations**: đọc khuyến nghị (có thể trống vì tài khoản mới).
5. Viết bảng: workload (web, batch, DB, dev) → mô hình mua phù hợp → % tiết kiệm ước tính.

> Chi phí: Cost Explorer UI miễn phí (API tính phí theo request); Spot rẻ hơn On-Demand nhiều, chạy 1 giờ chỉ vài cent.
> Dọn dẹp: xoá ASG Spot và launch template; giữ cost allocation tag và Budgets.`,
      practice: 25,
    },
    {
      n: 13, exam: 'sap-c02', title: 'Migration (1): đánh giá, 7R, chuyển dữ liệu', domains: ['sap-d4'],
      goals: [
        'Thuộc 7R (retire, retain, rehost, relocate, repurchase, replatform, refactor) và chọn đúng theo ràng buộc đề bài.',
        'Lập kế hoạch bằng Migration Hub và Application Discovery Service (agentless vs agent).',
        'Chọn cách chuyển dữ liệu: DataSync (online, lịch), Transfer Family (SFTP), Storage Gateway (hybrid), Snow Family (offline), Direct Connect.',
        'Tính nhanh: 100 TB qua đường 1 Gbps mất bao lâu → khi nào phải dùng thiết bị offline.',
      ],
      study: [
        { title: 'About the migration strategies (7 Rs)', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html' },
        { title: 'What Is AWS Migration Hub?', url: 'https://docs.aws.amazon.com/migrationhub/latest/ug/whatishub.html' },
        { title: 'What is AWS Application Discovery Service?', url: 'https://docs.aws.amazon.com/application-discovery/latest/userguide/what-is-appdiscovery.html' },
        { title: 'What is AWS DataSync?', url: 'https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html' },
        { title: 'What is AWS Transfer Family?', url: 'https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html' },
        { title: 'What is Amazon S3 File Gateway', url: 'https://docs.aws.amazon.com/filegateway/latest/files3/what-is-file-s3.html' },
      ],
      lab: `### Mục tiêu
Chuyển một "file server" giả lập lên S3 bằng DataSync và tự chọn 7R cho một danh mục ứng dụng.

1. Tạo EFS (hoặc dùng EC2 có thư mục NFS) chứa 1.000 file nhỏ để giả làm file server on-premises.
2. Tạo **DataSync task** từ EFS sang S3 bucket {{migrated-files}}, bật verify data, chạy và đọc báo cáo (số file, tốc độ).
3. Chạy lại task: chỉ file thay đổi được chép (incremental). Ghi lại điều này quan trọng thế nào khi cutover.
4. Bài tập giấy: danh mục 8 ứng dụng (ERP mua license, website PHP, batch Java, Oracle DB, app sắp bỏ…) → gán 7R cho từng cái kèm lý do.
5. Tính: 80 TB qua đường 500 Mbps dùng 80% băng thông mất bao nhiêu ngày? (gợi ý: khoảng 18–19 ngày) → so với thiết bị offline. Lưu ý: kiểm tra tình trạng cung cấp hiện tại của Snow Family trên trang AWS trước khi chọn trong thực tế.

> Chi phí: DataSync tính theo GB chép (vài cent cho dữ liệu thử), EFS vài cent.
> Dọn dẹp: xoá DataSync task và location, EFS, bucket.`,
      practice: 25,
    },
    {
      n: 14, exam: 'sap-c02', title: 'Migration (2) và hiện đại hoá: MGN, DMS/SCT, container, serverless', domains: ['sap-d4', 'sap-d3'],
      goals: [
        'Rehost server bằng AWS Application Migration Service (MGN): replication liên tục, test cutover, cutover.',
        'Chuyển database: DMS full load + CDC, Schema Conversion Tool khi đổi engine (Oracle → Aurora PostgreSQL).',
        'Hiện đại hoá: container hoá lên ECS/Fargate hoặc EKS, tách monolith theo strangler fig, chuyển phần event sang serverless.',
        'Chọn dịch vụ đích "ít thay đổi code nhất" vs "giảm vận hành nhất" theo yêu cầu đề.',
      ],
      study: [
        { title: 'What is AWS Application Migration Service (MGN)?', url: 'https://docs.aws.amazon.com/mgn/latest/ug/what-is-mgn.html' },
        { title: 'What is AWS Database Migration Service?', url: 'https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html' },
        { title: 'What is the AWS Schema Conversion Tool?', url: 'https://docs.aws.amazon.com/SchemaConversionTool/latest/userguide/CHAP_Welcome.html' },
        { title: 'What is Amazon EKS?', url: 'https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html' },
        { title: 'What is Amazon ECR?', url: 'https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html' },
      ],
      lab: `### Mục tiêu
Chuyển một database đang chạy sang RDS với downtime gần 0 bằng DMS (full load + CDC).

1. Nguồn: EC2 chạy PostgreSQL (hoặc MySQL) với một bảng {{orders}} 10.000 dòng; bật logical replication ({{wal_level = logical}}).
2. Đích: RDS PostgreSQL {{db.t4g.micro}}.
3. Tạo **DMS replication instance** nhỏ nhất (hoặc DMS Serverless), 2 endpoint, test connection.
4. Tạo task **Migrate existing data and replicate ongoing changes**. Trong lúc task chạy, insert thêm dòng ở nguồn và kiểm tra chúng xuất hiện ở đích.
5. Container hoá app Spring Boot của bạn: build image, push lên **ECR**, chạy trên **ECS Fargate** 1 task sau ALB (dùng lại ALB tuần 3 nếu còn).
6. Viết runbook cutover 6 bước: freeze write → chờ CDC lag = 0 → đổi connection string → smoke test → mở write → giữ đường rollback.

> Chi phí: DMS instance nhỏ nhất vài cent/giờ, RDS và EC2 Free Tier, Fargate vài cent/giờ. Làm trong 2–3 giờ.
> Dọn dẹp: xoá DMS task, endpoint, replication instance; RDS; EC2 nguồn; ECS service/cluster; image ECR.`,
      practice: 25,
    },
    // ---------------- Giai đoạn 3 (tuần 15–16): ôn và thi SAP-C02 ----------------
    {
      n: 15, exam: 'sap-c02', title: 'Ôn SAP-C02: thi thử, vá domain yếu', domains: ['sap-d1', 'sap-d2', 'sap-d3', 'sap-d4'],
      goals: [
        'Làm 2 bài thi thử đủ 75 câu / 180 phút trong điều kiện thật (không xem tài liệu, không dừng).',
        'Domain nào dưới 75% thì luyện lại "câu sai/chưa làm" của domain đó tới khi vượt 80%.',
        'Ôn lại bảng so sánh tự viết: DR strategies, kết nối mạng lai, mô hình mua EC2, 7R, chuyển dữ liệu.',
        'Luyện kỹ thuật đọc đề: gạch từ khoá ràng buộc (least operational overhead, most cost-effective, RPO/RTO) và loại 2 phương án sai trước.',
      ],
      study: [
        { title: 'AWS Certified Solutions Architect – Professional (exam page)', url: 'https://aws.amazon.com/certification/certified-solutions-architect-professional/' },
        { title: 'AWS Well-Architected', url: 'https://aws.amazon.com/architecture/well-architected/' },
        { title: 'Disaster Recovery of Workloads on AWS (đọc lại phần chiến lược)', url: 'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-workloads-on-aws.html' },
      ],
      lab: `### Mục tiêu
Không lab mới: tuần này là thi thử và tổng hợp.

1. Thứ 2 và thứ 5: làm **thi thử** (tab Thi thử) đủ giờ. Ghi điểm từng domain vào sổ.
2. Sau mỗi bài: đọc giải thích **mọi câu sai và câu đúng nhờ đoán**; viết lại một dòng "từ khoá nào trong đề lẽ ra dẫn tới đáp án".
3. Chọn 1 lab cũ của domain yếu nhất và làm lại không nhìn hướng dẫn.
4. Đặt lịch thi (Pearson VUE, online hoặc test center) cho cuối tuần 16 nếu điểm thi thử ổn định ≥ 800.

> Chi phí: 0 USD. Lệ phí thi Professional là 300 USD (kiểm tra lại trên trang exam).
> Dọn dẹp: chạy lại Cost Explorer, chắc chắn không còn NAT Gateway, ALB, DB nào quên xoá.`,
      practice: 150,
    },
    {
      n: 16, exam: 'sap-c02', title: 'Thi SAP-C02', domains: ['sap-d1', 'sap-d2', 'sap-d3', 'sap-d4'],
      goals: [
        'Thi thử lần cuối giữa tuần, mục tiêu ≥ 800/1000; không học kiến thức mới trong 2 ngày trước khi thi.',
        'Chiến thuật trong phòng thi: lượt 1 làm câu chắc, đánh dấu câu dài; mỗi câu khoảng 2 phút 20 giây.',
        'Đi thi và ghi lại ngay sau đó các chủ đề thấy khó (không chép đề) để dùng cho phần DOP chồng lấn.',
      ],
      study: [
        { title: 'AWS Certified Solutions Architect – Professional (exam page)', url: 'https://aws.amazon.com/certification/certified-solutions-architect-professional/' },
      ],
      lab: `### Checklist ngày thi
1. Kiểm tra giấy tờ tuỳ thân và giờ thi; thi online thì test máy, webcam, phòng trống từ hôm trước.
2. Đọc từng đề **câu hỏi cuối trước** ("Which solution … MOST cost-effectively?"), rồi mới đọc bối cảnh.
3. Loại phương án dùng dịch vụ sai loại (ví dụ: dùng SQS để replicate database) trước khi so 2 phương án còn lại.
4. Còn 20 phút: quay lại các câu đã đánh dấu; không để trống câu nào (không bị trừ điểm khi sai).

> Sau khi đỗ: nghỉ 2–3 ngày rồi bắt đầu DOP-C02 ở tuần 17; khoảng 30–40% kiến thức đã dùng lại được.`,
      practice: 75,
    },
    // ---------------- Giai đoạn 4 (tuần 17–24): DOP-C02 theo domain ----------------
    {
      n: 17, exam: 'dop-c02', title: 'CI/CD trên AWS: CodePipeline, CodeBuild, CodeArtifact, ECR', domains: ['dop-d1'],
      goals: [
        'Hiểu cấu trúc pipeline: source → build → test → deploy, artifact store S3, action và stage, manual approval.',
        'Viết buildspec.yml cho dự án Maven: phases, cache, reports (JUnit), artifacts, biến môi trường từ Parameter Store/Secrets Manager.',
        'Dùng CodeArtifact làm Maven proxy nội bộ và ECR (image scanning, lifecycle policy) cho container.',
        'Thiết kế pipeline chéo account (tools account → dev/prod) với KMS key và role cross-account.',
      ],
      study: [
        { title: 'Introduction to DevOps on AWS (whitepaper)', url: 'https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/' },
        { title: 'Practicing CI/CD on AWS (whitepaper)', url: 'https://docs.aws.amazon.com/whitepapers/latest/practicing-continuous-integration-continuous-delivery/welcome.html' },
        { title: 'What is AWS CodePipeline?', url: 'https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html' },
        { title: 'Build specification reference for CodeBuild', url: 'https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html' },
        { title: 'What is AWS CodeArtifact?', url: 'https://docs.aws.amazon.com/codeartifact/latest/ug/welcome.html' },
        { title: 'Cross-account pipeline in CodePipeline', url: 'https://docs.aws.amazon.com/codepipeline/latest/userguide/pipelines-create-cross-account.html' },
      ],
      lab: `### Mục tiêu
Pipeline build một project Spring Boot (Maven) từ GitHub, chạy test và publish báo cáo JUnit.

1. Tạo **connection** tới GitHub (CodeConnections) và pipeline mới: source = repo của bạn, branch main.
2. Stage Build dùng CodeBuild với buildspec:
~~~yaml
version: 0.2
phases:
  install:
    runtime-versions: { java: corretto17 }
  build:
    commands:
      - mvn -B verify
reports:
  junit:
    files: ['target/surefire-reports/*.xml']
cache:
  paths: ['/root/.m2/**/*']
artifacts:
  files: ['target/*.jar']
~~~
3. Cố tình làm 1 test fail: pipeline dừng ở Build, xem tab Reports.
4. Thêm stage **Manual approval** có SNS gửi email trước stage Deploy (chưa cần deploy, tuần sau làm).
5. (Tuỳ chọn) tạo CodeArtifact domain + repo upstream Maven Central, sửa {{settings.xml}} để build lấy dependency qua đó.

> Chi phí: CodePipeline V2 tính theo phút action, CodeBuild có Free Tier 100 phút build/tháng (general1.small). Lab dưới 1 USD.
> Dọn dẹp: xoá pipeline, CodeBuild project, bucket artifact, SNS topic, CodeArtifact domain nếu đã tạo.`,
      practice: 20,
    },
    {
      n: 18, exam: 'dop-c02', title: 'Chiến lược deploy: CodeDeploy, blue/green, canary, rollback', domains: ['dop-d1', 'dop-d3'],
      goals: [
        'Phân biệt in-place, rolling, immutable, blue/green, canary, linear; deployment configuration của CodeDeploy cho EC2, Lambda, ECS.',
        'Viết appspec (hooks BeforeInstall, AfterInstall, ApplicationStart, ValidateService; Lambda BeforeAllowTraffic).',
        'Tự động rollback khi CloudWatch alarm kích hoạt; ASG instance refresh; các policy deploy của Elastic Beanstalk.',
        'Nhận diện trong đề: "không downtime + rollback nhanh nhất" → blue/green; "giảm rủi ro dần" → canary/linear.',
      ],
      study: [
        { title: 'Blue/Green Deployments on AWS (whitepaper)', url: 'https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/welcome.html' },
        { title: 'Overview of Deployment Options on AWS', url: 'https://docs.aws.amazon.com/whitepapers/latest/overview-deployment-options/introduction.html' },
        { title: 'Deployment configurations in CodeDeploy', url: 'https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-configurations.html' },
        { title: 'CodeDeploy AppSpec file reference', url: 'https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file.html' },
        { title: 'CodeDeploy blue/green deployments for Amazon ECS', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html' },
        { title: 'Use an instance refresh to update instances in an ASG', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/asg-instance-refresh.html' },
      ],
      lab: `### Mục tiêu
Deploy canary cho Lambda và tự rollback khi lỗi tăng.

1. Tạo Lambda {{price-api}}, publish version 1, tạo alias {{live}} trỏ v1.
2. Tạo CodeDeploy application (compute platform Lambda), deployment group dùng config {{CodeDeployDefault.LambdaCanary10Percent5Minutes}}.
3. Tạo CloudWatch alarm trên metric {{Errors}} của alias {{live}} (ngưỡng ≥ 1 trong 1 phút), gắn vào deployment group với **automatic rollback on alarm**.
4. Sửa code để ném exception, publish v2, deploy bằng appspec:
~~~yaml
version: 0.0
Resources:
  - priceApi:
      Type: AWS::Lambda::Function
      Properties: { Name: price-api, Alias: live, CurrentVersion: "1", TargetVersion: "2" }
~~~
5. Gọi alias liên tục trong 5 phút ({{for i in $(seq 200); do aws lambda invoke ...; done}}): alarm kích hoạt, CodeDeploy rollback về v1. Đọc lại event timeline.
6. Lặp lại với v3 không lỗi: sau 5 phút 100% traffic chuyển sang v3.

> Chi phí: gần như 0 (Lambda, CodeDeploy cho Lambda miễn phí, alarm 0.10 USD/tháng).
> Dọn dẹp: xoá deployment group, application, alarm, Lambda (kèm version/alias).`,
      practice: 20,
    },
    {
      n: 19, exam: 'dop-c02', title: 'CloudFormation chuyên sâu: change set, drift, StackSets, custom resource', domains: ['dop-d2'],
      goals: [
        'Viết template có Parameters, Mappings, Conditions, Outputs/Export; hiểu DeletionPolicy, UpdateReplacePolicy.',
        'Cập nhật an toàn bằng change set, stack policy; phát hiện drift; rollback configuration với alarm.',
        'Dùng CreationPolicy/cfn-signal, UpdatePolicy cho ASG (rolling / replacing) và custom resource (Lambda-backed).',
        'Triển khai baseline cho cả tổ chức bằng StackSets (service-managed permissions, auto-deployment theo OU); Service Catalog cho self-service.',
      ],
      study: [
        { title: 'What is CloudFormation?', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html' },
        { title: 'Update stacks using change sets', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html' },
        { title: 'Drift detection', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html' },
        { title: 'StackSets', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/what-is-cfnstacksets.html' },
        { title: 'UpdatePolicy attribute', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-attribute-updatepolicy.html' },
        { title: 'Custom resources', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-custom-resources.html' },
      ],
      lab: `### Mục tiêu
Viết lại VPC của tuần 2 bằng CloudFormation và trải nghiệm vòng đời stack.

1. Viết template {{vpc.yaml}}: VPC, 2 public + 2 private subnet, IGW, route table, Output {{VpcId}} có Export.
2. Tạo stack, rồi sửa CIDR một subnet và tạo **change set**: đọc cột Replacement = True và hiểu vì sao nguy hiểm.
3. Vào console sửa tay một route table rồi chạy **Detect drift**: xem diff.
4. Stack thứ 2 import {{VpcId}} bằng {{Fn::ImportValue}} để tạo security group. Thử xoá stack 1: bị chặn vì export đang được dùng.
5. Thêm ASG có {{UpdatePolicy: AutoScalingRollingUpdate}} và {{CreationPolicy}} chờ {{cfn-signal}} từ user data; đổi AMI và xem rolling update.
6. (Có Organization) tạo **StackSet** service-managed bật một bucket log chuẩn cho OU Sandbox.

> Chi phí: CloudFormation miễn phí (trả cho tài nguyên tạo ra). ASG t3.micro Free Tier.
> Dọn dẹp: xoá stack phụ thuộc trước (stack 2), rồi stack 1; xoá StackSet instance rồi StackSet.`,
      practice: 20,
    },
    {
      n: 20, exam: 'dop-c02', title: 'CDK và Systems Manager: cấu hình ở quy mô lớn', domains: ['dop-d2'],
      goals: [
        'Viết hạ tầng bằng AWS CDK (Java hoặc TypeScript): construct L1/L2/L3, cdk synth/diff/deploy, bootstrap nhiều account.',
        'Dùng Systems Manager: Parameter Store, State Manager, Patch Manager (patch baseline, maintenance window), Session Manager thay bastion.',
        'Quản lý cấu hình ứng dụng động bằng AppConfig (deployment strategy, rollback theo alarm); dựng AMI chuẩn bằng EC2 Image Builder.',
        'Chọn công cụ trong đề: "cấu hình OS hàng nghìn EC2" → SSM; "golden AMI định kỳ" → Image Builder.',
      ],
      study: [
        { title: 'What is the AWS CDK?', url: 'https://docs.aws.amazon.com/cdk/v2/guide/home.html' },
        { title: 'What is AWS Systems Manager?', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html' },
        { title: 'Patch Manager', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager.html' },
        { title: 'Parameter Store', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html' },
        { title: 'What is AWS AppConfig?', url: 'https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html' },
        { title: 'What is EC2 Image Builder?', url: 'https://docs.aws.amazon.com/imagebuilder/latest/userguide/what-is-image-builder.html' },
      ],
      lab: `### Mục tiêu
Hạ tầng bằng CDK Java + quản lý EC2 hoàn toàn bằng Systems Manager, không SSH.

1. {{npm install -g aws-cdk}}, {{cdk init app --language java}}, {{cdk bootstrap}}.
2. Viết stack: VPC (L2 {{Vpc}} với 2 AZ, 0 NAT), 2 EC2 private có role SSM, tag {{PatchGroup=lab}}. Chạy {{cdk diff}} rồi {{cdk deploy}}.
3. Systems Manager → **Fleet Manager**: thấy 2 instance managed. Mở **Session Manager** vào từng máy.
4. **State Manager** association chạy {{AWS-RunShellScript}} cài {{htop}} mỗi 30 phút; **Patch Manager**: patch baseline mặc định, chạy {{Scan}} và xem compliance.
5. Lưu {{/lab/db/url}} vào Parameter Store (SecureString), đọc từ EC2 bằng CLI.
6. Sửa code CDK thêm 1 instance, {{cdk diff}} để xem đúng 1 tài nguyên mới.

> Chi phí: SSM core miễn phí; EC2 Free Tier; không NAT nên SSM cần VPC interface endpoint (ssm, ssmmessages, ec2messages) khoảng 0.01 USD/giờ mỗi endpoint/AZ, hoặc đặt EC2 ở public subnet cho lab.
> Dọn dẹp: {{cdk destroy}}, xoá association, parameter.`,
      practice: 20,
    },
    {
      n: 21, exam: 'dop-c02', title: 'Giải pháp bền vững: ASG nâng cao, multi-AZ/multi-Region, chaos engineering', domains: ['dop-d3'],
      goals: [
        'Dùng lifecycle hook của ASG (drain kết nối, lấy log trước khi terminate), warm pool, health check tuỳ chỉnh.',
        'Ôn lại DR từ tuần 8 dưới góc DevOps: tự động hoá failover, IaC cho Region phụ, kiểm thử DR định kỳ.',
        'Kiểm thử khả năng chịu lỗi bằng AWS Fault Injection Service (FIS) với stop condition là CloudWatch alarm.',
        'Thiết kế ứng dụng stateless, session ra ElastiCache/DynamoDB, queue làm buffer khi downstream chậm.',
      ],
      study: [
        { title: 'Amazon EC2 Auto Scaling lifecycle hooks', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html' },
        { title: 'What is AWS Fault Injection Service?', url: 'https://docs.aws.amazon.com/fis/latest/userguide/what-is.html' },
        { title: 'Reliability Pillar – Well-Architected', url: 'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html' },
        { title: 'What is Elastic Disaster Recovery?', url: 'https://docs.aws.amazon.com/drs/latest/userguide/what-is-drs.html' },
      ],
      lab: `### Mục tiêu
Phá có kiểm soát: chứng minh ứng dụng sau ALB + ASG chịu được mất instance.

1. Dựng lại ALB + ASG 2 AZ (dùng CDK/CloudFormation của tuần 19–20 để mất 5 phút thay vì 1 giờ).
2. Thêm **lifecycle hook** {{autoscaling:EC2_INSTANCE_TERMINATING}} 120 giây; EventBridge rule bắt sự kiện hook → Lambda in log rồi gọi {{complete-lifecycle-action}}.
3. Tạo CloudWatch alarm {{HTTPCode_Target_5XX_Count}} > 10 làm **stop condition**.
4. Tạo **FIS experiment template** action {{aws:ec2:terminate-instances}} chọn 50% instance có tag {{chaos=yes}}. Chạy trong khi gửi tải bằng {{hey}} hoặc vòng lặp curl.
5. Ghi lại: có request lỗi không, ASG bù instance mất bao lâu, hook có chạy không. Đề xuất 1 cải tiến.

> Chi phí: FIS tính theo action-phút (vài cent), ALB + EC2 khoảng 0.05 USD/giờ.
> Dọn dẹp: xoá experiment template, alarm, rule, Lambda, rồi xoá stack hạ tầng.`,
      practice: 20,
    },
    {
      n: 22, exam: 'dop-c02', title: 'Monitoring và logging: CloudWatch, Logs Insights, X-Ray, pipeline log', domains: ['dop-d4'],
      goals: [
        'Thu thập metric và log: CloudWatch agent, custom metric, Embedded Metric Format, metric filter → alarm.',
        'Alarm thông minh: composite alarm, anomaly detection; dashboard; Synthetics canary đo từ phía người dùng.',
        'Phân tích log bằng Logs Insights; đẩy log tập trung bằng subscription filter → Firehose/Lambda/OpenSearch, cross-account observability.',
        'Tracing phân tán bằng X-Ray (hoặc ADOT/OpenTelemetry) cho service Java.',
      ],
      study: [
        { title: 'What is Amazon CloudWatch?', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html' },
        { title: 'CloudWatch Logs Insights query syntax', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html' },
        { title: 'Real-time processing of log data with subscriptions', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Subscriptions.html' },
        { title: 'Embedding metrics within logs (EMF)', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html' },
        { title: 'Create a composite alarm', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Create_Composite_Alarm.html' },
        { title: 'What is AWS X-Ray?', url: 'https://docs.aws.amazon.com/xray/latest/devguide/aws-xray.html' },
      ],
      lab: `### Mục tiêu
Từ log thô tới alarm có ý nghĩa và một truy vấn điều tra sự cố.

1. Dùng Lambda {{price-api}} (tuần 18) in log JSON có {{latencyMs}} và {{status}}; gọi 300 lần, 5% cố tình lỗi.
2. Tạo **metric filter** đếm {{status = 500}} → metric {{ApiErrors}}; alarm khi > 5 trong 5 phút, gửi SNS email.
3. Logs Insights:
~~~text
fields @timestamp, latencyMs, status
| filter status = 500
| stats count() as errors, pct(latencyMs, 99) as p99 by bin(5m)
~~~
4. Bật **X-Ray active tracing** cho Lambda, xem service map và trace của một request lỗi.
5. Tạo **subscription filter** từ log group sang Firehose → S3 (dùng lại tuần 10) để lưu log dài hạn rẻ.
6. Tạo **composite alarm**: chỉ báo động khi ApiErrors ALARM **và** p99 latency ALARM, giảm báo động giả.

> Chi phí: log ingest 0.50 USD/GB (lab vài MB), alarm 0.10 USD/tháng, X-Ray có Free Tier.
> Dọn dẹp: xoá alarm, metric filter, subscription filter, Firehose, log group.`,
      practice: 20,
    },
    {
      n: 23, exam: 'dop-c02', title: 'Xử lý sự cố và sự kiện: EventBridge, SSM Automation, Incident Manager', domains: ['dop-d5'],
      goals: [
        'Tự động phản ứng bằng EventBridge rule (sự kiện AWS Health, GuardDuty, CodePipeline, ASG) → Lambda / SSM Automation / SNS.',
        'Viết runbook bằng SSM Automation (document, approval step, rate control); dùng OpsCenter và Incident Manager cho quy trình on-call.',
        'Tự sửa cấu hình sai bằng AWS Config rule + remediation; tự rollback deploy theo alarm.',
        'Phân tích sự cố: đọc CloudTrail, metric, log để tìm root cause; xử lý lỗi pipeline và lỗi deploy hay gặp.',
      ],
      study: [
        { title: 'What Is Amazon EventBridge?', url: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html' },
        { title: 'AWS Systems Manager Automation', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-automation.html' },
        { title: 'What Is Incident Manager?', url: 'https://docs.aws.amazon.com/incident-manager/latest/userguide/what-is-incident-manager.html' },
        { title: 'Remediating noncompliant resources with AWS Config', url: 'https://docs.aws.amazon.com/config/latest/developerguide/remediation.html' },
        { title: 'What is AWS Health?', url: 'https://docs.aws.amazon.com/health/latest/ug/what-is-aws-health.html' },
      ],
      lab: `### Mục tiêu
Một sự cố cấu hình tự được phát hiện và tự sửa trong vài phút.

1. Bật **AWS Config** (chỉ ghi các loại tài nguyên cần thiết: S3 bucket, security group để giảm phí).
2. Thêm managed rule {{s3-bucket-public-read-prohibited}} (hoặc {{restricted-ssh}} cho security group).
3. Gắn **remediation tự động** dùng SSM Automation document {{AWS-DisableS3BucketPublicReadWrite}} (hoặc {{AWS-DisablePublicAccessForSecurityGroup}}), role cho Automation.
4. Cố tình mở public một bucket (hoặc mở port 22 cho {{0.0.0.0/0}}); xem Config đánh NON_COMPLIANT rồi Automation sửa lại.
5. Tạo EventBridge rule bắt sự kiện **Config compliance change** → SNS email để on-call biết.
6. Viết một Automation document nhỏ 2 bước (snapshot EBS → restart instance) có bước {{aws:approve}}.

> Chi phí: Config tính theo configuration item và rule evaluation (lab vài cent đến dưới 1 USD); Automation miễn phí ở mức lab.
> Dọn dẹp: xoá remediation, rule, tắt recorder Config (stop recording) và xoá delivery channel nếu không dùng nữa; xoá EventBridge rule.`,
      practice: 20,
    },
    {
      n: 24, exam: 'dop-c02', title: 'Bảo mật và tuân thủ tự động: IAM ở quy mô lớn, Security Hub, GuardDuty', domains: ['dop-d6'],
      goals: [
        'IAM ở quy mô lớn: Identity Center + permission set, permissions boundary cho developer tự tạo role, IAM Access Analyzer.',
        'Ôn lại SCP, tag policy từ tuần 5 và 12; bảo vệ pipeline (role tối thiểu, secrets không nằm trong code).',
        'Phát hiện và tổng hợp: GuardDuty (delegated admin), Inspector (CVE trên EC2/ECR/Lambda), Macie, Security Hub (standards, findings tập trung).',
        'Tự động phản ứng finding: Security Hub/GuardDuty → EventBridge → Lambda cô lập instance.',
      ],
      study: [
        { title: 'IAM Access Analyzer', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html' },
        { title: 'Introduction to AWS Security Hub', url: 'https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html' },
        { title: 'What is Amazon GuardDuty?', url: 'https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html' },
        { title: 'What is Amazon Inspector?', url: 'https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html' },
        { title: 'What Is AWS Config?', url: 'https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html' },
      ],
      lab: `### Mục tiêu
Bật "radar bảo mật" và xử lý tự động một finding.

1. Bật **GuardDuty** (30 ngày dùng thử miễn phí). Tạo sample findings ({{aws guardduty create-sample-findings}}).
2. Bật **Security Hub** với standard AWS Foundational Security Best Practices; đọc 10 control fail đầu tiên và sửa 2 cái.
3. Tạo EventBridge rule cho finding GuardDuty mức High → Lambda gắn security group "quarantine" (không inbound/outbound) vào instance trong finding (thử với instance lab).
4. Bật **IAM Access Analyzer** cho account, xem finding về bucket/role chia sẻ ra ngoài (ví dụ bucket cross-account của tuần 7).
5. Tạo permissions boundary cho phép developer tạo role nhưng không vượt boundary; thử tạo role có quyền {{iam:*}} và thấy bị chặn.

> Chi phí: GuardDuty, Security Hub, Inspector có dùng thử 30 ngày; tắt sau lab nếu không cần.
> Dọn dẹp: disable Security Hub, suspend GuardDuty, xoá analyzer, rule, Lambda và security group quarantine.`,
      practice: 20,
    },
    // ---------------- Giai đoạn 5 (tuần 25–26): ôn và thi DOP-C02 ----------------
    {
      n: 25, exam: 'dop-c02', title: 'Ôn DOP-C02: thi thử, vá domain yếu', domains: ['dop-d1', 'dop-d2', 'dop-d3', 'dop-d4', 'dop-d5', 'dop-d6'],
      goals: [
        'Làm 2 bài thi thử đủ 75 câu / 180 phút; domain dưới 75% luyện lại "câu sai/chưa làm".',
        'Ôn bảng so sánh: chiến lược deploy, CodeDeploy config theo platform, CloudFormation policy/attribute, công cụ SSM.',
        'Ôn lại phần chồng lấn với SAP: multi-account, DR, logging tập trung, bảo mật tổ chức.',
        'Đặt lịch thi cuối tuần 26 khi điểm thi thử ổn định ≥ 800.',
      ],
      study: [
        { title: 'AWS Certified DevOps Engineer – Professional (exam page)', url: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/' },
        { title: 'Practicing CI/CD on AWS (đọc lại)', url: 'https://docs.aws.amazon.com/whitepapers/latest/practicing-continuous-integration-continuous-delivery/welcome.html' },
        { title: 'Blue/Green Deployments on AWS (đọc lại)', url: 'https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/welcome.html' },
      ],
      lab: `### Mục tiêu
Một "capstone" nhỏ nối tất cả: pipeline deploy hạ tầng + app có monitoring và tự rollback.

1. Repo chứa CDK app (VPC, ALB, ECS Fargate service) và code Spring Boot.
2. CodePipeline: build image → push ECR → {{cdk deploy}} stack dev → manual approval → stack prod (có thể cùng account cho lab).
3. ECS deploy có **deployment circuit breaker** với rollback; alarm 5xx gắn vào.
4. Push bản lỗi (health check fail) và xem service tự rollback; push bản tốt và xem nó lên.
5. Thi thử 2 lần trong tuần, ghi điểm từng domain.

> Chi phí: Fargate + ALB khoảng 0.05–0.08 USD/giờ; làm trong 1 buổi rồi xoá.
> Dọn dẹp: {{cdk destroy}} cả 2 stack, xoá pipeline, image ECR, bucket artifact. Kiểm tra Cost Explorer lần cuối.`,
      practice: 150,
    },
    {
      n: 26, exam: 'dop-c02', title: 'Thi DOP-C02', domains: ['dop-d1', 'dop-d2', 'dop-d3', 'dop-d4', 'dop-d5', 'dop-d6'],
      goals: [
        'Thi thử lần cuối giữa tuần, mục tiêu ≥ 800/1000; nghỉ ngơi trước ngày thi.',
        'Chiến thuật như SAP: đọc câu hỏi cuối trước, loại phương án sai, đánh dấu câu dài, không bỏ trống.',
        'Sau khi đỗ: cập nhật CV/LinkedIn, viết 2 câu chuyện STAR về lab/capstone để kể khi phỏng vấn.',
      ],
      study: [
        { title: 'AWS Certified DevOps Engineer – Professional (exam page)', url: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/' },
      ],
      lab: `### Checklist ngày thi
1. Kiểm tra giấy tờ, giờ thi, máy (nếu thi online) từ hôm trước.
2. Từ khoá hay gặp: "least management overhead" → dịch vụ managed; "across all accounts" → Organizations/StackSets/delegated admin; "automatically remediate" → Config + SSM Automation hoặc EventBridge + Lambda.
3. Mỗi câu khoảng 2 phút 20 giây; còn 20 phút quay lại câu đánh dấu.

> Sau khi đỗ cả hai: dọn mọi tài nguyên lab, đóng account Sandbox nếu không dùng, giữ Budgets để tránh hoá đơn bất ngờ.`,
      practice: 75,
    },
  ],
};
