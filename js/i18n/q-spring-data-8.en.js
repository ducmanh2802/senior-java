/*
 * English translation of js/data/q-spring-data.js — task T549 (re-translated after the Vietnamese source changed). Format: js/core/i18n.js (content overlay).
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
    a: `**Summary:** ACID is the four properties of a transaction. **Atomicity**: the transaction either completes entirely or does nothing — the DB uses **undo log** to roll it back. **Consistency**: the data always satisfies constraints (FK, unique, check) — the DB enforces **constraints** on every statement (or at commit if declared DEFERRABLE). **Isolation**: concurrent transactions do not interfere with each other — the DB uses **MVCC + locks** (row lock, gap lock). **Durability**: committed data is not lost on a crash — the DB uses **WAL (Write-Ahead Logging)** + **fsync**.

### Example: transferring 100 from account A to B
~~~sql
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 'A';
UPDATE account SET balance = balance + 100 WHERE id = 'B';
COMMIT;
~~~

### Quick understanding
Transferring 100k from A to B is like a **transaction at the bank counter**. **Atomicity**: the teller either finishes both steps (debit A, credit B) or cancels everything — never "debited but not yet credited". **Consistency**: the books always obey the rules (a balance cannot go negative, the account must exist) — the DB checks those rules. **Isolation**: two customers transferring money at the same time do not scramble each other's books. **Durability**: once the "success" receipt is handed out, even if the power fails a second later the transaction is still there — because it was written to the **log** before the receipt was printed.

### Terminology
- **Transaction**: a unit of work made of several statements, ending with {{COMMIT}} or {{ROLLBACK}}.
- **Undo log**: a copy of old values used to undo changes (InnoDB, Oracle).
- **WAL / redo log**: a change log written **before** the data files are modified, used to replay after a crash.
- **fsync**: the call that forces the operating system to flush data from its buffer down to the real disk.
- **Checkpoint**: the moment at which the DB guarantees every previously modified page has been written to the data files, so older WAL entries can be discarded.
- **Constraint**: a data rule declared in the DB (PK, FK, UNIQUE, CHECK, NOT NULL).
- **DEFERRABLE**: a constraint checked at commit instead of after every statement.
- **Crash recovery**: the process by which the DB repairs its state on restart after a failure.

### How a commit happens, step by step
~~~text
UPDATE A (-100) --> page A modified in RAM (buffer), WAL record #1 appended to the WAL buffer
UPDATE B (+100) --> page B modified in RAM,        WAL record #2 appended
COMMIT          --> write the COMMIT record, fsync the WAL to disk (~0.1-2ms on SSD) --> reply "OK"
(after that)    --> the checkpoint / background writer only now writes pages A and B to the data files
CRASH before fsync: no COMMIT record in the WAL -> treated as never happened (A)
CRASH after fsync : replay WAL #1, #2 -> A and B exactly as committed (D)
~~~
1. **Modify in memory, write the log first.** Why: appending sequentially to the end of the WAL file is far faster than randomly writing individual data pages.
2. **Check constraints on every statement**: if CHECK {{balance >= 0}} is violated, that statement fails and the transaction must roll back. Why at the DB: every write path (app, script, batch) goes through it.
3. **Hold the row lock on A and B until commit.** Why: another transaction may not modify them on top; readers still see the old version thanks to MVCC.
4. **COMMIT = fsync the WAL.** Why the WAL alone is enough: with the WAL the pages can be rebuilt, so writing the data pages later is fine.
5. **Rollback or a crash midway**: InnoDB uses undo to restore the old values; PostgreSQL marks the transaction aborted, which makes the new row versions invisible.

### How each letter is guaranteed
| Letter | DB mechanism | What happens if it fails |
|---|---|---|
| **A - Atomicity** | Undo log (InnoDB, Oracle); PostgreSQL uses tuple versions + transaction state | If the UPDATE to B fails (for example a CHECK violation or a lost connection), the change to A is cancelled |
| **C - Consistency** | Constraint (FK, CHECK, UNIQUE, NOT NULL) | If balance < 0 violates CHECK -> rollback; data never stays in a wrong state |
| **I - Isolation** | MVCC (snapshot) + Lock (row, gap, next-key) | Other transactions read the old balance until commit; locks prevent concurrent writes |
| **D - Durability** | WAL (redo log) + fsync | Commit = WAL written to disk; a crash afterwards is recovered by replaying the WAL |

### Mechanism details
- **Undo log** (InnoDB, Oracle): stores old values before modification, used for rollback and MVCC read views. PostgreSQL **has no undo log**: the old tuple stays in the table, and rollback just marks the transaction aborted so its new tuples become invisible.
- **WAL (Write-Ahead Logging)**: **log first, modify data after**. All changes append to the WAL buffer -> flush to disk (fsync) at commit. Crash recovery: read the WAL from the nearest checkpoint and redo; InnoDB also uses the undo log to cancel uncommitted transactions, while PostgreSQL only needs to treat them as aborted.
- **Lock**: Row lock ({{FOR UPDATE}}), gap lock (prevents phantom inserts), next-key lock (row + gap). Deadlock detection automatically rolls back the victim.
- **Constraint**: Checked at **commit** (deferred) or immediately (immediate).

### Production pitfalls
- **Disabling fsync** ({{fsync = off}}) for speed => loses Durability; a crash means lost committed data.
- **Low isolation level** (READ COMMITTED) -> non-repeatable read, phantom read -> wrong logic (e.g. reading a balance and then subtracting without locking).
- **Defining constraints only in the app**, not in the DB => race conditions bypass the check and corrupt data.

### Common mistakes
- **Loosening durability settings to make a benchmark look good and forgetting to restore them**: MySQL {{innodb_flush_log_at_trx_commit = 2}} (or 0) and PostgreSQL {{synchronous_commit = off}} can lose the last second or so of transactions on a crash (PostgreSQL still does not corrupt data, it only loses the most recent commits; {{fsync = off}} can corrupt data as well). Avoid: keep the defaults ({{1}} / {{on}}) for money data and only relax them for data that can afford loss.
- **Checking the balance in Java and then running UPDATE** without a CHECK in the DB: two concurrent requests both pass the check and the balance goes negative. Avoid: {{UPDATE ... SET balance = balance - ? WHERE id = ? AND balance >= ?}} and check the number of updated rows, plus a CHECK constraint.
- **Calling an external API inside the transaction and then rolling back**: the DB can undo its own changes but cannot "unsend" an email. Avoid: ACID only applies inside the DB; external side effects need the outbox pattern.

### 1-minute interview answer
"ACID is the four guarantees of a transaction, using an A-to-B transfer as the example. Atomicity: the debit and the credit either both succeed or both are cancelled; InnoDB uses undo log, PostgreSQL marks the transaction aborted. Consistency: constraints such as CHECK that the balance is not negative, FK and UNIQUE are enforced by the DB, so data never breaks the rules. Isolation: MVCC lets readers see the old snapshot while row locks stop two writers from overwriting each other. Durability: COMMIT only returns OK after the WAL has been fsynced to disk, and a crash is recovered by replaying the WAL. Trade-off: durability costs one fsync per commit and can be relaxed with synchronous_commit, but never for money data. Experience: I always put constraints in the DB because checking in Java cannot stop a race condition."

> Senior tip: when designing a schema, **always define constraints in the DB** (FK, CHECK, UNIQUE) — that is the last line of defense. The app can have bugs and race conditions can happen, but DB constraints apply to every write path (app, script, batch) — unless someone actively turns them off.`,
    follow: [
      'Why is WAL called "Write-Ahead" — what does it mean to write the log before modifying the data?',
      'Does isolation level READ COMMITTED guarantee Atomicity?'
    ]
  },
  'db-021': {
    q: 'What are 1NF, 2NF, and 3NF? When should you denormalize to trade performance?',
    a: `**Summary:** Normalization removes **data redundancy** and **anomalies** (insert/update/delete anomalies) by splitting tables according to dependencies. **1NF**: atomic values, no repeating columns/arrays. **2NF**: 1NF plus every non-key column **fully depends** on the PK (no partial dependency on a composite PK). **3NF**: 2NF plus no **transitive dependency** (non-key -> non-key). **Denormalize** when: many reads and few writes, needing to avoid complex joins, OLAP reporting, or caching derived data.

### The three normal forms
| Form | Requirement | Typical violation |
|---|---|---|
| **1NF** | Each cell holds one value, no repeating rows, no array columns | Column {{tags}} storing {{"tag1,tag2"}}, table {{order_items}} repeated inside {{orders}} |
| **2NF** | Non-key depends **fully** on the PK (when the PK is composite) | Table {{student_course(student_id, course_id, student_name)}} -> {{student_name}} depends only on {{student_id}} |
| **3NF** | No **transitive dependency** (A -> B -> C where A is the PK) | Table {{employee(emp_id, dept_id, dept_name)}} -> {{dept_name}} depends on {{dept_id}} (non-key) |

### Quick understanding
Normalization is like **organizing a company directory** so each piece of information is written in **exactly one place**. If the department name is copied into every employee record, renaming the department means editing 200 records — miss one and the data contradicts itself (an update anomaly). Normalization moves "department" into its own table and employees only store the department id. Denormalizing is deliberately **copying** a little information back to read faster — like putting the department name on each office door so visitors do not have to look it up — accepting that a rename now touches several places.

### Terminology
- **Functional dependency (A → B)**: knowing A uniquely determines B (knowing {{emp_id}} gives you {{dept_id}}).
- **Anomaly**: an inconsistency when inserting/updating/deleting caused by duplicated data (cannot insert, an update misses a copy, a delete loses other information).
- **Composite key**: a primary key made of several columns.
- **Partial dependency**: a column depends on only one part of a composite key — violates 2NF.
- **Transitive dependency**: key → column X → column Y, where Y does not depend directly on the key — violates 3NF.
- **OLTP / OLAP**: transaction systems with many small writes / analytical systems that read large blocks.
- **Star schema**: a data-warehouse model with a fact table in the center and dimension tables around it.

### Normalizing a real table, step by step
~~~text
Raw table: order_line(order_id, product_id, qty, product_name, customer_id, customer_name, tags="a,b")
1NF: split tags into order_tag(order_id, tag)                 -- one value per cell
2NF: key (order_id, product_id); product_name depends only on product_id,
     customer_* depends only on order_id -> split out product(...), orders(order_id, customer_id, ...)
3NF: orders: order_id -> customer_id -> customer_name (transitive) -> split out customer(...)
Result: orders, order_line(order_id, product_id, qty), product, customer, order_tag
~~~
1. **1NF – one value per cell.** Why: the string "a,b" cannot be indexed, cannot carry an FK, and finding "tag = b" needs LIKE.
2. **2NF – remove dependence on part of the key.** Why: {{product_name}} repeats on every order line containing that product, so a rename means editing millions of rows.
3. **3NF – remove transitive dependency.** Why: deleting a customer's last order must not also wipe the customer name (delete anomaly).
4. **Deliberately keeping a copy**: the sale price at purchase time ({{order_line.unit_price}}) is **not** bad denormalization — it is a historical fact that must not change when the product price changes later.

### When to denormalize
1. **Read-heavy, write-rare**: catalogs, configuration, reports — joins are expensive.
2. **Avoid deep joins**: store {{customer_name}} directly in {{orders}} instead of joining {{customers}}.
3. **Derived/aggregate data**: {{order.item_count}}, {{order.total_amount}} precomputed.
4. **OLAP / Data warehouse**: a star schema (fact + dimension) is denormalized by design.
5. **Application cache**: Redis stores already-denormalized JSON for read screens.

### Safe denormalization example
~~~sql
-- Normalized (3NF)
orders(id, customer_id, created_at)
customers(id, name, email)

-- Denormalized: add customer_name to orders to avoid a join when listing
orders(id, customer_id, customer_name, created_at)
~~~
Requires **trigger / application logic** to keep {{customer_name}} in sync when {{customers}} is renamed.

### Production pitfalls
- Denormalizing **without a sync strategy** -> data drift (the customer is renamed but orders still show the old name).
- Forgetting **unique constraints** on denormalized tables -> duplicate data.
- Over-denormalizing: tables bloat, writes slow down, indexes grow, backups grow.

### Common mistakes
- **Storing a list of ids in one string column** ("1,5,9"): symptom — queries use LIKE, there is no FK, and deleting an element means parsing the string. Avoid: a join table; if you truly need arrays, PostgreSQL has array/JSONB types with a GIN index.
- **Confusing "historical snapshot" with duplicated data**: normalizing the shipping address back into the {{customer}} table means an old order shows the wrong address after the customer moves. Avoid: data that must stay as of a point in time (price, address, name on the invoice) is stored on the order itself.
- **A precomputed total column ({{total_amount}}) not updated in the same transaction** as the detail lines. Symptom — the total differs from the sum of the lines. Avoid: update it in the same transaction, or run a periodic reconciliation job.

### 1-minute interview answer
"Normalization is about storing each fact in one place to avoid insert, update and delete anomalies. 1NF requires each cell to hold a single atomic value. 2NF requires non-key columns to depend on the whole primary key, not on part of a composite key. 3NF removes transitive dependencies — for example dept_name depends on dept_id rather than directly on emp_id. For OLTP I design to 3NF by default. Denormalizing is a trade-off: faster reads and fewer joins, but it needs a sync mechanism — same transaction, trigger or CDC. I only denormalize when I have measured that joins are the bottleneck, and I distinguish it clearly from historical data such as the price at purchase time, which must be copied onto the order."

> Senior tip: default to **3NF for OLTP**. Only denormalize when **measured** joins are the bottleneck and you have a clear sync plan (trigger, CDC, or app-level sync). Do not denormalize "just in case".`,
    follow: [
      'What is the difference between 2NF and 3NF? Give an example that violates 3NF but satisfies 2NF.',
      'How do you keep denormalized data consistent when the source table changes?'
    ]
  },
  'db-022': {
    q: 'How do clustered and non-clustered indexes differ (InnoDB, Oracle, PostgreSQL)? What is the real-world meaning of PRIMARY KEY being clustered in InnoDB but PostgreSQL/Oracle using heap tables?',
    a: `**Summary:** **Clustered index** (InnoDB): the row data is **stored inside the PRIMARY KEY B-tree** — leaf nodes contain all columns. **Non-clustered index** (secondary index): leaf nodes contain the **PK value** pointing back to the clustered index. **PostgreSQL/Oracle** default to a **heap table**: data is stored separately and **all indexes are non-clustered** (the leaf holds a TID/ROWID pointing to the heap). Oracle also has **Index-Organized Tables (IOT)** — the equivalent of clustered. Consequences: an InnoDB PK lookup is fast (1 B-tree) and a secondary index needs 2 B-trees; in PostgreSQL every index is 1 B-tree + a heap lookup.

### InnoDB (MySQL) — Clustered index
- The table **always** has a clustered index: the PK if present, a unique not-null key otherwise, or a hidden 6-byte row_id.
- A **secondary index** leaf stores the **PK value** (not a physical pointer) -> it points back to the clustered index.
- Lookup by PK: **1 B-tree traversal**.
- Lookup by secondary index: **2 B-trees** (secondary -> PK -> clustered).
- **The PK should be short** (BIGINT/AUTO_INCREMENT) because the PK value is repeated in every secondary index.

### Quick understanding
A **clustered index (InnoDB)** is like a **dictionary**: the content itself is ordered by word (the PK), so looking up a word shows you its definition right there. To search by another attribute (a secondary index) you use a separate lookup table that only gives you the "word" (the PK), and then you look it up in the dictionary again. **A heap table (PostgreSQL/Oracle)** is like a **warehouse filled in arrival order**: new items go into any free slot; every lookup table (even the one by primary code) only records "which shelf, which slot" (TID/ROWID), and after that you walk straight to that slot.

### Terminology
- **Clustered index**: an index whose leaves hold the entire row; the data is physically ordered by the index key.
- **Secondary (non-clustered) index**: a side index whose leaves hold a pointer to the row (InnoDB: the PK value; PostgreSQL: the TID).
- **Heap**: an area where rows are stored without following any key order.
- **TID / ctid / ROWID**: the physical address of a row (block, position within the block).
- **HOT update (Heap-Only Tuple)**: a PostgreSQL UPDATE that changes no indexed column and whose new tuple fits on the same page, so no index entry has to be added.
- **FILLFACTOR**: the percentage of each page filled on write, leaving free space for later updates.
- **IOT (Index-Organized Table)**: an Oracle table stored in the form of a clustered index.

### Looking up one row, step by step
~~~text
InnoDB: SELECT * FROM orders WHERE email = 'a@x.vn'
 idx_email (B-tree)  --> leaf: ('a@x.vn', PK=42)
 clustered PK        --> 3-4 pages --> leaf: [42 | all columns]
PostgreSQL: same query
 idx_email (B-tree)  --> leaf: ('a@x.vn', TID=(1050, 7))
 heap                --> read page 1050, slot 7 (1 page)
8-byte PK (BIGINT) vs 36-byte PK (UUID as a string): 5 secondary indexes x 100 million rows
 -> a difference of about 5 x 100M x 28 bytes ≈ 14GB just because of the PK size
~~~
1. **Walk the secondary index to its leaf.** Why the InnoDB leaf holds the PK rather than an address: when a page split moves rows around, no secondary index has to be updated.
2. **InnoDB: continue into the clustered index by PK** (3–4 more pages, usually already in the buffer pool). PostgreSQL: jump straight to the heap by TID (1 page).
3. **If the index already contains every needed column** (a covering index), step 2 is skipped — every InnoDB secondary index automatically carries the PK, so {{SELECT id, email}} is covering by construction.
4. **On UPDATE**: InnoDB modifies the row in place inside the clustered index and only touches secondary indexes whose columns changed; PostgreSQL writes a new tuple and, unless it is a HOT update, must add an entry to **every** index.

### PostgreSQL / Oracle — Heap table
- Data lives in a **heap** (not in key order); every row has a physical address: {{ctid}} = (block, offset) in PostgreSQL; Oracle's {{ROWID}} includes the file.
- **All indexes** (including the PK) are non-clustered: the leaf stores a **TID** -> pointing to the heap.
- Lookup by PK: 1 B-tree + 1 heap fetch.
- Lookup by secondary index: 1 B-tree + 1 heap fetch (same as the PK).
- **Heap tuple update** (MVCC) creates a new tuple -> **all indexes** must add an entry pointing to the new TID (index bloat) — **unless** it is a **HOT update**: no indexed column changed and the current page still has room, so no index has to be updated.

### Real-world comparison
| Operation | InnoDB (Clustered PK) | PostgreSQL (Heap) |
|---|---|---|
| PK lookup | 1 B-tree | 1 B-tree + heap fetch |
| Secondary index lookup | 2 B-trees | 1 B-tree + heap fetch |
| INSERT | Append to the end of the PK (if the PK increases) | Append to the heap, update every index |
| UPDATE non-PK | In-place + undo log; only secondary indexes containing the changed column are updated | New tuple (MVCC); a HOT update leaves indexes untouched, otherwise every index is updated |
| UPDATE PK | **Delete + insert** (expensive) | Same as a non-PK update |
| Index size | Secondary index holds the PK value | Every index holds the TID (fixed size) |

### Production pitfalls
- **InnoDB: a random PK (UUID)** -> B-tree fragmentation, slow inserts, large secondary indexes. Use **UUIDv7** or **BIGINT AUTO_INCREMENT**.
- **InnoDB: UPDATE PK** is very expensive (delete + insert) -> avoid changing PKs.
- **PostgreSQL: ANY update** creates a new tuple; without HOT conditions every index is updated -> rapid bloat. For update-heavy tables: set {{FILLFACTOR}} low (leave room for HOT), avoid indexes on frequently changed columns, use aggressive autovacuum; monitor {{n_tup_hot_upd}} in {{pg_stat_user_tables}}.
- **PostgreSQL: the {{CLUSTER}} command** can sort the heap by an index (similar to clustered) but **does not maintain** that order after inserts/updates.

### Common mistakes
- **An InnoDB table without a declared PK**: InnoDB falls back to a hidden 6-byte row id — you cannot query it, and row-based replication on a replica can get very slow for multi-row UPDATE/DELETE because there is no key to locate rows. Avoid: always declare a PK (MySQL 8.0.30+ has {{sql_generate_invisible_primary_key}}).
- **Indexing a constantly updated column ({{last_seen_at}}) on PostgreSQL**: HOT updates are lost and every update writes to every index. Symptom — {{n_tup_hot_upd}} near 0 and fast index bloat. Avoid: drop that index or move the "hot" column into a separate table.
- **Believing {{CLUSTER}} turns PostgreSQL into a clustered index**: it sorts once and holds an ACCESS EXCLUSIVE lock for the whole run. Avoid: use BRIN or time-based partitioning when nearby data must be physically close, or {{pg_repack}} to reorganize online.

### 1-minute interview answer
"In InnoDB the primary key is the clustered index: the leaves of the PK B-tree hold the whole row, while a secondary index holds the PK value, so a secondary lookup walks two trees. PostgreSQL and Oracle default to a heap: data lives separately and every index, including the PK, holds only a physical address such as a TID or ROWID. The practical consequences: in InnoDB the PK should be short and increasing because it is repeated in every secondary index and a random PK causes page splits; in PostgreSQL every UPDATE writes a new tuple, so design for HOT updates with fillfactor and avoid indexes on frequently changed columns. Experience: when moving from MySQL to PostgreSQL, an update-heavy workload needs n_tup_hot_upd and autovacuum watched from day one."

> Senior tip: when migrating from MySQL to PostgreSQL, do not keep the mindset that "PK clustered = fastest". PostgreSQL's heap plus non-clustered indexes means every UPDATE creates a new row version — design workloads to leverage HOT updates and timely vacuum. Benchmark with real production-like data.`,
    follow: [
      'Why does an InnoDB secondary index store the PK value instead of a physical pointer?',
      'Does PostgreSQL really support a true clustered index?'
    ]
  },
  'db-023': {
    q: 'When is an index not used: function on the column, LIKE starting with %, OR, implicit cast, low selectivity?',
    a: `**Summary:** A B-tree index is like a book's table of contents: it helps the DB find values in sorted order, but only when the condition in the WHERE clause "matches" the order of the index. Five common situations make the optimizer skip the index: (1) a function or expression wrapped around the column, (2) LIKE starting with %, (3) OR without an index covering both sides, (4) a comparison of different types that forces an implicit cast, (5) a column with few distinct values (low selectivity). In these cases the DB usually scans the whole table (seq scan), which is slow on a large table.

### Quick understanding
Imagine an index as the table of contents at the end of a book: it is sorted by keyword, so finding "Java" is fast because the words are in alphabetical order. But if the request is "find books with 'Java' somewhere in the description" — the equivalent of a function or a leading wildcard — the table of contents is useless, because it only looks words up from their beginning. Likewise, if you ask for "red or blue books" but the only index is by colour, the DB has to read both index ranges or scan the whole book. When a column has only two values (male/female), the index does not help much either, because almost every page contains both. So an index is most useful when the condition matches the column's actual value and filters down to few rows.

### Terminology
- **B-tree index**: an ordered lookup structure inside the DB that supports fast equality, range and prefix searches.
- **Seq scan / full table scan**: reading every row of the table from start to end; slow on a large table.
- **Expression index**: an index built on the result of a function/expression (e.g. DATE(column)); only usable when the query writes exactly that expression.
- **Implicit cast**: the DB converts a value's type (e.g. varchar to number) in order to compare, which loses the ability to use the index on the original column.
- **Selectivity**: the fraction of rows matching a condition relative to all rows; the fewer rows match, the more useful the index.
- **Partial index**: an index containing only the subset of rows that satisfy a condition, good for columns with few distinct values.

### 1. Function (expression) on a column
The DB consults the index using the column's actual value, not the result of a function. When you write DATE(created_at), the values in the index are still full datetimes, so the DB has no way to know which pages hold the matching dates.

How it works, step by step:
1. The optimizer looks at the condition WHERE DATE(created_at) = '2026-01-01'.
2. The indexed column is created_at (a timestamp), while the condition applies DATE() to the column.
3. Because the indexed value differs from the value after the function, the optimizer cannot map the condition onto the index -> it skips the index and scans the whole table.

Numbers: an orders table with 1 million rows. The query DATE(created_at) = '2026-01-01' with a seq scan reads all 1 million rows; rewritten as a range it reads only the few hundred rows of that day.

~~~sql
-- does NOT use the index on created_at (a function wraps the column)
WHERE DATE(created_at) = '2026-01-01'
WHERE YEAR(created_at) = 2026

-- Fix: rewrite as a range on the bare column
WHERE created_at >= '2026-01-01' AND created_at < '2026-01-02'
~~~

Another solution: an **expression index** built on the expression itself. MySQL 8.0.13+: {{CREATE INDEX idx_day ON orders ((DATE(created_at)))}}; PostgreSQL: {{CREATE INDEX ON orders ((created_at::date))}} (only for a {{timestamp}} column; with {{timestamptz}} the expression depends on the timezone, is not IMMUTABLE, and therefore cannot be indexed). The query must use the **same expression** (same function, same type, same collation) to use the index.

### 2. LIKE with a leading wildcard
A B-tree index stores values in left-to-right order, so it only supports lookups by the "beginning" (prefix).

How it works:
1. WHERE name LIKE 'abc%' has the prefix abc -> the optimizer uses the index to jump to the abc range and scans in order.
2. WHERE name LIKE '%abc' or LIKE '%abc%' has no fixed prefix -> there is no starting point in the index -> full scan.

Everyday example: a book's table of contents is searched by the first letter. If you only remember that the word ends in "movie", the table of contents is no help.

~~~sql
WHERE name LIKE '%abc'   -- does not use the B-tree
WHERE name LIKE 'abc%'   -- uses it (prefix)
~~~

PostgreSQL note: a prefix LIKE only uses the B-tree when the collation is {{C}} or the index was created with {{text_pattern_ops}}/{{varchar_pattern_ops}}. The solution for '%abc%': a **trigram index** ({{pg_trgm}} with GIN/GiST) supports {{LIKE}}/{{ILIKE}} on a contained substring; for natural-language search use full-text ({{tsvector}}) or a search engine.

### 3. OR without an index covering both branches
How it works:
1. WHERE status = 'ACTIVE' OR priority = 1: if only status is indexed, the priority = 1 branch cannot use that index.
2. The optimizer usually chooses a full table scan rather than combining two different plans.
3. PostgreSQL has BitmapOr (combining bitmaps from two indexes) and MySQL has index_merge, but they are not always chosen.

Alternative: use UNION ALL so each branch uses its own index, and de-duplicate if needed.

~~~sql
-- only uses indexes if BOTH columns are indexed
WHERE status = 'ACTIVE' OR priority = 1

-- Alternative: UNION ALL (each branch uses its own index)
SELECT * FROM orders WHERE status = 'ACTIVE'
UNION ALL
SELECT * FROM orders WHERE priority = 1
  AND status IS DISTINCT FROM 'ACTIVE'   -- avoid duplicates; != would also skip rows where status IS NULL
~~~

### 4. Implicit cast
How it works:
1. The phone column is VARCHAR(20), but the query compares WHERE phone = 123456789 (a number).
2. The DB cannot compare different types directly, so it casts the column to a number (or raises an error) before comparing.
3. After the cast, the values in the index (strings) no longer match the condition -> the index is skipped.

~~~sql
-- phone column VARCHAR(20)
WHERE phone = 123456789  -- implicit cast: index not used

-- Fix: compare with the correct type
WHERE phone = '123456789'
~~~

PostgreSQL is stricter: comparing {{varchar = integer}} raises {{operator does not exist}} instead of casting implicitly. From Java, a common trap is binding the wrong type (for example {{setString}} into a numeric column, or NVARCHAR vs VARCHAR on Oracle/SQL Server).

### 5. Low selectivity
How it works:
1. The {{status}} column has only 3 values ({{PENDING}}, {{DONE}}, {{CANCELLED}}), so selectivity is about 33%.
2. The optimizer estimates that a seq scan of 33% of the table is faster than an index scan (which must read the index and then fetch each row from the heap).
3. So the optimizer skips the index on this column.

A **partial index** solves it: index only the subset the query needs. {{CREATE INDEX ON orders (created_at) WHERE status = 'PENDING'}}.

### Checking whether the index is used
Use EXPLAIN (ANALYZE, BUFFERS) to see the actual access path.

~~~sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE status = 'PENDING';
-- Look at: Index Scan vs Seq Scan, rows removed by filter
~~~

### Common mistakes
1. **Adding an index on a low-selectivity column without measuring**: the query still seq scans, and the index only costs space and slows UPDATE. Avoid: run EXPLAIN ANALYZE on production-like data before adding it.
2. **Writing a function on the column for reporting and leaving it in production**: every run scans the whole table. Avoid: rewrite it as a range, or create an expression index if the expression is stable and the query uses exactly it.
3. **Using LIKE '%abc' for large searches**: a full scan that gets slower as the table grows. Avoid: a prefix LIKE, or a trigram index / full-text search for substring searches.
4. **Assuming a static plan while selectivity changes over time**: status {{PENDING}} goes from 1% to 50% when the system is stuck, and a cached plan (prepared statement) may pick the wrong one. Avoid: use {{force_custom_plan}} or re-prepare, and review plans periodically.

### 1-minute interview answer
"A B-tree index is like a book's table of contents: it only helps when you know the beginning of the entry. If you wrap the column in a function, use a leading wildcard in LIKE, write an OR where only one side is indexed, compare different types and trigger an implicit cast, or index a column with few distinct values, the optimizer usually skips the index and scans the whole table. The basic fix is to put the condition directly on the column (a range instead of a function), and if you really need it, use an expression index or a partial index. Before adding an index I always measure with EXPLAIN ANALYZE on near-production data, to avoid adding a useless index that slows writes."

> Senior tip: before adding an index, **measure with EXPLAIN ANALYZE** on production-like data. A useless index costs not just disk but also makes UPDATE noticeably slower. Rule: every index must have a measured reason.`,
    follow: [
      'Why does LIKE "%abc" not use a B-tree while "abc%" does?',
      'How does a partial index help for low-selectivity columns?'
    ]
  },
  'db-024': {
    q: 'Redis data structures (String, Hash, List, Set, Sorted Set, Bitmap, HyperLogLog, Stream) — which use case fits which: cache, rate limit, leaderboard, distributed lock, session?',
    a: `**Summary:** Redis is an **in-memory data structure store**: it does not just hold simple key-values, but provides native structures such as String, Hash, List, Set, Sorted Set, Bitmap, HyperLogLog and Stream, each solving a different problem. Choosing the wrong structure (for example String + JSON for a complex session) means every update has to read the whole object, parse the JSON, modify it and write it back — slow and prone to concurrency bugs.

### Quick understanding
Think of Redis as an advanced pharmacy counter: String is a simple pill blank (a single value), Hash is a form with many fields (patient id, age, readings), List is a queue of prescriptions in order, Set is a list of patients without duplicates, Sorted Set is a ranking table sorted by score, Bitmap is a daily true/false scoring sheet, HyperLogLog is a machine that estimates the number of distinct customers without recording each name, and Stream is a message queue that records what has been read. Each structure used for its purpose is fast; used wrongly it becomes slow and complicated.

### Terminology
- **Redis**: an in-memory (RAM) data store used as a cache or a lightweight database.
- **In-memory**: all data lives in RAM, so access is extremely fast but data is lost on power failure (unless persistence is enabled).
- **Key-value**: a model storing "key - value" pairs, e.g. key "user:123" with value "Nguyen Van A".
- **Hash table**: a structure that looks values up by key in O(1); Redis uses it to implement Hash.
- **O(1) / O(log n)**: operation time that does not depend on the number of elements (O(1)) or grows logarithmically (O(log n)).
- **TTL**: a key's time to live, after which Redis deletes it automatically (used for cache and sessions).
- **Fencing token**: an increasing number used to stop an old worker from writing after it lost the lock (prevents accidental overwrites).

### Structures and typical use cases
| Structure | Sample commands | Real-world use case |
|---|---|---|
| **String** | {{SET}}, {{GET}}, {{INCR}} | Simple cache, counter, distributed lock ({{SET NX EX}}), fixed-window rate limit ({{INCR}} + {{EXPIRE}}) |
| **Hash** | {{HSET}}, {{HGET}}, {{HGETALL}} | **Session** (field = attribute), object cache (user profile), shopping cart |
| **List** | {{LPUSH}}, {{RPOP}}, {{LRANGE}} | Simple FIFO queue, recent items ({{LTRIM}} keeps the latest 100 items) |
| **Set** | {{SADD}}, {{SREM}}, {{SISMEMBER}}, {{SUNION}} | Tagging, unique visitor ({{SADD}} user_id), friend recommendations (intersection) |
| **Sorted Set (ZSet)** | {{ZADD}}, {{ZRANGE}}, {{ZRANK}} | **Leaderboard** (score = points), delay queue (score = timestamp), sliding-window rate limit |
| **Bitmap** | {{SETBIT}}, {{GETBIT}}, {{BITCOUNT}} | Daily active users (DAU), retention, permission bitset |
| **HyperLogLog** | {{PFADD}}, {{PFCOUNT}} | Estimate cardinality (unique count) with ~12KB of fixed memory — unique IPs, unique search terms |
| **Stream** | {{XADD}}, {{XREAD}}, {{XGROUP}} | **Message queue** (consumer group, acknowledgment, replay) — a lightweight Kafka alternative |

### Typical examples
- **Sliding-window rate limit**: a Sorted Set with score = timestamp. For 100 requests per minute, each request runs {{ZADD limit:user:1 <ts> <ts>}}, then {{ZREMRANGEBYSCORE limit:user:1 -inf <ts-60s>}} removes old entries and {{ZCARD limit:user:1}} counts the remaining requests. If the count > 100, reject.
- **Distributed lock**: {{SET lock:order:123 "owner1" NX EX 10}} — atomic, auto-expires after 10 seconds. A Lua script is needed to unlock safely (only unlock if the value matches the owner). A lock on an asynchronously replicated master can be lost on failover — for important tasks combine it with a fencing token or a DB-level constraint.
- **Leaderboard**: {{ZADD leaderboard 1500 "user:1"}}, {{ZREVRANGE leaderboard 0 9}} for the top 10.
- **Session**: a Hash {{session:abc123}} with fields {{user_id}}, {{role}}, {{last_seen}} — {{HGETALL}} reads everything, {{HINCRBY}} updates a single counter field without reading the whole object back.

### Common mistakes
1. **Using String + JSON for a session**: every field update needs GET -> deserialize -> modify -> serialize -> SET (race conditions, wasted CPU). Avoid: use a Hash and {{HSET}} the single field.
2. **Using a List as a queue without a consumer group or ack**: messages are lost when a worker crashes. Avoid: use **Stream** for production queues (consumer groups + acknowledgment).
3. **Big keys** (a large Hash/List/Set/ZSet): commands such as {{DEL}}, {{HGETALL}}, {{ZRANGE}} block Redis's single thread. Avoid: {{UNLINK}} (asynchronous delete) and {{SCAN}}/{{HSCAN}}/{{ZSCAN}} to iterate by cursor.
4. **Misusing Lua scripts**: compound operations that are not atomic cause race conditions in locks and rate limits. Avoid: wrap check-then-act in a Lua script that runs atomically.

### 1-minute interview answer
"Redis is not just a simple key-value store, it is an in-memory data structure store. Each structure solves one problem: String for simple cache and counters, Hash for sessions and object caches, List for simple queues, Set for tagging and distinct visitors, Sorted Set for leaderboards and sliding rate limits, Bitmap for presence/scoring, HyperLogLog for estimating distinct counts, and Stream for message queues with acknowledgment. I pick the structure from the requirement: sessions usually use Hash so I can update one field, leaderboards use Sorted Set, sliding-window rate limits use Sorted Set, and queues that need acknowledgment use Stream. I avoid String + JSON for sessions because every update has to read and write the whole object."

> Senior tip: Redis is not just a "cache". Knowing all 8 data structures and when to use each is a senior engineer marker. Example: a rate limit uses Sorted Set (sliding window) or String (fixed window/token bucket); a leaderboard uses Sorted Set; a session usually uses Hash (Spring Session Redis also stores sessions as a Hash); a queue that needs acknowledgment should use Stream.`,
    follow: [
      'Why should you not use a Redis List for a production message queue?',
      'How do you handle big keys in Redis (a large Hash/ZSet) without blocking the main thread?'
    ]
  },
  'db-025': {
    q: 'Redis is single-threaded but why is it fast? How do RDB and AOF persistence differ, and can Redis lose data?',
    a: `**Summary:** Redis is fast due to **I/O multiplexing** (epoll/kqueue) + a **single-threaded event loop** (no context switch, no lock contention) + **simple data structures** (O(1) or O(log n)) + **all data in RAM**. **RDB** (snapshot) is fast, compact and recovers quickly but **loses data** since the last snapshot. **AOF** (append-only log) is more durable, with configurable fsync ({{always}}/{{everysec}}/{{no}}), a larger file and slower recovery. Redis **can lose data** depending on the persistence configuration and the failure scenario.

### Quick understanding
Think of Redis as a sprinter: although he has only one pair of legs (one thread), he can manage thousands of things at once thanks to I/O multiplexing (like opening many doors at the same time and only working when a door is ready) and super-optimized data structures. Persistence is like two backup styles: a snapshot (periodically photographing all the data) and a continuous write log (recording every operation). Data loss happens when the server crashes between backups or replication has not caught up.

### Terminology
- **I/O multiplexing**: a mechanism that lets one thread manage many sockets and only act on the ones that are ready (for example epoll on Linux).
- **Event loop**: a loop that keeps taking work from a queue and executing it; single-threaded, with no context switching.
- **Child process**: a process forked from the main process to write the RDB, completely independent.
- **Append-only file (AOF)**: a text file that records every write command in sequence, which can later be rewritten to compact it.
- **fsync**: the command that guarantees data is written to disk, with modes always, everysec and no.
- **Snapshot**: the persisted state of Redis written to disk on a schedule (e.g. save 900 1).
- **Replication lag**: the delay between master and replica while replication runs asynchronously.

### Why single-thread is still fast
1. **No context switch**: one thread handles every command sequentially.
2. **I/O multiplexing**: {{epoll}} (Linux) / {{kqueue}} (BSD) lets one thread manage thousands of connections at once — it only reads/writes when a socket is ready.
3. **Optimized data structures**: hash table (O(1)), skiplist (O(log n) for ZSet), SDS string (binary safe, O(1) length).
4. **Pipelining**: a client sends many commands in one round-trip, reducing network and syscall cost.
5. **No lock contention** — a single thread accesses memory -> no mutex is needed.

*Note*: Redis 6+ supports **threaded I/O** for network read/write (parsing, sockets), but command execution stays single-threaded.

### RDB vs AOF
| Feature | RDB (Snapshot) | AOF (Append-Only File) |
|---|---|---|
| Mechanism | Fork a child process, dump memory to disk | Append every write command |
| Frequency | {{save 900 1}} (900s if at least 1 key changed) | Every write command |
| File size | Small (compressed, binary) | Large (text protocol); a periodic rewrite compacts it |
| Recovery | **Fast** (load the binary) | Slower (replay commands); {{aof-use-rdb-preamble}} (on by default) makes the base load fast like RDB |
| Data loss | From the last snapshot to the crash | Depends on {{appendfsync}}: {{always}} ≈ 0, {{everysec}} ≈ 1s (worst ~2s), {{no}} = depends on the OS cache |
| CPU/Disk cost | Fork + dump (may cause a latency spike) | Continuous writes, fsync cost |

### Can Redis lose data?
**Yes**, in these cases:
1. **RDB only**: a crash between two snapshots -> data since the last snapshot is lost.
2. **AOF {{appendfsync = everysec}}** (the default when AOF is on): a machine crash -> about 1 second of data is lost (worst case ~2 seconds) while still in the OS cache, not fsynced.
3. **AOF {{appendfsync = no}}**: data in the OS page cache is lost (possibly several seconds).
4. **Async replication**: the master crashes before the replica syncs -> writes not yet replicated are lost.
5. **OOM / OOM killer**: the process is killed -> all memory is lost (if there is no persistence).

### Recommended durable configuration
~~~conf
# Enable both
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec        # balance performance / durability
no-appendfsync-on-rewrite no   # yes reduces latency during a rewrite but can lose up to ~30s of data
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
~~~
For financial/critical data: {{appendfsync always}} + replica + periodic backup.

### Common mistakes
- **Disabling persistence** ({{save ""}} + {{appendonly no}}) -> Redis becomes a pure cache, and a restart wipes everything.
- **RDB fork() latency spike** on large-memory instances (>10GB) -> the fork call blocks the main thread (tens to hundreds of ms, especially on VMs). Reduce the {{save}} frequency or use AOF.
- **AOF rewrite** (compaction) also forks -> same issue. Monitor the {{aof_rewrite_in_progress}} metric.
- **Replication lag**: the master writes fast and the replica is slow -> a failover loses data. Use {{min-replicas-to-write}} + {{min-replicas-max-lag}} so the master refuses writes when the replica is too slow — this limits the loss window but does not eliminate it.

### 1-minute interview answer
"Redis is an in-memory (RAM) data store with a single-threaded event loop and I/O multiplexing, which lets it handle thousands of connections without context switching. Persistence has two modes: snapshots (a fast photograph of the data) and a write log (recording every operation). Data loss happens when the server crashes between backups or replication has not caught up. I choose a durability configuration based on the SLO: a cache can afford to lose a few seconds, while billing must have appendfsync always + a replica."

> Senior tip: nothing is "free" — for maximum speed (sub-ms) accept the risk of data loss (RDB only or AOF everysec). To limit loss -> {{appendfsync always}} + replica + the {{WAIT}} command (Redis has no truly synchronous replication) -> higher latency; if data must never be lost, the source of truth should be a DB. Agree on a clear **SLO**: "rate limit/session/cache may lose data", "billing/inventory/idempotency keys MUST NOT lose data".`,
    follow: [
      'Why does Redis 6+ add threaded I/O but keep command execution single-threaded?',
      'When should you choose RDB only, AOF only, or both?'
    ]
  },
  'db-026': {
    q: 'A business function is only exposed through an Oracle PL/SQL package/procedure that returns a REF CURSOR. How do you call it from Spring JDBC, manage transactions, and map the results?',
    a: `**Summary:** With Oracle procedures, keep the DB boundary clear: declare the parameters correctly, call through Spring JDBC, consume the cursor while the connection is still open, and map to a DTO. {{SimpleJdbcCall}} supports declaring procedures/functions and reading metadata, but packages, overloads and REF CURSORs usually need explicit declaration to avoid depending on driver metadata.

### Quick understanding
Calling an Oracle procedure that returns a REF CURSOR is like **phoning the warehouse and being handed a "pickup ticket"** instead of the goods: the ticket (cursor) is only valid while the line (connection) is still open — you have to follow the ticket and collect the goods right away, one truck at a time (fetch), and only then hang up. If you hang up first and hand the ticket to someone else, the ticket is void. Spring JDBC handles the call, keeps the line open, reads the goods out and closes the line for you — your job is to **declare the parameters correctly** and **move the goods into a DTO** while the line is still open.

### Terminology
- **PL/SQL package**: a group of Oracle procedures/functions/data types under one name, made of a spec (declarations) and a body (implementation).
- **REF CURSOR**: a pointer to an open result set on the server, returned through an OUT parameter.
- **IN / OUT parameter**: a parameter passed in / a parameter the procedure writes its result into.
- **SimpleJdbcCall**: the Spring class that calls procedures/functions, generating the {{call}} statement and mapping parameters.
- **Metadata discovery**: Spring reads the parameter definitions from the DB dictionary through the driver; with packages/overloads this easily goes wrong, so explicit declaration is safer.
- **Overload**: several procedures with the same name in a package but different parameter lists.
- **OracleTypes.CURSOR**: the Oracle driver's type constant ({{oracle.jdbc.OracleTypes}}) for registering an OUT parameter as a cursor.
- **RowMapper**: a function that turns one ResultSet row into a Java object.

### One call passing through the layers, step by step
~~~text
Service (@Transactional(readOnly = true))
  -> DAO: call.execute(Map.of("p_account_id", 42))
       Spring: gets a connection (already bound to the transaction)
       JDBC  : { call BANK_APP.ACCOUNT_PKG.FIND_ENTRIES(?, ?) }
               bind IN = 42, registerOutParameter(2, OracleTypes.CURSOR)
       Oracle: opens the cursor, returns a handle
       Spring: reads the ResultSet using the fetch size, RowMapper -> List<Entry>, closes the ResultSet
  <- Map {"p_rows" -> List<Entry>}
Service: uses List<Entry> (the cursor is already closed, safe)
~~~
1. **Declare the schema, package (catalog) and procedure exactly as they are in the DB.** Why: Oracle resolves by full name; a missing package raises PLS-00201 or calls the wrong procedure.
2. **Declare the parameters explicitly and disable metadata** ({{withoutProcedureColumnMetaDataAccess}}). Why: it avoids failures with overloads, synonyms, or an application user without permission to read the data dictionary.
3. **Register the OUT cursor together with a RowMapper.** Why: Spring reads the cursor to the end inside {{execute}} and closes it, so the result is an ordinary List.
4. **Wrap it in the right transaction** ({{readOnly}} for queries, a write transaction if the procedure performs DML). Why: when a procedure writes data, commit/rollback must be controlled by Spring; the procedure must not {{COMMIT}} on its own.
5. **Read the result from the Map by parameter name** and cast safely ({{@SuppressWarnings("unchecked")}} or a small helper).

### Call flow
1. Identify the package, procedure name, IN and OUT order/types, cursor type and EXECUTE privilege.
2. Use {{JdbcTemplate}} or {{SimpleJdbcCall}} together with a {{SqlOutParameter}} using the cursor type appropriate for Oracle JDBC; configure the package name and skip metadata discovery if the schema is complex.
3. Execute within the appropriate Spring transaction. Consume the ResultSet/cursor before the connection closes; never return the cursor outside the DAO.

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
| JdbcTemplate | Need control over binding and mapping | Little abstraction, explicit code |
| SimpleJdbcCall | Stable procedure, many OUT params | Metadata can be wrong with packages/overloads |
| JPA native call | Simple entity integration | Cursor / bulk results are usually awkward |

### Production pitfalls
- Oracle package names are not always equivalent to schema names in every abstraction; verify the generated call with the real Oracle JDBC version.
- Do not return {{ResultSet}} or a vendor cursor outside the callback: the transaction/connection may already be closed.
- Bind parameters, never concatenate SQL. Measure DB time separately from mapping time.
- Procedure errors may return vendor error codes; convert them to stable business exceptions, but keep SQLState/code in telemetry after filtering sensitive data.

### Common mistakes
- **The procedure calls {{COMMIT}} itself**: Spring's rollback no longer affects the part already committed. Symptom — a later Java step fails but the data has been half-saved. Avoid: agree with the DB team that procedures never commit; the transaction boundary belongs to the application.
- **Column names in the RowMapper differ in case or alias**: Oracle returns column names in UPPERCASE; renaming an alias in the procedure makes the RowMapper fail at runtime with "invalid column name". Avoid: integration-test against the real procedure; column names are a versioned contract.
- **Calling a procedure that returns hundreds of thousands of rows into a List**: OutOfMemoryError. Avoid: use {{JdbcTemplate.execute(CallableStatementCallback)}} to stream the ResultSet yourself and process it in batches (see the question about fetch size/BULK COLLECT).

### 1-minute interview answer
"For an Oracle procedure that returns a REF CURSOR, I use SimpleJdbcCall declaring the schema, the package as the catalog and the procedure name, and I turn off metadata discovery so I can declare the parameters explicitly: IN is the account id and OUT is OracleTypes.CURSOR together with a RowMapper. Spring reads the whole cursor during execute while the connection is open, maps it to DTOs and closes it, so I never return a ResultSet outside the DAO. Transactions are managed by Spring and the procedure must not commit on its own. Trade-off: plain JdbcTemplate gives maximum control, SimpleJdbcCall is convenient with many OUT params, and JPA native queries are awkward with cursors. Experience: always keep an integration test against a real Oracle, because H2 cannot emulate packages, cursors or uppercase column names."

> Senior tip: write integration tests on an Oracle environment that matches production for REF CURSORs and overloads; H2 cannot verify Oracle semantics.`,
    follow: [
      'When does SimpleJdbcCall need explicit parameter declaration?',
      'How do you test an Oracle procedure in a CI pipeline?'
    ]
  },
  'db-027': {
    q: 'An Oracle procedure returns hundreds of thousands of rows to be processed in Java. When do you use REF CURSOR, BULK COLLECT/FORALL or JDBC fetch batching, and how do you control memory?',
    a: `**Summary:** Choose where processing happens based on the data and the business need: cursor streaming/JDBC fetch size when Java must read sequentially with bounded memory; {{BULK COLLECT}}/{{FORALL}} when the transformation should run close to the data. Do not load unlimited data into a collection or a List just to reduce round-trips.

### Quick understanding
Moving 500,000 crates from the warehouse (Oracle) to the workshop (Java) is like **hauling with trucks**: moving one crate at a time (fetching row by row) costs 500,000 trips; piling all 500,000 crates onto one giant truck (reading everything into a List) makes the truck collapse (heap exhaustion). The right way is **medium trucks, many trips** — a fetch size of 500 rows per trip, with the workshop finishing one batch before taking the next. And if the task is only "move crates from shelf A to shelf B inside the same warehouse", do not haul them out at all: let the warehouse do it with **BULK COLLECT/FORALL**, batch by batch.

### Terminology
- **Fetch size**: how many rows the JDBC driver fetches from the server per round-trip; the Oracle driver defaults to only 10.
- **Round-trip**: one request-response exchange over the network between the app and the DB.
- **PL/SQL ↔ SQL context switch**: the cost of the PL/SQL engine handing a statement to the SQL engine and receiving the result each time.
- **BULK COLLECT ... LIMIT n**: fetching n rows at a time into a PL/SQL collection.
- **FORALL**: sending a whole collection into one DML statement in a single context switch.
- **SAVE EXCEPTIONS**: lets FORALL continue when an element fails, collecting the errors in {{SQL%BULK_EXCEPTIONS}}.
- **PGA**: the private memory area of each Oracle session, where PL/SQL collections live.
- **Streaming**: processing data row by row or batch by batch as it arrives, without holding everything in memory.

### Numbers to help you choose, step by step
~~~text
500,000 rows, network RTT 1ms
 fetch size 10   (Oracle default) : 50,000 round-trips ≈ 50s just waiting on the network
 fetch size 500                    :  1,000 round-trips ≈ 1s
 fetch size 50,000                 :     10 round-trips, but each batch is ~tens of MB of heap
PL/SQL row by row: 500,000 INSERTs = 500,000 context switches
FORALL batch of 500: 1,000 context switches
~~~
1. **Ask: does Java need to see the data?** If it is only transformed or copied inside the DB, do it in Oracle. Why: the data does not have to cross the network twice.
2. **If Java needs it**: read the REF CURSOR as a stream, {{setFetchSize(500)}}, process and write downstream batch by batch. Why: memory holds only one batch, and round-trips drop 50x compared to the default.
3. **If doing it in Oracle**: {{BULK COLLECT ... LIMIT}} + {{FORALL}}. Why LIMIT: the collection lives in the PGA, and without a limit 500,000 rows can take hundreds of MB per session.
4. **Decide the commit boundary**: one transaction for the whole job (easy to roll back but long undo retention) or commit per batch (lighter but needs a checkpoint to resume). Why it matters: it changes what "success/failure" of the job means.
5. **Measure**: rows/second, Java heap, PGA, round-trip count; increase the fetch size/LIMIT only when the measurements show the network is the bottleneck.

### Mechanisms and choices
- A REF CURSOR returns a result set; the JDBC fetch size suggests how many rows to fetch each time, and drivers may not implement it uniformly.
- {{BULK COLLECT ... LIMIT}} batches PL/SQL to reduce context switches between PL/SQL and SQL while still bounding memory.
- {{FORALL}} binds a collection for bulk DML, reducing round-trips; per-element exceptions must be designed explicitly (e.g. SAVE EXCEPTIONS).

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
| Java reads the cursor with a fetch size | Per batch | Low | Java must process / push downstream |
| Limited BULK COLLECT | Fewer than row-by-row PL/SQL | Bounded by LIMIT | Logic and DML stay inside Oracle |
| Full BULK COLLECT | Few | Can be very large | Only for small, bounded sets |

### Production pitfalls
- Fetch size is not a business page size; drivers may buffer differently than you expect. Measure heap and network with the real driver.
- Commit per batch changes atomicity semantics: a job failing midway leaves committed work behind. You need checkpoint/idempotency and a resume process.
- Bulk DML skips some ORM/callback behaviors; update version/audit/counter columns with a clear design.
- A long-open cursor holds the session, the snapshot and DB resources; close ResultSet/statement with try-with-resources and set timeouts.
- {{COMMIT}} inside a loop that is fetching from a cursor (fetch across commit) increases the risk of ORA-01555 snapshot too old: the cursor still needs old undo to read consistently, while the commit lets Oracle reuse that undo. Long jobs should be split by key ranges, opening a new cursor for each range.

### Common mistakes
- **Leaving the default fetch size of 10** when reading a large report from Oracle: symptom — the query takes only 2s on the DB but Java takes 1 minute. Avoid: {{jdbcTemplate.setFetchSize(500)}} or {{hibernate.jdbc.fetch_size}}, or the driver's {{defaultRowPrefetch}}.
- **Carrying the habit over to PostgreSQL**: the PostgreSQL driver only uses a server-side cursor (batch fetching) when **autocommit is off** and a fetch size is set; otherwise it loads the whole result into memory. Avoid: read inside {{@Transactional}} and set the fetch size.
- **Committing per batch without a checkpoint**: the job dies at batch 600/1000, and re-running reprocesses the first 600 batches. Avoid: store the "last processed key" after each batch and design idempotent writes (MERGE instead of INSERT).
- **Keeping a cursor open for long on a heavily modified table**: Oracle raises ORA-01555 "snapshot too old" because the old undo has been overwritten. Avoid: shorten the read time, split by key ranges, and raise undo retention carefully.

### 1-minute interview answer
"I choose based on whether the data has to reach Java. If Java must process it or push it to another system, I read the REF CURSOR as a stream with a fetch size of a few hundred rows — Oracle's default is only 10, which wastes round-trips — and process it batch by batch so the heap does not grow. If it is only transformed inside the DB, I let PL/SQL do it with BULK COLLECT with a LIMIT and FORALL, reducing context switches while keeping PGA memory bounded. The biggest trade-off is the commit boundary: commit per batch is lighter but changes atomic semantics, so I need a checkpoint and idempotent writes to resume. Experience: just raising the fetch size from 10 to 500 once cut a job from several minutes to a few seconds."

> Senior tip: measure rows/sec, PGA/heap, round-trips and lock time on a representative batch; increase LIMIT/fetch size only when the measurements show round-trips are the bottleneck.`,
    follow: [
      'Why is BULK COLLECT with LIMIT better than collecting everything?',
      'How does chunk-based commit affect rerunnability?'
    ]
  },
  'db-028': {
    q: 'An Oracle table needs an auto-generated primary key and must be deployed on both Oracle and PostgreSQL. How do you choose between sequence and identity, especially for batch inserts and ID ordering?',
    a: `**Summary:** A sequence is an independent object that hands out values before insert and is flexible for multiple tables; identity binds a generator to a column and is simpler for one table. Sequences/identity usually have gaps on rollback, cache or restart; IDs are not business sequence numbers and do not guarantee commit order.

### Quick understanding
A sequence is like **the ticket machine in a bank lobby**: anyone who needs one can take a number, several counters (several tables) can share it, and you hold the number **before** you reach the counter. Identity is like **a ticket machine bolted to each counter**: convenient, nothing extra to manage, but you only learn your number when you reach the counter (insert). Both can **skip numbers**: a customer takes a ticket and leaves (rollback), or the machine pre-prints a block of tickets and the power fails (cache) — which is why ticket numbers must never be used as continuous invoice numbers.

### Terminology
- **Sequence**: an object that generates increasing numbers, independent of transactions.
- **Identity column**: a column that generates its value on insert ({{GENERATED ... AS IDENTITY}}); Oracle 12c+ and PostgreSQL 10+ both have it, and underneath it is still a sequence.
- **GENERATED ALWAYS / BY DEFAULT**: always generated (manual values forbidden) / generated only when no value is supplied.
- **CACHE**: how many sequence values are pre-allocated in memory; Oracle defaults to 20.
- **Gap**: a hole in the id range caused by a rollback, a discarded cache, or a restart.
- **allocationSize / pooled optimizer**: Hibernate calls the sequence once and then hands out a range of ids from memory itself.
- **JDBC batching**: grouping many INSERT statements into one round-trip.
- **getGeneratedKeys / RETURNING**: ways to fetch the id value just generated after an insert.

### Inserting 10,000 records with Hibernate, step by step
~~~text
GenerationType.IDENTITY:
  persist #1 -> INSERT immediately (the id is needed) -> getGeneratedKeys -> ... x10,000
  => 10,000 round-trips, and Hibernate disables JDBC insert batching
GenerationType.SEQUENCE (allocationSize = 50, INCREMENT BY 50):
  persist #1  -> SELECT nextval -> 1   (range 1..50 allocated in RAM)
  persist #51 -> SELECT nextval -> 51  (range 51..100 allocated)
  flush       -> INSERTs grouped in batches of 50 (hibernate.jdbc.batch_size = 50)
  => 200 sequence calls + 200 batches, many times faster
~~~
1. **Decide whether the id must exist before or after the insert.** Why: Hibernate needs the id as soon as {{persist}} is called to put the entity into the persistence context; identity forces an immediate insert to learn it.
2. **With a sequence, set allocationSize = INCREMENT BY.** Why: Hibernate computes id ranges from that assumption; a mismatch causes duplicate ids or a startup failure (Hibernate 6 checks it).
3. **Enable {{hibernate.jdbc.batch_size}} and {{order_inserts}}.** Why: batching only pays off when ids are already available.
4. **Accept gaps and do not use ids for business purposes.** Why: sequences do not take part in transactions (a rollback does not return the number) and the cache is discarded on restart/failover; continuous document numbers need their own mechanism (a counter table with row locking, accepting lower throughput).
5. **Write migrations per dialect** for sequence/identity DDL. Why: the syntax and the implicit sequence names differ between Oracle and PostgreSQL.

### How it works
Oracle supports identity columns and sequences; PostgreSQL identity is also based on a sequence. A sequence hands out numbers independently of transactions, so a rollback does not return a number already taken. Caching raises throughput but can create gaps after a failure. With a sequence the application can get the ID before inserting; identity is usually obtained through generated keys/returning, depending on the driver.

~~~sql
-- Oracle: use an explicit sequence when you need compatibility / multiple consumers
CREATE SEQUENCE payment_seq CACHE 100;
INSERT INTO payment(id, amount) VALUES (payment_seq.NEXTVAL, :amount);

-- PostgreSQL: identity for a technical key tied to one column
CREATE TABLE payment (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  amount numeric(19,2) NOT NULL
);
~~~

### Trade-off
| Criteria | Sequence | Identity |
|---|---|---|
| Shared across tables | Yes | Not directly |
| Get the id before insert | Convenient | Usually obtained at insert |
| DDL simplicity | An extra object | Bound to the column |
| Portability | Syntax/config differ per DB | Syntax differs per DB, meaning is similar |

### During migration
- Do not assume the sequence name, generated-key retrieval or DDL syntax are identical. Use separate migrations per dialect and test with the real driver.
- JPA {{GenerationType.IDENTITY}} may force Hibernate to insert early to get the id, which affects batching; sequence generators allow pre-allocation and are more batch-friendly depending on the dialect.
- Do not expose ids to infer transaction timing; use an appropriate timestamp or a separate business sequence if order is truly required.

### Production pitfalls
- Gaps are not proof of lost transactions. Do not use ids as continuous invoice numbers when legal/business numbering requires its own scheme.
- A large sequence cache improves performance, but a restart/failover may skip the cached range; do not lower the cache just because you see gaps.
- Bulk import: the ORM's allocation size must match the sequence increment.

### Common mistakes
- **Importing data with ids already set and forgetting to advance the sequence**: new inserts fail with a primary key conflict. Symptom — "duplicate key value violates unique constraint" right after the migration. Avoid: PostgreSQL {{SELECT setval('payment_id_seq', (SELECT max(id) FROM payment))}}; Oracle (identity column) {{ALTER TABLE ... MODIFY id GENERATED ... AS IDENTITY (START WITH LIMIT VALUE)}} or recreate the sequence with a higher START WITH.
- **Using IDENTITY and then wondering why batch inserts are slow**: Hibernate silently disables batching. Avoid: use SEQUENCE for write-heavy tables.
- **Sorting "by creation time" using the id**: on Oracle RAC with sequence NOORDER, or when a transaction with a smaller id commits after a larger one, the order is wrong. Avoid: a separate {{created_at}} column; consumers that read by id (polling "id > last_id") can miss rows that commit late.

### 1-minute interview answer
"A sequence is an independent object that hands out numbers before insert and can be shared across tables; identity binds a generator to a column, which is tidier but only reveals the id after the insert — and both are sequences underneath. With JPA I choose SEQUENCE with allocationSize equal to INCREMENT BY for write-heavy tables, because Hibernate allocates ids in memory and keeps JDBC batching; IDENTITY forces a row-by-row insert and disables batching. Both have gaps from rollback, cache and restart, and neither guarantees commit order, so an id is only a technical identifier. When running on both Oracle and PostgreSQL, I write migrations per dialect and test real batch inserts. Experience: continuous invoice numbers must always be a separate business mechanism with auditing."

> Senior tip: the primary key is a technical identifier. Design customer reference numbers separately, with a unique constraint and an audited allocation process.`,
    follow: [
      'Why does a rollback cause sequence gaps?',
      'How does IDENTITY affect JDBC batching and Hibernate?'
    ]
  },
  'db-029': {
    q: 'An Oracle query slows down after the data grows sharply. How do you read the execution plan and evaluate optimizer hints before rewriting SQL or adding an index?',
    a: `**Summary:** Start from the actual plan, the bind values and the statistics: compare estimated rows with actual rows, the access path, join order, predicates and I/O. A hint is conditional guidance, not a replacement for data modeling or statistics; forcing a plan may cure one bind but slow down the others.

### Quick understanding
Oracle's optimizer is like **a delivery planner working from statistics** about the roads. When the data grows a lot but the statistics are still last year's, it thinks "this customer only has 10 transactions" and picks the route meant for small orders — while the reality is 2 million transactions. A **hint** is like writing "must take road X" on the dispatch sheet: it may save today's trip, but if road X is jammed tomorrow the truck still has to take it. So before forcing anything, fix the **inputs** (statistics, SQL, indexes) so the planner chooses correctly on its own.

### Terminology
- **SQL_ID / child cursor**: the identifier of a SQL statement in the shared pool / the plan variants of the same statement.
- **Estimated vs actual rows (E-Rows / A-Rows)**: the rows the optimizer predicts / the rows actually produced at runtime.
- **DBMS_XPLAN.DISPLAY_CURSOR**: shows the real plan of a cursor in memory; with {{'ALLSTATS LAST'}} it also shows execution statistics.
- **Histogram**: statistics on the distribution of a column's values, which help when the data is skewed.
- **Bind peeking**: the optimizer looks at the bind value of the first parse to choose a plan, then reuses that plan.
- **Adaptive cursor sharing**: Oracle 11g+ detects that different binds need different plans and creates extra child cursors.
- **Hint**: a {{/*+ ... */}} comment in the SQL that guides the optimizer (INDEX, LEADING, USE_HASH...).
- **SQL Plan Baseline**: Oracle's SPM mechanism that stores accepted plans to prevent plan regressions.

