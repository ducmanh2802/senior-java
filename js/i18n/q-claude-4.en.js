/*
 * English translation of js/data/q-claude.js — task T397. Format: js/core/i18n.js (content overlay).
 * ids: claude-026 claude-027 claude-028 claude-029 claude-030 claude-031 claude-032 claude-033
 */
App.i18n.content({
  'claude-026': {
    q: 'You need Claude to look up orders in the company\'s Java system. How do you define the tool (name, description, input_schema) so that Claude calls it at the right time and with the right parameters?',
    a: `**Summary:** A tool consists of {{name}} (matches regex {{^[a-zA-Z0-9_-]+$}}, max 128 characters), {{description}}, and {{input_schema}} (JSON Schema). According to the docs, **a detailed description is the single most important factor** for the quality of tool calls: clearly state what the tool does, when it should (and shouldn't) be used, what each parameter means, and what the tool **does not** return. The docs recommend at least 3–4 sentences for every tool.

### How Claude "sees" the tool
Claude doesn\'t read your Java code. The API merges tool definitions into a special system prompt, so to the model, **name + description + schema is the complete understanding** of the tool. With a vague description, the model has to guess: it might call the wrong tool, pass the wrong date format, or fail to call it when it should.

### Good and bad examples
~~~json
{
  "name": "orders_get_status",
  "description": "Get delivery status of ONE order by ID. Use when a customer asks if an order has been delivered, where it is, or estimated arrival. Do not use for order history or refunds (use payments_get). Returns status (PENDING, SHIPPED, DELIVERED, CANCELLED), tracking number, and estimated date; do not return customer address or phone number. If order not found, return NOT_FOUND error.",
  "input_schema": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string", "description": "Order ID in ORD-123456 format, from customer message. Do not make up IDs." }
    },
    "required": ["order_id"]
  }
}
~~~
Bad version: {{"name": "get", "description": "Get order"}} with {{id}} parameter without description. The model doesn\'t know if "id" is an order ID or customer ID, nor when to use this tool instead of others.

### Tool writing checklist (per docs)
| Principle | Why |
|---|---|
| Extremely detailed description | #1 factor affecting tool selection quality |
| Group related actions (with {{action}} parameter) instead of many tiny tools | Fewer tools mean fewer mistakes |
| Namespace by service: {{orders_get_status}}, {{payments_get}} | Clarity as tool count grows |
| Use {{enum}} for fixed values | Model won\'t hallucinate weird values |
| Add {{input_examples}} for complex input | Examples must be valid per schema, otherwise error 400 |
| Response: less is more | Return stable IDs, only necessary fields; excess data wastes context |
| "Reasoning" parameters should ask for **brief explanation**, not "step-by-step reasoning" | Docs warn reasoning requests via parameters can be rejected as reasoning_extraction |

### Java side: the tool as a system boundary
~~~java
@Component
class OrderStatusTool implements ClaudeTool {
    public String name() { return "orders_get_status"; }
    public ToolResult run(JsonNode input, CallerContext ctx) {
        String id = input.path("order_id").asText();
        if (!id.matches("ORD-[0-9]{6}"))                       // validate like user input
            return ToolResult.error("order_id must be in ORD-123456 format");
        Order o = orderService.findForCustomer(id, ctx.customerId()); // authorize per actual user
        if (o == null) return ToolResult.error("NOT_FOUND: order " + id + " does not exist for this customer");
        return ToolResult.ok(Map.of("status", o.status(), "eta", o.eta().toString())); // only necessary fields
    }
}
~~~
Note {{ctx.customerId()}} is taken from the **session**, not from the model input: the model must not decide who it is serving.

### Ensuring input matches schema
Turn on {{strict: true}} on the tool (strict tool use) so sampling is bound to the schema: no more "2" instead of 2, no missing required fields. Strict doesn\'t replace business validation (the order ID might still not exist).

### Production pitfalls
- Two tools with overlapping descriptions ("search_orders" vs "find_order") → model picks randomly. Merge them or clearly define boundaries.
- Returning the entire JPA entity with 80 fields as a tool result: wastes tokens, exposes sensitive data.
- Renaming tools when old conversations still reference the old name: keep names stable, treat them as public API.

> Senior tip: write descriptions like you are writing Javadoc for **a new colleague**. Quick test: give the tool list to someone who doesn\'t know the system and ask "for customer X\'s question, which tool do you call, and with what parameters?". Where they hesitate, Claude will also hesitate.`,
    follow: ['When should you group multiple actions into one tool with an action parameter?', 'How do input_examples differ from few-shot in prompts?', 'Why shouldn\'t you let the model pass customer_id to the tool?']
  },
  'claude-027': {
    q: 'What values does tool_choice have? Old team code used tool_choice {"type": "tool"} to force Claude to always return JSON via a tool; when switching to Opus 5.5, it throws a 400 error. Why, and how do you fix it?',
    a: `**Summary:** {{tool_choice}} has 4 types: {{auto}} (default when tools exist, model decides if calling a tool), {{any}} (must call a tool), {{tool}} (must call a specific named tool), {{none}} (must not call a tool, default when no tools). On **Opus 5.5, Sonnet 5.5, Fable 5.1** (and Mythos 5.1), {{any}} and {{tool}} **throw a 400 error**: "forced tool use" is no longer supported. The fix: use {{auto}} + {{strict: true}} on the tool, or use **structured outputs** if the real goal is just to get JSON in the correct schema.

### How each value works
| tool_choice | Behavior | Note |
|---|---|---|
| auto | Model decides: call tool or respond in text | Default; prompt still influences choice |
| any | Must call at least one tool | Not supported on 5.5 models / Fable 5.1 |
| tool | Must call the specific named tool | Not supported on 5.5 models / Fable 5.1 |
| none | No tool calls allowed | Useful for "just summarize" turns |

Additional details from docs:
- When forcing tools ({{any}}/{{tool}}) on supported models, the API prefills to force the call, so the model **doesn\'t write explanatory text** before tool_use, and **thinking is skipped**.
- With manual extended thinking ({{thinking.type = "enabled"}}), any/tool are not supported.
- Changing tool_choice between requests **breaks cache** for the messages part (tools and system are still cached).
- {{disable_parallel_tool_use: true}} is **inside** the tool_choice object, not a top-level parameter.

### Why old code used forced tool use
Before structured outputs, the common trick to get JSON was: define a tool "record_result" with the desired schema and force {{tool_choice}} to that tool. The model had to "call" the tool, and you\'d read {{input}} as JSON. This trick doesn\'t work on newer models.

### Migration paths
1. **Goal is JSON in schema** (extraction, classification): switch to structured outputs via {{output_config.format}}. This is specifically designed for this.
~~~json
{
  "model": "claude-opus-5-5",
  "max_tokens": 1024,
  "output_config": {
    "format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": { "category": { "type": "string", "enum": ["billing", "shipping", "other"] } },
        "required": ["category"],
        "additionalProperties": false
      }
    }
  },
  "messages": [ { "role": "user", "content": "Categorize this ticket: I was charged twice" } ]
}
~~~
2. **Goal is agent acting via tools**: use {{auto}}, turn on {{strict: true}} on the tool so input always matches the schema, and clearly state in the prompt/tool description when the tool should be called. Code must handle cases where the model returns text instead of calling a tool (e.g., asking user for missing info).
3. **Need a guarantee of a call** (pipeline batch): check on the code side, if no tool_use is present, send another turn as a prompt, or switch to structured outputs.

~~~java
// Don\'t hardcode tool_choice in the old style: configure per model
ToolChoice choice = capabilities.supportsForcedToolUse(model)
        ? ToolChoice.tool("record_result")
        : ToolChoice.auto();                     // model 5.5: auto + strict tool
~~~

### Production pitfalls
- Adding {{tool_choice: any}} to a shared library for all models: changing models brings down the system with 400 errors.
- Using forced tool use then wondering why thinking is gone and quality drops on hard tasks: forced tools skip thinking.
- Changing tool_choice every turn in a long conversation causes constant cache misses, increasing costs.

> Senior tip: when migrating models, grep your entire codebase for {{tool_choice}}, {{budget_tokens}}, assistant prefill, and {{temperature}}: these are the parameters that most often cause 400 errors on new models. Write a contract test that sends sample requests of **every** route to the new model before switching traffic.`,
    follow: ['How is structured outputs different from strict tool use?', 'When do you use tool_choice none?', 'How do you get Claude to call a tool without forcing tool_choice?']
  },
  'claude-028': {
    q: 'Claude returns 3 tool_use blocks in the same response (checking weather in 3 cities). How do you run them in Java, how do you return the results, and when should you disable parallel tool calling?',
    a: `**Summary:** By default, Claude can call **multiple tools in one turn** (parallel tool use). The API does not dictate the execution order: run them in parallel, sequentially, or a mix, depending on tool nature. Mandatory: return **one tool_result for each tool_use**, **all in the same user message**, matched by {{tool_use_id}}, with tool_result appearing before any text. To disable: set {{disable_parallel_tool_use: true}} **inside** the {{tool_choice}} object.

### Running them correctly
- Tool **read-only, independent** (weather, read file, DB query): run in parallel to reduce latency.
- Tool **has side effects, shares state, or is ordered** (write file then run test): run sequentially in the order of appearance, stop at the first error. Skipped tools must still have a tool_result with {{is_error: true}}, e.g., "Not executed: the preceding write_file call failed."
- Specifically computer use and browser use: docs strictly require running sequentially and stopping at the first error.

~~~java
List<Block> calls = resp.content().stream().filter(Block::isToolUse).toList();
List<CompletableFuture<Block>> futures = calls.stream()
    .map(c -> CompletableFuture.supplyAsync(() -> executor.run(c), toolPool)
        .orTimeout(5, TimeUnit.SECONDS)                         // timeout per tool
        .exceptionally(e -> Block.toolError(c.id(), "Timeout/error: " + e.getMessage())))
    .toList();
List<Block> results = futures.stream().map(CompletableFuture::join).toList(); // maintain order
history.add(Msg.assistant(resp.content()));
history.add(Msg.user(results));                                // ONE message for all 3 results
~~~

### Right and wrong format
~~~json
// Right: one user message containing all 3 tool_results
{ "role": "user", "content": [
  { "type": "tool_result", "tool_use_id": "toolu_01", "content": "Hanoi 24°C" },
  { "type": "tool_result", "tool_use_id": "toolu_02", "content": "Da Nang 28°C" },
  { "type": "tool_result", "tool_use_id": "toolu_03", "content": "HCMC 31°C" } ] }
// Wrong: 3 separate user messages, each with one result
~~~
Docs state this is the #1 common error that makes Claude **stop calling in parallel**: the history has separate results, "teaching" the model to call them one by one.

### Enabling or disabling parallel
| Configuration | Effect |
|---|---|
| Default | Possible multiple tool_uses per turn |
| {{tool_choice}} auto + {{disable_parallel_tool_use: true}} | Max 1 tool per turn (text might still be returned) |
| any/tool + disable_parallel_tool_use | Exactly 1 tool, but any/tool isn\'t usable on Opus 5.5, Sonnet 5.5, Fable 5.1 |
| Want more parallelism | Add instruction in system prompt: if tasks are independent, call all at once |

When to disable: tool has side effects that depend on each other and you don\'t want to handle dependencies, the backend system can\'t handle bursts, or you need to audit every step.

### When calls depend on each other
If running in parallel and one call fails because what it needs isn\'t ready yet (e.g., read file while another call is creating it), return {{is_error}} with a natural message; per docs, Claude will call again in the next turn.

### Production pitfalls
- Using {{ForkJoinPool.commonPool()}} for blocking HTTP tool calls: blocks the entire application. Use a separate bounded pool (or virtual threads on Java 21).
- No limit on concurrent calls: Claude calling 10 heavy queries in one turn can overload the DB. Set semaphores per tool type.
- Mapping results by completion order instead of {{tool_use_id}}: mixes up results between cities.

> Senior tip: measure the "number of tool_uses per assistant message" metric. Docs use this exact metric to diagnose: if it\'s 1.0 when the task is clearly parallelizable, check the history format before editing the prompt.`,
    follow: ['How do you limit concurrent tool execution to avoid overloading backend systems?', 'When a tool in a batch fails, how do you return results for the others?', 'How do virtual threads help when running tools in parallel?']
  },
  'claude-029': {
    q: 'What is MCP (Model Context Protocol)? When do you write an MCP server instead of defining a tool directly in the request, and how does Claude API\'s MCP connector work?',
    a: `**Summary:** MCP is an **open protocol** standardizing how AI applications connect to data sources and tools. An **MCP server** exposes capabilities (tools, resources, prompts); an **MCP client** in the host application (Claude Code, Claude Desktop, your app) connects to the server. Writing a tool once as an MCP server allows **multiple clients to reuse it**. Claude API has an **MCP connector** (beta) allowing you to declare remote servers right in the request without writing your own client, but currently, it only supports **tool calls** and the server must be a **public HTTP server**.

### Quick understanding
Tools are usually like writing functions for each app. MCP is like the USB standard: devices (servers) plugged into any machine (client) with support just run. If your team has 5 AI apps that all need to "query Jira", writing one Jira MCP server is enough instead of 5 separate tool implementations.

### Three capabilities in the MCP spec
| Type | Meaning | Example |
|---|---|---|
| Tools | Functions the model can call | create_ticket, run_query |
| Resources | Data the app reads to put into context | file content, DB schema |
| Prompts | Prefabricated prompts the user selects | "review PR per team standard" |

Transport: **stdio** (server runs as child process on machine, fits local tools) and **Streamable HTTP** (remote server; some older servers use SSE).

### MCP connector in Messages API
Consists of two parts: {{mcp_servers}} (connection info) and an entry {{mcp_toolset}} in {{tools}} (enable/disable specific tools). Requires beta header {{anthropic-beta: mcp-client-2025-11-20}}.
~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "mcp_servers": [{
    "type": "url",
    "url": "https://mcp.example.com/mcp",
    "name": "jira",
    "authorization_token": "USER_OAUTH_TOKEN"
  }],
  "tools": [{
    "type": "mcp_toolset",
    "mcp_server_name": "jira",
    "default_config": { "enabled": false },
    "configs": { "search_issues": { "enabled": true } }
  }],
  "messages": [ { "role": "user", "content": "Are there any bugs blocking release 3.2?" } ]
}
~~~
- {{url}} must be https; **local stdio servers cannot be connected directly**.
- Can allowlist (disable all then enable specific tools as above) or denylist.
- Response contains {{mcp_tool_use}} and {{mcp_tool_result}} blocks: API calls the server automatically, you don\'t run the tool yourself.
- Docs note: Claude calls an MCP tool when the request matches the tool\'s capability, **it does not** call for general knowledge questions about that service.

### When to choose what
| Situation | Choose |
|---|---|
| Logic used only in one Java service, requires tight control | Regular tool (client tool) |
| A data source used by many apps/agents, multiple teams | MCP server |
| Want employees to use in Claude Code, Claude Desktop | MCP server |
| Third-party service already has a remote MCP server | Use via connector, after evaluating trustworthiness |
| Need resources/prompts via API | Write your own MCP client (connector currently supports tools only) |

### Production pitfalls
- Connecting to third-party MCP servers without evaluation: docs emphasize these are third-party, only connect to servers you trust. Tool results from them are **untrusted data** (risk of prompt injection).
- Enabling all 60 tools of a server: wastes context, model likely to pick wrongly. Allowlist only necessary tools.
- Using a shared admin token for all users: loses user-based authorization. Pass the OAuth token of the actual user.
- Server changes tool list mid-stream: newer beta header ({{mcp-client-2026-09-15}}) has tool list pinning; consider when stability is needed.

> Senior tip: treat an MCP server like an **internal public API**: it has versioning, ownership, authentication, rate limits, and audit logs. The biggest risk is not in the protocol but in a server with write access being used by many agents without any control.`,
    follow: ['Why can\'t the MCP connector connect to stdio servers?', 'How do you protect an internal MCP server with write access?', 'When should you use defer_loading with search tools?']
  },
  'claude-030': {
    q: 'What content do you put in the system prompt versus the user turn? Why do docs recommend using XML tags to structure prompts, and what does a good prompt for a customer support chatbot look like?',
    a: `**Summary:** The **system prompt** contains things that are **stable for every turn**: role, rules, tone, policy, output format. The **user turn** contains things that **change with every request**: question, document for this turn, input data. **XML tags** (e.g., {{<instructions>}}, {{<context>}}, {{<document>}}) help Claude clearly distinguish instructions from data from examples, reducing misunderstandings, especially when prompts are long and mix many content types.

### Why separate them
- Stable content in the system prompt **caches well** (prompt caching): static parts first, dynamic parts last.
- Role in the system prompt defines behavior and tone for the whole conversation; docs say even a one-sentence role makes a difference.
- User data or external documents **should not** be put in the system prompt: it may contain malicious instructions and would be "raised" to the highest confidence level.

### Prompt writing principles (per docs)
1. **Clear, direct**: treat Claude as a new, very talented employee who doesn\'t know your processes yet. Tip: have a colleague who doesn\'t know the context read the prompt; if they are confused, Claude will be too.
2. **Explain the "why"**: instead of "NEVER use ellipses", write "the answer will be read by text-to-speech, so don\'t use ellipses because the engine cannot read them". The model generalizes from the reason.
3. **Be clear about format and constraints**; when order is important, write as numbered steps.
4. **Consistent XML tags**, nested when hierarchical (multiple documents in {{<documents>}}, each as {{<document index="n">}}).

### Example system prompt
~~~text
You are a customer support assistant for ShopABC, responding in Vietnamese, friendly, and concise.

<policies>
- Only answer about orders, delivery, and returns of ShopABC.
- Refund: only explain policy, do not promise; refunds are handled by staff.
- Do not ask customer for password or OTP code.
</policies>

<output_format>
Max 5 sentences. If more information is needed, ask exactly one question.
The answer displayed in the chat interface doesn\'t support markdown, so write in plain text.
</output_format>
~~~

### Example user turn
~~~text
<order_info>
{"order_id":"ORD-123456","status":"SHIPPED","eta":"2026-10-30"}
</order_info>

<customer_message>
Why is my order taking so long? I want to cancel.
</customer_message>
~~~

### Quick classification table
| Content | Where to put |
|---|---|
| Role, tone, policies | System |
| Output format | System |
| Fixed sample examples (few-shot) | System (in {{<examples>}}) |
| Current question, current document | User |
| Content from web/email/tool | tool_result (untrusted data) |

### Production pitfalls
- Putting timestamp or username at the **start** of the system prompt: every request is different, so cache always misses.
- Writing all CAPS and "MANDATORY" everywhere: new models follow instructions very closely, over-emphasizing might make the model rigid. Explaining the "why" is more effective.
- Conflicting rules ("always be concise" and "always explain fully") → model picks one at random.

> Senior tip: manage system prompts like **code**: save in git, have reviews, version them and attach to logs for every request, and run evals before deploying. Most "the bot was working yesterday" incidents come from someone editing a prompt directly on production.`,
    follow: ['Why shouldn\'t you put customer email content in the system prompt?', 'Is it better to put long documents at the start or end of the prompt?', 'How do you version and review system prompts?']
  },
  'claude-031': {
    q: 'Old team code used few-shot and "prefill" (writing the beginning of the assistant response, e.g., "{") to force Claude to return the correct format. On current models, which method still works, and what do you replace prefill with?',
    a: `**Summary:** **Few-shot** (providing sample examples) is still one of the most reliable ways to control format, tone, and structure; docs recommend 3–5 **realistic, diverse** examples wrapped in {{<example>}}/{{<examples>}}. **Prefill** at the final assistant turn **is no longer supported** from Claude 4.6 onwards (including 5.x models): sending it will throw a 400 error. Replace with structured outputs (if needing JSON), direct instructions in the system prompt (remove introductory phrases), or tools/enum (for classification).

### What is prefill and why was it popular
Prefill was sending a final {{role: "assistant"}} message with a few characters pre-filled, e.g., the opening brace of a JSON, to force the model to "write on" from there, making the result start with JSON. Docs explain that the instruction-following ability of new models is good enough that most prefill needs are gone. Note: only prefill at the **final assistant turn** is forbidden; assistant messages in the middle of conversation history are fine.

### Migration table (per docs)
| Old purpose of prefill | Replacement |
|---|---|
| Force JSON/YAML | Structured outputs ({{output_config.format}} with JSON schema) |
| Classify into fixed labels | Tool with {{enum}} field or structured outputs |
| Remove opening phrase "Here is the summary..." | System prompt: "Answer directly, do not open with 'Here is...'; or require response in XML tag; or clean up in post-processing |
| Write on from cut-off sentence | Put existing part into **user** turn: "Previous answer was cut off at ...; please continue" |
| Remind context in long conversation | Put reminder in user turn, or via tool / compaction |

### Writing few-shot correctly
~~~text
<examples>
<example>
<ticket>I was charged twice for order ORD-100200</ticket>
<answer>{"category":"billing","priority":"high","order_id":"ORD-100200"}</answer>
</example>
<example>
<ticket>Does the shop sell XL size?</ticket>
<answer>{"category":"product","priority":"low","order_id":null}</answer>
</example>
<example>
<ticket>Order delivered to wrong address, needed urgently before 5pm</ticket>
<answer>{"category":"shipping","priority":"high","order_id":null}</answer>
</example>
</examples>
~~~
- **Diverse**: include examples with and without order IDs, different priorities. If all 3 examples are "billing", the model will lean toward billing.
- **Realistic**: take from real tickets (PII removed), correct length and tone customers actually write with.
- **Separated from instructions** with tags so the model knows these are examples, not data to process.

### Few-shot combined with structured outputs
Few-shot teaches **how to think** (when something is high priority), structured outputs ensure **shape** (JSON syntax). Using both means it\'s both meaningful and correct in syntax.

~~~java
// Detect requests with prefill before sending to new model
boolean endsWithAssistant = !messages.isEmpty()
        && "assistant".equals(messages.get(messages.size() - 1).role());
if (endsWithAssistant && !modelCaps.supportsPrefill(model))
    throw new IllegalStateException("Prefill not supported on " + model);
~~~

### Production pitfalls
- Examples containing real customer data without redaction: PII leaks in every request and in logs.
- Examples too similar: model "learns" coincidences not intended (e.g., always returning priority high).
- Removing prefill but not adding validation: still need to parse and check JSON on the server side (or use structured outputs).

> Senior tip: when removing prefill, rerun the format evals (parse rate, label accuracy) on the new model. In most cases, clear instructions combined with structured outputs match or beat the old results, and the code is even simpler.`,
    follow: ['Why do few-shot examples need to be diverse?', 'How do you get Claude to continue a cut-off sentence when prefill is gone?', 'When are few-shot examples no longer needed?']
  },
  'claude-032': {
    q: 'You need to have Claude analyze an 80-page contract and write a risk report. Do you do this in one big request or a chain of steps (prompt chaining)? How do you structure prompts with long documents for accuracy?',
    a: `**Summary:** With current models featuring adaptive thinking, many multi-step tasks run well in **one well-structured request**. **Prompt chaining** (a chain of separate API calls) is still valuable when you need to **verify, log, or branch on intermediate results**, or want to enforce a fixed pipeline, e.g., self-correction: write draft → review per criteria → edit. With long documents: put **documents at the start**, **questions/instructions at the end**, wrap each document with XML tags including metadata, and require **quotes first** before concluding.

### Structuring prompts for long documents (per docs)
- Place long data (20K+ tokens) **at the top**, before questions, instructions, and examples. Docs state that placing questions at the end can improve quality by up to **30%** in experiments, especially with multiple documents.
- Wrap each document in {{<document>}} with {{<source>}} and {{<document_content>}}.
- Require Claude to **extract relevant segments** into {{<quotes>}} first, then analyze based on those quotes: helps focus and verifiability.

~~~text
<documents>
  <document index="1">
    <source>supply_contract_2026.pdf</source>
    <document_content>...80 pages...</document_content>
  </document>
  <document index="2">
    <source>compliance_risk_checklist.md</source>
    <document_content>...</document_content>
  </document>
</documents>

Compare contract with checklist. First, extract verbatim relevant clauses regarding
penalties, compensation, contract termination into <quotes> (with clause numbers). Then, based ONLY
on those quotes, list risks in <risks>, each with severity and supporting clause.
~~~

### One request or a chain of requests?
| Criterion | One request | Chain of requests |
|---|---|---|
| Latency | Lower | Higher (multiple turns) |
| Control intermediate results | Hard | Easy: log, eval, branch at each step |
| Cost | Read docs once | Might read docs multiple times (mitigated by prompt caching) |
| Debug | Hard to know which step failed | Know exactly which step failed |
| Suitable for | Seamless analysis, moderate complexity | Pipeline with approval, tasks needing high reliability |

### Example self-correction chain
~~~java
String doc = loadContract();                                  // same in every step, set cache_control
String extract = claude.call(CACHED_DOC(doc), "Extract clauses regarding penalty/compilation/termination into <quotes>");
String draft   = claude.call(CACHED_DOC(doc), "Based on <quotes> below, write risk report: " + extract);
String review  = claude.call(NO_DOC, "Review report per checklist, list gaps in evidence: " + draft);
if (review.contains("<issues>"))                               // has issues, do one round of fixes
    draft = claude.call(CACHED_DOC(doc), "Fix report per issues: " + review + draft);
~~~
Each step is a separate call so you save intermediate output, run eval per step, and know which step caused the error.

### Long context doesn\'t mean "dump everything"
Current models have a 1M token context window, but docs warn about **context rot**: the more tokens, the lower the precision and memory ability. 80 pages (a few tens of thousands of tokens) can be sent directly; but 500 documents should be filtered/retrieved first, sending only relevant parts.

### Production pitfalls
- Putting questions at the start, then pasting documents after: model easily "forgets" detailed requirements.
- Not requiring evidence: report sounds plausible but contains hallucinated clauses. Always require clause numbers and verbatim quotes, then verify with code (are quotes actually in the original?).
- Chain of 6 steps each resending 80 pages without caching: costs 6x.

> Senior tip: for legal/financial docs, add a **code verification** step: every segment in {{<quotes>}} must be found (string matching) in the original document. This check is very cheap but blocks most "hallucinated quote" errors before the report reaches the user.`,
    follow: ['Why is putting questions at the end of the prompt better for long documents?', 'How does prompt caching help prompt chaining?', 'When should you use retrieval instead of putting the whole document into context?']
  },
  'claude-033': {
    q: 'Your coding agent runs hundreds of tool turns (read file, run test) and the context bloats near the limit. How do you manage context for long-running agents: compaction, context editing, memory tool—what is the difference?',
    a: `**Summary:** **Everything** in the request counts toward the context window: system prompt, all messages (including tool results, images), tool definitions, and output of the current turn (including thinking). Context gets longer, quality decreases (**context rot**), so you need to proactively "clean up". Three main tools: **compaction** (beta: replace old turns with a server-generated summary), **context editing** (beta: delete rules for old tool results or thinking blocks), and **memory tool** (Claude self-writes/reads file in {{/memories}}, keeping info across sessions).

### Why agent context bloats fast
Every time a 2,000-line file is read, tens of thousands of tokens remain in history **forever**, even after the agent has finished editing the file. After 100 turns, most context is old tool results with no remaining value, which is costly (every request resends everything) and makes it harder for the model to focus.

### Comparing the three tools
| | Compaction | Context editing | Memory tool |
|---|---|---|---|
| Action | Summarizes old turns into one block | Deletes old tool results (or thinking), replaces with placeholder | Claude self-writes/reads file in {{/memories}} |
| Decider | You call (on-demand) or API when threshold met | Rules you configure (trigger, keep) | Claude, via tool |
| Lost | Original details of old turns | Content of old tool results | None, but must be read back |
| Best for | Very long conversations/agents | Agents using many tools to read large data | Info needing to persist across sessions |
| Status | Beta | Beta ({{context-management-2025-06-27}}) | Client-side tool ({{memory_20250818}}) |

### Context editing: clearing old tool results
~~~json
{
  "context_management": {
    "edits": [{
      "type": "clear_tool_uses_20250919",
      "trigger": { "type": "input_tokens", "value": 30000 },
      "keep": { "type": "tool_uses", "value": 3 },
      "clear_at_least": { "type": "input_tokens", "value": 5000 },
      "exclude_tools": ["web_search"]
    }]
  }
}
~~~
- When input exceeds 30K tokens, API clears **oldest** tool results first, keeps 3 most recent calls.
- Deletion happens **server-side** before reaching the model; client keeps full history, no need for sync.
- Every deletion breaks **cache** for the prefix part; {{clear_at_least}} ensures each deletion is large enough to justify re-caching cost.

### Memory tool: the agent\'s "notebook"
Add {{"type": "memory_20250818", "name": "memory"}} to tools. Claude will check the memory folder before working and record learnings. This is a **client-side** tool: you run the read/write commands on your own storage, and **must block path traversal** (every path must be in {{/memories}}).

### Real-world sample for multi-session agents (per docs)
- Store state with structure (e.g., {{tests.json}}) and progress notes as text ({{progress.txt}}); use git as checkpoint.
- When starting new context, you can **start over from scratch** instead of compaction: the new model reads progress.txt, tests.json, and git log very well.

~~~java
// Layer the layers: automatic context editing + your own thresholds to proactively compact
if (lastUsage.inputTokens() > 600_000) {
    history = compactor.compact(history);       // call compaction, put summary block at the start of messages
}
request.contextManagement(ClearToolUses.trigger(30_000).keep(3).clearAtLeast(5_000));
~~~

### When context overflows
- Input already exceeded context window: 400 error "prompt is too long".
- From 4.5 models onwards, if input + max_tokens exceeds but input still fits, API accepts and may stop with {{stop_reason: "model_context_window_exceeded"}}. Use token counting API to estimate beforehand.

### Production pitfalls
- Compaction loses key info (file paths, design decisions): write custom summary prompts, or store that info in memory/state files.
- Modifying history on the client side (deleting blocks) on a model with preserved thinking might invalidate thinking blocks in later turns; prefer server-side mechanisms.
- Prompt caching saves **money** on the prefix but **doesn\'t** stop that part from occupying context.

> Senior tip: design tools to return **compact results from the start** (read files by line range, grep returns first 20 results plus total count) is more effective than any cleanup mechanism later on. Clean context is a tool design problem first, then a cleanup problem.`,
    follow: ['Why does deleting old tool results break prompt cache?', 'When should you start a new context instead of compaction?', 'How do you block path traversal in the memory tool?']
  }
});

