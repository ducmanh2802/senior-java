/*
 * English translation of js/data/quiz-claude.js — task T413. Format: js/core/i18n.js (content overlay).
 * ids: qz-claude-001 qz-claude-002 qz-claude-003 qz-claude-004 qz-claude-005 qz-claude-006 qz-claude-007 qz-claude-008 qz-claude-009 qz-claude-010 qz-claude-011 qz-claude-012 qz-claude-013 qz-claude-014 qz-claude-015 qz-claude-016 qz-claude-017 qz-claude-018 qz-claude-019 qz-claude-020 qz-claude-021 qz-claude-022 qz-claude-023 qz-claude-024 qz-claude-025 qz-claude-026 qz-claude-027 qz-claude-028 qz-claude-029 qz-claude-030 qz-claude-031 qz-claude-032 qz-claude-033 qz-claude-034 qz-claude-035 qz-claude-036 qz-claude-037 qz-claude-038 qz-claude-039 qz-claude-040 qz-claude-041 qz-claude-042 qz-claude-043 qz-claude-044 qz-claude-045 qz-claude-046 qz-claude-047 qz-claude-048 qz-claude-049 qz-claude-050 qz-claude-051 qz-claude-052 qz-claude-053 qz-claude-054 qz-claude-055 qz-claude-056 qz-claude-057 qz-claude-058 qz-claude-059 qz-claude-060 qz-claude-061 qz-claude-062 qz-claude-063
 */
