/*
 * English translation of js/data/lessons-aws.js — task T569. Format: js/core/i18n.js (content overlay).
 * ids: lesson-aws-001
 */
App.i18n.content({
  'lesson-aws-001': {
    title: 'IAM and credentials for Java applications: principals, policies, roles and the credentials provider chain',
    goals: [
      'Tell apart principals, identity-based policies and resource-based policies; read and understand a policy JSON',
      'Evaluate a request yourself in the right order: explicit deny > allow > implicit deny',
      'Explain why apps on EC2/ECS/EKS use roles + temporary credentials (STS) instead of long-lived access keys',
      'Know where the default credentials provider chain of the AWS SDK for Java v2 looks for credentials, and in what order',
    ],
    body: `### The big picture: who is allowed to do what on which resource
Every time your Java code calls AWS (reading an S3 file, sending an SQS message...), the SDK actually sends a **signed HTTP request** (Signature Version 4) to the AWS API. AWS answers three questions:

1. **Who is calling?** (authentication): which credentials signed the request, and which **principal** those credentials belong to.
2. **Is that principal allowed to perform this action on this resource?** (authorization): AWS gathers every relevant **policy** and evaluates them.
3. If allowed, perform it; if not, return {{AccessDenied}} (HTTP 403).

**Principal** is any identity that can send a request: an IAM user (a person or machine, with long-lived credentials), an **IAM role** (an identity not tied to a fixed person — anyone who is trusted can "put on" the role and receive temporary credentials), a federated user (signed in through SSO / IAM Identity Center), an AWS service (for example {{lambda.amazonaws.com}}), and the account's root user (used only for a few administrative tasks, must have MFA enabled and then be put away).

### Policy: a JSON document describing permissions
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
- **Effect**: {{Allow}} or {{Deny}}. **Action**: API name in the form {{service:Operation}}, wildcards are allowed ({{s3:Get*}}). Action names are **case-insensitive**.
- **Resource**: ARN (Amazon Resource Name). Note: {{s3:ListBucket}} acts on the **bucket** ({{arn:aws:s3:::acme-invoices}}), while {{s3:GetObject}} acts on an **object** ({{arn:aws:s3:::acme-invoices/*}}). Mixing up these two ARNs is the most common cause of AccessDenied when people start with S3.
- **Condition** (optional): adds conditions, for example allow only when the request goes through a VPC endpoint ({{aws:SourceVpce}}) or when the object is encrypted with KMS.

| Policy type | Attached to | Has a Principal field? | Example |
|---|---|---|---|
| Identity-based | user, group, role | No (the principal is where it is attached) | the order service's role may read the invoice bucket |
| Resource-based | the resource itself | **Yes**, states exactly who is allowed | S3 bucket policy, SQS queue policy, KMS key policy, Lambda resource policy |
| Permissions boundary | user/role | No | the maximum permission ceiling that role can ever have |
| SCP (Organizations) | account / OU | No | forbid every dev account from creating resources outside the ap-southeast-1 region |

### Evaluation algorithm: deny wins over everything
Simplified for the same-account case:

~~~text
request (principal, action, resource)
        |
        v
 does any Deny statement match?  --yes-->  EXPLICIT DENY (stop, nothing can save it)
        | no
        v
 does any Allow statement match? --yes-->  ALLOW
        | no
        v
 IMPLICIT DENY (denied by default)
~~~

- Everything is **denied by default** (implicit deny). You must have an Allow before you can do anything.
- An **explicit Deny** in any policy (identity, resource, boundary, SCP) beats every Allow. This is how you build "guardrails": an SCP denying turning off CloudTrail, a bucket policy denying every request that does not use TLS.
- SCPs and permissions boundaries **do not grant permissions**, they only cap the ceiling: the effective permission is their intersection.
- **Cross-account**: a role in account A that wants to read a bucket in account B needs an Allow on **both sides**: the identity policy in A allows it, and the bucket policy in B lists that role as Principal. Within a single account you usually need only one side to Allow (the KMS key policy is an important exception: the key policy must allow it).

### Least privilege in practice
Least privilege means granting only **the right action on the right resource** that the code needs. How to do it in practice:
- Start from the list of SDK calls in the code: {{s3Client.getObject}} → {{s3:GetObject}} on a specific prefix, not {{s3:*}} on {{*}}.
- One role per service: the order service and the report service do not share a role, so that one compromised service does not drag down the whole system.
- Use **IAM Access Analyzer** to find resources shared outside the account and to suggest policies based on CloudTrail (which permissions are actually used).

### Long-lived vs temporary credentials
| | Long-lived access key (IAM user) | Temporary credentials (STS) |
|---|---|---|
| Form | Access key ID starting with {{AKIA}} + secret | Key ID starting with {{ASIA}} + secret + **session token** |
| Expiry | Never, unless you delete/rotate it yourself | Yes, usually 15 minutes to a few hours (AssumeRole defaults to 1 hour) |
| Risk if leaked | The attacker keeps using it until it is detected | Expires on its own; damage is limited in time |
| Issued by | You create it in the console and paste it into config | STS issues it when a principal "assumes" a role |

Long-lived keys are often leaked through: accidentally committing {{application.yml}} to GitHub (bots scan public repos very quickly), logging them out into environment variables, Docker images containing a {{~/.aws/credentials}} file. That is why for workloads running **on AWS** the rule is **never use access keys**: attach a role to the compute, and the SDK fetches temporary credentials itself and refreshes them before they expire.

### Roles for each kind of compute
- **EC2**: attach an **instance profile** (a wrapper around the role). The SDK gets credentials through the Instance Metadata Service; enforce **IMDSv2** (a session token must first be obtained with a PUT request) to reduce the risk of SSRF stealing credentials.
- **ECS (Fargate or EC2)**: there are two different roles. The **task role** is the permission of **your code** (reading S3, sending SQS). The **task execution role** is the permission of the **ECS agent**, used to pull images from ECR, write logs to CloudWatch, and fetch secrets to inject into environment variables. Putting application permissions on the execution role is a classic mistake: the container starts fine but code calling S3 gets AccessDenied.
- **EKS**: two ways. **IRSA** (IAM Roles for Service Accounts): the cluster has an OIDC provider, the ServiceAccount is annotated with {{eks.amazonaws.com/role-arn}}, a webhook injects the {{AWS_ROLE_ARN}} and {{AWS_WEB_IDENTITY_TOKEN_FILE}} variables; the SDK calls {{AssumeRoleWithWebIdentity}}. **EKS Pod Identity** (newer): install the Pod Identity Agent add-on, create an association between the ServiceAccount and the role through the EKS API, with no OIDC provider configuration needed; the SDK gets credentials through the container credentials endpoint. Both grant permissions **per pod**, not per node.
- **Lambda**: execution role; credentials are pre-loaded into the runtime's environment variables.

### Default credentials provider chain of the AWS SDK for Java v2
When you create a client **without** specifying credentials, SDK v2 uses {{DefaultCredentialsProvider}}, trying in order:

1. Java system properties: {{aws.accessKeyId}}, {{aws.secretAccessKey}}, {{aws.sessionToken}}.
2. Environment variables: {{AWS_ACCESS_KEY_ID}}, {{AWS_SECRET_ACCESS_KEY}}, {{AWS_SESSION_TOKEN}}.
3. Web identity token (IRSA): {{AWS_WEB_IDENTITY_TOKEN_FILE}} + {{AWS_ROLE_ARN}} (requires the {{sts}} module on the classpath).
4. Shared files {{~/.aws/credentials}} and {{~/.aws/config}} (profile, including SSO, per {{AWS_PROFILE}}).
5. Container credentials (ECS task role, EKS Pod Identity).
6. EC2 instance profile through IMDS.

~~~java
// Production: do NOT pass credentials, let the chain find the task/pod/instance role itself
S3Client s3 = S3Client.builder()
        .region(Region.AP_SOUTHEAST_1)
        .build();                         // create once, share it (thread-safe), don't create one per request

// Need permissions in another account: assume a role, the provider refreshes before expiry
StsClient sts = StsClient.builder().region(Region.AP_SOUTHEAST_1).build();
StsAssumeRoleCredentialsProvider crossAccount = StsAssumeRoleCredentialsProvider.builder()
        .stsClient(sts)
        .refreshRequest(AssumeRoleRequest.builder()
                .roleArn("arn:aws:iam::222233334444:role/report-reader")
                .roleSessionName("order-service")   // shows up in CloudTrail, helps with tracing
                .build())
        .build();
S3Client reportS3 = S3Client.builder().region(Region.AP_SOUTHEAST_1)
        .credentialsProvider(crossAccount).build();
~~~

> The order of the chain has real consequences: if someone leaves {{AWS_ACCESS_KEY_ID}} behind in the container's environment variables, the SDK uses that key **before** the task role, and you will spend hours wondering why the role's permissions have no effect.

On a dev machine, use {{aws sso login}} with a profile instead of creating personal access keys. On CI (GitHub Actions...), use OIDC federation to assume a role, again with no long-lived secrets.

### Interview notes
Common questions: "How does an IAM role differ from an IAM user?", "Where does an app on ECS get its credentials from?", "What is the difference between an explicit deny and an implicit deny?", "How do you let a service in account A read a bucket in account B?". A good answer should cover: role + STS = temporary credentials that rotate themselves; task role is different from execution role; evaluation order is deny > allow > implicit deny; cross-account requires both sides to allow it. The exercise below lets you write a policy evaluator yourself to nail down this order.

> Senior tip: When debugging AccessDenied, read the error message carefully (many services now state which policy type blocked it: SCP, boundary, resource policy), then check the real principal with {{aws sts get-caller-identity}} right inside the container. More than half the time, the cause is that the code is running under a different principal than you think.`,
    exercises: [
      {
        title: 'Write an IAM policy evaluator (explicit deny > allow > implicit deny)',
        prompt: `Simulate the core of IAM policy evaluation within one account.

A {{Statement}} consists of an {{effect}} ({{"Allow"}} or {{"Deny"}}), a list of {{actions}} patterns and a list of {{resources}} patterns. A statement **matches** a request when at least one action pattern matches the action **and** at least one resource pattern matches the resource.

Implement:
1. {{wildcardMatch(pattern, value)}}: {{*}} matches any string (including the empty one), {{?}} matches exactly 1 character, any other character must be identical (case-sensitive).
2. {{evaluate(statements, action, resource)}} returns:
  ▸ {{"EXPLICIT_DENY"}} if a matching Deny statement exists (regardless of statement order),
  ▸ otherwise {{"ALLOW"}} if a matching Allow statement exists,
  ▸ otherwise {{"IMPLICIT_DENY"}}.

Action matching is **case-insensitive** (like IAM); resource matching is case-sensitive.`,
        hints: [
          'Split it into two steps: a {{matches(statement, action, resource)}} function and an evaluation loop.',
          'When you hit a matching Allow, **do not return yet**: a Deny statement further down may match too. Only Deny may return early.',
          'For wildcards, the simplest approach: two pointers over pattern and value, remember the position of the last {{*}}; on a mismatch, backtrack and let {{*}} swallow one more character.',
        ],
        explain: `### Solution
- {{evaluate}} walks every statement. On a **matching Deny** it returns immediately, because an explicit deny cannot be overridden. On a **matching Allow** it only records {{allowed = true}} and keeps going, because a Deny may still come later. If the loop ends with nothing matching, that is an implicit deny.
- {{wildcardMatch}} uses the classic two-pointer algorithm: {{?}} and equal characters advance together; on {{*}} it remembers the position and first tries matching the empty string; on a mismatch, if a {{*}} was seen before, it backtracks and lets {{*}} swallow one more character.

### Common mistakes
- Returning {{"ALLOW"}} as soon as the first Allow is found: the "deny wins regardless of order" test will fail. This is exactly the misunderstanding many people have about IAM ("the statement on top wins"); IAM has **no** positional priority.
- Treating {{arn:aws:s3:::acme-invoices/*}} as also matching the bucket ARN: it does not, {{/*}} requires the {{/}} character. In real life this is why {{s3:ListBucket}} is denied even though "s3 was already granted".
- Using {{String.matches}} with a hand-built regex and forgetting to escape {{.}} or {{:}}: a pattern with regex metacharacters will match incorrectly.

Real IAM also has Condition, NotAction/NotResource, policy variables, SCPs, permissions boundaries, session policies, and cross-account rules; but the core "deny wins, denied by default" is exactly the same as in this exercise.`,
      },
    ],
    check: [
      {
        q: 'A service role has an identity policy that allows {{s3:*}} on {{*}}. The bucket policy of the {{audit-logs}} bucket has a Deny statement for {{s3:DeleteObject}} for all principals. The service calls DeleteObject on an object in {{audit-logs}}. What is the result?',
        options: ['Succeeds because the identity policy allows s3:*', 'Denied because the explicit deny in the bucket policy beats every Allow', 'Succeeds because identity policies take priority over resource policies', 'Depends on the statement order within the two policies'],
        answer: 1,
        explain: `An explicit Deny in **any** policy that gets evaluated beats every Allow, so the request is denied. "Succeeds because s3:*" skips the Deny check; IAM does not prioritize identity policies over resource policies; and statement order is meaningless in IAM.`,
      },
      {
        q: 'A container on ECS Fargate starts normally, but code calling {{s3Client.getObject}} gets AccessDenied. The S3 read policy has been attached to the task execution role. What is the problem?',
        options: ['Fargate does not support IAM roles', 'An access key must be added to the environment variables', 'The application code\'s permissions must live in the task role; the execution role is only for the ECS agent (pulling images, writing logs, fetching secrets)', 'IMDSv2 must be enabled on Fargate'],
        answer: 2,
        explain: `ECS separates two roles: the **task role** is the identity of the code inside the container, the **task execution role** is the identity of the ECS agent. Attaching S3 permissions to the execution role means the code does not have them. Fargate supports roles fully; adding an access key is an anti-pattern (long-lived credentials); IMDS is an EC2 mechanism, and tasks on Fargate get credentials through the container credentials endpoint.`,
      },
      {
        q: 'A container has both the environment variables {{AWS_ACCESS_KEY_ID}}/{{AWS_SECRET_ACCESS_KEY}} (left over from debugging) and a task role. What will an SDK v2 client created without explicit credentials use?',
        options: ['The task role, because roles always take priority', 'The access key in the environment variables, because environment variables come before container credentials in the default chain', 'It errors because there are two credential sources', 'Random, depending on the start-up'],
        answer: 1,
        explain: `{{DefaultCredentialsProvider}} tries in order: system properties, **environment variables**, web identity, profile files, container credentials, instance profile; the first source that has credentials is used. There is no rule that "roles always win"; the SDK does not error when multiple sources exist; the order is fixed, not random. That is why you need to remove the leftover environment variables.`,
      },
    ],
  },
});
