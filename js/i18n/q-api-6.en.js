/*
 * English translation of js/data/q-api.js — task T482. Format: js/core/i18n.js (content overlay).
 * ids: api-027 api-028 api-029 api-030
 */
App.i18n.content({
  'api-027': {
    q: 'The client sends Accept: application/json, Accept-Language: vi/en, Accept-Encoding: gzip. How does the server handle "content negotiation" in Spring? When does it return 406 Not Acceptable, and why is the Vary header mandatory once a cache is in front?',
    a: `**Summary:** Content negotiation is the server picking the **representation** that suits the client: Spring matches {{Accept}} against the list of {{HttpMessageConverter}} beans and chooses the best-matching media type (weighted by q) — no match means **406**; {{Accept-Language}} selects the message language via {{MessageSource}}; {{Accept-Encoding}} decides whether the body is compressed (gzip), and when it is, {{Vary: Accept-Encoding}} is **mandatory** so caches never mix a compressed copy with a plain one.

### Quick intuition
Like a restaurant asking up front: "vegetarian or not, English or Vietnamese, printed menu or digital?" — depending on the answer, it serves the right dish, in the right language, in the right format. **Accept** says which format you want, **Accept-Language** which language, **Accept-Encoding** says "I understand this kind of compression". If the kitchen cannot make the requested dish it must say so outright (**406**) instead of silently serving something else.

### Terms
- **Representation**: one concrete form of a resource (JSON, CSV, HTML) chosen by client headers.
- **Media type**: the body format, e.g. {{application/json}}, {{text/csv}}, {{application/problem+json}} for RFC 9457 errors.
- **q (quality value)**: a preference weight inside Accept, e.g. {{application/json;q=0.9, */*;q=0.8}} — higher q is picked first.
- **HttpMessageConverter**: Spring's class that reads/writes bodies per media type (Jackson for JSON, Jackson XML for {{application/xml}} if {{jackson-dataformat-xml}} is on the classpath…).
- **406 Not Acceptable**: no converter matches the Accept header.
- **MessageSource**: Spring's multi-language message table, read via {{LocaleContextHolder.getLocale()}}.
- **Vary**: a header saying "the cache key also depends on these headers".
- **Content-Encoding**: the compression actually applied to the body ({{gzip}}, {{br}}).

### How it works, step by step
1. The client sends {{Accept: application/problem+json, application/json;q=0.5, */*;q=0.1}}. Why the weights matter: when the client wants plain JSON for data but **errors** must be problem+json, the weights make the server choose correctly.
2. Spring compares against the registered converters and picks the match with the highest q. {{*/*}} matches everything, so the first converter wins (usually JSON).
3. No converter matches → **406**. No Accept header at all (treated as {{*/*}}) → the default representation is used.
4. {{Accept-Language: en}} → load {{messages_en.properties}}; a missing language falls back to the default locale.
5. {{Accept-Encoding: gzip}} → the compression layer (embedded Tomcat when {{server.compression.enabled}} is on, or nginx) compresses the body, adds {{Content-Encoding: gzip}} and **{{Vary: Accept-Encoding}}**.

~~~text
Accept: application/json            ─┐
Accept-Language: en                 ─┼─► Spring picks converter + locale + compression ─► response
Accept-Encoding: gzip, deflate      ─┘         │
                                       no Accept match → 406 Not Acceptable
~~~

### Spring configuration
~~~java
@GetMapping(value = "/api/reports/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
ReportDto report(@PathVariable long id) { ... }   // forces JSON, independent of Accept

@GetMapping(value = "/api/transactions.csv", produces = "text/csv")
ResponseEntity<String> csv() { ... }              // returns CSV to clients asking for text/csv
~~~

~~~yaml
spring:
  messages:
    basename: messages          # messages_vi.properties, messages_en.properties
    encoding: UTF-8             # avoids broken Vietnamese accents when translating error messages
~~~

~~~java
// Read the error message in the client's language; keep the type field (machine-readable error code) unchanged
String detail = messageSource.getMessage(
        "error.insufficient-funds", null, LocaleContextHolder.getLocale());
~~~

### Header → what the server does
| Header | What the server does | Configuration / common failure |
|---|---|---|
| {{Accept}} | Pick the converter, {{produces}} | Missing converter → 406; a {{@RestController}} returning {{String}} yields {{text/plain}} — wrap it in a DTO if clients need JSON |
| {{Accept-Language}} | Pick the message bundle | Missing {{Vary: Accept-Language}} behind a cache → one user sees the other user's language |
| {{Accept-Encoding}} | gzip/br compression | Compression enabled on both the app and nginx → hard to tell which layer compressed, and proxies that ignore {{Content-Encoding}} may compress twice; missing {{Vary: Accept-Encoding}} → the cache serves gzip to a client that cannot decode it |
| {{Accept-Charset}} | Mostly ignored | Spring Boot 3 defaults to UTF-8; do not force ISO-8859-1 |

### Common pitfalls
- **406 because the client sent an exotic Accept** ({{application/xml}} with no registered converter): the symptom is the client reporting "no data". Avoid it by agreeing on JSON for all clients, registering the extra converter, or returning an explicit 406 listing the supported types.
- **Overlapping compression configuration**: with compression enabled on both the app and nginx, it is very hard to tell which layer compressed the body; a hand-written proxy (or a CDN that ignores {{Content-Encoding}}) may compress it again → wasted CPU and occasionally a corrupt body. Compress in **one place** (usually the proxy) and leave compression off in the app ({{server.compression.enabled}} defaults to false).
- **Missing {{Vary}}**: a cache keyed only by URL stores the gzip and plain copies, the vi and en copies, under the same key → random, very hard-to-debug bugs. With compression or multiple languages, {{Vary}} is not optional.
- **Returning a bare {{String}} from the controller**: a client expecting JSON receives {{text/plain}}. Return an object or set {{produces}}.

### One-minute spoken answer
"Content negotiation has three axes. Format: Spring matches {{Accept}} against the list of {{HttpMessageConverter}} beans, picks by q weight, and returns 406 when nothing matches — which is why I always declare {{produces}} explicitly per endpoint. Language: {{Accept-Language}} picks the bundle in the {{MessageSource}}; I use it for error messages but keep {{type}} machine-readable. Compression: {{Accept-Encoding}} allows gzip, and this is the most common mistake — you must send {{Vary: Accept-Encoding}}, otherwise the cache mixes compressed and plain bodies, just as a missing {{Vary: Accept-Language}} makes users see the wrong language. I enable compression at exactly one layer, usually the proxy, to avoid double compression."

> Senior tip: default to one consistent JSON contract and only add CSV/PDF for endpoints that truly need them — every extra representation is an extra test path. When a cache/CDN is enabled, I always verify both {{Vary}} headers ({{Accept-Encoding}}, {{Accept-Language}}) on real responses with curl before handover: a cache serving the wrong variant is the kind of bug that only appears in environments with real traffic and never on a dev machine.`,
    follow: [
      'How can the client find out which formats the server supports instead of guessing until it hits a 406?',
      'Should compression live in Spring or in nginx? What are the selection criteria?',
      'How do you design multi-language error messages so that clients can still classify errors programmatically?'
    ]
  },
  'api-028': {
    q: 'Customers want to update part of their profile: some only change the phone number, others move house and change email at the same time. Compare JSON Merge Patch (RFC 7396) and JSON Patch (RFC 6902) for a REST API: syntax, idempotency, how Spring/Jackson accept and apply them, and when to choose which?',
    a: `**Summary:** **JSON Merge Patch** is a single object listing the parts to change, where a {{null}} field means delete — concise, applied like a merge, usually idempotent; **JSON Patch** is an ordered array of operations ({{add}}, {{remove}}, {{replace}}, {{move}}, {{copy}}, {{test}}) using **JSON Pointer** — more powerful (insert into arrays, conditional checks before writing) but easy to get wrong when operations stack on stale state. Each format has its own media type: {{application/merge-patch+json}} and {{application/json-patch+json}}; with the wrong Content-Type, Spring returns **415**.

### Quick intuition
**Merge Patch** is like a sticky note saying "new phone: 0912…" — you write only what you want changed and everything else stays. **JSON Patch** is like an amendment record for a contract: each line has a number and an action ("clause 3: replace", "clause 5: delete", "clause 7: append to tags"), plus a condition "only patch if the current copy is revision 7". Anyone can write a sticky note; an amendment must follow the rules — so it is more precise but easier to break when written by hand.

### Terms
- **PATCH (RFC 5789)**: a method that updates **part** of a resource, unlike PUT (full replacement).
- **Delta**: the difference between the old and new state, containing only the changes.
- **JSON Pointer (RFC 6901)**: a string pointing at a location inside JSON, e.g. {{/addresses/1/city}}; {{/tags/-}} means "the end of the tags array".
- **Media type**: the format declared in {{Content-Type}}; the server uses it to pick a body reader.
- **Idempotency**: applying the same input yields the same result; crucial when clients retry.
- **415 Unsupported Media Type**: the {{Content-Type}} is not valid for that endpoint.
- **If-Match / 412**: a precondition that lets the server reject overwriting when someone else has changed the data (lost update).

### Syntax side by side
~~~json
{ "phone": "0912345678", "email": null, "city": "Ha Noi" }
~~~
The Merge Patch above: change phone, **delete** email (null means delete, not "set to null"), keep every other field.

~~~json
[
  { "op": "replace", "path": "/phone", "value": "0912345678" },
  { "op": "remove",  "path": "/email" },
  { "op": "add",     "path": "/tags/-", "value": "priority" },
  { "op": "test",    "path": "/version", "value": 7 }
]
~~~
The JSON Patch above: same result, but it can append to an array and carries a {{test}} — "apply only if version equals 7"; on mismatch the **whole patch** is rejected (RFC 6902 requires atomic application) and the server returns **409 Conflict**, as RFC 5789 suggests for conflicting state.

### Comparison table
| Criterion | JSON Merge Patch | JSON Patch |
|---|---|---|
| Syntax | Delta object | Ordered operation array |
| Media type | {{application/merge-patch+json}} | {{application/json-patch+json}} |
| Delete a field | Set it to {{null}} | {{op: remove}} |
| Insert/appending in arrays | Not possible | {{path: /tags/-}} |
| Conditional check | No | {{op: test}} |
| Idempotent | Yes | Almost, except {{add}} at {{/-}} (re-applying appends again) |
| Easy for clients | Very easy | Requires understanding JSON Pointer |
| Use when | Changing a few common fields (90% of cases) | Structural operations needing atomicity/conditions |

### Spring: accept the body and apply the delta
~~~java
@PatchMapping(value = "/api/profiles/{id}", consumes = "application/merge-patch+json")
ResponseEntity<ProfileDto> patch(@PathVariable long id, @RequestBody JsonNode patch,   // om: ObjectMapper injected via constructor
        @RequestHeader(value = "If-Match", required = false) String ifMatch) {
    Profile cur = repo.find(id);                        // 1. always read the LATEST state on the server
    if (ifMatch != null && !ifMatch.equals(etagOf(cur)))
        return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).build();  // 412
    JsonNode next = merge(om.valueToTree(cur), patch);   // 2. apply the delta per RFC 7396
    Profile saved = repo.save(om.treeToValue(next, Profile.class));            // 3. validate, then persist
    return ResponseEntity.ok(dto(saved));
}
~~~

~~~java
// All of RFC 7396: null = delete, object = recursive merge, any other value = replace the value
static JsonNode merge(JsonNode base, JsonNode patch) {
    if (!patch.isObject()) return patch;                 // scalar/array/null: replace the whole value
    ObjectNode out = base != null && base.isObject()
            ? ((ObjectNode) base).deepCopy()             // merge into the old copy
            : JsonNodeFactory.instance.objectNode();     // base is not an object → treat it as {}
    Iterator<Map.Entry<String, JsonNode>> it = patch.fields();
    while (it.hasNext()) {
        Map.Entry<String, JsonNode> e = it.next();
        if (e.getValue().isNull()) out.remove(e.getKey());                        // null → delete
        else out.set(e.getKey(), merge(out.get(e.getKey()), e.getValue()));       // recursive merge
    }
    return out;
}
~~~
For JSON Patch, Jackson (jackson-core) only offers {{JsonPointer}} and {{JsonNode.at(...)}} to resolve paths — {{jackson-databind}} ships **no** class that applies a patch. Accepting {{application/json-patch+json}} requires an extra library such as {{com.github.java-json-tools:json-patch}} (API {{JsonPatch.fromJson(node).apply(target)}}) or {{com.flipkart.zjsonpatch:zjsonpatch}}; a bad path or a failing {{test}} throws {{JsonPatchException}} → return 400 (malformed patch), 422 (patch cannot be applied to the document) or 409 (test/state conflict) with details.

### Common pitfalls
- **Wrong Content-Type** ({{application/json}} instead of {{application/merge-patch+json}}) → 415. That is a client-side error, but it must be documented clearly and answered with a readable ProblemDetail.
- **PATCH computed from stale client state**: the client composes the patch after keeping a form open for 5 minutes, someone else edits meanwhile → their changes are overwritten. Avoid it with {{If-Match}} + ETag; a 412 tells the client to reload.
- **Using PUT with a partial body**: PUT means "replace the whole resource", so omitted fields are lost. That is why partial-edit forms should use PATCH.
- **A failing JSON Patch {{test}}**: return **409 Conflict** (RFC 5789), not 400 — the syntax is fine, only the current state does not match. Reserve **412** for the conditional {{If-Match}} header.
- **Networks/WAFs blocking PATCH**: some proxies, WAFs or gateways reject {{PATCH}} by default (405). Check the outer layers before blaming the code.

### One-minute spoken answer
"PATCH is a partial update, and I split the two formats by how complex the client is. Merge Patch is one object listing what to change, null means delete, everything else stays — idempotent and easy to generate, so it is my default for profile-edit forms. JSON Patch is an array of operations with JSON Pointer, stronger for array insertion and conditional {{test}}, but the client must understand the structure and re-applying is not idempotent, so I use it only when structural operations are needed. The most important point is not the format but reading the latest server state before applying the delta, plus If-Match so a changed record yields 412 — otherwise, however precise the patch, you still lose other people's changes."

> Senior tip: pick **one** format for the whole system (almost always Merge Patch) and document it in OpenAPI — running both means every SDK, every test and every docs page is duplicated. Always send {{If-Match}} with PATCH on data that many people edit: I have seen customer tickets about "someone else overwrote my address" right when hundreds of users update their limits during peak hours.`,
    follow: [
      'Merge Patch uses null to delete a field — so how does a client explicitly set a field to null when that is the intent?',
      'Does JSON Patch guarantee atomicity (the whole operation array or nothing)?',
      'Should PATCH return 200 with the new body or 204? Why?'
    ]
  },
  'api-029': {
    q: 'The "Latest transactions" screen must refresh the moment a customer completes a transfer. Compare polling (with conditional requests), SSE and WebSocket for a REST API: latency, connection cost, operation behind a load balancer with many instances, and mobile behaviour — when do you choose which?',
    a: `**Summary:** **Polling** is the client asking again on a schedule — simplest, latency equals the poll interval, costs requests; **SSE** is the client opening one HTTP request that the server keeps open and pushes events over {{text/event-stream}} — one-way, reconnects automatically, passes through old proxies/load balancers; **WebSocket** is a two-way connection established after the {{Upgrade: websocket}} handshake — needs connection state and pub-sub across instances. Start with polling + ETag, add SSE when latency must be under roughly one second, and use WebSocket only when the client genuinely must **send** real-time data.

### Quick intuition
**Polling** is asking your mum "is dinner ready?" every minute: you will find out, but it wastes effort and you must wait for the next question. **SSE** is mum ringing a bell when dinner is ready: you just stand there, no need to ask. **WebSocket** is a phone call: you can talk and listen, but you must keep the line open, and switching networks drops the call.

### Terms
- **Polling**: repeating a request on a schedule; a **conditional poll** sends {{If-None-Match}} so the server answers with a lightweight 304 instead of the full body.
- **SSE (Server-Sent Events)**: an HTTP/HTML standard for server-pushed one-way events; browsers provide the {{EventSource}} API, which listens and reconnects on its own.
- **text/event-stream**: the SSE body format — {{event:}}, {{data:}}, {{id:}} lines separated by blank lines.
- **Last-Event-ID**: a header the browser sends automatically on reconnect to ask for events after the break.
- **WebSocket**: a separate protocol, usually over ports 80/443, starting with an {{Upgrade: websocket}} HTTP request and then exchanging two-way **frames**.
- **Sticky session**: the load balancer pins a client to one instance (by cookie/IP) so long-lived connections are not bounced to another machine.
- **Pub/Sub (Redis)**: a "shared broadcast channel" between instances — whichever instance produces an event publishes to the channel, and the instance holding the client connection receives it and pushes it down. Redis here is a separate key-value server used as a fast message bus between services.
- **Heartbeat**: bytes sent periodically so intermediaries do not cut an idle connection.

### Mechanism and cost
~~~text
polling : client ──GET──► server   every 5 seconds    avg latency ~2.5 seconds, 12 requests/min/user
SSE     : client ──GET──► server KEEP-OPEN ◄────── server pushes:
                                                   event: transaction
                                                   id: 918273
                                                   data: {"id":918273,"amount":500000}

                                                   (blank line = end of one event)
WebSocket: client ══HTTP Upgrade: websocket══► after handshake: two-way, with ping/pong
~~~

### Comparison table
| Criterion | Polling + ETag | SSE | WebSocket |
|---|---|---|---|
| Latency | Equal to the interval (1–30 s) | Nearly instant | Instant |
| Number of connections | Many repeated requests | One open connection per client | One connection per client |
| Through old proxies/CDNs | Very good | Good if the proxy disables buffering | Requires proxy support for Upgrade |
| Many instances | Stateless | Needs sticky sessions or pub-sub | Needs sticky sessions or pub-sub |
| Two-way | No | No (the client still calls APIs normally) | Yes |
| Auto reconnect | Not needed (just poll again) | {{EventSource}} handles it, with {{Last-Event-ID}} | Write it yourself (re-handshake when dropped) |
| Complexity | Very low | Low | Highest (connections, frames, heartbeats, ordering) |

### SSE in Spring Boot
~~~java
private final Map<Long, SseEmitter> clients = new ConcurrentHashMap<>();

@GetMapping(value = "/api/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
SseEmitter stream() throws IOException {
    SseEmitter em = new SseEmitter(30 * 60 * 1000L);  // 30-minute timeout: larger than the default async timeout,
                                                      // prevents "orphaned" connections (client died without closing)
    clients.put(userId(), em);                   // keyed by user so events reach the right person
    em.onCompletion(() -> clients.remove(userId()));
    em.onError(e -> clients.remove(userId()));
    em.send(SseEmitter.event().id("" + lastSeq).name("connected").data("ok")); // send early so headers and first bytes reach the client immediately
    return em;                                   // return IMMEDIATELY: Spring runs async, the container thread is released
}

// Where events originate (after the transaction commits): publish to the right user
void onTransferDone(Transfer t) throws IOException {   // send throws (client gone) → catch and remove the emitter
    SseEmitter em = clients.get(t.customerId());
    if (em != null) em.send(SseEmitter.event().id("" + t.seq()).name("transaction").data(toJson(t)));
}
~~~

### Many instances: the most common breakage
~~~text
                    ┌──► instance A ──► DB     (client X is connected here)
client ──LB routes─┤
                    └──► instance B ──► DB     (the transfer is created HERE)
For client X to see the event, B must publish to the shared channel (Redis Pub/Sub),
and A, which holds X's connection, receives it and pushes it down.
~~~
Without pub-sub the symptom is **"half the clients see the new transaction, half do not"**, and it gets worse after each instance restart — extremely hard to reproduce because a dev machine runs a single instance.

### Common pitfalls
- **Proxy buffering**: nginx collects the whole response before sending → clients see events seconds late or not at all. Avoid it with {{proxy_buffering off}} for the SSE endpoint (or the {{X-Accel-Buffering: no}} header), and do not enable gzip for {{text/event-stream}}.
- **No heartbeat**: 60 seconds without a single byte and an intermediary cuts the connection; the client thinks the server is gone. Send a ping every 15–30 seconds.
- **Many instances without pub-sub/sticky sessions**: events only reach the clients of the instance that produced them.
- **Holding a thread per connection**: reading connections synchronously means 10,000 clients = 10,000 threads. Use {{SseEmitter}}/WebFlux (async, no thread held after returning).
- **Duplicated or missing events on reconnect**: send an {{id}} (sequence) and have the client skip ids it has already seen.
- **Mobile**: the OS cuts connections when the app goes to the background; besides SSE you need push notifications (FCM) as a safety net.

### One-minute spoken answer
"I choose based on the latency requirement and on server-side state. Polling with ETag is the baseline: each round costs one 304 response, latency equals the poll interval, and it is stateless so it works behind any number of instances. When the business needs sub-second latency I add SSE: the client opens one request, the server keeps it open and pushes text/event-stream, EventSource reconnects automatically and sends Last-Event-ID to fetch what was missed — provided the proxy disables buffering, a heartbeat is in place, and pub-sub lets events created on one instance reach a client connected to another. I use WebSocket only when the client really must send real-time data at the same time, because its price is connection state, sticky sessions and a long list of failure modes that only show up with thousands of connections."

> Senior tip: start with polling + ETag on every screen and upgrade to SSE in the one place that truly needs instant updates — I have seen teams pay dearly for WebSocket when all they needed was one-way push. Before opening SSE in production, test with curl holding the connection through the real proxy/ingress chain and measure the time from event creation to client receipt; if that number is above target, the problem is buffering/heartbeat, not the Java code.`,
    follow: [
      'If you use SSE, when is authorization checked, given that EventSource cannot send arbitrary Authorization headers?',
      'Does pub-sub between instances via Redis lose events when Redis restarts?',
      'What polling interval is reasonable for an account screen, and why is shorter more dangerous?'
    ]
  },
  'api-030': {
    q: 'Mobile app v2.3 shipped last year and you cannot force users to upgrade. You must change an API response (add, rename, remove fields, add enum values) without crashing the old app. What are the concrete tolerant-reader rules, where does the configuration live, and how do you verify it before deploying?',
    a: `**Summary:** Within one major version, the server may only **add** optional fields — no renames, no removals, no type changes; if you need a change, add a new field, keep the old field readable and mark it deprecated. Clients must be **tolerant readers**: ignore unknown fields, have a default branch for unknown enum values, never assume every field is present. Verify before deploying with **contract tests**: replay the old app's sample responses through the old app's own parser in CI, plus staging with the old APK hitting the new server.

### Quick intuition
A shipped app is like a printed book already on shelves: **you cannot recall it**, people are still holding last year's print. Adding a chapter keeps the old book readable (unknown chapters are skipped); **renaming a chapter** points the old table of contents at something that no longer exists. A tolerant reader is the convention "a new printing still opens with the old table of contents": readers skip what they do not know, and writers never delete what readers depend on.

### Terms
- **Tolerant reader / tolerant writer**: the reader ignores data it does not recognize; the writer emits nothing outside the promised contract.
- **Additive-only change**: only additions, no edits or removals within a major version.
- **Unknown properties**: JSON fields the class does not declare. Jackson's {{ObjectMapper}} **fails by default** on unknown fields ({{FAIL_ON_UNKNOWN_PROPERTIES}} is on); Spring Boot disables that flag so the app can read them, but hand-written SDKs or Kotlin/Swift apps using strict parsers must opt into tolerance themselves.
- **Enum evolution**: adding a value to an enum; a client {{switch}} without a {{default}} branch breaks.
- **Support window (N-2)**: a commitment to keep reading responses for the last two app versions.
- **Deprecated field**: still returned for months after a replacement exists.

### Decision table: what is safe to change
| Response change | Safe? | Risk to the old app | Safe way |
|---|---|---|---|
| Add an optional field | Yes | Usually none | Only add, document in OpenAPI |
| Rename a field | **No** | Old field becomes null → blank UI, NPE | Add the new field, keep returning the old one, deprecate it |
| Remove a field | **No** | The old app reads null | Keep returning it for months, measure reads first |
| Change a type (int → string) | **No** | Immediate parse error | Create a new field with the new type |
| Add an enum value | **Conditionally** | A switch without default shows wrong data or crashes | Clients have a default branch, server documents it |
| Add a **required** request field | **No** | Old requests get 400 | The server fills a default when it is missing |
| Change a format/date/time/default | **No** | Parses fine but **displays wrong** | Keep the format, add a parameter if it must change |
| Add an endpoint / add a header | Yes | None | Ask clients not to reject unknown headers |

### Tolerant configuration
~~~yaml
spring:
  jackson:
    deserialization:
      fail-on-unknown-properties: false   # unknown request fields do not blow up (Spring Boot default)
~~~
Where it matters: this tolerance must be configured on the **client** (mobile app, partner Java SDK) — wherever your responses are read; on the server it matters when you read a third party's JSON. For unknown enum values specifically, enable it via {{ObjectMapper}} as below:

~~~java
public enum TxStatus {
    PENDING, SUCCESS, FAILED,
    @JsonEnumDefaultValue
    UNKNOWN;                    // fallback value when an unknown future value arrives
}
// client: mapper.enable(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE);
// UI handles UNKNOWN instead of assuming all branches are enumerated
~~~

### Lifecycle of a field
~~~text
T0     add receiptUrl (optional); STILL return the old url      → both fields appear
T+3    log the share of requests still reading the old field (grouped by X-Client-Version)
T+6    below 1% of reads → put it on the removal list
major  stop returning the old field (this is when a new version is needed, see the deprecation policy)
~~~

### Verifying before deploy
1. **Golden response test**: store the exact JSON app v2.3 used to receive as a fixture; the app repo's CI deserializes it with the app's own code — a server change turns the test red immediately.
2. **Consumer-driven contract (Pact)**: the old app is the consumer; every server spec change must pass verification against that consumer first.
3. **E2E staging**: spin up the new server and run the old APK on an emulator/real device — decode errors only surface when a full flow runs.
4. **Measure in production**: track crash rate per app version (Crashlytics/Firebase) **for each version**; ship the server change during off-peak and compare the error rate over the next hour.

### Common pitfalls
- **"Surely nobody uses that field" and deleting it**: the symptom is old apps showing a blank screen after deploy. Avoid it by measuring reads per client version with logs/metrics first.
- **Kotlin/Swift clients forcing non-null**: the server stops returning a field = null → a crash on the constructor line. Keep optional fields with defaults and never remove a required field midway.
- **Changing the date format (2024-01-05 → 05/01/2024)**: same field name, parsing still succeeds but the display is wrong — quieter and more dangerous than a crash because users trust wrong data.
- **Returning a new field as an empty string**: clients render a blank cell or the text "null". Better to **omit the field** when there is no value.
- **Betting on "this release forces an update"**: a high share of users disable auto-update and store review takes days; on day one, old users still hit your API.

### One-minute spoken answer
"My rule is additive-only within a major version: adding an optional field is safe, while renaming or removing a field means adding a new one and keeping the old one readable for months, then measuring usage before removing it in the next version bump. On the reading side, clients are always tolerant readers: ignore unknown fields, have a default branch for unknown enums via JsonEnumDefaultValue, and never assume every field is present — because an app on the store cannot be fixed. To be sure, I set up a contract test: the old app's sample JSON must parse with the old app's own parser in CI, and staging runs the old APK before production. Date/time format or default changes also count as breaking, because they cause wrong display rather than crashes and are therefore harder to notice."

> Senior tip: treat **"how many client versions did we break"** as a quality metric for every API deploy, on par with the 5xx rate. The cheapest tool is a contract test with golden JSON files from the N-2 versions; the second is telemetry keyed by {{X-Client-Version}} so you know which fields are about to lose their audience before you remove them. And when a breaking change is unavoidable, bump the major version properly (run both in parallel, with {{Sunset}} dates) instead of "changing it quietly and telling people internally" — every third-party integration regards that as an incident.`,
    follow: [
      'If both the old and new versions must run in parallel for a while, how do you organise code and the database?',
      'How do you measure "how many clients still read this field" if clients do not send their app version?',
      'When should you create a new major version instead of continuing to add fields?'
    ]
  }
});