App.i18n.content({
  "qz-claude-001": {
    "q": "[Applications] A chatbot built on the Messages API answers out of context on the third turn because each request sends only the latest message. What is the most appropriate root cause and fix?",
    "options": [
      "The API is stateless; you must send the full message history in order, and trim or summarize it when the context is nearly full",
      "The API stores the history per conversation_id, so you only need to send the new message",
      "Send a new system prompt on every turn so the API restores the context",
      "Increase max_tokens so the API remembers previous turns"
    ],
    "explain": "**Correct answer: the Messages API is stateless.** Each request is independent and the server keeps no history; the client must send the messages array in order. When the conversation gets long, trim or summarize the older part so it does not exceed the context window.\n\n### Why the other options are wrong\n- **The API stores history itself**: there is no default conversation_id; you have to manage it yourself.\n- **A new system prompt every turn**: the system prompt steers behavior, it does not replace the conversation history.\n- **Increasing max_tokens**: this only caps output length, it does not make the model remember previous turns."
  },
  "qz-claude-002": {
    "q": "[Applications] The response comes back with stop_reason set to max_tokens: the answer was cut off mid-way. What is the most sensible next step?",
    "options": [
      "Retry the same request as-is because this is a transient server error",
      "Call again with a larger max_tokens (use streaming if the output is long), or ask the model to answer more concisely",
      "Lower the temperature so the model writes fewer words",
      "Treat the answer as complete and return it to the user"
    ],
    "explain": "**Correct: option 2.** {{max_tokens}} is the ceiling on the number of **output** tokens for a single turn. When the model hits the ceiling, the API stops generating and returns {{stop_reason: \"max_tokens\"}}: the request **succeeded** (HTTP 200) but the content was truncated.\n\n### Why the other options are wrong\n- **Retry the same request:** this is not a transient error. Sending the exact same request again gets cut at the same place.\n- **Lower the temperature:** temperature does not determine length. On the newer API version, sending temperature to current models actually returns a 400 error.\n- **Treat it as done:** the answer is incomplete. If it is JSON or code, it will not even parse.\n\n> Note: current models (Opus 5.5, Sonnet 5.5, Fable 5.1…) **no longer support prefill** (sending the beginning of the assistant answer up front), so you cannot \"continue\" by prefilling. If the output is genuinely long (up to 128K tokens), the SDK requires streaming so the HTTP request does not time out."
  },
  "qz-claude-003": {
    "q": "[Applications] Your application receives HTTP 529 (overloaded) when calling the Messages API. What is the most appropriate handling?",
    "options": [
      "Retry immediately in a tight loop until it succeeds",
      "Move every request to the Haiku model to avoid overload",
      "Exponential backoff with jitter, a cap on the number of retries, and a circuit breaker if the failures persist",
      "Swallow the error and serve a stale cache forever"
    ],
    "explain": "**Correct answer: 529 means temporary overload.** Use exponential backoff with jitter, cap the retries, and open a circuit breaker if the errors persist; avoid a thundering herd.\n\n### Why the other options are wrong\n- **Retry immediately**: it adds load and can get you throttled further.\n- **Move every request to Haiku**: this is not a default remedy and may reduce quality.\n- **Serve a stale cache forever**: fallback should only be temporary, never permanent."
  },
  "qz-claude-004": {
    "q": "[Applications] A 429 response has the header retry-after: 30. What should the application do?",
    "options": [
      "Ignore the header and retry after 1 second",
      "Increase the number of threads sending requests to get higher throughput",
      "Switch to another API key to bypass the limit",
      "Wait at least 30 seconds before retrying, and slow down the request rate as well"
    ],
    "explain": "**Correct answer: retry-after is the minimum wait time.** The application must wait at least 30 seconds and slow down so it does not keep exceeding the rate limit.\n\n### Why the other options are wrong\n- **Ignore the header**: it violates the guidance and easily gets you blocked again.\n- **More threads**: it makes the rate limiting worse.\n- **Switch API keys**: limits are usually at the organization/workspace level and cannot be bypassed."
  },
  "qz-claude-005": {
    "q": "[Applications] To make prompt caching effective, how should the content be ordered in the prompt?",
    "options": [
      "Put the static part first and the dynamic part last; place the cache breakpoint at the static/dynamic boundary",
      "Put the dynamic part (the user question) first and the static part (system, docs) last so the suffix gets cached",
      "Interleave static and dynamic content to spread the cache around",
      "Order does not matter, the cache finds the common prefix by itself"
    ],
    "explain": "**Correct answer: the cache works on prefixes.** The static part must come first to become the cached prefix; the dynamic part goes last. Put the breakpoint at the static/dynamic boundary.\n\n### Why the other options are wrong\n- **Dynamic first**: the prefix changes on every request, so the cache is useless.\n- **Interleave**: it destroys a stable prefix.\n- **The cache finds it by itself**: the cache does not search for a prefix; it needs ordering and a breakpoint."
  },
  "qz-claude-006": {
    "q": "[Applications] The usage object reports a high cache_read_input_tokens and a low input_tokens. What does this mean?",
    "options": [
      "The cache is not working because input_tokens is low",
      "Most of the prompt was read from cache, so cost and latency are reduced",
      "The model skipped the cached part and only processed the new part",
      "output_tokens will automatically drop accordingly"
    ],
    "explain": "**Correct answer: a high cache_read_input_tokens shows that most of the prompt was read from cache.** input_tokens only covers the part after the last breakpoint, so a low value is normal and beneficial.\n\n### Why the other options are wrong\n- **Cache not working**: on the contrary, this is the sign of a healthy cache.\n- **Skipped the cache**: cache reads are used in attention, they are not skipped.\n- **output_tokens drops**: output does not shrink just because of cache reads."
  },
  "qz-claude-007": {
    "q": "[Applications] You need to process 50,000 summaries that do not need results immediately. Which choice fits best?",
    "options": [
      "Call the Messages API synchronously 50,000 times with streaming",
      "Send them all in one request with a large max_tokens",
      "Use the Message Batches API to process them asynchronously at 50% lower cost",
      "Use prompt caching instead of batching"
    ],
    "explain": "**Correct answer: the Message Batches API processes asynchronously and cuts input/output cost by 50%**, which suits bulk workloads that are not latency-sensitive.\n\n### Why the other options are wrong\n- **50,000 synchronous calls**: it burns through rate limits and is complex.\n- **One request**: it cannot hold 50,000 independent jobs.\n- **Caching instead of batching**: caching reduces the prefix cost, it does not replace asynchronous bulk processing."
  },
  "qz-claude-008": {
    "q": "[Applications] Which statement about the Message Batches API is true?",
    "options": [
      "Results are streamed back to the client in real time",
      "Each batch holds only one request to preserve ordering",
      "Batches get no discount",
      "A batch is limited to 100,000 requests or 256MB; results are available once processing finishes or after 24 hours; results are kept for 29 days"
    ],
    "explain": "**Correct answer: a batch is limited to 100,000 requests or 256MB; results can be fetched when everything finishes or after 24 hours; results are retained for 29 days.** Batches run asynchronously and do not stream.\n\n### Why the other options are wrong\n- **Realtime streaming**: batches do not stream.\n- **One request per batch**: wrong, a batch holds many requests.\n- **No discount**: batches are 50% cheaper."
  },
  "qz-claude-009": {
    "q": "[Applications] When streaming the Messages API, which event should you handle to show text progressively to the user?",
    "options": [
      "message_start, then content_block_delta with delta.text",
      "content_block_stop, then message_delta",
      "the ping event carries the text",
      "the error event carries the full text"
    ],
    "explain": "**Correct answer: the incremental text lives in content_block_delta (delta.text).** message_start only opens the message, there is no text yet.\n\n### Why the other options are wrong\n- **content_block_stop/message_delta**: these occur when a block/message ends, not the incremental text.\n- **ping**: a heartbeat, it carries no text.\n- **error**: a failure, it does not carry the full text."
  },
  "qz-claude-010": {
    "q": "[Applications] The chatbot conversation is nearly touching the context window. Which strategy fits best?",
    "options": [
      "Just keep sending the whole history, the API will trim old turns by itself with no configuration",
      "Delete the system prompt to make room for the history",
      "Summarize older turns (yourself, or enable server-side compaction, currently in beta) and keep the most recent turns intact",
      "Increase max_tokens to expand the context window"
    ],
    "explain": "**Correct: option 3.** The Messages API is **stateless**: every request resends the entire conversation. When the context is nearly full you have to shrink the history while keeping the gist:\n1. **Summarize yourself:** call the model to summarize older turns and replace them with the summary.\n2. **Compaction (beta, header {{compact-2026-01-12}}):** the server summarizes the beginning of the conversation once it crosses a threshold. The client must append the whole {{response.content}} (including the compaction block) to the history, not just the text part.\n\n### Why the other options are wrong\n- **The API trims with no configuration:** wrong. Without compaction enabled, a request that exceeds the context fails; nothing gets trimmed automatically.\n- **Delete the system prompt:** you lose role, constraints and format, and you save very little.\n- **Increase max_tokens:** max_tokens is the **output** ceiling, it does not expand the context window. Input plus output must still fit in the context."
  },
  "qz-claude-011": {
    "q": "[Applications] Before sending a large request you want to estimate the cost. Which API fits?",
    "options": [
      "Call messages.create with max_tokens=0",
      "Multiply the character count by 4",
      "Use the token counting endpoint to count input tokens without generating output",
      "Use the batch API to count"
    ],
    "explain": "**Correct answer: the token counting endpoint returns the number of input tokens for a prompt.** Use it to estimate cost before sending.\n\n### Why the other options are wrong\n- **max_tokens=0**: this is not a way to count input.\n- **Characters × 4**: an inaccurate heuristic.\n- **Batch API**: it processes batches, it does not count tokens."
  },
  "qz-claude-012": {
    "q": "[Applications] You need responses to follow an exact JSON schema so you can parse them automatically. What is the correct approach in the Messages API?",
    "options": [
      "Ask the model in the prompt to return JSON and parse it as-is",
      "Set temperature=0",
      "Use stop_sequences to force JSON",
      "Use output_config.format with type json_schema (or strict tool use) to constrain the schema"
    ],
    "explain": "**Correct answer: output_config.format with type json_schema constrains the output to the schema.** Strict tool use likewise guarantees the schema for tool input.\n\n### Why the other options are wrong\n- **Ask in the prompt**: no guarantee of validity.\n- **temperature=0**: it only reduces randomness, it does not constrain the schema.\n- **stop_sequences**: it only stops at a string, it does not guarantee JSON."
  },
  "qz-claude-013": {
    "q": "[Applications] On Claude Opus 5.5 you want simple tasks (classification, extraction) to run faster and cheaper. Which configuration is correct?",
    "options": [
      "Set a low output_config.effort (for example low) for that route",
      "Send thinking: {type: \"disabled\"}",
      "Send thinking: {type: \"enabled\", budget_tokens: 1024}",
      "Set temperature: 0"
    ],
    "explain": "**Correct: option 1.** On Claude Opus 5.5 thinking is **always on** (adaptive). The only way to tune how deeply it reasons and how many tokens it spends is {{output_config.effort}} ({{low}} / {{medium}} / {{high}} / {{xhigh}} / {{max}}). The default on Opus 5.5 is {{medium}}; simple tasks usually meet the bar at {{low}}.\n\n### Why the other options are wrong\n- **thinking disabled:** Opus 5.5 returns a 400 error at every effort level.\n- **budget_tokens:** the old \"thinking budget\" mechanism was removed on the 5.x models. Sending it returns a 400 error.\n- **temperature: 0:** it does not make the model think less. Since API version 2026-10-21, sending temperature returns a 400 error on every model.\n\n> Interview tip: say \"tune effort per route and measure it on a sample of real requests\", not \"turn thinking off to save money\"."
  },
  "qz-claude-014": {
    "q": "[Applications] Sending an image to Claude through the Messages API. What is the correct representation?",
    "options": [
      "Send only the image URL as text",
      "An image content block with a base64 or supported url source",
      "Send the image as a binary file in a header",
      "Convert the image to ASCII art"
    ],
    "explain": "**Correct answer: use an image content block with the right source.** The model processes images directly.\n\n### Why the other options are wrong\n- **URL as text**: nothing guarantees the model fetches the image.\n- **Binary header**: the API does not accept images through headers.\n- **ASCII art**: it loses information and is unnecessary."
  },
  "qz-claude-015": {
    "q": "[Applications] Claude supports PDF input. Which statement is true?",
    "options": [
      "PDFs must always be converted to text before sending",
      "Only PDFs shorter than one page are supported",
      "You can send a PDF as a document block; the model reads the text and the images in the PDF",
      "PDFs are only available in the batch API"
    ],
    "explain": "**Correct answer: you can send a PDF as a document block**; the model reads its content (subject to context limits).\n\n### Why the other options are wrong\n- **Always convert**: not required.\n- **Only one page**: not true, the limit is the context window.\n- **Batch only**: not true."
  },
  "qz-claude-016": {
    "q": "[Applications] On Claude Opus 5.5 you need to be sure Claude calls the extract_invoice tool with input that matches the schema. Which approach fits?",
    "options": [
      "tool_choice: {type: \"tool\", name: \"extract_invoice\"}",
      "tool_choice: {type: \"any\"}",
      "Increase max_tokens and hope the model calls it",
      "tool_choice auto, a system prompt that states extract_invoice must be called, and strict: true on the tool (or structured outputs if you only need JSON)"
    ],
    "explain": "**Correct: option 4.** On Claude Opus 5.5, Sonnet 5.5 and Fable 5.1, **forced tool use** ({{tool_choice}} {{any}} or {{tool}}) returns a 400 error. The alternatives:\n1. {{tool_choice}} set to {{auto}} plus clear instructions in the prompt (for example \"always call extract_invoice with the invoice data\").\n2. {{strict: true}} on the tool definition (schema with {{additionalProperties: false}} and {{required}}). The API guarantees that {{tool_use.input}} is valid against the schema.\n3. If the goal is only to get JSON, use **structured outputs** ({{output_config.format}}); no tool is needed.\n\n### Why the other options are wrong\n- **type tool / type any:** correct for older models, but rejected (400) on the current models above.\n- **Increase max_tokens:** unrelated to choosing a tool.\n\n> This is a common trap when upgrading models: old code that forces a tool through {{tool_choice}} starts returning 400s as soon as the model changes."
  },
  "qz-claude-017": {
    "q": "[Applications] What does max_tokens control in a Messages API request?",
    "options": [
      "The maximum number of output tokens the model may generate",
      "The maximum number of input tokens",
      "The total context window tokens",
      "The number of requests per minute"
    ],
    "explain": "**Correct answer: max_tokens caps the output.** Input/context/rate limit are different concepts.\n\n### Why the other options are wrong\n- **Max input**: governed by the context window and rate limits.\n- **Context window**: a capability of the model.\n- **RPM**: rate limiting."
  },
  "qz-claude-018": {
    "q": "[Applications] When calling the Claude API over plain HTTP (without the SDK), which header is required to specify the API version?",
    "options": [
      "api-version: v1",
      "x-api-version: latest",
      "anthropic-version, for example 2023-06-01 (newer SDKs send a newer version, such as 2026-10-21)",
      "version: claude-5"
    ],
    "explain": "**Correct: option 3.** Every HTTP request to the Claude API needs three headers:\n- {{x-api-key}}: the API key;\n- {{anthropic-version}}: the API version, for example {{2023-06-01}};\n- {{content-type: application/json}}.\n\nThe official SDKs send {{anthropic-version}} for you. Recent SDK releases moved to a newer version ({{2026-10-21}}). That version changes some behavior; for example, sending {{temperature}} / {{top_p}} / {{top_k}} returns a 400 error. So when you upgrade the SDK, read the version migration guide.\n\n### Why the other options are wrong\nThe headers {{api-version}}, {{x-api-version}} and {{version}} do not exist in the Claude API. There is no \"latest\" value: the version is always a specific date, so the API behavior does not silently change under your feet."
  },
  "qz-claude-019": {
    "q": "[Applications] stop_reason is refusal. What is the appropriate handling?",
    "options": [
      "Retry indefinitely with the same prompt",
      "Increase max_tokens",
      "Read stop_details, adjust the prompt or fall back to another model, and never force the model to violate policy",
      "Swallow it and return an empty answer"
    ],
    "explain": "**Correct answer: refusal means the model declined.** You need to adjust the request or fall back safely.\n\n### Why the other options are wrong\n- **Retry indefinitely**: it does not change the outcome and wastes money.\n- **Increase max_tokens**: unrelated to policy.\n- **Return empty**: a poor experience with no explanation."
  },
  "qz-claude-020": {
    "q": "[Applications] How does Claude's web search tool differ from a user-defined tool?",
    "options": [
      "Web search must be implemented on the client",
      "User-defined tools run on Anthropic",
      "Both run on the client",
      "Web search runs on Anthropic infrastructure and the results come back in the same response"
    ],
    "explain": "**Correct answer: web search is a server tool**, Anthropic executes it and returns the results; a client tool needs a tool_result round trip.\n\n### Why the other options are wrong\n- **Web search on the client**: wrong.\n- **User-defined on Anthropic**: wrong, it runs on the client.\n- **Both on the client**: wrong."
  },
  "qz-claude-021": {
    "q": "[Model Selection] An application classifies email at high volume with low latency. Which model should you pick?",
    "options": [
      "Claude Haiku 5.5",
      "Claude Fable 5.1",
      "Claude Opus 5.5",
      "Claude Sonnet 5.5"
    ],
    "explain": "**Correct answer: Haiku 5.5 is the fastest and cheapest** for high-volume, latency-sensitive work such as classification/extraction/routing."
  },
  "qz-claude-022": {
    "q": "[Model Selection] A long-running, multi-step coding agent task. Which model fits best?",
    "options": [
      "Claude Haiku 5.5",
      "Claude Opus 5.5",
      "Claude Sonnet 5.5",
      "Claude Fable 5.1"
    ],
    "explain": "**Correct answer: Opus 5.5 is built for long-running agentic coding and knowledge work.** Fable targets very heavy reasoning/long-horizon work; Sonnet balances speed and intelligence; Haiku handles light tasks."
  },
  "qz-claude-023": {
    "q": "[Model Selection] Which model is described as offering the best balance of speed and intelligence?",
    "options": [
      "Claude Opus 5.5",
      "Claude Haiku 5.5",
      "Claude Sonnet 5.5",
      "Claude Fable 5.1"
    ],
    "explain": "**Correct answer: Sonnet 5.5** is the best combination of speed and intelligence."
  },
  "qz-claude-024": {
    "q": "[Model Selection] Very heavy reasoning, long-horizon agents; even Opus at high effort still falls short in evaluations. What should you pick?",
    "options": [
      "Claude Opus 5.5",
      "Claude Sonnet 5.5",
      "Claude Haiku 5.5",
      "Claude Fable 5.1"
    ],
    "explain": "**Correct answer: Fable 5.1** for demanding reasoning and long-horizon agentic work, or when evaluation on Opus at high effort still falls short."
  },
  "qz-claude-025": {
    "q": "[Model Selection] What is a pricing characteristic of Claude Haiku 5.5?",
    "options": [
      "Prompts above 100,000 tokens cost more for both input and output",
      "Flat price at any prompt length",
      "Prompts above 100,000 tokens get a discount",
      "It only applies to the batch API"
    ],
    "explain": "**Correct answer: Haiku 5.5 pricing depends on prompt length; prompts above 100,000 tokens cost more.** The other models offer the full 1M context at standard pricing."
  },
  "qz-claude-026": {
    "q": "[Model Selection] What is the context window of the current Claude models?",
    "options": [
      "32K tokens",
      "1M tokens",
      "128K tokens",
      "200K tokens"
    ],
    "explain": "**Correct answer: 1M tokens.** 1M is the context window of the current models (Opus/Sonnet/Haiku 5.5, Fable 5.1), covering input and output together. 128K is the **output** ceiling (max_tokens); 200K is the context of some previous models such as Haiku 4.5; 32K belongs to very old generations."
  },
  "qz-claude-027": {
    "q": "[Model Selection] What is the maximum max_tokens on the current models (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1), and what should you watch out for?",
    "options": [
      "4K tokens, nothing to watch out for",
      "128K tokens; with values that large the SDK requires streaming so the HTTP request does not time out",
      "1M tokens, equal to the context window",
      "32K tokens, which only the Batch API can raise"
    ],
    "explain": "**Correct: option 2.** Current models allow up to **128K output tokens** per turn. A non-streaming request that waits a long time can exceed the HTTP timeout, so the SDK requires streaming for large values ({{.stream()}} and then {{finalMessage()}} / {{get_final_message()}}).\n\n### Why the other options are wrong\n- **4K / 32K:** limits of very old model generations.\n- **1M:** that is the **context window** (input plus output), not the output ceiling.\n\n> Practical tip: keep max_tokens around 16K for non-streaming requests; with streaming you can go higher. Do not set max_tokens too low, because getting cut off means calling again, which costs more."
  },
  "qz-claude-028": {
    "q": "[Applications] You receive the results of a Message Batch of 10,000 requests. How should you join the results back to the source data?",
    "options": [
      "By position: result i matches request i",
      "By completion time",
      "By the content of the answer",
      "By the custom_id you assigned to each request when creating the batch"
    ],
    "explain": "**Correct: option 4.** Every request in a batch carries a {{custom_id}} that you set (for example a DB record id). Results come back **in arbitrary order**, so you must join on {{custom_id}}, never on position.\n\nEach result has a {{result.type}} of {{succeeded}}, {{errored}}, {{canceled}} or {{expired}}. Handle all four: for example, collect errored or expired requests and resend them in a later batch.\n\n### Why the other options are wrong\n- **By position:** order is not guaranteed. Joining by position assigns results to the wrong records, and that bug is very hard to detect.\n- **By time / content:** neither uniquely identifies the original request."
  },
  "qz-claude-029": {
    "q": "[Model Selection] How does cache read pricing (reading from the prompt cache) compare with regular input pricing?",
    "options": [
      "Much cheaper: about 0.1x the input price; some models have their own price (e.g. Opus 5.5: $0.20/MTok vs $4/MTok input)",
      "1.25x the input price",
      "Same as input; the cache only reduces latency",
      "Twice the input price"
    ],
    "explain": "**Correct: option 1.** Prompt caching has two kinds of cost:\n- **Cache write** (the first time a prefix is written to the cache): **more expensive** than regular input, roughly 1.25x with the 5-minute TTL, and higher with the 1-hour TTL.\n- **Cache read** (later reuse of the prefix): **much cheaper**, typically around 0.1x. Some models have their own pricing: Opus 5.5 and Sonnet 5.5 read the cache at $0.20/MTok (0.05x and 0.1x of their input price respectively), Fable 5.1 at $0.25/MTok.\n\nSo caching only pays off when the prefix is **reused many times** within the TTL.\n\n### Why the other options are wrong\n- **1.25x:** that is the **write** price, not the read price.\n- **Same as input:** wrong. Caching cuts both cost and latency.\n- **Twice:** no price tier looks like that.\n\n> To check whether the cache is working: look at {{usage.cache_read_input_tokens}}. If it is always 0 even though the prefix is identical, something is changing the prefix, for example a timestamp inside the system prompt."
  },
  "qz-claude-030": {
    "q": "[Model Selection] To optimize cost/quality, which routing strategy makes sense?",
    "options": [
      "Always use the largest model for every request",
      "Use a small/cheap model for simple tasks and escalate to a larger model when evaluation shows you need to",
      "Only use Haiku because it is the cheapest",
      "Pick the model based on the user's name"
    ],
    "explain": "**Correct answer: route by difficulty**, start with a small model and escalate when evaluation shows you need to."
  },
  "qz-claude-031": {
    "q": "[Agents] In an agent that uses tools, what is the basic loop?",
    "options": [
      "Send the prompt once and parse the text",
      "Send all tools at once and finish",
      "Send the request; if stop_reason is tool_use, run the tool and send the tool_result; repeat until end_turn",
      "Only use server tools, no loop"
    ],
    "explain": "**Correct answer: the agentic loop is driven by stop_reason tool_use**; run the tool, send the result back, and repeat until end_turn."
  },
  "qz-claude-032": {
    "q": "[Agents] stop_reason is pause_turn. What should you do?",
    "options": [
      "Ignore it and finish",
      "Retry from the beginning",
      "Increase max_tokens",
      "Send the assistant content back to continue the server-tool loop"
    ],
    "explain": "**Correct answer: pause_turn means the server-tool loop hit its iteration limit**; send the assistant content back to continue."
  },
  "qz-claude-033": {
    "q": "[Agents] Claude can call several tools in the same turn. What must the application do to handle that correctly?",
    "options": [
      "Run every tool_use block and return a matching tool_result for each",
      "Only handle the first tool_use",
      "Ignore the remaining tools",
      "Resend the prompt"
    ],
    "explain": "**Correct answer: you must handle every tool_use block and return a tool_result matching each id.**"
  },
  "qz-claude-034": {
    "q": "[Agents] If you want Claude to call one tool at a time, which parameter do you use?",
    "options": [
      "max_tokens: 1",
      "tool_choice: {type: auto, disable_parallel_tool_use: true}",
      "temperature: 0",
      "stop_sequences: [tool_use]"
    ],
    "explain": "**Correct answer: disable_parallel_tool_use inside tool_choice auto** prevents parallel tool calls."
  },
  "qz-claude-035": {
    "q": "[Agents] A tool you defined fails at runtime (for example an external API returns 500). How should you report that back to Claude?",
    "options": [
      "Skip that tool_use and send no tool_result",
      "Send a tool_result with is_error: true and a short error message, so Claude can decide whether to retry or try another way",
      "Throw an exception and stop the whole agent",
      "Send an empty tool_result as if it had succeeded"
    ],
    "explain": "**Correct: option 2.** For every {{tool_use}} in the assistant turn, the next user turn **must** contain a {{tool_result}} with the same {{tool_use_id}}. When the tool fails, send {{is_error: true}} plus a clear message (for example \"Billing API timed out after 5s\"). Claude will choose to retry, use another tool, or tell the user.\n\n### Why the other options are wrong\n- **No tool_result:** the next request fails because a tool_use is left unanswered.\n- **Stop the whole agent:** one transient failure should not ruin the whole session. Let the model handle it, with step and retry caps on your side.\n- **Pretend it succeeded:** the model reasons over data that does not exist, which leads to wrong answers nobody notices.\n\n> If Claude calls several tools in parallel, return **all** tool_results in **one** user message. Mark the failed ones with is_error, and do not leave any out."
  },
  "qz-claude-036": {
    "q": "[Agents] When sending a tool_result back to the API, which field must match the tool_use?",
    "options": [
      "name must equal the user id",
      "content must be empty",
      "type must be tool_use",
      "tool_use_id must equal the id of the tool_use block"
    ],
    "explain": "**Correct answer: a tool_result uses tool_use_id to link back to its tool_use block.**"
  },
  "qz-claude-037": {
    "q": "[Agents] To make Claude call tools less or more often, what should you do?",
    "options": [
      "Use the system prompt to describe when to use tools, plus clear tool descriptions",
      "Only tune temperature",
      "Delete the tool descriptions",
      "Increase max_tokens"
    ],
    "explain": "**Correct answer: steer through the system prompt and clear tool descriptions.** Temperature does not control tool use."
  },
  "qz-claude-038": {
    "q": "[Agents] Which beta header is required to use the MCP connector in the Messages API?",
    "options": [
      "anthropic-version: 2023-06-01",
      "anthropic-beta: mcp-client-2025-11-20",
      "x-mcp: true",
      "beta: mcp-latest"
    ],
    "explain": "**Correct answer: the beta header mcp-client-2025-11-20.** The version header is required too, but it is not the MCP beta."
  },
  "qz-claude-039": {
    "q": "[Agents] What does the MCP connector support today, and what are the limits?",
    "options": [
      "It supports the whole MCP spec, including resources/prompts",
      "It supports local STDIO servers directly",
      "It supports tool calls; the server must be public HTTP, not STDIO; only tool calls from the spec",
      "No beta header is needed"
    ],
    "explain": "**Correct answer: tool calls only, a public HTTP server, no STDIO.** Resources/prompts are not supported yet."
  },
  "qz-claude-040": {
    "q": "[Prompt] What should the system prompt be used for?",
    "options": [
      "It holds the entire conversation history",
      "It replaces the tool schema",
      "It stores the API key",
      "It defines the model's role, constraints, format and policies"
    ],
    "explain": "**Correct answer: the system prompt steers behavior and constraints.** History lives in the messages."
  },
  "qz-claude-041": {
    "q": "[Prompt] What TTL does the prompt cache have?",
    "options": [
      "5 minutes by default; 1 hour is possible with cache_control ttl 1h (a more expensive write)",
      "Only 1 minute",
      "Forever",
      "24 hours"
    ],
    "explain": "**Correct answer: 5 minutes by default; 1 hour with ttl 1h**, and the cache write costs more."
  },
  "qz-claude-042": {
    "q": "[Prompt] When is automatic caching (cache_control at the top level) appropriate?",
    "options": [
      "When you need precise control over each breakpoint",
      "When you want the system to manage cache breakpoints as the conversation grows",
      "When you do not want caching",
      "Only for the batch API"
    ],
    "explain": "**Correct answer: automatic caching manages the breakpoints for you** as the conversation grows; explicit caching gives fine-grained control."
  },
  "qz-claude-043": {
    "q": "[Prompt] When you pass a large document plus a question, which order helps both caching and attention?",
    "options": [
      "The question first, the document after",
      "Mix the document and the question",
      "The document (static) first, the question (dynamic) after",
      "Send only the question"
    ],
    "explain": "**Correct answer: static content first, dynamic last** so the prefix can be cached and the structure stays clear."
  },
  "qz-claude-044": {
    "q": "[Prompt] To reduce prompt injection from user content, which measures are appropriate?",
    "options": [
      "Trust every instruction inside user content",
      "Turn off the system prompt",
      "Use a high temperature",
      "Separate the system policy from the user content, validate/escape it, and use tool schemas and output constraints"
    ],
    "explain": "**Correct answer: separate policy from content, validate/sanitize.** Never trust instructions inside user content."
  },
  "qz-claude-045": {
    "q": "[Prompt] Where should few-shot examples go to be effective and cache-friendly?",
    "options": [
      "In the system/user prompt before the actual question, stable across requests",
      "After the user's question",
      "Inside a tool result",
      "Do not use examples"
    ],
    "explain": "**Correct answer: stable examples before the actual question**, which helps caching and consistency."
  },
  "qz-claude-046": {
    "q": "[Prompt] To get shorter answers, which approach works better than relying on max_tokens alone?",
    "options": [
      "Only lower max_tokens",
      "State the desired length and format clearly in the prompt",
      "Increase temperature",
      "Use a larger model"
    ],
    "explain": "**Correct answer: clear instructions about length/format in the prompt** work better than just truncating tokens."
  },
  "qz-claude-047": {
    "q": "[Tools] To have Claude call a function you defined, what must you provide?",
    "options": [
      "Only the function name",
      "Only the description",
      "name, description and an input_schema JSON Schema",
      "The function's API key"
    ],
    "explain": "**Correct answer: a tool needs name, description and input_schema.**"
  },
  "qz-claude-048": {
    "q": "[Tools] What does tool_choice: {type: none} do?",
    "options": [
      "Force a tool call",
      "Disable all tools",
      "Only allow server tools",
      "Prevent Claude from calling tools and make it produce text only"
    ],
    "explain": "**Correct answer: none prevents the model from calling a tool in that turn**, but the tools are still declared."
  },
  "qz-claude-049": {
    "q": "[Tools] What does strict tool use (strict: true) guarantee?",
    "options": [
      "The tool name and input are validated against the schema",
      "The model always calls the tool",
      "The tool runs faster",
      "No input_schema is needed"
    ],
    "explain": "**Correct answer: strict guarantees the tool name and input match the schema.**"
  },
  "qz-claude-050": {
    "q": "[Tools] What kind of tool is web search, and who executes it?",
    "options": [
      "A client tool; the application must call a search engine",
      "A server tool; Anthropic executes it and returns the results in the response",
      "A mandatory MCP tool",
      "A batch-only tool"
    ],
    "explain": "**Correct answer: web search is a server tool**, Anthropic executes it."
  },
  "qz-claude-051": {
    "q": "[Tools] What does the code execution tool allow?",
    "options": [
      "Run code on the client machine",
      "Compile Java on the user's server",
      "Claude runs code in Anthropic's sandbox",
      "Only run Python locally"
    ],
    "explain": "**Correct answer: code execution runs inside Anthropic's sandbox.**"
  },
  "qz-claude-052": {
    "q": "[Tools] To use the MCP connector in the Messages API, what must you declare besides mcp_servers?",
    "options": [
      "Nothing else, mcp_servers is enough",
      "A client tool named \"mcp\" that you write yourself",
      "A tool entry of type mcp_toolset in tools, pointing at the same server name (mcp_server_name), plus the beta header mcp-client-2025-11-20",
      "A system prompt that lists the server URLs"
    ],
    "explain": "**Correct: option 3.** The MCP connector needs **both parts**:\n1. {{mcp_servers}} (each entry has {{type: \"url\"}}, {{url}}, {{name}}): declares the remote MCP server (over HTTP).\n2. Inside {{tools}}, an entry with {{type: \"mcp_toolset\"}} whose {{mcp_server_name}} matches the {{name}} above: it lets Claude use that server's tools. The toolset can enable or disable individual tools.\n\nInclude the beta header {{mcp-client-2025-11-20}}.\n\n### Why the other options are wrong\n- **mcp_servers only:** rejected with a validation error.\n- **Write your own \"mcp\" client tool:** that is a hand-rolled integration, not the MCP connector. With the connector, Anthropic calls the MCP server for you.\n- **Put the URL in the prompt:** the model does not connect to URLs that appear in the prompt."
  },
  "qz-claude-053": {
    "q": "[Security] Where should the Anthropic API key be stored in a web application?",
    "options": [
      "On the server/backend, with the frontend calling through the backend",
      "In frontend JS so it can be called directly",
      "In localStorage",
      "In a URL query parameter"
    ],
    "explain": "**Correct answer: never put the API key in the client.** Call it through the backend for security."
  },
  "qz-claude-054": {
    "q": "[Security] When Claude has tools that reach sensitive data, which risk is the biggest?",
    "options": [
      "The model deletes the database by itself",
      "Prompt injection makes the model call a tool with malicious parameters",
      "The API key expires",
      "Rate limiting"
    ],
    "explain": "**Correct answer: prompt injection can make the model call a tool for the wrong purpose.** You need guardrails and validation."
  },
  "qz-claude-055": {
    "q": "[Security] What should you do before sending user data to the API?",
    "options": [
      "Send all PII as-is because the API is perfectly safe",
      "Encode it with base64",
      "Consider minimizing/redacting PII and comply with policy and legal requirements",
      "Compress it with gzip"
    ],
    "explain": "**Correct answer: minimize PII and comply with policy.** Base64/gzip are not security measures."
  },
  "qz-claude-056": {
    "q": "[Security] When the model refuses for safety reasons, what should the application do?",
    "options": [
      "Retry repeatedly with the same prompt",
      "Increase the temperature",
      "Bypass the policy",
      "Explain the limitation, adjust the request to a legitimate one, or fall back safely"
    ],
    "explain": "**Correct answer: never force the model to violate its policy; adjust the request or fall back safely.**"
  },
  "qz-claude-057": {
    "q": "[Security] Even when using structured output, what should the server still do?",
    "options": [
      "Validate/sanitize the output before using it, especially for code/SQL",
      "Trust the output completely",
      "Skip logging",
      "Turn off the schema"
    ],
    "explain": "**Correct answer: the output still needs validation/sanitization** because the schema does not guarantee semantic safety."
  },
  "qz-claude-058": {
    "q": "[Claude Code] In Claude Code, what is the CLAUDE.md file for?",
    "options": [
      "Storing the API key",
      "Providing project guidance/context for the agent",
      "Defining a mandatory database schema",
      "Replacing git"
    ],
    "explain": "**Correct answer: CLAUDE.md provides project context/guidance** for Claude Code."
  },
  "qz-claude-059": {
    "q": "[Claude Code] Claude Code executes shell/file commands. What is the best practice for permissions?",
    "options": [
      "Allow every command automatically",
      "Disable the sandbox",
      "Review/approve dangerous actions, restrict permissions and keep an audit trail",
      "Share sessions publicly"
    ],
    "explain": "**Correct answer: restrict permissions, review dangerous actions and keep an audit trail.**"
  },
  "qz-claude-060": {
    "q": "[Eval] To evaluate the quality of an LLM application, which approach is appropriate?",
    "options": [
      "Just read a few answers",
      "Increase the temperature for variety",
      "Delete the logs",
      "An eval suite with test cases, expected behavior, automatic scoring/model graders, and regression tracking"
    ],
    "explain": "**Correct answer: evals with test cases and regression tracking** measure quality objectively."
  },
  "qz-claude-061": {
    "q": "[Applications] The backend streams a response that contains tool_use. The code runs a JSON parser on every content_block_delta event of type input_json_delta and keeps hitting JsonParseException. What is the correct fix?",
    "options": [
      "Concatenate the partial_json fragments of that block into one string and only parse when the block's content_block_stop arrives",
      "Turn off streaming because tool use does not support streaming",
      "Parse each fragment with a lenient parser and skip the ones that fail",
      "Read the full tool input from the message_start event"
    ],
    "explain": "**Correct: concatenate first, then parse.** When streaming, the tool input does not arrive in one piece but as a series of {{input_json_delta}} fragments, each one a **partial JSON string** in the {{partial_json}} field. A single fragment is almost never valid JSON on its own. The right approach: collect the fragments by block {{index}}, and once {{content_block_stop}} arrives the string is complete, so parse it then.\n\n### Why the other options are wrong\n- **Turn off streaming:** tool use works fine with streaming; turning it off only loses progressive display and may hit timeouts on long output.\n- **Lenient parser that skips bad fragments:** you lose data or parse into a wrong object that nobody notices.\n- **message_start:** this event only carries message-level information (id, model, initial usage); no block content yet.\n\n> The official SDKs have helpers that assemble the stream into the final message; if you read the SSE yourself, you have to do this concatenation yourself."
  },
  "qz-claude-062": {
    "q": "[Applications] While streaming an answer to the user, the backend receives an error event (overloaded_error) mid-way, after about half a paragraph has already been pushed to the browser. The initial HTTP status was 200. Which handling is correct?",
    "options": [
      "Save the text received so far as the complete answer because the HTTP status was 200",
      "Mark the answer as incomplete (do not store it as a final version), notify the client, then retry with backoff because overloaded is a transient error",
      "Ignore the error event because it is like a ping event",
      "Retry immediately in a tight loop until the stream runs to completion"
    ],
    "explain": "**Correct: treat it as incomplete, notify the client, retry with backoff.** With streaming, the 200 status is sent **before** the content finishes generating. A failure that happens later (for example {{overloaded_error}}) is delivered as an {{error}} event inside the SSE stream itself. The text received so far is **incomplete**: there is no {{message_delta}} with a stop_reason and no final usage.\n\n### Why the other options are wrong\n- **Save it as complete because of the 200:** the 200 only says the connection opened successfully; the user would see a truncated answer sitting in history as if it were real.\n- **Treat it as a ping:** ping is a keep-alive heartbeat; an error event carries a real error you must handle.\n- **Retry immediately in a tight loop:** overload is temporary; hammering it right away makes things worse. Use backoff with jitter and a retry cap."
  },
  "qz-claude-063": {
    "q": "[Applications] Code reads the answer via {{response.content[0].text}} and occasionally gets an empty string or null. The bad response looks like this:\n~~~json\n{\n  \"stop_reason\": \"end_turn\",\n  \"content\": [\n    { \"type\": \"thinking\", \"thinking\": \"\", \"signature\": \"...\" },\n    { \"type\": \"text\", \"text\": \"Order ORD-100200 was delivered on 20/10.\" }\n  ]\n}\n~~~\nWhat is the correct fix?",
    "options": [
      "Send thinking type disabled so the first block is always text",
      "Always read content[content.length - 1].text because text is always the last block",
      "Iterate over the content array and only take blocks whose type is text (handle thinking and tool_use separately)",
      "Retry the request because an empty content[0] is a server-side error"
    ],
    "explain": "**Correct: iterate over content by type.** {{content}} is an **array of blocks** of different types: {{thinking}}, {{text}}, {{tool_use}}… On current models thinking is adaptive and the thinking block usually comes first, and its content can be empty (the default display mode is omitted). So the first block is not necessarily text.\n\n### Why the other options are wrong\n- **thinking disabled:** on Opus 5.5 thinking is always on; sending disabled returns a 400 error. Even on a model that allows turning it off, this fixes the wrong thing: the code still breaks when it meets tool_use.\n- **Take the last block:** the response can end with tool_use, or contain multiple text blocks. Any assumption about position is equally fragile.\n- **Retry:** this is a valid response (end_turn), not a server error; retrying just costs money."
  }
});
