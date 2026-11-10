/*
 * English translation of js/data/q-remote.js — task T993. Format: js/core/i18n.js (content overlay).
 * ids: remote-020 remote-021 remote-022 remote-023 remote-024
 */
App.i18n.content({
  'remote-020': {
    q: `You are applying for a remote Java backend role at a foreign company. The typical interview process includes a recruiter screen, a take-home assignment, live coding in English, a system design round, and a culture fit round. How do you prepare for each round, and how do you use a "think aloud" style when live coding?`,
    a: `**Summary:** A remote interview process usually tests 4 layers: **basic fit** (recruiter screen), **ability to work independently** (take-home — a take-home assignment), **thinking and communication under pressure** (live coding — coding while someone watches), **system thinking** (system design), and **how you work with others** (culture fit — alignment with the team's way of working). Prepare per round, practice explaining in English, and during live coding "think aloud" (say your thinking out loud — what you understand, which direction you are choosing, why) instead of coding in silence.

### 1. Why the process has multiple rounds
Each round measures something different and reduces hiring risk. For remote roles, the company especially cares: can you communicate clearly when you are not in the same room, can you manage your own work, and can you handle ambiguous problems. Understanding the goal of each round helps you prepare the right things, instead of studying broadly.

### 2. Overview of the rounds
| Round | What the hiring side wants to see | What you should prepare | Typical duration (reference) |
|---|---|---|---|
| Recruiter screen | Basic fit: experience, salary expectations, time zone, start date, English communication | 60–90 second pitch, CV summary, questions about the role/team, your desired salary/rate range | 15–30 minutes |
| Take-home | Code quality when you have time: structure, tests, README, problem solving | Do exactly what is asked, clean code, tests, clear README; do not over-engineer beyond scope | A few hours to a few days (depending on the task) |
| Live coding (in English) | Thinking, communication, handling hints, correctness under a time limit | Practice basic DSA in Java, practice thinking aloud in English, ask clarifying questions before coding | 45–60 minutes |
| System design | Design thinking: requirements, trade-offs, scale, reliability, data | Practice an answer framework (requirements → high-level → deep dive → bottleneck), use real examples you have worked on | 45–60 minutes |
| Culture fit / hiring manager | How you work: collaboration, handling conflict, feedback, ownership (a sense of responsibility) | STAR stories (Situation, Task, Action, Result) with numbers, questions about the team/process | 30–60 minutes |

Duration and order can differ between companies. Ask the recruiter: "Could you walk me through the interview stages and what each stage focuses on?"

### 3. Preparation per round (practical)
**Recruiter screen:** clearly state what you do with Java/Spring Boot, 1–2 measurable results, time zone overlap, and your desired range (if they ask). Do not ramble; be short, clear, and on-target for the job.
**Take-home:** read the requirements carefully, do exactly what is asked first. Example assumption: the task asks for a REST API to manage tasks — you should have clear endpoints, input validation, error handling, a few tests, and a README (how to run, assumptions). If you add Kafka/Kubernetes when the task does not ask for it, you may be seen as not following scope.
**Live coding:** before typing, restate the problem and ask about input/output/edge cases (edge cases — e.g. null, empty array). Choose a correct solution first, optimize later. Think aloud (see section 4).
**System design:** start from requirements (functional / non-functional — functional/non-functional such as latency, throughput — traffic volume, availability — uptime), do a rough estimate if appropriate, lay out the main components, then go deep on 1–2 hard points (data, cache, queue, consistency — consistency).
**Culture fit:** prepare 3–4 STAR stories: a time you fixed a hard bug/incident, a disagreement with a colleague, a time you improved performance/quality, and a time you were late on a plan and how you handled it.

### 4. "Think aloud" during live coding (ready-to-use phrases)
Thinking aloud helps the interviewer understand your reasoning even when you have not reached a final answer. Being silent for 3–5 minutes makes them unsure whether you are thinking or stuck.

~~~text
Think aloud phrases (English) by step:

1) Clarify the problem:
"Let me restate the problem to make sure I understand: given [input], we need to return [output]. Is that correct?"
"Can the input be empty or contain null values? What should I return in that case?"
"Are there constraints on size or time complexity I should consider?"

2) State an approach:
"My first idea is a brute-force approach: [explain]. That would be O(n^2) time and O(1) space."
"To optimize, I can use a HashMap to store [key -> value], which reduces lookup to O(1) on average."

3) While writing code:
"I will start by handling the edge cases, then iterate through the array..."
"I am choosing this variable name to represent [meaning], so the code stays readable."

4) When stuck:
"I am not fully sure about this part yet. Let me talk through two options: A) ..., B) .... I lean toward A because ..."
"Could I get a small hint about [specific part]? I want to make sure I am on the right track."

5) Review:
"Let me walk through an example input step by step: [trace]."
"I will also check edge cases: empty input, single element, duplicates / negative values."
~~~

### 5. Common mistakes
- Being silent during live coding: the interviewer cannot see your thinking and may rate you below your real ability.
- Jumping into code immediately: you did not ask about edge cases/constraints, and after coding you discover you misunderstood the problem.
- Over-engineering the take-home: adding large frameworks/structures that are not needed, README hard to run.
- System design full of buzzwords (trendy words like Kafka, microservice) not tied to requirements: you must explain why they are needed and what the trade-offs are.
- Culture fit with generic answers ("I am a team player"): use real examples with context and results.

### Checklist
- [ ] Ask the recruiter upfront: number of rounds, focus of each round, language/tools for live coding, whether lookup is allowed.
- [ ] Prepare a 60–90 second pitch + 3–4 STAR stories with numbers (bug/incident, conflict, improvement, missed deadline).
- [ ] Practice live coding in Java: think aloud, ask edge cases, explain complexity (Big-O — an estimate of how time/memory grow with input size).
- [ ] Take-home: follow the requirements, clean code, tests, README runnable in a few commands; review before submitting.
- [ ] System design: practice the framework requirements → high-level design → deep dive → bottleneck/trade-off.
- [ ] Prepare the remote environment: network, mic/headphones, camera, quiet place, IDE/editor ready.
- [ ] After each round, write down the questions you got and the answers you want to improve.

> Senior tip: in a remote round, "communication" is part of the test, not a side thing. A candidate who solves the problem but cannot say what they are thinking is riskier than a candidate who solves more slowly but clarifies assumptions, states trade-offs, and collaborates well when given hints. Practice thinking aloud like you practice code: record one self-practice session, listen back, and fix the places where you go silent or skip steps.`,
    follow: [
      'You get stuck in the middle of a live coding problem with 10 minutes left. How do you still show good thinking?',
      'The take-home asks you to "build a small service" but does not specify the level of completeness. How do you ask for clarification and choose the scope of what you submit?',
      'In the culture fit round, the interviewer asks about a time you disagreed with a tech lead. How do you answer in STAR without speaking badly of anyone?'
    ],
  },
  'remote-021': {
    q: `You are preparing your CV and LinkedIn to apply for a remote Java backend role at a foreign company. How does a CV/LinkedIn for the international market differ from a Vietnamese CV, and how do you write bullets (bullet points) based on measurable results? Give 3 examples of good/bad bullets.`,
    a: `**Summary:** A CV for the international market is usually short (1–2 pages), focused on **results and impact** (impact — measurable influence), and drops irrelevant personal information (photo, date of birth, marital status) to avoid bias. A strong bullet follows a pattern close to: **action + technology/context + measurable result**. LinkedIn must be consistent with the CV, with a clear headline naming your role, an easy-to-read About section, and evidence (projects, links, skills).

### 1. Why a "Vietnamese-style" CV is sometimes ineffective internationally
Many CVs list duties ("responsible for developing APIs", "participated in project X") without telling the reader what result you created. Recruiters/hiring managers abroad skim CVs very fast; they look for signs: what scale of problem did you solve, with which technology, and what was the measurable result. Photos and detailed personal info can create bias and are usually unnecessary in international hiring.

### 2. Main differences (comparison)
| Criterion | Vietnamese CV (common) | International-market CV (common) |
|---|---|---|
| Photo, date of birth, gender, marital status | Usually included | Usually **not** included |
| Length | Can be 2–4 pages, telling a lot | 1 page (junior/mid) or 2 pages (experienced), selective |
| Bullet content | Describes duties ("participated", "was responsible for") | Measurable result + how + context |
| Language | Vietnamese or bilingual depending on place | English (for international roles), clear, with action verbs (built, reduced, designed) |
| Long career objective | Sometimes a generic opening paragraph | Replaced by a 2–3 line Summary/Profile tied to the role |
| Certifications/skills | Long list | Only list what is relevant and that you can answer questions about |

Note: some countries/companies have specific requirements; always read the application instructions for that role. The general principle is: **relevant, honest, evidence-based**.

### 3. How to write bullets based on measurable results
Suggested formula: **[Strong verb] + [what you did] + [context/technology] + [measurable result]**.
- "Measurable result" can be: reduced latency, reduced errors, increased throughput, reduced processing time, reduced infrastructure cost, increased test pass rate, on-time delivery. If you have no absolute number, use a reasonable relative number but stay honest (e.g. "reduced response time by about 30%" — only if you measured or have a basis to estimate).
- If the work is sensitive, do not publish secret numbers; describe a well-founded qualitative improvement or use an allowed order of magnitude.

~~~text
3 GOOD / BAD bullet examples (Java backend, illustrative assumptions):

1) API performance
BAD:  "Responsible for improving API performance in the order system."
GOOD: "Reduced p95 latency of GET /orders from 1.8s to 120ms by fixing N+1 queries (Spring Data JPA fetch join)
       and adding a PostgreSQL index, verified with before/after metrics."

2) Reliability/data correctness
BAD:  "Worked on payment features using Spring Boot."
GOOD: "Implemented idempotency keys for the payment creation API (Spring Boot, PostgreSQL) to prevent duplicate
       charges on client retries; added integration tests covering retry and timeout scenarios."

3) Quality/delivery
BAD:  "Participated in team development and fixed bugs."
GOOD: "Cut production bug reopen rate by ~25% over 2 quarters by adding unit/integration tests for critical checkout
       flows and introducing a PR checklist for error handling and logging."
~~~

### 4. LinkedIn: points to optimize
- **Headline** (the line under your name): state role + expertise, e.g. "Java Backend Engineer | Spring Boot, PostgreSQL, REST APIs | Remote (UTC+7)".
- **About**: 3–6 lines — what problems you help solve, main experience, 1–2 achievements with numbers, what opportunities you are looking for (remote, time zone overlap).
- **Experience**: consistent with the CV's main points, but can be written more naturally; still prioritize results.
- **Skills/Featured**: choose relevant skills (Java, Spring Boot, SQL, Docker...); Featured can link GitHub, technical articles, case studies.
- **Profile picture/background**: clear face photo, professional (does not need a passport-style photo, but should be neat).

~~~text
About sample (LinkedIn, English, ~80–120 words):
Java Backend Engineer with 4 years of experience building REST APIs and data-intensive services using Spring Boot
and PostgreSQL. I focus on reliability and performance: for example, I reduced p95 latency on an orders API from
1.8s to 120ms by fixing N+1 queries and indexing. I enjoy working in remote teams, writing clear documentation, and
turning ambiguous requirements into small, testable deliverables. Based in Vietnam (UTC+7), open to remote roles with
APAC/EU overlap. Portfolio/GitHub: [link]
~~~

### 5. Common mistakes
- Putting everything in the CV: 4 pages listing all projects from 5 years ago → loses focus. Pick what is relevant to the job.
- Faking numbers: recruiter/interviewer will dig deeper; if you cannot explain, you lose credibility immediately.
- Vague words: "hard-working, passionate team player" with no evidence. Let the results speak.
- LinkedIn completely different from the CV (title, dates, technologies): raises suspicion. Keep them consistent.
- Sending a PDF with broken fonts/mixed Vietnamese characters: use PDF, common fonts, and check it opens on another machine.

### Checklist
- [ ] CV is 1–2 pages, no photo/date of birth/unnecessary personal info (unless the role requires it).
- [ ] Each role has 3–5 bullets in the direction action + context + measurable result (honest).
- [ ] Check English spelling/grammar; have someone else read it or use a checking tool.
- [ ] LinkedIn consistent with the CV: clear headline, short About tied to the remote role, Experience with results.
- [ ] Add evidence: GitHub/portfolio/case study (without company source code or confidential data).
- [ ] Name the file clearly: {{FirstName_LastName_Java_Backend_CV.pdf}}.
- [ ] Prepare to answer follow-up questions for every bullet you write (which step you did, how the number was measured).

> Senior tip: write your CV like a one-page "evidence", not a list of tasks done. Before each bullet, ask yourself: "If the interviewer asks 'where did this number come from, what was your contribution?', can I answer in 2 minutes?" If not, fix the bullet to be more truthful and specific. An honest CV with 3–4 clear results is usually stronger than a long CV full of vague duties.`,
    follow: [
      'You do not have exact numbers (the company did not measure, or the data is sensitive). How do you write a results bullet that is still honest and persuasive?',
      'A recruiter messages you on LinkedIn about a job that does not fit. How do you reply to keep the professional relationship?',
      'How do you organize GitHub/portfolio so a client or hiring manager can quickly see your Java backend ability in 5 minutes?'
    ],
  },
  'remote-022': {
    q: `In a remote interview for a foreign company, you are asked "What is your expected salary?" or must state your desired rate. How do you prepare and answer in English, when should you say a number first, and how do you negotiate without weakening your position?`,
    a: `**Summary:** The salary/rate question is an information negotiation: whoever says a number first can be "anchored" (anchoring — the first number influences the whole negotiation). A good strategy is to **prepare a price range based on research and your own needs**, respond flexibly to the context, ask back about the role's budget/level, and only commit to a number once you understand the scope. Negotiating in English should be clear, polite, based on value and data — not apologetic for having a reasonable expectation.

### 1. Why this is hard (especially for Vietnamese developers)
Many developers who are strong technically feel awkward talking about money: afraid of being rejected, afraid of "asking for too much". Also, answering in English under stress can make you reply hastily and give a low number to "be safe". But giving a number that is too low too early can anchor you below market value; giving an unfounded high number also causes problems. The goal is: **confident, evidence-based, flexible**.

Terms: **Expected salary/rate** — the salary or hourly rate you want; **Compensation range/budget** — the budget range the company has for the role; **Total compensation** — the full package (salary + bonus + benefits + leave + equipment, depending on the company); **Anchoring** — a psychological effect: the first number stated influences how later numbers are perceived.

### 2. Preparation before the interview
- **Research**: look at the range in the job post (if any), salary reports, market data, and community discussions. Understand the level for a Java backend role by level, market/region, and form (employee/contractor/EOR).
- **Calculate your "floor"**: the minimum you can accept (after considering taxes/costs/insurance/equipment/unbillable hours if contracting). Review the rate calculation in the questions about rates.
- **Prepare 3 levels**: floor (below this you do not accept), target (reasonable, evidence-based), and a high anchor (if you must say a number first). These are your internal numbers, not a script to read aloud.
- **Understand the role**: level, responsibilities, hours of overlap, on-call, technology — these affect value.

### 3. When to say a number first vs ask back
| Situation | Suggested handling |
|---|---|
| Recruiter asks very early (before understanding the role) | Politely ask back about the range/level and responsibilities; give a flexible range if required |
| Job post has a clear range | Answer within the range (or near it) and explain based on experience/fit |
| You must fill a mandatory form | Fill your target range/floor-target; if only one number is allowed, choose an evidence-based target |
| After you understand scope and have a good signal | Confidently give a target range, anchor with value/evidence |
| An offer is made but lower than expected | Negotiate based on market range, responsibilities, and the full package (not just salary) |

### 4. English phrases (ready to use)
~~~text
1) Ask back for the range before giving a number (polite):
"Could you share the salary range or budget for this role, and the level you are hiring for? I want to make sure my
expectations are aligned with the scope and responsibilities."

2) Give a flexible range (when you do not have enough information):
"Based on my experience with Java/Spring Boot backend development and the market for remote roles, I am targeting a
range of [X-Y] [USD/month or USD/hour], depending on the total compensation, responsibilities, and contract type.
Could you tell me more about the scope and the budget for this position?"

3) Answer when the job has a range:
"I saw the posted range of [A-B]. Given my [4] years of experience with [Spring Boot, PostgreSQL, performance tuning],
I would be comfortable around [upper half of range / specific number], depending on the full package and expectations."

4) Negotiate after an offer (based on value, not threats):
"Thank you for the offer. I am excited about the role and the team. Based on the responsibilities we discussed
(including [on-call/performance ownership/etc.]) and my experience delivering [specific result], would you be open to
[X]? If the base salary is fixed, could we discuss [signing bonus/equipment stipend/paid leave/contract terms]?"

5) If you need time to think:
"Thank you for sharing that. Could I take [a day/two days] to review the full details and get back to you with a
thoughtful response?"
~~~

### 5. Illustrative example (assumption, not a standard market rate)
Assume you are a 4-year Java contractor, your personal floor after accounting for costs/unbillable hours is 18 USD/hour, target 25 USD/hour. The recruiter asks early: you use sample (1) to ask the range. If they say "budget around 20–28 USD/hour", you reply: "Given my experience reducing API latency and building Spring Boot services, I am targeting around 25 USD/hour, depending on scope and weekly hours." You anchor near your target but stay flexible.

### 6. Common mistakes
- Saying "I will take any salary": shows you did not research and you may be paid too low.
- Giving a very low number out of fear of losing the opportunity: anchors the price down, hard to raise it later in the same process.
- Giving a high number without basis: if you cannot explain the value, you lose credibility.
- Talking only about base salary, ignoring the full package: for contractors, hours worked, unpaid leave, equipment, and transfer fees all affect net.
- Negotiating with an ultimatum when you have no alternative: keep a cooperative tone, based on data and value.

### Checklist
- [ ] Research the market range for the role/level/form (employee, contractor, EOR) before the interview.
- [ ] Calculate your personal floor (net needed) and set an evidence-based target range.
- [ ] Prepare 2–3 English phrases: ask for the range, give a flexible range, negotiate after an offer.
- [ ] When answering, tie the desired level to responsibilities and evidence (results you produced).
- [ ] Evaluate the full package: salary/rate, working hours, leave, insurance, equipment, taxes/admin (depending on form).
- [ ] Ask for time to think if needed; final agreements must be in writing.
- [ ] Do not fabricate "standard" company salary levels; use reference data and state that it is your expectation.

> Senior tip: the most effective salary negotiation is anchored on **value**, not emotion. Prepare 2 concrete examples (reducing latency, handling incidents, shipping features on time) and connect them to the role's responsibilities. Also keep your BATNA (Best Alternative To a Negotiated Agreement — your best option if negotiation fails) in mind: if you have alternatives or can keep looking, you will speak more calmly and clearly.`,
    follow: [
      'You gave an expected salary that was too low because you were nervous in the first round. In a later round with a good signal, how do you adjust it?',
      'The company says "the budget is fixed, salary is not negotiable". What else can you negotiate in the full package?',
      'For an hourly contractor contract, how do you convert between monthly salary expectation and hourly rate for a fair comparison?'
    ],
  },
  'remote-023': {
    q: `You work in a distributed remote team across time zones. How do you communicate asynchronously (async — no immediate reply needed, no real-time meeting) through daily updates, a design doc (design document), PR description (pull request description), and asking for help when blocked? Give good/bad English examples.`,
    a: `**Summary:** In a distributed team, effective asynchronous communication lets work move forward even when people are not online at the same time. The key is **writing clearly with enough context and a clear next action**: daily updates state done/doing/blocked; a design doc locks in the problem, approach, and trade-offs; a PR description explains why the change and how to verify it; when blocked (blocked — you cannot progress because you depend on someone/other information), state what you need, from whom, and the impact deadline. Good writing replaces many unnecessary meetings.

### 1. Why async matters in a remote team
When colleagues are 5–11 hours apart, waiting for them to come online to ask a small question can cost a whole day. Real-time meetings also cost (finding a common time, causing interruptions). Async communication (messages, documents, comments) lets the receiver reply when convenient, but it only works if you provide enough context for them to **answer once** without asking 5 follow-up questions.

Terms: **Async (asynchronous)** — sending information for others to process later, not requiring an immediate reply; **Sync (synchronous)** — real-time exchange like a meeting/huddle; **Blocked** — you cannot continue because of a missing decision, access, review, or information; **Handoff** (passing context) — handing work over with enough information for others to continue.

### 2. Daily update: short and valuable
Goal: the team knows progress, risks, and what you need. Not necessarily long, but clear.

~~~text
BAD example (vague):
"Yesterday: worked on backend. Today: continue working. Blockers: none."
(Problem: nobody knows which part you did, what risks exist, or whether you need help.)

GOOD example (specific, async-friendly):
Daily update - [Your Name] - 2026-11-07 (UTC+7)
- Done: Implemented idempotency key validation for POST /payments (PR #245). Added 3 integration tests.
- Today: Address PR review comments and start retry handling for timeout cases.
- Blocked/Risk: Need confirmation from @anna on the retry policy (3 vs 5 attempts). If no decision by 2026-11-08 10:00
  UTC, I will proceed with 3 attempts and document the assumption.
- Link: PR #245, ticket PAY-132
~~~

### 3. Design doc (design document) — align before coding a big change
A design doc helps the team give early feedback, avoiding coding for 2 weeks then being asked to change direction. It does not need to be perfect, but it must be clear about the problem and trade-offs.

~~~text
Minimal design doc structure (English):
Title: [Short feature/problem name]
Author / Date / Status: [Draft | In Review | Approved]
1) Context & Problem: What problem are we solving? Why now?
2) Goals / Non-goals: What is in scope? What is explicitly out of scope?
3) Proposed approach: High-level design (components, API/DB changes, flow).
4) Alternatives considered: Option A vs B, trade-offs (complexity, performance, consistency, cost).
5) Risks & mitigations: What can go wrong? How do we detect/handle it?
6) Rollout & verification: Migration steps, feature flag? metrics/logs to verify success.
7) Open questions: Decisions needed from whom, by when.
~~~

### 4. PR description (pull request description) — help the reviewer review quickly
The reviewer is also working async. A good PR description helps them understand "why" and "how to verify" without guessing.

~~~text
BAD example:
"Fix bug"
(Nobody knows which bug, where it has impact, whether it was tested.)

GOOD example:
Title: Fix duplicate payment charge on client retries (PAY-132)

Why:
Clients retry POST /payments on timeout, which can create duplicate charges because the endpoint was not idempotent.

What changed:
- Added idempotency-key header handling and storage (payments.idempotency_key, unique constraint).
- Return the original successful response when the same key is reused with the same payload.
- Added structured logs: payment_id, idempotency_key, outcome.

How to test:
- Unit/integration: PaymentServiceIdempotencyTest (retry same key -> 1 record; different payload -> 409).
- Manual (staging): send POST /payments twice with same Idempotency-Key, verify single charge record.

Risk / Rollout:
- DB migration adds a nullable unique column; backfill not required for old rows. Monitor 409 rate and duplicate-charge alerts.
~~~

### 5. Asking when blocked — provide enough context
Goal: the receiver can answer in one pass. Formula: **short context + what you already tried + what decision/information you need + your proposed option + deadline/impact**.

~~~text
BAD example:
"Hi, I am blocked. Can you help?"
(Nobody knows what you are blocked by.)

GOOD example (Slack/Teams, async):
Hi @anna, quick decision needed for PAY-132 (payment retries).
Context: I am implementing retry handling for POST /payments timeouts.
Tried/checked: current behavior creates duplicate records on retry; idempotency key fix is ready in PR #245.
Question: Should we retry 3 times or 5 times before returning a failure to the client?
Options: (A) 3 retries (lower load, faster failure) or (B) 5 retries (higher success chance under transient errors).
My suggestion: (A) 3 retries with exponential backoff, because payment provider latency spikes are usually short.
Impact: I can finish the retry logic today, but I need the decision by 2026-11-08 10:00 UTC to stay on track for
the sprint demo.
~~~

### 6. Using Slack/Teams effectively (principles)
- Write the first message with full context (do not just type "hi" and wait). One clear message = one round of exchange.
- Use threads so you do not clutter the main channel.
- @mention the person who needs to make the decision; do not @channel unless it is truly urgent/affecting the whole group.
- Respect time zones: if it is not urgent, send it so they read it at the start of their workday; write deadlines in UTC or state the time zone clearly.
- When the issue is complex, move to a short doc or propose a 15–30 minute meeting with an agenda.

### Checklist
- [ ] Daily update: Done / Today / Blocked-Risk / Link — specific and actionable.
- [ ] Design doc for big changes: problem, goals/non-goals, approach, trade-offs, risks, rollout, open questions.
- [ ] PR description: Why / What changed / How to test / Risk-Rollout; attach ticket/link.
- [ ] When blocked: state context, what you tried, what you need from whom, your proposal, deadline/impact.
- [ ] Write async messages with enough context the first time; use threads; respect time zones.
- [ ] When you must proceed before a decision is made, document the assumption and notify stakeholders.
- [ ] After an important decision, update the ticket/doc/PR so there is a "source of truth".

> Senior tip: in a distributed team, the person valued most is not the one who talks most in meetings, but the one who makes **intent and work status visible**. A clear PR description, a blocked update with a proposal, or a short design doc with trade-offs helps the whole team decide faster — even when you are asleep in another time zone. Treat every paragraph you write as a "handover package" for a future teammate.`,
    follow: [
      'You need an urgent decision but the only person with the authority is in another time zone and offline for 8 more hours. How do you handle it?',
      'Your PR gets conflicting feedback from two senior reviewers. How do you coordinate an async discussion to reach a decision?',
      'How do you write a design doc that is short enough for busy people to read, but clear enough to avoid misunderstanding during implementation?'
    ],
  },
  'remote-024': {
    q: `You are a Vietnamese Java developer working for the first time in an international team (remote). You face challenges like staying silent in meetings, saying "yes" when you do not understand, and being afraid to push back. How do you communicate clearly, contribute technically, and get recognized/promoted?`,
    a: `**Summary:** The big challenge for many Vietnamese developers in an international team is often not technical ability but **communication visibility**: if you stay silent, say "yes" when you do not understand, or never push back, the team will not see your value and project risk rises because of misunderstandings. The fix is to build clear communication habits (ask for clarification, summarize back, say "not sure" safely), contribute with technical evidence (docs, reviews, proposals with trade-offs), and make your impact visible honestly.

### 1. Why this affects both the project and your career
In a meeting, silence can be read as "agreement" or "no opinion". Saying "yes" when you do not understand leads to doing it wrong, delays, or rework — the cost is bigger than asking right away. Being afraid to push back lets risky technical decisions pass without anyone warning about them. For your career, in a remote/international environment people making promotion decisions usually rely on **observable impact**: what problems did you solve, how did you help the team decide better. If the impact is not visible, you get overlooked even if you work hard.

Terms: **Visibility** (being seen) — how much the team/manager sees your contribution; **Psychological safety** — the feeling that it is safe to ask questions or push back without being punished; **Pushback** (pushback) — raising a concern or proposing an alternative constructively.

### 2. Being silent in meetings: how to participate with preparation
Silence often comes from: fear of speaking English wrong, not enough time to translate in your head, or thinking your opinion is "obvious to everyone". Prepare to participate in small but consistent ways.
- **Before the meeting**: read the agenda, prepare 1–2 points you want to say or 1 question. If it is a technical topic you own, prepare a 30-second update.
- **During the meeting**: use short sentences with a purpose. You do not need to speak perfectly; you need to be clear.
- **After the meeting**: if you did not get a chance to speak, send a short comment/message: summarize your understanding + question or proposal.

~~~text
Meeting participation phrases (English, short):
- Opening/update: "Quick update from my side: I finished [X]. Today I am working on [Y]. I may need input on [Z]."
- Ask for clarification: "Before we decide, can I clarify [point]? I want to make sure I understood the requirement."
- Give an opinion: "One option is [A]. My concern is [risk]. If we choose [A], I suggest we also add [mitigation]."
- When you missed your chance: "I did not get a chance to add this in the meeting: [point]. My suggestion is [action]."
~~~

### 3. Saying "yes" when you do not understand: replace with safe responses
Saying "yes" to be polite is a natural reflex, but it is very dangerous in technical work. Use "safe" sentences — respectful and honest at the same time.

~~~text
Replace "Yes" (when you do not understand) with:
- "I think I understand the goal, but I want to confirm the details. Do you mean [paraphrase]?"
- "I am not fully sure yet. Let me restate it: [summary]. Is that correct?"
- "I understand [part A]. I am not clear about [part B]. Could you give an example?"
- "I need a bit of time to check the code/design. I will get back to you by [time/timezone] with a clear answer."
- "I do not know yet, but I can investigate and share my findings by [time]."  (honest, with a next action)

Avoid: nodding "yes" then guessing; avoiding silence because you fear revealing that you did not understand.
~~~

### 4. Being afraid to push back: constructive pushback based on data
Pushback is not personal argument. In a good technical team, pushback **protects decision quality**. Talk about the problem, risks, trade-offs, and evidence — not about people.

~~~text
Structure for constructive pushback (English):
1) Agree on the goal: "I agree that our goal is [faster delivery / lower latency / simpler API]."
2) State the specific concern: "My concern with [option] is [risk], because [reason/evidence]."
3) Propose an alternative/mitigation: "Could we consider [alternative], or keep [option] but add [test/metric/rollback]?"
4) Invite discussion: "How do you see this trade-off?"

Example (assumption):
"I agree we want to ship the feature this sprint. My concern with skipping idempotency on POST /payments is duplicate
charges when clients retry on timeout. Could we add an idempotency key now (small scope) and defer the advanced retry
dashboard? I can share a quick estimate."
~~~

### 5. Getting recognized and promoted (remote/international team)
- **Make impact visible**: clear progress updates, good PR descriptions, design notes, share results with numbers (e.g. "reduced p95 from 1.8s to 120ms"). Do not wait for others to notice.
- **Proactive ownership**: take a specific problem, follow it to the end, report risks early, propose solutions — do not just wait for tasks.
- **Help the team improve**: quality code reviews, documentation/runbooks, onboarding new members. This is lead behavior.
- **Receive feedback**: ask for feedback periodically from manager/peers ("What is one thing I could improve in communication or technical impact?"). Show that you use feedback to change.
- **Keep a personal "brag document"** (personal achievement log): each week write 3–5 lines of what you did, the impact, and evidence (PR/ticket/metric links). At performance review time you have data — not memory.

### 6. Common mistakes
- Assuming "if I code well, recognition will come automatically": in a remote environment, invisible contributions are easily overlooked.
- Pushing back late, after saying "yes": causes rework. Asking/proposing early is much cheaper.
- Apologizing too much when speaking English: reduces the weight of your message. Be polite without putting yourself down.
- Avoiding all conflict: false agreement leads to bad decisions. Respectful pushback is professional.
- Only stating problems, without proposing: raising a concern together with an alternative/mitigation is much better received.

### Checklist
- [ ] Before each meeting: read the agenda, prepare 1 update point or 1 question.
- [ ] In the meeting: make at least 1 valuable contribution (update, clarifying question, or evidence-based concern).
- [ ] Replace "yes" when you do not understand with paraphrasing or a clear time to answer.
- [ ] Push back using the structure: shared goal → specific concern → alternative/mitigation → invite discussion.
- [ ] Write clearly async: PR description, design note, blocked update — make impact easy to see.
- [ ] Keep a weekly "brag document" (what you did, impact, evidence links).
- [ ] Ask for feedback periodically and make 1–2 concrete improvements in communication/ownership.

> Senior tip: at senior/lead level, strong technical skills are necessary but not sufficient in an international team. What makes the difference is that you help the team **decide better and earlier**: ask the right questions, raise risks with evidence, write clearly so others can act, and take responsibility for the result. Practice English like a professional skill (like debugging or design): short, clear, structured sentences — you do not need to sound like a native speaker, you need to be understood correctly.`,
    follow: [
      'In a meeting, the tech lead proposes a direction you see as having serious risk but you fear negative judgment. How do you push back?',
      'You usually understand about 70% of an English meeting. How do you prepare before and handle during the meeting so you do not miss an important decision?',
      'Your manager asks you to self-assess your impact over the last 6 months. How do you use the "brag document" and numbers to present persuasively?'
    ],
  }
});
