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
    a: `**Summary:** Logs and metrics are two different problems. Logs: agent on each node reads JSON logs with traceId, pushes through Kafka as a buffer, processes (parse, **mask sensitive data**), keeps hot data for a few days for search, and cold on object storage for long retention. Metrics: Prometheus scrapes, remote writes to a long-term time-series store, and **controls cardinality**. Cost mainly comes from what is indexed, so deciding "what to index, how long to keep" is more important than choosing the tool.`,
    follow: [
      'How do you ensure logs do not contain sensitive data (card numbers, national ID) at the application layer, beyond masking in the pipeline?',
      'Prometheus OOMs due to a sudden cardinality spike at 2 AM: how do you investigate and handle it?',
      'Compare head-based and tail-based sampling for distributed tracing.'
    ]
  },
  'design-020': {
    q: 'Design a real-time fraud detection system for card/digital wallet transactions: must decide approve, request additional verification, or decline within 100 ms. How do you combine a rule engine, feature store, and model?',
    a: `**Summary:** Separate into two paths: the **synchronous path** inside the payment flow reads pre-computed features (Redis), runs rules + model within a fixed time budget, and has a fallback policy when over time; the **asynchronous path** uses stream processing (Kafka + Flink) to compute velocity features over time windows, updates the feature store, detects complex patterns, and sends cases to analysts. Rules respond quickly to new fraud patterns; models catch subtle patterns; labels (chargebacks, complaints) feed back for training.`,
    follow: [
      'How do you backtest a new rule on 6 months of historical data before enabling it?',
      'A model scores well during training but performs poorly in production: what do you check?',
      'How do you design detection for "money mule" accounts receiving money from many victims?'
    ]
  },
  'design-021': {
    q: 'Design an OTP/2FA service for a bank: generate, store, expire, prevent brute force, and send SMS via multiple carriers with failover. Besides SMS OTP, what safer alternatives exist?',
    a: `**Summary:** A 6-digit OTP is generated with {{SecureRandom}}, only the **HMAC of the OTP** is stored in Redis with a short TTL (2–5 minutes), tightly bound to the purpose and transaction context. Verification is an atomic operation (Lua) that compares, counts failures, and deletes on success so it cannot be reused. Limit attempts, retries, and send via multiple SMS providers with failover based on delivery reports. SMS OTP is vulnerable to SIM swap and phishing, so for high-value transactions banks use Smart OTP (TOTP inside a registered device app) or biometrics.`,
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
