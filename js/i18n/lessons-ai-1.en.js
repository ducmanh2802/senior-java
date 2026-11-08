/*
 * English translation of js/data/lessons-ai.js (lesson-ai-001) — task T1065. Format: js/core/i18n.js (content overlay).
 * ids: lesson-ai-001
 */
App.i18n.content({
  'lesson-ai-001': {
    title: `AI Engineering Foundations: calling LLM APIs, handling errors, and measuring quality`,
    goals: [
      'Explain the 3 core components of AI Engineering: prompt, API contract, and measurement.',
      'Describe the request/response of OpenAI Chat Completions and Anthropic Messages API, and call them using java.net.http.HttpClient.',
      'Classify HTTP errors from a provider and apply retry with exponential backoff + cap, respecting Retry-After.',
      'Compute precision@k, recall@k, and MRR yourself to measure retrieval/recommendation quality instead of "it looks right".',
      'List the checklist for taking an AI feature to production: rate limit, retry, cache, logging, audit.',
    ],
    body: `**Summary:** AI Engineering is not "writing prettier prompts" but **programming a system around a non-deterministic service**: send a JSON request that matches the contract, handle errors and rate limits, validate structured output, then **measure with numbers** to know whether a prompt/model change actually improves the system.

### 1. Three core components
1. **Prompt**: the conversation input consisting of a system prompt (role, rules), alternating {{user}}/{{assistant}} messages, and (optionally) tool definitions.
2. **API contract**: HTTP method, authentication header, JSON body, timeout, error codes, quota. This is the part a Java dev knows best and also gets wrong most often.
3. **Measurement**: accuracy, precision@k, recall@k, schema-violation rate, latency p95, cost per token.

> Never log the API key, the full prompt, or user transcripts. Logs should only keep method, endpoint, status, duration, model, token counts, and the provider request id.

### 2. What does an LLM call look like?
Two common API styles:

| | OpenAI Chat Completions | Anthropic Messages |
|---|---|---|
| Endpoint | {{POST /v1/chat/completions}} | {{POST /v1/messages}} |
| Authentication | {{Authorization: Bearer <key>}} | {{x-api-key: <key>}} + {{anthropic-version: 2023-06-01}} |
| System prompt | a message with {{role: "system"}} | top-level {{system}} field |
| Output limit | {{max_tokens}} / {{max_completion_tokens}} (optional) | {{max_tokens}} (**required**) |
| Response content | {{choices[0].message.content}} | a {{content}} array of blocks; a text block has {{type: "text"}} |
| Stop reason | {{finish_reason}} ({{stop}}, {{length}}, {{tool_calls}}) | {{stop_reason}} ({{end_turn}}, {{max_tokens}}, {{tool_use}}) |
| Token count | {{usage.prompt_tokens}} / {{completion_tokens}} | {{usage.input_tokens}} / {{output_tokens}} |

Calling with plain JDK (Java 11+), no SDK required:

~~~java
HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5)).build();
String body = """
    {"model": "claude-sonnet-4-5", "max_tokens": 512,
     "system": "You are a senior Java interviewer.",
     "messages": [{"role": "user", "content": "Ask me 1 question about HashMap"}]}
    """;
HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.anthropic.com/v1/messages"))
        .timeout(Duration.ofSeconds(60))            // LLMs are slow: read timeout longer than connect timeout
        .header("x-api-key", System.getenv("ANTHROPIC_API_KEY")) // key from env/secret manager
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();
HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
if (res.statusCode() != 200) { /* classify the error, see section 3 */ }
// parse res.body() with Jackson; DO NOT concatenate JSON strings by hand in production
~~~

### 3. Errors and retry: the part that decides stability
| Status | Meaning | Retry? |
|---|---|---|
| 400 / 404 / 422 | bad request (schema, model does not exist, prompt too long) | No, fix the code |
| 401 / 403 | wrong key or no permission | No, alert |
| 429 | rate limit (requests/min or tokens/min) | Yes, prefer the {{retry-after}} header |
| 500 / 502 / 503 / 504 | provider or gateway error | Yes, backoff |
| 529 (Anthropic) | {{overloaded_error}}: system overloaded | Yes, backoff |

Backoff formula: {{delay = min(cap, base * 2^attempt)}}, plus **random jitter** so thousands of clients do not retry at the same time (thundering herd). Always have a **maximum number of attempts**. Retrying 4xx forever only burns quota and will never succeed.

**Structured output**: when you need JSON, do not trust "the model will return JSON". Use the provider feature ({{response_format}} with {{json_schema}} on OpenAI, or tool use with {{input_schema}} on Anthropic), then **still validate** on the server. If parsing fails, treat it as an error (e.g. map to 502 {{bad_json}}), you may retry once, and never fabricate fake JSON.

### 4. Measurement: measure with numbers, not feelings
For RAG or recommendations, the system returns a ranked list. Let {{relevant}} be the set of correct documents:
- **precision@k** = number of correct results in top-k / k: of the k items you give the model, how many are useful?
- **recall@k** = number of correct documents in top-k / total number of correct documents: did you miss important documents?
- **MRR** (mean reciprocal rank): the average of 1/position of the first correct result; measures "is the good result near the top?".

Example: relevant = {a, b}, ranked = [a, c, b, d]. precision@2 = 1/2 = 0.5, recall@2 = 1/2 = 0.5, recall@3 = 2/2 = 1.0, reciprocal rank = 1/1 = 1.0.

| Metric | Answers the question | Trap |
|---|---|---|
| precision@k | is the context noisy? | a large k lowers precision even as recall rises |
| recall@k | did we miss correct documents? | when relevant is empty you need a clear convention |
| MRR | is the correct result near the top? | only considers the first correct result |

Run metrics on a fixed **golden dataset** (50–200 cases) every time you change the prompt, model, or chunking, just like a regression test.

### 5. Production checklist
- **Rate limit** on your side (per user) before you hit the provider limit.
- **Retry** with backoff + jitter + cap, only for 429/5xx/529.
- **Timeouts** set clearly; use streaming for long outputs so the UX does not hang.
- **Cache** results for identical inputs; use provider prompt caching for a long system prompt.
- **Logging/audit**: request id, model, tokens, latency, cost; do not log secrets/PII.
- **Abstraction**: put the client behind an {{AiClient}} interface so unit tests use a fake, not the real network.

### Interview connection
Interviewers often ask: "How do you integrate an LLM into a Java service reliably?". A good answer covers: contract and timeout, error classification (do not retry 4xx), backoff with jitter and cap, validating structured output, measuring quality with a golden dataset using precision/recall, and not logging sensitive data.

> Senior tip: always record {{usage}} tokens for every request in your metrics. LLM cost grows with tokens, and a prompt that accidentally adds 20 KB of extra context can multiply the monthly bill many times over without anyone noticing if there is no dashboard.`,
    exercises: [
      {
        title: 'Classify HTTP errors and compute backoff for an AI client',
        prompt: `Write class {{AiErrorHandler}} with 3 static methods:

1. {{classify(int status)}} returns a string:
  - {{"OK"}} for 200–299
  - {{"AUTH"}} for 401, 403
  - {{"RATE_LIMIT"}} for 429
  - {{"SERVER"}} for any status ≥ 500 (including 529 overloaded)
  - {{"BAD_REQUEST"}} for any other 4xx
2. {{retryable(int status)}}: true only when {{classify}} is {{RATE_LIMIT}} or {{SERVER}}.
3. {{delayMillis(int attempt, long baseMs, long capMs, String retryAfter)}} (attempt starts at 0):
  - if {{retryAfter}} is not null and is a valid integer number of seconds ≥ 0, return {{min(capMs, seconds * 1000)}};
  - otherwise return {{min(capMs, baseMs * 2^attempt)}}, **must not overflow** when attempt is large (e.g. 70).

Do not use jitter in this exercise so tests stay deterministic.`,
        hints: [
          'Check status ranges in order: 2xx, 401/403, 429, >= 500, everything else is BAD_REQUEST.',
          'Use Long.parseLong in try/catch for retryAfter; a negative value or non-number should be ignored.',
          'baseMs << attempt overflows for a large attempt: double in a loop and stop early once you pass the cap.',
        ],
        explain: `### Solution
- {{classify}} groups statuses into categories the business code understands. Order matters: 429 must be caught **before** the "other 4xx" branch.
- {{retryable}} only returns true for transient errors. Retrying 400/401 is useless: a bad request sent again is still bad and only burns quota.
- {{delayMillis}} prefers {{retry-after}} because the provider knows exactly when quota recovers. Without the header, use exponential backoff.

### Common mistakes
- Writing {{baseMs * (1L << attempt)}}: with attempt = 70, the shift only keeps the low 6 bits (70 mod 64 = 6) so it produces a wrong small value, while {{Math.pow}} then cast loses precision. A loop that stops at the cap is safer.
- Forgetting the cap: retry #15 could wait for hours.
- The {{retry-after}} header in HTTP can also be an HTTP-date; this exercise only handles the seconds form, production should handle both.

> Senior tip: in production add full jitter ({{random(0, delay)}}) and limit total retry time to the deadline of the original request. If your API has a 30-second timeout, you must not keep retrying into second 45.`,
      },
      {
        title: 'Measure retrieval quality: precision@k, recall@k, reciprocal rank',
        prompt: `A RAG system returns a ranked list {{ranked}} (the first element is best). You have a set of correct documents {{relevant}}. Write class {{RetrievalMetrics}} with 3 static methods:

1. {{precisionAtK(List<String> ranked, Set<String> relevant, int k)}}: the number of **distinct** documents in the top-k that belong to {{relevant}}, divided by {{k}}. If {{k <= 0}} return 0.0.
2. {{recallAtK(...)}}: the number of **distinct** correct documents in the top-k divided by {{relevant.size()}}. If {{relevant}} is empty return 0.0.
3. {{reciprocalRank(List<String> ranked, Set<String> relevant)}}: {{1.0 / position}} (starting at 1) of the first correct element; 0.0 if none.

Top-k means {{min(k, ranked.size())}} first elements. A document that appears more than once in ranked is counted only once.`,
        hints: [
          'Write a helper that counts distinct correct documents in the first min(k, ranked.size()) elements, using a HashSet to remove duplicates.',
          'precision divides by k, recall divides by relevant.size(); cast to double before dividing.',
          'reciprocalRank: stop at the first correct element; position starts at 1 so it is 1.0 / (i + 1).',
        ],
        explain: `### Solution
- Both precision and recall share the same numerator: the number of distinct correct documents in the top-k. Only the denominator differs: precision divides by {{k}}, recall divides by {{relevant.size()}}.
- Dividing by {{k}} (not the actual number of elements) is a common convention: a system that returns fewer than k results is still "penalized" because it promised k slots.
- Dataset MRR is the average of {{reciprocalRank}} over all queries.

### Common mistakes
- Integer division: {{1 / 2}} is 0 in Java. You must cast {{(double)}}.
- Counting duplicates: if the retriever returns the same chunk twice, precision gets inflated; in production dedupe before putting results into the prompt.
- Starting positions at 0 makes {{1.0 / 0}} become Infinity.

> Senior tip: when tuning RAG, plot recall@k against k (k = 1, 3, 5, 10, 20). If recall@20 is still low, the problem is in chunking/embedding — raising k or adding a re-ranker will not save it. If recall@20 is high but recall@5 is low, a re-ranker is worth the cost.`,
      },
    ],
    check: [
      {
        q: 'When calling the Anthropic Messages API ({{POST /v1/messages}}), which of the following is **correct**?',
        options: [
          'Authenticate with the {{x-api-key}} header plus {{anthropic-version}}; {{max_tokens}} is required.',
          'Authenticate with {{Authorization: Bearer}} and the system prompt is a message with role "system".',
          'The response content is at {{choices[0].message.content}}.',
          'No {{max_tokens}} is needed because the model stops when it finishes answering.',
        ],
        answer: 0,
        explain: `The Messages API uses {{x-api-key}} + {{anthropic-version}}, the system prompt is the top-level {{system}} field, and {{max_tokens}} is required. {{Authorization: Bearer}}, role "system", and {{choices[0].message.content}} are characteristics of OpenAI Chat Completions, so options 2 and 3 are wrong. Option 4 is wrong because omitting {{max_tokens}} makes the request rejected with a 400 error.`,
      },
      {
        q: 'relevant = {a, b}, ranked = [a, c, b, d]. What are precision@2 and recall@3 respectively?',
        options: ['1.0 and 0.5', '0.5 and 1.0', '0.5 and 0.5', '0.25 and 1.0'],
        answer: 1,
        explain: `Top-2 = [a, c]: only a is correct so precision@2 = 1/2 = 0.5. Top-3 = [a, c, b] contains both a and b so recall@3 = 2/2 = 1.0. "1.0 and 0.5" swaps the two metrics; "0.5 and 0.5" is recall@2, not recall@3; 0.25 divides by 4 (the whole list length) instead of k = 2.`,
      },
      {
        q: 'An AI client receives the following statuses in sequence. Which status **should** be retried with backoff?',
        options: [
          '400 Bad Request because the prompt exceeds the context window',
          '401 Unauthorized',
          '422 Unprocessable Entity due to an invalid JSON schema',
          '429 Too Many Requests with a retry-after header',
        ],
        answer: 3,
        explain: `429 is a transient error: wait according to {{retry-after}} and retrying will succeed. A 400 because the prompt is too long is still too long on retry; you must trim context. 401 means the key is wrong or revoked: retrying only creates more failed requests and needs an alert. 422 due to a bad schema requires fixing the request.`,
      },
      {
        q: 'The model sometimes returns JSON that cannot be parsed even though you asked for JSON output. Which server-side handling is most appropriate?',
        options: [
          'Return a default JSON with score 3/5 so the UI does not break.',
          'Retry forever until parsing succeeds.',
          'Use the provider structured output/tool schema, validate on the server; on parse failure retry a limited number of times then return a clear error.',
          'Log the full prompt and response for audit and ignore the error.',
        ],
        answer: 2,
        explain: `Constraining the schema on the provider side reduces the error rate, server validation catches the rest, and on failure you return a clear code (e.g. 502 {{bad_json}}). Returning fake JSON fabricates a result for the user. Retrying forever burns money and can hang the request. Logging the full prompt/response violates the rule against storing sensitive data and does not fix the error.`,
      },
    ],
  },
});
