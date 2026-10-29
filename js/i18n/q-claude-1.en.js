/*
 * English translation of js/data/q-claude.js — task T394. Format: js/core/i18n.js (content overlay).
 * ids: claude-001 claude-002 claude-003 claude-004 claude-005 claude-006 claude-007 claude-008 claude-009
 */
App.i18n.content({
  'claude-001': {
    q: 'Explain the structure of a Claude Messages API request and response. Why is this API considered "stateless," and how does that affect how you write a chatbot?',
    a: `**Summary:** Everything goes through one {{POST /v1/messages}} endpoint: the request includes {{model}}, {{max_tokens}}, {{system}} (optional), and an array of alternating {{messages}} (user/assistant). The response returns an {{content}} array containing blocks (text, tool_use, thinking…), {{stop_reason}}, and {{usage}}. The API **remembers nothing between requests**, so the client must resend the entire history every turn.

### Quick Understanding
Imagine calling a switchboard where you get a completely new employee every time: for them to understand you, you have to read back the previous call transcript. The Claude API is the same: every request is a "new call," and the {{messages}} array is the transcript you read back.

### Terminology
- **Token**: the unit of text the model processes (roughly a fragment of a word). Pricing and limits are based on tokens.
- **Content block**: a part of a message with its own {{type}}: {{text}}, {{image}}, {{document}}, {{tool_use}}, {{tool_result}}, {{thinking}}…
- **Context window**: the maximum total tokens the model "sees" in a request (input + output). Current models have a 1M token limit.
- **stop_reason**: the reason the model stopped generating ({{end_turn}}, {{max_tokens}}, {{tool_use}}, {{pause_turn}}, {{refusal}}, {{stop_sequence}}).

### What the Request and Response look like
~~~json
POST https://api.anthropic.com/v1/messages
x-api-key: <key>
anthropic-version: 2023-06-01
content-type: application/json

{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "system": "You are a customer support assistant for shop X. Keep answers concise.",
  "messages": [
    { "role": "user", "content": "Where is my order 123?" },
    { "role": "assistant", "content": "Order 123 is currently being delivered, expected tomorrow." },
    { "role": "user", "content": "Can I change the address?" }
  ]
}
~~~
~~~json
{
  "id": "msg_01...",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-5-5",
  "content": [ { "type": "text", "text": "Sure, please send me the new address." } ],
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 85, "output_tokens": 18 }
}
~~~

### Step-by-step for building a chatbot
1. Store conversation history **on your side** (DB, Redis, session) by conversation ID. The API does not have a concept of conversation ID.
2. Each turn: append the new user message to history, send the **entire array** to the API.
3. Read {{content}} of the response: loop through each block, only take {{text}} when {{type}} is text. Do not assume the first block is always text, as there could be thinking or tool_use.
4. Append the **entire assistant content** to history for the next turn.
5. When history approaches the context window: summarize older turns, or use server-side compaction (beta).

### Common Mistakes
- **Sending only the latest message** → the model "forgets" the context, replies off-topic by turn 2–3.
- **Storing only the assistant's text part** when there is tool_use/thinking/compaction → error or loss of state in the next turn. Store the entire content array.
- **Setting max_tokens too low** → answer is truncated, {{stop_reason}} is {{max_tokens}}.
- **Messages array starting with assistant** → invalid; the first message must be from a user.

### 1-Minute Interview Answer
"The Messages API is a single endpoint that receives the model, max_tokens, system prompt, and an array of user/assistant messages, returning content blocks along with stop_reason and usage. The key point is that it's stateless: the server doesn't hold the conversation, so I store the history in the backend and resend the entire thing every turn. The implication is that input costs increase with conversation length, so I use prompt caching for the stable initial part and summarize history when near the context limit. When parsing the response, I always check the type of each block and the stop_reason, not assuming it only contains text."

> Senior tip: log {{usage}} (input, output, cache read/write) for **every** request by user and feature from day one. That's the only data that will help you answer "how much did this feature cost" when the bill rises.`,
    follow: ['If a conversation involves tool_use, how do you store the history so it doesn\'t error in the next turn?', 'Input costs increase with the number of turns—how do you reduce them?']
  },
  'claude-002': {
    q: 'What are the possible stop_reason values in the Claude Messages API? For each value, how should your backend code handle it?',
    a: `**Summary:** {{stop_reason}} indicates **why** the model stopped: {{end_turn}} (completed naturally), {{max_tokens}} (hit output limit, truncated), {{stop_sequence}} (met a stop sequence you defined), {{tool_use}} (wants to call a tool), {{pause_turn}} (paused mid-server-tool-cycle, needs to be sent again), and {{refusal}} (refused for safety). Correct code **always checks stop_reason before using content**.

### Quick Understanding
Like indicator lights on a car dashboard: the car might stop because you reached your destination (end_turn), ran out of gas (max_tokens), need to add something before continuing (tool_use, pause_turn), or were blocked (refusal). Each light requires a different action.

### Terminology
- **Stop sequence**: a sequence you pass in {{stop_sequences}}; when the model generates that sequence, it stops.
- **Server tool**: a tool running on Anthropic infrastructure (web search, web fetch, code execution).
- **stop_details**: an object included when {{stop_reason}} is {{refusal}}, containing {{category}} and {{explanation}}.

### Handling Each Case
| stop_reason | Meaning | Backend action |
|---|---|---|
| end_turn | Model finished answering | Use content normally |
| max_tokens | Truncated mid-way | Do not consider complete; call again with larger max_tokens (stream if long) or request shorter; for JSON, do not parse |
| stop_sequence | Met stop sequence | Read the {{stop_sequence}} field to know which one, handle per your convention |
| tool_use | Wants to call your tool | Run the tool, send tool_result, call API again (agent loop) |
| pause_turn | Server tool paused | Resend the original assistant content so the API can continue |
| refusal | Refused for safety | Read stop_details, inform user politely, optionally trigger fallback model |

### Example Code (Java, simulated)
~~~java
switch (resp.stopReason()) {
  case "end_turn", "stop_sequence" -> render(resp.text());
  case "tool_use" -> loop.runToolsAndContinue(resp);       // see agent loop
  case "pause_turn" -> loop.resend(resp.content());       // resend to continue server tool
  case "max_tokens" -> {                                   // do not parse partial JSON
      metrics.counter("claude.truncated").increment();
      retryWithLargerBudgetOrAskShorter(req);
  }
  case "refusal" -> showPolicyMessage(resp.stopDetails()); // do not retry indefinitely
  default -> throw new IllegalStateException("Unknown stop_reason: " + resp.stopReason());
}
~~~

### Common Mistakes
- **Only reading content[0].text** without checking stop_reason → displaying cut-off answers or parsing partial JSON.
- **Retrying the same request on max_tokens** → it gets truncated exactly like before.
- **Retrying indefinitely on refusal** → wasting money and still getting refused.
- **Treating pause_turn as an error** → losing results from in-progress web searches or code execution.

### 1-Minute Interview Answer
"I always switch based on stop_reason before using the content. For end_turn, I use it normally. max_tokens means output was truncated, so I don't parse it, but call again with a larger limit or request a shorter answer, and I have a metric counting truncations. tool_use signals running the agent loop: execute the tool, send the tool_result with the correct tool_use_id, then call again. pause_turn means a server tool paused, so I just resend the content to continue. For refusal, I read stop_details, inform the user, and optionally trigger a fallback, never retrying blindly."

> Senior tip: set an alert when the {{max_tokens}} rate exceeds about 1–2% of requests for a route: this is usually a sign that the prompt changed or input data grew, and users are receiving truncated answers without anyone knowing.`
  },
  'claude-003': {
    q: 'You need to display Claude\'s response "typing" like in ChatGPT. How does Messages API streaming work, what events does it include, and how do you handle it in a Java backend?',
    a: `**Summary:** Set {{"stream": true}}, and the API returns **Server-Sent Events (SSE)** in order: {{message_start}} → for each block {{content_block_start}} → multiple {{content_block_delta}} → {{content_block_stop}} → {{message_delta}} (containing stop_reason, usage) → {{message_stop}}; interspersed with {{ping}}, and possibly an {{error}} event midway. The backend reads each event and pushes {{delta.text}} to the browser immediately.

### Quick Understanding
Not streaming is like waiting for a book to be fully printed before giving it to you. Streaming is giving you each page as soon as it's printed: the user sees text after a few hundred milliseconds instead of waiting 20 seconds for a long answer.

### Terminology
- **SSE (Server-Sent Events)**: an HTTP response that keeps the connection open, with the server sending multiple lines in the format {{event: …}} + {{data: …}}.
- **Delta**: a small change. For text, it's {{text_delta}}; for tool input, {{input_json_delta}} (a chunk of a JSON string); for thinking, {{thinking_delta}}.
- **TTFT (time to first token)**: the time to the first token, the most important metric for perceived chat speed.

### Event Flow
~~~text
event: message_start        -> id, model, initial usage
event: content_block_start  -> index 0, type text
event: content_block_delta  -> {"type":"text_delta","text":"Hello "}
event: content_block_delta  -> {"type":"text_delta","text":" there"}
event: ping                 -> keep connection alive, ignore
event: content_block_stop   -> index 0 finished
event: message_delta        -> stop_reason: end_turn, usage.output_tokens
event: message_stop         -> finished
~~~

### Handling in Spring Backend (conceptual)
1. Backend calls Claude with stream (via official Java SDK, or an HTTP client reading SSE lines).
2. Open a channel to the browser: {{SseEmitter}} (Spring MVC) or {{Flux}} (WebFlux).
3. Each {{content_block_delta}} of type text → push to client immediately.
4. Accumulate the full text to store in history when finished; read stop_reason and usage from {{message_delta}}.
5. If an {{error}} event is received mid-stream (e.g., overloaded): inform the client, **do not** store the partial answer as complete.
~~~java
// Spring MVC: forward each chunk of text to the browser
@GetMapping("/chat/stream")
public SseEmitter stream(@RequestParam String q) {
    SseEmitter emitter = new SseEmitter(120_000L);       // 2-minute timeout
    executor.submit(() -> {
        StringBuilder full = new StringBuilder();
        try {
            claude.stream(buildRequest(q), event -> {     // callback for each SSE event
                if (event.isTextDelta()) {
                    full.append(event.text());
                    emitter.send(event.text());           // push immediately, don't wait for finish
                }
            });
            history.save(q, full.toString());
            emitter.complete();
        } catch (Exception e) {
            emitter.completeWithError(e);                 // do not store partial answer
        }
    });
    return emitter;
}
~~~

### When to stream
- Chat, writing assistants: always recommended, as it greatly improves perceived speed.
- **Long output or large max_tokens**: recommended to avoid HTTP timeouts (SDK requires streaming for very large max_tokens).
- Background jobs requiring complete JSON: not needed, or stream and take the final message.

### Common Mistakes
- **Proxy/Nginx buffering the response** → users still see the response appear all at once. Disable buffering (e.g., header {{X-Accel-Buffering: no}}).
- **Parsing input_json_delta chunks as complete JSON** → error; must concatenate string until the block stops before parsing.
- **Not handling mid-stream error events** → storing partial answers in the DB.
- **Keeping threads waiting too long** on the server servlet → thread pool exhaustion under load; consider WebFlux or virtual threads.

### 1-Minute Interview Answer
"I set stream to true, and the API returns SSE in the order of message_start, then content_block_start, multiple content_block_delta, content_block_stop, then message_delta containing stop_reason and usage, finally message_stop. The Spring backend opens an SseEmitter or Flux to the browser and pushes each text_delta immediately upon receipt, while also accumulating the text to store when finished. I handle mid-stream error events and don't store partial answers. For tools, input comes as input_json_delta, so I concatenate the string before parsing. Also, buffering must be disabled at the proxy, otherwise streaming is meaningless."

> Senior tip: measure **TTFT** and **time to last token** separately on your dashboard. Users complaining "it's slow" are usually seeing high TTFT (prompt too long, not cached), while long total time is due to long output.`,
    follow: ['How do you show progress when Claude is calling a tool while streaming?', 'With 5,000 concurrent users streaming, do you choose Spring MVC or WebFlux, and why?']
  },
  'claude-004': {
    q: 'Your application occasionally receives 429 and 529 errors from the Claude API. How do these errors differ, and how do you design retries safely?',
    a: `**Summary:** **429 rate_limit_error** means **you** exceeded the organization's limit (requests/minute or tokens/minute) — there is a {{retry-after}} header; **529 overloaded_error** means **Anthropic's side** is temporarily overloaded. Both are retryable, using **exponential backoff + jitter**, with limits on attempts and total time; 400/401/403/404 **should not** be retried.

### Quick Understanding
A 429 is like a restaurant saying, "you've ordered enough for this hour, wait 30 seconds." A 529 is "the kitchen is too busy, wait a moment." Both mean "wait and try again," but 429 is due to your high volume (you need to throttle), while 529 is not your fault.

### Terminology
- **Exponential backoff**: wait twice as long each retry: 1s, 2s, 4s, 8s…
- **Jitter**: add a random duration to the wait time so thousands of clients don't retry **at the same time** (thundering herd).
- **Circuit breaker**: a safety switch. If errors exceed a threshold, trip the circuit to stop making calls and return a fallback immediately.
- **Idempotent**: calling multiple times produces the same result without side effects.

### Main Error Codes
| HTTP | error.type | Retry? |
|---|---|---|
| 400 | invalid_request_error | No: fix request |
| 401 | authentication_error | No: invalid key |
| 403 | permission_error | No |
| 404 | not_found_error | No: invalid model/endpoint |
| 413 | request_too_large | No: reduce size |
| 429 | rate_limit_error | Yes: use retry-after |
| 500 | api_error | Yes: backoff |
| 529 | overloaded_error | Yes: backoff |

Error body format:
~~~json
{ "type": "error", "error": { "type": "rate_limit_error", "message": "..." } }
~~~

### Designing Retries Step-by-Step
1. Classify errors as per table; only retry 429, 5xx, 529, and connection/timeout errors.
2. For 429: wait **at least** {{retry-after}} seconds.
3. For 5xx/529: backoff {{min(cap, base × 2^attempt)}} plus random jitter.
4. Limits: maximum 3–5 attempts **and** a total time limit (e.g., 60s for a user request waiting).
5. Wrap with a circuit breaker: if error rate exceeds 50% in 1 minute, trip the breaker and return "AI busy" or switch to a fallback model/provider.
6. Exhausted retries: return a friendly error to the user, log the request ID ({{request-id}} header) to report to Anthropic if needed.

~~~java
// Resilience4j: retry with backoff + jitter, only for retryable errors
RetryConfig cfg = RetryConfig.custom()
    .maxAttempts(4)
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(1000, 2.0, 0.5)) // 1s, 2s, 4s ± 50%
    .retryOnException(e -> e instanceof ClaudeHttpException ex
        && (ex.status() == 429 || ex.status() >= 500))   // 529 is also >= 500
    .build();
Retry retry = Retry.of("claude", cfg);
CircuitBreaker cb = CircuitBreaker.ofDefaults("claude");
Supplier<Answer> call = Retry.decorateSupplier(retry,
        CircuitBreaker.decorateSupplier(cb, () -> claude.ask(req)));
~~~

### Common Mistakes
- **Retrying immediately without jitter** → mass of clients hit back in the same second, prolonging 429/529.
- **Retrying 400s** → wasting money, the error remains the same.
- **Multiple retry layers**: the SDK defaults to retrying 2 times (408/409/429/5xx), if you wrap with 5 more retries → 18 calls for one request. Choose one layer responsible for retries.
- **Multiple instances consuming shared limit** without a shared queue → constant 429s under high load.

### 1-Minute Interview Answer
"429 means I exceeded organization limits, the server returns retry-after, so I wait for that duration and throttle. 529 is Anthropic overloading, not my fault. For both, I retry with exponential backoff and jitter, with a few attempts and a total time limit; 400, 401, 404 should never be retried. I wrap with a circuit breaker to return an error or fallback model if errors persist instead of hanging the request. I'm also mindful that the SDK retries 2 times by default, so I don't add too many layers."

> Senior tip: under high load, **queueing on your side** (queue + workers limited by token/minute limits) is much cheaper and more stable than letting 429s happen and retrying. Retry is a safety net, not a traffic regulation mechanism.`
  },
  'claude-005': {
    q: 'On what dimensions is Claude API rate limiting calculated? How do you design a multi-instance system to avoid 429s when user traffic increases 10x?',
    a: `**Summary:** Limits are applied per organization/workspace and per model group, including **requests per minute (RPM)**, **input tokens per minute (ITPM)**, and **output tokens per minute (OTPM)**; exceeding any dimension results in a 429. The response contains {{anthropic-ratelimit-*}} headers indicating remaining limits. To handle a 10x increase, use **queues + centralized throttling** by tokens, reduce tokens with caching, and push non-urgent work to Batch API.

### Quick Understanding
It's like a bus pass with limits: "maximum 50 rides and 2,000 km per hour." Exceeding either limit blocks you. With Claude, "rides" are requests, and "km" are input/output tokens. A good system has a coordinator queue, preventing everyone from pushing at once and getting kicked off.

### Terminology
- **RPM / ITPM / OTPM**: requests / input tokens / output tokens per minute.
- **Token bucket**: throttling algorithm: a bucket is filled with tokens at a steady rate, each request removes tokens; if empty, wait.
- **Workspace**: a group of API keys in an organization, can have its own limits.

### Headers to Read
~~~text
anthropic-ratelimit-requests-limit / -remaining / -reset
anthropic-ratelimit-input-tokens-limit / -remaining / -reset
anthropic-ratelimit-output-tokens-limit / -remaining / -reset
retry-after   (on 429)
~~~
Note: for most current models, tokens read from prompt cache **do not count** towards ITPM. This is another reason to cache the stable prompt (check the Rate limits page for the model you use).

### Designing for 10x Load
1. **Measure first:** average input/output tokens per request, per route. Multiply by projected QPS to compare against limits.
2. **Centralized queue:** instances don't call Claude directly but push jobs to a queue (Redis/SQS/Kafka); a group of workers takes jobs according to a **shared token bucket** (e.g., Redis + Lua) at a speed 10–20% below the limit.
3. **Prioritization:** user-facing requests (chat) have high-priority queues; background jobs (summary, bulk classification) move to **Message Batches API** (asynchronous, 50% cheaper).
4. **Reduce tokens:** prompt caching for system prompts/documents; cut history; set reasonable max_tokens.
5. **Model selection by route:** simple tasks use Haiku/Sonnet; each model group has its own limits.
6. **Respond when full:** when the queue is too long, return "busy, try again later" early instead of letting the request hang and timeout.
7. **Increase limits:** limits increase with usage tier; for stable, high load, contact Anthropic.

~~~text
[API instances] --enqueue--> [Queue: high | low] --> [Workers]
                                                      |  shared token bucket (Redis)
                                                      v
                                                Claude Messages API
[Bulk background jobs] ------------------------------> Message Batches API
~~~

### Common Mistakes
- **Each instance throttling itself independently**: 10 instances × "safe" = exceeding shared limit.
- **Counting requests but forgetting tokens**: a few requests with 200K token documents are enough to exhaust ITPM.
- **Setting max_tokens unnecessarily high**: some limit calculation methods are based on estimated output; set max_tokens close to actual needs.
- **Retrying all at once on 429** without jitter → retry storm.

### 1-Minute Interview Answer
"Limits are calculated in three dimensions: requests, input tokens, and output tokens per minute—exceeding any causes a 429, and responses include ratelimit remaining headers to monitor. Under 10x load, I don't let instances call directly but route through queues with a shared Redis token bucket, running just under the limit. Non-urgent work goes to the Batch API, which is half the price. I reduce tokens with prompt caching, history truncation, and selecting smaller models for simple routes. If the queue gets too long, I return a 'busy' error early instead of hanging."

> Senior tip: plot **remaining tokens / limit** over time on a dashboard, sourced from response headers. It forecasts 429s minutes before they happen and is the best evidence for requesting limit increases.`
  },
  'claude-006': {
    q: 'How does Claude prompt caching work? Where do you place cache_control for a chatbot with a 20K token system prompt and a 50K token product document?',
    a: `**Summary:** Prompt caching saves the **prefix (beginning)** of the prompt that has been processed. Subsequent requests with **byte-for-byte identical** prefixes will read from cache: about 10x cheaper and faster. Render order is {{tools}} → {{system}} → {{messages}}; mark with {{cache_control}} (type {{ephemeral}}) at the **end of the stable part** (max 4 breakpoints); default TTL is 5 minutes (optional 1 hour), refreshed with each use.

### Quick Understanding
It's like preparing a presentation: the company intro (long, always the same) is already printed, only the Q&A part is written on the fly. Caching is the "pre-printed part." But changing **one character** on the first page forces a reprint from the start, because the cache matches by prefix.

### Terminology
- **Prefix**: the segment of the prompt calculated from the first token up to a breakpoint.
- **Breakpoint**: the location placed {{cache_control}}; everything **before** it is cached.
- **Cache write / cache read**: initial write (more expensive than normal input by ~1.25x for 5 min TTL, ~2x for 1 hour) / subsequent reads (roughly 0.1x, depends on model).
- **TTL**: time to live of the cache if unused.

### Placing Breakpoints for the Example
~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "system": [
    { "type": "text", "text": "<system prompt 20K tokens: role, policies...>" },
    { "type": "text", "text": "<product document 50K tokens>",
      "cache_control": { "type": "ephemeral" } }
  ],
  "messages": [
    { "role": "user", "content": "How long is the warranty for filter X?" }
  ]
}
~~~
1. Static part (system + document = 70K tokens) goes **first**, with the breakpoint at the last block of the static part.
2. User question (changes every time) comes **after** the breakpoint.
3. For multi-turn conversations, you could add a second breakpoint at the near-latest message to cache the history as the conversation grows. A simpler way is **automatic caching**: place {{cache_control}} at the top-level request, and the API will automatically place breakpoints at the last cacheable block.

### Cost Calculation Example
Assume 1,000 questions/hour, 70K static tokens, Sonnet 5.5 price $2/MTok input, cache read $0.20/MTok:
- **No cache:** 1,000 × 70K = 70M tokens × $2 = **$140/hour**.
- **With cache** (refreshed continuously, ignoring write costs): 70M × $0.20 = **$14/hour**, plus small write costs.

That's why caching is the first "free win" in cost optimization.

### Verification
Check the {{usage}} field in the response:
- {{cache_creation_input_tokens}}: tokens just written to cache.
- {{cache_read_input_tokens}}: tokens read from cache (this number should be high in subsequent requests).
- {{input_tokens}}: non-cached part (new question).

### Common Mistakes
- **Prefix too short**: below minimum threshold (depends on model, ~512–4096 tokens) results in **no cache, and no error reported**.
- **User question before documents** → prefix changes every request, cache is useless.
- **Including timestamp or request ID in system prompt** → prefix changes byte-for-byte, cache hit is zero.
- **Changing tool list or order** between requests → tools are at the start of the prefix, breaking the entire cache.

### 1-Minute Interview Answer
"Prompt caching stores the prompt prefix; subsequent requests with an identical prefix read from cache at about one-tenth the cost and lower latency. The render order is tools, system, then messages, so I place all stable content like system prompts and documents first, attach cache_control at the end of the stable block, and user questions after. The default TTL is 5 minutes and refreshes on use; 1 hour is an option for sparse traffic. I verify with cache_read_input_tokens in usage and guard against cache-breakers like timestamps or changing tool order."

> Senior tip: monitor **cache hit rate** = cache_read / (cache_read + cache_creation + input) by route. When the rate drops suddenly after a deploy, it's almost certain someone injected dynamic data into the system prompt.`
  },
  'claude-007': {
    q: 'After enabling prompt caching, the dashboard shows cache_read_input_tokens is almost always 0. How do you investigate?',
    a: `**Summary:** Cache matches by **byte-for-byte prefix**, so 0 hits means the prefix is changing between requests, the prefix isn't long enough, or the cache expired before reuse. Investigate by **diffing the request body** of two consecutive requests, checking prefix length vs minimum threshold, checking time between requests vs TTL, and verifying that model, tools, and parameters are fixed.

### Quick Understanding
The cache is like a lock that only opens with the exact right key. The key being off by one tooth (one character, a space, different order of JSON keys) means it won't open. Investigation is about placing two keys side-by-side to find the mismatch.

### Terminology
- **Silent invalidator**: something that breaks the cache without throwing errors, such as timestamps, UUIDs, or unsorted JSON keys.
- **Cache namespace**: cache is separated by model (and workspace). Changing the model means a different cache.

### Investigation Checklist
1. **Log request body** (sensitive data masked) for 2 consecutive requests on the same route, then diff the part before the breakpoint.
2. **Dynamic data in system**: "Today is 28/10 14:03:22", user ID, account balance… Move these after the breakpoint or into the user message.
3. **Unstable serialization**: dumping a map/object to JSON without fixed key order (Java HashMap!) → order changes between runs. Use {{LinkedHashMap}}/{{TreeMap}} or configure ObjectMapper to sort keys.
4. **List of tools changes**: adding/removing tools based on user permissions, or changing their order. Tools are at the **beginning** of the prefix, breaking everything. Keep a fixed set of tools and enforce permissions in the execution layer.
5. **Prefix below minimum threshold** of the model: doesn't cache, doesn't error.
6. **Gap between requests > TTL** (default 5 mins): traffic is sparse, cache expired. Use 1 hour TTL, or accept no caching for this route.
7. **Changing model / parameters between requests** (e.g., A/B testing multiple models): each model has a separate cache.
8. **Wrong breakpoint placement**: placed at the last message which is always new, so nothing to read back.

~~~java
// Classic trap: HashMap → non-deterministic JSON key order
Map<String, Object> ctx = new HashMap<>(user.attributes());   // Bad
String sys = BASE_PROMPT + mapper.writeValueAsString(ctx);    // prefix changes between JVMs/runs

// Fix: data tied to the user goes AFTER the breakpoint, in the user message
List<Block> system = List.of(text(BASE_PROMPT).cached());     // Absolutely stable
String userMsg = "Context: " + sortedJson(ctx) + "\nQuestion: " + question;
~~~

### Common Mistakes
- **Assuming "mostly the same" is enough**: cache is not fuzzy-matched.
- **Only looking at total cost**: look at the cache hit rate per route to see which one is breaking.
- **Placing > 4 breakpoints**: max 4 per request.

### 1-Minute Interview Answer
"Cache matches by prefix byte-for-byte, so zero hits means the prefix is changing. I log two consecutive requests and diff the part before the breakpoint; culprits are usually timestamps or user data in the system prompt, non-deterministic JSON serialization, or tool lists changing based on the user. Then I check if the prefix meets the minimum threshold and if traffic is sparser than the 5-minute TTL; if so, I consider a 1-hour TTL. Finally, I verify the model hasn't changed between requests, as caches are model-specific."

> Senior tip: write an **automated test** that constructs requests twice with different user data and asserts that the part before the breakpoint is identical. It catches 90% of cache-breaking bugs in CI, before they hit the bill.`
  },
  'claude-008': {
    q: 'When do you use the Message Batches API instead of the normal Messages API? Describe the processing flow and limitations.',
    a: `**Summary:** The Batch API is for tasks **not requiring immediate results**: send up to 100,000 requests (or 256 MB) in one batch, processed **asynchronously**, mostly finished within 1 hour (max 24 hours), at **50% the price**. You create a batch, poll until {{processing_status}} is {{ended}}, then read the result and **match by {{custom_id}}** (results are not ordered). Results are kept for 29 days.

### Quick Understanding
Normal calls are like taking a taxi: immediate but expensive. Batch is like sending freight: pack all goods into one shipment, send it, it's half price, arrives within the day. Only use when nobody is waiting for the result.

### Terminology
- **custom_id**: an ID you set for each request in the batch (e.g., database record ID) to map the result back.
- **processing_status**: batch status: {{in_progress}}, {{canceling}}, {{ended}}.
- **result.type**: result for each request: {{succeeded}}, {{errored}}, {{canceled}}, {{expired}}.

### Example: classifying 50,000 support tickets overnight
~~~json
POST /v1/messages/batches
{
  "requests": [
    { "custom_id": "ticket-1001",
      "params": { "model": "claude-haiku-5-5", "max_tokens": 200,
                  "messages": [ { "role": "user", "content": "Classify ticket: ..." } ] } },
    { "custom_id": "ticket-1002", "params": { "...": "..." } }
  ]
}
~~~
1. Split 50,000 tickets into batches (≤ 100,000 requests, ≤ 256 MB), each request with custom_id = ticket ID.
2. Save batch ID to DB; a periodic job (e.g., every 5 mins) polls status.
3. When {{ended}}: read the result file (JSONL), map each line by custom_id and update DB.
4. Collect {{errored}}/{{expired}} rows to send in the next batch, distinguishing between errors due to bad requests (don't retry) vs. temporary errors.

### Comparison
| | Messages API | Batch API |
|---|---|---|
| Latency | Seconds | Mostly within 1 hour, max 24 hours |
| Price | 100% | 50% |
| Suitable for | Chat, waiting users | Bulk classification/summarization, eval, data generation |
| Streaming | Yes | No |

### Common Mistakes
- **Matching results by position** → assigning results to the wrong records. Always use custom_id.
- **Not handling expired**: batches over 24 hours expire pending requests.
- **Using batch for tasks where users are waiting** → bad experience.
- **Forgetting to store batch ID** → losing track of the batch when workers restart.
- Some features not supported in batch (e.g., server-side fallbacks). Check documentation for each feature.

### 1-Minute Interview Answer
"I use the Batch API for tasks not requiring immediate results like bulk classification or summarization, because it's half the price. A batch holds up to 100k requests or 256MB, mostly finished in an hour, max 24. Each request has a custom_id, I save the batch ID, poll until status is ended, then read results and map by custom_id because ordering isn't guaranteed. Errored or expired requests are collected and sent in the next batch, and results are kept for 29 days."

> Senior tip: combine Batch with **prompt caching** for the shared prompt (lengthy classification instructions): the two discounts stack, especially efficient for eval jobs running thousands of test cases.`
  },
  'claude-009': {
    q: 'Your backend needs Claude to return JSON in a specific schema to store directly in the DB. What are the methods, pros/cons, and why must the server still validate?',
    a: `**Summary:** There are 3 methods, from weak to strong: (1) **prompt instructions** "return JSON" and parse yourself — fragile; (2) **strict tool use** ({{strict: true}} on the tool) — API ensures {{tool_use.input}} matches the schema; (3) **structured outputs** ({{output_config.format}} with {{type: "json_schema"}}) — constraints the output itself to the schema. The server **must still validate business logic** (sensible values, permissions, length) because schema only ensures **shape**, not **correctness**.

### Quick Understanding
A schema is like a blank form: it ensures someone fills in the "date of birth" field with a date, but doesn't guarantee the date is actually real. You still have to check the contents.

### Terminology
- **JSON Schema**: standard for describing JSON structures (data types, mandatory fields, enums…).
- **additionalProperties: false**: does not allow foreign fields outside the schema.
- **Structured outputs**: feature for forcing output to match the schema at generation time. SDK has a helper {{messages.parse()}} to parse and validate.

### Example: structured outputs
~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "output_config": {
    "format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "invoice_no": { "type": "string" },
          "total": { "type": "number" },
          "currency": { "type": "string", "enum": ["VND", "USD"] }
        },
        "required": ["invoice_no", "total", "currency"],
        "additionalProperties": false
      }
    }
  },
  "messages": [ { "role": "user", "content": "Extract invoice: ..." } ]
}
~~~

### Comparison
| Method | Ensures shape | When to use |
|---|---|---|
| Prompt instructions | No | Quick prototyping |
| Strict tool use | Yes (tool input) | Model needs to **choose** action/tool in agent |
| Structured outputs | Yes (entire answer) | Only need structured data |

### Why server validation is still necessary
1. **Valid shape ≠ valid value**: total can be negative, date in future, invoice_no hallucinated.
2. **Truncation**: if {{stop_reason}} is {{max_tokens}}, the JSON might be incomplete; always check stop_reason first.
3. **Refusal**: {{stop_reason}} is {{refusal}} means no valid JSON.
4. **Security**: data entering SQL/HTML/shell must be escaped or parameterized like any untrusted input.
5. Use Bean Validation ({{@NotBlank}}, {{@Positive}}…) on DTO after parsing.

### Common Mistakes
- **Parsing JSON with regex** → breaks when the model adds conversational filler.
- **Forcing tool use by setting tool_choice to tool to get JSON**: this triggers a 400 error on current models (Opus 5.5, Sonnet 5.5, Fable 5.1). Use structured outputs or tool_choice auto + strict instead.
- **Enabling citations with structured outputs**: cannot use both (400 error).
- **Overly complex schema** (deep nesting, many anyOf): fragile and slow; keep it flat and clear.

### 1-Minute Interview Answer
"If I only need structured data, I use structured outputs via output_config.format with json_schema, keeping it flat with required and additionalProperties false. If the model needs to choose an action in an agent, I use tool with strict true so the input always matches the schema. Prompt instructions are just for prototyping. But schema only guarantees shape, so I still check the stop_reason, validate business logic using Bean Validation, and treat the data as untrusted when pushing to SQL or HTML."

> Senior tip: store the **raw JSON** returned by the model along with the prompt and model version in an audit table. When incorrect data appears in the DB, you'll know if it's the model, the prompt, or the mapping code."`
  }
});