### Diagnosing a slow query, step by step
~~~text
SELECT /*+ gather_plan_statistics */ ... ;     -- run with the real bind value
SELECT * FROM table(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));
| Id | Operation                    | Name        | E-Rows | A-Rows | Buffers |
|  1 |  NESTED LOOPS                |             |     12 |  1.8M  |  4.2M   |
|  2 |   INDEX RANGE SCAN           | TXN_ACC_IDX |     12 |  1.8M  |  9.1K   |
|  3 |   TABLE ACCESS BY INDEX ROWID| TXN         |      1 |      1 |  4.1M   |
=> E-Rows 12 vs A-Rows 1.8 million: stale statistics or a missing histogram on account_id
~~~
1. **Get the exact SQL and the real bind values** (from AWR/ASH or {{V$SQL}}). Why: the plan depends on the bind; testing with a "nice" value will not reproduce the problem.
2. **Look at the actual plan, not EXPLAIN PLAN.** Why: EXPLAIN PLAN does not see bind peeking and may differ from the plan actually running.
3. **Find the line where E-Rows diverges most from A-Rows** — that is usually the root. In the example, 1.8 million TABLE ACCESS BY ROWID calls cost 4.1 million buffers.
4. **Fix the inputs first**: {{DBMS_STATS.GATHER_TABLE_STATS}} (with a histogram for skewed columns), rewrite predicates to be sargable, consider a composite index {{(account_id, booked_at)}} to reduce the rows fetched.
5. **Only when the optimizer still chooses wrongly in a stable way** should you use a hint — or better, a SQL Plan Baseline — documenting the reason and how to remove it. Why: a baseline is managed outside the code and can be dropped without a deployment.

