/* AWS Certified DevOps Engineer – Professional (DOP-C02) practice pool, part 1: domains 1–3 (dop-001..dop-040).
 * Schema: docs/AWS-TRACK.md. Check: node scripts/check-aws.js */
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'dop-001',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company uses AWS CodePipeline in a central tooling account to build a CloudFormation-based application. The pipeline stores artifacts in an Amazon S3 bucket that is encrypted with the default AWS managed key (aws/s3). The company now wants the same pipeline to deploy the CloudFormation stack into a separate production account. The deploy action fails because the production account cannot read the artifacts. Which solution will meet this requirement while following AWS best practices?`,
  options: [
    'Edit the key policy of the AWS managed aws/s3 key to allow the production account to use it, and add a bucket policy that grants the production account read access to the artifact bucket.',
    'Create a customer managed AWS KMS key whose key policy allows the production account, configure it as the pipeline artifact store key, add an artifact bucket policy for the production account, and create an IAM role in the production account that the pipeline action assumes through its roleArn.',
    'Enable S3 Cross-Region Replication from the artifact bucket to a bucket in the production account, and create a second pipeline in the production account that is triggered by the replicated objects.',
    'Create an IAM user in the production account, store its access keys in AWS Secrets Manager in the tooling account, and have a CodeBuild action deploy the stack with those credentials.',
  ],
  answer: 1,
  explain: `**Từ khoá:** pipeline ở tooling account, deploy sang account khác, artifact mã hoá bằng **AWS managed key (aws/s3)**.

### Vì sao đáp án đúng
Mẫu cross-account chuẩn của CodePipeline gồm 3 phần:
1. **Customer managed KMS key**: chỉ key do bạn quản lý mới sửa được key policy để cấp quyền {{kms:Decrypt}} cho account khác. Pipeline phải dùng key này cho artifact store.
2. **Bucket policy** của artifact bucket cho phép account production đọc ({{s3:GetObject}}).
3. **IAM role trong account production** tin cậy tooling account; action deploy khai báo {{roleArn}} trỏ tới role này (CloudFormation còn cần thêm một role cho chính stack).

### Vì sao các phương án khác sai
- **Sửa key policy của aws/s3**: không làm được, key policy của AWS managed key do AWS quản lý, không thể chia sẻ cross-account.
- **CRR + pipeline thứ hai**: chạy được nhưng nhân đôi pipeline, mất luồng release xuyên suốt, nhiều vận hành hơn và còn vướng chuyện mã hoá.
- **IAM user + access key**: long-term credential, trái best practice; dùng assume role thay vì access key.

