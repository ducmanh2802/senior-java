/*
 * English translation of js/data/quiz-autotest.js — task T751. Format: js/core/i18n.js (content overlay).
 * ids: qz-autotest-029 qz-autotest-030
 */
App.i18n.content({
  'qz-autotest-029': {
    q: 'In Playwright for Java, which statements about {{BrowserContext}} are correct? (Choose 2)',
    options: [
      'Cookies/localStorage of one {{BrowserContext}} are not automatically shared with another {{BrowserContext}} in the same {{Browser}}',
      '{{BrowserContext}} cannot be configured with a viewport or a locale; that can only be configured on {{Page}}',
      'You can register {{context.route(...)}} so network blocking/mocking applies to every {{Page}} created from that context',
      'Every {{BrowserContext}} must run on its own separate {{Browser}} process'
    ],
    explain: `**Summary:** {{BrowserContext}} is the isolation unit (cookies/storage/permissions) and the place where you put the configuration and routes that apply to the Pages inside it; several Contexts can share one Browser.

**Step-by-step:**
- **Isolation:** a Context is like a separate browser profile. This is the foundation that lets tests run in parallel reliably without launching many heavy browsers.
- **Configuration on the Context:** when you call {{newContext}} you can set {{setViewportSize}}, {{setLocale}}, {{setTimezoneId}}, {{setPermissions}}, {{setStorageStatePath}}, {{setRecordVideoDir}}... Pages created afterwards inherit this configuration.
- **Routing on the Context:** {{context.route(pattern, handler)}} catches every request coming from every Page inside the Context - convenient when you want consistent mocking/blocking.
~~~java
BrowserContext ctx = browser.newContext(
    new Browser.NewContextOptions().setLocale("vi-VN"));
ctx.route("**/analytics/**", Route::abort);
Page p1 = ctx.newPage();
Page p2 = ctx.newPage(); // same locale, same route rule
~~~

**Common pitfalls:** Thinking you have to open several Browsers to get isolation - that wastes resources. Or registering the route on only one Page and forgetting that the other Pages still call the real API.

> Senior tip: Put shared configuration (locale, auth, route mocks) at the Context level; use Page for per-tab behavior. Close the Context after the test to release memory/video/trace.

### Why the other options are wrong
- **Cannot configure viewport/locale on the Context**: Wrong. {{NewContextOptions}} supports viewport, locale, timezone, geolocation, permissions, and more.
- **Each Context requires its own Browser**: Wrong. One Browser can host many Contexts; that is exactly the performance benefit of the Playwright model.`
  },
  'qz-autotest-030': {
    q: 'You call the create-order API with {{context.request().post(...)}} and want to verify the response. What is the correct way to check an {{APIResponse}} in Playwright for Java?',
    options: [
      'Use {{assertThat(page).hasURL(...)}} because APIResponse updates the page by itself',
      'Check {{response.ok()}}/{{response.status()}}, read {{response.text()}} or {{response.json()}}; you can also use {{assertThat(response).isOK()}}',
      '{{APIResponse}} has no body; you must call again with {{HttpURLConnection}} to read it',
      '{{response != null}} alone means the request succeeded'
    ],
    explain: `**Summary:** {{APIResponse}} gives you the status, the headers and the body ({{text()}}, {{body()}}, {{json()}}); Playwright ships an API assertion {{assertThat(response).isOK()}} to check for HTTP 2xx.

**Step-by-step:**
- **What APIResponse is:** the result returned by {{APIRequestContext}} ({{get/post/...}}) - Playwright's plain HTTP client, next to the browser UI. It carries the HTTP status code, the headers and the body content.
- **How to check it:**
~~~java
APIResponse res = context.request().post("/api/orders",
    RequestOptions.create()
        .setHeader("Content-Type", "application/json")
        .setData("{\\"sku\\":\\"A1\\"}"));
assertThat(res).isOK();            // 2xx
assertEquals(201, res.status());   // more precise when you need it
String body = res.text();          // body as a string
System.out.println(res.headers()); // debug headers
~~~
- **json():** returns the already parsed object (the type depends on the binding); handy when asserting a specific field.

**Common pitfalls:** Looking only at {{response != null}} - the request may return 400/500 and still give you a response object. Or reading the body twice in a way that is not supported; store {{text()}} in a variable if you need to use it again.

> Senior tip: Assert both the status and the important fields in the body (id, state). When a test fails, log {{res.status()}} + {{res.text()}} into the CI artifact so debugging is possible. Dispose the {{APIRequestContext}} you created manually with {{playwright.request().newContext()}}.

### Why the other options are wrong
- **{{assertThat(page).hasURL(...)}}**: an API call made through {{request()}} does not navigate the Page; the page URL stays unchanged.
- **No body, must use {{HttpURLConnection}}**: Wrong. {{APIResponse}} has {{text()}}, {{body()}}, {{json()}}.
- **{{response != null}} means success**: a null-check does not reflect the HTTP status; 4xx/5xx still return a response.`
  }
});
