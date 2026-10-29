/*
 * English translation of js/data/q-sql.js — task T481. Format: js/core/i18n.js (content overlay).
 * ids: sql-029 sql-030
 */
App.i18n.content({
  'sql-029': {
    q: 'Accounting requires invoice numbers to be continuous, with no skipped numbers (HD-2026-000001, 000002...), but the table uses a sequence/AUTO_INCREMENT and occasionally jumps from 105 straight to 107. Why can a sequence always contain gaps? How would you design gap-free number issuance, and what is the performance price?',
    a: `**Summary:** A sequence is designed to be **fast and non-blocking**, so a number that has already been handed out is **never given back** when its transaction rolls back; gaps are therefore normal. If numbers must be continuous, use a **counter table** and increment the number **inside the same transaction** that creates the invoice: if the invoice creation rolls back, the counter rolls back with it. The price: every transaction drawing from the same series must **queue** behind a single locked row, so throughput is capped by how long that row lock is held.

### Quick understanding
A sequence is like the **ticket dispenser at a bank**: anyone who presses the button gets a number immediately, without waiting for anyone else. But if a customer takes ticket 106 and then walks away, 106 is gone forever; the machine never takes the ticket back. A counter table is like **a paper invoice book that comes with only one pen**: to write an invoice you must be holding the pen, and you only pass it on once you have finished writing. No number is ever skipped, but only one person can write at a time.

### Terminology
- **Sequence**: a database object that generates increasing numbers; it lives outside transactions and commits on its own.
- **Gap**: a number that is skipped in the series.
- **Row lock**: a lock on a single row, held until the transaction that took it ends.
- **Contention**: several transactions competing for the same lock, so they have to wait for one another.

### Why sequences have gaps
1. **Rollback**: transaction A takes 106 and then fails. If the DB reclaimed 106, transaction B, which already holds 107, would have to wait for A to finish before knowing which number to take, which means every insert would have to queue. The DB chooses not to reclaim the number so that nobody has to wait.
2. **Cache / preallocation**: Hibernate with {{allocationSize = 50}} reserves 50 numbers up front; restarting the application throws away whatever was not used. PostgreSQL likewise writes a block of sequence values to the log in advance, so after a crash it may jump by several dozen.
3. **MySQL AUTO_INCREMENT**: a failed insert (duplicate key), {{INSERT IGNORE}}, a rollback, or a bulk insert with {{innodb_autoinc_lock_mode = 2}} (the default since 8.0) can all leave a gap.
Conclusion: using a sequence for the **technical id** is the right call; a **business number** that must be continuous has to live in its own column, fed by its own mechanism.

### Designing a counter table
~~~sql
CREATE TABLE invoice_counter (
  series  VARCHAR(20) PRIMARY KEY,       -- one row per series: 'HD-2026', 'HD-CN2-2026'
  last_no BIGINT NOT NULL
);

BEGIN;
-- 1) Take the next number: the UPDATE locks the row, others on the same series must wait
UPDATE invoice_counter SET last_no = last_no + 1
WHERE  series = 'HD-2026'
RETURNING last_no;                       -- for example, returns 106
-- 2) Create the invoice with the number just taken, IN THE SAME transaction
INSERT INTO invoice(series, invoice_no, customer_id, amount)
VALUES ('HD-2026', 106, 42, 1500000);
COMMIT;                                  -- releases the lock; a failure in step 2 rolls back both
~~~
MySQL has no RETURNING; use the trick {{UPDATE invoice_counter SET last_no = LAST_INSERT_ID(last_no + 1) WHERE series = ?}} followed by {{SELECT LAST_INSERT_ID()}} (the value is bound to each connection, so it stays safe when requests run concurrently). Add {{UNIQUE(series, invoice_no)}} as a safety net.

### The cost: calculating throughput
~~~text
T1: [lock counter ---- create invoice ---- commit]
T2:         waiting.....................[lock ---- ... ---- commit]
T3:                                        waiting.......................[...]
~~~
If it takes 20 ms from the counter UPDATE to the COMMIT, one series tops out at roughly **50 invoices per second**. Ways to keep performance up:
| Technique | Effect |
|---|---|
| Take the number at the **last step** (only when issuing), use the ordinary id for drafts | the lock is held for only a few ms |
| Do not call external APIs inside the numbering transaction | avoids holding the lock for seconds |
| Give every branch/prefix its own series | splits the lock into several independent rows |
| A single worker issues numbers in batches | queues at the application layer instead of inside the DB |

### Common pitfalls
1. **Using {{MAX(invoice_no) + 1}}**. Symptom: two transactions both read MAX = 105 and both create 106. Fix: a counter table with row locking, or at the very least a UNIQUE constraint so the collision is detected.
2. **Taking the number in a separate transaction ({{REQUIRES_NEW}})**. Symptom: the counter has already committed 106, the invoice insert fails and rolls back, and the gap stays. Fix: keep both in one transaction.
3. **Deleting an invoice that has already been issued**. Symptom: a gap created by the users themselves. Fix: never delete; move the invoice to a "cancelled" state and keep the number.
4. **Using a sequence for business numbers and then "patching" the gaps with a scheduled job**. Fix: separate the technical id from the business number right at design time.

### 1-minute interview answer
"A sequence never gives a number back when a transaction rolls back, because giving it back would force every insert to wait for every other insert; add caching and crashes on top and gaps are normal. So I use a sequence for the technical id, and keep the continuous invoice number in its own column, issued from a counter table with one row per series: UPDATE last_no by one and RETURNING it in the same transaction as the invoice insert, so a rollback undoes both, plus a UNIQUE(series, invoice_no) constraint. The price is that transactions on the same series queue behind one row lock, so I take the number at the final issuance step, keep the transaction very short, and split series per branch when I need higher throughput."

> Senior tip: before building a gapless mechanism, ask the business **exactly** what they need: usually only **issued invoice** numbers have to be continuous per series, while order ids and transaction ids do not. Narrowing the scope that way means only one small step has to queue, and the rest of the system keeps running in parallel without any contention.`,
    follow: [
      'Why is {{MAX(invoice_no) + 1}} wrong even when it runs inside {{@Transactional}}?',
      'If you needed 1,000 invoices per second on a single series, how would you redesign it?',
      'How does Hibernate allocationSize affect id gaps and insert performance?'
    ]
  },
  'sql-030': {
    q: 'The system has to answer "what was the price (or fee) of a product at any point in the past", support scheduling a new price that takes effect on a future date, and absolutely never allow two price levels to overlap. How would you design an effective-dated history table (valid_from/valid_to), how do you run an "as of" query, and how do you make the database reject overlaps on PostgreSQL and on MySQL?',
    a: `**Summary:** Each price level is a row with a **half-open validity interval** [from, to): to = NULL means still in effect. The "as of t" query picks the row where {{from <= t < to}}. Changing a price means, inside one transaction, **closing** the current row and **inserting** a new one. PostgreSQL stops overlaps at the DB level with the {{tstzrange}} type and an **exclusion constraint**; MySQL has no such feature, so you must serialize writes per product (lock the parent row) and check for overlaps inside the same transaction. Orders must still **snapshot the price** at purchase time and must never look up history when reprinting an invoice.

### Quick understanding
An effective-dated price table is like **the electricity tariff sheet published by EVN (Vietnam Electricity)**: every tier says "applies from day X until the day before Y". To find out what March 2025 cost, you look for the row whose interval contains March 2025. The one unbreakable rule: at any single moment there is **exactly one** price, with no overlap and no gap (if the business requires it).

### Terminology
- **Half-open interval [from, to)**: includes from, excludes to. Two neighbouring intervals [1/1, 1/4) and [1/4, 1/7) neither overlap nor leave a gap.
- **As-of query**: a query for the state of the data at a particular point in time.
- **SCD Type 2** (Slowly Changing Dimension): a data-warehouse model that stores every change as a new row with its own validity interval.
- **Exclusion constraint**: a PostgreSQL constraint meaning "no two rows may satisfy the comparison conditions at the same time", a generalization of UNIQUE.
- **Bitemporal**: storing both **validity time** (when the price applies) and **record time** (when we learned about it).

### Design on PostgreSQL
~~~sql
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- lets the GiST index use the = operator
CREATE TABLE product_price (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id   BIGINT NOT NULL REFERENCES product(id),
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  valid_during TSTZRANGE NOT NULL,            -- defaults to half-open [from, to)
  created_by   VARCHAR(50) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- for the same product_id (=) the validity intervals must not intersect (&&)
  CONSTRAINT no_overlap EXCLUDE USING gist (product_id WITH =, valid_during WITH &&)
);

-- Price at a point in time (the GiST index behind the constraint serves this query too)
SELECT price FROM product_price
WHERE  product_id = 42 AND valid_during @> timestamptz '2026-03-01 10:00+07';
~~~
Changing the price from 01/04/2026 (scheduled ahead for the future):
~~~sql
BEGIN;
UPDATE product_price                                -- 1) close the row that is still open
SET    valid_during = tstzrange(lower(valid_during), '2026-04-01 00:00+07')
WHERE  product_id = 42 AND upper_inf(valid_during);
INSERT INTO product_price(product_id, price, valid_during, created_by)
VALUES (42, 120000, tstzrange('2026-04-01 00:00+07', NULL), 'pricing-job');  -- 2) new row
COMMIT;
~~~
How it works: on every INSERT/UPDATE, PostgreSQL uses the GiST index to look for rows with the same product_id whose intervals intersect; if it finds one, it raises {{conflicting key value violates exclusion constraint}}. Even with two concurrent requests, the second one has to wait for the first to commit before it can check, so nothing slips through.

### On MySQL (no range type and no exclusion constraint)
~~~sql
-- columns valid_from DATETIME(6) NOT NULL, valid_to DATETIME(6) NULL, index (product_id, valid_from)
START TRANSACTION;
SELECT id FROM product WHERE id = 42 FOR UPDATE;    -- serializes every price change for product 42
SELECT COUNT(*) FROM product_price                  -- [a1,a2) and [b1,b2) overlap when
WHERE  product_id = 42                              --   a1 < b2 AND b1 < a2
  AND  valid_from < '2026-07-01' AND COALESCE(valid_to, '9999-12-31') > '2026-04-01';
-- if the count = 0 then INSERT, otherwise raise a business error
COMMIT;
~~~
Why the product row must be locked: two transactions both checking "no overlap" and then both inserting is the classic race condition; locking the parent row forces them to queue.

### Trade-offs of history storage options
| Option | Pros | Cons |
|---|---|---|
| Just a price column + an audit log | simple | cannot reliably answer "what price was in effect on day X", cannot schedule future prices |
| Validity interval [from, to) | fast as-of query, supports future-dated prices | must guarantee no overlap and no gap |
| Bitemporal (plus record time) | answers "what did the system **think** the price was on 5/3" (auditing) | complex, needed only for finance/insurance |

### Common pitfalls
1. **Using a closed interval [from, to] or BETWEEN**. Symptom: right at midnight on 01/04 two prices exist. Fix: always use half-open.
2. **Mixing valid_to = '9999-12-31' with NULL**. Symptom: the "current price" query silently misses rows. Fix: pick one convention and stick to it.
3. **Invoices looking up price history instead of snapshotting the price**. Symptom: reprinting an old invoice shows a different amount after someone edits history. Fix: order_item stores unit_price at the time of purchase.
4. **Overwriting a history row** (UPDATE the price of an old row). Symptom: the audit trail is lost. Fix: only close the interval and add a new row; correcting a mistake in the past is recorded through bitemporal or an audit log.
5. **Timezone of the effective milestone**. "From 01/04" means 00:00 Vietnam time, not UTC. Fix: use timestamptz and state the offset explicitly.

### 1-minute interview answer
"I store each price level as a row with a half-open validity interval from and to, where an empty to means still in effect; the price at time t is the row where from is less than or equal to t and t is less than to. Changing a price means closing the currently open row and inserting a new one in the same transaction, which makes future-dating very natural. On PostgreSQL I use a tstzrange column and an exclusion constraint with btree_gist so the database itself rejects two overlapping intervals, safe even under concurrent writes. MySQL has no such feature, so I lock the product row with FOR UPDATE and check for overlap before inserting. Orders still snapshot the price at purchase time so an invoice never changes."

> Senior tip: in a lead role, standardize **one temporal pattern** for every "effective-dated" table (prices, fees, interest rates, limits): the same column names, the same half-open convention, the same close/open logic in one shared service. I once worked on a system with five fee tables using five different conventions (closed, open, 9999, NULL), and every fee calculation that was off by one day traced back to that inconsistency.`,
    follow: [
      'Why is the exclusion constraint still correct when two transactions insert overlapping intervals at the same time?',
      'How does bitemporal differ from SCD Type 2, and when do you actually need it?',
      'If the business requires "no gaps" between intervals, how would you verify it?'
    ]
  }
});
