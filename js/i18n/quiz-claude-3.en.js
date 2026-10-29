/*
 * English translation of js/data/quiz-claude.js — task T415. Format: js/core/i18n.js (content overlay).
 * ids: qz-claude-094 qz-claude-095 qz-claude-096 qz-claude-097 qz-claude-098 qz-claude-099 qz-claude-100 qz-claude-101 qz-claude-102 qz-claude-103 qz-claude-104 qz-claude-105 qz-claude-106 qz-claude-107 qz-claude-108 qz-claude-109 qz-claude-110 qz-claude-111 qz-claude-112 qz-claude-113 qz-claude-114 qz-claude-115 qz-claude-116 qz-claude-117 qz-claude-118 qz-claude-119 qz-claude-120 qz-claude-121
 */
App.i18n.content({
  'qz-claude-094': {
    q: `[Model Selection] A route uses Opus 5.5 at effort high with max_tokens 1024. Many responses end with stop_reason max_tokens even though the visible text is very short. What is the explanation, and what is the right fix?`,
    options: [
      'Thinking is not counted in max_tokens; the failure is caused by a prompt that is too long',
      'Thinking tokens are part of max_tokens (billed as output); raise max_tokens (stream if large) or lower effort for this route',
      'Turn thinking off with type disabled to save max_tokens for the text',
      'Add stop_sequences so the model stops earlier',
    ],
    explain: `**Correct: thinking eats into max_tokens.** Per the docs, thinking tokens are a subset of {{max_tokens}} and are billed as output. At effort high, the model may think for several thousand tokens before writing the answer, so the 1024 ceiling is hit while the text part is still very short. Either raise max_tokens (use streaming for large values), or lower effort if the route does not need deep reasoning.

### Why the other options are wrong
- **Thinking is not counted:** wrong per the docs.
- **thinking disabled:** Opus 5.5 does not allow turning thinking off (400).
- **stop_sequences:** makes the model stop earlier, which makes missing content even more likely; it does not solve the problem.`,
  },
  'qz-claude-095': {
    q: `[Model Selection] An engineer wants to send a 500K-token prompt to Sonnet 5.5. They plan to add the "long context" beta header and budget double the price for the part above 200K. Which statement is correct?`,
    options: [
      'Correct, you need the beta header and pay double above 200K',
      'Sonnet 5.5 only has a 200K context, so the request cannot be sent',
      'The 1M context is the default on Sonnet 5.5, no beta header is needed, and long prompts are billed at the standard price; only Haiku 5.5 charges more when the prompt is above 100K tokens',
      'You must use the Batch API for every prompt above 200K',
    ],
    explain: `**Correct: 1M is the default, standard price.** Per the Context windows docs, for every model with a 1M-token context (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1…), 1M is the default: no beta header is needed and long prompts are billed at the standard price, **with the exception of Haiku 5.5** (prompts above 100,000 tokens cost more).

### Why the other options are wrong
- **Beta header and double price:** does not apply to Sonnet 5.5; the docs state clearly that no beta header is required and the standard price applies.
- **Only 200K:** 200K is the context of older models such as Sonnet 4.5.
- **Batch is mandatory:** Batch is a cost/latency choice, not a requirement for long prompts.

> A long context does not mean you should stuff everything in: accuracy drops as context grows (context rot). Consider retrieval so you only send the relevant parts.`,
  },
  'qz-claude-096': {
    q: `[Agents] A request has both web_search (server tool) and get_order (client tool). Claude returns:
~~~json
{ "stop_reason": "tool_use",
  "content": [
    { "type": "server_tool_use", "id": "srvtoolu_01", "name": "web_search",
      "input": { "query": "intra-city express delivery fee 2026" } },
    { "type": "tool_use", "id": "toolu_02", "name": "get_order",
      "input": { "order_id": "ORD-100200" } } ] }
~~~
The code then sends the user message below and gets a 400 error mentioning that a server tool has no result yet:
~~~json
{ "role": "user", "content": [
  { "type": "tool_result", "tool_use_id": "toolu_02", "content": "status=SHIPPED" },
  { "type": "text", "text": "Continue please" } ] }
~~~
What is the correct fix?`,
    options: [
      'Run the search yourself and send an extra tool_result for srvtoolu_01',
      'Put the "Continue please" text before the tool_result',
      'Remove the server_tool_use block from the assistant message before sending it back',
      'The user message must contain only the client tool tool_result (no text block), with the tools array unchanged; the API runs web_search on that very request',
    ],
    explain: `**Correct: send only the tool_result, no text.** When Claude calls a server tool and a client tool in the same parallel group of calls, the server-side loop hands control back to you **before** running the server tool: the response has {{stop_reason}} set to {{tool_use}} and a {{server_tool_use}} block with no result yet. You return the tool_result for the client tool, **only** the tool_result, and keep {{tools}} unchanged. The API runs web_search on that request and the next response begins with its result. Text placed after the tool_result ends the turn early, so with a server tool that has not run yet the request returns 400.

### Why the other options are wrong
- **Send a tool_result for the server tool yourself:** server tools are run by Anthropic; you never build tool_results for them.
- **Text before tool_result:** always malformed; tool_result must come first in the content.
- **Remove server_tool_use:** breaks the conversation history; the model loses track of the call it just made.`,
  },
  'qz-claude-097': {
    q: `[Agents] To save tokens, the agent harness strips thinking blocks from assistant messages (keeping only text and tool_use) before sending the tool_result on the next turn. After this change, requests start failing. Why, and what should you do?`,
    options: [
      'When sending the tool_result, you must send back the thinking block of the assistant turn that contained that tool_use intact (signature included); the API validates the signature and rejects a modified block',
      'Thinking blocks may only be placed in the user message',
      'Move thinking into the system prompt to save tokens',
      'The error is caused by a missing interleaved thinking beta header on every model',
    ],
    explain: `**Correct: send the thinking block back intact.** The Context windows docs state explicitly: when you send a tool_result, you **must** include the full thinking block (unmodified, {{signature}} included) that came with that tool call. The API uses the encrypted signature to authenticate the thinking block; modifying the block makes the API return an error. To cut the tokens of old thinking, use a server-side mechanism such as **context editing** (thinking block clearing) instead of trimming it on the client.

### Why the other options are wrong
- **Thinking in the user message:** thinking is assistant content, not user content.
- **Move it into the system prompt:** no such mechanism exists, and it would break the prompt cache.
- **Interleaved beta header:** with models that use adaptive thinking, interleaved thinking is automatic; the header is only needed for some early Claude 4 models, and it has nothing to do with removing blocks.`,
  },
  'qz-claude-098': {
    q: `[Agents] In an agent loop, a response has stop_reason max_tokens and the last block is a tool_use whose input is cut off mid-way. Which handling approaches are correct? (Select 2)`,
    options: [
      'Do not run the truncated tool_use, because its input may be missing fields or be invalid',
      'Call again with a larger max_tokens (or reduce effort / the requested length) so the model regenerates a complete call',
      'Run the tool with the partial input that is there, then send the tool_result as usual',
      'Treat max_tokens like end_turn and return the current text to the user as the final answer',
    ],
    explain: `**Correct: do not run the cut-off call, and call again with a higher ceiling.** A stop_reason of {{max_tokens}} means the output was cut when it hit the ceiling. If the last block is a tool_use, its input may be incomplete (missing fields, broken JSON). Running the tool with that input can have real consequences (cancelling the wrong order, writing bad data). Raise {{max_tokens}} (use streaming for large values), or reduce the amount of thinking/length so the call fits under the ceiling, then call again.

### Why the remaining options are wrong
- **Run with the partial input:** risk of executing a wrong action; with tools that have side effects this is extremely dangerous.
- **Treat it as end_turn:** the work is not done; the user receives a half-finished answer without knowing it.

> Track a metric of max_tokens occurrences per route; a sudden spike usually means the prompt or the input data just changed.`,
  },
  'qz-claude-099': {
    q: `[Agents] A session transcript shows: get_order with the same order_id was called 3 times in a row, every tool_result was is_error: true with the content "failed", and then the agent started calling other tools at random. Which fix addresses the root cause best?`,
    options: [
      'Raise MAX_STEPS so the agent gets more chances to fix itself',
      'Write instructive errors (what happened, what to do next), and detect duplicate calls (tool + input) in code so it returns a clear error or stops the session',
      'Raise effort to max so the model thinks harder',
      'Drop is_error so the model believes the call succeeded and moves on',
    ],
    explain: `**Correct: instructive errors + duplicate detection in code.** The docs recommend writing **instructive** error messages instead of "failed", for example "Inventory API timed out after 2 attempts; data is temporarily unavailable, do not retry within this turn, tell the user to try again later". A generic message leaves the model with nothing but guessing: retry the exact same thing, then try unrelated tools. Add a safety layer in code: hash {{name}} + {{input}} of the calls; on the second duplicate return an explanatory error, on the third stop the session in a controlled way.

### Why the other options are wrong
- **Raise MAX_STEPS:** it only lets a pointless loop run longer and cost more.
- **Max effort:** the model cannot reason its way to something the tool did not say.
- **Drop is_error:** the model will reason over data that does not exist and may make up results.`,
  },
  'qz-claude-100': {
    q: `[Agents] An orchestrator hands work to a subagent with the brief: "Fix the bug as we discussed above, remember to do it the way I said". The subagent goes in a completely wrong direction. Root cause and fix?`,
    options: [
      'The subagent needs a stronger model than the orchestrator',
      'Prompt caching must be enabled for the subagent',
      'The subagent runs in its own context and cannot see the orchestrator\'s history; the brief must be self-contained: goal, scope, necessary data/paths, result format and limits',
      'The subagent is not allowed to use tools, so it cannot fix the bug',
    ],
    explain: `**Correct: the subagent does not have the orchestrator's context.** The benefit of a subagent is exactly its **own context**: it does not have to carry the main agent's whole long history. The price is that every piece of necessary information must live in the task handed down, like a brief for a new colleague who missed the meeting. "As we discussed above" means nothing to a subagent.

### Why the other options are wrong
- **Stronger model:** no model can guess a conversation it cannot see.
- **Prompt caching:** cuts the prefix cost, it does not pass context along.
- **No tool use:** the subagent has its own tool set configured by you; the problem here is missing information, not missing tools.`,
  },
  'qz-claude-101': {
    q: `[Agents] An agent using a new Claude model keeps spawning subagents for simple work such as grepping a string or editing one file, raising cost and latency. Which measures match the docs guidance? (Select 2)`,
    options: [
      'Set tool_choice none on every turn to block subagents',
      'Add guidance: use a subagent when the work can run in parallel, needs its own context, or is independent; do simple, sequential, single-file work directly',
      'Remove every file-reading tool so the agent is forced to delegate',
      'Describe clearly in the definition of the delegation tool (subagent) when it should and should not be used',
      'Set temperature 0 so the model is less eager',
    ],
    explain: `**Correct: clear guidance on when to use a subagent, and a well-described delegation tool.** The docs note that the new models coordinate subagents very proactively on their own, sometimes even when a single grep would do. The recommended remedy: add explicit guidance (use a subagent when the work is parallel, needs its own context, or is independent; do simple, sequential, single-file work directly) and make sure the delegation tool is described with a clear scope of use.

### Why the remaining options are wrong
- **tool_choice none:** blocks **every** tool; the agent can do nothing.
- **Remove file-reading tools:** does the opposite: it forces the agent to delegate even the simplest work.
- **temperature 0:** on the new API version sending temperature returns 400; it also does not control delegation decisions.`,
  },
  'qz-claude-102': {
    q: `[Agents] The refund tool needs a human approver. Claude has already returned the refund tool_use; the harness saves the state and waits. The approver rejects it with the reason "the order is past the return window". When the conversation continues, what do you send to the API?`,
    options: [
      'Send nothing for that tool_use, just send a new user message',
      'Remove the assistant message containing the refund tool_use from the history and ask again',
      'Send a fake successful tool_result so the conversation flows smoothly',
      'Send a tool_result with the same tool_use_id, is_error: true and the rejection reason, plus guidance not to retry but to explain it to the customer',
    ],
    explain: `**Correct: tool_result with is_error and the reason.** Every tool_use must have a matching tool_result right after it. When the approver rejects, return {{is_error: true}} with content such as "Approver rejected: the order is past the return window. Do not retry; explain the policy to the customer". The model understands the action did not happen and moves on to explaining, instead of retrying or making up a result.

### Why the other options are wrong
- **Send no tool_result:** the request fails with 400 because the tool_use has no result right after it.
- **Remove the assistant message:** context is lost, the model may propose the refund again; the history also no longer reflects what happened (hard to audit).
- **Fake success:** the model will tell the customer "the refund has been issued" while no money was actually refunded.`,
  },
  'qz-claude-103': {
    q: `[Agents] Every day about 30,000 emails need to be classified into 6 departments by stable criteria, then moved into that department's queue. Which architecture fits best?`,
    options: [
      'A code-driven workflow (routing): one classification call with a small model, the result constrained by structured outputs or an enum, and code routes the email by label',
      'A single autonomous agent with tools to read the mailbox, deciding the process for each email on its own',
      'An orchestrator with 6 subagents, each representing a department, debating which one the email belongs to',
      'An agent running continuously in an infinite loop scanning the mailbox',
    ],
    explain: `**Correct: a routing workflow.** The general principle: start from the simplest solution. A problem with clear input, a fixed set of labels and an unchanging process is the textbook case for **routing**: one classification call (Haiku 5.5 is usually enough, verify with an eval), the output constrained to the 6 labels, and code does the rest. Easy to control, cheap, easy to measure and debug. The part of the volume that is not urgent can also go through the Batch API.

### Why the other options are wrong
- **Autonomous agent:** flexibility you do not need, hard to predict, uses many more calls.
- **6 debating subagents:** multiplies the cost for something a single call can do.
- **Infinite loop:** no stopping condition is a cost risk; scanning the mailbox is the job of code/a scheduler.`,
  },
  'qz-claude-104': {
    q: `[Agents] A coding agent takes on a large task that spans multiple context windows. Each time the context is refreshed, the agent forgets which tests already pass and starts over. Which design pattern do the docs recommend?`,
    options: [
      'Raise max_tokens to 128K so the context never has to be refreshed',
      'Persist state to structured files (for example tests.json), keep progress notes in text (progress.txt), use git as a checkpoint; when a new context opens, tell the agent to read these files first before continuing',
      'Put the entire previous session history into the new session system prompt',
      'Turn compaction off and let the API drop old turns',
    ],
    explain: `**Correct: state lives outside the context.** The prompting docs for long-running agents recommend:
- Structured data (test status) in JSON, for example {{tests.json}}.
- Free-form progress notes in text, for example {{progress.txt}}.
- Use **git** to get a log and restorable checkpoints.
- When starting a new context, you can start "clean" instead of compacting, with explicit instructions: read progress.txt, tests.json, git log; run a basic integration test before starting a new feature.

### Why the other options are wrong
- **Raise max_tokens:** that is the per-turn output ceiling, it does not expand the context window.
- **Stuff old history into the system prompt:** brings the full context back, hits the same problem again, and makes the system prompt change constantly (breaking the cache).
- **Let the API drop old turns:** the API does not drop anything; going past the context window is an error or a stop.`,
  },
  'qz-claude-105': {
    q: `[Agents] An agent that reads many large files is configured with context editing as follows:
~~~json
{ "context_management": { "edits": [ {
  "type": "clear_tool_uses_20250919",
  "trigger": { "type": "input_tokens", "value": 30000 },
  "keep": { "type": "tool_uses", "value": 3 },
  "clear_at_least": { "type": "input_tokens", "value": 5000 },
  "exclude_tools": ["web_search"] } ] } }
~~~
Which statements are correct? (Select 3)`,
    options: [
      'When the input exceeds 30K tokens, the API removes the oldest tool results first',
      'The client must remove the corresponding tool results from its own history to stay in sync with the server',
      'The 3 most recent tool uses are always kept',
      'clear_at_least guarantees each cleanup frees enough tokens to be worth rewriting the prompt cache',
      'web_search results are removed first because they are in exclude_tools',
    ],
    explain: `**Correct: oldest removed first once the trigger is exceeded, the 3 most recent are kept, and clear_at_least compensates the cache cost.**
- {{trigger}}: the input threshold at which cleanup starts (30K tokens).
- {{keep}}: the number of most recent tool uses that are always kept (3).
- {{clear_at_least}}: each cleanup breaks the prompt cache for the prefix from the cut point; free enough tokens each time so the cost of rewriting the cache is worth it.

### Why the remaining statements are wrong
- **The client must remove them itself:** cleanup happens **on the server** before the content reaches the model; the client keeps the full history and does not need to sync.
- **web_search is removed first:** the opposite — {{exclude_tools}} lists tools whose results are **never** removed.`,
  },
  'qz-claude-106': {
    q: `[Agents] In one turn, Claude calls write_file and then run_tests. The harness runs them sequentially because run_tests depends on the file just written. write_file fails (disk full), so the harness does not run run_tests. What do you return to the API?`,
    options: [
      'Return a tool_result only for write_file; skip run_tests because it did not run',
      'Return the tool_result for write_file, and send the run_tests one in a separate user message afterwards',
      'Return a tool_result for both in the same user message: write_file with is_error describing the failure; run_tests with is_error saying "Not executed: the preceding write_file call failed"',
      'Return an HTTP 500 error to the API so the model figures it out',
    ],
    explain: `**Correct: every tool_use needs a tool_result, in one message.** When you run sequentially and stop at the first error, the calls that were skipped still need a tool_result with {{is_error: true}} explaining why they did not run. The docs use exactly this example: "Not executed: the preceding write_file call failed." That way the model knows precisely what did (and did not) happen so it can pick the next step.

### Why the other options are wrong
- **Skip run_tests:** a tool_use without a tool_result leads to a 400 on the next request.
- **A separate user message:** all tool_results of a turn must be in the **same** user message right after the assistant message; splitting them is malformed and also "teaches" the model to stop calling tools in parallel.
- **HTTP 500:** you are the API client; there is no notion of returning an HTTP code to the model, the only channel is tool_result.`,
  },
  'qz-claude-107': {
    q: `[Prompt] Old code uses the prefill "Here is the summary:" on the final assistant turn so the model skips the opening sentence. On Opus 5.5 the request returns 400. What replacement do the docs recommend?`,
    options: [
      'Move the prefill into the first assistant message of the conversation',
      'Send the prefill as a tool_result',
      'Keep the prefill and add a beta header to re-enable it',
      'Instruct directly in the system prompt (answer directly, do not start with "Here is..."), or ask for the content inside an XML tag / use structured outputs; trim any opening sentence that still slips through in post-processing',
    ],
    explain: `**Correct: direct instructions, XML tags or structured outputs, plus post-processing.** From Claude 4.6 models onward, prefill on the **final assistant turn** is no longer supported (400). The docs explain that instruction-following is now good enough that most prefill needs are gone. To drop the opening sentence: state it clearly in the system prompt ("Respond directly without preamble"), or ask for the result inside a tag (then take the tag content), or use structured outputs; if an opening sentence occasionally slips through, cut it in code.

### Why the other options are wrong
- **Put it in the first assistant message:** an assistant message in the middle of the conversation is still valid, but it no longer forces the start of the new answer.
- **Send it as a tool_result:** tool_result is only for returning tool output; instructions inside a tool_result may even be treated as untrusted data.
- **A beta header to re-enable it:** no such header exists.`,
  },
  'qz-claude-108': {
    q: `[Prompt] A long answer gets cut off midway (connection error). Previously the team prefilled the partial answer into the final assistant turn so the model would continue. On current models, what is the right approach?`,
    options: [
      'Put the continuation request in the user message, along with the tail of the interrupted answer (for example: "The previous response was interrupted at ...; continue from there"); if it does not affect the experience, just retry the whole request',
      'Send the existing text again as a prefill but with low temperature',
      'Set stop_sequences to the last sentence so the model joins it up itself',
      'Raise max_tokens; the model will remember where it was cut on the next call',
    ],
    explain: `**Correct: move the continuation into a user turn.** The migration guidance away from prefill suggests: put the continuation request in the **user message**, with the tail of the interrupted answer ("Your previous response was interrupted and ended with [...]. Continue from where you left off."). If this is an error-handling path and an extra call does not affect the experience, retrying the whole request is fine too.

### Why the other options are wrong
- **Prefill + low temperature:** prefill on the final turn returns 400 on current models; temperature also returns 400 on the new API version.
- **stop_sequences:** used to stop generation, it does not join anything together.
- **Raise max_tokens so the model remembers:** the API is stateless; the model remembers nothing between requests beyond what you send.`,
  },
  'qz-claude-109': {
    q: `[Prompt] You provide 3 contracts (each about 30K tokens) and ask for a comparison of the penalty clauses. Which prompt structures do the docs recommend? (Select 2)`,
    options: [
      'Put the question and instructions first, paste the contracts after them',
      'Put the long documents first, the question/instructions last',
      'Merge the three contracts into one continuous block with no separation to save tokens',
      'Put the three contracts in the system prompt along with the current time so the model knows the context',
      'Wrap each contract in a document tag (with source and document_content), and ask for a verbatim quote of the relevant passage into a quotes tag before analysing',
    ],
    explain: `**Correct: documents first, question last; and structure with XML tags + quote before analysing.** The long-context docs:
- Put long data (20K+ tokens) **at the top**, before the question and instructions; placing the question at the end can improve quality significantly (up to about 30% in tests), especially with multiple documents.
- Wrap each document in {{<document>}} with {{<source>}} and {{<document_content>}} so the model can tell the sources apart.
- Ask for the relevant excerpts to be quoted into {{<quotes>}} first and only then analysed; this helps focus and makes it easy to verify.

### Why the remaining options are wrong
- **Question first:** the opposite of the recommendation; the model easily "loses" the request after 90K tokens of documents.
- **Merge with no separation:** the model cannot tell which contract a clause belongs to.
- **System prompt + current time:** per-request data does not belong in the system prompt; the timestamp also breaks the prompt cache.`,
  },
  'qz-claude-110': {
    q: `[Prompt] The prompt currently says "DO NOT use markdown in your response" but the model still occasionally returns bulleted lists. According to the docs, what adjustment works better?`,
    options: [
      'Repeat the sentence "DO NOT use markdown" three times in capital letters',
      'Say what to do instead of what not to do, for example "The response should be composed of smoothly flowing prose paragraphs", and write the prompt itself in a style close to the desired output (less markdown in the prompt)',
      'Set max_tokens low so the model has no room to write a list',
      'Add stop_sequences set to "-" to block bullet points',
    ],
    explain: `**Correct: positive instructions + prompt style matching.** The docs list the effective ways to control formatting:
1. Tell Claude **what it should do** rather than what it must not do ("Your response should be composed of smoothly flowing prose paragraphs").
2. Use XML tags to specify the format (for example put the prose part in its own tag).
3. **Match the prompt style to the desired output**: a prompt full of markdown tends to produce markdown-heavy output.
4. Give detailed instructions when there is a specific format requirement.

### Why the other options are wrong
- **Capitals, repetition:** over-emphasis is less effective than stating the desired behaviour clearly, and can make the model rigid.
- **Low max_tokens:** it only truncates the answer.
- **stop_sequences "-":** the model stops at any hyphen (even inside a word), ruining the answer.`,
  },
  'qz-claude-111': {
    q: `[Prompt] The chatbot answers are read aloud by text-to-speech, and the engine cannot read ellipses. Which instruction do the docs recommend?`,
    options: [
      'ABSOLUTELY NEVER use ellipses',
      'No instruction is needed; stripping ellipses in post-processing is enough, the model does not need to know why',
      'Explain the reason: "The response will be read aloud by a text-to-speech engine, so never use ellipses since the engine cannot pronounce them"',
      'Set temperature 0 so the model uses no unusual punctuation',
    ],
    explain: `**Correct: state the reason behind the instruction.** The docs use exactly this example: instead of "NEVER use ellipses", write "Your response will be read aloud by a text-to-speech engine, so never use ellipses since the text-to-speech engine will not know how to pronounce them." When the model understands **why**, it generalises better: it also avoids similar things that hurt TTS (unusual symbols, tables) that you did not list.

### Why the other options are wrong
- **All-caps absolute rule:** it blocks ellipses, but the model does not understand the context, so it cannot avoid similar problems.
- **Post-processing only:** useful as an extra layer, but it does not help the model write sentences that read well aloud.
- **temperature 0:** irrelevant, and sending temperature returns 400 on the new API version.`,
  },
  'qz-claude-112': {
    q: `[Prompt] A ticket classification prompt has 4 few-shot examples, all 4 belonging to the "billing" label with priority "high". In production, the model assigns too many tickets to billing/high. What is the right fix?`,
    options: [
      'Remove all examples because few-shot no longer works with new models',
      'Add 10 more billing/high examples so the model understands better',
      'Put the examples at the end of the prompt, after the real question',
      'Make the examples diverse and realistic (several labels, several priority levels, with and without order codes), wrapped in examples/example tags to separate them from the instructions',
    ],
    explain: `**Correct: diverse, realistic, structured examples.** Few-shot is one of the strongest ways to control format and classification behaviour, but the model learns **all** the unintentional common traits of the examples. Four examples with the same label teach the model that "billing/high is the usual answer". The docs recommend 3–5 relevant examples that are **diverse** (covering edge cases) and wrapped in {{<example>}}/{{<examples>}}.

### Why the other options are wrong
- **Remove the examples:** few-shot is still very effective with current models; the problem is biased examples.
- **Add more of the same:** amplifies the existing bias.
- **Put examples after the question:** stable examples should come before the dynamic part (better for both quality and the prompt cache).`,
  },
  'qz-claude-113': {
    q: `[Prompt] When migrating a prompt from an older model to a new one, the agent calls the search_docs tool too often, even for simple questions. The old prompt has the line: "If in doubt, ALWAYS call search_docs". Which adjustments are appropriate? (Select 2)`,
    options: [
      'Add more capital letters so the model understands this is an exception',
      'Replace the vague instruction with a goal-oriented one, for example "call search_docs when you need specific information that is not in the conversation"',
      'Remove the over-emphatic lines that were written to compensate for the old model calling tools too rarely',
      'Force tool_choice any to control the number of calls',
      'Remove the description of search_docs so the model pays less attention to it',
    ],
    explain: `**Correct: goal-oriented guidance, and drop over-prompting.** The docs note: a tool that was "rarely called" on an old model is usually called about the right amount on a new one; lines like "If in doubt, use [tool]" now cause **over-calling**. The fix: replace the vague default with a specific condition, drop the redundant emphasis; if it is still too eager, lower effort as a fallback.

### Why the remaining options are wrong
- **More capital letters:** makes the problem worse; the new model follows instructions very closely.
- **tool_choice any:** forces a tool call **every** turn (even more calls), and it also returns 400 on Opus 5.5, Sonnet 5.5, Fable 5.1.
- **Remove the description:** the model loses the information it needs to choose when to use the tool; the description is the most important factor in tool-calling quality.`,
  },
  'qz-claude-114': {
    q: `[Tools] A request defining a tool returns 400 because the tool name is invalid. Which of these names is valid under the Claude API tool naming rules?`,
    options: [
      'orders_get-status',
      'orders.get_status',
      'orders get status',
      'pedidos_actualización',
    ],
    explain: `**Correct: orders_get-status.** Per the Define tools docs, tool names must match this regex:
~~~text
^[a-zA-Z0-9_-]{1,128}$
~~~
In plain words: only unaccented Latin letters, digits, underscores and hyphens, 1–128 characters long.

### Why the other options are wrong
- **orders.get_status:** the dot is not in the allowed character set.
- **orders get status:** it contains spaces.
- **pedidos_actualización:** an accented letter (ó) is outside the basic Latin set; the same applies to Vietnamese letters with diacritics.

> The docs recommend namespacing by service ({{orders_get_status}}, {{payments_get}}) so tool selection stays clear as the number of tools grows. Put Vietnamese descriptions in the description field, not in the name.`,
  },
  'qz-claude-115': {
    q: `[Tools] To make Claude pass the right format for the create_shipment tool (deeply nested input), you add input_examples. Immediately afterwards every request returns 400. One example in the array is missing the required order_id field. Which statement is correct?`,
    options: [
      'input_examples only works for server tools such as web_search',
      'Every example in input_examples must be valid against the tool input_schema; an example missing a required field makes the request return 400, so fix the example to match the schema',
      'input_examples must be placed in the system prompt, not in the tool definition',
      'Each tool may have at most 1 example',
    ],
    explain: `**Correct: examples must be valid against the schema.** {{input_examples}} is an array of sample input objects that helps the model understand how to use tools with complex, nested or format-sensitive input. The API validates every example against the {{input_schema}}: an invalid example returns 400. Examples also cost extra prompt tokens (about 20–50 tokens for a simple example, 100–200 for a deeply nested object).

### Why the other options are wrong
- **Only for server tools:** the opposite — input_examples does **not** support server tools (web search, code execution); it is meant for user-defined tools and tools with an Anthropic schema (except the computer/browser toolset).
- **Put it in the system prompt:** input_examples is a field of the tool definition. Writing examples in the prompt is a different technique.
- **At most 1 example:** the field is an array; there is no such one-example limit.`,
  },
  'qz-claude-116': {
    q: `[Tools] An agent has 14 small tools: create_pr, review_pr, merge_pr, list_pr, send_msg, send_dm, post_channel… for both GitHub and Slack. The model often picks the wrong tool. Per the docs, which redesign fits best?`,
    options: [
      'Split them into even more, smaller tools so each tool does only one thing',
      'Shorten each tool description so the model reads it faster',
      'Consolidate related operations into fewer tools with an action parameter, and namespace by service (for example github_pr with action create/review/merge, slack_send_message)',
      'Set tool_choice auto with disable_parallel_tool_use so the model chooses more slowly',
    ],
    explain: `**Correct: consolidate operations + namespaces.** The docs recommend: instead of one tool per action ({{create_pr}}, {{review_pr}}, {{merge_pr}}), consolidate into a single tool with an {{action}} parameter. Fewer but more powerful tools reduce ambiguity when choosing. At the same time, prefix by service ({{github_list_prs}}, {{slack_send_message}}) so things stay clear as the tool library grows, which matters especially when using tool search.

### Why the other options are wrong
- **Split even smaller:** more near-identical choices means more confusion.
- **Shorter descriptions:** the exact opposite; a detailed description is the most important factor in tool-calling quality (at least 3–4 sentences).
- **disable_parallel_tool_use:** only limits the number of tools per turn, it does not help pick the right one.`,
  },
  'qz-claude-117': {
    q: `[Tools] The approve_refund tool has a required parameter "reasoning" described as "Write your entire step-by-step reasoning before deciding". Requests occasionally end with a refusal. How do the docs say to fix it?`,
    options: [
      'Rename the parameter to "thoughts" and that is enough',
      'Raise max_tokens to hold the long reasoning',
      'Enable thinking type enabled so the model has its own space to reason',
      'Change it to a parameter that asks for a short explanation or supporting evidence (for example "brief reason, with evidence from the order data"); asking the model to output its thoughts/step-by-step reasoning through a parameter can lead to a reasoning_extraction refusal',
    ],
    explain: `**Correct: ask for an explanation, not for reasoning.** The Define tools docs state: if a parameter asks the model **why** it called the tool, ask for a short explanation or supporting evidence instead. A parameter demanding "thinking" or "step-by-step reasoning" can lead to a {{reasoning_extraction}} refusal. The model's thinking lives in the thinking block (adaptive) and does not need to be extracted through a parameter.

### Why the other options are wrong
- **Rename it to thoughts:** still asks for the thoughts to be exposed; the problem is the content of the request.
- **Raise max_tokens:** unrelated to refusals.
- **thinking enabled:** on 5.x models thinking is adaptive (Opus 5.5 is always on); the old enabled type with budget_tokens also returns 400.`,
  },
  'qz-claude-118': {
    q: `[Tools] An agent alternates tool_choice between auto and none on every turn (the none turn is meant to be "summary only"). The bill goes up, and usage shows the messages portion being cache-written over and over. Which explanation is correct?`,
    options: [
      'Changing tool_choice invalidates the cache of the messages blocks (tool definitions and system stay cached), so keep tool_choice stable or change it rarely',
      'tool_choice none wipes the entire cache, including tools and system',
      'The cache has nothing to do with tool_choice; the cause is a TTL that is too short',
      'tool_choice none does not exist, so the API falls back to any and creates a new cache',
    ],
    explain: `**Correct: changing tool_choice breaks the messages cache.** The Define tools docs note: when using prompt caching, changing {{tool_choice}} invalidates the cached messages blocks; tool definitions and the system prompt stay in the cache but the messages content must be reprocessed. With long conversations, every change rewrites the whole history. Keep tool_choice stable; if you want the last turn to only summarise, you can instruct it in the user message text instead of flipping tool_choice.

### Why the other options are wrong
- **Wipes tools and system too:** wrong, those two parts stay cached.
- **Because of the TTL:** usage shows cache writes exactly when tool_choice changes; the TTL is not the cause.
- **none does not exist:** {{none}} is a valid value (forbid tool calls, the default when there are no tools).`,
  },
  'qz-claude-119': {
    q: `[Tools] A team considers using the bash, text_editor and memory tools whose schemas Anthropic publishes instead of defining equivalent tools themselves. Which statements are correct? (Select 2)`,
    options: [
      'Anthropic runs bash commands on Anthropic infrastructure, the application only reads the results',
      'These are tools whose schema Anthropic publishes, but your application executes them and sends the tool_result',
      'No tool_result is needed because the result is already inside the response',
      'Claude calls them more reliably than equivalent home-made tools because it was trained on exactly these schemas',
      'They can only be used through the MCP connector',
    ],
    explain: `**Correct: client-executed with ready-made schemas, and trained in.** The "How tool use works" docs split tools into three groups by where the code runs: user-defined (client), **Anthropic-schema** (client), and server-executed. {{memory}}, {{bash}}, {{text_editor}}, {{computer}}, {{browser}} belong to the Anthropic-schema group: Anthropic publishes the schema, **your application** executes it and returns a {{tool_result}} like any regular tool. The benefit: the schemas are "trained in" — Claude was optimised on thousands of trajectories using exactly these signatures, so it calls them more reliably and recovers from errors better than with home-made tools.

### Why the remaining statements are wrong
- **Anthropic runs bash:** that is a property of server tools (web_search, web_fetch, code_execution, tool_search), not bash.
- **No tool_result needed:** also a property of server tools.
- **Only via the MCP connector:** these tools are declared directly in the request's tools array.`,
  },
  'qz-claude-120': {
    q: `[Tools] A request using an MCP connector (beta header included) fails validation:
~~~json
{
  "mcp_servers": [
    { "type": "url", "url": "https://mcp.jira.example.com/mcp", "name": "jira" },
    { "type": "url", "url": "https://mcp.wiki.example.com/mcp", "name": "wiki" }
  ],
  "tools": [ { "type": "mcp_toolset", "mcp_server_name": "jira" } ]
}
~~~
What is the correct fix?`,
    options: [
      'Merge the two servers into one mcp_toolset by listing both names in mcp_server_name',
      'Every server declared in mcp_servers must be referenced by exactly one mcp_toolset; add a toolset for wiki (you can disable some tools) or drop the wiki server from the request',
      'The MCP connector allows only one server per request',
      'Adding authorization_token is enough to make the error go away',
    ],
    explain: `**Correct: each server needs exactly one toolset.** The MCP connector validation rules:
- The toolset's {{mcp_server_name}} must match a server in {{mcp_servers}}.
- **Every** server in {{mcp_servers}} must be referenced by **exactly one** mcp_toolset.
- Each server has only one toolset.
Here the {{wiki}} server is declared but no toolset uses it, so the request is rejected.

### Why the other options are wrong
- **List two names in one toolset:** mcp_server_name points to **one** server; each server gets its own toolset.
- **Only one server per request:** wrong, the connector supports multiple servers in one request.
- **authorization_token:** used for OAuth authentication with servers that require sign-in; unrelated to this structural error.`,
  },
  'qz-claude-121': {
    q: `[Tools] The MCP server "jira" has 4 tools: search_issues, get_issue, create_issue, delete_issue. The toolset is configured as:
~~~json
{
  "type": "mcp_toolset",
  "mcp_server_name": "jira",
  "default_config": { "enabled": false },
  "configs": {
    "search_issues": { "enabled": true },
    "get_issue": { "enabled": true },
    "delete_issue": { "defer_loading": true }
  }
}
~~~
Which tools can Claude use? (Select 2)`,
    options: [
      'search_issues',
      'delete_issue (because it has its own entry in configs)',
      'get_issue',
      'create_issue',
    ],
    explain: `**Correct: search_issues and get_issue.** The MCP toolset configuration is merged in priority order: the specific settings in {{configs}} > the toolset's {{default_config}} > system defaults. This is the **allowlist** pattern: {{default_config}} turns everything off ({{enabled: false}}), then you enable each tool you need.
- {{search_issues}}, {{get_issue}}: configs sets enabled true, so they are enabled.
- {{delete_issue}}: configs only sets {{defer_loading}}; the {{enabled}} field is not overridden, so it **inherits false** from default_config. The tool stays off.
- {{create_issue}}: no specific entry, it inherits enabled false.

### Pitfall to remember
Having an entry in configs does **not** mean the tool is enabled: only the fields written in that entry are overridden. For dangerous tools such as delete, an allowlist (off by default, enable one by one) is safer than a denylist.`,
  },
});
