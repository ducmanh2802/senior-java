/*
 * English translation of js/data/q-system-design.js — task T557. Format: js/core/i18n.js (content overlay).
 * ids: architecture-007 architecture-008 design-014 design-015 design-016 design-017
 */
App.i18n.content({
  'architecture-007': {
    q: `Write an ADR (Architecture Decision Record) to document an architecture decision. What does the structure include and how do you evaluate trade-offs objectively?`,
    a: `**Summary:** An ADR is a **short, immutable document stored in the repo**, recording **context, decision, consequences and alternatives considered**. The goal is not to fully document architecture, but to explain **why** — so six months later no one has to guess or re-debate.

### ADR structure
~~~text
# ADR-0007: Use Kafka instead of RabbitMQ for business events

Status: Accepted (2026-10-22)
Deciders: Platform team, Payments team
Supersedes: -
Superseded by: -

## Context
- 12 services, 40 million events/day, need replay for 7 days to rebuild read model.
- RabbitMQ currently does not retain events after ack; replay must be rewritten.
- Team already has operational experience with Kafka in analytics.
- SLA: p99 publish < 20 ms, no event loss when a broker dies.

## Decision
Use Kafka as the event bus for domain events; RabbitMQ stays for short-term task queues (email, jobs) where replay is not needed.

## Consequences
Positive:
- Replay by offset, rebuild read model easily.
- High throughput, partition by aggregate id preserves order.
Negative:
- More complex operations (broker, partition, rebalance).
- Consumers must be idempotent due to at-least-once.
- Storage cost increases with retention.

## Alternatives considered
- RabbitMQ + outbox table + archive: simpler but replay is slow.
- AWS SQS/SNS: less operations but hard to replay and order.
- Pulsar: good features but team has no experience.

## References
- RFC-123, internal benchmark, link to dashboard.
~~~
A good ADR reads in 5 minutes. If it exceeds 2 pages, you are probably writing a design document, not an ADR.

### Status and lifecycle
- **Proposed**: under discussion, not yet applied.
- **Accepted**: decided and in use.
- **Deprecated**: no longer recommended but still in use.
- **Superseded by ADR-00xx**: replaced, **do not edit the old content**.
ADR is immutable. When a decision changes, create a new ADR and link both ways. Decision history is an asset.

### Objective trade-off evaluation
1. **Define criteria before comparing.** E.g., throughput, p99 latency, 3-year cost, operational complexity, team skills, replay ability, lock-in.
2. **Assign weights.** Not all criteria matter equally. Record weights so readers see assumptions.
3. **Score with evidence.** Benchmark, PoC, numbers from similar systems — do not score by feeling.
4. **Calculate full cost.** License, infrastructure, operators, training, migration, downtime.
5. **State reversal conditions.** Easy-to-reverse decisions (type 2) should be quick; hard-to-reverse (type 1) need deep analysis.

Example table:
| Criterion | Weight | Kafka | RabbitMQ | SQS |
|---|---|---|---|---|
| Replay event | 25% | 5 | 1 | 1 |
| Throughput | 20% | 5 | 3 | 4 |
| Operations | 20% | 2 | 4 | 5 |
| Team experience | 20% | 4 | 4 | 3 |
| 3-year cost | 15% | 3 | 4 | 4 |
| **Total** | | **3.90** | **3.05** | **3.25** |

The score is only a discussion tool, not a substitute for judgment. If the result contradicts intuition, revisit weights and evidence.

### Common mistakes
- **ADR records only the decision, not rejected alternatives.** Later people don't know why it wasn't chosen, then propose again.
- **Writing ADR after work is done and no one reads it.** Should be written before or during the decision, reviewed like a design doc.
- **Not recording negative consequences.** Every decision has a cost; hiding it erodes trust.
- **Silently updating old ADR.** Loses history; supersede instead.
- **ADR for everything.** Small, easily reversed decisions can go in PR description. ADR is for hard-to-reverse, multi-team decisions.
- **No owner.** An ADR without a responsible person will wither.

### Light process
1. Write ADR in Proposed status, include in a small PR.
2. Review within 2–3 days with affected teams.
3. Finalize, change to Accepted, merge into {{docs/adr/}}.
4. Link from code/README of related module.
5. Periodically review old ADRs; supersede obsolete ones.

Tooling: a Markdown directory is enough, no software needed. MADR template can be used.

### ADR vs RFC
- **RFC**: proposes detailed design, can be long, goal is to gather feedback before building.
- **ADR**: records the **decision** and reasons, concise, immutable.
A large decision may have an RFC first, then an ADR after finalization, with ADR linking to RFC.

> Senior tip: the biggest value of ADR is not the document itself, but **forcing decision-makers to write down rejected alternatives**. In many reviews, the Alternatives section is what makes the team realize they chose a technology because of hype, not because of need.`,
    follow: [
      `How do you handle two conflicting ADRs in the same system?`,
      `How do you evaluate long-term operational cost of a technology choice?`,
      `When does a decision not need an ADR and can just be recorded in a PR?`
    ]
  },
  'architecture-008': {
    q: `Analyze common architecture anti-patterns: God class, anemic domain model, distributed monolith. How do you recognize and fix them?`,
    a: `**Summary:** Anti-patterns are **solutions that seem right at first but cause rising cost over time**. The three most common: God class (one class knows too much), anemic domain model (data and behavior separated, invariants unprotected), and distributed monolith (many services but tightly coupled like a monolith). Recognize by measurable signs, fix by incremental change — not a full rewrite.

### God class / God service
**Signs:**
- File 1,000+ lines, 20+ dependency injections.
- Names like {{OrderManager}}, {{CommonService}}, {{Utils}}.
- A "change magnet": nearly every feature touches it.
- Many people edit it → constant conflicts.
- Hard to test because you must mock half the system.

**Why it forms:** everyone adds a method to the existing place instead of creating a new one; deadlines push; missing architecture review.

**How to fix:**
1. List methods by **responsibility** (group by verb/business).
2. Extract each group into a separate class/service, starting with the least dependent group.
3. Keep a temporary facade calling components so clients are not broken.
4. Write tests before splitting; after splitting, move tests accordingly.
5. Set rules (ArchUnit, checkstyle) so new classes do not bloat.

~~~java
// Before: OrderManager does everything
class OrderManager { create(); calculateTax(); sendMail(); exportPdf(); syncErp(); }

// After: split by responsibility, coordinate via use case
class PlaceOrderService { ... }
class TaxCalculator { ... }
class OrderNotifier { ... }
class OrderExporter { ... }
~~~
You do not need to split everything at once; each PR splits one group with tests protecting it.

### Anemic domain model
**Signs:**
- Entity has only getters/setters, no behavior.
- All logic lives in services, manipulating fields directly.
- Same invariant checks in many places, or missed somewhere.
- Public setters allow invalid state creation.

**Why it is harmful:** invariants have no protection place. Example: order status can jump from DRAFT to SHIPPED if someone sets the field directly; total can diverge from line items.

**How to fix:**
- Move behavior into entity/aggregate: {{order.addLine()}}, {{order.cancel()}}, {{wallet.debit()}}.
- Close fields, expose only business methods; setters only for framework if forced.
- Use constructor/factory to check invariants at creation time.
- Value object for small concepts (Money, Email) instead of passing loose strings.

~~~java
// Anemic
order.setStatus("SHIPPED");   // any state allowed
order.setTotal(total);        // total may not match lines

// Rich behavior
order.ship();                 // checks only ship when PAID
order.recalculateTotal();
~~~
Do not expose setters for fields that have business rules.

### Distributed monolith
**Signs:**
- Separate deploy, but shared DB, shared library, and synchronous calls everywhere.
- Changing one feature requires deploying multiple services.
- No independent scaling; one service failure takes down others.
- Data consistency requires distributed transactions or eventual consistency that is not accepted.

**How to fix:**
- Define service boundaries by **business capability**, not technical layer.
- Each service owns its data; no direct DB access from others.
- Communication via async events or well-designed APIs, not direct DB reads.
- Start with modular monolith if team is small, split when boundary is stable.

> Senior tip: the most expensive anti-pattern is not any single one, but **choosing them because of organizational structure instead of technical need**. If every team owns a layer (frontend, backend, DB), you get a distributed monolith disguised as microservices.`,
    follow: [
      `How do you measure coupling between services with metrics?`,
      `When do you decide to merge services instead of continuing to split?`,
      `How do you migrate from shared database to DB per service without downtime?`
    ]
  },
  'design-014': {
    q: `Design an interbank 24/7 transfer system (like NAPAS). Describe the transaction flow, states, timeout mechanism and reconciliation process.`,
    a: `**Summary:** This is a problem where **correctness matters more than speed**: each transaction passes through a strict state machine (initiated → held → sent → result), writes double-entry to a ledger, prevents duplicates with an idempotency key and reference code. The hardest part is **timeout: the "unknown" state, not failure**, must query the switch again and reconcile at end of day — never auto-refund.

### Clarifying requirements and scale
- Function: query recipient name, fast 24/7 transfer via switch (NAPAS), view status, investigate/complain, daily reconciliation.
- Non-functional: no lost transactions, no "phantom money", full audit, 24/7 with no maintenance window; complies with limits and authentication rules of the State Bank (per Decision 2345/QD-NHNN effective 01/07/2024, biometric verification is required for transactions over 10 million VND per transaction or total online transactions over 20 million VND/day; check the specific text and current regulations during real deployment).
- Estimate (large bank assumption): 5 million transactions/day → 5,000,000 / 86,400 ≈ 58 TPS average; peak (payroll, before Tet) assume 10x → ~600 TPS. Not large in throughput; the hard part is correctness.
- Message protocol, standard (e.g. ISO 8583/ISO 20022), error codes and timeouts depend on the service, version and connection specification of the switch; do not infer from service names.

### Overall architecture
~~~text
App/Internet Banking -> API Gateway -> Transfer Service (stateless)
                                            |
                         +------------------+------------------+
                         |                                     |
                   PostgreSQL (txn + ledger)            Outbox -> Kafka
                         |                                     |
                   Core Banking (hold/post)          Switch Connector (ISO 8583)
                                                                |
                                                          NAPAS switch
                                                                |
                                                      Beneficiary bank
~~~

### State machine
~~~text
INITIATED -> HELD (funds held) -> SENT -> SUCCESS -> POSTED
                    |                |
                    |                +-> FAILED (clear rejection) -> RELEASED (release held funds)
                    |                +-> UNKNOWN (timeout) -> inquiry -> SUCCESS | FAILED
                    +-> REJECTED (insufficient balance / over limit)
~~~
Each state change is a **conditional update** so two workers do not process the same transaction:
~~~sql
UPDATE transfer SET status = 'SUCCESS', updated_at = now()
 WHERE id = :id AND status IN ('SENT', 'UNKNOWN');   -- 0 rows = already processed
~~~

### Detailed flow
1. **Idempotency:** client sends {{Idempotency-Key}}; unique index prevents duplicate inserts.
2. **Hold:** conditional update on transfer; if balance insufficient or over limit, reject.
3. **Send:** write to outbox, Kafka delivers to Switch Connector; connector maps to ISO 8583 and sends to switch.
4. **Result:** switch replies with result; conditional update to SUCCESS / FAILED; if timeout, status becomes UNKNOWN.
5. **Unknown handling:** do not auto-refund. Query switch (inquiry) with reference code; if reply delayed, reconcile daily with switch report. Only release after confirming no duplicate.
6. **Reconciliation:** daily outbox + switch settlement file vs ledger. Mismatches trigger manual investigation.

### Data model
~~~sql
CREATE TABLE transfer (
  id uuid PRIMARY KEY,
  from_account bigint,
  to_account bigint,
  amount numeric(19,4),
  status text NOT NULL,   -- INITIATED | HELD | SENT | SUCCESS | FAILED | UNKNOWN | RELEASED
  idempotency_key text UNIQUE,
  reference_code text,
  created_at timestamptz,
  updated_at timestamptz
);
CREATE TABLE ledger (
  transfer_id uuid REFERENCES transfer(id),
  account bigint,
  amount numeric(19,4),
  entry_type text,   -- DEBIT | CREDIT
  created_at timestamptz
);
~~~

### Timeout and unknown state
- Timeout is defined in the switch contract, not hardcoded; usually 30–120 seconds.
- Unknown does not mean failure; it means "we do not know yet." The switch may have accepted but response was lost.
- After timeout, enqueue an inquiry with reference_code; retry with exponential backoff; after max retries, escalate to reconciliation.
- Never release held funds solely based on timeout — that creates a double-payment risk if the switch actually processed it.

> Senior tip: in real interbank systems, the most dangerous failure is not a clear error, but **silent loss of a response**. The design that protects against it is not faster retries, but **idempotency + daily reconciliation + inquiry by reference code**. Build the reconciliation first; the rest can be repaired later.`,
    follow: [
      `How do you design the status query mechanism when the switch does not return a result to avoid duplicate processing?`,
      `If the switch changes the reconciliation file format, how do you manage parser versions?`,
      `Our bank is the receiver: how do you ensure money is not credited twice when the switch sends a duplicate message?`
    ]
  },
  'design-015': {
    q: `Compare Snowflake, ULID and DB sequence by block for a distributed ID generator. How do you handle clock skew and global ordering?`,
    a: `**Summary:** Snowflake gives near-time-ordered 64-bit IDs, generated locally very fast but requires managing worker IDs and protecting against clock drift backward. ULID is 128-bit, needs no worker ID, still sortable by time but twice as large. DB sequence by block is simple, does not depend on the clock, but needs DB HA and does not provide time ordering across instances. No method provides **absolute global ordering**; if you really need that, you must have a single sequencer.

### Snowflake: 64-bit structure
~~~text
| 1 bit = 0 | 41 bit timestamp (ms from custom epoch) | 10 bit worker | 12 bit sequence |
2^41 ms ≈ 69.7 years; 2^10 = 1024 workers; 2^12 = 4096 IDs / ms / worker
~~~
- Custom epoch (e.g. 2024-01-01) to extend lifetime ~69 years from that point.
- Sequence increases within the same ms; if it reaches 4096, wait for the next ms.
- ID is {{long}} increasing with time → B-tree insert at right edge, index stays compact.

### Comparison
| Criterion | Snowflake | ULID | DB block |
|---|---|---|---|
| Size | 64 bit ({{long}}) | 128 bit (26 chars Base32 or UUID column) | 64 bit |
| Sort by time | Approx (ms) | Approx (ms) | Only within one instance |
| Needs coordination | Worker ID unique | No | DB grants block |
| Depends on clock | Yes, very sensitive | Yes, but random part keeps uniqueness | No |
| Reveals info | Creation time, worker | Creation time | Growth rate |
| Main risk | Duplicate worker ID, clock backward | Index size | DB down when block exhausted |

ULID = 48 bit timestamp + 80 bit random; timestamp at the beginning makes reading the time very easy and B-tree insert near the end. The real downside is size: primary key 16 bytes (or 26 bytes if stored as string) makes all secondary indexes larger. ULID libraries often have monotonic mode: within the same ms, increase the random part by 1 to preserve order in one process.

### Clock skew: why it is dangerous
NTP can **step** the clock backward, VM can pause then resync time. If {{currentTimeMillis}} goes back to a ms already used, the generator may reproduce the exact timestamp + old sequence → **duplicate ID**.

Prevention:
1. Keep {{lastTimestamp}} in generator; if current time is smaller: if drift is small (few ms), wait; if large, **reject generating ID and alert** (fail-fast is better than duplicate).
2. Configure time sync with slew (gradual adjust) instead of step when running; with chrony allow {{makestep}} only at startup.
3. At startup, do not generate immediately if clock stability is uncertain; some systems save the last timestamp to compare.

~~~java
public synchronized long nextId() {
    long now = System.currentTimeMillis();
    if (now < lastTs) {
        long drift = lastTs - now;
        if (drift > 5) throw new IllegalStateException("Clock moved back " + drift + " ms");
        now = waitUntil(lastTs);                // small backward: wait for clock
    }
    if (now == lastTs) {
        sequence = (sequence + 1) & mask;
        if (sequence == 0) now = waitUntil(++lastTs);
    } else {
        sequence = 0;
    }
    lastTs = now;
    return (now << bits) | (workerId << seqBits) | sequence;
}
~~~

> Senior tip: if you do not need time-sortable IDs, do not pay for clock management. The simplest correct distributed generator is often **DB block sequence + application-level retry**; only add clock-dependent IDs when query patterns truly need it.`,
    follow: [
      `If you need 64-bit IDs but do not want to worry about clock skew, how do you design it?`,
      `When migrating a primary key from bigint auto-increment to Snowflake or ULID, what is the rollout plan?`,
      `Compare index size between bigint, UUID and 26-char ULID string in PostgreSQL.`
    ]
  },
  'design-016': {
    q: `Design a concert/movie ticket system that allows seat selection: 500,000 people enter at the same time when sales open, absolutely no seat sold to two people. How do temporary holds and payment work?`,
    a: `**Summary:** Each seat is a record with state AVAILABLE → HELD (with expiration, e.g. 10 minutes) → SOLD. Hold using **a single atomic conditional UPDATE** (or Redis SET NX with TTL) so two people cannot hold the same seat; unique constraint on ticket is the final guard. Payment is confirmed only if hold is still valid; handle traffic spikes with a virtual waiting room, not by scaling DB infinitely.

### Clarifying requirements
- Seat selection (not standing), max 4 seats/person, hold 10 minutes to pay.
- Scale: stadium 40,000 seats, 500,000 people in first 5 minutes. Assume each person loads seat map 3 times and tries to hold 2 times: reads ≈ 1.5 million requests, writes ≈ 1 million attempts but **at most 40,000 succeed**. The problem is extreme contention on a small dataset.
- No overbooking is a hard requirement; seat map display can be delayed a few seconds.

### API
~~~text
GET  /events/{id}/seats            -> seat map (cached, 1-2 s delay acceptable)
POST /events/{id}/holds            {seatIds:[...]} -> holdId, expiresAt | 409 seat already held
POST /holds/{holdId}/payment       Idempotency-Key -> redirect to payment gateway
POST /payments/callback            payment gateway callback -> confirm ticket
~~~

### Data model
~~~sql
CREATE TABLE seat (
  event_id bigint, seat_id text, status text NOT NULL,   -- AVAILABLE | HELD | SOLD
  hold_id uuid, hold_until timestamptz, version int,
  PRIMARY KEY (event_id, seat_id));
CREATE TABLE ticket (
  event_id bigint, seat_id text, order_id uuid,
  UNIQUE (event_id, seat_id));                            -- final guard
~~~

### Atomic hold
~~~sql
UPDATE seat SET status = 'HELD', hold_id = :holdId, hold_until = now() + interval '10 minutes'
 WHERE event_id = :eventId AND seat_id = ANY(:seatIds)
   AND (status = 'AVAILABLE' OR (status = 'HELD' AND hold_until < now()));
-- updated rows != requested seats => ROLLBACK, return 409
~~~
Why correct: PostgreSQL locks each row during UPDATE; second transaction waits, then reevaluates WHERE on new version and sees seat HELD so skips. No "read then write" so no race. The hold_until < now() condition lets seats expire automatically without an immediate cleanup job (job only needed for seat map accuracy). When holding multiple seats, sort seat_id to reduce deadlock between two people choosing the same pair.

### Architecture
~~~text
Users -> CDN (static seat map) -> Waiting Room (token per turn, 2,000 people/min)
                                  |
                           Booking Service --(hold/confirm)--> PostgreSQL (primary)
                                  |                                  |
                           Redis (seat status cache, TTL 1s)   Outbox -> Kafka -> Email/ticket
~~~

### Payment flow
1. Client creates hold with seatIds; receive holdId and expiresAt.
2. Client completes payment via gateway with Idempotency-Key.
3. Gateway calls back; service verifies hold is still HELD and not expired; updates to SOLD, writes ticket.
4. If hold expired before confirmation, release seat and return 409; client must retry with new hold.
5. After confirmation, send confirmation email/voucher via Kafka.

### Handling load spikes
- Waiting room (virtual queue) limits entry rate; does not scale DB directly.
- Seat map from CDN is static; updates delayed by 1–2 s are acceptable.
- PostgreSQL handles writes well if write volume is bounded by seat count, not users.

> Senior tip: the real bottleneck is not DB writes, but **contention on the same rows**. The correct fix is not more DB replicas, but **atomic conditional updates + a waiting room that limits concurrent attempts**. If you try to solve this by sharding seats, you complicate cross-seat transactions; keep seat data centralized and control concurrency at the entry point.`,
    follow: [
      `If you want to show seat status in real time to 50,000 people viewing the same seat map at once, how do you do it?`,
      `Payment succeeds but callback arrives after hold expires: what steps do you take?`,
      `For unnumbered seats (standing, 10,000 tickets), how does the hold design change?`
    ]
  },
  'design-017': {
    q: `Design an order matching engine for a stock/crypto exchange: match orders by price then time, low latency, no order lost on crash. Why do engines usually run single-threaded?`,
    a: `**Summary:** Orders pass through a gateway and risk check, then a **sequencer** assigns sequence number and writes a durable journal. After that, **a single thread per symbol group** matches orders in an order book in RAM by best-price-first, same price then earlier order first. Single-threading makes the engine **deterministic** if the journal records enough input with sequence, timestamp and no external-dependent results; then replay can recreate state, making recovery/HA simpler and no locks needed on the order book.

### Requirements clarification
- Order types: limit, market, cancel, modify. Continuous matching session (periodic ATO/ATC sessions of VN exchanges are extensions afterward).
- VN context note: matching is performed by the Exchange; securities companies mainly do OMS (receive orders, check buying power, push to exchange). This problem assumes building the engine itself (crypto exchange or internal engine).
- Estimate: 3 million orders/day in 4.5 trading hours → 3,000,000 / 16,200 s ≈ 185 orders/s average; beginning and end of session may be 20–50x → a few thousand /s. A pure in-memory single thread handles this easily; what needs optimization is **stable latency (p99)**, not throughput.

### Architecture
~~~text
Client -> Gateway (auth, validate) -> Pre-trade risk (buying power, limits)
                                          |
                                     Sequencer: assign seq, write journal (fsync + replicate)
                                          |
                      +--------------------+--------------------+
                      |                    |                    |
                Engine shard A        Engine shard B       Engine standby (replay same journal)
                (symbol 1..N, 1 thread) (symbol N+1..M)
                      |
                Output events: ack, trade, cancel  ->  Market data feed
                                                  ->  Clearing/settlement, OMS, history (DB)
~~~
Database is not on the hot path: trades are written to DB asynchronously from output events.

### Order book
- Per symbol: two sides. Bid sorted descending by price, ask sorted ascending; each price level is a FIFO queue.
- {{HashMap<Long, Order>}} by orderId for O(1) cancel (each Order knows its price level).
- Price stored as {{long}} in tick units, not {{double}}; {{BigDecimal}} is too slow and creates garbage on hot path.

~~~java
// Match a buy limit with sell side (asks: TreeMap<Long, ArrayDeque<Order>> ascending)
void matchBuy(Order buy) {
    while (buy.remaining > 0 && !asks.isEmpty()) {
        var best = asks.firstEntry();                 // lowest ask price
        if (best.getKey() > buy.price) break;         // no match
        Order sell = best.getValue().pollFirst();
        long qty = Math.min(buy.remaining, sell.remaining);
        // create trade, reduce remaining, send output
    }
}
~~~

### Why single-threaded per symbol
- No locks needed on order book if only one thread touches it.
- Replay from journal is deterministic; timestamp only used for ordering, not for computation.
- Recovery: standby replays same journal from start; after catching up, it can take over.
- If journal is lost, recovery is impossible; so journal must be fsync + replicated.

### Sequencer and journal
- Journal record: sequence number, symbol, order input or result, timestamp.
- fsync before acknowledging to client; replication to standby within milliseconds.
- If sequencer crashes, restart and continue from last sequence; clients retry with idempotency.

> Senior tip: do not add distributed locks or consensus to the matching engine; that is an architecture smell. If you truly need multiple threads per symbol, you have already split by price range or used sharding, not concurrency within the same symbol. The correct scalability is **more symbols = more shards**, not more threads per symbol.`,
    follow: [
      `How do you support periodic matching sessions (ATO/ATC): what is the pricing algorithm?`,
      `How do you check buying power before matching without making risk check a bottleneck?`,
      `Primary and standby differ by one order at failover: how do you detect and handle this?`
    ]
  }
});