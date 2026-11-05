/* AWS Certified DevOps Engineer – Professional (DOP-C02) practice pool, part 4: dop-129..dop-158.
 * Schema: docs/AWS-TRACK.md. Check: node scripts/check-aws.js */
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'dop-129',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company runs an AWS CodePipeline V2 pipeline that deploys every commit merged to the main branch of a busy repository to production. Developers merge 10 to 15 commits per hour, and each deployment takes about 12 minutes. Executions accumulate because the pipeline processes them in QUEUED mode. The company wants newer executions to overtake and supersede older executions so that the pipeline does not deploy every queued commit. The team wants the LEAST operational overhead. Which solution meets these requirements?`,
  options: [
    "Change the pipeline execution mode to SUPERSEDED so that a newer execution can overtake and supersede an older execution.",
    "Change the pipeline execution mode to QUEUED so that every execution waits for the previous execution to finish.",
    "Add a manual approval action before the deploy stage so that release managers can reject outdated executions.",
    "Configure the source action to poll for changes every 15 minutes instead of every minute.",
  ],
  answer: 0,
  explain: `**Từ khoá:** nhiều commit liên tiếp, execution xếp hàng trong {{QUEUED}}, muốn execution mới **vượt và thay thế** execution cũ, **LEAST operational overhead**.

### Giải thích các thuật ngữ
- **CodePipeline V2**: Phiên bản mới của dịch vụ quản lý pipeline (luồng tự động hóa) của AWS, hỗ trợ nhiều tính năng nâng cao về điều khiển luồng chạy.
- **Execution Mode**: Chế độ chạy của pipeline, quyết định xem khi có nhiều thay đổi code cùng lúc thì các lượt chạy (execution) sẽ xếp hàng hay đè lên nhau.
- **Supersede (Thay thế)**: Hành động cho phép một lượt chạy mới "nhảy cóc" qua lượt chạy cũ đang chờ để tiết kiệm thời gian và tài nguyên.

### Vì sao đáp án đúng
CodePipeline V2 cung cấp ba chế độ thực thi (execution mode) chính:
- {{QUEUED}} (Xếp hàng): Các lượt chạy xếp hàng lần lượt. Lượt sau phải đợi lượt trước xong mới được bắt đầu. Nếu repo quá bận, hàng đợi sẽ rất dài.
- {{SUPERSEDED}} (Thay thế): Đây là lựa chọn đúng. Khi một lượt chạy mới bắt đầu, nó có quyền "vượt mặt" các lượt đang chờ ở các stage phía sau. Ví dụ: Nếu bản build 2 đang chờ để deploy, nhưng bản build 3 đã xong, bản build 3 sẽ thay thế bản build 2. Điều này giúp production luôn có bản code mới nhất nhanh nhất mà không phải tốn thời gian deploy các bản trung gian.
- {{PARALLEL}} (Song song): Cho phép nhiều lượt chạy diễn ra đồng thời (nhưng có thể gây xung đột nếu deploy cùng một tài nguyên).

Dùng {{SUPERSEDED}} là cấu hình đơn giản nhất, không tốn công vận hành (LEAST operational overhead).

### Vì sao các phương án khác sai
- **QUEUED**: Giữ nguyên tình trạng hiện tại là xếp hàng, không giải quyết được yêu cầu "vượt mặt" để tăng tốc.
- **Manual approval**: Yêu cầu con người phải vào nhấn nút duyệt, rất tốn thời gian và công sức (không phải LEAST overhead).
- **Poll 15 phút**: Chỉ là thay đổi cách pipeline "đi kiểm tra" code mới. Nó không thay đổi cách pipeline xử lý khi đã có một đống lượt chạy đang chờ.

> Exam tip: Hãy tưởng tượng {{QUEUED}} như xếp hàng mua vé (ai đến trước mua trước), còn {{SUPERSEDED}} như việc cập nhật tin tức (tin mới nhất sẽ được đăng ngay, đè lên các tin cũ đang chờ duyệt). Trong kỳ thi DOP, nếu thấy yêu cầu "deploy latest and skip older", hãy chọn SUPERSEDED.`,
  services: ['AWS CodePipeline'],
},
{
  id: 'dop-130',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company uses AWS CodeDeploy blue/green deployments to move an application from an original Auto Scaling group to a replacement Auto Scaling group behind an Application Load Balancer. After traffic is shifted to the replacement group, CodeDeploy terminates the original instances immediately. The company wants the original instances to remain available for 1 hour after the traffic shift so that the team can roll back quickly if latent errors appear. The company also wants an automatic rollback when a CloudWatch 5xx alarm enters the ALARM state during that period. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Change the deployment configuration to CodeDeployDefault.AllAtOnce so that the deployment finishes before errors can appear.",
    "Set the termination wait time of the blue/green deployment group to 1 hour and keep automatic rollback on the CloudWatch alarm enabled.",
    "Add a ValidateService lifecycle hook that sleeps for 1 hour before the deployment is marked successful.",
    "Create a second deployment group for the original Auto Scaling group and use it only when a manual rollback is required.",
  ],
  answer: 1,
  explain: `**Từ khoá:** blue/green, traffic đã chuyển, instance cũ bị xoá ngay, muốn giữ **1 giờ** để rollback, **tự động rollback theo alarm**, LEAST overhead.

### Giải thích các thuật ngữ
- **Blue/Green Deployment**: Chiến lược triển khai phần mềm bằng cách dựng một môi trường mới (Green) song song với môi trường đang chạy (Blue). Khi môi trường Green đã sẵn sàng, traffic sẽ được chuyển từ Blue sang Green.
- **Termination Wait Time**: Thời gian chờ trước khi xóa hoàn toàn các máy chủ ở môi trường cũ (Blue) sau khi đã chuyển traffic sang môi trường mới (Green).
- **Rollback (Hoàn tác)**: Quay trở lại phiên bản cũ nếu phiên bản mới gặp lỗi.

### Vì sao đáp án đúng
Trong cấu hình **Deployment Group** của CodeDeploy cho EC2/On-premises (loại Blue/Green), AWS cung cấp tùy chọn điều khiển việc xóa các instance cũ:
1. Bạn có thể chọn **Terminate** (xóa) máy chủ cũ ngay lập tức hoặc đợi một khoảng thời gian.
2. Thiết lập **Termination Wait Time** cho phép bạn giữ các máy chủ cũ (môi trường Blue) sống trong một khoảng thời gian (lên đến 48 giờ). Trong 1 giờ chờ này, các máy chủ cũ vẫn nằm đó nhưng không nhận traffic.
3. Nếu có lỗi (như CloudWatch Alarm báo lỗi 5xx), CodeDeploy có thể tự động thực hiện **Rollback** bằng cách chuyển traffic ngược lại môi trường Blue và giữ nguyên các máy chủ đó.
Đây là cách "nhà trồng được" (built-in), không tốn công vận hành (LEAST overhead).

### Vì sao các phương án khác sai
- **AllAtOnce**: Đây là cách deploy "tất cả cùng lúc", không liên quan đến việc giữ máy chủ cũ sau khi deploy xong.
- **ValidateService sleep 1 giờ**: Đây là một mẹo "hack" bằng cách bắt script chờ, nhưng nó không phải là cơ chế chính thống của CodeDeploy để quản lý vòng đời Blue/Green và rất dễ bị timeout.
- **Deployment group thứ hai**: Tự tạo thêm một nhóm deploy nữa để quản lý rollback thủ công là cực kỳ phức tạp và dễ sai sót.

