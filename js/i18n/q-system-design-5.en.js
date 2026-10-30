/*
 * English translation of js/data/q-system-design.js — task T198. Format: js/core/i18n.js (content overlay).
 * ids: design-018 design-019 design-020 design-021 architecture-009 architecture-010 architecture-011
 */
App.i18n.content({
  'design-018': {
    q: 'Design an autocomplete/typeahead feature for the search box of an e-commerce platform with 10 million daily users. Typing "dien th" must return "phone" (Vietnamese: "dien thoai") within 100 ms.',
    a: `**Summary:** Don't compute suggestions as the user types. An offline pipeline counts keyword frequency from search logs, builds a **prefix → top-K keyword** table (trie with cached top-K at each node), and loads it into the suggestion service RAM. Each request is just an O(prefix length) lookup. Add Vietnamese normalization (strip diacritics), debouncing on the client, caching for short prefixes, and a "trending" layer updated every few minutes.`,
    follow: [
      'How do you support misspelled typing (e.g., "dien thaoi") without slowing down the query?',
      'How do you update the new trie snapshot into instances without increasing latency during the swap?',
      'How do you personalize suggestions by user history while still leveraging the shared cache?'
    ]
  },
  'design-019': {
    q: 'A company has about 1,000 Spring Boot pods. Design a centralized log and metrics collection system: ingestion, storage, query, retention, and cost control. What mistakes do you avoid?',
    a: `**Summary:** Logs and metrics are two different problems. Logs: agent on each node reads JSON logs with traceId, pushes through Kafka as a buffer, processes (parse, **mask sensitive data**), keeps hot data for a few days for search, and cold on object storage for long retention. Metrics: Prometheus scrapes, remote writes to a long-term time-series store, and **controls cardinality**. Cost mainly comes from what is indexed, so deciding "what to index, how long to keep" is more important than choosing the tool.

### Scale estimation (assumptions)
- Logs: 1,000 pods × 100 lines/s × 400 bytes = 40 MB/s → 40 × 86,400 ≈ 3.5 TB/day raw data. Assuming 5–10× compression → 350–700 GB/day on storage.
- Metrics: 1,000 pods × 2,000 series (JVM, HTTP, pool, Kafka client) = 2 million active series; scrape 15 s → 2,000,000 / 15 ≈ 133,000 samples/s.
- These numbers show: full-text indexing all 3.5 TB/day for 90 days is very expensive; tiering is necessary.

### Architecture
~~~text
Pod (JSON log -> stdout)        Pod (/actuator/prometheus)
      |                                  |
Node agent (Fluent Bit / OTel Collector) Prometheus (scrape, keep 1-2 days)
      |                                  |
    Kafka (buffer, absorb spikes)    remote_write -> Mimir/Thanos/VictoriaMetrics (S3)
      |                                  |
Processor: parse, mask PII,          Grafana + Alertmanager
 filter DEBUG, attach metadata
      |
  +---+-----------------------+
  |                           |
Hot: OpenSearch/Loki (7 days)  Cold: S3 (compressed, partitioned by day) -> lifecycle to Glacier
~~~

### Application side
- JSON logs with {{traceId}}/{{spanId}}: Spring Boot 3 with Micrometer Tracing automatically puts traceId into MDC; from Spring Boot 3.4 structured logging (ECS, GELF, Logstash format) is available via configuration.
- Write to stdout, let agent collect; do not let app send logs directly over network (app slows down with logging system).
- Do not log full request/response; do not log card numbers, national ID, balances, OTPs. Masking at processor is only the second layer.

### Why Kafka in the middle
When an incident occurs, log volume spikes (stack traces, retries) exactly when the storage system is also under load. Kafka absorbs spikes within configured capacity and retention, giving the backend time to catch up and allowing multiple consumers (security team SIEM, data warehouse) to read the same stream. This is not a guarantee against log loss: must monitor consumer lag/disk and have disk buffer at agent when Kafka is unreachable; when buffer is full, a clear policy is needed.

### Tiered storage and retention
| Tier | Content | Duration | Notes |
|---|---|---|---|
| Hot | Searchable logs | 7–14 days | For incident investigation |
| Cold | All logs compressed on S3 | 90 days–years | Query with Athena when needed |
| Archive | Audit logs | Per regulation | S3 Object Lock (WORM), separate from app logs |
| Metrics | Raw 15 s | 15–30 days | Downsample to 5 min for older data |

Comparison of hot log storage: Elasticsearch/OpenSearch indexes full-text, powerful search but consumes CPU, RAM, disk; Loki indexes only labels (service, namespace, level) while content is stored as compressed chunks on object storage, much cheaper but content search is slower. Many choose Loki for app logs, ES for streams needing complex search.

### Cardinality: the most expensive mistake with metrics
~~~java
// WRONG: each userId creates a new time series -> millions of series, Prometheus OOM
Counter.builder("payment.requests").tag("userId", userId).register(registry).increment();

// CORRECT: tag with small, fixed value set
Counter.builder("payment.requests")
       .tag("channel", channel)        // APP, WEB, POS
       .tag("result", result)          // SUCCESS, FAILED, TIMEOUT
       .register(registry).increment();
~~~
Similarly, tag {{uri}} with actual IDs instead of template. Set series limit per job at storage side and alert when series count spikes.

### Cost control
- Enable DEBUG per service, per time window; sample repeated success logs, keep 100% error logs.
- Charge cost by team (by namespace) and show them the bill; cost drops immediately when teams see their own invoice.
- Tracing uses tail-based sampling: keep error or slow traces, sample the rest.

### Failure modes
- Logging system dies exactly when needed most: monitoring of the logging system itself must be independent (at least basic alerts not going through it).
- One service logging errors in a loop floods Kafka: rate limit per source at agent.
- Clock skew between nodes breaks log ordering: rely on traceId to correlate, not just timestamp.

> Senior tip: before discussing tools, ask "what % of logs do we actually ever search?". The answer is usually very small. Hot/cold tiering and sampling success logs often reduces cost far more than switching from ES to another tool.`,
    follow: [
      'How do you ensure logs do not contain sensitive data (card numbers, national ID) at the application layer, beyond masking in the pipeline?',
      'Prometheus OOMs due to a sudden cardinality spike at 2 AM: how do you investigate and handle it?',
      'Compare head-based and tail-based sampling for distributed tracing.'
    ]
  },
  'design-020': {
    q: 'Design a real-time fraud detection system for card/digital wallet transactions: must decide approve, request additional verification, or decline within 100 ms. How do you combine a rule engine, feature store, and model?',
    a: `**Summary:** Separate into two paths: the **synchronous path** inside the payment flow reads pre-computed features (Redis), runs rules + model within a fixed time budget, and has a fallback policy when over time; the **asynchronous path** uses stream processing (Kafka + Flink) to compute velocity features over time windows, updates the feature store, detects complex patterns, and sends cases to analysts. Rules respond quickly to new fraud patterns; models catch subtle patterns; labels (chargebacks, complaints) feed back for training.

### Clarify requirements
- Decision: APPROVE, CHALLENGE (request OTP/biometrics), DECLINE, with reason for customer and analyst explanation.
- Scale assumption: 20M transactions/day → 20,000,000 / 86,400 ≈ 230 TPS average; peak (sale day, payday) 10× → ~2,300 TPS.
- Latency budget: p99 ≤ 100 ms for entire fraud check, as it adds directly to payment latency.
- Two conflicting business metrics: **fraud detection rate** and **false positive rate** (legitimate customers blocked, friction). Must agree with business on acceptable levels.

### Architecture
~~~text
Payment Service --(sync, timeout 100ms)--> Fraud Decision Service
                                            | 1. read features (Redis)      ~5 ms
                                            | 2. rule engine                ~2 ms
                                            | 3. model score                ~10 ms
                                            | 4. combine -> decision + reason
                                            v
                                         Kafka: txn + decision events
                                            |
              +-----------------------------+-----------------------------+
              |                             |                             |
       Flink: velocity/window         Case management (analyst)       Data lake (S3)
       -> update Redis features       confirm fraud -> labels          -> training, backtest rule
~~~

### Features: the quality determinant
| Category | Examples | Computed where |
|---|---|---|
| Velocity | Card txn count in 10 min, total amount 24h | Counter per bucket, updated synchronously |
| Device/Network | New device, suspicious IP range, emulator | At request time |
| Behavior | Deviation from 90-day avg amount, unusual hour | Flink/batch, stored in Redis |
| Relationship | New beneficiary, beneficiary reported by many accounts | Graph/batch |
| Geolocation | Two txns 1,000 km apart within 30 min | Store last location |

Velocity for the current transaction must be computed **in the synchronous path** (Flink is delayed by seconds; a fraudster firing 20 txns in 10 seconds would slip through):
~~~java
// Sketch: production needs atomic INCR + TTL and dedup by transactionId.
// 1-minute bucket approximates sliding window; retries must use idempotency key.
long countLast10Min(String cardHash) {
    long minute = Instant.now().getEpochSecond() / 60;
    String key = "vel:" + cardHash + ":" + minute;
    redis.opsForValue().increment(key);                   // counts current txn too
    redis.expire(key, Duration.ofMinutes(11));            // illustration; combine two commands in production
    List<String> keys = LongStream.range(minute - 9, minute + 1)
            .mapToObj(m -> "vel:" + cardHash + ":" + m).toList();
    return redis.opsForValue().multiGet(keys).stream()    // 1 round-trip for 10 buckets
            .filter(Objects::nonNull).mapToLong(Long::parseLong).sum();
}
~~~
Features used at training and serving must be computed with **the same definition**; otherwise model looks good on paper but performs poorly in production (training-serving skew). That's why a feature store with online/offline faces exists.

### Rules and model
- Rule engine (custom DSL or Drools) configurable without deploy: "new beneficiary AND amount > 50M AND new device → CHALLENGE". Rules are explainable, react fast to new fraud types.
- Model (gradient boosting popular for tabular data) outputs risk score; runs in-process (ONNX Runtime has Java API) to avoid extra network hop.
- Combination: hard-block rules always win; rest by score threshold. New rules run in **shadow mode** (log only, no block) for several days to measure false positive rate before enabling.

### When fraud service is slow or down
| Policy | When |
|---|---|
| Fail-open (allow) | Small amount, long-time customer |
| Step-up (CHALLENGE) | Default when uncertain |
| Fail-closed (decline) | Large amount, new beneficiary |
Fallback decision must be recorded and reviewed asynchronously.

### Bottlenecks and risks
- Hot Redis key for large merchant: shard counter then aggregate.
- Labels arrive late (chargeback weeks later) → model evaluation must account for label latency.
- Fraudsters probing thresholds: do not return detailed reasons to client; rotate rules periodically.
- PII: hash card numbers (tokenization), restrict case access.

> Senior tip: in banking, the biggest battle now is social engineering where the customer voluntarily transfers money (authorised push payment fraud), not stolen cards: it's the real owner, correct device, correct OTP. The truly useful features are about the **beneficiary** (newly opened account, receiving from many victims) and anomalous behavior like being on a call. Mention this example in your answer; banking interviewers will value it.`,
    follow: [
      'How do you backtest a new rule on 6 months of historical data before enabling it?',
      'A model scores well during training but performs poorly in production: what do you check?',
      'How do you design detection for "money mule" accounts receiving money from many victims?'
    ]
  },
  'design-021': {
    q: 'Design an OTP/2FA service for a bank: generate, store, expire, prevent brute force, and send SMS via multiple carriers with failover. Besides SMS OTP, what safer alternatives exist?',
    a: `**Summary:** A 6-digit OTP is generated with {{SecureRandom}}, only the **HMAC of the OTP** is stored in Redis with a short TTL (2–5 minutes), tightly bound to the purpose and transaction context. Verification is an atomic operation (Lua) that compares, counts failures, and deletes on success so it cannot be reused. Limit attempts, resends, and send via multiple SMS providers with failover based on delivery reports. SMS OTP is vulnerable to SIM swap and phishing, so for high-value transactions banks use Smart OTP (TOTP inside a registered device app) or biometrics.

### Requirements
- Purpose: new device login, transaction confirmation, security info change.
- Scale assumption: 2M OTPs/day → ~23/s average, peak a few hundred/s. Load is not huge; the priority is **security and SMS delivery rate**.
- OTP is single-use, expires fast, cannot use OTP from transaction A for transaction B.

### API
~~~text
POST /otp/challenges   {purpose, userId, context:{txnId, amount, beneficiary}} -> challengeId
POST /otp/verify       {challengeId, code} -> OK | WRONG(n left) | EXPIRED | LOCKED
~~~

### Generation and storage
- {{SecureRandom}}, not {{Random}} or {{Math.random}} (predictable).
- Store {{HMAC-SHA256(serverKey, challengeId + code)}} not raw code: leaked Redis dump or logs won't reveal valid OTPs.
- Redis key: {{otp:<challengeId>}} is a hash with h (HMAC), n (attempt count), transaction context summary; TTL 3 minutes.
- SMS content states the action clearly: "OTP to confirm transfer 5,000,000 to ...123. Do not share OTP with anyone". Customer reading what they confirm is the cheapest anti-phishing layer.

### Atomic verification
~~~text
-- KEYS[1] = otp:<challengeId>, ARGV[1] = HMAC of user-entered code, ARGV[2] = max attempts
local h = redis.call('HGET', KEYS[1], 'h')
if not h then return -1 end                      -- expired or already used
local n = redis.call('HINCRBY', KEYS[1], 'n', 1)
if n > tonumber(ARGV[2]) then redis.call('DEL', KEYS[1]) return -2 end   -- locked
if h == ARGV[1] then redis.call('DEL', KEYS[1]) return 1 end            -- correct: delete, no reuse
return 0                                          -- wrong, attempts left
~~~
Why atomic: if read-compare-delete in Java, two parallel requests with the same correct code could both succeed (OTP used twice), or attacker sends many parallel guesses and counter doesn't increment fast enough.

### Brute force: do the math
6-digit OTP has 10^6 possibilities. Allow 5 attempts per OTP → guess probability 5 / 1,000,000 = 0.0005%. If max 10 OTPs/day per account → daily probability ≈ 50 / 1,000,000 = 0.005%. Without resend limit, attacker just requests new OTPs continuously and this math becomes meaningless. Therefore:
- Limit attempts per OTP, limit resends per user, per phone, per IP/device; 60s cooldown between resends.
- Do not hard-lock account based only on unverified requests (easy DoS); apply cooldown/rate limit, step-up challenge, and lock process with proper risk signals, while notifying account owner.
- Prevent **SMS pumping**: attacker uses OTP form to send SMS to expensive international numbers, splits revenue with carrier. Block unnecessary international prefixes, CAPTCHA for unauthenticated flows.

### Multi-provider SMS sending
~~~text
OTP Service -> Kafka topic sms.otp (high priority, separate from marketing SMS)
                  |
            SMS Router: pick provider by recipient carrier + recent success rate
                  |-- Provider A (brandname)   --DLR-->
                  |-- Provider B (fallback)    --DLR-->
            No success DLR after ~20 s -> resend via another provider (SAME OTP)
~~~
- Retry must use the **same code** within the same challenge, otherwise customer receives two different codes and enters the wrong one.
- Track success rate and latency per provider/carrier; circuit breaker when a provider is down.

### Stronger alternatives to SMS
| Method | Pros | Cons |
|---|---|---|
| SMS OTP | Everyone can use | SIM swap, phished OTP, carrier dependent, costs money |
| TOTP (RFC 6238) / Smart OTP in app | No network, cheap, bound to registered device | Lost device needs secure re-enrollment |
| Push approval in app | Good UX, shows transaction context | Must prevent reflexive "approve" taps |
| Biometrics (face) matched against ID data | Hard to impersonate | Cost, eKYC process |

In Vietnam, high-value transfers now require biometric verification per central bank regulation; SMS OTP is increasingly a secondary role.

> Senior tip: real-world OTP vulnerabilities are rarely the generation algorithm but the **business flow**: verification endpoint with no attempt limit, OTP not bound to transaction (login OTP used for transfer), or OTP leaking into app logs. When reviewing, I grep the OTP service logs first.`,
    follow: [
      'How do you implement TOTP in the app: how does a new device safely activate Smart OTP without an attacker taking it over?',
      'One carrier delivers SMS slowly by 2 minutes during peak hours: how does your system detect and respond?',
      'How do you prevent distributed OTP brute-force attacks from thousands of different IPs?'
    ]
  },
  'architecture-009': {
    q: 'What are the ways to write a thread-safe Singleton in Java? Why do many people consider Singleton an anti-pattern, and how does Spring singleton scope differ from GoF Singleton?',
    a: `**Summary:** The cleanest and safest approaches are **enum singleton** or **holder idiom** (lazy, thread-safe thanks to JVM class initialization). Double-checked locking is only correct when the field is {{volatile}}. GoF Singleton is criticized as **hidden global state**: dependencies are not visible in the constructor, hard to mock, hard to test in parallel. Spring singleton is different: **one instance per bean definition within an ApplicationContext**, injected via constructor, so it keeps the "single instance" benefit without the drawbacks. And Spring singleton is **not automatically thread-safe**.`,
    follow: [
      'When do you choose holder idiom vs enum singleton?',
      'A singleton bean has a {{SimpleDateFormat}} field that causes random date errors in production. Explain and fix.',
      'How do you get a new instance of a prototype bean each time it is called from a singleton bean?'
    ]
  },
  'architecture-010': {
    q: 'Distinguish Simple Factory, Factory Method, and Abstract Factory using an example integrating multiple payment gateways (VNPay, MoMo, international cards). In Spring, do you still need to write your own factory?',
    a: `**Summary:** **Simple Factory** is a function (often static) that selects a class to {{new}} based on a parameter; it is not a GoF pattern. **Factory Method** is an abstract method in a parent class; the subclass decides which object to create, and the parent uses it in a common algorithm. **Abstract Factory** is an interface that creates a **family of related objects** that must work together (client + signer + parser for the same partner). In Spring, most "choose implementation" is done by injecting a {{Map}} or {{List}} of beans; you only write your own factory when the object depends on **runtime parameters**.`,
    follow: [
      'When do you choose Factory Method (inheritance) instead of passing Strategy through a constructor?',
      'Injecting {{Map<String, Bean>}} in Spring: where does the key come from and how do you handle a missing key?',
      'Give an example of a Spring {{FactoryBean}} and when you would write one.'
    ]
  },
  'architecture-011': {
    q: 'When should you use the Builder pattern? The team uses Lombok @Builder everywhere, even on JPA entities. What pitfalls will you point out in code review?',
    a: `**Summary:** Builder fits objects with **many parameters, many optional ones**, and that should be **immutable**: it replaces telescoping constructors and avoids parameter-order mistakes for same-type arguments. Lombok {{@Builder}} is convenient but has traps: it skips default field values (needs {{@Builder.Default}}), does not enforce required fields, breaks the no-arg constructor that JPA/Hibernate needs, {{toBuilder}} does shallow copy, and does not handle inheritance. For simple immutable DTOs, Java {{record}} is often a better choice.`,
    follow: [
      'Can a Java 17 record fully replace Builder? When is Builder still needed?',
      'How do you enforce required fields in a builder so errors appear at compile time instead of runtime (step builder)?',
      'Why does JPA need a no-arg constructor and when does Hibernate use it?'
    ]
  }
});