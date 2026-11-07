/*
 * English translation of js/data/q-system-design.js — task T658. Format: js/core/i18n.js (content overlay).
 * ids: architecture-029 architecture-030
 */
App.i18n.content({
  'architecture-029': {
    q: 'What is cloud cost management (FinOps) and why is it an architectural attribute? Give concrete numeric examples and the architectural trade-offs that directly affect the bill.',
    a: `**Summary:** FinOps (Financial Operations) is the continuous practice of managing cloud cost, with engineering, finance and product working together. Cloud cost **is an architectural attribute** because the design decisions (serverless versus always-on containers, which database you pick, how long logs are kept, chatty services calling each other over the network, multi-AZ/region) determine 70–90% of the bill — optimizing after the system is built only shaves off a small slice. A good architecture balances cost against reliability, performance and delivery speed, using **unit numbers** (cost per request/order/tenant) instead of staring only at the total bill.

### What → why it is an architectural attribute
- **What FinOps is:** not an "end-of-quarter cost-cutting campaign" but a loop: measure (know where the money goes) → assign an owner (who is accountable) → optimize (change architecture/configuration) → forecast. Like an electricity bill: only when you know which machine burns the power do you know what to switch off or replace.
- **Why it is an architectural attribute:** the code can be perfectly correct and a wrong architecture choice can still cost 5–10× more. Example: two chatty services calling each other 20 times per request across a NAT Gateway plus cross-AZ — every single request is cheap, but 500 million requests a month turns that into a huge bill. The decisions "merge or split", "call synchronously or asynchronously", "where and how long data is stored" are locked in at design time.
- **Concepts to know:** {{on-demand}} (pay per hour/second, flexible, the most expensive), {{reserved/savings plan}} (commit for 1–3 years, roughly 30–60% cheaper for steady load), {{spot}} (uses spare capacity, roughly 60–90% cheaper but the capacity can be reclaimed — fits jobs that tolerate interruption).

### Numeric example (illustrative, to get the order of magnitude)
Assume an e-commerce API averaging ~50 requests/second (≈130 million/month), with peak hours 4× higher:

| Architectural decision | Option A (more expensive) | Option B (cheaper) | Trade-off |
|---|---|---|---|
| Compute | 12 EKS pods always running for peak (over-provisioned) ~\$1,800/month | Autoscale 3→12 pods on load + a spot mix for workers ~\$700/month | B needs working autoscaling and warm-up; spot only for interruption-tolerant jobs |
| DB | One large on-demand RDS instance ~\$900/month | Right-size + 1-year reserved for the baseline ~\$550/month | Reserved needs a commitment; you have to measure real utilization |
| Logs/observability | Keep application logs 365 days, index every field ~\$1,200/month | 30 days hot + archive to S3, trace sampling at 10% ~\$300/month | You lose the ability to look up old logs; you still need enough tracing during incidents |
| Service-to-service | 2 services calling each other cross-AZ through NAT, chatty: ~\$400/month data transfer | Batch the calls, use internal endpoints, consider co-locating in one AZ/caching ~\$80/month | Batching increases coupling; cross-AZ helps HA — do not drop HA just to be cheap |
| Storage | Images/objects always in S3 Standard ~\$230/month (10 TB) | Lifecycle: 30 days Standard → IA → Glacier ~\$60/month | Glacier retrieval is slow and expensive; fits cold data |

*(Illustrative numbers at the orders of magnitude you typically see; reality depends on region/configuration — always compute with the pricing calculator and the real bill.)*

Illustrative totals: A ~\$4,530/month vs B ~\$1,690/month for the same functionality, but B accepts trade-offs (shorter retention, a reserved commitment, autoscaling that must actually work).

### Measuring properly: cost units
- A rising total bill can be good news (more users). Useful metrics: **cost per 1,000 requests**, **cost per order**, **cost per tenant/month**. If traffic doubles and cost per order stays flat → the architecture scales efficiently.
- Tag resources ({{service}}, {{team}}, {{env}}) so you know whose money is whose. Without tags the bill is one lump that nobody owns.

### Typical architectural trade-offs
- **Managed vs self-hosted:** managed services (RDS, MSK) cost more in service fees than running it yourself on EC2, but they cut operational effort and risk. For a small team, managed is usually cheaper overall once you count the salary spent on operating it.
- **Serverless (Lambda) vs always-on:** Lambda is cheap when load is low or sporadic (you pay per invocation) and much more expensive under high, continuously steady load — there containers/EC2 + reserved are cheaper. Do the math against your actual load profile.
- **High durability/HA vs cost:** multi-AZ, cross-region replicas and long-term backups all cost money. Choose according to the RPO/RTO you actually require; do not "switch everything on to be safe" — a low-stakes internal system does not need payment-system levels of HA.
- **Build vs buy:** building it yourself (log pipeline, auth) consumes engineering time continuously — the hidden cost is usually larger than the service bill you avoided.

### Production pitfalls
- **Micro-optimizing while missing the macro:** an engineer spends 3 days cutting pod CPU by 5% while logs/indexing account for 40% of the bill. Always start from the top-5 cost breakdown.
- **Data transfer gets forgotten:** cross-AZ, NAT Gateway and internet egress are billed per GB — a chatty service-to-service architecture can make that line item balloon unexpectedly.
- **Orphaned resources:** unattached EBS volumes, load balancers with no targets, old snapshots, dev environments still running over the weekend. Automatically stop/delete what is unused.
- **Cost cutting that breaks the SLO:** fewer replicas, multi-AZ switched off, logs deleted to save money → longer incidents and lost trust. FinOps optimizes **waste**, not the **durability you need**.

> Senior tip: When I present an architecture decision I include an order-of-magnitude cost estimate and the cost-per-request number, for example "option A ~\$2k/month, B ~\$600/month, but RTO grows from 5 minutes to 30 minutes — for the payment system I take A, for an internal reporting tool I take B". That shows you treat cost as a real design constraint, not as something the finance team deals with after deployment.`,
    follow: [
      'How do you detect and clean up orphaned cloud resources automatically?',
      'When does serverless (Lambda) become more expensive than running containers continuously? Estimate the break-even point.',
      'How do you balance a multi-region (DR) requirement against infrastructure cost that is nearly doubled?'
    ],
  },
  'architecture-030': {
    q: 'You are the architect and the team disagrees with your architecture decision (for example the technology choice or how the services are split). How do you lead that decision: how do you use an RFC, a spike and measurable criteria to reach a conclusion?',
    a: `**Summary:** The goal is not to "win the argument" but to reach the **best decision the evidence supports**, one the team understands and commits to executing. The pragmatic process: write an **RFC** (Request for Comments — a proposal asking for feedback) that states the problem, the options and the evaluation criteria clearly; use a **spike** (a short, time-boxed experiment) to turn opinions into data when the criteria are still vague; decide against the **measurable criteria** agreed in advance; record the outcome as an ADR. An architect leads by making the problem and the trade-offs clear, not by imposing a title.

### What → why it is needed
- **What:**
  - **RFC:** a proposal document (1–3 pages) sent to the team for input before anything is locked: context, problem, the candidate options, criteria, the option you recommend, risks. It has a feedback deadline (e.g. 3 working days).
  - **Spike:** a short technical experiment (time-boxed, usually 1–5 days) that answers one specific question ("Can Kafka sustain 5,000 msg/s with a 2 KB payload on our infrastructure?", "Does ORM X generate N+1 queries in our case?"). The output is data/a conclusion, and **spike code is normally thrown away**.
  - **Measurable criteria:** the concrete metrics used to compare options (p95 latency, throughput, cost/month, estimated operational effort, implementation time, how familiar the team is with it).
- **Why it is needed:** architecture disagreements are usually disagreements about **priorities** (person A thinks latency matters most, person B thinks delivery speed does) or about **unverified assumptions** ("Mongo is obviously faster"). Without a process, the debate falls back to gut feeling, personal reputation, or whoever talks loudest.

### Leading the process step by step
1. **Clarify the problem, do not jump to a solution:** write a "Problem statement" paragraph — what are we actually solving, what are the constraints (SLA, budget, deadline, team skills), and how success is measured. Many disagreements dissolve once everyone agrees on the problem.
2. **List the genuine options (including the ones you dislike):** state the pros and cons of each honestly. If an RFC only praises one option, that is lobbying, not an RFC.
3. **Lock the criteria and their weights BEFORE debating the options:**
~~~text
Criteria (example: choosing a message broker):
- Meet 5,000 msg/s throughput (hard requirement, pass/fail)
- Support 7 days of replay (hard requirement)
- Operational effort for a team with 1 SRE (high weight)
- Cost per month (medium weight)
- p95 latency < 500 ms (good enough, no need to over-optimize)
Agree this criteria set with the team before scoring any option.
~~~
4. **Use a spike whenever an assumption is still unverified:** if the fight is "is Kafka too complex for our team?" — run a 3-day spike: stand up a dev cluster, write a producer/consumer, measure the effort and the problems you hit. Settle it with data, not with a feeling.
5. **Collect feedback in a structured way:** the RFC stays open for comments for the deadline period; hold a 30–45 minute meeting only to resolve the unclear points, and do not let the meeting restart the debate from scratch. Record objections in the RFC ("Concern: ... / Response: ...").
6. **Make the decision transparently:** the person accountable for the decision (DRI/architect) calls it and spells out the basis against each criterion. **Disagree and commit** — people who disagreed are still acknowledged, but the team commits to executing; set a **review checkpoint** (e.g. after 2 months/a quarter) if the criteria are not met.
7. **Write the ADR:** capture the outcome as an ADR (see architecture-023) so it does not get re-litigated.

~~~seq
title: Leading an architecture decision
actors: Arch | Team | Spike
Arch -> Team: RFC: problem + options + criteria
Team -> Arch: feedback, raises concerns
Arch -> Team: agree the shared criteria
Arch -> Spike: 3-day spike to test an assumption
Spike --> Arch: results that were measured
Arch -> Team: decision per criteria + why
Arch -> Team: write ADR, set review checkpoint
~~~

### Production pitfalls
- **Imposing by authority:** "I am the architect, so we use this" — the team complies but is not committed, quietly resists, or stops flagging risks. The decision ends up worse because you lost the collective intelligence.
- **Conceding to keep the peace:** picking a mediocre option to avoid conflict even though the criteria say another one is better. Leading means owning a decision that has a basis.
- **A spike with no question and no time-box:** it becomes a 3-week mini-project and spike code leaks into production. A spike must have a clear question ("have we measured X?") and a hard end date.
- **No review checkpoint:** a wrong decision lives forever because "it has already been decided". Write in the ADR: "review after 8 weeks; if operational cost > Y or p95 > Z, reconsider option B".
- **Ignoring the quiet voices:** the people who say nothing (juniors, newcomers, remote colleagues) may be the ones who see a real risk. A written RFC lets them contribute without having to argue out loud.

> Senior tip: The sign that you led this well is that after the decision, the person who objected can explain "why the team chose this" almost as accurately as you can — meaning they saw their own argument taken into account. In an interview, tell a real story: what the disagreement was, which RFC/spike/criteria you used, and how it turned out (including the time you were wrong and changed your mind thanks to data) — that shows more maturity than claiming you are always right.`,
    follow: [
      'When the spike shows that the option you proposed is worse, how do you handle it in front of the team?',
      'How do you tell apart a decision that "needs consensus" from one that "needs decisiveness even though nobody is fully satisfied"?',
      'The team is spread across time zones — how do you adapt the RFC/spike process?'
    ],
  },
});
