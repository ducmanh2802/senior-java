/*
 * English translation of js/data/lessons-banking.js — task T1039. Format: js/core/i18n.js (content overlay).
 * ids: lesson-banking-009
 */
App.i18n.content({
  'lesson-banking-009': {
    title: 'End-of-day (EOD) batch: accruing interest for millions of accounts, and restarting after a mid-run crash without paying money twice',
    goals: [
      'Explain what EOD is, what a cut-off is, and why a bank must have an overnight batch',
      'Design a safely rerunnable job: a natural key (account, day), a checkpoint, and chunking',
      'Compute daily interest with {{BigDecimal}} using the actual/365 convention and know why you must not round to 0 dong every day',
      'Write an {{EodJob}} with an idempotent {{accrue}}, a chunked {{run}}, a resumable {{checkpoint}}, and a {{failed}} list that does not jam the job',
    ],
    body: `### A real story: a 6-hour job that dies in hour 5

At two in the morning, the **EOD (End Of Day — end-of-day processing)** job starts scanning 1.2 million accounts to compute deposit interest, periodic fees, limit updates, and debt classification. Four hours later, a node hits an OOM (out of memory — it runs out of allocated memory) and the pod is restarted. In the morning, operations asks the question that decides everything: **"Do we rerun from the beginning, or continue from where it died?"**

If you rerun **from the beginning** without a deduplication mechanism, the 600,000 accounts that already had interest posted overnight will be posted a **second time**. If you **continue from where it died** without knowing where that was, the other 600,000 accounts will never be calculated for that day. Both directions are money incidents, and either is enough for an auditor to ask "who approved this procedure?".

### What EOD is and what a cut-off is

- **EOD batch**: the set of work a bank *cannot* do inside a single customer request, because it touches **every** customer at once: computing and posting interest, deducting maintenance fees, classifying debt by days past due, capitalization (rolling interest into principal), producing end-of-day statements, and reconciling with NAPAS/the legacy core (see lesson 2).
- **Cut-off time**: the clock boundary that slices the day. Whether a transfer received at 23:00 today is counted as **today** or as the **next business day** is decided by the cut-off, and it also determines the **valueDate** (the day money starts earning interest / is booked). Being off by one hour at the cut-off means one full day of interest is wrong, across millions of accounts.
- Why not compute interest in real time inside each request? Because interest depends on the **full-day balance** and the **number of days**, and because the bank needs an accounting day to be closed (book close) so the numbers on both sides — the core and the reports — match.

### The three life-or-death questions of a batch

| Question | Industry term | The right answer |
|---|---|---|
| Does running it twice pay money twice? | **idempotent** (rerunning any number of times gives the same result) | Each result carries a natural key (account, day) — the second attempt is blocked at the write gate |
| Can it continue after dying midway? | **resumable / checkpoint** | Save "the last processed account" and continue after it, without rescanning from the start |
| What if two nodes run it at the same time? | **no double-run** | a lock/lease per (job, day), or shard by account-id ranges |

### How a checkpoint works

~~~seq
title: EOD running by chunk with a checkpoint
actors: Scheduler | EodJob | AccountDB | LedgerDB
Scheduler -> EodJob: run(day 05/11, chunk 50,000)
EodJob -> AccountDB: fetch 50,000 accounts after the checkpoint
EodJob -> LedgerDB: post interest + mark (account, 05/11)
note EodJob..LedgerDB: one transaction for both — never write half
EodJob --> Scheduler: ok 50,000, checkpoint = A050000
Scheduler -> EodJob: run next (starting after A050000)
EodJob --> Scheduler: no more accounts, checkpoint = null
~~~

A **checkpoint** is just one row of data: "(job=EOD-INTEREST, day=2026-11-05, last=A050000)". It is **not** a money-counting machine; it is "how far have we gone". Because it only saves the time of rescanning — and is **not** the thing that protects money — the mandatory condition is: losing the checkpoint must still never pay money twice. The thing that protects money is the **natural key (account, valueDate)** on the result record itself.

### Idempotency: the natural key beats every other mechanism

Each time you post interest, store the day with it. To know "has this account been done for this day?", you only need to ask one condition:

~~~java
// "has interest been accrued for (account, day)?" — this question is answerable even when the checkpoint is lost
LocalDate lastDay = lastAccruedDay.get(account);
if (day.equals(lastDay)) return false;   // the second run on the same day: a no-op, nothing is added
~~~

There are three layers of deduplication, and production should have all three:
1. **Natural key (account, valueDate)** UNIQUE in the DB: a duplicate write is rejected by the DB — the strongest layer, because it lives where the data lives.
2. **Checkpoint**: saves the work of rescanning, cutting the run time from hours down to minutes.
3. **Job run table** (RUNNING/SUCCESS/FAILED status per day): prevents one *day* from being started twice, and lets you tell "rerunning because it broke" apart from "rerunning because an operator clicked by mistake".

> Note: do not deduplicate with "have we ever run?" in an in-memory variable ({{boolean isRunning}}). Another node cannot see it, and after a restart it goes back to false — which is exactly how the "paid twice" incident happens.

### Daily interest: actual/365 and the rounding trap

A common convention in Vietnam is **actual/365**: daily interest = {{outstanding balance}} × {{annual rate}} ÷ 365, using the actual number of days in the period. With {{BigDecimal}}, division **must** state how many digits to keep and which rounding to use, otherwise it throws {{ArithmeticException}} (for an irrational quotient such as 1/3):

~~~java
BigDecimal interest = balance.multiply(annualRate)          // 100,000,000 x 0.04
        .divide(new BigDecimal("365"), 2, RoundingMode.HALF_UP);   // -> 10,958.90 dong/day
~~~

Two points seniors are often asked to dig into:
- **Why keep scale 2 (two fractional digits) instead of rounding to a whole dong every day?** Because a small account (balance 1,000 dong, interest 0.11 dong/day) would be rounded to **0 dong** every day, meaning the customer *never* receives interest, and the total interest payable will drift away from reconciliation. A bank **accrues (records the obligation) using a value with fractional digits**, then rounds **once** when capitalizing into the account (at period end) — the same spirit as "round once at the boundary" from lessons 1 and 7.
- **365 or 366?** A leap year under the actual/actual convention would be 366; what matters is not which number you pick but that **a single contract uses one convention**, that convention is stored in the data, and the period is computed with the correct number of days (see question banking-011).

### Chunking: why not process everything in one transaction

1.2 million accounts in one transaction will: (a) hold locks for too long, (b) fill the undo log / replication lag, and (c) if it dies, **wipe out** all progress. So the batch moves in **chunks** (sub-arrays of work, for example 50,000 accounts), one transaction per chunk, and only writes that chunk's checkpoint after committing. The order of these two steps is mandatory:

| Order | If it crashes right after step 1 | Result |
|---|---|---|
| commit chunk → write checkpoint | the checkpoint is lost, but the data already written carries the key (account, day) | rerun: that chunk is skipped, **correct** |
| write checkpoint → commit chunk | the checkpoint says "done" but the transaction was rolled back | **the customer's money is lost**; that chunk is never done |

Therefore: **the checkpoint always comes after**, and losing the checkpoint is harmless.

### A bad account must never jam the whole train

A batch hits dirty data every night: a negative balance caused by a bug, a closed account, a product code that no longer exists. If one {{IllegalArgumentException}} breaks the loop, the job stands on that exact account **forever** (the checkpoint cannot move forward) — this is called a **poisoned record**. How to handle it:

~~~java
for (String id : ids) {
    try { accrue(id, balances.get(id)); }
    catch (IllegalArgumentException bad) { failed.add(id); }   // record it, skip it, the checkpoint still advances
}
~~~

With two conditions attached: each id appears in the failure list **once** (do not spam the log 40 times when the job retries), and the failure list must be **pushed to monitoring** so a human can handle it — a batch that "succeeds 99.98%" but silently drops 2,400 accounts is an unnamed incident.

### Two nodes running the same night

Many incidents happen when node A runs slowly past 2 a.m., operations thinks the job died and clicks rerun on node B, and both sides compute interest for 05/11. The (account, day) key still saves the money, but the two nodes still **contend for resources**. Ways to prevent it: a "lease" record like {{EOD_INTEREST / 2026-11-05 / owner=nodeA / expires_at=03:30}} with a conditional UPDATE — whoever wins the lease gets to run, and when the lease expires another node may take it. Or split into **shards**: node A handles accounts whose id ends in 0–4, node B handles 5–9 — the two ranges do not overlap, so no negotiation is needed.

### The most common mistakes

- Checking "has it run?" with {{if (processedCount > 0)}} — only true within a single run, and it does not survive a restart.
- Forgetting that a batch also needs an injected **Clock**: "which day is today" decides the valueDate and decides which period this chunk belongs to.
- Using {{double}} for interest: 100,000,000 × 0.04 / 365 computed with double gives 10958.904109589042, and across 1.2 million accounts the error becomes tens of millions of dong (see lesson 1).
- Naming a method {{run()}} and then computing *and* **writing** inside it with no pure function to test — later, testing a single account requires mocking the whole DB.
- Printing the checkpoint to the log but not saving it anywhere → a restart loses it.

> Senior tip: The interview question that separates someone who has actually run a batch from someone who has only read the docs is: *"If the job dies at account number 700,000 and you only have 90 minutes before the core banking system (the bank's central accounting software) opens, what do you do?"* Answer in three steps: (1) restart it with the **same valueDate**; the job picks up after the checkpoint on its own — a cost of minutes, with no data loss; (2) verify with a count query "number of accounts that have an interest record for 05/11" divided by the total number of eligible accounts, instead of trusting the log; (3) if there is no time, finish the rest on another node over the account range **after** the first node, because the (account, day) key turns any overlap into a no-op. Stress: idempotency lives in the data layer; the checkpoint is only an optimization.

### Interview notes

**Question:** "How would you design an end-of-day interest batch for 1.2 million accounts so it can be rerun safely?"

**How to answer:** Three layers. **(1) Results carry a natural key**: every interest record stores (account, valueDate) with a UNIQUE constraint, so a second write on the same day is a no-op — this is the money-protection layer, and it holds even if you lose all job state. **(2) Checkpoint by chunk**: the job walks in batches (for example 50,000 accounts, sorted by id), commits the chunk in one transaction **together** with marking "interest accrued", and only then updates the checkpoint "last processed account"; the order must be commit first — checkpoint after, because the reverse means a crash would **lose** that chunk forever. **(3) Prevent two nodes from running at once**: a job-run/lease table per (job, day) with a conditional UPDATE, or shard by account-id ranges when you need two nodes to finish in time. Add the business details: interest by actual/365 using {{BigDecimal}} at scale 2 so small accounts are not rounded to 0 dong each day, rounded once at capitalization; accounts with dirty data are skipped and recorded in a failure list for monitoring, without jamming the checkpoint; and "which day is today" comes from an injected {{Clock}} so tests are deterministic.`,
    exercises: [
      {
        title: 'EodJob: idempotent accrue, chunked run, resumable checkpoint',
        prompt: `Write two classes that simulate part of an EOD batch using plain Java.

{{Accrual}} — computes **one day's** interest for **one account**, using the actual/365 convention:
- {{Accrual(BigDecimal annualRate)}} — {{annualRate}} is the annual rate as a decimal ({{0.04}} = 4%/year); {{null}} or negative ⇒ {{IllegalArgumentException}}.
- {{BigDecimal interestFor(BigDecimal balance)}} = {{balance}} × {{annualRate}} ÷ 365, rounded {{HALF_UP}} to **scale 2** and **returned at scale 2** (even when the result is 0 it is still {{0.00}}). {{balance}} {{null}} or negative ⇒ {{IllegalArgumentException}}.

{{EodJob}} — runs the interest-posting batch:
- {{EodJob(Accrual accrual, Clock clock)}} — "which day is today" must come from {{clock}} (the {{today()}} method is already written).
- {{boolean accrue(String account, BigDecimal balance)}} — posts interest for the **current day** to one account. Returns {{true}} if it just posted, {{false}} if this account was **already posted for this day** (a no-op, no money added). This is the (account, day) key — independent of the checkpoint.
- {{int run(Map<String, BigDecimal> balances, int maxAccounts)}} — continues from the checkpoint, examines **at most** {{maxAccounts}} accounts in **ascending id** order (every examined account counts toward {{maxAccounts}}, even if skipped because it was already posted), and returns the number of accounts **actually newly posted** in this call. An account that makes {{accrue}} throw {{IllegalArgumentException}} (dirty data) is **skipped**, its id is recorded in {{failed()}}, and the **checkpoint still advances** — the job must not jam. {{maxAccounts < 1}} ⇒ {{IllegalArgumentException}}.
- {{BigDecimal accrued(String account)}} — the total interest posted for the account (scale 2); an unknown account ⇒ {{0.00}}.
- {{String checkpoint()}} — the id of the last account examined **today**, {{null}} if nothing has been examined today.
- {{void resetCheckpoint()}} — clears today's pointer (used when the day is finished or to simulate another node that knows nothing). It does **not** erase posted results.
- {{List<String> failed()}} — today's failing ids, **each id once**, in the order they were found.
- {{boolean alreadyAccruedToday(String account)}}.

{{account}} {{null}}/empty ⇒ {{IllegalArgumentException}}.`,
        hints: [
          'The deduplication key is the pair (account, day), **not** the checkpoint. Keep a {{Map<String, LocalDate>}} "last day posted for this account" and return {{false}} when it equals today — that way {{resetCheckpoint()}} followed by rerun still adds no money a second time.',
          'In {{Accrual.interestFor}}, {{BigDecimal}} division **must** include a scale and a RoundingMode: {{divide(DAYS_IN_YEAR, 2, RoundingMode.HALF_UP)}}. Writing {{divide(DAYS_IN_YEAR)}} will throw {{ArithmeticException}} because the quotient can be non-terminating.',
          '{{run}} should: take the list of ids, {{Collections.sort}} it, then iterate and **skip every id less than or equal to the checkpoint** ({{id.compareTo(checkpoint) <= 0}}). That is exactly "continue from where it died".',
          'Update {{checkpoint = id}} **before** calling {{accrue}} and place it inside {{try/catch}}: otherwise, a dirty-data account will keep the job stuck on that exact id forever.',
          'You need two separate things: posted results (surviving a restart, used for deduplication) and today\'s pointer ({{checkpointDay}}) — when {{today()}} moves to a new day the pointer goes back to {{null}}, while the accrued totals keep accumulating.',
        ],
        explain: `The tests follow the exact order of a real incident, and each group of assertions proves one protection layer.

1. **Get the money right first.** 100,000,000 dong × 4%/year by actual/365 = 10,958.90 dong/day ({{divide}} with scale 2 + {{HALF_UP}}). A balance of 1 dong yields 0.000109589 dong/day of interest → it rounds to {{0.00}} rather than going negative or losing its sign, and the test also checks {{scale() == 2}} so the solution does not return {{0}} or {{0.000}}: the same value but a different representation will throw off reconciliation and JSON output. This is where {{BigDecimal}} differs from {{double}} — {{double}} gives 10958.904109589042, and accumulated over a million accounts that becomes a real error.

2. **Deduplication lives in the natural key.** A second {{accrue("A001", ...)}} returns {{false}} and the total **does not change**, even if the second call sends a different balance ({{999999999}}) — the {{retry_voi_so_du_khac_van_no_op}} test checks this on purpose: a batch retry often carries a fresh balance snapshot, and if you decide "it already exists so update it to the new amount" that is exactly where money gets overwritten. So a day that is already posted **must not touch the old result**; to fix it you need a reversal entry (lesson 5).

3. **The checkpoint is only an optimization.** After {{resetCheckpoint()}} — simulating a fresh node that knows nothing, or a checkpoint file wiped with temp files — {{run}} still returns **0** newly posted accounts, because layer 2 blocked it. This is the "losing the checkpoint still loses no money" condition from the Body, and it separates real idempotency from formal idempotency.

4. **Chunks and order.** With {{maxAccounts}} = 2, the calls return 2, 2, 1 and the checkpoints are A002, A004, A005 in order. The important invariant: an account is examined **exactly once per day** even if the job is called 5 times. To guarantee that you must iterate in a deterministic order ({{Collections.sort}}) — iterating over a {{HashMap}} can change order between runs and the checkpoint will then skip or redo accounts.

5. **Dirty data must not jam the train.** {{B_BAD}} sits in the middle of the list: {{run}} returns 3 (A001, A002, C003), the checkpoint reaches {{C003}}, {{failed()}} has a single element and **does not grow** on retry. If you set {{checkpoint = id}} *after* {{accrue}} succeeds, the bad account will leave the checkpoint stuck at {{A002}} and every rerun will fail at the same spot — the classic poisoning bug.

6. **The next day.** On 06/11, {{checkpoint()}} is {{null}} (the pointer belongs to the day, not to all time), {{run}} posts again and the accrued total **accumulates** to 21,917.80 — not yet capitalized into principal. That is real accrual behavior: a bank records interest payable day by day into a suspense account and only capitalizes on a schedule; if you added it to principal every day, tomorrow's balance would already be different and the actual/365 formula would be wrong.

What this lesson does **not** simulate (and something you should volunteer in an interview): real transactions, a UNIQUE constraint, and a lease between nodes. In plain code, {{lastAccruedDay}} plays the role of a record row with a UNIQUE constraint, and {{checkpoint}} plays the role of the job-run table — but in production both must live in the DB, because a dead batch process loses all in-memory state.`,
      },
    ],
    check: [
      {
        q: 'What protects the money when the batch is rerun twice on the same day?',
        options: [
          'An {{isRunning}} variable in the job\'s memory',
          'A natural key (account, day) on the result record, ideally a UNIQUE constraint in the DB',
          'A checkpoint storing the last account',
          'A "job has run" line written to a log file',
        ],
        answer: 1,
        explain: 'The checkpoint only saves rescanning work; an in-memory variable is lost on restart. Only data already written that carries the day key can block the second write',
      },
      {
        q: 'Why must you commit the chunk BEFORE updating the checkpoint?',
        options: [
          'Because writing the checkpoint is slower',
          'Because the reverse means a chunk can be marked "done" by the checkpoint while its data was never committed and will never be done again',
          'Because the checkpoint must not live in the same transaction',
          'Because the chunk needs to lock the checkpoint table',
        ],
        answer: 1,
        explain: 'Checkpoint before + crash = the chunk is skipped forever, i.e. the customer\'s money is lost. Commit before means losing the checkpoint only costs rescanning time',
      },
      {
        q: 'How should an account with dirty data (a negative balance) in the middle of the list be handled?',
        options: [
          'Stop the job and wait for an operator to fix it',
          'Throw an exception so the alerting system catches it automatically',
          'Record the id in a failure list, skip it, and let the checkpoint keep advancing',
          'Set the balance to 0 yourself and compute the interest',
        ],
        answer: 2,
        explain: 'That is a poisoned record: if the checkpoint does not advance the job stands on that id forever; silently skipping it without pushing to monitoring means 2,400 accounts lose their interest with no one knowing',
      },
      {
        q: 'Why not round interest to a whole dong every day?',
        options: [
          'Because rounding many times is slow',
          'Because small accounts would receive 0 dong every day and the total interest payable would drift; accrue keeps the fractional part and rounds once at capitalization',
          'Because VND has no unit smaller than 1 dong',
          'Because BigDecimal cannot round small numbers',
        ],
        answer: 1,
        explain: 'Accrual records an obligation, not money paid out yet; keep scale 2 and then round once at the capitalization period (the round-once-at-the-boundary principle)',
      },
    ],
  },
});
