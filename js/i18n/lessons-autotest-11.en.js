/*
 * English translation of js/data/lessons-autotest.js — task T769. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-013
 */
App.i18n.content({
  'lesson-autotest-013': {
    title: 'Mocking the network in UI tests with page.route: block requests, return fake JSON, inject 500/timeout, replay HAR',
    goals: [
      'Explain which kinds of HTTP requests a web page emits and why UI tests end up depending on them',
      'Write page.route with a glob pattern to fulfill fake JSON, abort on a lost connection, continue for a real call',
      'Inject three failure situations (500, network error, slow until timeout) without any cooperation from the backend',
      'Know HAR replay for testing the UI when the backend is not finished yet, and be able to name its risks',
      'Clearly separate when mocking is reasonable and when calling the real backend is mandatory',
    ],
    body: `**Summary:** When it opens a web page, the browser does not "display the page" — it **sends dozens of HTTP requests** (fetch the HTML, then JS/CSS/images, then AJAX calls to the API for data). **Mocking the network in a UI test** = intercept one request right at the browser layer and return content you chose yourself, never letting it reach the server. Playwright does this with {{page.route(pattern, handler)}}: {{pattern}} is a **glob** naming the URL to intercept, {{handler}} is your code that decides the fate of the request — {{fulfill}} (you return fake JSON), {{abort}} (fake a lost connection), {{continue}} (let the real call go through), {{fallback}} (hand it to a route registered earlier). The biggest value: you can force the UI to draw **rare states or broken states** (an order that was refunded, an API returning 500, a flaky connection), which is very slow or flatly impossible to build with real data. The price: the UI test now only proves "the UI renders correctly from the data I handed it" — it does **not** prove that the server produces that data.

### What requests a web page makes, and why that is the weak point of the test
An **HTTP request** = a message like "GET /api/orders?status=new" that the browser sends to the server; a **response** = the reply message, made of a **status code** (200 = success, 4xx = error on the caller side, 5xx = error on the server side) and a **body** (usually **JSON**: a text format that writes structured data as "name": value pairs, for example an order with id "O-1" and total 199000).

On an SPA page (single page app — React/Vue/Angular), the usual flow is:

~~~text
Browser            API server
    |  GET / (HTML)     |
    | ----------------> |   <html><div id=root></div><script src=app.js>
    |  GET /app.js      |
    | ----------------> |
    |  GET /api/session |   < 200 {user, role}   (AJAX/fetch: JS calls the API after the page is already open)
    |  GET /api/orders?status=new
    | ----------------> |   < 200 [ {...}, {...} ]
    |  GET /logo.png    |
    ~~~~~~~~~~~~~~~~~~~~~
    The UI draws what it got from /api/orders, not what is "actually true"
~~~

The traditional UI test is a hostage of that chain in three places: (1) **data** — to see "an order that was refunded" you need an order that was refunded, which means walking the whole business flow first; (2) **failures** — nobody knows how to "make" the server return 500 at 2 AM when CI runs; (3) **speed** — every real request adds network latency and another chance of flakiness (passing sometimes, failing other times). Network mocking cuts those three shackles by putting a **referee** inside the browser itself: the request passes through your hands before anything is decided.

### page.route: the shape of the code
In Playwright for Java the handler takes **two** parameters: {{route}} (controls the fate of the request) and {{request}} (information about the intercepted request).

~~~java
// Intercept the order-list API: every time the page calls **/api/orders* it gets the JSON WE chose
page.route("**/api/orders*", (route, request) -> route.fulfill(
        new Route.FulfillOptions()
                .setStatus(200)
                .setContentType("application/json")
                .setBody("[{\\"id\\":\\"O-1\\",\\"status\\":\\"REFUNDED\\",\\"total\\":199000}]")));

page.navigate("https://shop.test/orders");
// The UI draws the "Refunded" row without needing any server at all
~~~

The four fates of a request:

| Call in the handler | What happens | Use it when |
|---|---|---|
| {{route.fulfill(options)}} | Playwright builds the response itself (status, header, body). The real server **never knows** the request existed | building data, building error codes |
| {{route.abort()}} or {{abort(AbortOptions().setErrorCode("timedout"))}} | the request dies exactly like a cut connection / DNS failure / timeout → the page JS falls into its {{catch}} | testing the offline warning, the Retry button |
| {{route.continue_()}} | let it through as usual: send it to the real server ({{continue}} is a Java keyword, so the API is named {{continue_}}) | letting the rest of the page run for real |
| {{route.fallback()}} | skip this handler and let the handler **registered earlier** decide | locally "override" one URL while keeping the general rule |

### Glob: how Playwright writes "which URL"
{{page.route}} uses a **glob**, not a regex. Three special characters and one priority rule:

~~~text
**            anything, INCLUDING slashes /        **/api/**        -> everything under /api/
*             anything, but NEVER across a slash   /api/*/items     -> exactly one middle segment
?             EXACTLY one character, not a slash   /v?/list         -> /v1/list ok, /v12/list not
other chars   matched literally (the dot . is an ordinary character too)
~~~

*Priority rule:* when several routes match the same URL, **the route registered later wins**. This is the number one source of confusion: you add {{page.route("**/api/orders", ...)}} on line 50 without knowing that line 120 registers a general {{**/api/**}} route — so the handler that actually runs is the one you *were not looking at*. Therefore: register routes **before** {{page.navigate}} (once a request has already flown out you cannot intercept it), put general routes first and specific routes after, and call {{page.unroute(glob)}} when cleaning up. {{context.route}} applies to every page in the context — handy for "block all analytics for the whole suite", but harder to trace.

### Injecting failures — the part that makes mocking worth it
~~~java
// 1) Server error: the UI must show "Could not load the list" + a Retry button
page.route("**/api/orders*", (route, request) -> route.fulfill(
        new Route.FulfillOptions().setStatus(500).setContentType("application/json")
                .setBody("{\\"code\\":\\"ORDER_SERVICE_DOWN\\"}")));

// 2) Lost connection: the request dies like the real thing, the page JS is forced into the catch branch
page.route("**/api/**", (route, request) -> route.abort());

// 3) Slow until timeout: abort with error code timedout to simulate a network timeout
page.route("**/api/checkout", (route, request) ->
        route.abort(new Route.AbortOptions().setErrorCode("timedout")));

// 4) Let the call go through for real, but peek at the request to debug
page.route("**/api/**", (route, request) -> {
    System.out.println(request.method() + " " + request.url());
    route.continue_();
});
~~~

Writing {{Thread.sleep(3000)}} in the handler to "make it slow" also simulates the case, but it **occupies the dispatch thread** and adds a flat 3 seconds to the test; if what you want to test is timeout logic, {{abort("timedout")}} is cheaper and closer to the real meaning. If you want to test the branch "the request got halfway and then the line broke", a mock cannot do it — that is the integration layer's job.

### HAR replay: letting the UI run on the "recording" of one real session
**HAR** (HTTP Archive) is a JSON file that records an **entire real browsing session**: every request with its URL, headers, status and response body. Playwright can record it ({{setRecordHarPath}} when creating the context) and play it back ({{page.routeFromHAR(Paths.get("qa/recorded.har"))}}): whichever URL the page calls, it gets exactly the content that was recorded, with no server at all.

~~~java
// Record: the context writes every network call into a HAR file
Browser.NewContextOptions rec = new Browser.NewContextOptions()
        .setRecordHarPath(Paths.get("qa/har/checkout-session.har"));
// Replay: every time the test opens the page, requests are answered from the HAR file
page.routeFromHAR(Paths.get("qa/har/checkout-session.har"));
~~~

Use it when: the backend is not finished but you already have a recording from the dev environment, or you need to reproduce a production session that hit a bug. Risks: a HAR is a **photograph of the past** — the API schema changes, the UI keeps drawing the old data and the test stays green; a HAR also tends to contain tokens/PII, so it must be scrubbed before you commit it.

### When to mock, when the real backend is mandatory
| Goal of the test | Choose | Why |
|---|---|---|
| "does the UI draw the REFUNDED state correctly", "does a toast appear when the API returns 500" | **mock** | rare or broken states: you need them deterministic and cheap |
| "after placing an order, does it land in the DB, is stock decremented" | **real backend** (API test/integration) | the mock returns data that you wrote → the test cannot see the server being wrong |
| Checking the **contract** between FE and BE (field names, data types) | **real + schema check** | a mock matches **QA's guess**; guess wrong and CI is green while production is red |
| Flows with real money / OTP / payment gateway | stub the third party, keep everything else real | you must not call the real one, but your own integration still has to be tested |
| Smoke before release | **real, no mock at all** | the whole point of a smoke test is proving that the real system is alive |

The mantra: *a mock answers "how does my code behave when it receives answer X"; a real test answers "does X actually return that answer"*. Never let a UI test mock **the entire** API and then assert "the order was created successfully" — you have just tested the JSON you wrote yourself.

### The path of one mocked request inside a test

~~~seq
title: UI test using page.route
actors: Test | Browser | Handler | Backend
Test -> Browser: page.route with glob and handler
Test -> Browser: page.navigate to /orders
Browser -> Handler: GET **/api/orders*
Handler --> Browser: fulfill fake JSON status 200
Handler -> Backend: continue_ when the call is allowed
Backend --> Browser: 200 real data
Browser --> Test: UI draws the data we picked
note Handler..Backend: the mock decides before the server knows a request exists
~~~

### The mistakes people keep hitting
- **Mocking the whole system and calling it an "end-to-end" test.** The test name says E2E, the code says "nobody talks to anybody". Keep mocks for the rare branches; for the flow the business lives on, call the real thing (or run it at the API layer).
- **Registering the route after navigating.** The page's first request has already flown; the UI renders real data and the test fails in a way nobody understands. Routes always come before navigation.
- **A glob that is too wide**: {{**/*}} also blocks images, fonts and scripts → the page falls apart and a rendering problem shows up as a test failure. Block only the API URLs you actually need.
- **A mock body that drifts from the real schema.** Hand-writing JSON makes it easy to misspell a field name or drop one; some time later FE changes the contract, the mock stays old, and the test is green for no good reason. Generate mocks from OpenAPI/JSON Schema, or from a scrubbed HAR file.
- **Forgetting that a route applies only to the current page**: create a new page inside the same test and the old route no longer applies; only a route attached to {{context}} covers every page.

### Interview connections
- "How do your UI tests avoid depending on the backend?" → {{page.route}} for display data plus the error branches, combined with storage state so you never have to log in again; say explicitly which parts still have to be real.
- "How do you test the lost-connection warning?" → {{route.abort("timedout")}} or {{abort()}}, not {{Thread.sleep}}.
- "The backend is not finished — what does QA do?" → build mocks from the OpenAPI spec ({{route.fulfill}}) or replay a HAR, in parallel with writing API tests; add the drift risk.
- "Can mocks fool CI?" → yes, and that is exactly why every pipeline needs one smoke test with no mock at all.

> Senior tip: standardise on one helper shaped like {{mockApi(page, "**/api/orders", 200, json)}} instead of scattering {{page.route}} all over the tests, and **commit the mock JSON files next to the OpenAPI spec** so that when the contract changes, the mock changes with it. The most valuable trick: every UI suite should contain **one test that deliberately mocks a 500 and one that mocks a timeout** — the error branch is the one developers forget, and if your suite never walks through it, it rots.`,
    exercises: [
      {
        title: 'RouteTable: match URLs by glob (**/* and ?), the later-registered route wins, no match means continue, count matches per glob',
        prompt: `Write {{RouteTable}} — exactly the core part of {{page.route}}: a route table, URL matching by glob, choosing the latest registered route, and counters for debugging. Do not open a socket, do not call the network, do not read the real time.

**Glob semantics** (same as Playwright, no escaping):
- {{"**"}}: any string of characters, **allowed** to contain the slash {{"/"}}, including the empty string. Two or more consecutive stars count as one {{"**"}}.
- {{"*"}}: any string of characters, **not allowed** to contain {{"/"}}, including the empty string.
- {{"?"}}: exactly **one** character, and that character must not be {{"/"}}.
- Every other character (including {{.}} and {{:}}) is matched **literally**.

**API that must exist:**
- {{void route(String glob, String action)}}: add one route at the **end** of the table. {{action}} is only a string label (e.g. {{"abort:failed"}}); nothing has to be interpreted.
- {{void unroute(String glob)}}: remove **every** route whose glob is exactly equal to {{glob}} (compare with {{equals}}).
- {{String dispatch(String url)}}: return the {{action}} of the route that **matches and was registered last**. If no route matches, or {{url}} is {{null}}: return the string {{"continue"}}.
- {{int hits(String glob)}}: the number of times {{dispatch}} returned the action of a route whose glob is exactly equal to {{glob}}. Counting is **per glob**, so two routes sharing a glob share one counter. The number is **not** lost when {{unroute}} runs.
- {{int unmatched()}}: the number of times {{dispatch}} found no matching route at all (including calls where {{url == null}}).

Example of the behavior:

~~~text
route("**/api/*",     "fulfill:generic")
route("**/api/orders", "abort:failed")        ; registered LATER, so it WINS

dispatch("https://x.test/api/orders")          -> abort:failed
dispatch("https://x.test/api/cart")            -> fulfill:generic
dispatch("https://x.test/app/main")            -> continue      (unmatched = 1)
hits("**/api/orders")                           -> 1
hits("**/api/*")                                -> 1
unroute("**/api/orders")
dispatch("https://x.test/api/orders")          -> fulfill:generic (falls back to the earlier route)
hits("**/api/orders")                           -> 1 (the old count is not reset)
~~~

Implementation hint: represent each route with a small record (glob + action); {{dispatch}} walks the table **from the start to the end** and keeps the last element that matched. The genuinely hard part is the glob matcher — the classic "backtracking pointers" algorithm is only correct when {{*}} can swallow every character; here {{*}} is blocked by {{/}}, so it gives **wrong** results. Walk a state table {{can[i][j]}} = "the first i tokens match the first j characters", or the equivalent two-row {{boolean[]}} memory.`,
        hints: [
          'Represent each route with a {{private static final class Entry}} holding two final fields (glob, action), kept in an {{ArrayList<Entry>}} in registration order. {{dispatch}} walks forward and assigns {{winner = e}} every time it sees a matching route — after the loop, {{winner}} is exactly the route registered last.',
          'For counting per glob use a {{Map<String, Integer>}} with {{counters.merge(glob, 1, Integer::sum)}}; {{hits}} is {{counters.getOrDefault(glob, 0)}}. Do not count by action: two routes sharing a glob must share one counter.',
          'Match the glob with a state table. Read {{can[i][j]}} as "the first {{i}} tokens of the pattern match the first {{j}} characters of the url". Initialize {{can[0][0] = true}}. A literal token or {{?}}: {{can[i][j] = can[i-1][j-1] && charMatches}}. Token {{**}}: {{can[i][j] = can[i-1][j] || can[i][j-1]}} (either it matches nothing here, or it swallows one more arbitrary character). Token {{*}}: {{can[i][j] = can[i-1][j] || (can[i][j-1] && charIsNotSlash)}}.',
          'You do not need the full matrix: each row depends only on the row immediately before it, so two arrays {{boolean[] prev}} and {{boolean[] cur}} are enough. Remember to set {{cur[0] = prev[0]}} when the token is a star (a star matches the empty string); otherwise {{cur[0] = false}}.',
          'When tokenizing, collapse a run of consecutive stars into a single {{**}} token — otherwise {{***}} creates intermediate tokens that nobody handles and the result depends on how you happened to cut the string.',
          'Test the matcher yourself with two easy cases: {{globMatch("*/orders", "a/b/orders")}} must return {{false}} (a single star may not cross a slash), while {{globMatch("**/*/orders", "https://h.test/a/b/orders")}} must return {{true}} ({{**}} eats {{https://h.test/a}} and the single star eats {{b}}). If your algorithm returns {{true}} for the first case, you are most likely using the classic backtracking pointers — read the explanation.',
        ],
        explain: `**Why not the classic backtracking algorithm?** The familiar wildcard problem ({{*}} swallows every character) is solvable with two pointers plus **one** backtrack point, because stretching the star is always possible. Here {{*}} is blocked by {{/}}, so that assumption breaks: with pattern {{*/orders}} and url {{a/b/orders}}, the backtracking pointer stretches {{*}} to eat {{a/b}}, sees {{/orders}} match and returns {{true}}, while the correct answer is {{false}} ({{*}} may not cross {{/}}). The opposite direction is wrong too: pattern {{**/*/orders}} against {{https://h.test/a/b/orders}} does match, but if the memory keeps only the **last** star, then when it gets stuck at {{/}} it gives up and returns {{false}}. To backtrack correctly you would have to remember every star and every way of splitting the string — which is just rewriting dynamic programming clumsily. A state table costs {{O(t x n)}} (t = number of tokens, n = length of the url), is short, easy to verify and has no hidden cases. The lesson to state in an interview: **greedy is only correct when the set of choices carries no extra constraint**; the moment you add a "may not cross a slash" condition you must switch to dynamic programming.

**Why "the later route wins" is the thing worth learning.** Playwright picks the handler **registered last** among those that match; {{route.fallback()}} exists precisely to hand over on purpose to a handler registered earlier. The exercise deliberately contains only the rule "walk forward, keep the last match" — if you implement "walk backward, return the first match", every test about priority goes red. On a real project this exact mechanism costs QA several hours: a general route {{**/api/**}} registered in {{@BeforeEach}} **swallows** the specific route registered on line 40 if line 40 runs first; for the specific route to win, it has to be registered **later**.

**Three small details that get missed.**
1. {{*}} matches **the empty string too**, so {{**/orders*}} still matches a url that ends exactly at {{orders}}. Plenty of people write matchers that force {{*}} to eat at least one character.
2. Count by **glob**, not by action: two routes with the same glob (very common when two helpers register the same rule) share one counter, and the counter is **history** — {{unroute}} deletes the rule but does not delete the evidence that the rule once matched.
3. {{url == null}} must be treated as "no match" and **still increments unmatched**: in Playwright a handler always receives a request that has a URL, but one of your helpers may pass {{null}} because of a bug, and a rising unmatched() is an early signal.

**Use this exercise to debug real tests.** When a UI test behaves oddly, what you need to know is not only "which mock ran" but "does this URL match any rule at all, and how many times". Add exactly the two counters {{hits}} and {{unmatched}} to the {{page.route}} wrapper in your framework and you see it immediately: {{unmatched}} growing means the page changed its API paths (FE refactor, a new /v2/), while {{hits}} climbing only on the general rule means your specific rule never ran — those are two completely different classes of failure.`,
      },
    ],
    check: [
      {
        q: 'Two routes match one URL: {{page.route("**/api/**", A)}} is registered first, {{page.route("**/api/orders", B)}} second. When the page calls /api/orders, which handler runs?',
        options: [
          'A, because the general rule is always preferred so it catches every request',
          'B, because the route registered later wins; to yield to A, B calls route.fallback()',
          'Both run in sequence, A then B',
          'Playwright throws an error because the two routes overlap',
        ],
        explain: 'Playwright keeps a list of routes and picks the handler **registered last** that matches. {{route.fallback()}} is the deliberate way to skip the current handler and let the earlier one decide. This is exactly why you should register general routes first and specific routes after.',
      },
      {
        q: 'Which URL does the glob {{"/api/*/items"}} match?',
        options: [
          '{{/api/42/items}} and {{/api/42/x/items}}',
          'only {{/api/42/items}}, because {{*}} does not cross a {{/}}',
          'only {{/api/*/items}}, literally',
          'none of them, you would have to write {{**}}',
        ],
        explain: '{{*}} swallows every character **except** {{/}}; only {{**}} can swallow {{/}}. To cover several levels write {{/api/**/items}}. The {{.}} and {{:}} characters are ordinary ones, not wildcards.',
      },
      {
        q: 'The goal of the test is "after placing an order, the order is stored and stock is decremented". Which strategy is correct?',
        options: [
          'Mock {{POST /api/orders}} to return 200 so the test is fast and stable',
          'Call the real backend (or an API test at the integration layer); the UI test mocks only unrelated display parts',
          'Mock the whole API, then assert that the order list contains a new record',
          'Take a screenshot and compare images',
        ],
        explain: 'A mock returns exactly the data you wrote, so it cannot discover that the server does not write to the DB or does not decrement stock — the test stays green even when the backend is dead. Mocking is reasonable for **rare display states** and **error branches**, not for **server-side correctness**.',
      },
      {
        q: 'What is the most serious risk of HAR replay ({{page.routeFromHAR}})?',
        options: [
          'A HAR replays slower than calling the real API',
          'A HAR is a photograph of the past: when the API schema changes the UI still gets the old data and the test stays green; the file also tends to contain tokens/PII',
          'A HAR cannot store response bodies',
          'A HAR only works with Selenium',
        ],
        explain: 'A HAR really does record both requests and responses and works offline; the problem is its **provenance**. Scrub secrets before committing, and update or regenerate the HAR when the contract changes — or restrict HAR replay to exploratory tests and never use it as the smoke.',
      },
    ],
  },
});
