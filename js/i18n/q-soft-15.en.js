/*
 * English translation of js/data/q-soft.js — task T985. Format: js/core/i18n.js (content overlay).
 * ids: behavioral-051 behavioral-052
 */
App.i18n.content({
  'behavioral-051': {
    q: `You caused a mistake that led to a production incident (the real environment serving users). How do you handle the situation: from discovery, communication, remediation, to taking responsibility and prevention?`,
    a: `**Summary:** When you yourself cause a production incident, the number one priority is **reducing impact** on users and the system, not protecting your ego. Then communicate transparently, take part in remediation and postmortem (post-incident analysis — what happened, why, what to do to not repeat it) without blaming individuals, take ownership of your part, and contribute process/technical improvements to make the whole team safer.

### Terms to understand
- **Production:** the environment serving real users. Incidents here can affect money, data, reputation. Everyday example: a restaurant's live kitchen serving customers — a wrong order affects real customers right away.
- **Rollback:** reverting the system to a stable previous version. Everyday example: installed a buggy app update, reinstall the old version.
- **Mitigation:** actions to reduce impact immediately (turn off a feature, limit traffic) even before the root cause is fixed.
- **Blameless postmortem:** analysis aimed not at punishing individuals but at finding systemic causes (missing tests, missing review, risky deploy process).

### Real-world context
You merge (combine) configuration changes for timeout (maximum wait time) and retry logic for a payment API; missing tests for the case where the partner is slow. After deploy, error requests increase, some transactions are processed slowly/with repeated warnings; the operations team discovers it after 12 minutes.

### Step-by-step approach
**S:** The mistake is from your change; impact ~8% of payment requests in 25 minutes, no confirmed money loss yet but complaints and risk of duplicate processing.

**T:** As the person who made the change, you must support fast incident handling, transparency, and ensure lessons are applied.

**A:**
1. **Detect and admit immediately:** when there is an alert or a colleague asks, quickly check dashboard/logs, confirm whether it relates to your deployment. Proactively report on the incident channel: "Possibly related to PR #... that I merged, I'm checking/proposing rollback."
2. **Prioritize mitigation:** coordinate with on-call/lead: rollback or turn off feature flag, reduce retry storm (many retry requests at once causing overload). Goal: restore service.
3. **Communicate clearly, without excuses:** update by timeline, state known impact, what is being done, next update time. Don't hide, don't blame "environment/partner" when the direct cause is your change.
4. **After stable — postmortem:**
   - Describe timeline: deploy 14:02, alert 14:14, rollback 14:27, stable 14:39.
   - Technical root cause: timeout too short + retry not idempotent on one branch.
   - Systemic root cause: missing integration tests for slow-partner scenario; deploy checklist missing a step to check metrics after 15 minutes.
   - You take your part of responsibility: "I didn't add tests for the timeout case and didn't ask for thorough review of the retry part."
5. **Remediation actions with owner and deadline:**
   - Add tests for timeout/retry (1–2 days).
   - Add idempotency key / duplicate prevention mechanism (per team design).
   - Update deploy checklist + payment error monitoring dashboard.
   - Propose canary release (roll out in small parts) for sensitive changes.

### Example figures
| Item | Value (illustrative) |
|---|---|
| Time to detect (MTTD — mean time to detect) | 12 minutes |
| Time to recover (MTTR — mean time to recover) | 25 minutes |
| Peak error request rate | 8% |
| Prevention actions completed | 5/5 in 10 days |

### Pitfalls
- **Hiding or staying silent:** prolongs the incident, serious loss of trust.
- **Accepting vague shared blame "everyone is at fault":** avoids personal responsibility; blameless postmortem doesn't mean no one takes their part.
- **Only fixing code, not process:** similar incidents recur.
- **Over-punishing yourself publicly:** doesn't help the system; focus on improvement.

### Interviewer signals
- Ownership and honesty — important quality at senior/lead level.
- Calm incident handling, prioritizing users/system.
- Ability to learn from mistakes and improve the system (not just the individual).

> Senior tip: When telling this story in an interview, balance it: 20% describing the mistake, 80% how you handled and improved. Clearly state "I did X wrong" and "then I changed Y so the probability of repetition is reduced" — with figures if possible. This question demonstrates maturity, not boasting that you never make mistakes.`,
    follow: [
      'What do you do if you find an error caused by you but it is near end of day and the team wants to wait until tomorrow?',
      'How do you participate in a blameless postmortem while still clearly owning your part of the responsibility?',
      'After an incident, how do you rebuild trust with the team and stakeholders?'
    ],
  },
  'behavioral-052': {
    q: `The company decides on a major technology/way of working change (for example: moving part of a monolith to a service, or applying Kafka for asynchronous processing) and your team is not familiar with it. How do you lead the team through this transition stage?`,
    a: `**Summary:** Leading technology change is both a **technical and people problem**: clarify business goals, choose a small pilot scope, build capability (training, pairing, documentation), set standards and safety nets (observability — ability to observe the system through logs/metrics/traces, rollback), communicate progress transparently, and manage resistance by listening and showing measurable results.

### Terms to understand
- **Monolith:** an application as one big block, many functions packaged/running together. Everyday example: a building where every room shares one old electrical system — fixing one place can affect others.
- **Message broker (Kafka/RabbitMQ):** an intermediary system that receives and distributes messages between software parts. Enables asynchronous processing (no need to wait immediately) but increases operational complexity.
- **Proof of Concept (PoC):** build small to check technical fit before big investment.
- **Observability:** ability to understand what the system is doing through logs (records), metrics (measurements), traces (following a request through multiple steps). Everyday example: electricity/water meters + cameras help know how the house is consuming.

### Real-world context
A fast-growing Vietnamese product company; the notification sending and data synchronization module is bottlenecking the Spring Boot monolith. Leadership wants to use Kafka for asynchronous processing. Team of 6, only 1 person has used Kafka; worried about message loss (losing messages).

### Technology transition coordination flow
~~~seq
title: Leading team technology change (Kafka pilot)
actors: Lead | Team | Platform/Ops | Product
Lead -> Product: Agree on goals, SLA and pilot scope
Lead -> Team: Assess skills, training plan
Lead -> Platform/Ops: Prepare infrastructure, monitoring, runbook
Team -> Lead: Implement PoC and report risks
Lead -> Product: Demo results, decide on expansion
Lead -> Team: Standardize template, review, operations
~~~

### Step-by-step approach
**S:** The current system causes slowdown at peak hours; the team has no Kafka experience; pressure to deliver features still exists.

**T:** The lead needs to introduce new technology safely, without disrupting the product, while building team capability.

**A:**
1. **Clarify "why" and success criteria:** reduce API response time for recording orders from 1.8s to < 500ms at peak hours; no loss of important business events; ability to replay (re-process) when needed.
2. **Choose a narrow pilot scope with clear value:** for example only convert the email/notification sending flow, not payments right away. Set up feature flag and short-term parallel run if needed.
3. **Build team capability:**
   - Short training: producer/consumer concepts, partition (partitioning), offset (read position), idempotency, retry/DLQ (dead-letter queue — queue holding error messages for later processing).
   - Pair programming: lead or experienced person pairs with 2–3 members in the first 2 weeks.
   - Coding guideline + Spring Boot template project (using Spring Kafka) + review checklist.
4. **Reduce operational risk:** coordinate with Platform/Ops for environment, monitoring consumer lag (consumption delay), alerts; write runbook (operations handbook). Define retry strategy and idempotency to avoid duplicate processing.
5. **Communicate and manage resistance:** listen to concerns (added complexity, on-call). Acknowledge trade-offs, provide PoC data, recognize contributions. Don't push "change everything immediately".
6. **Expand in phases:** after a stable 3–4 week pilot, retrospective (looking back), update standards, then expand to other flows.

### Example figures (illustrative)
| Metric | Before | After 6-week pilot |
|---|---|---|
| P95 order creation API time (peak) | 1800 ms | 420 ms |
| Notifications delayed > 2 minutes | 6% | 0.5% |
| Message loss incidents | N/A (synchronous) | 0 (with DLQ + replay test) |
| Members independently handling Kafka tasks | 1/6 | 4/6 |

### Pitfalls
- **Big bang (changing everything at once):** high risk, hard to rollback.
- **Theory-only training:** no hands-on practice on real flows.
- **Skipping operations:** code exists but no one knows how to handle lag/dead consumer.
- **Not tying to business goals:** team sees it as "tech toys".

### Interviewer signals
- Change leadership: vision, planning, execution, measurement.
- Balancing delivery speed and foundation investment.
- Developing others, building sustainable team capability.

> Senior tip: With new technology, set "stop/expand conditions" before starting: for example if after 2 weeks PoC doesn't meet the P95 target or the team can't operate alerts/runbook, go back to a simpler approach. A good lead is not someone blindly following technology, but someone who controls change risk.`,
    follow: [
      'How do you handle it when a senior on the team strongly opposes changing technology?',
      'How do you ensure quality and knowledge do not depend on a single "Kafka expert"?',
      'When do you decide to expand from the pilot to more modules?'
    ],
  },
});
