/*
 * English translation of js/data/q-english.js — task T797. Format: js/core/i18n.js (content overlay).
 * ids: english-129 english-130 english-131 english-132 english-133 english-134 english-135 english-136 english-137
 */
App.i18n.content({
  'english-129': {
    q: 'Describe the architecture of a service you ran on AWS. How would you explain the main components and how traffic flows through them?',
    a: `**Summary (30-second spoken answer):** I would start from the user request and trace it through the edge, the compute layer, the data stores, and the async parts. For a typical Java/Spring Boot service on AWS, that means an entry point like an **ALB** (Application Load Balancer — an application-layer load balancer that receives requests and distributes them across multiple instances), compute on **ECS/EKS/EC2** (ways to run containers/virtual machines), data in **RDS** (Relational Database Service — a relational database managed by AWS) and a cache like **ElastiCache/Redis**, plus **S3** for files and an async path with **SQS/SNS** when needed.

### Key terms (explained for beginners)
- **Region / Availability Zone (AZ)** (region / availability zone): A Region is a geographic area (for example {{ap-southeast-1}} Singapore); each Region has multiple AZs — separate data centers. Running across multiple AZs helps the service survive when one AZ has a problem.
- **VPC** (Virtual Private Cloud — isolated virtual network): your isolated "neighborhood" network on AWS; you split it into public subnets (receive traffic from the internet) and private subnets (internal only, where the app and database run).
- **Security group** (instance-level firewall): rules that allow traffic in or out by port and source (for example, only the ALB is allowed to call the app on port 8080).

### Traffic flow (step by step)
1. **DNS & edge:** Route 53 (DNS) resolves the domain; CloudFront (CDN — content delivery network, caches content close to users) can front static assets. TLS terminates at the edge or at the ALB.
2. **Load balancing:** The ALB receives HTTPS, routes by path/host, and forwards to healthy targets across AZs (health check — a periodic check that an instance is still alive).
3. **Compute:** The Spring Boot service runs as containers (ECS Fargate/EKS) or on EC2 in private subnets, scaled by CPU or request count (Auto Scaling).
4. **Data:** Relational data lives in RDS (often Multi-AZ for failover — automatically switching to a standby when the primary node fails). Hot data is cached in Redis to cut latency and DB load. Objects/files go to S3.
5. **Async & integration:** Non-urgent work goes to SQS (queue — a waiting line, processed later) or events via SNS/EventBridge, consumed by workers.
6. **Observability:** Logs/metrics/traces go to CloudWatch (or an OpenTelemetry backend) with alarms on SLOs.

~~~seq
title: Typical request path on AWS
actors: User | ALB | App | Redis | RDS
User -> ALB: HTTPS request
ALB -> App: forward to healthy instance (multi-AZ)
App -> Redis: cache lookup
Redis --> App: hit or miss
App -> RDS: read/write on miss or mutation
RDS --> App: result
App --> User: HTTPS response
~~~

### Trade-offs to mention (shows senior judgment)
| Choice | Benefit | Cost / risk |
|---|---|---|
| Multi-AZ RDS | Survives AZ failure | Higher cost, small failover pause |
| Cache (Redis) | Lower latency, less DB load | Cache invalidation, stale reads |
| Async queue (SQS) | Decouples, absorbs spikes | Eventual consistency, retries/duplicates |
| Managed services | Less ops toil | Vendor lock-in, quotas/cost to watch |

### Common pitfalls
- Putting the database in a public subnet or opening security groups too wide.
- A single-AZ setup presented as "highly available".
- No timeout/retry/circuit-breaker between App and downstreams, so one slow dependency stalls threads.

### Useful phrases
- "Traffic enters through the load balancer, which routes to healthy instances across AZs."
- "We keep stateful components like the database in private subnets."
- "We offload non-critical work to a queue to absorb traffic spikes."

### Common mistakes (Vietnamese speakers)
- Listing service names without explaining the flow — always trace one request end to end.
- Saying "AWS handles everything" — clarify the shared responsibility (AWS secures the infrastructure; you secure configuration, IAM, and data).
- Confusing "region" and "availability zone".

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through the flow in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Interviewers care less about memorizing every AWS product and more about **why** each piece exists: where TLS ends, how you achieve high availability (multi-AZ, health checks), how you protect data (private subnets, IAM least privilege — granting only the minimum permissions needed), and what happens when a component fails. Name concrete numbers if you can (p95 latency target, RPS, failover time).`,
    follow: [
        'How would this architecture change if you needed to handle ten times the traffic?',
        'Where would you terminate TLS, and how do you manage secrets like database credentials?',
        'What is the difference between running on ECS Fargate and on EKS for this kind of service?',
    ]
  },
  'english-130': {
    q: 'Tell me about a production incident you handled. Walk me through the timeline, the root cause, and the action items.',
    a: `**Summary (30-second spoken answer):** I would tell the story in four beats: impact (what users saw and how big), timeline (detect, mitigate, resolve), **root cause** (the deep reason the incident happened, not just the symptoms), and action items (work to prevent it from happening again). I keep it factual, time-based, and focused on learning rather than blaming people.

### Key terms (explained for beginners)
- **Incident** (incident): an event that degrades or interrupts the service (error spike, slowness, data loss). **Severity/SEV** is the severity level (SEV-1 usually has major impact and needs immediate handling).
- **MTTD / MTTR**: Mean Time To Detect / To Recover — the average time to detect / to recover. These numbers show operational capability.
- **Mitigation** (mitigation): an action that reduces user impact right away (rollback, turning off a feature flag, switching traffic), which can be done before finding the root cause.
- **Postmortem** (post-incident review/record): analysis of the cause and improvement actions, in a **blameless** spirit (not blaming individuals, focusing on the system/process).
- **Action item** (action item): a specific task with an owner and a deadline.

### A clear structure to speak (timeline table)
| Time (UTC+7) | What happened | Action |
|---|---|---|
| 19:05 | Alert: checkout error rate > 5% (p95 latency spiking) | On-call acknowledged, opened incident channel |
| 19:10 | Confirmed impact ~15% of payments failing | Mitigated: rolled back last release (previous image) |
| 19:18 | Error rate back to normal | Monitored 15 min, declared mitigated |
| Next day | Root cause analysis in postmortem | Action items assigned |

### Sample answer (natural B2-C1)
"Last year, around 7 p.m., we got an alert that the checkout error rate had jumped above five percent. About fifteen percent of payments were failing. I was the primary on-call. Within five minutes we confirmed a recent deploy correlated with the spike, so we mitigated first by rolling back to the previous image. Errors returned to normal by 7:18.

The root cause was a query change that removed an index hint path on a high-traffic table; under peak load it triggered full scans and exhausted the database connection pool (the DB connection pool has a limit). We had tested it on a small dataset, so we missed the scale effect.

Our action items were: add an EXPLAIN/performance check for queries touching large tables in CI, set a connection-pool saturation alert, and require a canary step for checkout changes. Each item had an owner and a due date, and we verified them in the next postmortem review."

### Common pitfalls when telling the story
- Jumping straight to the fix without stating **impact** (how many users, how long).
- Blaming a person ("the dev broke it") instead of the system gap (missing test/gate).
- No action items, or vague ones ("be more careful") — they must be concrete and verifiable.

### Useful phrases
- "We detected the issue through an alert on error rate and latency."
- "We mitigated first to reduce user impact, then investigated the root cause."
- "In the blameless postmortem we identified three concrete action items."

### Common mistakes (Vietnamese speakers)
- Using present tense for a past incident — keep past simple/past continuous: "we rolled back", "errors were increasing".
- Saying "root reason"; the standard term is "root cause".
- Overusing "very very serious" — quantify instead: "error rate rose to 8 percent for 13 minutes".

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through the timeline in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Strong candidates separate **mitigation** from **resolution** and show they protect users first. Quantify impact and timing (MTTD/MTTR), name one or two systemic fixes (tests, gates, alerts), and close the loop by saying how you verified the action items worked. That signals operational maturity, not just firefighting.`,
    follow: [
        'How do you decide whether to roll back or to roll forward during an incident?',
        'What makes a postmortem truly blameless and useful?',
        'How do you communicate incident status to non-technical stakeholders while it is ongoing?',
    ]
  },
  'english-131': {
    q: 'How would you explain blue-green and canary deployments to a non-technical stakeholder?',
    a: `**Summary (30-second spoken answer):** I would use a simple analogy and focus on risk. **Blue-green** keeps two identical environments: one live, one idle with the new version, then we switch traffic over — like opening a new, fully prepared checkout counter and redirecting the line. **Canary** releases the new version to a small slice of users first — like tasting a small sample before serving the whole table — and expands only if metrics stay healthy.

### Key terms (plain language)
- **Deploy/Release** (deployment/release): putting a new version of the software out for users to use. The risk is that the new version may have bugs.
- **Rollback** (rollback): going back to the old version when the new one has problems.
- **Traffic** (traffic): user requests going into the system.
- **Metrics** (metrics): numbers such as error rate and latency (response time). Used to decide whether the new version is safe.

### Blue-green (how it works)
1. "Blue" is the current live version serving all users.
2. "Green" is prepared with the new version and tested in parallel (no user traffic yet).
3. When confident, we switch the router/load balancer so all traffic goes to Green.
4. If something goes wrong, we switch back to Blue quickly. (Cost trade-off: you run two environments.)

~~~seq
title: Blue-green traffic switch
actors: Users | Router | Blue | Green
Users -> Router: all traffic
Router -> Blue: before switch (live)
Router -> Green: after switch (new version)
Green --> Router: healthy metrics
Router --> Blue: rollback path kept ready
~~~

### Canary (how it works)
1. Release the new version to a small percentage of traffic (for example 1%, then 5%, 25%, 100%).
2. Compare error rate/latency of canary vs the current version.
3. If healthy, gradually increase; if not, stop and roll back — only a small group was affected.

### Comparison (what a stakeholder cares about)
| Approach | User impact if bad | Speed to roll back | Extra cost/complexity |
|---|---|---|---|
| Blue-green | Low if switch back fast, but switch is all-or-nothing | Very fast (switch) | Run two full environments |
| Canary | Very low (small slice first) | Fast (route back) | Needs good metrics & routing |

### Choosing between them (simple guidance)
- Need a fast, clean cutover and can afford duplicate capacity: blue-green fits.
- Want to limit blast radius (the scope of impact) and learn from real traffic: canary fits.
- Many teams combine ideas (progressive rollout) depending on risk.

### Useful phrases
- "Blue-green is like switching everyone to a new, fully prepared system in one step, with a quick way back."
- "A canary release starts with a small group of users so we can catch problems early."
- "We decide based on live metrics such as error rate and response time, not gut feeling."

### Common mistakes (Vietnamese speakers)
- Using heavy jargon with non-technical listeners — replace "pods/instances" with "copies of the app" when appropriate.
- Saying "zero risk" — no deployment is zero risk; say "reduces risk" and explain rollback.
- Forgetting to mention the trade-off (cost of blue-green, need for metrics in canary).

> Senior tip: Tailor depth to the audience. With a non-technical stakeholder, lead with **blast radius and rollback**; with engineers, add how you route traffic (load balancer/mesh), what metrics gate promotion, and how you handle database compatibility during the overlap (both versions may run at once).`,
    follow: [
        'When would you choose canary over blue-green for a payments service, and why?',
        'How do you handle database schema changes when two versions run at the same time?',
        'What metrics would you watch to decide whether a canary is healthy?',
    ]
  },
  'english-132': {
    q: 'Walk me through the CI/CD pipeline of a project you worked on. How would you explain each stage clearly in an English interview?',
    a: `**Summary (30-second spoken answer):** I would describe the pipeline as a sequence of automated gates from code commit to production. I start with the trigger (pull request or merge), explain each stage's purpose in plain language, name the key checks (build, tests, security scan, artifact, deploy), and mention how we detect failures and roll back. I keep it concrete with tools and numbers so it sounds real, not theoretical.

### Key terms (explained for beginners, used when speaking)
- **CI** (Continuous Integration): every time code is pushed, the system automatically builds and runs tests to detect errors early. Like a "homework checker" that runs as soon as you submit.
- **CD** (Continuous Delivery/Deployment): after CI, the build is automatically packaged and moved through environments (staging then production). Delivery usually needs an approval click; Deployment is fully automatic.
- **Pipeline** (pipeline): a chain of automated steps connected in sequence; the next step runs only if the previous one succeeds.
- **Artifact** (build output file): a file ready to deploy, for example a {{.jar}} file or Docker image.
- **Environment** (environment): dev/staging/production — copies of the system with different purposes (testing vs serving real users).

### A clear speaking structure (step by step)
1. **Trigger:** "The pipeline runs on every pull request and again when we merge to the main branch."
2. **Build & unit tests:** "First we compile the Spring Boot service with Maven and run unit tests. If anything fails, the merge is blocked."
3. **Quality & security gates:** "Next we run static analysis and a dependency vulnerability scan to catch risky libraries early."
4. **Package artifact:** "We build a Docker image, tag it with the commit SHA, and push it to a container registry."
5. **Deploy to staging:** "The image is deployed to a staging environment that mirrors production, and we run smoke and integration tests."
6. **Release to production:** "For production we use a controlled rollout (often canary) with health checks; if error rate or latency breaches the threshold, the pipeline rolls back automatically."
7. **Post-deploy checks:** "We verify key metrics and synthetic checks, and the team gets notified in the chat channel."

~~~seq
title: CI/CD flow (simplified)
actors: Dev | CI | Registry | Staging | Prod
Dev -> CI: push / merge triggers pipeline
CI -> CI: build, unit tests, scans
CI -> Registry: push image (tag = commit)
CI -> Staging: deploy and run smoke tests
CI -> Prod: controlled rollout
Prod --> CI: health metrics OK or rollback
~~~

### Example (natural, concrete)
"In my last project, a Java 17 Spring Boot service, merging to main triggered GitHub Actions. The pipeline built with Maven, ran about 1,200 unit tests in four minutes, and ran a dependency scan. On success it built a Docker image tagged with the Git commit and pushed it to ECR. We deployed to staging automatically, ran API smoke tests, then promoted to production with a canary that started at 5 percent of traffic for ten minutes. We watched error rate and p95 latency; if either crossed our threshold, it rolled back to the previous image."

### Pitfalls to mention (shows maturity)
- "It works on my machine" vs CI: missing environment parity; fix with containers and pinned versions.
- Flaky tests that randomly fail — they erode trust in the pipeline; quarantine and fix them.
- No rollback path: every release needs a fast, rehearsed rollback.

### Useful phrases
- "The pipeline is triggered on every pull request and on merge to main."
- "A failed check blocks the merge, so broken code never reaches main."
- "We tag the artifact with the commit SHA for traceability."
- "If the health checks fail, we automatically roll back to the last known good version."

### Common mistakes (Vietnamese speakers)
- Mixing up "commit", "push", "merge" — be precise: you commit locally, push to remote, merge via pull request.
- Saying "deploy to product" — correct is "deploy to production" (or "to prod").
- Listing tools without purpose: always add "so that…" (e.g., "we run a vulnerability scan so that we catch risky dependencies early").

> Senior tip: Interviewers listen for **gates and safety**, not tool names. Emphasize what blocks a bad release (tests, scans, canary metrics), how you ensure traceability (image tagged by commit), and how fast you can recover (automated rollback, MTTR). Concrete numbers (test count, rollout percent, time thresholds) make your answer credible.`,
    follow: [
        'What quality gates would you add if this service handled payments?',
        'How do you handle database migrations safely in this pipeline?',
        'What would you do if the pipeline became too slow and developers started bypassing it?',
    ]
  },
  'english-133': {
    q: 'Describe a cloud architecture on AWS for a Java service you would explain in an interview. How do you make it clear and credible?',
    a: `**Summary (30-second spoken answer):** I explain the architecture by following one request from the internet to the database, naming each AWS component in plain words, and stating why it exists (availability, security, or scalability). I keep numbers realistic (traffic, latency, instances), mention multi-AZ for resilience, and highlight trade-offs like cost versus complexity.

### Key terms (explained for the first time)
- **Load Balancer** (load balancer): a component that sits in front, receives requests and distributes them across servers so no single machine is overloaded; it also detects failed machines and stops sending traffic to them.
- **Multi-AZ** (multiple availability zones): running copies in multiple separate data centers within the same Region so that if one data center fails, the service keeps running.
- **Managed service** (managed service): AWS operates the infrastructure (patching, basic backups) instead of you; you trade operational work for cost and less control.
- **Latency** (latency): the time from sending a request to receiving a response (often p95 — 95% of requests are faster than that).

### How to explain (step by step)
1. **Context first:** "The service was a Spring Boot REST API handling about 800 requests per second at peak."
2. **Entry and network:** "Requests came through Route 53 and an Application Load Balancer in public subnets across two AZs."
3. **Compute:** "The app ran as containers on ECS Fargate in private subnets, so instances were not directly reachable from the internet. Auto Scaling added tasks when CPU or request count rose."
4. **Data:** "We used RDS PostgreSQL in Multi-AZ as the source of truth, ElastiCache Redis for hot reads, and S3 for file storage."
5. **Async:** "Heavy work went to SQS so the API could respond quickly and workers processed jobs separately."
6. **Security and ops:** "Security groups allowed only required ports; credentials lived in Secrets Manager; logs and metrics went to CloudWatch with alarms."

~~~seq
title: Request flow (Java service on AWS)
actors: Client | ALB | Service | Cache | DB
Client -> ALB: HTTPS request
ALB -> Service: route to healthy task (2 AZs)
Service -> Cache: read hot data
Cache --> Service: hit or miss
Service -> DB: query on miss / write
DB --> Service: result
Service --> Client: response
~~~

| Decision | Why | Trade-off |
|---|---|---|
| Private subnets for app/DB | Smaller attack surface | Needs NAT/VPC endpoints for outbound access |
| Multi-AZ RDS | Survives AZ failure | Higher cost, brief failover |
| Redis cache | Lower p95, protects DB | Stale data risk, invalidation complexity |
| SQS for heavy tasks | Absorbs spikes, faster API | Eventual consistency, duplicate handling |

### Common pitfalls
- Claiming "high availability" but running a single AZ or a single DB instance.
- Exposing the database publicly "for convenience".
- No health checks, so the load balancer keeps sending traffic to a broken instance.

### Useful phrases
- "I will walk you through the request path from the client to the database."
- "We ran across two availability zones to tolerate a single AZ failure."
- "We traded some complexity for resilience by introducing a queue for asynchronous work."

### Common mistakes (Vietnamese speakers)
- Memorizing service names without the "because": always pair each component with its purpose.
- Mispronouncing acronyms in a confusing way — slow down: "A-L-B", "R-D-S", "multi-A-Z".
- Forgetting articles/countability in small ways is fine, but avoid unclear statements like "we use database" — say "a PostgreSQL database on RDS".

> Senior tip: Credibility comes from **specifics and failure thinking**. Say what happens when the DB primary fails (Multi-AZ failover), when traffic spikes (Auto Scaling + queue), and what you monitor. If you do not know an AWS detail, state your assumption clearly instead of guessing.`,
    follow: [
        'How would you secure secrets and database access for this service?',
        'What would you change to reduce latency for users in another region?',
        'How do you estimate and control the cost of this architecture?',
    ]
  },
  'english-134': {
    q: 'Tell me about a production incident you handled: what was the timeline, what was the root cause, and what action items came out of it?',
    a: `**Summary (30-second spoken answer):** I tell a time-ordered story: when we detected the issue, how many users were affected, what we did to mitigate quickly, how we confirmed recovery, what the root cause turned out to be, and the concrete action items with owners. I focus on impact and learning, and I use past tense consistently.

### Key terms (explained for the first time)
- **Impact** (impact): how much harm the incident caused (error rate, number of users, revenue, duration). Stating the impact clearly helps the listener judge severity.
- **Timeline** (timeline): the sequence of events in time order — detect, mitigate, recover. Like an event log.
- **Root cause** (root cause): the deep cause of the incident (for example, a misconfiguration that exhausted connections), different from the symptom (for example, the API returning 500 errors).
- **Rollback** (rollback): returning the system to a previous stable version/configuration to reduce impact quickly.
- **Action items** (action items): specific tasks after the postmortem, with an owner and a deadline, to prevent the incident from recurring.

### Speaking structure (step by step)
1. **Set context:** service, time, severity, impact.
2. **Timeline:** detect -> mitigate -> recover (give timestamps).
3. **Root cause:** what failed and why the system allowed it.
4. **Action items:** prevention, detection, response — each verifiable.

### Sample answer (natural B2-C1)
"About a year ago, at 2:10 p.m., our payment status API started returning 500 errors. Within ten minutes the error rate reached about 12 percent, affecting roughly one in eight checkout attempts. I was on call, so I acknowledged the alert and opened an incident channel.

**Timeline:** At 2:15 we confirmed the spike matched a config change deployed at 2:00. We mitigated by rolling back that change at 2:18. By 2:25 the error rate was back under 0.5 percent, and we kept monitoring for another 20 minutes before closing the incident.

**Root cause:** The new config reduced the database connection pool size below peak demand. Under load, requests waited for a free connection, timed out, and returned 500. The deeper issue was that we had no load test for that config path and no alert on pool saturation.

**Action items:** First, add a connection-pool saturation alert and a dashboard panel — I owned it, due in one week. Second, require a canary and a peak-load check for config changes touching pools — the team lead owned it, due in two weeks. Third, document a rollback runbook for config deploys — due in three days. We reviewed all three items in the next sprint and confirmed they were done."

| Action item | Type | Owner | Deadline | How to verify |
|---|---|---|---|---|
| Pool saturation alert | Detection | Me | 1 week | Alert fires in staging test |
| Canary + load check for config | Prevention | Team lead | 2 weeks | Pipeline gate added |
| Rollback runbook | Response | Me | 3 days | Runbook used in drill |

### Pitfalls to avoid
- No numbers: "it was bad for a while" is weak; give rate and duration.
- Blaming: "someone deployed wrong" hurts trust; describe the process gap.
- Vague follow-up: "we will be careful" is not an action item.

### Useful phrases
- "The user impact was about twelve percent of requests over fifteen minutes."
- "We mitigated first to protect users, then investigated."
- "The root cause was X, and the contributing factor was Y."
- "Each action item had an owner and a due date, and we verified completion."

### Common mistakes (Vietnamese speakers)
- Present tense for past events: say "we rolled back", not "we roll back".
- "Root reason" -> say "root cause"; "solve the incident" -> "resolve/mitigate the incident".
- Over-apologizing in a factual report; keep it professional and evidence-based.

> Senior tip: Separate **mitigation** (stop the bleeding) from **root cause** (why it happened) and from **prevention** (make it unlikely again). Interviewers value ownership, clear communication under pressure, and action items that improve the system — not hero debugging alone.`,
    follow: [
        'How do you communicate updates to stakeholders during an active incident?',
        'What is the difference between a root cause and a contributing factor?',
        'How do you make sure action items are actually completed?',
    ]
  },
  'english-135': {
    q: "In an interview, how would you compare blue-green and canary deployments and explain when you would choose each?",
    a: `**Summary (30-second spoken answer):** I compare them by risk, speed of rollback, cost, and how much real traffic tests the new version. **Blue-green** runs two full environments and switches all traffic at once, so rollback is fast but you pay for double capacity. **Canary** shifts a small percentage of real traffic first and grows it while watching metrics, so it catches real-world issues early but needs good monitoring and traffic control.

### Key terms (explained for the first time)
- **Environment** (environment): a set of infrastructure running the application (machines/containers, configuration). "Two environments" means two identical sets running side by side.
- **Traffic shifting** (traffic shifting): adjusting the percentage of requests that go to the new version (for example 1% -> 10% -> 50% -> 100%).
- **Blast radius** (blast radius): the maximum damage if the new version has a bug. Canary reduces blast radius because only some users are affected at first.
- **Health signal** (health signal): metrics used to decide whether to continue or roll back (error rate, p95 latency, business KPIs).

### How it works (step by step)
**Blue-green:**
1. Keep Blue (current) serving 100% traffic.
2. Deploy and verify Green (new) with no user traffic.
3. Switch the router/load balancer from Blue to Green (all at once).
4. Roll back by switching back to Blue if needed. Keep Blue until confident.

**Canary:**
1. Deploy the new version alongside the current one.
2. Route a small slice (for example 1-5%) of real traffic to it.
3. Compare metrics (errors, latency, saturation, business KPIs) against the baseline.
4. Gradually increase; pause or roll back automatically on bad signals.

### Trade-off table (good to say out loud)
| Dimension | Blue-green | Canary |
|---|---|---|
| Rollback speed | Very fast (switch back) | Fast (route traffic back) |
| Real-traffic testing | Only after full switch | Yes, from a small percentage |
| Blast radius | 100% at switch moment | Limited early |
| Cost/complexity | Double environment capacity | Needs traffic splitting + strong metrics |
| Best when | Need a simple, quick cutover; stateless or compatible schema | Risky changes; need real-user validation |

### Example answer
"For a low-risk internal tool, I would choose blue-green because the cutover and rollback are simple. For a checkout change that touches payments, I would prefer a canary: start at 5 percent for 15 minutes, watch error rate and p95 latency, then ramp up. The key is that the decision is metric-driven, not gut feeling."

### Pitfalls
- Blue-green with incompatible database migrations: both versions may hit the same DB, so the schema must be backward/forward compatible.
- Canary without good baselines or with too little traffic: you cannot tell signal from noise.
- No automated rollback criteria — humans react too slowly under pressure.

### Useful phrases
- "I would choose based on risk, rollback speed, and observability."
- "With a canary, we limit the blast radius by starting with a small percentage of traffic."
- "Either strategy only works if the database changes are backward compatible."

### Common mistakes (Vietnamese speakers)
- Saying "blue-green is always better" — avoid absolutes; tie the choice to context.
- Confusing "canary release" with "testing in production without control" — emphasize the controlled percentage and metrics.
- Pronunciation tip: stress clearly — "CA-na-ry" (like the bird), "blue-green".

> Senior tip: Senior answers connect deployment strategy to **observability and data safety**. Mention the exact signals you would watch, the ramp-up steps, and how you handle schema changes (expand/contract). That shows you can reduce risk in practice, not just name patterns.`,
    follow: [
        'What metrics form a good automated rollback rule for a canary?',
        'How do you handle database schema changes with blue-green deployments?',
        'When might a simple rolling update be enough instead?',
    ]
  },
  'english-136': {
    q: 'How do you monitor your service in production? Explain it in an interview as if to someone who knows some basics but not your stack.',
    a: `**Summary (30-second spoken answer):** I explain monitoring in layers: metrics to see trends and alert on symptoms, logs to understand what happened, and traces to follow a single request across services. I focus on user-facing signals (errors, latency, saturation) first, define clear alerts tied to SLOs, and make sure every alert is actionable.

### Key terms (explained for the first time)
- **Metric** (metric): a measurement over time (error rate, latency, CPU). Used to see trends and set alerts.
- **Log** (log): a line recording a detailed event (who did what, what error). Used to investigate the cause.
- **Trace / Distributed tracing** (trace / distributed tracing): following a single request across services, each step is a "span". Helps find which step is slow or failing.
- **SLO** (Service Level Objective — service level objective): a measurable target, for example "99.9% of requests succeed each month" or "p95 < 300 ms".
- **Alert fatigue** (alert fatigue): too many alerts create noise, causing on-call engineers to miss important alerts.

### How I structure the answer (step by step)
1. **User symptoms first (golden signals):** traffic, errors, latency, saturation (resources saturated such as CPU, memory, thread/connection pool).
2. **Dashboards:** a high-level view per service (request rate, error rate, p95/p99, dependency health).
3. **Logs:** structured logs (JSON) with a correlation/request ID so I can search one request end to end.
4. **Traces:** for microservices, tracing shows which hop adds latency.
5. **Alerting:** page only on symptoms that affect users or are about to; every page has a runbook. Non-urgent issues create tickets.

### Example
"For a Spring Boot API, I tracked request rate, 5xx rate, and p95 latency as the main signals. We instrumented metrics with Micrometer, shipped logs with a request ID, and used tracing to see calls to the database and downstream APIs. Alerts fired if the 5xx rate stayed above 1 percent for five minutes or if p95 latency breached our SLO, and each alert linked to a runbook with first checks."

| Layer | Question it answers | Example |
|---|---|---|
| Metrics | Is it healthy now? Trending worse? | 5xx rate, p95 latency, pool usage |
| Logs | What exactly failed? | Exception + request ID |
| Traces | Where is time spent across services? | Slow DB span |

### Pitfalls
- Alerting on CPU alone: high CPU is not always a user problem, and low CPU can hide timeouts.
- Unstructured logs with no request ID — impossible to correlate under load.
- Too many noisy alerts, causing alert fatigue and missed real incidents.

### Useful phrases
- "I start with user-facing signals: errors, latency, and traffic."
- "Every alert is actionable and links to a runbook."
- "We use a correlation ID so we can follow a single request across logs and traces."

### Common mistakes (Vietnamese speakers)
- Using "monitoring" as a verb oddly ("I monitoring the service") — say "I monitor the service" / "we set up monitoring".
- Listing tools only (Prometheus, Grafana) without explaining what you measure and why.
- Confusing logs and metrics: metrics are numbers over time; logs are event records.

> Senior tip: Good monitoring is designed around **actionability**. Tie alerts to SLOs and symptoms, reduce noise, and practice using dashboards during game days. If an alert fires and nobody knows what to do, it is not monitoring — it is noise.`,
    follow: [
        'What is the difference between monitoring and observability?',
        'How do you avoid alert fatigue for an on-call team?',
        'Which metrics would you watch for a JVM-based service specifically?',
    ]
  },
  'english-137': {
    q: 'How would you talk about on-call experience in an interview? What makes a good answer sound responsible rather than negative?',
    a: `**Summary (30-second spoken answer):** I describe on-call factually: the rotation setup, what kinds of alerts I handled, how I responded (triage, mitigate, communicate), and what I improved to reduce future pages. I show ownership and calm communication, not heroics, and I avoid blaming the company for having on-call.

### Key terms (explained for the first time)
- **On-call** (on-call): a schedule assigning who is responsible for responding to alerts/incidents outside business hours. When the system alerts, the on-call person is the first responder.
- **Rotation** (rotation): a way of dividing shifts by week/person so the workload is shared fairly.
- **Triage** (triage): quickly assessing severity and the first response direction (who is affected, whether an immediate rollback is needed).
- **Runbook** (runbook): a document with step-by-step instructions for common alerts/incidents, helping response to be fast and consistent.
- **Page** (page): an urgent notification sent to the on-call person (phone, SMS, app) when there is an incident.

### How to structure your answer
1. **Setup:** "We had a weekly rotation with a primary and a secondary."
2. **Response behavior:** acknowledge fast, assess impact, mitigate to protect users, communicate status, then find root cause.
3. **Evidence of maturity:** give a brief example with impact and outcome.
4. **Improvement:** what you changed so the same class of issue paged less (better alerts, fixes, automation).

### Sample answer
"In my last team, I was on a one-week primary rotation shared across six engineers. When I got paged, my first step was to confirm user impact and mitigate quickly, usually by rolling back a recent change or disabling a feature flag. I posted short updates in the incident channel every few minutes so stakeholders were not guessing.

For example, I handled a latency spike caused by connection pool exhaustion; we rolled back a config change within eight minutes and error rates recovered. Afterward I added a saturation alert and a runbook entry. Over time we focused on reducing noisy pages by tuning alert thresholds, which made the rotation sustainable."

### Pitfalls (what to avoid saying)
- Purely negative: "on-call was terrible, I hated it" — sounds unprofessional. Be honest but constructive.
- Hero culture: "I fixed everything alone at 3 a.m." — interviewers prefer teamwork, runbooks, and prevention.
- No learning: describing pages without mentioning improvements.

### Useful phrases
- "I was part of an on-call rotation as the primary responder."
- "My priority was to reduce user impact first, then investigate the root cause."
- "We improved the runbooks and alert quality to cut down noisy pages."
- "I communicated regular status updates so the team had a clear picture."

### Common mistakes (Vietnamese speakers)
- Saying "I am on-call yesterday" — use past forms: "I was on call last week" / "I handled an on-call incident".
- Translating the phrase for "overnight shift" awkwardly; "on-call rotation" and "overnight pages" are natural.
- Being vague about actions: replace "I supported the issue" with concrete verbs — "I acknowledged, triaged, mitigated, and followed up".

> Senior tip: Strong candidates show that on-call is a **feedback loop**: pages reveal weaknesses, and you respond by improving reliability (alerts, automation, runbooks, fixes). Mention sustainability and teamwork — that signals senior ownership without burnout bragging.`,
    follow: [
        'How do you hand over context to the next engineer in the rotation?',
        'What makes an alert worth paging someone for?',
        'How would you improve an on-call process that causes frequent burnout?',
    ]
  },
});
