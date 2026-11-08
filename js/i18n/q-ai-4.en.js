/*
 * English translation of js/data/q-ai.js — task T212. Format: js/core/i18n.js (content overlay).
 * ids: ai-027 ai-028 ai-029
 */
App.i18n.content({
  'ai-027': {
    q: 'The bank wants to use an LLM to summarize 40,000 call center calls per day. How do you estimate the monthly cost, check token/minute quota, and design so you do not exceed budget? Present with numbers.',
    a: `**Summary:** Estimate from tokens: (input tokens × input price + output tokens × output price) × number of calls; then check peak load by tokens/minute and concurrent calls (Little\'s Law). Summarizing calls does not need to be real-time, so the right architecture is **a queue + rate-limited workers**, plus prompt caching for fixed prefixes, batch API for non-urgent parts, budget alerts, and a kill switch.

### Assumptions (replace with real measurements and current pricing table)
- Fixed prefix (system prompt, instructions, examples): 2,000 tokens; average transcript: 3,000 tokens; summary: 400 tokens.
- Assumed prices: input 3 USD/1M tokens, output 15 USD/1M tokens, cache read at 10% of input price (write cost not included).

### Cost
| Option | Cost per call | Per month (1.2M calls) |
|---|---|---|
| Unoptimized | (5,000 × 3 + 400 × 15) / 1M = 0.021 USD | ≈ 25,200 USD |
| Cache prefix 2,000 tokens | 0.0006 + 0.009 + 0.006 = 0.0156 USD | ≈ 18,700 USD |
| Cache + batch API (many providers reduce ~50%, if aggregated) | ≈ 0.0078 USD | ≈ 9,400 USD |

Other levers: clean transcripts (remove hold segments, repeated words) to shorten ~30%, saving about 3,200 USD/month; short calls switched to a small model.

### Peak load and quota
- Assume peak hours are 15% of daily volume: 6,000 calls/hour = 100 calls/minute.
- Tokens/minute: 100 × 5,400 = 540,000. If quota is 400,000 TPM and calls go immediately after the call ends, you will hit 429 in batches.
- With a queue: workers process by quota at ~74 calls/minute, at end of peak ~26 × 60 = 1,560 calls remain, max delay ~21 minutes. For summarization that is acceptable; for chat it is not.
- Concurrency by Little: L = λ × W ≈ 1.7 req/sec × 9 sec (generate 400 tokens at ~50 tokens/sec) ≈ 15 concurrent calls; provisioning with ×3 buffer ≈ 45 slots.

### Rate limit by token, not by request
~~~java
// Worker only calls the model when the minute's token budget remains
final class TokenBucket {
    private final double capacity;
    private final double refillPerNano;
    private double available;
    private long last = System.nanoTime();

    TokenBucket(long tokensPerMinute) {
        capacity = tokensPerMinute;
        available = tokensPerMinute;
        refillPerNano = tokensPerMinute / 60e9;
    }

    synchronized boolean tryAcquire(long tokens) {      // tokens = counted input + max_tokens output
        long now = System.nanoTime();
        available = Math.min(capacity, available + (now - last) * refillPerNano);
        last = now;
        if (available < tokens) return false;             // put message back in queue, try later
        available -= tokens;
        return true;
    }
}
~~~
- Multiple instances: split quota per instance or use a distributed limiter (Redis).
- After each call read actual tokens (Spring AI: {{chatResponse.getMetadata().getUsage()}}) to reconcile cost by feature and tenant.
- Daily budget: alert at 80%, switch to batch or small model at 100%, with a kill switch.

### Pitfalls
- Estimate tokens by word count: Vietnamese usually costs more tokens than English; measure with a real tokenizer on 1,000 sample transcripts.
- Prompt caching only works when the prefix is identical byte-for-byte and traffic is within the cache lifetime (usually minutes); inserting a timestamp at the start of the prompt breaks it.
- Unbounded retry on 429: multiplies cost and makes the quota shortage worse.

> Senior tip: present to leadership in cost per business unit (about 0.016 USD per call, versus minutes of staff summarizing manually) rather than total tokens, and always include three scenarios: baseline, optimized, and double volume.`,
    follow: [
      'Transcript longer than the context window: how do you summarize in tiers and how does cost change?',
      'How do you split token/minute quota fairly across multiple features using the same provider account?',
      'At this volume, when is self-hosting a model cheaper than calling the API?'
    ]
  },
  'ai-028': {
    q: 'The product owner wants to "add AI" for five tasks: calculating loan interest, checking account number format, approving loan applications, summarizing complaints, and detecting fraud in real time. Which ones do you advise NOT to use an LLM for, and why?',
    a: `**Summary:** LLMs are strong with unstructured text when small errors are acceptable and there is a verification method; they are weak at precise calculation, clear rules, decisions that need explanation and audit, and tasks that need millisecond latency at large scale. Of the five tasks above, only **summarizing complaints** really fits an LLM; the other four should use code, rules, or traditional ML, with LLM only at the communication edge.

### Evaluating each task
| Task | Should use | Why not LLM |
|---|---|---|
| Interest and repayment schedule | Code + BigDecimal + unit tests | Must be exact to the currency, deterministic, auditable; LLM "guesses" numbers easily |
| Checking account number format | Regex, checksum if available | Clear rule, runs in microseconds, cost near zero |
| Approving loan applications | Scorecard / explainable ML + rules + human review | Needs consistency, explainable decisions, avoids bias |
| Real-time fraud | Rule engine + ML (e.g., gradient boosting) | Needs tens of milliseconds for millions of transactions; LLM is too slow and expensive |
| Summarizing complaints | LLM, with human review | Free-form text, small errors acceptable and verifiable |

### Questions before using LLM
1. Is there a deterministic algorithm or rule? If yes, write code.
2. What does one wrong answer cause: money loss, regulatory violation, or just inconvenience?
3. Can output be automatically verified (schema, comparison to source data)?
4. Latency and volume: 1 million calls per day multiplied by several seconds and unit price — is it acceptable?
5. Must the decision be explained to the customer or for audit?
6. Is the data allowed to be sent to the model?
7. Is there data to measure quality? Without measurement, you don\'t know when it is wrong.

### Pattern: LLM at the edge, code at the core
Customer asks "I want a 500M VND loan over 5 years — how much per month?": the LLM only understands the question and extracts parameters; the number is computed by code.
~~~java
record LoanQuery(BigDecimal principal, int months) {}

String answer(String question) {
    LoanQuery q = chat.prompt()
        .system("Extract loan amount (VND) and term (months). Do not compute.")
        .user(question)
        .call().entity(LoanQuery.class);                       // LLM: understands natural language
    validator.check(q);                                        // amount and term within valid ranges
    BigDecimal rate = rates.currentAnnualRate(q.months());     // rate from system, not from model
    BigDecimal monthly = Annuity.payment(q.principal(), rate, q.months()); // deterministic code with tests
    return templates.render("loan-estimate", q, rate, monthly); // response from approved template
}
~~~

### Agents also have limits
A 10-step process where each step the model is correct 95% of the time yields only ~0.95^10 ≈ 60% overall. Automating many steps needs a fixed workflow, verification after each step, and human approval on critical steps.

### Pitfalls
- Using LLM for "add AI" when a regex or SQL query already solves it.
- Letting LLM make customer-affecting decisions without saving the reason and without accountable owners.
- Not calculating cost at real scale: 100 tries feel cheap; 1 million per day reveals the bill.

> Senior tip: the answer "here an LLM should not be used," with a cheaper, faster, auditable alternative, usually impresses interviewers more than a complex AI architecture. Put the LLM where it is strong — understanding and generating language; leave calculation and decisions to code and processes.`,
    follow: [
      'When is a traditional ML classifier better than LLM for text classification?',
      'How do you explain to a product owner that 95% accuracy is not enough for some tasks?',
      'If forced to use LLM to assist loan approval, how do you limit its role?'
    ]
  },
  'ai-029': {
    q: 'You set up a bank chatbot to look up customer transactions using tool calling in Spring AI. How does the framework execute tools internally, how do you pass customer identity, handle tool errors, and limit loops?',
    a: `**Summary:** The LLM (Large Language Model, an AI that generates text) does **not** run your Java code. It only returns a **tool call request** — the tool name plus JSON parameters — based on the tool descriptions you provide. Spring AI (a Spring framework library for integrating AI models into Java apps) executes the Java method, sends the result back to the model, and repeats until the model answers in plain text. Customer identity is passed via **ToolContext** (a per-call map of trusted data that is not sent to the model), never as a parameter the model fills in. Tool errors must be sanitized before reaching the model; limit the loop with a max-round count or user-controlled execution.

### What tool calling is and why it is needed
**What:** Tool calling (also called function calling) lets the model ask your application to run a specific function and return data, like a waiter taking an order to the kitchen instead of cooking.
**Why:** The model cannot access your database or internal services. To answer "show my last 10 transactions," it must ask a trusted backend method to fetch that data.
**How it works at a high level:** You register Java methods as tools with descriptions. The model reads those descriptions, decides which tool to call and with what arguments, and your framework executes the real code.

### Inside one turn with tools (step by step)
1. **Send definitions:** ChatClient (Spring AI's fluent API for chat requests) sends the user prompt together with **tool definitions**: each tool's name, description, and a JSON schema generated from the Java method signature and {{@ToolParam}} annotations. Definitions are sent on every model call, so 20 tools can cost thousands of tokens per turn (a token is a small chunk of text the model bills and processes).
2. **Model requests a tool:** The model returns a structured tool call, e.g. name {{recentTransactions}} with parameter {{days = 30}}. It does not execute anything.
3. **Framework executes Java:** Spring AI matches the name to your method, deserializes the JSON arguments, invokes the method, serializes the return value to JSON, and appends it to the conversation as a tool response message.
4. **Model sees the result:** Spring AI calls the model again with the full conversation (original prompt + tool call + tool result). The model may call more tools or produce a final text answer. Each round means another model API call and a longer context (the conversation text sent to the model).

~~~seq
title: One tool-calling turn in Spring AI
actors: User | ChatClient | LLM | AccountTools
User -> ChatClient: Show my recent transactions
ChatClient -> LLM: prompt + tool definitions
LLM --> ChatClient: tool_call recentTransactions(days=30)
ChatClient -> AccountTools: invoke method (customerId from ToolContext)
AccountTools --> ChatClient: JSON result (masked)
ChatClient -> LLM: conversation + tool result
LLM --> ChatClient: final text answer
ChatClient --> User: Here are your last transactions...
~~~

### Code example
~~~java
class AccountTools {
    private final TransactionService txs;
    AccountTools(TransactionService txs) { this.txs = txs; }

    @Tool(description = "List up to 10 most recent transactions for the LOGGED-IN customer. "
        + "Use when the customer asks about their own transactions.")
    List<TxView> recentTransactions(
            @ToolParam(description = "Lookback days, from 1 to 90") int days,
            ToolContext ctx) {                                  // ctx is NOT in the schema sent to the model
        // Identity comes from the authenticated session, never from model input
        String customerId = (String) ctx.getContext().get("customerId");
        // Treat model-provided args like untrusted input: clamp to a safe range
        int d = Math.max(1, Math.min(days, 90));
        return txs.recent(customerId, d, 10).stream()
            .map(TxView::masked)                                // mask counterparty account, drop sensitive fields
            .toList();
    }
}

String reply = chatClient.prompt()
    .user(question)
    .tools(new AccountTools(txService))
    .toolContext(Map.of("customerId", session.customerId()))   // taken from the authenticated session
    .call().content();
~~~

### Passing customer identity safely
- **Why ToolContext:** If {{customerId}} were a normal {{@ToolParam}}, the model could invent or change it (prompt injection: a user tricks the model into doing something unsafe). With ToolContext, your server injects the real identity from the authenticated session; the model never sees or controls it.
- **Rule:** Any authorization boundary (who can access what) must be enforced in code. The model only decides *which* tool to request.

### Handling tool errors
- **Default behavior:** A {{RuntimeException}} message may be sent back to the model as the tool result. That message can contain SQL, internal table names, stack details, or customer data — leaking into context and possibly into the user-facing answer. (LangChain4j, another Java AI library, behaves similarly by default.)
- **Safer options:** Throw exceptions with standardized, non-sensitive messages (e.g. "No transactions found in 90 days"); or set {{spring.ai.tools.throw-exception-on-error=true}} to handle errors in your code; or provide a custom {{ToolExecutionExceptionProcessor}} to transform exceptions before they reach the model.
- **Also validate inputs:** The model may pass out-of-range values (days = 9999) or unexpected types. Validate like any external input.

### Limiting loops
- **Default:** ChatClient runs the tool loop until the model stops requesting tools. A confused model or a bad tool result can cause long chains, high latency, and token cost.
- **User-controlled tool execution:** To enforce a max number of rounds, require human approval before write operations, or trace each step, disable automatic execution and run the loop yourself. In Spring AI 1.0, set {{internalToolExecutionEnabled(false)}} in {{ToolCallingChatOptions}} and call {{ToolCallingManager.executeToolCalls(...)}} in your own loop (Spring AI 2.x changes how this is enabled — check the version you use).
- **returnDirect:** Set {{returnDirect = true}} on a tool when the UI should display the raw result (e.g. a transaction table) without another model call. This saves tokens and avoids putting sensitive data back into model context. It only takes effect if all tools in that turn have {{returnDirect}} enabled.

### Limits and trade-offs
| Limit | What happens | How to reduce |
|---|---|---|
| Too many tools | Model picks wrong tool; definition tokens grow | Keep under ~10 tools per context; select tools by intent |
| Too many rounds | Latency adds up; context bloats | Return enough data per call; set a round cap |
| Model-generated params | Out of range, fake IDs | Validate as untrusted input; take IDs from session |
| Non-deterministic | Same question, different tool chain | Evaluate with scenarios; assert on tool calls in tests |

### Common production mistakes
- Vague descriptions like "get customer data" — the model may call it for unrelated questions. Write precise descriptions stating *when* to use the tool.
- Returning raw JPA entities — exposes sensitive fields and may trigger lazy loading outside a transaction. Return small DTOs/views with masking.
- Forgetting that every tool round costs latency and tokens — measure end-to-end time and token usage.

### Interview-style answer (sample)
"In Spring AI, tool calling means the model does not execute code. It returns a tool call request with a name and JSON arguments based on the tool definitions I send. The framework invokes the matching Java method, serializes the result, appends it as a tool response, and calls the model again until it produces a final answer. For a bank chatbot, I never let the model supply customer identity. I pass the authenticated customer ID through ToolContext so it is enforced by code and not visible in the model schema. I also treat tool arguments as untrusted input and clamp values like the day range. For errors, I avoid leaking internal details by returning sanitized messages or handling exceptions with a custom processor. To control loops, I can cap rounds or use user-controlled execution, and for display-only results I use returnDirect to skip an extra model call. The key principle is: the model decides what to call; my code decides what is allowed."

> Senior tip: Design tools like a public API for an untrusted client: clear names and descriptions, narrow parameters, small masked results, and permissions taken from the session. The model should only decide **what to call**; **what is allowed** is always enforced by code.`,
    follow: [
      'If the model requests parallel tool calls in one turn, how do you handle timeouts and partial failures?',
      'How do you test that the model selects the right tool with the right parameters?',
      'How does declaring a tool with @Tool in the application differ from providing tools via an MCP server?'
    ]
  }
});
