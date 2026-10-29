/*
 * English translation of js/data/q-scenario.js — task T390. Format: js/core/i18n.js (content overlay).
 * ids: scenario-074 scenario-075 scenario-076 scenario-077 scenario-078 scenario-079 scenario-080
 */
App.i18n.content({
  'scenario-074': {
    q: 'GitHub sent a secret scanning alert: an AWS access key has been in {{application-dev.yml}} in the repository since it was committed 3 weeks ago. A dev "fixed" it by committing a deletion of that line and said "it\'s done". Why is this not yet fixed, and what are the steps you take?',
    a: `**Summary:** A deletion commit only makes the secret disappear from the **latest version**; Git stores the entire history, so anyone cloning the repository, opening old commits, viewing old pull requests, or forks can still see the key. The correct order: **revoke/rotate the key first** (within minutes), check CloudTrail to see if the key has been used, then clean the history using {{git filter-repo}} or BFG, force push, ask everyone to re-clone, and prevent recurrence using push protection + pre-commit scan + using Secrets Manager.

### Understand Quickly
Git is like a diary **that never tears out pages**: a new commit just adds a new page saying "that line is deleted", but the old page remains intact. And the diary has been photocopied for everyone who cloned the repository.

### Why rotate the key before cleaning the history
- Public repo: Bots scanning GitHub continuously find AWS keys; exposed keys are usually tested within minutes. 3 weeks is more than enough.
- Cleaning history does not delete what is already in clones, forks, CI caches, or copies in logs.
- Therefore: **assume the key is exposed**. Cleaning history is just hygiene, not the primary mitigation.

### Steps
1. **Revoke**: In IAM, create a new key for the application (if a long-term key is truly needed), update its usage, then **deactivate** and later delete the old key.
2. **Investigate**: Use CloudTrail Event history filtered by access key ID to see if there are any strange API calls (creating EC2s to mine crypto, reading S3, creating new IAM users to maintain access). If so, move to security incident procedure.
3. **Clean History** (when team is asked to temporarily stop pushing):
~~~bash
# Method 1: git filter-repo (recommended by Git over filter-branch)
git clone --mirror git@github.com:acme/order-service.git
cd order-service.git
# replacements.txt contains each secret, one per line: AKIAXXXXXXXX==>***REMOVED***
git filter-repo --replace-text ../replacements.txt
git push --force --mirror origin

# Method 2: BFG Repo-Cleaner (Java, fast with large repos)
java -jar bfg.jar --replace-text ../replacements.txt order-service.git
cd order-service.git && git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
~~~
- BFG by default **does not modify the latest commit** (HEAD is protected): you must delete the secret in the latest commit first, which the "deletion" commit already did.
- Note: filter-repo/BFG **changes the hash of every commit** from the point where the secret was introduced; open PRs and other people's branches will diverge.
4. **After force push**: Everyone must re-clone (do not pull/merge from the old version, otherwise the secret will come back). On GitHub, old commits might still be accessible via pull request refs or cache; according to GitHub documentation, contact GitHub Support to purge them.
5. **Close alert** in secret scanning with reason "revoked".

### Prevent Recurrence
| Layer | Tool | Block Where |
|---|---|---|
| Dev machine | pre-commit hook (gitleaks, git-secrets) | before commit |
| GitHub | secret scanning + **push protection** | reject push containing detectable secrets |
| CI | scan for secrets in pipeline | before merge |
| Architecture | Secrets Manager, IAM role/IRSA instead of access key | no secret to expose |

In Spring Boot, config files should only reference environment variables, for example, a placeholder pointing to environment variable {{DB_PASSWORD}}, while the value is provided by Secrets Manager / Kubernetes Secret at runtime.

### Common Pitfalls
1. Cleaning history before rotating the key (or forgetting to rotate).
2. Just {{git rm}} the file and commit.
3. Force pushing but a colleague pushes an old branch back, bringing the secret back.
4. Replacing the key with a new key but leaving it in the YAML file.

### 1-minute elevator pitch
"A deletion commit only fixes the latest version; history, clones, forks, and old PRs still contain the key, and GitHub scanning bots find keys within minutes. So the first thing I do is deactivate the key in IAM, replace it, then check CloudTrail to see if the key has been used. After that, I clean the history using git filter-repo or BFG on a mirror clone, force push, ask everyone to re-clone, and ask GitHub Support to purge cache if needed. Finally, I enable push protection, pre-commit scan, and switch entirely to Secrets Manager or IAM roles so that no long-term access keys are exposed."

> Senior tip: The real goal is **to have no long-term secrets to expose**: applications on AWS should use IAM roles (EC2 instance profile, IRSA/EKS Pod Identity, ECS task role), and CI should use OIDC federation instead of access keys stored in pipeline secrets. Then a careless commit only exposes configuration, not permissions.`,
    follow: [
      'If the repo is private, does the process differ, and can the key rotation step be skipped?',
      'What kind of secrets can and cannot GitHub\'s push protection block?',
      'How does CI using OIDC to access AWS instead of access keys work?'
    ]
  },
  'scenario-075': {
    q: 'At 5 PM on a Friday, a CVSS 10 CVE is announced for a popular Java library (like Log4Shell), and a public exploit code is already available. Your company has 35 services, and no one is sure which ones use that library. How do you coordinate the next 72 hours?',
    a: `**Summary:** Execute 4 parallel phases with responsible leads: (1) **Inventory** in 2–4 hours: which services have the library, what version, including transitive dependencies and the image actually running; (2) **Temporary mitigation** for Internet-facing ones (WAF rules, configuration flags, removing vulnerable classes) while waiting for the patch; (3) **Patch** in order of risk: public-facing first, internal later, rebuild images and verify in artifacts; (4) **Check for exploitation** in logs. Then the retrospective: SBOM, automated dependency scanning, and emergency patching SLA.

### Understand Quickly
It's like notifying a recall for a faulty brake: first, you must know **which cars** have that brake installed (including parts bought from third parties), then prohibit those cars from mountain roads (mitigation), replace brakes on passenger vehicles first, and check which ones have already encountered incidents.

### Phase 1: Inventory (hours 0–4)
Do not rely on team memory. Transitive dependencies are where things get missed.
~~~bash
# Maven: find library at all transitive levels
mvn dependency:tree -Dincludes=org.apache.logging.log4j
# Gradle
./gradlew dependencyInsight --dependency log4j-core --configuration runtimeClasspath
# Check actual RUNNING artifact (code on main might differ from deployed image)
unzip -l app.jar | grep log4j-core
trivy image registry.acme.vn/order-service:1.42.0
~~~
Record results in a shared table: service, version, Internet-exposed?, owner, status. This is the "source of truth" for all updates.

For Log4Shell: Spring Boot defaults to **Logback**; {{log4j-api}} and {{log4j-to-slf4j}} are present in logging starters but don't contain the vulnerability, only {{log4j-core}} is affected (when using {{spring-boot-starter-log4j2}} or pulled in by other libraries like old Elasticsearch). Understanding this correctly prevents panic-patching the wrong thing.

### Phase 2: Temporary Mitigation
- WAF rules to block known exploit patterns (just a thin layer, variants will bypass it).
- Configuration flags or removing vulnerable classes as recommended by the maintainer (for Log4Shell: remove {{JndiLookup.class}} from jar; {{formatMsgNoLookups}} flag was later proven insufficient).
- Block egress: services that don't need Internet access shouldn't be allowed to; many exploits require downloading payloads from outside.

### Phase 3: Patch
- Spring Boot manages versions via BOM: override by property (e.g., {{log4j2.version}} in Maven with {{spring-boot-starter-parent}}) then re-verify with {{dependency:tree}}, as a library can shade (pre-package) a vulnerable library inside its own jar.
- Order: public-facing, those handling user input, those with sensitive data, then internal.
- Track subsequent patches: Log4Shell required 4 upgrades (2.15.0, 2.16.0, 2.17.0, 2.17.1) due to related CVEs. Don't declare "done" while the maintainer is still analyzing.

### Phase 4: Has it been exploited?
- Search for exploit strings in access logs and WAF logs from **before** the announcement day (vulnerabilities can be exploited before disclosure).
- Unusual outbound connections (VPC Flow Logs, strange DNS queries).
- If signs are found, switch to security incident procedure: isolate, rotate secrets accessed by that service.

### Human Coordination
| Role | Work |
|---|---|
| Coordinator | keep status table, update every 2–4 hours for management/security |
| Inventory | 1–2 people run scripts on the whole repo + registry |
| Service Owner | patch, deploy, confirm in table |
| Security | monitor new recommendations, analyze exploit logs |
Divide shifts: no one works 30 hours straight; a tired person deploying incorrectly is worse than a few hours of delay.

### Common Pitfalls
1. Only checking code on the main branch, ignoring running images and services "no one has touched in 2 years".
2. Missing transitive dependencies and shaded jars.
3. Believing WAF rules are enough and stopping patching.
4. Not tracking progress, on Monday no one knows which services are done.

### 1-minute elevator pitch
"I divide this into 4 phases with responsible leads. First, inventory in a few hours using dependency trees and scanning running images, because transitive dependencies are easily missed, and record in a shared table. Simultaneously, apply temporary mitigation for Internet-facing services using WAF rules or configuration, and block egress. Then patch in order of risk, overriding versions in the Spring Boot BOM and verifying in artifacts. Finally, check logs for exploitation signs, including before the announcement day. Post-incident, I add SBOM and automated dependency scanning to CI so the next inventory takes minutes instead of hours."

> Senior tip: The time taken to answer "are we affected?" is a measure of maturity. When every build generates an **SBOM** (e.g., CycloneDX) and stores it with the image, inventory is just a query. I also set patching SLAs based on severity (e.g., critical, public-facing: 48 hours) and have a pre-made "rebuild all services" pipeline to upgrade a library for 35 services in an afternoon.`,
    follow: [
      'What is an SBOM and how does it help with new CVEs?',
      'How to detect a shaded (pre-packaged) library inside another jar?',
      'Which service do you prioritize patching when you don\'t have enough people to do all at once?'
    ]
  },
  'scenario-076': {
    q: 'AWS bill this month is 36,000 USD, 3 times higher than last month, while traffic only increased by 15%. The CFO asks for the reason in 2 days. How do you find and handle it?',
    a: `**Summary:** Do not guess; go top-down using **Cost Explorer**: group by service, then by **usage type**, by account/tag, by day to see **the day it started increasing**, then compare with the deployment history. Common "culprits" when cost increases but traffic doesn't: **NAT Gateway data processing**, **CloudWatch Logs ingestion**, **data transfer between AZs/to Internet**, forgotten resources (EBS, snapshots, test environments), and autoscaling failing to scale down. Once fixed, put on blockers: Budgets, Cost Anomaly Detection, mandatory tags, and cost owners.

### Understand Quickly
If the electricity bill triples, you don't check every light bulb; you check the meter at each floor, then each room, then which day it started increasing and who installed what that day.

### Step 1: Khoanh vùng within 1 hour
1. Cost Explorer, granularity **Daily**, group by **Service**: see the steep increase starting on day 8.
2. Filter the service with the highest increase, group by **Usage type**. Example: EC2-Other increased sharply, usage type is {{NatGateway-Bytes}}; CloudWatch increased, usage type is {{DataProcessing-Bytes}} (log ingestion).
3. Group by **tag** (team, service) or linked account to know who owns it.
4. Compare day 8 with deployment history: what did that release add?

### Example of a real case (rounded numbers, reference us-east-1 pricing)
| Category | Last Month | This Month | Cause |
|---|---|---|---|
| NAT Gateway data processing | 600 | 9,000 | New image service downloads original images from S3 via NAT: ~200 TB × 0.045 USD/GB |
| CloudWatch Logs ingestion | 900 | 7,500 | Day 8 release set DEBUG logging, ~15 TB × 0.50 USD/GB |
| Data transfer between AZs | 700 | 3,500 | Consumer calls cross-AZ for every message |
| EBS + orphaned snapshots | 300 | 1,800 | Test job creates volumes without deleting |

Lesson: **"Secondary" services (NAT, log, transfer) are silent cost killers**, because they are charged by GB and no one looks at them.

### Step 2: Fix
- **S3 via Gateway VPC Endpoint**: Traffic to S3 (and DynamoDB) within the same region goes through the gateway endpoint, not NAT, and gateway endpoints are free.
- Logs: Revert to INFO, sample successful request logs, set **retention** for log groups (default is infinite), move rarely used logs to cheaper storage classes.
- Data transfer: Prioritize calling within the same AZ (topology-aware routing on Kubernetes, Kafka consumer {{client.rack}} to read from replicas in the same AZ), compress payloads.
- Cleanup: Unattached volumes, expired snapshots, preview environments no one uses; schedule dev environments to shut down outside working hours.

### Step 3: Prevent recurrence
- **AWS Budgets** alerts based on actual and forecasted thresholds; **Cost Anomaly Detection** alerts when a service increases abnormally (this should have been alerted from day 9, not the end of the month).
- Mandatory tags (team, service, env) enforced by policy; report costs by team weekly.
- For deep analysis: export cost data (Cost and Usage Report / Data Exports) to S3 and query with Athena.
- Review costs in design reviews: "how many GB does this feature transfer through NAT/AZ each day?".

### Common Pitfalls
1. Jumping straight to buying Savings Plans/Reserved Instances: giving a discount on wasted resources, committing to 1–3 years.
2. Only looking at EC2/RDS, ignoring EC2-Other (NAT, EBS, transfer) and CloudWatch.
3. Disabling logs/metrics en masse to save cost, then being blind during incidents.

### 1-minute elevator pitch
"I don't guess, I use Cost Explorer daily, grouped by service then by usage type, to see exactly which category increased and on which day, then compare with deployment history. When costs increase without traffic, culprits are usually NAT Gateway, CloudWatch Logs, inter-AZ data transfer, or forgotten resources. For example, if S3 downloads go through NAT, I switch to gateway endpoints for free; for debug logs, I revert to INFO and set retention. Then I enable Budgets, Cost Anomaly Detection, and tagging by team so that next time we detect it in a day, not at the end of the month."

> Senior tip: Report to the CFO with three columns: **cause, amount, fixed yet**, with a forecast for next month. Leadership accepts mistakes, not "don't know". And I make cost a team metric like latency: when each team sees their weekly bill, most waste disappears on its own.`,
    follow: [
      'Why is NAT Gateway often a source of unexpected cost on AWS?',
      'When should you buy Savings Plans, and why not buy immediately when seeing a high bill?',
      'How do you design tagging and cost allocation for 10 teams sharing one EKS cluster?'
    ]
  },
  'scenario-077': {
    q: 'The order service CI pipeline turns red about 1/4 of the time, and "Re-run" usually makes it green. The team is used to clicking re-run, and last week a real bug was merged because everyone thought "it\'s flaky again". How do you find and fix flaky tests at the code level?',
    a: `**Summary:** A flaky test is a test that gives different results when the **code hasn't changed**. Causes almost always belong to a few groups: **shared state/run order dependencies**, **real-time dependencies**, **asynchronous code using sleep**, **non-deterministic ordering** (HashMap, queries without ORDER BY), **shared resources** (ports, DB, files). Process: gather data on which tests are flaky, reproduce by running repeatedly and shuffling order, fix according to the root cause, and while waiting for the fix, **quarantine** it with a clear owner and deadline instead of just clicking re-run.

### Understand Quickly
A scale that says different weights for the same object makes people stop trusting it, even when it reports correctly. Flaky tests destroy the very thing they were created to provide: **trust**.

### Step 1: Know which tests are flaky
- Enable Surefire\'s rerun recording: {{mvn test -Dsurefire.rerunFailingTestsCount=2}}; tests that fail then pass on rerun will be reported as "flaky" in the report instead of silently.
- Save test results across multiple builds (JUnit XML report) to rank the tests that fail most often.

### Step 2: Reproduce
~~~bash
# Run a test 50 times, count failures
for i in $(seq 1 50); do mvn -q test -Dtest=OrderServiceTest || echo "FAIL $i"; done
# Shuffle test class order to expose order dependencies
mvn test -Dsurefire.runOrder=random
~~~
In JUnit 5, you can temporarily change {{@Test}} to {{@RepeatedTest(200)}} to see the failure rate, and use {{@TestMethodOrder(MethodOrderer.Random.class)}}.

### Step 3: Fix by root cause group
| Group | Sign | How to Fix |
|---|---|---|
| Shared state | pass when run alone, fail when run in a suite | clean DB after each test, avoid static variables, do not depend on other tests |
| Real time | fail near midnight, end of month, or different CI timezone | inject {{Clock}}, use {{Clock.fixed}} in tests |
| Async + sleep | fail when CI machine is slow | wait based on conditions with timeout (Awaitility) |
| Non-deterministic order | comparing lists from HashMap/queries | compare ignoring order or add ORDER BY |
| Shared resources | port occupied, Testcontainers slow | random ports, unique data per test |

~~~java
// Wrong: depends on real time and fixed sleep
order.place();
Thread.sleep(500);                                   // CI machine slower than 500ms -> fail
assertEquals(LocalDate.now(), order.getDate());      // 23:59:59.9 -> 00:00 -> fail

// Correct: fixed time, wait based on condition
Clock clock = Clock.fixed(Instant.parse("2026-01-15T10:00:00Z"), ZoneOffset.UTC);
OrderService service = new OrderService(repo, clock);    // service receives Clock via constructor
service.place(order);
await().atMost(Duration.ofSeconds(5))                    // Awaitility: max 5s, proceed early if done
       .untilAsserted(() -> assertEquals(PLACED, repo.status(order.id())));
~~~

### Step 4: Disciplined Quarantine
- Tag with {{@Tag("quarantine")}}, remove from pipeline blocking merge but still run in a separate job for monitoring.
- Each quarantined test must have a ticket, **an owner and a deadline** (e.g., 2 weeks), otherwise the quarantine list becomes a garbage dump.
- Track metrics: percentage of red builds due to flaky tests, number of quarantined tests.

### Common Pitfalls
1. Increasing sleep from 500ms to 2s: slower and still flaky on slower CI machines.
2. Enabling auto-retry for all tests permanently: hiding real race conditions in production code.
3. Deleting "flaky" tests: sometimes flaky tests are catching real concurrency bugs.

### 1-minute elevator pitch
"A flaky test gives different results when code hasn't changed, destroying trust in CI, and last week a real bug was merged because of this. I enable Surefire's rerun to mark flaky tests in reports, then reproduce by running repeatedly and shuffling order. Causes are usually shared state, real-time dependencies, fixed sleep with async code, non-deterministic order, or shared resources. I fix by injecting Clock, using Awaitility, and cleaning data per test. While waiting for a fix, tests are quarantined with a ticket, owner, and deadline, not just re-run infinitely."

> Senior tip: A significant portion of "flaky tests" are actually **real bugs** in production code (race conditions, timezone dependencies). Before "fixing the test", I always ask: can a user encounter this exact situation? If yes, fix the code, not the test.`,
    follow: [
      'Why is injecting Clock better than using static mocks for LocalDate.now()?',
      'What are the harms of automatically retrying failed tests on CI if left long-term?',
      'How to isolate data between integration tests using a shared Testcontainers database?'
    ]
  },
  'scenario-078': {
    q: 'The on-call team receives about 300 alerts per week, more than 90% require no action, and many people turn off notifications at night. Last week, the payment API failed for 40 minutes without anyone reacting because the real alert was buried under the junk. How do you handle alert fatigue?',
    a: `**Summary:** Alerts that wake people up (pages) should only be for issues **where the user is affected and a human needs to take immediate action**. I audit all alerts based on data (which alert, how many times, was there action), delete or downgrade alerts with no action, switch to **symptom-based alerting based on SLO** (burn rate) instead of cause-based (CPU, GC), group and inhibit in Alertmanager, and require a runbook for every page. Measured goal: a few pages per shift, almost all actionable.

### Understand Quickly
A fire alarm that goes off whenever someone cooks means the whole building learns to ignore it, and when there's a real fire, nobody runs. The problem isn't the on-call person being lazy, it's the **system teaching them to ignore it**.

### Step 1: Audit with data
Export 4 weeks of alert history, each alert recording: count, number of actions, time to auto-resolve.
| Alert | Per week | Action Taken? | Decision |
|---|---|---|---|
| CPU > 80% | 85 | 0 | delete (high CPU with good latency is efficient, not an incident) |
| Disk > 70% | 40 | 2 | convert to ticket, switch to "full in 4 hours" based on growth rate |
| Pod restart | 60 | 3 | group by service, only page if SLO affected |
| Error rate payment > 5% | 2 | 2 | keep, this is a real alert |

### Step 2: Symptom-based and SLO alerting
For example SLO: 99.9% payment success in 30 days, 0.1% error budget. **Burn rate** is the speed of budget consumption: burn rate 1 means budget is exhausted in exactly 30 days; burn rate 14.4 means 2% of the month's budget was consumed in 1 hour.
According to Google's SRE Workbook, use **multiple windows**:
- Page: burn rate > 14.4 in 1 hour **and** in 5 minutes (short window helps alerts self-resolve when the issue is gone).
- Page: burn rate > 6 in 6 hours and 30 minutes.
- Ticket: burn rate > 1 in 3 days.

~~~yaml
- alert: PaymentErrorBudgetFastBurn
  expr: |
    (sum(rate(http_server_requests_seconds_count{service="payment",status=~"5.."}[1h]))
      / sum(rate(http_server_requests_seconds_count{service="payment"}[1h]))) > (14.4 * 0.001)
    and
    (sum(rate(http_server_requests_seconds_count{service="payment",status=~"5.."}[5m]))
      / sum(rate(http_server_requests_seconds_count{service="payment"}[5m]))) > (14.4 * 0.001)
  labels:
    severity: page
  annotations:
    runbook_url: https://wiki.acme.vn/runbooks/payment-errors
~~~
The 40-minute outage last week: 30% error means burn rate was 300; this alert triggers in a few minutes.

### Step 3: Reduce technical noise
- Alertmanager: {{group_by}} by service/alertname so 50 pod restarts become **one** notification; sensible {{repeat_interval}}; {{inhibit_rules}} so if "entire cluster loses DB connection" triggers, it suppresses 30 child alerts.
- Every page severity alert must have a runbook: what to check, what commands to run, when to escalate.

### Step 4: Process
- Review alerts weekly during on-call handover: any alert that triggered without action is fixed or deleted that week.
- Measure: pages per shift, percentage of pages with actions, time from page to acknowledge.

### Common Pitfalls
1. Alerting on causes (CPU, heap, GC) instead of user-facing symptoms.
2. Static thresholds without time windows: hitting the threshold once triggers it.
3. Sending all alerts to the same Slack channel, including informational notifications.
4. Afraid to delete alerts: "what if I need it?". An alert no one acts on is more harmful than none.

### 1-minute elevator pitch
"Junk alerts teach on-call engineers to ignore them, so real alerts get missed. I audit 4 weeks of history: any alert that fires without action is deleted or downgraded to a ticket. Page only for user-affecting symptoms, measured by SLO and burn rate with multiple windows, e.g., burn rate 14.4 for both 1 hour and 5 minutes. I group and inhibit in Alertmanager, require runbooks for pages, and review alerts every handover. The goal is a few pages per shift and almost every page needing action."

> Senior tip: The metric I track is **percentage of actionable pages**. Below 50% means the alerting system is broken. And when convincing the team to delete alerts, I change the question from "what if we need it?" to "when was the last time this alert helped us detect an incident?". Usually, no one remembers.`,
    follow: [
      'Why do burn rate alerts need both long and short windows?',
      'Do cause-based alerts like CPU, heap still have a place, and where to put them?',
      'How do you design on-call schedules and handovers for a 6-person team?'
    ]
  },
  'scenario-079': {
    q: 'At 2 AM on a Friday, the report service running on a VM reports {{java.io.IOException: No space left on device}}, temp file write fails, and the app stops accepting requests. On-call engineer {{rm}}ed a 40 GB log file, but {{df -h}} still reports 100%. How do you handle it, and how to prevent it from happening again (both on VM and Kubernetes)?',
    a: `**Summary:** Deleting an **open process file** does not release space: Linux only removes the file name, the data remains until the process closes the file. Find it using {{lsof +L1}}, release it by truncating via {{/proc/<pid>/fd}} or restarting the process. Root cause is typically logs without total size limits (Spring Boot default {{total-size-cap}} = 0, meaning no limit) combined with an exception loop. Prevention: rolling policy with {{max-file-size}}, {{max-history}}, {{total-size-cap}}; on Kubernetes, log to stdout and set {{ephemeral-storage}} limits; alert on **filling speed**, not just percentage.

### Understand Quickly
A file on Linux is like a library book with a **catalog card**. {{rm}} only tears the card. If someone is still reading the book (process has the file open), the book stays on the shelf, takes up space, until they return it.

### Urgent handling step-by-step
~~~bash
df -h                                   # which partition is full
df -i                                   # running out of inodes also reports "No space left" even if GB remain
du -xsh /var/log/* | sort -h | tail     # which directory is large (-x: don't cross partitions)
lsof +L1                                # files deleted but still open (link count 0)
# Example: java 4121 ... /var/log/report/app.log (deleted) 42949672960
: > /proc/4121/fd/7                     # truncate to 0 via file descriptor, no restart needed
~~~
- If file is not deleted: use {{truncate -s 0 app.log}} or {{: > app.log}} instead of {{rm}}.
- After freeing space, check if the app auto-recovers; many apps need a restart as they are in an error state.

### Finding the root cause: why 40 GB?
1. Open the end of the log file: usually there is **one exception repeating** thousands of times per second (e.g., DB connection retry without backoff, 80-line stack trace each time).
2. Rolling configuration: none, or rolling by day without limiting size.
3. System logrotate uses {{create}} (renames file then creates new) while the app still writes to the old renamed file; in this case, use {{copytruncate}} or let Logback handle rotation.

### Fixing Spring Boot 3 configuration (Logback)
~~~yaml
logging:
  file:
    name: /var/log/report/app.log
  logback:
    rollingpolicy:
      max-file-size: 100MB        # max 100MB per file then rotate
      max-history: 7              # keep 7 days
      total-size-cap: 2GB         # default 0 = NO limit, this is commonly missed
~~~
And fix the loop: retry with backoff, log the full error once, then count subsequent errors (or log every N times).

### How Kubernetes differs
| Aspect | VM | Kubernetes |
|---|---|---|
| Logging destination | file on disk | **stdout/stderr**, agent (Fluent Bit...) collects |
| Rotation | Logback / logrotate | kubelet rotates container logs ({{containerLogMaxSize}}, {{containerLogMaxFiles}}) |
| When full | app I/O error | node **DiskPressure**, kubelet evicts pod |
| Blocking | total-size-cap | {{resources.limits.ephemeral-storage}}: pod exceeding will be evicted instead of filling the node |
App writing log files to container filesystem or {{emptyDir}} without limits can fill the node disk and affect **all other pods** on that node.

### Prevention
- Alert based on **forecast**: "partition will be full in 4 hours" (e.g., {{predict_linear}} on node exporter filesystem metrics), not just "above 80%".
- Keep logs and data (temp files, uploads) on different partitions so logs filling up don't kill main features.
- Rate limit repeating logs; avoid full stack traces for known errors repeating constantly.

### Common Pitfalls
1. {{rm}}ing an open file then thinking it's done.
2. Only setting {{max-history}} without {{total-size-cap}}: 7 days × 40 GB is still full.
3. Forgetting to check inodes ({{df -i}}): millions of small files (temp files, sessions) run out of inodes while GBs remain.

### 1-minute elevator pitch
"Deleting a file an open process is using only removes the name, the data remains until the process closes it, so df still reports 100%. I use lsof +L1 to find deleted files still open and truncate them via /proc/pid/fd, or restart the process. Then I look for why logs reached 40 GB: usually an exception loop without backoff, combined with a rolling policy missing total-size-cap, which Spring Boot defaults to unlimited. I set max-file-size, max-history, total-size-cap, fix the loop, and alert on filling speed. On Kubernetes, log to stdout and set ephemeral-storage limits so one pod doesn't fill the node."

> Senior tip: In all service templates, I pre-configure {{total-size-cap}} and {{ephemeral-storage}} limits, because disk-full incidents almost always come at night, triggered by another error. Disk-full is rarely the root cause; it's a **second symptom** hiding the real error, so after cleaning space, read the log part just before it filled.`,
    follow: [
      'Why might logrotate with the create option not release space for Java apps?',
      'How does kubelet handle node DiskPressure, and which pod is evicted first?',
      'How to limit repeating logs in Logback without losing error information?'
    ]
  },
  'scenario-080': {
    q: 'At 8 PM on a Friday, the payment success rate drops from 99% to 60%. In 15 minutes, 9 engineers jump into the same chat channel, each debugging in a different direction, someone restarted the DB replica without telling anyone, CSKH doesn\'t know how to answer customers, and the CEO messages you privately. How do you take on the role of incident commander (IC)?',
    a: `**Summary:** The first task of an incident commander (IC) **is not to debug** but to establish order: declare the incident severity, assume the IC role, assign clear roles (tech lead, communications, scribe), a single channel, **every production change must be announced in the channel beforehand**. Prioritize **reducing impact first, finding the root cause later** (rollback, disable feature flag, failover). Update status at a fixed rhythm (e.g., 30 minutes) using a template, and formally close the incident with clear criteria.

### Understand Quickly
An incident with 9 people grabbing the nozzle each in a different direction is worse than 3 people working under one commander. The IC is like an incident commander at a fire: not dapping the fire themselves, but deciding who does what and where the information flows.

### The first 5 minutes: specific phrasing
Type in the channel (or say on the call):
"I am the IC for this incident, severity **SEV1**: payment success 60%. The only channel is #inc-0412-payment, call link X.
- **Nam** is tech lead, decides investigation direction.
- **Lan** handles communication: CSKH, status page, management. No one else talks to management.
- **Huy** records timeline: times, actions, who did it.
- **From now on, all production changes (restart, deploy, config change) must be typed in this channel and approved by Nam.**
- Anyone without a role, please leave the call, be ready. I will call you if needed."

Answer for the CEO (via Lan, or once by you): "Payment incident, about 40% of transactions failing since 19:52. Team mobilized, next update at 20:45."

### Roles and why to separate
| Role | Does | Does NOT |
|---|---|---|
| IC | decides, assigns, update rhythm | debugs deeply |
| Tech lead | leads investigation, proposes/approves actions | talks to management |
| Comms | CSKH, status page, stakeholders | modifies system |
| Scribe | accurate timeline | discusses |
An IC who debugs loses the big picture: no one notices that 2 people are making conflicting changes.

### Reduce impact first
The question the IC asks repeatedly: **"What has changed recently? Can we go back?"**
- Deploy in the last 2 hours? Rollback immediately, even if unsure it's the cause (rollback is cheap, if wrong, rollback again).
- Feature flag enabled? Disable.
- A payment partner failing? Route traffic to fallback partner.
Finding the root cause is for the postmortem; in the incident, the goal is **customers paying successfully**.

### Update rhythm: fixed template
~~~text
[20:45] SEV1 Payment - Update #2
Impact: ~40% payment transactions failing since 19:52, customers get "try again".
Done: rolled back payment-service to 3.18 at 20:31, no improvement yet.
Doing: checking connection pool to partner X (Nam, Hà).
Next decision: if not clear by 21:00, route 100% to partner Y.
Next update: 21:15.
~~~

### Decision-making framework when unsure
- **Reversible** and cheap actions (rollback, disable flag, route traffic): do immediately, no need to be certain.
- **Hard-to-reverse** actions (delete data, failover master DB, run data repair scripts): requires tech lead + IC agreement, recorded reasons.
- Set **decision timestamps**: "if not clear by 21:00, do Plan B", avoid paralysis.

### Closing incident and handover
- Closing criteria: success rate back to baseline for 30 consecutive minutes.
- Incident lasts > 3–4 hours: hand over IC to a fresh person, a tired person makes bad decisions.
- Schedule postmortem within 2–3 working days; handling pending transactions (reconciliation) is the next task, assign someone.

### Common Pitfalls
1. Most experienced person is IC and dives into debugging, no one coordinates.
2. No lock on changes: two people fixing, no one knows which change worked.
3. Silence with stakeholders because "nothing to report": silence makes leadership message every engineer, causing more noise.
4. Prioritizing root cause over fixing it for customers.

### 1-minute elevator pitch
"My first task is not debugging but establishing order. I declare SEV1, take IC role, assign tech lead, communications, scribe, use one channel, and lock changes: all production actions must be reported in the channel and approved. People without roles leave the call. I prioritize impact reduction: rollback, disable flags, switch partners, because reversible actions should be done immediately. I update stakeholders every 30 minutes using a template: impact, done, doing, next update, to keep the CEO and CSKH informed without messaging everyone. I close when stable, then schedule a postmortem."

> Senior tip: The thing that defines a well-handled incident happens **before** the incident: defined SEV levels, automatically created channels, update templates, backup personnel lists, and practice (game day). I also rotate the IC role to people who aren't necessarily the deepest technical experts, because IC requires calmness and clear communication more than knowing every system deeply.`,
    follow: [
      'When tech lead and IC disagree on rollback during an incident, who decides?',
      'How do you define SEV1, SEV2, SEV3 severity levels for a payment system?',
      'How do you prepare and practice incident response for a team when there are no incidents?'
    ]
  },
});