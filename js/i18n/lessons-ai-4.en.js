/*
 * English translation of js/data/lessons-ai.js — task T810. Format: js/core/i18n.js (content overlay).
 * ids: lesson-ai-006
 */
App.i18n.content({
  'lesson-ai-006': {
    title: 'Calling the LLM API in production: token budget, history trimming, timeout, retry, circuit breaker and fallback',
    goals: [
      'Estimate the tokens and the cost of a request before writing any code, and know why Vietnamese is "more expensive" than English.',
      'Trim conversation history the right way: keep the system prompt, cut from the oldest turn, never leave the history with broken pairs.',
      'Set timeouts at the right layers and explain why one hanging call can bring the whole application down.',
      'Design controlled retry for 429/5xx (with backoff, cap, deadline) plus a circuit breaker and a multi-tier fallback.',
      'Log enough to answer "how much does this feature cost, where is it slow, what is failing" without storing prompts or PII.',
    ],
    body: `**Summary:** When you call an LLM API from a Java service you are plugging in a dependency that is **slow** (a few seconds up to tens of seconds), **non-deterministic** (the same input can produce a different output), **billed per token** and **limited by quota** (429). Just "make an HTTP call and retry if it fails" will drain your thread pool, burn money and return wrong results. This lesson goes through the five things you must design on purpose: **the token budget**, **trimming conversation history**, **timeouts**, **retry + circuit breaker + fallback**, and **cost logging**.

### 1. Why an LLM is harder than an internal service
| Dimension | Internal service (order, CRM) | LLM API |
|---|---|---|
| Latency | 5–50 ms p99 | 1–30 s, and the longer it generates the slower it gets |
| Result | deterministic, tests can compare it | non-deterministic, you have to **measure it with evals** |
| Cost | almost fixed (infrastructure) | linear in tokens, jumps sharply whenever the prompt changes |
| Failures | under your control | provider overloaded (529), rate limit (429), model behaviour changes |
| Capacity | you scale it yourself | a per-minute quota decided by somebody else |
Four jobs follow directly from the table above: bound and trim the input, timeout + retry with a ceiling, circuit breaker + fallback, and measure cost per feature.

### 2. Tokens: the billing unit and the limiting unit
A **token** is a fragment of text as the model reads it — not a letter, not a word. For English a model averages about **4 characters/token**; Vietnamese is "more expensive" because a BPE tokenizer works over UTF-8 bytes, and a Vietnamese vowel is usually a plain letter plus one or two stacked marks (circumflex, breve, horn, dot below, and one of the five tone marks) — every mark is its own code point, so one visible letter arrives at the tokenizer as several bytes and gets split into several pieces, giving about **2–3 characters/token**. A 100-character Vietnamese sentence can therefore eat 40–60 tokens while the equivalent English sentence costs only ~25.

How to use this in a design:
- **Estimate** to compute the budget and to decide where to cut: {{(chars + 3) / 4}} for English, divide by 2–3 for Vietnamese. An estimate is only there to make decisions with.
- **Real numbers** come only from the {{usage}} the provider returns ({{prompt_tokens}} / {{completion_tokens}}, or {{usage.input_tokens}} / {{usage.output_tokens}} at Anthropic). Put {{usage}} into the metrics of every request.
- Use a real tokenizer ({{jtokkit}} — the Java port of tiktoken) when you need an exact number before sending, e.g. to check "does this fit in 8k".

The context window has to hold **everything**: the system prompt, the tool definitions, the output schema description, the conversation history, the RAG context, and the space reserved for the answer.

~~~java
// Fast estimate, no tokenizer needed: round up every 4 characters (the convention used in the exercises and tests)
static int estimateTokens(String s) { return (s.length() + 3) / 4; }

// Cost: input and output are priced DIFFERENTLY per 1 million tokens (output is usually 4-5x more expensive)
static double costUsd(int inTokens, int outTokens, double usdPerMillionIn, double usdPerMillionOut) {
    return inTokens / 1_000_000.0 * usdPerMillionIn
         + outTokens / 1_000_000.0 * usdPerMillionOut;
}
// 10,000 requests, assumed prices of 3 USD and 15 USD per million tokens:
// 10,000 * costUsd(5000, 500, 3, 15) = 225 USD
~~~
A worked example so you can "see" the number (**assumed** prices of 3 USD/1M input and 15 USD/1M output — always check the current price list): 10,000 requests, each with 5,000 input tokens + 500 output tokens = 10,000 × (0.015 + 0.0075) = **225 USD/month**. Double the traffic, or add 2,000 context tokens to each call, and the bill changes immediately — that is why you log {{usage}} per feature.

> Two places where money "leaks" that few people notice: (1) no {{max_tokens}} set → the model answers as long as it feels like and the output cost follows; (2) the agent loop — if the model calls a tool 40 times, it sends the whole history 40 times (lesson ai-017). Set {{max_tokens}} per **kind of work**: classification 64–128, summarisation 256–512, content generation 1024+.

### 3. Trimming conversation history (context trimming)
A 200-turn conversation balloons into tens of thousands of tokens: slow, expensive, and quality **drops** because of "lost in the middle" (the model pays more attention to the start and the end of the context than to the middle). Trimming is mandatory, but trimming badly is even worse. Six practical rules:
1. **The system prompt and the tool definitions are never trimmed** — lose them and the model forgets its role, forgets the safety rules, forgets even the JSON output constraints.
2. **Cut from the oldest turn** (FIFO), because the user's newest intent matters more.
3. **Count the expected output** in the budget too; do not trim exactly to the context window size.
4. **Keep the user + assistant pairs together.** A history that starts with a lone {{assistant}} message makes the dialogue nonsensical; OpenAI/Anthropic also return **400** when a {{tool_use}} gets trimmed away from its matching {{tool_result}}.
5. **Anything you cut must leave a trace**: keep a rolling summary in its own block, or let RAG/memory retrieve it later (lesson ai-022 on multi-user chat memory).
6. **Never cut in the middle of a message** — it breaks integrity and the model "guesses" the missing part.

The algorithm that picks what to keep (used in exercise 1):
~~~java
// history already carries per-turn token counts; keep system + the suffix of the NEWEST turns that still fits the budget
static int firstKept(int systemTokens, int budget, int[] turnTokens) {
    int room = budget - systemTokens;              // system is always kept, even when room < 0
    int first = turnTokens.length;
    for (int i = turnTokens.length - 1; i >= 0; i--) {
        if (turnTokens[i] > room) break;           // no longer fits: stop, do not "jump over" a big turn
        room -= turnTokens[i];
        first = i;
    }
    return first;
}
~~~
> Why you **stop** when a turn does not fit (instead of skipping the big turn to keep an older, smaller one): skipping punches a hole in the middle of the conversation, and a history with holes is harder for the model to follow than one that simply lost its beginning.

### 4. Timeout: every layer must have one
Java's {{HttpClient}} has **two** timeouts and you must set both:
~~~java
HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(3))                 // TCP/TLS connect: fast, does not need to be long
        .build();
HttpRequest req = HttpRequest.newBuilder(uri)
        .timeout(Duration.ofSeconds(20))                       // read the response: classify 10s, generate 20-45s
        .build();
~~~
- **Why the missing one is dangerous**: Tomcat/Netty default to about 200 threads. 200 requests all hanging for 10 minutes because the provider is slow = the pool is completely exhausted, and the service **can no longer answer even the APIs that have nothing to do with AI**. That real scenario is exactly what question ai-021 asks.
- **Shorter than the caller's timeout**: if your gateway times out at 30 s, calling the LLM with a 60 s timeout is pointless — the user already received a 504 while you are still waiting and still about to pay for the answer.
- **Retries must live inside the deadline**: set one overall deadline (e.g. 25 s) and give each attempt only {{deadline.remaining()}}; if there is no room left for one attempt + one backoff, stop and fall back.
- **Streaming (SSE)** softens the feeling of waiting but does not exempt you from timeouts: use an **idle timeout** (cancel after 20–30 s with not a single chunk arriving) and keep the overall ceiling for the request.

### 5. Controlled retry
| Status | Retry? | Why |
|---|---|---|
| 429 | Yes | the per-minute quota ran out temporarily, waiting solves it |
| 500, 502, 503, 504 | Yes | transient errors on the provider/server side |
| 529 | Yes | overloaded (Anthropic's own code, "overloaded") |
| 501, 505 | No | "this method/version is not implemented or not supported": resending the identical request never succeeds |
| 400, 401, 403, 404, 422 | No | the request itself is wrong, you must fix code/config |
| 413 (prompt too long) | never as-is | **degrade then retry**: cut some context/history, then retry exactly **1** time, and log it so you get an alert when it happens often |
The waiting formula: {{delay = min(cap, base * 2^(attempt - 1))}}, then add **jitter** (randomise it) so thousands of instances do not retry in lockstep (thundering herd). Honour the {{retry-after}}/{{Retry-After}} header when the provider sends one. Attach three ceilings: the maximum attempt count, the total retry time (bounded by the deadline), and **never retry once you have streamed part of the answer** — the user already saw text, so a retry would print it twice; emit an error signal inside the stream instead.

~~~java
int attempt = 0;
int lastStatus = 0;
while (true) {
    attempt++;
    Response r = send(request, deadline.remainingMillis());     // never exceed the caller's deadline
    if (r.ok()) return r.body();
    lastStatus = r.status();
    if (!policy.shouldRetry(lastStatus, attempt)) break;        // 4xx, or the attempt budget is spent
    Thread.sleep(policy.delayMillis(attempt));                  // production: delayMillis + jitter
}
throw new AiDegradedException(lastStatus);                       // from here on it is the fallback's job
~~~
> Retry is only safe when the request has **no side effects**. If the agent loop already called the refund tool and only then failed, retrying the whole loop refunds twice. You need an idempotency key (an anti-duplicate key the server keeps so it recognises a resend), and you need to bound the agent's number of steps (lesson ai-017).

### 6. Circuit breaker: stop calling a provider that is dying
Think of the **breaker in your house's fuse box**: when the current passes the threshold it **trips** and cuts off immediately, waits a while, then lets a small test through; if that goes fine, it closes again. A circuit breaker does exactly that for LLM calls. Three states:
~~~text
CLOSED  --- (consecutive failures >= threshold) --->  OPEN
  ^                                                 |
  |                                          openWait elapsed
  |                                                 v
  +------ probe SUCCEEDS ------  HALF_OPEN  --- probe FAILS ---> OPEN (count from scratch)
~~~
| State | Calls allowed? | Meaning |
|---|---|---|
| CLOSED | yes | everything is normal, keep watching failures |
| OPEN | no | "the provider is broken, return the fallback right away"; avoids queueing threads that wait for nothing and avoids piling more load on the provider (lets it recover, avoids a thundering herd) |
| HALF_OPEN | 1 (or a few) probe requests | probe after the waiting window has elapsed |
~~~yaml
# Resilience4j configured for Spring Boot; compared with a hand-written version it ships metrics for free
resilience4j:
  circuitbreaker:
    instances:
      llm:
        sliding-window-size: 50              # looks at the last 50 requests
        minimum-number-of-calls: 20          # below 20 requests nothing is evaluated (avoids opening over 1/1 failures)
        failure-rate-threshold: 50           # open once failures are >= 50%
        wait-duration-in-open-state: 30s     # time to wait before half-open
        permitted-number-of-calls-in-half-open-state: 1
        automatic-transition-from-open-to-half-open-enabled: true
~~~
Three common pitfalls: (a) **one shared breaker for every model/region** — provider A being down also blocks fallback model B; split breakers per {{(provider, model, region)}}; (b) **a hanging probe** — if the probe request never returns a result, the breaker stays stuck in HALF_OPEN forever, so always give the probe a timeout and reset the window; (c) **a breaker without a fallback** only changes the kind of error: from timeout to "system busy", and the user still gets nothing.

### 7. Fallback: the ladder of actions when the LLM cannot answer
| Tier | When to use | Example for a feature |
|---|---|---|
| 1. Cache | identical input or a very small radius | same question + same document version → return the answer already computed (summarisation, classification) |
| 2. A cheaper model | the main model returns 429/529 | classification switches from the big model to the small one; slightly lower quality but still usable |
| 3. Another provider | the provider's breaker is open | Bedrock ↔ OpenAI; **condition**: quality has been evaluated and the same contract/JSON schema is kept |
| 4. No AI, still valuable | every tier above failed | chatbot: return a list of relevant documents (plain keyword search) plus the customer-service hotline; classification: set a "needs a human" label |
| 5. Say it plainly + a queue | prolonged overload | tell the user "this feature is slow, we will email you the result" and push the job onto a queue to redo later |
> The principle: **never invent a result just to get past an error**. An honest template is ten times better than a beautiful answer that is wrong (especially with money figures and fee schedules).

### 8. Cost logging and observability
For every request log (and keep the provider's {{request_id}} so you can cross-check it when they support you): {{tenantId}}, {{feature}}, {{model}}, {{status}}, {{latencyMs}}, {{inputTokens}}, {{outputTokens}}, {{costUsd}}, {{cached}}, {{attempts}}, {{breakerState}}, {{finishReason}}, {{sessionId}}. Do **not** log the raw prompt, the raw response, or PII (lessons ai-008 and ai-020).
Metrics that need a dashboard: p50/p95/p99 latency per feature; cost/day per feature; **retry rate**; cache hit ratio; breaker state; p95 input tokens (a sudden jump = somebody just added redundant context); p95 output length (a jump = a loop). Alerts: cost above 2× the 7-day average, retry rate > 5%, p95 above 2×, or the share of "tier 4/5 fallback" above 1%.

### 9. Diagram of one request when the provider fails
~~~seq
title: Request when the provider fails
actors: User | API | Llm | Provider
User -> API: Ask about the fee schedule
API -> Llm: Call model (deadline 25s)
Llm -> Provider: POST /v1/messages
Provider --> Llm: 429 with retry-after 6s
Llm -> Llm: wait 6s, retry (attempt 2)
Provider --> Llm: 529 overloaded
Llm --> API: raise breaker, still failing
note Llm: breaker open -> stop calling for 30s
API -> API: fallback: read cache + keyword search
API --> User: answer with sources, logged as degraded
~~~

### 10. Checklist before switching an AI feature on
- [ ] {{connectTimeout}} + {{requestTimeout}} + an overall deadline, shorter than the caller's timeout
- [ ] {{max_tokens}} per kind of work; context trimmed to the budget, system prompt never trimmed
- [ ] retry only on 429/5xx (except 501/505), backoff with cap + jitter, with a max attempt count and a total time
- [ ] a circuit breaker per {{(provider, model, region)}}, with a timeout for the probe
- [ ] at least one fallback tier that really delivers value to the user
- [ ] {{usage}} tokens + cost into metrics; a daily quota per feature; an alert when cost passes 2×
- [ ] an idempotency key (anti-duplicate key) for operations with side effects; a bound on the agent's step count
- [ ] offline eval before switching on; then shadow and canary on a small share of users
- [ ] log all the fields above but no prompt/PII

### Interview relevance
The typical question (this is exactly ai-021): "The provider returns 429/503, some requests have been hanging for more than 10 minutes and the thread pool is drained. How do you handle it?". Answer in structure: (1) stop the bleeding — a finite read timeout + a separate executor/connection pool for AI so nothing else goes down with it; (2) retry only the right error classes with backoff + jitter + cap and with **total retry time inside the deadline**; (3) a circuit breaker to fail fast when the provider is really down; (4) tiered fallback that always returns some value; (5) prevention — per-user rate limiting, cache, a token/day budget, dashboards and alerts. If they follow up with "and the cost?", immediately give the formula cost = input/1M × price_in + output/1M × price_out and the 10,000-request example from section 2.
> Senior tip: name a {{ThreadPoolExecutor}} (an executor with a queue and a thread limit) {{aiExecutor}} and keep it **separate** for LLM calls, letting it throw {{RejectedExecutionException}} (the "rejected execution" exception) when it is full. That answers a good interview question: "why did a broken AI feature kill the order-lookup API?" — because both shared Tomcat's 200-thread pool. Splitting the pool is 10 lines of code; not doing it is an incident.`,
    exercises: [
      {
        title: 'ContextBuilder: keep the system prompt + the newest turns that fit the token budget',
        prompt: `Write a {{ContextBuilder}} class that builds the list of messages sent to the LLM inside a finite token window.

{{new ContextBuilder(String systemPrompt, int maxTokens)}}: {{maxTokens}} is the budget for the **whole** request (system + conversation turns).
Token convention (so that the tests are deterministic): the token count of a message = {{(text.length() + 3) / 4}}, rounded up every 4 characters. The {{Message.tokens()}} method is already written.
1. {{void addUser(String text)}} and {{void addAssistant(String text)}}: append one turn to the history in chronological order. If {{text}} is null or empty, **skip** it, append nothing.
2. {{List<Message> build()}}: return the system message (role {{"system"}}) **if** {{systemPrompt}} is neither null nor empty — it always comes first and is **never trimmed**, even when it alone already exceeds {{maxTokens}}; after it comes the **longest suffix** of the history whose total tokens (system included) are still <= {{maxTokens}}, in chronological order. When you meet a turn that does not fit, **stop**; do not jump over it to pick up an older turn.
3. {{int droppedCount()}}: the number of turns dropped under the current budget.
4. {{int usedTokens()}}: the total tokens of the list that {{build()}} returns.

Example: {{systemPrompt = "SYS"}} (1 token), turns {{u1, a1, u2, a2, u3}} of 1 token each, {{maxTokens = 4}} → {{build()}} returns {{system, u2, a2, u3}} and {{droppedCount() = 2}}.`,
        hints: [
          'Keep one list of turns in chronological order; {{build()}} walks **backwards** from the last turn, adding tokens until a turn no longer fits, then stops and remembers the start index.',
          'The system tokens are subtracted from the budget before you look at the turns; if {{systemPrompt}} is null or empty there is no system message at all (the budget stays whole).',
          '{{droppedCount()}} = turns added - turns still present in {{build()}} (subtract one more when there is a system message). {{usedTokens()}} just sums the {{tokens()}} of every message in {{build()}}.',
        ],
        explain: `### Solution
- Walk backwards from the last turn and **stop** at the first one that does not fit: that is exactly the "longest suffix". This keeps the promise to the user (the most recent context stays intact) and leaves no hole in the middle of the conversation.
- The system prompt always comes first and is never trimmed: it carries the role, the safety rules, the JSON schema and the tool list. Losing the system prompt makes the model answer in the wrong format or forget the constraints — far worse than losing 20 old turns.
- {{usedTokens()}} is recomputed from {{build()}} instead of being accumulated while turns are added, so it always reflects the **current budget**, even when {{maxTokens}} is already exceeded by the system prompt alone.

### Common mistakes
- Cutting by **characters** or by "n half turns": a message gets torn in two, the model patches the meaning up by itself and starts inventing.
- Letting the history start with {{assistant}}, or trimming away a {{tool_use}}/{{tool_result}} pair → the provider answers 400 "invalid request: tool_use ids were found without tool_result blocks".
- Forgetting the space for the output: the input fits exactly into the model's {{max_tokens}} window, yet the request still fails with 400 because the input took the whole context window.
- Cutting without logging anything: the user says "it forgot the question I asked this morning" while no metric proves how many turns were dropped.
- In production the cut-away part should be **summarised** (a {{summary}} block placed next to the system prompt) or pushed into memory/RAG so it can be retrieved later — do not just throw it away.

> Senior tip: set the budget by **real cost**, not by the maximum context window: if the request's {{maxTokens}} is 8k then trim at ~70% and reserve room for the tool definitions + the output. And publish a {{prompt.tokens}} p95 metric per feature; when somebody adds 2k tokens to the system prompt, you see the bill change before the customer sees the quality change.`,
      },
      {
        title: 'RetryPolicy: which statuses may be retried and how long to wait',
        prompt: `Write a {{RetryPolicy}} class.
{{new RetryPolicy(int maxAttempts, long baseDelayMs, long maxDelayMs)}}: {{maxAttempts}} is the **total number of allowed attempts including the first one** (>= 1). Throw {{IllegalArgumentException}} if {{maxAttempts < 1}} or {{baseDelayMs < 0}} or {{maxDelayMs < 0}}.
1. {{static boolean isRetryableStatus(int status)}}: {{true}} when {{status == 429}} (rate limit) or {{status >= 500}}, **except** 501 and 505. Every other 4xx (400, 401, 403, 404, 413, 422) and any 2xx/3xx returns {{false}}.
2. {{boolean shouldRetry(int status, int attemptsSoFar)}}: {{true}} when the status is retryable **and** {{1 <= attemptsSoFar < maxAttempts}}. {{attemptsSoFar}} is the number of attempts **already made**.
3. {{long delayMillis(int attemptsSoFar)}}: how long to wait before the next attempt, after failure number {{attemptsSoFar}}:
   {{min(maxDelayMs, baseDelayMs * 2^(attemptsSoFar - 1))}}. For very large {{attemptsSoFar}} (70, 500) the result must be {{maxDelayMs}}, it must **not overflow** and must not come back negative.

Example with {{maxAttempts = 3, baseDelayMs = 200, maxDelayMs = 30000}}: the delay after attempt 1 = 200, after attempt 2 = 400; {{shouldRetry(503, 3)}} is {{false}} because the 3 attempts are used up.`,
        hints: [
          'In {{isRetryableStatus}}, {{status == 429}} must be checked before the "remaining 4xx" branch; for {{status >= 500}} take 501 and 505 out separately.',
          '{{shouldRetry}} is the product of three conditions: at least one attempt already made, {{maxAttempts}} not reached yet, and a retryable status. Do not forget the first one, because {{attemptsSoFar = 0}} means there is nothing to retry yet.',
          'To keep {{delayMillis}} from overflowing: do not use {{baseDelayMs << (attemptsSoFar - 1)}} (a shift only takes the low 6 bits of the shift count) and do not use {{Math.pow}}. Double the delay inside a loop and **stop as soon as it hits the cap**.',
        ],
        explain: `### Solution
- Classify by the **nature of the error**, not by the number: 429/5xx mean "the system is busy or broken" (wait and retry has a chance of success), 400/401/403/404/422 mean "your request is wrong" (resending it is still wrong, it only burns quota and hides the bug), and 501/505 mean "I do not support this" (it never fixes itself).
- {{delayMillis}} uses a doubling loop with the cap as its exit condition: {{for (int i = 1; i < attempts && delay < cap; i++) delay = Math.min(cap, delay * 2)}} — with {{attemptsSoFar = 500}} it is still a short loop because it leaves early.
- You need **both** ceilings: the attempt ceiling ({{maxAttempts}}) and the **total time** ceiling (computed by the caller, against the request deadline). Retrying 5 times with a 30 s cap can wait 2 minutes — longer than the gateway timeout, so the user already received a 504 while you are still paying.

### Common mistakes
- {{baseDelayMs << attempt}}: Java only uses the low 6 bits of the shift count, so {{attempt = 70}} becomes a shift of 6 → a mysteriously small value. {{Math.pow}} returns a double and the cast to {{long}} loses precision.
- Retrying without jitter: a thousand instances all wait exactly 200 ms then hit the provider again together → it falls over further (thundering herd).
- Retrying in the client **and** in the SDK **and** in the gateway: the real attempt count is the product of the three layers, which turns into dozens of duplicate requests.
- Retrying after part of the stream has been sent: the user sees the answer printed twice.
- Forgetting that retrying a request with side effects (a tool that creates a transaction) needs an idempotency key (lesson ai-017).

> Senior tip: in production use the **full jitter** formula: {{sleep(randomLong(0, min(cap, base * 2^attempt)))}} and one shared {{deadline}} for the whole attempt chain. With a provider that sends {{Retry-After}}, honour that header first, but still cut it by the cap: {{Retry-After: 600}} while your caller times out at 30 s means you must fall back, not wait.`,
      },
      {
        title: 'CircuitBreaker with the clock passed in: CLOSED, OPEN, HALF_OPEN',
        prompt: `Write a {{CircuitBreaker}} class that stops calls to a provider while it is failing. The {{State}} enum is already in the starter. Every method takes {{nowMillis}} supplied by the caller (tests must not use the real clock).
{{new CircuitBreaker(int failureThreshold, long openMillis)}}: throw {{IllegalArgumentException}} if {{failureThreshold < 1}} or {{openMillis < 0}}.
- **CLOSED** (default): allow every request. Count **consecutive failures**; one success resets the counter to 0. When {{recordFailure}} brings the consecutive failure count to {{failureThreshold}} → move to OPEN and record {{openedAt = nowMillis}} of that failure.
- **OPEN**: block requests. Once {{nowMillis - openedAt >= openMillis}} the state is **HALF_OPEN** (derived from the clock, nobody has to transition it).
- **HALF_OPEN**: allow **exactly one** probe request to be in flight. {{allowRequest}} returns {{true}} for the first probe and {{false}} for every other request until the probe has a result. A failing probe → back to OPEN with a new {{openedAt = nowMillis}} (wait the full {{openMillis}} again). A successful probe → CLOSED and the failure counter goes back to 0.
- {{boolean allowRequest(long nowMillis)}}: {{false}} when OPEN; in HALF_OPEN only the probe; CLOSED always {{true}}.
- {{void recordSuccess(long nowMillis)}} / {{void recordFailure(long nowMillis)}}: update as described above. {{recordFailure}} while OPEN (a blocked request) changes nothing.
- {{State state(long nowMillis)}}: the **effective** state at the timestamp passed in.`,
        hints: [
          'Three fields are enough: {{consecutiveFailures}}, {{state}}, {{openedAt}}; add {{probeInFlight}} so HALF_OPEN lets exactly one request through.',
          'Write {{state(nowMillis)}} as a derived read: if the state is OPEN and {{nowMillis - openedAt >= openMillis}} then **return** HALF_OPEN (do not mutate the field there), otherwise return the {{state}} field.',
          'In {{allowRequest}}, if {{state(nowMillis)}} is HALF_OPEN and {{probeInFlight}} is already true then return false; if the request may go, set {{probeInFlight = true}} and set the {{state}} field to HALF_OPEN. {{recordSuccess}}/{{recordFailure}} handle the probe branch based on {{probeInFlight}}.',
        ],
        explain: `### Solution
- The three states form one small state machine; all of the "timing" lives in the comparison {{nowMillis - openedAt >= openMillis}}, so the tests pass a clock in and run deterministically, with no sleeping.
- {{openedAt}} is **rewritten every time** the breaker moves to OPEN. Otherwise the next HALF_OPEN round would use the old {{openedAt}} and the breaker would allow probes nonstop, losing its rest period.
- {{probeInFlight}} models "one exploratory request": several probes at once would hit the provider exactly when it has just recovered.
- A blocked request ({{allowRequest}} returning false) must not feed the failure counter; if it did, a breaker that is already OPEN would keep "renewing" itself forever.

### Common mistakes
- No {{minimumNumberOfCalls}} / no minimum window: 1 failing request out of 1 = 100% → the breaker opens on statistical noise.
- Overwriting the {{state}} field to HALF_OPEN inside the state-reading method: a reader becomes a writer, and the probe only gets through once in its life (and if you forget to set {{openedAt}}, you loop OPEN → HALF_OPEN forever).
- Getting stuck in HALF_OPEN because the probe request timed out and nobody called {{recordSuccess}}/{{recordFailure}}: in production the probe needs its own timeout or an automatic reset after {{probeTimeout}}.
- One breaker for everything: the primary provider failing also blocks the fallback model — split per {{(provider, model, region)}}.
- A breaker without a fallback: the user just receives "system busy" instead of a timeout.

> Senior tip: for LLMs set the threshold in **absolute** terms (consecutive failures) for low-traffic features, and as a **rate plus a minimum window** for high-traffic ones. Along with that, auto-disable **retry** while the breaker is open — retrying against an open breaker only grows your own queue. If you use Resilience4j, log {{CircuitBreakerStateEvent}} together with the {{request_id}} so you know at which minute the provider started failing, because that is the data you hand them when you open a ticket.`,
      },
    ],
    check: [
      {
        q: 'Which request **should** be retried when calling an LLM API?',
        options: [
          '400 Bad Request because the payload is not valid JSON',
          '401 Unauthorized because the API key is wrong',
          '429 Too Many Requests with a retry-after header',
          '422 because the output schema does not match',
        ],
        explain: `429 is a temporary error: the per-minute quota recovers, so waiting according to {{retry-after}} (cut by the cap and the deadline) and resending has a real chance of success. 400 and 422 are request errors — resending them unchanged is still wrong, you have to fix the payload/schema (for 413 use "degrade then retry": cut some context and try one more time). 401 means the key is wrong or revoked: retrying only burns quota and delays the discovery of the incident, so what you need is an alert, not a retry.`,
      },
      {
        q: 'Why should the circuit breaker for an LLM API be split per (provider, model, region) instead of one shared breaker?',
        options: [
          'Because each breaker costs a dedicated thread to watch it',
          'Because a breaker only works when exactly one call is in flight',
          'Because token costs differ, so they must not be aggregated',
          'Because one broken model would also block the fallback model that is perfectly healthy',
        ],
        explain: `A shared breaker pools the failures of every destination: the primary provider returns 529, the breaker opens, and calls to the fallback model (or to another region that is still fine) get blocked too — you lose your only way out. A secondary reason: models have different background failure rates and latencies, so their thresholds have to be configured separately. The other options are wrong: a breaker is an in-memory state machine and needs no dedicated thread, it works with many concurrent requests, and cost has nothing to do with the open/close logic.`,
      },
      {
        q: 'When you trim conversation history to fit the context window, what is **true** about the system prompt?',
        options: [
          'Never trim it: it carries the role, the safety rules, the schema and the tool list',
          'Trim it first because it is repeated in every request',
          'Trim half of it if it is longer than 10% of the budget',
          'Move it into a user message at the end of the list to save tokens',
        ],
        explain: `If the system prompt gets trimmed the model forgets its role, its output constraints and its rules — that is much worse than losing 20 old turns; if you want it cheaper, **shorten it** (drop few-shot examples, use the provider's prompt caching) rather than trimming it per request. The option "it repeats, so trim it first" confuses trimming with caching: precisely because it repeats, it is candidate number one for the prompt cache. Putting the system prompt at the end makes the model treat it as user instructions (so the constraints stop working) and breaks the cache prefix as well.`,
      },
      {
        q: 'What is the most serious consequence of **not setting** a timeout for LLM calls?',
        options: [
          'The token bill goes up',
          'Answers come back longer than needed',
          'The application thread pool gets occupied by hanging requests, taking down even the APIs unrelated to AI',
          'The model returns more 429 errors',
        ],
        answer: 2,
        explain: `Every request waiting on the provider holds one thread. With a pool of ~200 threads and a provider that is slow for 10 minutes, the service stops answering **anything**, including APIs that never touch AI — that is the scenario of question ai-021. A rising bill and long answers are real problems too, but they are solved with {{max_tokens}} and a budget; 429 is decided by the provider, not by your missing timeout. The fix: a finite read timeout + a separate executor for AI + a circuit breaker + a fallback.`,
      },
    ],
  },
});
