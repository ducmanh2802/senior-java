/*
 * English translation of js/data/q-aws.js — task T393. Format: js/core/i18n.js (content overlay).
 * ids: aws-028 aws-029 aws-030
 */
App.i18n.content({
  'aws-028': {
    q: 'Lambda Java reads SQS to send order confirmation email, batch 10 messages. If only 1 message fails, all 10 are reprocessed, customers receive duplicate emails, and the poison message keeps cycling. How do you configure event source mapping, visibility timeout, partial batch response, and DLQ?',
    a: `**Summary:** By default, if the function throws an error, the **whole batch** is considered failed and all messages return to the queue after visibility timeout. Fix it with **partial batch response**: enable {{ReportBatchItemFailures}} on event source mapping and return a list of failed {{messageId}}s — only those messages will be retried. Set **queue visibility timeout ≥ 6 times function timeout**, configure **redrive policy** ({{maxReceiveCount}}) to move poison messages to DLQ, and make the handler **idempotent** because SQS is still at-least-once.

### Quick Understanding
SQS is like a **mail-sorting conveyor belt**: Lambda grabs a stack of 10 letters, reads them, and must report "done" for each letter for it to be deleted. If it reports nothing and instead yells "error", the entire stack returns to the conveyor belt, even the 9 letters that already sent emails — that's why duplicates occur. **Partial batch response** is like returning only the faulty letter. **DLQ** is a "dead-letter bin": any letter tried more than N times is moved there for manual review, so it doesn't block the conveyor belt.

### Terminology
- **Event source mapping (ESM)**: A Lambda component that automatically **polls** SQS, gathers batches, and invokes the function; you don't write the polling code.
- **Batch size / batching window**: Maximum messages per invocation and wait time to gather more; FIFO supports up to 10 messages per batch.
- **Visibility timeout**: When a message is received, it becomes hidden from other consumers for this period; if it expires without being deleted, it reappears.
- **ReportBatchItemFailures**: A mode allowing the function to return {{batchItemFailures}} — a list of failed message IDs.
- **Redrive policy / maxReceiveCount**: Configured on the **source queue**; if a message is received more than this many times, SQS moves it to the DLQ.
- **Maximum concurrency**: Limits the number of concurrent function invocations ESM calls for a queue (minimum 2), protecting downstream systems.

### Step-by-step Mechanism
1. ESM long-polls SQS, receives 10 messages; each is hidden based on the queue's visibility timeout.
2. ESM invokes the function with an {{SQSEvent}} containing 10 records.
3. **Without partial batch**: Function throws exception → ESM deletes no messages → after visibility timeout all 10 reappear → 9 emails sent for the second time.
4. **With partial batch**: Function catches individual message errors, returns failed message IDs; ESM **deletes the 9 successful messages**, only the failed message reappears after visibility timeout.
5. Failed message is received again; each reception increases {{ApproximateReceiveCount}}. Exceeding {{maxReceiveCount}} (e.g., 5) → SQS moves it to DLQ.
6. Why visibility timeout ≥ 6 times function timeout: ESM may retry calling the function when throttled; if the message reappears while the first attempt is still processing, two functions process the same message.

~~~text
Batch: m1 m2 m3 m4 m5 m6 m7 m8 m9 m10   (m7 fails: invalid email)
No partial       : throw → all 10 return → 9 duplicate emails
With partial     : return [m7] → delete 9, m7 returns
m7 received 1..5 still fails → maxReceiveCount=5 → DLQ orders-email-dlq → alarm
~~~

### Code
~~~java
public class EmailHandler implements RequestHandler<SQSEvent, SQSBatchResponse> {
    @Override
    public SQSBatchResponse handleRequest(SQSEvent event, Context ctx) {
        List<SQSBatchResponse.BatchItemFailure> failures = new ArrayList<>();
        for (SQSEvent.SQSMessage msg : event.getRecords()) {
            try {
                OrderEvent e = parse(msg.getBody());
                if (sentLog.alreadySent(e.orderId())) continue;   // idempotent: skip if already sent
                mailer.send(e);
                sentLog.markSent(e.orderId());
            } catch (Exception ex) {
                // only report this message as failed, other messages are still deleted
                failures.add(new SQSBatchResponse.BatchItemFailure(msg.getMessageId()));
            }
        }
        return new SQSBatchResponse(failures);   // empty list = whole batch succeeded
    }
}
~~~
The above code only works when ESM has {{FunctionResponseTypes = ReportBatchItemFailures}}; without this configuration, Lambda ignores the return value.

### Recommended Configuration Table
| Parameter | Example Value | Why |
|---|---|---|
| Function timeout | 30 seconds | Sufficient for 10 SMTP/API email calls |
| Visibility timeout (queue) | 180 seconds | ≥ 6 × function timeout |
| Batch size | 10 | Balance between invocation count and latency |
| maxReceiveCount | 5 | Temporary errors may resolve, poison messages don't cycle forever |
| Maximum concurrency | 20 | Prevent overwhelming the email provider |
| DLQ retention | 14 days | Sufficient time for investigation and redrive |

### Common Mistakes
- **Throwing exception for the whole batch.** Symptom: duplicate emails, increased invocation cost. Fix: partial batch response.
- **Returning {{batchItemFailures}} but forgetting to enable ReportBatchItemFailures.** Symptom: failed message is deleted as if successful — silent data loss. Fix: verify ESM configuration in IaC.
- **Visibility timeout shorter than processing time.** Symptom: same message processed by two concurrent functions. Fix: 6x rule.
- **Setting DLQ in Lambda async config instead of queue redrive policy.** With SQS source, DLQ must be on the **source queue**; Lambda's "on-failure destination" is only for asynchronous invocations.
- **Processing continues after a failed message in FIFO.** Symptom: incorrect order. Fix: with FIFO, stop and return that message plus all subsequent messages in the batch.
- **No alarm on DLQ.** Message stays in DLQ for 14 days then deleted without anyone knowing. Fix: alarm {{ApproximateNumberOfMessagesVisible}} > 0 on DLQ.

### 1-minute interview answer
"With SQS source, Lambda uses event source mapping to poll and invoke the function in batches; by default, an exception causes the entire batch to return to the queue, causing 9 already-processed messages to be re-processed. I enable ReportBatchItemFailures and return individual failed message IDs, allowing ESM to delete the successful ones. I set the queue visibility timeout to at least 6 times the function timeout so messages don't reappear while processing. A redrive policy with maxReceiveCount of around 5 moves poison messages to the DLQ, with alarms when DLQ size > 0 and a redrive process after fixing the issue. Since SQS is at-least-once, the handler is always idempotent based on orderId, and I limit maximum concurrency to avoid overwhelming downstream services."

> Senior tip: distinguish between **transient errors** (email provider timeout) and **permanent errors** (invalid email format). For permanent errors, log and **consider it success** (or push directly to a business error queue) instead of letting it cycle 5 times and incur costs before entering the DLQ. The DLQ should only contain items that truly require human review — if the DLQ has hundreds of messages daily, it's already a dumping ground, and no one looks at it.`,
    follow: [
      'For SQS FIFO, how must partial batch response handle failures to maintain order?',
      'How does Maximum concurrency of event source mapping differ from reserved concurrency of the function?',
      'How do you safely redrive messages from DLQ back to the source queue after fixing the issue?'
    ]
  },
  'aws-029': {
    q: 'Spring Boot service runs 4 tasks on ECS with a @Scheduled job to reconcile transactions at 23:30 Vietnam time. After scaling to 4 tasks, the job runs 4 times and produces 4 reconciliation files. How do you fix it: ShedLock, splitting the job into EventBridge Scheduler calling ECS task/Lambda, or another way? Compare and choose.',
    a: `**Summary:** {{@Scheduled}} runs in **every** instance, so 4 tasks mean 4 executions. There are two directions: (1) keep the job in the service and use a **distributed lock** like **ShedLock** (lock in DB) to ensure only one instance runs; (2) **separate the job from the service**: **EventBridge Scheduler** (cron with timezone, retry, DLQ) triggers an **ECS RunTask** or **Lambda** to run the job once. If the job is short, lightweight, and tightly coupled with the service, ShedLock is sufficient; for heavy, critical jobs (financial reconciliation), separate them for manageable scheduling. Regardless of the method, the job must be **idempotent** because the scheduler could still trigger it more than once.

### Quick Understanding
{{@Scheduled}} is like every night-shift employee setting an alarm at 23:30 to "lock the warehouse door". With 4 employees, the door is locked 4 times and 4 reports are generated. **ShedLock** is like a rule "whoever locks the door puts a tag on the board; if the tag is already there, do nothing". **EventBridge Scheduler** is like a building guard with a private schedule: at exactly 23:30, the guard calls **one** person to do that task; if no one answers, they call again, and if they still can't get an answer, they log an incident.

### Terminology
- **@Scheduled**: Spring's internal scheduling; each instance has its own schedule, unaware of others.
- **ShedLock**: A library using a table (or Redis…) as a lock; {{lockAtMostFor}} is the maximum lock hold time if the instance dies mid-task, {{lockAtLeastFor}} prevents rerunning due to clock drift.
- **EventBridge Scheduler**: A serverless scheduling service: {{cron}}/{{rate}}/one-time expression, has **timezone**, retry policy, DLQ, flexible time window; targets include Lambda, ECS RunTask, SQS, Step Functions, and many other APIs.
- **ECS RunTask**: Runs an independent task (not part of a service), task finishes when the job finishes.
- **Idempotent**: Rerunning with the same parameters produces no duplicate results — e.g., locking by reconciliation date.

### Step-by-step Mechanism (separation approach)
1. Package the job as a separate entrypoint: same image, but run with profile {{reconcile}} — {{spring.main.web-application-type=none}}, run job then exit with exit code (0 success, non-zero failure).
2. Create a schedule: {{cron(30 23 * * ? *)}} with timezone {{Asia/Ho_Chi_Minh}}. Why timezone: default cron expressions are UTC; forgetting this means the job runs at 6:30 AM.
3. Target is ECS RunTask (Fargate, task definition {{reconcile-job}}, private subnet) with input containing reconciliation date.
4. Retry policy (e.g., max 3 attempts, max event age 1 hour) for **target invocation** errors (throttle, insufficient capacity). DLQ (SQS) receives events that couldn't be called.
5. Job writes to table {{reconcile_run(business_date PK, status)}} before running: if that date is already DONE, exit — this is the idempotent layer.
6. Alarm: if DONE record not seen by 01:00 → alert on-call.

~~~text
Before: task1 @Scheduled 23:30 ─┐
        task2 @Scheduled 23:30 ─┼─► 4 reconciliation files
        task3 @Scheduled 23:30 ─┤
        task4 @Scheduled 23:30 ─┘
After:  EventBridge Scheduler (cron 23:30, Asia/Ho_Chi_Minh, retry 3, DLQ)
             └─► ECS RunTask reconcile-job (1 task) ─► reconcile_run[2026-10-29]=DONE
~~~

### Code: ShedLock approach (keep in service)
~~~java
@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "PT30M")   // lock up to 30 mins if task dies
class SchedulingConfig {
    @Bean LockProvider lockProvider(DataSource ds) {
        return new JdbcTemplateLockProvider(ds);      // shedlock table in shared DB
    }
}

@Scheduled(cron = "0 30 23 * * *", zone = "Asia/Ho_Chi_Minh")
@SchedulerLock(name = "daily-reconcile", lockAtLeastFor = "PT5M")
void reconcile() {
    service.reconcile(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")));  // still idempotent by date internally
}
~~~

### Comparison
| Criterion | ShedLock in service | EventBridge Scheduler → ECS task/Lambda |
|---|---|---|
| Additional infrastructure | One DB table | Schedule, task definition/Lambda, IAM role |
| Resources when running | Eats CPU/RAM of API-serving task | Separate task, does not affect API |
| Retry, DLQ, history | Must implement manually | Built-in retry, DLQ; job writes status |
| Deploy during run time | Job may be killed mid-task during rolling update | Independent of service lifecycle |
| Long job | Must tune lockAtMostFor carefully | Lambda max 15 mins; ECS task has no such limit |
| Suitable for | Lightweight, seconds–minutes jobs | Critical, heavy jobs requiring monitoring |

### Common Mistakes
- **Cron in UTC.** Symptom: job runs 7 hours late. Fix: declare {{zone}} in {{@Scheduled}} or scheduler timezone.
- **lockAtMostFor shorter than job duration.** Symptom: lock expires before job finishes, concurrent execution by another instance. Fix: set greater than the longest measured run time, and stay idempotent.
- **Trusting scheduler's "exactly-once".** EventBridge Scheduler guarantees **at-least-once** invocation. Fix: lock by business_date in DB.
- **Running heavy job in API task.** Symptom: 23:30 p99 API spikes, health check fails, ECS kills task running job. Fix: separate task.
- **Job uses Lambda but runs > 15 mins.** Lambda killed mid-task. Fix: ECS task, or split via Step Functions.

### 1-minute interview answer
"@Scheduled runs in every instance so 4 tasks mean 4 executions. If the job is lightweight and tied to the service, I add ShedLock: a DB lock table, only the instance that acquires the lock runs, with lockAtMostFor greater than the longest run duration. For financial reconciliation jobs, I separate it entirely: EventBridge Scheduler with cron and Asia/Ho_Chi_Minh timezone, targeting ECS RunTask running the same image in non-web mode, with retry policy and DLQ, so the job doesn't consume API resources and isn't killed by rolling updates. In both approaches, the job is idempotent by business date in a status table, because the scheduler only guarantees at-least-once, and I have alarms if the DONE status isn't seen by the deadline."

> Senior tip: the most important alarm for a periodic job is not "job failed" but **"job didn't run"** — failures leave logs, non-executions are absolute silence. Have the job write a metric/record "heartbeat" upon completion and alarm on missing data (CloudWatch alarm with missing data = breaching). I once saw a reconciliation job silently die for 3 days just because the scheduler's IAM role was modified.`,
    follow: [
      'Why is lockAtLeastFor necessary when clock drift occurs between instances?',
      'If a 2-hour reconciliation job fails, how do you split or coordinate it to rerun only the failed parts?',
      'How does EventBridge Scheduler differ from EventBridge rule with schedule?'
    ]
  },
  'aws-030': {
    q: 'You lead the migration of an on-premise system (12 Spring Boot services on VMs, one 3 TB Oracle) to AWS in 9 months, with a maximum downtime cutover of 1 hour. How do you choose strategies for each part (rehost, replatform, refactor…), how do you move the database, and how do you plan for cutover and rollback?',
    a: `**Summary:** Classify each component according to the **7 R** (retire, retain, rehost, relocate, repurchase, replatform, refactor) based on business value and risk — most Spring Boot services undergo **replatform** (container to ECS/EKS, change config, no rewrite), only refactor where there's a clear reason. Use **AWS DMS** to move the database with **full load + CDC** (continuous synchronization) to cutover with only a few minutes of write stop; deciding between Oracle → RDS for Oracle (lower risk) or → Aurora PostgreSQL (save license, effort to convert schema/PLSQL) is a separate decision. Cutover follows a **rehearsed runbook**, clear go/no-go criteria, and a **rollback path** (reverse sync back to on-prem) for the first few days.

### Quick Understanding
Migrating a system to the cloud is like **moving a restaurant that is still open to a new location**. Some dishes move with the original pot (rehost), some change the stove but keep the recipe (replatform), some redo the recipe (refactor), and some are removed from the menu (retire). The ingredient warehouse (database) is the hardest part: you can't close for a week to move, so carry inventory gradually (full load), for each new shipment, deliver to both warehouses (CDC), and on opening day, close for one hour only for the final inventory check.

### Terminology
- **Rehost**: Move original VM to EC2 (e.g., using AWS Application Migration Service), no code changes.
- **Replatform**: Change platform without rewriting — VM → container on ECS, Oracle self-managed → RDS.
- **Refactor**: Rewrite/change architecture to use cloud-native services; most expensive, only do when clear benefits exist.
- **AWS DMS**: Data migration service; **full load** copies existing data, **CDC** reads source change logs (with Oracle, redo logs via LogMiner/Binary Reader) and continuously applies to destination.
- **Schema conversion**: Convert schema, views, PL/SQL to another engine (DMS Schema Conversion or AWS SCT) — always involves manual fixes.
- **Cutover**: Moment to switch actual traffic to the new system.
- **Wave**: Group of components moved together.

### Step-by-step Mechanism
1. **Assessment (months 1–2)**: Map dependencies (which service calls which service, which DB, which remaining on-prem system), measure load, measure daily data change size. Why: hidden dependencies are the number one reason cutovers fail.
2. **Landing zone**: account, VPC, connection on-prem ↔ AWS via **Direct Connect or Site-to-Site VPN** — because DMS and services remaining on-prem need a stable network for months.
3. **Choose strategy per component** (table below). Prioritize minimal changes at once: change platform **or** change DB engine, avoid changing both in one wave.
4. **Database**: create destination, convert schema, run DMS full load, enable CDC, monitor **CDC latency** and use DMS data validation to check data. Rehearse on a copy multiple times to measure time.
5. **Move services by wave**: least dependent services first; during the transition period, AWS services call on-prem DB (or vice versa) via Direct Connect — measure latency, avoid "chatty" services spanning both sites for long.
6. **Cutover database (1 hour window)**: stop writes at source → wait CDC lag to 0 → verify row count/checksum for critical tables → change connection config (internal DNS) → open writes at destination → smoke test business flows.
7. **Rollback**: prepare DMS task **reverse direction** (AWS → on-prem) enabled immediately after cutover so on-prem isn't left behind; rollback criteria (e.g., critical business error within 72 hours) agreed beforehand.

~~~text
Month 1-2        3-4            5-7                 8            9
      Assessment → Landing zone → Wave 1..3 services → DB Rehearsal → DB Cutover
                  DX/VPN         (replatform ECS)     2-3 times    1h window
DB:   Oracle on-prem ══ DMS full load ══ CDC continuously ════════╗
                                                                ╚═► target (RDS/Aurora)
                                                      after cutover: reverse CDC → on-prem (rollback)
~~~

### Choose Strategy
| Component | Strategy | Reason |
|---|---|---|
| 10 stateless Spring Boot services | Replatform → ECS Fargate | Jar already packaged, containerize fast, skip OS patching |
| Rarely used reporting service | Retire or merge | 3 users/month, not worth migration cost |
| Service calling mainframe remaining on-prem | Retain temporarily | Dependency not yet ready to move |
| Oracle 3 TB, heavy PL/SQL | RDS for Oracle first, consider PostgreSQL later | Do not change engine at the same time as changing infrastructure |
| Cron/batch on VM | Replatform → ECS task + EventBridge Scheduler | Move away from single-machine cron |

### Common Mistakes
- **Changing everything at once** (cloud + container + PostgreSQL + microservices). Symptom: don't know which layer causes errors, project delayed. Fix: one type of change per wave.
- **Not measuring bandwidth for full load.** 3 TB over 200 Mbps VPN takes over a day; CDC can't catch up if daily changes are large. Fix: calculate beforehand, consider Direct Connect or initial load via backup/Snowball then CDC from that point.
- **Ignoring LOBs and data types.** DMS has limits with large LOBs and specific custom types; discovery during cutover is too late. Fix: run trial full load early, read error/validation reports.
- **Sequences and triggers at destination.** After cutover, sequence not incremented → primary key conflict. Fix: cutover step "reset sequences", disable triggers at destination during CDC then re-enable.
- **No rollback path.** Symptom: error found after 6 hours, new data only on AWS, cannot go back. Fix: reverse CDC and time-limited rollback criteria.

### 1-minute interview answer
"I start with dependency assessment and load measurement, then classify components into 7Rs: most Spring Boot services replatform to ECS because jars are already ready, low-value components are retired, parts dependent on on-prem are retained temporarily. The infrastructure includes a landing zone and Direct Connect or VPN with sufficient bandwidth. For the database, I don't change the engine at the same time as the infrastructure: move Oracle to RDS for Oracle first, use DMS full load plus CDC for continuous synchronization, with data validation and rehearsal cutovers at least twice to measure time. The one-hour window includes stopping writes, waiting for CDC lag to reach 0, verifying checksums, changing internal DNS, and smoke testing. After cutover, I enable reverse CDC back to on-prem and maintain a 72-hour rollback criteria."

> Senior tip: what determines success is usually the **cutover runbook** not the technology: step-by-step with assigned owners, expected times from rehearsals, go/no-go points, and designated decision-makers for rollback. Rehearse thoroughly in an environment similar to production at least twice — the first time always reveals tasks taking three times as long (resetting sequences, rebuilding indexes, changing DNS in old systems no one remembers).`,
    follow: [
      'When should you convert Oracle to Aurora PostgreSQL immediately during migration, and when to leave it for later?',
      'During transition, service on AWS calls on-prem DB: latency risks and how to reduce?',
      'How do you measure and report migration progress and risks to leadership?'
    ]
  }
});
