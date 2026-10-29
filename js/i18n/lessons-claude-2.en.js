/*
 * English translation of js/data/lessons-claude.js — task T479. Format: js/core/i18n.js (content overlay).
 * ids: lesson-claude-002 lesson-claude-003
 */
App.i18n.content({
  'lesson-claude-002': {
    title: 'Retrying correctly for 429, 529 and 5xx: retry-after, exponential backoff and full jitter',
    goals: [
      'Classify which Claude API errors are worth retrying (429, 529, 5xx) and which must never be retried (400, 401, 403)',
      'Compute the wait time with exponential backoff + full jitter and understand why jitter is needed',
      'Honour the {{retry-after}} header, and bound both the number of attempts and the total wait time',
    ],
    body: `### Not every error deserves a retry
A call to the Claude API can fail for many reasons. The most important question is: **if I resend exactly the same request, is it likely to succeed?** If the fault lies in the request itself (wrong format, wrong API key) then resending it 100 times still fails — it only wastes time and delays finding the bug. If the error is **transient** (the server is busy, you are sending too fast), waiting a little and retrying usually succeeds.

When an error occurs, the API returns an HTTP status together with a JSON body carrying the error {{type}}:

~~~json
{
  "type": "error",
  "error": { "type": "overloaded_error", "message": "Overloaded" }
}
~~~

| HTTP | error.type | Meaning | Retry? |
|---|---|---|---|
| 400 | {{invalid_request_error}} | Bad request: missing field, malformed message structure, prompt too long | **No**, fix the code |
| 401 | {{authentication_error}} | Wrong or missing API key | **No** |
| 403 | {{permission_error}} | The key is not allowed to use this resource | **No** |
| 404 | {{not_found_error}} | Wrong endpoint or model name | **No** |
| 413 | {{request_too_large}} | Request exceeds the maximum size | **No**, split it up |
| 429 | {{rate_limit_error}} | You exceeded the rate limit (requests/minute, tokens/minute) | **Yes**, following {{retry-after}} |
| 500 | {{api_error}} | Unexpected internal error on Anthropic's side | **Yes**, with backoff |
| 529 | {{overloaded_error}} | The API is overloaded system-wide | **Yes**, with backoff |

The distinction you need to be able to explain in an interview: **429 is "your" error** (your account went over its quota; slow down and it goes away), whereas **529 is "the system's" error** (the servers are overloaded for everyone; slowing down also helps the system recover). The official Anthropic SDKs already retry some errors by default — connection errors, 408, 409, 429 and errors ≥ 500; if you write your own HTTP client (for example with Spring's {{RestClient}}) you have to implement this part yourself.

### Honour the retry-after header
On a 429 the response carries a {{retry-after}} header: the number of **seconds** to wait before trying again. This is the most accurate information you have, because the server knows when your quota is refilled. There are also headers such as {{anthropic-ratelimit-requests-remaining}} and {{anthropic-ratelimit-input-tokens-remaining}} that let you slow down proactively **before** you get a 429. The rule: when {{retry-after}} is present use exactly that value; when it is absent, compute the backoff yourself.

### Exponential backoff: why the wait grows
Retrying immediately hammers a server that is already overloaded, which makes it recover even more slowly. Exponential backoff doubles the wait after every failure and applies a **cap**:

~~~text
ceiling(n) = min(cap, base * 2^n)      n = 0, 1, 2... (the (n+1)-th wait)
base = 1000 ms, cap = 30000 ms  →  1000, 2000, 4000, 8000, 16000, 30000, 30000...
~~~

### Full jitter: why randomness is needed
Imagine 500 instances all getting a 529 at 10:00:00. If all of them wait exactly 1 second, they all hit the server again at 10:00:01, then again at 10:00:03… This is the **thundering herd**: synchronised retry waves create load spikes. **Full jitter** picks the wait uniformly at random in [0, ceiling(n)), which spreads the clients out over time. The classic analysis on the AWS Architecture Blog ("Exponential Backoff And Jitter") shows that full jitter sharply reduces the total number of calls compared with backoff without jitter.

~~~java
long backoffMillis(int n) {
    long ceiling = Math.min(capMillis, baseMillis << n);  // base * 2^n, capped
    return (long) (random.nextDouble() * ceiling);         // full jitter: uniform in [0, ceiling)
}
// Test: pass in a Random with a fixed seed (new Random(42)) → a deterministic wait sequence you can assert on
~~~

### Three mandatory limits
1. **A maximum number of retries** (say 3–5). After that, return a clear error to the layer above.
2. **A maximum total wait time.** A user request usually has a 30–60 second timeout; if {{retry-after}} tells you to wait 120 seconds, do not wait — fail fast (or hand the work to a queue for later). Give up as soon as a wait would push the total over the budget; do not sleep for nothing.
3. **Never retry errors that cannot heal themselves**: 400, 401, 403, 404, 413.

### Production pitfalls
- **Retries stacked at several layers**: the SDK retries twice, your service retries three times, the API gateway retries three times again → one failure can turn into 2 × 3 × 3 = 18 calls. Retry at **one** layer only.
- **Retries cost money**: a Claude request is not "free to repeat". A 529 returned before any processing is not billed, but if you time out on the client while the server is still generating output, the retry is billed again from scratch.
- **Streaming**: an error can arrive **in the middle of** the stream as an {{error}} event (for example {{overloaded_error}}) after you already received HTTP 200. Code that only inspects the status code will miss it; you must handle the error event and decide whether to retry the whole request.
- **Without a fake Sleeper you cannot test it**: code that calls {{Thread.sleep}} directly makes the test run for tens of seconds and depend on wall-clock time. Extract {{Sleeper}} and {{Random}} into dependencies you can inject in tests.
- Log the {{request-id}} header of every error so you can hand it to Anthropic support when you need to investigate.

### Interview notes
Interviewers often ask: "How do 429 and 529 differ?", "Why do you need jitter?", "retry-after or backoff — which wins?", "How do you avoid a retry storm when the whole cluster fails at once?" (jitter, retry at a single layer, circuit breaker, client-side concurrency limits). Answering with the formula and a worked numeric example earns points. The exercise below makes you write a {{RetryPolicy}} that is fully testable.`,
    exercises: [
      {
        title: 'Write a RetryPolicy with backoff + full jitter, testable thanks to a seeded Random and a fake Sleeper',
        prompt: `Complete {{RetryPolicy}}:

- {{isRetryable(status)}}: true for 408, 429 and every status ≥ 500 (including 500 {{api_error}} and 529 {{overloaded_error}}); false for every other status (400, 401, 403, 404…).
- {{backoffMillis(n)}} (n = 0 for the first wait): {{ceiling = min(capMillis, baseMillis * 2^n)}}, return {{(long) (random.nextDouble() * ceiling)}}. Call {{random.nextDouble()}} **exactly once** per computation.
- {{execute(call)}}: call {{call.get()}}. If it throws {{ApiException}}:
  1. Not retryable, or the {{maxRetries}} retries are used up → rethrow that same exception.
  2. Wait = {{retryAfterSeconds * 1000}} if the exception carries {{retryAfterSeconds}} (and **do not** use the random source), otherwise {{backoffMillis(n)}} where n is the number of retries already performed.
  3. If the time already waited plus this wait exceeds {{maxTotalWaitMillis}} → rethrow the exception, **without** sleeping.
  4. Call {{sleeper.sleep(wait)}}, add it to the running total and try again.`,
        hints: [
          '{{isRetryable}} is just a boolean expression: 408, 429, or ≥ 500.',
          'Inside {{execute}}, use a {{for (int retry = 0; ; retry++)}} loop with {{try/catch (ApiException e)}}; check the give-up conditions before computing the wait time.',
          'The shift {{baseMillis << n}} is exactly {{baseMillis * 2^n}}; clamp {{n}} (say to at most 30) so {{long}} does not overflow for large n.',
        ],
        explain: `The order of the checks inside the {{catch}} matters: (1) if the error is not retryable or the attempts are used up, throw immediately; (2) compute the wait, preferring {{retry-after}}; (3) check the budget **before** sleeping, because sleeping 20 seconds and only then discovering the budget is blown wastes 20 seconds of the user's time.

Why inject {{Random}} and {{Sleeper}}: code that calls {{Thread.sleep}} and {{Math.random()}} directly cannot be tested deterministically; the test is both slow and flaky ("passes sometimes, fails sometimes"). With {{new Random(42)}} the sequence of random numbers is always the same, so the test can compute the expected result with another {{Random(42)}}. In production you pass {{Thread::sleep}} (wrapping InterruptedException) and an ordinary {{Random}} or {{ThreadLocalRandom}}.

Common mistakes: still drawing a random number when {{retry-after}} is present (which shifts the jitter sequence and waits the wrong time), forgetting the {{cap}} so the tenth wait is 17 minutes, and retrying 400/401, which hides configuration bugs.`,
      },
    ],
    check: [
      {
        q: 'How do the two errors 429 {{rate_limit_error}} and 529 {{overloaded_error}} differ?',
        options: [
          '429 means your account/organisation exceeded its quota; 529 means the API is overloaded for everyone, not because of you',
          'Both are caused by a malformed request and should not be retried',
          '429 is a server-side error, 529 is an API-key error',
          '529 only happens when you use streaming',
        ],
        answer: 0,
        explain: `429 ties to your own quota (requests/minute, tokens/minute) and usually comes with {{retry-after}}; 529 is system-wide overload. Both are worth retrying with backoff, so the "do not retry" option is wrong. An API-key error is 401, not 529. 529 can happen with ordinary requests as well as with streaming (where it arrives as an {{error}} event).`,
      },
      {
        q: 'Why use full jitter instead of plain fixed exponential backoff (1s, 2s, 4s…)?',
        options: [
          'Because full jitter always waits longer, which lowers the API cost',
          'Because many clients that fail at the same moment would all retry at exactly the same times; randomising spreads them out and avoids the thundering herd',
          'Because the Claude API requires jitter',
          'Because jitter lets you ignore the {{retry-after}} header',
        ],
        answer: 1,
        explain: `With fixed backoff every client that failed together retries in lockstep and creates bursty load. Full jitter picks a random value in [0, ceiling), so on average it waits **less**, which makes the "waits longer" option wrong. The API does not require jitter (it is a good practice). {{retry-after}} is still always preferred when present.`,
      },
      {
        q: 'A request fails with 400 {{invalid_request_error}}. What should the retry policy do?',
        options: [
          'Retry with backoff, at most 5 times',
          'Retry once, immediately',
          'Wait according to {{retry-after}} and try again',
          'Do not retry; throw immediately so the bad request is found and fixed',
        ],
        answer: 3,
        explain: `400 means the request itself is wrong (missing field, malformed messages structure, too long…); resending it unchanged always fails, so every retry option only wastes time and hides the bug. A 400 does not carry {{retry-after}} either — that header belongs to rate limiting (429).`,
      },
    ],
  },
  'lesson-claude-003': {
    title: 'Context budget and prompt caching: trimming history safely, placing cache_control and reading usage',
    goals: [
      'Explain the context window, {{max_tokens}} and why input cost grows with the length of the conversation history',
      'Trim the conversation history to fit a budget without ever splitting a {{tool_use}}/{{tool_result}} pair',
      'Order the prompt for effective caching, place {{cache_control}} breakpoints and compute the savings from the {{usage}} fields',
    ],
    body: `### What a context window is
Every model has a **context window**: the maximum number of tokens the model "sees" in a single call, covering **both the input** (system prompt, tools, all messages) **and the output** it will generate. A token is the unit in which the model reads text: not a character and not a word; in English roughly 3–4 characters per token on average, while Vietnamese with its diacritics usually costs more tokens for the same amount of content. To get the exact number, call the token-counting endpoint {{POST /v1/messages/count_tokens}} instead of guessing.

{{max_tokens}} is a **required** request parameter: the ceiling on **output** tokens. It does not make the model write longer; it only truncates once the model reaches it (at which point {{stop_reason}} is {{max_tokens}}). Input plus {{max_tokens}} must fit inside the model's context window.

### Why long conversations get expensive
The API is stateless: the 20th turn of a chatbot must resend all 19 previous turns. Suppose each turn adds 500 tokens and the system prompt is 3,000 tokens:

~~~text
Turn 1 : 3,000 + 500    =  3,500 input tokens
Turn 10: 3,000 + 5,000  =  8,000 input tokens
Turn 40: 3,000 + 20,000 = 23,000 input tokens   ← even a short question pays for 23K tokens
~~~

The total input cost of a whole session grows roughly **quadratically** with the number of turns. Two tools keep it in check: **trimming history** (sending fewer tokens) and **prompt caching** (paying less for the repeated tokens).

### Trimming history: what to keep, what to drop
The common strategy: always keep the **system prompt** and the **most recent** turns, and drop (or summarise into a short paragraph) the older ones. Two rules make it correct:
- **Never split a tool_use/tool_result pair.** If you keep the message holding the {{tool_result}} but drop the assistant message holding the matching {{tool_use}}, the API returns a 400. Treat that pair as **one unit** that cannot be cut: keep both or drop both.
- **Keep one contiguous run** counting back from the end. Skipping around (dropping a middle turn but keeping an older one because it "fits") leaves the conversation disjointed and makes the model misread the context.

> Summarising old turns (calling a cheap model such as Haiku to compress 30 turns into 300 tokens) keeps the gist, but every re-summarisation **changes the prefix** and destroys the cache. Usually you should summarise in batches (for example once you pass 70% of the budget) rather than on every turn.

### How prompt caching works
Prompt caching lets the API keep the processed **prefix** (the leading part) of a prompt. The next call with **exactly the same prefix, byte for byte** reads that part from the cache: much faster and much cheaper. The prefix is built in a fixed order: **tools → system → messages**. You mark where the cached part ends with {{cache_control}} on a content block:

~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "system": [
    { "type": "text", "text": "You are the customer-support assistant of Bank X. Rules: ..." },
    { "type": "text", "text": "<the whole product manual, 20,000 tokens>",
      "cache_control": { "type": "ephemeral" } }
  ],
  "messages": [{ "role": "user", "content": "How much is an interbank transfer fee?" }]
}
~~~

Points to remember:
- **Put the static part first**, the changing part last. A single different character at the front (for example injecting the current time into the system prompt, or reordering the tools) invalidates the entire cache behind it.
- At most **4 {{cache_control}} breakpoints** per request. For a chatbot you typically put one breakpoint after the system prompt/documents and another on the last message so later turns read the whole history back from the cache.
- There is a **minimum length** for caching (around 1,024 tokens or more, depending on the model); a shorter prompt is not cached even with {{cache_control}}.
- The default TTL is **5 minutes**, refreshed on every cache hit. A 1-hour TTL is available at a higher write price.

### Read usage to see whether the cache is working
The response returns {{usage}} with four numbers:

~~~json
"usage": {
  "input_tokens": 45,
  "cache_creation_input_tokens": 0,
  "cache_read_input_tokens": 20180,
  "output_tokens": 210
}
~~~

| Field | Meaning | Price (relative to regular input, 5-minute TTL) |
|---|---|---|
| {{input_tokens}} | Tokens **after** the last breakpoint, not cached | 1x |
| {{cache_creation_input_tokens}} | Tokens just **written** to the cache | 1.25x |
| {{cache_read_input_tokens}} | Tokens **read** from the cache | 0.1x |
| {{output_tokens}} | Tokens the model generated | the output price |

The real input total = all three input fields added together. The first call is usually a "write" (25% more expensive); later calls within the TTL are "reads" (90% cheaper). So caching only pays off when the prefix is **reused at least a few times** within the TTL. If your dashboard shows {{cache_read_input_tokens}} stuck at 0: check whether the prefix changes on every request, whether it reaches the minimum length, and whether the gap between requests exceeds the TTL.

### Interview notes
Interviewers often ask: "A chatbot gets more expensive the longer it chats — how do you handle that?" (trim or summarise the history, cache, pick a cheap model for summarising), "Where do you put cache_control?" (at the end of the static part; tools → system → messages), "How do you know the cache is working?" (read {{cache_read_input_tokens}}), and "What is the trap when trimming history?" (splitting a {{tool_use}}/{{tool_result}} pair, which causes a 400). The exercise below makes you write the history-trimming function and the savings calculation from usage yourself.`,
    exercises: [
      {
        title: 'ContextBudget: trim history to fit a budget and compute the cache savings',
        prompt: `{{Msg(role, kind, text, toolUseId)}}: {{role}} is {{system}}/{{user}}/{{assistant}}; {{kind}} is {{text}}/{{tool_use}}/{{tool_result}}. For simplicity the first element of the history is always the system prompt (in the real API this is the separate {{system}} parameter). The token count of a message is {{t.count(msg.text())}}.

**1. {{fit(history, budget, t)}}** returns a new list (without modifying {{history}}):
- Always keep {{history.get(0)}} (system). If that alone already exceeds {{budget}} → throw {{IllegalArgumentException}}.
- Walk from the **last** message backwards in **units**: a {{tool_result}} together with the {{tool_use}} message immediately before it (same {{toolUseId}}) is **one** unit; every other message is a unit of one element.
- Add the unit if the total tokens (system + kept + unit) ≤ {{budget}}; at the first unit that does not fit, **stop for good** (do not skip ahead to an older unit).
- Result: system first, then the kept messages in their original order.

**2. {{effectiveInputTokens(u)}}** = {{inputTokens + 1.25 × cacheCreationInputTokens + 0.1 × cacheReadInputTokens}} (converted into "input tokens at the base price").

**3. {{cacheSavings(turns)}}** = the per-turn total of (input + creation + read) minus {{effectiveInputTokens}}. It can be negative if you only write and never read back.`,
        hints: [
          'Walk the index {{i}} from the end down to 1. If {{history.get(i)}} is a {{tool_result}} and {{history.get(i - 1)}} is a {{tool_use}} with the same {{toolUseId}}, the unit is [i - 1, i]; otherwise it is [i, i].',
          'Use {{ArrayDeque}} with {{addFirst}} to walk backwards while preserving the original order; add the last element of the unit first.',
          'The saving of one turn = (input + creation + read) − (input + 1.25 × creation + 0.1 × read) = 0.9 × read − 0.25 × creation.',
        ],
        explain: `The key idea in {{fit}}: work in **units**, not per message. If you looked at messages one by one, at a budget of 380 you would keep the {{tool_result}} (200 tokens) but have no room left for the {{tool_use}} (30 tokens) in front of it: the real API returns 400 because the {{tool_result}} has no matching {{tool_use}}. Stopping at the first unit that does not fit (instead of "looking for a smaller one to squeeze in") keeps the conversation contiguous.

In practice the dropped history is usually replaced by a summary message, and you should count tokens with the {{count_tokens}} endpoint or the {{usage}} numbers of the previous turn rather than estimating from characters.

{{cacheSavings}} shows why the first turn "loses": writing 10,000 tokens into the cache costs 12,500 base-price tokens (a loss of 2,500), but every read back costs only 1,000 (a gain of 9,000). A single read-back within the TTL is already a net win. Common mistake: forgetting that {{input_tokens}} only covers the part **after** the breakpoint, so the two cache fields get left out of the input total.`,
      },
    ],
    check: [
      {
        q: 'You put {{cache_control}} after a 20K-token system prompt, but {{cache_read_input_tokens}} is always 0. Which cause is most plausible?',
        options: [
          'The system prompt has the current time injected at the front, so the prefix differs on every request',
          'Prompt caching only works when you use streaming',
          '{{max_tokens}} is set too small',
          'The cache only applies to messages with role {{assistant}}',
        ],
        answer: 0,
        explain: `The cache matches on the exact prefix; a timestamp that changes on every request at the front of the prompt makes every call a fresh "write". Caching works for ordinary requests as well as streaming ones. {{max_tokens}} only limits output and has nothing to do with the cache. A breakpoint can sit on tools, system, or a message of any role.`,
      },
      {
        q: 'The response has usage: {{input_tokens}} = 50, {{cache_creation_input_tokens}} = 0, {{cache_read_input_tokens}} = 20,000. How many input tokens did the model process in total?',
        options: [
          '50, because only {{input_tokens}} is input',
          '20,000',
          '20,050, because you must add the part read from the cache',
          '2,050, because the cache reduced the tokens by 90%',
        ],
        answer: 2,
        explain: `{{input_tokens}} only covers the part **after** the last breakpoint; the input total = input + creation + read = 20,050 tokens. The cache reduces the **price** of those 20,000 tokens (to about 0.1x), not the number of tokens the model reads, so 2,050 confuses tokens with cost. Both 50 and 20,000 leave one part out.`,
      },
      {
        q: 'When trimming an agent conversation history to fit a budget, which rule is mandatory so the request does not fail?',
        options: [
          'Always drop the system prompt first, since it is the longest',
          'Keep only messages with role {{user}}',
          'Drop the oldest messages one by one, ignoring what kind they are',
          'Never keep a {{tool_result}} while dropping the matching {{tool_use}} immediately before it: keep or drop the pair together',
        ],
        answer: 3,
        explain: `Every {{tool_result}} must reference a {{tool_use}} in the assistant message immediately before it; without the {{tool_use}} the API returns 400. Dropping the system prompt robs the model of its role and rules. Keeping only user messages makes the conversation structurally invalid. Dropping messages one by one without regard to their kind can split exactly that pair.`,
      },
    ],
  },
});
