/*
 * English translation of js/data/q-sql.js — task T378. Format: js/core/i18n.js (content overlay).
 * ids: sql-023 sql-024 sql-025 sql-026 sql-027 sql-028
 */
App.i18n.content({
  'sql-023': {
    q: 'Given the {{customer}} and {{orders}} tables (one-to-many relationship). How would you explain INNER JOIN, LEFT JOIN, FULL JOIN, and CROSS JOIN using specific data examples? Why does the report "total order amount and total payment amount per customer" double when joining an additional {{payment}} table, and how would you fix it?',
    a: `**Summary:** JOINs combine rows from two tables based on a condition in the {{ON}} clause. INNER JOIN only keeps matched rows; LEFT JOIN keeps **all** rows from the left table, padding right-side mismatches with NULL; FULL JOIN keeps everything from both sides; CROSS JOIN pairs every row with every row. The report doubles because joining two one-to-many tables simultaneously causes **fan-out** (cartesian product effect): 2 orders * 3 payments = 6 rows, causing SUM to overcount. Solution: **aggregate (group) each one-to-many table separately before joining**.

### Quick Understanding
Think of two paper lists: customers and orders. JOINing is **pinning** each order sheet to the correct customer sheet.
- INNER JOIN: Keeps only customer sheets **that have pins** (orders).
- LEFT JOIN: Keeps **all** customer sheets; those without orders get a blank sheet (NULL) pinned to them.
- CROSS JOIN: Pins **every** order to **every** customer, even if unrelated (usually a mistake, unless generating combinations like "every store * every day").

### Terminology
- **Join condition (ON)**: The rule deciding if two rows "match", e.g., {{o.customer_id = c.id}}.
- **One-to-many relationship (1-n)**: A customer has many orders; joining from the "1" side to the "n" side multiplies the rows of the "1" side.
- **Fan-out**: When the result row count exceeds the actual entity count.
- **Anti-join**: Finding rows **without** a match, e.g., using LEFT JOIN ... WHERE right_table.id IS NULL or NOT EXISTS.

### Data Example and Result
~~~text
customer            orders
id | name           id | customer_id | amount
1  | An             10 | 1           | 100
2  | Bình           11 | 1           | 50
3  | Chi            12 | 9           | 70    <- customer 9 does not exist
~~~

| Join Type | Result Rows | Explanation |
|---|---|---|
| INNER | (An,10), (An,11) | matched pairs only; Bình, Chi, order 12 excluded |
| LEFT (customer on left) | (An,10), (An,11), (Bình,NULL), (Chi,NULL) | keeps all customers |
| RIGHT | (An,10), (An,11), (NULL,12) | keeps all orders; rarely used, usually rewritten as LEFT |
| FULL | 5 rows: both unmatched customers and orphaned orders | used for reconciliation |
| CROSS | 3 * 3 = 9 rows | no ON condition |

### Mechanism of Fan-out (Step-by-step)
Table {{payment}}: An paid 3 times (40, 40, 70). Incorrect query:
~~~sql
SELECT c.name, SUM(o.amount) AS total_order, SUM(p.amount) AS total_paid
FROM customer c
JOIN orders  o ON o.customer_id = c.id
JOIN payment p ON p.customer_id = c.id     -- joining second one-to-many table
GROUP BY c.name;
-- An: total_order = 450 (actual 150), total_paid = 300 (actual 150)
~~~
1. Join An with orders → 2 rows (orders 10, 11).
2. Each of those joins with 3 payments → 2 * 3 = **6 rows**.
3. SUM(o.amount) adds each order 3 times: (100 + 50) * 3 = 450. SUM(p.amount) adds each payment 2 times: 150 * 2 = 300.
4. Why no error: SQL is syntactically valid; only the data is duplicated. This is the most dangerous "silent" error.

### Fix: Aggregate first, JOIN later
~~~sql
WITH o AS (SELECT customer_id, SUM(amount) AS total_order
           FROM orders GROUP BY customer_id),          -- 1 row per customer
     p AS (SELECT customer_id, SUM(amount) AS total_paid
           FROM payment GROUP BY customer_id)          -- 1 row per customer
SELECT c.name,
       COALESCE(o.total_order, 0) AS total_order,      -- customer without orders → 0
       COALESCE(p.total_paid, 0)  AS total_paid
FROM customer c
LEFT JOIN o ON o.customer_id = c.id
LEFT JOIN p ON p.customer_id = c.id;
~~~
Each CTE returns at most **one row per customer**, so the 1-1 JOIN eliminates fan-out. CTEs can be replaced by correlated subqueries in SELECT if only needed for a few customers.

### Common Pitfalls
1. **Filtering the right table in WHERE after LEFT JOIN**. Symptom: {{LEFT JOIN orders o ON ... WHERE o.status = 'PAID'}} removes customers without orders, converting LEFT to INNER (because NULL = 'PAID' is false). Fix: move conditions to the {{ON}} clause: {{ON o.customer_id = c.id AND o.status = 'PAID'}}.
2. **Joining two one-to-many tables simultaneously and SUM/COUNT**. Symptom: numbers multiplied by N, only visible when reconciled against accounting records. Fix: aggregate first, JOIN later; or test with customers having multiple rows in both tables.
3. **Patching with DISTINCT or SUM(DISTINCT)**. Symptom: two orders for 50k are counted as one. Fix: don't use DISTINCT to mask fan-out.
4. **Creating CROSS JOIN accidentally by omitting ON** (legacy comma syntax {{FROM a, b}}). Symptom: query runs very slowly, returning millions of rows. Fix: always write explicit {{JOIN ... ON}}.
5. **MySQL lacks FULL JOIN**. Fix: use LEFT JOIN UNION ALL the portion only present in the right table.

### 1-Minute Interview Answer
"INNER JOIN keeps matched pairs, LEFT JOIN keeps all left-side rows padding with NULLs, FULL keeps both, CROSS pairs everything. My most frequent error to fix is fan-out: joining a customer with two one-to-many tables like orders and payments makes the row counts multiply, so SUMs are inflated. I fix this by aggregating each one-to-many table by customer_id in a CTE first, then LEFT JOINING to the customer table, using COALESCE to default to 0. Another trap is putting right-side table filters in the WHERE clause after a LEFT JOIN, which turns it into an INNER JOIN; those must go into the ON clause."

> Senior tip: when reviewing a financial report, I always ask "what does each result row represent?" (grain) then run {{COUNT(*)}} before and after every JOIN. If the row count increases but the grain remains the same, you have fan-out. This 30-second habit catches most report errors that unit tests miss.`,
    follow: [
      'Why does putting right-side filters in WHERE turn a LEFT JOIN into an INNER JOIN?',
      'When do you actually need a CROSS JOIN in reporting?',
      'How do you simulate FULL OUTER JOIN on MySQL?'
    ]
  },
  'sql-024': {
    q: 'Your Java code checks if an "email already exists" before INSERTing, but production still has duplicate accounts, and there are orphaned orders pointing to deleted customers. Why is application-level checking insufficient? How do you use PRIMARY KEY, UNIQUE, FOREIGN KEY, CHECK, and NOT NULL to let the database protect your data?',
    a: `**Summary:** Application-level "read-then-write" checking has a **time gap**: two requests concurrently read "does not exist", both INSERT, resulting in duplicates. Database constraints are checked **at the moment of writing, with locking**, making them impossible to bypass regardless of instance count or manual script execution. Rule: enforce immutable data rules (uniqueness, references, domain values) in the DB; use Java to check beforehand for friendly errors and **catch DB exceptions**.

### Quick Understanding
Checking in Java is like a receptionist **looking at a ledger** to see if Room 12 is vacant before handing over the key. Two receptionists looking at the ledger simultaneously both see it's vacant, both hand out keys: two guests for one room. Constraints are like the **room door's lock**: only one key fits, anyone coming later is rejected, independent of how careful the receptionist is.

### Terminology
- **PRIMARY KEY**: Unique identifier for a row, implicitly UNIQUE + NOT NULL, indexed.
- **UNIQUE**: Prevents duplicate values in a column (or set of columns); DB creates a unique index for fast checking.
- **FOREIGN KEY (FK)**: Column value must exist in the parent table; prevents "orphaned orders".
- **CHECK**: Expression must be true for every row, e.g., {{amount > 0}}.
- **Race condition**: Incorrect result due to concurrent processes interleaving at just the right moment.

### Why Check-then-Insert fails: step-by-step
~~~text
Time     Request A (pod 1)                 Request B (pod 2)
t1       SELECT ... WHERE email='a@x' → 0
t2                                         SELECT ... WHERE email='a@x' → 0
t3       INSERT email='a@x'  (ok)
t4                                         INSERT email='a@x'  (ok!)  → DUPLICATE
~~~
Even with {{@Transactional}}, in the default READ COMMITTED mode, neither sees the other's uncommitted row, so duplicates occur. With UNIQUE, at t4, the DB detects the key already exists (or waits for A to commit then checks), and B receives a {{duplicate key value violates unique constraint}} error (PostgreSQL, SQLSTATE 23505).

### Defining Constraints
~~~sql
CREATE TABLE customer (
  id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email  VARCHAR(255) NOT NULL,
  status VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
         CHECK (status IN ('ACTIVE', 'LOCKED', 'CLOSED')),
  CONSTRAINT uq_customer_email UNIQUE (email)     -- named for readable logs
);
CREATE TABLE orders (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0)
);
CREATE INDEX idx_orders_customer ON orders(customer_id);  -- PostgreSQL does NOT auto-create
~~~

### Choosing ON DELETE behavior
| Option | When customer deleted | Used for |
|---|---|---|
| RESTRICT / NO ACTION (default) | error if orders exist | financial data, never delete chains |
| CASCADE | deletes orders too | data childless without parent (e.g., cart items) |
| SET NULL | sets customer_id = NULL | optional relationships |

### Catching errors in Spring
~~~java
try {
    customerRepository.saveAndFlush(c);           // flush to force error immediately
} catch (DataIntegrityViolationException e) {     // Spring translates 23505 to this
    throw new EmailAlreadyUsedException(c.getEmail());  // return 409 to client
}
~~~
Checking beforehand in Java is still good for friendly UI errors; UNIQUE is the **safety net** for race conditions.

### Common Pitfalls
1. **Not indexing FK columns in PostgreSQL**. Symptom: deleting a customer takes seconds because the DB scans the entire orders table; JOINs on customer_id are slow. Fix: create index on FK columns (MySQL InnoDB auto-creates, PostgreSQL does not).
2. **Case-insensitive email duplicates** ({{An@x.com}} vs {{an@x.com}}). Fix: normalize to lowercase before saving, or use unique index on {{lower(email)}}.
3. **UNIQUE allowing multiple NULLs**. Symptom: tax_code is UNIQUE but has multiple NULL rows. This is standard; if you want to block this, add NOT NULL or (PostgreSQL 15+) use {{UNIQUE NULLS NOT DISTINCT}}.
4. **Adding FK to a large existing table**. Symptom: table lock for a long time to check all old data. Fix (PostgreSQL): {{ADD CONSTRAINT ... NOT VALID}} then {{VALIDATE CONSTRAINT}} separately, the latter doesn't require a heavy lock.
5. **Believing CHECK runs on old MySQL**. MySQL before 8.0.16 parses CHECK syntax but ignores it; check your version.

### 1-Minute Interview Answer
"Application-level check-then-insert has a race condition: two concurrent requests can both read "does not exist" then both insert, creating duplicates. Only the database can check at the exact moment of writing, with locking, so I use UNIQUE for email, FOREIGN KEY for relationships, CHECK for domain values, and NOT NULL for mandatory columns. I still check in Java for friendly UI errors, but I always catch DataIntegrityViolationException and return 409. In PostgreSQL, I remember to index FK columns as they aren't auto-indexed, and I choose ON DELETE RESTRICT for financial data."

> Senior tip: constraints are "unit tests that run forever in production": they block even manual DBA fixes, import jobs, and other services sharing the DB. In projects I review, almost every instance of corrupt data (duplicates, orphans, negative numbers) can be traced to a table missing a constraint because "we already checked in the code".`,
    follow: [
      'Why does {{@Transactional}} in READ COMMITTED not prevent duplicate inserts?',
      'When do you choose ON DELETE CASCADE vs RESTRICT?',
      'What do you do if you need to add UNIQUE to a table that already has duplicate data?'
    ]
  },
  'sql-025': {
    q: 'You are designing a transaction table for an e-wallet. What type should the amount column be, and why avoid FLOAT/DOUBLE? For time, should it be {{timestamp}} or {{timestamptz}} (PostgreSQL), {{DATETIME}} or {{TIMESTAMP}} (MySQL), and how do you map it to Java types?',
    a: `**Summary:** For money, use {{NUMERIC(p,s)}}/{{DECIMAL(p,s)}} (exact decimal) and {{BigDecimal}} in Java; FLOAT/DOUBLE use binary approximation, so 0.1 + 0.2 doesn't equal 0.3. For event occurrence times (transactions, logins), use {{timestamptz}} in PostgreSQL, mapped to {{Instant}}/{{OffsetDateTime}}; {{timestamp}} (without TZ) is only for "clock on the wall" times like store opening hours. In MySQL, {{TIMESTAMP}} auto-adjusts by timezone but is limited to year 2038, {{DATETIME}} does not adjust: prefer DATETIME and adopt a convention to always store UTC.

### Quick Understanding
- FLOAT is like **a cheap kitchen scale**: fine for veggies, but bank balances over millions of operations will accumulate tiny rounding errors.
- NUMERIC is like **counting money by hand**: each cent is exact, slightly slower but never off by a cent.
- {{timestamptz}} is like recording **"3:00 UTC"**: everyone in any timezone knows exactly what that means. {{timestamp}} is like recording **"10:00"**: people in Hanoi and London think it's two different times.

### Terminology
- **Precision (p)**: total digits; **scale (s)**: digits after decimal. {{NUMERIC(19,4)}} holds max 15 digits before, 4 digits after.
- **Floating point (IEEE 754)**: binary representation with mantissa and exponent; many decimals (0.1) can't be represented exactly.
- **UTC**: international standard time, no daylight saving.
- **Session time zone**: connection timezone used by the DB for display and conversion.

### Why FLOAT is wrong for money
~~~sql
SELECT 0.1::float8 + 0.2::float8 = 0.3::float8;   -- false (0.30000000000000004)
SELECT 0.1::numeric + 0.2::numeric = 0.3;         -- true
~~~
1. 0.1 in binary is a repeating infinite fraction (like 1/3 = 0.333... in decimal).
2. DOUBLE keeps 53 bits, so it rounds, error is about 1e-17.
3. Over millions of transactions, equality checks ({{=}}) and invoice rounding will be off by cents, causing reconciliation to fail.
NUMERIC stores **every decimal digit** exactly; operations are precise; slightly slower, but negligible for financial logic.

### timestamptz mechanism
~~~sql
SET TIME ZONE 'Asia/Ho_Chi_Minh';
INSERT INTO tx(created_at) VALUES ('2026-03-01 10:00:00+07');
-- PostgreSQL converts and stores 03:00 UTC (does NOT store "+07")
SET TIME ZONE 'UTC';
SELECT created_at FROM tx;      -- 2026-03-01 03:00:00+00, still the same moment
~~~
With a {{timestamp}} column (no TZ), the DB stores the "10:00" literally and **doesn't know** it's Vietnam time; an application server running in UTC will misinterpret it by 7 hours.

### Type Mapping Table
| Data | PostgreSQL | MySQL | Java |
|---|---|---|---|
| Money | NUMERIC(19,4) | DECIMAL(19,4) | BigDecimal |
| Event Time | timestamptz | DATETIME(6) store UTC | Instant / OffsetDateTime |
| Birthday, Effective Date | date | DATE | LocalDate |
| Daily Opening Hours | time | TIME | LocalTime |
| String | text or varchar(n) | VARCHAR(n) | String |

PostgreSQL: {{text}} and {{varchar(n)}} perform the same; {{n}} is just a length constraint. MySQL TIMESTAMP stores UTC and adjusts based on the session's {{time_zone}}, limited to 2038-01-19.

### On Java Side
~~~java
BigDecimal fee = new BigDecimal("0.1");            // use String, NEVER new BigDecimal(0.1)
BigDecimal total = amount.add(fee)
        .setScale(0, RoundingMode.HALF_UP);        // VND has no decimals: round explicitly
boolean same = a.compareTo(b) == 0;                // 2.0 and 2.00: equals() returns false!
Instant createdAt = Instant.now();                 // save to timestamptz
~~~
Set {{spring.jpa.properties.hibernate.jdbc.time_zone=UTC}} and run JVM with {{-Duser.timezone=UTC}} so all layers are consistent; only convert to local time at the UI layer.

### Common Pitfalls
1. **Using double for money in entity**. Symptom: end-of-day balance off by cents compared to the bank. Fix: NUMERIC + BigDecimal everywhere, including JSON (send as string or smallest integer unit).
2. **new BigDecimal(0.1)**. Symptom: value becomes 0.1000000000000000055511151231257827. Fix: {{new BigDecimal("0.1")}} or {{BigDecimal.valueOf(0.1)}}.
3. **Timestamp without TZ + server in different TZ**. Symptom: "transactions in day" report is off by 7 hours. Fix: timestamptz, all servers in UTC.
4. **Too small scale**. Symptom: exchange rates, interest rates lose precision. Fix: money 2-4 decimals, rates 6-8 decimals.

### 1-Minute Interview Answer
"For money, I use NUMERIC/DECIMAL with explicit precision and scale, mapped to BigDecimal in Java, because FLOAT/DOUBLE are binary approximations and will eventually cause rounding errors. In Java, I create BigDecimal from String and use compareTo for equality. For event times in PostgreSQL, I use timestamptz because it converts to UTC internally, ensuring it's valid for all timezones, mapped to Instant or OffsetDateTime. On MySQL, I prefer DATETIME and always store UTC to avoid the 2038 limit of TIMESTAMP. The whole system runs on UTC, and I only convert to the user's timezone at the UI layer."

> Senior tip: decide on money types **once for the whole company** (e.g., NUMERIC(19,4), HALF_UP rounding at invoice issuance) and record it in a guideline. Mismatched types between services (one using double, one decimal) is the root cause of reconciliation discrepancies that take days to debug.`,
    follow: [
      'Why does {{new BigDecimal(0.1)}} give strange results while {{BigDecimal.valueOf(0.1)}} does not?',
      'Does timestamptz store the client\'s original timezone? If you need to know the local time of the transaction, what else do you store?',
      'When should you store money as integers (smallest unit) instead of NUMERIC?'
    ]
  },
  'sql-026': {
    q: 'In a PostgreSQL transaction, the second INSERT fails, and all subsequent commands report {{current transaction is aborted, commands ignored until end of transaction block}}. Explain how autocommit, BEGIN/COMMIT/ROLLBACK, and SAVEPOINT work, how PostgreSQL and MySQL handle transaction errors differently, and why long-running transactions are dangerous.',
    a: `**Summary:** By default, each SQL statement is its own transaction (autocommit). {{BEGIN}} opens a multi-statement transaction, {{COMMIT}} saves permanently, {{ROLLBACK}} discards everything. PostgreSQL considers **any** error to corrupt the whole transaction: subsequent commands are rejected until a ROLLBACK (or ROLLBACK TO SAVEPOINT). MySQL InnoDB only discards the **failed statement** on most errors, and the transaction continues (except deadlock: cancels the whole transaction). Long transactions hold locks, block others, and prevent old data cleanup, so they must be kept short.

### Quick Understanding
Transaction is like **a shopping cart**: put items in (multiple SQLs), pay once (COMMIT) or discard the cart (ROLLBACK). Autocommit is like **paying for each item individually immediately**. SAVEPOINT is like **marking "from here on"**: items added after the mark can be returned without discarding the whole cart. A long transaction is like **standing at the register on a phone call**: the whole queue behind you has to wait.

### Terminology
- **Autocommit**: mode where each command auto-commits; JDBC is on by default, Spring {{@Transactional}} turns it off.
- **SAVEPOINT**: bookmark inside a transaction to rollback partially.
- **Idle in transaction**: connection is open after BEGIN but no command is running (usually because the code calls an external API).
- **MVCC**: mechanism keeping multiple row versions so readers don't block writers; old versions are cleaned only when no transaction needs them.

### Step-by-step mechanism in PostgreSQL
~~~sql
BEGIN;
INSERT INTO account(id, balance) VALUES (1, 100);   -- ok
INSERT INTO account(id, balance) VALUES (1, 200);   -- ERROR: duplicate key
SELECT * FROM account;                              -- ERROR: current transaction is aborted
COMMIT;                                             -- PostgreSQL actually performs ROLLBACK
~~~
1. Error at second statement: PostgreSQL marks the transaction as **aborted**.
2. Why block subsequent statements: DB doesn't know if the failed statement partially completed, so it chooses safety: no further actions on potentially inconsistent state.
3. COMMIT now performs ROLLBACK; the first INSERT is **also lost**.

To skip a failed statement while keeping the previous part, use SAVEPOINT:
~~~sql
BEGIN;
INSERT INTO account VALUES (1, 100);
SAVEPOINT before_dup;
INSERT INTO account VALUES (1, 200);       -- error
ROLLBACK TO SAVEPOINT before_dup;          -- back to mark, transaction alive
COMMIT;                                    -- row (1, 100) saved
~~~

### PostgreSQL vs MySQL on errors
| Situation | PostgreSQL | MySQL InnoDB |
|---|---|---|
| Duplicate key, type error | transaction aborted | statement rolled back, continues |
| Deadlock | cancels transaction | cancels transaction |
| DDL (ALTER TABLE) | rollbackable | auto-commits, not rollbackable |

MySQL consequence: catching an exception and continuing to COMMIT will save **half** the work. In Spring, unchecked exceptions escaping {{@Transactional}} trigger a rollback of both DBs, which is the safe way.

### Why long transactions are dangerous
~~~java
@Transactional
public void checkout(Long orderId) {
    Order o = orderRepo.findByIdForUpdate(orderId);  // row lock on order
    paymentClient.charge(o);                          // call external API for 5 seconds!
    o.markPaid();                                     // lock held for 5 seconds
}
~~~
- **Lock held**: other requests for the same order must wait, connection pool exhausts.
- **Blocks cleanup**: PostgreSQL cannot VACUUM old row versions that this transaction still "sees", table bloat; MySQL undo log increases.
- Fix: call external APIs **before or after** the transaction; transaction only wraps DB commands.

### Common Pitfalls
1. **Catching exception then continuing in PostgreSQL transaction**. Symptom: "current transaction is aborted" error later, masking the root cause. Fix: read the **first** error in the log; use savepoint or split transactions.
2. **HTTP/Email in {{@Transactional}}**. Symptom: many "idle in transaction" connections in {{pg_stat_activity}}. Fix: move I/O out; set {{idle_in_transaction_session_timeout}} as safety net.
3. **Forgetting COMMIT in manual DBeaver/psql** (if autocommit is off). Symptom: table locked, app hangs. Fix: always COMMIT/ROLLBACK, check {{pg_stat_activity}}.
4. **Believing ALTER TABLE in MySQL is rollbackable**. Fix: separate DDL migrations with fallback plan.

### 1-Minute Interview Answer
"By default, SQL is autocommit; BEGIN opens a transaction, COMMIT saves, ROLLBACK discards. In PostgreSQL, any error corrupts the whole transaction; subsequent commands are rejected and COMMIT defaults to ROLLBACK. To skip an error, I use SAVEPOINT. MySQL InnoDB only rolls back the failed statement, so catching an exception and committing will store partial work – in Spring, I let unchecked exceptions escape to rollback safely. I keep transactions short, no external API calls, because long transactions hold locks, exhaust the pool, and prevent PostgreSQL from cleaning old row versions."

> Senior tip: monitor "longest open transaction" metric ({{xact_start}} in {{pg_stat_activity}}). In one system I debugged, a report job held a transaction for 6 hours, causing the orders table to bloat 3x because VACUUM couldn't clean up; a 5-minute alert would have caught this immediately.`,
    follow: [
      'How does Spring {{@Transactional}} enable/disable autocommit on connections from HikariCP?',
      'When do you use SAVEPOINT (or NESTED propagation) in Java code?',
      'How do you find and handle an "idle in transaction" connection holding locks on production?'
    ]
  },
  'sql-027': {
    q: 'Your orders are split between {{orders}} (last 6 months) and {{orders_archive}} (older). You need a combined list, then find customers who "bought in both 2025 and 2026" and customers who "bought in 2025 but not yet in 2026". How do you use UNION, UNION ALL, INTERSECT, EXCEPT, how do they differ, and what pitfalls exist?',
    a: `**Summary:** Set operations combine the **result sets of two SELECTs** vertically. {{UNION ALL}} concatenates results, keeping duplicates, cheapest; {{UNION}} concatenates then **removes duplicates** (expensive sort/hash); {{INTERSECT}} keeps rows in **both** sets; {{EXCEPT}} keeps rows in the left set **but not** in the right set (Oracle calls it MINUS). Default to UNION ALL; use UNION only if dedup is strictly required.

### Quick Understanding
Think of two guest lists for two parties:
- UNION ALL: **staple two sheets** together; people attending both parties appear twice.
- UNION: staple together then **cross out duplicates**, each person once.
- INTERSECT: people **attending both** parties.
- EXCEPT: people attending party 1 but **missing** party 2.

### Terminology
- **Set operation**: Operation on result sets: UNION, INTERSECT, EXCEPT (MINUS).
- **Column compatibility**: Two SELECTs must have **the same column count** and **compatible types in order**; column names are taken from the first SELECT.
- **Dedup**: Comparing all rows' columns; DB must sort or build a hash table to do this.

### Data Example
~~~text
Buyers 2025: {An, Bình, Chi}
Buyers 2026: {Bình, Chi, Dũng}
UNION ALL  → An, Bình, Chi, Bình, Chi, Dũng   (6 rows)
UNION      → An, Bình, Chi, Dũng              (4 rows)
INTERSECT  → Bình, Chi                        (bought in both years)
2025 EXCEPT 2026 → An                         (customers who "hibernated")
~~~

### SQL Example
~~~sql
-- 1) Combined list: tables don't overlap so UNION ALL is sufficient
SELECT id, customer_id, amount, created_at FROM orders
UNION ALL
SELECT id, customer_id, amount, created_at FROM orders_archive
ORDER BY created_at DESC          -- ORDER BY applies to the WHOLE result
LIMIT 50;

-- 2) Customers bought in 2025 but not 2026
SELECT customer_id FROM all_orders
WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'
EXCEPT
SELECT customer_id FROM all_orders
WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01';
~~~
({{all_orders}} could be a view wrapping the UNION ALL above.)

### Inner Mechanism: Why UNION is slower
1. UNION ALL: runs query 1, yields rows; runs query 2, yields more. No memory, **streaming results** immediately.
2. UNION: must know which rows have appeared, so **sorts all** then drops adjacent duplicates, or builds a **hash table** of all rows. With 10 million rows, this can spill to disk and take seconds.
3. INTERSECT/EXCEPT also need sort/hash. For large sets, {{EXISTS}}/{{NOT EXISTS}} is often more flexible as it uses indexes.

### Comparison Table
| Operation | Keep Duplicates? | Cost | Use When |
|---|---|---|---|
| UNION ALL | yes | low | merging current + archive, merging multiple non-overlapping sources |
| UNION | no | sort/hash | merging sources potentially overlapping and need unique rows |
| INTERSECT | no | sort/hash | "exists in both", reconciliation |
| EXCEPT | no | sort/hash | "in A but not B", reconciliation, finding churned customers |

Supported: PostgreSQL (all); MySQL (INTERSECT/EXCEPT since 8.0.31); Oracle (MINUS).

### Common Pitfalls
1. **Using UNION by habit**. Symptom: merging two large tables is slow due to massive sort, and **legitimate rows are lost** (two orders, same customer/amount/date). Fix: default to UNION ALL.
2. **Column order mismatch**. Symptom: amount column below customer_id, no error if types match. Fix: explicitly list columns, don't use SELECT *.
3. **Putting ORDER BY/LIMIT in first branch without parens**. Symptom: syntax error or wrong ordering. Fix: apply ORDER BY to the end of the entire set; if limiting branches individually, wrap in parens: {{(SELECT ... ORDER BY ... LIMIT 10) UNION ALL (...)}}.
4. **Forgetting that set operations treat NULL as equal**. Unlike {{=}} in WHERE, UNION/EXCEPT considers two NULLs as duplicate; reconciliation results might differ when switching to JOIN.

### 1-Minute Interview Answer
"UNION, UNION ALL, INTERSECT, EXCEPT combine results vertically, requiring same column count and compatible order of types. UNION ALL simply concatenates, keeps duplicates, and is cheapest; UNION concatenates then dedups, so the DB must sort or hash everything. INTERSECT takes the common part, EXCEPT takes the part in the left set not in the right set, very useful for reconciliation or finding churned customers. I default to UNION ALL, e.g., merging orders with orders_archive, only use UNION when strict dedup is needed, and always list columns explicitly."

> Senior tip: when UNION appears in code review, I ask "can the two branches overlap?". Usually the answer is no, and switching to UNION ALL saves a large sort step. When merging archive tables, add a constant column {{'archive' AS source}} to each branch to know where a row came from; it's invaluable when investigating data issues.`,
    follow: [
      'When should you use NOT EXISTS instead of EXCEPT?',
      'Why can UNION "lose" legitimate rows?',
      'How do you get the 10 newest orders from each table then merge them?'
    ]
  },
  'sql-028': {
    q: 'Every night you receive a {{staging_price(sku, price)}} table with 2 million rows and must update prices in {{product}}, simultaneously expiring PENDING orders older than 30 days (about 5 million rows). How do you write UPDATE ... FROM / UPDATE JOIN / DELETE USING, and how to run safely on production without long table locks?',
    a: `**Summary:** Update from another table using {{UPDATE ... FROM}} (PostgreSQL) or {{UPDATE ... JOIN}} (MySQL), a set-based statement instead of Java loops per row. For safety: (1) preview with SELECT using the same conditions, (2) ensure each target row matches **at most one** source row, (3) skip unchanged rows ({{IS DISTINCT FROM}}), (4) for millions of rows, **batch** in transactions of a few thousand to avoid long locks and replication lag.

### Quick Understanding
Updating prices is like **re-labeling every item in the supermarket**. Doing it item-by-item (Java loop, back-and-forth for every item) takes all night. Doing it in one massive UPDATE (one giant query) means the store must be **closed** while labeling. The correct way: label **one aisle at a time** (batch), customers can still shop in other aisles.

### Terminology
- **Set-based**: A single SQL statement processing a set of rows; optimized by DB, fewer round-trips.
- **Row lock**: UPDATE locks each affected row until COMMIT; concurrent updates to the same row must wait.
- **Replication lag**: Replica is slower than primary because it must apply a large volume of changes.
- **WAL / binlog**: Change log recording every modification for recovery and replication.

### Syntax by DB
~~~sql
-- PostgreSQL: update price from staging, only if actually changed
UPDATE product p
SET    price = s.price, updated_at = now()
FROM   staging_price s
WHERE  p.sku = s.sku
  AND  p.price IS DISTINCT FROM s.price     -- skip unchanged (safe with NULL)
RETURNING p.id;                             -- return affected ids for audit

-- MySQL
UPDATE product p
JOIN   staging_price s ON s.sku = p.sku
SET    p.price = s.price
WHERE  NOT (p.price <=> s.price);           -- <=> is MySQL safe NULL comparison

-- Delete from another table: PostgreSQL / MySQL
DELETE FROM cart_item c USING product p WHERE c.product_id = p.id AND p.discontinued;
DELETE c FROM cart_item c JOIN product p ON p.id = c.product_id WHERE p.discontinued;
~~~
Why {{IS DISTINCT FROM}}: PostgreSQL writes a **new row version** for every UPDATE, even if values are identical. Skipping 1.9 million unchanged rows saves WAL, reduces bloat, and is much faster.

### Trap: one target row matches multiple source rows
If staging has 2 rows with same sku (price 100 and 120), PostgreSQL uses **one** of them and documentation clearly states **it is unpredictable** which one. No error is reported. Before running:
~~~sql
SELECT sku, COUNT(*) FROM staging_price GROUP BY sku HAVING COUNT(*) > 1;  -- must be empty
~~~
Better: add UNIQUE(sku) to the staging table so the error pops immediately upon file load.

### Batching for 5 million rows
~~~sql
-- Repeat until affected rows = 0, each a short transaction
WITH batch AS (
  SELECT id FROM orders
  WHERE  status = 'PENDING' AND created_at < now() - interval '30 days'
  ORDER  BY id
  LIMIT  5000
  FOR UPDATE SKIP LOCKED          -- skip rows locked by other requests
)
UPDATE orders o SET status = 'EXPIRED'
FROM batch WHERE o.id = batch.id;
~~~
Step-by-step:
1. CTE selects 5,000 ids to fix (fast if index exists on {{(status, created_at)}}).
2. UPDATE locks exactly those 5,000 rows, commits after a few hundred ms, lock released.
3. User requests only wait for a batch maximum, not 5 million rows.
4. Between batches, rest briefly to let replica catch up; monitor lag and stop if exceeded.

### Comparison
| Method | Time | Lock | Risk |
|---|---|---|---|
| Java loop {{save()}} | hours | short | too slow, 5 million round-trips |
| One massive UPDATE | minutes | held for statement | hangs requests, replication lag, rollback is huge if error |
| Batch 5,000 rows | minutes | short per batch | must write loop, must be idempotent |

### Common Pitfalls
1. **Not previewing**. Symptom: missed WHERE condition, updated the whole table. Fix: run SELECT COUNT(*) with FROM/WHERE first; for manual runs, BEGIN, check row count, COMMIT.
2. **Duplicate keys in staging**. Symptom: price changes inconsistently between runs. Fix: UNIQUE on staging, GROUP BY HAVING check.
3. **Massive UPDATE during peak hours**. Symptom: API timeout, replica lag, users see stale data. Fix: batching, run off-peak.
4. **Using LIMIT in UPDATE on PostgreSQL**. PostgreSQL doesn't support {{UPDATE ... LIMIT}}; use CTE to select ids as shown. MySQL has UPDATE ... LIMIT but only for single-table updates.

### 1-Minute Interview Answer
"I update from a staging table using set-based SQL: UPDATE FROM on PostgreSQL or UPDATE JOIN on MySQL, instead of Java loops. Before running, I check that staging has no duplicate keys, because if one target matches multiple source rows, PostgreSQL picks randomly without error. I include IS DISTINCT FROM to skip unchanged rows, reducing WAL and bloat. For millions of rows, I batch in chunks of a few thousand using a CTE with FOR UPDATE SKIP LOCKED to keep locks short and let replicas catch up, and I loop until finished."

> Senior tip: all bulk edit jobs must be **idempotent** (rerunnable) and **pausable/resumable**: the WHERE clause automatically excludes already-processed rows (e.g., {{status = 'PENDING'}}), and each batch logs the row count and duration. When the job dies at 3 AM, you just restart it; no need to find out where it stopped.`,
    follow: [
      'Why does PostgreSQL still write a new row version when UPDATEing with identical values?',
      'When should you use MERGE (PostgreSQL 15+) instead of UPDATE ... FROM?',
      'How do you choose batch size and monitor replication lag while running?'
    ]
  }
});