### Process
1. Collect the SQL, binds, elapsed/CPU, logical reads and actual row counts; confirm the same SQL_ID/cursor.
2. View the actual plan (e.g. DBMS_XPLAN.DISPLAY_CURSOR with the appropriate statistics), not just an estimated explain plan.
3. Find where estimated rows diverge from actual, unreasonable full scans, implicit conversions, cardinality explosions in joins, sort/hash spills.
4. Check statistics/histograms, skew distribution, index leading columns, partition pruning; try fixes and measure on representative data.

### Hints and indexes
| Measure | Useful when | Risk |
|---|---|---|
| Update statistics | Estimates are stale/wrong | New stats may change the plan; observe |
| Index | Selective predicate, repeated access | Storage cost and slower writes |
| Hint | Evidence the optimizer is consistently wrong | Tied to version/data/binds, hard to maintain |
| SQL rewrite | An expression hides the column / hard-to-optimize logic | Must preserve semantics |

~~~sql
-- Avoid a function on the column when you want the regular index to be used
SELECT id, amount FROM txn
WHERE account_id = :account_id
  AND booked_at >= :from_ts AND booked_at < :to_ts;
-- Only consider a function-based index if the expression is a stable requirement
~~~

### Production pitfalls
- Bind peeking/adaptive cursor sharing can make one plan suboptimal for other bind values; test with several accounts of different cardinality.
- Hints can be ignored or interpreted differently by version; record the reason, the plan baseline/regression monitoring, and how to remove it.
- Do not create an index based on a single query; consider write rate, locking, storage and the overall workload.

