/*
 * English translation of js/data/q-english.js — task T798. Format: js/core/i18n.js (content overlay).
 * ids: english-138 english-139 english-140 english-141
 */
App.i18n.content({
  'english-138': {
    q: 'How would you explain your decision to use Terraform or Infrastructure as Code in an interview?',
    a: `**Summary (30-second spoken answer):** I explain that **Infrastructure as Code (IaC — infrastructure as code)** lets us define servers, networks, and cloud resources in version-controlled files, so changes are repeatable, reviewable, and auditable. I chose Terraform (or a similar tool) to reduce manual mistakes, keep environments consistent, and make provisioning faster and safer.

### Key terms (explained on first use)
- **Infrastructure** (infrastructure): the resources that run the system — servers, networks, load balancers, databases, access rights.
- **Provisioning** (provisioning): creating/configuring those resources (for example creating an RDS database or a load balancer).
- **IaC (Infrastructure as Code):** instead of clicking through a web console, you describe infrastructure in code files; the tool creates/updates resources to match the file. Like a blueprint that the machine builds from.
- **Declarative** (declarative): you describe the *desired state* ("I want 2 instances") instead of the steps to get there; the tool figures out how to reach that state.
- **Drift** (configuration drift): the real state on the cloud differs from the declared configuration (because someone edited it by hand). IaC helps detect and fix drift.

### How to explain (step by step)
1. **Problem:** "Manual setup in the console was slow and error-prone, and staging drifted from production."
2. **Decision:** "We defined infrastructure as code so every change went through pull requests, just like application code."
3. **How it works:** "Terraform reads declarative config, compares desired state with real state, and shows a plan before applying."
4. **Outcome:** "We could recreate environments reliably, review changes, and track history."

~~~seq
title: IaC change flow (simplified)
actors: Dev | VCS | CI | Cloud
Dev -> VCS: open pull request (IaC change)
VCS -> CI: run plan (preview changes)
CI --> Dev: show planned create/update/delete
Dev -> VCS: approve and merge
CI -> Cloud: apply approved plan
Cloud --> CI: resources match desired state
~~~

| Aspect | Manual (console) | IaC (Terraform-style) |
|---|---|---|
| Repeatability | Hard to reproduce exactly | Recreate from code |
| Review | Little visibility | Pull request + plan diff |
| Consistency | Environments drift | Same modules across envs |
| Risk | Click mistakes | Bad config can apply at scale (needs review) |

### Pitfalls to mention
- Storing secrets in plain text in IaC files — use a secrets manager and avoid committing secrets.
- Applying without reviewing the plan — a small change can destroy/replace a database.
- State management: the state file must be stored safely (remote backend, locking) to avoid conflicts.

### Useful phrases
- "We treated infrastructure changes like code: versioned, reviewed, and tested."
- "The plan step showed exactly what would change before we applied it."
- "IaC reduced configuration drift between staging and production."

### Common mistakes (Vietnamese speakers)
- Saying "Terraform builds the server by hand faster" — unclear; say "automates provisioning".
- Confusing Terraform (a tool) with IaC (the practice) — you can say "we adopted IaC using Terraform".
- Overclaiming: do not say IaC eliminates all outages; say it reduces certain classes of human error.

> Senior tip: A strong answer balances benefits with **controls**: peer review of plans, least-privilege IAM for the pipeline, remote state with locking, and protecting critical resources (for example, prevent-destroy on databases). That shows you understand operational risk, not just tooling.`,
    follow: [
      'How do you manage Terraform state safely in a team?',
      'How would you structure modules for multiple environments like dev, staging, and prod?',
      'When might you choose an AWS-native tool over Terraform?'
    ]
  },
  'english-139': {
    q: 'How do you ask for clarification when you do not fully understand an interview question? Give polite, professional phrases.',
    a: `**Summary (30-second spoken answer):** I pause briefly, state what I understood, and ask a focused question to confirm the missing part. I keep my tone calm and collaborative. Clarifying early is better than solving the wrong problem, and interviewers usually see it as good communication.

### Key terms (explained on first use)
- **Clarify** (clarify): ask follow-up questions to understand a question/requirement correctly before answering.
- **Paraphrase** (paraphrase): restate what you understood in your own words to confirm: "So if I understand correctly..."
- **Constraint** (constraint): a condition of the problem (data size, allowed latency, whether external libraries are allowed). Asking about constraints shows practical thinking.

### Step-by-step approach
1. **Buy a few seconds:** "That is a good question. Let me make sure I understand it correctly."
2. **Paraphrase:** "So you are asking how I would handle X when Y happens — is that right?"
3. **Ask one focused question:** target the key unknown (scale, scope, input/output, priority).
4. **Confirm and proceed:** "Got it. In that case, I would start by..."

### Useful phrases (polite and natural)
- "Could you clarify what you mean by 'high traffic' in this context — for example, the expected requests per second?"
- "Just to confirm, are we focusing on the database layer or the whole request flow?"
- "Do you want me to walk through the design at a high level first, or go deep into one component?"
- "I want to make sure I answer the right question. Are we assuming the data fits in memory?"
- "If I understood correctly, the main concern is reliability during deployments. Is that accurate?"

| Situation | Phrase |
|---|---|
| Missed a word | "Sorry, I missed the last part. Could you say that again?" |
| Term unclear | "When you say 'eventual consistency', do you mean we accept a short delay before all reads see the update?" |
| Too broad | "There are a few angles here. Would you like me to focus on performance or on correctness?" |
| Need an example | "Could you give a quick example of the scenario you have in mind?" |

### Example in context
"Just to make sure I understand: you would like me to describe how I would debug a slow API in production, not in a local environment — is that right? And roughly how slow is 'slow', for example the p95 latency target?"

### Pitfalls
- Staying silent and guessing wrong — you waste time solving a different problem.
- Rapid-firing many questions at once — ask one or two, prioritized.
- Sounding defensive: avoid "Your question is confusing." Use "I want to make sure I understand correctly."

### Common mistakes (Vietnamese speakers)
- "What?" or "Say again?" can sound blunt; prefer "Could you repeat that, please?" or "Could you say that another way?"
- "Can you explain more more?" — say "Could you explain that a bit more?"
- Translating the phrase "can you repeat that please" too literally; in interviews use polite requests: "Would you mind repeating that?"

> Senior tip: Clarifying questions show **judgment**. Tie your question to a decision ("Is the input sorted? That changes whether I use a hash map or two pointers"). That turns clarification into a signal of strong problem-solving, not weakness.`,
    follow: [
      'What clarifying questions would you ask before designing a rate limiter?',
      'How do you clarify requirements with a non-technical stakeholder compared to an engineer?',
      'What do you do if the interviewer cannot give more detail?'
    ]
  },
  'english-140': {
    q: 'How do you admit you do not know something in an interview without losing credibility?',
    a: `**Summary (30-second spoken answer):** I answer honestly and calmly, state what I *do* know that is related, explain how I would find the answer, and, if appropriate, offer a reasonable assumption. Interviewers value honesty and problem-solving more than bluffing. A clear "I don't know, but here is how I would approach it" is much stronger than a confident wrong answer.

### Key terms (explained on first use)
- **Credibility** (credibility): how much the listener trusts that you are right and capable. Bluffing loses credibility faster than admitting you do not know.
- **Assumption** (assumption): something you temporarily treat as true to keep reasoning, but you state clearly that it is an assumption (because you lack solid data).
- **Trade-off** (trade-off): gaining one thing at the cost of another; when you do not remember details, you can still analyze trade-offs at the principle level.

### Step-by-step approach
1. **Be direct and calm:** admit the gap briefly — no long apology.
2. **Anchor to what you know:** relate it to a concept you understand.
3. **Show your method:** how you would investigate (docs, experiment, metrics, ask the team).
4. **Offer an assumption (optional):** "If I had to make an assumption, I would..." and state the risk.

### Useful phrases
- "I haven't used that specific feature in production, so I don't want to guess."
- "I'm not certain about the exact configuration, but my understanding of the underlying idea is..."
- "What I do know is X. To be sure about Y, I would check the official documentation and verify it with a small test."
- "If I had to make an assumption, I would assume..., but I would confirm that before making a decision."
- "That's a great question. I don't have hands-on experience with it yet, but here is how I would approach learning it."

### Example
"I haven't configured that exact AWS service myself, so I don't want to give you a wrong detail. What I do know is that the goal is to control access with least-privilege permissions. If I needed to set it up, I would start from the official AWS documentation, create a minimal policy in a test environment, and validate it before applying it to production."

### Pitfalls
- Bluffing or inventing specifics (names, numbers, flags) — experienced interviewers can tell, and it damages trust badly.
- Over-apologizing: "I'm so sorry, I'm terrible at this" — unnecessary and unprofessional.
- Stopping at "I don't know" with nothing else — add your reasoning or next step.

### Common mistakes (Vietnamese speakers)
- Very long apologies before answering — in English interviews, be brief: "I'm not sure, but..."
- Saying "I know it" when you only vaguely heard of it — be precise: "I've read about it, but I haven't used it hands-on."
- Using "I cannot" (sounds like refusal) when you mean "I don't know yet" — prefer "I'm not certain" or "I haven't worked with that directly".

> Senior tip: Seniors are trusted for **judgment under uncertainty**. Showing how you reduce uncertainty (docs, experiments, asking, safe assumptions) is a senior signal. Honesty about limits, paired with a clear method, often scores better than shallow confidence.`,
    follow: [
      'How would you find the answer quickly if this came up during a real production issue?',
      'Can you give an example of a time you were wrong and how you handled it?',
      'How do you balance confidence and humility when explaining a design?'
    ]
  },
  'english-141': {
    q: 'What questions would you ask the interviewer about their DevOps culture and team? Show curiosity that is professional and specific.',
    a: `**Summary (30-second spoken answer):** I ask specific, respectful questions about how the team builds, deploys, and operates software: release process, on-call, incident handling, ownership, and how developers and operations collaborate. Good questions show I care about reliability and teamwork, and they also help me judge whether the environment is healthy.

### Key terms (explained on first use)
- **DevOps culture**: how Dev (development) and Ops (operations) work together — sharing responsibility for keeping software running reliably, instead of blaming each other across team boundaries.
- **Ownership**: who is responsible for a service after it is deployed. In mature teams the team that writes the code also runs it — often summarized as "you build it, you run it."
- **Toil**: repetitive, manual operational work that has little long-term value (for example, restarting the same service by hand every week). Mature teams look for ways to automate toil.
- **Blameless postmortem**: an incident review that focuses on process and system causes, not on blaming individuals, so people feel safe reporting problems.

### Strong questions to ask (with why they matter)
| Question | What it reveals |
|---|---|
| "How often do you deploy to production, and what does a typical release look like?" | Release maturity, CI/CD reality |
| "How is on-call organized, and how often do engineers get paged?" | Sustainability, alert quality |
| "Can you walk me through how the team handled the last production incident?" | Incident process, blameless culture |
| "What does ownership look like — do teams operate the services they build?" | DevOps ownership vs handoff |
| "What are the biggest reliability or infrastructure challenges right now?" | Honesty, real problems, where you can help |
| "How much time does the team spend on toil versus improving automation?" | Engineering leverage, burnout risk |

### How to ask naturally
- "I'm curious about how the team operates day to day. How often do you deploy, and is the process mostly automated?"
- "What does on-call look like for this role, and is there a runbook culture?"
- "When something goes wrong in production, how does the team usually coordinate and follow up?"

### Pitfalls
- Only asking about perks, salary, or vacation in a technical round — save those for the appropriate stage.
- Aggressive or judgmental tone: "Why is your deployment so slow?" -> better "What are the main constraints in your release process today?"
- Generic questions you could ask any company ("What is the culture like?") — be specific to DevOps/operations.

### Common mistakes (Vietnamese speakers)
- Turning questions into statements: "I want to know your on-call" — ask a real question: "Could you tell me about your on-call rotation?"
- Forgetting polite framing: start with "Could you...", "Would you mind sharing...", "I'm curious about..."
- Asking too many questions at once — pick two or three that matter most and listen.

> Senior tip: The best closing questions are **specific and two-way**: they show you think about reliability and collaboration, and they give you real data to decide if you want the job. Listen carefully to the answers — vague replies about incidents or on-call can be a signal.`,
    follow: [
      'Which of these questions would you prioritize for a startup versus a large enterprise, and why?',
      'How would you react if they said engineers are paged very frequently?',
      'What question would you ask to understand how developers and the platform team work together?'
    ]
  }
});
