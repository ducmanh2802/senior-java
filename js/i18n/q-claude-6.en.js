/*
 * English translation of js/data/q-claude.js — task T399. Format: js/core/i18n.js (content overlay).
 * ids: claude-042
 */
App.i18n.content({
  'claude-042': {
    q: 'Production incident: a Claude-powered agent has started looping almost indefinitely and calling the wrong tool (calling cancel_order instead of get_order). API costs increased 10-fold in one hour. How would you handle the incident and identify the root cause?',
    a: `**Summary:** Handle it like any other incident: **stop the bleeding first** (cap steps/costs, disable dangerous write tools via a feature flag, and potentially switch to a fallback flow), then **investigate using data**: retrieve transcripts of the failing sessions, examine the sequence of tool_use/tool_result to find where the behavior started to diverge, and correlate it with the **most recent changes** (prompt, tool definitions, model, backend API). Common causes include ambiguous tool errors that make the model retry endlessly, changed or overlapping tool descriptions, malformed history, or malicious content in the data.

### The first hour: containment
1. Enable hard limits: a low MAX_STEPS, a per-session token budget, and a per-user rate limit.
2. **Remove dangerous write tools** ({{cancel_order}}) from the tools list via a feature flag, or switch them to approval-required mode. Removing a tool from the request is the surest way to prevent the model from calling it.
3. Assess the impact: check whether any orders were actually cancelled, restore them, and contact the customers.
4. If the cause is still unclear, roll back the prompt/config to the previous version.

### Investigation: read the transcripts
Trace each session as a sequence: turn, tool call, input, tool result, stop_reason, and tokens.
~~~text
step 1  tool_use get_order {"order_id":"ORD-100200"}
        tool_result is_error: "failed"
step 2  tool_use get_order {"order_id":"ORD-100200"}      <- exact repetition
        tool_result is_error: "failed"
step 3  tool_use cancel_order {"order_id":"ORD-100200"}   <- "try another approach"
...
step 41 tool_use get_order ...
~~~
Questions to answer: at which step did the behavior start to diverge? What did the immediately preceding tool result say? What do the failing sessions have in common (model, prompt version, order type, timing)?

### Common causes and fixes
| Symptom | Root cause | Fix |
|---|---|---|
| The same call is repeated | The tool returns a generic error ("failed"), and the model does not know what else to do | Return actionable errors: the cause + what to do next; detect duplicate calls in code |
| The wrong tool with a similar name is called | Tool descriptions were just changed, two tools overlap, or many new tools were added | Rewrite descriptions with clear boundaries, use namespaced tool names, and reduce the number of tools |
| Looping starts after a wrapper change | Malformed history: a missing assistant message, tool_result split across multiple messages, or a missing block | Compare the raw request against the canonical format |
| Looping starts after many long turns | Old tool results were cleaned up or summarized, so the model "forgets" what it has done | Store critical state outside the context (file/state) and tune keep |
| It only happens for certain customers | The data contains instructions (injection) | Treat data as untrusted, sanitize it, and apply least privilege |
| It starts right at deployment | The model/effort/prompt changed | Roll back and run a comparative eval before redeploying |

### Prevention: turn lessons into safeguards
~~~java
// 1. Detect loops: on the second identical tool + input, return an actionable error; on the third, stop the session
String key = call.name() + ":" + canonicalJson(call.input());
int n = seen.merge(key, 1, Integer::sum);
if (n == 2) return Block.toolError(call.id(), "This call just failed with the same arguments. Do not retry; tell the user.");
if (n >= 3) throw new LoopDetectedException(key);
// 2. Dangerous tools always go through an approval gate, independent of the prompt
if (policy.isDestructive(call.name())) return approvalGate.request(call);
~~~
- Alert on hourly cost, p95 step count, the percentage of sessions hitting MAX_STEPS, and the per-tool is_error rate.
- Every prompt/tool/model change must go through an eval with cases for "repeated tool failures" and "easily confused tool names".
- Add the incident transcripts to the golden set.

### Postmortem
Write a blameless postmortem covering the timeline, impact (number of cancelled orders, cost), root cause, why the safeguards failed to catch it (no step limit? cancel_order did not require approval?), and preventative actions with owners.

> Senior tip: in most agent incidents, "the model got dumb" is rarely the root cause. Always check in this order: **what changed in tool results → what changed in tool definitions → what changed in the prompt → model/effort**. This order often reveals the cause in minutes rather than hours.`,
    follow: [
      'Why is removing a tool from the request safer than instructing the model not to call it?',
      'How would you design cost alerts for an agent?',
      'How can context cleanup cause a loop?'
    ]
  }
});