### Common mistakes
- **Adding an {{INDEX}} hint to the code as a "quick fix"**: it runs fine for a small customer and is extremely slow for one with millions of transactions. Avoid: test binds of different cardinality; prefer correct statistics.
- **Gathering statistics during peak hours without monitoring**: the plans of many SQL statements change at once. Symptom — many queries suddenly slow "for no reason" right after the stats job. Avoid: compare plan hashes before/after, keep SQL Plan Baselines for important statements, and run stats off-peak.
- **A wrong alias in a hint** (a table alias was renamed but the hint was not): Oracle **silently ignores** invalid hints. Avoid: check the "Hint Report" section of DBMS_XPLAN (Oracle 19c+) to see whether the hint was used.

### 1-minute interview answer
"I start from the actual plan of the exact SQL_ID with the real bind value, using DBMS_XPLAN.DISPLAY_CURSOR with ALLSTATS LAST, not EXPLAIN PLAN because it may differ from the running plan. I find the node with the biggest E-Rows vs A-Rows gap and look at the access path, join order and buffers. After data grows sharply the cause is usually stale statistics or a missing histogram on a skewed column, bind peeking, or a predicate that is not sargable. I fix the inputs first: gather stats, rewrite the SQL, choose a suitable composite index. A hint or SQL Plan Baseline is the last resort, only with evidence the optimizer is consistently wrong, because a hint binds tightly to data and version. Experience: I always keep plan hash, buffer gets and p95 before and after to prove the improvement."

