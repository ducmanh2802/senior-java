// AWS Certified DevOps Engineer – Professional (DOP-C02): exam-style questions dop-041..dop-078.
// Domains 4 (Monitoring and Logging), 5 (Incident and Event Response), 6 (Security and Compliance). Schema: docs/AWS-TRACK.md.
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'dop-041',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company has 40 AWS accounts in AWS Organizations. Each account runs applications that write logs to Amazon CloudWatch Logs log groups. The security team requires all application logs to be delivered in near-real time to a central logging account and stored in an Amazon S3 bucket in that account for 7 years. The solution must not require custom code to move the log data.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "In the logging account, create an Amazon Kinesis Data Firehose delivery stream that writes to the S3 bucket and a CloudWatch Logs destination that targets the stream, with a destination access policy that allows the organization. In each source account, create subscription filters on the log groups that send to the destination.",
    "Enable CloudWatch cross-account observability with the logging account as the monitoring account. Link all source accounts and configure the monitoring account to archive the shared log groups to the S3 bucket.",
    "In each source account, create an Amazon EventBridge scheduled rule that runs a CloudWatch Logs export task every hour to copy the log groups to the S3 bucket in the logging account.",
    "In each source account, deploy an AWS Lambda function that calls the GetLogEvents API every minute and writes the log events to the S3 bucket in the logging account.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "near-real time", "central logging account", "S3", "không custom code", "LEAST operational overhead".

### Vì sao A đúng
Cơ chế chuẩn để gom log CloudWatch Logs **xuyên account** là **cross-account subscription**: account nhận tạo một **CloudWatch Logs destination** (đích logic) trỏ tới Kinesis Data Streams hoặc Kinesis Data Firehose, kèm **destination access policy** cho phép account gửi (có thể dùng điều kiện {{aws:PrincipalOrgID}} để mở cho cả organization). Account nguồn tạo **subscription filter** trên log group, log được đẩy gần như real-time. Firehose tự buffer và ghi vào S3, sau đó S3 Lifecycle lo việc giữ 7 năm (có thể chuyển sang Glacier). Không có dòng code nào.

### Vì sao các phương án khác sai
- **B:** CloudWatch cross-account observability (OAM) cho phép **xem và truy vấn** log/metric/trace của account nguồn từ monitoring account, nhưng dữ liệu vẫn nằm ở account nguồn. Nó không có tính năng "archive sang S3".
- **C:** Export task (CreateExportTask) là batch, có độ trễ tới hàng giờ và mỗi account chỉ chạy được một export task tại một thời điểm. Không đạt "near-real time".
- **D:** Viết Lambda polling là custom code, dễ mất/trùng event, bị throttle API, vi phạm yêu cầu.

> Exam tip: Thấy "centralize logs cross-account + near real-time" thì nghĩ ngay **Logs destination + subscription filter + Kinesis Data Streams/Firehose**. Mỗi log group có tối đa 2 subscription filter. "Xem tập trung" (không cần copy dữ liệu) thì mới là cross-account observability.`,
  services: ['Amazon CloudWatch Logs', 'Amazon Kinesis Data Firehose', 'Amazon S3', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'Cross-account cross-Region log data sharing using subscriptions', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CrossAccountSubscriptions.html' }],
},
{
  id: 'dop-042',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `An application on Amazon EC2 writes INFO and ERROR lines continuously to a CloudWatch Logs log group. A DevOps engineer created a metric filter that matches the term "ERROR" and publishes a value of 1 to a custom metric. A CloudWatch alarm uses the Sum statistic over 5 minutes with a threshold of 5. During quiet periods with no errors, the alarm frequently shows INSUFFICIENT_DATA instead of OK, which breaks a dashboard that expects OK.

What should the engineer do to resolve this issue?`,
  options: [
    "Change the alarm period to 1 minute and set the evaluation periods to 5.",
    "Publish the custom metric as a high-resolution metric with a 10-second storage resolution.",
    "Set the default value of the metric filter to 0 so that 0 is published when logs are ingested but no matching events are found.",
    "Change the alarm statistic from Sum to Average so that missing periods are averaged to 0.",
  ],
  answer: 2,
  explain: `**Từ khoá:** metric filter, "quiet periods with no errors", INSUFFICIENT_DATA.

### Vì sao C đúng
Metric filter chỉ publish datapoint khi có log event **khớp** pattern. Không có dòng ERROR thì metric **không có datapoint nào**, alarm thấy thiếu dữ liệu nên chuyển INSUFFICIENT_DATA. Metric filter có thuộc tính **default value**: giá trị được publish trong những period có log được ingest nhưng không có event khớp. Vì ứng dụng ghi INFO liên tục, đặt default value = 0 sẽ tạo datapoint 0, alarm thấy Sum = 0 và về OK.

Cách khác cũng hợp lệ: cấu hình alarm {{TreatMissingData = notBreaching}} (missing data được coi là "tốt").

### Vì sao các phương án khác sai
- **A:** Đổi period không tạo thêm datapoint; vẫn thiếu dữ liệu.
- **B:** High-resolution chỉ đổi độ phân giải lưu trữ; không có event thì vẫn không có datapoint.
- **D:** Average trên tập rỗng vẫn là "không có dữ liệu", không phải 0.

> Exam tip: Metric filter **không hồi tố** (chỉ áp dụng cho log ingest sau khi tạo) và không có match thì không có datapoint. Hai cách xử lý hay gặp trong đề: **default value 0** trên metric filter hoặc **treat missing data as notBreaching** trên alarm.`,
  services: ['Amazon CloudWatch', 'Amazon CloudWatch Logs'],
},
{
  id: 'dop-043',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company runs 300 Amazon EC2 Linux instances that are managed by AWS Systems Manager. The operations team needs memory utilization and disk space utilization metrics in Amazon CloudWatch for every instance, and the agent configuration must be centrally managed so that a change can be rolled out to all instances without logging in to them.

Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Enable EC2 detailed monitoring on all instances to publish memory and disk space metrics at 1-minute granularity.",
    "Attach the CloudWatchAgentServerPolicy managed policy to the IAM role in the instance profile used by the instances.",
    "Install the AWS X-Ray daemon on each instance and configure it to send system metrics to CloudWatch.",
    "Store the CloudWatch agent configuration in Systems Manager Parameter Store, and use Systems Manager (Run Command or State Manager) to install the agent with AWS-ConfigureAWSPackage and to apply the configuration with AmazonCloudWatch-ManageAgent.",
    "Create CloudWatch Logs metric filters on the /var/log/messages log group to extract memory and disk space values.",
  ],
  answer: [1, 3],
  multi: true,
  explain: `**Từ khoá:** "memory", "disk space", "centrally managed", "không login vào instance".

### Vì sao B và D đúng
Memory và disk space là số liệu **bên trong guest OS**, hypervisor không nhìn thấy, nên EC2 không tự publish. Phải dùng **CloudWatch agent**.
- **B:** Agent gọi PutMetricData và ghi log nên instance role cần quyền; managed policy **CloudWatchAgentServerPolicy** cấp đúng các quyền này (có cả quyền đọc tham số cấu hình agent trong Parameter Store).
- **D:** Lưu file cấu hình agent (JSON) trong **Parameter Store**, dùng document **AWS-ConfigureAWSPackage** (package AmazonCloudWatchAgent) để cài và **AmazonCloudWatch-ManageAgent** để nạp cấu hình. Muốn đổi cấu hình chỉ cần sửa parameter rồi chạy lại; dùng State Manager association thì instance mới cũng tự được cấu hình.

### Vì sao các phương án khác sai
- **A:** Detailed monitoring chỉ đổi tần suất metric mặc định từ 5 phút xuống 1 phút; vẫn **không có** memory/disk.
- **C:** X-Ray daemon nhận trace segment từ ứng dụng, không thu system metrics.
- **E:** Metric filter cần dòng log chứa số liệu; /var/log/messages không ghi memory utilization định kỳ, và cũng phải có agent đẩy log lên trước.

