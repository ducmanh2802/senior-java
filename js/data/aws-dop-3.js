// AWS Certified DevOps Engineer – Professional (DOP-C02): exam-style questions dop-079..dop-128 (pool 3).
// All six domains by official weight (D1 11, D2 9, D3 8, D4 7, D5 7, D6 8). Schema: docs/AWS-TRACK.md. Check: node scripts/check-aws.js
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'dop-079',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company stores application source code in a GitHub repository that is connected to AWS CodePipeline through an AWS CodeStar Connections (AWS CodeConnections) connection. The pipeline is a V1 pipeline and starts on every push to the main branch, which deploys to production far too often. The company wants production releases to start only when a developer pushes a Git tag that matches the pattern release-*. Pushes of other tags or commits must not start the pipeline.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create an Amazon EventBridge rule that matches tag creation events from the repository and targets the pipeline, then disable change detection on the source action.",
    "Add an AWS CodeBuild action as the first stage that checks whether the commit has a release-* tag and fails the execution if it does not.",
    "Change the pipeline type to V2 and add a push trigger on the source action with a Git tags filter that includes release-*.",
    "Change the branch name in the source action configuration from main to release-* so that only matching tags are detected.",
  ],
  answer: 2,
  explain: `**Từ khoá:** GitHub qua CodeConnections, "only when a Git tag matches release-*", "LEAST operational overhead".

### Vì sao C đúng
Pipeline loại **V2** hỗ trợ **triggers** cho source action dùng connection (GitHub, GitLab, Bitbucket): trigger **push** có thể lọc theo **branches, file paths hoặc Git tags**, trigger **pull request** lọc theo branch đích và file path. Chỉ cần đổi pipeline type sang V2 rồi thêm filter tag {{release-*}} (hỗ trợ glob), các push khác bị bỏ qua, không cần code.

### Vì sao các phương án khác sai
- **A:** Repository nằm trên GitHub, không phát event "tag created" vào EventBridge của account như CodeCommit. Muốn làm phải tự dựng webhook + Lambda, nhiều overhead.
- **B:** Pipeline vẫn chạy với mọi push (tốn thời gian, tốn tiền, lịch sử đầy execution "Failed" giả), chỉ là bị chặn ở bước sau.
- **D:** Field branch name của source action nhận đúng một branch, không nhận wildcard và không phải là cơ chế lọc tag.

> Exam tip: Đề nhắc "start only on tags / only when files under path X change / on pull request" thì đáp án gần như luôn là **CodePipeline V2 triggers with filters**. V2 còn có pipeline-level variables và execution mode (QUEUED, PARALLEL, SUPERSEDED).`,
  services: ['AWS CodePipeline', 'AWS CodeConnections', 'GitHub'],
  refs: [
    { type: 'doc', title: 'Automate starting pipelines using triggers and filtering', url: 'https://docs.aws.amazon.com/codepipeline/latest/userguide/pipelines-filter.html' },
    { type: 'doc', title: 'CodePipeline pipeline types', url: 'https://docs.aws.amazon.com/codepipeline/latest/userguide/pipeline-types.html' },
  ],
},
{
  id: 'dop-080',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company uses one AWS CodePipeline V2 pipeline to build and deploy a service. Most executions are started automatically by source changes and must deploy with the default log level INFO. Occasionally, a release manager starts the pipeline manually to troubleshoot and needs to deploy with log level DEBUG. The value must be passed to an AWS CodeBuild action and to an AWS CloudFormation deploy action in later stages. The company does not want to maintain separate pipelines or edit the pipeline definition for each run.

Which solution meets these requirements?`,
  options: [
    "Define a pipeline-level variable named LOG_LEVEL with a default value of INFO. Reference it as #{variables.LOG_LEVEL} in the action configurations, and override the value when the release manager starts the execution manually.",
    "Have the release manager edit the CodeBuild project environment variables in the console before each manual run and revert them afterward.",
    "Store LOG_LEVEL in an AWS Systems Manager Parameter Store parameter that the release manager updates before each manual run, and read the parameter in each action.",
    "Create a second pipeline that is identical except for the LOG_LEVEL value, and start that pipeline for troubleshooting runs.",
  ],
  answer: 0,
  explain: `**Từ khoá:** V2 pipeline, "default INFO", "override khi start thủ công", dùng ở nhiều action, không tách pipeline.

### Vì sao A đúng
Pipeline V2 hỗ trợ **pipeline-level variables**: khai báo ở cấp pipeline kèm **default value**, khi chạy tự động thì dùng default, khi bấm **Release change** (hoặc {{aws codepipeline start-pipeline-execution --variables name=LOG_LEVEL,value=DEBUG}}) thì nhập giá trị khác **chỉ cho execution đó**. Mọi action đều tham chiếu được bằng cú pháp **#{variables.LOG_LEVEL}**, ví dụ trong environment variables của CodeBuild action hoặc parameter overrides của CloudFormation action.

### Vì sao các phương án khác sai
- **B:** Sửa tay trước mỗi lần chạy, dễ quên revert, và execution tự động chạy song song sẽ nhận nhầm DEBUG.
- **C:** Parameter là trạng thái dùng chung: execution tự động chạy cùng lúc cũng đọc DEBUG (race condition), lại thêm bước thủ công.
- **D:** Hai pipeline gần giống nhau là gấp đôi công bảo trì, trái yêu cầu.

> Exam tip: Phân biệt **pipeline-level variables** (giá trị đầu vào cho cả execution, V2) với **action output variables** (namespace của action, ví dụ **#{SourceVariables.CommitId}**), loại sau có ở cả V1.`,
  services: ['AWS CodePipeline', 'AWS CodeBuild', 'AWS CloudFormation'],
  refs: [{ type: 'doc', title: 'Variables reference (CodePipeline)', url: 'https://docs.aws.amazon.com/codepipeline/latest/userguide/reference-variables.html' }],
},
{
  id: 'dop-081',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A Java library must be tested against every combination of two JDK versions (Corretto 17 and Corretto 21) and three PostgreSQL versions (14, 15, and 16) on each commit. Today, one AWS CodeBuild project runs all six combinations sequentially in a single buildspec loop, which takes 90 minutes. The team wants the combinations to run in parallel, to see the result of each combination separately, and to keep the configuration in a single CodeBuild project.

Which solution meets these requirements with the LEAST management overhead?`,
  options: [
    "Create six CodeBuild projects, one for each combination, and add six parallel build actions to the pipeline stage.",
    "Configure a batch build of type build-graph in which each combination is a node that depends on the previous combination.",
    "Keep the sequential loop and change the project to a larger compute type so that each test run finishes faster.",
    "Configure a batch build of type build-matrix in the buildspec, with one dimension for the JDK version and one for the PostgreSQL version, and start the project as a batch build.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "every combination", "in parallel", "result of each combination separately", "single CodeBuild project".

### Vì sao D đúng
**CodeBuild batch builds** cho phép một lần start chạy nhiều build con song song trong cùng project. Kiểu **build-matrix** khai báo các **dimension** (ví dụ biến môi trường JDK và PG_VERSION), CodeBuild tự sinh **tích Descartes** 2 x 3 = 6 build con, mỗi build có log, trạng thái và report riêng. Chỉ một project, một buildspec.

Các kiểu batch còn lại: **build-list** (liệt kê từng build song song bằng tay), **build-graph** (các build có quan hệ phụ thuộc), **build-fanout** (chia test ra nhiều build song song, gộp report).

### Vì sao các phương án khác sai
- **A:** Chạy được song song nhưng sáu project + sáu action là nhiều thứ phải bảo trì, trái yêu cầu "single project".
- **B:** build-graph với chuỗi phụ thuộc làm các build chạy **tuần tự**, không song song.
- **C:** Compute lớn hơn không biến vòng lặp tuần tự thành song song và vẫn gộp kết quả làm một.

> Exam tip: "test nhiều tổ hợp runtime/OS" → **build-matrix**; "chia nhỏ bộ test để chạy nhanh" → **build-fanout**; "build có thứ tự phụ thuộc" → **build-graph**.`,
  services: ['AWS CodeBuild'],
  refs: [{ type: 'doc', title: 'Run builds in batches', url: 'https://docs.aws.amazon.com/codebuild/latest/userguide/batch-build.html' }],
},
{
  id: 'dop-082',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A team runs about 2,000 short AWS CodeBuild builds each day. Each build installs Node.js dependencies into a local folder, runs linting and unit tests, and finishes in about 90 seconds. The builds do not build or run Docker images, do not need VPC access, and do not require root permissions. Developers complain that provisioning time often takes longer than the build itself. The company wants faster build start-up without paying for idle build capacity.

Which solution meets these requirements?`,
  options: [
    "Create a reserved capacity fleet for the project so that build instances are always warm.",
    "Change the project to use AWS Lambda compute with a curated Node.js Lambda image.",
    "Change the project environment to a larger EC2 compute type with more vCPUs.",
    "Enable local Docker layer caching and local source caching on the existing EC2 compute project.",
  ],
  answer: 1,
  explain: `**Từ khoá:** build ngắn, "provisioning time", "no Docker, no VPC, no root", "without paying for idle capacity".

### Vì sao B đúng
CodeBuild có hai họ compute: **EC2** và **AWS Lambda**. Lambda compute khởi động nhanh hơn rõ rệt (không phải provisioning máy build), tự scale nên build không xếp hàng, và tính tiền theo thời gian chạy. Đổi lại Lambda compute **không hỗ trợ**: Docker build/run, privileged mode, tool cần root (yum, rpm), ghi ngoài {{/tmp}}, caching, VPC connectivity, build dài hơn 15 phút. Tình huống trong đề nêu rõ không cần những thứ đó, đúng use case.

### Vì sao các phương án khác sai
- **A:** Reserved capacity fleet giữ máy luôn ấm nên start nhanh, nhưng **trả tiền cả khi rảnh**, trái ràng buộc chi phí.
- **C:** Compute lớn hơn làm phần build nhanh hơn chứ không giảm thời gian provisioning.
- **D:** Local cache giúp bước tải dependency/Docker layer, không xử lý thời gian cấp phát máy build.

> Exam tip: Nhớ danh sách giới hạn của **CodeBuild Lambda compute**; đề hay cài một chi tiết như "builds Docker images" hoặc "connects to RDS in a VPC" để loại phương án Lambda.`,
  services: ['AWS CodeBuild', 'AWS Lambda'],
  refs: [{ type: 'doc', title: 'Run builds on AWS Lambda compute', url: 'https://docs.aws.amazon.com/codebuild/latest/userguide/lambda.html' }],
},
{
  id: 'dop-083',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company deploys a web application to 12 Amazon EC2 instances behind an Application Load Balancer by using AWS CodeDeploy in-place deployments with the CodeDeployDefault.OneAtATime configuration. During each deployment, users receive HTTP 502 errors because the ALB keeps sending requests to the instance whose application is being stopped and restarted. The company wants to eliminate these errors with the LEAST custom scripting.

What should a DevOps engineer do?`,
  options: [
    "Add commands to the ApplicationStop hook script that call the Elastic Load Balancing API to deregister the instance, and to the ValidateService hook to register it again.",
    "Change the deployment configuration to CodeDeployDefault.AllAtOnce so that the deployment finishes faster.",
    "Enable load balancing in the deployment group and select the ALB target group, so that CodeDeploy blocks traffic to each instance before the deployment and allows traffic after it.",
    "Increase the health check interval and the unhealthy threshold of the target group so that restarting instances are not marked unhealthy.",
  ],
  answer: 2,
  explain: `**Từ khoá:** in-place, ALB, lỗi 502 khi instance đang restart, "LEAST custom scripting".

### Vì sao C đúng
Deployment group của CodeDeploy (EC2/On-Premises) có mục **Load balancer**: chọn target group, CodeDeploy tự thêm hai lifecycle event **BlockTraffic** (deregister instance khỏi target group, chờ connection draining theo deregistration delay) trước khi chạy ApplicationStop, và **AllowTraffic** (register lại, chờ healthy) sau ValidateService. Không cần script nào.

### Vì sao các phương án khác sai
- **A:** Làm được nhưng chính là "custom scripting" mà CodeDeploy đã có sẵn; còn phải cấp quyền ELB cho instance role và xử lý lỗi.
- **B:** AllAtOnce làm **toàn bộ** instance cùng restart, lỗi 502 nặng hơn.
- **D:** Health check chậm hơn khiến ALB càng gửi request tới instance đang chết lâu hơn.

> Exam tip: Mô hình lifecycle in-place có load balancer: BeforeBlockTraffic → **BlockTraffic** → AfterBlockTraffic → ApplicationStop … ValidateService → BeforeAllowTraffic → **AllowTraffic** → AfterAllowTraffic. Giảm deregistration delay nếu deploy chậm.`,
  services: ['AWS CodeDeploy', 'Elastic Load Balancing', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'Integrating CodeDeploy with Elastic Load Balancing', url: 'https://docs.aws.amazon.com/codedeploy/latest/userguide/integrations-aws-elastic-load-balancing.html' }],
},
{
  id: 'dop-084',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A payments team deploys an AWS Lambda function through AWS CodeDeploy by updating the live alias. A new risk policy requires that each new version receive exactly 5% of traffic for 15 minutes. If no CloudWatch alarm fires, all remaining traffic must shift to the new version at once. None of the predefined CodeDeploy Lambda deployment configurations match this requirement.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Use the predefined LambdaCanary10Percent15Minutes configuration and set a CloudWatch alarm that stops the deployment if more than 5% of traffic reaches the new version.",
    "Use the predefined LambdaLinear10PercentEvery1Minute configuration and add a BeforeAllowTraffic hook that waits for 15 minutes.",
    "Write a script in the pipeline that calls UpdateAlias with a routing configuration of 5% to the new version, waits 15 minutes, checks the alarms, and then updates the alias to the new version.",
    "Create a custom CodeDeploy deployment configuration for the Lambda compute platform with time-based canary traffic routing of 5% and an interval of 15 minutes, and use it in the deployment group.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "exactly 5% for 15 minutes", "then all remaining at once", "predefined không khớp".

### Vì sao D đúng
Với compute platform Lambda (và ECS), CodeDeploy cho tạo **custom deployment configuration** với **traffic routing config**: kiểu **TimeBasedCanary** (percentage + interval: dịch X% rồi chờ N phút, sau đó dịch toàn bộ phần còn lại) hoặc **TimeBasedLinear** (dịch X% sau mỗi N phút). 5% / 15 phút chính là TimeBasedCanary. CodeDeploy vẫn lo alias weighted routing, theo dõi alarm của deployment group và tự rollback.

### Vì sao các phương án khác sai
- **A:** Canary 10% vi phạm yêu cầu 5%; alarm không điều khiển được tỉ lệ traffic.
- **B:** Linear 10%/phút là kiểu dịch dần, khác hẳn; hook BeforeAllowTraffic chạy **trước** khi dịch traffic nên không tạo ra giai đoạn 5%.
- **C:** Tự viết lại đúng điều CodeDeploy đã làm, mất luôn tính năng auto-rollback có sẵn: overhead cao nhất.

> Exam tip: Predefined Lambda configs: {{LambdaCanary10Percent5/10/15/30Minutes}}, {{LambdaLinear10PercentEvery1/2/3/10Minutes}}, {{LambdaAllAtOnce}}. Con số khác những mốc này → custom deployment configuration.`,
  services: ['AWS CodeDeploy', 'AWS Lambda', 'Amazon CloudWatch'],
  refs: [{ type: 'doc', title: 'Working with deployment configurations in CodeDeploy', url: 'https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-configurations.html' }],
},
{
  id: 'dop-085',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `An Amazon ECS service that uses the EC2 launch type runs 4 tasks on 4 container instances. Each container instance has only enough CPU and memory for exactly one task, and the company does not want to add instances. The service uses the rolling update deployment controller with the default deployment configuration. New deployments stay in progress indefinitely because the new tasks cannot be placed. A short reduction in capacity to 3 running tasks is acceptable.

Which change will allow deployments to complete?`,
  options: [
    "Set minimumHealthyPercent to 75 and maximumPercent to 100 in the service deployment configuration.",
    "Set maximumPercent to 300 so that ECS can start more replacement tasks at the same time.",
    "Enable the deployment circuit breaker with rollback on the service.",
    "Change the task placement strategy to binpack on memory so that tasks are packed more densely.",
  ],
  answer: 0,
  explain: `**Từ khoá:** rolling update, "default deployment configuration", "không còn chỗ cho task mới", "capacity 3 là chấp nhận được".

### Vì sao A đúng
Mặc định rolling update dùng **minimumHealthyPercent = 100** và **maximumPercent = 200**: ECS phải chạy task mới **trước** rồi mới dừng task cũ. Cụm không còn tài nguyên nên task mới không bao giờ được place, deployment treo. Đặt **minimumHealthyPercent = 75** (4 x 75% = 3 task) và **maximumPercent = 100** buộc ECS dừng 1 task cũ trước, giải phóng chỗ, start 1 task mới, lặp lại. Đây là đánh đổi capacity lấy khả năng deploy khi không có dư tài nguyên.

### Vì sao các phương án khác sai
- **B:** Tăng maximumPercent cho phép **nhiều** task mới hơn chứ không tạo thêm tài nguyên; vẫn kẹt.
- **C:** Circuit breaker phát hiện task mới liên tục **fail** để rollback; ở đây task không place được, đâu phải bị lỗi, nên không giải quyết gốc rễ (và rollback thì vẫn không ra được bản mới).
- **D:** Binpack không tạo thêm chỗ khi mỗi instance chỉ chứa được một task.

> Exam tip: Công thức nhanh: lower bound = desired x minimumHealthyPercent (làm tròn lên), upper bound = desired x maximumPercent (làm tròn xuống). Không dư capacity → hạ minimumHealthyPercent; muốn không giảm capacity → cần maximumPercent > 100 và tài nguyên dư (hoặc capacity provider tự scale).`,
  services: ['Amazon ECS', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'Amazon ECS rolling update deployments', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-ecs.html' }],
},
{
  id: 'dop-086',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company runs a critical service on Amazon EKS with 3 replicas on a managed node group. A PodDisruptionBudget for the service sets minAvailable to 3. When the platform team starts a managed node group version update to apply a new AMI, the update fails with a PodEvictionFailure error after about 15 minutes. The service must remain available during node updates, and the update must complete without manual node operations.

What should the DevOps engineer do?`,
  options: [
    "Start the node group update again with the force flag so that pods that violate the PodDisruptionBudget are deleted.",
    "Change the PodDisruptionBudget to minAvailable 2 (or maxUnavailable 1), keep 3 replicas spread across nodes, and start the node group update again.",
    "Increase the node group update configuration maxUnavailable to 100% so that all nodes are replaced at the same time.",
    "Cordon each node with kubectl and terminate the EC2 instances from the Auto Scaling group console so that new nodes launch with the new AMI.",
  ],
  answer: 1,
  explain: `**Từ khoá:** PodEvictionFailure, PDB minAvailable = số replica, "must remain available", "without manual node operations".

### Vì sao B đúng
Managed node group update tạo node mới, rồi **drain** node cũ bằng Eviction API, API này **tôn trọng PodDisruptionBudget**. Với 3 replica và minAvailable 3, không pod nào được phép evict (allowed disruptions = 0), sau 15 phút EKS báo **PodEvictionFailure**. Sửa PDB thành minAvailable 2 (hoặc maxUnavailable 1) cho phép evict từng pod, pod được lên lịch lại sang node mới trong khi 2 pod còn lại vẫn phục vụ. Nên kết hợp topology spread / anti-affinity để 3 replica không cùng nằm trên một node.

### Vì sao các phương án khác sai
- **A:** Cờ **force** bỏ qua PDB và xoá pod, có thể hạ cả 3 replica cùng lúc: vi phạm yêu cầu availability.
- **C:** Thay toàn bộ node một lúc không làm evict thành công được, còn tăng rủi ro.
- **D:** Thao tác tay trên node, bỏ qua drain an toàn, trái yêu cầu.

> Exam tip: PDB có allowed disruptions = 0 là nguyên nhân hàng đầu khiến node group update, Karpenter consolidation và cluster autoscaler scale-in bị kẹt.`,
  services: ['Amazon EKS', 'Amazon EC2 Auto Scaling'],
  refs: [{ type: 'doc', title: 'Understand each phase of node updates', url: 'https://docs.aws.amazon.com/eks/latest/userguide/managed-node-update-behavior.html' }],
},
{
  id: 'dop-087',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company runs a load-balanced AWS Elastic Beanstalk environment with 10 instances. During a recent rolling with additional batch deployment, the new version failed health checks halfway through. The environment was left with a mix of old and new instances, and the team had to run a second deployment to restore the old version. The company wants a deployment policy in which a failed deployment does not change any existing instance and rollback only requires terminating new instances, while full capacity is maintained during deployments.

Which deployment policy should the company use?`,
  options: [
    "All at once",
    "Rolling",
    "Rolling with additional batch, with a smaller batch size",
    "Immutable",
  ],
  answer: 3,
  explain: `**Từ khoá:** "failed deployment does not change any existing instance", "rollback only terminates new instances", "full capacity".

### Vì sao D đúng
**Immutable** khởi chạy một **Auto Scaling group tạm** với instance mới chạy version mới (một instance trước, rồi đủ số lượng). Chỉ khi tất cả healthy, các instance mới mới được chuyển vào ASG gốc và instance cũ bị terminate. Nếu thất bại, Elastic Beanstalk chỉ việc terminate ASG tạm: instance cũ chưa bị đụng tới, capacity luôn đầy đủ. Chi phí: tạm thời gấp đôi số instance, deploy chậm hơn.

### Vì sao các phương án khác sai
- **A:** All at once cập nhật mọi instance cùng lúc, có downtime, lỗi thì phải deploy lại.
- **B:** Rolling giảm capacity theo batch và khi lỗi để lại môi trường lẫn version.
- **C:** Rolling with additional batch giữ capacity nhưng các batch sau **vẫn sửa instance cũ tại chỗ**; lỗi giữa chừng vẫn lẫn version và cần deploy lại để rollback (đúng vấn đề trong đề).

> Exam tip: Bảng nhớ nhanh: downtime (all at once) / giảm capacity (rolling) / giữ capacity nhưng sửa tại chỗ (rolling + batch) / instance mới, rollback nhanh (immutable) / dịch % traffic để canary (traffic splitting) / tách môi trường (blue/green bằng swap CNAME).`,
  services: ['AWS Elastic Beanstalk', 'Amazon EC2 Auto Scaling'],
  refs: [
    { type: 'doc', title: 'Deploying applications to Elastic Beanstalk environments', url: 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.rolling-version-deploy.html' },
    { type: 'doc', title: 'Immutable environment updates', url: 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/environmentmgmt-updates-immutable.html' },
  ],
},
{
  id: 'dop-088',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A Java application runs in a load-balanced AWS Elastic Beanstalk environment on Amazon Linux 2023 with 6 instances. Each new application version can include Flyway database migrations that must run exactly once per deployment, after the new source bundle is extracted and before the new version starts serving traffic. Running the migration on several instances at the same time causes lock errors.

How should the DevOps engineer configure the migration?`,
  options: [
    "Add a container_commands entry in an .ebextensions configuration file that runs the migration with leader_only set to true.",
    "Add an executable script to .platform/hooks/predeploy in the source bundle that runs the migration.",
    "Add a commands entry in an .ebextensions configuration file that runs the migration.",
    "Add a cron.yaml file so that the environment runs the migration as a periodic task once every hour.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "exactly once per deployment", "after the source bundle is extracted, before serving", "lock errors khi chạy trên nhiều instance".

### Vì sao A đúng
Trong {{.ebextensions}}, khoá **container_commands** chạy **sau khi** source bundle được giải nén vào thư mục staging và **trước khi** version mới được deploy. Thuộc tính **leader_only: true** chỉ chạy lệnh trên **một** instance (leader) trong mỗi lần deploy: đúng nhu cầu migration DB chạy một lần.

### Vì sao các phương án khác sai
- **B:** {{.platform/hooks/predeploy}} chạy đúng thời điểm nhưng trên **mọi** instance, gây lock conflict.
- **C:** Khoá **commands** chạy trên **mọi** instance và chạy sớm, trước bước cấu hình ứng dụng (trước cả Buildfile và container_commands), nên vừa lock conflict vừa sai thời điểm.
- **D:** cron.yaml dành cho worker environment chạy tác vụ định kỳ, không gắn với lúc deploy.

> Exam tip: Thứ tự trên Amazon Linux 2/2023: tải và giải nén bundle → commands (.ebextensions) → .platform/hooks/prebuild → Buildfile → container_commands → .platform/hooks/predeploy → deploy (Procfile) → .platform/hooks/postdeploy. Thay đổi chỉ cấu hình (không đổi code) dùng **.platform/confighooks**.`,
  services: ['AWS Elastic Beanstalk'],
  refs: [
    { type: 'doc', title: 'Customizing software on Linux servers (.ebextensions)', url: 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/customize-containers-ec2.html' },
    { type: 'doc', title: 'Extending Elastic Beanstalk Linux platforms', url: 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/platforms-linux-extend.html' },
  ],
},
{
  id: 'dop-089',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company builds container images in us-east-1 and pushes them to Amazon ECR repositories whose names start with prod/. For disaster recovery, every image pushed to these repositories must be available automatically in eu-west-1 within minutes. The repositories also accumulate thousands of untagged images from rebuilds, and storage costs are increasing. Untagged images older than 14 days must be removed automatically.

Which combination of steps will meet these requirements with the LEAST operational overhead? (Choose two.)`,
  options: [
    "Enable S3 Cross-Region Replication on the bucket that stores the ECR image layers in us-east-1.",
    "Add a private registry replication rule in us-east-1 with eu-west-1 as the destination and a repository filter for the prefix prod/.",
    "Create an Amazon EventBridge rule for ECR image push events that invokes an AWS Lambda function to pull the image and push it to eu-west-1.",
    "Create an ECR lifecycle policy rule that expires images with tagStatus untagged when sinceImagePushed is greater than 14 days, and apply it to the repositories in each Region.",
    "Enable tag immutability on the repositories so that rebuilds cannot create untagged images.",
  ],
  answer: [1, 3],
  multi: true,
  explain: `**Từ khoá:** "available automatically in eu-west-1", "prefix prod/", "untagged > 14 days removed", "LEAST overhead".

### Vì sao B và D đúng
- **B:** ECR **replication** là cấu hình ở cấp **registry**: rule chọn Region/account đích và **repository filter** theo prefix. Mỗi image push sau khi bật sẽ được sao chép tự động (cả cross-Region và cross-account), không cần code.
- **D:** **Lifecycle policy** có rule {{tagStatus: untagged}}, {{countType: sinceImagePushed}}, {{countNumber: 14}} để expire image cũ. Lifecycle policy là cấu hình theo từng repository và không đi theo replication, nên phải áp ở cả Region đích (có thể dùng repository creation template cho repo được tạo bởi replication).

### Vì sao các phương án khác sai
- **A:** Storage của ECR do AWS quản lý, bạn không thấy và không cấu hình được bucket S3 bên dưới.
- **C:** Chạy được nhưng là custom code phải vận hành (xác thực registry, retry, image lớn vượt giới hạn Lambda).
- **E:** Tag immutability chỉ cấm ghi đè tag đã có; khi push lại cùng tag bị từ chối chứ không dọn image untagged sẵn có.

> Exam tip: Replication chỉ áp dụng cho image push **sau khi** bật rule; image cũ phải push lại. Hãy nhớ ba công cụ: replication (DR, gần người dùng), lifecycle policy (chi phí), pull through cache (mirror registry upstream).`,
  services: ['Amazon ECR'],
  refs: [
    { type: 'doc', title: 'Private image replication in Amazon ECR', url: 'https://docs.aws.amazon.com/AmazonECR/latest/userguide/replication.html' },
    { type: 'doc', title: 'Automate the cleanup of images by using lifecycle policies', url: 'https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html' },
  ],
},
{
  id: 'dop-090',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A production AWS CloudFormation stack contains an Amazon RDS DB instance, Auto Scaling groups, and many security groups. Developers update the stack frequently through a pipeline. Last month, a template change to the DB instance properties caused CloudFormation to replace the database, which led to an outage. The company wants to prevent any stack update from replacing or deleting the DB instance, while still allowing updates to all other resources in the stack.

Which solution meets these requirements?`,
  options: [
    "Enable termination protection on the stack.",
    "Apply a stack policy that allows Update:* on all resources and denies Update:Replace and Update:Delete on the DB instance logical ID.",
    "Set DeletionPolicy to Snapshot on the DB instance resource.",
    "Attach an IAM policy to the pipeline's CloudFormation service role that denies rds:DeleteDBInstance and rds:ModifyDBInstance.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "prevent any stack update from replacing or deleting the DB instance", "still allowing updates to all other resources".

### Vì sao B đúng
**Stack policy** là JSON gắn vào stack, chỉ áp dụng cho **stack update**. Nó quy định action {{Update:Modify}}, {{Update:Replace}}, {{Update:Delete}} hoặc {{Update:*}} được phép trên logical resource nào. Allow {{Update:*}} cho mọi thứ rồi Deny {{Update:Replace}} và {{Update:Delete}} cho DB instance: update nào đòi thay DB sẽ thất bại và rollback, còn các resource khác vẫn update bình thường. Khi thật sự cần, có thể truyền stack policy tạm thời cho một lần update.

### Vì sao các phương án khác sai
- **A:** Termination protection chỉ chặn **xoá cả stack**, không chặn update thay thế resource.
- **C:** DeletionPolicy Snapshot (và UpdateReplacePolicy) giữ lại **dữ liệu** sau khi resource bị xoá/thay, nhưng vẫn để xảy ra replacement và downtime.
- **D:** Chặn {{ModifyDBInstance}} làm hỏng cả những thay đổi hợp lệ (ví dụ đổi instance class), và replacement vẫn có thể tạo DB mới trước khi bị chặn ở bước xoá, để stack ở trạng thái lỗi.

> Exam tip: Ba lớp bảo vệ khác nhau: **stack policy** (update), **termination protection** (xoá stack), **DeletionPolicy/UpdateReplacePolicy** (giữ dữ liệu khi resource bị xoá/thay). Đề thường trộn chúng làm distractor.`,
  services: ['AWS CloudFormation', 'Amazon RDS'],
  refs: [
    { type: 'doc', title: 'Prevent updates to stack resources (stack policy)', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/protect-stack-resources.html' },
    { type: 'doc', title: 'Protect a stack from being deleted', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-protect-stacks.html' },
  ],
},
{
  id: 'dop-091',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company deploys an API with AWS CloudFormation. Several recent stack updates completed successfully, but the API error rate increased a few minutes later, and engineers had to deploy the previous template manually. A CloudWatch alarm already monitors the API 5xx error rate. The company wants CloudFormation to roll back an update automatically if the alarm enters the ALARM state during the update or within 10 minutes after all resources are updated.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create an Amazon EventBridge rule for the alarm state change that invokes an AWS Lambda function to call CancelUpdateStack on the stack.",
    "Add a CreationPolicy with a 10-minute timeout to the API resources so that CloudFormation waits for success signals.",
    "Configure rollback triggers for the stack that reference the CloudWatch alarm, with a monitoring time of 10 minutes.",
    "Enable stack termination protection and drift detection so that out-of-band failures are detected after the update.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "roll back automatically", "alarm", "during the update or within 10 minutes after", "LEAST overhead".

### Vì sao C đúng
**Rollback configuration** của stack gồm danh sách **rollback triggers** (tối đa 5 CloudWatch alarm) và **MonitoringTimeInMinutes** (0 tới 180). CloudFormation theo dõi alarm trong suốt quá trình create/update **và** trong khoảng monitoring time sau khi resource cuối cùng được deploy. Alarm vào ALARM thì CloudFormation tự rollback toàn bộ thao tác. Hoàn toàn không cần code.

### Vì sao các phương án khác sai
- **A:** CancelUpdateStack chỉ dùng được khi stack còn ở **UPDATE_IN_PROGRESS**; sau khi update đã hoàn tất thì không huỷ được nữa. Lại là custom code.
- **B:** CreationPolicy chờ tín hiệu cfn-signal khi **tạo** resource (EC2/ASG), không theo dõi alarm sau update.
- **D:** Termination protection và drift detection không liên quan tới việc rollback theo metric.

> Exam tip: Trong khoảng monitoring time, nếu bạn bắt đầu thao tác khác lên stack thì monitoring kết thúc. Muốn rollback theo alarm ở mức **traffic shifting** (Lambda/ECS) thì dùng CodeDeploy alarms; ở mức **stack** thì dùng rollback triggers.`,
  services: ['AWS CloudFormation', 'Amazon CloudWatch'],
  refs: [{ type: 'doc', title: 'Roll back a CloudFormation stack on alarm breach with rollback triggers', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-rollback-triggers.html' }],
},
{
  id: 'dop-092',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `The security team manages an AWS Secrets Manager secret named prod/app/db that contains the master password for an existing database engine and rotates it on a schedule. A DevOps engineer writes an AWS CloudFormation template that creates an Amazon RDS DB instance whose master password must be the current value of this secret. The password must not appear in the template, in stack parameters, in the pipeline configuration, or in the stack's outputs or events.

Which solution meets these requirements?`,
  options: [
    "Use a Secrets Manager dynamic reference (resolve:secretsmanager with the secret name, SecretString, and the password JSON key) in the MasterUserPassword property.",
    "Declare a template parameter with NoEcho set to true and have the pipeline pass the password value as a parameter override.",
    "Declare a parameter of type AWS::SSM::Parameter::Value<String> that points to a SecureString parameter that contains a copy of the password.",
    "Export the password from another stack as an output and use Fn::ImportValue in the MasterUserPassword property.",
  ],
  answer: 0,
  explain: `**Từ khoá:** secret có sẵn trong Secrets Manager, "must not appear in template, parameters, pipeline, outputs".

### Vì sao A đúng
**Dynamic reference** cho phép template trỏ tới giá trị lưu bên ngoài; CloudFormation lấy giá trị lúc thực thi và không lưu/hiển thị nó. Cú pháp viết trong hai cặp ngoặc nhọn, dạng {{resolve:secretsmanager:prod/app/db:SecretString:password}} (có thể thêm version stage/version id). Template, parameter và pipeline chỉ chứa **tên secret**, không chứa mật khẩu. Lưu ý: CloudFormation không tự cập nhật DB khi secret xoay vòng; phải có stack update mới lấy giá trị mới.

### Vì sao các phương án khác sai
- **B:** NoEcho che giá trị trong console/API, nhưng mật khẩu vẫn nằm trong cấu hình pipeline: vi phạm yêu cầu.
- **C:** Kiểu parameter {{AWS::SSM::Parameter::Value<String>}} **không hỗ trợ SecureString**; muốn dùng SecureString phải dùng dynamic reference ssm-secure, và còn phải chép password sang chỗ thứ hai.
- **D:** Output của stack hiển thị rõ ràng cho ai có quyền đọc stack.

> Exam tip: Có ba loại dynamic reference: {{ssm}} (String/StringList), {{ssm-secure}} (SecureString, chỉ một số property hỗ trợ), {{secretsmanager}} (dùng được ở mọi property). Với RDS mới, còn có thể đặt **ManageMasterUserPassword** để RDS tự tạo và xoay secret.`,
  services: ['AWS CloudFormation', 'AWS Secrets Manager', 'Amazon RDS'],
  refs: [{ type: 'doc', title: 'Get values stored in other services using dynamic references', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references.html' }],
},
{
  id: 'dop-093',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A platform team requires that every Amazon S3 bucket created through AWS CloudFormation has versioning enabled and blocks public access. Teams deploy stacks from pipelines, from the console, and from the AWS CLI. Non-compliant buckets must be blocked before they are provisioned, not detected afterward, and teams must receive a clear error message in the stack events.

Which solution meets these requirements?`,
  options: [
    "Create an AWS Config managed rule that checks S3 bucket versioning and an automatic remediation that enables versioning.",
    "Add cfn-lint to every team's pipeline and fail the build if the template does not configure versioning.",
    "Create an SCP that denies s3:CreateBucket unless the request includes a versioning configuration.",
    "Activate an AWS CloudFormation Hook (for example, a Guard hook) that evaluates AWS::S3::Bucket resources before create and update operations, with the failure mode set to FAIL.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "blocked before they are provisioned", mọi đường deploy (pipeline, console, CLI), lỗi hiện trong stack events.

### Vì sao D đúng
**CloudFormation Hooks** là kiểm tra **proactive**: CloudFormation gọi hook trước khi create/update/delete resource (hoặc cả stack/change set). Hook có thể viết bằng **Guard rules** (Guard hook), Lambda (Lambda hook) hoặc là hook tuỳ biến đăng ký trong registry. Với failure mode **FAIL**, resource không đạt sẽ bị chặn và stack báo lỗi kèm thông điệp của hook. Vì hook được kích hoạt ở cấp account/Region (triển khai rộng bằng StackSets), mọi cách deploy đều phải qua nó.

### Vì sao các phương án khác sai
- **A:** Config là kiểm soát **detective**: bucket đã được tạo rồi mới phát hiện và sửa.
- **B:** cfn-lint chỉ chạy trong pipeline; người deploy bằng console/CLI bỏ qua được. Ngoài ra cfn-lint kiểm tra cú pháp/schema, còn policy tổ chức thì cfn-guard hợp hơn.
- **C:** Versioning được bật bằng API riêng (PutBucketVersioning) sau CreateBucket; SCP không đọc được thuộc tính versioning trong request CreateBucket.

> Exam tip: "prevent/before provisioning in CloudFormation" → **Hooks**; "detect and remediate" → **Config**; "shift-left in CI" → **cfn-guard/cfn-lint**. Đặt failure mode WARN khi mới triển khai để đo tác động.`,
  services: ['AWS CloudFormation', 'Amazon S3'],
  refs: [
    { type: 'doc', title: 'What are CloudFormation Hooks?', url: 'https://docs.aws.amazon.com/cloudformation-cli/latest/hooks-userguide/what-is-cloudformation-hooks.html' },
    { type: 'doc', title: 'Guard hooks', url: 'https://docs.aws.amazon.com/cloudformation-cli/latest/hooks-userguide/guard-hooks.html' },
  ],
},
{
  id: 'dop-094',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company has hundreds of AWS CloudFormation templates owned by different teams. The platform team must ensure that, at deployment time, every taggable resource in each template automatically receives the company's standard cost-allocation tags, and that every AWS::Lambda::Function resource automatically gets a matching AWS::Logs::LogGroup resource with a 30-day retention. Teams should only need to add one line to their templates.

Which solution meets these requirements?`,
  options: [
    "Store a snippet that contains the tags and log group in Amazon S3 and add an AWS::Include transform to every template.",
    "Create a CloudFormation macro backed by an AWS Lambda function that iterates over the template's resources and adds the tags and log groups, and have teams add the macro to the Transform section of their templates.",
    "Create a custom resource backed by an AWS Lambda function that tags all resources in the stack after they are created.",
    "Publish a CloudFormation module that contains a Lambda function and a log group, and ask teams to replace their Lambda resources with the module.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "every taggable resource in each template", "automatically get a matching log group", "add one line".

### Vì sao B đúng
**Macro** là Lambda function được đăng ký bằng resource {{AWS::CloudFormation::Macro}}. Khi template khai báo {{Transform: CompanyStandards}}, CloudFormation gửi **toàn bộ template** cho Lambda trước khi tạo change set; Lambda có thể duyệt mọi resource, thêm Tags, sinh thêm resource LogGroup rồi trả template đã xử lý. Đây là cách duy nhất trong các phương án có **logic** chạy trên cả template. Lưu ý: stack dùng macro phải được deploy qua change set và cần capability {{CAPABILITY_AUTO_EXPAND}}.

### Vì sao các phương án khác sai
- **A:** AWS::Include chỉ chèn một đoạn template **tĩnh** từ S3; không thể duyệt resource có sẵn để gắn tag hay sinh log group tương ứng.
- **C:** Custom resource chạy lúc provisioning, gọi API tag sau khi tạo: không phải template chuẩn hoá, khó xử lý update/delete, và không sinh log group như resource được quản lý.
- **D:** Module đóng gói một nhóm resource tái sử dụng, nhưng teams phải sửa từng Lambda resource, và module không tác động tới các resource khác trong template.

> Exam tip: Transform có sẵn của AWS: {{AWS::Serverless}} (SAM), {{AWS::Include}}, {{AWS::LanguageExtensions}} (Fn::ForEach, Fn::Length…). Cần logic riêng trên template → **custom macro**.`,
  services: ['AWS CloudFormation', 'AWS Lambda', 'Amazon CloudWatch Logs'],
  refs: [{ type: 'doc', title: 'Perform custom processing on CloudFormation templates with template macros', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-macros.html' }],
},
{
  id: 'dop-095',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `Years ago, engineers created an Amazon DynamoDB table and an Amazon S3 bucket manually in the console. Both contain production data. The company now wants these resources to be managed by an existing AWS CloudFormation stack, without deleting, recreating, or copying the data, and without downtime.

Which solution meets these requirements?`,
  options: [
    "Add the table and bucket to the stack template with the same names and run a normal stack update.",
    "Run drift detection on the stack so that CloudFormation discovers the resources and adds them to the stack.",
    "Add the resources to the template with a DeletionPolicy attribute and the same properties, then create a change set of type IMPORT that maps each logical ID to the existing table name and bucket name, and execute it.",
    "Back up the table and bucket, delete them, and add them to the template so that CloudFormation recreates them, then restore the data.",
  ],
  answer: 2,
  explain: `**Từ khoá:** resource có sẵn tạo bằng tay, "managed by an existing stack", "không xoá, không tạo lại, không downtime".

### Vì sao C đúng
**Resource import** đưa resource đang tồn tại vào stack (mới hoặc có sẵn). Các bước: thêm resource vào template, **bắt buộc có DeletionPolicy**, khai báo thuộc tính khớp hiện trạng; tạo change set **ChangeSetType = IMPORT** và cung cấp **resource identifier** (TableName, BucketName); execute. Sau đó nên chạy drift detection để chắc thuộc tính trong template khớp thực tế. Resource giữ nguyên, không gián đoạn.

### Vì sao các phương án khác sai
- **A:** Update thường sẽ cố **tạo mới** resource cùng tên và thất bại vì tên đã tồn tại.
- **B:** Drift detection chỉ so sánh resource **đã thuộc** stack với template; không phát hiện hay nhận resource bên ngoài.
- **D:** Xoá và khôi phục gây downtime và rủi ro mất dữ liệu, trái yêu cầu.

> Exam tip: Import cũng dùng để **chuyển resource giữa hai stack**: đặt DeletionPolicy Retain, gỡ khỏi stack cũ, rồi import vào stack mới. Không phải mọi resource type đều hỗ trợ import; kiểm tra danh sách trước.`,
  services: ['AWS CloudFormation', 'Amazon DynamoDB', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'Import AWS resources into a CloudFormation stack', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/import-resources.html' }],
},
{
  id: 'dop-096',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A team defines its infrastructure with the AWS CDK in TypeScript and deploys to beta, staging, and production accounts. Currently, an engineer must run cdk deploy manually against the pipeline stack whenever a new stage or account is added, and deployments of the application stacks are done from a laptop. The team wants every commit to the main branch to update both the pipeline itself and all application stages automatically, with cross-account deployments and no manual CDK commands after initial setup.

Which solution meets these requirements?`,
  options: [
    "Use the CDK Pipelines construct (pipelines.CodePipeline) with a synth step from the repository, add each environment as a stage, and deploy the pipeline stack once; the pipeline's self-mutation step updates the pipeline on later commits. Bootstrap the target accounts to trust the pipeline account.",
    "Create an AWS CodeBuild project that runs cdk deploy --all with administrator credentials stored in environment variables for each account.",
    "Use AWS CloudFormation StackSets to deploy the synthesized templates of each stage to the target accounts when the cloud assembly changes.",
    "Create an AWS CodePipeline pipeline in the console with a CloudFormation deploy action for each stage, and update the pipeline in the console whenever a stage is added.",
  ],
  answer: 0,
  explain: `**Từ khoá:** CDK, "pipeline updates itself", "add stage without manual cdk deploy", cross-account.

### Vì sao A đúng
**CDK Pipelines** ({{aws-cdk-lib/pipelines}}) dựng một CodePipeline từ chính code CDK: bước **Synth** chạy {{cdk synth}}, bước **UpdatePipeline (self-mutation)** cập nhật pipeline nếu định nghĩa thay đổi, sau đó deploy từng **Stage** (mỗi stage là nhóm stack cho một account/Region). Chỉ cần {{cdk deploy}} pipeline **một lần**; thêm stage mới chỉ là commit code. Cross-account hoạt động nhờ **cdk bootstrap --trust <pipeline-account>** ở account đích.

### Vì sao các phương án khác sai
- **B:** Credential admin dài hạn trong biến môi trường là vi phạm bảo mật, và không có self-mutation hay approval/stage.
- **C:** StackSets không tự chạy theo commit, không xử lý asset (Lambda code, Docker image) như CDK Pipelines, và vẫn cần thứ gì đó synth và cập nhật StackSet.
- **D:** Sửa pipeline thủ công chính là việc team muốn bỏ.

> Exam tip: Từ khoá "self-mutating" = CDK Pipelines. Khi bootstrap phải dùng {{--trust}} cho account pipeline và {{--cloudformation-execution-policies}} để giới hạn quyền của deploy role.`,
  services: ['AWS CDK', 'AWS CodePipeline', 'AWS CloudFormation'],
  refs: [{ type: 'doc', title: 'Continuous integration and delivery (CI/CD) using CDK Pipelines', url: 'https://docs.aws.amazon.com/cdk/v2/guide/cdk-pipeline.html' }],
},
{
  id: 'dop-097',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company must install a third-party security agent on 1,500 Amazon EC2 instances that run Amazon Linux 2023, Ubuntu, and Windows Server. The vendor provides a separate installer for each operating system. The agent must be installed on existing instances and on any instance launched in the future, and the platform team wants to update to a new agent version centrally. All instances are managed by AWS Systems Manager.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Add installation commands to the user data of every launch template and update the user data when a new agent version is released.",
    "Run a Systems Manager Run Command document across all instances each time a new agent version is released.",
    "Store the installers in Amazon S3 and add a cron job to the AMI that downloads and installs the newest installer every night.",
    "Create a Systems Manager Distributor package that contains the installer and install/uninstall scripts for each platform, and create a State Manager association that runs AWS-ConfigureAWSPackage on a schedule for all managed nodes.",
  ],
  answer: 3,
  explain: `**Từ khoá:** nhiều hệ điều hành, "existing and future instances", "update version centrally", đã dùng Systems Manager.

### Vì sao D đúng
**Distributor** đóng gói phần mềm thành **package** có version: mỗi platform/architecture có file zip (installer + script install/uninstall/update) và manifest chỉ định file nào cho OS nào. Kết hợp **State Manager association** chạy document {{AWS-ConfigureAWSPackage}} (action Install, version latest hoặc cố định) theo lịch và nhắm theo tag hoặc toàn bộ managed node: instance mới được cài tự động, instance lệch trạng thái được sửa lại, đổi version chỉ cần publish package version mới.

### Vì sao các phương án khác sai
- **A:** User data chỉ chạy lúc launch: không cài cho instance đang chạy và đổi version phải sửa mọi launch template.
- **B:** Run Command là thao tác một lần; instance mới launch sau đó sẽ bị bỏ sót.
- **C:** Phải build lại AMI, script tự viết cho từng OS, và cron chạy mỗi đêm khó kiểm soát version.

> Exam tip: Run Command = chạy một lần; State Manager = duy trì trạng thái mong muốn liên tục; Distributor = đóng gói phần mềm đa nền tảng. Đề ghép "install agent on current and future instances" thường là Distributor + State Manager.`,
  services: ['AWS Systems Manager', 'Amazon EC2'],
  refs: [
    { type: 'doc', title: 'AWS Systems Manager Distributor', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/distributor.html' },
  ],
},
{
  id: 'dop-098',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company deploys AWS CloudFormation templates through AWS CodePipeline. Recently, a template with an invalid property value for an AWS::EC2::Instance resource reached the deploy stage and failed after 20 minutes, and another template created an unencrypted Amazon EBS volume, which violates company policy. The company wants the pipeline to fail fast in a build stage when a template has resource property errors or violates policy rules that the security team writes as code.

Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Run cfn-lint against the templates in an AWS CodeBuild action before the deploy stage.",
    "Run aws cloudformation validate-template in an AWS CodeBuild action and rely on it to detect invalid resource property values.",
    "Run AWS CloudFormation Guard (cfn-guard) with the security team's rule files against the templates in an AWS CodeBuild action.",
    "Run drift detection on the stack after each deployment and fail the pipeline if drift is found.",
    "Create a change set in a pipeline stage and have an engineer review it manually for policy violations.",
  ],
  answer: [0, 2],
  multi: true,
  explain: `**Từ khoá:** "fail fast in a build stage", "resource property errors", "policy rules written as code".

### Vì sao A và C đúng
- **A: cfn-lint** kiểm tra template theo **CloudFormation resource specification**: thuộc tính sai tên, sai kiểu, giá trị không hợp lệ, tham chiếu sai, best practices. Bắt được lỗi property trước khi deploy.
- **C: CloudFormation Guard (cfn-guard)** là công cụ **policy-as-code**: security team viết rule bằng Guard DSL (ví dụ mọi {{AWS::EC2::Volume}} phải có {{Encrypted == true}}), chạy {{cfn-guard validate}} trong CodeBuild, vi phạm thì build fail.

### Vì sao các phương án khác sai
- **B:** validate-template chỉ kiểm tra cú pháp JSON/YAML và cấu trúc cơ bản; không kiểm tra giá trị property của resource.
- **D:** Drift detection chạy **sau** khi deploy và tìm thay đổi ngoài luồng, không phải lỗi template.
- **E:** Review tay chậm, không nhất quán và không phải "policy as code".

> Exam tip: Bộ ba shift-left: **cfn-lint** (đúng spec), **cfn-guard** (đúng policy), **cfn-nag / Checkov** (bên thứ ba). Chặn ở mức tài khoản mà mọi đường deploy đều phải qua thì dùng **CloudFormation Hooks** (Guard hook dùng lại cùng rule).`,
  services: ['AWS CloudFormation', 'AWS CodeBuild', 'AWS CodePipeline'],
  refs: [{ type: 'doc', title: 'What is AWS CloudFormation Guard?', url: 'https://docs.aws.amazon.com/cfn-guard/latest/ug/what-is-guard.html' }],
},
{
  id: 'dop-099',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs an active-passive application in us-east-1 (primary) and us-west-2 (standby). Amazon Route 53 routes users to the primary. Regulators require that Regional failover be a deliberate decision made by an operator, that the failover mechanism keep working even if the primary Region or the Route 53 control plane is impaired, and that operators cannot accidentally turn off traffic to both Regions at the same time.

Which solution meets these requirements?`,
  options: [
    "Create a runbook that calls the Route 53 ChangeResourceRecordSets API to change the weights of weighted records during a failover.",
    "Use Amazon Route 53 Application Recovery Controller routing controls with routing control health checks on failover records, add a safety rule that requires at least one routing control to be On, and change routing control states by using the cluster data plane endpoints.",
    "Configure Route 53 failover records with health checks against each Region's load balancer so that Route 53 fails over automatically when the primary is unhealthy.",
    "Place AWS Global Accelerator in front of both Regions and set the traffic dial of the primary endpoint group to 0% during a failover.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "deliberate decision by an operator", "keep working when the Route 53 control plane is impaired", "cannot turn off both Regions".

### Vì sao B đúng
**Route 53 ARC routing control** là công tắc On/Off gắn với **routing control health check**; record failover/weighted dùng health check này nên đổi trạng thái công tắc là chuyển traffic. Trạng thái được đổi qua **cluster** gồm 5 endpoint ở 5 Region khác nhau (data plane, độ sẵn sàng cao) chứ không qua API cấu hình record (control plane ở us-east-1). **Safety rules** (assertion rule, ví dụ "ít nhất 1 routing control On") chặn thao tác làm tắt cả hai Region.

### Vì sao các phương án khác sai
- **A:** ChangeResourceRecordSets là **control plane** của Route 53; khi control plane gặp sự cố thì không thay đổi được, cũng không có guardrail.
- **C:** Failover tự động theo health check, trái yêu cầu "operator quyết định", và dễ bị kích hoạt sai trong gray failure.
- **D:** Traffic dial thuộc control plane của Global Accelerator và không có safety rule chặn tắt cả hai.

> Exam tip: Nguyên tắc resilience của AWS: **dựa vào data plane khi phục hồi, tránh control plane**. Routing control cluster tính phí theo giờ khá cao, nên hợp với workload quan trọng.`,
  services: ['Amazon Route 53 Application Recovery Controller', 'Amazon Route 53'],
  refs: [{ type: 'doc', title: 'Routing control in Amazon Route 53 Application Recovery Controller', url: 'https://docs.aws.amazon.com/r53recovery/latest/dg/routing-control.html' }],
},
{
  id: 'dop-100',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `An application runs on Amazon EC2 instances in an Auto Scaling group across three Availability Zones behind an Application Load Balancer. During an incident, instances in one AZ became slow because of a partial infrastructure problem, but they still passed the ALB health checks, so users experienced high latency. The company wants operators to be able to move traffic away from an impaired AZ within minutes, temporarily and reversibly, without changing the Auto Scaling group or ALB subnet configuration.

Which solution meets these requirements?`,
  options: [
    "Remove the impaired AZ's subnet from the ALB configuration and add it back after the incident.",
    "Update the Auto Scaling group to remove the impaired AZ so that its instances are terminated and replaced in the other AZs.",
    "Enable the ARC zonal shift integration on the ALB, and start a zonal shift in Amazon Route 53 Application Recovery Controller for the ALB and the impaired AZ with an expiration time.",
    "Configure Route 53 failover routing to a second Region and fail over the whole application during AZ incidents.",
  ],
  answer: 2,
  explain: `**Từ khoá:** gray failure (vẫn pass health check), "move traffic away from an AZ within minutes", "temporarily and reversibly", không sửa ASG/ALB subnet.

### Vì sao C đúng
**Zonal shift** (thuộc Route 53 ARC) cho phép tạm dừng gửi traffic tới **một AZ** của resource được hỗ trợ (ALB, NLB, EC2 Auto Scaling group, EKS...). Bạn đặt **expiration** (có thể gia hạn hoặc huỷ sớm); khi hết hạn traffic tự quay lại. Không đụng tới cấu hình subnet hay ASG. Với ALB cần bật thuộc tính tích hợp zonal shift trên load balancer. Ngoài ra có **zonal autoshift**: AWS tự shift khi phát hiện sự cố AZ, kèm practice run định kỳ.

### Vì sao các phương án khác sai
- **A:** Sửa subnet của ALB là thay đổi control plane, chậm, dễ sai và phải nhớ đảo lại.
- **B:** Terminate instance và đổi cấu hình ASG là không "reversible" nhanh; còn phải chờ instance mới.
- **D:** Failover cả Region cho một sự cố AZ là quá mức, chậm và rủi ro hơn.

> Exam tip: Kiến trúc phải có **dư capacity** ở các AZ còn lại (static stability) thì zonal shift mới an toàn. Thấy cụm "gray failure in one AZ" → nghĩ tới zonal shift / zonal autoshift.`,
  services: ['Amazon Route 53 Application Recovery Controller', 'Elastic Load Balancing', 'Amazon EC2 Auto Scaling'],
  refs: [{ type: 'doc', title: 'Zonal shift in ARC', url: 'https://docs.aws.amazon.com/r53recovery/latest/dg/arc-zonal-shift.html' }],
},
{
  id: 'dop-101',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company stores orders in an Amazon DynamoDB table. Last week, a faulty release overwrote thousands of items at 14:05, and the company could recover only from a daily on-demand backup, losing a day of data. In a separate incident, an engineer almost deleted the table while cleaning up a test environment. The company needs an RPO of minutes for logical corruption and wants to prevent accidental table deletion, with the LEAST operational overhead.

Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Enable point-in-time recovery (PITR) on the table and, after an incident, restore to a new table at a time just before the corruption.",
    "Enable DynamoDB Streams and write an AWS Lambda function that copies every change to an Amazon S3 bucket.",
    "Increase the frequency of on-demand backups to every hour by using an Amazon EventBridge schedule.",
    "Enable deletion protection on the table.",
    "Convert the table into a global table with a replica in a second Region.",
  ],
  answer: [0, 3],
  multi: true,
  explain: `**Từ khoá:** "logical corruption", "RPO of minutes", "prevent accidental deletion", "LEAST overhead".

### Vì sao A và D đúng
- **A: PITR** sao lưu liên tục, cho phép khôi phục tới **bất kỳ giây nào** trong cửa sổ recovery (mặc định 35 ngày, có thể đặt ngắn hơn) với độ trễ cuối khoảng 5 phút. Restore luôn tạo **bảng mới**; sau đó copy dữ liệu đúng về hoặc chuyển ứng dụng sang bảng mới. Không ảnh hưởng hiệu năng và không cần vận hành gì.
- **D: Deletion protection** là thuộc tính của bảng; khi bật, mọi lệnh DeleteTable đều bị từ chối cho tới khi ai đó chủ động tắt.

### Vì sao các phương án khác sai
- **B:** Tự xây pipeline backup là custom code, còn phải tự viết logic khôi phục.
- **C:** Backup mỗi giờ vẫn có RPO tới 1 giờ và tốn công lập lịch, quản lý.
- **E:** Global table **sao chép luôn cả lỗi ghi đè** sang Region kia trong vài giây; nó bảo vệ trước sự cố Region chứ không chống logical corruption.

> Exam tip: Replication (global tables, Multi-AZ, CRR) không phải backup. Logical corruption → **PITR / backup**; xoá nhầm → **deletion protection** (DynamoDB, RDS, ELB...). Restore PITR không mang theo một số cài đặt (auto scaling, TTL, stream, tags...), phải cấu hình lại.`,
  services: ['Amazon DynamoDB'],
  refs: [{ type: 'doc', title: 'Point-in-time recovery for DynamoDB', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Point-in-time-recovery.html' }],
},
{
  id: 'dop-102',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs an application in eu-west-1 with a warm standby copy in eu-central-1. The application reads database credentials and third-party API keys from AWS Secrets Manager. The secrets are rotated every 30 days in eu-west-1. During a DR test, the standby application could not start because the secrets did not exist in eu-central-1. The company wants the standby Region to always have the current secret values, encrypted with a key in that Region, with the LEAST operational overhead.

Which solution meets these requirements?`,
  options: [
    "Create an Amazon EventBridge rule for rotation events that invokes an AWS Lambda function to copy the secret values to new secrets in eu-central-1.",
    "Store the secrets as SecureString parameters in AWS Systems Manager Parameter Store in both Regions and update them as part of each rotation.",
    "Create a multi-Region AWS KMS key and use it to encrypt the secrets so that eu-central-1 can decrypt them.",
    "Configure replication for each secret to eu-central-1 with a KMS key in eu-central-1, so that Secrets Manager keeps the replica secrets synchronized with the primary.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "standby Region always has current values", rotation ở Region chính, "LEAST overhead".

### Vì sao D đúng
Secrets Manager hỗ trợ **multi-Region secrets**: replicate secret sang Region khác, chọn KMS key của Region đích. Replica có **cùng tên/ARN suffix**, và mỗi khi primary thay đổi (kể cả rotation) giá trị được đồng bộ sang replica. Khi DR thật, có thể **promote** replica thành secret độc lập. Ứng dụng ở eu-central-1 chỉ cần đọc secret tại Region của nó.

### Vì sao các phương án khác sai
- **A:** Làm được nhưng là custom code, dễ lệch phiên bản nếu Lambda lỗi.
- **B:** Bỏ tính năng rotation có sẵn của Secrets Manager và vẫn phải tự đồng bộ hai Region.
- **C:** Multi-Region KMS key chỉ giải quyết việc **giải mã**; bản thân secret vẫn không tồn tại ở eu-central-1.

> Exam tip: Rotation chỉ cấu hình trên **primary**; replica nhận giá trị mới. Thành phần DR hay bị quên: secrets, AMI, container image (ECR replication), KMS key, parameter, quota ở Region dự phòng.`,
  services: ['AWS Secrets Manager', 'AWS KMS'],
  refs: [{ type: 'doc', title: 'Replicate AWS Secrets Manager secrets across Regions', url: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/replicate-secrets.html' }],
},
{
  id: 'dop-103',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A media company stores user uploads in Amazon S3 buckets in us-east-1 and us-west-2. The application currently writes to a hard-coded bucket in us-east-1. The company needs a single global endpoint for S3 reads and writes, an active-passive configuration in which only us-east-1 receives requests during normal operation, the ability to fail over S3 traffic to us-west-2 within minutes during a Regional disruption, and data that is synchronized in both directions.

Which solution meets these requirements?`,
  options: [
    "Create an S3 Multi-Region Access Point with both buckets, configure two-way replication rules between the buckets, set us-west-2 as passive in the failover configuration, and use the Multi-Region Access Point failover controls to switch traffic during a disruption.",
    "Create Route 53 failover records that point a custom domain to the two bucket endpoints, and configure Cross-Region Replication from us-east-1 to us-west-2.",
    "Create an Amazon CloudFront distribution with an origin group that contains both buckets for origin failover, and send all reads and writes through CloudFront.",
    "Enable S3 Transfer Acceleration on both buckets and switch the application configuration to the us-west-2 bucket during a disruption.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "single global endpoint", "reads and writes", "active-passive", "fail over within minutes", "both directions".

### Vì sao A đúng
**S3 Multi-Region Access Point (MRAP)** cho một endpoint toàn cầu đứng trước nhiều bucket ở nhiều Region. **Failover configuration** đặt mỗi Region là active hoặc passive; khi có sự cố, đổi trạng thái bằng **failover controls** và traffic chuyển trong vài phút. Kết hợp **replication rules hai chiều** (có thể bật Replication Time Control) để dữ liệu ở hai bucket luôn đồng bộ, failback cũng an toàn.

### Vì sao các phương án khác sai
- **B:** S3 không phục vụ HTTPS với tên miền tuỳ ý trỏ thẳng vào bucket endpoint (và SigV4 gắn với Region); CRR một chiều không đáp ứng "both directions".
- **C:** Origin failover của CloudFront chỉ áp dụng cho request GET/HEAD/OPTIONS; ghi (PUT) không được failover.
- **D:** Transfer Acceleration chỉ tăng tốc truyền tải qua edge, không phải endpoint đa Region; đổi cấu hình ứng dụng là thủ công.

> Exam tip: MRAP dùng SigV4A khi ký request; SDK mới hỗ trợ. Thay đổi failover dùng data plane của MRAP routing control, không cần sửa ứng dụng.`,
  services: ['Amazon S3'],
  refs: [{ type: 'doc', title: 'Managing multi-Region traffic with Multi-Region Access Points', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/MultiRegionAccessPoints.html' }],
},
{
  id: 'dop-104',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company's internal application runs on Amazon EC2 instances in an Auto Scaling group with a target tracking policy on CPU utilization. Load rises sharply every weekday at 08:00 when employees log in, and new instances need about 10 minutes to download data and warm up. Users experience slow responses every morning until the group catches up. The traffic pattern shifts slightly every few weeks. The company wants capacity to be ready before the daily spike with the LEAST ongoing maintenance.

Which solution meets these requirements?`,
  options: [
    "Replace the target tracking policy with a step scaling policy that adds more instances at a lower CPU threshold.",
    "Create scheduled actions that increase the minimum capacity at 07:45 on weekdays and reduce it at 18:00, and adjust them when the pattern changes.",
    "Add a predictive scaling policy in forecast and scale mode with a scheduling buffer time of 10 minutes, and keep the target tracking policy for unexpected changes.",
    "Increase the default instance warmup and the cooldown period of the group.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "pattern lặp lại hằng ngày", "instances need 10 minutes to warm up", "pattern shifts", "LEAST ongoing maintenance".

### Vì sao C đúng
**Predictive scaling** dùng machine learning trên lịch sử metric (tối thiểu 24 giờ, tốt nhất tới 14 ngày) để dự báo tải 48 giờ tới và **chủ động** đặt capacity theo giờ. **SchedulingBufferTime** cho phép launch trước (ở đây 10 phút) để instance kịp warm up. Mô hình tự học lại khi pattern thay đổi, nên không phải sửa lịch. Giữ thêm target tracking để xử lý biến động ngoài dự báo; ASG dùng capacity lớn hơn trong các policy.

### Vì sao các phương án khác sai
- **A:** Step scaling vẫn **phản ứng sau** khi CPU đã tăng; instance cần 10 phút nên vẫn chậm.
- **B:** Scheduled actions chạy được nhưng phải tự chỉnh mỗi khi pattern lệch: trái "LEAST ongoing maintenance".
- **D:** Warmup/cooldown dài hơn làm scaling **chậm hơn**, không chuẩn bị trước.

> Exam tip: Chạy predictive scaling ở chế độ **forecast only** trước để so sánh dự báo với thực tế, rồi mới chuyển forecast and scale. Kết hợp **warm pools** khi thời gian khởi động rất dài.`,
  services: ['Amazon EC2 Auto Scaling', 'Amazon CloudWatch'],
  refs: [{ type: 'doc', title: 'Predictive scaling for Amazon EC2 Auto Scaling', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-predictive-scaling.html' }],
},
{
  id: 'dop-105',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `An AWS Lambda function processes messages from an Amazon SQS standard queue and writes to an Amazon RDS for PostgreSQL database that supports at most 50 concurrent connections from this workload. During traffic bursts, Lambda scales out to hundreds of concurrent executions and the database runs out of connections. A teammate set reserved concurrency to 10 on the function, but now many messages are throttled, retried, and moved to the dead-letter queue. The company wants to cap the consumer at 10 concurrent executions without causing throttling-related message failures.

What should the DevOps engineer do?`,
  options: [
    "Keep reserved concurrency at 10 and increase the maxReceiveCount of the redrive policy to 100.",
    "Remove reserved concurrency and set the maximum concurrency of the SQS event source mapping to 10.",
    "Reduce the batch size of the event source mapping to 1 so that each invocation uses fewer connections.",
    "Increase the visibility timeout of the queue to 6 times the function timeout and keep reserved concurrency at 10.",
  ],
  answer: 1,
  explain: `**Từ khoá:** SQS → Lambda, "cap at 10 concurrent", "reserved concurrency gây throttle và message vào DLQ".

### Vì sao B đúng
Với reserved concurrency, poller của event source mapping **không biết** giới hạn: nó vẫn lấy message và gọi hàm, Lambda trả lỗi throttle, message quay lại queue, tăng receive count và cuối cùng rơi vào DLQ dù không hề lỗi. **Maximum concurrency** (2 đến 1000) là thiết lập **trên event source mapping**: poller tự giới hạn số lần gọi đồng thời, message chưa xử lý cứ nằm trong queue, không có throttle giả.

### Vì sao các phương án khác sai
- **A:** Chỉ trì hoãn chuyện message vào DLQ; vẫn throttle, vẫn tăng độ trễ và chi phí nhận message.
- **C:** Batch nhỏ hơn làm **tăng** số invocation và concurrency, không giới hạn được.
- **D:** Visibility timeout đúng là nên ≥ 6 lần timeout hàm, nhưng không loại bỏ throttle do reserved concurrency.

> Exam tip: Nếu dùng cả hai, đặt reserved concurrency **lớn hơn** maximum concurrency của tất cả ESM trỏ vào hàm. Cũng nên cân nhắc **RDS Proxy** để gom connection.`,
  services: ['AWS Lambda', 'Amazon SQS', 'Amazon RDS'],
  refs: [{ type: 'doc', title: 'Configuring scaling behavior for SQS event source mappings', url: 'https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-scaling.html' }],
},
{
  id: 'dop-106',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `An application uses an Amazon Aurora MySQL cluster with one writer and one Aurora Replica. The application runs on AWS Lambda and opens a new database connection for most invocations. During Aurora failovers, the application returns errors for up to a minute because of DNS caching and a storm of new connections. Read traffic also varies by a factor of 5 during the day, and the single replica becomes overloaded at peak.

Which combination of steps will meet these requirements with the LEAST operational overhead? (Choose two.)`,
  options: [
    "Convert the cluster to an Amazon RDS for MySQL Multi-AZ DB instance deployment and send read traffic to the standby instance.",
    "Place Amazon RDS Proxy in front of the cluster and connect the Lambda functions to the proxy endpoint.",
    "Configure Aurora Auto Scaling with a target tracking policy on average reader CPU utilization or connections, and send reads to the reader endpoint.",
    "Scale the writer instance to a larger instance class so that it can absorb the read traffic.",
    "Add an Amazon ElastiCache cluster and cache every query result for 24 hours.",
  ],
  answer: [1, 2],
  multi: true,
  explain: `**Từ khoá:** Lambda mở nhiều connection, "errors during failover because of DNS caching", "read traffic varies 5x".

### Vì sao B và C đúng
- **B: RDS Proxy** giữ **connection pool** dùng chung, Lambda kết nối tới proxy nên không còn bão connection. Khi failover, proxy tự theo dõi writer mới và chuyển connection, **không phụ thuộc DNS** của client, giảm đáng kể thời gian lỗi. Proxy còn hỗ trợ IAM auth và Secrets Manager.
- **C: Aurora Auto Scaling** thêm/bớt Aurora Replica (tới 15) theo target tracking metric; **reader endpoint** phân tải giữa các replica. Đáp ứng tải đọc thay đổi 5 lần mà không phải can thiệp.

### Vì sao các phương án khác sai
- **A:** Ở Multi-AZ **DB instance** deployment, standby **không phục vụ đọc**; đây là bước lùi so với Aurora.
- **D:** Dồn đọc lên writer là bỏ phí replica, đắt và không cải thiện failover.
- **E:** Cache 24 giờ trả dữ liệu cũ cho đơn hàng, thay đổi logic ứng dụng nhiều, không xử lý lỗi failover.

> Exam tip: Lambda + RDS/Aurora gần như luôn đi kèm **RDS Proxy**. Đọc thay đổi theo giờ → **Aurora Auto Scaling**; đọc tăng ở Region khác → Aurora Global Database.`,
  services: ['Amazon Aurora', 'Amazon RDS Proxy', 'AWS Lambda'],
  refs: [
    { type: 'doc', title: 'Amazon RDS Proxy for Aurora', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.html' },
    { type: 'doc', title: 'Amazon Aurora Auto Scaling with Aurora Replicas', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Integrating.AutoScaling.html' },
  ],
},
{
  id: 'dop-107',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company runs 30 microservices on an Amazon EKS cluster with managed node groups. The operations team wants curated dashboards and CloudWatch metrics at the cluster, node, pod, and container level, including container restarts and resource utilization, and wants container logs to be sent to Amazon CloudWatch Logs. The team does not want to run and scale its own monitoring servers.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Install the Amazon CloudWatch Observability EKS add-on to enable Container Insights with enhanced observability and Fluent Bit log collection, and grant the add-on's service account the CloudWatchAgentServerPolicy permissions.",
    "Deploy a self-managed Prometheus server and Grafana in the cluster, and scrape kubelet and cAdvisor metrics.",
    "Enable Amazon EKS control plane logging for the api, audit, and scheduler log types.",
    "Enable VPC Flow Logs for the cluster VPC and analyze them with CloudWatch Logs Insights.",
  ],
  answer: 0,
  explain: `**Từ khoá:** EKS, metric ở mức cluster/node/pod/container, container logs, "không tự vận hành monitoring server".

### Vì sao A đúng
**Amazon CloudWatch Observability EKS add-on** cài CloudWatch agent và Fluent Bit dưới dạng add-on do EKS quản lý version. Nó bật **Container Insights (enhanced observability)**: metric chi tiết cho cluster, node, namespace, service, pod, container (CPU, memory, network, restart...) và dashboard dựng sẵn, đồng thời gửi container log sang CloudWatch Logs. Quyền cấp cho service account qua **EKS Pod Identity** hoặc IRSA (hoặc node role).

### Vì sao các phương án khác sai
- **B:** Prometheus/Grafana tự quản lý chính là "own monitoring servers" phải lo HA, storage, scale. (Nếu muốn Prometheus thì dùng Amazon Managed Service for Prometheus.)
- **C:** Control plane logging chỉ có log của API server, audit, authenticator, controller manager, scheduler; không có metric của pod/container.
- **D:** Flow logs là metadata mạng, không phải metric ứng dụng hay container.

> Exam tip: EKS add-on giúp nâng cấp agent cùng version cluster. Với ECS, Container Insights bật ở mức cluster (hoặc mặc định cho account), không cần add-on.`,
  services: ['Amazon EKS', 'Amazon CloudWatch', 'Amazon CloudWatch Logs'],
  refs: [{ type: 'doc', title: 'Install the CloudWatch agent with the Amazon CloudWatch Observability EKS add-on', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/install-CloudWatch-Observability-EKS-addon.html' }],
},
{
  id: 'dop-108',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A team operates 40 AWS Lambda functions written in Java. Some functions sporadically run slowly, and the team suspects memory pressure, high CPU time, and cold starts. The team needs per-function and per-invocation metrics such as memory utilization, CPU total time, network usage, and init duration, with prebuilt dashboards, while changing as little application code as possible.

What should the DevOps engineer do?`,
  options: [
    "Enable AWS X-Ray active tracing on each function and analyze the service map.",
    "Add code to each function that calls the CloudWatch PutMetricData API with memory and CPU values at the end of each invocation.",
    "Run CloudWatch Logs Insights queries on the REPORT lines of each function's log group whenever a slowdown is reported.",
    "Enable CloudWatch Lambda Insights on the functions by adding the Lambda Insights extension layer and the CloudWatchLambdaInsightsExecutionRolePolicy managed policy to the execution roles.",
  ],
  answer: 3,
  explain: `**Từ khoá:** Lambda, "memory utilization, CPU total time, network, init duration", "prebuilt dashboards", ít sửa code.

### Vì sao D đúng
**Lambda Insights** chạy dưới dạng **Lambda extension** (layer). Nó thu thập metric hệ thống ở mức invocation (memory, CPU total time, network, init duration, số lần cold start...) và gửi ở dạng embedded metric format vào log group {{/aws/lambda-insights}}, CloudWatch tạo metric và **dashboard đa hàm / từng hàm** sẵn có. Chỉ cần thêm layer và quyền (managed policy {{CloudWatchLambdaInsightsExecutionRolePolicy}}), làm được hàng loạt bằng SAM/CloudFormation, không sửa code.

### Vì sao các phương án khác sai
- **A:** X-Ray cho trace và thời gian từng segment/downstream call, không cho metric memory/CPU/network của môi trường thực thi.
- **B:** Tự publish metric là sửa code ở 40 hàm, tốn phí API và khó đo CPU chính xác.
- **C:** REPORT line chỉ có duration, billed duration, max memory used, init duration; không có CPU hay network, và chạy truy vấn thủ công không phải giám sát liên tục.

> Exam tip: Phân biệt: **Lambda Insights** (tài nguyên hệ thống), **X-Ray / Application Signals** (trace, latency giữa dịch vụ), **CloudWatch metrics mặc định** (Invocations, Errors, Duration, Throttles, ConcurrentExecutions).`,
  services: ['AWS Lambda', 'Amazon CloudWatch'],
  refs: [{ type: 'doc', title: 'Amazon CloudWatch Lambda Insights', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights.html' }],
},
{
  id: 'dop-109',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A batch worker application runs as a Java process on 50 Amazon EC2 instances. The process does not expose any network endpoint. Sometimes the Java process crashes while the instance remains healthy, and nobody notices for hours. The operations team wants to collect CPU and memory usage of the Java process specifically and to receive an alert within 5 minutes when the process is not running on an instance. The CloudWatch agent is already installed and managed through Systems Manager.

Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Create a CloudWatch alarm on the EC2 CPUUtilization metric that fires when CPU drops below 5%.",
    "Create a CloudWatch alarm on the EC2 StatusCheckFailed_Instance metric for each instance.",
    "Update the CloudWatch agent configuration in Parameter Store to add the procstat plugin that monitors the Java process by its command-line pattern and collects pid_count, cpu_usage, and memory_rss.",
    "Create a CloudWatch Synthetics canary that sends HTTP requests to each instance every minute.",
    "Create CloudWatch alarms on the procstat_lookup_pid_count metric for each instance that fire when the value is less than 1, and treat missing data as breaching.",
  ],
  answer: [2, 4],
  multi: true,
  explain: `**Từ khoá:** "process-level CPU/memory", "process crashes while instance is healthy", không có endpoint, CloudWatch agent sẵn có.

### Vì sao C và E đúng
- **C:** Plugin **procstat** của CloudWatch agent theo dõi tiến trình cụ thể theo {{exe}}, {{pattern}} (dòng lệnh) hoặc {{pid_file}} và phát metric như {{procstat_cpu_usage}}, {{procstat_memory_rss}}. Cập nhật config trong Parameter Store rồi đẩy bằng State Manager/Run Command (AmazonCloudWatch-ManageAgent).
- **E:** procstat luôn phát metric **procstat_lookup_pid_count**; tiến trình chết thì giá trị là 0. Alarm "< 1" (và coi missing data là breaching, phòng khi agent cũng ngừng) báo trong vài phút.

### Vì sao các phương án khác sai
- **A:** CPU instance thấp có thể chỉ là lúc rảnh; không phân biệt được process chết hay không có việc.
- **B:** Status check chỉ phát hiện lỗi OS/phần cứng, mà đề nói instance vẫn healthy.
- **D:** Process không có endpoint nên canary không có gì để gọi.

> Exam tip: Metric procstat có dimension theo pattern/exe và tính phí như custom metric; chỉ thu thập những measurement cần thiết. Với Windows, cũng dùng procstat (hoặc Windows performance counters).`,
  services: ['Amazon CloudWatch', 'AWS Systems Manager', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'Collect process metrics with the procstat plugin', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Agent-procstat-process-metrics.html' }],
},
{
  id: 'dop-110',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A healthcare company found that some applications write email addresses and credit card numbers into Amazon CloudWatch Logs. Developers need to keep reading these logs for troubleshooting, but the sensitive values must be masked for everyone except a small security group, and the company wants a report of how often sensitive data appears. The solution must not require changes to the applications.

Which solution meets these requirements?`,
  options: [
    "Create metric filters that match the sensitive patterns and an AWS Lambda function that rewrites the matching log events.",
    "Create a CloudWatch Logs data protection policy on the log groups (or at the account level) with managed data identifiers for email addresses and credit card numbers, send audit findings to a destination, and grant logs:Unmask only to the security group.",
    "Associate an AWS KMS customer managed key with the log groups and grant kms:Decrypt only to the security group.",
    "Create a subscription filter that sends the logs through Amazon Kinesis Data Firehose with a Lambda transformation that removes the sensitive values before storing them in Amazon S3.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "mask sensitive values", "everyone except security group", "report of how often", không sửa ứng dụng.

### Vì sao B đúng
**CloudWatch Logs data protection** dùng **managed data identifiers** (EmailAddress, CreditCardNumber, AWS secret key, địa chỉ, số hộ chiếu...) hoặc custom identifier (regex) để **phát hiện và che** dữ liệu nhạy cảm ngay khi ingest. Khi xem trong console, Logs Insights, subscription... giá trị hiện dạng che; chỉ principal có quyền **logs:Unmask** mới thấy nguyên bản. **Audit findings** có thể gửi tới log group khác, S3 hoặc Firehose để báo cáo tần suất. Policy đặt ở mức log group hoặc account.

### Vì sao các phương án khác sai
- **A:** Log event đã ingest **không thể sửa**; metric filter chỉ đếm, không viết lại log.
- **C:** Mã hoá KMS bảo vệ at rest; người có quyền đọc log group (và key) vẫn thấy toàn bộ giá trị, không có mức che từng trường.
- **D:** Bản trong S3 được làm sạch nhưng log group gốc vẫn chứa dữ liệu rõ và developer vẫn đọc ở đó.

> Exam tip: Data protection chỉ áp dụng cho log ingest **sau** khi bật policy. Muốn tìm dữ liệu nhạy cảm trong S3 thì dùng Amazon Macie; trong log thì dùng data protection policy.`,
  services: ['Amazon CloudWatch Logs', 'AWS IAM'],
  refs: [{ type: 'doc', title: 'Help protect sensitive log data with masking', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/mask-sensitive-log-data.html' }],
},
{
  id: 'dop-111',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company has 60 AWS accounts in AWS Organizations, and AWS Config is recording resources in all accounts and Regions. The FinOps team wants to run ad hoc SQL-like queries against the current configuration of resources across all accounts and Regions, for example to count EC2 instances by instance type or to list EBS volumes that are not gp3. The company does not want to build or maintain a data pipeline.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Configure AWS Config to deliver configuration snapshots to a central Amazon S3 bucket, and create AWS Glue tables and Amazon Athena queries over the snapshots.",
    "Use AWS Resource Explorer with an aggregator index to search for EC2 instances and EBS volumes in all accounts.",
    "Create an organization-wide AWS Config aggregator in a delegated administrator account, and run AWS Config advanced queries against the aggregator.",
    "Use AWS Trusted Advisor cost optimization checks to list instance types and EBS volume types across the organization.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "SQL-like queries", "current configuration", "across accounts and Regions", "không xây data pipeline".

### Vì sao C đúng
**Config aggregator** (loại organization) gom dữ liệu cấu hình và compliance của mọi account/Region về một account (management hoặc **delegated administrator**). **Advanced query** dùng cú pháp tập con của SQL SELECT trên thuộc tính cấu hình hiện tại, có {{WHERE}}, {{GROUP BY}}, {{COUNT}}, ví dụ {{SELECT configuration.instanceType, COUNT(*) WHERE resourceType = 'AWS::EC2::Instance' GROUP BY configuration.instanceType}}. Chạy trực tiếp trong console hoặc API, không cần pipeline.

### Vì sao các phương án khác sai
- **A:** Làm được nhưng phải dựng và duy trì S3 + Glue + Athena: chính là data pipeline.
- **B:** Resource Explorer tìm kiếm resource theo tên, tag, loại; không truy vấn và gộp nhóm theo thuộc tính cấu hình chi tiết như instanceType hay volumeType.
- **D:** Trusted Advisor đưa ra khuyến nghị theo check định sẵn, không phải truy vấn tuỳ ý.

> Exam tip: Advanced query chỉ truy vấn **trạng thái hiện tại**; muốn lịch sử cấu hình theo thời gian thì dùng configuration history/snapshot (S3 + Athena).`,
  services: ['AWS Config', 'AWS Organizations'],
  refs: [
    { type: 'doc', title: 'Querying the current configuration state of AWS resources', url: 'https://docs.aws.amazon.com/config/latest/developerguide/querying-AWS-resources.html' },
    { type: 'doc', title: 'Multi-account multi-Region data aggregation', url: 'https://docs.aws.amazon.com/config/latest/developerguide/aggregate-data.html' },
  ],
},
{
  id: 'dop-112',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `An auditor requires a reliable record of every GetObject and DeleteObject request against objects under the confidential/ prefix of one Amazon S3 bucket, including the IAM identity of the caller. An organization trail in AWS CloudTrail currently logs management events only. The bucket receives billions of requests to other prefixes, and the company wants to keep logging costs as low as possible.

Which solution meets these requirements?`,
  options: [
    "Enable S3 server access logging on the bucket and filter the log files for the confidential/ prefix.",
    "Enable CloudTrail data events for all current and future S3 buckets in the organization trail.",
    "Enable Amazon S3 request metrics with a filter for the confidential/ prefix and store the metrics in CloudWatch.",
    "Add advanced event selectors to the trail that log S3 data events only when the resources.ARN starts with the bucket ARN followed by /confidential/ and the eventName is GetObject or DeleteObject.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "reliable record", "GetObject/DeleteObject", "IAM identity", "one prefix", "costs as low as possible".

### Vì sao D đúng
S3 object-level API là **data events**, CloudTrail không ghi mặc định. **Advanced event selectors** cho phép lọc chi tiết theo các field như {{resources.type}}, {{resources.ARN}} (StartsWith), {{eventName}}, {{readOnly}}. Chỉ ghi đúng prefix confidential/ và hai API cần thiết nên chi phí data event (tính theo số event) nhỏ. Bản ghi CloudTrail có đầy đủ {{userIdentity}} và được giao đáng tin cậy.

### Vì sao các phương án khác sai
- **A:** Server access logs giao theo kiểu **best effort**, có thể thiếu hoặc trễ; không đạt "reliable record" cho kiểm toán.
- **B:** Ghi data event cho mọi bucket với hàng tỉ request là chi phí rất cao.
- **C:** Request metrics chỉ là số đếm, không có danh tính người gọi.

> Exam tip: Cùng cơ chế advanced event selectors dùng cho data event của Lambda, DynamoDB và nhiều dịch vụ khác; CloudTrail Lake cũng dùng chúng. Thấy "audit who accessed an object" → CloudTrail data events, không phải server access logs.`,
  services: ['AWS CloudTrail', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'Logging data events with CloudTrail', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html' }],
},
{
  id: 'dop-113',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `An Amazon EventBridge rule matches ECS Task State Change events where lastStatus is STOPPED and sends them to an Amazon SNS topic that emails the on-call team. Engineers complain that the emails contain the full JSON event and are hard to read. They want a short message such as "Task <taskArn> in cluster <clusterArn> stopped: <stoppedReason>" and do not want to deploy or maintain additional code.

What should the DevOps engineer do?`,
  options: [
    "Configure an input transformer on the rule target that extracts taskArn, clusterArn, and stoppedReason with input paths and builds the message with an input template.",
    "Add a subscription filter policy on the SNS subscription that selects only the taskArn, clusterArn, and stoppedReason attributes.",
    "Change the rule target to an AWS Lambda function that formats the message and publishes it to the SNS topic.",
    "Send the events to a CloudWatch Logs log group and create a metric filter that extracts the fields into the alarm description.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "short readable message", lấy vài field từ event, "no additional code".

### Vì sao A đúng
**Input transformer** là tính năng của target trong EventBridge rule: **InputPathsMap** ánh xạ biến tới JSON path trong event (ví dụ {{taskArn: $.detail.taskArn}}, {{reason: $.detail.stoppedReason}}), **InputTemplate** ghép chúng thành chuỗi hoặc JSON mới bằng placeholder dạng {{<taskArn>}}. Target nhận đúng thông điệp đã định dạng, không cần Lambda.

### Vì sao các phương án khác sai
- **B:** SNS filter policy quyết định subscription **có nhận** message hay không; nó không cắt bớt hay định dạng nội dung.
- **C:** Hoạt động nhưng là code phải deploy, phân quyền và giám sát: trái yêu cầu.
- **D:** Metric filter tạo metric số, không chuyển field văn bản thành nội dung email.

> Exam tip: Các cách "không code" với EventBridge: event pattern để lọc, input transformer để định dạng, **API destinations** để gọi HTTP endpoint, **EventBridge Pipes** để lọc/làm giàu giữa source và target.`,
  services: ['Amazon EventBridge', 'Amazon SNS', 'Amazon ECS'],
  refs: [{ type: 'doc', title: 'Amazon EventBridge input transformation', url: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-transform-target-input.html' }],
},
{
  id: 'dop-114',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A retail company uses AWS Systems Manager State Manager associations to apply configuration changes and restart services on production instances on a schedule. Last holiday season, an association ran during the peak sales period and caused a brief outage. The company wants scheduled associations to be blocked automatically during defined change freeze periods, while running normally at all other times, with the LEAST custom code.

Which solution meets these requirements?`,
  options: [
    "Add an Amazon EventBridge scheduled rule that disables each association at the start of a freeze period and another rule that enables it again at the end.",
    "Add a step to each association document that checks the current date against a hard-coded freeze list and exits.",
    "Create a Systems Manager Change Calendar of type DEFAULT_OPEN, add events for the freeze periods, and attach the calendar to the State Manager associations so that they run only when the calendar state is OPEN.",
    "Move the configuration changes into an AWS CodePipeline pipeline with a manual approval action that approvers reject during freeze periods.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "blocked during change freeze periods", "running normally at other times", State Manager, "LEAST custom code".

### Vì sao C đúng
**Change Calendar** (một tính năng của Systems Manager) là document kiểu calendar với hai loại: **DEFAULT_OPEN** (mặc định cho phép, các event là thời gian **đóng**) và **DEFAULT_CLOSED** (mặc định chặn, event là thời gian mở). Gắn calendar vào **State Manager association** (tham số calendar names): association chỉ chạy khi calendar ở trạng thái OPEN. Automation runbook cũng có thể kiểm tra calendar, và API {{GetCalendarState}} cho phép công cụ khác dùng chung lịch.

### Vì sao các phương án khác sai
- **A:** Hai rule cho mỗi association, dễ quên khi thêm association mới và thêm thành phần phải giám sát.
- **B:** Hard-code ngày vào document là custom code, khó cập nhật và phải sửa ở mọi document.
- **D:** Đổi cả cơ chế vận hành sang pipeline và phụ thuộc người bấm reject, không tự động.

> Exam tip: Change Calendar còn dùng được với maintenance window và Automation. Lưu ý trạng thái dịch vụ: **Change Manager** (quy trình phê duyệt change request) đã ngừng nhận khách hàng mới từ 07/11/2025, còn Change Calendar vẫn dùng bình thường.`,
  services: ['AWS Systems Manager'],
  refs: [{ type: 'doc', title: 'AWS Systems Manager Change Calendar', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-change-calendar.html' }],
},
{
  id: 'dop-115',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A legacy Tomcat application runs on Amazon EC2 instances that are not in an Auto Scaling group. Occasionally, the JVM hangs: a CloudWatch alarm on a custom heap metric goes into ALARM, and an engineer logs in to restart the Tomcat service, which always fixes the issue. The company wants the restart to happen automatically on the affected instance, with an audit trail of every remediation and without managing servers for the automation.

Which solution meets these requirements?`,
  options: [
    "Configure the CloudWatch alarm action to reboot the EC2 instance.",
    "Create an Amazon EventBridge rule that matches CloudWatch Alarm State Change events for the heap alarm and targets a Systems Manager Automation runbook that restarts the Tomcat service on the instance by using a Run Command step.",
    "Install a cron job on each instance that restarts Tomcat every hour.",
    "Configure the CloudWatch alarm to send a notification to an Amazon SNS topic that emails the on-call engineer with restart instructions.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "restart the service automatically", "on the affected instance", "audit trail", không tự quản lý server.

### Vì sao B đúng
CloudWatch alarm phát event **CloudWatch Alarm State Change** lên EventBridge. Rule khớp đúng alarm và trạng thái ALARM, target là **Systems Manager Automation** (EventBridge hỗ trợ target này), truyền instance ID lấy từ dimension của alarm (qua input transformer). Runbook có bước {{aws:runCommand}} chạy {{AWS-RunShellScript}} để restart Tomcat. Mỗi execution của Automation và Run Command được lưu lịch sử, kèm CloudTrail: đủ audit trail. Không có server nào phải vận hành.

### Vì sao các phương án khác sai
- **A:** Reboot cả instance chậm hơn và mạnh tay hơn cần thiết; yêu cầu là restart service.
- **C:** Restart mù mỗi giờ gây gián đoạn vô ích và vẫn để treo tới 1 giờ.
- **D:** Vẫn là thao tác tay của kỹ sư.

> Exam tip: Alarm action trực tiếp hỗ trợ: SNS, EC2 action (stop/terminate/reboot/recover), Auto Scaling, tạo OpsItem/incident, và gọi Lambda. Muốn chạy **runbook SSM** theo alarm thì đi qua **EventBridge**.`,
  services: ['Amazon CloudWatch', 'Amazon EventBridge', 'AWS Systems Manager', 'Amazon EC2'],
  refs: [{ type: 'doc', title: 'AWS-RestartEC2Instance runbook reference (Automation)', url: 'https://docs.aws.amazon.com/systems-manager-automation-runbooks/latest/userguide/automation-aws-restartec2instance.html' }],
},
{
  id: 'dop-116',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A DevOps engineer adds a step to an AWS CodeBuild project that runs docker build and docker push to Amazon ECR. The project uses an AWS managed standard Linux image on EC2 compute. The build fails at the docker build command with the error "Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?". The CodeBuild service role already has permissions for Amazon ECR.

What should the engineer do to resolve the error?`,
  options: [
    "Add the ecr:GetAuthorizationToken permission to the CodeBuild service role.",
    "Change the project to AWS Lambda compute so that builds start faster.",
    "Change the project to a larger compute type with more memory.",
    "Enable privileged mode in the project's environment settings.",
  ],
  answer: 3,
  explain: `**Từ khoá:** "Cannot connect to the Docker daemon", build image Docker trong CodeBuild.

### Vì sao D đúng
Build trong CodeBuild tự chạy trong container. Để chạy **Docker daemon** bên trong (Docker-in-Docker) phục vụ docker build, project phải bật **privileged mode** (thuộc tính {{privilegedMode: true}} của environment). Không bật thì daemon không khởi động và lệnh docker báo đúng lỗi trên. Lưu ý chỉ bật cho project cần thiết, vì privileged mở rộng quyền của build container.

### Vì sao các phương án khác sai
- **A:** Thiếu quyền ECR sẽ gây lỗi ở bước **login/push** (no basic auth credentials, AccessDenied), không phải lỗi kết nối daemon. Đề cũng nói quyền đã có.
- **B:** Lambda compute **không hỗ trợ** Docker build và privileged mode, nên càng không chạy được.
- **C:** Thiếu bộ nhớ gây lỗi khác (out of memory, build bị kill), không làm mất daemon.

> Exam tip: Nhóm lỗi CodeBuild hay gặp: Docker daemon → privileged mode; không truy cập Internet khi chạy trong VPC → subnet private có NAT; Docker Hub rate limit → dùng ECR pull through cache hoặc ECR Public.`,
  services: ['AWS CodeBuild', 'Amazon ECR'],
  refs: [{ type: 'doc', title: 'Troubleshooting AWS CodeBuild', url: 'https://docs.aws.amazon.com/codebuild/latest/userguide/troubleshooting.html' }],
},
{
  id: 'dop-117',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `An AWS Lambda function must read from an Amazon RDS DB instance in private subnets and call a third-party HTTPS API on the internet. A developer attached the function to the VPC by selecting the public subnets, whose route tables send 0.0.0.0/0 to an internet gateway. The database queries succeed, but every call to the third-party API times out.

Which combination of steps will resolve the issue? (Choose two.)`,
  options: [
    "Allocate Elastic IP addresses and associate them with the Lambda function's elastic network interfaces.",
    "Attach the function to private subnets instead of the public subnets.",
    "Keep the function in the public subnets and enable auto-assign public IPv4 addresses on those subnets.",
    "Create a NAT gateway in a public subnet and add a 0.0.0.0/0 route to the NAT gateway in the private subnets' route tables.",
    "Create an Amazon S3 gateway endpoint in the VPC.",
  ],
  answer: [1, 3],
  multi: true,
  explain: `**Từ khoá:** Lambda trong VPC, "public subnets + internet gateway", "calls to internet time out".

### Vì sao B và D đúng
ENI mà Lambda tạo trong VPC **không bao giờ có public IP**, nên dù đặt ở public subnet, traffic ra internet gateway cũng không đi được. Mô hình đúng: gắn hàm vào **private subnets**, và private subnets có route {{0.0.0.0/0}} tới **NAT gateway** đặt trong public subnet (NAT gateway có Elastic IP, ra internet qua internet gateway). Kết nối tới RDS vẫn hoạt động trong VPC.

### Vì sao các phương án khác sai
- **A:** Không hỗ trợ gắn Elastic IP vào ENI do Lambda quản lý.
- **C:** Auto-assign public IP chỉ áp dụng cho instance launch vào subnet; Lambda ENI vẫn không có public IP.
- **E:** Gateway endpoint chỉ mở đường tới S3 (hoặc DynamoDB), không tới API bên thứ ba.

> Exam tip: Lambda không gắn VPC thì có Internet sẵn nhưng không vào được tài nguyên private. Gắn VPC thì muốn ra Internet phải có **NAT**, muốn gọi dịch vụ AWS mà không qua NAT thì dùng **VPC endpoint**.`,
  services: ['AWS Lambda', 'Amazon VPC', 'Amazon RDS'],
  refs: [{ type: 'doc', title: 'Enable internet access for VPC-connected Lambda functions', url: 'https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc-internet.html' }],
},
{
  id: 'dop-118',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A CloudFormation template defines an AWS::ElasticLoadBalancingV2::TargetGroup with an explicit Name property of api-tg. A developer changed the target group's Port property from 8080 to 9090. The stack update failed and rolled back with the message: "CloudFormation cannot update a stack when a custom-named resource requires replacing. Rename api-tg and update the stack again." The stack is now in UPDATE_ROLLBACK_COMPLETE.

What should the DevOps engineer do to apply the change?`,
  options: [
    "Run continue-update-rollback on the stack and skip the target group resource.",
    "Delete the target group manually in the console and then run the stack update again.",
    "Change the Name property to a new value (or remove it so that CloudFormation generates a unique name) together with the Port change, and update the stack.",
    "Enable termination protection on the stack and retry the update with the same template.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "custom-named resource requires replacing", thay đổi property cần replacement.

### Vì sao C đúng
Đổi **Port** của target group thuộc loại **Replacement**: CloudFormation tạo resource mới **trước**, chuyển tham chiếu (listener) sang resource mới, rồi mới xoá resource cũ. Vì tên do người dùng đặt cố định, resource mới không thể trùng tên resource cũ đang tồn tại, nên CloudFormation từ chối. Đổi tên (hoặc bỏ Name để CloudFormation tự sinh tên duy nhất) cho phép replacement diễn ra.

### Vì sao các phương án khác sai
- **A:** continue-update-rollback chỉ dành cho stack ở **UPDATE_ROLLBACK_FAILED**; stack đang UPDATE_ROLLBACK_COMPLETE là ổn định.
- **B:** Xoá tay resource do stack quản lý gây drift, làm gián đoạn listener và các update sau dễ lỗi.
- **D:** Termination protection không liên quan tới update; thử lại vẫn lỗi y như cũ.

> Exam tip: Best practice: **không đặt tên cứng** cho resource trừ khi bắt buộc; dùng tham số hoặc để CloudFormation tự đặt. Trước khi update hãy xem change set, cột Replacement cho biết resource nào sẽ bị thay.`,
  services: ['AWS CloudFormation', 'Elastic Load Balancing'],
  refs: [{ type: 'doc', title: 'Troubleshooting CloudFormation', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/troubleshooting.html' }],
},
{
  id: 'dop-119',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `An Amazon ECS service on AWS Fargate injects a database password into a container by using the secrets section of the task definition, which references an AWS Secrets Manager secret encrypted with a customer managed AWS KMS key. New tasks fail to start with "ResourceInitializationError: unable to pull secrets or registry auth" and an AccessDeniedException in the stopped reason. Other tasks in the same subnets pull images from Amazon ECR without problems.

Which combination of steps will resolve the issue? (Choose two.)`,
  options: [
    "Grant secretsmanager:GetSecretValue on the secret ARN to the task execution role.",
    "Grant secretsmanager:GetSecretValue on the secret ARN to the task role that the application uses.",
    "Replace the secret reference with a plaintext environment variable in the task definition.",
    "Grant kms:Decrypt on the customer managed key to the task execution role, and allow it in the key policy.",
    "Change the task network mode from awsvpc to bridge.",
  ],
  answer: [0, 3],
  multi: true,
  explain: `**Từ khoá:** "secrets section of the task definition", "customer managed KMS key", ResourceInitializationError, AccessDenied; mạng không phải vấn đề (task khác pull ECR được).

### Vì sao A và D đúng
Secret khai báo trong task definition được **ECS agent / Fargate** lấy **trước khi** container chạy, bằng **task execution role** (không phải task role). Role này cần {{secretsmanager:GetSecretValue}} trên secret, và vì secret mã hoá bằng **customer managed key**, cần thêm {{kms:Decrypt}} trên key đó (key policy cũng phải cho phép). Thiếu một trong hai sẽ ra AccessDenied đúng như đề.

### Vì sao các phương án khác sai
- **B:** Task role là quyền của **code ứng dụng** khi gọi AWS API lúc chạy; việc inject secret không dùng role này.
- **C:** Đưa mật khẩu dạng plaintext vào task definition là vi phạm bảo mật.
- **E:** Fargate chỉ hỗ trợ awsvpc, và lỗi là phân quyền chứ không phải mạng.

> Exam tip: Phân biệt hai role: **execution role** = pull image ECR, đẩy log CloudWatch, lấy secret/parameter để inject; **task role** = quyền của ứng dụng. Nếu lỗi là timeout thay vì AccessDenied thì nghĩ tới VPC endpoint/NAT.`,
  services: ['Amazon ECS', 'AWS Fargate', 'AWS Secrets Manager', 'AWS KMS', 'AWS IAM'],
  refs: [
    { type: 'doc', title: 'Amazon ECS task execution IAM role', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html' },
    { type: 'doc', title: 'Pass sensitive data to an Amazon ECS container', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html' },
  ],
},
{
  id: 'dop-120',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A DevOps engineer is configuring an Amazon S3 event notification on a bucket so that an AWS Lambda function is invoked for every s3:ObjectCreated:* event. When the engineer saves the notification configuration, S3 returns the error "Unable to validate the following destination configurations". The function's execution role already allows s3:GetObject on the bucket.

What should the engineer do to resolve the error?`,
  options: [
    "Add s3:PutBucketNotification permission to the Lambda function's execution role.",
    "Add a statement to the Lambda function's resource-based policy that allows the s3.amazonaws.com principal to call lambda:InvokeFunction, with conditions on the source bucket ARN and source account.",
    "Enable versioning on the bucket before configuring event notifications.",
    "Add a bucket policy statement that allows the Lambda function's execution role to call s3:GetBucketNotification.",
  ],
  answer: 1,
  explain: `**Từ khoá:** S3 event notification → Lambda, "Unable to validate the following destination configurations".

### Vì sao B đúng
Khi lưu notification configuration, S3 **kiểm tra rằng nó có quyền gửi tới đích**. Với Lambda, quyền đó nằm trong **resource-based policy** của function: cho phép principal {{s3.amazonaws.com}} gọi {{lambda:InvokeFunction}}, nên giới hạn bằng {{aws:SourceArn}} (ARN bucket) và {{aws:SourceAccount}} để tránh confused deputy. Console tự thêm khi tạo trigger từ phía Lambda, nhưng làm bằng API/IaC thì phải tự khai báo (CloudFormation: {{AWS::Lambda::Permission}}). Tương tự với SNS topic policy và SQS queue policy.

### Vì sao các phương án khác sai
- **A:** Execution role là quyền của **hàm** khi chạy, không phải quyền để S3 gọi vào hàm.
- **C:** Event notification không cần versioning.
- **D:** Quyền đọc cấu hình notification không liên quan tới việc S3 invoke hàm.

> Exam tip: Trong CloudFormation, cần **DependsOn** từ bucket tới Lambda::Permission, nếu không bucket có thể được cấu hình trước khi permission tồn tại và gặp chính lỗi này. Muốn nhiều consumer và lọc phức tạp thì bật gửi event sang **EventBridge**.`,
  services: ['Amazon S3', 'AWS Lambda', 'AWS IAM'],
  refs: [{ type: 'doc', title: 'Enabling and configuring event notifications', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/how-to-enable-disable-notification-intro.html' }],
},
{
  id: 'dop-121',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company runs 200 on-premises Linux servers that upload reports to Amazon S3. Today the servers use IAM user access keys stored in configuration files, which the security team wants to eliminate. Every server already has an X.509 certificate issued by the company's internal certificate authority. The servers must obtain temporary AWS credentials without long-term secrets.

Which combination of steps will meet these requirements? (Choose three.)`,
  options: [
    "Create an IAM Roles Anywhere trust anchor that references the company's certificate authority certificate bundle.",
    "Create an IAM user for each server and rotate the access keys every 30 days with AWS Secrets Manager.",
    "Create an IAM role whose trust policy allows the rolesanywhere.amazonaws.com service principal, and create an IAM Roles Anywhere profile that references the role.",
    "Register the servers as Systems Manager hybrid managed nodes and use the Systems Manager service role credentials in the reporting application.",
    "Configure the AWS SDK on each server with a credential_process that runs the IAM Roles Anywhere credential helper (aws_signing_helper) with the server's certificate and private key.",
    "Create an Amazon Cognito identity pool that accepts X.509 certificates and exchanges them for temporary credentials.",
  ],
  answer: [0, 2, 4],
  multi: true,
  explain: `**Từ khoá:** on-premises servers, "X.509 certificate from internal CA", "temporary credentials", bỏ access key.

### Vì sao A, C, E đúng
**IAM Roles Anywhere** cho workload ngoài AWS đổi chứng chỉ X.509 lấy credential tạm thời của IAM role:
- **A: Trust anchor** chỉ định CA được tin cậy (AWS Private CA hoặc CA bên ngoài, bằng certificate bundle).
- **C: Role** có trust policy cho {{rolesanywhere.amazonaws.com}} (thường thêm điều kiện theo thuộc tính chứng chỉ), và **profile** chỉ định role nào được nhận, có thể kèm session policy.
- **E:** Trên server, **credential helper** ký request bằng private key và gọi CreateSession; cấu hình {{credential_process}} trong AWS config để mọi SDK/CLI tự lấy và làm mới credential.

### Vì sao các phương án khác sai
- **B:** Vẫn là access key dài hạn, dù có xoay vòng.
- **D:** Hybrid activation dành cho SSM Agent quản lý server; dùng lại credential của service role đó cho ứng dụng là không đúng mục đích và không dựa trên chứng chỉ có sẵn.
- **F:** Cognito identity pool phục vụ người dùng ứng dụng qua identity provider, không xác thực bằng chứng chỉ X.509 của máy chủ.

> Exam tip: Workload ngoài AWS cần credential: có PKI → **IAM Roles Anywhere**; đã dùng SSM hybrid để quản lý → hybrid activation cho agent; CI/CD bên ngoài (GitHub Actions) → **OIDC federation** với AssumeRoleWithWebIdentity.`,
  services: ['IAM Roles Anywhere', 'AWS IAM', 'Amazon S3'],
  refs: [{ type: 'doc', title: 'What is IAM Roles Anywhere?', url: 'https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html' }],
},
{
  id: 'dop-122',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A financial company deploys AWS Lambda functions from an AWS CodePipeline pipeline. A security audit requires proof that only code packaged by the pipeline can be deployed to the production functions, and that any package that was modified after packaging or was produced elsewhere must be rejected at deployment time.

Which solution meets these requirements?`,
  options: [
    "Restrict the S3 bucket policy for deployment packages so that only the pipeline role can upload objects.",
    "Store a SHA-256 checksum of each package in a Lambda environment variable and validate it at function startup.",
    "Create an AWS Signer signing profile, sign packages in the pipeline, and attach a Lambda code signing configuration that lists the signing profile as an allowed publisher with the untrusted artifact policy set to Enforce.",
    "Attach a Lambda code signing configuration that lists the signing profile as an allowed publisher with the untrusted artifact policy set to Warn.",
  ],
  answer: 2,
  explain: `**Từ khoá:** "only code packaged by the pipeline", "modified after packaging must be rejected at deployment time".

### Vì sao C đúng
**AWS Signer** ký package (zip trong S3) bằng **signing profile**. **Code signing configuration** của Lambda khai báo **allowed publishers** (các signing profile) và **untrusted artifact on deployment** = **Enforce**. Khi CreateFunction/UpdateFunctionCode, Lambda kiểm tra chữ ký: package không ký, ký bởi profile khác, đã bị sửa sau khi ký, hoặc chữ ký hết hạn/bị thu hồi đều bị **từ chối**. Pipeline gọi {{start-signing-job}} (hoặc {{sam package --signing-profiles}}) trước khi deploy.

### Vì sao các phương án khác sai
- **A:** Hạn chế người upload không chứng minh được tính toàn vẹn, và vẫn có thể deploy package từ nơi khác (zip trực tiếp hoặc bucket khác).
- **B:** Kiểm tra lúc khởi động là quá muộn (code đã được deploy) và giá trị checksum có thể bị sửa cùng lúc.
- **D:** Chế độ **Warn** chỉ ghi log/metric cảnh báo mà vẫn cho deploy: không đạt "rejected".

> Exam tip: Code signing của Lambda áp dụng cho package dạng **.zip**; với container image thì ký image (ví dụ Notation + AWS Signer) và kiểm tra ở bước admission/policy.`,
  services: ['AWS Signer', 'AWS Lambda', 'AWS CodePipeline'],
  refs: [{ type: 'doc', title: 'Verifying code integrity with code signing (Lambda)', url: 'https://docs.aws.amazon.com/lambda/latest/dg/configuration-codesigning.html' }],
},
{
  id: 'dop-123',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company's compliance policy requires that the key material of every symmetric encryption KMS key used for application data be rotated automatically every 180 days. Old ciphertext must remain decryptable without re-encrypting data, and applications must not change the key IDs or aliases they use. The keys were created in AWS KMS with AWS-generated key material.

Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Enable automatic key rotation on each customer managed key with a rotation period of 180 days.",
    "Switch the applications to AWS managed keys, which rotate automatically.",
    "Schedule an AWS Lambda function every 180 days to create new KMS keys and update the aliases to point to them.",
    "Re-create the keys with imported key material and set the key material to expire every 180 days.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "automatic", "every 180 days", "old ciphertext still decryptable", "không đổi key ID/alias", key material do AWS sinh.

### Vì sao A đúng
Với **customer managed key** đối xứng có origin AWS_KMS, **automatic key rotation** hỗ trợ **rotation period** tuỳ chỉnh từ **90 đến 2560 ngày** (mặc định 365). KMS sinh key material mới, giữ toàn bộ material cũ để giải mã ciphertext cũ, key ID/ARN/alias không đổi, ứng dụng không cần biết. Ngoài ra có **on-demand rotation** khi cần xoay ngay.

### Vì sao các phương án khác sai
- **B:** AWS managed key xoay mỗi năm và **không đổi được** chu kỳ; key policy cũng không tuỳ chỉnh được.
- **C:** Key mới là key khác: dữ liệu cũ phải giải mã bằng key cũ (phải giữ và quản lý cả hai), cộng với code phải vận hành.
- **D:** Key với imported material không hỗ trợ automatic rotation; material hết hạn làm key **không dùng được**, có thể mất khả năng giải mã.

> Exam tip: Automatic rotation **không** hỗ trợ: asymmetric key, HMAC key, key trong custom key store, key có imported material. Rotation không re-encrypt dữ liệu cũ; nó chỉ đổi material dùng cho lần mã hoá mới.`,
  services: ['AWS KMS'],
  refs: [{ type: 'doc', title: 'Rotate AWS KMS keys', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html' }],
},
{
  id: 'dop-124',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company accesses Amazon EC2 instances in private subnets through an SSH bastion host. The private subnets have no NAT gateway or internet access. The security team wants to remove the bastion host, close all inbound ports on the instances, and keep a record of every command run in interactive sessions in an Amazon S3 bucket encrypted with AWS KMS.

Which combination of steps will meet these requirements? (Choose three.)`,
  options: [
    "Allow inbound port 22 from the corporate CIDR range and connect with EC2 Instance Connect.",
    "Attach an instance profile that includes the AmazonSSMManagedInstanceCore policy and permissions to write to the logging bucket and use the KMS key.",
    "Enable CloudTrail data events so that the commands typed in each session are recorded.",
    "Create interface VPC endpoints for ssm, ssmmessages, and ec2messages, and a gateway endpoint for Amazon S3, in the VPC.",
    "Keep the bastion host and enable VPC Flow Logs for its subnet.",
    "Configure Session Manager preferences to send session logs to the S3 bucket with encryption enforced and to encrypt session data with the KMS key.",
  ],
  answer: [1, 3, 5],
  multi: true,
  explain: `**Từ khoá:** bỏ bastion, "close all inbound ports", subnet không có Internet, "record every command" vào S3 mã hoá KMS.

### Vì sao B, D, F đúng
- **B:** **Session Manager** dùng SSM Agent kết nối **ra ngoài** (HTTPS 443) nên không cần inbound port. Instance cần quyền {{AmazonSSMManagedInstanceCore}}, cộng quyền ghi S3 và dùng KMS key để upload log.
- **D:** Không có NAT nên agent cần **interface endpoint** cho {{ssm}}, {{ssmmessages}}, {{ec2messages}} và **S3 gateway endpoint** để đẩy log.
- **F:** Trong **Session Manager preferences**, bật gửi session log tới S3 (hoặc CloudWatch Logs), bắt buộc mã hoá, và bật **KMS encryption** cho dữ liệu phiên.

### Vì sao các phương án khác sai
- **A:** Mở port 22, trái yêu cầu "close all inbound ports".
- **C:** CloudTrail ghi lời gọi API như StartSession, **không** ghi lệnh gõ trong phiên.
- **E:** Giữ bastion; flow logs chỉ là metadata gói tin.

> Exam tip: Kết hợp Session Manager với **port forwarding** để thay SSH tunnel tới RDS, và dùng IAM condition (tag của instance, {{ssm:SessionDocumentAccessCheck}}) để giới hạn ai vào được máy nào.`,
  services: ['AWS Systems Manager', 'Amazon EC2', 'AWS PrivateLink', 'Amazon S3', 'AWS KMS'],
  refs: [
    { type: 'doc', title: 'Logging session activity (Session Manager)', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-logging.html' },
    { type: 'doc', title: 'Improve the security of EC2 instances by using VPC endpoints for Systems Manager', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-create-vpc.html' },
  ],
},
{
  id: 'dop-125',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company with AWS Business Support operates all workloads in eu-west-1. The security team created an Amazon EventBridge rule in eu-west-1 that matches AWS Trusted Advisor check item refresh events with a status of ERROR for security checks, such as security groups with unrestricted ports, and sends them to an Amazon SNS topic. Trusted Advisor shows several red findings, but the rule's metrics show zero matched events.

What should the DevOps engineer do to receive the notifications?`,
  options: [
    "Upgrade to AWS Enterprise Support, because Trusted Advisor events are available only with that plan.",
    "Enable the Trusted Advisor organizational view in AWS Organizations.",
    "Update the SNS topic access policy to allow events.amazonaws.com to publish to the topic.",
    "Create the EventBridge rule in the US East (N. Virginia) Region, because Trusted Advisor events are delivered only in us-east-1, and target an SNS topic there or forward the events.",
  ],
  answer: 3,
  explain: `**Từ khoá:** Trusted Advisor events, rule trong eu-west-1, "zero matched events".

### Vì sao D đúng
Trusted Advisor là dịch vụ toàn cục, và **event Check Item Refresh Status được phát tới EventBridge chỉ ở Region US East (N. Virginia)**. Rule ở eu-west-1 không bao giờ khớp. Tạo rule ở **us-east-1** (target SNS ở us-east-1, hoặc chuyển tiếp sang event bus ở Region khác).

### Vì sao các phương án khác sai
- **A:** Business Support đã có đầy đủ check Trusted Advisor; vấn đề nằm ở Region.
- **B:** Organizational view gom báo cáo nhiều account, không thay đổi nơi phát event.
- **C:** Thiếu quyền SNS sẽ làm **FailedInvocations** tăng, còn ở đây số event **khớp** đã bằng 0, tức rule không hề nhận event.

> Exam tip: Các dịch vụ toàn cục phát event ở us-east-1: IAM (qua CloudTrail), Trusted Advisor, phần lớn API của CloudFront, Route 53, Organizations. Đọc kỹ "matched events = 0" (event không đến) với "failed invocations" (target lỗi quyền).`,
  services: ['AWS Trusted Advisor', 'Amazon EventBridge', 'Amazon SNS'],
  refs: [{ type: 'doc', title: 'Monitoring AWS Trusted Advisor check results with Amazon EventBridge', url: 'https://docs.aws.amazon.com/awssupport/latest/user/cloudwatch-events-ta.html' }],
},
{
  id: 'dop-126',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `An organization trail delivers AWS CloudTrail log files to an Amazon S3 bucket in a dedicated log archive account. Auditors require that the company be able to prove that log files have not been modified or deleted after delivery, and that the log files be stored in a write-once-read-many (WORM) model for 7 years that even the root user of the log archive account cannot bypass.

Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Enable SSE-KMS encryption on the bucket with a customer managed key.",
    "Enable CloudTrail log file integrity validation on the trail.",
    "Enable MFA delete on the bucket.",
    "Add an S3 Lifecycle rule that transitions log files to S3 Glacier Deep Archive after 90 days.",
    "Enable S3 Object Lock on the bucket with a default retention in compliance mode for 7 years.",
  ],
  answer: [1, 4],
  multi: true,
  explain: `**Từ khoá:** "prove not modified or deleted", "WORM 7 years", "even root cannot bypass".

### Vì sao B và E đúng
- **B: Log file integrity validation**: CloudTrail tạo **digest file** mỗi giờ chứa hash SHA-256 của các log file, digest được ký số (SHA-256 với RSA) và nối chuỗi với digest trước. Lệnh {{aws cloudtrail validate-logs}} chứng minh file bị sửa, bị xoá hay còn nguyên.
- **E: S3 Object Lock** ở **compliance mode**: không ai, kể cả root, có thể xoá/ghi đè object version hay rút ngắn retention trong thời hạn. Object Lock yêu cầu versioning (bật tự động khi bật Object Lock).

### Vì sao các phương án khác sai
- **A:** Mã hoá bảo vệ tính bí mật, không chứng minh toàn vẹn hay ngăn xoá.
- **C:** MFA delete chỉ thêm yêu cầu MFA khi xoá version/đổi versioning, và chính root (có MFA) vẫn xoá được: không phải WORM.
- **D:** Lifecycle giảm chi phí lưu trữ, không ngăn sửa/xoá.

> Exam tip: **Governance mode** cho phép người có quyền {{s3:BypassGovernanceRetention}} gỡ khoá; chỉ **compliance mode** mới chống được cả root. Dùng governance để thử trước khi bật compliance.`,
  services: ['AWS CloudTrail', 'Amazon S3', 'AWS Organizations'],
  refs: [
    { type: 'doc', title: 'Validating CloudTrail log file integrity', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-validation-intro.html' },
    { type: 'doc', title: 'Locking objects with Object Lock', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html' },
  ],
},
{
  id: 'dop-127',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company has 120 accounts in AWS Organizations. The security team wants a continuously updated, centralized view of IAM roles and IAM users that have not been used for 90 days, unused access keys and passwords, and services and actions that are granted but not used, so that teams can remove excess permissions. The solution must cover new accounts automatically and require the LEAST operational overhead.

Which solution meets these requirements?`,
  options: [
    "Download the IAM credential report from every account each week with a script and combine the reports in a spreadsheet.",
    "Designate a delegated administrator account for IAM Access Analyzer and create an unused access analyzer with the organization as the zone of trust and a tracking period of 90 days.",
    "Deploy the AWS Config managed rule iam-user-unused-credentials-check to all accounts with a conformance pack.",
    "Query the organization trail with Amazon Athena each month to find roles and actions that do not appear in the logs.",
  ],
  answer: 1,
  explain: `**Từ khoá:** "roles and users unused for 90 days", "unused services and actions", "centralized", "new accounts automatically".

### Vì sao B đúng
**IAM Access Analyzer unused access analyzer** liên tục đánh giá và tạo **finding** cho: role không dùng, access key và password không dùng, **permissions không dùng** (service/action được cấp nhưng không gọi). Tạo analyzer với **zone of trust = organization** trong account **delegated administrator**, đặt tracking period 90 ngày; account mới tự được bao phủ. Finding có thể gửi qua EventBridge/Security Hub để tự động xử lý. (Đây là tính năng tính phí theo số role/user được phân tích mỗi tháng.)

### Vì sao các phương án khác sai
- **A:** Credential report chỉ có **IAM user**, không có role và permission chưa dùng; script hằng tuần là overhead.
- **C:** Rule đó chỉ kiểm tra credential của **IAM user**, không có role và mức action.
- **D:** Tự phân tích CloudTrail phức tạp, dễ sai, không liên tục.

> Exam tip: Access Analyzer có nhiều loại: **external access** (resource chia sẻ ra ngoài zone of trust), **internal access**, **unused access**, **policy generation** từ CloudTrail và **policy validation/custom policy checks** trong CI.`,
  services: ['IAM Access Analyzer', 'AWS IAM', 'AWS Organizations'],
  refs: [{ type: 'doc', title: 'Findings for external and unused access (IAM Access Analyzer)', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-findings.html' }],
},
{
  id: 'dop-128',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `An application connects to an Amazon RDS for PostgreSQL database by using credentials stored in AWS Secrets Manager, which rotates them every 30 days with the single-user rotation strategy. Application instances cache the credentials and keep long-lived connection pools. During each rotation, some instances fail to open new connections for several minutes until their cache refreshes. The company wants rotation to continue without these authentication failures.

What should the DevOps engineer do?`,
  options: [
    "Change the rotation to the alternating users strategy, using a separate secret with superuser credentials that the rotation function can use to clone and update the users.",
    "Increase the rotation frequency to every 7 days so that each rotation affects fewer connections.",
    "Increase the cache TTL of the Secrets Manager caching client in the application to 24 hours.",
    "Keep the single-user strategy and configure a rotation window during the night.",
  ],
  answer: 0,
  explain: `**Từ khoá:** "single-user rotation", "applications cache credentials", "authentication failures during rotation".

### Vì sao A đúng
Với **single user**, rotation đổi mật khẩu của **chính user** đang dùng; ứng dụng còn giữ mật khẩu cũ sẽ bị từ chối cho tới khi cache làm mới. **Alternating users** dùng hai user trong một secret: lần đầu rotation function **clone** user (cần secret riêng chứa credential admin/superuser), sau đó mỗi lần chỉ đổi mật khẩu của user **không đang được dùng** rồi chuyển AWSCURRENT sang user đó. Mật khẩu cũ (AWSPREVIOUS) vẫn hợp lệ tới lần rotation sau, nên cache cũ vẫn kết nối được.

### Vì sao các phương án khác sai
- **B:** Xoay thường xuyên hơn làm lỗi xảy ra **nhiều lần hơn**.
- **C:** Cache lâu hơn khiến ứng dụng giữ mật khẩu cũ lâu hơn: lỗi kéo dài hơn.
- **D:** Chạy vào ban đêm giảm tác động nhưng vẫn lỗi, không đạt "without authentication failures".

> Exam tip: Single user hợp với ứng dụng có retry khi gặp lỗi xác thực và lấy lại secret; alternating users hợp với hệ thống không chịu được gián đoạn. Với RDS, cũng có thể để RDS quản lý mật khẩu master trong Secrets Manager hoặc dùng IAM database authentication.`,
  services: ['AWS Secrets Manager', 'Amazon RDS'],
  refs: [{ type: 'doc', title: 'Lambda function rotation strategies', url: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotation-strategy.html' }],
}
);
