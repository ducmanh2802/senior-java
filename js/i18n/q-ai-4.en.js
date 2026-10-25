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
    a: `**Summary:** The model does not run code: it only returns a **tool call request** (name + JSON parameters) based on the tool description; Spring AI executes the Java method, sends the result back to the model, and loops until the model answers in text. Customer identity goes through **ToolContext** (not sent to the model), never as a parameter filled by the model. Tool errors must be cleaned before reaching the model; set a round limit or use approval steps to control the loop.

### Inside one turn with tools
1. ChatClient sends the prompt with **tool definitions**: name, description, JSON schema generated from the method signature and {{@ToolParam}}. Definitions travel with every call, so 20 tools can cost thousands of tokens per turn.
2. Model returns a tool call: name {{recentTransactions}}, parameters days = 30.
3. Spring AI calls the method, converts the result to JSON, and adds it to the conversation as a tool response.
4. Call the model again with the full conversation: each tool turn adds another model call, and context grows longer.

### Code
~~~java
class AccountTools {
    private final TransactionService txs;
    AccountTools(TransactionService txs) { this.txs = txs; }

    @Tool(description = "List up to 10 most recent transactions for the LOGGED-IN customer. "
        + "Use when the customer asks about their own transactions.")
    List<TxView> recentTransactions(
            @ToolParam(description = "Lookback days, from 1 to 90") int days,
            ToolContext ctx) {                                  // not included in the schema sent to the model
        String customerId = (String) ctx.getContext().get("customerId");
        int d = Math.max(1, Math.min(days, 90));                // model may pass out-of-range values
        return txs.recent(customerId, d, 10).stream()
            .map(TxView::masked)                                // mask counterparty account, drop extra fields
            .toList();
    }
}

String reply = chatClient.prompt()
    .user(question)
    .tools(new AccountTools(txService))
    .toolContext(Map.of("customerId", session.customerId()))   // taken from the authenticated session
    .call().content();
~~~

### Tool errors
- By default, RuntimeException messages are sent back to the model. The message may contain SQL, internal table names, or customer data and could leak into context and answers; LangChain4j behaves similarly by default.
- Throw with a standardized message ("No transactions found in 90 days"), or set {{spring.ai.tools.throw-exception-on-error=true}} to return errors to you, or install your own {{ToolExecutionExceptionProcessor}}.

### Loop control
- By default ChatClient runs the loop until the model stops calling tools. To set a round limit, or to require confirmation before a tool writes or traces each step, use **user-controlled tool execution**: Spring AI 1.0 sets {{internalToolExecutionEnabled(false)}} in {{ToolCallingChatOptions}}, then call {{ToolCallingManager.executeToolCalls(...)}} in your own loop (2.x changes the switch).
- {{returnDirect = true}}: tool result is returned directly to the caller, not back to the model; useful when the UI displays the transaction list directly, saving tokens and avoiding data in context. Only effective when all tools in that turn have returnDirect enabled.

### Limits of tool calling
| Limit | Impact | Reduction |
|---|---|---|
| Many tools | Model picks wrong, costs token definitions | Under 10 tools per context, select by intent |
| Many rounds | Latency accumulates, context bloats | Make tools return enough data in one call, set round limit |
| Model-generated parameters | Out of range, fake IDs | Validate like external input; IDs from session |
| Non-deterministic | Same question, different tool chain | Evaluate with scenarios, assert on tool calls |

### Production pitfalls
- Vague tool descriptions ("get customer data"): model calls it for every question.
- Tool returns raw JPA entities: exposes sensitive fields, may trigger lazy loading outside the transaction.

> Senior tip: design tools like a public API for an untrusted client: clear names and descriptions, narrow parameters, small masked results, permissions from the session. The model should only decide **what to call**; **what is allowed** is always decided by code.`,
    follow: [
      'The model requests parallel tool calls in one turn: how do you handle timeout and partial errors?',
      'How do you write tests to know the model picks the right tool with the right parameters?',
      'How does declaring a tool with @Tool differ from providing tools via an MCP server?'
    ]
  }
});
