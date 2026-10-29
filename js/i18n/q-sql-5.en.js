App.i18n.content({
  'sql-029': {
    q: 'Accounting requires invoice numbers to be continuous, without gaps (e.g., HD-2026-000001, 000002...), but the table uses a sequence/AUTO_INCREMENT, which occasionally jumps from 105 to 107. Why do sequences always potentially have gaps? How do you design a gapless numbering system, and what is the performance cost?',
    a: `**Summary:** Sequences are designed for **speed and high concurrency**, so numbers once assigned are **never returned** upon transaction rollback; thus, gaps are normal. For continuous numbers, use a **counter table** and increment the number **within the same transaction** as the invoice creation: if the invoice creation rolls back, the counter rolls back too. The cost: all transactions sharing the same series must **queue** behind a row lock, limiting throughput to the duration of the lock.

### Quick understanding
Sequences are like **take-a-number ticket dispensers at a bank**: anyone can get a number instantly without waiting. But if a customer takes number 106 and leaves, the number 106 is lost; the machine does not take it back. A counter table is like **a paper invoice book with a single shared pen**: to write an invoice, you must hold the pen, and once finished, you pass it to the next person. No number is ever skipped, but only one person can write at a time.

### Terminology
- **Sequence**: an object that generates monotonically increasing numbers, independent of transactions.
- **Gap**: a number skipped in a sequence.
- **Row lock**: a lock on a specific row, held until the transaction ends.
- **Contention**: multiple transactions competing for the same lock.

### Why sequences have gaps
1. **Rollback**: Transaction A takes 106 and fails. If the DB reclaimed 106, Transaction B holding 107 would have to wait for A to finish before knowing which number to take—effectively serializing all inserts. The DB chooses not to reclaim numbers so no one has to wait.
2. **Cache / preallocate**: Hibernate with {{allocationSize = 50}} pre-fetches 50 numbers; restarting the application loses unused ones. PostgreSQL also logs groups of sequence values in advance, so crashes can skip dozens of numbers.
3. **MySQL AUTO_INCREMENT**: failed inserts (duplicate keys), {{INSERT IGNORE}}, rollbacks, and bulk inserts with {{innodb_autoinc_lock_mode = 2}} (default since 8.0) can all create gaps.
Conclusion: **technical IDs** use sequences—that is correct; **business numbers** requiring continuity must be a separate column with a separate mechanism.

### Designing a counter table
~~~sql
CREATE TABLE invoice_counter (
  series  VARCHAR(20) PRIMARY KEY,       -- one row per series: 'HD-2026', 'HD-CN2-2026'
  last_no BIGINT NOT NULL
);

BEGIN;
-- 1) Get the next number: UPDATE locks the row, others in the same series must wait
UPDATE invoice_counter SET last_no = last_no + 1
WHERE  series = 'HD-2026'
RETURNING last_no;                       -- e.g., returns 106
-- 2) Create the invoice with the number just retrieved, IN THE SAME transaction
INSERT INTO invoice(series, invoice_no, customer_id, amount)
VALUES ('HD-2026', 106, 42, 1500000);
COMMIT;                                  -- releases lock; error in step 2 ROLLBACKS both
~~~
MySQL lacks {{RETURNING}}; use the trick {{UPDATE invoice_counter SET last_no = LAST_INSERT_ID(last_no + 1) WHERE series = ?}} then {{SELECT LAST_INSERT_ID()}} (the value is bound to the connection, so it is safe under concurrency). Add {{UNIQUE(series, invoice_no)}} as a safety net.

### The cost: calculating throughput
~~~text
T1: [lock counter ---- create invoice ---- commit]
T2:        waiting.....................[lock ---- ... ---- commit]
T3:                                       waiting.......................[...]
~~~
If it takes 20 ms from updating the counter to COMMIT, a series is limited to roughly **50 invoices/second**. Ways to maintain performance:
| Technique | Effect |
|---|---|
| Get the number at the **final step** (only when issuing), use technical ID for drafts | lock held for only a few ms |
| Do not call external APIs within the counter-increment transaction | avoids holding locks for seconds |
| One series per branch/prefix | splits the lock into multiple independent rows |
| A single worker issues numbers in batches | queues at the application layer instead of DB |

### Common pitfalls
1. **Using {{MAX(invoice_no) + 1}}**. Symptom: two transactions read MAX = 105, both create 106. Solution: use a counter table with row locking, or at least a UNIQUE constraint to detect collisions.
2. **Getting numbers in a separate transaction ({{REQUIRES_NEW}})**. Symptom: counter commits 106, invoice transaction fails/rolls back, leaving a gap. Solution: keep both in the same transaction.
3. **Deleting issued invoices**. Symptom: gaps created by users. Solution: do not delete; mark as "cancelled" and keep the number.
4. **Using sequences for business numbers and "patching" gaps with a job**. Solution: separate technical IDs and business numbers at the design stage.

### 1-minute elevator pitch
"Sequences do not reclaim numbers on rollback because doing so would serialize all inserts; combined with preallocation and crashes, gaps are expected. Therefore, I use sequences for technical IDs, while continuous invoice numbers are stored in a separate column managed by a counter table per series: I UPDATE the last_no and RETURNING it in the same transaction as the invoice insertion, so if one fails, both roll back, with a UNIQUE(series, invoice_no) constraint as a safeguard. The cost is that transactions within the same series must queue via a row lock, so I issue numbers only at the final issuance step, keep the transaction short, and split series by branch if higher throughput is needed."

> Senior tip: before building a gapless mechanism, re-confirm the business requirements: usually, only **issued invoices** must be continuous per series; order IDs or transaction IDs do not. Narrowing the scope this way helps ensure that only a small part of the system must serialize, while the rest runs in parallel.`,
    follow: [
      'Why is {{MAX(invoice_no) + 1}} incorrect even when placed within {{@Transactional}}?',
      'If you need 1,000 invoices/second on a single series, how would you redesign it?',
      'How does Hibernate allocationSize affect ID gaps and performance?'
    ]
  },
  'sql-030': {
    q: 'The system must know "the price (or fee) of a product at any point in the past", support setting new prices effective from a future date, and absolutely forbid overlapping prices. How do you design a history table with validity (valid_from/valid_to), how do you query "as of", and how do you enforce non-overlapping at the DB level on PostgreSQL and MySQL?',
    a: `**Summary:** Each price is a row with a **half-open validity interval** [from, to): to = NULL means still effective. An "as of t" query takes the row where {{from <= t < to}}. Changing price = within a single transaction **close** the current row and **insert** a new one. PostgreSQL enforces non-overlapping at the DB level using the {{tstzrange}} type and an **exclusion constraint**; MySQL lacks this, so you must serialize writes per product (lock the parent row) and check for overlaps in the same transaction. Orders must **capture the price** at purchase time; do not re-calculate from history when printing the invoice.

### Quick understanding
A price table with validity is like **the electricity tariff table**: each price rate notes "applicable from day X to before day Y". To find out the price for March 2025, you search for the row whose interval contains March 2025. The golden rule: at any given moment, there is **exactly one** price; no overlap, no gaps (if business requires).

### Terminology
- **Half-open interval [from, to)**: includes from, excludes to. Consecutive intervals [1/1, 1/4) and [1/4, 1/7) do not overlap or have gaps.
- **As-of query**: querying state at a specific point in time.
- **SCD Type 2** (Slowly Changing Dimension): data warehousing model saving each change as a new row with validity.
- **Exclusion constraint**: a PostgreSQL constraint ensuring "no two rows satisfy the comparison condition," a generalization of UNIQUE.
- **Bitemporal**: storing both **validity time** (when the price applies) and **system time** (when we recorded it).

### Design on PostgreSQL
~~~sql
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- allows = operator in GiST index
CREATE TABLE product_price (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id   BIGINT NOT NULL REFERENCES product(id),
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  valid_during TSTZRANGE NOT NULL,            -- defaults to half-open [from, to)
  created_by   VARCHAR(50) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- for same product_id (=) intervals must not overlap (&&)
  CONSTRAINT no_overlap EXCLUDE USING gist (product_id WITH =, valid_during WITH &&)
);

-- Price at a point in time (the GiST index from the constraint also handles this query)
SELECT price FROM product_price
WHERE  product_id = 42 AND valid_during @> timestamptz '2026-03-01 10:00+07';
~~~
Update price from 01/04/2026 (future-dated):
~~~sql
BEGIN;
UPDATE product_price                                -- 1) close the currently open row
SET    valid_during = tstzrange(lower(valid_during), '2026-04-01 00:00+07')
WHERE  product_id = 42 AND upper_inf(valid_during);
INSERT INTO product_price(product_id, price, valid_during, created_by)
VALUES (42, 120000, tstzrange('2026-04-01 00:00+07', NULL), 'pricing-job');  -- 2) new row
COMMIT;
~~~
Mechanism: every INSERT/UPDATE uses the GiST index to find rows for the same product_id with overlapping intervals; if found, it raises {{conflicting key value violates exclusion constraint}}. Even with concurrent requests, the second request must wait for the first to commit before checking, ensuring safety.

### On MySQL (no range type or exclusion constraint)
~~~sql
-- columns valid_from DATETIME(6) NOT NULL, valid_to DATETIME(6) NULL, index (product_id, valid_from)
START TRANSACTION;
SELECT id FROM product WHERE id = 42 FOR UPDATE;    -- serializes all price changes for product 42
SELECT COUNT(*) FROM product_price                  -- [a1,a2) and [b1,b2) overlap if
WHERE  product_id = 42                              --   a1 < b2 AND b1 < a2
  AND  valid_from < '2026-07-01' AND COALESCE(valid_to, '9999-12-31') > '2026-04-01';
-- = 0 then INSERT, else business error
COMMIT;
~~~
Locking the product row is necessary: two transactions simultaneously checking "no overlap" then inserting is a classic race condition; locking the parent forces them to queue.

### Trade-offs of history storage methods
| Method | Pros | Cons |
|---|---|---|
| Price column only + audit log | simple | cannot reliably answer "price effective on day X", cannot set future prices |
| Validity interval [from, to) | fast as-of query, future-dating | must ensure no overlap/gaps |
| Bitemporal (plus record time) | answers "what did the system **think** the price was on 5/3" (auditing) | complex, needed only for finance/insurance |

### Common pitfalls
1. **Using closed intervals [from, to] or BETWEEN**. Symptom: two prices exist at exactly midnight on 01/04. Solution: always use half-open.
2. **Mixing valid_to = '9999-12-31' with NULL**. Symptom: "current price" queries miss rows. Solution: choose one convention and stick to it.
3. **Re-calculating invoice prices instead of capturing them**. Symptom: re-printing an old invoice shows a different amount after someone updates history. Solution: order_item must store unit_price at time of purchase.
4. **Updating the price of an old historical row**. Symptom: loss of audit trail. Solution: close the interval and add a new row; fix errors via bitemporal or audit.
5. **Timezone of validity milestones**. "From 01/04" is 00:00 local time, not UTC. Solution: use timestamptz and specify the offset clearly.

### 1-minute elevator pitch
"I store each price as a row with a half-open validity interval from and to, where NULL means still effective; the price at time t is the row where from is less than or equal to t and t is less than to. Changing price is closing the current row and inserting a new one in a single transaction, making future-dating very natural. On PostgreSQL, I use tstzrange and an exclusion constraint with btree_gist to automatically prevent overlaps, safe even under concurrent writes. MySQL lacks this, so I lock the product row FOR UPDATE and check for overlaps before inserting. Orders always capture the price at purchase time so that invoices never change."

> Senior tip: as a lead, standardize **one temporal pattern** used across all "effective" tables (prices, fees, rates, limits): same column names, same half-open convention, same close/open logic in a shared service. I once saw a system with 5 fee tables using 5 different conventions (closed, open, 9999, NULL), and every single calculation error by one day came from that inconsistency.`,
    follow: [
      'Why is the exclusion constraint still correct when two transactions insert overlapping intervals?',
      'How does Bitemporal differ from SCD Type 2, and when is it truly needed?',
      'If business requires "no gaps" between intervals, how do you verify that?'
    ]
  }
});