> Senior tip: save the plan hash, buffer gets and p95 before/after; the goal is to reduce DB work for the real workload, not to make the plan look pretty.`,
    follow: [
      'What do wrong estimated rows usually indicate?',
      'When is a function-based index worth using?'
    ]
  },
  'db-030': {
    q: 'Migrate a banking application from Oracle to PostgreSQL while it must keep running in parallel with reconciliation. How do you plan the handling of SQL differences, transactions and data?',
    a: `**Summary:** Do not treat the migration as changing the JDBC URL. Build an inventory of schema, SQL, procedures, sequences, data types, isolation and workload; migrate with expand/contract, backfill with checkpoints, CDC or controlled dual-read, then reconcile before cutover and keep a rollback path.

### Quick understanding
Moving a banking system from Oracle to PostgreSQL is like **moving an entire supermarket to a new building without ever closing**. You cannot haul everything in one night: you set up shelves in the new building, move goods gradually (backfill), and every new delivery must be written in both places or copied over automatically (CDC), then you **take inventory and reconcile** each shelf. Only when the numbers match down to the last cent do you open the new building to a small group of customers first (canary) — and you keep the old building running so you can go back if something breaks (rollback).

### Terminology
- **Inventory**: the complete list of everything that must be moved (tables, native SQL, procedures, jobs, data types).
- **CDC (Change Data Capture)**: reading Oracle's redo log (e.g. Debezium with LogMiner, GoldenGate) to copy changes to the new system near real time.
- **Dual-write**: the application writes to both DBs; it is not atomic, so you need a way to detect divergence.
- **Backfill**: copying historical data to the new system in batches with checkpoints.
- **Reconciliation**: matching the two sides by key, total amount and hashes.
- **Canary / cohort**: moving a small group of users/business functions first to validate.
- **Cutover**: the moment the source of truth moves to the new system.
- **Ledger invariant**: a rule the ledger must always satisfy, e.g. total debits = total credits for each entry.

