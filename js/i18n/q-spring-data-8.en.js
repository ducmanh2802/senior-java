/*
 * English translation of js/data/q-spring-data.js — task T180. Format: js/core/i18n.js (content overlay).
 * ids: spring-027 db-020 db-021 db-022 db-023 db-024 db-025 db-026 db-027 db-028 db-029 db-030
 */
App.i18n.content({
  'spring-027': {
    q: '{{@RestController}} vs {{@Controller}}: what is the difference? What is {{ResponseEntity}} used for, and how does Jackson serialize JSON?',
    a: `**Summary:** {{@RestController}} = {{@Controller}} + {{@ResponseBody}} — every method that returns an object is **automatically serialized to JSON** (or XML) and written to the response body. {{@Controller}} traditionally returns a **view name** (String) so the view resolver (Thymeleaf, JSP) renders HTML. {{ResponseEntity<T>}} lets you control **status code**, **headers**, and **body** explicitly. Jackson (default) serializes via getters or fields, supporting {{@JsonProperty}}, {{@JsonIgnore}}, {{@JsonFormat}}.

### Comparison
| Feature | {{@Controller}} | {{@RestController}} |
|---|---|---|
| Returns | View name ({{String}}) | Object -> JSON/XML |
| Needs {{@ResponseBody}} | Yes, per method | Already implied |
| Use for | Server-side rendering (Thymeleaf) | REST API, SPA backend |

### {{ResponseEntity}} — controlling the response
~~~java
@GetMapping("/orders/{id}")
public ResponseEntity<OrderDto> getOrder(@PathVariable Long id) {
    return orderService.findById(id)
        .map(ResponseEntity::ok)                           // 200 OK + body
        .orElse(ResponseEntity.notFound().build());        // 404 Not Found, no body
}

@PostMapping("/orders")
public ResponseEntity<OrderDto> create(@RequestBody CreateOrderRequest req) {
    OrderDto created = orderService.create(req);
    return ResponseEntity
        .status(HttpStatus.CREATED)                        // 201
        .header("Location", "/orders/" + created.getId())  // custom header
        .body(created);
}
~~~

### Jackson serialization
- Default: serializes **public getters** and **public fields**; private fields appear only when a getter exists (or with annotations like {{@JsonProperty}}). Records are serialized by components.
- Common customizations:
  - {{@JsonProperty("new_name")}}: rename the field in JSON.
  - {{@JsonIgnore}}: do not serialize this field (useful for password, internal fields).
  - {{@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")}}: format date.
  - {{@JsonInclude(JsonInclude.Include.NON_NULL)}}: omit null fields from JSON.
- Global config:
~~~yaml
spring:
  jackson:
    serialization:
      WRITE_DATES_AS_TIMESTAMPS: false  # ISO-8601 string instead of epoch millis
    default-property-inclusion: non_null
~~~

### Production pitfalls
- **Returning JPA entities directly** to the API => Jackson triggers lazy loading (N+1), exposes sensitive fields ({{passwordHash}}), and couples the API to the table schema.
- **Forgetting {{@JsonIgnore}} on sensitive fields** — anyone who adds a new field to the entity will automatically expose it through the API.
- **Status 204 has no body**: use {{ResponseEntity.noContent().build()}}, do not return an object with 204 (the client will ignore the body).
- Jackson writes dates as timestamps by default (numbers); Spring Boot already disables {{WRITE_DATES_AS_TIMESTAMPS}} for the auto-configured {{ObjectMapper}}. The trap is creating your own {{new ObjectMapper()}} elsewhere => loses this config and also loses the {{JavaTimeModule}}.

> Senior tip: **always return DTOs for APIs**, never return entities. A DTO is the API contract — you decide which fields are exposed, their names, and their format. An entity is internal — changing the schema must not break the API.`,
    follow: [
      'Why is returning a JPA entity directly to a REST API an anti-pattern?',
      'How does Jackson handle {{LocalDateTime}} when {{WRITE_DATES_AS_TIMESTAMPS}} is not configured?'
    ]
  },
  'db-020': {
    q: 'Explain ACID with a bank-transfer example: which DB mechanism guarantees each letter (Atomicity, Consistency, Isolation, Durability)?',
    a: `**Summary:** ACID is the four properties of a transaction. **Atomicity**: the transaction either completes entirely or does nothing — the DB uses **undo log** to roll back. **Consistency**: data always satisfies constraints (FK, unique, check) — the DB enforces **constraints** at every statement (or at commit if DEFERRABLE). **Isolation**: concurrent transactions do not interfere — the DB uses **MVCC + locks** (row lock, gap lock). **Durability**: committed data is not lost on crash — the DB uses **WAL (Write-Ahead Logging)** + **fsync**.

### Example: transfer 100 from account A to B
~~~sql
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 'A';
UPDATE account SET balance = balance + 100 WHERE id = 'B';
COMMIT;
~~~

### How each letter is guaranteed
| Letter | DB mechanism | What happens if it fails |
|---|---|---|
| **A - Atomicity** | Undo log (InnoDB, Oracle); PostgreSQL uses tuple versions + transaction state | If the update to B fails (e.g., CHECK violation, lost connection), the change to A is canceled |
| **C - Consistency** | Constraint (FK, CHECK, UNIQUE, NOT NULL) | If balance < 0 violates CHECK -> rollback; data never stays wrong |
| **I - Isolation** | MVCC (snapshot) + Lock (row, gap, next-key) | Other transactions see the old balance until commit; locks prevent concurrent writes |
| **D - Durability** | WAL (redo log) + fsync | Commit = WAL written to disk; crash after that replays WAL to recover |

### Mechanism details
- **Undo log** (InnoDB, Oracle): stores old values before modification, used for rollback and MVCC read views. PostgreSQL **has no undo log**: the old tuple stays in the table; rollback just marks the transaction aborted, making its new tuples invisible.
- **WAL (Write-Ahead Logging)**: **log first, modify data after**. All changes append to WAL buffer -> flush to disk (fsync) at commit. Crash recovery: read WAL from the nearest checkpoint and redo; InnoDB also uses undo log to cancel uncommitted transactions, while PostgreSQL only needs to treat them as aborted.
- **Lock**: Row lock ({{FOR UPDATE}}), gap lock (prevents phantom insert), next-key lock (row + gap). Deadlock detection automatically rolls back the victim.
- **Constraint**: Checked at **commit** (deferred) or immediately (immediate).

### Production pitfalls
- **Disabling fsync** ({{fsync = off}}) for speed => loses Durability; crash = lost committed data.
- **Low isolation level** (READ COMMITTED) -> non-repeatable read, phantom read -> wrong logic (e.g., reading balance then subtracting without locking).
- **Defining constraints only in the app**, not in the DB => race conditions bypass the check, corrupting data.

> Senior tip: when designing a schema, **always define constraints in the DB** (FK, CHECK, UNIQUE) — that is the last line of defense. The app can bug, race conditions can happen, but DB constraints apply to every write path (app, script, batch) — unless someone actively disables them.`,
    follow: [
      'Why is WAL called "Write-Ahead" — what does writing the log before modifying data mean?',
      'Does isolation level READ COMMITTED guarantee Atomicity?'
    ]
  },
  'db-021': {
    q: 'What are 1NF, 2NF, and 3NF? When should you denormalize to trade performance?',
    a: `**Summary:** Normalization removes **data redundancy** and **anomalies** (insert/update/delete anomalies) by splitting tables according to dependencies. **1NF**: atomic values, no repeating columns/arrays. **2NF**: achieves 1NF + every non-key column is **fully dependent** on the PK (not partially dependent on a composite PK). **3NF**: achieves 2NF + no **transitive dependency** (non-key -> non-key). **Denormalize** when: heavy reads, few writes, avoiding complex joins, OLAP reports, or caching derived data.

### The three forms
| Form | Requirement | Typical violation |
|---|---|---|
| **1NF** | Each cell one value, no repeating rows, no array columns | {{tags}} column storing {{"tag1,tag2"}}, {{order_items}} repeated inside {{orders}} |
| **2NF** | Non-key depends **fully** on PK (if composite) | Table {{student_course(student_id, course_id, student_name)}} -> {{student_name}} depends only on {{student_id}} |
| **3NF** | No **transitive dependency** (PK -> A -> B, A is non-key) | Table {{employee(emp_id, dept_id, dept_name)}} -> {{dept_name}} depends on {{dept_id}} (non-key) |

### When to denormalize
1. **Read-heavy, write-rare**: catalogs, config, reports — joins are expensive.
2. **Avoid deep joins**: store {{customer_name}} directly in {{orders}} instead of joining {{customers}}.
3. **Derived/aggregate data**: {{order.item_count}}, {{order.total_amount}} precomputed.
4. **OLAP / Data warehouse**: star schema (fact + dimension) is denormalized by design.
5. **Application cache**: Redis stores already-denormalized JSON for read screens.

### Safe denormalization example
~~~sql
-- Normalized (3NF)
orders(id, customer_id, created_at)
customers(id, name, email)

-- Denormalized: add customer_name to orders to avoid join on list screens
orders(id, customer_id, customer_name, created_at)
~~~
Requires **trigger / application logic** to sync {{customer_name}} when {{customers}} changes.

### Production pitfalls
- Denormalizing **without a sync strategy** -> data drift (customer renames but orders still show old name).
- Forgetting **unique constraints** on denormalized tables -> duplicate data.
- Over-denormalizing: tables bloat, writes slow, indexes grow, backups grow.

> Senior tip: default to **3NF for OLTP**. Only denormalize when **measured** joins are a bottleneck and you have a clear sync plan (trigger, CDC, or app-level sync). Do not denormalize "just in case".`,
    follow: [
      'What is the difference between 2NF and 3NF? Give an example that violates 3NF but satisfies 2NF.',
      'How do you keep denormalized data consistent when the source table changes?'
    ]
  },
  'db-022': {
    q: 'How do clustered and non-clustered indexes differ (InnoDB, Oracle, PostgreSQL)? What is the real-world meaning of PRIMARY KEY being clustered in InnoDB but PostgreSQL/Oracle using heap tables?',
    a: `**Summary:** **Clustered index** (InnoDB): the row data is **stored inside the PRIMARY KEY B-tree** — leaf nodes contain all columns. **Non-clustered index** (secondary index): leaf nodes contain the **PK value** pointing back to the clustered index. **PostgreSQL/Oracle** default to **heap table**: data is stored separately; **all indexes are non-clustered** (leaf contains TID/ROWID pointing to heap). Oracle also has **Index-Organized Table (IOT)** — equivalent to clustered. Impact: InnoDB PK lookup is one B-tree; secondary index needs two; PostgreSQL every index is one B-tree + heap lookup.

### InnoDB (MySQL) — Clustered index
- Tables **always** have a clustered index: PK if present, unique not-null if not, or hidden 6-byte row_id.
- **Secondary index** leaf stores the **PK value** (not a physical pointer) -> points back to the clustered index.
- Lookup by PK: **1 B-tree traversal**.
- Lookup by secondary index: **2 B-trees** (secondary -> PK -> clustered).
- **PK should be short** (BIGINT/AUTO_INCREMENT) because the PK value is repeated in every secondary index.

### PostgreSQL / Oracle — Heap table
- Data lives in **heap** (unsorted); each row has a physical address: {{ctid}} = (block, offset) in PostgreSQL; {{ROWID}} in Oracle includes file info.
- **All indexes** (including PK) are non-clustered: leaf stores **TID** -> points to heap.
- Lookup by PK: 1 B-tree + 1 heap fetch.
- Lookup by secondary index: 1 B-tree + 1 heap fetch (same as PK).
- **Heap tuple update** (MVCC) creates a new tuple -> **all indexes** must add an entry pointing to the new TID (index bloat) — **unless** **HOT update**: no indexed column changed and the page has space, then no index updates.

### Real-world comparison
| Operation | InnoDB (Clustered PK) | PostgreSQL (Heap) |
|---|---|---|
| PK lookup | 1 B-tree | 1 B-tree + heap fetch |
| Secondary index lookup | 2 B-trees | 1 B-tree + heap fetch |
| INSERT | Append to end of PK (if increasing) | Append to heap, update all indexes |
| UPDATE non-PK | In-place + undo log; only affected secondary indexes updated | New tuple (MVCC); HOT update skips index updates if possible, else all updated |
| UPDATE PK | **Delete + insert** (expensive) | Same as non-PK update |
| Index size | Secondary index contains PK value | All indexes contain fixed TID |

### Production pitfalls
- **InnoDB: random PK (UUID)** -> B-tree fragmentation, slow inserts, large secondary indexes. Use **UUIDv7** or **BIGINT AUTO_INCREMENT**.
- **InnoDB: UPDATE PK** is very expensive (delete + insert) -> avoid changing PKs.
- **PostgreSQL: ANY update** creates a new tuple; without HOT conditions all indexes update -> rapid bloat. For update-heavy tables: set {{FILLFACTOR}} low (leave space for HOT), avoid indexes on frequently changed columns, aggressive autovacuum; monitor {{n_tup_hot_upd}} in {{pg_stat_user_tables}}.
- **PostgreSQL: {{CLUSTER}} command** can sort the heap by an index (similar to clustered) but **does not maintain** it after inserts/updates.

> Senior tip: when migrating from MySQL to PostgreSQL, do not keep the mindset that "PK clustered = fastest". PostgreSQL heap + non-clustered indexes mean every UPDATE creates a new row version — design workloads to leverage HOT updates and timely vacuum. Benchmark with real production-like data.`,
    follow: [
      'Why does InnoDB secondary index store the PK value instead of a physical pointer?',
      'Does PostgreSQL really support a true clustered index?'
    ]
  },
  'db-023': {
    q: 'When is an index not used: function on column, LIKE starting with %, OR, implicit cast, low selectivity?',
    a: `**Summary:** A B-tree index can only be used when the query condition **covers** the index condition. Five common cases cause the optimizer to **skip the index**: (1) **Function/expression on column** ({{WHERE UPPER(name) = 'A'}}), (2) **LIKE '%abc'** (leading wildcard), (3) **OR** without an index covering both branches, (4) **Implicit cast** (varchar column compared to number), (5) **Low selectivity** (column with few distinct values like status, gender).

### 1. Function on column
~~~sql
-- Does NOT use index on created_at
WHERE DATE(created_at) = '2026-01-01'
WHERE YEAR(created_at) = 2026

-- Fix: rewrite as range
WHERE created_at >= '2026-01-01' AND created_at < '2026-01-02'
~~~
Alternative: **expression index** — MySQL 8.0.13+: {{CREATE INDEX idx_day ON orders ((DATE(created_at)))}}; PostgreSQL: {{CREATE INDEX ON orders ((created_at::date))}} (only with timestamp; with timestamptz the expression depends on timezone, not IMMUTABLE, so not possible). The query must use the exact same expression.

### 2. LIKE leading wildcard
~~~sql
WHERE name LIKE '%abc'   -- B-tree not used
WHERE name LIKE 'abc%'   -- Works (prefix)
~~~
Note PostgreSQL: prefix LIKE only uses B-tree when collation is {{C}} or index created with {{text_pattern_ops}}/{{varchar_pattern_ops}}.
For {{%abc%}}: **trigram index** ({{pg_trgm}} with GIN/GiST) supports {{LIKE}}/{{ILIKE}} containing a substring; for natural-language search use full-text ({{tsvector}}) or a search engine.

### 3. OR without covering index
~~~sql
-- Only uses index if BOTH columns have an index
-- (PostgreSQL: BitmapOr, MySQL: index_merge)
WHERE status = 'ACTIVE' OR priority = 1

-- Replace with UNION ALL (each branch uses its own index)
SELECT * FROM orders WHERE status = 'ACTIVE'
UNION ALL
SELECT * FROM orders WHERE priority = 1
  AND status IS DISTINCT FROM 'ACTIVE'   -- avoid duplicates; != skips NULL
~~~

### 4. Implicit cast
~~~sql
-- Column phone VARCHAR(20)
WHERE phone = 123456789  -- MySQL/Oracle casts column to number -> index not used

-- Fix: compare with correct type
WHERE phone = '123456789'
~~~
PostgreSQL is stricter: comparing {{varchar = integer}} throws {{operator does not exist}} rather than implicit cast. From Java, a common trap is binding the wrong type (e.g., {{setString}} to a numeric column, or NVARCHAR vs VARCHAR on Oracle/SQL Server).

### 5. Low selectivity
- Column {{status}} has only 3 values ({{PENDING}}, {{DONE}}, {{CANCELLED}}) -> selectivity ~33%.
- Optimizer estimates: sequential scan reads 33% of the table faster than index scan (must read index + heap fetch per row).
- **Partial index** solves: {{CREATE INDEX ON orders (created_at) WHERE status = 'PENDING'}} — index only contains rows for the query.

### Check whether index is used
~~~sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE status = 'PENDING';
-- Check: Index Scan vs Seq Scan, rows removed by filter
~~~

### Production pitfalls
- **Function-based index** (expression index): the query must use the **same expression** (same function, same parameter types, same collation) — whitespace differences are fine, but {{lower(email)}} vs {{upper(email)}}, or different casts, mean the index is not used.
- **OR** with complex conditions -> UNION ALL is often faster.
- **Selectivity changes over time** (e.g., {{PENDING}} from 1% to 50% when the system is blocked) -> plan cache (prepared statement) may choose a wrong plan. Use {{force_custom_plan}} or re-prepare.

> Senior tip: before adding an index, **measure with EXPLAIN ANALYZE** on production-like data. A useless index costs not just disk but also slows updates. Rule: every index must have a measured reason.`,
    follow: [
      'Why does LIKE "%abc" not use B-tree but "abc%" does?',
      'How does a partial index help for low-selectivity columns?'
    ]
  },
  'db-024': {
    q: 'Redis data structures (String, Hash, List, Set, Sorted Set, Bitmap, HyperLogLog, Stream) — which use case fits which: cache, rate limit, leaderboard, distributed lock, session?',
    a: `**Summary:** Redis is an **in-memory data structure store** — not just a simple key-value cache, but provides native data structures, each solving a specific problem. Using the wrong structure means "using a sledgehammer for a nail" (e.g., using String + JSON for a complex session instead of Hash).

### Structures and typical use cases
| Structure | Sample commands | Real-world use case |
|---|---|---|
| **String** | {{SET}}, {{GET}}, {{INCR}} | Simple cache, counter, distributed lock ({{SET NX EX}}), fixed-window rate limit ({{INCR}} + {{EXPIRE}}) |
| **Hash** | {{HSET}}, {{HGET}}, {{HGETALL}} | **Session** (field = attribute), object cache (user profile), shopping cart |
| **List** | {{LPUSH}}, {{RPOP}}, {{LRANGE}} | Simple FIFO queue, recent items ({{LTRIM}} keep last 100) |
| **Set** | {{SADD}}, {{SREM}}, {{SISMEMBER}}, {{SUNION}} | Tagging, unique visitor ({{SADD}} user_id), friend recommendations (intersection) |
| **Sorted Set (ZSet)** | {{ZADD}}, {{ZRANGE}}, {{ZRANK}} | **Leaderboard** (score = points), delay queue (score = timestamp), sliding-window rate limit |
| **Bitmap** | {{SETBIT}}, {{GETBIT}}, {{BITCOUNT}} | Daily active users (DAU), retention, permission bitset |
| **HyperLogLog** | {{PFADD}}, {{PFCOUNT}} | Estimate cardinality (unique count) with ~12KB fixed memory — unique IP, unique search term |
| **Stream** | {{XADD}}, {{XREAD}}, {{XGROUP}} | **Message queue** (consumer group, acknowledgment, replay) — lightweight Kafka alternative |

### Typical examples
- **Sliding-window rate limit**: Sorted Set with score = timestamp, {{ZREMRANGEBYSCORE}} removes old entries, {{ZCARD}} counts requests in the window.
- **Distributed lock**: {{SET lock:order:123 "owner1" NX EX 10}} — atomic, auto-expire. Need a Lua script to unlock safely (only unlock if value matches owner). Lock on a master with async replication can be lost on failover — for critical tasks combine fencing token or DB-level constraint.
- **Leaderboard**: {{ZADD leaderboard 1500 "user:1"}}, {{ZREVRANGE leaderboard 0 9}} top 10.
- **Session**: Hash {{session:abc123}} with fields {{user_id}}, {{role}}, {{last_seen}} — {{HGETALL}} reads all, {{HINCRBY}} updates counter.

### Production pitfalls
- **Using String + JSON for session** -> each field update requires GET -> deserialize -> modify -> serialize -> SET (race condition, CPU waste). Hash allows {{HSET}} individual fields.
- **Using List as a queue** without consumer group or acknowledgment -> message lost when worker crashes. Use **Stream** for production queues.
- **Big keys** (large Hash/List/Set/ZSet) -> block Redis single thread on {{DEL}}, {{HGETALL}}, {{ZRANGE}}. Use {{UNLINK}} (async delete), {{SCAN}}/{{HSCAN}}/{{ZSCAN}} with cursor.
- **Lua script** for atomic compound operations (check-then-act) — avoids race conditions in locks and rate limits.

> Senior tip: Redis is not just a "cache". Knowing all 8 data structures and when to use each is a senior engineer marker. Example: rate limit uses Sorted Set (sliding window) or String (fixed window/token bucket); leaderboard uses Sorted Set; session usually uses Hash (Spring Session Redis also stores session as Hash); a queue that needs acknowledgment should use Stream.`,
    follow: [
      'Why should you not use Redis List for a production message queue?',
      'How do you handle big keys in Redis (large Hash/ZSet) without blocking the main thread?'
    ]
  },
  'db-025': {
    q: 'Redis is single-threaded but why is it fast? How do RDB and AOF persistence differ, and can Redis lose data?',
    a: `**Summary:** Redis is fast due to **I/O multiplexing** (epoll/kqueue) + **single-threaded event loop** (no context switch, no lock contention) + **simple data structures** (O(1) or O(log n)) + **all data in RAM**. **RDB** (snapshot) is fast, compact, recovers quickly but **loses data** since the last snapshot. **AOF** (append-only log) is more durable, configurable fsync ({{always}}/{{everysec}}/{{no}}), larger file, slower recovery. Redis **can lose data** depending on persistence config and failure scenario.

### Why single-thread is still fast
1. **No context switch**: one thread handles all commands sequentially.
2. **I/O multiplexing**: {{epoll}} (Linux) / {{kqueue}} (BSD) lets one thread manage thousands of connections — only reads/writes when the socket is ready.
3. **Optimized data structures**: Hash table (O(1)), Skiplist (O(log n) for ZSet), SDS string (binary safe, O(1) length).
4. **Pipelining**: clients send multiple commands in one round-trip, reducing network and syscall cost.
5. **No lock contention** — single thread accesses memory -> no mutex needed.

*Note*: Redis 6+ supports **threaded I/O** for network read/write (parsing, socket), but command execution remains single-threaded.

### RDB vs AOF
| Feature | RDB (Snapshot) | AOF (Append-Only File) |
|---|---|---|
| Mechanism | Fork child process, dump memory to disk | Append every write command |
| Frequency | {{save 900 1}} (900s if 1 key changes) | Every write command |
| File size | Small (compressed, binary) | Large (text protocol); periodic rewrite compacts it |
| Recovery | **Fast** (load binary) | Slower (replay commands); {{aof-use-rdb-preamble}} (default on) helps load quickly like RDB |
| Data loss | From last snapshot to crash | Depends on {{appendfsync}}: {{always}} ≈ 0, {{everysec}} ≈ 1s (worst ~2s), {{no}} = depends on OS flush |
| CPU/Disk cost | Fork + dump (may cause latency spike) | Continuous writes, fsync cost |

### Can Redis lose data?
**Yes**, in these cases:
1. **Only RDB**: crash between two snapshots -> data lost since last snapshot.
2. **AOF {{appendfsync = everysec}}** (default with AOF): crash -> ~1 second of data lost (worst ~2s) still in OS cache not fsynced.
3. **AOF {{appendfsync = no}}**: data lost in OS page cache (possibly several seconds).
4. **Async replication**: master crashes before replica syncs -> lost writes not replicated.
5. **OOM / OOM killer**: process killed -> all memory lost (if no persistence).

### Recommended durable config
~~~conf
# Enable both
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec        # balance performance / durability
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
~~~
For financial/critical data: {{appendfsync always}} + replica + periodic backup.

### Production pitfalls
- **Disabling persistence** ({{save ""}} + {{appendonly no}}) -> Redis becomes pure cache, restart = total loss.
- **RDB fork() latency spike** on large memory instances (>10GB) -> fork blocks main thread (tens to hundreds of ms, especially on VMs). Reduce {{save}} frequency or use AOF.
- **AOF rewrite** (compaction) also forks -> same issue. Monitor {{aof_rewrite_in_progress}} metric.
- **Replication lag**: master writes fast, replica slow -> failover loses data. Use {{min-replicas-to-write}} + {{min-replicas-max-lag}} so master refuses writes if replica is too slow — limits loss window, does not eliminate it.

> Senior tip: there is no "free" option — for maximum speed (sub-ms) accept data-loss risk (only RDB or AOF everysec). To limit loss -> {{appendfsync always}} + replica + {{WAIT}} command (Redis has no true synchronous replication) -> latency increases; if data must never be lost, the source of truth should be a DB. Define a clear **SLO**: "rate limit / session / cache can tolerate loss", "billing / inventory / idempotency key MUST NOT lose".`,
    follow: [
      'Why does Redis 6+ add threaded I/O but keep command execution single-threaded?',
      'When should you choose RDB only, AOF only, or both?'
    ]
  },
  'db-026': {
    q: 'An Oracle procedure only provides data via a PL/SQL package/procedure returning a REF CURSOR. How do you call it from Spring JDBC, manage transactions, and map results?',
    a: `**Summary:** With Oracle procedures, keep DB boundaries clear: declare parameters correctly, call via Spring JDBC, consume the cursor while the connection is open, and map to DTO. {{SimpleJdbcCall}} supports procedure/function declaration and metadata, but packages, overloads, and REF CURSOR usually need explicit declaration to avoid relying on driver metadata.

### Call flow
1. Identify package, procedure name, parameter order/types, IN and OUT types, cursor type, EXECUTE permission.
2. Use {{JdbcTemplate}} or {{SimpleJdbcCall}} with {{SqlOutParameter}} using the correct Oracle JDBC cursor type; configure package name and skip metadata discovery if the schema is complex.
3. Execute within the appropriate Spring transaction. Consume the ResultSet/cursor before closing the connection; do not return the cursor outside the DAO.

~~~java
var call = new SimpleJdbcCall(jdbcTemplate)
    .withSchemaName("BANK_APP")
    .withCatalogName("ACCOUNT_PKG") // Oracle package
    .withProcedureName("find_entries")
    .withoutProcedureColumnMetaDataAccess()
    .declareParameters(
        new SqlParameter("p_account_id", Types.NUMERIC),
        new SqlOutParameter("p_rows", OracleTypes.CURSOR,
            (rs, row) -> new Entry(rs.getLong("ID"), rs.getBigDecimal("AMOUNT"))));
var result = call.execute(Map.of("p_account_id", accountId));
~~~

### Trade-off
| Approach | Best when | Notes |
|---|---|---|
| JdbcTemplate | Need explicit binding and mapping control | Less abstraction, more explicit code |
| SimpleJdbcCall | Stable procedure, many OUT params | Metadata can be wrong with packages/overloads |
| JPA native call | Simple entity integration | Cursor / bulk result is usually awkward |

### Production pitfalls
- Oracle package names are not always equivalent to schema names in every abstraction; verify generated call with the real Oracle JDBC version.
- Do not return {{ResultSet}} or a vendor cursor outside the callback: the transaction/connection may have closed.
- Bind parameters, never concatenate SQL. Measure DB time separately from mapping time.
- Procedure errors may return vendor error codes; convert to stable business exceptions, but keep SQLState/code in telemetry after filtering sensitive data.

> Senior tip: write integration tests on a real Oracle-compatible environment for REF CURSOR and overloads; H2 does not verify Oracle semantics.`,
    follow: [
      'When does SimpleJdbcCall need explicit parameter declaration?',
      'How do you test an Oracle procedure in a CI pipeline?'
    ]
  },
  'db-027': {
    q: 'An Oracle procedure returns hundreds of thousands of rows to be processed in Java. When do you use REF CURSOR, BULK COLLECT / FORALL, or JDBC fetch batching, and how do you control memory?',
    a: `**Summary:** Choose where processing happens based on data and business needs: cursor streaming / JDBC fetch size when Java needs sequential processing with limited memory; {{BULK COLLECT}} / {{FORALL}} when transformation should run close to the data. Do not load unlimited data into a collection or List just to reduce round trips.

### Mechanisms and choices
- REF CURSOR returns a result set; JDBC fetch size suggests rows per fetch, but drivers may not implement it uniformly.
- {{BULK COLLECT ... LIMIT}} batches PL/SQL to reduce context switches between PL/SQL and SQL while still limiting memory.
- {{FORALL}} binds a collection for bulk DML, reducing round trips; exceptions per part must be designed clearly (e.g., SAVE EXCEPTIONS).

~~~sql
LOOP
  FETCH c_entries BULK COLLECT INTO l_entries LIMIT 500;
  EXIT WHEN l_entries.COUNT = 0;
  FORALL i IN 1 .. l_entries.COUNT
    INSERT INTO archive_entry(id, amount) VALUES (l_entries(i).id, l_entries(i).amount);
  COMMIT; -- only if commit per batch is allowed by the business
END LOOP;
~~~

### Trade-off
| Option | Round trips | Memory | Use when |
|---|---:|---:|---|
| Java reads cursor with fetch size | Per batch | Low | Java needs to process / push downstream |
| BULK COLLECT limited | Fewer PL/SQL per row | Limited by LIMIT | Logic and DML stay inside Oracle |
| BULK COLLECT all | Few | Can be very large | Only for small, bounded sets |

### Production pitfalls
- Fetch size is not a business page size; drivers may buffer differently. Measure heap and network with the real driver.
- Commit per batch changes atomicity semantics: a job failing mid-run leaves partially committed work. Need checkpoint / idempotency and a resume process.
- Bulk DML skips some ORM / callback behaviors; update version / audit / counters with a clear design.
- A long-open cursor holds session, snapshot, and DB resources; close ResultSet / statement with try-with-resources and set timeouts.

> Senior tip: measure rows/sec, PGA/heap, round trips, and lock time on a representative batch; only increase LIMIT / fetch size when measurements show round trips are the bottleneck.`,
    follow: [
      'Why is BULK COLLECT LIMIT better than collecting everything?',
      'How does chunk-based commit affect rerunability?'
    ]
  },
  'db-028': {
    q: 'An Oracle table needs an auto-generated primary key and must work on both Oracle and PostgreSQL. How do you choose sequence vs identity, especially for batch inserts and ID ordering?',
    a: `**Summary:** Sequence is an independent object, provides values before insert, and is flexible for multiple tables; identity binds a generator to a column, simpler for one table. Sequences / identity often have gaps on rollback, cache, or restart; IDs are not business-order numbers and do not guarantee commit order.

### How they work
Oracle supports identity columns and sequences; PostgreSQL identity is also sequence-based. Sequences allocate independently of transactions, so rollback does not return taken numbers. Cache improves throughput but can create gaps after failure. With sequences, the application can get the ID before insert; identity usually retrieves via generated keys / returning depending on the driver.

~~~sql
-- Oracle: use explicit sequence for compatibility / multiple consumers
CREATE SEQUENCE payment_seq CACHE 100;
INSERT INTO payment(id, amount) VALUES (payment_seq.NEXTVAL, :amount);

-- PostgreSQL: identity for technical key tied to one column
CREATE TABLE payment (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  amount numeric(19,2) NOT NULL
);
~~~

### Trade-off
| Criteria | Sequence | Identity |
|---|---|---|
| Shared across tables | Yes | Not directly |
| Get ID before insert | Convenient | Usually at insert |
| DDL simplicity | Extra object | Bound to column |
| Portability | Syntax/config differs by DB | Syntax differs, meaning similar |

### During migration
- Do not assume sequence name, generated-key retrieval, or DDL syntax are identical. Use separate migrations per dialect and test with the real driver.
- JPA {{GenerationType.IDENTITY}} may force Hibernate to insert early to get the ID, affecting batching; sequence generators allow pre-allocation and are more batch-friendly depending on dialect.
- Do not expose IDs to infer transaction timing; use an appropriate timestamp or a separate business sequence if order is truly required.

### Production pitfalls
- Gaps are not proof of lost transactions. Do not use IDs as continuous invoice numbers if legal / business numbering requires it.
- Large sequence cache improves performance but restart / failover may skip the cached range; do not lower cache just because of gaps.
- Bulk import: ORM allocation size must match the sequence increment.

> Senior tip: the primary key is a technical identifier. Design customer reference numbers separately, with unique constraints and an audited allocation process.`,
    follow: [
      'Why does rollback cause sequence gaps?',
      'How does IDENTITY affect JDBC batching and Hibernate?'
    ]
  },
  'db-029': {
    q: 'An Oracle query slows down after data grows significantly. How do you read the execution plan and evaluate optimizer hints before rewriting SQL or adding an index?',
    a: `**Summary:** Start from the real plan, bind values, and statistics: compare estimated rows to actual rows, access path, join order, predicates, and I/O. Hints are conditional guidance, not replacements for data modeling or statistics; forcing a plan may fix one bind but slow others.

### Process
1. Collect SQL, binds, elapsed / CPU, logical reads, actual rows; confirm the same SQL_ID / cursor.
2. View the actual plan (e.g., DBMS_XPLAN.DISPLAY_CURSOR with appropriate statistics), not just an estimated EXPLAIN plan.
3. Find where estimated rows diverge from actual, unfair full scans, implicit conversions, join cardinality explosions, sort/hash spills.
4. Check stats / histogram, skew distribution, index leading columns, partition pruning; try fixes and measure on representative data.

### Hints and indexes
| Measure | Useful when | Risk |
|---|---|---|
| Update stats | Old / wrong estimates | New stats may change plan; observe |
| Index | Selective predicate, repeated access | Storage and write overhead |
| Hint | Evidence optimizer chooses wrongly consistently | Stuck to version / data / bind, hard to maintain |
| SQL rewrite | Expression hides column / complex logic | Must preserve semantics |

~~~sql
-- Avoid function on column if index can be used
SELECT id, amount FROM txn
WHERE account_id = :account_id
  AND booked_at >= :from_ts AND booked_at < :to_ts;
-- Consider function-based index only if expression is stable
~~~

### Production pitfalls
- Bind peeking / adaptive cursor sharing can make one plan suboptimal for other bind values; test with different accounts of different cardinality.
- Hints can be ignored or interpreted differently by version; document the reason, plan baseline / regression monitoring, and rollback plan.
- Do not create an index based on a single query; consider write rate, locking, storage, and total workload.

> Senior tip: save plan hash, buffer gets, and p95 before / after; the goal is reducing DB work for real workload, not making the plan look pretty.`,
    follow: [
      'What do wrong estimated rows usually indicate?',
      'When is a function-based index worth using?'
    ]
  },
  'db-030': {
    q: 'Migrate a banking application from Oracle to PostgreSQL but it must run in parallel with reconciliation. How do you plan handling SQL differences, transactions, and data?',
    a: `**Summary:** Do not treat migration as changing the JDBC URL. Inventory schema, SQL, procedures, sequences, data types, isolation, and workload; migrate via expand/contract, backfill with checkpoints, CDC or controlled dual-read, then reconcile before cutover and keep a rollback path.

### Differences to inventory
| Area | Example risk | Verification method |
|---|---|---|
| SQL | {{NVL}}/{{DECODE}}, {{ROWNUM}}, packages, hints | Static scan + result test |
| Data types | NUMBER, DATE/TIMESTAMP, empty string / NULL | Mapping and boundary test |
| ID generation | sequence / identity, allocation | Concurrent and batch test |
| Transaction | isolation, locking, deadlock code | Contract test under load |
| Search / sort | collation, case, timezone | Real character / date dataset |

### Migration strategy
1. Split workload by bounded context; define authoritative data source at each stage.
2. Create new schema, backfill by stable keys with checkpoints; capture changes via CDC / outbox or dual-write with leak detection.
3. Compare counts, totals by partition, hash / canonical rows, and ledger invariants. Every mismatch needs a processing queue, not just a summary report.
4. Canary read / write by cohort; cutover requires lag, error rate, reconciliation, and rollback window criteria.

### Production pitfalls
- Oracle treats empty string as NULL for character types; PostgreSQL distinguishes them. Check data and predicates.
- Sequence values do not mean committed records; CDC order, retry, and snapshot timing must be designed.
- One total checksum can hide two offsetting errors; reconcile by key, date, currency, and status.
- Do not allow two DBs to write independently without conflict rules; dual-write is not atomic across two systems.

> Senior tip: for a ledger, cutover only after debit/credit balance and per-partition / per-day reconciliation; set the mismatch threshold to zero for core financial data.`,
    follow: [
      'How do you handle the difference between empty string and NULL?',
      'How can dual-write avoid creating two sources of truth?'
    ]
  }
});
