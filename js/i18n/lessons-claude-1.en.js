/*
 * English translation of js/data/lessons-claude.js — task T478. Format: js/core/i18n.js (content overlay).
 * ids: lesson-claude-001
 */
App.i18n.content({
  'lesson-claude-001': {
    title: 'Agent loops with tool use: tool_use, tool_result, stop_reason and a step limit',
    goals: [
      'Describe a complete tool-use loop: declare {{tools}}, receive {{tool_use}}, run the tool, send back {{tool_result}} and call the model again',
      'Handle every {{stop_reason}} value correctly: {{end_turn}}, {{tool_use}}, {{max_tokens}}, {{stop_sequence}}, {{pause_turn}}, {{refusal}}',
      'Write a safe loop: cap the number of steps, and when a tool fails return {{is_error}} to the model instead of crashing the request',
    ],
    body: `### Why you need a "loop"
A model cannot run your code. It only produces text. When you declare a list of **tools** to Claude (for example "look up the weather", "query an order"), the model can answer with a request such as "call the tool {{get_weather}} with this input". **Your Java backend** runs the tool, then sends the result back in a new request. The model reads the result and either replies to the user or asks to call another tool. Repeat until the model says "done". That is the **agent loop**.

The key thing to remember: the Messages API is **stateless**. The server remembers nothing between two requests, so on every call you must send the **entire conversation** from the beginning: the user message, the assistant message (verbatim, including the {{tool_use}} block), the message that carries {{tool_result}}… If you forget to append the assistant message to the history, the model sees a {{tool_result}} that "fell from the sky" and the API returns a 400.

### Step 1: declare tools in the request
Each tool has a {{name}}, a {{description}} (write it carefully: the model relies on it to decide whether to call the tool) and an {{input_schema}}, which is a JSON Schema describing the input.

~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "tools": [{
    "name": "get_weather",
    "description": "Get the current weather of a city. Use it when the user asks about the weather.",
    "input_schema": {
      "type": "object",
      "properties": { "city": { "type": "string", "description": "City name, for example Hanoi" } },
      "required": ["city"]
    }
  }],
  "messages": [{ "role": "user", "content": "Is it hot in Hanoi today?" }]
}
~~~

### Step 2: the model returns a tool_use block
The response has {{stop_reason}} equal to {{"tool_use"}} and its {{content}} contains one (or several) {{tool_use}} blocks with {{id}}, {{name}} and {{input}}. There may be a {{text}} block in front of it (the model "thinking out loud").

~~~json
{
  "role": "assistant",
  "stop_reason": "tool_use",
  "content": [
    { "type": "text", "text": "Let me check the weather in Hanoi." },
    { "type": "tool_use", "id": "toolu_01A", "name": "get_weather", "input": { "city": "Hanoi" } }
  ]
}
~~~

### Step 3: run the tool, send tool_result with the exact tool_use_id
You append the **verbatim** assistant message above to the history, then add a message with **role user** that contains a {{tool_result}} block. The {{tool_use_id}} field must match the {{id}} of the corresponding {{tool_use}} block: that is how the model knows which result belongs to which call.

~~~json
{
  "role": "user",
  "content": [
    { "type": "tool_result", "tool_use_id": "toolu_01A", "content": "32°C, sunny, 70% humidity" }
  ]
}
~~~

Rules that are often broken:
- The message containing {{tool_result}} must come **immediately after** the assistant message that contains the {{tool_use}}, and the {{tool_result}} blocks must come **before** any text block in that content.
- **Every** {{tool_use}} must have exactly one {{tool_result}}. When the model calls several tools in one turn (parallel tool use), you send **all** results in **one** user message, not split into several messages.
- Tool failure: still send a {{tool_result}}, but set {{"is_error": true}} and describe the error in {{content}}. The model can read the error and usually corrects itself (changes the input, tries another tool, or apologises to the user). Do not throw an exception that kills the whole request: the user would lose all the work done so far.

### Step 4: loop according to stop_reason

| stop_reason | Meaning | What the backend should do |
|---|---|---|
| {{end_turn}} | The model finished its answer naturally | Return the result to the user and exit the loop |
| {{tool_use}} | The model wants to call a tool | Run the tool, send the {{tool_result}}, call again |
| {{max_tokens}} | The request's {{max_tokens}} limit was reached | The answer was **truncated**: raise {{max_tokens}} or ask for a continuation; do not treat it as finished |
| {{stop_sequence}} | One of the sequences in your own {{stop_sequences}} was hit | Apply your own logic (the {{stop_sequence}} field tells you which sequence) |
| {{pause_turn}} | A long turn was paused (common with server tools such as web search) | Send the conversation back together with that assistant message so the model can continue |
| {{refusal}} | The model refused for safety reasons | Do not retry the same request; tell the user or redirect |

> Common trap: only checking "is there a tool_use block" and skipping {{max_tokens}}. If {{max_tokens}} is too small, the {{tool_use}} block can be cut in the middle and the input is incomplete. Always branch on {{stop_reason}}.

### A step limit: why it is mandatory
The model can fall into a loop: calling the same tool with the same input forever, or the tool keeps failing and the model keeps retrying. Every round is a billed request plus extra tokens (because the history keeps growing). An agent with no step cap can burn hundreds of thousands of tokens on a single question. That is why the loop always has a {{maxSteps}} (usually 5–20 depending on the task), and when it hits the cap it stops with an explicit state ("max_steps") so the UI can show "could not complete" instead of hanging.

~~~java
// Loop skeleton (pseudo-code, using self-defined types instead of a specific SDK)
List<Message> history = new ArrayList<>(List.of(userMessage(prompt)));
for (int step = 1; step <= maxSteps; step++) {
    Reply reply = client.send(history);              // send the WHOLE history (the API is stateless)
    history.add(assistantMessage(reply.content()));  // append verbatim, including tool_use
    if (!reply.stopReason().equals("tool_use")) return finish(reply);  // end_turn, max_tokens, refusal...
    List<Block> results = new ArrayList<>();
    for (Block call : toolUses(reply))               // there may be several parallel tool_use blocks
        results.add(runSafely(call));                // exception → tool_result with is_error = true
    history.add(userMessage(results));               // all results in ONE user message
}
return stoppedAt(maxSteps);                          // never loop forever
~~~

### Production pitfalls
- **Slow tools**: set a timeout per tool (for example 10 seconds); when it expires, return {{is_error}} "timeout" instead of letting the user's HTTP request hang.
- **Tools with side effects** (transferring money, sending email): the model may call the same tool again when it sees an error. Use an idempotency key, and for dangerous actions require user confirmation before running.
- **Tool results that are too large** (returning a 5,000-row table) bloat the context and raise the cost of every round. Trim them, paginate them, or summarise them before sending.
- **Do not trust the model's input**: validate the input against the schema and against the current user's permissions before running the tool, because malicious content in a document can steer the model into calling the wrong tool (prompt injection).

### Interview notes
Interviewers often ask: "The API is stateless, so how does the agent remember the context?" (the client sends the whole history again), "If the model calls three tools in parallel, how do you send the results?" (one user message, three {{tool_result}} blocks, matching the {{tool_use_id}}), "What if a tool throws an exception?" ({{is_error}}), and "How do you stop an agent from running forever?" (step cap, timeout, token budget). The exercise below makes you write this loop yourself against a fake model.`,
    exercises: [
      {
        title: 'Write AgentLoop: call tools, wire up tool_result, stop at the right time',
        prompt: `The types {{Block}}, {{Message}}, {{ModelReply}}, {{FakeModel}} and {{AgentResult}} simulate the Messages API (no need to change them). Write {{AgentLoop.run(userPrompt, model, tools, maxSteps)}}:

1. The conversation starts with one {{user}} message containing one text block, which is {{userPrompt}}.
2. Each **step**: call {{model.next(conversation)}} (pass a **copy** of the list), increment the step count, then append {{reply.content()}} verbatim to the conversation as an {{assistant}} message.
3. If {{stopReason}} is {{"tool_use"}}: for **each** {{tool_use}} block in order, run the tool from the map {{tools}} by {{name}} with {{input}}; create {{Block.toolResult(id, result, false)}}. Tool does not exist → {{is_error = true}}, content {{"Unknown tool: " + name}}. Tool throws {{RuntimeException}} → {{is_error = true}}, content contains the exception message. Send **all** results in **one** {{user}} message, then continue looping.
4. If {{stopReason}} is {{"pause_turn"}}: add nothing, call the model again.
5. Any other {{stopReason}} ({{end_turn}}, {{max_tokens}}, {{refusal}}…): return {{AgentResult(text, steps, stopReason)}} where {{text}} is the concatenation of the text blocks of the last reply.
6. If the model has been called {{maxSteps}} times without finishing → return {{AgentResult(text of the last reply, maxSteps, "max_steps")}}.`,
        hints: [
          'Keep a {{List<Message>}} as the history. On each step: call the model with a copy, increment {{steps}}, then always append the reply to the history under the {{assistant}} role before looking at {{stopReason}}.',
          'Use a {{switch}} on {{stopReason}}: the {{tool_use}} branch collects every {{tool_result}} into one list and then adds exactly one {{user}} message; the {{pause_turn}} branch does nothing; the default branch returns.',
          'Wrap {{tool.apply(...)}} in {{try/catch (RuntimeException e)}} and return {{Block.toolResult(id, "Error: " + e.getMessage(), true)}}.',
        ],
        explain: `The three most common mistakes:
- **Forgetting to append the assistant message** before adding the {{tool_result}}. With the real API this is a 400 error, because the {{tool_result}} has no matching {{tool_use}} right before it.
- **Sending each tool_result in a separate message** when the model calls tools in parallel. The API requires the results to sit together in the next user message; splitting them into two consecutive user messages is a structural error, and it also "teaches" the model to stop calling tools in parallel.
- **Letting the tool's exception escape**. A transient tool failure (a DB timeout) should not destroy the whole agent session. Return {{is_error = true}} with a clear message so the model can decide for itself: retry, change approach, or tell the user.

Why {{max_tokens}} must not be treated as {{end_turn}}: the answer has already been truncated, and may stop in the middle of a sentence or in the middle of a JSON object. Return a distinct {{stopReason}} so the layer above can decide (raise {{max_tokens}}, or show "the answer is incomplete").`,
      },
    ],
    check: [
      {
        q: 'The model returns 2 {{tool_use}} blocks in the same response (parallel tool use). How do you send the results?',
        options: [
          'Two separate requests, each carrying one {{tool_result}}',
          'One {{assistant}} message containing two {{tool_result}} blocks',
          'One {{user}} message containing two {{tool_result}} blocks, each with a {{tool_use_id}} matching the corresponding {{id}}',
          'Only send the result of the first tool; the model will call the second tool again by itself',
        ],
        answer: 2,
        explain: `All {{tool_result}} blocks of one turn sit in **one** message with role {{user}} immediately after the assistant message, matched by {{tool_use_id}}. Sending two separate requests makes the history structurally wrong and doubles the cost; {{tool_result}} never lives in an assistant message (that part is supplied by the client); leaving one result out makes the API fail, because every {{tool_use}} must have a matching {{tool_result}}.`,
      },
      {
        q: 'The response has {{stop_reason}} equal to {{max_tokens}}. What does that mean?',
        options: [
          'The conversation has exceeded the model context window',
          'The output was truncated because it hit the {{max_tokens}} limit set in the request; the answer is incomplete',
          'The model has finished answering, exactly like {{end_turn}}',
          'You have exceeded the rate limit of tokens per minute',
        ],
        answer: 1,
        explain: `{{max_tokens}} is the ceiling on **output** tokens that you allow; when the ceiling is hit the model stops mid-way. It is different from {{end_turn}} (a natural stop). Exceeding the context window with the input makes the request fail with a 400 error, not with this stop_reason. Exceeding the rate limit gives you an HTTP 429, with no successful response at all.`,
      },
      {
        q: 'A tool in your agent throws an exception (for example a timeout when calling the DB). What is the best way to handle it?',
        options: [
          'Throw the exception up to the controller and return HTTP 500 to the user',
          'Skip that call and send nothing to the model',
          'Automatically retry the tool forever until it succeeds',
          'Send a {{tool_result}} with {{is_error: true}} and a description of the error so the model decides the next step itself',
        ],
        answer: 3,
        explain: `{{is_error}} tells the model that the tool failed and why; the model can retry with different input, use another tool, or explain the situation to the user. Returning 500 throws away the whole session's work. Sending no result makes the next request fail because the {{tool_use}} is missing its {{tool_result}}. Retrying forever can hang the request and burn cost.`,
      },
    ],
  },
});
