/*
 * English translation of js/data/q-remote.js — task T999. Format: js/core/i18n.js (content overlay).
 * ids: remote-059 remote-060 remote-061 remote-062 remote-063 remote-064 remote-065 remote-066
 */
App.i18n.content({
  'remote-059': {
    q: 'What are the typical bugs in an AI-written app, and how do you detect them quickly?',
    a: `**Summary:** AI-written apps often leak secrets to the frontend, lack server-side authorization checks (IDOR), have RLS disabled, impose no rate limits on LLM APIs, run queries without indexes/pagination/N+1, do heavy work inside requests, and ship without logging/backups/migrations/tests. A quick audit starts from git history and DevTools.

### 1. Typical bugs
- **Secrets leaked to frontend/repo**: API keys, Supabase/Firebase service-role keys appear in client code or commit history.
- **IDOR**: changing an ID in the URL exposes another user's data, because the endpoint only checks "logged in" instead of "owns this resource".
- **RLS disabled or wrong policy**: Postgres tables have Row Level Security off, so every user sees all data.
- **No rate limit on LLM APIs**: users or bots call continuously, bills spike.
- **Queries without indexes, without pagination, N+1**: list endpoints return entire tables, joins loop inside loops.
- **Heavy processing inside requests**: sending email, rendering PDF, calling LLM synchronously inside an HTTP request.
- **No logging, backup, migration, tests**: you cannot tell what failed, cannot roll back, cannot test.

### 2. Quick detection (1–2 hours)
1. Clone repo, run a secret scanner (gitleaks, trufflehog) over the whole history.
2. Open DevTools Network, search for keys in the JS bundle.
3. Check RLS: SELECT tablename, rowsecurity FROM pg_tables.
4. Run EXPLAIN ANALYZE on the main queries.
5. Review platform logs (Vercel/Netlify) and the LLM provider billing.

### 3. Checklist
- [ ] Secret scan clean; leaked keys rotated.
- [ ] Every endpoint checks ownership.
- [ ] RLS enabled with per-user policies.
- [ ] Rate limit on LLM endpoints.
- [ ] Index + pagination + no N+1.
- [ ] Heavy jobs moved to background.
- [ ] At least basic logging, backup, migration, tests.

> Senior tip: When auditing an AI app, start from "money and data": LLM bills and user data are the two things easiest to lose. Fix security and cost first, performance after.`,
    follow: [
      'How do you detect IDOR in a Next.js + Supabase app within 30 minutes?',
      'When a secret has leaked in git history, why is rotation mandatory rather than just deleting the commit?',
      'How do you prove an RLS policy is correct using a test with two accounts?'
    ]
  },
  'remote-060': {
    q: 'A founder (startup founder) asks you to "rescue" an AI-coded app (e.g. built with AI tools, Node.js/TypeScript stack + database). You are a Java backend dev with 4 years of experience, not familiar with that stack. How do you approach the initial audit (a systematic review) to find security, data, performance, and cost risks without over-promising?',
    a: `**Summary:** Auditing an AI-coded app is not reading all the code and "making it pretty". The goal is to find the **highest-impact risks first**: leaked data/secrets (secret keys like API keys, DB passwords), authentication/authorization flaws, dangerous database queries, and spiraling infrastructure costs. Even if you are strong in Java, you can still audit at the "backend fundamentals" level (general backend principles): request flow → auth → business logic → database → external services. Start with discovery (scoping), run a prioritized checklist, and produce a report with evidence + severity + milestone-based recommendations — while being honest about your stack limits.

### 1. Key terms explained (first time)
- **Founder** (startup founder): the person behind the product, often not deeply technical.
- **Audit** (systematic review): a structured review to find problems; different from "fix everything right now".
- **Secret** (secret key): values that must stay private, such as API keys (keys to call services), DB passwords, tokens. A leaked secret can let attackers access the system.
- **AuthN/AuthZ** (authentication/authorization): AuthN = who you are (login); AuthZ = what you may do (permissions). Confusing the two causes data leaks.
- **Severity** (severity level): how serious the impact/risk is (e.g. high/medium/low) to prioritize work.

### 2. A compact audit process over 3–5 working days (illustrative example)
You do not need to know every TypeScript detail to start. Follow the data flow.

~~~text
Day 1 — Discovery (scoping) and scope lock:
- Ask: what the app does, what sensitive data it holds (email, payments, personal), where it runs (which cloud), whether there are real users.
- Get the minimum access needed: read-only repo, cloud admin/log pages (if available), list of main endpoints.
- Confirm the goal: "find security/data/performance/cost risks" and the audit time budget (e.g. 12–16 hours).

Day 2 — Security & secrets (highest priority):
- Search secrets in repo/commit history and config files; check whether env variables were committed.
- Review endpoints: does it require login; can user A read/modify user B's data (IDOR — direct object reference without authorization).
- Check whether client input is used directly in queries/commands (injection risk — injecting malicious code).

Day 3 — Data & performance:
- Read the DB schema (table structure), migrations (scripts that change DB structure). Find columns missing indexes for common queries.
- Find repeated queries (N+1 pattern — 1 query to fetch a list + N queries for each item's details), endpoints returning too much data.
- Check transactions (DB transactions — groups of operations that must all succeed or all fail) on money/order flows.

Day 4 — Cost & operations:
- Review error logs, frequency of external/AI API calls — uncontrolled repeated calls inflate bills.
- Check basic deploy config: HTTPS enabled, DB backup enabled (if you have permission to view).

Day 5 — Report & recommendations:
- Compile findings by severity, with evidence (file/endpoint/reproduction steps, secrets redacted).
- Recommend fixes by milestone: (M1) block high risks, (M2) stabilize data/performance, (M3) improvements.
~~~

### 3. Example finding (assumed) to picture the report
~~~text
Finding F1 — Severity: HIGH
Issue: A third-party service key appears in a config file in the repo (assumed).
Impact: Anyone with repo read access (or a leaked repo) could use the key, causing costs/attacks.
Evidence: [file path, value redacted as ****abcd].
Recommendation: Revoke/rotate the key immediately; move it into env vars/secret manager; scan commit history.
Estimate: 1–2 hours plus verification.
~~~

### 4. Common mistakes when taking a "rescue AI app" job
- **Promising to "fix everything" before auditing**: easy to underestimate, because AI apps often hide technical debt.
- **Staying silent about stack limits**: you can say "I audit by backend principles and security; framework-specific parts I will verify or propose together with you" — honesty builds trust.
- **Looking only at code, ignoring config/cloud**: many risks sit in secrets, IAM permissions, public DBs, disabled backups.
- **No evidence**: "code looks unsafe" is weaker than a finding with location, reproduction steps, and impact.

### 5. Sample answer for interview/client (short)
"When auditing an AI-written app, I prioritize high-impact risks: leaked secrets, authorization flaws, and data safety. I follow the request flow from API to database, record findings by severity with evidence, then recommend fixes by milestone. I also state clearly which parts I am certain about and which need stack-specific verification."

> Senior tip: Sell an **audit with a clear deliverable** (report + roadmap) before selling "refactor everything". For AI apps, 20% of issues (secrets, auth, dangerous queries) usually cause 80% of risk; closing that group first shows value fast and reduces legal/data risk immediately.`,
    follow: [
      'The founder gives you repo access only, no cloud/log access. What can you audit, and what is the minimum access you need to assess operational risk?',
      'You find three issues: secret leak (high), slow page (medium), ugly UI (low). How do you prioritize and explain to the founder?',
      'When should you decline a job because the app is beyond your safe competence?'
    ]
  },
  'remote-061': {
    q: 'When reviewing a web app coded by AI (e.g. Node.js/Express API or similar), what common security issues appear? How do you explain them to a founder and propose safe ways to check and fix them?',
    a: `**Summary:** AI-coded apps often "work for the happy path" but skip security: **secrets leaked** in code, **missing authentication/authorization** in the right places, **IDOR** (accessing another user's data by changing an ID), and **injection** (inserting malicious data into commands). You do not need to guess — check against a checklist, reproduce safely in a test environment, and propose fixes by principle: never trust client input, enforce authorization on the server, and manage secrets properly.

### 1. Key terms
- **Happy path** (happy path): the scenario where the user does everything as expected; AI often optimizes this part.
- **IDOR (Insecure Direct Object Reference)**: a flaw where the server fetches a resource by an ID sent by the client (e.g. {{/orders/123}}) without checking that the ID belongs to the logged-in user.
- **Injection** (injection): an attacker sends data carrying command meaning; if the server concatenates it into SQL/commands, the command may run unintended. (Classic example: SQL injection — injecting into a SQL statement.)
- **Authentication (AuthN)** / **Authorization (AuthZ)**: verifying identity / checking permissions. Must be done on the **server**; hiding a button in the UI is not security.

### 2. Four common issue groups and how to check them
| Group | Typical signs in AI-generated code | Safe check | Fix direction (principles) |
|---|---|---|---|
| Secret leak | API key/DB password in repo, {{.env}} committed, secret in logs | Search sensitive strings in repo/history; review deploy config | Move secrets to env vars/secret manager; **rotate** (change) leaked secrets; do not log secrets |
| Missing AuthN/AuthZ | Sensitive endpoints need no login; checks only in frontend | Call the API directly (bypassing UI) to see if access is possible | Protect every sensitive endpoint on the server; use consistent middleware/guard |
| IDOR | {{GET /users/:id}} or {{/invoices/:id}} returns data when the ID changes | With two test accounts, use A's token to request B's resource ID (in a test env) | Always check ownership: "does this resource belong to the current user/org?" |
| Injection/unsafe queries | Client input concatenated into queries/commands | Review code where input flows into DB/shell; use safe payloads on staging | Use parameterized queries/ORM binding, validate input, never concatenate commands |

~~~text
IDOR example (assumed, conceptual — not instructions to attack a real system):
- User A logs in, calls: GET /api/orders/1001 → returns A's order (OK).
- User A changes the ID: GET /api/orders/1002 → returns B's order (IDOR BUG) if the server does not check ownership.
Correct: the server takes userId from the session token and queries "order WHERE id=1002 AND owner_id=userId".
~~~

### 3. Why AI apps hit these issues
AI generates code from common patterns and often optimizes for "works fast". If the prompt does not emphasize security, it can produce CRUD (create/read/update/delete) endpoints that work but skip context-aware authorization. It may also embed sample/placeholder values into config. This is why an audit should assume "not safe" until verified.

### 4. Reporting to the founder (no panic, actionable)
~~~text
Structure for explaining one issue to a founder:
- What the problem is (one sentence, low jargon).
- If exploited, what is the impact (customer data leak, money loss, service lockout).
- Severity: High/Medium/Low and why.
- How to fix: specific steps + estimated time.
- Verification after fix: how to re-check (test case).
~~~

### 5. Common auditor mistakes
- **Testing exploits on production**: only test on staging/authorized test env, or do safe code review.
- **Ad-hoc spot fixes**: missing AuthZ is systemic; use shared middleware/authorization checks.
- **Forgetting to rotate leaked secrets**: deleting from code is not enough if the secret is in commit history or already exposed.

> Senior tip: For AI apps, look for repeating "dangerous shortcuts": ID-based endpoints without owner checks, concatenated queries, hard-coded secrets. Write a shared AuthZ/secret checklist applied to every sensitive endpoint — systematic fixes are cheaper and safer than fixing issues one by one.`,
    follow: [
      'How do you distinguish a mere "missing feature" from an IDOR security bug in the same endpoint?',
      'What short process would you propose so the founder team stops committing secrets (pre-commit, review, secret manager)?',
      'When do you recommend a deep penetration test instead of just a code audit?'
    ]
  },
  'remote-062': {
    q: 'An AI-coded app starts getting slow and cloud bills rise once real users arrive. Which common performance/cost causes do you check (database, external API calls, unreleased resources), and how do you prove them with data before proposing fixes?',
    a: `**Summary:** "Slow" and "expensive" in AI-generated apps usually come from the same few patterns: poor database queries (missing indexes, fetching too much data, N+1 — repeated queries per element), repeated external/AI calls without caching (temporarily storing results), and unbounded resources (no pagination, no timeout — maximum wait time). Even on a Node.js stack, the mindset is the same as Java backend: **measure → isolate → fix → re-measure**. Reporting with numbers (p95 latency — latency for 95% of requests, query counts, estimated cost) helps the founder decide.

### 1. Key terms
- **p95 latency (p95 latency)**: 95% of requests are at or below this value. E.g. p95 = 1.8 s means 5% of requests are worse than 1.8 s — users feel it.
- **N+1 query**: 1 query fetches a list (N items) then N additional queries fetch details per item. Total N+1 queries, slow when N is large.
- **Index (DB index)**: a structure helping the database find rows faster by an indexed column, like a book index. Missing an index on filtered/joined columns scans lots of data.
- **Cache** (cache): temporarily stores results so later requests need not recompute/re-call. Needs an expiry strategy (TTL) to avoid stale wrong data.
- **Timeout** (timeout): max wait for an external service response; without it requests hang and waste resources.

### 2. Audit checklist (prioritized by impact)
~~~text
A. Database
- Enable slow query log or use ORM/DB observability tools (on staging).
- Find which endpoints have high p95 → how many queries they run, whether filters use indexed columns.
- Check whether entire tables are returned (SELECT * without LIMIT) and whether pagination exists.

B. External / AI calls
- Does each request call external APIs repeatedly in loops? Is there caching?
- Are there infinite retries on errors? Are there timeouts?
- Estimate: calls/day × unit price ≈ cost (use publicly listed prices, label "estimate").

C. Resources & config
- Are request body/upload sizes limited?
- Do background jobs overlap and overload the DB?
~~~

### 3. Illustrative example (assumed, numbers show how to measure)
~~~text
Symptom: order list page takes 2–3 s with ~5,000 orders; DB bill rising.
Observation (staging, sample data): /orders runs 51 queries for 50 orders (1 + 50 → N+1).
Explanation to founder: "Each page load asks the database 51 times instead of 1–2."
Fix direction: combine queries (join/batch via ORM support) + add an index on commonly filtered columns.
Re-measure: p95 from 2.1s to 180ms; queries from 51 to 2 (assumed on the same dataset).
~~~

### 4. Symptom → likely cause
| Symptom | Likely cause | Evidence to collect |
|---|---|---|
| API slow as data grows | N+1, missing index, no pagination | queries/request, EXPLAIN/slow log, p95 |
| AI API bill 3x | Calling AI on every keystroke/refresh, no cache, oversized prompts | call count, request token/size (if available), frequency logs |
| Server out of memory/hanging | Loading unbounded data into RAM, no external timeouts | RAM/CPU metrics, response size, hanging requests |

### 5. Common mistakes
- **Blind optimization**: changing complex code before measuring; may miss the real bottleneck (bottleneck — the slowest point).
- **Promising a fixed % cost reduction**: cost depends on real traffic; say "estimate based on assumptions..." and re-measure.
- **Wrong caching**: caching per-user sensitive data or using ambiguous cache keys can leak data — verify carefully.

> Senior tip: Use the "measurement triangle": (1) latency (p95/p99), (2) DB/external calls per request, (3) estimated cost by traffic. These three numbers are enough to prioritize highest-ROI (benefit/cost) fixes and convince the founder with data, not feelings.`,
    follow: [
      'The founder says "cache everything for speed". How do you explain the risks of wrong caching (stale data, data leaks) and what to cache first?',
      'How do you estimate an API/AI bill growing from 100 to 10,000 users without inventing numbers?',
      'If you are not familiar with the JS ORM, how can you still isolate N+1?'
    ]
  },
  'remote-063': {
    q: 'Beyond security and speed, AI-coded apps often have data integrity (correct, consistent data) and architecture issues. How do you check schema/migrations, transactions, and error handling? Give an example of a "negative balance/duplicate order" bug and describe the fix.',
    a: `**Summary:** **Data integrity** (data integrity — data always follows business rules, no contradictions) is noticed only when it breaks: duplicate orders, negative balances, stuck states. AI-coded apps often lack DB constraints, misuse transactions (transaction — a group of operations "all succeed or all fail"), and handle errors superficially (swallowing errors, no safe retry). During audit, check schema/migrations (scripts that change DB structure), critical write flows, and **idempotency** (calling the same operation again does not produce duplicates).

### 1. Key terms
- **Schema** (DB schema): table/column/data type/relationship structure.
- **Migration** (DB migration): versioned scripts to create/modify schema over time (e.g. adding columns/indexes). A good migration runs safely repeatedly across environments.
- **Transaction** (transaction): a group of DB operations that must be **atomic** (atomic — either all succeed or all roll back). E.g. deducting stock and creating an order must happen together.
- **Idempotency** (idempotency): retrying the same request (due to network errors/retries) does not deduct money twice or create duplicate orders. Usually uses an idempotency key (unique request identifier).
- **Constraint** (constraint): a DB rule such as UNIQUE (no duplicates), NOT NULL (not empty), FOREIGN KEY (foreign key, valid reference).

### 2. Data/architecture audit checklist
~~~text
Schema & migrations:
- Do tables have clear primary keys? Are important columns NOT NULL/UNIQUE where appropriate?
- Are foreign keys/relationships consistent? (Or if FKs are not used, does code ensure consistency?)
- Can migrations run from an empty DB? Are there "manual" unversioned schema edits?

Critical write flows (money, orders, stock):
- Are related steps wrapped in a transaction?
- Is failure in the middle handled (rollback)?
- Is there a risk of duplicate records on retry? Is there an idempotency key/dedupe (anti-duplicate)?

Error handling:
- Are errors "swallowed" (caught then ignored), making the system think it succeeded?
- Do APIs return clear error codes so clients know whether to retry?
- Are logs sufficient in context (request id, user id — no secrets/sensitive data)?
~~~

### 3. Example "duplicate order/negative stock" bug (assumed) and fix
~~~text
Scenario: client clicks "Place order" but the network is flaky, app auto-retries → creates 2 identical orders.
Cause (pattern): order creation endpoint is not idempotent; no UNIQUE on the business key (e.g. client_order_id).

Fix (described for founder/dev):
1) Client sends an idempotency key (UUID) with each place-order click.
2) Server stores the key with a UNIQUE constraint (key, user). If the key already exists → return the old result, do not create a new order.
3) Wrap "check stock + deduct stock + create order" in a transaction; if deduction makes stock negative → roll back and report an error.
4) Add a test: calling create order twice with the same key → only one order is created.

Conceptual SQL illustration (not tied to any framework):
-- UNIQUE(client_order_key) prevents duplicate records by key
-- UPDATE inventory SET qty = qty - 1 WHERE sku = ? AND qty >= 1; (deduct only if enough stock)
~~~

### 4. Trade-offs when fixing
- Adding constraints/transactions may slightly slow some writes, but in exchange data stays correct — for money/order flows, **correctness usually matters more than speed**.
- Large schema refactors on production need safe migration plans (backup, dry run, rollback plan). For small founders, prioritize blocking duplicate/negative issues first.

### 5. Common mistakes
- Trusting "the ORM handles transactions": verify the actual transaction boundaries in code.
- Validating only on the frontend: clients can call APIs directly; critical rules must live on server/DB.
- Not testing retry/network-failure scenarios: this is where data integrity bugs often surface.

> Senior tip: Isolate 2–3 flows that "must not be wrong" (money, data ownership, stock/reservations) and audit them deeply: idempotency + transaction + DB constraints. A single well-placed UNIQUE constraint can prevent a whole class of data issues that AI code easily forgets.`,
    follow: [
      'When do you enforce a rule with a DB constraint instead of only checking in application code?',
      'How do you explain to a founder the difference between a "display bug" and a "data integrity bug" to prioritize budget?',
      'How do you write a stable test reproducing a duplicate-order bug caused by retry?'
    ]
  },
  'remote-064': {
    q: 'You want to win clients in the niche "rescuing AI-coded apps". How do you package, price, and scope the service to avoid taking on everything? Propose an Audit → Fix milestone structure and the questions to close before signing.',
    a: `**Summary:** This niche sells **risk reduction** (security, data, cost) to non-technical founders. Do not sell "I will fix everything". Package it as: (1) a **fixed-scope/time-boxed Audit** (fixed scope or limited hours) whose deliverable is a report + roadmap, then (2) **Fix by milestone** prioritizing high risks. Lock scope in writing: access rights, environment, done criteria, and what counts as a change request (work outside the agreement).

### 1. Key terms
- **Fixed-scope** (fixed scope): do exactly what is listed; extra work requires re-negotiation.
- **Time-box** (time box): cap total hours (e.g. 12-hour audit). When time runs out → report what was covered + propose next steps.
- **Milestone** (milestone): a chunk of work with a clear deliverable and acceptance criteria.
- **SOW (Statement of Work)**: a document describing the work/scope/deliverables/assumptions — can be a short attachment to a contract.

### 2. Suggested service packages (illustrative)
| Package | Goal | Deliverable | Pricing model (mechanism) |
|---|---|---|---|
| Quick audit (time-box 8–12h) | Know the main risks | Findings by severity, top 5 priorities, roadmap | Fixed fee by time-box (assumed) |
| Deep audit (1–2 weeks part-time) | Understand security/data/performance/cost | Detailed report, evidence, fix estimates by group | Fixed fee by agreed scope |
| Fix by milestone | Address prioritized risks | PR/changes + verification checklist + ops notes | Per milestone (fixed) or hourly with a cap, depending on clarity |

~~~text
Example milestone roadmap (assumed):
M1 — High risk (week 1): rotate leaked secrets, fix authorization checks on sensitive endpoints, block clearly dangerous queries.
  Acceptance: M1 checklist passes, no secrets in repo, basic authorization tests.
M2 — Data stability (week 2): transaction/idempotency for order flow, DB constraints, error logs with context.
  Acceptance: retry tests create no duplicate records, error flows roll back correctly.
M3 — Performance/cost (week 3): resolve N+1/index, pagination, reasonable timeouts/caching.
  Acceptance: p95/estimated cost improve on the agreed measurement scenario.
~~~

### 3. Scope-closing questions before signing (avoid taking on everything)
- How many users, what sensitive data (personal/payments)?
- What access will you have: repo, staging, logs, cloud console read access? (Write it down — missing access = audit limits.)
- Priority goal: security, cost reduction, or launch deadline? Deadline?
- Specific stack/framework, versions, third parties (payment, AI API)?
- Who decides fix priorities? Communication channel and response cadence?
- What does "done" mean? (report vs. production-running code — two different things.)

### 4. Protective terms (straight, professional)
~~~text
Sample scope note (Vietnamese or English, sent with the proposal):
- Audit is based on access and information the client provides during [X].
- Does not include deep penetration testing, compliance, or full rewrite, unless separately agreed.
- Any request outside the deliverable list is treated as a change request (new time/cost estimate).
- The client is responsible for backups and deploying changes to production (unless an operations contract states otherwise).
~~~

### 5. Common mistakes
- **One lump-sum "fix the app" quote**: AI apps hide debt; you will almost certainly lose time.
- **Not locking access rights**: half-done audit, then blamed.
- **Doing deep free audits**: give a short summary; detailed audit is a paid product.
- **Promising "absolute security"**: no one can promise that; promise a verification process and risk reduction by priority.

> Senior tip: Position yourself as "the one who maps risks and handles them by priority", not "the one who absorbs all AI-generated technical debt". The Audit → Fix milestone structure gets you paid fairly, lets founders control budget, and creates a retainer (long-term care) opportunity once the app stabilizes.`,
    follow: [
      'The founder wants "a cheap all-inclusive price, fix everything in 3 days". How do you respond and reset expectations?',
      'When do you switch from fixed milestones to a monthly retainer for this app?',
      'How do you present residual risk after completing the milestones?'
    ]
  },
  'remote-065': {
    q: 'After auditing an AI-coded app, you must present results to a non-technical founder. How do you write the report and talk so they understand the risk level, accept priorities, and neither panic nor ignore the issues?',
    a: `**Summary:** Founders need three answers: **(1) Is it dangerous? (2) What is the impact on money/customers/data? (3) What to do first, and roughly how much time/money?** A good report translates technical issues into business impact, prioritizes by **severity** (how bad if it happens) and **likelihood** (how likely given current exposure), with evidence and clear next steps. Avoid both extremes: over-scaring ("down tomorrow") or vagueness ("a few small issues").

### 1. Key terms
- **Severity** (severity): how bad the consequence is if the issue occurs/is exploited.
- **Likelihood** (likelihood): in the current context, how likely it is (e.g. public endpoint + no auth = high chance of being probed).
- **Stakeholder** (stakeholder): the decision/budget owner — in small startups usually the founder.
- **Plain language** (plain language): explained so a non-programmer still understands.

### 2. One-page report + appendix structure
~~~text
1) Executive summary (5–8 lines)
   - Overall status: "App works for the main flow but has high risk in [data security/cost] that should be handled before scaling users."
   - Top 3 things to do now.

2) Findings table
   ID | Issue (short) | Impact (money/data/reputation) | Severity | Proposed action | Estimate

3) Milestone plan
   M1 (now): ...  M2 (next week): ...  M3 (later): ...

4) Assumptions & limits
   - "Audit based on repo + staging over 10 hours; no deep penetration testing."
   - "Estimates are ranges and may change with scope."

5) Appendix (for technical readers)
   - File/endpoint locations, safe reproduction steps, logs/screenshots with sensitive data redacted.
~~~

### 3. Translating technical into founder language
| Technical phrasing (confusing) | Impact phrasing |
|---|---|
| "Missing authorization check on the endpoint." | "Currently user A can view user B's data by guessing an ID — risk of customer data leak." |
| "N+1 query in the ORM." | "The page is slow because the app queries the database dozens of times per load; with more users it will slow clearly and cost more resources." |
| "Hard-coded secret in repo." | "A service access key sits in source code; if leaked it could cause costs or unauthorized access — rotate the key now." |

### 4. A 20-minute meeting script
1. **2 min**: audit goal and scope covered.
2. **8 min**: top 3 risks by impact, each with one concrete example.
3. **5 min**: priority milestones + estimates.
4. **5 min**: questions/decisions (approve M1 budget, grant access, choose timing).

~~~text
Sample opening line (Vietnamese or English):
"In short: the app works, but there are [N] issues to prioritize. The most important is [impact description],
because it could affect [customer data/cost]. I recommend handling it in [M1] first, estimated [hours/days],
then [M2/M3]. I will walk through each point and need you to decide on budget priority."
~~~

### 5. Common mistakes
- **Dumping 30 issues with equal weight**: founder freezes, does not know what to do first. Always have a "top 3–5".
- **Judgmental wording** ("AI code is dumb", "garbage code") — kills collaboration; focus on risk and fixes.
- **Not stating audit limits**: founder thinks you checked everything; state scope explicitly.
- **No next step**: report should end with a concrete decision (approve M1, grant access, pick timing).

> Senior tip: Treat the report as a decision tool, not a technical exam. If the founder understands "what to do first, why, and how much it costs", you succeeded — even if they choose to defer some items. Record that decision in writing to avoid later misunderstandings about residual risk.`,
    follow: [
      'The founder wants to skip a high-severity security issue to prioritize a feature launch next week. How do you respond and record the decision?',
      'How do you track fix progress after the audit to ensure issues are truly resolved, not just "marked done"?',
      'When there are both technical issues and process issues (no backups, no reviews), how do you present the process part?'
    ]
  },
  'remote-066': {
    q: 'After the audit, the founder asks: "Refactor gradually or rewrite the AI-coded app from scratch?" What criteria do you use to advise, and what handover/prevention plan (tests, CI, basic monitoring) do you set up so the problem does not recur?',
    a: `**Summary:** **Refactor** (gradually improve internal structure while keeping behavior) fits when the core business logic still works and risks can be isolated; **rewrite** (build again) should only be considered when the foundation is deeply broken (architecture/security/data) to the point that gradual fixes cost more and carry more risk. The decision must use measurable criteria: risk level, testability, required speed of change, and cost/opportunity. Whichever direction is chosen, hand over with "guardrails": automated tests, CI (continuous integration — automatically runs checks on changes), and basic monitoring.

### 1. Key terms
- **Refactor**: improve code structure without changing desired behavior; reduces technical debt step by step.
- **Rewrite**: rebuild most or all of it. High risk: losing implicit features, longer timelines, two systems in parallel.
- **Technical debt** (technical debt): future cost incurred by choosing quick solutions / skipping quality today.
- **CI (Continuous Integration)**: an automated process that builds/runs tests on commit/merge to catch errors early. (Specific tools: GitHub Actions, GitLab CI, etc., depending on the project.)
- **Observability/monitoring** (monitoring): collecting logs, metrics (numbers like errors/latency), and alerts to know system health.

### 2. Decision matrix (reference framework)
| Criterion | Leans toward gradual refactor | Leans toward considering rewrite (conditional) |
|---|---|---|
| Security/data risk | Can be patched systematically, clearly isolated | Pervasive foundational flaws, behavior hard to trust |
| Business understanding | Main flows are clear, must stay stable | Requirements fully change; old product no longer fits |
| Testability | Can add tests around critical flows | Behavior cannot be verified, but rewrite also needs clear spec |
| Time/market | Need to reduce risk fast, ship features steadily | Have time/budget and accept rewrite risk (rarely "faster") |
| Team | Small team, needs safe small changes | Enough capable team and a parallel/migration plan |

~~~text
Closing questions for the founder (assumed):
- What are the 3 most important flows generating revenue/holding data?
- Risk tolerance: how long can a disruption last if an incident occurs?
- Actual budget/time for the next 4–8 weeks?
- Is there documentation/spec of desired behavior? (Rewrite without spec = huge risk.)
~~~

### 3. Controlled gradual-fix plan (usually better for small startups)
1. **Stabilize (M1)**: patch high risks (secrets, auth, data integrity). No large architecture changes.
2. **Surround with tests**: add tests for 2–3 critical flows (specifying behavior) before deep refactoring — tests are the "safety net".
3. **Refactor by module**: separate clear boundaries (e.g. separate DB access layer, separate payment handling) one part at a time.
4. **Measure after each step**: p95, errors, cost; do not bundle huge changes at once.

### 4. Handover and prevention
~~~text
Minimum guardrails (regardless of stack):
- Automated tests: at least tests for money/login/critical data flows; runnable with one command.
- CI: every pull request/merge runs tests; do not merge when tests are red (team convention).
- Secret management: use env vars/secret manager; do not commit .env; have a rotation process.
- Basic monitoring: error logs with context, p95/error-rate metrics, alerts when thresholds exceeded.
- Short runbook: how to deploy/rollback, who to contact during incidents, release checklist.
~~~

### 5. Advisory example (assumed)
"The app has 2 high security issues and a few slow queries, but the order flow matches business logic. I recommend **gradual refactor**: first 2 weeks patch security/data integrity, add tests for the order flow, then optimize performance. A **full rewrite** now risks launch delay and missed features; consider rewriting only a specific module if that module cannot be verified."

### 6. Common mistakes
- **Rewriting because you "hate the code"**: feelings are not technical criteria; rewrite needs a real spec and budget.
- **Refactoring without milestones**: must attach milestones + acceptance criteria.
- **No tests/CI after fixing**: 3 months later new code/AI recreates the technical debt.

> Senior tip: For small products, the safest answer is usually "stabilize high risks now, refactor with priority, and only rewrite the part that truly cannot be saved — after tests and data exist". Help the founder optimize the **product's survival probability** (security, correct data, controlled cost), not architectural perfection.`,
    follow: [
      'What specific "stop refactoring, switch to rewriting one module" criteria (time/error thresholds) would you propose?',
      'How do you add tests to an AI-generated app that is hard to test (tight coupling) without a full rewrite?',
      'What documents/sessions do you hand over to the founder team so they can operate the app themselves?'
    ]
  }
});