> Exam tip: thấy "cross-account pipeline" là nghĩ ngay bộ ba **customer managed KMS key + bucket policy + cross-account role**. Phương án nào dùng aws/s3 key hoặc access key đều loại.`,
  services: ['AWS CodePipeline', 'AWS KMS', 'Amazon S3', 'AWS IAM', 'AWS CloudFormation'],
  refs: [{ type: 'doc', title: 'Create a pipeline in CodePipeline that uses resources from another AWS account', url: 'https://docs.aws.amazon.com/codepipeline/latest/userguide/pipelines-create-cross-account.html' }],
},
{
  id: 'dop-002',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A team runs Maven builds for a Java service in AWS CodeBuild. Each build spends about 6 minutes downloading the same dependencies from the internet into the local Maven repository. Builds run on different build hosts throughout the day, and the team wants the cached dependencies to be reused by any later build regardless of the host. Which solution will reduce build time with the LEAST operational overhead?`,
  options: [
    'Enable the local Docker layer cache mode on the CodeBuild project and run the build in privileged mode.',
    'Change the project to a larger compute type so that the dependencies download faster.',
    'Build a custom CodeBuild image that pre-installs all dependencies and push a new version of the image to Amazon ECR every time a dependency changes.',
    'Configure an Amazon S3 cache for the CodeBuild project and list the local Maven repository directory (for example /root/.m2/**/*) under cache paths in the buildspec.',
  ],
  answer: 3,
  explain: `**Từ khoá:** dependency giống nhau mỗi build, **build host khác nhau**, cache dùng lại cho mọi build, LEAST operational overhead.

### Vì sao đáp án đúng
CodeBuild có hai loại cache:
- **Amazon S3 cache**: cuối build, các thư mục khai báo trong {{cache: paths:}} của buildspec được nén và upload lên S3; build sau (trên bất kỳ host nào) tải về trước khi chạy. Phù hợp khi muốn cache bền vững, không phụ thuộc host.
- **Local cache** ({{LOCAL_SOURCE_CACHE}}, {{LOCAL_DOCKER_LAYER_CACHE}}, {{LOCAL_CUSTOM_CACHE}}): lưu trên chính build host, chỉ là best-effort, build chạy trên host khác sẽ không có cache.

~~~yaml
cache:
  paths:
    - '/root/.m2/**/*'
~~~

### Vì sao các phương án khác sai
- **Docker layer cache**: chỉ cache layer khi build Docker image, không phải thư mục .m2; lại là local cache phụ thuộc host.
- **Compute type lớn hơn**: thời gian chủ yếu do network download, máy mạnh hơn không loại bỏ việc tải lại.
- **Custom image**: chạy được nhưng phải rebuild image mỗi khi dependency đổi, overhead cao.

> Exam tip: "regardless of host / persist across builds" → **S3 cache**. "Fastest, same host, Docker layers" → **local cache**.`,
  services: ['AWS CodeBuild', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'Cache builds to improve performance', url: 'https://docs.aws.amazon.com/codebuild/latest/userguide/build-caching.html' }],
},
{
  id: 'dop-003',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company runs integration tests in AWS CodeBuild. The tests must connect to an Amazon RDS for PostgreSQL DB instance that resides in private subnets of a VPC and is not publicly accessible. The build also needs to download packages from a public package registry on the internet. Which configuration will meet these requirements?`,
  options: [
    'Configure the CodeBuild project to run in the VPC, select private subnets whose route tables send internet traffic to a NAT gateway, and attach a security group that the RDS security group allows on port 5432.',
    'Configure the CodeBuild project to run in the VPC, select public subnets that have a route to an internet gateway, and enable automatic public IP assignment for the build containers.',
    'Modify the RDS DB instance to be publicly accessible and allow the CodeBuild service IP address ranges in the DB security group.',
    'Create a VPC peering connection between the VPC that CodeBuild uses by default and the application VPC, and update both route tables.',
  ],
  answer: 0,
  explain: `**Từ khoá:** RDS trong private subnet + vẫn cần internet để tải package.

### Vì sao đáp án đúng
Khi bật **VPC support**, CodeBuild tạo ENI trong subnet bạn chọn, nên build container truy cập được tài nguyên private như RDS. Nhưng ENI này **không bao giờ có public IP**, vì vậy muốn ra internet thì subnet phải là **private subnet có route 0.0.0.0/0 tới NAT gateway**. Thêm security group cho build và cho phép SG đó vào RDS trên cổng 5432.

### Vì sao các phương án khác sai
- **Public subnet + public IP**: tài liệu CodeBuild nói rõ không hỗ trợ gán public IP cho ENI của build, nên route tới internet gateway vô dụng; build sẽ không tải được package.
- **RDS publicly accessible**: phá yêu cầu bảo mật, và CodeBuild không có dải IP cố định đáng tin để whitelist.
- **VPC peering với VPC mặc định của CodeBuild**: VPC đó do AWS quản lý, bạn không thể peer với nó.

> Exam tip: CodeBuild/Lambda trong VPC cần internet → **private subnet + NAT gateway**. Đáp án dùng public subnet là bẫy kinh điển.`,
  services: ['AWS CodeBuild', 'Amazon VPC', 'Amazon RDS'],
  refs: [{ type: 'doc', title: 'Use AWS CodeBuild with Amazon Virtual Private Cloud', url: 'https://docs.aws.amazon.com/codebuild/latest/userguide/vpc-support.html' }],
},
{
  id: 'dop-004',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A build in AWS CodeBuild needs a database password to run database migration tests. The password is stored as a JSON key named "password" in an AWS Secrets Manager secret named prod/db. Security policy states that the password must never appear in plaintext in the CodeBuild project configuration, in the source repository, or in pipeline variables. Which solution meets these requirements?`,
  options: [
    'Add a plaintext environment variable named DB_PASSWORD to the CodeBuild project and restrict access to the project with an IAM policy.',
    'Read the secret in the pre_build phase and declare DB_PASSWORD under exported-variables so that later pipeline actions can reuse it.',
    'Reference the secret in the buildspec under env with secrets-manager (DB_PASSWORD: prod/db:password) and allow secretsmanager:GetSecretValue on the secret in the CodeBuild service role.',
    'Commit an encrypted copy of the password to the repository and decrypt it with the AWS Encryption SDK in the build phase.',
  ],
  answer: 2,
  explain: `**Từ khoá:** password không được xuất hiện plaintext ở project config, repo, hay pipeline variable.

### Vì sao đáp án đúng
Buildspec hỗ trợ lấy giá trị bí mật lúc chạy:

~~~yaml
env:
  secrets-manager:
    DB_PASSWORD: prod/db:password   # secret-id:json-key
  parameter-store:
    API_URL: /app/api-url
~~~

CodeBuild gọi Secrets Manager bằng **service role** (cần {{secretsmanager:GetSecretValue}}, thêm {{kms:Decrypt}} nếu secret mã hoá bằng customer managed key), đưa giá trị vào biến môi trường của build. Trong project config và repo chỉ có **tên secret**, không có giá trị; CodeBuild còn che giá trị secret trong build log.

### Vì sao các phương án khác sai
- **Plaintext env var**: giá trị hiển thị trong console và API {{BatchGetProjects}}, vi phạm yêu cầu.
- **exported-variables**: biến export trở thành pipeline variable, hiển thị trong lịch sử CodePipeline, đúng thứ bị cấm.
- **Commit bản mã hoá**: vẫn đưa bí mật vào repo, phải tự quản lý key và rotation, nhiều việc hơn.

> Exam tip: secret trong build → {{env: secrets-manager}} / {{env: parameter-store}} (SecureString) + quyền trên **service role**. Không bao giờ chọn plaintext env var hay exported-variables cho bí mật.`,
  services: ['AWS CodeBuild', 'AWS Secrets Manager', 'AWS IAM'],
  refs: [{ type: 'doc', title: 'Build specification reference for CodeBuild', url: 'https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html' }],
},
{
  id: 'dop-005',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company deploys an AWS Lambda function with AWS SAM. The company wants each new version to receive 10% of production traffic for 5 minutes before receiving all traffic. Smoke tests must run against the new version before any production traffic is shifted, and the deployment must roll back automatically if a CloudWatch error alarm enters the ALARM state. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    'In the SAM template, set AutoPublishAlias on the function and add a DeploymentPreference with Type Canary10Percent5Minutes and the CloudWatch alarm in the Alarms list.',
    'Enable canary settings on the Amazon API Gateway stage to send 10% of requests to the new deployment.',
    'Configure an AWS CodeDeploy in-place deployment for the Lambda function with the CodeDeployDefault.LambdaAllAtOnce configuration.',
    'Add a PreTraffic hook in the DeploymentPreference that points to a Lambda function that runs the smoke tests and reports the result with PutLifecycleEventHookExecutionStatus.',
    'Publish a new version manually and use Amazon Route 53 weighted records to send 10% of requests to the new version.',
  ],
  answer: [0, 3],
  multi: true,
  explain: `**Từ khoá:** SAM, 10% trong 5 phút, smoke test **trước khi** chuyển traffic, rollback theo alarm.

### Vì sao đáp án đúng
- **AutoPublishAlias + DeploymentPreference**: SAM tự publish version mới, tạo alias và CodeDeploy application/deployment group. {{Type: Canary10Percent5Minutes}} dịch 10% traffic của alias sang version mới, chờ 5 phút rồi chuyển 100%. Danh sách {{Alarms}} khiến CodeDeploy tự rollback alias về version cũ khi alarm vào ALARM.
- **Hooks: PreTraffic**: CodeDeploy gọi Lambda hook trước khi dịch traffic; hook chạy smoke test rồi bắt buộc gọi {{PutLifecycleEventHookExecutionStatus}} với Succeeded/Failed. Failed → deployment dừng và rollback. (PostTraffic chạy sau khi đã chuyển hết traffic.)

### Vì sao các phương án khác sai
- **API Gateway canary**: chia traffic giữa các stage deployment của API, không gắn với Lambda version và không tự rollback theo alarm.
- **In-place / LambdaAllAtOnce**: Lambda chỉ có traffic shifting; AllAtOnce chuyển 100% ngay, trái yêu cầu 10%.
- **Route 53 weighted**: Route 53 không trỏ tới Lambda version; thủ công, không có rollback.

> Exam tip: Lambda gradual deploy = **CodeDeploy traffic shifting trên alias** (Canary/Linear/AllAtOnce) + **PreTraffic/PostTraffic hooks** + **Alarms**.`,
  services: ['AWS SAM', 'AWS Lambda', 'AWS CodeDeploy', 'Amazon CloudWatch'],
  refs: [{ type: 'doc', title: 'Deploying serverless applications gradually with AWS SAM', url: 'https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/automating-updates-to-serverless-apps.html' }],
},
{
  id: 'dop-006',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company uses AWS CodeDeploy in-place deployments to a fleet of Amazon EC2 instances. A previous revision, which deployed successfully, contained a stop_server.sh script for the ApplicationStop lifecycle event. A recent change to the server made that script exit with a non-zero code. Every new deployment now fails at ApplicationStop, even after the team fixed stop_server.sh in the new revision. Which action will allow the new revision to deploy with the LEAST effort?`,
  options: [
    'Remove the ApplicationStop section from the appspec.yml file in the new revision and redeploy.',
    'Reinstall the CodeDeploy agent on every instance and redeploy the new revision.',
    'Redeploy the new revision with the option to ignore ApplicationStop failures (--ignore-application-stop-failures) enabled.',
    'Change the deployment configuration to CodeDeployDefault.AllAtOnce and redeploy.',
  ],
  answer: 2,
  explain: `**Từ khoá:** lỗi ở **ApplicationStop**, đã sửa script trong revision mới nhưng vẫn lỗi.

### Vì sao đáp án đúng
Thứ tự hook in-place EC2: ApplicationStop → DownloadBundle → BeforeInstall → Install → AfterInstall → ApplicationStart → ValidateService. **ApplicationStop chạy trước khi revision mới được tải về**, nên CodeDeploy dùng appspec và script của **revision đã deploy thành công gần nhất** trên instance. Sửa script trong revision mới không có tác dụng ở bước này. Cách nhanh nhất: deploy lại với tuỳ chọn bỏ qua lỗi ApplicationStop (console: "Don't fail the deployment to an instance if this lifecycle event on the instance fails"). Sau lần deploy thành công, revision mới (đã sửa) trở thành "last successful" cho các lần sau.

### Vì sao các phương án khác sai
- **Xoá ApplicationStop khỏi appspec mới**: cùng lý do, appspec mới chưa được đọc ở bước ApplicationStop.
- **Reinstall agent**: agent không lỗi; script cũ vẫn nằm trong thư mục deployment-root cũ.
- **AllAtOnce**: chỉ đổi số instance deploy cùng lúc, mọi instance vẫn fail.

> Exam tip: "ApplicationStop fails even after fixing the script" → **ignoreApplicationStopFailures**. Hook ApplicationStop luôn chạy script của revision trước.`,
  services: ['AWS CodeDeploy', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'AppSpec hooks section', url: 'https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html' }],
},
{
  id: 'dop-007',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company runs a service on Amazon ECS with AWS Fargate and uses AWS CodeDeploy blue/green deployments with an Application Load Balancer that has a production listener on port 443 and a test listener on port 8443. The company wants to run automated integration tests against the replacement (green) task set before any production traffic is routed to it, and to stop the deployment if the tests fail. Which solution will meet these requirements?`,
  options: [
    'Add a Lambda function to the BeforeInstall hook in the AppSpec file that sends test requests to the production listener.',
    'Add a Lambda function to the AfterAllowTestTraffic hook in the AppSpec file that sends test requests to the test listener and reports Failed if any test fails.',
    'Add a Lambda function to the AfterAllowTraffic hook in the AppSpec file that sends test requests to the production listener.',
    'Add a ValidateService hook script to the AppSpec file that runs the tests inside the replacement tasks.',
  ],
  answer: 1,
  explain: `**Từ khoá:** ECS blue/green, có **test listener**, test **trước khi** production traffic chuyển sang green.

### Vì sao đáp án đúng
Hook của ECS blue/green theo thứ tự: BeforeInstall → (tạo replacement task set) → AfterInstall → (gắn test listener vào green) → **AfterAllowTestTraffic** → BeforeAllowTraffic → (chuyển production listener) → AfterAllowTraffic. Tại **AfterAllowTestTraffic**, test listener 8443 đã trỏ vào green còn 443 vẫn trỏ blue, nên Lambda hook gọi 8443 là test đúng phiên bản mới mà khách hàng chưa thấy. Hook gọi {{PutLifecycleEventHookExecutionStatus}} = Failed → CodeDeploy dừng và rollback.

### Vì sao các phương án khác sai
- **BeforeInstall**: green task set chưa tồn tại; gọi listener production chỉ test bản cũ.
- **AfterAllowTraffic**: production traffic đã sang green, quá muộn so với yêu cầu.
- **ValidateService**: là hook của EC2/On-Premises (script chạy bởi CodeDeploy agent), không có trong ECS deployment; hook ECS đều là Lambda function.

> Exam tip: ECS blue/green + test trước khi cắt traffic → **AfterAllowTestTraffic + test listener**. Thuộc lòng danh sách hook theo nền tảng (EC2, ECS, Lambda).`,
  services: ['AWS CodeDeploy', 'Amazon ECS', 'AWS Fargate', 'Elastic Load Balancing', 'AWS Lambda'],
  refs: [{ type: 'doc', title: 'AppSpec hooks section', url: 'https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html' }],
},
{
  id: 'dop-008',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company deploys a web application to an Auto Scaling group of Amazon EC2 instances behind an Application Load Balancer by using AWS CodeDeploy in-place deployments with the CodeDeployDefault.HalfAtATime configuration. Recently, a deployment succeeded on all instances, but the new version returned many HTTP 5xx errors until an engineer manually redeployed the previous revision. The company wants CodeDeploy to roll back automatically when this happens, with the LEAST custom code. Which combination of steps will meet this requirement? (Choose two.)`,
  options: [
    'Create an Amazon EventBridge rule that invokes a Lambda function to call StopDeployment when a CloudWatch alarm changes state.',
    'Create a CloudWatch alarm on the HTTPCode_Target_5XX_Count metric of the target group and add the alarm to the CodeDeploy deployment group.',
    'Change the health check type of the Auto Scaling group from EC2 to ELB.',
    'Add a curl command to the ApplicationStart hook script that checks the home page once and always exits with code 0.',
    'Enable the "Roll back when alarm thresholds are met" option in the deployment group automatic rollback settings.',
  ],
  answer: [1, 4],
  multi: true,
  explain: `**Từ khoá:** deployment "thành công" nhưng app lỗi 5xx, muốn **tự rollback**, **LEAST custom code**.

### Vì sao đáp án đúng
CodeDeploy deployment group có cấu hình **alarm** (tối đa 10 CloudWatch alarm) và **automatic rollback** với hai lựa chọn: rollback khi deployment fail, và **rollback khi alarm vượt ngưỡng**. Khi alarm gắn với deployment group vào trạng thái ALARM trong lúc deploy, CodeDeploy dừng deployment và tạo deployment mới với revision tốt gần nhất. Cần cả hai bước: (1) tạo alarm trên metric phản ánh sức khoẻ (5xx của target group) và gắn vào deployment group; (2) bật rollback theo alarm.

### Vì sao các phương án khác sai
- **EventBridge + Lambda StopDeployment**: làm được nhưng là custom code, trái LEAST custom code; tính năng sẵn có đã làm việc này.
- **ASG health check ELB**: chỉ thay instance không healthy, không đưa code về revision cũ.
- **curl luôn exit 0**: không bao giờ làm deployment fail nên không kích hoạt rollback. (Muốn kiểm tra sau khi start thì đặt test trong ValidateService và exit khác 0 khi lỗi.)

> Exam tip: "automatically roll back based on metrics" → **CloudWatch alarm gắn deployment group + rollback when alarm thresholds are met**. Lưu ý rollback thực chất là **deployment mới** của revision cũ.`,
  services: ['AWS CodeDeploy', 'Amazon CloudWatch', 'Elastic Load Balancing', 'Amazon EC2 Auto Scaling'],
  refs: [{ type: 'doc', title: 'Redeploy and roll back a deployment with CodeDeploy', url: 'https://docs.aws.amazon.com/codedeploy/latest/userguide/deployments-rollback-and-redeploy.html' }],
},
{
  id: 'dop-009',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company's release pipeline in AWS CodePipeline has a manual approval action named ApproveProd in a stage named Production. The release managers must receive an email when approval is needed, and only members of the ReleaseManagers IAM group may approve or reject this action. Developers have read-only access to the pipeline. Which solution will meet these requirements?`,
  options: [
    'Configure the approval action to publish to an Amazon SNS topic that the release managers subscribe to by email, and attach a policy to the ReleaseManagers group that allows codepipeline:PutApprovalResult on the ARN of the ApproveProd action.',
    'Configure the approval action to publish to an Amazon SNS topic, and add a subscription filter policy so that only release managers can approve from the email link.',
    'Add a resource-based policy to the pipeline that allows only the ReleaseManagers group to run codepipeline:PutApprovalResult.',
    'Replace the approval action with an AWS Lambda invoke action that checks the IAM group of the user who started the pipeline execution.',
  ],
  answer: 0,
  explain: `**Từ khoá:** manual approval, gửi email, **chỉ một nhóm** được approve.

### Vì sao đáp án đúng
Manual approval action có thể gắn **SNS topic** để gửi thông báo (email chứa link tới console). Việc approve/reject là gọi API {{codepipeline:PutApprovalResult}}, nên kiểm soát bằng **IAM identity policy** với resource là ARN của action, dạng {{arn:aws:codepipeline:region:account:pipeline-name/Production/ApproveProd}}. Developer chỉ có read-only nên không thể approve.

### Vì sao các phương án khác sai
- **SNS subscription filter**: chỉ lọc ai nhận thông báo; không liên quan tới quyền approve. Link trong email chỉ mở console, quyền vẫn do IAM quyết định.
- **Resource-based policy cho pipeline**: CodePipeline không hỗ trợ resource-based policy trên pipeline; phân quyền bằng identity policy.
- **Lambda kiểm tra người start pipeline**: người start không phải người approve; tự viết logic, không phải manual approval.

> Exam tip: "only specific people can approve" → IAM policy cho {{PutApprovalResult}} trên ARN của approval action. Thông báo → SNS topic trong cấu hình action.`,
  services: ['AWS CodePipeline', 'Amazon SNS', 'AWS IAM'],
  refs: [{ type: 'doc', title: 'Add a manual approval action to a stage', url: 'https://docs.aws.amazon.com/codepipeline/latest/userguide/approvals.html' }],
},
{
  id: 'dop-010',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company runs AWS CodeBuild projects inside private subnets of a VPC that has no internet access, by policy. The Java builds need open source packages from Maven Central, and the security team wants a central place to control and audit which packages are consumed. Which solution will meet these requirements with the LEAST operational overhead?`,
  options: [
    'Add a NAT gateway to the VPC so that CodeBuild can download packages directly from Maven Central.',
    'Download approved packages manually into an Amazon S3 bucket every week and configure Maven to read from the bucket through an S3 gateway endpoint.',
    'Create an AWS CodeArtifact repository with an external connection to Maven Central and add only the com.amazonaws.region.codeartifact.api interface VPC endpoint.',
    'Create an AWS CodeArtifact repository whose upstream repository has an external connection to Maven Central, add the codeartifact.api and codeartifact.repositories interface endpoints and an S3 gateway endpoint, and grant the CodeBuild role CodeArtifact and sts:GetServiceBearerToken permissions.',
  ],
  answer: 3,
  explain: `**Từ khoá:** VPC **không có internet**, cần package từ Maven Central, kiểm soát/audit tập trung.

### Vì sao đáp án đúng
**CodeArtifact** là package repository managed. Repository có **upstream** gắn **external connection** tới {{public:maven-central}}: khi build yêu cầu package chưa có, **dịch vụ CodeArtifact** (không phải VPC của bạn) tải từ Maven Central và lưu lại. Từ VPC private, CodeBuild truy cập qua PrivateLink, cần:
- interface endpoint {{codeartifact.api}} (lấy auth token, API) và {{codeartifact.repositories}} (tải package);
- **S3 gateway endpoint**, vì asset của package được lưu trên S3.

Role của build cần {{codeartifact:GetAuthorizationToken}}, {{codeartifact:ReadFromRepository}} và {{sts:GetServiceBearerToken}}.

### Vì sao các phương án khác sai
- **NAT gateway**: vi phạm chính sách không internet, không có điểm kiểm soát package.
- **S3 thủ công**: overhead cao, Maven không đọc S3 trực tiếp mà không cần plugin.
- **Chỉ endpoint codeartifact.api**: thiếu endpoint repositories và S3 nên không tải được package.

> Exam tip: CodeArtifact private = **2 interface endpoint (api, repositories) + S3 gateway endpoint**. Upstream + external connection cho phép cache package public mà VPC không cần internet.`,
  services: ['AWS CodeArtifact', 'AWS CodeBuild', 'AWS PrivateLink', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'Working with Amazon VPC endpoints (CodeArtifact)', url: 'https://docs.aws.amazon.com/codeartifact/latest/ug/vpc-endpoints.html' }],
},
{
  id: 'dop-011',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company stores container images for its microservices in Amazon ECR. The security team requires that images be scanned for vulnerabilities in both operating system packages and programming language packages (for example, Java and Python libraries). Images that were pushed months ago must be re-evaluated automatically when new CVEs are published, and the team must be notified about critical findings. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    'Enable basic scanning with scan on push for all repositories and create an Amazon EventBridge rule for the ECR Image Scan event.',
    'Add a step to every AWS CodeBuild project that runs an open source scanner on the image before it is pushed to Amazon ECR.',
    'Enable Amazon ECR enhanced scanning with continuous scanning, and create an Amazon EventBridge rule that sends critical Amazon Inspector findings to an Amazon SNS topic.',
    'Enable Amazon GuardDuty Runtime Monitoring for Amazon ECS and send GuardDuty findings to an Amazon SNS topic.',
  ],
  answer: 2,
  explain: `**Từ khoá:** OS **và** language packages, ảnh cũ phải **tự đánh giá lại** khi có CVE mới, thông báo, LEAST overhead.

### Vì sao đáp án đúng
ECR có hai chế độ scan ở cấp registry:
| | Basic scanning | Enhanced scanning |
|---|---|---|
| Engine | AWS native | **Amazon Inspector** |
| Phạm vi | lỗ hổng OS package | OS **+ programming language packages** |
| Tần suất | scan on push hoặc manual | scan on push + **continuous scanning** (tự scan lại khi có CVE mới) |

Findings của Inspector đi vào EventBridge, nên lọc severity CRITICAL rồi gửi SNS.

### Vì sao các phương án khác sai
- **Basic scanning**: chỉ OS package và chỉ scan lúc push/manual, không tự đánh giá lại ảnh cũ.
- **Scanner trong CodeBuild**: chỉ scan lúc build; ảnh cũ không được scan lại khi có CVE mới; phải tự duy trì tool.
- **GuardDuty Runtime Monitoring**: phát hiện hành vi đe doạ khi container chạy, không phải quét CVE trong image.

> Exam tip: "language packages" hoặc "continuous / rescan when new CVEs" → **ECR enhanced scanning (Inspector)**.`,
  services: ['Amazon ECR', 'Amazon Inspector', 'Amazon EventBridge', 'Amazon SNS'],
  refs: [{ type: 'doc', title: 'Scan images for software vulnerabilities in Amazon ECR', url: 'https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html' }],
},
{
  id: 'dop-012',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A team hosts its source code in GitHub and uses AWS CodeBuild. The team wants unit tests to run automatically whenever a pull request is opened or updated, and wants test pass/fail counts and trends to be visible in the AWS console without building a custom dashboard. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    'Configure a CodeBuild webhook for the GitHub source with a filter group for the PULL_REQUEST_CREATED and PULL_REQUEST_UPDATED events.',
    'Create an Amazon CloudWatch Synthetics canary that runs the unit tests every 5 minutes.',
    'Add a reports section to the buildspec that points to the JUnit XML files produced by the test framework.',
    'Add a BeforeAllowTraffic hook in AWS CodeDeploy that runs the unit tests.',
    'Enable AWS X-Ray tracing on the CodeBuild project to collect test results.',
  ],
  answer: [0, 2],
  multi: true,
  explain: `**Từ khoá:** chạy test khi **pull request** mở/cập nhật, xem kết quả test trong console, không tự làm dashboard.

### Vì sao đáp án đúng
- **CodeBuild webhook** với GitHub (hoặc GitHub Enterprise, Bitbucket, GitLab) hỗ trợ filter group theo sự kiện: {{PUSH}}, {{PULL_REQUEST_CREATED}}, {{PULL_REQUEST_UPDATED}}, {{PULL_REQUEST_MERGED}}… CodeBuild còn báo build status ngược lại PR.
- **Test reports**: khai báo {{reports}} trong buildspec (định dạng JUnit XML, Cucumber, TestNG…; code coverage JaCoCo, Cobertura…). CodeBuild tạo report group, hiển thị số test pass/fail, thời gian và xu hướng qua các lần chạy.

~~~yaml
reports:
  unit-tests:
    files: ['**/*.xml']
    base-directory: target/surefire-reports
    file-format: JUNITXML
~~~

### Vì sao các phương án khác sai
- **Synthetics canary**: giám sát endpoint/UI định kỳ trên môi trường đang chạy, không phải unit test theo PR.
- **CodeDeploy hook**: chạy lúc deploy, quá muộn so với lúc review PR.
- **X-Ray**: tracing request phân tán, không thu thập kết quả test.

> Exam tip: "run tests on pull requests" → CodeBuild webhook filter (hoặc trigger pull request của CodePipeline V2). "visualize test results" → **CodeBuild test reports**.`,
  services: ['AWS CodeBuild', 'GitHub'],
  refs: [{ type: 'doc', title: 'Test reports in AWS CodeBuild', url: 'https://docs.aws.amazon.com/codebuild/latest/userguide/test-reporting.html' }],
},
{
  id: 'dop-013',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company wants to build a hardened Amazon Linux golden AMI every month with the latest patches and the company's monitoring agent. The AMI must be tested, then distributed to three AWS Regions, and the launch templates used by Auto Scaling groups in those Regions must automatically reference the new AMI. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    'Create an EC2 Image Builder pipeline with an image recipe, test components, a monthly schedule, and a distribution configuration that targets the three Regions and updates the launch templates with the new AMI ID.',
    'Run an AWS Systems Manager Automation runbook on a schedule to create the AMI, then use an AWS Lambda function to copy it to each Region and create new launch template versions.',
    'Run HashiCorp Packer on an Amazon EC2 instance from a cron job, and update the launch templates manually after each build.',
    'Create an Amazon Data Lifecycle Manager policy that creates monthly AMIs of a reference instance and copies them to the three Regions.',
  ],
  answer: 0,
  explain: `**Từ khoá:** golden AMI hằng tháng, **test**, **phân phối 3 Region**, launch template **tự cập nhật**, LEAST overhead.

### Vì sao đáp án đúng
**EC2 Image Builder** là dịch vụ managed cho đúng việc này:
- **Image recipe**: base image + build components (cài agent, hardening) + test components.
- **Image pipeline**: chạy theo lịch (cron) hoặc khi base image có bản mới.
- **Distribution configuration**: copy AMI sang nhiều Region/account, chia sẻ launch permission, và **launch template configuration** để tạo version mới của launch template trỏ tới AMI mới (có thể đặt làm default version).
Sau đó ASG có thể dùng **instance refresh** để thay instance.

### Vì sao các phương án khác sai
- **SSM Automation + Lambda**: làm được nhưng phải tự viết và duy trì code copy AMI, cập nhật launch template.
- **Packer + cron + sửa tay**: nhiều vận hành nhất, có bước thủ công.
- **DLM**: tạo AMI/snapshot theo lịch từ instance có sẵn và copy cross-Region, nhưng không build/patch/test image và không cập nhật launch template.

> Exam tip: "golden AMI / container image pipeline, patch + test + distribute" → **EC2 Image Builder**. DLM chỉ để backup EBS snapshot/AMI.`,
  services: ['EC2 Image Builder', 'Amazon EC2', 'Amazon EC2 Auto Scaling'],
  refs: [{ type: 'doc', title: 'What is EC2 Image Builder?', url: 'https://docs.aws.amazon.com/imagebuilder/latest/userguide/what-is-image-builder.html' }],
},
{
  id: 'dop-014',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company has an AWS CodePipeline pipeline in us-east-1 that builds a container image and deploys it to an Amazon ECS service in us-east-1 by using the Amazon ECS deploy action. The company now runs an identical ECS service in eu-west-1 and wants the same pipeline execution to deploy to both Regions after a single build. Which solution will meet these requirements with the LEAST operational overhead?`,
  options: [
    'Create a second pipeline in eu-west-1 and use Amazon S3 Cross-Region Replication to copy the build output so that it triggers the second pipeline.',
    'Add an Amazon ECS deploy action whose Region is set to eu-west-1, and configure an artifact store S3 bucket in eu-west-1 for the pipeline.',
    'Add an AWS Lambda invoke action in us-east-1 that calls the ECS UpdateService API in eu-west-1.',
    'Move the pipeline to a CloudFormation StackSet so that the pipeline is created in both Regions.',
  ],
  answer: 1,
  explain: `**Từ khoá:** một pipeline, một lần build, deploy **hai Region**, LEAST overhead.

### Vì sao đáp án đúng
CodePipeline hỗ trợ **cross-Region actions**: mỗi action có thể khai báo {{region}}. Điều kiện là pipeline có **artifact store (S3 bucket) ở mỗi Region** có action (cấu trúc {{artifactStores}} thay cho {{artifactStore}}). CodePipeline tự copy artifact từ Region của pipeline sang bucket ở Region đích trước khi chạy action. Nếu dùng KMS key cho artifact, mỗi Region cần key tương ứng. Console tự tạo bucket khi bạn thêm action cross-Region.

### Vì sao các phương án khác sai
- **Pipeline thứ hai + CRR**: hai pipeline phải giữ đồng bộ, khó theo dõi một release, nhiều overhead hơn.
- **Lambda gọi UpdateService**: tự viết code, mất tính năng sẵn có của ECS deploy action (đợi deployment ổn định, báo lỗi).
- **StackSet nhân bản pipeline**: tạo hai pipeline độc lập, mỗi cái build riêng, trái yêu cầu "single build".

> Exam tip: "single pipeline, multiple Regions" → **cross-Region action + artifact bucket mỗi Region**. Image ECR có thể cần replication sang Region đích (ECR cross-Region replication) để task pull gần hơn.`,
  services: ['AWS CodePipeline', 'Amazon ECS', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'Add a cross-Region action in CodePipeline', url: 'https://docs.aws.amazon.com/codepipeline/latest/userguide/actions-create-cross-region.html' }],
},
{
  id: 'dop-015',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company hosts a web application on AWS Elastic Beanstalk with a load-balanced environment. For each new version, the company wants to send 10% of incoming requests to new instances running the new version for 10 minutes while keeping full capacity on the old version. If the new instances become unhealthy during that period, Elastic Beanstalk must automatically return all traffic to the old version. Which deployment policy should the company use?`,
  options: [
    'Rolling with additional batch',
    'Immutable',
    'Rolling',
    'Traffic splitting',
  ],
  answer: 3,
  explain: `**Từ khoá:** gửi **10% request** sang bản mới trong **10 phút**, giữ nguyên capacity, tự quay lại nếu unhealthy, đây chính là canary.

### Vì sao đáp án đúng
**Traffic splitting** tạo một nhóm instance mới (Auto Scaling group tạm) chạy bản mới, rồi dùng weighted target group của ALB để chuyển một tỷ lệ % request (ví dụ 10%) sang đó trong **evaluation time** (ví dụ 10 phút). Nếu health của instance mới tốt, Beanstalk chuyển toàn bộ traffic và terminate instance cũ; nếu không, traffic quay về bản cũ ngay. Capacity cũ không giảm.

### Vì sao các phương án khác sai
- **Rolling with additional batch**: thêm một batch để giữ capacity, nhưng cập nhật từng batch, không chia % traffic; rollback phải deploy lại.
- **Immutable**: cũng tạo instance mới trong ASG tạm và rollback nhanh bằng cách terminate chúng, nhưng instance mới nhận traffic theo số lượng instance, không có cấu hình % và thời gian đánh giá.
- **Rolling**: giảm capacity trong lúc deploy, các batch đã cập nhật phải deploy lại để rollback.

> Exam tip: Beanstalk "canary / percentage of traffic / evaluation time" → **Traffic splitting**. "Fastest rollback, new instances, no mixed versions on the same instances" → **Immutable**. Blue/green thật sự → hai environment + **swap environment URLs** (CNAME swap).`,
  services: ['AWS Elastic Beanstalk', 'Elastic Load Balancing'],
  refs: [{ type: 'doc', title: 'Deployment policies and settings (Elastic Beanstalk)', url: 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.rolling-version-deploy.html' }],
},
{
  id: 'dop-016',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company uses AWS CodeDeploy in-place deployments to an Amazon EC2 Auto Scaling group. During a deployment of version 2, a scale-out event launched three new instances. After the deployment finished successfully, the three new instances were still running version 1, and the deployment group configuration shows that outdated instances are ignored. The company wants instances that launch during a deployment to end up on the newest revision without manual intervention. What should a DevOps engineer do?`,
  options: [
    'Change the deployment group setting so that CodeDeploy automatically updates outdated instances, which makes CodeDeploy start a follow-on deployment to the instances that received the older revision.',
    'Suspend the Launch process of the Auto Scaling group for the entire duration of every deployment.',
    'Change the deployment configuration from CodeDeployDefault.OneAtATime to CodeDeployDefault.AllAtOnce so that the deployment finishes before any scale-out event can occur.',
    'Add a user data script to the launch template that downloads the latest build artifact from Amazon S3 at boot.',
  ],
  answer: 0,
  explain: `**Từ khoá:** scale-out **trong lúc deploy**, instance mới nhận **revision cũ**, cấu hình outdated instances đang là ignore.

### Vì sao đáp án đúng
CodeDeploy cài **launch lifecycle hook** vào ASG: instance mới vào trạng thái {{Pending:Wait}} và được deploy **revision thành công gần nhất**. Nếu scale-out xảy ra giữa lúc đang deploy version 2, revision thành công gần nhất vẫn là version 1, nên instance mới chạy version 1. Mặc định CodeDeploy xử lý bằng cách **tự chạy follow-on deployment** ngay sau deployment đầu để cập nhật các **outdated instances** (API: {{outdatedInstancesStrategy = UPDATE}}). Ở đây cấu hình đã bị đặt thành IGNORE, nên chỉ cần bật lại.

### Vì sao các phương án khác sai
- **Suspend Launch**: ASG không thể scale-out (và không thay instance hỏng) khi đang deploy, giảm khả năng chịu tải; vẫn phải thao tác thủ công/script.
- **AllAtOnce**: chỉ rút ngắn thời gian, không loại bỏ race với scale-out và gây downtime toàn fleet.
- **User data tải artifact**: đi vòng qua CodeDeploy, tạo trạng thái lệch so với deployment group và lifecycle hook của CodeDeploy.

> Exam tip: nhớ hai hook ASG mà CodeDeploy cài: **launch hook** (luôn bật, deploy revision cuối thành công) và **termination hook** (tuỳ chọn, chạy ApplicationStop/BeforeBlockTraffic… khi scale-in).`,
  services: ['AWS CodeDeploy', 'Amazon EC2 Auto Scaling'],
  refs: [{ type: 'doc', title: 'Integrating CodeDeploy with Amazon EC2 Auto Scaling', url: 'https://docs.aws.amazon.com/codedeploy/latest/userguide/integrations-aws-auto-scaling.html' }],
},
{
  id: 'dop-017',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A DevOps engineer must update a production AWS CloudFormation stack that contains an Amazon RDS DB instance, an Auto Scaling group, and several security groups. The change management board requires a list of exactly which resources will be added, modified, or replaced, including whether any replacement will occur, before the update is applied. Which approach should the engineer use?`,
  options: [
    'Run drift detection on the stack and attach the drift report to the change request.',
    'Run aws cloudformation validate-template on the new template and attach the output to the change request.',
    'Create a change set for the stack with the new template, review the Replacement value of each change, and execute the change set after approval.',
    'Apply a stack policy that denies Update:Replace on all resources and update the stack directly.',
  ],
  answer: 2,
  explain: `**Từ khoá:** cần biết **trước** tài nguyên nào bị add/modify/**replace** rồi mới apply.

### Vì sao đáp án đúng
**Change set** so sánh template/parameter mới với stack hiện tại và liệt kê từng thay đổi: {{Action}} (Add, Modify, Remove, Dynamic, Import), {{Replacement}} (True, False, Conditional) và thuộc tính nào gây ra thay đổi. Chưa có gì bị sửa cho tới khi bạn **execute** change set, nên phù hợp với quy trình phê duyệt. Trong pipeline, CodePipeline có action CloudFormation CHANGE_SET_REPLACE + manual approval + CHANGE_SET_EXECUTE.

### Vì sao các phương án khác sai
- **Drift detection**: so sánh cấu hình thực tế với template **hiện tại** của stack, không cho biết template mới sẽ thay đổi gì.
- **validate-template**: chỉ kiểm tra cú pháp và trả về parameter, không phân tích tác động.
- **Stack policy deny Update:Replace**: ngăn replacement nhưng không cung cấp danh sách thay đổi, update có thể fail giữa chừng.

> Exam tip: "preview / review changes before update" → **change set**. Lưu ý {{Replacement: Conditional}} nghĩa là phụ thuộc giá trị lúc chạy; RDS bị replace = mất dữ liệu nếu không có snapshot.`,
  services: ['AWS CloudFormation'],
  refs: [{ type: 'doc', title: 'Update CloudFormation stacks using change sets', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html' }],
},
{
  id: 'dop-018',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company manages all infrastructure with AWS CloudFormation. Engineers sometimes change security groups and other resources directly in the console during incidents and forget to update the templates. The company wants to detect these out-of-band changes automatically on a schedule and notify the platform team, with the LEAST custom code. Which solution meets these requirements?`,
  options: [
    'Create an AWS CloudTrail trail and an AWS Lambda function that compares every API call with the resources declared in each stack template.',
    'Deploy the AWS Config managed rule cloudformation-stack-drift-detection-check, and use an Amazon EventBridge rule on the rule compliance change to notify the team through Amazon SNS.',
    'Apply a stack policy to every stack that denies all updates to security groups.',
    'Enable termination protection on every stack and subscribe the team to stack events through Amazon SNS notification ARNs.',
  ],
  answer: 1,
  explain: `**Từ khoá:** phát hiện **out-of-band changes** (drift) tự động, theo lịch, thông báo, LEAST custom code.

### Vì sao đáp án đúng
CloudFormation **drift detection** so sánh cấu hình thực tế của tài nguyên với template. AWS Config có managed rule **cloudformation-stack-drift-detection-check**: rule gọi DetectStackDrift theo chu kỳ (periodic) và đánh dấu stack NON_COMPLIANT khi có drift. Sự kiện thay đổi compliance đi vào EventBridge, chuyển tới SNS. Không cần viết code.

### Vì sao các phương án khác sai
- **CloudTrail + Lambda so sánh**: tự xây lại drift detection, nhiều code, dễ sai.
- **Stack policy**: chỉ bảo vệ tài nguyên khi cập nhật **qua CloudFormation**; thay đổi trực tiếp trong console không bị stack policy chặn.
- **Termination protection + stack events**: chỉ chặn xoá stack; thay đổi ngoài CloudFormation không sinh stack event.

> Exam tip: "detect manual changes to CloudFormation-managed resources" → **drift detection**, tự động hoá bằng Config rule **cloudformation-stack-drift-detection-check**. Muốn ngăn thay đổi trong console thì dùng IAM/SCP, không phải stack policy.`,
  services: ['AWS CloudFormation', 'AWS Config', 'Amazon EventBridge', 'Amazon SNS'],
  refs: [{ type: 'doc', title: 'cloudformation-stack-drift-detection-check', url: 'https://docs.aws.amazon.com/config/latest/developerguide/cloudformation-stack-drift-detection-check.html' }],
},
{
  id: 'dop-019',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company uses AWS Organizations with all features enabled. The security team must deploy a baseline CloudFormation template (an IAM role, AWS Config rules, and an Amazon SNS topic) to every account in the Workloads OU in two Regions. Accounts that are added to the OU in the future must receive the baseline automatically, and the solution must require the LEAST operational overhead. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    'Create the AWSCloudFormationStackSetAdministrationRole and AWSCloudFormationStackSetExecutionRole IAM roles manually in every account.',
    'Activate trusted access for CloudFormation StackSets with AWS Organizations.',
    'Create an Amazon EventBridge rule for the CreateAccountResult event that invokes a Lambda function to add stack instances for the new account.',
    'Create a stack set with service-managed permissions that targets the Workloads OU in both Regions with automatic deployment enabled.',
    'Create a nested stack in the management account that has one child stack for each member account.',
  ],
  answer: [1, 3],
  multi: true,
  explain: `**Từ khoá:** mọi account trong OU, nhiều Region, **account mới tự động nhận**, LEAST overhead.

### Vì sao đáp án đúng
StackSets có hai mô hình quyền:
| | Self-managed | Service-managed |
|---|---|---|
| IAM role | tự tạo admin/execution role ở mỗi account | StackSets tự tạo role qua Organizations |
| Target | danh sách account ID | **OU** (hoặc account) |
| Account mới | phải thêm tay | **automatic deployment** |

Để dùng service-managed, phải **activate trusted access** giữa StackSets và Organizations (từ management account; có thể đăng ký delegated administrator). Sau đó tạo stack set target OU + 2 Region và bật **automatic deployment**: account mới vào OU tự được deploy, account rời OU có thể giữ hoặc xoá stack.

### Vì sao các phương án khác sai
- **Tự tạo role ở mọi account**: là mô hình self-managed, account mới vẫn phải xử lý tay.
- **EventBridge + Lambda**: tự viết code cho việc automatic deployment đã làm sẵn.
- **Nested stack**: nested stack chỉ chạy trong cùng account/Region với stack cha, không deploy sang account khác.

> Exam tip: "all accounts in an OU, including new ones" → **StackSets service-managed + automatic deployment**. Lưu ý: stack set service-managed không deploy vào chính management account.`,
  services: ['AWS CloudFormation', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'Activate trusted access for stack sets with AWS Organizations', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-orgs-activate-trusted-access.html' }],
},
{
  id: 'dop-020',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A CloudFormation template uses a Lambda-backed custom resource to register the application with a third-party monitoring service. Stack creation works, but when the stack is deleted, the stack stays in DELETE_IN_PROGRESS for about one hour and then fails. Logs show that the Lambda function throws an exception on Delete requests because the third-party record no longer exists. What should a DevOps engineer do to make stack operations complete promptly and report errors correctly?`,
  options: [
    'Increase the Lambda function timeout to 15 minutes so that the delete request has more time to finish.',
    'Set DeletionPolicy: Retain on every other resource in the stack so that only the custom resource is deleted.',
    'Make the Lambda function call cfn-signal with the exit code of the delete operation.',
    'Update the function so that it always sends a SUCCESS or FAILED response to the pre-signed ResponseURL for every request type, using try/finally logic, and treats a missing record on Delete as success.',
  ],
  answer: 3,
  explain: `**Từ khoá:** custom resource treo **khoảng 1 giờ**, function lỗi khi Delete.

### Vì sao đáp án đúng
Với custom resource, CloudFormation gửi request (Create/Update/Delete) kèm **ResponseURL** (pre-signed S3 URL) rồi **chờ** function PUT kết quả JSON (Status SUCCESS/FAILED, PhysicalResourceId…) lên URL đó. Nếu function crash mà không gửi response, CloudFormation chờ tới timeout của custom resource (mặc định 1 giờ) rồi mới fail. Cách sửa gốc: bọc logic trong try/except/finally, **luôn gửi response** cho mọi request type; với Delete, record không tồn tại nghĩa là trạng thái mong muốn đã đạt nên trả SUCCESS (idempotent).

### Vì sao các phương án khác sai
- **Tăng Lambda timeout**: function vẫn ném exception, vẫn không gửi response; CloudFormation vẫn chờ.
- **DeletionPolicy: Retain cho tài nguyên khác**: không liên quan tới việc custom resource không trả lời.
- **cfn-signal**: là helper script cho CreationPolicy/WaitCondition trên EC2/ASG, không phải cơ chế phản hồi của custom resource.

> Exam tip: custom resource treo lâu = **function không gửi response tới ResponseURL**. Dùng thư viện cfn-response (ZipFile inline) hoặc crhelper, xử lý cả Delete. Thuộc tính ServiceTimeout có thể rút ngắn thời gian chờ nhưng không thay được việc phản hồi đúng.`,
  services: ['AWS CloudFormation', 'AWS Lambda'],
  refs: [{ type: 'doc', title: 'Create custom provisioning logic with custom resources', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-custom-resources.html' }],
},
{
  id: 'dop-021',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A CloudFormation stack manages an Amazon RDS for PostgreSQL DB instance (not Aurora). The company must keep a final copy of the database data if the stack is deleted, if the DB instance resource is removed from the template, or if a future template update requires CloudFormation to replace the DB instance. Which configuration of the AWS::RDS::DBInstance resource meets these requirements?`,
  options: [
    'Set DeletionPolicy: Snapshot and UpdateReplacePolicy: Snapshot.',
    'Set DeletionPolicy: Retain only.',
    'Enable termination protection on the stack and keep DeletionPolicy: Delete.',
    'Set an UpdatePolicy with AutoScalingReplacingUpdate and WillReplace: false.',
  ],
  answer: 0,
  explain: `**Từ khoá:** giữ dữ liệu khi **xoá stack**, khi **bỏ resource khỏi template** và khi **update cần replace**.

### Vì sao đáp án đúng
Hai thuộc tính khác nhau:
- **DeletionPolicy**: áp dụng khi resource bị xoá vì xoá stack **hoặc** bị bỏ khỏi template. Giá trị: Delete, Retain, RetainExceptOnCreate, Snapshot (chỉ cho resource hỗ trợ snapshot như RDS DBInstance/DBCluster, EBS Volume, ElastiCache, Redshift…).
- **UpdateReplacePolicy**: áp dụng cho **tài nguyên cũ** khi update làm CloudFormation tạo tài nguyên thay thế rồi xoá bản cũ. Mặc định là Delete.

Đặt cả hai là **Snapshot** thì mọi đường xoá DB đều để lại snapshot cuối.

### Vì sao các phương án khác sai
- **Chỉ DeletionPolicy: Retain**: không bảo vệ trường hợp replacement (UpdateReplacePolicy mặc định Delete), và Retain để lại instance tiếp tục tính tiền chứ không phải bản sao dữ liệu.
- **Termination protection**: chỉ ngăn xoá cả stack; bỏ resource khỏi template hay replacement vẫn xoá DB.
- **UpdatePolicy AutoScalingReplacingUpdate**: chỉ dành cho AWS::AutoScaling::AutoScalingGroup.

> Exam tip: "replacement" → **UpdateReplacePolicy**; "stack deleted / resource removed" → **DeletionPolicy**. Tài nguyên dữ liệu quan trọng nên có cả hai.`,
  services: ['AWS CloudFormation', 'Amazon RDS'],
  refs: [{ type: 'doc', title: 'UpdateReplacePolicy attribute', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatereplacepolicy.html' }],
},
{
  id: 'dop-022',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A CloudFormation template launches an Amazon EC2 instance whose user data runs cfn-init to install and configure an application from the AWS::CloudFormation::Init metadata. The stack reaches CREATE_COMPLETE about 1 minute after launch, but the application is not ready until about 10 minutes later, and sometimes cfn-init fails without the stack noticing. The team wants the stack to succeed only after the application is configured, and to fail if configuration fails. What should the team do?`,
  options: [
    'Add a DependsOn attribute to the EC2 instance that references the security group and the IAM instance profile.',
    'Add an Outputs section that returns the application URL so that CloudFormation tests the URL before completing.',
    'Add a CreationPolicy with ResourceSignal (Count 1, Timeout PT15M) to the instance and run cfn-signal with the exit status of cfn-init at the end of the user data.',
    'Increase the stack creation timeout to 15 minutes by using the --timeout-in-minutes option.',
  ],
  answer: 2,
  explain: `**Từ khoá:** stack complete **trước khi** app cấu hình xong; muốn stack **chờ** và **fail** khi cfn-init lỗi.

### Vì sao đáp án đúng
Mặc định CloudFormation coi EC2 instance là xong ngay khi instance ở trạng thái running. **CreationPolicy** với **ResourceSignal** bắt CloudFormation chờ đủ {{Count}} tín hiệu SUCCESS trong {{Timeout}} (định dạng ISO 8601, ví dụ PT15M). Cuối user data, gọi **cfn-signal** với exit code của cfn-init ({{-e}} nhận mã thoát): mã 0 = SUCCESS, khác 0 = FAILURE → resource fail → stack rollback. Không đủ tín hiệu trước timeout cũng fail.

Quy trình điển hình: cfn-init đọc metadata AWS::CloudFormation::Init (packages, files, services), sau đó cfn-signal; cfn-hup có thể chạy nền để áp dụng thay đổi metadata khi update stack.

### Vì sao các phương án khác sai
- **DependsOn**: chỉ quy định thứ tự tạo resource, không chờ cấu hình bên trong instance.
- **Outputs**: CloudFormation không kiểm tra URL trong Outputs.
- **--timeout-in-minutes**: giới hạn thời gian tối đa của cả stack, không làm stack chờ app.

> Exam tip: "wait until software is installed / signal success" → **CreationPolicy + cfn-signal** (với ASG dùng Count = số instance hoặc MinSuccessfulInstancesPercent). WaitCondition là cách cũ, dùng khi cần tín hiệu từ nguồn ngoài.`,
  services: ['AWS CloudFormation', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'CreationPolicy attribute', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-creationpolicy.html' }],
},
{
  id: 'dop-023',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `An Auto Scaling group of 8 instances is defined in a CloudFormation template. When the AMI ID in the launch template changes, the team wants CloudFormation to replace instances inside the existing group in batches of 2, keep at least 6 instances in service, continue only after each new instance reports that the application is healthy, and roll back the update if new instances do not report success. Which configuration meets these requirements?`,
  options: [
    'Add a CreationPolicy with AutoScalingCreationPolicy MinSuccessfulInstancesPercent 75 to the Auto Scaling group.',
    'Add an UpdatePolicy with AutoScalingRollingUpdate (MaxBatchSize 2, MinInstancesInService 6, WaitOnResourceSignals true, PauseTime PT15M) and run cfn-signal from the instances after the health check passes.',
    'Add an UpdatePolicy with AutoScalingScheduledAction IgnoreUnmodifiedGroupSizeProperties true.',
    'Set DeletionPolicy: Retain on the launch template so that old instances are kept until the new instances are healthy.',
  ],
  answer: 1,
  explain: `**Từ khoá:** thay instance **trong group hiện tại**, **theo batch**, giữ tối thiểu số instance, **chờ tín hiệu**, rollback nếu fail.

### Vì sao đáp án đúng
**UpdatePolicy AutoScalingRollingUpdate** điều khiển cách CloudFormation thay instance khi launch template/launch configuration đổi:
- {{MaxBatchSize}}: số instance thay mỗi đợt.
- {{MinInstancesInService}}: số instance tối thiểu vẫn phục vụ.
- {{WaitOnResourceSignals: true}} + {{PauseTime}}: chờ mỗi instance mới gửi **cfn-signal** trong thời gian PauseTime.
- Nếu thiếu tín hiệu (hoặc tỉ lệ thành công dưới MinSuccessfulInstancesPercent), update fail và stack **rollback**.

### Vì sao các phương án khác sai
- **CreationPolicy**: chỉ áp dụng lúc **tạo** resource, không điều khiển update.
- **AutoScalingScheduledAction**: tránh việc update stack ghi đè MinSize/MaxSize/DesiredCapacity khi có scheduled action; không thay instance.
- **DeletionPolicy trên launch template**: không liên quan tới việc thay instance.

> Exam tip: phân biệt **AutoScalingRollingUpdate** (thay trong group cũ theo batch) và **AutoScalingReplacingUpdate** với {{WillReplace: true}} (tạo ASG mới hoàn toàn, rollback nhanh bằng cách xoá ASG mới). Ngoài CloudFormation, ASG còn có **instance refresh**.`,
  services: ['AWS CloudFormation', 'Amazon EC2 Auto Scaling'],
  refs: [{ type: 'doc', title: 'UpdatePolicy attribute', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html' }],
},
{
  id: 'dop-024',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company defines its infrastructure with the AWS CDK and wants a pipeline in a central tools account (111111111111) to deploy CDK stacks to a staging account and a production account. The deployment must use IAM roles, not long-term credentials. Which step must be completed in the staging and production accounts to allow these cross-account CDK deployments?`,
  options: [
    'Run cdk bootstrap only in the tools account and pass the target account IDs with the --trust option.',
    'Create an IAM user in each target account and store its access keys as CDK context values in cdk.json.',
    'Run cdk synth in each target account and upload the templates to an S3 bucket that the tools account can read.',
    'Run cdk bootstrap in each target account and Region with --trust 111111111111 and --cloudformation-execution-policies that define the permissions for deployments.',
  ],
  answer: 3,
  explain: `**Từ khoá:** CDK, pipeline ở tools account, deploy sang account khác bằng role.

### Vì sao đáp án đúng
**Bootstrapping** tạo stack CDKToolkit trong **mỗi cặp account/Region** sẽ được deploy: S3 bucket chứa asset, ECR repository cho image asset và các IAM role (deploy role, file/image publishing role, lookup role, CloudFormation execution role). Tham số:
- {{--trust 111111111111}}: cho phép tools account assume các role bootstrap trong account đích.
- {{--cloudformation-execution-policies}}: managed policy gắn vào CloudFormation execution role, quyết định stack được tạo tài nguyên gì (bắt buộc khi dùng --trust).

CDK Pipelines (hoặc CodePipeline tự dựng) assume các role này để publish asset và deploy.

### Vì sao các phương án khác sai
- **Chỉ bootstrap tools account**: --trust phải đặt **ở account được deploy tới**, vì role nằm ở đó.
- **IAM user + access key trong cdk.json**: long-term credential, lộ trong source.
- **cdk synth ở account đích**: synth không cần account; vấn đề là quyền deploy, không phải template.

> Exam tip: lỗi "this stack uses assets... bootstrap" hoặc cross-account CDK → **cdk bootstrap ở account đích với --trust**. Mỗi Region cũng phải bootstrap riêng.`,
  services: ['AWS CDK', 'AWS CloudFormation', 'AWS IAM'],
  refs: [{ type: 'doc', title: 'AWS CDK bootstrapping', url: 'https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html' }],
},
{
  id: 'dop-025',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company wants development teams to provision approved environments (an Amazon RDS database and an Auto Scaling group with tagging and encryption standards) on their own. Developers must not have IAM permissions to create these resources directly, and they must be able to launch only the configurations that the platform team has approved. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    'Attach the AWSCloudFormationFullAccess managed policy to the developer role so that developers can launch the approved templates.',
    'Add a template constraint to restrict the instance types that developers can choose, and give developers the EC2 and RDS permissions that the template needs.',
    'Create an AWS Service Catalog portfolio with a product based on the approved CloudFormation template, and add a launch constraint that specifies an IAM role with the permissions needed to create the resources.',
    'Deploy the approved template to every developer account with CloudFormation StackSets.',
    'Grant the developer IAM role access to the portfolio and attach a Service Catalog end-user policy such as AWSServiceCatalogEndUserFullAccess.',
  ],
  answer: [2, 4],
  multi: true,
  explain: `**Từ khoá:** self-service, developer **không có quyền tạo tài nguyên trực tiếp**, chỉ được launch cấu hình **đã duyệt**.

### Vì sao đáp án đúng
**AWS Service Catalog**:
- **Product** = CloudFormation template đã chuẩn hoá (versioned); **portfolio** = tập product + quyền truy cập.
- **Launch constraint**: chỉ định IAM role mà Service Catalog dùng để tạo tài nguyên khi user launch. Developer chỉ cần quyền Service Catalog, không cần quyền EC2/RDS: đây chính là phần "không có quyền trực tiếp".
- **Grant access** cho IAM role/group/user vào portfolio, kèm policy end-user để xem và launch product.

Có thể chia sẻ portfolio cho cả Organization/OU.

### Vì sao các phương án khác sai
- **CloudFormation full access**: developer tự tạo stack với template bất kỳ, và vẫn cần quyền trên EC2/RDS.
- **Template constraint + cấp quyền EC2/RDS**: template constraint hữu ích để giới hạn giá trị parameter, nhưng cấp thẳng quyền EC2/RDS cho developer là trái yêu cầu.
- **StackSets**: platform team deploy thay developer, không phải self-service và không cho developer tự chọn khi nào launch.

> Exam tip: "users launch approved products without permissions to the underlying services" → **Service Catalog + launch constraint**. Template constraint = giới hạn parameter; tag option = tag bắt buộc.`,
  services: ['AWS Service Catalog', 'AWS CloudFormation', 'AWS IAM'],
  refs: [{ type: 'doc', title: 'AWS Service Catalog launch constraints', url: 'https://docs.aws.amazon.com/servicecatalog/latest/adminguide/constraints-launch.html' }],
},
{
  id: 'dop-026',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company runs several hundred Amazon EC2 instances that are managed by AWS Systems Manager. Every instance tagged Monitoring=true must have the Amazon CloudWatch agent installed and running with the configuration stored in Parameter Store. Instances launched in the future must be configured automatically, and if someone stops or removes the agent, it must be restored within 30 minutes. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    'Create Systems Manager State Manager associations that target the tag Monitoring=true and run AWS-ConfigureAWSPackage to install AmazonCloudWatchAgent and AmazonCloudWatch-ManageAgent to apply the Parameter Store configuration, on a 30-minute schedule.',
    'Use Systems Manager Run Command once with AWS-ConfigureAWSPackage on all instances that have the tag Monitoring=true.',
    'Add commands to the launch template user data that install and start the CloudWatch agent.',
    'Create an AWS Config rule that checks whether the CloudWatch agent process is running and sends an Amazon SNS notification when it is not.',
  ],
  answer: 0,
  explain: `**Từ khoá:** desired state cho **instance hiện tại và tương lai**, tự **khôi phục** khi bị gỡ, LEAST overhead.

### Vì sao đáp án đúng
**State Manager association** = "document X phải được áp dụng lên target Y theo lịch Z". Target dạng tag nên instance mới có tag tự được áp dụng khi được Systems Manager quản lý; lịch {{rate(30 minutes)}} chạy lại định kỳ, nên nếu agent bị gỡ/dừng, lần chạy sau sẽ cài và bật lại. Document:
- {{AWS-ConfigureAWSPackage}} với package AmazonCloudWatchAgent để cài;
- {{AmazonCloudWatch-ManageAgent}} với nguồn cấu hình {{ssm}} (tên parameter) để áp cấu hình và start agent.

### Vì sao các phương án khác sai
- **Run Command một lần**: không áp dụng cho instance mới và không tự sửa drift.
- **User data**: chỉ chạy lúc boot đầu tiên; không khôi phục khi agent bị gỡ, instance hiện có không được cài.
- **Config rule + SNS**: chỉ phát hiện và thông báo, không tự khắc phục (phải thêm remediation).

> Exam tip: "maintain desired configuration / enforce state on a schedule" → **State Manager**. "One-off command" → Run Command. "Multi-step runbook / approval" → Automation.`,
  services: ['AWS Systems Manager', 'Amazon CloudWatch', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'AWS Systems Manager State Manager', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-state.html' }],
},
{
  id: 'dop-027',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company has a mixed fleet of Amazon Linux 2023 and Windows Server instances managed by AWS Systems Manager. Security requires that critical and important security patches be installed automatically 7 days after release, during a Saturday 02:00 window, with no more than 20% of instances patched at the same time. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    'Create custom patch baselines for each operating system that auto-approve Critical and Important security patches 7 days after release, and associate them with the instances (for example, through patch groups).',
    'Create a State Manager association that runs AWS-ApplyPatchBaseline on all instances every Saturday.',
    'Enable Amazon Inspector and configure it to install missing patches when it finds vulnerabilities.',
    'Create a State Manager association that runs AWS-UpdateSSMAgent every Saturday at 02:00.',
    'Create a maintenance window for Saturday 02:00 with a Run Command task that runs AWS-RunPatchBaseline with Operation set to Install, targeting the instances by tag, with concurrency set to 20%.',
  ],
  answer: [0, 4],
  multi: true,
  explain: `**Từ khoá:** Linux + Windows, auto-approve sau **7 ngày**, chỉ Critical/Important, **khung giờ cố định**, tối đa 20% cùng lúc.

### Vì sao đáp án đúng
**Patch Manager** tách hai câu hỏi:
1. **Patch baseline** quyết định patch nào được duyệt: rule theo classification/severity + **auto-approval delay** (số ngày sau khi phát hành). Mỗi OS có baseline riêng; gắn baseline với instance qua **patch group** (tag key Patch Group hoặc PatchGroup) hoặc qua patch policy của Quick Setup.
2. **Khi nào và bao nhiêu instance**: **maintenance window** (cron Saturday 02:00) với task Run Command chạy {{AWS-RunPatchBaseline}} ({{Operation=Install}}, {{RebootOption}}), **max concurrency 20%** và max errors.

AWS-RunPatchBaseline hỗ trợ cả Linux, Windows, macOS.

### Vì sao các phương án khác sai
- **AWS-ApplyPatchBaseline**: document cũ, chỉ cho Windows; thiếu yêu cầu khung giờ và concurrency.
- **Inspector**: tìm lỗ hổng, không tự cài patch.
- **AWS-UpdateSSMAgent**: chỉ cập nhật SSM Agent, không vá OS.

> Exam tip: baseline = **cái gì**, maintenance window/patch policy = **khi nào**, AWS-RunPatchBaseline = **làm thế nào**. Operation=Scan để chỉ báo cáo compliance.`,
  services: ['AWS Systems Manager', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'AWS Systems Manager Patch Manager', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager.html' }],
},
{
  id: 'dop-028',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company runs an API on AWS Lambda. Product managers want to turn new features on and off without redeploying code, roll out a flag change gradually over 20 minutes, and have the change rolled back automatically if the API error rate alarm in Amazon CloudWatch goes into ALARM. The Lambda functions must read the flags with low latency and minimal code changes. Which solution meets these requirements?`,
  options: [
    'Store the flags in Lambda environment variables and publish a new function version with weighted aliases when a flag changes.',
    'Store the flags in Systems Manager Parameter Store and have each invocation call GetParameter directly.',
    'Store the flags as an AWS AppConfig feature flag configuration profile, deploy changes with a linear deployment strategy and a CloudWatch alarm monitor, and read the flags through the AWS AppConfig Agent Lambda extension.',
    'Store the flags in an Amazon DynamoDB table and write a Step Functions workflow that updates a percentage attribute every few minutes.',
  ],
  answer: 2,
  explain: `**Từ khoá:** feature flag không redeploy, **rollout dần**, **tự rollback theo alarm**, đọc nhanh.

### Vì sao đáp án đúng
**AWS AppConfig** (thuộc Systems Manager) quản lý cấu hình động:
- **Configuration profile** kiểu **feature flags** (có validator/JSON schema).
- **Deployment strategy**: Linear hoặc Exponential, thời gian triển khai (ví dụ 20 phút) và **bake time**. Trong lúc deploy và bake time, nếu **alarm monitor** gắn với environment vào ALARM, AppConfig **tự rollback** cấu hình.
- **AppConfig Agent Lambda extension** lấy cấu hình và cache cục bộ; function gọi HTTP localhost:2772, độ trễ thấp, giảm số lần gọi API.

### Vì sao các phương án khác sai
- **Env var + alias**: mỗi lần đổi flag là publish version mới, tức là redeploy; trái yêu cầu.
- **Parameter Store gọi trực tiếp**: không có rollout dần hay rollback theo alarm; gọi API mỗi invocation tăng latency và có thể bị throttle.
- **DynamoDB + Step Functions**: tự xây lại AppConfig, nhiều code.

> Exam tip: "feature flags / dynamic config with gradual deployment and automatic rollback on alarm" → **AppConfig**. Parameter Store là kho giá trị, không có deployment strategy.`,
  services: ['AWS AppConfig', 'AWS Lambda', 'Amazon CloudWatch'],
  refs: [{ type: 'doc', title: 'What is AWS AppConfig?', url: 'https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html' }],
},
{
  id: 'dop-029',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `An application runs on Amazon EC2 instances in an Auto Scaling group. When the group scales in, the application log files on the terminated instances are lost before they can be analyzed. The company wants the logs from each instance to be uploaded to Amazon S3 before the instance is terminated, with the LEAST custom infrastructure. Which solution meets these requirements?`,
  options: [
    'Add a shutdown script to the user data that copies the logs to Amazon S3 when the operating system halts.',
    'Add a lifecycle hook for EC2_INSTANCE_TERMINATING, create an Amazon EventBridge rule for the EC2 Instance-terminate Lifecycle Action event that runs a Systems Manager Run Command document to upload the logs, and complete the lifecycle action when the upload finishes.',
    'Enable termination protection on all instances in the Auto Scaling group and upload the logs manually before removing the protection.',
    'Change the termination policy of the Auto Scaling group to OldestInstance so that instances with the most logs are terminated last.',
  ],
  answer: 1,
  explain: `**Từ khoá:** làm việc gì đó **trước khi instance bị terminate** khi scale-in.

### Vì sao đáp án đúng
**Lifecycle hook** {{autoscaling:EC2_INSTANCE_TERMINATING}} đưa instance vào trạng thái {{Terminating:Wait}} thay vì terminate ngay. ASG phát sự kiện "EC2 Instance-terminate Lifecycle Action" lên EventBridge; rule chạy Run Command (hoặc Lambda/Automation) để upload log. Xong việc thì gọi {{complete-lifecycle-action}} với CONTINUE; nếu không, ASG chờ tới **heartbeat timeout** (mặc định 3600 giây) rồi áp dụng default result. Có thể gia hạn bằng {{record-lifecycle-action-heartbeat}}.

### Vì sao các phương án khác sai
- **Shutdown script**: không đảm bảo đủ thời gian và không có cơ chế báo hoàn thành; nếu network đã ngắt thì upload hỏng.
- **EC2 termination protection**: không ngăn ASG terminate khi scale-in (cần **instance scale-in protection** của ASG), và việc upload tay trái yêu cầu tự động.
- **Termination policy**: chỉ chọn instance nào bị terminate, không giữ log.

> Exam tip: "perform actions before instance terminates / after launches before InService" → **lifecycle hooks** (Pending:Wait, Terminating:Wait) + EventBridge/SNS/SQS + complete-lifecycle-action. Phương án hay hơn về lâu dài: đẩy log liên tục bằng CloudWatch agent.`,
  services: ['Amazon EC2 Auto Scaling', 'Amazon EventBridge', 'AWS Systems Manager', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'Amazon EC2 Auto Scaling lifecycle hooks', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html' }],
},
{
  id: 'dop-030',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A Java application on Amazon EC2 instances in an Auto Scaling group takes about 8 minutes after launch to load reference data into its local cache before it can serve traffic. During unpredictable traffic spikes, new instances are not ready in time and latency increases. The company wants to shorten the time to add capacity while keeping costs low when the extra capacity is not needed. Which solution meets these requirements?`,
  options: [
    'Create scheduled scaling actions that add instances every weekday at 09:00.',
    'Increase the default instance warmup of the Auto Scaling group to 8 minutes.',
    'Replace the instances with a larger instance type so that the cache loads faster.',
    'Add a warm pool to the Auto Scaling group with instances in the Stopped state, and use a lifecycle hook so that the data loading completes before instances enter the warm pool.',
  ],
  answer: 3,
  explain: `**Từ khoá:** khởi động **lâu** (8 phút), spike **không dự đoán được**, chi phí thấp khi không cần.

### Vì sao đáp án đúng
**Warm pool** giữ sẵn một nhóm instance đã khởi tạo xong bên cạnh ASG. Trạng thái có thể là **Stopped** (chỉ trả tiền EBS, rẻ nhất), **Hibernated** (giữ RAM trên đĩa) hoặc Running. Khi scale-out, ASG lấy instance từ warm pool (start lại) thay vì launch mới, nên bỏ được phần khởi tạo dài. Lifecycle hook ở lần launch đầu cho phép chạy xong bước nạp dữ liệu trước khi instance được chuyển vào trạng thái Warmed:Stopped. Ứng dụng nên làm mới dữ liệu khi start lại nếu dữ liệu có thể cũ.

### Vì sao các phương án khác sai
- **Scheduled scaling**: chỉ hợp với tải có lịch; spike ở đây không dự đoán được.
- **Default instance warmup**: chỉ là khoảng thời gian ASG bỏ qua metric của instance mới khi tính scaling, không làm instance sẵn sàng sớm hơn.
- **Instance lớn hơn**: tăng chi phí liên tục, không chắc giảm thời gian nạp dữ liệu (thường bị giới hạn bởi I/O/network).

> Exam tip: "long boot / initialization time" + "reduce scale-out latency cost-effectively" → **warm pool (Stopped)**. Tải có chu kỳ → predictive scaling hoặc scheduled scaling.`,
  services: ['Amazon EC2 Auto Scaling', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'Warm pools for Amazon EC2 Auto Scaling', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-warm-pools.html' }],
},
{
  id: 'dop-031',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company has an Auto Scaling group of 20 instances behind an Application Load Balancer. A new launch template version with a patched AMI has been created. The company wants to replace all instances with the new version while keeping at least 90% of the capacity healthy, and to return automatically to the previous launch template version if a CloudWatch alarm for application errors goes into ALARM during the replacement. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    'Start an instance refresh with a minimum healthy percentage of 90%, an instance warmup value, and auto rollback enabled with the CloudWatch alarm specified.',
    'Terminate two instances at a time manually and let the Auto Scaling group launch replacements from the new launch template version.',
    'Detach all instances from the group, attach new instances launched from the new AMI, and then terminate the detached instances.',
    'Create a second Auto Scaling group with the new launch template version and use a Lambda function to shift ALB listener weights between the groups.',
  ],
  answer: 0,
  explain: `**Từ khoá:** thay **toàn bộ** instance theo launch template mới, giữ **≥ 90%** healthy, **tự rollback** theo alarm, LEAST overhead.

### Vì sao đáp án đúng
**Instance refresh** là tính năng có sẵn của EC2 Auto Scaling để thay instance theo đợt:
- **MinHealthyPercentage** (ví dụ 90%) giới hạn số instance bị thay cùng lúc; MaxHealthyPercentage > 100% cho phép launch trước rồi mới terminate.
- **Instance warmup**: chờ instance mới healthy trước khi tiếp tục.
- **Checkpoints**: tạm dừng ở các mốc % để kiểm tra.
- **Skip matching**: bỏ qua instance đã đúng cấu hình.
- **Auto rollback** + **CloudWatch alarm**: khi refresh fail hoặc alarm vào ALARM, ASG tự rollback về cấu hình trước (launch template version cũ).

### Vì sao các phương án khác sai
- **Terminate tay**: vận hành thủ công, không có rollback tự động, dễ vượt ngưỡng capacity.
- **Detach/attach**: phức tạp, có thể giảm capacity, không có rollback.
- **ASG thứ hai + Lambda**: tự dựng blue/green bằng code, overhead cao.

> Exam tip: "replace instances to pick up a new AMI / launch template" → **instance refresh**. Bật auto rollback + alarm khi đề nói "automatically revert".`,
  services: ['Amazon EC2 Auto Scaling', 'Amazon CloudWatch', 'Elastic Load Balancing'],
  refs: [{ type: 'doc', title: 'Use an instance refresh to update instances in an Auto Scaling group', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/asg-instance-refresh.html' }],
},
{
  id: 'dop-032',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A web application runs on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer. Sometimes the application process hangs: the ALB target group marks the instance as unhealthy and stops routing traffic to it, but the Auto Scaling group never replaces the instance, and capacity slowly drops. What should a DevOps engineer do to make the group recover automatically?`,
  options: [
    'Increase the health check grace period of the Auto Scaling group to 900 seconds.',
    'Create a CloudWatch alarm with the EC2 recover action for each instance based on the StatusCheckFailed_System metric.',
    'Turn on Elastic Load Balancing health checks for the Auto Scaling group so that instances that fail the target group health check are replaced.',
    'Create an Amazon Route 53 health check for each instance and associate it with the Auto Scaling group.',
  ],
  answer: 2,
  explain: `**Từ khoá:** ALB thấy unhealthy nhưng **ASG không thay** instance.

### Vì sao đáp án đúng
Mặc định ASG chỉ dùng **EC2 health check** (trạng thái instance và status check của EC2). Process treo nhưng VM vẫn chạy nên EC2 health check vẫn healthy. Khi bật **ELB health checks** cho ASG (HealthCheckType ELB), ASG coi instance là unhealthy khi target group báo unhealthy, terminate và launch instance thay thế. **Health check grace period** cần đủ dài để instance mới khởi động xong trước khi bị đánh giá.

### Vì sao các phương án khác sai
- **Tăng grace period**: chỉ trì hoãn đánh giá cho instance mới; ASG vẫn chỉ dùng EC2 check nên vẫn không thay.
- **EC2 recover action trên StatusCheckFailed_System**: xử lý lỗi phần cứng/host, không phát hiện process ứng dụng treo; ngoài ra recovery không dùng cho instance trong ASG.
- **Route 53 health check**: không gắn trực tiếp được với ASG để thay instance.

> Exam tip: "ALB reports unhealthy but ASG doesn't replace" → **enable ELB health checks on the ASG**. Có thể thêm VPC Lattice health check hoặc custom health check qua SetInstanceHealth.`,
  services: ['Amazon EC2 Auto Scaling', 'Elastic Load Balancing'],
  refs: [{ type: 'doc', title: 'Health checks for instances in an Auto Scaling group', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-health-checks.html' }],
},
{
  id: 'dop-033',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company has an internal application that is reachable only through a Route 53 private hosted zone. The primary environment runs in us-east-1 behind an internal Application Load Balancer, and a standby environment runs in us-west-2. The company wants DNS to fail over to the standby automatically when the primary is unhealthy. Route 53 failover records are configured, but the team cannot make the health check reach the internal endpoint. Which solution should the team use?`,
  options: [
    'Create an HTTP health check that targets the private IP addresses of the internal ALB.',
    'Create a calculated health check with no child health checks and associate it with the primary record.',
    'Enable Evaluate Target Health on the secondary failover record only.',
    'Create an Amazon CloudWatch alarm on a metric that reflects the health of the primary (for example, the ALB HealthyHostCount), create a Route 53 health check based on the CloudWatch alarm, and associate it with the primary failover record.',
  ],
  answer: 3,
  explain: `**Từ khoá:** **private hosted zone**, endpoint **internal**, health check không tới được.

### Vì sao đáp án đúng
Route 53 health checker chạy từ các vị trí trên internet, nên **không thể kiểm tra trực tiếp endpoint có IP private** trong VPC. Giải pháp chính thức: tạo **CloudWatch alarm** trên metric phản ánh sức khoẻ (HealthyHostCount, 5xx, hoặc custom metric), rồi tạo **Route 53 health check loại "state of CloudWatch alarm"**. Health check này dựa vào dữ liệu CloudWatch, không gửi request vào VPC. Gắn nó với record failover PRIMARY; khi alarm vào ALARM, Route 53 trả về record SECONDARY.

### Vì sao các phương án khác sai
- **HTTP health check vào IP private**: health checker không route được tới địa chỉ private.
- **Calculated health check không có child**: calculated chỉ tổng hợp kết quả của các health check con; không có con thì không đo gì.
- **Evaluate Target Health trên record secondary**: không giúp phát hiện primary hỏng; record primary mới cần health check.

> Exam tip: "health check for private resource / private hosted zone" → **CloudWatch alarm-based health check**. Với alias tới ALB public, dùng **Evaluate Target Health**.`,
  services: ['Amazon Route 53', 'Amazon CloudWatch', 'Elastic Load Balancing'],
  refs: [{ type: 'doc', title: 'Configuring DNS failover in private hosted zones', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-private-hosted-zones.html' }],
},
{
  id: 'dop-034',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs an Aurora MySQL DB cluster in eu-west-1. A new requirement states that the database must be recoverable in eu-central-1 with an RPO of seconds and an RTO of a few minutes. The company also runs quarterly DR tests in which the primary Region is moved to eu-central-1 and later moved back, and these tests must not lose any data. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    'Add Aurora Replicas in three Availability Zones of eu-west-1 and enable automatic failover.',
    'Convert the cluster to an Aurora global database with a secondary cluster in eu-central-1, use switchover for the planned DR tests, and use the global database failover operation during a real Regional outage.',
    'Create a cross-Region Aurora read replica based on binary log replication, and promote it manually during tests and outages.',
    'Use AWS Backup to copy Aurora snapshots to eu-central-1 every hour and restore from the latest copy during tests and outages.',
  ],
  answer: 1,
  explain: `**Từ khoá:** cross-Region, **RPO vài giây**, **RTO vài phút**, DR test **chuyển đi rồi chuyển về không mất dữ liệu**.

### Vì sao đáp án đúng
**Aurora global database** sao chép ở tầng storage tới tối đa 5 secondary Region, độ trễ thường dưới 1 giây (RPO giây), promote secondary trong khoảng phút (RTO phút). Hai thao tác khác nhau:
- **Switchover** (trước đây gọi là managed planned failover): cho tình huống có kế hoạch như DR test; Aurora đồng bộ hết dữ liệu trước khi đổi vai trò, **RPO = 0**, topology giữ nguyên nên chuyển về dễ dàng.
- **Failover** (managed unplanned failover): khi Region chính hỏng; có thể mất lượng dữ liệu bằng replication lag.

### Vì sao các phương án khác sai
- **Aurora Replicas đa AZ**: chỉ chịu lỗi AZ, không bảo vệ khi cả Region hỏng.
- **Binlog cross-Region replica**: làm được nhưng lag lớn hơn, promote xong phải dựng lại replication theo chiều ngược, nhiều thao tác.
- **AWS Backup hằng giờ**: RPO tới 1 giờ, RTO là thời gian restore cluster, không đạt yêu cầu.

> Exam tip: Aurora + "cross-Region, RPO seconds, RTO minutes" → **Aurora global database**. "Planned / no data loss" → **switchover**; "Regional outage" → **failover**.`,
  services: ['Amazon Aurora', 'Amazon RDS'],
  refs: [{ type: 'doc', title: 'Using Amazon Aurora Global Database', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html' }],
},
{
  id: 'dop-035',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A gaming company stores player profiles in an Amazon DynamoDB table in us-east-1. The company is expanding to Europe and Asia and needs players in each Region to read and write their profiles with single-digit millisecond latency. The application must keep working in the other Regions if one Region becomes unavailable. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    'Convert the table to a DynamoDB global table with replicas in eu-west-1 and ap-northeast-1, deploy the application in each Region, and use Route 53 latency-based routing.',
    'Enable DynamoDB Streams and use AWS Lambda functions in each Region to replicate writes to tables in the other Regions.',
    'Create a DynamoDB Accelerator (DAX) cluster in each Region that points to the table in us-east-1.',
    'Create DynamoDB cross-Region read replicas in eu-west-1 and ap-northeast-1 and send all writes to us-east-1.',
  ],
  answer: 0,
  explain: `**Từ khoá:** đọc **và ghi** local ở nhiều Region, độ trễ ms, chịu lỗi Region, LEAST overhead.

### Vì sao đáp án đúng
**DynamoDB global tables** là bảng multi-Region, **multi-active**: mọi replica đều nhận ghi, DynamoDB tự sao chép giữa các Region (thường dưới 1 giây). Ở chế độ mặc định (eventual consistency giữa các Region), xung đột được giải quyết bằng **last writer wins**. Ứng dụng deploy ở mỗi Region và Route 53 latency-based routing đưa người dùng tới Region gần nhất; nếu một Region hỏng, các Region còn lại vẫn đọc ghi được.

### Vì sao các phương án khác sai
- **Streams + Lambda tự replicate**: tự viết logic replicate, xử lý xung đột và vòng lặp; chính là thứ global tables làm sẵn.
- **DAX ở mỗi Region**: DAX là cache trong một Region cho bảng cùng Region; không hỗ trợ trỏ tới bảng ở Region khác và không giúp ghi local.
- **Cross-Region read replicas**: DynamoDB không có khái niệm read replica cross-Region kiểu RDS; ghi tập trung về us-east-1 vừa chậm vừa phụ thuộc một Region.

> Exam tip: DynamoDB + "multi-Region, active-active, low-latency writes" → **global tables**. Nhớ: TTL, streams, auto scaling được cấu hình theo từng replica; ứng dụng nên tránh ghi cùng item ở nhiều Region đồng thời.`,
  services: ['Amazon DynamoDB', 'Amazon Route 53'],
  refs: [{ type: 'doc', title: 'Global tables: multi-Region replication for DynamoDB', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html' }],
},
{
  id: 'dop-036',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs workloads that use Amazon EBS volumes, Amazon RDS DB instances, Amazon EFS file systems, and Amazon DynamoDB tables. The company needs daily backups of every resource tagged backup=daily, kept for 35 days, with a copy of each backup stored in a second AWS Region for disaster recovery. New resources with the tag must be included automatically. Which combination of steps meets these requirements with the LEAST operational overhead? (Choose two.)`,
  options: [
    'Create Amazon Data Lifecycle Manager policies for the EBS volumes, RDS DB instances, EFS file systems, and DynamoDB tables.',
    'Create an AWS Backup backup plan with a daily rule, a 35-day retention, and a copy action to a backup vault in the second Region.',
    'Assign resources to the backup plan by using a tag-based resource assignment for backup=daily.',
    'Configure S3 Cross-Region Replication on the bucket that stores the EBS snapshots.',
    'Enable cross-Region automated backup replication on each RDS DB instance and use AWS Lambda to export DynamoDB and EFS data.',
  ],
  answer: [1, 2],
  multi: true,
  explain: `**Từ khoá:** nhiều loại tài nguyên, chọn theo **tag**, giữ 35 ngày, **copy sang Region khác**, tài nguyên mới tự được thêm.

### Vì sao đáp án đúng
**AWS Backup** quản lý backup tập trung cho EBS, EC2, RDS/Aurora, EFS, DynamoDB, FSx, S3…
- **Backup plan**: rule gồm lịch (cron daily), backup window, lifecycle/retention (35 ngày) và **copy action** tới vault ở Region (hoặc account) khác, có retention riêng cho bản copy.
- **Resource assignment** theo **tag**: tài nguyên nào gắn backup=daily, kể cả tạo sau, tự được backup.

### Vì sao các phương án khác sai
- **DLM**: chỉ quản lý EBS snapshot và EBS-backed AMI; không backup RDS, EFS, DynamoDB.
- **S3 CRR cho EBS snapshot**: EBS snapshot không nằm trong bucket S3 của bạn; muốn copy thì dùng copy snapshot hoặc AWS Backup.
- **RDS backup replication + Lambda**: phân mảnh theo dịch vụ, phải viết code, khó audit.

> Exam tip: "centralized backup across services / tag-based / cross-Region or cross-account copy" → **AWS Backup**. Thêm **Vault Lock** khi đề yêu cầu backup không thể xoá (WORM), và backup policy của Organizations để áp dụng toàn tổ chức.`,
  services: ['AWS Backup', 'Amazon EBS', 'Amazon RDS', 'Amazon EFS', 'Amazon DynamoDB'],
  refs: [{ type: 'doc', title: 'Creating backup copies across AWS Regions', url: 'https://docs.aws.amazon.com/aws-backup/latest/devguide/cross-region-backup.html' }],
},
{
  id: 'dop-037',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs a service on Amazon ECS with AWS Fargate by using the ECS rolling update deployment type (minimumHealthyPercent 100, maximumPercent 200) behind an Application Load Balancer. Last week a bad image caused new tasks to fail their health checks repeatedly, and the deployment kept launching and stopping tasks for hours until an engineer intervened. The company wants failed deployments to stop and return to the last working version automatically, with the LEAST change to the current setup. Which solution meets these requirements?`,
  options: [
    'Migrate the service to AWS CodeDeploy blue/green deployments with automatic rollback enabled.',
    'Increase the health check grace period of the service to 10 minutes.',
    'Set minimumHealthyPercent to 0 so that old tasks are stopped before new tasks are started.',
    'Enable the ECS deployment circuit breaker with rollback in the service deployment configuration.',
  ],
  answer: 3,
  explain: `**Từ khoá:** ECS **rolling update**, task mới fail lặp lại, muốn **tự dừng và rollback**, ít thay đổi nhất.

### Vì sao đáp án đúng
**Deployment circuit breaker** (cho deployment controller ECS, tức rolling update) đếm số task mới không chuyển được sang RUNNING hoặc fail health check. Khi vượt ngưỡng, deployment chuyển trạng thái FAILED; nếu bật {{rollback: true}}, ECS tự quay về **service revision/task definition chạy tốt gần nhất**. Chỉ cần sửa {{deploymentConfiguration.deploymentCircuitBreaker}}. ECS rolling update còn hỗ trợ **CloudWatch alarms** trong deploymentConfiguration để rollback theo metric.

### Vì sao các phương án khác sai
- **Chuyển sang CodeDeploy blue/green**: làm được nhưng phải đổi deployment controller, thêm target group, listener, AppSpec; không phải "least change".
- **Tăng health check grace period**: chỉ hoãn đánh giá health; image hỏng vẫn hỏng, vòng lặp vẫn tiếp diễn.
- **minimumHealthyPercent 0**: dừng task cũ trước, gây downtime và vẫn không rollback.

> Exam tip: "ECS rolling deployment stuck / failing tasks loop" → **deployment circuit breaker with rollback**. Đừng nhầm với blue/green của CodeDeploy (dùng khi cần test listener, canary/linear traffic shifting).`,
  services: ['Amazon ECS', 'AWS Fargate', 'Elastic Load Balancing'],
  refs: [{ type: 'doc', title: 'How the Amazon ECS deployment circuit breaker detects failures', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html' }],
},
{
  id: 'dop-038',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs a REST API on Amazon EKS behind an Application Load Balancer that is managed by the AWS Load Balancer Controller with IP targets. During each rolling update of the Deployment, clients see a short burst of HTTP 502 and 503 errors, because new pods receive traffic before the application has finished starting and old pods are killed while still registered. Which solution will eliminate these errors during deployments?`,
  options: [
    'Change the Deployment strategy to Recreate so that all old pods stop before new pods start.',
    'Add a readiness probe on the application health endpoint, set the rolling update to maxUnavailable 0 and maxSurge 1, and add a preStop sleep with a sufficient terminationGracePeriodSeconds so that pods are deregistered from the target group before they stop.',
    'Add a liveness probe on the application health endpoint and remove the readiness probe.',
    'Double the number of replicas in the Deployment so that more pods are available during the update.',
  ],
  answer: 1,
  explain: `**Từ khoá:** lỗi 502/503 **trong lúc rolling update**: pod mới nhận traffic quá sớm, pod cũ bị kill khi còn đăng ký.

### Vì sao đáp án đúng
Hai đầu của vấn đề:
1. **Pod mới**: **readiness probe** quyết định khi nào pod được đưa vào endpoint (và với AWS Load Balancer Controller có thể dùng thêm pod readiness gate để chờ target healthy trên ALB). {{maxUnavailable: 0}} + {{maxSurge: 1}} đảm bảo không giảm số pod sẵn sàng.
2. **Pod cũ**: khi bị xoá, Kubernetes gửi SIGTERM gần như đồng thời với việc gỡ khỏi endpoint, trong khi ALB còn cần thời gian deregister. **preStop sleep** (ví dụ 15–30 giây) + {{terminationGracePeriodSeconds}} đủ lớn giúp pod tiếp tục phục vụ cho tới khi ALB ngừng gửi request.

### Vì sao các phương án khác sai
- **Recreate**: dừng toàn bộ pod cũ trước, gây downtime hoàn toàn.
- **Chỉ liveness probe**: liveness chỉ restart container khi treo, không ngăn traffic tới pod chưa sẵn sàng; bỏ readiness làm tệ hơn.
- **Tăng replicas**: giảm tỷ lệ lỗi nhưng không giải quyết nguyên nhân, vẫn còn 502/503.

> Exam tip: zero-downtime trên EKS/ECS sau load balancer = **readiness/health check đúng + giữ capacity (maxUnavailable 0) + graceful shutdown/deregistration delay**.`,
  services: ['Amazon EKS', 'Elastic Load Balancing'],
  refs: [{ type: 'doc', title: 'Amazon EKS Best Practices Guide: Reliability', url: 'https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html' }],
},
{
  id: 'dop-039',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs an application in one AWS Region across two Availability Zones (AZ-a and AZ-b). An Application Load Balancer sends traffic to an Auto Scaling group that spans both AZs. Private subnets in both AZs use a single NAT gateway in AZ-a. The application uses a Single-AZ Amazon RDS for MySQL DB instance in AZ-a. A batch scheduler runs on one standalone EC2 instance in AZ-a. The company wants the application to survive the loss of either AZ with minimal manual intervention. Which combination of changes will meet this requirement? (Choose three.)`,
  options: [
    'Deploy a second Application Load Balancer in another Region and use Route 53 weighted routing.',
    'Create a NAT gateway in each AZ and update each private subnet route table to use the NAT gateway in its own AZ.',
    'Enable cross-zone load balancing on the Application Load Balancer.',
    'Modify the RDS DB instance to a Multi-AZ deployment.',
    'Move the scheduler to a larger instance type with an Elastic IP address.',
    'Run the scheduler in an Auto Scaling group with a minimum, maximum, and desired capacity of 1 that spans subnets in both AZs.',
  ],
  answer: [1, 3, 5],
  multi: true,
  explain: `**Từ khoá:** sống sót khi **mất một AZ**, tìm **single point of failure**.

### Vì sao đáp án đúng
Ba SPOF đều nằm ở AZ-a:
- **NAT gateway** là tài nguyên zonal. Nếu AZ-a hỏng, instance ở AZ-b mất đường ra internet. Best practice: **một NAT gateway mỗi AZ** và route table riêng theo AZ.
- **RDS Single-AZ**: chuyển **Multi-AZ** để có standby đồng bộ ở AZ khác; failover tự động, endpoint DNS giữ nguyên.
- **Scheduler trên một EC2**: đưa vào **ASG min=max=desired=1** trải trên subnet hai AZ; khi AZ-a hỏng hoặc instance unhealthy, ASG launch instance thay thế ở AZ còn lại (cần cơ chế lưu trạng thái bên ngoài instance).

### Vì sao các phương án khác sai
- **ALB thứ hai ở Region khác**: giải quyết lỗi cấp Region, đắt và không sửa các SPOF hiện có trong Region.
- **Cross-zone load balancing**: với ALB, cross-zone luôn bật ở cấp load balancer; không phải SPOF.
- **Instance lớn hơn + EIP**: vẫn là một instance trong một AZ.

> Exam tip: rà SPOF theo lớp: **NAT gateway mỗi AZ, RDS Multi-AZ, ASG ≥ 2 AZ, ASG size 1 cho singleton**. Đề "survive AZ failure" thường không cần multi-Region.`,
  services: ['Amazon VPC', 'Amazon RDS', 'Amazon EC2 Auto Scaling', 'Elastic Load Balancing'],
  refs: [{ type: 'doc', title: 'NAT gateways', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html' }],
},
{
  id: 'dop-040',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs an order-processing application in us-east-1 on Amazon EC2 Auto Scaling groups behind an Application Load Balancer, with an Aurora PostgreSQL database. The business requires an RTO of 10 minutes and an RPO of 1 minute if the whole Region fails. The solution must cost significantly less than running full production capacity in two Regions. Which disaster recovery strategy should the company implement?`,
  options: [
    'Backup and restore: copy AWS Backup recovery points to us-west-2 every hour and redeploy the stack from CloudFormation during a disaster.',
    'Pilot light: replicate the database to us-west-2 and keep the application tier defined in CloudFormation but not deployed until a disaster occurs.',
    'Warm standby: run an Aurora global database secondary cluster and a scaled-down but fully functional copy of the application tier in us-west-2, and fail over with Route 53 health checks while scaling out the standby Auto Scaling groups.',
    'Multi-site active/active: run full production capacity in both Regions and route traffic to both with Route 53 latency-based routing.',
  ],
  answer: 2,
  explain: `**Từ khoá:** RTO **10 phút**, RPO **1 phút**, chi phí **thấp hơn nhiều** so với chạy đủ công suất ở hai Region.

### Vì sao đáp án đúng
Bốn chiến lược DR theo chi phí/tốc độ tăng dần:
| Chiến lược | RPO/RTO điển hình | Ở Region DR |
|---|---|---|
| Backup & restore | giờ | chỉ có backup |
| Pilot light | phút tới chục phút / chục phút tới giờ | dữ liệu replicate, compute **tắt** |
| **Warm standby** | giây / **phút** | toàn bộ stack **chạy nhỏ**, đã phục vụ được |
| Multi-site active/active | gần 0 | đầy đủ công suất |

RTO 10 phút cần hệ thống DR **đã chạy sẵn**, chỉ cần scale-out và chuyển DNS: đó là warm standby. Aurora global database cho RPO cỡ giây.

### Vì sao các phương án khác sai
- **Backup & restore**: RPO 1 giờ, RTO là thời gian dựng lại cả stack và restore DB, quá chậm.
- **Pilot light**: phải deploy và khởi động tầng ứng dụng khi xảy ra sự cố, rủi ro vượt 10 phút; hợp với RTO dài hơn.
- **Active/active**: đạt yêu cầu nhưng chi phí gấp đôi, trái ràng buộc chi phí.

> Exam tip: phân biệt pilot light và warm standby bằng câu hỏi "tầng compute ở Region DR có **đang chạy và phục vụ được** không?". RTO phút → warm standby; RTO chục phút/giờ và tối ưu chi phí → pilot light. Có thể dùng AWS Elastic Disaster Recovery cho workload EC2.`,
  services: ['Amazon Aurora', 'Amazon Route 53', 'Amazon EC2 Auto Scaling', 'AWS Backup'],
  refs: [{ type: 'doc', title: 'Disaster recovery options in the cloud', url: 'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html' }],
}
);
