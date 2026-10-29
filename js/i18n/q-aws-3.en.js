/*
 * English translation of js/data/q-aws.js — task T208; entries re-translated in T512.
 * Format: js/core/i18n.js (content overlay).
 * ids: aws-021 aws-022
 */
App.i18n.content({
  'aws-021': {
    q: 'Your bank runs everything in 2 shared AWS accounts. How would you redesign it with a multi-account model using Organizations, Control Tower and SCPs, and how do you migrate?',
    a: `**Summary:** The account is AWS's strongest isolation boundary: it separates IAM, quota, cost, and blast radius. Use **AWS Organizations** to split accounts by OU (Security, Infrastructure, Workloads prod/non-prod, Sandbox), **Control Tower** to build a standard landing zone (log archive, audit, IAM Identity Center, controls), and **SCP** as a guardrail that "nobody can bypass," including admin users in child accounts. Migrate gradually, workload by workload — never big bang.

### Quick intuition
Two shared accounts for everything are like a company where every department sits in one single room, shares one key and one electricity meter: everybody can reach everybody else's filing cabinet, and nobody knows which department consumes how much. **Multi-account** means splitting into separate rooms, each with its own lock. **Organizations** is the building floor plan that groups rooms into floors (OUs). **Control Tower** is the building management office: it builds new rooms from a standard template, with cameras (logs) already installed. **SCP** is the building rulebook: even a department head (the admin of an account) may not break the cameras or prop open the emergency exit.

### Key terms
- **Management account**: the root account that creates the organization and handles billing; SCPs do not apply to this account.
- **OU (Organizational Unit)**: a group of accounts inside an organization; a policy attached to an OU applies to every account beneath it.
- **Landing zone**: a standard multi-account environment that already has logging, security, networking and identity set up.
- **SCP (Service Control Policy)**: a policy that caps the maximum permissions of every principal in a child account.
- **RCP (Resource Control Policy)**: a newer kind of Organizations policy that caps the maximum permissions on a resource (for example S3, KMS) no matter who calls it.
- **IAM Identity Center**: a single-sign-on service into many accounts through permission sets, connected to the company IdP (identity provider — the company's central login system, for example Okta or Azure AD).
- **Account Factory / AFT**: Control Tower's mechanism for creating new accounts with a baseline already in place; AFT is the Terraform-based version.
- **CDE (Cardholder Data Environment)**: the part of the system that stores, processes or transmits card data, and therefore falls inside PCI DSS scope.

### Step by step: effective permissions when a developer calls an API in the payments-prod account
1. The developer signs in through IAM Identity Center with the company account and selects the ReadOnly permission set for payments-prod. Why: there are no IAM users with separate passwords inside each account.
2. Identity Center issues temporary credentials for the corresponding role in that account.
3. On the API call, AWS evaluates: do the SCPs of every OU from root down to the account allow this action? If an SCP blocks it, the call is denied even if the role has AdministratorAccess.
4. Next it evaluates the RCP (if any), the identity policy, the resource policy and the permission boundary; an explicit Deny anywhere wins.
5. Every call is recorded by the CloudTrail organization trail into the log-archive account, where payments-prod staff have no permission to delete it.

~~~text
Effective permission = intersection of the layers
  SCP (root -> Workloads OU -> Prod OU)   : the ceiling for the account
  ∩ identity policy / permission set      : the permissions actually granted
  ∩ resource policy, boundary, RCP        : further limits
  - any explicit Deny                     : beats everything
Example: a role has "*:*", the SCP denies cloudtrail:StopLogging -> it still CANNOT stop the trail
~~~

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

### SCP: understanding the mechanism correctly
- An SCP does **not grant permissions**; it only caps the maximum allowed. Effective permission = IAM policy allows AND the SCP does not block.
- It applies to every principal in child accounts, including the root user, but **not to the management account**, which is why you never run workloads there.
- It does not affect service-linked roles (roles AWS creates and manages on your behalf for a service, e.g. the role Autoscaling uses to launch instances).

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
- Users sign in via **IAM Identity Center** connected to the company IdP, with permissions defined by permission sets; do not create IAM users. Keep a monitored break-glass procedure (an emergency login path kept locked, whose use raises an alarm).
- Networking: Transit Gateway (a central router between VPCs and on-premises networks), or shared subnets through RAM (Resource Access Manager — the service for sharing resources across accounts); plan non-overlapping CIDR ranges from day one; centralize egress through a firewall.

### Migration plan
1. Build the new landing zone in parallel without touching workloads.
2. Enable organization-level CloudTrail, GuardDuty, Security Hub for all accounts.
3. Migrate lower-risk workload first (non-prod), then production system by system.
4. Shrink the old account gradually, finally put it in Suspended OU.

### Production pitfalls
- **Applying an SCP straight to the Prod OU without testing.** Symptom: the deploy pipeline is blocked and production breaks because of the guardrail itself. Fix: always keep a policy test OU and roll out from sandbox to non-prod, then prod.
- **SCPs growing huge.** Symptom: you hit the size limit and the limit on the number of policies attached per node (check the current docs). Fix: write concisely, group actions, and prefer Control Tower's built-in controls.
- **Accounts are easy to create and hard to close.** Symptom: dozens of ownerless accounts still cost money and remain attack surface. Fix: an account lifecycle process, an owner tag, and a Suspended OU.
- **Running workloads in the management account.** Symptom: those workloads are not subject to any SCP. Fix: use the management account only for billing and Organizations.

### One-minute spoken answer
"The account is AWS's strongest isolation boundary: it separates IAM, quotas, cost and blast radius. For a bank that currently shares two accounts, I build a landing zone with Control Tower: the management account only handles billing, the Security OU holds log-archive and security tooling, the Infrastructure OU holds networking and CI/CD, the Workloads OU splits prod and non-prod per system, and the card CDE gets its own account. Users sign in through IAM Identity Center, with no IAM users. An SCP is a ceiling, not a grant; it applies even to the root of a child account but not to the management account, so I use it to forbid stopping CloudTrail, leaving the organization, and using unapproved regions. I migrate gradually: build in parallel, enable logging and GuardDuty across the organization, move non-prod first and then prod. With leadership I talk in terms of a smaller PCI audit scope and costs that are visible per product."

> Senior tip: when presenting to leadership, do not say "AWS best practice". Talk in risk and money: a smaller PCI audit scope, a dev incident that cannot touch prod, and costs that are clearly visible per product. Those are the three reasons that get a landing-zone project approved.`,
    follow: [
      'Why does an SCP not apply to the management account, and what is the operational consequence?',
      'How do you let teams create resources freely while keeping the guardrails?',
      'Sharing a VPC through RAM versus giving each account its own VPC connected to Transit Gateway: which do you choose?'
    ],
  },
  'aws-022': {
    q: 'A card-payment system on AWS must meet PCI DSS and comply with data-residency requirements in Vietnam. Where does AWS responsibility end, and how do you encrypt, control access and audit?',
    a: `**Summary:** Under the **shared responsibility model**, AWS is responsible for security "of" the cloud (datacenters, hardware, service infrastructure) and holds PCI DSS Level 1 certification; you are responsible for security "in" the cloud: configuration, IAM, encryption, data, application, logs. Strategy: shrink card-data scope (tokenization, separate account), encrypt with KMS with separated duties, record everything via CloudTrail into an immutable log store, and confirm with legal/compliance which data must stay in Vietnam.

### Quick intuition
Shared responsibility is like renting an apartment in a building with a guard: the building owner (AWS) takes care of the foundations, walls, front door and lobby cameras; locking your own door, deciding who keeps a key and where the safe sits is your job. A building that passes safety standards does not make your apartment safe if you leave the door open. **Tokenization** is like depositing gold at a bank and only keeping the receipt: everyday transactions use the receipt (token), and exactly one place (the vault) holds the real gold (the card number), so only that place needs heavy guarding.

### Key terms
- **PCI DSS**: the mandatory security standard for any organization that stores, processes or transmits payment card data; the current version is v4.x.
- **PAN (Primary Account Number)**: the card number printed on the card, the core data that must be protected.
- **CDE**: the environment that holds card data; every system connected to it also falls inside the audit scope.
- **Tokenization**: replacing the PAN with a substitute value that cannot be reversed without the vault.
- **Customer managed key (KMS)**: a KMS key you create and control — its key policy, rotation and who may use it.
- **CloudHSM**: an HSM (Hardware Security Module — a tamper-resistant box that stores cryptographic keys) dedicated to a single customer, where you fully manage the keys and the cluster.
- **Log file integrity validation**: CloudTrail produces signed digest files that prove the logs have not been modified or deleted.
- **S3 Object Lock**: a WORM (write once, read many) mode where an object cannot be deleted or overwritten during the retention period — in compliance mode, not even by an admin.

### Step by step: a card transaction with tokenization
1. The payment page sends the PAN directly to the **token vault** (in its own CDE account) over TLS; no other service ever receives the PAN. Why: any service that touches a PAN falls inside the audit scope.
2. The vault encrypts the PAN with envelope encryption using its own KMS key, stores the ciphertext and returns a token.
3. order-service, transaction history and reports store only the token and the last four digits.
4. When data must go to the payment gateway, only the vault (or a service inside the CDE) calls KMS Decrypt to obtain the PAN and sends it over PrivateLink/TLS.
5. Every KMS call and S3 access inside the CDE is written by CloudTrail into the log-archive account that has Object Lock; EventBridge raises an alert immediately when a key policy is changed or a trail is stopped.

~~~text
Browser --PAN--> [ token vault | separate CDE account ] --token tok_8f2c...--> order-service
                        |  KMS Decrypt (vault role only)             (outside the CDE)
                        v
                 Payment gateway (TLS)
CloudTrail (every account) --> log-archive: S3 Object Lock + digest
Audit scope: 40 services -> 3 services (vault, payment gateway adapter, logging)
~~~

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
- **PAN leaking into logs, stack traces or message queues.** Symptom: the audit scope spreads to the whole logging system and the queues. Fix: masking in the logger, never log the request body on the payment path, and scan regularly with Macie.
- **A shared service with access into the CDE.** Symptom: CI/CD or monitoring automatically lands inside the audit scope. Fix: a dedicated pipeline and agents for the CDE, connected in one controlled direction.
- **A log-archive account anyone can delete from.** Symptom: the audit is worthless because you cannot prove the logs are intact. Fix: an SCP that blocks deletion, Object Lock, integrity validation, and read-only access for investigators.
- **Assuming a "PCI compliant" service is enough.** Symptom: the audit finds misconfiguration even though every service is on the compliant list. Fix: reports on AWS Artifact only prove AWS's part; your configuration must be proven by Config and Security Hub.

### One-minute spoken answer
"Under the shared responsibility model, AWS takes care of security of the cloud — datacenters, hardware, service infrastructure — and holds PCI DSS Level 1 certification; I take care of security in the cloud: IAM, network configuration, encryption, data, application and logs. My first strategy is to shrink the scope: tokenization so that only one vault in its own account touches card numbers, while every other service sees only tokens. Encrypt with KMS customer managed keys, separate key administrators from key users, and add application-level encryption for the PAN. Audit with an organization trail into the log-archive account with Object Lock and integrity validation, kept for at least 12 months. For the data-in-Vietnam requirement, I let legal settle the interpretation, then design a hybrid model and use an SCP to block unapproved regions. The biggest saving is reducing the number of systems that touch card data."

> Senior tip: the biggest audit-cost savings is not adding more security tools; it is reducing the number of systems that touch card data. Every service you remove from the CDE through tokenization is one fewer item to prove every year.`,
    follow: [
      'How does tokenization differ from encryption in terms of PCI DSS scope?',
      'How do you prove to auditors that CloudTrail logs have not been modified?',
      'Legal requires customer data to stay in Vietnam: what does your hybrid architecture look like?'
    ],
  }
});
