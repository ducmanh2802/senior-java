/*
 * English translation of js/data/quiz-claude.js — task T417. Format: js/core/i18n.js (content overlay).
 * ids: qz-claude-150 qz-claude-151 qz-claude-152 qz-claude-153 qz-claude-154 qz-claude-155 qz-claude-156 qz-claude-157 qz-claude-158 qz-claude-159 qz-claude-160 qz-claude-161 qz-claude-162 qz-claude-163 qz-claude-164 qz-claude-165 qz-claude-166 qz-claude-167 qz-claude-168 qz-claude-169 qz-claude-170 qz-claude-171 qz-claude-172 qz-claude-173 qz-claude-174 qz-claude-175 qz-claude-176 qz-claude-177 qz-claude-178
 */
App.i18n.content({
  "qz-claude-150": {
    q: `[Applications] Code that handles web_search_tool_result always iterates over content as an array of results. One day the service crashes because content is an object containing error_code: "max_uses_exceeded". What is the right lesson?`,
    options: [
      `Server tool errors are always returned with HTTP 4xx; this is an API bug`,
      `A web search error comes back with HTTP 200 right inside the result block: on success content is a list, on error content is an object with an error_code; branch before iterating`,
      `max_uses_exceeded means the account quota is exhausted; you have to upgrade the tier`,
      `You must enable streaming to receive server tool errors`
    ],
    explain: `**Correct: server tool errors do not throw an exception.** Web search and web fetch run on Anthropic infrastructure; when they fail, the response is still HTTP 200, and the {{web_search_tool_result}} block has {{content}} set to **an error object** (for example {{error_code: "max_uses_exceeded"}}) instead of a list of {{web_search_result}}. Your code must check the type of content before iterating.

{{max_uses_exceeded}} means Claude has used up the number of searches you allowed via {{max_uses}} in this request.

### Why the other options are wrong
- **Always 4xx:** wrong; this behaviour is spelled out in the docs.
- **Account quota exhausted:** account quotas produce 429; max_uses is a limit you set on the tool yourself.
- **Streaming required:** the error appears in content whether or not you stream.`
  },
  "qz-claude-151": {
    q: `[Applications] A customer requires that inference runs in the US. You use the Claude API with Opus 5.5. What is the correct way to configure and verify it?`,
    options: [
      `Set the header x-anthropic-region: us`,
      `Put inference_geo in the request extra_body or metadata`,
      `Pass inference_geo: "us" as a top-level parameter of the Messages request; the usage.inference_geo field in the response tells you where inference actually ran`,
      `Pick a model id with a -us suffix`
    ],
    explain: `**Correct: inference_geo is a top-level parameter.** {{inference_geo}} is a direct parameter of the Messages request (Python: {{inference_geo="us"}}, Java: {{.inferenceGeo("us")}}), supported from Opus 4.6/Sonnet 4.6 onward. The response has {{usage.inference_geo}} so you can log it and prove where inference ran. (On Managed Agents it is different: it lives inside the agent's model object.)

### Why the other options are wrong
- **Header x-anthropic-region:** there is no such header.
- **extra_body/metadata:** the docs stress not to put it in extra_body; it is a first-class parameter.
- **-us suffix:** model ids have no region variants; use the exact id from the table (for example {{claude-opus-5-5}}).`
  },
  "qz-claude-152": {
    q: `[Applications] A RAG route is getting 429s because it exceeds input tokens per minute (ITPM), even though 80% of the input is a document prefix repeated across requests. Which change both cuts cost and raises effective throughput?`,
    options: [
      `Raise max_tokens to reduce the number of requests`,
      `Split the prefix into several smaller requests`,
      `Switch to streaming`,
      `Enable prompt caching for the prefix: on the Claude API, tokens read from cache do not count toward ITPM for most models, so it is both cheaper and uses less of the quota`
    ],
    explain: `**Correct: prompt caching.** On the Claude API, {{cache_read_input_tokens}} **do not count toward the input tokens per minute limit** for most models (the docs name Haiku 3.5 as the exception). With an 80% repeated prefix, enabling the cache helps in two ways: the read price is only about 0.1x input (even lower on Opus 5.5 and Fable 5.1), and most of the input no longer counts toward ITPM, so effective throughput goes up without buying a higher tier.

### Why the other options are wrong
- **Raise max_tokens:** that is the output ceiling; it does not reduce input, and every request still ships the full prefix.
- **Split the prefix:** total input is unchanged, and you lose context.
- **Streaming:** changes how you receive output, not how many input tokens are billed.`
  },
  "qz-claude-153": {
    q: `[Applications] Which statements about what counts toward the Opus 5.5 context window are correct? (Choose 2)`,
    options: [
      `Tool definitions and the system prompt count toward the context window too`,
      `Tokens read from the prompt cache still occupy the context window; caching changes only the price, not whether they count`,
      `Thinking blocks from earlier turns are always dropped from the context automatically by the API on Opus 5.5`,
      `Output from the current turn does not count toward the context window; only input does`,
      `Images do not count toward the context window because they are processed separately`
    ],
    explain: `**Correct: tools/system count, and cached tokens still take up room.** Everything in the request counts toward the context window: the system prompt, every message (including tool_result, images, documents), **the tool definitions**, plus the current turn's output (including thinking). With caching, input is split into {{input_tokens}}, {{cache_read_input_tokens}} and {{cache_creation_input_tokens}}, and **all three** count toward the window. Caching changes the price, not the capacity.

### Why the other options are wrong
- **Old thinking always dropped:** on Opus 4.5 and later (including Opus 5.5), Sonnet 4.6+, Haiku 5.5, the API **keeps** thinking blocks from previous turns by default, and they count as input. Only older models drop them automatically.
- **Output does not count:** the context window includes the output being generated.
- **Images do not count:** images and PDFs both consume tokens (with an extra limit of 600 images/PDF pages per request).`
  },
  "qz-claude-154": {
    q: `[Model Selection] You move a RAG route (about 150K input tokens per request) to Haiku 5.5 because of the $0.10/$0.50 per MTok price table. The actual bill is several times the estimate. Why?`,
    options: [
      `The $0.10/$0.50 rate applies only to prompts up to 100K tokens; prompts over 100K tokens are charged at $0.50/$2.50 per MTok`,
      `Haiku 5.5 only has a 200K context, so requests are split into two calls`,
      `Haiku 5.5 charges twice the normal output rate for thinking`,
      `Every model charges double once the prompt exceeds 200K tokens`
    ],
    explain: `**Correct: Haiku 5.5 has its own long-context pricing.** Haiku 5.5's $0.10 input / $0.50 output per MTok applies to prompts **up to 100K tokens**; above that the price is $0.50 / $2.50, i.e. five times higher. A route at 150K tokens per request lands squarely in the higher band. This is the exception: for the other 1M models (Opus 5.5, Sonnet 5.5, Fable 5.1), long context is billed at the standard price and needs no beta header.

Lesson: estimate from the real prompt-size distribution; with Haiku, keep prompts under 100K (retrieval filtering, caching, summarisation) or compare against Sonnet 5.5 by cost per completed task.

### Why the other options are wrong
- **200K context:** Haiku 5.5 has a 1M context (it is Haiku 4.5 that has 200K).
- **Double thinking:** thinking is billed like ordinary output tokens.
- **Every model doubles past 200K:** not true for current models; only Haiku 5.5 has a 100K threshold.`
  },
  "qz-claude-155": {
    q: `[Model Selection] An interactive coding-assistant feature on Opus 5.5 needs faster output generation, and the company is willing to pay more. What is the right option?`,
    options: [
      `Sign up for Priority Tier for the Opus 5.5 route`,
      `Use fast mode: the beta endpoint, beta fast-mode-2026-02-01 and the top-level parameter speed: "fast"; output speed up to about 2.5x, price $8/$40 per MTok, available only on the Claude API and not usable with Batch`,
      `Set effort to max so the model answers faster and more decisively`,
      `Add the header x-priority: high to the request`
    ],
    explain: `**Correct: fast mode.** Fast mode (research preview) runs **the same model** at up to about 2.5x the output-token speed, at a higher price (Opus 5.5: $8/$40 per MTok, twice the standard price). Each request needs all three: call through {{client.beta.messages}}, beta {{fast-mode-2026-02-01}}, and {{speed: "fast"}} at the top level. It is available only on the Claude API (not on Bedrock/Google Cloud/Foundry), cannot be used with Batch, and has its own rate limit. On a 429 you can drop {{speed}} to fall back to the standard speed (changing speed invalidates the prompt cache).

### Why the other options are wrong
- **Priority Tier:** Opus 5.5 is not supported on Priority Tier; the request fails validation.
- **effort max:** higher effort makes the model think more, i.e. **slower**.
- **x-priority:** there is no such header.`
  },
  "qz-claude-156": {
    q: `[Model Selection] A simple chat route on Sonnet 5.5 wants thinking turned off to reduce latency. The code sends thinking: {type: "disabled"} and gets a 400. What is the correct approach?`,
    options: [
      `Send thinking with budget_tokens: 0`,
      `It cannot be turned off; the only option is to switch to Haiku 5.5`,
      `Try lowering effort to low first; if the route really must have no thinking, send thinking: {type: "between_tools"} (with no other fields, only at effort high or below)`,
      `Send thinking disabled together with effort xhigh`
    ],
    explain: `**Correct: lower effort, or use between_tools.** On Sonnet 5.5, {{disabled}} thinking returns 400. The docs recommend trying {{effort: "low"}} first (ordinary chat works well at low). If the route really must turn thinking off, send thinking type {{between_tools}}: it is accepted only at effort {{high}} or below, must not be combined with {{display}}, {{budget_tokens}} or any other field, and you cannot change effort mid-conversation.

### Why the other options are wrong
- **budget_tokens 0:** budget_tokens has been removed on Sonnet 5.5 (400).
- **Cannot be turned off:** between_tools is a way; switching to Haiku is a different quality decision, not a requirement.
- **disabled + xhigh:** disabled already returns 400; between_tools also returns 400 at xhigh/max.`
  },
  "qz-claude-157": {
    q: `[Model Selection] A team moves a route from Sonnet 4.6 to Fable 5.1 and estimates cost by multiplying token counts measured on Sonnet 4.6 by the Fable price. What is the biggest risk in this estimate?`,
    options: [
      `Fable 5.1 does not charge for input tokens`,
      `Fable 5.1 does not support count_tokens`,
      `Fable 5.1 bills by character count instead of tokens`,
      `Fable 5.1 uses a different tokenizer (the tokenizer introduced with Opus 4.7), so the same text can produce about 1x-1.35x the tokens; you need to re-measure with count_tokens on the new model`
    ],
    explain: `**Correct: a different tokenizer means a different token count.** Fable 5.1 uses the same tokenizer as Opus 4.8 (the tokenizer introduced with Opus 4.7). When moving from Opus 4.6, Sonnet, Haiku or older, the docs recommend re-measuring with {{count_tokens}}, because the new tokenizer uses about 1x-1.35x the tokens for the same text. An estimate based on Sonnet 4.6 tokens can come out more than 30% low, on top of the price gap ($10/$50 versus $3/$15).

### Why the other options are wrong
- **No input charge:** Fable 5.1 charges $10/MTok input.
- **count_tokens unsupported:** count_tokens works on current models; it is exactly the tool you should use.
- **Character billing:** every Claude model bills by tokens.`
  },
  "qz-claude-158": {
    q: `[Model Selection] A bank with a zero data retention (ZDR) agreement with Anthropic wants to try Fable 5.1. Every request returns 400 invalid_request_error. What is the correct explanation?`,
    options: [
      `Fable 5.1 requires 30-day data retention; ZDR organizations are rejected unless Anthropic explicitly allows it, so you must ask for permission or use a model without this requirement`,
      `Fable 5.1 is only available to Project Glasswing members`,
      `The bank must send an extra header zdr: true`,
      `Fable 5.1 only runs through the Batch API`
    ],
    explain: `**Correct: Fable 5.1 requires 30-day data retention.** The docs state that Fable 5.1 is not available under zero data retention unless Anthropic explicitly allows it; requests from organizations whose retention configuration does not meet the requirement receive {{400 invalid_request_error}}. This is a constraint to check **before** choosing a model for a customer with compliance requirements.

### Why the other options are wrong
- **Project Glasswing:** that is a condition of Claude Mythos 5.1, not Fable 5.1 (which is generally available).
- **Header zdr:** there is no such header; retention is configured at the organization level.
- **Batch only:** Fable 5.1 works on the regular Messages API.`
  },
  "qz-claude-159": {
    q: `[Model Selection] An enterprise has bought Priority Tier and wants to apply it to a new route running Opus 5.5. The request fails validation. What is the correct explanation?`,
    options: [
      `Priority Tier only applies to Haiku models`,
      `Priority Tier does not support Opus 5.5 (nor Sonnet 5.5, Fable 5.1...); a route that needs Priority Tier must run a supported model such as Fable 5 or Opus 4.8, or drop Priority Tier`,
      `Fast mode must be enabled together with Priority Tier`,
      `Priority Tier requires an older anthropic-version`
    ],
    explain: `**Correct: Opus 5.5 is outside Priority Tier.** The docs list Priority Tier as supporting Fable 5, Opus 4.8 and older current models, but **exclude** Opus 5.5, Opus 5, Sonnet 5, Sonnet 5.5, Fable 5.1, Mythos 5.1, Mythos 5 and Mythos Preview; a Priority Tier request with these models fails validation. When choosing a model for a route that needs a service commitment, check the supported list instead of assuming "the newest model".

### Why the other options are wrong
- **Haiku only:** wrong; Fable 5 and Opus 4.8 are supported too.
- **Enable fast mode too:** fast mode cannot even be used with Priority Tier.
- **Older anthropic-version:** unrelated to the API version.`
  },
  "qz-claude-160": {
    q: `[Model Selection] A main agent runs Opus 5.5 with a cached 80K-token prefix. To save money, the developer switches the model to Haiku 5.5 in the middle of the loop for the "easy" steps and then switches back to Opus. Input cost goes up instead of down. What is a better design?`,
    options: [
      `Keep cache_control when switching models and the cache is still shared`,
      `Use a 1h TTL so the cache survives the model switch`,
      `The cache is tied to each model, so every switch rewrites it from scratch; keep the main loop on one model and hand easy work to a subagent running a cheap model with its own small context`,
      `Move the whole agent to Haiku 5.5`
    ],
    explain: `**Correct: the cache is per model, so use a subagent.** The prompt cache is partitioned by model; changing the model leaves no way to keep the cache (there is no "escape hatch" such as a system message mid-conversation). Every Opus → Haiku → Opus switch forces both sides to rewrite the 80K-token prefix (at 1.25x), which costs more than the saving. The recommended pattern: keep the main loop on one model and hand cheap side work to a **subagent** running a small model with a compact context, returning only the result.

### Why the other options are wrong
- **Keep cache_control:** the marker does not make the cache shared across models.
- **1h TTL:** TTL does not help, because one model's entry is not used by another model.
- **Move everything to Haiku:** this may reduce quality on hard steps; measure it with evals - it is not the fix for this design bug.`
  },
  "qz-claude-161": {
    q: `[Model Selection] A service with dynamic configuration wants to know each model's context window and maximum output instead of hard-coding them. What is the correct approach?`,
    options: [
      `Read the context_window field from GET /v1/models/{id}`,
      `Send a probe request with a very large max_tokens and catch the error to infer the limit`,
      `Parse the Anthropic pricing page`,
      `Call the Models API (GET /v1/models/{id}): the max_input_tokens field is the context window and max_tokens is the maximum output, together with capabilities; there is no context_window field`
    ],
    explain: `**Correct: the Models API with max_input_tokens/max_tokens.** The Models API ({{client.models.list()}}, {{client.models.retrieve(id)}}, no beta needed) returns {{id}}, {{display_name}}, {{created_at}} and (since 3/2026) {{max_input_tokens}} (context window), {{max_tokens}} (output ceiling) plus {{capabilities}}. Use it to look up real capabilities instead of hard-coding a table.

### Why the other options are wrong
- **context_window:** the docs state clearly that this field does not exist; code reading it gets null.
- **Probe and catch:** costs money, is slow, and on 4.5+ models an over-window request is accepted and then stopped with {{model_context_window_exceeded}}, so you cannot infer the limit.
- **Parse the pricing page:** brittle, and not an API.`
  },
  "qz-claude-162": {
    q: `[Model Selection] A legacy system uses Haiku 4.5 to read 300-page PDFs and always errors out. Which statement explains it correctly and suggests a sensible fix?`,
    options: [
      `A model with a 200K context (like Haiku 4.5) accepts at most 100 PDF pages/images per request; Haiku 5.5 (1M context) accepts up to 600 pages, but the request still has to stay within the 32 MB limit`,
      `Haiku models cannot read PDFs`,
      `The limit is 50 PDF pages for every model`,
      `You must convert the PDF to images before sending it`
    ],
    explain: `**Correct: the page limit depends on the context window.** A request accepts at most **600** images or PDF pages on a 1M model, and **100** on a 200K-context model. Haiku 4.5 (200K context, $1/$5) hits the 100-page limit. Upgrading to Haiku 5.5 (1M context, much cheaper) solves it, but the request must still stay under 32 MB; heavily scanned PDFs can hit the size limit before the page limit.

### Why the other options are wrong
- **Haiku cannot read PDFs:** it can.
- **50 pages for every model:** wrong number; it is 100 or 600 depending on the model.
- **Convert to images:** images share the same 100/600 limit; converting does not help and loses the text layer.`
  },
  "qz-claude-163": {
    q: `[Model Selection] You use the advisor tool: the executor is Sonnet 5.5 and, to save money, you configure Haiku 5.5 as the advisor. The request returns 400. Why?`,
    options: [
      `The advisor tool only runs with Fable 5.1`,
      `The advisor model must be at least as strong as the executor model (e.g. executor Sonnet 5.5 means advisor Opus 5.5); an invalid pair returns 400`,
      `The advisor must be the same model as the executor`,
      `The advisor tool needs tool_choice any to run`
    ],
    explain: `**Correct: the advisor must be at least as strong as the executor.** The idea of the advisor tool is that the executor model (doing the work) asks a **stronger or equally strong** model for advice. A pair like executor {{claude-sonnet-5-5}} → advisor {{claude-opus-5-5}} is valid; a weaker advisor (Haiku) returns 400. In particular, executor Sonnet 5.5 accepts only the advisors in its pairing table (it does not accept Opus 4.8/4.7/4.6, Sonnet 5, Sonnet 4.6).

### Why the other options are wrong
- **Fable 5.1 only:** the advisor tool works with many model pairs.
- **Same model:** not required; the purpose is to get a stronger model's opinion.
- **tool_choice any:** forced tool_choice returns 400 on Sonnet 5.5 anyway; unrelated.`
  },
  "qz-claude-164": {
    q: `[Model Selection] You move routes from Sonnet 5 to Sonnet 5.5. Which actions match the current guidance? (Choose 2)`,
    options: [
      `Rerun the effort sweep because the effort levels have been recalibrated; the suggested starting point is medium for coding agents/multi-step tools and low for chat`,
      `Keep the same effort as Sonnet 5 because a level with the same name behaves identically`,
      `Replace tool_choice {"type": "tool"} with auto + instructions in the prompt, strict: true or structured outputs, because forced tool use returns 400 on Sonnet 5.5`,
      `Add budget_tokens to keep thinking cost the same as before`,
      `Add temperature: 0 to compare the two models' outputs deterministically`
    ],
    explain: `**Correct: rerun the effort sweep, and drop forced tool use.**
- Sonnet 5.5 still defaults to effort {{high}}, but the levels have been **recalibrated** compared with Sonnet 5; the docs suggest starting at {{medium}} for agentic coding/multi-step tools and {{low}} for chat, then measuring.
- {{tool_choice}} {{any}}/{{tool}} returns 400 on Sonnet 5.5 (as on Opus 5.5, Fable 5.1). Replace it with {{auto}} + explicit instructions in the prompt, {{strict: true}} to keep schema guarantees, or structured outputs if you only need JSON.

### Why the other options are wrong
- **Keep the same effort:** same level names but different calibration; keeping them is a common source of "the new model is slower/more expensive".
- **budget_tokens:** removed on Sonnet 5.5 (400); use effort.
- **temperature 0:** sampling params return 400 on this model (and on every model with API version 2026-10-21).`
  },
  "qz-claude-165": {
    q: `[Model Selection] You bring Fable 5.1 into a long-running analysis agent. What should you prepare? (Choose 2)`,
    options: [
      `A single request on a hard task can run for many minutes: use streaming, long timeouts and a UI that reports progress`,
      `Prompts written for older models are often too prescriptive and can reduce quality; review and tighten them`,
      `Send thinking {type: "disabled"} so the task runs faster`,
      `Enable Priority Tier to reduce latency`,
      `Set a small budget_tokens to cap thinking time`
    ],
    explain: `**Correct: prepare for long turns, and review your prompts.** Per the Fable 5.1 migration guidance:
- A single request on a hard task can run for **many minutes**: you need streaming (to avoid HTTP timeouts), an appropriate timeout and progress feedback in the UI.
- Prompts written for earlier models are often **too prescriptive** and reduce output quality; tighten them. An effort sweep should also cover low/medium for everyday work.

### Why the other options are wrong
- **thinking disabled:** on Fable 5.1 thinking is always on; sending disabled returns 400. Control it with effort.
- **Priority Tier:** Fable 5.1 has no Priority Tier.
- **budget_tokens:** removed on Fable 5.1 (400).`
  },
  "qz-claude-166": {
    q: `[Agents] An agent uses the SDK Tool Runner (client.beta.messages.tool_runner). The team plans to rewrite everything as a manual loop just so the send_payment tool waits for human approval. Which assessment is correct?`,
    options: [
      `Correct, the Tool Runner runs every tool automatically, so an approval step cannot be inserted`,
      `Set tool_choice none for send_payment only`,
      `No rewrite needed: with the Tool Runner you can gate inside the tool function (return a "user declined" result instead of executing) or inspect the tool call in the yielded message and allow/deny it before the tool runs`,
      `Move to Managed Agents because only it has an approval mechanism`
    ],
    explain: `**Correct: the Tool Runner supports approval gates.** The docs stress that the Tool Runner is "not a black box": on every turn it yields the assistant message **before** running tools. You can:
- gate inside the tool's run function: ask the approver, and if they decline return a "user declined" result instead of executing;
- or inspect the tool call in the yielded message and override the next request ({{set_messages_params()}}/{{setMessagesParams()}}) to allow or deny it before the tool runs.

A manual loop is only worth it when you need something the runner does not provide (custom transport, control flow that does not match the per-turn hook...).

### Why the other options are wrong
- **Cannot insert one:** wrong, see above.
- **tool_choice none for one tool:** tool_choice applies to the whole request, not per tool; none forbids every tool.
- **Only Managed Agents has approval:** Managed Agents has permission policies, but both the Tool Runner and a manual loop can do it.`
  },
  "qz-claude-167": {
    q: `[Agents] According to the four "should you build an agent?" criteria (complexity, value, model viability, cost of error), which cases should stay at a single call or a fixed workflow instead of an agent? (Choose 2)`,
    options: [
      `Extracting the title and signing date from a contract PDF`,
      `Turning a design doc into a complete pull request in a large repo, with automated tests as a check`,
      `A multi-step task where errors are hard to detect and cannot be rolled back, e.g. bulk money transfers with no approval step`,
      `Investigating a production incident across many systems when you do not know in advance which logs to look at`
    ],
    explain: `**Correct: simple extraction, and tasks whose error cost is irreversible.** Before moving up to the agent layer, check all four criteria; a single "no" is enough to stay at a simpler layer:
- **Complexity:** is the task multi-step and hard to specify up front? Extracting a title from a PDF is not: one call is enough.
- **Value:** is the outcome worth the higher cost and latency?
- **Viability:** is Claude good at this kind of work?
- **Cost of error:** can errors be caught and recovered (tests, review, rollback)? Unapproved, non-rollbackable money transfers cannot.

### Why the other options are wrong
- **Design doc to PR:** exactly the open-ended, multi-step kind of task, and tests help catch mistakes: a good fit for an agent.
- **Cross-system incident investigation:** the path is unknown ahead of time and the model must explore for itself: a good fit for an agent (with read-only permissions).`
  },
  "qz-claude-168": {
    q: `[Agents] An internal agent has only one tool, bash; Claude sends email with a curl command to the mail API. Security requires every outgoing email to be human-approved. Which design is most sensible?`,
    options: [
      `Write a regex over the bash command string to detect curl calls to the mail API`,
      `Add "do not send email without asking" to the system prompt`,
      `Blocking all outbound network access for bash is enough; nothing else is needed`,
      `Split the action into a dedicated send_email tool with typed parameters; the harness can then easily block, display and audit this call, whereas bash only exposes an opaque command string`
    ],
    explain: `**Correct: promote the action to a dedicated tool.** Bash gives Claude broad leverage, but the harness only sees one command string with the same shape for every action. A dedicated tool gives the harness a dedicated hook with typed parameters to **block, render, audit** or run in parallel. The docs use exactly this example: {{send_email}} is easy to gate, while {{bash -c "curl -X POST ..."}} is not. Rule of thumb: start with bash for coverage, promote to a dedicated tool when you need gating, display, auditing or parallelisation; a common criterion is whether the action is reversible.

### Why the other options are wrong
- **Regex over commands:** easy to bypass (environment variables, wrapper scripts, string encoding).
- **Prompt instruction only:** not an enforcement mechanism; an injection or a model mistake can still send email.
- **Block all network:** the agent also loses the ability to send legitimate email, which fails the "can send, but only with approval" requirement.`
  },
  "qz-claude-169": {
    q: `[Agents] An agent needs to fetch 200 orders, call get_shipment for each one and report only the delayed orders. Every intermediate result goes into context, costing tokens and slowing things down. Which feature fits best?`,
    options: [
      `Programmatic tool calling: Claude writes a script that runs in the code execution container, calls tools like functions and filters results in code; only the final output comes back into context`,
      `Raise max_tokens to hold all 200 results`,
      `Enable disable_parallel_tool_use to reduce load`,
      `Switch to the Message Batches API`
    ],
    explain: `**Correct: programmatic tool calling.** With ordinary tool use, each call is a round: the result enters the context, Claude reasons, then calls again. Two hundred such rounds accumulate latency and tokens, while most of the intermediate data is no longer needed. Programmatic tool calling lets Claude write a script that runs in the code execution container; when the script calls a tool, the container pauses, the tool runs, and the result goes **to the code**, not into the context. The script loops, filters and branches; only the final output (the list of delayed orders) returns to Claude. Configuration: add the code execution tool and set {{allowed_callers}} on your tool.

### Why the other options are wrong
- **Raise max_tokens:** that is the output ceiling; it does not reduce input tokens from 200 results.
- **disable_parallel_tool_use:** makes things slower (one tool per turn).
- **Batch API:** for many independent requests, not a replacement for a tool loop within one task.`
  },
  "qz-claude-170": {
    q: `[Agents] A coding assistant needs to remember project conventions and work progress across sessions (the process restarts between sessions). Which mechanism fits this purpose best?`,
    options: [
      `Context editing with clear_tool_uses`,
      `The memory tool: Claude reads/writes files in the /memories directory, storage is implemented by you, so it survives across sessions`,
      `Server-side compaction`,
      `Prompt caching with a 1-hour TTL`
    ],
    explain: `**Correct: the memory tool for persistence across sessions.** The three context-management mechanisms have different purposes:
| Mechanism | Scope | What it does |
|---|---|---|
| Context editing | within one session | removes old tool results/thinking |
| Compaction | within one session | summarises the beginning when it nears capacity |
| Memory tool | **across sessions** | Claude reads/writes files under {{/memories}} ({{view}}, {{create}}, {{str_replace}}...) |

The memory tool is client-side: you decide where to store it (file, DB, object storage), so the data survives a restart.

### Why the other options are wrong
- **Context editing:** only trims the current transcript.
- **Compaction:** summarises within the same conversation and is lost when a new session starts.
- **1h prompt cache:** only cuts the price of a repeated prefix; it is not a place to store state, and it expires after 1 hour.`
  },
  "qz-claude-171": {
    q: `[Agents] You need to generate legal reports and want to be able to log, evaluate and branch at each intermediate step. Which structure do the docs suggest?`,
    options: [
      `A single request with effort max`,
      `Let the model call subagents on its own judgment`,
      `Self-correcting prompt chaining: call 1 produces a draft, call 2 reviews it against criteria, call 3 fixes it based on the review; each step is its own API call`,
      `10 few-shot examples of complete reports in one prompt`
    ],
    explain: `**Correct: self-correcting prompt chaining.** With adaptive thinking and subagent orchestration, Claude handles most multi-step reasoning internally. But explicit chaining (splitting a task into several sequential API calls) is still useful when you need to **see intermediate output** or **enforce a fixed pipeline**. The most common pattern is self-correction: draft → review against criteria → fix. Because each step is a separate call, you can log, score or branch at any point.

### Why the other options are wrong
- **One request at effort max:** may give good quality but no intermediate control point.
- **Let the model call subagents:** the model decides the flow, so it is hard to guarantee the right pipeline and hard to audit each step.
- **10 few-shot examples:** helps with format but creates no intermediate steps; the docs suggest 3-5 diverse examples.`
  },
  "qz-claude-172": {
    q: `[Agents] A coding agent sometimes force-pushes or deletes branches when it hits a conflict. You want it to keep fixing files and running tests on its own, but to ask before hard-to-reverse actions. Which prompt approach fits best?`,
    options: [
      `Write "NEVER use git" in the system prompt`,
      `Lower effort to low so the agent is less proactive`,
      `Remove the bash tool from the agent`,
      `Teach it to weigh reversibility: do local, reversible actions on its own; ask before destructive, hard-to-reverse or shared-system actions (force-push, reset --hard, deleting branches), and never use a destructive action as a shortcut`
    ],
    explain: `**Correct: teach the model to classify by reversibility.** The docs suggest a prompt like: local, reversible actions (editing files, running tests) are encouraged; for hard-to-reverse, shared-system or destructive actions, ask the user first. Examples that need confirmation: deleting files/branches, dropping tables, {{rm -rf}}, {{git push --force}}, {{git reset --hard}}, pushing code, commenting on PRs, sending messages. Add: when hitting an obstacle, do not use a destructive action as a shortcut (for example skipping hooks with {{--no-verify}}, deleting an unfamiliar file that may be work in progress).

> The prompt is a guidance layer; for genuinely dangerous actions you should still have an enforcement layer in the harness (permission rules, hooks).

### Why the other options are wrong
- **Ban git entirely:** you also lose necessary safe operations (status, diff, local commit).
- **Lower effort:** reduces thoroughness; it does not teach the model safe boundaries.
- **Remove bash:** the agent can no longer run tests.`
  },
  "qz-claude-173": {
    q: `[Agents] A startup wants an agent to run on a nightly schedule, with its own workspace for bash and file operations, but does not want to write the agent loop or operate a sandbox. What is the most suitable option?`,
    options: [
      `Managed Agents: Anthropic runs the agent loop and hosts a container for each session; scheduled deployments run it on a schedule`,
      `The Anthropic SDK Tool Runner`,
      `The Claude Agent SDK installed on the startup's own servers`,
      `The Message Batches API run every night`
    ],
    explain: `**Correct: Managed Agents.** The four ways to build an agent differ on two questions: who provides the harness (loop + context management) and who provides the runtime.
| Approach | Harness | Infrastructure |
|---|---|---|
| Manual loop | you | you |
| Tool Runner | SDK | you |
| Claude Agent SDK | Claude Code harness | you |
| **Managed Agents** | Anthropic | **Anthropic** (container per session) |

Managed Agents is the only option that provides both, plus scheduled deployments to run on cron without a client-side scheduler.

### Why the other options are wrong
- **Tool Runner:** only loops over tools you define; no sandbox, you host it yourself.
- **Claude Agent SDK:** has built-in tools, but you still host and schedule it.
- **Batch API:** processes many independent requests; no tool loop or workspace.`
  },
  "qz-claude-174": {
    q: `[Agents] Which statements are correct when comparing the Tool Runner (client.beta.messages.tool_runner) with the Claude Agent SDK? (Choose 2)`,
    options: [
      `The Tool Runner is a helper in the ordinary Anthropic SDK that only loops over tools you define; it has no built-in tools or sandbox`,
      `The Claude Agent SDK is the Claude Code harness packaged as a library, with built-in tools for reading/writing files, bash, grep, subagents, hooks and permissions`,
      `Both are hosted by Anthropic, so you need no infrastructure`,
      `The Tool Runner exists only in the Python SDK`,
      `The Claude Agent SDK is just the new name for the Tool Runner`
    ],
    explain: `**Correct: the Tool Runner is a loop helper for your own tools; the Agent SDK is Claude Code as a library.**
- **Tool Runner** lives in the ordinary API SDKs ({{anthropic}}, {{@anthropic-ai/sdk}}...): it automates the cycle call API → run tool → send result, but only for tools you define. No built-in tools, no filesystem access, no sandbox.
- **Claude Agent SDK** ({{claude-agent-sdk}}, {{@anthropic-ai/claude-agent-sdk}}) is a separate product: the full Claude Code harness with Read/Write/Edit/Bash/Grep/WebSearch... tools, subagents, hooks, permissions and sessions.

### Why the other options are wrong
- **Anthropic hosts both:** wrong; both are just harnesses, you host them. Only Managed Agents is hosted.
- **Python only:** the Tool Runner exists in Python, TypeScript, Java, Go, Ruby, PHP and C#.
- **New name for each other:** they are two different packages with different scope.`
  },
  "qz-claude-175": {
    q: `[Agents] Which statements about the effort parameter when used for agents are correct? (Choose 2)`,
    options: [
      `Lower effort usually leads to fewer, more consolidated tool calls, fewer preambles and shorter acknowledgements`,
      `low suits subagents or simple tasks; work that depends on intelligence should use at least high`,
      `effort is set at the top level of the request, next to max_tokens`,
      `Changing effort between requests has no effect on the prompt cache`,
      `effort only has an effect once thinking is disabled`
    ],
    explain: `**Correct: effort affects the number of tool calls and the length; low for subagents/simple work.** Effort tunes the trade-off between thoroughness and token spend: lower effort → fewer, consolidated tool calls, fewer preambles, terse acknowledgements. The docs recommend at least {{high}} for work that needs intelligence, {{max}} when correctness matters more than cost, and {{low}} for subagents or simple work.

### Why the other options are wrong
- **Top-level:** effort lives in {{output_config}} (e.g. {{output_config.effort = "low"}}).
- **No effect on cache:** changing effort at the top level invalidates the cache of the messages part (and possibly tools/system too, depending on the model). Pin effort per route; on a few newer models a system message can change effort mid-conversation (beta) to avoid this.
- **Only when thinking is off:** effort controls the depth of adaptive thinking itself and the total token spend.`
  },
  "qz-claude-176": {
    q: `[Prompt] In an IDE, a user types "Could you suggest a few changes to make this function faster?" and Claude only lists suggestions instead of editing the code, while the product wants Claude to edit directly. What is the docs-recommended fix?`,
    options: [
      `Raise effort so the model is more proactive`,
      `Newer models follow instructions very literally: state the action explicitly ("Change this function so that...") or add a default instruction to the system prompt such as "by default, make the change instead of only suggesting it"`,
      `Use tool_choice any to force the model to call the edit tool`,
      `Add "CRITICAL: YOU MUST EDIT" at the start of the prompt`
    ],
    explain: `**Correct: state the action explicitly, or set a default in the system prompt.** Newer models are trained to follow instructions precisely. "Could you suggest..." is read literally as a request for suggestions. The docs suggest two approaches: phrase the request as an action ("Modify this function to improve performance"), or add a block like {{<default_to_action>}} to the system prompt: by default, make the change; when intent is unclear, infer the most useful action and use tools to find missing information instead of guessing.

### Why the other options are wrong
- **Raise effort:** makes the model think harder, it does not change how it reads a request for "suggestions".
- **tool_choice any:** returns 400 on Opus 5.5/Sonnet 5.5/Fable 5.1; and it forces a tool call even when the user only wants an answer.
- **CRITICAL/MUST:** the docs recommend softening this kind of language; with newer models an aggressive tone easily causes over-eager tool use.`
  },
  "qz-claude-177": {
    q: `[Prompt] One prompt mixes instructions, 5 documents, some examples and the user question in a single continuous block of text; the model sometimes treats document content as instructions. Which structural improvement fits best?`,
    options: [
      `Capitalise the entire instruction section`,
      `Move all 5 documents into the system prompt`,
      `Wrap each kind of content in consistent XML tags (<instructions>, <documents> containing <document index="n">, <examples>, <input>) so the model can tell them apart`,
      `Number every line of the prompt`
    ],
    explain: `**Correct: XML tag structure.** Docs: XML tags help Claude parse a complex prompt clearly, especially when the prompt mixes instructions, context, examples and variable input. Each kind of content goes in its own tag; use consistent, descriptive tag names; nest tags in their natural hierarchy (documents inside {{<documents>}}, each document as {{<document index="n">}} with metadata such as the source).

~~~text
<documents>
  <document index="1"><source>policy.pdf</source><content>...</content></document>
</documents>
<instructions>Use only the information in the documents...</instructions>
~~~

### Why the other options are wrong
- **Capitalise:** creates no boundary between content types, and may even provoke an overreaction.
- **Documents into the system prompt:** does not solve the distinction; the system prompt should hold the role and rules.
- **Line numbers:** do not tell the model which part is instruction and which is data.`
  },
  "qz-claude-178": {
    q: `[Prompt] Asked to fix a small bug, the coding agent adds a new helper class, new configuration, docstrings and try/catch for the whole module. What is the most sensible adjustment?`,
    options: [
      `Lower max_tokens so the model writes less code`,
      `Switch to Haiku 5.5`,
      `Add the sentence "please write high-quality code"`,
      `Add an instruction against over-engineering: change only what is required or genuinely necessary, add no features, abstractions or error handling for impossible scenarios, and add no comments to code you do not touch`
    ],
    explain: `**Correct: a specific instruction to keep the solution minimal.** The docs note that recent Opus models tend to over-engineer (creating extra files, unnecessary abstractions, flexibility nobody asked for) and suggest a prompt that spells out each aspect:
- **Scope:** fixing a bug does not call for tidying the surrounding code.
- **Documentation:** add no docstrings/comments/types to code you do not change.
- **Defensiveness:** add no error handling for scenarios that cannot happen; validate only at system boundaries.
- **Abstractions:** do not create helpers for one-shot operations.

### Why the other options are wrong
- **Lower max_tokens:** can truncate the fix mid-way ({{stop_reason: "max_tokens"}}) and does not change the tendency.
- **Switch to Haiku:** may reduce fix quality; the problem is the instruction, not the model.
- **"High-quality code":** vague, and may even encourage extra "improvements".`
  }
});
