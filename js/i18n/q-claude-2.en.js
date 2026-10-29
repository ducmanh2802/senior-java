/*
 * English translation of js/data/q-claude.js — task T395. Format: js/core/i18n.js (content overlay).
 * ids: claude-010 claude-011 claude-012 claude-013 claude-014 claude-015 claude-016 claude-017 claude-018
 */
App.i18n.content({
  'claude-010': {
    q: 'The boss asks: "How much will the Claude-powered document summarization feature cost per month?". How do you estimate this?',
    a: `**Summary:** Cost = input tokens × input price + output tokens × output price (+ cache write/read if applicable), **calculated per request and scaled by volume**. Measure actual tokens using the **token counting** endpoint ({{POST /v1/messages/count_tokens}}) or the {{usage}} of several dozen sample requests, then create a table for low / medium / high scenarios, accompanied by cost-reduction levers.

### Quick insight
It's like calculating an electricity bill: kWh × unit price. Here, "kWh" are tokens. Input (the documents submitted) usually outweighs output (the summary), but output is more expensive per token, so both must be calculated.

### Terminology
- **MTok**: one million tokens; pricing is quoted in $/MTok.
- **count_tokens**: an endpoint to count the input tokens of a request without generating output.
- **Tokenizer**: the method of splitting text into tokens; this can vary between model generations, so always re-count when switching models.

### Estimation steps
1. **Sample**: 30–50 representative real-world documents (short, medium, long).
2. **Count input tokens** using count_tokens with the exact model and prompt to be used (Vietnamese usually consumes more tokens than English for the same content).
3. **Estimate output**: run a few tests, read {{usage.output_tokens}}; or set a target (e.g., ~300 tokens).
4. **Scale by volume**: number of documents/month.
5. **Apply pricing** based on model, and calculate for 2–3 models for the boss to choose from.

### Example calculation
Assuming 100,000 documents/month, each with 6,000 input tokens (including 1,000 tokens for the prompt) and 300 output tokens.

| Model | Input ($/MTok) | Output ($/MTok) | Input/month | Output/month | Total |
|---|---|---|---|---|---|
| Haiku 5.5 | 0.10 | 0.50 | 600M → $60 | 30M → $15 | **~$75** |
| Sonnet 5.5 | 2 | 10 | 600M → $1,200 | 30M → $300 | **~$1,500** |
| Opus 5.5 | 4 | 20 | 600M → $2,400 | 30M → $600 | **~$3,000** |

(Pricing per current rates; Haiku 5.5 has higher pricing when the prompt exceeds 100K tokens. Check the Pricing page before reporting.)

### Cost-reduction levers to include
- **Batch API** if real-time results aren't needed: 50% discount.
- **Prompt caching** for the shared instructions (1,000 tokens × 100,000 requests).
- **Select model based on measured quality**: run eval on samples, if Haiku meets requirements, save 20x compared to Sonnet.
- **Limit max_tokens** and explicitly request the desired summary length.
- **Lower effort** for simple tasks.

### Common pitfalls
- **Estimating by "character count divided by 4"**: highly inaccurate for Vietnamese and code. Always count via API.
- **Forgetting tokens for system prompt, history, and tool definitions**: these are counted in the input for every request.
- **Forgetting retry and failed requests**: add ~5–10% contingency buffer.
- **Not separating costs by feature**: ending the month with just a total figure, making it impossible to know where to optimize.

### Interview answer (1 minute)
"I take a sample of real documents, count the input tokens using the count_tokens endpoint with the actual prompt and model, run tests to determine average output, then scale by volume and apply pricing for different models. For 100k docs, with 6k input tokens and 300 output tokens each, Haiku costs ~$75, Sonnet ~$1,500, and Opus ~$3,000 per month. I present this along with levers: Batch API for 50% off, prompt caching for shared prompt segments, and selecting the cheapest model that meets the quality threshold based on eval results."

> Senior tip: Report costs per **completed task** (e.g., $0.015/document), not cost per request. A cheap model that requires 3 retries due to errors is not cheap at all.`,
    follow: ['How does the Haiku 5.5 calculation change if the document exceeds 100K tokens?', 'How do you prove Haiku is "good enough" for this task?']
  },
  'claude-011': {
    q: 'Compare the current Claude models (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1). How do you select a model for each feature of a product?',
    a: `**Summary:** Four tiers based on capability and price:
- **Haiku 5.5**: cheap, fastest ($0.10/$0.50 per MTok for prompts ≤ 100K tokens).
- **Sonnet 5.5**: balanced speed and capability ($2/$10).
- **Opus 5.5**: strong for difficult tasks and long-context agents ($4/$20); Anthropic's recommended default for most tasks.
- **Fable 5.1**: strongest for extremely difficult reasoning, longer runtime ($10/$50).

All have 1M context, max 128K output. Select models based on **evals on real data**, not gut feeling: start with a model likely to meet requirements, then try downscaling to a cheaper model or lowering **effort** to see if quality holds up.

### Quick insight
It's like hiring staff: interns (Haiku) work fast on simple tasks like classification; engineers (Sonnet) handle most day-to-day work; seniors (Opus) tackle complex, multi-step work; industry experts (Fable) handle the hardest problems, albeit slower and more expensive. You don't hire an expert to sort emails.

### Terminology
- **Effort**: "cognitive effort" level ({{low}} → {{max}}) within a model, the first cost lever before switching models.
- **Eval**: a test set with ground truth or grading criteria used to measure quality objectively.
- **Routing**: selecting a model based on the request type.

### Feature recommendation table
| Feature | Starting model | Reason |
|---|---|---|
| Ticket classification, tagging, simple extraction | Haiku 5.5 | High volume, needs speed and low cost |
| Customer support chatbot, summarization | Sonnet 5.5 | Balanced quality and latency |
| Coding agent, multi-step analysis, complex tool use | Opus 5.5 | Consistent on long-form tasks |
| Deep research, extremely difficult problems that Opus at high effort fails to solve | Fable 5.1 | More expensive/slower, only use when proven beneficial |

### Step-by-step selection process
1. Build an eval with 50–200 cases for the feature, with clear grading criteria.
2. Run on 2–3 models or effort levels; record quality score, p95 latency, and **cost per completed task**.
3. Select the cheapest option meeting the threshold; document the results for future comparison when upgrading models.
4. For mixed routes: simple router (by feature type) is usually sufficient; "smart" routers that use a model to select a model should only be used when benefits are proven.

### Common pitfalls
- **Using the strongest model for everything** → bills 10–40x higher with no perceptible difference for users.
- **Using the cheapest model for everything** → frequent retries and manual fixes actually increase real-world costs.
- **Not trying to lower effort first before switching models**: a stronger model at a lower effort level often outperforms a weaker model at a higher effort level.
- **Forgetting that cache is model-dependent**: cascading multiple models breaks caching benefits.
- **Recording model IDs with self-guessed date suffixes**: always use the exact IDs from the documentation (e.g., {{claude-sonnet-5-5}}).

### Interview answer (1 minute)
"There are four tiers: Haiku 5.5 for cheap/fast high-volume classification/extraction, Sonnet 5.5 for balanced chatbot/summarization, Opus 5.5 for complex/long-form tasks, and Fable 5.1 for the hardest problems. All have 1M context. I don't select by gut feeling; I build an eval on real data, run models and effort levels, compare quality, p95 latency, and cost per completed task, then choose the cheapest that hits the quality threshold. I usually try lowering the effort level before switching to a smaller model."

> Senior tip: Store {{model}} and prompt version alongside every result in your DB. When Anthropic releases a new model, you can re-run the exact same old eval set and have comparative data in one afternoon, instead of relying on gut feelings.`,
    follow: ['Where should the model selection router be placed in the architecture?', 'When upgrading from an old model to a new one, what do you check?']
  },
  'claude-012': {
    q: 'What are "Adaptive thinking" and the "effort" parameter on current Claude models? How do you configure them for simple vs. complex tasks?',
    a: `**Summary:** **Thinking** is the model's "internal deliberation" before responding. On current models, thinking is **adaptive**: the model decides how much to think. Control depth with {{output_config.effort}} ({{low}}, {{medium}}, {{high}}, {{xhigh}}, {{max}}). The old "fixed thinking budget" ({{budget_tokens}}) has been deprecated on 5.x models (sending it returns 400). On **Opus 5.5**, thinking cannot be disabled and the default effort is {{medium}}.

### Quick insight
Effort is like telling an employee: "get it done quickly" vs "think carefully before acting". The same person (model) thinks better with more effort on hard tasks, but for simple tasks, thinking harder doesn't help—it just costs more and takes longer.

### Terminology
- **Thinking block**: a block of {{type: "thinking"}} in the content. By default on many current models it's **omitted** ({{display: "omitted"}}); set {{display: "summarized"}} to receive a summary of the thinking. Raw thought is never returned.
- **Effort**: a quality/cost lever within a model, affecting both deliberation tokens and tool-call frequency.

### Configuration by task type
| Task type | Suggested effort | Note |
|---|---|---|
| Classification, extraction, short chat | low | Fast, cheap, usually sufficient |
| Summarization, writing, Q&A with reasoning | medium | Default for Opus 5.5 and Haiku 5.5 |
| Coding, multi-step agents, difficult analysis | high or xhigh | Worth the cost on long-form tasks |
| When correctness outweighs cost | max | Only when benefits are proven |

~~~json
{
  "model": "claude-opus-5-5",
  "max_tokens": 16000,
  "thinking": { "type": "adaptive", "display": "summarized" },
  "output_config": { "effort": "high" },
  "messages": [ { "role": "user", "content": "Find the cause of the deadlock in the following log..." } ]
}
~~~

### Step-by-step refinement
1. Start at the model's default effort; **explicitly set the effort** so you aren't surprised when switching models (Opus 5.5 defaults to medium, many others default to high).
2. Run evals at 2–3 effort levels, measuring quality, latency, and output tokens.
3. Choose the lowest level meeting requirements, **per route** rather than a system-wide value.
4. If displaying "thinking..." to the user: use {{display: "summarized"}} during streaming, otherwise the user sees a long blank pause.

### Common pitfalls
- **Sending thinking as {{disabled}} for Opus 5.5** → 400 error; lower effort instead of disabling thinking.
- **Sending budget_tokens** (configuration from 4.x era) for 5.x models → 400 error.
- **Sending temperature/top_p** on new API versions (2026-10-21) → 400 error on all models.
- **Deleting or modifying thinking blocks in history**: send assistant blocks back intact in subsequent turns. Editing history can invalidate the thinking block on models with "preserved thinking".

### Interview answer (1 minute)
"On current models, thinking is adaptive; the model decides how much to think, and I control depth using {{output_config.effort}} from low to max. The old budget_tokens parameter is gone on 5.x, and Opus 5.5 cannot disable thinking—it defaults to medium effort. I set effort explicitly per route: low for simple tasks, medium for summarization, high/xhigh for coding/agents, validated by eval. When streaming to users, I set display to summarized so they see deliberation progress."

> Senior tip: When upgrading models, **re-run the effort sweep**. The same named effort level is calibrated differently across different models, and sticking to old configuration is a common cause of "the new model feels slower/more expensive".`,
    follow: ['Why shouldn\'t you disable thinking on Opus 5.5 to save costs?', 'How do you display thinking progress to users during streaming?']
  },
  'claude-013': {
    q: 'You are integrating Claude into a Spring Boot system for thousands of users. What does a safe and stable architecture look like (API keys, timeouts, fault isolation, observability)?',
    a: `**Summary:** Implement an **internal gateway layer** (a service or {{AiClient}} module) as the sole location for the API key and Claude calls: the frontend **never** calls Claude directly. This layer handles timeouts, controlled retries, circuit breakers, bulkheads (concurrency limiting), user-based quotas, usage logging, and tracing; business logic only calls its interface.

### Quick insight
It's like a company having a single purchasing department authorized to contract with vendors: all departments submit requests through it. The purchasing department holds the keys (API key), manages the budget, and if a vendor is slow, it doesn't leave the whole company hanging.

### Terminology
- **Bulkhead**: prevents one slow AI call from consuming all application threads.
- **Secret manager**: where secrets are stored (AWS Secrets Manager, Vault, etc.) instead of in git-committed config files.
- **Correlation id**: an ID attached to requests to trace logs across services.

### Architecture
~~~text
Browser/Mobile --(JWT)--> Spring API --> AiClient (internal module/service)
                                           |- quota by user (Redis)
                                           |- bulkhead + timeout + circuit breaker
                                           |- retry (429/5xx, with jitter)
                                           |- log usage, cost, request-id, model
                                           v
                                     Claude API (key from secret manager)
~~~

### Step-by-step implementation
1. **API keys**: stored in a secret manager, injected via env variables; distinct keys per environment (dev/staging/prod), rotated periodically; never log keys.
2. **Timeouts**: short connection timeout (~5s); read timeout per route (chat streams can be long, synchronous jobs ~60s). Default SDK timeouts are ~10 minutes, too long for user-facing requests.
3. **Retry**: choose **one** retry layer (SDK default retries twice) for 429/5xx/529, with backoff and jitter.
4. **Circuit breaker + bulkhead** (Resilience4j): if AI errors persist, return a fallback like "AI service is temporarily busy" instead of hanging.
5. **User-level quotas**: prevent abuse like 1,000 requests/hour/user; also acts as a cost safeguard.
6. **Data handling**: minimize sensitive data sent (redact credit cards, PII per company policy).
7. **Observability**: log each call with route, model, input/output/cache tokens, latency, stop_reason, request-id; Micrometer metrics; OpenTelemetry tracing to see AI calls in context.

~~~java
@Service
class AiClient {
  private final Bulkhead bulkhead = Bulkhead.of("claude",
      BulkheadConfig.custom().maxConcurrentCalls(50).build());   // max 50 concurrent calls
  private final CircuitBreaker cb = CircuitBreaker.ofDefaults("claude");

  Answer ask(String userId, Prompt p) {
    quota.check(userId);                                         // Internal 429 if quota exceeded
    Supplier<Answer> call = () -> claude.send(p, Duration.ofSeconds(60));
    Answer a = Decorators.ofSupplier(call)
        .withBulkhead(bulkhead).withCircuitBreaker(cb)
        .withFallback(List.of(CallNotPermittedException.class), e -> Answer.busy())
        .get();
    usageLog.record(userId, p.route(), a.usage(), a.model(), a.requestId());
    return a;
  }
}
~~~

### Common pitfalls
- **Calling Claude from JavaScript in the browser with an API key** → keys compromised in minutes.
- **No timeouts** → when AI slows down, Tomcat thread pool is exhausted, crashing the entire app (even non-AI pages).
- **Each service calls Claude in its own way** → nobody knows the total cost, different retry policies.
- **Logging the full prompt with PII** → compliance risk; log metadata, control content storage.

### Interview answer (1 minute)
"I aggregate all Claude calls into an internal AiClient service, which is the only place authorized to hold the API key retrieved from a secret manager. The frontend only calls our own API. The AiClient features route-based timeouts, a retry layer for 429/5xx, circuit breakers and bulkheads to prevent AI slowness from crashing the app, and user quotas to prevent abuse and manage costs. Each call is logged with route, model, tokens, latency, stop_reason, and request-id, with Micrometer metrics and OpenTelemetry tracing. Sensitive data is redacted before submission."

> Senior tip: Add **feature flags** for each AI feature. When costs spike or a provider has an outage, you can disable that specific feature in seconds instead of redeploying.`,
    follow: ['How do you implement user-level quotas with Redis?', 'How do you perform integration tests for Claude in CI without incurring costs?']
  },
  'claude-014': {
    q: 'Users want to upload invoice images and contract PDFs for Claude to read. How do you send these via the Messages API, what are the limits, and when should you use the Files API?',
    a: `**Summary:** Send images as an {{image}} content block with {{source}} as {{base64}} or {{url}}; send PDFs as a {{document}} block (base64, with {{media_type: "application/pdf"}}). The model reads both text and images in the PDF. Main limit: request max 32 MB, PDFs max 600 pages (100 pages for 200K context models). If a file is reused multiple times, **upload once via Files API** then reference by {{file_id}}.

### Quick insight
Sending base64 is like photocopying a document and attaching it to every letter. Files API is like placing a document in a filing cabinet once and just writing "see file #X" on subsequent letters.

### Terminology
- **Base64**: encoding binary files into a string format for JSON embedding (~33% larger than the original file).
- **Files API**: an endpoint to upload files ({{POST /v1/files}}), returning a {{file_id}} for subsequent requests.
- **Citations**: a feature for Claude to accurately cite the specific source of information (enable {{citations.enabled}} on the document block).

### Example request
~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 2048,
  "messages": [{
    "role": "user",
    "content": [
      { "type": "document",
        "source": { "type": "base64", "media_type": "application/pdf", "data": "<base64 without line breaks>" } },
      { "type": "image",
        "source": { "type": "base64", "media_type": "image/jpeg", "data": "<base64>" } },
      { "type": "text", "text": "Compare the amount on the invoice with the payment terms in the contract." }
    ]
  }]
}
~~~
Place documents/images **before** the question: better for quality, and static documents at the start help with caching.

### Step-by-step backend processing
1. Receive upload, validate file type (via magic bytes, not just extension), size, page count.
2. Oversized images: resize before sending; large images consume many tokens without necessarily improving readability.
3. Long PDFs or files reused (multiple questions per contract): upload via Files API, store {{file_id}}; combine with prompt caching.
4. Need citations: enable {{citations.enabled}} to display snippets and page numbers. Note: citations are incompatible with structured outputs.
5. Scan for sensitive data per policy before sending.

### Common pitfalls
- **Base64 with line breaks** → request error.
- **Incorrect media_type** (e.g., PNG declared as JPEG) → error or incorrect processing.
- **Resending a 300-page PDF in base64 every turn** → wasted bandwidth/tokens; use Files API + caching.
- **Assuming data extracted from blurry images is 100% accurate** without user verification: AI-based OCR can err, requiring human confirmation for critical financial fields.

### Interview answer (1 minute)
"I send images as an image block with base64 source, and PDFs as a document block with base64 source—Claude handles both text and images in PDFs. The limit is 32 MB per request and 600 pages per PDF. I place documents before the question. If a user asks multiple questions on the same contract, I upload once via Files API, reference by file_id, and cache that part. For accuracy, I enable citations. The backend always validates file types, size, and requires human confirmation for critical financial fields."

> Senior tip: For financial workflows (invoices, contracts), design **human-in-the-loop**: AI extracts and flags confidence, humans review critical fields. The percentage of fields humans have to correct is the best quality metric to track.`,
    follow: ['How do you evaluate extraction accuracy for invoices?', 'How do citations improve experience and auditing?']
  },
  'claude-015': {
    q: 'The response stop_reason is "refusal". What does this mean, and how do you handle it in the product (including fallback model features)?',
    a: `**Summary:** {{refusal}} means the safety filter has rejected the request (HTTP remains 200). The response includes {{stop_details}} with a {{category}} (e.g., {{cyber}}, {{bio}}…) and {{explanation}}. Handling: **always check stop_reason before reading content**, display a friendly message, log metrics by category. Some new models (Opus 5.5, Fable 5.1, Sonnet 5.5…) support **server-side fallback**: the API automatically re-runs on a backup model within the same request.

### Quick insight
It's like a pharmacy refusing to fill a prescription: it's not a system error, but a deliberate decision. You shouldn't "try 10 times at the same counter"; instead, explain to the customer, and if the request is legitimate, route it to an appropriate channel.

### Terminology
- **Safety classifier**: automated filter checking requests/outputs against usage policies.
- **False positive**: incorrectly refusing a legitimate request (e.g., asking about security for your own system).
- **Fallback**: a backup model that runs when the primary model refuses.

### Enabling fallback example (Claude API)
~~~json
POST /v1/messages
anthropic-beta: server-side-fallback-2026-07-01

{
  "model": "claude-opus-5-5",
  "max_tokens": 4096,
  "fallbacks": "default",
  "messages": [ { "role": "user", "content": "..." } ]
}
~~~
The {{"default"}} mode lets the API choose a backup model based on the refusal type. This is in beta, implementation varies by platform (Bedrock/Vertex use SDK middleware) and doesn't work in Batch API. Check the "Refusals and fallback" docs before enabling.

### Step-by-step product handling
1. **Check stop_reason first**: on refusal, content may be empty or incomplete; don't store it as a successful response.
2. **Inform the user** clearly, suggesting rephrasing if the request was legitimate.
3. **Don't blindly retry** the same prompt; only retry after changing conditions (fallback, clearer context).
4. **Measure**: metric for refusal rate by route and category. Spikes after prompt/model changes signal a need for review.
5. **Reduce false positives** via context: state the legitimate context clearly in the system prompt (e.g., "internal security tool, analyzing company systems only").
6. **Check stop_reason again after fallback**: backup models can also refuse.

### Common pitfalls
- **Treating refusal as a 5xx error and retrying** → wasted cost, still refused.
- **Reading content[0].text without checking** → display empty string or null errors.
- **Attempting to "jailbreak" the filter** → violates usage policy, risks account suspension.
- **Not logging category** → impossible to distinguish actual abuse from feature-specific false positives.

### Interview answer (1 minute)
"Refusal means the safety filter rejected the request; HTTP status is still 200, so I always check stop_reason before reading content. stop_details provides the category and explanation. I display a friendly message, don't blindly retry, and log refusal rates by route/category to detect false positives. On newer models, I can enable server-side fallback, where the API automatically re-runs on a backup model in the same request, but it's a beta feature, so I check platform-specific docs and still check stop_reason after fallback."

> Senior tip: For specialized products prone to false positives (security, healthcare), build a **false-positive eval set** of legitimate queries. Run this every time you change a model or prompt to catch refusal spikes before customers do.`,
    follow: ['How do you reduce false positives for an internal security tool?', 'How do fallbacks impact cost and latency?']
  },
  'claude-016': {
    q: 'The Claude bill for your team tripled in one quarter. What do you do to reduce costs without compromising quality?',
    a: `**Summary:** Follow the order: **measure first, then "free wins" (no quality impact), and finally trade-offs**:
1. **Measure:** cost by route/feature, from {{usage}} or Usage & Cost API.
2. **Free wins:**
   - prompt caching;
   - cleaning up unnecessary tokens (long history, unused tool definitions, extraneous documents);
   - output limit;
   - fix agent loops calling tools unnecessarily;
   - Batch API for non-urgent work.
3. **Trade-offs:** lower effort, switch to smaller models proven by eval.

Evaluate using **cost per completed task**, not cost per request.

### Quick insight
It's like reducing company electricity bills: first install meters on each floor to know which floor is consuming most; then turn off lights in empty rooms (free wins); finally, consider installing less powerful AC (trade-offs) and measure if employees are still comfortable.

### Terminology
- **Free win**: optimization that doesn't change output quality.
- **Cost per completed task**: total cost (including retries, calls, agent tool usage) divided by the number of successfully completed tasks.
- **Token hygiene**: sending only what the model truly needs.

### Step-by-step process
1. **Map costs by route** for 2 weeks: input, output, cache write, cache read, number of requests, cost per task. Usually 20% of routes account for 80% of costs.
2. **Prompt caching**: cache system prompt, documents, tool definitions; aim for cache read to constitute the majority of input on routes with repetitive prefixes.
3. **Clean input**:
   - trim or summarize chat history;
   - remove tools unused by the route (but keep them stable within the route to avoid invalidating cache);
   - feed only relevant document segments (retrieval) instead of the whole archive.
4. **Clean output**: set clear length requirements, max_tokens close to actual needs, and don't make the model "re-explain the question".
5. **Agent loops**: limit max steps, detect loops, send concise tool results (don't dump 50KB logs into context).
6. **Batch API** for background jobs: 50% discount.
7. **Measured trade-offs**: try lower effort, then smaller models, validated by eval; only apply when quality threshold is maintained.
8. **Leak prevention**: quota by user/tenant, alert when daily budget is exceeded.

### Typical metrics
| Action | Typical impact |
|---|---|
| Cache 30K token system prompt on chat route | Input cost drops drastically (cache read ~0.1x) |
| Batch for overnight summarization jobs | -50% for that route |
| Haiku replaces Sonnet for classification (eval stable) | -95% for that route |
| Limit history to 20 turns + summarization | Chat input reduced 40–70% for long conversations |

### Common pitfalls
- **Switching to cheaper models without eval** → quality drops, users retry, actual cost increases.
- **Optimizing small routes** while ignoring the largest route.
- **Cascading models** "try cheap, if wrong call expensive": breaks cache, increases latency, often more expensive than a single model at low effort.
- **No cost owner**: every feature needs someone responsible for the budget.

### Interview answer (1 minute)
"I measure first: mapping costs per route based on usage, as a few routes usually dominate the bill. I implement free wins with no quality impact: prompt caching for repetitive segments, cleaning up inputs (history, unused tools), limiting output length, fixing agent tool-call loops, and moving background jobs to Batch API for a 50% discount. Finally, I consider trade-offs: lowering effort or switching to smaller models, but only after running evals and comparing cost per completed task. I finish by implementing quotas and alerts."

> Senior tip: Place **cost per task** on the product dashboard alongside quality metrics. When these two figures are side-by-side, "which model to use" debates become data-driven decisions.`,
    follow: ['How do you detect an agent loop wasting tokens?', 'How do you convince a product owner to accept a cheaper model?']
  },
  'claude-017': {
    q: 'Your team is running production on an older Claude model and wants to upgrade to Opus 5.5 or Sonnet 5.5. How do you plan the migration, and what breaking changes should you anticipate?',
    a: `**Summary:** Model migration is a **production change** like a major library upgrade; follow 4 steps:
1. **Audit** code and prompts.
2. **Fix breaking API changes.**
3. **Run comparative eval** for quality, cost, and latency.
4. **Gradual rollout** (canary/feature flag) with a rollback plan.

Common traps when upgrading to 5.x models:
- **forced tool_choice** ({{any}}/{{tool}}) returns 400 on Opus 5.5, Sonnet 5.5, Fable 5.1;
- **prefill** (pre-filling assistant response) is removed;
- **budget_tokens** is removed, replaced by **effort**;
- Opus 5.5 **cannot disable thinking** and defaults to {{medium}} effort;
- New API versions forbid {{temperature}}/{{top_p}}/{{top_k}}.

### Quick insight
It's like replacing an aircraft engine: the new engine is stronger and more efficient, but the mounting points, control requirements, and pilot habits all change. Test on the ground (eval), conduct short test flights (canary), then carry passengers.

### Terminology
- **Breaking change**: changes that cause old code to fail (usually 400).
- **Canary**: shifting a small portion of traffic (1–5%) to the new version for observation.
- **Prefill**: legacy technique of pre-filling the assistant's response to force formatting.

### Change checklist
| Old code | On 5.x model | Fix |
|---|---|---|
| tool_choice any/tool to force tool call | 400 (Opus 5.5, Sonnet 5.5, Fable 5.1) | tool_choice auto + prompt guidance + strict: true, or structured outputs |
| Prefill assistant to force JSON | 400 | structured outputs (output_config.format) or prompt guidance |
| thinking enabled + budget_tokens | 400 | thinking adaptive (or omit parameter) + output_config.effort |
| thinking disabled to save cost | 400 on Opus 5.5 (and Sonnet 5.5) | lower effort; Sonnet 5.5 supports between_tools type |
| temperature / top_p / top_k | 400 with API version 2026-10-21 | remove; control via prompt and effort |
| Old tokenizer | Token count may differ | re-count with count_tokens, review budget |

### Step-by-step plan
1. **Audit**: grep all API call sites (model id, tool_choice, thinking, temperature, prefill); list prompts by route.
2. **Fix breaking changes** on a separate branch, automated tests with mocks for each route.
3. **Parallel eval**: run old eval set on old vs. new models at 2–3 effort levels; compare quality, p95 latency, tokens, and cost per task.
4. **Prompt adjustment**: prompts written for older models are often too "command-heavy" or overly detailed; new models may perform better with concise instructions. Adjust based on observed eval errors.
5. **Rollout**: feature flag by route, start with 5%, monitor refusal rates, max_tokens hit rates, 400 errors, cost; scale up.
6. **Rollback plan**: keep the old model configuration runnable for a few weeks; log model + prompt version for comparison.

### Common pitfalls
- **Changing just the model ID and deploying** → widespread 400 errors on routes using tool_choice or prefill.
- **Keeping default effort** → Opus 5.5 defaults to medium, which might behave differently than what you're used to.
- **Not re-counting tokens** → context budget or cost calculations drift.
- **Editing history with thinking blocks** in the agent harness: for models with preserved thinking, keep history append-only.

### Interview answer (1 minute)
"I treat model migration as a production change. First, I audit all API call sites and prompts. Next, I fix breaking changes: forced tool_choice and prefill fail on Opus/Sonnet 5.5, so I move to tool_choice auto with strict or structured outputs. budget_tokens is replaced by effort, and I'm aware Opus 5.5 doesn't allow disabling thinking. Then, I run parallel evals at different effort levels to compare quality, latency, and cost per task, adjust prompts based on errors, and roll out via feature flags, starting at 5% and monitoring refusal rates and cost."

> Senior tip: Move **model ID, effort, and prompt version to configuration** (do not hard-code), accompanied by an automated eval set. The next migration then becomes just a config change and one eval run.`,
    follow: ['How do you build an eval set from production logs without exposing user data?', 'What if the new model performs better on 80% of cases but worse on 20%?']
  },
  'claude-018': {
    q: 'A large conglomerate (e.g., Samsung, tens of thousands of employees, multiple languages, documents in Confluence/SharePoint/Drive) wants Claude to answer based on internal knowledge. How do you design "knowledge" for Claude?',
    a: `**Summary:** There is no single approach. Select based on **size, volatility, and access control** of the knowledge:
- **Small and stable** (processes, glossary, core policies): put directly in system prompt or fixed documents, with **prompt caching**.
- **Large and highly volatile** (millions of wiki pages): **RAG** (retrieval), ideally **hybrid search** (vector + keyword), with access control filtering.
- **Live system data** (Jira, CRM, ERP): give Claude **access via tools/MCP** instead of copying.

For end users, Claude for Enterprise also offers Projects (attaching documents by project) and connectors to collaboration tools. Check features based on your current tier.

### Quick insight
It's like training new employees at a conglomerate:
- "Employee handbook" (few dozen pages) -> give them to read (system prompt + cache).
- Knowledge base (millions of pages) -> teach them **how to look up** information (RAG).
- Real-time data (inventory, tickets) -> grant **system access** (tools/MCP) instead of printing, because printed versions are already obsolete.

### Terminology
- **RAG (Retrieval-Augmented Generation)**: retrieve relevant document segments and insert into the prompt for the model to answer based on that.
- **Embedding**: a numeric vector representing text meaning to find "semantic similarity". Anthropic doesn't provide an embedding model; vendors specializing in this are typically used.
- **Hybrid search**: combining vector search (meaning) and BM25 (exact keyword matching, e.g., "SM-S928").
- **Contextual retrieval**: Anthropic's technique: before embedding, add 1–2 sentences of context to each chunk (which document, what topic) for more accurate retrieval.
- **MCP (Model Context Protocol)**: an open standard for connecting models to tools/data (Jira, Drive, DB) via an "MCP server".

### Proposed architecture
~~~text
Source: Confluence, SharePoint, Drive, PDF processes, Jira, ERP
   | (ingest pipeline: normalize, chunk, add metadata: dept, lang, ACL, update date)
   v
Knowledge store: vector index + BM25 index (+ ACL per document)
   |
Question --> [Auth: user, dept] --> Retrieval (hybrid, filter by ACL) --> top 10–20 chunks
                                                              |
          Fixed system prompt (cache) + retrieved chunks + question --> Claude
                                                              |
                          Answer + citations (doc links, update date)
Live data (inventory, tickets) --> MCP server / tool with access control
~~~

### Step-by-step implementation
1. **Categorize knowledge**: stable core / large repository / live data. Each needs a different mechanism as shown above.
2. **Access control (ACL) is #1**: filter by ACL **before** injecting into the prompt. The model must not see documents the user isn't authorized to view.
3. **Data quality**: remove duplicates and stale versions, add update dates, document owners. RAG on trash data yields trash answers.
4. **Multi-language**: for Korean, English, Vietnamese documents, use multi-lingual embeddings; Claude answers in the user's language, citing sources.
5. **Enforce citations**: require the model to cite sources and say "I cannot find this in the documents" when uncertain, reducing hallucinations.
6. **Eval**: eval set with real questions from each department with answers; measure correctness, citation accuracy, and legitimate "I don't know" rates.
7. **Ops**: incremental ingest (only documents that changed), monitor unanswered questions to identify knowledge gaps.

### Selection guide
| Scenario | Approach |
|---|---|
| Knowledge < ~hundreds of thousands of tokens, infrequent changes | Inject directly into context + caching (1M context) |
| Large repository, frequent changes, requires filtering | RAG hybrid + ACL |
| Real-time data, requires operations | Tool / MCP with minimum privilege |
| Projects by project on Claude app | Projects / Enterprise connectors |

### Common pitfalls
- **Dumping the whole wiki into vector DB without ACL** → employees query others' salaries.
- **Using only vector search** → missing queries for exact codes (model codes, error codes).
- **No update dates/sources** → users don't know if the answer relies on old or new processes.
- **Fine-tuning to "inject knowledge"**: expensive, hard to update, hard to apply ACL. For corporate knowledge, retrieval is almost always the right choice.

### Interview answer (1 minute)
"I categorize knowledge into three types. Stable core knowledge like policies/glossary goes straight into system prompt and is cached, leveraging the 1M context. Large, frequently changing repositories use RAG with hybrid search (vector + keyword), contextual retrieval, and most importantly, ACL filtering before prompt injection. Live data like inventory or tickets is accessed via tools or MCP server with minimum privilege. Answers always include citations and update dates, evaluated department-by-department, with monitoring for unanswered questions to drive knowledge base updates."

> Senior tip: In large conglomerates, the hardest part is not the model but **knowledge owners**. Assign each document set to a department responsible for updates, and display "this document is maintained by dept X, last updated on Y" right inside the answer.`,
    follow: ['How do you ensure Claude doesn\'t answer from documents the user isn\'t authorized to view?', 'When do you inject directly into 1M context instead of using RAG?']
  }
});
