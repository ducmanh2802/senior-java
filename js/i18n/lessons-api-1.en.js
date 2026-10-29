/*
 * English translation of js/data/lessons-api.js — task T467. Format: js/core/i18n.js (content overlay).
 * ids: lesson-api-001 lesson-api-002
 */
App.i18n.content({
  'lesson-api-001': {
    title: 'HTTP from the inside: safe methods, status codes and headers',
    goals: [
      'Read a raw HTTP message and tell the head apart from the body',
      'Tell **safe** from **idempotent** and know which method to use for what',
      'Pick the right status code for each situation and explain why',
      'Understand how {{Content-Type}}, {{Cache-Control}} and {{ETag}} affect clients and proxies',
    ],
    body: `### An HTTP message has two parts
With HTTP/1.1, every request or response is **structured text** sent over TCP as bytes (HTTP/2 and HTTP/3 encode it in binary but keep the same meaning: method, status, headers, body). The head consists of the **request line** (or status line) and the **headers**, one header per line in the form {{Name: value}}; then comes **a single blank line**, then the **body**. The blank line is the boundary itself: everything after it belongs to the body, even when the body is empty.

~~~text
POST /accounts/42/transactions HTTP/1.1
Host: api.bank.vn
Content-Type: application/json
Content-Length: 29

{"amount":100000,"ccy":"VND"}
~~~

Four things that are easy to get wrong when reading a message yourself:
- The standard (RFC 9112) specifies {{CRLF}}, i.e. the two characters {{\\r\\n}} (carriage return + line feed), as the line terminator. RFC 9112 lets a receiver also accept a bare {{LF}} ({{\\n}}), and real parsers usually do; when writing your own, split the head on {{CRLF CRLF}} and only try {{LF LF}} if that is not found.
- **Never trim the body.** A body may start or end with whitespace, or even contain blank lines. To HTTP the body is binary data; only headers get normalised.
- Header names are **case-insensitive** ({{Content-Type}} and {{content-type}} are the same); values are **case-sensitive** unless a specific standard says otherwise. So {{X-Trace: Abc}} differs from {{X-Trace: abc}}, but the type/subtype in {{Content-Type}} is an exception: {{application/JSON}} still denotes a single media type. Header names must not contain whitespace; values have leading and trailing whitespace trimmed.
- Duplicate headers: the standard only allows repetition for **list-based** headers (for example {{Accept}}, {{Cache-Control}}), and then the lines are equivalent to one comma-joined line ({{Accept: a}} + {{Accept: b}} = {{Accept: a, b}}). {{Set-Cookie}} is the exception: each line must stay separate because a cookie value may contain commas. In the exercise we simply agree that a later value overrides an earlier one.

The body length is declared by {{Content-Length}}, or {{Transfer-Encoding: chunked}} is used when the length is not known in advance. If the server receives **both** headers, that is a sign of a **request smuggling** attack (the proxy in front works out the length from one header and the backend from the other, so the leftover bytes are treated as a second request planted by the attacker). RFC 9112 specifies: {{Transfer-Encoding}} wins and {{Content-Length}} is ignored; the server **may** reject the message outright (400), and if it still processes it, it must **close the connection** after the response. The safest production behaviour is to reject.

### Methods: safe, idempotent and the consequences
- **Safe**: semantically the method only **reads**; the client is not asking for the server state to change. That is why browsers may prefetch such links and crawlers may call them at will. (The server may still write logs or bump counters, but the client is not responsible for those side effects.)
- **Idempotent**: calling once or many times with the same data leaves the **final state** the same. Note: the response may differ between calls; HTTP does not require responses to be identical.
- **Cacheable**: the response may be cached. In practice only GET and HEAD are cached; POST is theoretically cacheable with explicit headers, but almost no cache supports it.

| Method | Safe | Idempotent | Typical use |
|---|---|---|---|
| GET | yes | yes | read a resource; the request needs no body |
| HEAD | yes | yes | like GET but headers only |
| OPTIONS | yes | yes | discover allowed methods, CORS preflight |
| PUT | no | yes | overwrite the whole resource at one URI |
| DELETE | no | yes | delete a resource |
| POST | no | **no** | create, or actions that are not naturally idempotent |
| PATCH | no | usually no | partial update; may be idempotent if the edit is an assignment |

A banking example: {{PUT /accounts/42/beneficiary}} with a full body is idempotent — sending it 5 times still leaves the same beneficiary. {{POST /payments}} is not: every send is a new debit. That is why, when the network times out after a {{POST}}, the client **must not** blindly retry; it has to use an idempotency key (lesson 3 of this track).

One detail that often comes up: DELETE is idempotent, yet the second call may return 404. The state "the resource is gone" is unchanged, so the method is still idempotent; only the response differs.

### Status codes: the contract between server and client
A status code is not decoration. Clients, load balancers, SDKs and alerting systems all make decisions based on the 2xx/4xx/5xx **class**. Returning {{200}} with {{"success": false}} is a design bug: automatic retries will not fire, dashboards will not show the error, SDKs will not raise an exception.

| Code | When |
|---|---|
| 200 OK | read or update succeeded, with a body |
| 201 Created | creation succeeded, with {{Location}} pointing at the new resource |
| 202 Accepted | work accepted, processed asynchronously, return somewhere to track it |
| 204 No Content | success, no body (DELETE, overwriting PUT) |
| 304 Not Modified | the client sent {{If-None-Match}} matching the {{ETag}} (or {{If-Modified-Since}}), no body; the client reuses its cached copy |
| 400 Bad Request | malformed message, broken JSON, missing required header |
| 401 Unauthorized | missing or wrong credentials; comes with {{WWW-Authenticate}} |
| 403 Forbidden | authenticated but not authorised |
| 404 Not Found | no resource at that URI |
| 405 Method Not Allowed | the URI exists but the method is not supported; the {{Allow}} header is **mandatory** |
| 409 Conflict | state conflict, for example a duplicate account number |
| 412 Precondition Failed | {{If-Match}} does not match; protects against lost updates |
| 422 Unprocessable Content | syntax is fine but the semantics are wrong, for example a negative amount |
| 429 Too Many Requests | rate limit exceeded; comes with {{Retry-After}} |
| 500 Internal Server Error | unexpected error; do not leak internal details |
| 502 / 503 / 504 | the gateway got a bad response / the service is overloaded / the gateway timed out |

Telling 401 and 403 apart is a classic question. 401 means "who are you?" has not been answered; 403 means "we know who you are, but you are not allowed to do this". Do not use 401 for a user who is signed in but lacks a role.

### Headers that shape how data is interpreted
- {{Content-Type}} describes **the format of the body being sent**; {{Accept}} describes **the format the client wants back**. Without {{Content-Type}} the server has to guess — do not make the server guess.
- {{Content-Type: application/json; charset=utf-8}}: RFC 8259 does **not** define a charset for {{application/json}} because JSON is UTF-8 by default; adding {{charset=utf-8}} is not required but is harmless and stops some older clients from guessing wrong.
- {{Content-Length}} vs {{Transfer-Encoding: chunked}} was covered above; never send both.
- {{Cache-Control}} decides who may cache and for how long. {{public}} lets shared proxies cache too; {{private}} allows only the client's private cache (the browser) to store it; {{no-store}} forbids **every** cache from storing the response (neither memory nor disk); {{no-cache}} is the opposite of what its name suggests: it may still be stored, but the cache must revalidate with the server before each use; {{max-age}} is in seconds; {{s-maxage}} applies to shared proxies; {{stale-while-revalidate}} lets a stale copy be served while it is refreshed.
- {{ETag}} is a fingerprint of the resource version. The client sends it back in {{If-None-Match}} to get a 304 (saving bandwidth), or in {{If-Match}} to prevent overwrites (getting a 412 if someone edited first).
- {{Vary}} tells caches which request headers the response varies on; omitting {{Vary: Accept-Encoding}} can make a proxy hand a gzip copy to a client that does not support it.

For banking data such as balances or transaction history, the default should be {{Cache-Control: no-store}} (many teams add {{private}} as well to be safe with older caches), and only open caching for reference data that rarely changes (branch lists, exchange rates with a short TTL). A wrong cache configuration here does not just make things slower; it can leak one person's data to another through a shared proxy.

### Interview relevance
Interviewers usually start from "tell PUT from POST", move on to "why is DELETE idempotent yet still returns 404", and then ask about real situations: a mobile client retrying after a timeout, a CDN wrongly caching a response that carries Authorization, a gateway returning 504 while the backend is still processing. A good answer ties every concept to an operational decision: may we retry, where do we cache, how does the client tell a temporary failure from a permanent one.`,
    exercises: [
      {
        title: 'Write your own parser for a raw HTTP request',
        prompt: `You are given an HTTP request as a raw string. Write {{HttpParser.parse(raw)}} returning an {{HttpRequest}} with:
- {{method}}: the first token of the request line, kept exactly as sent.
- {{path}}: the request target (the second part), **including the query string**, for example {{/accounts?limit=20}}.
- {{headers}}: a map with **lower-case header names** and values trimmed of leading and trailing whitespace. When a header repeats, the later value wins. Skip header lines without a colon.
- {{body}}: everything after the first blank line, **not trimmed**. With no blank line, the body is the empty string.

Accept both {{CRLF}} and {{LF}} line endings. Only valid requests need to be handled; {{Content-Length}} need not be validated.`,
        hints: [
          'Find the first blank line with {{indexOf}} on the four characters {{CRLF CRLF}}; if that is not found, try the two characters {{LF LF}}.',
          'Split the head into lines; line 0 is the request line (split on spaces, limited to 3 parts), and later lines are split at the **first** colon.',
          'Do not call {{trim()}} on the body; trim only header names and values.',
        ],
        explain: `The key points are **the head/body boundary** and **never touching the body**. If you use an unbounded {{split(":")}}, a value such as {{abc:def}} gets cut in the wrong place; use {{indexOf(':')}} or {{split(":", 2)}} instead. The order in which you look for the separator matters a lot: the string {{"\\r\\n\\r\\n"}} does **not** contain {{"\\n\\n"}} (there is a {{\\r}} between the two {{\\n}} characters). So if you search for {{"\\n\\n"}} first on a CRLF request, you either fail to find the real boundary or — worse — match a {{"\\n\\n"}} buried deep inside the body and cut the whole message in the wrong place.

Other common mistakes: calling {{trim()}} on the whole message, which strips leading and trailing whitespace off the body; failing to lower-case header names, so a lookup of {{"content-type"}} misses when the client sent {{Content-Type}}; and splitting the request line with an unbounded {{split(" ")}} and then picking the wrong element. Note that {{String.split}} drops trailing empty strings by default; pass {{-1}} if you need to keep them. In production, a real parser must also cap header size (to stop an attacker sending enormous headers and exhausting memory), reject {{obs-fold}} (a header value continued on the next line by indentation, removed by RFC 9112), and handle {{Content-Length}} / {{Transfer-Encoding}} exactly as described in the theory.`,
      },
    ],
    check: [
      {
        q: 'Which method is **idempotent but not safe**?',
        options: ['GET', 'PUT', 'POST', 'HEAD'],
        explain: `**PUT is correct**: PUT overwrites the resource, so repeating it leaves the same state (idempotent), but it **changes** data and is therefore not safe. **GET** and **HEAD** are wrong because they are both safe and idempotent (the question asks for a method that is not safe). **POST** is wrong because it is neither safe nor idempotent — which is exactly why payments need an idempotency key.`,
      },
      {
        q: 'The client is signed in validly, but the account lacks the transfer role. What should the server return?',
        options: ['401 Unauthorized', '403 Forbidden', '404 Not Found', '422 Unprocessable Content'],
        explain: `401 is for when the identity cannot be established (missing or wrong token). Knowing who the user is but finding they lack the permission is 403. 404 should only be used when you deliberately want to **hide** whether the resource exists (RFC 9110 permits it); here the thing is a feature (transfers) the user knows exists, so 404 would be misleading. 422 is a semantic error in the body, not an authorisation error.`,
      },
      {
        q: 'A resource was deleted successfully and no body is needed. Which status code fits best?',
        options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'],
        explain: `204 means success with **no body**, which is right for DELETE. 200 is also valid if you return a body describing the result, but that is not needed here. 201 is for creation; 202 is for asynchronous processing.`,
      },
      {
        q: 'An API returns the account balance. Which {{Cache-Control}} is safest?',
        options: ['public, max-age=60', 'private, max-age=60', 'no-store', 's-maxage=3600'],
        explain: `A balance is sensitive data and should not be stored in any cache (including the browser's private cache on a shared machine), hence {{no-store}}. {{public}} lets shared proxies cache it and can leak data; {{s-maxage}} also targets shared caches; {{private, max-age=60}} blocks shared proxies but still lets the browser keep it for 60 seconds, so the next user on the same machine can see the previous user's balance.`,
      },
    ],
  },
  'lesson-api-002': {
    title: 'Designing REST resources, validation and standard Problem Details errors',
    goals: [
      'Name resources and choose the right method and status code for an accounts API',
      'Tell 404 from 405 and always send the {{Allow}} header when required',
      'Separate syntax errors (400) from semantic errors (422) and report several errors at once',
      'Write error responses per RFC 9457 so clients handle them programmatically instead of parsing strings',
    ],
    body: `### Resources are nouns, actions are methods
REST is not about "naming URLs nicely". The core idea: **resources are nouns** and **HTTP methods are verbs**. So {{POST /accounts/42/transactions}} beats {{POST /createTransaction?accountId=42}}, and {{DELETE /accounts/42/beneficiaries/7}} beats {{GET /deleteBeneficiary?id=7}}.

A few conventions that make an API predictable:
- Use **plurals** for collections: {{/accounts}}, {{/accounts/42/transactions}}. Do not mix {{/account}} with {{/accounts}}.
- **Nesting** expresses ownership, but keep it to 1–2 levels: {{/accounts/42/transactions}} is fine; {{/customers/1/accounts/42/transactions/9/entries}} is too deep, hard to cache and hard to authorise.
- Resources that can be addressed on their own belong at the top level: {{/transactions?accountId=42}} instead of making the client remember a nested path.
- IDs are **opaque** to clients: do not let clients infer that IDs are sequential and then walk every number; consider UUID/ULID for public APIs.
- Use **kebab-case** for paths ({{/beneficiary-accounts}}) and camelCase for JSON fields if that is your team's convention, but stay consistent.
- Filtering, sorting and pagination are query parameters, not new path segments: {{GET /transactions?status=POSTED&sort=-createdAt&limit=50&cursor=...}}.

### Method and status table for one resource
| Operation | Request | Success |
|---|---|---|
| List | {{GET /accounts}} | 200 + list + pagination metadata |
| Read one | {{GET /accounts/42}} | 200, or 404 if absent |
| Create | {{POST /accounts}} | 201 + {{Location: /accounts/43}} |
| Overwrite | {{PUT /accounts/42}} | 200 or 204; 201 if the PUT creates a new resource at that URI |
| Partial update | {{PATCH /accounts/42}} | 200 with the resource after the edit |
| Delete | {{DELETE /accounts/42}} | 204, or 202 if the delete is asynchronous |

Never use GET for an operation with side effects (sending email, debiting money) just because it is "convenient to call from a browser". Proxies and crawlers are allowed to re-issue GET; the consequences can be very expensive.

### 404, 405 and the errors that often get merged
- **404**: no resource at this URI. If the path matches a route but the data is missing (account 42 does not exist), it is still 404.
- **405**: the path **exists**, but the method is not supported. The {{Allow: GET, PUT}} header is mandatory so the client knows how to fix the request. This is very often done sloppily: returning 404 for everything makes the client think the URL is wrong.
- **409**: the request is syntactically correct and authorised, but conflicts with current state — creating a duplicate account number, transferring money from an account under a hold. The client can retry after changing the data.
- **410**: the resource existed and has been permanently deleted; unlike 404 it says "stop looking".
- **412**: the precondition ({{If-Match}}) does not match; used for optimistic concurrency.
- **422**: the body is syntactically valid but breaks a business rule: a negative {{amount}}, an effective date in the past, a transfer above the limit.

The 400/422 boundary is not absolute: many teams merge both into 400. What matters is **consistency across the whole API**, documented clearly; do not use 400 sometimes and 422 other times for the same kind of error.

### Validation: report everything, in the right place
Validation should run **before** touching the database and before any side effect. In Spring Boot 3, {{@Valid}} on {{@RequestBody}} enables Bean Validation; the failure is thrown as {{MethodArgumentNotValidException}}, which carries **all** the failing fields (via {{getBindingResult().getFieldErrors()}}). Spring returns **400** for this exception by default; if you want 422 for business errors, map it yourself in an {{@RestControllerAdvice}}. (Since Spring Framework 6.1, constraints placed directly on {{@PathVariable}}/{{@RequestParam}} can throw {{HandlerMethodValidationException}} — handle that too.) Do not catch the exception and return a generic "Invalid data" string — the client has no idea which field to fix.

Principles:
- Return **all** field errors in one response; do not stop at the first. It is better for a user to fix a form once than five times.
- Point at the **location**: {{/amount}}, or {{/beneficiaries/0/accountNumber}} when the error is inside an array.
- A **stable** machine-readable error code: {{INSUFFICIENT_FUNDS}}, {{ACCOUNT_FROZEN}}. Do not let clients compare Vietnamese strings.
- Never return stack traces, table names, SQL statements or internal details. Log everything on the server with a traceId, and return that traceId to the client.
- Be careful when "the resource exists" is itself sensitive: if user A calls {{GET /accounts/99}} belonging to user B and gets 403, A learns that account 99 **exists**. RFC 9110 allows returning **404** instead of 403 to hide this, and many banking systems do exactly that.

### RFC 9457 Problem Details
RFC 9457 (which supersedes RFC 7807) defines a common error body with content type {{application/problem+json}}:

~~~json
{
  "type": "https://api.bank.vn/problems/insufficient-funds",
  "title": "Insufficient funds",
  "status": 422,
  "detail": "Available balance 50,000 VND, 100,000 VND required.",
  "instance": "/transfers/8f3c",
  "code": "INSUFFICIENT_FUNDS",
  "traceId": "b7d1c9e2",
  "errors": [
    { "pointer": "/amount", "code": "TOO_LARGE", "message": "Exceeds the 500 million/day limit" }
  ]
}
~~~

- {{type}} is a URI identifying the error **type**; it need not be dereferenceable (but the RFC recommends that if it is, it should be human-readable documentation, so host real docs). Without {{type}} it defaults to {{about:blank}}, meaning "nothing beyond what the status code already says".
- {{title}} is a short summary of the error **type**, the same across occurrences (it only differs when translated into another language); {{detail}} describes **this occurrence** for humans and may contain concrete numbers.
- {{status}} is informational and must match the real HTTP status code of the response; do not put 200 on the wire but 422 in the body.
- {{instance}} is a URI identifying this particular occurrence (for example a path containing the request id), for cross-referencing with logs.
- Extension fields such as {{code}}, {{errors}}, {{traceId}} are allowed; clients should rely on {{code}} and {{pointer}} rather than parsing {{detail}}.
- For 5xx errors, the smaller the body the better: a generic error code plus a traceId. Never expose the real exception message.

In Spring Boot 3 (Spring Framework 6), {{ProblemDetail}} and {{ErrorResponseException}} are built in; set {{spring.mvc.problemdetails.enabled=true}} so that Spring MVC's default errors (405, 415, validation failures…) also return {{application/problem+json}}. To add {{code}}/{{errors}}, write an {{@RestControllerAdvice}} (usually extending {{ResponseEntityExceptionHandler}}) and call {{problem.setProperty("code", "INSUFFICIENT_FUNDS")}}.

### Interview relevance
Real interview questions do not stop at "what is REST" but ask: why 404 or 403 when a user may not view someone else's account, how does the client tell a temporary error so it can retry, and how do you keep the error contract stable when the backend changes framework. Answer with the contract: status code + stable error code + Problem Details, plus an example where the client only needs to read {{code}} to handle it.`,
    exercises: [
      {
        title: 'A small router: path patterns, 404 and 405',
        prompt: `Write a {{Router}} that mimics the routing part of a REST API:
- {{add(method, pattern, handler)}}: register a route. {{pattern}} may contain variables such as /accounts/{id}/transactions/{txId}.
- {{dispatch(method, path)}}: find the route matching **both method and path**, call the handler with a map of path variables and return the handler's result.
- No matching path at all → return the string {{404}}. The path matches but that method does not → return {{405}}.
- {{allowed(path)}} returns the set of methods allowed at that path (used to build the {{Allow}} header).

Conventions: drop the query string (everything after {{?}}) and drop a trailing {{/}} (except for the root path {{/}}). Literal segments must match exactly; a {{...}} variable matches exactly one non-empty segment. If several routes match, the route with **more literal segments** wins, so {{/accounts/me}} beats /accounts/{id} even when registered later.`,
        hints: [
          'Normalise the path before comparing: cut it at {{?}} and strip the trailing {{/}}. Split pattern and path into segment arrays of equal length and compare position by position.',
          'A segment like {{...}} is a variable; strip the braces to get its name and put it into a {{LinkedHashMap}}. Never let a variable match an empty string.',
          'To get 405 right, check the path **regardless of method** first: if any route matches the path, return 405; otherwise return 404. Measure specificity by the number of literal segments.',
        ],
        explain: `The correct flow is: split the path into segments, walk every route, and have each route return either null (no match) or a map of variables. When no route matches **for the method**, check again on the path alone to tell 404 from 405 — this is where many people return 404 for both.

The {{literalCount}} preference for literal routes mirrors Spring MVC (which compares the specificity of {{PathPattern}}) and tree-shaped routers such as Go chi: {{/accounts/me}} must beat /accounts/{id}, otherwise the static route can never run. Note that not every router behaves this way: Express (Node.js) matches in **registration order**, so there you must declare /accounts/me first. Production routers add much more: regex constraints ({{id}} must be numeric), wildcards, auto-generated OPTIONS, and the {{Allow}} header derived from {{allowed()}}.

Common mistakes: comparing paths with {{startsWith}} so that {{/accounts/42x}} matches {{/accounts/42}}; forgetting to strip the query so {{?limit=5}} corrupts the last segment; and returning 405 without {{Allow}} — the client cannot tell how to fix the request.`,
      },
    ],
    check: [
      {
        q: 'An account was created successfully. Which response is most correct?',
        options: ['200 OK with the account body', '201 Created with a Location header', '202 Accepted with a job id', '204 No Content'],
        explain: `**201 + Location is right**: 201 says a **new** resource was created; {{Location}} gives the client its URI. **200** is not technically wrong but loses the "newly created" information. **202** is wrong because it means the work was accepted and will be processed asynchronously, whereas the account already exists. **204** is wrong because it means there is no body and is usually used for updates and deletes; it says nothing about a new resource.`,
      },
      {
        q: 'The path {{/accounts/42}} exists but only supports GET and PUT. The client sends DELETE. What do you return?',
        options: ['400 Bad Request', '404 Not Found', '405 Method Not Allowed + Allow: GET, PUT', '409 Conflict'],
        explain: `The path exists, so it is not 404. The method is not supported, so it is 405, and the standard requires the {{Allow}} header so the client learns the valid methods. 400 is a request syntax error; 409 is a business state conflict.`,
      },
      {
        q: 'The JSON is syntactically valid but {{amount}} is negative. 422 or 400?',
        options: ['400 because the request is wrong', '422 because the syntax is right but the semantics are wrong', '409 because of a conflict', '500 because the server cannot handle it'],
        explain: `**422 is right** under this lesson's convention: the body parses but breaks a business rule. **400** is for broken JSON or wrong data types; many APIs (and Spring's default) fold validation failures into 400 — acceptable if it is consistent across the whole API, but this option just says "the request is wrong" in a vague way. **409** is wrong because there is no conflict with server-side state. **500** is wrong because the fault lies in the data the client sent, not in the server; a 5xx also makes the client retry pointlessly and pollutes alerts.`,
      },
      {
        q: 'Which field should **not** appear in Problem Details returned to a production client?',
        options: ['type', 'title', 'instance', 'stack_trace'],
        explain: `{{type}}, {{title}} and {{instance}} are standard RFC 9457 fields and safe. A stack trace exposes code structure, file paths and library versions — a gift to an attacker. Log the stack trace on the server and return only a traceId for cross-referencing.`,
      },
    ],
  },
});