> Exam tip: Với EC2 Blue/Green, hãy nhớ từ khóa **Termination Wait Time**. Với ECS Blue/Green, cơ chế này hơi khác một chút (sử dụng thời gian chờ của chính CodeDeploy và các hook), nhưng nguyên lý giữ môi trường cũ để sẵn sàng rollback là giống nhau.`,
  services: ['AWS CodeDeploy', 'Amazon EC2 Auto Scaling', 'Elastic Load Balancing', 'Amazon CloudWatch'],
},
{
  id: 'dop-131',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company runs the same containerized Java service on Amazon ECS with AWS Fargate in three AWS Regions. Every task pulls several public base images from Docker Hub at startup. The company frequently hits Docker Hub pull rate limits, and NAT gateway data processing charges are increasing. The company wants later pulls to be served from a private cache in each Region, wants to change only the image references in the task definitions, and wants the LEAST operational overhead. Which solution meets these requirements?`,
  options: [
    "Enable Amazon ECR cross-Region replication for the repositories and change the task definitions to pull images from the replica in each Region.",
    "Increase the NAT gateway capacity in each Region and add retries when Docker Hub returns HTTP 429 responses.",
    "Create an Amazon ECR pull-through cache rule in each Region for Docker Hub and change the task definitions to use the ECR image URIs.",
    "Bake the public images into a custom AMI and run the containers directly on Amazon EC2 instead of AWS Fargate.",
  ],
  answer: 2,
  explain: `**Từ khoá:** image public từ Docker Hub, bị **rate limit**, nhiều Region, muốn **cache riêng từng Region**, chỉ đổi image reference, LEAST overhead.

### Giải thích các thuật ngữ
- **ECR Pull-through cache**: Một tính năng của Amazon ECR hoạt động như một "kho đệm" (cache). Khi bạn yêu cầu một image từ bên ngoài (như Docker Hub), ECR sẽ tự động kéo về, lưu lại trong kho riêng của bạn và trả cho bạn. Lần sau bạn cần, ECR sẽ trả ngay bản lưu đó.
- **Rate limit**: Giới hạn số lần bạn được phép tải (pull) image trong một khoảng thời gian. Docker Hub áp dụng giới hạn này rất nghiêm ngặt với các tài khoản miễn phí.
- **NAT Gateway charges**: Phí xử lý dữ liệu khi đi qua NAT Gateway để ra internet. Nếu tải image nặng từ internet nhiều lần, phí này sẽ rất cao.

### Vì sao đáp án đúng
Sử dụng **Amazon ECR pull-through cache** là phương án tối ưu nhất vì:
1. **Giải quyết rate limit**: Sau lần tải đầu tiên, các lần sau ECS sẽ lấy image trực tiếp từ ECR (nằm trong mạng nội bộ AWS), không cần gọi ra Docker Hub nữa.
2. **Tiết kiệm chi phí**: Image được lấy nội bộ trong Region, không đi qua NAT Gateway ra internet nên giảm phí data processing.
3. **Ít thay đổi**: Bạn chỉ cần tạo một "rule" (quy tắc) trong ECR và đổi đường dẫn image trong Task Definition. ECR sẽ tự lo việc kiểm tra và cập nhật image từ Docker Hub (mặc định mỗi 24 giờ).

### Vì sao các phương án khác sai
- **Replication**: Chỉ sao chép những gì *đã có sẵn* trong ECR của bạn sang Region khác, nó không giúp ích gì trong việc tự động kéo image mới từ Docker Hub về.
- **Tăng NAT và retry**: Đây là cách "chữa cháy" tạm thời, không giải quyết được gốc rễ vấn đề là rate limit và phí NAT vẫn cao.
- **Chuyển sang EC2**: Đây là bước lùi về mặt công nghệ (từ Fargate serverless quay lại quản lý máy chủ EC2), làm tăng gánh nặng vận hành.

> Exam tip: Khi thấy đề bài phàn nàn về **Docker Hub rate limit** hoặc **chi phí NAT** khi kéo image, hãy nghĩ ngay đến **ECR Pull-through cache**. Lưu ý: Để dùng với Docker Hub, bạn cần lưu thông tin đăng nhập vào **AWS Secrets Manager**.`,
  services: ['Amazon ECR', 'Amazon ECS', 'AWS Fargate', 'AWS Secrets Manager'],
},
{
  id: 'dop-132',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company has an existing AWS CodeDeploy pipeline that deploys a Java application to Amazon EC2 instances in AWS. The company acquired a data center with 25 Red Hat Enterprise Linux servers that can reach AWS public endpoints over the internet but cannot receive inbound connections. The company wants the same CodeDeploy application and deployment group pattern to deploy to these servers. Which combination of steps is required to make the servers valid CodeDeploy targets? (Choose two.)`,
  options: [
    "Install the CodeDeploy agent on each server and configure it with an IAM user access key that has permission to call CodeDeploy.",
    "Register each server as a managed node by using an AWS Systems Manager hybrid activation.",
    "Register each server with CodeDeploy by using its IAM user ARN and add the tags that the CodeDeploy deployment group uses for its tag filter.",
    "Attach an IAM instance profile to each server so that the agent can obtain temporary credentials.",
    "Place the servers behind an Application Load Balancer and create a target group for them.",
  ],
  answer: [0, 2],
  multi: true,
  explain: `**Từ khoá:** server **on-premises**, chỉ ra ngoài internet, dùng lại CodeDeploy, deployment group lọc theo tag.

### Giải thích các thuật ngữ
- **On-premises**: Hệ thống máy chủ vật lý đặt tại trung tâm dữ liệu của riêng công ty (máy chủ "nhà làm"), không nằm trên đám mây AWS.
- **IAM User Access Key**: Cặp ID và Secret dùng để xác thực quyền truy cập AWS cho một người dùng hoặc ứng dụng không nằm trong AWS.
- **IAM Instance Profile**: Một cơ chế giúp máy chủ EC2 tự động nhận quyền từ AWS mà không cần lưu ID/Secret (chỉ dùng được cho máy chủ ảo EC2 trên AWS).

### Vì sao hai đáp án đúng
Để CodeDeploy có thể điều khiển các máy chủ bên ngoài AWS (on-premises), chúng ta cần thực hiện các bước sau:
1. **Cài đặt Agent**: Máy chủ phải cài **CodeDeploy Agent**. Vì máy chủ này không nằm trên AWS, nó không thể dùng Instance Profile để lấy quyền. Do đó, ta phải tạo một **IAM User**, cấp quyền CodeDeploy cho user đó, rồi lấy **Access Key** cấu hình vào file của Agent trên máy chủ (đáp án A).
2. **Đăng ký máy chủ**: Bạn phải báo cho AWS biết về sự tồn tại của máy chủ này bằng cách gọi lệnh đăng ký (register) kèm theo **IAM User ARN**.
3. **Gắn Tag**: CodeDeploy tìm mục tiêu deploy dựa trên **Tag**. Khi đăng ký máy chủ on-premises, bạn phải gắn tag cho nó sao cho khớp với bộ lọc (tag filter) trong Deployment Group (đáp án C).

### Vì sao các phương án khác sai
- **SSM hybrid activation**: Đây là cách để đưa máy chủ on-premises vào danh sách quản lý của dịch vụ Systems Manager (SSM), không phải CodeDeploy.
- **IAM instance profile**: Như đã giải thích, cái này chỉ dành riêng cho máy chủ ảo EC2 trên AWS, không thể gắn cho máy chủ vật lý bên ngoài.
- **ALB target group**: Đây là cấu hình cho bộ cân bằng tải, không phải điều kiện cần để CodeDeploy có thể nhận diện và cài đặt ứng dụng lên máy chủ.

> Exam tip: Quy trình cho On-premises CodeDeploy luôn là: **Cài Agent -> Cấu hình IAM User Access Key -> Đăng ký Instance -> Gắn Tag**. Hãy nhớ rằng máy chủ on-premises luôn cần một "danh tính" (IAM User) để nói chuyện với AWS.`,
  services: ['AWS CodeDeploy', 'AWS IAM', 'AWS Systems Manager'],
},
{
  id: 'dop-133',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company stores its application code in GitHub and runs a GitHub Actions workflow that deploys AWS CloudFormation stacks. Security policy prohibits long-term AWS access keys in GitHub secrets or on runner machines. The security team wants the workflow to obtain temporary AWS credentials that are limited to a specific repository and the main branch. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Store an IAM user access key and secret key as GitHub Actions secrets and use them in the workflow.",
    "Create an IAM user with an access key and rotate the key every 30 days with a scheduled workflow.",
    "Use the AWS account root user credentials in an encrypted repository variable.",
    "Create an IAM OIDC identity provider for token.actions.githubusercontent.com and an IAM role whose trust policy restricts the repository and branch; grant id-token: write to the workflow.",
  ],
  answer: 3,
  explain: `**Từ khoá:** GitHub Actions, **cấm access key dài hạn**, credentials tạm thời, giới hạn **repository + main branch**, LEAST overhead.

### Giải thích các thuật ngữ
- **OIDC (OpenID Connect)**: Một giao thức xác thực cho phép một hệ thống (như GitHub) chứng minh danh tính của nó với hệ thống khác (như AWS) mà không cần trao đổi mật khẩu hay khóa bí mật.
- **Temporary Credentials**: Khóa truy cập chỉ có tác dụng trong một thời gian ngắn (ví dụ 1 giờ) rồi tự hủy, giúp giảm rủi ro nếu bị lộ.
- **Trust Policy**: Một thiết lập trên IAM Role để quyết định xem *ai* được phép mượn quyền của Role đó.

### Vì sao đáp án đúng
Đây là phương pháp bảo mật hiện đại nhất để kết nối GitHub Actions với AWS:
1. Bạn tạo một **OIDC Identity Provider** trong AWS để "tin tưởng" GitHub.
2. Bạn tạo một **IAM Role** với một **Trust Policy** cực kỳ chặt chẽ. Policy này sẽ kiểm tra xem token gửi đến có phải từ đúng tổ chức của bạn, đúng repo của bạn, và đúng nhánh {{main}} hay không (thông qua trường {{sub}} - subject).
3. Trong GitHub Workflow, bạn cấp quyền {{id-token: write}}. Khi chạy, GitHub sẽ tự xin một token tạm thời và dùng nó để "đổi" lấy quyền từ AWS.
Kết quả: Không có bất kỳ khóa Access Key nào phải lưu trong GitHub Secrets. Nếu ai đó đánh cắp được token này, nó cũng sẽ hết hạn cực nhanh.

### Vì sao các phương án khác sai
- **Access key trong GitHub secrets**: Vi phạm trực tiếp yêu cầu của đề bài là "không dùng khóa dài hạn" (long-term keys).
- **Xoay key 30 ngày**: Vẫn là khóa dài hạn, chỉ là đổi mới định kỳ. Nó không giải quyết được vấn đề bảo mật cốt lõi và tốn công vận hành.
- **Root credentials**: Đây là hành động "tự sát" về bảo mật. Khóa Root có quyền sinh sát toàn bộ tài khoản và không bao giờ được dùng cho các tác vụ tự động.

> Exam tip: Nếu đề bài nhắc đến **GitHub Actions** hoặc **GitLab** và yêu cầu **không dùng Access Key**, hãy chọn ngay giải pháp **OIDC**. Từ khóa đi kèm thường là **Identity Provider** và **AssumeRoleWithWebIdentity**.`,
  services: ['AWS IAM', 'AWS CloudFormation', 'GitHub Actions'],
},
{
  id: 'dop-134',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A company keeps 30 Java services in a single monorepo. Each service has its own AWS CodePipeline V2 pipeline, but all pipelines currently start on every commit to the main branch, so a one-line change in one service triggers 30 builds and deployments. The company wants each pipeline to start only when files under that service directory change, with the LEAST operational overhead and no custom scripts. Which solution meets these requirements?`,
  options: [
    "Use a single pipeline with a CodeBuild project that runs git diff and skips stages by using shell conditions.",
    "Configure each CodePipeline V2 pipeline trigger with a file path filter for that service directory.",
    "Run all pipelines on a schedule every 15 minutes and have each pipeline check whether its service changed.",
    "Create a separate branch for each service and require developers to cherry-pick changes into the main branch.",
  ],
  answer: 1,
  explain: `**Từ khoá:** monorepo, mỗi commit chạy **tất cả** pipeline, chỉ muốn chạy khi **thư mục service** thay đổi, LEAST overhead, **no custom scripts**.

### Giải thích các thuật ngữ
- **Monorepo**: Một mô hình quản lý code nơi nhiều dự án/dịch vụ khác nhau được để chung trong một Repository (kho mã nguồn) duy nhất thay vì chia ra nhiều Repo.
- **Trigger Filter**: Bộ lọc kích hoạt. Nó quyết định xem một sự kiện (như đẩy code mới) có đủ điều kiện để làm Pipeline bắt đầu chạy hay không.
- **File path filter**: Bộ lọc dựa trên đường dẫn tệp tin. Ví dụ: "Chỉ chạy nếu có file trong thư mục /service-A thay đổi".

### Vì sao đáp án đúng
Trước đây, CodePipeline (V1) gặp khó khăn với Monorepo vì cứ có code mới là nó chạy, không quan tâm code đó thuộc dịch vụ nào. Với **CodePipeline V2**, AWS đã bổ sung tính năng **Trigger Filter** cực kỳ mạnh mẽ:
1. Bạn có thể cấu hình Pipeline chỉ bắt đầu khi có sự thay đổi ở một số đường dẫn (File Paths) nhất định.
2. Ví dụ: Pipeline của dịch vụ "Orders" sẽ có filter là {{services/orders/**}}. Nếu bạn sửa code ở {{services/shipping/}}, Pipeline của "Orders" sẽ đứng yên.
3. Đây là tính năng có sẵn (native), không cần viết bất kỳ dòng script nào (no custom scripts), đáp ứng hoàn hảo yêu cầu LEAST operational overhead.

### Vì sao các phương án khác sai
- **Git diff + shell conditions**: Cách này yêu cầu bạn phải tự viết script để kiểm tra thay đổi. Nó vẫn tiêu tốn một lượt chạy Pipeline chỉ để... kiểm tra rồi tắt, lãng phí tài nguyên và khó bảo trì.
- **Chạy theo lịch (Schedule)**: Không tối ưu vì nếu không có code mới nó vẫn chạy, hoặc nếu có code mới thì phải đợi đến giờ mới chạy (gây trễ).
- **Branch riêng cho mỗi service**: Ép các team phải làm việc trên nhiều nhánh khác nhau chỉ để phục vụ Pipeline là làm phức tạp hóa quy trình làm việc của Developer.

> Exam tip: Với các câu hỏi về **Monorepo** trong CodePipeline, hãy ưu tiên tìm đáp án có **Trigger Filter** hoặc **File Path Filter**. Lưu ý tính năng này chỉ có đầy đủ ở phiên bản **V2**.`,
  services: ['AWS CodePipeline', 'AWS CodeBuild'],
},
{
  id: 'dop-135',
  exam: 'dop-c02',
  domain: 'dop-d1',
  q: `A vendor uploads a new application bundle to an Amazon S3 bucket at unpredictable times, up to 20 times per day. An AWS CodePipeline pipeline uses an S3 source action that polls the bucket every 15 minutes, so deployments start up to 15 minutes late. The company wants the pipeline to start within seconds after a new object version is uploaded, wants to avoid polling, and wants the LEAST operational overhead. Which solution meets these requirements?`,
  options: [
    "Create an S3 event notification that invokes a Lambda function which calls StartPipelineExecution.",
    "Reduce the source action polling interval to 1 minute and accept the additional API calls.",
    "Enable event-based change detection for the S3 source action and enable versioning on the source bucket.",
    "Enable S3 Transfer Acceleration on the bucket so that uploads finish faster.",
  ],
  answer: 2,
  explain: `**Từ khoá:** nguồn **S3**, upload không đoán trước, pipeline trễ tới 15 phút, muốn chạy **trong vài giây**, bỏ polling, LEAST overhead.

### Giải thích các thuật ngữ
- **Polling**: Cơ chế "đi hỏi định kỳ". Ví dụ: Cứ 15 phút Pipeline lại vào hỏi S3: "Có file mới chưa?". Điều này dẫn đến độ trễ tối đa là 15 phút.
- **Event-based (Dựa trên sự kiện)**: Cơ chế "có biến thì báo". S3 sẽ chủ động hét lên: "Có file mới rồi nè!" và Pipeline nghe thấy sẽ chạy ngay lập tức.
- **S3 Versioning**: Tính năng lưu lại nhiều phiên bản của cùng một tệp tin trên S3. Nếu bạn ghi đè file cũ, AWS vẫn giữ lại bản cũ cho bạn.

### Vì sao đáp án đúng
Để đạt được tốc độ khởi động trong vài giây mà không cần đi hỏi (polling) liên tục, phương án tốt nhất là dùng **Event-based change detection**:
1. Khi một file (object) được upload lên S3, một sự kiện (event) sẽ được gửi tới dịch vụ **Amazon EventBridge**.
2. EventBridge sẽ kích hoạt CodePipeline chạy ngay lập tức.
3. Điều kiện tiên quyết: Bucket S3 phải bật **Versioning** để CodePipeline có thể xác định chính xác phiên bản nào vừa được đẩy lên để lấy làm đầu vào.
4. Đây là tính năng cấu hình có sẵn của AWS, cực kỳ ổn định và không tốn công bảo trì code.

### Vì sao các phương án khác sai
- **Lambda gọi StartPipelineExecution**: Bạn hoàn toàn có thể viết một hàm Lambda để nghe sự kiện S3 rồi ra lệnh cho Pipeline chạy. Tuy nhiên, việc phải viết code, quản lý quyền và bảo trì Lambda này làm tăng gánh nặng vận hành (không phải LEAST overhead).
- **Giảm thời gian Poll xuống 1 phút**: Vẫn là đi hỏi định kỳ, vẫn có độ trễ 1 phút, và làm tăng số lượng lời gọi API vô ích lên S3, tốn kém không cần thiết.
- **S3 Transfer Acceleration**: Đây là tính năng dùng mạng lưới của AWS để giúp việc upload file từ xa (ví dụ từ Việt Nam sang Mỹ) nhanh hơn, không liên quan gì đến việc kích hoạt Pipeline.

> Exam tip: Với S3 Source, hãy nhớ combo: **Event-based + Versioning + EventBridge**. Nếu đề bài yêu cầu "ngay lập tức" (immediately/seconds), hãy loại tất cả các phương án có chữ "polling".`,
  services: ['AWS CodePipeline', 'Amazon S3', 'Amazon EventBridge'],
},
{
  id: 'dop-136',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A platform team maintains a standard secure Amazon S3 bucket definition that includes encryption, versioning, a bucket policy, and access logging. Forty application teams deploy into the same AWS account and Region, and each team currently copies about 120 lines of CloudFormation into every template. The platform team wants to publish a versioned building block that teams reference with a single resource and a few parameters. The platform team also wants to control centrally which registered module version is the default for subsequent stack operations. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Register a CloudFormation module in the registry and have teams reference it as a resource type with parameters.",
    "Publish a nested stack template to Amazon S3 and copy the AWS::CloudFormation::Stack block into every application template.",
    "Write a CloudFormation macro that replaces placeholder text with the standard resource definitions at deployment time.",
    "Move all application resources into one shared stack so that every team deploys the same template.",
  ],
  answer: 0,
  explain: `**Từ khoá:** resource chuẩn dùng lại ở **40 template**, muốn **một resource + tham số**, quản lý **default version tập trung**, LEAST overhead.

### Giải thích các thuật ngữ
- **Template (Mẫu)**: Một file cấu hình (YAML hoặc JSON) định nghĩa các tài nguyên bạn muốn AWS khởi tạo.
- **CloudFormation Registry**: Một cái "kho" chứa các định nghĩa tài nguyên tùy chỉnh mà bạn có thể dùng trong các Template của mình.
- **Default Version (Phiên bản mặc định)**: Khi bạn có nhiều phiên bản của một Module, bạn có thể chỉ định một bản là mặc định. Các Template sử dụng Module đó sẽ tự động dùng bản mặc định này mà không cần sửa code.

### Vì sao đáp án đúng
**CloudFormation Modules** là giải pháp hoàn hảo cho việc quản trị tập trung các tiêu chuẩn hạ tầng:
1. Bạn đóng gói các thiết lập phức tạp (như S3 + Encryption + Logging + Policy) thành một đơn vị duy nhất gọi là Module.
2. Các team khác chỉ cần khai báo một dòng duy nhất trong Template của họ như thể đó là một dịch vụ có sẵn của AWS (ví dụ: {{MyOrg::S3::SecureBucket}}).
3. **Quản lý phiên bản cực kỳ tiện lợi**: Khi bạn nâng cấp tiêu chuẩn bảo mật, bạn chỉ cần đăng ký phiên bản mới của Module vào Registry và đặt nó làm **Default**. Tất cả các Stack tạo mới sau đó sẽ tự động áp dụng tiêu chuẩn mới mà không cần các team phải sửa template của họ.

### Vì sao các phương án khác sai
- **Nested Stacks**: Yêu cầu team phải gọi một Template con từ Template cha. Việc này vẫn đòi hỏi team phải viết khá nhiều code khai báo khối {{AWS::CloudFormation::Stack}} và khó quản lý phiên bản mặc định tập trung bằng cách chỉ nhấn một nút.
- **CloudFormation Macro**: Đây là cách dùng code (Lambda) để thay thế văn bản trong template. Nó quá phức tạp cho yêu cầu này, khó kiểm soát lỗi và tốn công bảo trì code Lambda.
- **Shared Stack (Dùng chung một Stack)**: Việc ép 40 team dùng chung một Stack khổng lồ là một thảm họa về quản lý. Chỉ cần một team làm sai có thể kéo sập toàn bộ hạ tầng của 39 team còn lại.

> Exam tip: Nếu đề bài yêu cầu "tái sử dụng resource chuẩn" và "quản lý phiên bản tập trung" (centralized version control), hãy nghĩ ngay đến **CloudFormation Modules**. Nhớ rằng Module được dùng như một **Resource Type** thực thụ.`,
  services: ['AWS CloudFormation'],
},
{
  id: 'dop-137',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company has 500 Amazon EC2 instances and 80 on-premises servers, all managed by AWS Systems Manager. The compliance team needs a monthly report of installed applications, operating system details, and network configuration for every server. The data must be queryable across the fleet and exported to Amazon S3 for long-term retention. The company does not want to install another agent or maintain custom collection scripts. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Use AWS Config to record the installed applications on each instance and query the configuration history.",
    "Install the CloudWatch agent on every server and create custom metrics for each installed application.",
    "Run a nightly shell script over SSH that writes package lists to Amazon S3.",
    "Use AWS Systems Manager Inventory with a resource data sync to Amazon S3 and query the collected data with Amazon Athena.",
  ],
  answer: 3,
  explain: `**Từ khoá:** hàng trăm server, báo cáo **ứng dụng đã cài**, OS, network, query toàn fleet, export S3, **không thêm agent**, LEAST overhead.

### Giải thích các thuật ngữ
- **Inventory (Kiểm kê)**: Quá trình liệt kê tất cả các thành phần đang có. Trong IT, đó là liệt kê phần mềm, phiên bản OS, cấu hình IP... trên hàng loạt máy chủ.
- **Resource Data Sync**: Tính năng của Systems Manager giúp tự động đẩy (đồng bộ) dữ liệu thu thập được từ các máy chủ về một xô (S3 bucket) trung tâm.
- **Amazon Athena**: Dịch vụ cho phép bạn dùng ngôn ngữ SQL để truy vấn (tìm kiếm) dữ liệu trực tiếp từ các file lưu trên S3 mà không cần nạp vào Database.

### Vì sao đáp án đúng
Để quản lý hàng trăm máy chủ (cả trên đám mây EC2 và máy vật lý On-premises) mà không muốn cài thêm phần mềm lạ, giải pháp chuẩn của AWS là:
1. **SSM Inventory**: Tận dụng Agent SSM (thường có sẵn trên các máy chủ AWS) để tự động thu thập thông tin về phần mềm đã cài, cấu hình mạng...
2. **Resource Data Sync**: Bạn không cần viết script để gom dữ liệu. Tính năng này sẽ tự động tập hợp dữ liệu từ hàng trăm máy chủ về một S3 Bucket duy nhất.
3. **Truy vấn dễ dàng**: Sau khi dữ liệu đã nằm trên S3, bạn dùng **Athena** để chạy lệnh SQL như: "Liệt kê tất cả máy chủ đang cài Java phiên bản 8".
Đây là giải pháp chính thống, ổn định và tốn ít công sức nhất.

### Vì sao các phương án khác sai
- **AWS Config**: Dịch vụ này quan tâm đến việc *cấu hình tài nguyên AWS* thay đổi thế nào (ví dụ: Security Group bị sửa). Nó không đi sâu vào bên trong hệ điều hành để biết bạn đã cài phần mềm gì.
- **CloudWatch Agent + Custom Metrics**: CloudWatch dùng để theo dõi hiệu năng (CPU, RAM). Việc bắt nó liệt kê danh sách hàng nghìn phần mềm là sai mục đích và rất khó quản lý.
- **Shell script qua SSH**: Bạn sẽ phải quản lý khóa SSH cho hàng trăm máy, tự viết code xử lý file... Đây là cách làm thủ công và tiềm ẩn nhiều rủi ro bảo mật.

> Exam tip: Hãy nhớ bộ ba: **Inventory (thu thập) -> Resource Data Sync (gom dữ liệu về S3) -> Athena (truy vấn bằng SQL)**. Đây là công thức chung cho các câu hỏi về quản lý cấu hình và kiểm kê phần mềm trên quy mô lớn.`,
  services: ['AWS Systems Manager', 'Amazon S3', 'Amazon Athena'],
},
{
  id: 'dop-138',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A CloudFormation stack creates an Amazon DynamoDB table and an Amazon S3 bucket that store production data. The company requires that both resources be retained if the stack is deleted or if the resources are removed from the template. However, if stack creation fails halfway through, any resources that were already created must be deleted automatically so that no orphaned resources remain. Which DeletionPolicy setting meets these requirements?`,
  options: [
    "DeletionPolicy: Retain",
    "DeletionPolicy: RetainExceptOnCreate",
    "DeletionPolicy: Snapshot",
    "DeletionPolicy: Delete",
  ],
  answer: 1,
  explain: `**Từ khoá:** giữ resource khi **xoá stack**, nhưng **xoá nếu create thất bại**, tránh resource mồ côi.

### Giải thích các thuật ngữ
- **DeletionPolicy**: Một thiết lập trong CloudFormation để bảo AWS phải làm gì với một tài nguyên khi Stack bị xóa (Xóa sạch nó đi? Hay giữ nó lại?).
- **Stack Creation Failure**: Tình huống khi bạn đang tạo dở Stack thì gặp lỗi (ví dụ: sai quyền hạn, hết hạn mức...). Thường thì AWS sẽ tự động xóa những gì nó đã tạo được để đưa mọi thứ về trạng thái sạch (Rollback).
- **Orphaned resources (Tài nguyên mồ côi)**: Những tài nguyên (như Database, S3 Bucket) vẫn còn tồn tại và tốn tiền mặc dù Stack quản lý chúng đã biến mất hoặc bị hủy.

### Vì sao đáp án đúng
AWS cung cấp một giá trị đặc biệt là **RetainExceptOnCreate**:
1. **Khi vận hành bình thường**: Nếu bạn xóa Stack hoặc xóa định nghĩa tài nguyên khỏi code, AWS sẽ **GIỮ LẠI** tài nguyên đó (không xóa dữ liệu). Điều này giúp bảo vệ dữ liệu quan trọng như Database hay S3.
2. **Khi gặp lỗi lúc đang tạo (Create Failure)**: AWS sẽ **XÓA** tài nguyên đó đi. Tại sao? Vì tài nguyên này mới chỉ được tạo dở, chưa có dữ liệu quan trọng, việc xóa nó giúp bạn tránh bị "rác" tài nguyên trong tài khoản và không bị tốn tiền vô ích cho những thứ chưa dùng được.
Đây chính là sự kết hợp thông minh nhất để vừa bảo vệ dữ liệu, vừa giữ tài khoản sạch sẽ.

### Vì sao các phương án khác sai
- **Retain**: Giữ lại mọi lúc. Nếu bạn tạo Stack lỗi 10 lần, bạn sẽ có 10 cái Database "mồ côi" không dùng được nhưng vẫn bị tính tiền.
- **Snapshot**: Chỉ áp dụng cho một số dịch vụ nhất định (như RDS, EBS). Nó sẽ tạo một bản sao lưu (backup) trước khi xóa. Nó không giải quyết được việc xóa tài nguyên khi quá trình tạo Stack bị lỗi.
- **Delete**: Đây là mặc định. Nó sẽ xóa sạch mọi thứ khi Stack bị xóa. Điều này rất nguy hiểm cho các dịch vụ chứa dữ liệu quan trọng.

> Exam tip: Hãy nhớ sự khác biệt: **Retain** (Giữ lại bất kể thế nào) vs **RetainExceptOnCreate** (Giữ lại trừ khi việc tạo mới bị lỗi). Trong đề thi, nếu thấy yêu cầu "tránh resource mồ côi khi deploy lỗi" (avoid orphaned resources), hãy chọn ngay RetainExceptOnCreate.`,
  services: ['AWS CloudFormation', 'Amazon DynamoDB', 'Amazon S3'],
},
{
  id: 'dop-139',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company stores AWS CloudFormation templates for 12 applications in a GitHub repository. The company wants each stack to be created and updated automatically when its template or parameters change on the main branch, without building or maintaining a CI/CD pipeline. Each application must be deployable as a separate stack from the same repository. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Create an AWS CodeConnections connection to the Git repository and authorize it for CloudFormation.",
    "Add a deployment file to the repository that maps each stack to its template path, parameters, and deployment settings.",
    "Create a service-managed StackSet that targets the organization.",
    "Create an EventBridge rule that calls the UpdateStack API for every commit.",
    "Upload templates to an S3 bucket with versioning and use an S3 event notification.",
  ],
  answer: [0, 1],
  multi: true,
  explain: `**Từ khoá:** CloudFormation, template trong **Git**, tự deploy khi main thay đổi, **không pipeline**, nhiều stack từ một repo.

### Giải thích các thuật ngữ
- **Git Sync**: Một tính năng của CloudFormation giúp bạn đồng bộ trực tiếp hạ tầng từ code trong Git. Bạn sửa code trong Git, AWS sẽ tự động sửa hạ tầng cho bạn.
- **CodeConnections**: Một dịch vụ của AWS để tạo kết nối bảo mật tới các kho chứa code bên ngoài như GitHub, GitLab hay Bitbucket.
- **Deployment File**: Một file nhỏ (thường là YAML) đặt trong Repository của bạn để bảo CloudFormation biết: Template nào cần dùng, Parameter (tham số) là gì...

### Vì sao hai đáp án đúng
AWS cung cấp tính năng **CloudFormation Git sync** để đơn giản hóa việc triển khai mà không cần dựng Pipeline phức tạp:
1. **Kết nối**: Bạn tạo một **CodeConnections** để cho phép CloudFormation truy cập vào repo GitHub của mình (đáp án A).
2. **Cấu hình**: Bạn tạo một file định nghĩa (Deployment File) trong repo đó. File này đóng vai trò như "bản hướng dẫn" cho CloudFormation (đáp án B).
Khi bạn đẩy code (push) lên nhánh {{main}}, CloudFormation sẽ thấy sự thay đổi và tự động thực hiện quá trình cập nhật Stack. Cách này cực kỳ gọn nhẹ, không cần quản lý CodePipeline hay Jenkins.

### Vì sao các phương án khác sai
- **StackSets**: Dùng khi bạn muốn triển khai *cùng một* template cho hàng trăm tài khoản hoặc vùng khác nhau. Nó không phải là cơ chế để tự động đồng bộ code từ Git cho từng ứng dụng riêng lẻ.
- **EventBridge gọi UpdateStack**: Đây là cách làm thủ công bằng cách tự viết code tự động hóa. Nó vi phạm yêu cầu "không xây dựng pipeline hoặc duy trì CI/CD".
- **S3 + Event Notification**: Cách này yêu cầu bạn phải đẩy template lên S3 trước, rồi mới kích hoạt một cái gì đó. Nó vẫn đòi hỏi bạn phải tự quản lý việc đẩy template, không đạt được mục tiêu "đồng bộ trực tiếp từ Git".

> Exam tip: Nếu đề bài muốn triển khai CloudFormation trực tiếp từ Git mà **không muốn dùng CodePipeline**, từ khóa vàng là **Git sync** hoặc **CodeConnections + Deployment file**.`,
  services: ['AWS CloudFormation', 'AWS CodeConnections', 'GitHub'],
},
{
  id: 'dop-140',
  exam: 'dop-c02',
  domain: 'dop-d2',
  q: `A company defines 30 applications with the AWS CDK in TypeScript. Security policy requires every Amazon S3 bucket to be encrypted with a customer managed KMS key and every resource to carry a cost-center tag. Teams frequently forget these properties, and the company wants synthesis to fail before a noncompliant stack can be deployed. The company wants a single enforcement mechanism that requires no changes to each stack. Which solution meets these requirements?`,
  options: [
    "Add the encryption property and tags manually to every stack and rely on code review.",
    "Run cdk diff in the pipeline and fail the build when a reviewer notices a missing property.",
    "Implement an Aspect that visits every construct, adds the required tag, and reports an error for noncompliant resources; apply the Aspect to the App.",
    "Use CloudFormation drift detection after deployment and fix noncompliant resources in the console.",
  ],
  answer: 2,
  explain: `**Từ khoá:** nhiều CDK stack, quên encryption/tag, muốn **fail lúc synth**, một cơ chế chung, **không sửa từng stack**.

### Giải thích các thuật ngữ
- **AWS CDK (Cloud Development Kit)**: Công cụ cho phép bạn định nghĩa hạ tầng AWS bằng ngôn ngữ lập trình quen thuộc (như TypeScript, Java).
- **Synthesis (Synth)**: Quá trình CDK dịch code của bạn sang file CloudFormation (JSON/YAML) trước khi mang đi triển khai.
- **Aspect**: Một tính năng trong CDK (tương tự như AOP - Aspect Oriented Programming trong Java) cho phép bạn thực hiện một hành động nào đó trên *tất cả* các thành phần (Construct) trong ứng dụng mà không cần sửa code của từng thành phần.
- **Enforcement (Cưỡng chế)**: Bắt buộc phải tuân theo quy định, nếu không sẽ không cho thực hiện.

### Vì sao đáp án đúng
Khi bạn có hàng chục dự án CDK và muốn áp dụng một quy định chung (như: mọi S3 Bucket phải được mã hóa), **CDK Aspects** là công cụ mạnh mẽ nhất:
1. Bạn viết một đoạn logic kiểm tra (Aspect). Đoạn logic này sẽ "ghé thăm" (visit) từng tài nguyên trong ứng dụng của bạn.
2. Nếu nó thấy một S3 Bucket mà không có encryption, nó sẽ phát một lỗi (Error Annotation).
3. Khi Developer chạy lệnh {{cdk synth}}, CDK sẽ chạy qua các Aspect này. Nếu có bất kỳ lỗi nào được phát hiện, quá trình dịch code (synthesis) sẽ **thất bại ngay lập tức**.
4. Bạn chỉ cần gắn Aspect này một lần duy nhất ở cấp độ ứng dụng (App level), nó sẽ tự động áp dụng cho tất cả các Stack bên dưới.

### Vì sao các phương án khác sai
- **Sửa tay từng stack**: Rất dễ sai sót và tốn thời gian. Khi có 30 team, bạn không thể đảm bảo ai cũng nhớ làm đúng.
- **cdk diff + review**: Phụ thuộc hoàn toàn vào con người. Con người có thể mệt mỏi và bỏ sót lỗi. Chúng ta cần một hệ thống tự động chặn lỗi.
- **Drift detection**: Tính năng này chỉ phát hiện lỗi *sau khi* hạ tầng đã được tạo ra. Đề bài yêu cầu phải chặn được *trước khi* triển khai (before deployment).

> Exam tip: Khi thấy yêu cầu "áp dụng quy định chung" (enforce standards) cho nhiều **CDK Stack** mà không muốn sửa code từng cái, hãy chọn **Aspects**. Nhớ rằng Aspect hoạt động trong quá trình **Synthesis**.`,
  services: ['AWS CDK', 'AWS CloudFormation', 'AWS KMS'],
},
{
  id: 'dop-141',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs a quarterly game day on a production-like Amazon ECS environment. The team wants to stop 30 percent of the tasks in a specific ECS service and inject 2 seconds of network latency into task traffic for 10 minutes. The experiment must stop automatically if either the customer-facing 5xx alarm or the p99 latency alarm enters the ALARM state, and the team does not want to build or maintain custom fault-injection code. Which solution meets these requirements?`,
  options: [
    "Write a Lambda function that stops random tasks and changes their network configuration, then stops when an Amazon SNS message arrives.",
    "Use an Auto Scaling scheduled action to reduce the desired capacity during the game day.",
    "Create an AWS Fault Injection Service experiment template with ECS service targets, percentage selection, and CloudWatch alarm stop conditions.",
    "Use a CodeDeploy blue/green deployment with automatic rollback to simulate the failure.",
  ],
  answer: 2,
  explain: `**Từ khoá:** game day (buổi diễn tập cố ý gây lỗi), **stop 30% ECS task**, **inject network latency**, tự dừng theo **alarm**, không viết code.

### Giải thích các thuật ngữ
- **Game Day**: Một buổi diễn tập nơi đội kỹ thuật cố tình làm hỏng một phần hệ thống để kiểm tra xem hệ thống có tự phục hồi được không và quy trình xử lý sự cố của con người có hiệu quả không.
- **Fault Injection Service (FIS)**: Dịch vụ của AWS chuyên dùng để "phá" hệ thống một cách có kiểm soát (Chaos Engineering).
- **Network Latency (Độ trễ mạng)**: Tình trạng mạng bị chậm, dữ liệu đi từ A đến B mất nhiều thời gian hơn bình thường.
- **Stop Condition (Điều kiện dừng)**: Một cái "phanh khẩn cấp". Nếu việc diễn tập gây ra lỗi quá nghiêm trọng (vượt ngưỡng báo động), FIS sẽ tự động dừng lại để bảo vệ hệ thống.

### Vì sao đáp án đúng
**AWS FIS** là công cụ mạnh mẽ và đúng mục đích nhất cho yêu cầu này:
1. **Hành động (Action)**: Nó có sẵn các kịch bản như {{stop-task}} (dừng máy chủ ảo) và {{task-network-latency}} (làm chậm mạng).
2. **Mục tiêu (Target)**: Bạn có thể cấu hình để nó chỉ đánh vào 30% số task của một dịch vụ ECS cụ thể.
3. **An toàn (Stop Condition)**: Bạn gắn các CloudWatch Alarm vào. Nếu trong lúc diễn tập mà người dùng gặp lỗi (5xx) hoặc hệ thống quá chậm (latency cao), FIS sẽ lập tức dừng việc phá phách lại.
4. Đây là dịch vụ "quản lý" (managed), bạn chỉ việc cấu hình, không cần viết một dòng code nào.

### Vì sao các phương án khác sai
- **Lambda tự viết**: Bạn phải tự viết code để chọn máy chủ, tự viết code để làm chậm mạng, tự theo dõi Alarm... Rất tốn công và dễ gây ra sự cố ngoài ý muốn.
- **Scheduled action giảm capacity**: Cách này chỉ đơn giản là giảm số lượng máy chủ, nó không tạo ra được lỗi "độ trễ mạng" như yêu cầu.
- **CodeDeploy blue/green**: Đây là công cụ để cập nhật phần mềm mới, không phải công cụ để giả lập sự cố mạng hay dừng máy chủ ngẫu nhiên.

> Exam tip: Khi đề bài nhắc đến **Chaos Engineering**, **Game Day** hoặc **Fault Injection**, hãy nghĩ ngay đến **AWS FIS**. Điểm quan trọng của FIS là khả năng tự dừng khi gặp **CloudWatch Alarm**.`,
  services: ['AWS Fault Injection Service', 'Amazon CloudWatch', 'Amazon ECS'],
},
{
  id: 'dop-142',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs long-running batch jobs on Amazon EC2 instances in an Auto Scaling group behind a Network Load Balancer. When the group scales in, the load balancer closes idle connections, but running jobs are killed immediately and must be restarted. The company wants each instance to stop accepting new work, finish in-flight jobs for up to 5 minutes, and then terminate. The solution must be automated and must not require a custom orchestration service. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Increase the Auto Scaling group cooldown period to 300 seconds.",
    "Add an autoscaling:EC2_INSTANCE_TERMINATING lifecycle hook with a heartbeat timeout of 300 seconds to the Auto Scaling group.",
    "Enable cross-zone load balancing on the Network Load Balancer.",
    "Configure the application to stop accepting new work when the hook fires, finish in-flight jobs, and then call the complete-lifecycle-action API.",
    "Change the termination policy to OldestInstance so that the oldest instance is always terminated first.",
  ],
  answer: [1, 3],
  multi: true,
  explain: `**Từ khoá:** scale-in, job đang chạy bị kill, muốn **drain tối đa 5 phút** rồi mới terminate, tự động.

### Giải thích các thuật ngữ
- **Scale-in**: Quá trình giảm bớt số lượng máy chủ (EC2) khi nhu cầu sử dụng giảm xuống để tiết kiệm chi phí.
- **Draining (Xả việc)**: Quá trình máy chủ ngừng nhận việc mới và cố gắng hoàn thành nốt những việc đang làm dở trước khi tắt hẳn.
- **Lifecycle Hook**: Một "điểm dừng" mà AWS cung cấp trong vòng đời của máy chủ. Nó cho phép bạn tạm dừng quá trình tắt máy để thực hiện một số thao tác cần thiết.
- **Heartbeat Timeout**: Thời gian tối đa mà AWS sẽ chờ bạn thực hiện xong công việc trước khi nó mất kiên nhẫn và tự động tắt máy.

### Vì sao hai đáp án đúng
Để giải quyết bài toán "đang làm dở thì bị tắt máy", chúng ta cần phối hợp hai bước:
1. **Tạo Lifecycle Hook**: Chúng ta gắn một cái móc tên là {{EC2_INSTANCE_TERMINATING}} vào Auto Scaling Group. Khi AWS muốn tắt một máy, cái móc này sẽ giữ máy đó lại ở trạng thái "Chờ" (Wait) trong tối đa 300 giây (5 phút) thay vì tắt ngay (đáp án B).
2. **Ứng dụng tự xử lý**: Bên trong máy chủ, ứng dụng phải biết mình sắp bị tắt (ví dụ thông qua một script chạy định kỳ kiểm tra trạng thái hoặc nghe EventBridge). Nó sẽ ngừng nhận Job mới từ hàng đợi và tập trung xử lý cho xong các Job đang chạy. Sau khi xong, nó gọi API {{complete-lifecycle-action}} để báo với AWS: "Tôi xong rồi, hãy tắt tôi đi" (đáp án D).

### Vì sao các phương án khác sai
- **Tăng cooldown**: Cooldown là thời gian nghỉ giữa hai lần thay đổi số lượng máy (ví dụ: đã giảm 1 máy thì phải đợi 5 phút mới được giảm tiếp). Nó không giúp ích gì trong việc giữ cho một máy cụ thể không bị tắt đột ngột.
- **Cross-zone load balancing**: Đây là tính năng giúp bộ cân bằng tải chia đều traffic cho tất cả các vùng. Nó hoàn toàn không liên quan đến việc quản lý vòng đời máy chủ.
- **Termination policy (Chính sách tắt máy)**: Chỉ giúp quyết định *chọn* máy nào để tắt (máy cũ nhất hay máy mới nhất), chứ không giúp *trì hoãn* việc tắt máy đó.

> Exam tip: Khi gặp yêu cầu "hoàn thành nốt công việc trước khi tắt máy" (finish jobs before termination) trong Auto Scaling, hãy tìm đáp án có **Lifecycle Hook**. Nhớ là sau khi làm xong phải gọi **complete-lifecycle-action**.`,
  services: ['Amazon EC2 Auto Scaling', 'Elastic Load Balancing', 'Amazon CloudWatch'],
},
{
  id: 'dop-143',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company stores compliance records in an Amazon S3 bucket in us-east-1 and needs a copy in us-west-2. The regulation requires that 99.99 percent of objects be replicated within 15 minutes, that replication latency be observable, and that the destination bucket be usable for audit. The source bucket is already versioned. Which combination of steps will meet these requirements with the LEAST operational overhead? (Choose two.)`,
  options: [
    "Enable versioning on both the source and destination buckets.",
    "Use S3 Transfer Acceleration on the destination bucket.",
    "Add a lifecycle rule that transitions objects to S3 Glacier Instant Retrieval after 30 days.",
    "Enable Requester Pays on the destination bucket.",
    "Create a replication rule with S3 Replication Time Control enabled and monitor replication metrics.",
  ],
  answer: [0, 4],
  multi: true,
  explain: `**Từ khoá:** S3 copy cross-Region, **99.99% trong 15 phút**, quan sát **replication latency**, LEAST overhead.

### Giải thích các thuật ngữ
- **Replication (Sao chép)**: Tự động copy dữ liệu từ nơi này sang nơi khác.
- **Cross-Region Replication (CRR)**: Sao chép dữ liệu giữa hai vùng (Region) khác nhau của AWS (ví dụ từ Mỹ sang Singapore).
- **SLA (Service Level Agreement)**: Cam kết về chất lượng dịch vụ của nhà cung cấp. Ở đây là cam kết về thời gian copy xong file.
- **Metrics (Số liệu đo lường)**: Các con số giúp bạn theo dõi tình trạng hệ thống (ví dụ: mất bao lâu để copy xong một file).

### Vì sao hai đáp án đúng
Để đảm bảo dữ liệu được copy sang Region khác cực nhanh và có thể theo dõi được, chúng ta cần:
1. **Bật Versioning**: Đây là điều kiện bắt buộc để tính năng sao chép tự động của S3 hoạt động. Cả xô nguồn và xô đích đều phải bật (đáp án A).
2. **Bật Replication Time Control (RTC)**: Bình thường AWS không cam kết thời gian sao chép. Nhưng nếu bạn bật RTC, AWS cam kết 99.99% file sẽ được copy xong trong vòng 15 phút. RTC cũng tự động cung cấp các biểu đồ (metrics) để bạn xem độ trễ là bao nhiêu (đáp án E).

### Vì sao các phương án khác sai
- **Transfer Acceleration**: Cái này giúp bạn upload file từ máy tính lên S3 nhanh hơn bằng cách dùng mạng lưới toàn cầu của AWS. Nó không giúp ích gì cho việc copy giữa hai cái xô (S3 buckets) với nhau.
- **Lifecycle rule (Glacier)**: Đây là tính năng để chuyển dữ liệu cũ sang dạng lưu trữ rẻ tiền hơn (như kho lạnh). Nó không phải là tính năng sao chép sang Region khác.
- **Requester Pays**: Bình thường chủ xô trả tiền tải dữ liệu, bật cái này thì người tải phải trả tiền. Không liên quan gì đến yêu cầu sao chép.

> Exam tip: Hãy nhớ bộ đôi thần thánh cho sao chép S3 có cam kết thời gian: **CRR + Versioning + RTC**. Nếu đề bài đưa ra một con số thời gian cụ thể (như 15 phút), hãy tìm ngay chữ **RTC**.`,
  services: ['Amazon S3'],
},
{
  id: 'dop-144',
  exam: 'dop-c02',
  domain: 'dop-d3',
  q: `A company runs 80 VMware virtual machines in its data center and wants a disaster recovery strategy on AWS. The company requires an RTO of 15 minutes and an RPO of seconds or minutes for the whole data center, and wants to run non-disruptive DR drills twice a year without changing production. The company wants the LEAST operational overhead and does not want to rewrite the applications. Which solution meets these requirements?`,
  options: [
    "Use AWS Elastic Disaster Recovery with replication agents on the source servers and a staging area in AWS.",
    "Use AWS Application Migration Service to replicate the servers continuously and launch them only during a disaster.",
    "Use AWS Storage Gateway File Gateway to copy virtual machine disks to Amazon S3.",
    "Use AWS Backup to back up the virtual machines to a backup vault and restore them during a disaster.",
  ],
  answer: 0,
  explain: `**Từ khoá:** VMware on-premises, **DR** cho cả data center, RTO **15 phút**, RPO **giây/phút**, diễn tập không ảnh hưởng production, ít vận hành.

### Giải thích các thuật ngữ
- **Disaster Recovery (DR - Phục hồi sau thảm họa)**: Kế hoạch dự phòng để chạy lại hệ thống ở nơi khác nếu trung tâm dữ liệu chính bị cháy, lụt hoặc hỏng hoàn toàn.
- **RTO (Recovery Time Objective)**: Thời gian tối đa để hệ thống hoạt động trở lại. Đề yêu cầu 15 phút (rất nhanh).
- **RPO (Recovery Point Objective)**: Lượng dữ liệu tối đa bị mất. Đề yêu cầu "giây hoặc phút", nghĩa là dữ liệu ở nơi dự phòng phải gần như khớp hoàn toàn với máy chính.
- **DR Drill (Diễn tập)**: Việc chạy thử kịch bản phục hồi để đảm bảo mọi thứ vẫn ổn, nhưng không được làm gián đoạn hệ thống đang chạy thật (Production).

### Vì sao đáp án đúng
**AWS Elastic Disaster Recovery (DRS)** là dịch vụ sinh ra để làm đúng việc này:
1. Nó cài một phần mềm nhỏ (Agent) lên từng máy chủ của bạn để copy dữ liệu liên tục lên AWS (đồng bộ từng block ổ cứng).
2. Dữ liệu được lưu ở một "vùng đệm" (Staging area) cực kỳ rẻ tiền.
3. Khi có thảm họa, nó có thể dựng lại toàn bộ máy chủ trong vài phút (đáp ứng RTO 15p).
4. Quan trọng nhất: Bạn có thể nhấn nút **Drill** để chạy thử các máy dự phòng này trong một mạng riêng biệt để kiểm tra mà không hề làm ảnh hưởng đến các máy chủ đang chạy thật ở nhà.

### Vì sao các phương án khác sai
- **AWS Application Migration Service (MGN)**: Dùng để chuyển nhà (Migrate) một lần từ dưới đất lên mây rồi thôi. Nó không được thiết kế cho việc làm "lốp dự phòng" lâu dài với các đợt diễn tập định kỳ.
- **Storage Gateway**: Chỉ giúp bạn đưa file lên S3. Để biến đống file đó thành máy chủ đang chạy (Virtual Machines) mất rất nhiều thời gian, không thể đạt RTO 15 phút.
- **AWS Backup**: Giống như bạn đi copy file vào ổ cứng di động mỗi tối. Nếu thảm họa xảy ra vào buổi chiều, bạn mất sạch dữ liệu từ sáng đến chiều (RPO quá lớn).

> Exam tip: Nếu thấy yêu cầu **DR** cho máy vật lý hoặc VMware với thông số **RTO/RPO thấp (phút/giây)**, hãy chọn **AWS DRS**. Nếu đề nói về "chuyển nhà một lần", hãy chọn **AWS MGN**.`,
  services: ['AWS Elastic Disaster Recovery', 'Amazon EC2', 'Amazon EBS'],
},
{
  id: 'dop-145',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A security team already uses an organization trail in AWS CloudTrail that delivers management events to Amazon S3. The team wants to detect unusual spikes in write API calls, such as a sudden increase in TerminateInstances or DeleteBucket calls, and to receive a notification without writing queries or maintaining analytics infrastructure. The team does not need threat intelligence or malware detection. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create an AWS Config rule that evaluates the number of API calls per account.",
    "Enable Amazon GuardDuty and rely on its findings for unusual API activity.",
    "Run a nightly Amazon Athena query over the CloudTrail bucket and compare counts with the previous day.",
    "Enable CloudTrail Insights on the organization trail and route Insights events to an Amazon SNS topic through Amazon EventBridge.",
  ],
  answer: 3,
  explain: `**Từ khoá:** CloudTrail đã có, tìm **spike bất thường** của write API, chỉ cần **volume anomaly**, không cần threat intelligence, ít vận hành.

### Giải thích các thuật ngữ
- **CloudTrail**: Dịch vụ ghi lại nhật ký (log) của mọi hoạt động gọi API trên tài khoản AWS của bạn (ai đã làm gì, lúc nào).
- **Spike (Đột biến)**: Sự gia tăng số lượng đột ngột trong một khoảng thời gian ngắn.
- **Anomaly Detection (Phát hiện bất thường)**: Kỹ thuật sử dụng máy học để biết được thế nào là "bình thường" và cảnh báo khi có gì đó "không bình thường".
- **Insights (Thông tin chuyên sâu)**: Một tính năng nâng cao giúp tự động phân tích dữ liệu thô để tìm ra các mẫu (pattern) có ý nghĩa.

### Vì sao đáp án đúng
Để phát hiện sự gia tăng đột biến của các lệnh ghi (Write API) một cách tự động, **CloudTrail Insights** là công cụ phù hợp nhất:
1. Nó tự động theo dõi thói quen sử dụng API của bạn để thiết lập một "mức chuẩn" (baseline).
2. Khi số lượng lệnh xóa máy chủ (TerminateInstances) tăng vọt so với mức chuẩn, nó sẽ tạo ra một sự kiện **Insights event**.
3. Bạn chỉ cần bật tính năng này trên CloudTrail sẵn có. Không cần viết code, không cần dựng hệ thống phân tích dữ liệu phức tạp. Các sự kiện này có thể được đẩy qua EventBridge để gửi email cảnh báo (SNS).

### Vì sao các phương án khác sai
- **AWS Config rule**: Config dùng để kiểm tra xem "tài nguyên có đang ở trạng thái đúng không" (ví dụ: máy chủ có đang bật mã hóa không). Nó không dùng để theo dõi lưu lượng (volume) của các lệnh gọi API.
- **Amazon GuardDuty**: Đây là một "thám tử" chuyên tìm kiếm các dấu hiệu bị tấn công (như máy chủ bị hack). Mặc dù nó có theo dõi CloudTrail, nhưng mục tiêu của nó là tìm "mối đe dọa" chứ không đơn thuần là "phát hiện tăng volume API" như đề bài yêu cầu.
- **Amazon Athena nightly**: Việc này giống như bạn phải tự đọc log mỗi đêm và tự đếm số dòng. Nó rất tốn công (operational overhead cao) và không báo động được ngay lập tức (real-time).

> Exam tip: Nếu đề bài nhắc đến việc phát hiện **lưu lượng API bất thường** (unusual API activity/volume) dựa trên nhật ký CloudTrail, hãy chọn **CloudTrail Insights**.`,
  services: ['AWS CloudTrail', 'Amazon EventBridge', 'Amazon SNS'],
},
{
  id: 'dop-146',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company runs workloads in 12 AWS accounts, including Amazon EKS clusters that expose Prometheus metrics, Amazon CloudWatch metrics, and AWS X-Ray traces. The operations team wants a single observability dashboard for all three data sources, with user access through the corporate identity provider and no self-managed monitoring servers. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Install Grafana on a large Amazon EC2 instance and manage patching, backups, and authentication manually.",
    "Create an Amazon Managed Grafana workspace, authenticate users through IAM Identity Center with the corporate SAML identity provider, and grant the workspace IAM permissions to the data sources.",
    "Use CloudWatch dashboards only and export Prometheus metrics to CloudWatch through a custom Lambda function.",
    "Use Amazon QuickSight to visualize CloudWatch and Prometheus metrics.",
  ],
  answer: 1,
  explain: `**Từ khoá:** nhiều account, **Prometheus + CloudWatch + X-Ray**, một dashboard, **SSO công ty**, không tự quản server.

### Giải thích các thuật ngữ
- **Observability (Khả năng quan sát)**: Một khái niệm rộng hơn giám sát (monitoring), bao gồm việc thu thập và phân tích Logs, Metrics và Traces để hiểu sâu về hệ thống.
- **Prometheus**: Một hệ thống mã nguồn mở cực kỳ phổ biến để thu thập và lưu trữ các con số đo lường (metrics), đặc biệt trong thế giới Kubernetes (EKS).
- **Grafana**: Công cụ hàng đầu thế giới để vẽ biểu đồ và xây dựng Dashboard từ nhiều nguồn dữ liệu khác nhau.
- **IAM Identity Center (trước đây là SSO)**: Dịch vụ của AWS giúp quản lý đăng nhập tập trung, cho phép dùng tài khoản công ty để đăng nhập vào tất cả các tài khoản AWS.

### Vì sao đáp án đúng
**Amazon Managed Grafana** là giải pháp "tất cả trong một" cho yêu cầu này:
1. **Hợp nhất dữ liệu**: Nó hỗ trợ sẵn (native) việc đọc dữ liệu từ CloudWatch, X-Ray và cả Prometheus. Bạn có một màn hình duy nhất (single pane of glass) cho mọi thứ.
2. **Không tốn công vận hành**: Đây là dịch vụ được AWS quản lý hoàn toàn. Bạn không cần phải tự cài server, tự vá lỗi bảo mật hay lo lắng về việc nâng cấp Grafana.
3. **Bảo mật**: Nó tích hợp hoàn hảo với **IAM Identity Center**. Nhân viên của bạn có thể dùng chính tài khoản Microsoft AD hoặc Google của công ty để đăng nhập vào xem biểu đồ.

### Vì sao các phương án khác sai
- **Grafana tự cài trên EC2**: Bạn sẽ phải tự làm mọi thứ: từ cài đặt, cấu hình HA (High Availability), sao lưu dữ liệu cho đến việc tự viết code để kết nối với hệ thống đăng nhập của công ty. Tốn rất nhiều công sức (High operational overhead).
- **Chỉ dùng CloudWatch Dashboard**: CloudWatch không hỗ trợ hiển thị dữ liệu từ Prometheus một cách trực tiếp và mạnh mẽ như Grafana. Bạn sẽ phải viết code Lambda để đẩy dữ liệu rất phức tạp.
- **QuickSight**: Đây là công cụ dành cho dân kinh doanh (Business Intelligence) để làm báo cáo doanh thu, khách hàng. Nó không phù hợp để làm Dashboard theo dõi kỹ thuật cho dân DevOps.

> Exam tip: Khi thấy combo **Prometheus + Grafana + Managed**, hãy chọn **Amazon Managed Grafana**. Nếu đề bài nhắc đến việc dùng tài khoản công ty (Corporate IdP) để đăng nhập, hãy chọn **IAM Identity Center**.`,
  services: ['Amazon Managed Grafana', 'AWS IAM Identity Center', 'Amazon CloudWatch', 'AWS X-Ray'],
},
{
  id: 'dop-147',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company runs a public web application and receives complaints that pages load slowly for users in specific countries and browsers. Server-side metrics look normal. The company wants real user measurements such as page load time, JavaScript errors, and session information, wants to correlate slow sessions with backend X-Ray traces, and wants to change application code as little as possible. Which solution meets these requirements?`,
  options: [
    "Create a CloudWatch RUM app monitor, add the generated JavaScript snippet to the application, and enable X-Ray trace correlation.",
    "Create a CloudWatch Synthetics canary that runs the checkout flow every 5 minutes from three Regions.",
    "Install the CloudWatch agent on the web servers and derive page load metrics from the access logs.",
    "Enable Lambda Insights on the backend functions so that every slow request is recorded.",
  ],
  answer: 0,
  explain: `**Từ khoá:** người dùng thật, chậm theo **quốc gia/trình duyệt**, server metric bình thường, cần **JS error**, session, nối với **X-Ray**, ít sửa code.

### Giải thích các thuật ngữ
- **Real User Monitoring (RUM)**: Giám sát người dùng thật. Trái ngược với việc dùng Robot để kiểm tra, RUM thu thập dữ liệu từ chính trình duyệt của khách hàng đang truy cập web của bạn.
- **Server-side Metrics**: Các con số đo lường phía máy chủ (như CPU, RAM, thời gian xử lý của Database). Đôi khi server chạy rất nhanh nhưng người dùng vẫn thấy chậm do mạng hoặc do lỗi JavaScript trên trình duyệt.
- **JS Errors (Lỗi JavaScript)**: Các lỗi xảy ra trong mã chạy trên trình duyệt của khách hàng, có thể làm trang web bị đơ hoặc không bấm được nút.
- **Trace correlation (Liên kết vết)**: Khả năng nối liền một yêu cầu từ lúc khách hàng bấm nút trên trình duyệt cho tới khi nó đi qua các dịch vụ ở phía sau (Backend).

### Vì sao đáp án đúng
**CloudWatch RUM** là dịch vụ sinh ra cho tình huống này:
1. Bạn chỉ cần thêm một đoạn mã JavaScript nhỏ (snippet) vào trang web của mình.
2. Nó sẽ tự động thu thập thông tin về thời gian tải trang, lỗi JavaScript, và quan trọng là nó biết khách hàng ở **quốc gia** nào, dùng **trình duyệt** gì.
3. Nó có khả năng liên kết với **AWS X-Ray**. Nếu một khách hàng phàn nàn web chậm, bạn có thể nhìn thấy đúng cái "vết" (trace) của yêu cầu đó ở phía Backend để biết nó bị nghẽn ở đâu.
Đây là cách ít phải sửa code nhất và mang lại thông tin đầy đủ nhất về trải nghiệm người dùng.

### Vì sao các phương án khác sai
- **CloudWatch Synthetics Canary**: Đây là việc dùng "Robot" để truy cập web định kỳ. Robot này chỉ ở một vài địa điểm cố định, nó không thể đại diện cho hàng triệu khách hàng thật ở khắp nơi trên thế giới với đủ loại trình duyệt khác nhau.
- **CloudWatch Agent trên server**: Nó chỉ biết những gì xảy ra bên trong máy chủ. Nó hoàn toàn "mù" trước các lỗi JavaScript hay độ trễ do mạng từ máy khách hàng đến máy chủ.
- **Lambda Insights**: Chỉ giúp bạn theo dõi hiệu năng của các hàm Lambda ở Backend, không giúp ích gì trong việc hiểu trải nghiệm của người dùng trên giao diện web.

> Exam tip: Hãy nhớ RUM = **Real Users**. Khi đề bài nhắc đến **trình duyệt của khách hàng**, **vị trí địa lý của người dùng** hoặc **lỗi JavaScript**, hãy chọn **CloudWatch RUM**.`,
  services: ['Amazon CloudWatch RUM', 'AWS X-Ray'],
},
{
  id: 'dop-148',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company runs about 600 Amazon EC2 instances in one AWS account. The operations team needs a dashboard widget that always shows the 20 instances with the highest CPU utilization over the last 5 minutes. The list must automatically include instances launched today and must not depend on a maintained list of instance IDs or on one dashboard per Auto Scaling group. The company wants the LEAST operational overhead. Which solution meets these requirements?`,
  options: [
    "Create one CloudWatch alarm per instance and sort the alarms by state on a dashboard.",
    "Write a Lambda function that calls DescribeInstances every minute and publishes a custom metric with the top 20 instances.",
    "Use a CloudWatch Metrics Insights query on the dashboard with GROUP BY InstanceId, ORDER BY MAX() DESC, and LIMIT 20.",
    "Install the CloudWatch agent on each instance and create a separate dashboard for each Auto Scaling group.",
  ],
  answer: 2,
  explain: `**Từ khoá:** 600 instance, **top 20 CPU**, danh sách **tự cập nhật** khi có máy mới, không quản lý danh sách ID, LEAST overhead.

### Giải thích các thuật ngữ
- **Metrics (Số liệu)**: Các con số đo lường hiệu năng, ví dụ: % CPU của máy chủ.
- **Widget**: Một ô nhỏ trên màn hình giám sát (Dashboard) hiển thị biểu đồ hoặc danh sách.
- **Metrics Insights**: Một công cụ cho phép bạn dùng ngôn ngữ giống như SQL để "hỏi" CloudWatch về các số liệu.
- **Fleet (Đội tàu/Đội máy chủ)**: Thuật ngữ chỉ toàn bộ các máy chủ mà bạn đang quản lý.

### Vì sao đáp án đúng
Khi bạn có hàng trăm máy chủ và danh sách này thay đổi liên tục (máy mới sinh ra, máy cũ tắt đi), việc quản lý thủ công một Dashboard là không khả thi. **CloudWatch Metrics Insights** giải quyết việc này cực kỳ thông minh:
1. Bạn viết một câu lệnh truy vấn (Query) kiểu SQL: "Hãy lấy cho tôi 20 máy có CPU cao nhất".
2. AWS sẽ tự động quét toàn bộ "đội tàu" của bạn, tìm ra 20 cái tên đó và hiển thị lên màn hình.
3. Nếu chiều nay bạn tạo thêm 100 máy mới, câu truy vấn này sẽ **tự động** bao gồm cả những máy mới đó nếu chúng nằm trong top 20 CPU cao nhất. Bạn không cần phải sửa bất kỳ cấu hình nào.
Đây là cách làm tự động hóa hoàn toàn, tốn ít công sức nhất.

### Vì sao các phương án khác sai
- **Một Alarm cho mỗi máy chủ**: Bạn sẽ phải tạo 600 cái Alarm. Khi có máy mới lại phải tạo thêm. Việc quản lý 600 cái Alarm trên một màn hình là một cơn ác mộng và không thể sắp xếp chúng theo thứ tự CPU từ cao xuống thấp một cách linh hoạt được.
- **Lambda gọi DescribeInstances**: Bạn phải tự viết code để đi hỏi xem có những máy nào, sau đó tự tính toán rồi lại đẩy dữ liệu ngược lại CloudWatch. Rất tốn công lập trình và bảo trì code (Operational overhead cao).
- **Dashboard theo từng Auto Scaling Group**: Nó chỉ cho bạn thấy từng nhóm nhỏ, không thể cho bạn cái nhìn tổng thể về toàn bộ 600 máy chủ để biết 20 máy nào đang "nóng" nhất.

> Exam tip: Nếu đề bài yêu cầu hiển thị **Top N** (ví dụ Top 10, Top 20) của một số liệu nào đó trên quy mô lớn, hãy tìm đáp án có **CloudWatch Metrics Insights**. Nó cho phép bạn dùng SQL để lọc và sắp xếp số liệu cực nhanh.`,
  services: ['Amazon CloudWatch', 'Amazon EC2'],
},
{
  id: 'dop-149',
  exam: 'dop-c02',
  domain: 'dop-d4',
  q: `A company ingests about 5 TB of application logs per month into Amazon CloudWatch Logs. About 90 percent of the log data is never queried after the first 7 days, but the company must retain all logs for 400 days and occasionally investigates incidents with CloudWatch Logs Insights. The company wants to reduce log costs without changing applications and without giving up the ability to query recent and historical logs. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Keep the Standard log class and reduce retention to 7 days.",
    "Change the log group class to Infrequent Access and keep the required retention period.",
    "Export logs to Amazon S3 every day and delete the CloudWatch log group.",
    "Create metric filters for every field and delete the raw log events.",
  ],
  answer: 1,
  explain: `**Từ khoá:** 5 TB/tháng, **90% không query sau 7 ngày**, giữ **400 ngày**, thỉnh thoảng dùng **Logs Insights**, giảm chi phí, không sửa app.

### Giải thích các thuật ngữ
- **CloudWatch Logs Insights**: Một công cụ cho phép bạn chạy các câu lệnh tìm kiếm mạnh mẽ trên dữ liệu nhật ký (log) để tìm lỗi hoặc phân tích hành vi hệ thống.
- **Log Group Class**: Các "hạng" lưu trữ log khác nhau của AWS để tối ưu chi phí.
- **Retention (Thời gian lưu trữ)**: Khoảng thời gian AWS sẽ giữ log trước khi tự động xóa chúng đi.

### Vì sao đáp án đúng
AWS cung cấp hai hạng lưu trữ log:
1. **Standard**: Đầy đủ tính năng, dùng cho các log quan trọng cần theo dõi thời gian thực (Live Tail).
2. **Infrequent Access (IA)**: Hạng "ít truy cập". Nó rẻ hơn rất nhiều (giảm chi phí nạp log và lưu trữ), nhưng vẫn cho phép bạn dùng **Logs Insights** để tìm kiếm khi cần.
Với yêu cầu: Lưu rất nhiều log (5 TB), lưu rất lâu (400 ngày) nhưng hiếm khi sờ tới (chỉ thỉnh thoảng điều tra), việc chuyển sang hạng **Infrequent Access** là cách tiết kiệm tiền nhất mà vẫn đảm bảo khả năng điều tra sự cố. Bạn chỉ việc thay đổi cấu hình trên AWS, không cần sửa bất kỳ dòng code nào của ứng dụng.

### Vì sao các phương án khác sai
- **Giảm retention xuống 7 ngày**: Không được, vì đề bài bắt buộc phải giữ log trong 400 ngày để tuân thủ quy định.
- **Export sang S3 rồi xóa ở CloudWatch**: Việc này làm bạn mất đi công cụ query mạnh mẽ là Logs Insights. Mỗi lần muốn tìm kiếm, bạn lại phải mất công nạp ngược dữ liệu từ S3 về, rất tốn thời gian và công sức.
- **Metric Filter (Chỉ giữ lại số liệu, xóa log gốc)**: Nếu bạn xóa log gốc, bạn sẽ không còn bằng chứng hay chi tiết để điều tra nguyên nhân sâu xa (root cause) khi có sự cố xảy ra.

> Exam tip: Hãy nhớ quy tắc: Log quan trọng/cần xem ngay lập tức -> **Standard**. Log chỉ để lưu trữ/thỉnh thoảng mới tìm kiếm -> **Infrequent Access**. Cả hai đều dùng được **Logs Insights**.`,
  services: ['Amazon CloudWatch Logs'],
},
{
  id: 'dop-150',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `An Amazon EventBridge rule invokes an AWS Step Functions state machine when an order event is published. During a downstream outage, the target fails repeatedly and some events are lost after EventBridge exhausts its retries. The company wants failed events and their error details to be retained for later reprocessing, wants retries to be controlled, and wants the LEAST custom code. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Configure a retry policy on the rule target with a maximum age and maximum retry attempts.",
    "Enable X-Ray active tracing on the EventBridge rule.",
    "Increase the rule event pattern to match more event types.",
    "Configure an Amazon SQS dead-letter queue on the rule target and grant the rule permission to send messages to it.",
    "Create a Lambda function that polls the target CloudWatch metrics and resends failed events.",
  ],
  answer: [0, 3],
  multi: true,
  explain: `**Từ khoá:** EventBridge target fail, event bị mất sau retry, cần **giữ event + lỗi** để xử lý lại, ít code.

### Giải thích các thuật ngữ
- **Target (Đích đến)**: Nơi mà EventBridge sẽ gửi dữ liệu tới (ví dụ: Lambda, Step Functions, SQS).
- **Retry Policy (Chính sách thử lại)**: Khi gửi dữ liệu thất bại (ví dụ do hệ thống đích bị sập), EventBridge sẽ không bỏ cuộc ngay mà sẽ thử gửi lại nhiều lần.
- **Dead-letter queue (DLQ - Hòm thư chết)**: Một hàng đợi (thường là SQS) dùng để chứa những dữ liệu mà hệ thống đã cố gắng gửi nhiều lần nhưng vẫn thất bại. Nó giúp bạn không bị mất dữ liệu và có thể kiểm tra xem lỗi là gì để xử lý sau.

### Vì sao hai đáp án đúng
Để đảm bảo không mất sự kiện (event) khi hệ thống đích gặp sự cố, chúng ta cần phối hợp hai thiết lập ngay trên EventBridge Rule:
1. **Cấu hình Retry Policy**: Bạn có thể quy định số lần thử lại tối đa hoặc thời gian chờ tối đa (đáp án A). Điều này giúp hệ thống tự phục hồi nếu sự cố chỉ diễn ra trong chốc lát.
2. **Cấu hình SQS DLQ**: Đây là "lưới bảo hiểm" cuối cùng. Nếu sau khi đã thử hết số lần quy định mà vẫn thất bại, EventBridge sẽ ném sự kiện đó vào một hàng đợi SQS (đáp án D). Sự kiện nằm trong SQS sẽ đi kèm với thông tin lỗi chi tiết để bạn biết tại sao nó hỏng.
Đây là cách làm chính thống, không cần viết code xử lý lỗi phức tạp (LEAST custom code).

### Vì sao các phương án khác sai
- **X-Ray tracing**: Đây là công cụ để nhìn xem luồng dữ liệu đi như thế nào và chậm ở đâu. Nó không có chức năng lưu trữ lại các sự kiện bị lỗi để chạy lại.
- **Mở rộng Event Pattern**: Việc này chỉ làm cho Rule nhận thêm nhiều loại sự kiện khác, không liên quan gì đến việc xử lý lỗi khi gửi dữ liệu.
- **Lambda poll metric**: Việc viết một hàm Lambda để đi canh chừng các biểu đồ lỗi rồi tìm cách gửi lại là cực kỳ phức tạp và tốn công bảo trì.

> Exam tip: Khi thấy yêu cầu "xử lý các sự kiện thất bại" (handle failed events) trong EventBridge, hãy luôn tìm combo: **Retry Policy** và **Dead-letter Queue (SQS)**.`,
  services: ['Amazon EventBridge', 'AWS Step Functions', 'Amazon SQS', 'AWS Lambda'],
},
{
  id: 'dop-151',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A Java AWS Lambda function is invoked asynchronously to process uploaded images. When processing fails after the built-in retries, the company wants the original event and the error details to be sent to an Amazon SQS queue for replay. Successful invocations must publish a notification to an Amazon SNS topic. The company wants to avoid changing the function code and wants the LEAST operational overhead. Which solution meets these requirements?`,
  options: [
    "Add a try/catch block that writes failures to Amazon SQS and successes to Amazon SNS.",
    "Configure Lambda destinations: send records of failed invocations to an Amazon SQS queue and successful invocations to an Amazon SNS topic.",
    "Configure a dead-letter queue on the function and use CloudWatch Logs for successful invocations.",
    "Create an EventBridge rule that matches the Lambda error metric and invokes a replay function.",
  ],
  answer: 1,
  explain: `**Từ khoá:** Lambda **async**, fail sau retry, cần **event gốc + response + error** vào SQS, success vào SNS, **không sửa code**, ít vận hành.

### Vì sao đáp án đúng
**Lambda destinations** là cấu hình trên function cho invocation bất đồng bộ: **OnSuccess** và **OnFailure** có thể trỏ tới SQS, SNS, EventBridge hoặc Lambda. Record gửi đi chứa request payload, response (hoặc error) và metadata, đủ để replay và điều tra. Không phải sửa code; chỉ cần execution role có quyền gửi tới đích.

### Vì sao các phương án khác sai
- **Try/catch trong code**: sửa code, phải tự publish và tự xử lý retry; trái yêu cầu.
- **DLQ + CloudWatch Logs**: DLQ chỉ giữ event gốc, không có response/error details; log không phải nơi replay.
- **EventBridge theo metric lỗi**: metric không chứa payload, phải viết hàm replay và dễ mất event.

> Exam tip: phân biệt **DLQ** (chỉ event) với **destinations** (event + response/error). Destinations chỉ áp dụng cho **asynchronous invocation**, không áp dụng cho synchronous.`,
  services: ['AWS Lambda', 'Amazon SQS', 'Amazon SNS'],
},
{
  id: 'dop-152',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company must run a nightly settlement batch at 02:00 local time in 14 countries. Each country observes daylight saving time differently, and the batch must be retried automatically with a dead-letter queue if the target fails. The company wants a managed scheduler with the LEAST operational overhead and does not want to maintain servers or convert every local time to UTC manually. Which solution meets these requirements?`,
  options: [
    "Create one Amazon EventBridge Scheduler schedule per country with the local time zone, a retry policy, and a dead-letter queue.",
    "Create an EventBridge rule with a cron expression in UTC and adjust the expression twice a year.",
    "Run cron on an Amazon EC2 instance in each Region and keep the instances running.",
    "Use an AWS Step Functions state machine with a Wait state until 02:00 UTC.",
  ],
  answer: 0,
  explain: `**Từ khoá:** chạy **02:00 giờ địa phương** ở 14 nước, **DST khác nhau**, retry + DLQ, managed, không tự đổi UTC.

### Vì sao đáp án đúng
**EventBridge Scheduler** hỗ trợ **time zone** cho từng schedule (ví dụ {{Asia/Ho_Chi_Minh}}, {{Europe/Berlin}}), nên 02:00 luôn là giờ địa phương kể cả khi đổi DST. Scheduler có **retry policy** và **dead-letter queue** trên target, cùng **flexible time window** nếu cần. Mỗi quốc gia một schedule là cấu hình khai báo, không cần server.

### Vì sao các phương án khác sai
- **EventBridge rule cron UTC**: phải tự tính offset và sửa hai lần mỗi năm khi DST đổi, dễ sai.
- **Cron trên EC2**: phải chạy và vá server, trái yêu cầu managed.
- **Step Functions Wait tới 02:00 UTC**: vẫn là giờ UTC, không theo giờ địa phương, và không phải scheduler.

> Exam tip: EventBridge **rule** dùng cron UTC; EventBridge **Scheduler** hỗ trợ timezone, one-time schedule, retry và DLQ. Đề có "local time" là Scheduler.`,
  services: ['Amazon EventBridge Scheduler', 'Amazon SQS'],
},
{
  id: 'dop-153',
  exam: 'dop-c02',
  domain: 'dop-d5',
  q: `A company runs producers in two AWS Regions that publish order events to a custom Amazon EventBridge bus in us-east-1. During a Regional impairment, the company wants producers to keep using a single endpoint and have events automatically routed to a secondary bus in us-west-2. The company wants the failover to be based on health checks, wants events replicated to the secondary Region when possible, and wants the LEAST operational overhead. Which solution meets these requirements?`,
  options: [
    "Create an Amazon Route 53 failover record that points producers to the secondary Region.",
    "Place an Application Load Balancer in front of the EventBridge PutEvents API and use health checks.",
    "Create an EventBridge global endpoint with a primary and secondary event bus and a health check for automatic failover.",
    "Replicate events with an Amazon SQS queue in each Region and a custom consumer.",
  ],
  answer: 2,
  explain: `**Từ khoá:** producer nhiều Region, **một endpoint**, failover sang bus phụ, dựa trên **health check**, replicate event, ít vận hành.

### Vì sao đáp án đúng
**EventBridge global endpoint** cung cấp một endpoint duy nhất cho producer (health check là kiểm tra định kỳ xem endpoint còn phản hồi không). Global endpoint định tuyến tới **primary event bus** ở Region chính; nếu **health check** thấy primary không khoẻ, nó tự chuyển sang **secondary event bus**. Có thể bật **event replication** để event ở primary được replicate sang secondary, giúp failover không mất dữ liệu. Không cần thay đổi code producer ngoài việc dùng endpoint global.

### Vì sao các phương án khác sai
- **Route 53 failover record**: DNS không thay thế được endpoint API EventBridge và không đảm bảo replication event.
- **ALB trước PutEvents**: không thể đặt ALB trước một AWS API công khai như vậy.
- **SQS + consumer tự viết**: là custom integration, nhiều vận hành và không phải EventBridge endpoint.

> Exam tip: global endpoint có **routing control** cho failover thủ công và **health check** cho tự động; event replication là tuỳ chọn nhưng nên bật nếu cần RPO thấp.`,
  services: ['Amazon EventBridge', 'Amazon Route 53'],
},
{
  id: 'dop-154',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company has 100 accounts in AWS Organizations and wants continuous vulnerability scanning for Amazon EC2 instances, Amazon ECR images, and AWS Lambda functions. Findings must be aggregated in AWS Security Hub in a central security account, and accounts created in the future must be covered with the LEAST operational overhead. Which combination of steps will meet these requirements? (Choose two.)`,
  options: [
    "Install the Amazon Inspector agent on every EC2 instance and inside every Lambda function.",
    "Designate a delegated administrator account for Amazon Inspector in AWS Organizations.",
    "Enable only ECR basic scanning on image push.",
    "Use AWS Config rules to detect vulnerable package versions.",
    "Enable Amazon Inspector organization-wide for the EC2, ECR, and Lambda scan types and send findings to Security Hub.",
  ],
  answer: [1, 4],
  multi: true,
  explain: `**Từ khoá:** 100 account, quét **EC2 + ECR + Lambda**, findings tập trung **Security Hub**, account mới tự động, ít vận hành.

### Vì sao hai đáp án đúng
**Amazon Inspector** là dịch vụ quét lỗ hổng được quản lý. **Delegated administrator** là account thành viên được ủy quyền quản lý dịch vụ cho cả Organization; nhờ đó một account bảo mật có thể bật Inspector cho mọi account và account mới. Inspector quét EC2 (dùng SSM agent có sẵn, không cần agent Inspector riêng), ECR image và Lambda; tự quét lại khi có CVE mới. Findings được đẩy sang **Security Hub** để tổng hợp.

### Vì sao các phương án khác sai
- **Cài agent Inspector trên EC2/Lambda**: không có agent Inspector riêng; EC2 dùng SSM agent, Lambda được quét từ nền tảng.
- **ECR basic scanning**: chỉ quét image khi push, không quét EC2/Lambda và không tự đánh giá lại khi CVE mới.
- **AWS Config rule**: kiểm tra cấu hình, không phải kho CVE của package.

> Exam tip: Inspector v2 = **agentless từ góc vận hành**, quét liên tục EC2/ECR/Lambda; tổ chức dùng **delegated administrator + Security Hub**.`,
  services: ['Amazon Inspector', 'AWS Security Hub', 'AWS Organizations', 'Amazon ECR', 'AWS Lambda'],
},
{
  id: 'dop-155',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company stores 200 TB of objects in an Amazon S3 bucket encrypted with SSE-KMS using a customer managed key. The bucket serves millions of GET and PUT requests per hour, and the company is seeing AWS KMS request throttling and high KMS costs. The company must keep the customer managed key and must not change the application or weaken encryption. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Switch the bucket to SSE-S3 so that AWS KMS is no longer called.",
    "Create a separate KMS key for each object prefix to spread the requests.",
    "Request a KMS quota increase and keep the current configuration.",
    "Enable S3 Bucket Keys for the bucket while keeping SSE-KMS with the customer managed key.",
  ],
  answer: 3,
  explain: `**Từ khoá:** SSE-KMS, **hàng triệu request/giờ**, KMS **throttling + cost**, phải giữ CMK, không sửa app.

### Vì sao đáp án đúng
**S3 Bucket Keys** giảm số lần gọi KMS bằng cách dùng một **bucket-level key** được tạo từ CMK (customer managed key, key do khách hàng tạo và quản lý trong KMS), rồi sinh **object-level data key** cục bộ trong S3. Nhờ vậy, mỗi object không cần một lần gọi {{kms:GenerateDataKey}} và {{kms:Decrypt}} riêng; số call KMS có thể giảm tới 99%. Dữ liệu vẫn được mã hoá bằng CMK, application không đổi, và Bucket Keys là mặc định cho bucket mới.

### Vì sao các phương án khác sai
- **SSE-S3**: bỏ CMK, trái yêu cầu kiểm soát key.
- **Nhiều KMS key theo prefix**: tăng phức tạp quản lý key, không giảm tổng số call và có thể vẫn throttle.
- **Tăng quota KMS**: chỉ nâng giới hạn, không giảm chi phí trên mỗi request.

> Exam tip: S3 Bucket Keys giải quyết cả **throttling** và **chi phí KMS** cho workload đọc/ghi lớn; nhớ nó vẫn là SSE-KMS, không phải SSE-S3.`,
  services: ['Amazon S3', 'AWS KMS'],
},
{
  id: 'dop-156',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company wants a third-party SaaS monitoring vendor to read selected resources in its AWS account. The vendor will assume an IAM role from its own AWS account. The security team is concerned about the confused deputy problem and wants to ensure that the vendor can access only this customers resources, even if the vendor serves many customers. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Create an IAM user for the vendor and store the access key in the vendors ticketing system.",
    "Create an IAM role with a trust policy for the vendors AWS account, require a unique sts:ExternalId, and attach a read-only policy.",
    "Create a role that trusts any AWS account and rely on MFA for the vendor.",
    "Share the AWS account root credentials with the vendor under a non-disclosure agreement.",
  ],
  answer: 1,
  explain: `**Từ khoá:** third-party vendor, cross-account role, **confused deputy**, chỉ truy cập resource của đúng khách hàng, ít vận hành.

### Vì sao đáp án đúng
Mô hình chuẩn là **IAM role cross-account** với **trust policy** chỉ cho phép account của vendor assume role, kèm điều kiện {{sts:ExternalId}} bằng một giá trị duy nhất do công ty tạo. External ID ngăn **confused deputy** (tình huống bên thứ ba dùng quyền của mình để truy cập nhầm tài nguyên của khách hàng khác): vendor không thể dùng quyền của mình để khiến role truy cập nhầm resource. Gắn policy read-only giới hạn đúng resource cần thiết; vendor nhận credential tạm thời qua AssumeRole.

### Vì sao các phương án khác sai
- **IAM user + access key**: credential dài hạn, khó xoay vòng và không có external ID.
- **Trust mọi account + MFA**: MFA không xác định đúng khách hàng và quá rộng.
- **Chia sẻ root credentials**: vi phạm bảo mật nghiêm trọng, không thể giới hạn quyền.

> Exam tip: third-party cross-account luôn nghĩ **role + ExternalId + least privilege**; external ID do khách hàng tạo, không phải vendor tự chọn.`,
  services: ['AWS IAM', 'AWS Security Token Service'],
},
{
  id: 'dop-157',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `A company has 120 accounts in AWS Organizations. Developers in member accounts frequently create Amazon S3 buckets with public access for testing and forget to remove it. The security team wants a central guardrail that blocks public access for all buckets, including buckets in accounts created later, even if an account administrator tries to change bucket settings. The company wants the LEAST operational overhead. Which solution meets these requirements?`,
  options: [
    "Enable the S3 Block Public Access settings for the organization in AWS Organizations.",
    "Deploy an AWS Config rule that marks public buckets as noncompliant and notifies the team.",
    "Add a bucket policy to every new bucket that denies public access.",
    "Use an SCP that denies s3:PutBucketPolicy for all users.",
  ],
  answer: 0,
  explain: `**Từ khoá:** 120 account, chặn **public bucket**, account mới, **account admin không đổi được**, ít vận hành.

### Vì sao đáp án đúng
**S3 Block Public Access ở cấp Organizations** áp dụng cho mọi account thành viên, gồm account tạo sau này. Cấu hình này **ưu tiên hơn** thiết lập ở cấp account và bucket, nên account admin không thể mở public bằng cách sửa bucket policy, ACL hay bucket-level block public access. Chỉ cần bật một lần ở management account.

### Vì sao các phương án khác sai
- **AWS Config rule + notify**: chỉ phát hiện sau khi bucket đã public, không chặn.
- **Bucket policy cho từng bucket**: phải làm thủ công, bỏ sót bucket cũ và bucket mới.
- **SCP deny PutBucketPolicy**: chặn cả thay đổi hợp lệ, không chặn public qua ACL hoặc bucket settings.

> Exam tip: phân biệt **S3 Block Public Access** (chặn public) với **SCP** (chặn API). Ở quy mô Organization, BPA cấp tổ chức là giải pháp được thiết kế cho yêu cầu này.`,
  services: ['Amazon S3', 'AWS Organizations'],
},
{
  id: 'dop-158',
  exam: 'dop-c02',
  domain: 'dop-d6',
  q: `Amazon GuardDuty raises a high-severity finding that an Amazon EC2 instance is communicating with a cryptocurrency mining domain. The security team must determine how the instance was compromised, which IAM principal and API calls were involved, and what other resources the instance contacted. The team wants a prebuilt investigation experience instead of manually correlating CloudTrail, VPC Flow Logs, and DNS logs. Which solution meets these requirements with the LEAST operational overhead?`,
  options: [
    "Run Amazon Athena queries over CloudTrail and VPC Flow Logs after every finding.",
    "Enable AWS Security Hub and group findings by severity.",
    "Enable Amazon Detective and use the entity profile and behavior graph for the finding.",
    "Create a CloudWatch dashboard with GuardDuty finding metrics.",
  ],
  answer: 2,
  explain: `**Từ khoá:** GuardDuty finding, cần **điều tra nguyên nhân**, IAM principal, API call, resource liên quan, **không tự correlate log**.

### Vì sao đáp án đúng
**Amazon Detective** tự động thu thập và phân tích CloudTrail, VPC Flow Logs, DNS logs và GuardDuty findings thành một **behavior graph**. Từ finding, team mở **entity profile** của instance, IAM role, IP hoặc user để xem hoạt động liên quan, thời điểm, và quan hệ giữa các thực thể. Không cần tự viết query hay dựng pipeline; Detective giữ dữ liệu khoảng một năm.

### Vì sao các phương án khác sai
- **Athena thủ công**: phải tự join nhiều nguồn log, viết query cho từng sự cố, tốn thời gian.
- **Security Hub**: tổng hợp và chuẩn hoá findings, không có behavior graph để điều tra.
- **CloudWatch dashboard**: chỉ hiển thị metric, không tương quan log và danh tính.

> Exam tip: GuardDuty **phát hiện**, Detective **điều tra**, Security Hub **tổng hợp**. Đề có "triage and root cause across logs" là Detective.`,
  services: ['Amazon Detective', 'Amazon GuardDuty', 'AWS CloudTrail', 'Amazon VPC'],
},
);
