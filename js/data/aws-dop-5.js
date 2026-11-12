/* AWS Pro track: exam-style questions (docs/AWS-TRACK.md), file 5 of dop-c02. */
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'dop-159',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs a web application in us-east-1 and eu-west-1 behind Application Load Balancers. It wants users to be served from the closest Region and to fail over automatically to the other Region if an entire Region becomes unhealthy, with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Route 53 latency-based alias records to both ALBs without health checks',
    'Route 53 geolocation routing records to both ALBs',
    'Route 53 multivalue answer routing to both ALB DNS names',
    'AWS Global Accelerator with one endpoint group per Region, health checks, and failover enabled'
  ],
  answer: 3,
  explain: `**Tóm tắt:** Dùng AWS Global Accelerator với một endpoint group ở mỗi Region, bật health check và failover để định tuyến người dùng đến vùng gần nhất và tự chuyển sang vùng khỏe khi toàn bộ một vùng bị sự cố, với vận hành ít nhất.

Vì sao đáp án D đúng: Global Accelerator cung cấp địa chỉ IP anycast cố định, định tuyến truy cập đến endpoint khỏe nhất dựa trên sức khỏe và khoảng cách, failover tự động trong vài giây khi một vùng mất kết nối, không cần quản lý nhiều bản ghi Route 53 phức tạp.

Vì sao các đáp án sai:
A: latency-based alias không có health check không thể phát hiện vùng chết và không tự failover khi vùng xuống.
B: geolocation routing định tuyến theo vị trí địa lý của người dùng, không theo sức khỏe vùng, không tự chuyển khi vùng lỗi.
C: multivalue answer trả về nhiều IP mà không kiểm tra sức khỏe sâu, không đảm bảo failover toàn vùng.

> Exam tip: Khi đề hỏi "least operational overhead" cho multi-Region active/active, Global Accelerator thường ưu thế hơn Route 53 failover phức tạp.`,
  services: ['AWS Global Accelerator', 'Elastic Load Balancing', 'Amazon Route 53']
},
{
  id: 'dop-160',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A developer accidentally deleted a DynamoDB table containing production data. The company must restore the table to its state five hours ago with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Restore from the most recent on-demand backup taken last night',
    'Use DynamoDB point-in-time recovery to restore to a specific timestamp',
    'Use AWS Backup to recover the latest recovery point',
    'Replay Amazon DynamoDB Streams to rebuild the table'
  ],
  answer: 1,
  explain: `**Tóm tắt:** DynamoDB point-in-time recovery (PITR) cho phép khôi phục bảng về bất kỳ thời điểm nào trong vòng 35 ngày, có độ chính xác đến giây, phù hợp khôi phục lại trạng thái năm giờ trước với ít vận hành nhất.

Vì sao đáp án B đúng: PITR đã được bật trước đó (hoặc công ty bật chủ động) cho phép restore lại bảng mới tại thời điểm trước khi bị xóa, dữ liệu gần như không mất, không cần quản lý bản sao lưu thủ công.

Vì sao các đáp án sai:
A: bản backup hôm qua chỉ khôi phục được đến tối hôm qua, mất khoảng mười ngàn giờ dữ liệu.
C: AWS Backup recovery point thường là bản sao lưu định kỳ, không khôi phục được chính xác năm giờ trước trừ khi có recovery point đúng lúc đó.
D: DynamoDB Streams chỉ ghi lại thay đổi mới sau khi bật, không dùng để khôi phục dữ liệu đã bị xóa trước đó.

> Exam tip: PITR phải được bật trước sự cố; khi đọc đề hãy tìm từ khoá "khôi phục đến thời điểm cụ thể" hoặc "gần như không mất dữ liệu" để chọn PITR.`,
  services: ['Amazon DynamoDB']
},
{
  id: 'dop-161',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company has cross-region replication (CRR) enabled from an S3 bucket in us-east-1 to a bucket in us-west-2, but objects uploaded before CRR was enabled are missing in the destination bucket. The company needs to replicate these existing objects with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Run an S3 Batch Operations job with S3 Batch Operations replication to replicate existing objects',
    'Use AWS DataSync to copy objects between the two buckets',
    'Write a custom script using AWS CLI to list and copy each object',
    'Use S3 Inventory to list objects and AWS Lambda to copy them one by one'
  ],
  answer: 0,
  explain: `**Tóm tắt:** S3 Batch Operations replication được thiết kế riêng để sao chép các đối tượng đã tồn tại trong nguồn sang vùng đích khi CRR chỉ複製 các đối tượng mới tải lên sau khi bật.

Vì sao đáp án A đúng: S3 Batch Operations replication có thể quét toàn bộ bucket nguồn và replicate các đối tượng cũ lên bucket đích, thao tác ít nhất, không cần viết script hay quản lý trung gian.

Vì sao các đáp án sai:
B: AWS DataSync dùng cho di chuyển dữ liệu giữa storage khác nhau hoặc trên-premises, phức tạp hơn và tốn kém hơn cho trường hợp replicate trong S3.
C: script CLI tự viết đòi hỏi quản lý vòng lặp, lỗi, thử lại và giám sát, vận hành cao.
D: S3 Inventory liệt kê đối tượng nhưng Lambda sao chép từng cái khó quản lý và tốn nhiều lời gọi.

> Exam tip: CRR chỉ replicate đối tượng mới upload sau khi cấu hình; đối tượng cũ phải dùng S3 Batch Operations replication để xử lý lại.`,
  services: ['Amazon S3']
},
{
  id: 'dop-162',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs a critical database on Amazon RDS for PostgreSQL in a single Availability Zone. It wants to improve resilience against an Availability Zone failure with the least operational overhead. Which two actions should it take? (Choose two.)`,
  options: [
    'Convert the DB instance to a Multi-AZ deployment',
    'Create a read replica in a different Availability Zone and promote it on failure',
    'Keep the DB instance in a single Availability Zone and take daily manual snapshots',
    'Enable automated backups with a retention period of one day',
    'Deploy the DB instance to two separate Regions using Amazon RDS'
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** Để chịu được sự cố một Availability Zone, cần chạy database trên nhiều AZ (Multi-AZ) và có một read replica ở AZ khác để nâng lên làm primary khi cần, thay vì chỉ dựa vào bản sao lưu hàng ngày.

Vì sao đáp án A và B đúng: Multi-AZ duy trì một replicaスタンby đồng bộ ở AZ khác, failover tự động khi AZ chính lỗi. Read replica ở AZ khác có thể được promote thủ công làm primary, phục vụ trường hợp cần khôi phục nhanh.

Vì sao các đáp án sai:
C: snapshot thủ công hàng ngày chỉ khôi phục được đến thời điểm chụp, mất dữ liệu trong ngày và không tự failover.
D: automated backup một ngày giúp khôi phục thời điểm nhưng không tự động chuyển sang AZ khác khi AZ hiện tại lỗi.
E: chạy tại hai Region là giải pháp multi-Region, phức tạp và tốn kém, vượt quá yêu cầu "least operational overhead" cho vấn đề một AZ.

> Exam tip: "khả kháng sự cố một AZ" trỏ về Multi-AZ hoặc read replica ở AZ khác; "khả kháng toàn vùng" mới trỏ về multi-Region.`,
  services: ['Amazon RDS']
},
{
  id: 'dop-163',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A Java application runs on AWS Lambda and experiences cold starts of several seconds on infrequent invocations, affecting user experience. The company wants to reduce startup latency with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Configure provisioned concurrency on the Lambda function',
    'Increase the memory allocation of the Lambda function',
    'Move the application to Amazon EC2 with Auto Scaling',
    'Use Amazon API Gateway caching in front of the Lambda function'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Provisioned concurrency giữ khởi tạo trước một số môi trường thực thi của Lambda, giảm thời gian phản hồi dưới mili giây cho các lần gọi ít xảy ra, với ít vận hành nhất.

Vì sao đáp án A đúng: Provisioned concurrency khởi tạo sẵn môi trường chạy nên latency gần như không có, phù hợp ứng dụng nhạy cảm với thời gian phản hồi.

Vì sao các đáp án sai:
B: tăng bộ nhớ làm tăng CPU nhưng vẫn không loại bỏ hoàn toàn cold start khi hàm chưa được dùng.
C: chuyển sang EC2 Auto Scaling tăng vận hành quản lý máy chủ, vượt quá yêu cầu ít vận hành nhất.
D: API Gateway cache chỉ giúp các yêu cầu trùng nhau, không giúp cold start của lần đầu tiên hoặc dữ liệu mới.

> Exam tip: "giảm cold start" trên Lambda với ít vận hành nhất trỏ thẳng về provisioned concurrency.`,
  services: ['AWS Lambda', 'Amazon API Gateway']
},
{
  id: 'dop-164',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs a batch processing application on Amazon EC2 instances in an Auto Scaling group using Spot Instances. Spot Instances are frequently reclaimed with a two-minute interruption notice, causing jobs to fail. The company wants to make the application more resilient to Spot interruptions with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Use an Auto Scaling mixed instances policy with On-Demand base capacity and capacity rebalancing enabled',
    'Purchase Scheduled Reserved Instances for the batch workload',
    'Move the batch jobs to AWS Lambda with provisioned concurrency',
    'Use Amazon EBS-optimized instances with larger root volumes'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Auto Scaling mixed instances policy kết hợp On-Demand làm phần cố định (base) và Spot cho phần còn lại, cùng capacity rebalancing giúp thay thế biến instance trước khi Spot bị thu hồi, ít vận hành nhất.

Vì sao đáp án A đúng: mixed instances policy cho chạy linh hoạt On-Demand + Spot, capacity rebalancing chủ động khởi tạo instance mới khi nhận tín hiệu rebalance, giảm thất bại do Spot bị thu hồi.

Vì sao các đáp án sai:
B: Scheduled Reserved Instances đã bị Playback, không còn là lựa chọn hiện đại và không linh hoạt với Spot.
C: Lambda không phù hợp xử lý batch dài hạn và có giới hạn thời gian chạy.
D: EBS-optimized và ổ根 lớn hơn không ngăn việc instance bị thu hồi, job vẫn thất bại.

> Exam tip: Spot bị thu hồi với thông báo hai phút trỏ về mixed instances policy + capacity rebalancing trong Auto Scaling.`,
  services: ['Amazon EC2 Auto Scaling', 'Amazon EC2']
},
{
  id: 'dop-165',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs an application in a single AWS Region across three Availability Zones. It wants to automatically shift traffic away from an Availability Zone that is experiencing infrastructure issues, with the least operational overhead. Which two actions should it take? (Choose two.)`,
  options: [
    'Use Route 53 Application Recovery Controller zonal shift to shift traffic away from the impaired Availability Zone',
    'Use Route 53 Application Recovery Controller zonal autoshift to automatically shift traffic based on health checks',
    'Create a separate Route 53 record for each Availability Zone and update them manually during an event',
    'Use an Application Load Balancer in each Availability Zone without cross-zone load balancing disabled',
    'Use Amazon Route 53 latency routing records pointing to each Availability Zone'
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** Route 53 Application Recovery Controller (ARC) zonal shift và zonal autoshift cho phép chuyển lưu lượng khỏi một Availability Zone bị sự cố tự động hoặc theo yêu cầu, ít vận hành nhất.

Vì sao đáp án A và B đúng: zonal shift cho phép thủ công gỡ một AZ khỏi truy cập; zonal autoshift tự động gỡ dựa trên health check của Application Load Balancer, giúp chịu được sự cố AZ.

Vì sao các đáp án sai:
C: cập nhật bản ghi thủ công chậm và dễ sai, không phù hợp sự cố cần phản hồi nhanh.
D: ALB trong mỗi AZ vẫn cần cross-zone load balancing được cấu hình đúng, không tự động gỡ toàn bộ AZ khi lỗi hạ tầng.
E: latency routing ở cấp Region, không dùng để gỡ một AZ cụ thể trong cùng một Region.

> Exam tip: Zonal shift/autoshift của ARC là công cụ để chịu lỗi AZ trong một Region, không phải failover giữa Region.`,
  services: ['Amazon Route 53 Application Recovery Controller', 'Elastic Load Balancing']
},
{
  id: 'dop-166',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company stores critical documents in an Amazon S3 bucket. It wants to protect objects from accidental deletion or overwriting by any user, including administrators, with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Enable S3 versioning and MFA Delete on the bucket',
    'Use S3 Object Lock in compliance mode for all new objects',
    'Apply an S3 bucket policy that denies s3:DeleteObject to all principals',
    'Use S3 Lifecycle to expire objects after one year'
  ],
  answer: 0,
  explain: `**Tóm tắt:** S3 versioning giữ lại mọi phiên bản của đối tượng, và MFA Delete yêu cầu mã xác thực đa yếu tố trước khi xóa vĩnh viễn phiên bản hoặc thay đổi trạng thái versioning, bảo vệ trước cả người quản trị.

Vì sao đáp án A đúng: versioning + MFA Delete cho phép khôi phục đối tượng bị xóa nhầm và chặn xóa vĩnh viễn mà không cần MFA, ít vận hành nhất.

Vì sao các đáp án sai:
B: Object Lock compliance mode cực kỳ khắt khe, không thể xóa hoặc thay đổi ngay cả bởi root tài khoản trong thời gian giữ, không phù hợp "least operational overhead" và khó quản lý.
C: bucket policy Deny s3:DeleteObject có thể bị bỏ qua bởi root tài khoản hoặc S3 resource policy, không bảo vệ tuyệt đối.
D: Lifecycle expiration tự động xóa đối tượng sau thời gian, không bảo vệ trước xóa nhầm theo ý muốn.

> Exam tip: Muốn bảo vệ đối tượng khỏi xóa ghi đè nhầm mà vẫn khôi phục được, hãy bật S3 versioning kết hợp MFA Delete.`,
  services: ['Amazon S3']
},
{
  id: 'dop-167',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs an Amazon Aurora MySQL database in us-east-1 and needs a readable copy in eu-west-1 with a recovery point objective of less than one second. It wants to fail over to the secondary Region quickly in case of a Regional outage. Which solution meets these requirements?`,
  options: [
    'Create an Aurora Global Database with a secondary cluster in eu-west-1',
    'Create an Aurora read replica in eu-west-1 and promote it manually',
    'Use AWS Backup to copy automated snapshots to eu-west-1 daily',
    'Use Amazon RDS Multi-AZ deployment with a standby in eu-west-1'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Aurora Global Database replicate dữ liệu từ vùng chính sang vùng phụ với độ trễ thường dưới một giây, cho phép failover vùng phụ lên làm primary nhanh khi toàn vùng chính bị sự cố.

Vì sao đáp án A đúng: Aurora Global Database dùng storage-based replication nhanh, RPO dưới một giây, và failover vùng phụ trong khoảng một phút, phù hợp yêu cầu.

Vì sao các đáp án sai:
B: Aurora read replica cross-Region có độ trễ cao hơn và phải promote thủ công, không đảm bảo RPO dưới một giây.
C: AWS Backup chụp hình hàng ngày không thể khôi phục đến một giây và restore mất nhiều thời gian.
D: RDS Multi-AZ chỉ chạy trong một Region, không tạo bản sao ở vùng khác để failover vùng.

> Exam tip: "RPO dưới một giây" + "failover Region khác" trỏ về Aurora Global Database, không phải read replica thông thường hay Multi-AZ.`,
  services: ['Amazon Aurora', 'Amazon RDS']
},
{
  id: 'dop-168',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A DevOps engineer needs to investigate a spike in errors reported by an application. The application writes JSON logs to Amazon CloudWatch Logs. The engineer wants to query the logs interactively and create a metric from the query results to alarm on future error spikes. Which solution meets these requirements?`,
  options: [
    'Use CloudWatch Logs Insights to query the logs, then create a metric filter based on the query results',
    'Use CloudWatch Logs Insights to query the logs, then create a CloudWatch alarm based on the query results',
    'Export the logs to Amazon S3 and query them with Amazon Athena',
    'Stream the logs to Amazon OpenSearch Service and visualize them in OpenSearch Dashboards'
  ],
  answer: 1,
  explain: `**Tóm tắt:** CloudWatch Logs Insights cho phép truy vấn tương tác nhật ký JSON, và có thể tạo báo thức CloudWatch từ kết quả truy vấn Insights để cảnh báo khi lỗi tăng trong tương lai.

Vì sao đáp án B đúng: Insights chạy truy vấn tương tác; sau đó tạo alarm dựa trên kết quả truy vấn giúp theo dõi liên tục và cảnh báo tự động.

Vì sao các đáp án sai:
A: metric filter dùng mẫu khi nhận nhật ký mới, không dựa trên kết quả truy vấn Insights tương tác.
C: xuất ra S3 và Athena phù hợp phân tích lịch sử lớn, không phải truy vấn tương tác nhanh để cảnh báo.
D: OpenSearch Service phức tạp và tốn kém hơn, vượt quá yêu cầu ít vận hành nhất.

> Exam tip: "truy vấn tương tác nhật ký + báo thức từ kết quả truy vấn" trỏ về CloudWatch Logs Insights kết hợp CloudWatch alarm.`,
  services: ['Amazon CloudWatch Logs', 'Amazon CloudWatch']
},
{
  id: 'dop-169',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company wants to monitor the availability and latency of its public web application from multiple geographic locations outside AWS. It wants to be alerted when the application is unreachable or slow from any of these locations. Which solution meets these requirements?`,
  options: [
    'Use Amazon CloudWatch Synthetics canaries to run checks from multiple locations and create alarms',
    'Use Amazon CloudWatch alarms on Application Load Balancer metrics',
    'Use Amazon Route 53 health checks to monitor the application endpoint',
    'Use AWS X-Ray to trace requests from users to the application'
  ],
  answer: 0,
  explain: `**Tóm tắt:** CloudWatch Synthetics canaries mô ph hiện hành động người dùng từ nhiều địa điểm bên ngoài AWS, kiểm tra sẵn sàng và độ trễ, rồi tạo báo thức khi ứng dụng không phản hồi hoặc chậm.

Vì sao đáp án A đúng: canary chạy định kỳ từ các vị trí khác nhau, phát hiện sớm sự cố kết nối hoặc chậm từ phía người dùng ngoài AWS.

Vì sao các đáp án sai:
B: alarm trên ALB chỉ theo dõi trạng thái bên trong AWS, không thể biết người dùng bên ngoài có truy cập được hay không.
C: Route 53 health check theo dõi điểm cuối nhưng không đo độ trải nghiệm từ nhiều địa điểm địa lý và không cảnh báo chậm chi tiết.
D: X-Ray theo dõi yêu cầu bên trong ứng dụng, không giám sát sẵn sàng từ bên ngoài AWS.

> Exam tip: "giám sát từ nhiều địa điểm bên ngoài AWS" trỏ về CloudWatch Synthetics canary.`,
  services: ['Amazon CloudWatch Synthetics', 'Amazon CloudWatch']
},
{
  id: 'dop-170',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company must maintain a reliable record of every GetObject and DeleteObject request made against objects under a specific prefix in an Amazon S3 bucket for auditors. Which two actions should it take? (Choose two.)`,
  options: [
    'Configure AWS CloudTrail to log data events for the S3 bucket and prefix',
    'Enable Amazon S3 server access logging for the bucket',
    'Use Amazon S3 Object Lock to protect the objects',
    'Use Amazon S3 bucket policies to deny unauthorized access',
    'Configure AWS Config to record changes to the S3 bucket'
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** Để ghi lại mọi yêu cầu GetObject và DeleteObject theo prefix, cần bật CloudTrail data events cho bucket và tiền tố, đồng thời dùng S3 server access logging làm bằng chứng bổ sung cho các yêu cầu lưu trữ.

Vì sao đáp án A và B đúng: CloudTrail data events ghi chi tiết từng cuộc gọi API GetObject/DeleteObject; S3 server access logging ghi lại mọi yêu cầu truy cập bucket, làm bằng chứng kiểm toán.

Vì sao các đáp án sai:
C: Object Lock bảo vệ đối tượng khỏi xóa, không ghi nhật ký yêu cầu.
D: bucket policy chặn truy cập trái phép, không ghi nhật ký cho kiểm toán.
E: AWS Config ghi lại thay đổi cấu hình bucket, không ghi từng yêu cầu GetObject/DeleteObject.

> Exam tip: "ghi lại mọi yêu cầu GetObject và DeleteObject" trỏ về CloudTrail data events, thường kết hợp S3 server access logging để bổ sung bằng chứng.`,
  services: ['AWS CloudTrail', 'Amazon S3']
},
{
  id: 'dop-171',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company wants to capture information about IP traffic reaching and leaving Amazon EC2 instances in a VPC, then analyze the data using standard SQL queries with minimal effort. Which solution meets these requirements?`,
  options: [
    'Publish VPC Flow Logs to Amazon S3 and query with Amazon Athena',
    'Publish VPC Flow Logs to Amazon CloudWatch Logs and use CloudWatch Logs Insights',
    'Publish VPC Flow Logs to Amazon Kinesis Data Firehose and load into Amazon Redshift',
    'Use AWS CloudTrail to record network traffic and query with Amazon Athena'
  ],
  answer: 0,
  explain: `**Tóm tắt:** VPC Flow Logs lưu thông tin lưu lượng IP đi vào và ra ENI; xuất ra S3 rồi dùng Amazon Athena truy vấn bằng SQL chuẩn là cách ít công sức nhất.

Vì sao đáp án A đúng: Flow Logs đến S3, Athena truy vấn trực tiếp trên files trong S3 bằng SQL, không cần quản lý dịch vụ trung gian.

Vì sao các đáp án sai:
B: CloudWatch Logs Insights dùng ngôn ngữ truy vấn riêng, không phải SQL chuẩn.
C: Kinesis Firehose tải vào Redshift phức tạp và tốn kém hơn cho yêu cầu đơn giản.
D: CloudTrail ghi gọi API quản trị, không ghi lưu lượng mạng IP giữa các instance.

> Exam tip: "thông tin lưu lượng IP vào ra EC2 trong VPC" trỏ về VPC Flow Logs; "truy vấn SQL chuẩn ít công sức" trỏ về S3 + Athena.`,
  services: ['Amazon VPC', 'Amazon Athena', 'Amazon S3']
},
{
  id: 'dop-172',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company wants to detect and respond to specific patterns in application logs in near real time. Application logs are written to Amazon CloudWatch Logs. The company wants to trigger an AWS Lambda function when a log line matches a certain pattern. Which solution meets these requirements?`,
  options: [
    'Create a CloudWatch Logs subscription filter that invokes an AWS Lambda function',
    'Use CloudWatch Logs Insights to query logs periodically and invoke Lambda',
    'Export logs to Amazon S3 and use Amazon S3 event notifications to invoke Lambda',
    'Use AWS CloudTrail to inspect logs and invoke Lambda on matching events'
  ],
  answer: 0,
  explain: `**Tóm tắt:** CloudWatch Logs subscription filter Stream nhật ký khớp mẫu gần thời gian thực đến AWS Lambda để xử lý phản ứng ngay.

Vì sao đáp án A đúng: subscription filter gắn trực tiếp vào log group, gửi sự kiện khớp mẫu tới Lambda gần thời gian thực, ít vận hành nhất.

Vì sao các đáp án sai:
B: Insights dùng để truy vấn theo lịch, không kích hoạt Lambda ngay khi có dòng nhật ký mới khớp.
C: xuất ra S3 rồi sự kiện bucket có độ trễ cao, không phù hợp gần thời gian thực.
D: CloudTrail ghi sự kiện quản trị AWS, không dùng để quét nội dung log ứng dụng.

> Exam tip: "kích hoạt Lambda khi dòng nhật ký khớp mẫu gần thời gian thực" trỏ về CloudWatch Logs subscription filter.`,
  services: ['Amazon CloudWatch Logs', 'AWS Lambda']
},
{
  id: 'dop-173',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A platform team operates a central monitoring AWS account. Application teams own many workload accounts in AWS Organizations. The team wants to view CloudWatch metrics and logs from all workload accounts in the central account without deploying agents. Which solution meets these requirements?`,
  options: [
    'Use CloudWatch cross-account observability to link the workload accounts as source accounts to the central monitoring account',
    'Use AWS CloudFormation StackSets to deploy a CloudWatch agent to every workload account',
    'Use Amazon EventBridge to forward all CloudWatch metrics from workload accounts to the central account',
    'Use AWS Systems Manager to collect metrics from every workload account into the central account'
  ],
  answer: 0,
  explain: `**Tóm tắt:** CloudWatch cross-account observability cho phép tài khoản giám sát trung tâm xem các chỉ số và nhật ký từ nhiều tài khoản nguồn, không cần cài agent trên từng tài khoản.

Vì sao đáp án A đúng: liên kết các tài khoản workload làm source với tài khoản trung tâm, xem toàn bộ trong một bảng điều khiển, ít vận hành nhất.

Vì sao các đáp án sai:
B: StackSets cài agent vào mọi tài khoản tăng vận hành và không cần thiết cho chỉ số CloudWatch.
C: EventBridge chuyển sự kiện, không dùng để tổng hợp chỉ số và nhật ký CloudWatch giữa các tài khoản.
D: Systems Manager thu thập dữ liệu vận hành, không phải giải pháp tập trung chỉ số CloudWatch nhiều tài khoản.

> Exam tip: "xem chỉ số và nhật ký từ nhiều tài khoản trong tài khoản trung tâm, không cài agent" trỏ về CloudWatch cross-account observability.`,
  services: ['Amazon CloudWatch', 'AWS Organizations']
},
{
  id: 'dop-174',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company uses Amazon EventBridge rules to route events to AWS Lambda functions. It wants to retain events that fail delivery after all retry attempts and replay them later for analysis. Which two actions should it take? (Choose two.)`,
  options: [
    'Configure an EventBridge archive to store events',
    'Configure a dead-letter queue on the EventBridge rule',
    'Replay events from the EventBridge archive',
    'Use AWS Step Functions to orchestrate the event delivery',
    'Use Amazon SNS to buffer failed events'
  ],
  answer: [0, 2],
  multi: true,
  explain: `**Tóm tắt:** EventBridge archive lưu trữ sự kiện đã gửi, và tính năng replay cho phép phát lại các sự kiện đã lưu từ archive để phân tích lại sau khi thất bại.

Vì sao đáp án A và C đúng: archive giữ lại sự kiện; replay lấy các sự kiện từ archive gửi lại mục tiêu, phục vụ phân tích lại sau sự cố.

Vì sao các đáp án sai:
B: EventBridge rule không có dead-letter queue trực tiếp; thất bại gửi có thể sử dụng destination trên rule, không phải DLQ dạng này.
D: Step Functions điều phối luồng làm việc, không lưu trữ và phát lại sự kiện EventBridge.
E: SNS dùng làm đích gửi thông báo, không lưu trữ sự kiện EventBridge để phát lại.

> Exam tip: "giữ sự kiện thất bại và phát lại sau này" trỏ về EventBridge archive kết hợp tính năng replay.`,
  services: ['Amazon EventBridge']
},
{
  id: 'dop-175',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company wants to identify which resources in its AWS environment are contributing most to spikes in Amazon CloudWatch metrics, such as CPU utilization, without instrumenting application code. Which solution meets these requirements?`,
  options: [
    'Use Amazon CloudWatch Contributor Insights to analyze log patterns and identify top contributors',
    'Use Amazon CloudWatch alarms to notify when CPU utilization exceeds a threshold',
    'Use AWS X-Ray to trace application requests and find slow components',
    'Use Amazon CloudWatch Logs Insights to query logs for CPU usage'
  ],
  answer: 0,
  explain: `**Tóm tắt:** CloudWatch Contributor Insights phân tích mẫu trong nhật ký để xác định các tài nguyên chịu trách nhiệm lớn nhất đối với sự gia tăng chỉ số, không cần đo fine mã ứng dụng.

Vì sao đáp án A đúng: Contributor Insights quy định rule trên log group, liệt kê top contributor (ví dụ instance, host) gây ra spikes CPU, ít vận hành nhất.

Vì sao các đáp án sai:
B: alarm chỉ thông báo khi vượt ngưỡng, không cho biết tài nguyên nào gây ra sự gia tăng.
C: X-Ray theo dõi yêu cầu ứng dụng, cần instrument mã và không trực quan hóa contributor của chỉ số CloudWatch.
D: Logs Insights truy vấn nhật ký nhưng không tự động xác định top contributor gây spikes chỉ số.

> Exam tip: "xác định tài nguyên nào gây spikes chỉ số mà không sửa mã" trỏ về CloudWatch Contributor Insights.`,
  services: ['Amazon CloudWatch']
},
{
  id: 'dop-176',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company runs hundreds of Amazon EC2 instances and wants a dashboard widget that shows the number of instances in each state (running, stopped, stopping, terminated) without writing custom queries. Which solution meets these requirements?`,
  options: [
    'Use Amazon CloudWatch built-in metrics for EC2 instance state with a count widget',
    'Use AWS Systems Manager Inventory to aggregate instance states into a dashboard',
    'Use AWS Config to record instance state changes and view in the Config dashboard',
    'Use Amazon EventBridge to count instance state-change events in real time'
  ],
  answer: 1,
  explain: `**Tóm tắt:** AWS Systems Manager Inventory thu thập và tổng hợp trạng thái của hàng trăm instance (running, stopped, stopping, terminated) và hiển thị trên bảng điều khiển mà không cần viết truy vấn riêng.

Vì sao đáp án B đúng: Inventory tự động thu thập trạng thái instance từ SSM Agent, tổng hợp và hiển thị widget, ít vận hành nhất.

Vì sao các đáp án sai:
A: CloudWatch chỉ số EC2 không có chỉ số built-in đếm số lượng instance theo từng trạng thái trên widget đơn giản.
C: AWS Config ghi thay đổi trạng thái nhưng không cung cấp widget đếm số instance theo trạng thái ngay lập tức.
D: EventBridge đếm sự kiện thay đổi trạng thái theo thời gian thực phức tạp hơn và không tổng hợp số liệu trạng thái hiện tại.

> Exam tip: "bảng điều khiển hiển thị số instance theo trạng thái không viết truy vấn" trỏ về AWS Systems Manager Inventory.`,
  services: ['AWS Systems Manager', 'Amazon EC2']
},
{
  id: 'dop-177',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company receives AWS Health notifications about scheduled maintenance, such as EC2 instance retirement. It wants to automatically respond to these events by running an AWS Systems Manager Automation document to reboot or replace affected instances with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Create an Amazon EventBridge rule that matches AWS Health events and triggers an AWS Systems Manager Automation document',
    'Use AWS Health Dashboard to manually run the Automation document for each event',
    'Use Amazon CloudWatch alarms to monitor instance health and trigger the Automation document',
    'Use AWS Trusted Advisor to detect instances needing maintenance and trigger the Automation document'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Amazon EventBridge có thể khớp các sự kiện AWS Health (ví dụ EC2 retirement) và khởi chạy AWS Systems Manager Automation document để khởi động lại hoặc thay thế instance bị ảnh hưởng, ít vận hành nhất.

Vì sao đáp án A đúng: EventBridge rule lắng nghe sự kiện Health, gọi Automation document tự động xử lý instance, không cần can thiệp thủ công.

Vì sao các đáp án sai:
B: AWS Health Dashboard cần người dùng theo dõi và chạy thủ công, vận hành cao.
C: CloudWatch alarm theo dõi chỉ số instance, không nhận thông báo bảo trì dự định từ AWS Health.
D: Trusted Advisor đưa khuyến nghị tối ưu hóa, không phản hồi sự kiện bảo trì AWS Health tự động.

> Exam tip: "phản hồi sự kiện AWS Health tự động" trỏ về EventBridge + Systems Manager Automation.`,
  services: ['AWS Health', 'Amazon EventBridge', 'AWS Systems Manager']
},
{
  id: 'dop-178',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company runs a web application on Amazon EC2 instances. When a CloudWatch alarm fires indicating high CPU, the company wants to automatically stop the affected instance and notify the operations team using Amazon SNS with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Use the CloudWatch alarm to trigger an AWS Lambda function that stops the instance and publishes to an SNS topic',
    'Use AWS Systems Manager State Manager to stop instances when CPU is high',
    'Use Amazon EventBridge to schedule a check of CPU and stop instances',
    'Use Amazon CloudWatch Logs to monitor CPU and stop instances manually'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Báo thức CloudWatch có thể gọi AWS Lambda khi CPU cao; Lambda dừng instance bị ảnh hưởng và xuất thông báo qua chủ đề Amazon SNS cho đội vận hành, ít vận hành nhất.

Vì sao đáp án A đúng: alarm trực tiếp kích hoạt Lambda, Lambda thực hiện hành động khắc phục và gửi thông báo SNS, toàn bộ tự động.

Vì sao các đáp án sai:
B: State Manager áp dụng cấu hình theo định kỳ, không phản hồi ngay báo thức CloudWatch CPU cao.
C: EventBridge theo lịch kiểm tra CPU không hiệu quả và không dùng báo thức hiện có.
D: CloudWatch Logs theo dõi nhật ký, không tự động dừng instance dựa trên chỉ số CPU.

> Exam tip: "báo thức CloudWatch tự động khắc phục và thông báo" trỏ về CloudWatch alarm gọi Lambda rồi publish SNS.`,
  services: ['Amazon CloudWatch', 'AWS Lambda', 'Amazon SNS']
},
{
  id: 'dop-179',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company uses Amazon EventBridge rules to send order events to an AWS Lambda function. During a downstream database outage, the Lambda function fails repeatedly. The company wants to retain the failed events for later reprocessing and configure how many times EventBridge retries delivery. Which two actions should it take? (Choose two.)`,
  options: [
    'Configure a dead-letter queue on the EventBridge rule for failed events',
    'Configure the retry policy on the EventBridge rule to control delivery attempts',
    'Use an Amazon SQS queue as the direct target instead of Lambda',
    'Use Amazon SNS to fan out events to multiple Lambda functions',
    'Use AWS Step Functions to manage retries for the Lambda function'
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** EventBridge rule hỗ trợ dead-letter queue giữ sự kiện gửi thất bại sau mọi lần thử lại, và retry policy cho phép điều chỉnh số lần EventBridge thử gửi lại sự kiện.

Vì sao đáp án A và B đúng: DLQ giữ sự kiện thất bại để xử lý lại sau; retry policy kiểm soát số lần thử lại trước khi chuyển sang DLQ.

Vì sao các đáp án sai:
C: dùng SQS làm đích trực tiếp thay đổi kiến trúc, không phải cấu hình lại EventBridge rule hiện có.
D: SNS fan-out gửi sự kiện đến nhiều đích, không giữ sự kiện thất bại của Lambda.
E: Step Functions điều phối luồng, không quản lý lại việc EventBridge gửi sự kiện tới Lambda.

> Exam tip: "giữ sự kiện thất bại và kiểm soát số lần thử lại" trên EventBridge rule trỏ về DLQ và retry policy.`,
  services: ['Amazon EventBridge', 'AWS Lambda', 'Amazon SQS']
},
{
  id: 'dop-180',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `An AWS Lambda function is invoked asynchronously to process uploaded images. When processing fails after all retry attempts, the company wants to send the failed invocation event to an Amazon SQS queue for later analysis without changing the invocation logic. Which solution meets these requirements?`,
  options: [
    'Configure an asynchronous invocation destination on the Lambda function to send failed events to an SQS queue',
    'Configure an Amazon S3 event notification to send failed events to SQS',
    'Use AWS X-Ray to trace failed invocations and send them to SQS',
    'Use Amazon EventBridge to capture Lambda failures and send them to SQS'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Lambda asynchronous invocation destination có thể gửi sự kiện gọi thất bại (và thành công) đến một đích như Amazon SQS_queue mà không cần thay đổi mã gọi hàm.

Vì sao đáp án A đúng: destination trên cấu hình gọi bất đồng bộ gửi sự kiện thất bại vào SQS để phân tích sau, ít vận hành nhất.

Vì sao các đáp án sai:
B: S3 event notification gửi khi đối tượng được tạo, không dùng để gửi sự kiện gọi Lambda thất bại.
C: X-Ray theo vết yêu cầu, không gửi sự kiện gọi thất bại đến SQS tự động.
D: EventBridge có thể thu thập sự kiện Lambda nhưng phức tạp hơn và không phải destination trực tiếp của gọi bất đồng bộ.

> Exam tip: "gửi sự kiện gọi Lambda thất bại sau mọi lần thử lại" trỏ về asynchronous invocation destination của Lambda.`,
  services: ['AWS Lambda', 'Amazon SQS']
},
{
  id: 'dop-181',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company runs AWS CodeBuild projects to build container images. When a build fails, the company wants to notify the operations team through Amazon SNS and create an incident record with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Create an Amazon EventBridge rule that matches CodeBuild build state change events and invokes an AWS Lambda function to notify SNS and create an incident',
    'Use AWS CodeBuild build notifications to send email directly to the operations team',
    'Poll the CodeBuild console regularly and create incidents manually',
    'Use AWS CloudTrail to monitor CodeBuild API calls and trigger incident creation'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Amazon EventBridge có thể khớp sự kiện thay đổi trạng thái bản dựng CodeBuild (failed), sau đó gọi AWS Lambda để thông qua Amazon SNS và tạo bản ghi sự cố, ít vận hành nhất.

Vì sao đáp án A đúng: EventBridge rule lắng nghe CodeBuild build-state-change, Lambda xử lý thông báo SNS và tạo sự cố tự động.

Vì sao các đáp án sai:
B: CodeBuild build notifications chỉ gửi email, không tạo bản ghi sự cố tự động.
C: theo dõi console theo định kỳ và tạo thủ công vận hành cao, không tự động.
D: CloudTrail ghi gọi API CodeBuild, không phải cách hiệu quả để phản hồi bản dựng thất bại.

> Exam tip: "bản dựng CodeBuild thất bại tự động thông báo và tạo sự cố" trỏ về EventBridge rule khớp CodeBuild state change.`,
  services: ['AWS CodeBuild', 'Amazon EventBridge', 'AWS Lambda', 'Amazon SNS']
},
{
  id: 'dop-182',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company uses AWS Chatbot to send Amazon SNS notifications to a Slack channel. It wants to create and manage AWS Systems Manager Incident Manager incidents directly from the Slack channel with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Use AWS Chatbot with Incident Manager integration to create and manage incidents from Slack',
    'Use Amazon EventBridge to forward Slack messages to Incident Manager',
    'Use AWS Systems Manager Automation to create incidents from Slack messages',
    'Use Amazon CloudWatch alarms to create incidents in Incident Manager from Slack'
  ],
  answer: 0,
  explain: `**Tóm tắt:** AWS Chatbot có tích hợp với AWS Systems Manager Incident Manager, cho phép tạo và quản lý sự cố trực tiếp từ kênh Slack mà không cần viết mã phức tạp.

Vì sao đáp án A đúng: Chatbot + Incident Manager cho phép điều khiển sự cố từ Slack, ít vận hành nhất.

Vì sao các đáp án sai:
B: EventBridge không truyền tin nhắn Slack trực tiếp vào Incident Manager.
C: Systems Manager Automation không tạo sự cố từ tin nhắn Slack mà không có tích hợp Chatbot.
D: CloudWatch alarm tạo sự cố dựa trên chỉ số, không bắt nguồn từ tin nhắn Slack.

> Exam tip: "tạo và quản lý sự cố Incident Manager từ Slack" trỏ về tích hợp AWS Chatbot với Incident Manager.`,
  services: ['AWS Chatbot', 'AWS Systems Manager Incident Manager', 'Amazon SNS']
},
{
  id: 'dop-183',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company wants to aggregate multiple related Amazon CloudWatch alarms into a single alarm to reduce alert noise and only notify the operations team when a combination of conditions indicates a real incident. Which solution meets these requirements?`,
  options: [
    'Use Amazon CloudWatch composite alarms to combine multiple alarms with AND OR NOT logic',
    'Use Amazon EventBridge to correlate alarms and send a single notification',
    'Use AWS Systems Manager OpsCenter to group related alarms into one item',
    'Use Amazon Simple Notification Service to send multiple alarms to one topic'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Amazon CloudWatch composite alarms kết hợp nhiều báo thức bằng logic AND, OR, NOT, chỉ kích hoạt khi tổ hợp các điều kiện xác định sự cố thực, giảm tiếng ồn cảnh báo.

Vì sao đáp án A đúng: composite alarm tổng hợp các alarm thành một, chỉ thông báo khi điều kiện phức tạp thỏa mãn, ít vận hành nhất.

Vì sao các đáp án sai:
B: EventBridge không tổng hợp nhiều alarm CloudWatch thành một alarm đơn giản.
C: OpsCenter nhóm các vấn đề vận hành, không kết hợp các alarm thành một alarm báo thức.
D: SNS gửi nhiều báo thức đến một chủ đề, không giảm tiếng ồn bằng cách kết hợp điều kiện.

> Exam tip: "gộp nhiều báo thức thành một báo thức chỉ kích hoạt khi tổ hợp điều kiện" trỏ về CloudWatch composite alarm.`,
  services: ['Amazon CloudWatch']
},
{
  id: 'dop-184',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company wants to automatically create an AWS Systems Manager Incident Manager incident when a specific Amazon CloudWatch alarm enters the ALARM state, with the least operational overhead. Which solution meets this requirement?`,
  options: [
    'Use an Amazon EventBridge rule that matches the CloudWatch alarm state change and starts an Incident Manager incident',
    'Use AWS Systems Manager State Manager to create an incident when the alarm is ALARM',
    'Use AWS CloudTrail to log the alarm state change and create an incident manually',
    'Use Amazon Simple Notification Service to forward the alarm to Incident Manager'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Amazon EventBridge có thể khớp sự kiện thay đổi trạng thái báo thức CloudWatch sang ALARM và khởi tạo sựcido trong AWS Systems Manager Incident Manager, ít vận hành nhất.

Vì sao đáp án A đúng: EventBridge rule lắng nghe alarm state change, gọi Incident Manager tạo sự cố tự động.

Vì sao các đáp án sai:
B: State Manager áp dụng cấu hình instance, không tạo sự cố Incident Manager từ trạng thái alarm.
C: CloudTrail ghi sự kiện và tạo thủ công, vận hành cao.
D: SNS chỉ chuyển thông báo alarm, không tự động tạo sự cố Incident Manager.

> Exam tip: "báo thức CloudWatch vào trạng thái ALARM tự động tạo sự cố Incident Manager" trỏ về EventBridge rule khớp alarm state change.`,
  services: ['Amazon CloudWatch', 'Amazon EventBridge', 'AWS Systems Manager Incident Manager']
},
{
  id: 'dop-185',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company runs a production application and wants to establish a predefined response plan for a database failover incident, including runbook steps, escalation contacts, and chat channels, with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Use AWS Systems Manager Incident Manager response plans with runbooks, escalation contacts, and chat channels',
    'Use AWS Step Functions to orchestrate the database failover and notify contacts manually',
    'Use AWS Systems Manager Automation documents to perform the failover without a response plan',
    'Use Amazon EventBridge to detect the failover and send a notification to an email distribution list'
  ],
  answer: 0,
  explain: `**Tóm tắt:** AWS Systems Manager Incident Manager response plans định nghĩa trước kế hoạch phản ứng cho sự cố, bao gồm runbook, liên hệ hạn chế và kênh chat, ít vận hành nhất.

Vì sao đáp án A đúng: response plan chuẩn hóa cách xử lý sự cố failover database, có runbook và liên hệ, giảm thời gian phản hồi.

Vì sao các đáp án sai:
B: Step Functions điều phối failover nhưng không cung cấp kế hoạch phản ứng, liên hệ và kênh chat như Incident Manager.
C: Automation document thực hiện thao tác nhưng không có khung phản ứng sự cố tổng thể.
D: EventBridge gửi thông báo email, không cung cấp kế hoạch phản ứng có chi tiết và liên hệ hạn chế.

> Exam tip: "kế hoạch phản ứng sự cố có runbook, liên hệ hạn chế, kênh chat" trỏ về Incident Manager response plan.`,
  services: ['AWS Systems Manager Incident Manager']
},
{
  id: 'dop-186',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company wants to deploy a baseline AWS CloudFormation stack to every account in an organizational unit and automatically deploy the stack to any new accounts added to that unit, with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Use AWS CloudFormation StackSets with service-managed permissions and auto-deployment enabled for the organizational unit',
    'Use AWS CloudFormation to deploy the stack manually to each account',
    'Use AWS Systems Manager State Manager to deploy the CloudFormation stack to each account',
    'Use AWS Control Tower Account Factory to deploy the stack to every account'
  ],
  answer: 0,
  explain: `**Tóm tắt:** AWS CloudFormation StackSets với quản lý quyền do dịch vụ cung cấp và tự động triển khai cho đơn vị tổ chức giúp đưa stack chuẩn vào mọi tài khoản hiện tại và tài khoản mới được thêm vào, ít vận hành nhất.

Vì sao đáp án A đúng: StackSets service-managed với auto-deployment tự động triển khai stack mới vào tài khoản mới thêm vào OU, không cần thao tác thủ công mỗi tài khoản.

Vì sao các đáp án sai:
B: triển khai thủ công mỗi tài khoản vận hành cao và dễ bỏ sót tài khoản mới.
C: State Manager dùng để quản lý cấu hình instance, không triển khai stack CloudFormation nhiều tài khoản.
D: Control Tower Account Factory tạo tài khoản mới, không triển khai stack CloudFormation vào mọi tài khoản trong OU.

> Exam tip: "triển khai stack chuẩn vào mọi tài khoản trong OU và tài khoản mới" trỏ về CloudFormation StackSets service-managed với auto-deployment.`,
  services: ['AWS CloudFormation', 'AWS Organizations']
},
{
  id: 'dop-187',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company manages hundreds of AWS CloudFormation templates owned by different teams. The platform team must ensure that every Amazon S3 bucket created through CloudFormation has encryption and versioning enabled, and must detect and remediate any template that violates this rule with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Use AWS CloudFormation registry modules to define a standard S3 bucket with encryption and versioning, and use drift detection to find non-compliant stacks',
    'Use AWS Lambda to scan every CloudFormation template and fix non-compliant buckets',
    'Use AWS Config rules to check S3 bucket configuration and remediate with Systems Manager Automation',
    'Use AWS Service Catalog to restrict which S3 bucket templates teams can use'
  ],
  answer: 0,
  explain: `**Tóm tắt:** AWS CloudFormation registry modules cho phép định nghĩa một mẫu S3 bucket chuẩn có mã hoá và versioning, mọi stack dùng module này sẽ kế thừa cấu hình; drift detection phát hiện stack không tuân thủ sau khi thay đổi thủ công.

Vì sao đáp án A đúng: module registry chuẩn hóa cấu hình bucket; drift detection phát hiện sự khác biệt, nền tảng 팀 khắc phục, ít vận hành nhất.

Vì sao các đáp án sai:
B: Lambda quét và sửa thủ công mỗi mẫu vận hành cao và dễ lỗi.
C: AWS Config kiểm tra cấu hình bucket đã tạo, không ngăn template tạo bucket không mã hoá từ đầu.
D: Service Catalog giới hạn mẫu teams có thể dùng, không đảm bảo mọi bucket qua CloudFormation đều mã hoá và versioning.

> Exam tip: "chuẩn hóa tài nguyên qua CloudFormation và phát hiện vi phạm" trỏ về registry modules kết hợp drift detection.`,
  services: ['AWS CloudFormation', 'Amazon S3']
},
{
  id: 'dop-188',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company defines its infrastructure with the AWS Cloud Development Kit (CDK) in TypeScript and needs to reuse a common pattern for an Amazon VPC with public and private subnets across many projects. The company wants to encapsulate this pattern with custom logic and expose it as a construct with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Create a custom AWS CDK construct (L2 or L3) that encapsulates the VPC pattern and reuse it across projects',
    'Copy and paste the VPC TypeScript code into every project',
    'Use AWS CloudFormation templates for the VPC and import them into CDK',
    'Use AWS Systems Manager documents to define the VPC pattern'
  ],
  answer: 0,
  explain: `**Tóm tắt:** AWS CDK cho phép tạo construct tùy chỉnh (L2 hay L3) đóng gói mô hình VPC phổ biến với logic riêng, sau đó sử dụng lại ở nhiều dự án, ít vận hành nhất.

Vì sao đáp án A đúng: construct tùy chỉnh đóng gói logic VPC, các dự án chỉ cần import và sử dụng, tránh sao chép mã.

Vì sao các đáp án sai:
B: sao chép dán mã vào mọi dự án khó duy trì và sửa lỗi khi cần thay đổi mô hình.
C: dùng template CloudFormation rồi import vào CDK phức tạp hơn và không đóng gói logic tùy chỉnh tốt bằng construct.
D: Systems Manager document không dùng để định nghĩa mô hình VPC trong CDK.

> Exam tip: "đóng gói mô hình VPC dùng lại nhiều dự án trong CDK" trỏ về construct tùy chỉnh (L2/L3).`,
  services: ['AWS CDK', 'Amazon VPC']
},
{
  id: 'dop-189',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company must install a third-party security agent on 1,500 Amazon EC2 instances that run Amazon Linux 2023. The company wants to ensure the agent is installed on all instances and remains installed, with the least operational overhead. Which two actions should it take? (Choose two.)`,
  options: [
    'Use AWS Systems Manager State Manager to associate the installation with all instances',
    'Use AWS Systems Manager Patch Manager to install the security agent',
    'Use AWS Systems Manager Inventory to verify which instances have the agent installed',
    'Use Amazon EC2 Auto Scaling to replace instances that do not have the agent',
    'Use AWS CloudFormation to install the agent on every instance'
  ],
  answer: [0, 2],
  multi: true,
  explain: `**Tóm tắt:** Systems Manager State Manager gắn liên kết cài đặt agent tới mọi instance và đảm bảo agent luôn được cài lại nếu bị gỡ; Inventory kiểm tra xem instance nào đã có agent, ít vận hành nhất.

Vì sao đáp án A và B đúng: State Manager duy trì trạng thái cài đặt agent trên toàn đội instance; Inventory cung cấp báo cáo xem instance nào đã cài agent để kiểm tra tuân thủ.

Vì sao các đáp án sai:
C: Patch Manager dùng để cài bản vá hệ thống, không phải cài agent bảo mật thứ ba.
D: Auto Scaling thay thế instance không có agent không đảm bảo agent được cài trên instance hiện tại.
E: CloudFormation cài agent khi tạo instance, không duy trì agent trên instance đang chạy.

> Exam tip: "đảm bảo agent được cài và duy trì trên nhiều EC2" trỏ về State Manager association kết hợp Inventory kiểm tra.`,
  services: ['AWS Systems Manager', 'Amazon EC2']
},
{
  id: 'dop-190',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company uses AWS AppConfig to manage feature flags for its application. It wants to roll out a new feature flag to 10 percent of users first, then increase to 100 percent if no errors occur, and automatically roll back if a CloudWatch alarm fires. Which solution meets these requirements?`,
  options: [
    'Use an AppConfig deployment strategy with linear growth and enable automatic rollback on CloudWatch alarms',
    'Use AppConfig to deploy the feature flag to all users at once',
    'Use AWS CodeDeploy to deploy the feature flag incrementally',
    'Use Amazon CloudWatch to toggle the feature flag based on alarm state'
  ],
  answer: 0,
  explain: `**Tóm tắt:** AppConfig deployment strategy có thể tăng dần phần trăm người dùng nhận cờ tính năng (linear growth), và có thể bật rollback tự động khi báo thức CloudWatch kích hoạt, ít vận hành nhất.

Vì sao đáp án A đúng: chiến lược triển khai AppConfig với tăng dần 10% rồi 100%, rollback tự động theo alarm CloudWatch, đáp ứng yêu cầu.

Vì sao các đáp án sai:
B: triển khai cho 100% người dùng cùng lúc không kiểm soát rủi ro và không rollback tự động theo alarm.
C: CodeDeploy dùng để triển khai ứng dụng, không quản lý cờ tính năng AppConfig.
D: CloudWatch không bật tắt cờ tính năng AppConfig trực tiếp.

> Exam tip: "triển khai cờ tính năng dần dần và rollback tự động khi báo thức kích hoạt" trỏ về AppConfig deployment strategy.`,
  services: ['AWS AppConfig', 'Amazon CloudWatch']
},
{
  id: 'dop-191',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company wants to create and maintain standardized Amazon Machine Images (AMIs) that include the latest security patches and approved software, and distribute them to multiple AWS Regions and accounts with the least operational overhead. Which two actions should it take? (Choose two.)`,
  options: [
    'Use EC2 Image Builder to create and maintain the standardized AMIs',
    'Use EC2 Image Builder distribution settings to distribute the AMIs to multiple Regions and accounts',
    'Use AWS Systems Manager Patch Manager to create AMIs',
    'Use AWS CloudFormation to copy AMIs between Regions and accounts',
    'Use AWS Service Catalog to share AMIs with accounts'
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** EC2 Image Builder tạo và bảo trì AMI chuẩn có bản vá bảo mật và phần mềm đã phê duyệt, cùng cài đặt phân phối để gửi AMI tới nhiều Region và tài khoản, ít vận hành nhất.

Vì sao đáp án A và B đúng: Image Builder tạo AMI chuẩn; cấu hình phân phối tự động sao chép AMI sang nhiều Region và tài khoản mục tiêu.

Vì sao các đáp án sai:
C: Patch Manager vá hệ điều hành trên instance đang chạy, không tạo AMI.
D: CloudFormation không sao chép AMI giữa Region và tài khoản hiệu quả như Image Builder.
E: Service Catalog chia sẻ sản phẩm và mẫu, không phải công cụ phân phối AMI chuẩn nhiều Region.

> Exam tip: "tạo và phân phối AMI chuẩn nhiều Region và tài khoản" trỏ về EC2 Image Builder với cài đặt phân phối.`,
  services: ['EC2 Image Builder', 'Amazon EC2']
},
{
  id: 'dop-192',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company wants development teams to provision approved environments consisting of an Amazon RDS database and an Auto Scaling group through a self-service portal, with governance and least operational overhead. Which solution meets these requirements?`,
  options: [
    'Use AWS Service Catalog to publish approved portfolios containing the RDS database and Auto Scaling group templates',
    'Use AWS CloudFormation StackSets to deploy the environment to every development account',
    'Use AWS Systems Manager Automation to let teams create environments on demand',
    'Use AWS Control Tower to provision the environment for each development team'
  ],
  answer: 0,
  explain: `**Tóm tắt:** AWS Service Catalog cho phép nhóm phát triển tự cung cấp các môi trường được phê duyệt (cơ sở dữ liệu RDS và Auto Scaling group) qua cửa hàng tự phục vụ, với quy định quản trị, ít vận hành nhất.

Vì sao đáp án A đúng: Service Catalog xuất bản portfolio chứa mẫu đã phê duyệt, các nhóm phát triển chọn và khởi tạo môi trường theo quy định.

Vì sao các đáp án sai:
B: StackSets triển khai stack vào mọi tài khoản, không phải cửa hàng tự phục vụ cho từng nhóm phát triển.
C: Systems Manager Automation chạy tài nguyên theo tài liệu, không cung cấp cổng tự phục vụ có quản trị như Service Catalog.
D: Control Tower tạo khu vựcSET và tài khoản, không cung cấp môi trường RDS + ASG qua cửa hàng tự phục vụ.

> Exam tip: "các nhóm phát triển tự cung cấp môi trường đã phê duyệt qua cổng tự phục vụ" trỏ về AWS Service Catalog portfolio.`,
  services: ['AWS Service Catalog', 'Amazon RDS', 'Amazon EC2 Auto Scaling']
},
{
  id: 'dop-193',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company uses AWS Organizations with service control policies (SCPs) and IAM permissions boundaries. A developer in a member account has an IAM policy that allows Amazon S3 full access, but the developer cannot delete an S3 bucket. Which two factors most likely explain why the delete is denied, regardless of the IAM policy? (Choose two.)`,
  options: [
    'An SCP attached to the account or organizational unit denies s3:DeleteBucket',
    'An IAM permissions boundary attached to the developer user or role denies s3:DeleteBucket',
    'The developer IAM policy does not include s3:DeleteBucket',
    'S3 Block Public Access is enabled on the bucket',
    'The S3 bucket has Object Lock enabled in compliance mode'
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Tóm tắt:** Trong 평가 quyền AWS, explicit Deny từ SCP hoặc permissions boundary ghi đè mọi Allow, nên ngay cả khi chính sách IAM của nhà phát triển cho phép S3 đầy đủ, xóa bucket vẫn bị chặn nếu SCP hay permissions boundary từ chối.

Vì sao đáp án A và B đúng: SCP gắn vào tài khoản hoặc OU có thể từ chối s3:DeleteBucket; permissions boundary gắn vào người dùng hoặc vai trò cũng có thể từ chối, cả hai đều ghi đè Allow của IAM policy.

Vì sao các đáp án sai:
C: đề đã nêu IAM policy cho phép S3 đầy đủ, nên không phải lý do.
D: Block Public Access chặn truy cập công khai, không chặn xóa bucket của chủ sở hữu trong cùng tài khoản.
E: Object Lock compliance mode bảo vệ đối tượng bên trong bucket, không chặn việc xóa chính bucket.

> Exam tip: "IAM policy cho phép nhưng vẫn bị chặn bất kể chính sách IAM" trỏ về explicit Deny từ SCP hoặc permissions boundary.`,
  services: ['AWS Organizations', 'AWS IAM', 'Amazon S3']
},
{
  id: 'dop-194',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company uses AWS Key Management Service (KMS) customer managed keys to encrypt data in us-east-1. It wants to replicate the keys and their key material to eu-west-1 so that applications in that Region can decrypt the data locally, with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Create a multi-Region key in us-east-1 and add a replica key in eu-west-1',
    'Export the key material from us-east-1 and import it into a new KMS key in eu-west-1',
    'Use AWS KMS multi-factor authentication to copy the key to eu-west-1',
    'Create an independent customer managed key in eu-west-1 and re-encrypt the data with it'
  ],
  answer: 0,
  explain: `**Tóm tắt:** KMS multi-Region key cho phép tạo bản sao chép của khóa cùng vật liệu khóa ở nhiều Region, ứng dụng ở eu-west-1 có thể mã hoá và giải mã dữ liệu cục dùng, ít vận hành nhất.

Vì sao đáp án A đúng: tạo multi-Region key ở us-east-1 rồi thêm replica ở eu-west-1, vật liệu khóa được sao chép an toàn, các khóa trong các Region có thể hoạt động độc lập sau khi sao chép.

Vì sao các đáp án sai:
B: xuất và nhập vật liệu khóa phức tạp, cần quản lý mã hoá vật liệu khóa và không tự động đồng bộ.
C: KMS không có tính năng "multi-factor authentication để sao chép khóa".
D: tạo khóa độc lập ở eu-west-1 và mã hoá lại dữ liệu tốn kém, phức tạp và không dùng chung vật liệu khóa.

> Exam tip: "nhân bản khóa KMS cùng vật liệu khóa sang Region khác" trỏ về multi-Region key với replica key.`,
  services: ['AWS KMS']
},
{
  id: 'dop-195',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company wants to set up a secure, multi-account AWS environment with predefined guardrails and a centralized process for provisioning new accounts, with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Use AWS Control Tower to set up a landing zone with guardrails and Account Factory for provisioning new accounts',
    'Use AWS Organizations SCPs alone to govern all accounts',
    'Use AWS CloudFormation StackSets to create accounts and apply guardrails',
    'Use AWS IAM Identity Center to create accounts and apply guardrails'
  ],
  answer: 0,
  explain: `**Tóm tắt:** AWS Control Tower tạo landing zone đa tài khoản có các guardrail đã xác định trước và Account Factory cung cấp tài khoản mới theo quy trình tập trung, ít vận hành nhất.

Vì sao đáp án A đúng: Control Tower tự động thiết lập tài khoản lưu trữ logs, kiểm toán, guardrail và Account Factory để tạo tài khoản mới tuân thủ, ít vận hành nhất.

Vì sao các đáp án sai:
B: Organizations SCP chỉ kiểm soát quyền, không tạo landing zone hay quy trình cung cấp tài khoản tập trung.
C: CloudFormation StackSets triển khai tài nguyên, không tạo tài khoản AWS hay thiết lập guardrail.
D: IAM Identity Center quản lý danh tính và quyền truy cập, không tạo tài khoản hay thiết lập guardrail.

> Exam tip: "môi trường đa tài khoản an toàn có guardrail và cung cấp tài khoản tập trung" trỏ về AWS Control Tower.`,
  services: ['AWS Control Tower', 'AWS Organizations']
},
{
  id: 'dop-196',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A healthcare company stores protected health information in Amazon S3 and must retain objects for seven years with a legal hold preventing any deletion or overwriting during an investigation. Which solution meets these requirements?`,
  options: [
    'Use S3 Object Lock in compliance mode with a retention period of seven years and a legal hold',
    'Use S3 versioning with a lifecycle rule to expire objects after seven years',
    'Use S3 bucket policy to deny delete operations for seven years',
    'Use AWS Backup to retain S3 objects for seven years'
  ],
  answer: 0,
  explain: `**Tóm tắt:** S3 Object Lock compliance mode giữ đối tượng trong bảy năm và không cho ai, kể cả người quản trị tài khoản, xóa hoặc ghi đè trong thời gian giữ; legal hold ngăn xóa hoặc ghi đè trong khi điều tra diễn ra.

Vì sao đáp án A đúng: Object Lock compliance mode với thời gian giữ bảy năm và legal hold đáp ứng yêu cầu lưu trữ và chặn xóa ghi đè trong điều tra.

Vì sao các đáp án sai:
B: versioning với lifecycle expiration tự động xóa sau bảy năm, không ngăn xóa ghi đè trong thời gian điều tra.
C: bucket policy Deny delete có thể bị bỏ qua bởi root tài khoản và không phải chế độ giữ pháp lý.
D: AWS Backup không dùng để giữ đối tượng S3 với legal hold.

> Exam tip: "lưu trữ đối tượng bảy năm, không ai được xóa hoặc ghi đè trong điều tra" trỏ về S3 Object Lock compliance mode kết hợp legal hold.`,
  services: ['Amazon S3']
},
{
  id: 'dop-197',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company wants to inspect network traffic between Amazon EC2 instances in a VPC for malicious activity and block threats at the packet level with the least operational overhead. Which solution meets these requirements?`,
  options: [
    'Use AWS Network Firewall with stateful rule groups to inspect and filter VPC traffic',
    'Use VPC Flow Logs to capture traffic and analyze it after the fact',
    'Use security groups to allow or deny traffic based on port and protocol',
    'Use AWS WAF to inspect traffic between EC2 instances'
  ],
  answer: 0,
  explain: `**Tóm tắt:** AWS Network Firewall là tường lửa do AWS quản lý cho VPC, có các nhóm quy trình trạng thái để kiểm tra và lọc lưu lượng mạng ở cấp gói tin, ít vận hành nhất.

Vì sao đáp án A đúng: Network Firewall kiểm tra lưu lượng đi vào và ra VPC, chặn mối đe dọa ở cấp gói tin, không cần quản lý基礎 hạ tầng tường lửa.

Vì sao các đáp án sai:
B: VPC Flow Logs chỉ ghi lại lưu lượng để phân tích sau này, không chặn mối đe dọa theo thời gian thực.
C: security group chỉ lọc theo cổng và giao thức, không kiểm tra nội dung gói tin cho hoạt động độc hại.
D: AWS WAF bảo vệ ứng dụng web (HTTP/HTTPS), không kiểm tra lưu lượng chung giữa các EC2 trong VPC.

> Exam tip: "kiểm tra lưu lượng mạng giữa EC2 trong VPC và chặn ở cấp gói tin" trỏ về AWS Network Firewall.`,
  services: ['AWS Network Firewall', 'Amazon VPC']
},
{
  id: 'dop-198',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A public web application behind an Application Load Balancer experiences SQL injection attacks. The company wants to block these attacks automatically with the least operational overhead and without managing custom rules for every new attack pattern. Which solution meets these requirements?`,
  options: [
    'Use AWS WAF with AWS Managed Rules for SQL injection and automatic rule updates',
    'Use AWS Shield Standard to block SQL injection attacks',
    'Use security groups to block malicious IP addresses',
    'Use Amazon CloudFront with geo restriction to block attackers'
  ],
  answer: 0,
  explain: `**Tóm tắt:** AWS WAF với AWS Managed Rules cho SQL injection tự động phát hiện và chặn các cuộc tấn công chèn SQL, và AWS cập nhật quy tắc quản lý khi có mẫu tấn công mới, ít vận hành nhất.

Vì sao đáp án A đúng: WAF managed rules cho SQL injection không cần viết quy tắc tùy chỉnh cho mỗi mẫu mới, AWS duy trì và cập nhật quy tắc, chặn tấn công tự động trước ALB.

Vì sao các đáp án sai:
B: AWS Shield Standard bảo vệ trước tấn công từ chối dịch vụ (DDoS), không chặn SQL injection.
C: security group chặn theo địa chỉ IP, không kiểm tra nội dung yêu cầu HTTP cho SQL injection.
D: CloudFront geo restriction chặn theo khu vực địa lý, không chặn SQL injection theo nội dung.

> Exam tip: "chặn SQL injection tự động không quản lý quy tắc tùy chỉnh" trỏ về AWS WAF AWS Managed Rules.`,
  services: ['AWS WAF', 'Elastic Load Balancing']
}
);