### Plan by phase
~~~text
Phase 0: Inventory + translate SQL/PLSQL + equivalence tests   (Oracle is the source of truth)
Phase 1: Backfill history -> PostgreSQL; CDC copies new changes (lag < 5s)
Phase 2: Shadow read: read both, compare results, log mismatches (users still see Oracle)
Phase 3: Daily reconciliation: count, sum(amount) per day/currency/status, row hashes
Phase 4: Canary 1% -> 10% -> 50% -> 100% of write traffic to PostgreSQL
         reverse CDC PostgreSQL -> Oracle to keep the rollback path
Phase 5: Rollback window over -> shut Oracle down (contract)
~~~
1. **Inventory and translate**: scan the code for {{NVL}}, {{DECODE}}, {{ROWNUM}}, {{SYSDATE}}, {{CONNECT BY}}, {{MERGE}}, Oracle-style outer joins {{(+)}} and package calls. Why: these are what break on PostgreSQL (most have equivalents: {{coalesce}}, {{CASE}}, {{LIMIT}}, {{now()}}, {{WITH RECURSIVE}}, {{INSERT ... ON CONFLICT}} or {{MERGE}} since PostgreSQL 15).
2. **Exactly one source of truth at any moment.** Why: if two DBs accept writes independently there is no way to resolve conflicts automatically.
3. **Reconcile by key, not just totals.** Why: two errors of +100 and −100 leave the total correct.
4. **Switch by cohort with explicit stop criteria** (lag, error rate, mismatch = 0). Why: it keeps the risk inside a small group.
5. **Keep the way back** by replicating in reverse during the rollback window. Why: after cutover, new data exists only in PostgreSQL, and going back to Oracle without it loses transactions.

