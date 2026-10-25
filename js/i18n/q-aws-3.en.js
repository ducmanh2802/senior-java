/*
 * English translation of js/data/q-aws.js — task T208. Format: js/core/i18n.js (content overlay).
 * ids: aws-021 aws-022
 */
App.i18n.content({
  'aws-021': {
    q: 'Your bank is running everything in 2 shared AWS accounts. How would you redesign using multi-account with Organizations, Control Tower, and SCP, and how do you migrate?',
    a: `**Summary:** The account is AWS's strongest isolation boundary: it separates IAM, quota, cost, and blast radius. Use **AWS Organizations** to split accounts by OU (Security, Infrastructure, Workloads prod/non-prod, Sandbox), **Control Tower** to build a standard landing zone (log archive, audit, IAM Identity Center, controls), and **SCP** as a guardrail that "nobody can bypass," including admin users in child accounts. Migrate gradually, workload by workload — not big bang.

### Why not a shared account
- A wrong IAM policy in the shared account lets a developer read production data.
- Quota (Lambda concurrency, API Gateway throttle) is shared: a load test in test can throttle production.
- PCI DSS audit: an account holding card data falls within audit scope; if everything shares one account, the whole system is in scope.
- Costs are hard to allocate by team or product.

### Suggested structure
~~~text
Root (management account: only billing + Organizations, no workload)
├── Security OU:   log-archive, security-tooling (GuardDuty, Security Hub admin)
├── Infrastructure OU: network (Transit Gateway, egress, DNS), shared-services (CI/CD)
├── Workloads OU
│   ├── Prod OU:     payments-prod, lending-prod, cards-prod (separate CDE)
│   └── NonProd OU:  payments-dev, payments-uat, ...
├── Sandbox OU:    experiments, budget-controlled, self-cleanup
└── Suspended OU:  accounts pending closure, SCP blocks everything
~~~
Principle: one workload per account per environment; attach policies at the OU level, not per account.

### What Control Tower does
- Builds the landing zone: log archive and audit accounts, organization-level CloudTrail, AWS Config, IAM Identity Center.
- **Controls**: preventive (implemented via SCP), detective (Config rule), proactive (check CloudFormation template before resource creation).
- **Account Factory** (or AFT with Terraform) creates new accounts with baselines: standard VPC, roles, logging, budget.

### SCP: understanding the mechanism
- SCP does **not** grant permissions; it only limits the maximum allowed. Effective permission = IAM policy allows AND SCP does not deny.
- Applies to all principals in child accounts, including root user, but **not** to the management account, so never run workloads there.
- Does not affect service-linked roles.

~~~json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "ProtectAuditTrail", "Effect": "Deny",
      "Action": ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail",
                 "organizations:LeaveOrganization", "guardduty:DeleteDetector"],
      "Resource": "*" },
    { "Sid": "DenyRootUser", "Effect": "Deny", "Action": "*", "Resource": "*",
      "Condition": { "StringLike": { "aws:PrincipalArn": "arn:aws:iam::*:root" } } }
  ]
}
~~~
Region restriction (e.g., only ap-southeast-1) should use Control Tower's built-in controls rather than custom SCPs, because you must exempt global services like IAM, CloudFront, Route 53 correctly.

### Identity and networking
- Users sign in via **IAM Identity Center** connected to the company IdP; permissions via permission sets; do not create IAM users. Have a monitored break-glass procedure.
- Networking: Transit Gateway or shared subnets via RAM; plan CIDR ranges with no overlap from the start; centralize egress through a firewall.

### Migration plan
1. Build the new landing zone in parallel without touching workloads.
2. Enable organization-level CloudTrail, GuardDuty, Security Hub for all accounts.
3. Migrate lower-risk workload first (non-prod), then production system by system.
4. Shrink the old account gradually, finally put it in Suspended OU.

### Pitfalls
- Applying SCP directly to the Prod OU without testing: it can block the deploy pipeline. Always have a test-policy OU.
- SCP has size limits and policy-node limits (check current docs); write concisely, group rules.
- Accounts are easy to create but hard to close: you need an account lifecycle process and an owner tag.

> Senior tip: when presenting to leadership, don't say "AWS best practice." Talk in risk and cost: shrinking PCI audit scope, a dev incident cannot touch production, and costs become clearly visible by product. Those are the three reasons that get a landing-zone project approved.`,
    follow: [
      'Why does SCP not apply to the management account, and what is the operational impact?',
      'How do you let a team create resources freely while keeping guardrails?',
      'Sharing VPC via RAM vs. each account has its own VPC connected via Transit Gateway: which to choose?'
    ],
  },
  'aws-022': {
    q: 'The card-payment system on AWS must meet PCI DSS and comply with Vietnam data-residency requirements. Where does AWS responsibility end, and how do you encrypt, control access, and audit?',
    a: `**Summary:** Under the **shared responsibility model**, AWS is responsible for security "of" the cloud (datacenters, hardware, service infrastructure) and holds PCI DSS Level 1 certification; you are responsible for security "in" the cloud: configuration, IAM, encryption, data, application, logs. Strategy: shrink card-data scope (tokenization, separate account), encrypt with KMS with separated duties, record everything via CloudTrail into an immutable log store, and confirm with legal/compliance which data must stay in Vietnam.

### Shared responsibility in practice
| Component | AWS | You |
|---|---|---|
| Datacenter, hardware, hypervisor | Yes | No |
| EC2 OS patching | No | Yes |
| RDS/Aurora engine patching | AWS performs | You choose maintenance window, version |
| Security group, IAM, encryption | Provides tools | Configure correctly |
| Data and application | No | Yes |

Using a "PCI compliant" service does not make your system compliant. AWS reports (AOC, SOC) from **AWS Artifact** only cover AWS's portion.

### Shrinking audit scope (CDE)
- **Tokenization**: only a vault service holds PAN; other services see only tokens. Audit scope shrinks to the vault and whatever connects to it.
- Place the vault in a dedicated account and VPC, open only via PrivateLink; other accounts stay out of scope.
- Never store sensitive authentication data (CVV, track data) after authorization.

### Encryption
- At rest: **KMS customer-managed key** for RDS, S3, EBS, one key per data type. Key policy separates duties: the key administrator cannot decrypt; the application only has Decrypt.
- Enable automatic rotation; for PAN, add application-level encryption (envelope encryption) so a DBA reading the table sees only ciphertext.
- Need a dedicated, fully controlled HSM: **CloudHSM**; trade-off is self-operating the cluster, much more expensive.
- In transit: TLS 1.2 or higher on every hop, including inside VPC (PostgreSQL: enable {{rds.force_ssl}}).

### Audit with CloudTrail
- **Organization trail** records management events for all accounts into S3 in the log-archive account, with **log file integrity validation** (digest to prove logs were not altered) and **S3 Object Lock**.
- Data events (reading/writing S3 objects with sensitive data, invoking Lambda) are not enabled by default and cost extra: only enable for buckets/functions in the CDE.
- Free event history in the console is only 90 days; PCI DSS requires audit logs kept for at least 12 months, with the most recent 3 months immediately retrievable.
- Query with Athena or CloudTrail Lake; real-time alerts via EventBridge for sensitive actions (disable trail, modify key policy, root login).

### Continuous controls
- **AWS Config** PCI DSS conformance pack, **Security Hub** PCI DSS standard, **GuardDuty** for anomalies, **Macie** to scan S3 for card/PII leaking outside scope.
- MFA for all access to CDE (PCI DSS v4 requirement).

### Data in Vietnam
- Documents to verify: Cybersecurity Law 2018 and Decree 53/2022 (data storage in Vietnam for certain businesses/data), personal data protection regulations (Decree 13/2023 and new law), SBV regulations on information-system safety. Legal/compliance must interpret; engineers should not conclude alone.
- AWS does not yet have a full region in Vietnam (only Hanoi Local Zone — check current status). Common model: original customer data on-prem in-country, AWS workload only processes tokenized/anonymized data; or cloud is only used for systems that do not contain restricted data.
- Block resource creation outside approved regions with SCP so data does not accidentally go to the wrong place.

### Production pitfalls
- PAN leaks into app logs, stack traces, message queues: audit scope spreads to the entire log system. Mask in the logger and scan regularly.
- Shared services (CI/CD, monitoring) with access to CDE: they automatically fall within scope.
- Log-archive account where anyone can delete logs: the audit loses all value.

> Senior tip: the biggest audit-cost savings is not adding more security tools; it is reducing the number of systems that touch card data. Every service you remove from the CDE through tokenization is one fewer item to prove every year.`,
    follow: [
      'How does tokenization differ from encryption regarding PCI DSS scope?',
      'How do you prove to auditors that CloudTrail logs have not been altered?',
      'Legal requires customer data to stay in Vietnam: what does your hybrid architecture look like?'
    ],
  }
});
