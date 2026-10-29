/*
 * English translation of js/data/q-claude.js — task T396. Format: js/core/i18n.js (content overlay).
 * ids: claude-019 claude-020 claude-021 claude-022 claude-023 claude-024 claude-025
 */
App.i18n.content({
  'claude-019': {
    q: 'What is Agent Skills in Claude? In a large enterprise, how do you build and manage Skills (e.g., "write quality reports according to company standards," "review code based on internal guidelines")?',
    a: `**Summary:** A **Skill** is a **folder** containing a {{SKILL.md}} file (header with {{name}} and {{description}}, body with detailed instructions), potentially accompanied by scripts, templates, and reference materials. Claude only reads the **name and description** of every skill initially, then **loads the full content only when the task requires it**. This mechanism is called **progressive disclosure**: you can install many skills without consuming context.
    
### Quick Understanding
A Skill is like a "SOP + template" set on a shelf. A top-tier employee doesn't memorize the whole shelf, just reads the labels; when encountering a task like "write a quality report," they pull that specific book to read and follow, including using the accompanying Excel templates.

### Terminology
- **SKILL.md**: The main file of the skill; YAML frontmatter with {{name}} and {{description}}, body with instructions.
- **Progressive disclosure**: Loading information only when needed: name/description first, then SKILL.md, then auxiliary files.
- **Description**: The sentence that determines **when** Claude uses the skill. This is the most critical part for skill activation.

### Structure of a Skill
~~~text
quality-report/
  SKILL.md              <- name, description + step-by-step process
  templates/report.docx <- company standard report template
  scripts/defect_stats.py  <- defect rate calculation from CSV
  reference/glossary.md    <- internal quality terminology
~~~
~~~yaml
---
name: quality-report
description: Write product quality reports according to company QA standards. Use when the user requests quality reports, defect summaries by line, or weekly/monthly QA reports.
---
# Process
1. Read the defect data file (CSV) provided by the user; run scripts/defect_stats.py to calculate defect rates.
2. Fill in templates/report.docx according to the required sections...
~~~

### Building and Managing Skills in Enterprise, Step-by-Step
1. **Choose repetitive, standardized tasks**: periodic reports, guideline-based reviews, onboarding processes, standardized document drafting. This is where skills add the most value.
2. **Write a highly specific description**: clearly state "what to do" and "when to use," including keywords users often mention. A vague description will result in the skill never being called or called incorrectly.
3. **Keep SKILL.md concise, move details to auxiliary files**: leverage progressive disclosure; calculation scripts need accuracy (do it via code, don't let the model "guess").
4. **Manage like code**: git repo, review, versioning, ownership (QA department owns QA skills), changelog.
5. **Test with eval**: sample requests, checking if the skill is triggered and the output meets standards.
6. **Controlled distribution**: skills for the entire organization (admin-managed), project-specific skills (e.g., skills folder in Claude Code repo), personal skills.
7. **Security**: skills can contain executable scripts, so **only use skills from trusted sources**, review them like code, do not embed secrets in skills.

### Skills vs. Alternatives
| | Use when |
|---|---|
| System prompt / CLAUDE.md | Rules **always** applicable to every task in that context |
| Skill | Specialized processes, loaded only when needed, can include scripts/templates |
| Tool / MCP | Need **access to external systems** or actions (Jira, DB) |
| RAG | Lookup in **large knowledge bases** |

### Common Pitfalls
- **Vague description** ("support reports") → not triggered correctly.
- **Stuffing everything into SKILL.md** → loses progressive disclosure benefit, wastes context.
- **Skill without an owner** → company standards change, but skill teaches obsolete ones.
- **Using skills downloaded from the internet without review** → malicious script risk.

> Senior tip: start with **3–5 skills for the most time-consuming processes** of a pilot department, measure time-to-completion before and after. "QA report from 4 hours down to 30 minutes" convinces leadership more than any AI presentation.`,
    follow: ['When would you write a skill instead of an MCP server?', 'How do you control versioning and distribution of skills for 20,000 employees?']
  },
  'claude-020': {
    q: 'As an AI architect in a large enterprise, how do you design "flows" using Claude (fixed workflows and agents) and governance frameworks (security, data, cost, quality) for multi-department deployment?',
    a: `**Summary:** The principle is to **start as simple as possible**: a single API call, then **workflows** (logic-driven flows: chains, branching, parallel), using **agents** (model-driven tool calling) only when the problem is open-ended and errors are detectable/correctable. Surround this with **shared governance**:
- AI gateway (keys, quotas, logging, cost tracking by department);
- Role-based knowledge base;
- Library of approved skills, tools/MCPs;
- Eval suite;
- Data policy (deployment platform, data residency, storage).

### Quick Understanding
Workflow is like an assembly line: each station does one thing in a fixed order, easy to control. An agent is like a technician tasked with "repairing this machine": self-diagnosing, choosing tools, more flexible but less predictable. Good factories use assembly lines for repetitive work and only send technicians for unforeseen issues.

### Architecture
~~~text
               +---------------- Shared AI Platform ----------------+
Dept A ----▶| Gateway (SSO, quota/budget, logs, data policy)     |─▶ Claude
Dept B ----▶| Knowledge base + ACL | Approved Skills | Approved MCP |  (API / Bedrock /
Dept C ----▶| Eval & dashboard   | Audit log      | Feature flags      |    Vertex / Foundry)
               +--------------------------------------------------------+
~~~

### Governance Framework, Layers
1. **Platform & Data**: Choose deployment based on data policy (Claude API, Amazon Bedrock, Vertex AI, Microsoft Foundry). Define data residency, storage, and PII/secret scrubbing levels.
2. **Identity & Access**: SSO for apps; tools and agents run with **least privilege**; write actions need human approval.
3. **Shared AI Gateway**: Central point for keys, quotas, and budgets **by department/project** (separate workspaces), usage logs, and anti-abuse.
4. **Shared Catalog**: Permission-based knowledge base, library of skills, and MCP servers. Departments reuse, don't rebuild.
5. **Quality**: Eval suite for each flow with metrics (accuracy, human-fix rate, refusal rate); re-run on model/prompt changes.
6. **Safety**: Prompt injection defense (web/email content is not command-trusted), limit agent steps, audit everything.
7. **Operations**: Cost & quality dashboards by flow, feature flags for immediate kill-switches, incident management.

### Pitfalls in Production
- **Starting with "autonomous agent"** → hard to control, hard to debug, loses stakeholder trust.
- **Departments siloed buying/integrating** → duplication, data/cost leakage.
- **Agent with broad write access** (delete, send, deploy) without approval → prompt injection in email can cause disasters.
- **No measurement** → cannot prove ROI, project gets cut.

> Senior tip: success in large enterprises is not "number of AI users" but **number of work-hours saved on specific processes with clear owners**. Design every flow so that number is measurable from day one.`,
    follow: ['How do you defend against prompt injection for an email-reading agent?', 'When do you choose Bedrock/Vertex over direct Claude API?', 'How to prove platform ROI to leadership?']
  },
  'claude-021': {
    q: 'Explain the "agentic loop" when using tools with Claude Messages API. If you implement this loop in Java, what are the mandatory rules for message ordering?',
    a: `**Summary:** Claude **does not run** tools. When needed, it returns a response with {{stop_reason: "tool_use"}} containing one or more {{tool_use}} blocks ({{id}}, {{name}}, {{input}}). Your code runs the tool, sends back a {{role: "user"}} message containing {{tool_result}} blocks (matched by {{tool_use_id}}), then calls the API again. Repeat **as long as the stop_reason is tool_use**; stop when encountering {{end_turn}} or other reasons.

### Quick Understanding
Imagine Claude as an engineer in a sealed room, only communicating via paper notes. It writes "please check order #123" (tool_use), you check and slide the result through the slot (tool_result), it reads it and writes again. Each note is an API call. Because the API is **stateless**, each call must include the **entire** conversation history.

### Formatting Rules (Mandatory or 400 error)
- User messages containing tool_results must **stand immediately after** the assistant message containing the tool_use, no message can be inserted in between.
- Within that user message, {{tool_result}} blocks must come **first** in the content array; text (if any) goes **after** all tool_results.
- Every tool_use must have exactly one tool_result. Missing ones cause errors like "tool_use ids were found without tool_result blocks immediately after".
- There is no "tool" role: tool_use is in the assistant message, tool_result is in the user message.

### Agentic Loop in Java
~~~java
List<Msg> history = new ArrayList<>(List.of(Msg.user(question)));
for (int step = 0; step < MAX_STEPS; step++) {          // Always limit steps
    Response r = gateway.create(history, tools);
    history.add(Msg.assistant(r.content()));             // Must preserve all content blocks
    if (!"tool_use".equals(r.stopReason())) return r;    
    List<Block> results = new ArrayList<>();
    for (Block b : r.content()) {
        if (!b.isToolUse()) continue;
        results.add(toolExecutor.run(b));                // returns tool_result with tool_use_id
    }
    history.add(Msg.user(results));                      // ONE message for all results
}
~~~

### Common Pitfalls
- Reading only {{content[0].text}}: response can start with thinking or tool_use.
- Dropping text blocks ("Let me check...") to save tokens: breaks history integrity.
- Splitting each tool_result into separate user messages: invalid format and teaches model to stop calling tools in parallel.
- No step limit: a faulty tool loop can burn hundreds of calls.

> Senior tip: The official SDK has a **Tool Runner** that automates this loop. Write the loop **once** to understand the rules, then consider the Tool Runner or Agent SDK, keeping manual code only when you need granular control (manual approval, step-by-step auditing, tool-specific timeouts).`,
    follow: ['What do you display to the user if a response has both text and tool_use blocks?', 'How do you handle max_tokens stop_reason in the middle of a tool_use?', 'How does pause_turn differ from tool_use?']
  },
  'claude-022': {
    q: 'Your agent occasionally runs for a very long time, calls tools dozens of times, and costs skyrocket. How do you design stop conditions and limits (steps, tokens, time, cost) for the agentic loop?',
    a: `**Summary:** The loop only stops "naturally" upon {{end_turn}}, so you **always** need "fuses" in code: step limits, total token/cost limits, wall-clock time, and loop detection. Handle other stop reasons ({{max_tokens}}, {{pause_turn}}, {{refusal}}, {{model_context_window_exceeded}}) in dedicated branches, and stop **gracefully** (return partial results + reason) instead of throwing exceptions.

### Layers of Limits
| Layer | Implementation | On limit breach |
|---|---|---|
| Steps | {{MAX_STEPS}} based on task type (e.g., 8 for lookup, 40 for coding) | Stop, return status + suggest user continuation |
| Token/Cost | Accumulate {{usage}} each response, convert to cost | Stop before exceeding session budget |
| Time | Total session deadline + tool timeout | Cancel current tool, return error with guidance |
| Repetition | Hash ({{name}} + {{input}}) of recent calls | 2nd identical: return is_error + explanation; 3rd: stop |
| Output per turn | Reasonable {{max_tokens}} | stop_reason max_tokens: increase max_tokens + retry or error |

### Handling stop_reason in the Loop
- {{tool_use}}: run tool, send tool_result, loop.
- {{pause_turn}}: server-side tool loop (web search...) hit internal limit; send back conversation (including the response received) for the model to continue. Count this towards step limits too.
- {{max_tokens}}: output truncated. If the last block is a truncated tool_use, input is incomplete, **do not run it**; increase max_tokens and retry.
- {{refusal}}: Stop. Do not retry infinitely.
- {{model_context_window_exceeded}}: Context full; requires compaction or clearing old tool results.

### Pitfalls in Production
- Counting steps but forgetting one step can contain 10 parallel tool_calls: limit **total tool calls**.
- Throwing exception on limit: loses all progress. Store history and return partial results.
- Hardcoded limits for everything: coding agents need more steps than lookup chatbots; configure by route.

> Senior tip: log **step distribution** (p50/p95/max) for each task type from day one. Set MAX_STEPS at about 2–3 times p95, and alert when the session-hit-limit rate exceeds 1–2%: that is usually a sign a tool changed format or started failing, not that the model "got dumber".`,
    follow: ['How do you present partial results when a limit is hit?', 'How do you detect if an agent is repeating the same tool call?', 'How do you choose MAX_STEPS based on data?']
  },
  'claude-023': {
    q: 'A tool in your agent (e.g., inventory API) occasionally times out or returns 500 errors. How do you report this to Claude, and how do you design retries to avoid "double-dipping" (side effects)?',
    a: `**Summary:** Don't crash the loop. Catch the exception, return a {{tool_result}} block with {{is_error: true}} and **an instructive error message** (what happened, what to do next). Claude uses this to retry, pivot, or explain to the user. Perform technical retries (timeout, 5xx) **in code** with backoff, and all tools with side effects must be **idempotent** so retries don't create duplicate orders.

### Three Types of Errors
| Type | Example | Who should handle? |
|---|---|---|
| Transient infra | timeout, 500/503 | Code: retry 1–2 times w/ backoff; still failing → is_error |
| Model input error | missing params, invalid SKU | Claude: is_error + description so it fixes input and calls again |
| Business/Permission | insufficient funds, locked order | Claude: is_error explanation, let it explain to the user |

### Error Format
~~~json
{
  "role": "user",
  "content": [{
    "type": "tool_result",
    "tool_use_id": "toolu_01A09q",
    "is_error": true,
    "content": "Inventory API timeout after 2 retries (3s each). Inventory data temporarily unavailable. Do not retry this turn; explain to the user to try in 5 minutes."
  }]
}
~~~

### Idempotency Keys
When a timeout occurs, you **don't know** if the inventory server executed the request. Retrying blindly could reserve stock twice. Include an idempotency key (based on session + tool_use id, or business ID like orderId) so the server ignores duplicate requests. If the API doesn't support it, the tool must **check status first** then act.

### Pitfalls in Production
- Returning 3KB Java stack trace: wastes context, leaks internal details. Summarize.
- Swallowing error and returning empty string: model thinks it succeeded and hallucinates results.
- Retrying at all 3 layers (HTTP client, tool, model) → 3×3×3 = 27 calls for one error.

> Senior tip: add a **tool-specific error rate** to your agent dashboard. A tool suddenly hitting 20% errors is usually a sign the downstream API changed, and you should see it here before users complain.`,
    follow: ['Why avoid full stack traces in tool_result?', 'How do you choose idempotency keys for ordering tools?', 'Can strict tool use replace server-side validation?']
  },
  'claude-024': {
    q: 'When do you split an agent into an orchestrator–subagent model? How do you design task delegation, result transmission, and cost control for this model?',
    a: `**Summary:** Orchestrator–subagent is useful when sub-tasks are **independent, parallelizable, or generate large amounts of intermediate data** (logs, search results) that the main agent doesn't need to keep. Orchestrator delegates to subagents running in **separate contexts** (with specific system prompts/tools) and receives only a **summary**. For sequential, small, or highly context-dependent tasks, a simple agent is usually better and cheaper.

### Context Rot
Context is finite: more tokens = lower accuracy and weaker recall. An orchestrator reading 30 web pages fills context with junk. If delegated, 3 subagents each read 10 pages and return a 1-page summary, the orchestrator only sees 3 "clean" pages to synthesize.

### Designing Delegation
- Orchestrator's delegation tool has clear descriptions of when to use; each call includes: objective, scope, format, limits (steps, time).
- Subagent **cannot see** orchestrator history. Information must be in the task brief, like briefing a new colleague.
- Fixed return format (JSON or template) for easy orchestration.

### Controlling Cost & Risk
- Each subagent = separate API calls, so cost **multiplies**. Set budget/token limits per subagent and for the overall session.
- Match model to task: orchestrator uses powerful model (Opus/Sonnet), search/classify subagent uses Haiku.
- Limit depth: no nested subagents (or max 1 level).
- New models **tend to over-generate subagents** even when one grep is enough; add instructions: "use subagent when tasks are independent, need separate context; for simple, sequential tasks, do it directly."

### Pitfalls in Production
- Subagent says "done" without evidence: require evidence (file, line, URL).
- Two subagents writing to same resource: conflict. Assign write-tasks to one spot, or use worktrees/dedicated spaces.
- No traceability: attach {{parent_session_id}} to all calls to debug.

> Senior tip: before building an orchestrator, try a **single agent with better tools**. In reality, most multi-agent systems fail because of coordination and cost, not lack of capacity. Split only when eval shows context overload or latency benefits from parallelization.`,
    follow: ['What info should be in the brief since subagents don\'t see orchestrator history?', 'How do you measure multi-agent session cost?', 'When is using a cheaper model for a subagent a mistake?']
  },
  'claude-025': {
    q: 'Your agent can refund customers and delete data. How do you integrate "human-in-the-loop" (approval) into the agentic loop to be safe without breaking the conversation flow?',
    a: `**Summary:** Categorize tools by risk. Read-only/easy-undo tools run automatically; tools **difficult to reverse or affecting others** (refund, delete, send email) must pause the loop for approval. The approval gate is in **code** (not just prompt instructions): on encountering a dangerous tool_use, save session state + pending tool_use, wait for approval, then resume with tool_result (success/failure based on human decision).

### Why prompt instructions aren't enough
Prompt instructions are **advice**, models can misunderstand or be persuaded by prompt injection. While a good system prompt asking to "ask before dangerous actions" is a necessary first layer, money and data require **enforced code-layer** control that the model cannot bypass.

### Tool Classification
| Level | Example | Policy |
|---|---|---|
| Read | get_order, search_kb | Automatic |
| Write, undoable | draft_email, add_internal_note | Automatic + Audit |
| Write, hard-undo | refund, delete_customer_data, send_email | **Mandatory Approval** |
| Above threshold | refund > $500 | 2-level Approval |

### Technical Flow
1. Claude returns {{stop_reason: "tool_use"}} for {{refund}} with input {{amount}}, {{order_id}}.
2. Code checks risk policy → **don't execute**, save {{history}} + pending tool_use in DB (status = PENDING_APPROVAL).
3. Notify human: tool, normalized params, model's reasoning, related data.
4. Human approves/denies (with reason). This can take hours; state is saved, no thread held.
5. Code creates tool_result and **calls API again** with resumed history.

### Returning is_error on denial
Every tool_use **must** have a tool_result immediately following. If denied, return {{is_error: true}} with clear reason (e.g., "Human rejected: reason"). This helps the model understand not to retry that action and pivot to explaining to the user.

### Designing for Fast Approval
- Show **original** system data (actual order amount), not just what the model told you, to avoid being tricked by hallucination/injection.
- Allow human to **edit parameters** (50% refund instead of 100%) and record what actually happened in tool_result.
- Timeouts: auto-deny after 24 hours and inform the customer.

### Pitfalls in Production
- Only blocking in prompt but no gate in code: injection = refund.
- Approving based on model input, but code executes different params: verify execution matches approval.
- "Approval fatigue": only block what is truly risky.

> Senior tip: track **denial rate** per tool. Near-zero rate for months is a sign to loosen rules for small amounts; high rate means the prompt or data fed to the agent is flawed—fixing that is cheaper than adding more approvers.`,
    follow: ['How to avoid "approval fatigue"?', 'How to save conversation state to resume after hours?', 'Why "ask before refund" in prompt is insufficient?']
  }
});
