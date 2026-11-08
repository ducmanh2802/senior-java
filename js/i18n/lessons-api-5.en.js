/*
 * English translation of js/data/lessons-api.js — task T1030. Format: js/core/i18n.js (content overlay).
 * ids: lesson-api-007
 */
App.i18n.content({
  'lesson-api-007': {
    title: 'Evolving an API without breaking clients: breaking changes, tolerant reader, versioning, Sunset',
    goals: [
      'Classify a schema change as safe / risky / breaking, and explain why it falls into that group',
      'Configure a **tolerant reader** in Jackson so an old client does not crash when the server adds a field or adds an enum value',
      'Choose a versioning approach (URI, header, media type) and justify it with trade-offs around caching, debugging and CORS',
      'Write a correct deprecation plan: {{Deprecation}}, {{Sunset}}, {{Link}}, and measure usage before turning the old version off',
    ],
    body: `### What it is: an API is a contract, not an internal function
**Summary:** When you change a function inside your own service, you fix every one of its 20 call sites in the same commit. When you change an API, you do not know who is calling it: a mobile app at version 2.3 that shipped a year ago and lives on a customer's phone, a partner who integrated two years ago, or an internal script owned by another team. You **cannot** change their side, so you only have three options: change in a way they can tolerate (backward compatible), run two versions side by side (versioning), or announce the end and phase it out (deprecation + {{Sunset}}).

Terms used for the first time:
- **Backward compatible**: the new server version still serves the expectations of an **old** client correctly. Everyday example: a new electrical outlet still accepts an old plug.
- **Forward compatible**: a **new** client can survive when it talks to an **old** server (the field it needs does not exist yet). These two directions are why APIs should be designed so that "adding is easy, removing is hard".
- **Breaking change**: makes a running client fail - it crashes, reads wrong data, or receives a response it cannot parse.
- **Non-breaking / additive change**: an old client can ignore it without breaking.
- **Tolerant reader**: a client written to **accept the unfamiliar** - ignore unknown fields, and treat an unknown enum value as "not understood" instead of throwing an exception. This is the most important line of defence, because it turns many "breaking" changes into "safe" ones.
- **Contract**: a machine-readable description of the API (OpenAPI/Swagger, protobuf, AVRO schema). A **contract test** is an automated test that proves the client and server still match.
- **Semantic versioning for APIs**: {{v1}}, {{v2}} - only bump the major number when there is a breaking change.
- **Deprecation**: marking something as "still usable, but do not use it anymore". **Sunset**: the date on which it is officially no longer served.

### Why "just adding a field" can take down an app
Because most clients use generated code and strict parsers. Spring Boot's Jackson **defaults to not** failing on unknown fields, but many teams turn {{FAIL_ON_UNKNOWN_PROPERTIES = true}} back on to "catch errors early", or they use older XML/JSON mappers, or parsers in other languages: .NET's {{System.Text.Json}} **throws by default** when the JSON contains a property that does not exist in the class. In that case, one added field = the app crashes for every old user. The lesson: **always ask your partners whether their reader is tolerant before "just adding a field"**.

### Change classification table
Viewed in one direction: you change the **server**, and old clients are still running.

| Change | Classification | Why |
|---|---|---|
| Add an **optional** field to the response | Safe (with a tolerant reader) | An old client that does not know the field ignores it |
| Add a **required** field to the request body | **Breaking** | Old clients do not send that field, so the new server returns 400 |
| Remove a field from the response | **Breaking** | Clients reading that field get null → NPE or an empty display |
| Remove a field from the request (the server accepts it and ignores it) | Low risk | The client can still send it; the data is just discarded - announce it in advance |
| Change a field type: {{int}} → {{String}} | **Breaking** | The old client's parser and type casts fail |
| Widen a numeric type: {{int}} → {{long}} | **Risky** | JSON is still a number so it parses, but a client that stores it in an {{int}} overflows once the value exceeds 2 billion |
| Change the **meaning** of a field: {{status: "PENDING"}} means something new | **Silently breaking** | No technical error at all; the client simply makes the wrong decision. This is the most dangerous kind |
| Add an enum value to the response ({{status: "REFUNDED"}}) | **Breaking** if the reader is strict | A {{switch}} with no default branch → throws, or falls into an "impossible" branch |
| Remove an enum value | **Breaking** | Clients still encounter historical data that carries that value |
| Rename a field | **Breaking** | To an old client this is the old field removed plus a meaningless new one |
| Change the unit (money: VND cents → VND) / change the date-time timezone | **Silently breaking** | Same as changing the meaning |
| Add a {{Link}}/{{Deprecation}} header | Safe | Unknown headers are ignored according to the HTTP standard |

### Tolerant reader: write the client so you do not have to upgrade in a rush next time
~~~java
// 1) Ignore unknown fields instead of throwing UnrecognizedPropertyException
@JsonIgnoreProperties(ignoreUnknown = true)
class AccountView {
    public String id;
    public Money amount;

    // 2) Enum: declare a default value so a new server value does not crash the app
    @JsonEnumDefaultValue
    public enum Status { NEW, PAID, VOID, UNKNOWN }
}

ObjectMapper mapper = new ObjectMapper()
    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    .enable(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE);
~~~
Three more rules that do not live in configuration code:
- **Never assume a field is always present**: read it with {{Optional}}, check for null, and have a sensible default.
- **Never rely on the order of elements** in an array unless the documentation promises an order; do not count fields to infer the version.
- **Never "borrow" an existing field for a new purpose** (using {{note}} to carry an error code). That is a silent breaking change: the old client displays nonsense and nobody gets an error.

### Versioning: three ways to put a version number on an API
| Approach | Example | Pros | Cons |
|---|---|---|---|
| **URI path** | {{GET /v2/accounts/9}} | Obvious, logs/dashboards can be split by version, cache-friendly, easy to route at the gateway | The URI is the "identity" of a resource but carries an implementation detail; hard to A/B two versions behind the same URL |
| **Custom header** | {{X-API-Version: 2}} | Clean URI | CORS: an unfamiliar header triggers a **preflight** (an OPTIONS request before the real one) for browser clients; harder to debug by hand |
| **Media type (content negotiation)** | {{Accept: application/vnd.bank.v2+json}} | The most "REST-pure" option; one URI, many representations | Hard to read, harder to cache across variants (needs {{Vary}}), tooling is less friendly |

For public APIs, the URI path is popular because it is easy to operate and easy to explain to partners. Do not version everything: if a change is additive, the client does not need to know a new version exists.

### Announce, then turn off: {{Deprecation}} and {{Sunset}}
- {{Deprecation}} (IETF draft): says "this API will be retired". The newer form uses an HTTP-date, with a flag: {{Deprecation: @1735689600}} (@-prefixed epoch seconds) or {{Deprecation: true}} in the older form.
- {{Sunset}} (RFC 8594): the **specific date and time** this version stops being served, as an HTTP-date: {{Sunset: Tue, 01 Dec 2026 00:00:00 GMT}}.
- {{Link}} to point the way to the new version's docs: {{Link: <https://docs.bank.vn/migrate-v1-to-v2>; rel="deprecation"}}, and {{rel="alternate"}} pointing at the URL of the replacement version itself.
- {{Warning: 299 - "API v1 is deprecated, see docs/..."}}: the older style; newer standards have deprecated {{Warning}}, so use the three headers above.
- After Sunset: return {{410 Gone}} (permanently gone - do not return {{404}}, because the client would think the resource was deleted) with a message pointing to the new version.

A real rollout technique: every v1 response carries {{Deprecation}}/{{Sunset}} and logs **which {{User-Agent}}/API key** is still calling v1. Then email the owners of those exact keys, and only turn it off when the traffic curve is close to zero.

### The expand → migrate → contract strategy (change without breaking)
~~~seq
title: Rename amount(int) to amountMinor(int64) without breaking old clients
actors: Old App | New App | Gateway | Service | DB
note Service: EXPAND phase, both versions run side by side
Old App -> Gateway: GET /v1/accounts/9
Gateway -> Service: route v1
Service -> DB: read amount_minor
Service --> Gateway: amount (int) + amountMinor (int64)
Gateway --> Old App: 200, v1 still has the old field
New App -> Gateway: GET /v2/accounts/9
Gateway -> Service: route v2
Service --> Gateway: only amountMinor
Gateway --> New App: 200
note Service: MIGRATE phase, confirm 100% of traffic has moved to v2
note Service: CONTRACT phase, remove the old field from v1, then turn v1 off with Sunset
~~~
Those three steps are the whole secret to making a large API change: **add first** (both exist at once), **move the customers** (measure and push the migration), **remove last**. Anyone who tries to skip a step will be making apology calls.

### Automated verification instead of trusting each other
- **Lint the OpenAPI diff in CI**: generate an OpenAPI file from the code (springdoc), compare it with the one on {{main}}, and block the merge if there is a breaking change - the build fails the moment someone deletes a field.
- **Contract test / consumer-driven contract** (Pact, Spring Cloud Contract): each client publishes its expectations, and the server runs that set of expectations in CI. A schema change that breaks an expectation cannot be merged.
- **Feature flag + canary**: enable the new response shape for 1% of traffic, watch the 4xx/5xx rate and client-side parse errors (from logs the client reports back) before turning it on for everyone.
- **A version signal in the schema itself**: if a client cannot read {{apiVersion}}/capabilities, it is not ready for any change.

### Common mistakes
- **"It's only an extra field, what's the harm?"** - then a partner using a strict reader goes down; nobody asked, nobody measured.
- **Keeping {{v1}} and {{v2}} alive forever**: every version adds the cost of bug fixes, security patches and test runs; two versions that drift in features are where bugs are born. Always set a Sunset date and keep your word.
- **Version in the payload** ({{"apiVersion": 2}} in the body of the same URL): the gateway cannot route it and has to decode the body just to learn the version.
- **Forgetting {{Vary}}** when the same URL returns different content based on a version header → a CDN serves the wrong version to a different customer.
- **Changing a field's meaning without bumping the version** - the worst of all, because there is no signal the client can detect.
- **Turning a version off by the clock, not by the data**: shutting v1 down while 3% of traffic still comes from your highest-paying enterprise customer.

### Interview notes
A common question: "You must change the money type from {{int}} to {{String}} for 50 partners - how would you do it?" A high-scoring answer:
1. **Classify it**: this is a breaking change (type change), so it cannot be done silently.
2. **Add the new thing alongside the old**: add {{amountMinor}} (int64) and {{amountText}} to v1 as well - additive, breaks nobody.
3. **Contract tests + OpenAPI diff in CI** so every later change is proven automatically.
4. **Migrate with data**: log which API keys still use the old field, chart it week by week, and reach out directly to the groups that remain.
5. **{{Deprecation}}/{{Sunset}} on every v1 response**, then {{410 Gone}} after that date.
6. Mention the **tolerant reader** and Jackson's {{READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE}}: the line of defence that keeps this from happening again.

Extra credit for a Lead/Architect role: call out the **operational cost** of running multiple versions and propose limits (at most 2 public versions, a capped overlap window, and traffic share as the shutdown condition rather than a calendar date).

> **Senior tip:** The rule I use when reviewing a schema change: *what the server adds, the server owns; what the client needs, the client protects itself*. In practice: never remove a field/enum value before measuring, never change a type or meaning in place, and always ship a human-readable string label alongside enum values (a {{statusLabel}} field the client can display) so customers can switch to showing that label instead of {{switch}}ing on the enum code. And one thing people rarely say: **documentation is part of the contract** - add a field but do not update the docs/OpenAPI, and six months later your own team will break it because "nobody knew what this field was for".`,
    exercises: [
      {
        title: 'CompatChecker.diff: compare 2 schemas and classify changes (breaking / risky / safe)',
        prompt: `Write {{class CompatChecker}} with a static method:

{{static CompatReport diff(Map<String, Field> before, Map<String, Field> after)}}

The types below are provided (do not change their signatures):
- {{record Field(String type, boolean required, Set<String> values)}} - {{type}} is one of {{string}}, {{int}}, {{long}}, {{float}}, {{double}}, {{boolean}}, {{enum}}, {{object}}, {{array}}. {{values}} **only has meaning** when {{type}} is {{enum}} (the set of valid values); the {{Field(String type, boolean required)}} constructor creates a non-enum field.
- {{record CompatReport(List<String> breaking, List<String> risky, List<String> safe)}} - three lists of change labels, **each sorted in ascending lexicographic order**.

Classification rules, applied per field:
1. A field present in {{before}} but missing from {{after}}: {{breaking}} - label {{"removed:<field name>"}}.
2. A new field that appears in {{after}}: if {{required}} then {{breaking}} - {{"added-required:<name>"}}; otherwise {{safe}} - {{"added-optional:<name>"}}.
3. A field present in both where {{required}} changes: {{false -> true}} is {{breaking}} {{"now-required:<name>"}} (making something that used to be optional mandatory); {{true -> false}} is {{safe}} {{"now-optional:<name>"}}.
4. {{type}} changes:
   - If the pair is in the set of safe numeric widenings (four pairs: {{int->long}}, {{int->double}}, {{long->double}}, {{float->double}}) then {{risky}} - {{"widened:<name>:<old type>-><new type>"}} (a client storing it in the old type will overflow).
   - Every other type change is {{breaking}} - {{"retyped:<name>:<old type>-><new type>"}}.
5. Both sides are **{{enum}}** (same type): compare {{values}}.
   - Each value removed: {{breaking}} - {{"enum-value-removed:<name>:<value>"}}.
   - Each value added: {{risky}} - a strict reader will fail when it sees the new value, but a tolerant reader survives, so do not classify it as breaking.
   - When {{type}} changes (for example {{enum}} to {{string}}), apply **only** rule 4 and do not emit enum labels.
6. A single field may trigger several rules at once (for example its type changes and it becomes required) - emit every corresponding label.
7. If nothing changed, the corresponding list is empty. Do not produce extra labels.`,
        hints: [
          'Iterate over {{before}} to catch {{removed}}, {{retyped}}, {{widened}}, {{now-required}}, {{now-optional}} and enum labels; then iterate over {{after}} and skip fields already in {{before}} to catch {{added-required}}/{{added-optional}}.',
          'Compare types with {{equals}}, and build the label from the string {{"<old type>-><new type>"}} - use the same {{pair}} variable for both {{widened}} and {{retyped}} so the labels stay consistent.',
          'For enums, only compare {{values}} when {{type}} is "enum" on **both** sides. A Set has no order, so sort all three lists before returning to keep the result deterministic.',
        ],
        explain: `This exercise models exactly what CI must do whenever someone edits a schema: produce a list of changes and **use that list to decide** whether the merge is allowed and whether the version must be bumped.

The three most common mistakes are about **meaning**, not syntax:

**One - "{{enum-value-added}}" is risky, not safe.** Intuition says "adding a new value does not touch old clients". But an old client often has {{switch (status)}} with branches for {{NEW}} and {{PAID}}; when it sees {{REFUNDED}} it either throws (an expression switch with no default) or falls into the "this should be impossible" branch and routes a refund to the wrong department. That is why Jackson needs {{@JsonEnumDefaultValue}} + {{READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE}}, protobuf needs an {{UNKNOWN = 0}} value, and AVRO/protobuf are described as conditionally **forward/backward compatible** mechanisms.

**Two - numeric widening belongs in {{risky}}, not {{safe}}.** JSON putting {{1234567890123}} into a field a client declared as {{int}} causes an overflow or a coercion error (Jackson's {{InputCoercionException}}). If the field is a balance in cents, it only breaks once a customer is large enough - meaning your tests never see it, but accounting does. So it is allowed through, but flagged for a human reviewer to decide.

**Three - "changing the meaning" does not appear in the list because no tool can detect it.** Changing {{status: "PENDING"}} from "awaiting payment" to "awaiting profile review" is a complete breaking change, yet any {{CompatChecker}} will report "no change". That is why the process needs a **human reviewing the schema diff**, and it is the strongest reason to bump the version.

On the Java side: use {{Collections.sort}} ({{String.compareTo}}) so the output is deterministic - if you forget, the iteration order of a {{Set}}/{{HashMap}} changes between runs and tests fail intermittently with no explanation; using {{LinkedHashMap}}/{{LinkedHashSet}} when building test data also makes failures easier to read. The {{required}} condition should be checked **independently** of the type condition, because a single field can change type and become required at the same time (the last test).

In a real project you almost never write this yourself: {{oasdiff}}, {{schemastore}}, {{buf breaking --against}} (protobuf), or Apache Avro's {{CompatibilityChecker}} do this over whole OpenAPI/Avro/protobuf schemas and fail the build on breaking changes. But understanding the classification table above is what gets asked in interviews.`,
      },
    ],
    check: [
      {
        q: 'Which of the following is a **breaking change** for an old client?',
        options: [
          'Adding an optional field to the response',
          'Removing a field from the response that the client reads',
          'Adding a {{Deprecation}} header to the response',
          'Adding a new value to the API description document',
        ],
        answer: 1,
        explain: 'Removing a field makes a client that reads it receive null or a parse error → breaking. Adding an optional field is usually safe (on the condition that the reader is tolerant), unknown headers may be ignored under the HTTP standard, and documentation does not affect runtime. Note that adding an **enum value** to the response is different - it is risky because an old client\'s {{switch}} may have no default branch.',
      },
      {
        q: 'What should a client do so that "adding a field" is truly always safe for itself?',
        options: [
          'Check {{Content-Length}} before parsing',
          'Turn off fail-on-unknown-field, use {{@JsonEnumDefaultValue}} for enums, and never assume a field is always present',
          'Lock the schema down and throw on any unknown key',
          'Send an {{X-API-Version}} header with every request',
        ],
        answer: 1,
        explain: 'That is the **tolerant reader**: ignore unknown fields ({{FAIL_ON_UNKNOWN_PROPERTIES = false}}), map unknown enum values to a default, and read fields as if they might be absent. The opposite - locking the schema down and throwing on unknown keys - is how you turn every new server field into an incident.',
      },
      {
        q: 'Why do many teams choose URI versioning ({{/v2/...}}) over header versioning?',
        options: [
          'Because headers cannot carry data',
          'Because the URI is easy to read, easy to log, easy to route at the gateway and cacheable; a version header forces browsers to send a CORS preflight',
          'Because the URI is required by the HTTP standard',
          'Because a version in the URI reduces the number of APIs',
        ],
        answer: 1,
        explain: 'A version in the URI is self-describing, lets you split traffic by version in logs and dashboards, and makes routing/caching simple. A version header ({{X-API-Version}}) keeps the URI clean, but for browser clients it is a custom header → every request triggers an extra OPTIONS preflight, and it is harder to debug by hand.',
      },
      {
        q: 'What is the {{Sunset}} header used for?',
        options: [
          'To announce that the server is shutting down at the end of the day',
          'To state the specific date and time at which an API version stops being served',
          'To ask the client to purge its cache',
          'To mark a response as truncated',
        ],
        answer: 1,
        explain: '{{Sunset}} (RFC 8594) is the absolute point in time after which the endpoint is no longer served. It goes together with {{Deprecation}} and a {{Link}} carrying {{rel="deprecation"}} so the client knows where to migrate. It is a promise to customers, not an infrastructure or cache signal.',
      },
    ],
  },
});
