/*
 * English translation of js/data/q-english.js — task T988. Format: js/core/i18n.js (content overlay).
 * ids: english-158 english-159 english-160 english-161
 */
App.i18n.content({
  'english-158': {
    q: 'How do you negotiate a rate increase with a long-term freelance client in a professional, low-drama way?',
    a: `**Summary:** Negotiating a **rate increase** (raising your hourly or per-project fee) with a long-term client must be based on **value and evidence**, not emotions or personal needs. Prepare: results delivered, expanded scope of responsibility, market rates, and the right timing. Make a clear proposal (new rate, effective date, scope it applies to), keep a collaborative tone, and prepare a backup plan if the client says no.

### Spoken sample (use right away)
"I have really valued working with you over the past year, and I would like to discuss my rate for upcoming work.

Over that time, my responsibilities have grown. In addition to backend development, I now handle release planning, production issue triage, and coordination with your other vendors. For example, in the last quarter I helped reduce checkout errors by improving retry handling and added monitoring that cut our response time to incidents.

Based on the current scope and market rates for this level of responsibility, I would like to adjust my rate from X to Y, starting from [date, usually 30 days notice]. This new rate would apply to new work and renewals after that date. Existing work already agreed at the current rate can stay the same, so there is no surprise.

I understand budget matters, so if needed we can also discuss options, such as keeping the current rate for a smaller scope or prioritizing the highest-value tasks. How does that sound to you?"

### Preparation before negotiation (step by step)
### 1) Gather evidence of value
- **What:** Measurable results (fewer errors, faster speed, time saved in operations), the scope of work you are doing, positive feedback.
- **Why needed:** "I need more money" is weak. "I now own X, delivered Y, reduced Z" is strong and easy for the client to accept.
- **Example:** "delivered 12 releases with no major rollback", "reduced API response time from 800 ms to 250 ms".

### 2) Choose the timing
- Good: before contract renewal, after completing a major milestone, when scope has clearly increased.
- Avoid: right after an incident you caused, or when the client is urgently cutting budget (you can still bring it up, but be sensitive).

### 3) Give a clear number and transition time
- **What:** From X to Y, effective from which date. Give **notice** (advance notice, usually 30 days) so the client has time.
- **Why needed:** Vague ("I want a higher rate") draws out negotiation. Clarity shows professionalism.

### 4) Prepare a backup plan (light BATNA)
- **BATNA** (Best Alternative To a Negotiated Agreement: best alternative if no agreement is reached) — you don't need to say this term, but you need to know your own limit.
- Collaborative option: reduce scope, reduce hours, prioritize high-value work, or keep the current rate for a smaller package.
- Personal limit: the lowest rate you accept (don't tell the client, but know it yourself).

### Do / Don't table
| Don't | Do |
|---|---|
| "Everything is more expensive now" (personal reasons only) | "My responsibilities and the value delivered have increased: [examples]." |
| Threaten: "Pay more or I leave" | "I would like to continue working together, and here is the rate that fits the current scope." |
| Sudden increase starting tomorrow | "I propose the new rate starting [30 days from now]." |
| Apologize for asking for a raise | Confident, calm: "I would like to discuss adjusting my rate." |

### Useful phrases
- **adjust my rate**: adjust my rate (softer than "increase my price")
- **based on scope and responsibilities**: based on scope and responsibilities
- **market rate**: market rate
- **effective from [date]**: effective from [date]
- **30 days notice**: 30 days advance notice
- **renewal / new scope**: renewal / new scope
- **I value our working relationship**: I value our working relationship

### Common mistakes by Vietnamese candidates
- **Afraid to talk about money:** Waiting for the client to offer — it usually won't happen. Negotiation is normal in business.
- **Sharing personal difficulties:** "My rent increased" — the client may sympathize but decides the budget based on value. Lead with value.
- **Issuing an ultimatum when heated:** Damages a long-term relationship. Keep a collaborative tone.
- **No transition time:** A sudden increase comes as a shock. 30 days is polite.
- **Word-for-word translation:** "I want you pay me more money" (rude, wrong). Say: "I would like to discuss adjusting my rate to reflect the current scope."

### Short spoken version (30-45 seconds)
"I have enjoyed working with you this past year. My responsibilities have grown to include [X, Y], and I delivered [result]. I would like to adjust my rate from X to Y starting [date, 30 days out], applied to new work after that date. I would like to keep working together - if budget is tight, we can also discuss adjusting scope. How does that sound?"

### Written version (email)
"Subject: Rate discussion for upcoming work. Hi [Name], I value our collaboration over the past [time]. As my scope has expanded to include [responsibilities] and I delivered [results], I would like to adjust my rate from [X] to [Y], effective [date, 30 days notice], for new work/renewals after that date. Existing agreed work can remain at the current rate. If helpful, I am open to discussing scope options to fit your budget. I would be glad to continue our work together. Best, [Your Name]"

> Senior tip: Don't wait until you're burned out to negotiate — then you're more likely to issue an ultimatum. Schedule regular rate reviews (e.g., every 6–12 months or at each renewal). For long-term clients, "apply to new work after [date]" prevents them from feeling blindsided and shows you respect the old agreement.`,
    follow: [
      'What would you do if the client says they cannot afford the new rate but wants to keep the same scope?',
      'How do you justify a rate increase when you do not have hard metrics like revenue impact?',
      'How would you respond if the client asks why you did not mention this earlier?'
    ]
  },
  'english-159': {
    q: 'At the end of a freelance contract, how do you ask for a review or testimonial? And how do you follow up politely when the client goes silent?',
    a: `**Summary:** Asking for a **review/testimonial** (a public comment about the quality of your work) works best right after a project ends well — you remind them of specific results, make it easy to write a review (suggest points they can mention), and give a direct link. When the client goes silent, **follow up** (remind) politely, briefly, a few days apart, and know when to stop to keep the relationship.

### Spoken sample (at handover / project end)
"Before we wrap up, I wanted to say I have enjoyed working with you on this project. We delivered [result], and I am glad we hit [milestone].

If you are happy with the work, would you be open to writing a short review? It really helps me as a freelancer. If it is easier, I can suggest a few points you could mention, such as communication, delivery quality, or how we handled [specific challenge]. There is no pressure at all - only if you feel comfortable."

### Review request sample (email/Slack)
"Subject: Thank you + a quick request. Hi [Name], thank you again for the opportunity to work on [project]. I am glad we delivered [specific result, e.g., the dashboard launch on time and reduced manual reporting]. If you were satisfied with the collaboration, would you mind leaving a short review here: [direct link]? If helpful, you could mention: (1) the problem we solved, (2) how communication/timelines went, (3) the outcome. Of course, only if you feel comfortable. Either way, I appreciate working with you. Best, [Your Name]"

### Follow-up sample when client is silent (first — 4-5 days later)
"Hi [Name], just a gentle follow-up on my note below. If you have a moment, a short review here would mean a lot: [link]. If now is not a good time, no worries at all. Thanks again for the collaboration."

### Follow-up sample (second — 7-10 days later, last one)
"Hi [Name], checking in one last time in case this got buried. If you are able to leave a short review, here is the link: [link]. If not, I completely understand - thank you again for working together. I would be happy to collaborate again in the future."

### Why asking for a review matters for freelance/remote
- **What:** A public testimonial reduces risk for new clients (they don't know you yet).
- **Why needed:** Remote clients don't meet you in person, so they rely heavily on reviews, portfolio, and how you communicate.
- **Real life:** Like restaurant reviews — newcomers feel safer when they see many people have used it.

### How to make it easy to get a review
- **Choose the timing:** Right after a successful handover, when the client has just seen the value.
- **Reduce effort for the client:** Send a direct link, suggest 2-3 points. The client is busy; the easier, the more likely they will do it.
- **Remind of specific results:** "delivered X, achieved Y" helps them remember and write more easily.
- **No pressure:** "Only if you feel comfortable" — respect their choice.

### Follow-up when silent: pace and limit
| # | Timing | Tone | Purpose |
|---|---|---|---|
| 1 | 4-5 days later | Gentle, "gentle follow-up" | The message may have been buried |
| 2 | 7-10 days later | "one last time", offer an exit | Final reminder, don't annoy |
| 3? | Don't | - | Too many times causes annoyance, harms the relationship |

- **Why the client is silent:** busy, forgot, not sure what to write, or not happy (rare if it ended well). Don't jump to negative conclusions.

### Useful phrases
- **testimonial / review / reference**: testimonial / review / reference
- **wrap up the project**: wrap up the project
- **If you feel comfortable**: if you feel comfortable (no pressure)
- **gentle follow-up**: gentle reminder
- **in case this got buried**: in case the message got buried (by too many messages)
- **no pressure / no worries at all**: no pressure / no worries at all
- **keep the door open**: keep the door open for future collaboration

### Common mistakes by Vietnamese candidates
- **Afraid to ask:** Afraid of rejection so you don't ask — missing a chance to build credibility. Asking politely is normal.
- **Asking too vaguely:** "Can you give me a review?" — the client doesn't know what to write. Suggest points and send a link.
- **Following up too heavily:** Messaging every day sounds demanding. Twice is enough.
- **Blame tone:** "I sent you the link last week but you did not reply." — damages the relationship. Assume they are busy: "in case this got buried."
- **Word-for-word translation:** "Please you give me good review" (wrong, sounds pushy). Say: "If you were satisfied with the work, would you mind leaving a short review?"

### Short spoken version (30-45 seconds)
"I have enjoyed working with you on this project. If you are happy with the results, would you be open to leaving a short review? I can send a direct link and a few suggested points to make it easy. No pressure at all."

### Shortest written version (follow-up)
"Hi [Name], gentle follow-up: if you have a moment, a short review here would mean a lot: [link]. If now is not a good time, no worries. Thanks again."

> Senior tip: Asking for a review is part of a professional project close, like handing over documentation. Ask while things are still "hot" — after 1-2 months the client forgets the details. If the client has private feedback (doesn't want to write publicly), respect that and ask permission to use it as a private reference instead of a public review.`,
    follow: [
      'What would you do if the client says they are happy but company policy does not allow public reviews?',
      'How do you ask for a testimonial without making it sound transactional?',
      'How should you respond if the client leaves a review that is positive but includes an inaccurate detail?'
    ]
  },
  'english-160': {
    q: 'How do you explain a technical decision (for example, choosing PostgreSQL instead of MongoDB) to a client\'s CTO in clear English?',
    a: `**Summary:** When explaining a technical decision (for example, choosing PostgreSQL instead of MongoDB) to a client's CTO (Chief Technology Officer: the person responsible for technology at a high level at the client company), you need to speak at the level of **trade-offs and business impact**, not get into implementation details. A good structure: context and requirements, options considered, reason for choosing, risks/cost to accept, and when you would choose differently. For the PostgreSQL vs MongoDB example: emphasize data model, transaction consistency, queries, and operational cost — tied to the client's real needs.

### Spoken sample (use right away)
"Thanks for asking about this decision. I recommended PostgreSQL for this system, and I want to explain the trade-offs clearly.

First, the context: your core data is highly structured — customers, orders, payments, and relationships between them. You also need reliable transactions. For example, when an order is created and inventory is updated, those changes must succeed or fail together. You need reporting queries, filters, and joins across these entities.

I considered MongoDB because it can be flexible when data shape changes often and when documents are mostly read as a whole. That can be useful for content, logs, or fast-changing prototypes.

I chose PostgreSQL because it fits your requirements better. PostgreSQL is a **relational database** (stores data in tables with rows and columns, linked to each other) with strong **ACID transactions** (a set of properties that make transactions reliable — integrity when writing, even if an error occurs). It handles joins and reporting well, and it also supports JSON fields if we need limited flexibility later. For a small team, it also reduces operational complexity because one mature system can cover most needs.

The trade-off is that schema changes require more planning. If your data model changes frequently, we need a clear migration process. Also, if you later need very high-volume document storage or horizontal scaling patterns specific to MongoDB, we should revisit the decision.

So my recommendation is PostgreSQL now, with clear schema migrations and indexes based on real query patterns. If requirements change significantly, we can re-evaluate with evidence rather than assumptions. Does this align with your priorities around consistency and reporting?"

### What PostgreSQL vs MongoDB are (tied to the decision)
### What the two technologies are (for a 4-year Java developer who hasn't touched much)
- **PostgreSQL** (often called Postgres): an open-source relational database. Data lives in **tables**. A table has a **schema** (defines which columns, data types, constraints) — like an Excel sheet with strict rules. Tables are linked by keys (foreign key).
- **MongoDB**: a document database. Data is usually stored as **documents** like JSON — each record can be more flexible in fields in some usage. Suitable for reading/writing a "cluster" of data as one document.
- **Real life:** Postgres is like accounting forms with standard templates (easy to cross-check, add and subtract accurately). MongoDB is like flexible folders (each file can come with different documents).

### How to choose: criteria
| Criteria | PostgreSQL usually strong when | MongoDB usually strong when |
|---|---|---|
| Data model | Clear relations: orders — customers — payments | Self-contained documents, structure changes often |
| Transactions | Need strong ACID, many tables at once | Some simple single-document write patterns (depends on design) |
| Queries | Joins, reporting, complex filters | Query by document / cluster of data |
| Consistency | Important (money, inventory) | Can accept other models depending on use case |
| Operations | One familiar system for many teams | Need to understand sharding/replica model in its own way |

**Technical note:** Both have evolved (Postgres has JSONB; MongoDB has multi-document transactions in many situations). The decision must be based on **real requirements** and the team's operational capability, not slogans.

### How to talk to a CTO (different from talking to a junior)
- CTO cares about: risk, long-term cost, team speed, hiring ability, operations, security, lock-in.
- Avoid: naming Java API/classes, arguing "which is cooler".
- Do: "Given your requirements around consistency, reporting, and team size, I recommend..." and state when you would change the decision.

### Useful phrases
- **trade-off**: trade-off (getting this, giving up/accepting that)
- **requirements and constraints**: requirements and constraints
- **operational complexity**: operational complexity
- **time to market**: time to market
- **revisit the decision with evidence**: revisit the decision based on evidence
- **align with priorities**: align with priorities
- **migration path**: migration path (if switching technology later)

### Common mistakes by Vietnamese candidates
- **Becoming a technology fanboy:** "MongoDB is bad" / "SQL is old" — sounds immature. The CTO wants a decision-maker with reasons.
- **Too much technical detail:** explaining B-tree, WAL, replica set from the start — not needed yet. Start from business impact.
- **No trade-off:** Only stating the strengths of your preferred choice. A lead-level decision always has a cost.
- **Not tied to the client's context:** A decision right for a log analytics startup may be wrong for an order/finance system.
- **Word-for-word translation:** "I choose Postgres because it is strong" — vague. Say what "strong" means: "strong transactional guarantees for payments and orders."

### Short spoken version (45-60 seconds)
"Given your structured data, reporting needs, and the importance of reliable transactions for orders and payments, I recommend PostgreSQL. I considered MongoDB for flexibility, but your current requirements fit a relational model better and keep operations simpler for a small team. The trade-off is that schema changes need planned migrations. If your data becomes highly document-based at large scale, we should revisit the decision with real evidence."

### Written version (email/Slack or short decision document)
"Subject: Database decision - [project]. Context: [data shape, transaction/reporting needs]. Options considered: PostgreSQL, MongoDB. Recommendation: PostgreSQL. Reasons: [fit with structured relations, ACID transactions, reporting/joins, team operations]. Trade-offs: [schema migration discipline, revisit triggers]. Decision review trigger: [e.g., document volume/scale or access pattern changes significantly]."

> Senior tip: With a CTO, the strongest line is usually "Here is when I would choose the other option." It shows you are not defending your ego but defending the decision that fits the context. If possible, propose an **ADR** (Architecture Decision Record: a short document recording context, decision, rationale, consequences) so the team later understands why it was chosen — avoiding repeat debates.`,
    follow: [
      'How would your recommendation change if the product was an event logging platform with very flexible fields?',
      'How do you explain the cost and operational impact of this decision, not just technical fit?',
      'What would you do if the CTO strongly prefers MongoDB because their team already knows it?'
    ]
  },
  'english-161': {
    q: 'How do you handle small talk at the start and end of a remote call, and what do you say when you cannot hear clearly because of accent or an unstable connection?',
    a: `**Summary:** **Small talk** (short social chat: a few friendly lines before/after a meeting, not the main content) helps build relationships in remote/freelance work, but it needs to be short, safe, and respectful of time. When you can't hear clearly because of **accent** (regional/local accent) or an unstable connection, ask for clarification politely, specifically, and without blaming — the goal is to understand correctly, not to show you hear well.

### Spoken sample — start of call
"Hi [Name], good morning. Can you hear me clearly? Great. How has your week been so far?" (short listen) "Glad to hear that. I know we have 30 minutes today, so shall we start with the project update?"

If they are busy or jump straight to business: "Sure, let us jump right in. Today I would like to cover [agenda]."

### Spoken sample — end of call
"That covers everything I wanted to discuss. Just to confirm the next steps: I will send the summary today, and you will review it by Thursday. Is there anything else you would like to cover before we finish?" (pause to listen) "Thanks again for your time. Have a great rest of your day."

### Samples for handling when you can't hear clearly (accent or connection)
- Unstable connection: "Sorry, your audio cut out for a moment. Could you please repeat the last part after 'the deadline'?"
- Didn't catch a word/sentence: "I want to make sure I understood you correctly. Did you say we should postpone the release to next Tuesday?"
- Speaking too fast / hard to hear: "Could you please say that a little more slowly? I want to make sure I get the details right."
- Still not clear after 2 times: "Would you mind typing that key point in the chat? I want to confirm the number/date correctly." (ask them to type numbers, dates, names into chat)
- Need to summarize: "Let me repeat what I heard: [your paraphrase]. Is that correct?"

### Small talk: what, why, boundaries
- **What:** 1-2 greeting lines, light small talk (weather, weekend, meeting schedule — depends on culture), then move to the call's goal.
- **Why needed:** For remote, you don't have hallway interaction. Short small talk creates a sense of collaboration, reduces tension — especially with new clients.
- **Safe boundaries:** work, project, shared schedule, weather. Avoid sensitive topics: politics, religion, personal health, personal money, age, private family — unless the client voluntarily shares at a level they are comfortable with.
- **Common mistakes:** Small talk too long wastes time; or jumping straight to business too bluntly when the client is building a connection.

### Can't hear clearly: communication technique
- **What:** Ask to repeat / say again / slow down / write in chat.
- **Why needed:** Pretending to understand and doing the wrong requirement costs far more than asking again for 10 seconds. This is a professional skill, not a weakness.
- **Real life:** Like hearing a delivery address over a noisy phone — you ask them to repeat the house number, don't guess.
- **Tip:** Ask to repeat "the part after ..." (specific) instead of "Can you repeat everything?" (hard for the speaker). Repeat numbers, dates, names via paraphrase.

### Table: situation and what to say
| Situation | Avoid | Use instead |
|---|---|---|
| Lost audio | "Your internet is bad" (blaming) | "Your audio cut out for a moment. Could you repeat the last part?" |
| Hard-to-hear accent | "I cannot understand your accent" (rude) | "Could you please say that a little more slowly? I want to get the details right." |
| Unsure about number/date | Nodding and guessing | "Did you say Tuesday the 12th? Could you type the date in chat?" |
| Need to end | Hanging up abruptly | "Just to confirm next steps... Thanks for your time." |

### Useful phrases
- **Can you hear me clearly?**: can you hear me clearly?
- **Shall we jump right in?**: shall we jump right in? (when the client is busy)
- **Your audio cut out**: your audio cut out
- **Could you repeat the last part?**: could you repeat the last part?
- **I want to make sure I understood correctly**: I want to make sure I understood correctly
- **Would you mind typing that in the chat?**: would you mind typing that in the chat?
- **Just to confirm the next steps**: just to confirm the next steps
- **Thanks for your time / Have a great day**: thanks for your time / have a great day

### Common mistakes by Vietnamese candidates
- **Silence when you can't hear clearly:** Nodding "yes" out of shyness, then guessing wrong. Asking again is normal in international calls.
- **Blaming the accent:** "Your English is difficult" — very rude. Take responsibility for needing to hear clearly: "Could you say that a bit more slowly? I want to make sure I get it right."
- **Small talk too personal:** Asking about income, marriage, age. Keep it safe and light.
- **Abrupt ending:** "OK bye" before confirming next steps. Always summarize the next step.
- **Word-for-word translation:** "I no hear you" (wrong, rude). Say: "Sorry, I did not catch that."
- **Speaking too fast when worried:** When the connection lags or you are nervous, slow down — especially with names, numbers, dates, terms.

### Short spoken version (30-45 seconds)
"Hi [Name], can you hear me clearly? Great - I know we have 30 minutes, so let us start with [topic]." (If you can't hear clearly) "Sorry, the audio cut out. Could you repeat the last part, or type the date in chat? I want to make sure I get it right." (Ending) "Just to confirm next steps: I will do X by [date]. Thanks for your time."

### Written version (chat when audio is poor)
"Sorry - I am having trouble hearing the audio. Could you please type the key points here (especially dates/numbers)? I will confirm once I have them. Thanks."

> Senior tip: In a remote call with international clients, turn on the camera if appropriate for the meeting culture, follow the agenda, and confirm next steps both verbally and in writing after the call. When asking for a repeat, **be specific** about the part you need ("the number after 'budget'" / "the deadline you mentioned") — this respects their time and shows you are listening actively, not interrupting.`,
    follow: [
      'How do you politely interrupt when you need to clarify something without sounding rude?',
      'What small talk topics are usually safe with international clients, and which should you avoid?',
      'How would you handle a situation where the connection keeps failing and the call cannot continue?'
    ]
  },
});