### Differences to inventory
| Area | Example risk | Verification method |
|---|---|---|
| SQL | {{NVL}}/{{DECODE}}, {{ROWNUM}}, packages, hints | Static scan + result test |
| Data types | NUMBER, DATE/TIMESTAMP, empty string/NULL | Mapping and boundary tests |
| ID generation | sequence/identity, allocation | Concurrency and batch tests |
| Transaction | isolation, locking, deadlock handling | Contract tests under load |
| Search/sort | collation, case, timezone | Real character/date dataset |

### Migration strategy
1. Split the workload by bounded context; define the authoritative data source at each stage.
2. Create the new schema, backfill by stable keys with checkpoints; capture changes via CDC/outbox or dual-write with divergence detection.
3. Compare counts, totals per partition, hashes/canonical rows and the ledger invariants. Every mismatch needs a processing queue, not just a summary report.
4. Canary reads/writes by cohort; cutover requires criteria for lag, error rate, reconciliation and the rollback window.

### Production pitfalls
- Oracle treats the empty string {{''}} as NULL for VARCHAR2/CHAR, while PostgreSQL distinguishes {{''}} and NULL, so {{WHERE col IS NULL}} and unique constraints behave differently. Check the data and the predicates.
- Sequence values do not mean committed records; the CDC order, retries and snapshot timing must be designed.
- A single total checksum can hide two offsetting errors; reconcile by key, date, currency and status.
- Do not let two DBs write independently without conflict rules; dual-write is not atomic across two systems.

