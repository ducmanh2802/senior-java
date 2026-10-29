/*
 * English translation of js/data/lessons-ai.js (lesson-ai-001) — task T477. Format: js/core/i18n.js (content overlay).
 * ids: lesson-ai-001
 */
App.i18n.content({
  'lesson-ai-001': {
    title: `AI Engineering Foundations: Calling LLM APIs, Error Handling, and Quality Measurement`,
    goals: [
      'Explain the three core components of AI Engineering: prompt, API contract, and measurement.',
      'Describe the request/response of OpenAI Chat Completions and Anthropic Messages API, and call them using java.net.http.HttpClient.',
      'Classify HTTP errors from providers and apply retry with exponential backoff + cap, respecting Retry-After.',
      'Compute precision@k, recall@k, and MRR to measure retrieval/recommendation quality instead of "it looks right".',
      'State the checklist for taking AI features to production: rate limit, retry, cache, logging, audit.',
    ],
    body: `**Summary:** AI Engineering is not "writing pretty prompts" but **programming systems around a non-deterministic service**: send a JSON request matching the contract, handle errors and rate limits, verify structured output, then **measure with numbers** to know whether a prompt/model change actually improves the system.

### 1. Three Core Components
1. **Prompt**: the conversation input consisting of a system prompt (role, rules), alternating {{user}}/{{assistant}} messages, and (optionally) tool definitions.
2. **API contract**: HTTP method, auth header, JSON body, timeout, error codes, quota. This is the part Java devs know best — and also get wrong most often.
3. **Measurement**: accuracy, precision@k, recall@k, schema violation rate, latency p95, cost per token.

> Never log API keys, full prompts, or user transcripts. Log only method, endpoint, status, duration, model, token counts, and the provider's request id.

### 2. What an LLM Call Looks Like
The two most common API styles:

| | OpenAI Chat Completions | Anthropic Messages |
|---|---|---|
| Endpoint | {{POST /v1/chat/completions}} | {{POST /v1/messages}} |
| Auth | {{Authorization: Bearer <key>}} | {{x-api-key: <key>}} + {{anthropic-version: 2023-06-01}} |
| System prompt | message with {{role: "system"}} | top-level {{system}} field |
| Output limit | {{max_tokens}} / {{max_completion_tokens}} (optional) | {{max_tokens}} (**required**) |
| Response content | {{choices[0].message.content}} | {{content}} array of blocks; text block has {{type: "text"}} |
| Stop reason | {{finish_reason}} ({{stop}}, {{length}}, {{tool_calls}}) | {{stop_reason}} ({{end_turn}}, {{max_tokens}}, {{tool_use}}) |
| Token count | {{usage.prompt_tokens}} / {{completion_tokens}} | {{usage.input_tokens}} / {{output_tokens}} |

Calling with plain JDK (Java 11+), no SDK needed:

~~~java
HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5)).build();
String body = """
    {"model": "claude-sonnet-4-5", "max_tokens": 512,
     "system": "You are a senior Java interviewer.",
     "messages": [{"role": "user", "content": "Ask me 1 question about HashMap"}]}
    """;
HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.anthropic.com/v1/messages"))
        .timeout(Duration.ofSeconds(60))            // LLM is slow: read timeout longer than connect
        .header("x-api-key", System.getenv("ANTHROPIC_API_KEY")) // key from env/secret manager
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();
HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
if (res.statusCode() != 200) { /* classify error, see section 3 */ }
// parse res.body() with Jackson; DO NOT concatenate JSON strings by hand in production
~~~

### 3. Errors and Retry: The Part That Decides Reliability
| Status | Meaning | Retry? |
|---|---|---|
| 400 / 404 / 422 | bad request (schema, model not found, prompt too long) | No, fix code |
| 401 / 403 | invalid key or no permission | No, alert |
| 429 | rate limit (requests/min or tokens/min) | Yes, prefer {{retry-after}} header |
| 500 / 502 / 503 / 504 | provider or gateway error | Yes, backoff |
| 529 (Anthropic) | {{overloaded_error}}: system overloaded | Yes, backoff |

Backoff formula: {{delay = min(cap, base * 2^attempt)}}, plus **random jitter** so thousands of clients don't retry at the same instant (thundering herd). Always have a **max attempt count**. Infinite retry on 4xx only burns quota and never succeeds.

**Structured output**: when you need JSON, don't trust "the model will return JSON". Use the provider's feature ({{response_format}} type {{json_schema}} at OpenAI, or tool use with {{input_schema}} at Anthropic), then **still validate on your server**. Parse failure = error (e.g., map to 502 {{bad_json}}), maybe retry once, but never fabricate fake JSON.

### 4. Measurement: Measure with Numbers, Not Feelings
For RAG or recommendation, the system returns a ranked list. Let {{relevant}} be the set of correct documents:
- **precision@k** = number of correct results in top-k / k: of the k items shown to the model, how many are useful?
- **recall@k** = number of correct docs in top-k / total correct docs: did we miss any important docs?
- **MRR** (mean reciprocal rank): average of 1/position of the first correct result; measures "is the good result near the top?".

Example: relevant = {a, b}, ranked = [a, c, b, d]. precision@2 = 1/2 = 0.5, recall@2 = 1/2 = 0.5, recall@3 = 2/2 = 1.0, reciprocal rank = 1/1 = 1.0.

| Metric | Answers | Trap |
|---|---|---|
| precision@k | is context noisy? | large k lowers precision even if recall rises |
| recall@k | did we miss correct docs? | empty relevant needs explicit convention |
| MRR | is correct result at the top? | only looks at first correct result |

Run metrics on a fixed **golden dataset** (50–200 cases) every time you change prompt, model, or chunking — just like regression tests.

### 5. Production Checklist
- **Rate limit** on your side (per user) before hitting provider limits.
- **Retry** with backoff + jitter + cap, only for 429/5xx/529.
- **Timeout** clearly defined; use streaming for long output so UX doesn't hang.
- **Cache** results for identical inputs; use provider prompt caching for long system prompts.
- **Logging/audit**: request id, model, tokens, latency, cost; no secrets/PII.
- **Abstraction**: put the client behind an {{AiClient}} interface so unit tests use a fake, no real network calls.

### Interview notes
Interviewers often ask: "How do you integrate an LLM into a Java service reliably?". A good answer covers: contract and timeout, error classification (no retry on 4xx), backoff with jitter and cap, validate structured output, measure quality with golden dataset using precision/recall, and never log sensitive data.

> Senior tip: always record {{usage}} tokens per request in metrics. LLM cost scales with tokens, and a "mistake" prompt that stuffs 20 KB extra context can multiply the monthly bill many times over without anyone noticing if there's no dashboard.`,
    exercises: [
      {
        title: 'Classify HTTP Errors and Compute Backoff for AI Client',
        prompt: `Write class {{AiErrorHandler}} with 3 static methods:

1. {{classify(int status)}} returns a string:
   - {{"OK"}} for 200–299
   - {{"AUTH"}} for 401, 403
   - {{"RATE_LIMIT"}} for 429
   - {{"SERVER"}} for any status ≥ 500 (including 529 overloaded)
   - {{"BAD_REQUEST"}} for any other 4xx
2. {{retryable(int status)}}: true only when {{classify}} is {{RATE_LIMIT}} or {{SERVER}}.
3. {{delayMillis(int attempt, long baseMs, long capMs, String retryAfter)}} (attempt starts at 0):
   - if {{retryAfter}} is not null and is a valid integer seconds ≥ 0, return {{min(capMs, seconds * 1000)}};
   - otherwise return {{min(capMs, baseMs * 2^attempt)}}, **must not overflow** when attempt is large (e.g., 70).

No jitter in this exercise for deterministic testing.`,
        hints: [
          'Check status ranges in order: 2xx, 401/403, 429, >= 500, remaining 4xx are BAD_REQUEST.',
          'Use Long.parseLong in try/catch for retryAfter; ignore negative or non-numeric values.',
          'baseMs << attempt overflows when attempt is large: double in a loop and stop early once cap is reached.',
        ],
        explain: `### Solution
- {{classify}} groups status codes into categories business code understands. Check order matters: 429 must be caught **before** the "remaining 4xx" branch.
- {{retryable}} returns true only for transient errors. Retrying 400/401 is useless: a bad request stays bad, and just burns quota.
- {{delayMillis}} prefers {{retry-after}} because the provider knows exactly when quota recovers. No header? Use exponential backoff.

### Common Mistakes
- Writing {{baseMs * (1L << attempt)}}: with attempt = 70, the shift only uses the low 6 bits (70 mod 64 = 6) giving a wrong small value, while {{Math.pow}} then cast loses precision. A loop that stops at cap is safer.
- Forgetting cap: retry #15 waits for hours.
- HTTP-standard {{retry-after}} can also be an HTTP-date; this exercise only handles numeric seconds, but production should handle both.

> Senior tip: in production add full jitter ({{random(0, delay)}}) and bound total retry time by the original request's deadline. If your API has a 30-second timeout, you must not retry until second 45.`,
      },
      {
        title: 'Measure Retrieval Quality: precision@k, recall@k, Reciprocal Rank',
        prompt: `A RAG system returns a ranked list of documents {{ranked}} (first element is best). You have a set of correct documents {{relevant}}. Write class {{RetrievalMetrics}} with 3 static methods:

1. {{precisionAtK(List<String> ranked, Set<String> relevant, int k)}}: number of **distinct** documents in top-k that belong to {{relevant}}, divided by {{k}}. If {{k <= 0}} return 0.0.
2. {{recallAtK(...)}}: number of **distinct** correct documents in top-k divided by {{relevant.size()}}. If {{relevant}} is empty return 0.0.
3. {{reciprocalRank(List<String> ranked, Set<String> relevant)}}: {{1.0 / position}} (1-based) of the first correct element; 0.0 if none.

Top-k means {{min(k, ranked.size())}} first elements. A document appearing multiple times in ranked counts only once.`,
        hints: [
          'Write a helper to count distinct correct docs in min(k, ranked.size()) first elements, using HashSet to deduplicate.',
          'Precision divides by k, recall divides by relevant.size(); remember to cast to double before dividing.',
          'reciprocalRank: stop at first correct element, position is 1-based so 1.0 / (i + 1).',
        ],
        explain: `### Solution
- Both precision and recall share the same numerator: distinct correct docs in top-k. Only denominators differ: precision divides by {{k}}, recall by {{relevant.size()}}.
- Dividing by {{k}} (not actual list length) is the standard convention: a system promising k slots is "penalized" if it returns fewer than k results.
- MRR for a dataset is the average of {{reciprocalRank}} across all queries.

### Common Mistakes
- Integer division: {{1 / 2}} is 0 in Java. Must cast to {{(double)}}.
- Counting duplicates: if retriever returns the same chunk twice, precision inflates; in production dedupe before feeding into prompt.
- 0-based position causing {{1.0 / 0}} = Infinity.

> Senior tip: when tuning RAG, plot recall@k vs k (k = 1, 3, 5, 10, 20). If recall@20 is still low, the problem is chunking/embedding — increasing k or adding a re-ranker won't fix it. If recall@20 is high but recall@5 is low, a re-ranker is worth the investment.`,
      },
    ],
    check: [
      {
        q: 'When calling Anthropic Messages API ({{POST /v1/messages}}), which of the following is **correct**?',
        options: [
          'Auth via {{x-api-key}} header plus {{anthropic-version}}; {{max_tokens}} is required.',
          'Auth via {{Authorization: Bearer}} and system prompt is a message with role "system".',
          'Response content is at {{choices[0].message.content}}.',
          'No {{max_tokens}} needed because the model stops when done.',
        ],
        explain: `Messages API uses {{x-api-key}} + {{anthropic-version}}, system prompt is the top-level {{system}} field, and {{max_tokens}} is required. {{Authorization: Bearer}}, role "system", and {{choices[0].message.content}} are characteristics of OpenAI Chat Completions, so options 2 and 3 are wrong. Option 4 is wrong because missing {{max_tokens}} causes a 400 rejection.`,
      },
      {
        q: 'relevant = {a, b}, ranked = [a, c, b, d]. precision@2 and recall@3 are?',
        options: ['1.0 and 0.5', '0.5 and 1.0', '0.5 and 0.5', '0.25 and 1.0'],
        explain: `Top-2 = [a, c]: only a is correct so precision@2 = 1/2 = 0.5. Top-3 = [a, c, b] contains both a and b so recall@3 = 2/2 = 1.0. "1.0 and 0.5" swaps the two metrics; "0.5 and 0.5" is recall@2 not recall@3; 0.25 divides by 4 (full list length) instead of k = 2.`,
      },
      {
        q: 'An AI client receives the following statuses in sequence. Which status **should** be retried with backoff?',
        options: [
          '400 Bad Request due to prompt exceeding context window',
          '401 Unauthorized',
          '422 Unprocessable Entity due to invalid JSON schema',
          '429 Too Many Requests with retry-after header',
        ],
        explain: `429 is a transient error: wait per {{retry-after}} and retry succeeds. 400 from prompt too long will still be too long on retry — need to trim context. 401 is invalid/revoked key: retry only adds more failed requests; alert instead. 422 from schema error requires fixing the request.`,
      },
      {
        q: 'The model sometimes returns unparsable JSON even though you asked for JSON output. Which server-side handling is most appropriate?',
        options: [
          'Return a default JSON with score 3/5 so the UI does not break.',
          'Retry infinitely until it parses.',
          'Use provider structured output/tool schema, validate on server; on parse error, limited retry then return a clear error.',
          'Log the full prompt and response for audit then ignore.',
        ],
        explain: `Provider-enforced schema reduces error rate, server validation catches the rest, and errors return a clear code (e.g., 502 {{bad_json}}). Returning fake JSON fabricates results for users. Infinite retry burns money and may hang the request. Logging full prompt/response violates the no-sensitive-data rule and does not fix the error.`,
      },
    ],
  },
});