> Exam tip: "memory / disk / process / custom metric từ EC2 hoặc on-premises" luôn là **CloudWatch agent**; "cấu hình tập trung cho cả fleet" là **Parameter Store + SSM Run Command/State Manager**.`,
  services: ['Amazon CloudWatch', 'AWS Systems Manager', 'Amazon EC2', 'AWS IAM'],
},
{
  id: 'dop-044',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A web application behind an Application Load Balancer has two CloudWatch alarms: one for p99 TargetResponseTime and one for HTTPCode_Target_5XX_Count. Both alarms send notifications to an Amazon SNS topic that pages the on-call engineer. The team receives many pages when only one of the conditions is briefly true. The team wants to be paged only when both conditions are in ALARM at the same time, while keeping the existing alarms visible on dashboards.

Which solution meets these requirements with the LEAST operational effort?`,
  options: [
    "Create a new alarm on a metric math expression that adds TargetResponseTime and HTTPCode_Target_5XX_Count, and send its notification to the SNS topic.",
    "Create a CloudWatch composite alarm with the rule ALARM(latency-alarm) AND ALARM(5xx-alarm), configure the SNS action on the composite alarm, and remove the SNS actions from the two underlying alarms.",
    "Create an Amazon EventBridge rule for alarm state changes that invokes an AWS Lambda function. The function checks the state of the other alarm and publishes to the SNS topic when both are in ALARM.",
    "Increase the datapoints to alarm setting on both alarms to 5 out of 5 so that brief spikes do not trigger notifications.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "only when both conditions are in ALARM", "reduce noise", "LEAST operational effort".

### Vì sao B đúng
**Composite alarm** đánh giá trạng thái của các alarm khác bằng biểu thức logic {{ALARM()}}, {{OK()}}, {{AND}}, {{OR}}, {{NOT}}. Đây đúng là tính năng sinh ra để **giảm alarm noise**: chỉ composite alarm có action gửi SNS, còn alarm con giữ nguyên (vẫn hiện trên dashboard) nhưng bỏ action. Composite alarm còn hỗ trợ **action suppression** (tạm im lặng khi một alarm "cha" như maintenance đang ALARM).

### Vì sao các phương án khác sai
- **A:** Cộng latency (giây) với số lỗi 5xx (đếm) là vô nghĩa về đơn vị; một chỉ số rất cao vẫn làm tổng vượt ngưỡng, không thể hiện "cả hai cùng lúc".
- **C:** Làm được nhưng là custom code, phải tự xử lý race condition và bảo trì; không phải ít công sức nhất.
- **D:** Giảm nhiễu từ spike ngắn nhưng vẫn page khi chỉ **một** điều kiện đúng, không thoả yêu cầu AND.

> Exam tip: "alert fatigue", "notify only when multiple alarms…" là **composite alarm**. Composite alarm chỉ gửi notification (SNS) và tạo OpsItem/incident; nó **không** chạy EC2 action hay Auto Scaling action.`,
  services: ['Amazon CloudWatch', 'Amazon SNS', 'Elastic Load Balancing'],
},
{
  id: 'dop-045',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `An e-commerce API has strong daily and weekly traffic patterns: request count at 03:00 is about 5% of the peak at 20:00, and weekends are much busier than weekdays. A static-threshold CloudWatch alarm on the RequestCount metric either misses traffic drops at night or fires falsely during normal peaks. The team wants to be alerted when request volume deviates from its normal pattern, without maintaining thresholds manually.

What should a DevOps engineer do?`,
  options: [
    "Create a metric math expression that calculates RATE(RequestCount) and alarm when the rate is negative for 3 consecutive periods.",
    "Create two static-threshold alarms, one for business hours and one for night hours, and use an Amazon EventBridge scheduled rule with an AWS Lambda function to enable and disable them.",
    "Increase the alarm evaluation period to 1 hour and use the p90 statistic to smooth the traffic pattern.",
    "Create a CloudWatch alarm based on anomaly detection for the RequestCount metric, using an ANOMALY_DETECTION_BAND expression and alerting when the metric is outside the band.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "daily and weekly patterns", "deviates from its normal pattern", "without maintaining thresholds manually".

### Vì sao D đúng
**CloudWatch anomaly detection** dùng machine learning học từ dữ liệu quá khứ của metric (tính cả chu kỳ theo giờ, ngày, tuần và xu hướng) để tạo ra một **band** giá trị kỳ vọng. Alarm dựa trên anomaly detection so sánh metric với band bằng hàm {{ANOMALY_DETECTION_BAND(m1, 2)}} (số 2 là độ rộng band tính theo độ lệch chuẩn) và có thể báo khi metric **cao hơn**, **thấp hơn**, hoặc **ngoài** band. Ngưỡng tự thay đổi theo giờ trong ngày nên đêm khuya traffic giảm bất thường vẫn bị bắt, giờ cao điểm bình thường không báo sai. Có thể loại trừ các khoảng thời gian bất thường (sự kiện sale) khỏi dữ liệu huấn luyện.

### Vì sao các phương án khác sai
- **A:** RATE âm chỉ có nghĩa traffic đang giảm, chuyện xảy ra mỗi tối; sẽ báo sai liên tục.
- **B:** Vẫn là ngưỡng tĩnh do người duy trì, lại thêm Lambda tự viết, và không xử lý được khác biệt cuối tuần.
- **C:** Làm mượt dữ liệu chỉ làm chậm phát hiện; ngưỡng vẫn tĩnh.

> Exam tip: "seasonal / cyclical pattern", "unknown normal baseline" là **anomaly detection alarm**. Mô hình cần dữ liệu lịch sử (khoảng 2 tuần cho chu kỳ tuần) mới chính xác.`,
  services: ['Amazon CloudWatch'],
  refs: [{ type: 'doc', title: 'Using CloudWatch anomaly detection', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Anomaly_Detection.html' }],
},
{
  id: 'dop-046',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company runs a service behind an Application Load Balancer. Traffic varies between 50 and 20,000 requests per minute. The company wants an alarm when more than 2% of requests return HTTP 5xx errors from the targets over 5 minutes. A static alarm on the count of 5xx errors does not work well because the traffic volume varies widely.

Which solution meets these requirements in the MOST operationally efficient way?`,
  options: [
    "Create a CloudWatch alarm on a metric math expression that divides the Sum of HTTPCode_Target_5XX_Count by the Sum of RequestCount and multiplies by 100, with a threshold of 2.",
    "Create an AWS Lambda function that runs every minute, calls GetMetricData for both metrics, computes the error percentage, and publishes it as a custom metric with an alarm.",
    "Send the ALB access logs to CloudWatch Logs, create a metric filter for status codes 500–599, and alarm on the filtered count.",
    "Create an alarm on HTTPCode_ELB_5XX_Count with a threshold of 2% of the average RequestCount from the previous week.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "percentage of requests", "traffic varies", "MOST operationally efficient".

### Vì sao A đúng
CloudWatch alarm hỗ trợ **metric math**: alarm có thể đánh giá một biểu thức tính từ nhiều metric, ví dụ {{(m1 / m2) * 100}} với m1 = Sum của HTTPCode_Target_5XX_Count, m2 = Sum của RequestCount, period 5 phút. Kết quả là **tỉ lệ lỗi**, độc lập với lượng traffic: 20 lỗi trên 100 request (20%) sẽ báo, nhưng 20 lỗi trên 20.000 request (0,1%) thì không. Không cần code, không cần hạ tầng thêm.

Lưu ý: nếu một period không có lỗi nào, metric 5xx có thể không có datapoint; dùng {{FILL(m1, 0)}} để thay giá trị thiếu bằng 0.

### Vì sao các phương án khác sai
- **B:** Kết quả đúng nhưng thêm Lambda, IAM, lịch chạy, chi phí API; metric math làm được việc này natively.
- **C:** ALB access log chỉ được ghi vào **Amazon S3**, không gửi thẳng tới CloudWatch Logs. Ngoài ra đây cũng chỉ là số đếm, chưa phải tỉ lệ.
- **D:** HTTPCode_ELB_5XX_Count là lỗi do **chính load balancer** sinh ra (502/503/504), không phải lỗi từ target; ngưỡng vẫn tĩnh.

> Exam tip: Phân biệt **HTTPCode_Target_5XX_Count** (ứng dụng lỗi) và **HTTPCode_ELB_5XX_Count** (ALB lỗi, ví dụ không có target healthy). "Error rate %" thì nghĩ ngay **metric math alarm**.`,
  services: ['Amazon CloudWatch', 'Elastic Load Balancing'],
},
{
  id: 'dop-047',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company runs microservices on Amazon ECS with the AWS Fargate launch type. The application code is already instrumented with the OpenTelemetry SDK. The DevOps team must send distributed traces to AWS X-Ray so that they can view the service map and analyze latency across services.

Which combination of steps should the team take? (Choose two.)`,
  options: [
    "Add the AWS Distro for OpenTelemetry (ADOT) Collector as a sidecar container in each task definition and configure the application to export traces to it.",
    "Enable active tracing in the ECS service definition so that ECS automatically sends traces to X-Ray.",
    "Install the X-Ray daemon on the Fargate hosts by using a user data script in the launch template.",
    "Enable CloudWatch Container Insights on the ECS cluster to collect traces from the tasks.",
    "Grant the ECS task role permissions to call xray:PutTraceSegments and xray:PutTelemetryRecords, for example by attaching the AWSXRayDaemonWriteAccess managed policy.",
  ],
  answer: [0, 4],
  multi: true,
  explain: `**Từ khoá:** "Fargate", "already instrumented with OpenTelemetry", "X-Ray service map".

### Vì sao A và E đúng
- **A:** Với container, mô hình chuẩn là chạy một collector cạnh ứng dụng (**sidecar**) trong cùng task. Ứng dụng export trace qua OTLP tới **ADOT Collector** (localhost), collector dùng exporter awsxray để gửi lên X-Ray. Trước đây cách tương đương là chạy container X-Ray daemon làm sidecar (UDP 2000).
- **E:** Collector chạy trong task nên dùng **task role** để ký request lên X-Ray. Thiếu quyền {{xray:PutTraceSegments}} / {{xray:PutTelemetryRecords}} thì trace bị từ chối (AccessDenied trong log collector).

### Vì sao các phương án khác sai
- **B:** "Active tracing" là tuỳ chọn của **Lambda** và **API Gateway stage**; ECS service không có cài đặt này.
- **C:** Fargate là serverless, bạn **không truy cập được host** và không có launch template/user data.
- **D:** Container Insights thu metric và log hiệu năng (CPU, memory, network theo task/service), không thu distributed trace.

> Exam tip: X-Ray trên từng nền tảng: **Lambda/API Gateway** bật active tracing; **EC2** cài daemon/agent; **ECS/EKS** chạy daemon hoặc ADOT Collector làm sidecar/DaemonSet; **Elastic Beanstalk** có tuỳ chọn bật X-Ray daemon. Luôn nhớ quyền IAM cho role tương ứng.`,
  services: ['AWS X-Ray', 'AWS Distro for OpenTelemetry', 'Amazon ECS', 'AWS Fargate', 'AWS IAM'],
},
{
  id: 'dop-048',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A team operates 25 AWS Lambda functions. Users reported slow responses during the last 3 days. The DevOps engineer must quickly find the invocations with the highest duration and memory usage across several of the functions' log groups for that period. The investigation is a one-time task, and the solution must not require additional infrastructure.

What should the engineer do?`,
  options: [
    "Create CloudWatch Logs metric filters on the REPORT lines of each log group and build a CloudWatch dashboard from the resulting metrics.",
    "Export the log groups to Amazon S3, create an AWS Glue crawler, and query the data with Amazon Athena.",
    "Use CloudWatch Logs Insights, select the log groups, and run a query that filters on @type = \"REPORT\" and sorts by @duration and @maxMemoryUsed in descending order.",
    "Create subscription filters that stream the log groups to Amazon OpenSearch Service and analyze the data in OpenSearch Dashboards.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "last 3 days" (dữ liệu đã có), "one-time", "no additional infrastructure".

### Vì sao C đúng
**CloudWatch Logs Insights** là công cụ query tương tác trên log đã lưu, chọn được nhiều log group cùng lúc, trả tiền theo lượng dữ liệu quét. Với log Lambda, Logs Insights **tự nhận diện các field** của dòng REPORT như {{@duration}}, {{@billedDuration}}, {{@maxMemoryUsed}}, {{@memorySize}}, {{@requestId}}. Ví dụ:

~~~text
filter @type = "REPORT"
| sort @duration desc
| limit 20
| fields @log, @requestId, @duration, @maxMemoryUsed / 1000000 as maxMemMB
~~~

### Vì sao các phương án khác sai
- **A:** Metric filter **không hồi tố**: chỉ xử lý log ingest sau khi tạo filter, nên không thấy 3 ngày vừa qua.
- **B:** Làm được nhưng cần export task, Glue crawler, Athena: nhiều bước, chậm, không đúng "quickly" và "no additional infrastructure".
- **D:** Subscription filter cũng chỉ đẩy log **mới**; còn phải dựng và trả tiền cho domain OpenSearch.

> Exam tip: Điều tra ad hoc trên log CloudWatch có sẵn là **Logs Insights**. Phân tích log nằm trong S3 (ALB, CloudTrail, VPC Flow Logs ở S3) là **Athena**. Real-time streaming là **subscription filter**.`,
  services: ['Amazon CloudWatch Logs', 'AWS Lambda'],
  refs: [{ type: 'doc', title: 'Analyzing log data with CloudWatch Logs Insights', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html' }],
},
{
  id: 'dop-049',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company uses a third-party observability platform. The company wants to send all Amazon EC2, Amazon RDS, and Elastic Load Balancing metrics from Amazon CloudWatch to the platform continuously with a latency of a few minutes. The platform exposes an HTTPS endpoint that is supported as a destination by Amazon Kinesis Data Firehose. The company wants to avoid writing and operating code.

Which solution meets these requirements?`,
  options: [
    "Create an AWS Lambda function that runs every minute, calls GetMetricData for each namespace, and posts the results to the platform's HTTPS endpoint.",
    "Create a CloudWatch metric stream that includes the AWS/EC2, AWS/RDS, and AWS/ApplicationELB namespaces and sends the metrics to a Kinesis Data Firehose delivery stream configured with the platform's HTTP endpoint as the destination.",
    "Create a CloudWatch Logs subscription filter for each namespace that sends metric data to a Kinesis Data Firehose delivery stream with the platform's endpoint.",
    "Create an Amazon EventBridge rule that matches CloudWatch metric update events and targets an API destination that points to the platform's endpoint.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "send metrics continuously", "third-party", "Kinesis Data Firehose", "avoid writing code".

### Vì sao B đúng
**CloudWatch metric streams** liên tục đẩy metric (gần real-time, độ trễ vài phút) tới **Kinesis Data Firehose**. Bạn chọn namespace muốn include/exclude (hoặc tất cả), định dạng output **JSON** hoặc **OpenTelemetry**. Firehose rồi giao tới S3, hoặc HTTP endpoint của các đối tác (Datadog, Dynatrace, New Relic, Splunk…). Không có code, không có polling, không bị giới hạn API GetMetricData.

### Vì sao các phương án khác sai
- **A:** Polling GetMetricData là cách cũ: phải viết code, quản lý phân trang, giới hạn tần suất API và chi phí cao khi có nhiều metric.
- **C:** Subscription filter áp dụng cho **log group**, không phải metric namespace.
- **D:** EventBridge không có event "metric updated". CloudWatch chỉ phát event **alarm state change**.

> Exam tip: "export metrics continuously to S3 / data lake / partner" là **metric streams + Firehose**. Còn "export logs" là **subscription filter**. Dữ liệu metric trong S3 có thể query bằng Athena.`,
  services: ['Amazon CloudWatch', 'Amazon Kinesis Data Firehose'],
},
{
  id: 'dop-050',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A compliance policy requires that a CloudWatch Logs log group containing payment application logs be encrypted with a customer managed AWS KMS key that the security team controls. A DevOps engineer created the KMS key with the default key policy, which gives the account root principal full access. When the engineer runs the associate-kms-key command for the log group, the operation fails with an error stating that the KMS key cannot be used.

What should the engineer do to resolve the issue?`,
  options: [
    "Attach an IAM policy that allows kms:Encrypt and kms:Decrypt on the key to the IAM user who runs the command, and run the command again.",
    "Use the AWS managed key aws/logs instead, because CloudWatch Logs supports only AWS managed keys for log group encryption.",
    "Enable automatic key rotation on the customer managed key, because CloudWatch Logs requires rotating keys.",
    "Update the key policy to allow the CloudWatch Logs service principal (logs.region.amazonaws.com) to use kms:Encrypt*, kms:Decrypt*, kms:ReEncrypt*, kms:GenerateDataKey*, and kms:Describe*, with a condition on the kms:EncryptionContext:aws:logs:arn key.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "customer managed key", "associate-kms-key fails", "default key policy".

### Vì sao D đúng
Khi log group được gắn KMS key, **chính dịch vụ CloudWatch Logs** (không phải user) dùng key để mã hoá/giải mã dữ liệu log. Vì vậy **key policy** phải cho phép service principal {{logs.<region>.amazonaws.com}} thực hiện các thao tác Encrypt, Decrypt, ReEncrypt, GenerateDataKey, Describe. Nên giới hạn bằng điều kiện {{kms:EncryptionContext:aws:logs:arn}} chỉ tới ARN log group cho phép (least privilege). Key policy mặc định chỉ trao quyền cho account root (để IAM policy uỷ quyền tiếp) nên service principal chưa có quyền và lệnh thất bại.

### Vì sao các phương án khác sai
- **A:** Quyền của user gọi API không đủ, vì CloudWatch Logs dùng key bằng danh nghĩa service principal; key policy phải cho phép service.
- **B:** Không có AWS managed key "aws/logs". Log group luôn được mã hoá mặc định bằng key do dịch vụ quản lý; muốn tự kiểm soát key thì **chỉ** dùng customer managed key.
- **C:** Key rotation không liên quan; CloudWatch Logs không yêu cầu bật rotation.

> Exam tip: Mẫu chung: dịch vụ AWS dùng customer managed key **thay bạn** (CloudWatch Logs, CloudTrail, SNS, SQS nhận từ dịch vụ khác…) thì phải thêm **service principal vào key policy**. Lỗi "KMS key access denied" cho dịch vụ thì sửa key policy trước tiên.`,
  services: ['Amazon CloudWatch Logs', 'AWS KMS'],
},
{
  id: 'dop-051',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company with 120 accounts in AWS Organizations must retain all management API activity for 7 years. Auditors need to run SQL queries across all accounts and Regions to answer questions such as "which principals deleted security groups last quarter". The company wants a solution with the LEAST operational overhead and does not want to manage table definitions or partitions.

Which solution meets these requirements?`,
  options: [
    "Create an organization trail that delivers to an Amazon S3 bucket with a 7-year lifecycle policy. Create Amazon Athena tables with partition projection and give the auditors access to Athena.",
    "Create an AWS CloudTrail Lake organization event data store from the management account (or a delegated administrator account) with a retention period of 7 years, and allow the auditors to run SQL queries in CloudTrail Lake.",
    "Use AWS Config advanced queries with an organization aggregator to query API activity across all accounts.",
    "Create an organization trail that sends events to a CloudWatch Logs log group in each member account, set the retention to 7 years, and use CloudWatch Logs Insights.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "SQL queries", "7 years", "across all accounts", "do not want to manage table definitions or partitions".

### Vì sao B đúng
**CloudTrail Lake** là data lake được quản lý cho event CloudTrail: tạo **event data store** dạng organization (từ management account hoặc delegated admin), nó tự thu event của mọi account và Region, lưu ở dạng tối ưu cho query, và cho chạy **SQL** trực tiếp trong console/API. Retention cấu hình được tới nhiều năm (7 năm, thậm chí 10 năm tuỳ pricing option). Không có bucket, bảng, partition hay Glue catalog nào phải quản lý.

### Vì sao các phương án khác sai
- **A:** Đây là cách truyền thống và **làm được**, nhưng phải quản lý bucket, lifecycle, bảng Athena, partition projection: trái với yêu cầu "không quản lý table definitions". Đây là distractor "đúng nhưng nhiều overhead".
- **C:** Config advanced query truy vấn **trạng thái cấu hình tài nguyên hiện tại**, không phải lịch sử API call (ai gọi DeleteSecurityGroup).
- **D:** Organization trail chỉ gửi tới **một** log group trong management account, không phải log group trong từng member account; và vẫn không phải SQL.

> Exam tip: "query CloudTrail bằng SQL, không quản lý hạ tầng, retention dài" là **CloudTrail Lake**. "Đã có log CloudTrail trong S3, cần phân tích chi phí thấp" là **Athena**.`,
  services: ['AWS CloudTrail', 'AWS Organizations'],
},
{
  id: 'dop-052',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A platform team operates a central monitoring account. Application teams own 60 workload accounts in AWS Organizations. The platform team needs to view metrics, query logs with CloudWatch Logs Insights, and view X-Ray traces from all workload accounts in the monitoring account without switching roles. New accounts that join the organization must be included automatically.

Which solution meets these requirements?`,
  options: [
    "Create a CloudWatch dashboard in each workload account and share it publicly with the platform team by using dashboard sharing.",
    "Create IAM roles in each workload account that the platform team assumes, and use the CloudWatch console account switcher to view each account's data.",
    "Configure CloudWatch cross-account observability: create a sink in the monitoring account, and use an AWS CloudFormation StackSet with service-managed permissions targeting the organization to create links from each workload account for metrics, logs, and traces.",
    "Create subscription filters in each workload account to send logs to the monitoring account, and use metric streams to copy metrics.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "view metrics, Logs Insights, X-Ray traces", "from the monitoring account", "without switching roles", "new accounts included automatically".

### Vì sao C đúng
**CloudWatch cross-account observability** (dựa trên Observability Access Manager - OAM) có hai thành phần: **sink** trong monitoring account (với policy cho phép ai được link vào, ví dụ cả organization) và **link** trong từng source account, chọn loại dữ liệu chia sẻ: metrics, log groups, traces, Application Signals… Sau khi link, monitoring account thấy và query dữ liệu của source account **như của chính mình** (dashboard, alarm trên metric cross-account, Logs Insights, trace map). Dùng **StackSet service-managed** gắn với organization/OU để auto-deploy link cho account mới.

### Vì sao các phương án khác sai
- **A:** Dashboard sharing dành cho người không có tài khoản AWS xem dashboard; không cho query log hay trace và phải làm từng account.
- **B:** Vẫn phải chuyển qua lại từng account, trái yêu cầu "without switching roles", và không tự động cho account mới.
- **D:** Sao chép dữ liệu (tốn chi phí lưu trữ, cần hạ tầng nhận), và không bao gồm trace X-Ray.

> Exam tip: "single pane of glass", "monitoring account" là **cross-account observability (sink + link)**. Cần **lưu trữ/archive** tập trung thì mới dùng subscription filter.`,
  services: ['Amazon CloudWatch', 'AWS X-Ray', 'AWS CloudFormation', 'AWS Organizations'],
},
{
  id: 'dop-053',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company receives AWS Health notifications about scheduled maintenance, such as EC2 instance retirement, by email only. Sometimes the emails are missed and instances are stopped unexpectedly. The DevOps team wants to automatically post a message to the team's chat channel and create a ticket whenever an EC2 scheduled change event is reported for the account.

Which solution meets these requirements?`,
  options: [
    "Create an Amazon EventBridge rule with an event pattern that matches source aws.health, detail-type AWS Health Event, service EC2, and eventTypeCategory scheduledChange. Target an Amazon SNS topic that notifies the chat channel and an AWS Lambda function that creates the ticket.",
    "Create a CloudTrail trail with data events enabled for Amazon EC2 and a CloudWatch Logs metric filter that matches instance retirement events.",
    "Enable AWS Trusted Advisor and create a CloudWatch alarm on the Trusted Advisor check for EC2 scheduled events.",
    "Create an AWS Config custom rule that evaluates EC2 instances every hour for scheduled retirement and sends noncompliant results to an Amazon SNS topic.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "AWS Health", "scheduled maintenance", "automatically", "chat + ticket".

### Vì sao A đúng
**AWS Health** công bố event (issue, accountNotification, scheduledChange) về tài nguyên của bạn, và mọi event này được gửi tới **Amazon EventBridge** với {{source = aws.health}}, {{detail-type = AWS Health Event}}. Rule lọc {{detail.service = EC2}} và {{detail.eventTypeCategory = scheduledChange}} rồi fan-out tới nhiều target: SNS (từ đó Amazon Q Developer in chat applications, trước đây là AWS Chatbot, gửi lên Slack/Teams) và Lambda tạo ticket. Có thể target thêm SSM Automation để tự stop/start instance sang host mới trước hạn.

Lưu ý: event Health của dịch vụ theo Region được gửi tới EventBridge **ở Region đó**; event global (như IAM) được gửi ở us-east-1. Vì vậy cần tạo rule ở mọi Region đang dùng.

### Vì sao các phương án khác sai
- **B:** Retirement không phải API call của bạn nên không có trong CloudTrail; data events cho EC2 cũng không phải thứ ghi nhận maintenance.
- **C:** Trusted Advisor không có check cho scheduled event này để báo theo thời gian thực.
- **D:** AWS Config đánh giá **cấu hình** tài nguyên; nó không thấy lịch bảo trì của AWS và còn phải viết custom rule.

> Exam tip: "react to AWS Health events / scheduled maintenance / service issue" là **EventBridge rule source aws.health**. Với Organizations, bật **organizational view** của AWS Health để xem event của mọi account tập trung.`,
  services: ['AWS Health', 'Amazon EventBridge', 'Amazon SNS', 'AWS Lambda'],
},
{
  id: 'dop-054',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company has 30 workload accounts in AWS Organizations. The operations team wants all EC2 instance state-change events and AWS CodePipeline execution failure events from every workload account to be processed by a single AWS Lambda function in a central operations account. New accounts must be able to send events without changes in the central account.

Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Create an Amazon SNS topic in each workload account and subscribe an Amazon SQS queue in the central account to each topic.",
    "Create an organization trail in the central account and run a scheduled CloudWatch Logs Insights query every minute to detect the events.",
    "Create a custom event bus in the central account with a resource-based policy that allows events:PutEvents with the condition aws:PrincipalOrgID equal to the organization ID, and add a rule on that bus that targets the Lambda function.",
    "In each workload account, create an EventBridge rule on the default event bus that matches the events and targets the central event bus ARN, using an IAM role that allows events:PutEvents on the central bus.",
    "In the central account, create an EventBridge rule on the default event bus that lists all workload account IDs in the account field of the event pattern.",
  ],
  answer: [2, 3],
  multi: true,
  explain: `**Từ khoá:** "from every workload account", "single Lambda in central account", "new accounts without changes in central account".

### Vì sao C và D đúng
EventBridge hỗ trợ gửi event **giữa các event bus khác account**:
- **C (phía nhận):** bus đích cần **resource-based policy** cho phép {{events:PutEvents}}. Dùng điều kiện {{aws:PrincipalOrgID}} thì mọi account trong organization, kể cả account mới, đều gửi được mà không phải sửa policy. Rule trên bus trung tâm route tới Lambda.
- **D (phía gửi):** event của dịch vụ AWS (EC2 state change, CodePipeline) chỉ xuất hiện trên **default bus của account phát sinh**. Mỗi workload account cần rule chọn event và target là **ARN của bus trung tâm**, kèm IAM role có quyền PutEvents. Triển khai rule này bằng StackSet service-managed để account mới tự có.

### Vì sao các phương án khác sai
- **A:** Phải tạo subscription mới trong central account cho từng account, trái yêu cầu; thêm nhiều thành phần.
- **B:** CloudTrail ghi API call, không ghi event state change; query định kỳ không phải event-driven.
- **E:** Event của workload account **không tự đến** default bus của central account; field account chỉ lọc những event đã có trên bus đó.

> Exam tip: Mẫu cross-account EventBridge: **rule ở account nguồn → bus account đích**, bus đích mở policy bằng **aws:PrincipalOrgID**. Nhớ event dịch vụ AWS là **regional**: cần rule ở từng Region (hoặc forward cross-Region).`,
  services: ['Amazon EventBridge', 'AWS Lambda', 'AWS Organizations', 'AWS IAM'],
},
{
  id: 'dop-055',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A security policy states that no security group may allow inbound SSH (port 22) from 0.0.0.0/0. Developers sometimes add such rules for troubleshooting and forget to remove them. The company wants these rules to be detected and removed automatically within minutes, with a compliance history of each occurrence, and with the LEAST custom code.

Which solution meets these requirements?`,
  options: [
    "Create an Amazon EventBridge scheduled rule that runs an AWS Lambda function every hour to scan all security groups and delete offending rules.",
    "Attach an SCP that denies ec2:AuthorizeSecurityGroupIngress to all accounts.",
    "Enable Amazon GuardDuty and create an EventBridge rule that triggers on the finding generated when a security group allows SSH from the internet.",
    "Deploy the AWS Config managed rule restricted-ssh and configure automatic remediation with an AWS Systems Manager Automation runbook that removes the offending ingress rule, using an IAM role that the runbook assumes.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "detected and removed automatically", "compliance history", "LEAST custom code".

### Vì sao D đúng
**AWS Config** ghi lại cấu hình mỗi lần security group thay đổi (configuration item) và **managed rule restricted-ssh** đánh giá ngay khi có thay đổi (change-triggered). Rule có **remediation action** là một **SSM Automation runbook** (AWS cung cấp sẵn runbook xoá ingress công khai, hoặc bạn tự viết document). Bật **automatic remediation** (có số lần retry) và chỉ định **AutomationAssumeRole** có quyền {{ec2:RevokeSecurityGroupIngress}}. Lịch sử NON_COMPLIANT → COMPLIANT được Config lưu lại, đáp ứng yêu cầu audit.

### Vì sao các phương án khác sai
- **A:** Custom code, độ trễ tới 1 giờ, không có lịch sử compliance.
- **B:** Chặn **mọi** thao tác thêm ingress rule, làm hỏng nhu cầu hợp lệ; SCP cũng không xử lý các rule đã tồn tại. (Muốn chặn có điều kiện cũng không lọc được theo CIDR của rule.)
- **C:** GuardDuty phát hiện **mối đe doạ** từ CloudTrail, VPC Flow Logs, DNS logs…; nó không có finding cho "security group mở port 22". Đó là việc của Config/Security Hub.

> Exam tip: "detect non-compliant configuration + auto-remediate + audit trail" là **Config rule + SSM Automation remediation**. Nhớ remediation cần **IAM role cho Automation**; lỗi remediation thất bại thường do role thiếu quyền.`,
  services: ['AWS Config', 'AWS Systems Manager', 'Amazon EC2', 'AWS IAM'],
},
{
  id: 'dop-056',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `An operations team manages hundreds of resources across several applications. When CloudWatch alarms fire or EventBridge events indicate failures, engineers must search through email notifications and multiple consoles. The team wants a single place to view, investigate, and resolve operational issues, with related resource information, duplicate issues grouped together, and the ability to run remediation runbooks directly from the issue.

Which solution meets these requirements?`,
  options: [
    "Send all CloudWatch alarm notifications to an Amazon SNS topic with an email subscription for a shared operations mailbox.",
    "Enable AWS Trusted Advisor and review the operational excellence checks daily.",
    "Configure the CloudWatch alarms to create OpsItems in AWS Systems Manager OpsCenter, create EventBridge rules that target OpsCenter for failure events, and associate Systems Manager Automation runbooks with the OpsItems.",
    "Send the alarms and events to AWS Security Hub as custom findings and use Security Hub insights to group them.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "single place to view, investigate, resolve operational issues", "duplicate grouped", "run runbooks from the issue".

### Vì sao C đúng
**Systems Manager OpsCenter** tập trung các **OpsItem** (vấn đề vận hành). OpsItem có thể tạo tự động từ **CloudWatch alarm** (alarm action "create OpsItem") và từ **EventBridge rule** (target OpsItem). Mỗi OpsItem chứa thông tin tài nguyên liên quan, CloudTrail/Config gần đây, các OpsItem tương tự; hỗ trợ **deduplication string** để gộp các vấn đề trùng. Từ OpsItem, engineer chạy ngay **Automation runbook** liên quan (ví dụ restart service, mở rộng ổ đĩa). Đây đúng là dịch vụ exam guide nhắc tới cho troubleshooting.

### Vì sao các phương án khác sai
- **A:** Vẫn là email rời rạc, không gom nhóm, không có ngữ cảnh tài nguyên hay runbook.
- **B:** Trusted Advisor đưa khuyến nghị best practice định kỳ, không quản lý sự cố đang xảy ra.
- **D:** Security Hub dành cho **finding bảo mật** và compliance; dùng nó cho sự cố vận hành là sai mục đích, không chạy runbook trực tiếp như OpsCenter.

> Exam tip: "OpsItems, investigate and remediate operational issues" là **OpsCenter**; "security findings aggregation" là **Security Hub**. Composite alarm cũng có thể tạo OpsItem để giảm số item trùng.`,
  services: ['AWS Systems Manager', 'Amazon CloudWatch', 'Amazon EventBridge'],
},
{
  id: 'dop-057',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `An Auto Scaling group uses Elastic Load Balancing health checks. After a new AMI was released, the application takes about 6 minutes to finish loading caches before it can respond to health checks. Since then, instances are repeatedly launched, marked unhealthy, and terminated, and the group never reaches its desired capacity. Instances work correctly when started manually.

What should a DevOps engineer do to resolve this issue?`,
  options: [
    "Change the Auto Scaling group health check type from ELB to EC2 so that only instance status checks are used.",
    "Increase the health check grace period of the Auto Scaling group to a value greater than the application startup time.",
    "Increase the default cooldown period of the Auto Scaling group to 600 seconds.",
    "Increase the maximum capacity of the Auto Scaling group so that more instances can be launched in parallel.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "takes 6 minutes to load", "repeatedly launched, marked unhealthy, terminated", "works when started manually".

### Vì sao B đúng
**Health check grace period** là khoảng thời gian sau khi instance chuyển sang InService mà Auto Scaling **chưa xét** kết quả health check của nó. Nếu grace period ngắn hơn thời gian khởi động ứng dụng, ELB health check sẽ fail ngay, Auto Scaling đánh dấu unhealthy, terminate và launch instance mới: vòng lặp vô tận. Tăng grace period lên lớn hơn 6 phút (ví dụ 420–480 giây) giải quyết gốc rễ. Cách tốt hơn nữa là dùng **lifecycle hook** launching để instance chỉ InService khi đã sẵn sàng.

### Vì sao các phương án khác sai
- **A:** Chuyển sang EC2 health check che giấu lỗi ứng dụng: instance treo nhưng OS vẫn chạy sẽ không bao giờ được thay.
- **C:** Cooldown chỉ ảnh hưởng **simple scaling policy** (giãn cách giữa các lần scale), không ảnh hưởng việc đánh giá health check.
- **D:** Thêm instance không giải quyết vòng lặp, chỉ tăng chi phí.

> Exam tip: Instance "bị thay liên tục ngay sau khi launch" gần như luôn là **grace period quá ngắn** hoặc health check path sai. Để giữ instance lỗi lại điều tra, dùng **lifecycle hook** hoặc tạm **suspend process ReplaceUnhealthy**.`,
  services: ['Amazon EC2 Auto Scaling', 'Elastic Load Balancing'],
},
{
  id: 'dop-058',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `Instances in an Auto Scaling group occasionally become unhealthy and are replaced. By the time an engineer investigates, the instance has been terminated and its local diagnostic files (application thread dumps and temporary logs that are not shipped to CloudWatch) are lost. The team wants these files to be collected automatically to Amazon S3 before any instance in the group is terminated.

Which solution meets these requirements?`,
  options: [
    "Add a lifecycle hook for the autoscaling:EC2_INSTANCE_TERMINATING transition. Create an EventBridge rule for the lifecycle action event that runs a Systems Manager Run Command document to upload the files to S3 and then calls CompleteLifecycleAction.",
    "Suspend the Terminate process of the Auto Scaling group so that unhealthy instances remain running for investigation.",
    "Enable EC2 termination protection on all instances launched by the Auto Scaling group.",
    "Install the CloudWatch agent to collect the operating system metrics and the /var/log/messages file from all instances.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "collected automatically before any instance is terminated", "local files".

### Vì sao A đúng
**Lifecycle hook** loại {{autoscaling:EC2_INSTANCE_TERMINATING}} giữ instance ở trạng thái **Terminating:Wait** (mặc định 1 giờ, có thể gia hạn bằng heartbeat). Auto Scaling phát event "EC2 Instance-terminate Lifecycle Action" lên EventBridge; rule gọi **Run Command** (hoặc Automation) chạy script copy file sang S3, xong thì gọi **CompleteLifecycleAction** để instance tiếp tục terminate. Không mất dữ liệu, không can thiệp vào khả năng tự chữa lành của group.

### Vì sao các phương án khác sai
- **B:** Suspend Terminate khiến group không scale in và không thay instance hỏng được nữa: ảnh hưởng availability và chi phí, cũng không thu file tự động.
- **C:** Auto Scaling **bỏ qua** EC2 termination protection khi thay instance unhealthy. (Instance scale-in protection cũng không chặn việc thay instance unhealthy.)
- **D:** Chỉ thu metric và một file log hệ thống; thread dump và file tạm của ứng dụng vẫn mất.

> Exam tip: "do something before terminate / after launch" trong ASG là **lifecycle hook**. Kết hợp với EventBridge + SSM Run Command/Lambda; nhớ instance cần SSM Agent và instance profile có quyền ghi S3.`,
  services: ['Amazon EC2 Auto Scaling', 'Amazon EventBridge', 'AWS Systems Manager', 'Amazon S3'],
},
{
  id: 'dop-059',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company moved an Amazon ECS service on AWS Fargate (platform version 1.4.0) to private subnets that have no route to the internet. Company policy prohibits NAT gateways and internet gateways for these subnets. After the move, tasks fail to start and the stopped reason shows CannotPullContainerError for images stored in Amazon ECR in the same Region.

Which combination of VPC endpoints must the DevOps engineer create to resolve the issue? (Choose three.)`,
  options: [
    "An interface VPC endpoint for com.amazonaws.region.ecr.dkr",
    "A gateway VPC endpoint for Amazon DynamoDB",
    "An interface VPC endpoint for com.amazonaws.region.ecr.api",
    "An internet gateway with a route from the private subnets for ECR traffic only",
    "A gateway VPC endpoint for Amazon S3 associated with the private subnets' route tables",
    "An interface VPC endpoint for AWS STS",
  ],
  answer: [0, 2, 4],
  multi: true,
  explain: `**Từ khoá:** "private subnets, no internet", "no NAT", "CannotPullContainerError", "ECR".

### Vì sao A, C, E đúng
Pull image từ ECR gồm nhiều bước gọi tới các endpoint khác nhau:
1. **ecr.api** (interface endpoint): gọi API như GetAuthorizationToken, lấy thông tin image.
2. **ecr.dkr** (interface endpoint): Docker Registry API, lấy manifest.
3. Các **layer** image thực chất được lưu trong **Amazon S3**, nên cần **S3 gateway endpoint** gắn vào route table của subnet (gateway endpoint miễn phí).
Thiếu bất kỳ endpoint nào thì vẫn gặp CannotPullContainerError. Security group của interface endpoint phải cho phép HTTPS (443) từ task. Nếu task dùng log driver awslogs thì cần thêm endpoint **logs**; dùng secrets thì thêm **secretsmanager**/**ssm**.

### Vì sao các phương án khác sai
- **B:** DynamoDB không tham gia vào việc pull image.
- **D:** Vi phạm chính sách; hơn nữa task không có public IP thì internet gateway cũng không giúp gì.
- **F:** Fargate lấy credential cho task execution role qua cơ chế nội bộ; pull ECR không cần STS endpoint.

> Exam tip: Bộ ba "ECR trong private subnet" = **ecr.api + ecr.dkr + S3 gateway**. Thấy ECS task lỗi khởi động trong subnet private, kiểm tra endpoint/NAT, quyền **task execution role** (ecr:GetAuthorizationToken…) và security group.`,
  services: ['Amazon ECS', 'AWS Fargate', 'Amazon ECR', 'AWS PrivateLink', 'Amazon S3', 'Amazon VPC'],
},
{
  id: 'dop-060',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company uses AWS CodeDeploy for an in-place deployment to EC2 instances. The previous application revision contained a broken ApplicationStop script. Every new deployment now fails on all instances during the ApplicationStop lifecycle event, and an automatic rollback also fails at the same event. The new revision contains a corrected ApplicationStop script.

What should the DevOps engineer do to deploy the new revision successfully?`,
  options: [
    "Increase the timeout for the ApplicationStop hook in the appspec.yml file of the new revision.",
    "Manually roll back to the previous revision from the CodeDeploy console, then deploy the new revision.",
    "Reinstall the CodeDeploy agent on all instances to clear the cached revision.",
    "Create a new deployment of the new revision with the option to ignore ApplicationStop failures (--ignore-application-stop-failures).",
  ],
  answer: 3,
  explain: `**Từ khoá:** "ApplicationStop fails", "previous revision broken script", "rollback also fails".

### Vì sao D đúng
Điểm mấu chốt: script **ApplicationStop** được chạy từ **revision đang cài trên instance** (revision cũ), vì nó dừng ứng dụng đang chạy trước khi tải bản mới. Bản mới đã sửa script nhưng script hỏng của bản cũ vẫn chạy và fail. CodeDeploy có tuỳ chọn **ignore ApplicationStop failures** (CLI {{--ignore-application-stop-failures}}, console "Don't fail the deployment to an instance if this lifecycle event on the instance fails"): bỏ qua lỗi ở bước này, cài revision mới; từ lần sau script đúng của bản mới được dùng.

### Vì sao các phương án khác sai
- **A:** Script lỗi (exit code khác 0), không phải timeout; và timeout trong appspec mới không áp dụng cho script của revision cũ.
- **B:** Rollback trong CodeDeploy là **một deployment mới** của revision cũ, vẫn chạy ApplicationStop của revision đang cài nên vẫn fail (đúng như đề nói rollback cũng fail).
- **C:** Cài lại agent không đổi gì; vẫn sẽ chạy script cũ. (Có cách thủ công xoá thư mục deployment-root trên instance, nhưng phức tạp và rủi ro hơn.)

> Exam tip: Nhớ thứ tự hook in-place: **ApplicationStop → DownloadBundle → BeforeInstall → Install → AfterInstall → ApplicationStart → ValidateService**. ApplicationStop dùng script của **revision trước**. Log agent ở {{/var/log/aws/codedeploy-agent/}} và log từng deployment ở {{/opt/codedeploy-agent/deployment-root/}}.`,
  services: ['AWS CodeDeploy', 'Amazon EC2'],
},
{
  id: 'dop-061',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A CloudFormation stack update failed. During rollback, CloudFormation tried to restore an AWS::SQS::Queue resource, but an engineer had manually deleted that queue outside of CloudFormation. The stack is now in the UPDATE_ROLLBACK_FAILED state, and no further updates can be made. The stack also contains a production Amazon RDS DB instance that must not be replaced.

What should the DevOps engineer do to return the stack to a working state?`,
  options: [
    "Delete the stack and re-create it from the same template, then restore the database from the latest snapshot.",
    "Run the cancel-update-stack command to cancel the failed rollback.",
    "Run the continue-update-rollback command, specifying the logical ID of the deleted queue in --resources-to-skip, and then update the stack to re-create the queue if it is still needed.",
    "Run drift detection on the stack and import the missing queue into the stack by using a resource import operation.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "UPDATE_ROLLBACK_FAILED", "resource deleted outside CloudFormation", "RDS must not be replaced".

### Vì sao C đúng
Khi rollback thất bại vì tài nguyên bị đổi/xoá ngoài CloudFormation, AWS cho hai cách: (1) sửa tay cho tài nguyên về trạng thái CloudFormation mong đợi rồi chạy **ContinueUpdateRollback**, hoặc (2) chạy **ContinueUpdateRollback** với **ResourcesToSkip** để bỏ qua tài nguyên không thể rollback. CloudFormation đánh dấu tài nguyên đó là đã rollback xong, stack về **UPDATE_ROLLBACK_COMPLETE**, các tài nguyên khác (RDS) giữ nguyên. Sau đó update stack bình thường để tạo lại queue.

### Vì sao các phương án khác sai
- **A:** Xoá stack sẽ xoá (hoặc phải snapshot) RDS, gây downtime và mất dữ liệu sau snapshot; không cần thiết.
- **B:** CancelUpdateStack chỉ dùng khi stack đang **UPDATE_IN_PROGRESS**, không áp dụng cho UPDATE_ROLLBACK_FAILED.
- **D:** Resource import không thực hiện được khi stack ở trạng thái rollback failed; drift detection chỉ báo cáo chứ không sửa.

> Exam tip: Phòng ngừa: bật **termination protection**, **stack policy** chặn update/replace tài nguyên quan trọng, và **DeletionPolicy/UpdateReplacePolicy: Retain/Snapshot** cho database. Gặp UPDATE_ROLLBACK_FAILED thì nghĩ ngay **continue-update-rollback (+ resources-to-skip)**.`,
  services: ['AWS CloudFormation', 'Amazon SQS', 'Amazon RDS'],
  refs: [{ type: 'doc', title: 'Troubleshooting CloudFormation', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/troubleshooting.html' }],
},
{
  id: 'dop-062',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company deploys a web application to EC2 instances with AWS CodeDeploy by using a blue/green deployment. A recent release passed all instance health checks but broke the multi-step checkout flow, and the problem was discovered by customers an hour later. The company wants to detect broken user journeys within minutes after deployment and automatically roll back the deployment.

Which solution meets these requirements?`,
  options: [
    "Create an Amazon Route 53 health check for the application's home page and configure CodeDeploy to roll back when the health check fails.",
    "Create an Amazon CloudWatch Synthetics canary that scripts the checkout flow, create a CloudWatch alarm on the canary's SuccessPercent metric, and add the alarm to the CodeDeploy deployment group with automatic rollback when an alarm threshold is met.",
    "Enable AWS X-Ray on the application and create an X-Ray group for the checkout API. Configure CodeDeploy to monitor the X-Ray group.",
    "Add a manual approval action in AWS CodePipeline after the deployment so that testers can verify the checkout flow.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "multi-step checkout flow", "detect within minutes", "automatically roll back".

### Vì sao B đúng
**CloudWatch Synthetics canary** là script (Node.js/Python, Puppeteer/Selenium) chạy theo lịch, mô phỏng hành trình người dùng nhiều bước: đăng nhập, thêm giỏ, thanh toán. Canary publish metric vào namespace **CloudWatchSynthetics**, trong đó có **SuccessPercent**. Tạo alarm trên SuccessPercent rồi gắn alarm vào **deployment group của CodeDeploy** với tuỳ chọn **rollback when alarm thresholds are met**: CodeDeploy theo dõi alarm trong lúc deploy và tự rollback khi alarm vào ALARM. Canary còn lưu screenshot, HAR file, log vào S3 để điều tra.

### Vì sao các phương án khác sai
- **A:** Route 53 health check chỉ kiểm tra một endpoint (HTTP status / chuỗi trong response), không đi được luồng nhiều bước. Ngoài ra CodeDeploy rollback theo **CloudWatch alarm**, không trực tiếp theo Route 53 health check.
- **C:** CodeDeploy không "monitor X-Ray group". (Có thể tạo alarm từ metric, nhưng phương án này mô tả sai cơ chế.)
- **D:** Thủ công, chậm, không tự rollback.

> Exam tip: "simulate user / monitor endpoints and APIs proactively / detect before customers" là **CloudWatch Synthetics**. CodeDeploy rollback tự động dựa trên **deployment failure** hoặc **CloudWatch alarms**.`,
  services: ['Amazon CloudWatch', 'AWS CodeDeploy'],
},
{
  id: 'dop-063',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `An Amazon EventBridge rule sends order events to an AWS Lambda function. During a downstream database outage, the function returned errors and some events were lost after Lambda's built-in retries were exhausted. The team wants to keep every event whose processing fails, including the error details, so that the events can be reprocessed later. The solution must require the least change.

What should the DevOps engineer do?`,
  options: [
    "Configure an on-failure destination for asynchronous invocations of the Lambda function that sends failed invocation records to an Amazon SQS queue.",
    "Configure a dead-letter queue on the EventBridge rule target and increase the target's maximum retry attempts.",
    "Increase the Lambda function's maximum retry attempts for asynchronous invocation to 10.",
    "Change the Lambda function to read events from an Amazon Kinesis data stream and configure the stream as the EventBridge target.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "function returned errors", "after Lambda's built-in retries", "keep failed events with error details".

### Vì sao A đúng
EventBridge gọi Lambda theo kiểu **asynchronous**: khi Lambda đã nhận event vào hàng đợi nội bộ, EventBridge coi là giao thành công. Lỗi trong code được Lambda tự retry (tối đa **2 lần** cho async). Sau đó event bị bỏ nếu không cấu hình gì. **On-failure destination** (SQS, SNS, Lambda hoặc EventBridge bus) nhận **invocation record** gồm event gốc **và** thông tin lỗi (requestContext, responsePayload). Đây là cách khuyến nghị thay cho DLQ của Lambda vì kèm chi tiết lỗi.

### Vì sao các phương án khác sai
- **B:** DLQ trên **EventBridge target** chỉ nhận event mà EventBridge **không giao được** tới target (ví dụ Lambda bị xoá, thiếu quyền, throttle hết retry policy). Lỗi xảy ra **bên trong** function sau khi đã giao không đi vào DLQ này. Đây là bẫy tinh vi.
- **C:** Async invocation chỉ cho retry 0–2 lần; không đặt được 10, và retry thêm cũng không giữ event khi outage kéo dài.
- **D:** Thay đổi kiến trúc lớn, không phải "least change".

> Exam tip: Phân biệt **ba lớp lỗi**: EventBridge → target (retry policy + DLQ trên target), Lambda async (retry 0–2 + on-failure destination/DLQ), Lambda với SQS/Kinesis event source (bisect batch, on-failure destination của event source mapping).`,
  services: ['Amazon EventBridge', 'AWS Lambda', 'Amazon SQS'],
},
{
  id: 'dop-064',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A data platform stores uploaded files in an Amazon S3 bucket. Three independent teams must process new objects: one team needs every object under the uploads/ prefix, another team needs only .csv objects under uploads/, and a third team needs to start an AWS Step Functions state machine for objects larger than 1 GB. The platform team also wants to archive the events and replay them after a consumer bug is fixed.

Which solution meets these requirements?`,
  options: [
    "Create three S3 event notification configurations for s3:ObjectCreated:* with overlapping prefix and suffix filters, each with its own destination.",
    "Configure an S3 event notification that targets the Step Functions state machine directly, and two additional notifications to Amazon SQS queues for the other teams.",
    "Configure S3 Replication to copy objects to three buckets, one per team, and configure event notifications on each bucket.",
    "Enable Amazon EventBridge notifications on the bucket, create one EventBridge rule per team with event patterns on the object key and size, and create an archive on the event bus for replay.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "three independent consumers", "filter by prefix, suffix and size", "Step Functions", "archive and replay".

### Vì sao D đúng
Bật **Amazon EventBridge** trên bucket thì mọi event S3 (Object Created, Object Deleted…) được gửi tới default event bus. EventBridge cho **nhiều rule độc lập** trên cùng event, lọc nội dung linh hoạt: prefix/suffix của {{detail.object.key}}, so sánh số học trên {{detail.object.size}} (numeric matching). Target hỗ trợ trực tiếp Step Functions, SQS, Lambda… **Archive** trên event bus và **replay** là tính năng sẵn có của EventBridge.

### Vì sao các phương án khác sai
- **A:** S3 event notification **không cho** hai cấu hình có prefix/suffix chồng nhau cho cùng loại event; S3 sẽ từ chối cấu hình. Cũng không lọc được theo kích thước.
- **B:** Đích của S3 event notification chỉ gồm **SNS, SQS, Lambda** (và EventBridge); không gửi thẳng tới Step Functions. Lại gặp lỗi chồng prefix.
- **C:** Nhân ba chi phí lưu trữ và vẫn không có archive/replay.

> Exam tip: S3 events mà cần **nhiều consumer, lọc nâng cao, nhiều loại target, archive/replay** thì chọn **S3 → EventBridge**. Fan-out đơn giản không cần lọc thì **S3 → SNS → nhiều SQS** vẫn là mẫu kinh điển.`,
  services: ['Amazon S3', 'Amazon EventBridge', 'AWS Step Functions'],
},
{
  id: 'dop-065',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company wants developers to create their own IAM roles for AWS Lambda functions in a development account without involving the security team. The security team must ensure that any role a developer creates can never have more permissions than a defined set (access to Amazon DynamoDB, Amazon S3 buckets with a specific prefix, and CloudWatch Logs), even if the developer attaches the AdministratorAccess policy to the role.

Which solution meets these requirements?`,
  options: [
    "Create an SCP that limits the development account to DynamoDB, S3, and CloudWatch Logs actions, and allow developers full IAM access.",
    "Require developers to pass a session policy when they assume their developer role, limiting the permissions of the roles they create.",
    "Create a managed policy to use as a permissions boundary. Allow developers iam:CreateRole and iam:PutRolePermissionsBoundary only with the condition iam:PermissionsBoundary equal to that policy's ARN, and deny them iam:DeleteRolePermissionsBoundary and changes to the boundary policy.",
    "Allow developers iam:PassRole for all roles in the account so that they can assign any existing role to their Lambda functions.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "developers create their own roles", "never more permissions than a defined set", "even if AdministratorAccess attached" (delegation).

### Vì sao C đúng
**Permissions boundary** đặt **mức trần** cho một IAM user/role: quyền thực tế là **giao** của identity-based policy và boundary. Gắn AdministratorAccess cho role có boundary chỉ cho phép DynamoDB/S3/Logs thì role vẫn chỉ làm được DynamoDB/S3/Logs. Để uỷ quyền an toàn:
- Cho developer {{iam:CreateRole}} **chỉ khi** request có {{iam:PermissionsBoundary}} = ARN boundary (nếu không gắn boundary thì CreateRole bị từ chối).
- Deny việc gỡ boundary ({{iam:DeleteRolePermissionsBoundary}}) và việc sửa chính policy boundary ({{iam:CreatePolicyVersion}} trên ARN đó), nếu không developer sẽ tự nới trần.

### Vì sao các phương án khác sai
- **A:** SCP giới hạn **cả account**, kể cả các pipeline/admin khác; và với full IAM, developer vẫn có thể tạo role mạnh cho các hành động khác trong phạm vi SCP. Không phải cơ chế uỷ quyền theo role.
- **B:** Session policy chỉ giới hạn **phiên của developer**, không ảnh hưởng quyền của role mới tạo ra.
- **D:** PassRole cho mọi role là lỗ hổng **privilege escalation** kinh điển: developer gắn role admin cho Lambda và chạy code với quyền admin.

> Exam tip: "delegate permission management", "developers create roles safely" là **permissions boundary + điều kiện iam:PermissionsBoundary**. SCP là guardrail theo account/OU; boundary là guardrail theo từng principal.`,
  services: ['AWS IAM', 'AWS Lambda'],
  refs: [{ type: 'doc', title: 'Permissions boundaries for IAM entities', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html' }],
},
{
  id: 'dop-066',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company uses AWS Organizations with all features enabled. The security team has configured an organization trail in AWS CloudTrail and Amazon GuardDuty in all member accounts. During an audit, the team found that an administrator in a member account had stopped CloudTrail logging for several hours. The company must prevent any user or role in member accounts, including account administrators, from disabling these services, while still allowing a dedicated security role to manage them.

Which solution meets these requirements?`,
  options: [
    "Attach an SCP to the organization root that denies cloudtrail:StopLogging, cloudtrail:DeleteTrail, cloudtrail:UpdateTrail, guardduty:DeleteDetector, and guardduty:UpdateDetector, with a condition that excludes the security role by using aws:PrincipalArn.",
    "Deploy an IAM policy that denies these actions to all IAM users and roles in each member account by using AWS CloudFormation StackSets.",
    "Deploy the AWS Config managed rule cloudtrail-enabled with automatic remediation that re-enables logging.",
    "Attach a permissions boundary that denies these actions to all IAM roles in the member accounts.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "prevent", "including account administrators", "member accounts", "allow a security role".

### Vì sao A đúng
**SCP** là guardrail **phòng ngừa** áp lên mọi principal trong member account, **kể cả root user** của account đó; quản trị viên account không thể gỡ vì SCP được quản lý từ management account. Deny các action tắt/xoá/sửa trail và detector, thêm điều kiện {{ArnNotLike aws:PrincipalArn}} để miễn trừ role bảo mật chuyên dụng. Lưu ý SCP **không áp dụng cho management account**, và organization trail vốn đã không thể bị sửa/xoá từ member account.

### Vì sao các phương án khác sai
- **B:** Administrator của account có quyền IAM sẽ **gỡ hoặc sửa** chính policy đó. Không ngăn được admin.
- **C:** Config là **phát hiện + khắc phục sau**, vẫn có khoảng thời gian không ghi log. Đề yêu cầu prevent.
- **D:** Permissions boundary phải gắn vào từng principal, admin có thể tạo role mới không có boundary hoặc gỡ boundary.

> Exam tip: "prevent even administrators / root of member accounts" là **SCP**. Nhớ: SCP **không cấp quyền**, chỉ giới hạn mức tối đa; không ảnh hưởng management account và service-linked role. Thường kết hợp SCP (preventive) + Config (detective).`,
  services: ['AWS Organizations', 'SCP', 'AWS CloudTrail', 'Amazon GuardDuty'],
  refs: [{ type: 'doc', title: 'Service control policies (SCPs)', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html' }],
},
{
  id: 'dop-067',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company uses AWS IAM Identity Center with an external identity provider that stores a costCenter attribute for each employee. The company has 200 project teams. Each team must manage only the EC2 instances and S3 objects tagged with its own costCenter value. The security team does not want to create or update permission sets every time a new team is created.

Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Enable attributes for access control in IAM Identity Center and map the costCenter attribute from the identity provider so that it is passed as a session tag.",
    "Create one permission set for each project team that lists the resource ARNs that the team owns.",
    "Create an IAM user for each employee with a costCenter tag and add the users to IAM groups per team.",
    "Create a single permission set with policies that allow actions only when aws:ResourceTag/costCenter equals ${aws:PrincipalTag/costCenter}.",
    "Create an SCP for each project team that restricts access to resources with the team's costCenter tag.",
  ],
  answer: [0, 3],
  multi: true,
  explain: `**Từ khoá:** "200 teams", "only resources tagged with own costCenter", "không tạo permission set cho mỗi team mới" (ABAC).

### Vì sao A và D đúng
Đây là **attribute-based access control (ABAC)**: quyền dựa trên so khớp **tag của principal** với **tag của tài nguyên**, nên một policy dùng cho mọi team.
- **A:** Bật **attributes for access control** trong Identity Center và map thuộc tính costCenter từ IdP (SAML assertion hoặc SCIM). Khi user đăng nhập, giá trị được truyền thành **session tag** {{aws:PrincipalTag/costCenter}}.
- **D:** Một permission set duy nhất với điều kiện {{StringEquals aws:ResourceTag/costCenter}} bằng biến policy principal tag. Team mới chỉ cần đúng thuộc tính trong IdP và tag tài nguyên; không đổi policy. Nên kèm điều kiện chặn sửa tag costCenter trên tài nguyên ({{aws:RequestTag}}, {{aws:TagKeys}}) để không ai tự gán tài nguyên sang team mình.

### Vì sao các phương án khác sai
- **B:** Đây là RBAC thuần, 200 permission set và phải cập nhật mỗi khi có team/tài nguyên mới.
- **C:** IAM user cho nhân viên đi ngược khuyến nghị (dùng federation, credential tạm thời) và vẫn phải quản lý group theo team.
- **E:** SCP gắn vào account/OU, không gắn được theo team người dùng; 200 SCP không hợp lý và SCP không cấp quyền.

> Exam tip: "scale to many teams without policy changes", "tag-based", "attributes from IdP" là **ABAC với session tags**. RBAC = một role cho mỗi chức năng; ABAC = ít policy, nhiều tag.`,
  services: ['AWS IAM Identity Center', 'AWS IAM', 'Amazon EC2', 'Amazon S3'],
},
{
  id: 'dop-068',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company stores Amazon RDS for PostgreSQL credentials in AWS Secrets Manager and enabled rotation by using a rotation Lambda function. The Lambda function and the DB instance run in private subnets of a VPC that has no NAT gateway. Rotation fails, and the Lambda function logs show that the function times out while calling the Secrets Manager API. Connectivity from the function to the database is working.

What should the DevOps engineer do to fix the rotation?`,
  options: [
    "Increase the timeout of the rotation Lambda function to 15 minutes.",
    "Create an interface VPC endpoint for Secrets Manager in the VPC, in subnets the Lambda function can reach, with a security group that allows HTTPS from the function.",
    "Place an Amazon RDS Proxy in front of the database and point the rotation function to the proxy endpoint.",
    "Switch the rotation strategy from alternating users to single user so that the function does not need to call Secrets Manager.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "private subnets", "no NAT gateway", "times out while calling the Secrets Manager API", "database connectivity works".

### Vì sao B đúng
Rotation function phải gọi API Secrets Manager nhiều lần trong 4 bước **createSecret → setSecret → testSecret → finishSecret** (GetSecretValue, PutSecretValue, UpdateSecretVersionStage). Lambda gắn vào VPC chỉ ra ngoài được qua NAT hoặc **VPC endpoint**. Không có đường ra thì gọi API sẽ treo tới timeout. Tạo **interface VPC endpoint** {{com.amazonaws.<region>.secretsmanager}} (bật private DNS) và mở security group cổng 443 từ Lambda là giải pháp; database vẫn kết nối trực tiếp trong VPC.

### Vì sao các phương án khác sai
- **A:** Không có đường mạng thì chờ lâu hơn vẫn timeout.
- **C:** RDS Proxy giải quyết connection pooling, không giải quyết việc tới endpoint Secrets Manager.
- **D:** Strategy nào cũng phải gọi Secrets Manager để lưu password mới; single user còn có rủi ro gián đoạn ngắn khi đổi password.

> Exam tip: Với RDS, cân nhắc **managed master user password** (RDS tự quản lý secret và rotation trong Secrets Manager, không cần Lambda). Alternating users giúp **không downtime** vì luôn có một user hợp lệ trong lúc rotate. Lỗi timeout của Lambda trong VPC → kiểm tra **NAT/VPC endpoint** trước.`,
  services: ['AWS Secrets Manager', 'AWS Lambda', 'Amazon RDS', 'AWS PrivateLink'],
},
{
  id: 'dop-069',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `Account A owns an Amazon S3 bucket whose objects are encrypted with SSE-KMS by using a customer managed key in account A. An application in account B runs with an IAM role and must read the objects. The bucket policy already grants s3:GetObject to the role in account B, but the application receives AccessDenied errors from AWS KMS.

Which combination of steps will resolve the issue while following the principle of least privilege? (Choose two.)`,
  options: [
    "Re-encrypt the objects with the AWS managed key aws/s3 and grant account B access to that key in the bucket policy.",
    "Update the key policy of the customer managed key in account A to allow account B (or the specific role ARN in account B) to use kms:Decrypt.",
    "Create a KMS grant in account B that allows the role to use the key in account A.",
    "Create a multi-Region replica key of the customer managed key in account B and use the replica to decrypt the objects.",
    "Attach an IAM policy to the role in account B that allows kms:Decrypt on the ARN of the key in account A.",
  ],
  answer: [1, 4],
  multi: true,
  explain: `**Từ khoá:** "cross-account", "customer managed key in account A", "AccessDenied from KMS", "bucket policy already OK".

### Vì sao B và E đúng
Truy cập KMS key **cross-account** cần **hai phía cùng cho phép**:
- **B (phía chủ key):** **key policy** của key trong account A phải cho phép account B (principal {{arn:aws:iam::B:root}}, nghĩa là uỷ quyền cho admin account B phân quyền tiếp) hoặc chính role ARN trong account B dùng {{kms:Decrypt}}.
- **E (phía người dùng):** trong account B, IAM policy của role phải cho phép {{kms:Decrypt}} trên **ARN đầy đủ** của key ở account A (không dùng được alias của account khác).
Thiếu một trong hai vẫn AccessDenied.

### Vì sao các phương án khác sai
- **A:** **Không sửa được key policy của AWS managed key**, nên không thể chia sẻ aws/s3 cross-account. Bucket policy không cấp quyền KMS.
- **C:** Grant được tạo **trên key** (ở account A, bởi principal có quyền CreateGrant), không phải "trong account B". Hơn nữa key policy vẫn phải cho phép trước.
- **D:** Multi-Region key nhân bản key sang **Region khác trong cùng account**, không sang account khác.

> Exam tip: Mẫu cross-account luôn là **resource policy phía chủ + IAM policy phía dùng**. Với KMS, resource policy là **key policy**. Muốn chia sẻ dữ liệu mã hoá cross-account phải dùng **customer managed key**.`,
  services: ['AWS KMS', 'Amazon S3', 'AWS IAM'],
},
{
  id: 'dop-070',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A legacy application role in a production account has the PowerUserAccess policy attached. The security team requires the role to be reduced to least privilege. The DevOps engineer must create a fine-grained policy that contains only the services and actions the role actually used during the last 90 days, with minimal manual analysis. An organization trail already logs management events to an Amazon S3 bucket.

Which solution meets these requirements?`,
  options: [
    "Download the IAM credential report and identify the services that the role used.",
    "Use AWS Trusted Advisor to identify the unused permissions of the role and generate a new policy.",
    "Review the role's last accessed information in the IAM console and manually write a policy that includes every service that shows recent access.",
    "Use IAM Access Analyzer policy generation for the role, selecting the CloudTrail trail and a 90-day time range, then review and refine the generated policy before replacing PowerUserAccess.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "only the actions actually used", "last 90 days", "minimal manual analysis", "CloudTrail trail exists".

### Vì sao D đúng
**IAM Access Analyzer policy generation** phân tích **CloudTrail log** của một IAM user/role trong khoảng thời gian bạn chọn (tối đa 90 ngày) và **tạo bản nháp policy** chứa các service và action đã dùng (với nhiều service, đến mức action). Access Analyzer cần một service role để đọc trail trong S3. Bạn xem lại, thêm resource ARN/điều kiện cụ thể, rồi lưu thành policy thay cho PowerUserAccess. Đây là cách nhanh nhất để đi từ "quyền rộng" về least privilege.

### Vì sao các phương án khác sai
- **A:** Credential report liệt kê user, trạng thái password, access key, MFA; không có thông tin service được dùng của **role**.
- **B:** Trusted Advisor không phân tích quyền của từng role để sinh policy.
- **C:** Last accessed information hữu ích (xem service nào không dùng để gỡ) nhưng phải **viết tay** policy, và chỉ có thông tin cấp action cho một số service; tốn công phân tích hơn.

> Exam tip: Access Analyzer có nhiều tính năng: **external access** (tài nguyên chia sẻ ra ngoài zone of trust là account/organization), **unused access** (role/key/permission không dùng), **policy generation** từ CloudTrail và **policy validation/custom policy checks** trong pipeline.`,
  services: ['IAM Access Analyzer', 'AWS IAM', 'AWS CloudTrail'],
},
{
  id: 'dop-071',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A financial company has 80 accounts in AWS Organizations, and new accounts are created every month. The compliance team has written a set of AWS Config rules, including custom AWS Lambda rules, and remediation actions that map to an internal control framework. The rules and remediations must be deployed as a single unit to all current and future accounts, and the compliance team needs one view of compliance across the organization.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create an AWS Audit Manager assessment with a custom framework that contains the controls, and enable it for all accounts.",
    "Enable AWS Security Hub in all accounts and enable a security standard that contains the compliance team's custom rules.",
    "Register a delegated administrator for AWS Config, deploy the rules and remediation actions as an organization conformance pack from that account, and create an organization-wide Config aggregator for the compliance view.",
    "Use AWS CloudFormation StackSets with self-managed permissions to deploy the Config rules to each existing account, and review compliance in each account's Config console.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "set of Config rules + remediation as single unit", "all current and future accounts", "one view of compliance".

### Vì sao C đúng
**Conformance pack** là một template YAML đóng gói nhiều **Config rule + remediation action**, được triển khai và theo dõi compliance như **một đơn vị**. **Organization conformance pack** (triển khai từ management account hoặc **delegated administrator** của Config) tự áp vào mọi member account, kể cả account mới gia nhập. **Organization aggregator** gom dữ liệu cấu hình và compliance của mọi account/Region về một chỗ. Lưu ý: rule custom Lambda cần function tồn tại và cho phép Config ở các account (ví dụ dùng function trung tâm với quyền invoke cross-account).

### Vì sao các phương án khác sai
- **A:** Audit Manager **thu thập evidence** và tạo báo cáo audit (có thể lấy evidence từ Config), nhưng không triển khai Config rule hay remediation.
- **B:** Security standard của Security Hub là bộ control do AWS định nghĩa; không đưa custom Config rule của bạn vào như một standard.
- **D:** Self-managed StackSets không tự triển khai cho account mới, và không có view compliance tập trung.

> Exam tip: "deploy a collection of Config rules and remediations across org" là **organization conformance pack**; "aggregate compliance view" là **Config aggregator**; "evidence for auditors" là **Audit Manager**.`,
  services: ['AWS Config', 'AWS Organizations', 'AWS Lambda'],
  refs: [{ type: 'doc', title: 'Conformance Packs', url: 'https://docs.aws.amazon.com/config/latest/developerguide/conformance-packs.html' }],
},
{
  id: 'dop-072',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company with 50 accounts in AWS Organizations operates in four AWS Regions. The security team wants AWS Security Hub enabled with the AWS Foundational Security Best Practices standard in every account and Region, including new accounts, and wants to review all findings from a single Region in a dedicated security tooling account.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "From the management account, designate the security tooling account as the Security Hub delegated administrator. In that account, configure Security Hub to automatically enable new and existing organization accounts with the standard, and enable cross-Region aggregation to a home Region.",
    "In the security tooling account, invite each member account to Security Hub by email and accept the invitations in each account, then enable the standard in each Region.",
    "Enable Security Hub individually in every account and Region, and create EventBridge rules in each account that forward findings to an Amazon SQS queue in the security tooling account.",
    "Enable Amazon GuardDuty with a delegated administrator, because GuardDuty automatically aggregates Security Hub findings from member accounts.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "every account and Region, including new accounts", "single Region", "security tooling account", "LEAST operational overhead".

### Vì sao A đúng
Security Hub tích hợp với Organizations:
- **Delegated administrator**: management account chỉ định security tooling account làm admin, không cần dùng management account hằng ngày (best practice).
- Admin cấu hình **tự động enable** Security Hub và standard cho account hiện có và account mới (central configuration với configuration policy cho phép làm việc này từ một chỗ, áp cho nhiều Region).
- **Cross-Region aggregation**: chọn **aggregation Region** (home Region), findings, insights và trạng thái control của các Region liên kết được đồng bộ về đó.

### Vì sao các phương án khác sai
- **B:** Invitation-based là cách cũ cho account ngoài organization; phải làm thủ công từng account và không tự động cho account mới.
- **C:** Vận hành nặng, phải tự xử lý findings; mất các tính năng gom nhóm của Security Hub.
- **D:** GuardDuty là nguồn **gửi findings vào** Security Hub, không phải nơi tổng hợp findings của Security Hub.

> Exam tip: Mẫu chung cho dịch vụ bảo mật multi-account (Security Hub, GuardDuty, Macie, Inspector, Detective, Config): **delegated administrator + auto-enable cho organization**. Security Hub còn cần **AWS Config** được bật (ghi tài nguyên) vì control dựa trên Config rule.`,
  services: ['AWS Security Hub', 'AWS Organizations', 'AWS Config'],
},
{
  id: 'dop-073',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `Amazon GuardDuty is enabled in all accounts. The security team wants any EC2 instance that is the subject of a high-severity GuardDuty finding about cryptocurrency mining to be automatically isolated within minutes, while preserving the instance and its disk for forensic investigation.

Which solution meets these requirements?`,
  options: [
    "Create a GuardDuty suppression rule for cryptocurrency findings that automatically stops the affected instance.",
    "Create an Amazon EventBridge rule that matches GuardDuty findings of the CryptoCurrency type with high severity, and target an AWS Systems Manager Automation runbook (or Lambda function) that replaces the instance's security groups with an isolation security group, creates EBS snapshots, and tags the instance.",
    "Enable Amazon Detective and configure Detective to automatically quarantine instances involved in findings.",
    "Create an AWS Config periodic rule that checks GuardDuty findings every 24 hours and terminates affected instances.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "automatically isolated within minutes", "preserve for forensics", "GuardDuty finding".

### Vì sao B đúng
GuardDuty publish mọi finding lên **EventBridge** ({{source = aws.guardduty}}, {{detail-type = GuardDuty Finding}}). Rule lọc theo {{detail.type}} bắt đầu bằng "CryptoCurrency:" và {{detail.severity}} cao (numeric ≥ 7), rồi gọi **SSM Automation** hoặc **Lambda** để: thay security group bằng **isolation SG** không có rule (cắt kết nối mới), **snapshot EBS**, tag instance, có thể gỡ instance khỏi ASG/target group. Instance và disk được **giữ nguyên** để điều tra (memory, file), không terminate.

Lưu ý: đổi security group không ngắt ngay các kết nối đang được **tracked**; có thể cần thêm NACL để cắt hẳn.

### Vì sao các phương án khác sai
- **A:** Suppression rule chỉ **ẩn/lưu trữ** finding (dùng cho false positive), không thực hiện hành động nào.
- **C:** Detective dùng để **điều tra** (graph, phân tích quan hệ), không có tính năng tự cách ly.
- **D:** 24 giờ quá chậm; Config không đọc finding GuardDuty; và terminate làm mất bằng chứng.

> Exam tip: "automated response to GuardDuty finding" luôn là **EventBridge → Lambda/SSM Automation/Step Functions**. GuardDuty chỉ **phát hiện**, không tự khắc phục.`,
  services: ['Amazon GuardDuty', 'Amazon EventBridge', 'AWS Systems Manager', 'Amazon EC2'],
},
{
  id: 'dop-074',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company stores container images in Amazon ECR and deploys them to Amazon ECS. ECR basic scanning on push is enabled. Images that passed scanning months ago are still running in production, and the security team is concerned that newly published CVEs affecting those images are not detected. The team wants findings for operating system and programming language package vulnerabilities to be updated automatically when new CVEs are published, and notifications for critical findings.

Which solution meets these requirements?`,
  options: [
    "Keep basic scanning and create an Amazon EventBridge scheduled rule that pushes every image again each day to trigger a new scan.",
    "Enable Amazon GuardDuty Runtime Monitoring for Amazon ECS to detect vulnerable packages in running containers.",
    "Add a stage to the CI/CD pipeline that scans images with an open-source scanner in AWS CodeBuild before they are pushed to ECR.",
    "Enable Amazon ECR enhanced scanning with Amazon Inspector using continuous scanning, and create an Amazon EventBridge rule for Inspector findings with CRITICAL severity that notifies the team through Amazon SNS.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "newly published CVEs for existing images", "OS and programming language packages", "updated automatically", "notify critical".

### Vì sao D đúng
**ECR enhanced scanning** dùng **Amazon Inspector**: quét cả gói **hệ điều hành** và gói **ngôn ngữ lập trình** (Java/Maven, Python, Node.js…). Với chế độ **continuous scanning**, Inspector tự **quét lại** image khi có CVE mới được công bố trong cơ sở dữ liệu lỗ hổng, cập nhật findings mà không cần push lại. Findings phát lên **EventBridge** (source aws.inspector2) để lọc severity CRITICAL và gửi SNS, hoặc chuyển sang Security Hub.

### Vì sao các phương án khác sai
- **A:** Basic scanning chỉ quét **gói OS** (không quét gói ngôn ngữ), quét khi push/manual, và push lại hằng ngày là cách vá víu.
- **B:** GuardDuty Runtime Monitoring phát hiện **hành vi độc hại lúc chạy** (process, network), không phải quét lỗ hổng gói.
- **C:** Scan trong pipeline tốt cho "shift-left" nhưng chỉ quét **một lần lúc build**; CVE mới sau đó không được phát hiện.

> Exam tip: "continuous rescanning when new CVEs published" là **Inspector (ECR enhanced scanning)**. Inspector còn quét **EC2** (qua SSM Agent hoặc agentless) và **Lambda** (code và dependency). Kết hợp scan trong pipeline + continuous scan là defense in depth.`,
  services: ['Amazon Inspector', 'Amazon ECR', 'Amazon EventBridge', 'Amazon SNS'],
},
{
  id: 'dop-075',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A healthcare company has more than 2,000 Amazon S3 buckets across 40 accounts in AWS Organizations. A regulation requires the company to identify which buckets contain personally identifiable information (PII), such as names, addresses, and passport numbers, and to continuously evaluate new data as it is added. Findings must be visible to the central security team.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Enable Amazon GuardDuty S3 Protection in all accounts to detect PII stored in S3 objects.",
    "Use Amazon Inspector to scan all S3 buckets for sensitive data and send findings to AWS Security Hub.",
    "Designate a delegated administrator for Amazon Macie in the security account, enable Macie for all member accounts, and turn on automated sensitive data discovery. Publish findings to AWS Security Hub.",
    "Create an AWS Config custom rule that downloads and inspects S3 objects for PII patterns with regular expressions.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "identify which buckets contain PII", "continuously evaluate", "2,000 buckets, 40 accounts", "LEAST overhead".

### Vì sao C đúng
**Amazon Macie** dùng machine learning và **managed data identifiers** (tên, địa chỉ, số hộ chiếu, thẻ tín dụng, thông tin y tế…) cùng **custom data identifiers** (regex của bạn) để phát hiện dữ liệu nhạy cảm trong S3. **Automated sensitive data discovery** liên tục lấy mẫu đại diện object trong toàn bộ bucket, tính **sensitivity score** cho từng bucket với chi phí kiểm soát được. Macie hỗ trợ **delegated administrator** qua Organizations để bật cho mọi account. Findings đẩy sang Security Hub và EventBridge. Macie còn báo **bucket public / không mã hoá** (policy findings).

### Vì sao các phương án khác sai
- **A:** GuardDuty S3 Protection phát hiện **hoạt động đáng ngờ** (API call bất thường lên S3), không đọc nội dung object để tìm PII.
- **B:** Inspector quét **lỗ hổng phần mềm** (EC2, ECR, Lambda), không phân loại dữ liệu trong S3.
- **D:** Tự viết, tốn chi phí đọc dữ liệu, khó mở rộng và không chính xác như managed identifiers.

> Exam tip: "PII / sensitive data discovery in S3" luôn là **Macie**. Bộ ba hay bị nhầm: **GuardDuty** = threat detection, **Inspector** = vulnerability, **Macie** = sensitive data.`,
  services: ['Amazon Macie', 'Amazon S3', 'AWS Organizations', 'AWS Security Hub'],
},
{
  id: 'dop-076',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `An application server (10.0.1.25) cannot connect to a PostgreSQL database (10.0.2.40) in another subnet of the same VPC; connections time out. The database security group allows inbound TCP 5432 from the application security group. VPC Flow Logs on the database network interface show the following records:

~~~text
2 123456789012 eni-0db1a2b3c4d5e6f70 10.0.1.25 10.0.2.40 49152 5432 6 3 180 1730700000 1730700060 ACCEPT OK
2 123456789012 eni-0db1a2b3c4d5e6f70 10.0.2.40 10.0.1.25 5432 49152 6 3 180 1730700000 1730700060 REJECT OK
~~~

What is the MOST likely cause, and how should it be fixed?`,
  options: [
    "The database security group is missing an outbound rule to the application subnet. Add an outbound rule for TCP 49152 to the application security group.",
    "The network ACL of the database subnet does not allow outbound traffic to ephemeral ports. Add an outbound NACL rule that allows TCP 1024–65535 to 10.0.1.0/24.",
    "The route table of the database subnet has no route to 10.0.1.0/24. Add a route to the application subnet with the local target.",
    "The application security group is missing an inbound rule for TCP 5432. Add an inbound rule for port 5432 from the database security group.",
  ],
  answer: 1,
  explain: `**Từ khoá:** flow log record 1 **ACCEPT** (vào, dstport 5432), record 2 **REJECT** (phản hồi ra, dstport 49152 = ephemeral port).

### Đọc flow log
Định dạng mặc định: version, account-id, interface-id, srcaddr, dstaddr, srcport, dstport, protocol (6 = TCP), packets, bytes, start, end, action, log-status. Request từ app vào DB được chấp nhận; **gói phản hồi** từ DB (port 5432) về app (port 49152) bị từ chối.

### Vì sao B đúng
**Security group là stateful**: nếu inbound đã được cho phép thì traffic phản hồi **tự động** được cho ra, bất kể outbound rule. Vậy một phản hồi bị REJECT chỉ có thể do thành phần **stateless** là **network ACL**. NACL của subnet DB thiếu rule outbound cho dải **ephemeral port** (1024–65535) tới subnet app. Thêm rule đó là xong.

### Vì sao các phương án khác sai
- **A:** SG stateful, phản hồi không cần outbound rule.
- **C:** Mọi route table trong VPC có sẵn **local route** cho CIDR của VPC và không xoá được. Thiếu route cũng không tạo ra record REJECT.
- **D:** App là bên khởi tạo kết nối; SG của app không cần inbound 5432 để nhận phản hồi.

> Exam tip: Mẹo kinh điển: **inbound ACCEPT + outbound REJECT = NACL** (stateless). **Inbound REJECT** có thể do SG hoặc NACL. Flow logs gửi tới CloudWatch Logs (query bằng Logs Insights) hoặc S3 (query bằng Athena).`,
  services: ['Amazon VPC', 'VPC Flow Logs'],
  refs: [{ type: 'doc', title: 'Logging IP traffic using VPC Flow Logs', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html' }],
},
{
  id: 'dop-077',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A public web application runs behind an Application Load Balancer. The security team observes SQL injection attempts in request query strings and bursts of thousands of requests per minute from rotating IP addresses that are trying to brute-force the /login endpoint. The team wants to block both types of traffic with managed AWS capabilities and minimal ongoing maintenance.

Which combination of steps should a DevOps engineer take? (Choose two.)`,
  options: [
    "Create an AWS WAF web ACL associated with the ALB and add a rate-based rule scoped down to requests whose URI path starts with /login.",
    "Subscribe to AWS Shield Advanced so that SQL injection requests are automatically blocked at the edge.",
    "Add the AWS managed rule group AWSManagedRulesSQLiRuleSet to the AWS WAF web ACL.",
    "Add network ACL deny rules for the source IP addresses of the attackers to the ALB subnets.",
    "Add security group rules on the ALB that deny traffic containing SQL keywords.",
  ],
  answer: [0, 2],
  multi: true,
  explain: `**Từ khoá:** "SQL injection", "bursts from rotating IPs", "brute-force /login", "managed capabilities".

### Vì sao A và C đúng
**AWS WAF** gắn được vào ALB, API Gateway, CloudFront, AppSync, Cognito user pool.
- **A:** **Rate-based rule** đếm request theo IP (hoặc theo khoá khác như header, IP chuyển tiếp) trong cửa sổ thời gian và tự chặn IP vượt ngưỡng; **scope-down statement** giới hạn rule cho {{/login}}. IP thay đổi liên tục vẫn bị chặn tự động mà không cần cập nhật danh sách.
- **C:** **AWS managed rule group** AWSManagedRulesSQLiRuleSet do AWS cập nhật, phát hiện mẫu SQL injection trong query string, body, URI. Không phải tự viết regex.
Nên bật **logging** của WAF (CloudWatch Logs, S3 hoặc Firehose, tên đích bắt đầu bằng {{aws-waf-logs-}}).

### Vì sao các phương án khác sai
- **B:** Shield Advanced chống **DDoS** (L3/L4, kèm hỗ trợ SRT); bản thân nó không phải bộ lọc SQL injection, việc đó vẫn do WAF rule đảm nhận.
- **D:** NACL chỉ lọc theo IP/port, giới hạn số rule thấp, không theo kịp IP xoay vòng; không phát hiện SQLi.
- **E:** Security group **không có deny rule** và không đọc nội dung HTTP.

> Exam tip: Tầng 7 (SQLi, XSS, rate limit, geo, bot) là **WAF**; DDoS là **Shield**; quản lý WAF/SG/Shield cho cả organization là **Firewall Manager**.`,
  services: ['AWS WAF', 'Elastic Load Balancing', 'AWS Shield'],
},
{
  id: 'dop-078',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A developer accidentally committed an IAM user access key to a public GitHub repository. AWS detected the exposure and notified the account. The security team wants an automated workflow for any future occurrence that immediately deletes the exposed access key, summarizes the recent API activity performed with the key from CloudTrail, and notifies the security team.

Which solution meets these requirements?`,
  options: [
    "Create an Amazon EventBridge rule that matches the GuardDuty finding for instance credential exfiltration and invokes an AWS Lambda function that deletes the access key.",
    "Enable Amazon Macie to scan public code repositories for AWS credentials and send findings to Amazon SNS.",
    "Deploy the AWS Config managed rule access-keys-rotated with a 1-day maximum key age and automatic remediation that deletes old keys.",
    "Create an Amazon EventBridge rule that matches AWS Health events with the event type code AWS_RISK_CREDENTIALS_EXPOSED and starts an AWS Step Functions workflow that deletes the key, looks up the key's recent CloudTrail events, and publishes a summary to Amazon SNS.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "access key committed to public GitHub", "AWS detected and notified", "automated workflow".

### Vì sao D đúng
Khi AWS phát hiện access key bị lộ công khai (ví dụ trên GitHub), AWS tạo một **AWS Health event** loại {{AWS_RISK_CREDENTIALS_EXPOSED}} (và có thể tự gắn policy cách ly cho user đó). Health event đi vào **EventBridge** (source aws.health) nên có thể kích hoạt workflow: **Step Functions** điều phối các bước xoá key ({{iam:DeleteAccessKey}}), tra **CloudTrail LookupEvents** theo access key ID để tóm tắt hành động gần đây, rồi gửi SNS. Đây chính là mẫu tham khảo chính thức của AWS.

### Vì sao các phương án khác sai
- **A:** Finding credential exfiltration của GuardDuty nói về **credential của EC2 instance role** bị dùng từ bên ngoài, không phải access key của IAM user bị lộ trên GitHub.
- **B:** Macie chỉ quét dữ liệu trong **Amazon S3**, không quét GitHub.
- **C:** Ép xoay key 1 ngày gây gián đoạn và vẫn không phản ứng ngay với sự kiện lộ key; Config cũng không biết key nào bị lộ.

> Exam tip: Phòng ngừa tốt hơn chữa: dùng **IAM role / Identity Center** thay access key dài hạn, quét secret trong pipeline (công cụ secret scanning trong CI hoặc trên repository) và bật **Trusted Advisor** check Exposed Access Keys.`,
  services: ['AWS Health', 'Amazon EventBridge', 'AWS Step Functions', 'AWS CloudTrail', 'AWS IAM', 'Amazon SNS'],
}
);