### Common mistakes
- **Mapping {{NUMBER}} without precision to {{double precision}}**: amounts drift by a few cents across millions of rows. Avoid: map to {{numeric(p,s)}} that fits the business, and compare totals per day/currency.
- **Oracle {{DATE}} includes hours/minutes/seconds** but is mapped to PostgreSQL {{date}}: the time part is lost and reconciliation is off by a day. Avoid: map to {{timestamp}} (or {{timestamptz}} once the source timezone is established).
- **Different collations change sort order and string comparison**: a "top customers by name" report comes out in a different order and keyset pagination breaks. Avoid: pick an explicit collation (e.g. ICU or {{C}}) and test with Vietnamese text containing diacritics.

### 1-minute interview answer
"I do not treat this as changing the JDBC URL. The first step is an inventory: schema, native SQL, PL/SQL, sequences, data types, isolation and workload, then translation and equivalence tests. After that I backfill historical data with checkpoints, use CDC to copy new changes, run shadow reads to compare both sides, and reconcile daily by key, totals per day and currency, and the ledger invariants. Cutover is by cohort, each step with criteria for lag, error rate and zero mismatches, plus reverse replication to keep a rollback path. The hard rule is that there is exactly one source of truth at any moment. Experience: the most expensive bugs are usually empty strings becoming NULL, DATE carrying a time part, and NUMBER losing precision, so I test those boundary cases early."

> Senior tip: for a ledger, cut over only after debit/credit balance and per-partition/per-day reconciliation; set the mismatch threshold to zero for core financial data.`,
    follow: [
      'How do you handle the difference between empty string and NULL?',
      'How can dual-write avoid creating two sources of truth?'
    ]
  }
});
