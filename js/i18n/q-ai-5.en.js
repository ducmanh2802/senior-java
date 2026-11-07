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

> Senior tip: in a bank, design the chatbot as a very smart receptionist: it answers product questions excellently, but anything involving money or identity must go through a controlled counter. Correct citations and the honesty to say "not found" matter more than a fluent, elegant answer.`,
    follow: [
      'Why should you not put a customer balance into the prompt even after authentication?',
      'How do you handle fee-schedule documents with different effective dates inside the same index?',
      'What must be passed along on handoff to a human agent so no context is lost?'
    ]
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

> Senior tip: track straight-through rate (the share of cases auto-approved) and the error rate on auto-approved cases separately. A good extraction system is not the one that automates the most, but the one that automates a lot while making very few mistakes — and that always leaves an exit ramp back to a human reviewer.`,
    follow: [
      'How do you set the confidence threshold to balance automation against risk?',
      'When OCR is wrong but the LLM guesses right, should the system auto-approve?',
      'How would you audit a field that was extracted wrongly six months earlier?'
    ]
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

> Senior tip: measure quality, not speed. A team that uses AI well has smaller PRs, better tests and fewer production bugs — not a team that commits more code. If lines of code go up while quality does not, AI is generating technical debt.`,
    follow: [
      'Why should you not use lines of code to measure the effectiveness of an AI assistant?',
      'How do you detect that AI-written code carries a license risk?',
      'Which tasks should you not hand to an AI coding assistant?'
    ]
  },
});
