/*
 * English translation of js/data/lessons-architecture.js — task T474. Format: js/core/i18n.js (content overlay).
 * ids: lesson-architecture-005
 */
App.i18n.content({
  'lesson-architecture-005': {
    title: 'Movie Ticket Booking: temporary seat hold, injected clock and double-booking prevention',
    goals: [
      'Finalize LLD requirements first, then draw diagrams: show, seat, hold, booking',
      'Design two-phase hold/confirm flow with expiring hold and injected clock',
      'Guarantee that when multiple threads pick the same seat, only one wins'
    ],
    body: `**Summary:** Movie ticket booking service uses a time-limited hold/confirm flow, an injected clock, and synchronized to prevent race conditions when multiple users pick the same seat.

### LLD walkthrough for movie ticket booking
Movie ticket booking is a classic LLD problem about **scarce, contended resources**: a show has only a few hundred seats, but hundreds of requests can fight for the same row within a second. In the interview, don't draw diagrams right away — clarify requirements first: a show has a grid of seats by row and column; a customer can hold multiple seats; **seats are temporarily held** for a few minutes to give the customer time to pay; if the hold expires before confirmation, the seat is automatically released back to free; and **two requests must never overwrite the same seat**. Two minutes spent clarifying requirements properly scores higher than a pretty diagram that gets the flow wrong.

### Class diagram
~~~text
Show
  |-- seatState : char[] (F free, H held, B booked)
SeatHold
  |-- holdId, userId, seatIndex, expiresAt
BookingService (one instance per show)
  |-- hold(userId, row, col) -> holdId | null
  |-- confirm(holdId) -> true when seat becomes B
  |-- cancel(holdId)  -> true when seat releases to F
  |-- state(row, col) -> status char
  |-- clock : LongSupplier  (injected clock)
~~~

### Two-phase flow: hold then confirm
**Step 1 — hold:** service checks seat is F, changes to H, generates a unique holdId and records expiresAt = current time + allowed hold time (e.g., 3 minutes in production; 60 seconds in tests). **Step 2 — confirm:** customer has paid; if the hold is still valid, seat becomes B and the hold record is removed. The third branch is cancel(holdId) which actively releases the seat back to F. This time-limited reservation pattern is very common: restaurant table booking, parking spot hold, hourly server rental.

A point interviewers often dig into: **expiresAt must be computed on an injected clock (interface LongSupplier), not by reading the system clock directly**. This lets tests fast-forward time with a controlled variable, giving 100% deterministic results without Thread.sleep. In production, the service runs a periodic sweeper that scans for expired holds to reclaim seats; in this exercise we use **lazy sweep**: before every write operation (hold, confirm, cancel, state), scan for expired holds and release seats first. The two approaches complement each other: background sweep for cleanup, lazy sweep to never miss.

### Preventing double-booking when multiple threads pick the same seat
If two threads both read state[i] == F then both write H, both would hold the seat and the customer gets "double-booked". The minimal fix: every write method is **synchronized** on the same monitor, inside is a **check-then-act** sequence: check status then change status within the same lock. This ensures no two holdIds ever point to the same seat. As the system grows, lock per show (each show one monitor) or per seat; even larger, use concurrent structures with putIfAbsent to avoid coarse locks. The line to say in the interview: **the lock must wrap both the check and the write** — locking only the write leaves the race intact.

### Edge cases to mention in the LLD session
- **Double confirm / double cancel:** a hold that has been confirmed or released is removed from the record; the second operation returns false, does not overwrite the already-sold seat.
- **Seat already B:** hold returns null, does not silently overwrite.
- **Race:** many threads race for the last free seat — only one thread wins; in tests use CountDownLatch to start 16 threads simultaneously.
- **All-or-nothing group hold:** holding multiple seats, if one seat is lost during payment the rest must be released — rollback of the reservation flow.
- **Forgotten hold:** sweep must release both seat state and holdId, not let garbage accumulate indefinitely.

### Trade-off: book now vs hold
| Approach | Pros | Cons | When to choose |
|---|---|---|---|
| Book immediately, no hold | Fewer states, easy to implement | Customer can't pay in time, seats sell out fast | Payment bundled in one step |
| Time-limited hold + confirm | Fits cart-style flow | More states, needs expiry mechanism | Ticketing, restaurants, parking |
| Optimistic lock (version) | Scales well, less waiting | Retry on high contention | Resources relatively abundant, contention low |

### SOLID applied
- **SRP:** BookingService only manages seat state; pricing and ticket issuance belong to other services.
- **DIP:** clock is injected via interface LongSupplier; service doesn't depend on system clock so test and production share the same logic.
- **OCP:** adding a different hold policy (VIP hold longer) is a new parameter/strategy, no change to check-then-act logic.

### Interview follow-ups
Prepare for "server crashes between hold and confirm?": hold state needs persistence (SQL row with expiresAt) and a background sweeper that auto-reclaims after restart; since hold is a time-limited contract, no distributed transaction needed, just scan rows past expiry. Scale question: shard by show so all operations on one show route to the same partition — lock never crosses node boundary.

> Senior tip: in a real ticketing project I once saw a "ghost seat" bug: seat showed as free but couldn't be booked, because a stale hold record sat in cache and hadn't been reclaimed. Since then I always enforce "temporary state must have TTL at every storage layer": in Redis it's EXPIRE, in DB it's cron DELETE WHERE expiresAt < now(), in service it's lazy sweep. Three layers, same rule, no room for ghost seats.`,
    exercises: [
      {
        title: 'BookingService: time-limited hold, confirm/cancel and race test',
        prompt: `Complete the {{BookingService}} class for a show with a {{rows}} x {{cols}} seat grid.

Standard flow:
- {{hold(userId, row, col)}}: if coordinates are valid and seat is {{F}}, hold the seat (becomes {{H}}), return a new holdId; otherwise return {{null}}. Hold expires after {{holdMillis}} milliseconds (injected via constructor along with LongSupplier).
- {{confirm(holdId)}}: if hold is still valid, seat becomes {{B}}, return {{true}}; if hold doesn't exist or has expired, return {{false}} and seat must be released to {{F}}.
- {{cancel(holdId)}}: if hold is still valid, seat returns to {{F}}, return {{true}}; otherwise {{false}}.
- {{state(row, col)}}: returns current status char; out-of-bounds coordinates return {{'.'}}.

Requirements:
- Before each operation, scan for expired holds (lazy sweep) and release corresponding seats.
- All write methods must be safe when called concurrently by multiple threads: 16 threads trying to hold the same seat results in exactly one successful holdId.
- Clock is only read via {{LongSupplier.getAsLong()}} — no system clock usage.`,
        hints: [
          'Use a 1D char array for seat state, and a map from holdId to seat index plus expiry time.',
          'Call sweepExpired at the start of each method so expired holds auto-release before new checks.',
          'Mark check-then-act sections with synchronized so 16 threads cannot hold the same seat.',
        ],
        explain: `The hardest part of this exercise isn't managing the seat array, but that **the hold and the time must live inside the same lock**: every write method wrapped in synchronized; confirm uses the holdId record to find the exact seat to book; lazy sweep runs before each operation so expired holds don't block others. Common mistakes: (1) computing expiresAt with system clock — tests will always fail because real clock can't be fast-forwarded; (2) lock doesn't cover the check — race still happens; (3) allowing confirm/cancel on already-removed holds — must return false, not overwrite.`,
      },
    ],
    check: [
      {
        q: 'Why must expiresAt use an injected clock instead of reading the system clock directly?',
        options: [
          'To make code shorter',
          'So tests can fast-forward time and verify deterministically, without depending on the real clock',
          'To avoid using interfaces',
          'To make seat booking faster',
        ],
        answer: 1,
        explain: `Injected clock lets tests control time with a variable; hold/confirm/cancel results are always deterministic, no Thread.sleep needed.`,
      },
      {
        q: 'What risk arises if the lock only wraps the seat state write but not the check?',
        options: [
          'Seat is always held for 2 seconds',
          'Race still exists: two threads both see seat FREE then both write HELD',
          'Hold always expires',
          'No risk',
        ],
        answer: 1,
        explain: `Check-then-act must be inside the same lock; if the lock scope is too narrow, two threads can still read the old state then both write the new one.`,
      },
      {
        q: 'When a hold expires, who is responsible for releasing the seat?',
        options: [
          'Only the user by actively canceling',
          'Background sweeper or lazy sweep before each write — both must release both seat state and holdId',
          'No need to release, seat gets reused next time',
          'Only on server restart',
        ],
        answer: 1,
        explain: `Lazy sweep before each write for small tasks; background sweeper for production systems. Both must release both seat state and holdId.`,
      },
      {
        q: 'For an all-or-nothing group hold of multiple seats, the correct rule is:',
        options: [
          'Confirm each hold separately, whoever gets lucky wins',
          'If any hold in the group expires, the entire group must be released to guarantee rollback',
          "Group doesn't need hold expiry",
          'Just keep an array of integers',
        ],
        answer: 1,
        explain: `Group reservation contract must be all-or-nothing: if one seat fails in the group, the rest must be released so the group rolls back to the initial state.`,
      },
    ],
  },
});