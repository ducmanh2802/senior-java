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
note App: app khong co IP public, ra ngoai phai qua NAT hoac endpoint
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
        return (base >>> shift) == (ipToLong(ip) >>> shift);  // dich khong dau, an toan voi bit cao
    }

    static String firstMatch(List<Rule> rules, String ip, int port) {
        return rules.stream()
                .sorted(Comparator.comparingInt(Rule::number))   // so nho hon duoc xet truoc
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
        // SG stateful: phan hoi cua ket noi da duoc cho phep luon duoc ve, khong xet rule.
        return "ALLOW".equals(firstMatch(naclOut, clientIp, clientPort)) ? "ALLOW" : "DENY_NACL_OUT";
    }
}`,
      hints: [
        'Doi IP sang so theo cach co ban nhat: {{v = v * 256 + octet}} cho 4 octet. Vi du {{10.0.1.77}} = 10*16777216 + 0*65536 + 1*256 + 77.',
        'Trong Java, ca {{int}} va {{long}} deu dung so bit dich chuyen co gioi han ({{int}} lay 5 bit thap, {{long}} lay 6 bit thap), nen {{long >> 32}} la dich 32 bit hop le. Voi {{/0}} thi {{shift = 32}} va ca 32 bit deu bi dich ra ngoai (ket qua phu thuoc cach ban xu ly day du); cach an toan: neu {{bits == 0}} tra ve {{true}}, nguoc lai dung {{(base >>> shift) == (ip >>> shift)}} voi {{long}} khong dau.',
        'SG khong co rule deny: loc {{r.allow()}} truoc khi {{anyMatch}}, dung dung la {{anyMatch(matches)}}.',
        'Thu tu cua checkRequest la SG truoc roi moi den NACL inbound; checkResponse khong nhac gi den SG.',
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
          customer#C42 | order#1730000000002     <- cung partition = doc duoc bang 1 Query
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
    private String sk;   // "order#1730000000000"   -> sort key (epoch ms: so sanh duoc bang chuoi)
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
        Map<String,String> copy = new TreeMap<>(attrs);   // ban sao, khong giu reference cua caller
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
        'Muon lay theo thu tu {{sk}} tang dan ma khong can thu cong sap xep: gom vao {{TreeMap<String, Item>}} voi key la {{sk}}, roi lay {{values()}} (bo vao {{ArrayList}} de co List).',
        'Di qua tung phan tu cua {{data.entrySet()}} va kiem tra {{k.pk().equals(pk)}} cung {{k.sk().startsWith(skPrefix)}}. Voi {{skPrefix}} rong, {{startsWith("")}} luon dung nen pham vi la ca partition.',
        'Version hien tai: item khong ton tai la 0; neu co thi {{Long.parseLong}} tu attribute {{"v"}}. So sanh **truoc khi** ghi, va khi reject thi khong duoc cham vao {{data}}.',
        'Lam tron len boi so ma khong can so thuc: {{(s + 4095) / 4096}} cho block doc 4 KB, {{(s + 1023) / 1024}} cho block ghi 1 KB; {{Math.ceil}} tren so nguyen se ra 0 mai mai.',
        'Doc eventually consistent = **mot nua** RCU: {{(units + 1) / 2}} (lam tron len de khong duoc tieu 0 cho mot batch khong rong).',
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
);
