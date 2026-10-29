/*
 * English translation of js/data/q-primer.js — task T402. Format: js/core/i18n.js (content overlay).
 * ids: primer-014 primer-015 primer-016 primer-017
 */
App.i18n.content({
  'primer-014': {
    q: 'OAuth2 and OIDC fundamentals: who are the participants and what are the tokens? How does the authorization code flow work step by step?',
    a: `**Summary:**
- OAuth2 is an **authorization** protocol: it gives an application (the **client**) permission to access a user's resources (the **resource owner**) **without knowing their password**. OIDC (OpenID Connect) builds on OAuth2 and adds **authentication**: "who is this user", through an {{id_token}}.
- The participants are the **resource owner** (the user), **client** (the app that needs access), **authorization server** (Google, Keycloak, etc., which issues tokens), and **resource server** (your API, which protects the resources).
- In the **authorization code** flow, the user signs in and gives consent at the authorization server → the server returns a short-lived, single-use **code** → the client exchanges the code for an **access token** (used to call APIs) and an **id_token** (OIDC, containing the user's identity).

### Quick intuition
Think of a **hotel**:
- You (the resource owner) have booked room 12 and want an **outside laundry service** (the client) to enter the room and collect your clothes.
- You do not hand over your own room key (your password). You go to the **front desk** (the authorization server), prove your identity, and agree to give the laundry service a **temporary key card** (access token) with explicit permissions: "open room 12 only, valid for one hour only" (scope + expiry).
- The laundry worker swipes the temporary card, and the **room door lock** (the resource server) checks that the card is still valid and is for the right room before opening. The card automatically stops working when time is up, and you can also ask the front desk to revoke it at any time.
- OIDC adds one more thing: the front desk gives the laundry service a **note confirming that "the guest in room 12 is Nam"** (the ID token), so they know whom they are serving.

### Participants and tokens
| Term | What it is | Example |
|---|---|---|
| Resource owner | Owner of the resources and account | A Facebook user |
| Client | App requesting access | Your Java web app |
| Authorization server | Issues tokens and handles sign-in | Google, Keycloak, Auth0 |
| Resource server | API protected by tokens | A Spring Boot REST API |
| Access token | "Key card" used to call APIs | A JWT or opaque string |
| ID token | JWT stating who the user is (OIDC) | Contains sub, name, email |
| Refresh token | Renews an access token when it expires | Stored securely on the client |

**OAuth2 ≠ authentication**: OAuth2 answers "what are you allowed to do"; OIDC adds the answer to "who is the user". Signing in with Google requires OIDC (an id_token), not OAuth2 alone.

### The authorization code flow step by step
~~~text
1. The user clicks "Sign in with Google" in the Java app
2. The browser navigates to Google (the authorization server):
      /o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=openid email&state=xyz
3. The user signs in to Google and clicks "Allow"
4. Google redirects to the app's redirect_uri with an AUTHORIZATION CODE:
      https://app.example.com/callback?code=4/0Axxx&state=xyz
5. The app (backend) calls Google's token endpoint with the code + client_secret:
      POST https://oauth2.googleapis.com/token
      code=4/0Axxx&client_id=...&client_secret=...&grant_type=authorization_code
6. Google returns JSON containing access_token, id_token (and refresh_token if the app requested offline access)
7. The app creates a session and uses the access_token to call Google APIs if needed,
   or verifies the id_token (JWT) to obtain the email and sign the user in
~~~
- **{{state}}**: a random value that prevents **CSRF** — the app generates it when starting the flow and checks it on return; without it, an attacker could "attach" a victim's code to the attacker's session.
- The **{{code}}** passes through the browser (it is not displayed to the user, is short-lived, and is single-use); the **token** is obtained through a server-to-server call from the backend (with the client_secret) and does not pass through the browser — this is why the authorization code flow is safer than the older flows.

### What PKCE is and why it is needed
Mobile apps and SPAs cannot keep a {{client_secret}} confidential, so **PKCE** adds a step: the client creates a random {{code_verifier}}, sends its **hash** as the {{code_challenge}} at the start, then sends the original {{code_verifier}} when exchanging the code for tokens — the server compares them. Even if an attacker steals the code, they do not have the verifier needed to exchange it. PKCE should be enabled for every public client.

### Spring Boot integration (Spring Security)
~~~yaml
# application.yml: sign in with Google (OIDC)
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: \${GOOGLE_CLIENT_ID}
            client-secret: \${GOOGLE_CLIENT_SECRET}
            scope: openid, profile, email
~~~
With the {{spring-boot-starter-oauth2-client}} dependency and {{http.oauth2Login(Customizer.withDefaults())}} in the {{SecurityFilterChain}}, Spring Security automatically handles the redirect, validates state, exchanges the code for tokens, verifies the id_token, and creates a session. For an API (resource server) that accepts JWT access tokens, use {{spring-boot-starter-oauth2-resource-server}} and configure {{spring.security.oauth2.resourceserver.jwt.issuer-uri}}.

### Common mistakes
- **Sending the client_secret in JavaScript (an SPA)** — it is exposed immediately; an SPA must use PKCE and a public client.
- **Not validating {{state}}** → leaves the sign-in flow vulnerable to CSRF.
- **Not verifying the id_token signature/aud/iss** → an attacker can create a forged JWT.
- **Storing access tokens in localStorage** (an SPA) → vulnerable to XSS; prefer an HttpOnly cookie + CSRF token, or keep tokens in the backend.
- **Confusing OAuth2 with sign-in**: using plain OAuth2 (without OIDC) and then "inferring" the user from an access token used to call Google is conceptually wrong; use OIDC for authentication.

### One-minute spoken answer
"OAuth2 is an authorization protocol: the client does not know the user's password but receives an access token from the authorization server to call the resource server. OIDC builds on OAuth2 and adds an id_token to authenticate who the user is. In the authorization code flow, the user signs in and gives consent at the authorization server, the server redirects back to the app with a code, the backend exchanges the code for an access token and an id_token, and then verifies the id_token to sign the user in. I always use PKCE for public clients, validate state to prevent CSRF, and keep secrets only in the backend."

> Senior tip: when choosing an identity provider, do not just compare feature counts — look at the **token revocation window** and support for refresh token rotation. How quickly you can "sign out of all devices" or "lock a compromised account" depends on this configuration, and it is a practical Senior-level interview question.`,
    follow: [
      'How do OAuth2 and OIDC differ, and why does signing in with Google require OIDC?',
      'What problem does PKCE solve, and how does it work?',
      'How do access tokens and id_tokens differ in purpose and validation?'
    ]
  },
  'primer-015': {
    q: 'gRPC fundamentals: what is protobuf and how does gRPC use HTTP/2? When should you choose gRPC instead of REST for internal services?',
    a: `**Summary:**
- gRPC is an **RPC framework** (remote procedure call): it calls a function on another machine **as if it were a local function**, using **protobuf** as the message format (small and fast) and **HTTP/2** as the transport protocol.
- **Protobuf** is an **IDL** (interface definition language): you declare messages and services once in a {{.proto}} file, and the compiler generates Java code (and client stubs) — both sides automatically use consistent data types.
- Choose gRPC for **internal service-to-service** calls that need performance or streaming; keep REST for **public APIs, browsers, and partners** that benefit from human-readable JSON.

### Quick intuition
- **REST** is like **sending JSON letters through the post office**: each request has an envelope, anyone can open and read it (text), and it is flexible but takes effort to package and unpack.
- **gRPC** is like **a phone line with a pre-agreed script**: both sides agree on the "handset" (protobuf) in advance, communicate with compact binary signals (small and fast), and can exchange multiple messages in one call (streaming) over the same HTTP/2 connection.

### Protobuf: declare once, generate code for both sides
~~~text
// file order.proto
syntax = "proto3";
package order;

message OrderRequest {
  int64  order_id = 1;    // field number (NEVER reuse it when renaming)
  string customer = 2;
}

message OrderResponse {
  string status = 1;
  int64  total_cents = 2;   // money: use an integer (cents), not double
}

service OrderService {          // defines the RPC "interface"
  rpc GetOrder (OrderRequest) returns (OrderResponse);
  rpc WatchOrders (OrderRequest) returns (stream OrderResponse); // server stream
}
~~~
- {{protoc}} (usually run through a Maven/Gradle plugin) generates Java code: on the server, you extend {{OrderServiceGrpc.OrderServiceImplBase}} and override {{getOrder}}; on the client, you use the {{OrderServiceGrpc.newBlockingStub(channel)}} stub to make calls as if they were ordinary function calls.
- Fields are encoded in binary with their **field numbers** (1, 2, ...), not their names → the payload is very small; renaming a field while keeping its number remains compatible.

### HTTP/2: why gRPC is fast
| Aspect | HTTP/1.1 (typical REST) | HTTP/2 (gRPC) |
|---|---|---|
| Connection | Each connection handles only 1 request at a time | **Multiplexes** many requests (streams) concurrently over 1 connection |
| Data | Text (JSON) | Binary (compact protobuf) |
| Headers | Text, repeated | Compressed with HPACK |
| Streaming | Difficult (requires SSE/WebSocket) | Built in: unary, server/client/bidi streaming |

HTTP/2 eliminates head-of-line blocking at the HTTP layer (a slow request no longer blocks other requests on the same connection; TCP-level blocking still occurs when packets are lost) and reduces message size — the two biggest sources of savings for internal calls made thousands of times per second.

### When to choose gRPC and when to choose REST
| Criterion | gRPC | REST/JSON |
|---|---|---|
| Latency, payload | Low, small | Higher, larger |
| Public API for browsers | Requires gRPC-Web + a proxy | JSON works naturally |
| Streaming | First-class (unary, server, client, bidi) | SSE/WebSocket (more complex) |
| Contract | Protobuf (strict, generates code) | OpenAPI (optional, more flexible) |
| Tooling | Requires protobuf tools | curl, Postman, everywhere |
- **Choose gRPC**: internal services call one another frequently, latency matters, the team controls both sides, and streaming is needed (tracking orders in real time).
- **Choose REST**: APIs for partners/mobile web, debugging with curl, and many teams or programming languages.
- A practical architecture uses **both** — gRPC internally and REST/JSON at the edge (an API gateway translates gRPC to REST for clients).

### Spring Boot considerations
Spring Boot 3.x does not include a gRPC starter among its standard starters. Common options are the **Spring gRPC** project (spring-projects/spring-grpc, still relatively new), the community library {{net.devh:grpc-server-spring-boot-starter}}, or building the server yourself with the official {{io.grpc}} library. The server opens a separate gRPC port (for example, 9090) alongside HTTP 8080.

### Common mistakes
- **Not setting a deadline/timeout** on gRPC calls → a hung downstream can bring down the upstream too; {{withDeadlineAfter}} is mandatory.
- **Changing protobuf incorrectly**: reusing an old field number for a new field or changing its data type → silent decoding errors or crashes; only **add** fields and mark removed numbers as {{reserved}}.
- **Calling a blocking stub from an event-loop thread** (for example, inside a Netty/WebFlux handler) → blocks the event loop and slows the whole service; use an async stub ({{newStub}}) or {{newFutureStub}} there instead.
- **Expecting load balancing to happen automatically**: HTTP/2 connections are long-lived, so one client can send everything to **one** server; you need client-side LB ({{round_robin}}), a service mesh, or multiple connections.
- **Exposing gRPC directly to browsers** without grpc-web/a proxy → browsers cannot understand it; an API gateway must translate it.

### One-minute spoken answer
"gRPC is RPC that uses protobuf as its message format and HTTP/2 as its protocol. Protobuf is an IDL: you declare messages and services once in a .proto file, protoc generates Java code for both client and server, and messages are encoded in binary with field numbers, making them very small. HTTP/2 multiplexes many streams over one connection and compresses headers, so latency and bandwidth usage are better than with REST/JSON. I choose gRPC for internal services that need performance or streaming and keep REST for public APIs; I also always set deadlines on calls and never reuse protobuf field numbers."

> Senior tip: in a system with many services, a common architecture is **REST at the edge (clients) + gRPC internally**; when observability is needed, use gRPC interceptors to propagate trace context (OpenTelemetry) — without it, distributed tracing is "blind" to every gRPC flow, making incidents very difficult to investigate.`,
    follow: [
      'How does protobuf binary encoding work, and why are field numbers important for compatibility?',
      'How should you configure deadlines and retries for gRPC calls, and why should you not retry every error?',
      'When do you need an API gateway to translate between gRPC and REST?'
    ]
  },
  'primer-016': {
    q: 'Elasticsearch fundamentals: what is an inverted index, and what roles do mapping and analyzers play? When does your system need Elasticsearch instead of LIKE queries on PostgreSQL?',
    a: `**Summary:**
- Elasticsearch (ES) is a **full-text search and data analytics engine** built on an **inverted index**: keyword → list of documents containing it, enabling fast searches even across millions of records.
- **Mapping** describes each field's data type (like a schema); an **analyzer** determines how text is "split" (tokenization, diacritic removal, lowercasing) — the wrong mapping or analyzer produces incorrect query results.
- **OpenSearch** is an open-source fork of Elasticsearch (initiated by AWS, with the Amazon OpenSearch Service offering); the concepts in this lesson apply to both.
- You need ES for **full-text search, fuzzy search, and complex faceting/aggregation over large datasets**; use PostgreSQL for relational data, transactions, and JOINs ({{LIKE '%...%'}} is only suitable for small tables).

### Quick intuition
- **PostgreSQL** is like **files organized in drawers by ID**: lookups by key are fast, but "find every document mentioning 'hotel' out of 10 million records" requires scanning page by page — slow.
- **ES** is like **the keyword index at the back of a book**: the index says "beach → pages 12, 48, 103"; to find documents containing a word, you just consult the index — **fast no matter how thick the book is**. That index is the **inverted index**.

### How an inverted index works
~~~text
Documents:                       Inverted index (after the analyzer tokenizes):
 1: "Hotel near beach"           hotel -> [1]
 2: "Luxury spa"                 near  -> [1, 3]   <- one term points to MANY documents
 3: "Near night market"          beach -> [1]
                                 spa   -> [2]
                                 luxury -> [2]
                                 night -> [3]
                                 market -> [3]
~~~
For the query {{near beach}}, look up "near" → [1, 3], then "beach" → [1]. Document 1 matches both terms and therefore scores highest; document 3 matches one term and ranks below it. There is no need to scan every document, so 10 million documents can still often produce a response within a few tens of milliseconds.

### Index, document, and mapping
- **Index**: the ES equivalent of a "table" (each index usually has multiple **shards** to split the data and **replicas** for redundancy).
- **Document**: one JSON record.
- **Mapping**: describes the field types:
~~~json
{
  "mappings": {
    "properties": {
      "title":    { "type": "text",
                    "fields": { "raw": { "type": "keyword" } } },
      "category": { "type": "keyword" },
      "price":    { "type": "scaled_float", "scaling_factor": 100 },
      "created":  { "type": "date" }
    }
  }
}
~~~
- {{text}}: split into terms by an analyzer and used for **full-text search** ({{title}}).
- {{keyword}}: keeps the entire string unchanged and is used for **exact filtering, sorting, and aggregation** ({{category}}).
- {{title.raw}} is a **multi-field**: the same value is indexed in two ways, searched through {{title}}, and sorted through {{title.raw}}.

**text vs keyword** is a classic mistake: a {{text}} field has already been split into individual terms, so you **cannot** sort/group by its original value (by default, ES even reports an error when aggregating on a text field).

### Analyzer: turning text into tokens
An analyzer performs three steps in order:
1. **Character filter**: modifies the original string character by character (for example, removing HTML tags).
2. **Tokenizer**: splits the string into tokens (by whitespace and punctuation).
3. **Token filter**: transforms each token: lowercases it ({{lowercase}}), removes diacritics ({{asciifolding}}), removes stop words, or reduces it to its root form (stemming).

The analyzer runs **twice**: when indexing a document and when analyzing the query, so both sides must tokenize text the same way to match.
For example, "Find Luxury Hotel Near Beach" with the {{standard}} analyzer (tokenization + lowercasing, **no** diacritic removal) → tokens {{find}}, {{luxury}}, {{hotel}}, {{near}}, {{beach}}. Changing the analyzer requires **reindexing** everything — because the index already stores tokens produced by the old analyzer.

### When to use ES vs LIKE on PostgreSQL
| Requirement | PostgreSQL | Elasticsearch |
|---|---|---|
| Lookup by primary key/id | Very fast | Fast but unnecessary |
| Full-text search, typos, no diacritics (an unaccented query matches its accented Vietnamese equivalent) | Possible with {{tsvector}} + {{unaccent}}/{{pg_trgm}}, works well at moderate scale | Powerful, with built-in fuzzy search, highlighting, and ranking |
| Filter + sort + facet over millions of records | Slow without optimization | Powerful |
| Transactions, JOINs, business constraints | Powerful | **Not available** |
| Data < ~1 million rows, simple queries | Sufficient | Unnecessary, adds complexity |

{{LIKE '%beach%'}} has a leading %, so a B-tree index cannot be used and PostgreSQL must scan the entire table: 10 million rows can take several seconds per query.

The selection formula: **PostgreSQL is the primary data store (source of truth)**; ES is only a **search-optimized copy**, synchronized through CDC (Debezium) or the outbox pattern. Never treat ES as the primary write store.

### Common mistakes
- **Using {{text}} for a field that needs filtering/sorting/aggregation** → incorrect or slow results; distinguish text from keyword from the start.
- **Not configuring an analyzer for the right language** (Vietnamese needs an analyzer with diacritic removal/lowercasing) → an accented Vietnamese term does not match its unaccented form.
- **A wildcard query such as {{*keyword*}}** at the start of a term → scans the index and is as slow as LIKE %...%; use an analyzer/match query instead.
- **Not planning for reindexing**: changing a field type or analyzer requires creating a new index and running {{_reindex}}; avoid downtime by reading/writing through an **alias** and switching the alias to the new index when finished.
- **A cluster that is always yellow**: running one node with replica=1 leaves nowhere to place the replica. Yellow means reads and writes still work but there is no redundant copy; production should have at least 3 nodes.

### One-minute spoken answer
"Elasticsearch uses an inverted index: each keyword points to the list of documents containing it, so full-text search remains fast even on large datasets. Mapping describes each field's type, and I distinguish text (full-text search) from keyword (filter/sort/aggregate). The analyzer determines how text is tokenized, which is important for Vietnamese. I only add ES for fuzzy search or complex faceting over large datasets; transactions and the primary data store remain in PostgreSQL, with synchronization to ES through CDC."

> Senior tip: measure **cluster health and shard allocation** before adding nodes; for Vietnamese, test the analyzer yourself from the start (does an accented term match its unaccented form) — the wrong analyzer only becomes apparent after data exists, and reindexing is very expensive.`,
    follow: [
      'How do text and keyword differ, and when should you use both for one field?',
      'How should PostgreSQL and Elasticsearch be synchronized, and why should you not write directly to ES?',
      'What are the consequences of using the wrong analyzer, and how do you fix it with reindexing?'
    ]
  },
  'primer-017': {
    q: 'CI/CD fundamentals: how do continuous integration and continuous delivery differ? Which stages does a build-test-deploy pipeline include, and how does an artifact move through environments?',
    a: `**Summary:**
- **Continuous Integration (CI)**: on every commit/push, the pipeline **automatically builds + runs tests** to detect errors early, instead of "accumulating code for a month before integrating and testing it".
- **Continuous Delivery (CD)**: every change that passes the pipeline remains **releasable**; **Continuous Deployment** goes one step further: it **automatically deploys to production** when the pipeline is green.
- A typical pipeline is **build → test → (scan) → package artifact → deploy to an environment → smoke test**; the key principle is **build once, move the artifact through environments** (DEV → SIT/UAT → PROD), without rebuilding in later environments.

### Quick intuition
- **Before CI/CD**: each developer says "it works on my machine" and then emails a jar file to an operations engineer for manual deployment at midnight — releases happen only every few weeks, and each one is a nerve-racking event.
- **CI**: a factory has an **automated inspection line** immediately after each worker performs a task (commit) — defects are caught on the spot.
- **CD**: a product that meets the standard is **always ready on the shelf** for delivery to customers at any time; a release is no longer "New Year's Eve" but an ordinary, small, frequent activity.

### Which stages does the pipeline include?
~~~text
commit/push
    |
    v
[1] Build          mvn package (or gradlew build)
    |
    v
[2] Unit test      JUnit/Mockito: stop the pipeline on failure and notify the committer
    |
    v
[3] Quality gate   SAST / dependency check / code coverage (team-dependent)
    |
    v
[4] Package        jar/war or Docker image — THIS IS THE ONLY ARTIFACT
    |
    v
[5] Deploy DEV     automatically after merging into the main branch
    |
    v
[6] Integration/E2E tests on DEV (or SIT)
    |
    v
[7] Deploy SIT/UAT (automatically or with 1 click), run business acceptance tests
    |
    v
[8] Approve + Deploy PROD   (Continuous Delivery: requires a click; Continuous Deployment: automatic)
    |
    v
[9] Smoke test + monitoring   roll back if checks fail
~~~

### Artifact: build once, promote through environments
- An **artifact** is a packaged product that **does not change** between environments: a Maven jar or a Docker image.
- The **build once, deploy many** principle: the jar built at [1] is deployed to DEV, then **that same jar** goes to SIT, UAT, and PROD — only the **configuration** (DB, URL, secret) changes by environment.
- If you rebuild in each environment, the "artifact tested in UAT" may **not be identical** to the artifact in PROD — making UAT testing meaningless.

### A simplified pipeline example (GitHub Actions)
~~~yaml
name: ci
on: { push: { branches: [main] } }
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21' }
      - run: ./mvnw -B verify          # build + test in one step
      - uses: actions/upload-artifact@v4   # retain the jar for later deployment
        with: { name: app-jar, path: target/*.jar }
~~~
Another job (deploy) **downloads that same artifact** to deploy it to an environment — it does not rebuild it.

### Environments and configuration
| Environment | Purpose | Who deploys | Data |
|---|---|---|---|
| DEV | Developers verify newly merged code | Automatic | Fake data |
| SIT/UAT | Integration testing and business acceptance | Automatic/1-click | Near-real data (personal information masked) |
| PROD | Real customer use | Approval gate | Real data |

Configuration ({{application-dev.yml}}, {{application-prod.yml}}) and **secrets** (DB, API key) are separated from the artifact; secrets come from a secret store (AWS Secrets Manager, Vault, etc.) and are never committed to git.

### Common mistakes
- **A green pipeline with flaky tests** (random failures) → everyone just "clicks re-run until green", letting real bugs slip through; fix flaky tests instead of blaming infrastructure.
- **Rebuilding in every environment** → breaks "build once"; verify the checksum/exact artifact version during promotion.
- **Forgetting tests in the pipeline** → CI is just a "build server"; unit, integration, and E2E tests must act as quality gates.
- **A DB migration that breaks compatibility**: dropping/renaming a column while the old app version is still serving traffic → the old version fails immediately; use **expand-contract** (add the new column, deploy an app that uses both, and remove the old column in a later release).
- **No rollback** → a production incident leaves you helpless; retain old artifact versions and use blue-green/canary deployment so you can roll back within minutes.

### One-minute spoken answer
"Continuous integration means every commit is automatically built and tested to detect errors early; continuous delivery ensures every change that passes the pipeline is ready for release, while continuous deployment automatically deploys it to production. My pipeline includes build, unit tests, quality gates, artifact packaging, then deployment through DEV, SIT/UAT, and PROD with a final smoke test. The key principle is build once: the same artifact moves through environments, with only configuration and secrets changing. I also always have a rollback plan and never deploy without a way back."

> Senior tip: track **lead time** and **change failure rate** (two DORA metrics) — they show how effective your pipeline really is. A fast (< 10 minutes) and stable pipeline enables the whole team to release several times a day instead of making "risky weekend releases".`,
    follow: [
      'How do continuous delivery and continuous deployment differ?',
      'How should an artifact be promoted through environments to ensure "what you tested is what you deploy"?',
      'At which pipeline stage should database migrations run to avoid downtime?'
    ]
  }
});
