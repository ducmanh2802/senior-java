/*
 * English translation of js/data/quiz-claude.js — task T414. Format: js/core/i18n.js (content overlay).
 * ids: qz-claude-064 qz-claude-065 qz-claude-066 qz-claude-067 qz-claude-068 qz-claude-069 qz-claude-070 qz-claude-071 qz-claude-072 qz-claude-073 qz-claude-074 qz-claude-075 qz-claude-076 qz-claude-077 qz-claude-078 qz-claude-079 qz-claude-080 qz-claude-081 qz-claude-082 qz-claude-083 qz-claude-084 qz-claude-085 qz-claude-086 qz-claude-087 qz-claude-088 qz-claude-089 qz-claude-090 qz-claude-091 qz-claude-092 qz-claude-093
 */
App.i18n.content({
  "qz-claude-064": {
    "q": "[Applications] A team wraps Claude SDK calls with Resilience4j Retry (5 extra retries, 6 attempts in total). When the API is overloaded, the logs show that a single user request produces up to 18 HTTP calls. What is the most appropriate root cause and fix?",
    "options": [
      "Resilience4j is buggy; upgrade the library version",
      "Jitter is the cause; remove jitter so the call count is stable",
      "The API keeps returning 529; retry immediately without waiting so the request finishes sooner",
      "The official SDK already retries twice by default (3 attempts per call), multiplied by the 6 attempts outside gives 18; pick one layer to own retries"
    ],
    "explain": "**Correct: retry on top of retry.** The official SDK already retries twice by default on errors such as 408, 409, 429, 5xx (including 529). Every Resilience4j call into the SDK is therefore up to 3 HTTP calls; 6 × 3 = 18. While the API is overloaded, this retry storm makes things worse and stretches the time each user waits.\n\nThe fix: pick **one** retry layer. Either keep the SDK retries (configure the count; it already backs off) and drop the outer Retry, or set the SDK retry count to 0 and let Resilience4j do it (backoff + jitter, overall time cap). Keep the circuit breaker either way.\n\n### Why the other options are wrong\n- **Library bug:** the behavior matches the configuration; it is not a bug.\n- **Remove jitter:** jitter does not increase the number of calls; removing it actually makes many clients retry at the same instant (thundering herd).\n- **Retry immediately without waiting:** hammering a server that is already overloaded is the worst option."
  },
  "qz-claude-065": {
    "q": "[Applications] A chat endpoint in a Spring MVC app calls Claude synchronously using the SDK default timeout. One afternoon the API becomes unusually slow, the Tomcat thread pool runs dry, and even pages that do not use AI hang. Which change fixes the root cause?",
    "options": [
      "Set a per-route timeout (the SDK default is up to 10 minutes, far too long for a user waiting on a request), add a bulkhead limiting concurrent AI calls, and a circuit breaker with a fallback",
      "Scale the Tomcat thread pool 10x",
      "Cut max_tokens to 100 so the API answers faster",
      "Switch the chat endpoint to the Batch API"
    ],
    "explain": "**Correct: per-route timeout + bulkhead + circuit breaker.** The SDK default timeout is very long (around 10 minutes) because it also has to serve requests that generate large outputs. For a user waiting on a request, every slow call holds a Tomcat thread for a long time; a few hundred such calls drain the pool and take down even the parts that have nothing to do with AI. A bulkhead isolates them: a slow AI can only fill its own \"compartment\". The circuit breaker returns a fallback (\"AI is busy\") when failures persist. Streaming or virtual threads help further, but you still need the timeout.\n\n### Why the other options are wrong\n- **Bigger thread pool:** it only postpones the collapse, costs memory, and does not bound the waiting time.\n- **max_tokens 100:** answers get truncated (stop_reason max_tokens); the slowness during overload is not caused by output length.\n- **Batch API:** meant for work that does not need an immediate result (up to 24 hours), not for chat."
  },
  "qz-claude-066": {
    "q": "[Applications] You write a shared retry helper for every Claude API call. Which errors should be retried automatically (with backoff)? (Select 3)",
    "options": [
      "429 rate_limit_error",
      "400 invalid_request_error",
      "529 overloaded_error",
      "401 authentication_error",
      "500 api_error",
      "413 request_too_large"
    ],
    "explain": "**Correct: 429, 529, 500.** These are **transient** errors: resending after a short wait may succeed.\n- **429:** the organization exceeded its limit; wait at least according to the {{retry-after}} header and slow down.\n- **529:** Anthropic is temporarily overloaded; exponential backoff + jitter.\n- **500:** unexpected internal error; bounded retries.\n\n### Why the remaining errors are not retried\n- **400 invalid_request_error:** the request is malformed (missing field, unsupported parameter such as prefill on newer models). Resending it unchanged still fails and just costs money.\n- **401 authentication_error:** the API key is wrong or missing; fix the configuration.\n- **413 request_too_large:** the request exceeds the size limit; shrink it, retrying does not help.\n\n> Log the request id ({{request-id}} header) of non-retried errors so you can investigate; do not swallow them."
  },
  "qz-claude-067": {
    "q": "[Applications] A user uploads a very heavy scanned PDF file (about 40 MB after base64) for Claude to read. The API returns 413 request_too_large. What is the right handling?",
    "options": [
      "Retry with exponential backoff because 413 is a transient error",
      "Do not retry the request as-is; shrink it below the request size limit (32 MB): split the PDF into parts, compress it, or lower the scan resolution",
      "Increase max_tokens so the request can hold a large document",
      "Switch to a model with a 1M context to raise the request size limit"
    ],
    "explain": "**Correct: shrink the request.** 413 means the **HTTP payload** exceeds the endpoint size limit (the Messages API allows about 32 MB). This is a byte limit, not a token limit. Base64 also inflates the file by about 33%. What to do: check the size in the backend before sending, split the document by chapter, lower the scan image resolution.\n\n### Why the other options are wrong\n- **Retry:** 413 is not transient; resending the same request is always rejected.\n- **Increase max_tokens:** max_tokens is only the **output** ceiling, unrelated to input size.\n- **1M context model:** the context window is measured in tokens; the request size limit is measured in bytes and applies to every model. Every current model already has a 1M context."
  },
  "qz-claude-068": {
    "q": "[Applications] A Message Batch of 10,000 requests finishes (processing_status is ended): 9,700 succeeded, 200 errored, 100 expired. What is the most sensible next step?",
    "options": [
      "Resend all 10,000 requests because the batch did not fully succeed",
      "Wait longer because expired requests are reprocessed automatically",
      "Join results by custom_id; collect the expired requests (and those that errored with transient errors) into a new batch; fix the requests that errored because they were invalid, then resend",
      "Treat expired requests as successes with empty content"
    ],
    "explain": "**Correct: handle each result type separately.** Each result line has {{result.type}}: {{succeeded}}, {{errored}}, {{canceled}}, {{expired}}.\n- **expired:** the batch hit its processing deadline (24 hours) before reaching that request; the request itself is fine, so resending is reasonable.\n- **errored:** you need to read the error. If the request is invalid (for example an unsupported parameter), fix it before resending; if the error is transient, resend.\n- Always join by {{custom_id}} because result order is not guaranteed.\n\n### Why the other options are wrong\n- **Resend all 10,000:** you pay twice for the 9,700 results you already have.\n- **Wait for automatic reprocessing:** the batch is already ended; there is no automatic reprocessing.\n- **Treat expired as success:** you would write empty data into the DB as if it were valid, and the error becomes very hard to detect later."
  },
  "qz-claude-069": {
    "q": "[Applications] You are about to present the Message Batches API to your team. Which statements are correct? (Select 2)",
    "options": [
      "Pricing is 50% of a regular Messages API call",
      "You can stream each request's result back to the client in real time",
      "Results come back in the same order as the requests were sent",
      "Most batches finish within 1 hour, 24 hours at most; requests not processed before the deadline come back as expired",
      "Server-side fallback on refusal works inside batches"
    ],
    "explain": "**Correct: 50% lower price, and the 1 hour / 24 hour timeline with expired results.** A batch processes asynchronously up to 100,000 requests (or 256 MB) per batch; results are kept for 29 days.\n\n### Why the remaining statements are wrong\n- **Stream each request:** batches do not support streaming; you poll the status and read the result file once {{processing_status}} is {{ended}}.\n- **Same order:** results can arrive in any order; you must join by {{custom_id}}.\n- **Fallback inside batches:** server-side fallback (beta) is not available in the Batch API; with batches you read each result's {{stop_reason}} yourself and handle refusals yourself."
  },
  "qz-claude-070": {
    "q": "[Applications] The team has enabled server-side fallback (beta, \"fallbacks\": \"default\") for a chatbot to reduce false refusals. They want to use exactly the same thing for a nightly Message Batch job. Which statement is correct?",
    "options": [
      "You just need to add fallbacks to the params of each request in the batch",
      "Fallback makes refusals disappear entirely, so stop_reason no longer needs checking",
      "Fallback only applies to 529 errors and has nothing to do with refusals",
      "Server-side fallback is not available in the Batch API; the batch job must read the refusal stop_reason in each result and decide itself whether to reprocess"
    ],
    "explain": "**Correct: batches do not support server-side fallback.** Fallback (beta) makes the API rerun a refused request on a fallback model **within the same** regular Messages API request. The Batch API does not support this feature, so the batch job must do it itself: read each result, see {{stop_reason}} is {{refusal}}, record a metric using {{stop_details}}, and decide whether to resend (for example with a regular request that has fallback) or hand it to a human.\n\n### Why the other options are wrong\n- **Add fallbacks to params:** not supported in batches.\n- **No need to check stop_reason:** even when fallback runs, the fallback model can still refuse; always check stop_reason.\n- **Only for 529:** this fallback handles refusals, not overload errors. Overload is handled with retry/backoff."
  },
  "qz-claude-071": {
    "q": "[Applications] An AI service runs 10 pods. Each pod throttles itself to 80% of the organization's input tokens per minute (ITPM) limit, yet at peak hours it still gets 429s constantly. What is the cause and the fix?",
    "options": [
      "The limit applies to the whole organization/workspace, so the 10 pods together go far over it; you need central throttling (a shared queue + token bucket, for example Redis) below the limit",
      "Each pod needs its own API key to get its own limit",
      "Limits only count requests, so you just need to pack many questions into one request",
      "Raise the retry count on 429 to 20"
    ],
    "explain": "**Correct: the limit is shared.** Rate limits apply per organization (and workspace) for each model group, along three dimensions: requests per minute, input tokens per minute, output tokens per minute. 10 pods × 80% = 800% of the limit. You need a **shared** throttle: pods push jobs to a queue, workers pull jobs through a shared token bucket (Redis + Lua for atomicity), running about 10–20% below the limit.\n\n### Why the other options are wrong\n- **A separate API key per pod:** keys in the same organization/workspace share the limit; this is not a way to raise it.\n- **Only requests count:** wrong, input/output tokens are limited too; packing many questions into one request actually makes ITPM climb faster.\n- **Retry 20 times:** retries do not create more quota; they only create a request storm and add latency."
  },
  "qz-claude-072": {
    "q": "[Applications] You want the workers to slow down before hitting a 429, instead of waiting for the error and reacting. Which data source fits best?",
    "options": [
      "Call the count_tokens endpoint before every request to learn how much quota the organization has left",
      "Read the anthropic-ratelimit-*-remaining and -reset headers (requests, input-tokens, output-tokens) in every response",
      "Read usage.input_tokens in the response body to infer the remaining quota",
      "There is no way to know in advance; only react when you get a 429"
    ],
    "explain": "**Correct: the rate limit headers.** Every response carries {{anthropic-ratelimit-requests-remaining}}, {{anthropic-ratelimit-input-tokens-remaining}}, {{anthropic-ratelimit-output-tokens-remaining}} plus the {{-limit}} and {{-reset}} headers. Feed them into your throttle (or dashboard) so you slow down when the remaining amount gets low. Once you do get a 429, read {{retry-after}}.\n\n### Why the other options are wrong\n- **count_tokens:** counts the tokens of **one prompt**, it does not tell you the organization's remaining quota.\n- **usage.input_tokens:** the token count of that request itself, not the quota.\n- **No way to know:** wrong; the remaining headers exist precisely for this."
  },
  "qz-claude-073": {
    "q": "[Applications] You placed cache_control at the end of the system prompt, but cache_read_input_tokens is almost always 0. Diffing two consecutive requests shows the \"Customer context\" section (Java serializing a HashMap to JSON) sits in the system prompt with the key order changing between calls. What is the right fix?",
    "options": [
      "Add a second breakpoint right after the context section to get an \"approximate match\" cache",
      "Switch to the 1-hour TTL so the cache lives longer",
      "The cache matches the prefix byte for byte, so a changing key order breaks it; serialize deterministically (sort keys, LinkedHashMap/TreeMap) and, better still, move per-customer data after the breakpoint",
      "Prompt caching does not work with JSON content"
    ],
    "explain": "**Correct: the prefix must be identical byte for byte.** {{HashMap}} does not guarantee iteration order, so the generated JSON can differ in key order between calls (or between JVMs). With caching, a single character difference before the breakpoint forces everything after it to be rewritten. Fix: serialize with a fixed order, and move per-customer changing data **after** the breakpoint (into the user message) so the system part stays stable.\n\n### Why the other options are wrong\n- **A second breakpoint for approximate matching:** the cache does not fuzzy match; the extra breakpoint still sits after the part that already diverged.\n- **1-hour TTL:** the problem is a different prefix, not expiration; a longer TTL does not help.\n- **Does not work with JSON:** the cache does not care what the content is, it only needs an identical prefix.\n\n> Write an automated test that builds the request twice with different data and asserts the part before the breakpoint is identical: it catches this bug right in CI."
  },
  "qz-claude-074": {
    "q": "[Applications] A chatbot route has a 30K-token system prompt with cache_control. Which changes would make the cache hit rate drop sharply? (Select 3)",
    "options": [
      "Insert the current time (down to the second) at the start of the system prompt",
      "Add or remove tools in the tools array depending on each user's permissions",
      "The user's new question sits in messages, after the last breakpoint",
      "An A/B test alternates between two different models on the same route",
      "Send the next request within the TTL with an identical prefix"
    ],
    "explain": "**Correct: a timestamp at the top of the system prompt, tools that change per user, and switching models.**\n- **Timestamp:** makes the prefix different from the very first byte on every request, so the cache almost always misses.\n- **Changing tools:** the prefix render order is {{tools}}, then {{system}}, then {{messages}}; tools come first, so adding or removing one tool breaks the entire cache behind it. Keep a fixed tool set per route and check permissions in the tool execution layer.\n- **Switching models:** the cache is separate per model; alternating two models splits the traffic and each side has to write its own cache.\n\n### Why the other two options do not hurt the cache\n- **Question after the breakpoint:** this is exactly the right design: the dynamic part comes after the cached part.\n- **Resending within the TTL with an identical prefix:** this is a cache hit, and each use also refreshes the TTL."
  },
  "qz-claude-075": {
    "q": "[Applications] A route with a very short system prompt (about 300 tokens) has cache_control attached. Every response has cache_creation_input_tokens and cache_read_input_tokens equal to 0, and the API reports no error. Which explanation is correct?",
    "options": [
      "cache_control only works when placed on the last user message",
      "You must send a beta header to enable prompt caching",
      "The cache only takes effect from the third request onward",
      "The prefix is shorter than the model's minimum cacheable length, so it is not cached, and the API reports no error; caching is only worth it for sufficiently long prefixes"
    ],
    "explain": "**Correct: below the minimum length nothing is cached, and there is no error.** Each model has a minimum prefix length to be cached (a few hundred to a few thousand tokens depending on the model). A shorter prefix still runs normally, it is simply never written to or read from the cache. With a 300-token system prompt the caching benefit is tiny anyway; put the effort into routes with long prefixes (documents, tool definitions, long histories).\n\n### Why the other options are wrong\n- **Only on the last user message:** cache_control can be placed on tools, system, or messages; the right position is the end of the stable part.\n- **Beta header:** prompt caching works without a beta header.\n- **From the third request:** the first request writes the cache (cache_creation greater than 0), later requests within the TTL read it; there is no \"third time\" rule."
  },
  "qz-claude-076": {
    "q": "[Applications] An internal tool sends a 60K-token document (with cache_control set) in every request, but there are only about 4 requests per hour, ~15 minutes apart. Usage shows every request writes the cache and never reads it. What is the most appropriate adjustment?",
    "options": [
      "Use the 1-hour TTL for that breakpoint, accepting a higher cache write price (about 2x the input price) so requests 15 minutes apart can still read the cache",
      "Raise the number of breakpoints to 8 so the cache lives longer",
      "Put the document after the question so the end of the prompt gets cached",
      "Set a 24-hour TTL so the cache is written only once a day"
    ],
    "explain": "**Correct: the 1-hour TTL.** The default TTL is 5 minutes and is refreshed every time the cache is used. Sparse traffic (once every 15 minutes) means the cache always expires before the next request, so every call pays the **write** price (about 1.25x input) and never gets the **read** price (about 0.1x). With a 1-hour TTL, only the first call pays the higher write price (about 2x), and later calls within that hour read the cache cheaply.\n\n### Why the other options are wrong\n- **8 breakpoints:** at most 4 breakpoints per request; the number of breakpoints also does not affect lifetime.\n- **Document after the question:** the cache matches by **prefix**; if the changing question comes first, the prefix changes every time and the cache is useless.\n- **24-hour TTL:** there are only two TTL choices, 5 minutes and 1 hour."
  },
  "qz-claude-077": {
    "q": "[Applications] In one session a lawyer asks about 20 questions about the same 200-page contract PDF. Right now the backend resends the whole base64 file for every question. What is the most appropriate optimization?",
    "options": [
      "Send the base64 but gzip it first to reduce tokens",
      "Upload the PDF once through the Files API, reference it by file_id in later requests, and put cache_control after the document block so later questions read the cache",
      "Convert each PDF page to an image because images are cheaper",
      "Summarize the contract into a short paragraph and send only the summary for every question, including detailed questions about specific clauses"
    ],
    "explain": "**Correct: Files API + prompt caching.** The Files API lets you upload a file once and reference it by {{file_id}}, so you no longer ship tens of MB on every request. But the document tokens are **still counted** every time the model reads it; to cut token cost, put the document first and attach {{cache_control}} right after it: later questions within the TTL only pay the cache read price (about 0.1x).\n\n### Why the other options are wrong\n- **gzip:** tokens are counted on the content the model reads, not on bytes transferred; compressing the wire does not reduce tokens.\n- **Convert to images:** no cheaper and you lose the PDF text layer; a PDF block already lets the model read both text and images.\n- **Send only the summary:** you lose detail; questions about specific clauses will be answered incorrectly or hallucinated."
  },
  "qz-claude-078": {
    "q": "[Applications] The following request returns a 400 error:\n~~~json\n{\n  \"model\": \"claude-sonnet-5-5\",\n  \"max_tokens\": 2048,\n  \"output_config\": { \"format\": { \"type\": \"json_schema\", \"schema\": { \"...\": \"...\" } } },\n  \"messages\": [{ \"role\": \"user\", \"content\": [\n    { \"type\": \"document\", \"source\": { \"type\": \"file\", \"file_id\": \"file_abc\" },\n      \"citations\": { \"enabled\": true } },\n    { \"type\": \"text\", \"text\": \"Extract the contract penalty clauses.\" }\n  ] }]\n}\n~~~\nWhat is the most likely cause?",
    "options": [
      "Missing a dedicated beta header for citations",
      "The document block must come after the question text",
      "Citations and structured outputs cannot be used together in one request; you must pick one",
      "max_tokens 2048 is too low for a long document"
    ],
    "explain": "**Correct: citations cannot be combined with structured outputs.** Enabling {{citations.enabled}} on a document while also constraining the output with {{output_config.format}} is a rejected combination (400). Choose based on what you need:\n- You need **accurate citations** down to a passage in the document for display/audit: keep citations, drop structured outputs, parse the answer with its citations.\n- You need **JSON that matches the schema**: drop citations, add fields like {{quote}} and {{clause_number}} to the schema, then verify yourself that the quoted passage really exists in the source text.\n\n### Why the other options are wrong\n- **Beta header for citations:** not the cause of this error.\n- **Document/text order:** putting the document **before** the question is the recommended layout.\n- **Low max_tokens:** only causes output truncation (stop_reason max_tokens), not a 400."
  },
  "qz-claude-079": {
    "q": "[Applications] A user wants Opus 5.5 to review a 900-page PDF case file in one go. Which design respects the API limits?",
    "options": [
      "The context is 1M tokens, so any PDF fits as long as the total stays under 1M",
      "Just raise max_tokens to 128K to fit the document",
      "Use the Batch API because batches have no page limit",
      "A single request is capped at 600 PDF pages/images (with a 1M-context model) plus the request size limit; split the case file into parts, process each part (possibly in parallel), then combine"
    ],
    "explain": "**Correct: split the document.** Beyond the token limit, each request is also capped at **600 images or PDF pages** (100 with a 200K-context model) and by the payload size limit. For 900 pages: split by chapter/part, have each call extract the needed points into a fixed format, then a final call combines them. This approach also makes each part easier to check and lets you run parts in parallel.\n\n### Why the other options are wrong\n- **Under 1M tokens is enough:** wrong, the page-count and request-size limits can be hit before the token limit.\n- **Raise max_tokens:** max_tokens is the output ceiling, it does not let a request carry more pages.\n- **Batches have no page limit:** every request inside a batch is still a normal Messages request with the same limits."
  },
  "qz-claude-080": {
    "q": "[Applications] You send Claude Opus 5.5 (1M-token context) a request with about 950K input tokens and max_tokens 100K. What happens?",
    "options": [
      "The API accepts it because the input still fits the context; if generation reaches the context limit, the model stops with stop_reason model_context_window_exceeded",
      "The API returns 400 immediately because input plus max_tokens exceeds 1M",
      "The API automatically trims the oldest messages to fit and returns end_turn",
      "The API silently lowers max_tokens to 50K"
    ],
    "explain": "**Correct: accepted, possibly stopping with model_context_window_exceeded.** From Claude 4.5 models onward, if input + max_tokens exceeds the context window but **the input alone still fits**, the API accepts the request. When generation reaches the context limit, the response stops with {{stop_reason}} set to {{model_context_window_exceeded}}. Code must treat this value as a form of incomplete output.\n\n### Why the other options are wrong\n- **Immediate 400:** only happens when **the input alone** already exceeds the context window (the \"prompt is too long\" error), or on older-generation models.\n- **Trims old messages automatically:** the API does not trim history; to do that you summarize yourself or use compaction (beta).\n- **Silently lowers max_tokens:** there is no such implicit behavior.\n\n> Use the token counting API to estimate up front, and track the rate of unusual stop_reason values per route."
  },
  "qz-claude-081": {
    "q": "[Applications] An app streams Opus 5.5 answers at effort high. Users complain the screen \"freezes\" for 10–20 seconds before any text appears; logs show the thinking block has empty content. Which improvement is right?",
    "options": [
      "Enable thinking type enabled with budget_tokens to receive the raw reasoning content",
      "Set thinking display to summarized to stream a summary of the reasoning and show \"thinking\"",
      "Disable streaming so the user gets the answer in one shot",
      "Add a beta header so the API returns the model's raw reasoning"
    ],
    "explain": "**Correct: display summarized.** On many current models the thinking block is **empty** by default (display omitted): the model still reasons (and output tokens are still billed) but the client sees nothing. Set {{thinking.display}} to {{summarized}} to receive a summary of the reasoning over the stream, showing the user the model is working. If you really want it faster, consider lowering the effort for this route.\n\n### Why the other options are wrong\n- **enabled + budget_tokens:** budget_tokens was removed on the 5.x models (400); and raw reasoning is never returned.\n- **Disable streaming:** the user waits even longer, because they have to wait for the whole answer.\n- **Beta header for raw reasoning:** it does not exist; only the summary is available."
  },
  "qz-claude-082": {
    "q": "[Applications] An extraction route already uses structured outputs (output_config.format with json_schema) but about 1% of responses still fail to parse. All the failing responses have stop_reason max_tokens. What is the right handling?",
    "options": [
      "Structured outputs are unreliable; go back to instructing \"return JSON\" in the prompt",
      "Set additionalProperties to true so the schema is easier to satisfy",
      "Output is cut off when it hits max_tokens (the schema cannot prevent this); check stop_reason before parsing, raise max_tokens or shorten the requested output",
      "Retry the exact same request until it parses"
    ],
    "explain": "**Correct: this is truncation caused by max_tokens.** Structured outputs constrain the **shape** of what the model generates, but if the {{max_tokens}} ceiling is hit, generation stops midway and the JSON is missing its closing braces. Always check {{stop_reason}} before parsing: on {{max_tokens}} do not parse, raise the ceiling (stream if large), shorten long fields, or extract fewer items per request. Do not forget that thinking also consumes max_tokens.\n\n### Why the other options are wrong\n- **Back to prompting:** even less reliable and it does not fix truncation.\n- **additionalProperties true:** loosening the schema has nothing to do with output being cut off.\n- **Retry as-is:** with the same max_tokens ceiling it usually gets cut at roughly the same place; wasted money."
  },
  "qz-claude-083": {
    "q": "[Applications] A cost dashboard computes input cost as usage.input_tokens × input price. After enabling prompt caching, the number on the dashboard is much lower than the invoice. Where is the bug?",
    "options": [
      "The invoice is wrong because input_tokens already includes tokens read from cache",
      "You must add thinking tokens as a separate fee on top of output",
      "Only output_tokens needs to be counted because cached input is free",
      "With caching, input_tokens only covers the uncached part; you must add cache_creation_input_tokens (write price) and cache_read_input_tokens (read price), along with output_tokens"
    ],
    "explain": "**Correct: input is split into three parts.** With caching, usage splits input into {{input_tokens}} (the part after the last breakpoint, regular price), {{cache_creation_input_tokens}} (cache write, about 1.25x or 2x depending on TTL) and {{cache_read_input_tokens}} (cache read, about 0.1x). All three count toward the context window and all three are priced. Correct formula: each part × its price, plus {{output_tokens}} × the output price.\n\n### Why the other options are wrong\n- **input_tokens already includes cache:** the opposite, input_tokens excludes the two cache parts.\n- **Thinking is a separate fee:** thinking tokens are billed **as output tokens**, already inside output_tokens.\n- **Cached input is free:** cache reads are cheap but not free, and cache writes cost more than regular input."
  },
  "qz-claude-084": {
    "q": "[Model Selection] A ticket-summarization route runs Opus 5.5 at effort high; quality is good but the cost is high. You have a 200-case eval suite. What is the most sensible optimization step?",
    "options": [
      "Run the eval at lower effort (medium, low) on Opus 5.5 and compare with Sonnet 5.5; pick the cheapest configuration that still meets the quality bar",
      "Send thinking type disabled to remove the reasoning cost entirely",
      "Switch to Haiku 5.5 right away because it is the cheapest model",
      "Set budget_tokens 1024 to cap the thinking tokens"
    ],
    "explain": "**Correct: effort sweep + model comparison via eval.** {{output_config.effort}} is the first cost lever within the same model: lower effort means fewer reasoning tokens, faster and cheaper. Summarization usually does not need high effort. Run the eval at a few effort levels and a few models, compare quality, latency, and **cost per completed task**, then pick the cheapest option that meets the bar.\n\n### Why the other options are wrong\n- **thinking disabled:** Opus 5.5 cannot turn thinking off; sending disabled returns 400.\n- **Switch to Haiku immediately:** it might be right, but you must prove it with the eval; jumping straight over without measuring easily hurts quality.\n- **budget_tokens:** already removed on the 5.x models (400). Use effort instead, and max_tokens as the hard ceiling."
  },
  "qz-claude-085": {
    "q": "[Model Selection] After moving a route from an older model (default effort high) to Opus 5.5 without setting effort, the team finds answers to hard analysis tasks are shallower than before. What is the most likely cause and the fix?",
    "options": [
      "Opus 5.5 is worse than the older model; go back to the old model",
      "Opus 5.5 defaults to effort medium; set output_config.effort explicitly per route and rerun the effort sweep on the eval",
      "Add temperature 1 so the model is more creative",
      "Raise max_tokens, because a larger max_tokens automatically makes the model think deeper"
    ],
    "explain": "**Correct: the default effort differs.** Opus 5.5 defaults to effort {{medium}}, while many other models default to {{high}}. If you do not set effort explicitly, switching models silently changes the reasoning depth. The same effort name is calibrated differently across models, so every model switch should rerun the effort sweep and lock effort per route.\n\n### Why the other options are wrong\n- **Go back to the old model:** a hasty conclusion; you have not ruled out a configuration difference.\n- **temperature 1:** with the newer API version, sending temperature returns 400; temperature does not control reasoning depth either.\n- **Raise max_tokens:** only raises the output ceiling, it does not make the model think more; depth is decided by effort and question difficulty."
  },
  "qz-claude-086": {
    "q": "[Model Selection] An extraction pipeline uses tool_choice {\"type\": \"tool\", \"name\": \"record_invoice\"} and runs fine on Haiku 5.5. When this route moves to Sonnet 5.5 to improve quality, every request returns 400. What is the explanation and the fix?",
    "options": [
      "Sonnet 5.5 needs a dedicated beta header to use tools",
      "The tool name must change per the new Sonnet 5.5 convention",
      "Haiku 5.5 still accepts forced tool use (forced calls skip thinking), while Sonnet 5.5 returns 400 for tool_choice any/tool; switch to structured outputs or auto + strict: true",
      "Sonnet 5.5 does not support tool use"
    ],
    "explain": "**Correct: forced tool use support differs between models.** Per the docs, Opus 5.5, Sonnet 5.5, Fable 5.1 (and Mythos 5.1) return **400** for {{tool_choice}} {{any}} or {{tool}}. Some other models such as Haiku 5.5 still accept it, but forced calls **skip thinking** (the response starts directly with tool_use). Fixes for Sonnet 5.5:\n- The only goal is to get JSON: use **structured outputs** ({{output_config.format}}).\n- The model needs to act through tools: {{tool_choice}} {{auto}}, {{strict: true}} on the tool, and clear instructions in the prompt.\n\n### Why the other options are wrong\n- **Beta header / rename the tool:** unrelated; tool use is a standard feature.\n- **No tool support:** Sonnet 5.5 fully supports tool use, it just does not allow forcing a call.\n\n> Store capabilities per model instead of hard-coding tool_choice in a shared library."
  },
  "qz-claude-087": {
    "q": "[Model Selection] Old code sends thinking: {type: \"enabled\", budget_tokens: 8000} to cap reasoning cost. On Sonnet 5.5 the request returns 400. What is the right replacement that still keeps a cost ceiling?",
    "options": [
      "Lower budget_tokens to 1024",
      "Move budget_tokens inside output_config",
      "Use stop_sequences to cut the reasoning part",
      "Drop budget_tokens; use adaptive thinking (or the default) with output_config.effort to adjust depth, and max_tokens as the hard ceiling because thinking counts toward max_tokens"
    ],
    "explain": "**Correct: effort + max_tokens.** From Claude 4.7 onward (including the 5.x models), setting {{budget_tokens}} returns a 400 error. Thinking on these models is adaptive: the model decides how much to think, and you tune it with {{output_config.effort}}. For a hard ceiling, use {{max_tokens}}: thinking tokens are part of max_tokens and are billed like output.\n\n### Why the other options are wrong\n- **Lower budget_tokens:** still a rejected parameter, small or large values both give 400.\n- **Move it into output_config:** there is no such field; inventing parameters just leads to validation errors.\n- **stop_sequences:** applies to generated text, not a mechanism to limit reasoning."
  },
  "qz-claude-088": {
    "q": "[Model Selection] Monthly cost estimate for a summarization feature: 100,000 documents/month, about 6,000 input tokens and 300 output tokens each, running Sonnet 5.5 ($2/MTok input, $10/MTok output), regular calls, no cache, no batch. Which result is closest?",
    "options": [
      "About $1,500",
      "About $1,200",
      "About $3,000",
      "About $750"
    ],
    "explain": "**Correct: about $1,500.**\n- Input: 100,000 × 6,000 = 600M tokens = 600 MTok × $2 = **$1,200**.\n- Output: 100,000 × 300 = 30M tokens = 30 MTok × $10 = **$300**.\n- Total ≈ **$1,500**/month.\n\n### Why the other options are wrong\n- **$1,200:** forgot the output part (output costs 5x input per token).\n- **$3,000:** that is the Opus 5.5 figure ($4/$20), twice Sonnet.\n- **$750:** the figure if you use the Batch API (50% off), contrary to \"regular calls\".\n\n> When reporting, mention the levers: Batch (-50% if you do not need results immediately), caching the shared prompt, and trying Haiku 5.5 ($0.10/$0.50) on the eval: if it meets the bar, that is about $75/month."
  },
  "qz-claude-089": {
    "q": "[Model Selection] An engineer proposes a \"cascade\": call Haiku 5.5 for every request first, and if quality is poor, call Opus 5.5 again. Which risks must be raised before accepting?",
    "options": [
      "No risk, because Haiku and Opus share the prompt cache",
      "Every escalation costs an extra call and adds latency; the cache is per model, so the prefix must be written again on the second model; measure cost per completed task against a single model at lower effort",
      "A cascade is always cheaper than a single model, so just ship it",
      "The API escalates to Opus automatically when fallbacks is enabled; no need to build it"
    ],
    "explain": "**Correct: a cascade has hidden costs.** For requests that must escalate, you pay **twice** (Haiku then Opus), latency adds up, and you need a reliable \"quality assessment\" step (which itself costs money or is error-prone). The prompt cache is per model, so a long prefix must be cached on both models. Often a single model at lower effort is cheaper and faster than a cascade. Decide with data: cost and latency per completed task.\n\n### Why the other options are wrong\n- **Shared cache:** wrong, each model has its own cache.\n- **Always cheaper:** only true when the escalation rate is low and the assessment step is cheap; measure it.\n- **fallbacks escalates automatically:** server-side fallback handles **refusals**, not \"poor quality\"."
  },
  "qz-claude-090": {
    "q": "[Model Selection] An old agent harness on Sonnet 4.6 relied on the model \"knowing by itself\" how much context budget was left. After moving to Sonnet 5.5, the agent no longer saves progress when context is nearly full. Which explanation is correct?",
    "options": [
      "You must enable a context-awareness beta header on Sonnet 5.5",
      "Injecting token budget tags into the system prompt the way the API does is enough to restore the feature",
      "Sonnet 5.5 (along with Opus 5.5, Haiku 5.5, Fable 5.1) does not receive the token budget tags the API used to inject; give the model an explicit budget with task budgets (beta) and have the harness track usage itself",
      "Context awareness is only disabled when effort is low"
    ],
    "explain": "**Correct: the newer models have no automatic context awareness.** Sonnet 4.6, Sonnet 5 (and some other models) have **context awareness**: the API injects the total budget and updates the remaining token count after each tool call. Opus 4.7 onward, Sonnet 5.5, Haiku 5.5, Fable 5.1 do **not** receive these tags. On those models, use **task budgets** (beta) to tell the model its budget, while the harness counts {{usage}} itself and proactively saves state, compacts, or opens a fresh context.\n\n### Why the other options are wrong\n- **Context-awareness beta header:** there is no such header; the feature depends on the model.\n- **Inject tags like the API:** those tags are injected by the API, the docs say you do not send them yourself; mimicking them offers no guarantee.\n- **Related to effort:** effort does not turn context awareness on or off."
  },
  "qz-claude-091": {
    "q": "[Model Selection] Opus 5.5 at effort xhigh still gets about 10% of very hard analysis tasks wrong. Management wants to move all traffic to Fable 5.1. Which statement about cost and approach is most accurate?",
    "options": [
      "Fable 5.1 costs the same as Opus 5.5, so moving everything is reasonable",
      "Fable 5.1 is cheaper because it is faster",
      "Fable 5.1 only has a 200K context so it cannot handle long tasks",
      "Fable 5.1 costs about 2.5x Opus 5.5 ($10/$50 vs $4/$20 per MTok); route only the hard-task group that the eval proves benefits, keep Opus for the rest"
    ],
    "explain": "**Correct: selective routing.** Fable 5.1 is the strongest model for very hard reasoning and long agentic tasks at $10 input / $50 output per MTok, 2.5x Opus 5.5 ($4/$20), and usually slower. Moving all traffic to fix 10% hard tasks means paying 2.5x for the 90% that were already fine. The right approach: characterize the hard-task group, run the Fable eval on that group, and route only that group to Fable if the improvement is measurable.\n\n### Why the other options are wrong\n- **Same price:** wrong, Fable is significantly more expensive.\n- **Cheaper because faster:** Fable is not a fast or cheap model; pricing is per token.\n- **200K context:** current models, including Fable 5.1, have a 1M context."
  },
  "qz-claude-092": {
    "q": "[Model Selection] Two configurations for an invoice extraction feature: Haiku 5.5 costs about $0.002 per request but 30% of results need manual fixes; Sonnet 5.5 costs about $0.03 per request and 2% need fixes. How do you compare the two options?",
    "options": [
      "Compare cost per completed task that meets the bar, including retries and human fix time, then pick the option with the lowest total cost that meets the quality threshold",
      "Pick Haiku because the per-request price is 15x cheaper",
      "Pick Sonnet because a bigger model is always better",
      "Run both for every request and take the longer result"
    ],
    "explain": "**Correct: cost per completed task.** The per-request price is only one part. If 30% of invoices need a human fix and each fix takes a few minutes of work, the true cost of Haiku can be several times higher than Sonnet. Conversely, if prompt improvements get Haiku to a low error rate, Haiku wins. Decide on total cost (API + retries + people) per correctly processed invoice, at the same minimum quality bar.\n\n### Why the other options are wrong\n- **Look only at the request price:** ignores the cost of fixing errors, usually the largest part.\n- **A bigger model is always better:** not always worth the money; measure it.\n- **Run both and take the longer result:** doubles the cost, and \"longer\" does not mean \"more correct\"."
  },
  "qz-claude-093": {
    "q": "[Model Selection] A RAG route sends a cached 200K-token prefix, read thousands of times per hour. You compare the cache cost of that prefix between Opus 5.5 and Sonnet 5.5. Which statements are correct? (Select 2)",
    "options": [
      "Opus 5.5 reads the cache at $0.20/MTok, about 0.05x its input price ($4/MTok)",
      "Sonnet 5.5 reads the cache at $0.20/MTok, about 0.1x its input price ($2/MTok)",
      "Cache reads cost the same as cache writes",
      "Writing the cache with a 5-minute TTL is cheaper than regular input",
      "Fable 5.1 does not support prompt caching"
    ],
    "explain": "**Correct: both models have the same $0.20/MTok cache read price.** Because Opus 5.5 has twice the input price of Sonnet 5.5 but the same cache read price, the cached prefix on Opus costs only about 0.05x its input price. For a route where most of the input is cache reads, the input cost gap between Opus and Sonnet narrows substantially; the remaining difference is mainly in the uncached part and output.\n\n### Why the remaining options are wrong\n- **Read equals write:** writes cost more than regular input (about 1.25x with a 5-minute TTL, about 2x with 1 hour), reads are far cheaper.\n- **5-minute write cheaper than input:** the opposite, writes cost about 25% more than input.\n- **Fable does not support caching:** wrong, Fable 5.1 has its own cache read price ($0.25/MTok)."
  }
});
