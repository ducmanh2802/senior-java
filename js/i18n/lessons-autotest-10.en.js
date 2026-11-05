/*
 * English translation of js/data/lessons-autotest.js — task T768. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-012
 */
App.i18n.content({
  'lesson-autotest-012': {
    title: 'Service virtualization: WireMock, Playwright route, Testcontainers, and test data builder',
    goals: [
      'Explain what service virtualization is and when it is cheaper (or more expensive) than calling the real system',
      'Write a WireMock stub by method + path + header, verify the call count, and inject errors (delay, fault) to test error-handling branches',
      'Intercept the network right in Playwright with {{page.route}} to test UI without a backend',
      'Know when to use Testcontainers instead of a stub, and the trade-offs',
      'Write a test data builder so each test has its own data, running in parallel without stepping on each other',
    ],
    body: `**Summary:** **Service virtualization** means replacing a real system with a fake one that **answers using the correct protocol**, so your code cannot tell the difference. Use it when a dependency is **slow, expensive, unstable, or outside your control** (payment gateway, SMS carrier, a partner maintaining at 2 AM), and when you need situations **you cannot create on the real system**: "bank returns decline", "partner times out after 30 seconds", "returns 500". Standard Java tools are **WireMock** (fake HTTP), **Playwright route** (intercept requests right in the browser), **Testcontainers** (spin up a *real* system in Docker when you need real behavior), plus **test data builder** so data does not become a bottleneck.

### Everyday example
A restaurant wants to test the table-booking process. Two ways: (a) wait for real customers to call — you cannot schedule the time, you cannot make them say "no" to test the "fully booked" branch, and every test call costs money; (b) hire an **actor** to play the customer, holding a script: "first ask for a table for four, if rejected switch to a table for two". Way (b) is service virtualization: communication is exactly the same, but **you choose the lines**, even the worst ones.

### WireMock: stub and verify
**WireMock** ({{com.github.tomakehurst:wiremock-standalone}}, or {{wiremock-jre8}} for older versions) is an **embedded HTTP server** (Jetty) — you start it in the test, point the client/REST Assured base URL at it, and describe "who asks what, answer what". It has two modes: running in the JVM ({{WireMockServer}}) or running as a standalone process ({{java -jar wiremock-standalone-3.x.x.jar --port 8089}}) so many tests/devs can share it.

~~~java
import static com.github.tomakehurst.wiremock.client.WireMock.*;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;

@WireMockTest(httpPort = 8089)          // JUnit 5: auto start + auto stop WireMock
class PaymentGatewayTest {

    @Test void hangs_when_gateway_is_slow() {
        stubFor(post(urlEqualTo("/v1/charge"))
                .withHeader("Authorization", equalTo("Bearer test-token"))
                .inScenario("charge")                    // stateful: result follows the step
                .whenScenarioStateIs("Started")
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\\"txn\\":\\"T-1\\",\\"status\\":\\"PENDING\\"}"))
                .withFixedDelay(2500));                  // to test client timeout

        // Log: client calls http://localhost:8089/v1/charge
        verify(1, postRequestedFor(urlEqualTo("/v1/charge"))
                .withHeader("Idempotency-Key", matching("^[0-9a-f-]{36}$")));
        // verify catches the error without asserting the result: client sends 2 duplicate requests
    }

    @Test void gateway_error_is_handled() {
        // Only the bank-declined branch -> app must show user-friendly error
        stubFor(post(urlEqualTo("/v1/charge"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("{\\"status\\":\\"DECLINED\\",\\"code\\":\\"INSUFFICIENT_FUNDS\\"}")));
    }

    @Test void connection_reset_is_handled() {
        stubFor(post(urlEqualTo("/v1/charge"))
                .willReturn(aResponse().withFault(com.github.tomakehurst.wiremock.common.SingleFaultType.CONNECTION_RESET_BY_PEER)));
    }
}
~~~

In {{verify}}, the first number is the **expected exact count**. Three commonly used URL matchers: {{urlEqualTo}} (exact), {{urlPathEqualTo}} (ignore query string), {{urlMatching}} (regex). {{verify}} + {{findAll(postRequestedFor(...))}} is the only way to test "the client must send **exactly one** payment request" — a duplicate-order bug is very costly and an assert on response can never catch it.

WireMock also has **record mode**: run once for real with the real system, record every request/response into stub files, then replay in CI. Useful when a partner does not provide a test environment, but you must **mask sensitive data** before committing.

### Intercepting the network in Playwright: page.route
For UI tests you do not need to start a server: Playwright intercepts the request right in the browser and returns the content itself.

~~~java
// Mock the page's API: every time the page calls /api/orders it receives the data we choose
page.route("**/api/orders", route -> route.fulfill(
        new Route.FulfillOptions()
                .setStatus(200)
                .setContentType("application/json")
                .setBody("[{\\"id\\":\\"O-1\\",\\"status\\":\\"PAID\\"}]")));

// Corrupt the JS request: to test the connection-lost warning
page.route("**/analytics.js", Route::abort);

// Pass storageState so each context is already logged in, no need to click the login form
BrowserContext ctx = browser.newContext(
        new Browser.NewContextOptions().setStorageStatePath(java.nio.file.Paths.get("qa/storage-state.json")));
~~~

Use {{page.route}} when you need to **force the UI to render a rare state** (order completed, 0 slots left, error banner), because building that data via the real API can take 5 minutes of testing and depends on business logic. **Do not** use it to test backend correctness — the UI will PASS even if the server is dead, because the UI never calls the server.

### When to stub, when to use a real system
| Situation | Choose | Why |
|---|---|---|
| Payment gateway/SMS/OTP/third party | **stub** (WireMock) | charged per request, no stable sandbox, need to test error codes |
| Relational DB, Kafka, Redis of **your own product** | **Testcontainers** | real behavior (SQL dialect, trigger, partition, eviction) that stubs cannot reproduce |
| Another internal service in the same system | test **real** at the integration layer, stub at unit/UI | stub hides integration bugs: schema change, auth change, timeout |
| Third party only to **read display data** | stub, or {{page.route}} | fast, deterministic |
| Suspected contract break (partner changed fields) | **contract test**, not stub | stub is written from **a guess by the QA team** — guess wrong, CI green, production red |

Interview takeaway: *stub answers "how does my code handle response X"; real test answers "does X actually return that answer"*. You need both, and they sit at two different layers of the pyramid.

### Testcontainers: Docker for tests
**Testcontainers** ({{org.testcontainers}}) starts real containers while the test runs, then removes them when done — you have real Postgres/Kafka/Selenium without anyone installing manually.

~~~java
@Testcontainers
class OrderRepositoryIT {
    @Container
    static final PostgreSQLContainer<?> DB = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("shop")
            .withUsername("qa")
            .withPassword("qa");        // just the container's credential, not a real secret

    @Test void unique_index_blocks_duplicate_order() {
        // DB.getMappedPort() returns the real port Docker assigned (avoid port conflicts)
        try (Connection c = DriverManager.getConnection(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword())) {
            // insert 2 orders with the same idempotency key -> the 2nd must fail with unique violation
        }
    }
}
~~~

Key point: each class has its own container if you declare **static** in the class (JUnit reuses it for the whole class — much faster than creating in {{@BeforeEach}}); {{withReuse(true)}} keeps the container between runs on the dev machine but is **off by default on CI**; to make multiple services talk to each other, share one {{Network.newNetwork()}} or use {{ComposeContainer}}/{{DockerComposeContainer}} to run a compose file. The trade-off: you need a Docker daemon on the machine and runner, it takes 1–10 seconds to start, and if you do not clean up, the CI disk fills up with old image layers.

### Test data builder
Data is what makes stub/containers still fail when running in parallel. The builder lets you declare intent and handles the rest:

~~~java
static OrderDTO anOrder() {                     // "Object Mother": default valid
    String key = UUID.randomUUID().toString();
    return new OrderDTO("qa-" + key, "Hanoi", 199000, Status.DRAFT, key);
}

@Test void paid_order_shows_receipt() {
    OrderDTO o = anOrder().toBuilder().status(Status.PAID).build();   // only adjust what is needed
    String id = orderApi.create(o);                                   // create via API, not via UI
    page.navigate(config.baseUrl() + "/orders/" + id);
    assertThat(page.locator("#receipt")).isVisible();
}
~~~

Three principles: **each test creates its own data** (do not rely on "order with code ORD-123 that someone seeded"), **unique key** ({{UUID}}/suffix by test name) to run in parallel without unique constraint conflicts, and **idempotent cleanup** at {{@AfterEach}} — clean up via API/SQL by your own key, do not delete the whole table.

### Timeline of one test with virtualization

~~~seq
title: Payment test with WireMock and Testcontainers
actors: Test | App | WireMock | Container
Test -> Container: start Postgres and seed schema
Test -> App: call the order creation service
App -> WireMock: POST /v1/charge with Bearer token
WireMock --> App: 200 PENDING after 2500ms delay
App --> Test: return the order code
Test -> WireMock: verify exactly 1 call
Test -> Container: read the orders table and match
note Test..WireMock: stub allows injecting 500 errors and timeouts
~~~

### Four common mistakes
- **Stub only returns success.** You test the happy path and skip exactly the most fragile part. Every error flow in the business logic should have a stub returning 402/500/timeout.
- **Stub matches regex too broadly**: {{urlMatching("/.*")}} swallows every request, so a bug "client calls the wrong URL" still passes. The tighter the match, the better.
- **No verify**: the stub returns correctly but the client calls 3 times (non-idempotent retry) — no assert sees it.
- **Commit a stub containing real data** (phone number, ID card, token) from record mode. Mask before writing the file.
- **Using stub for your own DB**: schema change, missing migration, trigger — all silent until production.

### Interview relevance
- "Your test depends on the payment gateway, how do you handle it?" → WireMock stub for the money flow, real sandbox for one smoke test per night, contract test to catch partner API changes; also mention how to test timeout with {{withFixedDelay}}/{{withFault}}.
- "How is a stub different from a mock in unit testing?" → mock/stub at the unit layer (Mockito, one object), WireMock at the **HTTP protocol** layer so it works even when testing over the network, for both UI and API tests.
- "When to use Testcontainers instead of a stub?" → when real system behavior is what is being tested (SQL, Kafka, Redis eviction). You can explain the trade-off: needs Docker, slower than a stub, but catches integration bugs.
- "How to test UI when the backend is not done yet?" → Playwright {{route.fulfill}} builds JSON per the API contract (OpenAPI), in parallel with writing API tests — this is how QA and dev work independently.

> Senior tip: the selection rule I often use: **outside the organization stub, inside the organization real**. The only exception for "real" is when you cannot control its pace (partner limits 5 requests/minute) or when you need a rare error state. And a valuable tip: place **a few deliberately broken stubs** into the nightly suite — for example always one stub returning 500 for the shipping service — to ensure error-handling code is **never** forgotten. A stub that is always green is a stub that ruins itself.`,
    exercises: [
      {
        title: 'StubServer: register stub by method + url (exact/regex) + header, later stub wins, verify call count',
        prompt: `Write {{StubServer}} simulating the core of WireMock: stub table, request matching, and a log for verify. Do not open a socket, do not use the network, do not read the current time.

**1) Class {{StubResponse}}**: constructor {{StubResponse(int status, String body)}} and two getters {{status()}}, {{body()}}.

**2) Class {{StubServer}}**:
- {{void on(String method, String url, StubResponse response)}}: register a stub matching {{url}} **verbatim** (compared with {{equals}}).
- {{void on(String method, String url, Map<String, String> requiredHeaders, StubResponse response)}}: as above but **matches only** when the request has every header pair in {{requiredHeaders}}. Header names are compared **case-insensitively**, values **exactly**. {{requiredHeaders}} being {{null}} or empty = no header required.
- {{void onUrlMatching(String method, String urlPattern, StubResponse response)}}: {{urlPattern}} is a **regex matching the whole string** ({{Pattern.matches}} semantics — the whole string must match, not a part).
- {{StubResponse handle(String method, String url, Map<String, String> requestHeaders)}}: find the matching stub. **The stub registered later wins** when multiple stubs match — regardless of exact or regex. If no stub matches, return the standard {{404}} stub whose body is exactly the string {{NOT_STUBBED}}. {{method}} or {{url}} is {{null}}: treat as no match **and do not log**. Every valid request (matching or not) is logged.
- {{List<String> received()}}: **a copy** of the log, each element in the form {{METHOD + " " + url}} (method and url verbatim as the caller passed), in receive order.
- {{int requestCount()}}: number of log elements.
- {{int callCount(String method, String url)}}: number of log entries with method matching **case-insensitively** and url matching **exactly**.
- {{boolean verify(String method, String url, int expectedCount)}}: {{callCount(method, url) == expectedCount}}.
- {{void resetRequests()}}: clear the log, **keep the stub table**.

Example:

~~~text
onUrlMatching("GET", "/api/.*", r503)
on("GET", "/api/orders", r200)              -> registered LATER so WINS for /api/orders
handle("GET", "/api/orders", null)          -> r200
handle("get", "/api/customers", null)       -> r503  (method case-insensitive)
handle("GET", "/api/orders/77", null)       -> r200? NO: exact "orders" != "orders/77"
                                              -> regex "/api/.*" registered EARLIER still matches
                                              -> r503
handle("POST", "/api/orders", null)         -> 404 NOT_STUBBED
requestCount()                              -> 4
~~~

Boundary note: a stub with {{requiredHeaders}} where the request is missing a header (or {{requestHeaders}} is {{null}}) does **not match**, and if it is the only stub for that URL the result is 404. Classic trap: sorting by registration order by iterating from the first element — then the old stub wins, and your CI returns the response of the stub "from last year".`,
        hints: [
          'A stub is a small object holding 5 things: method, url (null if regex), pattern (null if exact), required-header map, and response. Registration = append to the end of a {{List<Stub>}}.',
          'To make "later stub wins": iterate the stub list **backward** from {{stubs.size() - 1}} down to 0 and return as soon as it matches. Forward iteration is wrong already at the first condition of the spec.',
          '{{Pattern.matches(pattern, url)}} matches the **whole** string, so {{"^/a$"}} matches {{"/a"}} (the whole string is just /a) and does NOT match {{"/ab"}}. This differs from {{matcher(url).find()}} — using {{find}} would swallow requests you do not want.',
          'Header: for each required pair, look up in the request header by name **case-insensitively** ({{equalsIgnoreCase}}) then compare the value exactly; missing name or different value means the stub does not match. {{requestHeaders == null}} means there are no headers, so a stub requiring headers will miss.',
          'The log should be written **before** looking up the stub, because of the requirement "404s are also counted". If you only log on match, {{verify}} is wrong starting from the first test.',
          'Remember to return {{new ArrayList<>(log)}} at {{received()}} and {{log.clear()}} (not assigning a new list) at {{resetRequests()}} — otherwise the caller can modify the internal log of the server.',
        ],
        explain: `Three design decisions make this exercise a realistic model of WireMock.

**First: iterate backward.** WireMock picks a stub by priority (matching specificity), but many lighter frameworks use "later configuration overrides earlier". The spec chooses the second rule because it is what gives QA the biggest headache in practice: you add a new stub for the same path and **do not understand why the test still receives the old response** — because the old stub is at the head of the list and is iterated first. Backward iteration makes behavior match the intuition "what I just registered must take effect right away".

**Second: {{equals}} for exact, {{Pattern.matches}} for regex.** This difference is the source of the "stub swallows requests" bug: {{urlMatching("/api")}} in {{find}} semantics matches {{"/api/orders"}}, {{"/apix"}}, even {{"/my/api"}}, so the test cannot detect the client calling the wrong path. {{Pattern.matches}} requires the whole string to match, so the pattern must be written as {{"/api/.*"}} — tighter, and the reason WireMock has the three families {{urlEqualTo}}/{{urlPathEqualTo}}/{{urlMatching}}: you must choose **a strictness level just right**.

**Third: log even non-matching requests.** {{verify}} exists to answer the question an assert on response can never answer: "how many times did the client call the partner?". Duplicate-order bugs, non-idempotent-retry bugs, "send two confirmation emails" bugs are only visible by counting requests. Skipping 404s in the log makes the test "client must call the API exactly once" meaningless when the client calls the wrong URL.

**Missing header falls through to another stub** is the most common situation in the exercise and also a lesson in priority: stub {{role=admin}} returning 403, registered later, wins when a header is present, but when the request **has no** header it does not match, and the request falls through to the general stub returning 200 — exactly the WireMock mechanism for writing the "guest vs admin" scenario. If you implement it as "pick the stub with the most conditions", you invert this result; do not, stick to the later-registered-wins rule.

Common mistakes when doing the exercise: (1) saving {{requiredHeaders}} directly instead of copying — the registrant's map changes later, and the stub changes with it; (2) forgetting {{s.method == null}} in {{fits}} so {{null}}.equalsIgnoreCase throws NPE; (3) splitting {{callCount}} with {{split(" ")}} — a URL with spaces ({{"/q?key=a b"}}) breaks, you must cut at the **first** space with {{indexOf}} then take the rest; (4) using {{==}} to compare {{StubResponse}} — here the test **does** check {{got == ok}} because returning the exact instance proves registration, so do not construct a new {{StubResponse}} on every match.`,
      },
    ],
    check: [
      {
        q: 'The payment gateway offered by the partner has only an unstable sandbox and charges per request. Which strategy is most reasonable for a regression suite running on every commit?',
        options: [
          'Call the real sandbox for every test to ensure authenticity',
          'Stub with WireMock for most tests, add a few real tests running nightly, plus contract tests to catch partner API changes',
          'Disable payment-related tests',
          'Call the real sandbox but retry 5 times on failure',
        ],
        explain: 'Tests per commit must be fast, deterministic, and cheap → stub. Real tests are still needed, but at a lower frequency (nightly) to detect sandbox/contract changes. Retrying 5 times just turns instability into slowness, and hides real integration bugs.',
      },
      {
        q: 'Compare {{urlMatching("/api")}} of WireMock with {{Pattern.matches("/api", url)}} — which difference is most easily confused?',
        options: [
          'No difference, both match the whole string',
          'The find/partial-match one will also match paths containing "/api" in the middle or at the end, so the stub swallows wrong requests',
          'The regex only matches when there is a query string',
          'The find one is slower, making tests flaky',
        ],
        explain: 'Partial matching makes the stub "correctly" answer even wrong requests, and the test still passes even though the client calls a nonexistent URL. This is why you should write anchored patterns ({{"/api/.*"}}, {{"/v1/charge"}} exact) and why WireMock splits {{urlEqualTo}}/{{urlPathEqualTo}}/{{urlMatching}} into three families.',
      },
      {
        q: 'Why is {{verify}}/counting requests indispensable, even when the response is already asserted?',
        options: [
          'Because the stub response is always the same, so there is nothing to assert',
          'Because the costliest bugs lie in the count and content of what the client sends (paying twice, missing Idempotency-Key) — things that do not show in the response',
          'Because verify is the only way to check HTTP status',
          'Because WireMock automatically fails if you do not call verify',
        ],
        explain: 'Service virtualization controls **your input**, not just the output. Duplicate-order bugs, non-idempotent retries, missing token headers — the client still receives 200 and the response test is still green. Verify + {{findAll}} catches them.',
      },
      {
        q: 'When to choose Testcontainers (real Postgres/Kafka in Docker) instead of a stub?',
        options: [
          'When the test needs real behavior of that system: SQL dialect, unique constraints, triggers, Kafka partitions, Redis eviction',
          'When you want the test to run as fast as possible',
          'When CI has no Docker',
          'When the test only reads data for display',
        ],
        explain: 'A stub is written from **a guess by the QA team**, so it never catches real integration bugs (schema change, missing migration, locking behavior). Testcontainers gives a real system at the cost of: needing a Docker daemon, 1–10 seconds to start, and cleaning up container images on the runner.',
      },
    ],
  },
});
