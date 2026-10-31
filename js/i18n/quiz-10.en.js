/*
 * English translation of js/data/quiz.js — task T235. Format: js/core/i18n.js (content overlay).
 * ids: qz-kotlin-008 qz-testing-007 qz-testing-008 qz-aws-007 qz-aws-008 qz-ai-007 qz-ai-008
 */
App.i18n.content({
  'qz-kotlin-008': {
    q: 'A data class is used as a key in a HashMap, and then one of its {{var}} properties is mutated. What happens?',
    options: [
      'The data class caches hashCode at object creation so the map still finds it normally',
      'The HashMap automatically rehashes when the object changes',
      'It only affects the map if the property is nullable',
      'The hashCode changes, so the object lands in a different bucket; get/contains return null/false even though the object is still in the map, so keys must be immutable or not mutated after being put into hash-based collections'
    ],
    explain: `**Correct answer: mutating a property breaks the hashCode/equals contract of the key.**

A {{data class}} generates {{equals}}, {{hashCode}}, and {{toString}} based on **all properties in the primary constructor**. When the object is put into a {{HashMap}}, the bucket index is calculated from the hashCode at that moment. If a property involved in the hashCode is mutated, the new hashCode leads to a different bucket; {{get}} will search in the wrong place and return null even if the object is still in the map. This is a **logic memory leak**: the entry is inaccessible but still occupies space.

### Why the other options are wrong
- **Data class caches hashCode**: the {{data class}} hashCode is recalculated from properties on every call. The {{HashMap}} stores the old hash in the node at put time; when get is called, it computes a new hash from the mutated key, so it does not match the old node (and usually lands in a different bucket).
- **HashMap automatically rehashes**: it only rehashes when the element count exceeds the threshold and the table resizes, not when the object's content changes.
- **Only affects nullable properties**: the property type is irrelevant; any property involved in hashCode that changes its value will cause this issue.

### Prevention
- Use **immutable keys**: {{val}} for all properties involved in equals/hashCode, and ensure internal collections are not mutated either.
- If you need a key with mutable state, use a **stable ID** as the key instead of the object itself.
- Be careful with {{Array}} in data classes: equals/hashCode use reference equality, not content equality; use wrappers or custom classes.
- With JPA entities, do not use managed entities as keys because the hashCode might change when an ID is assigned.

> Senior tip: Treat keys in hash-based collections as **contractually immutable**, even if the language doesn't enforce it. If you must use mutable objects as keys, create a separate key class that only contains the stable fields. This class of bug is extremely hard to track down because simple tests will still pass.`
  },
  'qz-testing-007': {
    q: 'An integration test waits for a message from Kafka using {{Thread.sleep(5000)}} and then asserts. What is the problem, and what is the correct fix?',
    options: [
      'It is fine as long as CI is fast enough, just keep it as is',
      'Sleep makes tests slow and remains flaky if the message arrives late; use Awaitility or wait for a condition with a timeout and poll, checking the state instead of waiting for a fixed time',
      'Increase sleep to 30 seconds to ensure the message has arrived',
      'Drop asynchronous tests entirely as they cannot be tested stably'
    ],
    explain: `**Correct answer: replace fixed sleep with conditional waiting.**

{{Thread.sleep(5000)}} is an assumption about time, not behavior. On CI with high load, the message might arrive after 5 seconds → the test fails even though the code is correct. On a fast machine, the test needlessly waits 5 seconds every time. The correct approach is to wait for a **condition** with a timeout and poll interval, e.g., {{Awaitility.await().atMost(10, SECONDS).untilAsserted(...)}}, or use a {{CountDownLatch}}/consumer listener to know for sure that the message has been processed. The test will be fast when everything is ready and still patient when things are slow.

### Why the other options are wrong
- **Keep it if CI is fast**: CI is unstable; this is a common source of flaky tests.
- **Increase to 30 seconds**: makes tests very slow and still flaky under high load; doesn't solve the root cause.
- **Drop asynchronous tests**: loses the system's most important message-handling verification; these can be tested stably if the right tools are used.

### Example with Awaitility
~~~java
await().atMost(Duration.ofSeconds(10))
       .pollInterval(Duration.ofMillis(200))
       .untilAsserted(() -> assertEquals("PAID", orderRepo.findById(id).orElseThrow().getStatus()));
~~~

For Kafka, {{ContainerTestUtils.waitForAssignment}} can be used to wait for the consumer to receive a partition before sending the message, avoiding races during startup.

> Senior tip: Whenever you see {{Thread.sleep}} in a test, treat it as a code smell that needs fixing. If you must wait for a task without a signal, at least use a polling loop with a timeout and log the reason. Measure test duration to detect unusually slow tests before they become bottlenecks in the pipeline.`
  },
  'qz-testing-008': {
    q: 'You use @SpringBootTest for all tests, and the test suite takes nearly 20 minutes. What is the best way to improve this?',
    options: [
      'Delete slow tests so the pipeline is faster',
      'Switch everything to mocks so Spring doesn\'t need to be started',
      'Increase timeout and run in parallel on one machine to compensate for the time',
      'Use appropriate test slices like @WebMvcTest or @DataJpaTest, unit tests for pure logic, and only use @SpringBootTest for integration flows; keep configuration consistent so context caching is effective'
    ],
    explain: `**Correct answer: stratify testing and leverage context caching.**

{{@SpringBootTest}} starts almost the entire application context, taking anywhere from several seconds to tens of seconds each time. Spring caches contexts based on **configuration** (properties, mock beans, slice type); if each test class has different configuration, the cache is fragmented and the context is rebuilt repeatedly. Correct approach:
- **Unit tests** for pure logic, no Spring needed — runs in milliseconds.
- **Slice tests**: {{@WebMvcTest}} only loads the web layer, {{@DataJpaTest}} only loads JPA, which is much faster.
- **@SpringBootTest** only for integration flows that truly need multiple layers.
- Keep test configuration consistent and avoid excessive {{@MockBean}}/{{@MockitoBean}}/{{@DirtiesContext}} as they create new contexts (from Spring Boot 3.4, {{@MockitoBean}} replaces the deprecated {{@MockBean}}).

### Why the other options are wrong
- **Delete slow tests**: loses coverage, especially in critical flows; doesn't solve the test architecture problem.
- **Mock everything**: loses the ability to catch real integration errors, creating a false sense of security.
- **Increase timeout and run in parallel**: only masks the symptom; running in parallel also contends for resources and can make tests slower/flakier.

### How to check context cache
Enable logs for {{org.springframework.test.context.cache}} at DEBUG level to see how many contexts are created and why misses occur. If you see dozens of contexts, consolidate test configurations into a few variants.

> Senior tip: The goal is not "fast tests at any cost" but a **fast feedback loop for most changes**. Keep unit tests under a few seconds, slice tests under a minute, and run integration tests in the pipeline before merging. Measure time by layer to know where to optimize.`
  },
  'qz-aws-007': {
    q: 'An SQS consumer takes longer to process a message than the visibility timeout. What happens, and what is the correct fix?',
    options: [
      'SQS holds the message until the consumer calls delete, so there is no problem',
      'The message becomes visible again and may be received by another consumer, causing duplicate processing; set visibility timeout higher than the maximum processing time, or extend it via ChangeMessageVisibility, and make the consumer idempotent',
      'SQS automatically increases visibility timeout based on actual processing time',
      'Just switch to a FIFO queue and duplication will cease'
    ],
    explain: `**Correct answer: message is redelivered, so increase visibility timeout and make the consumer idempotent.**

When a consumer receives a message, SQS hides the message for the **visibility timeout**. If that time passes without a {{DeleteMessage}} call, the message becomes visible again and another consumer (or the same one) might receive it. SQS is **at-least-once**, so duplicate processing is normal, not an exception. Handling:
- Set visibility timeout **higher than the maximum processing time** (measured at p99 plus a margin; for Lambda, AWS recommends about 6 times the function timeout).
- For long jobs, call {{ChangeMessageVisibility}} periodically to extend (heartbeat).
- Use an **idempotency key** in the consumer (dedup table, unique constraint, conditional write).
- Configure a **DLQ** with {{maxReceiveCount}} to prevent infinitely processing "poison" messages.

### Why the other options are wrong
- **SQS holds until delete**: false; the message becomes visible again after the visibility timeout even if not deleted.
- **SQS automatically increases timeout**: false; visibility timeout is a configuration, SQS does not adjust it based on processing time.
- **FIFO fixes duplication**: false; FIFO only dedups based on {{MessageDeduplicationId}} within a 5-minute window and guarantees ordering within a group; it does not prevent redelivery after visibility timeout and does not replace idempotency.

> Senior tip: Design the consumer to be **idempotent first**, then tune the visibility timeout. Don\'t set the timeout blindly high, as faulty messages will sit for a long time before entering the DLQ. Monitor {{ApproximateReceiveCount}} to detect messages being processed repeatedly and alert early.`
  },
  'qz-aws-008': {
    q: 'A DynamoDB table has {{userId}} as the partition key, and a few high-profile users generate massive traffic, causing a hot partition. What is the most reasonable redesign?',
    options: [
      'Add a random suffix to the partition key to distribute writes/reads across shards, or select a suitable composite key for access patterns; use cache/retry backoff for hot reads and avoid scans',
      'Just increasing read/write capacity is enough for all cases',
      'Switch to table scanning to avoid hot partitions',
      'Set the partition key to timestamp so items are evenly distributed'
    ],
    explain: `**Correct answer: distribute hot data using write sharding or a composite key suitable for queries.**

DynamoDB limits resources **per partition** (about 3000 RCU and 1000 WCU, along with a storage limit). A single userId with overwhelming traffic will be concentrated in one partition and throttled even if the table has plenty of capacity. Solutions:
- **Write sharding**: append a random suffix (0..N-1) to the partition key, write evenly; when reading, read N shards and merge.
- **Composite key** based on access pattern: add a high-cardinality dimension to the partition key, e.g., {{PK = USER#id#2026-10}} (bucket by month), {{SK = TYPE#timestamp}}, so that a hot user's data spreads across multiple partitions.
- For hot reads, use **DAX** or application-level caching, and retry with exponential backoff.
- Avoid {{Scan}} as it consumes capacity and is slow.

### Why the other options are wrong
- **Just increase capacity**: total capacity doesn\'t help if a single partition still exceeds the limit; adaptive capacity is only a slight mitigation, not a solution for extreme hot keys.
- **Table scanning**: reads all data, is more expensive and slower, especially as the table grows.
- **Partition key is timestamp**: writes might be distributed over time, but querying by user will require scanning; additionally, writing to the same second still creates a hot partition.

> Senior tip: DynamoDB design starts from **access patterns**, not a relational model. If a natural key can be hot, accept sharding and handle the merging at the application layer. Monitor {{ConsumedWriteCapacityUnits}} per partition key to detect early before users see throttle errors.`
  },
  'qz-ai-007': {
    q: 'You change the embedding model of a RAG pipeline from model A to model B. What is mandatory?',
    options: [
      'Just change the model configuration, the old vectors can still be used because the dimensionality is the same',
      'Increase temperature to compensate for the difference between the two models',
      'Re-embed the entire document corpus using model B and use model B for queries, because the vector spaces are different even if the dimensions are the same; store the model version with the vector to avoid mixing',
      'Only re-embed documents added after changing the model'
    ],
    explain: `**Correct answer: re-embed the entire corpus and query using the same model.**

Each embedding model learns its own **vector space**. Two vectors with the same dimensions but from different models have no comparable meaning — the cosine distance between them is nearly meaningless. If you only embed new documents with model B while old documents remain model A, the query will mix two spaces, and retrieval quality will degrade in a hard-to-diagnose way. Therefore:
- Re-embed **all** chunks using model B.
- Use **the same model B** for queries during retrieval.
- Store {{embedding_model}} and version with each vector to avoid mixing.
- Run **blue-green index**: build a new index, evaluate, then switch traffic.

### Why the other options are wrong
- **Same dimensions are usable**: dimensionality does not determine vector space; this is a dangerous misconception.
- **Increase temperature**: temperature only affects text generation, not embeddings or retrieval.
- **Only re-embed new docs**: creates a mixture of two spaces, skewing retrieval.

> Senior tip: Treat the embedding model as part of the **data schema**, not a configuration parameter. When upgrading, measure recall on the eval set before and after, and keep the ability to rollback to the old index during the transition. The cost of re-embedding can be high, so plan for batching and track progress.`
  },
  'qz-ai-008': {
    q: 'An LLM returns JSON for a pipeline but occasionally misses fields or uses wrong types. What is the most correct production handling approach?',
    options: [
      'Trust the JSON because you requested the format clearly in the prompt',
      'Use structured output/JSON schema when the API supports it, still validate the schema on the server, retry with limitations for specific errors, and have a fallback or human review',
      'Increase temperature for more diverse and easier-to-parse output',
      'Wrap JSON.parse in try/catch and ignore error messages'
    ],
    explain: `**Correct answer: constrain output with schema and still validate on the server.**

The prompt is only a **soft guide**; the model can generate JSON missing fields, with wrong types, or add text outside the JSON. Modern APIs have **structured output** or JSON schemas to drastically reduce formatting errors, but it doesn\'t eliminate them — you must still:
- **Validate** with JSON Schema (required fields, types, enums, length limits) on the server.
- **Retry with limitations** upon error, sending the specific error information back for the model to fix; avoid infinite loops.
- **Fallback** clearly: return controlled errors, send to review queue, or use rule-based logic.
- Log and metric errors by type to detect model drift.

### Why the other options are wrong
- **Trust the prompt**: no guarantee; this is a common source of production errors.
- **Increase temperature**: makes output more random, even more likely to have formatting errors.
- **try/catch and ignore**: silently loses data, no warning, and the pipeline continues in an incomplete state.

### Handling pattern
~~~text
1. Call model with response_format = json_schema
2. Parse JSON, validate schema
3. If error: retry max 2 times with error description
4. If still error: send to dead-letter with original input for review
5. Log metric: error rate by schema version and model
~~~

> Senior tip: Never let an LLM be the sole data source for irreversible actions. For important pipelines, use **schema versioning** and test with diverse inputs, including cases where the model returns empty results or invalid JSON.`
  }
});