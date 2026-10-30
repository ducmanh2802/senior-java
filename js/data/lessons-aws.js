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
);
