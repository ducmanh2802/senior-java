/* AWS Pro track: exam-style questions (docs/AWS-TRACK.md), file 5 of sap-c02. */
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'sap-157', exam: 'sap-c02', domain: 'sap-d4',
  q: `A manufacturer runs a factory-control application that must remain in its data center because machine control requires single-digit millisecond latency and local processing during temporary WAN outages. The company is moving other workloads to AWS and wants to use the same AWS APIs, services, and operating model on premises, with AWS managing the infrastructure hardware. Which solution best meets these requirements?`,
  options: [
    "Use AWS Outposts racks in the data center, connect them to the parent AWS Region, and keep the latency-sensitive application on the Outposts rack.",
    "Move the application to an Availability Zone in the nearest AWS Region and connect with AWS Direct Connect.",
    "Deploy the application in an AWS Local Zone and keep the factory-control devices in the data center.",
    "Use AWS DataSync as the runtime for the factory-control application and leave its servers in the data center."
  ],
  answer: 0,
  explain: `**Từ khóa:** ứng dụng phải chạy tại chỗ, cần độ trễ một chữ số mili giây và tiếp tục xử lý khi WAN gián đoạn, nhưng muốn dùng dịch vụ/API AWS và AWS quản lý phần cứng. **AWS Outposts** là hạ tầng AWS đặt trong cơ sở khách hàng, kết nối với Region mẹ để vận hành như một phần của AWS; compute và lưu trữ hỗ trợ vẫn chạy cục bộ nên không phải gửi từng request điều khiển qua WAN. Outposts không loại bỏ mọi phụ thuộc kết nối: điều khiển, giám sát và một số dịch vụ vẫn cần liên lạc Region, nên phải thiết kế hành vi khi mất kết nối.

**Vì sao đúng:** A đặt workload cùng máy móc tại nhà máy, giữ đường xử lý ngắn, đồng thời giảm việc tự mua và bảo trì máy chủ.
**Vì sao phương án khác sai:**
- B vẫn đưa request qua WAN tới Region; Direct Connect ổn định hơn internet nhưng không bảo đảm độ trễ cục bộ khi mất WAN.
- C Local Zones là hạ tầng AWS ở khu vực đô thị gần người dùng, không đồng nghĩa đặt trong data center của nhà máy hay bảo đảm hoạt động offline.
- D DataSync chuyển dữ liệu giữa các vị trí lưu trữ; dịch vụ này không chạy compute hay điều khiển ứng dụng tại nhà máy.

> Exam tip: cần AWS compute tại cơ sở và độ trễ cục bộ thì nghĩ Outposts; cần đặt dịch vụ gần một đô thị thì xem Local Zones.`,
  services: ['AWS Outposts', 'AWS Direct Connect', 'AWS Local Zones', 'AWS DataSync'],
},
{
  id: 'sap-158', exam: 'sap-c02', domain: 'sap-d4',
  q: `A video company has a rendering application used by employees in a large metropolitan area. Rendering is interactive and requires consistently low latency, but the application can tolerate a short interruption if the regional AWS connection fails. The company wants to move compute closer to users without installing AWS hardware in its own facilities. Which solution should the company choose?`,
  options: [
    "Deploy the application in an AWS Local Zone near the metropolitan area and use the parent Region for services that are not available in the Local Zone.",
    "Deploy AWS Outposts racks in the company's office and move all rendering users to that office.",
    "Deploy the application in a Region selected with Route 53 latency-based routing, regardless of the users' location.",
    "Deploy the application on AWS Wavelength and require every employee to connect through a 5G mobile network."
  ],
  answer: 0,
  explain: `**Từ khóa:** người dùng tập trung ở một đô thị, cần phản hồi tương tác độ trễ thấp, chấp nhận kết nối tới Region và không muốn lắp phần cứng trong cơ sở riêng. **AWS Local Zones** mở rộng một tập dịch vụ AWS tới vị trí gần đô thị, cho phép đặt compute gần người dùng trong khi vẫn liên kết với Region cha. Đây khác với chọn Region chỉ bằng DNS: DNS chọn đích nhưng không di chuyển compute đến gần hơn.

**Vì sao đúng:** A đặt workload ở Local Zone phù hợp; cần xác minh dịch vụ và loại instance có sẵn tại Local Zone cụ thể, đồng thời giữ dữ liệu/dịch vụ phụ trợ cần thiết ở Region cha.
**Vì sao phương án khác sai:**
- B chọn Outposts, phù hợp khi phải đặt AWS hạ tầng ngay trong data center của khách hàng; đề không cần phần cứng tại cơ sở.
- C latency-based routing có thể đưa request tới Region có độ trễ ước tính tốt hơn, nhưng không đảm bảo compute ở trong vùng đô thị, và vẫn phụ thuộc vị trí Region.
- D Wavelength đặt dịch vụ AWS tại mạng viễn thông 5G để phục vụ ứng dụng di động cần độ trễ cực thấp; đề là nhân viên dùng ứng dụng render, không yêu cầu 5G.

> Exam tip: Local Zones là lựa chọn mở rộng AWS gần thành phố; Outposts là AWS tại cơ sở khách hàng; Wavelength là AWS tại mạng viễn thông.`,
  services: ['AWS Local Zones', 'AWS Outposts', 'AWS Wavelength'],
},
{
  id: 'sap-159', exam: 'sap-c02', domain: 'sap-d4',
  q: `A media company has a legacy Linux application on premises that writes files to an NFS share. The application cannot be changed during the first migration phase, users need low-latency access to recently used files from the local network, and all files must be stored durably as objects in Amazon S3 for cloud analytics. The company wants a managed bridge rather than an application rewrite. Which solution meets these requirements?`,
  options: [
    "Deploy AWS Storage Gateway File Gateway, expose an NFS file share to the application, and use the local cache while files are stored in Amazon S3.",
    "Mount an Amazon EFS file system from the on-premises servers through a public endpoint.",
    "Deploy AWS Storage Gateway Volume Gateway in stored mode and present its iSCSI volumes as an NFS share.",
    "Copy the files to Amazon S3 nightly with a custom script and change the application to write directly to S3."
  ],
  answer: 0,
  explain: `**Từ khóa:** ứng dụng cũ ghi NFS, chưa thể sửa, cần cache cục bộ cho file hay dùng và bản lưu lâu dài phải là object trong S3. **AWS Storage Gateway File Gateway** trình bày file share NFS/SMB cho ứng dụng on-prem; dữ liệu file được lưu thành object trong S3 và gateway giữ cache cục bộ để giảm độ trễ đọc. Gateway không biến S3 thành filesystem POSIX đầy đủ, vì vậy phải kiểm tra semantics file và luồng cập nhật của ứng dụng.

**Vì sao đúng:** A giữ giao diện NFS hiện tại để giảm thay đổi ứng dụng, đồng thời đưa dữ liệu vào S3 cho analytics.
**Vì sao phương án khác sai:**
- B EFS là filesystem quản lý, nhưng không thể mount từ on-prem qua một public endpoint; muốn dùng cần kết nối mạng riêng phù hợp và không tự đáp ứng yêu cầu lưu file thành object S3.
- C Volume Gateway cung cấp block storage iSCSI, không phải NFS file share. Chế độ stored giữ toàn bộ dữ liệu chính tại chỗ, còn snapshot được đưa lên AWS.
- D nightly copy làm dữ liệu trên S3 trễ tới một ngày, không cung cấp bridge trong suốt và đòi hỏi sửa ứng dụng.

> Exam tip: ứng dụng cần file share nhưng muốn dữ liệu thành object S3 thì xem File Gateway; ứng dụng cần block iSCSI thì xem Volume Gateway.`,
  services: ['AWS Storage Gateway', 'Amazon S3'],
},
{
  id: 'sap-160', exam: 'sap-c02', domain: 'sap-d4',
  q: `A research lab runs a legacy application that requires block storage over iSCSI and performs frequent reads of its working set. The lab is migrating to AWS in stages, has limited WAN bandwidth, and wants the full data set stored durably in Amazon S3 while keeping frequently accessed blocks cached on premises. Which AWS Storage Gateway configuration is appropriate?`,
  options: [
    "Use a Volume Gateway in cached volume mode and attach its iSCSI target to the application servers.",
    "Use a Volume Gateway in stored volume mode because that keeps the primary data set in Amazon S3 and caches reads locally.",
    "Use a File Gateway with an NFS share because it presents iSCSI block devices to applications.",
    "Use an Amazon EBS volume mounted directly by the on-premises servers over the public internet."
  ],
  answer: 0,
  explain: `**Từ khóa:** ứng dụng yêu cầu block iSCSI, WAN hạn chế, muốn dữ liệu chính ở AWS và giữ block thường dùng trong cache tại chỗ. Volume Gateway có hai cách hoạt động: **cached volumes** giữ dữ liệu chính ở AWS và cache dữ liệu đọc gần đây/đang dùng tại gateway; **stored volumes** giữ toàn bộ dữ liệu chính tại chỗ rồi sao lưu snapshot lên AWS. Phân biệt nơi lưu bản chính là mấu chốt.

**Vì sao đúng:** A dùng cached mode và giao diện iSCSI, phù hợp chính xác yêu cầu dung lượng chính ở AWS cùng cache cục bộ. Cần sizing cache và kiểm tra throughput mạng để tránh cache miss làm tăng latency.
**Vì sao phương án khác sai:**
- B mô tả ngược: stored mode giữ primary data tại chỗ, không phải S3.
- C File Gateway phục vụ NFS/SMB file share; nó không cung cấp block iSCSI cho ứng dụng.
- D EBS là block device gắn vào EC2 trong AWS, không phải volume để server on-prem mount trực tiếp qua internet.

> Exam tip: Volume Gateway cached = dữ liệu chính trên AWS, cache tại chỗ; stored = dữ liệu chính tại chỗ, snapshot lên AWS.`,
  services: ['AWS Storage Gateway', 'Amazon S3', 'Amazon EBS'],
},
{
  id: 'sap-161', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company must move 180 TB of files from an on-premises SMB file server to an Amazon S3 bucket over an existing 2 Gbps AWS Direct Connect connection. Production traffic shares the link, so migration traffic must be capped at 400 Mbps and run only overnight. The team needs recurring incremental copies and data integrity verification without writing its own transfer tool. Which solution meets these requirements?`,
  options: [
    "Create an AWS DataSync task with an SMB source location and S3 destination, configure a bandwidth limit and schedule, and enable data verification.",
    "Use S3 Transfer Acceleration to transfer the SMB file system directly into S3 and set a per-task bandwidth limit.",
    "Use AWS Snowball Edge for each nightly incremental copy and manually merge the objects after each device is returned.",
    "Use AWS Storage Gateway Volume Gateway because it automatically copies SMB files to S3 on a schedule."
  ],
  answer: 0,
  explain: `**Từ khóa:** nguồn SMB, đích S3, copy tăng dần theo lịch, giới hạn băng thông để không ảnh hưởng production và cần kiểm tra toàn vẹn. **AWS DataSync** là dịch vụ truyền dữ liệu được quản lý; SMB là một loại vị trí nguồn được hỗ trợ, S3 là đích, task có thể chạy lặp lại và cấu hình giới hạn băng thông cùng verification. Agent DataSync cần được đặt nơi có thể truy cập SMB share và kết nối AWS.

**Vì sao đúng:** A giải quyết cả lịch, băng thông và xác minh mà không phải tự xây công cụ. Direct Connect cung cấp đường riêng nhưng vẫn cần cap vì dùng chung với lưu lượng sản xuất.
**Vì sao phương án khác sai:**
- B S3 Transfer Acceleration tăng tốc upload tới S3 qua edge location; không đọc SMB share như DataSync và không phải công cụ đồng bộ file theo lịch.
- C Snowball phù hợp khi chuyển lượng dữ liệu lớn mà mạng không đủ; đem thiết bị qua lại mỗi đêm không thực tế cho incremental sync.
- D Volume Gateway cung cấp iSCSI block volumes, không quét/copy file SMB theo lịch thành object S3.

> Exam tip: DataSync phù hợp chuyển/đồng bộ file qua mạng; với link dùng chung, luôn giới hạn băng thông và lên lịch ngoài giờ cao điểm.`,
  services: ['AWS DataSync', 'Amazon S3', 'AWS Direct Connect'],
},
{
  id: 'sap-162', exam: 'sap-c02', domain: 'sap-d4',
  q: `A retailer is migrating a 12 TB Oracle database to an Oracle database on Amazon RDS. The source must stay online during the initial copy, and changes made during migration must continue flowing to the target until a planned cutover. The company wants to keep the same database engine and minimize application changes. Which combination of steps is most appropriate? (Choose two.)`,
  options: [
    "Use AWS Database Migration Service to perform the initial full load to the Oracle target.",
    "Configure ongoing change data capture from the Oracle source and cut over after validating the target and reducing replication lag.",
    "Use AWS Schema Conversion Tool to convert the Oracle schema to PostgreSQL, then export and import the database.",
    "Take a one-time native Oracle export and switch the application immediately after the restore.",
    "Use AWS DataSync to copy Oracle database files to the RDS storage volume."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Từ khóa:** Oracle sang Oracle, nguồn phải tiếp tục nhận ghi trong lúc copy, thay đổi phải được đồng bộ đến thời điểm cutover. Đây là di chuyển **homogeneous** (cùng engine); AWS Database Migration Service (AWS DMS) có thể tải dữ liệu ban đầu rồi dùng **change data capture (CDC)** để tiếp tục áp dụng thay đổi từ transaction log của nguồn. Nhóm cần theo dõi lỗi và replication lag, xác minh dữ liệu, rồi chặn ghi trong cửa sổ chuyển đổi cuối.

**Vì sao A và B đúng:** full load đưa dữ liệu hiện có sang target; CDC đồng bộ thay đổi mới khi ứng dụng vẫn chạy. Trước cutover cần kiểm tra loại dữ liệu/DDL được hỗ trợ, lag, tính toàn vẹn và kết nối ứng dụng. Target Oracle trên RDS vẫn phải đáp ứng phiên bản, tính năng và giới hạn được hỗ trợ.
**Vì sao phương án khác sai:**
- C Schema Conversion Tool dành để đánh giá/chuyển đổi khi đổi engine; đổi sang PostgreSQL làm tăng phạm vi thay đổi không cần thiết.
- D export một lần không đưa các giao dịch phát sinh sau export sang target; dữ liệu sẽ lệch nếu nguồn vẫn ghi.
- E DataSync truyền file, không đồng bộ transaction Oracle vào managed database và không cho truy cập trực tiếp storage của RDS.

> Exam tip: cùng engine và cần giữ nguồn online thì dùng DMS full load + CDC; khác engine mới xem schema conversion và kiểm thử tương thích.`,
  services: ['AWS Database Migration Service', 'Amazon RDS for Oracle'],
},
{
  id: 'sap-163', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company is evaluating 250 on-premises applications before selecting migration strategies. It has collected server inventory, utilization, and dependency data, and wants AWS to identify modernization opportunities, operating-system risks, and candidate strategies such as rehost, replatform, or refactor. The company does not need a detailed cost business case. Which service should the migration team use?`,
  options: [
    "Use AWS Migration Hub Strategy Recommendations to analyze the collected application and server data and generate migration strategy recommendations.",
    "Use AWS Migration Evaluator because it automatically converts dependency data into a code-level refactoring plan.",
    "Use AWS Application Migration Service to discover all application dependencies and choose a modernization strategy.",
    "Use AWS Control Tower Account Factory to inspect applications and create migration waves."
  ],
  answer: 0,
  explain: `**Từ khóa:** đã có inventory/utilization/dependency data, cần đề xuất chiến lược hiện đại hóa theo từng ứng dụng và không cần business case chi phí. **AWS Migration Hub Strategy Recommendations** phân tích dữ liệu khám phá để đưa ra khuyến nghị như rehost, replatform hoặc refactor và chỉ ra các điểm cần cân nhắc. Đầu vào tốt rất quan trọng: dữ liệu thiếu sẽ khiến khuyến nghị kém chính xác và vẫn cần kiến trúc sư xác minh.

**Vì sao đúng:** A là bước đánh giá chiến lược sau discovery, giúp sàng lọc danh mục lớn trước khi thiết kế wave.
**Vì sao phương án khác sai:**
- B Migration Evaluator tập trung vào business case dựa trên utilization và chi phí, không tự sinh kế hoạch refactor ở mức code.
- C AWS Application Migration Service (MGN) chủ yếu rehost server sang AWS, không thay thế công cụ đánh giá chiến lược cho toàn danh mục.
- D Control Tower tạo và quản trị multi-account landing zone; Account Factory không khám phá ứng dụng hay lập kế hoạch migration.

> Exam tip: chọn công cụ theo câu hỏi: business case/chi phí là Migration Evaluator; chiến lược ứng dụng là Migration Hub Strategy Recommendations; rehost server là MGN.`,
  services: ['AWS Migration Hub Strategy Recommendations', 'AWS Migration Evaluator', 'AWS Application Migration Service'],
},
{
  id: 'sap-164', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company has containerized a factory application, but the application must continue running on its on-premises Linux servers for the next year because it controls local equipment. The operations team wants to register those external servers with Amazon ECS and manage container deployments from the same ECS control plane used for AWS workloads. The company does not want to install AWS Outposts hardware. Which solution best meets these requirements?`,
  options: [
    "Use Amazon ECS Anywhere to register the on-premises servers as external instances and run ECS tasks on them.",
    "Deploy an AWS Outposts rack because ECS tasks cannot run on external servers.",
    "Use Amazon ECS on AWS Fargate and expect tasks to run on the factory servers without an ECS agent.",
    "Use AWS Migration Hub Strategy Recommendations to deploy containers to the on-premises servers."
  ],
  answer: 0,
  explain: `**Từ khóa:** container đã có, máy chủ Linux phải tiếp tục ở data center, muốn quản lý task từ ECS nhưng không lắp Outposts. **Amazon ECS Anywhere** mở rộng ECS để đăng ký external instances ngoài AWS, bao gồm server on-premises, và quản lý task/container qua ECS control plane. Máy chủ vẫn thuộc trách nhiệm của công ty: cần cài agent cần thiết, có kết nối mạng/permissions phù hợp và tiếp tục vá hệ điều hành.

**Vì sao đúng:** A cho phép giữ compute ở nơi cần thiết mà vẫn dùng ECS để điều phối container, làm bước chuyển tiếp trước khi chuyển một số workload lên AWS.
**Vì sao phương án khác sai:**
- B Outposts đặt phần cứng AWS tại cơ sở khách hàng nhưng không bắt buộc cho ECS Anywhere; đề không cần phần cứng AWS.
- C Fargate chạy container trên hạ tầng AWS do AWS quản lý, không chạy trực tiếp trên server on-prem.
- D Strategy Recommendations đề xuất migration strategy từ dữ liệu khám phá; dịch vụ không triển khai ECS tasks lên máy chủ.

> Exam tip: ECS Anywhere dùng ECS control plane nhưng external host vẫn do khách hàng quản lý và phải đáp ứng agent, networking, IAM, patching.`,
  services: ['Amazon ECS Anywhere', 'Amazon ECS', 'AWS Outposts'],
},
{
  id: 'sap-165', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company has a 90 TB on-premises NFS archive that must be copied to Amazon S3. An existing AWS Direct Connect link has 2 Gbps of capacity available for the migration, and the initial copy must complete within three weeks. After the initial transfer, about 2 TB of new files arrive each week and must be synchronized over the network. The team wants integrity verification and no custom transfer software. Which solution meets the requirements?`,
  options: [
    "Use AWS DataSync with an NFS source location and S3 destination, run an initial task and recurring incremental tasks, and enable verification.",
    "Use S3 Transfer Acceleration to read the NFS share and synchronize new files.",
    "Use AWS Backup to transfer the NFS share directly into an S3 bucket.",
    "Use AWS DMS to replicate the NFS file system to Amazon S3."
  ],
  answer: 0,
  explain: `**Từ khóa:** NFS là nguồn, S3 là đích, có 2 Gbps riêng cho migration, cần copy ban đầu 90 TB trong ba tuần rồi đồng bộ 2 TB mỗi tuần. AWS DataSync hỗ trợ vị trí NFS và S3, chạy task lặp để truyền phần thay đổi, cùng tùy chọn verification để kiểm tra dữ liệu.

**Vì sao đúng:** AWS DataSync hỗ trợ NFS làm nguồn và S3 làm đích, có thể chạy task lặp để chuyển thay đổi, đồng thời xác minh dữ liệu. 2 Gbps khả dụng cho phép hoàn tất 90 TB trong cửa sổ ba tuần với đủ dự phòng thực tế; nhóm vẫn phải theo dõi throughput và giới hạn băng thông nếu link dùng chung.
**Vì sao phương án khác sai:**
- B Transfer Acceleration tăng tốc upload tới S3, nhưng không đọc NFS share và không thay thế đồng bộ incremental.
- C AWS Backup bảo vệ workload được hỗ trợ; không phải công cụ chuyển/synchronize NFS share trực tiếp thành object S3.
- D DMS di chuyển cơ sở dữ liệu, không replicate NFS file system.

> Exam tip: 90 TB / 2 Gbps cần tính theo throughput hiệu dụng, không phải link lý thuyết; DataSync hỗ trợ task NFS-to-S3 lặp và verification.`,
  services: ['AWS DataSync', 'Amazon S3', 'AWS Direct Connect'],
},
{
  id: 'sap-166', exam: 'sap-c02', domain: 'sap-d4',
  q: `A financial services company must keep a legacy application on premises because it depends on hardware installed in the data center. The application currently uses local block storage, but auditors require recovery copies in AWS and the company wants to restore an individual volume after a local disk failure. The WAN connection is reliable, and the team wants AWS-managed snapshots rather than a custom copy process. Which solution is most appropriate?`,
  options: [
    "Use AWS Storage Gateway Volume Gateway in stored volume mode and create Amazon EBS snapshots of the on-premises volumes.",
    "Use AWS Storage Gateway Volume Gateway in cached mode because all primary data must remain on premises.",
    "Use AWS DataSync to continuously copy raw block devices to Amazon S3.",
    "Use Amazon EFS replication to back up the application's local block devices."
  ],
  answer: 0,
  explain: `**Từ khóa:** ứng dụng vẫn chạy tại chỗ và cần block storage; bản chính ở local, nhưng cần snapshot recovery trong AWS. **Volume Gateway stored volumes** cung cấp iSCSI volumes mà dữ liệu chính được lưu on-prem, đồng thời snapshot được lưu trên AWS dưới dạng EBS snapshots. Khi sự cố, volume có thể được khôi phục từ snapshot; cần lập lịch và kiểm tra phục hồi thay vì chỉ tin rằng backup đã chạy.

**Vì sao đúng:** A phù hợp workload cần local block I/O và bản sao ngoài cơ sở.
**Vì sao phương án khác sai:**
- B cached mode lưu dữ liệu chính ở AWS và cache tại chỗ, ngược ràng buộc dữ liệu chính phải ở local.
- C DataSync truyền file giữa hệ thống hỗ trợ, không phải công cụ sao lưu raw block device như mô tả.
- D EFS là filesystem NFS quản lý; EFS replication sao chép filesystem EFS, không backup block device on-prem.

> Exam tip: Volume Gateway stored giữ primary tại chỗ; cached giữ primary ở AWS. Luôn phân biệt nơi lưu dữ liệu chính và nơi lưu snapshot.`,
  services: ['AWS Storage Gateway', 'Amazon EBS'],
},
{
  id: 'sap-167', exam: 'sap-c02', domain: 'sap-d4',
  q: `A company has 40 applications running on a proprietary on-premises application server. The vendor offers a supported version of the same application server on Amazon EC2, and the company must exit its data center in six months. There is no time to redesign application code, but the infrastructure team can change deployment scripts and operating-system configuration. Which migration strategy is the best initial choice?`,
  options: [
    "Replatform the applications onto the vendor-supported application server on EC2, changing only the hosting environment and required configuration.",
    "Refactor all applications into independent microservices before migration.",
    "Retire all applications and replace them with SaaS products.",
    "Repurchase the applications by rewriting them as AWS Lambda functions."
  ],
  answer: 0,
  explain: `**Từ khóa:** thời hạn data center sáu tháng, không đủ thời gian thiết kế lại code, nhưng có phiên bản application server được hỗ trợ trên EC2. Trong mô hình 7R, **replatform** (còn gọi lift-tinker-and-shift) chuyển workload sang nền tảng mới với một số điều chỉnh có giới hạn, không viết lại toàn bộ ứng dụng. Đây là lựa chọn thực dụng để rời data center trước, sau đó mới đánh giá hiện đại hóa.

**Vì sao đúng:** A thay đổi nơi chạy và cấu hình vừa đủ để ứng dụng hoạt động trên hạ tầng AWS, đáp ứng deadline và hạn chế rủi ro.
**Vì sao phương án khác sai:**
- B refactor làm thay đổi kiến trúc sâu, tăng phạm vi kiểm thử và nguy cơ không kịp sáu tháng.
- C retire yêu cầu loại bỏ nhu cầu nghiệp vụ hoặc có sản phẩm thay thế, điều đề không nêu.
- D repurchase là chuyển sang sản phẩm khác (thường SaaS), còn viết lại Lambda thực chất là tái thiết kế chứ không phải repurchase.

> Exam tip: migration không đồng nghĩa phải hiện đại hóa ngay; tách mục tiêu data-center exit khỏi mục tiêu kiến trúc dài hạn.`,
  services: ['Amazon EC2'],
},
{
  id: 'sap-168', exam: 'sap-c02', domain: 'sap-d4',
  q: `A global logistics company needs a small amount of compute close to a 5G mobile network to process vehicle telemetry with very low latency. The workload is used only by mobile devices on that carrier network; it does not need to run inside the company's data center. Which AWS deployment option is designed for this use case?`,
  options: [
    "AWS Wavelength Zones integrated with the telecommunications provider's 5G network.",
    "AWS Outposts racks deployed in the company's headquarters.",
    "AWS Local Zones in a nearby metropolitan area, regardless of the mobile carrier network.",
    "An AWS Region selected by Route 53 geolocation routing."
  ],
  answer: 0,
  explain: `**Từ khóa:** thiết bị di động trên mạng 5G của nhà mạng, telemetry cần xử lý rất gần để giảm latency, không yêu cầu đặt phần cứng trong data center của công ty. **AWS Wavelength** nhúng hạ tầng AWS vào mạng của nhà cung cấp viễn thông để ứng dụng chạy gần thiết bị 5G. Đây là mô hình edge cụ thể, không phải chỉ định tuyến request tới AWS Region gần nhất.

**Vì sao đúng:** A đặt phần xử lý tại Wavelength Zone tích hợp với mạng 5G, rút ngắn đường đi của lưu lượng di động.
**Vì sao phương án khác sai:**
- B Outposts đặt hạ tầng AWS tại cơ sở khách hàng; vị trí headquarters không đảm bảo gần thiết bị và mạng di động.
- C Local Zones đặt AWS gần khu vực đô thị, nhưng không chuyên để tích hợp trực tiếp vào mạng 5G của carrier.
- D geolocation routing quyết định DNS trả endpoint nào, không đưa compute vào mạng truy nhập 5G.

> Exam tip: yêu cầu “low latency cho thiết bị trên mạng 5G” là tín hiệu của Wavelength; yêu cầu AWS tại nhà máy là Outposts.`,
  services: ['AWS Wavelength', 'AWS Local Zones', 'AWS Outposts'],
},
{
  id: 'sap-169', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company operates a critical application across three Availability Zones. The resilience team wants to run controlled experiments that temporarily inject network latency into selected test instances, verify that alarms trigger, and stop the experiment automatically if a predefined safety alarm fires. The tests must not affect unrelated production resources. Which solution best meets these requirements?`,
  options: [
    "Use AWS Fault Injection Service experiments with narrowly scoped targets, an IAM role, and CloudWatch stop conditions.",
    "Use AWS Systems Manager Patch Manager to inject latency during the maintenance window.",
    "Use AWS Config rules to simulate network failures and automatically restore instances.",
    "Use Amazon CloudWatch Synthetics to modify network traffic on the selected instances."
  ],
  answer: 0,
  explain: `**Từ khóa:** cố ý đưa lỗi có kiểm soát, chọn đúng instance, quan sát alarm và dừng tự động theo điều kiện an toàn. **AWS Fault Injection Service (FIS)** chạy thí nghiệm fault injection theo template, cho phép xác định target, action, IAM permissions và stop condition. Tư duy quan trọng là bắt đầu ở môi trường kiểm thử, giới hạn phạm vi và có cơ chế dừng trước khi mở rộng.

**Vì sao đúng:** A tạo thử nghiệm có thể lặp lại, giới hạn tài nguyên và dừng khi CloudWatch alarm báo nguy hiểm.
**Vì sao phương án khác sai:**
- B Patch Manager quản lý cài bản vá trong maintenance window, không phải công cụ gây network latency có kiểm soát.
- C Config đánh giá cấu hình tài nguyên và compliance; rule không mô phỏng fault injection.
- D Synthetics chạy canary kiểm tra trải nghiệm endpoint, không thay đổi network trên instance.

> Exam tip: chaos engineering cần giả thuyết, blast radius nhỏ, stop condition và metric quan sát được; FIS cung cấp cơ chế chạy experiment, không thay thế kế hoạch an toàn.`,
  services: ['AWS Fault Injection Service', 'Amazon CloudWatch', 'AWS Systems Manager'],
},
{
  id: 'sap-170', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company has 600 TB of objects across 25 S3 buckets and 12 AWS accounts. Storage costs have increased, but teams do not know which accounts, Regions, storage classes, or prefixes contribute most. The company wants organization-wide visibility and trend analysis without copying object data or running a custom inventory pipeline. Which solution should it use first?`,
  options: [
    "Enable Amazon S3 Storage Lens with an organization-wide dashboard in the delegated administrator account.",
    "Enable S3 server access logging on every bucket and query all request logs to calculate stored-byte trends.",
    "Create an Amazon CloudWatch dashboard with one metric per object in every bucket.",
    "Use AWS Cost Explorer alone, because it reports storage usage by object prefix and storage class."
  ],
  answer: 0,
  explain: `**Từ khóa:** cần nhìn tổng quan dung lượng theo account, Region, storage class và prefix ở nhiều bucket, rồi theo dõi xu hướng mà không dựng pipeline riêng. **Amazon S3 Storage Lens** tổng hợp chỉ số sử dụng và hoạt động của S3, hỗ trợ dashboard cho nhiều account trong organization khi cấu hình quyền phù hợp. Đây là công cụ tìm nơi cần điều tra, không phải thay thế phân tích từng request hay billing chi tiết.

**Vì sao đúng:** A tạo góc nhìn tập trung để nhận diện bucket/prefix tăng nhanh, dữ liệu ít truy cập hoặc cấu hình tối ưu hóa tiềm năng.
**Vì sao phương án khác sai:**
- B server access logs ghi request access, không phải cách gọn nhất để tổng hợp dung lượng; cần lưu và xử lý log lớn.
- C metric từng object tạo cardinality/chi phí không hợp lý và không phải cách S3 expose storage metric.
- D Cost Explorer phân tích chi phí theo các dimension khả dụng, nhưng không cung cấp phân tích prefix/object-level như yêu cầu.

> Exam tip: Storage Lens giúp trả lời “dữ liệu nào đang chiếm chỗ ở đâu?”; Cost Explorer trả lời “chi phí được phân bổ thế nào?”.`,
  services: ['Amazon S3 Storage Lens', 'AWS Organizations', 'AWS Cost Explorer'],
},
{
  id: 'sap-171', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company has 2,000 Amazon S3 buckets and wants to find objects that are larger than 1 GB, are stored in S3 Standard, and have not been accessed for more than 180 days. The company wants a repeatable inventory that can be queried with SQL and then used to apply a lifecycle policy only to matching objects. Which approach is most appropriate?`,
  options: [
    "Configure S3 Inventory with the required object metadata, query the inventory with Amazon Athena, and use the results to define lifecycle transitions.",
    "Use S3 server access logs as the authoritative inventory of every object and transition objects directly from the log file.",
    "Use Amazon S3 Storage Lens to automatically transition each matching object to Glacier Deep Archive.",
    "Run one ListObjects API request per bucket and infer last-access time from the object's LastModified value."
  ],
  answer: 0,
  explain: `**Từ khóa:** hàng nghìn bucket, lọc theo kích thước/storage class và cần truy vấn SQL lặp lại. **S3 Inventory** tạo danh sách object định kỳ với metadata được chọn; có thể đưa inventory vào Athena để lọc và tạo danh sách đối tượng cần hành động. Lưu ý “không được truy cập 180 ngày” không đồng nghĩa với LastModified: S3 Inventory không phải bản ghi thời điểm đọc mỗi object; muốn biết access pattern cần bật và phân tích dữ liệu phù hợp như S3 Storage Lens activity metrics hoặc access logs.

**Vì sao đúng:** A tạo snapshot inventory có thể truy vấn và làm nguồn quyết định lifecycle; policy lifecycle cần được cấu hình rõ, không nên áp dụng rộng ngoài tập đối tượng mục tiêu.
**Vì sao phương án khác sai:**
- B access logs ghi request chứ không phải inventory đầy đủ, và log chưa tự động chuyển object.
- C Storage Lens cung cấp phân tích, không tự áp lifecycle theo kết quả lọc tùy ý.
- D ListObjects không cung cấp last-access timestamp; LastModified chỉ là lần thay đổi object gần nhất.

> Exam tip: phân biệt LastModified với LastAccessed; đừng giả định S3 giữ sẵn thời điểm đọc chính xác cho mọi object.`,
  services: ['Amazon S3 Inventory', 'Amazon Athena', 'Amazon S3'],
},
{
  id: 'sap-172', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company uses AWS Backup for production databases and must prove that recovery procedures work before an annual audit. Backups are already retained in a protected vault, but teams discover restore problems only during drills. The company wants scheduled restore tests with validation and reporting while keeping the existing backup plans. Which solution should it implement?`,
  options: [
    "Configure AWS Backup restore testing plans for supported resources, define a restore testing selection and schedule, and review test results.",
    "Enable S3 Storage Lens and treat its storage metrics as proof that backups can be restored.",
    "Create an AWS Config rule that checks whether each backup vault contains at least one recovery point.",
    "Copy each recovery point to another account and assume that cross-account copies guarantee a successful restore."
  ],
  answer: 0,
  explain: `**Từ khóa:** có recovery point nhưng chưa biết restore thực sự chạy được; cần test định kỳ có báo cáo mà không thay toàn bộ backup plan. **AWS Backup restore testing** tự động hóa việc tạo restore test theo lịch và selection cho loại tài nguyên được hỗ trợ. Một recovery point tồn tại chỉ chứng minh bản backup được tạo, không chứng minh ứng dụng khởi động, dữ liệu nhất quán hay thời gian khôi phục đạt mục tiêu.

**Vì sao đúng:** A thêm kiểm chứng phục hồi định kỳ bên cạnh chính sách backup, giúp tìm lỗi quyền, cấu hình hoặc quy trình sớm.
**Vì sao phương án khác sai:**
- B Storage Lens phân tích S3, không chạy restore cơ sở dữ liệu hay xác nhận tính sử dụng được.
- C Config kiểm tra trạng thái cấu hình/hiện diện recovery point, không kiểm thử khôi phục.
- D bản copy ở account khác tăng khả năng chống sự cố nhưng không tự chứng minh restore thành công.

> Exam tip: backup success và restore success là hai metric khác nhau; audit resilience cần bằng chứng restore test và thời gian thực tế.`,
  services: ['AWS Backup', 'AWS Config'],
},
{
  id: 'sap-173', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company deploys infrastructure with AWS CloudFormation in 70 accounts. Teams make occasional emergency changes directly in the console, and those changes cause later stack updates to fail or replace resources unexpectedly. The platform team wants to detect differences between deployed resources and their templates across accounts before the next release. Which solution is the best fit?`,
  options: [
    "Use CloudFormation drift detection on the relevant stacks and CloudFormation StackSets to manage the organization-wide deployments.",
    "Use AWS Config only to rewrite every resource to match its CloudFormation template automatically.",
    "Enable AWS CloudTrail and use its event history as a live comparison of resource state against templates.",
    "Use AWS Systems Manager State Manager to compare every AWS resource with the CloudFormation template."
  ],
  answer: 0,
  explain: `**Từ khóa:** thay đổi console làm cấu hình thực tế lệch template; cần phát hiện trước release trên nhiều account. **CloudFormation drift detection** so sánh cấu hình tài nguyên được hỗ trợ với cấu hình dự kiến trong stack và báo drift. **StackSets** triển khai/quản lý CloudFormation stacks trên nhiều account/Region, giúp vận hành tập trung. Drift detection phát hiện chứ không tự động sửa mọi loại drift; đội cần xem thay đổi và chọn cập nhật template hoặc khôi phục tài nguyên.

**Vì sao đúng:** A dùng đúng công cụ so sánh stack với template và quản lý rollout cross-account.
**Vì sao phương án khác sai:**
- B AWS Config ghi nhận/đánh giá cấu hình theo rule; nó không tự hiểu toàn bộ template và tự viết lại mọi resource để khớp.
- C CloudTrail ghi lại API activity, không liên tục so sánh trạng thái hiện tại với desired state.
- D State Manager duy trì cấu hình hệ điều hành/instance bằng associations, không phải công cụ drift cho mọi AWS resource.

> Exam tip: CloudTrail trả lời “ai đã gọi API nào”; drift detection trả lời “resource hiện tại khác template ở đâu”.`,
  services: ['AWS CloudFormation', 'CloudFormation StackSets', 'AWS Config'],
},
{
  id: 'sap-174', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company stores 8 PB of backup objects in Amazon S3 across several accounts. The operations team needs visibility into storage growth, object counts, and incomplete multipart uploads, and wants to create a recurring report without listing billions of objects through application code. Which combination is the most operationally efficient? (Choose two.)`,
  options: [
    "Use S3 Storage Lens dashboards for organization-wide storage metrics and trends.",
    "Configure S3 Inventory reports for object-level metadata and query the reports with Amazon Athena.",
    "Enable CloudTrail data events for every object and treat the event log as a complete storage inventory.",
    "Create a CloudWatch custom metric for every object and publish it once per hour.",
    "Use Amazon S3 Select to enumerate all objects in all buckets without an inventory."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Từ khóa:** PB quy mô, cần xu hướng tổng thể lẫn khả năng tra cứu object-level, tránh tự gọi API liệt kê hàng tỷ object. Cần kết hợp hai cấp độ: **S3 Storage Lens** cho số liệu tổng hợp giữa bucket/account; **S3 Inventory** cho báo cáo danh sách object định kỳ, có thể truy vấn bằng Athena. Inventory không nhất thiết phản ánh ngay lập tức vì được tạo theo lịch, nên phù hợp báo cáo/tối ưu hóa chứ không phải kiểm soát đồng bộ tức thời.

**Vì sao A và B đúng:** Storage Lens trả lời câu hỏi dung lượng/đối tượng tăng ở đâu; Inventory cho phép lọc metadata cụ thể và lập báo cáo có thể tái chạy.
**Vì sao phương án khác sai:**
- C CloudTrail data events ghi thao tác API được cấu hình, không phải snapshot đầy đủ của mọi object; volume log sẽ rất lớn.
- D một metric/object gây cardinality và chi phí cực cao, không phải mô hình metric phù hợp.
- E S3 Select truy vấn nội dung của object hỗ trợ, không dùng để enumerate toàn bộ key trong mọi bucket.

> Exam tip: báo cáo storage tổng quan dùng Storage Lens; phân tích metadata từng object dùng Inventory + Athena.`,
  services: ['Amazon S3 Storage Lens', 'Amazon S3 Inventory', 'Amazon Athena'],
},
{
  id: 'sap-175', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company has a Java service on Amazon EC2 that serves customer requests. A monthly release occasionally increases latency, but the team has no repeatable way to verify that the public login journey still works from multiple locations. The team wants lightweight synthetic checks that run on a schedule and alert when a browser-based workflow fails. Which solution should it use?`,
  options: [
    "Create Amazon CloudWatch Synthetics canaries that execute the login journey on a schedule and publish results to CloudWatch.",
    "Use AWS CloudTrail management events to replay the customer's browser workflow.",
    "Use AWS Config to open a TCP connection and verify every page in the login flow.",
    "Use Amazon S3 Inventory to record each successful login response."
  ],
  answer: 0,
  explain: `**Từ khóa:** cần mô phỏng hành trình đăng nhập từ nhiều vị trí, chạy định kỳ, phát hiện lỗi trước khi người dùng báo. **CloudWatch Synthetics canary** chạy script kiểm tra endpoint hoặc browser workflow, lưu kết quả và có thể kết hợp CloudWatch alarms để thông báo. Canary không thay monitoring phía ứng dụng: cần chọn tần suất hợp lý, dữ liệu đăng nhập kiểm thử riêng và tránh ghi secret vào log.

**Vì sao đúng:** A xác nhận chức năng end-to-end như người dùng thực hiện, bắt được lỗi DNS, TLS, giao diện hoặc backend mà chỉ xem CPU không phát hiện.
**Vì sao phương án khác sai:**
- B CloudTrail ghi hoạt động API AWS, không ghi/replay tương tác browser của khách.
- C AWS Config đánh giá cấu hình resource, không thực hiện trình duyệt kiểm tra flow.
- D S3 Inventory liệt kê object metadata, không theo dõi response đăng nhập.

> Exam tip: Synthetics đo “người dùng có hoàn tất được journey không?”; metric hệ thống đo CPU, memory, latency ở từng thành phần.`,
  services: ['Amazon CloudWatch Synthetics', 'Amazon CloudWatch', 'Amazon EC2'],
},
{
  id: 'sap-176', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company has one hundred AWS accounts and wants to distribute a new CloudFormation template to all accounts whenever a security baseline changes. Each account must receive a consistent stack, while the central platform team retains control of the template and deployment targets. Which service is designed for this cross-account stack rollout?`,
  options: [
    "AWS CloudFormation StackSets with service-managed permissions and targets selected from AWS Organizations.",
    "Create a separate CloudFormation stack manually in every account and ask each team to keep it synchronized.",
    "Use AWS Systems Manager Distributor to install the CloudFormation template on EC2 instances.",
    "Use AWS RAM to share a template file, which automatically creates stacks in recipient accounts."
  ],
  answer: 0,
  explain: `**Từ khóa:** một template cần triển khai đồng nhất cho nhiều account trong organization, đội trung tâm kiểm soát target và cập nhật. **CloudFormation StackSets** tạo và quản lý nhiều stack từ một template; với service-managed permissions có thể nhắm tới OU/account trong AWS Organizations và tự triển khai theo lựa chọn cấu hình. StackSet không có nghĩa mọi thay đổi được áp tức thời bất kể cấu hình; cần quản lý rollout, failure tolerance và kiểm tra trạng thái instances.

**Vì sao đúng:** A tránh copy-paste thủ công và cho phép rollout baseline nhất quán cross-account.
**Vì sao phương án khác sai:**
- B tạo drift giữa account và phụ thuộc thao tác/nhớ lịch của từng team.
- C Distributor đóng gói/cài phần mềm lên managed nodes, không triển khai stacks CloudFormation cross-account.
- D RAM chia sẻ tài nguyên, không tự biến file template được share thành stack được triển khai.

> Exam tip: StackSets triển khai template ra nhiều account/Region; RAM chỉ chia sẻ resource, không phải công cụ rollout IaC.`,
  services: ['AWS CloudFormation StackSets', 'AWS Organizations', 'AWS RAM'],
},
{
  id: 'sap-177', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company is reducing storage cost for a 4 PB Amazon S3 data lake. Many objects are rarely accessed, but the access pattern is unpredictable and some objects become popular without warning. The company does not want to build a per-object access prediction model or retrieve objects before reading them. Which storage class is the best starting point for automatically optimizing eligible object storage costs?`,
  options: [
    "Use S3 Intelligent-Tiering for eligible objects and monitor the applicable monitoring and retrieval charges.",
    "Move every object to S3 Glacier Deep Archive because the data is described as rarely accessed.",
    "Use S3 One Zone-IA because it automatically moves objects between storage tiers in multiple Availability Zones.",
    "Keep all objects in S3 Standard and create a lifecycle rule that deletes objects after 30 days."
  ],
  answer: 0,
  explain: `**Từ khóa:** access pattern không dự đoán được, object có thể bất ngờ được đọc nhiều, không muốn tự xây mô hình. **S3 Intelligent-Tiering** tự chuyển object đủ điều kiện giữa các access tier theo hoạt động truy cập; người dùng không phải dự đoán trước. Cần lưu ý có phí monitoring/automation cho object đủ điều kiện và các tầng truy cập tức thì khác với tầng archive cần restore trước.

**Vì sao đúng:** A tự tối ưu theo hành vi thực tế, đồng thời giữ khả năng truy cập phù hợp với tầng được sử dụng.
**Vì sao phương án khác sai:**
- B Deep Archive tối ưu lưu trữ rất rẻ nhưng cần thời gian restore; không phù hợp object bất ngờ cần đọc ngay.
- C One Zone-IA lưu trong một AZ và không tự chuyển tier theo truy cập như Intelligent-Tiering; durability/availability trade-off khác.
- D xóa sau 30 ngày vi phạm yêu cầu giữ data lake và không tối ưu chi phí bằng cách chọn storage class.

> Exam tip: unpredictable access → Intelligent-Tiering; archive có thể chờ restore → Glacier tiers; dữ liệu có thể tái tạo và chấp nhận một AZ → cân nhắc One Zone.`,
  services: ['Amazon S3 Intelligent-Tiering', 'Amazon S3 Glacier'],
},
{
  id: 'sap-178', exam: 'sap-c02', domain: 'sap-d3',
  q: `A company has a production S3 bucket with millions of objects. A compliance team wants to identify objects that are encrypted with an outdated key, run a controlled remediation on only the matching objects, and track per-object success and failure. The operation must not require a custom fleet of workers. Which approach is most appropriate?`,
  options: [
    "Generate an S3 Inventory report, filter the affected objects, and use S3 Batch Operations to invoke an operation on that manifest.",
    "Run a single S3 PutBucketEncryption call, which automatically re-encrypts all existing objects.",
    "Use AWS Config to rewrite the encryption key of each existing S3 object without an object-level operation.",
    "Enable S3 Lifecycle expiration and recreate all objects through a one-time bucket copy."
  ],
  answer: 0,
  explain: `**Từ khóa:** cần tìm một tập object cụ thể, chạy tác vụ theo từng object, có báo cáo thành công/thất bại và không tự quản lý worker. S3 Inventory tạo manifest metadata; **S3 Batch Operations** chạy tác vụ trên danh sách object quy mô lớn và lưu kết quả theo object. Đổi default encryption trên bucket chỉ ảnh hưởng object ghi sau đó, không tự mã hóa lại object đã tồn tại; remediation phải tạo bản ghi mới phù hợp.

**Vì sao đúng:** A tách discovery (Inventory), selection (lọc manifest) và execution/reporting (Batch Operations), dễ kiểm soát và audit.
**Vì sao phương án khác sai:**
- B PutBucketEncryption đặt mặc định cho upload mới; không rewrite nội dung/key của object cũ.
- C Config phát hiện/đánh giá cấu hình nhưng không thực hiện thao tác re-encrypt object theo cách này.
- D Lifecycle expiration xóa dữ liệu theo rule; recreate toàn bộ có thể gây mất dữ liệu/metadata và không chọn chính xác đối tượng.

> Exam tip: thay đổi cấu hình bucket không hồi tố; với hàng triệu object cũ, dùng Inventory để chọn và Batch Operations để xử lý có báo cáo.`,
  services: ['Amazon S3 Inventory', 'Amazon S3 Batch Operations', 'Amazon S3'],
},
{
  id: 'sap-179', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 300 member accounts in AWS Organizations. The security team wants member accounts to use the organization's central root credentials for emergency access, and wants to remove unnecessary root passwords and access keys from member accounts while keeping the management account root untouched. Which capability should the team use?`,
  options: [
    "Use centralized root access in AWS Organizations to manage member-account root credentials and enable the required organization integration.",
    "Create one IAM user named root in the management account and share its password with account administrators.",
    "Use AWS IAM Identity Center permission sets because they replace every root-user operation in all accounts.",
    "Attach an SCP that denies all actions to the root user, which automatically deletes root credentials."
  ],
  answer: 0,
  explain: `**Từ khóa:** quản trị tập trung thông tin xác thực root của member account, giảm password/access key không cần thiết nhưng giữ root management account riêng. AWS Organizations hỗ trợ centralized root access cho member accounts, gồm khả năng loại bỏ thông tin xác thực root lâu dài và thực hiện một số tác vụ root được hỗ trợ từ management/delegated account. Cần cấu hình trusted access/role phù hợp và hiểu đây không phải cách chia sẻ một mật khẩu root chung.

**Vì sao đúng:** A áp dụng quyền quản trị root ở cấp organization cho member accounts mà không biến root thành tài khoản dùng chung.
**Vì sao phương án khác sai:**
- B IAM user tên root không phải root user thật và chia sẻ mật khẩu vi phạm quản trị danh tính.
- C Identity Center cấp quyền role-based cho người dùng, nhưng không thay mọi tác vụ chỉ root mới làm được.
- D SCP có thể giới hạn hành động, nhưng không xóa password/access key root; việc có SCP cũng không phải cơ chế quản lý credential.

> Exam tip: root user là danh tính đặc biệt của từng account; tập trung root access không đồng nghĩa dùng chung một root credential.`,
  services: ['AWS Organizations', 'AWS IAM Identity Center'],
},
{
  id: 'sap-180', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company allows engineers to launch approved products from AWS Marketplace. Procurement requires that only products reviewed and approved by the security team can be discovered and purchased by employees. The company uses many AWS accounts and wants a central catalog without maintaining a separate deny policy in every account. Which solution best meets the requirement?`,
  options: [
    "Create an AWS Marketplace private marketplace, curate the approved products centrally, and make it available to the organization's accounts.",
    "Use an S3 bucket policy to hide unapproved Marketplace products from account users.",
    "Create an IAM role in every account and manually enumerate every approved product ARN.",
    "Use AWS Service Catalog portfolios because they automatically control every public AWS Marketplace listing without product setup."
  ],
  answer: 0,
  explain: `**Từ khóa:** đội procurement/security phải duyệt trước sản phẩm Marketplace, danh mục áp dụng tập trung nhiều account, người dùng chỉ cần tìm/mua trong danh sách được duyệt. **AWS Marketplace private marketplace** cho phép quản trị viên chọn sản phẩm được phép cung cấp cho organization/account, tạo trải nghiệm danh mục riêng. Cần thiết lập và quản trị private marketplace phù hợp với cấu trúc organization; nó kiểm soát sản phẩm Marketplace chứ không thay thế IAM cho quyền dùng tài nguyên sau khi triển khai.

**Vì sao đúng:** A tập trung quy trình phê duyệt và hiển thị sản phẩm được phép mà không phải viết policy deny cho từng listing ở mọi account.
**Vì sao phương án khác sai:**
- B bucket policy chỉ áp dụng S3, không điều khiển catalog Marketplace.
- C liệt kê ARN thủ công phân tán, tốn vận hành và không phải cơ chế curated catalog chuẩn.
- D Service Catalog quản lý sản phẩm/provisioning nội bộ; không tự chặn toàn bộ listing Marketplace nếu chưa tích hợp/quản lý cụ thể.

> Exam tip: kiểm soát “được mua sản phẩm nào” dùng private marketplace; kiểm soát “được làm gì sau khi triển khai” vẫn cần IAM/SCP.`,
  services: ['AWS Marketplace', 'AWS Organizations', 'AWS Service Catalog'],
},
{
  id: 'sap-181', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 60 accounts in AWS Organizations and frequently launches bursty workloads for short training jobs. The central capacity team has purchased EC2 Capacity Reservations in a shared account, but workload accounts cannot use the reserved capacity. The company wants to share compatible reservations with selected accounts without sharing the instances themselves. Which combination of steps should it take? (Choose two.)`,
  options: [
    "Enable AWS RAM sharing with AWS Organizations so organization accounts can be selected as principals.",
    "Create an AWS RAM resource share for the EC2 Capacity Reservations and grant selected workload accounts access.",
    "Share the running EC2 instances through AWS RAM so other accounts can launch into them.",
    "Create an EC2 Auto Scaling group in the central account and attach it to every workload account.",
    "Purchase a Savings Plan because it reserves specific EC2 capacity for other accounts."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Từ khóa:** central account đã có Capacity Reservations, các workload account cần dùng phần capacity tương thích, không chia sẻ instance đang chạy. **AWS RAM** có thể chia sẻ EC2 Capacity Reservations cho account/OU phù hợp; account tiêu thụ vẫn phải chọn instance attributes tương thích và sử dụng capacity được share đúng cách. Reservation đảm bảo khả năng có capacity trong Availability Zone/instance attributes đã đặt, không phải workload đã được chạy sẵn.

**Vì sao A và B đúng:** bật RAM sharing với Organizations cho phép chọn principal trong tổ chức; resource share mới cấp quyền sử dụng Capacity Reservation cho workload accounts được chọn. Account tiêu thụ vẫn phải dùng thuộc tính instance phù hợp. Reservation bảo đảm capacity, không phải workload đã được chạy sẵn.
**Vì sao phương án khác sai:**
- C RAM không chia sẻ EC2 instance đang chạy theo cách này; yêu cầu cần share reservation.
- D Auto Scaling group thuộc account sở hữu, không tự tạo quyền chạy instance trong account khác.
- E Savings Plans là cam kết chi tiêu để giảm giá compute, không đặt trước capacity cụ thể.

> Exam tip: Savings Plans giảm bill; Capacity Reservation bảo đảm capacity ở AZ/instance type cụ thể; có thể cần cả hai cho hai mục tiêu khác nhau.`,
  services: ['Amazon EC2 Capacity Reservations', 'AWS RAM', 'AWS Organizations'],
},
{
  id: 'sap-182', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 45 AWS accounts. Each business unit must apply a standard tag key named CostCenter, but teams may choose their own valid cost-center value. The security team wants to detect keys that differ in capitalization or spelling and provide a consistent tagging vocabulary, without assuming that tag policies prevent all untagged resource creation. Which governance feature should it use?`,
  options: [
    "Use AWS Organizations tag policies to define the standardized tag key and allowed values, and monitor compliance.",
    "Use an SCP that requires every resource-creation API to include a CostCenter tag, with no exceptions.",
    "Use IAM Identity Center permission sets to rewrite resource tags after each API call.",
    "Use an AWS Config aggregator because it automatically blocks resources with noncompliant tag keys."
  ],
  answer: 0,
  explain: `**Từ khóa:** chuẩn hóa cách viết key và vocabulary giữa account, nhưng đề nói rõ không giả định policy chặn mọi resource chưa tag. **AWS Organizations tag policies** giúp định nghĩa key/tag value chuẩn và báo cáo compliance cho tài nguyên/dịch vụ được hỗ trợ. Tag policy không phải cơ chế cấp quyền hay enforcement phổ quát để từ chối mọi lệnh tạo resource; nếu cần ngăn tạo resource thiếu tag phải thiết kế IAM/SCP/service-specific controls có kiểm thử.

**Vì sao đúng:** A tạo chuẩn thống nhất và visibility về sai khác như costcenter/Cost-Center.
**Vì sao phương án khác sai:**
- B SCP có thể giới hạn API theo condition tag trong một số trường hợp, nhưng không có một statement đơn giản áp dụng an toàn đồng nhất cho mọi resource và dễ chặn cả dịch vụ nền.
- C Permission set cấp quyền đăng nhập, không sửa tag tự động sau mỗi API.
- D Config aggregator tổng hợp compliance; aggregator không tự block hoạt động và không thay thế tag policy.

> Exam tip: tag policies chuẩn hóa và báo cáo; muốn deny resource thiếu tag, xác định service/API cụ thể rồi kiểm thử policy enforcement riêng.`,
  services: ['AWS Organizations', 'AWS Config', 'AWS Identity and Access Management'],
},
{
  id: 'sap-183', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 200 AWS accounts and wants a central finance team to configure alternate billing contacts and technical contacts for member accounts. Account owners must not need to log in to every account, and the root user of the management account must remain controlled by a small security group. Which approach is most appropriate?`,
  options: [
    "Use AWS Organizations integration with the AWS Account Management service to manage member-account alternate contacts centrally.",
    "Create IAM users in every account with the same password and update the contacts through the console.",
    "Use AWS Systems Manager Fleet Manager to edit account billing contacts on EC2 instances.",
    "Use AWS Budgets to set alternate contacts automatically when a billing threshold is crossed."
  ],
  answer: 0,
  explain: `**Từ khóa:** quản trị contact của nhiều member account tập trung, không yêu cầu owner đăng nhập từng account. AWS Account Management cung cấp API/console quản lý một số thông tin tài khoản như alternate contacts; khi tích hợp với Organizations, người có quyền phù hợp ở management/delegated account có thể quản lý member accounts tập trung. Cần cấp quyền tối thiểu và phân biệt alternate contact với email/credential của root user.

**Vì sao đúng:** A giảm thao tác lặp, đảm bảo billing/operations/security contact được cập nhật theo quy trình tổ chức.
**Vì sao phương án khác sai:**
- B tạo IAM users chung mật khẩu làm tăng rủi ro và vẫn phải đăng nhập từng account.
- C Fleet Manager quản lý máy chủ EC2/OS, không sửa metadata của AWS account.
- D Budgets cảnh báo chi phí và có thể kích hoạt hành động hỗ trợ, nhưng không quản lý contact record.

> Exam tip: contact/account metadata là trách nhiệm governance; không dùng IAM user chung hay công cụ quản lý server để sửa thông tin account.`,
  services: ['AWS Account Management', 'AWS Organizations', 'AWS Identity and Access Management'],
},
{
  id: 'sap-184', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company operates 80 AWS accounts. Its internal platform team needs delegated permission to manage AWS Organizations integrations and centrally update account settings, but must not receive unrestricted access to every workload resource. The company wants to assign management responsibility to a dedicated account rather than use the management account for daily operations. Which design follows AWS multi-account governance practices?`,
  options: [
    "Register an appropriate delegated administrator for supported services and grant only the required Organizations and account-management permissions.",
    "Give the platform team the management account root password so it can administer all services.",
    "Create a full AdministratorAccess role in every workload account and let the platform team assume it.",
    "Move all workloads into the management account so there is only one account to administer."
  ],
  answer: 0,
  explain: `**Từ khóa:** giao trách nhiệm vận hành tập trung cho account chuyên dụng nhưng không cấp quyền không giới hạn trên workload. AWS Organizations cho phép những dịch vụ hỗ trợ đăng ký **delegated administrator** trong một member account; quyền thực tế được giới hạn theo dịch vụ và IAM policy cần thiết. Không phải mọi tác vụ Organizations đều có thể giao cho delegated admin, nên phải kiểm tra capability cụ thể.

**Vì sao đúng:** A tách quản trị/security account khỏi workload accounts, giảm dùng management account hằng ngày và tuân least privilege.
**Vì sao phương án khác sai:**
- B root credential có phạm vi quá rộng, khó audit và không nên dùng cho vận hành thường xuyên.
- C AdministratorAccess mỗi account cho platform team quyền vượt yêu cầu và tăng blast radius.
- D đưa workload vào management account phá vỡ isolation và không phải mẫu multi-account an toàn.

> Exam tip: delegated administrator không phải “admin của cả organization” mặc định; quyền chỉ áp dụng cho dịch vụ/chức năng hỗ trợ và policy đã cấp.`,
  services: ['AWS Organizations', 'AWS Identity and Access Management'],
},
{
  id: 'sap-185', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 35 AWS accounts and wants business units to see internal chargeback prices that differ from the actual AWS bill. The finance team must present negotiated rates to each business unit while preserving the original consolidated AWS billing relationship and actual AWS charges. Which service is designed for this billing presentation?`,
  options: [
    "Use AWS Billing Conductor to create billing groups and pricing plans for internal billing views.",
    "Use AWS Cost Explorer to change the actual AWS prices charged by the AWS invoice.",
    "Use AWS Organizations tag policies to assign a different AWS service price to each tag value.",
    "Use AWS Budgets to rewrite the consolidated bill using custom rates."
  ],
  answer: 0,
  explain: `**Từ khóa:** chargeback nội bộ có giá/showback khác với hóa đơn AWS thực tế, nhưng không thay đổi consolidated billing. **AWS Billing Conductor** hỗ trợ mô hình hóa billing groups và pricing plans để tạo biểu diễn chi phí pro forma cho người dùng nội bộ. Đây là cách báo cáo/phân bổ nội bộ; AWS vẫn tính và xuất hóa đơn theo giá AWS thực tế, còn finance chịu trách nhiệm giải thích chênh lệch.

**Vì sao đúng:** A đáp ứng nhu cầu trình bày custom rates cho business unit mà không làm thay đổi khoản phải trả AWS.
**Vì sao phương án khác sai:**
- B Cost Explorer phân tích/hiển thị chi phí, không đặt giá invoice cho AWS.
- C tag policies quản lý chuẩn tag, không áp giá dịch vụ.
- D Budgets đặt ngưỡng và cảnh báo/hành động, không viết lại hóa đơn.

> Exam tip: cần chargeback theo giá nội bộ mà giữ nguyên AWS invoice thì dùng Billing Conductor; phân tích chi tiêu thực dùng Cost Explorer.`,
  services: ['AWS Billing Conductor', 'AWS Cost Explorer', 'AWS Organizations'],
},
{
  id: 'sap-186', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company has 120 AWS accounts and wants to automate account creation for new projects. Every new account must receive a standard set of account metadata and an approved security baseline, while application teams must not be able to create accounts outside the central process. The company already uses AWS Organizations and wants to avoid building an account vending system from scratch. Which solution is the best fit?`,
  options: [
    "Use AWS Control Tower Account Factory to provision governed accounts into the appropriate organizational units.",
    "Allow each team to create accounts directly and use AWS Config to merge them into the organization later.",
    "Use Amazon EC2 Auto Scaling to create one account per project when instance demand increases.",
    "Use AWS RAM to convert project VPCs into new AWS accounts."
  ],
  answer: 0,
  explain: `**Từ khóa:** account mới phải đi qua quy trình tập trung, có metadata và baseline, vào đúng OU, không muốn tự xây account vending. **AWS Control Tower Account Factory** tạo account theo landing zone và guardrails đã cấu hình; quy trình được vận hành qua Control Tower, hỗ trợ chuẩn hóa việc cấp account. Cần duy trì landing zone và cập nhật baseline, không nên coi việc tạo account là thay thế quản trị sau khi cấp.

**Vì sao đúng:** A tự động hóa việc cấp account theo mẫu và đưa vào vùng quản trị phù hợp.
**Vì sao phương án khác sai:**
- B tạo account rời rồi mới nhập tổ chức tạo khoảng trống governance trong thời gian đầu và phụ thuộc thao tác thủ công.
- C Auto Scaling tạo EC2 capacity, không tạo AWS accounts.
- D RAM chia sẻ tài nguyên giữa account, không tạo account mới.

> Exam tip: account factory chuẩn hóa onboarding; cần policy/guardrails đi cùng để account không trở thành “shadow IT” sau ngày tạo.`,
  services: ['AWS Control Tower', 'AWS Organizations'],
},
{
  id: 'sap-187', exam: 'sap-c02', domain: 'sap-d1',
  q: `A company uses AWS Organizations and has many accounts with IAM users created years ago. The security team wants to stop creating long-lived IAM users for human access and assign account access according to corporate groups, while retaining role-based temporary credentials for administrators. Which solution best addresses the requirement?`,
  options: [
    "Use AWS IAM Identity Center with the corporate identity provider, assign users or groups to accounts through permission sets, and remove unnecessary IAM users.",
    "Create one IAM user per employee in every account and synchronize passwords with the corporate directory.",
    "Use AWS KMS keys as user identities and grant each employee a decrypt permission.",
    "Use AWS CloudTrail to federate corporate users into AWS accounts."
  ],
  answer: 0,
  explain: `**Từ khóa:** người dùng đăng nhập bằng nhóm corporate, quyền vào nhiều account theo role và không muốn credential dài hạn. **IAM Identity Center** kết nối identity source, ánh xạ user/group tới account và permission set; khi người dùng đăng nhập, dịch vụ tạo session credentials tạm thời qua role. Nhóm cần review access định kỳ và xóa IAM user cũ để tránh tồn tại đường đăng nhập song song.

**Vì sao đúng:** A tập trung vòng đời danh tính và account assignment, giảm tạo user/credential từng account.
**Vì sao phương án khác sai:**
- B nhân đôi tài khoản và password, khiến offboarding dễ bỏ sót và tăng rủi ro credential bị lộ.
- C KMS key dùng mã hóa/giải mã, không phải principal đăng nhập.
- D CloudTrail ghi lại hoạt động API và audit; không phải dịch vụ federation.

> Exam tip: IAM Identity Center quản lý human access cross-account; IAM roles vẫn là cơ chế cấp quyền kỹ thuật cho workload.`,
  services: ['AWS IAM Identity Center', 'AWS Organizations', 'AWS Identity and Access Management'],
},
{
  id: 'sap-188', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company runs an internal REST API on private EC2 instances. Only clients in selected VPCs should be able to invoke the API; the API must not be reachable from the public internet. The company wants a managed API front end, private connectivity through interface endpoints, and an additional resource policy that limits which VPC endpoints can call it. Which combination of steps should it take? (Choose two.)`,
  options: [
    "Create an API Gateway private REST API for the internal API.",
    "Create an execute-api interface VPC endpoint and use an API resource policy to restrict which endpoint can invoke the API.",
    "Create a public API Gateway endpoint and rely only on a secret URL that is difficult to guess.",
    "Create a private Application Load Balancer and enable CloudFront public access to it.",
    "Create an S3 gateway endpoint because all AWS APIs can be reached through an S3 endpoint."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Từ khóa:** REST API không public, chỉ VPC được chọn gọi, cần interface endpoint và policy ở resource. **API Gateway private REST API** được gọi qua interface VPC endpoint của dịch vụ execute-api; resource policy có thể giới hạn nguồn gọi theo VPC endpoint/VPC. Cần cấu hình DNS/routing và quyền execute-api phù hợp; private endpoint không tự đảm bảo mọi client trong VPC đều được phép.

**Vì sao A và B đúng:** private REST API tạo mặt API không public; execute-api interface endpoint cung cấp đường vào riêng, còn resource policy giới hạn VPC endpoint được gọi. Cả hai lớp đều cần thiết theo yêu cầu.
**Vì sao phương án khác sai:**
- C URL bí mật không phải cơ chế xác thực/phân quyền và endpoint vẫn public.
- D CloudFront là điểm truy cập internet phổ biến; private ALB không biến API thành private API Gateway với VPC endpoint policy.
- E S3 gateway endpoint chỉ truy cập S3 qua route table; không phải endpoint chung cho API AWS khác.

> Exam tip: private REST API của API Gateway dùng interface endpoint; endpoint policy và API resource policy là hai lớp kiểm soát khác nhau.`,
  services: ['Amazon API Gateway', 'Amazon VPC', 'AWS PrivateLink'],
},
{
  id: 'sap-189', exam: 'sap-c02', domain: 'sap-d2',
  q: `A media company stores unreleased film assets in Amazon S3. Once an asset is approved for archival, it must be protected from deletion or overwrite for seven years, even by privileged bucket administrators. The company must also retain the ability to prove that a specific object version was under legal hold during a litigation case. Which combination of steps meets both requirements? (Choose two.)`,
  options: [
    "Enable S3 Object Lock with compliance-mode retention for the required seven-year period.",
    "Place a legal hold on the relevant object version during the litigation case and remove it only when legally permitted.",
    "Enable S3 Versioning and lifecycle expiration after seven years; administrators can still delete versions when required.",
    "Use S3 Glacier Deep Archive and rely on its storage class to prevent deletion for seven years.",
    "Apply an SCP that denies s3:DeleteObject without enabling Object Lock."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Từ khóa:** không ai, kể cả admin bucket, được xóa/ghi đè version trong 7 năm; cần giữ riêng đối tượng đang bị litigation. **S3 Object Lock** hoạt động với versioning. Compliance mode ngăn xóa version hoặc rút ngắn retention trước hạn, kể cả bởi root trong account; legal hold có thể giữ version vô thời hạn cho tới khi được gỡ bởi principal có quyền phù hợp. Cần bật và kiểm tra cấu hình trước khi đưa dữ liệu vào, vì governance mode có quyền bypass đặc biệt còn compliance mode thì nghiêm ngặt hơn.

**Vì sao A và B đúng:** compliance retention bảo vệ version trong bảy năm; legal hold giữ version liên quan vụ kiện theo thời gian cần thiết. Object Lock cần versioning; khi cấu hình bucket phải kiểm tra versioning và chế độ retention.
**Vì sao phương án khác sai:**
- C versioning giữ nhiều version nhưng quyền có thể xóa version; lifecycle không phải WORM protection.
- D Glacier Deep Archive là storage class/archival tier, không tự khóa object khỏi xóa.
- E SCP là guardrail quyền nhưng cấu hình sai/ngoại lệ/root governance không tương đương Object Lock compliance.

> Exam tip: cần WORM bất biến thì dùng Object Lock; “đã versioned” hoặc “đã archive” không đồng nghĩa không thể xóa.`,
  services: ['Amazon S3 Object Lock', 'Amazon S3'],
},
{
  id: 'sap-190', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company ingests telemetry into Amazon Kinesis Data Streams. Two independent consumer applications must each read every record at high throughput without slowing each other down, and the company wants the stream to scale automatically with unpredictable traffic. Which combination of features best meets the requirements? (Choose two.)`,
  options: [
    "Use on-demand capacity mode for the stream to accommodate unpredictable traffic.",
    "Register each application as a consumer with enhanced fan-out so each has dedicated read throughput.",
    "Use one shared standard polling consumer and have both applications compete for the same shard records.",
    "Send every record to Amazon S3 with S3 Transfer Acceleration and let both applications poll the bucket.",
    "Use Amazon SQS Standard because each competing consumer receives a copy of every message."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Từ khóa:** hai consumer độc lập đều phải đọc mọi record, không tranh throughput và traffic khó đoán. **Kinesis Data Streams enhanced fan-out** cấp luồng đọc riêng cho registered consumer, dùng HTTP/2 push qua SubscribeToShard và tránh các consumer tranh read throughput kiểu shared polling; on-demand mode điều chỉnh capacity theo traffic. Cần kiểm tra giới hạn shard/consumer và retention theo thiết kế, không nhầm stream retention với lưu trữ lâu dài.

**Vì sao A và B đúng:** on-demand capacity mode phù hợp traffic khó dự đoán; enhanced fan-out cấp read throughput riêng cho registered consumer, giúp ứng dụng độc lập đọc dữ liệu.
**Vì sao phương án khác sai:**
- C consumer dùng chung có thể chia sẻ record và throughput; không đảm bảo cả hai application nhận mọi record.
- D Transfer Acceleration tối ưu upload lên S3, không phải streaming event ingestion.
- E SQS competing consumers phân phối message cho consumer, không broadcast mọi message tới từng consumer; cần queue riêng/fan-out pattern nếu dùng SQS.

> Exam tip: một stream, nhiều ứng dụng cần toàn bộ event → Kinesis consumer riêng/enhanced fan-out; queue worker cạnh tranh xử lý một lần → SQS.`,
  services: ['Amazon Kinesis Data Streams', 'Amazon S3', 'Amazon SQS'],
},
{
  id: 'sap-191', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company receives events in an Amazon SQS queue. Only events with a specific attribute need to start a workflow, and the workflow input must be transformed before execution. The team wants to connect the queue to AWS Step Functions with filtering and input transformation, without writing a continuously running polling service. Which combination of configuration steps is required? (Choose two.)`,
  options: [
    "Create an EventBridge Pipe with the SQS queue as its source and configure an event filter for the required attribute.",
    "Configure the pipe's input transformation and set the Step Functions state machine as its target.",
    "Run an EC2 instance that polls SQS continuously, filters messages in application code, and invokes Step Functions.",
    "Configure an SQS queue policy to transform message bodies and start Step Functions directly.",
    "Use AWS CloudTrail to poll the queue and invoke the state machine when a matching message appears."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Từ khóa:** SQS source, lọc theo thuộc tính, biến đổi input, gọi Step Functions mà không vận hành poller liên tục. **Amazon EventBridge Pipes** nối source và target, hỗ trợ filtering và input transformation; SQS là source được hỗ trợ và Step Functions có thể là target. Cần cấu hình quyền invoke và xác định xử lý lỗi/retry/DLQ phù hợp; Pipes không thay thế thiết kế idempotency của workflow.

**Vì sao A và B đúng:** EventBridge Pipe lấy message từ SQS và lọc attribute; input transformation cùng Step Functions target hoàn tất đường đi mà không cần poller tự quản lý.
**Vì sao phương án khác sai:**
- C hoạt động được nhưng phải vá, scale, quản lý polling và xử lý lỗi trên EC2.
- D queue policy quyết định quyền truy cập, không biến đổi message hay khởi chạy workflow.
- E CloudTrail ghi hoạt động AWS API, không đọc nội dung queue.

> Exam tip: EventBridge Pipes dành cho point-to-point source → filter/enrich/transform → target; EventBridge bus dành cho publish/subscribe event routing.`,
  services: ['Amazon EventBridge Pipes', 'Amazon SQS', 'AWS Step Functions'],
},
{
  id: 'sap-192', exam: 'sap-c02', domain: 'sap-d2',
  q: `A financial company needs a low-latency in-memory data store for session and risk state. The data must remain durable across node failures and be replicated across Availability Zones, and the application already uses the Redis OSS protocol. The company does not want to treat the data as a disposable cache that can be rebuilt after a failure. Which service is the best fit?`,
  options: [
    "Use Amazon MemoryDB for Redis as the primary durable in-memory database.",
    "Use Amazon ElastiCache for Redis as a cache and disable persistence because cached data is always durable.",
    "Use Amazon S3 Standard as the primary session store and query it for every request.",
    "Use Amazon DynamoDB Accelerator (DAX) as a Redis-compatible primary data store."
  ],
  answer: 0,
  explain: `**Từ khóa:** cần độ trễ in-memory, dữ liệu là state quan trọng không thể xem như cache tái tạo, ứng dụng dùng Redis OSS protocol. **Amazon MemoryDB for Redis** là database in-memory tương thích Redis, thiết kế để lưu dữ liệu chính với độ bền qua transaction log và triển khai phân tán Multi-AZ. Cần phân biệt database với cache: ElastiCache thường tăng tốc một nguồn dữ liệu khác và ứng dụng phải có chiến lược khôi phục cache.

**Vì sao đúng:** A phù hợp khi dữ liệu in-memory là nguồn chính cần durability/availability, không chỉ bản sao tạm.
**Vì sao phương án khác sai:**
- B ElastiCache là dịch vụ cache; tùy cấu hình có durability options nhưng không nên chọn chỉ với giả định cache mặc định là database bền vững.
- C S3 có latency và mô hình truy cập object không phù hợp session/risk lookup mỗi request.
- D DAX là cache tăng tốc truy vấn DynamoDB, không tương thích Redis và không làm primary Redis database.

> Exam tip: nếu mất cache có thể rebuild từ DB thì cache; nếu dữ liệu in-memory là nguồn chính cần bền vững, xem MemoryDB.`,
  services: ['Amazon MemoryDB for Redis', 'Amazon ElastiCache', 'Amazon DynamoDB Accelerator'],
},
{
  id: 'sap-193', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company serves a static analytics dataset from Amazon S3. The dataset is regenerated from source data every day, is several terabytes in size, and must support very high request rates with single-digit millisecond latency. The application can tolerate losing data in one Availability Zone because the dataset can be recreated. Which storage option best matches the access pattern and durability trade-off?`,
  options: [
    "Use Amazon S3 Express One Zone for the dataset and regenerate it from the durable source when necessary.",
    "Use S3 Glacier Deep Archive because it offers the lowest storage cost and immediate millisecond reads.",
    "Use Amazon EFS Standard because every object request must be served from a POSIX file system.",
    "Use S3 One Zone-IA because it is designed for the highest request rates and single-digit millisecond latency."
  ],
  answer: 0,
  explain: `**Từ khóa:** dữ liệu lớn được tạo lại hàng ngày, cần request rate rất cao và độ trễ một chữ số mili giây, chấp nhận mất dữ liệu trong một AZ. **S3 Express One Zone** là storage class hiệu năng cao lưu dữ liệu trong một Availability Zone, phù hợp workload cần latency thấp và có thể tái tạo dữ liệu hoặc có bản nguồn bền vững riêng. Phải cân nhắc độ bền phạm vi một AZ, chi phí request/storage và khả năng ứng dụng xử lý dữ liệu sau khi AZ gặp sự cố.

**Vì sao đúng:** A khớp access profile hiệu năng cao và chấp nhận trade-off đơn AZ.
**Vì sao phương án khác sai:**
- B Deep Archive tối ưu lưu trữ lạnh; object cần restore trước khi đọc, không đáp ứng latency tức thời.
- C EFS cung cấp shared file system POSIX, không phải object storage tối ưu cho hàng tỷ request object.
- D One Zone-IA giảm chi phí cho dữ liệu ít truy cập, không phải tier hiệu năng cao cho request rate lớn.

> Exam tip: chọn storage class theo latency, access frequency, AZ durability và khả năng tái tạo; rẻ nhất trên GB không chắc rẻ nhất cho workload.`,
  services: ['Amazon S3 Express One Zone', 'Amazon S3 Glacier', 'Amazon EFS'],
},
{
  id: 'sap-194', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company wants to release a new payment feature behind a feature flag. The team must roll out the configuration to 5%, then 25%, then 100% of production clients, monitor a CloudWatch alarm, and automatically roll back the configuration if errors increase. The team wants a managed configuration deployment service rather than a new deployment system. Which solution meets the requirements?`,
  options: [
    "Use AWS AppConfig with a gradual deployment strategy and a CloudWatch alarm as a bake-time monitor.",
    "Use Amazon Route 53 weighted records to control which application code path is enabled for each client.",
    "Use AWS CloudFormation drift detection to gradually change feature flags and roll them back on an alarm.",
    "Use AWS Systems Manager Patch Manager to deploy the flag value to application servers."
  ],
  answer: 0,
  explain: `**Từ khóa:** feature flag, rollout theo tỷ lệ, theo dõi alarm và rollback cấu hình tự động nếu lỗi tăng. **AWS AppConfig** quản lý cấu hình/feature flags và hỗ trợ deployment strategy theo từng giai đoạn; có thể dùng CloudWatch alarm làm monitor để rollback deployment khi điều kiện xấu xảy ra. Ứng dụng cần đọc và áp dụng config theo integration đã triển khai; AppConfig không tự thay đổi logic ứng dụng nếu chưa được thiết kế hỗ trợ flag.

**Vì sao đúng:** A tách phát hành code khỏi bật tính năng, giảm blast radius và có cơ chế rollback cấu hình.
**Vì sao phương án khác sai:**
- B weighted DNS phân phối request tới endpoint/Region, không bật flag theo client trong cùng ứng dụng.
- C drift detection tìm sai khác resource so với template, không quản lý rollout flag.
- D Patch Manager cài bản vá OS/phần mềm, không phải dịch vụ phát hành runtime configuration.

> Exam tip: canary deploy binary và canary config là hai lớp khác nhau; AppConfig phù hợp rollout cấu hình/feature flag có kiểm soát.`,
  services: ['AWS AppConfig', 'Amazon CloudWatch', 'Amazon Route 53'],
},
{
  id: 'sap-195', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company has a Java 17 AWS Lambda function that receives infrequent requests and performs a short initialization step before serving each request. Users see long cold-start latency, but traffic is too low to justify continuously running provisioned capacity. The function can use a supported managed Java runtime and publish versioned deployments. Which option should the team evaluate first to reduce startup latency without keeping instances warm all the time?`,
  options: [
    "Enable Lambda SnapStart for the supported Java runtime and invoke a published function version or alias.",
    "Configure provisioned concurrency at the peak request rate for every hour of the month.",
    "Move the function to an EC2 instance with a permanently running Java process.",
    "Increase the Lambda timeout so the cold start is hidden from the caller."
  ],
  answer: 0,
  explain: `**Từ khóa:** Java Lambda, request thưa, cold-start do initialization, không muốn trả tiền giữ capacity luôn nóng. **Lambda SnapStart** tối ưu khởi động cho các runtime/phiên bản được hỗ trợ bằng cách tạo snapshot môi trường thực thi đã khởi tạo và khôi phục từ snapshot khi cần. SnapStart cần publish version và gọi version/alias phù hợp; phải kiểm tra runtime, Region, tính tương thích initialization và không lưu trạng thái/secret có thể lỗi thời trong snapshot.

**Vì sao đúng:** A có thể giảm phần initialization trong cold start mà không cần duy trì provisioned concurrency liên tục.
**Vì sao phương án khác sai:**
- B Provisioned concurrency giữ môi trường sẵn sàng nhưng trả phí cho capacity đã provision, không kinh tế với traffic thưa nếu giữ cả ngày.
- C EC2 chạy thường trực tạo vận hành/chi phí idle và không còn serverless.
- D tăng timeout không làm request bắt đầu nhanh hơn; chỉ cho phép request chờ lâu hơn.

> Exam tip: với Java cold start, đo trước và kiểm tra runtime hỗ trợ SnapStart; provisioned concurrency phù hợp khi cần latency thấp ổn định theo traffic dự đoán được.`,
  services: ['AWS Lambda'],
},
{
  id: 'sap-196', exam: 'sap-c02', domain: 'sap-d2',
  q: `A company is building a globally distributed application that stores user preferences in Amazon DynamoDB. Users must read and write in the Region closest to them, and the application must continue serving local reads and writes if one Region is disconnected. The team accepts eventual consistency between Regions and wants AWS to replicate table changes automatically. Which combination of steps should the company take? (Choose two.)`,
  options: [
    "Create a DynamoDB global table with replicas in the required Regions.",
    "Configure each regional application to read and write to its local replica and account for eventual replication.",
    "Use a single-Region DynamoDB table and route all writes to it through Amazon CloudFront.",
    "Create independent DynamoDB tables in each Region and reconcile the records manually every night.",
    "Use an Amazon RDS Multi-AZ deployment because it automatically provides active-active writes across Regions."
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Từ khóa:** người dùng đọc/ghi tại Region gần nhất, tiếp tục thao tác local khi Region khác mất kết nối, chấp nhận eventual consistency và muốn replication tự động. **DynamoDB global tables** duy trì replica tables ở nhiều Region và tự đồng bộ thay đổi; ứng dụng nên gọi replica tại Region của nó. Global tables là multi-Region active-active nhưng xung đột ghi cùng item cần được hiểu theo cơ chế giải quyết của dịch vụ; eventual replication nghĩa là các Region có thể tạm thời thấy giá trị khác nhau.

**Vì sao A và B đúng:** global table tạo replica được đồng bộ tự động; ứng dụng kết nối replica cùng Region để phục vụ local access và chấp nhận độ trễ replication.
**Vì sao phương án khác sai:**
- C vẫn tập trung mọi ghi vào một Region, tạo latency và điểm phụ thuộc liên vùng; CloudFront không biến DynamoDB thành multi-Region database.
- D yêu cầu tự đồng bộ và xử lý conflict, đi ngược mong muốn managed replication.
- E RDS Multi-AZ chủ yếu cung cấp HA trong một Region; không tự tạo active-active multi-Region writes như global tables.

> Exam tip: global tables tăng khả năng phục vụ local ở nhiều Region, nhưng cần thiết kế idempotency/conflict và không mặc định strong consistency xuyên Region.`,
  services: ['Amazon DynamoDB', 'Amazon CloudFront', 'Amazon RDS'],
},
);
