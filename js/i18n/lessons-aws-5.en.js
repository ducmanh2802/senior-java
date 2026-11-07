/*
 * English translation of js/data/lessons-aws.js — task T812. Format: js/core/i18n.js (content overlay).
 * ids: lesson-aws-006
 */
App.i18n.content({
  'lesson-aws-006': {
    title: 'DynamoDB for Java devs: partition key, sort key, query vs scan, conditional writes and optimistic locking',
    goals: [
      'Explain how the partition key decides where data physically lives and why choosing the wrong key slows down the whole table',
      'Distinguish GetItem, Query, Scan by cost and by the order of returned results',
      'Estimate RCU/WCU for an operation and choose on-demand vs provisioned',
      'Write conditional writes to avoid overwrites and to implement optimistic locking',
      'Know what GSI, TTL and Streams solve, and when NOT to use DynamoDB',
    ],
    body: `### What problem DynamoDB solves
DynamoDB is a **serverless document-style key-value database**: you do not pick an instance, do not shard, do not patch; AWS replicates data across at least 3 AZs and keeps read/write latency at **a few milliseconds even when traffic grows 10x**. The price you pay: **no SQL, no joins, no foreign keys**, and every performance characteristic depends on how you design the **key**. This is the shock for Java devs: in RDS you write the query first then add indexes; in DynamoDB you must list the **access patterns** (who asks what, and how) **first**, then name the table.

Data is an **item** (a small JSON, max **400 KB**) in a **table**. Each table is defined by its **primary key**:
- only a **partition key** ({{pk}}), e.g. table {{users}} with {{pk = email}}, or
- **{{pk}} + sort key ({{sk}})**, e.g. {{pk = "customer#C42"}}, {{sk = "order#1730000000000"}}.

~~~text
  DynamoDB physically: many "partitions" (buckets), each holding many items

     hash(pk) -->  [ partition P1 ]  [ P2 ]  [ P3 ] ... [ Pn ]
                        |
        items with the same pk live in ONE bucket, sorted by sk:
          customer#C42 | order#1730000000001
          customer#C42 | order#1730000000002     <- same partition = one Query reads them all
          customer#C42 | profile
~~~

### Partition key: choosing wrong cannot be patched later
{{pk}} is hashed to pick a partition. Consequences:
- **A single GetItem/Query always lives in exactly one partition.** That is why it is fast and cost predictable.
- **All items with the same {{pk}} are limited by the capacity of one partition** (AWS recommends keeping under ~10 GB per key value).
- **Hot partition**: if one {{pk}} value takes most of the traffic, that bucket overflows while the rest of the table watches. Common real examples: {{pk = "tenant-acme"}}, or {{pk = status}} (only 4 values!), or {{pk = "2026-11"}} when a month groups all orders.

How to choose: {{pk}} must have **high cardinality** and traffic **evenly distributed** per query unit. Need statistics by month? Add a time prefix to {{sk}} ({{pk = "customer#C42"}}, {{sk = "order#2026-11#000173"}}), do not turn the month into {{pk}}.

{{sk}} ordering is **byte (lexicographic) order**, not numeric: {{order#2}} comes **after** {{order#10}}. To sort correctly, zero-pad ({{order#0010}}) or use epoch milliseconds (13 digits always compare correctly as strings).

### GetItem, Query, Scan: three price levels
| Operation | Reads what | Cost | Use when |
|---|---|---|---|
| {{GetItem}} | exactly one item by {{pk}}(+{{sk}}) | cheapest, 1 read unit for small item | open order detail, profile |
| {{BatchGetItem}} | up to 100 items (16 MB cap) | each item priced separately | "home page needs 40 latest orders" when Query is not usable |
| {{Query}} | every item of **one** {{pk}}, further filtered by {{sk}} ({{begins_with}}, {{between}}), returned **in {{sk}} order** | proportional to items in partition | list of one customer's orders, timeline |
| {{Scan}} | **scans the whole table** then filters with {{FilterExpression}} | most expensive, pay for data discarded | debug, export small table, one-off job |

> {{FilterExpression}} applies **after** data is already read: you still pay for what was read. Beginners often write "query with filter" and think it is as cheap as a SQL index — in DynamoDB, to filter fast on another attribute you must put that attribute into the **key** or a **GSI**.

### Capacity: priced in units, not GB
- **1 RCU** (read capacity unit) = **1 strongly consistent read** / sec for an item up to **4 KB**, or **2 eventually consistent reads** / sec for a 4 KB item. Strongly consistent reads cost **double** for the same data. A 5 KB item counts as 2 units of 4 KB (rounded **up per item**).
- **1 WCU** = **1 write** / sec for an item up to **1 KB** — note the granularity differs from reads (1 KB vs 4 KB); a 2 KB item costs 2 WCU to write.
- **On-demand**: pay per actual request, fits unpredictable or experimental traffic; more expensive per unit but no estimation needed. **Provisioned**: set RCU/WCU + **auto scaling**; much cheaper for steady traffic, but you must estimate and there is a cap — exceeding it hits {{ProvisionedThroughputExceededException}}.
- A Query returns **one page** (default 1 MB or {{Limit}}); more data comes with {{LastEvaluatedKey}} → you must use it as {{ExclusiveStartKey}} next time. Java devs often forget this step and think "data is missing".

### Conditional writes and optimistic locking
A plain {{PutItem}} is an **upsert**: it overwrites the whole item, even if someone else just changed it. For safety use a **conditional write** — the condition is evaluated **server-side, atomically within a single item**:
- {{attribute_not_exists(pk)}} → "create only if not already existing" (prevents duplicate creation, prevents overwriting an existing order).
- {{attribute_exists(pk)}} → "update only if currently existing".
- comparisons: {{version = :v}}, {{stock > :qty}}.

**Optimistic locking** pattern: each item carries a {{version}}; read → modify → write with condition {{version}} unchanged, and write {{version + 1}}. The loser receives {{ConditionalCheckFailedException}} and decides to reread/retry/drop/merge. No lock held, no one dies holding a lock — exactly the spirit of a distributed system.

~~~seq
title: Two workers decrement stock, version 7
actors: Worker A | Worker B | DynamoDB
Worker A -> DynamoDB: GetItem sku-1 (version 7)
Worker B -> DynamoDB: GetItem sku-1 (version 7)
Worker A -> DynamoDB: PutItem version 8, condition version = 7
DynamoDB --> Worker A: OK, decremented by 1
Worker B -> DynamoDB: PutItem version 8, condition version = 7
DynamoDB --> Worker B: ConditionalCheckFailedException
note Worker B: reread (version 8) then retry
~~~

Need multiple items/tables at once? Use **TransactWriteItems** (up to 100 operations, or condition checks / puts / updates / deletes): guarantees all-or-nothing atomicity but **costs double** and is slower; do not turn every business flow into a transaction when a conditional write on one item is enough.

### Java SDK v2 (Enhanced Client)
~~~java
@DynamoDbBean
public class Order {
    private String pk;   // "customer#C42"          -> partition key
    private String sk;   // "order#1730000000000"   -> sort key (epoch ms: comparable as strings)
    private long totalCents;
    private String status;
    @DynamoDbPartitionKey public String getPk() { return pk; }
    @DynamoDbSortKey      public String getSk() { return sk; }
    // getters/setters for totalCents, status
}

DynamoDbTable<Order> table = DynamoDbEnhancedClient.builder()
        .dynamoDbClient(ddb)                 // client created once; no credentials passed: SDK fetches the role
        .build()
        .table("orders", TableSchema.fromBean(Order.class));

// 1 Query for "all orders of customer C42 in November", returned in sk order
PageIterable<Order> page = table.query(QueryEnhancedRequest.builder()
        .queryConditional(QueryConditional.sortBeginsWith(KeyPair.of("customer#C42", "order#1730")))
        .build());

// "Create only if not already existing" -> prevents overwriting a paid order
table.putItem(PutItemEnhancedRequest.builder(Order.class)
        .item(ready)
        .conditionExpression(ConditionExpression.builder()
                .values("attribute_not_exists(pk)").build())
        .build());
~~~

### GSI, sparse index, TTL, Streams
- **GSI (Global Secondary Index)**: a "secondary key" with its own {{pk}}/{{sk}}, can be created and modified after the table is running. It **keeps a copy** of items that have the indexed attributes → writes cost extra WCU for the index. If you need to query by an attribute the base table does not index, you must have a GSI.
- **Sparse GSI**: a GSI only contains items that **have** its key attributes. This is how you index "a subset" — e.g. GSI {{(gsi_status, gsi_dueAt)}} is only written when the item is a due task; to "remove from the index" just delete the attribute. Many single-table designs live on this trick.
- **LSI (Local Secondary Index)**: uses the base table's {{pk}} with a different {{sk}} — **must be declared at table creation**, cannot change later.
- **TTL**: pick an attribute holding epoch seconds, DynamoDB auto-deletes expired items (not a transaction, latency minutes to hours) → fits sessions, OTP codes, temporary records; **do not** use it for "exactly on time" business logic.
- **Streams**: records every item change (NEW_IMAGE/OLD_IMAGE) → usually attached to **Lambda** to sync to OpenSearch, dump to S3, or run side effects (send email when an order moves to {{PAID}}). To replay, configure {{LatestStreamViewType}} and keep 24 hours.

### When NOT to use DynamoDB
| Need | DynamoDB | Better choice |
|---|---|---|
| Ad-hoc reports, "give me orders by region this month" | Bad: must scan or design index first | RDS/Aurora + SQL, or Redshift/Athena |
| Deep relationships, integrity constraints, deep joins | None | RDS/Aurora |
| Multi-table ACID transactions, complex | TransactWrite is limited | Aurora (or split business flow + saga) |
| Read by one of 20 different attributes | Need 20 GSIs, each eating WCU | RDS + indexes, or redesign single-table |
| OLTP by key, high unpredictable load, stable latency | **Great fit** | — |

### Interview notes
Common questions: "How do partition key/sort key affect things?" (aws-006), "RDS, Aurora or DynamoDB — which?" (aws-005), "Why not use Scan?", "Two workers decrement stock — how to avoid overselling?", "When to put ElastiCache/Redis in front of DynamoDB?" (aws-011). A scoring answer structure: **(1)** list access patterns, **(2)** propose {{pk}}/{{sk}} and explain traffic distribution, **(3)** point out where GSI/sparse GSI is needed, **(4)** explain overwrite protection via conditional write, **(5)** state cost (RCU/WCU or on-demand) and limits.

> Senior tip: Say out loud the rule "one partition = one unit of serving capacity" when answering. Senior/Lead interviewers do not grade API knowledge; they grade whether you avoid hot partitions: {{pk = "customer#C42"}} for 50 million orders is fine if the largest customer has 20,000 orders, but {{pk = "order-by-day"}} explodes on sale day. And always ask "does this table need transactions?" — because TransactWriteItems costs double, and if the answer is "actually only one item", conditional writes are much cheaper.`,
    exercises: [
      {
        title: 'Simulate DynamoDB: sort key order, conditional writes and capacity',
        prompt: `Simulate a DynamoDB table in memory (simplified: each item is a {{Map<String,String>}}, attribute {{"v"}} is the version used for optimistic locking).

Already provided: record {{PKey}}, record {{Item}} ({{get(name)}} returns an attribute), {{put(pk, sk, attrs)}} (stores a copy of attrs and stamps {{"v" = "1"}}), {{get(pk, sk)}} (returns {{null}} when missing). You implement 3 functions:

1. {{query(pk, skPrefix)}}: returns every item with the same {{pk}} and {{sk}} starting with {{skPrefix}} (empty {{skPrefix}} = whole partition), **sorted ascending by {{sk}} in lexicographic order** — exactly as DynamoDB does. Each element is an {{Item}}.
2. {{conditionalPut(pk, sk, expectedVersion, attrs)}}:
   ▸ current version of the item = value of {{"v"}}, treated as **0** if the item does not exist;
   ▸ if current version differs from {{expectedVersion}} → return {{false}} and **write nothing**;
   ▸ if equal → store {{attrs}} with {{"v"}} = {{expectedVersion + 1}}, return {{true}}.
   ({{expectedVersion = 0}} is exactly {{attribute_not_exists}}: create only when absent.)
3. {{capacityUnits(sizes, read, stronglyConsistent)}}: {{sizes}} are the byte sizes of each item in a batch read/write, returns **number of RCU or WCU for that 1 request/sec**:
   ▸ write ({{read = false}}): sum of {{ceil(size / 1024)}} **per item** (write granularity is 1 KB);
   ▸ read ({{read = true}}): call {{u = sum of ceil(size / 4096)}} per item (read granularity is 4 KB); if {{stronglyConsistent}} return {{u}}, otherwise return {{(u + 1) / 2}} because one RCU covers two 4 KB eventually consistent reads.
   Two things to get right: round **per item then sum** ({{100, 4000}} costs 2 units, not 1), and strongly consistent reads always cost **twice** eventually consistent reads.

(Simplified vs real AWS: real BatchWriteItem sums sizes across the batch in 25 KB blocks, transactions cost double, and real RCU depends on requests per second, not per batch. Here each batch is treated as one request.)`,
        hints: [
          'To get results in ascending {{sk}} order without manual sorting: collect into a {{TreeMap<String, Item>}} keyed by {{sk}}, then take {{values()}} (into an {{ArrayList}} to get a List).',
          'Iterate {{data.entrySet()}} and check {{k.pk().equals(pk)}} and {{k.sk().startsWith(skPrefix)}}. With an empty {{skPrefix}}, {{startsWith("")}} is always true, so the scope is the whole partition.',
          'Current version: a missing item is 0; if present, {{Long.parseLong}} from attribute {{"v"}}. Compare **before** writing, and on reject do not touch {{data}} at all.',
          'Round up without floats: {{(s + 4095) / 4096}} for the 4 KB read block, {{(s + 1023) / 1024}} for the 1 KB write block; {{Math.ceil}} on integers always yields 0.',
          'Eventually consistent reads cost **half** the RCU: {{(units + 1) / 2}} (round up so a non-empty batch never costs 0).',
        ],
        explain: `### What you just wrote is the three things that decide performance and the bill
- **{{query}} reads only ONE partition** and returns results already sorted by {{sk}}. That is the whole reason DynamoDB is fast: it knows exactly which bucket to open. {{Scan}} must open every bucket — think of it as {{SELECT *}} then filtering client-side, cost proportional to **table size**, not to the number of matching rows.
- **Lexicographic order of {{sk}}**: the test "item#10" before "item#2" is not a joke. In real life it becomes "page 2 repeats page 1's orders" or "never fetches order 100", and the fix is **zero-padding or epoch ms** right in key design.
- **{{conditionalPut}} runs server-side, atomically on one item**: two workers both reading version 7 → only one conditional PutItem succeeds. This is how you do idempotent/optimistic locking without a lock table, without {{SELECT FOR UPDATE}}, and it is also how you write a safe at-least-once queue consumer (aws-008): condition {{attribute_not_exists(eventId)}} is exactly the unique constraint of the {{processed_events}} table.

### Common mistakes
- Skip the version check and just write: you lose someone else's update (lost update), exactly the bug conditional writes exist to block.
- Parse the version with {{Integer.parseInt}} on a missing attribute → {{NullPointerException}}/{{NumberFormatException}}; must default.
- Sum sizes then round once: {{List.of(100, 4000)}} yields 1 unit instead of 2, and {{ceil(size / 4096)}} on integers always yields 0 because integer division truncates before rounding.
- Assume writes also use 4 KB: writes have **1 KB** granularity, so a 2 KB item costs 2 WCU — underestimating WCU means {{ProvisionedThroughputExceededException}} right at peak traffic, i.e. when customers are ordering.
- Forget that eventually consistent reads cost **half** the RCU: turning on strongly consistent for every read doubles the bill for a property you usually do not need (EC is enough for list views; only "did my write succeed?" needs strong).

The other side of the exercise: DynamoDB here has **no** transactions, no pagination ({{LastEvaluatedKey}}), no GSI, no real capacity over time. But if you can explain why query needs {{pk}}, why {{sk}} is string order, and why writes must be conditional, you can answer 90% of DynamoDB interview questions.`,
      },
    ],
    check: [
      {
        q: 'Table {{orders}} has {{pk = customer_id}}, {{sk = order_id}}. Which statement about "give me the 20 latest orders of customer C42" is CORRECT?',
        options: ['Use Scan with FilterExpression status = SHIPPED then take the first 20 results', 'Use Query with {{pk = C42}} and a sk condition, take the first page (with LastEvaluatedKey if more)', 'Use GetItem with pk = C42', 'Must create a GSI on customer_id because it is not a sort key'],
        answer: 1,
        explain: '{{pk = customer_id}} means all of C42\'s orders live in one partition and are already sorted by {{sk}} → one Query is enough. Scan charges for the whole table; GetItem needs the full key to fetch exactly ONE item; customer_id is already the partition key so no GSI is needed. For "latest" the sk must be epoch ms or zero-padded (Query uses {{ScanIndexForward = false}} to read backwards).',
      },
      {
        q: 'Two services both read item {{sku-1}} ({{stock = 5}}) then each writes {{stock = 4}} using a plain {{PutItem}}. What happens and how to fix?',
        options: ['DynamoDB detects the conflict and auto-retries for the second writer', 'One writer overwrites the other (lost update): use a conditional write on {{version}}, the loser gets ConditionalCheckFailed then rereads; use TransactWriteItems only when multiple items are involved', 'The transaction is auto-rejected for lack of a lock', 'No problem, because PutItem is atomic per attribute'],
        answer: 1,
        explain: '{{PutItem}} is a full-item upsert and whoever writes last wins, so stock drops incorrectly. DynamoDB has no "lock" to detect this and does not auto-retry business logic: you must add condition {{version = :v}} (or {{stock > :qty}}) so the server rejects the stale write, and only use TransactWriteItems when the flow touches multiple items/tables (costs double). PutItem replaces the whole item, it does not merge attributes.',
      },
      {
        q: 'You want to filter "PENDING orders that are overdue" while {{pk = customer_id}}. Which approach is best?',
        options: ['Query by pk then filter status in Java', 'Scan the whole table every 5 minutes with FilterExpression', 'Add a GSI where only PENDING items write its key attributes (sparse GSI), e.g. {{(gsi_pk = "PENDING", gsi_sk = dueAt)}}, then Query that GSI', 'Change pk to status to group all PENDING into one partition'],
        answer: 2,
        explain: 'Sparse GSI matches the query shape: an item only appears when it has the index attributes, so "pending by dueAt" becomes a cheap ordered Query. Filtering in Java still reads the whole partition; Scan charges for the whole table and gets worse over time; changing {{pk = status}} creates a giant hot partition (all PENDING in one bucket) — exactly the mistake to avoid.',
      },
      {
        q: 'Your provisioned table reads 1,000 items/sec, each about 5 KB, with strongly consistent reads. Roughly how many RCU do you need?',
        options: ['1,000 RCU', '2,000 RCU', '4,000 RCU', '5,000 RCU'],
        answer: 1,
        explain: 'Round **per item**: 5 KB → 2 blocks of 4 KB. Strongly consistent counts 1 RCU per 4 KB block per second, so 2 units/item × 1,000 items/sec = **2,000 RCU**. Switching to eventually consistent halves it to 1,000 RCU because one RCU covers two 4 KB EC reads. Common wrong answers: 5,000 (multiply by KB instead of 4 KB blocks), 4,000 (double on top of an already-strongly-consistent number), 1,000 (forget per-item rounding up).',
      },
    ],
  },
});
