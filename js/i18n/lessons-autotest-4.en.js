/*
 * English translation of js/data/lessons-autotest.js — task T762. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-006
 */
App.i18n.content({
  'lesson-autotest-006': {
    title: 'API automation with REST Assured: given/when/then, JsonPath, schema, chained requests',
    goals: [
      'Explain why the API suite should be larger than the UI suite and quantify the maintenance cost',
      'Write a REST Assured test that checks the status code, headers and several JsonPaths in the body',
      'Chain two requests (create, then use the id just created) and clean up test data safely when running in parallel',
      'Use Playwright APIRequestContext to prepare a login session for UI tests instead of logging in through the interface',
    ],
    body: `### Why the API layer must be the busiest layer in an automation suite
**An API test** is a program that calls HTTP straight against the backend ({{POST /books}}) and compares the response with what was expected — **no browser is opened, no HTML is rendered, nothing is clicked**. Because it takes the shortcut, it is usually 20–100x faster than a UI test (tens of milliseconds versus several seconds), and because no interface element is involved it **does not break when the designer changes the CSS**. More important: most business bugs live at this layer — wrong validation, wrong money math, a missed permission check, wrong date/time encoding, pagination that drops the last element… The UI is only paint on top.

| | API test | UI test |
|---|---|---|
| Time per test | 20–200 ms | 2–15 s |
| Breaks when the interface changes | no | yes |
| Catches logic/permission bugs | directly | has to go through 5 clicks |
| Maintenance cost per 100 tests | low | highest in the suite |
| Runnable in CI on every commit | easy | smoke only |

The real ratio of a healthy suite: **~70% API, ~25% dev unit tests, ~5% UI E2E**. Keep in the UI only the flows whose bugs show up only when a browser is involved (JavaScript, redirect, upload, iframe).

### given / when / then: reads like an English sentence
~~~java
// REST Assured 5.x (io.restassured:rest-assured) — for illustration, cannot run in the browser
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

given()                                  // GIVEN = preconditions: base url, header, body, auth
    .header("Content-Type", "application/json")
    .body("{ \\"title\\": \\"Effective Java\\" }")
.when()                                  // WHEN = the action: method + path
    .post("/books")
.then()                                  // THEN = the verdict: status, header, body
    .statusCode(201)
    .header("Location", "/books/99")
    .contentType("application/json")
    .body("id", notNullValue())
    .body("title", equalTo("Effective Java"));
~~~

The three keywords are only **sentence structure** for the reader: {{given}} collects everything that is sent out, {{when}} separates the sending part from the receiving part, {{then}} is the chain of asserts — every failing assert throws an {{AssertionError}} right there and stops that test. {{assertThat()}} is an alias of {{then()}}, used when you want to emphasize "from here on it is all asserts".

### JsonPath: addressing the exact cell in the JSON tree
**JsonPath** is a syntax for pointing at one node of a JSON document, the way a CSS selector points at a DOM node: {{data.items[1].title}} = "give me the key data, inside it the key items, the second element of the array, then the key title". REST Assured evaluates the JsonPath over the body and then compares it with a Hamcrest matcher: {{equalTo}}, {{notNullValue()}}, {{hasSize()}}, {{containsString()}}, {{greaterThanOrEqualTo()}}.

To **store a value for later use** (and not only compare it), use {{extract()}}:

~~~java
String id = given().when().get("/books").then().extract().path("data.items[0].id");
int total = given().when().get("/books").then().extract().jsonPath().getInt("total");
Book[] books = given().when().get("/books").then().extract().as(Book[].class);   // map to a POJO
~~~

{{as(Book[].class)}} (object mapping) is convenient but not free: the test gets tied to a Java class, so adding a field means editing the POJO as well. Many teams use only {{path(...)}} for the few values they need, to keep the tests light.

### Why status 200 is not enough: schema validation
The classic trap: a dev renames the field {{title}} to {{name}}. Your JsonPath points at {{title}} → it returns **null**; if you only assert {{statusCode(200)}} the test stays **green**. Schema validation checks the **shape** of the response: which fields must be present, of what type, matching which pattern.

~~~java
// needs the extra dependency rest-assured-json-schema-validator (io.restassured.module.jsv)
given().when().get("/books")
    .then()
    .statusCode(200)
    .body(matchesJsonSchemaInClasspath("schemas/books-list.json"));
// JSON Draft-07 schema checking required + type:
//   "required": ["id", "title"], "properties": { "id": {"type": "integer"}, "title": {"type": "string"} }
~~~

Alongside it are two cheap checks many suites skip: {{contentType("application/json")}} (if the dev returns text/plain the JsonPath still works, but real clients break) and **pagination** checks: {{hasSize(20)}} for the first page, {{data.items[19].id}} exists, and page 2 does not repeat page 1.

### Chained requests and test data cleanup
A real flow: create → read → update → delete. The value used in the next step comes from the previous one, so you must **extract** it, never guess it.

~~~seq
title: Preparing and cleaning test data through the API
actors: Test | API Gateway | Order Service | Database
Test -> API Gateway: POST /orders create order
API Gateway -> Order Service: forwards request with token
Order Service -> Database: insert order row
Database --> Order Service: id = 4217
Order Service --> API Gateway: 201 { id: 4217 }
API Gateway --> Test: 201 and Location header
Test -> API Gateway: DELETE /orders/4217 in AfterEach
API Gateway -> Database: delete or soft delete
note Test..Database: id comes from extract, never hard-coded
~~~

Test data rules (an SDET gets asked these constantly):
- **Each test creates its own data** through the API; never use "the shared test user on staging" — someone else changes the password and 40 tests fail at the same moment.
- **Clean up in {{@AfterEach}}** (or {{@AfterSuite}} for suite-level fixtures), and **clean via API/SQL rather than through the UI**.
- Data with unique constraints (email, phone number) → generate a fresh value per test, for example {{email = "qa-" + UUID.randomUUID() + "@example.com"}}. Random in the **input data** is fine; random is only forbidden in the **expected result**.
- Parallel runs: two threads calling {{DELETE /orders/}} with the same id → one thread gets 404 and fails for no reason. One resource per thread, no shared static state.

### Playwright APIRequestContext: the API serving UI tests
Playwright for Java ships an HTTP client that shares the browser process, which fits **data/login setup** for UI tests without adding REST Assured:

~~~java
Playwright playwright = Playwright.create();
APIRequestContext api = playwright.request()
    .newContext(new APIRequestOptions().setBaseURL("https://api.shop.example/"));

APIResponse login = api.post("v1/login", RequestOptions.create()
    .setHeader("Content-Type", "application/json")
    .setData(Map.of("user", "bean", "pass", "secret123")));      // the Object is serialized to JSON automatically

if (login.status() != 200) throw new IllegalStateException("login failed: " + login.status());
Map<String, Object> payload = (Map<String, Object>) login.json();   // json() returns Map/List
String token = String.valueOf(payload.get("token"));                // token used for the other API calls

Browser browser = playwright.chromium().launch();
BrowserContext fresh = browser.newContext();
// Save the cookies + localStorage right after login so every UI test can reuse them
fresh.storageState(new BrowserContext.StorageStateOptions().setPath(Paths.get("auth.json")));

// Any UI test: open a context with the session already loaded, no login through the interface
BrowserContext reused = browser.newContext(
    new Browser.NewContextOptions().setStorageStatePath(Paths.get("auth.json")));
Page page = reused.newPage();
page.navigate("https://shop.example/cart");
api.dispose();                                                      // close the HTTP client when done
~~~

Two patterns worth learning: (1) **log in once in @BeforeAll and save storageState to a file**, every UI test opens its context with {{setStorageStatePath(Paths.get("auth.json"))}} — that removes 5 seconds of UI login per test; (2) **create the order through the API and let the UI check only the display** — the UI test no longer has to press 12 clicks just to get data.

### When you need a fake server: WireMock and Testcontainers
- **WireMock** (package {{com.github.tomakehurst.wiremock}}): spins up a fake HTTP server so you can test the client without the real service — used when the partner team is slow or not finished yet, or when you need to simulate a 500 or a timeout.
~~~java
stubFor(get(urlEqualTo("/v1/books")).willReturn(aResponse()
    .withStatus(200).withHeader("Content-Type", "application/json")
    .withBody("{ \\"total\\": 0, \\"data\\": { \\"items\\": [] } }")));
~~~
- **Testcontainers**: starts a real Postgres/Kafka in Docker for the integration suite — faster than requesting an environment, and the data is clean after each test class.
- **Contract test** (Pact, OpenAPI): checks that the API provider and the consumer match the same contract before integration — naming it is enough in an interview, unless your team actually uses it.

### Common mistakes
- **Hard-coding base URL / id / token** in the test → the suite only runs on one machine. The base URL must come from an environment variable or a configured {{baseUriPath}}.
- **Comparing the whole JSON body verbatim** ({{equalTo(fullJson)}}): one new field added and tests fail for no reason. Assert only the fields you care about, plus the schema.
- **Asserting timestamps/UUIDs** without normalizing them → the test fails on every run.
- **{{Thread.sleep(2000)}}** to wait for asynchronous data: wrong on both speed and reliability. For consumer flows (Kafka, background jobs) use **Awaitility**: {{await().atMost(Duration.ofSeconds(5)).untilAsserted(() -> assertEquals("DONE", orders.status(orderId)))}} — it polls every 100 ms and fails once the ceiling is reached.
- **Tests that never clean up** → by the third week the suite starts failing on duplicate unique keys, and nobody trusts the report anymore.
- Skipping the **status code check on the cleanup request**: {{delete}} returns 403 (no permission) but nobody looks, so garbage piles up silently.

### Interview connection
Questions you will get: "How do you organize API tests inside your framework?", "How do you check the API contract?", "How do you handle a test that depends on data from an earlier step?", "Why is your UI suite flaky while your API suite is not?". Answer on three layers: **structure** ({{given/when/then}} + base URL taken from config + specs reused through {{RequestSpecBuilder}}), **data** (created through the API, cleaned in {{@AfterEach}}, ids never hard-coded), **reliability** (deliberate asserts, schema validation, Awaitility for asynchronous flows). If someone pushes further with "compare REST Assured with Playwright APIRequestContext" — the straight answer: REST Assured is rich in matchers + schema + object mapping for a dedicated API suite; the Playwright client is convenient because it is already inside the UI suite and shares cookies/headers with the browser context.

> Senior tip: add one "contract" test for every important API: call the endpoint with a minimal payload and assert the **list of required fields** with a schema. That test fails within 3 seconds as soon as a dev renames a field, and it saves the 40 UI tests currently failing in a vague way because a JsonPath returned null. A good API suite does not only prove the feature works — it detects **a broken contract** before that contract breaks the whole frontend.`,
    exercises: [
      {
        title: 'Write your own mini REST Assured: a given/when/then DSL running on a fake HTTP handler',
        prompt: `{{FakeHttp}} is a fake HTTP server: routes is a {{Map}} looked up by the key {{METHOD + " " + path}}, each value being a lambda {{FakeHttp.Handler}} (a functional interface). It is already written, **do not modify it**. A handler returns a {{FakeHttp.Resp(status, headers, body)}} whose body is a {{Map}}/{{List}}/{{String}} — that is JSON **already decoded**, so you do not have to write a JSON parser.

Write the rest of the DSL, imitating REST Assured:

**1.** {{final class M}} — the Hamcrest matchers shrunk down. {{Matcher}} is given: {{boolean test(Object actual)}} and {{String describe()}}.
- {{M.equalTo(expected)}}: true when {{Objects.equals(actual, expected)}}; describe is {{equalTo }} concatenated with the string of expected.
- {{M.notNullValue()}}: true when actual is not null; describe is {{notNullValue}}.
- {{M.containsString(needle)}}: true when actual is a String and contains needle; describe is {{containsString }} concatenated with needle.
- {{M.hasSize(expected)}}: true when actual is a {{Collection}} or a {{Map}} and its number of elements equals expected; describe is {{hasSize }} concatenated with expected.

**2.** {{Json.eval(Object root, String path)}} — evaluate a JsonPath over {{Map}}/{{List}}.
- Split on dots: each token is a key name and may carry trailing {{[index}} suffixes, for example {{data.items[1].title}} or {{[0].id}} (an empty first token = go straight into the array).
- Key on a {{Map}}: take the value; if the current node is **not a Map** the result is null.
- {{[i]}}: applies only to a {{List}}; negative or past the length → null (no exception thrown). A non-numeric index → null.
- On null, stop and return null. A {{path}} with an opening square bracket and no closing one → throw {{IllegalArgumentException}}.

**3.** The DSL chain ({{Rest}}, {{Given}}, {{When}}, {{Then}}) — the skeleton gives the constructors and fields, you write the behavior:
- {{Rest.given(server)}} returns a {{Given}}.
- {{Given.header(name, value)}} stores the header (overwriting by name) and **returns itself**; {{Given.body(rawJson)}} stores the outgoing body and returns itself; {{Given.when()}} returns a {{When}} holding server + headers + body.
- {{When.get(path)}}, {{When.post(path)}}, {{When.put(path)}}, {{When.delete(path)}}: call {{server.handle(METHOD, path, headers, body)}} and wrap the response in a {{Then}}.
- {{Then.statusCode(expected)}}: on a mismatch throw an {{AssertionError}} with the exact message {{statusCode: expected X but was Y}}; on a match return itself.
- {{Then.header(name, matcher)}}: on a mismatching matcher throw an {{AssertionError}} with the message {{header NAME: expected ... but was ...}}.
- {{Then.body(path, matcher)}}: on a mismatch throw an {{AssertionError}} with the message {{PATH: expected ... but was ...}} (the label is exactly the path, with no prefix).
- {{Then.extract(path)}}: return the value at that JsonPath (null when absent). {{Then.response()}}: return the original {{FakeHttp.Resp}}.

No external libraries, no network, no wall-clock time.`,
        hints: [
          'Matcher has two methods, so it is not a functional interface — you cannot write a lambda for it directly. The neat way: one private method that takes desc and a {{Predicate}} and returns an anonymous {{Matcher}} class wrapping them; {{equalTo}}/{{notNullValue}} then shrink to a single line calling that method.',
          'Json.eval: walk the path with {{charAt}}/{{indexOf}}, do not {{split}} on a regex (it loses the information about square brackets). For each token, read the key name up to the next {{.}} or {{[}} character, then process the consecutive {{[i]}} suffixes.',
          'The null rule of JsonPath matters a lot: always return {{null}} instead of throwing when a key is missing or the index is past the array — that is exactly the behavior that makes API tests easy to turn "falsely green", as the body showed.',
          'Then.statusCode compares {{resp.status}}; the other asserts share one private method taking label, actual and matcher so the message always follows the same template {{label: expected M but was A}} — the message template is what the person reading the CI log must recognize in 2 seconds.',
        ],
        explain: `The three design decisions of this exercise are exactly the three decisions of a real API test framework:

1. **{{given}} collects the request, {{when}} marks the send/receive boundary, {{then}} contains asserts only.** Because every assert method returns {{this}}, the chain reads as one sentence and **fails early**: the first {{AssertionError}} stops the test, so the report names exactly the first assert that went wrong — a big difference from soft assertions (lesson 008).
2. **JsonPath returns null instead of throwing.** Your test would pass wrongly if it only checks {{statusCode}}, which is why you always add a {{notNullValue()}} matcher or a schema. This is a real bug, the one that happens when the backend renames a field.
3. **{{extract()}} separates data from judgement.** A chained request is only safe when the id comes from the previous response; if you hard-code {{/notes/101}}, move to another environment and the suite dies on the very first test.

{{FakeHttp}} also simulates the two cases an API test must be able to tell apart: **404** (no route at all) and **405** (the path exists but the method is wrong). A suite that only asserts {{isSuccess}} collapses two completely different bugs into one identical shade of red.`,
      },
    ],
    check: [
      {
        q: 'Why is the API suite usually larger than the UI suite in a standard automation setup?',
        options: [
          'Because API tests do not need asserts',
          'Because API tests are 20–100x faster, do not break when the interface changes, and catch business bugs directly',
          'Because UI tests cannot run in CI',
          'Because APIs are always stable and never change',
        ],
        explain: 'It goes straight over HTTP, so no rendering time is spent and nothing depends on CSS/DOM; most logic-permission-money bugs live at this layer. The UI keeps only the flows whose bugs appear only when a browser is involved.',
      },
      {
        q: 'A dev renames the field title to name. The test only has given().when().get("/books").then().statusCode(200) and body("title", equalTo("x")) — what happens?',
        options: [
          'The test fails because JsonPath cannot find the field',
          'The test still passes because the field returns null',
          'The test fails for the right reason, but only once schema validation exists; with equalTo it fails because null is not "x"',
          'REST Assured throws an exception at compile time',
        ],
        explain: 'A JsonPath for a missing field returns null, and equalTo("x") compared against null fails — so this test is still saved. The dangerous ones are tests that assert only statusCode, or only notNullValue on some other field: they stay green even though the contract is already broken. Schema validation catches the rename at the shape level.',
      },
      {
        q: 'In Playwright for Java, how do UI tests avoid logging in through the interface in every single test?',
        options: [
          'Call Thread.sleep(5000) after login so the session has time to be stored',
          'Log in once (API or UI) in @BeforeAll, save storageState to a file, and open each BrowserContext with setStorageStatePath',
          'Use the same BrowserContext for all tests so the cookies are kept',
          'Skip the login because staging does not require it',
        ],
        explain: 'storageState snapshots cookies + localStorage, reloads them in a few milliseconds and still gives every test its own isolated context. Sharing one context makes data and browser state step on each other when tests run in parallel.',
      },
      {
        q: 'A flow that POSTs an order and then DELETEs exactly that order — where should the id come from?',
        options: [
          'Hard-code id = 4217, because staging is always the same as production',
          'extract().path("id") from the POST response, then use it for the DELETE',
          'Read the id from the service log',
          'Give each test its own executor',
        ],
        explain: 'Data that feeds the next step must come from the previous response (extract) — that is the only way it runs on every environment and in every execution order. An id in a log has no contract, and an executor has nothing to do with this.',
      },
    ],
  },
});
