/*
 * English translation of js/data/q-ai.js — task T973. Format: js/core/i18n.js (content overlay).
 * ids: ai-048 ai-049 ai-050 ai-051 ai-052
 */
App.i18n.content({
  'ai-048': {
    q: '(Case study SA) An insurance company receives 1 million claims per month (invoice photos, discharge papers, prescriptions). They want to automatically extract information and fast-track approval, but errors could cause incorrect payouts. How would you design the pipeline on AWS?',
    a: `**Summary:** A multi-stage asynchronous pipeline: **receive and classify** documents → **OCR/structured extraction** (Amazon Textract for tables, forms, field-level queries) → **LLM normalization and cross-check of business logic** (schema-constrained output, cross-verification between documents) → **deterministic business rules** → **confidence-based routing**: high confidence auto-approves, low confidence goes to a **human reviewer** (Amazon A2I or an internal tool). Every decision carries **evidence** (location on the image, extracted value, rule applied) for audit; reviewer corrections feed back as evaluation data.

### Architecture
~~~seq
title: Claims processing pipeline
actors: App | S3 | StepFn | Textract | LLM | Reviewer
App -> S3: upload claim image (presigned URL)
S3 -> StepFn: ObjectCreated event -> start workflow
StepFn -> Textract: AnalyzeDocument (forms, tables, queries)
StepFn -> LLM: normalize to schema, cross-check documents
StepFn -> StepFn: business rules + confidence score
StepFn -> Reviewer: if low confidence: manual review (task token)
Reviewer --> StepFn: confirm / correct
~~~
- **Step Functions** orchestrates: retry per step, wait for reviewer via task token, persist state.
- **Textract**: extracts with coordinates and confidence per field; use Queries to ask directly "Total amount?", "Discharge date?".
- **LLM** (Bedrock): normalizes drug names, diagnosis codes, cross-checks "does the invoice match the prescription and discharge paper", returns JSON per schema; **does not** decide the payout amount.
- **Deterministic rules**: contract limits, exclusion lists, duplicate invoice detection (image hash + invoice number).

### Confidence-based routing
| Condition | Handling |
|---|---|
| All key fields high confidence, rules pass, amount below threshold | Auto-approve |
| One field low confidence or documents mismatch | Reviewer checks only that field (UI shows only the relevant image region) |
| Large amount, fraud signals | Always two-level manual review |
Thresholds are calibrated from data: measure the error rate of the auto-approved group on a weekly random sample.

### Real-world example
Pilot on 50,000 claims: 58% auto-approved with a 0.3% error rate (sample of 2,000 claims checked), lower than the previous manual-entry error rate (1.1%); average processing time from 3 days down to 4 hours. Reviewers only correct flagged fields, so productivity tripled. Extraction + LLM cost about $0.06/claim. One lesson: tilted/blurry photos caused most errors → add an image-quality check in the app, requiring a retake before submission.

### Pitfalls
- Letting the LLM decide the payout amount → not explainable, hard to audit.
- Trusting model confidence without calibrating on real data.
- Sending health data outside the region or writing it to logs.
- Not storing evidence (location, original value) for each decision.

### Interview notes
"I design an asynchronous pipeline orchestrated by Step Functions. Images upload straight to S3 via presigned URL, and the event triggers the workflow. Textract extracts forms and tables and answers field-level queries, with coordinates and confidence. An LLM on Bedrock normalizes data per schema and cross-checks documents, but does not decide the amount; the decision comes from deterministic business rules such as limits, exclusions, and duplicate-invoice detection. Then confidence-based routing: high confidence and small amount auto-approves; an uncertain field goes to a reviewer who checks only that field; large amounts or fraud signals get two-level review. Thresholds are calibrated via weekly random sampling, and every decision stores evidence for audit."

> Senior tip: measure and report the **error rate of the auto-approved group** via weekly random sampling, compared with the old manual process. That number — not OCR accuracy — is what convinces the risk team to allow expanded automation.`,
    follow: [
      'How would you calibrate the confidence threshold to balance auto-approval rate and error risk?',
      'How would you detect altered or duplicate invoices across multiple claims?',
      'How is reviewer correction data used to improve the system?'
    ]
  },
  'ai-049': {
    q: '(Case study SA) Operations wants an AI agent that reads alerts, queries logs/metrics on AWS, and autonomously runs runbooks (restart service, scale, rollback) to reduce overnight incident response time. As SA, how would you design permissions, safety, and control?',
    a: `**Summary:** Design by the principle **"read broad, write narrow, write through a gate"**: the agent has **read-only** access (CloudWatch, logs, X-Ray, describe) for diagnosis; system-changing actions are performed only through a **named set of runbooks with validated parameters and bounded scope** (no "run arbitrary command" permission), each action has a **risk level** deciding whether **human approval** is required; every step is **audited**; there are **rate and blast-radius limits** plus an **emergency stop**.

### Architecture
- **Trigger**: CloudWatch alarm → EventBridge → agent receives context (alarm, service, time).
- **Diagnosis (read-only)**: read-only role with {{cloudwatch:GetMetricData}}, {{logs:StartQuery}}, {{xray:GetTraceSummaries}}, {{ecs:Describe*}}; agent summarizes hypotheses with evidence (queries run, metrics).
- **Actions**: no direct AWS API calls; call **approved Systems Manager Automation runbooks** (e.g. "restart ECS service X", "rollback deployment Y to previous version", "scale up by max 2 tasks"). Each runbook has its own IAM role with just enough permission, and parameters are validated (service must be on the allowlist).
- **Approval**: low-risk actions (restart a task, add 1–2 tasks within limits) may auto-run off-hours per policy; high-risk (rollback, DB changes, network changes) send a Slack/PagerDuty message for the on-call to approve, with an expiry.
- **Limits**: at most N actions per hour, no concurrent actions on the same service, no touching production DB; exceeding limits stops and pages a human.
- **Audit**: every step (prompt summary, tool called, parameters, result) logged immutably, linked to the incident.

### LLM-specific risk controls
| Risk | Control |
|---|---|
| Hallucination leading to wrong action | Actions must cite metric/log evidence; runbooks have prerequisite self-checks |
| Prompt injection via log content (log contains "ignore previous instructions…") | Treat logs as untrusted data; write permission does not depend on log content; tools are allowlisted |
| Action loops | Step limit, cooldown, state check after each action |
| Over-broad permissions | No AdministratorAccess role; SCP blocks dangerous actions for the agent's role |

### Real-world example
An e-commerce company piloted the agent for 3 months: phase 1 diagnosis and suggestions only (no actions) — on-call confirmed suggestions correct on 74% of incidents, time to root cause dropped from average 28 minutes to 9 minutes. Phase 2 allowed auto-running 3 low-risk runbooks (restart failed task, clear cache, scale +2 tasks) with a 5/hour limit; other actions required approval. Once a log contained text resembling a command entered by a user via a form — the agent proposed an unusual action but could not execute it because no matching tool existed. Overnight wake-ups dropped 40%.

### Interview notes
"My principle is read broad, write narrow, and write through a gate. The agent has a read-only role to diagnose from metrics, logs, and traces, and must present hypotheses with evidence. System-changing actions do not go through arbitrary AWS APIs but through an approved set of runbooks such as Systems Manager Automation, each with its own role sufficient only for that action and parameters validated against an allowlist. Each action has a risk level: low risk can auto-run within rate limits, high risk needs on-call approval. There are step limits, cooldowns, an emergency stop, SCPs blocking dangerous actions for the agent's role, and full audit. Logs are treated as untrusted data to defend against prompt injection. I roll out in phases: suggestions first, measure accuracy, then auto-run low-risk runbooks."

> Senior tip: start in **"shadow" mode** — the agent only logs the action it *would* take, and the on-call compares with what they actually did. After a few dozen incidents you have real data to decide which runbooks are safe for automation, instead of arguing by feel.`,
    follow: [
      "How would you evaluate the agent's diagnosis accuracy before allowing it to act?",
      'What harm can prompt injection via logs or tickets cause, and where do you block it?',
      'Who is accountable when an agent action causes an incident?'
    ]
  },
  'ai-050': {
    q: '(Case study SA) Leadership wants an "AI assistant for employees" in 3 months. As SA, how would you evaluate buy (Amazon Q Business or SaaS), managed service (Bedrock Knowledge Bases + Agents), and build (Spring AI/LangChain4j + vector DB), and what recommendation would you make?',
    a: `**Summary:** I do not choose by technology but by **how differentiated the problem is**: common needs (internal-doc Q&A, summarization, search with permissions) → **buy** for fast value; deep integration with business systems and control over the flow → **managed service** (Bedrock Knowledge Bases, Agents, Guardrails); only **build** the part that creates proprietary advantage or has special requirements (complex business flows, core integration, cost at scale). The decision rests on a **weighted criteria table**, a **4–6 week pilot measured with data**, and is recorded as an ADR.

### Evaluation criteria
| Criterion | Buy (Q Business / SaaS) | Bedrock KB + Agents | Build (Spring AI / LangChain4j) |
|---|---|---|---|
| Time to launch | Weeks | Weeks–months | Months |
| Permission inheritance from source (SharePoint, Confluence) | Built-in connectors, inherit ACL | Metadata filter, self-sync permissions | Build everything |
| Flow customization, integration with internal systems | Limited | Medium (action group calls Lambda/API) | Full control |
| Data location, compliance | Per vendor/region support | Inside your own AWS account | Full control |
| Cost | Per user/month | Usage-based (tokens, vector storage) | Usage + ops cost |
| Vendor lock-in | High | Medium | Low (swap model/provider easily) |
| Team needed | Admin | Cloud + AI engineers | AI engineers + ops |

### Decision process
1. **List use cases** and rank by value × difficulty: typically 70% is doc Q&A, 20% is actions on internal systems (look up records, create tickets), 10% is specialized business logic.
2. **Non-negotiable constraints**: customer data must not leave the account/region, permissions must inherit from the source, full audit.
3. **Small parallel pilot** with 50–100 users, same evaluation question set (accuracy, correct citation, no leakage of documents the user lacks access to), real cost.
4. **Layered recommendation**: not necessarily one choice for everything.

### Real-world example
A 6,000-employee bank: pilot of Q Business for internal process Q&A (SharePoint connector, inherited permissions) reached 86% of answers rated correct with citations, launched in 5 weeks. But the teller assistant needed to look up customer records on the core and compute fees per the fee schedule — Q Business could not meet the control and per-query audit requirements. That part was built on Bedrock (Knowledge Bases for the fee schedule, action group calling internal APIs via Lambda with permission checks, Guardrails masking PII). The "product suggestion from customer profile" feature — a competitive advantage — was built with Spring AI inside an existing service. The ADR records: review after 12 months based on cost and satisfaction.

### Pitfalls
- Choosing to build because "the team likes the technology" for a common problem → 6 months recreating what already exists.
- Buying without checking document permissions → leaks HR/salary documents.
- Not measuring quality with a real question set before deciding.
- Ignoring long-term ops cost (evaluation, data updates, monitoring) when building.

### Interview notes
"I decide by how differentiated each use case is, not one technology for all. Common needs like permissioned internal-doc Q&A I buy, for example Amazon Q Business with connectors inheriting source permissions, to launch in weeks. When I need to call internal systems, control the flow, and keep data in my own account, I use Bedrock Knowledge Bases, Agents with action groups, and Guardrails. Only parts that create proprietary advantage or have special requirements get built with Spring AI or LangChain4j. I score on a weighted criteria table: time, permissions, compliance, customization, cost, vendor lock-in, team capability. Then run a small pilot with an evaluation question set and measure real cost, and record the decision as an ADR with a review date."

> Senior tip: include a mandatory test in the pilot: user A asks about a document only user B may see. Any solution that answers (even partially) is disqualified, regardless of how good the other criteria are.`,
    follow: [
      'How would you estimate total cost of ownership (TCO) of the build option over 2 years?',
      'How are document permissions from SharePoint inherited into a RAG system?',
      'How do you avoid vendor lock-in when using managed services?'
    ]
  },
  'ai-051': {
    q: '(Case study SA) The fraud team wants to "use an LLM to score fraud for every card transaction", but the approval flow allows total latency under 200ms at 3,000 transactions/sec peak. How would you design it?',
    a: `**Summary:** An LLM is **not suitable directly in the approval path under 200ms**: hundreds of milliseconds to seconds of latency, token cost at 3,000 transactions/sec is huge, and non-deterministic results are hard to explain to auditors. The right design is **two tiers**: a **synchronous tier** using **rules + a traditional ML model** (e.g. gradient boosting) on **precomputed features** to decide in tens of milliseconds; an **asynchronous tier** using the LLM for what it is good at: **summarizing and explaining** flagged cases for investigators, **analyzing text** (notes, complaints), **generating hypotheses** for new rules, and supporting investigations.

### Latency budget for the sync path
| Step | Budget |
|---|---|
| Receive request, basic checks | 10ms |
| Fetch features from feature store (Redis/DynamoDB): 1-hour transaction count, geo distance, device | 15ms |
| Hard rules (block lists, limits) | 5ms |
| ML model (co-located or nearby endpoint) | 10–20ms |
| Write decision, return result | 10ms |
| Reserve | remainder |
Every call has a timeout; if the model does not respond in time, a **deliberate default decision** is used (approve small transactions, soft-decline large ones) rather than hanging the transaction.

### Async LLM tier
~~~seq
title: Transaction flow and investigation
actors: Card | Scoring | Kafka | Investigator | LLM | Analyst
Card -> Scoring: approval request
Scoring --> Card: decision in 60ms (rules + ML)
Scoring -> Kafka: transaction event + score + reasons
Kafka -> Investigator: high-score cases or customer disputes
Investigator -> LLM: summarize history, explain signals
LLM --> Analyst: summary + suggested investigation questions
~~~
- The LLM receives **features and reasons** from the model (not raw data), producing a readable summary for the investigator; the investigator decides.
- Investigator conclusions feed back as **labels** to retrain the ML model.
- The LLM also classifies thousands of "not my transaction" disputes by fraud scenario.

### Real-world example
A card issuer tried placing an LLM directly in the scoring path in a test environment: p99 650ms, estimated cost over $200,000/month at real load, and the same transaction sometimes got different scores — the risk team rejected it. Two-tier design: gradient boosting with 120 precomputed features, total p99 48ms; the LLM runs only on ~0.8% of flagged transactions and on disputes. Investigator handling time per case dropped from 14 minutes to 6 minutes thanks to the summary; detection rate improved thanks to higher-quality labels fed back to the model. LLM cost about $3,000/month.

### Pitfalls
- Putting an LLM in a sync path with a tight SLA.
- Letting the LLM make block/approve decisions without explainability.
- Sending full card data into the prompt (PCI violation) instead of masked features.
- No label feedback loop → the model never improves.

### Interview notes
"I would not put an LLM in the approval path under 200 milliseconds: latency and cost at three thousand transactions per second do not fit, and non-deterministic results are hard to explain to auditors. I design two tiers. The sync tier uses hard rules and an ML model such as gradient boosting on precomputed features in a feature store, with a latency budget per step, timeouts, and a deliberate default decision if a component is slow. The async tier reads events from Kafka, and the LLM only handles flagged cases or disputes: summarize history, explain signals, suggest investigation questions for the investigator, classify disputes. The investigator decides, and their conclusions feed back as labels to retrain the ML model. Data sent to the LLM is masked features, not card numbers."

> Senior tip: when someone proposes "use an LLM for X", ask three questions: **allowed latency, volume per second, and whether the decision must be explainable**. The answers usually reveal whether the LLM belongs in the main path, beside it, or not at all.`,
    follow: [
      'How is the feature store kept up to date for real-time scoring?',
      'How would you explain ML model decisions to auditors?',
      'When can an LLM safely be placed in the synchronous path?'
    ]
  },
  'ai-052': {
    q: '(Case study SA) Your product serves Vietnamese customers (Q&A, summarizing Vietnamese contracts). There are many models to choose from: a large commercial model via API, a small cheap model, and a self-hosted open-source model. How would you choose a model with evidence?',
    a: `**Summary:** Do not choose from a general leaderboard — leaderboards usually measure English and different tasks than yours. I build a **custom evaluation set** from real product data (Vietnamese with diacritics, without diacritics, abbreviations, domain terms), define **measurable criteria** (content correctness, correct citation, format, no hallucination, safety), run candidate models, then place results next to **cost per task**, **p95 latency**, **data requirements** (where processing happens, whether data may be used for training), and **operational risk** (vendor dependency, model deprecation). The result is usually **multiple models per task**, not one.

### Step 1 — Custom evaluation set
- 300–500 anonymized real samples: customer questions (including typos, no-diacritics, "ko", "dc"), real contracts 10–40 pages long, trap questions (information not in the documents).
- For each sample: a reference answer or scoring rubric.
- Scoring via: automated checks (format, required fields), LLM-as-judge **calibrated** against a set of human graders, and human grading for hard samples.

### Step 2 — Decision table
| Criterion | Large model via API | Small model via API | Self-hosted open source |
|---|---|---|---|
| Vietnamese quality, long reasoning | Usually best | Enough for simple tasks | Varies widely between models; evaluate carefully |
| Cost / 1,000 tasks | High | Low | Fixed per GPU; cheap at large steady load |
| Latency | Medium | Low | Depends on infra |
| Data and compliance | Per vendor terms and region/Bedrock | Same as above | Full control |
| Ops | Vendor handles | Vendor handles | You handle GPU, scaling, updates |
| Risk | Model discontinued/behavior changed | Same | Need an ML ops team |

### Step 3 — Multi-model architecture
- **Router**: short FAQ → small model; long contract summary, multi-step reasoning → large model; high-volume batch classification at night → batch or self-hosted.
- **Abstraction layer** (Spring AI {{ChatClient}} or an internal gateway) to swap models by config, rerunning the eval before every change.
- **Production monitoring**: user dissatisfaction rate, handoff rate, output length, cost per task.

### Real-world example
A legal-tech company evaluated 5 models on 420 Vietnamese samples. Results: large model A scored 91% on contract summaries but cost 12× small model B; B scored 89% on FAQ but only 71% on long contracts and often missed penalty clauses; self-hosted open-source model C scored 84% on clause classification at the lowest cost for 200,000 documents/month batch. Decision: A for contract summaries, B for FAQ (75% of traffic), C for bulk classification. Total cost 58% lower than using A for everything; overall quality dropped less than 1 percentage point. When the vendor announced deprecation of version A, switching to the new version only required rerunning the eval and changing config.

### Pitfalls
- Choosing from an English leaderboard or a handful of hand-typed tests.
- An eval set without no-diacritics, abbreviations, and long documents — exactly what real users send.
- Self-hosting because "it's cheaper" without accounting for idle GPU and ops effort.
- Not rerunning the eval when the vendor updates the model.

### Interview notes
"I do not choose from a general leaderboard because those usually measure English and different tasks. I build an evaluation set of a few hundred anonymized real samples, including Vietnamese without diacritics, abbreviations, long documents, and trap questions, with clear scoring criteria; scoring uses automated checks, an LLM-as-judge calibrated against human graders, and human grading for hard samples. Then I place quality scores next to cost per task, p95 latency, data-processing location requirements, and operational risk. The result is usually multiple models per task: a small model for simple questions carrying most traffic, a large model for hard tasks, batch or self-hosted for high volume. I put an abstraction layer in place to swap models by config and always rerun the eval before any change."

> Senior tip: keep the evaluation set as a **product asset**, adding samples from every user complaint. After a year, that is the most valuable thing letting you swap models in an afternoon instead of a quarter.`,
    follow: [
      'How do you calibrate an LLM-as-judge so it can be trusted?',
      'When is self-hosting an open-source model actually cheaper than calling an API?',
      'How would you detect quality degradation after a vendor updates a model?'
    ]
  }
});
