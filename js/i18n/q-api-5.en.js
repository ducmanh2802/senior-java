(App.i18n.content = App.i18n.content || {}).en = Object.assign(App.i18n.content.en || {}, {
  'api-027': {
    q: 'Client sends Accept: application/json, Accept-Language: vi/en, Accept-Encoding: gzip. How does the server handle "content negotiation" in Spring? When to return 406 Not Acceptable, and why is Vary header mandatory when caching is involved?',
    a: `**Summary:** Content negotiation is how the server selects the **representation** that best matches the client's preferences: Spring matches the {{Accept}} header against registered {{HttpMessageConverter}}s and selects the best media type (based on q-values) — if no match is found, it returns **406**; {{Accept-Language}} selects the notification language via {{MessageSource}}; {{Accept-Encoding}} determines whether compression (gzip) is applied, and when compressed, the **{{Vary: Accept-Encoding}}** header is **mandatory** so that the cache does not mix compressed and uncompressed versions.

### Quick understanding
Think of a restaurant asking in advance: "Do you prefer vegetarian or meat, English or Vietnamese, printed or digital menu?" — depending on the answers, the restaurant prepares the right dish, in the right language, and the right format. **Accept** indicates the desired format, **Accept-Language** indicates the language, and **Accept-Encoding** indicates "I understand this compression type". If the restaurant cannot fulfill the request, it should be honest and say "not available" (**406**) instead of silently serving something else.

### Terminology
- **Representation**: A specific instantiation of a resource (JSON, CSV, HTML) depending on the client's headers.
- **Media type**: The body format, e.g., {{application/json}}, {{text/csv}}, {{application/problem+json}} for errors per RFC 9457.
- **q (quality value)**: Priority in the Accept header, e.g., {{application/json;q=0.9, */*;q=0.8}} — higher q is selected first.
- **HttpMessageConverter**: Spring class that reads/writes the body based on the media type (Jackson for JSON, Jackson XML for {{application/xml}} if {{jackson-dataformat-xml}} is present…).
- **406 Not Acceptable**: No converter matches the Accept header.
- **MessageSource**: Spring's multi-language notification table, read via {{LocaleContextHolder.getLocale()}}.
- **Vary**: Header indicating "the cache key depends on these headers as well".
- **Content-Encoding**: The actual compression applied to the body ({{gzip}}, {{br}}).

### Step-by-step mechanism
1. Client sends {{Accept: application/problem+json, application/json;q=0.5, */*;q=0.1}}. Why use q-values: when a client needs JSON for general data but {{problem+json}} for **errors**, weighting ensures the correct type is selected.
2. Spring compares against registered converters; selects the match with the highest q-value. {{*/*}} matches everything, so the first converter wins (usually JSON).
3. No matching converter → **406**. No Accept header (interpreted as {{*/*}}) → default is taken.
4. {{Accept-Language: en}} → reads {{messages_en.properties}}; if not found, uses the default language.
5. {{Accept-Encoding: gzip}} → compression layer (Tomcat when {{server.compression.enabled}} is on, or nginx) compresses the body, adds {{Content-Encoding: gzip}} and **{{Vary: Accept-Encoding}}**.

~~~text
Accept: application/json            ─┐
Accept-Language: en                 ─┼─► Spring selects converter + locale + compression ─► response
Accept-Encoding: gzip, deflate      ─┘         │
                                        no match for Accept → 406 Not Acceptable
~~~

### Spring Configuration
~~~java
@GetMapping(value = "/api/reports/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
ReportDto report(@PathVariable long id) { ... }   // JSON forced, independent of Accept

@GetMapping(value = "/api/transactions.csv", produces = "text/csv")
ResponseEntity<String> csv() { ... }              // returns CSV if requested via text/csv
~~~

~~~yaml
spring:
  messages:
    basename: messages          # messages_vi.properties, messages_en.properties
    encoding: UTF-8             # prevents encoding issues with non-ASCII characters in error messages
~~~

~~~java
// Read error message based on client's locale; keep field type (machine-readable error code) constant
String detail = messageSource.getMessage(
        "error.insufficient-funds", null, LocaleContextHolder.getLocale());
~~~

### Header → Server Action Mapping
| Header | Server Action | Configuration/Common Errors |
|---|---|---|
| {{Accept}} | Select converter, {{produces}} | Missing converter → 406; {{@RestController}} returning {{String}} results in {{text/plain}} — wrap in DTO if JSON is needed |
| {{Accept-Language}} | Select message bundle | Missing {{Vary: Accept-Language}} with cache → cross-contamination of languages between users |
| {{Accept-Encoding}} | Compress gzip/br | Enabling compression at both app and nginx → difficult to debug, potential double-compression; missing {{Vary: Accept-Encoding}} → cache serves gzip to client not supporting it |
| {{Accept-Charset}} | Mostly ignored | Spring Boot 3 defaults to UTF-8; do not force ISO-8859-1 |

### Common pitfalls
- **406 due to client sending exotic Accept** (e.g., {{application/xml}} without converter): Symptom: client reports "no data". Mitigation: Standardize on JSON, register converters, or clearly return 406 with supported types.
- **Overlapping compression configuration**: App and nginx both compressing → hard to know which layer is compressing, potential double-compression → CPU wastage, broken body. Choose **one layer** (usually proxy) and disable compression at app level ({{server.compression.enabled}} default is false).
- **Missing {{Vary}}**: Cache has one lock (URL) — gzip and uncompressed, Vietnamese and English versions share the same lock → random, hard-to-debug bugs. When compression or multiple languages are involved, {{Vary}} is mandatory, not optional.
- **Returning {{String}} directly from controller**: Client expects JSON but receives {{text/plain}}. Return an object or set {{produces}}.

### 1-minute interview answer
"Content negotiation involves three axes. Format axis: Spring matches {{Accept}} against {{HttpMessageConverter}} list, selects by q-value, and returns 406 if no match — that's why I always explicitly declare {{produces}} for every endpoint. Language axis: {{Accept-Language}} determines the bundle in {{MessageSource}}, which I use for error messages while keeping {{type}} constant for machine parsing. Compression axis: {{Accept-Encoding}} allows gzip, and this is where most mistakes happen — you must include {{Vary: Accept-Encoding}} if you don't want the cache to mix compressed and uncompressed versions; similarly, missing {{Vary: Accept-Language}} will result in users seeing the wrong language."

> Senior tip: Default to standardized JSON and only open CSV/PDF for truly necessary endpoints — more representations mean more test paths. When enabling caching/CDN, I always verify two {{Vary}} headers ({{Accept-Encoding}}, {{Accept-Language}}) in actual responses using a tool like curl before release: serving the wrong version from cache is the type of bug that only appears in production with real traffic, never in dev.`,
    follow: [
      'How can clients know supported formats without guessing until hitting 406?',
      'Should compression be enabled in Spring or nginx? What are the selection criteria?',
      'Designing multilingual error messages while allowing machine-readable classification?'
    ]
  },
  'api-028': {
    q: 'A client wants to update part of a profile: some only change the phone number, others move and change email simultaneously. Compare JSON Merge Patch (RFC 7396) and JSON Patch (RFC 6902) for REST APIs: syntax, idempotency, Spring/Jackson handling, and when to choose which?',
    a: `**Summary:** **JSON Merge Patch** is an object representing changes, with {{null}} fields meaning deletion — concise, merge-style, generally idempotent; **JSON Patch** is an ordered array of operations ({{add}}, {{remove}}, {{replace}}, {{move}}, {{copy}}, {{test}}) with **JSON Pointer** — more powerful (array insertion, conditional checks) but brittle when applying onto stale states. Both have distinct media types: {{application/merge-patch+json}} and {{application/json-patch+json}}; incorrect Content-Type results in **415**.

### Quick understanding
**Merge Patch** is like a sticky note saying "new phone: 0912…" — you only write what you want to change, keep everything else as is. **JSON Patch** is like a legislative amendment: each line has a number and an action ("Article 3: replace", "Article 5: delete", "Article 7: append to tags"), plus a condition "only apply if the current version is 7". Anyone can write a sticky note; the amendment must follow the law — so it's more precise but breaks easily if written manually.

### Terminology
- **PATCH (RFC 5789)**: Method to update **a partial** resource, unlike PUT (replace entire).
- **Delta**: The difference between old and new state, containing only changes.
- **JSON Pointer (RFC 6901)**: String pointing to a JSON location, e.g., {{/addresses/1/city}}; {{/tags/-}} means "end of tags array".
- **Media type**: Format declared in {{Content-Type}}; server uses this to determine how to parse the body.
- **Idempotency**: Applying the same input yields the same result; critical when clients retry.
- **415 Unsupported Media Type**: {{Content-Type}} incompatible with that endpoint.
- **If-Match / 412**: Precondition, allowing rejection of overwrites if the version changed (lost update).

### Syntax comparison
~~~json
{ "phone": "0912345678", "email": null, "city": "Ha Noi" }
~~~
Merge Patch above: updates phone, **deletes** email (null = delete, not "set to null"), keeps all other fields.

~~~json
[
  { "op": "replace", "path": "/phone", "value": "0912345678" },
  { "op": "remove",  "path": "/email" },
  { "op": "add",     "path": "/tags/-", "value": "priority" },
  { "op": "test",    "path": "/version", "value": 7 }
]
~~~
JSON Patch above: same result, but can insert into array and has {{test}} — "apply only if version equals 7"; if not, **the entire patch** is aborted (RFC 6902 requires atomic application) and the server returns **409 Conflict** (as suggested by RFC 5789 for conflicts).

### Comparison Table
| Criteria | JSON Merge Patch | JSON Patch |
|---|---|---|
| Syntax | Delta object | Ordered operation array |
| Media type | {{application/merge-patch+json}} | {{application/json-patch+json}} |
| Delete field | Set to {{null}} | {{op: remove}} |
| Insert/End array | Impossible | {{path: /tags/-}} |
| Conditional check | Impossible | {{op: test}} |
| Idempotent | Yes | Mostly, except {{add}} to {{/-}} (re-applying adds another element) |
| Client ease of use | Very easy | Must understand JSON Pointer |
| Usage | Common partial updates (90% cases) | Structural operations, atomic/conditional needs |

### Spring: Parsing body and applying delta
~~~java
@PatchMapping(value = "/api/profiles/{id}", consumes = "application/merge-patch+json")
ResponseEntity<ProfileDto> patch(@PathVariable long id, @RequestBody JsonNode patch,   // om: ObjectMapper injected via constructor
        @RequestHeader(value = "If-Match", required = false) String ifMatch) {
    Profile cur = repo.find(id);                        // 1. Always read LATEST state at server
    if (ifMatch != null && !ifMatch.equals(etagOf(cur)))
        return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).build();  // 412
    JsonNode next = merge(om.valueToTree(cur), patch);   // 2. Apply delta per RFC 7396
    Profile saved = repo.save(om.treeToValue(next, Profile.class));            // 3. Validate then save
    return ResponseEntity.ok(dto(saved));
}
~~~

~~~java
// Full RFC 7396: null = delete, object = recursive merge, other value = replace entire value
static JsonNode merge(JsonNode base, JsonNode patch) {
    if (!patch.isObject()) return patch;                 // scalar/array/null: replace entire value
    ObjectNode out = base != null && base.isObject()
            ? ((ObjectNode) base).deepCopy()             // merge into old version
            : JsonNodeFactory.instance.objectNode();     // base not an object → treat as {}
    Iterator<Map.Entry<String, JsonNode>> it = patch.fields();
    while (it.hasNext()) {
        Map.Entry<String, JsonNode> e = it.next();
        if (e.getValue().isNull()) out.remove(e.getKey());                        // null → delete
        else out.set(e.getKey(), merge(out.get(e.getKey()), e.getValue()));       // recursive merge
    }
    return out;
}
~~~
For JSON Patch, Jackson ({{jackson-core}}) only has {{JsonPointer}} and {{JsonNode.at(...)}} to navigate, it **does not** have a built-in patch application class in {{jackson-databind}}. To support {{application/json-patch+json}}, add libraries like {{com.github.java-json-tools:json-patch}} (API {{JsonPatch.fromJson(node).apply(target)}}) or {{com.flipkart.zjsonpatch:zjsonpatch}}; invalid paths or failing {{test}} throws {{JsonPatchException}} → return 400 (bad patch syntax), 422 (unapplicable patch), or 409 (conflict) with details.

### Common pitfalls
- **Sending incorrect Content-Type** ({{application/json}} instead of {{application/merge-patch+json}}) → 415. This is a client-side error, but should be clearly documented and returned with a readable ProblemDetail.
- **PATCHing based on client's stale state**: Client drafts patch after opening form for 5 minutes, in the meantime someone else modifies it → overwrites changes. Mitigation: Include {{If-Match}} with ETag; 412 tells client to re-fetch.
- **Using PUT with partial body**: PUT means "replace entire", omitted fields will be lost. This is why partial updates should use PATCH.
- **JSON Patch {{test}} fail**: Return **409 Conflict** (RFC 5789), not 400 — syntax is correct, but current state doesn't match. Use **412** for conditional header {{If-Match}}.
- **Network/WAF blocking PATCH**: Some proxies, WAFs, or gateways disallow {{PATCH}} by default (405). Check external layers before blaming Java code.

### 1-minute interview answer
"PATCH is for partial updates, and I differentiate the format based on client complexity. Merge Patch is an object defining changes, where null means deletion and other fields are kept — it's idempotent, easy to generate, so I use it as default for update forms. JSON Patch is a series of operations using JSON Pointer, more powerful for array insertion and {{test}} conditions, but the client must understand the structure and re-applying is not always idempotent, so I only use it when structural operations are needed. The most important point is not the format, but reading the latest state from the server before applying the delta, along with {{If-Match}} to return 412 if data has changed — otherwise, the patch will overwrite other people's changes."

> Senior tip: Pick **one** format for the entire system (almost always Merge Patch) and specify it in OpenAPI — having both formats live in parallel means doubling SDKs, tests, and documentation. Always include {{If-Match}} for PATCH when multiple users edit the same data: I've seen reports of "address overwritten by someone else" occurring during peak hours when hundreds of users were updating limits simultaneously.`,
    follow: [
      'Merge Patch uses null to delete fields; how to explicitly set a field to null?',
      'Does JSON Patch guarantee atomicity (all operations or none)?',
      'Should PATCH return 200 with the new body or 204? Why?'
    ]
  },
  'api-029': {
    q: 'The "Latest Transactions" screen must update immediately when a transfer succeeds. Compare polling (with conditional requests), SSE, and WebSocket for REST APIs: latency, connection overhead, operation behind load balancers with multiple instances, and behavior on mobile — when to choose which?',
    a: `**Summary:** **Polling** is client asking repeatedly — simplest, latency equals the interval, resource-heavy; **SSE** is client opening an HTTP request, server holding it open to push events as {{text/event-stream}} — unidirectional, auto-reconnect, traverses older proxies/load balancers; **WebSocket** is a full-duplex connection after an {{Upgrade: websocket}} handshake — requires connection state and pub-sub between instances. Start with polling + ETag, add SSE when sub-second latency is needed, use WebSocket only when the client truly needs to **send** data real-time.

### Quick understanding
**Polling** is like asking your mom "Is dinner ready?" every minute: you'll eventually know, but it's wasteful and you have to wait for the next interval. **SSE** is like mom ringing a bell when dinner is ready: you just stand there, no need to ask again. **WebSocket** is like a two-way phone call: you can both talk, but you must hold the line (keep connection) and switching lines (network) drops the call.

### Terminology
- **Polling**: sending repeated requests on a schedule; **conditional poll** includes {{If-None-Match}} so the server returns 304 lightweight instead of the full body.
- **SSE (Server-Sent Events)**: HTTP/HTML standard for server to push one-way events; browser has {{EventSource}} API that listens and reconnects automatically.
- **text/event-stream**: SSE body format — {{event:}}, {{data:}}, {{id:}} lines, separated by blank lines.
- **Last-Event-ID**: Header automatically sent by browser upon reconnection to request events since the disconnection.
- **WebSocket**: Separate protocol, usually runs on port 80/443, starts with an HTTP {{Upgrade: websocket}} request, then exchanges two-way **frames**.
- **Sticky session**: Load balancer pins a client to a specific instance (via cookie/IP) so long connections aren't kicked to another machine.
- **Pub/Sub (Redis)**: "Common message channel" between instances — whichever instance generates an event publishes it to the channel, the instance holding the client connection receives it and pushes it down. Redis here is a key-value store running separately, used as a fast bus between services.
- **Heartbeat**: Bytes sent periodically so intermediate layers don't cut idle connections.

### Mechanism and Overhead
~~~text
polling : client ──GET──► server   every 5 seconds    avg latency ~2.5s, 12 req/min/user
SSE     : client ──GET──► server HELD OPEN ◄────── server pushes:
                                                   event: transaction
                                                   id: 918273
                                                   data: {"id":918273,"amount":500000}

                                                   (blank line = event end)
WebSocket: client ══HTTP Upgrade: websocket══► after handshake: full-duplex, heartbeat (ping/pong)
~~~

### Comparison Table
| Criteria | Polling + ETag | SSE | WebSocket |
|---|---|---|---|
| Latency | Per interval (1–30s) | Near real-time | Real-time |
| Connection Count | Many repeated requests | 1 open per client | 1 per client |
| Traverses proxy/CDN | Very good | Good if proxy buffering disabled | Requires proxy support for Upgrade |
| Multi-instance | Stateless | Requires sticky or pub-sub | Requires sticky or pub-sub |
| Bidirectional | No | No (client calls API normally) | Yes |
| Auto-reconnect | N/A (polling is continuous) | {{EventSource}} auto, via {{Last-Event-ID}} | Manual (must re-handshake) |
| Complexity | Very low | Low | Highest (connection, framing, heartbeat, ordering) |

### SSE in Spring Boot
~~~java
private final Map<Long, SseEmitter> clients = new ConcurrentHashMap<>();

@GetMapping(value = "/api/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
SseEmitter stream() throws IOException {
    SseEmitter em = new SseEmitter(30 * 60 * 1000L);  // 30min timeout: longer than default async timeout,
                                                      // prevents "orphaned" connections
    clients.put(userId(), em);                   // store by user to route event correctly
    em.onCompletion(() -> clients.remove(userId()));
    em.onError(e -> clients.remove(userId()));
    em.send(SseEmitter.event().id("" + lastSeq).name("connected").data("ok")); // send early so header/first bytes hit client
    return em;                                   // return IMMEDIATELY: Spring runs async, container thread released
}

// Where event is generated (after commit): push to correct client
void onTransferDone(Transfer t) throws IOException {   // send error (client gone) → catch and remove emitter
    SseEmitter em = clients.get(t.customerId());
    if (em != null) em.send(SseEmitter.event().id("" + t.seq()).name("transaction").data(toJson(t)));
}
~~~

### Multi-instance: where things usually break
~~~text
                    ┌──► instance A ──► DB     (client X connected here)
client ──LB ───┤
                    └──► instance B ──► DB     (transaction generated HERE)
To make client X see the event, B must publish to a common channel (Redis Pub/Sub),
A holding X's connection receives it and pushes down.
~~~
Without pub-sub, symptoms are **"half the clients see new transactions, half don't"**, worsened after instance restarts — very hard to reproduce because dev machines only have one instance.

### Common pitfalls
- **Proxy buffer**: nginx buffers responses before sending → client sees events delayed by seconds or not at all. Mitigation: {{proxy_buffering off}} for SSE endpoints (or header {{X-Accel-Buffering: no}}), don't enable gzip for {{text/event-stream}}.
- **No heartbeat**: 60s without bytes → intermediate layer cuts it; client thinks server is down. Send ping every 15–30s.
- **Multi-instance without pub-sub/sticky**: event only reaches clients of the generating instance.
- **Thread holding per connection**: synchronous connection handling → 10,000 clients = 10,000 threads. Use {{SseEmitter}}/WebFlux (async, thread released after return).
- **Duplicate/missing events on reconnect**: Send with {{id}} (sequence); client ignores seen IDs.
- **Mobile**: OS cuts connection when app moves to background; besides SSE, need push notifications (FCM) as a safety net.

### 1-minute interview answer
"I choose based on latency requirements and server-side state. Polling + ETag is the baseline: each turn costs only a 304 request, latency equals the polling interval, and it's stateless, scaling easily across instances. When the business requires sub-second latency, I add SSE: client opens a request, server keeps the connection open and pushes {{text/event-stream}}, {{EventSource}} handles reconnection and {{Last-Event-ID}} for recovery — conditions are that the proxy must have buffering disabled, keep heartbeats, and multi-instance requires pub-sub so events generated elsewhere reach the connected client. I only use WebSocket when the client truly needs real-time bi-directional communication, because the cost includes connection state, sticky sessions, and complex error cases that only appear under load."

> Senior tip: Start with polling + ETag for all screens, upgrade to SSE for the one spot that truly needs it — I've seen teams pay a heavy price for WebSocket when push was only needed one-way. Before opening SSE in production, test with curl keeping the connection open through the actual proxy/ingress path and measure the time from event generation to client receipt; if it's not below the target, the issue lies in buffering/heartbeat, not Java code.`,
    follow: [
      'If using SSE, when is authorization checked, since EventSource cannot send arbitrary headers like Authorization?',
      'Does Redis pub-sub coordination between instances lose events on Redis restart?',
      'What is a reasonable polling interval for account screens, and why is shorter more dangerous?'
    ]
  },
  'api-030': {
    q: 'Mobile app v2.3 was released last year and you cannot force user upgrades. You must change the API response (add, rename, remove fields, change enum values) without crashing the old app. What is the specific tolerant reader rule, where is configuration, and how to verify before deployment?',
    a: `**Summary:** Within the same major version, the server must **only add optional** fields — never rename, remove, or change types; to change, add a new field, keep the old one readable and deprecate it. Clients must be **tolerant readers**: ignore unknown fields, have default branches for unknown enum values, do not assume all fields are present. Verify before deployment with **contract tests**: run the old app's response parser against the new response in CI, and run the old APK against the new staging server.

### Quick understanding
The released mobile app is like a printed book: **you cannot recall it**, users still hold last year's edition. Adding a new chapter is fine (the old reader ignores unknown chapters); **renaming a chapter** makes the old table of contents point to non-existent places. The tolerant reader rule is the agreement: "new printings can still be opened using the old table of contents": the reader ignores parts they don't understand, the writer doesn't delete what the reader depends on.

### Terminology
- **Tolerant reader / tolerant writer**: Reader ignores unrecognized data; writer records nothing outside the promised contract.
- **Additive-only change**: Only add, never modify/remove within the same major version.
- **Unknown properties**: JSON fields that the class doesn't define. Jackson's {{ObjectMapper}} **fails by default** on unknown fields ({{FAIL_ON_UNKNOWN_PROPERTIES}} flag is on); Spring Boot turns this off, so apps read them fine, but custom SDKs or strict parsers (Kotlin/Swift) must explicitly enable tolerance.
- **Enum evolution**: Adding new values to an enum; clients with {{switch}} statements lacking {{default}} will crash.
- **Support window (N-2)**: Commitment to reading responses for the past 2 app versions.
- **Deprecation field**: Field still returned months after the replacement strategy is introduced.

### Decision table: what changes are safe
| Response change | Safe? | Risk to old app | Safe way |
|---|---|---|---|
| Add optional field | Yes | None (tolerant reader ignores) | Add and doc |
| Rename field | No | Old app looks for old name, finds null → crash | Add new, keep old, deprecate old |
| Remove field | No | Old app expecting field → crash | Add deprecation header/doc, keep until N-2 expires |
| Change type (int → string) | No | Deserialization failure | Add new field with new type |
| Add enum value | Depends | {{switch}} statement crashes | Add {{default}} branch for unknown |

### Configuration (Spring Boot/Jackson)
~~~java
// Global Jackson setting
@Configuration
public class JacksonConfig {
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer customizer() {
        return builder -> {
            // Spring Boot default already disables this, but be explicit if using custom ObjectMapper
            builder.failOnUnknownProperties(false); 
        };
    }
}
~~~

### Contract Testing (Crucial Verification)
Contract tests don't run the whole app; they check if "old reader can parse new response".

1. **Consumer Contract (e.g., using Pact or manual)**: 
   - Define a test suite that uses the old model class (or a mock parser for the old app).
   - Point it at the new API's actual response.
   - Fail if it crashes.

2. **Backend check**:
   - In CI, run a tool to fetch the new API response.
   - Run the old app's test harness (or a simple JSON parser configured for strict mode) against this response.

### Implementation Checklist
- **Rename/Move**: Keep old field, populate both, mark old {{@Deprecated}}. Wait for N-2 upgrade threshold.
- **Enum**: Every {{switch(type)}} **MUST** have a {{default}} branch that maps to a safe fallback (or logs warning).
- **Required fields**: **Never add a required field**. Everything must be nullable or have a default value.
- **Validation**: Server should still validate (e.g., {{@NotNull}}), but don't strictly enforce it in the response model used by old versions if possible.

### Trả lời miệng 1 phút
"I treat the released app like a printed book — it cannot be recalled. My rule is additive-only: I never rename or remove fields in the same major version. If I must change a field, I add a new one, populate both, and deprecate the old one. My services are configured for tolerance ({{failOnUnknownProperties(false)}}), and I enforce this via contract tests in CI: I pull the new response and run it against the old parser to catch breaking changes before deployment. For enums, I force {{default}} branches on all switch statements. This gives me a support window of N-2 versions without forcing every user to update simultaneously."

> Senior tip: **Contract tests are the only reliable way**. Don't trust your memory — the API contract that seems "safe" often breaks because the old app parser handles nulls differently. I once broke an iOS app because I changed a field from nullable to mandatory, and the Swift parser strictly crashed — the test only took 5 minutes to run in CI, but the fix required an emergency App Store submission.`,
    follow: [
      'How to handle breaking changes for required fields? (e.g., new business logic requires a field)',
      'What is the standard procedure to sunset an old API major version?',
      'How to manage API versioning (header vs URI path) while maintaining support for old apps?'
    ]
  }
});