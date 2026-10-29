/*
 * English translation of js/data/quiz-claude.js — task T416. Format: js/core/i18n.js (content overlay).
 * ids: qz-claude-122 qz-claude-123 qz-claude-124 qz-claude-125 qz-claude-126 qz-claude-127 qz-claude-128 qz-claude-129 qz-claude-130 qz-claude-131 qz-claude-132 qz-claude-133 qz-claude-134 qz-claude-135 qz-claude-136 qz-claude-137 qz-claude-138 qz-claude-139 qz-claude-140 qz-claude-141 qz-claude-142 qz-claude-143 qz-claude-144 qz-claude-145 qz-claude-146 qz-claude-147 qz-claude-148 qz-claude-149
 */
App.i18n.content({
  "qz-claude-122": {
    q: `[Security] A customer-support agent needs to read incoming email bodies to draft replies. Where should the email body (which may contain malicious instructions) be placed in the request?`,
    options: [
      `Concatenate it at the end of the system prompt so the model treats it as important context`,
      `Put it in the text of the user message together with the instruction "reply to this email"`,
      `Return it inside a tool_result (for example from a read_email tool), along with source information such as an unverified sender`,
      `Put it in the tool description so the model always sees it`
    ],
    explain: `**Correct: only put untrusted content inside a tool_result.** The docs on indirect prompt injection say third-party content (email, web pages, uploaded files, API results) must travel through {{tool_result}}, and **never** into the system prompt or ordinary user text. Claude is trained to be appropriately suspicious of instructions that appear inside tool results. Stating the provenance (an email from an unverified sender) helps the model calibrate its trust.

### Why the other options are wrong
- **System prompt:** it elevates untrusted data to the highest trust level; a single "ignore all instructions" sentence in the email becomes a system directive. It also breaks the prompt cache.
- **User text:** the model has trouble telling the user's real request apart from the email content.
- **Tool description:** the description is the stable definition of the tool, not a place for per-request data.`
  },
  "qz-claude-123": {
    q: `[Security] To "remind" the model, the harness appends the sentence "Summarize the results above in 3 sentences" to the end of the tool_result content. The model usually ignores it, and sometimes even warns about it. What is the right approach?`,
    options: [
      `Write the reminder in capital letters inside the tool_result so the model pays attention`,
      `Put the reminder at the start of the tool_result instead of the end`,
      `Repeat the reminder in every tool_result`,
      `Put your instruction in the user message (text that comes after the tool_result blocks) rather than inside the tool_result content`
    ],
    explain: `**Correct: instructions belong in the user turn, after the tool_result.** Claude treats tool_result content as **untrusted data**, so instructions you stuff into it may be ignored or flagged as a suspected prompt injection. The docs recommend sending instructions in the user turn that follows the tool_result: within the same user message, the tool_result blocks come first and the instruction text comes after. (On some models you can also use a system message mid-conversation.)

### Why the other options are wrong
- **Capital letters / moving it to the start / repeating it:** it is still inside the untrusted-data region; position and wording do not change its nature. The model being suspicious of instructions inside tool results is the desired protective behaviour, not something to work around.`
  },
  "qz-claude-124": {
    q: `[Security] You screen user input with a Claude Haiku 5.5 call using structured outputs that returns {is_harmful: true/false}. One screening request ends with stop_reason set to refusal and no JSON. How should the application handle it?`,
    options: [
      `Treat it as a flagged (bad) screening result: block it or route it to cautious handling, and do not let the content flow straight into the main pipeline`,
      `Treat it as is_harmful false because no JSON means nothing was detected`,
      `Retry the screening repeatedly until JSON comes back`,
      `Skip screening for that request and send it straight to the main model`
    ],
    explain: `**Correct: a refusal in the screening step is a bad signal.** The docs on harmlessness screening state that Haiku 5.5 runs safety classifiers and may **refuse the screening request itself**; in that case treat a response whose {{stop_reason}} is {{refusal}} as a flagged result. The reason: content that makes the safety filter refuse already at the classification step is usually content with a problem.

### Why the other options are wrong
- **Treat as safe:** it turns the safeguard into a back door: the more harmful the content, the easier it slips through.
- **Retry continuously:** the same content is usually refused again; it wastes money and latency.
- **Skip screening:** "fail open" on exactly the most dangerous case.`
  },
  "qz-claude-125": {
    q: `[Security] A public chatbot is deliberately jailbroken by some users (direct prompt injection). Which measures do the docs recommend? (Choose 3)`,
    options: [
      `Screen input with a lightweight model (such as Haiku 5.5) and structured outputs that return a classification label`,
      `Raise the temperature so the model is harder to manipulate`,
      `Have the system prompt state clear ethical/legal boundaries and how to refuse`,
      `Put the API key in the system prompt with a "do not reveal" instruction so the model protects it itself`,
      `Track users who repeatedly try to bypass guardrails; warn, throttle or lock the account`,
      `Prefill "I cannot help with that" in the last assistant turn for every sensitive question`
    ],
    explain: `**Correct: harmlessness screening, a system prompt with boundaries, and handling repeat offenders.** For the threat model where **users themselves** are the attackers, the docs list: screening with a lightweight model (results constrained by structured outputs), filtering input against known jailbreak patterns, a system prompt that emphasises boundaries and refusal behaviour, and reacting to repeat offenders (warnings, limits, bans).

### Why the remaining options are wrong
- **Raising temperature:** not a safety measure; with the current API version, sending temperature now returns 400.
- **API key in the system prompt:** putting a secret in the context creates a leak risk; the model does not need the secret, the server-side tool does.
- **Prefill refusal:** a prefill in the last assistant turn returns 400 on current models; and mechanical refusals ruin the experience for legitimate users.`
  },
  "qz-claude-126": {
    q: `[Security] The read_email tool currently returns a concatenated string such as "From: x@y.com\\nBody: <content>". An attacker writes a body that contains a fake closing tag and instructions to "escape" the data section. Which format for tool results do the docs recommend?`,
    options: [
      `Wrap the body in several nested XML tags so it is harder to close`,
      `Encode the untrusted content as JSON (for example an object with source, from, verified_sender, body); JSON escaping creates a clear boundary, so an attacker cannot close a quote or a tag to inject instructions`,
      `Base64-encode the body so the model cannot read the instructions`,
      `Truncate every email longer than 500 characters`
    ],
    explain: `**Correct: JSON-encode the untrusted content.** The docs recommend wrapping third-party strings in a JSON object instead of splicing them into free-form text. JSON escaping turns every quote and brace in the body into an escape sequence, so the boundary between data and structure is **absolutely unambiguous**: however much the body looks like an instruction, the encoding shows it is data. Combine it with explicit provenance (verified_sender false) and a policy in the system prompt.

### Why the other options are wrong
- **Several layers of XML tags:** an attacker can still insert a fake closing tag; extra layers do not create an unforgeable boundary.
- **base64:** the model needs to read the email content to answer; encoding breaks the feature and is not a recommended measure.
- **Truncating long emails:** a malicious instruction can be very short; it also loses legitimate content.`
  },
  "qz-claude-127": {
    q: `[Claude Code] A project has two PreToolUse hooks that both match Bash: hook A prints JSON with permissionDecision "allow" for commands on a trusted list; hook B checks whether the command contains "rm -rf" and, if so, writes the reason to stderr and exits 2. Claude runs "rm -rf build/". What happens?`,
    options: [
      `The command runs because hook A returned allow`,
      `The hook declared first wins, so the result depends on the order in settings.json`,
      `The command is blocked: hook results are merged by the strictest decision (deny > defer > ask > allow); hook B's exit 2 is a block, and the reason on stderr is passed to Claude`,
      `Claude Code shows a dialog asking the user to choose between the two hooks`
    ],
    explain: `**Correct: the strictest decision wins.** When several hooks match the same event, all of them run (in parallel) and Claude Code merges the results. For PreToolUse permission decisions the precedence is {{deny}}, {{defer}}, {{ask}}, {{allow}}. Exit code 2 means block the action; the stderr content is handed to Claude so it can change its approach.

### Why the other options are wrong
- **Runs because of allow:** allow is the loosest decision and is overridden by deny. On top of that, a hook allow still does not override a deny rule in settings.
- **The first declared hook wins:** order does not matter; results merge by strictness.
- **Asking the user:** that only happens when the merged decision is ask.

> Also remember: exit 0 from PreToolUse does **not** mean "allowed", only "no objection"; the tool still goes through the normal permission flow.`
  },
  "qz-claude-128": {
    q: `[Claude Code] You run claude -p in CI to review PRs (including PRs from outside contributors) and want to allow only viewing diffs. Which configurations are correct? (Choose 2)`,
    options: [
      `Use --dangerously-skip-permissions on a shared runner so the job does not get stuck waiting for approvals`,
      `Add --bare so hooks, MCP servers, CLAUDE.md… from the repo directory are not loaded automatically when running -p`,
      `Write Bash(git diff*) (without a space) to allow every git diff command`,
      `Use --allowedTools "Bash(git diff *)", with a space before the star, so only commands starting with git diff are allowed`,
      `No restriction is needed because -p mode always rejects every command`
    ],
    explain: `**Correct: --bare and a precise allow rule.**
- **--bare:** without it, a {{-p}} session still runs hooks from {{.claude/settings.json}} and connects to servers in the repo's {{.mcp.json}}, even in a directory that was never trusted, and there is no trust dialog. With PRs from outside contributors, that is a path for them to run commands on the runner. The docs recommend --bare for scripts/SDK usage.
- **Bash(git diff *):** permission-rule syntax; the trailing " *" is a prefix match. The space matters: without it, {{Bash(git diff*)}} also matches {{git diff-index}}.

### Why the remaining options are wrong
- **--dangerously-skip-permissions on a shared runner:** it drops every check; use it only in an isolated container/VM running as a non-root user.
- **git diff* without a space:** it matches more broadly than intended, as explained above.
- **-p always rejects every command:** without a mode, -p starts in Manual and rejects calls that **need approval**, but operations that need no approval (such as reading files in the working directory) and anything matching an allow rule or hook still run. It is no substitute for configuring permissions explicitly.`
  },
  "qz-claude-129": {
    q: `[Eval] The team has two options for a ticket-classification eval set: (A) 30 cases hand-labelled very carefully by experts; (B) 1,500 cases taken from real tickets, scored automatically with label matching plus an LLM grader with a rubric, where the per-case signal is less than perfect. According to the eval-design principles in the docs, what should be prioritised?`,
    options: [
      `A, because human labelling is always more trustworthy than automatic scoring`,
      `A, because a small eval runs faster and therefore iterates faster`,
      `No eval at all; watching user feedback in production is enough`,
      `B: prioritise volume over per-item quality; many automatically scored cases (with slightly weaker signal) beat a few high-quality hand-labelled cases, as long as the set reflects the real distribution and includes edge cases`
    ],
    explain: `**Correct: prioritise volume.** The docs state three eval-design principles: **task-specific** (reflect the real distribution and include edge cases such as empty, overlong or ambiguous input), **automate when possible** (multiple-choice, string match, code-graded, LLM-graded), and **prioritise volume over quality**: many automatically scored questions with a slightly weaker signal beat a few high-quality hand-labelled ones. 30 cases are far too few to detect regressions in each segment.

### Why the other options are wrong
- **Human labelling is always better:** human graders are the most flexible but slow and expensive; the docs recommend avoiding them when possible and using them only to calibrate the grader and on random samples.
- **A small eval iterates faster:** automatically scoring 1,500 cases is still fast, while 30 cases give wildly fluctuating conclusions.
- **Only watch production:** you find bugs after users hit them; you cannot compare two prompt versions before deploying.`
  },
  "qz-claude-130": {
    q: `[Eval] You are designing an LLM grader to score answers from a returns-policy chatbot. Which practices do the docs recommend? (Choose 2)`,
    options: [
      `Detailed, clear rubrics for each criterion (for example "must mention the 30-day window, otherwise mark it incorrect")`,
      `Let the grader write long free-form comments with no scale, to preserve nuance`,
      `Use the grader for the whole eval right away without checking its reliability first`,
      `Require a specific output (correct/incorrect or a 1–5 scale) and let the grader reason before scoring (enable thinking)`
    ],
    explain: `**Correct: detailed rubrics, and a concrete output with reasoning before scoring.** Tips for LLM-based grading in the docs:
- **Detailed, clear rubrics:** criteria specific enough to reach a correct/incorrect conclusion automatically.
- **Empirical or specific:** output only correct/incorrect or a 1–5 scale; purely qualitative judgement is hard to aggregate quickly at scale.
- **Encourage reasoning:** use a grader with thinking enabled so it reasons before giving a score, which improves accuracy on complex judgements.

### Why the remaining options are wrong
- **Free-form comments with no scale:** cannot be aggregated, cannot be compared across versions.
- **Using it without checking:** the docs say LLM grading needs to "test to ensure reliability first, then scale": compare against human graders on a sample before trusting the results.`
  },
  "qz-claude-131": {
    q: `[Applications] Code handling Opus 5.5 responses always reads response.stop_details.category for logging and hits a NullPointerException on most requests. What is the explanation and the correct fix?`,
    options: [
      `stop_details only has a value when stop_reason is refusal; for end_turn, tool_use, max_tokens… it is null, so you must check stop_reason before reading it`,
      `stop_details is only returned when streaming is enabled; synchronous requests need an extra beta header to get this field`,
      `The Java SDK renamed the field to stopDetails so the code reads the wrong name; renaming it is all it takes`,
      `stop_details is only present when thinking display is set to summarized; you must enable it to log the category`
    ],
    explain: `**Correct: stop_details only exists on refusal.** {{stop_details}} (GA since Opus 4.7) is only populated when {{stop_reason}} is {{refusal}}, and contains {{type}}, {{category}} (for example {{cyber}}, {{bio}}, {{reasoning_extraction}}; it can be null) and {{explanation}}. For every other stop_reason ({{end_turn}}, {{tool_use}}, {{max_tokens}}, {{pause_turn}}…) the field is null. Since most requests end normally, reading {{category}} directly NPEs on the majority of requests.

~~~java
if ("refusal".equals(stopReason) && stopDetails != null) {
    log.warn("refusal category={}", stopDetails.category()); // read only on refusal
}
~~~

### Why the remaining options are wrong
- **Only when streaming:** the field is present in both regular and streamed responses, with no beta header required.
- **Renaming the field:** the field name in the SDK is not the cause; null stays null even when read by the right name.
- **Depending on thinking display:** {{display}} only decides whether thinking emits a summary, and has nothing to do with stop_details.`
  },
  "qz-claude-132": {
    q: `[Applications] A request sends "fallbacks": "default" with the header anthropic-beta: server-side-fallback-2026-06-01 and receives a 400. What is the cause?`,
    options: [
      `fallbacks only accepts an array of models; the "default" form does not exist`,
      `The scalar form "default" goes with the header server-side-fallback-2026-07-01; the 2026-06-01 header is for the array form [{"model": ...}], and pairing a header with the wrong form returns 400`,
      `fallbacks is only supported on the Message Batches API`,
      `You must drop the beta header because fallbacks is GA`
    ],
    explain: `**Correct: header and parameter form must match.** Server-side fallback has two forms:
- The old array form: {{fallbacks}} is an array of {{model}} objects (for example model {{claude-opus-4-8}}) plus the {{server-side-fallback-2026-06-01}} header.
- The new {{fallbacks: "default"}} form (the server routes by refusal type on its own, so you do not maintain a model list) plus the {{server-side-fallback-2026-07-01}} header.

The docs state explicitly that pairing one form's header with the other form returns 400. Fix: switch the header to {{2026-07-01}} or use the array form.

### Why the remaining options are wrong
- **"default" does not exist:** it does exist and is the recommended form for Fable 5.1/Opus 5.5.
- **Only on Batch:** the opposite; the fallbacks parameter is **rejected** on the Batches API.
- **Drop the header because it is GA:** the feature is still beta, and a missing header is also an error.`
  },
  "qz-claude-133": {
    q: `[Applications] A company runs Claude Fable 5.1 through Amazon Bedrock and wants to automatically re-run on another model when it gets a refusal. What is the appropriate approach?`,
    options: [
      `Add the fallbacks parameter to the request just like the Claude API; Bedrock supports it fully`,
      `It cannot be done; a refusal on Bedrock is always final`,
      `The server-side fallbacks parameter is not available on Bedrock; use the SDK's client-side middleware (BetaRefusalFallbackMiddleware) to resend to the fallback model`,
      `Set tool_choice to none so the model never refuses`
    ],
    explain: `**Correct: use client-side fallback.** The {{fallbacks}} parameter (server-side) only exists on the Claude API (and Claude Platform on AWS); it is not available on Amazon Bedrock, Vertex AI or Microsoft Foundry. The SDKs ship {{BetaRefusalFallbackMiddleware}} (together with {{BetaFallbackState}}), registered on the client: when a response has {{stop_reason: "refusal"}}, the middleware resends the request to the fallback model you configured.

### Why the remaining options are wrong
- **Adding fallbacks like the Claude API:** Bedrock does not accept this parameter.
- **It cannot be done:** it can, on the client side as above.
- **tool_choice none:** it only forbids tool calls; refusal is decided by the safety classifier and has nothing to do with tool_choice.

> Note: the middleware resends the **entire request body**; if the body carries parameters only the original model accepts (for example Sonnet 5.5's {{between_tools}}), you must write the retry yourself.`
  },
  "qz-claude-134": {
    q: `[Applications] A Node.js developer creates the client with new Anthropic({ timeout: 30 }) intending "30 seconds". Every request fails almost instantly. Why?`,
    options: [
      `The SDK minimum timeout is 60 seconds; smaller values are treated as 0`,
      `timeout only applies to streaming; regular requests use the default value`,
      `The timeout must be set in the request headers, not on the client`,
      `In the TypeScript SDK the timeout is in milliseconds (only Python and Ruby use seconds); 30 means 30 ms, so it must be 30000`
    ],
    explain: `**Correct: units differ between SDKs.** The default timeout is 10 minutes, but the configured unit differs: Python/Ruby use **seconds**, TypeScript uses **milliseconds**, Go uses {{time.Duration}}, Java uses {{Duration}}, C# uses {{TimeSpan}}. {{timeout: 30}} in TS is 30 ms, so every request times out. Change it to {{30_000}}.

> One more trap: timeouts are also retried ({{maxRetries}} defaults to 2), so the real wait can reach timeout × (maxRetries + 1).

### Why the remaining options are wrong
- **Minimum 60 seconds:** no such rule exists.
- **Only applies to streaming:** the timeout applies to every request.
- **Set in headers:** the timeout is HTTP-client configuration (or a per-request option), not a header sent to the API.`
  },
  "qz-claude-135": {
    q: `[Applications] A request occasionally returns 500 and you need to open a ticket with Anthropic support. What should you log for each call so support can find the right request?`,
    options: [
      `The response's request-id header value (the Python SDK exposes it as message._request_id), plus the timestamp and model`,
      `The entire API key so support can identify the account`,
      `Only the prompt content; support will search by content`,
      `The SDK retry attempt number; support looks it up by that`
    ],
    explain: `**Correct: log the request-id.** Every response has a {{request-id}} header (of the form {{req_...}}). The Python SDK exposes it as {{message._request_id}} (despite the underscore, this attribute is public); other SDKs let you read the header from the raw response. It is the key Anthropic uses to find the exact request; include the timestamp, model and error code for faster investigation.

### Why the remaining options are wrong
- **Sending the API key:** never share a secret; the key does not help locate a specific request.
- **Searching by prompt content:** it is not a lookup mechanism, and logging prompts can leak user data.
- **Retry count:** it is only a local client counter; the server knows nothing about it.`
  },
  "qz-claude-136": {
    q: `[Applications] A voice assistant has a cached 40K-token system prompt. The first user after every deploy always waits noticeably longer. Which statements about "pre-warming" the cache are correct? (Choose 2)`,
    options: [
      `Send a request with max_tokens: 0 at startup: the API runs the prefill, writes the cache at the breakpoint, returns empty content with stop_reason max_tokens and does not bill output tokens`,
      `The pre-warm request should use the same thinking and effort configuration as real traffic, so the entry is written to match real requests`,
      `With continuous traffic (requests less than 5 minutes apart), add a pre-warm job every minute to make sure the cache stays warm`,
      `Pre-warming always helps, even when the prefix changes per user`,
      `max_tokens: 0 is rejected by the API; you must use max_tokens: 1`
    ],
    explain: `**Correct: max_tokens 0, and the same thinking/effort configuration as real traffic.**
- A {{max_tokens: 0}} request runs the prefill, writes the cache at {{cache_control}}, immediately returns {{content: []}} with {{stop_reason: "max_tokens"}} and full usage; no output tokens are billed, only the cache-write charge.
- Changing thinking or effort can invalidate the cache (at least the messages part, depending on the model), so the warming request must use the same configuration as real requests.

Pre-warming is worth it when first-turn latency is visible to users (chat, voice), the prefix is large, and there is time before traffic (startup, after a deploy).

### Why the remaining options are wrong
- **Pre-warm every minute under continuous traffic:** real requests already keep the cache warm (every read refreshes the TTL); the extra job only writes redundantly.
- **Per-user prefixes:** there is nothing shared to warm; each write costs about 1.25x the input price and nobody reads it back.
- **max_tokens 0 is rejected:** the docs describe exactly this approach (except a few combinations such as streaming, structured outputs, Batch).`
  },
  "qz-claude-137": {
    q: `[Applications] An analysis job concurrently sends 50 requests that share the same 100K-token document prefix (with cache_control). Usage shows all 50 requests have large cache_creation_input_tokens and none reads the cache. What is the best fix?`,
    options: [
      `Switch the cache to a 1-hour TTL`,
      `Send one request first, wait until it starts streaming its first token, and only then fire the remaining 49`,
      `Increase the number of breakpoints to 8 so each request writes a share`,
      `Put cache_control at the end of each request's own question`
    ],
    explain: `**Correct: send one request first, then fan out.** A cache entry can only be read **after the first response has started streaming**. 50 parallel requests with the same prefix all arrive before any entry exists, so every request pays the write price (about 1.25x) and none can read anyone else's. The right approach: send one request, wait for the first token (you do not need to wait for completion), then send the other 49 so they read the entry that was just written (about 0.1x).

### Why the remaining options are wrong
- **1-hour TTL:** the problem is timing (the entry does not exist yet), not expiration; a 1h TTL also doubles the write price.
- **8 breakpoints:** at most 4 breakpoints per request, and more breakpoints do not solve the concurrency problem.
- **A marker at the end of each request's own question:** the entry would include each request's own part, so nobody can reuse it; the marker must sit at the end of the shared part.`
  },
  "qz-claude-138": {
    q: `[Applications] An agent takes one very long turn: it calls 30 tools sequentially, one tool_use then one tool_result each time, with text in between. The request has a single breakpoint on the last block. The next request reports cache_creation_input_tokens close to the whole conversation even though the first part of the payload is identical. What is the most likely cause?`,
    options: [
      `Tool results are too long to be cached`,
      `Prompt caching only works when the request has no tools`,
      `Each breakpoint only looks back up to 20 positions to find an existing entry; this turn added more than 20 positions so the previous entry cannot be found. Add intermediate breakpoints roughly every 15 positions`,
      `The cache expires automatically after 20 tool calls`
    ],
    explain: `**Correct: the 20-position lookback window.** When reading the cache, each breakpoint looks back **at most 20 positions** to find the entry written by the previous request. On the Claude API, a run of consecutive tool_use blocks (parallel) counts as one position, and so does a run of consecutive tool_result blocks; but 30 sequential calls interleaved with text produce dozens of positions. The new breakpoint can no longer "see" the old entry, so it rewrites everything, even though the payload is byte-identical.

Fix: place intermediate breakpoints roughly every 15 positions in long turns, or keep a marker within 20 positions of the last cached block.

### Why the remaining options are wrong
- **Long tool results are not cached:** tool_result is a cacheable block; length is not the reason.
- **No caching with tools:** wrong; tools are even the first part of the cached prefix.
- **Expires after 20 tool calls:** the TTL is time-based (5 minutes/1 hour), not based on the number of tool calls.`
  },
  "qz-claude-139": {
    q: `[Applications] A request already has 4 explicit cache_control markers (tools, system, documents, latest turn). A developer adds a top-level cache_control to "also enable automatic caching" and gets a 400. Why?`,
    options: [
      `Automatic caching can only be used when the request has no tools`,
      `A top-level cache_control is only valid in the Batch API`,
      `You must remove cache_control from system because automatic caching handles system itself`,
      `Each request allows at most 4 breakpoints, and the automatic breakpoint takes one slot too; when all 4 slots are taken by explicit markers, adding a top-level one returns 400`
    ],
    explain: `**Correct: the 4-breakpoint limit, and automatic counts too.** Automatic caching is the {{cache_control}} field at the request top level: the system places a breakpoint on the last cacheable block and moves it forward as the conversation grows. It **takes one of the 4 slots** and can be combined with explicit markers, except for two 400 cases the docs spell out: the 4 slots are all taken by explicit markers, and the explicit marker on the last block has a different TTL from the top-level field.

A durable pattern for agents: one explicit marker at the end of the static system prompt + automatic caching for the conversation part.

### Why the remaining options are wrong
- **Cannot be used with tools:** automatic caching does not depend on tools being present.
- **Only in Batch:** it works on the regular Messages API (depending on platform support).
- **Remove the system marker because automatic handles system:** automatic places only **one** breakpoint at the end; the static system prompt should still have its own marker. The error here is exceeding 4 slots.`
  },
  "qz-claude-140": {
    q: `[Applications] You want product documentation (rarely changing) cached for 1 hour, and conversation history cached for 5 minutes. Which placement is valid?`,
    options: [
      `A marker with ttl "1h" at the end of the documents (which come first), and a 5-minute marker on the conversation part after them; a long-TTL entry must come before a short-TTL entry`,
      `A 5-minute marker on the documents and a 1h marker at the end of the conversation so the conversation lives longer`,
      `A top-level cache_control with ttl "1h" is enough to get two different TTLs`,
      `The TTL goes in the anthropic-cache-ttl header, not on the block`
    ],
    explain: `**Correct: long TTL first, short TTL after.** A per-block TTL requires an explicit marker, and the ordering rule is that a 1-hour entry must appear **before** any 5-minute entry in the prompt. The rarely changing documents sit at the start of the prefix with {{"ttl": "1h"}}, and the conversation after them uses the default 5-minute TTL: right both in order and in meaning.

~~~json
{"type": "text", "text": "<documents>", "cache_control": {"type": "ephemeral", "ttl": "1h"}}
~~~

### Why the remaining options are wrong
- **5 minutes first, 1h after:** it violates the ordering rule (1h must come before 5 minutes).
- **Top-level only:** automatic caching places just one breakpoint, so you cannot have two different TTLs.
- **anthropic-cache-ttl header:** no such header exists; the TTL goes in {{cache_control}}.`
  },
  "qz-claude-141": {
    q: `[Applications] The same chatbot (a byte-for-byte identical prompt) runs in two services, each using an API key that belongs to a different workspace. The cache hit rate is much lower than when running one service. What is the most likely explanation?`,
    options: [
      `The cache is shared only within the same API key`,
      `On the Claude API the cache is isolated per workspace; traffic split across two workspaces writes and reads two separate sets of entries`,
      `The cache is shared between organisations, so it is contended with other customers`,
      `Prompt caching only works on a single HTTP keep-alive connection`
    ],
    explain: `**Correct: the cache is isolated per workspace.** On the Claude API (as well as Claude Platform on AWS and Microsoft Foundry) the cache is isolated per **workspace**; on Bedrock and Google Cloud it is per organisation. The cache is never shared between organisations. Splitting the same prompt across two workspaces means each side must write its own entries and can only read its own, so the hit rate drops, especially with sparse traffic. The docs recommend checking this before blaming the prompt.

### Why the remaining options are wrong
- **Per API key:** the isolation unit is the workspace, not each key; several keys in the same workspace still share the cache.
- **Shared between organisations:** the opposite; it is never shared between organisations.
- **Keep-alive:** the cache lives on the server side and is not tied to an HTTP connection.`
  },
  "qz-claude-142": {
    q: `[Applications] An agent has a generation turn that lasts about 4 minutes, then a tool runs for another 2 minutes before the next request is sent. The 5-minute cache keeps missing on the next request. Why?`,
    options: [
      `The cache expires because the output is too long (over 32K tokens)`,
      `The 5-minute TTL counts from when the response finishes, so it should have hit; the cause is something else`,
      `The TTL counts from when the writing/reading request began; 4 minutes of generation + 2 minutes of tool work is about 6 minutes, past the 5-minute mark. For gaps of 5–60 minutes, use the 1-hour TTL`,
      `Prompt caching does not apply to agents with tools`
    ],
    explain: `**Correct: the TTL is measured from the start of the request.** An entry's lifetime counts from **the moment the request** that writes or reads it **begins**; generation time is subtracted too. A 4-minute generation turn leaves only about 1 minute; add 2 minutes of tool work and the entry has expired by the time the next request starts.

Pick the TTL by the gap from the start of one request to the start of the next:
| Gap | TTL |
|---|---|
| Under 5 minutes | 5 minutes (refreshed on every read, cheapest) |
| 5–60 minutes | 1 hour (2x write price but worth it) |
| Over 1 hour | re-warm on a schedule or accept the miss |

### Why the remaining options are wrong
- **Long output causes expiry:** length does not decide expiry; time does.
- **Counted from when the response ends:** the reference point is wrong; this is exactly the usual misunderstanding.
- **Not applicable to agents:** caching works well for the agent loop.`
  },
  "qz-claude-143": {
    q: `[Applications] A chatbot uses Opus 5.5 with a cached 25K-token system prompt. Mid-conversation, when the user turns on "concise mode", the code edits the top-level system prompt by adding one sentence, and from then on cache hits drop to 0. What is the better approach?`,
    options: [
      `Put the instruction in the next tool_result content`,
      `Start a new conversation with the new system prompt`,
      `Write the instruction at the end of the user's message as if the user wrote it`,
      `Append a {"role": "system", ...} message to messages (right after a user message): the cached prefix stays intact and the instruction carries operator authority`
    ],
    explain: `**Correct: a mid-conversation system message.** Editing the top-level system prompt changes the head of the prefix, so everything after it loses the cache. On supporting models (Opus 5.5, Opus 5, Fable 5.1, Sonnet 5.5, Haiku 5.5…, with no beta header needed) you append a message with {{role: "system"}} (for example: "Concise mode: answer in under 40 words.") to {{messages}}. The cached prefix is untouched, and the model treats it as an operator instruction rather than a user's words. Placement rules: it must come after a user message (or an assistant message ending with a server tool), be the last element or be followed by an assistant message, and must not be {{messages[0]}}.

### Why the remaining options are wrong
- **Putting it in a tool_result:** tool_result content is treated as untrusted data; instructions there may be ignored or treated as an injection.
- **A new conversation:** it loses the history and still has to rewrite the cache.
- **Pretending it is the user speaking:** wrong authority (operator versus user), and a real user could imitate it to escalate privileges.`
  },
  "qz-claude-144": {
    q: `[Applications] You enable server-side compaction (beta compact-2026-01-12). On each turn the code only takes the response text string and appends it to the history. Once the conversation passes the threshold the context keeps growing and compaction seems to "do nothing". Where is the bug?`,
    options: [
      `You must append the whole response.content (including the compaction block) to messages; taking only the text loses the compaction state`,
      `Compaction only runs when streaming is used`,
      `You must call a /v1/compact endpoint yourself after each turn`,
      `Compaction only runs on Haiku`
    ],
    explain: `**Correct: keep the compaction block intact.** When the context reaches the trigger threshold, the API summarises the older part on the server and returns a {{compaction}} block inside {{response.content}}. On the next request the API uses that block to **replace** the history it summarised. If the code only takes the text and appends it, the compaction block is thrown away, and the next request sends the entire old history again, as if compaction had never happened.

~~~python
messages.append({"role": "assistant", "content": response.content})  # correct: keep every block
~~~

### Why the remaining options are wrong
- **Only when streaming:** compaction runs with regular requests too.
- **A /v1/compact endpoint:** there is none; it is configured through {{context_management.edits}} with {{compact_20260112}}.
- **Only on Haiku:** compaction (beta) is available on Opus 5.5, Sonnet 5.5, Fable 5.1, Haiku 5.5 and the 4.6+ models.`
  },
  "qz-claude-145": {
    q: `[Applications] You enable citations for PDF documents to display "page X" next to each answer sentence. Which field of a citation gives the location to display?`,
    options: [
      `char_location with start_char_index; convert the character position to a page number yourself`,
      `The page_location citation type with start_page_number and end_page_number (1-based)`,
      `content_block_location with the block index`,
      `Citations do not return a location; only cited_text`
    ],
    explain: `**Correct: page_location for PDFs.** Enable {{citations}} ({{enabled: true}}) on each {{document}} block (enable it for all or for none). The response is split into several text blocks, and blocks with citations carry a {{citations}} array. Each citation has {{cited_text}}, {{document_index}}, {{document_title}} and a location that depends on the document type:
| Document type | Location type |
|---|---|
| Plain text | {{char_location}} (start/end_char_index) |
| PDF | {{page_location}} (start/end_page_number, 1-based) |
| Custom content | {{content_block_location}} |

### Why the remaining options are wrong
- **char_location:** used for plain-text documents, not PDFs.
- **content_block_location:** used for custom-content documents.
- **No location:** wrong; the location is the main point of a citation.

> Remember: citations cannot be combined with {{output_config.format}} (400).`
  },
  "qz-claude-146": {
    q: `[Applications] You upload a PNG image through the Files API and then reference it with a "document" block whose source type is "file" and file_id is the image, and you get an error. What is the correct fix?`,
    options: [
      `The Files API does not accept images; you must send images as base64`,
      `Add the beta header files-api-2025-04-14 to the request`,
      `The content block type must match the file MIME type: images are referenced with an "image" block (source type "file"), while only PDFs/text use "document"`,
      `Change the source type to "url" and paste the file_id there`
    ],
    explain: `**Correct: the block type must match the MIME type.** The Files API (no longer beta) returns a {{file_id}} after upload. When referencing, you use a {{type: "document"}} block with {{source.type: "file"}} and {{file_id}} for PDFs/text, while images use a {{type: "image"}} block (also with {{source.type: "file"}}). The block type must match the file's MIME type; declaring a PNG as a document is an error.

### Why the remaining options are wrong
- **The Files API does not accept images:** it does; reference images with an image block.
- **files-api-2025-04-14 header:** the Files API is GA and needs no beta header; the new SDK exposes {{client.files}}.
- **source "url" with file_id:** source url is for public URLs, not file_id.`
  },
  "qz-claude-147": {
    q: `[Applications] After each deploy of a new JSON schema for structured outputs, the first request is noticeably slower and later requests are normal. Which explanation is correct?`,
    options: [
      `The model reloads its weights every time the schema changes`,
      `Because the prompt cache is cleared on every deploy`,
      `Structured outputs run two generation passes for each new schema`,
      `A new schema pays a one-off compilation cost; later requests with the same schema use the compiled version from a 24-hour cache`
    ],
    explain: `**Correct: the schema is compiled the first time.** Structured outputs (constrained decoding) need the schema compiled into generation constraints. The docs note that a new schema pays the compilation cost **once**, on the first request; later requests with the same schema reuse the compiled version cached for **24 hours**. That is why only the first request after a deploy is slow. If first-request latency matters, you can send a warming request after deploying.

### Why the remaining options are wrong
- **Reloading weights:** the model does not change with the schema.
- **Prompt cache cleared:** your deploy does not clear the server-side cache; and if it were the prompt cache you would see it in {{cache_read_input_tokens}}, which does not match the "only the first request per schema" pattern.
- **Two generation passes:** no such mechanism exists.`
  },
  "qz-claude-148": {
    q: `[Applications] You use output_config.format with a JSON schema that has minimum, maxLength and a recursive structure (nested category tree). Which statements are correct? (Choose 2)`,
    options: [
      `Recursive schemas are not supported by structured outputs; you need to flatten the structure or limit the depth`,
      `minimum/maxLength are not supported by the API; the Python/TypeScript SDKs strip them from the schema they send and re-check them on the client`,
      `The API fully supports every JSON Schema keyword`,
      `You should set additionalProperties: true so the model is more flexible`,
      `Numeric constraints are guaranteed 100%, so the server does not need to validate`
    ],
    explain: `**Correct: recursion is not supported; numeric/string constraints are handled client-side by the SDK.** The JSON Schema limits of structured outputs:
- **Supported:** object, array, string, integer, number, boolean, null; {{enum}}, {{const}}, {{anyOf}}, {{allOf}}, {{$ref}}; some string formats (date-time, email, uuid…); {{additionalProperties: false}} (required on every object).
- **Not supported:** recursive schemas; numeric constraints ({{minimum}}, {{maximum}}, {{multipleOf}}); string constraints ({{minLength}}, {{maxLength}}); complex array constraints; additionalProperties other than false.

The Python/TS SDKs strip unsupported constraints from the schema they send and check them on the client side.

### Why the remaining options are wrong
- **Supports every keyword:** wrong, see the list above.
- **additionalProperties: true:** only false is accepted.
- **No validation needed:** numeric constraints are not even enforced by the API; the server must still validate business logic.`
  },
  "qz-claude-149": {
    q: `[Applications] After upgrading the SDK to a version that sends anthropic-version 2026-10-21, every request with temperature: 0.2 returns 400. What is the correct fix?`,
    options: [
      `Remove temperature/top_p/top_k from the request (this API version rejects them on every model); steer behaviour with the prompt, effort or structured outputs`,
      `Change temperature to 0 because only non-zero values are forbidden`,
      `Move temperature into output_config.temperature`,
      `Add the beta header sampling-params to re-enable the parameters`
    ],
    explain: `**Correct: drop the sampling parameters.** With API version {{2026-10-21}}, a Messages request that sends {{temperature}}, {{top_p}} or {{top_k}} returns 400 on **every model**. (On current models such as Opus 5.5/Fable 5.1, sampling was already removed earlier.) For stable output, use clear prompts, few-shot examples and structured outputs; to change how much effort goes into a reply, use {{output_config.effort}}.

### Why the remaining options are wrong
- **Setting it to 0:** sending the parameter is an error, whatever the value.
- **output_config.temperature:** does not exist; output_config holds effort, format, task_budget…
- **sampling-params header:** no header re-enables these parameters.`
  }
});
