/*
 * English translation of js/data/q-ai.js — task T210. Format: js/core/i18n.js (content overlay).
 * ids: ai-010 ai-011 ai-012 ai-013 ai-014 ai-015 ai-016 ai-017 ai-018
 */
App.i18n.content({
  'ai-010': {
    q: `Vector database and similarity search: how do cosine, dot product, Euclidean differ? How does HNSW trade recall/latency, and when is metadata filtering needed?`,
    a: `**Summary:** Vector search finds the most similar vectors by a score; cosine compares angles (ignores magnitude), dot product depends on both angle and magnitude, Euclidean measures distance. HNSW is an approximate index (ANN) providing high recall and low latency but costs memory and has parameters that directly affect quality.

### Three similarity metrics
- **Cosine similarity**: cos(θ) = (a·b)/(|a||b|). Only cares about direction, ideal for embedding vectors whose length often carries no meaning.
- **Dot product**: a·b. If vectors are normalized (norm = 1), dot product equals cosine. Many embedding models return normalized vectors, making the two equivalent in practice.
- **Euclidean (L2)**: geometric distance; for normalized vectors, rankings near-match cosine.
- Rule of thumb: use whichever metric the embedding model is trained with. Changing the metric can lower quality even if the code runs.

### Exact vs ANN
- **Exact (brute force)**: scan every vector, 100% recall, slow at millions of vectors. pgvector supports exact scans when no suitable index is used or with the right index.
- **ANN (Approximate Nearest Neighbor)**: much faster, but may miss true neighbors. Need to measure **recall@k** against exact on a sample set.

### HNSW
- Multi-level graph: upper levels sparse (jump far), lower levels dense (find close).
- Important parameters:
  - **M**: number of edges per node (usually 16–64). Higher M → better recall, more memory.
  - **ef_construction**: search width while building the index. Higher → better index, slower build.
  - **ef_search**: search width during query. Higher → better recall but higher latency. This is the knob you tune when running production.
- Characteristics: queries are fast, insert grows incrementally without retraining (unlike IVF), but build/insert cost more CPU than IVF; **deletion** is costly (usually just marked) and indexes consume lots of RAM.
- When data changes often, rebuild periodically or accept degradation; monitor size and recall.

### Other options
| Index | Characteristics | When to use |
|---|---|---|
| HNSW | High recall, low latency, high RAM | Medium/large datasets, need quality |
| IVF (IVFFlat) | Clustering, needs training, less RAM | Large datasets, accept lower recall |
| Product Quantization | Aggressive compression, lower RAM | Very large, prefer cost |
| DiskANN | Disk-based, huge datasets | Low RAM, accept latency |

### Metadata filtering
- In enterprise RAG, filtering by tenant, department, language, date, document type is mandatory.
- **Pre-filter** (filter before search) is more accurate but may break HNSW graph connections if too strict; some stores support integrated filters.
- **Post-filter** (search then filter) may return fewer k or drop true results; must over-fetch.
- Check how your store supports filters; don't assume pre-filter always correct.

### Measurement
- recall@k against exact search on 500–1,000 query samples.
- latency p50/p95/p99 under real load.
- index memory, ingest speed, rebuild time.
- For RAG, measure both final quality (correct answer) because high retrieval recall doesn't guarantee a good answer.

### Production pitfalls
- Changing embedding model without reindexing: old and new vectors live in different spaces, meaningless results.
- Using cosine but forgetting to normalize when storage requires; or mixing the two metrics between ingest and query.
- Setting ef_search too low to cut latency then blaming LLM.
- Index in RAM exceeding instance limit: swap, latency spikes.
- Filtering metadata after search loses correct documents; user sees "not found" despite the document existing.
- No index version: cannot rollback when ingest fails.

> Senior tip: lock the similarity metric and embedding model first, treat them as data schema. Then use HNSW with M around 16–32, ef_search 64–128, measure recall and latency on real data before tuning. Don't optimize ANN while chunking is wrong.`,
    follow: ['Why must the same embedding model be used for ingest and query?', 'How does ef_search affect recall and latency?', 'When are pre-filter and post-filter different in vector stores?']
  },
  'ai-011': {
    q: `Using AI coding assistants (Copilot, Claude Code, Cursor) in a team: real benefits, risks, and how to set up a review process for code written by AI?`,
    a: `**Summary:** AI coding assistants accelerate repetitive work and discover APIs, but can produce code that compiles correctly yet is logically wrong, increase tech debt, and leak data if used incorrectly. Value comes from process: clear prompts, careful review, automated tests, and rules governing what data may be sent to the tool.

### Real benefits
- Writing boilerplate: DTOs, mappers, test skeletons, config.
- Explaining unfamiliar code, reading logs, suggesting root causes.
- Converting syntax/languages, writing regex, one-shot scripts.
- Speeding up learning new libraries (but always verify official documentation).
- Supporting small refactors, renaming, adding null checks.

### Risks
- **API hallucination**: calling methods/classes that don't exist or have wrong signatures. Code compiles but logic is wrong — riskier than syntax errors.
- **Code runs correctly but not functionally**: missing edge cases, wrong transaction order, wrong call sequence.
- **Security**: generated code with SQL injection, logging secrets, weak algorithms, or adding unknown dependencies.
- **License/dependency**: recommended libraries with incompatible licenses or package squatting (slopsquatting).
- **Data leakage**: pasting proprietary code, secrets, customer data into tools without approval.
- **Skills**: junior devs rely too heavily, reducing debug and code comprehension ability.
- **Tech debt**: many duplicate codes, missing design, hard to maintain.

### Review process
1. Treat AI-generated code like code from an unfamiliar contributor: review line by line, don't glance over.
2. Mandatory tests: unit tests for logic, integration tests for DB/API; AI-written tests also need review because they may test incorrectly.
3. Check new dependencies: source, license, popularity, known CVEs.
4. Run static analysis/SAST, dependency scans like every PR.
5. With security/finance/data changes, need experienced reviewer for deeper check.
6. Clearly note in PR if code is created mostly by AI so reviewers know how much extra care is needed.
7. Never merge code the author doesn't explain what it does.

### Team conventions
- List allowed tools and allowed data.
- Never paste secrets, tokens, personal data, client code into unapproved tools.
- Prefer tools with offline mode or self-hosted.
- Provide prompt guidance: supply context, constrain Java/Spring versions, require explanations.
- Measure effectiveness by quality/lead time, not just lines of code.

### Effective use
- Split work small, demand clear goals, attach related files and conventions.
- Require AI to explain tradeoffs before coding parts it handles.
- Use AI to generate tests from requirements, then verify tests really test the right thing.
- For important code, design first, AI only supports implementation.

> Senior tip: real productivity isn't typing speed but understanding and trust. An AI PR written 3× faster but review takes 5× longer is a loss. Invest in tests, conventions and strong reviewers — that's what turns AI into leverage rather than risk.`,
    follow: ['Why can AI-compiled code still be dangerous than syntax errors?', 'What rules about data you can paste into AI tools would you set?', 'How do you measure AI assistant effectiveness without counting lines of code?']
  },
  'ai-012': {
    q: `Amazon Bedrock, OpenAI API or self-hosting a model: which should an enterprise choose? Analyze based on data, cost, latency, compliance and operations capability.`,
    a: `**Summary:** Bedrock suits AWS-first enterprises needing IAM/VPC integration across many models through one API; OpenAI API offers top quality/model refresh speed and tool ecosystem; self-hosting (vLLM on EC2/EKS or SageMaker) controls data and cost at scale but demands GPU ops expertise. No single choice fits every case.

### Decision criteria
1. **Data and compliance**: can data leave your VPC/region? Any requirement for domestic provider or local storage?
2. **Task quality**: which model hits your golden set, not general benchmarks.
3. **Cost at scale**: token price × volume + operation cost.
4. **Latency**: network distance, cold start, throughput.
5. **Team capability**: anyone managing GPU/Kubernetes?
6. **Vendor lock-in**: how easy is switching?

### Amazon Bedrock
- Managed API for many foundation models (Anthropic, Meta, Mistral, Amazon Nova, Cohere…), no infrastructure to manage.
- Integrates IAM, VPC endpoint, CloudWatch, CloudTrail; data isn't used to train models and defaults to processing in the chosen region (current policy); note cross-region inference profiles may process in a different region within the same geography, verify if there are data residency requirements.
- Has Knowledge Bases (managed RAG), Guardrails, Agents, batch inference, provisioned throughput.
- Suitable: AWS-first enterprises needing compliance, wanting one contract and one security layer.
- Limitations: model/region catalog can lag; some features are only available on the original provider; prices vary by model.

### OpenAI API (and similar APIs)
- Strongest model, frequent updates, ecosystem of tools/function calling, structured output, batch, embeddings best.
- Simple infrastructure: one API key, popular SDK.
- Evaluate data policies, region, enterprise agreements; with sensitive data need approval.
- Risks: price/model changes, rate limits, service disruption. Design abstraction layer to switch providers.

### Self-host
- Run open-weight models with vLLM/TGI on GPUs (EC2, EKS, SageMaker endpoint), or use smaller models for narrow tasks.
- Pros: full control of data, low marginal cost at high load and stable, customizable (fine-tune, quantization).
- Cons: expensive GPU, ML/ops team required, model updates, complex autoscaling; open model quality often lags behind closed models on hard tasks.
- Only consider self-hosting when: load is high enough to recoup, strict data requirements, or custom model needed.

### Quick selection
| Scenario | Recommendation |
|---|---|
| AWS-first, sensitive data, need VPC/IAM | Bedrock |
| Need strongest model, quick trials | API provider |
| Data can't leave, stable high load | Self-host |
| Low load, no ML team | API/Bedrock, no self-host |
| Multi-cloud | Abstraction layer + API, avoid deep coupling |

### Recommended architecture
- One internal interface (ChatModelPort) wrapping the provider; don't scatter SDK calls.
- Standardize prompt/response; log token and cost per provider.
- Have fallback: if primary provider fails, switch to secondary if quality acceptable.
- Use same golden set to compare quality and cost across choices.
- With Bedrock, use provisioned throughput for stable latency; batch for background jobs.

### Pitfalls
- Choosing based on marketing benchmarks instead of your own eval.
- Self-host "to save" but GPU runs at 20% capacity: more expensive than API.
- Forgetting egress/data transfer and ops effort costs.
- Hard-coding one provider through scattered SDK calls.
- Ignoring legal requirements around where data is stored.

> Senior tip: run a small bake-off: 100–200 real cases, 2–3 options, measure quality + p95 latency + cost/1k requests. Decide with numbers, and keep abstraction to change when price/model shift.`,
    follow: ['When does self-hosting a model become cheaper than the API?', 'What does Bedrock help with for data that can\'t leave the VPC?', 'How do you architect an abstraction layer to switch providers?']
  },
  'ai-013': {
    q: `Observability for an LLM application: what traces do you need, how to measure tokens/cost, and how to run a user feedback loop?`,
    a: `**Summary:** LLM observability differs from traditional observability in that each request has long prompt/response, varying token and cost, and quality isn't inferred from HTTP 200 alone. You need end-to-end traces (retrieval, prompt, model call, tool call), token/cost/latency metrics, PII-controlled logs, and a feedback loop turning errors into eval cases.

### Tracing one request
- Trace ID spans from API gateway → service → retrieval → LLM → tool → response.
- Every span records: step name, duration, model, prompt version, tokens in/out, finish reason, error.
- With RAG: log list of chunk ids, scores, retrieve/re-rank durations; this is valuable data for debugging "wrong answer due to retrieval or model".
- With tool calling: log tool name, parameters (PII-masked), result summary, duration.
- Use OpenTelemetry; semantic conventions for GenAI are evolving, so standardize internal attributes (gen_ai.request.model, prompt.version…) for easier backend switching.
- Can use dedicated backends (Langfuse, Arize Phoenix, LangSmith…) or build on OTel + Tempo/Jaeger.

### Metrics
- **Token**: input/output by endpoint, tenant, model; token/request p50/p95.
- **Cost**: converted from token at pricing table, updated when prices change; split by tenant/feature.
- **Latency**: time to first token (streaming), total duration, p95/p99; separate retrieval and model time.
- **Operational quality**: fallback ratio, parse JSON error ratio, "not found" ratio, retry ratio.
- **Rate limit/provider errors**: 429, 5xx, timeout per provider/model.
- **Usage**: active users, queries/session, drop-in rate.

### Logs for prompt/response
- Full logs help debugging but cost money and carry PII risk. Strategy:
  - Default: log metadata + hash prompt, sample small portion of content.
  - When enabling debug for one trace, log full for limited duration.
  - Mask PII/secret before logging; hash; short retention (7–30 days).
  - Control access to logs; audit access.
- Never log API keys, Authorization headers, full sensitive document.

### Feedback loop
- Correct/wrong button + short reason on UI; collect implicit signals too (copy, edits, abandonment).
- Collect bad cases into review queue; classify root cause: retrieval, prompt, model, source data.
- Confirmed cases enter golden dataset; regression runs before deploy changes.
- Measure satisfaction weekly and per feature; set alert thresholds.
- Close the loop: notify reporter when fixed (if appropriate).

### Dashboard recommendations
- Top row: requests/min, p95 latency, error ratio, cost/hour.
- Row two: token in/out, fallback ratio, JSON parse error ratio, top tenants by cost.
- Row three: quality (sample eval points, bad feedback ratio), top error questions.

### Alerts
- Cost exceeds daily/weekly threshold.
- p95 latency exceeds SLO.
- Provider error/429 ratio spikes.
- JSON parse or fallback spikes suddenly (indicates model/prompt behavior change).
- Anomalies per tenant (one tenant burning tokens).

### Pitfalls
- Only HTTP logs, no retrieval trace: don't know why answer is wrong.
- Logging raw conversations containing customer data.
- No prompt/model versioning: can't reproduce later.
- Measuring only average latency: p99 is the bad experience.
- Collecting feedback nobody acts on: users stop reporting.

> Senior tip: design traces before optimizing quality. When something goes wrong, the first question is always "what did retrieval return, what prompt version, what model, how many tokens" — if you can't answer in minutes, you're flying blind.`,
    follow: ['Why split retrieval time from model time in traces?', 'You log prompt/response fully but protect PII how?', 'Which alerts catch early when model behavior changes?']
  },
  'ai-014': {
    q: `A bank chatbot answers questions about fees using RAG. Sometimes the user asks "annual fee of Visa Platinum card" or types without diacritics. How do you improve retrieval using hybrid search, Vietnamese-aware chunking, and metadata filtering?`,
    a: `**Summary:** Vector search excels at capturing meaning but struggles with exact keywords (product names, fee codes, "Article 15"), while BM25 goes the other way. **Hybrid search** runs both then combines with Reciprocal Rank Fusion, then re-ranks. For Vietnamese add: analyzer handling both diacritics and ASCII, chunking by structure (Chapter/Article/Section, fee tables) with heading path, and filter metadata by product, version, effective date before searching.

### Why vector search alone isn't enough
- Embedding compresses a whole passage into one vector, so "Visa Platinum" and "Visa Gold" cluster close together; the system returns the wrong card's fee, model reads and answers confidently but incorrectly.
- Codes, clause numbers, abbreviations (TKTT, OTP) carry little contextual meaning, embedding handles poorly.
- BM25 scores by keyword frequency with length adjustment, matches "Platinum" precisely but doesn't understand "annual maintenance fee" means "annual fee".

### Combining results: Reciprocal Rank Fusion
BM25 and cosine scores aren't on the same scale, so direct addition is impossible. RRF only uses **ranking**: score(d) = sum over lists of 1/(k + rank), k typically 60.

~~~java
// Combine BM25 and vector results by ranking, no need to normalize scores
static List<String> rrf(List<List<String>> rankings, int k, int topN) {
    Map<String, Double> score = new HashMap<>();
    for (List<String> ranking : rankings) {
        for (int i = 0; i < ranking.size(); i++) {
            score.merge(ranking.get(i), 1.0 / (k + i + 1), Double::sum); // rank starts at 1
        }
    }
    return score.entrySet().stream()
        .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
        .limit(topN).map(Map.Entry::getKey).toList();
}
// rrf(List.of(bm25Ids, vectorIds), 60, 20) then pass the 20 candidates through cross-encoder re-rank, take 5
~~~
OpenSearch/Elasticsearch have hybrid query and RRF built in; PostgreSQL can combine full-text search with pgvector, but ts_rank isn't true BM25.

### Vietnamese specifics
- **No diacritics**: users type "phi thuong nien"; add a non-diacritic field (ASCII folding) alongside the original field, query both, prefer the match with diacritics.
- **Multi-syllable words**: "banking", "interest rate". Default analyzer splits by whitespace so it matches syllables; use phrase/shingle or Vietnamese word segmenter for higher accuracy.
- **Embedding**: pick a multilingual model supporting Vietnamese (e.g., multilingual-e5, BGE-M3) and **self-test** on real question sets, don't trust global rankings.
- Many tokenizers cost more tokens for Vietnamese than English with the same content: chunk size measured by actual tokens, not estimated by word count.

### Chunking by structure
- Legal/terms text: cut by Article, Section; never cut mid-section.
- Fee tables: keep rows intact, repeat table header in each chunk, otherwise the model doesn't know which column a number belongs to.
- Attach **heading path** to the start of each chunk: "Credit card fees > Visa Platinum > Annual fee". Both BM25 and embedding benefit.
- Small overlap (10–15%) only for flowing text; for tables and clauses, cut along natural boundaries.

### Metadata filter
- Store: product, document type, **effective date, version**, customer segment, access rights.
- Pre-filter before searching so expired fees never leak into context.
- Extract filter set from the question (product name) via product dictionary or a small LLM step, with fallback when recognition fails.

### Production pitfalls
- Expired and current fees both indexed: answer mixes both versions.
- Chunks too small lose context ("Fee: 1.500.000" without knowing which card).
- Changing analyzer or embedding model without full reindex.

> Senior tip: build a 100–200 real question set with proper chunks, then measure recall@k for each config: only vector, only BM25, hybrid, hybrid + re-rank. For bank documents with codes and product names, hybrid usually boosts recall noticeably, but only data on your own documents will persuade.`,
    follow: ['Why can\'t you add BM25 scores directly to cosine similarity?', 'In pre-filter and post-filter metadata with HNSW, how do recall and performance differ?', 'How do you detect and handle expired documents in the index?']
  },
  'ai-015': {
    q: `Three teams propose three approaches for three problems: answering credit policy questions, classifying 1 million complaints per month into 40 categories, and generating reply emails in correct bank tone. For each problem, should you choose prompt engineering, RAG, or fine-tuning — and why?`,
    a: `**Summary:** Three techniques solve three different problems: **prompting** adjusts behavior fastest and cheapest, **RAG** provides **knowledge** that changes often with citations and access control, **fine-tuning** teaches **behavior/format/classification** at scale, not the best way to load knowledge. Always start with prompting and eval; credit policy uses RAG, bulk complaint classification warrants fine-tuning a smaller model, bank email tone only needs prompt + few-shot.

### What each technique changes
- **Prompting**: no model change, only input change. Iteration cycles measured in minutes.
- **RAG**: no model change, adds relevant documents to context at runtime. Knowledge updates by reindexing; responses cite sources; filtered by asker's permissions.
- **Fine-tuning**: changes weights (full or adapter like LoRA) with hundreds to thousands labeled examples. Model "remembers" how to act but doesn't "remember" facts credibly; to fix, retrain.

### Trade-off table
| Criteria | Prompting | RAG | Fine-tuning |
|---|---|---|---|
| Initial cost | Very low | Medium (pipeline, index) | High (labeled data, train, eval) |
| Cost per request | Prompt-long is expensive | Adds token context | Could be cheapest if small model |
| Updating knowledge | Edit prompt | Reindex in minutes | Retrain |
| Citations & access control | None | Yes | No |
| Format/behavior stability | Fair | Fair | Good |
| Risk | Prompt bloat | Wrong retrieval | Labeled data containing PII, stale model when provider releases new versions |

### Applied to the three problems
1. **Credit policy**: changes quarterly, needs citations and correct version. **RAG** with effective-date metadata. Fine-tuning here is wrong: policy changes mean the model still speaks to the old version, and it can't cite.
2. **1M complaint classification/month**: start with large model + prompt + few-shot for baseline and **generate labels** for human reviewers. Once a few thousand labels are good, fine-tune (or distill) a smaller model: much cheaper and faster at this volume. Even a classical classifier on embedding may suffice; test on the same set.
3. **Email tone**: prompt with tone guide + 3–5 examples usually meets requirements. Fine-tuning only when volume is large and prompts are so long that cost matters.

### Decision process
1. Write eval first (50–200 cases with answers/rubric).
2. Best possible prompting, measure.
3. Errors due to **missing knowledge** → RAG. Errors due to **unstable behavior/format at scale** → consider fine-tuning.
4. Fine-tuning only when you have clean data, ownership of training pipeline, and measured benefit exceeds operational cost.

### Pitfalls
- Fine-tuning on internal documents "model knows the policy": still hallucinate, and harder to fix than prompt.
- Training data containing customer info: becomes PII leak risk and GDPR obstacle.
- No baseline so can't prove fine-tuning is better.
- Forgetting hidden costs: hosting the customizable model, retraining when base model changes, eval every time.

> Senior tip: when the team wants fine-tuning, ask these three questions first: is the current error missing knowledge or wrong behavior, how many clean labels do you have, and who retrains after 6 months. The third question unanswered isn't worth doing yet.`,
    follow: ['How does distillation from large to small model work and what risks exist?', 'When combining RAG with a fine-tuned model is reasonable?', 'How do you estimate monthly cost of three approaches for complaint classification?']
  },
  'ai-016': {
    q: `A Spring Boot service extracts transfer information from customer messages into JSON via LLM, but sometimes the model returns malformed JSON, missing fields, or wrong types. How do you design a structured output class, validate, and retry?`,
    a: `**Summary:** Don't trust the model's output format. Design multiple layers: (1) use the provider's schema enforcement if available (structured output via JSON Schema or tool calling), (2) parse with Jackson into a record configured strictly, (3) validate semantics with Bean Validation and business rules, (4) retry with a limited count plus specific error reporting, (5) when exhausted, hand off to humans, never guess.

### The layered guarantees
| Level | Approach | Guarantee |
|---|---|---|
| Just instructions in prompt | "Return JSON with these fields…" | No guarantee at all |
| JSON mode | Turn on the API option | Valid JSON, but not necessarily correct schema |
| Structured output per schema | Send JSON Schema, model constrained while generating | Correct structure on supported models |
| Tool calling | Declare tool with input schema | Nearly structured output |

Even when the structure is right, **content** can still be wrong: fake account numbers, misread "5 million" as 5000. Therefore semantic validation is mandatory.

### Data design
- Use record + enum instead of free String: model can only choose from valid sets.
- Money uses {{BigDecimal}}, never double.
- Have a nullable field for "uncertain": allow model to return null instead of guessing.

### Parse, validate, retry
~~~java
enum Ccy { VND, USD }
record TransferIntent(@NotBlank @Pattern(regexp = "[0-9]{6,19}") String toAccount,
                      @NotNull @Positive BigDecimal amount,
                      @NotNull Ccy currency) {}

TransferIntent extract(String message) {
    String feedback = "";
    for (int attempt = 1; attempt <= 2; attempt++) {          // retry limit
        String raw = chatClient.prompt()
            .system(SYSTEM_PROMPT_WITH_SCHEMA)
            .user(message + feedback)
            .call().content();
        try {
            TransferIntent t = strictMapper.readValue(raw, TransferIntent.class);
            Set<ConstraintViolation<TransferIntent>> errs = validator.validate(t);
            if (errs.isEmpty()) return t;                       // correct structure and constraints
            feedback = "\nPrevious violation: " + errs.iterator().next().getMessage();
        } catch (JsonProcessingException e) {                   // malformed JSON, wrong type, unknown enum
            feedback = "\nPrevious result didn't match JSON schema: " + e.getOriginalMessage();
        }
    }
    throw new NeedsHumanReviewException(message);               // don't guess, hand off to humans
}
~~~

### Why each detail matters
- **Strict ObjectMapper**: Spring Boot auto-configures {{FAIL_ON_UNKNOWN_PROPERTIES}}, so extra fields or misspelled names are silently dropped. Use one mapper turned on, and {{FAIL_ON_NULL_FOR_PRIMITIVES}} if primitive types present.
- **Specific feedback**: sending the right error spot helps the next attempt improve; blind retry only wastes tokens.
- **Limiting retries to 1–2 times**: if the model fails twice, the input is genuinely vague; retrying increases latency and cost.
- **Business validation after validate**: destination account exists, amount in bounds, transfers always require human confirmation before execution.
- Some models wrap JSON in markdown: handle with structured output enabled, or strip from the first to last `>` before parsing.

### Spring AI and LangChain4j
Both offer mechanism to map output to a Java class (Spring AI: {{entity(Class)}}; LangChain4j: AI Service returns POJO). They help shape format and parse, but **don't replace** Bean Validation, your own policy checks, and retry strategy.

### Metrics to track
- Parse error ratio, retry ratio, human handoff ratio per prompt/model version.
- Sudden increases often signal provider changing models or prompt modifications.

> Senior tip: treat LLM output like input from an untrusted user: strict parse, complete validation, never inject directly into SQL or execute transfer commands. The best schema is small and flat; each layer adds a source of failure.`,
    follow: ['Does schema-based structured output reduce reasoning quality, and how do you handle it?', 'When the model returns amount null due to unclear message, how does UX flow?', 'How do you write tests for this extraction class without calling a real model?']
  },
  'ai-017': {
    q: `An agent supporting customers has tools to look up transactions, freeze cards, and create refund requests. On staging it called the same tool 40 times consecutively and had one refund request wrongly finalized. How do you make the agent reliable?`,
    a: `**Summary:** An agent is a loop "model chooses action → executes tool → feeds result back to model", so limits must come from code, not the model: max steps, token/cost/time budget, detecting loops. Tools split by risk: read-only tools run freely, tools with side effects require idempotency and go through **human-in-the-loop** (customer or staff confirmation). Structured tool errors let the model act, and every step is traced and audited.

### Why agents lose control
- Model has no concept "tested enough": when a tool returns vague errors, it calls again with the same params.
- Context lengthens, early instructions dilute.
- Model can be prompt-injected through content returned by tools (e.g., notes on transactions entered by others).

### Hard limits in the loop
~~~java
// Agent loop you wrote: the stop condition lives in code, not model
AgentResult run(Conversation conv) {
    Budget budget = new Budget(8, 20_000, Duration.ofSeconds(45)); // steps, tokens, time
    Map<String, Integer> callCount = new HashMap<>();
    while (true) {
        if (budget.exceeded()) return AgentResult.handoff("budget exceeded");
        ModelTurn turn = llm.next(conv);                              // your LLM client wrapper class
        budget.consume(turn.tokens());
        if (turn.isFinalAnswer()) return AgentResult.answer(turn.text());

        ToolCall call = turn.toolCall();
        String key = call.name() + call.argsJson();
        if (callCount.merge(key, 1, Integer::sum) > 2)               // same tool same params third time
            return AgentResult.handoff("tool loop " + call.name());

        Tool tool = registry.get(call.name());
        if (tool.risk() == Risk.WRITE)                               // side effect: stop and ask for confirmation
            return AgentResult.needsApproval(call);
        conv.addToolResult(call, safeExecute(tool, call));          // error returned in structured form
    }
}
~~~

### Classify tools by risk
| Type | Example | Policy |
|---|---|---|
| Read | Transaction lookup, fee lookup | Run freely, still check permissions for logged-in customer |
| Reversibly writable | Temporary card freeze | Customer confirms on UI, with audit |
| Hardly reversible | Refund, transfer | Staff review or strong auth, limits, idempotency key |

- Tools take customer identity from **authenticated session**, not params the model fills, so the model can't look up another customer's account.
- Writable tools must be idempotent: retry or model looping also won't refund twice.

### Handle tool errors
- Return structured errors with suggested actions: {{NOT_FOUND: no transactions in last 30 days, don't call again}} beats a stack trace.
- Distinguish transient errors (auto-retry with backoff, don't let model retry) and permanent errors (let the model change direction or ask the customer again).
- Timeout per tool; slow tools can't drag the whole session.

### Human-in-the-loop correctly
- Show the reviewer **the exact action** that will execute (tool, params, amount), not the model's summary.
- Save conversation state to continue after approval, don't force the model to re-reason from scratch.

### Observation and testing
- Trace each step: prompt version, tool call, params, result, tokens, duration.
- Scenario test suite: refund for nonexistent transaction, tools returning persistent errors, messages containing malicious instructions. Run on every prompt/model change.

> Senior tip: most banking "agent" problems are really fixed workflows with a few LLM decision points. Only grant the model autonomy at the read data stage; every action affecting customer money passes through a validated path, limits, and audit like normal transactions.`,
    follow: ['How do you detect the agent looping when params change slightly each time?', 'Prompt injection through transaction notes: where do you defend?', 'How should a budget per session be sized based on metrics?']
  },
  'ai-018': {
    q: `You need to stream an LLM's answer from Spring Boot to the browser chunk by chunk. How do you use SSE, handle user cancel, timeout, and a proxy in between?`,
    a: `**Summary:** Use **Server-Sent Events**: one HTTP response stays open while the server pushes events as text/event-stream. In Spring Boot, return {{Flux<ServerSentEvent<String>>>}} (works even on Spring MVC with Reactor, or WebFlux) or use {{SseEmitter}}. Handle: client disconnect cancels upstream, timeout when model stops generating tokens, heartbeat so proxy keeps the connection, disable buffering at proxy, and save the full response when finished.

### Why streaming
- Models emit tens of tokens per second; a 500-token answer takes many seconds. Without stream, users stare at an empty screen the whole time.
- Streaming doesn't shorten total time, but **time to first token** feels much shorter.

### SSE vs WebSocket
| Criteria | SSE | WebSocket |
|---|---|---|
| Direction | Server → client | Bidirectional |
| Protocol | Usually HTTP, through proxy/LB easy | Needs upgrade, separate config |
| Auto-reconnect | Yes (EventSource) | Manual |
| Fit with | Answer streaming | Realtime chat, voice |

For chatbots, SSE is essentially always enough: send the question via POST, the answer streams back.

### Spring Boot code
~~~java
@PostMapping(value = "/api/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
Flux<ServerSentEvent<String>> chat(@RequestBody Ask ask, Principal user) {
    StringBuilder full = new StringBuilder();
    Flux<ServerSentEvent<String>> tokens = chatClient.prompt()
        .user(ask.question())
        .stream().content()                                    // Flux<String> chunks
        .timeout(Duration.ofSeconds(20))                      // 20s no new chunk → error
        .doOnNext(full::append)
        .map(chunk -> ServerSentEvent.builder(chunk).event("token").build())
        .concatWith(Flux.just(ServerSentEvent.builder("").event("done").build()));
    Flux<ServerSentEvent<String>> heartbeat = Flux.interval(Duration.ofSeconds(15))
        .map(i -> ServerSentEvent.<String>builder().comment("ping").build());
    return Flux.merge(tokens, heartbeat)
        .takeUntil(e -> "done".equals(e.event()))             // hit done → stop heartbeat
        .doFinally(signal -> audit.save(user, ask, full.toString(), signal));  // COMPLETE/CANCEL/ERROR
}
~~~
Don't subscribe {{tokens}} twice (e.g., merging and using as the cancel signal): each subscription means one model call and costs tokens.

### User cancel
- Client closes connection → Spring cancels subscription → Reactor propagates cancel signal up, client HTTP stops request at provider, model stops emitting and usually stops billing the remaining tokens.
- With {{SseEmitter}} on a blocking thread, you must manually handle {{onCompletion}}/{{onError}} and stop reading the stream yourself, otherwise the thread keeps reading and bills tokens nobody reads.
- Save the in-progress response with state "cancelled" for audit.

### Browser side
- {{EventSource}} only supports GET and can't send arbitrary Authorization headers. With POST + bearer token, use {{fetch}} then read {{response.body}} by reader, manually splitting events by blank lines.
- Cancel with {{AbortController}} when user clicks cancel or leaves page.

### Proxy, load balancer, timeout
- Nginx buffers by default, making stream appear as one chunk: disable {{proxy_buffering}} or send header {{X-Accel-Buffering: no}}.
- ALB idle timeout defaults to 60s: heartbeat every 15–30s keeps connection alive.
- Spring MVC async request timeout ({{spring.mvc.async.request-timeout}}); set larger than longest expected answer time.
- Enable gzip for text/event-stream may cause buffering; verify compression config.

### Production pitfalls
- Each stream holds one connection long: for Spring MVC traditional, consider virtual threads ({{spring.threads.virtual.enabled}}) or WebFlux.
- Rate limit per request but forget concurrent streams.
- Showing markdown chunk by chunk may break formatting mid-way; re-render received chunks fully.

> Senior tip: track two indicators separately: time to first token and total duration. Users tolerate a 10-second answer if text appears under 1 second; otherwise, blocking the output guardrail until the full answer arrives destroys the benefit of streaming, so design output checks per chunk or after completion with recovery ability.`,
    follow: ['How do guardrails testing content fit with streaming?', 'SSE drops mid-connection: where does the client reconnect and continue from?', 'How do SseEmitter and Flux differ in thread and backpressure?']
  },
});



