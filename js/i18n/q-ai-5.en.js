/*
 * English translation of js/data/q-ai.js — task T665. Format: js/core/i18n.js (content overlay).
 * ids: ai-030 ai-031 ai-032
 */
App.i18n.content({
  'ai-030': {
    q: 'A bank rolls out a customer-service chatbot built on an LLM + RAG over product documents: describe the overall architecture, when to hand the conversation over to a real human agent, and why the bot must never answer balance/transaction questions on its own before the customer is authenticated?',
    a: `**Summary:** this chatbot is a controlled document Q&A layer: product documents are indexed by version and by permission; every answer must carry citations; all personal/transaction data may only be fetched through a tool that already has a verified identity; when the bot is unsure, or the request is sensitive, it hands off to a human agent instead of making things up.

### Banking context
- Customers ask about: the 12-month savings interest rate, interbank transfer fees, the conditions for a mortgage.
- Source documents: fee schedules, product rules, FAQs, terms of use — they change by effective date and by customer segment.
- The biggest risk: the bot quotes the wrong fee schedule, or discloses/accesses account data on its own initiative.

### Architecture
1. Ingest: crawl the CMS/fee schedules, parse PDF/HTML, split into chunks by heading, attach metadata (product, version, effective date, customer segment, ACL — access control list, i.e. who is allowed to read this chunk).
2. Index: hybrid search (BM25 = classic keyword scoring, plus vector/semantic search) in OpenSearch or pgvector; keep the original document so a citation can point at real text.
3. Query service: authenticate the session, rewrite the question, retrieve the top 20 chunks then re-rank down to the top 5, filter by the customer's segment.
4. LLM service: a system prompt that forces the model to use only the CONTEXT block and to return JSON with answer, citations, confidence, needHandoff; the answer is streamed to the UI.
5. Tool layer: only tools that look up non-sensitive information, plus account-lookup tools that are gated on a strongly authenticated session.
6. Audit & feedback: log the trace ID, prompt version and retrieval scores; give every answer a "this is wrong" button.

### When to hand off to a human agent
- The customer wants to perform a transaction, complain, is in a dispute, or asks for something not covered by the documents.
- Low confidence, low retrieval score, or an answer supported by citations that contradict each other.
- The customer mentions sensitive keywords (lost card, fraud, death, inheritance).
- After N turns without resolving the issue.
- The handoff carries a summary of the conversation so the agent does not start over from zero.

### Why it must not answer balance/transaction questions before authentication
- A balance is high-sensitivity personal data; answering based on a weak session is a data leak.
- The model is not a security boundary: prompt injection (malicious instructions hidden in the text the model reads) can lure it into looking up account X.
- So: identity comes from the strongly authenticated session (OTP/biometric) and is passed through the ToolContext (server-side object handed to the tool), never as a parameter the model fills in; the tool only returns data belonging to the logged-in customer; every lookup is audited.
- When the customer is not authenticated: the bot only explains how to log in / how to verify identity, it does not look anything up.

### Production pitfalls
- The index mixes internal documents with public ones and has no permission filter, so internal policy text leaks into an answer.
- Citing the wrong fee-schedule version because the effective date was never attached as metadata.
- Handoff without context, which forces the customer to retell the whole story.
- Letting the model "know" a balance because it was put in the prompt, instead of calling a guarded tool.

### Flow of a question that requires authentication
~~~seq
title: Bank chatbot: a question that needs authentication
actors: Customer | Chatbot | Auth | CoreBank | LLM
Customer -> Chatbot: What is my account balance?
Chatbot -> Chatbot: Classify intent: personal data
Chatbot -> Auth: Check session: authentication level?
Auth --> Chatbot: Logged in, no OTP yet
Chatbot --> Customer: Request OTP verification
Customer -> Auth: Enter OTP
Auth --> Chatbot: Strong session, scope: balance:read
Chatbot -> CoreBank: Tool getBalance(customerId from session)
CoreBank --> Chatbot: Balance (not through the LLM)
Chatbot --> Customer: Show balance from a fixed template
~~~
The key point: **customerId is taken from the authenticated session**, never from the user's words nor from a parameter the model generated; the balance is rendered from a fixed template, and the LLM never needs to see the number. That way, even if prompt injection made the model "want" to look up someone else's account, the tool would still return only the data of the currently logged-in customer.

### Real-world example
In the first internal pilot week, measured over 2,000 questions: 7% of answers about fee schedules were wrong because the index contained both old and new fee schedules, and retrieval picked a chunk from an expired version. Fix: every chunk carries {{effectiveFrom}}/{{effectiveTo}}, queries always filter by the current date and the customer's segment, and expired documents are removed from the search index but kept for audit. The fee-schedule error rate dropped below 1%. A threshold was also set: if the top chunk's re-rank score is below 0.5, the bot answers "no accurate information found" and suggests a handoff to a human agent; the handoff rate is about 18%, acceptable for the business.

### Sample interview answer
"I split the chatbot into two parts with different trust levels. The product Q&A part uses RAG over versioned documents that carry an effective date and a customer segment; answers are mandatory with citations, and when retrieval is weak the bot says it did not find the information and hands off to a human agent. The personal-data part, such as balances and transactions, does not go through RAG but through a controlled tool: the session must be strongly authenticated, for example with an OTP, the tool takes the customer code from the session rather than from the user's words or a parameter the model generated, and the result is rendered from a template. The reason is that an LLM can be prompt-injected or confused; if the model were allowed to decide data access on its own, a single trick sentence could leak another person's information. I hand off to a human agent when the customer complains, requests a transaction, confidence is low, or the same issue repeats. Every session is audited: prompt version, chunks used, handoff decision."

> Senior tip: in a bank, design the chatbot like a very smart receptionist: it answers product questions excellently, but anything involving money or identity must go through a controlled counter. Correct citations and the honesty to say "not found" matter more than a fluent, elegant answer.`,
    follow: [
      'Why should you not put a customer balance into the prompt even after authentication?',
      'How do you handle fee-schedule documents with different effective dates inside the same index?',
      'What must be passed along on handoff to a human agent so no context is lost?'
    ],
  },
  'ai-031': {
    q: 'Extracting data from paperwork (eKYC, insurance claim files, invoices): how would you design OCR + LLM structured output, re-checking with rules, and human-in-the-loop?',
    a: `**Summary:** the pipeline is OCR to get text/tables, an LLM to extract into JSON following a schema, a rule engine to check logic and value ranges, and a confidence threshold that decides auto-approve or route to a human reviewer. The LLM is never the final source of truth; every important field must have evidence and a cross-check.

### Context
- eKYC: the front/back of the national ID card, a selfie photo, proof of residence.
- Insurance: the claim request form, hospital invoices, the accident report.
- Accounting: VAT invoices, payment/receipt vouchers.
- Goal: cut manual data entry and speed things up — but one wrong field (an amount, an ID number) can cause a large loss.

### Pipeline
1. Image pre-processing: rotate, deskew, boost contrast, crop regions. Image quality decides everything that follows.
2. OCR: pick the engine that fits the document types. Get text + coordinates (bbox = the bounding box of each word on the image) + a per-word confidence score.
3. Layout understanding: for tables/forms you must detect columns and rows; plain OCR usually flattens and loses that structure.
4. LLM structured extraction: send the OCR text plus the JSON schema, and require the model to return each value with its citation (the original text span or the bbox it came from).
5. Rule validation: check formats (regex for the ID number, for dates), value ranges, total amount = sum of line items, dates inside a valid window.
6. Confidence & routing: if every field passes its threshold and all rules pass, auto-approve; otherwise send to human review with a UI that highlights the suspicious fields.
7. Feedback loop: the reviewer's corrections are stored and used to improve the prompt/templates.

### Why LLM structured output
- OCR text is messy, and the LLM is good at understanding meaning and normalising it (turning "12/05/2024" into ISO format 2024-05-12).
- A strict schema (enum, regex, required) makes validation easy with Jackson + Bean Validation.
- Require the LLM to return "not found" instead of inventing a value when the field is missing from the document.

### Re-checking with rules
- Hard rules for the certain things: totals, tax ID of 10 or 13 digits, valid dates, a 12-digit national ID number.
- Cross-field: invoice issue date <= delivery date; total = subtotal + VAT.
- Compare with data already in the system: the customer code and contract number must actually exist.
- Rules are the last line of defence; do not trust the LLM even when it reports high confidence.

### Human-in-the-loop
- The UI shows the original image next to the extracted fields, with bbox highlighting so the reviewer sees exactly where a value came from.
- The reviewer only edits wrong fields, never re-types the whole document.
- Measure processing time per case to know whether the automation really saves money.
- Hard cases (blurry photo, an unfamiliar form) go into the golden set so the pipeline keeps improving on them.

### Production pitfalls
- OCR misreads one digit and the LLM "fixes" it into a different plausible number by context -> a silent error; you need OCR confidence plus rules to catch it.
- Low-quality photos from customer phones; guide the capture flow and validate the image before submitting it.
- A schema that is too large -> the model returns broken JSON; keep it small and split extraction into several steps.
- Not storing the original image/bbox -> impossible to audit later in a dispute.
- PII in OCR/LLM logs: mask it before shipping if your policy requires it.

### Why every field needs evidence
The LLM can over-normalise: faced with a blurry invoice it may fill in a plausible amount that is not actually in the image. That is why the schema requires each field to return both a **value** and a **source**: the original OCR text span or the bbox coordinates. The follow-up check then verifies that the normalised value can be derived from that source (for example "1.250.000đ" -> 1250000). If they do not match, or there is no source, the field is flagged as suspicious and routed to a human reviewer. This turns a "made-up" error into a **detectable** error.

~~~java
// Extracted result for one field: value + evidence + confidence
record Field<T>(T value, String sourceText, double ocrConfidence) {}

boolean needsReview(Field<java.math.BigDecimal> total, java.math.BigDecimal sumLines) {
    if (total.sourceText() == null) return true;                 // no evidence
    if (total.ocrConfidence() < 0.85) return true;               // OCR not confident
    return total.value().compareTo(sumLines) != 0;               // total differs from sum of lines
}
~~~

### Real-world example
A health-insurance claims system processes about 3,000 files a day. The first version auto-approved whenever the model reported "high confidence": a straight-through rate of 70%, but a sample check of 500 auto-approved files showed a 2.4% error rate on the amount — mostly because discounted lines on invoices were skipped. Fix: stop trusting the model's self-reported confidence; instead apply the rule **total = sum of lines - discount**, match each field against its source, and use per-word OCR confidence. The straight-through rate fell to 58%, but the error rate on auto-approved files fell to 0.3%; average processing time still dropped from 2 days to 4 hours.

### Sample interview answer
"I design a multi-layer pipeline and never let the LLM be the final source of truth. First, pre-process the image and run OCR to get text with coordinates and per-word confidence. Then the LLM extracts into a strict JSON schema, and every field must include the source text span. Next, a rule engine checks: ID-number format, valid dates, total equals the sum of lines, and the value must match the source span. Any field missing evidence, with low OCR confidence, or failing a rule goes to a human reviewer, with the UI highlighting the exact region on the image for fast review. I do not trust confidence reported by the model itself. The main metrics are straight-through rate and the error rate on auto-approved cases, measured through periodic sampling. Reviewer corrections are stored as evaluation data for the next prompt version."

> Senior tip: track straight-through rate (the share of cases auto-approved) and the error rate on auto-approved cases separately. A good extraction system is not the one that automates the most, but the one that automates a lot while making very few mistakes — and that always leaves an exit ramp back to a human reviewer.`,
    follow: [
      'How do you set the confidence threshold to balance automation against risk?',
      'When OCR is wrong but the LLM guesses right, should the system auto-approve?',
      'How would you audit a field that was extracted wrongly six months earlier?'
    ],
  },
  'ai-032': {
    q: 'AI-assisted programming in a large company (Copilot/Claude Code): how should you manage the source-code policy, reviewing code written by AI, measuring productivity, and the license/secret risks?',
    a: `**Summary:** an AI coding assistant is a productivity tool, not a programmer. The value comes from a clear data policy, reviewing the output like code from someone else, automated tests, and measuring effectiveness by quality/lead time — not by lines of code. The main risks are leaking secrets/data and code that looks right but is wrong.

### Source-code policy
- A list of approved tools and of the data you may send them (only code free of secrets and customer data).
- Prefer tools with a "do not train on my data" mode, or self-hosted/on-prem options.
- Never paste secrets, tokens, connection strings, personal data, or a client's code into an unapproved cloud tool.
- State clearly: code generated by AI still belongs to the company and must respect the project's license.
- Train developers on good prompting: provide context, pin the Java/Spring version constraints, ask the tool to explain itself.

### Reviewing AI-written code
1. Treat it like code from a contributor who does not know the system: review line by line, never rubber-stamp.
2. Tests are mandatory: unit tests for the logic, integration tests for DB/API; tests written by AI must be reviewed too.
3. Check every new dependency: origin, license, popularity, known vulnerabilities (slopsquatting = the model invents a package name that does not exist and an attacker registers it).
4. Run static analysis/SAST and dependency scanning exactly as for any other PR.
5. For changes touching security, money or data, require a more experienced reviewer to go deeper.
6. Note explicitly in the PR when the code was largely AI-generated.
7. Never merge code whose author cannot explain.

### Measuring productivity
- Measure PR lead time, post-release bug rate, review time — not just lines of code.
- Track the tasks AI genuinely helps with: boilerplate, test skeletons, small refactors.
- Compare before/after on the same kind of task; beware the Hawthorne effect (people change behaviour when they know they are measured).
- If AI increases the number of PRs but also increases bugs, that is a sign your review is too loose.

### License/secret risks
- License: a model can reproduce code from its training data that carries a copyleft license, which is a legal risk if you paste it in directly. Mitigation: do not ask it to "rewrite library X", review suspicious code, use a tool that offers indemnification if you need it.
- Secrets: a developer accidentally pastes a connection string/token into a prompt -> a leak. Mitigation: pre-commit secret scanning, a clear policy, tools that filter content.
- Fake dependencies: the model suggests a package that does not exist or has been taken over; always check the registry and the lock file.

### Using it effectively
- Break work into small pieces, state the request clearly, and include the relevant files and conventions.
- Ask for an explanation and for the tool to list its assumptions.
- Use AI to read unfamiliar code, to write test skeletons, for small refactors — not to design a large architecture on its own.
- Always run the code and the tests; do not assume it is correct.

### Common leak mechanisms
Leaks rarely happen because someone deliberately pastes a secret into chat. More often, an agent-style tool reads a file such as {{.env}}, {{application-local.yml}} or a log containing a token while gathering context, then sends that content to the provider's server. So the policy must be technical, not just on paper: file ignore rules for AI tools (most tools can exclude files/folders), secrets must not live in the repo (use a Secrets Manager/Vault), pre-commit and CI secret scanning (gitleaks, trufflehog), and only enterprise tiers with a clear commitment not to train on company data and a defined data-retention period.

### Real-world example
A company with 300 developers rolled out an AI assistant. In the first month, CI secret scanning caught 14 PRs containing real API keys — partly because AI-generated sample code copied a key from a local config file. Six PRs also added suspicious dependencies, one of them a package whose name was close to a popular library but was not the official one. Measures: block merge when gitleaks reports, an internal allowlist registry (a Maven proxy that only allows already-approved artifacts), exclusion rules for config directories, and a 30-minute training for the whole team. Three months later: only 1 PR per month with a secret (blocked in CI), no dependencies outside the allowlist. Productivity measured by PR lead time down 22%, post-release defect rate unchanged.

### Sample interview answer
"I manage it in three layers. The policy layer: a list of approved tools, enterprise tiers that do not train on company data, and clear rules about which data may not be sent. The technical layer, because a paper policy is not enough: secrets do not live in the repo, sensitive files are excluded from the tool's context, CI scans secrets and dependencies, an internal registry only allows approved artifacts to block fake packages, and license scanning runs. The process layer: AI-written code is reviewed like anyone else's, small PRs, tests present, and the author can explain it. On measuring productivity, I do not count lines of code or accepted suggestions because they are easy to game; I measure PR lead time, review time, post-release defect rate and developer surveys, compared over a long enough window, say a quarter."

> Senior tip: measure quality, not speed. A team that uses AI well has smaller PRs, better tests and fewer production bugs — not a team that commits more code. If lines of code go up while quality does not, AI is generating technical debt.`,
    follow: [
      'Why should you not use lines of code to measure the effectiveness of an AI assistant?',
      'How do you detect that AI-written code carries a license risk?',
      'Which tasks should you not hand to an AI coding assistant?'
    ],
  }
});
