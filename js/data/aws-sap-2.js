/* AWS SAP-C02 practice questions, part 2: sap-041..sap-076 (domain 3 Continuous Improvement, domain 4 Migration & Modernization).
 * Schema: docs/AWS-TRACK.md. Check: node scripts/check-aws.js */
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'sap-041',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company runs 60 AWS accounts in AWS Organizations. Each workload account sends metrics, logs, and AWS X-Ray traces to Amazon CloudWatch in its own account. The central operations team must troubleshoot incidents from a single account and correlate metrics, logs, and traces across all workload accounts. New accounts must be included automatically. The team does not want to copy log data into another store. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Configure CloudWatch cross-account observability. Designate the operations account as the monitoring account, and link all accounts in the organization as source accounts by using the Organizations integration.",
    "Create CloudWatch Logs subscription filters in every account that stream logs to Amazon Data Firehose, deliver the data to a central Amazon S3 bucket, and query it with Amazon Athena.",
    "Enable the CloudWatch cross-account cross-Region dashboard feature and build one dashboard per workload account in the operations account. Use IAM roles to switch into each account to read traces.",
    "Deploy a self-managed Prometheus and Grafana cluster on Amazon EC2 in the operations account and install exporters on every workload instance."
  ],
  answer: 0,
  explain: `**Từ khoá:** "single account", "correlate metrics, logs, and traces", "new accounts automatically", "không copy log", "LEAST operational overhead".

**Vì sao A đúng:** **CloudWatch cross-account observability** cho phép chọn một **monitoring account** (sink) và liên kết các **source account** (link). Từ monitoring account bạn xem và truy vấn metrics, Logs Insights, traces (X-Ray / Application Signals) của mọi source account như dữ liệu của chính mình, dữ liệu **không bị copy** mà vẫn nằm ở account gốc. Khi tích hợp với Organizations (chia sẻ sink cho cả org hoặc OU), account mới tạo trong OU được link tự động bằng template CloudFormation/StackSets.

**Vì sao các phương án khác sai:**
- **B**: chỉ có log, không có metrics và traces; lại phải dựng pipeline Firehose + S3 + Athena và copy dữ liệu, trái yêu cầu.
- **C**: tính năng dashboard cross-account cũ chỉ cho xem dashboard; traces vẫn phải switch role từng account, không correlate được, tạo dashboard thủ công cho 60 account là overhead lớn.
- **D**: tự vận hành Prometheus/Grafana trên EC2 (patch, scale, HA) là overhead cao nhất và không thu traces X-Ray.

> Exam tip: thấy "central monitoring account" + "metrics, logs, traces" + "least overhead" thì nghĩ ngay tới CloudWatch cross-account observability (sink/link qua Observability Access Manager).`,
  services: ['Amazon CloudWatch', 'AWS X-Ray', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'CloudWatch cross-account observability', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Unified-Cross-Account.html' }]
},
{
  id: 'sap-042',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company has 1,200 long-lived Amazon EC2 instances that run Amazon Linux 2023 and Windows Server across 25 accounts in AWS Organizations and two AWS Regions. The instances are stateful and cannot be replaced. Security policy requires that operating system patches are installed monthly during a defined maintenance window and that patch compliance is reported centrally. Some instances are not currently visible in AWS Systems Manager. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Add a cron job to the user data of each instance that runs the OS package manager update command monthly, and publish the output to Amazon CloudWatch Logs for review.",
    "Enable Amazon Inspector in every account so that it automatically installs missing patches when it finds vulnerabilities, and aggregate the findings in AWS Security Hub.",
    "Enable Systems Manager Default Host Management Configuration, and create a Systems Manager Quick Setup patch policy for the organization that targets all accounts and both Regions with a monthly schedule. Review compliance centrally.",
    "Use EC2 Image Builder to produce a patched AMI every month, and replace each instance with a new instance launched from the latest AMI."
  ],
  answer: 2,
  explain: `**Từ khoá:** "stateful, cannot be replaced", "maintenance window", "reported centrally", "25 accounts, 2 Regions", "some instances not visible in Systems Manager".

**Vì sao C đúng:**
- **Default Host Management Configuration (DHMC)** cho phép Systems Manager quản lý EC2 mà không cần gắn instance profile riêng cho từng máy (vẫn cần SSM Agent đủ mới và IMDSv2), giải quyết các instance "không thấy" trong Systems Manager.
- **Quick Setup patch policy** cấu hình Patch Manager cho cả organization/OU và nhiều Region một lần: patch baseline, lịch quét và cài đặt, lưu log, rồi báo cáo compliance tập trung.

**Vì sao các phương án khác sai:**
- **A**: cron trong user data chỉ chạy khi cấu hình đúng từng máy, không có baseline, không có báo cáo compliance; Windows cũng không dùng cùng lệnh.
- **B**: **Amazon Inspector chỉ phát hiện** lỗ hổng, không tự cài patch.
- **D**: immutable infrastructure là best practice, nhưng đề nói rõ instance stateful không thể thay thế.

> Exam tip: "patch + compliance + nhiều account/Region" = Systems Manager Patch Manager (Quick Setup patch policy). Inspector = phát hiện, Patch Manager = khắc phục.`,
  services: ['AWS Systems Manager', 'AWS Organizations', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'AWS Systems Manager Patch Manager', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager.html' }]
},
{
  id: 'sap-043',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A security audit found several security groups across a company's 40 AWS accounts that allow inbound SSH and RDP from 0.0.0.0/0. Developers still need to create and modify security groups for legitimate use. The security team wants any security group that opens SSH or RDP to the internet to be detected and corrected automatically within minutes in every account, with a compliance history for auditors. Which solution meets these requirements?`,
  options: [
    "Enable Amazon GuardDuty in all accounts and create an Amazon EventBridge rule that notifies the security team when GuardDuty reports an open security group.",
    "Deploy an AWS Config conformance pack across the organization that includes the restricted-ssh and restricted-common-ports managed rules, with automatic remediation that runs the AWS-DisablePublicAccessForSecurityGroup Systems Manager Automation runbook.",
    "Attach an SCP to all OUs that denies the ec2:AuthorizeSecurityGroupIngress action for all principals in member accounts.",
    "Use the AWS Trusted Advisor security group check, export the weekly report to Amazon S3, and have an operator remove the offending rules."
  ],
  answer: 1,
  explain: `**Từ khoá:** "detected and corrected automatically", "within minutes", "every account", "compliance history", "developers still need to modify security groups".

**Vì sao B đúng:** **AWS Config** đánh giá cấu hình khi có thay đổi (configuration change trigger) và lưu **lịch sử compliance** cho auditor. **Conformance pack** triển khai một bộ rule cho cả organization. Rule managed **restricted-ssh** phát hiện SSH mở 0.0.0.0/0, **restricted-common-ports** phát hiện các port nhạy cảm khác như RDP. **Automatic remediation** gọi runbook Systems Manager **AWS-DisablePublicAccessForSecurityGroup** để gỡ rule SSH/RDP mở ra internet.

**Vì sao các phương án khác sai:**
- **A**: GuardDuty là dịch vụ phát hiện **mối đe doạ** (từ CloudTrail, VPC Flow Logs, DNS logs), không đánh giá cấu hình security group; chỉ notify thì cũng không tự sửa.
- **C**: SCP chặn toàn bộ AuthorizeSecurityGroupIngress sẽ làm developer không thêm được rule hợp lệ nào, vi phạm yêu cầu.
- **D**: báo cáo hàng tuần + thao tác tay không đạt "within minutes" và không tự động.

> Exam tip: "detect + auto-remediate cấu hình sai + lịch sử compliance" = AWS Config rule + remediation bằng SSM Automation; triển khai đa account bằng conformance pack hoặc organization rule.`,
  services: ['AWS Config', 'AWS Systems Manager', 'AWS Organizations', 'Amazon VPC'],
  refs: [{ type: 'doc', title: 'Remediating noncompliant resources with AWS Config', url: 'https://docs.aws.amazon.com/config/latest/developerguide/remediation.html' }]
},
{
  id: 'sap-044',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company runs a Java application on Amazon ECS with AWS Fargate. The application connects to an Amazon RDS for SQL Server DB instance. The database password is stored in plaintext as an environment variable in the task definition. A new security policy requires that the password is removed from the task definition, rotated every 30 days, and that running tasks continue to work after rotation without redeployment. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Enable IAM database authentication on the DB instance and change the application to generate an authentication token for each connection by using the task IAM role.",
    "Store the password as a Systems Manager Parameter Store SecureString parameter referenced in the task definition, and create an Amazon EventBridge scheduled rule that invokes a custom Lambda function to change the password every 30 days.",
    "Encrypt the environment variable with an AWS KMS customer managed key and enable automatic key rotation every 30 days.",
    "Store the credentials in AWS Secrets Manager with automatic rotation every 30 days. Grant the task IAM role secretsmanager:GetSecretValue, and change the application to read the secret at runtime through the Secrets Manager caching client for Java."
  ],
  answer: 3,
  explain: `**Từ khoá:** "RDS for SQL Server", "rotated every 30 days", "running tasks continue to work without redeployment", "LEAST operational overhead".

**Vì sao D đúng:** **Secrets Manager** có rotation tích hợp sẵn cho RDS (managed rotation hoặc rotation function do AWS cung cấp), không phải tự viết logic đổi mật khẩu. Ứng dụng lấy secret **lúc runtime** qua caching client: cache có TTL nên sau khi rotation, lần làm mới tiếp theo sẽ lấy mật khẩu mới mà không cần deploy lại task. Task IAM role chỉ cần quyền đọc đúng secret đó (least privilege).

**Vì sao các phương án khác sai:**
- **A**: **IAM database authentication không hỗ trợ RDS for SQL Server** (chỉ MySQL, MariaDB, PostgreSQL và Aurora tương ứng). Đây là bẫy chính.
- **B**: Parameter Store không có rotation tích hợp, phải tự viết Lambda đổi mật khẩu cả ở DB lẫn parameter, overhead cao. Thêm nữa giá trị tham chiếu trong task definition chỉ được inject **lúc task khởi động**, task đang chạy sẽ giữ mật khẩu cũ.
- **C**: rotation của KMS key chỉ đổi key material, **không đổi mật khẩu DB**; mật khẩu vẫn nằm trong task definition.

> Exam tip: "rotate DB credentials automatically" gần như luôn là Secrets Manager. Nhớ: secret inject qua task definition chỉ đọc lúc start; muốn nhận giá trị mới ngay thì app phải đọc runtime (có cache).`,
  services: ['AWS Secrets Manager', 'Amazon ECS', 'AWS Fargate', 'Amazon RDS']
},
{
  id: 'sap-045',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company has more than 300 IAM roles across its accounts in AWS Organizations. An audit found that many roles have broad permissions such as AdministratorAccess, and nobody knows which permissions are actually used. The security team must continuously identify unused roles and unused permissions across the organization and then replace broad policies with least-privilege policies based on real activity. Which actions should a solutions architect take to meet these requirements? (Choose two.)`,
  options: [
    "Enable Amazon Macie in all accounts to classify which IAM policies contain sensitive permissions.",
    "Create an organization-level IAM Access Analyzer unused access analyzer from the delegated administrator account to report unused roles, access keys, and permissions.",
    "Enable Amazon GuardDuty and use its findings to identify which permissions each role does not need.",
    "Use AWS Trusted Advisor to generate least-privilege IAM policies for each role from its utilization checks.",
    "Use IAM Access Analyzer policy generation, which analyzes the AWS CloudTrail activity of a role, to generate a least-privilege policy and replace the broad policy after review."
  ],
  answer: [1, 4],
  multi: true,
  explain: `**Từ khoá:** "continuously identify unused roles and permissions", "across the organization", "least-privilege policies based on real activity".

**Vì sao B và E đúng:**
- **B**: **Unused access analyzer** của IAM Access Analyzer (tính phí theo số role/user được phân tích) chạy liên tục, tạo finding cho role không dùng, access key và password không dùng, và cả **service/action không dùng** trong policy. Có thể tạo ở cấp organization từ delegated administrator account.
- **E**: **Policy generation** đọc CloudTrail trail của role trong khoảng thời gian bạn chọn (tối đa 90 ngày) và sinh ra policy chỉ gồm các action thực sự được gọi. Bạn review, bổ sung resource ARN rồi thay thế policy rộng.

**Vì sao các phương án khác sai:**
- **A**: Macie phát hiện dữ liệu nhạy cảm (PII) **trong S3**, không phân tích IAM policy.
- **C**: GuardDuty phát hiện hành vi đáng ngờ và mối đe doạ, không cho biết quyền nào không dùng.
- **D**: Trusted Advisor không sinh policy least-privilege.

> Exam tip: "least privilege dựa trên activity" = Access Analyzer policy generation (từ CloudTrail). "tìm quyền/role không dùng liên tục ở org" = Access Analyzer unused access. Trước đây đề hay dùng "last accessed information" của IAM, vẫn đúng cho phân tích từng role.`,
  services: ['IAM Access Analyzer', 'AWS CloudTrail', 'AWS Organizations', 'AWS IAM'],
  refs: [{ type: 'doc', title: 'What is IAM Access Analyzer?', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html' }]
},
{
  id: 'sap-046',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `Amazon GuardDuty is enabled in all accounts of a company and aggregated in a delegated administrator account. GuardDuty recently reported a CryptoCurrency:EC2/BitcoinTool.B!DNS finding for an instance in an Auto Scaling group, and it took the on-call engineer 3 hours to react. The company wants compromised instances to be contained automatically within minutes while preserving evidence for forensic investigation. Which solution meets these requirements?`,
  options: [
    "Create an Amazon EventBridge rule that matches GuardDuty findings of the relevant types and starts an AWS Step Functions workflow that detaches the instance from the Auto Scaling group, replaces its security groups with an isolation security group that has no rules, creates EBS snapshots, and tags the instance for investigation.",
    "Create an Amazon EventBridge rule that matches the GuardDuty findings and invokes an AWS Lambda function that immediately terminates the instance so that the Auto Scaling group launches a clean replacement.",
    "Enable AWS Security Hub and configure a weekly email report of GuardDuty findings to the security team so that they can isolate instances manually.",
    "Enable Amazon Inspector on the instances so that Inspector stops the malicious process when GuardDuty reports a finding."
  ],
  answer: 0,
  explain: `**Từ khoá:** "contained automatically within minutes", "preserving evidence for forensic investigation", "Auto Scaling group".

**Vì sao A đúng:** GuardDuty gửi finding tới **EventBridge**; rule lọc theo finding type rồi kích hoạt workflow tự động:
1. **Detach khỏi ASG** để ASG không terminate máy (mất bằng chứng) khi health check fail, đồng thời ASG tự bổ sung máy sạch.
2. Thay security group bằng **isolation SG** không có rule để cắt kết nối mới. Lưu ý thực tế: kết nối đã được tracking có thể chưa bị cắt ngay, nên runbook thực tế còn dùng thêm network ACL.
3. **Snapshot EBS** và gắn tag để giữ bằng chứng (disk, có thể thêm memory capture).

**Vì sao các phương án khác sai:**
- **B**: terminate ngay thì nhanh nhưng **mất toàn bộ bằng chứng** (disk, memory, process), vi phạm yêu cầu forensic.
- **C**: báo cáo hàng tuần + xử lý tay không đạt "within minutes".
- **D**: Amazon Inspector quét lỗ hổng phần mềm và network reachability, **không dừng process** hay phản ứng với finding.

> Exam tip: mẫu "GuardDuty finding → EventBridge → Lambda/Step Functions/SSM Automation" là đáp án chuẩn cho automated incident response. Nếu đề nhắc forensic thì chọn isolate + snapshot, không chọn terminate.`,
  services: ['Amazon GuardDuty', 'Amazon EventBridge', 'AWS Step Functions', 'Amazon EC2 Auto Scaling'],
  refs: [{ type: 'doc', title: 'Processing GuardDuty findings with Amazon EventBridge', url: 'https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html' }]
},
{
  id: 'sap-047',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company uses AWS Backup in each workload account to back up Amazon RDS, Amazon EBS, and Amazon DynamoDB resources. A ransomware risk assessment concluded that an attacker who obtains administrator credentials in a workload account could delete both the resources and their backups. The company must keep recoverable copies of backups for 35 days that cannot be deleted or shortened by anyone, including the root user of the workload account. Which combination of steps meets these requirements? (Choose two.)`,
  options: [
    "Configure AWS Backup plans to copy recovery points to a backup vault in a separate, dedicated backup account in the same organization.",
    "Enable versioning on all Amazon S3 buckets in the workload accounts.",
    "Use Amazon Data Lifecycle Manager in each workload account to create additional EBS snapshots every hour.",
    "Apply AWS Backup Vault Lock in compliance mode to the destination vault with a minimum retention of 35 days.",
    "Encrypt the backups with an AWS KMS key in the workload account and schedule the key for deletion in 30 days to protect it."
  ],
  answer: [0, 3],
  multi: true,
  explain: `**Từ khoá:** "attacker with admin credentials in the workload account", "cannot be deleted or shortened by anyone, including root", "35 days".

**Vì sao A và D đúng:**
- **A**: **Cross-account copy** sang một backup account riêng (cùng Organizations) tạo ranh giới blast radius: credential bị lộ ở workload account không có quyền gì ở backup account.
- **D**: **Vault Lock compliance mode** biến vault thành WORM: sau grace time (cooling-off), không ai, kể cả root và AWS, xoá được recovery point trước hạn hoặc giảm retention, cũng không gỡ được lock. Governance mode thì user có đủ quyền vẫn gỡ được, nên không đạt "anyone".

**Vì sao các phương án khác sai:**
- **B**: S3 versioning không áp dụng cho RDS/EBS/DynamoDB, và admin vẫn xoá được version.
- **C**: snapshot thêm trong **cùng account** bị kẻ tấn công xoá được như cũ.
- **E**: xoá KMS key chỉ làm backup **không giải mã được**, ngược mục tiêu khôi phục.

> Exam tip: "immutable backup / ransomware / kể cả root" = Backup Vault Lock **compliance** mode + copy sang account khác. AWS Backup còn có **logically air-gapped vault** (khoá sẵn, chia sẻ qua AWS RAM) cho cùng mục tiêu.`,
  services: ['AWS Backup', 'AWS Organizations', 'AWS KMS'],
  refs: [{ type: 'doc', title: 'AWS Backup Vault Lock', url: 'https://docs.aws.amazon.com/aws-backup/latest/devguide/vault-lock.html' }]
},
{
  id: 'sap-048',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `Auditors require a company to record all AWS API activity in every account and every AWS Region of its organization. The logs must be tamper-evident, retained for 7 years, stored outside the accounts that generate them, and member account administrators must not be able to stop or delete the logging. Which solution meets these requirements?`,
  options: [
    "Create a CloudTrail trail in each member account that delivers logs to a bucket in the same account, and use an SCP to deny s3:DeleteObject on that bucket.",
    "Rely on the CloudTrail event history in each account and export it to Amazon S3 once a year for long-term retention.",
    "Create an organization trail for all Regions from the management account with log file integrity validation enabled. Deliver logs to an S3 bucket in a dedicated log archive account that uses S3 Object Lock in compliance mode with a 7-year retention period.",
    "Create an AWS Config aggregator in a log archive account and retain configuration history for 7 years."
  ],
  answer: 2,
  explain: `**Từ khoá:** "all API activity", "every account and Region", "tamper-evident", "7 years", "outside the generating accounts", "member admins cannot stop it".

**Vì sao C đúng:**
- **Organization trail** tạo từ management account (hoặc delegated admin) áp dụng cho mọi account hiện có và account mới; **member account thấy trail nhưng không sửa hoặc xoá được**.
- **Log file integrity validation** tạo digest file có hash và chữ ký, giúp chứng minh log không bị sửa (tamper-evident).
- Bucket ở **log archive account** + **Object Lock compliance mode** đảm bảo WORM trong 7 năm; có thể thêm lifecycle sang S3 Glacier Deep Archive để giảm chi phí.

**Vì sao các phương án khác sai:**
- **A**: trail trong từng member account thì admin của account đó dừng hoặc xoá được trail; log vẫn nằm trong cùng account.
- **B**: Event history chỉ giữ **90 ngày** management events; export thủ công mỗi năm sẽ mất dữ liệu.
- **D**: AWS Config ghi lại **trạng thái cấu hình**, không phải toàn bộ API call (ví dụ không ghi data events hay các lệnh đọc).

> Exam tip: "audit mọi API call của toàn org + member không tắt được" = organization trail + log archive account (đúng mô hình Control Tower) + Object Lock khi cần bất biến.`,
  services: ['AWS CloudTrail', 'Amazon S3', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'Creating a trail for an organization', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/creating-trail-organization.html' }]
},
{
  id: 'sap-049',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A gaming company runs multiplayer game servers that communicate over a custom UDP protocol. The servers run on Amazon EC2 behind Network Load Balancers in us-east-1 and eu-west-1. Players around the world report high latency and jitter. Several corporate partners must allow-list a fixed set of IP addresses in their firewalls, and traffic must shift to the healthy Region quickly if one Region fails, without depending on DNS cache expiration. Which solution meets these requirements?`,
  options: [
    "Create an Amazon CloudFront distribution with the two Network Load Balancers as origins in an origin group with failover.",
    "Create an AWS Global Accelerator standard accelerator with a UDP listener and one endpoint group per Region that points to each Network Load Balancer, and give partners the accelerator's static anycast IP addresses.",
    "Create Amazon Route 53 latency-based records with health checks for the two Network Load Balancers and set a TTL of 60 seconds.",
    "Enable Amazon S3 Transfer Acceleration and route game traffic through the accelerated endpoint closest to each player."
  ],
  answer: 1,
  explain: `**Từ khoá:** "custom UDP protocol", "latency and jitter", "fixed set of IP addresses", "shift quickly … without depending on DNS cache".

**Vì sao B đúng:** **Global Accelerator** cấp **2 static anycast IP** (có thể dùng IP riêng qua BYOIP). Người chơi vào edge location gần nhất rồi đi trên **mạng backbone của AWS** tới Region, giảm latency và jitter so với internet công cộng. Hỗ trợ **TCP và UDP**, endpoint là NLB, ALB, EC2 hoặc Elastic IP. Health check và failover giữa endpoint group diễn ra ở tầng mạng, IP không đổi nên **không phụ thuộc DNS TTL**; partner chỉ cần allow-list 2 IP.

**Vì sao các phương án khác sai:**
- **A**: CloudFront chỉ phục vụ HTTP/HTTPS (và WebSocket), **không proxy UDP tuỳ ý**; IP của CloudFront cũng không cố định để allow-list.
- **C**: Route 53 latency routing vẫn dựa vào DNS; client và resolver có thể cache lâu hơn TTL, traffic vẫn đi internet công cộng, và IP của NLB không phải tập IP cố định chung cho cả hai Region.
- **D**: S3 Transfer Acceleration chỉ dùng để upload/download object S3.

> Exam tip: "non-HTTP (UDP/TCP) + static IP + fast regional failover" = Global Accelerator. "HTTP caching nội dung" = CloudFront.`,
  services: ['AWS Global Accelerator', 'Elastic Load Balancing', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'What is AWS Global Accelerator?', url: 'https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html' }]
},
{
  id: 'sap-050',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `An ecommerce company runs its product catalog on an Amazon RDS for PostgreSQL db.r6g.2xlarge Multi-AZ DB instance. CPU utilization stays above 85% during business hours. Performance Insights shows that the top SQL statements are the same few catalog queries executed thousands of times per minute. Catalog data is updated only a few times each day. The company wants sub-millisecond read latency for the catalog and lower database load in the MOST cost-effective way. The development team can change the application code. Which solution should a solutions architect recommend?`,
  options: [
    "Scale the DB instance up to db.r6g.4xlarge and enable Provisioned IOPS storage.",
    "Create three read replicas and change the application to distribute catalog queries across the replicas.",
    "Add an Amazon DynamoDB Accelerator (DAX) cluster in front of the RDS DB instance.",
    "Add an Amazon ElastiCache cluster and implement a cache-aside (lazy loading) pattern for catalog queries with a TTL, invalidating keys when the catalog is updated."
  ],
  answer: 3,
  explain: `**Từ khoá:** "same few queries thousands of times", "updated a few times a day", "sub-millisecond", "MOST cost-effective", "can change code".

**Vì sao D đúng:** Workload **read-heavy, lặp lại, ít thay đổi** là ứng viên lý tưởng cho cache. **ElastiCache** (Valkey, Redis OSS hoặc Memcached) trả kết quả từ bộ nhớ với độ trễ **sub-millisecond**. Cache-aside: đọc cache trước, miss thì query DB rồi ghi vào cache kèm TTL; khi catalog đổi thì xoá key. Tỉ lệ cache hit cao làm CPU DB giảm mạnh, một node cache nhỏ rẻ hơn nhiều so với scale DB.

**Vì sao các phương án khác sai:**
- **A**: scale up tốn gấp đôi chi phí instance, độ trễ query vẫn ở mức millisecond; vấn đề là CPU chứ không phải IOPS.
- **B**: read replica giảm tải primary nhưng mỗi replica cũng là một instance lớn (đắt), latency vẫn millisecond, và có replication lag.
- **C**: **DAX chỉ dùng cho DynamoDB**, không đặt trước RDS được.

> Exam tip: "sub-millisecond + read lặp lại" = ElastiCache (hoặc DAX nếu là DynamoDB). Read replica dùng khi query đa dạng, cần SQL trên dữ liệu gần thời gian thực, không phải để đạt sub-ms.`,
  services: ['Amazon ElastiCache', 'Amazon RDS', 'Performance Insights']
},
{
  id: 'sap-051',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company exposes a REST API through Amazon API Gateway backed by AWS Lambda functions that query an Amazon Aurora MySQL DB cluster. During marketing campaigns, Lambda concurrency rises to about 1,000 and the database returns "Too many connections" errors, although database CPU utilization stays below 40%. The functions already open the connection outside the handler. The company must fix the errors without throttling user requests and with minimal code changes. Which solution meets these requirements?`,
  options: [
    "Create an Amazon RDS Proxy for the Aurora cluster, store the database credentials in AWS Secrets Manager, and point the Lambda functions to the proxy endpoint.",
    "Set reserved concurrency for the Lambda functions to 50 so that the number of connections never exceeds the database limit.",
    "Increase the max_connections parameter and scale the writer to the largest instance class.",
    "Move the connection logic inside the handler so that each invocation opens and closes its own connection."
  ],
  answer: 0,
  explain: `**Từ khoá:** "Lambda concurrency 1,000", "Too many connections", "CPU below 40%", "without throttling", "minimal code changes".

**Vì sao A đúng:** Mỗi Lambda execution environment giữ ít nhất một connection, nên 1,000 environment đồng thời tạo khoảng 1,000 connection dù mỗi connection hầu như rảnh. **RDS Proxy** duy trì một **connection pool** dùng chung tới Aurora và **multiplex** nhiều kết nối client trên ít kết nối DB hơn. Proxy lấy credentials từ **Secrets Manager** (hoặc dùng IAM authentication). Code chỉ đổi endpoint. Proxy còn giúp failover Aurora nhanh hơn vì giữ kết nối client.

**Vì sao các phương án khác sai:**
- **B**: reserved concurrency 50 sẽ **throttle** request vượt ngưỡng, vi phạm yêu cầu.
- **C**: CPU còn dư nên scale instance lớn nhất là lãng phí; tăng max_connections cũng ăn thêm bộ nhớ và không giải quyết gốc rễ khi concurrency tiếp tục tăng.
- **D**: mở/đóng kết nối mỗi lần gọi làm tăng latency và tốn CPU cho handshake, số kết nối đồng thời vẫn bằng concurrency.

> Exam tip: "Lambda + RDS/Aurora + too many connections" = RDS Proxy. Lưu ý pinning: một số thao tác (ví dụ SET session variables) làm connection bị ghim, giảm hiệu quả multiplex.`,
  services: ['Amazon RDS Proxy', 'AWS Lambda', 'Amazon Aurora', 'AWS Secrets Manager'],
  refs: [{ type: 'doc', title: 'Amazon RDS Proxy', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html' }]
},
{
  id: 'sap-052',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company has 800 Amazon EC2 instances across 30 accounts in AWS Organizations. Most instances run memory-intensive Java applications. The FinOps team wants rightsizing recommendations for all accounts from a central place. A pilot in one account showed that AWS Compute Optimizer recommended downsizing several instances that were actually close to running out of memory. Which actions should a solutions architect take to produce accurate recommendations across the organization? (Choose two.)`,
  options: [
    "Enable EC2 detailed monitoring on all instances so that Compute Optimizer receives 1-minute metrics.",
    "Use the AWS Trusted Advisor Low Utilization Amazon EC2 Instances check as the source of rightsizing decisions.",
    "Opt in to Compute Optimizer for all member accounts of the organization from the management account or a delegated administrator account.",
    "Install and configure the Amazon CloudWatch agent on the instances to publish memory utilization metrics that Compute Optimizer can analyze.",
    "Use the Cost Explorer Reserved Instance purchase recommendations to determine the right instance sizes."
  ],
  answer: [2, 3],
  multi: true,
  explain: `**Từ khoá:** "memory-intensive", "recommended downsizing … close to running out of memory", "all accounts from a central place".

**Vì sao C và D đúng:**
- **C**: Compute Optimizer hỗ trợ **opt-in cho toàn organization** từ management account (hoặc delegated administrator) và xem recommendation của mọi member account tập trung.
- **D**: Mặc định EC2 **không có metric memory** trong CloudWatch (hypervisor không nhìn thấy bộ nhớ trong guest OS). Không có memory, Compute Optimizer chỉ dựa vào CPU, network, disk nên có thể đề xuất instance nhỏ hơn cho app Java ngốn heap. Cài **CloudWatch agent** để đẩy metric memory, Compute Optimizer sẽ dùng nó trong phân tích.

**Vì sao các phương án khác sai:**
- **A**: detailed monitoring chỉ tăng độ phân giải lên 1 phút cho metric sẵn có, **không thêm memory**.
- **B**: check của Trusted Advisor dựa trên CPU và network, cũng không biết memory, lại không đưa ra loại instance thay thế chi tiết.
- **E**: RI recommendation là khuyến nghị **mua cam kết giá**, không phải rightsizing; nên rightsizing trước rồi mới mua cam kết.

> Exam tip: thứ tự tối ưu chi phí là rightsizing (Compute Optimizer + memory metric) trước, sau đó mới mua Savings Plans/RI cho baseline. Enhanced infrastructure metrics (trả phí) kéo dài lookback lên 3 tháng cho workload có chu kỳ.`,
  services: ['AWS Compute Optimizer', 'Amazon CloudWatch', 'AWS Organizations', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'What is AWS Compute Optimizer?', url: 'https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html' }]
},
{
  id: 'sap-053',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company runs a customer portal on a single m5.xlarge Amazon EC2 instance in one Availability Zone. The instance hosts the web application, a MySQL database, and user-uploaded files stored on an attached Amazon EBS volume. During a recent impairment of that Availability Zone, the portal was unavailable for 4 hours. The company wants to remove single points of failure so that the portal survives the loss of an Availability Zone. Which combination of steps should a solutions architect take? (Choose three.)`,
  options: [
    "Move the user-uploaded files to Amazon S3 and update the application to read and write files through the S3 API.",
    "Resize the instance to m5.4xlarge and schedule hourly EBS snapshots of the volume.",
    "Run the web tier in an Auto Scaling group that spans at least two Availability Zones behind an Application Load Balancer.",
    "Launch the instances into a cluster placement group to reduce latency between them.",
    "Use an io2 EBS volume with Multi-Attach so that instances in different Availability Zones can share the files.",
    "Migrate the database to an Amazon RDS for MySQL Multi-AZ deployment."
  ],
  answer: [0, 2, 5],
  multi: true,
  explain: `**Từ khoá:** "single instance, one AZ", "web + DB + files on EBS", "survive the loss of an Availability Zone".

Có 3 điểm lỗi đơn (SPOF): compute, database, file storage. Mỗi lựa chọn đúng xử lý một SPOF.

**Vì sao A, C, F đúng:**
- **A**: S3 lưu dữ liệu dư thừa trên nhiều AZ (trừ One Zone), mọi instance ở mọi AZ đều truy cập được, nên web tier trở thành **stateless**. (Amazon EFS cũng là lựa chọn hợp lệ nếu app cần file system.)
- **C**: ASG trải trên ≥ 2 AZ + ALB: mất một AZ thì ALB chuyển traffic sang AZ còn lại và ASG tự thay instance hỏng.
- **F**: **RDS Multi-AZ** giữ standby đồng bộ ở AZ khác và tự failover, thường trong 1–2 phút, endpoint không đổi.

**Vì sao các phương án khác sai:**
- **B**: instance to hơn vẫn là một máy trong một AZ; snapshot giúp khôi phục nhưng không tránh downtime.
- **D**: cluster placement group gom instance vào **cùng một AZ** (thường gần nhau trên phần cứng), tăng rủi ro chứ không giảm.
- **E**: EBS Multi-Attach chỉ dùng được giữa các instance **trong cùng AZ**, và cần file system hỗ trợ cluster.

> Exam tip: đề "remove SPOF" thường cần tách state ra khỏi instance (S3/EFS, RDS, ElastiCache cho session), sau đó mới scale ngang bằng ASG đa AZ.`,
  services: ['Amazon S3', 'Amazon EC2 Auto Scaling', 'Elastic Load Balancing', 'Amazon RDS']
},
{
  id: 'sap-054',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A retail company's web tier calls an order fulfillment service synchronously over HTTP. The fulfillment service runs on Amazon EC2 instances and takes up to 20 seconds per order. During flash sales, traffic grows tenfold, the fulfillment service becomes overloaded, and some orders are lost when requests time out. Order processing does not need to be immediate, but every order must eventually be processed exactly as submitted. Which solution improves reliability with the LEAST operational overhead?`,
  options: [
    "Increase the idle timeout of the load balancer in front of the fulfillment service to 120 seconds and add client-side retries with exponential backoff in the web tier.",
    "Publish each order to an Amazon SNS topic with an HTTPS subscription to the fulfillment service endpoint.",
    "Have the web tier send each order to an Amazon SQS queue with a dead-letter queue. Run the fulfillment workers in an Auto Scaling group that polls the queue and scales on the queue backlog per instance.",
    "Write orders to an Amazon Kinesis Data Streams stream and run a Kinesis Client Library consumer application on the fulfillment instances, managing shard counts manually before each sale."
  ],
  answer: 2,
  explain: `**Từ khoá:** "synchronous", "tenfold spikes", "orders lost", "does not need to be immediate", "every order eventually processed", "LEAST operational overhead".

**Vì sao C đúng:** **SQS** tách web tier khỏi fulfillment (decoupling): web tier chỉ cần ghi message rồi trả lời ngay, queue **đệm** đợt tăng đột biến và lưu message tới 14 ngày. Worker xử lý theo tốc độ của mình; message chỉ bị xoá sau khi xử lý xong, lỗi thì quay lại queue sau visibility timeout (đặt lớn hơn 20 giây). **DLQ** giữ message lỗi nhiều lần để điều tra. Scale theo **backlog per instance** (ApproximateNumberOfMessagesVisible chia số instance, target tracking với custom metric) giúp ASG tăng worker đúng nhu cầu. Nếu cần thứ tự và chống trùng thì dùng FIFO queue; với Standard queue, worker phải **idempotent** vì giao ít nhất một lần.

**Vì sao các phương án khác sai:**
- **A**: vẫn đồng bộ; service quá tải thì retry càng làm quá tải hơn (retry storm), order vẫn có thể mất khi client hết retry.
- **B**: SNS là push, không đệm; HTTPS endpoint quá tải thì SNS retry theo delivery policy có giới hạn, hết retry thì message mất nếu không cấu hình DLQ.
- **D**: Kinesis dùng được nhưng phải quản lý shard, checkpoint KCL, overhead cao hơn SQS cho bài toán hàng đợi công việc.

> Exam tip: "spiky load + không cần xử lý ngay + không được mất" = SQS + ASG scale theo backlog. Kinesis hợp với streaming nhiều consumer đọc lại dữ liệu theo thứ tự shard.`,
  services: ['Amazon SQS', 'Amazon EC2 Auto Scaling', 'Amazon CloudWatch']
},
{
  id: 'sap-055',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A financial services company runs its trading application on an Amazon Aurora MySQL DB cluster in eu-west-1. A new resilience requirement states that, in the event of a complete Regional outage, the database must recover in another Region with an RPO of less than 5 seconds and an RTO of less than 5 minutes. The company also has a growing user base in us-east-1 that needs low-latency reads. Which solution meets these requirements?`,
  options: [
    "Enable Multi-AZ on the Aurora cluster by adding Aurora Replicas in two additional Availability Zones in eu-west-1.",
    "Convert the cluster to an Aurora global database with a secondary cluster in us-east-1. Serve local reads from the secondary cluster and use a managed failover to promote it during a Regional outage.",
    "Use AWS Backup to copy Aurora snapshots to us-east-1 every hour and restore a new cluster from the latest snapshot during an outage.",
    "Create an Aurora cross-Region read replica based on MySQL binary log replication in us-east-1, and write a runbook to promote it manually."
  ],
  answer: 1,
  explain: `**Từ khoá:** "complete Regional outage", "RPO < 5 seconds", "RTO < 5 minutes", "low-latency reads in us-east-1".

**Vì sao B đúng:** **Aurora Global Database** sao chép ở **tầng storage** sang Region phụ với độ trễ điển hình dưới 1 giây, không tốn tài nguyên của writer. Cluster phụ phục vụ **đọc cục bộ** cho người dùng us-east-1. Khi Region chính sập, **managed failover** (hoặc detach and promote) đưa cluster phụ thành primary, thường trong khoảng 1 phút, đạt RTO < 5 phút; RPO tính bằng giây và có thể giới hạn thêm bằng tham số RPO (Aurora PostgreSQL).

**Vì sao các phương án khác sai:**
- **A**: Aurora Replica trong cùng Region chỉ bảo vệ khỏi mất **AZ**, không chống được mất cả Region.
- **C**: snapshot mỗi giờ cho RPO tới 1 giờ; restore cluster lớn mất nhiều phút tới hàng giờ.
- **D**: binlog replication cross-Region có lag cao hơn (phụ thuộc tải ghi, có thể nhiều giây tới phút), tốn tài nguyên writer, và promote thủ công khó đảm bảo RTO.

> Exam tip: "cross-Region DR cho Aurora với RPO giây, RTO phút" = Aurora Global Database. Với DynamoDB tương ứng là global tables; với RDS (không Aurora) là cross-Region read replica.`,
  services: ['Amazon Aurora', 'Aurora Global Database'],
  refs: [{ type: 'doc', title: 'Using Amazon Aurora Global Database', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html' }]
},
{
  id: 'sap-056',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company has 40 accounts in AWS Organizations with consolidated billing. Engineering teams tag resources with CostCenter and Project tags, but the finance team cannot filter or group costs by these tags in AWS Cost Explorer. Finance also needs a granular, line-item monthly dataset that can be queried with SQL, and new resources created without the required tags must be prevented. Which solution meets these requirements?`,
  options: [
    "Use Tag Editor in AWS Resource Groups in each member account to re-apply the tags, and create an AWS Budgets budget per account.",
    "Activate the CostCenter and Project tags as cost allocation tags in each member account, and download monthly invoices as PDF files for finance.",
    "Enable AWS Cost Anomaly Detection for each tag value and export the anomaly reports to Amazon S3 for analysis.",
    "In the management account, activate CostCenter and Project as user-defined cost allocation tags. Create a CUR 2.0 export with AWS Data Exports to Amazon S3 and query it with Amazon Athena. Enforce tagging with tag policies and an SCP that denies resource creation requests that do not include the required tags."
  ],
  answer: 3,
  explain: `**Từ khoá:** "tags exist but not visible in Cost Explorer", "consolidated billing", "line-item dataset queried with SQL", "prevent untagged resources".

**Vì sao D đúng:**
- Tag do người dùng tạo chỉ xuất hiện trong Cost Explorer và báo cáo chi phí sau khi được **activate làm cost allocation tag**, và với consolidated billing việc activate làm ở **management (payer) account**. Dữ liệu tag hiển thị từ sau khi activate (có tính năng backfill để yêu cầu áp dụng ngược tối đa 12 tháng).
- **CUR 2.0** qua **AWS Data Exports** ghi dữ liệu chi tiết tới từng line item (có cột tag) vào S3; **Athena** truy vấn bằng SQL.
- **Tag policies** chuẩn hoá key và value; **SCP** với điều kiện aws:RequestTag chặn tạo resource thiếu tag (với các API hỗ trợ tag-on-create).

**Vì sao các phương án khác sai:**
- **A**: tag đã có rồi, gắn lại không giúp gì; budget theo account không cho phân bổ theo CostCenter.
- **B**: member account trong consolidated billing **không activate** cost allocation tag cho cả org; PDF invoice không truy vấn SQL được.
- **C**: Cost Anomaly Detection phát hiện bất thường chi tiêu, không thay cho báo cáo phân bổ chi phí.

> Exam tip: "cost by tag" luôn cần bước **activate cost allocation tags** ở payer account. "Granular, line-item, SQL" = CUR (Data Exports) + Athena.`,
  services: ['AWS Billing and Cost Management', 'AWS Data Exports', 'Amazon Athena', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'Activating user-defined cost allocation tags', url: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/activating-tags.html' }]
},
{
  id: 'sap-057',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company's steady-state compute spend is about $40 per hour on On-Demand Amazon EC2 instances from the m5 and c5 families in two Regions. Over the next 12 months, the company plans to move most workloads to Graviton-based m7g instances, and to move several services to Amazon ECS on AWS Fargate and AWS Lambda. Finance approves a 3-year commitment for the steady-state baseline. Which purchasing option provides the MOST savings while keeping coverage through these changes?`,
  options: [
    "Purchase a Compute Savings Plan with a 3-year term for an hourly commitment that matches the steady-state baseline.",
    "Purchase an EC2 Instance Savings Plan with a 3-year term for the m5 family in each Region.",
    "Purchase 3-year Standard Reserved Instances for the current m5 and c5 instance types.",
    "Purchase 3-year Convertible Reserved Instances and exchange them for m7g instances after the migration."
  ],
  answer: 0,
  explain: `**Từ khoá:** "change instance family (sang Graviton m7g)", "two Regions", "move to Fargate and Lambda", "3-year commitment", "keeping coverage".

**Vì sao A đúng:** **Compute Savings Plans** cam kết số tiền mỗi giờ (USD/hour) và tự áp dụng cho EC2 **bất kể family, size, OS, tenancy, Region**, đồng thời áp dụng cho **Fargate và Lambda**. Mức giảm tới khoảng 66% so với On-Demand. Mọi thay đổi trong kế hoạch vẫn được cover mà không phải đổi gì.

**Vì sao các phương án khác sai:**
- **B**: **EC2 Instance Savings Plan** giảm sâu hơn (tới khoảng 72%) nhưng khoá vào **một family trong một Region**; khi chuyển sang m7g hay Fargate/Lambda thì commitment m5 bị bỏ phí.
- **C**: Standard RI khoá instance attributes, không đổi family được và không áp dụng cho Fargate/Lambda; dư thừa thì chỉ còn cách bán trên RI Marketplace.
- **D**: Convertible RI đổi được family nhưng **chỉ cho EC2**, không cover Fargate và Lambda; exchange còn tốn công vận hành.

> Exam tip: mức giảm Instance SP/Standard RI > Compute SP/Convertible RI, đổi lại là linh hoạt. Đề nhắc "đổi family, đổi Region, chuyển sang Fargate/Lambda" thì chọn Compute Savings Plans.`,
  services: ['AWS Savings Plans', 'Amazon EC2', 'AWS Fargate', 'AWS Lambda'],
  refs: [{ type: 'doc', title: 'What are Savings Plans?', url: 'https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html' }]
},
{
  id: 'sap-058',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company's AWS bill shows about $9,000 per month in NAT gateway data processing charges in one VPC. VPC Flow Logs show that most of this traffic flows from Amazon EC2 instances in private subnets to Amazon S3 and Amazon DynamoDB in the same Region. The instances must stay in private subnets without public IP addresses. Which solution will reduce these costs the MOST?`,
  options: [
    "Replace the NAT gateway with a self-managed NAT instance on a large Amazon EC2 instance in each Availability Zone.",
    "Create interface VPC endpoints (AWS PrivateLink) for Amazon S3 and Amazon DynamoDB in each Availability Zone.",
    "Create gateway VPC endpoints for Amazon S3 and Amazon DynamoDB and add them to the route tables of the private subnets.",
    "Deploy one NAT gateway in each Availability Zone so that traffic does not cross Availability Zones."
  ],
  answer: 2,
  explain: `**Từ khoá:** "NAT gateway data processing charges", "traffic to S3 and DynamoDB in same Region", "private subnets", "reduce costs the MOST".

**Vì sao C đúng:** NAT gateway tính phí theo giờ **và theo từng GB xử lý** (khoảng 0.045 USD/GB ở us-east-1). **Gateway endpoint** cho S3 và DynamoDB là một entry trong route table (prefix list), traffic đi thẳng tới dịch vụ trên mạng AWS mà **không qua NAT** và **không tính phí** endpoint. Instance vẫn ở private subnet, có thể thêm endpoint policy để giới hạn bucket/table được truy cập.

**Vì sao các phương án khác sai:**
- **A**: NAT instance bỏ phí data processing nhưng phải tự vận hành (patch, HA, giới hạn băng thông instance), và vẫn không tối ưu bằng endpoint miễn phí.
- **B**: Interface endpoint cũng tránh được NAT, nhưng tính **phí theo giờ mỗi AZ và phí theo GB**; với traffic xuất phát từ chính VPC thì gateway endpoint (miễn phí) luôn rẻ hơn.
- **D**: NAT gateway mỗi AZ giảm phí cross-AZ và tăng HA, nhưng **phí xử lý theo GB vẫn còn** nguyên.

> Exam tip: thấy "NAT gateway cost cao + S3/DynamoDB" là chọn gateway endpoint. Interface endpoint cho S3 chỉ khi cần truy cập từ on-premises qua Direct Connect/VPN hoặc từ VPC khác.`,
  services: ['Amazon VPC', 'NAT gateway', 'Amazon S3', 'Amazon DynamoDB'],
  refs: [{ type: 'doc', title: 'Gateway endpoints for Amazon S3', url: 'https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html' }]
},
{
  id: 'sap-059',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A media company stores 2 PB in Amazon S3 Standard. Dataset A is a data lake of objects that average 50 MB with unpredictable and changing access patterns; some objects are not read for months and then are read heavily. Dataset B is application logs that are read frequently for 30 days, are rarely read afterward, and must be deleted after 1 year. When an old log is needed, a retrieval time of up to 12 hours is acceptable. Which actions will reduce storage costs the MOST without affecting availability requirements? (Choose two.)`,
  options: [
    "Transition Dataset A to S3 One Zone-Infrequent Access by using a lifecycle rule after 30 days.",
    "Move Dataset A to S3 Intelligent-Tiering, and enable the optional archive access tiers only for prefixes where asynchronous retrieval is acceptable.",
    "Store new objects of Dataset B directly in S3 Glacier Instant Retrieval.",
    "Create a lifecycle rule for Dataset B that transitions objects to S3 Glacier Deep Archive 30 days after creation and expires them 365 days after creation.",
    "Transition Dataset A to S3 Standard-Infrequent Access by using a lifecycle rule after 30 days."
  ],
  answer: [1, 3],
  multi: true,
  explain: `**Từ khoá:** Dataset A "unpredictable and changing access"; Dataset B "frequent 30 days, rarely after", "delete after 1 year", "retrieval up to 12 hours".

**Vì sao B và D đúng:**
- **B**: **Intelligent-Tiering** tự chuyển object giữa Frequent, Infrequent (sau 30 ngày không truy cập) và Archive Instant Access (sau 90 ngày), **không có phí retrieval**, chỉ có phí monitoring nhỏ theo số object. Object 50 MB nên phí monitoring không đáng kể (object < 128 KB không được tự động tiering). Archive Access/Deep Archive Access là tuỳ chọn, chỉ bật khi chấp nhận truy xuất bất đồng bộ.
- **D**: pattern của logs là biết trước, nên lifecycle rẻ hơn. **Glacier Deep Archive** rẻ nhất; standard retrieval hoàn tất **trong vòng 12 giờ**. Thời gian lưu tối thiểu 180 ngày được thoả vì object nằm ở đó 335 ngày trước khi expire.

**Vì sao các phương án khác sai:**
- **A**: One Zone-IA chỉ lưu ở một AZ (giảm availability/độ bền khi mất AZ) và có phí retrieval cao khi data được đọc nhiều trở lại.
- **C**: Glacier Instant Retrieval có **phí retrieval theo GB** và tối thiểu 90 ngày, đặt log đang đọc nhiều 30 ngày đầu vào đó rất tốn.
- **E**: Standard-IA tính phí retrieval; access pattern khó đoán làm chi phí retrieval khó kiểm soát, Intelligent-Tiering phù hợp hơn.

> Exam tip: "unknown/changing access" = Intelligent-Tiering; "known pattern theo tuổi object" = lifecycle. Nhớ minimum duration: IA 30, Glacier IR/Flexible 90, Deep Archive 180 ngày.`,
  services: ['Amazon S3', 'S3 Intelligent-Tiering', 'S3 Glacier Deep Archive'],
  refs: [{ type: 'doc', title: 'Amazon S3 Intelligent-Tiering', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering.html' }]
},
{
  id: 'sap-060',
  exam: 'sap-c02',
  domain: 'sap-d3',
  q: `A company runs a nightly batch job on 200 On-Demand c5.4xlarge Amazon EC2 instances. The job processes independent work items, checkpoints its progress to Amazon S3, and can tolerate instance interruptions. It must finish within a 6-hour window. The company wants to reduce compute costs significantly while keeping the risk of missing the window low. Which solution meets these requirements?`,
  options: [
    "Request Spot Instances only for the c5.4xlarge instance type in a single Availability Zone with the lowest-price allocation strategy.",
    "Use an EC2 Auto Scaling group with a mixed instances policy that specifies many instance types of similar size across several families and all Availability Zones, uses Spot Instances with the price-capacity-optimized allocation strategy, keeps a small On-Demand base capacity, and handles the 2-minute Spot interruption notice.",
    "Purchase Spot blocks with a defined duration of 6 hours so that the instances are not interrupted.",
    "Move the job to Dedicated Hosts purchased with a 1-year Savings Plan."
  ],
  answer: 1,
  explain: `**Từ khoá:** "independent work items", "checkpoints", "tolerate interruptions", "6-hour window", "reduce cost significantly".

**Vì sao B đúng:** Workload stateless, có checkpoint là ứng viên lý tưởng cho **Spot** (giảm tới khoảng 90% so với On-Demand). Để giữ rủi ro thấp:
- **Đa dạng hoá** nhiều instance type và nhiều AZ: mỗi tổ hợp là một Spot capacity pool riêng, càng nhiều pool càng ít bị gián đoạn đồng loạt (có thể dùng attribute-based instance type selection).
- **price-capacity-optimized** chọn pool có nhiều capacity nhất và giá thấp, giảm xác suất bị thu hồi.
- **On-Demand base** nhỏ đảm bảo công việc vẫn tiến triển.
- Bắt **interruption notice 2 phút** (qua EventBridge hoặc instance metadata) để checkpoint và trả work item.

**Vì sao các phương án khác sai:**
- **A**: một instance type trong một AZ là một pool duy nhất; lowest-price dồn vào pool rẻ nhất, thường cũng là pool dễ bị thu hồi nhất.
- **C**: **Spot blocks (defined duration) đã ngừng cung cấp**, không còn mua được.
- **D**: Dedicated Hosts dùng cho yêu cầu license/tuân thủ, đắt hơn và không hợp với job chỉ chạy 6 giờ mỗi đêm.

> Exam tip: "fault-tolerant / batch / checkpoint" = Spot + diversification + price-capacity-optimized. Baseline 24/7 dùng Savings Plans, phần dao động dùng Spot.`,
  services: ['Amazon EC2 Spot Instances', 'Amazon EC2 Auto Scaling', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'Best practices for Amazon EC2 Spot', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html' }]
},
{
  id: 'sap-061',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company plans to migrate 900 servers to AWS. The estate includes VMware virtual machines and about 150 physical Linux and Windows servers. To group servers into applications and plan migration waves, the migration team needs time-series utilization data, inbound and outbound network connections, and the list of running processes on every server. The company already uses AWS Application Discovery Service with a Migration Hub home Region, and the security team allows agents to be installed. Which approach meets these requirements?`,
  options: [
    "Deploy only the Application Discovery Service Agentless Collector in VMware vCenter and import a spreadsheet for the physical servers.",
    "Install the AWS Replication Agent of AWS Application Migration Service on all servers and use its replication dashboard to map dependencies.",
    "Use Migration Evaluator to collect inventory and produce a business case, and use its report as the dependency map.",
    "Install the AWS Application Discovery Agent on every server, review the network diagram in AWS Migration Hub, and export the data to Amazon Athena for detailed dependency analysis."
  ],
  answer: 3,
  explain: `**Từ khoá:** "physical servers", "running processes", "time-series utilization", "network connections", "agents allowed".

**Vì sao D đúng:** **Discovery Agent** (Windows và Linux) chạy **trên từng server**, kể cả máy vật lý, và thu thập cấu hình tĩnh, **time-series performance** chi tiết, kết nối mạng inbound/outbound và **danh sách process đang chạy**. Dữ liệu hiển thị trong Migration Hub (network diagram, nhóm server thành application) và có thể **export sang Athena** để phân tích dependency sâu hơn.

**Vì sao các phương án khác sai:**
- **A**: **Agentless Collector** chạy qua vCenter nên **không hỗ trợ máy vật lý** và **không thấy process** bên trong VM; file import chỉ có dữ liệu tĩnh.
- **B**: Replication Agent của MGN dùng để **replicate block storage** cho rehost, không phải công cụ discovery dependency.
- **C**: Migration Evaluator tạo **business case/TCO**, không đưa ra bản đồ process-level dùng cho wave planning chi tiết.

Lưu ý thực tế: AWS đã ngừng nhận **khách hàng mới** cho Migration Hub và Application Discovery Service (khuyến nghị AWS Transform); khách hàng đang dùng vẫn tiếp tục được. Exam guide SAP-C02 vẫn liệt kê các dịch vụ này.

> Exam tip: "processes + physical servers" = Discovery Agent; "chỉ VMware, không được cài agent" = Agentless Collector.`,
  services: ['AWS Application Discovery Service', 'AWS Migration Hub', 'Amazon Athena'],
  refs: [{ type: 'doc', title: 'What is AWS Application Discovery Service?', url: 'https://docs.aws.amazon.com/application-discovery/latest/userguide/what-is-appdiscovery.html' }]
},
{
  id: 'sap-062',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `During a portfolio assessment, a company reviews its on-premises human resources application. The application is a commercial off-the-shelf product whose license and hardware support contract expire in 8 months. The vendor now offers the same product as a fully managed SaaS subscription that includes data import tools. The company wants to stop managing infrastructure and upgrades for this application. Which migration strategy should the company choose for this application?`,
  options: [
    "Rehost the application servers to Amazon EC2 by using AWS Application Migration Service.",
    "Replatform the application by moving its database to Amazon RDS and keeping the application servers on Amazon EC2.",
    "Retain the application on premises and revisit the decision after the contract expires.",
    "Repurchase by moving to the vendor's SaaS offering and importing the existing data."
  ],
  answer: 3,
  explain: `**Từ khoá:** "commercial off-the-shelf", "vendor offers SaaS", "stop managing infrastructure and upgrades", "contract expires".

**Vì sao D đúng:** Trong **7 Rs** (Retire, Retain, Rehost, Relocate, Repurchase, Replatform, Refactor), **Repurchase** (drop and shop) là chuyển sang sản phẩm khác, thường là SaaS. Ở đây vendor có sẵn SaaS cùng sản phẩm, công ty muốn bỏ hẳn việc vận hành hạ tầng và nâng cấp, và thời điểm hết hợp đồng là lúc chuyển hợp lý.

**Vì sao các phương án khác sai:**
- **A**: Rehost chuyển nguyên trạng lên EC2; công ty **vẫn phải vận hành** OS, ứng dụng, nâng cấp và license, trái mục tiêu.
- **B**: Replatform giảm một phần việc quản trị DB nhưng app server vẫn do công ty quản lý; lại tốn công kiểm tra tương thích của sản phẩm COTS với RDS.
- **C**: Retain không xử lý được việc hết hạn hợp đồng phần cứng và đi ngược mục tiêu.

Ôn nhanh 7 Rs:
- **Retire**: tắt app không còn giá trị.
- **Retain**: giữ lại (chưa sẵn sàng, phụ thuộc mainframe, mới nâng cấp).
- **Relocate**: chuyển hypervisor lên cloud, ví dụ VMware Cloud on AWS.
- **Refactor**: viết lại theo cloud-native để có tính năng mới, scale tốt hơn.

> Exam tip: "COTS + vendor có SaaS + không muốn quản lý" = Repurchase. "Deadline gấp, không đổi code" = Rehost.`,
  services: ['AWS Migration Hub', 'AWS Application Migration Service']
},
{
  id: 'sap-063',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company must exit its data center within 4 months. It has 300 Windows and Linux servers running on a mix of VMware vSphere, Microsoft Hyper-V, and physical hardware. Most applications will not be changed before migration. Each migration wave can have a cutover window of at most 1 hour, and the team must be able to launch non-disruptive test instances before each cutover. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Install the AWS Replication Agent on the source servers and use AWS Application Migration Service to continuously replicate the servers, launch test instances, and then launch cutover instances during each window.",
    "Export each virtual machine as an image and import it with VM Import/Export, then copy the latest data with rsync during the cutover window.",
    "Use AWS Server Migration Service (AWS SMS) to schedule incremental replication of the VMware and Hyper-V virtual machines.",
    "Use AWS DataSync to copy all server file systems to Amazon EFS and rebuild the servers from new AMIs."
  ],
  answer: 0,
  explain: `**Từ khoá:** "4 months", "applications not changed" (rehost), "VMware, Hyper-V, physical", "cutover ≤ 1 hour", "non-disruptive test instances", "LEAST overhead".

**Vì sao A đúng:** **AWS Application Migration Service (MGN)** là dịch vụ AWS khuyến nghị cho lift-and-shift. Replication Agent replicate **liên tục ở mức block** lên staging area (EBS, replication server nhỏ) nên dữ liệu ở AWS luôn gần như đồng bộ với nguồn. MGN không phụ thuộc hypervisor, nên dùng được cho **VMware, Hyper-V, máy vật lý** và cả cloud khác. Bạn **launch test instance** mà không ảnh hưởng nguồn; đến giờ cutover chỉ cần dừng app, đợi replication bắt kịp, launch cutover instance, nên downtime tính bằng phút.

**Vì sao các phương án khác sai:**
- **B**: VM Import/Export là xuất/nhập ảnh từng lần, máy vật lý không áp dụng được, đồng bộ phần chênh lệch bằng rsync là thủ công và rủi ro trên 300 server.
- **C**: **AWS SMS đã ngừng (discontinued)** và được thay bằng MGN; nó cũng không hỗ trợ máy vật lý.
- **D**: DataSync chuyển **file/object**, không migrate OS, ứng dụng và cấu hình; rebuild 300 server là refactor/rebuild, không đạt timeline.

> Exam tip: "rehost nhiều server, downtime tối thiểu, test trước cutover" = MGN. VM Import/Export chỉ hợp khi import vài image đơn lẻ.`,
  services: ['AWS Application Migration Service', 'Amazon EC2', 'Amazon EBS'],
  refs: [{ type: 'doc', title: 'What is AWS Application Migration Service?', url: 'https://docs.aws.amazon.com/mgn/latest/ug/what-is-application-migration-service.html' }]
},
{
  id: 'sap-064',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company wants to migrate a 3 TB on-premises Oracle Database 19c to Amazon Aurora PostgreSQL to reduce licensing costs. The schema contains hundreds of PL/SQL packages, triggers, and sequences. The business allows a maximum of 30 minutes of downtime for the final cutover. A 1 Gbps AWS Direct Connect connection is available. Which approach meets these requirements?`,
  options: [
    "Use AWS DMS with a full-load-only task to copy the tables, and let DMS convert the PL/SQL packages automatically during the load.",
    "Export the database with Oracle Data Pump, upload the dump files to Amazon S3, and import them directly into Aurora PostgreSQL.",
    "Use AWS SCT or DMS Schema Conversion to assess and convert the schema and code objects, fix the items that cannot be converted automatically, and then use an AWS DMS task with full load and ongoing replication (CDC) until cutover.",
    "Rehost the Oracle server to Amazon EC2 with AWS Application Migration Service and then point the application to Aurora PostgreSQL."
  ],
  answer: 2,
  explain: `**Từ khoá:** "Oracle → Aurora PostgreSQL" (heterogeneous), "PL/SQL packages, triggers", "max 30 minutes downtime".

**Vì sao C đúng:** Migration khác engine có hai phần:
1. **Schema và code**: **AWS SCT** (tool desktop) hoặc **DMS Schema Conversion** (managed trong console DMS) tạo **assessment report** cho biết phần trăm tự chuyển được và các mục cần sửa tay, sau đó chuyển bảng, index, sequence, PL/SQL sang PL/pgSQL.
2. **Dữ liệu**: **DMS full load + CDC**: copy toàn bộ dữ liệu khi app vẫn chạy, rồi đọc redo/archive log của Oracle để áp thay đổi liên tục. Khi cutover, dừng ghi, đợi CDC bắt kịp (lag gần 0), chuyển app; downtime chỉ vài phút.

**Vì sao các phương án khác sai:**
- **A**: **DMS không chuyển đổi stored procedure, package, trigger**; nó chỉ tạo các đối tượng tối thiểu để chở dữ liệu. Full load không có CDC thì downtime bằng toàn bộ thời gian copy 3 TB.
- **B**: dump file của Data Pump là định dạng riêng của Oracle, **PostgreSQL không import được**.
- **D**: rehost lên EC2 vẫn là Oracle, không giảm license và không đưa dữ liệu vào Aurora.

> Exam tip: heterogeneous = SCT/DMS Schema Conversion + DMS; homogeneous (Oracle → RDS for Oracle) thì không cần SCT. Downtime thấp luôn gắn với "full load + CDC".`,
  services: ['AWS DMS', 'AWS SCT', 'Amazon Aurora', 'AWS Direct Connect'],
  refs: [{ type: 'doc', title: 'What is the AWS Schema Conversion Tool?', url: 'https://docs.aws.amazon.com/SchemaConversionTool/latest/userguide/CHAP_Welcome.html' }]
},
{
  id: 'sap-065',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company runs a 1.5 TB Microsoft SQL Server 2019 Standard edition database on premises and wants to move it to Amazon RDS for SQL Server with the same engine. The database receives writes 24 hours a day, and the maximum allowed downtime for the cutover is 15 minutes. The company has a 2 Gbps AWS Site-to-Site VPN connection to its VPC. Which solution meets these requirements?`,
  options: [
    "Use AWS SCT to convert the schema to RDS for SQL Server and then run an AWS DMS full-load-only task during the cutover window.",
    "Create the RDS for SQL Server DB instance and use an AWS DMS task with full load and ongoing replication (CDC). Enable MS-CDC or MS-Replication on the source as DMS requires, and cut over when replication lag is near zero.",
    "During the cutover window, take a full native backup of the database, copy the .bak file to Amazon S3, and restore it into RDS for SQL Server.",
    "Order an AWS Snowball Edge device, copy the database files to it, and attach the files to the RDS DB instance after the device is returned to AWS."
  ],
  answer: 1,
  explain: `**Từ khoá:** "same engine" (homogeneous), "writes 24/7", "max 15 minutes downtime", "1.5 TB".

**Vì sao B đúng:** **DMS full load + CDC** copy dữ liệu ban đầu khi nguồn vẫn nhận ghi, rồi liên tục áp thay đổi. Với SQL Server làm nguồn, DMS đọc thay đổi từ transaction log và yêu cầu bật **MS-Replication** (bảng có primary key) hoặc **MS-CDC** (bảng không có primary key) tuỳ cấu hình. Khi lag gần 0 thì dừng ghi, kiểm tra (có thể dùng DMS data validation) và chuyển connection string, downtime vài phút.

**Vì sao các phương án khác sai:**
- **A**: **SCT không cần cho migration cùng engine**; full load không có CDC thì downtime bằng thời gian copy 1.5 TB qua VPN, vượt xa 15 phút.
- **C**: chỉ backup full rồi copy và restore 1.5 TB trong cửa sổ cutover mất hàng giờ. (Native backup/restore có thể kết hợp restore differential và log backup để rút ngắn, nhưng phương án này chỉ mô tả full backup lúc cutover.)
- **D**: RDS là managed service, **không attach file DB thô** từ Snowball; thời gian vận chuyển nhiều ngày cũng không giải quyết được dữ liệu ghi liên tục.

> Exam tip: "minimal downtime + DB đang ghi liên tục" = DMS CDC (hoặc native replication). SCT chỉ xuất hiện khi đổi engine.`,
  services: ['AWS DMS', 'Amazon RDS', 'AWS Site-to-Site VPN'],
  refs: [{ type: 'doc', title: 'What is AWS Database Migration Service?', url: 'https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html' }]
},
{
  id: 'sap-066',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A research institute must move 600 TB of archived imaging data from an on-premises NAS to Amazon S3 within 6 weeks. Its internet connection is 1 Gbps, but only 50% of the bandwidth can be used for the migration because the link is shared with production traffic. The institute cannot add network capacity within this timeline and has used AWS Snowball Edge for previous projects. About 1 TB of new data is added each week during the migration. Which solution meets these requirements?`,
  options: [
    "Enable Amazon S3 Transfer Acceleration on the target bucket and upload the data with parallel multipart uploads.",
    "Order multiple Snowball Edge Storage Optimized devices to transfer the bulk of the data in parallel, and use AWS DataSync over the internet to transfer the data that changes after the devices are loaded.",
    "Install an AWS DataSync agent on premises and transfer the full 600 TB over the internet with bandwidth throttling set to 500 Mbps.",
    "Deploy an Amazon S3 File Gateway on premises and copy all the data to the gateway's file share."
  ],
  answer: 1,
  explain: `**Từ khoá:** "600 TB", "6 weeks", "1 Gbps, only 50% usable", "cannot add network capacity", "1 TB new data per week".

**Tính băng thông:** 500 Mbps = 62.5 MB/s ≈ 5.4 TB/ngày (ở mức lý tưởng 100% hiệu suất). 600 TB / 5.4 ≈ **111 ngày**, gần 16 tuần, gấp gần 3 lần thời hạn 6 tuần (42 ngày). Vậy **không phương án online nào đạt**.

**Vì sao B đúng:** **Snowball Edge Storage Optimized** chuyển dữ liệu **offline**: nạp song song nhiều thiết bị qua mạng LAN tốc độ cao rồi gửi về AWS để import vào S3. Phần dữ liệu mới (khoảng 1 TB/tuần) chỉ cần khoảng 0.2 ngày băng thông mỗi tuần, nên dùng **DataSync** online để đồng bộ phần chênh lệch là hợp lý.

**Vì sao các phương án khác sai:**
- **A**: Transfer Acceleration tối ưu đường đi qua edge location, nhưng **không vượt quá băng thông 500 Mbps** của đường truyền.
- **C**: DataSync vẫn bị giới hạn bởi cùng đường truyền, mất khoảng 111 ngày.
- **D**: File Gateway cũng upload qua cùng đường mạng, cache cục bộ không làm tăng băng thông.

Lưu ý thực tế: Snowball Edge **không còn mở cho khách hàng mới** (AWS gợi ý DataSync hoặc AWS Data Transfer Terminal), vì vậy đề ghi institute đã từng dùng Snowball Edge. Trong đề thi, bài toán "băng thông không đủ trong thời hạn" vẫn hướng tới Snow Family.

> Exam tip: luôn tính nhanh: 1 Gbps ≈ 10.8 TB/ngày ở 100%. Thời gian online > thời hạn → chọn thiết bị offline + đồng bộ delta online.`,
  services: ['AWS Snowball Edge', 'AWS DataSync', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'What is Snowball Edge?', url: 'https://docs.aws.amazon.com/snowball/latest/developer-guide/whatisedge.html' }]
},
{
  id: 'sap-067',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company is migrating a Linux application to Amazon EC2. The application uses a 50 TB NFS share on an on-premises NAS that must move to Amazon EFS. A 10 Gbps AWS Direct Connect connection is in place, and data must not traverse the public internet. The team needs to preserve POSIX permissions and timestamps, run incremental synchronizations daily for 2 weeks while the application is still on premises, verify data integrity, and complete a final sync during a short cutover window. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Deploy an AWS DataSync agent on premises that uses a VPC interface endpoint for DataSync over Direct Connect. Create a scheduled DataSync task from the NFS location to the EFS file system with data verification enabled, and run a final task at cutover.",
    "Launch EC2 instances that mount both the on-premises share and Amazon EFS, and run rsync scripts from cron daily, followed by checksum scripts.",
    "Deploy an Amazon S3 File Gateway on premises, copy the data to the gateway share, and then copy the data from Amazon S3 to Amazon EFS.",
    "Create an AWS Transfer Family SFTP server backed by Amazon EFS and have an on-premises script upload the files over SFTP."
  ],
  answer: 0,
  explain: `**Từ khoá:** "NFS → Amazon EFS", "Direct Connect, not public internet", "preserve POSIX metadata", "incremental daily", "verify integrity", "LEAST overhead".

**Vì sao A đúng:** **DataSync** là dịch vụ managed để chuyển dữ liệu giữa NFS/SMB/HDFS/object storage và S3, EFS, FSx:
- Chỉ copy phần **thay đổi** ở mỗi lần chạy, có lịch chạy (schedule).
- Giữ **metadata POSIX** (owner, permissions, timestamps).
- **Data verification** so checksum giữa nguồn và đích.
- Agent kết nối qua **VPC interface endpoint** của DataSync, nên traffic đi trong Direct Connect (private VIF/transit VIF), không qua internet; dữ liệu được mã hoá bằng TLS.
- Tự song song hoá, tận dụng tốt đường 10 Gbps.

**Vì sao các phương án khác sai:**
- **B**: rsync tự viết làm được nhưng phải tự quản lý song song hoá, retry, kiểm tra checksum và giám sát, overhead cao nhất.
- **C**: File Gateway đưa dữ liệu vào **S3**, rồi phải copy thêm sang EFS; metadata POSIX lưu dưới dạng metadata object, thêm một bước dư thừa.
- **D**: Transfer Family dành cho **đối tác/người dùng** truyền file qua SFTP/FTPS/FTP/AS2, không phải migration hàng loạt có verification.

> Exam tip: "migrate/sync file share lên EFS/FSx/S3 một lần hoặc định kỳ" = DataSync. "Truy cập hybrid lâu dài với cache cục bộ" = Storage Gateway.`,
  services: ['AWS DataSync', 'Amazon EFS', 'AWS Direct Connect'],
  refs: [{ type: 'doc', title: 'What is AWS DataSync?', url: 'https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html' }]
},
{
  id: 'sap-068',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A logistics company receives daily files from 200 external partners through an SFTP server in its data center. Partners authenticate with SSH keys and have allow-listed the server's public IP address in their outbound firewalls. The company is moving all file processing to AWS and wants files to land directly in Amazon S3. Partners must not change their client configuration, and the company wants to stop managing SFTP servers. Which solution meets these requirements?`,
  options: [
    "Run an SFTP server on Amazon EC2 behind a Network Load Balancer, mount an S3 bucket on the instance with a FUSE-based tool, and import the partner keys.",
    "Give each partner an IAM user with access keys and ask them to upload files with the AWS CLI.",
    "Create an AWS Transfer Family SFTP server with a VPC-hosted, internet-facing endpoint that uses Elastic IP addresses, store files in Amazon S3, import the existing SSH host key and partner public keys as service-managed users, and point the existing DNS name to the endpoint.",
    "Create an AWS DataSync task that polls the partners' systems every hour and copies new files to Amazon S3."
  ],
  answer: 2,
  explain: `**Từ khoá:** "external partners", "SFTP with SSH keys", "allow-listed IP", "must not change client configuration", "land in S3", "stop managing servers".

**Vì sao C đúng:** **AWS Transfer Family** là dịch vụ SFTP/FTPS/FTP/AS2 fully managed, lưu file thẳng vào **S3** hoặc **EFS**.
- Endpoint loại **VPC, internet-facing** cho phép gắn **Elastic IP** cố định. Partner allow-list IP theo hướng outbound, nên bạn cần thông báo một lần cho partner cập nhật allow-list sang Elastic IP mới, sau đó IP không đổi nữa.
- **Import host key** cũ giúp client của partner không báo lỗi "host key changed".
- **Service-managed users** với SSH public key cũ; trỏ DNS hiện tại (custom hostname) về endpoint, nên partner vẫn dùng đúng hostname và key.

**Vì sao các phương án khác sai:**
- **A**: vẫn tự vận hành EC2 (patch, HA); mount S3 bằng FUSE không phải file system POSIX đầy đủ, dễ lỗi.
- **B**: buộc partner đổi công cụ và phát hành access key dài hạn cho bên ngoài là rủi ro bảo mật.
- **D**: DataSync không kéo file từ hệ thống của partner qua internet theo kiểu này và đảo ngược luồng nghiệp vụ (partner đẩy file).

> Exam tip: "partner + SFTP/FTPS/AS2 + S3" = Transfer Family. Muốn IP tĩnh thì dùng endpoint VPC kèm Elastic IP; logic xác thực đặc biệt thì dùng custom identity provider (Lambda/API Gateway).`,
  services: ['AWS Transfer Family', 'Amazon S3', 'Amazon Route 53'],
  refs: [{ type: 'doc', title: 'What is AWS Transfer Family?', url: 'https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html' }]
},
{
  id: 'sap-069',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A manufacturing company is in a 12-month hybrid phase of its migration. On-premises Windows applications write production reports to an SMB file share and need low-latency access to recently written files. The reports must also be stored as objects in Amazon S3 so that a new analytics pipeline on AWS can process them. Users authenticate with the on-premises Microsoft Active Directory. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Deploy a Volume Gateway in cached mode and present an iSCSI volume to a Windows file server that shares it over SMB.",
    "Deploy a Tape Gateway and configure the applications to write reports to virtual tapes.",
    "Create an Amazon FSx for Windows File Server file system in AWS and map it on premises over a Site-to-Site VPN connection.",
    "Deploy an Amazon S3 File Gateway on premises, join it to Active Directory, and create an SMB file share that stores files as objects in an S3 bucket."
  ],
  answer: 3,
  explain: `**Từ khoá:** "hybrid phase", "SMB", "low-latency access to recent files" (local cache), "stored as objects in S3", "Active Directory".

**Vì sao D đúng:** **S3 File Gateway** chạy on-premises (VM hoặc hardware appliance), cung cấp share **NFS hoặc SMB**, hỗ trợ xác thực bằng **Microsoft AD**. File ghi vào share được lưu **thành object S3 với định dạng gốc** (một file = một object), nên pipeline phân tích trên AWS đọc trực tiếp được. **Local cache** giữ dữ liệu ghi và đọc gần đây cho độ trễ thấp, upload lên S3 bất đồng bộ.

**Vì sao các phương án khác sai:**
- **A**: Volume Gateway cung cấp **block storage iSCSI**; dữ liệu lưu dưới dạng volume/EBS snapshot, **không phải object S3 đọc được từng file**; lại phải vận hành thêm Windows file server.
- **B**: Tape Gateway dành cho phần mềm backup ghi ra tape ảo, không cho truy cập file tức thì.
- **C**: FSx for Windows nằm ở AWS nên mỗi lần đọc/ghi từ on-premises đi qua VPN, độ trễ cao; dữ liệu cũng không thành object S3 cho pipeline.

> Exam tip: Storage Gateway: file → S3 File Gateway (object S3), block → Volume Gateway, backup tape → Tape Gateway. Cần đọc file như object S3 thì chỉ S3 File Gateway đáp ứng.`,
  services: ['AWS Storage Gateway', 'Amazon S3', 'AWS Directory Service'],
  refs: [{ type: 'doc', title: 'What is Amazon S3 File Gateway?', url: 'https://docs.aws.amazon.com/filegateway/latest/files3/what-is-file-s3.html' }]
},
{
  id: 'sap-070',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company is modernizing 40 Java Spring Boot applications that currently run on Apache Tomcat on on-premises VMs. The company has decided to containerize the applications and store images in Amazon ECR. The operations team has no Kubernetes experience and does not want to manage servers, patch hosts, or plan cluster capacity. Traffic varies during the day, and each application must scale independently. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Deploy the containers to an Amazon EKS cluster with managed node groups and use the Kubernetes Horizontal Pod Autoscaler.",
    "Deploy each application as an Amazon ECS service on AWS Fargate behind an Application Load Balancer and configure ECS Service Auto Scaling with target tracking.",
    "Deploy the containers to an Amazon ECS cluster on EC2 instances with an Auto Scaling group capacity provider and a custom AMI.",
    "Run Docker on Amazon EC2 instances in an Auto Scaling group per application and deploy new images with a custom script."
  ],
  answer: 1,
  explain: `**Từ khoá:** "containerize", "no Kubernetes experience", "do not manage servers, patch hosts, or plan cluster capacity", "scale independently", "LEAST overhead".

**Vì sao B đúng:** **Amazon ECS** là orchestrator do AWS quản lý, khái niệm đơn giản (cluster, task definition, service), không cần kiến thức Kubernetes. **Fargate** là compute serverless: không có EC2 host để patch hay chọn kích thước, AWS lo hạ tầng. Mỗi app là một **ECS service** riêng, có **Service Auto Scaling** (target tracking theo CPU, memory hoặc ALB request count per target) nên scale độc lập. ALB định tuyến theo path/host tới từng service.

**Vì sao các phương án khác sai:**
- **A**: EKS đòi hỏi kỹ năng Kubernetes; managed node group vẫn là EC2 cần cập nhật AMI và tính capacity (trừ khi dùng thêm Fargate hoặc EKS Auto Mode), trái ràng buộc.
- **C**: ECS trên EC2 thì team phải quản lý AMI, patch host, capacity provider.
- **D**: tự chạy Docker trên EC2 và script deploy là overhead cao nhất, không có orchestration.

> Exam tip: "containers + không muốn quản lý server + không có kỹ năng K8s" = ECS on Fargate. Nếu đề nói "đã dùng Kubernetes / cần tính portable của K8s" thì mới chọn EKS (có thể kèm Fargate).`,
  services: ['Amazon ECS', 'AWS Fargate', 'Amazon ECR', 'Elastic Load Balancing'],
  refs: [{ type: 'doc', title: 'AWS Fargate for Amazon ECS', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html' }]
},
{
  id: 'sap-071',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company is migrating a legacy file-processing system. Today, partners drop CSV files into a shared folder at irregular times, and a cron job on an always-on server processes the files every night, so results arrive up to 24 hours late. Each file takes less than 2 minutes to process. Files now land in an Amazon S3 bucket. The company wants files processed within minutes of arrival, failed files retained for investigation, and no servers to manage. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Configure S3 Event Notifications for object-created events to send messages to an Amazon SQS queue, and process the queue with an AWS Lambda function. Configure a dead-letter queue on the SQS queue for messages that fail repeatedly.",
    "Rehost the cron server to Amazon EC2 and change the schedule to run every 5 minutes.",
    "Create an AWS Batch job that is scheduled every hour by Amazon EventBridge Scheduler to list the bucket and process new files.",
    "Run an Amazon ECS service on Fargate that continuously polls the S3 bucket by listing objects every 10 seconds."
  ],
  answer: 0,
  explain: `**Từ khoá:** "irregular arrival", "within minutes", "< 2 minutes per file", "failed files retained", "no servers", "LEAST overhead".

**Vì sao A đúng:** Kiến trúc **event-driven serverless**:
- **S3 Event Notification** gửi sự kiện mỗi khi có object mới, thay cho cron.
- **SQS** đệm sự kiện, giúp chịu tải dồn dập và tự retry: Lambda xử lý lỗi thì message hiện lại sau visibility timeout (đặt lớn hơn thời gian timeout của function).
- **Lambda** (tối đa 15 phút mỗi lần gọi, quá đủ cho 2 phút) xử lý từng file; scale tự động theo số message.
- **DLQ** sau maxReceiveCount giữ lại các file lỗi để điều tra và redrive.

**Vì sao các phương án khác sai:**
- **B**: vẫn là server phải quản lý, chạy liên tục tốn tiền, và list bucket mỗi 5 phút không thể hiện được trạng thái lỗi rõ ràng.
- **C**: chạy mỗi giờ thì không đạt "within minutes"; AWS Batch cũng phức tạp hơn mức cần cho job 2 phút.
- **D**: polling liên tục bằng ListObjects tốn chi phí request và compute 24/7, phải tự theo dõi file nào đã xử lý.

> Exam tip: "file đến S3 → xử lý ngay, serverless" = S3 event → (SQS) → Lambda. Thêm SQS khi cần đệm, retry có kiểm soát và DLQ; job dài hơn 15 phút thì chuyển sang ECS Fargate task hoặc Step Functions.`,
  services: ['Amazon S3', 'Amazon SQS', 'AWS Lambda']
},
{
  id: 'sap-072',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company runs a monolithic Java application on Amazon EC2 instances behind an Application Load Balancer. The team is applying the strangler fig pattern and has built a new payments microservice on Amazon ECS. The company wants to send 10% of requests for the /api/payments/* path to the new service, increase the percentage gradually, and roll back within seconds if errors increase. All other paths must keep going to the monolith. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create Amazon Route 53 weighted records that send 10% of DNS queries for the application domain to a new load balancer for the payments service.",
    "Deploy the new service and switch all traffic for the application to it in a single cutover, keeping the monolith as a cold standby.",
    "Add an ALB listener rule with the path pattern /api/payments/* that forwards to two weighted target groups (the monolith and the ECS service), starting at 90/10 and adjusting the weights over time.",
    "Put an Amazon CloudFront distribution in front of the ALB and add a cache behavior for /api/payments/* that points to the new service."
  ],
  answer: 2,
  explain: `**Từ khoá:** "strangler fig", "only /api/payments/*", "10% then gradually", "roll back within seconds", "other paths stay on monolith".

**Vì sao C đúng:** **Strangler fig** thay dần từng phần monolith bằng service mới, phía trước có một lớp định tuyến (facade). ALB đã sẵn có nên là facade tự nhiên:
- **Listener rule theo path** chỉ ảnh hưởng tới /api/payments/*.
- Action **forward tới nhiều target group có trọng số** (weighted target groups) cho phép chia 90/10 rồi 50/50, 0/100.
- Rollback = đổi trọng số về 100/0, có hiệu lực **gần như ngay lập tức**, không phụ thuộc DNS. Có thể bật target group stickiness nếu cần giữ phiên.

**Vì sao các phương án khác sai:**
- **A**: Route 53 weighted chia theo **cả domain**, không theo path; rollback phụ thuộc DNS TTL và cache của client.
- **B**: big-bang cutover trái với tinh thần strangler fig và rủi ro cao.
- **D**: CloudFront behavior định tuyến theo path được nhưng **không chia phần trăm** giữa hai origin cho cùng path; thêm một lớp mới là overhead không cần thiết.

> Exam tip: chia traffic theo % + theo path ngay tại ALB = weighted target groups. Với API Gateway có canary release trên stage; với Lambda có alias weighted.`,
  services: ['Elastic Load Balancing', 'Amazon ECS', 'Amazon EC2']
},
{
  id: 'sap-073',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `As part of a migration, a retailer is moving shopping cart data out of its on-premises Oracle database. Carts are always read and written by cart ID, peak traffic reaches 20,000 writes per second during sales events, carts must be retained durably, and abandoned carts should be removed automatically 7 days after the last update. The company wants single-digit millisecond latency, pay-per-request pricing, and no capacity management. Which database should a solutions architect choose?`,
  options: [
    "Amazon Aurora Serverless v2 for PostgreSQL with a scheduled job that deletes carts older than 7 days.",
    "Amazon ElastiCache for Redis OSS with a 7-day TTL on each key as the only store for cart data.",
    "Amazon Neptune with each cart modeled as a vertex.",
    "Amazon DynamoDB in on-demand capacity mode with a TTL attribute set to 7 days after the last update."
  ],
  answer: 3,
  explain: `**Từ khoá:** "key-value access by cart ID", "20,000 writes/s", "durable", "auto-remove after 7 days", "single-digit ms", "pay-per-request", "no capacity management".

**Vì sao D đúng:** **DynamoDB** là key-value/document DB serverless, độ trễ **single-digit millisecond** ở mọi quy mô, dữ liệu lưu bền vững qua nhiều AZ. **On-demand mode** tính tiền theo request và tự co giãn, không phải tính capacity. **TTL**: mỗi lần cập nhật cart thì đặt lại thuộc tính epoch = now + 7 ngày; DynamoDB tự xoá item hết hạn **không tốn WCU** (việc xoá diễn ra trong vòng vài ngày sau khi hết hạn, nên query cần lọc item đã hết hạn nếu cần chính xác).

**Vì sao các phương án khác sai:**
- **A**: Aurora là relational với **một writer**, hợp cho truy vấn quan hệ phức tạp; vẫn phải đặt giới hạn ACU và tự viết job xoá; không phải giá theo request.
- **B**: ElastiCache là cache in-memory; dùng làm **kho duy nhất** thì rủi ro mất dữ liệu khi node lỗi (replication bất đồng bộ), không đạt "durably". (Amazon MemoryDB mới là in-memory bền vững.)
- **C**: Neptune là **graph database** cho quan hệ nhiều tầng (social, fraud), không phù hợp truy cập theo key.

> Exam tip: "key-value + scale lớn + serverless + TTL" = DynamoDB. Trước sự kiện lớn, bảng on-demand mới có thể cấu hình **warm throughput** để tránh throttle lúc đầu.`,
  services: ['Amazon DynamoDB']
},
{
  id: 'sap-074',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company is decomposing an order management monolith. When an order is placed, the inventory, billing, email notification, and analytics components must each receive the event and process it independently with their own retries. Some consumers need only orders of specific types. New consumers will be added over time without any change to the order service. Which solutions meet these requirements? (Choose two.)`,
  options: [
    "Publish order events to an Amazon SNS topic. Subscribe a separate Amazon SQS queue for each consumer, and use subscription filter policies for consumers that need only specific order types.",
    "Send order events to a single Amazon SQS queue that all four consumers poll.",
    "Have the order service invoke an AWS Step Functions Express workflow that calls each consumer synchronously in sequence.",
    "Write each order to an Amazon DynamoDB table and have every consumer scan the table every minute for new orders.",
    "Publish order events to an Amazon EventBridge custom event bus and create one rule per consumer with an event pattern that matches the required order types, targeting each consumer's queue or function."
  ],
  answer: [0, 4],
  multi: true,
  explain: `**Từ khoá:** "each receive the event" (fan-out), "process independently with own retries", "filter by order type", "add consumers without changing the order service".

**Vì sao A và E đúng:**
- **A**: mẫu **SNS + SQS fan-out**: SNS nhân bản message tới mọi subscription; mỗi consumer có **queue riêng** nên retry, tốc độ xử lý và DLQ độc lập. **Filter policy** (theo message attribute hoặc body) giúp consumer chỉ nhận loại order cần. Thêm consumer = thêm subscription, producer không đổi.
- **E**: **EventBridge** event bus với **rule** theo event pattern cho từng consumer, mỗi rule tới nhiều target (SQS, Lambda, Step Functions...). Có retry policy và DLQ ở target, archive và replay sự kiện. Thêm consumer = thêm rule.

**Vì sao các phương án khác sai:**
- **B**: một queue dùng chung là mô hình **competing consumers**: mỗi message chỉ được **một** consumer nhận, không phải tất cả.
- **C**: gọi đồng bộ tuần tự tạo coupling chặt; thêm consumer phải sửa workflow của order service, một consumer lỗi làm chậm hoặc hỏng toàn bộ.
- **D**: scan định kỳ tốn RCU, trễ, và mỗi consumer phải tự theo dõi đã xử lý tới đâu. (DynamoDB Streams thì khác, nhưng giới hạn số consumer đọc đồng thời mỗi shard.)

> Exam tip: fan-out đơn giản, throughput cao = SNS + SQS. Nhiều nguồn sự kiện, routing theo nội dung phức tạp, tích hợp SaaS, archive/replay = EventBridge.`,
  services: ['Amazon SNS', 'Amazon SQS', 'Amazon EventBridge']
},
{
  id: 'sap-075',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `A company with 12 business units is preparing to migrate hundreds of applications to AWS in waves. Before the first wave, the company needs a multi-account environment with preventive and detective guardrails, centralized logging, and a standardized way to provision new accounts for each business unit. Employees must sign in with their existing on-premises Microsoft Active Directory credentials, and no IAM users should be created. Which combination of steps meets these requirements with the LEAST operational overhead? (Choose two.)`,
  options: [
    "Create a single AWS account with one VPC per business unit and separate resources by using tags and IAM policies.",
    "Set up an AWS Control Tower landing zone, register organizational units for the business units, and use Account Factory to provision new accounts with the baseline guardrails.",
    "Create IAM users in each account and synchronize their passwords from Active Directory with a scheduled script.",
    "Configure AWS IAM Identity Center with Active Directory as the identity source through AD Connector or AWS Managed Microsoft AD with a trust, and assign permission sets to groups for each account.",
    "Create an Amazon Cognito user pool federated with Active Directory and use it to grant employees access to the AWS Management Console."
  ],
  answer: [1, 3],
  multi: true,
  explain: `**Từ khoá:** "multi-account", "preventive and detective guardrails", "centralized logging", "standardized account provisioning", "existing AD credentials", "no IAM users", "LEAST overhead".

**Vì sao B và D đúng:**
- **B**: **Control Tower** dựng landing zone theo best practice trên AWS Organizations: account **Log Archive** và **Audit**, CloudTrail và AWS Config tập trung, **controls** dạng preventive (dựa trên SCP), detective (Config rules) và proactive (CloudFormation hooks). **Account Factory** tạo account mới cho từng BU đã có sẵn baseline, đúng nhu cầu migration theo wave.
- **D**: **IAM Identity Center** là workforce SSO cho mọi account trong org. Dùng **AD Connector** (proxy tới AD on-premises) hoặc **AWS Managed Microsoft AD** có trust làm identity source; gán **permission set** cho group AD theo từng account. Người dùng nhận credential tạm thời, không có IAM user.

**Vì sao các phương án khác sai:**
- **A**: một account cho tất cả: blast radius lớn, khó tách billing, dễ đụng quota, không có guardrail theo OU.
- **C**: IAM user cùng password đồng bộ bằng script là credential dài hạn, overhead cao và trái yêu cầu "no IAM users".
- **E**: Cognito dành cho **người dùng cuối của ứng dụng** (customer identity), không phải SSO workforce vào AWS console.

> Exam tip: chuẩn bị migration quy mô lớn = landing zone (Control Tower) + IAM Identity Center trước wave đầu tiên. Exam guide gọi đây là "selecting the appropriate governance model".`,
  services: ['AWS Control Tower', 'AWS IAM Identity Center', 'AWS Directory Service', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'What is AWS Control Tower?', url: 'https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html' }]
},
{
  id: 'sap-076',
  exam: 'sap-c02',
  domain: 'sap-d4',
  q: `The CFO of a company with 2,000 on-premises servers asks for a data-driven business case for migrating to AWS within the next 6 weeks. The business case must be based on the actual utilization of the servers, recommend right-sized Amazon EC2 capacity, and compare licensing options such as bring-your-own-license and license-included for Windows Server and SQL Server. A detailed application dependency map is not required at this stage. Which approach meets these requirements with the LEAST effort?`,
  options: [
    "Engage Migration Evaluator: deploy its agentless collector (or upload existing inventory exports) to gather utilization data, and use the resulting business case with right-sized EC2 recommendations and licensing comparisons.",
    "Enter all 2,000 servers manually into AWS Pricing Calculator using the current on-premises hardware specifications.",
    "Opt in to AWS Compute Optimizer and use its rightsizing recommendations for the on-premises servers.",
    "Use AWS Cost Explorer forecasting to project the AWS cost of the on-premises servers for the next 3 years."
  ],
  answer: 0,
  explain: `**Từ khoá:** "business case", "actual utilization", "right-sized EC2", "BYOL vs license-included", "6 weeks", "dependency map not required", "LEAST effort".

**Vì sao A đúng:** **Migration Evaluator** là dịch vụ xây **business case/TCO** cho migration: thu thập dữ liệu sử dụng thực tế bằng **agentless collector** (hoặc nhận file export inventory có sẵn), đề xuất EC2 đúng kích thước thay cho máy on-premises dư cấu hình, so sánh các phương án license (BYOL, license-included) cho Windows và SQL Server, và đưa ra chi phí dự kiến trên AWS. Đây chính là đầu vào cho task "Evaluating total cost of ownership (TCO)" trong exam guide.

**Vì sao các phương án khác sai:**
- **B**: nhập tay 2,000 server tốn rất nhiều công; dùng cấu hình phần cứng hiện tại thay vì utilization thực tế sẽ ra con số **quá cao** (không rightsizing).
- **C**: Compute Optimizer chỉ phân tích tài nguyên **đang chạy trên AWS** (EC2, EBS, Lambda, ECS on Fargate, RDS...), không đánh giá server on-premises.
- **D**: Cost Explorer dự báo dựa trên **chi tiêu AWS đã có**, không biết gì về server on-premises.

> Exam tip: "business case / TCO / CFO" = Migration Evaluator. "Dependency, process, wave planning" = Application Discovery Service (Discovery Agent). "Thực hiện rehost" = MGN.`,
  services: ['Migration Evaluator', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'Migration Evaluator', url: 'https://aws.amazon.com/migration-evaluator/' }]
}
);
