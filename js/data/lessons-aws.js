/* Bài học track "aws". Schema & markup: AGENTS.md mục 12. Bài tập mô phỏng cơ chế AWS bằng Java thuần (không dùng AWS SDK). */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-aws-001',
  track: 'aws',
  order: 1,
  title: 'IAM và credentials cho ứng dụng Java: principal, policy, role và credentials provider chain',
  level: 'mid',
  minutes: 40,
  goals: [
    'Phân biệt principal, identity-based policy và resource-based policy; đọc hiểu một policy JSON',
    'Tự đánh giá một request theo đúng thứ tự: explicit deny > allow > implicit deny',
    'Giải thích vì sao app trên EC2/ECS/EKS dùng role + credentials tạm thời (STS) thay cho access key dài hạn',
    'Biết default credentials provider chain của AWS SDK for Java v2 tìm credentials ở đâu và theo thứ tự nào',
  ],
  body: `### Bức tranh tổng thể: ai được làm gì trên tài nguyên nào
Mỗi lần code Java của bạn gọi AWS (đọc file S3, gửi message SQS…), SDK thực chất gửi một **HTTP request có chữ ký** (Signature Version 4) tới API của AWS. Phía AWS trả lời ba câu hỏi:

1. **Ai đang gọi?** (authentication): chữ ký được tạo bằng credentials nào, credentials đó thuộc **principal** nào.
2. **Principal đó có được phép làm hành động này trên tài nguyên này không?** (authorization): AWS gom mọi **policy** liên quan rồi đánh giá.
3. Nếu được phép thì thực hiện; nếu không thì trả về {{AccessDenied}} (HTTP 403).

**Principal** là thực thể có thể gửi request: IAM user (người hoặc máy, có credentials dài hạn), **IAM role** (danh tính không gắn với ai cố định, ai được tin cậy thì "đội" role lên và nhận credentials tạm thời), federated user (đăng nhập qua SSO / IAM Identity Center), AWS service (ví dụ {{lambda.amazonaws.com}}), và root user của account (chỉ dùng cho vài việc quản trị, phải bật MFA rồi cất đi).

### Policy: tài liệu JSON mô tả quyền
~~~json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadInvoices",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::acme-invoices/*"
    },
    {
      "Sid": "ListInvoiceBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::acme-invoices"
    }
  ]
}
~~~
- **Effect**: {{Allow}} hoặc {{Deny}}. **Action**: tên API dạng {{service:Operation}}, cho phép wildcard ({{s3:Get*}}). Tên action **không phân biệt hoa thường**.
- **Resource**: ARN (Amazon Resource Name). Chú ý: {{s3:ListBucket}} tác động lên **bucket** ({{arn:aws:s3:::acme-invoices}}), còn {{s3:GetObject}} tác động lên **object** ({{arn:aws:s3:::acme-invoices/*}}). Viết nhầm hai ARN này là nguyên nhân AccessDenied phổ biến nhất khi mới làm S3.
- **Condition** (tuỳ chọn): thêm điều kiện, ví dụ chỉ cho phép khi request đi qua một VPC endpoint ({{aws:SourceVpce}}) hoặc khi object được mã hoá bằng KMS.

| Loại policy | Gắn vào đâu | Có field Principal? | Ví dụ |
|---|---|---|---|
| Identity-based | user, group, role | Không (principal chính là nơi được gắn) | role của service order được đọc bucket hoá đơn |
| Resource-based | chính tài nguyên | **Có**, ghi rõ ai được phép | S3 bucket policy, SQS queue policy, KMS key policy, Lambda resource policy |
| Permissions boundary | user/role | Không | trần quyền tối đa mà role đó có thể có |
| SCP (Organizations) | account / OU | Không | cấm mọi account dev tạo tài nguyên ngoài region ap-southeast-1 |

### Thuật toán đánh giá: deny thắng tất cả
Rút gọn cho trường hợp trong cùng một account:

~~~text
request (principal, action, resource)
        |
        v
 có statement Deny nào khớp?  --yes-->  EXPLICIT DENY (dừng, không gì cứu được)
        | no
        v
 có statement Allow nào khớp? --yes-->  ALLOW
        | no
        v
 IMPLICIT DENY (mặc định là cấm)
~~~

- Mặc định **mọi thứ bị cấm** (implicit deny). Bạn phải Allow thì mới làm được.
- Một **explicit Deny** ở bất kỳ policy nào (identity, resource, boundary, SCP) thắng mọi Allow. Đây là cách làm "hàng rào": SCP cấm tắt CloudTrail, bucket policy cấm mọi request không dùng TLS.
- SCP và permissions boundary **không cấp quyền**, chỉ giới hạn trần: quyền thực tế là phần giao nhau.
- **Cross-account**: role ở account A muốn đọc bucket ở account B thì cần **cả hai phía** Allow: identity policy ở A cho phép, và bucket policy ở B ghi Principal là role đó. Trong cùng một account, thường chỉ cần một trong hai phía Allow (KMS key policy là ngoại lệ quan trọng: key policy phải cho phép).

### Least privilege trong thực tế
Least privilege nghĩa là chỉ cấp **đúng action, đúng resource** mà code cần. Cách làm thực tế:
- Bắt đầu từ danh sách lời gọi SDK trong code: {{s3Client.getObject}} → {{s3:GetObject}} trên prefix cụ thể, không phải {{s3:*}} trên {{*}}.
- Mỗi service một role riêng: service order và service report không dùng chung role, để một service bị lộ không kéo theo cả hệ thống.
- Dùng **IAM Access Analyzer** để tìm resource bị chia sẻ ra ngoài và gợi ý policy dựa trên CloudTrail (quyền nào thực sự được dùng).

### Credentials dài hạn và credentials tạm thời
| | Access key dài hạn (IAM user) | Credentials tạm thời (STS) |
|---|---|---|
| Dạng | Access key ID bắt đầu bằng {{AKIA}} + secret | Key ID bắt đầu bằng {{ASIA}} + secret + **session token** |
| Hết hạn | Không bao giờ, trừ khi bạn tự xoá/rotate | Có, thường 15 phút đến vài giờ (AssumeRole mặc định 1 giờ) |
| Rủi ro khi lộ | Kẻ tấn công dùng mãi cho đến khi bị phát hiện | Tự hết hạn; thiệt hại bị giới hạn theo thời gian |
| Ai cấp | Bạn tạo trong console rồi dán vào config | STS cấp khi principal "assume" role |

Long-lived key hay bị lộ qua: commit nhầm {{application.yml}} lên GitHub (bot quét repo công khai rất nhanh), log in ra biến môi trường, image Docker chứa file {{~/.aws/credentials}}. Vì vậy với workload chạy **trên AWS**, quy tắc là **không bao giờ dùng access key**: gắn role cho compute, SDK tự lấy credentials tạm thời và tự làm mới trước khi hết hạn.

### Role cho từng loại compute
- **EC2**: gắn **instance profile** (vỏ bọc của role). SDK lấy credentials qua Instance Metadata Service; hãy bắt buộc **IMDSv2** (phải lấy session token bằng PUT trước) để giảm rủi ro SSRF đọc trộm credentials.
- **ECS (Fargate hoặc EC2)**: có hai role khác nhau. **Task role** là quyền của **code của bạn** (đọc S3, gửi SQS). **Task execution role** là quyền của **ECS agent** để pull image từ ECR, ghi log CloudWatch, lấy secret để inject vào biến môi trường. Gán nhầm quyền ứng dụng vào execution role là lỗi kinh điển: container khởi động được nhưng code gọi S3 bị AccessDenied.
- **EKS**: hai cách. **IRSA** (IAM Roles for Service Accounts): cluster có OIDC provider, ServiceAccount được annotate {{eks.amazonaws.com/role-arn}}, webhook inject biến {{AWS_ROLE_ARN}} và {{AWS_WEB_IDENTITY_TOKEN_FILE}}; SDK gọi {{AssumeRoleWithWebIdentity}}. **EKS Pod Identity** (mới hơn): cài add-on Pod Identity Agent, tạo association giữa ServiceAccount và role qua EKS API, không cần cấu hình OIDC provider; SDK lấy credentials qua container credentials endpoint. Cả hai đều cho quyền **theo pod**, không phải theo node.
- **Lambda**: execution role, credentials được đưa sẵn vào biến môi trường của môi trường chạy.

### Default credentials provider chain của AWS SDK for Java v2
Khi bạn tạo client mà **không** chỉ định credentials, SDK v2 dùng {{DefaultCredentialsProvider}}, thử lần lượt:

1. Java system properties: {{aws.accessKeyId}}, {{aws.secretAccessKey}}, {{aws.sessionToken}}.
2. Biến môi trường: {{AWS_ACCESS_KEY_ID}}, {{AWS_SECRET_ACCESS_KEY}}, {{AWS_SESSION_TOKEN}}.
3. Web identity token (IRSA): {{AWS_WEB_IDENTITY_TOKEN_FILE}} + {{AWS_ROLE_ARN}} (cần module {{sts}} trên classpath).
4. File chia sẻ {{~/.aws/credentials}} và {{~/.aws/config}} (profile, kể cả SSO, theo {{AWS_PROFILE}}).
5. Container credentials (ECS task role, EKS Pod Identity).
6. Instance profile của EC2 qua IMDS.

~~~java
// Production: KHÔNG truyền credentials, để chain tự tìm role của task/pod/instance
S3Client s3 = S3Client.builder()
        .region(Region.AP_SOUTHEAST_1)
        .build();                         // tạo một lần, dùng chung (thread-safe), đừng tạo mỗi request

// Cần quyền ở account khác: assume role, provider tự refresh trước khi hết hạn
StsClient sts = StsClient.builder().region(Region.AP_SOUTHEAST_1).build();
StsAssumeRoleCredentialsProvider crossAccount = StsAssumeRoleCredentialsProvider.builder()
        .stsClient(sts)
        .refreshRequest(AssumeRoleRequest.builder()
                .roleArn("arn:aws:iam::222233334444:role/report-reader")
                .roleSessionName("order-service")   // hiện trong CloudTrail, giúp truy vết
                .build())
        .build();
S3Client reportS3 = S3Client.builder().region(Region.AP_SOUTHEAST_1)
        .credentialsProvider(crossAccount).build();
~~~

> Thứ tự chain có hệ quả thật: nếu ai đó để quên {{AWS_ACCESS_KEY_ID}} trong biến môi trường của container, SDK sẽ dùng key đó **trước** task role, và bạn sẽ mất nhiều giờ tự hỏi vì sao quyền của role không có tác dụng.

Dưới máy dev, dùng {{aws sso login}} với profile thay vì tạo access key cá nhân. Trên CI (GitHub Actions…), dùng OIDC federation để assume role, cũng không cần secret dài hạn.

### Liên hệ phỏng vấn
Câu hay gặp: "IAM role khác IAM user thế nào?", "App trên ECS lấy credentials từ đâu?", "Explicit deny và implicit deny khác nhau ra sao?", "Làm sao cho service ở account A đọc bucket ở account B?". Trả lời tốt cần nêu được: role + STS = credentials tạm thời tự rotate; task role khác execution role; thứ tự đánh giá deny > allow > implicit deny; cross-account cần cả hai phía cho phép. Bài tập dưới đây cho bạn tự viết bộ đánh giá policy để nắm chắc thứ tự này.

> Senior tip: Khi debug AccessDenied, đọc kỹ thông báo lỗi (nhiều service giờ ghi rõ loại policy nào chặn: SCP, boundary, resource policy), rồi kiểm tra principal thật bằng {{aws sts get-caller-identity}} ngay trong container. Hơn một nửa số lần, nguyên nhân là code đang chạy bằng một principal khác với bạn nghĩ.`,
  exercises: [
    {
      title: 'Viết bộ đánh giá IAM policy (explicit deny > allow > implicit deny)',
      prompt: `Mô phỏng phần lõi của IAM policy evaluation trong một account.

Một {{Statement}} gồm {{effect}} ({{"Allow"}} hoặc {{"Deny"}}), danh sách pattern {{actions}} và danh sách pattern {{resources}}. Một statement **khớp** request khi có ít nhất một pattern action khớp action **và** ít nhất một pattern resource khớp resource.

Hãy cài đặt:
1. {{wildcardMatch(pattern, value)}}: {{*}} khớp chuỗi bất kỳ (kể cả rỗng), {{?}} khớp đúng 1 ký tự, ký tự khác phải giống hệt (phân biệt hoa thường).
2. {{evaluate(statements, action, resource)}} trả về:
  ▸ {{"EXPLICIT_DENY"}} nếu có statement Deny khớp (bất kể thứ tự statement),
  ▸ ngược lại {{"ALLOW"}} nếu có statement Allow khớp,
  ▸ ngược lại {{"IMPLICIT_DENY"}}.

So khớp action **không phân biệt hoa thường** (giống IAM); so khớp resource phân biệt hoa thường.`,
      starter: `record Statement(String effect, List<String> actions, List<String> resources) {}

class PolicyEvaluator {
    // '*' = chuỗi bất kỳ (kể cả rỗng), '?' = đúng 1 ký tự
    static boolean wildcardMatch(String pattern, String value) {
        throw new UnsupportedOperationException("TODO");
    }

    // "EXPLICIT_DENY" | "ALLOW" | "IMPLICIT_DENY"
    static String evaluate(List<Statement> statements, String action, String resource) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void eq(String name, Object expected, Supplier<Object> actual) {
        total++;
        try {
            Object got = actual.get();
            if (Objects.equals(expected, got)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": mong đợi " + expected + ", nhận " + got);
        } catch (RuntimeException e) {
            System.out.println("FAIL " + name + ": ném " + e);
        }
    }
    static Statement st(String effect, List<String> a, List<String> r) { return new Statement(effect, a, r); }
    public static void main(String[] args) {
        eq("prefix wildcard", true, () -> PolicyEvaluator.wildcardMatch("s3:Get*", "s3:GetObject"));
        eq("star matches empty", true, () -> PolicyEvaluator.wildcardMatch("abc*", "abc"));
        eq("question mark one char", true, () -> PolicyEvaluator.wildcardMatch("arn:aws:s3:::logs-202?", "arn:aws:s3:::logs-2026"));
        eq("question mark not two chars", false, () -> PolicyEvaluator.wildcardMatch("arn:aws:s3:::logs-202?", "arn:aws:s3:::logs-20261"));
        eq("star in middle", true, () -> PolicyEvaluator.wildcardMatch("arn:aws:sqs:*:111122223333:orders-*", "arn:aws:sqs:ap-southeast-1:111122223333:orders-dlq"));

        List<Statement> read = List.of(
            st("Allow", List.of("s3:GetObject"), List.of("arn:aws:s3:::acme-invoices/*")));
        eq("no statements is implicit deny", "IMPLICIT_DENY", () -> PolicyEvaluator.evaluate(List.of(), "s3:GetObject", "arn:aws:s3:::x/y"));
        eq("allow object read", "ALLOW", () -> PolicyEvaluator.evaluate(read, "s3:GetObject", "arn:aws:s3:::acme-invoices/2026/10/inv-1.pdf"));
        eq("action not granted", "IMPLICIT_DENY", () -> PolicyEvaluator.evaluate(read, "s3:PutObject", "arn:aws:s3:::acme-invoices/a.pdf"));
        eq("bucket ARN is not object ARN", "IMPLICIT_DENY", () -> PolicyEvaluator.evaluate(read, "s3:GetObject", "arn:aws:s3:::acme-invoices"));
        eq("action is case-insensitive", "ALLOW", () -> PolicyEvaluator.evaluate(read, "S3:getobject", "arn:aws:s3:::acme-invoices/a.pdf"));
        eq("resource is case-sensitive", "IMPLICIT_DENY", () -> PolicyEvaluator.evaluate(read, "s3:GetObject", "arn:aws:s3:::ACME-INVOICES/a.pdf"));

        Statement allowAll = st("Allow", List.of("s3:*"), List.of("*"));
        Statement denyDelete = st("Deny", List.of("s3:DeleteObject", "s3:DeleteBucket"), List.of("arn:aws:s3:::acme-invoices", "arn:aws:s3:::acme-invoices/*"));
        eq("explicit deny beats allow", "EXPLICIT_DENY", () -> PolicyEvaluator.evaluate(List.of(allowAll, denyDelete), "s3:DeleteObject", "arn:aws:s3:::acme-invoices/a.pdf"));
        eq("deny wins regardless of order", "EXPLICIT_DENY", () -> PolicyEvaluator.evaluate(List.of(denyDelete, allowAll), "s3:DeleteBucket", "arn:aws:s3:::acme-invoices"));
        eq("deny does not block other actions", "ALLOW", () -> PolicyEvaluator.evaluate(List.of(allowAll, denyDelete), "s3:GetObject", "arn:aws:s3:::acme-invoices/a.pdf"));
        eq("deny only on matching resource", "ALLOW", () -> PolicyEvaluator.evaluate(List.of(allowAll, denyDelete), "s3:DeleteObject", "arn:aws:s3:::tmp-bucket/a.pdf"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Statement(String effect, List<String> actions, List<String> resources) {}

class PolicyEvaluator {
    // Greedy với backtrack về dấu '*' gần nhất: O(n*m) worst case, đủ cho ARN
    static boolean wildcardMatch(String pattern, String value) {
        int p = 0, v = 0, star = -1, mark = 0;
        while (v < value.length()) {
            if (p < pattern.length() && (pattern.charAt(p) == '?' || pattern.charAt(p) == value.charAt(v))) {
                p++; v++;
            } else if (p < pattern.length() && pattern.charAt(p) == '*') {
                star = p++;      // nhớ vị trí '*', thử cho nó khớp chuỗi rỗng trước
                mark = v;
            } else if (star >= 0) {
                p = star + 1;    // quay lại: cho '*' nuốt thêm 1 ký tự
                v = ++mark;
            } else {
                return false;
            }
        }
        while (p < pattern.length() && pattern.charAt(p) == '*') p++;
        return p == pattern.length();
    }

    static boolean matches(Statement s, String action, String resource) {
        String a = action.toLowerCase(Locale.ROOT);
        boolean actionOk = s.actions().stream().anyMatch(x -> wildcardMatch(x.toLowerCase(Locale.ROOT), a));
        boolean resourceOk = s.resources().stream().anyMatch(x -> wildcardMatch(x, resource));
        return actionOk && resourceOk;
    }

    static String evaluate(List<Statement> statements, String action, String resource) {
        boolean allowed = false;
        for (Statement s : statements) {
            if (!matches(s, action, resource)) continue;
            if ("Deny".equals(s.effect())) return "EXPLICIT_DENY";   // deny thắng ngay
            if ("Allow".equals(s.effect())) allowed = true;          // allow phải chờ xét hết các deny
        }
        return allowed ? "ALLOW" : "IMPLICIT_DENY";
    }
}`,
      hints: [
        'Tách làm hai bước: một hàm {{matches(statement, action, resource)}} và một vòng lặp đánh giá.',
        'Khi gặp Allow khớp, **chưa được return ngay**: có thể một statement Deny phía sau cũng khớp. Chỉ Deny mới được return sớm.',
        'Với wildcard, cách đơn giản: hai con trỏ trên pattern và value, nhớ vị trí {{*}} cuối cùng; khi lệch thì quay lại cho {{*}} nuốt thêm một ký tự.',
      ],
      explain: `### Lời giải
- {{evaluate}} duyệt mọi statement. Gặp **Deny khớp** thì trả về ngay, vì explicit deny không thể bị ghi đè. Gặp **Allow khớp** chỉ ghi nhớ {{allowed = true}} rồi duyệt tiếp, vì phía sau vẫn có thể có Deny. Hết vòng mà không có gì khớp thì là implicit deny.
- {{wildcardMatch}} dùng thuật toán hai con trỏ kinh điển: {{?}} và ký tự giống nhau thì cùng tiến; gặp {{*}} thì ghi nhớ vị trí và thử cho nó khớp rỗng; khi lệch mà đã từng gặp {{*}} thì quay lại và cho {{*}} nuốt thêm một ký tự.

### Lỗi hay gặp
- Return {{"ALLOW"}} ngay khi gặp Allow đầu tiên: test "deny wins regardless of order" sẽ fail. Đây đúng là hiểu lầm nhiều người có về IAM ("statement trên cùng thắng"); IAM **không** có thứ tự ưu tiên theo vị trí.
- Coi {{arn:aws:s3:::acme-invoices/*}} khớp cả bucket ARN: không đúng, {{/*}} bắt buộc phải có dấu {{/}}. Ngoài đời đây là lý do {{s3:ListBucket}} bị từ chối dù "đã cấp s3 rồi".
- Dùng {{String.matches}} với regex tự ghép mà quên escape dấu {{.}} hay {{:}}: pattern có ký tự đặc biệt regex sẽ khớp sai.

IAM thật còn có Condition, NotAction/NotResource, policy variables, SCP, permissions boundary, session policy và luật cross-account; nhưng lõi "deny thắng, mặc định cấm" vẫn y hệt bài này.`,
    },
  ],
  check: [
    {
      q: 'Role của service có identity policy Allow {{s3:*}} trên {{*}}. Bucket policy của bucket {{audit-logs}} có statement Deny {{s3:DeleteObject}} cho mọi principal. Service gọi DeleteObject trên một object trong {{audit-logs}}. Kết quả?',
      options: ['Thành công vì identity policy cho phép s3:*', 'Bị từ chối vì explicit deny trong bucket policy thắng mọi Allow', 'Thành công vì identity policy được ưu tiên hơn resource policy', 'Tuỳ thứ tự statement trong hai policy'],
      answer: 1,
      explain: `Explicit Deny ở **bất kỳ** policy nào được đánh giá đều thắng mọi Allow, nên request bị từ chối. "Thành công vì s3:*" bỏ qua bước kiểm tra Deny; IAM không ưu tiên identity policy hơn resource policy; và thứ tự statement không có ý nghĩa gì trong IAM.`,
    },
    {
      q: 'Container trên ECS Fargate khởi động bình thường, nhưng code gọi {{s3Client.getObject}} nhận AccessDenied. Policy đọc S3 đã được gắn vào task execution role. Vấn đề là gì?',
      options: ['Fargate không hỗ trợ IAM role', 'Cần thêm access key vào biến môi trường', 'Quyền của code ứng dụng phải nằm trong task role; execution role chỉ dùng cho ECS agent (pull image, ghi log, lấy secret)', 'Phải bật IMDSv2 trên Fargate'],
      answer: 2,
      explain: `ECS tách hai role: **task role** là danh tính của code trong container, **task execution role** là danh tính của ECS agent. Gắn quyền S3 vào execution role thì code không có quyền đó. Fargate hỗ trợ role đầy đủ; thêm access key là phản mẫu (credentials dài hạn); IMDS là cơ chế của EC2, task trên Fargate lấy credentials qua container credentials endpoint.`,
    },
    {
      q: 'Trong container có cả biến môi trường {{AWS_ACCESS_KEY_ID}}/{{AWS_SECRET_ACCESS_KEY}} (để quên từ lúc debug) và task role. Client SDK v2 tạo không chỉ định credentials sẽ dùng gì?',
      options: ['Task role, vì role luôn được ưu tiên', 'Access key trong biến môi trường, vì environment variables đứng trước container credentials trong default chain', 'Báo lỗi vì có hai nguồn credentials', 'Ngẫu nhiên tuỳ lần khởi động'],
      answer: 1,
      explain: `{{DefaultCredentialsProvider}} thử theo thứ tự: system properties, **biến môi trường**, web identity, file profile, container credentials, instance profile; nguồn đầu tiên có credentials sẽ được dùng. Không có quy tắc "role luôn ưu tiên"; SDK không báo lỗi khi có nhiều nguồn; thứ tự là cố định, không ngẫu nhiên. Vì vậy cần xoá biến môi trường thừa.`,
    },
  ],
  related: ['aws-004', 'aws-013', 'aws-021'],
  tags: ['IAM', 'STS', 'IRSA', 'EKS Pod Identity', 'credentials provider chain', 'least privilege'],
},
{
  id: 'lesson-aws-002',
  track: 'aws',
  order: 2,
  title: 'S3 cho backend dev: consistency, multipart upload, presigned URL, storage class và mã hoá',
  level: 'mid',
  minutes: 40,
  goals: [
    'Hiểu mô hình dữ liệu và consistency của S3 (strong read-after-write từ 12/2020) và giới hạn của nó',
    'Thiết kế upload/download file lớn bằng presigned URL và multipart upload, không để file đi qua app server',
    'Chọn storage class, lifecycle rule và kiểu mã hoá (SSE-S3, SSE-KMS) phù hợp',
    'Tránh các lỗi production: bucket public, chi phí LIST, upload dở dang, 503 SlowDown',
  ],
  body: `### S3 là gì, nhìn bằng mắt backend dev
S3 là **object storage**: không phải file system, không phải database. Mỗi **object** gồm key (chuỗi, ví dụ {{invoices/2026/10/inv-1.pdf}}), dữ liệu (bytes) và metadata, nằm trong một **bucket** thuộc một region. Dấu {{/}} trong key chỉ là ký tự bình thường: "thư mục" chỉ là cách console hiển thị theo **prefix**.

Thao tác cơ bản qua HTTP: {{PUT}} (ghi đè **cả** object, không sửa được một phần), {{GET}} (có thể đọc theo byte range), {{DELETE}}, {{LIST}} (liệt kê theo prefix, tối đa 1.000 key mỗi trang).

### Consistency: strong read-after-write
Từ tháng 12/2020, S3 có **strong read-after-write consistency** cho mọi PUT, DELETE và LIST, không thêm phí:
- PUT xong object mới hoặc ghi đè object cũ, GET ngay sau đó **luôn** thấy bản mới.
- DELETE xong, GET trả 404 ngay; LIST phản ánh ngay object vừa thêm/xoá.

Những điều consistency này **không** cho bạn:
- **Không có lock**: hai request PUT cùng key gần như đồng thời thì bản đến sau thắng (last writer wins). Muốn "chỉ ghi nếu chưa tồn tại" hoặc "chỉ ghi nếu chưa ai sửa" thì dùng **conditional write** ({{If-None-Match}}, {{If-Match}} theo ETag) mà S3 hỗ trợ từ 2024, hoặc giữ trạng thái trong database.
- Thay đổi **cấu hình bucket** (bucket policy, lifecycle…) vẫn có độ trễ lan truyền, không tính vào cam kết trên.

### Upload/download đúng cách: đừng cho file chạy qua app
Phản mẫu phổ biến: client upload file 200 MB lên Spring Boot, app đọc stream rồi PUT lên S3. App tốn băng thông, RAM, thread, và timeout của load balancer trở thành giới hạn kích thước file.

~~~text
Cách đúng (presigned URL):
 client --(1) xin URL upload--> Spring Boot (kiểm tra quyền, sinh key)
 client <--(2) presigned PUT URL (hết hạn sau 10 phút)--
 client --(3) PUT file trực tiếp--> S3
 S3 --(4) event ObjectCreated--> SQS/EventBridge --> worker xử lý (scan, thumbnail)
~~~

**Presigned URL** là URL có sẵn chữ ký SigV4 tạo bằng credentials của **app**. Ai cầm URL thì làm được đúng một thao tác (GET hoặc PUT) trên đúng một key, cho tới khi hết hạn. Việc ký diễn ra **hoàn toàn ở phía client SDK**, không gọi mạng tới AWS.

~~~java
try (S3Presigner presigner = S3Presigner.create()) {        // tạo 1 lần, dùng lại trong thực tế
    GetObjectRequest get = GetObjectRequest.builder()
            .bucket("acme-invoices").key("2026/10/inv-1.pdf").build();
    GetObjectPresignRequest req = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(10))       // càng ngắn càng an toàn
            .getObjectRequest(get).build();
    PresignedGetObjectRequest presigned = presigner.presignGetObject(req);
    String url = presigned.url().toString();                 // trả cho client, client GET trực tiếp S3
}
~~~

Ba điểm phải nhớ:
- Quyền của URL **bằng quyền của credentials đã ký**. Role của app không có {{s3:GetObject}} thì URL ký ra cũng bị 403.
- Thời hạn tối đa của URL ký bằng SigV4 là **7 ngày**. Nếu ký bằng credentials tạm thời (role), URL còn **hết hạn sớm hơn khi session của credentials hết hạn**, dù bạn đặt duration dài hơn.
- URL bị lộ (log, referrer, chat) thì ai cũng dùng được tới khi hết hạn: đặt thời hạn ngắn, không log nguyên URL.

### Multipart upload cho file lớn
Một lần PUT tối đa **5 GB**. Với file lớn (AWS khuyên cân nhắc từ khoảng 100 MB), dùng **multipart upload**:
1. {{CreateMultipartUpload}} → nhận {{uploadId}}.
2. {{UploadPart}} từng phần (mỗi phần từ **5 MiB** đến 5 GiB, trừ phần cuối; tối đa **10.000 phần**), có thể **song song**, phần nào lỗi thì upload lại riêng phần đó.
3. {{CompleteMultipartUpload}} với danh sách số phần + ETag → S3 ghép thành object.

Mỗi part cũng có thể dùng presigned URL để client tự upload. Trong Java, {{S3TransferManager}} (dựa trên {{S3AsyncClient}}) tự chia part, chạy song song và retry.

> Upload dở dang (không complete, không abort) vẫn **tính tiền lưu trữ** cho các part đã upload và không hiện khi LIST object. Luôn có lifecycle rule {{AbortIncompleteMultipartUpload}} (ví dụ sau 7 ngày) trên bucket nhận upload.

### Storage class và lifecycle
| Class | Dùng khi | Lưu ý |
|---|---|---|
| S3 Standard | dữ liệu đọc thường xuyên | mặc định |
| Intelligent-Tiering | không đoán được tần suất truy cập | tự chuyển tầng, có phí giám sát nhỏ theo số object |
| Standard-IA / One Zone-IA | đọc ít nhưng cần lấy ngay | phí lấy dữ liệu theo GB, tính tối thiểu 30 ngày; One Zone chỉ 1 AZ |
| Glacier Instant Retrieval | lưu trữ lâu, thỉnh thoảng đọc, cần mili giây | tối thiểu 90 ngày |
| Glacier Flexible Retrieval / Deep Archive | lưu trữ tuân thủ, gần như không đọc | phải restore trước khi đọc (phút tới giờ); tối thiểu 90 / 180 ngày |

**Lifecycle rule** tự động hoá: ví dụ hoá đơn sau 30 ngày chuyển Standard-IA, sau 365 ngày chuyển Glacier Deep Archive, sau 10 năm xoá. Bật **versioning** để chống xoá nhầm/ghi đè nhầm, kèm rule xoá noncurrent version sau N ngày để chi phí không phình mãi.

### Mã hoá và chặn public
- Từ 01/2023 mọi object mới đều được mã hoá mặc định bằng **SSE-S3** (key do S3 quản lý).
- **SSE-KMS**: dùng KMS key, có audit trong CloudTrail và tách quyền: người đọc cần cả {{s3:GetObject}} **và** {{kms:Decrypt}} trên key. Mỗi request mã hoá/giải mã gọi KMS, có thể chạm quota KMS; bật **S3 Bucket Key** để giảm mạnh số lời gọi KMS (và chi phí).
- **Block Public Access** bật mặc định cho bucket mới, và ACL bị tắt mặc định (Object Ownership: bucket owner enforced). Muốn phát file công khai thì đặt **CloudFront** phía trước với Origin Access Control, không mở bucket public.

### Pitfall về hiệu năng và chi phí
- **"Hot prefix" là chuyện cũ**: S3 hỗ trợ ít nhất 3.500 PUT/COPY/POST/DELETE và 5.500 GET/HEAD mỗi giây **cho mỗi prefix** và tự chia partition khi tải tăng. Không cần thêm hash ngẫu nhiên vào đầu key như lời khuyên trước 2018. Khi tải tăng quá nhanh vẫn có thể gặp **503 SlowDown**: SDK retry với backoff, và bạn phân tán tải qua nhiều prefix nếu cần.
- **LIST đắt và chậm**: request LIST tính giá ngang PUT, mỗi trang tối đa 1.000 key. Đừng LIST để "tìm file theo điều kiện"; lưu metadata (key, owner, ngày) trong database, hoặc dùng S3 Inventory cho thống kê định kỳ.
- **Data transfer**: tải ra Internet tính tiền theo GB; truy cập S3 từ private subnet qua NAT Gateway cũng tốn phí xử lý theo GB. Dùng **Gateway VPC Endpoint** cho S3 (không tính phí) để đi đường riêng.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Thiết kế upload file 2 GB từ mobile", "Presigned URL bảo mật thế nào?", "S3 có eventually consistent không?", "Giảm chi phí lưu trữ log 3 năm". Câu trả lời tốt: presigned URL + multipart, thời hạn ngắn, quyền tối thiểu cho role ký; strong consistency từ 2020 nhưng không có lock; lifecycle + storage class; SSE-KMS với Bucket Key; Block Public Access + CloudFront. Bài tập dưới đây cho bạn tự cài cơ chế cốt lõi của presigned URL: HMAC + thời hạn.

> Senior tip: Với hệ có nhiều file nhỏ (vài KB), chi phí request và chi phí tối thiểu theo object của các class IA/Glacier có thể lớn hơn tiền lưu trữ. Gộp file nhỏ (ví dụ log theo giờ thành một file nén) trước khi chuyển tầng, và xem S3 Storage Lens để biết tiền thật đang đi vào đâu.`,
  exercises: [
    {
      title: 'Tự viết presigned URL: ký HMAC-SHA256 có thời hạn và kiểm tra chữ ký',
      prompt: `Mô phỏng cơ chế presigned URL (bản đơn giản hoá của SigV4) bằng {{javax.crypto.Mac}}.

{{UrlSigner}} nhận secret key và một **clock giả** ({{LongSupplier}} trả về epoch giây) để test xác định.

1. {{signature(method, path, expires)}}: trả về chuỗi hex chữ thường của **HMAC-SHA256**(key, {{method + "|" + path + "|" + expires}}) (dùng UTF-8).
2. {{presign(method, path, ttlSeconds)}}: nếu {{ttlSeconds <= 0}} hoặc {{> MAX_TTL}} (604800 giây = 7 ngày) thì ném {{IllegalArgumentException}}. Ngược lại {{expires = now + ttlSeconds}} và trả về {{path + "?expires=" + expires + "&sig=" + signature}}.
3. {{verify(method, url)}} trả về:
  ▸ {{"MALFORMED"}} nếu không có {{?}}, thiếu {{expires}} hoặc {{sig}}, hoặc {{expires}} không phải số;
  ▸ {{"BAD_SIGNATURE"}} nếu chữ ký không khớp (so sánh **constant-time** bằng {{MessageDigest.isEqual}});
  ▸ {{"EXPIRED"}} nếu chữ ký đúng nhưng {{now > expires}};
  ▸ {{"OK"}} nếu còn hạn (tại đúng giây {{expires}} vẫn OK).`,
      starter: `import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;

class UrlSigner {
    static final long MAX_TTL = 604800;          // 7 ngày, giống giới hạn presigned URL SigV4
    private final byte[] key;
    private final LongSupplier clock;             // epoch seconds, inject để test không phụ thuộc giờ thật

    UrlSigner(byte[] key, LongSupplier clock) {
        this.key = key.clone();
        this.clock = clock;
    }

    String signature(String method, String path, long expires) {
        throw new UnsupportedOperationException("TODO");
    }

    String presign(String method, String path, long ttlSeconds) {
        throw new UnsupportedOperationException("TODO");
    }

    String verify(String method, String url) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void eq(String name, Object expected, Supplier<Object> actual) {
        total++;
        try {
            Object got = actual.get();
            if (Objects.equals(expected, got)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": mong đợi " + expected + ", nhận " + got);
        } catch (RuntimeException e) {
            System.out.println("FAIL " + name + ": ném " + e);
        }
    }
    static String catchIae(Supplier<Object> s) {
        try { s.get(); return "no exception"; } catch (IllegalArgumentException e) { return "IAE"; }
    }
    public static void main(String[] args) {
        long[] now = { 1_700_000_000L };
        LongSupplier clock = () -> now[0];
        byte[] key = "demo-secret-key-123".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        UrlSigner signer = new UrlSigner(key, clock);
        UrlSigner otherKey = new UrlSigner("another-key".getBytes(java.nio.charset.StandardCharsets.UTF_8), clock);

        eq("signature is 64 lowercase hex chars", true, () -> signer.signature("GET", "/a", 1L).matches("[0-9a-f]{64}"));
        eq("signature is deterministic", true, () -> signer.signature("GET", "/a", 5L).equals(signer.signature("GET", "/a", 5L)));
        eq("signature depends on method", false, () -> signer.signature("GET", "/a", 5L).equals(signer.signature("PUT", "/a", 5L)));

        String[] url = new String[1];
        eq("presign format", true, () -> {
            url[0] = signer.presign("GET", "/invoices/inv-1.pdf", 600);
            return url[0].startsWith("/invoices/inv-1.pdf?expires=1700000600&sig=") && url[0].length() == "/invoices/inv-1.pdf?expires=1700000600&sig=".length() + 64;
        });
        eq("fresh url is OK", "OK", () -> signer.verify("GET", url[0]));
        eq("tampered path", "BAD_SIGNATURE", () -> signer.verify("GET", url[0].replace("inv-1", "inv-2")));
        eq("different method", "BAD_SIGNATURE", () -> signer.verify("PUT", url[0]));
        eq("extended expires", "BAD_SIGNATURE", () -> signer.verify("GET", url[0].replace("expires=1700000600", "expires=1800000600")));
        eq("signed by another key", "BAD_SIGNATURE", () -> otherKey.verify("GET", url[0]));
        eq("missing sig", "MALFORMED", () -> signer.verify("GET", "/invoices/inv-1.pdf?expires=1700000600"));
        eq("no query string", "MALFORMED", () -> signer.verify("GET", "/invoices/inv-1.pdf"));
        eq("expires not a number", "MALFORMED", () -> signer.verify("GET", "/x?expires=abc&sig=00"));
        eq("still OK at exact expiry", "OK", () -> { now[0] = 1_700_000_600L; return signer.verify("GET", url[0]); });
        eq("expired one second later", "EXPIRED", () -> { now[0] = 1_700_000_601L; return signer.verify("GET", url[0]); });
        eq("ttl over 7 days rejected", "IAE", () -> catchIae(() -> signer.presign("GET", "/a", 604801)));
        eq("ttl zero rejected", "IAE", () -> catchIae(() -> signer.presign("GET", "/a", 0)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;

class UrlSigner {
    static final long MAX_TTL = 604800;
    private final byte[] key;
    private final LongSupplier clock;

    UrlSigner(byte[] key, LongSupplier clock) {
        this.key = key.clone();
        this.clock = clock;
    }

    String signature(String method, String path, long expires) {
        String stringToSign = method + "|" + path + "|" + expires;   // mọi thứ được ký đều nằm ở đây
        try {
            Mac mac = Mac.getInstance("HmacSHA256");                    // Mac không thread-safe: tạo mới mỗi lần
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(stringToSign.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    String presign(String method, String path, long ttlSeconds) {
        if (ttlSeconds <= 0 || ttlSeconds > MAX_TTL) throw new IllegalArgumentException("ttl ngoài 1.." + MAX_TTL);
        long expires = clock.getAsLong() + ttlSeconds;
        return path + "?expires=" + expires + "&sig=" + signature(method, path, expires);
    }

    String verify(String method, String url) {
        int q = url.indexOf('?');
        if (q < 0) return "MALFORMED";
        String path = url.substring(0, q);
        Long expires = null;
        String sig = null;
        for (String kv : url.substring(q + 1).split("&")) {
            int eq = kv.indexOf('=');
            if (eq < 0) return "MALFORMED";
            String k = kv.substring(0, eq), v = kv.substring(eq + 1);
            if (k.equals("expires")) {
                try { expires = Long.parseLong(v); } catch (NumberFormatException e) { return "MALFORMED"; }
            } else if (k.equals("sig")) {
                sig = v;
            }
        }
        if (expires == null || sig == null) return "MALFORMED";
        byte[] expected = signature(method, path, expires).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, sig.getBytes(StandardCharsets.UTF_8))) return "BAD_SIGNATURE";
        if (clock.getAsLong() > expires) return "EXPIRED";        // expires nằm TRONG phần được ký nên không sửa được
        return "OK";
    }
}`,
      hints: [
        'HMAC trong JDK: {{Mac.getInstance("HmacSHA256")}}, {{mac.init(new SecretKeySpec(key, "HmacSHA256"))}}, rồi {{mac.doFinal(bytes)}}. Đổi sang hex bằng {{HexFormat.of().formatHex(...)}} (Java 17).',
        'Trong {{verify}}, tách path và query tại dấu {{?}} đầu tiên, rồi tách từng cặp {{k=v}} theo {{&}}. Tính lại chữ ký từ method, path và expires đọc được rồi so với {{sig}}.',
        'Kiểm tra chữ ký **trước**, hạn dùng **sau**: nếu kẻ tấn công sửa {{expires}} để kéo dài, chữ ký sẽ không khớp vì {{expires}} là một phần của chuỗi được ký.',
      ],
      explain: `### Vì sao cơ chế này an toàn
Server không lưu gì về URL đã phát ra. Mọi thông tin cần kiểm tra (method, path, expires) đều được **đưa vào chuỗi được ký**. Không có secret key thì không thể tạo chữ ký hợp lệ cho một tổ hợp khác, nên sửa path, đổi GET thành PUT hay kéo dài expires đều làm chữ ký sai. Đây đúng là ý tưởng của SigV4: chữ ký phủ method, URI, query, header được chọn và thời điểm ký; S3 tính lại và so sánh.

### Chi tiết quan trọng
- **Constant-time compare**: {{MessageDigest.isEqual}} so sánh hết các byte, không dừng ở byte sai đầu tiên, tránh timing attack đoán dần chữ ký. {{String.equals}} dừng sớm nên không nên dùng cho secret.
- **Dấu phân cách không mơ hồ**: chuỗi được ký phải có cách ghép không thể "dịch" phần này sang phần khác. SigV4 dùng canonical request với từng thành phần trên một dòng và được encode chuẩn; bài này dùng {{|}} cho đơn giản.
- **Clock inject**: test chạy xác định, không cần {{Thread.sleep}}. Ngoài đời, lệch giờ giữa máy ký và S3 cũng gây lỗi ({{RequestTimeTooSkewed}}), nên server cần đồng bộ NTP.

### Lỗi hay gặp
- Kiểm tra hạn trước rồi mới kiểm chữ ký: kết quả các test vẫn có thể đúng, nhưng bạn đang tin một giá trị chưa xác thực.
- Đọc {{expires}} bằng {{Integer.parseInt}}: epoch giây vẫn vừa int tới năm 2038, nhưng đó là một bug hẹn giờ; dùng {{long}}.`,
    },
  ],
  check: [
    {
      q: 'Service A PUT object {{reports/r1.json}} thành công, ngay sau đó service B (khác máy) GET cùng key. Theo mô hình consistency hiện tại của S3, B nhận được gì?',
      options: ['Có thể 404 trong vài giây vì S3 eventually consistent', 'Luôn nhận đúng bản vừa PUT (strong read-after-write)', 'Bản cũ nếu B ở AZ khác', 'Chỉ nhận bản mới nếu bật versioning'],
      answer: 1,
      explain: `Từ 12/2020 S3 có strong read-after-write consistency cho PUT, DELETE và LIST, không cần cấu hình. "404 vài giây" là hành vi cũ trước 2020; S3 là dịch vụ cấp region, AZ của client không ảnh hưởng; versioning không liên quan đến consistency.`,
    },
    {
      q: 'App chạy bằng IAM role (credentials tạm thời còn 40 phút) ký presigned GET URL với duration 6 giờ. Điều gì xảy ra?',
      options: ['URL dùng được đủ 6 giờ', 'SDK từ chối ký vì quá 1 giờ', 'URL hết hiệu lực khi credentials tạm thời dùng để ký hết hạn, tức khoảng 40 phút', 'URL dùng được 7 ngày vì đó là mặc định'],
      answer: 2,
      explain: `Presigned URL chỉ hợp lệ khi credentials ký nó còn hợp lệ. Ký bằng credentials tạm thời thì URL chết theo session, dù duration dài hơn. SDK không từ chối duration 6 giờ (giới hạn tối đa là 7 ngày); 7 ngày là mức trần chứ không phải mặc định.`,
    },
    {
      q: 'Hoá đơn bị dồn tiền lưu trữ S3 dù số object LIST được không tăng. Bucket nhận upload multipart từ mobile, mạng hay rớt. Nguyên nhân khả dĩ nhất và cách sửa?',
      options: ['Versioning đang bật; tắt versioning', 'Các multipart upload dở dang vẫn tính tiền cho part đã upload; thêm lifecycle rule AbortIncompleteMultipartUpload', 'S3 tính tiền theo số lần LIST; giảm LIST', 'Object bị nhân bản sang region khác'],
      answer: 1,
      explain: `Part của upload chưa complete/abort vẫn chiếm dung lượng và **không hiện** trong LIST object, khớp triệu chứng. Lifecycle {{AbortIncompleteMultipartUpload}} dọn tự động. Noncurrent version do versioning thì vẫn thấy được khi list version, và tắt versioning không xoá chúng; LIST tính phí request chứ không phải phí lưu trữ; replication chỉ xảy ra khi bạn cấu hình.`,
    },
  ],
  related: ['aws-007', 'aws-013', 'aws-014'],
  tags: ['S3', 'presigned URL', 'multipart upload', 'SSE-KMS', 'lifecycle', 'consistency'],
},
{
  id: 'lesson-aws-003',
  track: 'aws',
  order: 3,
  title: 'SQS, SNS và EventBridge: visibility timeout, DLQ, FIFO và consumer idempotent',
  level: 'senior',
  minutes: 45,
  goals: [
    'Giải thích vòng đời một message SQS: receive, visibility timeout, delete, redelivery',
    'Cấu hình DLQ với maxReceiveCount và viết consumer idempotent cho mô hình at-least-once',
    'Biết khi nào cần FIFO (MessageGroupId, deduplication) và cái giá về throughput',
    'Chọn đúng giữa SQS, SNS fan-out, EventBridge và Kafka/MSK',
  ],
  body: `### Vì sao cần message queue
Khi service order gọi đồng bộ service email, email chậm thì order chậm, email sập thì order lỗi. Đặt một **queue** ở giữa: order chỉ cần gửi message (vài mili giây) rồi trả lời khách; worker email đọc queue theo tốc độ của nó. Queue giúp **tách rời** (decoupling), **hấp thụ đỉnh tải** (buffer) và **retry** khi consumer lỗi.

### Vòng đời một message SQS
SQS **không đẩy** message cho bạn: consumer phải **poll** ({{ReceiveMessage}}). Điểm mấu chốt: nhận message **không xoá** nó.

~~~text
 send --> [VISIBLE] --receive--> [IN-FLIGHT, ẩn trong visibility timeout]
                                     |                     |
                           consumer delete OK     hết timeout mà chưa delete
                                     |                     |
                                  (biến mất)        quay lại [VISIBLE], ReceiveCount + 1
                                                          |
                                         ReceiveCount vượt maxReceiveCount --> DLQ
~~~

1. Consumer gọi {{ReceiveMessage}}, nhận tối đa 10 message, mỗi message có một **receipt handle** (dùng cho lần nhận này).
2. Message trở nên **vô hình** với consumer khác trong **visibility timeout** (mặc định 30 giây, tối đa 12 giờ).
3. Xử lý xong, consumer gọi {{DeleteMessage}} với receipt handle. Nếu consumer crash hoặc xử lý quá lâu, hết timeout message lại hiện ra và **được giao lại**.

~~~java
ReceiveMessageResponse resp = sqs.receiveMessage(ReceiveMessageRequest.builder()
        .queueUrl(queueUrl)
        .maxNumberOfMessages(10)      // tối đa 10 mỗi lần gọi
        .waitTimeSeconds(20)          // long polling: chờ tới 20s nếu queue rỗng
        .visibilityTimeout(60)        // > thời gian xử lý thực tế (p99), có dư
        .build());
for (Message m : resp.messages()) {
    handle(m.body());                 // phải idempotent: message có thể đến 2 lần
    sqs.deleteMessage(DeleteMessageRequest.builder()
            .queueUrl(queueUrl).receiptHandle(m.receiptHandle()).build());   // xoá SAU khi xử lý xong
}
~~~

**Long polling** ({{WaitTimeSeconds}} 1–20) làm SQS giữ kết nối tới khi có message hoặc hết thời gian chờ, thay vì trả về rỗng ngay. Giảm mạnh số request rỗng (tiền) và giảm độ trễ. Short polling ({{0}}) chỉ hỏi một phần các server nên có thể trả rỗng dù queue còn message.

Nếu xử lý có thể lâu hơn dự kiến (gọi API ngoài chậm), consumer gọi {{ChangeMessageVisibility}} để **gia hạn** thay vì đặt timeout cực lớn cho mọi message. Gọi với timeout 0 thì message hiện lại ngay (trả lại cho consumer khác).

### At-least-once: consumer phải idempotent
**Standard queue** đảm bảo **at-least-once**: hiếm nhưng có thể giao một message **hơn một lần**, và thứ tự chỉ là best-effort. Ngay cả khi SQS giao đúng 1 lần, chính bạn cũng gây trùng: xử lý xong, ghi DB xong, nhưng crash **trước** khi delete, thì message quay lại.

Cách làm consumer **idempotent**:
- Mỗi message mang một **business id** (ví dụ {{orderId}} hoặc {{eventId}} do producer sinh).
- Trong **cùng transaction** với thay đổi nghiệp vụ, insert {{eventId}} vào bảng {{processed_events}} có unique constraint. Insert vi phạm unique nghĩa là đã xử lý: bỏ qua và delete message.
- Thao tác tự nhiên idempotent ({{UPDATE ... SET status = 'PAID' WHERE id = ? AND status = 'PENDING'}}) cũng là một cách.
- Với side effect bên ngoài (gửi email, gọi cổng thanh toán), truyền **idempotency key** cho bên kia nếu họ hỗ trợ.

### DLQ và maxReceiveCount
Message "độc" (poison message: JSON hỏng, dữ liệu vi phạm ràng buộc) sẽ fail mãi, bị giao lại liên tục, tốn tiền và che khuất message tốt. **Redrive policy** gắn queue nguồn với một **dead-letter queue**: khi số lần nhận ({{ApproximateReceiveCount}}) **vượt** {{maxReceiveCount}}, SQS chuyển message sang DLQ.

- Chọn {{maxReceiveCount}} đủ để vượt lỗi tạm thời (3–5 là phổ biến), không phải 1: chỉ một lần timeout mạng là message vào DLQ.
- **Đặt alarm** trên số message của DLQ ({{ApproximateNumberOfMessagesVisible}} > 0). DLQ không ai nhìn thì chỉ là nơi dữ liệu chết lặng lẽ.
- Retention của DLQ nên **dài hơn** queue nguồn (tối đa 14 ngày), vì với standard queue, tuổi message vẫn được tính từ lúc gửi vào queue nguồn ban đầu, không reset khi chuyển sang DLQ.
- Sửa lỗi xong dùng **DLQ redrive** để đẩy message trở lại queue nguồn.
- Với Lambda đọc SQS: đặt visibility timeout của queue **ít nhất 6 lần** timeout của function (AWS khuyến nghị), và bật {{ReportBatchItemFailures}} để chỉ message lỗi trong batch bị giao lại.

### FIFO queue
FIFO queue (tên kết thúc bằng {{.fifo}}) cho:
- **Thứ tự** trong cùng một {{MessageGroupId}}: message của nhóm "account-42" được giao theo thứ tự gửi, và message sau chỉ được giao khi message trước đã xử lý xong (bị delete). Các group khác nhau chạy song song.
- **Deduplication** trong cửa sổ 5 phút: theo {{MessageDeduplicationId}} do bạn đặt, hoặc content-based (SHA-256 của body).

Cái giá: throughput thấp hơn standard (ở chế độ thường là 300 lời gọi API mỗi giây, 3.000 message/giây nếu batch 10; chế độ high throughput cao hơn nhiều), và **một message lỗi chặn cả group** cho tới khi nó thành công hoặc vào DLQ. Chọn group id theo đúng đơn vị cần thứ tự (account, order), **không** dùng một group id cho mọi message, vì như vậy toàn bộ queue thành tuần tự.

> Dedup của FIFO chỉ chặn trùng **phía gửi** trong 5 phút. Consumer crash trước khi delete thì message vẫn được giao lại. Consumer vẫn cần idempotent.

### SNS fan-out và EventBridge
- **SNS** là pub/sub dạng push: một topic, nhiều subscriber (SQS, Lambda, HTTP, email). Mẫu kinh điển **SNS → nhiều SQS**: sự kiện "OrderPlaced" vào topic, mỗi service (email, kho, analytics) có **queue riêng** subscribe topic đó, nên mỗi bên tự retry và có DLQ riêng, không ảnh hưởng nhau. **Filter policy** cho mỗi subscription chỉ nhận sự kiện liên quan. Bật **raw message delivery** để body trong SQS là message gốc, không bị bọc JSON của SNS.
- **EventBridge** là event bus có **rule** lọc theo nội dung event (event pattern) và định tuyến tới target (Lambda, SQS, Step Functions, API destination…). Mạnh ở: nhận event từ dịch vụ AWS và SaaS, schema registry, **archive & replay**, chuyển event giữa account. Phù hợp làm "xương sống" event giữa các domain khi throughput vừa phải.

### Khi nào dùng Kafka / MSK thay vì SQS
| Nhu cầu | SQS / SNS | EventBridge | Kafka (MSK) |
|---|---|---|---|
| Hàng đợi công việc, retry, DLQ đơn giản | Rất hợp | Không phải mục đích chính | Làm được nhưng phức tạp hơn |
| Fan-out nhiều consumer | SNS → SQS | Rule → nhiều target | Nhiều consumer group đọc cùng log |
| Đọc lại lịch sử (replay) | Không, message bị xoá khi xử lý | Archive & replay | Có, theo retention / offset |
| Thứ tự + throughput rất cao | FIFO, giới hạn theo group | Không đảm bảo thứ tự | Thứ tự theo partition, rất cao |
| Vận hành | Serverless, gần như không | Serverless | Phải quản lý cluster, partition, consumer lag (MSK Serverless giảm bớt) |

Chọn Kafka khi cần **event log** lâu dài để nhiều hệ thống đọc lại, stream processing, hoặc throughput có thứ tự rất cao. Chọn SQS khi bạn cần một **hàng đợi công việc** đơn giản, rẻ, không phải vận hành.

### Liên hệ phỏng vấn
Câu hay gặp: "Message bị xử lý 2 lần, vì sao và xử lý ra sao?", "Visibility timeout đặt bao nhiêu?", "Lambda xử lý batch 10 message, 1 message lỗi thì sao?" (aws-028), "Cần thứ tự theo tài khoản thì làm gì?". Nắm vững vòng đời message (bài tập dưới đây cho bạn tự cài) là trả lời được hầu hết.

> Senior tip: Đặt alarm cho {{ApproximateAgeOfOldestMessage}} của queue nguồn, không chỉ độ dài queue. Tuổi message tăng đều là dấu hiệu consumer chậm hoặc có poison message đang bị retry, thường thấy trước khi khách hàng kêu.`,
  exercises: [
    {
      title: 'Mô phỏng SQS: visibility timeout, receipt handle, receive count và DLQ',
      prompt: `Cài đặt một queue trong bộ nhớ mô phỏng SQS standard (đơn giản hoá: thứ tự theo lúc gửi). Thời gian lấy từ **clock giả** (mili giây) nên test không cần sleep.

Đã có sẵn: lớp {{Msg}}, constructor, {{send}} (id dạng {{m1}}, {{m2}}…), {{enqueue}}, {{size}}. Bạn cài:

1. {{receive(max)}}: duyệt message theo thứ tự, lấy tối đa {{max}} message **đang visible** ({{visibleAt <= now}}). Với mỗi message:
  ▸ nếu có DLQ và {{receiveCount >= maxReceiveCount}}: xoá khỏi queue này và {{dlq.enqueue(id, body)}} (giữ nguyên id), **không** trả về, không tính vào {{max}};
  ▸ ngược lại: {{receiveCount++}}, {{visibleAt = now + visibilityMs}}, receipt handle mới = {{id + "#" + receiveCount}}, thêm vào kết quả.
2. {{delete(handle)}}: xoá message có receipt handle **hiện tại** bằng {{handle}}, trả về true; handle cũ hoặc không tồn tại trả về false.
3. {{changeVisibility(handle, timeoutMs)}}: với handle hiện tại, đặt {{visibleAt = now + timeoutMs}} và trả về true; không tìm thấy thì false.

(Đơn giản hoá: SQS thật yêu cầu dùng receipt handle của lần nhận gần nhất; ở đây handle cũ luôn bị từ chối.)`,
      starter: `record Received(String messageId, String body, String receiptHandle, int receiveCount) {}

class SimQueue {
    private static final class Msg {
        final String id, body;
        int receiveCount;        // số lần đã được giao
        long visibleAt;          // thời điểm (ms) message hiện lại; 0 = visible ngay
        String handle;           // receipt handle của lần nhận gần nhất
        Msg(String id, String body) { this.id = id; this.body = body; }
    }

    private final LongSupplier clock;
    private final long visibilityMs;
    private final int maxReceiveCount;
    private final SimQueue dlq;                  // có thể null
    private final List<Msg> messages = new ArrayList<>();
    private int seq = 0;

    SimQueue(LongSupplier clock, long visibilityMs, int maxReceiveCount, SimQueue dlq) {
        this.clock = clock;
        this.visibilityMs = visibilityMs;
        this.maxReceiveCount = maxReceiveCount;
        this.dlq = dlq;
    }

    String send(String body) {
        String id = "m" + (++seq);
        enqueue(id, body);
        return id;
    }

    void enqueue(String id, String body) { messages.add(new Msg(id, body)); }

    int size() { return messages.size(); }

    List<Received> receive(int max) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean delete(String handle) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean changeVisibility(String handle, long timeoutMs) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void eq(String name, Object expected, Supplier<Object> actual) {
        total++;
        try {
            Object got = actual.get();
            if (Objects.equals(expected, got)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": mong đợi " + expected + ", nhận " + got);
        } catch (RuntimeException e) {
            System.out.println("FAIL " + name + ": ném " + e);
        }
    }
    static String ids(List<Received> rs) {
        return rs.stream().map(r -> r.messageId() + ":" + r.receiveCount()).collect(Collectors.joining(","));
    }
    public static void main(String[] args) {
        long[] now = { 0 };
        LongSupplier clock = () -> now[0];

        SimQueue q = new SimQueue(clock, 30_000, 5, null);
        q.send("a"); q.send("b"); q.send("c");
        eq("receive respects max", "m1:1,m2:1", () -> ids(q.receive(2)));
        eq("in-flight messages are hidden", "m3:1", () -> ids(q.receive(10)));
        eq("nothing visible before timeout", "", () -> { now[0] = 29_999; return ids(q.receive(10)); });
        eq("redelivered after timeout with count 2", "m1:2,m2:2,m3:2", () -> { now[0] = 30_000; return ids(q.receive(10)); });
        eq("stale receipt handle rejected", false, () -> q.delete("m1#1"));
        eq("current receipt handle deletes", true, () -> q.delete("m1#2") && q.size() == 2);
        eq("unknown handle", false, () -> q.delete("m9#1"));

        long[] t2 = { 0 };
        SimQueue v = new SimQueue(() -> t2[0], 1_000, 5, null);
        v.send("slow-job");
        String h = v.receive(1).get(0).receiptHandle();
        eq("extend visibility", true, () -> { t2[0] = 500; return v.changeVisibility(h, 5_000); });
        eq("still hidden after original timeout", 0, () -> { t2[0] = 2_000; return v.receive(1).size(); });
        eq("visible after extended timeout", "m1:2", () -> { t2[0] = 5_500; return ids(v.receive(1)); });
        eq("visibility 0 releases immediately", "m1:3", () -> { v.changeVisibility("m1#2", 0); return ids(v.receive(1)); });

        long[] t3 = { 0 };
        SimQueue dlq = new SimQueue(() -> t3[0], 30_000, 10, null);
        SimQueue src = new SimQueue(() -> t3[0], 1_000, 2, dlq);
        src.send("poison");
        src.send("ok");
        eq("first delivery", "m1:1,m2:1", () -> ids(src.receive(10)));
        eq("ok message is deleted", true, () -> src.delete("m2#1"));
        eq("second delivery of poison", "m1:2", () -> { t3[0] = 1_000; return ids(src.receive(10)); });
        eq("exceeding maxReceiveCount moves to DLQ", "", () -> { t3[0] = 2_000; return ids(src.receive(10)); });
        eq("source queue now empty", 0, () -> src.size());
        eq("DLQ keeps id and body", "m1/poison", () -> { Received r = dlq.receive(1).get(0); return r.messageId() + "/" + r.body(); });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Received(String messageId, String body, String receiptHandle, int receiveCount) {}

class SimQueue {
    private static final class Msg {
        final String id, body;
        int receiveCount;
        long visibleAt;
        String handle;
        Msg(String id, String body) { this.id = id; this.body = body; }
    }

    private final LongSupplier clock;
    private final long visibilityMs;
    private final int maxReceiveCount;
    private final SimQueue dlq;
    private final List<Msg> messages = new ArrayList<>();
    private int seq = 0;

    SimQueue(LongSupplier clock, long visibilityMs, int maxReceiveCount, SimQueue dlq) {
        this.clock = clock;
        this.visibilityMs = visibilityMs;
        this.maxReceiveCount = maxReceiveCount;
        this.dlq = dlq;
    }

    String send(String body) {
        String id = "m" + (++seq);
        enqueue(id, body);
        return id;
    }

    void enqueue(String id, String body) { messages.add(new Msg(id, body)); }

    int size() { return messages.size(); }

    List<Received> receive(int max) {
        long now = clock.getAsLong();
        List<Received> out = new ArrayList<>();
        Iterator<Msg> it = messages.iterator();
        while (it.hasNext() && out.size() < max) {
            Msg m = it.next();
            if (m.visibleAt > now) continue;                       // đang in-flight: bỏ qua
            if (dlq != null && m.receiveCount >= maxReceiveCount) { // lần nhận này sẽ VƯỢT ngưỡng
                it.remove();
                dlq.enqueue(m.id, m.body);
                continue;
            }
            m.receiveCount++;
            m.visibleAt = now + visibilityMs;                      // ẩn trong visibility timeout
            m.handle = m.id + "#" + m.receiveCount;                // mỗi lần nhận một handle mới
            out.add(new Received(m.id, m.body, m.handle, m.receiveCount));
        }
        return out;
    }

    private Msg byHandle(String handle) {
        for (Msg m : messages) if (handle.equals(m.handle)) return m;
        return null;
    }

    boolean delete(String handle) {
        Msg m = byHandle(handle);
        return m != null && messages.remove(m);
    }

    boolean changeVisibility(String handle, long timeoutMs) {
        Msg m = byHandle(handle);
        if (m == null) return false;
        m.visibleAt = clock.getAsLong() + timeoutMs;
        return true;
    }
}`,
      hints: [
        'Message visible khi {{visibleAt <= now}}. Nhận xong thì đẩy {{visibleAt}} ra {{now + visibilityMs}}: đó chính là "khoá mềm" của SQS.',
        'Dùng {{Iterator}} để vừa duyệt vừa {{remove}} khi chuyển message sang DLQ, tránh {{ConcurrentModificationException}}.',
        'Kiểm tra DLQ **trước** khi tăng {{receiveCount}}: với maxReceiveCount = 2, message được giao 2 lần, lần nhận thứ 3 mới chuyển sang DLQ.',
      ],
      explain: `### Cơ chế bạn vừa cài
- **Visibility timeout là một "lease"**: message không bị khoá cứng mà chỉ bị ẩn tới một thời điểm. Consumer chết thì lease hết hạn và message tự quay lại; không cần cơ chế phát hiện consumer chết. Đây là lý do SQS là at-least-once: hệ thống chọn **giao lại** thay vì **mất**.
- **Receipt handle gắn với lần nhận**, không phải với message. Consumer A nhận, xử lý quá lâu, lease hết, consumer B nhận lại; nếu handle cũ của A vẫn xoá được thì A có thể xoá message trong khi B đang xử lý. Mỗi lần nhận một handle mới giúp phân biệt.
- **DLQ dựa trên số lần nhận**, không phải số lần "lỗi": SQS không biết bạn lỗi hay không, nó chỉ đếm số lần message bị nhận mà không bị xoá. Vì thế visibility timeout quá ngắn (message còn đang xử lý đã bị giao lại) cũng đẩy message tốt vào DLQ.

### Lỗi hay gặp
- Tăng {{receiveCount}} trước rồi mới so với ngưỡng: message vào DLQ sớm hơn một lần.
- Lưu handle là id: test "stale receipt handle rejected" fail.
- Dùng for-each rồi {{messages.remove}} trong vòng lặp: ném {{ConcurrentModificationException}}.

Ngoài đời còn thiếu: retention, delay queue, thứ tự không đảm bảo của standard queue, và việc SQS phân tán trên nhiều server (nên ReceiveCount chỉ là "Approximate").`,
    },
  ],
  check: [
    {
      q: 'Consumer xử lý mỗi message mất khoảng 45 giây (p99 là 70 giây), visibility timeout của queue để mặc định 30 giây. Triệu chứng nào sẽ xuất hiện?',
      options: ['Message bị mất vĩnh viễn', 'Message bị giao lại khi consumer đầu vẫn đang xử lý, gây xử lý trùng, và có thể bị đẩy vào DLQ dù không lỗi', 'SQS tự kéo dài timeout theo thời gian xử lý', 'Consumer nhận lỗi khi gọi ReceiveMessage'],
      answer: 1,
      explain: `Hết 30 giây, message hiện lại và consumer khác nhận nó trong khi consumer đầu vẫn chạy: xử lý trùng, receive count tăng nhanh, đủ lần thì vào DLQ. SQS không làm mất message (nó chọn giao lại); SQS không tự gia hạn (bạn phải gọi ChangeMessageVisibility hoặc đặt timeout > p99); ReceiveMessage không báo lỗi trong tình huống này.`,
    },
    {
      q: 'Hệ thống cần xử lý giao dịch của **cùng một tài khoản** theo đúng thứ tự, nhưng các tài khoản khác nhau phải chạy song song. Cấu hình nào đúng?',
      options: ['Standard queue, sắp xếp lại ở consumer theo timestamp', 'FIFO queue với cùng một MessageGroupId cố định cho mọi message', 'FIFO queue với MessageGroupId = accountId', 'SNS topic với filter policy theo accountId'],
      answer: 2,
      explain: `FIFO giữ thứ tự **trong** một message group và cho các group chạy song song, nên group id = accountId đúng yêu cầu. Group id cố định làm toàn bộ queue tuần tự; standard queue không đảm bảo thứ tự và sắp lại ở consumer rất khó đúng khi có retry; filter policy của SNS chỉ lọc, không đảm bảo thứ tự.`,
    },
    {
      q: 'Sự kiện OrderPlaced cần đến service email, kho và analytics; mỗi service có tốc độ và lỗi riêng. Thiết kế nào hợp lý nhất trên AWS?',
      options: ['Một SQS queue chung, ba service cùng poll', 'SNS topic, mỗi service một SQS queue subscribe (kèm DLQ riêng)', 'Order gọi HTTP lần lượt tới ba service', 'Ghi sự kiện vào S3 rồi ba service LIST định kỳ'],
      answer: 1,
      explain: `SNS → SQS fan-out cho mỗi service một bản sao sự kiện, retry và DLQ độc lập. Một queue chung thì mỗi message chỉ được **một** consumer xử lý (các service tranh nhau, không phải mỗi service nhận một bản); gọi HTTP tuần tự làm order phụ thuộc và chậm theo service chậm nhất; LIST S3 định kỳ chậm, tốn tiền và không có retry/DLQ.`,
    },
  ],
  related: ['aws-008', 'aws-028'],
  tags: ['SQS', 'SNS', 'EventBridge', 'DLQ', 'visibility timeout', 'FIFO', 'idempotency'],
},
{
  id: 'lesson-aws-004',
  track: 'aws',
  order: 4,
  title: 'Chọn compute và scaling cho Java: Lambda, ECS Fargate, EKS, EC2, ALB, Auto Scaling và giới hạn kết nối DB',
  level: 'senior',
  minutes: 45,
  goals: [
    'So sánh Lambda, ECS Fargate, EKS và EC2 theo mô hình tải, chi phí vận hành và đặc thù JVM',
    'Hiểu cold start của Java trên Lambda và các cách giảm (SnapStart, memory, provisioned concurrency)',
    'Cấu hình ALB health check và target tracking scaling để scale an toàn',
    'Tính "ngân sách kết nối" tới RDS/Aurora và biết khi nào cần RDS Proxy',
  ],
  body: `### Bốn lựa chọn compute, khác nhau ở chỗ ai quản lý cái gì
~~~text
 Bạn quản lý nhiều  <------------------------------------------>  AWS quản lý nhiều
   EC2 (VM)          EKS (Kubernetes)      ECS on Fargate          Lambda
   OS, patch, AMI    cluster, node/        task definition,        chỉ code + cấu hình
   scale VM          Fargate, manifest     service, scaling        scale theo request
~~~

- **EC2**: máy ảo. Toàn quyền (chọn instance type, JVM flag, agent), rẻ nhất cho tải ổn định khi dùng Savings Plans/Reserved, nhưng bạn tự patch OS, tự dựng AMI, tự cấu hình Auto Scaling Group.
- **ECS on Fargate**: chạy container mà không quản lý máy. Khai báo task definition (image, vCPU, memory, role), ECS service giữ đủ số task và gắn vào ALB. Ít việc vận hành nhất cho Spring Boot dạng container.
- **EKS**: Kubernetes được AWS quản lý control plane (tính phí theo giờ cho mỗi cluster). Đáng giá khi tổ chức đã chuẩn hoá trên Kubernetes (Helm, operator, service mesh, đa cloud). Đổi lại phải có người hiểu Kubernetes.
- **Lambda**: chạy hàm theo sự kiện, trả tiền theo số request và thời gian chạy × memory. Không có request thì gần như không tốn tiền. Timeout tối đa 15 phút.

### Lambda với Java: cold start và cách giảm
Khi chưa có môi trường chạy sẵn, Lambda phải tạo môi trường mới (**cold start**): tải code, khởi động JVM, nạp class, chạy phần init (tạo Spring context, connection pool, client SDK). Với Java + Spring Boot, cold start có thể từ vài trăm mili giây đến vài giây. Các lần gọi sau dùng lại môi trường (**warm**) nên nhanh.

- **Memory quyết định CPU**: Lambda cấp CPU tỉ lệ với memory (128 MB – 10.240 MB; khoảng 1.769 MB tương đương 1 vCPU). Function Java 512 MB thường init chậm vì thiếu CPU; tăng memory nhiều khi **vừa nhanh hơn vừa rẻ hơn** vì thời gian chạy giảm mạnh. Đo bằng công cụ như AWS Lambda Power Tuning thay vì đoán.
- **SnapStart** (Java 11 trở lên trên runtime Corretto): khi publish version, Lambda chạy init một lần, chụp **snapshot** bộ nhớ của môi trường (Firecracker microVM) rồi cache; cold start sau đó **khôi phục từ snapshot** thay vì init lại. Phải gọi qua version/alias, không phải {{$LATEST}}. Chú ý những gì tạo trong init sẽ bị **dùng chung** giữa các môi trường khôi phục từ cùng snapshot: seed ngẫu nhiên, id duy nhất, kết nối mạng. Dùng runtime hook (CRaC API: {{beforeCheckpoint}}/{{afterRestore}}) để tạo lại chúng.
- **Provisioned concurrency**: giữ sẵn N môi trường đã init, trả phí kể cả khi không có request. Dùng khi cần độ trễ ổn định tuyệt đối.
- Viết hàm gọn: tránh quét classpath nặng; tạo client SDK **ngoài** handler (trong init) để tái sử dụng giữa các lần gọi.

### ALB và health check
ALB phân phối request tới **target group** (các task ECS, instance EC2, IP, hoặc Lambda). ALB gọi **health check** định kỳ (path, interval, healthy/unhealthy threshold); target fail đủ số lần liên tiếp thì bị rút khỏi vòng phân phối.

- Trỏ health check vào {{/actuator/health/readiness}}: chỉ trả UP khi app sẵn sàng nhận traffic. **Đừng** đưa kiểm tra database vào health check của ALB một cách bừa bãi: DB chậm một chút là mọi target cùng bị đánh dấu unhealthy, cả hệ thống tự sập theo.
- **Health check grace period** (ECS service / ASG): khoảng thời gian bỏ qua health check sau khi khởi động, để JVM + Spring Boot kịp lên, tránh vòng lặp "chưa lên kịp đã bị kill".
- **Deregistration delay** (mặc định 300 giây): khi scale-in hoặc deploy, ALB ngừng gửi request mới tới target nhưng chờ request đang chạy hoàn tất. Kết hợp {{server.shutdown=graceful}} của Spring Boot để không cắt ngang request.

### Auto Scaling: target tracking
**Target tracking** giống bộ điều nhiệt: bạn đặt mục tiêu (ví dụ CPU trung bình 50%, hoặc {{ALBRequestCountPerTarget}} = 1.000), AWS tạo CloudWatch alarm và tự tính số task/instance cần để giữ metric quanh mục tiêu.

Trực giác của phép tính: nếu 4 task đang ở CPU 75% mà mục tiêu là 50%, thì cần khoảng 4 × 75 / 50 = **6** task. Hệ thống **scale-out nhanh** (thiếu năng lực thì khách chịu lỗi) và **scale-in thận trọng** (thừa một chút chỉ tốn tiền), có cooldown để không dao động lên xuống liên tục. Với ECS (Application Auto Scaling) bạn đặt được {{ScaleOutCooldown}} và {{ScaleInCooldown}}.

> Với Java, CPU lúc khởi động rất cao (JIT, nạp class). Nếu metric CPU của task mới bị tính ngay, hệ thống tưởng quá tải và scale-out tiếp. Grace period, warmup và chọn metric theo request (thay vì CPU) giúp tránh "scale chồng".

### Database: giới hạn kết nối mới là nút thắt
Scale app thì dễ, scale database thì không. RDS/Aurora có {{max_connections}} phụ thuộc instance class (tính theo RAM). Mỗi kết nối PostgreSQL là một process phía server, tốn RAM.

~~~text
 40 task ECS  x  HikariCP maximumPoolSize 10  =  400 kết nối
 + 200 Lambda chạy đồng thời x 1 kết nối      =  600 kết nối  --> vượt max_connections của instance nhỏ
~~~

**Ngân sách kết nối** = số instance tối đa của Auto Scaling × pool size, phải nhỏ hơn {{max_connections}} trừ phần dự phòng cho admin/migration. Vì thế: đặt **max capacity** của Auto Scaling theo ngân sách này, và giữ pool nhỏ (HikariCP khuyên pool nhỏ hơn nhiều so với người ta nghĩ).

**RDS Proxy** đứng giữa app và DB, giữ một pool kết nối tới DB và **dùng chung (multiplex)** cho nhiều client, đặc biệt hợp với Lambda (nhiều môi trường ngắn hạn mở kết nối liên tục). Proxy còn giúp failover Aurora/RDS nhanh và êm hơn cho client, hỗ trợ IAM authentication và lấy secret từ Secrets Manager. Lưu ý **pinning**: khi session dùng trạng thái riêng (prepared statement ở một số driver, {{SET}} biến session, temp table), proxy phải gắn chặt kết nối đó cho client, mất lợi ích multiplex.

### Bảng quyết định
| Tình huống | Lựa chọn hợp lý | Lý do |
|---|---|---|
| API Spring Boot chạy liên tục, tải dao động trong ngày | ECS Fargate + ALB + target tracking | ít vận hành, scale theo task, không quản lý máy |
| Tổ chức đã chuẩn hoá Kubernetes, nhiều team, cần ecosystem K8s | EKS | thống nhất công cụ; chấp nhận độ phức tạp |
| Tải lớn ổn định, cần tune JVM/OS sâu, tối ưu chi phí | EC2 + ASG (+ Savings Plans) | rẻ nhất mỗi đơn vị năng lực, toàn quyền |
| Xử lý sự kiện rời rạc (S3 upload, SQS, cron), tải gai | Lambda (+ SnapStart) | trả tiền theo dùng, scale tự động về 0 |
| API cần p99 thấp ổn định, tải đều | Container (Fargate/EKS) hơn Lambda | không có cold start, giữ pool kết nối lâu dài |
| Nhiều Lambda cùng ghi vào RDS | Lambda + RDS Proxy | tránh cạn max_connections |

### Liên hệ phỏng vấn
Câu hay gặp: "Deploy Spring Boot lên AWS chọn gì?" (aws-001), "Lambda Java cold start cao xử lý thế nào?" (aws-002), "Scale-in làm rớt request?" (aws-010), "Aurora failover xong app vẫn lỗi?" (aws-019). Câu trả lời ghi điểm luôn nêu **tiêu chí** (mô hình tải, độ trễ, đội ngũ, chi phí) trước khi nêu dịch vụ, và nhắc tới **giới hạn kết nối DB** khi nói về scale.

> Senior tip: Trước khi bật auto scaling, hãy load test một task để biết nó chịu được bao nhiêu request/giây ở p99 chấp nhận được; con số đó mới là căn cứ để đặt target ({{ALBRequestCountPerTarget}}) và max capacity. Đặt target theo cảm tính (CPU 70% vì "ai cũng đặt thế") là cách nhanh nhất để scale quá muộn.`,
  exercises: [
    {
      title: 'Mô phỏng target tracking scaling có min/max và cooldown',
      prompt: `Cài đặt bộ quyết định số task theo mô hình target tracking **đơn giản hoá** (không phải thuật toán chính xác của AWS, nhưng cùng tinh thần).

{{TargetTrackingScaler(targetCpu, min, max, scaleOutCooldownSec, scaleInCooldownSec)}}: ném {{IllegalArgumentException}} nếu {{targetCpu <= 0}}, {{min < 1}} hoặc {{min > max}}.

{{desired(current, avgCpu, nowSec)}} trả về số task mới:
1. {{raw = ceil(current * avgCpu / targetCpu)}} (trừ một epsilon nhỏ như {{1e-9}} trước khi ceil để tránh lỗi số thực), rồi kẹp vào khoảng {{[min, max]}}.
2. Nếu {{raw > current}} (scale-out): chỉ áp dụng khi **chưa từng scale-out** hoặc {{nowSec - lastScaleOut >= scaleOutCooldownSec}}; nếu áp dụng thì ghi nhớ {{lastScaleOut = nowSec}} và trả về {{raw}}, ngược lại trả về {{current}}.
3. Nếu {{raw < current}} (scale-in): chỉ áp dụng khi đã qua {{scaleInCooldownSec}} kể từ **lần scale gần nhất (cả out lẫn in)**, hoặc chưa từng scale; nếu áp dụng thì ghi nhớ {{lastScaleIn = nowSec}} và trả về {{raw}}, ngược lại trả về {{current}}.
4. Bằng nhau thì trả về {{current}}.`,
      starter: `class TargetTrackingScaler {
    private final double targetCpu;
    private final int min, max;
    private final long scaleOutCooldownSec, scaleInCooldownSec;
    private Long lastScaleOut = null;    // null = chưa từng scale-out
    private Long lastScaleIn = null;

    TargetTrackingScaler(double targetCpu, int min, int max, long scaleOutCooldownSec, long scaleInCooldownSec) {
        // TODO: kiểm tra tham số
        this.targetCpu = targetCpu;
        this.min = min;
        this.max = max;
        this.scaleOutCooldownSec = scaleOutCooldownSec;
        this.scaleInCooldownSec = scaleInCooldownSec;
    }

    int desired(int current, double avgCpu, long nowSec) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void eq(String name, Object expected, Supplier<Object> actual) {
        total++;
        try {
            Object got = actual.get();
            if (Objects.equals(expected, got)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": mong đợi " + expected + ", nhận " + got);
        } catch (RuntimeException e) {
            System.out.println("FAIL " + name + ": ném " + e);
        }
    }
    static String iae(Runnable r) {
        try { r.run(); return "no exception"; } catch (IllegalArgumentException e) { return "IAE"; }
    }
    public static void main(String[] args) {
        eq("scale out proportionally", 6, () -> new TargetTrackingScaler(50, 2, 10, 60, 300).desired(4, 75, 0));
        eq("ceil, not round", 5, () -> new TargetTrackingScaler(50, 2, 10, 60, 300).desired(4, 51, 0));
        eq("exact ratio has no off-by-one", 3, () -> new TargetTrackingScaler(70, 1, 10, 60, 300).desired(3, 70, 0));
        eq("clamped to max", 10, () -> new TargetTrackingScaler(50, 2, 10, 60, 300).desired(8, 90, 0));
        eq("clamped to min", 2, () -> new TargetTrackingScaler(50, 2, 10, 60, 300).desired(4, 1, 0));
        eq("on target stays", 4, () -> new TargetTrackingScaler(50, 2, 10, 60, 300).desired(4, 50, 0));

        TargetTrackingScaler s = new TargetTrackingScaler(50, 2, 10, 60, 300);
        eq("t=0 scale out to 6", 6, () -> s.desired(4, 75, 0));
        eq("t=30 blocked by scale-out cooldown", 6, () -> s.desired(6, 90, 30));
        eq("t=60 scale out again", 10, () -> s.desired(6, 90, 60));
        eq("t=200 scale-in waits after recent scale-out", 10, () -> s.desired(10, 20, 200));
        eq("t=360 scale in", 4, () -> s.desired(10, 20, 360));
        eq("t=400 scale-in cooldown after scale-in", 4, () -> s.desired(4, 25, 400));
        eq("t=410 scale-out not blocked by scale-in", 8, () -> s.desired(4, 100, 410));

        eq("min > max rejected", "IAE", () -> iae(() -> new TargetTrackingScaler(50, 5, 3, 60, 300)));
        eq("target <= 0 rejected", "IAE", () -> iae(() -> new TargetTrackingScaler(0, 1, 3, 60, 300)));
        eq("min < 1 rejected", "IAE", () -> iae(() -> new TargetTrackingScaler(50, 0, 3, 60, 300)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class TargetTrackingScaler {
    private final double targetCpu;
    private final int min, max;
    private final long scaleOutCooldownSec, scaleInCooldownSec;
    private Long lastScaleOut = null;
    private Long lastScaleIn = null;

    TargetTrackingScaler(double targetCpu, int min, int max, long scaleOutCooldownSec, long scaleInCooldownSec) {
        if (targetCpu <= 0 || min < 1 || min > max) throw new IllegalArgumentException("cấu hình không hợp lệ");
        this.targetCpu = targetCpu;
        this.min = min;
        this.max = max;
        this.scaleOutCooldownSec = scaleOutCooldownSec;
        this.scaleInCooldownSec = scaleInCooldownSec;
    }

    int desired(int current, double avgCpu, long nowSec) {
        // tổng tải hiện tại = current * avgCpu; chia cho mức mục tiêu mỗi task
        int raw = (int) Math.ceil(current * avgCpu / targetCpu - 1e-9);
        raw = Math.max(min, Math.min(max, raw));
        if (raw > current) {
            // scale-out: nhanh, chỉ chờ cooldown của chính scale-out
            if (lastScaleOut == null || nowSec - lastScaleOut >= scaleOutCooldownSec) {
                lastScaleOut = nowSec;
                return raw;
            }
            return current;
        }
        if (raw < current) {
            // scale-in: thận trọng, chờ đủ lâu sau BẤT KỲ lần scale nào
            Long last = lastScaleOut;                       // lần scale gần nhất, null = chưa từng
            if (lastScaleIn != null && (last == null || lastScaleIn > last)) last = lastScaleIn;
            if (last == null || nowSec - last >= scaleInCooldownSec) {
                lastScaleIn = nowSec;
                return raw;
            }
        }
        return current;
    }
}`,
      hints: [
        'Tổng tải = {{current * avgCpu}}; số task cần để mỗi task chỉ ở mức {{targetCpu}} là tổng tải chia {{targetCpu}}, làm tròn **lên**.',
        'Kẹp vào {{[min, max]}} **trước** khi so sánh với {{current}}, để trường hợp current < min cũng được xử lý như scale-out.',
        'Scale-in cần mốc "lần scale gần nhất" = giá trị lớn hơn của {{lastScaleOut}} và {{lastScaleIn}} (bỏ qua giá trị null).',
      ],
      explain: `### Ý tưởng
Target tracking giả định tải chia đều: tổng "lượng CPU" đang dùng là {{current × avgCpu}}; muốn mỗi task ở mức mục tiêu thì cần {{current × avgCpu / target}} task, làm tròn **lên** (thiếu nửa task nghĩa là quá tải). Sau đó kẹp vào min/max: max chính là chỗ bạn đặt **ngân sách kết nối DB** và trần chi phí.

### Vì sao bất đối xứng
- **Scale-out** chỉ chờ cooldown của chính nó: thiếu năng lực thì người dùng gặp lỗi, phải phản ứng nhanh. Cooldown ngắn vẫn cần để task mới kịp khởi động và metric phản ánh năng lực mới, nếu không bạn sẽ scale chồng nhiều lần cho cùng một đợt tải.
- **Scale-in** chờ lâu sau **mọi** lần scale: vừa scale-out xong mà tải giảm tạm thời thì không nên rút ngay, tránh dao động (flapping). Thừa task chỉ tốn tiền, thiếu task thì tốn khách.

### Lỗi hay gặp
- Dùng {{Math.round}}: 4 task × 51% / 50% = 4,08 làm tròn ra 4, tức vẫn quá tải; test "ceil, not round" bắt lỗi này.
- Bỏ epsilon: phép chia số thực có thể ra 3,0000000000000004 và ceil thành 4 dù đúng ra là 3.
- Cho scale-in chặn scale-out: test cuối kiểm tra đợt tải mới ngay sau scale-in vẫn được scale-out.

AWS thật còn tính trên metric tổng hợp theo chu kỳ, có instance warmup (EC2) và không tính task đang khởi động vào trung bình; nhưng logic "tỉ lệ + kẹp + scale-out nhanh, scale-in chậm" là cốt lõi.`,
    },
  ],
  check: [
    {
      q: 'Lambda Java 512 MB có cold start 4 giây và thời gian chạy warm 800 ms. Bước tối ưu đầu tiên hợp lý nhất?',
      options: ['Viết lại bằng ngôn ngữ khác ngay', 'Thử tăng memory (CPU tăng theo) và bật SnapStart trên version/alias, đo lại', 'Tăng timeout của function lên 15 phút', 'Dùng $LATEST để luôn có bản mới nhất'],
      answer: 1,
      explain: `Lambda cấp CPU tỉ lệ memory, nên tăng memory thường giảm mạnh cả init lẫn thời gian chạy; SnapStart khôi phục từ snapshot thay vì init lại. Viết lại là chi phí lớn khi chưa thử cách rẻ; tăng timeout không làm nhanh hơn; SnapStart chỉ áp dụng cho version đã publish, gọi {{$LATEST}} là mất SnapStart.`,
    },
    {
      q: 'ECS service có max capacity 50 task, mỗi task HikariCP {{maximumPoolSize}} = 20, Aurora instance có max_connections khoảng 800. Khi tải đỉnh, rủi ro gì xảy ra và cách xử lý?',
      options: ['Không rủi ro gì, Aurora tự tăng max_connections', 'Tối đa 1.000 kết nối vượt 800: task mới lỗi lấy kết nối; giảm pool, hạ max capacity theo ngân sách kết nối hoặc dùng RDS Proxy', 'Chỉ cần tăng pool lên 40 để mỗi task nhanh hơn', 'ALB sẽ tự giới hạn số kết nối DB'],
      answer: 1,
      explain: `50 × 20 = 1.000 > 800, nên ở đỉnh tải các task mới không mở được kết nối, lỗi dây chuyền đúng lúc cần năng lực nhất. Cách xử lý: tính ngân sách kết nối, giảm pool, đặt max capacity phù hợp hoặc dùng RDS Proxy. Aurora không tự tăng max_connections theo tải; tăng pool làm tệ hơn; ALB chỉ quản lý kết nối HTTP vào app, không biết gì về kết nối DB.`,
    },
    {
      q: 'Sau mỗi lần deploy, task Spring Boot mới bị ALB đánh dấu unhealthy và ECS kill liên tục, dù chạy local bình thường (khởi động mất 50 giây). Nguyên nhân khả dĩ nhất?',
      options: ['ALB không hỗ trợ Spring Boot', 'Health check bắt đầu tính trước khi app khởi động xong; cần health check grace period đủ dài (và readiness endpoint)', 'Deregistration delay quá ngắn', 'Target tracking đang scale-in'],
      answer: 1,
      explain: `Nếu health check thất bại đủ số lần trước khi JVM + Spring Boot lên xong, task bị coi là hỏng và bị thay, tạo vòng lặp. Grace period cho app thời gian khởi động. ALB không phụ thuộc framework; deregistration delay ảnh hưởng lúc **rút** target chứ không phải lúc khởi động; scale-in không giải thích được việc task mới bị kill ngay sau deploy.`,
    },
  ],
  related: ['aws-001', 'aws-002', 'aws-010', 'aws-017', 'aws-019', 'aws-025'],
  tags: ['Lambda', 'SnapStart', 'ECS Fargate', 'EKS', 'ALB', 'Auto Scaling', 'RDS Proxy'],
},
{
  id: 'lesson-aws-005',
  track: 'aws',
  order: 5,
  title: 'VPC cho dev Java: CIDR, subnet, route table, security group vs NACL và VPC endpoint',
  level: 'mid',
  minutes: 50,
  goals: [
    'Đọc được một dải CIDR và tính được dải IP tương ứng, hiểu vì sao subnet gắn với một AZ',
    'Vẽ lại đường đi của một request từ internet vào app trong private subnet rồi xuống RDS',
    'Phân biệt security group (stateful, chỉ có rule allow) và NACL (stateless, allow/deny xét theo số thứ tự)',
    'Giải thích vì sao NACL outbound thiếu dải ephemeral port tạo ra ca "app nhận request nhưng không có log"',
    'Biết khi nào dùng gateway endpoint cho S3/DynamoDB thay vì đi qua NAT và lợi ích được những gì',
  ],
  body: `### VPC là gì: khu đất bạn tự vẽ đường và hàng rào
**VPC (Virtual Private Cloud)** là một mạng riêng của bạn trong **một region**: bạn tự chọn dải IP, chia thành các **subnet**, đặt bảng đường đi (**route table**) và các "cổng" ra vào. Chưa có VPC thì mỗi tài nguyên phải tự bảo vệ mình; có VPC thì bạn kiểm soát *ai nói chuyện với ai ở tầng mạng*, trước khi ứng dụng chạy một dòng code.

**CIDR** là cách viết một dải IP gọn. {{10.0.0.0/16}} đọc là "10.0.0.0, 16 bit đầu cố định" → từ {{10.0.0.0}} đến {{10.0.255.255}}, tức 65.536 địa chỉ. Cắt nó thành subnet: {{10.0.1.0/24}} = 256 địa chỉ {{10.0.1.0 – 10.0.1.255}}. Càng nhiều bit sau dấu / thì dải càng nhỏ (/24 = 256, /20 = 4.096, /8 = 16,7 triệu). AWS giữ lại 5 địa chỉ mỗi /24 (địa chỉ network, router, hai địa chỉ dự phòng, broadcast) nên thực tế bạn dùng được 251 IP.

Một **subnet nằm trong đúng một Availability Zone (AZ)**. Vì vậy trong thiết kế AWS, "subnet" không chỉ là chuyện IP mà còn là **đơn vị chịu lỗi**: hai subnet ở hai AZ thì sập một AZ không làm sập cả hệ thống.

~~~text
                              Internet
                                 |
                              [IGW]        internet gateway: cổng vào/ra công khai
             public subnet 1a (10.0.1.0/24)      public subnet 1b (10.0.2.0/24)
                    [ALB]                              [NAT gateway]
                        |                                     |
        private subnet 1a (10.0.10.0/24)   private subnet 1b (10.0.11.0/24)
             [ECS task 1]   [ECS task 2]          [RDS replica]
                        |
                  [RDS primary]        subnet group của RDS cũng là subnet private
~~~

- **Public subnet** = có route {{0.0.0.0/0}} trỏ tới **IGW** và tài nguyên trong đó có **public IP**. Chỉ nên đặt thứ "phải nghe từ ngoài": ALB, bastion.
- **Private subnet** = route {{0.0.0.0/0}} trỏ tới **NAT gateway** (NAT nằm ở public subnet). App *đi ra* được (gọi API đối tác, tải package, gọi dịch vụ AWS công khai) nhưng không ai *đi vào* được. Đây là chỗ đặt app Java.
- **Route table** chọn bước tiếp theo theo **longest prefix match**: bảng có {{10.0.0.0/16 → local}}, {{0.0.0.0/0 → nat-abc}}, {{pl-6f1a → prefix list S3}}. Gói gửi tới {{10.0.4.9}} khớp /16 (dài hơn /0) nên đi {{local}}, không ra internet. Muốn "nhốt" một subnet không cho ra ngoài thì cắt riêng một route table cho nó, bỏ route mặc định.

> App không có IP public **vẫn** gọi ra internet được, nhờ NAT gateway làm **SNAT** (thay nguồn bằng IP công khai của chính nó) và giữ bảng kết nối để đưa phản hồi về đúng task. Đổi lại: NAT tính tiền theo GB xử lý và có trần băng thông, nên traffic lớn (S3, video) đi qua NAT là đốt tiền.

### Đường đi thật của một request
~~~seq
title: Client goi vao app trong private subnet
actors: Client | ALB | App | RDS
Client -> ALB: HTTPS 443 (vao public subnet qua IGW)
ALB -> App: forward 8080 (SG app mo 8080 tu SG ALB)
App -> RDS: SQL 5432 (SG db mo 5432 tu SG app)
RDS --> App: result set
App --> ALB: HTTP 200
ALB --> Client: HTTP 200
note App: app không có IP public, ra ngoài phải qua NAT hoặc endpoint
~~~

Chú ý cách tham chiếu khi viết rule SG: **SG cho phép theo SG khác**, không nhất thiết theo CIDR. Đặt ingress của RDS = "5432 từ security group của app" nghĩa là khi app scale thêm instance, bạn không phải sửa rule nào; ghi CIDR thì mỗi lần đổi dải subnet là một lần sửa.

### Hai lớp hàng rào: security group và NACL
~~~text
  Internet -> [NACL của subnet] -> [SG của ENI] -> app
                 (lớp 4, theo subnet)      (lớp 4, theo tài nguyên)
~~~

Thứ tự thật là **NACL trước, SG sau**: gói tin phải qua "hàng rào subnet" rồi mới tới cổng của tài nguyên. Hệ quả thực tế khi debug: một request bị NACL chặn thì **không bao giờ tới app**, nên log ứng dụng im lặng; còn SG chặn thì app cũng không thấy gì, nhưng Flow Logs của ENI cho thấy gói bị từ chối ở tầng đó. Vì cả hai lớp đều phải cho qua, khi kiểm tra cấu hình bạn cứ xét lớp nào trước cũng ra cùng kết luận "được phép hay không" — chỉ khác nhau ở **nguyên nhân** cần nêu.

| | Security group | NACL (network ACL) |
|---|---|---|
| Gắn vào | ENI / instance / task | **subnet** (mọi tài nguyên trong subnet) |
| Loại rule | **chỉ có ALLOW** | ALLOW **và** DENY |
| Đánh giá | hợp (union) của mọi allow rule, không có thứ tự | theo **số thứ tự** rule, rule đầu khớp thắng (100 trước 200) |
| Trạng thái | **stateful**: cho vào thì phản hồi tự được về | **stateless**: phải mở cả chiều đi ra |
| Mặc định | không có rule = cấm mọi chiều | không có rule khớp = cấm |
| Dùng khi | kiểm soát theo thành phần, theo team | hàng rào thô của subnet, chặn một dải IP đang bị nghi tấn công, deny một IP cụ thể giữa đống allow |

**Bẫy kinh điển của NACL**: request từ khách hàng đến port 443, nhưng packet **phản hồi** đi từ app về *ephemeral port* của khách (cổng tạm do hệ điều hành cấp; IANA khuyến nghị 49152–65535, còn AWS NACL thường phải mở 1024–65535 để an toàn với mọi client). Nếu NACL outbound chỉ mở port 443 thì phản hồi bị chặn. Triệu chứng ngoài đời rất khó đoán: client treo chờ, ALB hoặc app **không có log gì** (vì request vào được, chỉ có đường về bị chặn), health check flapping, và mọi thứ "tự hết" khi bạn thêm rule 1024–65535.

Vì SG stateful nên chuyện này không xảy ra ở tầng SG. Quy tắc thực dụng: để SG làm việc kiểm soát chi tiết, đặt NACL mặc định cho phép toàn bộ trong VPC và chỉ dùng nó cho vài rule deny rõ ràng (chặn một dải IP tấn công, chặn mọi thứ ngoại region).

### VPC endpoint: ra dịch vụ AWS mà không đi qua internet
**Gateway endpoint** (miễn phí, chỉ cho **S3** và **DynamoDB**): thêm một route trong route table trỏ prefix list của dịch vụ tới một gateway nội bộ VPC. Traffic ở lại trong mạng AWS, không qua IGW/NAT, có thể gắn **endpoint policy** giới hạn bucket nào được chạm tới từ subnet đó.

**Interface endpoint** (dùng **PrivateLink**, tính tiền theo giờ + GB): một ENI private IP trong subnet của bạn, là "cửa" tới dịch vụ ({{sts}}, {{secretsmanager}}, {{kms}}, {{ecr.api}}, {{logs}}, {{sns}}, {{sqs}}…). App gọi thẳng tên nội bộ, không cần NAT, không cần public IP.

| Nhu cầu | Cách đi | Vì sao |
|---|---|---|
| App private subnet đọc/ghi S3 (upload ảnh, export report) | **Gateway endpoint** | không tốn tiền NAT, không phụ thuộc internet, chặn được bucket ngoài danh sách bằng endpoint policy |
| App cần Secrets Manager / KMS / STS | Interface endpoint | các dịch vụ này không có gateway endpoint |
| Gọi API đối tác ngoài internet | NAT gateway (hoặc egress qua firewall/proxy) | bắt buộc có đường ra công khai; Route 53 Resolver chỉ phân giải DNS, không thay NAT |
| Docker pull từ ECR trong private subnet | Interface endpoint {{ecr.api}} + {{ecr.dkr}} và gateway endpoint S3 | ECR image layer nằm trên S3; thiếu một trong ba là pull fail |

> Kiểm tra nhanh bằng DNS: từ trong subnet private, chạy {{nslookup s3.ap-southeast-1.amazonaws.com}}. Nếu trả về IP dạng {{52.x/54.x}} (public) thì bạn đang đi ra ngoài; nếu trả về IP nội bộ {{10.x}} thì interface endpoint đã hoạt động. Với gateway endpoint, DNS vẫn trả IP public nhưng **route table** kéo traffic về phía gateway endpoint.

### Ba lỗi mạng hay gặp khi đưa app Java lên AWS
1. **RDS trong private subnet nhưng app connect timeout**: app và DB ở hai subnet khác nhau, SG của DB chỉ cho một CIDR cũ, hoặc subnet group của DB đặt ở AZ khác AZ của app → cross-AZ vẫn chạy nhưng trả thêm phí data transfer mỗi chiều.
2. **Thiếu IP trong subnet khi scale**: /24 chỉ còn 251 IP dùng được; ECS task, ENI, RDS endpoint, NAT, endpoint interface đều ăn IP. Scale 200 task trên subnet /24 là fail âm thầm, phải tính CIDR theo **số ENI tối đa** dự kiến.
3. **Public subnet "có nghĩa là mở"**: subnet public + SG mở {{0.0.0.0/0}} port 8080 là để nguyên app ra internet. App luôn phải ở private subnet; chỉ tài nguyên nghe từ ngoài (ALB) ở public, và ALB đặt trước app.

### Liên hệ phỏng vấn
Câu hỏi thường gặp: "Thiết kế VPC cho hệ microservices của bạn thế nào?" (aws-003), "App không ra được internet, bạn debug gì?", "SG khác NACL ở chỗ nào, cho ví dụ NACL gây lỗi?" (aws-038), "Vì sao không đặt database ở public subnet?", "S3 từ private subnet đi đường nào, tốn gì?". Câu trả lời tốt luôn nêu **đường đi của gói tin** (client → IGW → ALB → NAT/endpoint → DB) và **tên lớp** đang chặn (SG hay NACL hay route), kèm cách xác nhận bằng **VPC Flow Logs** (log cho phép/từ chối từng gói, ghi ra CloudWatch Logs/S3) và **Reachability Analyzer** (đi ngược đường, chỉ ra đúng resource chặn).

> Senior tip: Khi một lỗi "network" chỉ xảy ra với vài request, đừng đoán: bật VPC Flow Logs cho ENI của app, lọc theo port và xem chiều {{REJECT}}. Flow Logs cho thấy packet **có tới** nhưng phản hồi **không về** — đó chính là chữ ký của NACL stateless, khác hẳn với SG thiếu rule (mọi request cùng pattern fail ngay). Và hãy đặt gateway endpoint cho S3 trước khi than NAT tốn tiền: hai thứ giải quyết cùng một vấn đề, một thứ miễn phí.`,
  exercises: [
    {
      title: 'Tự cài bộ đánh giá packet: CIDR, thứ tự rule NACL, SG stateful và bẫy ephemeral port',
      prompt: `Mô phỏng việc đánh giá một kết nối TCP đi vào một subnet. Không phải thuật toán đầy đủ của AWS, nhưng giữ đúng ba tính chất làm nên hầu hết lỗi ngoài đời: **SG chỉ có rule allow và stateful**, **NACL xét rule theo số thứ tự**, **NACL stateless nên chiều về phải có rule**.

Đã có sẵn: record {{Rule}}, constructor và helper {{matches(rule, ip, port)}}. Bạn cài 4 hàm:

1. {{cidrContains(cidr, ip)}}: {{cidr}} dạng {{10.0.1.0/24}}. Đổi cả hai phía về số nguyên rồi so bit: {{(a >> (32 - bits)) == (b >> (32 - bits))}}. Với {{/0}} thì mọi IP đều nằm trong dải.
2. {{firstMatch(rules, ip, port)}}: xét rule theo **{{number}} tăng dần** (số nhỏ hơn được xét trước, giống AWS); rule khớp đầu tiên quyết định: allow → {{"ALLOW"}}, deny → {{"DENY"}}, không rule nào khớp → {{"NONE"}}.
3. {{checkRequest(clientIp, clientPort, servicePort)}} cho chiều **đi vào** subnet:
  ▸ SG inbound: nếu **không** có rule allow nào khớp {{(clientIp, servicePort)}} → {{"DENY_SG"}}. SG không có khái niệm deny, nên rule có {{allow = false}} phải bị bỏ qua hoàn toàn.
  ▸ rồi NACL inbound: nếu {{firstMatch(naclIn, clientIp, servicePort)}} khác {{"ALLOW"}} → {{"DENY_NACL_IN"}}.
  ▸ qua cả hai → {{"ALLOW"}}.
4. {{checkResponse(clientIp, clientPort)}} cho chiều **đi ra** (subnet về client): SG **stateful** nên phản hồi của kết nối đã cho phép luôn được về, **không xét rule nào**; chỉ còn NACL outbound: {{firstMatch(naclOut, clientIp, clientPort)}} khác {{"ALLOW"}} → {{"DENY_NACL_OUT"}}, ngược lại {{"ALLOW"}}.

{{servicePort}} là port dịch vụ (443, 8080); {{clientPort}} là **ephemeral port** phía khách (1024–65535).

(AWS thật xét NACL **trước** SG. Ở đây xét SG trước rồi NACL: kết luận "được phép / bị chặn" không đổi vì cả hai lớp đều phải cho qua, chỉ khác nhau nhãn **nguyên nhân** mà bạn trả về.)`,
      starter: `record Rule(int number, boolean allow, String cidr, int portLo, int portHi) {}

class VpcFilter {
    private final List<Rule> sgIn;      // security group inbound: chi co rule ALLOW
    private final List<Rule> naclIn;    // NACL inbound: ALLOW + DENY, xet theo so th thu tu
    private final List<Rule> naclOut;   // NACL outbound: cung phai mo chieu ve cho khach

    VpcFilter(List<Rule> sgIn, List<Rule> naclIn, List<Rule> naclOut) {
        this.sgIn = sgIn;
        this.naclIn = naclIn;
        this.naclOut = naclOut;
    }

    static long ipToLong(String ip) {
        long v = 0;
        for (String part : ip.split("[.]")) v = v * 256 + Long.parseLong(part);
        return v;
    }

    static boolean matches(Rule r, String ip, int port) {
        return cidrContains(r.cidr(), ip) && port >= r.portLo() && port <= r.portHi();
    }

    static boolean cidrContains(String cidr, String ip) {
        throw new UnsupportedOperationException("TODO");
    }

    static String firstMatch(List<Rule> rules, String ip, int port) {
        throw new UnsupportedOperationException("TODO");
    }

    String checkRequest(String clientIp, int clientPort, int servicePort) {
        throw new UnsupportedOperationException("TODO");
    }

    String checkResponse(String clientIp, int clientPort) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void eq(String name, Object expected, Supplier<Object> actual) {
        total++;
        try {
            Object got = actual.get();
            if (Objects.equals(expected, got)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": mong doi " + expected + ", nhan " + got);
        } catch (RuntimeException e) {
            System.out.println("FAIL " + name + ": nem " + e);
        }
    }
    static Rule r(int n, boolean allow, String cidr, int lo, int hi) { return new Rule(n, allow, cidr, lo, hi); }
    public static void main(String[] args) {
        eq("/24 contains a host inside it", true, () -> VpcFilter.cidrContains("10.0.1.0/24", "10.0.1.77"));
        eq("/24 rejects the next block", false, () -> VpcFilter.cidrContains("10.0.1.0/24", "10.0.2.77"));
        eq("/16 boundary", false, () -> VpcFilter.cidrContains("10.0.0.0/16", "10.1.0.1"));
        eq("/16 inside", true, () -> VpcFilter.cidrContains("10.0.0.0/16", "10.0.255.254"));
        eq("/8 inside", true, () -> VpcFilter.cidrContains("10.0.0.0/8", "10.255.0.1"));
        eq("/8 rejects neighbour", false, () -> VpcFilter.cidrContains("10.0.0.0/8", "9.255.255.255"));
        eq("/0 matches everything", true, () -> VpcFilter.cidrContains("0.0.0.0/0", "203.0.113.9"));
        eq("/32 is one exact host", true, () -> VpcFilter.cidrContains("203.0.113.7/32", "203.0.113.7"));
        eq("/28 block is 16 addresses", true, () -> VpcFilter.cidrContains("192.168.1.0/28", "192.168.1.15"));
        eq("/28 just past the block", false, () -> VpcFilter.cidrContains("192.168.1.0/28", "192.168.1.16"));

        List<Rule> ordered = List.of(r(200, true, "0.0.0.0/0", 443, 443), r(100, false, "203.0.113.0/24", 0, 65535));
        eq("rule number decides, not list order", "DENY", () -> VpcFilter.firstMatch(ordered, "203.0.113.5", 443));
        eq("another source reaches the allow at 200", "ALLOW", () -> VpcFilter.firstMatch(ordered, "8.8.8.8", 443));
        eq("nothing matches = NONE", "NONE", () -> VpcFilter.firstMatch(ordered, "8.8.8.8", 22));

        VpcFilter https = new VpcFilter(
                List.of(r(1, true, "0.0.0.0/0", 443, 443)),
                List.of(r(100, true, "0.0.0.0/0", 443, 443)),
                List.of(r(100, true, "0.0.0.0/0", 1024, 65535)));
        eq("SG and NACL both pass", "ALLOW", () -> https.checkRequest("8.8.8.8", 51000, 443));
        eq("stateful path lets the reply out", "ALLOW", () -> https.checkResponse("8.8.8.8", 51000));
        eq("SG blocks a port it never opened", "DENY_SG", () -> https.checkRequest("8.8.8.8", 51000, 80));

        VpcFilter forgotEphemeral = new VpcFilter(
                List.of(r(1, true, "0.0.0.0/0", 443, 443)),
                List.of(r(100, true, "0.0.0.0/0", 443, 443)),
                List.of(r(100, true, "0.0.0.0/0", 443, 443)));
        eq("reply to client ephemeral port blocked by stateless NACL", "DENY_NACL_OUT",
                () -> forgotEphemeral.checkResponse("8.8.8.8", 51000));

        VpcFilter naclDeny = new VpcFilter(
                List.of(r(1, true, "0.0.0.0/0", 443, 443)),
                List.of(r(99, false, "203.0.113.0/24", 0, 65535), r(100, true, "0.0.0.0/0", 443, 443)),
                List.of(r(100, true, "0.0.0.0/0", 1024, 65535)));
        eq("NACL deny overrides SG allow", "DENY_NACL_IN", () -> naclDeny.checkRequest("203.0.113.9", 51000, 443));
        eq("but a clean source still gets in", "ALLOW", () -> naclDeny.checkRequest("8.8.8.8", 51000, 443));

        VpcFilter sgHasNoDeny = new VpcFilter(
                List.of(r(1, false, "203.0.113.0/24", 443, 443), r(2, true, "0.0.0.0/0", 443, 443)),
                List.of(r(100, true, "0.0.0.0/0", 443, 443)),
                List.of(r(100, true, "0.0.0.0/0", 1024, 65535)));
        eq("a deny-looking SG rule is simply ignored", "ALLOW", () -> sgHasNoDeny.checkRequest("203.0.113.9", 51000, 443));

        VpcFilter emptyOut = new VpcFilter(
                List.of(r(1, true, "0.0.0.0/0", 443, 443)),
                List.of(r(100, true, "0.0.0.0/0", 443, 443)),
                List.of());
        eq("empty NACL outbound = implicit deny", "DENY_NACL_OUT", () -> emptyOut.checkResponse("1.1.1.1", 5000));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Rule(int number, boolean allow, String cidr, int portLo, int portHi) {}

class VpcFilter {
    private final List<Rule> sgIn;
    private final List<Rule> naclIn;
    private final List<Rule> naclOut;

    VpcFilter(List<Rule> sgIn, List<Rule> naclIn, List<Rule> naclOut) {
        this.sgIn = sgIn;
        this.naclIn = naclIn;
        this.naclOut = naclOut;
    }

    static long ipToLong(String ip) {
        long v = 0;
        for (String part : ip.split("[.]")) v = v * 256 + Long.parseLong(part);
        return v;
    }

    static boolean matches(Rule r, String ip, int port) {
        return cidrContains(r.cidr(), ip) && port >= r.portLo() && port <= r.portHi();
    }

    static boolean cidrContains(String cidr, String ip) {
        int slash = cidr.indexOf('/');
        int bits = Integer.parseInt(cidr.substring(slash + 1));
        long base = ipToLong(cidr.substring(0, slash));
        if (bits == 0) return true;                  // /0: moi IP deu thuoc cung mot dai
        int shift = 32 - bits;
        return (base >>> shift) == (ipToLong(ip) >>> shift);  // dịch không dấu, an toàn với bit cao
    }

    static String firstMatch(List<Rule> rules, String ip, int port) {
        return rules.stream()
                .sorted(Comparator.comparingInt(Rule::number))   // số nhỏ hơn được xét trước
                .filter(r -> matches(r, ip, port))
                .map(r -> r.allow() ? "ALLOW" : "DENY")
                .findFirst()
                .orElse("NONE");                     // khong rule nao khop = cam mac dinh
    }

    String checkRequest(String clientIp, int clientPort, int servicePort) {
        boolean sgOk = sgIn.stream().anyMatch(r -> r.allow() && matches(r, clientIp, servicePort));
        if (!sgOk) return "DENY_SG";
        return "ALLOW".equals(firstMatch(naclIn, clientIp, servicePort)) ? "ALLOW" : "DENY_NACL_IN";
    }

    String checkResponse(String clientIp, int clientPort) {
        // SG stateful: phản hồi của kết nối đã được cho phép luôn được về, không xét rule.
        return "ALLOW".equals(firstMatch(naclOut, clientIp, clientPort)) ? "ALLOW" : "DENY_NACL_OUT";
    }
}`,
      hints: [
        'Doi IP sang so theo cach co ban nhat: {{v = v * 256 + octet}} cho 4 octet. Vi du {{10.0.1.77}} = 10*16777216 + 0*65536 + 1*256 + 77.',
        'Trong Java, cả {{int}} và {{long}} đều dùng số bit dịch chuyển có giới hạn ({{int}} lấy 5 bit thấp, {{long}} lấy 6 bit thấp), nên {{long >> 32}} là dịch 32 bit hop le. Voi {{/0}} thi {{shift = 32}} va ca 32 bit deu bi dich ra ngoai (ket qua phu thuoc cach ban xu ly day du); cach an toan: neu {{bits == 0}} tra ve {{true}}, nguoc lai dung {{(base >>> shift) == (ip >>> shift)}} voi {{long}} khong dau.',
        'SG không có rule deny: lọc {{r.allow()}} trước khi {{anyMatch}}, đúng đúng là {{anyMatch(matches)}}.',
        'Thứ tự của checkRequest là SG trước rồi mới đến NACL inbound; checkResponse không nhắc gì đến SG.',
      ],
      explain: `### Ba thu ban vua cai la ba thu gay loi nhai ngoai production
- **{{cidrContains}}** là lý do "subnet này còn IP không" và "rule có bắt traffic kia không" luôn phải được tính bằng bit, không bằng mắt. {{10.0.1.0/24}} không chứa {{10.0.2.x}}, và {{10.0.0.0/16}} không chứa {{10.1.0.1}} — hai nhầm lẫn phổ biến khi đặt CIDR cho VPC mới rồi lớn lên không còn chỗ.
- **{{firstMatch}} theo {{number}}** giải thích vì sao một rule "DENY 0.0.0.0/0" đặt ở số 100 **thắng** mọi rule ALLOW ở số 200. Trong AWS, số nhỏ hơn được xét trước và rule đầu khớp quyết định tất cả; đó là chỗ nhiều team "mở port mà vẫn không vào được".
- **{{checkResponse}} bỏ qua SG, chỉ xét NACL** chính là khác biệt stateful/stateless. SG nhớ "kết nối này tôi đã cho vào", nên phản hồi tự do. NACL không nhớ gì, nó xét từng gói độc lập → packet về client phải khớp một rule outbound, mà port của client là **ephemeral** (1024–65535), không phải 443.

### Lỗi hay gặp
- Dùng {{List.of(...)}} rồi assume thứ tự là thứ tự đánh giá: AWS đánh giá theo {{number}}, phải {{sorted}}.
- Cho rule deny của SG có tác dụng: SG chỉ có allow; muốn deny thì phải dùng NACL hoặc endpoint policy / WAF.
- Xét SG trong {{checkResponse}}: SG stateful nên chiều về của một kết nối đã cho phép không cần rule outbound; thêm rule outbound 443 "cho chắc" không giải quyết được gì và làm bạn lầm tưởng mình hiểu NACL.
- Quên {{NONE}} nghĩa là "cấm": NACL không khớp rule nào **không** có nghĩa là cho qua.

Ngoài đời còn thiếu: route table và longest prefix match (packet có thể bị chặn vì **không có đường đi**, không phải vì firewall), VPC peering không transitive, và việc Flow Logs chỉ ghi chiều mà ENI thực sự nhìn thấy.`,
    },
  ],
  check: [
    {
      q: 'Một ECS task trong private subnet gọi {{https://api.partner.com}} và kết nối timeout sau ~30 giây. Route table của subnet chỉ có {{10.0.0.0/16 → local}} và {{pl-123 → gateway endpoint S3}}. Nguyên nhân và cách sửa hợp lý nhất?',
      options: ['SG của task thiếu rule outbound 443, thêm rule là xong', 'Không có đường ra internet: route 0.0.0.0/0 thiếu và NAT gateway (hoặc một egress path) chưa được tạo; thêm route trỏ NAT', 'API đối tác chặn IP AWS, phải mở whitelist', 'NACL inbound chặn port 443, thêm rule inbound'],
      answer: 1,
      explain: `Private subnet muốn ra internet cần {{0.0.0.0/0 → NAT gateway}}. Ở đây route đó không tồn tại nên gói tin không có bước tiếp theo. SG mặc định cho toàn bộ outbound nên không phải thiếu rule outbound; NACL inbound liên quan chiều **vào**, không giải thích được timeout của một request chủ động đi ra. Whitelist IP đối tác là việc cần làm sau khi đã chứng minh có đường ra.`,
    },
    {
      q: 'Security group inbound mở 443 từ 0.0.0.0/0, NACL inbound mở 443 từ 0.0.0.0/0, NACL outbound chỉ mở 443. Khách hàng gọi HTTPS thì treo, ALB access log không có dòng nào. Chuyện gì đang xảy ra?',
      options: ['ALB đang scale nên request bị chậm', 'Request vào được nhưng packet phản hồi về ephemeral port (1024–65535) của khách bị NACL outbound chặn, vì NACL stateless; phải thêm rule cho dải ephemeral', 'Vì SG đã stateful nên ắt hẳn là lỗi ứng dụng', 'Cần bật gateway endpoint cho S3'],
      answer: 1,
      explain: `NACL xét từng gói độc lập. Chiều vào khớp rule 443, nhưng chiều về có đích là port tạm của client, không khớp rule 443 → bị cấm. Request đã vào nên client chờ, còn log ở tầng cao hơn không có gì để ghi — dấu hiệu điển hình. SG stateful chỉ giúp ở tầng của nó, không "vá" được NACL.`,
    },
    {
      q: 'App trong private subnet đọc/ghi một bucket S3 với lượng dữ liệu lớn. Cách nào vừa rẻ vừa bớt phụ thuộc internet?',
      options: ['Gắn public IP cho từng task để đi thẳng', 'Thêm gateway endpoint S3 cho VPC và route tới nó từ route table của private subnet', 'Tăng size NAT gateway', 'Chuyển app sang public subnet'],
      answer: 1,
      explain: `Gateway endpoint cho S3 (và DynamoDB) miễn phí, giữ traffic trong mạng AWS, không qua NAT/IGW và có thể gắn endpoint policy giới hạn bucket. Gắn public IP và chuyển sang public subnet làm surface tấn công lớn hơn; NAT gateway tính tiền theo GB nên càng nhiều dữ liệu càng tốn, không có "size" để tăng.`,
    },
    {
      q: 'Network ACL có rule số 300 ALLOW 443 từ 0.0.0.0/0 và rule số 100 DENY 100.20.30.0/24 toàn bộ port. Khách 100.20.30.5 gọi port 443 thì kết quả là?',
      options: ['Được, vì rule ALLOW rộng hơn', 'Bị chặn, vì NACL xét theo số thứ tự và rule đầu tiên khớp (số 100 DENY) thắng', 'Bị chặn chỉ khi security group cũng có rule deny', 'Không xác định được, NACL đánh giá ngẫu nhiên'],
      answer: 1,
      explain: `NACL khớp rule theo thứ tự số tăng dần; rule đầu khớp quyết định, ở đây là DENY ở số 100. SG không có rule deny nên phương án "SG cũng có deny" không tồn tại; và thứ tự đánh giá là xác định, không ngẫu nhiên. Muốn cho khách này qua thì phải đổi số hoặc thu hẹp dải của rule deny.`,
    },
  ],
  related: ['aws-003', 'aws-038', 'aws-035', 'aws-037', 'aws-024'],
  tags: ['VPC', 'CIDR', 'subnet', 'route table', 'security group', 'NACL', 'NAT gateway', 'VPC endpoint', 'PrivateLink', 'VPC Flow Logs'],
},
{
  id: 'lesson-aws-006',
  track: 'aws',
  order: 6,
  title: 'DynamoDB cho dev Java: partition key, sort key, query vs scan, conditional write và khoá lạc quan',
  level: 'senior',
  minutes: 50,
  goals: [
    'Giải thích partition key quyết định vật lý dữ liệu nằm ở đâu và vì sao chọn sai khoá là cả bảng chậm',
    'Phân biệt GetItem, Query, Scan về chi phí và về thứ tự kết quả trả về',
    'Tính được sơ bộ số RCU/WCU của một thao tác và chọn on-demand hay provisioned',
    'Viết conditional write để tránh ghi đè và để làm khoá lạc quan (optimistic locking)',
    'Biết GSI, TTL, Streams giải quyết việc gì và khi nào KHÔNG nên dùng DynamoDB',
  ],
  body: `### DynamoDB giải bài toán nào
DynamoDB là database **key-value dạng document, serverless**: bạn không chọn instance, không sharding, không patch; AWS tự nhân bản dữ liệu qua ít nhất 3 AZ và giữ độ trễ đọc/ghi cỡ **vài mili giây kể cả khi tải tăng 10 lần**. Cái giá phải trả: **không có SQL, không có join, không có ràng buộc ngoại khoá**, và mọi hiệu năng đều phụ thuộc vào việc bạn thiết kế **khoá** như thế nào. Đây là điểm dev Java thường sốc: ở RDS bạn viết query trước rồi chỉ mục sau; ở DynamoDB bạn phải liệt kê **access pattern** (ai hỏi gì, hỏi thế nào) **trước**, rồi mới đặt tên bảng.

Dữ liệu là **item** (một JSON nhỏ, tối đa **400 KB**) trong một **bảng**. Mỗi bảng định nghĩa bởi **primary key**:
- chỉ **partition key** ({{pk}}), ví dụ bảng {{users}} với {{pk = email}}, hoặc
- **{{pk}} + sort key ({{sk}})**, ví dụ {{pk = "customer#C42"}}, {{sk = "order#1730000000000"}}.

~~~text
  DynamoDB về mặt vật lý:  nhiều "partition" (bình chứa), mỗi bình chứa nhiều item

     hash(pk) -->  [ partition P1 ]  [ P2 ]  [ P3 ] ... [ Pn ]
                        |
        items co cung pk nam CUNG MOT binh, sap theo sk:
          customer#C42 | order#1730000000001
          customer#C42 | order#1730000000002     <- cùng partition = đọc được bằng 1 Query
          customer#C42 | profile
~~~

### Partition key: chọn sai là không vá được
{{pk}} được hash để chọn partition. Hệ quả:
- **Một thao tác GetItem/Query luôn nằm trong đúng một partition.** Đó là lý do nó nhanh và chi phí dự đoán được.
- **Toàn bộ item có cùng {{pk}} bị giới hạn bởi sức chứa của một partition** (AWS khuyến nghị giữ dưới ~10 GB cho một giá trị khoá).
- **Hot partition**: nếu một giá trị {{pk}} chiếm phần lớn traffic thì bình đó tràn, còn cả bảng đứng nhìn. Ví dụ thật hay gặp: {{pk = "tenant-acme"}}, hoặc {{pk = status}} (chỉ 4 giá trị!), hoặc {{pk = "2026-11"}} khi một tháng gom mọi đơn.

Cách chọn: {{pk}} phải có **cardinality cao** và traffic **phân tán đều** theo đúng đơn vị truy vấn. Cần thống kê theo tháng thì thêm prefix thời gian vào {{sk}} ({{pk = "customer#C42"}}, {{sk = "order#2026-11#000173"}}), đừng biến tháng thành {{pk}}.

Thứ tự {{sk}} là **thứ tự byte (từ điển)**, không phải thứ tự số: {{order#2}} nằm **sau** {{order#10}}. Muốn sort đúng nghĩa, zero-pad ({{order#0010}}) hoặc dùng epoch milliseconds (13 chữ số luôn so sánh được bằng chuỗi).

### GetItem, Query, Scan: ba mức tiền khác nhau
| Thao tác | Đọc gì | Chi phí | Dùng khi |
|---|---|---|---|
| {{GetItem}} | đúng một item theo {{pk}}(+{{sk}}) | rẻ nhất, 1 đơn vị đọc cho item nhỏ | mở chi tiết đơn hàng, profile |
| {{BatchGetItem}} | tới 100 item (trần 16 MB) | mỗi item vẫn tính riêng | "trang chủ cần 40 đơn gần nhất" mà không dùng Query được |
| {{Query}} | mọi item của **một** {{pk}}, lọc thêm theo {{sk}} ({{begins_with}}, {{between}}), trả về **theo thứ tự {{sk}}** | tỉ lệ với số item trong partition | danh sách đơn của một khách, timeline |
| {{Scan}} | **quét cả bảng** rồi mới lọc bằng {{FilterExpression}} | đắt nhất, trả tiền cho cả dữ liệu bị bỏ | debug, export bảng nhỏ, job một lần |

> {{FilterExpression}} áp dụng **sau khi** đã đọc dữ liệu: bạn vẫn trả tiền cho phần đã đọc. Người mới hay viết "query với filter" rồi tưởng nó rẻ như chỉ mục SQL — ở DynamoDB muốn lọc nhanh trên một thuộc tính khác thì phải đưa thuộc tính đó vào **khoá** hoặc **GSI**.

### Capacity: tiền được tính bằng đơn vị, không bằng GB
- **1 RCU** (read capacity unit) = **1 lần đọc strongly consistent** / giây cho item tối đa **4 KB**, hoặc **2 lần đọc eventually consistent** / giây cho item 4 KB. Nghĩa là đọc strongly consistent **đắt gấp đôi** ở cùng lượng dữ liệu. Item 5 KB tính 2 đơn vị 4 KB (làm tròn lên **theo từng item**).
- **1 WCU** = **1 lần ghi** / giây cho item tối đa **1 KB** — chú ý cỡ granularity khác hẳn khi đọc (1 KB so với 4 KB), item 2 KB ghi tốn 2 WCU.
- **On-demand**: trả tiền theo số request thật, phù hợp tải khó đoán hoặc mới thử nghiệm; đắt hơn mỗi đơn vị nhưng không cần ước lượng. **Provisioned**: đặt RCU/WCU + **auto scaling** cho chúng; rẻ hơn nhiều khi tải đều, nhưng phải ước lượng và có trần, vượt trần là gặp {{ProvisionedThroughputExceededException}}.
- Query trả về **một trang** (mặc định 1 MB hoặc {{Limit}}); còn dữ liệu thì kèm {{LastEvaluatedKey}} → bạn phải dùng nó làm {{ExclusiveStartKey}} cho lần sau. Dev Java hay quên bước này và tưởng "mất dữ liệu".

### Ghi có điều kiện và khoá lạc quan
{{PutItem}} thông thường là **upsert**: ghi đè toàn bộ item, kể cả khi người khác vừa sửa. Muốn an toàn, dùng **conditional write** — điều kiện được đánh giá **phía server, nguyên tử trong một item**:
- {{attribute_not_exists(pk)}} → "chỉ tạo nếu chưa tồn tại" (chống tạo trùng, chống ghi đè đơn đã có).
- {{attribute_exists(pk)}} → "chỉ cập nhật nếu đang tồn tại".
- so sánh: {{version = :v}}, {{stock > :qty}}.

Mẫu **khoá lạc quan (optimistic locking)**: mỗi item mang một {{version}}; đọc → sửa → ghi kèm điều kiện {{version}} không đổi, và ghi {{version + 1}}. Ai thua sẽ nhận {{ConditionalCheckFailedException}} và quyết định đọc lại/bỏ/merge. Không có khoá đang giữ, không có ai chết vì giữ lock — đúng tinh thần của một hệ phân tán.

~~~seq
title: Hai worker cung tru ton kho version 7
actors: Worker A | Worker B | DynamoDB
Worker A -> DynamoDB: GetItem sku-1 (version 7)
Worker B -> DynamoDB: GetItem sku-1 (version 7)
Worker A -> DynamoDB: PutItem version 8, dieu kien version = 7
DynamoDB --> Worker A: OK, da tru 1
Worker B -> DynamoDB: PutItem version 8, dieu kien version = 7
DynamoDB --> Worker B: ConditionalCheckFailedException
note Worker B: doc lai (version 8) roi moi try lan 2
~~~

Cần nhiều item/nhiều bảng cùng lúc thì dùng **TransactWriteItems** (tối đa 100 operation, hoặc check condition / put / update / delete): bảo đảm atomicity theo nghĩa all-or-nothing nhưng **tốn gấp đôi** và chậm hơn; đừng biến mọi nghiệp vụ thành transaction khi một conditional write trên một item là đủ.

### Java SDK v2 (Enhanced Client)
~~~java
@DynamoDbBean
public class Order {
    private String pk;   // "customer#C42"          -> partition key
    private String sk;   // "order#1730000000000"   -> sort key (epoch ms: so sánh được bằng chuỗi)
    private long totalCents;
    private String status;
    @DynamoDbPartitionKey public String getPk() { return pk; }
    @DynamoDbSortKey      public String getSk() { return sk; }
    // getter/setter cho totalCents, status
}

DynamoDbTable<Order> table = DynamoDbEnhancedClient.builder()
        .dynamoDbClient(ddb)                 // client tạo 1 lần, không truyền credentials: SDK tự lấy role
        .build()
        .table("orders", TableSchema.fromBean(Order.class));

// 1 Query cho "mọi đơn của khách C42 trong tháng 11", trả về theo thứ tự sk
PageIterable<Order> page = table.query(QueryEnhancedRequest.builder()
        .queryConditional(QueryConditional.sortBeginsWith(KeyPair.of("customer#C42", "order#1730")))
        .build());

// "Chỉ tạo nếu chưa tồn tại" -> chong ghi de don da thanh toán
table.putItem(PutItemEnhancedRequest.builder(Order.class)
        .item(ready)
        .conditionExpression(ConditionExpression.builder()
                .values("attribute_not_exists(pk)").build())
        .build());
~~~

### GSI, sparse index, TTL, Streams
- **GSI (Global Secondary Index)**: một "khoá phụ" có {{pk}}/{{sk}} riêng, tạo và sửa được sau khi bảng đã chạy. Nó **nhận bản sao** những item có các attribute cần index → viết tốn thêm WCU của index. Query theo thuộc tính mà bảng chính không index được thì bắt buộc phải có GSI.
- **Sparse GSI**: một GSI chỉ chứa item **có** các attribute khoá của nó. Đây là cách tạo "chỉ mục cho một tập con" — ví dụ GSI {{(gsi_status, gsi_dueAt)}} chỉ ghi khi item là task đến hạn; muốn "huỷ chỉ mục" chỉ cần xoá attribute. Rất nhiều thiết kế single-table sống nhờ trick này.
- **LSI (Local Secondary Index)**: dùng {{pk}} của bảng chính, thay {{sk}} — **phải khai báo lúc tạo bảng**, không đổi sau này.
- **TTL**: chọn một attribute chứa epoch giây, DynamoDB tự xoá item hết hạn (không phải giao dịch, độ trễ vài phút tới vài giờ) → hợp cho session, mã OTP, bản ghi tạm; **không** dùng làm nghiệp vụ "đúng giờ".
- **Streams**: ghi lại mọi thay đổi item (kênh NEW_IMAGE/OLD_IMAGE) → thường gắn **Lambda** để đồng bộ sang OpenSearch, đổ sang S3, hoặc chạy side effect (gửi email khi đơn chuyển {{PAID}}). Muốn replay thì cấu hình {{LatestStreamViewType}} và giữ 24 giờ.

### Khi nào KHÔNG nên dùng DynamoDB
| Nhu cầu | DynamoDB | Nên dùng |
|---|---|---|
| Báo cáo ad-hoc, "cho tôi số đơn theo khu vực tháng này" | Tệ: phải scan hoặc thiết kế index trước | RDS/Aurora + SQL, hoặc Redshift/Athena |
| Quan hệ nhiều bảng, ràng buộc toàn vẹn, join sâu | Không có | RDS/Aurora |
| Giao dịch ACID nhiều bảng, complex | TransactWrite có giới hạn | Aurora (hoặc tách nghiệp vụ + saga) |
| Đọc theo một trong 20 thuộc tính khác nhau | Phải 20 GSI, mỗi GSI ăn WCU | RDS + chỉ mục, hoặc thiết kế lại single-table |
| OLTP truy vấn theo khoá, tải cao khó đoán, cần độ trễ ổn định | **Rất hợp** | — |

### Liên hệ phỏng vấn
Câu hay gặp: "Partition key/sort key ảnh hưởng gì?" (aws-006), "RDS, Aurora, DynamoDB chọn cái nào?" (aws-005), "Vì sao không dùng Scan?", "Hai worker cùng trừ tồn kho thì làm sao không bán vượt?", "Khi nào nên đặt ElastiCache/Redis chắn trước DynamoDB?" (aws-011). Cấu trúc trả lời ghi điểm: **(1)** liệt kê access pattern, **(2)** đề xuất {{pk}}/{{sk}} và giải thích sự phân tán traffic, **(3)** chỉ ra chỗ cần GSI/sparse GSI, **(4)** nêu cách chống ghi đè bằng conditional write, **(5)** nói rõ chi phí (RCU/WCU hoặc on-demand) và điểm giới hạn.

> Senior tip: Hãy nói to quy tắc "một partition = một đơn vị khả năng phục vụ" khi trả lời. Người phỏng vấn Senior/Lead không chấm việc bạn biết API, mà chấm việc bạn tránh được hot partition: ví dụ {{pk = "customer#C42"}} cho 50 triệu đơn vẫn ổn nếu khách lớn nhất có 20.000 đơn, nhưng {{pk = "order-by-day"}} sẽ nổ vào ngày sale. Và luôn hỏi "bảng này có cần transactions không?" — vì TransactWriteItems tốn gấp đôi, nếu câu trả lời "thực ra chỉ cần một item" thì conditional write rẻ hơn hẳn.`,
  exercises: [
    {
      title: 'Cài DynamoDB mô phỏng: thứ tự sort key, conditional write và tính capacity',
      prompt: `Mô phỏng một bảng DynamoDB trong bộ nhớ (đơn giản hoá: mỗi item là {{Map<String,String>}}, attribute {{"v"}} là version dùng cho khoá lạc quan).

Đã có sẵn: record {{PKey}}, record {{Item}} ({{get(name)}} trả attribute), {{put(pk, sk, attrs)}} (lưu bản sao attrs và stamp {{"v" = "1"}}), {{get(pk, sk)}} (trả {{null}} khi không có). Bạn cài 3 hàm:

1. {{query(pk, skPrefix)}}: trả về mọi item có cùng {{pk}} và {{sk}} bắt đầu bằng {{skPrefix}} ({{skPrefix}} rỗng = lấy cả partition), **sắp xếp tăng dần theo {{sk}} theo thứ tự từ điển** — đúng như DynamoDB làm. Mỗi phần tử là một {{Item}}.
2. {{conditionalPut(pk, sk, expectedVersion, attrs)}}:
  ▸ version hiện tại của item = giá trị {{"v"}}, coi là **0** nếu item chưa tồn tại;
  ▸ nếu version hiện tại khác {{expectedVersion}} → trả {{false}} và **không ghi gì cả**;
  ▸ nếu bằng → lưu {{attrs}} kèm {{"v"}} = {{expectedVersion + 1}}, trả {{true}}.
  ({{expectedVersion = 0}} chính là {{attribute_not_exists}}: chỉ tạo khi chưa có.)
3. {{capacityUnits(sizes, read, stronglyConsistent)}}: {{sizes}} là kích thước (byte) của từng item trong một batch đọc/ghi, trả về **số RCU hoặc WCU cần cho 1 request/giây** đó:
  ▸ ghi ({{read = false}}): tổng {{ceil(size / 1024)}} **theo từng item** (granularity của ghi là 1 KB);
  ▸ đọc ({{read = true}}): gọi {{u = tổng ceil(size / 4096)}} theo từng item (granularity của đọc là 4 KB); nếu {{stronglyConsistent}} trả {{u}}, ngược lại trả {{(u + 1) / 2}} vì một RCU chịu được hai lần đọc 4 KB eventually consistent.
  Hai điều cần giữ đúng: làm tròn **từng item rồi mới cộng** ({{100, 4000}} tốn 2 đơn vị chứ không phải 1), và đọc strongly consistent luôn bằng **hai lần** đọc eventually consistent.

(Đơn giản hoá so với AWS: BatchWriteItem thật cộng kích thước cả batch theo khối 25 KB, transaction tốn gấp đôi, và số RCU thật còn phụ thuộc số request mỗi giây chứ không phải mỗi batch. Ở đây mỗi batch được tính như một request.)`,
      starter: `record PKey(String pk, String sk) {}

record Item(PKey key, Map<String,String> attrs) {
    String get(String name) { return attrs.get(name); }
}

class FakeDynamo {
    private final Map<PKey, Map<String,String>> data = new LinkedHashMap<>();

    void put(String pk, String sk, Map<String,String> attrs) {
        Map<String,String> copy = new TreeMap<>(attrs);   // bản sao, không giữ reference của caller
        copy.put("v", "1");
        data.put(new PKey(pk, sk), copy);
    }

    Item get(String pk, String sk) {
        Map<String,String> a = data.get(new PKey(pk, sk));
        return a == null ? null : new Item(new PKey(pk, sk), a);
    }

    List<Item> query(String pk, String skPrefix) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean conditionalPut(String pk, String sk, long expectedVersion, Map<String,String> attrs) {
        throw new UnsupportedOperationException("TODO");
    }

    static long capacityUnits(List<Long> sizes, boolean read, boolean stronglyConsistent) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void eq(String name, Object expected, Supplier<Object> actual) {
        total++;
        try {
            Object got = actual.get();
            if (Objects.equals(expected, got)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": mong doi " + expected + ", nhan " + got);
        } catch (RuntimeException e) {
            System.out.println("FAIL " + name + ": nem " + e);
        }
    }
    static String dump(List<Item> items) {
        return items.stream().map(i -> i.key().sk() + "=" + i.get("total")).collect(Collectors.joining(","));
    }
    public static void main(String[] args) {
        FakeDynamo db = new FakeDynamo();
        db.put("acct-1", "order#0002", Map.of("total", "20"));
        db.put("acct-1", "order#0010", Map.of("total", "100"));
        db.put("acct-1", "order#0001", Map.of("total", "15"));
        db.put("acct-1", "profile", Map.of("total", "-"));
        db.put("acct-2", "order#0001", Map.of("total", "7"));

        eq("get on missing key is null", null, () -> db.get("acct-9", "order#1"));
        eq("get returns attributes", "20", () -> db.get("acct-1", "order#0002").get("total"));
        eq("put stamps version 1", "1", () -> db.get("acct-1", "order#0002").get("v"));
        eq("empty prefix reads whole partition, sorted by sk",
                "order#0001=15,order#0002=20,order#0010=100,profile=-", () -> dump(db.query("acct-1", "")));
        eq("begins_with filters like a sk condition",
                "order#0001=15,order#0002=20", () -> dump(db.query("acct-1", "order#000")));
        eq("query never crosses the partition", "order#0001=7", () -> dump(db.query("acct-2", "order#")));
        eq("unknown partition is empty", "", () -> dump(db.query("acct-3", "")));

        FakeDynamo pad = new FakeDynamo();
        pad.put("x", "item#2", Map.of("total", "b"));
        pad.put("x", "item#10", Map.of("total", "a"));
        eq("sort key order is lexicographic, not numeric (zero-pad!)",
                "item#10=a,item#2=b", () -> dump(pad.query("x", "")));

        eq("create-condition fails on existing item", false,
                () -> db.conditionalPut("acct-1", "order#0002", 0, Map.of("total", "999")));
        eq("rejected write changed nothing", "20", () -> db.get("acct-1", "order#0002").get("total"));
        eq("conditional write with right version succeeds", true,
                () -> db.conditionalPut("acct-1", "order#0002", 1, Map.of("total", "21")));
        eq("version bumped to 2", "2", () -> db.get("acct-1", "order#0002").get("v"));
        eq("stale version loses the race", false,
                () -> db.conditionalPut("acct-1", "order#0002", 1, Map.of("total", "22")));
        eq("winner value still there", "21", () -> db.get("acct-1", "order#0002").get("total"));
        eq("create path when expected version 0", true,
                () -> db.conditionalPut("acct-1", "order#0003", 0, Map.of("total", "5")));
        eq("created item has version 1", "1", () -> db.get("acct-1", "order#0003").get("v"));
        eq("second create is rejected", false,
                () -> db.conditionalPut("acct-1", "order#0003", 0, Map.of("total", "6")));
        eq("conditional write can create in another partition", true,
                () -> db.conditionalPut("acct-5", "order#0001", 0, Map.of("total", "3")));
        eq("item written conditionally is queryable", "order#0001=3", () -> dump(db.query("acct-5", "order#")));

        eq("write of a tiny item is one WCU", 1L, () -> FakeDynamo.capacityUnits(List.of(1L), false, false));
        eq("write granularity is 1 KB: 1024 bytes is one WCU", 1L, () -> FakeDynamo.capacityUnits(List.of(1024L), false, false));
        eq("write rounds up per item: 1025 bytes is two WCU", 2L, () -> FakeDynamo.capacityUnits(List.of(1025L), false, false));
        eq("write of 100 + 2000 bytes = 1 + 2 WCU", 3L,
                () -> FakeDynamo.capacityUnits(List.of(100L, 2000L), false, false));
        eq("strongly consistent read of 5 KB needs 2 RCU", 2L, () -> FakeDynamo.capacityUnits(List.of(5000L), true, true));
        eq("read rounds up per item, not per sum", 2L,
                () -> FakeDynamo.capacityUnits(List.of(100L, 4000L), true, true));
        eq("eventually consistent read is half the RCU", 1L, () -> FakeDynamo.capacityUnits(List.of(4097L), true, false));
        eq("four small items strongly consistent = 4 RCU", 4L,
                () -> FakeDynamo.capacityUnits(List.of(100L, 100L, 100L, 100L), true, true));
        eq("the same four items eventually consistent = 2 RCU", 2L,
                () -> FakeDynamo.capacityUnits(List.of(100L, 100L, 100L, 100L), true, false));
        eq("one small eventually consistent read still costs 1 RCU", 1L,
                () -> FakeDynamo.capacityUnits(List.of(100L), true, false));
        eq("a 30 KB item is 8 read units", 8L, () -> FakeDynamo.capacityUnits(List.of(30000L), true, true));
        eq("strong flag does not change a write", 2L,
                () -> FakeDynamo.capacityUnits(List.of(100L, 1000L), false, true));
        eq("empty batch is free", 0L, () -> FakeDynamo.capacityUnits(List.of(), true, true));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record PKey(String pk, String sk) {}

record Item(PKey key, Map<String,String> attrs) {
    String get(String name) { return attrs.get(name); }
}

class FakeDynamo {
    private final Map<PKey, Map<String,String>> data = new LinkedHashMap<>();

    void put(String pk, String sk, Map<String,String> attrs) {
        Map<String,String> copy = new TreeMap<>(attrs);
        copy.put("v", "1");
        data.put(new PKey(pk, sk), copy);
    }

    Item get(String pk, String sk) {
        Map<String,String> a = data.get(new PKey(pk, sk));
        return a == null ? null : new Item(new PKey(pk, sk), a);
    }

    List<Item> query(String pk, String skPrefix) {
        Map<String, Item> bySk = new TreeMap<>();       // TreeMap = thu tu tu dien tang dan theo sk
        for (Map.Entry<PKey, Map<String,String>> e : data.entrySet()) {
            PKey k = e.getKey();
            if (k.pk().equals(pk) && k.sk().startsWith(skPrefix)) {
                bySk.put(k.sk(), new Item(k, e.getValue()));
            }
        }
        return new ArrayList<>(bySk.values());
    }

    boolean conditionalPut(String pk, String sk, long expectedVersion, Map<String,String> attrs) {
        PKey key = new PKey(pk, sk);
        Map<String,String> cur = data.get(key);
        long current = (cur == null) ? 0L : Long.parseLong(cur.getOrDefault("v", "1"));
        if (current != expectedVersion) return false;   // thua cuoc: khong ghi gi ca
        Map<String,String> copy = new TreeMap<>(attrs);
        copy.put("v", String.valueOf(expectedVersion + 1));
        data.put(key, copy);
        return true;
    }

    static long capacityUnits(List<Long> sizes, boolean read, boolean stronglyConsistent) {
        long units = 0;
        if (read) {
            for (long s : sizes) units += (s + 4095) / 4096;       // bo 4 KB, lam tron LEN tung item
            return stronglyConsistent ? units : (units + 1) / 2;   // EC doc = mot nua so RCU
        }
        for (long s : sizes) units += (s + 1023) / 1024;           // ghi tinh theo bo 1 KB
        return units;
    }
}`,
      hints: [
        'Muốn lấy theo thứ tự {{sk}} tăng dần mà không cần thủ công sắp xếp: gom vào {{TreeMap<String, Item>}} với key là {{sk}}, rồi lấy {{values()}} (bỏ vào {{ArrayList}} de co List).',
        'Đi qua từng phần tử của {{data.entrySet()}} và kiểm tra {{k.pk().equals(pk)}} cùng {{k.sk().startsWith(skPrefix)}}. Với {{skPrefix}} rỗng, {{startsWith("")}} luon dung nen pham vi la ca partition.',
        'Version hiện tại: item không tồn tại là 0; nếu có thì {{Long.parseLong}} từ attribute {{"v"}}. So sánh **trước khi** ghi, và khi reject thì không được chạm vào {{data}}.',
        'Lam tron len boi so ma khong can so thuc: {{(s + 4095) / 4096}} cho block doc 4 KB, {{(s + 1023) / 1024}} cho block ghi 1 KB; {{Math.ceil}} tren so nguyen se ra 0 mai mai.',
        'Đọc eventually consistent = **một nửa** RCU: {{(units + 1) / 2}} (làm tròn lên để không được tiêu 0 cho một batch không rỗng).',
      ],
      explain: `### Cai ban vua viet chinh la ba dieu quyet dinh hieu nang va hoa don
- **{{query}} chi doc MỘT partition** và trả kết quả đã sắp theo {{sk}}. Đó là toàn bộ lý do DynamoDB nhanh: nó biết chính xác bình chứa nào cần mở. {{Scan}} thì phải mở mọi bình — hãy tưởng tượng nó như {{SELECT *}} rồi lọc ở client, chi phí tỉ lệ với **kích thước bảng**, không phải số dòng thoả điều kiện.
- **Thứ tự từ điển của {{sk}}**: bài test "item#10" trước "item#2" không phải chuyện vui. Ngoài đời nó là lỗi "trang 2 lặp lại đơn của trang 1" hoặc "không bao giờ lấy được đơn thứ 100", và cách sửa là **zero-pad hoặc epoch ms** ngay từ thiết kế khoá.
- **{{conditionalPut}} chạy phía server, nguyên tử trên một item**: hai worker cùng đọc version 7 thì chỉ một PutItem điều kiện thành công. Đây là cách làm idempotent/optimistic lock mà không cần bảng lock, không cần {{SELECT FOR UPDATE}}, và cũng là cách viết consumer an toàn cho queue at-least-once (aws-008): điều kiện {{attribute_not_exists(eventId)}} chính là unique constraint của bảng {{processed_events}}.

### Lỗi hay gặp
- Quên bước kiểm tra version và ghi luôn: mất cập nhật của người khác (lost update), đúng cái bug mà conditional write sinh ra để chặn.
- Đọc version bằng {{Integer.parseInt}} trên attribute không tồn tại → {{NullPointerException}}/{{NumberFormatException}}; phải có giá trị mặc định.
- Cộng tổng size rồi làm tròn một lần: {{List.of(100, 4000)}} ra 1 đơn vị thay vì 2, và dùng {{ceil(size / 4096)}} bằng số nguyên thì luôn ra 0 vì phép chia nguyên đã cắt trước khi làm tròn.
- Tưởng ghi cũng tính theo 4 KB: ghi có granularity **1 KB**, nên một item 2 KB tốn 2 WCU — ước lượng thấp WCU nghĩa là {{ProvisionedThroughputExceededException}} đúng lúc tải đỉnh, tức lúc khách đang đặt hàng.
- Quên rằng đọc eventually consistent chỉ mất **một nửa** RCU: bật strongly consistent cho mọi read là trả gấp đôi hoá đơn cho một tính chất bạn thường không cần (UI hiển thị danh sách thì EC đủ; chỉ kiểm tra "tôi vừa ghi thành công chưa" mới cần strong).

Mặt khác của bài tập: DynamoDB **không** có transaction ở đây, không có pagination ({{LastEvaluatedKey}}), không có GSI, không có dung lượng thật theo thời gian. Nhưng nếu bạn giải thích được vì sao query cần {{pk}}, vì sao {{sk}} là thứ tự chuỗi và vì sao ghi phải có điều kiện, bạn đã trả lời được 90% câu phỏng vấn về DynamoDB.`,
    },
  ],
  check: [
    {
      q: 'Bảng {{orders}} có {{pk = customer_id}}, {{sk = order_id}}. Câu nào ĐÚNG về "{{cho tôi 20 đơn gần nhất của khách C42}}"?',
      options: ['Dùng Scan với FilterExpression status = SHIPPED rồi lấy 20 kết quả đầu', 'Dùng Query với {{pk = C42}} và điều kiện sk, lấy trang đầu tiên (kèm LastEvaluatedKey nếu còn)', 'Dùng GetItem với pk = C42', 'Phải tạo GSI trên customer_id vì đó không phải sort key'],
      answer: 1,
      explain: `{{pk = customer_id}} nghĩa là mọi đơn của C42 nằm trong một partition và đã được sắp theo {{sk}} → một Query là xong. Scan trả tiền cho cả bảng; GetItem cần đủ cả khoá để lấy đúng MỘT item; customer_id đã là partition key nên không cần GSI. Muốn "gần nhất" thì sk phải là epoch ms hoặc zero-pad (Query có {{ScanIndexForward = false}} để đọc ngược).`,
    },
    {
      q: 'Hai service cùng đọc item {{sku-1}} ({{stock = 5}}) rồi mỗi bên ghi {{stock = 4}} bằng {{PutItem}} thường. Chuyện gì xảy ra và sửa thế nào?',
      options: ['DynamoDB phát hiện xung đột và tự retry cho bên thứ hai', 'Một bên ghi đè bên kia (lost update): cần conditional write theo {{version}}, bên thua nhận ConditionalCheckFailed rồi đọc lại; nếu cần nhiều item thì dùng TransactWriteItems', 'Giao dịch tự động bị từ chối vì thiếu lock', 'Không sao, vì PutItem là atomic theo từng attribute'],
      answer: 1,
      explain: `{{PutItem}} là upsert toàn item và ai ghi sau thắng, nên tồn kho giảm sai. DynamoDB không có "lock" để phát hiện và cũng không tự retry nghiệp vụ: bạn phải đưa điều kiện {{version = :v}} (hoặc {{stock > :qty}}) để server từ chối bản cũ, và chỉ dùng TransactWriteItems khi nghiệp vụ chạm nhiều item/nhiều bảng (tốn gấp đôi). PutItem thay thế cả item, không merge attribute.`,
    },
    {
      q: 'Bạn muốn lọc "các đơn PENDING quá hạn" mà {{pk = customer_id}}. Cách nào hợp lý nhất?',
      options: ['Query theo pk rồi lọc status ở Java', 'Scan toàn bảng mỗi 5 phút với FilterExpression', 'Thêm GSI mà chỉ item PENDING được ghi các attribute khoá của nó (sparse GSI), ví dụ {{(gsi_pk = "PENDING", gsi_sk = dueAt)}}, rồi Query GSI đó', 'Đổi pk thành status để gom mọi PENDING vào một partition'],
      answer: 2,
      explain: `Sparse GSI cho đúng hình dạng truy vấn: item chỉ xuất hiện khi có attribute index, nên "pending theo dueAt" trở thành một Query rẻ và có thứ tự. Lọc ở Java vẫn phải đọc cả partition; Scan trả tiền theo cả bảng và càng ngày càng tệ; đổi {{pk = status}} tạo hot partition khổng lồ (mọi PENDING trong một bình) — exactly sai lầm cần tránh.`,
    },
    {
      q: 'Bảng provisioned của bạn đọc 1.000 item mỗi giây, mỗi item khoảng 5 KB, với read strongly consistent. Sơ bộ cần bao nhiêu RCU?',
      options: ['1.000 RCU', '2.000 RCU', '4.000 RCU', '5.000 RCU'],
      answer: 1,
      explain: `Làm tròn **theo từng item**: 5 KB → 2 khối 4 KB. Strongly consistent tính 1 RCU cho mỗi khối đọc mỗi giây, nên 2 đơn vị/item × 1.000 item/giây = **2.000 RCU**. Nếu chuyển sang eventually consistent chỉ còn 1.000 RCU, vì một RCU chịu được hai lần đọc 4 KB EC. Sai phổ biến: 5.000 (nhân theo KB thay vì theo khối 4 KB), 4.000 (nhân đôi trên đầu con số vốn đã là strongly consistent), 1.000 (quên làm tròn từng item).`,
    },
  ],
  related: ['aws-005', 'aws-006', 'aws-011'],
  tags: ['DynamoDB', 'partition key', 'sort key', 'Query vs Scan', 'RCU/WCU', 'conditional write', 'optimistic locking', 'GSI', 'sparse GSI', 'TTL', 'Streams'],
},
{
  id: 'lesson-aws-007',
  track: 'aws',
  order: 7,
  title: 'SQS tiêu chuẩn: vòng đời message, consumer idempotent và gia hạn lease cho job dài',
  level: 'senior',
  minutes: 45,
  goals: [
    'Giải thích tại sao SQS standard là at-least-once và consumer phải idempotent',
    'Thiết lập visibility timeout theo p99 thời gian xử lý, dùng ChangeMessageVisibility cho job dài',
    'Xử lý message độc bằng DLQ, maxReceiveCount và alarm trên DLQ',
    'Chọn standard hay FIFO; gán MessageGroupId theo đơn vị cần thứ tự (mã khách hàng, mã đơn)',
  ],
  body: `### Tóm tắt
SQS standard giao mỗi message **ít nhất một lần**: nếu mạng rớt hoặc worker sập giữa chừng, message sẽ được giao lại, thậm chí có thể nhận hai lần. Consumer phải dựa vào **receipt handle** của lần nhận, đặt **visibility timeout** dài hơn thời gian xử lý thực (theo p99), dùng **ChangeMessageVisibility** để gia hạn khi job kéo dài, và phải **idempotent** — mã đơn/event id plus bảng đã xử lý — để nhận lại message không làm hỏng dữ liệu. Message lỗi lặp lại vượt {{maxReceiveCount}} bị chuyển sang **DLQ (dead-letter queue)**.

### Tại sao SQS chọn "thà giao trùng còn hơn mất"
Khi worker gọi DeleteMessage, gói tin xác nhận có thể mất trên đường về SQS. SQS không biết worker đã xử lý xong hay chưa, nên lựa chọn an toàn là **giao lại message** sau khi visibility timeout hết hạn, thay vì mất message. Hệ quả: cùng một message có thể được giao hai lần (hoặc hơn), và thứ tự giao chỉ đảm bảo khi dùng FIFO. Bản chất: SQS ưu tiên **không mất message** hơn **không giao trùng message** — người nhận phải chịu được trùng, đó là lý do consumer phải idempotent.

### Vòng đời một message SQS
~~~text
Gửi message   Nhận (ẩn trong visibility timeout)   Xoá / hết hạn
[Producer] --m1-> [SQS VISIBLE] --ReceiveMessage--> [Consumer IN-FLIGHT] --DeleteMessage--> [m1 mất]
                                                             |                   ^
                                                             |                   | hết timeout, chưa xóa
                                                             v                   |
                                                      [m1 quay lại VISIBLE] --+
                                                             ReceiveCount + 1
~~~
1. Producer gửi message, trạng thái **VISIBLE**.
2. Consumer gọi ReceiveMessage, nhận tối đa 10 message; mỗi message kèm **receipt handle** (mã tham chiếu đúng lần nhận này).
3. Message trở nên **IN-FLIGHT**: ẩn khỏi consumer khác trong **visibility timeout** (mặc định 30 giây, tối đa 12 giờ).
4. Xử lý xong → gọi DeleteMessage với receipt handle → message mất vĩnh viễn.
5. Nếu worker sập chưa xử lý xong hoặc xử lý quá dài → hết timeout → message hiện lại VISIBLE, **ReceiveCount tăng 1**, có thể được giao cho consumer khác.
6. ReceiveCount vượt {{maxReceiveCount}} → SQS chuyển message sang **DLQ**.

### Receipt handle gắn với "lần nhận", không với message
Mỗi lần ReceiveMessage sinh handle mới (ví dụ {{m1#1}}, {{m1#2}}…). Handle cũ bị SQS từ chối. Lý do: consumer A nhận m1, xử lý lâu, hết timeout; consumer B nhận m1 nữa; nếu handle cũ của A vẫn xóa được thì A có thể xóa message trong khi B đang xử lý → mất dữ liệu. Mỗi handle chỉ dùng đúng cho lần nhận đó.

### Đặt visibility timeout thế nào, khi nào gia hạn
Thiết lập lớn hơn thời gian xử lý thực (p99) cộng thêm đệm. Ví dụ worker gửi email p99 70 giây → đặt timeout 90 giây.
- Quá ngắn: message hiện lại trong khi worker đang xử lý → xử lý trùng, receiveCount tăng nhanh, đủ lượt thì vào DLQ dù không lỗi gì.
- Quá dài: message độc (poison message) bị ẩn quá lâu, consumer khác chờ lâu trước khi mất hy vọng.

Job dài (encode video, gọi API ngoài nhiều phút): đừng đặt timeout 12 giờ cho tất cả. Gọi **ChangeMessageVisibility** định kỳ (heartbeat) để gia hạn thêm, ví dụ mỗi 2 phút gia hạn 5 phút; xử lý xong gọi DeleteMessage. Muốn trả message ngay cho consumer khác, gọi ChangeMessageVisibility với timeout 0.

### Consumer phải idempotent: nhận hai lần như nhận một lần
Vì SQS có thể giao lại message, xử lý của bạn phải an toàn khi chạy nhiều lần với cùng đầu vào:
- Mỗi message mang **mã nghiệp vụ** (orderId, eventId…).
- Trong **cùng một giao dịch database**, kiểm tra bảng {{processed_events}} (có unique constraint trên mã nghiệp vụ): nhập trùng → đã xử lý trước đó → bỏ qua, chỉ gọi DeleteMessage.
- Hoặc thao tác tự nhiên idempotent: {{UPDATE orders SET status = 'PAID' WHERE id = ? AND status = 'PENDING'}} — cập nhật 0 dòng nghĩa là đơn đã được xử lý rồi.
- Side effect bên ngoài (gửi email, gọi cổng thanh toán): truyền **idempotency key** cho bên kia nếu họ hỗ trợ.

~~~java
String orderId = message.body();                         // mã nghiệp vụ từ message
boolean moi = db.insertProcessedEvent(orderId);          // unique constraint, trả false nếu đã có
if (!moi) {                                              // nhận trùng: chỉ xóa message, không xử lý lại
    sqs.deleteMessage(handle);
    return;
}
emailGuiXacNhanDon(orderId);                             // xử lý nghiệp vụ
sqs.deleteMessage(handle);                               // xóa SAU KHI xử lý xong
~~~
Lưu ý: gọi DeleteMessage **sau khi** nghiệp vụ thành công. Nếu sập giữa hai bước, message hiện lại và được xử lý lại — nhưng insert processed_events lần thứ hai bị từ chối, nên vẫn an toàn.

### DLQ và message độc
Message "độc" (poison message): JSON hỏng, dữ liệu vi phạm ràng buộc, gọi API đối tác lỗi mãi. Nó sẽ fail mãi, được giao lại liên tục, tốn tiền và làm che khuất message tốt. **Redrive policy** gắn queue nguồn với DLQ: ReceiveCount vượt {{maxReceiveCount}} → chuyển sang DLQ.
- {{maxReceiveCount}} 3–5 là phổ biến; đừng đặt 1 (lỗi mạng tạm thời cũng đưa message vào DLQ).
- Đặt alarm trên số message của DLQ (ApproximateNumberOfMessagesVisible > 0). DLQ không ai nhìn thì dữ liệu chết lặng lẽ.
- Retention DLQ nên dài hơn queue nguồn: với standard queue, tuổi message tính từ lúc gửi ban đầu, không reset khi chuyển sang DLQ.
- Sửa lỗi xong dùng **DLQ redrive** để đẩy message trở lại queue nguồn.

### Standard vs FIFO
| Tiêu chí | Standard | FIFO |
|---|---|---|
| Thứ tự | Best-effort, không đảm bảo | Đảm bảo trong cùng MessageGroupId |
| Giao trùng | Có thể (at-least-once) | Có thể sau crash consumer (dedup chỉ 5 phút phía gửi) |
| Throughput | Rất cao | Thấp hơn (~300 API call/giây chế độ thường) |
| Message độc | Vào DLQ, không chặn hàng khác | Chặn cả group đến khi xử lý xong hoặc vào DLQ |

Chọn FIFO khi cần thứ tự theo một đơn vị (mã khách hàng, mã đơn) và gán {{MessageGroupId}} theo đơn vị đó — **không** dùng một group id cho mọi message, nếu không toàn bộ queue chạy tuần tự. Consumer FIFO vẫn phải idempotent.

### Ví dụ đời thực
Hệ thống đặt hàng của một công ty bán lẻ: service order gửi {{OrderPlaced}} vào SQS standard, worker email xử lý tại mức 50.000 message/giờ. Giai đoạn cao điểm, khách kháng nghị nhận **hai email xác nhận cùng một đơn**. Điều tra thấy: worker gọi API email bên ngoài p99 50 giây, visibility timeout của queue để mặc định 30 giây → SQS giao lại message trong khi worker đang chờ API → email gửi hai lần; một số message lỗi mãi vào DLQ nhưng team không đặt alarm nên không ai biết.
Sửa: đặt visibility timeout 90 giây (> p99 75s có đệm), worker gọi ChangeMessageVisibility để gia hạn nếu API đang chậm, thêm bảng {{processed_events}} deduplicate theo {{orderId}} trong cùng giao dịch, đặt alarm DLQ. Kết quả: email trùng giảm xuống 0, DLQ bắt được 12 message/ngày từ một producer legacy gửi JSON hỏng, sau khi sửa producer thì DLQ về 0.

### Trả lời mẫu khi phỏng vấn
"SQS standard đảm bảo at-least-once: message có thể được giao nhiều lần khi mạng lỗi hoặc worker crash trước khi delete. Tôi sẽ thiết kế consumer idempotent — mỗi message mang orderId, tôi kiểm tra bảng processed_events với unique constraint trong cùng giao dịch trước khi ghi đơn, trùng thì bỏ qua và delete message. Visibility timeout đặt lớn hơn p99 thời gian xử lý, và dùng ChangeMessageVisibility để gia hạn cho job dài thay vì đặt timeout cố định lớn. Message lỗi lặp lại vượt maxReceiveCount (thường để 3–5) chuyển sang DLQ, kèm alarm để xử lý sớm. Nếu cần thứ tự theo từng khách hàng, tôi dùng FIFO với MessageGroupId là mã khách hàng."

> Senior tip: Đặt alarm cho tuổi message của queue nguồn (ApproximateAgeOfOldestMessage), không chỉ dài lượng queue. Tuổi message tăng đều là dấu hiệu consumer chậm hoặc có poison message đang bị retry, thường thấy trước khi khách hàng kêu.

### Liên hệ phỏng vấn
Câu hay gặp:
- "Visibility timeout đặt bao nhiêu là hợp lý?" → lớn hơn p99 xử lý thêm đệm; job dài dùng ChangeMessageVisibility.
- "Message bị xử lý hai lần, xử lý ra sao?" → consumer idempotent, mã nghiệp vụ + bảng đã xử lý.
- "Lambda đọc SQS batch 10, 1 message lỗi thì sao?" → mặc định cả batch quay lại; bật partial batch response (ReportBatchItemFailures) và handler idempotent (aws-028).
- "Standard hay FIFO?" → FIFO nếu cần thứ tự theo khách hàng/đơn, chấp nhận throughput thấp hơn và chọn group id cẩn thận (aws-008).
- "DLQ và maxReceiveCount?" → 3–5, alarm trên DLQ, retention dài hơn, redrive sau khi sửa.
  `,
  exercises: [
    {
      title: 'Mô phỏng consumer SQS: nhận message, gia hạn lease, xử lý idempotent và DLQ',
      prompt: `Mô phỏng một consumer SQS standard trong bộ nhớ. Thời gian lấy từ **đồng hồ giả** (mili giây), nên test không cần sleep.

Đã có sẵn: record {{Received}} và lớp {{SqsQueue}} với constructor, {{send}} (id dạng {{m1}}, {{m2}}…), {{size}}, {{dlqSize}}. Bạn cài:

1. {{receive(max)}}: duyệt message theo thứ tự gửi, lấy tối đa {{max}} message **đang visible** ({{visibleAt <= now}}). Với mỗi message:
   ▸ nếu {{receiveCount >= maxReceiveCount}}: xoá khỏi queue chính, thêm vào DLQ (giữ nguyên id, body), **không** trả về, không tính vào {{max}};
   ▸ ngược lại: {{receiveCount++}}, {{visibleAt = now + visibilityMs}}, receipt handle mới = {{id + "#" + receiveCount}}, thêm vào kết quả.
2. {{receiveDlq(max)}}: cùng như {{receive}} nhưng hoạt động trên DLQ (không chuyển tiếp DLQ nữa).
3. {{heartbeat(handle, extraMs)}}: với message có handle **hiện tại**, gia hạn {{visibleAt = now + extraMs}}, trả về true; handle cũ hoặc không tồn tại trả về false.
4. {{process(handle)}}: consumer đã xử lý xong message. Nếu body (mã đơn/event id) đã nằm trong tập đã xử lý → **bỏ qua**: xoá message, trả về false (idempotent). Ngược lại: thêm body vào tập đã xử lý, xoá message, trả về true.
5. {{delete(handle)}}: xoá message có handle hiện tại, trả về true; handle cũ/không tồn tại trả về false.`,

      starter: `record Received(String messageId, String body, String receiptHandle, int receiveCount) {}

class SqsQueue {
    private static final class Msg {
        final String id, body;
        int receiveCount;
        long visibleAt;
        String handle;
        Msg(String id, String body) { this.id = id; this.body = body; }
    }

    private final LongSupplier clock;
    private final long visibilityMs;
    private final int maxReceiveCount;
    private final List<Msg> messages = new ArrayList<>();
    private final List<Msg> dlq = new ArrayList<>();
    private final Set<String> processed = new HashSet<>();
    private int seq = 0;

    SqsQueue(LongSupplier clock, long visibilityMs, int maxReceiveCount) {
        this.clock = clock;
        this.visibilityMs = visibilityMs;
        this.maxReceiveCount = maxReceiveCount;
    }

    String send(String body) {
        String id = "m" + (++seq);
        messages.add(new Msg(id, body));
        return id;
    }

    int size() { return messages.size(); }
    int dlqSize() { return dlq.size(); }

    List<Received> receive(int max) {
        throw new UnsupportedOperationException("TODO");
    }

    List<Received> receiveDlq(int max) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean heartbeat(String handle, long extraMs) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean process(String handle) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean delete(String handle) {
        throw new UnsupportedOperationException("TODO");
    }
}`,

      tests: `public class Main {
    static int passed = 0, total = 0;
    static void eq(String name, Object expected, Supplier<Object> actual) {
        total++;
        try {
            Object got = actual.get();
            if (Objects.equals(expected, got)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": mong đợi " + expected + ", nhận " + got);
        } catch (RuntimeException e) {
            System.out.println("FAIL " + name + ": ném " + e);
        }
    }
    static String ids(List<Received> rs) {
        return rs.stream().map(r -> r.messageId() + ":" + r.receiveCount()).collect(Collectors.joining(","));
    }
    public static void main(String[] args) {
        long[] now = { 0 };
        LongSupplier clock = () -> now[0];

        // 1. nhận, ẩn trong visibility timeout, hết hạn thì giao lại
        SqsQueue q = new SqsQueue(clock, 30_000, 5);
        q.send("order-1"); q.send("order-2"); q.send("order-3");
        eq("nhận đúng số lượng tối đa", "m1:1,m2:1", () -> ids(q.receive(2)));
        eq("đang trong timeout bị ẩn khỏi consumer khác", "m3:1", () -> ids(q.receive(10)));
        eq("chưa hết giờ không có message nào hiện", "", () -> { now[0] = 29_999; return ids(q.receive(10)); });
        eq("hết timeout giao lại với receiveCount 2", "m1:2,m2:2,m3:2", () -> { now[0] = 30_000; return ids(q.receive(10)); });

        // 2. receipt handle cũ bị từ chối
        eq("xoá handle cũ không thành công", false, () -> q.delete("m1#1"));
        eq("xoá handle hiện tại thành công", true, () -> q.delete("m1#2") && q.size() == 2);
        eq("handle không tồn tại", false, () -> q.delete("m9#1"));

        // 3. heartbeat gia hạn lease cho job dài
        long[] t2 = { 0 };
        SqsQueue w = new SqsQueue(() -> t2[0], 5_000, 5);
        w.send("job-xử-ly-dài");
        String h = w.receive(1).get(0).receiptHandle();
        eq("gia hạn handle hiện tại", true, () -> { t2[0] = 2_000; return w.heartbeat(h, 10_000); });
        eq("vẫn ẩn sau timeout cũ", 0, () -> { t2[0] = 6_000; return w.receive(1).size(); });
        eq("hiện lại sau timeout mới", "m1:2", () -> { t2[0] = 13_000; return ids(w.receive(1)); });
        eq("heartbeat với handle cũ bị từ chối", false, () -> w.heartbeat("m1#1", 1_000));
        eq("timeout 0 giải phóng ngay", "m1:3", () -> { w.heartbeat("m1#2", 0); return ids(w.receive(1)); });

        // 4. idempotent: hai message cùng mã đơn
        long[] t3 = { 0 };
        SqsQueue idem = new SqsQueue(() -> t3[0], 1_000, 5);
        idem.send("order-42"); idem.send("order-42");
        List<Received> batch = idem.receive(10);
        eq("nhận hai message trùng mã đơn", "m1:1,m2:1", () -> ids(batch));
        eq("xử lý message đầu tiên", true, () -> idem.process(batch.get(0).receiptHandle()));
        eq("message trùng mã đơn bị bỏ qua", false, () -> idem.process(batch.get(1).receiptHandle()));
        eq("queue rỗng sau xử lý", 0, () -> idem.size());
        eq("xoá handle đã xử lý lại lần nữa", false, () -> idem.delete(batch.get(0).receiptHandle()));

        // 5. poison message vào DLQ
        long[] t4 = { 0 };
        SqsQueue poison = new SqsQueue(() -> t4[0], 1_000, 2);
        poison.send("độc-hỏng");
        poison.receive(1);
        t4[0] = 1_000;
        poison.receive(1);
        t4[0] = 2_000;
        List<Received> lan3 = poison.receive(10);
        eq("lượt nhận vượt maxReceiveCount không trả về", "", () -> ids(lan3));
        eq("queue chính rỗng", 0, () -> poison.size());
        eq("DLQ có đúng 1 message", 1, () -> poison.dlqSize());
        eq("DLQ giữ id và body gốc", "m1/độc-hỏng", () -> {
            Received r = poison.receiveDlq(1).get(0);
            return r.messageId() + "/" + r.body();
        });

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,

      reference: `record Received(String messageId, String body, String receiptHandle, int receiveCount) {}

class SqsQueue {
    private static final class Msg {
        final String id, body;
        int receiveCount;
        long visibleAt;
        String handle;
        Msg(String id, String body) { this.id = id; this.body = body; }
    }

    private final LongSupplier clock;
    private final long visibilityMs;
    private final int maxReceiveCount;
    private final List<Msg> messages = new ArrayList<>();
    private final List<Msg> dlq = new ArrayList<>();
    private final Set<String> processed = new HashSet<>();
    private int seq = 0;

    SqsQueue(LongSupplier clock, long visibilityMs, int maxReceiveCount) {
        this.clock = clock;
        this.visibilityMs = visibilityMs;
        this.maxReceiveCount = maxReceiveCount;
    }

    String send(String body) {
        String id = "m" + (++seq);
        messages.add(new Msg(id, body));
        return id;
    }

    int size() { return messages.size(); }
    int dlqSize() { return dlq.size(); }

    List<Received> receive(int max) {
        long now = clock.getAsLong();
        List<Received> out = new ArrayList<>();
        Iterator<Msg> it = messages.iterator();
        while (it.hasNext() && out.size() < max) {
            Msg m = it.next();
            if (m.visibleAt > now) continue;                       // đang in-flight: bỏ qua
            if (m.receiveCount >= maxReceiveCount) {               // vượt lượt → DLQ
                it.remove();
                dlq.add(m);
                continue;
            }
            m.receiveCount++;
            m.visibleAt = now + visibilityMs;                      // ẩn trong visibility timeout
            m.handle = m.id + "#" + m.receiveCount;                // mỗi lần nhận một handle mới
            out.add(new Received(m.id, m.body, m.handle, m.receiveCount));
        }
        return out;
    }

    List<Received> receiveDlq(int max) {
        long now = clock.getAsLong();
        List<Received> out = new ArrayList<>();
        Iterator<Msg> it = dlq.iterator();
        while (it.hasNext() && out.size() < max) {
            Msg m = it.next();
            if (m.visibleAt > now) continue;
            m.receiveCount++;
            m.visibleAt = now + visibilityMs;
            m.handle = m.id + "#" + m.receiveCount;
            out.add(new Received(m.id, m.body, m.handle, m.receiveCount));
        }
        return out;
    }

    private Msg byHandle(List<Msg> store, String handle) {
        for (Msg m : store) if (handle.equals(m.handle)) return m;
        return null;
    }

    boolean heartbeat(String handle, long extraMs) {
        Msg m = byHandle(messages, handle);
        if (m == null) return false;
        m.visibleAt = clock.getAsLong() + extraMs;
        return true;
    }

    boolean process(String handle) {
        Msg m = byHandle(messages, handle);
        if (m == null) return false;
        if (processed.contains(m.body)) {
            messages.remove(m);                                    // trùng: chỉ xoá, không xử lý lại
            return false;
        }
        processed.add(m.body);
        messages.remove(m);
        return true;
    }

    boolean delete(String handle) {
        Msg m = byHandle(messages, handle);
        return m != null && messages.remove(m);
    }
}`,

      hints: [
        'Dùng {{Iterator}} để vừa duyệt messages vừa xoá khi chuyển message sang DLQ, tránh {{ConcurrentModificationException}}.',
        'Kiểm tra {{receiveCount >= maxReceiveCount}} **trước** khi tăng: với ngưỡng 2, message được giao 2 lần, lượt thứ 3 mới vào DLQ.',
        'Heartbeat chỉ nhận handle của **lần nhận gần nhất**; handle cũ bị từ chối — chính là cách SQS tránh consumer cũ xoá message đang được consumer khác xử lý.',
        'Tập {{processed}} trong {{process}} mô phỏng bảng {{processed_events}} có unique constraint: mã đơn đã xử lý thì nhận lại cũng bỏ qua, chỉ xoá message.',
      ],
      explain: `### Cơ chế bạn vừa cài
- **Visibility timeout là một "lease" mềm**: message không bị khoá cứng, chỉ ẩn tới một thời điểm. Worker sập thì lease hết hạn và message tự hiện lại — SQS chọn **giao lại** thay vì **mất**, đó là tại sao SQS là at-least-once.
- **Receipt handle gắn với lần nhận**, không với message. Mỗi lần receive sinh handle mới; handle cũ bị từ chối khi delete/heartbeat, ngăn consumer A xoá message đang được consumer B xử lý.
- **{{process}} mô phỏng consumer idempotent**: tập {{processed}} giống bảng {{processed_events}} có unique constraint — mã đơn đã xử lý thì nhận lại cũng bỏ qua, chỉ xoá message. Ngoài đời bạn chèn mã đơn và ghi đơn trong **cùng một giao dịch** để không mất trùng.
- **DLQ dựa trên số lần nhận**, không phải số lần "lỗi": SQS không biết message lỗi hay worker chậm, nên visibility timeout quá ngắn cũng đẩy message tốt vào DLQ.

### Lỗi hay gặp
- Tăng {{receiveCount}} trước rồi mới so với ngưỡng: message vào DLQ sớm một lượt.
- Heartbeat hoặc delete với handle cũ: test "handle cũ bị từ chối" bắt lỗi này.
- Dùng for-each rồi xoá trong vòng lặp: ném {{ConcurrentModificationException}}.
- Về mặt SQS thật còn thiếu: long polling, retention, delay queue, thứ tự không đảm bảo của standard queue, và ReceiveCount chỉ là giá trị xấp xỉ (Approximate).
    `,
    },
  ],
  check: [
    {
      q: 'Consumer xử lý mỗi message mất trung bình 40 giây, p99 là 75 giây; visibility timeout của queue để mặc định 30 giây. Triệu chứng nào sẽ xuất hiện?',
      options: ['SQS tự xóa message sau 30 giây', 'Message hiện lại khi worker vẫn đang xử lý → xử lý trùng, receiveCount tăng, có thể vào DLQ', 'SQS tự gia hạn timeout theo thời gian xử lý', 'Worker nhận lỗi "VisibilityTimeoutExceeded" khi gọi ReceiveMessage'],
      answer: 1,
      explain: `Hết 30 giây, message hiện lại và consumer khác nhận nó trong khi worker đầu vẫn chạy: xử lý trùng, receiveCount tăng nhanh, đủ lượt thì vào DLQ. SQS không tự xóa (chỉ xóa khi consumer gọi DeleteMessage), không tự gia hạn (bạn phải gọi ChangeMessageVisibility hoặc đặt timeout lớn hơn p99), và ReceiveMessage không báo lỗi này.`,
    },
    {
      q: 'Hai worker cùng nhận message đơn #1001 có cùng mã đơn, xử lý xong ghi database. Cách nào đảm bảo đơn không bị xử lý hai lần?',
      options: ['SQS FIFO tự động chặn trùng nên không cần làm gì', 'Lưu mã đơn vào bảng đã xử lý có ràng buộc duy nhất (unique) trong cùng giao dịch với việc ghi đơn; nhập trùng thì bỏ qua', 'Tăng visibility timeout lên 12 giờ', 'Gửi message đến DLQ sau lần nhận đầu tiên'],
      answer: 1,
      explain: `FIFO chỉ deduplicate phía gửi trong 5 phút và không chặn trường hợp consumer nhận rồi crash trước khi delete. Bảng đã xử lý với unique constraint trong cùng giao dịch là cách chuẩn: nhập trùng thì từ chối, bạn bỏ qua và delete message. Timeout dài chỉ che giấu vấn đề; DLQ sau 1 lần là sai vì lỗi tạm thời (mạng, timeout) cũng sẽ vào DLQ.`,
    },
    {
      q: 'maxReceiveCount nên đặt bao nhiêu, và tại sao không nên đặt 1?',
      options: ['1, để message lỗi vào DLQ sớm nhất', '3–5, để vượt qua lỗi tạm thời (mạng, timeout) trước khi kết luận là message độc', '100, để DLQ gần như không bao giờ nhận message', 'Không quan trọng, SQS tự điều chỉnh'],
      answer: 1,
      explain: `Với 1, một lần mạng rớt trong xử lý là message vào DLQ ngay. 3–5 cho message được giao lại vài lần sau lỗi tạm thời; chỉ vào DLQ khi thực sự xử lý không thành công nhiều lần. SQS không tự điều chỉnh maxReceiveCount.`,
    },
    {
      q: 'Cần thứ tự xử lý của các đơn thuộc **cùng một khách hàng**, nhưng khách hàng khác nhau xử lý song song. Cấu hình nào đúng?',
      options: ['Standard queue, sắp xếp lại ở consumer theo thời gian', 'FIFO với MessageGroupId = mã khách hàng', 'Một queue riêng cho mỗi khách hàng', 'SNS topic với filter policy theo khách hàng'],
      answer: 1,
      explain: `FIFO giữ thứ tự **trong cùng một** message group và cho các group chạy song song, nên group id = mã khách hàng đúng yêu cầu. Group id cố định làm toàn bộ queue tuần tự; standard queue không đảm bảo thứ tự và sắp xếp lại ở consumer rất khó đúng khi có retry; filter policy của SNS chỉ lọc, không đảm bảo thứ tự.`,
    },
  ],
  related: ['aws-008', 'aws-028'],
  tags: ['SQS', 'visibility timeout', 'receipt handle', 'DLQ', 'idempotency', 'ChangeMessageVisibility', 'FIFO'],
},
{
  id: 'lesson-aws-008',
  track: 'aws',
  order: 8,
  title: 'S3 multipart upload: upload từng phần, tính ETag và ghép object',
  level: 'mid',
  minutes: 40,
  goals: [
    'Hiểu multipart upload: tạo upload, upload từng phần, CompleteMultipartUpload ghép theo số phần',
    'Tính ETag của object multipart và không lầm với MD5 của toàn bộ file',
    'Dùng presigned URL để client upload từng phần trực tiếp lên S3, không qua app server',
    'Phát hiện và dọn upload dở dang bằng lifecycle AbortIncompleteMultipartUpload',
  ],
  body: `### Tóm tắt
Một lần PUT object lên S3 được giới hạn 5 GB và buộc client giữ toàn bộ file trong một kết nối HTTP — với file hàng trăm MB thì rất dễ bị timeout và phải chạy lại từ đầu. Multipart upload chia file thành các phần (part), upload mỗi phần độc lập (có thể song song, phần nào lỗi thì chạy lại phần đó), rồi dùng CompleteMultipartUpload để S3 ghép thành object. Mỗi phần đi kèm ETag (MD5 của phần đó); ETag của object multipart được tính từ các MD5 của các phần ghép lại, có dạng {{d41d8cd98f00b204e9800998ecf8427e-3}}. Client có thể upload từng phần qua **presigned URL** — app chỉ sinh URL ký sẵn, không đụng đến bytes của file, giảm băng thông và loại bỏ timeout của server. Phần của upload chưa hoàn thành vẫn tính phí lưu trữ, nên cần lifecycle rule {{AbortIncompleteMultipartUpload}} dọn dẹp định kỳ.

### Vì sao file lớn cần multipart upload
- Giới hạn 5 GB mỗi lần PUT.
- Một kết nối HTTP lâu dài rất dễ bị ngắt (timeout của load balancer, mạng di động yếu); chạy lại từ đầu tốn kém.
- Chia thành các phần (tối thiểu 5 MiB, tối đa 5 GiB, phần cuối có thể nhỏ hơn), tối đa 10.000 phần, upload song song, phần lỗi chạy lại riêng.
- File ít hơn 100 MB thường PUT đơn lẻ là đủ; từ vài trăm MB trở lên dùng multipart.

### Ba bước của multipart upload
1. {{CreateMultipartUpload}} → S3 trả {{uploadId}}.
2. {{UploadPart}} từng phần kèm số phần (1–10.000) và dữ liệu; S3 trả ETag của phần trong header phản hồi.
3. {{CompleteMultipartUpload}} gửi danh sách (số phần, ETag) → S3 ghép object theo thứ tự số phần.

~~~text
Client                      App                         S3
  |----1. xin presigned URL part 1--->
  |<--2. URL ký sẵn, hết hạn sau 10p--
  |----3. PUT part 1 trực tiếp ------->
  |                      |----4. PUT part 2 trực tiếp ---->
  |                      |<--5. S3 trả ETag của phần ------
  |----6. danh sách part + ETag ----->
  |                      |--7. CompleteMultipartUpload --->
  |                      |<--8. ETag object cuối ---------
~~~

### ETag của object multipart KHÔNG phải MD5 của toàn bộ file
Với object PUT một lần, ETag thường là MD5 của file. Với multipart, ETag của S3 là:

**hex(MD5(nối chuỗi raw digest 16 byte của từng part theo thứ tự số phần)) + "-" + số phần**

Ví dụ 3 part có MD5 lần lượt là {{0ec51de3e0558f88056f9dab2cff1fc5}}, {{b58a60e7f8de89defa242ae3decd3866}}, {{142d518a4abfedd9db024307873f033d}} → ETag cuối cùng là {{e65de1d647a787fe758bca460d6bf40a-3}}.

Dùng ETag để xác nhận file không bị hỏng trong truyền tải: client tính toán lại ở bên mình và so sánh. **Lưu ý:** không bao giờ quy định ETag = MD5(file) với object multipart — suffix {{-3}} là dấu hiệu rõ ràng.

### Presigned URL cho từng phần
App không nhận bytes video: client xin presigned PUT URL cho part N từ app (app kiểm tra quyền, sinh key), client PUT trực tiếp lên S3, S3 trả ETag, app lưu cặp (partNumber, ETag). Cuối cùng client (hoặc app) gọi CompleteMultipartUpload. Lợi ích: app server không tốn bandwidth, không bị timeout load balancer, scale theo số request không theo kích thước file.

### Upload dở dang vẫn tính phí
Phần đã upload chưa Complete/Abort vẫn chiếm dung lượng và **không hiện khi LIST object**. Bucket nhận upload từ mobile/mạng rớt sẽ dồn phí im lặng. Cách sửa: lifecycle rule {{AbortIncompleteMultipartUpload}} (ví dụ hủy sau 7 ngày) trên bucket nhận upload.

### Ví dụ đời thực
Hệ thống cho phép khách hàng upload video sản phẩm khoảng 500 MB. Thiết kế ban đầu: mobile POST video lên Spring Boot, server stream PUT lên S3 → timeout load balancer sau 30 giây, server tốn bandwidth, một số video upload xong 90% rồi mạng rớt phải chạy lại từ đầu.
Thiết kế mới: mobile chia video thành 8 part × 64 MiB, xin 8 presigned PUT URL, upload 8 part song song. Một part lỗi chỉ chạy lại phần đó; hoàn thành trung bình 12 giây thay vì 95 giây đơn luồng. App kiểm tra ETag cuối cùng so với giá trị client tính được. Trước khi có lifecycle, khoảng 3% upload dở dang dồn phí im lặng; sau khi bật {{AbortIncompleteMultipartUpload}} sau 7 ngày, chi phí lưu trữ phần tạm giảm hơn 40%.

### Trả lời mẫu khi phỏng vấn
"Đối với file lớn trên S3 tôi dùng multipart upload: chia file thành các part (tối thiểu 5 MiB, tối đa 5 GiB, tối đa 10.000 part), upload song song, part lỗi chạy lại phần đó, rồi CompleteMultipartUpload với danh sách số part và ETag. ETag của object multipart **không** là MD5 của toàn bộ file — nó là MD5 của các MD5 của các part ghép lại, kèm số part, nên tôi không bao giờ giả định ETag dùng để kiểm tra toàn vẹn nếu không biết công thức. Để client upload trực tiếp mà không qua server, tôi sinh presigned PUT URL cho từng part; app chỉ kiểm tra quyền và lưu danh sách ETag. Cuối cùng, bật lifecycle AbortIncompleteMultipartUpload để dọn các upload dở dang vẫn tính phí lưu trữ."

> Senior tip: Với hệ có rất nhiều file nhỏ, đừng dùng multipart cho mỗi file — chi phí request và độ trễ khởi tạo uploadId sẽ cao hơn lợi ích. Multipart chỉ đáng giá từ vài trăm MB trở lên; file nhỏ một PUT đơn lẻ (hạn 5 GB là đủ rộng cho phần lớn trường hợp) là đủ.

### Liên hệ phỏng vấn
Câu hay gặp:
- "PUT object tối đa bao nhiêu, multipart cho phép tối đa bao nhiêu part?" → 5 GB/một lần PUT; 1–10.000 part, mỗi part 5 MiB–5 GiB (trừ phần cuối).
- "ETag của object multipart có gì khác?" → MD5 của các MD5 phần ghép lại + "-" + số phần; không phải MD5 của file.
- "Tại sao không để server nhận file rồi PUT S3?" → tránh tốn bandwidth/timeout server, dùng presigned URL part upload.
- "Upload dở dang phát hiện và sửa ra sao?" → lifecycle AbortIncompleteMultipartUpload; LIST không thấy phần dở dang nhưng vẫn tính phí lưu trữ.
  `,
  exercises: [
    {
      title: 'Mô phỏng S3 multipart upload: upload phần, tính ETag, ghép và kiểm tra',
      prompt: `Mô phỏng multipart upload của S3 trong bộ nhớ (không dùng AWS SDK).

{{createUpload()}} tạo một upload và trả về {{uploadId}}. {{uploadPart(uploadId, partNumber, data)}} lưu một phần và trả về ETag của phần (MD5 hex lowercase của bytes data). {{completeUpload(uploadId, parts)}} nhận danh sách {{PartETag(partNumber, etag)}} và:

- số phần phải tạo thành dãy liền kề {{1..N}} (không trùng, không trống, không bỏ phần giữa chừng),
- ETag của mỗi phần phải khớp MD5 của dữ liệu phần đó đã lưu,
- ETag của object cuối = hex MD5 của **nối các raw digest (16 byte) của từng phần theo thứ tự số phần**, rồi nối {{"-" + N}}.

{{abort(uploadId)}} hủy upload. Sau khi complete hoặc abort, mọi thao tác trên {{uploadId}} đó ném {{IllegalArgumentException}}.`,

      starter: `import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

record PartETag(int partNumber, String etag) {}

class MultipartUpload {
    String createUpload() {
        throw new UnsupportedOperationException("TODO");
    }

    String uploadPart(String uploadId, int partNumber, byte[] data) {
        throw new UnsupportedOperationException("TODO");
    }

    String completeUpload(String uploadId, List<PartETag> parts) {
        throw new UnsupportedOperationException("TODO");
    }

    void abort(String uploadId) {
        throw new UnsupportedOperationException("TODO");
    }
}`,

      tests: `import java.nio.charset.StandardCharsets;
import java.util.List;

public class Main {
    static int passed = 0, total = 0;
    static void eq(String name, Object expected, Supplier<Object> actual) {
        total++;
        try {
            Object got = actual.get();
            if (Objects.equals(expected, got)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": mong đợi " + expected + ", nhận " + got);
        } catch (RuntimeException e) {
            System.out.println("FAIL " + name + ": ném " + e);
        }
    }
    static String catchIae(Supplier<Object> s) {
        try { s.get(); return "no exception"; } catch (IllegalArgumentException e) { return "IAE"; }
    }
    public static void main(String[] args) {
        MultipartUpload u = new MultipartUpload();
        String id1 = u.createUpload();
        String id2 = u.createUpload();
        eq("hai upload khác nhau có id khác nhau", true, () -> !id1.equals(id2));
        eq("id không rỗng", true, () -> id1 != null && !id1.isEmpty());

        byte[] d1 = "don-hang-001".getBytes(StandardCharsets.UTF_8);
        byte[] d2 = "don-hang-002".getBytes(StandardCharsets.UTF_8);
        byte[] d3 = "don-hang-003".getBytes(StandardCharsets.UTF_8);
        String e1 = u.uploadPart(id1, 1, d1);
        String e2 = u.uploadPart(id1, 2, d2);
        String e3 = u.uploadPart(id1, 3, d3);
        eq("etag phần là 32 ký tự hex lowercase", true, () -> e1.matches("[0-9a-f]{32}"));
        eq("cùng dữ liệu có cùng etag", true, () -> u.uploadPart(id1, 1, d1).equals(e1));
        eq("dữ liệu khác có etag khác", true, () -> !u.uploadPart(id1, 4, d2).equals(e3));

        eq("ghép 3 phần theo thứ tự", "9ffa069295e38c0d33a776af530a0e16-3", () -> u.completeUpload(id1, List.of(new PartETag(1, e1), new PartETag(2, e2), new PartETag(3, e3))));

        String id3 = u.createUpload();
        String f1 = u.uploadPart(id3, 1, d1);
        eq("một phần duy nhất", "c783668b635eedcdf7019c092043d174-1", () -> u.completeUpload(id3, List.of(new PartETag(1, f1))));

        String id4 = u.createUpload();
        String g1 = u.uploadPart(id4, 1, d1);
        String g2 = u.uploadPart(id4, 2, d2);
        String g3 = u.uploadPart(id4, 3, d3);
        eq("ghép ngược thứ tự vẫn cùng ETag", "9ffa069295e38c0d33a776af530a0e16-3", () -> u.completeUpload(id4, List.of(new PartETag(3, g3), new PartETag(1, g1), new PartETag(2, g2))));

        String id5 = u.createUpload();
        u.uploadPart(id5, 1, d1); u.uploadPart(id5, 3, d3);
        eq("bỏ phần giữa chừng bị từ chối", "IAE", () -> catchIae(() -> u.completeUpload(id5, List.of(new PartETag(1, e1), new PartETag(3, e3)))));

        String id6 = u.createUpload();
        u.uploadPart(id6, 1, d1);
        eq("etag phần sai bị từ chối", "IAE", () -> catchIae(() -> u.completeUpload(id6, List.of(new PartETag(1, "00000000000000000000000000000000")))));

        String id7 = u.createUpload();
        u.uploadPart(id7, 1, d1); u.uploadPart(id7, 1, d2);
        eq("phần trùng bị từ chối", "IAE", () -> catchIae(() -> u.completeUpload(id7, List.of(new PartETag(1, e1), new PartETag(1, e2)))));

        String idA = u.createUpload();
        u.uploadPart(idA, 1, d1);
        eq("phần số 0 bị từ chối", "IAE", () -> catchIae(() -> u.completeUpload(idA, List.of(new PartETag(0, e1)))));

        String id8 = u.createUpload();
        u.abort(id8);
        eq("sau abort thì complete bị từ chối", "IAE", () -> catchIae(() -> u.completeUpload(id8, List.of())));
        eq("upload id không tồn tại", "IAE", () -> catchIae(() -> u.uploadPart("không-tồn-tại", 1, d1)));

        String id9 = u.createUpload();
        u.uploadPart(id9, 1, d1);
        u.completeUpload(id9, List.of(new PartETag(1, e1)));
        eq("sau complete thì abort bị từ chối", "IAE", () -> catchIae(() -> { u.abort(id9); return null; }));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,

      reference: `import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

record PartETag(int partNumber, String etag) {}

class MultipartUpload {
    private static final class Upload {
        final String id;
        final Map<Integer, byte[]> parts = new TreeMap<>();
        boolean done;
        Upload(String id) { this.id = id; }
    }

    private final Map<String, Upload> uploads = new HashMap<>();
    private int seq = 0;

    String createUpload() {
        String id = "u" + (++seq);
        uploads.put(id, new Upload(id));
        return id;
    }

    String uploadPart(String uploadId, int partNumber, byte[] data) {
        Upload upload = get(uploadId);
        if (partNumber < 1) throw new IllegalArgumentException("số phần phải ≥ 1");
        upload.parts.put(partNumber, data.clone());
        return hex(md5(data));
    }

    String completeUpload(String uploadId, List<PartETag> parts) {
        Upload upload = get(uploadId);
        int n = parts.size();
        if (n == 0) throw new IllegalArgumentException("danh sách phần trống");
        boolean[] seen = new boolean[n + 1];
        byte[][] digests = new byte[n + 1][];
        for (PartETag part : parts) {
            int num = part.partNumber();
            if (num < 1 || num > n) throw new IllegalArgumentException("phần " + num + " nằm ngoài 1.." + n);
            if (seen[num]) throw new IllegalArgumentException("phần trùng: " + num);
            seen[num] = true;
            byte[] stored = upload.parts.get(num);
            if (stored == null) throw new IllegalArgumentException("chưa upload phần " + num);
            byte[] digest = md5(stored);
            if (!hex(digest).equals(part.etag())) throw new IllegalArgumentException("ETag phần " + num + " không khớp");
            digests[num] = digest;
        }
        byte[] cat = new byte[16 * n];
        int off = 0;
        for (int i = 1; i <= n; i++) {
            System.arraycopy(digests[i], 0, cat, off, 16);
            off += 16;
        }
        upload.done = true;
        return hex(md5(cat)) + "-" + n;
    }

    void abort(String uploadId) {
        Upload upload = get(uploadId);
        upload.done = true;
        uploads.remove(uploadId);
    }

    private Upload get(String id) {
        Upload upload = uploads.get(id);
        if (upload == null || upload.done) throw new IllegalArgumentException("upload không tồn tại: " + id);
        return upload;
    }

    static byte[] md5(byte[] data) {
        try { return MessageDigest.getInstance("MD5").digest(data); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }

    static String hex(byte[] bytes) { return HexFormat.of().formatHex(bytes); }
}`,

      hints: [
        'Lưu mỗi phần vào {{TreeMap<Integer, byte[]>}} với key là số phần: ghép sau này tự theo thứ tự số phần.',
        'ETag cuối tính từ **raw digest** (16 byte) của từng phần, nối lại rồi băm một lần nữa — không phải băm chuỗi hex, không phải băm dữ liệu gốc.',
        'Trong {{completeUpload}}, kiểm tra **trước** khi ghép: dãy 1..N liền kề, không trùng, mỗi phần đã upload, ETag khớp; lỗi nào cũng ném {{IllegalArgumentException}} và không thay đổi trạng thái upload.',
      ],
      explain: `### Cơ chế bạn vừa cài
- Mỗi part được băm bằng MD5 (16 byte) và ETag của part là chuỗi hex của digest đó — giống S3 trả ETag trong header phản hồi của UploadPart.
- ETag của object multipart = hex(MD5(nối raw digest của các phần theo thứ tự phần)) + "-" + số phần. Suffix {{-N}} là dấu hiệu nhận biết object upload bằng multipart; nó **không** bằng MD5 của toàn bộ file, nên client không nên giả định ETag dùng để kiểm tra toàn vẹn nếu không áp dụng đúng công thức.
- {{TreeMap}} theo số phần cho phép client gửi danh sách phần theo bất kỳ thứ tự nào (ví dụ từ nhiều luồng upload song song hoàn thành theo thứ tự khác nhau), S3 vẫn ghép đúng thứ tự.
- {{abort}} đánh dấu upload là done và xoá khỏi bảng: upload dở dang không bao giờ bị "quên" nền tảng; ngoài đời, lifecycle rule {{AbortIncompleteMultipartUpload}} cần được bật để dọn phần upload bị client bỏ ngỏ.

### Lỗi hay gặp
- Ghép hex chuỗi thay vì raw digest: kết quả ETag sẽ khác S3.
- Không kiểm tra dãy liền kề: parts [1, 3] không được ghép thành object có "phần 2 bị thiếu".
- Sau khi abort/complete, phải từ chối mọi thao tác tiếp theo trên cùng uploadId.
    `,
    },
  ],
  check: [
    {
      q: 'PUT object tối đa bao nhiêu, và multipart upload cho phép tối đa bao nhiêu phần?',
      options: ['5 GB và tối đa 10.000 phần', '5 TB và tối đa 100 phần', 'Không giới hạn, chỉ phải chia nếu file quá 100 MB', '1 GB và tối đa 500 phần'],
      answer: 0,
      explain: `Một lần PUT tối đa 5 GB. Multipart upload cho phép 1–10.000 phần, mỗi phần 5 MiB–5 GiB (trừ phần cuối có thể nhỏ hơn). File dưới 100 MB thường PUT đơn lẻ là đủ.`,
    },
    {
      q: 'ETag của object upload bằng multipart có gì đặc biệt?',
      options: ['Luôn bằng MD5 của toàn bộ file', 'Là MD5 của các MD5 của các phần ghép lại, kèm số phần, ví dụ ...-3', 'Chỉ có khi bật versioning', 'Là SHA-256, không phải MD5'],
      answer: 1,
      explain: `ETag multipart = hex(MD5(nối raw digest 16 byte của các phần theo thứ tự)) + "-" + số phần. Suffix {{-3}} là dấu hiệu rõ ràng object này upload bằng multipart. Không nên dùng ETag làm checksum toàn vẹn file nếu không áp dụng đúng công thức này; với PUT một lần ETag thường là MD5 của file, nhưng đó là trường hợp khác.`,
    },
    {
      q: 'Ứng dụng cho phép client upload video lên S3 nhưng không muốn video stream qua server. Thiết kế nào hợp lý?',
      options: ['Server nhận multipart request rồi PUT lên S3', 'Server sinh presigned PUT URL cho từng part, client PUT trực tiếp S3, server lưu part number + ETag để CompleteMultipartUpload', 'Client PUT trực tiếp bằng access key của server nhúng vào ứng dụng', 'Lưu video vào DynamoDB'],
      answer: 1,
      explain: `Presigned URL part upload: server không đụng bytes, không bị timeout load balancer, scale theo số request. Access key nhúng vào ứng dụng client là lỗ hổng bảo mật (không thể thu hồi). DynamoDB không dùng để lưu file video lớn (giới hạn item 400 KB).`,
    },
    {
      q: 'Upload video bị gián đoạn thường xuyên, phần đã upload vẫn còn ở S3 nhưng không thấy trong LIST. Nguyên nhân và sửa?',
      options: ['S3 đã xóa phần tự động, không cần làm gì', 'Multipart upload dở dang vẫn tính phí lưu trữ và không hiện trong LIST; thêm lifecycle rule AbortIncompleteMultipartUpload', 'Bucket bị hết hạn, phải gia hạn gói dịch vụ', 'Phần bị mã hoá bằng KMS nên không liệt kê được'],
      answer: 1,
      explain: `Phần của upload chưa complete/abort vẫn chiếm dung lượng và **không hiện** trong LIST object — khớp triệu chứng. Lifecycle {{AbortIncompleteMultipartUpload}} dọn tự động. S3 không tự xóa phần; hết hạn gói dịch vụ là lý do khác hoàn toàn; mã hoá KMS không ảnh hưởng đến khả năng liệt kê.`,
    },
  ],
related: ['aws-007'],
  tags: ['S3', 'multipart upload', 'ETag', 'presigned URL', 'AbortIncompleteMultipartUpload', 'lifecycle'],
},
{
  id: 'lesson-aws-009',
  track: 'aws',
  order: 9,
  title: 'SQS FIFO: thứ tự, dedup và khi nào trả tiền cho FIFO',
  level: 'senior',
  minutes: 35,
  goals: [
    'Phân biệt standard và FIFO theo throughput, thứ tự và chi phí',
    'Dùng MessageGroupId và MessageDeduplicationId đúng cách',
    'Thiết kế idempotent consumer cho standard queue',
  ],
  body: `### Tóm tắt
SQS standard là at-least-once và không đảm bảo thứ tự; FIFO đảm bảo thứ tự trong cùng MessageGroupId và loại trùng theo MessageDeduplicationId trong 5 phút, nhưng throughput thấp hơn (mặc định 300 TPS mỗi API action, đạt 3.000 msg/s khi dùng batching; bật high-throughput mode thì cao hơn nhiều) và giá cao hơn.

### Standard vs FIFO
| Tiêu chí | Standard | FIFO |
|---|---|---|
| Throughput | gần như không giới hạn | 300 TPS/API action (3.000 msg/s khi batching) |
| Thứ tự | không đảm bảo | theo MessageGroupId |
| Loại trùng | không | 5 phút theo dedup id |
| Giá | thấp hơn | cao hơn |

### Khi nào dùng FIFO
Chỉ dùng khi nghiệp vụ thật sự cần thứ tự trong một đơn vị (một khách hàng, một đơn hàng). Không dùng FIFO cho toàn bộ hệ thống nếu chỉ cần throughput.

### Idempotent consumer
Với standard queue, consumer phải idempotent: ghi DB với unique constraint theo messageId; nếu insert trùng thì bỏ qua.

### Idempotent consumer chi tiết
Khi dùng standard queue, cùng một message có thể được giao nhiều lần. Consumer nên ghi kết quả với khóa duy nhất theo messageId, và bỏ qua nếu đã xử lý.

### Chi phí và throughput
FIFO có giá cao hơn và throughput thấp hơn. Chỉ dùng khi nghiệp vụ cần thứ tự trong một đơn vị.

### Cơ chế hoạt động từng bước
1. Producer gửi message vào queue.
2. SQS lưu message và trả messageId.
3. Consumer nhận message, xử lý, rồi delete message.
4. Nếu consumer crash trước delete, message sẽ xuất hiện lại sau visibility timeout.

### So sánh và khi nào dùng
Standard queue phù hợp throughput lớn và chấp nhận xử lý lại. FIFO phù hợp khi thứ tự quan trọng trong một đơn vị.

### Ví dụ đời thực
Một hệ thống xử lý đơn hàng dùng SQS standard. Consumer ghi DB với unique constraint theo messageId. Nếu message bị giao lại, insert trùng bị bỏ qua, không tạo đơn trùng.

### Lỗi hay gặp
- Dùng FIFO cho mọi thứ làm giảm throughput.
- Không idempotent consumer dẫn đến xử lý trùng.
- Visibility timeout quá ngắn làm message xử lý lại.

### Pitfall thực tế
Dùng FIFO cho toàn bộ hệ thống sẽ làm throughput giảm và chi phí tăng mà không cần thiết. Standard + idempotent consumer thường là lựa chọn đúng.

### Ghi nhớ
Standard + idempotent consumer cho throughput lớn. FIFO chỉ cho đơn vị cần thứ tự. Dedup window 5 phút.

### Tổng kết
SQS standard phù hợp throughput lớn với idempotent consumer. FIFO chỉ dùng khi cần thứ tự. Presigned URL an toàn và resume multipart tiết kiệm thời gian.

### Liên hệ phỏng vấn
Interviewer hay hỏi: vì sao không dùng FIFO cho mọi thứ, dedup window là bao lâu, và cách làm idempotent với standard queue. Trả lời: standard + idempotent cho throughput lớn; FIFO chỉ cho đơn vị cần thứ tự.`,
  exercises: [
    {
      title: 'Dedup cache theo cửa sổ 5 phút',
      prompt: 'Implement DedupCache với seen(dedupId) trả true nếu đã thấy trong cửa sổ, và record(dedupId) ghi nhận.',
      starter: 'class DedupCache {\n    private final Map<String, Long> seen = new HashMap<>();\n    private final long windowMs;\n    DedupCache(long windowMs) { this.windowMs = windowMs; }\n    boolean seen(String id) { throw new UnsupportedOperationException("TODO"); }\n    void record(String id) { throw new UnsupportedOperationException("TODO"); }\n}',
      tests: 'public class Main {\n    static int passed=0,total=0;\n    static void check(String n, Runnable r){total++;try{r.run();passed++;System.out.println("PASS "+n);}catch(Throwable t){System.out.println("FAIL "+n+": "+t);}}\n    static void eq(Object e,Object a){if(!Objects.equals(e,a))throw new AssertionError("exp "+e+" got "+a);}\n    public static void main(String[] args){\n      check("first not seen",()->{DedupCache c=new DedupCache(1000);eq(false,c.seen("a"));});\n      check("after record seen",()->{DedupCache c=new DedupCache(1000);c.record("a");eq(true,c.seen("a"));});\n      check("different id not seen",()->{DedupCache c=new DedupCache(1000);c.record("a");eq(false,c.seen("b"));});\n      System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'class DedupCache {\n    private final Map<String, Long> seen = new HashMap<>();\n    private final long windowMs;\n    DedupCache(long windowMs) { this.windowMs = windowMs; }\n    boolean seen(String id) { Long t=seen.get(id); if(t==null) return false; if(System.currentTimeMillis()-t>windowMs){seen.remove(id);return false;} return true; }\n    void record(String id) { seen.put(id,System.currentTimeMillis()); }\n}',
      hints: ['Lưu timestamp khi record; seen kiểm tra còn trong cửa sổ.'],
      explain: 'Dedup theo cửa sổ thời gian; hết hạn thì cho phép lại.',
    },
  ],
  check: [
    { q: 'SQS FIFO dedup window là bao lâu?', options: ['1 phút', '5 phút', '15 phút', '24 giờ'], answer: 1, explain: 'FIFO loại trùng theo MessageDeduplicationId trong 5 phút.' },
    { q: 'Khi nào nên dùng FIFO?', options: ['Mọi hệ thống để đảm bảo thứ tự', 'Khi cần thứ tự trong một đơn vị như một khách hàng', 'Khi throughput rất lớn', 'Khi không cần idempotent'], answer: 1, explain: 'FIFO chỉ nên dùng khi nghiệp vụ cần thứ tự trong một đơn vị cụ thể.' },
  ],
  related: ['aws-007'],
  tags: ['SQS', 'FIFO', 'dedup', 'idempotent'],
},
{
  id: 'lesson-aws-010',
  track: 'aws',
  order: 10,
  title: 'S3 presigned URL: bảo mật và resume multipart',
  level: 'senior',
  minutes: 35,
  goals: [
    'Sinh presigned URL an toàn, giới hạn thời gian và quyền',
    'Resume multipart upload bằng danh sách part đã có',
    'Tránh lộ access key và xử lý expiry',
  ],
  body: `### Tóm tắt: presigned URL cho client upload trực tiếp, resume để không làm lại từ đầu
**Presigned URL** là một URL đã được **ký** bằng credentials của server, cho phép client upload hoặc download trực tiếp một object S3 trong một khoảng thời gian giới hạn mà **không cần** credentials. **Resume multipart** là khả năng upload tiếp phần còn thiếu sau khi mạng gián đoạn, thay vì upload lại toàn bộ file.

### Bắt đầu từ gốc: vì sao không cho file chạy qua server
Cách làm ngây thơ: client upload file 2 GB lên Spring Boot, server đọc stream rồi PUT lên S3. Cách này tốn băng thông gấp đôi, tốn RAM và thread của server, và timeout của load balancer trở thành giới hạn kích thước file. Giải pháp: server chỉ **ký URL**, client PUT trực tiếp lên S3. Server không chạm vào bytes, chỉ làm việc nhẹ là sinh URL.

### Presigned URL hoạt động thế nào
Presigned URL là URL có sẵn **chữ ký SigV4** (Signature Version 4 — cơ chế ký request của AWS) tạo bằng credentials của **server**. Ai cầm URL thì làm được đúng một thao tác (GET hoặc PUT) trên đúng một key, cho tới khi hết hạn. Việc ký diễn ra hoàn toàn ở phía server, không gọi mạng tới AWS.

Ba điểm phải nhớ:
- Quyền của URL **bằng quyền của credentials đã ký**. Role của server không có {{s3:PutObject}} thì URL ký ra cũng bị 403.
- Thời hạn tối đa của URL ký bằng SigV4 là **7 ngày**. Nếu ký bằng credentials tạm thời (role), URL còn **hết hạn sớm hơn khi session của credentials hết hạn**, dù bạn đặt duration dài hơn.
- URL bị lộ (log, referrer, chat) thì ai cũng dùng được tới khi hết hạn: đặt thời hạn ngắn (vài phút), không log nguyên URL.

### Bảo mật presigned URL
- **Thời hạn ngắn**: đặt vài phút cho upload, ngắn hơn cho download. Càng ngắn càng ít rủi ro khi URL bị lộ.
- **Giới hạn method và key**: URL PUT chỉ ghi được đúng key đã ký, URL GET chỉ đọc đúng object đó; không ký một URL "muốn làm gì cũng được".
- **Không nhúng access key vào client**: client chỉ nhận URL, không bao giờ nhận secret. Đây là lý do presigned URL an toàn hơn việc phát credentials cho app mobile.
- **Không log nguyên URL**: URL là "vé vào cửa"; log nó ra CloudWatch/Sentry là mở cửa cho người đọc log.

### Multipart và resume
Một lần PUT tối đa 5 GB; file lớn nên dùng **multipart upload**: chia thành các part (5 MiB–5 GiB, tối đa 10.000 part), upload song song, rồi Complete. Khi upload gián đoạn (mạng rớt, app bị kill), client gọi **ListParts** để biết part nào đã lên S3, chỉ upload các part còn thiếu, rồi Complete. Không resume thì phải upload lại từ đầu — rất tốn thời gian với file vài GB.

### Xử lý URL hết hạn giữa chừng
Nếu presigned URL hết hạn khi upload còn dở, client xin server một URL mới (server kiểm tra quyền rồi ký lại), rồi tiếp tục. Vì URL chỉ sống vài phút, client nên **xin URL theo từng part** hoặc gia hạn trước khi hết hạn, thay vì xin một URL 7 ngày cho cả file.

### Cơ chế hoạt động từng bước (upload lớn có resume)
1. Client xin server danh sách presigned URL cho từng part (hoặc từng part một).
2. Client PUT từng part trực tiếp lên S3; part nào lỗi thì retry riêng part đó.
3. Nếu gián đoạn, client gọi ListParts để biết part 1..k đã có.
4. Client upload các part còn thiếu rồi CompleteMultipartUpload với danh sách part + ETag.
5. Server (hoặc client) gọi AbortIncompleteMultipartUpload định kỳ để dọn part rác.

### Ví dụ đời thực có số liệu
Một app mobile cho upload video 2 GB. Ban đầu không resume: cứ rớt mạng ở phút thứ 3 là người dùng phải chọn lại file và upload từ đầu, tỷ lệ bỏ ngang 35%. Sau khi chuyển sang multipart + ListParts + presigned URL từng part: khi rớt ở part 12/40, app chỉ upload 28 part còn lại; tỷ lệ hoàn thành tăng lên 98%, thời gian upload trung bình giảm vì tận dụng song song. Server không còn nhận bytes nên không còn timeout 60 giây của load balancer.

### Lỗi hay gặp
- Đặt thời hạn presigned URL quá dài (7 ngày) rồi URL bị lộ trong log.
- Không resume: file lớn rớt mạng là làm lại từ đầu.
- Nhúng access key vào client thay vì ký URL.
- Không đặt lifecycle AbortIncompleteMultipartUpload: part rác vẫn tính tiền lưu trữ và không hiện trong LIST.

### Bảng trade-off
| Tiêu chí | Lựa chọn | Lý do |
|---|---|---|
| Bảo mật | Presigned URL thời hạn ngắn | Không lộ credentials, URL tự hết hạn |
| Upload lớn | Multipart + ListParts | Resume, song song, không chạy qua server |
| Dọn rác | AbortIncompleteMultipartUpload | Part dở dang vẫn tính tiền |
| Tải file lớn | CloudFront + presigned | Giảm tải S3, CDN gần người dùng |

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Presigned URL bảo mật thế nào?", "URL hết hạn giữa chừng xử lý ra sao?", "Resume upload lớn thế nào?". Trả lời tốt: URL ký SigV4 có thời hạn ngắn, quyền bằng credentials đã ký, không nhúng secret vào client; hết hạn thì xin URL mới và tiếp tục; resume bằng ListParts rồi chỉ upload phần thiếu; thêm lifecycle abort part rác. Bài tập dưới đây cho bạn tự cài bộ theo dõi part đã upload để resume.`,
  exercises: [
    {
      title: 'Theo dõi part đã upload để resume',
      prompt: 'Implement PartTracker ghi nhận (partNumber, etag) và missing(totalParts) trả danh sách số phần chưa upload.',
      starter: 'class PartTracker {\n    private final Map<Integer, String> parts = new TreeMap<>();\n    void record(int partNumber, String etag) { throw new UnsupportedOperationException("TODO"); }\n    List<Integer> missing(int totalParts) { throw new UnsupportedOperationException("TODO"); }\n}',
      tests: 'public class Main {\n    static int passed=0,total=0;\n    static void check(String n, Runnable r){total++;try{r.run();passed++;System.out.println("PASS "+n);}catch(Throwable t){System.out.println("FAIL "+n+": "+t);}}\n    static void eq(Object e,Object a){if(!Objects.equals(e,a))throw new AssertionError("exp "+e+" got "+a);}\n    public static void main(String[] args){\n      check("all missing initially",()->{PartTracker t=new PartTracker();eq(List.of(1,2,3),t.missing(3));});\n      check("record removes from missing",()->{PartTracker t=new PartTracker();t.record(2,"etag2");eq(List.of(1,3),t.missing(3));});\n      check("all present",()->{PartTracker t=new PartTracker();t.record(1,"a");t.record(2,"b");t.record(3,"c");eq(List.of(),t.missing(3));});\n      System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'class PartTracker {\n    private final Map<Integer, String> parts = new TreeMap<>();\n    void record(int partNumber, String etag) { parts.put(partNumber, etag); }\n    List<Integer> missing(int totalParts) { List<Integer> m=new ArrayList<>(); for(int i=1;i<=totalParts;i++) if(!parts.containsKey(i)) m.add(i); return m; }\n}',
      hints: ['Dùng TreeMap theo số phần; missing là các số chưa có.'],
      explain: 'Theo dõi part đã có để resume upload bị gián đoạn.',
    },
  ],
  check: [
    { q: 'Presigned URL nên có thời hạn bao lâu?', options: ['Vài phút', '24 giờ', '7 ngày', 'Vĩnh viễn'], answer: 0, explain: 'Thời hạn ngắn giảm rủi ro lộ URL.' },
    { q: 'Làm sao resume multipart upload?', options: ['Upload lại toàn bộ file', 'Gọi ListParts rồi upload phần thiếu', 'Tạo bucket mới', 'Dùng access key client'], answer: 1, explain: 'ListParts cho biết part nào đã có, client chỉ upload phần thiếu.' },
  ],
  related: ['aws-008'],
  tags: ['S3', 'presigned URL', 'resume', 'security'],
},
{
  id: 'lesson-aws-011',
  track: 'aws',
  order: 11,
  title: 'SQS message timer (delay queue) kết hợp visibility timeout, DLQ và consumer idempotent',
  level: 'senior',
  minutes: 45,
  goals: [
    'Hiểu message timer (DelaySeconds) là gì và khác visibility timeout ở điểm nào',
    'Mô phỏng một hàng đợi có cả delay, visibility timeout, DLQ và idempotent trong Java thuần',
    'Giải thích vì sao at-least-once buộc consumer phải idempotent, và "cửa sổ crash" giữa xử lý và delete',
    'Tránh các lỗi production: delay đặt sai, visibility timeout ngắn hơn thời gian xử lý, DLQ không ai canh',
  ],
  body: `### Tóm tắt: message timer hoãn việc xử lý, visibility timeout chống giao trùng
**Message timer** (còn gọi delay queue) là lệnh "hãy giao message này cho consumer sau N giây nữa", còn **visibility timeout** là "khoá mềm" giữ message khỏi bị consumer khác nhận trong lúc bạn đang xử lý. Hai cơ chế này độc lập nhưng hay bị nhầm; bài này mô phỏng cả hai cùng DLQ và idempotency để bạn nắm chắc vòng đời một message.

### Bắt đầu từ gốc: queue là gì
**Queue** (hàng đợi) là một danh sách message mà nhiều người gửi vào (producer) và nhiều người lấy ra (consumer) theo tốc độ của họ. Ví dụ đời thường: quầy bánh mì có một tờ giấy ghi order; khách gọi món (producer) ghi vào tờ giấy, thợ làm bánh (consumer) đọc và làm. Tờ giấy giúp khách không phải chờ thợ, và thợ không bị quá tải khi có 50 khách cùng lúc. Trong hệ thống phần mềm, queue giúp **tách rời** service gửi và service xử lý, **hấp thụ đỉnh tải** và **thử lại** khi xử lý lỗi.

### Message timer (delay queue): hoãn xử lý có chủ đích
SQS cho phép đặt {{DelaySeconds}} (0–900 giây, tức tối đa 15 phút) khi gửi, hoặc cấu hình delay mặc định cho cả queue. Message vẫn nằm trong queue nhưng **chưa được giao** cho tới khi hết delay. Việc "chưa được giao" này **khác** với visibility timeout:

| | Message timer (delay) | Visibility timeout |
|---|---|---|
| Mục đích | Hoãn có chủ đích (scheduling) | Chống giao trùng khi đang xử lý |
| Ai đặt | Producer đặt lúc gửi (hoặc queue mặc định) | Queue cấu hình; consumer gia hạn bằng ChangeMessageVisibility |
| Tính từ lúc nào | Từ lúc message được gửi | Từ lúc message được nhận (receive) |
| Hết hạn thì sao | Message mới bắt đầu **hiện ra** để nhận | Message **quay lại** visible, ReceiveCount +1 |

Ví dụ: bạn muốn gửi email nhắc "đơn hàng chưa thanh toán" sau 24 giờ. Thay vì viết một cron job quét DB, bạn gửi message SQS với {{DelaySeconds}} = 86400? Không — delay tối đa chỉ 900 giây, nên với 24 giờ bạn phải dùng cơ chế khác (ví dụ Lambda đọc SQS rồi gửi lại, hoặc EventBridge Scheduler). Delay queue chỉ hợp cho hoãn ngắn (vài phút tới 15 phút): "gọi lại API đối tác sau 5 phút nếu lần đầu timeout".

### Visibility timeout: khoá mềm chống giao trùng
Khi consumer gọi {{ReceiveMessage}}, message **không bị xoá** mà trở nên **vô hình** với consumer khác trong {{visibility timeout}} (mặc định 30 giây, tối đa 12 giờ). Nếu consumer xử lý xong và gọi {{DeleteMessage}} trước khi hết giờ, message biến mất. Nếu consumer crash hoặc xử lý quá lâu, hết giờ message **hiện lại** và được giao lại (ReceiveCount tăng). Đây là lý do SQS là **at-least-once**: hệ thống thà giao lại còn hơn làm mất.

Hệ quả quan trọng: visibility timeout phải **lớn hơn** thời gian xử lý thực tế (p99, không phải trung bình). Nếu đặt 30 giây mà consumer xử lý 45 giây, message sẽ bị giao lại khi consumer đầu **vẫn đang chạy** → xử lý trùng, ReceiveCount tăng nhanh, đủ ngưỡng thì rơi vào DLQ dù không hề lỗi.

### DLQ và maxReceiveCount: nơi message "độc" đi vào
**Poison message** là message mà consumer không bao giờ xử lý nổi: JSON hỏng, dữ liệu vi phạm ràng buộc DB, gọi API đối tác trả 500 mãi. Nếu cứ giao lại vô hạn, nó tốn tiền, che khuất message tốt và làm loãng metric. **Dead-letter queue (DLQ)** là queue rác: khi số lần nhận ({{ApproximateReceiveCount}}) **vượt** {{maxReceiveCount}}, SQS chuyển message sang DLQ. Chọn maxReceiveCount 3–5 là phổ biến (đủ vượt lỗi tạm thời, không quá muộn). DLQ phải có **alarm** (số message > 0) và quy trình **redrive** (đẩy ngược lại queue nguồn sau khi sửa lỗi).

### At-least-once và "cửa sổ crash"
Ngay cả khi SQS không giao trùng, chính bạn vẫn tạo ra trùng: consumer xử lý xong (ghi DB, gửi email), nhưng **crash trước khi** gọi DeleteMessage → message quay lại và bị xử lý lần hai. Khoảng thời gian giữa "tác dụng phụ xong" và "delete xong" chính là **cửa sổ crash**. Cách chống:
- Mỗi message mang **business id** ({{orderId}}, {{eventId}}).
- Trong **cùng transaction** với thay đổi nghiệp vụ, insert id vào bảng {{processed_events}} có unique constraint. Trùng id nghĩa là đã xử lý → bỏ qua rồi delete.
- Thao tác tự nhiên idempotent ({{UPDATE ... WHERE status = 'PENDING'}}) hoặc truyền **idempotency key** cho bên nhận side effect.

### Sơ đồ vòng đời kết hợp
~~~text
 send(body, delay=5s)        [CHỜ DELAY 5s] --hết delay--> [VISIBLE]
       |                                                        |
       |                                              receive --> [IN-FLIGHT, ẩn visibilityMs]
       |                                                        |                 |
       |                                              delete OK |   hết timeout    |
       |                                                        v                 v
       |                                                   (biến mất)   [VISIBLE], ReceiveCount+1
       |                                                                          |
       |                                              ReceiveCount > max --> [DLQ]
       v
 processed_events (unique business id) -- chống xử lý trùng khi ReceiveCount tăng
~~~

### Ví dụ đời thực có số liệu
Một service gửi 12.000 message "đồng bộ tồn kho" mỗi giờ. Ban đầu visibility timeout để mặc định 30 giây, nhưng p99 xử lý là 52 giây (gọi ERP đối tác). Triệu chứng: tỷ lệ message vào DLQ tăng từ 0 lên 4%/ngày, và tồn kho bị trừ hai lần ở một số SKU. Điều tra: log cho thấy cùng một {{eventId}} được xử lý 2–3 lần cách nhau đúng 30 giây. Xử lý: (1) nâng visibility timeout lên 90 giây (> p99 52s có dư), (2) thêm bảng {{processed_events}} unique theo {{eventId}} trong cùng transaction cập nhật tồn kho, (3) đặt alarm DLQ + redrive 3.000 message tồn. Kết quả sau 1 tuần: DLQ về 0, không còn trừ trùng.

### Lỗi hay gặp
- Đặt delay quá lớn rồi hỏi "vì sao message không được xử lý": delay tối đa 900 giây, và message **chưa hiện** trong queue nên ReceiveMessage trả rỗng — không phải lỗi.
- Visibility timeout ngắn hơn p99: giao trùng + DLQ oan. Đặt theo p99 rồi cộng dư, hoặc dùng ChangeMessageVisibility/heartbeat cho job dài.
- Không idempotent: chỉ một lần crash giữa xử lý và delete là đủ gây side effect kép (gửi email hai lần, trừ tiền hai lần).
- DLQ không alarm: message độc nằm im, không ai biết, dữ liệu chết lặng lẽ.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Delay queue khác visibility timeout thế nào?", "Vì sao SQS là at-least-once và consumer phải làm gì?", "Visibility timeout nên đặt bao nhiêu?", "DLQ hoạt động ra sao?". Trả lời tốt: delay là hoãn có chủ đích từ lúc gửi, visibility là khoá mềm từ lúc nhận; at-least-once nên consumer phải idempotent bằng business id + unique constraint; visibility timeout > p99 (có dư) hoặc gia hạn bằng heartbeat; DLQ theo maxReceiveCount, phải có alarm và redrive. Bài tập dưới đây cho bạn tự cài một queue có đủ delay + visibility + DLQ + idempotent để nắm chắc vòng đời.

> Senior tip: Đừng đặt visibility timeout cực lớn (12 giờ) để "cho chắc": message bị khoá 12 giờ nếu consumer chết giữa chừng, và bạn mất khả năng retry nhanh. Đặt vừa p99, và với job dài thì gia hạn bằng ChangeMessageVisibility định kỳ — đó là "lease renewal" đúng nghĩa.`,
  exercises: [
    {
      title: 'Mô phỏng queue có message timer, visibility timeout, DLQ và idempotent',
      prompt: `Cài đặt một hàng đợi trong bộ nhớ mô phỏng SQS (đơn giản hoá: thứ tự theo lúc gửi). Thời gian lấy từ **đồng hồ giả** ({{LongSupplier}} trả mili giây) nên test không cần sleep.

Đã có sẵn: record {{Received}}, lớp {{Msg}} (gồm {{id}}, {{body}}, {{notBefore}} = thời điểm sớm nhất được giao, {{receiveCount}}, {{visibleAt}}, {{handle}}), constructor, {{send(body)}} và {{send(body, delayMs)}} (đặt {{notBefore = now + delayMs}}), {{size}}. Bạn cài:

1. {{receive(max)}}: duyệt message theo thứ tự, lấy tối đa {{max}} message **đang visible**. Một message visible khi {{notBefore <= now}} (đã hết delay) **và** {{visibleAt <= now}} (không còn in-flight). Với mỗi message:
   ▸ nếu có DLQ và {{receiveCount >= maxReceiveCount}}: xoá khỏi queue này và chuyển sang DLQ (giữ nguyên id, body, notBefore), **không** trả về, không tính vào {{max}};
   ▸ ngược lại: {{receiveCount++}}, {{visibleAt = now + visibilityMs}}, receipt handle mới = {{id + "#" + receiveCount}}, thêm vào kết quả.
2. {{delete(handle)}}: xoá message có receipt handle **hiện tại**, trả về true; handle cũ hoặc không tồn tại trả về false.
3. {{process(handle)}}: consumer xử lý xong. Nếu không tìm thấy handle thì trả về false. Nếu {{body}} (mã đơn/event id) đã nằm trong tập đã xử lý → **bỏ qua**: xoá message, trả về false (idempotent). Ngược lại: thêm {{body}} vào tập đã xử lý, xoá message, trả về true.`,
      starter: `record Received(String messageId, String body, String receiptHandle, int receiveCount) {}

class DelayQueue {
    private static final class Msg {
        final String id, body;
        final long notBefore;     // thời điểm sớm nhất message được phép giao (message timer)
        int receiveCount;         // số lần đã được giao
        long visibleAt;           // thời điểm message hiện lại; 0 = visible ngay
        String handle;            // receipt handle của lần nhận gần nhất
        Msg(String id, String body, long notBefore) { this.id = id; this.body = body; this.notBefore = notBefore; }
    }

    private final LongSupplier clock;          // mili giây, inject để test xác định
    private final long visibilityMs;
    private final int maxReceiveCount;
    private final DelayQueue dlq;              // có thể null
    private final List<Msg> messages = new ArrayList<>();
    private final Set<String> processed = new HashSet<>();
    private int seq = 0;

    DelayQueue(LongSupplier clock, long visibilityMs, int maxReceiveCount, DelayQueue dlq) {
        this.clock = clock;
        this.visibilityMs = visibilityMs;
        this.maxReceiveCount = maxReceiveCount;
        this.dlq = dlq;
    }

    String send(String body) { return send(body, 0); }

    String send(String body, long delayMs) {
        String id = "m" + (++seq);
        messages.add(new Msg(id, body, clock.getAsLong() + delayMs));
        return id;
    }

    int size() { return messages.size(); }

    List<Received> receive(int max) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean delete(String handle) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean process(String handle) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void eq(String name, Object expected, Supplier<Object> actual) {
        total++;
        try {
            Object got = actual.get();
            if (Objects.equals(expected, got)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": mong đợi " + expected + ", nhận " + got);
        } catch (RuntimeException e) {
            System.out.println("FAIL " + name + ": ném " + e);
        }
    }
    static String ids(List<Received> rs) {
        return rs.stream().map(r -> r.messageId() + ":" + r.receiveCount()).collect(Collectors.joining(","));
    }
    public static void main(String[] args) {
        // A. message timer + visibility timeout
        long[] a = { 0 };
        DelayQueue qa = new DelayQueue(() -> a[0], 30_000, 5, null);
        qa.send("later", 5_000); qa.send("now");
        eq("delay ẩn message trước khi hết timer", "m2:1", () -> ids(qa.receive(10)));
        eq("hết delay thì message hiện ra", "m1:1", () -> { a[0] = 5_000; return ids(qa.receive(10)); });
        eq("in-flight bị ẩn trong visibility window", "", () -> { a[0] = 6_000; return ids(qa.receive(10)); });
        eq("hết visibility timeout thì giao lại", "m1:2,m2:2", () -> { a[0] = 35_000; return ids(qa.receive(10)); });

        // B. idempotent theo body
        long[] b = { 0 };
        DelayQueue qb = new DelayQueue(() -> b[0], 1_000, 5, null);
        qb.send("order-42"); qb.send("order-42");
        List<Received> batch = qb.receive(10);
        eq("nhận hai message trùng mã đơn", "m1:1,m2:1", () -> ids(batch));
        eq("xử lý message đầu", true, () -> qb.process(batch.get(0).receiptHandle()));
        eq("message trùng mã đơn bị bỏ qua", false, () -> qb.process(batch.get(1).receiptHandle()));
        eq("queue rỗng sau xử lý", 0, () -> qb.size());
        eq("xoá handle đã xử lý lại lần nữa", false, () -> qb.delete(batch.get(0).receiptHandle()));
        eq("handle không tồn tại", false, () -> qb.delete("m9#1"));

        // C. DLQ theo maxReceiveCount
        long[] c = { 0 };
        DelayQueue cdlq = new DelayQueue(() -> c[0], 30_000, 10, null);
        DelayQueue qc = new DelayQueue(() -> c[0], 1_000, 2, cdlq);
        qc.send("poison"); qc.send("ok");
        eq("lượt giao đầu", "m1:1,m2:1", () -> ids(qc.receive(10)));
        eq("xoá message ok", true, () -> qc.delete("m2#1"));
        eq("lượt giao hai của poison", "m1:2", () -> { c[0] = 1_000; return ids(qc.receive(10)); });
        eq("lượt nhận vượt maxReceiveCount không trả về", "", () -> { c[0] = 2_000; return ids(qc.receive(10)); });
        eq("queue chính rỗng", 0, () -> qc.size());
        eq("DLQ có đúng 1 message", 1, () -> cdlq.size());
        eq("DLQ giữ id và body gốc", "m1/poison", () -> {
            Received r = cdlq.receive(1).get(0);
            return r.messageId() + "/" + r.body();
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Received(String messageId, String body, String receiptHandle, int receiveCount) {}

class DelayQueue {
    private static final class Msg {
        final String id, body;
        final long notBefore;
        int receiveCount;
        long visibleAt;
        String handle;
        Msg(String id, String body, long notBefore) { this.id = id; this.body = body; this.notBefore = notBefore; }
    }

    private final LongSupplier clock;
    private final long visibilityMs;
    private final int maxReceiveCount;
    private final DelayQueue dlq;
    private final List<Msg> messages = new ArrayList<>();
    private final Set<String> processed = new HashSet<>();
    private int seq = 0;

    DelayQueue(LongSupplier clock, long visibilityMs, int maxReceiveCount, DelayQueue dlq) {
        this.clock = clock;
        this.visibilityMs = visibilityMs;
        this.maxReceiveCount = maxReceiveCount;
        this.dlq = dlq;
    }

    String send(String body) { return send(body, 0); }

    String send(String body, long delayMs) {
        String id = "m" + (++seq);
        messages.add(new Msg(id, body, clock.getAsLong() + delayMs));
        return id;
    }

    int size() { return messages.size(); }

    List<Received> receive(int max) {
        long now = clock.getAsLong();
        List<Received> out = new ArrayList<>();
        Iterator<Msg> it = messages.iterator();
        while (it.hasNext() && out.size() < max) {
            Msg m = it.next();
            if (m.notBefore > now) continue;                  // message timer: chưa tới hạn delay
            if (m.visibleAt > now) continue;                  // đang in-flight trong visibility timeout
            if (dlq != null && m.receiveCount >= maxReceiveCount) {  // lần nhận này sẽ VƯỢT ngưỡng
                it.remove();
                dlq.messages.add(new Msg(m.id, m.body, m.notBefore));  // chuyển sang DLQ, giữ id/body
                continue;
            }
            m.receiveCount++;
            m.visibleAt = now + visibilityMs;                 // ẩn trong visibility timeout
            m.handle = m.id + "#" + m.receiveCount;           // mỗi lần nhận một handle mới
            out.add(new Received(m.id, m.body, m.handle, m.receiveCount));
        }
        return out;
    }

    private Msg byHandle(String handle) {
        for (Msg m : messages) if (handle.equals(m.handle)) return m;
        return null;
    }

    boolean delete(String handle) {
        Msg m = byHandle(handle);
        return m != null && messages.remove(m);
    }

    boolean process(String handle) {
        Msg m = byHandle(handle);
        if (m == null) return false;                          // đã bị xoá trước đó
        boolean daXuLy = processed.contains(m.body);          // idempotent theo business id
        processed.add(m.body);
        messages.remove(m);
        return !daXuLy;
    }
}`,
      hints: [
        'Một message visible khi {{notBefore <= now}} **và** {{visibleAt <= now}}. Nhận xong thì đẩy {{visibleAt = now + visibilityMs}} — đó là "khoá mềm".',
        'Dùng {{Iterator}} để vừa duyệt vừa {{remove}} khi chuyển message sang DLQ, tránh {{ConcurrentModificationException}}.',
        'Kiểm tra DLQ **trước** khi tăng {{receiveCount}}: với maxReceiveCount = 2, message được giao 2 lần, lần nhận thứ 3 mới chuyển sang DLQ.',
        'Idempotent: giữ một {{Set<String> processed}} theo {{body}}; gặp lại body đã có thì xoá message và trả về false.',
      ],
      explain: `### Lời giải
- {{receive}} duyệt message theo thứ tự, bỏ qua message chưa hết delay ({{notBefore > now}}) và message đang in-flight ({{visibleAt > now}}). Message đủ điều kiện thì hoặc chuyển sang DLQ (nếu lần nhận này vượt {{maxReceiveCount}}), hoặc được "khoá mềm" bằng cách đẩy {{visibleAt}} ra {{now + visibilityMs}} và cấp handle mới.
- {{process}} là điểm chống trùng: tra {{body}} trong {{processed}}; đã có thì bỏ qua (false), chưa có thì ghi nhớ và xử lý (true). Kết hợp với việc xoá message, nó mô phỏng đúng "insert vào processed_events trong cùng transaction".
- {{delete}} chỉ nhận handle **hiện tại**; handle cũ (từ lần nhận trước) bị từ chối, tránh consumer cũ xoá message khi consumer mới đang xử lý.

### Vì sao at-least-once buộc idempotent
SQS không có cơ chế "exactly-once" cho standard queue: message có thể được giao lại do timeout, do crash giữa xử lý và delete, hoặc do SQS phân tán trên nhiều server. Thay vì cố chống trùng ở tầng queue (rất đắt), ta đẩy việc chống trùng xuống consumer bằng business id + unique constraint — đó là mẫu "idempotent consumer" chuẩn.

### Lỗi hay gặp
- So {{receiveCount}} với ngưỡng **sau** khi tăng: message vào DLQ sớm hơn một lần.
- Lưu handle là id message: consumer cũ xoá được message của consumer mới.
- Quên rằng message có delay **chưa hiện** trong queue: tưởng message mất, thực ra chỉ chưa tới hạn.`,
    },
  ],
  check: [
    {
      q: 'Message gửi với {{DelaySeconds}} = 300, consumer poll ngay sau đó. Vì sao ReceiveMessage trả về rỗng?',
      options: ['Message đã vào DLQ', 'Message chưa tới hạn delay nên chưa được giao, không phải mất', 'Queue bị lỗi', 'Cần đổi visibility timeout mới nhận được'],
      answer: 1,
      explain: `Message timer hoãn việc **giao** message: trong 300 giây đầu message nằm trong queue nhưng chưa visible, nên ReceiveMessage trả rỗng. Đây không phải mất message (delay hết thì message hiện ra), không phải DLQ (DLQ chỉ khi vượt maxReceiveCount), và visibility timeout không liên quan (nó tính từ lúc nhận).`,
    },
    {
      q: 'Consumer xử lý p99 = 52 giây nhưng visibility timeout để 30 giây. Hậu quả?',
      options: ['Message mất vĩnh viễn', 'Message bị giao lại khi consumer đầu vẫn chạy, gây xử lý trùng và có thể vào DLQ oan', 'SQS tự động gia hạn', 'Consumer nhận ngoại lệ'],
      answer: 1,
      explain: `Hết 30 giây message hiện lại và consumer khác nhận trong khi consumer đầu vẫn xử lý (p99 52s): trùng, ReceiveCount tăng, đủ ngưỡng thì vào DLQ dù không lỗi. SQS không tự gia hạn (phải gọi ChangeMessageVisibility); không làm mất message; không ném ngoại lệ. Đặt visibility timeout > p99 có dư, hoặc gia hạn định kỳ.`,
    },
    {
      q: 'Để chống xử lý trùng khi message bị giao lại, consumer nên làm gì?',
      options: ['Đặt visibility timeout = 12 giờ', 'Dùng business id + bảng processed_events unique trong cùng transaction với thay đổi nghiệp vụ', 'Tắt DLQ', 'Gọi DeleteMessage trước khi xử lý'],
      answer: 1,
      explain: `At-least-once nên phải idempotent: unique constraint theo business id trong cùng transaction đảm bảo mỗi id chỉ có tác dụng một lần. Visibility timeout 12 giờ chỉ khoá message lâu, không chống trùng; tắt DLQ làm message độc kẹt; delete trước khi xử lý gây mất message nếu xử lý lỗi.`,
    },
  ],
  related: ['aws-008', 'aws-028', 'aws-007'],
  tags: ['SQS', 'message timer', 'delay queue', 'visibility timeout', 'DLQ', 'idempotent'],
},
{
  id: 'lesson-aws-012',
  track: 'aws',
  order: 12,
  title: 'S3 multipart upload: ETag ghép từ part và conditional write (If-None-Match) chống ghi đè',
  level: 'senior',
  minutes: 45,
  goals: [
    'Hiểu ETag của object đơn (MD5) khác ETag của object multipart (MD5-của-MD5 + "-N")',
    'Mô phỏng multipart upload: upload part, kiểm tra ETag từng part, ghép và tính ETag cuối',
    'Dùng conditional write (If-None-Match: *) để "chỉ tạo nếu chưa tồn tại", chống hai client ghi trùng',
    'Biết vì sao ETag KHÔNG phải hash nội dung đáng tin với multipart và object SSE-KMS',
  ],
  body: `### Tóm tắt: multipart ghép part bằng ETag, conditional write chống ghi đè
**Multipart upload** chia file lớn thành nhiều **part** upload song song rồi ghép lại; **ETag** là "mã vân tay" của object dùng để kiểm tra toàn vẹn. **Conditional write** ({{If-None-Match: *}}) là "chỉ ghi nếu object chưa tồn tại" — một khoá lạc quan đơn giản ngay trong S3, chống hai client cùng tạo một key.

### Bắt đầu từ gốc: vì sao cần multipart
Một lần {{PUT}} S3 tối đa **5 GB**. Với file 2 GB, upload một lần rất rủi ro: mạng rớt là phải làm lại từ đầu, và không tận dụng được băng thông song song. **Multipart upload** chia file thành các part (mỗi part 5 MiB–5 GiB, tối đa 10.000 part), upload từng part (có thể song song, part nào lỗi thì upload lại riêng part đó), rồi {{CompleteMultipartUpload}} để S3 ghép thành object. Lợi ích: **resume** (mất mạng không mất part đã xong), **song song** (nhanh hơn), **kiểm tra từng phần**.

### ETag là gì
**ETag** (entity tag) là một chuỗi định danh phiên bản của object, S3 trả về khi PUT và trong header {{ETag}} khi GET/HEAD. Với object **ghi một lần** (không multipart), ETag = **MD5 hex** của nội dung (32 ký tự hex). Với object **multipart**, ETag = MD5 hex của **nối các digest 16 byte của từng part theo thứ tự số phần**, rồi thêm **"-N"** (N = số part), ví dụ {{9ffa069295e38c0d33a776af530a0e16-3}}. Nhờ hậu tố "-N", bạn biết ngay object này được ghép từ 3 part.

~~~text
part 1 --MD5--> d1 (16 byte) --\
part 2 --MD5--> d2 (16 byte) ----> nối d1+d2+d3 --MD5--> hex + "-3"  = ETag object
part 3 --MD5--> d3 (16 byte) --/
~~~

### Conditional write: khoá lạc quan trong S3
Từ 2024, S3 hỗ trợ **conditional write** trên {{PutObject}} và {{CompleteMultipartUpload}}:
- {{If-None-Match: *}}: chỉ ghi nếu **chưa có** object ở key đó. Nếu đã có → trả về 412 (Precondition Failed). Đây là cách "create if not exists" nguyên tử, không cần đọc-rồi-ghi (vốn có race).
- {{If-Match: <etag>}}: chỉ ghi nếu object hiện tại đúng ETag đó (optimistic concurrency, chống lost update).

Ví dụ: hai client cùng upload {{reports/2026/r1.json}} với presigned URL và {{If-None-Match: *}}. Dù đến gần như đồng thời, chỉ **một** request thành công, request kia nhận 412 — không có chuyện cả hai ghi đè nhau. Đây chính là "khoá lạc quan" (optimistic locking) ở tầng object store.

### Presigned URL ghép với multipart
Với upload lớn từ client (mobile, browser), server không nên nhận bytes. Server sinh **presigned URL cho từng part** (mỗi URL ký cho đúng một {{UploadPart}}), client PUT trực tiếp từng part lên S3, rồi gọi Complete. Kết hợp {{If-None-Match: *}} ở bước Complete để chống trùng khi client bấm "tạo" hai lần hoặc retry.

### ETag KHÔNG phải hash nội dung đáng tin
Một cái bẫy lớn: ETag của object **multipart** không bằng MD5 của toàn file, nên không dùng để so sánh nội dung được. Thêm nữa, object mã hoá bằng **SSE-KMS** có ETag **không phải** MD5 (S3 không expose MD5 cho object KMS). Muốn checksum toàn vẹn thật sự, dùng **Checksum SHA-256** ({{x-amz-checksum-sha256}}) hoặc tính MD5 ở client trước khi upload và tự so sánh. Đừng bao giờ giả định "ETag == MD5(file)" cho mọi object.

### Ví dụ đời thực có số liệu
Một app cho upload video 2 GB từ mobile. Ban đầu Complete không kiểm ETag part, và nút "Tạo album" bị double-tap tạo hai bản ghi. Triệu chứng: một số video xuất hiện hai lần, và 0,3% upload Complete fail vì thiếu part giữa chừng (mạng rớt). Xử lý: (1) Complete kiểm tra part tạo dãy 1..N liên tục và ETag từng part khớp MD5 đã lưu → thiếu/sai part bị từ chối ngay; (2) thêm {{If-None-Match: *}} khi tạo key album → double-tap chỉ một lần thành công; (3) lifecycle {{AbortIncompleteMultipartUpload}} sau 7 ngày dọn part rác. Kết quả: không còn album trùng, tỷ lệ Complete fail giảm còn 0,02% (client resume part thiếu thay vì làm lại).

### Lỗi hay gặp
- Coi ETag multipart == MD5(file): sai, dùng checksum SHA-256 nếu cần toàn vẹn.
- Complete mà không kiểm part: thiếu part giữa chừng vẫn có thể thành object thiếu dữ liệu (nếu client tự ghép danh sách sai).
- Không dùng conditional write: hai request đồng thời cùng key ghi đè nhau (lost update), hoặc double-submit tạo trùng.
- Quên abort upload dở dang: part rác vẫn tính tiền lưu trữ và không hiện trong LIST.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "ETag của multipart khác ETag thường thế nào?", "Làm sao chống hai client cùng ghi một key?", "ETag có phải MD5 đáng tin không?", "Thiết kế upload video 2 GB từ mobile". Trả lời tốt: multipart ETag = MD5-của-các-MD5 + "-N"; dùng If-None-Match để create-if-absent nguyên tử; ETag multipart/SSE-KMS không phải MD5 nội dung, cần checksum SHA-256; presigned URL từng part + Complete có kiểm ETag + abort + conditional write. Bài tập dưới đây cho bạn tự cài ghép part, kiểm ETag và conditional write.

> Senior tip: Conditional write là "compare-and-set" của object store — rẻ, nguyên tử, không cần thêm một lần đọc. Khi thiết kế "tạo mới nếu chưa có" (idempotent create), luôn nghĩ tới If-None-Match trước khi nghĩ tới đọc-rồi-kiểm-rồi-ghi, vì cách sau luôn có cửa sổ race.`,
  exercises: [
    {
      title: 'Mô phỏng multipart upload: ETag part, ghép 1..N, ETag cuối và conditional write',
      prompt: `Mô phỏng multipart upload của S3 trong bộ nhớ (không dùng AWS SDK), có thêm **conditional write**.

Đã có sẵn: record {{PartETag(partNumber, etag)}}, lớp {{Upload}} (gồm {{key}}, {{parts}} = TreeMap số phần → bytes, {{done}}), constructor, {{createUpload(key)}} (trả về {{uploadId}}, gắn với key đích), {{abort}} chưa cài. Bạn cài:

1. {{uploadPart(uploadId, partNumber, data)}}: nếu uploadId không tồn tại hoặc đã {{done}} → ném {{IllegalArgumentException}}; nếu {{partNumber < 1}} → ném {{IllegalArgumentException}}. Lưu {{data}} vào {{parts[partNumber]}} và trả về **ETag của part** = MD5 hex lowercase (32 ký tự) của {{data}}.
2. {{complete(uploadId, parts, ifNoneMatchStar)}}:
   ▸ nếu uploadId không tồn tại hoặc đã {{done}} → ném {{IllegalArgumentException}};
   ▸ nếu {{ifNoneMatchStar == true}} và {{key}} đã có trong store → ném {{IllegalArgumentException}} (mô phỏng 412 Precondition Failed của {{If-None-Match: *}});
   ▸ {{parts}} phải tạo thành dãy số phần {{1..N}} (N = {{parts.size()}}), không trùng, không thiếu, không có số ngoài {{1..N}}; mỗi part phải đã upload và ETag truyền vào phải khớp MD5 của bytes đã lưu — sai bất kỳ điều kiện nào → ném {{IllegalArgumentException}};
   ▸ ETag object cuối = MD5 hex của **nối các raw digest 16 byte của từng part theo thứ tự số phần**, rồi nối {{"-" + N}}; lưu vào store theo {{key}}, đánh dấu {{done}}, trả về ETag đó.
3. {{abort(uploadId)}}: nếu không tồn tại hoặc đã {{done}} → ném {{IllegalArgumentException}}; ngược lại đánh dấu {{done}}.

{{md5Hex}} và {{md5Raw}} là hai hàm tiện ích có sẵn trong lời giải mẫu (dùng {{MessageDigest}}).`,
      starter: `import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

record PartETag(int partNumber, String etag) {}

class ConditionalMultipart {
    private static final class Upload {
        final String key;
        final Map<Integer, byte[]> parts = new TreeMap<>();
        boolean done;
        Upload(String key) { this.key = key; }
    }

    private final Map<String, Upload> uploads = new HashMap<>();
    private final Map<String, String> store = new HashMap<>();   // key -> ETag object đã complete
    private int seq = 0;

    String createUpload(String key) {
        String id = "u" + (++seq);
        uploads.put(id, new Upload(key));
        return id;
    }

    String uploadPart(String uploadId, int partNumber, byte[] data) {
        throw new UnsupportedOperationException("TODO");
    }

    String complete(String uploadId, List<PartETag> parts, boolean ifNoneMatchStar) {
        throw new UnsupportedOperationException("TODO");
    }

    void abort(String uploadId) {
        throw new UnsupportedOperationException("TODO");
    }

    private static byte[] md5Raw(byte[] data) {
        try { return MessageDigest.getInstance("MD5").digest(data); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }

    private static String md5Hex(byte[] data) {
        return HexFormat.of().formatHex(md5Raw(data));
    }
}`,
      tests: `import java.nio.charset.StandardCharsets;
import java.util.List;

public class Main {
    static int passed = 0, total = 0;
    static void eq(String name, Object expected, Supplier<Object> actual) {
        total++;
        try {
            Object got = actual.get();
            if (Objects.equals(expected, got)) { passed++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": mong đợi " + expected + ", nhận " + got);
        } catch (RuntimeException e) {
            System.out.println("FAIL " + name + ": ném " + e);
        }
    }
    static String catchIae(Supplier<Object> s) {
        try { s.get(); return "no exception"; } catch (IllegalArgumentException e) { return "IAE"; }
    }
    public static void main(String[] args) {
        ConditionalMultipart u = new ConditionalMultipart();
        byte[] d1 = "don-hang-001".getBytes(StandardCharsets.UTF_8);
        byte[] d2 = "don-hang-002".getBytes(StandardCharsets.UTF_8);
        byte[] d3 = "don-hang-003".getBytes(StandardCharsets.UTF_8);

        String id1 = u.createUpload("invoices/inv-1");
        String e1 = u.uploadPart(id1, 1, d1);
        String e2 = u.uploadPart(id1, 2, d2);
        String e3 = u.uploadPart(id1, 3, d3);
        eq("etag phần là 32 ký tự hex lowercase", true, () -> e1.matches("[0-9a-f]{32}"));
        eq("cùng dữ liệu có cùng etag", true, () -> u.uploadPart(id1, 1, d1).equals(e1));
        eq("ghép 3 phần theo thứ tự", "9ffa069295e38c0d33a776af530a0e16-3", () -> u.complete(id1, List.of(new PartETag(1, e1), new PartETag(2, e2), new PartETag(3, e3)), false));

        String id2 = u.createUpload("invoices/inv-2");
        String f1 = u.uploadPart(id2, 1, d1);
        eq("một phần duy nhất", "c783668b635eedcdf7019c092043d174-1", () -> u.complete(id2, List.of(new PartETag(1, f1)), false));

        String id3 = u.createUpload("k3");
        String g1 = u.uploadPart(id3, 1, d1);
        String g2 = u.uploadPart(id3, 2, d2);
        String g3 = u.uploadPart(id3, 3, d3);
        eq("ghép ngược thứ tự vẫn cùng ETag", "9ffa069295e38c0d33a776af530a0e16-3", () -> u.complete(id3, List.of(new PartETag(3, g3), new PartETag(1, g1), new PartETag(2, g2)), false));

        String id4 = u.createUpload("k4");
        u.uploadPart(id4, 1, d1); u.uploadPart(id4, 3, d3);
        eq("bỏ phần giữa chừng bị từ chối", "IAE", () -> catchIae(() -> u.complete(id4, List.of(new PartETag(1, e1), new PartETag(3, e3)), false)));

        String id5 = u.createUpload("k5");
        u.uploadPart(id5, 1, d1);
        eq("etag phần sai bị từ chối", "IAE", () -> catchIae(() -> u.complete(id5, List.of(new PartETag(1, "00000000000000000000000000000000")), false)));

        String idA = u.createUpload("reports/r1");
        String a1 = u.uploadPart(idA, 1, d1);
        eq("conditional create thành công khi chưa tồn tại", "c783668b635eedcdf7019c092043d174-1", () -> u.complete(idA, List.of(new PartETag(1, a1)), true));

        String idB = u.createUpload("reports/r1");
        String b1 = u.uploadPart(idB, 1, d2);
        eq("conditional create bị từ chối khi đã tồn tại", "IAE", () -> catchIae(() -> u.complete(idB, List.of(new PartETag(1, b1)), true)));

        String idC = u.createUpload("kC");
        u.abort(idC);
        eq("sau abort thì complete bị từ chối", "IAE", () -> catchIae(() -> u.complete(idC, List.of(), false)));
        eq("upload id không tồn tại", "IAE", () -> catchIae(() -> u.uploadPart("không-tồn-tại", 1, d1)));

        String idD = u.createUpload("kD");
        String dOne = u.uploadPart(idD, 1, d1);
        u.complete(idD, List.of(new PartETag(1, dOne)), false);
        eq("sau complete thì abort bị từ chối", "IAE", () -> catchIae(() -> { u.abort(idD); return null; }));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

record PartETag(int partNumber, String etag) {}

class ConditionalMultipart {
    private static final class Upload {
        final String key;
        final Map<Integer, byte[]> parts = new TreeMap<>();
        boolean done;
        Upload(String key) { this.key = key; }
    }

    private final Map<String, Upload> uploads = new HashMap<>();
    private final Map<String, String> store = new HashMap<>();
    private int seq = 0;

    String createUpload(String key) {
        String id = "u" + (++seq);
        uploads.put(id, new Upload(key));
        return id;
    }

    String uploadPart(String uploadId, int partNumber, byte[] data) {
        Upload u = uploads.get(uploadId);
        if (u == null || u.done) throw new IllegalArgumentException("upload không tồn tại hoặc đã kết thúc");
        if (partNumber < 1) throw new IllegalArgumentException("partNumber phải >= 1");
        u.parts.put(partNumber, data);
        return md5Hex(data);                                  // ETag của part = MD5 hex nội dung
    }

    String complete(String uploadId, List<PartETag> parts, boolean ifNoneMatchStar) {
        Upload u = uploads.get(uploadId);
        if (u == null || u.done) throw new IllegalArgumentException("upload không tồn tại hoặc đã kết thúc");
        if (ifNoneMatchStar && store.containsKey(u.key)) {    // If-None-Match: * => chỉ tạo nếu chưa có
            throw new IllegalArgumentException("object đã tồn tại");
        }
        int n = parts.size();
        if (n < 1) throw new IllegalArgumentException("phải có ít nhất 1 part");
        boolean[] seen = new boolean[n + 1];
        byte[][] digests = new byte[n][];
        for (PartETag pe : parts) {
            if (pe.partNumber() < 1 || pe.partNumber() > n || seen[pe.partNumber()]) {
                throw new IllegalArgumentException("số phần không hợp lệ hoặc trùng");
            }
            seen[pe.partNumber()] = true;
            byte[] data = u.parts.get(pe.partNumber());
            if (data == null) throw new IllegalArgumentException("chưa upload part " + pe.partNumber());
            if (!md5Hex(data).equals(pe.etag())) {            // kiểm tra toàn vẹn từng part
                throw new IllegalArgumentException("etag part " + pe.partNumber() + " sai");
            }
            digests[pe.partNumber() - 1] = md5Raw(data);
        }
        byte[] all = new byte[n * 16];                        // nối raw digest theo thứ tự 1..N
        for (int i = 0; i < n; i++) System.arraycopy(digests[i], 0, all, i * 16, 16);
        String etag = md5Hex(all) + "-" + n;                  // ETag multipart = MD5(các MD5) + "-N"
        u.done = true;
        store.put(u.key, etag);
        return etag;
    }

    void abort(String uploadId) {
        Upload u = uploads.get(uploadId);
        if (u == null || u.done) throw new IllegalArgumentException("upload không tồn tại hoặc đã kết thúc");
        u.done = true;
    }

    private static byte[] md5Raw(byte[] data) {
        try { return MessageDigest.getInstance("MD5").digest(data); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }

    private static String md5Hex(byte[] data) {
        return HexFormat.of().formatHex(md5Raw(data));
    }
}`,
      hints: [
        'ETag part = {{HexFormat.of().formatHex(MessageDigest.getInstance("MD5").digest(data))}}. ETag object = MD5 của **nối các digest 16 byte** theo thứ tự số phần, rồi + {{"-" + N}}.',
        'Để kiểm tra dãy 1..N: dùng mảng {{boolean[] seen}} đánh dấu số phần đã gặp; gặp số ngoài {{1..n}} hoặc đã seen → ném IllegalArgumentException. ETag từng part phải khớp MD5 đã lưu.',
        'Conditional write: nếu {{ifNoneMatchStar}} và {{store.containsKey(key)}} → ném lỗi (mô phỏng 412). Đây là "create if not exists" nguyên tử.',
      ],
      explain: `### Lời giải
- {{uploadPart}} lưu bytes theo số phần và trả MD5 hex của part — đúng như S3 trả ETag cho mỗi UploadPart.
- {{complete}} kiểm tra ba lớp: (1) dãy số phần liên tục 1..N không trùng (mảng {{seen}}), (2) mỗi part đã upload và ETag khớp MD5 đã lưu, (3) nếu {{ifNoneMatchStar}} thì key phải chưa tồn tại. Sau đó tính ETag multipart = MD5 của các raw digest 16 byte nối theo thứ tự, thêm "-N".
- {{abort}} chỉ đánh dấu {{done}}; mọi thao tác sau đó trên uploadId bị từ chối, mô phỏng việc S3 không cho complete/abort hai lần.

### Vì sao ETag multipart là "MD5 của MD5"
S3 ghép object từ các part đã upload riêng; để có một mã vân tay ổn định mà không phải đọc lại toàn bộ bytes, S3 lấy MD5 của **các digest part** (mỗi digest 16 byte) nối theo thứ tự rồi thêm số part. Vì vậy ETag này **không** bằng MD5 của file gộp, và không dùng để so sánh nội dung toàn file được — muốn toàn vẹn thật thì dùng checksum SHA-256.

### Lỗi hay gặp
- Dùng {{parts.size()}} làm N nhưng parts truyền vào thiếu số giữa: mảng {{seen}} và kiểm {{partNumber > n}} sẽ bắt được (số 3 với n = 2 → lỗi).
- Quên kiểm ETag part: object ghép từ part bị hỏng vẫn "thành công".
- Conditional write đặt sau khi đã ghi: mất tác dụng; phải kiểm **trước** khi commit vào store.`,
    },
  ],
  check: [
    {
      q: 'ETag của một object upload bằng multipart 3 part có dạng nào?',
      options: ['MD5 hex 32 ký tự của toàn file', 'MD5 hex của nối các MD5 part theo thứ tự, thêm "-3"', 'Một số ngẫu nhiên S3 sinh', 'Giống hệt ETag của lần upload một phần'],
      answer: 1,
      explain: `ETag multipart = MD5-của-các-MD5-part (mỗi part 16 byte) nối theo thứ tự số phần, rồi thêm "-N". Nó **không** bằng MD5 toàn file (32 hex), không ngẫu nhiên, và khác ETag object đơn. Hậu tố "-3" cho biết ghép từ 3 part.`,
    },
    {
      q: 'Hai client cùng CompleteMultipartUpload lên cùng key với {{If-None-Match: *}}. Kết quả?',
      options: ['Cả hai thành công, bản sau ghi đè bản trước', 'Chỉ một request thành công, request kia nhận 412 Precondition Failed', 'Cả hai đều nhận 412', 'S3 trả về lỗi 500'],
      answer: 1,
      explain: `{{If-None-Match: *}} là conditional write "chỉ tạo nếu chưa tồn tại", nguyên tử: request đầu tạo object, request sau thấy key đã có nên bị từ chối 412. Không có ghi đè, không phải cả hai cùng lỗi, và không phải 500. Đây là optimistic concurrency ở tầng object store.`,
    },
    {
      q: 'Vì sao không nên dùng ETag để so sánh nội dung một object multipart mã hoá SSE-KMS?',
      options: ['Vì ETag luôn rỗng', 'Vì ETag multipart không phải MD5 toàn file, và object SSE-KMS có ETag không phải MD5', 'Vì ETag chỉ có khi bật versioning', 'Vì ETag đổi mỗi lần GET'],
      answer: 1,
      explain: `ETag multipart là MD5-của-MD5 + "-N", không bằng MD5 file gộp; object SSE-KMS còn không expose MD5 (ETag không phải MD5 nội dung). Muốn toàn vẹn thật phải dùng checksum SHA-256 hoặc tự tính MD5 ở client. ETag không rỗng, không phụ thuộc versioning, và không đổi theo GET.`,
    },
  ],
  related: ['aws-007', 'aws-013', 'aws-014'],
  tags: ['S3', 'multipart upload', 'ETag', 'conditional write', 'If-None-Match', 'checksum'],
},

);
