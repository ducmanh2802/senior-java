/*
 * English translation of js/data/q-soft.js — task T739. Format: js/core/i18n.js (content overlay).
 * ids: behavioral-039 behavioral-040 behavioral-041 behavioral-042 behavioral-043 behavioral-044
 */
App.i18n.content({
  'behavioral-039': {
    q: `How do interviews differ across banks, fintech, big tech, Japanese outsourcing, EU/US outsourcing and startups? If you have four years of Java experience and little contact with Kafka, Kubernetes or AWS, which type of company is the right place to start?`,
    a: `**Summary:** These six company types interview differently in number of rounds, depth of algorithms, system architecture, English, behavioral questions (stories about situations that actually happened to you) and how long you wait for a result. No type is "best" for everybody — there is only the type that fits your level and your goal. This answer explains each type with tables, then shows how a Java dev with four years of experience and little hands-on Kafka/Kubernetes/AWS should choose.

### Terms you need first
- **Recruiter**: the person who sources candidates, screens CVs and makes the first call, but usually does not make technical decisions.
- **Hiring manager**: the person who will directly manage you if you are hired; they define the technical bar.
- **Salary range**: the band of pay the company is willing to offer for the role.
- **Gross/net**: pay before/after tax and insurance.
- **Outsourcing**: company A pays company B to deliver a project, like hiring a construction contractor instead of building the house yourself.
- **Product**: a company that builds and owns its own product.
- **Kafka**: a messaging layer that passes messages between systems, so a service does not have to wait for the other side to answer right away — like dropping a letter in a mailbox instead of making a phone call and waiting.
- **Startup**: a newly founded company with limited funding, still searching for a stable business model.

### The seven core differences
| Criterion | Bank | Fintech | Big tech | Japanese outsourcing | EU/US outsourcing | Startup |
|---|---|---|---|---|---|---|
| Rounds | 3–4 rounds | 3 rounds | 4–5 rounds | 1–2 rounds | 1–2 rounds | 1–2 rounds |
| Algorithms | light, Java core | easy–medium | medium–hard | light–medium | medium | light |
| System design | microservices, security | payments, high availability | large scale, performance | rare, focus on documentation | rare, focus on English | rare, shipping features fast |
| English | sometimes mandatory | checked in the HR round | mandatory in most rounds | fluency rarely required | required every day | depends |
| Response time | slow, 2–4 weeks | medium | medium | fast | fast | very fast |
| Stability | high | medium | high | medium | medium | low |

A four-year dev with little contact with new technology: **a bank** or **EU/US outsourcing** is the easier entry point, because they weigh Java core, Spring and SQL more deeply than new cloud technologies. Big tech and fintech demand algorithms and distributed architecture, which fits devs with five or more years better.

### Each type in brief
- **Bank**: online Java core/Spring test, an architecture interview (JVM, garbage collector, Spring beans, SOLID), a lead/block round, then HR. Some positions require an English certificate. Pros: stable salary, full insurance. Cons: slow process, many compliance rules.
- **Fintech** (MoMo, VNPay): Java, Spring Boot, Kafka, Redis. An HR call checks your English, then two engineers for the technical round, then the technical lead. Tip: drill easy–medium algorithms and say your optimisations out loud.
- **Big tech** (VNG, Shopee, Grab): online test, live coding, system design, a culture-fit round in English. Tip: practise LeetCode medium and system design in English.
- **Japanese outsourcing**: delivering projects for Japanese clients, the Hō-Ren-Sō process (report, contact, consult), detailed documentation, time zone two hours ahead of Vietnam. Pay is usually lower than product companies.
- **EU/US outsourcing**: working for European/US clients through a contractor (an intermediary company that signs the contract with the foreign client) or an EOR (employer of record — it runs payroll and insurance for employees in another country). Daily English, cross-timezone work, international payments.
- **Startup**: fast 1–2 rounds with the founder or lead, few algorithm questions, a lot about motivation. Pros: learn quickly, many roles. Cons: lower pay, uncertain bonus, the company can shut down.

### Choosing for yourself
Answer three questions honestly:
1. Do you want a stable salary and insurance, or to pick up new technology fast?
2. Is your English good enough for daily communication yet?
3. Would you accept a lower salary for a few months in exchange for ESOP (the right to buy company shares at a preferential price later)?

- "Stable, little new technology, medium English" → bank or EU/US outsourcing.
- "Learn payments, good English" → fintech.
- "Strong algorithms, system design, fluent English" → big tech.
- "Japanese process, time zone close to Vietnam" → Japanese outsourcing.
- "Fast, many roles, tolerant of risk" → startup.

Reviewers on voz shared that a 2025 Junior Backend offer at VNPay was 17 million gross per month (and was declined), and a 2023 Senior SSE at NAB was 80 million gross per month — these are individual numbers, unverified, useful only as reference points. Only the recruiter of each company knows the real range.

> Senior tip: when a recruiter asks "which type of company do you want", answer in terms of your goal, never "any type is fine". For example: "I'm looking for a place with a large payment system so I can go deep on idempotency and Kafka."`,
    follow: [
      'If you received offers from a bank and a startup on the same day, what would be the deciding factor for you?',
      'What level are you at now, and which type of company best fits that level today?',
      'How do you verify what the recruiter tells you about the process and the salary?'
    ]
  },
  'behavioral-040': {
    q: `You have fourteen days before the interview. How do you build a different revision plan for each type of company? Give a detailed day-by-day plan counted backwards from the interview date for one specific type.`,
    a: `**Summary:** Fourteen days is enough to prepare seriously if you **revise against the JD (job description) instead of spreading yourself over all of Java**. Two to three hours on normal days, five to six on weekends, and keep at least two mock interviews (simulated interviews) so you hear yourself speaking out loud instead of only reading silently. This answer gives the general principles, a table of adjustments per company type, then a detailed example plan for one type.

### General principles
1. **Day 1 — analyse the JD**: underline every skill, weight it 1–3 by how much the JD emphasises it, then rate your own level (1–5). High weight plus low score is where you spend the most hours.
2. **Days 2–11**: split the time evenly over the highest-priority topics, but every day still do 1–2 algorithm problems and the flashcards that come due (so your brain does not drop what you already revised).
3. **Days 7 and 11**: a mock interview — one hour technical plus 30 minutes behavioral — and write down the weak answers.
4. **Day 12**: research the company (product, engineering blog, recent news, who will interview you on LinkedIn).
5. **Day 13**: light review of your notes, prepare the questions you will ask back, check your equipment.
6. **Day 14**: rest, sleep enough. Lack of sleep clearly reduces working memory.

### The generic 14-day plan (template)
| Day | Main content | In parallel every day |
|---|---|---|
| 1 | JD analysis, gap list, pick the questions to revise | – |
| 2–6 | Highest-priority topics (by company type below) | 1–2 algorithm problems, due flashcards |
| 7 | **Mock 1**: 1 hour technical + 30 minutes behavioral | Write down weak answers |
| 8–9 | System design: 2 problems close to the company's domain | – |
| 10 | Write 6–8 STAR stories | – |
| 11 | **Mock 2**, focused on the weaknesses from mock 1 | – |
| 12 | Company research | – |
| 13 | Light review, questions to ask back, equipment check | – |
| 14 | Rest, sleep enough | – |

### Adjustments per company type
| Type | Highest-priority topics | How to revise |
|---|---|---|
| Bank | Java core, Spring, SQL, transactions (a group of operations that either all succeed or all fail together), incident stories | Re-read the projects on your CV, tell them as STAR, revise isolation levels (how separated concurrent transactions are) and indexes |
| Fintech | Kafka, Redis, idempotency, API security, payments | Write a small example that simulates sending a message, tell a story about handling a production failure |
| Big tech | medium algorithms, system design, basic CS (networking, operating systems, databases), English | LeetCode medium, draw architectures on paper, speak out loud in English |
| Japanese outsourcing | Java core, SQL, working process, documentation, basic Japanese if you have it | Prepare questions about the project process, read documentation carefully |
| EU/US outsourcing | conversational English, Spring Boot, SQL, remote work | Answer open questions in English, write your STAR stories in English |
| Startup | Java, SQL, simple design, wearing many hats, ESOP questions | Prepare questions for the founder, tell stories about flexibility |

### Detailed example: big tech (the hardest type; the plan also works for most others)
- **Day 1**: analyse the JD, pick the topics: algorithms, system design, Java core, basic CS.
- **Days 2–3**: Java core (collections, streams, threads, JVM garbage collector), one LeetCode easy per day, flashcards for behavioral questions.
- **Days 4–5**: SQL (joins, indexes, execution plans), 2 LeetCode medium, write the "production incident" story as STAR.
- **Day 6**: pure system design: draw an ordering service (load balancer, API server, database, cache — memory that keeps data for a while so it can be read back fast), explain it out loud.
- **Day 7**: **Mock 1**, technical + behavioral, write down the weaknesses.
- **Days 8–9**: 2 system design problems (for example a link shortener, a chat system), translate your walkthroughs into English if the interview is in English.
- **Day 10**: write 6–8 STAR stories (incident, disagreement, failure, hard project, leadership, improvement).
- **Day 11**: **Mock 2**, fixing the weaknesses from mock 1.
- **Day 12**: research the company, the product, the interviewers.
- **Day 13**: light review, questions to ask back, test mic/camera.
- **Day 14**: rest.

### Mock interviews and self-assessment
If you have nobody to mock with, **record yourself on your phone** answering each question, listen back and mark the places where you rambled, used odd wording, or stayed silent too long. An answer that sounds clear inside your head often comes out completely different when spoken — a mock is the only way to catch that early.

> Senior tip: do not skip behavioral prep because you think "being strong technically is enough". Many candidates are rejected at the state of "technical is fine, but I don't yet trust how this person works with others". The 14-day plan above has room for both; you only need to assign the right topics to the right days.`,
    follow: [
      'If you only had seven days, which parts of this plan would you cut?',
      'Where do you find someone to mock with, and what criteria do you ask them to grade you on?',
      'How do you balance interview revision with your current job without burning out?'
    ]
  },
  'behavioral-041': {
    q: `When a recruiter calls or messages you, what do you ask about the interview process, the salary range, and onsite/remote work? How do you tell whether a company is serious?`,
    a: `**Summary:** The recruiter is your connection to the company, and the first call is when you gather enough information to **make a decision**, not just to make an impression. Prepare five or six questions grouped by topic and write down the answers so you can compare processes later. This answer lists the questions by group, how to read between the lines to tell whether a company is serious, and a note-taking template.

### Who the recruiter and the hiring manager are
- A **recruiter** is the employee who finds candidates for the company: screening CVs, making the first call, scheduling rounds and negotiating pay. They usually do not decide technical outcomes, but they do decide whether you get into the next round.
- A **hiring manager** is the person who will directly manage you if you are hired, like your immediate team lead. They define the technical requirements and make the final call.

### Questions to ask the recruiter, by group
**Interview process**
1. "How many rounds are there, how long does each one last, and who will interview me (engineers, the lead, or HR)?"
2. "What is the content of each round (an online test, live coding, system design, or story-telling)?"
3. "How long is the usual turnaround after each round, and who will get back to me?"
4. "Is there a take-home assignment, and how much time is suggested for it?"

**Salary and benefits**
5. "What is the salary range for this role, how much is fixed gross pay (before tax), and how much is bonus or allowances?"
6. "Is there a 13th month (one extra month's salary at year end), a KPI bonus, and what salary level are insurance contributions calculated on?"
7. "How long is probation (the capability check before the official contract), and how is pay calculated during it?"

**Working arrangement**
8. "Is the work onsite (at the office), remote (from home), or hybrid (a mix of both)?"
9. "If remote, do you work across time zones, and what time zone do the meetings usually fall in?"
10. "Is overtime (OT) common, and is it paid or compensated with time off?"

**Technical**
11. "Is Java mandatory in the interview, or can I use the language I am strongest in?"
12. "What is the team's tech stack, and which part of the system would I work on?"

You do not need to ask all twelve in one call. Pick the three or four that matter most and ask the rest in a later round if needed.

### Reading between the lines: black and white
| Serious signs (green flag) | Risk signs (red flag) |
|---|---|
| A clear salary range, no dodging the question | Cannot say a number, answers "it depends on your ability" or "we will negotiate later" |
| A fixed interview schedule, rarely moved | Constant rescheduling, "waiting for approval" for weeks |
| A JD that clearly describes the work and the tech | An over-broad JD: backend, DevOps, data, "do everything" |
| Detailed answers, no pressure to accept quickly | Pushing you to sign an offer within 24 hours, wanting you to start before there is a written contract |
| Willing to introduce your interviewers and the team | Nobody can say clearly what this role does, or the position was just created |

One single sign does not prove the company has problems; several at once is a reason to ask more carefully and keep other processes running in parallel.

### Template for comparing processes
| Company | Role | Rounds | Round content | Salary range | Arrangement | Response time | Verdict |
|---|---|---|---|---|---|---|---|
| Company A | Java Backend | 4 | Test, coding, design, HR | 25–35 million gross/month | Hybrid | 3 days | Clear, few reschedules |
| Company B | Java Developer | 3 | Technical, lead, HR | Not stated | Onsite | 1 week | Rescheduled twice, vague JD |

Fill the table right after each call — while you still remember details that would be gone two days later.

### What to avoid
- Asking nothing at all and saying "I have not thought about it": a clear signal of no preparation.
- Bringing up salary as the very first question, before knowing anything about the job: ask after the recruiter has introduced the role.
- Inventing another offer to force the price: the Vietnamese IT market is small and salary information spreads fast.
- Trusting only verbal promises about pay and bonus: require them in the written offer.

> Senior tip: the best question, the one almost nobody asks, is "what technical decision has your team argued about recently, and how did it end?". It shows you whether the team has a culture of open disagreement, and it pushes the conversation well past small talk.`,
    follow: [
      'If you could ask the recruiter only one question, which one would you choose?',
      'Can you ask about salary without losing goodwill?',
      'What do you need to know about the team to judge whether you fit it?'
    ]
  },
  'behavioral-042': {
    q: `You have two offers from two different types of company (for example a bank and a startup, or outsourcing and big tech). How do you compare total income and the other conditions?`,
    a: `**Summary:** Comparing offers is not comparing one base salary number — you must compute total income over the year and look at everything attached: 13th month, bonus, ESOP, insurance, overtime (OT), learning opportunities. Two offers at the same 30 million per month can differ by hundreds of millions over one year.

### Total income — each component explained
- **Gross base salary**: the money before tax and insurance are deducted, paid every month.
- **13th month**: one extra month's salary at year end, usually pro-rated by months on the official contract (shares on voz in 2025–2026 report that some companies pay a 13th month, others a 14th–15th).
- **Bonus**: performance pay, **not guaranteed** — it can be zero if the company misses its targets. Model both the best case and the worst case (no bonus).
- **ESOP** (the right to buy shares at a preferential price): you get to buy company stock after working a period — for example four-year vesting with a one-year cliff, meaning you must stay a full year before the first portion unlocks. It only has real value if the company lists or gets acquired. Count it into first-year income only if you believe in the company and plan to stay long term.
- **Insurance**: what salary level BHXH/BHYT/BHTN (social, health and unemployment insurance) contributions are calculated on — some companies contribute on a low base salary, which cuts what you receive when you retire or get sick.
- **OT**: overtime that is paid, compensated with time off, or paid nothing at all. Regular unpaid overtime means your real income per hour is lower than the number on the offer.
- **Learning**: training, conferences, mentors — long-term value that is hard to convert into money.

### Side-by-side comparison of two offers
| Criterion | Offer A (bank) | Offer B (startup) |
|---|---|---|
| Gross base salary/month | | |
| 13th month (yes/no, conditions) | | |
| Bonus (guaranteed or not, rate) | | |
| ESOP (yes, vesting length, purchase price) | | |
| Insurance calculated on which salary | | |
| OT: paid/time off/none, frequency | | |
| Learning, new technology | | |
| Stability, how long the company has been running | | |

Fill in real numbers from the written offers, not from verbal promises.

### Worked example (assumed numbers, only to show the method)
Two offers, both 30 million gross per month:
- Offer A: 13th month guaranteed, bonus counted as 0, full insurance, paid OT. First year = 30 × 12 + 30 = 390 million, bonus excluded.
- Offer B: no 13th month, bonus counted as 0, ESOP not sellable so excluded, lots of unpaid OT. First year = 30 × 12 = 360 million.

Offer A is 30 million better in the first year; Offer B has ESOP potential later but carries higher risk. These are illustrative numbers, not the actual pay of any company.

### Risk per component
- Uncertain bonus: never put it into your rent or monthly loan payments.
- ESOP that cannot be cashed out: many startups grant ESOP but after three years there is still no liquidity event (the moment shares can be sold for cash), so the ESOP is equivalent to funny money.
- Unpaid OT: working ten extra hours a week for free quietly cuts your real income.
- Low insurance base: it hurts you in the long run, not immediately.

### How to decide
1. Build the comparison table with real numbers from the written offers.
2. Name your own priority: cash right now, stability, learning, or ESOP potential?
3. Set your walk-away number (the lowest salary you can accept) before the interview and write it down as a number.
4. If you need more time to wait for another offer, ask for an extension of the answer deadline (3–5 business days is usually accepted).
5. Once you have chosen, negotiate one round using the real offer, then decline the other politely and early.

Salary references: personal shares on voz in 2025–2026 (unverified): Junior Backend at VNPay 2025 — 17 million per month gross, Senior SSE at NAB 2023 — 80 million per month gross, Zalo SE with 3 years 2025 — 27 million per month gross. These are individual cases, useful as reference points rather than as the general market rate. Only the recruiter of each company knows the real range.

> Senior tip: set your walk-away number before the interview and write it down. With a number already in your head you negotiate more calmly and you know when to stop. People without a walk-away number usually accept worse than what they could have got, simply because they are afraid to say "no".`,
    follow: [
      'If company A pays a higher base salary but company B offers a generous ESOP, which do you choose?',
      'Do you count the bonus into first-year total income, and why?',
      'If you need to extend an offer deadline, what do you say to the recruiter?'
    ]
  },
  'behavioral-043': {
    q: `What is the difference between Japanese outsourcing and EU/US outsourcing? What should you look at in the contract, the foreign language, the time zone and the risks?`,
    a: `**Summary:** Both are arrangements where a company in Vietnam takes on projects for foreign clients, but Japanese outsourcing concentrates on process, documentation and patience, while EU/US outsourcing concentrates on conversational English and working across time zones. This answer explains each type, compares them in a table, and lists the risks to check before signing.

### What outsourcing is
Company A pays company B to deliver a project, like hiring a construction contractor instead of building the house yourself. You work for company B in Vietnam; company B holds the contract with the foreign client.

### Japanese outsourcing
- Contract: usually a Vietnamese labour contract, with probation and insurance. Read carefully the salary, the probation period, and the conditions for leaving.
- Japanese: many companies require at least basic reading comprehension of Japanese, or working through careful English. Ask the recruiter whether the company supports learning Japanese.
- Process: Hō-Ren-Sō (report, contact, consult). Report progress frequently, contact people as soon as a problem appears, consult before any important decision.
- Time zone: Japan is two hours ahead of Vietnam. You start at 8 a.m., it is already 10 a.m. there. Meetings usually sit in the early Vietnamese morning.
- Pros: clear process, detailed documentation, more stable than a startup, salary a few million higher than domestic outsourcing.
- Cons: pay lower than product companies and big tech, little freedom to choose the technology.
- Risks: incomplete insurance, a contract written in a language you do not understand, Japanese clients changing requirements constantly without compensating the time.

### EU/US outsourcing
- Arrangement: contractor (you sign with an intermediary company in Vietnam, and that company signs with the foreign client) or EOR (employer of record — a company that runs payroll and insurance for employees in another country). Contractors usually file their own personal income tax; under an EOR the insurance is handled for you.
- English: mandatory for daily work — writing email, video meetings, reading technical documentation. Weak English will cost you important information.
- Time zone: Europe is 5–6 hours behind Vietnam, the US 12–14 hours behind. You are finishing your afternoon while they are going to sleep; their morning meeting happens after you have gone home. Meetings often land on Friday evening or Saturday morning Vietnam time.
- Payment: salary converted into USD/EUR and sent through an international bank transfer, which can be late or shift with the exchange rate.
- Pros: converted pay can be higher than domestic outsourcing, and you train English and international working habits every day.
- Cons: cross-timezone fatigue, salary moves with the exchange rate, little direct interaction with the client's team.
- Risks: the client pays late, no written contract, unpaid trial work demanded.

### Comparison table
| Criterion | Japanese outsourcing | EU/US outsourcing |
|---|---|---|
| Language | basic Japanese or careful English | conversational English every day |
| Time zone | 2 hours ahead of Vietnam | Europe 5–6h behind, US 12–14h behind |
| Contract | Vietnamese labour contract, clear probation | contractor or EOR |
| Insurance | usually full | depends on the EOR; contractors file their own tax |
| Payment | Vietnamese dong | USD/EUR, international transfer |
| Process | Hō-Ren-Sō, detailed documentation | Agile, video meetings, fast written communication |

### Risks to check (both types)
1. No written contract: commitments on salary, bonus and promotion must be written into the contract; verbal promises do not count.
2. Probation that is too long: more than three months is rare — ask clearly how pay is calculated during probation.
3. Incomplete insurance: BHXH/BHYT/BHTN (social, health, unemployment) must be contributed in full as Vietnamese regulations require.
4. Unpaid trial work: do not take home a test larger than 2–3 hours unless it is stated in writing that it will be paid once you are hired.
5. The client pays late or cancels the project halfway: ask whether company B has a plan to move you onto another project.

> Senior tip: before signing, message an engineer who currently works at that company on LinkedIn and ask about the real salary, how payroll behaves, and how the company handles it when a foreign client drops a project. Information from insiders is far more accurate than what a recruiter tells you.`,
    follow: [
      'If a Japanese client requires working through careful English but your English is weak, how do you handle it?',
      'Do you choose contractor or EOR for EU/US outsourcing, and why?',
      'How can you tell whether an outsourcing company contributes full insurance?'
    ]
  },
  'behavioral-044': {
    q: `At a startup, how do you assess the learning opportunities and the risks? How should ESOP, overtime and the career path in a startup be understood?`,
    a: `**Summary:** A startup (a newly founded company with limited funding, still looking for a stable business model) offers fast learning — you take on many roles, sit close to decisions and see the whole product flow — but comes with unstable pay, few people to mentor you deeply, and a real chance of shutting down. This answer explains the opportunities, the risks, ESOP, OT, and what to ask when interviewing at a startup.

### Learning opportunities
- Many roles: one backend developer designs the API, writes the database queries and reads the system logs — like learning to cook while also managing the stockroom of a small restaurant.
- Close to decisions: you talk directly with the founder or the lead, you see why this technology was chosen over that one, instead of only receiving a ticket and closing it.
- You see the whole flow: from the product idea to running in production, so you understand the business domain more deeply than someone maintaining one small piece inside a large company.
- Fast: features ship in a few weeks, feedback comes immediately, you learn from mistakes quickly.

### Risks to know
- Unstable pay: early-stage startups often pay below market, bonuses are uncertain, and some months salary can even be late when money transfer is difficult.
- Few mentors: you may be the only backend engineer, with no senior reviewing your code or guiding you. Process mistakes (writing no tests, never backing up the database) are easy to pick up and hard to notice.
- No clear career path: the work changes constantly along with the founder's decisions.
- Shutdown risk: many startups do not survive their second year, which hits both salary and ESOP.

### ESOP: understanding and judging it
An ESOP is the right to buy company shares at a preferential price after working there for a period — like being allowed to buy a discount voucher once you meet the conditions.
- Vesting: the schedule over which you earn the right to buy shares gradually, for example four years.
- Cliff: the initial waiting period before the first portion unlocks, for example one year. Leaving before that year gets you nothing.
- Purchase price: the fixed price you are allowed to pay later, in the hope that the real value is higher.
- Liquidity event: the moment you can sell shares for cash, for example an IPO or an acquisition. Without such an event the ESOP is equivalent to funny money.

Count ESOP into first-year income only if you believe in the company and plan to stay long term; never count it into the money you use to pay rent each month.

### OT and working at a startup
OT means overtime. Startups usually work long hours because staff is thin and deadlines are dense. Ask: is OT paid, compensated with time off, or nothing at all? Regular unpaid overtime means your real income per hour is lower than the number on the offer. Work-life balance is rarely explicit in startups, especially while they are still searching for the product or right before facing investors.

### Comparison table
| Criterion | Startup | Big tech | Bank |
|---|---|---|---|
| Salary | low, uncertain | high, clear | stable, medium–high |
| Bonus/ESOP | ESOP with high potential, high risk | clear bonus, sometimes ESOP | 13th month, quarterly bonus |
| Learning | fast, many roles | deep, specialised | process, business domain |
| Stability | low | high | high |
| Mentors | few | many | medium |

### Questions to ask when interviewing at a startup
1. What funding stage is the company at, and are there investors behind it?
2. How is pay calculated during probation, and is there a 13th month?
3. What are the ESOP vesting and cliff terms, and when did the company last sell shares or list?
4. Is overtime common, and is it paid or compensated with time off?
5. Who reviews code and mentors me if I am the only backend engineer in the team?

### What to avoid
- Looking only at the big ESOP number and forgetting the shutdown risk.
- Accepting a very low salary with no agreed plan to raise it after 6–12 months.
- Not asking clearly about OT and ending up working many hours for free.
- Believing "you will be promoted fast" without any concrete milestone.

> Senior tip: if you choose a startup, pick one that has at least one strong technical senior to mentor you, and agree on your walk-away number (the lowest salary you can accept) in writing before signing. A startup fits when you want to learn fast in your first two to three years, not when you need stability right now.`,
    follow: [
      'Would you accept a lower salary for a few months to get ESOP, and in which case would you not?',
      'How much overtime is there at the startup, and how do you plan to reduce it?',
      'How can you tell whether a startup has enough funding to keep running for at least the next two years?'
    ]
  },
});
